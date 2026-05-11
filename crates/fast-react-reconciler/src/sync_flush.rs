//! Internal HostRoot-only sync flush integration.
//!
//! This module stitches the accepted HostRoot render-phase and current-switch
//! commit foundations into a narrow sync flush path. It traverses the internal
//! scheduled-root list, renders only sync lanes, and commits the completed
//! HostRoot work. The default flush path deliberately does not call host
//! operations, run effects, invoke callbacks, or wire public DOM/test-renderer
//! facade behavior; crate-private test-control gates may consume accepted
//! metadata without opening public callback behavior.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{FiberId, LaneTimestamp, Lanes, StateNodeHandle, UpdateQueueHandle};
use fast_react_host_config::HostTypes;

#[cfg(not(test))]
use crate::commit_finished_host_root;
use crate::root_callbacks::{
    RootUpdateCallbackInvocationExecutionGateSnapshot, RootUpdateCallbackInvocationExecutionRecord,
    RootUpdateCallbackInvocationStatus, RootUpdateCallbackInvocationTestControl,
    RootUpdateCallbackVisibility,
};
use crate::root_commit::{
    HostRootCallbackDrainRecordForCanary, HostRootCallbackDrainSnapshotForCanary,
    HostRootCommitRecoverySnapshotForCanary, HostRootRenderFailureRecoveryCommitEvidenceForCanary,
    PendingPassiveCommitHandoff, host_root_commit_recovery_snapshot_for_canary,
    host_root_render_failure_recovery_commit_evidence_for_canary,
};
#[cfg(test)]
use crate::root_commit::{
    HostRootFinishedWorkCommitHandoffErrorForCanary,
    commit_finished_host_root_with_finished_work_handoff_for_canary,
    record_host_root_finished_work_pending_commit_for_canary,
};
use crate::root_scheduler::{
    RootRenderErrorOptionCallbackRecord, SYNC_FLUSH_LANES,
    SchedulerBridgeActContinuationExecutionError, SchedulerBridgeActContinuationExecutionResult,
    SchedulerBridgeActQueueExecutionError, SchedulerBridgeActQueueExecutionResult,
    SyncFlushActContinuationDrainRecord, SyncFlushActPostPassiveContinuationGateRecord,
    SyncFlushPostPassiveContinuationExecutionGateRecord, SyncFlushRootRecoverySnapshotForCanary,
    execute_scheduler_bridge_act_continuations, execute_scheduler_bridge_act_queue_for_canary,
    recompute_might_have_pending_sync_work, record_root_render_error_option_callbacks,
    sync_flush_act_continuation_drain_record_after_host_output_canary,
    sync_flush_act_continuation_lanes_for_root, sync_flush_act_post_passive_continuation_gate,
    sync_flush_lanes_for_root, sync_flush_post_passive_continuation_execution_gate,
    sync_flush_root_recovery_snapshot_for_canary,
};
#[cfg(test)]
use crate::root_scheduler::{
    RootSyncSchedulerContinuationExecutionError, RootSyncSchedulerContinuationExecutionRecord,
    execute_sync_scheduler_continuation_for_render_handoff,
};
use crate::root_updates::{
    HostRootQueuedCallbackOrderSnapshot, HostRootVisibleCallbackInvocationAfterCommitSnapshot,
    RootUpdateError,
    invoke_host_root_accepted_visible_callbacks_after_matching_commit_under_test_control_for_canary,
    validate_host_root_accepted_visible_callbacks_after_matching_commit_for_canary,
};
use crate::scheduler_bridge::SchedulerActContinuationRecord;
use crate::{
    ExecutionContextState, FiberRootId, FiberRootStore, FiberRootStoreError, HostRootCommitRecord,
    HostRootRenderPhaseRecord, RootCallbackPriority, RootCommitError, RootSchedulerCallbackHandle,
    RootSchedulerError, RootSyncFlushRecord, RootSyncFlushRecordStatus, RootUpdateCallbackHandle,
    RootUpdateCallbackSnapshot, RootWorkLoopError, SyncFlushExecutionContextRecord, UpdateId,
    render_host_root_for_lanes,
};

#[cfg(test)]
pub(crate) const SYNC_FLUSH_FINISHED_WORK_HANDOFF_IDENTITY_MISMATCH_FOR_CANARY: &str =
    "SyncFlushFinishedWorkHandoffIdentityForCanary::accepted_current_finished_work_record_shape";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[doc(hidden)]
pub struct SyncFlushRootHostOutputCommitDiagnosticsForCanary {
    root: FiberRootId,
    order: usize,
    callback_queue: UpdateQueueHandle,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    remaining_lanes: Lanes,
    commit_pending_lanes: Lanes,
    root_pending_lanes_after_commit: Lanes,
    root_current_after_commit: FiberId,
    committed_current: FiberId,
    render_phase_work_after_commit: Option<FiberId>,
    render_phase_lanes_after_commit: Lanes,
    callback_node_after_commit: RootSchedulerCallbackHandle,
    callback_priority_after_commit: RootCallbackPriority,
    might_have_pending_sync_work: bool,
    accepted_visible_callback_count: usize,
    accepted_hidden_callback_count: usize,
    accepted_deferred_hidden_callback_count: usize,
    post_commit_visible_callback_count: usize,
    post_commit_hidden_callback_count: usize,
    post_commit_deferred_hidden_callback_count: usize,
    mutation_record_count: usize,
    mutation_apply_record_count: usize,
    host_root_placement_apply_count: usize,
    finished_work_handoff_identity: Option<SyncFlushFinishedWorkHandoffIdentityForCanary>,
    commit_result_identity: Option<SyncFlushCommitResultIdentityForCanary>,
    finished_work_root_commit_handoff_verified: bool,
}

impl SyncFlushRootHostOutputCommitDiagnosticsForCanary {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn order(self) -> usize {
        self.order
    }

    #[must_use]
    pub const fn callback_queue(self) -> UpdateQueueHandle {
        self.callback_queue
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn finished_lanes(self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub const fn commit_pending_lanes(self) -> Lanes {
        self.commit_pending_lanes
    }

    #[must_use]
    pub const fn root_pending_lanes_after_commit(self) -> Lanes {
        self.root_pending_lanes_after_commit
    }

    #[must_use]
    pub const fn root_current_after_commit(self) -> FiberId {
        self.root_current_after_commit
    }

    #[must_use]
    pub const fn committed_current(self) -> FiberId {
        self.committed_current
    }

    #[must_use]
    pub const fn render_phase_work_after_commit(self) -> Option<FiberId> {
        self.render_phase_work_after_commit
    }

    #[must_use]
    pub const fn render_phase_lanes_after_commit(self) -> Lanes {
        self.render_phase_lanes_after_commit
    }

    #[must_use]
    pub const fn callback_node_after_commit(self) -> RootSchedulerCallbackHandle {
        self.callback_node_after_commit
    }

    #[must_use]
    pub const fn callback_priority_after_commit(self) -> RootCallbackPriority {
        self.callback_priority_after_commit
    }

    #[must_use]
    pub const fn might_have_pending_sync_work(self) -> bool {
        self.might_have_pending_sync_work
    }

    #[must_use]
    pub const fn accepted_visible_callback_count(self) -> usize {
        self.accepted_visible_callback_count
    }

    #[must_use]
    pub const fn accepted_hidden_callback_count(self) -> usize {
        self.accepted_hidden_callback_count
    }

    #[must_use]
    pub const fn accepted_deferred_hidden_callback_count(self) -> usize {
        self.accepted_deferred_hidden_callback_count
    }

    #[must_use]
    pub const fn accepted_callback_count(self) -> usize {
        self.accepted_visible_callback_count
            + self.accepted_hidden_callback_count
            + self.accepted_deferred_hidden_callback_count
    }

    #[must_use]
    pub const fn post_commit_visible_callback_count(self) -> usize {
        self.post_commit_visible_callback_count
    }

    #[must_use]
    pub const fn post_commit_hidden_callback_count(self) -> usize {
        self.post_commit_hidden_callback_count
    }

    #[must_use]
    pub const fn post_commit_deferred_hidden_callback_count(self) -> usize {
        self.post_commit_deferred_hidden_callback_count
    }

    #[must_use]
    pub const fn mutation_record_count(self) -> usize {
        self.mutation_record_count
    }

    #[must_use]
    pub const fn mutation_apply_record_count(self) -> usize {
        self.mutation_apply_record_count
    }

    #[must_use]
    pub const fn host_root_placement_apply_count(self) -> usize {
        self.host_root_placement_apply_count
    }

    #[must_use]
    pub fn finished_work_handoff_identity_recorded(self) -> bool {
        self.finished_work_handoff_identity.is_some()
    }

    #[must_use]
    pub fn commit_result_identity_recorded(self) -> bool {
        self.commit_result_identity.is_some()
    }

    #[must_use]
    pub fn root_finished_work_before_commit(self) -> Option<FiberId> {
        self.finished_work_handoff_identity
            .and_then(|identity| identity.root_finished_work_before_commit())
    }

    #[must_use]
    pub fn root_finished_lanes_before_commit(self) -> Option<Lanes> {
        self.finished_work_handoff_identity
            .map(SyncFlushFinishedWorkHandoffIdentityForCanary::root_finished_lanes_before_commit)
    }

    #[must_use]
    pub fn pending_work_before_commit(self) -> Option<FiberId> {
        self.finished_work_handoff_identity
            .and_then(|identity| identity.pending_work_before_commit())
    }

    #[must_use]
    pub fn current_before_commit(self) -> Option<FiberId> {
        self.finished_work_handoff_identity
            .map(SyncFlushFinishedWorkHandoffIdentityForCanary::current_before_commit)
    }

    #[must_use]
    pub fn finished_work_before_commit(self) -> Option<FiberId> {
        self.finished_work_handoff_identity
            .map(SyncFlushFinishedWorkHandoffIdentityForCanary::finished_work)
    }

    #[must_use]
    pub fn finished_lanes_before_commit(self) -> Option<Lanes> {
        self.finished_work_handoff_identity
            .map(SyncFlushFinishedWorkHandoffIdentityForCanary::finished_lanes)
    }

    #[must_use]
    pub const fn finished_work_root_commit_handoff_verified(self) -> bool {
        self.finished_work_root_commit_handoff_verified
    }

    #[must_use]
    pub fn committed_current_matches_root(self) -> bool {
        self.root_current_after_commit == self.committed_current
    }

    #[must_use]
    pub fn pending_lanes_match_root(self) -> bool {
        self.root_pending_lanes_after_commit == self.commit_pending_lanes
    }

    #[must_use]
    pub const fn render_phase_state_consumed(self) -> bool {
        self.render_phase_work_after_commit.is_none()
            && self.render_phase_lanes_after_commit.is_empty()
    }

    #[must_use]
    pub fn callback_state_cleared(self) -> bool {
        self.callback_node_after_commit.is_none()
            && self.callback_priority_after_commit == RootCallbackPriority::NO
    }

    #[must_use]
    pub const fn rendered_lanes_consumed_from_root(self) -> bool {
        self.finished_lanes.contains_all(self.render_lanes)
            && !self
                .root_pending_lanes_after_commit
                .contains_any(self.render_lanes)
    }

    #[must_use]
    pub const fn visible_callback_state_drained(self) -> bool {
        self.post_commit_visible_callback_count == 0 && self.post_commit_hidden_callback_count == 0
    }

    #[must_use]
    pub const fn recorded_host_output_mutation_metadata(self) -> bool {
        self.mutation_record_count > 0 && self.mutation_apply_record_count > 0
    }

    #[must_use]
    pub fn accepted_finished_work_handoff_identity(self) -> bool {
        self.finished_work_handoff_identity.is_some_and(
            SyncFlushFinishedWorkHandoffIdentityForCanary::accepted_current_finished_work_record_shape,
        )
    }

    #[must_use]
    pub fn commit_result_matches_finished_work_handoff(self) -> bool {
        match (
            self.finished_work_handoff_identity,
            self.commit_result_identity,
        ) {
            (Some(handoff), Some(commit)) => commit.matches_finished_work_handoff(handoff),
            _ => false,
        }
    }

    #[must_use]
    pub fn accepted_finished_work_handoff(self) -> bool {
        self.accepted_finished_work_handoff_identity()
            && self.commit_result_matches_finished_work_handoff()
            && self.finished_work_root_commit_handoff_verified
    }

    #[must_use]
    pub fn commit_handoff_state_consumed(self) -> bool {
        self.committed_current_matches_root()
            && self.pending_lanes_match_root()
            && self.render_phase_state_consumed()
            && self.callback_state_cleared()
            && self.rendered_lanes_consumed_from_root()
            && self.visible_callback_state_drained()
            && self.accepted_finished_work_handoff()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushActPrivateExecutionDiagnosticsForCanary {
    root: FiberRootId,
    order: usize,
    host_output_canary_committed: bool,
    blocked_by_pending_post_passive_gate: bool,
    drained_act_continuations: Vec<SyncFlushActContinuationDrainRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush/act canary execution diagnostic reserved for private act workers"
)]
impl SyncFlushActPrivateExecutionDiagnosticsForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn order(&self) -> usize {
        self.order
    }

    #[must_use]
    pub(crate) const fn host_output_canary_committed(&self) -> bool {
        self.host_output_canary_committed
    }

    #[must_use]
    pub(crate) const fn blocked_by_pending_post_passive_gate(&self) -> bool {
        self.blocked_by_pending_post_passive_gate
    }

    #[must_use]
    pub(crate) fn drained_act_continuations(&self) -> &[SyncFlushActContinuationDrainRecord] {
        &self.drained_act_continuations
    }

    #[must_use]
    pub(crate) fn drained_count(&self) -> usize {
        self.drained_act_continuations.len()
    }

    #[must_use]
    pub(crate) fn did_drain_accepted_internal_act_continuations(&self) -> bool {
        !self.drained_act_continuations.is_empty()
            && self
                .drained_act_continuations
                .iter()
                .all(|record| record.is_accepted_internal_act_continuation())
    }

    #[must_use]
    pub(crate) const fn drains_public_react_act_queue(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_timing_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_queued_work(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_effects(&self) -> bool {
        false
    }

    pub(crate) fn execute_accepted_scheduler_bridge_act_continuations<H: HostTypes>(
        &self,
        store: &mut FiberRootStore<H>,
    ) -> Result<
        SchedulerBridgeActContinuationExecutionResult,
        SchedulerBridgeActContinuationExecutionError,
    > {
        execute_scheduler_bridge_act_continuations(store, &self.drained_act_continuations)
    }

    pub(crate) fn execute_accepted_scheduler_bridge_act_queue_for_canary<H: HostTypes>(
        &self,
        store: &mut FiberRootStore<H>,
        current_time: LaneTimestamp,
    ) -> Result<SchedulerBridgeActQueueExecutionResult, SchedulerBridgeActQueueExecutionError> {
        execute_scheduler_bridge_act_queue_for_canary(
            store,
            current_time,
            &self.drained_act_continuations,
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SyncFlushRootCommitContinuationStatusForCanary {
    Committed,
    BlockedByExecutionContext,
    SkippedReentrantFlush,
    RejectedNonSyncLanes,
    RejectedStaleFinishedWorkHandoff,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushFinishedWorkHandoffIdentityForCanary {
    root: FiberRootId,
    render_phase_root: FiberRootId,
    order: usize,
    selected_lanes: Lanes,
    root_token: StateNodeHandle,
    previous_current: FiberId,
    current_before_commit: FiberId,
    pending_work_before_commit: Option<FiberId>,
    root_finished_work_before_commit: Option<FiberId>,
    finished_work: FiberId,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    root_finished_lanes_before_commit: Lanes,
    remaining_lanes: Lanes,
    pending_lanes_before_commit: Lanes,
    render_phase_lanes_before_commit: Lanes,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush root commit continuation diagnostics are reserved for private finished-work workers"
)]
impl SyncFlushFinishedWorkHandoffIdentityForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn render_phase_root(self) -> FiberRootId {
        self.render_phase_root
    }

    #[must_use]
    pub(crate) const fn order(self) -> usize {
        self.order
    }

    #[must_use]
    pub(crate) const fn selected_lanes(self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub(crate) const fn root_token(self) -> StateNodeHandle {
        self.root_token
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
    pub(crate) const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
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
    pub(crate) fn accepted_current_finished_work_record_shape(self) -> bool {
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
            && selected_lanes_are_sync_flush_lanes(self.selected_lanes)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushCommitResultIdentityForCanary {
    root: FiberRootId,
    order: usize,
    selected_lanes: Lanes,
    previous_current: FiberId,
    committed_current: FiberId,
    finished_work: FiberId,
    finished_lanes: Lanes,
    remaining_lanes: Lanes,
    pending_lanes: Lanes,
    root_current_after_commit: FiberId,
    root_finished_work_after_commit: Option<FiberId>,
    root_finished_lanes_after_commit: Lanes,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush root commit continuation diagnostics are reserved for private finished-work workers"
)]
impl SyncFlushCommitResultIdentityForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn order(self) -> usize {
        self.order
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
    pub(crate) const fn committed_current(self) -> FiberId {
        self.committed_current
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn finished_lanes(self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes(self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub(crate) const fn root_current_after_commit(self) -> FiberId {
        self.root_current_after_commit
    }

    #[must_use]
    pub(crate) const fn root_finished_work_after_commit(self) -> Option<FiberId> {
        self.root_finished_work_after_commit
    }

    #[must_use]
    pub(crate) const fn root_finished_lanes_after_commit(self) -> Lanes {
        self.root_finished_lanes_after_commit
    }

    #[must_use]
    pub(crate) fn matches_finished_work_handoff(
        self,
        handoff: SyncFlushFinishedWorkHandoffIdentityForCanary,
    ) -> bool {
        self.root == handoff.root()
            && self.order == handoff.order()
            && self.selected_lanes == handoff.selected_lanes()
            && self.previous_current == handoff.previous_current()
            && self.finished_work == handoff.finished_work()
            && self.committed_current == self.finished_work
            && self.root_current_after_commit == self.committed_current
            && self.root_finished_work_after_commit.is_none()
            && self.root_finished_lanes_after_commit.is_empty()
            && self.finished_lanes.contains_all(self.selected_lanes)
            && !self.pending_lanes.contains_any(self.selected_lanes)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushRootCommitContinuationRecordForCanary {
    execution_context: SyncFlushExecutionContextRecord,
    status: SyncFlushRootCommitContinuationStatusForCanary,
    root: FiberRootId,
    order: usize,
    selected_lanes: Lanes,
    handoff_identity: Option<SyncFlushFinishedWorkHandoffIdentityForCanary>,
    commit_result_identity: Option<SyncFlushCommitResultIdentityForCanary>,
    commit: Option<SyncFlushRootRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush root commit continuation diagnostics are reserved for private finished-work workers"
)]
impl SyncFlushRootCommitContinuationRecordForCanary {
    #[must_use]
    pub(crate) const fn execution_context(&self) -> SyncFlushExecutionContextRecord {
        self.execution_context
    }

    #[must_use]
    pub(crate) const fn status(&self) -> SyncFlushRootCommitContinuationStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn order(&self) -> usize {
        self.order
    }

    #[must_use]
    pub(crate) const fn selected_lanes(&self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub(crate) const fn handoff_identity(
        &self,
    ) -> Option<SyncFlushFinishedWorkHandoffIdentityForCanary> {
        self.handoff_identity
    }

    #[must_use]
    pub(crate) const fn commit_result_identity(
        &self,
    ) -> Option<SyncFlushCommitResultIdentityForCanary> {
        self.commit_result_identity
    }

    #[must_use]
    pub(crate) fn commit(&self) -> Option<&SyncFlushRootRecord> {
        self.commit.as_ref()
    }

    #[must_use]
    pub(crate) const fn committed(&self) -> bool {
        matches!(
            self.status,
            SyncFlushRootCommitContinuationStatusForCanary::Committed
        )
    }

    #[must_use]
    pub(crate) fn accepted_finished_work_handoff(&self) -> bool {
        matches!(
            (self.status, self.handoff_identity, self.commit_result_identity),
            (
                SyncFlushRootCommitContinuationStatusForCanary::Committed,
                Some(handoff),
                Some(commit)
            ) if handoff.accepted_current_finished_work_record_shape()
                && commit.matches_finished_work_handoff(handoff)
        )
    }

    #[must_use]
    pub(crate) fn produced_one_inert_commit_record(&self) -> bool {
        self.committed()
            && self.commit.is_some()
            && self.commit_result_identity.is_some()
            && !self.executes_passive_effects()
            && !self.public_flush_sync_compatibility_claimed()
    }

    #[must_use]
    pub(crate) const fn executes_passive_effects(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(&self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushActRootExecutionPathRecordForCanary {
    root_scheduler_execution: RootSyncSchedulerContinuationExecutionRecord,
    sync_flush_record: Option<SyncFlushRootRecord>,
}

#[cfg(test)]
impl SyncFlushActRootExecutionPathRecordForCanary {
    #[must_use]
    pub(crate) const fn root_scheduler_execution(
        &self,
    ) -> &RootSyncSchedulerContinuationExecutionRecord {
        &self.root_scheduler_execution
    }

    #[must_use]
    pub(crate) fn sync_flush_record(&self) -> Option<&SyncFlushRootRecord> {
        self.sync_flush_record.as_ref()
    }

    #[must_use]
    pub(crate) fn committed_sync_flush_record(&self) -> bool {
        self.sync_flush_record.is_some()
    }

    #[must_use]
    pub(crate) fn recorded_private_act_continuation(&self) -> bool {
        self.sync_flush_record
            .as_ref()
            .is_some_and(|record| record.act_continuation.as_ref().is_some())
    }

    #[must_use]
    pub(crate) fn accepted_root_scheduler_execution_evidence(&self) -> bool {
        self.root_scheduler_execution
            .accepted_root_scheduler_execution_evidence_for_canary()
    }

    #[must_use]
    pub(crate) fn accepted_root_commit_execution_evidence(&self) -> bool {
        self.root_scheduler_execution
            .accepted_root_commit_execution_evidence_for_canary()
    }

    #[must_use]
    pub(crate) fn routed_private_sync_flush_act_path(&self) -> bool {
        self.committed_sync_flush_record()
            && self.recorded_private_act_continuation()
            && self
                .root_scheduler_execution
                .routed_through_root_scheduler_and_commit_evidence_for_canary()
            && !self.public_act_compatibility_claimed()
            && !self.public_flush_sync_compatibility_claimed()
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SyncFlushErrorRecoveryRootStatusForCanary {
    Committed,
    RenderFailed,
    CommitFailed,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush recovery diagnostics are reserved for render/commit error workers"
)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushErrorRecoveryRootRecordForCanary {
    order: usize,
    root: FiberRootId,
    lanes: Lanes,
    status: SyncFlushErrorRecoveryRootStatusForCanary,
    scheduler_before: SyncFlushRootRecoverySnapshotForCanary,
    scheduler_after: SyncFlushRootRecoverySnapshotForCanary,
    commit_before: Option<HostRootCommitRecoverySnapshotForCanary>,
    commit_after: Option<HostRootCommitRecoverySnapshotForCanary>,
    render_error_option_callbacks: Option<RootRenderErrorOptionCallbackRecord>,
    render_failure_commit_evidence: Option<HostRootRenderFailureRecoveryCommitEvidenceForCanary>,
    render_error: Option<RootWorkLoopError>,
    commit_error: Option<RootCommitError>,
    committed: Option<SyncFlushRootRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush recovery diagnostics are reserved for render/commit error workers"
)]
impl SyncFlushErrorRecoveryRootRecordForCanary {
    #[must_use]
    pub(crate) const fn order(&self) -> usize {
        self.order
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn status(&self) -> SyncFlushErrorRecoveryRootStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) const fn scheduler_before(&self) -> SyncFlushRootRecoverySnapshotForCanary {
        self.scheduler_before
    }

    #[must_use]
    pub(crate) const fn scheduler_after(&self) -> SyncFlushRootRecoverySnapshotForCanary {
        self.scheduler_after
    }

    #[must_use]
    pub(crate) fn commit_before(&self) -> Option<&HostRootCommitRecoverySnapshotForCanary> {
        self.commit_before.as_ref()
    }

    #[must_use]
    pub(crate) fn commit_after(&self) -> Option<&HostRootCommitRecoverySnapshotForCanary> {
        self.commit_after.as_ref()
    }

    #[must_use]
    pub(crate) fn render_error_option_callbacks(
        &self,
    ) -> Option<&RootRenderErrorOptionCallbackRecord> {
        self.render_error_option_callbacks.as_ref()
    }

    #[must_use]
    pub(crate) fn render_failure_commit_evidence(
        &self,
    ) -> Option<&HostRootRenderFailureRecoveryCommitEvidenceForCanary> {
        self.render_failure_commit_evidence.as_ref()
    }

    #[must_use]
    pub(crate) fn render_error(&self) -> Option<&RootWorkLoopError> {
        self.render_error.as_ref()
    }

    #[must_use]
    pub(crate) fn commit_error(&self) -> Option<&RootCommitError> {
        self.commit_error.as_ref()
    }

    #[must_use]
    pub(crate) fn committed(&self) -> Option<&SyncFlushRootRecord> {
        self.committed.as_ref()
    }

    #[must_use]
    pub(crate) fn is_failure(&self) -> bool {
        matches!(
            self.status,
            SyncFlushErrorRecoveryRootStatusForCanary::RenderFailed
                | SyncFlushErrorRecoveryRootStatusForCanary::CommitFailed
        )
    }

    #[must_use]
    pub(crate) fn preserved_scheduler_metadata(&self) -> bool {
        self.scheduler_after
            .preserves_lane_and_callback_metadata_from(self.scheduler_before)
    }

    #[must_use]
    pub(crate) fn preserved_commit_metadata(&self) -> bool {
        match (&self.commit_before, &self.commit_after) {
            (Some(before), Some(after)) => after.preserves_lane_and_callback_metadata_from(before),
            (None, None) => true,
            _ => false,
        }
    }

    #[must_use]
    pub(crate) fn preserved_lane_and_callback_metadata(&self) -> bool {
        self.preserved_scheduler_metadata() && self.preserved_commit_metadata()
    }

    #[must_use]
    pub(crate) fn preserved_error_callback_handles(&self) -> bool {
        match (
            self.status,
            &self.render_error_option_callbacks,
            self.render_failure_commit_evidence,
        ) {
            (
                SyncFlushErrorRecoveryRootStatusForCanary::RenderFailed,
                Some(render_callbacks),
                Some(commit_evidence),
            ) => {
                render_callbacks.root() == self.root
                    && render_callbacks.render_lanes() == self.lanes
                    && commit_evidence.root() == self.root
                    && commit_evidence.render_lanes() == self.lanes
                    && commit_evidence.error_option_callbacks()
                        == render_callbacks.error_option_callbacks()
                    && commit_evidence.accepted_render_failure_metadata()
                    && !render_callbacks.root_error_callbacks_invoked()
                    && !commit_evidence.root_error_callbacks_invoked()
            }
            (
                SyncFlushErrorRecoveryRootStatusForCanary::Committed
                | SyncFlushErrorRecoveryRootStatusForCanary::CommitFailed,
                None,
                None,
            ) => true,
            _ => false,
        }
    }

    #[must_use]
    pub(crate) fn accepted_private_root_error_recovery_commit_evidence(&self) -> bool {
        match (self.status, self.render_failure_commit_evidence) {
            (SyncFlushErrorRecoveryRootStatusForCanary::RenderFailed, Some(evidence)) => {
                evidence.accepted_render_failure_metadata()
                    && !evidence.commit_attempted()
                    && !evidence.root_current_switched()
                    && !evidence.retried_public_work()
                    && !evidence.invoked_public_callbacks()
                    && !evidence.root_error_callbacks_invoked()
                    && !evidence.public_error_boundaries_enabled()
                    && !evidence.recoverable_error_compatibility_claimed()
            }
            (
                SyncFlushErrorRecoveryRootStatusForCanary::Committed
                | SyncFlushErrorRecoveryRootStatusForCanary::CommitFailed,
                None,
            ) => true,
            _ => false,
        }
    }

    #[must_use]
    pub(crate) const fn retried_public_work(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn invoked_public_callbacks(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(&self) -> bool {
        false
    }
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush recovery diagnostics are reserved for render/commit error workers"
)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushErrorRecoveryDiagnosticsForCanary {
    skipped_reentrant_flush: bool,
    skipped_no_sync_work: bool,
    records: Vec<SyncFlushErrorRecoveryRootRecordForCanary>,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush recovery diagnostics are reserved for render/commit error workers"
)]
impl SyncFlushErrorRecoveryDiagnosticsForCanary {
    #[must_use]
    pub(crate) const fn skipped_reentrant_flush(&self) -> bool {
        self.skipped_reentrant_flush
    }

    #[must_use]
    pub(crate) const fn skipped_no_sync_work(&self) -> bool {
        self.skipped_no_sync_work
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[SyncFlushErrorRecoveryRootRecordForCanary] {
        &self.records
    }

    #[must_use]
    pub(crate) fn did_capture_failure(&self) -> bool {
        self.records
            .iter()
            .any(SyncFlushErrorRecoveryRootRecordForCanary::is_failure)
    }

    #[must_use]
    pub(crate) fn preserved_failed_root_metadata(&self) -> bool {
        self.records
            .iter()
            .filter(|record| record.is_failure())
            .all(|record| {
                record.preserved_lane_and_callback_metadata()
                    && record.preserved_error_callback_handles()
                    && record.accepted_private_root_error_recovery_commit_evidence()
            })
    }

    #[must_use]
    pub(crate) fn accepted_private_root_error_recovery_commit_evidence(&self) -> bool {
        self.records.iter().all(
            SyncFlushErrorRecoveryRootRecordForCanary::accepted_private_root_error_recovery_commit_evidence,
        )
    }

    #[must_use]
    pub(crate) const fn retried_public_work(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn invoked_public_callbacks(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
#[doc(hidden)]
pub struct SyncFlushCrossRootRenderDiagnosticsForCanary {
    committed_root_order: Vec<FiberRootId>,
    render_lanes_by_root: Vec<Lanes>,
    remaining_lanes_by_root: Vec<Lanes>,
    pending_lanes_by_root_after_commit: Vec<Lanes>,
    applied_update_counts_by_root: Vec<usize>,
    skipped_update_counts_by_root: Vec<usize>,
    skipped_reentrant_flush: bool,
    skipped_no_sync_work: bool,
    might_have_pending_sync_work_after_flush: bool,
    root_current_matches_commits: bool,
    sync_lanes_consumed_from_roots: bool,
}

impl SyncFlushCrossRootRenderDiagnosticsForCanary {
    #[must_use]
    pub fn committed_root_order(&self) -> &[FiberRootId] {
        &self.committed_root_order
    }

    #[must_use]
    pub fn render_lanes_by_root(&self) -> &[Lanes] {
        &self.render_lanes_by_root
    }

    #[must_use]
    pub fn remaining_lanes_by_root(&self) -> &[Lanes] {
        &self.remaining_lanes_by_root
    }

    #[must_use]
    pub fn pending_lanes_by_root_after_commit(&self) -> &[Lanes] {
        &self.pending_lanes_by_root_after_commit
    }

    #[must_use]
    pub fn applied_update_counts_by_root(&self) -> &[usize] {
        &self.applied_update_counts_by_root
    }

    #[must_use]
    pub fn skipped_update_counts_by_root(&self) -> &[usize] {
        &self.skipped_update_counts_by_root
    }

    #[must_use]
    pub const fn skipped_reentrant_flush(&self) -> bool {
        self.skipped_reentrant_flush
    }

    #[must_use]
    pub const fn skipped_no_sync_work(&self) -> bool {
        self.skipped_no_sync_work
    }

    #[must_use]
    pub const fn might_have_pending_sync_work_after_flush(&self) -> bool {
        self.might_have_pending_sync_work_after_flush
    }

    #[must_use]
    pub const fn root_current_matches_commits(&self) -> bool {
        self.root_current_matches_commits
    }

    #[must_use]
    pub const fn sync_lanes_consumed_from_roots(&self) -> bool {
        self.sync_lanes_consumed_from_roots
    }

    #[must_use]
    pub fn proves_cross_root_sync_flush_scheduling(&self) -> bool {
        self.committed_root_order.len() >= 2
            && self.render_lanes_by_root.len() == self.committed_root_order.len()
            && self.remaining_lanes_by_root.len() == self.committed_root_order.len()
            && self.pending_lanes_by_root_after_commit.len() == self.committed_root_order.len()
            && self
                .render_lanes_by_root
                .iter()
                .all(|lanes| *lanes == Lanes::SYNC)
            && self
                .remaining_lanes_by_root
                .iter()
                .all(|lanes| lanes.is_empty())
            && self
                .pending_lanes_by_root_after_commit
                .iter()
                .all(|lanes| lanes.is_empty())
            && !self.skipped_reentrant_flush
            && !self.skipped_no_sync_work
            && !self.might_have_pending_sync_work_after_flush
            && self.root_current_matches_commits
            && self.sync_lanes_consumed_from_roots
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushRootCallbackDrainDiagnosticsForCanary {
    skipped_reentrant_flush: bool,
    skipped_no_sync_work: bool,
    committed_root_order: Vec<FiberRootId>,
    root_snapshots: Vec<HostRootCallbackDrainSnapshotForCanary>,
    records: Vec<HostRootCallbackDrainRecordForCanary>,
}

#[allow(
    dead_code,
    reason = "crate-private root callback drain diagnostics are reserved for lane/order canaries"
)]
impl SyncFlushRootCallbackDrainDiagnosticsForCanary {
    #[must_use]
    pub(crate) const fn skipped_reentrant_flush(&self) -> bool {
        self.skipped_reentrant_flush
    }

    #[must_use]
    pub(crate) const fn skipped_no_sync_work(&self) -> bool {
        self.skipped_no_sync_work
    }

    #[must_use]
    pub(crate) fn committed_root_order(&self) -> &[FiberRootId] {
        &self.committed_root_order
    }

    #[must_use]
    pub(crate) fn root_snapshots(&self) -> &[HostRootCallbackDrainSnapshotForCanary] {
        &self.root_snapshots
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootCallbackDrainRecordForCanary] {
        &self.records
    }

    #[must_use]
    pub(crate) fn visible_callback_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.is_visible_callback())
            .count()
    }

    #[must_use]
    pub(crate) fn hidden_callback_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.is_hidden_callback())
            .count()
    }

    #[must_use]
    pub(crate) fn has_visible_and_hidden_callbacks(&self) -> bool {
        self.visible_callback_count() > 0 && self.hidden_callback_count() > 0
    }

    #[must_use]
    pub(crate) fn records_in_deterministic_commit_order(&self) -> bool {
        self.records.windows(2).all(|records| {
            let previous = records[0];
            let next = records[1];
            previous.commit_order() < next.commit_order()
                || (previous.commit_order() == next.commit_order()
                    && previous.callback_order() < next.callback_order())
        })
    }

    #[must_use]
    pub(crate) fn root_snapshots_in_commit_order(&self) -> bool {
        self.root_snapshots
            .iter()
            .enumerate()
            .all(|(expected_order, snapshot)| {
                snapshot.commit_order() == expected_order
                    && self.committed_root_order.get(expected_order).copied()
                        == Some(snapshot.root())
            })
    }

    #[must_use]
    pub(crate) fn callback_records_match_commit_lanes(&self) -> bool {
        self.records
            .iter()
            .all(|record| record.callback_lanes_match_commit())
    }

    #[must_use]
    pub(crate) fn hidden_callbacks_deferred_without_invocation(&self) -> bool {
        self.root_snapshots
            .iter()
            .all(|snapshot| snapshot.hidden_callbacks_deferred_without_invocation())
    }

    #[must_use]
    pub(crate) fn root_snapshots_prove_deterministic_lane_order(&self) -> bool {
        self.root_snapshots
            .iter()
            .all(|snapshot| snapshot.proves_deterministic_lane_order())
    }

    #[must_use]
    pub(crate) fn proves_cross_root_callback_lane_commit_order(&self) -> bool {
        self.root_snapshots.len() >= 2
            && self.committed_root_order.len() == self.root_snapshots.len()
            && self.has_visible_and_hidden_callbacks()
            && self.root_snapshots_in_commit_order()
            && self.records_in_deterministic_commit_order()
            && self.callback_records_match_commit_lanes()
            && self.hidden_callbacks_deferred_without_invocation()
            && self.root_snapshots_prove_deterministic_lane_order()
            && !self.skipped_reentrant_flush
            && !self.skipped_no_sync_work
            && !self.public_callbacks_invoked()
            && !self.public_root_callback_behavior_exposed()
    }

    #[must_use]
    pub(crate) const fn public_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_callback_behavior_exposed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushAcceptedVisibleCallbackExecutionRecordForCanary {
    root: FiberRootId,
    commit_order: usize,
    cross_root_invocation_order: usize,
    record: RootUpdateCallbackInvocationExecutionRecord,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush visible callback execution records are reserved for cross-root canaries"
)]
impl SyncFlushAcceptedVisibleCallbackExecutionRecordForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn commit_order(self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn cross_root_invocation_order(self) -> usize {
        self.cross_root_invocation_order
    }

    #[must_use]
    pub(crate) const fn root_invocation_order(self) -> usize {
        self.record.invocation_order()
    }

    #[must_use]
    pub(crate) const fn accepted_sequence(self) -> usize {
        self.record.accepted_sequence()
    }

    #[must_use]
    pub(crate) const fn update(self) -> UpdateId {
        self.record.update()
    }

    #[must_use]
    pub(crate) const fn callback(self) -> RootUpdateCallbackHandle {
        self.record.callback()
    }

    #[must_use]
    pub(crate) const fn visibility(self) -> RootUpdateCallbackVisibility {
        self.record.visibility()
    }

    #[must_use]
    pub(crate) const fn status(self) -> RootUpdateCallbackInvocationStatus {
        self.record.status()
    }

    #[must_use]
    pub(crate) const fn completed(self) -> bool {
        self.record.completed()
    }

    #[must_use]
    pub(crate) const fn errored(self) -> bool {
        self.record.errored()
    }

    #[must_use]
    pub(crate) fn is_visible_callback(self) -> bool {
        self.visibility().is_visible()
    }

    #[must_use]
    pub(crate) const fn public_callback_invoked(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushAcceptedVisibleCallbackExecutionDiagnosticsForCanary {
    skipped_reentrant_flush: bool,
    skipped_no_sync_work: bool,
    committed_root_order: Vec<FiberRootId>,
    accepted_root_order: Vec<FiberRootId>,
    invocations: Vec<HostRootVisibleCallbackInvocationAfterCommitSnapshot>,
    records: Vec<SyncFlushAcceptedVisibleCallbackExecutionRecordForCanary>,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush visible callback execution diagnostics are reserved for cross-root canaries"
)]
impl SyncFlushAcceptedVisibleCallbackExecutionDiagnosticsForCanary {
    #[must_use]
    pub(crate) const fn skipped_reentrant_flush(&self) -> bool {
        self.skipped_reentrant_flush
    }

    #[must_use]
    pub(crate) const fn skipped_no_sync_work(&self) -> bool {
        self.skipped_no_sync_work
    }

    #[must_use]
    pub(crate) fn committed_root_order(&self) -> &[FiberRootId] {
        &self.committed_root_order
    }

    #[must_use]
    pub(crate) fn accepted_root_order(&self) -> &[FiberRootId] {
        &self.accepted_root_order
    }

    #[must_use]
    pub(crate) fn invocations(&self) -> &[HostRootVisibleCallbackInvocationAfterCommitSnapshot] {
        &self.invocations
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[SyncFlushAcceptedVisibleCallbackExecutionRecordForCanary] {
        &self.records
    }

    #[must_use]
    pub(crate) fn matched_committed_roots(&self) -> bool {
        self.committed_root_order == self.accepted_root_order
            && self.invocations.len() == self.committed_root_order.len()
    }

    #[must_use]
    pub(crate) fn accepted_visible_callback_count(&self) -> usize {
        self.invocations
            .iter()
            .map(HostRootVisibleCallbackInvocationAfterCommitSnapshot::accepted_order_record_count)
            .sum()
    }

    #[must_use]
    pub(crate) fn completed_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.completed())
            .count()
    }

    #[must_use]
    pub(crate) fn error_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.errored())
            .count()
    }

    #[must_use]
    pub(crate) fn invoked_accepted_visible_callbacks_for_all_roots(&self) -> bool {
        self.invocations.len() == self.committed_root_order.len()
            && self
                .invocations
                .iter()
                .all(HostRootVisibleCallbackInvocationAfterCommitSnapshot::invoked_accepted_visible_callbacks)
    }

    #[must_use]
    pub(crate) fn records_are_visible(&self) -> bool {
        self.records
            .iter()
            .all(|record| record.is_visible_callback())
    }

    #[must_use]
    pub(crate) fn records_in_cross_root_commit_order(&self) -> bool {
        self.records
            .iter()
            .enumerate()
            .all(|(order, record)| record.cross_root_invocation_order() == order)
            && self.records.windows(2).all(|records| {
                let previous = records[0];
                let next = records[1];
                previous.commit_order() < next.commit_order()
                    || (previous.commit_order() == next.commit_order()
                        && previous.root_invocation_order() < next.root_invocation_order())
            })
    }

    #[must_use]
    pub(crate) fn records_match_accepted_visible_count(&self) -> bool {
        self.records.len() == self.accepted_visible_callback_count()
    }

    #[must_use]
    pub(crate) fn public_callbacks_invoked(&self) -> bool {
        self.records
            .iter()
            .any(|record| record.public_callback_invoked())
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

    #[must_use]
    pub(crate) fn proves_cross_root_accepted_visible_callback_execution(&self) -> bool {
        self.committed_root_order.len() >= 2
            && self.matched_committed_roots()
            && self.invoked_accepted_visible_callbacks_for_all_roots()
            && self.records_are_visible()
            && self.records_in_cross_root_commit_order()
            && self.records_match_accepted_visible_count()
            && !self.skipped_reentrant_flush
            && !self.skipped_no_sync_work
            && !self.public_callbacks_invoked()
            && !self.public_root_callback_behavior_exposed()
            && !self.hidden_callbacks_invoked()
            && !self.root_error_callbacks_invoked()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncFlushRootRecord {
    order: usize,
    root: FiberRootId,
    render_lanes: Lanes,
    render_phase: HostRootRenderPhaseRecord,
    commit: HostRootCommitRecord,
    act_continuation: Option<SchedulerActContinuationRecord>,
    act_post_passive_continuation_gate: Option<SyncFlushActPostPassiveContinuationGateRecord>,
    finished_work_handoff_identity: Option<SyncFlushFinishedWorkHandoffIdentityForCanary>,
    finished_work_commit_result_identity: Option<SyncFlushCommitResultIdentityForCanary>,
    finished_work_root_commit_handoff_verified: bool,
}

impl SyncFlushRootRecord {
    #[must_use]
    pub const fn order(&self) -> usize {
        self.order
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn render_phase(&self) -> HostRootRenderPhaseRecord {
        self.render_phase
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[allow(
        dead_code,
        reason = "crate-private sync-flush finished-work identity is reserved for private canary diagnostics"
    )]
    pub(crate) fn accepted_finished_work_handoff_for_canary(&self) -> bool {
        match (
            self.finished_work_handoff_identity,
            self.finished_work_commit_result_identity,
        ) {
            (Some(handoff), Some(commit)) => {
                handoff.accepted_current_finished_work_record_shape()
                    && commit.matches_finished_work_handoff(handoff)
                    && self.finished_work_root_commit_handoff_verified
            }
            _ => false,
        }
    }

    #[must_use]
    pub fn root_update_callbacks(&self) -> &RootUpdateCallbackSnapshot {
        self.commit.root_update_callbacks()
    }

    #[allow(
        dead_code,
        reason = "crate-private sync-flush root callback invocation execution gate is reserved for private act/root tests"
    )]
    pub(crate) fn drain_root_update_callbacks_under_test_control(
        &mut self,
        control: &mut impl RootUpdateCallbackInvocationTestControl,
    ) -> RootUpdateCallbackInvocationExecutionGateSnapshot {
        self.commit
            .drain_root_update_callbacks_under_test_control(control)
    }

    #[allow(
        dead_code,
        reason = "crate-private sync-flush post-passive execution gate reserved for future passive workers"
    )]
    pub(crate) fn post_passive_continuation_execution_gate<H: HostTypes>(
        &self,
        store: &mut FiberRootStore<H>,
        execution_context: &ExecutionContextState,
    ) -> Result<Option<SyncFlushPostPassiveContinuationExecutionGateRecord>, SyncFlushError> {
        sync_flush_post_passive_continuation_execution_gate(
            store,
            execution_context,
            self.commit.pending_passive_handoff(),
        )
        .map_err(SyncFlushError::from)
    }

    #[must_use]
    pub const fn applied_update_count(&self) -> usize {
        self.render_phase.applied_update_count()
    }

    #[must_use]
    pub const fn skipped_update_count(&self) -> usize {
        self.render_phase.skipped_update_count()
    }

    #[must_use]
    pub const fn remaining_lanes(&self) -> Lanes {
        self.commit.remaining_lanes()
    }

    #[must_use]
    pub const fn pending_lanes(&self) -> Lanes {
        self.commit.pending_lanes()
    }

    #[must_use]
    pub const fn has_remaining_work(&self) -> bool {
        self.commit.has_remaining_work()
    }

    pub fn commit_rendered_sync_flush_record<H: HostTypes>(
        store: &mut FiberRootStore<H>,
        record: RootSyncFlushRecord,
    ) -> Result<Self, SyncFlushError> {
        let committed = commit_render_phase(store, record.order(), record.render_phase())?;
        recompute_might_have_pending_sync_work(store)?;
        Ok(committed)
    }

    #[cfg(test)]
    #[allow(
        dead_code,
        reason = "crate-private sync-flush/act root execution path is exercised by focused canary tests"
    )]
    pub(crate) fn commit_rendered_sync_flush_act_record_through_root_execution_evidence_for_canary<
        H: HostTypes,
    >(
        store: &mut FiberRootStore<H>,
        record: RootSyncFlushRecord,
        requested_callback_node: RootSchedulerCallbackHandle,
    ) -> Result<
        SyncFlushActRootExecutionPathRecordForCanary,
        RootSyncSchedulerContinuationExecutionError,
    > {
        let root_scheduler_execution = execute_sync_scheduler_continuation_for_render_handoff(
            store,
            record,
            requested_callback_node,
        )?;
        let sync_flush_record =
            if root_scheduler_execution.did_execute_private_sync_scheduler_continuation() {
                let commit = root_scheduler_execution
                    .commit()
                    .expect("executed sync scheduler continuation must carry commit evidence")
                    .clone();
                Some(
                    sync_flush_root_record_after_commit(
                        store,
                        record.order(),
                        record.render_phase(),
                        commit,
                    )
                    .map_err(RootSyncSchedulerContinuationExecutionError::from)?,
                )
            } else {
                None
            };

        Ok(SyncFlushActRootExecutionPathRecordForCanary {
            root_scheduler_execution,
            sync_flush_record,
        })
    }

    #[doc(hidden)]
    pub fn commit_rendered_sync_flush_record_with_diagnostics_for_canary<H: HostTypes>(
        store: &mut FiberRootStore<H>,
        record: RootSyncFlushRecord,
    ) -> Result<(Self, SyncFlushRootHostOutputCommitDiagnosticsForCanary), SyncFlushError> {
        let committed = Self::commit_rendered_sync_flush_record(store, record)?;
        let diagnostics = committed.host_output_commit_diagnostics_for_canary(store)?;
        Ok((committed, diagnostics))
    }

    #[allow(
        dead_code,
        reason = "crate-private sync-flush commit recovery diagnostic reserved for private error workers"
    )]
    pub(crate) fn commit_rendered_sync_flush_record_with_error_recovery_diagnostics_for_canary<
        H: HostTypes,
    >(
        store: &mut FiberRootStore<H>,
        record: RootSyncFlushRecord,
    ) -> Result<SyncFlushErrorRecoveryRootRecordForCanary, SyncFlushError> {
        let scheduler_before =
            sync_flush_root_recovery_snapshot_for_canary(store, record.root(), record.lanes())?;
        let commit_before =
            host_root_commit_recovery_snapshot_for_canary(store, record.render_phase())?;

        match commit_render_phase(store, record.order(), record.render_phase()) {
            Ok(committed) => {
                recompute_might_have_pending_sync_work(store)?;
                let scheduler_after = sync_flush_root_recovery_snapshot_for_canary(
                    store,
                    record.root(),
                    record.lanes(),
                )?;
                Ok(SyncFlushErrorRecoveryRootRecordForCanary {
                    order: record.order(),
                    root: record.root(),
                    lanes: record.lanes(),
                    status: SyncFlushErrorRecoveryRootStatusForCanary::Committed,
                    scheduler_before,
                    scheduler_after,
                    commit_before: Some(commit_before),
                    commit_after: None,
                    render_error_option_callbacks: None,
                    render_failure_commit_evidence: None,
                    render_error: None,
                    commit_error: None,
                    committed: Some(committed),
                })
            }
            Err(SyncFlushError::RootCommit(error)) => {
                let scheduler_after = sync_flush_root_recovery_snapshot_for_canary(
                    store,
                    record.root(),
                    record.lanes(),
                )?;
                let commit_after =
                    host_root_commit_recovery_snapshot_for_canary(store, record.render_phase())?;
                Ok(SyncFlushErrorRecoveryRootRecordForCanary {
                    order: record.order(),
                    root: record.root(),
                    lanes: record.lanes(),
                    status: SyncFlushErrorRecoveryRootStatusForCanary::CommitFailed,
                    scheduler_before,
                    scheduler_after,
                    commit_before: Some(commit_before),
                    commit_after: Some(commit_after),
                    render_error_option_callbacks: None,
                    render_failure_commit_evidence: None,
                    render_error: None,
                    commit_error: Some(error),
                    committed: None,
                })
            }
            Err(error) => Err(error),
        }
    }

    #[doc(hidden)]
    pub fn host_output_commit_diagnostics_for_canary<H: HostTypes>(
        &self,
        store: &FiberRootStore<H>,
    ) -> Result<SyncFlushRootHostOutputCommitDiagnosticsForCanary, SyncFlushError> {
        let root = store.root(self.root)?;
        let scheduling = root.scheduling();
        let callback_queue = self.render_phase.work_in_progress_update_queue();
        let post_commit_callbacks = store
            .update_queues()
            .peek_root_update_callback_records(callback_queue)
            .map_err(RootCommitError::from)?;
        let accepted_callbacks = self.root_update_callbacks();

        Ok(SyncFlushRootHostOutputCommitDiagnosticsForCanary {
            root: self.root,
            order: self.order,
            callback_queue,
            render_lanes: self.render_lanes,
            finished_lanes: self.commit.finished_lanes(),
            remaining_lanes: self.commit.remaining_lanes(),
            commit_pending_lanes: self.commit.pending_lanes(),
            root_pending_lanes_after_commit: root.lanes().pending_lanes(),
            root_current_after_commit: root.current(),
            committed_current: self.commit.current(),
            render_phase_work_after_commit: scheduling.work_in_progress(),
            render_phase_lanes_after_commit: scheduling.work_in_progress_root_render_lanes(),
            callback_node_after_commit: scheduling.callback_node(),
            callback_priority_after_commit: scheduling.callback_priority(),
            might_have_pending_sync_work: store.root_scheduler().might_have_pending_sync_work(),
            accepted_visible_callback_count: accepted_callbacks.visible().len(),
            accepted_hidden_callback_count: accepted_callbacks.hidden().len(),
            accepted_deferred_hidden_callback_count: accepted_callbacks.deferred_hidden().len(),
            post_commit_visible_callback_count: post_commit_callbacks.visible().len(),
            post_commit_hidden_callback_count: post_commit_callbacks.hidden().len(),
            post_commit_deferred_hidden_callback_count: post_commit_callbacks
                .deferred_hidden()
                .len(),
            mutation_record_count: self.commit.mutation_log().len(),
            mutation_apply_record_count: self.commit.mutation_apply_log().len(),
            host_root_placement_apply_count: self
                .commit
                .host_root_placement_apply_diagnostics_for_canary()
                .len(),
            finished_work_handoff_identity: self.finished_work_handoff_identity,
            commit_result_identity: self.finished_work_commit_result_identity,
            finished_work_root_commit_handoff_verified: self
                .finished_work_root_commit_handoff_verified,
        })
    }

    #[doc(hidden)]
    #[allow(
        dead_code,
        reason = "crate-private sync-flush/act canary drain helper is exercised by tests and reserved for private act workers"
    )]
    pub(crate) fn drain_accepted_act_continuations_after_host_output_canary(
        &mut self,
        diagnostics: SyncFlushRootHostOutputCommitDiagnosticsForCanary,
    ) -> SyncFlushActPrivateExecutionDiagnosticsForCanary {
        let host_output_canary_committed =
            self.accepts_host_output_canary_commit_diagnostics(diagnostics);
        let blocked_by_pending_post_passive_gate =
            host_output_canary_committed && self.act_post_passive_continuation_gate.is_some();
        let can_drain = host_output_canary_committed && !blocked_by_pending_post_passive_gate;
        let mut drained_act_continuations = Vec::new();
        if can_drain
            && let Some(continuation) = self.act_continuation
            && let Some(record) = sync_flush_act_continuation_drain_record_after_host_output_canary(
                continuation,
                true,
            )
        {
            self.act_continuation = None;
            drained_act_continuations.push(record);
        }

        SyncFlushActPrivateExecutionDiagnosticsForCanary {
            root: self.root,
            order: self.order,
            host_output_canary_committed,
            blocked_by_pending_post_passive_gate,
            drained_act_continuations,
        }
    }

    #[allow(
        dead_code,
        reason = "crate-private sync-flush/act canary acceptance helper is exercised by tests and reserved for private act workers"
    )]
    fn accepts_host_output_canary_commit_diagnostics(
        &self,
        diagnostics: SyncFlushRootHostOutputCommitDiagnosticsForCanary,
    ) -> bool {
        diagnostics.root() == self.root
            && diagnostics.order() == self.order
            && diagnostics.render_lanes() == self.render_lanes
            && diagnostics.committed_current() == self.commit.current()
            && diagnostics.commit_handoff_state_consumed()
            && diagnostics.recorded_host_output_mutation_metadata()
            && diagnostics.host_root_placement_apply_count() > 0
            && diagnostics.root_current_after_commit() == self.commit.current()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushPostPassiveContinuationExecutionRecord {
    gate: SyncFlushPostPassiveContinuationExecutionGateRecord,
    sync_flush_result: Option<SyncFlushResult>,
}

#[allow(
    dead_code,
    reason = "crate-private post-passive sync-flush continuation execution metadata for future passive workers"
)]
impl SyncFlushPostPassiveContinuationExecutionRecord {
    #[must_use]
    pub(crate) const fn gate(&self) -> &SyncFlushPostPassiveContinuationExecutionGateRecord {
        &self.gate
    }

    #[must_use]
    pub(crate) fn sync_flush_result(&self) -> Option<&SyncFlushResult> {
        self.sync_flush_result.as_ref()
    }

    #[must_use]
    pub(crate) const fn did_request_follow_up_sync_flush(&self) -> bool {
        self.gate.should_execute_follow_up_sync_flush()
    }

    #[must_use]
    pub(crate) fn did_execute_follow_up_sync_flush(&self) -> bool {
        self.sync_flush_result.is_some()
    }

    #[must_use]
    pub(crate) fn did_flush_follow_up_sync_work(&self) -> bool {
        match &self.sync_flush_result {
            Some(result) => result.did_flush_work(),
            None => false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncFlushResult {
    skipped_reentrant_flush: bool,
    skipped_no_sync_work: bool,
    records: Vec<SyncFlushRootRecord>,
}

impl SyncFlushResult {
    #[must_use]
    pub fn records(&self) -> &[SyncFlushRootRecord] {
        &self.records
    }

    #[must_use]
    pub const fn skipped_reentrant_flush(&self) -> bool {
        self.skipped_reentrant_flush
    }

    #[must_use]
    pub const fn skipped_no_sync_work(&self) -> bool {
        self.skipped_no_sync_work
    }

    #[must_use]
    pub fn did_flush_work(&self) -> bool {
        !self.records.is_empty()
    }

    #[doc(hidden)]
    pub fn cross_root_render_diagnostics_for_canary<H: HostTypes>(
        &self,
        store: &FiberRootStore<H>,
    ) -> Result<SyncFlushCrossRootRenderDiagnosticsForCanary, SyncFlushError> {
        let mut committed_root_order = Vec::with_capacity(self.records.len());
        let mut render_lanes_by_root = Vec::with_capacity(self.records.len());
        let mut remaining_lanes_by_root = Vec::with_capacity(self.records.len());
        let mut pending_lanes_by_root_after_commit = Vec::with_capacity(self.records.len());
        let mut applied_update_counts_by_root = Vec::with_capacity(self.records.len());
        let mut skipped_update_counts_by_root = Vec::with_capacity(self.records.len());
        let mut root_current_matches_commits = true;
        let mut sync_lanes_consumed_from_roots = true;

        for record in &self.records {
            let root = store.root(record.root())?;
            let pending_lanes = root.lanes().pending_lanes();
            committed_root_order.push(record.root());
            render_lanes_by_root.push(record.render_lanes());
            remaining_lanes_by_root.push(record.remaining_lanes());
            pending_lanes_by_root_after_commit.push(pending_lanes);
            applied_update_counts_by_root.push(record.applied_update_count());
            skipped_update_counts_by_root.push(record.skipped_update_count());
            root_current_matches_commits &= root.current() == record.commit().current()
                && record.commit().current() == record.render_phase().finished_work();
            sync_lanes_consumed_from_roots &= record
                .commit()
                .finished_lanes()
                .contains_all(record.render_lanes())
                && !pending_lanes.contains_any(record.render_lanes());
        }

        Ok(SyncFlushCrossRootRenderDiagnosticsForCanary {
            committed_root_order,
            render_lanes_by_root,
            remaining_lanes_by_root,
            pending_lanes_by_root_after_commit,
            applied_update_counts_by_root,
            skipped_update_counts_by_root,
            skipped_reentrant_flush: self.skipped_reentrant_flush,
            skipped_no_sync_work: self.skipped_no_sync_work,
            might_have_pending_sync_work_after_flush: store
                .root_scheduler()
                .might_have_pending_sync_work(),
            root_current_matches_commits,
            sync_lanes_consumed_from_roots,
        })
    }

    #[allow(
        dead_code,
        reason = "crate-private root callback drain diagnostics are reserved for lane/order canaries"
    )]
    pub(crate) fn root_callback_drain_diagnostics_for_canary<H: HostTypes>(
        &self,
        store: &FiberRootStore<H>,
    ) -> Result<SyncFlushRootCallbackDrainDiagnosticsForCanary, SyncFlushError> {
        let mut committed_root_order = Vec::with_capacity(self.records.len());
        let mut root_snapshots = Vec::with_capacity(self.records.len());
        let mut callback_records = Vec::new();

        for record in &self.records {
            let snapshot = record
                .commit()
                .root_update_callback_drain_snapshot_for_canary(
                    store,
                    record.order(),
                    record.render_lanes(),
                )?;

            committed_root_order.push(record.root());
            callback_records.extend(snapshot.records().iter().copied());
            root_snapshots.push(snapshot);
        }

        Ok(SyncFlushRootCallbackDrainDiagnosticsForCanary {
            skipped_reentrant_flush: self.skipped_reentrant_flush,
            skipped_no_sync_work: self.skipped_no_sync_work,
            committed_root_order,
            root_snapshots,
            records: callback_records,
        })
    }

    #[allow(
        dead_code,
        reason = "crate-private sync-flush visible callback execution is reserved for cross-root canaries"
    )]
    pub(crate) fn execute_accepted_visible_root_update_callbacks_after_matching_commits_under_test_control_for_canary(
        &mut self,
        accepted_orders: &[HostRootQueuedCallbackOrderSnapshot],
        control: &mut impl RootUpdateCallbackInvocationTestControl,
    ) -> Result<SyncFlushAcceptedVisibleCallbackExecutionDiagnosticsForCanary, RootUpdateError>
    {
        let committed_root_order = self
            .records
            .iter()
            .map(SyncFlushRootRecord::root)
            .collect::<Vec<_>>();
        let accepted_root_order = accepted_orders
            .iter()
            .map(HostRootQueuedCallbackOrderSnapshot::root)
            .collect::<Vec<_>>();

        if committed_root_order != accepted_root_order {
            return Ok(
                SyncFlushAcceptedVisibleCallbackExecutionDiagnosticsForCanary {
                    skipped_reentrant_flush: self.skipped_reentrant_flush,
                    skipped_no_sync_work: self.skipped_no_sync_work,
                    committed_root_order,
                    accepted_root_order,
                    invocations: Vec::new(),
                    records: Vec::new(),
                },
            );
        }

        for (accepted_order, record) in accepted_orders.iter().zip(&self.records) {
            validate_host_root_accepted_visible_callbacks_after_matching_commit_for_canary(
                accepted_order,
                record.commit(),
            )?;
        }

        let mut invocations = Vec::with_capacity(accepted_orders.len());
        let mut callback_records = Vec::new();

        for (accepted_order, record) in accepted_orders.iter().zip(&mut self.records) {
            let root = record.root();
            let commit_order = record.order();
            let invocation =
                invoke_host_root_accepted_visible_callbacks_after_matching_commit_under_test_control_for_canary(
                    accepted_order,
                    &mut record.commit,
                    control,
                )?;

            for execution_record in invocation.execution().records() {
                callback_records.push(SyncFlushAcceptedVisibleCallbackExecutionRecordForCanary {
                    root,
                    commit_order,
                    cross_root_invocation_order: callback_records.len(),
                    record: *execution_record,
                });
            }

            invocations.push(invocation);
        }

        Ok(
            SyncFlushAcceptedVisibleCallbackExecutionDiagnosticsForCanary {
                skipped_reentrant_flush: self.skipped_reentrant_flush,
                skipped_no_sync_work: self.skipped_no_sync_work,
                committed_root_order,
                accepted_root_order,
                invocations,
                records: callback_records,
            },
        )
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SyncFlushError {
    FiberRootStore(FiberRootStoreError),
    RootScheduler(RootSchedulerError),
    RootWorkLoop(RootWorkLoopError),
    RootCommit(RootCommitError),
    #[cfg(test)]
    FinishedWorkCommitHandoff(String),
}

impl Display for SyncFlushError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::RootScheduler(error) => Display::fmt(error, formatter),
            Self::RootWorkLoop(error) => Display::fmt(error, formatter),
            Self::RootCommit(error) => Display::fmt(error, formatter),
            #[cfg(test)]
            Self::FinishedWorkCommitHandoff(error) => formatter.write_str(error),
        }
    }
}

impl Error for SyncFlushError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::RootScheduler(error) => Some(error),
            Self::RootWorkLoop(error) => Some(error),
            Self::RootCommit(error) => Some(error),
            #[cfg(test)]
            Self::FinishedWorkCommitHandoff(_) => None,
        }
    }
}

impl From<FiberRootStoreError> for SyncFlushError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<RootSchedulerError> for SyncFlushError {
    fn from(error: RootSchedulerError) -> Self {
        Self::RootScheduler(error)
    }
}

impl From<RootWorkLoopError> for SyncFlushError {
    fn from(error: RootWorkLoopError) -> Self {
        Self::RootWorkLoop(error)
    }
}

impl From<RootCommitError> for SyncFlushError {
    fn from(error: RootCommitError) -> Self {
        Self::RootCommit(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary> for SyncFlushError {
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        match error {
            HostRootFinishedWorkCommitHandoffErrorForCanary::Commit(error) => {
                Self::RootCommit(error)
            }
            error => Self::FinishedWorkCommitHandoff(error.to_string()),
        }
    }
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush root commit continuation diagnostics are reserved for private finished-work workers"
)]
pub(crate) fn commit_sync_flush_root_finished_work_continuation_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    execution_context: &ExecutionContextState,
    record: RootSyncFlushRecord,
) -> Result<SyncFlushRootCommitContinuationRecordForCanary, SyncFlushError> {
    let execution_context = execution_context.sync_flush_record();
    let root = record.root();
    let order = record.order();
    let selected_lanes = record.lanes();

    if !execution_context.can_enter_sync_flush() {
        return Ok(sync_flush_root_commit_continuation_record(
            execution_context,
            SyncFlushRootCommitContinuationStatusForCanary::BlockedByExecutionContext,
            root,
            order,
            selected_lanes,
            None,
            None,
            None,
        ));
    }

    if store.root_scheduler().is_flushing_work() {
        return Ok(sync_flush_root_commit_continuation_record(
            execution_context,
            SyncFlushRootCommitContinuationStatusForCanary::SkippedReentrantFlush,
            root,
            order,
            selected_lanes,
            None,
            None,
            None,
        ));
    }

    if !selected_lanes_are_sync_flush_lanes(selected_lanes) {
        return Ok(sync_flush_root_commit_continuation_record(
            execution_context,
            SyncFlushRootCommitContinuationStatusForCanary::RejectedNonSyncLanes,
            root,
            order,
            selected_lanes,
            None,
            None,
            None,
        ));
    }

    let handoff_identity = sync_flush_finished_work_handoff_identity_for_canary(store, record)?;
    if record.status() != RootSyncFlushRecordStatus::RenderedAwaitingCommit
        || !handoff_identity.accepted_current_finished_work_record_shape()
    {
        return Ok(sync_flush_root_commit_continuation_record(
            execution_context,
            SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff,
            root,
            order,
            selected_lanes,
            Some(handoff_identity),
            None,
            None,
        ));
    }

    store.root_scheduler_mut().set_is_flushing_work(true);
    #[cfg(test)]
    let committed = (|| {
        let render_phase = record.render_phase();
        let pending = record_host_root_finished_work_pending_commit_for_canary(
            store,
            render_phase,
            record.order(),
        )?;
        let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            store,
            render_phase,
            Some(pending),
            record.order().saturating_add(1),
        )?;
        sync_flush_root_record_after_commit(
            store,
            record.order(),
            render_phase,
            handoff.commit().clone(),
        )
        .map_err(SyncFlushError::from)
    })();
    #[cfg(not(test))]
    let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(store, record);
    store.root_scheduler_mut().set_is_flushing_work(false);
    let committed = committed?;
    recompute_might_have_pending_sync_work(store)?;
    let commit_identity = sync_flush_commit_result_identity_for_canary(store, &committed)?;

    Ok(sync_flush_root_commit_continuation_record(
        execution_context,
        SyncFlushRootCommitContinuationStatusForCanary::Committed,
        root,
        order,
        selected_lanes,
        Some(handoff_identity),
        Some(commit_identity),
        Some(committed),
    ))
}

#[allow(
    clippy::too_many_arguments,
    reason = "private sync-flush continuation evidence record mirrors the canary assertion shape"
)]
fn sync_flush_root_commit_continuation_record(
    execution_context: SyncFlushExecutionContextRecord,
    status: SyncFlushRootCommitContinuationStatusForCanary,
    root: FiberRootId,
    order: usize,
    selected_lanes: Lanes,
    handoff_identity: Option<SyncFlushFinishedWorkHandoffIdentityForCanary>,
    commit_result_identity: Option<SyncFlushCommitResultIdentityForCanary>,
    commit: Option<SyncFlushRootRecord>,
) -> SyncFlushRootCommitContinuationRecordForCanary {
    SyncFlushRootCommitContinuationRecordForCanary {
        execution_context,
        status,
        root,
        order,
        selected_lanes,
        handoff_identity,
        commit_result_identity,
        commit,
    }
}

#[cfg(test)]
fn ensure_sync_flush_finished_work_handoff_identity_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    order: usize,
    render_phase: HostRootRenderPhaseRecord,
) -> Result<SyncFlushFinishedWorkHandoffIdentityForCanary, SyncFlushError> {
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(store, render_phase, order)?;

    if pending.root_finished_work().is_none() && pending.root_finished_lanes() == Lanes::NO {
        store
            .root_mut(render_phase.root())?
            .record_finished_work_for_canary(
                render_phase.finished_work(),
                render_phase.render_lanes(),
            );
    }

    let identity = sync_flush_finished_work_handoff_identity_from_render_phase_for_canary(
        store,
        render_phase.root(),
        order,
        render_phase.render_lanes(),
        render_phase,
    )?;

    if !identity.accepted_current_finished_work_record_shape() {
        return Err(SyncFlushError::FinishedWorkCommitHandoff(
            SYNC_FLUSH_FINISHED_WORK_HANDOFF_IDENTITY_MISMATCH_FOR_CANARY.to_owned(),
        ));
    }

    Ok(identity)
}

fn sync_flush_finished_work_handoff_identity_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    record: RootSyncFlushRecord,
) -> Result<SyncFlushFinishedWorkHandoffIdentityForCanary, SyncFlushError> {
    sync_flush_finished_work_handoff_identity_from_render_phase_for_canary(
        store,
        record.root(),
        record.order(),
        record.lanes(),
        record.render_phase(),
    )
}

fn sync_flush_finished_work_handoff_identity_from_render_phase_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    order: usize,
    selected_lanes: Lanes,
    render_phase: HostRootRenderPhaseRecord,
) -> Result<SyncFlushFinishedWorkHandoffIdentityForCanary, SyncFlushError> {
    let root = store.root(root_id)?;
    let scheduling = root.scheduling();

    Ok(SyncFlushFinishedWorkHandoffIdentityForCanary {
        root: root_id,
        render_phase_root: render_phase.root(),
        order,
        selected_lanes,
        root_token: root_id.state_node_handle(),
        previous_current: render_phase.current(),
        current_before_commit: root.current(),
        pending_work_before_commit: scheduling.work_in_progress(),
        root_finished_work_before_commit: root.finished_work(),
        finished_work: render_phase.finished_work(),
        render_lanes: render_phase.render_lanes(),
        finished_lanes: render_phase.render_lanes(),
        root_finished_lanes_before_commit: root.finished_lanes(),
        remaining_lanes: render_phase.remaining_lanes(),
        pending_lanes_before_commit: root.lanes().pending_lanes(),
        render_phase_lanes_before_commit: scheduling.work_in_progress_root_render_lanes(),
    })
}

fn sync_flush_commit_result_identity_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    record: &SyncFlushRootRecord,
) -> Result<SyncFlushCommitResultIdentityForCanary, SyncFlushError> {
    let root = store.root(record.root())?;
    let commit = record.commit();

    Ok(SyncFlushCommitResultIdentityForCanary {
        root: record.root(),
        order: record.order(),
        selected_lanes: record.render_lanes(),
        previous_current: commit.previous_current(),
        committed_current: commit.current(),
        finished_work: commit.finished_work(),
        finished_lanes: commit.finished_lanes(),
        remaining_lanes: commit.remaining_lanes(),
        pending_lanes: commit.pending_lanes(),
        root_current_after_commit: root.current(),
        root_finished_work_after_commit: root.finished_work(),
        root_finished_lanes_after_commit: root.finished_lanes(),
    })
}

fn selected_lanes_are_sync_flush_lanes(lanes: Lanes) -> bool {
    lanes.is_non_empty() && SYNC_FLUSH_LANES.contains_all(lanes)
}

pub(crate) fn flush_sync_post_passive_continuation_after_passive_effects<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    execution_context: &ExecutionContextState,
    pending_passive_handoff: Option<PendingPassiveCommitHandoff>,
) -> Result<Option<SyncFlushPostPassiveContinuationExecutionRecord>, SyncFlushError> {
    let Some(gate) = sync_flush_post_passive_continuation_execution_gate(
        store,
        execution_context,
        pending_passive_handoff,
    )?
    else {
        return Ok(None);
    };

    let sync_flush_result = if gate.should_execute_follow_up_sync_flush() {
        Some(flush_sync_commit_work_on_all_roots(store)?)
    } else {
        None
    };

    Ok(Some(SyncFlushPostPassiveContinuationExecutionRecord {
        gate,
        sync_flush_result,
    }))
}

pub fn flush_sync_commit_work_on_all_roots<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> Result<SyncFlushResult, SyncFlushError> {
    if store.root_scheduler().is_flushing_work() {
        return Ok(SyncFlushResult {
            skipped_reentrant_flush: true,
            skipped_no_sync_work: false,
            records: Vec::new(),
        });
    }

    if !store.root_scheduler().might_have_pending_sync_work() {
        return Ok(SyncFlushResult {
            skipped_reentrant_flush: false,
            skipped_no_sync_work: true,
            records: Vec::new(),
        });
    }

    store.root_scheduler_mut().set_is_flushing_work(true);
    let records = flush_sync_work_across_scheduled_roots(store);
    store.root_scheduler_mut().set_is_flushing_work(false);
    let records = records?;

    recompute_might_have_pending_sync_work(store)?;

    Ok(SyncFlushResult {
        skipped_reentrant_flush: false,
        skipped_no_sync_work: false,
        records,
    })
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush recovery diagnostics are reserved for render/commit error workers"
)]
pub(crate) fn flush_sync_commit_work_on_all_roots_with_error_recovery_diagnostics_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
) -> Result<SyncFlushErrorRecoveryDiagnosticsForCanary, SyncFlushError> {
    if store.root_scheduler().is_flushing_work() {
        return Ok(SyncFlushErrorRecoveryDiagnosticsForCanary {
            skipped_reentrant_flush: true,
            skipped_no_sync_work: false,
            records: Vec::new(),
        });
    }

    if !store.root_scheduler().might_have_pending_sync_work() {
        return Ok(SyncFlushErrorRecoveryDiagnosticsForCanary {
            skipped_reentrant_flush: false,
            skipped_no_sync_work: true,
            records: Vec::new(),
        });
    }

    store.root_scheduler_mut().set_is_flushing_work(true);
    let records =
        flush_sync_work_across_scheduled_roots_with_error_recovery_diagnostics_for_canary(store);
    store.root_scheduler_mut().set_is_flushing_work(false);
    let records = records?;

    let diagnostics = SyncFlushErrorRecoveryDiagnosticsForCanary {
        skipped_reentrant_flush: false,
        skipped_no_sync_work: false,
        records,
    };

    if !diagnostics.did_capture_failure() {
        recompute_might_have_pending_sync_work(store)?;
    }

    Ok(diagnostics)
}

fn flush_sync_work_across_scheduled_roots<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> Result<Vec<SyncFlushRootRecord>, SyncFlushError> {
    let mut records = Vec::new();

    loop {
        let mut did_perform_some_work = false;
        let mut root = store.root_scheduler().first_scheduled_root();

        while let Some(root_id) = root {
            let next_root = store.root(root_id)?.scheduling().next_scheduled_root();
            let render_lanes = sync_flush_lanes_for_root(store, root_id)?;

            if render_lanes.is_non_empty() {
                let render_phase = render_host_root_for_lanes(store, root_id, render_lanes)?;
                records.push(commit_render_phase(store, records.len(), render_phase)?);
                did_perform_some_work = true;
            }

            root = next_root;
        }

        if !did_perform_some_work {
            return Ok(records);
        }
    }
}

fn flush_sync_work_across_scheduled_roots_with_error_recovery_diagnostics_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
) -> Result<Vec<SyncFlushErrorRecoveryRootRecordForCanary>, SyncFlushError> {
    let mut records = Vec::new();

    loop {
        let mut did_perform_some_work = false;
        let mut root = store.root_scheduler().first_scheduled_root();

        while let Some(root_id) = root {
            let next_root = store.root(root_id)?.scheduling().next_scheduled_root();
            let render_lanes = sync_flush_lanes_for_root(store, root_id)?;

            if render_lanes.is_non_empty() {
                let scheduler_before =
                    sync_flush_root_recovery_snapshot_for_canary(store, root_id, render_lanes)?;
                match render_host_root_for_lanes(store, root_id, render_lanes) {
                    Ok(render_phase) => {
                        let order = records.len();
                        let commit_before =
                            host_root_commit_recovery_snapshot_for_canary(store, render_phase)?;
                        match commit_render_phase(store, order, render_phase) {
                            Ok(committed) => {
                                let scheduler_after = sync_flush_root_recovery_snapshot_for_canary(
                                    store,
                                    root_id,
                                    render_lanes,
                                )?;
                                records.push(SyncFlushErrorRecoveryRootRecordForCanary {
                                    order,
                                    root: root_id,
                                    lanes: render_lanes,
                                    status: SyncFlushErrorRecoveryRootStatusForCanary::Committed,
                                    scheduler_before,
                                    scheduler_after,
                                    commit_before: Some(commit_before),
                                    commit_after: None,
                                    render_error_option_callbacks: None,
                                    render_failure_commit_evidence: None,
                                    render_error: None,
                                    commit_error: None,
                                    committed: Some(committed),
                                });
                                did_perform_some_work = true;
                            }
                            Err(SyncFlushError::RootCommit(error)) => {
                                let scheduler_after = sync_flush_root_recovery_snapshot_for_canary(
                                    store,
                                    root_id,
                                    render_lanes,
                                )?;
                                let commit_after = host_root_commit_recovery_snapshot_for_canary(
                                    store,
                                    render_phase,
                                )?;
                                records.push(SyncFlushErrorRecoveryRootRecordForCanary {
                                    order,
                                    root: root_id,
                                    lanes: render_lanes,
                                    status: SyncFlushErrorRecoveryRootStatusForCanary::CommitFailed,
                                    scheduler_before,
                                    scheduler_after,
                                    commit_before: Some(commit_before),
                                    commit_after: Some(commit_after),
                                    render_error_option_callbacks: None,
                                    render_failure_commit_evidence: None,
                                    render_error: None,
                                    commit_error: Some(error),
                                    committed: None,
                                });
                                return Ok(records);
                            }
                            Err(error) => return Err(error),
                        }
                    }
                    Err(error) => {
                        let render_error_option_callbacks =
                            record_root_render_error_option_callbacks(
                                store,
                                root_id,
                                render_lanes,
                                error.clone(),
                            )?;
                        let render_failure_commit_evidence =
                            host_root_render_failure_recovery_commit_evidence_for_canary(
                                root_id,
                                render_lanes,
                                render_error_option_callbacks.error_option_callbacks(),
                            );
                        let scheduler_after = sync_flush_root_recovery_snapshot_for_canary(
                            store,
                            root_id,
                            render_lanes,
                        )?;
                        records.push(SyncFlushErrorRecoveryRootRecordForCanary {
                            order: records.len(),
                            root: root_id,
                            lanes: render_lanes,
                            status: SyncFlushErrorRecoveryRootStatusForCanary::RenderFailed,
                            scheduler_before,
                            scheduler_after,
                            commit_before: None,
                            commit_after: None,
                            render_error_option_callbacks: Some(render_error_option_callbacks),
                            render_failure_commit_evidence: Some(render_failure_commit_evidence),
                            render_error: Some(error),
                            commit_error: None,
                            committed: None,
                        });
                        return Ok(records);
                    }
                }
            }

            root = next_root;
        }

        if !did_perform_some_work {
            return Ok(records);
        }
    }
}

fn commit_render_phase<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    order: usize,
    render_phase: HostRootRenderPhaseRecord,
) -> Result<SyncFlushRootRecord, SyncFlushError> {
    #[cfg(test)]
    let finished_work_handoff_identity =
        ensure_sync_flush_finished_work_handoff_identity_for_canary(store, order, render_phase)?;

    #[cfg(test)]
    let root_commit_handoff = {
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(store, render_phase, order)?;
        commit_finished_host_root_with_finished_work_handoff_for_canary(
            store,
            render_phase,
            Some(pending),
            order.saturating_add(1),
        )?
    };
    #[cfg(test)]
    let commit = root_commit_handoff.commit().clone();
    #[cfg(not(test))]
    let commit = commit_finished_host_root(store, render_phase)?;
    let record = sync_flush_root_record_after_commit(store, order, render_phase, commit)
        .map_err(SyncFlushError::from)?;

    #[cfg(test)]
    {
        let mut record = record;
        let commit_result_identity = sync_flush_commit_result_identity_for_canary(store, &record)?;
        record.finished_work_handoff_identity = Some(finished_work_handoff_identity);
        record.finished_work_commit_result_identity = Some(commit_result_identity);
        record.finished_work_root_commit_handoff_verified =
            root_commit_handoff.proves_private_root_finished_work_commit_metadata_handoff();
        Ok(record)
    }

    #[cfg(not(test))]
    {
        Ok(record)
    }
}

fn sync_flush_root_record_after_commit<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    order: usize,
    render_phase: HostRootRenderPhaseRecord,
    commit: HostRootCommitRecord,
) -> Result<SyncFlushRootRecord, RootSchedulerError> {
    let continuation_lanes =
        sync_flush_act_continuation_lanes_for_root(store, render_phase.root())?;
    let act_continuation = store
        .scheduler_bridge_mut()
        .record_sync_flush_act_continuation(
            render_phase.root(),
            order,
            render_phase.render_lanes(),
            commit.remaining_lanes(),
            continuation_lanes,
        );
    let act_post_passive_continuation_gate = sync_flush_act_post_passive_continuation_gate(
        act_continuation,
        commit.pending_passive_handoff(),
    );
    Ok(SyncFlushRootRecord {
        order,
        root: render_phase.root(),
        render_lanes: render_phase.render_lanes(),
        render_phase,
        commit,
        act_continuation,
        act_post_passive_continuation_gate,
        finished_work_handoff_identity: None,
        finished_work_commit_result_identity: None,
        finished_work_root_commit_handoff_verified: false,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::host_work::{
        HostWorkError, HostWorkResult, SyncFlushHostMutationExecutionErrorForCanary,
        delete_test_host_work_root_child_for_canary, execute_sync_flush_host_mutations_for_canary,
        mount_test_host_work, sync_flush_host_mutation_execution_request_for_canary,
        update_test_host_work_root_component_for_canary,
        update_test_host_work_root_text_for_canary,
    };
    use crate::root_callbacks::{
        ROOT_UPDATE_CALLBACK_INVOCATION_EXECUTION_GATE_BLOCKERS,
        RootUpdateCallbackInvocationErrorHandle, RootUpdateCallbackInvocationExecutionGateStatus,
        RootUpdateCallbackInvocationRequest, RootUpdateCallbackInvocationStatus,
        RootUpdateCallbackInvocationTestControl,
    };
    use crate::root_commit::HostRootMutationApplyRecordKind;
    use crate::root_config::RootErrorOptionCallbackPhase;
    use crate::root_scheduler::{
        RootSyncSchedulerContinuationExecutionStatus,
        SchedulerBridgeActContinuationExecutionStatus,
        SchedulerBridgeActQueueRequestExecutionStatus, root_sync_flush_record_for_canary,
    };
    use crate::root_updates::{
        host_root_queued_callback_order_snapshot_for_canary, update_container_transition_for_canary,
    };
    use crate::scheduler_bridge::SchedulerActContinuationStatus;
    use crate::test_support::{
        FakeContainer, RecordingHost, TestHostElement, TestHostNode, TestHostText, TestHostTree,
    };
    use crate::{
        ExecutionContextState, RootElementHandle, RootErrorCallbackHandle, RootOptions,
        RootRecoverableErrorCallbackHandle, RootSyncFlushExitStatus, RootSyncFlushRecordStatus,
        RootTaskScheduleOutcome, TestRendererHostOutputCanaryFixture,
        TestRendererHostOutputCanaryMutationKind, ensure_root_is_scheduled,
        finish_test_renderer_host_output_canary_fibers, flush_sync_work_on_all_roots,
        inspect_test_renderer_host_output_canary_commit,
        prepare_test_renderer_host_output_canary_fibers, scheduled_roots, update_container,
        update_container_sync,
    };
    use crate::{RootUpdateCallbackHandle, RootUpdateCallbackRecord, RootUpdateCallbackVisibility};
    use fast_react_core::{FiberTag, Lane, Lanes, UpdateQueueHandle};

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id, host)
    }

    fn current_host_root_element(
        store: &FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> RootElementHandle {
        let current = store.root(root_id).unwrap().current();
        host_root_element(store, current)
    }

    fn host_root_element(
        store: &FiberRootStore<RecordingHost>,
        fiber: fast_react_core::FiberId,
    ) -> RootElementHandle {
        let state = store.fiber_arena().get(fiber).unwrap().memoized_state();
        store.host_root_states().get(state).unwrap().element()
    }

    fn schedule_sync_update(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        element: RootElementHandle,
    ) {
        let result = update_container_sync(store, root_id, element, None).unwrap();
        ensure_root_is_scheduled(store, result.schedule()).unwrap();
    }

    fn callback_handles(records: &[RootUpdateCallbackRecord]) -> Vec<RootUpdateCallbackHandle> {
        records.iter().map(|record| record.callback()).collect()
    }

    fn assert_sync_flush_finished_work_handoff_diagnostics(
        store: &FiberRootStore<RecordingHost>,
        record: &SyncFlushRootRecord,
        previous_current: fast_react_core::FiberId,
    ) {
        let diagnostics = record
            .host_output_commit_diagnostics_for_canary(store)
            .unwrap();

        assert!(record.accepted_finished_work_handoff_for_canary());
        assert!(diagnostics.finished_work_handoff_identity_recorded());
        assert!(diagnostics.commit_result_identity_recorded());
        assert!(diagnostics.accepted_finished_work_handoff_identity());
        assert!(diagnostics.commit_result_matches_finished_work_handoff());
        assert!(diagnostics.finished_work_root_commit_handoff_verified());
        assert!(diagnostics.accepted_finished_work_handoff());
        assert!(diagnostics.commit_handoff_state_consumed());
        assert_eq!(
            diagnostics.root_finished_work_before_commit(),
            Some(record.render_phase().finished_work())
        );
        assert_eq!(
            diagnostics.pending_work_before_commit(),
            Some(record.render_phase().finished_work())
        );
        assert_eq!(
            diagnostics.finished_work_before_commit(),
            Some(record.render_phase().finished_work())
        );
        assert_eq!(
            diagnostics.finished_lanes_before_commit(),
            Some(record.render_lanes())
        );
        assert_eq!(
            diagnostics.root_finished_lanes_before_commit(),
            Some(record.render_lanes())
        );
        assert_eq!(diagnostics.current_before_commit(), Some(previous_current));
    }

    fn assert_sync_flush_finished_work_handoff_identity_mismatch(error: SyncFlushError) {
        assert!(matches!(
            error,
            SyncFlushError::FinishedWorkCommitHandoff(message)
                if message == SYNC_FLUSH_FINISHED_WORK_HANDOFF_IDENTITY_MISMATCH_FOR_CANARY
        ));
    }

    struct SyncFlushHostMutationFixture {
        store: FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        source: TestHostTree,
        host: RecordingHost,
        host_work: HostWorkResult,
        committed: SyncFlushRootRecord,
        diagnostics: SyncFlushRootHostOutputCommitDiagnosticsForCanary,
        operations_before_opt_in: Vec<&'static str>,
    }

    fn sync_flush_host_mutation_fixture(label: &str) -> SyncFlushHostMutationFixture {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("section", label);
        schedule_sync_update(&mut store, root_id, element);
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        let host_work = mount_test_host_work(&mut store, &mut host, render_phase, &source).unwrap();
        let operations_before_opt_in = host.operations();

        let (committed, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered_record,
            )
            .unwrap();

        assert_eq!(host.operations(), operations_before_opt_in);

        SyncFlushHostMutationFixture {
            store,
            root_id,
            source,
            host,
            host_work,
            committed,
            diagnostics,
            operations_before_opt_in,
        }
    }

    fn sync_flush_text_host_mutation_fixture(label: &str) -> SyncFlushHostMutationFixture {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let element = source.insert_text(label);
        schedule_sync_update(&mut store, root_id, element);
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        let host_work = mount_test_host_work(&mut store, &mut host, render_phase, &source).unwrap();
        let operations_before_opt_in = host.operations();

        let (committed, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered_record,
            )
            .unwrap();

        assert_eq!(host.operations(), operations_before_opt_in);

        SyncFlushHostMutationFixture {
            store,
            root_id,
            source,
            host,
            host_work,
            committed,
            diagnostics,
            operations_before_opt_in,
        }
    }

    fn text_from_root(source: &TestHostTree, element: RootElementHandle) -> &TestHostText {
        match source.root(element).unwrap() {
            TestHostNode::Text(text) => text,
            TestHostNode::Element(_) => panic!("expected text root"),
        }
    }

    fn element_from_root(source: &TestHostTree, element: RootElementHandle) -> &TestHostElement {
        match source.root(element).unwrap() {
            TestHostNode::Element(element) => element,
            TestHostNode::Text(_) => panic!("expected host element root"),
        }
    }

    fn execute_fixture_sync_flush_host_mutations(
        fixture: &mut SyncFlushHostMutationFixture,
    ) -> crate::host_work::SyncFlushHostMutationExecutionDiagnosticForCanary {
        let request = sync_flush_host_mutation_execution_request_for_canary(
            &fixture.committed,
            fixture.diagnostics,
        )
        .unwrap();
        execute_sync_flush_host_mutations_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.committed,
            fixture.diagnostics,
            request,
            &mut fixture.host_work,
        )
        .unwrap()
    }

    fn root_callback_error(raw: u64) -> RootUpdateCallbackInvocationErrorHandle {
        RootUpdateCallbackInvocationErrorHandle::from_raw(raw)
    }

    #[derive(Default)]
    struct TestRootUpdateCallbackControl {
        calls: Vec<RootUpdateCallbackInvocationRequest>,
        results: Vec<(
            RootUpdateCallbackHandle,
            Result<(), RootUpdateCallbackInvocationErrorHandle>,
        )>,
    }

    impl TestRootUpdateCallbackControl {
        fn with_result(
            mut self,
            callback: RootUpdateCallbackHandle,
            result: Result<(), RootUpdateCallbackInvocationErrorHandle>,
        ) -> Self {
            self.results.push((callback, result));
            self
        }

        fn calls(&self) -> &[RootUpdateCallbackInvocationRequest] {
            &self.calls
        }

        fn result(
            &self,
            callback: RootUpdateCallbackHandle,
        ) -> Result<(), RootUpdateCallbackInvocationErrorHandle> {
            self.results
                .iter()
                .find(|(accepted, _)| *accepted == callback)
                .map_or(Ok(()), |(_, result)| *result)
        }
    }

    impl RootUpdateCallbackInvocationTestControl for TestRootUpdateCallbackControl {
        fn invoke_root_update_callback(
            &mut self,
            request: RootUpdateCallbackInvocationRequest,
        ) -> Result<(), RootUpdateCallbackInvocationErrorHandle> {
            self.calls.push(request);
            self.result(request.callback())
        }
    }

    #[test]
    fn sync_flush_no_op_fast_path_returns_empty_result() {
        let (mut store, _root_id, host) = root_store();

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

        assert!(result.skipped_no_sync_work());
        assert!(!result.skipped_reentrant_flush());
        assert!(!result.did_flush_work());
        assert!(result.records().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_commits_one_root_sync_work() {
        let (mut store, root_id, host) = root_store();
        let element = RootElementHandle::from_raw(42);
        let previous_current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, element);

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

        assert!(result.did_flush_work());
        assert_eq!(result.records().len(), 1);
        let record = &result.records()[0];
        assert_eq!(record.order(), 0);
        assert_eq!(record.root(), root_id);
        assert_eq!(record.render_lanes(), Lanes::SYNC);
        assert_eq!(record.applied_update_count(), 1);
        assert_eq!(record.skipped_update_count(), 0);
        assert_eq!(record.remaining_lanes(), Lanes::NO);
        assert_eq!(record.pending_lanes(), Lanes::NO);
        assert!(!record.has_remaining_work());
        assert_eq!(record.commit().previous_current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            record.commit().current()
        );
        assert_eq!(current_host_root_element(&store, root_id), element);
        assert!(!store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_all_roots_commit_diagnostics_verify_finished_work_handoff_identity() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let first = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let first_previous_current = store.root(first).unwrap().current();
        let second_previous_current = store.root(second).unwrap().current();

        schedule_sync_update(&mut store, first, RootElementHandle::from_raw(42_100));
        schedule_sync_update(&mut store, second, RootElementHandle::from_raw(42_200));

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

        assert!(result.did_flush_work());
        assert_eq!(result.records().len(), 2);
        assert_eq!(result.records()[0].root(), first);
        assert_eq!(result.records()[1].root(), second);

        let first_record = &result.records()[0];
        assert_sync_flush_finished_work_handoff_diagnostics(
            &store,
            first_record,
            first_previous_current,
        );

        let second_record = &result.records()[1];
        assert_sync_flush_finished_work_handoff_diagnostics(
            &store,
            second_record,
            second_previous_current,
        );

        assert_eq!(store.root(first).unwrap().finished_work(), None);
        assert_eq!(store.root(first).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(store.root(second).unwrap().finished_work(), None);
        assert_eq!(store.root(second).unwrap().finished_lanes(), Lanes::NO);
        assert!(!store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_handoff_commits_completed_render_record_as_inert_commit_record() {
        let (mut store, root_id, host) = root_store();
        let element = RootElementHandle::from_raw(66);
        let callback = RootUpdateCallbackHandle::from_raw(660);
        let previous_current = store.root(root_id).unwrap().current();
        let update = update_container_sync(&mut store, root_id, element, Some(callback)).unwrap();
        ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        assert_eq!(rendered.records().len(), 1);
        assert_eq!(
            rendered.records()[0].status(),
            RootSyncFlushRecordStatus::RenderedAwaitingCommit
        );
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert!(store.root_scheduler().might_have_pending_sync_work());

        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();

        assert_eq!(committed.order(), 0);
        assert_eq!(committed.root(), root_id);
        assert_eq!(committed.render_lanes(), Lanes::SYNC);
        assert_eq!(committed.applied_update_count(), 1);
        assert_eq!(committed.skipped_update_count(), 0);
        assert_eq!(committed.remaining_lanes(), Lanes::NO);
        assert_eq!(committed.pending_lanes(), Lanes::NO);
        assert_eq!(committed.commit().previous_current(), previous_current);
        assert_eq!(committed.commit().finished_lanes(), Lanes::SYNC);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            committed.commit().current()
        );
        assert_eq!(current_host_root_element(&store, root_id), element);

        let callbacks = committed.root_update_callbacks();
        assert_eq!(
            callbacks.queue(),
            committed.render_phase().work_in_progress_update_queue()
        );
        assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
        assert_eq!(callbacks.visible()[0].update(), update.update());
        assert!(callbacks.hidden().is_empty());
        assert!(callbacks.deferred_hidden().is_empty());
        assert!(!store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_direct_commit_rejects_stale_root_finished_work_metadata() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_080));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        store
            .root_mut(root_id)
            .unwrap()
            .record_finished_work_for_canary(previous_current, Lanes::SYNC);

        let error =
            SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered_record)
                .unwrap_err();

        assert_sync_flush_finished_work_handoff_identity_mismatch(error);
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render_phase.finished_work())
        );
        assert_eq!(
            store.root(root_id).unwrap().finished_work(),
            Some(previous_current)
        );
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::SYNC);
        assert!(store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_direct_commit_rejects_root_finished_lanes_metadata_mismatch() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_081));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        let mismatched_lanes = Lanes::from(Lane::SYNC_HYDRATION);
        store
            .root_mut(root_id)
            .unwrap()
            .record_finished_work_for_canary(render_phase.finished_work(), mismatched_lanes);

        let error =
            SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered_record)
                .unwrap_err();

        assert_sync_flush_finished_work_handoff_identity_mismatch(error);
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render_phase.finished_work())
        );
        assert_eq!(
            store.root(root_id).unwrap().finished_work(),
            Some(render_phase.finished_work())
        );
        assert_eq!(
            store.root(root_id).unwrap().finished_lanes(),
            mismatched_lanes
        );
        assert!(store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_root_commit_continuation_consumes_finished_work_handoff_metadata() {
        let (mut store, root_id, host) = root_store();
        let element = RootElementHandle::from_raw(66_100);
        let callback = RootUpdateCallbackHandle::from_raw(66_101);
        let previous_current = store.root(root_id).unwrap().current();
        let update = update_container_sync(&mut store, root_id, element, Some(callback)).unwrap();
        ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();

        let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
            &mut store,
            &ExecutionContextState::new(),
            rendered_record,
        )
        .unwrap();

        assert_eq!(
            continuation.status(),
            SyncFlushRootCommitContinuationStatusForCanary::Committed
        );
        assert!(continuation.execution_context().can_enter_sync_flush());
        assert_eq!(continuation.root(), root_id);
        assert_eq!(continuation.order(), 0);
        assert_eq!(continuation.selected_lanes(), Lanes::SYNC);
        assert!(continuation.accepted_finished_work_handoff());
        assert!(continuation.produced_one_inert_commit_record());
        assert!(!continuation.executes_passive_effects());
        assert!(!continuation.public_flush_sync_compatibility_claimed());

        let handoff = continuation.handoff_identity().unwrap();
        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.render_phase_root(), root_id);
        assert_eq!(handoff.order(), 0);
        assert_eq!(handoff.selected_lanes(), Lanes::SYNC);
        assert_eq!(handoff.root_token(), root_id.state_node_handle());
        assert_eq!(handoff.previous_current(), previous_current);
        assert_eq!(handoff.current_before_commit(), previous_current);
        assert_eq!(
            handoff.pending_work_before_commit(),
            Some(render_phase.finished_work())
        );
        assert_eq!(
            handoff.root_finished_work_before_commit(),
            Some(render_phase.finished_work())
        );
        assert_eq!(handoff.finished_work(), render_phase.finished_work());
        assert_eq!(handoff.render_lanes(), Lanes::SYNC);
        assert_eq!(handoff.finished_lanes(), Lanes::SYNC);
        assert_eq!(handoff.root_finished_lanes_before_commit(), Lanes::SYNC);
        assert_eq!(handoff.remaining_lanes(), Lanes::NO);
        assert_eq!(handoff.pending_lanes_before_commit(), Lanes::SYNC);
        assert_eq!(handoff.render_phase_lanes_before_commit(), Lanes::SYNC);
        assert!(handoff.accepted_current_finished_work_record_shape());

        let commit_identity = continuation.commit_result_identity().unwrap();
        assert_eq!(commit_identity.root(), root_id);
        assert_eq!(commit_identity.order(), 0);
        assert_eq!(commit_identity.selected_lanes(), Lanes::SYNC);
        assert_eq!(commit_identity.previous_current(), previous_current);
        assert_eq!(
            commit_identity.committed_current(),
            render_phase.finished_work()
        );
        assert_eq!(
            commit_identity.finished_work(),
            render_phase.finished_work()
        );
        assert_eq!(commit_identity.finished_lanes(), Lanes::SYNC);
        assert_eq!(commit_identity.remaining_lanes(), Lanes::NO);
        assert_eq!(commit_identity.pending_lanes(), Lanes::NO);
        assert_eq!(
            commit_identity.root_current_after_commit(),
            render_phase.finished_work()
        );
        assert_eq!(commit_identity.root_finished_work_after_commit(), None);
        assert_eq!(
            commit_identity.root_finished_lanes_after_commit(),
            Lanes::NO
        );
        assert!(commit_identity.matches_finished_work_handoff(handoff));

        let commit = continuation.commit().unwrap();
        assert_eq!(commit.order(), 0);
        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.render_lanes(), Lanes::SYNC);
        assert_eq!(commit.commit().previous_current(), previous_current);
        assert_eq!(commit.commit().current(), render_phase.finished_work());
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render_phase.finished_work()
        );
        assert_eq!(current_host_root_element(&store, root_id), element);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert!(!store.root_scheduler().is_flushing_work());
        assert!(!store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_act_root_execution_path_uses_scheduler_and_commit_evidence() {
        let (mut store, root_id, host) = root_store();
        let sync_element = RootElementHandle::from_raw(66_150);
        let default_element = RootElementHandle::from_raw(66_151);
        let previous_current = store.root(root_id).unwrap().current();
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, root_id, sync_element);
        let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
        ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();

        let routed =
            SyncFlushRootRecord::commit_rendered_sync_flush_act_record_through_root_execution_evidence_for_canary(
                &mut store,
                rendered_record,
                RootSchedulerCallbackHandle::NONE,
            )
            .unwrap();

        assert!(routed.routed_private_sync_flush_act_path());
        assert!(routed.accepted_root_scheduler_execution_evidence());
        assert!(routed.accepted_root_commit_execution_evidence());
        assert!(!routed.public_act_compatibility_claimed());
        assert!(!routed.public_flush_sync_compatibility_claimed());
        let root_execution = routed.root_scheduler_execution();
        assert_eq!(
            root_execution.status(),
            RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
        );
        assert_eq!(root_execution.root(), root_id);
        assert_eq!(root_execution.handoff(), rendered_record);
        assert_eq!(root_execution.handoff_lanes(), Lanes::SYNC);
        assert_eq!(root_execution.selected_lanes(), Lanes::SYNC);
        assert!(root_execution.routed_through_root_scheduler_and_commit_evidence_for_canary());
        let handoff = root_execution.root_commit_handoff_for_canary().unwrap();
        assert!(handoff.proves_private_root_finished_work_commit_metadata_handoff());
        assert_eq!(handoff.pending().previous_current(), previous_current);
        assert_eq!(
            handoff.pending().root_finished_work(),
            Some(render_phase.finished_work())
        );
        assert!(handoff.execution_request().records_root_finished_work());
        assert_eq!(
            handoff.pending().finished_work(),
            render_phase.finished_work()
        );

        let sync_flush = routed.sync_flush_record().unwrap();
        assert_eq!(sync_flush.root(), root_id);
        assert_eq!(sync_flush.order(), rendered_record.order());
        assert_eq!(sync_flush.render_lanes(), Lanes::SYNC);
        assert_eq!(sync_flush.commit().previous_current(), previous_current);
        assert_eq!(sync_flush.commit().current(), render_phase.finished_work());
        assert_eq!(
            sync_flush
                .act_continuation
                .as_ref()
                .unwrap()
                .continuation_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render_phase.finished_work()
        );
        assert_eq!(current_host_root_element(&store, root_id), sync_element);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::DEFAULT
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_root_commit_continuation_rejects_render_commit_and_reentry() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_200));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        let mut execution_context = ExecutionContextState::new();

        let render_reentry = execution_context
            .with_render_context(|execution_context| {
                commit_sync_flush_root_finished_work_continuation_for_canary(
                    &mut store,
                    execution_context,
                    rendered_record,
                )
            })
            .unwrap();

        assert_eq!(
            render_reentry.status(),
            SyncFlushRootCommitContinuationStatusForCanary::BlockedByExecutionContext
        );
        assert!(
            render_reentry
                .execution_context()
                .blocked_by_render_or_commit()
        );
        assert_eq!(render_reentry.commit(), None);
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render_phase.finished_work())
        );

        let commit_reentry = execution_context
            .with_commit_context(|execution_context| {
                commit_sync_flush_root_finished_work_continuation_for_canary(
                    &mut store,
                    execution_context,
                    rendered_record,
                )
            })
            .unwrap();

        assert_eq!(
            commit_reentry.status(),
            SyncFlushRootCommitContinuationStatusForCanary::BlockedByExecutionContext
        );
        assert!(
            commit_reentry
                .execution_context()
                .blocked_by_render_or_commit()
        );
        assert_eq!(commit_reentry.commit(), None);
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);

        store.root_scheduler_mut().set_is_flushing_work(true);
        let scheduler_reentry = commit_sync_flush_root_finished_work_continuation_for_canary(
            &mut store,
            &ExecutionContextState::new(),
            rendered_record,
        )
        .unwrap();
        store.root_scheduler_mut().set_is_flushing_work(false);

        assert_eq!(
            scheduler_reentry.status(),
            SyncFlushRootCommitContinuationStatusForCanary::SkippedReentrantFlush
        );
        assert!(scheduler_reentry.execution_context().can_enter_sync_flush());
        assert_eq!(scheduler_reentry.commit(), None);
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render_phase.finished_work())
        );
        assert!(store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_root_commit_continuation_rejects_stale_finished_work_handoff() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_300));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .clear_render_phase_work();

        let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
            &mut store,
            &ExecutionContextState::new(),
            rendered_record,
        )
        .unwrap();

        assert_eq!(
            continuation.status(),
            SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff
        );
        assert_eq!(continuation.root(), root_id);
        assert_eq!(continuation.order(), 0);
        assert_eq!(continuation.selected_lanes(), Lanes::SYNC);
        assert!(!continuation.accepted_finished_work_handoff());
        assert!(!continuation.produced_one_inert_commit_record());
        assert_eq!(continuation.commit(), None);
        let handoff = continuation.handoff_identity().unwrap();
        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.finished_work(), render_phase.finished_work());
        assert_eq!(handoff.current_before_commit(), previous_current);
        assert_eq!(handoff.pending_work_before_commit(), None);
        assert_eq!(
            handoff.root_finished_work_before_commit(),
            Some(render_phase.finished_work())
        );
        assert!(!handoff.accepted_current_finished_work_record_shape());
        assert_eq!(continuation.commit_result_identity(), None);
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().finished_work(),
            Some(render_phase.finished_work())
        );
        assert!(store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_root_commit_continuation_rejects_missing_root_finished_work_handoff() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_310));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        store.root_mut(root_id).unwrap().clear_finished_work();

        let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
            &mut store,
            &ExecutionContextState::new(),
            rendered_record,
        )
        .unwrap();

        assert_eq!(
            continuation.status(),
            SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff
        );
        assert!(!continuation.accepted_finished_work_handoff());
        assert_eq!(continuation.commit(), None);
        let handoff = continuation.handoff_identity().unwrap();
        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.render_phase_root(), root_id);
        assert_eq!(
            handoff.pending_work_before_commit(),
            Some(render_phase.finished_work())
        );
        assert_eq!(handoff.root_finished_work_before_commit(), None);
        assert_eq!(handoff.root_finished_lanes_before_commit(), Lanes::NO);
        assert!(!handoff.accepted_current_finished_work_record_shape());
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_root_commit_continuation_rejects_stale_root_finished_work_handoff() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_320));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        store
            .root_mut(root_id)
            .unwrap()
            .record_finished_work_for_canary(previous_current, Lanes::SYNC);

        let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
            &mut store,
            &ExecutionContextState::new(),
            rendered_record,
        )
        .unwrap();

        assert_eq!(
            continuation.status(),
            SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff
        );
        assert_eq!(continuation.commit(), None);
        let handoff = continuation.handoff_identity().unwrap();
        assert_eq!(
            handoff.root_finished_work_before_commit(),
            Some(previous_current)
        );
        assert_eq!(
            handoff.finished_work(),
            rendered_record.render_phase().finished_work()
        );
        assert_eq!(handoff.root_finished_lanes_before_commit(), Lanes::SYNC);
        assert!(!handoff.accepted_current_finished_work_record_shape());
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_root_commit_continuation_rejects_finished_lanes_mismatch() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_321));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        store
            .root_mut(root_id)
            .unwrap()
            .record_finished_work_for_canary(
                render_phase.finished_work(),
                Lanes::from(Lane::SYNC_HYDRATION),
            );

        let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
            &mut store,
            &ExecutionContextState::new(),
            rendered_record,
        )
        .unwrap();

        assert_eq!(
            continuation.status(),
            SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff
        );
        assert_eq!(continuation.root(), root_id);
        assert_eq!(continuation.selected_lanes(), Lanes::SYNC);
        assert!(!continuation.accepted_finished_work_handoff());
        assert!(!continuation.produced_one_inert_commit_record());
        assert!(!continuation.public_flush_sync_compatibility_claimed());
        assert!(!continuation.executes_passive_effects());
        assert_eq!(continuation.commit(), None);
        assert_eq!(continuation.commit_result_identity(), None);
        let handoff = continuation.handoff_identity().unwrap();
        assert_eq!(
            handoff.root_finished_work_before_commit(),
            Some(render_phase.finished_work())
        );
        assert_eq!(
            handoff.root_finished_lanes_before_commit(),
            Lanes::from(Lane::SYNC_HYDRATION)
        );
        assert_eq!(handoff.finished_lanes(), Lanes::SYNC);
        assert!(!handoff.accepted_current_finished_work_record_shape());
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_root_commit_continuation_rejects_foreign_finished_work_handoff() {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let first = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let first_current = store.root(first).unwrap().current();
        let second_current = store.root(second).unwrap().current();
        schedule_sync_update(&mut store, first, RootElementHandle::from_raw(66_330));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let first_record = rendered.records()[0];
        let foreign_record =
            root_sync_flush_record_for_canary(0, second, Lanes::SYNC, first_record.render_phase());

        let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
            &mut store,
            &ExecutionContextState::new(),
            foreign_record,
        )
        .unwrap();

        assert_eq!(
            continuation.status(),
            SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff
        );
        assert_eq!(continuation.commit(), None);
        let handoff = continuation.handoff_identity().unwrap();
        assert_eq!(handoff.root(), second);
        assert_eq!(handoff.render_phase_root(), first);
        assert_eq!(handoff.current_before_commit(), second_current);
        assert_ne!(
            handoff.root_finished_work_before_commit(),
            Some(handoff.finished_work())
        );
        assert!(!handoff.accepted_current_finished_work_record_shape());
        assert_eq!(store.root(first).unwrap().current(), first_current);
        assert_eq!(store.root(second).unwrap().current(), second_current);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_root_commit_continuation_rejects_non_sync_lanes() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(66_400),
            None,
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();
        let render_phase = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let non_sync_record =
            root_sync_flush_record_for_canary(0, root_id, Lanes::DEFAULT, render_phase);

        let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
            &mut store,
            &ExecutionContextState::new(),
            non_sync_record,
        )
        .unwrap();

        assert_eq!(
            continuation.status(),
            SyncFlushRootCommitContinuationStatusForCanary::RejectedNonSyncLanes
        );
        assert_eq!(continuation.root(), root_id);
        assert_eq!(continuation.order(), 0);
        assert_eq!(continuation.selected_lanes(), Lanes::DEFAULT);
        assert_eq!(continuation.handoff_identity(), None);
        assert_eq!(continuation.commit_result_identity(), None);
        assert_eq!(continuation.commit(), None);
        assert!(!continuation.produced_one_inert_commit_record());
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render_phase.finished_work())
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_error_recovery_diagnostics_preserve_render_failure_metadata() {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(
                FakeContainer::new(1),
                RootOptions::new()
                    .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(4511))
                    .with_on_caught_error(RootErrorCallbackHandle::from_raw(4512))
                    .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(4513)),
            )
            .unwrap();
        let callback = RootUpdateCallbackHandle::from_raw(4501);
        let update = update_container_sync(
            &mut store,
            root_id,
            RootElementHandle::from_raw(4501),
            Some(callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
        let invalid_queue = UpdateQueueHandle::from_raw(999_450);
        store
            .fiber_arena_mut()
            .get_mut(previous_current)
            .unwrap()
            .set_update_queue(invalid_queue);

        let diagnostics =
            flush_sync_commit_work_on_all_roots_with_error_recovery_diagnostics_for_canary(
                &mut store,
            )
            .unwrap();

        assert!(!diagnostics.skipped_reentrant_flush());
        assert!(!diagnostics.skipped_no_sync_work());
        assert!(diagnostics.did_capture_failure());
        assert!(diagnostics.preserved_failed_root_metadata());
        assert!(diagnostics.accepted_private_root_error_recovery_commit_evidence());
        assert!(!diagnostics.retried_public_work());
        assert!(!diagnostics.invoked_public_callbacks());
        assert!(!diagnostics.root_error_callbacks_invoked());
        assert!(!diagnostics.public_flush_sync_compatibility_claimed());
        assert_eq!(diagnostics.records().len(), 1);
        let record = &diagnostics.records()[0];
        assert_eq!(record.order(), 0);
        assert_eq!(record.root(), root_id);
        assert_eq!(record.lanes(), Lanes::SYNC);
        assert_eq!(
            record.status(),
            SyncFlushErrorRecoveryRootStatusForCanary::RenderFailed
        );
        assert!(record.commit_error().is_none());
        assert!(record.committed().is_none());
        assert!(matches!(
            record.render_error(),
            Some(RootWorkLoopError::UpdateQueue(
                crate::UpdateQueueError::InvalidQueueHandle { handle }
            )) if *handle == invalid_queue
        ));
        let render_callbacks = record.render_error_option_callbacks().unwrap();
        assert_eq!(render_callbacks.root(), root_id);
        assert_eq!(render_callbacks.render_lanes(), Lanes::SYNC);
        assert!(matches!(
            render_callbacks.error(),
            RootWorkLoopError::UpdateQueue(crate::UpdateQueueError::InvalidQueueHandle {
                handle
            }) if *handle == invalid_queue
        ));
        assert_eq!(
            render_callbacks.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(4511)
        );
        assert_eq!(
            render_callbacks.on_caught_error(),
            RootErrorCallbackHandle::from_raw(4512)
        );
        assert_eq!(
            render_callbacks.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(4513)
        );
        let root_error_callbacks = render_callbacks.error_option_callbacks();
        assert_eq!(root_error_callbacks.root(), root_id);
        assert_eq!(
            root_error_callbacks.phase(),
            RootErrorOptionCallbackPhase::Render
        );
        assert!(render_callbacks.has_configured_error_callback());
        assert!(!render_callbacks.root_error_callbacks_invoked());
        assert!(!render_callbacks.public_error_boundaries_enabled());
        assert!(!render_callbacks.recoverable_error_compatibility_claimed());
        let commit_evidence = record.render_failure_commit_evidence().unwrap();
        assert_eq!(commit_evidence.root(), root_id);
        assert_eq!(commit_evidence.render_lanes(), Lanes::SYNC);
        assert_eq!(
            commit_evidence.error_option_callbacks(),
            root_error_callbacks
        );
        assert_eq!(
            commit_evidence.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(4511)
        );
        assert_eq!(
            commit_evidence.on_caught_error(),
            RootErrorCallbackHandle::from_raw(4512)
        );
        assert_eq!(
            commit_evidence.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(4513)
        );
        assert!(commit_evidence.has_configured_error_callback());
        assert!(commit_evidence.accepted_render_failure_metadata());
        assert!(!commit_evidence.commit_attempted());
        assert!(!commit_evidence.root_current_switched());
        assert!(!commit_evidence.retried_public_work());
        assert!(!commit_evidence.invoked_public_callbacks());
        assert!(!commit_evidence.root_error_callbacks_invoked());
        assert!(!commit_evidence.public_error_boundaries_enabled());
        assert!(!commit_evidence.recoverable_error_compatibility_claimed());
        assert_eq!(record.scheduler_before().pending_lanes(), pending_lanes);
        assert_eq!(record.scheduler_after().pending_lanes(), pending_lanes);
        assert!(record.preserved_lane_and_callback_metadata());
        assert!(record.preserved_error_callback_handles());
        assert!(record.accepted_private_root_error_recovery_commit_evidence());
        assert!(!record.retried_public_work());
        assert!(!record.invoked_public_callbacks());
        assert!(!record.root_error_callbacks_invoked());
        assert!(!record.public_flush_sync_compatibility_claimed());
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            pending_lanes
        );
        assert!(store.root_scheduler().might_have_pending_sync_work());
        assert!(!store.root_scheduler().is_flushing_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_error_recovery_diagnostics_respect_reentry_guard_without_public_retry() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(4503));
        let previous_current = store.root(root_id).unwrap().current();
        let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
        store.root_scheduler_mut().set_is_flushing_work(true);

        let diagnostics =
            flush_sync_commit_work_on_all_roots_with_error_recovery_diagnostics_for_canary(
                &mut store,
            )
            .unwrap();
        store.root_scheduler_mut().set_is_flushing_work(false);

        assert!(diagnostics.skipped_reentrant_flush());
        assert!(!diagnostics.skipped_no_sync_work());
        assert!(!diagnostics.did_capture_failure());
        assert!(diagnostics.records().is_empty());
        assert!(!diagnostics.retried_public_work());
        assert!(!diagnostics.invoked_public_callbacks());
        assert!(!diagnostics.public_flush_sync_compatibility_claimed());
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            pending_lanes
        );
        assert!(store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_commit_recovery_diagnostics_preserve_callbacks_without_public_retry() {
        let (mut store, root_id, host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(4502);
        let previous_current = store.root(root_id).unwrap().current();
        let update = update_container_sync(
            &mut store,
            root_id,
            RootElementHandle::from_raw(4502),
            Some(callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();
        let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .clear_render_phase_work();

        let diagnostic =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_error_recovery_diagnostics_for_canary(
                &mut store,
                rendered_record,
            )
            .unwrap();

        assert_eq!(diagnostic.order(), 0);
        assert_eq!(diagnostic.root(), root_id);
        assert_eq!(diagnostic.lanes(), Lanes::SYNC);
        assert_eq!(
            diagnostic.status(),
            SyncFlushErrorRecoveryRootStatusForCanary::CommitFailed
        );
        assert!(diagnostic.render_error().is_none());
        assert!(diagnostic.committed().is_none());
        assert!(matches!(
            diagnostic.commit_error(),
            Some(RootCommitError::RenderPhaseWorkMismatch {
                root,
                expected,
                actual,
            }) if *root == root_id
                && expected.is_none()
                && *actual == render_phase.finished_work()
        ));
        let before = diagnostic.commit_before().unwrap();
        let after = diagnostic.commit_after().unwrap();
        assert_eq!(
            before.callback_queue(),
            render_phase.work_in_progress_update_queue()
        );
        assert_eq!(before.visible_callback_count(), 1);
        assert_eq!(before.hidden_callback_count(), 0);
        assert_eq!(before.deferred_hidden_callback_count(), 0);
        assert_eq!(
            callback_handles(before.root_update_callbacks().visible()),
            vec![callback]
        );
        assert!(after.preserves_lane_and_callback_metadata_from(before));
        assert!(diagnostic.preserved_lane_and_callback_metadata());
        assert!(!diagnostic.retried_public_work());
        assert!(!diagnostic.invoked_public_callbacks());
        assert!(!diagnostic.public_flush_sync_compatibility_claimed());
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            pending_lanes
        );
        assert!(store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_handoff_commits_already_renderable_host_output_canary_with_diagnostics() {
        let (mut store, root_id, host) = root_store();
        let sync_element = RootElementHandle::from_raw(800);
        let default_element = RootElementHandle::from_raw(801);
        let callback = RootUpdateCallbackHandle::from_raw(802);
        let previous_current = store.root(root_id).unwrap().current();
        let sync_update =
            update_container_sync(&mut store, root_id, sync_element, Some(callback)).unwrap();
        ensure_root_is_scheduled(&mut store, sync_update.schedule()).unwrap();
        let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
        ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        assert_eq!(rendered.records().len(), 1);
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        assert_eq!(render_phase.root(), root_id);
        assert_eq!(render_phase.render_lanes(), Lanes::SYNC);
        assert_eq!(render_phase.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert!(store.root_scheduler().might_have_pending_sync_work());

        let fixture = TestRendererHostOutputCanaryFixture::new(810, 811, 812);
        let prepared =
            prepare_test_renderer_host_output_canary_fibers(&mut store, render_phase, fixture)
                .unwrap();
        let completed =
            finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 813, 814).unwrap();

        let (committed, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered_record,
            )
            .unwrap();

        assert_eq!(committed.order(), 0);
        assert_eq!(committed.root(), root_id);
        assert_eq!(committed.render_lanes(), Lanes::SYNC);
        assert_eq!(committed.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(committed.pending_lanes(), Lanes::DEFAULT);
        assert!(committed.has_remaining_work());
        assert_eq!(committed.commit().previous_current(), previous_current);
        assert_eq!(committed.commit().current(), completed.host_root());
        assert_eq!(
            store.root(root_id).unwrap().current(),
            completed.host_root()
        );
        assert_eq!(current_host_root_element(&store, root_id), sync_element);
        assert!(
            !store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::SYNC)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );

        let callbacks = committed.root_update_callbacks();
        assert_eq!(
            callbacks.queue(),
            render_phase.work_in_progress_update_queue()
        );
        assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
        assert_eq!(callbacks.visible()[0].update(), sync_update.update());
        assert!(callbacks.hidden().is_empty());
        assert!(callbacks.deferred_hidden().is_empty());

        let host_output = inspect_test_renderer_host_output_canary_commit(committed.commit());
        assert_eq!(host_output.mutation_records().len(), 1);
        assert!(host_output.deletion_lists().is_empty());
        assert_eq!(
            host_output.mutation_records()[0].kind(),
            TestRendererHostOutputCanaryMutationKind::Placement
        );
        assert_eq!(
            host_output.mutation_records()[0].fiber(),
            completed.component()
        );
        assert_eq!(
            host_output.mutation_records()[0].tag(),
            FiberTag::HostComponent
        );
        assert_eq!(host_output.mutation_records()[0].state_node_raw(), 813);
        assert_eq!(
            store
                .fiber_arena()
                .get(completed.component())
                .unwrap()
                .child(),
            Some(completed.text())
        );

        let placement_diagnostics = committed
            .commit()
            .host_root_placement_apply_diagnostics_for_canary();
        assert_eq!(placement_diagnostics.len(), 1);
        assert_eq!(placement_diagnostics[0].fiber(), completed.component());
        assert_eq!(
            placement_diagnostics[0].apply_kind(),
            "append-placement-to-container"
        );
        assert_eq!(placement_diagnostics[0].sibling_status(), "append");

        assert_eq!(diagnostics.root(), root_id);
        assert_eq!(diagnostics.order(), 0);
        assert_eq!(
            diagnostics.callback_queue(),
            render_phase.work_in_progress_update_queue()
        );
        assert_eq!(diagnostics.render_lanes(), Lanes::SYNC);
        assert_eq!(diagnostics.finished_lanes(), Lanes::SYNC);
        assert!(diagnostics.finished_work_handoff_identity_recorded());
        assert!(diagnostics.commit_result_identity_recorded());
        assert!(diagnostics.accepted_finished_work_handoff_identity());
        assert!(diagnostics.commit_result_matches_finished_work_handoff());
        assert!(diagnostics.finished_work_root_commit_handoff_verified());
        assert!(diagnostics.accepted_finished_work_handoff());
        assert_eq!(
            diagnostics.root_finished_work_before_commit(),
            Some(completed.host_root())
        );
        assert_eq!(
            diagnostics.root_finished_lanes_before_commit(),
            Some(Lanes::SYNC)
        );
        assert_eq!(diagnostics.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(diagnostics.commit_pending_lanes(), Lanes::DEFAULT);
        assert_eq!(
            diagnostics.root_pending_lanes_after_commit(),
            Lanes::DEFAULT
        );
        assert_eq!(
            diagnostics.root_current_after_commit(),
            completed.host_root()
        );
        assert_eq!(diagnostics.committed_current(), completed.host_root());
        assert_eq!(diagnostics.render_phase_work_after_commit(), None);
        assert_eq!(diagnostics.render_phase_lanes_after_commit(), Lanes::NO);
        assert_eq!(
            diagnostics.callback_node_after_commit(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(
            diagnostics.callback_priority_after_commit(),
            RootCallbackPriority::NO
        );
        assert!(!diagnostics.might_have_pending_sync_work());
        assert_eq!(diagnostics.accepted_visible_callback_count(), 1);
        assert_eq!(diagnostics.accepted_hidden_callback_count(), 0);
        assert_eq!(diagnostics.accepted_deferred_hidden_callback_count(), 0);
        assert_eq!(diagnostics.accepted_callback_count(), 1);
        assert_eq!(diagnostics.post_commit_visible_callback_count(), 0);
        assert_eq!(diagnostics.post_commit_hidden_callback_count(), 0);
        assert_eq!(diagnostics.post_commit_deferred_hidden_callback_count(), 0);
        assert_eq!(diagnostics.mutation_record_count(), 1);
        assert_eq!(diagnostics.mutation_apply_record_count(), 1);
        assert_eq!(diagnostics.host_root_placement_apply_count(), 1);
        assert!(diagnostics.recorded_host_output_mutation_metadata());
        assert!(diagnostics.commit_handoff_state_consumed());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_private_host_mutation_execution_opt_in_applies_host_work_after_commit() {
        let mut fixture = sync_flush_host_mutation_fixture("sync flush host mutation");

        assert_eq!(fixture.committed.root(), fixture.root_id);
        assert_eq!(fixture.committed.render_lanes(), Lanes::SYNC);
        assert!(
            fixture
                .committed
                .accepted_finished_work_handoff_for_canary()
        );
        assert!(fixture.diagnostics.accepted_finished_work_handoff());
        assert_eq!(fixture.diagnostics.mutation_record_count(), 1);
        assert_eq!(fixture.diagnostics.mutation_apply_record_count(), 1);
        assert_eq!(fixture.diagnostics.host_root_placement_apply_count(), 1);
        assert_eq!(
            fixture.host_work.work_in_progress(),
            fixture.committed.commit().finished_work()
        );
        assert_eq!(fixture.host.operations(), fixture.operations_before_opt_in);

        let request = sync_flush_host_mutation_execution_request_for_canary(
            &fixture.committed,
            fixture.diagnostics,
        )
        .unwrap();

        assert_eq!(request.root(), fixture.root_id);
        assert_eq!(request.order(), fixture.committed.order());
        assert_eq!(request.render_lanes(), Lanes::SYNC);
        assert_eq!(request.finished_lanes(), Lanes::SYNC);
        assert_eq!(request.mutation_record_count(), 1);
        assert_eq!(request.mutation_apply_record_count(), 1);
        assert_eq!(request.host_root_placement_apply_count(), 1);
        assert!(request.private_opt_in_host_mutation_execution_requested());
        assert!(request.public_renderer_mutation_blocked());
        assert!(!request.public_flush_sync_compatibility_claimed());

        let execution = execute_sync_flush_host_mutations_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.committed,
            fixture.diagnostics,
            request,
            &mut fixture.host_work,
        )
        .unwrap();

        assert_eq!(execution.request(), request);
        assert_eq!(execution.root(), fixture.root_id);
        assert_eq!(execution.order(), fixture.committed.order());
        assert_eq!(
            execution.finished_work(),
            fixture.committed.commit().finished_work()
        );
        assert_eq!(execution.mutation_apply_record_count(), 1);
        assert_eq!(execution.applied_host_call_count(), 1);
        assert_eq!(execution.private_host_store_update_count(), 0);
        assert_eq!(execution.recorded_only_count(), 0);
        assert!(execution.private_opt_in_host_mutation_execution_requested());
        assert!(execution.private_test_host_mutation_executed());
        assert!(execution.public_renderer_mutation_blocked());
        assert!(!execution.public_flush_sync_compatibility_claimed());
        assert!(!execution.react_dom_compatibility_claimed());
        assert!(!execution.test_renderer_compatibility_claimed());

        let mut expected_operations = fixture.operations_before_opt_in.clone();
        expected_operations.push("append_child_to_container");
        assert_eq!(fixture.host.operations(), expected_operations);
        assert_eq!(
            fixture.store.root(fixture.root_id).unwrap().current(),
            fixture.committed.commit().current()
        );
    }

    #[test]
    fn sync_flush_private_host_mutation_execution_applies_text_update_after_commit() {
        let mut fixture = sync_flush_text_host_mutation_fixture("sync flush text before");
        let initial_execution = execute_fixture_sync_flush_host_mutations(&mut fixture);
        assert_eq!(initial_execution.applied_host_call_count(), 1);
        assert_eq!(initial_execution.deletion_cleanup_apply_count(), 0);

        let update_element = fixture.source.insert_text("sync flush text after");
        schedule_sync_update(&mut fixture.store, fixture.root_id, update_element);
        let rendered =
            flush_sync_work_on_all_roots(&mut fixture.store, &ExecutionContextState::new())
                .unwrap();
        let rendered_record = rendered.records()[0];
        update_test_host_work_root_text_for_canary(
            &mut fixture.store,
            &mut fixture.host_work,
            rendered_record.render_phase(),
            text_from_root(&fixture.source, update_element),
        )
        .unwrap();
        let operations_before_update_opt_in = fixture.host.operations();

        let (committed, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut fixture.store,
                rendered_record,
            )
            .unwrap();

        let apply_records = committed.commit().mutation_apply_log().records();
        assert_eq!(apply_records.len(), 1);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        );
        assert_eq!(diagnostics.mutation_record_count(), 1);
        assert_eq!(diagnostics.mutation_apply_record_count(), 1);
        assert_eq!(diagnostics.host_root_placement_apply_count(), 0);
        assert_eq!(fixture.host.operations(), operations_before_update_opt_in);

        let request =
            sync_flush_host_mutation_execution_request_for_canary(&committed, diagnostics).unwrap();
        let execution = execute_sync_flush_host_mutations_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &committed,
            diagnostics,
            request,
            &mut fixture.host_work,
        )
        .unwrap();

        assert_eq!(execution.request(), request);
        assert_eq!(execution.root(), fixture.root_id);
        assert_eq!(execution.mutation_apply_record_count(), 1);
        assert_eq!(execution.applied_host_call_count(), 1);
        assert_eq!(execution.private_host_store_update_count(), 0);
        assert_eq!(execution.recorded_only_count(), 0);
        assert_eq!(execution.deletion_cleanup_apply_count(), 0);
        assert!(execution.private_test_host_mutation_executed());
        assert!(execution.public_renderer_mutation_blocked());
        assert!(!execution.public_flush_sync_compatibility_claimed());

        let mut expected_operations = operations_before_update_opt_in;
        expected_operations.push("commit_text_update");
        assert_eq!(fixture.host.operations(), expected_operations);

        let operations_after_execution = fixture.host.operations();
        let replay_error = execute_sync_flush_host_mutations_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &committed,
            diagnostics,
            request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            replay_error,
            SyncFlushHostMutationExecutionErrorForCanary::ReplayedHostMutationExecution {
                root,
                order,
                finished_work,
            } if root == fixture.root_id
                && order == committed.order()
                && finished_work == committed.commit().finished_work()
        ));
        assert_eq!(fixture.host.operations(), operations_after_execution);
    }

    #[test]
    fn sync_flush_private_host_mutation_execution_applies_component_update_after_commit() {
        let mut fixture = sync_flush_host_mutation_fixture("sync flush component before");
        let initial_execution = execute_fixture_sync_flush_host_mutations(&mut fixture);
        assert_eq!(initial_execution.applied_host_call_count(), 1);
        assert_eq!(initial_execution.deletion_cleanup_apply_count(), 0);

        let update_element = fixture
            .source
            .insert_host_element_with_text("section", "sync flush component after");
        schedule_sync_update(&mut fixture.store, fixture.root_id, update_element);
        let rendered =
            flush_sync_work_on_all_roots(&mut fixture.store, &ExecutionContextState::new())
                .unwrap();
        let rendered_record = rendered.records()[0];
        update_test_host_work_root_component_for_canary(
            &mut fixture.store,
            &mut fixture.host_work,
            rendered_record.render_phase(),
            element_from_root(&fixture.source, update_element),
        )
        .unwrap();
        let operations_before_update_opt_in = fixture.host.operations();

        let (committed, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut fixture.store,
                rendered_record,
            )
            .unwrap();

        let apply_records = committed.commit().mutation_apply_log().records();
        assert_eq!(apply_records.len(), 1);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        );
        assert_eq!(diagnostics.mutation_record_count(), 1);
        assert_eq!(diagnostics.mutation_apply_record_count(), 1);
        assert_eq!(diagnostics.host_root_placement_apply_count(), 0);
        assert_eq!(fixture.host.operations(), operations_before_update_opt_in);

        let request =
            sync_flush_host_mutation_execution_request_for_canary(&committed, diagnostics).unwrap();
        let execution = execute_sync_flush_host_mutations_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &committed,
            diagnostics,
            request,
            &mut fixture.host_work,
        )
        .unwrap();

        assert_eq!(execution.request(), request);
        assert_eq!(execution.root(), fixture.root_id);
        assert_eq!(execution.mutation_apply_record_count(), 1);
        assert_eq!(execution.applied_host_call_count(), 1);
        assert_eq!(execution.private_host_store_update_count(), 0);
        assert_eq!(execution.recorded_only_count(), 0);
        assert_eq!(execution.deletion_cleanup_apply_count(), 0);
        assert!(execution.private_test_host_mutation_executed());
        assert!(execution.public_renderer_mutation_blocked());
        assert!(!execution.public_flush_sync_compatibility_claimed());

        let mut expected_operations = operations_before_update_opt_in;
        expected_operations.push("commit_update");
        assert_eq!(fixture.host.operations(), expected_operations);

        let operations_after_execution = fixture.host.operations();
        let replay_error = execute_sync_flush_host_mutations_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &committed,
            diagnostics,
            request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            replay_error,
            SyncFlushHostMutationExecutionErrorForCanary::ReplayedHostMutationExecution {
                root,
                order,
                finished_work,
            } if root == fixture.root_id
                && order == committed.order()
                && finished_work == committed.commit().finished_work()
        ));
        assert_eq!(fixture.host.operations(), operations_after_execution);
    }

    #[test]
    fn sync_flush_private_host_mutation_execution_applies_root_unmount_after_commit() {
        let mut fixture = sync_flush_host_mutation_fixture("sync flush unmount");
        let initial_execution = execute_fixture_sync_flush_host_mutations(&mut fixture);
        assert_eq!(initial_execution.applied_host_call_count(), 1);
        assert_eq!(initial_execution.deletion_cleanup_apply_count(), 0);

        schedule_sync_update(&mut fixture.store, fixture.root_id, RootElementHandle::NONE);
        let rendered =
            flush_sync_work_on_all_roots(&mut fixture.store, &ExecutionContextState::new())
                .unwrap();
        let rendered_record = rendered.records()[0];
        delete_test_host_work_root_child_for_canary(
            &mut fixture.store,
            &mut fixture.host_work,
            rendered_record.render_phase(),
        )
        .unwrap();
        let operations_before_unmount_opt_in = fixture.host.operations();

        let (committed, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut fixture.store,
                rendered_record,
            )
            .unwrap();

        let apply_records = committed.commit().mutation_apply_log().records();
        assert_eq!(apply_records.len(), 1);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        );
        assert_eq!(diagnostics.mutation_record_count(), 0);
        assert_eq!(diagnostics.mutation_apply_record_count(), 1);
        assert_eq!(diagnostics.host_root_placement_apply_count(), 0);
        assert_eq!(fixture.host.operations(), operations_before_unmount_opt_in);

        let request =
            sync_flush_host_mutation_execution_request_for_canary(&committed, diagnostics).unwrap();
        let execution = execute_sync_flush_host_mutations_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &committed,
            diagnostics,
            request,
            &mut fixture.host_work,
        )
        .unwrap();

        assert_eq!(execution.request(), request);
        assert_eq!(execution.root(), fixture.root_id);
        assert_eq!(execution.mutation_apply_record_count(), 1);
        assert_eq!(execution.applied_host_call_count(), 1);
        assert_eq!(execution.private_host_store_update_count(), 0);
        assert_eq!(execution.recorded_only_count(), 0);
        assert_eq!(execution.deletion_cleanup_apply_count(), 2);
        assert!(execution.private_test_host_mutation_executed());
        assert!(execution.public_renderer_mutation_blocked());
        assert!(!execution.public_flush_sync_compatibility_claimed());
        assert!(!execution.react_dom_compatibility_claimed());
        assert!(!execution.test_renderer_compatibility_claimed());

        let mut expected_operations = operations_before_unmount_opt_in;
        expected_operations.push("remove_child_from_container");
        expected_operations.push("detach_deleted_instance");
        assert_eq!(fixture.host.operations(), expected_operations);
    }

    #[test]
    fn sync_flush_private_host_mutation_execution_rejects_stale_finished_work_evidence() {
        let mut fixture = sync_flush_host_mutation_fixture("stale sync flush host mutation");
        let mut stale_record = fixture.committed.clone();
        stale_record.finished_work_handoff_identity = None;

        let error = sync_flush_host_mutation_execution_request_for_canary(
            &stale_record,
            fixture.diagnostics,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            SyncFlushHostMutationExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root,
                order,
            } if root == fixture.root_id && order == fixture.committed.order()
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_opt_in);

        let request = sync_flush_host_mutation_execution_request_for_canary(
            &fixture.committed,
            fixture.diagnostics,
        )
        .unwrap();
        let mut stale_execution_record = fixture.committed.clone();
        stale_execution_record.finished_work_handoff_identity = None;

        let error = execute_sync_flush_host_mutations_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &stale_execution_record,
            fixture.diagnostics,
            request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            SyncFlushHostMutationExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root,
                order,
            } if root == fixture.root_id && order == fixture.committed.order()
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_opt_in);

        let previous_current = fixture.committed.commit().previous_current();
        fixture
            .store
            .root_mut(fixture.root_id)
            .unwrap()
            .set_current(previous_current);

        let error = execute_sync_flush_host_mutations_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.committed,
            fixture.diagnostics,
            request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            SyncFlushHostMutationExecutionErrorForCanary::HostWork(
                HostWorkError::CommitCurrentMismatch {
                    root,
                    expected,
                    actual,
                }
            ) if root == fixture.root_id
                && expected == fixture.committed.commit().current()
                && actual == previous_current
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_opt_in);
    }

    #[test]
    fn sync_flush_private_host_mutation_execution_rejects_root_and_lane_tampering() {
        let mut fixture = sync_flush_host_mutation_fixture("tampered sync flush host mutation");
        let foreign_root = fixture
            .store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let mut foreign_root_record = fixture.committed.clone();
        foreign_root_record.root = foreign_root;

        let error = sync_flush_host_mutation_execution_request_for_canary(
            &foreign_root_record,
            fixture.diagnostics,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root,
                actual_root,
            } if expected_root == foreign_root && actual_root == fixture.root_id
        ));

        let mut missing_lanes_record = fixture.committed.clone();
        missing_lanes_record.render_lanes = Lanes::NO;

        let error = sync_flush_host_mutation_execution_request_for_canary(
            &missing_lanes_record,
            fixture.diagnostics,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedSyncFlushLanes {
                root,
                expected_render_lanes,
                actual_render_lanes,
                expected_finished_lanes,
                actual_finished_lanes,
            } if root == fixture.root_id
                && expected_render_lanes == Lanes::NO
                && actual_render_lanes == Lanes::SYNC
                && expected_finished_lanes == Lanes::SYNC
                && actual_finished_lanes == Lanes::SYNC
        ));

        let mut caller_built_lane_diagnostics = fixture.diagnostics;
        caller_built_lane_diagnostics.remaining_lanes = Lanes::DEFAULT;
        caller_built_lane_diagnostics.commit_pending_lanes = Lanes::DEFAULT;
        caller_built_lane_diagnostics.root_pending_lanes_after_commit = Lanes::DEFAULT;

        let error = sync_flush_host_mutation_execution_request_for_canary(
            &fixture.committed,
            caller_built_lane_diagnostics,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedSyncFlushLanes {
                root,
                expected_render_lanes,
                actual_render_lanes,
                expected_finished_lanes,
                actual_finished_lanes,
            } if root == fixture.root_id
                && expected_render_lanes == Lanes::SYNC
                && actual_render_lanes == Lanes::SYNC
                && expected_finished_lanes == Lanes::SYNC
                && actual_finished_lanes == Lanes::SYNC
        ));

        let request = sync_flush_host_mutation_execution_request_for_canary(
            &fixture.committed,
            fixture.diagnostics,
        )
        .unwrap();
        let mut foreign_source = TestHostTree::new();
        let foreign_element =
            foreign_source.insert_host_element_with_text("article", "foreign host work");
        schedule_sync_update(&mut fixture.store, foreign_root, foreign_element);
        let foreign_rendered =
            flush_sync_work_on_all_roots(&mut fixture.store, &ExecutionContextState::new())
                .unwrap();
        let mut foreign_host = RecordingHost::default();
        let mut foreign_host_work = mount_test_host_work(
            &mut fixture.store,
            &mut foreign_host,
            foreign_rendered.records()[0].render_phase(),
            &foreign_source,
        )
        .unwrap();
        let error = execute_sync_flush_host_mutations_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.committed,
            fixture.diagnostics,
            request,
            &mut foreign_host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root,
                actual_root,
            } if expected_root == fixture.root_id && actual_root == foreign_root
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_opt_in);
    }

    #[test]
    fn sync_flush_private_host_mutation_execution_requires_host_mutation_metadata() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(806));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let (committed, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered.records()[0],
            )
            .unwrap();

        assert!(committed.accepted_finished_work_handoff_for_canary());
        assert!(diagnostics.accepted_finished_work_handoff());
        assert_eq!(diagnostics.mutation_record_count(), 0);
        assert_eq!(diagnostics.mutation_apply_record_count(), 0);

        let error = sync_flush_host_mutation_execution_request_for_canary(&committed, diagnostics)
            .unwrap_err();

        assert!(matches!(
            error,
            SyncFlushHostMutationExecutionErrorForCanary::MissingHostMutationMetadata {
                root,
                finished_work,
            } if root == root_id && finished_work == committed.commit().finished_work()
        ));
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_act_private_execution_drains_pending_continuation_after_canary() {
        let (mut store, root_id, host) = root_store();
        let sync_element = RootElementHandle::from_raw(820);
        let default_element = RootElementHandle::from_raw(821);
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, root_id, sync_element);
        let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
        ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        let prepared = prepare_test_renderer_host_output_canary_fibers(
            &mut store,
            render_phase,
            TestRendererHostOutputCanaryFixture::new(822, 823, 824),
        )
        .unwrap();
        let completed =
            finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 825, 826).unwrap();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let (mut committed, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered_record,
            )
            .unwrap();

        let continuation = committed.act_continuation.unwrap();
        assert_eq!(
            continuation.status(),
            SchedulerActContinuationStatus::PendingContinuation
        );
        assert_eq!(continuation.continuation_lanes(), Lanes::DEFAULT);

        let private_execution =
            committed.drain_accepted_act_continuations_after_host_output_canary(diagnostics);

        assert_eq!(private_execution.root(), root_id);
        assert_eq!(private_execution.order(), committed.order());
        assert!(private_execution.host_output_canary_committed());
        assert!(!private_execution.blocked_by_pending_post_passive_gate());
        assert_eq!(private_execution.drained_count(), 1);
        assert!(private_execution.did_drain_accepted_internal_act_continuations());
        assert!(!private_execution.drains_public_react_act_queue());
        assert!(!private_execution.public_act_compatibility_claimed());
        assert!(!private_execution.public_flush_sync_compatibility_claimed());
        assert!(!private_execution.public_scheduler_timing_compatibility_claimed());
        assert!(!private_execution.executes_queued_work());
        assert!(!private_execution.executes_effects());
        let drained = private_execution.drained_act_continuations()[0];
        assert_eq!(drained.root(), root_id);
        assert_eq!(drained.sync_flush_order(), committed.order());
        assert_eq!(drained.flushed_lanes(), Lanes::SYNC);
        assert_eq!(drained.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(drained.continuation_lanes(), Lanes::DEFAULT);
        assert_eq!(drained.act_scope_depth(), 1);
        assert!(!drained.nested_act_scope());
        assert!(drained.host_output_canary_committed());
        assert_eq!(
            drained.source_status(),
            SchedulerActContinuationStatus::PendingContinuation
        );
        assert!(drained.is_accepted_internal_act_continuation());
        assert!(!drained.public_flush_sync_compatibility_claimed());
        assert_eq!(committed.act_continuation, None);
        assert_eq!(committed.act_post_passive_continuation_gate, None);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            completed.host_root()
        );
        assert_eq!(current_host_root_element(&store, root_id), sync_element);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_scheduler_bridge_executes_drained_act_continuation_after_canary() {
        let (mut store, root_id, host) = root_store();
        let sync_element = RootElementHandle::from_raw(827);
        let default_element = RootElementHandle::from_raw(828);
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, root_id, sync_element);
        let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
        ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        let prepared = prepare_test_renderer_host_output_canary_fibers(
            &mut store,
            render_phase,
            TestRendererHostOutputCanaryFixture::new(829, 840, 841),
        )
        .unwrap();
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 842, 843).unwrap();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let (mut committed, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered_record,
            )
            .unwrap();
        let private_execution =
            committed.drain_accepted_act_continuations_after_host_output_canary(diagnostics);

        assert_eq!(private_execution.drained_count(), 1);
        assert!(!private_execution.executes_queued_work());
        assert_eq!(current_host_root_element(&store, root_id), sync_element);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::DEFAULT
        );

        let continuation_execution = private_execution
            .execute_accepted_scheduler_bridge_act_continuations(&mut store)
            .unwrap();

        assert_eq!(continuation_execution.records().len(), 1);
        assert_eq!(continuation_execution.executed_count(), 1);
        assert_eq!(continuation_execution.rejected_count(), 0);
        assert_eq!(continuation_execution.blocked_count(), 0);
        assert!(continuation_execution.did_execute_accepted_internal_act_continuations());
        assert!(continuation_execution.records_preserve_sync_flush_order());
        assert!(!continuation_execution.drains_public_react_act_queue());
        assert!(!continuation_execution.public_act_compatibility_claimed());
        assert!(!continuation_execution.public_flush_sync_compatibility_claimed());
        assert!(!continuation_execution.public_scheduler_timing_compatibility_claimed());
        assert!(!continuation_execution.executes_effects());
        let record = &continuation_execution.records()[0];
        assert_eq!(record.execution_order(), 0);
        assert_eq!(
            record.status(),
            SchedulerBridgeActContinuationExecutionStatus::RenderedAndCommitted
        );
        assert_eq!(record.root(), root_id);
        assert_eq!(record.requested_lanes(), Lanes::DEFAULT);
        assert_eq!(record.selected_lanes(), Lanes::DEFAULT);
        assert_eq!(record.pending_lanes_before_execution(), Lanes::DEFAULT);
        assert_eq!(record.pending_lanes_after_execution(), Lanes::NO);
        assert!(record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary());
        assert!(record.routed_through_root_scheduler_and_commit_evidence_for_canary());
        assert!(record.accepted_root_scheduler_execution_evidence_for_canary());
        assert!(record.accepted_root_commit_execution_evidence_for_canary());
        let handoff = record.root_commit_handoff_for_canary().unwrap();
        assert!(handoff.proves_private_root_finished_work_commit_metadata_handoff());
        assert_eq!(handoff.pending().root(), root_id);
        assert_eq!(
            handoff.pending().root_finished_work(),
            Some(handoff.pending().finished_work())
        );
        assert_eq!(handoff.pending().render_lanes(), Lanes::DEFAULT);
        assert!(handoff.execution_request().records_root_finished_work());
        assert_eq!(
            record.render_phase().unwrap().resulting_element(),
            default_element
        );
        assert_eq!(record.commit().unwrap().finished_lanes(), Lanes::DEFAULT);
        assert_eq!(record.commit().unwrap().remaining_lanes(), Lanes::NO);
        assert_eq!(current_host_root_element(&store, root_id), default_element);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
        assert!(!store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_act_queue_helper_routes_drained_continuation_and_consumes_root_schedule() {
        let (mut store, root_id, host) = root_store();
        let sync_element = RootElementHandle::from_raw(844);
        let default_element = RootElementHandle::from_raw(845);
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, root_id, sync_element);
        let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
        ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        let prepared = prepare_test_renderer_host_output_canary_fibers(
            &mut store,
            render_phase,
            TestRendererHostOutputCanaryFixture::new(846, 847, 848),
        )
        .unwrap();
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 849, 850).unwrap();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let (mut committed, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered_record,
            )
            .unwrap();
        let private_execution =
            committed.drain_accepted_act_continuations_after_host_output_canary(diagnostics);

        assert_eq!(private_execution.drained_count(), 1);
        assert_eq!(current_host_root_element(&store, root_id), sync_element);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::DEFAULT
        );

        let queue_execution = private_execution
            .execute_accepted_scheduler_bridge_act_queue_for_canary(&mut store, 1_000_000)
            .unwrap();

        assert_eq!(queue_execution.request_records().len(), 1);
        assert_eq!(queue_execution.consumed_request_count(), 1);
        assert_eq!(queue_execution.rejected_request_count(), 0);
        assert_eq!(queue_execution.executed_render_callback_count(), 0);
        assert!(queue_execution.did_consume_queued_act_requests());
        assert!(queue_execution.did_execute_accepted_internal_act_continuations());
        assert!(queue_execution.records_preserve_act_queue_order());
        assert!(!queue_execution.did_execute_accepted_render_callbacks());
        assert!(!queue_execution.routed_private_act_queue_requests_and_continuations_for_canary());
        assert!(!queue_execution.drains_public_react_act_queue());
        assert!(!queue_execution.public_act_compatibility_claimed());
        assert!(!queue_execution.public_root_compatibility_claimed());
        assert!(!queue_execution.public_flush_sync_compatibility_claimed());
        assert!(!queue_execution.public_scheduler_timing_compatibility_claimed());
        assert!(!queue_execution.executes_effects());

        let root_schedule = &queue_execution.request_records()[0];
        assert_eq!(root_schedule.queue_order(), 0);
        assert_eq!(
            root_schedule.status(),
            SchedulerBridgeActQueueRequestExecutionStatus::RootScheduleProcessed
        );
        assert!(root_schedule.did_process_root_schedule());
        assert_eq!(root_schedule.root_schedule().unwrap().records().len(), 1);
        assert_eq!(
            root_schedule.root_schedule().unwrap().records()[0].outcome(),
            RootTaskScheduleOutcome::NoWork
        );
        assert!(root_schedule.render_callback().is_none());
        assert!(!root_schedule.drains_public_react_act_queue());
        assert!(!root_schedule.public_act_compatibility_claimed());
        assert!(!root_schedule.public_root_compatibility_claimed());
        assert!(!root_schedule.public_scheduler_timing_compatibility_claimed());
        assert!(!root_schedule.executes_effects());

        let continuation_execution = queue_execution.continuation_execution().unwrap();
        assert_eq!(continuation_execution.records().len(), 1);
        assert_eq!(continuation_execution.executed_count(), 1);
        assert_eq!(continuation_execution.rejected_count(), 0);
        assert_eq!(continuation_execution.blocked_count(), 0);
        assert!(continuation_execution.did_execute_accepted_internal_act_continuations());
        assert!(continuation_execution.records_preserve_sync_flush_order());
        let continuation = &continuation_execution.records()[0];
        assert_eq!(
            continuation.status(),
            SchedulerBridgeActContinuationExecutionStatus::RenderedAndCommitted
        );
        assert!(continuation.routed_through_root_scheduler_and_commit_evidence_for_canary());
        assert_eq!(
            continuation.render_phase().unwrap().resulting_element(),
            default_element
        );
        assert_eq!(current_host_root_element(&store, root_id), default_element);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_consumed_request_count(),
            act_queue_request_count
        );
        assert_eq!(
            store.scheduler_bridge().pending_act_queue_request_count(),
            0
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_nested_act_root_continuations_preserve_callback_order_and_lanes() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let first = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let first_sync_element = RootElementHandle::from_raw(850);
        let first_default_element = RootElementHandle::from_raw(851);
        let first_transition_element = RootElementHandle::from_raw(852);
        let second_sync_element = RootElementHandle::from_raw(853);
        let second_default_element = RootElementHandle::from_raw(854);
        let first_sync_callback = RootUpdateCallbackHandle::from_raw(855);
        let first_default_callback = RootUpdateCallbackHandle::from_raw(856);
        let second_sync_callback = RootUpdateCallbackHandle::from_raw(857);
        let second_default_callback = RootUpdateCallbackHandle::from_raw(858);

        let enter_outer = store.scheduler_bridge_mut().enter_act_scope();
        let enter_nested = store.scheduler_bridge_mut().enter_act_scope();
        let first_sync = update_container_sync(
            &mut store,
            first,
            first_sync_element,
            Some(first_sync_callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, first_sync.schedule()).unwrap();
        let first_default = update_container(
            &mut store,
            first,
            first_default_element,
            Some(first_default_callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, first_default.schedule()).unwrap();
        let first_transition = update_container_transition_for_canary(
            &mut store,
            first,
            Lane::TRANSITION_1,
            first_transition_element,
            None,
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, first_transition.schedule()).unwrap();
        let second_sync = update_container_sync(
            &mut store,
            second,
            second_sync_element,
            Some(second_sync_callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, second_sync.schedule()).unwrap();
        let second_default = update_container(
            &mut store,
            second,
            second_default_element,
            Some(second_default_callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, second_default.schedule()).unwrap();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        assert_eq!(rendered.records().len(), 2);
        assert_eq!(rendered.records()[0].root(), first);
        assert_eq!(rendered.records()[1].root(), second);
        assert_eq!(rendered.records()[0].order(), 0);
        assert_eq!(rendered.records()[1].order(), 1);

        let first_render_phase = rendered.records()[0].render_phase();
        let second_render_phase = rendered.records()[1].render_phase();
        let first_prepared = prepare_test_renderer_host_output_canary_fibers(
            &mut store,
            first_render_phase,
            TestRendererHostOutputCanaryFixture::new(859, 860, 861),
        )
        .unwrap();
        let first_completed =
            finish_test_renderer_host_output_canary_fibers(&mut store, first_prepared, 862, 863)
                .unwrap();
        let second_prepared = prepare_test_renderer_host_output_canary_fibers(
            &mut store,
            second_render_phase,
            TestRendererHostOutputCanaryFixture::new(864, 865, 866),
        )
        .unwrap();
        let second_completed =
            finish_test_renderer_host_output_canary_fibers(&mut store, second_prepared, 867, 868)
                .unwrap();

        let (mut first_committed, first_diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered.records()[0],
            )
            .unwrap();
        let (mut second_committed, second_diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered.records()[1],
            )
            .unwrap();

        assert_eq!(first_committed.order(), 0);
        assert_eq!(second_committed.order(), 1);
        assert_eq!(
            callback_handles(first_committed.root_update_callbacks().visible()),
            vec![first_sync_callback]
        );
        assert_eq!(
            callback_handles(second_committed.root_update_callbacks().visible()),
            vec![second_sync_callback]
        );
        assert_eq!(
            first_committed
                .act_continuation
                .as_ref()
                .unwrap()
                .act_scope_depth(),
            2
        );
        assert!(
            first_committed
                .act_continuation
                .as_ref()
                .unwrap()
                .nested_act_scope()
        );
        assert!(
            second_committed
                .act_continuation
                .as_ref()
                .unwrap()
                .nested_act_scope()
        );

        let first_private = first_committed
            .drain_accepted_act_continuations_after_host_output_canary(first_diagnostics);
        let second_private = second_committed
            .drain_accepted_act_continuations_after_host_output_canary(second_diagnostics);

        assert!(first_private.did_drain_accepted_internal_act_continuations());
        assert!(second_private.did_drain_accepted_internal_act_continuations());
        assert!(!first_private.public_act_compatibility_claimed());
        assert!(!first_private.public_flush_sync_compatibility_claimed());
        assert!(!second_private.public_act_compatibility_claimed());
        assert!(!second_private.public_flush_sync_compatibility_claimed());
        let drained = [
            first_private.drained_act_continuations()[0],
            second_private.drained_act_continuations()[0],
        ];

        let continuation_execution =
            execute_scheduler_bridge_act_continuations(&mut store, &drained).unwrap();

        assert_eq!(continuation_execution.records().len(), 2);
        assert_eq!(continuation_execution.executed_count(), 2);
        assert_eq!(continuation_execution.rejected_count(), 0);
        assert_eq!(continuation_execution.blocked_count(), 0);
        assert!(continuation_execution.did_execute_accepted_internal_act_continuations());
        assert!(continuation_execution.records_preserve_sync_flush_order());
        assert!(
            continuation_execution
                .preserves_nested_act_root_continuation_order_and_lanes_for_canary()
        );
        assert!(!continuation_execution.drains_public_react_act_queue());
        assert!(!continuation_execution.public_act_compatibility_claimed());
        assert!(!continuation_execution.public_flush_sync_compatibility_claimed());
        assert!(!continuation_execution.public_scheduler_timing_compatibility_claimed());
        assert!(!continuation_execution.executes_effects());

        let first_record = &continuation_execution.records()[0];
        assert_eq!(first_record.execution_order(), 0);
        assert_eq!(first_record.root(), first);
        assert_eq!(first_record.continuation().sync_flush_order(), 0);
        assert!(first_record.continuation().nested_act_scope());
        assert_eq!(first_record.requested_lanes(), Lanes::DEFAULT);
        assert_eq!(first_record.selected_lanes(), Lanes::DEFAULT);
        assert_eq!(
            first_record.pending_lanes_before_execution(),
            Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1)
        );
        assert_eq!(
            first_record.pending_lanes_after_execution(),
            Lanes::from(Lane::TRANSITION_1)
        );
        assert!(
            first_record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary()
        );
        assert_eq!(
            callback_handles(
                first_record
                    .commit()
                    .unwrap()
                    .root_update_callbacks()
                    .visible()
            ),
            vec![first_default_callback]
        );
        assert_eq!(
            current_host_root_element(&store, first),
            first_default_element
        );

        let second_record = &continuation_execution.records()[1];
        assert_eq!(second_record.execution_order(), 1);
        assert_eq!(second_record.root(), second);
        assert_eq!(second_record.continuation().sync_flush_order(), 1);
        assert!(second_record.continuation().nested_act_scope());
        assert_eq!(second_record.requested_lanes(), Lanes::DEFAULT);
        assert_eq!(second_record.selected_lanes(), Lanes::DEFAULT);
        assert_eq!(
            second_record.pending_lanes_before_execution(),
            Lanes::DEFAULT
        );
        assert_eq!(second_record.pending_lanes_after_execution(), Lanes::NO);
        assert!(
            second_record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary()
        );
        assert_eq!(
            callback_handles(
                second_record
                    .commit()
                    .unwrap()
                    .root_update_callbacks()
                    .visible()
            ),
            vec![second_default_callback]
        );
        assert_eq!(
            current_host_root_element(&store, second),
            second_default_element
        );

        assert_eq!(
            store.root(first).unwrap().lanes().pending_lanes(),
            Lanes::from(Lane::TRANSITION_1)
        );
        assert_eq!(
            store.root(second).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
        assert_eq!(
            first_completed.host_root(),
            first_committed.commit().current()
        );
        assert_eq!(
            second_completed.host_root(),
            second_committed.commit().current()
        );
        assert_eq!(
            store.scheduler_bridge().act_scope_boundary_records(),
            &[enter_outer, enter_nested]
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_act_private_execution_requires_canary_and_passive_clearance() {
        let (mut store, root_id, host) = root_store();
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(830));
        let default_update =
            update_container(&mut store, root_id, RootElementHandle::from_raw(831), None).unwrap();
        ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        let mut committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();
        let continuation_before = committed.act_continuation;
        let diagnostics = committed
            .host_output_commit_diagnostics_for_canary(&store)
            .unwrap();

        let without_canary =
            committed.drain_accepted_act_continuations_after_host_output_canary(diagnostics);

        assert!(!without_canary.host_output_canary_committed());
        assert!(!without_canary.blocked_by_pending_post_passive_gate());
        assert_eq!(without_canary.drained_count(), 0);
        assert!(!without_canary.did_drain_accepted_internal_act_continuations());
        assert_eq!(committed.act_continuation, continuation_before);

        let mut store = FiberRootStore::<RecordingHost>::new();
        let host_with_passive = RecordingHost::default();
        let passive_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, passive_root, RootElementHandle::from_raw(832));
        let passive_default = update_container(
            &mut store,
            passive_root,
            RootElementHandle::from_raw(833),
            None,
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, passive_default.schedule()).unwrap();
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        let finished_work = render_phase.finished_work();
        {
            let scheduling = store.root_mut(passive_root).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(passive_root, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::SYNC)
                .unwrap();
        }
        let prepared = prepare_test_renderer_host_output_canary_fibers(
            &mut store,
            render_phase,
            TestRendererHostOutputCanaryFixture::new(834, 835, 836),
        )
        .unwrap();
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 837, 838).unwrap();

        let (mut committed_with_passive, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered_record,
            )
            .unwrap();
        let continuation_before = committed_with_passive.act_continuation;

        let blocked = committed_with_passive
            .drain_accepted_act_continuations_after_host_output_canary(diagnostics);

        assert!(blocked.host_output_canary_committed());
        assert!(blocked.blocked_by_pending_post_passive_gate());
        assert_eq!(blocked.drained_count(), 0);
        assert_eq!(committed_with_passive.act_continuation, continuation_before);
        assert!(
            committed_with_passive
                .act_post_passive_continuation_gate
                .is_some()
        );
        assert!(
            store
                .root(passive_root)
                .unwrap()
                .scheduling()
                .pending_passive()
                .has_commit_handoff()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(host_with_passive.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_handoff_records_no_act_continuation_when_act_queue_inactive() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(68));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();

        assert_eq!(committed.remaining_lanes(), Lanes::NO);
        assert_eq!(committed.act_continuation, None);
        assert_eq!(committed.act_post_passive_continuation_gate, None);
        assert!(
            store
                .scheduler_bridge()
                .act_continuation_records()
                .is_empty()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_handoff_records_nested_act_continuation_after_commit() {
        let (mut store, root_id, host) = root_store();
        let sync_element = RootElementHandle::from_raw(69);
        let default_element = RootElementHandle::from_raw(70);
        let enter_outer = store.scheduler_bridge_mut().enter_act_scope();
        let enter_nested = store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, root_id, sync_element);
        let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
        ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();

        let continuation = committed.act_continuation.unwrap();
        assert_eq!(continuation.root(), root_id);
        assert_eq!(continuation.sync_flush_order(), committed.order());
        assert_eq!(continuation.flushed_lanes(), Lanes::SYNC);
        assert_eq!(continuation.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(continuation.continuation_lanes(), Lanes::DEFAULT);
        assert_eq!(continuation.act_scope_depth(), 2);
        assert!(continuation.nested_act_scope());
        assert_eq!(
            continuation.status(),
            SchedulerActContinuationStatus::PendingContinuation
        );
        assert_eq!(
            store.scheduler_bridge().act_continuation_records(),
            &[continuation]
        );
        assert_eq!(
            store.scheduler_bridge().act_scope_boundary_records(),
            &[enter_outer, enter_nested]
        );
        assert_eq!(current_host_root_element(&store, root_id), sync_element);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert!(store.scheduler_bridge().microtask_requests().is_empty());
    }

    #[test]
    fn sync_flush_handoff_records_post_passive_act_gate_without_flushing_effects() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(700));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let render_phase = rendered.records()[0].render_phase();
        let finished_work = render_phase.finished_work();
        store.scheduler_bridge_mut().enter_act_scope();
        let mount_order = {
            let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(root_id, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::SYNC)
                .unwrap()
        };

        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();

        let continuation = committed.act_continuation.unwrap();
        assert_eq!(
            continuation.status(),
            SchedulerActContinuationStatus::NoContinuation
        );
        let gate = committed.act_post_passive_continuation_gate.unwrap();
        assert_eq!(gate.root(), root_id);
        assert_eq!(gate.sync_flush_order(), committed.order());
        assert_eq!(gate.flushed_lanes(), Lanes::SYNC);
        assert_eq!(gate.remaining_lanes(), Lanes::NO);
        assert_eq!(gate.continuation_lanes(), Lanes::NO);
        assert_eq!(gate.pending_passive_finished_work(), finished_work);
        assert_eq!(gate.pending_passive_lanes(), Lanes::SYNC);
        assert_eq!(gate.pending_passive_unmount_count(), 0);
        assert_eq!(gate.pending_passive_mount_count(), 1);
        assert_eq!(gate.pending_passive_record_count(), 1);
        assert_eq!(gate.act_scope_depth(), 1);
        assert!(!gate.nested_act_scope());

        let handoff = committed.commit().pending_passive_handoff().unwrap();
        assert_eq!(handoff.pending_mount_count(), 1);
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();
        assert_eq!(pending_passive.finished_work(), Some(finished_work));
        assert!(pending_passive.has_commit_handoff());
        assert_eq!(pending_passive.passive_mounts().len(), 1);
        assert_eq!(pending_passive.passive_mounts()[0].order(), mount_order);
        assert_eq!(
            store.scheduler_bridge().act_continuation_records(),
            &[continuation]
        );
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_handoff_observes_post_passive_reentry_gate_without_running_effects() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let passive_root = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let continuation_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let continuation_current = store.root(continuation_root).unwrap().current();
        schedule_sync_update(&mut store, passive_root, RootElementHandle::from_raw(701));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let render_phase = rendered.records()[0].render_phase();
        let finished_work = render_phase.finished_work();
        {
            let scheduling = store.root_mut(passive_root).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(passive_root, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::SYNC)
                .unwrap();
        }
        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();
        schedule_sync_update(
            &mut store,
            continuation_root,
            RootElementHandle::from_raw(702),
        );
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let gate = committed
            .post_passive_continuation_execution_gate(&mut store, &ExecutionContextState::new())
            .unwrap()
            .unwrap();

        assert_eq!(gate.exit_status(), RootSyncFlushExitStatus::Completed);
        assert_eq!(gate.pending_passive_root(), passive_root);
        assert_eq!(gate.pending_passive_finished_work(), finished_work);
        assert_eq!(gate.pending_passive_lanes(), Lanes::SYNC);
        assert_eq!(gate.pending_passive_mount_count(), 1);
        assert_eq!(gate.continuation_roots().len(), 1);
        assert_eq!(gate.continuation_roots()[0].root(), continuation_root);
        assert_eq!(gate.continuation_roots()[0].lanes(), Lanes::SYNC);
        assert_eq!(committed.act_continuation, None);
        assert_eq!(committed.act_post_passive_continuation_gate, None);
        assert_eq!(
            store.root(continuation_root).unwrap().current(),
            continuation_current
        );
        assert_eq!(store.root(continuation_root).unwrap().finished_work(), None);
        assert!(
            store
                .root(passive_root)
                .unwrap()
                .scheduling()
                .pending_passive()
                .has_commit_handoff()
        );
        assert_eq!(
            store.scheduler_bridge().callback_requests().len(),
            callback_request_count
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_post_passive_continuation_executes_private_follow_up_sync_flush() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let passive_root = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let continuation_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let continuation_element = RootElementHandle::from_raw(704);
        schedule_sync_update(&mut store, passive_root, RootElementHandle::from_raw(703));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let render_phase = rendered.records()[0].render_phase();
        let finished_work = render_phase.finished_work();
        {
            let scheduling = store.root_mut(passive_root).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(passive_root, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::SYNC)
                .unwrap();
        }
        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();
        let handoff = committed.commit().pending_passive_handoff();
        store
            .root_mut(passive_root)
            .unwrap()
            .scheduling_mut()
            .clear_pending_passive();
        schedule_sync_update(&mut store, continuation_root, continuation_element);
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let continuation = flush_sync_post_passive_continuation_after_passive_effects(
            &mut store,
            &ExecutionContextState::new(),
            handoff,
        )
        .unwrap()
        .unwrap();

        assert!(continuation.did_request_follow_up_sync_flush());
        assert!(continuation.did_execute_follow_up_sync_flush());
        assert!(continuation.did_flush_follow_up_sync_work());
        assert_eq!(
            continuation.gate().exit_status(),
            RootSyncFlushExitStatus::Completed
        );
        assert_eq!(continuation.gate().pending_passive_root(), passive_root);
        assert_eq!(
            continuation.gate().pending_passive_finished_work(),
            finished_work
        );
        assert_eq!(continuation.gate().pending_passive_lanes(), Lanes::SYNC);
        assert_eq!(continuation.gate().pending_passive_mount_count(), 1);
        assert_eq!(continuation.gate().continuation_roots().len(), 1);
        assert_eq!(
            continuation.gate().continuation_roots()[0].root(),
            continuation_root
        );
        let result = continuation.sync_flush_result().unwrap();
        assert!(result.did_flush_work());
        assert_eq!(result.records().len(), 1);
        assert_eq!(result.records()[0].root(), continuation_root);
        assert_eq!(result.records()[0].render_lanes(), Lanes::SYNC);
        assert_eq!(
            current_host_root_element(&store, continuation_root),
            continuation_element
        );
        assert!(
            store
                .root(passive_root)
                .unwrap()
                .scheduling()
                .pending_passive()
                .is_empty()
        );
        assert_eq!(
            store.scheduler_bridge().callback_requests().len(),
            callback_request_count
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_post_passive_continuation_requires_passive_handoff() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(705));

        let continuation = flush_sync_post_passive_continuation_after_passive_effects(
            &mut store,
            &ExecutionContextState::new(),
            None,
        )
        .unwrap();

        assert_eq!(continuation, None);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert!(store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_handoff_records_active_act_boundary_without_pending_continuation() {
        let (mut store, root_id, host) = root_store();
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(71));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();

        let continuation = committed.act_continuation.unwrap();
        assert_eq!(continuation.root(), root_id);
        assert_eq!(continuation.flushed_lanes(), Lanes::SYNC);
        assert_eq!(continuation.remaining_lanes(), Lanes::NO);
        assert_eq!(continuation.continuation_lanes(), Lanes::NO);
        assert_eq!(continuation.act_scope_depth(), 1);
        assert!(!continuation.nested_act_scope());
        assert_eq!(
            continuation.status(),
            SchedulerActContinuationStatus::NoContinuation
        );
        assert_eq!(
            store.scheduler_bridge().act_continuation_records(),
            &[continuation]
        );
        assert_eq!(committed.act_post_passive_continuation_gate, None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_handoff_surfaces_pending_passive_commit_metadata_without_effects() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(67));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(root_id, Lanes::NO);

        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();
        let handoff = committed.commit().pending_passive_handoff().unwrap();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.finished_work(), committed.commit().finished_work());
        assert_eq!(handoff.lanes(), Lanes::SYNC);
        assert_eq!(
            pending_passive.finished_work(),
            Some(committed.commit().finished_work())
        );
        assert_eq!(pending_passive.lanes(), Lanes::SYNC);
        assert!(pending_passive.has_commit_handoff());
        assert!(!pending_passive.has_effects());
        assert!(pending_passive.passive_unmounts().is_empty());
        assert!(pending_passive.passive_mounts().is_empty());
        assert_eq!(committed.act_post_passive_continuation_gate, None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_commits_multiple_roots_in_scheduled_order() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let first = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let third = store
            .create_client_root(FakeContainer::new(3), RootOptions::new())
            .unwrap();

        schedule_sync_update(&mut store, second, RootElementHandle::from_raw(20));
        schedule_sync_update(&mut store, first, RootElementHandle::from_raw(10));
        schedule_sync_update(&mut store, third, RootElementHandle::from_raw(30));

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
        let committed_roots = result
            .records()
            .iter()
            .map(|record| record.root())
            .collect::<Vec<_>>();

        assert_eq!(committed_roots, vec![second, first, third]);
        assert_eq!(scheduled_roots(&store).unwrap(), vec![second, first, third]);
        assert_eq!(
            current_host_root_element(&store, first),
            RootElementHandle::from_raw(10)
        );
        assert_eq!(
            current_host_root_element(&store, second),
            RootElementHandle::from_raw(20)
        );
        assert_eq!(
            current_host_root_element(&store, third),
            RootElementHandle::from_raw(30)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_cross_root_render_diagnostics_prove_scheduled_private_flush() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let first = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let first_element = RootElementHandle::from_raw(901);
        let second_element = RootElementHandle::from_raw(902);

        schedule_sync_update(&mut store, first, first_element);
        schedule_sync_update(&mut store, second, second_element);

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
        let diagnostics = result
            .cross_root_render_diagnostics_for_canary(&store)
            .unwrap();

        assert!(result.did_flush_work());
        assert_eq!(result.records().len(), 2);
        assert_eq!(diagnostics.committed_root_order(), &[first, second]);
        assert_eq!(
            diagnostics.render_lanes_by_root(),
            &[Lanes::SYNC, Lanes::SYNC]
        );
        assert_eq!(
            diagnostics.remaining_lanes_by_root(),
            &[Lanes::NO, Lanes::NO]
        );
        assert_eq!(
            diagnostics.pending_lanes_by_root_after_commit(),
            &[Lanes::NO, Lanes::NO]
        );
        assert_eq!(diagnostics.applied_update_counts_by_root(), &[1, 1]);
        assert_eq!(diagnostics.skipped_update_counts_by_root(), &[0, 0]);
        assert!(!diagnostics.skipped_reentrant_flush());
        assert!(!diagnostics.skipped_no_sync_work());
        assert!(!diagnostics.might_have_pending_sync_work_after_flush());
        assert!(diagnostics.root_current_matches_commits());
        assert!(diagnostics.sync_lanes_consumed_from_roots());
        assert!(diagnostics.proves_cross_root_sync_flush_scheduling());
        assert_eq!(current_host_root_element(&store, first), first_element);
        assert_eq!(current_host_root_element(&store, second), second_element);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_callback_drain_diagnostics_prove_cross_root_lane_commit_order() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let scheduled_second = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let scheduled_first = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let first_visible_callback = RootUpdateCallbackHandle::from_raw(50101);
        let first_hidden_callback = RootUpdateCallbackHandle::from_raw(50102);
        let second_hidden_callback = RootUpdateCallbackHandle::from_raw(50103);
        let second_visible_callback = RootUpdateCallbackHandle::from_raw(50104);

        let first_visible = update_container_sync(
            &mut store,
            scheduled_first,
            RootElementHandle::from_raw(50101),
            Some(first_visible_callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, first_visible.schedule()).unwrap();
        let first_hidden = update_container_sync(
            &mut store,
            scheduled_first,
            RootElementHandle::from_raw(50102),
            Some(first_hidden_callback),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(first_hidden.update())
            .unwrap();
        ensure_root_is_scheduled(&mut store, first_hidden.schedule()).unwrap();

        let second_hidden = update_container_sync(
            &mut store,
            scheduled_second,
            RootElementHandle::from_raw(50103),
            Some(second_hidden_callback),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(second_hidden.update())
            .unwrap();
        ensure_root_is_scheduled(&mut store, second_hidden.schedule()).unwrap();
        let second_visible = update_container_sync(
            &mut store,
            scheduled_second,
            RootElementHandle::from_raw(50104),
            Some(second_visible_callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, second_visible.schedule()).unwrap();

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
        let diagnostics = result
            .root_callback_drain_diagnostics_for_canary(&store)
            .unwrap();

        assert_eq!(result.records().len(), 2);
        assert_eq!(
            diagnostics.committed_root_order(),
            &[scheduled_first, scheduled_second]
        );
        assert_eq!(diagnostics.root_snapshots().len(), 2);
        assert_eq!(diagnostics.records().len(), 4);
        assert_eq!(diagnostics.visible_callback_count(), 2);
        assert_eq!(diagnostics.hidden_callback_count(), 2);
        assert!(diagnostics.has_visible_and_hidden_callbacks());
        assert!(diagnostics.root_snapshots_in_commit_order());
        assert!(diagnostics.records_in_deterministic_commit_order());
        assert!(diagnostics.callback_records_match_commit_lanes());
        assert!(diagnostics.hidden_callbacks_deferred_without_invocation());
        assert!(diagnostics.root_snapshots_prove_deterministic_lane_order());
        assert!(diagnostics.proves_cross_root_callback_lane_commit_order());
        assert!(!diagnostics.skipped_reentrant_flush());
        assert!(!diagnostics.skipped_no_sync_work());
        assert!(!diagnostics.public_callbacks_invoked());
        assert!(!diagnostics.public_root_callback_behavior_exposed());

        let first_snapshot = &diagnostics.root_snapshots()[0];
        assert_eq!(first_snapshot.root(), scheduled_first);
        assert_eq!(first_snapshot.commit_order(), 0);
        assert_eq!(first_snapshot.render_lanes(), Lanes::SYNC);
        assert_eq!(first_snapshot.finished_lanes(), Lanes::SYNC);
        assert_eq!(first_snapshot.visible_callback_count(), 1);
        assert_eq!(first_snapshot.hidden_callback_count(), 1);
        assert!(first_snapshot.has_visible_and_hidden_callbacks());
        assert!(first_snapshot.proves_deterministic_lane_order());

        let second_snapshot = &diagnostics.root_snapshots()[1];
        assert_eq!(second_snapshot.root(), scheduled_second);
        assert_eq!(second_snapshot.commit_order(), 1);
        assert_eq!(second_snapshot.render_lanes(), Lanes::SYNC);
        assert_eq!(second_snapshot.finished_lanes(), Lanes::SYNC);
        assert_eq!(second_snapshot.visible_callback_count(), 1);
        assert_eq!(second_snapshot.hidden_callback_count(), 1);
        assert!(second_snapshot.has_visible_and_hidden_callbacks());
        assert!(second_snapshot.proves_deterministic_lane_order());

        let records = diagnostics.records();
        assert_eq!(records[0].root(), scheduled_first);
        assert_eq!(records[0].commit_order(), 0);
        assert_eq!(records[0].callback_order(), 0);
        assert_eq!(records[0].accepted_sequence(), 0);
        assert_eq!(records[0].update(), first_visible.update());
        assert_eq!(records[0].callback(), first_visible_callback);
        assert_eq!(
            records[0].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert_eq!(records[0].update_lanes(), Lanes::SYNC);
        assert_eq!(records[0].callback_lanes(), Lanes::SYNC);
        assert_eq!(records[0].render_lanes(), Lanes::SYNC);
        assert_eq!(records[0].finished_lanes(), Lanes::SYNC);
        assert!(records[0].callback_lanes_match_commit());

        assert_eq!(records[1].root(), scheduled_first);
        assert_eq!(records[1].commit_order(), 0);
        assert_eq!(records[1].callback_order(), 1);
        assert_eq!(records[1].accepted_sequence(), 1);
        assert_eq!(records[1].update(), first_hidden.update());
        assert_eq!(records[1].callback(), first_hidden_callback);
        assert_eq!(
            records[1].visibility(),
            RootUpdateCallbackVisibility::DeferredHidden
        );
        assert_eq!(
            records[1].update_lanes(),
            Lanes::SYNC.merge_lane(Lane::OFFSCREEN)
        );
        assert_eq!(records[1].callback_lanes(), Lanes::SYNC);
        assert!(records[1].update_lanes_include_offscreen());
        assert!(records[1].callback_lanes_match_commit());
        assert!(!records[1].public_callback_invoked());

        assert_eq!(records[2].root(), scheduled_second);
        assert_eq!(records[2].commit_order(), 1);
        assert_eq!(records[2].callback_order(), 0);
        assert_eq!(records[2].accepted_sequence(), 0);
        assert_eq!(records[2].update(), second_hidden.update());
        assert_eq!(records[2].callback(), second_hidden_callback);
        assert_eq!(
            records[2].visibility(),
            RootUpdateCallbackVisibility::DeferredHidden
        );
        assert_eq!(
            records[2].update_lanes(),
            Lanes::SYNC.merge_lane(Lane::OFFSCREEN)
        );
        assert_eq!(records[2].callback_lanes(), Lanes::SYNC);
        assert!(records[2].update_lanes_include_offscreen());
        assert!(records[2].callback_lanes_match_commit());
        assert!(!records[2].public_callback_invoked());

        assert_eq!(records[3].root(), scheduled_second);
        assert_eq!(records[3].commit_order(), 1);
        assert_eq!(records[3].callback_order(), 1);
        assert_eq!(records[3].accepted_sequence(), 1);
        assert_eq!(records[3].update(), second_visible.update());
        assert_eq!(records[3].callback(), second_visible_callback);
        assert_eq!(
            records[3].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert_eq!(records[3].update_lanes(), Lanes::SYNC);
        assert_eq!(records[3].callback_lanes(), Lanes::SYNC);
        assert!(records[3].callback_lanes_match_commit());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_private_callback_execution_drains_matching_two_root_commits() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let first_root = store
            .create_client_root(FakeContainer::new(701), RootOptions::new())
            .unwrap();
        let second_root = store
            .create_client_root(FakeContainer::new(702), RootOptions::new())
            .unwrap();
        let first_callback = RootUpdateCallbackHandle::from_raw(70101);
        let second_callback = RootUpdateCallbackHandle::from_raw(70201);

        let first_update = update_container_sync(
            &mut store,
            first_root,
            RootElementHandle::from_raw(70101),
            Some(first_callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, first_update.schedule()).unwrap();
        let first_accepted = host_root_queued_callback_order_snapshot_for_canary(
            &store,
            first_root,
            std::slice::from_ref(&first_update),
        )
        .unwrap();

        let second_update = update_container_sync(
            &mut store,
            second_root,
            RootElementHandle::from_raw(70201),
            Some(second_callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, second_update.schedule()).unwrap();
        let second_accepted = host_root_queued_callback_order_snapshot_for_canary(
            &store,
            second_root,
            std::slice::from_ref(&second_update),
        )
        .unwrap();

        let mut result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut control = TestRootUpdateCallbackControl::default();
        let accepted_orders = vec![first_accepted, second_accepted];

        let diagnostics = result
            .execute_accepted_visible_root_update_callbacks_after_matching_commits_under_test_control_for_canary(
                &accepted_orders,
                &mut control,
            )
            .unwrap();

        assert_eq!(result.records().len(), 2);
        assert_eq!(
            diagnostics.committed_root_order(),
            &[first_root, second_root]
        );
        assert_eq!(
            diagnostics.accepted_root_order(),
            &[first_root, second_root]
        );
        assert_eq!(diagnostics.invocations().len(), 2);
        assert_eq!(diagnostics.records().len(), 2);
        assert!(diagnostics.matched_committed_roots());
        assert!(diagnostics.invoked_accepted_visible_callbacks_for_all_roots());
        assert!(diagnostics.records_are_visible());
        assert!(diagnostics.records_in_cross_root_commit_order());
        assert!(diagnostics.records_match_accepted_visible_count());
        assert_eq!(diagnostics.accepted_visible_callback_count(), 2);
        assert_eq!(diagnostics.completed_count(), 2);
        assert_eq!(diagnostics.error_count(), 0);
        assert!(diagnostics.proves_cross_root_accepted_visible_callback_execution());
        assert!(!diagnostics.skipped_reentrant_flush());
        assert!(!diagnostics.skipped_no_sync_work());
        assert!(!diagnostics.public_callbacks_invoked());
        assert!(!diagnostics.public_root_callback_behavior_exposed());
        assert!(!diagnostics.hidden_callbacks_invoked());
        assert!(!diagnostics.root_error_callbacks_invoked());

        let records = diagnostics.records();
        assert_eq!(records[0].root(), first_root);
        assert_eq!(records[0].commit_order(), 0);
        assert_eq!(records[0].cross_root_invocation_order(), 0);
        assert_eq!(records[0].root_invocation_order(), 0);
        assert_eq!(records[0].accepted_sequence(), 0);
        assert_eq!(records[0].update(), first_update.update());
        assert_eq!(records[0].callback(), first_callback);
        assert_eq!(
            records[0].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert_eq!(
            records[0].status(),
            RootUpdateCallbackInvocationStatus::Completed
        );

        assert_eq!(records[1].root(), second_root);
        assert_eq!(records[1].commit_order(), 1);
        assert_eq!(records[1].cross_root_invocation_order(), 1);
        assert_eq!(records[1].root_invocation_order(), 0);
        assert_eq!(records[1].accepted_sequence(), 0);
        assert_eq!(records[1].update(), second_update.update());
        assert_eq!(records[1].callback(), second_callback);
        assert_eq!(
            records[1].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert_eq!(
            records[1].status(),
            RootUpdateCallbackInvocationStatus::Completed
        );

        assert_eq!(control.calls().len(), 2);
        assert_eq!(control.calls()[0].callback(), first_callback);
        assert_eq!(control.calls()[1].callback(), second_callback);
        assert!(
            result.records()[0]
                .commit()
                .root_update_callback_invocation_gate()
                .is_empty()
        );
        assert!(
            result.records()[1]
                .commit()
                .root_update_callback_invocation_gate()
                .is_empty()
        );
        assert_eq!(
            store.scheduler_bridge().callback_requests().len(),
            callback_request_count
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_private_callback_execution_blocks_mismatched_cross_root_order() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let first_root = store
            .create_client_root(FakeContainer::new(711), RootOptions::new())
            .unwrap();
        let second_root = store
            .create_client_root(FakeContainer::new(712), RootOptions::new())
            .unwrap();

        let first_update = update_container_sync(
            &mut store,
            first_root,
            RootElementHandle::from_raw(71101),
            Some(RootUpdateCallbackHandle::from_raw(71101)),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, first_update.schedule()).unwrap();
        let first_accepted = host_root_queued_callback_order_snapshot_for_canary(
            &store,
            first_root,
            std::slice::from_ref(&first_update),
        )
        .unwrap();

        let second_update = update_container_sync(
            &mut store,
            second_root,
            RootElementHandle::from_raw(71201),
            Some(RootUpdateCallbackHandle::from_raw(71201)),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, second_update.schedule()).unwrap();
        let second_accepted = host_root_queued_callback_order_snapshot_for_canary(
            &store,
            second_root,
            std::slice::from_ref(&second_update),
        )
        .unwrap();

        let mut result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
        let mut control = TestRootUpdateCallbackControl::default();
        let accepted_orders = vec![second_accepted, first_accepted];

        let diagnostics = result
            .execute_accepted_visible_root_update_callbacks_after_matching_commits_under_test_control_for_canary(
                &accepted_orders,
                &mut control,
            )
            .unwrap();

        assert_eq!(result.records().len(), 2);
        assert_eq!(
            diagnostics.committed_root_order(),
            &[first_root, second_root]
        );
        assert_eq!(
            diagnostics.accepted_root_order(),
            &[second_root, first_root]
        );
        assert!(!diagnostics.matched_committed_roots());
        assert!(diagnostics.invocations().is_empty());
        assert!(diagnostics.records().is_empty());
        assert!(!diagnostics.proves_cross_root_accepted_visible_callback_execution());
        assert!(control.calls().is_empty());
        assert_eq!(
            result.records()[0]
                .commit()
                .root_update_callback_invocation_gate()
                .len(),
            1
        );
        assert_eq!(
            result.records()[1]
                .commit()
                .root_update_callback_invocation_gate()
                .len(),
            1
        );
        assert!(!diagnostics.public_root_callback_behavior_exposed());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_retains_skipped_non_sync_lanes_in_result_and_root() {
        let (mut store, root_id, _host) = root_store();
        let sync_element = RootElementHandle::from_raw(1);
        let default_element = RootElementHandle::from_raw(2);
        schedule_sync_update(&mut store, root_id, sync_element);
        let default_result = update_container(&mut store, root_id, default_element, None).unwrap();
        ensure_root_is_scheduled(&mut store, default_result.schedule()).unwrap();

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

        assert_eq!(result.records().len(), 1);
        let record = &result.records()[0];
        assert_eq!(record.render_lanes(), Lanes::SYNC);
        assert_eq!(record.applied_update_count(), 1);
        assert_eq!(record.skipped_update_count(), 1);
        assert_eq!(record.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(record.pending_lanes(), Lanes::DEFAULT);
        assert!(record.has_remaining_work());
        assert_eq!(current_host_root_element(&store, root_id), sync_element);
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );
        assert!(
            !store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::SYNC)
        );

        let current = store.root(root_id).unwrap().current();
        let current_queue = store.fiber_arena().get(current).unwrap().update_queue();
        let rebased = store.update_queues().base_updates(current_queue).unwrap();
        assert_eq!(rebased.len(), 1);
        assert_eq!(
            store.update_queues().update(rebased[0]).unwrap().lane(),
            Lanes::DEFAULT
        );
    }

    #[test]
    fn sync_flush_does_not_call_host_operations() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(99));

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

        assert_eq!(result.records().len(), 1);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_surfaces_visible_root_update_callback_snapshot() {
        let (mut store, root_id, host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(177);
        let update = update_container_sync(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1770),
            Some(callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

        assert_eq!(result.records().len(), 1);
        let record = &result.records()[0];
        let callbacks = record.root_update_callbacks();
        assert_eq!(
            callbacks.queue(),
            record.render_phase().work_in_progress_update_queue()
        );
        assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
        assert_eq!(callbacks.visible()[0].update(), update.update());
        assert_eq!(callbacks.visible()[0].sequence(), 0);
        assert_eq!(
            callbacks.visible()[0].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert!(callbacks.hidden().is_empty());
        assert!(callbacks.deferred_hidden().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_root_callback_invocation_execution_gate_drains_visible_callbacks_in_commit_order()
    {
        let (mut store, root_id, host) = root_store();
        let first_callback = RootUpdateCallbackHandle::from_raw(277);
        let hidden_callback = RootUpdateCallbackHandle::from_raw(278);
        let second_callback = RootUpdateCallbackHandle::from_raw(279);
        let first = update_container_sync(
            &mut store,
            root_id,
            RootElementHandle::from_raw(2770),
            Some(first_callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, first.schedule()).unwrap();
        let hidden = update_container_sync(
            &mut store,
            root_id,
            RootElementHandle::from_raw(2780),
            Some(hidden_callback),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(hidden.update())
            .unwrap();
        ensure_root_is_scheduled(&mut store, hidden.schedule()).unwrap();
        let second = update_container_sync(
            &mut store,
            root_id,
            RootElementHandle::from_raw(2790),
            Some(second_callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, second.schedule()).unwrap();

        let mut result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let second_error = root_callback_error(991);
        let mut control = TestRootUpdateCallbackControl::default()
            .with_result(second_callback, Err(second_error));

        assert_eq!(result.records().len(), 1);
        let execution =
            result.records[0].drain_root_update_callbacks_under_test_control(&mut control);

        assert_eq!(execution.source_visible_record_count(), 2);
        assert_eq!(execution.hidden_record_count(), 0);
        assert_eq!(execution.deferred_hidden_record_count(), 1);
        assert_eq!(execution.len(), 2);
        assert_eq!(execution.completed_count(), 1);
        assert_eq!(execution.error_count(), 1);
        assert!(execution.has_errors());
        assert_eq!(execution.errors(), vec![second_error]);
        assert_eq!(
            execution.status(),
            RootUpdateCallbackInvocationExecutionGateStatus::TestControlOnly
        );
        assert_eq!(
            execution.blockers(),
            &ROOT_UPDATE_CALLBACK_INVOCATION_EXECUTION_GATE_BLOCKERS
        );
        assert!(execution.did_drain_accepted_visible_callbacks());
        assert!(execution.test_control_invoked_callback_handles());
        assert!(!execution.public_js_callbacks_invoked());
        assert!(!execution.public_root_callback_behavior_exposed());
        assert!(!execution.hidden_callbacks_invoked());
        assert!(!execution.root_error_callbacks_invoked());

        let records = execution.records();
        assert_eq!(records[0].invocation_order(), 0);
        assert_eq!(records[0].accepted_sequence(), 0);
        assert_eq!(records[0].update(), first.update());
        assert_eq!(records[0].callback(), first_callback);
        assert_eq!(
            records[0].status(),
            RootUpdateCallbackInvocationStatus::Completed
        );
        assert_eq!(records[1].invocation_order(), 1);
        assert_eq!(records[1].accepted_sequence(), 2);
        assert_eq!(records[1].update(), second.update());
        assert_eq!(records[1].callback(), second_callback);
        assert_eq!(
            records[1].status(),
            RootUpdateCallbackInvocationStatus::Errored
        );
        assert_eq!(records[1].error(), Some(second_error));
        assert_eq!(control.calls().len(), 2);
        assert_eq!(control.calls()[0].callback(), first_callback);
        assert_eq!(control.calls()[1].callback(), second_callback);
        assert!(
            result.records[0]
                .commit()
                .root_update_callback_invocation_gate()
                .is_empty()
        );

        let repeated =
            result.records[0].drain_root_update_callbacks_under_test_control(&mut control);
        assert_eq!(repeated.source_visible_record_count(), 0);
        assert!(repeated.is_empty());
        assert_eq!(control.calls().len(), 2);
        assert_eq!(
            store.scheduler_bridge().callback_requests().len(),
            callback_request_count
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_surfaces_deferred_hidden_root_update_callback_snapshot() {
        let (mut store, root_id, host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(188);
        let update = update_container_sync(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1880),
            Some(callback),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(update.update())
            .unwrap();
        ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

        assert_eq!(result.records().len(), 1);
        let record = &result.records()[0];
        let callbacks = record.root_update_callbacks();
        assert_eq!(
            callbacks.queue(),
            record.render_phase().work_in_progress_update_queue()
        );
        assert!(callbacks.visible().is_empty());
        assert!(callbacks.hidden().is_empty());
        assert_eq!(
            callback_handles(callbacks.deferred_hidden()),
            vec![callback]
        );
        assert_eq!(callbacks.deferred_hidden()[0].update(), update.update());
        assert_eq!(callbacks.deferred_hidden()[0].sequence(), 0);
        assert_eq!(
            callbacks.deferred_hidden()[0].visibility(),
            RootUpdateCallbackVisibility::DeferredHidden
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }
}
