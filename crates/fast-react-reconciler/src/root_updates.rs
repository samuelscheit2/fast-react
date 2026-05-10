//! Internal HostRoot update entry points.
//!
//! `update_container` and `update_container_sync` create HostRoot
//! `{element}` updates. They enqueue data, mark lanes, and return scheduler /
//! entanglement records for later slices; they do not render, flush, commit, or
//! mutate a host container.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    EventPriority, FiberId, FiberTopologyError, Lane, Lanes, RootLaneSchedulingSnapshot,
    UpdateQueueHandle, lanes_to_event_priority,
};
use fast_react_host_config::HostTypes;

use crate::{
    ConcurrentUpdateError, FiberRootId, FiberRootStore, FiberRootStoreError, RootElementHandle,
    RootUpdateCallbackHandle, RootUpdatePayload, UpdateId, UpdatePriorityState, UpdateQueueError,
    enqueue_concurrent_host_root_update, finish_queueing_concurrent_updates, request_update_lane,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RootUpdateLaneSourcePriority {
    DefaultEventPriority,
    LegacyRootSync,
    ExplicitSync,
    TransitionLane,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootUpdateLaneChoiceRecord {
    lane: Lane,
    event_priority: EventPriority,
    source_priority: RootUpdateLaneSourcePriority,
}

impl RootUpdateLaneChoiceRecord {
    #[must_use]
    pub const fn lane(self) -> Lane {
        self.lane
    }

    #[must_use]
    pub const fn event_priority(self) -> EventPriority {
        self.event_priority
    }

    #[must_use]
    pub const fn source_priority(self) -> RootUpdateLaneSourcePriority {
        self.source_priority
    }

    fn transition_for_lane_for_canary(lane: Lane) -> Self {
        Self {
            lane,
            event_priority: lanes_to_event_priority(lane.to_lanes()),
            source_priority: RootUpdateLaneSourcePriority::TransitionLane,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootScheduleUpdateRecord {
    root: FiberRootId,
    fiber: FiberId,
    lane: Lane,
}

impl RootScheduleUpdateRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn lane(self) -> Lane {
        self.lane
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootTransitionEntanglementRecord {
    root: FiberRootId,
    queue: UpdateQueueHandle,
    lane: Lane,
    entangled_lanes: Lanes,
}

impl RootTransitionEntanglementRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn queue(self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub const fn lane(self) -> Lane {
        self.lane
    }

    #[must_use]
    pub const fn entangled_lanes(self) -> Lanes {
        self.entangled_lanes
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UpdateContainerResult {
    lane: Lane,
    lane_choice: RootUpdateLaneChoiceRecord,
    update: UpdateId,
    queue: UpdateQueueHandle,
    schedule: RootScheduleUpdateRecord,
    entanglement: Option<RootTransitionEntanglementRecord>,
    pending_lanes_before_enqueue: Lanes,
    pending_lanes_after_enqueue: Lanes,
    selected_next_lanes: Lanes,
}

impl UpdateContainerResult {
    #[must_use]
    pub const fn lane(&self) -> Lane {
        self.lane
    }

    #[must_use]
    pub const fn lane_choice(&self) -> RootUpdateLaneChoiceRecord {
        self.lane_choice
    }

    #[must_use]
    pub const fn event_priority(&self) -> EventPriority {
        self.lane_choice.event_priority()
    }

    #[must_use]
    pub const fn source_priority(&self) -> RootUpdateLaneSourcePriority {
        self.lane_choice.source_priority()
    }

    #[must_use]
    pub const fn update(&self) -> UpdateId {
        self.update
    }

    #[must_use]
    pub const fn queue(&self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub const fn schedule(&self) -> RootScheduleUpdateRecord {
        self.schedule
    }

    #[must_use]
    pub const fn entanglement(&self) -> Option<RootTransitionEntanglementRecord> {
        self.entanglement
    }

    #[must_use]
    pub const fn pending_lanes_before_enqueue(&self) -> Lanes {
        self.pending_lanes_before_enqueue
    }

    #[must_use]
    pub const fn pending_lanes_after_enqueue(&self) -> Lanes {
        self.pending_lanes_after_enqueue
    }

    #[must_use]
    pub const fn selected_next_lanes(&self) -> Lanes {
        self.selected_next_lanes
    }

    #[must_use]
    pub const fn callback_scheduling_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub const fn callback_execution_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub const fn public_batching_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootQueuedCallbackOrderRecord {
    queue_order: usize,
    root: FiberRootId,
    fiber: FiberId,
    queue: UpdateQueueHandle,
    update: UpdateId,
    callback: RootUpdateCallbackHandle,
    lane_choice: RootUpdateLaneChoiceRecord,
    schedule: RootScheduleUpdateRecord,
    pending_lanes_after_enqueue: Lanes,
    selected_next_lanes: Lanes,
}

#[allow(
    dead_code,
    reason = "private HostRoot queue callback-order diagnostics are exercised by focused canaries"
)]
impl HostRootQueuedCallbackOrderRecord {
    #[must_use]
    pub(crate) const fn queue_order(self) -> usize {
        self.queue_order
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn queue(self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub(crate) const fn update(self) -> UpdateId {
        self.update
    }

    #[must_use]
    pub(crate) const fn callback(self) -> RootUpdateCallbackHandle {
        self.callback
    }

    #[must_use]
    pub(crate) const fn lane(self) -> Lane {
        self.lane_choice.lane()
    }

    #[must_use]
    pub(crate) const fn lane_choice(self) -> RootUpdateLaneChoiceRecord {
        self.lane_choice
    }

    #[must_use]
    pub(crate) const fn event_priority(self) -> EventPriority {
        self.lane_choice.event_priority()
    }

    #[must_use]
    pub(crate) const fn source_priority(self) -> RootUpdateLaneSourcePriority {
        self.lane_choice.source_priority()
    }

    #[must_use]
    pub(crate) const fn schedule(self) -> RootScheduleUpdateRecord {
        self.schedule
    }

    #[must_use]
    pub(crate) const fn pending_lanes_after_enqueue(self) -> Lanes {
        self.pending_lanes_after_enqueue
    }

    #[must_use]
    pub(crate) const fn selected_next_lanes(self) -> Lanes {
        self.selected_next_lanes
    }

    #[must_use]
    pub(crate) fn lane_and_schedule_match(self) -> bool {
        self.lane_choice.lane() == self.schedule.lane()
            && self.schedule.root().raw() == self.root.raw()
            && self.schedule.fiber() == self.fiber
    }

    #[must_use]
    pub(crate) const fn public_callback_invoked(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootQueuedCallbackOrderSnapshot {
    root: FiberRootId,
    queue: UpdateQueueHandle,
    records: Vec<HostRootQueuedCallbackOrderRecord>,
    pending_lanes: Lanes,
    selected_next_lanes: Lanes,
}

#[allow(
    dead_code,
    reason = "private HostRoot queue callback-order diagnostics are exercised by focused canaries"
)]
impl HostRootQueuedCallbackOrderSnapshot {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn queue(&self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootQueuedCallbackOrderRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub(crate) const fn pending_lanes(&self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub(crate) const fn selected_next_lanes(&self) -> Lanes {
        self.selected_next_lanes
    }

    #[must_use]
    pub(crate) fn records_in_queue_order(&self) -> bool {
        self.records
            .iter()
            .enumerate()
            .all(|(order, record)| record.queue_order() == order)
    }

    #[must_use]
    pub(crate) fn records_have_distinct_lanes_and_callbacks(&self) -> bool {
        self.records.iter().enumerate().all(|(index, record)| {
            self.records
                .iter()
                .skip(index + 1)
                .all(|next| record.lane() != next.lane() && record.callback() != next.callback())
        })
    }

    #[must_use]
    pub(crate) fn records_match_accepted_lane_and_schedule(&self) -> bool {
        self.records
            .iter()
            .all(|record| record.lane_and_schedule_match())
    }

    #[must_use]
    pub(crate) const fn root_rendering_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn commit_execution_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn callback_invocation_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn user_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_callback_behavior_exposed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_batching_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RootUpdateError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    UpdateQueue(UpdateQueueError),
    ConcurrentUpdate(ConcurrentUpdateError),
    UnknownPriorityLane {
        lane: Lane,
        source_priority: RootUpdateLaneSourcePriority,
    },
    EmptyRoot {
        root: FiberRootId,
    },
    StaleQueueEvidence {
        root: FiberRootId,
        queue: UpdateQueueHandle,
        update: UpdateId,
        expected_pending_lanes: Lanes,
        actual_pending_lanes: Lanes,
    },
    StaleQueueSnapshot {
        root: FiberRootId,
        queue: UpdateQueueHandle,
        expected_updates: Vec<UpdateId>,
        actual_updates: Vec<UpdateId>,
        expected_pending_lanes: Lanes,
        actual_pending_lanes: Lanes,
    },
    MismatchedRootToken {
        expected: FiberRootId,
        actual: FiberRootId,
        update: UpdateId,
    },
    MissingCallbackHandle {
        root: FiberRootId,
        queue: UpdateQueueHandle,
        update: UpdateId,
    },
    EnqueuedWrongRoot {
        expected: FiberRootId,
        actual: FiberRootId,
    },
}

impl Display for RootUpdateError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UpdateQueue(error) => Display::fmt(error, formatter),
            Self::ConcurrentUpdate(error) => Display::fmt(error, formatter),
            Self::UnknownPriorityLane {
                lane,
                source_priority,
            } => write!(
                formatter,
                "{source_priority:?} cannot claim event-priority lane metadata for lane {}",
                lane.bits()
            ),
            Self::EmptyRoot { root } => write!(
                formatter,
                "root {} has no pending lanes for lane priority scheduling diagnostics",
                root.raw()
            ),
            Self::StaleQueueEvidence {
                root,
                queue,
                update,
                expected_pending_lanes,
                actual_pending_lanes,
            } => write!(
                formatter,
                "root {} queue {} update {} has stale lane priority evidence; expected pending lanes {}, actual pending lanes {}",
                root.raw(),
                queue.raw(),
                update.raw(),
                expected_pending_lanes.bits(),
                actual_pending_lanes.bits()
            ),
            Self::StaleQueueSnapshot {
                root,
                queue,
                expected_updates,
                actual_updates,
                expected_pending_lanes,
                actual_pending_lanes,
            } => write!(
                formatter,
                "root {} queue {} has stale callback-order snapshot; expected updates {:?} with pending lanes {}, actual updates {:?} with pending lanes {}",
                root.raw(),
                queue.raw(),
                expected_updates,
                expected_pending_lanes.bits(),
                actual_updates,
                actual_pending_lanes.bits()
            ),
            Self::MismatchedRootToken {
                expected,
                actual,
                update,
            } => write!(
                formatter,
                "queued HostRoot callback update {} references root {}, expected root {}",
                update.raw(),
                actual.raw(),
                expected.raw()
            ),
            Self::MissingCallbackHandle {
                root,
                queue,
                update,
            } => write!(
                formatter,
                "root {} queue {} update {} is missing a callback handle for callback-order diagnostics",
                root.raw(),
                queue.raw(),
                update.raw()
            ),
            Self::EnqueuedWrongRoot { expected, actual } => write!(
                formatter,
                "enqueued HostRoot update for root {}, expected root {}",
                actual.raw(),
                expected.raw()
            ),
        }
    }
}

impl Error for RootUpdateError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::UpdateQueue(error) => Some(error),
            Self::ConcurrentUpdate(error) => Some(error),
            Self::UnknownPriorityLane { .. }
            | Self::EmptyRoot { .. }
            | Self::StaleQueueEvidence { .. }
            | Self::StaleQueueSnapshot { .. }
            | Self::MismatchedRootToken { .. }
            | Self::MissingCallbackHandle { .. }
            | Self::EnqueuedWrongRoot { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for RootUpdateError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for RootUpdateError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<UpdateQueueError> for RootUpdateError {
    fn from(error: UpdateQueueError) -> Self {
        Self::UpdateQueue(error)
    }
}

impl From<ConcurrentUpdateError> for RootUpdateError {
    fn from(error: ConcurrentUpdateError) -> Self {
        Self::ConcurrentUpdate(error)
    }
}

pub fn update_container<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    element: RootElementHandle,
    callback: Option<RootUpdateCallbackHandle>,
) -> Result<UpdateContainerResult, RootUpdateError> {
    let current = store.root(root_id)?.current();
    let lane = {
        let current_fiber = store.fiber_arena().get(current)?;
        request_update_lane(current_fiber, UpdatePriorityState::new())
    };
    let source_priority = if lane == Lane::SYNC {
        RootUpdateLaneSourcePriority::LegacyRootSync
    } else {
        RootUpdateLaneSourcePriority::DefaultEventPriority
    };
    let lane_choice = root_update_lane_choice_from_source_lane_for_canary(lane, source_priority)?;
    update_container_impl(store, root_id, current, lane_choice, element, callback)
}

pub fn update_container_sync<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    element: RootElementHandle,
    callback: Option<RootUpdateCallbackHandle>,
) -> Result<UpdateContainerResult, RootUpdateError> {
    let current = store.root(root_id)?.current();
    let lane_choice = root_update_lane_choice_from_source_lane_for_canary(
        Lane::SYNC,
        RootUpdateLaneSourcePriority::ExplicitSync,
    )?;
    update_container_impl(store, root_id, current, lane_choice, element, callback)
}

fn update_container_impl<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    root_fiber: FiberId,
    lane_choice: RootUpdateLaneChoiceRecord,
    element: RootElementHandle,
    callback: Option<RootUpdateCallbackHandle>,
) -> Result<UpdateContainerResult, RootUpdateError> {
    let lane = lane_choice.lane();
    let pending_lanes_before_enqueue = store.root(root_id)?.lanes().pending_lanes();
    let queue = store.ensure_host_root_update_queue(root_id)?;
    let update = store.update_queues_mut().create_update(lane);
    {
        let update_record = store.update_queues_mut().update_mut(update)?;
        update_record.set_payload(RootUpdatePayload::new(element));
        if let Some(callback) = callback
            && callback.is_some()
        {
            update_record.set_callback(callback);
        }
    }

    let enqueued_root =
        enqueue_concurrent_host_root_update(store, root_fiber, queue, update, lane)?;
    if enqueued_root != root_id {
        return Err(RootUpdateError::EnqueuedWrongRoot {
            expected: root_id,
            actual: enqueued_root,
        });
    }

    // There is no root work loop in this slice, so drain the explicit
    // concurrent staging hook immediately into the HostRoot pending ring. The
    // staging API remains available for future render-boundary control.
    finish_queueing_concurrent_updates(store)?;
    let pending_lanes_after_enqueue = store.root(root_id)?.lanes().pending_lanes();
    let lane_snapshot = root_lane_priority_scheduling_snapshot_for_canary(store, root_id)?;

    let schedule = RootScheduleUpdateRecord {
        root: root_id,
        fiber: root_fiber,
        lane,
    };

    let root_pending_lanes = store.root(root_id)?.lanes().pending_lanes();
    let entanglement = store
        .update_queues_mut()
        .entangle_transition_update(queue, root_pending_lanes, lane)?
        .map(|entangled_lanes| {
            store
                .root_mut(root_id)?
                .lanes_mut()
                .mark_entangled(entangled_lanes);
            Ok::<_, RootUpdateError>(RootTransitionEntanglementRecord {
                root: root_id,
                queue,
                lane,
                entangled_lanes,
            })
        })
        .transpose()?;

    Ok(UpdateContainerResult {
        lane,
        lane_choice,
        update,
        queue,
        schedule,
        entanglement,
        pending_lanes_before_enqueue,
        pending_lanes_after_enqueue,
        selected_next_lanes: lane_snapshot.selected_next_lanes(),
    })
}

pub(crate) fn root_update_lane_choice_from_source_lane_for_canary(
    lane: Lane,
    source_priority: RootUpdateLaneSourcePriority,
) -> Result<RootUpdateLaneChoiceRecord, RootUpdateError> {
    let Some(event_priority) = EventPriority::from_lane(lane) else {
        return Err(RootUpdateError::UnknownPriorityLane {
            lane,
            source_priority,
        });
    };

    if event_priority.is_no() {
        return Err(RootUpdateError::UnknownPriorityLane {
            lane,
            source_priority,
        });
    }

    Ok(RootUpdateLaneChoiceRecord {
        lane,
        event_priority,
        source_priority,
    })
}

pub(crate) fn root_lane_priority_scheduling_snapshot_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<RootLaneSchedulingSnapshot, RootUpdateError> {
    let root = store.root(root_id)?;
    if root.lanes().pending_lanes().is_empty() {
        return Err(RootUpdateError::EmptyRoot { root: root_id });
    }

    let scheduling = root.scheduling();
    let wip_lanes = if scheduling.work_in_progress().is_some() {
        scheduling.work_in_progress_root_render_lanes()
    } else {
        Lanes::NO
    };
    let root_has_pending_commit = root.pending_commit().is_some()
        || scheduling.cancel_pending_commit().is_some()
        || scheduling.timeout_handle().is_some();

    Ok(root
        .lanes()
        .scheduling_snapshot(wip_lanes, root_has_pending_commit))
}

pub(crate) fn validate_update_container_lane_diagnostics_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    result: &UpdateContainerResult,
) -> Result<RootLaneSchedulingSnapshot, RootUpdateError> {
    let root_id = result.schedule().root();
    let root = store.root(root_id)?;
    let actual_pending_lanes = root.lanes().pending_lanes();
    if actual_pending_lanes.is_empty() {
        return Err(RootUpdateError::EmptyRoot { root: root_id });
    }

    let current_queue = store.fiber_arena().get(root.current())?.update_queue();
    let pending_updates = store.update_queues().pending_updates(result.queue())?;
    let update_lane = store.update_queues().update(result.update())?.lane();
    let lane_snapshot = root_lane_priority_scheduling_snapshot_for_canary(store, root_id)?;
    let stale = current_queue != result.queue()
        || !pending_updates.contains(&result.update())
        || !update_lane.contains_lane(result.lane())
        || actual_pending_lanes != result.pending_lanes_after_enqueue()
        || lane_snapshot.selected_next_lanes() != result.selected_next_lanes();

    if stale {
        return Err(RootUpdateError::StaleQueueEvidence {
            root: root_id,
            queue: result.queue(),
            update: result.update(),
            expected_pending_lanes: result.pending_lanes_after_enqueue(),
            actual_pending_lanes,
        });
    }

    Ok(lane_snapshot)
}

pub(crate) fn host_root_queued_callback_order_snapshot_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    accepted_updates: &[UpdateContainerResult],
) -> Result<HostRootQueuedCallbackOrderSnapshot, RootUpdateError> {
    if accepted_updates.is_empty() {
        return Err(RootUpdateError::EmptyRoot { root: root_id });
    }

    for update in accepted_updates {
        let actual = update.schedule().root();
        if actual != root_id {
            return Err(RootUpdateError::MismatchedRootToken {
                expected: root_id,
                actual,
                update: update.update(),
            });
        }
    }

    let queue = accepted_updates[0].queue();
    let expected_updates = accepted_updates
        .iter()
        .map(UpdateContainerResult::update)
        .collect::<Vec<_>>();
    let actual_updates = store.update_queues().pending_updates(queue)?;
    let root = store.root(root_id)?;
    let actual_pending_lanes = root.lanes().pending_lanes();
    let lane_snapshot = root_lane_priority_scheduling_snapshot_for_canary(store, root_id)?;
    let expected_pending_lanes = accepted_updates
        .last()
        .expect("accepted updates is not empty")
        .pending_lanes_after_enqueue();
    let expected_selected_next_lanes = accepted_updates
        .last()
        .expect("accepted updates is not empty")
        .selected_next_lanes();
    let current_queue = store.fiber_arena().get(root.current())?.update_queue();
    let stale = current_queue != queue
        || accepted_updates
            .iter()
            .any(|update| update.queue() != queue)
        || expected_updates != actual_updates
        || actual_pending_lanes != expected_pending_lanes
        || lane_snapshot.selected_next_lanes() != expected_selected_next_lanes;

    if stale {
        return Err(RootUpdateError::StaleQueueSnapshot {
            root: root_id,
            queue,
            expected_updates,
            actual_updates,
            expected_pending_lanes,
            actual_pending_lanes,
        });
    }

    let mut records = Vec::with_capacity(accepted_updates.len());
    for (queue_order, result) in accepted_updates.iter().enumerate() {
        let update = store.update_queues().update(result.update())?;
        let callback = update.callback();
        if callback.is_none() {
            return Err(RootUpdateError::MissingCallbackHandle {
                root: root_id,
                queue,
                update: result.update(),
            });
        }

        if !update.lane().contains_lane(result.lane())
            || result.lane_choice().lane() != result.lane()
            || result.schedule().lane() != result.lane()
        {
            return Err(RootUpdateError::StaleQueueSnapshot {
                root: root_id,
                queue,
                expected_updates,
                actual_updates,
                expected_pending_lanes,
                actual_pending_lanes,
            });
        }

        records.push(HostRootQueuedCallbackOrderRecord {
            queue_order,
            root: root_id,
            fiber: result.schedule().fiber(),
            queue,
            update: result.update(),
            callback,
            lane_choice: result.lane_choice(),
            schedule: result.schedule(),
            pending_lanes_after_enqueue: result.pending_lanes_after_enqueue(),
            selected_next_lanes: result.selected_next_lanes(),
        });
    }

    Ok(HostRootQueuedCallbackOrderSnapshot {
        root: root_id,
        queue,
        records,
        pending_lanes: actual_pending_lanes,
        selected_next_lanes: lane_snapshot.selected_next_lanes(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::RootOptions;
    use crate::test_support::{FakeContainer, RecordingHost};

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id, host)
    }

    #[test]
    fn root_updates_update_container_enqueues_element_payload_on_default_lane() {
        let (mut store, root_id, _host) = root_store();
        let element = RootElementHandle::from_raw(42);

        let result = update_container(&mut store, root_id, element, None).unwrap();

        assert_eq!(result.lane(), Lane::DEFAULT);
        assert_eq!(result.lane_choice().lane(), Lane::DEFAULT);
        assert_eq!(result.event_priority(), EventPriority::DEFAULT);
        assert_eq!(
            result.source_priority(),
            RootUpdateLaneSourcePriority::DefaultEventPriority
        );
        assert_eq!(result.schedule().root(), root_id);
        assert_eq!(result.pending_lanes_before_enqueue(), Lanes::NO);
        assert_eq!(result.pending_lanes_after_enqueue(), Lanes::DEFAULT);
        assert_eq!(result.selected_next_lanes(), Lanes::DEFAULT);
        assert!(result.callback_scheduling_blocked());
        assert!(result.callback_execution_blocked());
        assert!(!result.public_batching_compatibility_claimed());
        validate_update_container_lane_diagnostics_for_canary(&store, &result).unwrap();
        assert_eq!(
            store
                .update_queues()
                .pending_updates(result.queue())
                .unwrap(),
            vec![result.update()]
        );
        assert_eq!(
            store
                .update_queues()
                .update(result.update())
                .unwrap()
                .payload()
                .unwrap()
                .element(),
            element
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );
    }

    #[test]
    fn root_updates_update_container_sync_enqueues_null_element_on_sync_lane_without_flushing() {
        let (mut store, root_id, host) = root_store();

        let result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();

        assert_eq!(result.lane(), Lane::SYNC);
        assert_eq!(result.event_priority(), EventPriority::DISCRETE);
        assert_eq!(
            result.source_priority(),
            RootUpdateLaneSourcePriority::ExplicitSync
        );
        assert_eq!(result.pending_lanes_before_enqueue(), Lanes::NO);
        assert_eq!(result.pending_lanes_after_enqueue(), Lanes::SYNC);
        assert_eq!(result.selected_next_lanes(), Lanes::SYNC);
        assert!(result.callback_scheduling_blocked());
        assert!(result.callback_execution_blocked());
        assert!(!result.public_batching_compatibility_claimed());
        validate_update_container_lane_diagnostics_for_canary(&store, &result).unwrap();
        assert_eq!(
            store
                .update_queues()
                .update(result.update())
                .unwrap()
                .payload()
                .unwrap()
                .element(),
            RootElementHandle::NONE
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::SYNC)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_updates_store_callback_handle_without_invoking_it() {
        let (mut store, root_id, _host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(9);

        let result = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1),
            Some(callback),
        )
        .unwrap();

        assert_eq!(
            store
                .update_queues()
                .update(result.update())
                .unwrap()
                .callback(),
            callback
        );
        assert!(
            store
                .update_queues()
                .queue(result.queue())
                .unwrap()
                .callbacks()
                .is_empty()
        );
    }

    #[test]
    fn root_updates_callback_order_snapshot_ties_callbacks_to_lane_and_schedule_records() {
        let (mut store, root_id, host) = root_store();
        let first_callback = RootUpdateCallbackHandle::from_raw(5671);
        let second_callback = RootUpdateCallbackHandle::from_raw(5672);

        let first = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1),
            Some(first_callback),
        )
        .unwrap();
        let second = update_container_sync(
            &mut store,
            root_id,
            RootElementHandle::from_raw(2),
            Some(second_callback),
        )
        .unwrap();

        let snapshot = host_root_queued_callback_order_snapshot_for_canary(
            &store,
            root_id,
            &[first.clone(), second.clone()],
        )
        .unwrap();

        assert_eq!(snapshot.root(), root_id);
        assert_eq!(snapshot.queue(), first.queue());
        assert_eq!(snapshot.len(), 2);
        assert!(!snapshot.is_empty());
        assert_eq!(snapshot.pending_lanes(), Lanes::SYNC.merge(Lanes::DEFAULT));
        assert_eq!(
            snapshot.selected_next_lanes(),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
        assert!(snapshot.records_in_queue_order());
        assert!(snapshot.records_have_distinct_lanes_and_callbacks());
        assert!(snapshot.records_match_accepted_lane_and_schedule());
        assert!(snapshot.root_rendering_blocked());
        assert!(snapshot.commit_execution_blocked());
        assert!(snapshot.callback_invocation_blocked());
        assert!(!snapshot.user_callbacks_invoked());
        assert!(!snapshot.public_root_callback_behavior_exposed());
        assert!(!snapshot.public_batching_compatibility_claimed());

        let records = snapshot.records();
        assert_eq!(records[0].queue_order(), 0);
        assert_eq!(records[0].root(), root_id);
        assert_eq!(records[0].fiber(), first.schedule().fiber());
        assert_eq!(records[0].queue(), first.queue());
        assert_eq!(records[0].update(), first.update());
        assert_eq!(records[0].callback(), first_callback);
        assert_eq!(records[0].lane(), Lane::DEFAULT);
        assert_eq!(records[0].lane_choice(), first.lane_choice());
        assert_eq!(records[0].event_priority(), EventPriority::DEFAULT);
        assert_eq!(
            records[0].source_priority(),
            RootUpdateLaneSourcePriority::DefaultEventPriority
        );
        assert_eq!(records[0].schedule(), first.schedule());
        assert_eq!(records[0].pending_lanes_after_enqueue(), Lanes::DEFAULT);
        assert_eq!(records[0].selected_next_lanes(), Lanes::DEFAULT);
        assert!(records[0].lane_and_schedule_match());
        assert!(!records[0].public_callback_invoked());

        assert_eq!(records[1].queue_order(), 1);
        assert_eq!(records[1].root(), root_id);
        assert_eq!(records[1].fiber(), second.schedule().fiber());
        assert_eq!(records[1].queue(), second.queue());
        assert_eq!(records[1].update(), second.update());
        assert_eq!(records[1].callback(), second_callback);
        assert_eq!(records[1].lane(), Lane::SYNC);
        assert_eq!(records[1].lane_choice(), second.lane_choice());
        assert_eq!(records[1].event_priority(), EventPriority::DISCRETE);
        assert_eq!(
            records[1].source_priority(),
            RootUpdateLaneSourcePriority::ExplicitSync
        );
        assert_eq!(records[1].schedule(), second.schedule());
        assert_eq!(
            records[1].pending_lanes_after_enqueue(),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
        assert_eq!(
            records[1].selected_next_lanes(),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
        assert!(records[1].lane_and_schedule_match());
        assert!(!records[1].public_callback_invoked());

        assert!(first.callback_scheduling_blocked());
        assert!(first.callback_execution_blocked());
        assert!(second.callback_scheduling_blocked());
        assert!(second.callback_execution_blocked());
        assert_eq!(store.root_scheduler().first_scheduled_root(), None);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            None
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_updates_callback_order_snapshot_rejects_mismatched_root_token() {
        let (mut store, root_id, _host) = root_store();
        let other_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1),
            Some(RootUpdateCallbackHandle::from_raw(5673)),
        )
        .unwrap();
        let update_id = update.update();

        let error =
            host_root_queued_callback_order_snapshot_for_canary(&store, other_root, &[update])
                .unwrap_err();

        assert_eq!(
            error,
            RootUpdateError::MismatchedRootToken {
                expected: other_root,
                actual: root_id,
                update: update_id
            }
        );
    }

    #[test]
    fn root_updates_callback_order_snapshot_rejects_missing_callback_handle() {
        let (mut store, root_id, _host) = root_store();
        let update =
            update_container(&mut store, root_id, RootElementHandle::from_raw(1), None).unwrap();

        let error =
            host_root_queued_callback_order_snapshot_for_canary(&store, root_id, &[update.clone()])
                .unwrap_err();

        assert_eq!(
            error,
            RootUpdateError::MissingCallbackHandle {
                root: root_id,
                queue: update.queue(),
                update: update.update()
            }
        );
    }

    #[test]
    fn root_updates_callback_order_snapshot_rejects_stale_queue_snapshot() {
        let (mut store, root_id, _host) = root_store();
        let accepted = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1),
            Some(RootUpdateCallbackHandle::from_raw(5674)),
        )
        .unwrap();
        let stale_extra = update_container_sync(
            &mut store,
            root_id,
            RootElementHandle::from_raw(2),
            Some(RootUpdateCallbackHandle::from_raw(5675)),
        )
        .unwrap();

        let error = host_root_queued_callback_order_snapshot_for_canary(
            &store,
            root_id,
            &[accepted.clone()],
        )
        .unwrap_err();

        assert_eq!(
            error,
            RootUpdateError::StaleQueueSnapshot {
                root: root_id,
                queue: accepted.queue(),
                expected_updates: vec![accepted.update()],
                actual_updates: vec![accepted.update(), stale_extra.update()],
                expected_pending_lanes: Lanes::DEFAULT,
                actual_pending_lanes: Lanes::SYNC.merge(Lanes::DEFAULT)
            }
        );
    }

    #[test]
    fn root_updates_entangle_transition_update_but_do_not_schedule_work() {
        let (mut store, root_id, _host) = root_store();
        let current = store.root(root_id).unwrap().current();

        let result = update_container_impl(
            &mut store,
            root_id,
            current,
            RootUpdateLaneChoiceRecord::transition_for_lane_for_canary(Lane::TRANSITION_1),
            RootElementHandle::from_raw(1),
            None,
        )
        .unwrap();

        assert_eq!(
            result.entanglement().unwrap().entangled_lanes(),
            Lanes::from(Lane::TRANSITION_1)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .entangled_lanes()
                .contains_lane(Lane::TRANSITION_1)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .callback_node()
                .is_none()
        );
    }

    #[test]
    fn root_updates_lane_priority_diagnostics_fail_closed_for_unknown_priority() {
        let error = root_update_lane_choice_from_source_lane_for_canary(
            Lane::TRANSITION_1,
            RootUpdateLaneSourcePriority::DefaultEventPriority,
        )
        .unwrap_err();

        assert_eq!(
            error,
            RootUpdateError::UnknownPriorityLane {
                lane: Lane::TRANSITION_1,
                source_priority: RootUpdateLaneSourcePriority::DefaultEventPriority
            }
        );

        let no_lane_error = root_update_lane_choice_from_source_lane_for_canary(
            Lane::NO,
            RootUpdateLaneSourcePriority::DefaultEventPriority,
        )
        .unwrap_err();
        assert_eq!(
            no_lane_error,
            RootUpdateError::UnknownPriorityLane {
                lane: Lane::NO,
                source_priority: RootUpdateLaneSourcePriority::DefaultEventPriority
            }
        );
    }

    #[test]
    fn root_updates_lane_priority_snapshot_fails_closed_for_empty_root() {
        let (store, root_id, _host) = root_store();

        let error = root_lane_priority_scheduling_snapshot_for_canary(&store, root_id).unwrap_err();

        assert_eq!(error, RootUpdateError::EmptyRoot { root: root_id });
    }
}
