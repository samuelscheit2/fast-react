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

use fast_react_core::{FiberId, LaneTimestamp, Lanes, UpdateQueueHandle};
use fast_react_host_config::HostTypes;

mod root_record;

pub use root_record::SyncFlushRootRecord;
use root_record::commit_render_phase;
#[cfg(test)]
#[allow(unused_imports)]
pub(crate) use root_record::{
    SYNC_FLUSH_FINISHED_WORK_HANDOFF_IDENTITY_MISMATCH_FOR_CANARY,
    SyncFlushActRootExecutionPathRecordForCanary,
};
#[allow(unused_imports)]
pub(crate) use root_record::{
    SyncFlushCommitResultIdentityForCanary, SyncFlushFinishedWorkHandoffIdentityForCanary,
    SyncFlushRootCommitContinuationRecordForCanary, SyncFlushRootCommitContinuationStatusForCanary,
    commit_sync_flush_root_finished_work_continuation_for_canary,
};

use crate::root_callbacks::{
    RootUpdateCallbackInvocationExecutionRecord, RootUpdateCallbackInvocationStatus,
    RootUpdateCallbackInvocationTestControl, RootUpdateCallbackVisibility,
};
use crate::root_commit::{
    HostRootCallbackDrainRecordForCanary, HostRootCallbackDrainSnapshotForCanary,
    HostRootCommitRecoverySnapshotForCanary, HostRootRenderFailureRecoveryCommitEvidenceForCanary,
    PendingPassiveCommitHandoff, host_root_commit_recovery_snapshot_for_canary,
    host_root_render_failure_recovery_commit_evidence_for_canary,
};
use crate::root_scheduler::{
    RootRenderErrorOptionCallbackRecord, SchedulerBridgeActContinuationExecutionError,
    SchedulerBridgeActContinuationExecutionResult, SchedulerBridgeActQueueExecutionError,
    SchedulerBridgeActQueueExecutionResult, SyncFlushActContinuationDrainRecord,
    SyncFlushPostPassiveContinuationExecutionGateRecord, SyncFlushRootRecoverySnapshotForCanary,
    execute_scheduler_bridge_act_continuations, execute_scheduler_bridge_act_queue_for_canary,
    recompute_might_have_pending_sync_work, record_root_render_error_option_callbacks,
    sync_flush_lanes_for_root, sync_flush_post_passive_continuation_execution_gate,
    sync_flush_root_recovery_snapshot_for_canary,
};
use crate::root_updates::{
    HostRootQueuedCallbackOrderSnapshot, HostRootVisibleCallbackInvocationAfterCommitSnapshot,
    RootUpdateError,
    invoke_host_root_accepted_visible_callbacks_after_matching_commit_under_test_control_for_canary,
    validate_host_root_accepted_visible_callbacks_after_matching_commit_for_canary,
};
use crate::{
    ExecutionContextState, FiberRootId, FiberRootStore, FiberRootStoreError, RootCallbackPriority,
    RootCommitError, RootSchedulerCallbackHandle, RootSchedulerError, RootUpdateCallbackHandle,
    RootWorkLoopError, UpdateId, render_host_root_for_lanes,
};

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

#[cfg(test)]
mod tests;
