//! Internal FiberRoot scheduler foundation.
//!
//! This module models the React-style scheduled-root list and per-root
//! callback bookkeeping on top of HostRoot update records. It deliberately
//! stops before the render work loop: no work is rendered, committed, flushed,
//! or applied to host containers here.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{EventPriority, FiberId, Lane, Lanes, lanes_to_event_priority};
use fast_react_host_config::HostTypes;

use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, RootCallbackPriority,
    RootScheduleUpdateRecord, RootSchedulerCallbackHandle, SchedulerActQueueRequest,
    SchedulerBridge, SchedulerCallbackRequest, SchedulerCancellationRecord, SchedulerMicrotaskKind,
    SchedulerMicrotaskRequest, SchedulerPriority,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootSchedulerState {
    first_scheduled_root: Option<FiberRootId>,
    last_scheduled_root: Option<FiberRootId>,
    did_schedule_microtask: bool,
    did_schedule_microtask_act: bool,
    might_have_pending_sync_work: bool,
    is_flushing_work: bool,
    current_event_transition_lane: Lane,
}

impl RootSchedulerState {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            first_scheduled_root: None,
            last_scheduled_root: None,
            did_schedule_microtask: false,
            did_schedule_microtask_act: false,
            might_have_pending_sync_work: false,
            is_flushing_work: false,
            current_event_transition_lane: Lane::NO,
        }
    }

    #[must_use]
    pub const fn first_scheduled_root(&self) -> Option<FiberRootId> {
        self.first_scheduled_root
    }

    #[must_use]
    pub const fn last_scheduled_root(&self) -> Option<FiberRootId> {
        self.last_scheduled_root
    }

    #[must_use]
    pub const fn did_schedule_microtask(&self) -> bool {
        self.did_schedule_microtask
    }

    #[must_use]
    pub const fn did_schedule_microtask_act(&self) -> bool {
        self.did_schedule_microtask_act
    }

    #[must_use]
    pub const fn might_have_pending_sync_work(&self) -> bool {
        self.might_have_pending_sync_work
    }

    #[must_use]
    pub const fn is_flushing_work(&self) -> bool {
        self.is_flushing_work
    }

    #[must_use]
    pub const fn current_event_transition_lane(&self) -> Lane {
        self.current_event_transition_lane
    }

    pub(crate) fn set_first_scheduled_root(&mut self, root: Option<FiberRootId>) {
        self.first_scheduled_root = root;
    }

    pub(crate) fn set_last_scheduled_root(&mut self, root: Option<FiberRootId>) {
        self.last_scheduled_root = root;
    }

    pub(crate) fn mark_microtask_scheduled(&mut self) {
        self.did_schedule_microtask = true;
    }

    pub(crate) fn mark_act_microtask_scheduled(&mut self) {
        self.did_schedule_microtask_act = true;
    }

    pub(crate) fn reset_microtask_scheduled(&mut self) {
        self.did_schedule_microtask = false;
        self.did_schedule_microtask_act = false;
    }

    pub(crate) fn set_might_have_pending_sync_work(&mut self, value: bool) {
        self.might_have_pending_sync_work = value;
    }

    pub(crate) fn set_is_flushing_work(&mut self, value: bool) {
        self.is_flushing_work = value;
    }
}

impl Default for RootSchedulerState {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ScheduledRootUpdateResult {
    root: FiberRootId,
    inserted: bool,
    microtask: Option<SchedulerMicrotaskRequest>,
    act_queue_task: Option<SchedulerActQueueRequest>,
    might_have_pending_sync_work: bool,
}

impl ScheduledRootUpdateResult {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn inserted(self) -> bool {
        self.inserted
    }

    #[must_use]
    pub const fn microtask(self) -> Option<SchedulerMicrotaskRequest> {
        self.microtask
    }

    #[must_use]
    pub const fn act_queue_task(self) -> Option<SchedulerActQueueRequest> {
        self.act_queue_task
    }

    #[must_use]
    pub const fn might_have_pending_sync_work(self) -> bool {
        self.might_have_pending_sync_work
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RootTaskScheduleOutcome {
    NoWork,
    Sync,
    Scheduled,
    Reused,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootTaskScheduleRecord {
    root: FiberRootId,
    next_lanes: Lanes,
    outcome: RootTaskScheduleOutcome,
    callback_priority: RootCallbackPriority,
    callback_node: RootSchedulerCallbackHandle,
    scheduler_priority: Option<SchedulerPriority>,
    scheduled_callback: Option<SchedulerCallbackRequest>,
    scheduled_act_queue_task: Option<SchedulerActQueueRequest>,
    canceled_callback: Option<SchedulerCancellationRecord>,
}

impl RootTaskScheduleRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn next_lanes(self) -> Lanes {
        self.next_lanes
    }

    #[must_use]
    pub const fn outcome(self) -> RootTaskScheduleOutcome {
        self.outcome
    }

    #[must_use]
    pub const fn callback_priority(self) -> RootCallbackPriority {
        self.callback_priority
    }

    #[must_use]
    pub const fn callback_node(self) -> RootSchedulerCallbackHandle {
        self.callback_node
    }

    #[must_use]
    pub const fn scheduler_priority(self) -> Option<SchedulerPriority> {
        self.scheduler_priority
    }

    #[must_use]
    pub const fn scheduled_callback(self) -> Option<SchedulerCallbackRequest> {
        self.scheduled_callback
    }

    #[must_use]
    pub const fn scheduled_act_queue_task(self) -> Option<SchedulerActQueueRequest> {
        self.scheduled_act_queue_task
    }

    #[must_use]
    pub const fn canceled_callback(self) -> Option<SchedulerCancellationRecord> {
        self.canceled_callback
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootScheduleMicrotaskResult {
    records: Vec<RootTaskScheduleRecord>,
}

impl RootScheduleMicrotaskResult {
    #[must_use]
    pub fn records(&self) -> &[RootTaskScheduleRecord] {
        &self.records
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootSyncFlushPlan {
    skipped_reentrant_flush: bool,
    skipped_no_sync_work: bool,
    sync_roots: Vec<FiberRootId>,
}

impl RootSyncFlushPlan {
    #[must_use]
    pub fn sync_roots(&self) -> &[FiberRootId] {
        &self.sync_roots
    }

    #[must_use]
    pub const fn skipped_reentrant_flush(&self) -> bool {
        self.skipped_reentrant_flush
    }

    #[must_use]
    pub const fn skipped_no_sync_work(&self) -> bool {
        self.skipped_no_sync_work
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RootSchedulerError {
    FiberRootStore(FiberRootStoreError),
    ScheduleRecordWrongFiber {
        root: FiberRootId,
        expected: FiberId,
        actual: FiberId,
    },
}

impl Display for RootSchedulerError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::ScheduleRecordWrongFiber {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "schedule record for root {} references fiber slot {}, expected current HostRoot fiber slot {}",
                root.raw(),
                actual.slot().get(),
                expected.slot().get()
            ),
        }
    }
}

impl Error for RootSchedulerError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::ScheduleRecordWrongFiber { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for RootSchedulerError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

pub fn ensure_root_is_scheduled<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    record: RootScheduleUpdateRecord,
) -> Result<ScheduledRootUpdateResult, RootSchedulerError> {
    validate_schedule_record(store, record)?;

    let root_id = record.root();
    let already_scheduled = {
        let scheduler = store.root_scheduler();
        scheduler.last_scheduled_root() == Some(root_id)
            || store
                .root(root_id)?
                .scheduling()
                .next_scheduled_root()
                .is_some()
    };

    let inserted = if already_scheduled {
        false
    } else {
        append_scheduled_root(store, root_id)?;
        true
    };

    store
        .root_scheduler_mut()
        .set_might_have_pending_sync_work(true);

    let (microtask, act_queue_task) = ensure_schedule_microtask_is_scheduled(store);

    Ok(ScheduledRootUpdateResult {
        root: root_id,
        inserted,
        microtask,
        act_queue_task,
        might_have_pending_sync_work: store.root_scheduler().might_have_pending_sync_work(),
    })
}

pub fn process_root_schedule_in_microtask<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> Result<RootScheduleMicrotaskResult, RootSchedulerError> {
    store.root_scheduler_mut().reset_microtask_scheduled();
    store
        .root_scheduler_mut()
        .set_might_have_pending_sync_work(false);

    let mut records = Vec::new();
    let mut previous_root = None;
    let mut root = store.root_scheduler().first_scheduled_root();

    while let Some(root_id) = root {
        let next_root = store.root(root_id)?.scheduling().next_scheduled_root();
        let record = schedule_task_for_root_during_microtask(store, root_id)?;

        if record.next_lanes().is_empty() {
            store
                .root_mut(root_id)?
                .scheduling_mut()
                .set_next_scheduled_root(None);

            if let Some(previous_root_id) = previous_root {
                store
                    .root_mut(previous_root_id)?
                    .scheduling_mut()
                    .set_next_scheduled_root(next_root);
            } else {
                store
                    .root_scheduler_mut()
                    .set_first_scheduled_root(next_root);
            }

            if next_root.is_none() {
                store
                    .root_scheduler_mut()
                    .set_last_scheduled_root(previous_root);
            }
        } else {
            if record.next_lanes().includes_sync_lane() {
                store
                    .root_scheduler_mut()
                    .set_might_have_pending_sync_work(true);
            }
            previous_root = Some(root_id);
        }

        records.push(record);
        root = next_root;
    }

    Ok(RootScheduleMicrotaskResult { records })
}

pub fn schedule_task_for_root_during_microtask<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<RootTaskScheduleRecord, RootSchedulerError> {
    let next_lanes = next_lanes_for_root(store, root_id)?;
    let existing_callback_node = store.root(root_id)?.scheduling().callback_node();

    if next_lanes.is_empty() {
        let canceled_callback = store
            .scheduler_bridge_mut()
            .cancel_callback(existing_callback_node);
        store.root_mut(root_id)?.scheduling_mut().clear_callback();
        return Ok(RootTaskScheduleRecord {
            root: root_id,
            next_lanes,
            outcome: RootTaskScheduleOutcome::NoWork,
            callback_priority: RootCallbackPriority::NO,
            callback_node: RootSchedulerCallbackHandle::NONE,
            scheduler_priority: None,
            scheduled_callback: None,
            scheduled_act_queue_task: None,
            canceled_callback,
        });
    }

    if next_lanes.includes_sync_lane() {
        let canceled_callback = store
            .scheduler_bridge_mut()
            .cancel_callback(existing_callback_node);
        store.root_mut(root_id)?.scheduling_mut().set_callback(
            RootSchedulerCallbackHandle::NONE,
            RootCallbackPriority::new(Lane::SYNC),
        );

        return Ok(RootTaskScheduleRecord {
            root: root_id,
            next_lanes,
            outcome: RootTaskScheduleOutcome::Sync,
            callback_priority: RootCallbackPriority::new(Lane::SYNC),
            callback_node: RootSchedulerCallbackHandle::NONE,
            scheduler_priority: None,
            scheduled_callback: None,
            scheduled_act_queue_task: None,
            canceled_callback,
        });
    }

    let new_callback_priority = RootCallbackPriority::new(next_lanes.highest_priority_lane());
    let existing_callback_priority = store.root(root_id)?.scheduling().callback_priority();
    let act_queue_active = store.scheduler_bridge().is_act_queue_active();

    if new_callback_priority == existing_callback_priority
        && existing_callback_node.is_some()
        && (!act_queue_active || SchedulerBridge::is_fake_act_callback_node(existing_callback_node))
    {
        return Ok(RootTaskScheduleRecord {
            root: root_id,
            next_lanes,
            outcome: RootTaskScheduleOutcome::Reused,
            callback_priority: new_callback_priority,
            callback_node: existing_callback_node,
            scheduler_priority: Some(scheduler_priority_for_lanes(next_lanes)),
            scheduled_callback: None,
            scheduled_act_queue_task: None,
            canceled_callback: None,
        });
    }

    let canceled_callback = store
        .scheduler_bridge_mut()
        .cancel_callback(existing_callback_node);
    let scheduler_priority = scheduler_priority_for_lanes(next_lanes);

    if act_queue_active {
        let scheduled_act_queue_task = store.scheduler_bridge_mut().schedule_act_callback(
            root_id,
            scheduler_priority,
            new_callback_priority,
        );
        store
            .root_mut(root_id)?
            .scheduling_mut()
            .set_callback(scheduled_act_queue_task.node(), new_callback_priority);

        return Ok(RootTaskScheduleRecord {
            root: root_id,
            next_lanes,
            outcome: RootTaskScheduleOutcome::Scheduled,
            callback_priority: new_callback_priority,
            callback_node: scheduled_act_queue_task.node(),
            scheduler_priority: Some(scheduler_priority),
            scheduled_callback: None,
            scheduled_act_queue_task: Some(scheduled_act_queue_task),
            canceled_callback,
        });
    }

    let scheduled_callback = store.scheduler_bridge_mut().schedule_callback(
        root_id,
        scheduler_priority,
        new_callback_priority,
    );
    store
        .root_mut(root_id)?
        .scheduling_mut()
        .set_callback(scheduled_callback.node(), new_callback_priority);

    Ok(RootTaskScheduleRecord {
        root: root_id,
        next_lanes,
        outcome: RootTaskScheduleOutcome::Scheduled,
        callback_priority: new_callback_priority,
        callback_node: scheduled_callback.node(),
        scheduler_priority: Some(scheduler_priority),
        scheduled_callback: Some(scheduled_callback),
        scheduled_act_queue_task: None,
        canceled_callback,
    })
}

pub fn collect_sync_flush_plan<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> Result<RootSyncFlushPlan, RootSchedulerError> {
    if store.root_scheduler().is_flushing_work() {
        return Ok(RootSyncFlushPlan {
            skipped_reentrant_flush: true,
            skipped_no_sync_work: false,
            sync_roots: Vec::new(),
        });
    }

    if !store.root_scheduler().might_have_pending_sync_work() {
        return Ok(RootSyncFlushPlan {
            skipped_reentrant_flush: false,
            skipped_no_sync_work: true,
            sync_roots: Vec::new(),
        });
    }

    store.root_scheduler_mut().set_is_flushing_work(true);
    let sync_roots = (|| {
        let mut sync_roots = Vec::new();
        let mut root = store.root_scheduler().first_scheduled_root();
        while let Some(root_id) = root {
            let next_lanes = next_lanes_for_root(store, root_id)?;
            if next_lanes.includes_sync_lane() {
                sync_roots.push(root_id);
            }
            root = store.root(root_id)?.scheduling().next_scheduled_root();
        }
        Ok::<_, RootSchedulerError>(sync_roots)
    })();
    store.root_scheduler_mut().set_is_flushing_work(false);
    let sync_roots = sync_roots?;

    Ok(RootSyncFlushPlan {
        skipped_reentrant_flush: false,
        skipped_no_sync_work: false,
        sync_roots,
    })
}

pub fn scheduled_roots<H: HostTypes>(
    store: &FiberRootStore<H>,
) -> Result<Vec<FiberRootId>, RootSchedulerError> {
    let mut roots = Vec::new();
    let mut root = store.root_scheduler().first_scheduled_root();
    while let Some(root_id) = root {
        roots.push(root_id);
        root = store.root(root_id)?.scheduling().next_scheduled_root();
    }
    Ok(roots)
}

fn validate_schedule_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    record: RootScheduleUpdateRecord,
) -> Result<(), RootSchedulerError> {
    let root = store.root(record.root())?;
    let current = root.current();
    if record.fiber() != current {
        return Err(RootSchedulerError::ScheduleRecordWrongFiber {
            root: record.root(),
            expected: current,
            actual: record.fiber(),
        });
    }
    Ok(())
}

fn append_scheduled_root<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<(), RootSchedulerError> {
    let last_root = store.root_scheduler().last_scheduled_root();
    if let Some(last_root_id) = last_root {
        store
            .root_mut(last_root_id)?
            .scheduling_mut()
            .set_next_scheduled_root(Some(root_id));
        store
            .root_scheduler_mut()
            .set_last_scheduled_root(Some(root_id));
    } else {
        store
            .root_scheduler_mut()
            .set_first_scheduled_root(Some(root_id));
        store
            .root_scheduler_mut()
            .set_last_scheduled_root(Some(root_id));
    }
    Ok(())
}

fn ensure_schedule_microtask_is_scheduled<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> (
    Option<SchedulerMicrotaskRequest>,
    Option<SchedulerActQueueRequest>,
) {
    if store.scheduler_bridge().is_act_queue_active() {
        if store.root_scheduler().did_schedule_microtask_act() {
            return (None, None);
        }

        store.root_scheduler_mut().mark_act_microtask_scheduled();
        return (
            None,
            Some(
                store
                    .scheduler_bridge_mut()
                    .request_act_root_schedule_task(),
            ),
        );
    }

    if store.root_scheduler().did_schedule_microtask() {
        return (None, None);
    }

    store.root_scheduler_mut().mark_microtask_scheduled();
    (
        Some(
            store
                .scheduler_bridge_mut()
                .request_microtask(SchedulerMicrotaskKind::RootSchedule),
        ),
        None,
    )
}

fn next_lanes_for_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<Lanes, RootSchedulerError> {
    let root = store.root(root_id)?;
    let next_lanes = root.lanes().highest_priority_pending_lanes();
    Ok(root.lanes().entangled_lanes_for(next_lanes))
}

fn scheduler_priority_for_lanes(lanes: Lanes) -> SchedulerPriority {
    match lanes_to_event_priority(lanes) {
        EventPriority::DISCRETE | EventPriority::CONTINUOUS => SchedulerPriority::UserBlocking,
        EventPriority::IDLE => SchedulerPriority::Idle,
        EventPriority::DEFAULT | EventPriority::NO => SchedulerPriority::Normal,
        _ => SchedulerPriority::Normal,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{RootElementHandle, update_container, update_container_sync};
    use crate::{RootOptions, SchedulerActQueueTaskKind};
    use fast_react_core::RootFinishedLanes;

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id, host)
    }

    fn schedule_default_update(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> ScheduledRootUpdateResult {
        let result =
            update_container(store, root_id, RootElementHandle::from_raw(1), None).unwrap();
        ensure_root_is_scheduled(store, result.schedule()).unwrap()
    }

    fn activate_act_queue(store: &mut FiberRootStore<RecordingHost>) {
        store.scheduler_bridge_mut().set_act_queue_active(true);
    }

    #[test]
    fn root_scheduler_inserts_first_scheduled_root_and_requests_microtask() {
        let (mut store, root_id, _host) = root_store();

        let scheduled = schedule_default_update(&mut store, root_id);

        assert_eq!(scheduled.root(), root_id);
        assert!(scheduled.inserted());
        assert!(scheduled.microtask().is_some());
        assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
        assert_eq!(store.root_scheduler().first_scheduled_root(), Some(root_id));
        assert_eq!(store.root_scheduler().last_scheduled_root(), Some(root_id));
        assert!(store.root_scheduler().did_schedule_microtask());
        assert!(!store.root_scheduler().did_schedule_microtask_act());
        assert_eq!(store.scheduler_bridge().microtask_requests().len(), 1);
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    }

    #[test]
    fn root_scheduler_dedupes_same_root_schedule_entries() {
        let (mut store, root_id, _host) = root_store();

        let first = schedule_default_update(&mut store, root_id);
        let second = schedule_default_update(&mut store, root_id);

        assert!(first.inserted());
        assert!(!second.inserted());
        assert_eq!(second.microtask(), None);
        assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
        assert_eq!(store.scheduler_bridge().microtask_requests().len(), 1);
    }

    #[test]
    fn root_scheduler_routes_root_schedule_tasks_to_act_queue() {
        let (mut store, root_id, _host) = root_store();
        activate_act_queue(&mut store);

        let first = schedule_default_update(&mut store, root_id);
        let second = schedule_default_update(&mut store, root_id);

        let act_task = first.act_queue_task().unwrap();
        assert_eq!(first.microtask(), None);
        assert_eq!(second.act_queue_task(), None);
        assert_eq!(act_task.kind(), SchedulerActQueueTaskKind::RootSchedule);
        assert_eq!(act_task.node(), RootSchedulerCallbackHandle::NONE);
        assert!(store.root_scheduler().did_schedule_microtask_act());
        assert!(!store.root_scheduler().did_schedule_microtask());
        assert!(store.scheduler_bridge().microtask_requests().is_empty());
        assert_eq!(store.scheduler_bridge().act_queue_requests(), &[act_task]);
    }

    #[test]
    fn root_scheduler_preserves_multiple_root_insertion_order() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let first = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let third = store
            .create_client_root(FakeContainer::new(3), RootOptions::new())
            .unwrap();

        schedule_default_update(&mut store, first);
        schedule_default_update(&mut store, second);
        schedule_default_update(&mut store, third);

        assert_eq!(scheduled_roots(&store).unwrap(), vec![first, second, third]);
        assert_eq!(
            store
                .root(first)
                .unwrap()
                .scheduling()
                .next_scheduled_root(),
            Some(second)
        );
        assert_eq!(
            store
                .root(second)
                .unwrap()
                .scheduling()
                .next_scheduled_root(),
            Some(third)
        );
        assert_eq!(store.root_scheduler().last_scheduled_root(), Some(third));
    }

    #[test]
    fn root_scheduler_sync_lane_marks_possible_sync_work_and_bypasses_async_callback() {
        let (mut store, root_id, _host) = root_store();
        let result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        let scheduled = ensure_root_is_scheduled(&mut store, result.schedule()).unwrap();

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert!(scheduled.might_have_pending_sync_work());
        assert!(store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(processed.records().len(), 1);
        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Sync
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .callback_priority(),
            RootCallbackPriority::new(Lane::SYNC)
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
    }

    #[test]
    fn root_scheduler_non_sync_lane_requests_bridge_callback() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        assert_eq!(
            processed.records()[0].scheduler_priority(),
            Some(SchedulerPriority::Normal)
        );
        assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
        assert_eq!(
            store.scheduler_bridge().callback_requests()[0].root(),
            root_id
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            store.scheduler_bridge().callback_requests()[0].node()
        );
        assert!(processed.records()[0].scheduled_act_queue_task().is_none());
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    }

    #[test]
    fn root_scheduler_non_sync_lane_routes_callback_to_act_queue() {
        let (mut store, root_id, _host) = root_store();
        activate_act_queue(&mut store);
        schedule_default_update(&mut store, root_id);

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        let act_callback = processed.records()[0].scheduled_act_queue_task().unwrap();
        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        assert_eq!(
            processed.records()[0].callback_node(),
            SchedulerBridge::fake_act_callback_node()
        );
        assert_eq!(
            act_callback.kind(),
            SchedulerActQueueTaskKind::RenderCallback
        );
        assert_eq!(act_callback.root(), Some(root_id));
        assert_eq!(
            act_callback.scheduler_priority(),
            Some(SchedulerPriority::Normal)
        );
        assert_eq!(
            act_callback.node(),
            SchedulerBridge::fake_act_callback_node()
        );
        assert!(processed.records()[0].scheduled_callback().is_none());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            SchedulerBridge::fake_act_callback_node()
        );
        assert_eq!(store.scheduler_bridge().act_queue_requests().len(), 2);
        assert_eq!(
            store.scheduler_bridge().act_queue_requests()[0].kind(),
            SchedulerActQueueTaskKind::RootSchedule
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_requests()[1],
            act_callback
        );
    }

    #[test]
    fn root_scheduler_reuses_equal_priority_callback() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let original_node = store.root(root_id).unwrap().scheduling().callback_node();

        schedule_default_update(&mut store, root_id);
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Reused
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            original_node
        );
        assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
        assert!(store.scheduler_bridge().cancellation_records().is_empty());
    }

    #[test]
    fn root_scheduler_act_queue_cancels_real_callback_before_rerouting() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let original_node = store.root(root_id).unwrap().scheduling().callback_node();

        activate_act_queue(&mut store);
        schedule_default_update(&mut store, root_id);
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        let record = processed.records()[0];
        assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
        assert_eq!(record.canceled_callback().unwrap().node(), original_node);
        assert!(record.scheduled_callback().is_none());
        assert!(record.scheduled_act_queue_task().is_some());
        assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
        assert_eq!(store.scheduler_bridge().cancellation_records().len(), 1);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            SchedulerBridge::fake_act_callback_node()
        );
    }

    #[test]
    fn root_scheduler_canceling_fake_act_callback_is_noop() {
        let (mut store, root_id, _host) = root_store();
        activate_act_queue(&mut store);
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();

        let sync_result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Sync
        );
        assert_eq!(processed.records()[0].canceled_callback(), None);
        assert!(store.scheduler_bridge().cancellation_records().is_empty());
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
    }

    #[test]
    fn root_scheduler_priority_change_cancels_stale_callback_and_replaces_after_sync_clears() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let original_node = store.root(root_id).unwrap().scheduling().callback_node();

        let sync_result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
        let sync_processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(
            sync_processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Sync
        );
        assert_eq!(
            sync_processed.records()[0]
                .canceled_callback()
                .unwrap()
                .node(),
            original_node
        );
        assert_eq!(store.scheduler_bridge().cancellation_records().len(), 1);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            RootSchedulerCallbackHandle::NONE
        );

        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_finished(RootFinishedLanes::new(Lanes::SYNC, Lanes::NO));
        let replacement = schedule_default_update(&mut store, root_id);
        let replacement_processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert!(!replacement.inserted());
        assert_eq!(
            replacement_processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        assert_eq!(store.scheduler_bridge().callback_requests().len(), 2);
        assert_ne!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            original_node
        );
    }

    #[test]
    fn root_scheduler_no_render_commit_or_host_mutation_side_effects() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();

        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_act_routing_has_no_render_commit_or_host_mutation_side_effects() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        activate_act_queue(&mut store);

        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
    }

    #[test]
    fn root_scheduler_sync_flush_plan_uses_fast_path_and_reentry_guard() {
        let (mut store, root_id, _host) = root_store();

        let empty_plan = collect_sync_flush_plan(&mut store).unwrap();

        assert!(empty_plan.skipped_no_sync_work());
        assert!(!empty_plan.skipped_reentrant_flush());
        assert!(empty_plan.sync_roots().is_empty());

        let result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        ensure_root_is_scheduled(&mut store, result.schedule()).unwrap();

        let sync_plan = collect_sync_flush_plan(&mut store).unwrap();

        assert_eq!(sync_plan.sync_roots(), &[root_id]);
        assert!(!store.root_scheduler().is_flushing_work());

        store.root_scheduler_mut().set_is_flushing_work(true);
        let reentrant_plan = collect_sync_flush_plan(&mut store).unwrap();
        store.root_scheduler_mut().set_is_flushing_work(false);

        assert!(reentrant_plan.skipped_reentrant_flush());
        assert!(reentrant_plan.sync_roots().is_empty());
    }
}
