use super::super::*;

impl TestRendererRoot {
    pub fn describe_private_error_boundary_diagnostics_for_canary(
        &self,
    ) -> Result<TestRendererPrivateErrorBoundaryDiagnostics, TestRendererRootError> {
        self.describe_private_error_boundary_diagnostics_with_dependencies(
            TestRendererPrivateErrorBoundaryDependencyDiagnostics::root_options_only(),
        )
    }

    pub fn describe_private_error_boundary_update_diagnostics_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateErrorBoundaryDiagnostics, TestRendererRootError> {
        let serialization =
            self.describe_private_json_serialization_after_update_for_canary(output)?;
        let query =
            self.describe_private_test_instance_find_by_query_after_update_for_canary(output)?;
        let finished_work = output.commit().current();
        let passive_metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
            self.root_id,
            TestRendererFiberHandleDiagnostics {
                arena_id: finished_work.arena_id().get(),
                slot: finished_work.slot().get(),
                generation: finished_work.generation().get(),
            },
            0,
            0,
        );
        let act_diagnostics =
            self.consume_private_act_pending_passive_flush_metadata_for_canary(passive_metadata);
        let dependency_diagnostics = TestRendererPrivateErrorBoundaryDependencyDiagnostics {
            update_route_diagnostics_available: true,
            serialization_diagnostics_available: serialization.host_output_update_kind()
                == TestRendererRootUpdateKind::Update
                && serialization.host_output_snapshot_current(),
            test_instance_query_diagnostics_available: query.host_output_update_kind()
                == TestRendererRootUpdateKind::Update
                && query.host_output_snapshot_current(),
            act_scheduler_metadata_available: act_diagnostics.metadata_root_matches_renderer_root()
                && act_diagnostics.consumes_pending_passive_flush_metadata()
                && act_diagnostics.consumes_accepted_scheduler_flush_metadata()
                && act_diagnostics.private_scheduler_flush_request_metadata_consumed(),
            public_renderer_roots_executed: false,
            public_lifecycle_methods_executed: false,
            error_boundary_recovery_executed: false,
            compatibility_claimed: false,
        };

        self.describe_private_error_boundary_diagnostics_with_dependencies(dependency_diagnostics)
    }

    pub fn describe_private_error_boundary_update_native_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateErrorBoundaryNativeExecutionEvidence, TestRendererRootError>
    {
        self.describe_private_error_boundary_commit_recovery_for_canary(output, execution)
    }

    pub fn describe_private_error_boundary_commit_recovery_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateErrorBoundaryNativeExecutionEvidence, TestRendererRootError>
    {
        let diagnostics =
            self.describe_private_error_boundary_update_diagnostics_for_canary(output)?;
        self.validate_private_error_boundary_update_native_execution_for_canary(
            &diagnostics,
            execution,
        )?;

        let rows = *diagnostics.rows();
        let consumes_update_error_row = rows
            .iter()
            .any(|row| row.phase() == TestRendererPrivateErrorDiagnosticPhase::Update);
        let consumes_commit_error_row = rows
            .iter()
            .any(|row| row.phase() == TestRendererPrivateErrorDiagnosticPhase::Commit);
        let commit_recovery_metadata =
            TestRendererPrivateErrorBoundaryCommitRecoveryMetadata::from_update_execution_for_canary(
                self.root_id,
                execution,
                diagnostics.root_error_options(),
            );
        if !commit_recovery_metadata.accepted_private_commit_phase_recovery_metadata() {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "commit-recovery-metadata-not-accepted",
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateErrorBoundaryNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation: "update",
            public_surface: "create().update error boundary",
            update_failure_path: "update",
            source_execution_record_id:
                TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            source_execution_status: TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS,
            source_execution_scheduled_update_kind: execution.scheduled_update_kind(),
            host_output_update_kind: execution.host_output_update_kind(),
            error_diagnostics: diagnostics,
            commit_recovery_metadata,
            rows,
            row_count: rows.len(),
            consumes_accepted_root_execution_diagnostics: true,
            consumes_accepted_native_update_execution_record: true,
            consumes_private_error_boundary_diagnostics: true,
            consumes_private_commit_recovery_metadata: true,
            consumes_accepted_rust_failure_metadata: true,
            preserves_root_error_option_handles: true,
            consumes_update_error_row,
            consumes_commit_error_row,
            root_error_update_scheduled: false,
            public_root_error_callbacks_invoked: false,
            public_error_boundary_behavior_available: false,
            error_boundary_recovery_executed: false,
            public_error_recovery_available: false,
            public_commit_phase_recovery_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            rust_execution_from_js: execution.rust_execution_from_js(),
            reconciler_execution_from_js: execution.reconciler_execution_from_js(),
            compatibility_claimed: false,
        })
    }

    fn validate_private_error_boundary_update_native_execution_for_canary(
        &self,
        diagnostics: &TestRendererPrivateErrorBoundaryDiagnostics,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<(), TestRendererRootError> {
        if execution.root() != self.root_id {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RootMismatch {
                    expected: self.root_id,
                    actual: execution.root(),
                }
                .into(),
            );
        }
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "update-native-bridge-admission-diagnostic-id",
                }
                .into(),
            );
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "update-native-bridge-admission-status",
                }
                .into(),
            );
        }
        if execution.scheduled_update_kind() != TestRendererRootUpdateKind::Update {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "scheduled-update-kind",
                }
                .into(),
            );
        }
        if execution.host_output_update_kind() != TestRendererRootUpdateKind::Update {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "host-output-update-kind",
                }
                .into(),
            );
        }
        if !(execution.update_route_admission_accepted()
            && execution.lifecycle_evidence_accepted()
            && execution.root_work_loop_handoff_accepted()
            && execution.host_output_handoff_accepted()
            && execution.text_update_apply_recorded()
            && execution.host_text_update_apply_count() == 1
            && execution.host_component_update_apply_count() == 1
            && execution.rust_execution_from_js()
            && execution.reconciler_execution_from_js())
        {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "update-execution-admission-not-accepted",
                }
                .into(),
            );
        }
        if execution.native_bridge_available()
            || execution.native_execution()
            || execution.public_update_compatibility_claimed()
            || execution.public_serialization_available()
            || execution.act_flushing_claimed()
            || execution.compatibility_claimed()
        {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::PublicRecoveryOpened {
                    reason: "update-execution-record-claimed-public-behavior",
                }
                .into(),
            );
        }
        if diagnostics.root() != self.root_id
            || diagnostics.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || !diagnostics
                .dependency_diagnostics()
                .update_commit_rows_ready()
        {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "error-boundary-update-diagnostics-not-ready",
                }
                .into(),
            );
        }
        if diagnostics.public_error_boundary_behavior_available()
            || diagnostics.public_root_error_callbacks_invoked()
            || diagnostics.compatibility_claimed()
        {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::PublicRecoveryOpened {
                    reason: "error-boundary-diagnostics-claimed-public-recovery",
                }
                .into(),
            );
        }

        Ok(())
    }

    fn describe_private_error_boundary_diagnostics_with_dependencies(
        &self,
        dependency_diagnostics: TestRendererPrivateErrorBoundaryDependencyDiagnostics,
    ) -> Result<TestRendererPrivateErrorBoundaryDiagnostics, TestRendererRootError> {
        let root_options = self.store.root(self.root_id)?.options();
        let root_error_options = TestRendererRootErrorOptionDiagnostics {
            on_uncaught_error: root_options.on_uncaught_error(),
            on_caught_error: root_options.on_caught_error(),
            on_recoverable_error: root_options.on_recoverable_error(),
            root_error_option_metadata_available: true,
            public_root_error_callbacks_invoked: false,
            public_error_boundary_behavior_available: false,
            compatibility_claimed: false,
        };
        let rows = [
            self.create_private_error_diagnostic_row(
                TestRendererPrivateErrorDiagnosticPhase::Update,
                root_error_options,
                dependency_diagnostics,
            ),
            self.create_private_error_diagnostic_row(
                TestRendererPrivateErrorDiagnosticPhase::Commit,
                root_error_options,
                dependency_diagnostics,
            ),
        ];

        Ok(TestRendererPrivateErrorBoundaryDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS,
            root: self.root_id,
            host_output_update_kind: TestRendererRootUpdateKind::Update,
            root_error_options,
            dependency_diagnostics,
            rows,
            public_error_boundary_behavior_available: false,
            public_root_error_callbacks_invoked: false,
            compatibility_claimed: false,
        })
    }

    fn create_private_error_diagnostic_row(
        &self,
        phase: TestRendererPrivateErrorDiagnosticPhase,
        root_error_options: TestRendererRootErrorOptionDiagnostics,
        dependency_diagnostics: TestRendererPrivateErrorBoundaryDependencyDiagnostics,
    ) -> TestRendererPrivateErrorDiagnosticRow {
        TestRendererPrivateErrorDiagnosticRow {
            id: phase.row_id(),
            diagnostic_name: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS,
            phase,
            host_output_update_kind: TestRendererRootUpdateKind::Update,
            root: self.root_id,
            root_error_channel: "onUncaughtError",
            root_error_options,
            dependency_diagnostics,
            react_reference: phase.react_reference(),
            root_error_update_scheduled: false,
            public_root_error_callbacks_invoked: false,
            public_error_boundary_behavior_available: false,
            compatibility_claimed: false,
        }
    }
}
