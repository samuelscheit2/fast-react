use super::*;

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
