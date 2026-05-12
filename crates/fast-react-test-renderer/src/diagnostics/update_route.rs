use super::*;

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
