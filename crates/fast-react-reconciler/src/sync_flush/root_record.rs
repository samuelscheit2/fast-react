use fast_react_core::{FiberId, Lanes, StateNodeHandle};
use fast_react_host_config::HostTypes;
#[cfg(test)]
use fast_react_host_config::{HostCommit, HostCreation, MutationHost};

#[cfg(test)]
use crate::RootElementSource;
#[cfg(test)]
use crate::RootSchedulerCallbackHandle;
#[cfg(not(test))]
use crate::commit_finished_host_root;
#[cfg(test)]
use crate::complete_work::HostFiberTokenFactory;
#[cfg(test)]
use crate::host_nodes::HostNodeStore;
use crate::root_callbacks::{
    RootUpdateCallbackInvocationExecutionGateSnapshot, RootUpdateCallbackInvocationTestControl,
};
#[cfg(test)]
use crate::root_commit::{
    FunctionComponentDeletedSubtreePassiveEffectsSnapshot,
    FunctionComponentDeletedSubtreePendingPassiveCommitHandoff,
    HostRootFinishedWorkCommitHandoffErrorForCanary,
    HostRootFinishedWorkCommitHandoffRecordForCanary,
    commit_finished_host_root_with_finished_work_handoff_for_canary,
    record_host_root_finished_work_pending_commit_for_canary,
};
use crate::root_commit::{HostRootCommitRecord, host_root_commit_recovery_snapshot_for_canary};
use crate::root_scheduler::{
    RootSyncFlushRecordStatus, SYNC_FLUSH_LANES, SyncFlushActPostPassiveContinuationGateRecord,
    SyncFlushPostPassiveContinuationExecutionGateRecord, recompute_might_have_pending_sync_work,
    sync_flush_act_continuation_drain_record_after_host_output_canary,
    sync_flush_act_continuation_lanes_for_root, sync_flush_act_post_passive_continuation_gate,
    sync_flush_post_passive_continuation_execution_gate,
    sync_flush_root_recovery_snapshot_for_canary,
};
#[cfg(test)]
use crate::root_scheduler::{
    RootSyncSchedulerContinuationExecutionError, RootSyncSchedulerContinuationExecutionRecord,
    execute_sync_scheduler_continuation_for_render_handoff,
};
#[cfg(test)]
use crate::root_work_loop::{
    HostRootMinimalElementRenderPhaseError, HostRootMinimalRenderCompletePlacementCommitError,
    HostRootMinimalRenderCompletePlacementCommitRecord,
    commit_minimal_root_element_render_complete_handoff_to_host_placement,
    materialize_minimal_root_element_from_render_phase,
};
use crate::scheduler_bridge::SchedulerActContinuationRecord;
use crate::{
    ExecutionContextState, FiberRootId, FiberRootStore, HostRootRenderPhaseRecord, RootCommitError,
    RootSchedulerError, RootSyncFlushRecord, RootUpdateCallbackSnapshot,
    SyncFlushExecutionContextRecord,
};

use super::{
    SyncFlushActPrivateExecutionDiagnosticsForCanary, SyncFlushError,
    SyncFlushErrorRecoveryRootRecordForCanary, SyncFlushErrorRecoveryRootStatusForCanary,
    SyncFlushRootHostOutputCommitDiagnosticsForCanary,
};

#[cfg(test)]
pub(crate) const SYNC_FLUSH_FINISHED_WORK_HANDOFF_IDENTITY_MISMATCH_FOR_CANARY: &str =
    "SyncFlushFinishedWorkHandoffIdentityForCanary::accepted_current_finished_work_record_shape";

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

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushMinimalHostPlacementCommitRecordForCanary {
    sync_flush_record: RootSyncFlushRecord,
    finished_work_handoff_identity: SyncFlushFinishedWorkHandoffIdentityForCanary,
    placement: HostRootMinimalRenderCompletePlacementCommitRecord,
    might_have_pending_sync_work_after_commit: bool,
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private sync-flush minimal host placement canary is inspected by focused tests"
)]
impl SyncFlushMinimalHostPlacementCommitRecordForCanary {
    #[must_use]
    pub(crate) const fn sync_flush_record(&self) -> RootSyncFlushRecord {
        self.sync_flush_record
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff_identity(
        &self,
    ) -> SyncFlushFinishedWorkHandoffIdentityForCanary {
        self.finished_work_handoff_identity
    }

    #[must_use]
    pub(crate) const fn placement(&self) -> &HostRootMinimalRenderCompletePlacementCommitRecord {
        &self.placement
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.sync_flush_record.root()
    }

    #[must_use]
    pub(crate) const fn order(&self) -> usize {
        self.sync_flush_record.order()
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.sync_flush_record.lanes()
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.sync_flush_record.render_phase().finished_work()
    }

    #[must_use]
    pub(crate) const fn might_have_pending_sync_work_after_commit(&self) -> bool {
        self.might_have_pending_sync_work_after_commit
    }

    #[must_use]
    pub(crate) fn accepted_sync_flush_minimal_host_placement_handoff(&self) -> bool {
        let render = self.sync_flush_record.render_phase();
        self.sync_flush_record.status() == RootSyncFlushRecordStatus::RenderedAwaitingCommit
            && self
                .finished_work_handoff_identity
                .accepted_current_finished_work_record_shape()
            && self.sync_flush_record.root() == render.root()
            && self.sync_flush_record.lanes() == render.render_lanes()
            && self.placement.commit().root() == render.root()
            && self.placement.commit().previous_current() == render.current()
            && self.placement.commit().current() == render.finished_work()
            && self.placement.commit().finished_work() == render.finished_work()
            && self.placement.commit().finished_lanes() == render.render_lanes()
            && self.placement.commit().remaining_lanes() == render.remaining_lanes()
            && self
                .placement
                .proves_private_minimal_render_complete_placement_commit()
            && !self.might_have_pending_sync_work_after_commit
            && self.public_root_rendering_blocked()
            && self.public_compatibility_blocked()
            && !self.public_flush_sync_compatibility_claimed()
            && !self.react_dom_compatibility_claimed()
            && !self.test_renderer_compatibility_claimed()
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(&self) -> bool {
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
    pub(crate) fn effects_execution_blocked(&self) -> bool {
        self.placement.effects_execution_blocked()
    }

    #[must_use]
    pub(crate) fn refs_execution_blocked(&self) -> bool {
        self.placement.refs_execution_blocked()
    }

    #[must_use]
    pub(crate) fn hydration_execution_blocked(&self) -> bool {
        self.placement.hydration_execution_blocked()
    }

    #[must_use]
    pub(crate) fn effects_refs_and_hydration_execution_surfaces_blocked(&self) -> bool {
        self.placement
            .effects_refs_and_hydration_execution_surfaces_blocked()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum SyncFlushMinimalHostPlacementCommitErrorForCanary<E> {
    NonSyncLanes {
        root: FiberRootId,
        order: usize,
        lanes: Lanes,
    },
    RenderLaneMismatch {
        root: FiberRootId,
        order: usize,
        selected_lanes: Lanes,
        render_lanes: Lanes,
    },
    StaleFinishedWorkHandoff {
        root: FiberRootId,
        order: usize,
        selected_lanes: Lanes,
        identity: SyncFlushFinishedWorkHandoffIdentityForCanary,
    },
    Render(HostRootMinimalElementRenderPhaseError),
    CompletePlacement(HostRootMinimalRenderCompletePlacementCommitError<E>),
    SyncFlush(SyncFlushError),
    RootScheduler(RootSchedulerError),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncFlushRootRecord {
    pub(super) order: usize,
    pub(super) root: FiberRootId,
    pub(super) render_lanes: Lanes,
    pub(super) render_phase: HostRootRenderPhaseRecord,
    pub(super) commit: HostRootCommitRecord,
    pub(super) act_continuation: Option<SchedulerActContinuationRecord>,
    pub(super) act_post_passive_continuation_gate:
        Option<SyncFlushActPostPassiveContinuationGateRecord>,
    pub(super) finished_work_handoff_identity:
        Option<SyncFlushFinishedWorkHandoffIdentityForCanary>,
    pub(super) finished_work_commit_result_identity: Option<SyncFlushCommitResultIdentityForCanary>,
    pub(super) finished_work_root_commit_handoff_verified: bool,
    #[cfg(test)]
    pub(super) finished_work_root_commit_handoff_for_canary:
        Option<HostRootFinishedWorkCommitHandoffRecordForCanary>,
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

    #[cfg(test)]
    #[allow(
        dead_code,
        reason = "crate-private sync-flush deletion teardown canary consumes the source commit handoff"
    )]
    pub(crate) fn root_finished_work_commit_handoff_for_canary(
        &self,
    ) -> Option<&HostRootFinishedWorkCommitHandoffRecordForCanary> {
        self.finished_work_root_commit_handoff_for_canary.as_ref()
    }

    #[cfg(test)]
    #[allow(
        dead_code,
        reason = "crate-private sync-flush deletion teardown canary records deleted passive metadata after commit"
    )]
    pub(crate) fn record_function_component_deleted_subtree_passive_effects_for_canary(
        &mut self,
        handoffs: &[FunctionComponentDeletedSubtreePendingPassiveCommitHandoff],
    ) -> Result<(), RootCommitError> {
        if let Some(handoff) = self.finished_work_root_commit_handoff_for_canary.as_mut() {
            handoff
                .record_function_component_deleted_subtree_passive_effects_for_canary(handoffs)?;
        }
        self.commit
            .record_function_component_deleted_subtree_passive_effects_for_canary(handoffs)
            .map(|_: &FunctionComponentDeletedSubtreePassiveEffectsSnapshot| ())
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

    #[cfg(test)]
    #[allow(
        dead_code,
        reason = "crate-private sync-flush minimal host placement bridge is exercised by focused canaries"
    )]
    pub(crate) fn commit_rendered_sync_flush_record_to_minimal_host_placement_for_canary<
        H,
        S,
        A,
        T,
    >(
        store: &mut FiberRootStore<H>,
        host: &mut H,
        host_nodes: &mut HostNodeStore<H>,
        token_factory: &mut T,
        record: RootSyncFlushRecord,
        source: &S,
        adapter: &mut A,
    ) -> Result<
        SyncFlushMinimalHostPlacementCommitRecordForCanary,
        SyncFlushMinimalHostPlacementCommitErrorForCanary<A::Error>,
    >
    where
        H: HostCreation + HostCommit + MutationHost,
        S: RootElementSource + ?Sized,
        A: crate::root_work_loop::HostRootMinimalRenderCompleteHandoffAdapter<H>,
        T: HostFiberTokenFactory<H>,
    {
        commit_rendered_sync_flush_record_to_minimal_host_placement_for_canary(
            store,
            host,
            host_nodes,
            token_factory,
            record,
            source,
            adapter,
            false,
        )
    }

    #[cfg(test)]
    #[allow(
        dead_code,
        reason = "crate-private sync-flush compatibility-claim blocker canary is exercised by focused tests"
    )]
    pub(crate) fn commit_rendered_sync_flush_record_to_minimal_host_placement_with_public_compatibility_claim_for_canary<
        H,
        S,
        A,
        T,
    >(
        store: &mut FiberRootStore<H>,
        host: &mut H,
        host_nodes: &mut HostNodeStore<H>,
        token_factory: &mut T,
        record: RootSyncFlushRecord,
        source: &S,
        adapter: &mut A,
    ) -> Result<
        SyncFlushMinimalHostPlacementCommitRecordForCanary,
        SyncFlushMinimalHostPlacementCommitErrorForCanary<A::Error>,
    >
    where
        H: HostCreation + HostCommit + MutationHost,
        S: RootElementSource + ?Sized,
        A: crate::root_work_loop::HostRootMinimalRenderCompleteHandoffAdapter<H>,
        T: HostFiberTokenFactory<H>,
    {
        commit_rendered_sync_flush_record_to_minimal_host_placement_for_canary(
            store,
            host,
            host_nodes,
            token_factory,
            record,
            source,
            adapter,
            true,
        )
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

#[cfg(test)]
#[allow(
    clippy::too_many_arguments,
    reason = "private canary helper mirrors the minimal render/complete/placement handoff shape"
)]
fn commit_rendered_sync_flush_record_to_minimal_host_placement_for_canary<H, S, A, T>(
    store: &mut FiberRootStore<H>,
    host: &mut H,
    host_nodes: &mut HostNodeStore<H>,
    token_factory: &mut T,
    record: RootSyncFlushRecord,
    source: &S,
    adapter: &mut A,
    claim_public_compatibility_for_canary: bool,
) -> Result<
    SyncFlushMinimalHostPlacementCommitRecordForCanary,
    SyncFlushMinimalHostPlacementCommitErrorForCanary<A::Error>,
>
where
    H: HostCreation + HostCommit + MutationHost,
    S: RootElementSource + ?Sized,
    A: crate::root_work_loop::HostRootMinimalRenderCompleteHandoffAdapter<H>,
    T: HostFiberTokenFactory<H>,
{
    let root = record.root();
    let order = record.order();
    let selected_lanes = record.lanes();
    let render = record.render_phase();

    if selected_lanes != render.render_lanes() {
        return Err(
            SyncFlushMinimalHostPlacementCommitErrorForCanary::RenderLaneMismatch {
                root,
                order,
                selected_lanes,
                render_lanes: render.render_lanes(),
            },
        );
    }

    if !selected_lanes_are_sync_flush_lanes(selected_lanes) {
        return Err(
            SyncFlushMinimalHostPlacementCommitErrorForCanary::NonSyncLanes {
                root,
                order,
                lanes: selected_lanes,
            },
        );
    }

    let identity = sync_flush_finished_work_handoff_identity_for_canary(store, record)
        .map_err(SyncFlushMinimalHostPlacementCommitErrorForCanary::SyncFlush)?;
    if record.status() != RootSyncFlushRecordStatus::RenderedAwaitingCommit
        || !identity.accepted_current_finished_work_record_shape()
    {
        return Err(
            SyncFlushMinimalHostPlacementCommitErrorForCanary::StaleFinishedWorkHandoff {
                root,
                order,
                selected_lanes,
                identity,
            },
        );
    }

    let mut minimal_render =
        materialize_minimal_root_element_from_render_phase(store, render, source)
            .map_err(SyncFlushMinimalHostPlacementCommitErrorForCanary::Render)?;
    if claim_public_compatibility_for_canary {
        minimal_render = minimal_render.with_public_compatibility_claimed_for_canary();
    }

    let placement = commit_minimal_root_element_render_complete_handoff_to_host_placement(
        store,
        host,
        host_nodes,
        token_factory,
        minimal_render,
        adapter,
    )
    .map_err(SyncFlushMinimalHostPlacementCommitErrorForCanary::CompletePlacement)?;
    recompute_might_have_pending_sync_work(store)
        .map_err(SyncFlushMinimalHostPlacementCommitErrorForCanary::RootScheduler)?;

    Ok(SyncFlushMinimalHostPlacementCommitRecordForCanary {
        sync_flush_record: record,
        finished_work_handoff_identity: identity,
        placement,
        might_have_pending_sync_work_after_commit: store
            .root_scheduler()
            .might_have_pending_sync_work(),
    })
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
// The commit-continuation canary stays with the post-commit root record because
// it validates the same finished-work identity and attaches the same private
// commit handoff evidence as direct root-record commits.
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
        let mut committed = sync_flush_root_record_after_commit(
            store,
            record.order(),
            render_phase,
            handoff.commit().clone(),
        )
        .map_err(SyncFlushError::from)?;
        committed.finished_work_root_commit_handoff_for_canary = Some(handoff);
        Ok::<SyncFlushRootRecord, SyncFlushError>(committed)
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

pub(super) fn commit_render_phase<H: HostTypes>(
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
        record.finished_work_root_commit_handoff_for_canary = Some(root_commit_handoff);
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
        #[cfg(test)]
        finished_work_root_commit_handoff_for_canary: None,
    })
}
