//! HostRoot commit records and canary diagnostics.

use fast_react_core::{FiberId, FiberTag, Lane, Lanes, UpdateQueueHandle};
use fast_react_host_config::HostTypes;

use crate::root_callbacks::{
    RootUpdateCallbackInvocationExecutionGateSnapshot, RootUpdateCallbackInvocationGateSnapshot,
    RootUpdateCallbackInvocationTestControl, invoke_root_update_callbacks_under_test_control,
};
use crate::root_config::{
    PendingPassiveEffectOrder, PendingPassiveEffectPhase, RootErrorOptionCallbackPhase,
    RootErrorOptionCallbackRecord,
};
use crate::{
    FiberRootId, FiberRootStore, HostRootRenderPhaseRecord, RootCallbackPriority,
    RootErrorCallbackHandle, RootRecoverableErrorCallbackHandle, RootSchedulerCallbackHandle,
    RootUpdateCallbackHandle, RootUpdateCallbackRecord, RootUpdateCallbackSnapshot,
    RootUpdateCallbackVisibility, UpdateId,
};

use super::{
    FunctionComponentCommittedPassiveEffectsSnapshot,
    FunctionComponentDeletedSubtreePassiveEffectsSnapshot,
    FunctionComponentEffectListCommitPhaseOrderSnapshot,
    FunctionComponentLayoutEffectCallbackInvocationGateSnapshot,
    FunctionComponentLayoutEffectCommitPhase, FunctionComponentLayoutEffectsSnapshot,
    HostRootCommitExecutionSurfaceBlockerRecord, HostRootDeletionCleanupLog,
    HostRootDeletionListRecord, HostRootDeletionSubtreeTraversalGateSnapshot,
    HostRootDomRefCallbackCommitGateSnapshot, HostRootMutationApplyLog, HostRootMutationPhaseLog,
    HostRootRefCallbackExecutionHandoffSnapshot, HostRootRefCleanupReturnExecutionGateSnapshot,
    HostRootRefCommitAction, HostRootRefCommitSnapshot, PendingPassiveCommitHandoff,
    RootCommitError, host_root_fiber_tag_name,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootCommitErrorOptionCallbackRecord {
    root: FiberRootId,
    finished_work: Option<FiberId>,
    finished_lanes: Lanes,
    error: RootCommitError,
    error_option_callbacks: RootErrorOptionCallbackRecord,
}

#[allow(
    dead_code,
    reason = "crate-private commit error option metadata for future root error routing"
)]
impl RootCommitErrorOptionCallbackRecord {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn error(&self) -> &RootCommitError {
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

#[allow(
    dead_code,
    reason = "crate-private commit error option metadata for future root error routing"
)]
pub(crate) fn record_root_commit_error_option_callbacks<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    finished_work: Option<FiberId>,
    finished_lanes: Lanes,
    error: RootCommitError,
) -> Result<RootCommitErrorOptionCallbackRecord, RootCommitError> {
    let root = store.root(root_id)?;
    Ok(RootCommitErrorOptionCallbackRecord {
        root: root_id,
        finished_work,
        finished_lanes,
        error,
        error_option_callbacks: root
            .options()
            .error_option_callback_record(root_id, RootErrorOptionCallbackPhase::Commit),
    })
}

#[allow(
    dead_code,
    reason = "crate-private root error recovery commit evidence is reserved for private render error workers"
)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootRenderFailureRecoveryCommitEvidenceForCanary {
    root: FiberRootId,
    render_lanes: Lanes,
    error_option_callbacks: RootErrorOptionCallbackRecord,
}

#[allow(
    dead_code,
    reason = "crate-private root error recovery commit evidence is reserved for private render error workers"
)]
impl HostRootRenderFailureRecoveryCommitEvidenceForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn render_lanes(self) -> Lanes {
        self.render_lanes
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
    pub(crate) const fn has_configured_error_callback(self) -> bool {
        self.error_option_callbacks.has_configured_error_callback()
    }

    #[must_use]
    pub(crate) fn accepted_render_failure_metadata(self) -> bool {
        self.error_option_callbacks.root() == self.root
            && self.error_option_callbacks.phase() == RootErrorOptionCallbackPhase::Render
    }

    #[must_use]
    pub(crate) const fn commit_attempted(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_current_switched(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn retried_public_work(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn invoked_public_callbacks(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_error_boundaries_enabled(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn recoverable_error_compatibility_claimed(self) -> bool {
        false
    }
}

#[allow(
    dead_code,
    reason = "crate-private root error recovery commit evidence is reserved for private render error workers"
)]
pub(crate) const fn host_root_render_failure_recovery_commit_evidence_for_canary(
    root: FiberRootId,
    render_lanes: Lanes,
    error_option_callbacks: RootErrorOptionCallbackRecord,
) -> HostRootRenderFailureRecoveryCommitEvidenceForCanary {
    HostRootRenderFailureRecoveryCommitEvidenceForCanary {
        root,
        render_lanes,
        error_option_callbacks,
    }
}

#[allow(
    dead_code,
    reason = "crate-private HostRoot commit recovery diagnostics are reserved for private sync-flush error workers"
)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootCommitRecoverySnapshotForCanary {
    root: FiberRootId,
    current: FiberId,
    render_lanes: Lanes,
    pending_lanes: Lanes,
    callback_node: RootSchedulerCallbackHandle,
    callback_priority: RootCallbackPriority,
    render_phase_work: Option<FiberId>,
    render_phase_lanes: Lanes,
    callback_queue: UpdateQueueHandle,
    root_update_callbacks: RootUpdateCallbackSnapshot,
}

#[allow(
    dead_code,
    reason = "crate-private HostRoot commit recovery diagnostics are reserved for private sync-flush error workers"
)]
impl HostRootCommitRecoverySnapshotForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes(&self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub(crate) const fn callback_node(&self) -> RootSchedulerCallbackHandle {
        self.callback_node
    }

    #[must_use]
    pub(crate) const fn callback_priority(&self) -> RootCallbackPriority {
        self.callback_priority
    }

    #[must_use]
    pub(crate) const fn render_phase_work(&self) -> Option<FiberId> {
        self.render_phase_work
    }

    #[must_use]
    pub(crate) const fn render_phase_lanes(&self) -> Lanes {
        self.render_phase_lanes
    }

    #[must_use]
    pub(crate) const fn callback_queue(&self) -> UpdateQueueHandle {
        self.callback_queue
    }

    #[must_use]
    pub(crate) fn root_update_callbacks(&self) -> &RootUpdateCallbackSnapshot {
        &self.root_update_callbacks
    }

    #[must_use]
    pub(crate) fn visible_callback_count(&self) -> usize {
        self.root_update_callbacks.visible().len()
    }

    #[must_use]
    pub(crate) fn hidden_callback_count(&self) -> usize {
        self.root_update_callbacks.hidden().len()
    }

    #[must_use]
    pub(crate) fn deferred_hidden_callback_count(&self) -> usize {
        self.root_update_callbacks.deferred_hidden().len()
    }

    #[must_use]
    pub(crate) fn preserves_lane_and_callback_metadata_from(&self, before: &Self) -> bool {
        self.root == before.root
            && self.current == before.current
            && self.render_lanes == before.render_lanes
            && self.pending_lanes == before.pending_lanes
            && self.callback_node == before.callback_node
            && self.callback_priority == before.callback_priority
            && self.render_phase_work == before.render_phase_work
            && self.render_phase_lanes == before.render_phase_lanes
            && self.callback_queue == before.callback_queue
            && self.root_update_callbacks == before.root_update_callbacks
    }
}

#[allow(
    dead_code,
    reason = "crate-private HostRoot commit recovery diagnostics are reserved for private sync-flush error workers"
)]
pub(crate) fn host_root_commit_recovery_snapshot_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
) -> Result<HostRootCommitRecoverySnapshotForCanary, RootCommitError> {
    let root = store.root(render.root())?;
    let scheduling = root.scheduling();
    let root_update_callbacks = store
        .update_queues()
        .peek_root_update_callback_records(render.work_in_progress_update_queue())?;

    Ok(HostRootCommitRecoverySnapshotForCanary {
        root: render.root(),
        current: root.current(),
        render_lanes: render.render_lanes(),
        pending_lanes: root.lanes().pending_lanes(),
        callback_node: scheduling.callback_node(),
        callback_priority: scheduling.callback_priority(),
        render_phase_work: scheduling.work_in_progress(),
        render_phase_lanes: scheduling.work_in_progress_root_render_lanes(),
        callback_queue: render.work_in_progress_update_queue(),
        root_update_callbacks,
    })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootCallbackDrainRecordForCanary {
    root: FiberRootId,
    commit_order: usize,
    callback_order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    queue: UpdateQueueHandle,
    update: UpdateId,
    callback: RootUpdateCallbackHandle,
    accepted_sequence: usize,
    visibility: RootUpdateCallbackVisibility,
    update_lanes: Lanes,
    callback_lanes: Lanes,
}

#[allow(
    dead_code,
    reason = "crate-private root callback drain metadata is reserved for lane/order canaries"
)]
impl HostRootCallbackDrainRecordForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn commit_order(self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn callback_order(self) -> usize {
        self.callback_order
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
    pub(crate) const fn accepted_sequence(self) -> usize {
        self.accepted_sequence
    }

    #[must_use]
    pub(crate) const fn visibility(self) -> RootUpdateCallbackVisibility {
        self.visibility
    }

    #[must_use]
    pub(crate) const fn update_lanes(self) -> Lanes {
        self.update_lanes
    }

    #[must_use]
    pub(crate) const fn callback_lanes(self) -> Lanes {
        self.callback_lanes
    }

    #[must_use]
    pub(crate) const fn is_visible_callback(self) -> bool {
        self.visibility.is_visible()
    }

    #[must_use]
    pub(crate) const fn is_hidden_callback(self) -> bool {
        self.visibility.is_hidden()
    }

    #[must_use]
    pub(crate) const fn is_deferred_hidden_callback(self) -> bool {
        self.visibility.is_deferred()
    }

    #[must_use]
    pub(crate) const fn update_lanes_include_offscreen(self) -> bool {
        self.update_lanes.contains_lane(Lane::OFFSCREEN)
    }

    #[must_use]
    pub(crate) const fn callback_lanes_match_commit(self) -> bool {
        self.callback_lanes.is_non_empty()
            && self.render_lanes.contains_all(self.callback_lanes)
            && self.finished_lanes.contains_all(self.callback_lanes)
    }

    #[must_use]
    pub(crate) const fn public_callback_invoked(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_callback_behavior_exposed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootCallbackDrainSnapshotForCanary {
    root: FiberRootId,
    commit_order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    pending_lanes_after_commit: Lanes,
    records: Vec<HostRootCallbackDrainRecordForCanary>,
}

#[allow(
    dead_code,
    reason = "crate-private root callback drain metadata is reserved for lane/order canaries"
)]
impl HostRootCallbackDrainSnapshotForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
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
    pub(crate) fn records(&self) -> &[HostRootCallbackDrainRecordForCanary] {
        &self.records
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub(crate) fn len(&self) -> usize {
        self.records.len()
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
    pub(crate) fn records_in_callback_sequence_order(&self) -> bool {
        self.records.iter().enumerate().all(|(expected, record)| {
            record.callback_order() == expected && record.accepted_sequence() == expected
        })
    }

    #[must_use]
    pub(crate) fn records_match_commit_lanes(&self) -> bool {
        self.records
            .iter()
            .all(|record| record.callback_lanes_match_commit())
    }

    #[must_use]
    pub(crate) fn hidden_callbacks_deferred_without_invocation(&self) -> bool {
        self.records
            .iter()
            .filter(|record| record.is_hidden_callback())
            .all(|record| {
                record.is_deferred_hidden_callback()
                    && record.update_lanes_include_offscreen()
                    && !record.public_callback_invoked()
                    && !record.public_root_callback_behavior_exposed()
            })
    }

    #[must_use]
    pub(crate) fn proves_deterministic_lane_order(&self) -> bool {
        !self.is_empty()
            && self.records_in_callback_sequence_order()
            && self.records_match_commit_lanes()
            && self.records.iter().all(|record| {
                record.root() == self.root && record.commit_order() == self.commit_order
            })
            && self.hidden_callbacks_deferred_without_invocation()
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

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct HostRootCommitOrderDiagnosticsForCanary {
    records: Vec<HostRootCommitOrderRecordForCanary>,
}

impl HostRootCommitOrderDiagnosticsForCanary {
    #[must_use]
    pub fn records(&self) -> &[HostRootCommitOrderRecordForCanary] {
        &self.records
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub const fn public_effects_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn host_containers_mutated(&self) -> bool {
        false
    }

    fn push(&mut self, record: HostRootCommitOrderRecordInputForCanary) {
        self.records.push(HostRootCommitOrderRecordForCanary {
            sequence: self.records.len(),
            phase: record.phase,
            metadata_kind: record.metadata_kind,
            root: record.root,
            finished_work: record.finished_work,
            fiber: record.fiber,
            tag: record.tag,
            source_order: record.source_order,
        });
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootCommitOrderRecordInputForCanary {
    phase: HostRootCommitOrderPhaseForCanary,
    metadata_kind: HostRootCommitOrderMetadataKindForCanary,
    root: FiberRootId,
    finished_work: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    source_order: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostRootCommitOrderRecordForCanary {
    sequence: usize,
    phase: HostRootCommitOrderPhaseForCanary,
    metadata_kind: HostRootCommitOrderMetadataKindForCanary,
    root: FiberRootId,
    finished_work: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    source_order: u64,
}

impl HostRootCommitOrderRecordForCanary {
    #[must_use]
    pub const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub const fn phase(self) -> HostRootCommitOrderPhaseForCanary {
        self.phase
    }

    #[must_use]
    pub const fn phase_name(self) -> &'static str {
        host_root_commit_order_phase_name(self.phase)
    }

    #[must_use]
    pub const fn metadata_kind(self) -> HostRootCommitOrderMetadataKindForCanary {
        self.metadata_kind
    }

    #[must_use]
    pub const fn metadata_kind_name(self) -> &'static str {
        host_root_commit_order_metadata_kind_name(self.metadata_kind)
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.tag)
    }

    #[must_use]
    pub const fn source_order(self) -> u64 {
        self.source_order
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostRootCommitOrderPhaseForCanary {
    Mutation,
    Layout,
    Passive,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostRootCommitOrderMetadataKindForCanary {
    DeletionCleanup,
    RefDetach,
    RefAttach,
    LayoutEffectDestroy,
    LayoutEffectCreate,
    LayoutEffectCallback,
    RootUpdateCallback,
    PassiveUnmount,
    PassiveMount,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostRootCommitRecord {
    pub(super) root: FiberRootId,
    pub(super) previous_current: FiberId,
    pub(super) current: FiberId,
    pub(super) finished_lanes: Lanes,
    pub(super) remaining_lanes: Lanes,
    pub(super) pending_lanes: Lanes,
    pub(super) mutation_log: HostRootMutationPhaseLog,
    pub(super) mutation_apply_log: HostRootMutationApplyLog,
    pub(super) root_update_callbacks: RootUpdateCallbackSnapshot,
    pub(super) root_update_callback_invocation_gate: RootUpdateCallbackInvocationGateSnapshot,
    pub(super) pending_passive_handoff: Option<PendingPassiveCommitHandoff>,
    pub(super) function_component_committed_passive_effects:
        FunctionComponentCommittedPassiveEffectsSnapshot,
    pub(super) function_component_deleted_subtree_passive_effects:
        FunctionComponentDeletedSubtreePassiveEffectsSnapshot,
    pub(super) function_component_layout_effects: FunctionComponentLayoutEffectsSnapshot,
    pub(super) function_component_layout_effect_callback_invocation_gate:
        FunctionComponentLayoutEffectCallbackInvocationGateSnapshot,
    pub(super) function_component_effect_list_commit_phase_order:
        FunctionComponentEffectListCommitPhaseOrderSnapshot,
    pub(super) deletion_lists: Vec<HostRootDeletionListRecord>,
    pub(super) deletion_subtree_traversal_gate: HostRootDeletionSubtreeTraversalGateSnapshot,
    pub(super) host_node_deletion_cleanup_log: HostRootDeletionCleanupLog,
    pub(super) execution_surface_blockers: HostRootCommitExecutionSurfaceBlockerRecord,
    pub(super) ref_commit_metadata: HostRootRefCommitSnapshot,
    pub(super) dom_ref_callback_commit_gate: HostRootDomRefCallbackCommitGateSnapshot,
    pub(super) ref_callback_execution_handoff: HostRootRefCallbackExecutionHandoffSnapshot,
    pub(super) ref_cleanup_return_execution_gate: HostRootRefCleanupReturnExecutionGateSnapshot,
}

impl HostRootCommitRecord {
    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn previous_current(&self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn finished_work(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub const fn remaining_lanes(&self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub const fn pending_lanes(&self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub const fn has_remaining_work(&self) -> bool {
        self.pending_lanes.is_non_empty()
    }

    #[must_use]
    pub fn root_update_callbacks(&self) -> &RootUpdateCallbackSnapshot {
        &self.root_update_callbacks
    }

    #[must_use]
    #[allow(
        dead_code,
        reason = "crate-private root callback invocation metadata is reserved for future commit workers"
    )]
    pub(crate) fn root_update_callback_invocation_gate(
        &self,
    ) -> &RootUpdateCallbackInvocationGateSnapshot {
        &self.root_update_callback_invocation_gate
    }

    #[allow(
        dead_code,
        reason = "crate-private root callback invocation execution gate is reserved for private commit tests"
    )]
    pub(crate) fn drain_root_update_callbacks_under_test_control(
        &mut self,
        control: &mut impl RootUpdateCallbackInvocationTestControl,
    ) -> RootUpdateCallbackInvocationExecutionGateSnapshot {
        invoke_root_update_callbacks_under_test_control(
            &mut self.root_update_callback_invocation_gate,
            control,
        )
    }

    #[allow(
        dead_code,
        reason = "crate-private root callback drain metadata is reserved for lane/order canaries"
    )]
    pub(crate) fn root_update_callback_drain_snapshot_for_canary<H: HostTypes>(
        &self,
        store: &FiberRootStore<H>,
        commit_order: usize,
        render_lanes: Lanes,
    ) -> Result<HostRootCallbackDrainSnapshotForCanary, RootCommitError> {
        let records = collect_host_root_callback_drain_records_for_canary(
            store,
            self.root,
            commit_order,
            render_lanes,
            self.finished_lanes,
            &self.root_update_callbacks,
        )?;

        Ok(HostRootCallbackDrainSnapshotForCanary {
            root: self.root,
            commit_order,
            render_lanes,
            finished_lanes: self.finished_lanes,
            pending_lanes_after_commit: self.pending_lanes,
            records,
        })
    }

    #[doc(hidden)]
    #[must_use]
    pub fn commit_order_diagnostics_for_canary(&self) -> HostRootCommitOrderDiagnosticsForCanary {
        let mut diagnostics = HostRootCommitOrderDiagnosticsForCanary::default();

        for record in self.host_node_deletion_cleanup_log.records() {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Mutation,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::DeletionCleanup,
                root: record.root(),
                finished_work: self.current,
                fiber: record.fiber(),
                tag: record.tag(),
                source_order: record.sequence() as u64,
            });
        }

        for record in self
            .function_component_layout_effects
            .destroy_phase_records()
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Mutation,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::LayoutEffectDestroy,
                root: self.root,
                finished_work: self.current,
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: record.order() as u64,
            });
        }

        for record in self
            .function_component_layout_effect_callback_invocation_gate
            .records()
            .iter()
            .filter(|record| {
                record.commit_phase() == FunctionComponentLayoutEffectCommitPhase::Mutation
            })
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Mutation,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::LayoutEffectCallback,
                root: record.root(),
                finished_work: record.finished_work(),
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: record.invocation_order() as u64,
            });
        }

        for record in self.ref_callback_execution_handoff.records() {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Layout,
                metadata_kind: host_root_commit_order_ref_kind(record.action()),
                root: record.root(),
                finished_work: self.current,
                fiber: record.fiber(),
                tag: FiberTag::HostComponent,
                source_order: record.sequence() as u64,
            });
        }

        for record in self
            .function_component_layout_effects
            .create_phase_records()
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Layout,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::LayoutEffectCreate,
                root: self.root,
                finished_work: self.current,
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: record.order() as u64,
            });
        }

        for record in self
            .function_component_layout_effect_callback_invocation_gate
            .records()
            .iter()
            .filter(|record| {
                record.commit_phase() == FunctionComponentLayoutEffectCommitPhase::Layout
            })
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Layout,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::LayoutEffectCallback,
                root: record.root(),
                finished_work: record.finished_work(),
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: record.invocation_order() as u64,
            });
        }

        for record in self.root_update_callback_invocation_gate.records() {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Layout,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::RootUpdateCallback,
                root: self.root,
                finished_work: self.current,
                fiber: self.current,
                tag: FiberTag::HostRoot,
                source_order: record.invocation_order() as u64,
            });
        }

        for record in self
            .function_component_committed_passive_effects
            .phase_records()
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Passive,
                metadata_kind: host_root_commit_order_passive_kind(record.phase()),
                root: self.root,
                finished_work: self.current,
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: host_root_commit_order_passive_source_order(record.order()),
            });
        }

        diagnostics
    }
}

fn collect_host_root_callback_drain_records_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    commit_order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    callbacks: &RootUpdateCallbackSnapshot,
) -> Result<Vec<HostRootCallbackDrainRecordForCanary>, RootCommitError> {
    let mut callback_records = Vec::with_capacity(
        callbacks.visible().len() + callbacks.hidden().len() + callbacks.deferred_hidden().len(),
    );
    callback_records.extend_from_slice(callbacks.visible());
    callback_records.extend_from_slice(callbacks.hidden());
    callback_records.extend_from_slice(callbacks.deferred_hidden());
    callback_records.sort_by_key(|record| {
        (
            record.sequence(),
            root_update_callback_visibility_order(record.visibility()),
        )
    });

    callback_records
        .into_iter()
        .enumerate()
        .map(|(callback_order, record)| {
            host_root_callback_drain_record_for_canary(
                store,
                root,
                commit_order,
                callback_order,
                render_lanes,
                finished_lanes,
                record,
            )
        })
        .collect()
}

fn host_root_callback_drain_record_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    commit_order: usize,
    callback_order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    record: RootUpdateCallbackRecord,
) -> Result<HostRootCallbackDrainRecordForCanary, RootCommitError> {
    let update_lanes = store.update_queues().update(record.update())?.lane();
    let callback_lanes = update_lanes.remove_lane(Lane::OFFSCREEN);

    Ok(HostRootCallbackDrainRecordForCanary {
        root,
        commit_order,
        callback_order,
        render_lanes,
        finished_lanes,
        queue: record.queue(),
        update: record.update(),
        callback: record.callback(),
        accepted_sequence: record.sequence(),
        visibility: record.visibility(),
        update_lanes,
        callback_lanes,
    })
}

const fn root_update_callback_visibility_order(visibility: RootUpdateCallbackVisibility) -> u8 {
    match visibility {
        RootUpdateCallbackVisibility::Visible => 0,
        RootUpdateCallbackVisibility::Hidden => 1,
        RootUpdateCallbackVisibility::DeferredHidden => 2,
    }
}

const fn host_root_commit_order_phase_name(
    phase: HostRootCommitOrderPhaseForCanary,
) -> &'static str {
    match phase {
        HostRootCommitOrderPhaseForCanary::Mutation => "mutation",
        HostRootCommitOrderPhaseForCanary::Layout => "layout",
        HostRootCommitOrderPhaseForCanary::Passive => "passive",
    }
}

const fn host_root_commit_order_metadata_kind_name(
    kind: HostRootCommitOrderMetadataKindForCanary,
) -> &'static str {
    match kind {
        HostRootCommitOrderMetadataKindForCanary::DeletionCleanup => "deletion-cleanup",
        HostRootCommitOrderMetadataKindForCanary::RefDetach => "ref-detach",
        HostRootCommitOrderMetadataKindForCanary::RefAttach => "ref-attach",
        HostRootCommitOrderMetadataKindForCanary::LayoutEffectDestroy => "layout-effect-destroy",
        HostRootCommitOrderMetadataKindForCanary::LayoutEffectCreate => "layout-effect-create",
        HostRootCommitOrderMetadataKindForCanary::LayoutEffectCallback => "layout-effect-callback",
        HostRootCommitOrderMetadataKindForCanary::RootUpdateCallback => "root-update-callback",
        HostRootCommitOrderMetadataKindForCanary::PassiveUnmount => "passive-unmount",
        HostRootCommitOrderMetadataKindForCanary::PassiveMount => "passive-mount",
    }
}

const fn host_root_commit_order_ref_kind(
    action: HostRootRefCommitAction,
) -> HostRootCommitOrderMetadataKindForCanary {
    match action {
        HostRootRefCommitAction::Detach => HostRootCommitOrderMetadataKindForCanary::RefDetach,
        HostRootRefCommitAction::Attach => HostRootCommitOrderMetadataKindForCanary::RefAttach,
    }
}

const fn host_root_commit_order_passive_kind(
    phase: PendingPassiveEffectPhase,
) -> HostRootCommitOrderMetadataKindForCanary {
    match phase {
        PendingPassiveEffectPhase::Unmount => {
            HostRootCommitOrderMetadataKindForCanary::PassiveUnmount
        }
        PendingPassiveEffectPhase::Mount => HostRootCommitOrderMetadataKindForCanary::PassiveMount,
    }
}

pub(super) const fn host_root_commit_order_passive_source_order(
    order: PendingPassiveEffectOrder,
) -> u64 {
    ((order.flush_rank() as u64) << 32) | order.sequence()
}
