use super::*;

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
