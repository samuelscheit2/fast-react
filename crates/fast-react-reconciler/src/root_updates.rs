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
