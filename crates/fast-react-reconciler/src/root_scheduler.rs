//! Internal FiberRoot scheduler foundation.
//!
//! This module models the React-style scheduled-root list and per-root
//! callback bookkeeping on top of HostRoot update records. Most scheduler
//! helpers remain planning-only; the sync-flush record path may render HostRoot
//! lanes for a later commit handoff, but it still does not commit, flush host
//! effects, or apply host containers.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    EventPriority, FiberId, Lane, Lanes, RootLaneState, lanes_to_event_priority,
};
use fast_react_host_config::HostTypes;

use crate::root_commit::PendingPassiveCommitHandoff;
use crate::scheduler_bridge::SchedulerActContinuationRecord;
use crate::{
    ExecutionContextState, FiberRootId, FiberRootStore, FiberRootStoreError,
    HostRootRenderPhaseRecord, RootCallbackPriority, RootScheduleUpdateRecord,
    RootSchedulerCallbackHandle, RootWorkLoopError, SchedulerActQueueRequest, SchedulerBridge,
    SchedulerCallbackRequest, SchedulerCallbackValidationRecord, SchedulerCancellationRecord,
    SchedulerMicrotaskKind, SchedulerMicrotaskRequest, SchedulerPriority,
    SyncFlushExecutionContextRecord, render_host_root_for_lanes,
    render_host_root_via_scheduler_callback, validate_scheduled_host_root_callback,
};

pub(crate) const SYNC_FLUSH_LANES: Lanes = Lanes::SYNC_HYDRATION.merge(Lanes::SYNC);

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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct RootLaneSelection {
    priority_lanes: Lanes,
    render_lanes: Lanes,
}

impl RootLaneSelection {
    #[must_use]
    const fn no_work() -> Self {
        Self {
            priority_lanes: Lanes::NO,
            render_lanes: Lanes::NO,
        }
    }

    #[must_use]
    const fn priority_lanes(self) -> Lanes {
        self.priority_lanes
    }

    #[must_use]
    const fn render_lanes(self) -> Lanes {
        self.render_lanes
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RootSchedulerCallbackExecutionStatus {
    StaleCallback,
    NoWork,
    Rendered,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootSchedulerCallbackExecutionRecord {
    callback: SchedulerCallbackRequest,
    validation: SchedulerCallbackValidationRecord,
    selected_lanes: Lanes,
    status: RootSchedulerCallbackExecutionStatus,
    render_phase: Option<HostRootRenderPhaseRecord>,
}

impl RootSchedulerCallbackExecutionRecord {
    #[must_use]
    pub const fn callback(self) -> SchedulerCallbackRequest {
        self.callback
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.callback.root()
    }

    #[must_use]
    pub const fn callback_node(self) -> RootSchedulerCallbackHandle {
        self.callback.node()
    }

    #[must_use]
    pub const fn validation(self) -> SchedulerCallbackValidationRecord {
        self.validation
    }

    #[must_use]
    pub const fn selected_lanes(self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub const fn status(self) -> RootSchedulerCallbackExecutionStatus {
        self.status
    }

    #[must_use]
    pub const fn render_phase(self) -> Option<HostRootRenderPhaseRecord> {
        self.render_phase
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RootSyncFlushExitStatus {
    BlockedByExecutionContext,
    SkippedReentrantFlush,
    SkippedNoPendingSyncWork,
    Completed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RootSyncFlushRecordStatus {
    RenderedAwaitingCommit,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootSyncFlushRecord {
    order: usize,
    root: FiberRootId,
    lanes: Lanes,
    status: RootSyncFlushRecordStatus,
    render_phase: HostRootRenderPhaseRecord,
}

impl RootSyncFlushRecord {
    #[must_use]
    pub const fn order(self) -> usize {
        self.order
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub const fn status(self) -> RootSyncFlushRecordStatus {
        self.status
    }

    #[must_use]
    pub const fn render_phase(self) -> HostRootRenderPhaseRecord {
        self.render_phase
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushActPostPassiveContinuationGateRecord {
    root: FiberRootId,
    sync_flush_order: usize,
    flushed_lanes: Lanes,
    remaining_lanes: Lanes,
    continuation_lanes: Lanes,
    pending_passive_finished_work: FiberId,
    pending_passive_lanes: Lanes,
    pending_passive_unmount_count: usize,
    pending_passive_mount_count: usize,
    act_scope_depth: usize,
    nested_act_scope: bool,
}

#[allow(
    dead_code,
    reason = "crate-private post-passive act continuation gate metadata for future act workers"
)]
impl SyncFlushActPostPassiveContinuationGateRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn sync_flush_order(self) -> usize {
        self.sync_flush_order
    }

    #[must_use]
    pub(crate) const fn flushed_lanes(self) -> Lanes {
        self.flushed_lanes
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub(crate) const fn continuation_lanes(self) -> Lanes {
        self.continuation_lanes
    }

    #[must_use]
    pub(crate) const fn pending_passive_finished_work(self) -> FiberId {
        self.pending_passive_finished_work
    }

    #[must_use]
    pub(crate) const fn pending_passive_lanes(self) -> Lanes {
        self.pending_passive_lanes
    }

    #[must_use]
    pub(crate) const fn pending_passive_unmount_count(self) -> usize {
        self.pending_passive_unmount_count
    }

    #[must_use]
    pub(crate) const fn pending_passive_mount_count(self) -> usize {
        self.pending_passive_mount_count
    }

    #[must_use]
    pub(crate) const fn pending_passive_record_count(self) -> usize {
        self.pending_passive_unmount_count + self.pending_passive_mount_count
    }

    #[must_use]
    pub(crate) const fn act_scope_depth(self) -> usize {
        self.act_scope_depth
    }

    #[must_use]
    pub(crate) const fn nested_act_scope(self) -> bool {
        self.nested_act_scope
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootSyncFlushResult {
    execution_context: SyncFlushExecutionContextRecord,
    exit_status: RootSyncFlushExitStatus,
    records: Vec<RootSyncFlushRecord>,
}

impl RootSyncFlushResult {
    #[must_use]
    pub const fn execution_context(&self) -> SyncFlushExecutionContextRecord {
        self.execution_context
    }

    #[must_use]
    pub const fn exit_status(&self) -> RootSyncFlushExitStatus {
        self.exit_status
    }

    #[must_use]
    pub fn records(&self) -> &[RootSyncFlushRecord] {
        &self.records
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RootSchedulerError {
    FiberRootStore(FiberRootStoreError),
    RootWorkLoop(RootWorkLoopError),
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
            Self::RootWorkLoop(error) => Display::fmt(error, formatter),
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
            Self::RootWorkLoop(error) => Some(error),
            Self::ScheduleRecordWrongFiber { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for RootSchedulerError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<RootWorkLoopError> for RootSchedulerError {
    fn from(error: RootWorkLoopError) -> Self {
        Self::RootWorkLoop(error)
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
    let lane_selection = select_lanes_for_scheduled_task(store, root_id)?;
    let next_lanes = lane_selection.render_lanes();
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

    if lane_selection.priority_lanes().includes_sync_lane()
        && !root_is_prerendering(store, root_id, lane_selection.priority_lanes())?
    {
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

    let new_callback_priority =
        RootCallbackPriority::new(lane_selection.priority_lanes().highest_priority_lane());
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
            scheduler_priority: Some(scheduler_priority_for_lanes(
                lane_selection.priority_lanes(),
            )),
            scheduled_callback: None,
            scheduled_act_queue_task: None,
            canceled_callback: None,
        });
    }

    let canceled_callback = store
        .scheduler_bridge_mut()
        .cancel_callback(existing_callback_node);
    let scheduler_priority = scheduler_priority_for_lanes(lane_selection.priority_lanes());

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

pub fn execute_scheduled_root_callback<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    callback: SchedulerCallbackRequest,
) -> Result<RootSchedulerCallbackExecutionRecord, RootSchedulerError> {
    let validation =
        validate_scheduled_host_root_callback(store, callback.root(), callback.node())?;
    if validation.is_stale() {
        return Ok(RootSchedulerCallbackExecutionRecord {
            callback,
            validation,
            selected_lanes: Lanes::NO,
            status: RootSchedulerCallbackExecutionStatus::StaleCallback,
            render_phase: None,
        });
    }

    let selected_lanes = select_lanes_for_scheduled_task(store, callback.root())?.render_lanes();
    if selected_lanes.is_empty() {
        store
            .root_mut(callback.root())?
            .scheduling_mut()
            .clear_callback();
        return Ok(RootSchedulerCallbackExecutionRecord {
            callback,
            validation,
            selected_lanes,
            status: RootSchedulerCallbackExecutionStatus::NoWork,
            render_phase: None,
        });
    }

    let render_result = render_host_root_via_scheduler_callback(
        store,
        callback.root(),
        callback.node(),
        selected_lanes,
    )?;
    let render_phase = render_result.render_phase();
    let status = if render_phase.is_some() {
        RootSchedulerCallbackExecutionStatus::Rendered
    } else {
        RootSchedulerCallbackExecutionStatus::StaleCallback
    };

    Ok(RootSchedulerCallbackExecutionRecord {
        callback,
        validation: render_result.validation(),
        selected_lanes,
        status,
        render_phase,
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
            if sync_flush_lanes_for_root(store, root_id)?.is_non_empty() {
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

pub(crate) fn sync_flush_lanes_for_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<Lanes, RootSchedulerError> {
    Ok(next_lanes_for_root(store, root_id)?.intersect(SYNC_FLUSH_LANES))
}

pub(crate) fn recompute_might_have_pending_sync_work<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> Result<bool, RootSchedulerError> {
    let mut has_pending_sync_work = false;
    let mut root = store.root_scheduler().first_scheduled_root();
    while let Some(root_id) = root {
        if sync_flush_lanes_for_root(store, root_id)?.is_non_empty() {
            has_pending_sync_work = true;
            break;
        }
        root = store.root(root_id)?.scheduling().next_scheduled_root();
    }

    store
        .root_scheduler_mut()
        .set_might_have_pending_sync_work(has_pending_sync_work);
    Ok(has_pending_sync_work)
}

pub(crate) fn sync_flush_act_continuation_lanes_for_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<Lanes, RootSchedulerError> {
    Ok(select_lanes_for_scheduled_task(store, root_id)?.render_lanes())
}

pub(crate) fn sync_flush_act_post_passive_continuation_gate(
    act_continuation: Option<SchedulerActContinuationRecord>,
    pending_passive_handoff: Option<PendingPassiveCommitHandoff>,
) -> Option<SyncFlushActPostPassiveContinuationGateRecord> {
    let (Some(act_continuation), Some(pending_passive_handoff)) =
        (act_continuation, pending_passive_handoff)
    else {
        return None;
    };

    Some(SyncFlushActPostPassiveContinuationGateRecord {
        root: act_continuation.root(),
        sync_flush_order: act_continuation.sync_flush_order(),
        flushed_lanes: act_continuation.flushed_lanes(),
        remaining_lanes: act_continuation.remaining_lanes(),
        continuation_lanes: act_continuation.continuation_lanes(),
        pending_passive_finished_work: pending_passive_handoff.finished_work(),
        pending_passive_lanes: pending_passive_handoff.lanes(),
        pending_passive_unmount_count: pending_passive_handoff.pending_unmount_count(),
        pending_passive_mount_count: pending_passive_handoff.pending_mount_count(),
        act_scope_depth: act_continuation.act_scope_depth(),
        nested_act_scope: act_continuation.nested_act_scope(),
    })
}

/// Prepare all currently scheduled sync roots for a later commit handoff.
///
/// This is the first data-producing foundation for React's
/// `flushSyncWorkOnAllRoots`: it checks execution-context and scheduler
/// reentry guards, traverses the scheduled-root list in insertion order, and
/// renders each sync HostRoot lane into a deterministic record. It deliberately
/// stops before the commit worker's responsibilities: no lane is marked
/// finished, `root.current` is not switched, and host mutation APIs are not
/// called.
pub fn flush_sync_work_on_all_roots<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    execution_context: &ExecutionContextState,
) -> Result<RootSyncFlushResult, RootSchedulerError> {
    let execution_context_record = execution_context.sync_flush_record();
    if !execution_context_record.can_enter_sync_flush() {
        return Ok(RootSyncFlushResult {
            execution_context: execution_context_record,
            exit_status: RootSyncFlushExitStatus::BlockedByExecutionContext,
            records: Vec::new(),
        });
    }

    if store.root_scheduler().is_flushing_work() {
        return Ok(RootSyncFlushResult {
            execution_context: execution_context_record,
            exit_status: RootSyncFlushExitStatus::SkippedReentrantFlush,
            records: Vec::new(),
        });
    }

    if !store.root_scheduler().might_have_pending_sync_work() {
        return Ok(RootSyncFlushResult {
            execution_context: execution_context_record,
            exit_status: RootSyncFlushExitStatus::SkippedNoPendingSyncWork,
            records: Vec::new(),
        });
    }

    store.root_scheduler_mut().set_is_flushing_work(true);
    let records = (|| {
        let mut records = Vec::new();
        let mut root = store.root_scheduler().first_scheduled_root();

        while let Some(root_id) = root {
            let next_root = store.root(root_id)?.scheduling().next_scheduled_root();
            let next_lanes = sync_flush_lanes_for_root(store, root_id)?;

            if next_lanes.is_non_empty() {
                let render_phase = render_host_root_for_lanes(store, root_id, next_lanes)?;
                records.push(RootSyncFlushRecord {
                    order: records.len(),
                    root: root_id,
                    lanes: next_lanes,
                    status: RootSyncFlushRecordStatus::RenderedAwaitingCommit,
                    render_phase,
                });
            }

            root = next_root;
        }

        Ok::<_, RootSchedulerError>(records)
    })();
    store.root_scheduler_mut().set_is_flushing_work(false);
    let records = records?;

    Ok(RootSyncFlushResult {
        execution_context: execution_context_record,
        exit_status: RootSyncFlushExitStatus::Completed,
        records,
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

fn select_lanes_for_scheduled_task<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<RootLaneSelection, RootSchedulerError> {
    let root = store.root(root_id)?;
    let wip_lanes = if root.scheduling().work_in_progress().is_some() {
        root.scheduling().work_in_progress_root_render_lanes()
    } else {
        Lanes::NO
    };
    Ok(select_lanes_from_root_state(
        root.lanes(),
        wip_lanes,
        root_has_pending_commit(store, root_id)?,
    ))
}

fn select_lanes_from_root_state(
    root_lanes: &RootLaneState,
    wip_lanes: Lanes,
    root_has_pending_commit: bool,
) -> RootLaneSelection {
    let priority_lanes = root_lanes.get_next_lanes(wip_lanes, root_has_pending_commit);
    if priority_lanes.is_empty() {
        return RootLaneSelection::no_work();
    }

    RootLaneSelection {
        priority_lanes,
        render_lanes: root_lanes.entangled_lanes_for(priority_lanes),
    }
}

fn root_has_pending_commit<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<bool, RootSchedulerError> {
    let root = store.root(root_id)?;
    Ok(root.pending_commit().is_some()
        || root.scheduling().cancel_pending_commit().is_some()
        || root.scheduling().timeout_handle().is_some())
}

fn root_is_prerendering<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    render_lanes: Lanes,
) -> Result<bool, RootSchedulerError> {
    Ok(store
        .root(root_id)?
        .lanes()
        .check_if_root_is_prerendering(render_lanes))
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
    use crate::RootOptions;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{
        RootElementHandle, SchedulerActQueueTaskKind, commit_finished_host_root, update_container,
        update_container_sync,
    };
    use fast_react_core::{Lanes, RootFinishedLanes, RootLaneState};

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

    fn scheduled_callback_request(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> SchedulerCallbackRequest {
        schedule_default_update(store, root_id);
        let processed = process_root_schedule_in_microtask(store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        store.scheduler_bridge().callback_requests()[0]
    }

    fn mark_default_suspended_with_pending_transition(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) {
        let lanes = store.root_mut(root_id).unwrap().lanes_mut();
        lanes.mark_updated(Lane::TRANSITION_1);
        lanes.mark_suspended(Lanes::DEFAULT, Lane::NO, true);
    }

    fn schedule_sync_update(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        element: RootElementHandle,
    ) -> ScheduledRootUpdateResult {
        let result = update_container_sync(store, root_id, element, None).unwrap();
        ensure_root_is_scheduled(store, result.schedule()).unwrap()
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
    fn root_scheduler_suspended_unpinged_warm_lanes_do_not_schedule_async_callback() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_suspended(Lanes::DEFAULT, Lane::NO, true);

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(processed.records().len(), 1);
        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::NoWork
        );
        assert_eq!(processed.records()[0].next_lanes(), Lanes::NO);
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(scheduled_roots(&store).unwrap(), Vec::<FiberRootId>::new());
    }

    #[test]
    fn root_scheduler_pinged_suspended_lanes_schedule_async_callback() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        {
            let lanes = store.root_mut(root_id).unwrap().lanes_mut();
            lanes.mark_suspended(Lanes::DEFAULT, Lane::NO, true);
            lanes.mark_pinged(Lanes::DEFAULT);
        }

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        assert_eq!(processed.records()[0].next_lanes(), Lanes::DEFAULT);
        assert_eq!(
            processed.records()[0].scheduler_priority(),
            Some(SchedulerPriority::Normal)
        );
        assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
        assert_eq!(
            store.scheduler_bridge().callback_requests()[0].root(),
            root_id
        );
    }

    #[test]
    fn root_scheduler_pinged_retry_lane_schedules_deterministic_callback_metadata() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        let retry_lanes = Lanes::from(Lane::RETRY_1).merge_lane(Lane::RETRY_2);
        let retry_and_offscreen = retry_lanes.merge(Lanes::OFFSCREEN);
        {
            let lanes = store.root_mut(root_id).unwrap().lanes_mut();
            lanes.mark_updated(Lane::RETRY_1);
            lanes.mark_updated(Lane::RETRY_2);
            lanes.mark_updated(Lane::OFFSCREEN);
            lanes.mark_finished(RootFinishedLanes::new(Lanes::DEFAULT, retry_and_offscreen));
            lanes.mark_suspended(retry_and_offscreen, Lane::NO, true);
            lanes.mark_pinged(Lanes::from(Lane::RETRY_2));
        }

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let record = processed.records()[0];
        let scheduled_callback = record.scheduled_callback().unwrap();

        assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
        assert_eq!(record.next_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(
            record.callback_priority(),
            RootCallbackPriority::new(Lane::RETRY_2)
        );
        assert_eq!(record.callback_node(), scheduled_callback.node());
        assert_eq!(record.scheduler_priority(), Some(SchedulerPriority::Normal));
        assert_eq!(record.scheduled_act_queue_task(), None);
        assert_eq!(record.canceled_callback(), None);
        assert_eq!(scheduled_callback.root(), root_id);
        assert_eq!(
            scheduled_callback.callback_priority(),
            RootCallbackPriority::new(Lane::RETRY_2)
        );
        assert_eq!(
            scheduled_callback.scheduler_priority(),
            SchedulerPriority::Normal
        );
        assert_eq!(
            store.scheduler_bridge().callback_requests(),
            &[scheduled_callback]
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            scheduled_callback.node()
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .callback_priority(),
            RootCallbackPriority::new(Lane::RETRY_2)
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            retry_and_offscreen
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().suspended_lanes(),
            retry_and_offscreen
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pinged_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().warm_lanes(),
            Lanes::from(Lane::RETRY_1).merge(Lanes::OFFSCREEN)
        );
        assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_prewarm_lane_selection_fails_closed_with_pending_commit() {
        let mut root_lanes = RootLaneState::new();
        root_lanes.mark_updated(Lane::DEFAULT);
        root_lanes.mark_suspended(Lanes::DEFAULT, Lane::NO, false);

        let without_pending_commit = select_lanes_from_root_state(&root_lanes, Lanes::NO, false);
        let with_pending_commit = select_lanes_from_root_state(&root_lanes, Lanes::NO, true);

        assert_eq!(without_pending_commit.priority_lanes(), Lanes::DEFAULT);
        assert_eq!(without_pending_commit.render_lanes(), Lanes::DEFAULT);
        assert_eq!(with_pending_commit.priority_lanes(), Lanes::NO);
        assert_eq!(with_pending_commit.render_lanes(), Lanes::NO);
    }

    #[test]
    fn root_scheduler_idle_work_waits_behind_suspended_non_idle_work() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        {
            let lanes = store.root_mut(root_id).unwrap().lanes_mut();
            lanes.mark_suspended(Lanes::DEFAULT, Lane::NO, true);
            lanes.mark_updated(Lane::IDLE);
        }

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::NoWork
        );
        assert_eq!(processed.records()[0].next_lanes(), Lanes::NO);
        assert!(store.scheduler_bridge().callback_requests().is_empty());
    }

    #[test]
    fn root_scheduler_entangled_lanes_expand_after_priority_selection() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        {
            let lanes = store.root_mut(root_id).unwrap().lanes_mut();
            lanes.mark_updated(Lane::TRANSITION_1);
            lanes.mark_entangled(Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1));
        }

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let record = processed.records()[0];

        assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
        assert_eq!(
            record.next_lanes(),
            Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1)
        );
        assert_eq!(
            record.callback_priority(),
            RootCallbackPriority::new(Lane::DEFAULT)
        );
        assert_eq!(record.scheduler_priority(), Some(SchedulerPriority::Normal));
    }

    #[test]
    fn root_scheduler_execute_callback_renders_matching_host_root_callback() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let callback = scheduled_callback_request(&mut store, root_id);

        let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();
        let render = execution.render_phase().unwrap();

        assert_eq!(
            execution.status(),
            RootSchedulerCallbackExecutionStatus::Rendered
        );
        assert_eq!(execution.callback(), callback);
        assert_eq!(execution.root(), root_id);
        assert_eq!(execution.callback_node(), callback.node());
        assert!(!execution.validation().is_stale());
        assert_eq!(execution.selected_lanes(), Lanes::DEFAULT);
        assert_eq!(render.root(), root_id);
        assert_eq!(render.current(), current);
        assert_eq!(render.applied_update_count(), 1);
        assert_eq!(render.resulting_element(), RootElementHandle::from_raw(1));
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_execute_callback_reports_stale_callback_without_rendering() {
        let (mut store, root_id, _host) = root_store();
        let callback = scheduled_callback_request(&mut store, root_id);
        let sync_result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
        process_root_schedule_in_microtask(&mut store).unwrap();
        let current = store.root(root_id).unwrap().current();

        let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();

        assert_eq!(
            execution.status(),
            RootSchedulerCallbackExecutionStatus::StaleCallback
        );
        assert!(execution.validation().is_stale());
        assert_eq!(
            execution.validation().requested_callback_node(),
            callback.node()
        );
        assert_eq!(execution.selected_lanes(), Lanes::NO);
        assert_eq!(execution.render_phase(), None);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.fiber_arena().get(current).unwrap().alternate(), None);
    }

    #[test]
    fn root_scheduler_execute_callback_reports_no_work_without_rendering() {
        let (mut store, root_id, _host) = root_store();
        let callback = scheduled_callback_request(&mut store, root_id);
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_finished(RootFinishedLanes::new(Lanes::DEFAULT, Lanes::NO));
        let current = store.root(root_id).unwrap().current();

        let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();

        assert_eq!(
            execution.status(),
            RootSchedulerCallbackExecutionStatus::NoWork
        );
        assert!(!execution.validation().is_stale());
        assert_eq!(execution.selected_lanes(), Lanes::NO);
        assert_eq!(execution.render_phase(), None);
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
            RootCallbackPriority::NO
        );
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.fiber_arena().get(current).unwrap().alternate(), None);
    }

    #[test]
    fn root_scheduler_execute_callback_rechecks_suspended_lane_selection() {
        let (mut store, root_id, _host) = root_store();
        let callback = scheduled_callback_request(&mut store, root_id);
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_suspended(Lanes::DEFAULT, Lane::NO, true);
        let current = store.root(root_id).unwrap().current();

        let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();

        assert_eq!(
            execution.status(),
            RootSchedulerCallbackExecutionStatus::NoWork
        );
        assert_eq!(execution.selected_lanes(), Lanes::NO);
        assert_eq!(execution.render_phase(), None);
        assert_eq!(store.root(root_id).unwrap().current(), current);
    }

    #[test]
    fn root_scheduler_microtask_cancels_existing_callback_when_reselection_finds_no_work() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let original_node = store.root(root_id).unwrap().scheduling().callback_node();

        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_suspended(Lanes::DEFAULT, Lane::NO, true);
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let record = processed.records()[0];

        assert_eq!(record.outcome(), RootTaskScheduleOutcome::NoWork);
        assert_eq!(record.next_lanes(), Lanes::NO);
        assert_eq!(record.canceled_callback().unwrap().node(), original_node);
        assert_eq!(store.scheduler_bridge().cancellation_records().len(), 1);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(scheduled_roots(&store).unwrap(), Vec::<FiberRootId>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_microtask_cancels_callback_when_reselection_changes_callback_lane() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let original_node = store.root(root_id).unwrap().scheduling().callback_node();

        mark_default_suspended_with_pending_transition(&mut store, root_id);
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let record = processed.records()[0];

        assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
        assert_eq!(record.next_lanes(), Lanes::from(Lane::TRANSITION_1));
        assert_eq!(
            record.callback_priority(),
            RootCallbackPriority::new(Lane::TRANSITION_1)
        );
        assert_eq!(record.scheduler_priority(), Some(SchedulerPriority::Normal));
        assert_eq!(record.canceled_callback().unwrap().node(), original_node);
        assert_eq!(store.scheduler_bridge().cancellation_records().len(), 1);
        assert_eq!(store.scheduler_bridge().callback_requests().len(), 2);
        assert_ne!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            original_node
        );
        assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_execute_callback_reselects_lanes_before_render_handoff() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let callback = scheduled_callback_request(&mut store, root_id);

        mark_default_suspended_with_pending_transition(&mut store, root_id);
        let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();
        let render = execution.render_phase().unwrap();

        assert_eq!(
            execution.status(),
            RootSchedulerCallbackExecutionStatus::Rendered
        );
        assert!(!execution.validation().is_stale());
        assert_eq!(execution.selected_lanes(), Lanes::from(Lane::TRANSITION_1));
        assert_eq!(render.render_lanes(), Lanes::from(Lane::TRANSITION_1));
        assert_eq!(render.applied_update_count(), 0);
        assert_eq!(render.skipped_update_count(), 1);
        assert_eq!(render.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
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

    #[test]
    fn root_scheduler_sync_flush_lanes_filter_non_sync_lanes_and_recompute_flag() {
        let (mut store, root_id, _host) = root_store();
        let sync_result =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(1), None)
                .unwrap();
        ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
        schedule_default_update(&mut store, root_id);

        let sync_lanes = sync_flush_lanes_for_root(&store, root_id).unwrap();

        assert_eq!(sync_lanes, Lanes::SYNC);
        assert!(
            !sync_lanes.contains_lane(Lane::DEFAULT),
            "default work must stay out of the sync flush lane set"
        );

        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_finished(RootFinishedLanes::new(Lanes::SYNC, Lanes::DEFAULT));
        let still_has_sync = recompute_might_have_pending_sync_work(&mut store).unwrap();

        assert!(!still_has_sync);
        assert!(!store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::DEFAULT
        );
    }

    #[test]
    fn root_scheduler_sync_flush_act_continuation_lanes_use_post_commit_selection() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let sync_result =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(1), None)
                .unwrap();
        ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
        schedule_default_update(&mut store, root_id);

        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_finished(RootFinishedLanes::new(Lanes::SYNC, Lanes::DEFAULT));

        let continuation_lanes =
            sync_flush_act_continuation_lanes_for_root(&store, root_id).unwrap();

        assert_eq!(continuation_lanes, Lanes::DEFAULT);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_flush_act_continuation_lanes_respect_suspended_selection() {
        let (mut store, root_id, host) = root_store();
        schedule_default_update(&mut store, root_id);
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_suspended(Lanes::DEFAULT, Lane::NO, true);

        let continuation_lanes =
            sync_flush_act_continuation_lanes_for_root(&store, root_id).unwrap();

        assert_eq!(continuation_lanes, Lanes::NO);
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_flush_act_post_passive_gate_records_pending_passive_metadata() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(91));
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
        let finished_work = render.finished_work();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(root_id, Lanes::NO);
        let commit = commit_finished_host_root(&mut store, render).unwrap();

        store.scheduler_bridge_mut().enter_act_scope();
        store.scheduler_bridge_mut().enter_act_scope();
        let act_continuation = store
            .scheduler_bridge_mut()
            .record_sync_flush_act_continuation(root_id, 7, Lanes::SYNC, Lanes::NO, Lanes::NO);

        let gate = sync_flush_act_post_passive_continuation_gate(
            act_continuation,
            commit.pending_passive_handoff(),
        )
        .unwrap();

        assert_eq!(gate.root(), root_id);
        assert_eq!(gate.sync_flush_order(), 7);
        assert_eq!(gate.flushed_lanes(), Lanes::SYNC);
        assert_eq!(gate.remaining_lanes(), Lanes::NO);
        assert_eq!(gate.continuation_lanes(), Lanes::NO);
        assert_eq!(gate.pending_passive_finished_work(), finished_work);
        assert_eq!(gate.pending_passive_lanes(), Lanes::SYNC);
        assert_eq!(gate.pending_passive_unmount_count(), 0);
        assert_eq!(gate.pending_passive_mount_count(), 0);
        assert_eq!(gate.pending_passive_record_count(), 0);
        assert_eq!(gate.act_scope_depth(), 2);
        assert!(gate.nested_act_scope());
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .pending_passive()
                .has_commit_handoff()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_flush_act_post_passive_gate_requires_act_and_passive_handoff() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(92));
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
        store.scheduler_bridge_mut().enter_act_scope();
        let act_continuation = store
            .scheduler_bridge_mut()
            .record_sync_flush_act_continuation(root_id, 8, Lanes::SYNC, Lanes::NO, Lanes::NO);
        let commit_without_passive = commit_finished_host_root(&mut store, render).unwrap();

        assert_eq!(
            sync_flush_act_post_passive_continuation_gate(act_continuation, None),
            None
        );
        assert_eq!(
            sync_flush_act_post_passive_continuation_gate(
                act_continuation,
                commit_without_passive.pending_passive_handoff()
            ),
            None
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_flush_records_fast_path_when_no_pending_sync_work() {
        let (mut store, _root_id, _host) = root_store();
        let execution_context = ExecutionContextState::new();

        let result = flush_sync_work_on_all_roots(&mut store, &execution_context).unwrap();

        assert_eq!(
            result.exit_status(),
            RootSyncFlushExitStatus::SkippedNoPendingSyncWork
        );
        assert!(result.execution_context().can_enter_sync_flush());
        assert!(result.records().is_empty());
        assert!(!store.root_scheduler().is_flushing_work());
    }

    #[test]
    fn root_scheduler_sync_flush_records_reject_render_or_commit_context() {
        let (mut store, root_id, _host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::NONE);
        let mut execution_context = ExecutionContextState::new();

        let render_result = execution_context
            .with_render_context(|execution_context| {
                flush_sync_work_on_all_roots(&mut store, execution_context)
            })
            .unwrap();

        assert_eq!(
            render_result.exit_status(),
            RootSyncFlushExitStatus::BlockedByExecutionContext
        );
        assert!(
            render_result
                .execution_context()
                .blocked_by_render_or_commit()
        );
        assert!(render_result.records().is_empty());
        assert!(!store.root_scheduler().is_flushing_work());
        assert!(store.root_scheduler().might_have_pending_sync_work());

        let commit_result = execution_context
            .with_commit_context(|execution_context| {
                flush_sync_work_on_all_roots(&mut store, execution_context)
            })
            .unwrap();

        assert_eq!(
            commit_result.exit_status(),
            RootSyncFlushExitStatus::BlockedByExecutionContext
        );
        assert!(
            commit_result
                .execution_context()
                .blocked_by_render_or_commit()
        );
        assert!(commit_result.records().is_empty());
        assert!(!store.root_scheduler().is_flushing_work());
    }

    #[test]
    fn root_scheduler_sync_flush_records_reentrant_guard_without_clearing_state() {
        let (mut store, root_id, _host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::NONE);
        store.root_scheduler_mut().set_is_flushing_work(true);

        let result =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        assert_eq!(
            result.exit_status(),
            RootSyncFlushExitStatus::SkippedReentrantFlush
        );
        assert!(result.records().is_empty());
        assert!(store.root_scheduler().is_flushing_work());
        assert!(store.root_scheduler().might_have_pending_sync_work());

        store.root_scheduler_mut().set_is_flushing_work(false);
    }

    #[test]
    fn root_scheduler_sync_flush_records_roots_in_scheduled_order_and_renders_for_commit_handoff() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let second_scheduled = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let first_scheduled = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second_current = store.root(second_scheduled).unwrap().current();
        let first_current = store.root(first_scheduled).unwrap().current();

        schedule_sync_update(
            &mut store,
            second_scheduled,
            RootElementHandle::from_raw(20),
        );
        schedule_sync_update(&mut store, first_scheduled, RootElementHandle::from_raw(10));

        let result =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        assert_eq!(result.exit_status(), RootSyncFlushExitStatus::Completed);
        assert_eq!(result.records().len(), 2);
        assert_eq!(result.records()[0].order(), 0);
        assert_eq!(result.records()[0].root(), second_scheduled);
        assert_eq!(result.records()[0].lanes(), Lanes::SYNC);
        assert_eq!(
            result.records()[0].status(),
            RootSyncFlushRecordStatus::RenderedAwaitingCommit
        );
        assert_eq!(
            result.records()[0].render_phase().resulting_element(),
            RootElementHandle::from_raw(20)
        );
        assert_eq!(result.records()[1].order(), 1);
        assert_eq!(result.records()[1].root(), first_scheduled);
        assert_eq!(result.records()[1].lanes(), Lanes::SYNC);
        assert_eq!(
            result.records()[1].render_phase().resulting_element(),
            RootElementHandle::from_raw(10)
        );
        assert_eq!(
            store.root(second_scheduled).unwrap().current(),
            second_current
        );
        assert_eq!(
            store.root(first_scheduled).unwrap().current(),
            first_current
        );
        assert_eq!(store.root(second_scheduled).unwrap().finished_work(), None);
        assert_eq!(store.root(first_scheduled).unwrap().finished_work(), None);
        assert!(!store.root_scheduler().is_flushing_work());
    }
}
