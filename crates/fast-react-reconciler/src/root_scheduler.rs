//! Internal FiberRoot scheduler foundation.
//!
//! This module models the React-style scheduled-root list and per-root
//! callback bookkeeping on top of HostRoot update records. Most scheduler
//! helpers remain planning-only; the public sync-flush record path may render
//! HostRoot lanes for a later commit handoff, while one crate-private sync
//! continuation can consume an accepted handoff without opening broad
//! scheduler compatibility, passive effects, or public host containers. A
//! test-only transition continuation extends that same private handoff proof
//! across transition entanglement diagnostics.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    EventPriority, FiberId, FiberTag, Lane, LaneTimestamp, Lanes, RootLaneState, UpdateQueueHandle,
    lanes_to_event_priority,
};
#[cfg(test)]
use fast_react_core::{FiberTopologyError, StateNodeHandle};
use fast_react_host_config::HostTypes;

#[cfg(test)]
use crate::RootRenderExitStatus;
use crate::begin_work::UnsupportedSuspenseChildShapeRecord;
use crate::concurrent_updates::{mark_update_lane_from_fiber_to_root, root_for_updated_fiber};
use crate::root_commit::HostRootCommitRecord;
#[cfg(test)]
use crate::root_commit::{
    HostRootFinishedWorkCommitHandoffErrorForCanary,
    HostRootFinishedWorkCommitHandoffRecordForCanary,
    commit_finished_host_root_with_finished_work_handoff_for_canary,
    record_host_root_finished_work_pending_commit_for_canary,
};
use crate::root_config::{RootErrorOptionCallbackPhase, RootErrorOptionCallbackRecord};
use crate::root_updates::validate_update_container_lane_diagnostics_for_canary;
#[cfg(test)]
use crate::root_updates::{
    HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary,
    HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary,
    HostRootUpdateQueueLaneHandoffRecordForCanary,
    commit_host_root_update_queue_lane_handoff_with_finished_work_pending_commit_for_canary,
    validate_host_root_update_queue_lane_handoff_for_commit_for_canary,
};
#[cfg(test)]
use crate::scheduler_bridge::SchedulerActContinuationStatus;
use crate::scheduler_bridge::SchedulerPassiveEffectsFlushRequest;
use crate::{
    ConcurrentUpdateError, ExecutionContextState, FiberRootId, FiberRootStore, FiberRootStoreError,
    HostRootRenderPhaseRecord, RootCallbackPriority, RootCommitError, RootErrorCallbackHandle,
    RootRecoverableErrorCallbackHandle, RootScheduleUpdateRecord, RootSchedulerCallbackHandle,
    RootTransitionEntanglementRecord, RootUpdateError, RootUpdateLaneSourcePriority,
    RootWorkLoopError, SchedulerActQueueRequest, SchedulerBridge, SchedulerCallbackRequest,
    SchedulerCallbackValidationRecord, SchedulerCancellationRecord, SchedulerMicrotaskKind,
    SchedulerMicrotaskRequest, SchedulerPriority, UpdateContainerResult, UpdateId,
    render_host_root_for_lanes, render_host_root_via_scheduler_callback,
    validate_scheduled_host_root_callback,
};
#[cfg(test)]
use crate::{RootElementHandle, UpdateQueueError};

mod act;
mod continuations;

#[cfg(test)]
#[allow(
    unused_imports,
    reason = "test-only continuation canaries consume these crate-private scheduler diagnostics"
)]
pub(crate) use self::continuations::{
    RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary,
    RootExpiredDefaultSyncQueueLaneCommitCurrentnessRecordForCanary,
    RootExpiredLaneSyncSchedulerQueueLaneContinuationRecordForCanary,
    RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary,
    RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary,
    RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary,
    consume_expired_default_sync_queue_lane_commit_currentness_for_canary,
    consume_finished_work_queue_lane_commit_currentness_for_canary,
    root_sync_flush_record_for_canary,
};
#[allow(
    unused_imports,
    reason = "crate-visible sync-flush and continuation record paths are part of the private scheduler diagnostics surface"
)]
pub(crate) use self::continuations::{
    RootExpiredLaneSyncSchedulerContinuationRecord, RootExpiredLaneSyncSchedulerContinuationStatus,
    RootSyncSchedulerContinuationExecutionRecord, RootSyncSchedulerContinuationExecutionStatus,
    RootSyncSchedulerFinishedWorkHandoffIdentityForCanary,
    RootSyncSchedulerPendingPassiveBlockerRecord,
    SYNC_FLUSH_POST_PASSIVE_ROOT_ERROR_PROPAGATION_BLOCKERS,
    SyncFlushPostPassiveContinuationExecutionGateRecord,
    SyncFlushPostPassiveContinuationRootRecord, SyncFlushPostPassiveRootErrorPropagationBlocker,
    SyncFlushPostPassiveRootErrorPropagationRecord, SyncFlushPostPassiveRootErrorPropagationStatus,
    SyncFlushRootRecoverySnapshotForCanary, sync_flush_post_passive_continuation_execution_gate,
    sync_flush_root_recovery_snapshot_for_canary,
};
#[cfg(test)]
use self::continuations::{
    RootExpiredLaneSyncSchedulerQueueLaneContinuationMetadataForCanary,
    root_finished_work_queue_lane_commit_currentness_identity_for_canary,
};
pub use self::continuations::{
    RootSyncFlushExitStatus, RootSyncFlushPlan, RootSyncFlushRecord, RootSyncFlushRecordStatus,
    RootSyncFlushResult,
};

#[allow(
    unused_imports,
    reason = "crate-visible act record paths are part of the private scheduler diagnostics surface"
)]
pub(crate) use self::act::{
    SchedulerBridgeActContinuationExecutionRecord, SchedulerBridgeActQueueRequestExecutionRecord,
};
pub(crate) use self::act::{
    SchedulerBridgeActContinuationExecutionResult, SchedulerBridgeActQueueExecutionResult,
    SyncFlushActContinuationDrainRecord, SyncFlushActPostPassiveContinuationGateRecord,
    execute_scheduler_bridge_act_continuations, execute_scheduler_bridge_act_queue_for_canary,
    sync_flush_act_continuation_drain_record_after_host_output_canary,
    sync_flush_act_continuation_lanes_for_root, sync_flush_act_post_passive_continuation_gate,
};
#[cfg(test)]
pub(crate) use self::act::{
    SchedulerBridgeActContinuationExecutionStatus, SchedulerBridgeActQueueRequestExecutionStatus,
    execute_scheduler_bridge_act_queue_request_for_canary,
};

pub(crate) const SYNC_FLUSH_LANES: Lanes = Lanes::SYNC_HYDRATION.merge(Lanes::SYNC);

#[cfg(test)]
const EXPIRED_DEFAULT_SYNC_QUEUE_LANE_CURRENTNESS_TIME_FOR_CANARY: LaneTimestamp = 10;

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary {
    root: FiberRootId,
    previous_current: FiberId,
    finished_work: FiberId,
    selected_lanes: Lanes,
    finished_lanes: Lanes,
    remaining_lanes: Lanes,
    requested_callback_node: RootSchedulerCallbackHandle,
    current_callback_node: RootSchedulerCallbackHandle,
    handoff_order: usize,
    commit_order: usize,
    update_sequence_ids: Vec<UpdateId>,
    resulting_element: RootElementHandle,
}

#[cfg(test)]
impl RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn previous_current(&self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
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
    pub(crate) const fn requested_callback_node(&self) -> RootSchedulerCallbackHandle {
        self.requested_callback_node
    }

    #[must_use]
    pub(crate) const fn current_callback_node(&self) -> RootSchedulerCallbackHandle {
        self.current_callback_node
    }

    #[must_use]
    pub(crate) const fn handoff_order(&self) -> usize {
        self.handoff_order
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) fn update_sequence_ids(&self) -> &[UpdateId] {
        &self.update_sequence_ids
    }

    #[must_use]
    pub(crate) const fn resulting_element(&self) -> RootElementHandle {
        self.resulting_element
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootFinishedWorkQueueLaneCommitCurrentnessSourceTokenForCanary {
    raw: usize,
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct RootFinishedWorkQueueLaneCommitCurrentnessSourceForCanary {
    identity: RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary,
    token: RootFinishedWorkQueueLaneCommitCurrentnessSourceTokenForCanary,
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootFinishedWorkQueueLaneCommitCurrentnessRecordForCanary {
    identity: RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary,
    root_token: StateNodeHandle,
    source_pending_before_consume: bool,
    source_consumed_after: bool,
    root_current_after_consume: FiberId,
    root_finished_work_after_consume: Option<FiberId>,
    root_finished_lanes_after_consume: Lanes,
    root_pending_lanes_after_consume: Lanes,
    committed_element_after_consume: RootElementHandle,
    committed_root_children: Vec<FiberId>,
    commit_mutation_record_count: usize,
    commit_deletion_list_count: usize,
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "private currentness records are inspected by focused queue-lane commit canaries"
)]
impl RootFinishedWorkQueueLaneCommitCurrentnessRecordForCanary {
    #[must_use]
    pub(crate) const fn identity(
        &self,
    ) -> &RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary {
        &self.identity
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.identity.root()
    }

    #[must_use]
    pub(crate) const fn previous_current(&self) -> FiberId {
        self.identity.previous_current()
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.identity.finished_work()
    }

    #[must_use]
    pub(crate) const fn selected_lanes(&self) -> Lanes {
        self.identity.selected_lanes()
    }

    #[must_use]
    pub(crate) const fn finished_lanes(&self) -> Lanes {
        self.identity.finished_lanes()
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(&self) -> Lanes {
        self.identity.remaining_lanes()
    }

    #[must_use]
    pub(crate) const fn root_token(&self) -> StateNodeHandle {
        self.root_token
    }

    #[must_use]
    pub(crate) const fn requested_callback_node(&self) -> RootSchedulerCallbackHandle {
        self.identity.requested_callback_node()
    }

    #[must_use]
    pub(crate) const fn current_callback_node(&self) -> RootSchedulerCallbackHandle {
        self.identity.current_callback_node()
    }

    #[must_use]
    pub(crate) const fn handoff_order(&self) -> usize {
        self.identity.handoff_order()
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.identity.commit_order()
    }

    #[must_use]
    pub(crate) fn update_sequence_ids(&self) -> &[UpdateId] {
        self.identity.update_sequence_ids()
    }

    #[must_use]
    pub(crate) const fn resulting_element(&self) -> RootElementHandle {
        self.identity.resulting_element()
    }

    #[must_use]
    pub(crate) const fn source_pending_before_consume(&self) -> bool {
        self.source_pending_before_consume
    }

    #[must_use]
    pub(crate) const fn source_consumed_after(&self) -> bool {
        self.source_consumed_after
    }

    #[must_use]
    pub(crate) const fn root_current_after_consume(&self) -> FiberId {
        self.root_current_after_consume
    }

    #[must_use]
    pub(crate) const fn root_finished_work_after_consume(&self) -> Option<FiberId> {
        self.root_finished_work_after_consume
    }

    #[must_use]
    pub(crate) const fn root_finished_lanes_after_consume(&self) -> Lanes {
        self.root_finished_lanes_after_consume
    }

    #[must_use]
    pub(crate) const fn root_pending_lanes_after_consume(&self) -> Lanes {
        self.root_pending_lanes_after_consume
    }

    #[must_use]
    pub(crate) const fn committed_element_after_consume(&self) -> RootElementHandle {
        self.committed_element_after_consume
    }

    #[must_use]
    pub(crate) fn committed_root_children(&self) -> &[FiberId] {
        &self.committed_root_children
    }

    #[must_use]
    pub(crate) fn committed_root_child_count(&self) -> usize {
        self.committed_root_children.len()
    }

    #[must_use]
    pub(crate) const fn commit_mutation_record_count(&self) -> usize {
        self.commit_mutation_record_count
    }

    #[must_use]
    pub(crate) const fn commit_deletion_list_count(&self) -> usize {
        self.commit_deletion_list_count
    }

    #[must_use]
    pub(crate) fn source_owned_currentness_consumed(&self) -> bool {
        self.source_pending_before_consume
            && self.source_consumed_after
            && self.root_current_after_consume == self.finished_work()
            && self.root_finished_work_after_consume.is_none()
            && self.root_finished_lanes_after_consume.is_empty()
            && self.committed_element_after_consume == self.resulting_element()
    }

    #[must_use]
    pub(crate) fn ties_finished_work_queue_lane_commit_to_live_tree_state_for_canary(
        &self,
    ) -> bool {
        self.source_owned_currentness_consumed()
            && self.root_token == self.root().state_node_handle()
            && self.previous_current() != self.finished_work()
            && self.selected_lanes() == self.finished_lanes()
            && self.root_pending_lanes_after_consume == self.remaining_lanes()
            && self.requested_callback_node() == self.current_callback_node()
            && self.commit_order() > self.handoff_order()
            && !self.update_sequence_ids().is_empty()
    }

    #[must_use]
    pub(crate) const fn public_root_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_timing_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_public_effects(&self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary {
    UnacceptedSchedulerContinuation,
    MissingQueueCommitHandoff,
    SourceAlreadyConsumed {
        root: FiberRootId,
        finished_work: FiberId,
        commit_order: usize,
    },
    SourceNotPending {
        root: FiberRootId,
        finished_work: FiberId,
        commit_order: usize,
    },
    LiveRootStateMismatch {
        root: FiberRootId,
        expected_current: FiberId,
        actual_current: FiberId,
        expected_finished_work: Option<FiberId>,
        actual_finished_work: Option<FiberId>,
        expected_finished_lanes: Lanes,
        actual_finished_lanes: Lanes,
        expected_pending_lanes: Lanes,
        actual_pending_lanes: Lanes,
    },
    CommittedTreeStateMismatch {
        root: FiberRootId,
        field: &'static str,
    },
    QueueRowMetadataMismatch {
        root: FiberRootId,
        update: UpdateId,
        expected_lanes: Lanes,
        actual_lanes: Lanes,
    },
    QueueOrderMismatch {
        root: FiberRootId,
        queue: UpdateQueueHandle,
        expected_updates: Vec<UpdateId>,
        actual_updates: Vec<UpdateId>,
    },
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    UpdateQueue(UpdateQueueError),
}

#[cfg(test)]
impl Display for RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnacceptedSchedulerContinuation => write!(
                formatter,
                "finished-work queue-lane currentness requires an accepted scheduler continuation"
            ),
            Self::MissingQueueCommitHandoff => write!(
                formatter,
                "finished-work queue-lane currentness requires queue commit handoff evidence"
            ),
            Self::SourceAlreadyConsumed {
                root,
                finished_work,
                commit_order,
            } => write!(
                formatter,
                "root {} finished work {} commit order {} queue-lane currentness source was already consumed",
                root.raw(),
                finished_work.slot().get(),
                commit_order
            ),
            Self::SourceNotPending {
                root,
                finished_work,
                commit_order,
            } => write!(
                formatter,
                "root {} finished work {} commit order {} has no source-owned queue-lane currentness source",
                root.raw(),
                finished_work.slot().get(),
                commit_order
            ),
            Self::LiveRootStateMismatch {
                root,
                expected_current,
                actual_current,
                expected_finished_work,
                actual_finished_work,
                expected_finished_lanes,
                actual_finished_lanes,
                expected_pending_lanes,
                actual_pending_lanes,
            } => write!(
                formatter,
                "root {} live queue-lane currentness mismatch current {}/{}, finished work {:?}/{:?}, finished lanes {:?}/{:?}, pending lanes {:?}/{:?}",
                root.raw(),
                actual_current.slot().get(),
                expected_current.slot().get(),
                actual_finished_work,
                expected_finished_work,
                actual_finished_lanes,
                expected_finished_lanes,
                actual_pending_lanes,
                expected_pending_lanes
            ),
            Self::CommittedTreeStateMismatch { root, field } => write!(
                formatter,
                "root {} committed tree state mismatch for queue-lane currentness field {}",
                root.raw(),
                field
            ),
            Self::QueueRowMetadataMismatch {
                root,
                update,
                expected_lanes,
                actual_lanes,
            } => write!(
                formatter,
                "root {} queue-lane currentness row {:?} lanes {:?}/{:?} do not match source",
                root.raw(),
                update,
                actual_lanes,
                expected_lanes
            ),
            Self::QueueOrderMismatch {
                root,
                queue,
                expected_updates,
                actual_updates,
            } => write!(
                formatter,
                "root {} queue {} queue-lane currentness expected updates {:?}, found {:?}",
                root.raw(),
                queue.raw(),
                expected_updates,
                actual_updates
            ),
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UpdateQueue(error) => Display::fmt(error, formatter),
        }
    }
}

#[cfg(test)]
impl Error for RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::UpdateQueue(error) => Some(error),
            Self::UnacceptedSchedulerContinuation
            | Self::MissingQueueCommitHandoff
            | Self::SourceAlreadyConsumed { .. }
            | Self::SourceNotPending { .. }
            | Self::LiveRootStateMismatch { .. }
            | Self::CommittedTreeStateMismatch { .. }
            | Self::QueueRowMetadataMismatch { .. }
            | Self::QueueOrderMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<FiberRootStoreError> for RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

#[cfg(test)]
impl From<FiberTopologyError> for RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[cfg(test)]
impl From<UpdateQueueError> for RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary {
    fn from(error: UpdateQueueError) -> Self {
        Self::UpdateQueue(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootErrorCaptureSource {
    PassiveEffectDestroy,
    PassiveEffectMountCreate,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootErrorCaptureScheduleRecord {
    source: RootErrorCaptureSource,
    root: FiberRootId,
    root_fiber: FiberId,
    source_fiber: FiberId,
    lane: Lane,
    pending_lanes_before: Lanes,
    pending_lanes_after: Lanes,
    scheduled_root: ScheduledRootUpdateResult,
    error_option_callbacks: RootErrorOptionCallbackRecord,
}

#[allow(
    dead_code,
    reason = "crate-private root error capture metadata is reserved for passive error workers"
)]
impl RootErrorCaptureScheduleRecord {
    #[must_use]
    pub(crate) const fn source(self) -> RootErrorCaptureSource {
        self.source
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn root_fiber(self) -> FiberId {
        self.root_fiber
    }

    #[must_use]
    pub(crate) const fn source_fiber(self) -> FiberId {
        self.source_fiber
    }

    #[must_use]
    pub(crate) const fn lane(self) -> Lane {
        self.lane
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before(self) -> Lanes {
        self.pending_lanes_before
    }

    #[must_use]
    pub(crate) const fn pending_lanes_after(self) -> Lanes {
        self.pending_lanes_after
    }

    #[must_use]
    pub(crate) const fn scheduled_root(self) -> ScheduledRootUpdateResult {
        self.scheduled_root
    }

    #[must_use]
    pub(crate) const fn error_option_callbacks(self) -> RootErrorOptionCallbackRecord {
        self.error_option_callbacks
    }

    #[must_use]
    pub(crate) const fn on_uncaught_error(self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_uncaught_error()
    }

    #[must_use]
    pub(crate) const fn on_caught_error(self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_caught_error()
    }

    #[must_use]
    pub(crate) const fn on_recoverable_error(self) -> RootRecoverableErrorCallbackHandle {
        self.error_option_callbacks.on_recoverable_error()
    }

    #[must_use]
    pub(crate) const fn root_error_update_scheduled(self) -> bool {
        self.pending_lanes_after.contains_lane(self.lane)
            && self.scheduled_root.root().raw() == self.root.raw()
            && self.scheduled_root.might_have_pending_sync_work()
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_error_aggregation_enabled(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn has_configured_error_callback(self) -> bool {
        self.error_option_callbacks.has_configured_error_callback()
    }
}

#[derive(Clone)]
pub struct RootSchedulerState {
    first_scheduled_root: Option<FiberRootId>,
    last_scheduled_root: Option<FiberRootId>,
    did_schedule_microtask: bool,
    did_schedule_microtask_act: bool,
    might_have_pending_sync_work: bool,
    is_flushing_work: bool,
    current_event_transition_lane: Lane,
    #[cfg(test)]
    next_finished_work_queue_lane_commit_currentness_source_token: usize,
    #[cfg(test)]
    finished_work_queue_lane_commit_currentness_sources:
        Vec<RootFinishedWorkQueueLaneCommitCurrentnessSourceForCanary>,
    #[cfg(test)]
    consumed_finished_work_queue_lane_commit_currentness:
        Vec<RootFinishedWorkQueueLaneCommitCurrentnessSourceForCanary>,
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
            #[cfg(test)]
            next_finished_work_queue_lane_commit_currentness_source_token: 0,
            #[cfg(test)]
            finished_work_queue_lane_commit_currentness_sources: Vec::new(),
            #[cfg(test)]
            consumed_finished_work_queue_lane_commit_currentness: Vec::new(),
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
    const fn current_event_transition_lane(&self) -> Lane {
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

    fn set_current_event_transition_lane(&mut self, lane: Lane) {
        self.current_event_transition_lane = lane;
    }

    #[cfg(test)]
    fn record_finished_work_queue_lane_commit_currentness_source(
        &mut self,
        identity: RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary,
    ) -> RootFinishedWorkQueueLaneCommitCurrentnessSourceTokenForCanary {
        if let Some(source) = self
            .finished_work_queue_lane_commit_currentness_sources
            .iter()
            .find(|source| source.identity == identity)
        {
            return source.token;
        }
        if let Some(consumed) = self
            .consumed_finished_work_queue_lane_commit_currentness
            .iter()
            .find(|consumed| consumed.identity == identity)
        {
            return consumed.token;
        }

        let token = RootFinishedWorkQueueLaneCommitCurrentnessSourceTokenForCanary {
            raw: self.next_finished_work_queue_lane_commit_currentness_source_token,
        };
        self.next_finished_work_queue_lane_commit_currentness_source_token = self
            .next_finished_work_queue_lane_commit_currentness_source_token
            .saturating_add(1);
        self.finished_work_queue_lane_commit_currentness_sources
            .push(RootFinishedWorkQueueLaneCommitCurrentnessSourceForCanary { identity, token });
        token
    }

    #[cfg(test)]
    fn has_pending_finished_work_queue_lane_commit_currentness_source(
        &self,
        identity: &RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary,
        token: RootFinishedWorkQueueLaneCommitCurrentnessSourceTokenForCanary,
    ) -> bool {
        self.finished_work_queue_lane_commit_currentness_sources
            .iter()
            .any(|source| &source.identity == identity && source.token == token)
    }

    #[cfg(test)]
    fn has_consumed_finished_work_queue_lane_commit_currentness_source(
        &self,
        identity: &RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary,
        token: RootFinishedWorkQueueLaneCommitCurrentnessSourceTokenForCanary,
    ) -> bool {
        self.consumed_finished_work_queue_lane_commit_currentness
            .iter()
            .any(|consumed| &consumed.identity == identity && consumed.token == token)
    }

    #[cfg(test)]
    fn consume_finished_work_queue_lane_commit_currentness_source(
        &mut self,
        identity: &RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary,
        token: RootFinishedWorkQueueLaneCommitCurrentnessSourceTokenForCanary,
    ) -> bool {
        let Some(index) = self
            .finished_work_queue_lane_commit_currentness_sources
            .iter()
            .position(|source| &source.identity == identity && source.token == token)
        else {
            return false;
        };

        let consumed = self
            .finished_work_queue_lane_commit_currentness_sources
            .remove(index);
        self.consumed_finished_work_queue_lane_commit_currentness
            .push(consumed);
        true
    }
}

impl fmt::Debug for RootSchedulerState {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("RootSchedulerState")
            .field("first_scheduled_root", &self.first_scheduled_root)
            .field("last_scheduled_root", &self.last_scheduled_root)
            .field("did_schedule_microtask", &self.did_schedule_microtask)
            .field(
                "did_schedule_microtask_act",
                &self.did_schedule_microtask_act,
            )
            .field(
                "might_have_pending_sync_work",
                &self.might_have_pending_sync_work,
            )
            .field("is_flushing_work", &self.is_flushing_work)
            .finish_non_exhaustive()
    }
}

impl PartialEq for RootSchedulerState {
    fn eq(&self, other: &Self) -> bool {
        self.first_scheduled_root == other.first_scheduled_root
            && self.last_scheduled_root == other.last_scheduled_root
            && self.did_schedule_microtask == other.did_schedule_microtask
            && self.did_schedule_microtask_act == other.did_schedule_microtask_act
            && self.might_have_pending_sync_work == other.might_have_pending_sync_work
            && self.is_flushing_work == other.is_flushing_work
    }
}

impl Eq for RootSchedulerState {}

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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootRescheduleRequestRecord {
    root: FiberRootId,
    fiber: FiberId,
    lane: Lane,
}

impl RootRescheduleRequestRecord {
    #[must_use]
    pub(crate) const fn new(root: FiberRootId, fiber: FiberId, lane: Lane) -> Self {
        Self { root, fiber, lane }
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
    pub(crate) const fn lane(self) -> Lane {
        self.lane
    }
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
pub(crate) struct RootTransitionLaneSchedulerRequestRecord {
    root: FiberRootId,
    fiber: FiberId,
    update: UpdateId,
    queue: UpdateQueueHandle,
    lane: Lane,
    event_priority: EventPriority,
    pending_lanes_before_enqueue: Lanes,
    pending_lanes_after_enqueue: Lanes,
    selected_next_lanes: Lanes,
    entangled_lanes: Lanes,
    current_event_transition_lane_before: Lane,
    current_event_transition_lane_after: Lane,
    scheduled_root: ScheduledRootUpdateResult,
}

#[allow(
    dead_code,
    reason = "crate-private transition lane scheduler diagnostics are reserved for root scheduler canaries"
)]
impl RootTransitionLaneSchedulerRequestRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn update(self) -> UpdateId {
        self.update
    }

    #[must_use]
    pub(crate) const fn queue(self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub(crate) const fn lane(self) -> Lane {
        self.lane
    }

    #[must_use]
    pub(crate) const fn event_priority(self) -> EventPriority {
        self.event_priority
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before_enqueue(self) -> Lanes {
        self.pending_lanes_before_enqueue
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
    pub(crate) const fn entangled_lanes(self) -> Lanes {
        self.entangled_lanes
    }

    #[must_use]
    pub(crate) const fn current_event_transition_lane_before(self) -> Lane {
        self.current_event_transition_lane_before
    }

    #[must_use]
    pub(crate) const fn current_event_transition_lane_after(self) -> Lane {
        self.current_event_transition_lane_after
    }

    #[must_use]
    pub(crate) const fn scheduled_root(self) -> ScheduledRootUpdateResult {
        self.scheduled_root
    }

    #[must_use]
    pub(crate) const fn routed_to_private_root_scheduler(self) -> bool {
        self.scheduled_root.root().raw() == self.root.raw()
            && self.current_event_transition_lane_after.bits() == self.lane.bits()
            && self.scheduled_root.might_have_pending_sync_work()
    }

    #[must_use]
    pub(crate) const fn callback_execution_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_update_scheduling_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_scheduler_compatibility_claimed(self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootTransitionSchedulerQueueLaneContinuationStatusForCanary {
    StaleCallbackNode,
    NoTransitionWork,
    StaleTransitionDiagnostics,
    BlockedByTransitionEntanglementMismatch,
    BlockedByLaneMismatch,
    BlockedByFinishedWorkHandoffMismatch,
    BlockedByQueueLaneHandoffMismatch,
    RenderedAndCommitted,
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct RootTransitionSchedulerQueueLaneContinuationMetadataForCanary {
    request: RootTransitionLaneSchedulerRequestRecord,
    callback_execution: RootSchedulerCallbackExecutionRecord,
    current_callback_node: RootSchedulerCallbackHandle,
    current_event_transition_lane: Lane,
    root_current_before_continuation: FiberId,
    root_pending_lanes_before_continuation: Lanes,
    root_entangled_lanes_before_continuation: Lanes,
    finished_work_handoff_identity: Option<RootSyncSchedulerFinishedWorkHandoffIdentityForCanary>,
    status: RootTransitionSchedulerQueueLaneContinuationStatusForCanary,
    queue_handoff: Option<HostRootUpdateQueueLaneHandoffRecordForCanary>,
    queue_handoff_error: Option<HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary>,
    queue_commit_handoff: Option<HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary>,
    commit: Option<HostRootCommitRecord>,
}

#[cfg(test)]
#[derive(Debug, PartialEq, Eq)]
pub(crate) struct RootTransitionSchedulerQueueLaneContinuationRecordForCanary {
    request: RootTransitionLaneSchedulerRequestRecord,
    callback_execution: RootSchedulerCallbackExecutionRecord,
    current_callback_node: RootSchedulerCallbackHandle,
    current_event_transition_lane: Lane,
    root_current_before_continuation: FiberId,
    root_pending_lanes_before_continuation: Lanes,
    root_entangled_lanes_before_continuation: Lanes,
    finished_work_handoff_identity: Option<RootSyncSchedulerFinishedWorkHandoffIdentityForCanary>,
    status: RootTransitionSchedulerQueueLaneContinuationStatusForCanary,
    queue_handoff: Option<HostRootUpdateQueueLaneHandoffRecordForCanary>,
    queue_handoff_error: Option<HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary>,
    queue_commit_handoff: Option<HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary>,
    commit: Option<HostRootCommitRecord>,
    source_metadata: RootTransitionSchedulerQueueLaneContinuationMetadataForCanary,
    currentness_source_token:
        Option<RootFinishedWorkQueueLaneCommitCurrentnessSourceTokenForCanary>,
}

#[cfg(test)]
impl Clone for RootTransitionSchedulerQueueLaneContinuationRecordForCanary {
    fn clone(&self) -> Self {
        Self {
            request: self.request,
            callback_execution: self.callback_execution,
            current_callback_node: self.current_callback_node,
            current_event_transition_lane: self.current_event_transition_lane,
            root_current_before_continuation: self.root_current_before_continuation,
            root_pending_lanes_before_continuation: self.root_pending_lanes_before_continuation,
            root_entangled_lanes_before_continuation: self.root_entangled_lanes_before_continuation,
            finished_work_handoff_identity: self.finished_work_handoff_identity,
            status: self.status,
            queue_handoff: self.queue_handoff.clone(),
            queue_handoff_error: self.queue_handoff_error.clone(),
            queue_commit_handoff: self.queue_commit_handoff.clone(),
            commit: self.commit.clone(),
            source_metadata: self.source_metadata.clone(),
            currentness_source_token: None,
        }
    }
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private transition queue/lane continuation canaries consume this evidence"
)]
impl RootTransitionSchedulerQueueLaneContinuationRecordForCanary {
    #[must_use]
    pub(crate) const fn request(&self) -> RootTransitionLaneSchedulerRequestRecord {
        self.request
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.request.root()
    }

    #[must_use]
    pub(crate) const fn callback_execution(&self) -> RootSchedulerCallbackExecutionRecord {
        self.callback_execution
    }

    #[must_use]
    pub(crate) const fn callback_node(&self) -> RootSchedulerCallbackHandle {
        self.callback_execution.callback_node()
    }

    #[must_use]
    pub(crate) const fn current_callback_node(&self) -> RootSchedulerCallbackHandle {
        self.current_callback_node
    }

    #[must_use]
    pub(crate) const fn selected_lanes(&self) -> Lanes {
        self.callback_execution.selected_lanes()
    }

    #[must_use]
    pub(crate) const fn render_phase(&self) -> Option<HostRootRenderPhaseRecord> {
        self.callback_execution.render_phase()
    }

    #[must_use]
    pub(crate) const fn current_event_transition_lane(&self) -> Lane {
        self.current_event_transition_lane
    }

    #[must_use]
    pub(crate) const fn root_current_before_continuation(&self) -> FiberId {
        self.root_current_before_continuation
    }

    #[must_use]
    pub(crate) const fn root_pending_lanes_before_continuation(&self) -> Lanes {
        self.root_pending_lanes_before_continuation
    }

    #[must_use]
    pub(crate) const fn root_entangled_lanes_before_continuation(&self) -> Lanes {
        self.root_entangled_lanes_before_continuation
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff_identity(
        &self,
    ) -> Option<RootSyncSchedulerFinishedWorkHandoffIdentityForCanary> {
        self.finished_work_handoff_identity
    }

    #[must_use]
    pub(crate) const fn status(
        &self,
    ) -> RootTransitionSchedulerQueueLaneContinuationStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) fn queue_handoff(&self) -> Option<&HostRootUpdateQueueLaneHandoffRecordForCanary> {
        self.queue_handoff.as_ref()
    }

    #[must_use]
    pub(crate) fn queue_handoff_error(
        &self,
    ) -> Option<&HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary> {
        self.queue_handoff_error.as_ref()
    }

    #[must_use]
    pub(crate) fn queue_commit_handoff(
        &self,
    ) -> Option<&HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary> {
        self.queue_commit_handoff.as_ref()
    }

    #[must_use]
    pub(crate) fn root_commit_handoff_for_canary(
        &self,
    ) -> Option<&HostRootFinishedWorkCommitHandoffRecordForCanary> {
        self.queue_commit_handoff()
            .map(HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary::finished_work_handoff)
    }

    #[must_use]
    pub(crate) fn commit(&self) -> Option<&HostRootCommitRecord> {
        self.commit.as_ref()
    }

    #[must_use]
    pub(crate) const fn currentness_source_token(
        &self,
    ) -> Option<RootFinishedWorkQueueLaneCommitCurrentnessSourceTokenForCanary> {
        self.currentness_source_token
    }

    #[must_use]
    pub(crate) const fn did_execute_transition_queue_lane_scheduler_continuation(&self) -> bool {
        matches!(
            self.status,
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::RenderedAndCommitted
        )
    }

    #[must_use]
    pub(crate) const fn rejected_stale_callback_node(&self) -> bool {
        matches!(
            self.status,
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::StaleCallbackNode
        )
    }

    #[must_use]
    pub(crate) const fn no_transition_work(&self) -> bool {
        matches!(
            self.status,
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::NoTransitionWork
        )
    }

    #[must_use]
    pub(crate) const fn stale_transition_diagnostics(&self) -> bool {
        matches!(
            self.status,
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::StaleTransitionDiagnostics
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_transition_entanglement(&self) -> bool {
        matches!(
            self.status,
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByTransitionEntanglementMismatch
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_lane_mismatch(&self) -> bool {
        matches!(
            self.status,
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByLaneMismatch
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_finished_work_handoff_mismatch(&self) -> bool {
        matches!(
            self.status,
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByFinishedWorkHandoffMismatch
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_queue_lane_handoff(&self) -> bool {
        matches!(
            self.status,
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        )
    }

    #[must_use]
    pub(crate) const fn async_callback_execution_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_update_scheduling_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_root_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_timing_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_transition_hooks_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn package_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn renderer_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_public_effects(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) fn accepted_transition_scheduler_evidence_for_canary(&self) -> bool {
        self.did_execute_transition_queue_lane_scheduler_continuation()
            && self.request.routed_to_private_root_scheduler()
            && self.request.lane().is_transition()
            && self
                .request
                .selected_next_lanes()
                .includes_only_transitions()
            && self
                .request
                .selected_next_lanes()
                .contains_lane(self.request.lane())
            && self.request.entangled_lanes() == self.request.selected_next_lanes()
            && self
                .root_pending_lanes_before_continuation
                .contains_all(self.request.selected_next_lanes())
            && self
                .root_entangled_lanes_before_continuation
                .contains_all(self.request.entangled_lanes())
            && self.current_event_transition_lane == self.request.lane()
            && self.root_current_before_continuation == self.request.fiber()
            && self.callback_execution.status() == RootSchedulerCallbackExecutionStatus::Rendered
            && self.callback_execution.root() == self.request.root()
            && self.callback_execution.callback_node() == self.current_callback_node
            && !self.callback_execution.validation().is_stale()
            && self.callback_execution.selected_lanes() == self.request.selected_next_lanes()
            && self.render_phase().is_some_and(|render| {
                render.root() == self.request.root()
                    && render.current() == self.request.fiber()
                    && render.render_lanes() == self.request.selected_next_lanes()
            })
    }

    #[must_use]
    pub(crate) fn accepted_root_scheduler_execution_evidence_for_canary(&self) -> bool {
        self.accepted_transition_scheduler_evidence_for_canary()
            && self.finished_work_handoff_identity.is_some_and(
                RootSyncSchedulerFinishedWorkHandoffIdentityForCanary::accepted_for_root_scheduler_commit_handoff,
            )
            && self.commit.as_ref().is_some_and(|commit| {
                self.render_phase().is_some_and(|render| {
                    commit.root() == self.request.root()
                        && commit.previous_current() == render.current()
                        && commit.current() == render.finished_work()
                        && commit.finished_work() == render.finished_work()
                        && commit.finished_lanes() == self.request.selected_next_lanes()
                        && commit.remaining_lanes() == render.remaining_lanes()
                        && commit.pending_lanes() == render.remaining_lanes()
                })
            })
    }

    #[must_use]
    pub(crate) fn accepted_root_commit_execution_evidence_for_canary(&self) -> bool {
        self.root_commit_handoff_for_canary()
            .is_some_and(HostRootFinishedWorkCommitHandoffRecordForCanary::proves_private_root_finished_work_commit_metadata_handoff)
    }

    #[must_use]
    pub(crate) fn accepted_queue_lane_handoff_evidence_for_canary(&self) -> bool {
        self.queue_commit_handoff
            .as_ref()
            .is_some_and(|commit_handoff| {
                let queue_handoff = commit_handoff.queue_handoff();
                self.queue_handoff
                    .as_ref()
                    .is_some_and(|accepted| accepted == queue_handoff)
                    && commit_handoff.proves_queue_lane_handoff_gated_current_switch()
                    && commit_handoff.update_sequence_ids() == [self.request.update()]
                    && commit_handoff.selected_lanes() == self.request.selected_next_lanes()
                    && commit_handoff.finished_lanes() == self.request.selected_next_lanes()
                    && self.render_phase().is_some_and(|render| {
                        commit_handoff.remaining_lanes() == render.remaining_lanes()
                            && commit_handoff.applied_update_count()
                                == render.applied_update_count()
                            && commit_handoff.skipped_update_count()
                                == render.skipped_update_count()
                            && commit_handoff.resulting_element() == render.resulting_element()
                    })
                    && queue_handoff.proves_source_owned_lane_handoff()
            })
    }

    #[must_use]
    pub(crate) fn routed_through_transition_queue_lane_and_commit_evidence_for_canary(
        &self,
    ) -> bool {
        self.accepted_root_scheduler_execution_evidence_for_canary()
            && self.accepted_root_commit_execution_evidence_for_canary()
            && self.accepted_queue_lane_handoff_evidence_for_canary()
            && self.async_callback_execution_blocked()
            && self.public_update_scheduling_blocked()
            && !self.public_root_compatibility_claimed()
            && !self.public_scheduler_timing_compatibility_claimed()
            && !self.public_transition_hooks_compatibility_claimed()
            && !self.public_act_compatibility_claimed()
            && !self.react_dom_compatibility_claimed()
            && !self.test_renderer_compatibility_claimed()
            && !self.package_compatibility_claimed()
            && !self.renderer_compatibility_claimed()
            && !self.executes_public_effects()
    }

    #[must_use]
    pub(crate) fn treats_transition_host_root_update_as_current_only_with_queue_lane_handoff_for_canary(
        &self,
    ) -> bool {
        self.routed_through_transition_queue_lane_and_commit_evidence_for_canary()
            && self.queue_handoff.as_ref().is_some_and(|queue_handoff| {
                self.commit.as_ref().is_some_and(|commit| {
                    commit.root() == queue_handoff.root()
                        && commit.previous_current() == queue_handoff.current()
                        && commit.current() == queue_handoff.finished_work()
                        && commit.finished_work() == queue_handoff.finished_work()
                        && commit.finished_lanes() == queue_handoff.finished_lanes()
                        && commit.remaining_lanes() == queue_handoff.remaining_lanes()
                })
            })
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootTransitionQueueLaneCommitCurrentnessRecordForCanary {
    transition_continuation: RootTransitionSchedulerQueueLaneContinuationRecordForCanary,
    currentness: RootFinishedWorkQueueLaneCommitCurrentnessRecordForCanary,
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "private transition queue-lane currentness is exercised by focused canaries"
)]
impl RootTransitionQueueLaneCommitCurrentnessRecordForCanary {
    #[must_use]
    pub(crate) const fn transition_continuation(
        &self,
    ) -> &RootTransitionSchedulerQueueLaneContinuationRecordForCanary {
        &self.transition_continuation
    }

    #[must_use]
    pub(crate) const fn currentness(
        &self,
    ) -> &RootFinishedWorkQueueLaneCommitCurrentnessRecordForCanary {
        &self.currentness
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.transition_continuation.root()
    }

    #[must_use]
    pub(crate) const fn transition_lane(&self) -> Lane {
        self.transition_continuation.request().lane()
    }

    #[must_use]
    pub(crate) const fn selected_lanes(&self) -> Lanes {
        self.transition_continuation.selected_lanes()
    }

    #[must_use]
    pub(crate) fn source_owned_currentness_consumed(&self) -> bool {
        self.currentness.source_owned_currentness_consumed()
    }

    #[must_use]
    pub(crate) fn ties_transition_queue_lane_commit_to_live_tree_state_for_canary(&self) -> bool {
        let transition = &self.transition_continuation;
        let Some(render) = transition.render_phase() else {
            return false;
        };
        let update_sequence_ids = self.currentness.update_sequence_ids();

        transition.routed_through_transition_queue_lane_and_commit_evidence_for_canary()
            && self
                .currentness
                .ties_finished_work_queue_lane_commit_to_live_tree_state_for_canary()
            && self.currentness.root() == transition.root()
            && self.currentness.selected_lanes() == transition.selected_lanes()
            && self.currentness.finished_lanes() == transition.selected_lanes()
            && self.currentness.remaining_lanes() == render.remaining_lanes()
            && self.currentness.requested_callback_node() == transition.callback_node()
            && self.currentness.current_callback_node() == transition.current_callback_node()
            && update_sequence_ids.len() == 1
            && update_sequence_ids[0] == transition.request().update()
            && self.currentness.resulting_element() == render.resulting_element()
            && transition.request().lane().is_transition()
            && transition
                .selected_lanes()
                .contains_lane(transition.request().lane())
            && transition.selected_lanes().includes_only_transitions()
    }

    #[must_use]
    pub(crate) const fn public_root_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_timing_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_transition_hooks_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn native_execution_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn package_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn renderer_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_public_effects(&self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum RootTransitionQueueLaneCommitCurrentnessErrorForCanary {
    UnacceptedTransitionContinuation {
        root: FiberRootId,
        status: RootTransitionSchedulerQueueLaneContinuationStatusForCanary,
    },
    TransitionWrapperMetadataMismatch {
        root: FiberRootId,
        field: &'static str,
    },
    FinishedWorkQueueLaneCurrentness(RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary),
}

#[cfg(test)]
impl Display for RootTransitionQueueLaneCommitCurrentnessErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnacceptedTransitionContinuation { root, status } => write!(
                formatter,
                "root {} transition queue-lane currentness rejected transition continuation {:?}",
                root.raw(),
                status
            ),
            Self::TransitionWrapperMetadataMismatch { root, field } => write!(
                formatter,
                "root {} transition queue-lane currentness wrapper metadata mismatch for {}",
                root.raw(),
                field
            ),
            Self::FinishedWorkQueueLaneCurrentness(error) => Display::fmt(error, formatter),
        }
    }
}

#[cfg(test)]
impl Error for RootTransitionQueueLaneCommitCurrentnessErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FinishedWorkQueueLaneCurrentness(error) => Some(error),
            Self::UnacceptedTransitionContinuation { .. }
            | Self::TransitionWrapperMetadataMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary>
    for RootTransitionQueueLaneCommitCurrentnessErrorForCanary
{
    fn from(error: RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary) -> Self {
        Self::FinishedWorkQueueLaneCurrentness(error)
    }
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    dead_code,
    reason = "private transition currentness consumer is exercised by focused canaries"
)]
pub(crate) fn consume_transition_queue_lane_commit_currentness_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    transition_continuation: &RootTransitionSchedulerQueueLaneContinuationRecordForCanary,
) -> Result<
    RootTransitionQueueLaneCommitCurrentnessRecordForCanary,
    RootTransitionQueueLaneCommitCurrentnessErrorForCanary,
> {
    if let Some(field) = transition_queue_lane_continuation_source_metadata_mismatch_for_canary(
        transition_continuation,
    ) {
        return Err(
            RootTransitionQueueLaneCommitCurrentnessErrorForCanary::TransitionWrapperMetadataMismatch {
                root: transition_continuation.root(),
                field,
            },
        );
    }

    if !transition_continuation
        .routed_through_transition_queue_lane_and_commit_evidence_for_canary()
    {
        return Err(
            RootTransitionQueueLaneCommitCurrentnessErrorForCanary::UnacceptedTransitionContinuation {
                root: transition_continuation.root(),
                status: transition_continuation.status(),
            },
        );
    }

    let Some(queue_lane_continuation) =
        transition_queue_lane_currentness_sync_continuation_for_canary(transition_continuation)
    else {
        return Err(
            RootTransitionQueueLaneCommitCurrentnessErrorForCanary::UnacceptedTransitionContinuation {
                root: transition_continuation.root(),
                status: transition_continuation.status(),
            },
        );
    };

    if let Some(field) = transition_queue_lane_currentness_wrapper_metadata_mismatch_for_canary(
        transition_continuation,
        &queue_lane_continuation,
    ) {
        return Err(
            RootTransitionQueueLaneCommitCurrentnessErrorForCanary::TransitionWrapperMetadataMismatch {
                root: transition_continuation.root(),
                field,
            },
        );
    }

    let currentness = consume_finished_work_queue_lane_commit_currentness_for_canary(
        store,
        &queue_lane_continuation,
    )?;

    Ok(RootTransitionQueueLaneCommitCurrentnessRecordForCanary {
        transition_continuation: transition_continuation.clone(),
        currentness,
    })
}

#[cfg(test)]
fn transition_queue_lane_currentness_sync_continuation_for_canary(
    transition_continuation: &RootTransitionSchedulerQueueLaneContinuationRecordForCanary,
) -> Option<RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary> {
    let render_phase = transition_continuation.render_phase()?;
    let status = match transition_continuation.status() {
        RootTransitionSchedulerQueueLaneContinuationStatusForCanary::StaleCallbackNode => {
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::StaleCallbackNode
        }
        RootTransitionSchedulerQueueLaneContinuationStatusForCanary::NoTransitionWork => {
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::NoSyncWork
        }
        RootTransitionSchedulerQueueLaneContinuationStatusForCanary::StaleTransitionDiagnostics
        | RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByTransitionEntanglementMismatch
        | RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByLaneMismatch => {
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByLaneMismatch
        }
        RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByFinishedWorkHandoffMismatch => {
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByFinishedWorkHandoffMismatch
        }
        RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch => {
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch
        }
        RootTransitionSchedulerQueueLaneContinuationStatusForCanary::RenderedAndCommitted => {
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::RenderedAndCommitted
        }
    };

    Some(
        RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary {
            handoff: root_sync_flush_record_for_canary(
                0,
                transition_continuation.root(),
                transition_continuation.selected_lanes(),
                render_phase,
            ),
            requested_callback_node: transition_continuation.callback_node(),
            current_callback_node: transition_continuation.current_callback_node(),
            selected_lanes: transition_continuation.selected_lanes(),
            pending_passive_blocker: None,
            finished_work_handoff_identity: transition_continuation
                .finished_work_handoff_identity(),
            status,
            queue_handoff: transition_continuation.queue_handoff.clone(),
            queue_handoff_error: transition_continuation.queue_handoff_error.clone(),
            queue_commit_handoff: transition_continuation.queue_commit_handoff.clone(),
            commit: transition_continuation.commit.clone(),
            currentness_source_token: transition_continuation.currentness_source_token(),
        },
    )
}

#[cfg(test)]
fn transition_queue_lane_currentness_wrapper_metadata_mismatch_for_canary(
    transition_continuation: &RootTransitionSchedulerQueueLaneContinuationRecordForCanary,
    queue_lane_continuation: &RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary,
) -> Option<&'static str> {
    if transition_continuation.root() != queue_lane_continuation.root() {
        return Some("currentness_root");
    }
    if transition_continuation.callback_node() != queue_lane_continuation.requested_callback_node()
    {
        return Some("currentness_requested_callback_node");
    }
    if transition_continuation.current_callback_node()
        != queue_lane_continuation.current_callback_node()
    {
        return Some("currentness_current_callback_node");
    }
    if transition_continuation.selected_lanes() != queue_lane_continuation.selected_lanes() {
        return Some("currentness_selected_lanes");
    }

    let Some(queue_commit_handoff) = transition_continuation.queue_commit_handoff() else {
        return Some("queue_commit_handoff");
    };
    let identity = root_finished_work_queue_lane_commit_currentness_identity_for_canary(
        queue_lane_continuation.handoff(),
        queue_lane_continuation.requested_callback_node(),
        queue_lane_continuation.current_callback_node(),
        queue_lane_continuation.selected_lanes(),
        queue_commit_handoff,
    );
    if identity.root() != transition_continuation.root() {
        return Some("currentness_root");
    }
    if identity.requested_callback_node() != transition_continuation.callback_node() {
        return Some("currentness_requested_callback_node");
    }
    if identity.current_callback_node() != transition_continuation.current_callback_node() {
        return Some("currentness_current_callback_node");
    }
    if identity.selected_lanes() != transition_continuation.selected_lanes() {
        return Some("currentness_selected_lanes");
    }
    if identity.finished_lanes() != transition_continuation.selected_lanes() {
        return Some("currentness_finished_lanes");
    }

    let update_sequence_ids = identity.update_sequence_ids();
    if update_sequence_ids.len() != 1
        || update_sequence_ids[0] != transition_continuation.request().update()
    {
        return Some("currentness_update_sequence_ids");
    }

    let Some(render) = transition_continuation.render_phase() else {
        return Some("render_phase");
    };
    if identity.remaining_lanes() != render.remaining_lanes() {
        return Some("currentness_remaining_lanes");
    }
    if identity.resulting_element() != render.resulting_element() {
        return Some("currentness_resulting_element");
    }

    None
}

#[cfg(test)]
fn transition_queue_lane_continuation_source_metadata_mismatch_for_canary(
    transition_continuation: &RootTransitionSchedulerQueueLaneContinuationRecordForCanary,
) -> Option<&'static str> {
    let source = &transition_continuation.source_metadata;
    if transition_continuation.request != source.request {
        return Some("request");
    }
    if transition_continuation.callback_execution != source.callback_execution {
        return Some("callback_execution");
    }
    if transition_continuation.current_callback_node != source.current_callback_node {
        return Some("current_callback_node");
    }
    if transition_continuation.current_event_transition_lane != source.current_event_transition_lane
    {
        return Some("current_event_transition_lane");
    }
    if transition_continuation.root_current_before_continuation
        != source.root_current_before_continuation
    {
        return Some("root_current_before_continuation");
    }
    if transition_continuation.root_pending_lanes_before_continuation
        != source.root_pending_lanes_before_continuation
    {
        return Some("root_pending_lanes_before_continuation");
    }
    if transition_continuation.root_entangled_lanes_before_continuation
        != source.root_entangled_lanes_before_continuation
    {
        return Some("root_entangled_lanes_before_continuation");
    }
    if transition_continuation.finished_work_handoff_identity
        != source.finished_work_handoff_identity
    {
        return Some("finished_work_handoff_identity");
    }
    if transition_continuation.status != source.status {
        return Some("status");
    }
    if transition_continuation.queue_handoff != source.queue_handoff {
        return Some("queue_handoff");
    }
    if transition_continuation.queue_handoff_error != source.queue_handoff_error {
        return Some("queue_handoff_error");
    }
    if transition_continuation.queue_commit_handoff != source.queue_commit_handoff {
        return Some("queue_commit_handoff");
    }
    if transition_continuation.commit != source.commit {
        return Some("commit");
    }

    None
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
pub(crate) enum PassiveEffectSchedulerFlushGateStatus {
    NoPendingPassive,
    Scheduled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectSchedulerFlushGateRecord {
    root: FiberRootId,
    finished_work: Option<FiberId>,
    lanes: Lanes,
    pending_unmount_count: usize,
    pending_mount_count: usize,
    scheduler_request: Option<SchedulerPassiveEffectsFlushRequest>,
}

#[allow(
    dead_code,
    reason = "crate-private passive scheduler flush gate metadata is reserved for passive-effect workers"
)]
impl PassiveEffectSchedulerFlushGateRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn pending_unmount_count(self) -> usize {
        self.pending_unmount_count
    }

    #[must_use]
    pub(crate) const fn pending_mount_count(self) -> usize {
        self.pending_mount_count
    }

    #[must_use]
    pub(crate) const fn pending_record_count(self) -> usize {
        self.pending_unmount_count + self.pending_mount_count
    }

    #[must_use]
    pub(crate) const fn scheduler_request(self) -> Option<SchedulerPassiveEffectsFlushRequest> {
        self.scheduler_request
    }

    #[must_use]
    pub(crate) const fn status(self) -> PassiveEffectSchedulerFlushGateStatus {
        match self.scheduler_request {
            Some(_) => PassiveEffectSchedulerFlushGateStatus::Scheduled,
            None => PassiveEffectSchedulerFlushGateStatus::NoPendingPassive,
        }
    }

    #[must_use]
    pub(crate) const fn did_schedule_scheduler_flush_request(self) -> bool {
        matches!(
            self.status(),
            PassiveEffectSchedulerFlushGateStatus::Scheduled
        )
    }

    #[must_use]
    pub(crate) const fn executes_public_effects(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_package_behavior_changed(self) -> bool {
        false
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootRenderErrorOptionCallbackRecord {
    root: FiberRootId,
    render_lanes: Lanes,
    error: RootWorkLoopError,
    error_option_callbacks: RootErrorOptionCallbackRecord,
}

#[allow(
    dead_code,
    reason = "crate-private render error option metadata for future root error routing"
)]
impl RootRenderErrorOptionCallbackRecord {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn error(&self) -> &RootWorkLoopError {
        &self.error
    }

    #[must_use]
    pub(crate) const fn error_option_callbacks(&self) -> RootErrorOptionCallbackRecord {
        self.error_option_callbacks
    }

    #[must_use]
    pub(crate) const fn on_uncaught_error(&self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_uncaught_error()
    }

    #[must_use]
    pub(crate) const fn on_caught_error(&self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_caught_error()
    }

    #[must_use]
    pub(crate) const fn on_recoverable_error(&self) -> RootRecoverableErrorCallbackHandle {
        self.error_option_callbacks.on_recoverable_error()
    }

    #[must_use]
    pub(crate) const fn has_configured_error_callback(&self) -> bool {
        self.error_option_callbacks.has_configured_error_callback()
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_error_boundaries_enabled(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn recoverable_error_compatibility_claimed(&self) -> bool {
        false
    }
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootPingedRetryExecutionStatus {
    StaleCallback,
    NoWork,
    NoPingedRetryWork,
    RejectedSuspenseRetryRequest,
    StaleThenableBlocker,
    Rendered,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootPingedRetryExecutionRecord {
    callback: SchedulerCallbackRequest,
    validation: SchedulerCallbackValidationRecord,
    pinged_retry_lanes: Lanes,
    selected_priority_lanes: Lanes,
    selected_render_lanes: Lanes,
    status: RootPingedRetryExecutionStatus,
    render_phase: Option<HostRootRenderPhaseRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private ping/retry execution metadata for future Suspense retry workers"
)]
impl RootPingedRetryExecutionRecord {
    #[must_use]
    pub(crate) const fn callback(self) -> SchedulerCallbackRequest {
        self.callback
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.callback.root()
    }

    #[must_use]
    pub(crate) const fn callback_node(self) -> RootSchedulerCallbackHandle {
        self.callback.node()
    }

    #[must_use]
    pub(crate) const fn validation(self) -> SchedulerCallbackValidationRecord {
        self.validation
    }

    #[must_use]
    pub(crate) const fn pinged_retry_lanes(self) -> Lanes {
        self.pinged_retry_lanes
    }

    #[must_use]
    pub(crate) const fn selected_priority_lanes(self) -> Lanes {
        self.selected_priority_lanes
    }

    #[must_use]
    pub(crate) const fn selected_render_lanes(self) -> Lanes {
        self.selected_render_lanes
    }

    #[must_use]
    pub(crate) const fn status(self) -> RootPingedRetryExecutionStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn render_phase(self) -> Option<HostRootRenderPhaseRecord> {
        self.render_phase
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SuspenseThenableRetryRootSchedulerStatus {
    Accepted,
    RejectedUnacceptedRecord,
    RejectedOffscreenOnlyRecord,
    RejectedStaleBoundary,
    RejectedIncompatibleLaneSet,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SuspenseThenableRetrySchedulerCallbackBlocker {
    SuspenseBoundaryRendering,
    FallbackTraversal,
    WakeableSubscription,
    PublicSuspenseCompatibility,
}

pub(crate) const SUSPENSE_THENABLE_RETRY_SCHEDULER_CALLBACK_BLOCKERS:
    [SuspenseThenableRetrySchedulerCallbackBlocker; 4] = [
    SuspenseThenableRetrySchedulerCallbackBlocker::SuspenseBoundaryRendering,
    SuspenseThenableRetrySchedulerCallbackBlocker::FallbackTraversal,
    SuspenseThenableRetrySchedulerCallbackBlocker::WakeableSubscription,
    SuspenseThenableRetrySchedulerCallbackBlocker::PublicSuspenseCompatibility,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SuspenseThenableRetryRootSchedulerRequestRecord {
    root: FiberRootId,
    boundary: FiberId,
    retry_queue: UpdateQueueHandle,
    primary_offscreen_retry_queue: Option<UpdateQueueHandle>,
    retry_lane: Lane,
    pinged_lanes: Lanes,
    root_pinged_lanes_before: Lanes,
    root_pinged_lanes_after: Lanes,
    status: SuspenseThenableRetryRootSchedulerStatus,
    scheduled_root: Option<ScheduledRootUpdateResult>,
    scheduler_callback_blockers: &'static [SuspenseThenableRetrySchedulerCallbackBlocker; 4],
}

#[allow(
    dead_code,
    reason = "crate-private Suspense retry scheduler metadata is reserved for future Suspense workers"
)]
impl SuspenseThenableRetryRootSchedulerRequestRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn boundary(self) -> FiberId {
        self.boundary
    }

    #[must_use]
    pub(crate) const fn retry_queue(self) -> UpdateQueueHandle {
        self.retry_queue
    }

    #[must_use]
    pub(crate) const fn primary_offscreen_retry_queue(self) -> Option<UpdateQueueHandle> {
        self.primary_offscreen_retry_queue
    }

    #[must_use]
    pub(crate) const fn retry_lane(self) -> Lane {
        self.retry_lane
    }

    #[must_use]
    pub(crate) const fn pinged_lanes(self) -> Lanes {
        self.pinged_lanes
    }

    #[must_use]
    pub(crate) const fn root_pinged_lanes_before(self) -> Lanes {
        self.root_pinged_lanes_before
    }

    #[must_use]
    pub(crate) const fn root_pinged_lanes_after(self) -> Lanes {
        self.root_pinged_lanes_after
    }

    #[must_use]
    pub(crate) const fn status(self) -> SuspenseThenableRetryRootSchedulerStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn scheduled_root(self) -> Option<ScheduledRootUpdateResult> {
        self.scheduled_root
    }

    #[must_use]
    pub(crate) fn thenable_ping_scheduled_expected_retry_lane(self) -> bool {
        let expected_lanes = Lanes::from(self.retry_lane);
        let Some(scheduled_root) = self.scheduled_root else {
            return false;
        };

        self.accepted()
            && self.retry_lane.is_non_empty()
            && self.pinged_lanes == expected_lanes
            && self.pinged_lanes.includes_only_retries()
            && !self
                .root_pinged_lanes_before
                .contains_all(self.pinged_lanes)
            && self.root_pinged_lanes_after.contains_all(self.pinged_lanes)
            && scheduled_root.root() == self.root
    }

    #[must_use]
    pub(crate) const fn accepted(self) -> bool {
        matches!(
            self.status,
            SuspenseThenableRetryRootSchedulerStatus::Accepted
        )
    }

    #[must_use]
    pub(crate) const fn scheduler_callback_blockers(
        self,
    ) -> &'static [SuspenseThenableRetrySchedulerCallbackBlocker; 4] {
        self.scheduler_callback_blockers
    }

    #[must_use]
    pub(crate) const fn suspense_boundary_rendering_executed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn fallback_traversal_executed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn wakeable_subscription_performed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_suspense_compatibility_claimed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SuspenseThenableRetryRootRenderHandoffRecord {
    request: SuspenseThenableRetryRootSchedulerRequestRecord,
    execution: RootPingedRetryExecutionRecord,
}

#[allow(
    dead_code,
    reason = "crate-private Suspense retry render handoff metadata is reserved for future Suspense workers"
)]
impl SuspenseThenableRetryRootRenderHandoffRecord {
    #[must_use]
    pub(crate) const fn request(self) -> SuspenseThenableRetryRootSchedulerRequestRecord {
        self.request
    }

    #[must_use]
    pub(crate) const fn execution(self) -> RootPingedRetryExecutionRecord {
        self.execution
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.request.root()
    }

    #[must_use]
    pub(crate) const fn boundary(self) -> FiberId {
        self.request.boundary()
    }

    #[must_use]
    pub(crate) const fn retry_lane(self) -> Lane {
        self.request.retry_lane()
    }

    #[must_use]
    pub(crate) const fn pinged_lanes(self) -> Lanes {
        self.request.pinged_lanes()
    }

    #[must_use]
    pub(crate) const fn callback(self) -> SchedulerCallbackRequest {
        self.execution.callback()
    }

    #[must_use]
    pub(crate) const fn status(self) -> RootPingedRetryExecutionStatus {
        self.execution.status()
    }

    #[must_use]
    pub(crate) const fn render_phase(self) -> Option<HostRootRenderPhaseRecord> {
        self.execution.render_phase()
    }

    #[must_use]
    pub(crate) const fn scheduled_root(self) -> Option<ScheduledRootUpdateResult> {
        self.request.scheduled_root()
    }

    #[must_use]
    pub(crate) fn thenable_ping_scheduled_expected_retry_lane(self) -> bool {
        self.request.thenable_ping_scheduled_expected_retry_lane()
    }

    #[must_use]
    pub(crate) fn thenable_ping_reached_expected_retry_handoff(self) -> bool {
        self.thenable_ping_scheduled_expected_retry_lane() && self.root_work_loop_reached()
    }

    #[must_use]
    pub(crate) fn root_work_loop_reached(self) -> bool {
        let Some(render) = self.render_phase() else {
            return false;
        };

        self.request.accepted()
            && self.status() == RootPingedRetryExecutionStatus::Rendered
            && !self.execution.validation().is_stale()
            && render.root() == self.root()
            && self.execution.validation().root() == self.root()
            && self
                .execution
                .pinged_retry_lanes()
                .contains_all(self.pinged_lanes())
            && self.execution.selected_priority_lanes() == self.pinged_lanes()
            && render.render_lanes() == self.pinged_lanes()
            && self.execution.selected_render_lanes() == self.pinged_lanes()
    }

    #[must_use]
    pub(crate) fn proves_private_thenable_ping_render_handoff(self) -> bool {
        self.thenable_ping_reached_expected_retry_handoff()
            && !self.suspense_boundary_rendering_executed()
            && !self.fallback_traversal_executed()
            && !self.wakeable_subscription_performed()
            && !self.public_suspense_compatibility_claimed()
            && !self.public_root_compatibility_claimed()
    }

    #[must_use]
    pub(crate) const fn suspense_boundary_rendering_executed(self) -> bool {
        self.request.suspense_boundary_rendering_executed()
    }

    #[must_use]
    pub(crate) const fn fallback_traversal_executed(self) -> bool {
        self.request.fallback_traversal_executed()
    }

    #[must_use]
    pub(crate) const fn wakeable_subscription_performed(self) -> bool {
        self.request.wakeable_subscription_performed()
    }

    #[must_use]
    pub(crate) const fn public_suspense_compatibility_claimed(self) -> bool {
        self.request.public_suspense_compatibility_claimed()
    }

    #[must_use]
    pub(crate) const fn public_root_compatibility_claimed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RootSchedulerError {
    FiberRootStore(FiberRootStoreError),
    ConcurrentUpdate(ConcurrentUpdateError),
    RootUpdate(RootUpdateError),
    RootWorkLoop(RootWorkLoopError),
    ScheduleRecordWrongFiber {
        root: FiberRootId,
        expected: FiberId,
        actual: FiberId,
    },
    RescheduleRecordWrongRoot {
        expected: FiberRootId,
        actual: FiberRootId,
        fiber: FiberId,
    },
    RescheduleRecordMissingLane {
        root: FiberRootId,
        fiber: FiberId,
        lane: Lane,
        pending_lanes: Lanes,
    },
    TransitionSchedulerUnsupportedLane {
        root: FiberRootId,
        lane: Lane,
        source_priority: RootUpdateLaneSourcePriority,
        selected_lanes: Lanes,
    },
    TransitionSchedulerUnsupportedLaneSet {
        root: FiberRootId,
        lane: Lane,
        selected_lanes: Lanes,
    },
    TransitionSchedulerMissingEntanglement {
        root: FiberRootId,
        lane: Lane,
    },
    TransitionSchedulerEntanglementMismatch {
        root: FiberRootId,
        lane: Lane,
        queue: UpdateQueueHandle,
        entanglement: RootTransitionEntanglementRecord,
    },
    TransitionSchedulerIncompatibleEventLane {
        root: FiberRootId,
        requested_lane: Lane,
        current_event_transition_lane: Lane,
    },
}

impl Display for RootSchedulerError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::ConcurrentUpdate(error) => Display::fmt(error, formatter),
            Self::RootUpdate(error) => Display::fmt(error, formatter),
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
            Self::RescheduleRecordWrongRoot {
                expected,
                actual,
                fiber,
            } => write!(
                formatter,
                "reschedule record for root {} references fiber slot {} attached to root {}",
                expected.raw(),
                fiber.slot().get(),
                actual.raw()
            ),
            Self::RescheduleRecordMissingLane {
                root,
                fiber,
                lane,
                pending_lanes,
            } => write!(
                formatter,
                "reschedule record for root {} references fiber slot {} lane {}, but root pending lanes are {}",
                root.raw(),
                fiber.slot().get(),
                lane.bits(),
                pending_lanes.bits()
            ),
            Self::TransitionSchedulerUnsupportedLane {
                root,
                lane,
                source_priority,
                selected_lanes,
            } => write!(
                formatter,
                "root {} transition scheduler diagnostics require transition lane metadata; got lane {} from {:?} with selected lanes {}",
                root.raw(),
                lane.bits(),
                source_priority,
                selected_lanes.bits()
            ),
            Self::TransitionSchedulerUnsupportedLaneSet {
                root,
                lane,
                selected_lanes,
            } => write!(
                formatter,
                "root {} transition scheduler diagnostics cannot route lane {} from selected lanes {}",
                root.raw(),
                lane.bits(),
                selected_lanes.bits()
            ),
            Self::TransitionSchedulerMissingEntanglement { root, lane } => write!(
                formatter,
                "root {} transition scheduler diagnostics require entanglement evidence for lane {}",
                root.raw(),
                lane.bits()
            ),
            Self::TransitionSchedulerEntanglementMismatch {
                root,
                lane,
                queue,
                entanglement,
            } => write!(
                formatter,
                "root {} transition scheduler diagnostics have incompatible entanglement for lane {} queue {}; entanglement root {} lane {} queue {} lanes {}",
                root.raw(),
                lane.bits(),
                queue.raw(),
                entanglement.root().raw(),
                entanglement.lane().bits(),
                entanglement.queue().raw(),
                entanglement.entangled_lanes().bits()
            ),
            Self::TransitionSchedulerIncompatibleEventLane {
                root,
                requested_lane,
                current_event_transition_lane,
            } => write!(
                formatter,
                "root {} transition scheduler diagnostics requested lane {} but current event transition lane is {}",
                root.raw(),
                requested_lane.bits(),
                current_event_transition_lane.bits()
            ),
        }
    }
}

impl Error for RootSchedulerError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::ConcurrentUpdate(error) => Some(error),
            Self::RootUpdate(error) => Some(error),
            Self::RootWorkLoop(error) => Some(error),
            Self::ScheduleRecordWrongFiber { .. }
            | Self::RescheduleRecordWrongRoot { .. }
            | Self::RescheduleRecordMissingLane { .. }
            | Self::TransitionSchedulerUnsupportedLane { .. }
            | Self::TransitionSchedulerUnsupportedLaneSet { .. }
            | Self::TransitionSchedulerMissingEntanglement { .. }
            | Self::TransitionSchedulerEntanglementMismatch { .. }
            | Self::TransitionSchedulerIncompatibleEventLane { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for RootSchedulerError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<ConcurrentUpdateError> for RootSchedulerError {
    fn from(error: ConcurrentUpdateError) -> Self {
        Self::ConcurrentUpdate(error)
    }
}

impl From<RootUpdateError> for RootSchedulerError {
    fn from(error: RootUpdateError) -> Self {
        Self::RootUpdate(error)
    }
}

impl From<RootWorkLoopError> for RootSchedulerError {
    fn from(error: RootWorkLoopError) -> Self {
        Self::RootWorkLoop(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum SchedulerBridgeActContinuationExecutionError {
    Scheduler(RootSchedulerError),
    Commit(RootCommitError),
    #[cfg(test)]
    CommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
}

impl Display for SchedulerBridgeActContinuationExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Scheduler(error) => Display::fmt(error, formatter),
            Self::Commit(error) => Display::fmt(error, formatter),
            #[cfg(test)]
            Self::CommitHandoff(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for SchedulerBridgeActContinuationExecutionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Scheduler(error) => Some(error),
            Self::Commit(error) => Some(error),
            #[cfg(test)]
            Self::CommitHandoff(error) => Some(error.as_ref()),
        }
    }
}

impl From<RootSchedulerError> for SchedulerBridgeActContinuationExecutionError {
    fn from(error: RootSchedulerError) -> Self {
        Self::Scheduler(error)
    }
}

impl From<RootCommitError> for SchedulerBridgeActContinuationExecutionError {
    fn from(error: RootCommitError) -> Self {
        Self::Commit(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for SchedulerBridgeActContinuationExecutionError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::CommitHandoff(Box::new(error))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum SchedulerBridgeActQueueExecutionError {
    Scheduler(RootSchedulerError),
    SyncContinuation(RootSyncSchedulerContinuationExecutionError),
    ActContinuation(SchedulerBridgeActContinuationExecutionError),
}

impl Display for SchedulerBridgeActQueueExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Scheduler(error) => Display::fmt(error, formatter),
            Self::SyncContinuation(error) => Display::fmt(error, formatter),
            Self::ActContinuation(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for SchedulerBridgeActQueueExecutionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Scheduler(error) => Some(error),
            Self::SyncContinuation(error) => Some(error),
            Self::ActContinuation(error) => Some(error),
        }
    }
}

impl From<RootSchedulerError> for SchedulerBridgeActQueueExecutionError {
    fn from(error: RootSchedulerError) -> Self {
        Self::Scheduler(error)
    }
}

impl From<RootSyncSchedulerContinuationExecutionError> for SchedulerBridgeActQueueExecutionError {
    fn from(error: RootSyncSchedulerContinuationExecutionError) -> Self {
        Self::SyncContinuation(error)
    }
}

impl From<SchedulerBridgeActContinuationExecutionError> for SchedulerBridgeActQueueExecutionError {
    fn from(error: SchedulerBridgeActContinuationExecutionError) -> Self {
        Self::ActContinuation(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum RootSyncSchedulerContinuationExecutionError {
    Scheduler(RootSchedulerError),
    Commit(RootCommitError),
    #[cfg(test)]
    CommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
}

impl Display for RootSyncSchedulerContinuationExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Scheduler(error) => Display::fmt(error, formatter),
            Self::Commit(error) => Display::fmt(error, formatter),
            #[cfg(test)]
            Self::CommitHandoff(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for RootSyncSchedulerContinuationExecutionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Scheduler(error) => Some(error),
            Self::Commit(error) => Some(error),
            #[cfg(test)]
            Self::CommitHandoff(error) => Some(error.as_ref()),
        }
    }
}

impl From<RootSchedulerError> for RootSyncSchedulerContinuationExecutionError {
    fn from(error: RootSchedulerError) -> Self {
        Self::Scheduler(error)
    }
}

impl From<RootCommitError> for RootSyncSchedulerContinuationExecutionError {
    fn from(error: RootCommitError) -> Self {
        Self::Commit(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for RootSyncSchedulerContinuationExecutionError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::CommitHandoff(Box::new(error))
    }
}

pub fn ensure_root_is_scheduled<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    record: RootScheduleUpdateRecord,
) -> Result<ScheduledRootUpdateResult, RootSchedulerError> {
    validate_schedule_record(store, record)?;
    ensure_root_schedule_entry(store, record.root())
}

#[allow(
    dead_code,
    reason = "crate-private transition scheduler route is currently exercised by canary tests"
)]
pub(crate) fn record_transition_lane_scheduler_request_from_update_diagnostics_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    result: &UpdateContainerResult,
) -> Result<RootTransitionLaneSchedulerRequestRecord, RootSchedulerError> {
    validate_update_container_lane_diagnostics_for_canary(store, result)?;
    validate_schedule_record(store, result.schedule())?;

    let root = result.schedule().root();
    let lane = result.lane();
    let selected_next_lanes = result.selected_next_lanes();
    if result.source_priority() != RootUpdateLaneSourcePriority::TransitionLane
        || !lane.is_transition()
    {
        return Err(RootSchedulerError::TransitionSchedulerUnsupportedLane {
            root,
            lane,
            source_priority: result.source_priority(),
            selected_lanes: selected_next_lanes,
        });
    }

    validate_transition_lane_scheduler_lanes_for_canary(root, lane, selected_next_lanes)?;

    let entanglement = result
        .entanglement()
        .ok_or(RootSchedulerError::TransitionSchedulerMissingEntanglement { root, lane })?;
    validate_transition_lane_scheduler_entanglement_for_canary(store, result, entanglement)?;

    let current_event_transition_lane_before =
        store.root_scheduler().current_event_transition_lane();
    if current_event_transition_lane_before.is_non_empty()
        && current_event_transition_lane_before != lane
    {
        return Err(
            RootSchedulerError::TransitionSchedulerIncompatibleEventLane {
                root,
                requested_lane: lane,
                current_event_transition_lane: current_event_transition_lane_before,
            },
        );
    }

    let scheduled_root = ensure_root_schedule_entry(store, root)?;
    store
        .root_scheduler_mut()
        .set_current_event_transition_lane(lane);

    Ok(RootTransitionLaneSchedulerRequestRecord {
        root,
        fiber: result.schedule().fiber(),
        update: result.update(),
        queue: result.queue(),
        lane,
        event_priority: result.event_priority(),
        pending_lanes_before_enqueue: result.pending_lanes_before_enqueue(),
        pending_lanes_after_enqueue: result.pending_lanes_after_enqueue(),
        selected_next_lanes,
        entangled_lanes: entanglement.entangled_lanes(),
        current_event_transition_lane_before,
        current_event_transition_lane_after: store.root_scheduler().current_event_transition_lane(),
        scheduled_root,
    })
}

#[allow(
    dead_code,
    reason = "crate-private render error option metadata for future root error routing"
)]
pub(crate) fn record_root_render_error_option_callbacks<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    render_lanes: Lanes,
    error: RootWorkLoopError,
) -> Result<RootRenderErrorOptionCallbackRecord, RootSchedulerError> {
    let root = store.root(root_id)?;
    Ok(RootRenderErrorOptionCallbackRecord {
        root: root_id,
        render_lanes,
        error,
        error_option_callbacks: root
            .options()
            .error_option_callback_record(root_id, RootErrorOptionCallbackPhase::Render),
    })
}

#[allow(
    dead_code,
    reason = "crate-private passive scheduler flush gate is currently exercised by canary tests"
)]
pub(crate) fn schedule_passive_effects_flush_after_commit_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
) -> Result<PassiveEffectSchedulerFlushGateRecord, RootSchedulerError> {
    let root_id = commit.root();
    let Some(handoff) = commit.pending_passive_handoff() else {
        return Ok(PassiveEffectSchedulerFlushGateRecord {
            root: root_id,
            finished_work: None,
            lanes: Lanes::NO,
            pending_unmount_count: 0,
            pending_mount_count: 0,
            scheduler_request: None,
        });
    };

    store.root(handoff.root())?;
    let scheduler_request = store.scheduler_bridge_mut().schedule_passive_effects_flush(
        handoff.root(),
        handoff.finished_work(),
        handoff.lanes(),
        handoff.pending_unmount_count(),
        handoff.pending_mount_count(),
    );

    Ok(PassiveEffectSchedulerFlushGateRecord {
        root: handoff.root(),
        finished_work: Some(handoff.finished_work()),
        lanes: handoff.lanes(),
        pending_unmount_count: handoff.pending_unmount_count(),
        pending_mount_count: handoff.pending_mount_count(),
        scheduler_request: Some(scheduler_request),
    })
}

pub(crate) fn capture_passive_effect_root_error<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    source_fiber: FiberId,
    source: RootErrorCaptureSource,
) -> Result<RootErrorCaptureScheduleRecord, RootSchedulerError> {
    let (root_fiber, pending_lanes_before, error_option_callbacks) = {
        let root = store.root(root_id)?;
        (
            root.current(),
            root.lanes().pending_lanes(),
            root.options()
                .error_option_callback_record(root_id, RootErrorOptionCallbackPhase::Commit),
        )
    };
    let lane = Lane::SYNC;
    let marked_root = mark_update_lane_from_fiber_to_root(store, source_fiber, lane)?;
    if marked_root != root_id {
        return Err(RootSchedulerError::RescheduleRecordWrongRoot {
            expected: root_id,
            actual: marked_root,
            fiber: source_fiber,
        });
    }

    let scheduled_root = ensure_root_schedule_entry(store, root_id)?;
    let pending_lanes_after = store.root(root_id)?.lanes().pending_lanes();

    Ok(RootErrorCaptureScheduleRecord {
        source,
        root: root_id,
        root_fiber,
        source_fiber,
        lane,
        pending_lanes_before,
        pending_lanes_after,
        scheduled_root,
        error_option_callbacks,
    })
}

pub(crate) fn ensure_root_is_rescheduled<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    record: RootRescheduleRequestRecord,
) -> Result<ScheduledRootUpdateResult, RootSchedulerError> {
    validate_reschedule_record(store, record)?;
    ensure_root_schedule_entry(store, record.root())
}

fn ensure_root_schedule_entry<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<ScheduledRootUpdateResult, RootSchedulerError> {
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

#[allow(
    dead_code,
    reason = "crate-private ping/retry execution path reserved for future Suspense retry workers"
)]
pub(crate) fn execute_pinged_retry_root_callback<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    callback: SchedulerCallbackRequest,
) -> Result<RootPingedRetryExecutionRecord, RootSchedulerError> {
    let validation =
        validate_scheduled_host_root_callback(store, callback.root(), callback.node())?;
    if validation.is_stale() {
        return Ok(RootPingedRetryExecutionRecord {
            callback,
            validation,
            pinged_retry_lanes: Lanes::NO,
            selected_priority_lanes: Lanes::NO,
            selected_render_lanes: Lanes::NO,
            status: RootPingedRetryExecutionStatus::StaleCallback,
            render_phase: None,
        });
    }

    let pinged_retry_lanes = store
        .root(callback.root())?
        .lanes()
        .pinged_lanes()
        .intersect(Lanes::RETRY);
    let lane_selection = select_lanes_for_scheduled_task(store, callback.root())?;
    let selected_priority_lanes = lane_selection.priority_lanes();
    let selected_render_lanes = lane_selection.render_lanes();

    if selected_render_lanes.is_empty() {
        store
            .root_mut(callback.root())?
            .scheduling_mut()
            .clear_callback();
        return Ok(RootPingedRetryExecutionRecord {
            callback,
            validation,
            pinged_retry_lanes,
            selected_priority_lanes,
            selected_render_lanes,
            status: RootPingedRetryExecutionStatus::NoWork,
            render_phase: None,
        });
    }

    let selected_priority_is_pinged_retry = selected_priority_lanes.includes_only_retries()
        && selected_priority_lanes.intersect(pinged_retry_lanes) == selected_priority_lanes;
    let selected_render_is_pinged_retry = selected_render_lanes.includes_only_retries()
        && selected_render_lanes.intersect(pinged_retry_lanes) == selected_render_lanes;

    if !selected_priority_is_pinged_retry || !selected_render_is_pinged_retry {
        return Ok(RootPingedRetryExecutionRecord {
            callback,
            validation,
            pinged_retry_lanes,
            selected_priority_lanes,
            selected_render_lanes,
            status: RootPingedRetryExecutionStatus::NoPingedRetryWork,
            render_phase: None,
        });
    }

    let render_result = render_host_root_via_scheduler_callback(
        store,
        callback.root(),
        callback.node(),
        selected_render_lanes,
    )?;
    let render_phase = render_result.render_phase();
    let status = if render_phase.is_some() {
        RootPingedRetryExecutionStatus::Rendered
    } else {
        RootPingedRetryExecutionStatus::StaleCallback
    };

    Ok(RootPingedRetryExecutionRecord {
        callback,
        validation: render_result.validation(),
        pinged_retry_lanes,
        selected_priority_lanes,
        selected_render_lanes,
        status,
        render_phase,
    })
}

#[allow(
    dead_code,
    reason = "crate-private Suspense retry execution path reserved for future Suspense retry workers"
)]
pub(crate) fn execute_suspense_thenable_retry_root_callback<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    request: SuspenseThenableRetryRootSchedulerRequestRecord,
    callback: SchedulerCallbackRequest,
) -> Result<RootPingedRetryExecutionRecord, RootSchedulerError> {
    let validation =
        validate_scheduled_host_root_callback(store, callback.root(), callback.node())?;
    let pinged_retry_lanes = store
        .root(callback.root())?
        .lanes()
        .pinged_lanes()
        .intersect(Lanes::RETRY);

    if validation.is_stale() {
        return Ok(RootPingedRetryExecutionRecord {
            callback,
            validation,
            pinged_retry_lanes,
            selected_priority_lanes: Lanes::NO,
            selected_render_lanes: Lanes::NO,
            status: RootPingedRetryExecutionStatus::StaleCallback,
            render_phase: None,
        });
    }

    if !suspense_retry_request_is_accepted_for_callback(request, callback, pinged_retry_lanes) {
        return Ok(RootPingedRetryExecutionRecord {
            callback,
            validation,
            pinged_retry_lanes,
            selected_priority_lanes: Lanes::NO,
            selected_render_lanes: Lanes::NO,
            status: RootPingedRetryExecutionStatus::RejectedSuspenseRetryRequest,
            render_phase: None,
        });
    }

    if !suspense_retry_request_is_current(store, request) {
        return Ok(RootPingedRetryExecutionRecord {
            callback,
            validation,
            pinged_retry_lanes,
            selected_priority_lanes: Lanes::NO,
            selected_render_lanes: Lanes::NO,
            status: RootPingedRetryExecutionStatus::StaleThenableBlocker,
            render_phase: None,
        });
    }

    execute_pinged_retry_root_callback(store, callback)
}

#[allow(
    dead_code,
    reason = "crate-private Suspense retry render handoff is reserved for future Suspense workers"
)]
pub(crate) fn execute_suspense_thenable_retry_root_render_handoff<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    request: SuspenseThenableRetryRootSchedulerRequestRecord,
    callback: SchedulerCallbackRequest,
) -> Result<SuspenseThenableRetryRootRenderHandoffRecord, RootSchedulerError> {
    let execution = execute_suspense_thenable_retry_root_callback(store, request, callback)?;

    Ok(SuspenseThenableRetryRootRenderHandoffRecord { request, execution })
}

fn suspense_thenable_retry_root_scheduler_record(
    root: FiberRootId,
    suspense: &UnsupportedSuspenseChildShapeRecord,
    status: SuspenseThenableRetryRootSchedulerStatus,
    root_pinged_lanes_before: Lanes,
    root_pinged_lanes_after: Lanes,
    scheduled_root: Option<ScheduledRootUpdateResult>,
) -> SuspenseThenableRetryRootSchedulerRequestRecord {
    let thenable = suspense.thenable_ping_blocker();

    SuspenseThenableRetryRootSchedulerRequestRecord {
        root,
        boundary: suspense.fiber(),
        retry_queue: thenable.retry_queue(),
        primary_offscreen_retry_queue: thenable.primary_offscreen_retry_queue(),
        retry_lane: thenable.ping_lane(),
        pinged_lanes: thenable.ping_lanes(),
        root_pinged_lanes_before,
        root_pinged_lanes_after,
        status,
        scheduled_root,
        scheduler_callback_blockers: &SUSPENSE_THENABLE_RETRY_SCHEDULER_CALLBACK_BLOCKERS,
    }
}

fn suspense_retry_request_is_accepted_for_callback(
    request: SuspenseThenableRetryRootSchedulerRequestRecord,
    callback: SchedulerCallbackRequest,
    pinged_retry_lanes: Lanes,
) -> bool {
    request.accepted()
        && request.root == callback.root()
        && request.pinged_lanes.is_non_empty()
        && request.pinged_lanes.includes_only_retries()
        && request.pinged_lanes.intersect(pinged_retry_lanes) == request.pinged_lanes
}

fn suspense_retry_request_is_current<H: HostTypes>(
    store: &FiberRootStore<H>,
    request: SuspenseThenableRetryRootSchedulerRequestRecord,
) -> bool {
    let Ok(node) = store.fiber_arena().get(request.boundary) else {
        return false;
    };

    if node.tag() != FiberTag::Suspense || node.update_queue() != request.retry_queue {
        return false;
    }

    matches!(root_for_updated_fiber(store, request.boundary), Ok(actual) if actual == request.root)
}

fn suspense_boundary_is_current_for_retry<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    suspense: &UnsupportedSuspenseChildShapeRecord,
) -> bool {
    let thenable = suspense.thenable_ping_blocker();
    let Ok(node) = store.fiber_arena().get(suspense.fiber()) else {
        return false;
    };

    if node.tag() != FiberTag::Suspense || node.update_queue() != thenable.retry_queue() {
        return false;
    }

    matches!(root_for_updated_fiber(store, suspense.fiber()), Ok(actual) if actual == root_id)
}

fn root_lane_state_accepts_suspense_retry(root_lanes: &RootLaneState, pinged_lanes: Lanes) -> bool {
    root_lanes.pending_lanes().contains_all(pinged_lanes)
        && root_lanes.suspended_lanes().contains_all(pinged_lanes)
}

#[allow(
    dead_code,
    reason = "crate-private Suspense retry scheduler request path reserved for future Suspense workers"
)]
pub(crate) fn request_suspense_thenable_retry_root_scheduler<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    suspense: &UnsupportedSuspenseChildShapeRecord,
) -> Result<SuspenseThenableRetryRootSchedulerRequestRecord, RootSchedulerError> {
    let thenable = suspense.thenable_ping_blocker();
    let root_pinged_lanes_before = store.root(root_id)?.lanes().pinged_lanes();

    if thenable.is_offscreen_only_retry_queue() {
        return Ok(suspense_thenable_retry_root_scheduler_record(
            root_id,
            suspense,
            SuspenseThenableRetryRootSchedulerStatus::RejectedOffscreenOnlyRecord,
            root_pinged_lanes_before,
            root_pinged_lanes_before,
            None,
        ));
    }

    if !thenable.has_suspense_boundary_retry_queue() {
        return Ok(suspense_thenable_retry_root_scheduler_record(
            root_id,
            suspense,
            SuspenseThenableRetryRootSchedulerStatus::RejectedUnacceptedRecord,
            root_pinged_lanes_before,
            root_pinged_lanes_before,
            None,
        ));
    }

    if !thenable.has_compatible_retry_ping_lanes() {
        return Ok(suspense_thenable_retry_root_scheduler_record(
            root_id,
            suspense,
            SuspenseThenableRetryRootSchedulerStatus::RejectedIncompatibleLaneSet,
            root_pinged_lanes_before,
            root_pinged_lanes_before,
            None,
        ));
    }

    if !suspense_boundary_is_current_for_retry(store, root_id, suspense) {
        return Ok(suspense_thenable_retry_root_scheduler_record(
            root_id,
            suspense,
            SuspenseThenableRetryRootSchedulerStatus::RejectedStaleBoundary,
            root_pinged_lanes_before,
            root_pinged_lanes_before,
            None,
        ));
    }

    if !root_lane_state_accepts_suspense_retry(store.root(root_id)?.lanes(), thenable.ping_lanes())
    {
        return Ok(suspense_thenable_retry_root_scheduler_record(
            root_id,
            suspense,
            SuspenseThenableRetryRootSchedulerStatus::RejectedIncompatibleLaneSet,
            root_pinged_lanes_before,
            root_pinged_lanes_before,
            None,
        ));
    }

    store
        .root_mut(root_id)?
        .lanes_mut()
        .mark_pinged(thenable.ping_lanes());
    let scheduled_root = ensure_root_schedule_entry(store, root_id)?;
    let root_pinged_lanes_after = store.root(root_id)?.lanes().pinged_lanes();

    Ok(suspense_thenable_retry_root_scheduler_record(
        root_id,
        suspense,
        SuspenseThenableRetryRootSchedulerStatus::Accepted,
        root_pinged_lanes_before,
        root_pinged_lanes_after,
        Some(scheduled_root),
    ))
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

#[allow(
    dead_code,
    reason = "crate-private expired-lane sync scheduler continuation is exercised by canary tests"
)]
pub(crate) fn execute_expired_lane_sync_scheduler_continuation_for_root_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    current_time: LaneTimestamp,
    requested_callback_node: RootSchedulerCallbackHandle,
) -> Result<
    RootExpiredLaneSyncSchedulerContinuationRecord,
    RootSyncSchedulerContinuationExecutionError,
> {
    let current_callback_node = store
        .root(root_id)
        .map_err(RootSchedulerError::from)?
        .scheduling()
        .callback_node();
    let expired_lanes_before = store
        .root(root_id)
        .map_err(RootSchedulerError::from)?
        .lanes()
        .expired_lanes();

    if current_callback_node != requested_callback_node {
        return Ok(expired_lane_sync_scheduler_continuation_record(
            root_id,
            current_time,
            requested_callback_node,
            current_callback_node,
            expired_lanes_before,
            expired_lanes_before,
            Lanes::NO,
            Lanes::NO,
            None,
            None,
            RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode,
        ));
    }

    store
        .root_mut(root_id)
        .map_err(RootSchedulerError::from)?
        .lanes_mut()
        .mark_starved_lanes_as_expired(current_time);
    let expired_lanes_after = store
        .root(root_id)
        .map_err(RootSchedulerError::from)?
        .lanes()
        .expired_lanes();
    let lane_selection = select_lanes_for_scheduled_task(store, root_id)?;
    let selected_priority_lanes = lane_selection.priority_lanes();
    let selected_render_lanes = lane_selection.render_lanes();

    if expired_lanes_after.is_empty() {
        return Ok(expired_lane_sync_scheduler_continuation_record(
            root_id,
            current_time,
            requested_callback_node,
            current_callback_node,
            expired_lanes_before,
            expired_lanes_after,
            selected_priority_lanes,
            selected_render_lanes,
            None,
            None,
            RootExpiredLaneSyncSchedulerContinuationStatus::NoExpiredLanes,
        ));
    }

    if selected_render_lanes.is_empty() || !selected_render_lanes.contains_any(expired_lanes_after)
    {
        return Ok(expired_lane_sync_scheduler_continuation_record(
            root_id,
            current_time,
            requested_callback_node,
            current_callback_node,
            expired_lanes_before,
            expired_lanes_after,
            selected_priority_lanes,
            selected_render_lanes,
            None,
            None,
            RootExpiredLaneSyncSchedulerContinuationStatus::NoExpiredWorkSelected,
        ));
    }

    let render_phase = render_host_root_for_lanes(store, root_id, selected_render_lanes)
        .map_err(RootSchedulerError::from)?;
    #[cfg(test)]
    record_root_finished_work_for_scheduler_handoff_for_canary(store, render_phase)?;
    let handoff = RootSyncFlushRecord {
        order: 0,
        root: root_id,
        lanes: selected_render_lanes,
        status: RootSyncFlushRecordStatus::RenderedAwaitingCommit,
        render_phase,
    };
    let continuation = execute_sync_scheduler_continuation_for_render_handoff(
        store,
        handoff,
        requested_callback_node,
    )?;
    let status = expired_lane_sync_scheduler_status_from_sync_continuation(continuation.status());

    Ok(expired_lane_sync_scheduler_continuation_record(
        root_id,
        current_time,
        requested_callback_node,
        current_callback_node,
        expired_lanes_before,
        expired_lanes_after,
        selected_priority_lanes,
        selected_render_lanes,
        Some(handoff),
        Some(continuation),
        status,
    ))
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    dead_code,
    reason = "private expired-lane queue/lane scheduler continuation is exercised by focused canaries"
)]
pub(crate) fn execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    current_time: LaneTimestamp,
    requested_callback_node: RootSchedulerCallbackHandle,
    handoff: RootSyncFlushRecord,
    queue_handoff: Option<&HostRootUpdateQueueLaneHandoffRecordForCanary>,
) -> Result<
    RootExpiredLaneSyncSchedulerQueueLaneContinuationRecordForCanary,
    RootSyncSchedulerContinuationExecutionError,
> {
    let current_callback_node = store
        .root(root_id)
        .map_err(RootSchedulerError::from)?
        .scheduling()
        .callback_node();
    let expired_lanes_before = store
        .root(root_id)
        .map_err(RootSchedulerError::from)?
        .lanes()
        .expired_lanes();

    if current_callback_node != requested_callback_node {
        return Ok(
            expired_lane_sync_scheduler_queue_lane_continuation_record_for_canary(
                root_id,
                current_time,
                requested_callback_node,
                current_callback_node,
                expired_lanes_before,
                expired_lanes_before,
                Lanes::NO,
                Lanes::NO,
                None,
                None,
                RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::StaleCallbackNode,
            ),
        );
    }

    store
        .root_mut(root_id)
        .map_err(RootSchedulerError::from)?
        .lanes_mut()
        .mark_starved_lanes_as_expired(current_time);
    let expired_lanes_after = store
        .root(root_id)
        .map_err(RootSchedulerError::from)?
        .lanes()
        .expired_lanes();
    let lane_selection = select_lanes_for_scheduled_task(store, root_id)?;
    let selected_priority_lanes = lane_selection.priority_lanes();
    let selected_render_lanes = lane_selection.render_lanes();

    if expired_lanes_after.is_empty() {
        return Ok(
            expired_lane_sync_scheduler_queue_lane_continuation_record_for_canary(
                root_id,
                current_time,
                requested_callback_node,
                current_callback_node,
                expired_lanes_before,
                expired_lanes_after,
                selected_priority_lanes,
                selected_render_lanes,
                None,
                None,
                RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::NoExpiredLanes,
            ),
        );
    }

    if selected_render_lanes.is_empty() || !selected_render_lanes.contains_any(expired_lanes_after)
    {
        return Ok(
            expired_lane_sync_scheduler_queue_lane_continuation_record_for_canary(
                root_id,
                current_time,
                requested_callback_node,
                current_callback_node,
                expired_lanes_before,
                expired_lanes_after,
                selected_priority_lanes,
                selected_render_lanes,
                None,
                None,
                RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::NoExpiredWorkSelected,
            ),
        );
    }

    if handoff.root() != root_id
        || handoff.render_phase().root() != root_id
        || handoff.lanes() != selected_render_lanes
        || handoff.render_phase().render_lanes() != selected_render_lanes
    {
        return Ok(
            expired_lane_sync_scheduler_queue_lane_continuation_record_for_canary(
                root_id,
                current_time,
                requested_callback_node,
                current_callback_node,
                expired_lanes_before,
                expired_lanes_after,
                selected_priority_lanes,
                selected_render_lanes,
                Some(handoff),
                None,
                RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByLaneMismatch,
            ),
        );
    }

    let continuation = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        store,
        handoff,
        requested_callback_node,
        queue_handoff,
    )?;
    let status = expired_lane_sync_scheduler_status_from_queue_lane_continuation_for_canary(
        continuation.status(),
    );

    Ok(
        expired_lane_sync_scheduler_queue_lane_continuation_record_for_canary(
            root_id,
            current_time,
            requested_callback_node,
            current_callback_node,
            expired_lanes_before,
            expired_lanes_after,
            selected_priority_lanes,
            selected_render_lanes,
            Some(handoff),
            Some(continuation),
            status,
        ),
    )
}

fn expired_lane_sync_scheduler_status_from_sync_continuation(
    status: RootSyncSchedulerContinuationExecutionStatus,
) -> RootExpiredLaneSyncSchedulerContinuationStatus {
    match status {
        RootSyncSchedulerContinuationExecutionStatus::StaleCallbackNode => {
            RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode
        }
        RootSyncSchedulerContinuationExecutionStatus::BlockedByPendingPassive => {
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByPendingPassive
        }
        RootSyncSchedulerContinuationExecutionStatus::NoSyncWork => {
            RootExpiredLaneSyncSchedulerContinuationStatus::NoContinuationWork
        }
        RootSyncSchedulerContinuationExecutionStatus::BlockedByLaneMismatch => {
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByLaneMismatch
        }
        RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch => {
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByFinishedWorkHandoffMismatch
        }
        RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted => {
            RootExpiredLaneSyncSchedulerContinuationStatus::RenderedAndCommitted
        }
    }
}

#[cfg(test)]
fn expired_lane_sync_scheduler_status_from_queue_lane_continuation_for_canary(
    status: RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary,
) -> RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary {
    match status {
        RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::StaleCallbackNode => {
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::StaleCallbackNode
        }
        RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByPendingPassive => {
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByPendingPassive
        }
        RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::NoSyncWork => {
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::NoContinuationWork
        }
        RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByLaneMismatch => {
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByLaneMismatch
        }
        RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByFinishedWorkHandoffMismatch => {
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByFinishedWorkHandoffMismatch
        }
        RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch => {
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        }
        RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::RenderedAndCommitted => {
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::RenderedAndCommitted
        }
    }
}

#[allow(clippy::too_many_arguments)]
fn expired_lane_sync_scheduler_continuation_record(
    root: FiberRootId,
    current_time: LaneTimestamp,
    requested_callback_node: RootSchedulerCallbackHandle,
    current_callback_node: RootSchedulerCallbackHandle,
    expired_lanes_before: Lanes,
    expired_lanes_after: Lanes,
    selected_priority_lanes: Lanes,
    selected_render_lanes: Lanes,
    handoff: Option<RootSyncFlushRecord>,
    continuation: Option<RootSyncSchedulerContinuationExecutionRecord>,
    status: RootExpiredLaneSyncSchedulerContinuationStatus,
) -> RootExpiredLaneSyncSchedulerContinuationRecord {
    RootExpiredLaneSyncSchedulerContinuationRecord {
        root,
        current_time,
        requested_callback_node,
        current_callback_node,
        expired_lanes_before,
        expired_lanes_after,
        selected_priority_lanes,
        selected_render_lanes,
        handoff,
        continuation,
        status,
    }
}

#[cfg(test)]
#[allow(
    clippy::too_many_arguments,
    reason = "private expired-lane queue/lane scheduler evidence mirrors the canary assertion shape"
)]
fn expired_lane_sync_scheduler_queue_lane_continuation_record_for_canary(
    root: FiberRootId,
    current_time: LaneTimestamp,
    requested_callback_node: RootSchedulerCallbackHandle,
    current_callback_node: RootSchedulerCallbackHandle,
    expired_lanes_before: Lanes,
    expired_lanes_after: Lanes,
    selected_priority_lanes: Lanes,
    selected_render_lanes: Lanes,
    handoff: Option<RootSyncFlushRecord>,
    continuation: Option<RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary>,
    status: RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary,
) -> RootExpiredLaneSyncSchedulerQueueLaneContinuationRecordForCanary {
    let source_metadata = RootExpiredLaneSyncSchedulerQueueLaneContinuationMetadataForCanary {
        root,
        current_time,
        requested_callback_node,
        current_callback_node,
        expired_lanes_before,
        expired_lanes_after,
        selected_priority_lanes,
        selected_render_lanes,
        handoff,
        status,
    };
    RootExpiredLaneSyncSchedulerQueueLaneContinuationRecordForCanary {
        root,
        current_time,
        requested_callback_node,
        current_callback_node,
        expired_lanes_before,
        expired_lanes_after,
        selected_priority_lanes,
        selected_render_lanes,
        handoff,
        continuation,
        status,
        source_metadata,
    }
}

pub(crate) fn execute_sync_scheduler_continuation_for_render_handoff<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    handoff: RootSyncFlushRecord,
    requested_callback_node: RootSchedulerCallbackHandle,
) -> Result<RootSyncSchedulerContinuationExecutionRecord, RootSyncSchedulerContinuationExecutionError>
{
    let current_callback_node = store
        .root(handoff.root())
        .map_err(RootSchedulerError::from)?
        .scheduling()
        .callback_node();
    if current_callback_node != requested_callback_node {
        return Ok(sync_scheduler_continuation_execution_record(
            handoff,
            requested_callback_node,
            current_callback_node,
            Lanes::NO,
            None,
            None,
            RootSyncSchedulerContinuationExecutionStatus::StaleCallbackNode,
            None,
        ));
    }

    let selected_lanes = sync_scheduler_continuation_lanes_for_root(store, handoff.root())?;
    let pending_passive_blocker =
        sync_scheduler_pending_passive_blocker_for_root(store, handoff.root())?;
    if pending_passive_blocker.is_some() {
        return Ok(sync_scheduler_continuation_execution_record(
            handoff,
            requested_callback_node,
            current_callback_node,
            selected_lanes,
            pending_passive_blocker,
            None,
            RootSyncSchedulerContinuationExecutionStatus::BlockedByPendingPassive,
            None,
        ));
    }

    if selected_lanes.is_empty() {
        return Ok(sync_scheduler_continuation_execution_record(
            handoff,
            requested_callback_node,
            current_callback_node,
            selected_lanes,
            None,
            None,
            RootSyncSchedulerContinuationExecutionStatus::NoSyncWork,
            None,
        ));
    }

    if selected_lanes != handoff.lanes() {
        return Ok(sync_scheduler_continuation_execution_record(
            handoff,
            requested_callback_node,
            current_callback_node,
            selected_lanes,
            None,
            None,
            RootSyncSchedulerContinuationExecutionStatus::BlockedByLaneMismatch,
            None,
        ));
    }

    #[cfg(test)]
    let finished_work_handoff_identity =
        root_sync_scheduler_finished_work_handoff_identity_for_canary(store, handoff)?;
    #[cfg(test)]
    if !finished_work_handoff_identity.accepted_for_root_scheduler_commit_handoff() {
        return Ok(sync_scheduler_continuation_execution_record(
            handoff,
            requested_callback_node,
            current_callback_node,
            selected_lanes,
            None,
            Some(finished_work_handoff_identity),
            RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch,
            None,
        ));
    }

    #[cfg(test)]
    let root_commit_handoff = {
        let pending = record_host_root_finished_work_pending_commit_for_canary(
            store,
            handoff.render_phase(),
            handoff.order(),
        )?;
        commit_finished_host_root_with_finished_work_handoff_for_canary(
            store,
            handoff.render_phase(),
            Some(pending),
            handoff.order().saturating_add(1),
        )?
    };
    #[cfg(test)]
    let commit = root_commit_handoff.commit().clone();
    #[cfg(not(test))]
    let commit = crate::commit_finished_host_root(store, handoff.render_phase())?;
    #[cfg(test)]
    let finished_work_identity_for_record = Some(finished_work_handoff_identity);
    #[cfg(not(test))]
    let finished_work_identity_for_record = None;
    recompute_might_have_pending_sync_work(store)?;

    let record = sync_scheduler_continuation_execution_record(
        handoff,
        requested_callback_node,
        current_callback_node,
        selected_lanes,
        None,
        finished_work_identity_for_record,
        RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted,
        Some(commit),
    );
    #[cfg(test)]
    let record = {
        let mut record = record;
        record.root_commit_handoff = Some(root_commit_handoff);
        record
    };

    Ok(record)
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    dead_code,
    reason = "private HostRoot queue/lane scheduler continuation is exercised by focused canaries"
)]
pub(crate) fn execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    handoff: RootSyncFlushRecord,
    requested_callback_node: RootSchedulerCallbackHandle,
    queue_handoff: Option<&HostRootUpdateQueueLaneHandoffRecordForCanary>,
) -> Result<
    RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary,
    RootSyncSchedulerContinuationExecutionError,
> {
    let current_callback_node = store
        .root(handoff.root())
        .map_err(RootSchedulerError::from)?
        .scheduling()
        .callback_node();
    if current_callback_node != requested_callback_node {
        return Ok(
            sync_scheduler_queue_lane_continuation_execution_record_for_canary(
                handoff,
                requested_callback_node,
                current_callback_node,
                Lanes::NO,
                None,
                None,
                RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::StaleCallbackNode,
                queue_handoff,
                None,
                None,
                None,
            ),
        );
    }

    let selected_lanes = sync_scheduler_continuation_lanes_for_root(store, handoff.root())?;
    let pending_passive_blocker =
        sync_scheduler_pending_passive_blocker_for_root(store, handoff.root())?;
    if pending_passive_blocker.is_some() {
        return Ok(sync_scheduler_queue_lane_continuation_execution_record_for_canary(
            handoff,
            requested_callback_node,
            current_callback_node,
            selected_lanes,
            pending_passive_blocker,
            None,
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByPendingPassive,
            queue_handoff,
            None,
            None,
            None,
        ));
    }

    if selected_lanes.is_empty() {
        return Ok(
            sync_scheduler_queue_lane_continuation_execution_record_for_canary(
                handoff,
                requested_callback_node,
                current_callback_node,
                selected_lanes,
                None,
                None,
                RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::NoSyncWork,
                queue_handoff,
                None,
                None,
                None,
            ),
        );
    }

    if selected_lanes != handoff.lanes() {
        return Ok(sync_scheduler_queue_lane_continuation_execution_record_for_canary(
            handoff,
            requested_callback_node,
            current_callback_node,
            selected_lanes,
            None,
            None,
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByLaneMismatch,
            queue_handoff,
            None,
            None,
            None,
        ));
    }

    let finished_work_handoff_identity =
        root_sync_scheduler_finished_work_handoff_identity_for_canary(store, handoff)?;
    if !finished_work_handoff_identity.accepted_for_root_scheduler_commit_handoff() {
        return Ok(sync_scheduler_queue_lane_continuation_execution_record_for_canary(
            handoff,
            requested_callback_node,
            current_callback_node,
            selected_lanes,
            None,
            Some(finished_work_handoff_identity),
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByFinishedWorkHandoffMismatch,
            queue_handoff,
            None,
            None,
            None,
        ));
    }

    if let Err(error) = validate_host_root_update_queue_lane_handoff_for_commit_for_canary(
        store,
        handoff.root(),
        handoff.render_phase(),
        queue_handoff,
    ) {
        return Ok(sync_scheduler_queue_lane_continuation_execution_record_for_canary(
            handoff,
            requested_callback_node,
            current_callback_node,
            selected_lanes,
            None,
            Some(finished_work_handoff_identity),
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch,
            queue_handoff,
            Some(error),
            None,
            None,
        ));
    }

    let pending_finished_work = match record_host_root_finished_work_pending_commit_for_canary(
        store,
        handoff.render_phase(),
        handoff.order(),
    ) {
        Ok(pending_finished_work) => pending_finished_work,
        Err(_error) => {
            return Ok(sync_scheduler_queue_lane_continuation_execution_record_for_canary(
                handoff,
                requested_callback_node,
                current_callback_node,
                selected_lanes,
                None,
                Some(finished_work_handoff_identity),
                RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByFinishedWorkHandoffMismatch,
                queue_handoff,
                None,
                None,
                None,
            ));
        }
    };
    let queue_commit_handoff =
        match commit_host_root_update_queue_lane_handoff_with_finished_work_pending_commit_for_canary(
            store,
            handoff.root(),
            handoff.render_phase(),
            queue_handoff,
            Some(pending_finished_work),
            handoff.order().saturating_add(1),
        ) {
            Ok(queue_commit_handoff) => queue_commit_handoff,
            Err(error) => {
                return Ok(sync_scheduler_queue_lane_continuation_execution_record_for_canary(
                    handoff,
                    requested_callback_node,
                    current_callback_node,
                    selected_lanes,
                    None,
                    Some(finished_work_handoff_identity),
                    RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch,
                    queue_handoff,
                    Some(error),
                    None,
                    None,
                ));
            }
        };
    let commit = queue_commit_handoff.commit().clone();
    recompute_might_have_pending_sync_work(store)?;
    let currentness_identity = root_finished_work_queue_lane_commit_currentness_identity_for_canary(
        handoff,
        requested_callback_node,
        current_callback_node,
        selected_lanes,
        &queue_commit_handoff,
    );
    let currentness_source_token = store
        .root_scheduler_mut()
        .record_finished_work_queue_lane_commit_currentness_source(currentness_identity);

    let mut execution = sync_scheduler_queue_lane_continuation_execution_record_for_canary(
        handoff,
        requested_callback_node,
        current_callback_node,
        selected_lanes,
        None,
        Some(finished_work_handoff_identity),
        RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::RenderedAndCommitted,
        queue_handoff,
        None,
        Some(queue_commit_handoff),
        Some(commit),
    );
    execution.currentness_source_token = Some(currentness_source_token);

    Ok(execution)
}

#[cfg(test)]
#[allow(
    clippy::too_many_arguments,
    reason = "private queue/lane scheduler continuation evidence mirrors the canary assertion shape"
)]
fn sync_scheduler_queue_lane_continuation_execution_record_for_canary(
    handoff: RootSyncFlushRecord,
    requested_callback_node: RootSchedulerCallbackHandle,
    current_callback_node: RootSchedulerCallbackHandle,
    selected_lanes: Lanes,
    pending_passive_blocker: Option<RootSyncSchedulerPendingPassiveBlockerRecord>,
    finished_work_handoff_identity: Option<RootSyncSchedulerFinishedWorkHandoffIdentityForCanary>,
    status: RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary,
    queue_handoff: Option<&HostRootUpdateQueueLaneHandoffRecordForCanary>,
    queue_handoff_error: Option<HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary>,
    queue_commit_handoff: Option<HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary>,
    commit: Option<HostRootCommitRecord>,
) -> RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary {
    RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary {
        handoff,
        requested_callback_node,
        current_callback_node,
        selected_lanes,
        pending_passive_blocker,
        finished_work_handoff_identity,
        status,
        queue_handoff: queue_handoff.cloned(),
        queue_handoff_error,
        queue_commit_handoff,
        commit,
        currentness_source_token: None,
    }
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    dead_code,
    reason = "private transition HostRoot queue/lane scheduler continuation is exercised by focused canaries"
)]
pub(crate) fn execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    request: RootTransitionLaneSchedulerRequestRecord,
    callback_execution: RootSchedulerCallbackExecutionRecord,
    queue_handoff: Option<&HostRootUpdateQueueLaneHandoffRecordForCanary>,
) -> Result<
    RootTransitionSchedulerQueueLaneContinuationRecordForCanary,
    RootSyncSchedulerContinuationExecutionError,
> {
    let (
        current_callback_node,
        root_current_before_continuation,
        root_pending_lanes_before_continuation,
        root_entangled_lanes_before_continuation,
    ) = {
        let root = store
            .root(request.root())
            .map_err(RootSchedulerError::from)?;
        (
            root.scheduling().callback_node(),
            root.current(),
            root.lanes().pending_lanes(),
            root.lanes().entangled_lanes(),
        )
    };
    let current_event_transition_lane = store.root_scheduler().current_event_transition_lane();

    if transition_callback_execution_is_stale_for_canary(
        request,
        callback_execution,
        current_callback_node,
    ) {
        return Ok(
            transition_scheduler_queue_lane_continuation_record_for_canary(
                request,
                callback_execution,
                current_callback_node,
                current_event_transition_lane,
                root_current_before_continuation,
                root_pending_lanes_before_continuation,
                root_entangled_lanes_before_continuation,
                None,
                RootTransitionSchedulerQueueLaneContinuationStatusForCanary::StaleCallbackNode,
                queue_handoff,
                None,
                None,
                None,
            ),
        );
    }

    if !root_pending_lanes_before_continuation.contains_all(request.selected_next_lanes()) {
        return Ok(
            transition_scheduler_queue_lane_continuation_record_for_canary(
                request,
                callback_execution,
                current_callback_node,
                current_event_transition_lane,
                root_current_before_continuation,
                root_pending_lanes_before_continuation,
                root_entangled_lanes_before_continuation,
                None,
                RootTransitionSchedulerQueueLaneContinuationStatusForCanary::NoTransitionWork,
                queue_handoff,
                None,
                None,
                None,
            ),
        );
    }

    if root_current_before_continuation != request.fiber()
        || current_event_transition_lane != request.lane()
    {
        return Ok(transition_scheduler_queue_lane_continuation_record_for_canary(
            request,
            callback_execution,
            current_callback_node,
            current_event_transition_lane,
            root_current_before_continuation,
            root_pending_lanes_before_continuation,
            root_entangled_lanes_before_continuation,
            None,
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::StaleTransitionDiagnostics,
            queue_handoff,
            None,
            None,
            None,
        ));
    }

    if !transition_scheduler_request_entanglement_is_current_for_canary(
        request,
        root_entangled_lanes_before_continuation,
    ) {
        return Ok(transition_scheduler_queue_lane_continuation_record_for_canary(
            request,
            callback_execution,
            current_callback_node,
            current_event_transition_lane,
            root_current_before_continuation,
            root_pending_lanes_before_continuation,
            root_entangled_lanes_before_continuation,
            None,
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByTransitionEntanglementMismatch,
            queue_handoff,
            None,
            None,
            None,
        ));
    }

    let Some(render_phase) = callback_execution.render_phase() else {
        return Ok(
            transition_scheduler_queue_lane_continuation_record_for_canary(
                request,
                callback_execution,
                current_callback_node,
                current_event_transition_lane,
                root_current_before_continuation,
                root_pending_lanes_before_continuation,
                root_entangled_lanes_before_continuation,
                None,
                RootTransitionSchedulerQueueLaneContinuationStatusForCanary::NoTransitionWork,
                queue_handoff,
                None,
                None,
                None,
            ),
        );
    };

    if !transition_callback_render_lanes_match_request_for_canary(request, callback_execution) {
        return Ok(
            transition_scheduler_queue_lane_continuation_record_for_canary(
                request,
                callback_execution,
                current_callback_node,
                current_event_transition_lane,
                root_current_before_continuation,
                root_pending_lanes_before_continuation,
                root_entangled_lanes_before_continuation,
                None,
                RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByLaneMismatch,
                queue_handoff,
                None,
                None,
                None,
            ),
        );
    }

    if store
        .root(render_phase.root())
        .map_err(RootSchedulerError::from)?
        .finished_work()
        .is_none()
    {
        record_root_finished_work_for_scheduler_handoff_for_canary(store, render_phase)?;
    }

    let render_handoff = root_sync_flush_record_for_canary(
        0,
        request.root(),
        callback_execution.selected_lanes(),
        render_phase,
    );
    let finished_work_handoff_identity =
        root_sync_scheduler_finished_work_handoff_identity_for_canary(store, render_handoff)?;
    if !finished_work_handoff_identity.accepted_for_root_scheduler_commit_handoff() {
        return Ok(transition_scheduler_queue_lane_continuation_record_for_canary(
            request,
            callback_execution,
            current_callback_node,
            current_event_transition_lane,
            root_current_before_continuation,
            root_pending_lanes_before_continuation,
            root_entangled_lanes_before_continuation,
            Some(finished_work_handoff_identity),
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByFinishedWorkHandoffMismatch,
            queue_handoff,
            None,
            None,
            None,
        ));
    }

    if let Err(error) = validate_host_root_update_queue_lane_handoff_for_commit_for_canary(
        store,
        request.root(),
        render_phase,
        queue_handoff,
    ) {
        return Ok(transition_scheduler_queue_lane_continuation_record_for_canary(
            request,
            callback_execution,
            current_callback_node,
            current_event_transition_lane,
            root_current_before_continuation,
            root_pending_lanes_before_continuation,
            root_entangled_lanes_before_continuation,
            Some(finished_work_handoff_identity),
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch,
            queue_handoff,
            Some(error),
            None,
            None,
        ));
    }

    let pending_finished_work = match record_host_root_finished_work_pending_commit_for_canary(
        store,
        render_phase,
        0,
    ) {
        Ok(pending_finished_work) => pending_finished_work,
        Err(_error) => {
            return Ok(transition_scheduler_queue_lane_continuation_record_for_canary(
                    request,
                    callback_execution,
                    current_callback_node,
                    current_event_transition_lane,
                    root_current_before_continuation,
                    root_pending_lanes_before_continuation,
                    root_entangled_lanes_before_continuation,
                    Some(finished_work_handoff_identity),
                    RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByFinishedWorkHandoffMismatch,
                    queue_handoff,
                    None,
                    None,
                    None,
                ));
        }
    };
    let queue_commit_handoff =
        match commit_host_root_update_queue_lane_handoff_with_finished_work_pending_commit_for_canary(
            store,
            request.root(),
            render_phase,
            queue_handoff,
            Some(pending_finished_work),
            1,
        ) {
            Ok(queue_commit_handoff) => queue_commit_handoff,
            Err(error) => {
                return Ok(transition_scheduler_queue_lane_continuation_record_for_canary(
                    request,
                    callback_execution,
                    current_callback_node,
                    current_event_transition_lane,
                    root_current_before_continuation,
                    root_pending_lanes_before_continuation,
                    root_entangled_lanes_before_continuation,
                    Some(finished_work_handoff_identity),
                    RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch,
                    queue_handoff,
                    Some(error),
                    None,
                    None,
                ));
            }
        };
    let commit = queue_commit_handoff.commit().clone();
    recompute_might_have_pending_sync_work(store)?;
    let currentness_identity = root_finished_work_queue_lane_commit_currentness_identity_for_canary(
        render_handoff,
        callback_execution.callback_node(),
        current_callback_node,
        callback_execution.selected_lanes(),
        &queue_commit_handoff,
    );
    let currentness_source_token = store
        .root_scheduler_mut()
        .record_finished_work_queue_lane_commit_currentness_source(currentness_identity);

    let mut continuation = transition_scheduler_queue_lane_continuation_record_for_canary(
        request,
        callback_execution,
        current_callback_node,
        current_event_transition_lane,
        root_current_before_continuation,
        root_pending_lanes_before_continuation,
        root_entangled_lanes_before_continuation,
        Some(finished_work_handoff_identity),
        RootTransitionSchedulerQueueLaneContinuationStatusForCanary::RenderedAndCommitted,
        queue_handoff,
        None,
        Some(queue_commit_handoff),
        Some(commit),
    );
    continuation.currentness_source_token = Some(currentness_source_token);

    Ok(continuation)
}

#[cfg(test)]
fn transition_callback_execution_is_stale_for_canary(
    request: RootTransitionLaneSchedulerRequestRecord,
    callback_execution: RootSchedulerCallbackExecutionRecord,
    current_callback_node: RootSchedulerCallbackHandle,
) -> bool {
    let validation = callback_execution.validation();
    validation.is_stale()
        || validation.root() != request.root()
        || validation.requested_callback_node() != callback_execution.callback_node()
        || validation.current_callback_node() != current_callback_node
        || callback_execution.root() != request.root()
        || callback_execution.callback_node() != current_callback_node
}

#[cfg(test)]
fn transition_scheduler_request_entanglement_is_current_for_canary(
    request: RootTransitionLaneSchedulerRequestRecord,
    root_entangled_lanes: Lanes,
) -> bool {
    request.lane().is_transition()
        && request.selected_next_lanes().is_non_empty()
        && request.selected_next_lanes().contains_lane(request.lane())
        && request.selected_next_lanes().includes_only_transitions()
        && request.entangled_lanes() == request.selected_next_lanes()
        && request.entangled_lanes().contains_lane(request.lane())
        && request.entangled_lanes().includes_only_transitions()
        && root_entangled_lanes.contains_all(request.entangled_lanes())
}

#[cfg(test)]
fn transition_callback_render_lanes_match_request_for_canary(
    request: RootTransitionLaneSchedulerRequestRecord,
    callback_execution: RootSchedulerCallbackExecutionRecord,
) -> bool {
    callback_execution.status() == RootSchedulerCallbackExecutionStatus::Rendered
        && callback_execution.selected_lanes() == request.selected_next_lanes()
        && callback_execution.render_phase().is_some_and(|render| {
            render.root() == request.root()
                && render.current() == request.fiber()
                && render.render_lanes() == request.selected_next_lanes()
                && render.render_lanes() == request.entangled_lanes()
        })
}

#[cfg(test)]
#[allow(
    clippy::too_many_arguments,
    reason = "private transition queue/lane scheduler evidence mirrors the canary assertion shape"
)]
fn transition_scheduler_queue_lane_continuation_record_for_canary(
    request: RootTransitionLaneSchedulerRequestRecord,
    callback_execution: RootSchedulerCallbackExecutionRecord,
    current_callback_node: RootSchedulerCallbackHandle,
    current_event_transition_lane: Lane,
    root_current_before_continuation: FiberId,
    root_pending_lanes_before_continuation: Lanes,
    root_entangled_lanes_before_continuation: Lanes,
    finished_work_handoff_identity: Option<RootSyncSchedulerFinishedWorkHandoffIdentityForCanary>,
    status: RootTransitionSchedulerQueueLaneContinuationStatusForCanary,
    queue_handoff: Option<&HostRootUpdateQueueLaneHandoffRecordForCanary>,
    queue_handoff_error: Option<HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary>,
    queue_commit_handoff: Option<HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary>,
    commit: Option<HostRootCommitRecord>,
) -> RootTransitionSchedulerQueueLaneContinuationRecordForCanary {
    let queue_handoff = queue_handoff.cloned();
    let source_metadata = RootTransitionSchedulerQueueLaneContinuationMetadataForCanary {
        request,
        callback_execution,
        current_callback_node,
        current_event_transition_lane,
        root_current_before_continuation,
        root_pending_lanes_before_continuation,
        root_entangled_lanes_before_continuation,
        finished_work_handoff_identity,
        status,
        queue_handoff: queue_handoff.clone(),
        queue_handoff_error: queue_handoff_error.clone(),
        queue_commit_handoff: queue_commit_handoff.clone(),
        commit: commit.clone(),
    };
    RootTransitionSchedulerQueueLaneContinuationRecordForCanary {
        request,
        callback_execution,
        current_callback_node,
        current_event_transition_lane,
        root_current_before_continuation,
        root_pending_lanes_before_continuation,
        root_entangled_lanes_before_continuation,
        finished_work_handoff_identity,
        status,
        queue_handoff,
        queue_handoff_error,
        queue_commit_handoff,
        commit,
        source_metadata,
        currentness_source_token: None,
    }
}

fn sync_scheduler_continuation_lanes_for_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<Lanes, RootSchedulerError> {
    let expired_lanes = store.root(root_id)?.lanes().expired_lanes();
    if expired_lanes.is_non_empty() {
        let lane_selection = select_lanes_for_scheduled_task(store, root_id)?;
        let render_lanes = lane_selection.render_lanes();
        if render_lanes.contains_any(expired_lanes) {
            return Ok(render_lanes);
        }
    }

    let sync_lanes = sync_flush_lanes_for_root(store, root_id)?;
    if sync_lanes.is_non_empty() {
        return Ok(sync_lanes);
    }

    Ok(Lanes::NO)
}

fn sync_scheduler_pending_passive_blocker_for_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<Option<RootSyncSchedulerPendingPassiveBlockerRecord>, RootSchedulerError> {
    let root = store.root(root_id)?;
    let pending_passive = root.scheduling().pending_passive();
    if !pending_passive.has_commit_handoff() {
        return Ok(None);
    }

    Ok(Some(RootSyncSchedulerPendingPassiveBlockerRecord {
        root: pending_passive.root().unwrap_or(root_id),
        finished_work: pending_passive.finished_work(),
        lanes: pending_passive.lanes(),
        pending_unmount_count: pending_passive.passive_unmounts().len(),
        pending_mount_count: pending_passive.passive_mounts().len(),
    }))
}

#[allow(
    clippy::too_many_arguments,
    reason = "private sync scheduler continuation evidence mirrors the canary assertion shape"
)]
fn sync_scheduler_continuation_execution_record(
    handoff: RootSyncFlushRecord,
    requested_callback_node: RootSchedulerCallbackHandle,
    current_callback_node: RootSchedulerCallbackHandle,
    selected_lanes: Lanes,
    pending_passive_blocker: Option<RootSyncSchedulerPendingPassiveBlockerRecord>,
    finished_work_handoff_identity: Option<RootSyncSchedulerFinishedWorkHandoffIdentityForCanary>,
    status: RootSyncSchedulerContinuationExecutionStatus,
    commit: Option<HostRootCommitRecord>,
) -> RootSyncSchedulerContinuationExecutionRecord {
    RootSyncSchedulerContinuationExecutionRecord {
        handoff,
        requested_callback_node,
        current_callback_node,
        selected_lanes,
        pending_passive_blocker,
        finished_work_handoff_identity,
        status,
        commit,
        #[cfg(test)]
        root_commit_handoff: None,
    }
}

#[cfg(test)]
fn root_sync_scheduler_finished_work_handoff_identity_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    handoff: RootSyncFlushRecord,
) -> Result<
    RootSyncSchedulerFinishedWorkHandoffIdentityForCanary,
    RootSyncSchedulerContinuationExecutionError,
> {
    let root = store
        .root(handoff.root())
        .map_err(RootSchedulerError::from)?;
    let scheduling = root.scheduling();
    let render_phase = handoff.render_phase();

    Ok(RootSyncSchedulerFinishedWorkHandoffIdentityForCanary {
        root: handoff.root(),
        render_phase_root: render_phase.root(),
        selected_lanes: handoff.lanes(),
        previous_current: render_phase.current(),
        current_before_commit: root.current(),
        pending_work_before_commit: scheduling.work_in_progress(),
        root_finished_work_before_commit: root.finished_work(),
        finished_work: render_phase.finished_work(),
        render_lanes: render_phase.render_lanes(),
        finished_lanes: render_phase.render_lanes(),
        root_finished_lanes_before_commit: root.finished_lanes(),
        pending_lanes_before_commit: root.lanes().pending_lanes(),
        render_phase_lanes_before_commit: scheduling.work_in_progress_root_render_lanes(),
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
                #[cfg(test)]
                record_root_finished_work_for_scheduler_handoff_for_canary(store, render_phase)?;
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

#[cfg(test)]
fn record_root_finished_work_for_scheduler_handoff_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render_phase: HostRootRenderPhaseRecord,
) -> Result<(), RootSchedulerError> {
    store
        .root_mut(render_phase.root())?
        .record_finished_work_for_canary(render_phase.finished_work(), render_phase.render_lanes());
    Ok(())
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

fn validate_reschedule_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    record: RootRescheduleRequestRecord,
) -> Result<(), RootSchedulerError> {
    let actual_root = root_for_updated_fiber(store, record.fiber())?;
    if actual_root != record.root() {
        return Err(RootSchedulerError::RescheduleRecordWrongRoot {
            expected: record.root(),
            actual: actual_root,
            fiber: record.fiber(),
        });
    }

    let pending_lanes = store.root(record.root())?.lanes().pending_lanes();
    if !pending_lanes.contains_lane(record.lane()) {
        return Err(RootSchedulerError::RescheduleRecordMissingLane {
            root: record.root(),
            fiber: record.fiber(),
            lane: record.lane(),
            pending_lanes,
        });
    }

    Ok(())
}

fn validate_transition_lane_scheduler_lanes_for_canary(
    root: FiberRootId,
    lane: Lane,
    selected_lanes: Lanes,
) -> Result<(), RootSchedulerError> {
    if !lane.is_transition()
        || selected_lanes.is_empty()
        || !selected_lanes.contains_lane(lane)
        || !selected_lanes.includes_only_transitions()
    {
        return Err(RootSchedulerError::TransitionSchedulerUnsupportedLaneSet {
            root,
            lane,
            selected_lanes,
        });
    }

    Ok(())
}

fn validate_transition_lane_scheduler_entanglement_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    result: &UpdateContainerResult,
    entanglement: RootTransitionEntanglementRecord,
) -> Result<(), RootSchedulerError> {
    let root = result.schedule().root();
    let lane = result.lane();
    let queue = result.queue();
    let root_entangled_lanes = store.root(root)?.lanes().entangled_lanes();
    let entangled_lanes = entanglement.entangled_lanes();

    if entanglement.root() != root
        || entanglement.queue() != queue
        || entanglement.lane() != lane
        || !entangled_lanes.contains_lane(lane)
        || !entangled_lanes.includes_only_transitions()
        || !root_entangled_lanes.contains_all(entangled_lanes)
    {
        return Err(
            RootSchedulerError::TransitionSchedulerEntanglementMismatch {
                root,
                lane,
                queue,
                entanglement,
            },
        );
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
mod tests;
