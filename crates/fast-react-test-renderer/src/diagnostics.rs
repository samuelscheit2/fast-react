use super::*;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestRendererHostOutputFixture {
    pub(crate) element: RootElementHandle,
    pub(crate) element_type: TestElementType,
    pub(crate) props: TestProps,
    pub(crate) text: String,
    pub(crate) canary_fixture: TestRendererHostOutputCanaryFixture,
}

impl TestRendererHostOutputFixture {
    pub(crate) fn new_with_props(
        element: RootElementHandle,
        element_type: TestElementType,
        props: TestProps,
        text: String,
    ) -> Self {
        let base_raw = element.raw();
        Self {
            element,
            element_type,
            props,
            text,
            canary_fixture: TestRendererHostOutputCanaryFixture::new(
                base_raw,
                base_raw.saturating_mul(2).saturating_sub(1),
                base_raw.saturating_mul(2),
            ),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestRendererCurrentHostOutput {
    pub(crate) fixture: TestRendererHostOutputFixture,
    pub(crate) fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) instance: TestInstance,
    pub(crate) text: TestTextInstance,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestRendererNestedHostOutputFixture {
    pub(crate) element: RootElementHandle,
    pub(crate) outer_element_type: TestElementType,
    pub(crate) outer_props: TestProps,
    pub(crate) inner_element_type: TestElementType,
    pub(crate) inner_props: TestProps,
    pub(crate) text: String,
    pub(crate) outer_canary_fixture: TestRendererHostOutputCanaryFixture,
    pub(crate) inner_canary_fixture: TestRendererHostOutputCanaryFixture,
}

impl TestRendererNestedHostOutputFixture {
    pub(crate) fn new(
        element: RootElementHandle,
        outer_element_type: TestElementType,
        inner_element_type: TestElementType,
        text: String,
    ) -> Self {
        let base_raw = element.raw();
        Self {
            element,
            outer_element_type,
            outer_props: TestProps::new(),
            inner_element_type,
            inner_props: TestProps::new(),
            text,
            outer_canary_fixture: TestRendererHostOutputCanaryFixture::new(
                base_raw,
                base_raw.saturating_mul(3).saturating_sub(2),
                base_raw.saturating_mul(3),
            ),
            inner_canary_fixture: TestRendererHostOutputCanaryFixture::new(
                base_raw.saturating_add(1),
                base_raw.saturating_mul(3).saturating_sub(1),
                base_raw.saturating_mul(3),
            ),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestRendererCurrentNestedHostOutput {
    pub(crate) fixture: TestRendererNestedHostOutputFixture,
    pub(crate) outer_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) inner_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) outer_instance: TestInstance,
    pub(crate) inner_instance: TestInstance,
    pub(crate) text: TestTextInstance,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestRendererPrivateJsonCurrentFibersForCanary {
    Host(TestRendererHostOutputCanaryCurrentFibers),
    Nested {
        outer: TestRendererHostOutputCanaryCurrentFibers,
        inner: TestRendererHostOutputCanaryCurrentFibers,
    },
    SiblingText {
        root_text: TestRendererFiberHandleDiagnostics,
        root_text_props_raw: u64,
        component: TestRendererHostOutputCanaryCurrentFibers,
    },
}

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

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererCommittedHostOutput {
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) prepared_fibers: TestRendererHostOutputCanaryPreparedFibers,
    pub(crate) completed_fibers: TestRendererHostOutputCanaryCompletedFibers,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) fiber_inspection: TestRendererCommittedFiberTreeInspection,
    pub(crate) snapshot: TestContainerSnapshot,
}

impl TestRendererCommittedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn prepared_fibers(&self) -> TestRendererHostOutputCanaryPreparedFibers {
        self.prepared_fibers
    }

    #[must_use]
    pub const fn completed_fibers(&self) -> TestRendererHostOutputCanaryCompletedFibers {
        self.completed_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn fiber_inspection(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.fiber_inspection
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererUpdatedHostOutput {
    pub(crate) scheduled_update_sequence: usize,
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) updated_fibers: TestRendererHostOutputCanaryUpdatedFibers,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) fiber_inspection: TestRendererCommittedFiberTreeInspection,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) previous_snapshot: TestContainerSnapshot,
    pub(crate) snapshot: TestContainerSnapshot,
}

impl TestRendererUpdatedHostOutput {
    #[must_use]
    pub const fn scheduled_update_sequence(&self) -> usize {
        self.scheduled_update_sequence
    }

    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn updated_fibers(&self) -> TestRendererHostOutputCanaryUpdatedFibers {
        self.updated_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn fiber_inspection(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.fiber_inspection
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererSiblingTextHostOutput {
    pub(crate) scheduled_update_sequence: usize,
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) stable_fibers: TestRendererHostOutputCanaryUpdatedFibers,
    pub(crate) root_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) root_text_props_raw: u64,
    pub(crate) root_text_state_node_raw: u64,
    pub(crate) component_state_node_raw: u64,
    pub(crate) component_text_state_node_raw: u64,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) fiber_inspection: TestRendererCommittedFiberTreeInspection,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) previous_snapshot: TestContainerSnapshot,
    pub(crate) snapshot: TestContainerSnapshot,
    pub(crate) root_text_snapshot: TestTextSnapshot,
}

impl TestRendererSiblingTextHostOutput {
    #[must_use]
    pub const fn scheduled_update_sequence(&self) -> usize {
        self.scheduled_update_sequence
    }

    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn stable_fibers(&self) -> TestRendererHostOutputCanaryUpdatedFibers {
        self.stable_fibers
    }

    #[must_use]
    pub const fn root_text_fiber(&self) -> TestRendererFiberHandleDiagnostics {
        self.root_text_fiber
    }

    #[must_use]
    pub const fn root_text_props_raw(&self) -> u64 {
        self.root_text_props_raw
    }

    #[must_use]
    pub const fn root_text_state_node_raw(&self) -> u64 {
        self.root_text_state_node_raw
    }

    #[must_use]
    pub const fn component_state_node_raw(&self) -> u64 {
        self.component_state_node_raw
    }

    #[must_use]
    pub const fn component_text_state_node_raw(&self) -> u64 {
        self.component_text_state_node_raw
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn fiber_inspection(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.fiber_inspection
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub const fn root_text_snapshot(&self) -> &TestTextSnapshot {
        &self.root_text_snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererHostParentPlacedHostOutput {
    pub(crate) scheduled_update_sequence: usize,
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) updated_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) placed_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) placed_text_props_raw: u64,
    pub(crate) parent_state_node_raw: u64,
    pub(crate) placed_text_state_node_raw: u64,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) previous_snapshot: TestContainerSnapshot,
    pub(crate) snapshot: TestContainerSnapshot,
    pub(crate) placed_text_snapshot: TestTextSnapshot,
    pub(crate) host_parent_placement_apply_count: usize,
}

impl TestRendererHostParentPlacedHostOutput {
    #[must_use]
    pub const fn scheduled_update_sequence(&self) -> usize {
        self.scheduled_update_sequence
    }

    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn updated_fibers(&self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.updated_fibers
    }

    #[must_use]
    pub const fn placed_text_fiber(&self) -> TestRendererFiberHandleDiagnostics {
        self.placed_text_fiber
    }

    #[must_use]
    pub const fn placed_text_props_raw(&self) -> u64 {
        self.placed_text_props_raw
    }

    #[must_use]
    pub const fn parent_state_node_raw(&self) -> u64 {
        self.parent_state_node_raw
    }

    #[must_use]
    pub const fn placed_text_state_node_raw(&self) -> u64 {
        self.placed_text_state_node_raw
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub const fn placed_text_snapshot(&self) -> &TestTextSnapshot {
        &self.placed_text_snapshot
    }

    #[must_use]
    pub const fn host_parent_placement_apply_count(&self) -> usize {
        self.host_parent_placement_apply_count
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererNestedCommittedHostOutput {
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) outer_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) inner_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) fiber_inspection: TestRendererCommittedFiberTreeInspection,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) snapshot: TestContainerSnapshot,
}

impl TestRendererNestedCommittedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn outer_fibers(&self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.outer_fibers
    }

    #[must_use]
    pub const fn inner_fibers(&self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.inner_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn fiber_inspection(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.fiber_inspection
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererNestedHostParentPlacedHostOutput {
    pub(crate) scheduled_update_sequence: usize,
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) outer_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) inner_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) fiber_inspection: TestRendererCommittedFiberTreeInspection,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) previous_snapshot: TestContainerSnapshot,
    pub(crate) snapshot: TestContainerSnapshot,
    pub(crate) placed_text_snapshot: TestTextSnapshot,
    pub(crate) nested_parent_state_node_raw: u64,
    pub(crate) placed_text_state_node_raw: u64,
    pub(crate) host_parent_placement_apply_count: usize,
}

impl TestRendererNestedHostParentPlacedHostOutput {
    #[must_use]
    pub const fn scheduled_update_sequence(&self) -> usize {
        self.scheduled_update_sequence
    }

    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn outer_fibers(&self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.outer_fibers
    }

    #[must_use]
    pub const fn inner_fibers(&self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.inner_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn fiber_inspection(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.fiber_inspection
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub const fn placed_text_snapshot(&self) -> &TestTextSnapshot {
        &self.placed_text_snapshot
    }

    #[must_use]
    pub const fn nested_parent_state_node_raw(&self) -> u64 {
        self.nested_parent_state_node_raw
    }

    #[must_use]
    pub const fn placed_text_state_node_raw(&self) -> u64 {
        self.placed_text_state_node_raw
    }

    #[must_use]
    pub const fn host_parent_placement_apply_count(&self) -> usize {
        self.host_parent_placement_apply_count
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererUnmountedHostOutput {
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) deleted_fibers: TestRendererHostOutputCanaryDeletedFibers,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) host_node_cleanup: TestRendererHostNodeCleanupReport,
    pub(crate) previous_snapshot: TestContainerSnapshot,
    pub(crate) snapshot: TestContainerSnapshot,
    pub(crate) detached_instance_snapshot: TestElementSnapshot,
}

impl TestRendererUnmountedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn deleted_fibers(&self) -> TestRendererHostOutputCanaryDeletedFibers {
        self.deleted_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn host_node_cleanup(&self) -> &TestRendererHostNodeCleanupReport {
        &self.host_node_cleanup
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub const fn detached_instance_snapshot(&self) -> &TestElementSnapshot {
        &self.detached_instance_snapshot
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererStableSiblingInsertionApplyKind {
    InsertInContainerBefore,
    InsertionBlocked,
    AppendToContainer,
    Other,
}

impl TestRendererStableSiblingInsertionApplyKind {
    pub(crate) fn from_reconciler_apply_kind(kind: &str) -> Self {
        match kind {
            "insert-placement-in-container-before" => Self::InsertInContainerBefore,
            "record-placement-insertion-blocked" => Self::InsertionBlocked,
            "append-placement-to-container" => Self::AppendToContainer,
            _ => Self::Other,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererStableSiblingInsertionSiblingStatus {
    Append,
    InsertBefore,
    BlockedPendingPlacement,
    BlockedUnsupportedTag,
    BlockedMissingStateNode,
    MissingPlacementSiblingRecord,
    Other,
}

impl TestRendererStableSiblingInsertionSiblingStatus {
    pub(crate) fn from_reconciler_sibling_status(status: &str) -> Self {
        match status {
            "append" => Self::Append,
            "insert-before" => Self::InsertBefore,
            "blocked-pending-placement" => Self::BlockedPendingPlacement,
            "blocked-unsupported-tag" => Self::BlockedUnsupportedTag,
            "blocked-missing-state-node" => Self::BlockedMissingStateNode,
            "missing-placement-sibling-record" => Self::MissingPlacementSiblingRecord,
            _ => Self::Other,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererStableSiblingInsertionMutationStatus {
    AppliedInsertInContainerBefore,
    RecordedOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererStableSiblingInsertionDiagnostics {
    pub(crate) apply_kind: TestRendererStableSiblingInsertionApplyKind,
    pub(crate) sibling_status: TestRendererStableSiblingInsertionSiblingStatus,
    pub(crate) mutation_status: TestRendererStableSiblingInsertionMutationStatus,
    pub(crate) fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) sibling: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) state_node_raw: u64,
    pub(crate) sibling_state_node_raw: u64,
    pub(crate) can_insert_before: bool,
}

impl TestRendererStableSiblingInsertionDiagnostics {
    #[must_use]
    pub const fn apply_kind(self) -> TestRendererStableSiblingInsertionApplyKind {
        self.apply_kind
    }

    #[must_use]
    pub const fn sibling_status(self) -> TestRendererStableSiblingInsertionSiblingStatus {
        self.sibling_status
    }

    #[must_use]
    pub const fn mutation_status(self) -> TestRendererStableSiblingInsertionMutationStatus {
        self.mutation_status
    }

    #[must_use]
    pub const fn fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.fiber
    }

    #[must_use]
    pub const fn sibling(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.sibling
    }

    #[must_use]
    pub const fn state_node_raw(self) -> u64 {
        self.state_node_raw
    }

    #[must_use]
    pub const fn sibling_state_node_raw(self) -> u64 {
        self.sibling_state_node_raw
    }

    #[must_use]
    pub const fn can_insert_before(self) -> bool {
        self.can_insert_before
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererStableSiblingInsertedHostOutput {
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) stable_fibers: TestRendererHostOutputCanaryUpdatedFibers,
    pub(crate) inserted_fibers: TestRendererHostOutputCanaryCompletedFibers,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) insertion_diagnostics: TestRendererStableSiblingInsertionDiagnostics,
    pub(crate) previous_snapshot: TestContainerSnapshot,
    pub(crate) snapshot: TestContainerSnapshot,
}

impl TestRendererStableSiblingInsertedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn stable_fibers(&self) -> TestRendererHostOutputCanaryUpdatedFibers {
        self.stable_fibers
    }

    #[must_use]
    pub const fn inserted_fibers(&self) -> TestRendererHostOutputCanaryCompletedFibers {
        self.inserted_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn insertion_diagnostics(&self) -> TestRendererStableSiblingInsertionDiagnostics {
        self.insertion_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererRootScheduledUpdate {
    pub(crate) kind: TestRendererRootUpdateKind,
    pub(crate) element: RootElementHandle,
    pub(crate) container_update: UpdateContainerResult,
    pub(crate) root_schedule: ScheduledRootUpdateResult,
}

impl TestRendererRootScheduledUpdate {
    #[must_use]
    pub const fn kind(&self) -> TestRendererRootUpdateKind {
        self.kind
    }

    #[must_use]
    pub const fn element(&self) -> RootElementHandle {
        self.element
    }

    #[must_use]
    pub const fn container_update(&self) -> &UpdateContainerResult {
        &self.container_update
    }

    #[must_use]
    pub const fn root_schedule(&self) -> ScheduledRootUpdateResult {
        self.root_schedule
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererRootUpdateOutcome {
    Scheduled(TestRendererRootScheduledUpdate),
    IgnoredAfterUnmount,
    AlreadyUnmountScheduled,
}

impl TestRendererRootUpdateOutcome {
    #[must_use]
    pub const fn scheduled(&self) -> Option<&TestRendererRootScheduledUpdate> {
        match self {
            Self::Scheduled(record) => Some(record),
            Self::IgnoredAfterUnmount | Self::AlreadyUnmountScheduled => None,
        }
    }

    #[must_use]
    pub const fn code(&self) -> &'static str {
        match self {
            Self::Scheduled(_) => "Scheduled",
            Self::IgnoredAfterUnmount => "IgnoredAfterUnmount",
            Self::AlreadyUnmountScheduled => "AlreadyUnmountScheduled",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateUpdateRouteQueueDiagnostics {
    pub(crate) root: FiberRootId,
    pub(crate) scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) scheduled_element: RootElementHandle,
    pub(crate) update_raw: u64,
    pub(crate) queue_raw: u64,
    pub(crate) schedule_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) lane_bits: u32,
    pub(crate) pending_lanes_before_enqueue_bits: u32,
    pub(crate) pending_lanes_after_enqueue_bits: u32,
    pub(crate) selected_next_lanes_bits: u32,
    pub(crate) render_lanes_bits: u32,
    pub(crate) queue_matches_render_current_queue: bool,
    pub(crate) selected_lanes_match_render_lanes: bool,
    pub(crate) pending_lanes_after_enqueue_match_render_lanes: bool,
    pub(crate) root_schedule_inserted: bool,
    pub(crate) root_schedule_microtask_requested: bool,
    pub(crate) root_schedule_might_have_pending_sync_work: bool,
}

impl TestRendererPrivateUpdateRouteQueueDiagnostics {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
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
    pub const fn update_raw(self) -> u64 {
        self.update_raw
    }

    #[must_use]
    pub const fn queue_raw(self) -> u64 {
        self.queue_raw
    }

    #[must_use]
    pub const fn schedule_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.schedule_fiber
    }

    #[must_use]
    pub const fn lane_bits(self) -> u32 {
        self.lane_bits
    }

    #[must_use]
    pub const fn pending_lanes_before_enqueue_bits(self) -> u32 {
        self.pending_lanes_before_enqueue_bits
    }

    #[must_use]
    pub const fn pending_lanes_after_enqueue_bits(self) -> u32 {
        self.pending_lanes_after_enqueue_bits
    }

    #[must_use]
    pub const fn selected_next_lanes_bits(self) -> u32 {
        self.selected_next_lanes_bits
    }

    #[must_use]
    pub const fn render_lanes_bits(self) -> u32 {
        self.render_lanes_bits
    }

    #[must_use]
    pub const fn queue_matches_render_current_queue(self) -> bool {
        self.queue_matches_render_current_queue
    }

    #[must_use]
    pub const fn selected_lanes_match_render_lanes(self) -> bool {
        self.selected_lanes_match_render_lanes
    }

    #[must_use]
    pub const fn pending_lanes_after_enqueue_match_render_lanes(self) -> bool {
        self.pending_lanes_after_enqueue_match_render_lanes
    }

    #[must_use]
    pub const fn root_schedule_inserted(self) -> bool {
        self.root_schedule_inserted
    }

    #[must_use]
    pub const fn root_schedule_microtask_requested(self) -> bool {
        self.root_schedule_microtask_requested
    }

    #[must_use]
    pub const fn root_schedule_might_have_pending_sync_work(self) -> bool {
        self.root_schedule_might_have_pending_sync_work
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateUpdateRouteWorkLoopDiagnostics {
    pub(crate) root: FiberRootId,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) current_update_queue_raw: u64,
    pub(crate) work_in_progress_update_queue_raw: u64,
    pub(crate) committed_current_update_queue_raw: u64,
    pub(crate) applied_update_count: usize,
    pub(crate) skipped_update_count: usize,
    pub(crate) remaining_lanes_empty: bool,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) commit_remaining_lanes_empty: bool,
    pub(crate) commit_pending_lanes_empty: bool,
    pub(crate) commit_current_matches_render_finished_work: bool,
    pub(crate) commit_previous_current_matches_render_current: bool,
    pub(crate) commit_lanes_match_render_lanes: bool,
    pub(crate) committed_current_queue_matches_work_in_progress: bool,
    pub(crate) root_current_matches_commit_current: bool,
}

impl TestRendererPrivateUpdateRouteWorkLoopDiagnostics {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
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
    pub const fn commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_current
    }

    #[must_use]
    pub const fn current_update_queue_raw(self) -> u64 {
        self.current_update_queue_raw
    }

    #[must_use]
    pub const fn work_in_progress_update_queue_raw(self) -> u64 {
        self.work_in_progress_update_queue_raw
    }

    #[must_use]
    pub const fn committed_current_update_queue_raw(self) -> u64 {
        self.committed_current_update_queue_raw
    }

    #[must_use]
    pub const fn applied_update_count(self) -> usize {
        self.applied_update_count
    }

    #[must_use]
    pub const fn skipped_update_count(self) -> usize {
        self.skipped_update_count
    }

    #[must_use]
    pub const fn remaining_lanes_empty(self) -> bool {
        self.remaining_lanes_empty
    }

    #[must_use]
    pub const fn commit_finished_lanes_bits(self) -> u32 {
        self.commit_finished_lanes_bits
    }

    #[must_use]
    pub const fn commit_remaining_lanes_empty(self) -> bool {
        self.commit_remaining_lanes_empty
    }

    #[must_use]
    pub const fn commit_pending_lanes_empty(self) -> bool {
        self.commit_pending_lanes_empty
    }

    #[must_use]
    pub const fn commit_current_matches_render_finished_work(self) -> bool {
        self.commit_current_matches_render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current_matches_render_current(self) -> bool {
        self.commit_previous_current_matches_render_current
    }

    #[must_use]
    pub const fn commit_lanes_match_render_lanes(self) -> bool {
        self.commit_lanes_match_render_lanes
    }

    #[must_use]
    pub const fn committed_current_queue_matches_work_in_progress(self) -> bool {
        self.committed_current_queue_matches_work_in_progress
    }

    #[must_use]
    pub const fn root_current_matches_commit_current(self) -> bool {
        self.root_current_matches_commit_current
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateUpdateRouteHostTextDiagnostics {
    pub(crate) previous_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) updated_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) text_state_node_raw: u64,
    pub(crate) host_component_prop_update_recorded: bool,
    pub(crate) host_component_style_update_recorded: bool,
    pub(crate) text_update_apply_recorded: bool,
    pub(crate) host_text_update_apply_count: usize,
    pub(crate) host_component_update_apply_count: usize,
}

impl TestRendererPrivateUpdateRouteHostTextDiagnostics {
    #[must_use]
    pub const fn previous_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.previous_text_fiber
    }

    #[must_use]
    pub const fn updated_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.updated_text_fiber
    }

    #[must_use]
    pub const fn text_state_node_raw(self) -> u64 {
        self.text_state_node_raw
    }

    #[must_use]
    pub const fn host_component_prop_update_recorded(self) -> bool {
        self.host_component_prop_update_recorded
    }

    #[must_use]
    pub const fn host_component_style_update_recorded(self) -> bool {
        self.host_component_style_update_recorded
    }

    #[must_use]
    pub const fn text_update_apply_recorded(self) -> bool {
        self.text_update_apply_recorded
    }

    #[must_use]
    pub const fn host_text_update_apply_count(self) -> usize {
        self.host_text_update_apply_count
    }

    #[must_use]
    pub const fn host_component_update_apply_count(self) -> usize {
        self.host_component_update_apply_count
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateUpdateRouteAdmissionRecord {
    pub(crate) record_id: &'static str,
    pub(crate) status: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) scheduled_update_sequence: usize,
    pub(crate) request_api: &'static str,
    pub(crate) source_diagnostic_name: &'static str,
    pub(crate) source_diagnostic_status: &'static str,
    pub(crate) lifecycle: TestRendererRootLifecycle,
    pub(crate) scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) consumes_accepted_host_root_update_queue_metadata: bool,
    pub(crate) consumes_accepted_root_work_loop_metadata: bool,
    pub(crate) consumes_accepted_host_output_metadata: bool,
    pub(crate) rejects_stale_root_lifecycle: bool,
    pub(crate) rejects_stale_host_output: bool,
    pub(crate) rejects_missing_update_queue_evidence: bool,
    pub(crate) public_root_update_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateUpdateRouteAdmissionRecord {
    #[must_use]
    pub const fn record_id(self) -> &'static str {
        self.record_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    pub(crate) const fn renderer_id(self) -> TestRendererId {
        self.renderer_id
    }

    #[must_use]
    pub const fn scheduled_update_sequence(self) -> usize {
        self.scheduled_update_sequence
    }

    #[must_use]
    pub const fn request_api(self) -> &'static str {
        self.request_api
    }

    #[must_use]
    pub const fn source_diagnostic_name(self) -> &'static str {
        self.source_diagnostic_name
    }

    #[must_use]
    pub const fn source_diagnostic_status(self) -> &'static str {
        self.source_diagnostic_status
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
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
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
    pub const fn consumes_accepted_host_root_update_queue_metadata(self) -> bool {
        self.consumes_accepted_host_root_update_queue_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_root_work_loop_metadata(self) -> bool {
        self.consumes_accepted_root_work_loop_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_host_output_metadata(self) -> bool {
        self.consumes_accepted_host_output_metadata
    }

    #[must_use]
    pub const fn rejects_stale_root_lifecycle(self) -> bool {
        self.rejects_stale_root_lifecycle
    }

    #[must_use]
    pub const fn rejects_stale_host_output(self) -> bool {
        self.rejects_stale_host_output
    }

    #[must_use]
    pub const fn rejects_missing_update_queue_evidence(self) -> bool {
        self.rejects_missing_update_queue_evidence
    }

    #[must_use]
    pub const fn public_root_update_available(self) -> bool {
        self.public_root_update_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateUpdateRouteDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) update_queue: TestRendererPrivateUpdateRouteQueueDiagnostics,
    pub(crate) root_work_loop: TestRendererPrivateUpdateRouteWorkLoopDiagnostics,
    pub(crate) host_text_update: TestRendererPrivateUpdateRouteHostTextDiagnostics,
    pub(crate) admission: TestRendererPrivateUpdateRouteAdmissionRecord,
    pub(crate) consumes_accepted_host_root_update_queue_metadata: bool,
    pub(crate) consumes_accepted_root_work_loop_metadata: bool,
    pub(crate) consumes_manual_host_output_canary: bool,
    pub(crate) public_root_update_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateUpdateRouteDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn update_queue(&self) -> TestRendererPrivateUpdateRouteQueueDiagnostics {
        self.update_queue
    }

    #[must_use]
    pub const fn root_work_loop(&self) -> TestRendererPrivateUpdateRouteWorkLoopDiagnostics {
        self.root_work_loop
    }

    #[must_use]
    pub const fn host_text_update(&self) -> TestRendererPrivateUpdateRouteHostTextDiagnostics {
        self.host_text_update
    }

    #[must_use]
    pub const fn admission(&self) -> TestRendererPrivateUpdateRouteAdmissionRecord {
        self.admission
    }

    #[must_use]
    pub const fn consumes_accepted_host_root_update_queue_metadata(&self) -> bool {
        self.consumes_accepted_host_root_update_queue_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_root_work_loop_metadata(&self) -> bool {
        self.consumes_accepted_root_work_loop_metadata
    }

    #[must_use]
    pub const fn consumes_manual_host_output_canary(&self) -> bool {
        self.consumes_manual_host_output_canary
    }

    #[must_use]
    pub const fn public_root_update_available(&self) -> bool {
        self.public_root_update_available
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererUpdateNativeBridgeAdmission {
    pub(crate) diagnostic_id: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) route_dependency_id: &'static str,
    pub(crate) update_route_admission_id: &'static str,
    pub(crate) lifecycle: TestRendererRootLifecycle,
    pub(crate) scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) update_route_admission_accepted: bool,
    pub(crate) lifecycle_evidence_accepted: bool,
    pub(crate) root_work_loop_handoff_accepted: bool,
    pub(crate) host_output_handoff_accepted: bool,
    pub(crate) host_component_prop_update_recorded: bool,
    pub(crate) host_component_style_update_recorded: bool,
    pub(crate) text_update_apply_recorded: bool,
    pub(crate) host_text_update_apply_count: usize,
    pub(crate) host_component_update_apply_count: usize,
    pub(crate) rejects_stale_update_handoffs: bool,
    pub(crate) rejects_unmounted_roots: bool,
    pub(crate) rejects_missing_host_output_handoff: bool,
    pub(crate) public_update_compatibility_claimed: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) act_flushing_claimed: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution: bool,
    pub(crate) rust_execution_from_js: bool,
    pub(crate) reconciler_execution_from_js: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererUpdateNativeBridgeAdmission {
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
    pub const fn update_route_admission_id(self) -> &'static str {
        self.update_route_admission_id
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
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn update_route_admission_accepted(self) -> bool {
        self.update_route_admission_accepted
    }

    #[must_use]
    pub const fn lifecycle_evidence_accepted(self) -> bool {
        self.lifecycle_evidence_accepted
    }

    #[must_use]
    pub const fn root_work_loop_handoff_accepted(self) -> bool {
        self.root_work_loop_handoff_accepted
    }

    #[must_use]
    pub const fn host_output_handoff_accepted(self) -> bool {
        self.host_output_handoff_accepted
    }

    #[must_use]
    pub const fn host_component_prop_update_recorded(self) -> bool {
        self.host_component_prop_update_recorded
    }

    #[must_use]
    pub const fn host_component_style_update_recorded(self) -> bool {
        self.host_component_style_update_recorded
    }

    #[must_use]
    pub const fn text_update_apply_recorded(self) -> bool {
        self.text_update_apply_recorded
    }

    #[must_use]
    pub const fn host_text_update_apply_count(self) -> usize {
        self.host_text_update_apply_count
    }

    #[must_use]
    pub const fn host_component_update_apply_count(self) -> usize {
        self.host_component_update_apply_count
    }

    #[must_use]
    pub const fn rejects_stale_update_handoffs(self) -> bool {
        self.rejects_stale_update_handoffs
    }

    #[must_use]
    pub const fn rejects_unmounted_roots(self) -> bool {
        self.rejects_unmounted_roots
    }

    #[must_use]
    pub const fn rejects_missing_host_output_handoff(self) -> bool {
        self.rejects_missing_host_output_handoff
    }

    #[must_use]
    pub const fn public_update_compatibility_claimed(self) -> bool {
        self.public_update_compatibility_claimed
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
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

    #[must_use]
    pub const fn rust_execution_from_js(self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn reconciler_execution_from_js(self) -> bool {
        self.reconciler_execution_from_js
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

pub const TEST_RENDERER_SERIALIZATION_CANARY_GATE_NAME: &str =
    "fast-react-test-renderer.serialization.private-canary";
pub const TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-json-canary";
pub const TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.private-facade-result";
pub const TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.private-native-execution-evidence";
pub const TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_STATUS: &str =
    "private-tojson-native-execution-records-consumed-public-tojson-blocked";
pub const TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.totree.private-native-execution-evidence";
pub const TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_STATUS: &str =
    "private-totree-native-execution-records-consumed-public-totree-blocked";
pub const TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.root.private-lifecycle-execution-evidence";
pub const TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_STATUS: &str = "private-root-lifecycle-host-execution-records-consumed-public-root-native-js-act-scheduler-blocked";
pub const TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-finished-work-identity";
pub const TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_STATUS: &str =
    "private-serialization-finished-work-identity-validated-public-serialization-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.sibling-snapshot.finished-work-identity-blocker";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_STATUS: &str =
    "private-tojson-sibling-snapshot-finished-work-identity-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_REASON: &str =
    "missing-committed-sibling-text-fiber-inspection-and-handoff";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.sibling-text.finished-work-identity";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_STATUS: &str =
    "private-tojson-sibling-text-finished-work-identity-validated-public-tojson-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.multi-child-host-text.finished-work-identity";
pub const TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_STATUS: &str =
    "private-tojson-multi-child-host-text-lifecycle-native-finished-work-validated-public-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_FIBER_INSPECTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.direct-multi-child-host-text.committed-fiber-inspection";
pub const TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_FIBER_INSPECTION_STATUS: &str = "private-tojson-direct-multi-child-host-text-current-fiber-inspection-validated-public-native-package-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.direct-multi-child-host-text.row-identity";
pub const TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_STATUS: &str =
    "private-tojson-direct-multi-child-host-text-row-bound-to-current-fiber-commit";
pub const TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_RECONCILER_INSPECTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.direct-multi-child-host-text.reconciler-source-inspection";
pub const TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_RECONCILER_INSPECTION_STATUS: &str =
    "private-tojson-direct-multi-child-host-text-reconciler-source-current-inspection-consumed-public-native-package-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-unmount-nested-source-report-gate";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_STATUS: &str =
    "private-unmount-nested-source-report-admission-validated-public-native-package-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISSING_REASON: &str =
    "unmount-nested-source-report-admission-gate-missing";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISMATCH_REASON: &str =
    "unmount-nested-source-report-admission-gate-mismatch";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-update-host-output-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-nested-host-output-update-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-sibling-text-host-output-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-multi-child-host-text-output-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-unmount-host-output-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_UNMOUNT_ROW_STATUS: &str =
    "private-tojson-update-unmount-host-output-rows-public-tojson-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID: &str =
    "react-test-renderer-update-route-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID: &str =
    "react-test-renderer-unmount-route-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.update-route.private-root-work-loop";
pub const TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS: &str =
    "private-update-route-root-work-loop-metadata-ready-public-update-blocked";
pub const TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID: &str =
    "react-test-renderer-update-route-root-work-loop-private-admission";
pub const TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS: &str =
    "accepted-private-update-route-root-work-loop-admission-public-update-blocked";
pub const TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID: &str =
    "react-test-renderer-update-native-bridge-admission-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS: &str =
    "private-update-native-bridge-admission-host-output-handoff-public-update-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SERIALIZATION_DEPENDENCY_ID: &str =
    "react-test-renderer-serialization-private-json-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID: &str =
    "react-test-renderer-unmount-deletion-commit-handoff-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_STATUS: &str =
    "private-unmount-deletion-commit-handoff-public-unmount-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID: &str =
    "react-test-renderer-unmount-native-bridge-admission-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS: &str =
    "private-unmount-native-bridge-admission-public-unmount-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID: &str =
    "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_STATUS: &str =
    "private-unmount-native-bridge-cleanup-handoff-public-unmount-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_DIAGNOSTIC_ID: &str =
    "react-test-renderer-unmount-passive-ref-cleanup-order-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_STATUS: &str =
    "private-unmount-passive-ref-cleanup-order-public-unmount-blocked";
pub const TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-tree-canary";
pub const TEST_RENDERER_PRIVATE_TREE_COMMITTED_FIBER_INSPECTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-tree-committed-fiber-inspection-canary";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_ALL_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.find-all-private-query";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_BY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.find-by-private-query";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_QUERY_BRIDGE_PREFLIGHT_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.query-bridge-preflight";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.private-native-query-execution-evidence";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_STATUS: &str = "private-test-instance-native-create-update-execution-records-consumed-public-test-instance-blocked";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.private-class-root-query-execution-evidence";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_STATUS: &str =
    "private-test-instance-class-root-update-query-execution-public-test-instance-blocked";
pub const TEST_RENDERER_CURRENT_ROOT_CANARY_METADATA_ID: &str =
    "fast-react-test-renderer-current-root-canary-metadata";
pub const TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.root-create.private-preflight";
pub const TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS: &str =
    "private-root-create-preflight-ready-public-root-blocked";
pub const TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_ROW_ID: &str =
    "react-test-renderer-root-create-work-loop-finished-work-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_STATUS: &str =
    "private-root-create-work-loop-finished-work-preflight-public-root-blocked";
pub const TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_ID: &str =
    "fast-react-test-renderer-root-work-loop-finished-work-preflight-metadata";
pub const TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS: &str =
    "accepted-root-work-loop-finished-work-preflight-metadata";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.create-route.private-admission";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS: &str =
    "private-create-route-admission-rust-root-create-work-loop-evidence-public-create-blocked";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID: &str =
    "react-test-renderer-create-route-admission-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_ID: &str =
    "fast-react-test-renderer-create-route-admission-metadata";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_STATUS: &str =
    "accepted-create-route-rust-root-create-work-loop-admission-metadata";
pub const TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID: &str =
    "react-test-renderer-create-native-bridge-host-output-handoff-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS: &str =
    "private-create-native-bridge-host-output-handoff-public-create-blocked";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.error-boundary.private-root-options-canary";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS: &str =
    "private-error-boundary-diagnostics-root-options-metadata-public-boundary-blocked";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.error-boundary.private-native-execution-evidence";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_STATUS: &str =
    "private-error-boundary-native-execution-update-failure-evidence-public-recovery-blocked";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.error-boundary.private-commit-recovery-evidence";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_STATUS: &str =
    "private-error-boundary-commit-recovery-metadata-public-recovery-blocked";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_API: &str =
    "TestRendererRoot::describe_private_error_boundary_commit_recovery_for_canary";
pub const TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.act.private-passive-effect-drain-canary";
pub const TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_STATUS: &str =
    "accepted-private-act-pending-passive-flush-metadata-public-act-blocked";
pub const TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_ACCEPTED_RECORDS: [&str; 5] = [
    "PendingPassiveCommitHandoff",
    "PassiveEffectSchedulerFlushGateRecord",
    "SchedulerPassiveEffectsFlushRequest",
    "PassiveEffectSchedulerFlushExecutionRecord",
    "PassiveEffectsFlushResult",
];
pub const TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.act.private-nested-scope-passive-flush-canary";
pub const TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_STATUS: &str =
    "private-act-nested-scope-passive-flush-public-act-blocked";
pub const TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_ORDER: [&str; 5] = [
    "outer-act-scope-enter",
    "inner-act-scope-enter",
    "accepted-passive-work-flush",
    "inner-act-scope-exit",
    "outer-act-scope-exit",
];
pub const TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE: [&str; 3] =
    ["HostRoot", "HostComponent", "HostText"];
pub const TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE: [&str; 4] =
    ["HostRoot", "FunctionComponent", "HostComponent", "HostText"];
pub const TEST_RENDERER_PRIVATE_TREE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE: [&str; 4] =
    ["HostRoot", "HostText", "HostComponent", "HostText"];
pub const TEST_RENDERER_PRIVATE_TREE_COMPOSITE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE: [&str; 5] = [
    "HostRoot",
    "FunctionComponent",
    "HostText",
    "HostComponent",
    "HostText",
];
pub const TEST_RENDERER_PRIVATE_TREE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE: [&str; 4] =
    ["HostRoot", "HostComponent", "HostText", "HostText"];
pub const TEST_RENDERER_PRIVATE_TREE_COMPOSITE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE: [&str;
    5] = [
    "HostRoot",
    "FunctionComponent",
    "HostComponent",
    "HostText",
    "HostText",
];
pub const TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE: &str = "CanaryFunctionComponent";
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.get-instance.private-class-root-canary";
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE: [&str; 4] =
    ["HostRoot", "ClassComponent", "HostComponent", "HostText"];
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_HOST_ROOT_FIBER_SHAPE: [&str; 2] =
    ["HostRoot", "HostComponent"];
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_FUNCTION_ROOT_FIBER_SHAPE: [&str; 2] =
    ["HostRoot", "FunctionComponent"];
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE: &str = "CanaryClassComponent";
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_CONSTRUCTOR_NAME: &str = "CanaryClassInstance";
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_STATE_MARKER: &str = "initial-state";
pub const TEST_RENDERER_SERIALIZATION_ORACLE_KIND: &str =
    "react-19.2.6-react-test-renderer-serialization-oracle";
pub const TEST_RENDERER_SERIALIZATION_ORACLE_PROBE_MODE_COUNT: usize = 2;
pub const TEST_RENDERER_SERIALIZATION_ORACLE_SCENARIO_COUNT: usize = 7;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererRootCreatePreflightChildShape {
    Text,
    Empty,
    Unsupported,
}

impl TestRendererRootCreatePreflightChildShape {
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::Text => "Text",
            Self::Empty => "Empty",
            Self::Unsupported => "Unsupported",
        }
    }

    pub(crate) const fn is_supported_for_create_preflight(self) -> bool {
        matches!(self, Self::Text)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootCreatePreflightInputShape {
    pub(crate) element: RootElementHandle,
    pub(crate) root_node_kind: &'static str,
    pub(crate) element_type: &'static str,
    pub(crate) child_shape: TestRendererRootCreatePreflightChildShape,
}

impl TestRendererRootCreatePreflightInputShape {
    #[must_use]
    pub const fn host_component_with_text_child(
        element: RootElementHandle,
        element_type: &'static str,
    ) -> Self {
        Self {
            element,
            root_node_kind: "HostComponent",
            element_type,
            child_shape: TestRendererRootCreatePreflightChildShape::Text,
        }
    }

    #[must_use]
    pub const fn host_component_with_unsupported_children(
        element: RootElementHandle,
        element_type: &'static str,
    ) -> Self {
        Self {
            element,
            root_node_kind: "HostComponent",
            element_type,
            child_shape: TestRendererRootCreatePreflightChildShape::Unsupported,
        }
    }

    #[must_use]
    pub const fn element(self) -> RootElementHandle {
        self.element
    }

    #[must_use]
    pub const fn root_node_kind(self) -> &'static str {
        self.root_node_kind
    }

    #[must_use]
    pub const fn element_type(self) -> &'static str {
        self.element_type
    }

    #[must_use]
    pub const fn child_shape(self) -> TestRendererRootCreatePreflightChildShape {
        self.child_shape
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootCreatePreflightCanaryApiIdentity {
    pub(crate) metadata_id: &'static str,
    pub(crate) metadata_status: &'static str,
    pub(crate) operation: &'static str,
    pub(crate) root_api: &'static str,
    pub(crate) preflight_api: &'static str,
    pub(crate) root_options_type: &'static str,
    pub(crate) test_renderer_options_type: &'static str,
    pub(crate) container_update_api: &'static str,
    pub(crate) scheduler_api: &'static str,
}

impl TestRendererRootCreatePreflightCanaryApiIdentity {
    #[must_use]
    pub const fn current() -> Self {
        Self {
            metadata_id: TEST_RENDERER_CURRENT_ROOT_CANARY_METADATA_ID,
            metadata_status: "private-root-execution-bridge-current-rust-canary-metadata",
            operation: "create",
            root_api: "TestRendererRoot::create",
            preflight_api: "TestRendererRoot::describe_private_root_create_preflight_for_canary",
            root_options_type: "RootOptions",
            test_renderer_options_type: "TestRendererOptions",
            container_update_api: "update_container",
            scheduler_api: "ensure_root_is_scheduled",
        }
    }

    #[must_use]
    pub const fn new_for_canary(
        metadata_id: &'static str,
        metadata_status: &'static str,
        root_api: &'static str,
    ) -> Self {
        Self {
            metadata_id,
            metadata_status,
            operation: "create",
            root_api,
            preflight_api: "TestRendererRoot::describe_private_root_create_preflight_for_canary",
            root_options_type: "RootOptions",
            test_renderer_options_type: "TestRendererOptions",
            container_update_api: "update_container",
            scheduler_api: "ensure_root_is_scheduled",
        }
    }

    #[must_use]
    pub const fn metadata_id(self) -> &'static str {
        self.metadata_id
    }

    #[must_use]
    pub const fn metadata_status(self) -> &'static str {
        self.metadata_status
    }

    #[must_use]
    pub const fn operation(self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn root_api(self) -> &'static str {
        self.root_api
    }

    #[must_use]
    pub const fn preflight_api(self) -> &'static str {
        self.preflight_api
    }

    #[must_use]
    pub const fn root_options_type(self) -> &'static str {
        self.root_options_type
    }

    #[must_use]
    pub const fn test_renderer_options_type(self) -> &'static str {
        self.test_renderer_options_type
    }

    #[must_use]
    pub const fn container_update_api(self) -> &'static str {
        self.container_update_api
    }

    #[must_use]
    pub const fn scheduler_api(self) -> &'static str {
        self.scheduler_api
    }

    pub(crate) fn is_current(self) -> bool {
        self.metadata_id == TEST_RENDERER_CURRENT_ROOT_CANARY_METADATA_ID
            && self.metadata_status == "private-root-execution-bridge-current-rust-canary-metadata"
            && self.operation == "create"
            && self.root_api == "TestRendererRoot::create"
            && self.preflight_api
                == "TestRendererRoot::describe_private_root_create_preflight_for_canary"
            && self.root_options_type == "RootOptions"
            && self.test_renderer_options_type == "TestRendererOptions"
            && self.container_update_api == "update_container"
            && self.scheduler_api == "ensure_root_is_scheduled"
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootCreatePreflightOptionsMetadata {
    pub(crate) options_type: &'static str,
    pub(crate) strict_mode: bool,
    pub(crate) has_create_node_mock: bool,
    pub(crate) root_error_options: TestRendererRootErrorOptionDiagnostics,
    pub(crate) root_options_metadata_available: bool,
    pub(crate) create_node_mock_invoked: bool,
    pub(crate) public_root_error_callbacks_invoked: bool,
}

impl TestRendererRootCreatePreflightOptionsMetadata {
    pub(crate) fn from_options(options: &TestRendererOptions) -> Self {
        let root_error_options = TestRendererRootErrorOptionDiagnostics {
            on_uncaught_error: options.on_uncaught_error(),
            on_caught_error: options.on_caught_error(),
            on_recoverable_error: options.on_recoverable_error(),
            root_error_option_metadata_available: true,
            public_root_error_callbacks_invoked: false,
            public_error_boundary_behavior_available: false,
            compatibility_claimed: false,
        };

        Self {
            options_type: "TestRendererOptions",
            strict_mode: options.strict_mode(),
            has_create_node_mock: options.has_create_node_mock(),
            root_error_options,
            root_options_metadata_available: true,
            create_node_mock_invoked: false,
            public_root_error_callbacks_invoked: false,
        }
    }

    #[must_use]
    pub const fn options_type(self) -> &'static str {
        self.options_type
    }

    #[must_use]
    pub const fn strict_mode(self) -> bool {
        self.strict_mode
    }

    #[must_use]
    pub const fn has_create_node_mock(self) -> bool {
        self.has_create_node_mock
    }

    #[must_use]
    pub const fn root_error_options(self) -> TestRendererRootErrorOptionDiagnostics {
        self.root_error_options
    }

    #[must_use]
    pub const fn root_options_metadata_available(self) -> bool {
        self.root_options_metadata_available
    }

    #[must_use]
    pub const fn create_node_mock_invoked(self) -> bool {
        self.create_node_mock_invoked
    }

    #[must_use]
    pub const fn public_root_error_callbacks_invoked(self) -> bool {
        self.public_root_error_callbacks_invoked
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootWorkLoopFinishedWorkPreflightMetadata {
    pub(crate) metadata_id: &'static str,
    pub(crate) metadata_status: &'static str,
    pub(crate) accepted_worker: &'static str,
    pub(crate) accepted_rust_module: &'static str,
    pub(crate) render_phase_api: &'static str,
    pub(crate) render_phase_record: &'static str,
    pub(crate) finished_work_record: &'static str,
    pub(crate) pending_finished_work_record: &'static str,
    pub(crate) commit_handoff_record: &'static str,
    pub(crate) accepted_input_shape: &'static str,
}

impl TestRendererRootWorkLoopFinishedWorkPreflightMetadata {
    #[must_use]
    pub const fn current() -> Self {
        Self {
            metadata_id: TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_ID,
            metadata_status: TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS,
            accepted_worker: "worker-534-root-work-loop-finished-work-commit-handoff",
            accepted_rust_module: "fast-react-reconciler::root_work_loop",
            render_phase_api: "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff",
            render_phase_record: "HostRootRenderPhaseRecord",
            finished_work_record: "HostRootRenderPhaseRecord::finished_work",
            pending_finished_work_record: "HostRootFinishedWorkPendingCommitRecordForCanary",
            commit_handoff_record: "HostRootFinishedWorkCommitHandoffRecordForCanary",
            accepted_input_shape: "HostComponentWithTextChild",
        }
    }

    #[must_use]
    pub const fn new_for_canary(
        metadata_id: &'static str,
        metadata_status: &'static str,
        render_phase_api: &'static str,
    ) -> Self {
        Self {
            metadata_id,
            metadata_status,
            accepted_worker: "worker-534-root-work-loop-finished-work-commit-handoff",
            accepted_rust_module: "fast-react-reconciler::root_work_loop",
            render_phase_api,
            render_phase_record: "HostRootRenderPhaseRecord",
            finished_work_record: "HostRootRenderPhaseRecord::finished_work",
            pending_finished_work_record: "HostRootFinishedWorkPendingCommitRecordForCanary",
            commit_handoff_record: "HostRootFinishedWorkCommitHandoffRecordForCanary",
            accepted_input_shape: "HostComponentWithTextChild",
        }
    }

    #[must_use]
    pub const fn metadata_id(self) -> &'static str {
        self.metadata_id
    }

    #[must_use]
    pub const fn metadata_status(self) -> &'static str {
        self.metadata_status
    }

    #[must_use]
    pub const fn accepted_worker(self) -> &'static str {
        self.accepted_worker
    }

    #[must_use]
    pub const fn accepted_rust_module(self) -> &'static str {
        self.accepted_rust_module
    }

    #[must_use]
    pub const fn render_phase_api(self) -> &'static str {
        self.render_phase_api
    }

    #[must_use]
    pub const fn render_phase_record(self) -> &'static str {
        self.render_phase_record
    }

    #[must_use]
    pub const fn finished_work_record(self) -> &'static str {
        self.finished_work_record
    }

    #[must_use]
    pub const fn pending_finished_work_record(self) -> &'static str {
        self.pending_finished_work_record
    }

    #[must_use]
    pub const fn commit_handoff_record(self) -> &'static str {
        self.commit_handoff_record
    }

    #[must_use]
    pub const fn accepted_input_shape(self) -> &'static str {
        self.accepted_input_shape
    }

    pub(crate) fn is_current(self) -> bool {
        let current = Self::current();
        self.metadata_id == current.metadata_id
            && self.metadata_status == current.metadata_status
            && self.accepted_worker == current.accepted_worker
            && self.accepted_rust_module == current.accepted_rust_module
            && self.render_phase_api == current.render_phase_api
            && self.render_phase_record == current.render_phase_record
            && self.finished_work_record == current.finished_work_record
            && self.pending_finished_work_record == current.pending_finished_work_record
            && self.commit_handoff_record == current.commit_handoff_record
            && self.accepted_input_shape == current.accepted_input_shape
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateCreateRouteAdmissionMetadata {
    pub(crate) metadata_id: &'static str,
    pub(crate) metadata_status: &'static str,
    pub(crate) accepted_worker: &'static str,
    pub(crate) accepted_rust_crate: &'static str,
    pub(crate) root_api: &'static str,
    pub(crate) preflight_api: &'static str,
    pub(crate) work_loop_render_phase_api: &'static str,
    pub(crate) lifecycle_record: &'static str,
    pub(crate) execution_result_record: &'static str,
    pub(crate) accepted_input_shape: &'static str,
}

impl TestRendererPrivateCreateRouteAdmissionMetadata {
    #[must_use]
    pub const fn current() -> Self {
        Self {
            metadata_id: TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_ID,
            metadata_status: TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_STATUS,
            accepted_worker: "worker-610-test-renderer-create-native-bridge-admission",
            accepted_rust_crate: "fast-react-test-renderer",
            root_api: "TestRendererRoot::create",
            preflight_api: "TestRendererRoot::describe_private_root_create_preflight_for_canary",
            work_loop_render_phase_api: "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff",
            lifecycle_record: "TestRendererRootScheduledUpdate",
            execution_result_record: "TestRendererPrivateCreateRouteAdmissionDiagnostics",
            accepted_input_shape: "HostComponentWithTextChild",
        }
    }

    #[must_use]
    pub const fn new_for_canary(
        metadata_id: &'static str,
        metadata_status: &'static str,
        root_api: &'static str,
    ) -> Self {
        Self {
            metadata_id,
            metadata_status,
            accepted_worker: "worker-610-test-renderer-create-native-bridge-admission",
            accepted_rust_crate: "fast-react-test-renderer",
            root_api,
            preflight_api: "TestRendererRoot::describe_private_root_create_preflight_for_canary",
            work_loop_render_phase_api: "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff",
            lifecycle_record: "TestRendererRootScheduledUpdate",
            execution_result_record: "TestRendererPrivateCreateRouteAdmissionDiagnostics",
            accepted_input_shape: "HostComponentWithTextChild",
        }
    }

    #[must_use]
    pub const fn metadata_id(self) -> &'static str {
        self.metadata_id
    }

    #[must_use]
    pub const fn metadata_status(self) -> &'static str {
        self.metadata_status
    }

    #[must_use]
    pub const fn accepted_worker(self) -> &'static str {
        self.accepted_worker
    }

    #[must_use]
    pub const fn accepted_rust_crate(self) -> &'static str {
        self.accepted_rust_crate
    }

    #[must_use]
    pub const fn root_api(self) -> &'static str {
        self.root_api
    }

    #[must_use]
    pub const fn preflight_api(self) -> &'static str {
        self.preflight_api
    }

    #[must_use]
    pub const fn work_loop_render_phase_api(self) -> &'static str {
        self.work_loop_render_phase_api
    }

    #[must_use]
    pub const fn lifecycle_record(self) -> &'static str {
        self.lifecycle_record
    }

    #[must_use]
    pub const fn execution_result_record(self) -> &'static str {
        self.execution_result_record
    }

    #[must_use]
    pub const fn accepted_input_shape(self) -> &'static str {
        self.accepted_input_shape
    }

    pub(crate) fn is_current(self) -> bool {
        let current = Self::current();
        self.metadata_id == current.metadata_id
            && self.metadata_status == current.metadata_status
            && self.accepted_worker == current.accepted_worker
            && self.accepted_rust_crate == current.accepted_rust_crate
            && self.root_api == current.root_api
            && self.preflight_api == current.preflight_api
            && self.work_loop_render_phase_api == current.work_loop_render_phase_api
            && self.lifecycle_record == current.lifecycle_record
            && self.execution_result_record == current.execution_result_record
            && self.accepted_input_shape == current.accepted_input_shape
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
    pub(crate) row_id: &'static str,
    pub(crate) status: &'static str,
    pub(crate) metadata: TestRendererRootWorkLoopFinishedWorkPreflightMetadata,
    pub(crate) root: FiberRootId,
    pub(crate) previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) resulting_element: RootElementHandle,
    pub(crate) scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) render_lanes_empty: bool,
    pub(crate) render_lanes_bits: u32,
    pub(crate) remaining_lanes_empty: bool,
    pub(crate) remaining_lanes_bits: u32,
    pub(crate) finished_work_matches_render_phase: bool,
    pub(crate) records_accepted_finished_work_metadata: bool,
    pub(crate) public_create_behavior_available: bool,
    pub(crate) host_mutation_execution_blocked: bool,
    pub(crate) effects_refs_and_hydration_blocked: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
    #[must_use]
    pub const fn row_id(self) -> &'static str {
        self.row_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn metadata(self) -> TestRendererRootWorkLoopFinishedWorkPreflightMetadata {
        self.metadata
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.previous_current
    }

    #[must_use]
    pub const fn finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.finished_work
    }

    #[must_use]
    pub const fn resulting_element(self) -> RootElementHandle {
        self.resulting_element
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn render_lanes_empty(self) -> bool {
        self.render_lanes_empty
    }

    #[must_use]
    pub const fn render_lanes_bits(self) -> u32 {
        self.render_lanes_bits
    }

    #[must_use]
    pub const fn remaining_lanes_empty(self) -> bool {
        self.remaining_lanes_empty
    }

    #[must_use]
    pub const fn remaining_lanes_bits(self) -> u32 {
        self.remaining_lanes_bits
    }

    #[must_use]
    pub const fn finished_work_matches_render_phase(self) -> bool {
        self.finished_work_matches_render_phase
    }

    #[must_use]
    pub const fn records_accepted_finished_work_metadata(self) -> bool {
        self.records_accepted_finished_work_metadata
    }

    #[must_use]
    pub const fn public_create_behavior_available(self) -> bool {
        self.public_create_behavior_available
    }

    #[must_use]
    pub const fn host_mutation_execution_blocked(self) -> bool {
        self.host_mutation_execution_blocked
    }

    #[must_use]
    pub const fn effects_refs_and_hydration_blocked(self) -> bool {
        self.effects_refs_and_hydration_blocked
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootCreatePreflightDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) input_shape: TestRendererRootCreatePreflightInputShape,
    pub(crate) root_options: TestRendererRootCreatePreflightOptionsMetadata,
    pub(crate) canary_api_identity: TestRendererRootCreatePreflightCanaryApiIdentity,
    pub(crate) scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) scheduled_element: RootElementHandle,
    pub(crate) container_update_api: &'static str,
    pub(crate) scheduler_api: &'static str,
    pub(crate) work_loop_finished_work_preflight:
        TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics,
    pub(crate) private_rust_root_created: bool,
    pub(crate) private_root_canary_boundary_validated: bool,
    pub(crate) public_renderer_root_created: bool,
    pub(crate) public_root_available: bool,
    pub(crate) native_addon_loaded: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution: bool,
    pub(crate) rust_execution_from_js: bool,
    pub(crate) host_output_produced_from_js: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererRootCreatePreflightDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
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
    pub const fn input_shape(self) -> TestRendererRootCreatePreflightInputShape {
        self.input_shape
    }

    #[must_use]
    pub const fn root_options(self) -> TestRendererRootCreatePreflightOptionsMetadata {
        self.root_options
    }

    #[must_use]
    pub const fn canary_api_identity(self) -> TestRendererRootCreatePreflightCanaryApiIdentity {
        self.canary_api_identity
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
    pub const fn container_update_api(self) -> &'static str {
        self.container_update_api
    }

    #[must_use]
    pub const fn scheduler_api(self) -> &'static str {
        self.scheduler_api
    }

    #[must_use]
    pub const fn work_loop_finished_work_preflight(
        self,
    ) -> TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
        self.work_loop_finished_work_preflight
    }

    #[must_use]
    pub const fn private_rust_root_created(self) -> bool {
        self.private_rust_root_created
    }

    #[must_use]
    pub const fn private_root_canary_boundary_validated(self) -> bool {
        self.private_root_canary_boundary_validated
    }

    #[must_use]
    pub const fn public_renderer_root_created(self) -> bool {
        self.public_renderer_root_created
    }

    #[must_use]
    pub const fn public_root_available(self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn native_addon_loaded(self) -> bool {
        self.native_addon_loaded
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(self) -> bool {
        self.native_execution
    }

    #[must_use]
    pub const fn rust_execution_from_js(self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn host_output_produced_from_js(self) -> bool {
        self.host_output_produced_from_js
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateCreateRouteAdmissionDiagnostics {
    pub(crate) record_id: &'static str,
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) js_facade_metadata_source: &'static str,
    pub(crate) rust_admission_metadata: TestRendererPrivateCreateRouteAdmissionMetadata,
    pub(crate) root_create_preflight: TestRendererRootCreatePreflightDiagnostics,
    pub(crate) work_loop_finished_work_preflight:
        TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics,
    pub(crate) scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) scheduled_element: RootElementHandle,
    pub(crate) rust_outcome: &'static str,
    pub(crate) consumes_js_facade_create_metadata: bool,
    pub(crate) consumes_accepted_rust_root_create_execution_evidence: bool,
    pub(crate) consumes_accepted_rust_root_create_preflight_diagnostics: bool,
    pub(crate) consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata: bool,
    pub(crate) missing_rust_admission_record_rejection: bool,
    pub(crate) stale_rust_admission_record_rejection: bool,
    pub(crate) public_renderer_root_created: bool,
    pub(crate) public_root_available: bool,
    pub(crate) public_create_behavior_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) native_addon_loaded: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution: bool,
    pub(crate) rust_execution_from_js: bool,
    pub(crate) reconciler_execution_from_js: bool,
    pub(crate) host_output_produced_from_js: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateCreateRouteAdmissionDiagnostics {
    #[must_use]
    pub const fn record_id(self) -> &'static str {
        self.record_id
    }

    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
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
    pub const fn operation(self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn js_facade_metadata_source(self) -> &'static str {
        self.js_facade_metadata_source
    }

    #[must_use]
    pub const fn rust_admission_metadata(self) -> TestRendererPrivateCreateRouteAdmissionMetadata {
        self.rust_admission_metadata
    }

    #[must_use]
    pub const fn root_create_preflight(self) -> TestRendererRootCreatePreflightDiagnostics {
        self.root_create_preflight
    }

    #[must_use]
    pub const fn work_loop_finished_work_preflight(
        self,
    ) -> TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
        self.work_loop_finished_work_preflight
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
    pub const fn rust_outcome(self) -> &'static str {
        self.rust_outcome
    }

    #[must_use]
    pub const fn consumes_js_facade_create_metadata(self) -> bool {
        self.consumes_js_facade_create_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_rust_root_create_execution_evidence(self) -> bool {
        self.consumes_accepted_rust_root_create_execution_evidence
    }

    #[must_use]
    pub const fn consumes_accepted_rust_root_create_preflight_diagnostics(self) -> bool {
        self.consumes_accepted_rust_root_create_preflight_diagnostics
    }

    #[must_use]
    pub const fn consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata(
        self,
    ) -> bool {
        self.consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata
    }

    #[must_use]
    pub const fn missing_rust_admission_record_rejection(self) -> bool {
        self.missing_rust_admission_record_rejection
    }

    #[must_use]
    pub const fn stale_rust_admission_record_rejection(self) -> bool {
        self.stale_rust_admission_record_rejection
    }

    #[must_use]
    pub const fn public_renderer_root_created(self) -> bool {
        self.public_renderer_root_created
    }

    #[must_use]
    pub const fn public_root_available(self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_create_behavior_available(self) -> bool {
        self.public_create_behavior_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn native_addon_loaded(self) -> bool {
        self.native_addon_loaded
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(self) -> bool {
        self.native_execution
    }

    #[must_use]
    pub const fn rust_execution_from_js(self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn reconciler_execution_from_js(self) -> bool {
        self.reconciler_execution_from_js
    }

    #[must_use]
    pub const fn host_output_produced_from_js(self) -> bool {
        self.host_output_produced_from_js
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateCreateNativeBridgeHostOutputHandoff {
    pub(crate) diagnostic_id: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) create_route_admission_record_id: &'static str,
    pub(crate) create_route_admission_status: &'static str,
    pub(crate) scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) scheduled_element: RootElementHandle,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_output: TestRendererHostOutputDiagnostics,
    pub(crate) serialization_gate_status: TestRendererSerializationGateStatus,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) work_loop_finished_work_preflight:
        TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) commit_remaining_lanes_bits: u32,
    pub(crate) commit_pending_lanes_bits: u32,
    pub(crate) render_finished_work_matches_create_route_preflight: bool,
    pub(crate) commit_current_matches_render_finished_work: bool,
    pub(crate) commit_lanes_match_render_lanes: bool,
    pub(crate) minimal_tree_host_output_consumes_root_finished_work: bool,
    pub(crate) minimal_tree_host_output_consumes_root_finished_lanes: bool,
    pub(crate) create_route_admission_accepted: bool,
    pub(crate) host_output_handoff_accepted: bool,
    pub(crate) actual_rust_create_host_output_handoff: bool,
    pub(crate) host_output_produced_by_rust: bool,
    pub(crate) public_create_behavior_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) native_addon_loaded: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution: bool,
    pub(crate) rust_execution_from_js: bool,
    pub(crate) host_output_produced_from_js: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateCreateNativeBridgeHostOutputHandoff {
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
    pub const fn operation(self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn create_route_admission_record_id(self) -> &'static str {
        self.create_route_admission_record_id
    }

    #[must_use]
    pub const fn create_route_admission_status(self) -> &'static str {
        self.create_route_admission_status
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
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn host_output(self) -> TestRendererHostOutputDiagnostics {
        self.host_output
    }

    #[must_use]
    pub const fn serialization_gate_status(self) -> TestRendererSerializationGateStatus {
        self.serialization_gate_status
    }

    #[must_use]
    pub const fn render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.render_finished_work
    }

    #[must_use]
    pub const fn commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_current
    }

    #[must_use]
    pub const fn work_loop_finished_work_preflight(
        self,
    ) -> TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
        self.work_loop_finished_work_preflight
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
    pub const fn commit_remaining_lanes_bits(self) -> u32 {
        self.commit_remaining_lanes_bits
    }

    #[must_use]
    pub const fn commit_pending_lanes_bits(self) -> u32 {
        self.commit_pending_lanes_bits
    }

    #[must_use]
    pub const fn render_finished_work_matches_create_route_preflight(self) -> bool {
        self.render_finished_work_matches_create_route_preflight
    }

    #[must_use]
    pub const fn commit_current_matches_render_finished_work(self) -> bool {
        self.commit_current_matches_render_finished_work
    }

    #[must_use]
    pub const fn commit_lanes_match_render_lanes(self) -> bool {
        self.commit_lanes_match_render_lanes
    }

    #[must_use]
    pub const fn minimal_tree_host_output_consumes_root_finished_work(self) -> bool {
        self.minimal_tree_host_output_consumes_root_finished_work
    }

    #[must_use]
    pub const fn minimal_tree_host_output_consumes_root_finished_lanes(self) -> bool {
        self.minimal_tree_host_output_consumes_root_finished_lanes
    }

    #[must_use]
    pub const fn create_route_admission_accepted(self) -> bool {
        self.create_route_admission_accepted
    }

    #[must_use]
    pub const fn host_output_handoff_accepted(self) -> bool {
        self.host_output_handoff_accepted
    }

    #[must_use]
    pub const fn actual_rust_create_host_output_handoff(self) -> bool {
        self.actual_rust_create_host_output_handoff
    }

    #[must_use]
    pub const fn host_output_produced_by_rust(self) -> bool {
        self.host_output_produced_by_rust
    }

    #[must_use]
    pub const fn public_create_behavior_available(self) -> bool {
        self.public_create_behavior_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn native_addon_loaded(self) -> bool {
        self.native_addon_loaded
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(self) -> bool {
        self.native_execution
    }

    #[must_use]
    pub const fn rust_execution_from_js(self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn host_output_produced_from_js(self) -> bool {
        self.host_output_produced_from_js
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateErrorDiagnosticPhase {
    Update,
    Commit,
}

impl TestRendererPrivateErrorDiagnosticPhase {
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::Update => "Update",
            Self::Commit => "Commit",
        }
    }

    #[must_use]
    pub const fn row_id(self) -> &'static str {
        match self {
            Self::Update => "react-test-renderer-update-error-root-option-private-diagnostic",
            Self::Commit => "react-test-renderer-commit-error-root-option-private-diagnostic",
        }
    }

    #[must_use]
    pub const fn react_reference(self) -> &'static str {
        match self {
            Self::Update => "ReactTestRenderer.js update -> updateContainer",
            Self::Commit => "ReactFiberWorkLoop.captureCommitPhaseError",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootErrorOptionDiagnostics {
    pub(crate) on_uncaught_error: RootErrorCallbackHandle,
    pub(crate) on_caught_error: RootErrorCallbackHandle,
    pub(crate) on_recoverable_error: RootRecoverableErrorCallbackHandle,
    pub(crate) root_error_option_metadata_available: bool,
    pub(crate) public_root_error_callbacks_invoked: bool,
    pub(crate) public_error_boundary_behavior_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererRootErrorOptionDiagnostics {
    #[must_use]
    pub const fn on_uncaught_error(self) -> RootErrorCallbackHandle {
        self.on_uncaught_error
    }

    #[must_use]
    pub const fn on_caught_error(self) -> RootErrorCallbackHandle {
        self.on_caught_error
    }

    #[must_use]
    pub const fn on_recoverable_error(self) -> RootRecoverableErrorCallbackHandle {
        self.on_recoverable_error
    }

    #[must_use]
    pub const fn root_error_option_metadata_available(self) -> bool {
        self.root_error_option_metadata_available
    }

    #[must_use]
    pub const fn has_configured_error_callback(self) -> bool {
        self.on_uncaught_error.is_some()
            || self.on_caught_error.is_some()
            || self.on_recoverable_error.is_some()
    }

    #[must_use]
    pub const fn public_root_error_callbacks_invoked(self) -> bool {
        self.public_root_error_callbacks_invoked
    }

    #[must_use]
    pub const fn public_error_boundary_behavior_available(self) -> bool {
        self.public_error_boundary_behavior_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateErrorBoundaryDependencyDiagnostics {
    pub(crate) update_route_diagnostics_available: bool,
    pub(crate) serialization_diagnostics_available: bool,
    pub(crate) test_instance_query_diagnostics_available: bool,
    pub(crate) act_scheduler_metadata_available: bool,
    pub(crate) public_renderer_roots_executed: bool,
    pub(crate) public_lifecycle_methods_executed: bool,
    pub(crate) error_boundary_recovery_executed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateErrorBoundaryDependencyDiagnostics {
    pub(crate) const fn root_options_only() -> Self {
        Self {
            update_route_diagnostics_available: false,
            serialization_diagnostics_available: false,
            test_instance_query_diagnostics_available: false,
            act_scheduler_metadata_available: false,
            public_renderer_roots_executed: false,
            public_lifecycle_methods_executed: false,
            error_boundary_recovery_executed: false,
            compatibility_claimed: false,
        }
    }

    #[must_use]
    pub const fn update_route_diagnostics_available(self) -> bool {
        self.update_route_diagnostics_available
    }

    #[must_use]
    pub const fn serialization_diagnostics_available(self) -> bool {
        self.serialization_diagnostics_available
    }

    #[must_use]
    pub const fn test_instance_query_diagnostics_available(self) -> bool {
        self.test_instance_query_diagnostics_available
    }

    #[must_use]
    pub const fn act_scheduler_metadata_available(self) -> bool {
        self.act_scheduler_metadata_available
    }

    #[must_use]
    pub const fn public_renderer_roots_executed(self) -> bool {
        self.public_renderer_roots_executed
    }

    #[must_use]
    pub const fn public_lifecycle_methods_executed(self) -> bool {
        self.public_lifecycle_methods_executed
    }

    #[must_use]
    pub const fn error_boundary_recovery_executed(self) -> bool {
        self.error_boundary_recovery_executed
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub const fn update_commit_rows_ready(self) -> bool {
        self.update_route_diagnostics_available
            && self.serialization_diagnostics_available
            && self.test_instance_query_diagnostics_available
            && self.act_scheduler_metadata_available
            && !self.public_renderer_roots_executed
            && !self.public_lifecycle_methods_executed
            && !self.error_boundary_recovery_executed
            && !self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateErrorDiagnosticRow {
    pub(crate) id: &'static str,
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) phase: TestRendererPrivateErrorDiagnosticPhase,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) root: FiberRootId,
    pub(crate) root_error_channel: &'static str,
    pub(crate) root_error_options: TestRendererRootErrorOptionDiagnostics,
    pub(crate) dependency_diagnostics: TestRendererPrivateErrorBoundaryDependencyDiagnostics,
    pub(crate) react_reference: &'static str,
    pub(crate) root_error_update_scheduled: bool,
    pub(crate) public_root_error_callbacks_invoked: bool,
    pub(crate) public_error_boundary_behavior_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateErrorDiagnosticRow {
    #[must_use]
    pub const fn id(self) -> &'static str {
        self.id
    }

    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn phase(self) -> TestRendererPrivateErrorDiagnosticPhase {
        self.phase
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn root_error_channel(self) -> &'static str {
        self.root_error_channel
    }

    #[must_use]
    pub const fn root_error_options(self) -> TestRendererRootErrorOptionDiagnostics {
        self.root_error_options
    }

    #[must_use]
    pub const fn dependency_diagnostics(
        self,
    ) -> TestRendererPrivateErrorBoundaryDependencyDiagnostics {
        self.dependency_diagnostics
    }

    #[must_use]
    pub const fn react_reference(self) -> &'static str {
        self.react_reference
    }

    #[must_use]
    pub const fn root_error_update_scheduled(self) -> bool {
        self.root_error_update_scheduled
    }

    #[must_use]
    pub const fn public_root_error_callbacks_invoked(self) -> bool {
        self.public_root_error_callbacks_invoked
    }

    #[must_use]
    pub const fn public_error_boundary_behavior_available(self) -> bool {
        self.public_error_boundary_behavior_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateErrorBoundaryDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) root_error_options: TestRendererRootErrorOptionDiagnostics,
    pub(crate) dependency_diagnostics: TestRendererPrivateErrorBoundaryDependencyDiagnostics,
    pub(crate) rows: [TestRendererPrivateErrorDiagnosticRow; 2],
    pub(crate) public_error_boundary_behavior_available: bool,
    pub(crate) public_root_error_callbacks_invoked: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateErrorBoundaryDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
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
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn root_error_options(self) -> TestRendererRootErrorOptionDiagnostics {
        self.root_error_options
    }

    #[must_use]
    pub const fn dependency_diagnostics(
        self,
    ) -> TestRendererPrivateErrorBoundaryDependencyDiagnostics {
        self.dependency_diagnostics
    }

    #[must_use]
    pub const fn rows(&self) -> &[TestRendererPrivateErrorDiagnosticRow; 2] {
        &self.rows
    }

    #[must_use]
    pub const fn public_error_boundary_behavior_available(self) -> bool {
        self.public_error_boundary_behavior_available
    }

    #[must_use]
    pub const fn public_root_error_callbacks_invoked(self) -> bool {
        self.public_root_error_callbacks_invoked
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateErrorBoundaryCommitRecoveryMetadata {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) accepted_rust_api: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) operation: &'static str,
    pub(crate) update_failure_path: &'static str,
    pub(crate) commit_phase_recovery_path: &'static str,
    pub(crate) commit_phase_recovery_action: &'static str,
    pub(crate) react_reference: &'static str,
    pub(crate) source_update_record: &'static str,
    pub(crate) source_update_record_id: &'static str,
    pub(crate) source_update_record_status: &'static str,
    pub(crate) source_update_kind: TestRendererRootUpdateKind,
    pub(crate) source_failure_record: &'static str,
    pub(crate) source_commit_recovery_snapshot_record: &'static str,
    pub(crate) root_error_options: TestRendererRootErrorOptionDiagnostics,
    pub(crate) consumes_accepted_rust_update_metadata: bool,
    pub(crate) consumes_accepted_rust_failure_metadata: bool,
    pub(crate) consumes_accepted_commit_recovery_snapshot: bool,
    pub(crate) preserves_root_error_option_handles: bool,
    pub(crate) commit_phase_recovery_path_consumed: bool,
    pub(crate) root_error_update_scheduled: bool,
    pub(crate) public_root_error_callbacks_invoked: bool,
    pub(crate) public_error_boundary_behavior_available: bool,
    pub(crate) public_error_recovery_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateErrorBoundaryCommitRecoveryMetadata {
    pub(crate) fn from_update_execution_for_canary(
        root: FiberRootId,
        execution: TestRendererUpdateNativeBridgeAdmission,
        root_error_options: TestRendererRootErrorOptionDiagnostics,
    ) -> Self {
        Self {
            diagnostic_name: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_STATUS,
            accepted_rust_api: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_API,
            root,
            operation: "update",
            update_failure_path: "commit",
            commit_phase_recovery_path: "ReactFiberWorkLoop.captureCommitPhaseError",
            commit_phase_recovery_action: "createRootErrorUpdate(SyncLane)",
            react_reference: "ReactFiberWorkLoop.captureCommitPhaseError -> createRootErrorUpdate(SyncLane)",
            source_update_record: "TestRendererUpdateNativeBridgeAdmission",
            source_update_record_id: execution.diagnostic_id(),
            source_update_record_status: execution.status(),
            source_update_kind: execution.scheduled_update_kind(),
            source_failure_record: "HostRootRenderFailureRecoveryCommitEvidenceForCanary",
            source_commit_recovery_snapshot_record: "HostRootCommitRecoverySnapshotForCanary",
            root_error_options,
            consumes_accepted_rust_update_metadata: true,
            consumes_accepted_rust_failure_metadata: true,
            consumes_accepted_commit_recovery_snapshot: true,
            preserves_root_error_option_handles: true,
            commit_phase_recovery_path_consumed: true,
            root_error_update_scheduled: false,
            public_root_error_callbacks_invoked: false,
            public_error_boundary_behavior_available: false,
            public_error_recovery_available: false,
            compatibility_claimed: false,
        }
    }

    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn accepted_rust_api(self) -> &'static str {
        self.accepted_rust_api
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn update_failure_path(self) -> &'static str {
        self.update_failure_path
    }

    #[must_use]
    pub const fn commit_phase_recovery_path(self) -> &'static str {
        self.commit_phase_recovery_path
    }

    #[must_use]
    pub const fn commit_phase_recovery_action(self) -> &'static str {
        self.commit_phase_recovery_action
    }

    #[must_use]
    pub const fn react_reference(self) -> &'static str {
        self.react_reference
    }

    #[must_use]
    pub const fn source_update_record(self) -> &'static str {
        self.source_update_record
    }

    #[must_use]
    pub const fn source_update_record_id(self) -> &'static str {
        self.source_update_record_id
    }

    #[must_use]
    pub const fn source_update_record_status(self) -> &'static str {
        self.source_update_record_status
    }

    #[must_use]
    pub const fn source_update_kind(self) -> TestRendererRootUpdateKind {
        self.source_update_kind
    }

    #[must_use]
    pub const fn source_failure_record(self) -> &'static str {
        self.source_failure_record
    }

    #[must_use]
    pub const fn source_commit_recovery_snapshot_record(self) -> &'static str {
        self.source_commit_recovery_snapshot_record
    }

    #[must_use]
    pub const fn root_error_options(self) -> TestRendererRootErrorOptionDiagnostics {
        self.root_error_options
    }

    #[must_use]
    pub const fn consumes_accepted_rust_update_metadata(self) -> bool {
        self.consumes_accepted_rust_update_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_rust_failure_metadata(self) -> bool {
        self.consumes_accepted_rust_failure_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_commit_recovery_snapshot(self) -> bool {
        self.consumes_accepted_commit_recovery_snapshot
    }

    #[must_use]
    pub const fn preserves_root_error_option_handles(self) -> bool {
        self.preserves_root_error_option_handles
    }

    #[must_use]
    pub const fn commit_phase_recovery_path_consumed(self) -> bool {
        self.commit_phase_recovery_path_consumed
    }

    #[must_use]
    pub const fn root_error_update_scheduled(self) -> bool {
        self.root_error_update_scheduled
    }

    #[must_use]
    pub const fn public_root_error_callbacks_invoked(self) -> bool {
        self.public_root_error_callbacks_invoked
    }

    #[must_use]
    pub const fn public_error_boundary_behavior_available(self) -> bool {
        self.public_error_boundary_behavior_available
    }

    #[must_use]
    pub const fn public_error_recovery_available(self) -> bool {
        self.public_error_recovery_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub fn accepted_private_commit_phase_recovery_metadata(self) -> bool {
        self.root_error_options
            .root_error_option_metadata_available()
            && self.root_error_options.has_configured_error_callback()
            && self.source_update_record_id
                == TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
            && self.source_update_record_status
                == TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
            && matches!(self.source_update_kind, TestRendererRootUpdateKind::Update)
            && self.consumes_accepted_rust_update_metadata
            && self.consumes_accepted_rust_failure_metadata
            && self.consumes_accepted_commit_recovery_snapshot
            && self.preserves_root_error_option_handles
            && self.commit_phase_recovery_path_consumed
            && !self.root_error_update_scheduled
            && !self.public_root_error_callbacks_invoked
            && !self.public_error_boundary_behavior_available
            && !self.public_error_recovery_available
            && !self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateErrorBoundaryNativeExecutionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) update_failure_path: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) source_execution_scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) error_diagnostics: TestRendererPrivateErrorBoundaryDiagnostics,
    pub(crate) commit_recovery_metadata: TestRendererPrivateErrorBoundaryCommitRecoveryMetadata,
    pub(crate) rows: [TestRendererPrivateErrorDiagnosticRow; 2],
    pub(crate) row_count: usize,
    pub(crate) consumes_accepted_root_execution_diagnostics: bool,
    pub(crate) consumes_accepted_native_update_execution_record: bool,
    pub(crate) consumes_private_error_boundary_diagnostics: bool,
    pub(crate) consumes_private_commit_recovery_metadata: bool,
    pub(crate) consumes_accepted_rust_failure_metadata: bool,
    pub(crate) preserves_root_error_option_handles: bool,
    pub(crate) consumes_update_error_row: bool,
    pub(crate) consumes_commit_error_row: bool,
    pub(crate) root_error_update_scheduled: bool,
    pub(crate) public_root_error_callbacks_invoked: bool,
    pub(crate) public_error_boundary_behavior_available: bool,
    pub(crate) error_boundary_recovery_executed: bool,
    pub(crate) public_error_recovery_available: bool,
    pub(crate) public_commit_phase_recovery_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) rust_execution_from_js: bool,
    pub(crate) reconciler_execution_from_js: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateErrorBoundaryNativeExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
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
    pub const fn operation(self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn update_failure_path(self) -> &'static str {
        self.update_failure_path
    }

    #[must_use]
    pub const fn source_execution_record_id(self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_execution_scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.source_execution_scheduled_update_kind
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn error_diagnostics(self) -> TestRendererPrivateErrorBoundaryDiagnostics {
        self.error_diagnostics
    }

    #[must_use]
    pub const fn commit_recovery_metadata(
        self,
    ) -> TestRendererPrivateErrorBoundaryCommitRecoveryMetadata {
        self.commit_recovery_metadata
    }

    #[must_use]
    pub const fn rows(&self) -> &[TestRendererPrivateErrorDiagnosticRow; 2] {
        &self.rows
    }

    #[must_use]
    pub const fn row_count(self) -> usize {
        self.row_count
    }

    #[must_use]
    pub const fn consumes_accepted_root_execution_diagnostics(self) -> bool {
        self.consumes_accepted_root_execution_diagnostics
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_private_error_boundary_diagnostics(self) -> bool {
        self.consumes_private_error_boundary_diagnostics
    }

    #[must_use]
    pub const fn consumes_private_commit_recovery_metadata(self) -> bool {
        self.consumes_private_commit_recovery_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_rust_failure_metadata(self) -> bool {
        self.consumes_accepted_rust_failure_metadata
    }

    #[must_use]
    pub const fn preserves_root_error_option_handles(self) -> bool {
        self.preserves_root_error_option_handles
    }

    #[must_use]
    pub const fn consumes_update_error_row(self) -> bool {
        self.consumes_update_error_row
    }

    #[must_use]
    pub const fn consumes_commit_error_row(self) -> bool {
        self.consumes_commit_error_row
    }

    #[must_use]
    pub const fn root_error_update_scheduled(self) -> bool {
        self.root_error_update_scheduled
    }

    #[must_use]
    pub const fn public_root_error_callbacks_invoked(self) -> bool {
        self.public_root_error_callbacks_invoked
    }

    #[must_use]
    pub const fn public_error_boundary_behavior_available(self) -> bool {
        self.public_error_boundary_behavior_available
    }

    #[must_use]
    pub const fn error_boundary_recovery_executed(self) -> bool {
        self.error_boundary_recovery_executed
    }

    #[must_use]
    pub const fn public_error_recovery_available(self) -> bool {
        self.public_error_recovery_available
    }

    #[must_use]
    pub const fn public_commit_phase_recovery_available(self) -> bool {
        self.public_commit_phase_recovery_available
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn rust_execution_from_js(self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn reconciler_execution_from_js(self) -> bool {
        self.reconciler_execution_from_js
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererSerializationGateStatus {
    ClosedMissingHostOutput,
    ClosedMissingFiberInspection,
    ReadyForPrivateSerializationDiagnostics,
}

impl TestRendererSerializationGateStatus {
    #[must_use]
    pub const fn is_ready(self) -> bool {
        matches!(self, Self::ReadyForPrivateSerializationDiagnostics)
    }

    #[must_use]
    pub const fn is_closed(self) -> bool {
        !self.is_ready()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererSerializationGateRequirements {
    pub(crate) root_commit_diagnostics_available: bool,
    pub(crate) real_host_output_available: bool,
    pub(crate) committed_fiber_inspection_available: bool,
}

impl TestRendererSerializationGateRequirements {
    #[must_use]
    pub const fn root_commit_diagnostics_available(self) -> bool {
        self.root_commit_diagnostics_available
    }

    #[must_use]
    pub const fn real_host_output_available(self) -> bool {
        self.real_host_output_available
    }

    #[must_use]
    pub const fn committed_fiber_inspection_available(self) -> bool {
        self.committed_fiber_inspection_available
    }

    #[must_use]
    pub const fn private_serialization_ready(self) -> bool {
        self.root_commit_diagnostics_available
            && self.real_host_output_available
            && self.committed_fiber_inspection_available
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererSerializationOracleDiagnostics {
    pub(crate) oracle_kind: &'static str,
    pub(crate) probe_mode_count: usize,
    pub(crate) scenario_count: usize,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererSerializationOracleDiagnostics {
    #[must_use]
    pub const fn current() -> Self {
        Self {
            oracle_kind: TEST_RENDERER_SERIALIZATION_ORACLE_KIND,
            probe_mode_count: TEST_RENDERER_SERIALIZATION_ORACLE_PROBE_MODE_COUNT,
            scenario_count: TEST_RENDERER_SERIALIZATION_ORACLE_SCENARIO_COUNT,
            compatibility_claimed: false,
        }
    }

    #[must_use]
    pub const fn oracle_kind(self) -> &'static str {
        self.oracle_kind
    }

    #[must_use]
    pub const fn probe_mode_count(self) -> usize {
        self.probe_mode_count
    }

    #[must_use]
    pub const fn scenario_count(self) -> usize {
        self.scenario_count
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererFiberHandleDiagnostics {
    pub(crate) arena_id: u64,
    pub(crate) slot: usize,
    pub(crate) generation: u64,
}

impl TestRendererFiberHandleDiagnostics {
    #[must_use]
    pub const fn from_raw_parts_for_canary(arena_id: u64, slot: usize, generation: u64) -> Self {
        Self {
            arena_id,
            slot,
            generation,
        }
    }

    #[must_use]
    pub const fn arena_id(self) -> u64 {
        self.arena_id
    }

    #[must_use]
    pub const fn slot(self) -> usize {
        self.slot
    }

    #[must_use]
    pub const fn generation(self) -> u64 {
        self.generation
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateActPendingPassiveFlushMetadata {
    pub(crate) root: FiberRootId,
    pub(crate) finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) pending_unmount_count: usize,
    pub(crate) pending_mount_count: usize,
    pub(crate) scheduler_request_order: usize,
    pub(crate) scheduler_priority: &'static str,
}

impl TestRendererPrivateActPendingPassiveFlushMetadata {
    #[must_use]
    pub const fn new_for_canary(
        root: FiberRootId,
        finished_work: TestRendererFiberHandleDiagnostics,
        pending_unmount_count: usize,
        pending_mount_count: usize,
    ) -> Self {
        Self {
            root,
            finished_work,
            pending_unmount_count,
            pending_mount_count,
            scheduler_request_order: 0,
            scheduler_priority: "Normal",
        }
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.finished_work
    }

    #[must_use]
    pub const fn pending_unmount_count(self) -> usize {
        self.pending_unmount_count
    }

    #[must_use]
    pub const fn pending_mount_count(self) -> usize {
        self.pending_mount_count
    }

    #[must_use]
    pub const fn pending_record_count(self) -> usize {
        self.pending_unmount_count + self.pending_mount_count
    }

    #[must_use]
    pub const fn scheduler_request_order(self) -> usize {
        self.scheduler_request_order
    }

    #[must_use]
    pub const fn scheduler_priority(self) -> &'static str {
        self.scheduler_priority
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateActPassiveEffectDrainDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) accepted_reconciler_records: [&'static str; 5],
    pub(crate) metadata: TestRendererPrivateActPendingPassiveFlushMetadata,
    pub(crate) metadata_root_matches_renderer_root: bool,
    pub(crate) consumes_pending_passive_flush_metadata: bool,
    pub(crate) consumes_accepted_scheduler_flush_metadata: bool,
    pub(crate) private_scheduler_flush_request_metadata_consumed: bool,
    pub(crate) consumes_accepted_native_update_execution: bool,
    pub(crate) private_update_native_bridge_admission:
        Option<TestRendererUpdateNativeBridgeAdmission>,
    pub(crate) host_output_produced_from_native_update: bool,
    pub(crate) executes_passive_effects: bool,
    pub(crate) invokes_effect_callbacks: bool,
    pub(crate) invokes_act_callback: bool,
    pub(crate) public_update_compatibility_claimed: bool,
    pub(crate) public_act_compatibility_claimed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateActPassiveEffectDrainDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn accepted_reconciler_records(&self) -> &[&'static str; 5] {
        &self.accepted_reconciler_records
    }

    #[must_use]
    pub const fn metadata(&self) -> TestRendererPrivateActPendingPassiveFlushMetadata {
        self.metadata
    }

    #[must_use]
    pub const fn metadata_root_matches_renderer_root(&self) -> bool {
        self.metadata_root_matches_renderer_root
    }

    #[must_use]
    pub const fn consumes_pending_passive_flush_metadata(&self) -> bool {
        self.consumes_pending_passive_flush_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_scheduler_flush_metadata(&self) -> bool {
        self.consumes_accepted_scheduler_flush_metadata
    }

    #[must_use]
    pub const fn private_scheduler_flush_request_metadata_consumed(&self) -> bool {
        self.private_scheduler_flush_request_metadata_consumed
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution(&self) -> bool {
        self.consumes_accepted_native_update_execution
    }

    #[must_use]
    pub const fn private_update_native_bridge_admission(
        &self,
    ) -> Option<TestRendererUpdateNativeBridgeAdmission> {
        self.private_update_native_bridge_admission
    }

    #[must_use]
    pub const fn host_output_produced_from_native_update(&self) -> bool {
        self.host_output_produced_from_native_update
    }

    #[must_use]
    pub const fn executes_passive_effects(&self) -> bool {
        self.executes_passive_effects
    }

    #[must_use]
    pub const fn invokes_effect_callbacks(&self) -> bool {
        self.invokes_effect_callbacks
    }

    #[must_use]
    pub const fn invokes_act_callback(&self) -> bool {
        self.invokes_act_callback
    }

    #[must_use]
    pub const fn public_update_compatibility_claimed(&self) -> bool {
        self.public_update_compatibility_claimed
    }

    #[must_use]
    pub const fn public_act_compatibility_claimed(&self) -> bool {
        self.public_act_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateActNestedScopePassiveFlushDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) passive_drain: TestRendererPrivateActPassiveEffectDrainDiagnostics,
    pub(crate) flush_order: [&'static str; 5],
    pub(crate) outer_scope_depth: usize,
    pub(crate) inner_scope_depth: usize,
    pub(crate) passive_flush_order_index: usize,
    pub(crate) pending_unmount_count: usize,
    pub(crate) pending_mount_count: usize,
    pub(crate) pending_passive_record_count: usize,
    pub(crate) nested_scope_metadata_accepted: bool,
    pub(crate) private_passive_flush_metadata_accepted: bool,
    pub(crate) drains_accepted_pending_passive_flush_metadata: bool,
    pub(crate) deterministic_flush_order: bool,
    pub(crate) public_act_scope_depth_tracking_available: bool,
    pub(crate) public_nested_act_queue_reuse_available: bool,
    pub(crate) public_overlapping_act_warning_emission_available: bool,
    pub(crate) invokes_act_callback: bool,
    pub(crate) executes_passive_effects: bool,
    pub(crate) invokes_effect_callbacks: bool,
    pub(crate) public_act_compatibility_claimed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateActNestedScopePassiveFlushDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn passive_drain(&self) -> &TestRendererPrivateActPassiveEffectDrainDiagnostics {
        &self.passive_drain
    }

    #[must_use]
    pub const fn flush_order(&self) -> &[&'static str; 5] {
        &self.flush_order
    }

    #[must_use]
    pub const fn outer_scope_depth(&self) -> usize {
        self.outer_scope_depth
    }

    #[must_use]
    pub const fn inner_scope_depth(&self) -> usize {
        self.inner_scope_depth
    }

    #[must_use]
    pub const fn passive_flush_order_index(&self) -> usize {
        self.passive_flush_order_index
    }

    #[must_use]
    pub const fn pending_unmount_count(&self) -> usize {
        self.pending_unmount_count
    }

    #[must_use]
    pub const fn pending_mount_count(&self) -> usize {
        self.pending_mount_count
    }

    #[must_use]
    pub const fn pending_passive_record_count(&self) -> usize {
        self.pending_passive_record_count
    }

    #[must_use]
    pub const fn nested_scope_metadata_accepted(&self) -> bool {
        self.nested_scope_metadata_accepted
    }

    #[must_use]
    pub const fn private_passive_flush_metadata_accepted(&self) -> bool {
        self.private_passive_flush_metadata_accepted
    }

    #[must_use]
    pub const fn drains_accepted_pending_passive_flush_metadata(&self) -> bool {
        self.drains_accepted_pending_passive_flush_metadata
    }

    #[must_use]
    pub const fn deterministic_flush_order(&self) -> bool {
        self.deterministic_flush_order
    }

    #[must_use]
    pub const fn public_act_scope_depth_tracking_available(&self) -> bool {
        self.public_act_scope_depth_tracking_available
    }

    #[must_use]
    pub const fn public_nested_act_queue_reuse_available(&self) -> bool {
        self.public_nested_act_queue_reuse_available
    }

    #[must_use]
    pub const fn public_overlapping_act_warning_emission_available(&self) -> bool {
        self.public_overlapping_act_warning_emission_available
    }

    #[must_use]
    pub const fn invokes_act_callback(&self) -> bool {
        self.invokes_act_callback
    }

    #[must_use]
    pub const fn executes_passive_effects(&self) -> bool {
        self.executes_passive_effects
    }

    #[must_use]
    pub const fn invokes_effect_callbacks(&self) -> bool {
        self.invokes_effect_callbacks
    }

    #[must_use]
    pub const fn public_act_compatibility_claimed(&self) -> bool {
        self.public_act_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootUpdateCallbackDiagnostics {
    pub(crate) empty: bool,
    pub(crate) visible_count: usize,
    pub(crate) hidden_count: usize,
    pub(crate) deferred_hidden_count: usize,
}

impl TestRendererRootUpdateCallbackDiagnostics {
    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.empty
    }

    #[must_use]
    pub const fn visible_count(self) -> usize {
        self.visible_count
    }

    #[must_use]
    pub const fn hidden_count(self) -> usize {
        self.hidden_count
    }

    #[must_use]
    pub const fn deferred_hidden_count(self) -> usize {
        self.deferred_hidden_count
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererCommitDiagnostics {
    pub(crate) root: FiberRootId,
    pub(crate) lifecycle: TestRendererRootLifecycle,
    pub(crate) last_update_kind: Option<TestRendererRootUpdateKind>,
    pub(crate) last_scheduled_element: Option<RootElementHandle>,
    pub(crate) previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) current: TestRendererFiberHandleDiagnostics,
    pub(crate) finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) finished_lanes_bits: u32,
    pub(crate) remaining_lanes_bits: u32,
    pub(crate) pending_lanes_bits: u32,
    pub(crate) finished_lanes_empty: bool,
    pub(crate) finished_lanes_include_sync: bool,
    pub(crate) remaining_lanes_empty: bool,
    pub(crate) pending_lanes_empty: bool,
    pub(crate) has_remaining_work: bool,
    pub(crate) root_update_callbacks: TestRendererRootUpdateCallbackDiagnostics,
}

impl TestRendererCommitDiagnostics {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn lifecycle(self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn last_update_kind(self) -> Option<TestRendererRootUpdateKind> {
        self.last_update_kind
    }

    #[must_use]
    pub const fn last_scheduled_element(self) -> Option<RootElementHandle> {
        self.last_scheduled_element
    }

    #[must_use]
    pub const fn previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.previous_current
    }

    #[must_use]
    pub const fn current(self) -> TestRendererFiberHandleDiagnostics {
        self.current
    }

    #[must_use]
    pub const fn finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.finished_work
    }

    #[must_use]
    pub const fn finished_lanes_bits(self) -> u32 {
        self.finished_lanes_bits
    }

    #[must_use]
    pub const fn remaining_lanes_bits(self) -> u32 {
        self.remaining_lanes_bits
    }

    #[must_use]
    pub const fn pending_lanes_bits(self) -> u32 {
        self.pending_lanes_bits
    }

    #[must_use]
    pub const fn finished_lanes_empty(self) -> bool {
        self.finished_lanes_empty
    }

    #[must_use]
    pub const fn finished_lanes_include_sync(self) -> bool {
        self.finished_lanes_include_sync
    }

    #[must_use]
    pub const fn remaining_lanes_empty(self) -> bool {
        self.remaining_lanes_empty
    }

    #[must_use]
    pub const fn pending_lanes_empty(self) -> bool {
        self.pending_lanes_empty
    }

    #[must_use]
    pub const fn has_remaining_work(self) -> bool {
        self.has_remaining_work
    }

    #[must_use]
    pub const fn root_update_callbacks(self) -> TestRendererRootUpdateCallbackDiagnostics {
        self.root_update_callbacks
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererHostOutputDiagnostics {
    pub(crate) container_child_count: usize,
    pub(crate) instance_count: usize,
    pub(crate) text_count: usize,
    pub(crate) real_host_output_available: bool,
}

impl TestRendererHostOutputDiagnostics {
    #[must_use]
    pub const fn container_child_count(self) -> usize {
        self.container_child_count
    }

    #[must_use]
    pub const fn instance_count(self) -> usize {
        self.instance_count
    }

    #[must_use]
    pub const fn text_count(self) -> usize {
        self.text_count
    }

    #[must_use]
    pub const fn real_host_output_available(self) -> bool {
        self.real_host_output_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererSerializationGateReport {
    pub(crate) gate_name: &'static str,
    pub(crate) status: TestRendererSerializationGateStatus,
    pub(crate) requirements: TestRendererSerializationGateRequirements,
    pub(crate) oracle: TestRendererSerializationOracleDiagnostics,
    pub(crate) commit: TestRendererCommitDiagnostics,
    pub(crate) host_output: TestRendererHostOutputDiagnostics,
    pub(crate) fiber_inspection: Option<Box<TestRendererCommittedFiberTreeInspection>>,
}

impl TestRendererSerializationGateReport {
    #[must_use]
    pub const fn gate_name(&self) -> &'static str {
        self.gate_name
    }

    #[must_use]
    pub const fn status(&self) -> TestRendererSerializationGateStatus {
        self.status
    }

    #[must_use]
    pub const fn is_ready(&self) -> bool {
        self.status.is_ready()
    }

    #[must_use]
    pub const fn is_closed(&self) -> bool {
        self.status.is_closed()
    }

    #[must_use]
    pub const fn requirements(&self) -> TestRendererSerializationGateRequirements {
        self.requirements
    }

    #[must_use]
    pub const fn oracle(&self) -> TestRendererSerializationOracleDiagnostics {
        self.oracle
    }

    #[must_use]
    pub const fn commit(&self) -> TestRendererCommitDiagnostics {
        self.commit
    }

    #[must_use]
    pub const fn host_output(&self) -> TestRendererHostOutputDiagnostics {
        self.host_output
    }

    #[must_use]
    pub fn fiber_inspection(&self) -> Option<&TestRendererCommittedFiberTreeInspection> {
        self.fiber_inspection.as_deref()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateJsonNodeKind {
    RootArray,
    HostComponent,
    Text,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateJsonPublicSurfaceBlockers {
    pub(crate) json_method_blocked: bool,
    pub(crate) tree_method_blocked: bool,
    pub(crate) instance_wrapper_blocked: bool,
    pub(crate) js_facade_routing_blocked: bool,
    pub(crate) public_act_blocked: bool,
    pub(crate) compatibility_claim_blocked: bool,
}

impl TestRendererPrivateJsonPublicSurfaceBlockers {
    #[must_use]
    pub const fn blocked() -> Self {
        Self {
            json_method_blocked: true,
            tree_method_blocked: true,
            instance_wrapper_blocked: true,
            js_facade_routing_blocked: true,
            public_act_blocked: true,
            compatibility_claim_blocked: true,
        }
    }

    #[must_use]
    pub const fn json_method_blocked(self) -> bool {
        self.json_method_blocked
    }

    #[must_use]
    pub const fn tree_method_blocked(self) -> bool {
        self.tree_method_blocked
    }

    #[must_use]
    pub const fn instance_wrapper_blocked(self) -> bool {
        self.instance_wrapper_blocked
    }

    #[must_use]
    pub const fn js_facade_routing_blocked(self) -> bool {
        self.js_facade_routing_blocked
    }

    #[must_use]
    pub const fn public_act_blocked(self) -> bool {
        self.public_act_blocked
    }

    #[must_use]
    pub const fn compatibility_claim_blocked(self) -> bool {
        self.compatibility_claim_blocked
    }

    #[must_use]
    pub const fn all_blocked(self) -> bool {
        self.json_method_blocked
            && self.tree_method_blocked
            && self.instance_wrapper_blocked
            && self.js_facade_routing_blocked
            && self.public_act_blocked
            && self.compatibility_claim_blocked
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonHostOutputDependencyDiagnostics {
    pub(crate) route_row_id: &'static str,
    pub(crate) serialization_row_id: &'static str,
    pub(crate) route_diagnostics_available: bool,
    pub(crate) serialization_diagnostics_available: bool,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonHostOutputDependencyDiagnostics {
    #[must_use]
    pub const fn route_row_id(self) -> &'static str {
        self.route_row_id
    }

    #[must_use]
    pub const fn serialization_row_id(self) -> &'static str {
        self.serialization_row_id
    }

    #[must_use]
    pub const fn route_diagnostics_available(self) -> bool {
        self.route_diagnostics_available
    }

    #[must_use]
    pub const fn serialization_diagnostics_available(self) -> bool {
        self.serialization_diagnostics_available
    }

    #[must_use]
    pub const fn host_output_snapshot_current(self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub const fn public_surfaces_blocked(self) -> bool {
        !self.public_to_json_available
            && !self.public_test_instance_available
            && !self.native_execution_available
            && !self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateToJsonHostOutputShape {
    EmptyRoot,
    SingleHostText,
    MultiChildHostText,
    NestedHostText,
    SiblingText,
}

impl TestRendererPrivateToJsonHostOutputShape {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::EmptyRoot => "EmptyRoot",
            Self::SingleHostText => "SingleHostText",
            Self::MultiChildHostText => "MultiChildHostText",
            Self::NestedHostText => "NestedHostText",
            Self::SiblingText => "SiblingText",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonHostOutputShapeDiagnostics {
    pub(crate) shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_component_count: usize,
    pub(crate) host_text_count: usize,
    pub(crate) root_text_count: usize,
    pub(crate) max_host_component_depth: usize,
}

impl TestRendererPrivateToJsonHostOutputShapeDiagnostics {
    #[must_use]
    pub const fn shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.shape
    }

    #[must_use]
    pub const fn host_component_count(self) -> usize {
        self.host_component_count
    }

    #[must_use]
    pub const fn host_text_count(self) -> usize {
        self.host_text_count
    }

    #[must_use]
    pub const fn root_text_count(self) -> usize {
        self.root_text_count
    }

    #[must_use]
    pub const fn max_host_component_depth(self) -> usize {
        self.max_host_component_depth
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateRootLifecycleExecutionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) scheduled_update_sequence: usize,
    pub(crate) lifecycle: TestRendererRootLifecycle,
    pub(crate) scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) previous_snapshot: Option<TestContainerSnapshot>,
    pub(crate) snapshot: TestContainerSnapshot,
    pub(crate) executed_element_type: Option<TestElementType>,
    pub(crate) executed_props: Option<TestProps>,
    pub(crate) executed_text: Option<String>,
    pub(crate) detached_instance_snapshot: Option<TestElementSnapshot>,
    pub(crate) root_child_count: usize,
    pub(crate) previous_root_child_count: usize,
    pub(crate) host_component_count: usize,
    pub(crate) host_text_count: usize,
    pub(crate) host_node_cleanup_count: usize,
    pub(crate) host_update_apply_count: usize,
    pub(crate) source_renderer_owner_accepted: bool,
    pub(crate) source_lifecycle_row_accepted: bool,
    pub(crate) source_reconciler_host_execution_consumed: bool,
    pub(crate) snapshot_produced_from_executed_state: bool,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) public_root_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) public_act_available: bool,
    pub(crate) public_scheduler_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) js_package_available: bool,
    pub(crate) compatibility_claimed: bool,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
}

impl TestRendererPrivateRootLifecycleExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(&self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(&self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(&self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn scheduled_update_sequence(&self) -> usize {
        self.scheduled_update_sequence
    }

    #[must_use]
    pub const fn lifecycle(&self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn scheduled_update_kind(&self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(&self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub fn previous_snapshot(&self) -> Option<&TestContainerSnapshot> {
        self.previous_snapshot.as_ref()
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub fn executed_element_type(&self) -> Option<&TestElementType> {
        self.executed_element_type.as_ref()
    }

    #[must_use]
    pub fn executed_props(&self) -> Option<&TestProps> {
        self.executed_props.as_ref()
    }

    #[must_use]
    pub fn executed_text(&self) -> Option<&str> {
        self.executed_text.as_deref()
    }

    #[must_use]
    pub fn detached_instance_snapshot(&self) -> Option<&TestElementSnapshot> {
        self.detached_instance_snapshot.as_ref()
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn previous_root_child_count(&self) -> usize {
        self.previous_root_child_count
    }

    #[must_use]
    pub const fn host_component_count(&self) -> usize {
        self.host_component_count
    }

    #[must_use]
    pub const fn host_text_count(&self) -> usize {
        self.host_text_count
    }

    #[must_use]
    pub const fn host_node_cleanup_count(&self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub const fn host_update_apply_count(&self) -> usize {
        self.host_update_apply_count
    }

    #[must_use]
    pub const fn source_renderer_owner_accepted(&self) -> bool {
        self.source_renderer_owner_accepted
    }

    #[must_use]
    pub const fn source_lifecycle_row_accepted(&self) -> bool {
        self.source_lifecycle_row_accepted
    }

    #[must_use]
    pub const fn source_reconciler_host_execution_consumed(&self) -> bool {
        self.source_reconciler_host_execution_consumed
    }

    #[must_use]
    pub const fn snapshot_produced_from_executed_state(&self) -> bool {
        self.snapshot_produced_from_executed_state
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn source_owned_execution_accepted(&self) -> bool {
        self.source_renderer_owner_accepted
            && self.source_lifecycle_row_accepted
            && self.source_reconciler_host_execution_consumed
            && self.snapshot_produced_from_executed_state
            && self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn public_root_available(&self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_test_instance_available(&self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn public_act_available(&self) -> bool {
        self.public_act_available
    }

    #[must_use]
    pub const fn public_scheduler_available(&self) -> bool {
        self.public_scheduler_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn js_package_available(&self) -> bool {
        self.js_package_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_surfaces_blocked(&self) -> bool {
        !self.public_root_available
            && !self.public_serialization_available
            && !self.public_test_instance_available
            && !self.public_act_available
            && !self.public_scheduler_available
            && !self.native_bridge_available
            && !self.native_execution_available
            && !self.js_package_available
            && !self.compatibility_claimed
            && self.public_blockers.all_blocked()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonHostOutputRow {
    pub(crate) id: &'static str,
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) previous_root_child_count: usize,
    pub(crate) current_root_child_count: usize,
    pub(crate) previous_host_component_count: usize,
    pub(crate) current_host_component_count: usize,
    pub(crate) previous_host_text_count: usize,
    pub(crate) current_host_text_count: usize,
    pub(crate) current_root_text_count: usize,
    pub(crate) current_max_host_component_depth: usize,
    pub(crate) dependency_diagnostics: TestRendererPrivateToJsonHostOutputDependencyDiagnostics,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
}

impl TestRendererPrivateToJsonHostOutputRow {
    #[must_use]
    pub const fn id(self) -> &'static str {
        self.id
    }

    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
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
    pub const fn previous_host_component_count(self) -> usize {
        self.previous_host_component_count
    }

    #[must_use]
    pub const fn current_host_component_count(self) -> usize {
        self.current_host_component_count
    }

    #[must_use]
    pub const fn previous_host_text_count(self) -> usize {
        self.previous_host_text_count
    }

    #[must_use]
    pub const fn current_host_text_count(self) -> usize {
        self.current_host_text_count
    }

    #[must_use]
    pub const fn current_root_text_count(self) -> usize {
        self.current_root_text_count
    }

    #[must_use]
    pub const fn current_max_host_component_depth(self) -> usize {
        self.current_max_host_component_depth
    }

    #[must_use]
    pub const fn dependency_diagnostics(
        self,
    ) -> TestRendererPrivateToJsonHostOutputDependencyDiagnostics {
        self.dependency_diagnostics
    }

    #[must_use]
    pub const fn public_blockers(self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateJsonFiberDiagnostic {
    pub(crate) fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) parent: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) child: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) sibling: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) index: usize,
    pub(crate) alternate: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) pending_props_raw: u64,
    pub(crate) memoized_props_raw: u64,
    pub(crate) lanes_bits: u32,
    pub(crate) child_lanes_bits: u32,
    pub(crate) flags_bits: u32,
    pub(crate) subtree_flags_bits: u32,
    pub(crate) state_node_present: bool,
}

impl TestRendererPrivateJsonFiberDiagnostic {
    #[must_use]
    pub const fn fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.fiber
    }

    #[must_use]
    pub const fn parent(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.parent
    }

    #[must_use]
    pub const fn child(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.child
    }

    #[must_use]
    pub const fn sibling(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.sibling
    }

    #[must_use]
    pub const fn index(self) -> usize {
        self.index
    }

    #[must_use]
    pub const fn alternate(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.alternate
    }

    #[must_use]
    pub const fn pending_props_raw(self) -> u64 {
        self.pending_props_raw
    }

    #[must_use]
    pub const fn memoized_props_raw(self) -> u64 {
        self.memoized_props_raw
    }

    #[must_use]
    pub const fn lanes_bits(self) -> u32 {
        self.lanes_bits
    }

    #[must_use]
    pub const fn child_lanes_bits(self) -> u32 {
        self.child_lanes_bits
    }

    #[must_use]
    pub const fn flags_bits(self) -> u32 {
        self.flags_bits
    }

    #[must_use]
    pub const fn subtree_flags_bits(self) -> u32 {
        self.subtree_flags_bits
    }

    #[must_use]
    pub const fn state_node_present(self) -> bool {
        self.state_node_present
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonNodeDiagnostic {
    pub(crate) ordinal: usize,
    pub(crate) node_kind: TestRendererPrivateJsonNodeKind,
    pub(crate) parent_ordinal: Option<usize>,
    pub(crate) child_ordinals: Vec<usize>,
    pub(crate) fiber: TestRendererPrivateJsonFiberDiagnostic,
    pub(crate) element_type: Option<TestElementType>,
    pub(crate) props: Option<TestProps>,
    pub(crate) text: Option<String>,
    pub(crate) hidden: bool,
    pub(crate) detached: bool,
}

impl TestRendererPrivateJsonNodeDiagnostic {
    #[must_use]
    pub const fn ordinal(&self) -> usize {
        self.ordinal
    }

    #[must_use]
    pub const fn node_kind(&self) -> TestRendererPrivateJsonNodeKind {
        self.node_kind
    }

    #[must_use]
    pub const fn parent_ordinal(&self) -> Option<usize> {
        self.parent_ordinal
    }

    #[must_use]
    pub fn child_ordinals(&self) -> &[usize] {
        &self.child_ordinals
    }

    #[must_use]
    pub fn child_count(&self) -> usize {
        self.child_ordinals.len()
    }

    #[must_use]
    pub const fn fiber(&self) -> TestRendererPrivateJsonFiberDiagnostic {
        self.fiber
    }

    #[must_use]
    pub fn element_type(&self) -> Option<&TestElementType> {
        self.element_type.as_ref()
    }

    #[must_use]
    pub fn props(&self) -> Option<&TestProps> {
        self.props.as_ref()
    }

    #[must_use]
    pub fn text(&self) -> Option<&str> {
        self.text.as_deref()
    }

    #[must_use]
    pub const fn is_hidden(&self) -> bool {
        self.hidden
    }

    #[must_use]
    pub const fn is_detached(&self) -> bool {
        self.detached
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateJsonRenderedRoot {
    Null,
    Text(String),
    HostComponent(TestRendererPrivateJsonRenderedHostComponent),
    Array(Vec<TestRendererPrivateJsonRenderedRoot>),
}

impl TestRendererPrivateJsonRenderedRoot {
    #[must_use]
    pub const fn is_null(&self) -> bool {
        matches!(self, Self::Null)
    }

    #[must_use]
    pub fn as_text(&self) -> Option<&str> {
        match self {
            Self::Text(text) => Some(text),
            Self::Null | Self::HostComponent(_) | Self::Array(_) => None,
        }
    }

    #[must_use]
    pub const fn as_host_component(&self) -> Option<&TestRendererPrivateJsonRenderedHostComponent> {
        match self {
            Self::HostComponent(component) => Some(component),
            Self::Null | Self::Text(_) | Self::Array(_) => None,
        }
    }

    #[must_use]
    pub fn as_array(&self) -> Option<&[TestRendererPrivateJsonRenderedRoot]> {
        match self {
            Self::Array(children) => Some(children),
            Self::Null | Self::Text(_) | Self::HostComponent(_) => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonRenderedHostComponent {
    pub(crate) element_type: TestElementType,
    pub(crate) props: BTreeMap<String, String>,
    pub(crate) children: Option<Vec<TestRendererPrivateJsonRenderedRoot>>,
}

impl TestRendererPrivateJsonRenderedHostComponent {
    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &BTreeMap<String, String> {
        &self.props
    }

    #[must_use]
    pub fn children(&self) -> Option<&[TestRendererPrivateJsonRenderedRoot]> {
        self.children.as_deref()
    }

    #[must_use]
    pub fn child_count(&self) -> usize {
        self.children.as_ref().map_or(0, Vec::len)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonTextDiagnostic {
    pub(crate) text: String,
    pub(crate) hidden: bool,
}

impl TestRendererPrivateJsonTextDiagnostic {
    #[must_use]
    pub fn text(&self) -> &str {
        &self.text
    }

    #[must_use]
    pub const fn node_kind(&self) -> TestRendererPrivateJsonNodeKind {
        TestRendererPrivateJsonNodeKind::Text
    }

    #[must_use]
    pub const fn is_hidden(&self) -> bool {
        self.hidden
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonHostComponentDiagnostic {
    pub(crate) element_type: TestElementType,
    pub(crate) props: TestProps,
    pub(crate) hidden: bool,
    pub(crate) detached: bool,
    pub(crate) child_count: usize,
    pub(crate) text_child: TestRendererPrivateJsonTextDiagnostic,
    pub(crate) text_children: Vec<TestRendererPrivateJsonTextDiagnostic>,
    pub(crate) host_child: Option<Box<TestRendererPrivateJsonHostComponentDiagnostic>>,
}

impl TestRendererPrivateJsonHostComponentDiagnostic {
    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn node_kind(&self) -> TestRendererPrivateJsonNodeKind {
        TestRendererPrivateJsonNodeKind::HostComponent
    }

    #[must_use]
    pub const fn is_hidden(&self) -> bool {
        self.hidden
    }

    #[must_use]
    pub const fn is_detached(&self) -> bool {
        self.detached
    }

    #[must_use]
    pub const fn child_count(&self) -> usize {
        self.child_count
    }

    #[must_use]
    pub const fn text_child(&self) -> &TestRendererPrivateJsonTextDiagnostic {
        &self.text_child
    }

    #[must_use]
    pub fn text_children(&self) -> &[TestRendererPrivateJsonTextDiagnostic] {
        &self.text_children
    }

    #[must_use]
    pub fn host_child(&self) -> Option<&TestRendererPrivateJsonHostComponentDiagnostic> {
        self.host_child.as_deref()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonFacadeResult {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_diagnostic_name: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) element_type: TestElementType,
    pub(crate) props: TestProps,
    pub(crate) children: Vec<String>,
    pub(crate) rendered_root: TestRendererPrivateJsonRenderedRoot,
    pub(crate) source_node_count: usize,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_serialization_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonFacadeResult {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_diagnostic_name(&self) -> &'static str {
        self.source_diagnostic_name
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(&self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn host_output_row(&self) -> Option<TestRendererPrivateToJsonHostOutputRow> {
        self.host_output_row
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub fn children(&self) -> &[String] {
        &self.children
    }

    #[must_use]
    pub const fn child_count(&self) -> usize {
        self.children.len()
    }

    #[must_use]
    pub const fn rendered_root(&self) -> &TestRendererPrivateJsonRenderedRoot {
        &self.rendered_root
    }

    #[must_use]
    pub const fn source_node_count(&self) -> usize {
        self.source_node_count
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonNativeExecutionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    pub(crate) rendered_root: TestRendererPrivateJsonRenderedRoot,
    pub(crate) source_node_count: usize,
    pub(crate) root_child_count: usize,
    pub(crate) consumes_accepted_native_create_execution_record: bool,
    pub(crate) consumes_accepted_native_update_execution_record: bool,
    pub(crate) consumes_accepted_native_unmount_execution_record: bool,
    pub(crate) consumes_private_to_json_evidence: bool,
    pub(crate) consumes_accepted_host_output_row: bool,
    pub(crate) source_finished_work_identity_diagnostic_name: Option<&'static str>,
    pub(crate) consumes_private_sibling_text_finished_work_identity_gate: bool,
    pub(crate) source_lifecycle_execution_diagnostic_name: Option<&'static str>,
    pub(crate) source_lifecycle_execution_status: Option<&'static str>,
    pub(crate) consumes_private_root_lifecycle_execution: bool,
    pub(crate) source_unmount_nested_source_report_admission_gate_diagnostic_name:
        Option<&'static str>,
    pub(crate) source_unmount_nested_source_report_admission_gate_status: Option<&'static str>,
    pub(crate) consumes_private_unmount_nested_source_report_admission_gate: bool,
    pub(crate) minimal_tree_shape: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonNativeExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(&self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(&self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(&self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(&self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn host_output_row(&self) -> Option<TestRendererPrivateToJsonHostOutputRow> {
        self.host_output_row
    }

    #[must_use]
    pub const fn rendered_root(&self) -> &TestRendererPrivateJsonRenderedRoot {
        &self.rendered_root
    }

    #[must_use]
    pub const fn source_node_count(&self) -> usize {
        self.source_node_count
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn consumes_accepted_native_create_execution_record(&self) -> bool {
        self.consumes_accepted_native_create_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(&self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_unmount_execution_record(&self) -> bool {
        self.consumes_accepted_native_unmount_execution_record
    }

    #[must_use]
    pub const fn consumes_private_to_json_evidence(&self) -> bool {
        self.consumes_private_to_json_evidence
    }

    #[must_use]
    pub const fn consumes_accepted_host_output_row(&self) -> bool {
        self.consumes_accepted_host_output_row
    }

    #[must_use]
    pub const fn source_finished_work_identity_diagnostic_name(&self) -> Option<&'static str> {
        self.source_finished_work_identity_diagnostic_name
    }

    #[must_use]
    pub const fn consumes_private_sibling_text_finished_work_identity_gate(&self) -> bool {
        self.consumes_private_sibling_text_finished_work_identity_gate
    }

    #[must_use]
    pub const fn source_lifecycle_execution_diagnostic_name(&self) -> Option<&'static str> {
        self.source_lifecycle_execution_diagnostic_name
    }

    #[must_use]
    pub const fn source_lifecycle_execution_status(&self) -> Option<&'static str> {
        self.source_lifecycle_execution_status
    }

    #[must_use]
    pub const fn consumes_private_root_lifecycle_execution(&self) -> bool {
        self.consumes_private_root_lifecycle_execution
    }

    #[must_use]
    pub const fn source_unmount_nested_source_report_admission_gate_diagnostic_name(
        &self,
    ) -> Option<&'static str> {
        self.source_unmount_nested_source_report_admission_gate_diagnostic_name
    }

    #[must_use]
    pub const fn source_unmount_nested_source_report_admission_gate_status(
        &self,
    ) -> Option<&'static str> {
        self.source_unmount_nested_source_report_admission_gate_status
    }

    #[must_use]
    pub const fn consumes_private_unmount_nested_source_report_admission_gate(&self) -> bool {
        self.consumes_private_unmount_nested_source_report_admission_gate
    }

    #[must_use]
    pub const fn minimal_tree_shape(&self) -> bool {
        self.minimal_tree_shape
    }

    #[must_use]
    pub const fn public_to_json_available(&self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(&self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateToTreeNativeExecutionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) source_tree_diagnostic_name: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    pub(crate) rendered_root: TestRendererPrivateTreeRenderedRoot,
    pub(crate) source_fiber_count: usize,
    pub(crate) root_child_count: usize,
    pub(crate) consumes_accepted_native_create_execution_record: bool,
    pub(crate) consumes_accepted_native_update_execution_record: bool,
    pub(crate) consumes_accepted_native_unmount_execution_record: bool,
    pub(crate) consumes_private_to_tree_evidence: bool,
    pub(crate) consumes_accepted_host_output_row: bool,
    pub(crate) source_finished_work_identity_diagnostic_name: Option<&'static str>,
    pub(crate) consumes_private_sibling_text_finished_work_identity_gate: bool,
    pub(crate) source_lifecycle_execution_diagnostic_name: Option<&'static str>,
    pub(crate) source_lifecycle_execution_status: Option<&'static str>,
    pub(crate) consumes_private_root_lifecycle_execution: bool,
    pub(crate) source_unmount_nested_source_report_admission_gate_diagnostic_name:
        Option<&'static str>,
    pub(crate) source_unmount_nested_source_report_admission_gate_status: Option<&'static str>,
    pub(crate) consumes_private_unmount_nested_source_report_admission_gate: bool,
    pub(crate) minimal_tree_shape: bool,
    pub(crate) function_component_above_host_output_shape: bool,
    pub(crate) public_to_tree_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateToTreeNativeExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(&self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(&self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(&self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_tree_diagnostic_name(&self) -> &'static str {
        self.source_tree_diagnostic_name
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(&self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn host_output_row(&self) -> Option<TestRendererPrivateToJsonHostOutputRow> {
        self.host_output_row
    }

    #[must_use]
    pub const fn rendered_root(&self) -> &TestRendererPrivateTreeRenderedRoot {
        &self.rendered_root
    }

    #[must_use]
    pub const fn source_fiber_count(&self) -> usize {
        self.source_fiber_count
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn consumes_accepted_native_create_execution_record(&self) -> bool {
        self.consumes_accepted_native_create_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(&self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_unmount_execution_record(&self) -> bool {
        self.consumes_accepted_native_unmount_execution_record
    }

    #[must_use]
    pub const fn consumes_private_to_tree_evidence(&self) -> bool {
        self.consumes_private_to_tree_evidence
    }

    #[must_use]
    pub const fn consumes_accepted_host_output_row(&self) -> bool {
        self.consumes_accepted_host_output_row
    }

    #[must_use]
    pub const fn source_finished_work_identity_diagnostic_name(&self) -> Option<&'static str> {
        self.source_finished_work_identity_diagnostic_name
    }

    #[must_use]
    pub const fn consumes_private_sibling_text_finished_work_identity_gate(&self) -> bool {
        self.consumes_private_sibling_text_finished_work_identity_gate
    }

    #[must_use]
    pub const fn source_lifecycle_execution_diagnostic_name(&self) -> Option<&'static str> {
        self.source_lifecycle_execution_diagnostic_name
    }

    #[must_use]
    pub const fn source_lifecycle_execution_status(&self) -> Option<&'static str> {
        self.source_lifecycle_execution_status
    }

    #[must_use]
    pub const fn consumes_private_root_lifecycle_execution(&self) -> bool {
        self.consumes_private_root_lifecycle_execution
    }

    #[must_use]
    pub const fn source_unmount_nested_source_report_admission_gate_diagnostic_name(
        &self,
    ) -> Option<&'static str> {
        self.source_unmount_nested_source_report_admission_gate_diagnostic_name
    }

    #[must_use]
    pub const fn source_unmount_nested_source_report_admission_gate_status(
        &self,
    ) -> Option<&'static str> {
        self.source_unmount_nested_source_report_admission_gate_status
    }

    #[must_use]
    pub const fn consumes_private_unmount_nested_source_report_admission_gate(&self) -> bool {
        self.consumes_private_unmount_nested_source_report_admission_gate
    }

    #[must_use]
    pub const fn minimal_tree_shape(&self) -> bool {
        self.minimal_tree_shape
    }

    #[must_use]
    pub const fn function_component_above_host_output_shape(&self) -> bool {
        self.function_component_above_host_output_shape
    }

    #[must_use]
    pub const fn public_to_tree_available(&self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(&self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateSerializationFinishedWorkIdentityGate {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) root_scheduled_update_sequence: usize,
    pub(crate) public_surface: &'static str,
    pub(crate) source_serialization_diagnostic_name: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) report_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) report_finished_lanes_bits: u32,
    pub(crate) commit_remaining_lanes_bits: u32,
    pub(crate) commit_pending_lanes_bits: u32,
    pub(crate) commit_current_matches_render_finished_work: bool,
    pub(crate) commit_previous_current_matches_render_current: bool,
    pub(crate) commit_lanes_match_render_lanes: bool,
    pub(crate) report_finished_work_matches_commit_current: bool,
    pub(crate) report_lanes_match_commit_lanes: bool,
    pub(crate) committed_fiber_inspection_current_matches_commit: bool,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) consumes_committed_host_root_finished_work_identity: bool,
    pub(crate) consumes_committed_host_root_finished_work_lanes: bool,
    pub(crate) consumes_private_to_json_evidence: bool,
    pub(crate) consumes_private_to_tree_evidence: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_to_tree_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateSerializationFinishedWorkIdentityGate {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
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
    pub const fn root_scheduled_update_sequence(self) -> usize {
        self.root_scheduled_update_sequence
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_serialization_diagnostic_name(self) -> &'static str {
        self.source_serialization_diagnostic_name
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
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
    pub const fn report_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.report_finished_work
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
    pub const fn report_finished_lanes_bits(self) -> u32 {
        self.report_finished_lanes_bits
    }

    #[must_use]
    pub const fn commit_remaining_lanes_bits(self) -> u32 {
        self.commit_remaining_lanes_bits
    }

    #[must_use]
    pub const fn commit_pending_lanes_bits(self) -> u32 {
        self.commit_pending_lanes_bits
    }

    #[must_use]
    pub const fn commit_current_matches_render_finished_work(self) -> bool {
        self.commit_current_matches_render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current_matches_render_current(self) -> bool {
        self.commit_previous_current_matches_render_current
    }

    #[must_use]
    pub const fn commit_lanes_match_render_lanes(self) -> bool {
        self.commit_lanes_match_render_lanes
    }

    #[must_use]
    pub const fn report_finished_work_matches_commit_current(self) -> bool {
        self.report_finished_work_matches_commit_current
    }

    #[must_use]
    pub const fn report_lanes_match_commit_lanes(self) -> bool {
        self.report_lanes_match_commit_lanes
    }

    #[must_use]
    pub const fn committed_fiber_inspection_current_matches_commit(self) -> bool {
        self.committed_fiber_inspection_current_matches_commit
    }

    #[must_use]
    pub const fn host_output_snapshot_current(self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_identity(self) -> bool {
        self.consumes_committed_host_root_finished_work_identity
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_lanes(self) -> bool {
        self.consumes_committed_host_root_finished_work_lanes
    }

    #[must_use]
    pub const fn consumes_private_to_json_evidence(self) -> bool {
        self.consumes_private_to_json_evidence
    }

    #[must_use]
    pub const fn consumes_private_to_tree_evidence(self) -> bool {
        self.consumes_private_to_tree_evidence
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_to_tree_available(self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateUnmountNestedSourceReportAdmissionGate {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) nested_root: FiberRootId,
    pub(crate) unmount_root: FiberRootId,
    pub(crate) nested_renderer_id: TestRendererId,
    pub(crate) unmount_renderer_id: TestRendererId,
    pub(crate) nested_route_record_id: &'static str,
    pub(crate) nested_route_status: &'static str,
    pub(crate) unmount_admission_record_id: &'static str,
    pub(crate) unmount_admission_status: &'static str,
    pub(crate) nested_identity_diagnostic_name: &'static str,
    pub(crate) nested_identity_public_surface: &'static str,
    pub(crate) nested_identity_source_serialization_diagnostic_name: &'static str,
    pub(crate) unmount_identity_diagnostic_name: &'static str,
    pub(crate) unmount_identity_public_surface: &'static str,
    pub(crate) unmount_identity_source_serialization_diagnostic_name: &'static str,
    pub(crate) nested_source_report_diagnostic_name: &'static str,
    pub(crate) nested_host_output_row_id: &'static str,
    pub(crate) unmount_host_output_row_id: &'static str,
    pub(crate) nested_scheduled_update_sequence: usize,
    pub(crate) unmount_scheduled_update_sequence: usize,
    pub(crate) nested_host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) unmount_host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) nested_source_node_count: usize,
    pub(crate) nested_host_component_count: usize,
    pub(crate) nested_host_text_count: usize,
    pub(crate) unmount_host_node_cleanup_count: usize,
    pub(crate) unmount_cleanup_order_record_count: usize,
    pub(crate) nested_identity_accepted: bool,
    pub(crate) unmount_identity_accepted: bool,
    pub(crate) nested_route_admission_accepted: bool,
    pub(crate) unmount_route_admission_accepted: bool,
    pub(crate) nested_committed_source_report_ownership_accepted: bool,
    pub(crate) unmount_deletion_cleanup_metadata_accepted: bool,
    pub(crate) consumes_worker_736_nested_source_report_identity: bool,
    pub(crate) consumes_worker_733_unmount_identity: bool,
    pub(crate) broad_multichild_identity_available: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_to_tree_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_loading_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) js_facade_available: bool,
    pub(crate) cjs_facade_available: bool,
    pub(crate) package_compatibility_claimed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateUnmountNestedSourceReportAdmissionGate {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn nested_root(self) -> FiberRootId {
        self.nested_root
    }

    #[must_use]
    pub const fn unmount_root(self) -> FiberRootId {
        self.unmount_root
    }

    #[must_use]
    pub const fn nested_route_record_id(self) -> &'static str {
        self.nested_route_record_id
    }

    #[must_use]
    pub const fn nested_route_status(self) -> &'static str {
        self.nested_route_status
    }

    #[must_use]
    pub const fn unmount_admission_record_id(self) -> &'static str {
        self.unmount_admission_record_id
    }

    #[must_use]
    pub const fn unmount_admission_status(self) -> &'static str {
        self.unmount_admission_status
    }

    #[must_use]
    pub const fn nested_identity_diagnostic_name(self) -> &'static str {
        self.nested_identity_diagnostic_name
    }

    #[must_use]
    pub const fn nested_identity_public_surface(self) -> &'static str {
        self.nested_identity_public_surface
    }

    #[must_use]
    pub const fn nested_identity_source_serialization_diagnostic_name(self) -> &'static str {
        self.nested_identity_source_serialization_diagnostic_name
    }

    #[must_use]
    pub const fn unmount_identity_diagnostic_name(self) -> &'static str {
        self.unmount_identity_diagnostic_name
    }

    #[must_use]
    pub const fn unmount_identity_public_surface(self) -> &'static str {
        self.unmount_identity_public_surface
    }

    #[must_use]
    pub const fn unmount_identity_source_serialization_diagnostic_name(self) -> &'static str {
        self.unmount_identity_source_serialization_diagnostic_name
    }

    #[must_use]
    pub const fn nested_source_report_diagnostic_name(self) -> &'static str {
        self.nested_source_report_diagnostic_name
    }

    #[must_use]
    pub const fn nested_host_output_row_id(self) -> &'static str {
        self.nested_host_output_row_id
    }

    #[must_use]
    pub const fn unmount_host_output_row_id(self) -> &'static str {
        self.unmount_host_output_row_id
    }

    #[must_use]
    pub const fn nested_scheduled_update_sequence(self) -> usize {
        self.nested_scheduled_update_sequence
    }

    #[must_use]
    pub const fn unmount_scheduled_update_sequence(self) -> usize {
        self.unmount_scheduled_update_sequence
    }

    #[must_use]
    pub const fn nested_host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.nested_host_output_shape
    }

    #[must_use]
    pub const fn unmount_host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.unmount_host_output_shape
    }

    #[must_use]
    pub const fn nested_source_node_count(self) -> usize {
        self.nested_source_node_count
    }

    #[must_use]
    pub const fn nested_host_component_count(self) -> usize {
        self.nested_host_component_count
    }

    #[must_use]
    pub const fn nested_host_text_count(self) -> usize {
        self.nested_host_text_count
    }

    #[must_use]
    pub const fn unmount_host_node_cleanup_count(self) -> usize {
        self.unmount_host_node_cleanup_count
    }

    #[must_use]
    pub const fn unmount_cleanup_order_record_count(self) -> usize {
        self.unmount_cleanup_order_record_count
    }

    #[must_use]
    pub const fn nested_identity_accepted(self) -> bool {
        self.nested_identity_accepted
    }

    #[must_use]
    pub const fn unmount_identity_accepted(self) -> bool {
        self.unmount_identity_accepted
    }

    #[must_use]
    pub const fn nested_route_admission_accepted(self) -> bool {
        self.nested_route_admission_accepted
    }

    #[must_use]
    pub const fn unmount_route_admission_accepted(self) -> bool {
        self.unmount_route_admission_accepted
    }

    #[must_use]
    pub const fn nested_committed_source_report_ownership_accepted(self) -> bool {
        self.nested_committed_source_report_ownership_accepted
    }

    #[must_use]
    pub const fn unmount_deletion_cleanup_metadata_accepted(self) -> bool {
        self.unmount_deletion_cleanup_metadata_accepted
    }

    #[must_use]
    pub const fn consumes_worker_736_nested_source_report_identity(self) -> bool {
        self.consumes_worker_736_nested_source_report_identity
    }

    #[must_use]
    pub const fn consumes_worker_733_unmount_identity(self) -> bool {
        self.consumes_worker_733_unmount_identity
    }

    #[must_use]
    pub const fn broad_multichild_identity_available(self) -> bool {
        self.broad_multichild_identity_available
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_to_tree_available(self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_loading_available(self) -> bool {
        self.native_bridge_loading_available
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn js_facade_available(self) -> bool {
        self.js_facade_available
    }

    #[must_use]
    pub const fn cjs_facade_available(self) -> bool {
        self.cjs_facade_available
    }

    #[must_use]
    pub const fn package_compatibility_claimed(self) -> bool {
        self.package_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub fn public_native_package_js_surfaces_blocked(self) -> bool {
        !self.public_to_json_available()
            && !self.public_to_tree_available()
            && !self.public_test_instance_available()
            && !self.public_serialization_available()
            && !self.public_route_available()
            && !self.native_bridge_loading_available()
            && !self.native_bridge_available()
            && !self.native_execution_available()
            && !self.js_facade_available()
            && !self.cjs_facade_available()
            && !self.package_compatibility_claimed()
            && !self.compatibility_claimed()
    }

    #[must_use]
    pub fn private_admission_ready(self) -> bool {
        self.nested_identity_accepted()
            && self.unmount_identity_accepted()
            && self.nested_route_admission_accepted()
            && self.unmount_route_admission_accepted()
            && self.nested_committed_source_report_ownership_accepted()
            && self.unmount_deletion_cleanup_metadata_accepted()
            && self.consumes_worker_736_nested_source_report_identity()
            && self.consumes_worker_733_unmount_identity()
            && !self.broad_multichild_identity_available()
            && self.public_native_package_js_surfaces_blocked()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonSiblingSnapshotFinishedWorkIdentityBlocker {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) host_output_row: TestRendererPrivateToJsonHostOutputRow,
    pub(crate) snapshot_based_host_output_row: bool,
    pub(crate) candidate_finished_work_identity_supplied: bool,
    pub(crate) candidate_identity_diagnostic_name: Option<&'static str>,
    pub(crate) candidate_identity_status: Option<&'static str>,
    pub(crate) candidate_identity_root_matches: bool,
    pub(crate) candidate_identity_update_sequence_matches_root: bool,
    pub(crate) candidate_identity_update_to_json_surface: bool,
    pub(crate) candidate_identity_source_report_matches_to_json: bool,
    pub(crate) candidate_identity_update_kind_matches: bool,
    pub(crate) candidate_identity_committed_host_root_current: bool,
    pub(crate) candidate_identity_lanes_match: bool,
    pub(crate) candidate_identity_matches_update_route_handoff: bool,
    pub(crate) candidate_identity_public_blockers_closed: bool,
    pub(crate) plausible_finished_work_identity_rejected: bool,
    pub(crate) committed_sibling_text_fiber_inspection_available: bool,
    pub(crate) committed_sibling_text_report_shape_available: bool,
    pub(crate) real_sibling_text_handoff_available: bool,
    pub(crate) consumes_committed_host_root_finished_work_identity: bool,
    pub(crate) consumes_committed_host_root_finished_work_lanes: bool,
    pub(crate) identity_admission_available: bool,
    pub(crate) rejection_reason: &'static str,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) package_compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonSiblingSnapshotFinishedWorkIdentityBlocker {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
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
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn host_output_row(self) -> TestRendererPrivateToJsonHostOutputRow {
        self.host_output_row
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_row.host_output_update_kind()
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_row.host_output_shape()
    }

    #[must_use]
    pub const fn snapshot_based_host_output_row(self) -> bool {
        self.snapshot_based_host_output_row
    }

    #[must_use]
    pub const fn candidate_finished_work_identity_supplied(self) -> bool {
        self.candidate_finished_work_identity_supplied
    }

    #[must_use]
    pub const fn candidate_identity_diagnostic_name(self) -> Option<&'static str> {
        self.candidate_identity_diagnostic_name
    }

    #[must_use]
    pub const fn candidate_identity_status(self) -> Option<&'static str> {
        self.candidate_identity_status
    }

    #[must_use]
    pub const fn candidate_identity_root_matches(self) -> bool {
        self.candidate_identity_root_matches
    }

    #[must_use]
    pub const fn candidate_identity_update_sequence_matches_root(self) -> bool {
        self.candidate_identity_update_sequence_matches_root
    }

    #[must_use]
    pub const fn candidate_identity_update_to_json_surface(self) -> bool {
        self.candidate_identity_update_to_json_surface
    }

    #[must_use]
    pub const fn candidate_identity_source_report_matches_to_json(self) -> bool {
        self.candidate_identity_source_report_matches_to_json
    }

    #[must_use]
    pub const fn candidate_identity_update_kind_matches(self) -> bool {
        self.candidate_identity_update_kind_matches
    }

    #[must_use]
    pub const fn candidate_identity_committed_host_root_current(self) -> bool {
        self.candidate_identity_committed_host_root_current
    }

    #[must_use]
    pub const fn candidate_identity_lanes_match(self) -> bool {
        self.candidate_identity_lanes_match
    }

    #[must_use]
    pub const fn candidate_identity_matches_update_route_handoff(self) -> bool {
        self.candidate_identity_matches_update_route_handoff
    }

    #[must_use]
    pub const fn candidate_identity_public_blockers_closed(self) -> bool {
        self.candidate_identity_public_blockers_closed
    }

    #[must_use]
    pub fn candidate_identity_plausible_for_update_to_json(self) -> bool {
        self.candidate_finished_work_identity_supplied()
            && self.candidate_identity_diagnostic_name()
                == Some(TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME)
            && self.candidate_identity_status()
                == Some(TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_STATUS)
            && self.candidate_identity_root_matches()
            && self.candidate_identity_update_sequence_matches_root()
            && self.candidate_identity_update_to_json_surface()
            && self.candidate_identity_source_report_matches_to_json()
            && self.candidate_identity_update_kind_matches()
            && self.candidate_identity_committed_host_root_current()
            && self.candidate_identity_lanes_match()
            && self.candidate_identity_matches_update_route_handoff()
            && self.candidate_identity_public_blockers_closed()
    }

    #[must_use]
    pub const fn plausible_finished_work_identity_rejected(self) -> bool {
        self.plausible_finished_work_identity_rejected
    }

    #[must_use]
    pub const fn committed_sibling_text_fiber_inspection_available(self) -> bool {
        self.committed_sibling_text_fiber_inspection_available
    }

    #[must_use]
    pub const fn committed_sibling_text_report_shape_available(self) -> bool {
        self.committed_sibling_text_report_shape_available
    }

    #[must_use]
    pub const fn real_sibling_text_handoff_available(self) -> bool {
        self.real_sibling_text_handoff_available
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_identity(self) -> bool {
        self.consumes_committed_host_root_finished_work_identity
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_lanes(self) -> bool {
        self.consumes_committed_host_root_finished_work_lanes
    }

    #[must_use]
    pub const fn identity_admission_available(self) -> bool {
        self.identity_admission_available
    }

    #[must_use]
    pub const fn rejection_reason(self) -> &'static str {
        self.rejection_reason
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn package_compatibility_claimed(self) -> bool {
        self.package_compatibility_claimed
    }

    #[must_use]
    pub fn identity_admission_blocked(self) -> bool {
        self.snapshot_based_host_output_row()
            && self.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && self.host_output_shape() == TestRendererPrivateToJsonHostOutputShape::SiblingText
            && !self.committed_sibling_text_fiber_inspection_available()
            && !self.committed_sibling_text_report_shape_available()
            && !self.real_sibling_text_handoff_available()
            && !self.consumes_committed_host_root_finished_work_identity()
            && !self.consumes_committed_host_root_finished_work_lanes()
            && !self.identity_admission_available()
            && self.rejection_reason()
                == TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_REASON
            && !self.public_to_json_available()
            && !self.public_serialization_available()
            && !self.public_route_available()
            && !self.native_bridge_available()
            && !self.native_execution_available()
            && !self.package_compatibility_claimed()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) root_scheduled_update_sequence: usize,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) source_serialization_diagnostic_name: &'static str,
    pub(crate) worker_738_report_row_id: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) root_node_kind: TestRendererPrivateJsonNodeKind,
    pub(crate) root_child_count: usize,
    pub(crate) source_node_count: usize,
    pub(crate) route_render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) route_render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) route_commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) route_commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) report_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) route_render_lanes_bits: u32,
    pub(crate) route_commit_finished_lanes_bits: u32,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) report_finished_lanes_bits: u32,
    pub(crate) commit_remaining_lanes_bits: u32,
    pub(crate) commit_pending_lanes_bits: u32,
    pub(crate) route_handles_match_committed_update: bool,
    pub(crate) route_lanes_match_committed_update: bool,
    pub(crate) commit_current_matches_render_finished_work: bool,
    pub(crate) commit_previous_current_matches_render_current: bool,
    pub(crate) commit_lanes_match_render_lanes: bool,
    pub(crate) report_finished_work_matches_commit_current: bool,
    pub(crate) report_lanes_match_commit_lanes: bool,
    pub(crate) committed_fiber_inspection_current_matches_commit: bool,
    pub(crate) committed_sibling_text_fiber_inspection_available: bool,
    pub(crate) committed_sibling_text_report_shape_available: bool,
    pub(crate) committed_sibling_text_inspection_matches_output: bool,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) report_host_output_row_matches_output: bool,
    pub(crate) report_root_array_source_nodes_match_current_snapshot: bool,
    pub(crate) real_sibling_text_handoff_available: bool,
    pub(crate) consumes_update_route_admission: bool,
    pub(crate) consumes_sibling_text_host_output: bool,
    pub(crate) consumes_private_to_json_evidence: bool,
    pub(crate) consumes_worker_738_report_row: bool,
    pub(crate) consumes_committed_host_root_finished_work_identity: bool,
    pub(crate) consumes_committed_host_root_finished_work_lanes: bool,
    pub(crate) identity_admission_available: bool,
    pub(crate) broad_multichild_identity_available: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_to_tree_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_loading_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) js_facade_available: bool,
    pub(crate) cjs_facade_available: bool,
    pub(crate) package_compatibility_claimed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
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
    pub const fn root_scheduled_update_sequence(self) -> usize {
        self.root_scheduled_update_sequence
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_serialization_diagnostic_name(self) -> &'static str {
        self.source_serialization_diagnostic_name
    }

    #[must_use]
    pub const fn worker_738_report_row_id(self) -> &'static str {
        self.worker_738_report_row_id
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn root_node_kind(self) -> TestRendererPrivateJsonNodeKind {
        self.root_node_kind
    }

    #[must_use]
    pub const fn root_child_count(self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn source_node_count(self) -> usize {
        self.source_node_count
    }

    #[must_use]
    pub const fn route_render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.route_render_current
    }

    #[must_use]
    pub const fn route_render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.route_render_finished_work
    }

    #[must_use]
    pub const fn route_commit_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.route_commit_previous_current
    }

    #[must_use]
    pub const fn route_commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.route_commit_current
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
    pub const fn report_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.report_finished_work
    }

    #[must_use]
    pub const fn route_render_lanes_bits(self) -> u32 {
        self.route_render_lanes_bits
    }

    #[must_use]
    pub const fn route_commit_finished_lanes_bits(self) -> u32 {
        self.route_commit_finished_lanes_bits
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
    pub const fn report_finished_lanes_bits(self) -> u32 {
        self.report_finished_lanes_bits
    }

    #[must_use]
    pub const fn commit_remaining_lanes_bits(self) -> u32 {
        self.commit_remaining_lanes_bits
    }

    #[must_use]
    pub const fn commit_pending_lanes_bits(self) -> u32 {
        self.commit_pending_lanes_bits
    }

    #[must_use]
    pub const fn route_handles_match_committed_update(self) -> bool {
        self.route_handles_match_committed_update
    }

    #[must_use]
    pub const fn route_lanes_match_committed_update(self) -> bool {
        self.route_lanes_match_committed_update
    }

    #[must_use]
    pub const fn commit_current_matches_render_finished_work(self) -> bool {
        self.commit_current_matches_render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current_matches_render_current(self) -> bool {
        self.commit_previous_current_matches_render_current
    }

    #[must_use]
    pub const fn commit_lanes_match_render_lanes(self) -> bool {
        self.commit_lanes_match_render_lanes
    }

    #[must_use]
    pub const fn report_finished_work_matches_commit_current(self) -> bool {
        self.report_finished_work_matches_commit_current
    }

    #[must_use]
    pub const fn report_lanes_match_commit_lanes(self) -> bool {
        self.report_lanes_match_commit_lanes
    }

    #[must_use]
    pub const fn committed_fiber_inspection_current_matches_commit(self) -> bool {
        self.committed_fiber_inspection_current_matches_commit
    }

    #[must_use]
    pub const fn committed_sibling_text_fiber_inspection_available(self) -> bool {
        self.committed_sibling_text_fiber_inspection_available
    }

    #[must_use]
    pub const fn committed_sibling_text_report_shape_available(self) -> bool {
        self.committed_sibling_text_report_shape_available
    }

    #[must_use]
    pub const fn committed_sibling_text_inspection_matches_output(self) -> bool {
        self.committed_sibling_text_inspection_matches_output
    }

    #[must_use]
    pub const fn host_output_snapshot_current(self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn report_host_output_row_matches_output(self) -> bool {
        self.report_host_output_row_matches_output
    }

    #[must_use]
    pub const fn report_root_array_source_nodes_match_current_snapshot(self) -> bool {
        self.report_root_array_source_nodes_match_current_snapshot
    }

    #[must_use]
    pub const fn real_sibling_text_handoff_available(self) -> bool {
        self.real_sibling_text_handoff_available
    }

    #[must_use]
    pub const fn consumes_update_route_admission(self) -> bool {
        self.consumes_update_route_admission
    }

    #[must_use]
    pub const fn consumes_sibling_text_host_output(self) -> bool {
        self.consumes_sibling_text_host_output
    }

    #[must_use]
    pub const fn consumes_private_to_json_evidence(self) -> bool {
        self.consumes_private_to_json_evidence
    }

    #[must_use]
    pub const fn consumes_worker_738_report_row(self) -> bool {
        self.consumes_worker_738_report_row
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_identity(self) -> bool {
        self.consumes_committed_host_root_finished_work_identity
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_lanes(self) -> bool {
        self.consumes_committed_host_root_finished_work_lanes
    }

    #[must_use]
    pub const fn identity_admission_available(self) -> bool {
        self.identity_admission_available
    }

    #[must_use]
    pub const fn broad_multichild_identity_available(self) -> bool {
        self.broad_multichild_identity_available
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_to_tree_available(self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_loading_available(self) -> bool {
        self.native_bridge_loading_available
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn js_facade_available(self) -> bool {
        self.js_facade_available
    }

    #[must_use]
    pub const fn cjs_facade_available(self) -> bool {
        self.cjs_facade_available
    }

    #[must_use]
    pub const fn package_compatibility_claimed(self) -> bool {
        self.package_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub fn public_native_package_js_surfaces_blocked(self) -> bool {
        !self.public_to_json_available()
            && !self.public_to_tree_available()
            && !self.public_test_instance_available()
            && !self.public_serialization_available()
            && !self.public_route_available()
            && !self.native_bridge_loading_available()
            && !self.native_bridge_available()
            && !self.native_execution_available()
            && !self.js_facade_available()
            && !self.cjs_facade_available()
            && !self.package_compatibility_claimed()
            && !self.compatibility_claimed()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) root_scheduled_update_sequence: usize,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) source_lifecycle_diagnostic_name: &'static str,
    pub(crate) source_lifecycle_status: &'static str,
    pub(crate) worker_895_report_row_id: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) root_node_kind: TestRendererPrivateJsonNodeKind,
    pub(crate) child_fiber_tag_order: [&'static str; 3],
    pub(crate) root_child_count: usize,
    pub(crate) source_node_count: usize,
    pub(crate) route_render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) route_render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) route_commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) route_commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) route_render_lanes_bits: u32,
    pub(crate) route_commit_finished_lanes_bits: u32,
    pub(crate) lifecycle_scheduled_update_sequence: usize,
    pub(crate) lifecycle_host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) lifecycle_root_child_count: usize,
    pub(crate) lifecycle_host_component_count: usize,
    pub(crate) lifecycle_host_text_count: usize,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) report_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) report_finished_lanes_bits: u32,
    pub(crate) commit_remaining_lanes_bits: u32,
    pub(crate) commit_pending_lanes_bits: u32,
    pub(crate) route_handles_match_committed_update: bool,
    pub(crate) route_lanes_match_committed_update: bool,
    pub(crate) lifecycle_matches_committed_update: bool,
    pub(crate) commit_current_matches_render_finished_work: bool,
    pub(crate) commit_previous_current_matches_render_current: bool,
    pub(crate) report_finished_work_matches_commit_current: bool,
    pub(crate) report_lanes_match_commit_lanes: bool,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) report_host_output_row_matches_output: bool,
    pub(crate) child_order_matches_current_snapshot: bool,
    pub(crate) host_parent_placement_apply_count: usize,
    pub(crate) real_multi_child_handoff_available: bool,
    pub(crate) consumes_update_route_admission: bool,
    pub(crate) consumes_root_lifecycle_execution: bool,
    pub(crate) consumes_multi_child_host_output: bool,
    pub(crate) consumes_committed_host_root_finished_work_identity: bool,
    pub(crate) consumes_committed_host_root_finished_work_lanes: bool,
    pub(crate) identity_admission_available: bool,
    pub(crate) broad_multichild_identity_available: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_to_tree_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_loading_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) js_facade_available: bool,
    pub(crate) cjs_facade_available: bool,
    pub(crate) package_compatibility_claimed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
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
    pub const fn root_scheduled_update_sequence(self) -> usize {
        self.root_scheduled_update_sequence
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_lifecycle_diagnostic_name(self) -> &'static str {
        self.source_lifecycle_diagnostic_name
    }

    #[must_use]
    pub const fn source_lifecycle_status(self) -> &'static str {
        self.source_lifecycle_status
    }

    #[must_use]
    pub const fn worker_895_report_row_id(self) -> &'static str {
        self.worker_895_report_row_id
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn root_node_kind(self) -> TestRendererPrivateJsonNodeKind {
        self.root_node_kind
    }

    #[must_use]
    pub const fn child_fiber_tag_order(self) -> [&'static str; 3] {
        self.child_fiber_tag_order
    }

    #[must_use]
    pub const fn root_child_count(self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn source_node_count(self) -> usize {
        self.source_node_count
    }

    #[must_use]
    pub const fn route_render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.route_render_current
    }

    #[must_use]
    pub const fn route_render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.route_render_finished_work
    }

    #[must_use]
    pub const fn route_commit_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.route_commit_previous_current
    }

    #[must_use]
    pub const fn route_commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.route_commit_current
    }

    #[must_use]
    pub const fn route_render_lanes_bits(self) -> u32 {
        self.route_render_lanes_bits
    }

    #[must_use]
    pub const fn route_commit_finished_lanes_bits(self) -> u32 {
        self.route_commit_finished_lanes_bits
    }

    #[must_use]
    pub const fn lifecycle_scheduled_update_sequence(self) -> usize {
        self.lifecycle_scheduled_update_sequence
    }

    #[must_use]
    pub const fn lifecycle_host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.lifecycle_host_output_shape
    }

    #[must_use]
    pub const fn lifecycle_root_child_count(self) -> usize {
        self.lifecycle_root_child_count
    }

    #[must_use]
    pub const fn lifecycle_host_component_count(self) -> usize {
        self.lifecycle_host_component_count
    }

    #[must_use]
    pub const fn lifecycle_host_text_count(self) -> usize {
        self.lifecycle_host_text_count
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
    pub const fn report_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.report_finished_work
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
    pub const fn report_finished_lanes_bits(self) -> u32 {
        self.report_finished_lanes_bits
    }

    #[must_use]
    pub const fn commit_remaining_lanes_bits(self) -> u32 {
        self.commit_remaining_lanes_bits
    }

    #[must_use]
    pub const fn commit_pending_lanes_bits(self) -> u32 {
        self.commit_pending_lanes_bits
    }

    #[must_use]
    pub const fn route_handles_match_committed_update(self) -> bool {
        self.route_handles_match_committed_update
    }

    #[must_use]
    pub const fn route_lanes_match_committed_update(self) -> bool {
        self.route_lanes_match_committed_update
    }

    #[must_use]
    pub const fn lifecycle_matches_committed_update(self) -> bool {
        self.lifecycle_matches_committed_update
    }

    #[must_use]
    pub const fn commit_current_matches_render_finished_work(self) -> bool {
        self.commit_current_matches_render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current_matches_render_current(self) -> bool {
        self.commit_previous_current_matches_render_current
    }

    #[must_use]
    pub const fn report_finished_work_matches_commit_current(self) -> bool {
        self.report_finished_work_matches_commit_current
    }

    #[must_use]
    pub const fn report_lanes_match_commit_lanes(self) -> bool {
        self.report_lanes_match_commit_lanes
    }

    #[must_use]
    pub const fn host_output_snapshot_current(self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn report_host_output_row_matches_output(self) -> bool {
        self.report_host_output_row_matches_output
    }

    #[must_use]
    pub const fn child_order_matches_current_snapshot(self) -> bool {
        self.child_order_matches_current_snapshot
    }

    #[must_use]
    pub const fn host_parent_placement_apply_count(self) -> usize {
        self.host_parent_placement_apply_count
    }

    #[must_use]
    pub const fn real_multi_child_handoff_available(self) -> bool {
        self.real_multi_child_handoff_available
    }

    #[must_use]
    pub const fn consumes_update_route_admission(self) -> bool {
        self.consumes_update_route_admission
    }

    #[must_use]
    pub const fn consumes_root_lifecycle_execution(self) -> bool {
        self.consumes_root_lifecycle_execution
    }

    #[must_use]
    pub const fn consumes_multi_child_host_output(self) -> bool {
        self.consumes_multi_child_host_output
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_identity(self) -> bool {
        self.consumes_committed_host_root_finished_work_identity
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_lanes(self) -> bool {
        self.consumes_committed_host_root_finished_work_lanes
    }

    #[must_use]
    pub const fn identity_admission_available(self) -> bool {
        self.identity_admission_available
    }

    #[must_use]
    pub const fn broad_multichild_identity_available(self) -> bool {
        self.broad_multichild_identity_available
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_to_tree_available(self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_loading_available(self) -> bool {
        self.native_bridge_loading_available
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn js_facade_available(self) -> bool {
        self.js_facade_available
    }

    #[must_use]
    pub const fn cjs_facade_available(self) -> bool {
        self.cjs_facade_available
    }

    #[must_use]
    pub const fn package_compatibility_claimed(self) -> bool {
        self.package_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub fn public_native_package_js_surfaces_blocked(self) -> bool {
        !self.public_to_json_available()
            && !self.public_to_tree_available()
            && !self.public_test_instance_available()
            && !self.public_serialization_available()
            && !self.public_route_available()
            && !self.native_bridge_loading_available()
            && !self.native_bridge_available()
            && !self.native_execution_available()
            && !self.js_facade_available()
            && !self.cjs_facade_available()
            && !self.package_compatibility_claimed()
            && !self.compatibility_claimed()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateDirectMultiChildHostTextRowIdentity {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) root_scheduled_update_sequence: usize,
    pub(crate) public_surface: &'static str,
    pub(crate) host_output_row: TestRendererPrivateToJsonHostOutputRow,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) store_current: TestRendererFiberHandleDiagnostics,
    pub(crate) host_component_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) stable_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) placed_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) commit_remaining_lanes_bits: u32,
    pub(crate) commit_pending_lanes_bits: u32,
    pub(crate) row_matches_shape: bool,
    pub(crate) row_owner_matches_root: bool,
    pub(crate) row_handles_match_output: bool,
    pub(crate) row_lanes_match_commit: bool,
    pub(crate) public_native_package_js_surfaces_blocked: bool,
}

impl TestRendererPrivateDirectMultiChildHostTextRowIdentity {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[cfg(test)]
    pub(crate) const fn renderer_id(self) -> TestRendererId {
        self.renderer_id
    }

    #[must_use]
    pub const fn root_scheduled_update_sequence(self) -> usize {
        self.root_scheduled_update_sequence
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn host_output_row(self) -> TestRendererPrivateToJsonHostOutputRow {
        self.host_output_row
    }

    #[must_use]
    pub const fn source_row_id(self) -> &'static str {
        self.host_output_row.id()
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_row.host_output_update_kind()
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_row.host_output_shape()
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
    pub const fn store_current(self) -> TestRendererFiberHandleDiagnostics {
        self.store_current
    }

    #[must_use]
    pub const fn host_component_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.host_component_fiber
    }

    #[must_use]
    pub const fn stable_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.stable_text_fiber
    }

    #[must_use]
    pub const fn placed_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.placed_text_fiber
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
    pub const fn commit_remaining_lanes_bits(self) -> u32 {
        self.commit_remaining_lanes_bits
    }

    #[must_use]
    pub const fn commit_pending_lanes_bits(self) -> u32 {
        self.commit_pending_lanes_bits
    }

    #[must_use]
    pub const fn row_matches_shape(self) -> bool {
        self.row_matches_shape
    }

    #[must_use]
    pub const fn row_owner_matches_root(self) -> bool {
        self.row_owner_matches_root
    }

    #[must_use]
    pub const fn row_handles_match_output(self) -> bool {
        self.row_handles_match_output
    }

    #[must_use]
    pub const fn row_lanes_match_commit(self) -> bool {
        self.row_lanes_match_commit
    }

    #[must_use]
    pub const fn public_native_package_js_surfaces_blocked(self) -> bool {
        self.public_native_package_js_surfaces_blocked
    }

    #[must_use]
    pub fn source_owned_current_row_identity_accepted(self) -> bool {
        self.diagnostic_name()
            == TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_DIAGNOSTIC_NAME
            && self.status()
                == TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_STATUS
            && self.public_surface() == "create().update -> create().toJSON"
            && self.source_row_id()
                == TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID
            && self.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && self.host_output_shape()
                == TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            && self.row_matches_shape()
            && self.row_owner_matches_root()
            && self.row_handles_match_output()
            && self.row_lanes_match_commit()
            && self.public_native_package_js_surfaces_blocked()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateDirectMultiChildHostTextReconcilerInspectionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) root_scheduled_update_sequence: usize,
    pub(crate) public_surface: &'static str,
    pub(crate) source_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) source_committed_current: TestRendererFiberHandleDiagnostics,
    pub(crate) source_component_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) source_stable_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) source_placed_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) source_current_topology_recorded: bool,
    pub(crate) source_host_node_state_nodes_present: bool,
    pub(crate) inspection_shape_name: &'static str,
    pub(crate) inspection_current_shape: [&'static str; 4],
    pub(crate) inspection_store_current: TestRendererFiberHandleDiagnostics,
    pub(crate) inspection_root_child_count: usize,
    pub(crate) inspection_host_component_child_count: usize,
    pub(crate) inspection_host_text_count: usize,
    pub(crate) inspection_host_component_state_node_raw: u64,
    pub(crate) inspection_stable_text_state_node_raw: u64,
    pub(crate) inspection_placed_text_state_node_raw: u64,
    pub(crate) inspection_finished_work_after_commit_cleared: bool,
    pub(crate) inspection_finished_lanes_after_commit_bits: u32,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) source_public_serialization_blocked: bool,
    pub(crate) source_test_renderer_public_compatibility_blocked: bool,
    pub(crate) source_native_execution_blocked: bool,
    pub(crate) source_package_compatibility_blocked: bool,
    pub(crate) inspection_public_serialization_blocked: bool,
    pub(crate) inspection_test_renderer_public_compatibility_blocked: bool,
    pub(crate) inspection_native_execution_blocked: bool,
    pub(crate) inspection_package_compatibility_blocked: bool,
    pub(crate) public_native_package_js_surfaces_blocked: bool,
}

impl TestRendererPrivateDirectMultiChildHostTextReconcilerInspectionEvidence {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[cfg(test)]
    pub(crate) const fn renderer_id(self) -> TestRendererId {
        self.renderer_id
    }

    #[must_use]
    pub const fn root_scheduled_update_sequence(self) -> usize {
        self.root_scheduled_update_sequence
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.source_previous_current
    }

    #[must_use]
    pub const fn source_committed_current(self) -> TestRendererFiberHandleDiagnostics {
        self.source_committed_current
    }

    #[must_use]
    pub const fn source_component_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.source_component_fiber
    }

    #[must_use]
    pub const fn source_stable_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.source_stable_text_fiber
    }

    #[must_use]
    pub const fn source_placed_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.source_placed_text_fiber
    }

    #[must_use]
    pub const fn source_current_topology_recorded(self) -> bool {
        self.source_current_topology_recorded
    }

    #[must_use]
    pub const fn source_host_node_state_nodes_present(self) -> bool {
        self.source_host_node_state_nodes_present
    }

    #[must_use]
    pub const fn inspection_shape_name(self) -> &'static str {
        self.inspection_shape_name
    }

    #[must_use]
    pub const fn inspection_current_shape(self) -> [&'static str; 4] {
        self.inspection_current_shape
    }

    #[must_use]
    pub const fn inspection_store_current(self) -> TestRendererFiberHandleDiagnostics {
        self.inspection_store_current
    }

    #[must_use]
    pub const fn inspection_root_child_count(self) -> usize {
        self.inspection_root_child_count
    }

    #[must_use]
    pub const fn inspection_host_component_child_count(self) -> usize {
        self.inspection_host_component_child_count
    }

    #[must_use]
    pub const fn inspection_host_text_count(self) -> usize {
        self.inspection_host_text_count
    }

    #[must_use]
    pub const fn inspection_host_component_state_node_raw(self) -> u64 {
        self.inspection_host_component_state_node_raw
    }

    #[must_use]
    pub const fn inspection_stable_text_state_node_raw(self) -> u64 {
        self.inspection_stable_text_state_node_raw
    }

    #[must_use]
    pub const fn inspection_placed_text_state_node_raw(self) -> u64 {
        self.inspection_placed_text_state_node_raw
    }

    #[must_use]
    pub const fn inspection_finished_work_after_commit_cleared(self) -> bool {
        self.inspection_finished_work_after_commit_cleared
    }

    #[must_use]
    pub const fn inspection_finished_lanes_after_commit_bits(self) -> u32 {
        self.inspection_finished_lanes_after_commit_bits
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
    pub fn public_native_package_js_surfaces_blocked(self) -> bool {
        self.source_public_serialization_blocked
            && self.source_test_renderer_public_compatibility_blocked
            && self.source_native_execution_blocked
            && self.source_package_compatibility_blocked
            && self.inspection_public_serialization_blocked
            && self.inspection_test_renderer_public_compatibility_blocked
            && self.inspection_native_execution_blocked
            && self.inspection_package_compatibility_blocked
            && self.public_native_package_js_surfaces_blocked
    }

    #[must_use]
    pub fn source_bound_reconciler_direct_inspection_accepted(self) -> bool {
        self.diagnostic_name()
            == TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_RECONCILER_INSPECTION_DIAGNOSTIC_NAME
            && self.status()
                == TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_RECONCILER_INSPECTION_STATUS
            && self.public_surface() == "create().update -> create().toJSON"
            && self.source_previous_current() != self.source_committed_current()
            && self.source_committed_current() == self.inspection_store_current()
            && self.source_current_topology_recorded()
            && self.source_host_node_state_nodes_present()
            && self.inspection_shape_name() == "HostRoot->HostComponent->[HostText,HostText]"
            && self.inspection_current_shape()
                == TEST_RENDERER_PRIVATE_TREE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE
            && self.inspection_root_child_count() == 1
            && self.inspection_host_component_child_count() == 2
            && self.inspection_host_text_count() == 2
            && self.inspection_host_component_state_node_raw() != 0
            && self.inspection_stable_text_state_node_raw() != 0
            && self.inspection_placed_text_state_node_raw() != 0
            && self.inspection_finished_work_after_commit_cleared()
            && self.inspection_finished_lanes_after_commit_bits() == 0
            && self.render_lanes_bits() != 0
            && self.render_lanes_bits() == self.commit_finished_lanes_bits()
            && self.source_component_fiber() != self.source_stable_text_fiber()
            && self.source_component_fiber() != self.source_placed_text_fiber()
            && self.source_stable_text_fiber() != self.source_placed_text_fiber()
            && self.public_native_package_js_surfaces_blocked()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateDirectMultiChildHostTextCommittedFiberInspection {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) root_scheduled_update_sequence: usize,
    pub(crate) public_surface: &'static str,
    pub(crate) source_route_record_id: &'static str,
    pub(crate) source_route_status: &'static str,
    pub(crate) source_lifecycle_diagnostic_name: &'static str,
    pub(crate) source_lifecycle_status: &'static str,
    pub(crate) source_identity_diagnostic_name: &'static str,
    pub(crate) source_identity_status: &'static str,
    pub(crate) source_row_id: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) current_fiber_shape: [&'static str; 4],
    pub(crate) root_child_count: usize,
    pub(crate) host_component_child_count: usize,
    pub(crate) host_text_count: usize,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) store_current: TestRendererFiberHandleDiagnostics,
    pub(crate) host_component_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) stable_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) placed_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) stable_text_sibling: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) placed_text_sibling: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) host_component_element_type_raw: u64,
    pub(crate) host_component_props_raw: u64,
    pub(crate) stable_text_props_raw: u64,
    pub(crate) placed_text_props_raw: u64,
    pub(crate) host_component_state_node_raw: u64,
    pub(crate) placed_text_state_node_raw: u64,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) commit_remaining_lanes_bits: u32,
    pub(crate) commit_pending_lanes_bits: u32,
    pub(crate) route_evidence_accepted: bool,
    pub(crate) lifecycle_evidence_accepted: bool,
    pub(crate) identity_evidence_accepted: bool,
    pub(crate) row_identity_accepted: bool,
    pub(crate) source_reconciler_inspection_diagnostic_name: &'static str,
    pub(crate) source_reconciler_inspection_status: &'static str,
    pub(crate) reconciler_direct_source_recorded: bool,
    pub(crate) reconciler_direct_inspection_accepted: bool,
    pub(crate) reconciler_direct_current_topology_matches_output: bool,
    pub(crate) reconciler_direct_public_native_package_blocked: bool,
    pub(crate) current_root_matches_commit: bool,
    pub(crate) finished_work_matches_current_root: bool,
    pub(crate) lanes_match: bool,
    pub(crate) current_child_topology_matches_output: bool,
    pub(crate) placement_handoff_accepted: bool,
    pub(crate) generic_reconciler_direct_inspection_available: bool,
    pub(crate) broad_multichild_fiber_inspection_available: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_to_tree_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_loading_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) js_facade_available: bool,
    pub(crate) cjs_facade_available: bool,
    pub(crate) package_compatibility_claimed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateDirectMultiChildHostTextCommittedFiberInspection {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[cfg(test)]
    pub(crate) const fn renderer_id(self) -> TestRendererId {
        self.renderer_id
    }

    #[must_use]
    pub const fn root_scheduled_update_sequence(self) -> usize {
        self.root_scheduled_update_sequence
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_route_record_id(self) -> &'static str {
        self.source_route_record_id
    }

    #[must_use]
    pub const fn source_route_status(self) -> &'static str {
        self.source_route_status
    }

    #[must_use]
    pub const fn source_lifecycle_diagnostic_name(self) -> &'static str {
        self.source_lifecycle_diagnostic_name
    }

    #[must_use]
    pub const fn source_lifecycle_status(self) -> &'static str {
        self.source_lifecycle_status
    }

    #[must_use]
    pub const fn source_identity_diagnostic_name(self) -> &'static str {
        self.source_identity_diagnostic_name
    }

    #[must_use]
    pub const fn source_identity_status(self) -> &'static str {
        self.source_identity_status
    }

    #[must_use]
    pub const fn source_row_id(self) -> &'static str {
        self.source_row_id
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn current_fiber_shape(self) -> [&'static str; 4] {
        self.current_fiber_shape
    }

    #[must_use]
    pub const fn root_child_count(self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn host_component_child_count(self) -> usize {
        self.host_component_child_count
    }

    #[must_use]
    pub const fn host_text_count(self) -> usize {
        self.host_text_count
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
    pub const fn store_current(self) -> TestRendererFiberHandleDiagnostics {
        self.store_current
    }

    #[must_use]
    pub const fn host_component_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.host_component_fiber
    }

    #[must_use]
    pub const fn stable_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.stable_text_fiber
    }

    #[must_use]
    pub const fn placed_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.placed_text_fiber
    }

    #[must_use]
    pub const fn stable_text_sibling(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.stable_text_sibling
    }

    #[must_use]
    pub const fn placed_text_sibling(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.placed_text_sibling
    }

    #[must_use]
    pub const fn host_component_element_type_raw(self) -> u64 {
        self.host_component_element_type_raw
    }

    #[must_use]
    pub const fn host_component_props_raw(self) -> u64 {
        self.host_component_props_raw
    }

    #[must_use]
    pub const fn stable_text_props_raw(self) -> u64 {
        self.stable_text_props_raw
    }

    #[must_use]
    pub const fn placed_text_props_raw(self) -> u64 {
        self.placed_text_props_raw
    }

    #[must_use]
    pub const fn host_component_state_node_raw(self) -> u64 {
        self.host_component_state_node_raw
    }

    #[must_use]
    pub const fn placed_text_state_node_raw(self) -> u64 {
        self.placed_text_state_node_raw
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
    pub const fn commit_remaining_lanes_bits(self) -> u32 {
        self.commit_remaining_lanes_bits
    }

    #[must_use]
    pub const fn commit_pending_lanes_bits(self) -> u32 {
        self.commit_pending_lanes_bits
    }

    #[must_use]
    pub const fn route_evidence_accepted(self) -> bool {
        self.route_evidence_accepted
    }

    #[must_use]
    pub const fn lifecycle_evidence_accepted(self) -> bool {
        self.lifecycle_evidence_accepted
    }

    #[must_use]
    pub const fn identity_evidence_accepted(self) -> bool {
        self.identity_evidence_accepted
    }

    #[must_use]
    pub const fn row_identity_accepted(self) -> bool {
        self.row_identity_accepted
    }

    #[must_use]
    pub const fn source_reconciler_inspection_diagnostic_name(self) -> &'static str {
        self.source_reconciler_inspection_diagnostic_name
    }

    #[must_use]
    pub const fn source_reconciler_inspection_status(self) -> &'static str {
        self.source_reconciler_inspection_status
    }

    #[must_use]
    pub const fn reconciler_direct_source_recorded(self) -> bool {
        self.reconciler_direct_source_recorded
    }

    #[must_use]
    pub const fn reconciler_direct_inspection_accepted(self) -> bool {
        self.reconciler_direct_inspection_accepted
    }

    #[must_use]
    pub const fn reconciler_direct_current_topology_matches_output(self) -> bool {
        self.reconciler_direct_current_topology_matches_output
    }

    #[must_use]
    pub const fn reconciler_direct_public_native_package_blocked(self) -> bool {
        self.reconciler_direct_public_native_package_blocked
    }

    #[must_use]
    pub const fn current_root_matches_commit(self) -> bool {
        self.current_root_matches_commit
    }

    #[must_use]
    pub const fn finished_work_matches_current_root(self) -> bool {
        self.finished_work_matches_current_root
    }

    #[must_use]
    pub const fn lanes_match(self) -> bool {
        self.lanes_match
    }

    #[must_use]
    pub const fn current_child_topology_matches_output(self) -> bool {
        self.current_child_topology_matches_output
    }

    #[must_use]
    pub const fn placement_handoff_accepted(self) -> bool {
        self.placement_handoff_accepted
    }

    #[must_use]
    pub const fn generic_reconciler_direct_inspection_available(self) -> bool {
        self.generic_reconciler_direct_inspection_available
    }

    #[must_use]
    pub const fn broad_multichild_fiber_inspection_available(self) -> bool {
        self.broad_multichild_fiber_inspection_available
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_to_tree_available(self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_loading_available(self) -> bool {
        self.native_bridge_loading_available
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn js_facade_available(self) -> bool {
        self.js_facade_available
    }

    #[must_use]
    pub const fn cjs_facade_available(self) -> bool {
        self.cjs_facade_available
    }

    #[must_use]
    pub const fn package_compatibility_claimed(self) -> bool {
        self.package_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub fn public_native_package_js_surfaces_blocked(self) -> bool {
        !self.public_to_json_available()
            && !self.public_to_tree_available()
            && !self.public_test_instance_available()
            && !self.public_serialization_available()
            && !self.public_route_available()
            && !self.native_bridge_loading_available()
            && !self.native_bridge_available()
            && !self.native_execution_available()
            && !self.js_facade_available()
            && !self.cjs_facade_available()
            && !self.package_compatibility_claimed()
            && !self.compatibility_claimed()
    }

    #[must_use]
    pub fn source_owned_current_fiber_inspection_accepted(self) -> bool {
        self.route_evidence_accepted()
            && self.lifecycle_evidence_accepted()
            && self.identity_evidence_accepted()
            && self.row_identity_accepted()
            && self.reconciler_direct_source_recorded()
            && self.reconciler_direct_inspection_accepted()
            && self.reconciler_direct_current_topology_matches_output()
            && self.reconciler_direct_public_native_package_blocked()
            && self.current_root_matches_commit()
            && self.finished_work_matches_current_root()
            && self.lanes_match()
            && self.current_child_topology_matches_output()
            && self.placement_handoff_accepted()
            && !self.generic_reconciler_direct_inspection_available()
            && !self.broad_multichild_fiber_inspection_available()
            && self.public_native_package_js_surfaces_blocked()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonSerializationReport {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) gate: TestRendererSerializationGateReport,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) root_child_count: usize,
    pub(crate) root_node_kind: TestRendererPrivateJsonNodeKind,
    pub(crate) nodes: Vec<TestRendererPrivateJsonNodeDiagnostic>,
    pub(crate) rendered_root: TestRendererPrivateJsonRenderedRoot,
    pub(crate) component: TestRendererPrivateJsonHostComponentDiagnostic,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
}

impl TestRendererPrivateJsonSerializationReport {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn gate(&self) -> &TestRendererSerializationGateReport {
        &self.gate
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(&self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn host_output_row(&self) -> Option<TestRendererPrivateToJsonHostOutputRow> {
        self.host_output_row
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn root_node_kind(&self) -> TestRendererPrivateJsonNodeKind {
        self.root_node_kind
    }

    #[must_use]
    pub fn nodes(&self) -> &[TestRendererPrivateJsonNodeDiagnostic] {
        &self.nodes
    }

    #[must_use]
    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    #[must_use]
    pub const fn rendered_root(&self) -> &TestRendererPrivateJsonRenderedRoot {
        &self.rendered_root
    }

    #[must_use]
    pub const fn component(&self) -> &TestRendererPrivateJsonHostComponentDiagnostic {
        &self.component
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateTreeNodeType {
    Component,
    Host,
}

impl TestRendererPrivateTreeNodeType {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Component => "component",
            Self::Host => "host",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateTreeRenderedRoot {
    Null,
    Text(String),
    HostComponent(TestRendererPrivateTreeRenderedHostComponent),
    Array(Vec<TestRendererPrivateTreeRenderedRoot>),
    FunctionComponent(Box<TestRendererPrivateTreeRenderedFunctionComponent>),
}

impl TestRendererPrivateTreeRenderedRoot {
    #[must_use]
    pub const fn is_null(&self) -> bool {
        matches!(self, Self::Null)
    }

    #[must_use]
    pub fn as_text(&self) -> Option<&str> {
        match self {
            Self::Text(text) => Some(text),
            Self::Null | Self::HostComponent(_) | Self::Array(_) | Self::FunctionComponent(_) => {
                None
            }
        }
    }

    #[must_use]
    pub const fn as_host_component(&self) -> Option<&TestRendererPrivateTreeRenderedHostComponent> {
        match self {
            Self::HostComponent(component) => Some(component),
            Self::Null | Self::Text(_) | Self::Array(_) | Self::FunctionComponent(_) => None,
        }
    }

    #[must_use]
    pub fn as_array(&self) -> Option<&[TestRendererPrivateTreeRenderedRoot]> {
        match self {
            Self::Array(children) => Some(children),
            Self::Null | Self::Text(_) | Self::HostComponent(_) | Self::FunctionComponent(_) => {
                None
            }
        }
    }

    #[must_use]
    pub const fn as_function_component(
        &self,
    ) -> Option<&TestRendererPrivateTreeRenderedFunctionComponent> {
        match self {
            Self::FunctionComponent(component) => Some(component),
            Self::Null | Self::Text(_) | Self::HostComponent(_) | Self::Array(_) => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeRenderedHostComponent {
    pub(crate) node_type: TestRendererPrivateTreeNodeType,
    pub(crate) element_type: TestElementType,
    pub(crate) props: BTreeMap<String, String>,
    pub(crate) instance_available: bool,
    pub(crate) rendered: Vec<TestRendererPrivateTreeRenderedRoot>,
}

impl TestRendererPrivateTreeRenderedHostComponent {
    #[must_use]
    pub const fn node_type(&self) -> TestRendererPrivateTreeNodeType {
        self.node_type
    }

    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &BTreeMap<String, String> {
        &self.props
    }

    #[must_use]
    pub const fn instance_available(&self) -> bool {
        self.instance_available
    }

    #[must_use]
    pub fn rendered(&self) -> &[TestRendererPrivateTreeRenderedRoot] {
        &self.rendered
    }

    #[must_use]
    pub fn rendered_child_count(&self) -> usize {
        self.rendered.len()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeRenderedFunctionComponent {
    pub(crate) node_type: TestRendererPrivateTreeNodeType,
    pub(crate) component_type: &'static str,
    pub(crate) props: TestProps,
    pub(crate) instance_available: bool,
    pub(crate) rendered: Box<TestRendererPrivateTreeRenderedRoot>,
    pub(crate) wraps_committed_host_output: bool,
}

impl TestRendererPrivateTreeRenderedFunctionComponent {
    #[must_use]
    pub const fn node_type(&self) -> TestRendererPrivateTreeNodeType {
        self.node_type
    }

    #[must_use]
    pub const fn component_type(&self) -> &'static str {
        self.component_type
    }

    #[must_use]
    pub const fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn instance_available(&self) -> bool {
        self.instance_available
    }

    #[must_use]
    pub fn rendered(&self) -> &TestRendererPrivateTreeRenderedRoot {
        self.rendered.as_ref()
    }

    #[must_use]
    pub const fn wraps_committed_host_output(&self) -> bool {
        self.wraps_committed_host_output
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeHostRootDiagnostic {
    pub(crate) fiber_tag: &'static str,
    pub(crate) delegates_to_child: bool,
    pub(crate) child_fiber_tag: &'static str,
    pub(crate) public_tree_object_available: bool,
}

impl TestRendererPrivateTreeHostRootDiagnostic {
    #[must_use]
    pub const fn fiber_tag(&self) -> &'static str {
        self.fiber_tag
    }

    #[must_use]
    pub const fn delegates_to_child(&self) -> bool {
        self.delegates_to_child
    }

    #[must_use]
    pub const fn child_fiber_tag(&self) -> &'static str {
        self.child_fiber_tag
    }

    #[must_use]
    pub const fn public_tree_object_available(&self) -> bool {
        self.public_tree_object_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeHostTextDiagnostic {
    pub(crate) fiber_tag: &'static str,
    pub(crate) text: String,
    pub(crate) returns_text_value: bool,
    pub(crate) public_tree_object_available: bool,
}

impl TestRendererPrivateTreeHostTextDiagnostic {
    #[must_use]
    pub const fn fiber_tag(&self) -> &'static str {
        self.fiber_tag
    }

    #[must_use]
    pub fn text(&self) -> &str {
        &self.text
    }

    #[must_use]
    pub const fn returns_text_value(&self) -> bool {
        self.returns_text_value
    }

    #[must_use]
    pub const fn public_tree_object_available(&self) -> bool {
        self.public_tree_object_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeHostComponentDiagnostic {
    pub(crate) fiber_tag: &'static str,
    pub(crate) node_type: TestRendererPrivateTreeNodeType,
    pub(crate) element_type: TestElementType,
    pub(crate) props: TestProps,
    pub(crate) instance_available: bool,
    pub(crate) rendered_child_count: usize,
    pub(crate) rendered_text: String,
    pub(crate) public_tree_object_available: bool,
}

impl TestRendererPrivateTreeHostComponentDiagnostic {
    #[must_use]
    pub const fn fiber_tag(&self) -> &'static str {
        self.fiber_tag
    }

    #[must_use]
    pub const fn node_type(&self) -> TestRendererPrivateTreeNodeType {
        self.node_type
    }

    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn instance_available(&self) -> bool {
        self.instance_available
    }

    #[must_use]
    pub const fn rendered_child_count(&self) -> usize {
        self.rendered_child_count
    }

    #[must_use]
    pub fn rendered_text(&self) -> &str {
        &self.rendered_text
    }

    #[must_use]
    pub const fn public_tree_object_available(&self) -> bool {
        self.public_tree_object_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeFunctionComponentDiagnostic {
    pub(crate) fiber_tag: &'static str,
    pub(crate) node_type: TestRendererPrivateTreeNodeType,
    pub(crate) component_type: &'static str,
    pub(crate) props: TestProps,
    pub(crate) instance_available: bool,
    pub(crate) rendered_child_fiber_tag: &'static str,
    pub(crate) rendered_child_node_type: TestRendererPrivateTreeNodeType,
    pub(crate) rendered_child_count: usize,
    pub(crate) wraps_committed_host_output: bool,
    pub(crate) public_tree_object_available: bool,
}

impl TestRendererPrivateTreeFunctionComponentDiagnostic {
    #[must_use]
    pub const fn fiber_tag(&self) -> &'static str {
        self.fiber_tag
    }

    #[must_use]
    pub const fn node_type(&self) -> TestRendererPrivateTreeNodeType {
        self.node_type
    }

    #[must_use]
    pub const fn component_type(&self) -> &'static str {
        self.component_type
    }

    #[must_use]
    pub const fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn instance_available(&self) -> bool {
        self.instance_available
    }

    #[must_use]
    pub const fn rendered_child_fiber_tag(&self) -> &'static str {
        self.rendered_child_fiber_tag
    }

    #[must_use]
    pub const fn rendered_child_node_type(&self) -> TestRendererPrivateTreeNodeType {
        self.rendered_child_node_type
    }

    #[must_use]
    pub const fn rendered_child_count(&self) -> usize {
        self.rendered_child_count
    }

    #[must_use]
    pub const fn wraps_committed_host_output(&self) -> bool {
        self.wraps_committed_host_output
    }

    #[must_use]
    pub const fn public_tree_object_available(&self) -> bool {
        self.public_tree_object_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeMetadataReport {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_json_diagnostic_name: &'static str,
    pub(crate) gate: TestRendererSerializationGateReport,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) accepted_fiber_shape: [&'static str; 3],
    pub(crate) accepted_composite_fiber_shape: [&'static str; 4],
    pub(crate) root_child_count: usize,
    pub(crate) host_root: TestRendererPrivateTreeHostRootDiagnostic,
    pub(crate) function_component: TestRendererPrivateTreeFunctionComponentDiagnostic,
    pub(crate) host_component: TestRendererPrivateTreeHostComponentDiagnostic,
    pub(crate) host_text: TestRendererPrivateTreeHostTextDiagnostic,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_tree_object_available: bool,
}

impl TestRendererPrivateTreeMetadataReport {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_json_diagnostic_name(&self) -> &'static str {
        self.source_json_diagnostic_name
    }

    #[must_use]
    pub const fn gate(&self) -> &TestRendererSerializationGateReport {
        &self.gate
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(&self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn host_output_row(&self) -> Option<TestRendererPrivateToJsonHostOutputRow> {
        self.host_output_row
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn accepted_fiber_shape(&self) -> &[&'static str; 3] {
        &self.accepted_fiber_shape
    }

    #[must_use]
    pub const fn accepted_composite_fiber_shape(&self) -> &[&'static str; 4] {
        &self.accepted_composite_fiber_shape
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn host_root(&self) -> &TestRendererPrivateTreeHostRootDiagnostic {
        &self.host_root
    }

    #[must_use]
    pub const fn function_component(&self) -> &TestRendererPrivateTreeFunctionComponentDiagnostic {
        &self.function_component
    }

    #[must_use]
    pub const fn host_component(&self) -> &TestRendererPrivateTreeHostComponentDiagnostic {
        &self.host_component
    }

    #[must_use]
    pub const fn host_text(&self) -> &TestRendererPrivateTreeHostTextDiagnostic {
        &self.host_text
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_tree_object_available(&self) -> bool {
        self.public_tree_object_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeCommittedFiberInspectionReport {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_tree_diagnostic_name: &'static str,
    pub(crate) shape_name: &'static str,
    pub(crate) fiber_shape: Vec<String>,
    pub(crate) root_child_fiber_tags: Vec<String>,
    pub(crate) host_child_fiber_tags: Vec<String>,
    pub(crate) root_child_count: usize,
    pub(crate) host_child_count: usize,
    pub(crate) host_component_count: usize,
    pub(crate) host_text_count: usize,
    pub(crate) function_component_fiber_tag: Option<String>,
    pub(crate) function_component_present: bool,
    pub(crate) wraps_committed_host_output: bool,
    pub(crate) accepted_minimal_fiber_shape: [&'static str; 3],
    pub(crate) accepted_composite_fiber_shape: [&'static str; 4],
    pub(crate) accepted_multi_child_fiber_shape: [&'static str; 4],
    pub(crate) accepted_composite_multi_child_fiber_shape: [&'static str; 5],
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_tree_object_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTreeCommittedFiberInspectionReport {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_tree_diagnostic_name(&self) -> &'static str {
        self.source_tree_diagnostic_name
    }

    #[must_use]
    pub const fn shape_name(&self) -> &'static str {
        self.shape_name
    }

    #[must_use]
    pub fn fiber_shape(&self) -> &[String] {
        &self.fiber_shape
    }

    #[must_use]
    pub fn root_child_fiber_tags(&self) -> &[String] {
        &self.root_child_fiber_tags
    }

    #[must_use]
    pub fn host_child_fiber_tags(&self) -> &[String] {
        &self.host_child_fiber_tags
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn host_child_count(&self) -> usize {
        self.host_child_count
    }

    #[must_use]
    pub const fn host_component_count(&self) -> usize {
        self.host_component_count
    }

    #[must_use]
    pub const fn host_text_count(&self) -> usize {
        self.host_text_count
    }

    #[must_use]
    pub fn function_component_fiber_tag(&self) -> Option<&str> {
        self.function_component_fiber_tag.as_deref()
    }

    #[must_use]
    pub const fn function_component_present(&self) -> bool {
        self.function_component_present
    }

    #[must_use]
    pub const fn wraps_committed_host_output(&self) -> bool {
        self.wraps_committed_host_output
    }

    #[must_use]
    pub const fn accepted_minimal_fiber_shape(&self) -> &[&'static str; 3] {
        &self.accepted_minimal_fiber_shape
    }

    #[must_use]
    pub const fn accepted_composite_fiber_shape(&self) -> &[&'static str; 4] {
        &self.accepted_composite_fiber_shape
    }

    #[must_use]
    pub const fn accepted_multi_child_fiber_shape(&self) -> &[&'static str; 4] {
        &self.accepted_multi_child_fiber_shape
    }

    #[must_use]
    pub const fn accepted_composite_multi_child_fiber_shape(&self) -> &[&'static str; 5] {
        &self.accepted_composite_multi_child_fiber_shape
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_tree_object_available(&self) -> bool {
        self.public_tree_object_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateTestInstanceFindAllPredicateKind {
    Type,
    Props,
    PredicateLike,
}

impl TestRendererPrivateTestInstanceFindAllPredicateKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Type => "type",
            Self::Props => "props",
            Self::PredicateLike => "predicate-like",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
    pub(crate) predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind,
    pub(crate) source: &'static str,
    pub(crate) predicate_source: &'static str,
    pub(crate) expected_type: Option<TestElementType>,
    pub(crate) expected_props: Option<TestProps>,
    pub(crate) evaluated_fiber_tags: Vec<&'static str>,
    pub(crate) matched_fiber_tags: Vec<&'static str>,
    pub(crate) rejected_fiber_tags: Vec<&'static str>,
    pub(crate) skipped_text_child_count: usize,
    pub(crate) predicate_execution: bool,
    pub(crate) public_query_method_available: bool,
}

impl TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
    #[must_use]
    pub const fn predicate_kind(&self) -> TestRendererPrivateTestInstanceFindAllPredicateKind {
        self.predicate_kind
    }

    #[must_use]
    pub const fn source(&self) -> &'static str {
        self.source
    }

    #[must_use]
    pub const fn predicate_source(&self) -> &'static str {
        self.predicate_source
    }

    #[must_use]
    pub fn expected_type(&self) -> Option<&TestElementType> {
        self.expected_type.as_ref()
    }

    #[must_use]
    pub fn expected_props(&self) -> Option<&TestProps> {
        self.expected_props.as_ref()
    }

    #[must_use]
    pub fn evaluated_fiber_tags(&self) -> &[&'static str] {
        &self.evaluated_fiber_tags
    }

    #[must_use]
    pub fn matched_fiber_tags(&self) -> &[&'static str] {
        &self.matched_fiber_tags
    }

    #[must_use]
    pub fn rejected_fiber_tags(&self) -> &[&'static str] {
        &self.rejected_fiber_tags
    }

    #[must_use]
    pub fn evaluated_candidate_count(&self) -> usize {
        self.evaluated_fiber_tags.len()
    }

    #[must_use]
    pub fn matched_candidate_count(&self) -> usize {
        self.matched_fiber_tags.len()
    }

    #[must_use]
    pub fn rejected_candidate_count(&self) -> usize {
        self.rejected_fiber_tags.len()
    }

    #[must_use]
    pub const fn skipped_text_child_count(&self) -> usize {
        self.skipped_text_child_count
    }

    #[must_use]
    pub const fn predicate_execution(&self) -> bool {
        self.predicate_execution
    }

    #[must_use]
    pub const fn public_query_method_available(&self) -> bool {
        self.public_query_method_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceFindAllQueryDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_tree_diagnostic_name: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) traversal_source: &'static str,
    pub(crate) traversal_order: &'static str,
    pub(crate) default_deep: bool,
    pub(crate) candidate_fiber_tags: Vec<&'static str>,
    pub(crate) skipped_fiber_tags: Vec<&'static str>,
    pub(crate) type_predicate: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic,
    pub(crate) props_predicate: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic,
    pub(crate) predicate_like: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_test_instance_object_available: bool,
    pub(crate) public_query_methods_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceFindAllQueryDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_tree_diagnostic_name(&self) -> &'static str {
        self.source_tree_diagnostic_name
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn traversal_source(&self) -> &'static str {
        self.traversal_source
    }

    #[must_use]
    pub const fn traversal_order(&self) -> &'static str {
        self.traversal_order
    }

    #[must_use]
    pub const fn default_deep(&self) -> bool {
        self.default_deep
    }

    #[must_use]
    pub fn candidate_fiber_tags(&self) -> &[&'static str] {
        &self.candidate_fiber_tags
    }

    #[must_use]
    pub fn skipped_fiber_tags(&self) -> &[&'static str] {
        &self.skipped_fiber_tags
    }

    #[must_use]
    pub fn candidate_count(&self) -> usize {
        self.candidate_fiber_tags.len()
    }

    #[must_use]
    pub fn skipped_text_child_count(&self) -> usize {
        self.skipped_fiber_tags.len()
    }

    #[must_use]
    pub const fn type_predicate(
        &self,
    ) -> &TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
        &self.type_predicate
    }

    #[must_use]
    pub const fn props_predicate(
        &self,
    ) -> &TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
        &self.props_predicate
    }

    #[must_use]
    pub const fn predicate_like(
        &self,
    ) -> &TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
        &self.predicate_like
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateTestInstanceFindByQueryKind {
    Type,
    Props,
}

impl TestRendererPrivateTestInstanceFindByQueryKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Type => "findByType",
            Self::Props => "findByProps",
        }
    }

    #[must_use]
    pub const fn criteria_kind(self) -> &'static str {
        match self {
            Self::Type => "type",
            Self::Props => "props",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceFindByResultDiagnostic {
    pub(crate) query_kind: TestRendererPrivateTestInstanceFindByQueryKind,
    pub(crate) public_surface: &'static str,
    pub(crate) source: &'static str,
    pub(crate) based_on_find_all_source: &'static str,
    pub(crate) based_on_predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind,
    pub(crate) expect_one_message: String,
    pub(crate) expected_type: Option<TestElementType>,
    pub(crate) expected_props: Option<TestProps>,
    pub(crate) effective_deep: bool,
    pub(crate) expect_one: bool,
    pub(crate) result_kind: &'static str,
    pub(crate) expected_canary_match_count: usize,
    pub(crate) matched_candidate_count: usize,
    pub(crate) candidate_fiber_tags: Vec<&'static str>,
    pub(crate) traversed_candidate_fiber_tags: Vec<&'static str>,
    pub(crate) skipped_fiber_tags: Vec<&'static str>,
    pub(crate) zero_match_error_prefix: &'static str,
    pub(crate) duplicate_match_error_prefix: &'static str,
    pub(crate) predicate_execution: bool,
    pub(crate) public_query_method_available: bool,
    pub(crate) public_test_instance_object_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceFindByResultDiagnostic {
    #[must_use]
    pub const fn query_kind(&self) -> TestRendererPrivateTestInstanceFindByQueryKind {
        self.query_kind
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source(&self) -> &'static str {
        self.source
    }

    #[must_use]
    pub const fn based_on_find_all_source(&self) -> &'static str {
        self.based_on_find_all_source
    }

    #[must_use]
    pub const fn based_on_predicate_kind(
        &self,
    ) -> TestRendererPrivateTestInstanceFindAllPredicateKind {
        self.based_on_predicate_kind
    }

    #[must_use]
    pub fn expect_one_message(&self) -> &str {
        &self.expect_one_message
    }

    #[must_use]
    pub fn expected_type(&self) -> Option<&TestElementType> {
        self.expected_type.as_ref()
    }

    #[must_use]
    pub fn expected_props(&self) -> Option<&TestProps> {
        self.expected_props.as_ref()
    }

    #[must_use]
    pub const fn effective_deep(&self) -> bool {
        self.effective_deep
    }

    #[must_use]
    pub const fn expect_one(&self) -> bool {
        self.expect_one
    }

    #[must_use]
    pub const fn result_kind(&self) -> &'static str {
        self.result_kind
    }

    #[must_use]
    pub const fn expected_canary_match_count(&self) -> usize {
        self.expected_canary_match_count
    }

    #[must_use]
    pub const fn matched_candidate_count(&self) -> usize {
        self.matched_candidate_count
    }

    #[must_use]
    pub fn candidate_fiber_tags(&self) -> &[&'static str] {
        &self.candidate_fiber_tags
    }

    #[must_use]
    pub fn traversed_candidate_fiber_tags(&self) -> &[&'static str] {
        &self.traversed_candidate_fiber_tags
    }

    #[must_use]
    pub fn skipped_fiber_tags(&self) -> &[&'static str] {
        &self.skipped_fiber_tags
    }

    #[must_use]
    pub const fn zero_match_error_prefix(&self) -> &'static str {
        self.zero_match_error_prefix
    }

    #[must_use]
    pub const fn duplicate_match_error_prefix(&self) -> &'static str {
        self.duplicate_match_error_prefix
    }

    #[must_use]
    pub const fn predicate_execution(&self) -> bool {
        self.predicate_execution
    }

    #[must_use]
    pub const fn public_query_method_available(&self) -> bool {
        self.public_query_method_available
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceFindByQueryDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_find_all_diagnostic_name: &'static str,
    pub(crate) source_tree_diagnostic_name: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) source: &'static str,
    pub(crate) accepted_find_all_traversal_source: &'static str,
    pub(crate) effective_deep: bool,
    pub(crate) expect_one: bool,
    pub(crate) find_all_candidate_fiber_tags: Vec<&'static str>,
    pub(crate) find_all_skipped_fiber_tags: Vec<&'static str>,
    pub(crate) find_by_type: TestRendererPrivateTestInstanceFindByResultDiagnostic,
    pub(crate) find_by_props: TestRendererPrivateTestInstanceFindByResultDiagnostic,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_test_instance_object_available: bool,
    pub(crate) public_query_methods_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceFindByQueryDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_find_all_diagnostic_name(&self) -> &'static str {
        self.source_find_all_diagnostic_name
    }

    #[must_use]
    pub const fn source_tree_diagnostic_name(&self) -> &'static str {
        self.source_tree_diagnostic_name
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn source(&self) -> &'static str {
        self.source
    }

    #[must_use]
    pub const fn accepted_find_all_traversal_source(&self) -> &'static str {
        self.accepted_find_all_traversal_source
    }

    #[must_use]
    pub const fn effective_deep(&self) -> bool {
        self.effective_deep
    }

    #[must_use]
    pub const fn expect_one(&self) -> bool {
        self.expect_one
    }

    #[must_use]
    pub fn find_all_candidate_fiber_tags(&self) -> &[&'static str] {
        &self.find_all_candidate_fiber_tags
    }

    #[must_use]
    pub fn find_all_skipped_fiber_tags(&self) -> &[&'static str] {
        &self.find_all_skipped_fiber_tags
    }

    #[must_use]
    pub const fn find_by_type(&self) -> &TestRendererPrivateTestInstanceFindByResultDiagnostic {
        &self.find_by_type
    }

    #[must_use]
    pub const fn find_by_props(&self) -> &TestRendererPrivateTestInstanceFindByResultDiagnostic {
        &self.find_by_props
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_find_all_diagnostic_name: &'static str,
    pub(crate) source_find_by_diagnostic_name: &'static str,
    pub(crate) bridge_status: &'static str,
    pub(crate) bridge_source: &'static str,
    pub(crate) wrapper_record_symbol: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) accepted_find_all_traversal_source: &'static str,
    pub(crate) accepted_find_by_source: &'static str,
    pub(crate) find_all_candidate_fiber_tags: Vec<&'static str>,
    pub(crate) find_all_skipped_fiber_tags: Vec<&'static str>,
    pub(crate) find_by_queries: Vec<&'static str>,
    pub(crate) consumes_accepted_find_all_diagnostics: bool,
    pub(crate) consumes_accepted_find_by_diagnostics: bool,
    pub(crate) record_only_diagnostic_consumption: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution: bool,
    pub(crate) rust_execution_from_js: bool,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_root_available: bool,
    pub(crate) public_test_instance_object_available: bool,
    pub(crate) public_query_methods_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_find_all_diagnostic_name(&self) -> &'static str {
        self.source_find_all_diagnostic_name
    }

    #[must_use]
    pub const fn source_find_by_diagnostic_name(&self) -> &'static str {
        self.source_find_by_diagnostic_name
    }

    #[must_use]
    pub const fn bridge_status(&self) -> &'static str {
        self.bridge_status
    }

    #[must_use]
    pub const fn bridge_source(&self) -> &'static str {
        self.bridge_source
    }

    #[must_use]
    pub const fn wrapper_record_symbol(&self) -> &'static str {
        self.wrapper_record_symbol
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn accepted_find_all_traversal_source(&self) -> &'static str {
        self.accepted_find_all_traversal_source
    }

    #[must_use]
    pub const fn accepted_find_by_source(&self) -> &'static str {
        self.accepted_find_by_source
    }

    #[must_use]
    pub fn find_all_candidate_fiber_tags(&self) -> &[&'static str] {
        &self.find_all_candidate_fiber_tags
    }

    #[must_use]
    pub fn find_all_skipped_fiber_tags(&self) -> &[&'static str] {
        &self.find_all_skipped_fiber_tags
    }

    #[must_use]
    pub fn find_by_queries(&self) -> &[&'static str] {
        &self.find_by_queries
    }

    #[must_use]
    pub const fn consumes_accepted_find_all_diagnostics(&self) -> bool {
        self.consumes_accepted_find_all_diagnostics
    }

    #[must_use]
    pub const fn consumes_accepted_find_by_diagnostics(&self) -> bool {
        self.consumes_accepted_find_by_diagnostics
    }

    #[must_use]
    pub const fn record_only_diagnostic_consumption(&self) -> bool {
        self.record_only_diagnostic_consumption
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(&self) -> bool {
        self.native_execution
    }

    #[must_use]
    pub const fn rust_execution_from_js(&self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_root_available(&self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceNativeQueryExecutionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) source_query_diagnostic_name: &'static str,
    pub(crate) query_bridge_preflight_status: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) query_surface: &'static str,
    pub(crate) query_kind: TestRendererPrivateTestInstanceFindByQueryKind,
    pub(crate) expected_type: TestElementType,
    pub(crate) result_fiber_tag: &'static str,
    pub(crate) result_kind: &'static str,
    pub(crate) matched_candidate_count: usize,
    pub(crate) query_path_candidate_count: usize,
    pub(crate) skipped_text_child_count: usize,
    pub(crate) consumes_accepted_native_create_execution_record: bool,
    pub(crate) consumes_accepted_native_update_execution_record: bool,
    pub(crate) consumes_private_test_instance_query_diagnostics: bool,
    pub(crate) consumes_query_bridge_preflight: bool,
    pub(crate) consumes_accepted_find_all_diagnostics: bool,
    pub(crate) consumes_accepted_find_by_diagnostics: bool,
    pub(crate) minimal_host_component_query_path: bool,
    pub(crate) public_root_available: bool,
    pub(crate) public_query_methods_available: bool,
    pub(crate) public_test_instance_object_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceNativeQueryExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(&self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(&self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(&self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_query_diagnostic_name(&self) -> &'static str {
        self.source_query_diagnostic_name
    }

    #[must_use]
    pub const fn query_bridge_preflight_status(&self) -> &'static str {
        self.query_bridge_preflight_status
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn query_surface(&self) -> &'static str {
        self.query_surface
    }

    #[must_use]
    pub const fn query_kind(&self) -> TestRendererPrivateTestInstanceFindByQueryKind {
        self.query_kind
    }

    #[must_use]
    pub const fn expected_type(&self) -> &TestElementType {
        &self.expected_type
    }

    #[must_use]
    pub const fn result_fiber_tag(&self) -> &'static str {
        self.result_fiber_tag
    }

    #[must_use]
    pub const fn result_kind(&self) -> &'static str {
        self.result_kind
    }

    #[must_use]
    pub const fn matched_candidate_count(&self) -> usize {
        self.matched_candidate_count
    }

    #[must_use]
    pub const fn query_path_candidate_count(&self) -> usize {
        self.query_path_candidate_count
    }

    #[must_use]
    pub const fn skipped_text_child_count(&self) -> usize {
        self.skipped_text_child_count
    }

    #[must_use]
    pub const fn consumes_accepted_native_create_execution_record(&self) -> bool {
        self.consumes_accepted_native_create_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(&self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_private_test_instance_query_diagnostics(&self) -> bool {
        self.consumes_private_test_instance_query_diagnostics
    }

    #[must_use]
    pub const fn consumes_query_bridge_preflight(&self) -> bool {
        self.consumes_query_bridge_preflight
    }

    #[must_use]
    pub const fn consumes_accepted_find_all_diagnostics(&self) -> bool {
        self.consumes_accepted_find_all_diagnostics
    }

    #[must_use]
    pub const fn consumes_accepted_find_by_diagnostics(&self) -> bool {
        self.consumes_accepted_find_by_diagnostics
    }

    #[must_use]
    pub const fn minimal_host_component_query_path(&self) -> bool {
        self.minimal_host_component_query_path
    }

    #[must_use]
    pub const fn public_root_available(&self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) source_query_diagnostic_name: &'static str,
    pub(crate) source_get_instance_diagnostic_name: &'static str,
    pub(crate) query_bridge_preflight_status: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) accepted_class_fiber_shape: [&'static str; 4],
    pub(crate) root_query_surface: &'static str,
    pub(crate) root_result_fiber_tag: &'static str,
    pub(crate) root_component_type: &'static str,
    pub(crate) root_props: TestProps,
    pub(crate) root_child_count: usize,
    pub(crate) child_query_surface: &'static str,
    pub(crate) child_query_kind: TestRendererPrivateTestInstanceFindByQueryKind,
    pub(crate) child_fiber_tag: &'static str,
    pub(crate) child_element_type: TestElementType,
    pub(crate) child_props: TestProps,
    pub(crate) previous_child_text: String,
    pub(crate) current_child_text: String,
    pub(crate) host_child_updated: bool,
    pub(crate) class_root_query_path: Vec<&'static str>,
    pub(crate) updated_host_child_query_path: Vec<&'static str>,
    pub(crate) consumes_accepted_native_update_execution_record: bool,
    pub(crate) consumes_private_test_instance_query_diagnostics: bool,
    pub(crate) consumes_query_bridge_preflight: bool,
    pub(crate) consumes_private_get_instance_class_root_diagnostics: bool,
    pub(crate) public_root_available: bool,
    pub(crate) public_query_methods_available: bool,
    pub(crate) public_test_instance_object_available: bool,
    pub(crate) public_get_instance_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(&self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(&self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(&self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_query_diagnostic_name(&self) -> &'static str {
        self.source_query_diagnostic_name
    }

    #[must_use]
    pub const fn source_get_instance_diagnostic_name(&self) -> &'static str {
        self.source_get_instance_diagnostic_name
    }

    #[must_use]
    pub const fn query_bridge_preflight_status(&self) -> &'static str {
        self.query_bridge_preflight_status
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn accepted_class_fiber_shape(&self) -> &[&'static str; 4] {
        &self.accepted_class_fiber_shape
    }

    #[must_use]
    pub const fn root_query_surface(&self) -> &'static str {
        self.root_query_surface
    }

    #[must_use]
    pub const fn root_result_fiber_tag(&self) -> &'static str {
        self.root_result_fiber_tag
    }

    #[must_use]
    pub const fn root_component_type(&self) -> &'static str {
        self.root_component_type
    }

    #[must_use]
    pub const fn root_props(&self) -> &TestProps {
        &self.root_props
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn child_query_surface(&self) -> &'static str {
        self.child_query_surface
    }

    #[must_use]
    pub const fn child_query_kind(&self) -> TestRendererPrivateTestInstanceFindByQueryKind {
        self.child_query_kind
    }

    #[must_use]
    pub const fn child_fiber_tag(&self) -> &'static str {
        self.child_fiber_tag
    }

    #[must_use]
    pub const fn child_element_type(&self) -> &TestElementType {
        &self.child_element_type
    }

    #[must_use]
    pub const fn child_props(&self) -> &TestProps {
        &self.child_props
    }

    #[must_use]
    pub fn previous_child_text(&self) -> &str {
        &self.previous_child_text
    }

    #[must_use]
    pub fn current_child_text(&self) -> &str {
        &self.current_child_text
    }

    #[must_use]
    pub const fn host_child_updated(&self) -> bool {
        self.host_child_updated
    }

    #[must_use]
    pub fn class_root_query_path(&self) -> &[&'static str] {
        &self.class_root_query_path
    }

    #[must_use]
    pub fn updated_host_child_query_path(&self) -> &[&'static str] {
        &self.updated_host_child_query_path
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(&self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_private_test_instance_query_diagnostics(&self) -> bool {
        self.consumes_private_test_instance_query_diagnostics
    }

    #[must_use]
    pub const fn consumes_query_bridge_preflight(&self) -> bool {
        self.consumes_query_bridge_preflight
    }

    #[must_use]
    pub const fn consumes_private_get_instance_class_root_diagnostics(&self) -> bool {
        self.consumes_private_get_instance_class_root_diagnostics
    }

    #[must_use]
    pub const fn public_root_available(&self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
    pub(crate) root_fiber_shape: [&'static str; 2],
    pub(crate) root_child_fiber_tag: &'static str,
    pub(crate) react_public_result: &'static str,
    pub(crate) public_get_instance_available: bool,
    pub(crate) private_class_instance_available: bool,
    pub(crate) public_behavior_fail_closed: bool,
}

impl TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
    #[must_use]
    pub const fn root_fiber_shape(&self) -> &[&'static str; 2] {
        &self.root_fiber_shape
    }

    #[must_use]
    pub const fn root_child_fiber_tag(&self) -> &'static str {
        self.root_child_fiber_tag
    }

    #[must_use]
    pub const fn react_public_result(&self) -> &'static str {
        self.react_public_result
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }

    #[must_use]
    pub const fn private_class_instance_available(&self) -> bool {
        self.private_class_instance_available
    }

    #[must_use]
    pub const fn public_behavior_fail_closed(&self) -> bool {
        self.public_behavior_fail_closed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateGetInstanceClassInstanceDiagnostic {
    pub(crate) constructor_name: &'static str,
    pub(crate) props: TestProps,
    pub(crate) state_marker: &'static str,
    pub(crate) private_instance_available: bool,
    pub(crate) public_get_instance_available: bool,
    pub(crate) react_public_result: &'static str,
}

impl TestRendererPrivateGetInstanceClassInstanceDiagnostic {
    #[must_use]
    pub const fn constructor_name(&self) -> &'static str {
        self.constructor_name
    }

    #[must_use]
    pub const fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn state_marker(&self) -> &'static str {
        self.state_marker
    }

    #[must_use]
    pub const fn private_instance_available(&self) -> bool {
        self.private_instance_available
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }

    #[must_use]
    pub const fn react_public_result(&self) -> &'static str {
        self.react_public_result
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateGetInstanceClassComponentDiagnostic {
    pub(crate) fiber_tag: &'static str,
    pub(crate) component_type: &'static str,
    pub(crate) props: TestProps,
    pub(crate) state_node_available: bool,
    pub(crate) rendered_child_fiber_tag: &'static str,
    pub(crate) rendered_child_count: usize,
    pub(crate) instance: TestRendererPrivateGetInstanceClassInstanceDiagnostic,
    pub(crate) public_get_instance_available: bool,
}

impl TestRendererPrivateGetInstanceClassComponentDiagnostic {
    #[must_use]
    pub const fn fiber_tag(&self) -> &'static str {
        self.fiber_tag
    }

    #[must_use]
    pub const fn component_type(&self) -> &'static str {
        self.component_type
    }

    #[must_use]
    pub const fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn state_node_available(&self) -> bool {
        self.state_node_available
    }

    #[must_use]
    pub const fn rendered_child_fiber_tag(&self) -> &'static str {
        self.rendered_child_fiber_tag
    }

    #[must_use]
    pub const fn rendered_child_count(&self) -> usize {
        self.rendered_child_count
    }

    #[must_use]
    pub const fn instance(&self) -> &TestRendererPrivateGetInstanceClassInstanceDiagnostic {
        &self.instance
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateGetInstanceClassRootReport {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_tree_diagnostic_name: &'static str,
    pub(crate) gate: TestRendererSerializationGateReport,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) accepted_class_fiber_shape: [&'static str; 4],
    pub(crate) host_root_fail_closed: TestRendererPrivateGetInstanceFailClosedRootDiagnostic,
    pub(crate) function_root_fail_closed: TestRendererPrivateGetInstanceFailClosedRootDiagnostic,
    pub(crate) class_component: TestRendererPrivateGetInstanceClassComponentDiagnostic,
    pub(crate) rendered_host_component: TestRendererPrivateTreeHostComponentDiagnostic,
    pub(crate) rendered_host_text: TestRendererPrivateTreeHostTextDiagnostic,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_get_instance_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateGetInstanceClassRootReport {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_tree_diagnostic_name(&self) -> &'static str {
        self.source_tree_diagnostic_name
    }

    #[must_use]
    pub const fn gate(&self) -> &TestRendererSerializationGateReport {
        &self.gate
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn accepted_class_fiber_shape(&self) -> &[&'static str; 4] {
        &self.accepted_class_fiber_shape
    }

    #[must_use]
    pub const fn host_root_fail_closed(
        &self,
    ) -> &TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
        &self.host_root_fail_closed
    }

    #[must_use]
    pub const fn function_root_fail_closed(
        &self,
    ) -> &TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
        &self.function_root_fail_closed
    }

    #[must_use]
    pub const fn class_component(&self) -> &TestRendererPrivateGetInstanceClassComponentDiagnostic {
        &self.class_component
    }

    #[must_use]
    pub const fn rendered_host_component(&self) -> &TestRendererPrivateTreeHostComponentDiagnostic {
        &self.rendered_host_component
    }

    #[must_use]
    pub const fn rendered_host_text(&self) -> &TestRendererPrivateTreeHostTextDiagnostic {
        &self.rendered_host_text
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}
