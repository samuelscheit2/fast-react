use super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererHostNodeCleanupTarget {
    Instance,
    Text,
}

impl TestRendererHostNodeCleanupTarget {
    pub(crate) const fn from_host_target(target: HostFiberTokenTarget) -> Option<Self> {
        match target {
            HostFiberTokenTarget::Instance => Some(Self::Instance),
            HostFiberTokenTarget::TextInstance => Some(Self::Text),
            HostFiberTokenTarget::HydratableInstance
            | HostFiberTokenTarget::ActivityBoundary
            | HostFiberTokenTarget::SuspenseBoundary => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererHostNodeCleanupStatus {
    Invalidated,
    AlreadyInactive,
    MissingHostNode,
    MissingStateNode,
    UnsupportedTarget,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererHostNodeCleanupRecord {
    pub(crate) sequence: usize,
    pub(crate) root: FiberRootId,
    pub(crate) deletion_list_index: usize,
    pub(crate) deleted_index: usize,
    pub(crate) subtree_index: usize,
    pub(crate) parent: TestRendererFiberHandleDiagnostics,
    pub(crate) deleted_root: TestRendererFiberHandleDiagnostics,
    pub(crate) fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) state_node_raw: u64,
    pub(crate) token_raw: u64,
    pub(crate) token_phase: HostFiberTokenPhase,
    pub(crate) target: Option<TestRendererHostNodeCleanupTarget>,
    pub(crate) status: TestRendererHostNodeCleanupStatus,
}

impl TestRendererHostNodeCleanupRecord {
    #[must_use]
    pub const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn deletion_list_index(self) -> usize {
        self.deletion_list_index
    }

    #[must_use]
    pub const fn deleted_index(self) -> usize {
        self.deleted_index
    }

    #[must_use]
    pub const fn subtree_index(self) -> usize {
        self.subtree_index
    }

    #[must_use]
    pub const fn parent(self) -> TestRendererFiberHandleDiagnostics {
        self.parent
    }

    #[must_use]
    pub const fn deleted_root(self) -> TestRendererFiberHandleDiagnostics {
        self.deleted_root
    }

    #[must_use]
    pub const fn fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.fiber
    }

    #[must_use]
    pub const fn state_node_raw(self) -> u64 {
        self.state_node_raw
    }

    #[must_use]
    pub const fn token_raw(self) -> u64 {
        self.token_raw
    }

    #[must_use]
    pub const fn token_phase(self) -> HostFiberTokenPhase {
        self.token_phase
    }

    #[must_use]
    pub const fn target(self) -> Option<TestRendererHostNodeCleanupTarget> {
        self.target
    }

    #[must_use]
    pub const fn status(self) -> TestRendererHostNodeCleanupStatus {
        self.status
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererHostNodeCleanupReport {
    pub(crate) root: FiberRootId,
    pub(crate) records: Vec<TestRendererHostNodeCleanupRecord>,
    pub(crate) active_instance_count: usize,
    pub(crate) active_text_count: usize,
    pub(crate) inactive_instance_count: usize,
    pub(crate) inactive_text_count: usize,
    pub(crate) public_unmount_compatibility_claimed: bool,
}

impl TestRendererHostNodeCleanupReport {
    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub fn records(&self) -> &[TestRendererHostNodeCleanupRecord] {
        &self.records
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub const fn active_instance_count(&self) -> usize {
        self.active_instance_count
    }

    #[must_use]
    pub const fn active_text_count(&self) -> usize {
        self.active_text_count
    }

    #[must_use]
    pub const fn inactive_instance_count(&self) -> usize {
        self.inactive_instance_count
    }

    #[must_use]
    pub const fn inactive_text_count(&self) -> usize {
        self.inactive_text_count
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(&self) -> bool {
        self.public_unmount_compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererUnmountHostChildDetachmentBlockers {
    pub(crate) detached_instance: bool,
    pub(crate) detached_instance_child_count: usize,
    pub(crate) host_node_cleanup_invalidated_count: usize,
    pub(crate) host_node_cleanup_already_inactive_count: usize,
    pub(crate) host_node_cleanup_missing_host_node_count: usize,
    pub(crate) host_node_cleanup_missing_state_node_count: usize,
    pub(crate) broad_host_child_detachment_blocked: bool,
    pub(crate) public_host_teardown_compatibility_claimed: bool,
    pub(crate) public_unmount_compatibility_claimed: bool,
    pub(crate) act_flushing_claimed: bool,
}

impl TestRendererUnmountHostChildDetachmentBlockers {
    #[must_use]
    pub const fn detached_instance(self) -> bool {
        self.detached_instance
    }

    #[must_use]
    pub const fn detached_instance_child_count(self) -> usize {
        self.detached_instance_child_count
    }

    #[must_use]
    pub const fn host_node_cleanup_invalidated_count(self) -> usize {
        self.host_node_cleanup_invalidated_count
    }

    #[must_use]
    pub const fn host_node_cleanup_already_inactive_count(self) -> usize {
        self.host_node_cleanup_already_inactive_count
    }

    #[must_use]
    pub const fn host_node_cleanup_missing_host_node_count(self) -> usize {
        self.host_node_cleanup_missing_host_node_count
    }

    #[must_use]
    pub const fn host_node_cleanup_missing_state_node_count(self) -> usize {
        self.host_node_cleanup_missing_state_node_count
    }

    #[must_use]
    pub const fn broad_host_child_detachment_blocked(self) -> bool {
        self.broad_host_child_detachment_blocked
    }

    #[must_use]
    pub const fn public_host_teardown_compatibility_claimed(self) -> bool {
        self.public_host_teardown_compatibility_claimed
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(self) -> bool {
        self.public_unmount_compatibility_claimed
    }

    #[must_use]
    pub const fn act_flushing_claimed(self) -> bool {
        self.act_flushing_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererUnmountPassiveRefCleanupOrderEvidence {
    pub(crate) diagnostic_id: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) ref_cleanup_return_count: usize,
    pub(crate) passive_destroy_count: usize,
    pub(crate) host_node_cleanup_count: usize,
    pub(crate) cleanup_order_record_count: usize,
    pub(crate) first_host_node_cleanup_order: Option<usize>,
    pub(crate) last_ref_cleanup_return_order: Option<usize>,
    pub(crate) first_passive_destroy_order: Option<usize>,
    pub(crate) last_passive_destroy_order: Option<usize>,
    pub(crate) ref_cleanup_return_precedes_passive_destroy: bool,
    pub(crate) host_cleanup_follows_ref_cleanup_return: bool,
    pub(crate) host_cleanup_follows_passive_destroy: bool,
    pub(crate) native_cleanup_after_ref_and_passive_ordering: bool,
    pub(crate) minimal_tree_ordering_is_host_cleanup_only: bool,
    pub(crate) ref_cleanup_return_callbacks_invoked: bool,
    pub(crate) passive_destroy_callbacks_invoked: bool,
    pub(crate) public_effects_flushed: bool,
    pub(crate) public_ref_or_effect_compatibility_claimed: bool,
    pub(crate) public_unmount_compatibility_claimed: bool,
    pub(crate) act_flushing_claimed: bool,
}

impl TestRendererUnmountPassiveRefCleanupOrderEvidence {
    #[must_use]
    pub const fn diagnostic_id(self) -> &'static str {
        self.diagnostic_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn ref_cleanup_return_count(self) -> usize {
        self.ref_cleanup_return_count
    }

    #[must_use]
    pub const fn passive_destroy_count(self) -> usize {
        self.passive_destroy_count
    }

    #[must_use]
    pub const fn host_node_cleanup_count(self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub const fn cleanup_order_record_count(self) -> usize {
        self.cleanup_order_record_count
    }

    #[must_use]
    pub const fn first_host_node_cleanup_order(self) -> Option<usize> {
        self.first_host_node_cleanup_order
    }

    #[must_use]
    pub const fn last_ref_cleanup_return_order(self) -> Option<usize> {
        self.last_ref_cleanup_return_order
    }

    #[must_use]
    pub const fn first_passive_destroy_order(self) -> Option<usize> {
        self.first_passive_destroy_order
    }

    #[must_use]
    pub const fn last_passive_destroy_order(self) -> Option<usize> {
        self.last_passive_destroy_order
    }

    #[must_use]
    pub const fn ref_cleanup_return_precedes_passive_destroy(self) -> bool {
        self.ref_cleanup_return_precedes_passive_destroy
    }

    #[must_use]
    pub const fn host_cleanup_follows_ref_cleanup_return(self) -> bool {
        self.host_cleanup_follows_ref_cleanup_return
    }

    #[must_use]
    pub const fn host_cleanup_follows_passive_destroy(self) -> bool {
        self.host_cleanup_follows_passive_destroy
    }

    #[must_use]
    pub const fn native_cleanup_after_ref_and_passive_ordering(self) -> bool {
        self.native_cleanup_after_ref_and_passive_ordering
    }

    #[must_use]
    pub const fn minimal_tree_ordering_is_host_cleanup_only(self) -> bool {
        self.minimal_tree_ordering_is_host_cleanup_only
    }

    #[must_use]
    pub const fn ref_cleanup_return_callbacks_invoked(self) -> bool {
        self.ref_cleanup_return_callbacks_invoked
    }

    #[must_use]
    pub const fn passive_destroy_callbacks_invoked(self) -> bool {
        self.passive_destroy_callbacks_invoked
    }

    #[must_use]
    pub const fn public_effects_flushed(self) -> bool {
        self.public_effects_flushed
    }

    #[must_use]
    pub const fn public_ref_or_effect_compatibility_claimed(self) -> bool {
        self.public_ref_or_effect_compatibility_claimed
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(self) -> bool {
        self.public_unmount_compatibility_claimed
    }

    #[must_use]
    pub const fn act_flushing_claimed(self) -> bool {
        self.act_flushing_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererUnmountDeletionCommitHandoffDiagnostics {
    pub(crate) diagnostic_id: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) lifecycle: TestRendererRootLifecycle,
    pub(crate) scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) scheduled_element: RootElementHandle,
    pub(crate) scheduled_element_is_none: bool,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) deleted_root: TestRendererFiberHandleDiagnostics,
    pub(crate) deleted_component: TestRendererFiberHandleDiagnostics,
    pub(crate) deleted_text: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current_is_store_current: bool,
    pub(crate) render_current_matches_commit_previous_current: bool,
    pub(crate) render_finished_work_matches_commit_current: bool,
    pub(crate) deletion_list_count: usize,
    pub(crate) deleted_root_count: usize,
    pub(crate) host_node_cleanup_count: usize,
    pub(crate) cleanup_records_match_deletion_commit: bool,
    pub(crate) cleanup_order_record_count: usize,
    pub(crate) public_unmount_compatibility_claimed: bool,
    pub(crate) public_host_teardown_compatibility_claimed: bool,
    pub(crate) act_flushing_claimed: bool,
    pub(crate) host_child_detachment_blockers: TestRendererUnmountHostChildDetachmentBlockers,
    pub(crate) passive_ref_cleanup_order: TestRendererUnmountPassiveRefCleanupOrderEvidence,
}

impl TestRendererUnmountDeletionCommitHandoffDiagnostics {
    #[must_use]
    pub const fn diagnostic_id(self) -> &'static str {
        self.diagnostic_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn lifecycle(self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn scheduled_element(self) -> RootElementHandle {
        self.scheduled_element
    }

    #[must_use]
    pub const fn scheduled_element_is_none(self) -> bool {
        self.scheduled_element_is_none
    }

    #[must_use]
    pub const fn render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.render_current
    }

    #[must_use]
    pub const fn commit_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_previous_current
    }

    #[must_use]
    pub const fn commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_current
    }

    #[must_use]
    pub const fn render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.render_finished_work
    }

    #[must_use]
    pub const fn render_lanes_bits(self) -> u32 {
        self.render_lanes_bits
    }

    #[must_use]
    pub const fn commit_finished_lanes_bits(self) -> u32 {
        self.commit_finished_lanes_bits
    }

    #[must_use]
    pub const fn deleted_root(self) -> TestRendererFiberHandleDiagnostics {
        self.deleted_root
    }

    #[must_use]
    pub const fn deleted_component(self) -> TestRendererFiberHandleDiagnostics {
        self.deleted_component
    }

    #[must_use]
    pub const fn deleted_text(self) -> TestRendererFiberHandleDiagnostics {
        self.deleted_text
    }

    #[must_use]
    pub const fn commit_current_is_store_current(self) -> bool {
        self.commit_current_is_store_current
    }

    #[must_use]
    pub const fn render_current_matches_commit_previous_current(self) -> bool {
        self.render_current_matches_commit_previous_current
    }

    #[must_use]
    pub const fn render_finished_work_matches_commit_current(self) -> bool {
        self.render_finished_work_matches_commit_current
    }

    #[must_use]
    pub const fn deletion_list_count(self) -> usize {
        self.deletion_list_count
    }

    #[must_use]
    pub const fn deleted_root_count(self) -> usize {
        self.deleted_root_count
    }

    #[must_use]
    pub const fn host_node_cleanup_count(self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub const fn cleanup_records_match_deletion_commit(self) -> bool {
        self.cleanup_records_match_deletion_commit
    }

    #[must_use]
    pub const fn cleanup_order_record_count(self) -> usize {
        self.cleanup_order_record_count
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(self) -> bool {
        self.public_unmount_compatibility_claimed
    }

    #[must_use]
    pub const fn public_host_teardown_compatibility_claimed(self) -> bool {
        self.public_host_teardown_compatibility_claimed
    }

    #[must_use]
    pub const fn act_flushing_claimed(self) -> bool {
        self.act_flushing_claimed
    }

    #[must_use]
    pub const fn host_child_detachment_blockers(
        self,
    ) -> TestRendererUnmountHostChildDetachmentBlockers {
        self.host_child_detachment_blockers
    }

    #[must_use]
    pub const fn passive_ref_cleanup_order(
        self,
    ) -> TestRendererUnmountPassiveRefCleanupOrderEvidence {
        self.passive_ref_cleanup_order
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererUnmountNativeBridgeAdmission {
    pub(crate) diagnostic_id: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) route_dependency_id: &'static str,
    pub(crate) deletion_commit_handoff_id: &'static str,
    pub(crate) cleanup_handoff_id: &'static str,
    pub(crate) scheduled_update_sequence: usize,
    pub(crate) lifecycle: TestRendererRootLifecycle,
    pub(crate) scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) scheduled_element_is_none: bool,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) deletion_commit_handoff_accepted: bool,
    pub(crate) cleanup_handoff_accepted: bool,
    pub(crate) lifecycle_evidence_accepted: bool,
    pub(crate) cleanup_blockers_accepted: bool,
    pub(crate) passive_ref_cleanup_order_accepted: bool,
    pub(crate) host_node_cleanup_count: usize,
    pub(crate) ref_cleanup_return_count: usize,
    pub(crate) passive_destroy_count: usize,
    pub(crate) cleanup_order_record_count: usize,
    pub(crate) native_cleanup_after_ref_and_passive_ordering: bool,
    pub(crate) rust_unmount_cleanup_handoff_executed: bool,
    pub(crate) host_output_produced: bool,
    pub(crate) minimal_tree_cleanup_handoff: bool,
    pub(crate) rejects_already_unmounted_roots: bool,
    pub(crate) rejects_stale_deletion_handoffs: bool,
    pub(crate) rejects_missing_cleanup_blockers: bool,
    pub(crate) public_unmount_compatibility_claimed: bool,
    pub(crate) public_host_teardown_compatibility_claimed: bool,
    pub(crate) act_flushing_claimed: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution: bool,
}

impl TestRendererUnmountNativeBridgeAdmission {
    #[must_use]
    pub const fn diagnostic_id(self) -> &'static str {
        self.diagnostic_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    pub(crate) const fn renderer_id(self) -> TestRendererId {
        self.renderer_id
    }

    #[must_use]
    pub const fn route_dependency_id(self) -> &'static str {
        self.route_dependency_id
    }

    #[must_use]
    pub const fn deletion_commit_handoff_id(self) -> &'static str {
        self.deletion_commit_handoff_id
    }

    #[must_use]
    pub const fn cleanup_handoff_id(self) -> &'static str {
        self.cleanup_handoff_id
    }

    #[must_use]
    pub const fn scheduled_update_sequence(self) -> usize {
        self.scheduled_update_sequence
    }

    #[must_use]
    pub const fn lifecycle(self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn scheduled_element_is_none(self) -> bool {
        self.scheduled_element_is_none
    }

    #[must_use]
    pub const fn render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.render_current
    }

    #[must_use]
    pub const fn render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_previous_current
    }

    #[must_use]
    pub const fn commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_current
    }

    #[must_use]
    pub const fn render_lanes_bits(self) -> u32 {
        self.render_lanes_bits
    }

    #[must_use]
    pub const fn commit_finished_lanes_bits(self) -> u32 {
        self.commit_finished_lanes_bits
    }

    #[must_use]
    pub const fn deletion_commit_handoff_accepted(self) -> bool {
        self.deletion_commit_handoff_accepted
    }

    #[must_use]
    pub const fn cleanup_handoff_accepted(self) -> bool {
        self.cleanup_handoff_accepted
    }

    #[must_use]
    pub const fn lifecycle_evidence_accepted(self) -> bool {
        self.lifecycle_evidence_accepted
    }

    #[must_use]
    pub const fn cleanup_blockers_accepted(self) -> bool {
        self.cleanup_blockers_accepted
    }

    #[must_use]
    pub const fn passive_ref_cleanup_order_accepted(self) -> bool {
        self.passive_ref_cleanup_order_accepted
    }

    #[must_use]
    pub const fn host_node_cleanup_count(self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub const fn ref_cleanup_return_count(self) -> usize {
        self.ref_cleanup_return_count
    }

    #[must_use]
    pub const fn passive_destroy_count(self) -> usize {
        self.passive_destroy_count
    }

    #[must_use]
    pub const fn cleanup_order_record_count(self) -> usize {
        self.cleanup_order_record_count
    }

    #[must_use]
    pub const fn native_cleanup_after_ref_and_passive_ordering(self) -> bool {
        self.native_cleanup_after_ref_and_passive_ordering
    }

    #[must_use]
    pub const fn rust_unmount_cleanup_handoff_executed(self) -> bool {
        self.rust_unmount_cleanup_handoff_executed
    }

    #[must_use]
    pub const fn host_output_produced(self) -> bool {
        self.host_output_produced
    }

    #[must_use]
    pub const fn minimal_tree_cleanup_handoff(self) -> bool {
        self.minimal_tree_cleanup_handoff
    }

    #[must_use]
    pub const fn rejects_already_unmounted_roots(self) -> bool {
        self.rejects_already_unmounted_roots
    }

    #[must_use]
    pub const fn rejects_stale_deletion_handoffs(self) -> bool {
        self.rejects_stale_deletion_handoffs
    }

    #[must_use]
    pub const fn rejects_missing_cleanup_blockers(self) -> bool {
        self.rejects_missing_cleanup_blockers
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(self) -> bool {
        self.public_unmount_compatibility_claimed
    }

    #[must_use]
    pub const fn public_host_teardown_compatibility_claimed(self) -> bool {
        self.public_host_teardown_compatibility_claimed
    }

    #[must_use]
    pub const fn act_flushing_claimed(self) -> bool {
        self.act_flushing_claimed
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(self) -> bool {
        self.native_execution
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererUnmountNativeBridgeCleanupHandoff {
    pub(crate) diagnostic_id: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) route_outcome: &'static str,
    pub(crate) route_dependency_id: &'static str,
    pub(crate) deletion_commit_handoff_id: &'static str,
    pub(crate) admission_diagnostic_id: &'static str,
    pub(crate) lifecycle: TestRendererRootLifecycle,
    pub(crate) scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) scheduled_element_is_none: bool,
    pub(crate) previous_root_child_count: usize,
    pub(crate) current_root_child_count: usize,
    pub(crate) detached_instance: bool,
    pub(crate) detached_instance_child_count: usize,
    pub(crate) host_node_cleanup_count: usize,
    pub(crate) ref_cleanup_return_count: usize,
    pub(crate) passive_destroy_count: usize,
    pub(crate) cleanup_order_record_count: usize,
    pub(crate) native_cleanup_after_ref_and_passive_ordering: bool,
    pub(crate) minimal_tree_cleanup_handoff: bool,
    pub(crate) rust_unmount_cleanup_handoff_executed: bool,
    pub(crate) host_output_produced: bool,
    pub(crate) passive_ref_cleanup_order: TestRendererUnmountPassiveRefCleanupOrderEvidence,
    pub(crate) deletion_commit_handoff: TestRendererUnmountDeletionCommitHandoffDiagnostics,
    pub(crate) native_bridge_admission: TestRendererUnmountNativeBridgeAdmission,
    pub(crate) public_unmount_compatibility_claimed: bool,
    pub(crate) public_host_teardown_compatibility_claimed: bool,
    pub(crate) act_flushing_claimed: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution: bool,
}

impl TestRendererUnmountNativeBridgeCleanupHandoff {
    #[must_use]
    pub const fn diagnostic_id(self) -> &'static str {
        self.diagnostic_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn route_outcome(self) -> &'static str {
        self.route_outcome
    }

    #[must_use]
    pub const fn route_dependency_id(self) -> &'static str {
        self.route_dependency_id
    }

    #[must_use]
    pub const fn deletion_commit_handoff_id(self) -> &'static str {
        self.deletion_commit_handoff_id
    }

    #[must_use]
    pub const fn admission_diagnostic_id(self) -> &'static str {
        self.admission_diagnostic_id
    }

    #[must_use]
    pub const fn lifecycle(self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn scheduled_element_is_none(self) -> bool {
        self.scheduled_element_is_none
    }

    #[must_use]
    pub const fn previous_root_child_count(self) -> usize {
        self.previous_root_child_count
    }

    #[must_use]
    pub const fn current_root_child_count(self) -> usize {
        self.current_root_child_count
    }

    #[must_use]
    pub const fn detached_instance(self) -> bool {
        self.detached_instance
    }

    #[must_use]
    pub const fn detached_instance_child_count(self) -> usize {
        self.detached_instance_child_count
    }

    #[must_use]
    pub const fn host_node_cleanup_count(self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub const fn ref_cleanup_return_count(self) -> usize {
        self.ref_cleanup_return_count
    }

    #[must_use]
    pub const fn passive_destroy_count(self) -> usize {
        self.passive_destroy_count
    }

    #[must_use]
    pub const fn cleanup_order_record_count(self) -> usize {
        self.cleanup_order_record_count
    }

    #[must_use]
    pub const fn native_cleanup_after_ref_and_passive_ordering(self) -> bool {
        self.native_cleanup_after_ref_and_passive_ordering
    }

    #[must_use]
    pub const fn minimal_tree_cleanup_handoff(self) -> bool {
        self.minimal_tree_cleanup_handoff
    }

    #[must_use]
    pub const fn rust_unmount_cleanup_handoff_executed(self) -> bool {
        self.rust_unmount_cleanup_handoff_executed
    }

    #[must_use]
    pub const fn host_output_produced(self) -> bool {
        self.host_output_produced
    }

    #[must_use]
    pub const fn passive_ref_cleanup_order(
        self,
    ) -> TestRendererUnmountPassiveRefCleanupOrderEvidence {
        self.passive_ref_cleanup_order
    }

    #[must_use]
    pub const fn deletion_commit_handoff(
        self,
    ) -> TestRendererUnmountDeletionCommitHandoffDiagnostics {
        self.deletion_commit_handoff
    }

    #[must_use]
    pub const fn native_bridge_admission(self) -> TestRendererUnmountNativeBridgeAdmission {
        self.native_bridge_admission
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(self) -> bool {
        self.public_unmount_compatibility_claimed
    }

    #[must_use]
    pub const fn public_host_teardown_compatibility_claimed(self) -> bool {
        self.public_host_teardown_compatibility_claimed
    }

    #[must_use]
    pub const fn act_flushing_claimed(self) -> bool {
        self.act_flushing_claimed
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(self) -> bool {
        self.native_execution
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct TestRendererHostNodeStore {
    pub(crate) records: Vec<TestRendererHostNodeStoreRecord>,
}

impl TestRendererHostNodeStore {
    pub(crate) fn track_current(
        &mut self,
        current: TestRendererHostOutputCanaryCurrentFibers,
        component_state_node_raw: u64,
        text_state_node_raw: u64,
    ) {
        macro_rules! fiber_handle {
            ($fiber:expr) => {{
                let fiber = $fiber;
                TestRendererFiberHandleDiagnostics {
                    arena_id: fiber.arena_id().get(),
                    slot: fiber.slot().get(),
                    generation: fiber.generation().get(),
                }
            }};
        }

        self.records.push(TestRendererHostNodeStoreRecord {
            root: current.root(),
            fiber: fiber_handle!(current.component()),
            state_node_raw: component_state_node_raw,
            target: TestRendererHostNodeCleanupTarget::Instance,
            active: true,
        });
        self.records.push(TestRendererHostNodeStoreRecord {
            root: current.root(),
            fiber: fiber_handle!(current.text()),
            state_node_raw: text_state_node_raw,
            target: TestRendererHostNodeCleanupTarget::Text,
            active: true,
        });
    }

    pub(crate) fn retarget_current(&mut self, current: TestRendererHostOutputCanaryCurrentFibers) {
        macro_rules! fiber_handle {
            ($fiber:expr) => {{
                let fiber = $fiber;
                TestRendererFiberHandleDiagnostics {
                    arena_id: fiber.arena_id().get(),
                    slot: fiber.slot().get(),
                    generation: fiber.generation().get(),
                }
            }};
        }

        for record in &mut self.records {
            if !record.active || record.root != current.root() {
                continue;
            }
            record.fiber = match record.target {
                TestRendererHostNodeCleanupTarget::Instance => fiber_handle!(current.component()),
                TestRendererHostNodeCleanupTarget::Text => fiber_handle!(current.text()),
            };
        }
    }

    pub(crate) fn apply_cleanup(
        &mut self,
        root: FiberRootId,
        commit: &HostRootCommitRecord,
    ) -> TestRendererHostNodeCleanupReport {
        let mut records = Vec::new();
        for cleanup in commit.host_node_deletion_cleanup_log().records() {
            macro_rules! fiber_handle {
                ($fiber:expr) => {{
                    let fiber = $fiber;
                    TestRendererFiberHandleDiagnostics {
                        arena_id: fiber.arena_id().get(),
                        slot: fiber.slot().get(),
                        generation: fiber.generation().get(),
                    }
                }};
            }

            let target =
                TestRendererHostNodeCleanupTarget::from_host_target(cleanup.token_target());
            let fiber = fiber_handle!(cleanup.fiber());
            let state_node_raw = cleanup.state_node().raw();
            let status = match target {
                Some(_) if state_node_raw == 0 => {
                    TestRendererHostNodeCleanupStatus::MissingStateNode
                }
                Some(target) => self.invalidate(root, fiber, state_node_raw, target),
                None => TestRendererHostNodeCleanupStatus::UnsupportedTarget,
            };
            records.push(TestRendererHostNodeCleanupRecord {
                sequence: cleanup.sequence(),
                root: cleanup.root(),
                deletion_list_index: cleanup.deletion_list_index(),
                deleted_index: cleanup.deleted_index(),
                subtree_index: cleanup.subtree_index(),
                parent: fiber_handle!(cleanup.parent()),
                deleted_root: fiber_handle!(cleanup.deleted_root()),
                fiber,
                state_node_raw,
                token_raw: cleanup.token().raw(),
                token_phase: cleanup.token_phase(),
                target,
                status,
            });
        }

        TestRendererHostNodeCleanupReport {
            root,
            records,
            active_instance_count: self.active_count(TestRendererHostNodeCleanupTarget::Instance),
            active_text_count: self.active_count(TestRendererHostNodeCleanupTarget::Text),
            inactive_instance_count: self
                .inactive_count(TestRendererHostNodeCleanupTarget::Instance),
            inactive_text_count: self.inactive_count(TestRendererHostNodeCleanupTarget::Text),
            public_unmount_compatibility_claimed: commit
                .host_node_deletion_cleanup_log()
                .public_unmount_compatibility_claimed(),
        }
    }

    pub(crate) fn invalidate(
        &mut self,
        root: FiberRootId,
        fiber: TestRendererFiberHandleDiagnostics,
        state_node_raw: u64,
        target: TestRendererHostNodeCleanupTarget,
    ) -> TestRendererHostNodeCleanupStatus {
        if let Some(record) = self.records.iter_mut().find(|record| {
            record.active
                && record.root == root
                && record.fiber == fiber
                && record.state_node_raw == state_node_raw
                && record.target == target
        }) {
            record.active = false;
            return TestRendererHostNodeCleanupStatus::Invalidated;
        }

        if self.records.iter().any(|record| {
            !record.active
                && record.root == root
                && record.fiber == fiber
                && record.state_node_raw == state_node_raw
                && record.target == target
        }) {
            TestRendererHostNodeCleanupStatus::AlreadyInactive
        } else {
            TestRendererHostNodeCleanupStatus::MissingHostNode
        }
    }

    pub(crate) fn active_count(&self, target: TestRendererHostNodeCleanupTarget) -> usize {
        self.records
            .iter()
            .filter(|record| record.target == target && record.active)
            .count()
    }

    pub(crate) fn inactive_count(&self, target: TestRendererHostNodeCleanupTarget) -> usize {
        self.records
            .iter()
            .filter(|record| record.target == target && !record.active)
            .count()
    }

    #[cfg(test)]
    pub(crate) fn active_total(&self) -> usize {
        self.records.iter().filter(|record| record.active).count()
    }

    #[cfg(test)]
    pub(crate) fn inactive_total(&self) -> usize {
        self.records.iter().filter(|record| !record.active).count()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestRendererHostNodeStoreRecord {
    pub(crate) root: FiberRootId,
    pub(crate) fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) state_node_raw: u64,
    pub(crate) target: TestRendererHostNodeCleanupTarget,
    pub(crate) active: bool,
}
