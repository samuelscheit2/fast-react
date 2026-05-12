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

use crate::root_callbacks::{
    RootUpdateCallbackInvocationExecutionGateSnapshot, RootUpdateCallbackInvocationTestControl,
};
#[cfg(test)]
use crate::root_commit::{
    HostRootFinishedWorkCommitHandoffErrorForCanary,
    HostRootFinishedWorkCommitHandoffRecordForCanary,
    HostRootFinishedWorkPendingCommitRecordForCanary,
    commit_completed_host_root_render_with_finished_work_handoff_for_canary,
    commit_finished_host_root_with_finished_work_handoff_for_canary,
};
use crate::{
    ConcurrentUpdateError, FiberRootId, FiberRootStore, FiberRootStoreError, HostRootCommitRecord,
    RootElementHandle, RootUpdateCallbackHandle, RootUpdateCallbackVisibility, RootUpdatePayload,
    UpdateId, UpdatePriorityState, UpdateQueueError, enqueue_concurrent_host_root_update,
    finish_queueing_concurrent_updates, request_update_lane,
};
#[cfg(test)]
use crate::{HostRootRenderPhaseRecord, RootRenderExitStatus};

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

    #[allow(
        dead_code,
        reason = "crate-private transition lane choice evidence is exercised by canary tests"
    )]
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
pub(crate) struct HostRootVisibleCallbackInvocationAfterCommitSnapshot {
    root: FiberRootId,
    queue: UpdateQueueHandle,
    finished_work: FiberId,
    finished_lanes: Lanes,
    pending_lanes_after_commit: Lanes,
    accepted_order_record_count: usize,
    execution: RootUpdateCallbackInvocationExecutionGateSnapshot,
}

#[allow(
    dead_code,
    reason = "private HostRoot visible callback invocation canary is exercised by focused tests"
)]
impl HostRootVisibleCallbackInvocationAfterCommitSnapshot {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn queue(&self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes_after_commit(&self) -> Lanes {
        self.pending_lanes_after_commit
    }

    #[must_use]
    pub(crate) const fn accepted_order_record_count(&self) -> usize {
        self.accepted_order_record_count
    }

    #[must_use]
    pub(crate) const fn execution(&self) -> &RootUpdateCallbackInvocationExecutionGateSnapshot {
        &self.execution
    }

    #[must_use]
    pub(crate) fn len(&self) -> usize {
        self.execution.len()
    }

    #[must_use]
    pub(crate) fn completed_count(&self) -> usize {
        self.execution.completed_count()
    }

    #[must_use]
    pub(crate) fn error_count(&self) -> usize {
        self.execution.error_count()
    }

    #[must_use]
    pub(crate) fn invoked_accepted_visible_callbacks(&self) -> bool {
        self.accepted_order_record_count > 0
            && self.execution.did_drain_accepted_visible_callbacks()
            && self.execution.len() == self.accepted_order_record_count
    }

    #[must_use]
    pub(crate) fn records_in_deterministic_commit_order(&self) -> bool {
        self.execution.records_in_invocation_order()
            && self
                .execution
                .records()
                .iter()
                .enumerate()
                .all(|(order, record)| record.accepted_sequence() == order)
    }

    #[must_use]
    pub(crate) const fn public_js_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_callback_behavior_exposed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn hidden_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RootUpdateError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    UpdateQueue(UpdateQueueError),
    ConcurrentUpdate(ConcurrentUpdateError),
    UnsupportedTransitionLane {
        lane: Lane,
    },
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
    StaleCallbackOrderSnapshotAfterCommit {
        root: FiberRootId,
        queue: UpdateQueueHandle,
        expected_updates: Vec<UpdateId>,
        actual_visible_updates: Vec<UpdateId>,
        expected_callbacks: Vec<RootUpdateCallbackHandle>,
        actual_visible_callbacks: Vec<RootUpdateCallbackHandle>,
    },
    HiddenOrDeferredCallbackSnapshotRejected {
        root: FiberRootId,
        queue: UpdateQueueHandle,
        update: UpdateId,
        callback: RootUpdateCallbackHandle,
        visibility: RootUpdateCallbackVisibility,
    },
    MismatchedRootToken {
        expected: FiberRootId,
        actual: FiberRootId,
        update: UpdateId,
    },
    WrongRootCallbackHandle {
        expected: FiberRootId,
        actual: FiberRootId,
        queue: UpdateQueueHandle,
        callback: RootUpdateCallbackHandle,
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
            Self::UnsupportedTransitionLane { lane } => write!(
                formatter,
                "lane {} cannot be used for private transition update diagnostics",
                lane.bits()
            ),
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
            Self::StaleCallbackOrderSnapshotAfterCommit {
                root,
                queue,
                expected_updates,
                actual_visible_updates,
                expected_callbacks,
                actual_visible_callbacks,
            } => write!(
                formatter,
                "root {} queue {} has stale callback-order snapshot after commit; expected visible updates {:?} callbacks {:?}, actual visible updates {:?} callbacks {:?}",
                root.raw(),
                queue.raw(),
                expected_updates,
                expected_callbacks,
                actual_visible_updates,
                actual_visible_callbacks
            ),
            Self::HiddenOrDeferredCallbackSnapshotRejected {
                root,
                queue,
                update,
                callback,
                visibility,
            } => write!(
                formatter,
                "root {} queue {} rejected {:?} callback update {} handle {} before visible callback invocation",
                root.raw(),
                queue.raw(),
                visibility,
                update.raw(),
                callback.raw()
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
            Self::WrongRootCallbackHandle {
                expected,
                actual,
                queue,
                callback,
            } => write!(
                formatter,
                "queued HostRoot callback handle {} in queue {} belongs to root {}, expected root {}",
                callback.raw(),
                queue.raw(),
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
            Self::UnsupportedTransitionLane { .. }
            | Self::UnknownPriorityLane { .. }
            | Self::EmptyRoot { .. }
            | Self::StaleQueueEvidence { .. }
            | Self::StaleQueueSnapshot { .. }
            | Self::StaleCallbackOrderSnapshotAfterCommit { .. }
            | Self::HiddenOrDeferredCallbackSnapshotRejected { .. }
            | Self::MismatchedRootToken { .. }
            | Self::WrongRootCallbackHandle { .. }
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

#[allow(
    dead_code,
    reason = "crate-private transition update entrypoint is exercised by canary tests"
)]
pub(crate) fn update_container_transition_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    lane: Lane,
    element: RootElementHandle,
    callback: Option<RootUpdateCallbackHandle>,
) -> Result<UpdateContainerResult, RootUpdateError> {
    if !lane.is_transition() {
        return Err(RootUpdateError::UnsupportedTransitionLane { lane });
    }

    let current = store.root(root_id)?.current();
    update_container_impl(
        store,
        root_id,
        current,
        RootUpdateLaneChoiceRecord::transition_for_lane_for_canary(lane),
        element,
        callback,
    )
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

#[allow(
    dead_code,
    reason = "crate-private callback queue snapshot is exercised by canary tests"
)]
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

pub(crate) fn invoke_host_root_accepted_visible_callbacks_after_matching_commit_under_test_control_for_canary(
    accepted_order: &HostRootQueuedCallbackOrderSnapshot,
    commit: &mut HostRootCommitRecord,
    control: &mut impl RootUpdateCallbackInvocationTestControl,
) -> Result<HostRootVisibleCallbackInvocationAfterCommitSnapshot, RootUpdateError> {
    validate_host_root_accepted_callback_order_matches_commit_for_canary(accepted_order, commit)?;

    let root = commit.root();
    let queue = commit.root_update_callbacks().queue();
    let finished_work = commit.finished_work();
    let finished_lanes = commit.finished_lanes();
    let pending_lanes_after_commit = commit.pending_lanes();
    let accepted_order_record_count = accepted_order.len();
    let execution = commit.drain_root_update_callbacks_under_test_control(control);

    Ok(HostRootVisibleCallbackInvocationAfterCommitSnapshot {
        root,
        queue,
        finished_work,
        finished_lanes,
        pending_lanes_after_commit,
        accepted_order_record_count,
        execution,
    })
}

pub(crate) fn validate_host_root_accepted_visible_callbacks_after_matching_commit_for_canary(
    accepted_order: &HostRootQueuedCallbackOrderSnapshot,
    commit: &HostRootCommitRecord,
) -> Result<(), RootUpdateError> {
    validate_host_root_accepted_callback_order_matches_commit_for_canary(accepted_order, commit)
}

fn validate_host_root_accepted_callback_order_matches_commit_for_canary(
    accepted_order: &HostRootQueuedCallbackOrderSnapshot,
    commit: &HostRootCommitRecord,
) -> Result<(), RootUpdateError> {
    let commit_root = commit.root();
    let accepted_root = accepted_order.root();
    let first_callback = accepted_order
        .records()
        .first()
        .map_or(RootUpdateCallbackHandle::NONE, |record| record.callback());
    if accepted_root != commit_root {
        return Err(RootUpdateError::WrongRootCallbackHandle {
            expected: commit_root,
            actual: accepted_root,
            queue: accepted_order.queue(),
            callback: first_callback,
        });
    }

    if let Some(record) = accepted_order
        .records()
        .iter()
        .find(|record| record.root() != commit_root)
    {
        return Err(RootUpdateError::WrongRootCallbackHandle {
            expected: commit_root,
            actual: record.root(),
            queue: record.queue(),
            callback: record.callback(),
        });
    }

    let callbacks = commit.root_update_callbacks();
    for hidden in callbacks
        .hidden()
        .iter()
        .chain(callbacks.deferred_hidden().iter())
    {
        if accepted_order
            .records()
            .iter()
            .any(|record| record.update() == hidden.update())
        {
            return Err(RootUpdateError::HiddenOrDeferredCallbackSnapshotRejected {
                root: commit_root,
                queue: callbacks.queue(),
                update: hidden.update(),
                callback: hidden.callback(),
                visibility: hidden.visibility(),
            });
        }
    }

    let expected_updates = accepted_order
        .records()
        .iter()
        .map(|record| record.update())
        .collect::<Vec<_>>();
    let actual_visible_updates = callbacks
        .visible()
        .iter()
        .map(|record| record.update())
        .collect::<Vec<_>>();
    let expected_callbacks = accepted_order
        .records()
        .iter()
        .map(|record| record.callback())
        .collect::<Vec<_>>();
    let actual_visible_callbacks = callbacks
        .visible()
        .iter()
        .map(|record| record.callback())
        .collect::<Vec<_>>();

    let visible_records_match_accepted_order = accepted_order.len() == callbacks.visible().len()
        && accepted_order
            .records()
            .iter()
            .zip(callbacks.visible().iter())
            .all(|(accepted, visible)| {
                accepted.queue_order() == visible.sequence()
                    && accepted.update() == visible.update()
                    && accepted.callback() == visible.callback()
                    && visible.visibility().is_visible()
            });

    if !visible_records_match_accepted_order {
        return Err(RootUpdateError::StaleCallbackOrderSnapshotAfterCommit {
            root: commit_root,
            queue: callbacks.queue(),
            expected_updates,
            actual_visible_updates,
            expected_callbacks,
            actual_visible_callbacks,
        });
    }

    Ok(())
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
    pub(crate) sequence: usize,
    pub(crate) update: UpdateId,
    pub(crate) lane: Lane,
    pub(crate) source_lanes: Lanes,
    pub(crate) pending_lanes_after_enqueue: Lanes,
    pub(crate) selected_next_lanes_after_enqueue: Lanes,
}

#[cfg(test)]
impl HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
    #[must_use]
    pub(crate) const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn update(self) -> UpdateId {
        self.update
    }

    #[must_use]
    pub(crate) const fn lane(self) -> Lane {
        self.lane
    }

    #[must_use]
    pub(crate) const fn source_lanes(self) -> Lanes {
        self.source_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes_after_enqueue(self) -> Lanes {
        self.pending_lanes_after_enqueue
    }

    #[must_use]
    pub(crate) const fn selected_next_lanes_after_enqueue(self) -> Lanes {
        self.selected_next_lanes_after_enqueue
    }

    #[must_use]
    pub(crate) const fn committed_by_finished_lanes(self, finished_lanes: Lanes) -> bool {
        self.source_lanes.is_subset_of(finished_lanes)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootUpdateQueueLaneHandoffRecordForCanary {
    pub(crate) root: FiberRootId,
    pub(crate) current: FiberId,
    pub(crate) finished_work: FiberId,
    pub(crate) current_update_queue: UpdateQueueHandle,
    pub(crate) work_in_progress_update_queue: UpdateQueueHandle,
    pub(crate) pending_lanes_before_render: Lanes,
    pub(crate) selected_next_lanes_before_render: Lanes,
    pub(crate) finished_lanes: Lanes,
    pub(crate) remaining_lanes: Lanes,
    pub(crate) pending_lanes_after_render: Lanes,
    pub(crate) update_records: Vec<HostRootUpdateQueueLaneHandoffUpdateRecordForCanary>,
    pub(crate) current_queue_base_updates: Vec<UpdateId>,
    pub(crate) applied_update_count: usize,
    pub(crate) skipped_update_count: usize,
    pub(crate) resulting_element: RootElementHandle,
}

#[cfg(test)]
impl HostRootUpdateQueueLaneHandoffRecordForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn current_update_queue(&self) -> UpdateQueueHandle {
        self.current_update_queue
    }

    #[must_use]
    pub(crate) const fn work_in_progress_update_queue(&self) -> UpdateQueueHandle {
        self.work_in_progress_update_queue
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before_render(&self) -> Lanes {
        self.pending_lanes_before_render
    }

    #[must_use]
    pub(crate) const fn selected_next_lanes_before_render(&self) -> Lanes {
        self.selected_next_lanes_before_render
    }

    #[must_use]
    pub(crate) const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(&self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes_after_render(&self) -> Lanes {
        self.pending_lanes_after_render
    }

    #[must_use]
    pub(crate) fn update_records(&self) -> &[HostRootUpdateQueueLaneHandoffUpdateRecordForCanary] {
        &self.update_records
    }

    #[must_use]
    pub(crate) fn current_queue_base_updates(&self) -> &[UpdateId] {
        &self.current_queue_base_updates
    }

    #[must_use]
    pub(crate) const fn applied_update_count(&self) -> usize {
        self.applied_update_count
    }

    #[must_use]
    pub(crate) const fn skipped_update_count(&self) -> usize {
        self.skipped_update_count
    }

    #[must_use]
    pub(crate) const fn resulting_element(&self) -> RootElementHandle {
        self.resulting_element
    }

    #[must_use]
    pub(crate) fn update_sequence_ids(&self) -> Vec<UpdateId> {
        self.update_records
            .iter()
            .map(|record| record.update())
            .collect()
    }

    #[must_use]
    pub(crate) fn records_in_update_sequence_order(&self) -> bool {
        self.update_records
            .iter()
            .enumerate()
            .all(|(sequence, record)| record.sequence() == sequence)
    }

    #[must_use]
    pub(crate) fn records_have_distinct_compatible_lanes(&self) -> bool {
        self.update_records
            .iter()
            .enumerate()
            .all(|(index, record)| {
                record.committed_by_finished_lanes(self.finished_lanes)
                    && self
                        .update_records
                        .iter()
                        .skip(index + 1)
                        .all(|next| record.lane() != next.lane())
            })
    }

    #[must_use]
    pub(crate) fn proves_same_transition_multi_update_lane_handoff_for_canary(
        &self,
        lane: Lane,
    ) -> bool {
        let lane_lanes = lane.to_lanes();
        !self.update_records.is_empty()
            && self.records_in_update_sequence_order()
            && self.update_sequence_ids() == self.current_queue_base_updates
            && self.pending_lanes_before_render == self.finished_lanes.merge(self.remaining_lanes)
            && self.pending_lanes_after_render == self.pending_lanes_before_render
            && self.selected_next_lanes_before_render == self.finished_lanes
            && self.remaining_lanes.is_empty()
            && self.applied_update_count == self.update_records.len()
            && self.skipped_update_count == 0
            && self.root_current_not_switched_by_handoff()
            && self.work_loop_or_commit_consumer_required()
            && self.public_root_rendering_blocked()
            && lane.is_transition()
            && self.update_records.len() == 2
            && self.selected_next_lanes_before_render == lane_lanes
            && self.finished_lanes == lane_lanes
            && self.remaining_lanes.is_empty()
            && self.update_records.iter().all(|record| {
                record.lane() == lane
                    && record.source_lanes() == lane_lanes
                    && record.committed_by_finished_lanes(self.finished_lanes)
                    && record.selected_next_lanes_after_enqueue() == lane_lanes
                    && record.pending_lanes_after_enqueue().contains_lane(lane)
            })
    }

    #[must_use]
    pub(crate) fn root_current_not_switched_by_handoff(&self) -> bool {
        self.current != self.finished_work
    }

    #[must_use]
    pub(crate) const fn work_loop_or_commit_consumer_required(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) fn proves_source_owned_lane_handoff(&self) -> bool {
        !self.update_records.is_empty()
            && self.records_in_update_sequence_order()
            && self.records_have_distinct_compatible_lanes()
            && self.update_sequence_ids() == self.current_queue_base_updates
            && self.pending_lanes_before_render == self.finished_lanes.merge(self.remaining_lanes)
            && self.pending_lanes_after_render == self.pending_lanes_before_render
            && self.selected_next_lanes_before_render == self.finished_lanes
            && self.remaining_lanes.is_empty()
            && self.applied_update_count == self.update_records.len()
            && self.skipped_update_count == 0
            && self.root_current_not_switched_by_handoff()
            && self.work_loop_or_commit_consumer_required()
            && self.public_root_rendering_blocked()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootUpdateQueueLaneHandoffErrorForCanary {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    UpdateQueue(UpdateQueueError),
    EmptyAcceptedUpdates {
        root: FiberRootId,
    },
    RenderRootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    ReplayedHandoffRecord {
        root: FiberRootId,
        expected_current: FiberId,
        actual_current: FiberId,
    },
    RenderPhaseWorkMismatch {
        root: FiberRootId,
        expected: Option<FiberId>,
        actual: FiberId,
    },
    RenderPhaseLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    RenderPhaseNotCompleted {
        root: FiberRootId,
        status: RootRenderExitStatus,
    },
    SourceQueueMismatch {
        root: FiberRootId,
        expected: UpdateQueueHandle,
        actual: UpdateQueueHandle,
    },
    WorkInProgressQueueMismatch {
        root: FiberRootId,
        expected: UpdateQueueHandle,
        actual: UpdateQueueHandle,
    },
    CrossRootQueueRecord {
        expected: FiberRootId,
        actual: FiberRootId,
        update: UpdateId,
    },
    ScheduleFiberMismatch {
        root: FiberRootId,
        update: UpdateId,
        expected: FiberId,
        actual: FiberId,
    },
    QueueOrderMismatch {
        root: FiberRootId,
        queue: UpdateQueueHandle,
        expected_updates: Vec<UpdateId>,
        actual_updates: Vec<UpdateId>,
    },
    StalePendingLanes {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    WrongLaneMetadata {
        root: FiberRootId,
        queue: UpdateQueueHandle,
        update: UpdateId,
        expected_lane: Lane,
        actual_lanes: Lanes,
    },
    SkippedLaneCommitted {
        root: FiberRootId,
        update: UpdateId,
        skipped_lanes: Lanes,
        finished_lanes: Lanes,
        remaining_lanes: Lanes,
    },
    RenderLanesDoNotMatchSelectedPriority {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    AppliedUpdateCountMismatch {
        root: FiberRootId,
        expected: usize,
        actual: usize,
    },
}

#[cfg(test)]
impl Display for HostRootUpdateQueueLaneHandoffErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UpdateQueue(error) => Display::fmt(error, formatter),
            Self::EmptyAcceptedUpdates { root } => write!(
                formatter,
                "root {} has no accepted HostRoot updates for queue/lane handoff",
                root.raw()
            ),
            Self::RenderRootMismatch { expected, actual } => write!(
                formatter,
                "HostRoot queue/lane handoff expected root {}, got render root {}",
                expected.raw(),
                actual.raw()
            ),
            Self::ReplayedHandoffRecord {
                root,
                expected_current,
                actual_current,
            } => write!(
                formatter,
                "root {} HostRoot queue/lane handoff was replayed after current moved from fiber {} to {}",
                root.raw(),
                expected_current.slot().get(),
                actual_current.slot().get()
            ),
            Self::RenderPhaseWorkMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} render phase work {:?} does not match HostRoot queue/lane handoff fiber {}",
                root.raw(),
                expected.map(|fiber| fiber.slot().get()),
                actual.slot().get()
            ),
            Self::RenderPhaseLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} render phase lanes {:?} do not match HostRoot queue/lane handoff lanes {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::RenderPhaseNotCompleted { root, status } => write!(
                formatter,
                "root {} render phase must be completed before HostRoot queue/lane handoff, found {:?}",
                root.raw(),
                status
            ),
            Self::SourceQueueMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} HostRoot queue/lane handoff expected source queue {}, got {}",
                root.raw(),
                expected.raw(),
                actual.raw()
            ),
            Self::WorkInProgressQueueMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} HostRoot queue/lane handoff expected work-in-progress queue {}, got {}",
                root.raw(),
                expected.raw(),
                actual.raw()
            ),
            Self::CrossRootQueueRecord {
                expected,
                actual,
                update,
            } => write!(
                formatter,
                "HostRoot update {} belongs to root {}, expected root {}",
                update.raw(),
                actual.raw(),
                expected.raw()
            ),
            Self::ScheduleFiberMismatch {
                root,
                update,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} HostRoot update {} scheduled fiber {}, expected current fiber {}",
                root.raw(),
                update.raw(),
                actual.slot().get(),
                expected.slot().get()
            ),
            Self::QueueOrderMismatch {
                root,
                queue,
                expected_updates,
                actual_updates,
            } => write!(
                formatter,
                "root {} queue {} update order mismatch; expected {:?}, actual {:?}",
                root.raw(),
                queue.raw(),
                expected_updates,
                actual_updates
            ),
            Self::StalePendingLanes {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} stale pending lanes for HostRoot queue/lane handoff; expected {:?}, actual {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::WrongLaneMetadata {
                root,
                queue,
                update,
                expected_lane,
                actual_lanes,
            } => write!(
                formatter,
                "root {} queue {} update {} claimed lane {:?}, actual lanes {:?}",
                root.raw(),
                queue.raw(),
                update.raw(),
                expected_lane,
                actual_lanes
            ),
            Self::SkippedLaneCommitted {
                root,
                update,
                skipped_lanes,
                finished_lanes,
                remaining_lanes,
            } => write!(
                formatter,
                "root {} update {} with lanes {:?} was treated as committed by finished lanes {:?}; remaining lanes {:?}",
                root.raw(),
                update.raw(),
                skipped_lanes,
                finished_lanes,
                remaining_lanes
            ),
            Self::RenderLanesDoNotMatchSelectedPriority {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} selected priority lanes {:?} do not match rendered finished lanes {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::AppliedUpdateCountMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} applied {} HostRoot updates, expected {}",
                root.raw(),
                actual,
                expected
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootUpdateQueueLaneHandoffErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::UpdateQueue(error) => Some(error),
            Self::EmptyAcceptedUpdates { .. }
            | Self::RenderRootMismatch { .. }
            | Self::ReplayedHandoffRecord { .. }
            | Self::RenderPhaseWorkMismatch { .. }
            | Self::RenderPhaseLanesMismatch { .. }
            | Self::RenderPhaseNotCompleted { .. }
            | Self::SourceQueueMismatch { .. }
            | Self::WorkInProgressQueueMismatch { .. }
            | Self::CrossRootQueueRecord { .. }
            | Self::ScheduleFiberMismatch { .. }
            | Self::QueueOrderMismatch { .. }
            | Self::StalePendingLanes { .. }
            | Self::WrongLaneMetadata { .. }
            | Self::SkippedLaneCommitted { .. }
            | Self::RenderLanesDoNotMatchSelectedPriority { .. }
            | Self::AppliedUpdateCountMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<FiberRootStoreError> for HostRootUpdateQueueLaneHandoffErrorForCanary {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

#[cfg(test)]
impl From<FiberTopologyError> for HostRootUpdateQueueLaneHandoffErrorForCanary {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[cfg(test)]
impl From<UpdateQueueError> for HostRootUpdateQueueLaneHandoffErrorForCanary {
    fn from(error: UpdateQueueError) -> Self {
        Self::UpdateQueue(error)
    }
}

#[cfg(test)]
pub(crate) fn host_root_update_queue_lane_handoff_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    accepted_updates: &[UpdateContainerResult],
    render: HostRootRenderPhaseRecord,
) -> Result<
    HostRootUpdateQueueLaneHandoffRecordForCanary,
    HostRootUpdateQueueLaneHandoffErrorForCanary,
> {
    if accepted_updates.is_empty() {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::EmptyAcceptedUpdates { root: root_id },
        );
    }

    if render.root() != root_id {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::RenderRootMismatch {
                expected: root_id,
                actual: render.root(),
            },
        );
    }

    validate_completed_render_shape_for_update_queue_lane_handoff(store, root_id, render)?;

    let root = store.root(root_id)?;
    let current = root.current();
    let current_update_queue = render.current_update_queue();
    let work_in_progress_update_queue = render.work_in_progress_update_queue();
    let actual_current_queue = store.fiber_arena().get(render.current())?.update_queue();
    if actual_current_queue != current_update_queue {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::SourceQueueMismatch {
                root: root_id,
                expected: current_update_queue,
                actual: actual_current_queue,
            },
        );
    }

    let actual_work_in_progress_queue = store
        .fiber_arena()
        .get(render.work_in_progress())?
        .update_queue();
    if actual_work_in_progress_queue != work_in_progress_update_queue {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::WorkInProgressQueueMismatch {
                root: root_id,
                expected: work_in_progress_update_queue,
                actual: actual_work_in_progress_queue,
            },
        );
    }

    let expected_updates = accepted_updates
        .iter()
        .map(UpdateContainerResult::update)
        .collect::<Vec<_>>();
    for result in accepted_updates {
        validate_accepted_update_matches_render_source_for_handoff(
            store,
            root_id,
            current,
            current_update_queue,
            render,
            result,
        )?;
    }

    let current_queue_base_updates = store.update_queues().base_updates(current_update_queue)?;
    if current_queue_base_updates != expected_updates {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::QueueOrderMismatch {
                root: root_id,
                queue: current_update_queue,
                expected_updates,
                actual_updates: current_queue_base_updates,
            },
        );
    }

    let pending_lanes_before_render = accepted_updates
        .last()
        .expect("accepted updates is not empty")
        .pending_lanes_after_enqueue();
    let selected_next_lanes_before_render = accepted_updates
        .last()
        .expect("accepted updates is not empty")
        .selected_next_lanes();
    let pending_lanes_after_render = root.lanes().pending_lanes();
    if pending_lanes_after_render != pending_lanes_before_render {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::StalePendingLanes {
                root: root_id,
                expected: pending_lanes_before_render,
                actual: pending_lanes_after_render,
            },
        );
    }

    if pending_lanes_before_render != render.render_lanes().merge(render.remaining_lanes()) {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::StalePendingLanes {
                root: root_id,
                expected: render.render_lanes().merge(render.remaining_lanes()),
                actual: pending_lanes_before_render,
            },
        );
    }

    let mut update_records = Vec::with_capacity(accepted_updates.len());
    for (sequence, result) in accepted_updates.iter().enumerate() {
        let source_lanes = store
            .update_queues()
            .update(result.update())?
            .lane()
            .remove_lane(Lane::OFFSCREEN);

        if !source_lanes.is_subset_of(render.render_lanes())
            || render.remaining_lanes().contains_any(source_lanes)
        {
            return Err(
                HostRootUpdateQueueLaneHandoffErrorForCanary::SkippedLaneCommitted {
                    root: root_id,
                    update: result.update(),
                    skipped_lanes: source_lanes,
                    finished_lanes: render.render_lanes(),
                    remaining_lanes: render.remaining_lanes(),
                },
            );
        }

        update_records.push(HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
            sequence,
            update: result.update(),
            lane: result.lane(),
            source_lanes,
            pending_lanes_after_enqueue: result.pending_lanes_after_enqueue(),
            selected_next_lanes_after_enqueue: result.selected_next_lanes(),
        });
    }

    if selected_next_lanes_before_render != render.render_lanes() {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::RenderLanesDoNotMatchSelectedPriority {
                root: root_id,
                expected: selected_next_lanes_before_render,
                actual: render.render_lanes(),
            },
        );
    }

    if render.applied_update_count() != accepted_updates.len() {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::AppliedUpdateCountMismatch {
                root: root_id,
                expected: accepted_updates.len(),
                actual: render.applied_update_count(),
            },
        );
    }

    Ok(HostRootUpdateQueueLaneHandoffRecordForCanary {
        root: root_id,
        current,
        finished_work: render.finished_work(),
        current_update_queue,
        work_in_progress_update_queue,
        pending_lanes_before_render,
        selected_next_lanes_before_render,
        finished_lanes: render.render_lanes(),
        remaining_lanes: render.remaining_lanes(),
        pending_lanes_after_render,
        update_records,
        current_queue_base_updates,
        applied_update_count: render.applied_update_count(),
        skipped_update_count: render.skipped_update_count(),
        resulting_element: render.resulting_element(),
    })
}

#[cfg(test)]
pub(crate) fn validate_host_root_update_queue_lane_handoff_record_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    handoff: &HostRootUpdateQueueLaneHandoffRecordForCanary,
) -> Result<(), HostRootUpdateQueueLaneHandoffErrorForCanary> {
    let root = store.root(handoff.root)?;
    if root.current() != handoff.current {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::ReplayedHandoffRecord {
                root: handoff.root,
                expected_current: handoff.current,
                actual_current: root.current(),
            },
        );
    }

    let scheduling = root.scheduling();
    if scheduling.work_in_progress() != Some(handoff.finished_work) {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::RenderPhaseWorkMismatch {
                root: handoff.root,
                expected: scheduling.work_in_progress(),
                actual: handoff.finished_work,
            },
        );
    }

    if scheduling.work_in_progress_root_render_lanes() != handoff.finished_lanes {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::RenderPhaseLanesMismatch {
                root: handoff.root,
                expected: scheduling.work_in_progress_root_render_lanes(),
                actual: handoff.finished_lanes,
            },
        );
    }

    if root.lanes().pending_lanes() != handoff.pending_lanes_after_render {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::StalePendingLanes {
                root: handoff.root,
                expected: handoff.pending_lanes_after_render,
                actual: root.lanes().pending_lanes(),
            },
        );
    }

    let current_queue_base_updates = store
        .update_queues()
        .base_updates(handoff.current_update_queue)?;
    if current_queue_base_updates != handoff.current_queue_base_updates {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::QueueOrderMismatch {
                root: handoff.root,
                queue: handoff.current_update_queue,
                expected_updates: handoff.current_queue_base_updates.clone(),
                actual_updates: current_queue_base_updates,
            },
        );
    }
    let pending_updates = store
        .update_queues()
        .pending_updates(handoff.current_update_queue)?;
    if !pending_updates.is_empty() {
        let mut actual_updates = current_queue_base_updates;
        actual_updates.extend(pending_updates);
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::QueueOrderMismatch {
                root: handoff.root,
                queue: handoff.current_update_queue,
                expected_updates: handoff.current_queue_base_updates.clone(),
                actual_updates,
            },
        );
    }

    Ok(())
}

#[cfg(test)]
fn validate_completed_render_shape_for_update_queue_lane_handoff<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    render: HostRootRenderPhaseRecord,
) -> Result<(), HostRootUpdateQueueLaneHandoffErrorForCanary> {
    let root = store.root(root_id)?;
    let current = root.current();
    if current != render.current() {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::ReplayedHandoffRecord {
                root: root_id,
                expected_current: render.current(),
                actual_current: current,
            },
        );
    }

    let scheduling = root.scheduling();
    if scheduling.work_in_progress() != Some(render.work_in_progress()) {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::RenderPhaseWorkMismatch {
                root: root_id,
                expected: scheduling.work_in_progress(),
                actual: render.work_in_progress(),
            },
        );
    }

    if scheduling.work_in_progress_root_render_lanes() != render.render_lanes() {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::RenderPhaseLanesMismatch {
                root: root_id,
                expected: scheduling.work_in_progress_root_render_lanes(),
                actual: render.render_lanes(),
            },
        );
    }

    if scheduling.render_exit_status() != RootRenderExitStatus::Completed {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::RenderPhaseNotCompleted {
                root: root_id,
                status: scheduling.render_exit_status(),
            },
        );
    }

    Ok(())
}

#[cfg(test)]
fn validate_accepted_update_matches_render_source_for_handoff<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    current: FiberId,
    current_update_queue: UpdateQueueHandle,
    render: HostRootRenderPhaseRecord,
    result: &UpdateContainerResult,
) -> Result<(), HostRootUpdateQueueLaneHandoffErrorForCanary> {
    if result.schedule().root() != root_id {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::CrossRootQueueRecord {
                expected: root_id,
                actual: result.schedule().root(),
                update: result.update(),
            },
        );
    }

    if result.queue() != current_update_queue {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::SourceQueueMismatch {
                root: root_id,
                expected: current_update_queue,
                actual: result.queue(),
            },
        );
    }

    if result.queue() == render.work_in_progress_update_queue() {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::SourceQueueMismatch {
                root: root_id,
                expected: current_update_queue,
                actual: result.queue(),
            },
        );
    }

    if result.schedule().fiber() != current {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::ScheduleFiberMismatch {
                root: root_id,
                update: result.update(),
                expected: current,
                actual: result.schedule().fiber(),
            },
        );
    }

    let actual_lanes = store
        .update_queues()
        .update(result.update())?
        .lane()
        .remove_lane(Lane::OFFSCREEN);
    if actual_lanes != result.lane().to_lanes()
        || result.lane_choice().lane() != result.lane()
        || result.schedule().lane() != result.lane()
    {
        return Err(
            HostRootUpdateQueueLaneHandoffErrorForCanary::WrongLaneMetadata {
                root: root_id,
                queue: current_update_queue,
                update: result.update(),
                expected_lane: result.lane(),
                actual_lanes,
            },
        );
    }

    Ok(())
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary {
    queue_handoff: HostRootUpdateQueueLaneHandoffRecordForCanary,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    update_sequence_ids: Vec<UpdateId>,
    selected_lanes: Lanes,
    finished_lanes: Lanes,
    remaining_lanes: Lanes,
    applied_update_count: usize,
    skipped_update_count: usize,
    resulting_element: RootElementHandle,
}

#[cfg(test)]
impl HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary {
    #[must_use]
    pub(crate) fn queue_handoff(&self) -> &HostRootUpdateQueueLaneHandoffRecordForCanary {
        &self.queue_handoff
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    pub(crate) const fn commit(&self) -> &HostRootCommitRecord {
        self.finished_work_handoff.commit()
    }

    #[must_use]
    pub(crate) fn update_sequence_ids(&self) -> &[UpdateId] {
        &self.update_sequence_ids
    }

    #[must_use]
    pub(crate) const fn selected_lanes(&self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub(crate) const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(&self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub(crate) const fn applied_update_count(&self) -> usize {
        self.applied_update_count
    }

    #[must_use]
    pub(crate) const fn skipped_update_count(&self) -> usize {
        self.skipped_update_count
    }

    #[must_use]
    pub(crate) const fn resulting_element(&self) -> RootElementHandle {
        self.resulting_element
    }

    #[must_use]
    pub(crate) fn proves_queue_lane_handoff_gated_current_switch(&self) -> bool {
        self.queue_handoff.proves_source_owned_lane_handoff()
            && self
                .finished_work_handoff
                .proves_private_root_finished_work_commit_metadata_handoff()
            && self.update_sequence_ids == self.queue_handoff.update_sequence_ids()
            && self.update_sequence_ids == self.queue_handoff.current_queue_base_updates()
            && self.selected_lanes == self.queue_handoff.selected_next_lanes_before_render()
            && self.finished_lanes == self.queue_handoff.finished_lanes()
            && self.remaining_lanes == self.queue_handoff.remaining_lanes()
            && self.applied_update_count == self.queue_handoff.applied_update_count()
            && self.skipped_update_count == self.queue_handoff.skipped_update_count()
            && self.resulting_element == self.queue_handoff.resulting_element()
            && self.commit().root() == self.queue_handoff.root()
            && self.commit().previous_current() == self.queue_handoff.current()
            && self.commit().current() == self.queue_handoff.finished_work()
            && self.commit().finished_work() == self.queue_handoff.finished_work()
            && self.commit().finished_lanes() == self.queue_handoff.finished_lanes()
            && self.commit().remaining_lanes() == self.queue_handoff.remaining_lanes()
            && self.commit().pending_lanes() == self.queue_handoff.remaining_lanes()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary {
    MissingQueueHandoff {
        root: FiberRootId,
        finished_work: FiberId,
    },
    QueueLane(HostRootUpdateQueueLaneHandoffErrorForCanary),
    FinishedWork(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    QueueRootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    QueueFiberIdentityMismatch {
        root: FiberRootId,
        expected_current: FiberId,
        actual_current: FiberId,
        expected_finished_work: FiberId,
        actual_finished_work: FiberId,
    },
    QueueHandleMismatch {
        root: FiberRootId,
        expected_current_queue: UpdateQueueHandle,
        actual_current_queue: UpdateQueueHandle,
        expected_work_in_progress_queue: UpdateQueueHandle,
        actual_work_in_progress_queue: UpdateQueueHandle,
    },
    SelectedLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    FinishedLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    RemainingLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    AppliedSkippedCountMismatch {
        root: FiberRootId,
        expected_applied: usize,
        actual_applied: usize,
        expected_skipped: usize,
        actual_skipped: usize,
    },
    ResultingElementMismatch {
        root: FiberRootId,
        expected: RootElementHandle,
        actual: RootElementHandle,
    },
    QueueHandoffNotSourceOwned {
        root: FiberRootId,
        queue: UpdateQueueHandle,
        expected_updates: Vec<UpdateId>,
        actual_updates: Vec<UpdateId>,
        records_in_sequence_order: bool,
    },
}

#[cfg(test)]
impl Display for HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingQueueHandoff {
                root,
                finished_work,
            } => write!(
                formatter,
                "root {} cannot commit finished HostRoot work {} without source-owned queue/lane handoff evidence",
                root.raw(),
                finished_work.slot().get()
            ),
            Self::QueueLane(error) => Display::fmt(error, formatter),
            Self::FinishedWork(error) => Display::fmt(error, formatter),
            Self::QueueRootMismatch { expected, actual } => write!(
                formatter,
                "HostRoot queue/lane commit consumer expected root {}, got queue evidence for root {}",
                expected.raw(),
                actual.raw()
            ),
            Self::QueueFiberIdentityMismatch {
                root,
                expected_current,
                actual_current,
                expected_finished_work,
                actual_finished_work,
            } => write!(
                formatter,
                "root {} queue/lane commit consumer fiber identity mismatch current {}/{} finished {}/{}",
                root.raw(),
                actual_current.slot().get(),
                expected_current.slot().get(),
                actual_finished_work.slot().get(),
                expected_finished_work.slot().get()
            ),
            Self::QueueHandleMismatch {
                root,
                expected_current_queue,
                actual_current_queue,
                expected_work_in_progress_queue,
                actual_work_in_progress_queue,
            } => write!(
                formatter,
                "root {} queue/lane commit consumer queue mismatch current {}/{} work-in-progress {}/{}",
                root.raw(),
                actual_current_queue.raw(),
                expected_current_queue.raw(),
                actual_work_in_progress_queue.raw(),
                expected_work_in_progress_queue.raw()
            ),
            Self::SelectedLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} queue/lane commit consumer selected lanes {:?}/{:?} do not match",
                root.raw(),
                actual,
                expected
            ),
            Self::FinishedLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} queue/lane commit consumer finished lanes {:?}/{:?} do not match",
                root.raw(),
                actual,
                expected
            ),
            Self::RemainingLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} queue/lane commit consumer remaining lanes {:?}/{:?} do not match",
                root.raw(),
                actual,
                expected
            ),
            Self::AppliedSkippedCountMismatch {
                root,
                expected_applied,
                actual_applied,
                expected_skipped,
                actual_skipped,
            } => write!(
                formatter,
                "root {} queue/lane commit consumer applied/skipped counts {}/{} expected {}/{}",
                root.raw(),
                actual_applied,
                actual_skipped,
                expected_applied,
                expected_skipped
            ),
            Self::ResultingElementMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} queue/lane commit consumer resulting element {}/{} does not match",
                root.raw(),
                actual.raw(),
                expected.raw()
            ),
            Self::QueueHandoffNotSourceOwned {
                root,
                queue,
                expected_updates,
                actual_updates,
                records_in_sequence_order,
            } => write!(
                formatter,
                "root {} queue {} queue/lane commit consumer rejected caller-built handoff rows {:?}; expected {:?}; sequence order ok: {}",
                root.raw(),
                queue.raw(),
                actual_updates,
                expected_updates,
                records_in_sequence_order
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::QueueLane(error) => Some(error),
            Self::FinishedWork(error) => Some(error),
            Self::MissingQueueHandoff { .. }
            | Self::QueueRootMismatch { .. }
            | Self::QueueFiberIdentityMismatch { .. }
            | Self::QueueHandleMismatch { .. }
            | Self::SelectedLanesMismatch { .. }
            | Self::FinishedLanesMismatch { .. }
            | Self::RemainingLanesMismatch { .. }
            | Self::AppliedSkippedCountMismatch { .. }
            | Self::ResultingElementMismatch { .. }
            | Self::QueueHandoffNotSourceOwned { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootUpdateQueueLaneHandoffErrorForCanary>
    for HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary
{
    fn from(error: HostRootUpdateQueueLaneHandoffErrorForCanary) -> Self {
        Self::QueueLane(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWork(Box::new(error))
    }
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    reason = "private canary diagnostics preserve queue and finished-work rejection details"
)]
pub(crate) fn commit_host_root_update_queue_lane_handoff_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    render: HostRootRenderPhaseRecord,
    queue_handoff: Option<&HostRootUpdateQueueLaneHandoffRecordForCanary>,
    queue_handoff_order: usize,
    commit_order: usize,
) -> Result<
    HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary,
    HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary,
> {
    let queue_handoff = validate_host_root_update_queue_lane_handoff_for_commit_for_canary(
        store,
        root_id,
        render,
        queue_handoff,
    )?;

    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            store,
            render,
            queue_handoff_order,
            commit_order,
        )?;

    Ok(
        host_root_update_queue_finished_work_commit_handoff_record_for_canary(
            queue_handoff,
            finished_work_handoff,
        ),
    )
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    reason = "private canary diagnostics preserve queue, scheduler, and finished-work rejection details"
)]
pub(crate) fn commit_host_root_update_queue_lane_handoff_with_finished_work_pending_commit_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    render: HostRootRenderPhaseRecord,
    queue_handoff: Option<&HostRootUpdateQueueLaneHandoffRecordForCanary>,
    pending_finished_work: Option<HostRootFinishedWorkPendingCommitRecordForCanary>,
    commit_order: usize,
) -> Result<
    HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary,
    HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary,
> {
    let queue_handoff = validate_host_root_update_queue_lane_handoff_for_commit_for_canary(
        store,
        root_id,
        render,
        queue_handoff,
    )?;

    let finished_work_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        render,
        pending_finished_work,
        commit_order,
    )?;

    Ok(
        host_root_update_queue_finished_work_commit_handoff_record_for_canary(
            queue_handoff,
            finished_work_handoff,
        ),
    )
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    reason = "private canary diagnostics preserve queue and finished-work rejection details"
)]
pub(crate) fn validate_host_root_update_queue_lane_handoff_for_commit_for_canary<
    'a,
    H: HostTypes,
>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    render: HostRootRenderPhaseRecord,
    queue_handoff: Option<&'a HostRootUpdateQueueLaneHandoffRecordForCanary>,
) -> Result<
    &'a HostRootUpdateQueueLaneHandoffRecordForCanary,
    HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary,
> {
    let Some(queue_handoff) = queue_handoff else {
        return Err(
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::MissingQueueHandoff {
                root: root_id,
                finished_work: render.finished_work(),
            },
        );
    };

    validate_host_root_update_queue_lane_handoff_matches_render_for_commit_for_canary(
        root_id,
        render,
        queue_handoff,
    )?;
    validate_host_root_update_queue_lane_handoff_record_for_canary(store, queue_handoff)?;
    validate_host_root_update_queue_lane_handoff_source_rows_for_commit_for_canary(
        store,
        root_id,
        queue_handoff,
    )?;

    Ok(queue_handoff)
}

#[cfg(test)]
fn host_root_update_queue_finished_work_commit_handoff_record_for_canary(
    queue_handoff: &HostRootUpdateQueueLaneHandoffRecordForCanary,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
) -> HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary {
    HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary {
        queue_handoff: queue_handoff.clone(),
        finished_work_handoff,
        update_sequence_ids: queue_handoff.update_sequence_ids(),
        selected_lanes: queue_handoff.selected_next_lanes_before_render(),
        finished_lanes: queue_handoff.finished_lanes(),
        remaining_lanes: queue_handoff.remaining_lanes(),
        applied_update_count: queue_handoff.applied_update_count(),
        skipped_update_count: queue_handoff.skipped_update_count(),
        resulting_element: queue_handoff.resulting_element(),
    }
}

#[cfg(test)]
fn validate_host_root_update_queue_lane_handoff_source_rows_for_commit_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    queue_handoff: &HostRootUpdateQueueLaneHandoffRecordForCanary,
) -> Result<(), HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary> {
    for record in queue_handoff.update_records() {
        let actual_lanes = store
            .update_queues()
            .update(record.update())
            .map_err(HostRootUpdateQueueLaneHandoffErrorForCanary::from)?
            .lane()
            .remove_lane(Lane::OFFSCREEN);
        if actual_lanes != record.source_lanes() || actual_lanes != record.lane().to_lanes() {
            return Err(
                HostRootUpdateQueueLaneHandoffErrorForCanary::WrongLaneMetadata {
                    root: root_id,
                    queue: queue_handoff.current_update_queue(),
                    update: record.update(),
                    expected_lane: record.lane(),
                    actual_lanes,
                }
                .into(),
            );
        }
    }

    Ok(())
}

#[cfg(test)]
fn validate_host_root_update_queue_lane_handoff_matches_render_for_commit_for_canary(
    root_id: FiberRootId,
    render: HostRootRenderPhaseRecord,
    queue_handoff: &HostRootUpdateQueueLaneHandoffRecordForCanary,
) -> Result<(), HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary> {
    if queue_handoff.root() != root_id {
        return Err(
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueRootMismatch {
                expected: root_id,
                actual: queue_handoff.root(),
            },
        );
    }

    if queue_handoff.current() != render.current()
        || queue_handoff.finished_work() != render.finished_work()
    {
        return Err(HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueFiberIdentityMismatch {
            root: root_id,
            expected_current: render.current(),
            actual_current: queue_handoff.current(),
            expected_finished_work: render.finished_work(),
            actual_finished_work: queue_handoff.finished_work(),
        });
    }

    if queue_handoff.current_update_queue() != render.current_update_queue()
        || queue_handoff.work_in_progress_update_queue() != render.work_in_progress_update_queue()
    {
        return Err(
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueHandleMismatch {
                root: root_id,
                expected_current_queue: render.current_update_queue(),
                actual_current_queue: queue_handoff.current_update_queue(),
                expected_work_in_progress_queue: render.work_in_progress_update_queue(),
                actual_work_in_progress_queue: queue_handoff.work_in_progress_update_queue(),
            },
        );
    }

    if queue_handoff.selected_next_lanes_before_render() != render.render_lanes() {
        return Err(
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::SelectedLanesMismatch {
                root: root_id,
                expected: render.render_lanes(),
                actual: queue_handoff.selected_next_lanes_before_render(),
            },
        );
    }

    if queue_handoff.finished_lanes() != render.render_lanes() {
        return Err(
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::FinishedLanesMismatch {
                root: root_id,
                expected: render.render_lanes(),
                actual: queue_handoff.finished_lanes(),
            },
        );
    }

    if queue_handoff.remaining_lanes() != render.remaining_lanes() {
        return Err(
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::RemainingLanesMismatch {
                root: root_id,
                expected: render.remaining_lanes(),
                actual: queue_handoff.remaining_lanes(),
            },
        );
    }

    if queue_handoff.applied_update_count() != render.applied_update_count()
        || queue_handoff.skipped_update_count() != render.skipped_update_count()
    {
        return Err(HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::AppliedSkippedCountMismatch {
            root: root_id,
            expected_applied: render.applied_update_count(),
            actual_applied: queue_handoff.applied_update_count(),
            expected_skipped: render.skipped_update_count(),
            actual_skipped: queue_handoff.skipped_update_count(),
        });
    }

    if queue_handoff.resulting_element() != render.resulting_element() {
        return Err(
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::ResultingElementMismatch {
                root: root_id,
                expected: render.resulting_element(),
                actual: queue_handoff.resulting_element(),
            },
        );
    }

    for record in queue_handoff.update_records() {
        if !record.committed_by_finished_lanes(render.render_lanes())
            || render.remaining_lanes().contains_any(record.source_lanes())
        {
            return Err(
                HostRootUpdateQueueLaneHandoffErrorForCanary::SkippedLaneCommitted {
                    root: root_id,
                    update: record.update(),
                    skipped_lanes: record.source_lanes(),
                    finished_lanes: render.render_lanes(),
                    remaining_lanes: render.remaining_lanes(),
                }
                .into(),
            );
        }
    }

    if !queue_handoff.proves_source_owned_lane_handoff() {
        return Err(HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueHandoffNotSourceOwned {
            root: root_id,
            queue: queue_handoff.current_update_queue(),
            expected_updates: queue_handoff.current_queue_base_updates().to_vec(),
            actual_updates: queue_handoff.update_sequence_ids(),
            records_in_sequence_order: queue_handoff.records_in_update_sequence_order(),
        });
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::RootOptions;
    use crate::root_callbacks::{
        RootUpdateCallbackInvocationErrorHandle, RootUpdateCallbackInvocationExecutionGateStatus,
        RootUpdateCallbackInvocationRequest, RootUpdateCallbackInvocationStatus,
    };
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{commit_finished_host_root, render_host_root_for_lanes};

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id, host)
    }

    #[derive(Default)]
    struct TestRootUpdateCallbackControl {
        calls: Vec<RootUpdateCallbackInvocationRequest>,
    }

    impl TestRootUpdateCallbackControl {
        fn calls(&self) -> &[RootUpdateCallbackInvocationRequest] {
            &self.calls
        }
    }

    impl RootUpdateCallbackInvocationTestControl for TestRootUpdateCallbackControl {
        fn invoke_root_update_callback(
            &mut self,
            request: RootUpdateCallbackInvocationRequest,
        ) -> Result<(), RootUpdateCallbackInvocationErrorHandle> {
            self.calls.push(request);
            Ok(())
        }
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

        let error = host_root_queued_callback_order_snapshot_for_canary(
            &store,
            root_id,
            std::slice::from_ref(&update),
        )
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
            std::slice::from_ref(&accepted),
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
    fn root_updates_host_root_queue_lane_handoff_records_distinct_lane_render_evidence() {
        let (mut store, root_id, host) = root_store();
        let first_element = RootElementHandle::from_raw(8961);
        let second_element = RootElementHandle::from_raw(8962);

        let first = update_container(&mut store, root_id, first_element, None).unwrap();
        let second = update_container_sync(&mut store, root_id, second_element, None).unwrap();
        let selected_lanes = second.selected_next_lanes();
        let render = render_host_root_for_lanes(&mut store, root_id, selected_lanes).unwrap();

        let handoff = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[first.clone(), second.clone()],
            render,
        )
        .unwrap();

        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.current(), render.current());
        assert_eq!(handoff.finished_work(), render.finished_work());
        assert_eq!(
            handoff.current_update_queue(),
            render.current_update_queue()
        );
        assert_eq!(
            handoff.work_in_progress_update_queue(),
            render.work_in_progress_update_queue()
        );
        assert_ne!(
            handoff.current_update_queue(),
            handoff.work_in_progress_update_queue()
        );
        assert_eq!(
            handoff.pending_lanes_before_render(),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
        assert_eq!(
            handoff.selected_next_lanes_before_render(),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
        assert_eq!(handoff.finished_lanes(), Lanes::SYNC.merge(Lanes::DEFAULT));
        assert_eq!(handoff.remaining_lanes(), Lanes::NO);
        assert_eq!(
            handoff.pending_lanes_after_render(),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
        assert_eq!(handoff.applied_update_count(), 2);
        assert_eq!(handoff.skipped_update_count(), 0);
        assert_eq!(handoff.resulting_element(), second_element);
        assert_eq!(
            handoff.update_sequence_ids(),
            vec![first.update(), second.update()]
        );
        assert_eq!(
            handoff.current_queue_base_updates(),
            &[first.update(), second.update()]
        );
        assert!(handoff.records_in_update_sequence_order());
        assert!(handoff.records_have_distinct_compatible_lanes());
        assert!(handoff.root_current_not_switched_by_handoff());
        assert!(handoff.work_loop_or_commit_consumer_required());
        assert!(handoff.public_root_rendering_blocked());
        assert!(handoff.proves_source_owned_lane_handoff());

        let records = handoff.update_records();
        assert_eq!(records[0].sequence(), 0);
        assert_eq!(records[0].update(), first.update());
        assert_eq!(records[0].lane(), Lane::DEFAULT);
        assert_eq!(records[0].source_lanes(), Lanes::DEFAULT);
        assert_eq!(records[0].pending_lanes_after_enqueue(), Lanes::DEFAULT);
        assert_eq!(
            records[0].selected_next_lanes_after_enqueue(),
            Lanes::DEFAULT
        );
        assert!(records[0].committed_by_finished_lanes(handoff.finished_lanes()));
        assert_eq!(records[1].sequence(), 1);
        assert_eq!(records[1].update(), second.update());
        assert_eq!(records[1].lane(), Lane::SYNC);
        assert_eq!(records[1].source_lanes(), Lanes::SYNC);
        assert_eq!(
            records[1].pending_lanes_after_enqueue(),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
        assert_eq!(
            records[1].selected_next_lanes_after_enqueue(),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
        assert!(records[1].committed_by_finished_lanes(handoff.finished_lanes()));

        validate_host_root_update_queue_lane_handoff_record_for_canary(&store, &handoff).unwrap();
        assert_eq!(store.root(root_id).unwrap().current(), render.current());
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_updates_host_root_queue_lane_handoff_rejects_stale_after_another_update() {
        let (mut store, root_id, _host) = root_store();
        let first =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8963), None).unwrap();
        let second =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(8964), None)
                .unwrap();
        let stale_extra =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8965), None).unwrap();
        let render =
            render_host_root_for_lanes(&mut store, root_id, second.selected_next_lanes()).unwrap();

        let error = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[first.clone(), second.clone()],
            render,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueLaneHandoffErrorForCanary::QueueOrderMismatch {
                root: root_id,
                queue: first.queue(),
                expected_updates: vec![first.update(), second.update()],
                actual_updates: vec![first.update(), second.update(), stale_extra.update()]
            }
        );
    }

    #[test]
    fn root_updates_host_root_queue_lane_handoff_rejects_wrong_lane_metadata() {
        let (mut store, root_id, _host) = root_store();
        let first =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8966), None).unwrap();
        let second =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(8967), None)
                .unwrap();
        let render =
            render_host_root_for_lanes(&mut store, root_id, second.selected_next_lanes()).unwrap();
        let mut wrong_lane = second.clone();
        wrong_lane.lane = Lane::DEFAULT;
        wrong_lane.lane_choice = first.lane_choice();
        wrong_lane.schedule = RootScheduleUpdateRecord {
            lane: Lane::DEFAULT,
            ..wrong_lane.schedule
        };

        let error = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[first, wrong_lane],
            render,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueLaneHandoffErrorForCanary::WrongLaneMetadata {
                root: root_id,
                queue: second.queue(),
                update: second.update(),
                expected_lane: Lane::DEFAULT,
                actual_lanes: Lanes::SYNC
            }
        );
    }

    #[test]
    fn root_updates_host_root_queue_lane_handoff_rejects_cross_root_records() {
        let (mut store, root_id, _host) = root_store();
        let other_root = store
            .create_client_root(FakeContainer::new(896), RootOptions::new())
            .unwrap();
        let wrong_root_update =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8968), None).unwrap();
        let other_update = update_container(
            &mut store,
            other_root,
            RootElementHandle::from_raw(8969),
            None,
        )
        .unwrap();
        let render =
            render_host_root_for_lanes(&mut store, other_root, other_update.selected_next_lanes())
                .unwrap();

        let error = host_root_update_queue_lane_handoff_for_canary(
            &store,
            other_root,
            std::slice::from_ref(&wrong_root_update),
            render,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueLaneHandoffErrorForCanary::CrossRootQueueRecord {
                expected: other_root,
                actual: root_id,
                update: wrong_root_update.update()
            }
        );
    }

    #[test]
    fn root_updates_host_root_queue_lane_handoff_rejects_caller_built_cloned_queue_rows() {
        let (mut store, root_id, _host) = root_store();
        let first =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8970), None).unwrap();
        let second =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(8971), None)
                .unwrap();
        let render =
            render_host_root_for_lanes(&mut store, root_id, second.selected_next_lanes()).unwrap();
        let mut caller_built = first.clone();
        caller_built.queue = render.work_in_progress_update_queue();

        let error = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[caller_built, second],
            render,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueLaneHandoffErrorForCanary::SourceQueueMismatch {
                root: root_id,
                expected: first.queue(),
                actual: render.work_in_progress_update_queue()
            }
        );
    }

    #[test]
    fn root_updates_host_root_queue_lane_handoff_rejects_replayed_records_after_commit() {
        let (mut store, root_id, _host) = root_store();
        let first =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8972), None).unwrap();
        let second =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(8973), None)
                .unwrap();
        let render =
            render_host_root_for_lanes(&mut store, root_id, second.selected_next_lanes()).unwrap();
        let handoff = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[first, second],
            render,
        )
        .unwrap();
        validate_host_root_update_queue_lane_handoff_record_for_canary(&store, &handoff).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let error =
            validate_host_root_update_queue_lane_handoff_record_for_canary(&store, &handoff)
                .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueLaneHandoffErrorForCanary::ReplayedHandoffRecord {
                root: root_id,
                expected_current: render.current(),
                actual_current: commit.current()
            }
        );
        assert_eq!(commit.current(), render.finished_work());
    }

    #[test]
    fn root_updates_host_root_queue_lane_handoff_rejects_treating_skipped_lanes_as_committed() {
        let (mut store, root_id, _host) = root_store();
        let skipped_default =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8974), None).unwrap();
        let committed_sync =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(8975), None)
                .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();

        let error = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[skipped_default.clone(), committed_sync],
            render,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueLaneHandoffErrorForCanary::SkippedLaneCommitted {
                root: root_id,
                update: skipped_default.update(),
                skipped_lanes: Lanes::DEFAULT,
                finished_lanes: Lanes::SYNC,
                remaining_lanes: Lanes::DEFAULT
            }
        );
        assert_eq!(render.applied_update_count(), 1);
        assert_eq!(render.skipped_update_count(), 1);
        assert_eq!(render.remaining_lanes(), Lanes::DEFAULT);
    }

    #[test]
    fn root_updates_same_transition_multi_update_handoff_rejects_extra_third_row() {
        let (mut store, root_id, _host) = root_store();
        let first = update_container_transition_for_canary(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(8976),
            None,
        )
        .unwrap();
        let second = update_container_transition_for_canary(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(8977),
            None,
        )
        .unwrap();
        let third = update_container_transition_for_canary(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(8978),
            None,
        )
        .unwrap();
        let render =
            render_host_root_for_lanes(&mut store, root_id, third.selected_next_lanes()).unwrap();
        let handoff = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[first.clone(), second.clone(), third.clone()],
            render,
        )
        .unwrap();

        assert_eq!(render.applied_update_count(), 3);
        assert_eq!(render.skipped_update_count(), 0);
        assert_eq!(handoff.update_records().len(), 3);
        assert_eq!(
            handoff.update_sequence_ids(),
            vec![first.update(), second.update(), third.update()]
        );
        assert_eq!(
            handoff.current_queue_base_updates(),
            &[first.update(), second.update(), third.update()]
        );
        assert!(handoff.records_in_update_sequence_order());
        assert_eq!(handoff.finished_lanes(), Lanes::from(Lane::TRANSITION_1));
        assert_eq!(handoff.remaining_lanes(), Lanes::NO);
        assert!(!handoff.proves_source_owned_lane_handoff());
        assert!(
            !handoff
                .proves_same_transition_multi_update_lane_handoff_for_canary(Lane::TRANSITION_1)
        );
    }

    #[test]
    fn root_updates_queue_lane_handoff_gates_finished_work_commit_current_switch() {
        let (mut store, root_id, host) = root_store();
        let first_element = RootElementHandle::from_raw(8981);
        let second_element = RootElementHandle::from_raw(8982);

        let first = update_container(&mut store, root_id, first_element, None).unwrap();
        let second = update_container_sync(&mut store, root_id, second_element, None).unwrap();
        let selected_lanes = second.selected_next_lanes();
        let render = render_host_root_for_lanes(&mut store, root_id, selected_lanes).unwrap();
        let handoff = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[first.clone(), second.clone()],
            render,
        )
        .unwrap();

        let commit_handoff = commit_host_root_update_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            render,
            Some(&handoff),
            898,
            899,
        )
        .unwrap();

        assert_eq!(commit_handoff.queue_handoff(), &handoff);
        assert_eq!(
            commit_handoff.update_sequence_ids(),
            vec![first.update(), second.update()]
        );
        assert_eq!(commit_handoff.selected_lanes(), selected_lanes);
        assert_eq!(commit_handoff.finished_lanes(), selected_lanes);
        assert_eq!(commit_handoff.remaining_lanes(), Lanes::NO);
        assert_eq!(commit_handoff.applied_update_count(), 2);
        assert_eq!(commit_handoff.skipped_update_count(), 0);
        assert_eq!(commit_handoff.resulting_element(), second_element);
        assert!(commit_handoff.proves_queue_lane_handoff_gated_current_switch());

        let finished_work_handoff = commit_handoff.finished_work_handoff();
        assert!(finished_work_handoff.proves_private_root_finished_work_commit_metadata_handoff());
        assert_eq!(
            finished_work_handoff.pending().root_finished_work(),
            Some(render.finished_work())
        );
        assert_eq!(
            finished_work_handoff.pending().root_finished_lanes(),
            selected_lanes
        );
        let commit = commit_handoff.commit();
        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.previous_current(), render.current());
        assert_eq!(commit.current(), render.finished_work());
        assert_eq!(commit.finished_lanes(), selected_lanes);
        assert_eq!(commit.remaining_lanes(), Lanes::NO);
        assert_eq!(commit.pending_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_updates_queue_lane_commit_consumer_rejects_missing_queue_handoff() {
        let (mut store, root_id, _host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(8983), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let error = commit_host_root_update_queue_lane_handoff_for_canary(
            &mut store, root_id, render, None, 900, 901,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::MissingQueueHandoff {
                root: root_id,
                finished_work: render.finished_work()
            }
        );
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.finished_work())
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    }

    #[test]
    fn root_updates_queue_lane_commit_consumer_rejects_stale_handoff_after_another_update() {
        let (mut store, root_id, _host) = root_store();
        let first =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8984), None).unwrap();
        let second =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(8985), None)
                .unwrap();
        let render =
            render_host_root_for_lanes(&mut store, root_id, second.selected_next_lanes()).unwrap();
        let handoff = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[first.clone(), second.clone()],
            render,
        )
        .unwrap();
        let stale_extra =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8986), None).unwrap();

        let error = commit_host_root_update_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            render,
            Some(&handoff),
            902,
            903,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::QueueOrderMismatch {
                    root: root_id,
                    queue: first.queue(),
                    expected_updates: vec![first.update(), second.update()],
                    actual_updates: vec![first.update(), second.update(), stale_extra.update()]
                }
            )
        );
        assert_eq!(store.root(root_id).unwrap().current(), render.current());
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    }

    #[test]
    fn root_updates_queue_lane_commit_consumer_rejects_wrong_finished_lanes() {
        let (mut store, root_id, _host) = root_store();
        let first =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8987), None).unwrap();
        let second =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(8988), None)
                .unwrap();
        let render =
            render_host_root_for_lanes(&mut store, root_id, second.selected_next_lanes()).unwrap();
        let mut handoff = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[first, second],
            render,
        )
        .unwrap();
        handoff.finished_lanes = Lanes::DEFAULT;

        let error = commit_host_root_update_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            render,
            Some(&handoff),
            904,
            905,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::FinishedLanesMismatch {
                root: root_id,
                expected: render.render_lanes(),
                actual: Lanes::DEFAULT
            }
        );
        assert_eq!(store.root(root_id).unwrap().current(), render.current());
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    }

    #[test]
    fn root_updates_queue_lane_commit_consumer_rejects_cross_root_queue_handoff() {
        let (mut store, root_id, _host) = root_store();
        let other_root = store
            .create_client_root(FakeContainer::new(898), RootOptions::new())
            .unwrap();
        let source_update =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8989), None).unwrap();
        let source_render =
            render_host_root_for_lanes(&mut store, root_id, source_update.selected_next_lanes())
                .unwrap();
        let source_handoff = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            std::slice::from_ref(&source_update),
            source_render,
        )
        .unwrap();
        let other_update = update_container(
            &mut store,
            other_root,
            RootElementHandle::from_raw(8990),
            None,
        )
        .unwrap();
        let other_render =
            render_host_root_for_lanes(&mut store, other_root, other_update.selected_next_lanes())
                .unwrap();

        let error = commit_host_root_update_queue_lane_handoff_for_canary(
            &mut store,
            other_root,
            other_render,
            Some(&source_handoff),
            906,
            907,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueRootMismatch {
                expected: other_root,
                actual: root_id
            }
        );
        assert_eq!(
            store.root(other_root).unwrap().current(),
            other_render.current()
        );
        assert_eq!(store.root(other_root).unwrap().finished_work(), None);
    }

    #[test]
    fn root_updates_queue_lane_commit_consumer_rejects_caller_built_cloned_handoff_rows() {
        let (mut store, root_id, _host) = root_store();
        let first =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8991), None).unwrap();
        let second =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(8992), None)
                .unwrap();
        let render =
            render_host_root_for_lanes(&mut store, root_id, second.selected_next_lanes()).unwrap();
        let handoff = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[first.clone(), second.clone()],
            render,
        )
        .unwrap();
        let mut caller_built = handoff.clone();
        caller_built.update_records[0] = caller_built.update_records[1];

        let error = commit_host_root_update_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            render,
            Some(&caller_built),
            908,
            909,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueHandoffNotSourceOwned {
                root: root_id,
                queue: handoff.current_update_queue(),
                expected_updates: vec![first.update(), second.update()],
                actual_updates: vec![second.update(), second.update()],
                records_in_sequence_order: false
            }
        );
        assert_eq!(store.root(root_id).unwrap().current(), render.current());
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    }

    #[test]
    fn root_updates_queue_lane_commit_consumer_rejects_forged_row_lane_metadata() {
        let (mut store, root_id, _host) = root_store();
        let first =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8997), None).unwrap();
        let second =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(8998), None)
                .unwrap();
        let render =
            render_host_root_for_lanes(&mut store, root_id, second.selected_next_lanes()).unwrap();
        let handoff = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[first.clone(), second],
            render,
        )
        .unwrap();
        let mut forged = handoff.clone();
        forged.update_records[0].lane = Lane::INPUT_CONTINUOUS;

        let error = commit_host_root_update_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            render,
            Some(&forged),
            916,
            917,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::WrongLaneMetadata {
                    root: root_id,
                    queue: handoff.current_update_queue(),
                    update: first.update(),
                    expected_lane: Lane::INPUT_CONTINUOUS,
                    actual_lanes: Lanes::DEFAULT
                }
            )
        );
        assert_eq!(forged.update_sequence_ids(), handoff.update_sequence_ids());
        assert!(forged.records_in_update_sequence_order());
        assert!(forged.proves_source_owned_lane_handoff());
        assert_eq!(store.root(root_id).unwrap().current(), render.current());
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    }

    #[test]
    fn root_updates_queue_lane_commit_consumer_rejects_replayed_handoff_after_commit() {
        let (mut store, root_id, _host) = root_store();
        let first =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8993), None).unwrap();
        let second =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(8994), None)
                .unwrap();
        let render =
            render_host_root_for_lanes(&mut store, root_id, second.selected_next_lanes()).unwrap();
        let handoff = host_root_update_queue_lane_handoff_for_canary(
            &store,
            root_id,
            &[first, second],
            render,
        )
        .unwrap();
        let first_commit = commit_host_root_update_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            render,
            Some(&handoff),
            910,
            911,
        )
        .unwrap();

        let error = commit_host_root_update_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            render,
            Some(&handoff),
            912,
            913,
        )
        .unwrap_err();

        assert!(first_commit.proves_queue_lane_handoff_gated_current_switch());
        assert_eq!(
            error,
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::ReplayedHandoffRecord {
                    root: root_id,
                    expected_current: render.current(),
                    actual_current: render.finished_work()
                }
            )
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
    }

    #[test]
    fn root_updates_queue_lane_commit_consumer_rejects_skipped_lane_as_committed() {
        let (mut store, root_id, _host) = root_store();
        let skipped_default =
            update_container(&mut store, root_id, RootElementHandle::from_raw(8995), None).unwrap();
        let committed_sync =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(8996), None)
                .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
        let forged_handoff = HostRootUpdateQueueLaneHandoffRecordForCanary {
            root: root_id,
            current: render.current(),
            finished_work: render.finished_work(),
            current_update_queue: render.current_update_queue(),
            work_in_progress_update_queue: render.work_in_progress_update_queue(),
            pending_lanes_before_render: Lanes::SYNC.merge(Lanes::DEFAULT),
            selected_next_lanes_before_render: Lanes::SYNC,
            finished_lanes: Lanes::SYNC,
            remaining_lanes: Lanes::DEFAULT,
            pending_lanes_after_render: Lanes::SYNC.merge(Lanes::DEFAULT),
            update_records: vec![
                HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                    sequence: 0,
                    update: skipped_default.update(),
                    lane: skipped_default.lane(),
                    source_lanes: Lanes::DEFAULT,
                    pending_lanes_after_enqueue: skipped_default.pending_lanes_after_enqueue(),
                    selected_next_lanes_after_enqueue: skipped_default.selected_next_lanes(),
                },
                HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                    sequence: 1,
                    update: committed_sync.update(),
                    lane: committed_sync.lane(),
                    source_lanes: Lanes::SYNC,
                    pending_lanes_after_enqueue: committed_sync.pending_lanes_after_enqueue(),
                    selected_next_lanes_after_enqueue: committed_sync.selected_next_lanes(),
                },
            ],
            current_queue_base_updates: vec![skipped_default.update(), committed_sync.update()],
            applied_update_count: render.applied_update_count(),
            skipped_update_count: render.skipped_update_count(),
            resulting_element: render.resulting_element(),
        };

        let error = commit_host_root_update_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            render,
            Some(&forged_handoff),
            914,
            915,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::SkippedLaneCommitted {
                    root: root_id,
                    update: skipped_default.update(),
                    skipped_lanes: Lanes::DEFAULT,
                    finished_lanes: Lanes::SYNC,
                    remaining_lanes: Lanes::DEFAULT
                }
            )
        );
        assert_eq!(render.applied_update_count(), 1);
        assert_eq!(render.skipped_update_count(), 1);
        assert_eq!(store.root(root_id).unwrap().current(), render.current());
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    }

    #[test]
    fn root_updates_callback_order_invokes_accepted_visible_callbacks_after_matching_commit() {
        let (mut store, root_id, host) = root_store();
        let first_callback = RootUpdateCallbackHandle::from_raw(5981);
        let second_callback = RootUpdateCallbackHandle::from_raw(5982);
        let first = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(5981),
            Some(first_callback),
        )
        .unwrap();
        let second = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(5982),
            Some(second_callback),
        )
        .unwrap();
        let accepted = host_root_queued_callback_order_snapshot_for_canary(
            &store,
            root_id,
            &[first.clone(), second.clone()],
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let mut control = TestRootUpdateCallbackControl::default();

        let invocation =
            invoke_host_root_accepted_visible_callbacks_after_matching_commit_under_test_control_for_canary(
                &accepted,
                &mut commit,
                &mut control,
            )
            .unwrap();

        assert_eq!(invocation.root(), root_id);
        assert_eq!(invocation.queue(), commit.root_update_callbacks().queue());
        assert_eq!(invocation.finished_work(), commit.finished_work());
        assert_eq!(invocation.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(invocation.pending_lanes_after_commit(), Lanes::NO);
        assert_eq!(invocation.accepted_order_record_count(), 2);
        assert_eq!(invocation.len(), 2);
        assert_eq!(invocation.completed_count(), 2);
        assert_eq!(invocation.error_count(), 0);
        assert!(invocation.invoked_accepted_visible_callbacks());
        assert!(invocation.records_in_deterministic_commit_order());
        assert!(!invocation.public_js_callbacks_invoked());
        assert!(!invocation.public_root_callback_behavior_exposed());
        assert!(!invocation.hidden_callbacks_invoked());
        assert!(!invocation.root_error_callbacks_invoked());

        let execution = invocation.execution();
        assert_eq!(
            execution.status(),
            RootUpdateCallbackInvocationExecutionGateStatus::TestControlOnly
        );
        assert!(execution.records_in_invocation_order());
        assert!(execution.records_are_visible());
        assert!(!execution.public_js_callbacks_invoked());
        assert!(!execution.public_root_callback_behavior_exposed());
        assert!(!execution.hidden_callbacks_invoked());
        assert!(!execution.root_error_callbacks_invoked());
        let records = execution.records();
        assert_eq!(records[0].update(), first.update());
        assert_eq!(records[0].callback(), first_callback);
        assert_eq!(
            records[0].status(),
            RootUpdateCallbackInvocationStatus::Completed
        );
        assert_eq!(records[1].update(), second.update());
        assert_eq!(records[1].callback(), second_callback);
        assert_eq!(
            records[1].status(),
            RootUpdateCallbackInvocationStatus::Completed
        );
        assert_eq!(control.calls().len(), 2);
        assert_eq!(control.calls()[0].callback(), first_callback);
        assert_eq!(control.calls()[1].callback(), second_callback);
        assert!(commit.root_update_callback_invocation_gate().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_updates_multiple_host_root_updates_reduce_to_stable_commit_handoff() {
        let (mut store, root_id, host) = root_store();
        let first_element = RootElementHandle::from_raw(6861);
        let second_element = RootElementHandle::from_raw(6862);
        let third_element = RootElementHandle::from_raw(6863);
        let first_callback = RootUpdateCallbackHandle::from_raw(68611);
        let second_callback = RootUpdateCallbackHandle::from_raw(68612);
        let third_callback = RootUpdateCallbackHandle::from_raw(68613);
        let first =
            update_container(&mut store, root_id, first_element, Some(first_callback)).unwrap();
        let second =
            update_container(&mut store, root_id, second_element, Some(second_callback)).unwrap();
        let third =
            update_container(&mut store, root_id, third_element, Some(third_callback)).unwrap();
        let accepted = host_root_queued_callback_order_snapshot_for_canary(
            &store,
            root_id,
            &[first.clone(), second.clone(), third.clone()],
        )
        .unwrap();

        assert_eq!(accepted.len(), 3);
        assert!(accepted.records_in_queue_order());
        assert!(accepted.records_match_accepted_lane_and_schedule());
        assert!(accepted.root_rendering_blocked());
        assert!(accepted.commit_execution_blocked());
        assert!(accepted.callback_invocation_blocked());
        assert!(!accepted.user_callbacks_invoked());
        assert!(!accepted.public_root_callback_behavior_exposed());
        assert!(!accepted.public_batching_compatibility_claimed());
        assert_eq!(
            accepted
                .records()
                .iter()
                .map(|record| record.update())
                .collect::<Vec<_>>(),
            vec![first.update(), second.update(), third.update()]
        );

        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let render_state = store
            .host_root_states()
            .get(render.memoized_state())
            .unwrap();

        assert_eq!(render.applied_update_count(), 3);
        assert_eq!(render.skipped_update_count(), 0);
        assert_eq!(render.remaining_lanes(), Lanes::NO);
        assert_eq!(render.resulting_element(), third_element);
        assert_eq!(render_state.element(), third_element);
        assert_eq!(
            store
                .update_queues()
                .base_updates(render.work_in_progress_update_queue())
                .unwrap(),
            Vec::<UpdateId>::new()
        );
        assert_eq!(
            store
                .update_queues()
                .peek_root_update_callback_records(render.work_in_progress_update_queue())
                .unwrap()
                .visible()
                .iter()
                .map(|record| record.callback())
                .collect::<Vec<_>>(),
            vec![first_callback, second_callback, third_callback]
        );

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        {
            let callbacks = commit.root_update_callbacks();
            assert_eq!(callbacks.queue(), render.work_in_progress_update_queue());
            assert_eq!(
                callbacks
                    .visible()
                    .iter()
                    .map(|record| record.update())
                    .collect::<Vec<_>>(),
                vec![first.update(), second.update(), third.update()]
            );
            assert_eq!(
                callbacks
                    .visible()
                    .iter()
                    .map(|record| record.callback())
                    .collect::<Vec<_>>(),
                vec![first_callback, second_callback, third_callback]
            );
            assert_eq!(
                callbacks
                    .visible()
                    .iter()
                    .map(|record| record.sequence())
                    .collect::<Vec<_>>(),
                vec![0, 1, 2]
            );
            assert!(callbacks.hidden().is_empty());
            assert!(callbacks.deferred_hidden().is_empty());
        }

        let committed_state = store
            .host_root_states()
            .get(
                store
                    .fiber_arena()
                    .get(commit.current())
                    .unwrap()
                    .memoized_state(),
            )
            .unwrap();
        assert_eq!(commit.previous_current(), render.current());
        assert_eq!(commit.current(), render.finished_work());
        assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(commit.remaining_lanes(), Lanes::NO);
        assert_eq!(commit.pending_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(committed_state.element(), third_element);

        let mut control = TestRootUpdateCallbackControl::default();
        let invocation =
            invoke_host_root_accepted_visible_callbacks_after_matching_commit_under_test_control_for_canary(
                &accepted,
                &mut commit,
                &mut control,
            )
            .unwrap();

        assert_eq!(invocation.root(), root_id);
        assert_eq!(invocation.finished_work(), render.finished_work());
        assert_eq!(invocation.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(invocation.pending_lanes_after_commit(), Lanes::NO);
        assert_eq!(invocation.accepted_order_record_count(), 3);
        assert_eq!(invocation.len(), 3);
        assert_eq!(invocation.completed_count(), 3);
        assert_eq!(invocation.error_count(), 0);
        assert!(invocation.invoked_accepted_visible_callbacks());
        assert!(invocation.records_in_deterministic_commit_order());
        assert!(!invocation.public_js_callbacks_invoked());
        assert!(!invocation.public_root_callback_behavior_exposed());
        assert!(!invocation.hidden_callbacks_invoked());
        assert!(!invocation.root_error_callbacks_invoked());

        let records = invocation.execution().records();
        assert_eq!(
            records
                .iter()
                .map(|record| record.update())
                .collect::<Vec<_>>(),
            vec![first.update(), second.update(), third.update()]
        );
        assert_eq!(
            records
                .iter()
                .map(|record| record.callback())
                .collect::<Vec<_>>(),
            vec![first_callback, second_callback, third_callback]
        );
        assert_eq!(
            records
                .iter()
                .map(|record| record.accepted_sequence())
                .collect::<Vec<_>>(),
            vec![0, 1, 2]
        );
        assert_eq!(control.calls().len(), 3);
        assert_eq!(control.calls()[0].callback(), first_callback);
        assert_eq!(control.calls()[1].callback(), second_callback);
        assert_eq!(control.calls()[2].callback(), third_callback);
        assert!(commit.root_update_callback_invocation_gate().is_empty());
        assert_eq!(store.root_scheduler().first_scheduled_root(), None);
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_updates_callback_order_invocation_gate_rejects_hidden_callback_before_invocation() {
        let (mut store, root_id, _host) = root_store();
        let first = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(5983),
            Some(RootUpdateCallbackHandle::from_raw(5983)),
        )
        .unwrap();
        let hidden_callback = RootUpdateCallbackHandle::from_raw(5984);
        let hidden = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(5984),
            Some(hidden_callback),
        )
        .unwrap();
        let second = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(5985),
            Some(RootUpdateCallbackHandle::from_raw(5985)),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(hidden.update())
            .unwrap();
        let accepted = host_root_queued_callback_order_snapshot_for_canary(
            &store,
            root_id,
            &[first, hidden.clone(), second],
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let mut control = TestRootUpdateCallbackControl::default();

        let error =
            invoke_host_root_accepted_visible_callbacks_after_matching_commit_under_test_control_for_canary(
                &accepted,
                &mut commit,
                &mut control,
            )
            .unwrap_err();

        assert_eq!(
            error,
            RootUpdateError::HiddenOrDeferredCallbackSnapshotRejected {
                root: root_id,
                queue: commit.root_update_callbacks().queue(),
                update: hidden.update(),
                callback: hidden_callback,
                visibility: RootUpdateCallbackVisibility::DeferredHidden
            }
        );
        assert!(control.calls().is_empty());
        assert_eq!(commit.root_update_callback_invocation_gate().len(), 2);
    }

    #[test]
    fn root_updates_callback_order_rejects_stale_after_partial_commit() {
        let (mut store, root_id, _host) = root_store();
        let default_callback = RootUpdateCallbackHandle::from_raw(5986);
        let sync_callback = RootUpdateCallbackHandle::from_raw(5987);
        let default_update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(5986),
            Some(default_callback),
        )
        .unwrap();
        let sync_update = update_container_sync(
            &mut store,
            root_id,
            RootElementHandle::from_raw(5987),
            Some(sync_callback),
        )
        .unwrap();
        let accepted = host_root_queued_callback_order_snapshot_for_canary(
            &store,
            root_id,
            &[default_update.clone(), sync_update.clone()],
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let mut control = TestRootUpdateCallbackControl::default();

        let error =
            invoke_host_root_accepted_visible_callbacks_after_matching_commit_under_test_control_for_canary(
                &accepted,
                &mut commit,
                &mut control,
            )
            .unwrap_err();

        assert_eq!(
            error,
            RootUpdateError::StaleCallbackOrderSnapshotAfterCommit {
                root: root_id,
                queue: commit.root_update_callbacks().queue(),
                expected_updates: vec![default_update.update(), sync_update.update()],
                actual_visible_updates: vec![sync_update.update()],
                expected_callbacks: vec![default_callback, sync_callback],
                actual_visible_callbacks: vec![sync_callback]
            }
        );
        assert!(control.calls().is_empty());
        assert_eq!(commit.root_update_callback_invocation_gate().len(), 1);
    }

    #[test]
    fn root_updates_callback_order_rejects_wrong_root_before_invocation() {
        let (mut store, root_id, _host) = root_store();
        let other_root = store
            .create_client_root(FakeContainer::new(598), RootOptions::new())
            .unwrap();
        let callback = RootUpdateCallbackHandle::from_raw(5988);
        let accepted_update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(5988),
            Some(callback),
        )
        .unwrap();
        let accepted = host_root_queued_callback_order_snapshot_for_canary(
            &store,
            root_id,
            std::slice::from_ref(&accepted_update),
        )
        .unwrap();
        update_container(
            &mut store,
            other_root,
            RootElementHandle::from_raw(5989),
            Some(RootUpdateCallbackHandle::from_raw(5989)),
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, other_root, Lanes::DEFAULT).unwrap();
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let mut control = TestRootUpdateCallbackControl::default();

        let error =
            invoke_host_root_accepted_visible_callbacks_after_matching_commit_under_test_control_for_canary(
                &accepted,
                &mut commit,
                &mut control,
            )
            .unwrap_err();

        assert_eq!(
            error,
            RootUpdateError::WrongRootCallbackHandle {
                expected: other_root,
                actual: root_id,
                queue: accepted.queue(),
                callback
            }
        );
        assert!(control.calls().is_empty());
        assert_eq!(commit.root_update_callback_invocation_gate().len(), 1);
    }

    #[test]
    fn root_updates_entangle_transition_update_but_do_not_schedule_work() {
        let (mut store, root_id, _host) = root_store();

        let result = update_container_transition_for_canary(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(1),
            None,
        )
        .unwrap();

        assert_eq!(
            result.entanglement().unwrap().entangled_lanes(),
            Lanes::from(Lane::TRANSITION_1)
        );
        assert_eq!(
            result.source_priority(),
            RootUpdateLaneSourcePriority::TransitionLane
        );
        assert!(!result.public_batching_compatibility_claimed());
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
    fn root_updates_transition_lane_canary_rejects_non_transition_lanes() {
        let (mut store, root_id, _host) = root_store();

        for lane in [Lane::SYNC, Lane::DEFAULT, Lane::OFFSCREEN] {
            let error = update_container_transition_for_canary(
                &mut store,
                root_id,
                lane,
                RootElementHandle::from_raw(1),
                None,
            )
            .unwrap_err();

            assert_eq!(error, RootUpdateError::UnsupportedTransitionLane { lane });
            assert_eq!(
                store.root(root_id).unwrap().lanes().pending_lanes(),
                Lanes::NO
            );
        }
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
