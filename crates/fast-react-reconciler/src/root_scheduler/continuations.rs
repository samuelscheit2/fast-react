#[cfg(test)]
use std::error::Error;
#[cfg(test)]
use std::fmt::{self, Display, Formatter};

use fast_react_core::{FiberId, LaneTimestamp, Lanes};
#[cfg(test)]
use fast_react_core::{FiberTag, Lane, StateNodeHandle};
use fast_react_host_config::HostTypes;

#[cfg(test)]
use crate::FiberRootStoreError;
#[cfg(test)]
use crate::RootElementHandle;
#[cfg(test)]
use crate::root_commit::HostRootFinishedWorkCommitHandoffRecordForCanary;
use crate::root_commit::{HostRootCommitRecord, PendingPassiveCommitHandoff};
use crate::root_config::{RootErrorOptionCallbackPhase, RootErrorOptionCallbackRecord};
#[cfg(test)]
use crate::root_updates::{
    HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary,
    HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary,
    HostRootUpdateQueueLaneHandoffRecordForCanary,
};
use crate::{
    ExecutionContextState, FiberRootId, FiberRootStore, HostRootRenderPhaseRecord,
    RootCallbackPriority, RootErrorCallbackHandle, RootRecoverableErrorCallbackHandle,
    RootRenderExitStatus, RootSchedulerCallbackHandle, SyncFlushExecutionContextRecord,
};

#[cfg(test)]
use super::{
    RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary,
    RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary,
    RootFinishedWorkQueueLaneCommitCurrentnessRecordForCanary,
    RootFinishedWorkQueueLaneCommitCurrentnessSourceTokenForCanary,
};
use super::{RootSchedulerError, sync_flush_lanes_for_root};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootSyncFlushPlan {
    pub(super) skipped_reentrant_flush: bool,
    pub(super) skipped_no_sync_work: bool,
    pub(super) sync_roots: Vec<FiberRootId>,
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
    #[cfg(test)]
    StaleForCanary,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootSyncFlushRecord {
    pub(super) order: usize,
    pub(super) root: FiberRootId,
    pub(super) lanes: Lanes,
    pub(super) status: RootSyncFlushRecordStatus,
    pub(super) render_phase: HostRootRenderPhaseRecord,
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

#[cfg(test)]
pub(crate) const fn root_sync_flush_record_for_canary(
    order: usize,
    root: FiberRootId,
    lanes: Lanes,
    render_phase: HostRootRenderPhaseRecord,
) -> RootSyncFlushRecord {
    RootSyncFlushRecord {
        order,
        root,
        lanes,
        status: RootSyncFlushRecordStatus::RenderedAwaitingCommit,
        render_phase,
    }
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private forged sync-flush status helper is consumed through root_scheduler re-export by focused canaries"
)]
pub(crate) const fn root_sync_flush_record_with_status_for_canary(
    order: usize,
    root: FiberRootId,
    lanes: Lanes,
    status: RootSyncFlushRecordStatus,
    render_phase: HostRootRenderPhaseRecord,
) -> RootSyncFlushRecord {
    RootSyncFlushRecord {
        order,
        root,
        lanes,
        status,
        render_phase,
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootSyncSchedulerContinuationExecutionStatus {
    StaleCallbackNode,
    BlockedByPendingPassive,
    NoSyncWork,
    BlockedByLaneMismatch,
    #[allow(
        dead_code,
        reason = "constructed by test-only finished-work handoff validation"
    )]
    BlockedByFinishedWorkHandoffMismatch,
    RenderedAndCommitted,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootExpiredLaneSyncSchedulerContinuationStatus {
    StaleCallbackNode,
    NoExpiredLanes,
    NoExpiredWorkSelected,
    BlockedByPendingPassive,
    NoContinuationWork,
    BlockedByLaneMismatch,
    #[allow(
        dead_code,
        reason = "mirrors the test-only sync continuation finished-work blocker"
    )]
    BlockedByFinishedWorkHandoffMismatch,
    RenderedAndCommitted,
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary {
    StaleCallbackNode,
    NoExpiredLanes,
    NoExpiredWorkSelected,
    BlockedByPendingPassive,
    NoContinuationWork,
    BlockedByLaneMismatch,
    BlockedByFinishedWorkHandoffMismatch,
    BlockedByQueueLaneHandoffMismatch,
    RenderedAndCommitted,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootSyncSchedulerFinishedWorkHandoffIdentityForCanary {
    pub(super) root: FiberRootId,
    pub(super) render_phase_root: FiberRootId,
    pub(super) selected_lanes: Lanes,
    pub(super) previous_current: FiberId,
    pub(super) current_before_commit: FiberId,
    pub(super) pending_work_before_commit: Option<FiberId>,
    pub(super) root_finished_work_before_commit: Option<FiberId>,
    pub(super) finished_work: FiberId,
    pub(super) render_lanes: Lanes,
    pub(super) finished_lanes: Lanes,
    pub(super) root_finished_lanes_before_commit: Lanes,
    pub(super) pending_lanes_before_commit: Lanes,
    pub(super) render_phase_lanes_before_commit: Lanes,
}

#[allow(
    dead_code,
    reason = "crate-private root scheduler finished-work identity is reserved for canary continuation checks"
)]
impl RootSyncSchedulerFinishedWorkHandoffIdentityForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn render_phase_root(self) -> FiberRootId {
        self.render_phase_root
    }

    #[must_use]
    pub(crate) const fn selected_lanes(self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub(crate) const fn previous_current(self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub(crate) const fn current_before_commit(self) -> FiberId {
        self.current_before_commit
    }

    #[must_use]
    pub(crate) const fn pending_work_before_commit(self) -> Option<FiberId> {
        self.pending_work_before_commit
    }

    #[must_use]
    pub(crate) const fn root_finished_work_before_commit(self) -> Option<FiberId> {
        self.root_finished_work_before_commit
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn finished_lanes(self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn root_finished_lanes_before_commit(self) -> Lanes {
        self.root_finished_lanes_before_commit
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before_commit(self) -> Lanes {
        self.pending_lanes_before_commit
    }

    #[must_use]
    pub(crate) const fn render_phase_lanes_before_commit(self) -> Lanes {
        self.render_phase_lanes_before_commit
    }

    #[must_use]
    pub(crate) fn accepted_for_root_scheduler_commit_handoff(self) -> bool {
        self.root == self.render_phase_root
            && self.current_before_commit == self.previous_current
            && self.pending_work_before_commit == Some(self.finished_work)
            && self.root_finished_work_before_commit == Some(self.finished_work)
            && self.render_lanes == self.selected_lanes
            && self.finished_lanes == self.selected_lanes
            && self.root_finished_lanes_before_commit == self.finished_lanes
            && self.render_phase_lanes_before_commit == self.render_lanes
            && self
                .pending_lanes_before_commit
                .contains_all(self.selected_lanes)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootSyncSchedulerPendingPassiveBlockerRecord {
    pub(super) root: FiberRootId,
    pub(super) finished_work: Option<FiberId>,
    pub(super) lanes: Lanes,
    pub(super) pending_unmount_count: usize,
    pub(super) pending_mount_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private sync scheduler continuation metadata is reserved for private root execution workers"
)]
impl RootSyncSchedulerPendingPassiveBlockerRecord {
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
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootSyncSchedulerContinuationExecutionRecord {
    pub(super) handoff: RootSyncFlushRecord,
    pub(super) requested_callback_node: RootSchedulerCallbackHandle,
    pub(super) current_callback_node: RootSchedulerCallbackHandle,
    pub(super) selected_lanes: Lanes,
    pub(super) pending_passive_blocker: Option<RootSyncSchedulerPendingPassiveBlockerRecord>,
    pub(super) finished_work_handoff_identity:
        Option<RootSyncSchedulerFinishedWorkHandoffIdentityForCanary>,
    pub(super) status: RootSyncSchedulerContinuationExecutionStatus,
    pub(super) commit: Option<HostRootCommitRecord>,
    #[cfg(test)]
    pub(super) root_commit_handoff: Option<HostRootFinishedWorkCommitHandoffRecordForCanary>,
}

#[allow(
    dead_code,
    reason = "crate-private sync scheduler continuation metadata is reserved for private root execution workers"
)]
impl RootSyncSchedulerContinuationExecutionRecord {
    #[must_use]
    pub(crate) const fn handoff(&self) -> RootSyncFlushRecord {
        self.handoff
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.handoff.root()
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
    pub(crate) const fn handoff_lanes(&self) -> Lanes {
        self.handoff.lanes()
    }

    #[must_use]
    pub(crate) const fn selected_lanes(&self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub(crate) const fn pending_passive_blocker(
        &self,
    ) -> Option<RootSyncSchedulerPendingPassiveBlockerRecord> {
        self.pending_passive_blocker
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff_identity(
        &self,
    ) -> Option<RootSyncSchedulerFinishedWorkHandoffIdentityForCanary> {
        self.finished_work_handoff_identity
    }

    #[must_use]
    pub(crate) const fn status(&self) -> RootSyncSchedulerContinuationExecutionStatus {
        self.status
    }

    #[must_use]
    pub(crate) fn commit(&self) -> Option<&HostRootCommitRecord> {
        self.commit.as_ref()
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn root_commit_handoff_for_canary(
        &self,
    ) -> Option<&HostRootFinishedWorkCommitHandoffRecordForCanary> {
        self.root_commit_handoff.as_ref()
    }

    #[must_use]
    pub(crate) const fn did_execute_private_sync_scheduler_continuation(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
        )
    }

    #[must_use]
    pub(crate) const fn rejected_stale_callback_node(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerContinuationExecutionStatus::StaleCallbackNode
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_pending_passive(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerContinuationExecutionStatus::BlockedByPendingPassive
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_lane_mismatch(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerContinuationExecutionStatus::BlockedByLaneMismatch
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_finished_work_handoff_mismatch(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch
        )
    }

    #[must_use]
    pub(crate) fn consumed_accepted_render_handoff(&self) -> bool {
        self.commit.as_ref().is_some_and(|commit| {
            self.did_execute_private_sync_scheduler_continuation()
                && commit.root() == self.root()
                && commit.current() == self.handoff.render_phase().finished_work()
                && commit.finished_lanes() == self.handoff.lanes()
                && self
                    .finished_work_handoff_identity
                    .is_some_and(RootSyncSchedulerFinishedWorkHandoffIdentityForCanary::accepted_for_root_scheduler_commit_handoff)
        })
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
    pub(crate) const fn executes_public_effects(&self) -> bool {
        false
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn accepted_root_scheduler_execution_evidence_for_canary(&self) -> bool {
        self.did_execute_private_sync_scheduler_continuation()
            && self.consumed_accepted_render_handoff()
            && self.selected_lanes == self.handoff.lanes()
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn accepted_root_commit_execution_evidence_for_canary(&self) -> bool {
        self.root_commit_handoff
            .as_ref()
            .is_some_and(HostRootFinishedWorkCommitHandoffRecordForCanary::proves_private_root_finished_work_commit_metadata_handoff)
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn routed_through_root_scheduler_and_commit_evidence_for_canary(&self) -> bool {
        self.accepted_root_scheduler_execution_evidence_for_canary()
            && self.accepted_root_commit_execution_evidence_for_canary()
            && self.async_callback_execution_blocked()
            && self.public_update_scheduling_blocked()
            && !self.public_root_compatibility_claimed()
            && !self.executes_public_effects()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary {
    StaleCallbackNode,
    BlockedByPendingPassive,
    NoSyncWork,
    BlockedByLaneMismatch,
    BlockedByFinishedWorkHandoffMismatch,
    BlockedByQueueLaneHandoffMismatch,
    RenderedAndCommitted,
}

#[cfg(test)]
#[derive(Debug, PartialEq, Eq)]
pub(crate) struct RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary {
    pub(super) handoff: RootSyncFlushRecord,
    pub(super) requested_callback_node: RootSchedulerCallbackHandle,
    pub(super) current_callback_node: RootSchedulerCallbackHandle,
    pub(super) selected_lanes: Lanes,
    pub(super) pending_passive_blocker: Option<RootSyncSchedulerPendingPassiveBlockerRecord>,
    pub(super) finished_work_handoff_identity:
        Option<RootSyncSchedulerFinishedWorkHandoffIdentityForCanary>,
    pub(super) status: RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary,
    pub(super) queue_handoff: Option<HostRootUpdateQueueLaneHandoffRecordForCanary>,
    pub(super) queue_handoff_error:
        Option<HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary>,
    pub(super) queue_commit_handoff:
        Option<HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary>,
    pub(super) commit: Option<HostRootCommitRecord>,
    pub(super) currentness_source_token:
        Option<RootFinishedWorkQueueLaneCommitCurrentnessSourceTokenForCanary>,
}

#[cfg(test)]
impl Clone for RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary {
    fn clone(&self) -> Self {
        Self {
            handoff: self.handoff,
            requested_callback_node: self.requested_callback_node,
            current_callback_node: self.current_callback_node,
            selected_lanes: self.selected_lanes,
            pending_passive_blocker: self.pending_passive_blocker,
            finished_work_handoff_identity: self.finished_work_handoff_identity,
            status: self.status,
            queue_handoff: self.queue_handoff.clone(),
            queue_handoff_error: self.queue_handoff_error.clone(),
            queue_commit_handoff: self.queue_commit_handoff.clone(),
            commit: self.commit.clone(),
            currentness_source_token: None,
        }
    }
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private HostRoot queue/lane scheduler continuation canaries consume this evidence"
)]
impl RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary {
    #[must_use]
    pub(crate) const fn handoff(&self) -> RootSyncFlushRecord {
        self.handoff
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.handoff.root()
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
    pub(crate) const fn selected_lanes(&self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub(crate) const fn handoff_lanes(&self) -> Lanes {
        self.handoff.lanes()
    }

    #[must_use]
    pub(crate) const fn pending_passive_blocker(
        &self,
    ) -> Option<RootSyncSchedulerPendingPassiveBlockerRecord> {
        self.pending_passive_blocker
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
    ) -> RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary {
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
    pub(crate) const fn did_execute_queue_lane_scheduler_continuation(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::RenderedAndCommitted
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_queue_lane_handoff(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_finished_work_handoff_mismatch(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByFinishedWorkHandoffMismatch
        )
    }

    #[must_use]
    pub(crate) const fn rejected_stale_callback_node(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::StaleCallbackNode
        )
    }

    #[must_use]
    pub(crate) const fn no_sync_work(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::NoSyncWork
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
    pub(crate) const fn executes_public_effects(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) fn accepted_root_scheduler_execution_evidence_for_canary(&self) -> bool {
        self.did_execute_queue_lane_scheduler_continuation()
            && self.requested_callback_node == self.current_callback_node
            && self.selected_lanes == self.handoff.lanes()
            && self.finished_work_handoff_identity.is_some_and(
                RootSyncSchedulerFinishedWorkHandoffIdentityForCanary::accepted_for_root_scheduler_commit_handoff,
            )
            && self.commit.as_ref().is_some_and(|commit| {
                let render = self.handoff.render_phase();
                commit.root() == self.handoff.root()
                    && commit.previous_current() == render.current()
                    && commit.current() == render.finished_work()
                    && commit.finished_lanes() == self.selected_lanes
                    && commit.remaining_lanes() == render.remaining_lanes()
                    && commit.pending_lanes() == render.remaining_lanes()
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
                    && commit_handoff.selected_lanes() == self.selected_lanes
                    && commit_handoff.finished_lanes() == self.handoff.lanes()
                    && commit_handoff.remaining_lanes()
                        == self.handoff.render_phase().remaining_lanes()
                    && commit_handoff.applied_update_count()
                        == self.handoff.render_phase().applied_update_count()
                    && commit_handoff.skipped_update_count()
                        == self.handoff.render_phase().skipped_update_count()
                    && commit_handoff.resulting_element()
                        == self.handoff.render_phase().resulting_element()
                    && !commit_handoff.update_sequence_ids().is_empty()
                    && queue_handoff.proves_source_owned_lane_handoff()
            })
    }

    #[must_use]
    pub(crate) fn routed_through_root_scheduler_queue_lane_and_commit_evidence_for_canary(
        &self,
    ) -> bool {
        self.accepted_root_scheduler_execution_evidence_for_canary()
            && self.accepted_root_commit_execution_evidence_for_canary()
            && self.accepted_queue_lane_handoff_evidence_for_canary()
            && self.async_callback_execution_blocked()
            && self.public_update_scheduling_blocked()
            && !self.public_root_compatibility_claimed()
            && !self.public_scheduler_timing_compatibility_claimed()
            && !self.public_act_compatibility_claimed()
            && !self.react_dom_compatibility_claimed()
            && !self.test_renderer_compatibility_claimed()
            && !self.native_execution_compatibility_claimed()
            && !self.package_compatibility_claimed()
            && !self.executes_public_effects()
    }

    #[must_use]
    pub(crate) fn treats_host_root_update_as_current_only_with_queue_lane_handoff_for_canary(
        &self,
    ) -> bool {
        self.routed_through_root_scheduler_queue_lane_and_commit_evidence_for_canary()
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
pub(super) fn root_finished_work_queue_lane_commit_currentness_identity_for_canary(
    handoff: RootSyncFlushRecord,
    requested_callback_node: RootSchedulerCallbackHandle,
    current_callback_node: RootSchedulerCallbackHandle,
    selected_lanes: Lanes,
    queue_commit_handoff: &HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary,
) -> RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary {
    let commit = queue_commit_handoff.commit();
    RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary {
        root: handoff.root(),
        previous_current: commit.previous_current(),
        finished_work: commit.finished_work(),
        selected_lanes,
        finished_lanes: commit.finished_lanes(),
        remaining_lanes: commit.remaining_lanes(),
        requested_callback_node,
        current_callback_node,
        handoff_order: handoff.order(),
        commit_order: queue_commit_handoff.finished_work_handoff().commit_order(),
        update_sequence_ids: queue_commit_handoff.update_sequence_ids().to_vec(),
        resulting_element: queue_commit_handoff.resulting_element(),
    }
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    dead_code,
    reason = "private currentness consumer is exercised by focused queue-lane commit canaries"
)]
pub(crate) fn consume_finished_work_queue_lane_commit_currentness_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    execution: &RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary,
) -> Result<
    RootFinishedWorkQueueLaneCommitCurrentnessRecordForCanary,
    RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary,
> {
    if !execution.routed_through_root_scheduler_queue_lane_and_commit_evidence_for_canary() {
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::UnacceptedSchedulerContinuation,
        );
    }

    let queue_commit_handoff = execution.queue_commit_handoff().ok_or(
        RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::MissingQueueCommitHandoff,
    )?;
    let identity = root_finished_work_queue_lane_commit_currentness_identity_for_canary(
        execution.handoff(),
        execution.requested_callback_node(),
        execution.current_callback_node(),
        execution.selected_lanes(),
        queue_commit_handoff,
    );
    let Some(source_token) = execution.currentness_source_token() else {
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceNotPending {
                root: identity.root(),
                finished_work: identity.finished_work(),
                commit_order: identity.commit_order(),
            },
        );
    };

    if store
        .root_scheduler()
        .has_consumed_finished_work_queue_lane_commit_currentness_source(&identity, source_token)
    {
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceAlreadyConsumed {
                root: identity.root(),
                finished_work: identity.finished_work(),
                commit_order: identity.commit_order(),
            },
        );
    }

    if !store
        .root_scheduler()
        .has_pending_finished_work_queue_lane_commit_currentness_source(&identity, source_token)
    {
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceNotPending {
                root: identity.root(),
                finished_work: identity.finished_work(),
                commit_order: identity.commit_order(),
            },
        );
    }

    validate_finished_work_queue_lane_commit_currentness_live_state_for_canary(
        store,
        execution,
        queue_commit_handoff,
        &identity,
    )?;

    let (root_token, committed_element_after_consume, committed_root_children) =
        committed_host_root_tree_state_for_queue_lane_currentness_for_canary(
            store,
            identity.root(),
            identity.finished_work(),
        )?;
    let root = store.root(identity.root())?;
    let root_current_after_consume = root.current();
    let root_finished_work_after_consume = root.finished_work();
    let root_finished_lanes_after_consume = root.finished_lanes();
    let root_pending_lanes_after_consume = root.lanes().pending_lanes();
    let commit_mutation_record_count = queue_commit_handoff.commit().mutation_log().len();
    let commit_deletion_list_count = queue_commit_handoff.commit().deletion_lists().len();

    let source_pending_before_consume = true;
    if !store
        .root_scheduler_mut()
        .consume_finished_work_queue_lane_commit_currentness_source(&identity, source_token)
    {
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceNotPending {
                root: identity.root(),
                finished_work: identity.finished_work(),
                commit_order: identity.commit_order(),
            },
        );
    }
    let source_consumed_after = store
        .root_scheduler()
        .has_consumed_finished_work_queue_lane_commit_currentness_source(&identity, source_token);

    Ok(RootFinishedWorkQueueLaneCommitCurrentnessRecordForCanary {
        identity,
        root_token,
        source_pending_before_consume,
        source_consumed_after,
        root_current_after_consume,
        root_finished_work_after_consume,
        root_finished_lanes_after_consume,
        root_pending_lanes_after_consume,
        committed_element_after_consume,
        committed_root_children,
        commit_mutation_record_count,
        commit_deletion_list_count,
    })
}

#[cfg(test)]
fn validate_finished_work_queue_lane_commit_currentness_live_state_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    execution: &RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary,
    queue_commit_handoff: &HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary,
    identity: &RootFinishedWorkQueueLaneCommitCurrentnessIdentityForCanary,
) -> Result<(), RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary> {
    let commit = queue_commit_handoff.commit();
    if execution.commit() != Some(commit)
        || commit.root() != identity.root()
        || commit.previous_current() != identity.previous_current()
        || commit.current() != identity.finished_work()
        || commit.finished_work() != identity.finished_work()
        || commit.finished_lanes() != identity.finished_lanes()
        || commit.remaining_lanes() != identity.remaining_lanes()
        || commit.pending_lanes() != identity.remaining_lanes()
        || queue_commit_handoff.selected_lanes() != identity.selected_lanes()
        || queue_commit_handoff.finished_lanes() != identity.finished_lanes()
        || queue_commit_handoff.remaining_lanes() != identity.remaining_lanes()
        || queue_commit_handoff.update_sequence_ids() != identity.update_sequence_ids()
        || queue_commit_handoff.resulting_element() != identity.resulting_element()
    {
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::UnacceptedSchedulerContinuation,
        );
    }

    let root = store.root(identity.root())?;
    if root.current() != identity.finished_work()
        || root.finished_work().is_some()
        || !root.finished_lanes().is_empty()
        || root.lanes().pending_lanes() != identity.remaining_lanes()
    {
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::LiveRootStateMismatch {
                root: identity.root(),
                expected_current: identity.finished_work(),
                actual_current: root.current(),
                expected_finished_work: None,
                actual_finished_work: root.finished_work(),
                expected_finished_lanes: Lanes::NO,
                actual_finished_lanes: root.finished_lanes(),
                expected_pending_lanes: identity.remaining_lanes(),
                actual_pending_lanes: root.lanes().pending_lanes(),
            },
        );
    }

    validate_queue_lane_commit_currentness_rows_for_canary(
        store,
        queue_commit_handoff.queue_handoff(),
    )?;

    let (root_token, committed_element, _children) =
        committed_host_root_tree_state_for_queue_lane_currentness_for_canary(
            store,
            identity.root(),
            identity.finished_work(),
        )?;
    if root_token != identity.root().state_node_handle() {
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::CommittedTreeStateMismatch {
                root: identity.root(),
                field: "root_token",
            },
        );
    }
    if committed_element != identity.resulting_element() {
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::CommittedTreeStateMismatch {
                root: identity.root(),
                field: "resulting_element",
            },
        );
    }

    Ok(())
}

#[cfg(test)]
fn validate_queue_lane_commit_currentness_rows_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    queue_handoff: &HostRootUpdateQueueLaneHandoffRecordForCanary,
) -> Result<(), RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary> {
    if !queue_handoff.proves_source_owned_lane_handoff() {
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::QueueOrderMismatch {
                root: queue_handoff.root(),
                queue: queue_handoff.current_update_queue(),
                expected_updates: queue_handoff.current_queue_base_updates().to_vec(),
                actual_updates: queue_handoff.update_sequence_ids(),
            },
        );
    }

    let current_queue_base_updates = store
        .update_queues()
        .base_updates(queue_handoff.current_update_queue())?;
    if current_queue_base_updates != queue_handoff.current_queue_base_updates() {
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::QueueOrderMismatch {
                root: queue_handoff.root(),
                queue: queue_handoff.current_update_queue(),
                expected_updates: queue_handoff.current_queue_base_updates().to_vec(),
                actual_updates: current_queue_base_updates,
            },
        );
    }

    let pending_updates = store
        .update_queues()
        .pending_updates(queue_handoff.current_update_queue())?;
    if !pending_updates.is_empty() {
        let mut actual_updates = current_queue_base_updates;
        actual_updates.extend(pending_updates);
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::QueueOrderMismatch {
                root: queue_handoff.root(),
                queue: queue_handoff.current_update_queue(),
                expected_updates: queue_handoff.current_queue_base_updates().to_vec(),
                actual_updates,
            },
        );
    }

    for row in queue_handoff.update_records() {
        let actual_lanes = store
            .update_queues()
            .update(row.update())?
            .lane()
            .remove_lane(Lane::OFFSCREEN);
        if actual_lanes != row.source_lanes() || actual_lanes != row.lane().to_lanes() {
            return Err(
                RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::QueueRowMetadataMismatch {
                    root: queue_handoff.root(),
                    update: row.update(),
                    expected_lanes: row.source_lanes(),
                    actual_lanes,
                },
            );
        }
    }

    Ok(())
}

#[cfg(test)]
fn committed_host_root_tree_state_for_queue_lane_currentness_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    current: FiberId,
) -> Result<
    (StateNodeHandle, RootElementHandle, Vec<FiberId>),
    RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary,
> {
    let host_root = store.fiber_arena().get(current)?;
    if host_root.tag() != FiberTag::HostRoot {
        return Err(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::CommittedTreeStateMismatch {
                root,
                field: "tag",
            },
        );
    }
    let root_token = host_root.state_node();
    let state = store
        .host_root_states()
        .get(host_root.memoized_state())
        .map_err(FiberRootStoreError::from)?;
    let children = store.fiber_arena().child_ids(current)?;

    Ok((root_token, state.element(), children))
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct RootExpiredLaneSyncSchedulerQueueLaneContinuationMetadataForCanary {
    pub(super) root: FiberRootId,
    pub(super) current_time: LaneTimestamp,
    pub(super) requested_callback_node: RootSchedulerCallbackHandle,
    pub(super) current_callback_node: RootSchedulerCallbackHandle,
    pub(super) expired_lanes_before: Lanes,
    pub(super) expired_lanes_after: Lanes,
    pub(super) selected_priority_lanes: Lanes,
    pub(super) selected_render_lanes: Lanes,
    pub(super) handoff: Option<RootSyncFlushRecord>,
    pub(super) status: RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary,
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootExpiredLaneSyncSchedulerQueueLaneContinuationRecordForCanary {
    pub(super) root: FiberRootId,
    pub(super) current_time: LaneTimestamp,
    pub(super) requested_callback_node: RootSchedulerCallbackHandle,
    pub(super) current_callback_node: RootSchedulerCallbackHandle,
    pub(super) expired_lanes_before: Lanes,
    pub(super) expired_lanes_after: Lanes,
    pub(super) selected_priority_lanes: Lanes,
    pub(super) selected_render_lanes: Lanes,
    pub(super) handoff: Option<RootSyncFlushRecord>,
    pub(super) continuation: Option<RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary>,
    pub(super) status: RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary,
    pub(super) source_metadata: RootExpiredLaneSyncSchedulerQueueLaneContinuationMetadataForCanary,
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private expired-lane queue/lane continuation canaries consume this evidence"
)]
impl RootExpiredLaneSyncSchedulerQueueLaneContinuationRecordForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current_time(&self) -> LaneTimestamp {
        self.current_time
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
    pub(crate) const fn expired_lanes_before(&self) -> Lanes {
        self.expired_lanes_before
    }

    #[must_use]
    pub(crate) const fn expired_lanes_after(&self) -> Lanes {
        self.expired_lanes_after
    }

    #[must_use]
    pub(crate) const fn selected_priority_lanes(&self) -> Lanes {
        self.selected_priority_lanes
    }

    #[must_use]
    pub(crate) const fn selected_render_lanes(&self) -> Lanes {
        self.selected_render_lanes
    }

    #[must_use]
    pub(crate) const fn selected_expired_lanes(&self) -> Lanes {
        self.selected_render_lanes
            .intersect(self.expired_lanes_after)
    }

    #[must_use]
    pub(crate) const fn handoff(&self) -> Option<RootSyncFlushRecord> {
        self.handoff
    }

    #[must_use]
    pub(crate) fn continuation(
        &self,
    ) -> Option<&RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary> {
        self.continuation.as_ref()
    }

    #[must_use]
    pub(crate) const fn status(
        &self,
    ) -> RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) const fn did_execute_expired_queue_lane_scheduler_continuation(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::RenderedAndCommitted
        )
    }

    #[must_use]
    pub(crate) const fn rejected_stale_callback_node(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::StaleCallbackNode
        )
    }

    #[must_use]
    pub(crate) const fn skipped_without_expired_lanes(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::NoExpiredLanes
        )
    }

    #[must_use]
    pub(crate) const fn skipped_by_priority_selection(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::NoExpiredWorkSelected
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_lane_mismatch(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByLaneMismatch
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_queue_lane_handoff(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        )
    }

    #[must_use]
    pub(crate) fn queue_handoff_error(
        &self,
    ) -> Option<&HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary> {
        self.continuation
            .as_ref()
            .and_then(|record| record.queue_handoff_error())
    }

    #[must_use]
    pub(crate) fn queue_commit_handoff(
        &self,
    ) -> Option<&HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary> {
        self.continuation
            .as_ref()
            .and_then(|record| record.queue_commit_handoff())
    }

    #[must_use]
    pub(crate) fn commit(&self) -> Option<&HostRootCommitRecord> {
        self.continuation
            .as_ref()
            .and_then(|record| record.commit())
    }

    #[must_use]
    pub(crate) fn proves_expired_default_plus_sync_lane_selection_for_canary(&self) -> bool {
        let default_plus_sync = Lanes::SYNC.merge(Lanes::DEFAULT);
        self.expired_lanes_after == Lanes::DEFAULT
            && self.selected_expired_lanes() == Lanes::DEFAULT
            && self.selected_priority_lanes == default_plus_sync
            && self.selected_render_lanes == default_plus_sync
            && self.handoff.is_some_and(|handoff| {
                handoff.root() == self.root
                    && handoff.lanes() == default_plus_sync
                    && handoff.render_phase().root() == self.root
                    && handoff.render_phase().render_lanes() == default_plus_sync
                    && handoff.status() == RootSyncFlushRecordStatus::RenderedAwaitingCommit
            })
    }

    #[must_use]
    pub(crate) fn consumed_accepted_queue_lane_scheduler_continuation_record(&self) -> bool {
        self.continuation.as_ref().is_some_and(|record| {
            self.did_execute_expired_queue_lane_scheduler_continuation()
                && record.did_execute_queue_lane_scheduler_continuation()
                && self
                    .handoff
                    .is_some_and(|handoff| handoff == record.handoff())
                && record.accepted_queue_lane_handoff_evidence_for_canary()
        })
    }

    #[must_use]
    pub(crate) fn routed_through_expired_queue_lane_scheduler_and_commit_evidence_for_canary(
        &self,
    ) -> bool {
        self.proves_expired_default_plus_sync_lane_selection_for_canary()
            && self.consumed_accepted_queue_lane_scheduler_continuation_record()
            && self.continuation.as_ref().is_some_and(|record| {
                record.routed_through_root_scheduler_queue_lane_and_commit_evidence_for_canary()
            })
            && self.continuation.as_ref().is_some_and(|record| {
                expired_default_sync_queue_lane_wrapper_metadata_mismatch_for_canary(self, record)
                    .is_none()
            })
            && self.async_callback_execution_blocked()
            && self.public_update_scheduling_blocked()
            && !self.public_root_compatibility_claimed()
            && !self.public_scheduler_timing_compatibility_claimed()
            && !self.public_act_compatibility_claimed()
            && !self.react_dom_compatibility_claimed()
            && !self.test_renderer_compatibility_claimed()
            && !self.native_execution_compatibility_claimed()
            && !self.package_compatibility_claimed()
            && !self.executes_public_effects()
    }

    #[must_use]
    pub(crate) fn treats_host_root_update_as_current_only_with_queue_lane_handoff_for_canary(
        &self,
    ) -> bool {
        self.routed_through_expired_queue_lane_scheduler_and_commit_evidence_for_canary()
            && self.continuation.as_ref().is_some_and(|record| {
                record.treats_host_root_update_as_current_only_with_queue_lane_handoff_for_canary()
            })
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
    pub(crate) const fn executes_public_effects(&self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootExpiredDefaultSyncQueueLaneCommitCurrentnessRecordForCanary {
    pub(super) expired_continuation:
        RootExpiredLaneSyncSchedulerQueueLaneContinuationRecordForCanary,
    pub(super) currentness: RootFinishedWorkQueueLaneCommitCurrentnessRecordForCanary,
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "private expired default+sync queue-lane currentness is exercised by focused canaries"
)]
impl RootExpiredDefaultSyncQueueLaneCommitCurrentnessRecordForCanary {
    #[must_use]
    pub(crate) const fn expired_continuation(
        &self,
    ) -> &RootExpiredLaneSyncSchedulerQueueLaneContinuationRecordForCanary {
        &self.expired_continuation
    }

    #[must_use]
    pub(crate) const fn currentness(
        &self,
    ) -> &RootFinishedWorkQueueLaneCommitCurrentnessRecordForCanary {
        &self.currentness
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.expired_continuation.root()
    }

    #[must_use]
    pub(crate) const fn current_time(&self) -> LaneTimestamp {
        self.expired_continuation.current_time()
    }

    #[must_use]
    pub(crate) const fn expired_lanes_after(&self) -> Lanes {
        self.expired_continuation.expired_lanes_after()
    }

    #[must_use]
    pub(crate) const fn selected_priority_lanes(&self) -> Lanes {
        self.expired_continuation.selected_priority_lanes()
    }

    #[must_use]
    pub(crate) const fn selected_render_lanes(&self) -> Lanes {
        self.expired_continuation.selected_render_lanes()
    }

    #[must_use]
    pub(crate) fn source_owned_currentness_consumed(&self) -> bool {
        self.currentness.source_owned_currentness_consumed()
    }

    #[must_use]
    pub(crate) fn ties_expired_default_sync_queue_lane_commit_to_live_tree_state_for_canary(
        &self,
    ) -> bool {
        let default_plus_sync = Lanes::SYNC.merge(Lanes::DEFAULT);
        self.expired_continuation
            .routed_through_expired_queue_lane_scheduler_and_commit_evidence_for_canary()
            && self
                .currentness
                .ties_finished_work_queue_lane_commit_to_live_tree_state_for_canary()
            && self.currentness.root() == self.expired_continuation.root()
            && self.currentness.selected_lanes() == default_plus_sync
            && self.currentness.selected_lanes()
                == self.expired_continuation.selected_render_lanes()
            && self.currentness.finished_lanes() == default_plus_sync
            && self.currentness.remaining_lanes()
                == self
                    .expired_continuation
                    .handoff()
                    .map_or(Lanes::NO, |handoff| {
                        handoff.render_phase().remaining_lanes()
                    })
            && self.currentness.requested_callback_node()
                == self.expired_continuation.requested_callback_node()
            && self.currentness.current_callback_node()
                == self.expired_continuation.current_callback_node()
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
    pub(crate) const fn native_execution_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn package_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_public_effects(&self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary {
    WrongExpiredDefaultSyncLaneSelection {
        root: FiberRootId,
        expired_lanes_after: Lanes,
        selected_priority_lanes: Lanes,
        selected_render_lanes: Lanes,
    },
    MissingUnderlyingQueueLaneContinuation {
        root: FiberRootId,
    },
    UnacceptedUnderlyingQueueLaneContinuation {
        root: FiberRootId,
        status: RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary,
    },
    ExpiredWrapperMetadataMismatch {
        root: FiberRootId,
        field: &'static str,
    },
    FinishedWorkQueueLaneCurrentness(RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary),
}

#[cfg(test)]
impl Display for RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::WrongExpiredDefaultSyncLaneSelection {
                root,
                expired_lanes_after,
                selected_priority_lanes,
                selected_render_lanes,
            } => write!(
                formatter,
                "root {} expired default+sync queue-lane currentness rejected lanes expired {:?}, priority {:?}, render {:?}",
                root.raw(),
                expired_lanes_after,
                selected_priority_lanes,
                selected_render_lanes
            ),
            Self::MissingUnderlyingQueueLaneContinuation { root } => write!(
                formatter,
                "root {} expired default+sync queue-lane currentness requires an underlying queue-lane continuation",
                root.raw()
            ),
            Self::UnacceptedUnderlyingQueueLaneContinuation { root, status } => write!(
                formatter,
                "root {} expired default+sync queue-lane currentness rejected underlying continuation {:?}",
                root.raw(),
                status
            ),
            Self::ExpiredWrapperMetadataMismatch { root, field } => write!(
                formatter,
                "root {} expired default+sync queue-lane currentness wrapper metadata mismatch for {}",
                root.raw(),
                field
            ),
            Self::FinishedWorkQueueLaneCurrentness(error) => Display::fmt(error, formatter),
        }
    }
}

#[cfg(test)]
impl Error for RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FinishedWorkQueueLaneCurrentness(error) => Some(error),
            Self::WrongExpiredDefaultSyncLaneSelection { .. }
            | Self::MissingUnderlyingQueueLaneContinuation { .. }
            | Self::UnacceptedUnderlyingQueueLaneContinuation { .. }
            | Self::ExpiredWrapperMetadataMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary>
    for RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary
{
    fn from(error: RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary) -> Self {
        Self::FinishedWorkQueueLaneCurrentness(error)
    }
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    dead_code,
    reason = "private expired default+sync currentness consumer is exercised by focused canaries"
)]
pub(crate) fn consume_expired_default_sync_queue_lane_commit_currentness_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    expired_continuation: &RootExpiredLaneSyncSchedulerQueueLaneContinuationRecordForCanary,
) -> Result<
    RootExpiredDefaultSyncQueueLaneCommitCurrentnessRecordForCanary,
    RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary,
> {
    if !expired_continuation.proves_expired_default_plus_sync_lane_selection_for_canary() {
        return Err(
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::WrongExpiredDefaultSyncLaneSelection {
                root: expired_continuation.root(),
                expired_lanes_after: expired_continuation.expired_lanes_after(),
                selected_priority_lanes: expired_continuation.selected_priority_lanes(),
                selected_render_lanes: expired_continuation.selected_render_lanes(),
            },
        );
    }

    let Some(continuation) = expired_continuation.continuation() else {
        return Err(
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::MissingUnderlyingQueueLaneContinuation {
                root: expired_continuation.root(),
            },
        );
    };

    if !expired_continuation.consumed_accepted_queue_lane_scheduler_continuation_record()
        || !continuation.routed_through_root_scheduler_queue_lane_and_commit_evidence_for_canary()
    {
        return Err(
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::UnacceptedUnderlyingQueueLaneContinuation {
                root: expired_continuation.root(),
                status: expired_continuation.status(),
            },
        );
    }

    if let Some(field) = expired_default_sync_queue_lane_wrapper_metadata_mismatch_for_canary(
        expired_continuation,
        continuation,
    ) {
        return Err(
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::ExpiredWrapperMetadataMismatch {
                root: expired_continuation.root(),
                field,
            },
        );
    }

    if !expired_continuation
        .routed_through_expired_queue_lane_scheduler_and_commit_evidence_for_canary()
    {
        return Err(
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::UnacceptedUnderlyingQueueLaneContinuation {
                root: expired_continuation.root(),
                status: expired_continuation.status(),
            },
        );
    }

    let currentness =
        consume_finished_work_queue_lane_commit_currentness_for_canary(store, continuation)?;

    Ok(
        RootExpiredDefaultSyncQueueLaneCommitCurrentnessRecordForCanary {
            expired_continuation: expired_continuation.clone(),
            currentness,
        },
    )
}

#[cfg(test)]
fn expired_default_sync_queue_lane_wrapper_metadata_mismatch_for_canary(
    expired_continuation: &RootExpiredLaneSyncSchedulerQueueLaneContinuationRecordForCanary,
    continuation: &RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary,
) -> Option<&'static str> {
    if let Some(field) = expired_default_sync_queue_lane_wrapper_source_metadata_mismatch_for_canary(
        expired_continuation,
    ) {
        return Some(field);
    }
    if expired_continuation.root() != continuation.root() {
        return Some("root");
    }
    if expired_continuation.handoff() != Some(continuation.handoff()) {
        return Some("handoff");
    }
    if expired_continuation.requested_callback_node() != continuation.requested_callback_node() {
        return Some("requested_callback_node");
    }
    if expired_continuation.current_callback_node() != continuation.current_callback_node() {
        return Some("current_callback_node");
    }
    if expired_continuation.selected_render_lanes() != continuation.selected_lanes() {
        return Some("selected_render_lanes");
    }
    if expired_continuation.selected_priority_lanes() != continuation.selected_lanes() {
        return Some("selected_priority_lanes");
    }

    let Some(queue_commit_handoff) = continuation.queue_commit_handoff() else {
        return Some("queue_commit_handoff");
    };
    let identity = root_finished_work_queue_lane_commit_currentness_identity_for_canary(
        continuation.handoff(),
        continuation.requested_callback_node(),
        continuation.current_callback_node(),
        continuation.selected_lanes(),
        queue_commit_handoff,
    );
    if identity.root() != expired_continuation.root() {
        return Some("currentness_root");
    }
    if identity.requested_callback_node() != expired_continuation.requested_callback_node() {
        return Some("currentness_requested_callback_node");
    }
    if identity.current_callback_node() != expired_continuation.current_callback_node() {
        return Some("currentness_current_callback_node");
    }
    if identity.selected_lanes() != expired_continuation.selected_render_lanes() {
        return Some("currentness_selected_lanes");
    }
    if identity.finished_lanes() != expired_continuation.selected_render_lanes() {
        return Some("currentness_finished_lanes");
    }

    None
}

#[cfg(test)]
fn expired_default_sync_queue_lane_wrapper_source_metadata_mismatch_for_canary(
    expired_continuation: &RootExpiredLaneSyncSchedulerQueueLaneContinuationRecordForCanary,
) -> Option<&'static str> {
    let source = &expired_continuation.source_metadata;
    if expired_continuation.root() != source.root {
        return Some("root");
    }
    if expired_continuation.current_time() != source.current_time {
        return Some("current_time");
    }
    if expired_continuation.requested_callback_node() != source.requested_callback_node {
        return Some("requested_callback_node");
    }
    if expired_continuation.current_callback_node() != source.current_callback_node {
        return Some("current_callback_node");
    }
    if expired_continuation.expired_lanes_before() != source.expired_lanes_before {
        return Some("expired_lanes_before");
    }
    if expired_continuation.expired_lanes_after() != source.expired_lanes_after {
        return Some("expired_lanes_after");
    }
    if expired_continuation.selected_priority_lanes() != source.selected_priority_lanes {
        return Some("selected_priority_lanes");
    }
    if expired_continuation.selected_render_lanes() != source.selected_render_lanes {
        return Some("selected_render_lanes");
    }
    if expired_continuation.handoff() != source.handoff {
        return Some("handoff");
    }
    if expired_continuation.status() != source.status {
        return Some("status");
    }

    None
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootExpiredLaneSyncSchedulerContinuationRecord {
    pub(super) root: FiberRootId,
    pub(super) current_time: LaneTimestamp,
    pub(super) requested_callback_node: RootSchedulerCallbackHandle,
    pub(super) current_callback_node: RootSchedulerCallbackHandle,
    pub(super) expired_lanes_before: Lanes,
    pub(super) expired_lanes_after: Lanes,
    pub(super) selected_priority_lanes: Lanes,
    pub(super) selected_render_lanes: Lanes,
    pub(super) handoff: Option<RootSyncFlushRecord>,
    pub(super) continuation: Option<RootSyncSchedulerContinuationExecutionRecord>,
    pub(super) status: RootExpiredLaneSyncSchedulerContinuationStatus,
}

#[allow(
    dead_code,
    reason = "crate-private expired-lane sync continuation metadata is reserved for private root execution workers"
)]
impl RootExpiredLaneSyncSchedulerContinuationRecord {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current_time(&self) -> LaneTimestamp {
        self.current_time
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
    pub(crate) const fn expired_lanes_before(&self) -> Lanes {
        self.expired_lanes_before
    }

    #[must_use]
    pub(crate) const fn expired_lanes_after(&self) -> Lanes {
        self.expired_lanes_after
    }

    #[must_use]
    pub(crate) const fn selected_priority_lanes(&self) -> Lanes {
        self.selected_priority_lanes
    }

    #[must_use]
    pub(crate) const fn selected_render_lanes(&self) -> Lanes {
        self.selected_render_lanes
    }

    #[must_use]
    pub(crate) const fn selected_expired_lanes(&self) -> Lanes {
        self.selected_render_lanes
            .intersect(self.expired_lanes_after)
    }

    #[must_use]
    pub(crate) const fn handoff(&self) -> Option<RootSyncFlushRecord> {
        self.handoff
    }

    #[must_use]
    pub(crate) fn continuation(&self) -> Option<&RootSyncSchedulerContinuationExecutionRecord> {
        self.continuation.as_ref()
    }

    #[must_use]
    pub(crate) const fn status(&self) -> RootExpiredLaneSyncSchedulerContinuationStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn did_execute_expired_lane_sync_continuation(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::RenderedAndCommitted
        )
    }

    #[must_use]
    pub(crate) const fn rejected_stale_callback_node(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode
        )
    }

    #[must_use]
    pub(crate) const fn skipped_without_expired_lanes(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::NoExpiredLanes
        )
    }

    #[must_use]
    pub(crate) const fn skipped_by_priority_selection(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::NoExpiredWorkSelected
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_pending_passive(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByPendingPassive
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_lane_mismatch(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByLaneMismatch
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_finished_work_handoff_mismatch(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByFinishedWorkHandoffMismatch
        )
    }

    #[must_use]
    pub(crate) fn commit(&self) -> Option<&HostRootCommitRecord> {
        self.continuation
            .as_ref()
            .and_then(|record| record.commit())
    }

    #[must_use]
    pub(crate) fn consumed_accepted_scheduler_continuation_record(&self) -> bool {
        self.continuation.as_ref().is_some_and(|record| {
            self.did_execute_expired_lane_sync_continuation()
                && record.consumed_accepted_render_handoff()
                && self
                    .handoff
                    .is_some_and(|handoff| handoff == record.handoff())
        })
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
    pub(crate) const fn executes_public_effects(&self) -> bool {
        false
    }
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush recovery diagnostics are reserved for private error workers"
)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushRootRecoverySnapshotForCanary {
    pub(super) root: FiberRootId,
    pub(super) selected_lanes: Lanes,
    pub(super) pending_lanes: Lanes,
    pub(super) callback_node: RootSchedulerCallbackHandle,
    pub(super) callback_priority: RootCallbackPriority,
    pub(super) render_phase_work: Option<FiberId>,
    pub(super) render_phase_lanes: Lanes,
    pub(super) render_exit_status: RootRenderExitStatus,
    pub(super) might_have_pending_sync_work: bool,
    pub(super) is_flushing_work: bool,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush recovery diagnostics are reserved for private error workers"
)]
impl SyncFlushRootRecoverySnapshotForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn selected_lanes(self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes(self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub(crate) const fn callback_node(self) -> RootSchedulerCallbackHandle {
        self.callback_node
    }

    #[must_use]
    pub(crate) const fn callback_priority(self) -> RootCallbackPriority {
        self.callback_priority
    }

    #[must_use]
    pub(crate) const fn render_phase_work(self) -> Option<FiberId> {
        self.render_phase_work
    }

    #[must_use]
    pub(crate) const fn render_phase_lanes(self) -> Lanes {
        self.render_phase_lanes
    }

    #[must_use]
    pub(crate) const fn render_exit_status(self) -> RootRenderExitStatus {
        self.render_exit_status
    }

    #[must_use]
    pub(crate) const fn might_have_pending_sync_work(self) -> bool {
        self.might_have_pending_sync_work
    }

    #[must_use]
    pub(crate) const fn is_flushing_work(self) -> bool {
        self.is_flushing_work
    }

    #[must_use]
    pub(crate) fn preserves_lane_and_callback_metadata_from(self, before: Self) -> bool {
        self.root == before.root
            && self.selected_lanes == before.selected_lanes
            && self.pending_lanes == before.pending_lanes
            && self.callback_node == before.callback_node
            && self.callback_priority == before.callback_priority
            && self.might_have_pending_sync_work == before.might_have_pending_sync_work
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushPostPassiveContinuationRootRecord {
    pub(super) order: usize,
    pub(super) root: FiberRootId,
    pub(super) lanes: Lanes,
}

#[allow(
    dead_code,
    reason = "crate-private post-passive sync-flush continuation metadata for future passive workers"
)]
impl SyncFlushPostPassiveContinuationRootRecord {
    #[must_use]
    pub(crate) const fn order(self) -> usize {
        self.order
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SyncFlushPostPassiveRootErrorPropagationStatus {
    Blocked,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SyncFlushPostPassiveRootErrorPropagationBlocker {
    PassiveEffectErrorCapture,
    RootErrorUpdateScheduling,
    RootErrorCallbackInvocation,
    PublicActErrorAggregation,
}

pub(crate) const SYNC_FLUSH_POST_PASSIVE_ROOT_ERROR_PROPAGATION_BLOCKERS:
    [SyncFlushPostPassiveRootErrorPropagationBlocker; 4] = [
    SyncFlushPostPassiveRootErrorPropagationBlocker::PassiveEffectErrorCapture,
    SyncFlushPostPassiveRootErrorPropagationBlocker::RootErrorUpdateScheduling,
    SyncFlushPostPassiveRootErrorPropagationBlocker::RootErrorCallbackInvocation,
    SyncFlushPostPassiveRootErrorPropagationBlocker::PublicActErrorAggregation,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushPostPassiveRootErrorPropagationRecord {
    pub(super) root: FiberRootId,
    pub(super) error_option_callbacks: RootErrorOptionCallbackRecord,
}

#[allow(
    dead_code,
    reason = "crate-private post-passive root-error blocker metadata for future passive workers"
)]
impl SyncFlushPostPassiveRootErrorPropagationRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
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
    pub(crate) const fn status(self) -> SyncFlushPostPassiveRootErrorPropagationStatus {
        SyncFlushPostPassiveRootErrorPropagationStatus::Blocked
    }

    #[must_use]
    pub(crate) const fn blockers(
        self,
    ) -> &'static [SyncFlushPostPassiveRootErrorPropagationBlocker; 4] {
        &SYNC_FLUSH_POST_PASSIVE_ROOT_ERROR_PROPAGATION_BLOCKERS
    }

    #[must_use]
    pub(crate) const fn root_error_update_scheduled(self) -> bool {
        false
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushPostPassiveContinuationExecutionGateRecord {
    pub(super) pending_passive_root: FiberRootId,
    pub(super) pending_passive_finished_work: FiberId,
    pub(super) pending_passive_lanes: Lanes,
    pub(super) pending_passive_unmount_count: usize,
    pub(super) pending_passive_mount_count: usize,
    pub(super) execution_context: SyncFlushExecutionContextRecord,
    pub(super) exit_status: RootSyncFlushExitStatus,
    pub(super) root_error_propagation: SyncFlushPostPassiveRootErrorPropagationRecord,
    pub(super) continuation_roots: Vec<SyncFlushPostPassiveContinuationRootRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private post-passive sync-flush continuation metadata for future passive workers"
)]
impl SyncFlushPostPassiveContinuationExecutionGateRecord {
    #[must_use]
    pub(crate) const fn pending_passive_root(&self) -> FiberRootId {
        self.pending_passive_root
    }

    #[must_use]
    pub(crate) const fn pending_passive_finished_work(&self) -> FiberId {
        self.pending_passive_finished_work
    }

    #[must_use]
    pub(crate) const fn pending_passive_lanes(&self) -> Lanes {
        self.pending_passive_lanes
    }

    #[must_use]
    pub(crate) const fn pending_passive_unmount_count(&self) -> usize {
        self.pending_passive_unmount_count
    }

    #[must_use]
    pub(crate) const fn pending_passive_mount_count(&self) -> usize {
        self.pending_passive_mount_count
    }

    #[must_use]
    pub(crate) const fn pending_passive_record_count(&self) -> usize {
        self.pending_passive_unmount_count + self.pending_passive_mount_count
    }

    #[must_use]
    pub(crate) const fn execution_context(&self) -> SyncFlushExecutionContextRecord {
        self.execution_context
    }

    #[must_use]
    pub(crate) const fn exit_status(&self) -> RootSyncFlushExitStatus {
        self.exit_status
    }

    #[must_use]
    pub(crate) const fn root_error_propagation(
        &self,
    ) -> SyncFlushPostPassiveRootErrorPropagationRecord {
        self.root_error_propagation
    }

    #[must_use]
    pub(crate) fn continuation_roots(&self) -> &[SyncFlushPostPassiveContinuationRootRecord] {
        &self.continuation_roots
    }

    #[must_use]
    pub(crate) fn did_find_continuation_roots(&self) -> bool {
        !self.continuation_roots.is_empty()
    }

    #[must_use]
    pub(crate) const fn should_execute_follow_up_sync_flush(&self) -> bool {
        match self.exit_status {
            RootSyncFlushExitStatus::Completed => true,
            RootSyncFlushExitStatus::BlockedByExecutionContext
            | RootSyncFlushExitStatus::SkippedReentrantFlush
            | RootSyncFlushExitStatus::SkippedNoPendingSyncWork => false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootSyncFlushResult {
    pub(super) execution_context: SyncFlushExecutionContextRecord,
    pub(super) exit_status: RootSyncFlushExitStatus,
    pub(super) records: Vec<RootSyncFlushRecord>,
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

#[allow(
    dead_code,
    reason = "crate-private sync-flush recovery diagnostics are reserved for private error workers"
)]
pub(crate) fn sync_flush_root_recovery_snapshot_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    selected_lanes: Lanes,
) -> Result<SyncFlushRootRecoverySnapshotForCanary, RootSchedulerError> {
    let root = store.root(root_id)?;
    let scheduling = root.scheduling();
    Ok(SyncFlushRootRecoverySnapshotForCanary {
        root: root_id,
        selected_lanes,
        pending_lanes: root.lanes().pending_lanes(),
        callback_node: scheduling.callback_node(),
        callback_priority: scheduling.callback_priority(),
        render_phase_work: scheduling.work_in_progress(),
        render_phase_lanes: scheduling.work_in_progress_root_render_lanes(),
        render_exit_status: scheduling.render_exit_status(),
        might_have_pending_sync_work: store.root_scheduler().might_have_pending_sync_work(),
        is_flushing_work: store.root_scheduler().is_flushing_work(),
    })
}

pub(crate) fn sync_flush_post_passive_continuation_execution_gate<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    execution_context: &ExecutionContextState,
    pending_passive_handoff: Option<PendingPassiveCommitHandoff>,
) -> Result<Option<SyncFlushPostPassiveContinuationExecutionGateRecord>, RootSchedulerError> {
    let Some(pending_passive_handoff) = pending_passive_handoff else {
        return Ok(None);
    };

    let root_error_propagation = sync_flush_post_passive_root_error_propagation_record(
        store,
        pending_passive_handoff.root(),
    )?;
    let execution_context_record = execution_context.sync_flush_record();
    if !execution_context_record.can_enter_sync_flush() {
        return Ok(Some(sync_flush_post_passive_continuation_gate_record(
            pending_passive_handoff,
            execution_context_record,
            RootSyncFlushExitStatus::BlockedByExecutionContext,
            root_error_propagation,
            Vec::new(),
        )));
    }

    if store.root_scheduler().is_flushing_work() {
        return Ok(Some(sync_flush_post_passive_continuation_gate_record(
            pending_passive_handoff,
            execution_context_record,
            RootSyncFlushExitStatus::SkippedReentrantFlush,
            root_error_propagation,
            Vec::new(),
        )));
    }

    if !store.root_scheduler().might_have_pending_sync_work() {
        return Ok(Some(sync_flush_post_passive_continuation_gate_record(
            pending_passive_handoff,
            execution_context_record,
            RootSyncFlushExitStatus::SkippedNoPendingSyncWork,
            root_error_propagation,
            Vec::new(),
        )));
    }

    store.root_scheduler_mut().set_is_flushing_work(true);
    let continuation_roots = collect_sync_flush_post_passive_continuation_roots(store);
    store.root_scheduler_mut().set_is_flushing_work(false);
    let continuation_roots = continuation_roots?;

    Ok(Some(sync_flush_post_passive_continuation_gate_record(
        pending_passive_handoff,
        execution_context_record,
        RootSyncFlushExitStatus::Completed,
        root_error_propagation,
        continuation_roots,
    )))
}

fn collect_sync_flush_post_passive_continuation_roots<H: HostTypes>(
    store: &FiberRootStore<H>,
) -> Result<Vec<SyncFlushPostPassiveContinuationRootRecord>, RootSchedulerError> {
    let mut records = Vec::new();
    let mut root = store.root_scheduler().first_scheduled_root();

    while let Some(root_id) = root {
        let lanes = sync_flush_lanes_for_root(store, root_id)?;
        if lanes.is_non_empty() {
            records.push(SyncFlushPostPassiveContinuationRootRecord {
                order: records.len(),
                root: root_id,
                lanes,
            });
        }
        root = store.root(root_id)?.scheduling().next_scheduled_root();
    }

    Ok(records)
}

fn sync_flush_post_passive_root_error_propagation_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<SyncFlushPostPassiveRootErrorPropagationRecord, RootSchedulerError> {
    let root = store.root(root_id)?;
    Ok(SyncFlushPostPassiveRootErrorPropagationRecord {
        root: root_id,
        error_option_callbacks: root
            .options()
            .error_option_callback_record(root_id, RootErrorOptionCallbackPhase::Commit),
    })
}

fn sync_flush_post_passive_continuation_gate_record(
    pending_passive_handoff: PendingPassiveCommitHandoff,
    execution_context: SyncFlushExecutionContextRecord,
    exit_status: RootSyncFlushExitStatus,
    root_error_propagation: SyncFlushPostPassiveRootErrorPropagationRecord,
    continuation_roots: Vec<SyncFlushPostPassiveContinuationRootRecord>,
) -> SyncFlushPostPassiveContinuationExecutionGateRecord {
    SyncFlushPostPassiveContinuationExecutionGateRecord {
        pending_passive_root: pending_passive_handoff.root(),
        pending_passive_finished_work: pending_passive_handoff.finished_work(),
        pending_passive_lanes: pending_passive_handoff.lanes(),
        pending_passive_unmount_count: pending_passive_handoff.pending_unmount_count(),
        pending_passive_mount_count: pending_passive_handoff.pending_mount_count(),
        execution_context,
        exit_status,
        root_error_propagation,
        continuation_roots,
    }
}
