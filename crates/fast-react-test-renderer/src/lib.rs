//! Deterministic in-memory mutation test renderer.
//!
//! This crate proves that the canonical `fast-react-host-config` capability
//! traits can be implemented without DOM, native, hydration, persistence, or
//! legacy `HostConfig` behavior. Its root canary delegates create/update/
//! unmount scheduling to `fast-react-reconciler` and exposes a diagnostic
//! HostRoot render/commit handoff, including callback snapshot diagnostics,
//! plus a private committed host-output canary for one HostComponent with one
//! HostText child, private JSON diagnostics for create/update canaries and
//! broader host snapshot shapes, and private host-node deletion cleanup
//! diagnostics. It still stops before public serialization, act, or public
//! `react-test-renderer` compatibility.

use std::collections::BTreeMap;
use std::error::Error;
use std::fmt::{self, Display, Formatter};
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

use fast_react_core::FiberId;
use fast_react_host_config::{
    HostCapability, HostCapabilitySet, HostChild, HostChildKind, HostCommit, HostCreation,
    HostError, HostFiberTokenPhase, HostFiberTokenRef, HostFiberTokenTarget,
    HostFiberTokenViolation, HostHandleKind, HostIdentityAndContext, HostMutationViolation,
    HostOperationError, HostParentKind, HostResult, HostTypes, InitialChildrenFinalization,
    MutationHost,
};
use fast_react_reconciler::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostRootCommitRecord,
    HostRootRenderPhaseRecord, RootCommitError, RootElementHandle, RootErrorCallbackHandle,
    RootOptions, RootRecoverableErrorCallbackHandle, RootScheduleMicrotaskResult,
    RootSchedulerError, RootUpdateCallbackHandle, RootUpdateError, RootWorkLoopError,
    ScheduledRootUpdateResult, TestRendererCommittedFiberInspectionError,
    TestRendererCommittedFiberNodeInspection, TestRendererCommittedFiberTreeInspection,
    TestRendererHostOutputCanaryCommitDiagnostics, TestRendererHostOutputCanaryCompletedFibers,
    TestRendererHostOutputCanaryCurrentFibers, TestRendererHostOutputCanaryDeletedFibers,
    TestRendererHostOutputCanaryError, TestRendererHostOutputCanaryFixture,
    TestRendererHostOutputCanaryPreparedFibers, TestRendererHostOutputCanaryUpdatedFibers,
    UpdateContainerResult, commit_finished_host_root, ensure_root_is_scheduled,
    finish_test_renderer_host_output_canary_fibers,
    inspect_reconciler_direct_multi_child_committed_fiber_tree,
    inspect_test_renderer_committed_fiber_tree, inspect_test_renderer_host_output_canary_commit,
    prepare_test_renderer_host_output_canary_fibers,
    prepare_test_renderer_host_output_unmount_canary_fibers,
    prepare_test_renderer_host_output_unmount_ref_passive_cleanup_canary,
    prepare_test_renderer_host_output_update_canary_fibers, process_root_schedule_in_microtask,
    record_reconciler_direct_multi_child_committed_fiber_source, render_host_root_for_lanes,
    scheduled_roots, update_container, update_container_sync,
};

pub const TEST_RENDERER_NAME: &str = "fast-react-test-renderer";

mod host;
pub use host::*;

mod diagnostics;
pub use diagnostics::*;

mod errors;
pub use errors::*;

mod host_config_impl;

pub struct TestRendererRoot {
    renderer: TestRenderer,
    container: TestContainer,
    store: FiberRootStore<TestRenderer>,
    root_id: FiberRootId,
    options: TestRendererOptions,
    lifecycle: TestRendererRootLifecycle,
    scheduled_updates: Vec<TestRendererRootScheduledUpdate>,
    host_output_fixtures: Vec<TestRendererHostOutputFixture>,
    nested_host_output_fixtures: Vec<TestRendererNestedHostOutputFixture>,
    host_nodes: TestRendererHostNodeStore,
    current_host_output: Option<TestRendererCurrentHostOutput>,
    current_nested_host_output: Option<TestRendererCurrentNestedHostOutput>,
}

mod root_impl;

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

    pub fn scheduled_roots_for_canary(&self) -> Result<Vec<FiberRootId>, TestRendererRootError> {
        Ok(scheduled_roots(&self.store)?)
    }

    pub fn process_root_schedule_microtask_for_canary(
        &mut self,
    ) -> Result<RootScheduleMicrotaskResult, TestRendererRootError> {
        Ok(process_root_schedule_in_microtask(&mut self.store)?)
    }

    pub fn describe_serialization_gate_for_canary(
        &self,
        commit: &HostRootCommitRecord,
    ) -> Result<TestRendererSerializationGateReport, TestRendererRootError> {
        self.validate_serialization_gate_commit(commit)?;

        let snapshot = self.renderer.snapshot_container(&self.container)?;
        let host_output = TestRendererHostOutputDiagnostics {
            container_child_count: snapshot.children().len(),
            instance_count: self.renderer.instances.len(),
            text_count: self.renderer.texts.len(),
            real_host_output_available: !snapshot.children().is_empty(),
        };
        let fiber_inspection = if host_output.real_host_output_available() {
            Some(self.describe_committed_fiber_tree_for_canary(commit)?)
        } else {
            None
        };
        let requirements = TestRendererSerializationGateRequirements {
            root_commit_diagnostics_available: true,
            real_host_output_available: host_output.real_host_output_available(),
            committed_fiber_inspection_available: fiber_inspection.is_some(),
        };
        let status = if !requirements.real_host_output_available() {
            TestRendererSerializationGateStatus::ClosedMissingHostOutput
        } else if !requirements.committed_fiber_inspection_available() {
            TestRendererSerializationGateStatus::ClosedMissingFiberInspection
        } else {
            TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
        };
        let callbacks = commit.root_update_callbacks();
        let previous_current = commit.previous_current();
        let current = commit.current();
        let finished_work = commit.finished_work();
        let last_update = self.scheduled_updates.last();

        Ok(TestRendererSerializationGateReport {
            gate_name: TEST_RENDERER_SERIALIZATION_CANARY_GATE_NAME,
            status,
            requirements,
            oracle: TestRendererSerializationOracleDiagnostics::current(),
            commit: TestRendererCommitDiagnostics {
                root: commit.root(),
                lifecycle: self.lifecycle,
                last_update_kind: last_update.map(TestRendererRootScheduledUpdate::kind),
                last_scheduled_element: last_update.map(TestRendererRootScheduledUpdate::element),
                previous_current: TestRendererFiberHandleDiagnostics {
                    arena_id: previous_current.arena_id().get(),
                    slot: previous_current.slot().get(),
                    generation: previous_current.generation().get(),
                },
                current: TestRendererFiberHandleDiagnostics {
                    arena_id: current.arena_id().get(),
                    slot: current.slot().get(),
                    generation: current.generation().get(),
                },
                finished_work: TestRendererFiberHandleDiagnostics {
                    arena_id: finished_work.arena_id().get(),
                    slot: finished_work.slot().get(),
                    generation: finished_work.generation().get(),
                },
                finished_lanes_bits: commit.finished_lanes().bits(),
                remaining_lanes_bits: commit.remaining_lanes().bits(),
                pending_lanes_bits: commit.pending_lanes().bits(),
                finished_lanes_empty: commit.finished_lanes().is_empty(),
                finished_lanes_include_sync: commit.finished_lanes().includes_sync_lane(),
                remaining_lanes_empty: commit.remaining_lanes().is_empty(),
                pending_lanes_empty: commit.pending_lanes().is_empty(),
                has_remaining_work: commit.has_remaining_work(),
                root_update_callbacks: TestRendererRootUpdateCallbackDiagnostics {
                    empty: callbacks.is_empty(),
                    visible_count: callbacks.visible().len(),
                    hidden_count: callbacks.hidden().len(),
                    deferred_hidden_count: callbacks.deferred_hidden().len(),
                },
            },
            host_output,
            fiber_inspection: fiber_inspection.map(Box::new),
        })
    }

    pub fn describe_committed_fiber_tree_for_canary(
        &self,
        commit: &HostRootCommitRecord,
    ) -> Result<TestRendererCommittedFiberTreeInspection, TestRendererRootError> {
        self.validate_serialization_gate_commit(commit)?;
        Ok(inspect_test_renderer_committed_fiber_tree(
            &self.store,
            self.root_id,
        )?)
    }

    pub fn require_serialization_gate_ready_for_canary(
        &self,
        commit: &HostRootCommitRecord,
    ) -> Result<TestRendererSerializationGateReport, TestRendererRootError> {
        let report = self.describe_serialization_gate_for_canary(commit)?;
        if report.is_ready() {
            Ok(report)
        } else {
            Err(TestRendererSerializationGateError::Closed(report).into())
        }
    }

    fn validate_private_multi_child_host_text_output_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
    ) -> Result<(), TestRendererRootError> {
        self.validate_serialization_gate_commit(output.commit())?;
        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "multi-child-host-text-snapshot-stale",
                }
                .into(),
            );
        }

        let previous_shape =
            Self::private_to_json_host_output_shape_from_snapshot(output.previous_snapshot());
        let current_shape =
            Self::private_to_json_host_output_shape_from_snapshot(output.snapshot());
        if previous_shape.shape() != TestRendererPrivateToJsonHostOutputShape::SingleHostText
            || current_shape.shape() != TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            || current_shape.host_component_count() != 1
            || current_shape.host_text_count() != 2
            || current_shape.root_text_count() != 0
            || current_shape.max_host_component_depth() != 1
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "multi-child-host-text-shape-mismatch",
                }
                .into(),
            );
        }

        let [TestNodeSnapshot::Element(previous_element)] = output.previous_snapshot().children()
        else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "multi-child-host-text-previous-topology-mismatch",
                }
                .into(),
            );
        };
        let [TestNodeSnapshot::Text(_previous_text)] = previous_element.children() else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "multi-child-host-text-previous-topology-mismatch",
                }
                .into(),
            );
        };

        let [TestNodeSnapshot::Element(element)] = output.snapshot().children() else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "multi-child-host-text-topology-mismatch",
                }
                .into(),
            );
        };
        let [
            TestNodeSnapshot::Text(first),
            TestNodeSnapshot::Text(second),
        ] = element.children()
        else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "multi-child-host-text-topology-mismatch",
                }
                .into(),
            );
        };
        if first.is_hidden()
            || second.is_hidden()
            || second.text() != output.placed_text_snapshot().text()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "multi-child-host-text-order-mismatch",
                }
                .into(),
            );
        }

        if output.host_parent_placement_apply_count() == 0
            || !output
                .commit()
                .has_test_only_host_parent_placement_apply_for_canary(
                    output.parent_state_node_raw(),
                    output.placed_text_state_node_raw(),
                )
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "multi-child-host-text-placement-evidence-missing",
                }
                .into(),
            );
        }

        Ok(())
    }

    pub fn describe_private_json_serialization_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateJsonSerializationReport, TestRendererRootError> {
        self.describe_private_json_serialization_from_current_fibers_for_canary(
            output.commit(),
            Some(output.fiber_inspection()),
            TestRendererPrivateJsonCurrentFibersForCanary::Host(
                output.completed_fibers().current(),
            ),
            output.snapshot(),
            TestRendererRootUpdateKind::Create,
            None,
        )
    }

    pub fn describe_private_json_serialization_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateJsonSerializationReport, TestRendererRootError> {
        let host_output_row = Self::private_to_json_host_output_row(
            TestRendererRootUpdateKind::Update,
            output.previous_snapshot(),
            output.snapshot(),
        )?;
        self.describe_private_json_serialization_from_current_fibers_for_canary(
            output.commit(),
            Some(output.fiber_inspection()),
            TestRendererPrivateJsonCurrentFibersForCanary::Host(output.updated_fibers().current()),
            output.snapshot(),
            TestRendererRootUpdateKind::Update,
            Some(host_output_row),
        )
    }

    pub fn describe_private_json_serialization_after_nested_update_for_canary(
        &self,
        output: &TestRendererNestedHostParentPlacedHostOutput,
    ) -> Result<TestRendererPrivateJsonSerializationReport, TestRendererRootError> {
        let host_output_row =
            self.describe_private_to_json_nested_host_output_update_row_for_canary(output)?;
        self.describe_private_json_serialization_from_current_fibers_for_canary(
            output.commit(),
            Some(output.fiber_inspection()),
            TestRendererPrivateJsonCurrentFibersForCanary::Nested {
                outer: output.outer_fibers(),
                inner: output.inner_fibers(),
            },
            output.snapshot(),
            TestRendererRootUpdateKind::Update,
            Some(host_output_row),
        )
    }

    pub fn describe_private_json_serialization_after_sibling_text_update_for_canary(
        &self,
        output: &TestRendererSiblingTextHostOutput,
    ) -> Result<TestRendererPrivateJsonSerializationReport, TestRendererRootError> {
        let host_output_row =
            self.describe_private_to_json_sibling_text_host_output_row_for_canary(output)?;
        self.describe_private_json_serialization_from_current_fibers_for_canary(
            output.commit(),
            Some(output.fiber_inspection()),
            TestRendererPrivateJsonCurrentFibersForCanary::SiblingText {
                root_text: output.root_text_fiber(),
                root_text_props_raw: output.root_text_props_raw(),
                component: output.stable_fibers().current(),
            },
            output.snapshot(),
            TestRendererRootUpdateKind::Update,
            Some(host_output_row),
        )
    }

    pub fn describe_private_to_json_host_output_update_row_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        let report = self.describe_private_json_serialization_after_update_for_canary(output)?;
        report.host_output_row().ok_or_else(|| {
            TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                row_id: TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID,
                expected: TestRendererRootUpdateKind::Update,
                actual: TestRendererRootUpdateKind::Create,
            }
            .into()
        })
    }

    pub fn describe_private_to_json_nested_host_output_update_row_for_canary(
        &self,
        output: &TestRendererNestedHostParentPlacedHostOutput,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        self.validate_serialization_gate_commit(output.commit())?;

        let Some(last_update) = self.scheduled_updates.last() else {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Update,
                actual: TestRendererRootUpdateKind::Create,
            });
        };
        if last_update.kind() != TestRendererRootUpdateKind::Update {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Update,
                actual: last_update.kind(),
            });
        }

        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Err(TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale.into());
        }

        Self::private_to_json_host_output_row_with_shape(
            TestRendererRootUpdateKind::Update,
            TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID,
            Some(TestRendererPrivateToJsonHostOutputShape::NestedHostText),
            output.previous_snapshot(),
            output.snapshot(),
        )
    }

    pub fn describe_private_to_json_multi_child_host_text_output_row_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        self.validate_private_multi_child_host_text_output_for_canary(output)?;

        let Some(last_update) = self.scheduled_updates.last() else {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Update,
                actual: TestRendererRootUpdateKind::Create,
            });
        };
        if last_update.kind() != TestRendererRootUpdateKind::Update {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Update,
                actual: last_update.kind(),
            });
        }

        Self::private_to_json_host_output_row_with_shape(
            TestRendererRootUpdateKind::Update,
            TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID,
            Some(TestRendererPrivateToJsonHostOutputShape::MultiChildHostText),
            output.previous_snapshot(),
            output.snapshot(),
        )
    }

    pub fn describe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics(
        previous_snapshot: &TestContainerSnapshot,
        current_snapshot: &TestContainerSnapshot,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        Self::private_to_json_host_output_row_with_shape(
            TestRendererRootUpdateKind::Update,
            TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID,
            Some(TestRendererPrivateToJsonHostOutputShape::SiblingText),
            previous_snapshot,
            current_snapshot,
        )
    }

    pub fn describe_private_to_json_sibling_text_host_output_row_for_canary(
        &self,
        output: &TestRendererSiblingTextHostOutput,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        self.validate_serialization_gate_commit(output.commit())?;

        let Some(last_update) = self.scheduled_updates.last() else {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Update,
                actual: TestRendererRootUpdateKind::Create,
            });
        };
        if last_update.kind() != TestRendererRootUpdateKind::Update {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Update,
                actual: last_update.kind(),
            });
        }

        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Err(TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale.into());
        }
        if output.fiber_inspection().shape_name() != "HostRoot->[HostText,HostComponent->HostText]"
        {
            return Err(
                TestRendererPrivateJsonSerializationError::CommittedFiberMismatch {
                    node_kind: TestRendererPrivateJsonNodeKind::RootArray,
                }
                .into(),
            );
        }

        Self::private_to_json_host_output_row_with_shape(
            TestRendererRootUpdateKind::Update,
            TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID,
            Some(TestRendererPrivateToJsonHostOutputShape::SiblingText),
            output.previous_snapshot(),
            output.snapshot(),
        )
    }

    pub fn describe_private_to_json_host_output_unmount_row_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        self.validate_serialization_gate_commit(output.commit())?;

        let Some(last_update) = self.scheduled_updates.last() else {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: TestRendererRootUpdateKind::Create,
            });
        };
        if last_update.kind() != TestRendererRootUpdateKind::Unmount {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: last_update.kind(),
            });
        }

        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Err(TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale.into());
        }
        if !output.snapshot().children().is_empty() {
            return Err(
                TestRendererPrivateJsonSerializationError::UnmountSnapshotNotEmpty {
                    actual: output.snapshot().children().len(),
                }
                .into(),
            );
        }
        if output.deleted_fibers().host_root() != output.commit().current() {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                    row_id: TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID,
                    expected: TestRendererRootUpdateKind::Unmount,
                    actual: TestRendererRootUpdateKind::Update,
                }
                .into(),
            );
        }

        Self::private_to_json_host_output_row(
            TestRendererRootUpdateKind::Unmount,
            output.previous_snapshot(),
            output.snapshot(),
        )
    }

    pub fn describe_private_unmount_deletion_commit_handoff_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
    ) -> Result<TestRendererUnmountDeletionCommitHandoffDiagnostics, TestRendererRootError> {
        self.validate_serialization_gate_commit(output.commit())?;

        let Some(last_update) = self.scheduled_updates.last() else {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: TestRendererRootUpdateKind::Create,
            });
        };
        if last_update.kind() != TestRendererRootUpdateKind::Unmount {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: last_update.kind(),
            });
        }

        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Err(TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale.into());
        }

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

        let commit = output.commit();
        let render = output.render();
        let deleted = output.deleted_fibers();
        let commit_current = commit.current();
        let commit_previous_current = commit.previous_current();
        let render_finished_work = render.finished_work();
        let store_current = self.store.root(self.root_id)?.current();
        let cleanup_log = commit.host_node_deletion_cleanup_log();
        let cleanup_report = output.host_node_cleanup();
        let passive_ref_cleanup_order =
            Self::passive_ref_cleanup_order_evidence_for_canary(commit, cleanup_report);
        let cleanup_records_match_deletion_commit = cleanup_report.root() == commit.root()
            && cleanup_report.len() == cleanup_log.len()
            && cleanup_report
                .records()
                .iter()
                .zip(cleanup_log.records())
                .all(|(report_record, commit_record)| {
                    report_record.sequence() == commit_record.sequence()
                        && report_record.root() == commit_record.root()
                        && report_record.deletion_list_index()
                            == commit_record.deletion_list_index()
                        && report_record.deleted_index() == commit_record.deleted_index()
                        && report_record.subtree_index() == commit_record.subtree_index()
                        && report_record.parent() == fiber_handle!(commit_record.parent())
                        && report_record.deleted_root()
                            == fiber_handle!(commit_record.deleted_root())
                        && report_record.fiber() == fiber_handle!(commit_record.fiber())
                        && report_record.state_node_raw() == commit_record.state_node().raw()
                        && report_record.token_raw() == commit_record.token().raw()
                        && report_record.token_phase() == commit_record.token_phase()
                });
        let deletion_list_count = output.commit_diagnostics().deletion_lists().len();
        let deleted_root_count = output
            .commit_diagnostics()
            .deletion_lists()
            .iter()
            .map(|record| record.deleted().len())
            .sum();
        let host_child_detachment_blockers = TestRendererUnmountHostChildDetachmentBlockers {
            detached_instance: output.detached_instance_snapshot().is_detached(),
            detached_instance_child_count: output.detached_instance_snapshot().children().len(),
            host_node_cleanup_invalidated_count: cleanup_report
                .records()
                .iter()
                .filter(|record| record.status() == TestRendererHostNodeCleanupStatus::Invalidated)
                .count(),
            host_node_cleanup_already_inactive_count: cleanup_report
                .records()
                .iter()
                .filter(|record| {
                    record.status() == TestRendererHostNodeCleanupStatus::AlreadyInactive
                })
                .count(),
            host_node_cleanup_missing_host_node_count: cleanup_report
                .records()
                .iter()
                .filter(|record| {
                    record.status() == TestRendererHostNodeCleanupStatus::MissingHostNode
                })
                .count(),
            host_node_cleanup_missing_state_node_count: cleanup_report
                .records()
                .iter()
                .filter(|record| {
                    record.status() == TestRendererHostNodeCleanupStatus::MissingStateNode
                })
                .count(),
            broad_host_child_detachment_blocked: true,
            public_host_teardown_compatibility_claimed: false,
            public_unmount_compatibility_claimed: cleanup_report
                .public_unmount_compatibility_claimed(),
            act_flushing_claimed: false,
        };

        Ok(TestRendererUnmountDeletionCommitHandoffDiagnostics {
            diagnostic_id: TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_STATUS,
            root: commit.root(),
            lifecycle: self.lifecycle,
            scheduled_update_kind: last_update.kind(),
            scheduled_element: last_update.element(),
            scheduled_element_is_none: last_update.element() == RootElementHandle::NONE,
            render_current: fiber_handle!(render.current()),
            commit_previous_current: fiber_handle!(commit_previous_current),
            commit_current: fiber_handle!(commit_current),
            render_finished_work: fiber_handle!(render_finished_work),
            render_lanes_bits: render.render_lanes().bits(),
            commit_finished_lanes_bits: commit.finished_lanes().bits(),
            deleted_root: fiber_handle!(deleted.host_root()),
            deleted_component: fiber_handle!(deleted.deleted_component()),
            deleted_text: fiber_handle!(deleted.deleted_text()),
            commit_current_is_store_current: commit_current == store_current,
            render_current_matches_commit_previous_current: render.current()
                == commit_previous_current,
            render_finished_work_matches_commit_current: render_finished_work == commit_current,
            deletion_list_count,
            deleted_root_count,
            host_node_cleanup_count: cleanup_report.len(),
            cleanup_records_match_deletion_commit,
            cleanup_order_record_count: commit.deletion_cleanup_order_gate_for_canary().len(),
            public_unmount_compatibility_claimed: cleanup_report
                .public_unmount_compatibility_claimed(),
            public_host_teardown_compatibility_claimed: false,
            act_flushing_claimed: false,
            host_child_detachment_blockers,
            passive_ref_cleanup_order,
        })
    }

    fn passive_ref_cleanup_order_evidence_for_canary(
        commit: &HostRootCommitRecord,
        cleanup_report: &TestRendererHostNodeCleanupReport,
    ) -> TestRendererUnmountPassiveRefCleanupOrderEvidence {
        let order_gate = commit.deletion_cleanup_order_gate_for_canary();
        let first_host_node_cleanup_order = order_gate
            .records()
            .iter()
            .filter(|record| record.phase_name() == "host-node-cleanup")
            .map(|record| record.sequence())
            .min();
        let last_ref_cleanup_return_order = order_gate
            .records()
            .iter()
            .filter(|record| record.phase_name() == "ref-cleanup-return")
            .map(|record| record.sequence())
            .max();
        let first_passive_destroy_order = order_gate
            .records()
            .iter()
            .filter(|record| record.phase_name() == "passive-destroy")
            .map(|record| record.sequence())
            .min();
        let last_passive_destroy_order = order_gate
            .records()
            .iter()
            .filter(|record| record.phase_name() == "passive-destroy")
            .map(|record| record.sequence())
            .max();
        let ref_cleanup_return_precedes_passive_destroy =
            match (last_ref_cleanup_return_order, first_passive_destroy_order) {
                (Some(ref_order), Some(passive_order)) => ref_order < passive_order,
                _ => true,
            };
        let host_cleanup_follows_ref_cleanup_return =
            match (last_ref_cleanup_return_order, first_host_node_cleanup_order) {
                (Some(ref_order), Some(host_order)) => ref_order < host_order,
                (None, Some(_)) => true,
                _ => false,
            };
        let host_cleanup_follows_passive_destroy =
            match (last_passive_destroy_order, first_host_node_cleanup_order) {
                (Some(passive_order), Some(host_order)) => passive_order < host_order,
                (None, Some(_)) => true,
                _ => false,
            };
        let cleanup_order_record_count = order_gate.len();
        let native_cleanup_after_ref_and_passive_ordering =
            ref_cleanup_return_precedes_passive_destroy
                && host_cleanup_follows_ref_cleanup_return
                && host_cleanup_follows_passive_destroy
                && order_gate.host_node_cleanup_count() == cleanup_report.len()
                && cleanup_order_record_count
                    == order_gate.ref_cleanup_return_count()
                        + order_gate.passive_destroy_count()
                        + order_gate.host_node_cleanup_count()
                && !order_gate.ref_cleanup_return_callbacks_invoked()
                && !order_gate.passive_destroy_callbacks_invoked()
                && !order_gate.public_effects_flushed()
                && !order_gate.public_ref_or_effect_compatibility_claimed();

        TestRendererUnmountPassiveRefCleanupOrderEvidence {
            diagnostic_id: TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_STATUS,
            root: commit.root(),
            ref_cleanup_return_count: order_gate.ref_cleanup_return_count(),
            passive_destroy_count: order_gate.passive_destroy_count(),
            host_node_cleanup_count: order_gate.host_node_cleanup_count(),
            cleanup_order_record_count,
            first_host_node_cleanup_order,
            last_ref_cleanup_return_order,
            first_passive_destroy_order,
            last_passive_destroy_order,
            ref_cleanup_return_precedes_passive_destroy,
            host_cleanup_follows_ref_cleanup_return,
            host_cleanup_follows_passive_destroy,
            native_cleanup_after_ref_and_passive_ordering,
            minimal_tree_ordering_is_host_cleanup_only: order_gate.ref_cleanup_return_count() == 0
                && order_gate.passive_destroy_count() == 0
                && order_gate.host_node_cleanup_count() == cleanup_report.len()
                && cleanup_order_record_count == cleanup_report.len(),
            ref_cleanup_return_callbacks_invoked: order_gate.ref_cleanup_return_callbacks_invoked(),
            passive_destroy_callbacks_invoked: order_gate.passive_destroy_callbacks_invoked(),
            public_effects_flushed: order_gate.public_effects_flushed(),
            public_ref_or_effect_compatibility_claimed: order_gate
                .public_ref_or_effect_compatibility_claimed(),
            public_unmount_compatibility_claimed: cleanup_report
                .public_unmount_compatibility_claimed(),
            act_flushing_claimed: false,
        }
    }

    pub fn describe_private_unmount_native_bridge_admission_for_canary(
        &self,
        route_outcome: &TestRendererRootUpdateOutcome,
        handoff: Option<&TestRendererUnmountDeletionCommitHandoffDiagnostics>,
    ) -> Result<TestRendererUnmountNativeBridgeAdmission, TestRendererRootError> {
        let Some(scheduled_update) = route_outcome.scheduled() else {
            return Err(match route_outcome {
                TestRendererRootUpdateOutcome::AlreadyUnmountScheduled => {
                    TestRendererPrivateUnmountNativeBridgeAdmissionError::AlreadyUnmountedRoot
                }
                TestRendererRootUpdateOutcome::IgnoredAfterUnmount => {
                    TestRendererPrivateUnmountNativeBridgeAdmissionError::UnexpectedRouteOutcome {
                        actual: route_outcome.code(),
                    }
                }
                TestRendererRootUpdateOutcome::Scheduled(_) => unreachable!(),
            }
            .into());
        };
        if scheduled_update.kind() != TestRendererRootUpdateKind::Unmount {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::UnexpectedScheduledUpdateKind {
                    actual: scheduled_update.kind(),
                }
                .into(),
            );
        }
        if self.scheduled_updates.last() != Some(scheduled_update) {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleRouteOutcome.into(),
            );
        }

        let Some(handoff) = handoff.copied() else {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingDeletionCommitHandoff
                    .into(),
            );
        };
        self.validate_private_unmount_native_bridge_handoff_for_canary(scheduled_update, handoff)?;
        let passive_ref_cleanup_order = handoff.passive_ref_cleanup_order();

        Ok(TestRendererUnmountNativeBridgeAdmission {
            diagnostic_id: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS,
            root: self.root_id,
            renderer_id: self.renderer.renderer_id,
            route_dependency_id: TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID,
            deletion_commit_handoff_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID,
            cleanup_handoff_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID,
            scheduled_update_sequence: self.scheduled_updates.len(),
            lifecycle: handoff.lifecycle(),
            scheduled_update_kind: scheduled_update.kind(),
            scheduled_element_is_none: scheduled_update.element() == RootElementHandle::NONE,
            render_current: handoff.render_current(),
            render_finished_work: handoff.render_finished_work(),
            commit_previous_current: handoff.commit_previous_current(),
            commit_current: handoff.commit_current(),
            render_lanes_bits: handoff.render_lanes_bits(),
            commit_finished_lanes_bits: handoff.commit_finished_lanes_bits(),
            deletion_commit_handoff_accepted: true,
            cleanup_handoff_accepted: true,
            lifecycle_evidence_accepted: true,
            cleanup_blockers_accepted: true,
            passive_ref_cleanup_order_accepted: true,
            host_node_cleanup_count: handoff.host_node_cleanup_count(),
            ref_cleanup_return_count: passive_ref_cleanup_order.ref_cleanup_return_count(),
            passive_destroy_count: passive_ref_cleanup_order.passive_destroy_count(),
            cleanup_order_record_count: handoff.cleanup_order_record_count(),
            native_cleanup_after_ref_and_passive_ordering: passive_ref_cleanup_order
                .native_cleanup_after_ref_and_passive_ordering(),
            rust_unmount_cleanup_handoff_executed: true,
            host_output_produced: true,
            minimal_tree_cleanup_handoff: handoff.host_node_cleanup_count() == 2
                && handoff.cleanup_order_record_count() == 2
                && passive_ref_cleanup_order.minimal_tree_ordering_is_host_cleanup_only()
                && passive_ref_cleanup_order.native_cleanup_after_ref_and_passive_ordering(),
            rejects_already_unmounted_roots: true,
            rejects_stale_deletion_handoffs: true,
            rejects_missing_cleanup_blockers: true,
            public_unmount_compatibility_claimed: false,
            public_host_teardown_compatibility_claimed: false,
            act_flushing_claimed: false,
            native_bridge_available: false,
            native_execution: false,
        })
    }

    pub fn execute_private_unmount_native_bridge_cleanup_handoff_for_canary(
        &mut self,
    ) -> Result<TestRendererUnmountNativeBridgeCleanupHandoff, TestRendererRootError> {
        self.execute_private_unmount_native_bridge_cleanup_handoff_inner_for_canary(false)
    }

    pub fn execute_private_unmount_native_bridge_cleanup_handoff_with_ref_passive_cleanup_for_canary(
        &mut self,
    ) -> Result<TestRendererUnmountNativeBridgeCleanupHandoff, TestRendererRootError> {
        self.execute_private_unmount_native_bridge_cleanup_handoff_inner_for_canary(true)
    }

    fn execute_private_unmount_native_bridge_cleanup_handoff_inner_for_canary(
        &mut self,
        include_ref_passive_cleanup: bool,
    ) -> Result<TestRendererUnmountNativeBridgeCleanupHandoff, TestRendererRootError> {
        let route_outcome = self.unmount()?;
        let unmounted = if include_ref_passive_cleanup {
            self.render_and_commit_host_output_unmount_with_ref_passive_cleanup_for_canary()?
        } else {
            self.render_and_commit_host_output_unmount_for_canary()?
        };
        let Some(unmounted) = unmounted else {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingDeletionCommitHandoff
                    .into(),
            );
        };
        let handoff =
            self.describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)?;
        let admission = self.describe_private_unmount_native_bridge_admission_for_canary(
            &route_outcome,
            Some(&handoff),
        )?;
        let previous_root_child_count = unmounted.previous_snapshot().children().len();
        let current_root_child_count = unmounted.snapshot().children().len();
        let detached_instance = unmounted.detached_instance_snapshot().is_detached();
        let detached_instance_child_count = unmounted.detached_instance_snapshot().children().len();
        let passive_ref_cleanup_order = handoff.passive_ref_cleanup_order();
        let minimal_tree_cleanup_handoff = previous_root_child_count == 1
            && current_root_child_count == 0
            && detached_instance
            && detached_instance_child_count == 0
            && handoff.host_node_cleanup_count() == 2
            && handoff.cleanup_order_record_count() == 2
            && passive_ref_cleanup_order.minimal_tree_ordering_is_host_cleanup_only()
            && passive_ref_cleanup_order.native_cleanup_after_ref_and_passive_ordering();

        Ok(TestRendererUnmountNativeBridgeCleanupHandoff {
            diagnostic_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_STATUS,
            root: self.root_id,
            route_outcome: route_outcome.code(),
            route_dependency_id: TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID,
            deletion_commit_handoff_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID,
            admission_diagnostic_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            lifecycle: handoff.lifecycle(),
            scheduled_update_kind: handoff.scheduled_update_kind(),
            scheduled_element_is_none: handoff.scheduled_element_is_none(),
            previous_root_child_count,
            current_root_child_count,
            detached_instance,
            detached_instance_child_count,
            host_node_cleanup_count: handoff.host_node_cleanup_count(),
            ref_cleanup_return_count: passive_ref_cleanup_order.ref_cleanup_return_count(),
            passive_destroy_count: passive_ref_cleanup_order.passive_destroy_count(),
            cleanup_order_record_count: handoff.cleanup_order_record_count(),
            native_cleanup_after_ref_and_passive_ordering: passive_ref_cleanup_order
                .native_cleanup_after_ref_and_passive_ordering(),
            minimal_tree_cleanup_handoff,
            rust_unmount_cleanup_handoff_executed: true,
            host_output_produced: true,
            passive_ref_cleanup_order,
            deletion_commit_handoff: handoff,
            native_bridge_admission: admission,
            public_unmount_compatibility_claimed: false,
            public_host_teardown_compatibility_claimed: false,
            act_flushing_claimed: false,
            native_bridge_available: false,
            native_execution: false,
        })
    }

    fn validate_private_unmount_native_bridge_handoff_for_canary(
        &self,
        scheduled_update: &TestRendererRootScheduledUpdate,
        handoff: TestRendererUnmountDeletionCommitHandoffDiagnostics,
    ) -> Result<(), TestRendererRootError> {
        if handoff.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "diagnostic-id-mismatch",
                }
                .into(),
            );
        }
        if handoff.status() != TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_STATUS {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "diagnostic-status-mismatch",
                }
                .into(),
            );
        }
        if handoff.root() != self.root_id {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "root-mismatch",
                }
                .into(),
            );
        }
        if handoff.lifecycle() != self.lifecycle
            || handoff.lifecycle() != TestRendererRootLifecycle::UnmountScheduled
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "lifecycle-mismatch",
                }
                .into(),
            );
        }
        if handoff.scheduled_update_kind() != TestRendererRootUpdateKind::Unmount
            || scheduled_update.kind() != handoff.scheduled_update_kind()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "scheduled-update-kind-mismatch",
                }
                .into(),
            );
        }
        if scheduled_update.element() != RootElementHandle::NONE
            || handoff.scheduled_element() != RootElementHandle::NONE
            || !handoff.scheduled_element_is_none()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "scheduled-element-mismatch",
                }
                .into(),
            );
        }
        if !handoff.commit_current_is_store_current()
            || !handoff.render_current_matches_commit_previous_current()
            || !handoff.render_finished_work_matches_commit_current()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "commit-handoff-identity-mismatch",
                }
                .into(),
            );
        }
        if handoff.render_lanes_bits() == 0
            || handoff.render_lanes_bits() != handoff.commit_finished_lanes_bits()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "lane-mismatch",
                }
                .into(),
            );
        }
        if handoff.deletion_list_count() == 0 || handoff.deleted_root_count() == 0 {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "missing-deletion-list",
                }
                .into(),
            );
        }
        if handoff.host_node_cleanup_count() == 0 {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "missing-host-node-cleanup-records",
                }
                .into(),
            );
        }
        if !handoff.cleanup_records_match_deletion_commit() {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "cleanup-records-do-not-match-commit",
                }
                .into(),
            );
        }
        let passive_ref_cleanup_order = handoff.passive_ref_cleanup_order();
        let expected_cleanup_order_record_count = passive_ref_cleanup_order
            .ref_cleanup_return_count()
            + passive_ref_cleanup_order.passive_destroy_count()
            + passive_ref_cleanup_order.host_node_cleanup_count();
        if handoff.cleanup_order_record_count() != expected_cleanup_order_record_count {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "cleanup-order-count-mismatch",
                }
                .into(),
            );
        }
        if passive_ref_cleanup_order.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_DIAGNOSTIC_ID
            || passive_ref_cleanup_order.status()
                != TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_STATUS
            || passive_ref_cleanup_order.root() != self.root_id
            || passive_ref_cleanup_order.host_node_cleanup_count()
                != handoff.host_node_cleanup_count()
            || passive_ref_cleanup_order.cleanup_order_record_count()
                != handoff.cleanup_order_record_count()
            || !passive_ref_cleanup_order.ref_cleanup_return_precedes_passive_destroy()
            || !passive_ref_cleanup_order.host_cleanup_follows_ref_cleanup_return()
            || !passive_ref_cleanup_order.host_cleanup_follows_passive_destroy()
            || !passive_ref_cleanup_order.native_cleanup_after_ref_and_passive_ordering()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "passive-ref-cleanup-order-mismatch",
                }
                .into(),
            );
        }
        if passive_ref_cleanup_order.ref_cleanup_return_callbacks_invoked()
            || passive_ref_cleanup_order.passive_destroy_callbacks_invoked()
            || passive_ref_cleanup_order.public_effects_flushed()
            || passive_ref_cleanup_order.public_ref_or_effect_compatibility_claimed()
            || passive_ref_cleanup_order.public_unmount_compatibility_claimed()
            || passive_ref_cleanup_order.act_flushing_claimed()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "passive-ref-cleanup-order-public-claim",
                }
                .into(),
            );
        }

        let blockers = handoff.host_child_detachment_blockers();
        if !blockers.detached_instance()
            || blockers.detached_instance_child_count() != 0
            || !blockers.broad_host_child_detachment_blocked()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "host-child-detachment-blockers-missing",
                }
                .into(),
            );
        }
        if blockers.host_node_cleanup_invalidated_count() != handoff.host_node_cleanup_count()
            || blockers.host_node_cleanup_already_inactive_count() != 0
            || blockers.host_node_cleanup_missing_host_node_count() != 0
            || blockers.host_node_cleanup_missing_state_node_count() != 0
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "host-node-cleanup-blockers-mismatch",
                }
                .into(),
            );
        }
        if handoff.public_unmount_compatibility_claimed()
            || handoff.public_host_teardown_compatibility_claimed()
            || handoff.act_flushing_claimed()
            || blockers.public_unmount_compatibility_claimed()
            || blockers.public_host_teardown_compatibility_claimed()
            || blockers.act_flushing_claimed()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "public-or-act-claim",
                }
                .into(),
            );
        }

        Ok(())
    }

    pub fn describe_private_root_create_lifecycle_execution_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
        execution: TestRendererPrivateCreateNativeBridgeHostOutputHandoff,
    ) -> Result<TestRendererPrivateRootLifecycleExecutionEvidence, TestRendererRootError> {
        self.validate_private_root_create_lifecycle_execution_for_canary(output, execution)?;
        let current_snapshot = self.diagnostic_container_snapshot()?;
        let shape = Self::private_to_json_host_output_shape_from_snapshot(&current_snapshot);
        let (element_type, props, text) =
            Self::private_root_lifecycle_single_host_text_snapshot(&current_snapshot, "create")?;

        Ok(Self::private_root_lifecycle_execution_evidence(
            self.root_id,
            self.renderer.renderer_id,
            "create",
            "create()",
            execution.diagnostic_id(),
            execution.status(),
            self.scheduled_updates.len(),
            self.lifecycle,
            TestRendererRootUpdateKind::Create,
            TestRendererRootUpdateKind::Create,
            shape,
            None,
            current_snapshot,
            Some(element_type),
            Some(props),
            Some(text),
            None,
            0,
            0,
        ))
    }

    pub fn describe_private_root_update_lifecycle_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateRootLifecycleExecutionEvidence, TestRendererRootError> {
        self.validate_private_root_update_lifecycle_execution_for_canary(output, execution)?;
        let current_snapshot = self.diagnostic_container_snapshot()?;
        let shape = Self::private_to_json_host_output_shape_from_snapshot(&current_snapshot);
        let (element_type, props, text) =
            Self::private_root_lifecycle_single_host_text_snapshot(&current_snapshot, "update")?;
        let host_update_apply_count = execution.host_text_update_apply_count()
            + execution.host_component_update_apply_count();

        Ok(Self::private_root_lifecycle_execution_evidence(
            self.root_id,
            self.renderer.renderer_id,
            "update",
            "create().update",
            execution.diagnostic_id(),
            execution.status(),
            output.scheduled_update_sequence(),
            self.lifecycle,
            execution.scheduled_update_kind(),
            execution.host_output_update_kind(),
            shape,
            Some(output.previous_snapshot().clone()),
            current_snapshot,
            Some(element_type),
            Some(props),
            Some(text),
            None,
            0,
            host_update_apply_count,
        ))
    }

    pub fn describe_private_root_multi_child_host_text_update_lifecycle_execution_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<TestRendererPrivateRootLifecycleExecutionEvidence, TestRendererRootError> {
        self.validate_private_root_multi_child_host_text_lifecycle_execution_for_canary(
            output, execution,
        )?;
        let current_snapshot = self.diagnostic_container_snapshot()?;
        let shape = Self::private_to_json_host_output_shape_from_snapshot(&current_snapshot);
        let TestNodeSnapshot::Element(element) = &current_snapshot.children()[0] else {
            unreachable!("multi-child HostText lifecycle validation requires a HostComponent root")
        };
        let element_type = element.element_type().clone();
        let props = element.props().clone();

        Ok(Self::private_root_lifecycle_execution_evidence(
            self.root_id,
            self.renderer.renderer_id,
            "update",
            "create().update",
            execution.record_id(),
            execution.status(),
            output.scheduled_update_sequence(),
            self.lifecycle,
            execution.scheduled_update_kind(),
            execution.host_output_update_kind(),
            shape,
            Some(output.previous_snapshot().clone()),
            current_snapshot,
            Some(element_type),
            Some(props),
            Some(output.placed_text_snapshot().text().to_owned()),
            None,
            0,
            output.host_parent_placement_apply_count(),
        ))
    }

    pub fn describe_private_root_unmount_lifecycle_execution_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
        execution: TestRendererUnmountNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateRootLifecycleExecutionEvidence, TestRendererRootError> {
        self.validate_private_root_unmount_lifecycle_execution_for_canary(output, execution)?;
        let current_snapshot = self.diagnostic_container_snapshot()?;
        let shape = Self::private_to_json_host_output_shape_from_snapshot(&current_snapshot);

        Ok(Self::private_root_lifecycle_execution_evidence(
            self.root_id,
            self.renderer.renderer_id,
            "unmount",
            "create().unmount",
            execution.diagnostic_id(),
            execution.status(),
            execution.scheduled_update_sequence(),
            self.lifecycle,
            execution.scheduled_update_kind(),
            TestRendererRootUpdateKind::Unmount,
            shape,
            Some(output.previous_snapshot().clone()),
            current_snapshot,
            None,
            None,
            None,
            Some(output.detached_instance_snapshot().clone()),
            execution.host_node_cleanup_count(),
            0,
        ))
    }

    fn validate_private_root_create_lifecycle_execution_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
        execution: TestRendererPrivateCreateNativeBridgeHostOutputHandoff,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID
            || execution.status()
                != TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS
            || execution.operation() != "create"
            || execution.public_surface() != "create()"
        {
            return Self::private_root_lifecycle_execution_record_error(
                "create",
                "source-row-identity-mismatch",
            );
        }
        if execution.root() != self.root_id || execution.renderer_id() != self.renderer.renderer_id
        {
            return Self::private_root_lifecycle_execution_record_error(
                "create",
                "source-owner-mismatch",
            );
        }
        if execution.scheduled_update_kind() != TestRendererRootUpdateKind::Create
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Create
        {
            return Self::private_root_lifecycle_execution_record_error(
                "create",
                "source-kind-mismatch",
            );
        }
        if !execution.create_route_admission_accepted()
            || !execution.host_output_handoff_accepted()
            || !execution.actual_rust_create_host_output_handoff()
            || !execution.host_output_produced_by_rust()
            || !execution.minimal_tree_host_output_consumes_root_finished_work()
            || !execution.minimal_tree_host_output_consumes_root_finished_lanes()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "create",
                "source-execution-not-accepted",
            );
        }
        if execution.public_create_behavior_available()
            || execution.public_serialization_available()
            || execution.public_test_instance_available()
            || execution.native_addon_loaded()
            || execution.native_bridge_available()
            || execution.native_execution()
            || execution.rust_execution_from_js()
            || execution.host_output_produced_from_js()
            || execution.compatibility_claimed()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "create",
                "public-native-js-compatibility-claim",
            );
        }
        if output.render().root() != self.root_id || output.commit().root() != self.root_id {
            return Self::private_root_lifecycle_execution_record_error(
                "create",
                "host-output-root-mismatch",
            );
        }
        if execution.scheduled_element() != output.render().resulting_element() {
            return Self::private_root_lifecycle_execution_record_error(
                "create",
                "scheduled-element-mismatch",
            );
        }
        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Self::private_root_lifecycle_execution_record_error(
                "create",
                "executed-snapshot-stale",
            );
        }
        let shape = Self::private_to_json_host_output_shape_from_snapshot(output.snapshot());
        if shape.shape() != TestRendererPrivateToJsonHostOutputShape::SingleHostText
            || shape.shape() != execution.host_output_shape()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "create",
                "executed-snapshot-shape-mismatch",
            );
        }

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
        if execution.render_finished_work() != fiber_handle!(output.render().finished_work())
            || execution.commit_current() != fiber_handle!(output.commit().current())
            || execution.render_lanes_bits() == 0
            || execution.render_lanes_bits() != output.render().render_lanes().bits()
            || execution.commit_finished_lanes_bits() != output.commit().finished_lanes().bits()
            || !execution.commit_current_matches_render_finished_work()
            || !execution.commit_lanes_match_render_lanes()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "create",
                "host-output-handoff-mismatch",
            );
        }

        Ok(())
    }

    fn validate_private_root_update_lifecycle_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
            || execution.status() != TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
            || execution.route_dependency_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID
            || execution.update_route_admission_id()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "source-row-identity-mismatch",
            );
        }
        if execution.root() != self.root_id || execution.renderer_id() != self.renderer.renderer_id
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "source-owner-mismatch",
            );
        }
        if execution.lifecycle() != self.lifecycle
            || execution.lifecycle() != TestRendererRootLifecycle::Active
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Update
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "source-kind-or-lifecycle-mismatch",
            );
        }
        if output.scheduled_update_sequence() != self.scheduled_updates.len() {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "source-update-sequence-stale",
            );
        }
        if !execution.update_route_admission_accepted()
            || !execution.lifecycle_evidence_accepted()
            || !execution.root_work_loop_handoff_accepted()
            || !execution.host_output_handoff_accepted()
            || !execution.text_update_apply_recorded()
            || execution.host_text_update_apply_count() == 0
            || !execution.rust_execution_from_js()
            || !execution.reconciler_execution_from_js()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "source-execution-not-accepted",
            );
        }
        if execution.public_update_compatibility_claimed()
            || execution.public_serialization_available()
            || execution.act_flushing_claimed()
            || execution.native_bridge_available()
            || execution.native_execution()
            || execution.compatibility_claimed()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "public-native-js-act-compatibility-claim",
            );
        }
        if output.render().root() != self.root_id || output.commit().root() != self.root_id {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "host-output-root-mismatch",
            );
        }
        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "executed-snapshot-stale",
            );
        }
        let shape = Self::private_to_json_host_output_shape_from_snapshot(output.snapshot());
        if shape.shape() != TestRendererPrivateToJsonHostOutputShape::SingleHostText {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "executed-snapshot-shape-mismatch",
            );
        }

        Ok(())
    }

    fn validate_private_root_multi_child_host_text_lifecycle_execution_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<(), TestRendererRootError> {
        if execution.record_id() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
            || execution.status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
            || execution.public_surface() != "create().update"
            || execution.request_api() != "TestRendererRoot::update"
            || execution.source_diagnostic_name()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME
            || execution.source_diagnostic_status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "source-row-identity-mismatch",
            );
        }
        if execution.root() != self.root_id || execution.renderer_id() != self.renderer.renderer_id
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "source-owner-mismatch",
            );
        }
        if execution.lifecycle() != self.lifecycle
            || execution.lifecycle() != TestRendererRootLifecycle::Active
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Update
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "source-kind-or-lifecycle-mismatch",
            );
        }
        if output.scheduled_update_sequence() != self.scheduled_updates.len()
            || execution.scheduled_update_sequence() != output.scheduled_update_sequence()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "source-update-sequence-stale",
            );
        }
        if !execution.consumes_accepted_host_root_update_queue_metadata()
            || !execution.consumes_accepted_root_work_loop_metadata()
            || !execution.consumes_accepted_host_output_metadata()
            || !execution.rejects_stale_root_lifecycle()
            || !execution.rejects_stale_host_output()
            || !execution.rejects_missing_update_queue_evidence()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "source-execution-not-accepted",
            );
        }
        if execution.public_root_update_available()
            || execution.public_serialization_available()
            || execution.native_execution_available()
            || execution.compatibility_claimed()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "public-native-js-act-compatibility-claim",
            );
        }

        self.validate_private_multi_child_host_text_output_for_canary(output)?;
        let shape = Self::private_to_json_host_output_shape_from_snapshot(output.snapshot());
        if shape.shape() != TestRendererPrivateToJsonHostOutputShape::MultiChildHostText {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "executed-snapshot-shape-mismatch",
            );
        }

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

        let render = output.render();
        let commit = output.commit();
        if execution.render_current() != fiber_handle!(render.current())
            || execution.render_finished_work() != fiber_handle!(render.finished_work())
            || execution.commit_previous_current() != fiber_handle!(commit.previous_current())
            || execution.commit_current() != fiber_handle!(commit.current())
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "host-output-handoff-mismatch",
            );
        }
        if execution.render_lanes_bits() == 0
            || execution.render_lanes_bits() != render.render_lanes().bits()
            || execution.commit_finished_lanes_bits() != commit.finished_lanes().bits()
            || render.render_lanes().bits() != commit.finished_lanes().bits()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "update",
                "host-output-lane-mismatch",
            );
        }

        Ok(())
    }

    fn validate_private_root_unmount_lifecycle_execution_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
        execution: TestRendererUnmountNativeBridgeAdmission,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
            || execution.status() != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS
            || execution.route_dependency_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
            || execution.deletion_commit_handoff_id()
                != TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
            || execution.cleanup_handoff_id()
                != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID
        {
            return Self::private_root_lifecycle_execution_record_error(
                "unmount",
                "source-row-identity-mismatch",
            );
        }
        if execution.root() != self.root_id || execution.renderer_id() != self.renderer.renderer_id
        {
            return Self::private_root_lifecycle_execution_record_error(
                "unmount",
                "source-owner-mismatch",
            );
        }
        if execution.lifecycle() != self.lifecycle
            || execution.lifecycle() != TestRendererRootLifecycle::UnmountScheduled
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Unmount
            || !execution.scheduled_element_is_none()
            || execution.scheduled_update_sequence() != self.scheduled_updates.len()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "unmount",
                "source-kind-sequence-or-lifecycle-mismatch",
            );
        }
        if !execution.deletion_commit_handoff_accepted()
            || !execution.cleanup_handoff_accepted()
            || !execution.lifecycle_evidence_accepted()
            || !execution.cleanup_blockers_accepted()
            || !execution.passive_ref_cleanup_order_accepted()
            || !execution.rust_unmount_cleanup_handoff_executed()
            || !execution.host_output_produced()
            || execution.host_node_cleanup_count() == 0
        {
            return Self::private_root_lifecycle_execution_record_error(
                "unmount",
                "source-execution-not-accepted",
            );
        }
        if execution.public_unmount_compatibility_claimed()
            || execution.public_host_teardown_compatibility_claimed()
            || execution.act_flushing_claimed()
            || execution.native_bridge_available()
            || execution.native_execution()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "unmount",
                "public-native-js-act-compatibility-claim",
            );
        }
        if output.render().root() != self.root_id || output.commit().root() != self.root_id {
            return Self::private_root_lifecycle_execution_record_error(
                "unmount",
                "host-output-root-mismatch",
            );
        }
        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Self::private_root_lifecycle_execution_record_error(
                "unmount",
                "executed-snapshot-stale",
            );
        }
        let shape = Self::private_to_json_host_output_shape_from_snapshot(output.snapshot());
        if shape.shape() != TestRendererPrivateToJsonHostOutputShape::EmptyRoot
            || !output.snapshot().children().is_empty()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "unmount",
                "executed-snapshot-shape-mismatch",
            );
        }
        if !output.detached_instance_snapshot().is_detached()
            || !output.detached_instance_snapshot().children().is_empty()
        {
            return Self::private_root_lifecycle_execution_record_error(
                "unmount",
                "detached-host-output-mismatch",
            );
        }

        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    fn private_root_lifecycle_execution_evidence(
        root: FiberRootId,
        renderer_id: TestRendererId,
        operation: &'static str,
        public_surface: &'static str,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        scheduled_update_sequence: usize,
        lifecycle: TestRendererRootLifecycle,
        scheduled_update_kind: TestRendererRootUpdateKind,
        host_output_update_kind: TestRendererRootUpdateKind,
        shape: TestRendererPrivateToJsonHostOutputShapeDiagnostics,
        previous_snapshot: Option<TestContainerSnapshot>,
        snapshot: TestContainerSnapshot,
        executed_element_type: Option<TestElementType>,
        executed_props: Option<TestProps>,
        executed_text: Option<String>,
        detached_instance_snapshot: Option<TestElementSnapshot>,
        host_node_cleanup_count: usize,
        host_update_apply_count: usize,
    ) -> TestRendererPrivateRootLifecycleExecutionEvidence {
        let previous_root_child_count = previous_snapshot
            .as_ref()
            .map_or(0, |snapshot| snapshot.children().len());
        TestRendererPrivateRootLifecycleExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_STATUS,
            root,
            renderer_id,
            operation,
            public_surface,
            source_execution_record_id,
            source_execution_status,
            scheduled_update_sequence,
            lifecycle,
            scheduled_update_kind,
            host_output_update_kind,
            host_output_shape: shape.shape(),
            previous_snapshot,
            root_child_count: snapshot.children().len(),
            previous_root_child_count,
            host_component_count: shape.host_component_count(),
            host_text_count: shape.host_text_count(),
            snapshot,
            executed_element_type,
            executed_props,
            executed_text,
            detached_instance_snapshot,
            host_node_cleanup_count,
            host_update_apply_count,
            source_renderer_owner_accepted: true,
            source_lifecycle_row_accepted: true,
            source_reconciler_host_execution_consumed: true,
            snapshot_produced_from_executed_state: true,
            host_output_snapshot_current: true,
            public_root_available: false,
            public_serialization_available: false,
            public_test_instance_available: false,
            public_act_available: false,
            public_scheduler_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            js_package_available: false,
            compatibility_claimed: false,
            public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers::blocked(),
        }
    }

    fn private_root_lifecycle_single_host_text_snapshot(
        snapshot: &TestContainerSnapshot,
        operation: &'static str,
    ) -> Result<(TestElementType, TestProps, String), TestRendererRootError> {
        let shape = Self::private_to_json_host_output_shape_from_snapshot(snapshot);
        if shape.shape() != TestRendererPrivateToJsonHostOutputShape::SingleHostText {
            return Self::private_root_lifecycle_execution_record_error(
                operation,
                "executed-snapshot-shape-mismatch",
            );
        }
        let [TestNodeSnapshot::Element(element)] = snapshot.children() else {
            return Self::private_root_lifecycle_execution_record_error(
                operation,
                "executed-snapshot-shape-mismatch",
            );
        };
        if element.is_hidden() || element.is_detached() {
            return Self::private_root_lifecycle_execution_record_error(
                operation,
                "executed-snapshot-detached-or-hidden",
            );
        }
        let [TestNodeSnapshot::Text(text)] = element.children() else {
            return Self::private_root_lifecycle_execution_record_error(
                operation,
                "executed-snapshot-shape-mismatch",
            );
        };
        if text.is_hidden() {
            return Self::private_root_lifecycle_execution_record_error(
                operation,
                "executed-snapshot-detached-or-hidden",
            );
        }
        Ok((
            element.element_type().clone(),
            element.props().clone(),
            text.text().to_owned(),
        ))
    }

    fn private_root_lifecycle_execution_record_error<T>(
        operation: &'static str,
        reason: &'static str,
    ) -> Result<T, TestRendererRootError> {
        Err(
            TestRendererPrivateRootLifecycleExecutionError::LifecycleExecutionRecordMismatch {
                operation,
                reason,
            }
            .into(),
        )
    }

    pub fn describe_private_to_json_facade_result_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateToJsonFacadeResult, TestRendererRootError> {
        let report = self.describe_private_json_serialization_for_canary(output)?;
        Self::private_to_json_facade_result_from_report(&report)
    }

    pub fn describe_private_to_json_facade_result_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateToJsonFacadeResult, TestRendererRootError> {
        let report = self.describe_private_json_serialization_after_update_for_canary(output)?;
        Self::private_to_json_facade_result_from_report(&report)
    }

    pub fn describe_private_to_json_after_create_native_execution_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
        execution: TestRendererPrivateCreateRouteAdmissionDiagnostics,
        identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_json_create_native_execution_record_for_canary(execution)?;
        let result = self.describe_private_to_json_facade_result_for_canary(output)?;
        self.validate_private_serialization_finished_work_identity_for_native_execution(
            "create().toJSON",
            TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
            result.host_output_update_kind(),
            true,
            false,
            identity,
        )
        .map_err(|reason| {
            TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                operation: "create",
                reason,
            }
        })?;

        self.private_to_json_native_execution_evidence_from_facade_result(
            "create",
            "create().toJSON",
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS,
            true,
            false,
            false,
            &result,
        )
    }

    pub fn describe_private_to_json_after_update_native_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
        identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_json_update_native_execution_record_for_canary(execution)?;
        let result = self.describe_private_to_json_facade_result_after_update_for_canary(output)?;
        let identity = self
            .validate_private_serialization_finished_work_identity_for_native_execution(
                "create().toJSON",
                TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
                result.host_output_update_kind(),
                true,
                false,
                identity,
            )
            .map_err(|reason| {
                TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                    operation: "update",
                    reason,
                }
            })?;
        self.validate_private_update_native_execution_matches_handoff_for_canary(
            output, execution, identity,
        )
        .map_err(|reason| {
            TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                operation: "update",
                reason,
            }
        })?;

        self.private_to_json_native_execution_evidence_from_facade_result(
            "update",
            "create().update -> create().toJSON",
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            false,
            true,
            false,
            &result,
        )
    }

    pub fn describe_private_to_json_after_nested_update_native_execution_for_canary(
        &self,
        output: &TestRendererNestedHostParentPlacedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
        identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_json_update_native_execution_record_for_canary(execution)?;
        let row = self.describe_private_to_json_nested_host_output_update_row_for_canary(output)?;
        let identity = self
            .validate_private_serialization_finished_work_identity_for_native_execution(
                "create().toJSON",
                TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
                row.host_output_update_kind(),
                true,
                false,
                identity,
            )
            .map_err(|reason| {
                TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                    operation: "update",
                    reason,
                }
            })?;
        self.validate_private_nested_update_native_execution_matches_handoff_for_canary(
            output, execution, identity,
        )
        .map_err(|reason| {
            TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                operation: "update",
                reason,
            }
        })?;
        if output.host_parent_placement_apply_count() == 0
            || !output
                .commit()
                .has_test_only_host_parent_placement_apply_for_canary(
                    output.nested_parent_state_node_raw(),
                    output.placed_text_state_node_raw(),
                )
        {
            return self.private_to_json_native_execution_record_error(
                "update",
                "nested-host-output-placement-evidence-missing",
            );
        }

        self.private_to_json_native_execution_evidence_from_host_output_row(
            "update",
            "create().update -> create().toJSON",
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            false,
            true,
            false,
            row,
            output.snapshot(),
        )
    }

    pub fn describe_private_to_json_after_sibling_text_update_native_execution_for_canary(
        &self,
        output: &TestRendererSiblingTextHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
        identity: Option<TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_json_update_native_execution_record_for_canary(execution)?;
        let row = self.describe_private_to_json_sibling_text_host_output_row_for_canary(output)?;
        let identity = self
            .validate_private_to_json_sibling_text_native_execution_identity_for_canary(
                output, execution, identity,
            )
            .map_err(|reason| {
                TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                    operation: "update",
                    reason,
                }
            })?;

        let mut evidence = self.private_to_json_native_execution_evidence_from_host_output_row(
            "update",
            "create().update -> create().toJSON",
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            false,
            true,
            false,
            row,
            output.snapshot(),
        )?;
        evidence.source_finished_work_identity_diagnostic_name = Some(identity.diagnostic_name());
        evidence.consumes_private_sibling_text_finished_work_identity_gate = true;
        Ok(evidence)
    }

    pub fn describe_private_to_json_after_multi_child_host_text_update_native_execution_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
        lifecycle: &TestRendererPrivateRootLifecycleExecutionEvidence,
        identity: Option<TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_json_update_native_execution_record_for_canary(execution)?;
        let row =
            self.describe_private_to_json_multi_child_host_text_output_row_for_canary(output)?;
        let identity = self
            .validate_private_to_json_multi_child_host_text_native_execution_identity_for_canary(
                output, execution, lifecycle, identity,
            )
            .map_err(|reason| {
                TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                    operation: "update",
                    reason,
                }
            })?;

        let mut evidence = self.private_to_json_native_execution_evidence_from_host_output_row(
            "update",
            "create().update -> create().toJSON",
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            false,
            true,
            false,
            row,
            output.snapshot(),
        )?;
        evidence.source_finished_work_identity_diagnostic_name = Some(identity.diagnostic_name());
        evidence.source_lifecycle_execution_diagnostic_name = Some(lifecycle.diagnostic_name());
        evidence.source_lifecycle_execution_status = Some(lifecycle.status());
        evidence.consumes_private_root_lifecycle_execution = true;
        Ok(evidence)
    }

    pub fn describe_private_to_json_sibling_text_update_native_execution_from_snapshot_for_diagnostics(
        &self,
        previous_snapshot: &TestContainerSnapshot,
        current_snapshot: &TestContainerSnapshot,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        let blocker = self
            .describe_private_to_json_sibling_text_snapshot_finished_work_identity_blocker_for_diagnostics(
                previous_snapshot,
                current_snapshot,
                execution,
                None,
            )?;
        let row = blocker.host_output_row();

        self.private_to_json_native_execution_evidence_from_host_output_row(
            "update",
            "create().update -> create().toJSON",
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            false,
            true,
            false,
            row,
            current_snapshot,
        )
    }

    pub fn describe_private_to_json_sibling_text_snapshot_finished_work_identity_blocker_for_diagnostics(
        &self,
        previous_snapshot: &TestContainerSnapshot,
        current_snapshot: &TestContainerSnapshot,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
        identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
    ) -> Result<
        TestRendererPrivateToJsonSiblingSnapshotFinishedWorkIdentityBlocker,
        TestRendererRootError,
    > {
        self.validate_private_to_json_update_native_execution_record_for_canary(execution)?;
        let row =
            Self::describe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics(
                previous_snapshot,
                current_snapshot,
            )?;
        let shape = Self::private_to_json_host_output_shape_from_snapshot(current_snapshot);
        if !Self::private_to_json_native_execution_shape_is_accepted(row, shape) {
            return self.private_to_json_native_execution_record_error(
                "update",
                "sibling-snapshot-host-output-shape-missing",
            );
        }

        let actual_current = self.store.root(self.root_id)?.current();
        let actual_current = TestRendererFiberHandleDiagnostics {
            arena_id: actual_current.arena_id().get(),
            slot: actual_current.slot().get(),
            generation: actual_current.generation().get(),
        };

        let candidate_identity_diagnostic_name =
            identity.map(|identity| identity.diagnostic_name());
        let candidate_identity_status = identity.map(|identity| identity.status());
        let candidate_identity_root_matches =
            identity.is_some_and(|identity| identity.root() == self.root_id);
        let candidate_identity_update_sequence_matches_root = identity.is_some_and(|identity| {
            identity.root_scheduled_update_sequence() == self.scheduled_updates.len()
        });
        let candidate_identity_update_to_json_surface =
            identity.is_some_and(|identity| identity.public_surface() == "create().toJSON");
        let candidate_identity_source_report_matches_to_json = identity.is_some_and(|identity| {
            identity.source_serialization_diagnostic_name()
                == TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
        });
        let candidate_identity_update_kind_matches = identity.is_some_and(|identity| {
            identity.host_output_update_kind() == TestRendererRootUpdateKind::Update
        });
        let candidate_identity_committed_host_root_current = identity.is_some_and(|identity| {
            identity.commit_current() == actual_current
                && identity.render_finished_work() == identity.commit_current()
                && identity.report_finished_work() == identity.commit_current()
                && identity.commit_previous_current() == identity.render_current()
                && identity.commit_current_matches_render_finished_work()
                && identity.commit_previous_current_matches_render_current()
                && identity.report_finished_work_matches_commit_current()
                && identity.committed_fiber_inspection_current_matches_commit()
                && identity.host_output_snapshot_current()
                && identity.consumes_committed_host_root_finished_work_identity()
        });
        let candidate_identity_lanes_match = identity.is_some_and(|identity| {
            identity.render_lanes_bits() != 0
                && identity.render_lanes_bits() == identity.commit_finished_lanes_bits()
                && identity.report_finished_lanes_bits() == identity.commit_finished_lanes_bits()
                && identity.commit_remaining_lanes_bits() == 0
                && identity.commit_pending_lanes_bits() == 0
                && identity.commit_lanes_match_render_lanes()
                && identity.report_lanes_match_commit_lanes()
                && identity.consumes_committed_host_root_finished_work_lanes()
        });
        let candidate_identity_matches_update_route_handoff = identity.is_some_and(|identity| {
            identity.render_current() == execution.render_current()
                && identity.render_finished_work() == execution.render_finished_work()
                && identity.commit_previous_current() == execution.commit_previous_current()
                && identity.commit_current() == execution.commit_current()
                && identity.render_lanes_bits() == execution.render_lanes_bits()
                && identity.commit_finished_lanes_bits() == execution.commit_finished_lanes_bits()
        });
        let candidate_identity_public_blockers_closed = identity.is_some_and(|identity| {
            !identity.public_to_json_available()
                && !identity.public_to_tree_available()
                && !identity.public_test_instance_available()
                && !identity.public_serialization_available()
                && !identity.compatibility_claimed()
        });

        let candidate_identity_plausible_for_update_to_json = identity.is_some()
            && candidate_identity_diagnostic_name
                == Some(TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME)
            && candidate_identity_status
                == Some(TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_STATUS)
            && candidate_identity_root_matches
            && candidate_identity_update_sequence_matches_root
            && candidate_identity_update_to_json_surface
            && candidate_identity_source_report_matches_to_json
            && candidate_identity_update_kind_matches
            && candidate_identity_committed_host_root_current
            && candidate_identity_lanes_match
            && candidate_identity_matches_update_route_handoff
            && candidate_identity_public_blockers_closed;

        let blocker = TestRendererPrivateToJsonSiblingSnapshotFinishedWorkIdentityBlocker {
            diagnostic_name:
                TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_STATUS,
            root: self.root_id,
            public_surface: "create().update -> create().toJSON",
            source_execution_record_id: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            source_execution_status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            host_output_row: row,
            snapshot_based_host_output_row: true,
            candidate_finished_work_identity_supplied: identity.is_some(),
            candidate_identity_diagnostic_name,
            candidate_identity_status,
            candidate_identity_root_matches,
            candidate_identity_update_sequence_matches_root,
            candidate_identity_update_to_json_surface,
            candidate_identity_source_report_matches_to_json,
            candidate_identity_update_kind_matches,
            candidate_identity_committed_host_root_current,
            candidate_identity_lanes_match,
            candidate_identity_matches_update_route_handoff,
            candidate_identity_public_blockers_closed,
            plausible_finished_work_identity_rejected:
                candidate_identity_plausible_for_update_to_json,
            committed_sibling_text_fiber_inspection_available: false,
            committed_sibling_text_report_shape_available: false,
            real_sibling_text_handoff_available: false,
            consumes_committed_host_root_finished_work_identity: false,
            consumes_committed_host_root_finished_work_lanes: false,
            identity_admission_available: false,
            rejection_reason:
                TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_REASON,
            public_to_json_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            package_compatibility_claimed: false,
        };
        Self::validate_private_to_json_sibling_snapshot_finished_work_identity_blocker_for_diagnostics(
            blocker,
        )
        .map_err(|reason| {
            TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                operation: "update",
                reason,
            }
        })?;

        Ok(blocker)
    }

    pub fn describe_private_to_json_after_unmount_native_execution_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
        execution: TestRendererUnmountNativeBridgeAdmission,
        identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_json_unmount_native_execution_record_for_canary(execution)?;
        let row = self.describe_private_to_json_host_output_unmount_row_for_canary(output)?;
        let identity = self
            .validate_private_serialization_finished_work_identity_for_native_execution(
                "create().unmount -> create().toJSON",
                TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
                row.host_output_update_kind(),
                true,
                false,
                identity,
            )
            .map_err(|reason| {
                TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                    operation: "unmount",
                    reason,
                }
            })?;
        self.validate_private_unmount_native_execution_matches_handoff_for_canary(
            output, execution, identity, row,
        )
        .map_err(|reason| {
            TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                operation: "unmount",
                reason,
            }
        })?;
        let rendered_root = Self::describe_private_to_json_host_shape_from_snapshot_for_diagnostics(
            output.snapshot(),
        );
        let minimal_tree_shape = rendered_root.is_null()
            && row.host_output_shape() == TestRendererPrivateToJsonHostOutputShape::EmptyRoot
            && row.current_root_child_count() == 0;

        Ok(TestRendererPrivateToJsonNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation: "unmount",
            public_surface: "create().unmount -> create().toJSON",
            source_execution_record_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            source_execution_status: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS,
            host_output_update_kind: TestRendererRootUpdateKind::Unmount,
            host_output_shape: row.host_output_shape(),
            host_output_row: Some(row),
            rendered_root,
            source_node_count: 0,
            root_child_count: output.snapshot().children().len(),
            consumes_accepted_native_create_execution_record: false,
            consumes_accepted_native_update_execution_record: false,
            consumes_accepted_native_unmount_execution_record: true,
            consumes_private_to_json_evidence: true,
            consumes_accepted_host_output_row: true,
            source_finished_work_identity_diagnostic_name: None,
            consumes_private_sibling_text_finished_work_identity_gate: false,
            source_lifecycle_execution_diagnostic_name: None,
            source_lifecycle_execution_status: None,
            consumes_private_root_lifecycle_execution: false,
            source_unmount_nested_source_report_admission_gate_diagnostic_name: None,
            source_unmount_nested_source_report_admission_gate_status: None,
            consumes_private_unmount_nested_source_report_admission_gate: false,
            minimal_tree_shape,
            public_to_json_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_to_json_after_unmount_nested_source_report_native_execution_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
        execution: TestRendererUnmountNativeBridgeAdmission,
        identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
        gate: Option<TestRendererPrivateUnmountNestedSourceReportAdmissionGate>,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        let Some(gate) = gate else {
            return self.private_to_json_native_execution_record_error(
                "unmount",
                TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISSING_REASON,
            );
        };
        self.validate_private_to_json_unmount_native_execution_record_for_canary(execution)?;
        let row = self.describe_private_to_json_host_output_unmount_row_for_canary(output)?;
        if let Err(reason) = self
            .validate_private_unmount_nested_source_report_gate_for_native_execution_canary(
                gate, execution, row,
            )
        {
            return self.private_to_json_native_execution_record_error("unmount", reason);
        }

        let mut evidence = self
            .describe_private_to_json_after_unmount_native_execution_for_canary(
                output, execution, identity,
            )?;
        evidence.source_unmount_nested_source_report_admission_gate_diagnostic_name =
            Some(gate.diagnostic_name());
        evidence.source_unmount_nested_source_report_admission_gate_status = Some(gate.status());
        evidence.consumes_private_unmount_nested_source_report_admission_gate = true;
        Ok(evidence)
    }

    pub fn describe_private_tree_metadata_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateTreeMetadataReport, TestRendererRootError> {
        let json_report = self.describe_private_json_serialization_for_canary(output)?;

        Ok(Self::private_tree_metadata_from_json_report(json_report))
    }

    pub fn describe_private_tree_metadata_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateTreeMetadataReport, TestRendererRootError> {
        let json_report =
            self.describe_private_json_serialization_after_update_for_canary(output)?;

        Ok(Self::private_tree_metadata_from_json_report(json_report))
    }

    pub fn describe_private_to_tree_after_create_native_execution_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
        execution: TestRendererPrivateCreateRouteAdmissionDiagnostics,
        identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_tree_create_native_execution_record_for_canary(execution)?;
        let report = self.describe_private_tree_metadata_for_canary(output)?;
        self.validate_private_serialization_finished_work_identity_for_native_execution(
            "create().toTree",
            TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
            report.host_output_update_kind(),
            false,
            true,
            identity,
        )
        .map_err(|reason| {
            TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                operation: "create",
                reason,
            }
        })?;

        self.private_to_tree_native_execution_evidence_from_tree_report(
            "create",
            "create().toTree",
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS,
            true,
            false,
            false,
            &report,
        )
    }

    pub fn describe_private_to_tree_after_update_native_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
        identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_tree_update_native_execution_record_for_canary(execution)?;
        let report = self.describe_private_tree_metadata_after_update_for_canary(output)?;
        let identity = self
            .validate_private_serialization_finished_work_identity_for_native_execution(
                "create().toTree",
                TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
                report.host_output_update_kind(),
                false,
                true,
                identity,
            )
            .map_err(|reason| {
                TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                    operation: "update",
                    reason,
                }
            })?;
        self.validate_private_update_native_execution_matches_handoff_for_canary(
            output, execution, identity,
        )
        .map_err(|reason| {
            TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                operation: "update",
                reason,
            }
        })?;

        self.private_to_tree_native_execution_evidence_from_tree_report(
            "update",
            "create().update -> create().toTree",
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            false,
            true,
            false,
            &report,
        )
    }

    pub fn describe_private_to_tree_after_sibling_text_update_native_execution_for_canary(
        &self,
        output: &TestRendererSiblingTextHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
        identity: Option<TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_tree_update_native_execution_record_for_canary(execution)?;
        let row = self.describe_private_to_json_sibling_text_host_output_row_for_canary(output)?;
        let identity = self
            .validate_private_to_json_sibling_text_native_execution_identity_for_canary(
                output, execution, identity,
            )
            .map_err(|reason| {
                TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                    operation: "update",
                    reason,
                }
            })?;

        let mut evidence = self.private_to_tree_native_execution_evidence_from_sibling_text_row(
            "update",
            "create().update -> create().toTree",
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            row,
            output.snapshot(),
        )?;
        evidence.source_finished_work_identity_diagnostic_name = Some(identity.diagnostic_name());
        evidence.consumes_private_sibling_text_finished_work_identity_gate = true;
        Ok(evidence)
    }

    pub fn describe_private_to_tree_after_multi_child_host_text_update_native_execution_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
        lifecycle: &TestRendererPrivateRootLifecycleExecutionEvidence,
        identity: Option<TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_tree_update_native_execution_record_for_canary(execution)?;
        let row =
            self.describe_private_to_json_multi_child_host_text_output_row_for_canary(output)?;
        let identity = self
            .validate_private_to_json_multi_child_host_text_native_execution_identity_for_canary(
                output, execution, lifecycle, identity,
            )
            .map_err(|reason| {
                TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                    operation: "update",
                    reason,
                }
            })?;

        let mut evidence = self
            .private_to_tree_native_execution_evidence_from_multi_child_host_text_row(
                "update",
                "create().update -> create().toTree",
                TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
                TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
                row,
                output.snapshot(),
            )?;
        evidence.source_finished_work_identity_diagnostic_name = Some(identity.diagnostic_name());
        evidence.source_lifecycle_execution_diagnostic_name = Some(lifecycle.diagnostic_name());
        evidence.source_lifecycle_execution_status = Some(lifecycle.status());
        evidence.consumes_private_root_lifecycle_execution = true;
        Ok(evidence)
    }

    pub fn describe_private_to_tree_after_unmount_native_execution_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
        execution: TestRendererUnmountNativeBridgeAdmission,
        identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_tree_unmount_native_execution_record_for_canary(execution)?;
        let row = self.describe_private_to_json_host_output_unmount_row_for_canary(output)?;
        let identity = self
            .validate_private_serialization_finished_work_identity_for_native_execution(
                "create().unmount -> create().toTree",
                TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
                row.host_output_update_kind(),
                false,
                true,
                identity,
            )
            .map_err(|reason| {
                TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                    operation: "unmount",
                    reason,
                }
            })?;
        self.validate_private_unmount_native_execution_matches_handoff_for_canary(
            output, execution, identity, row,
        )
        .map_err(|reason| {
            TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                operation: "unmount",
                reason,
            }
        })?;
        let rendered_root = Self::describe_private_to_tree_host_shape_from_snapshot_for_diagnostics(
            output.snapshot(),
        );
        let minimal_tree_shape = rendered_root.is_null()
            && row.host_output_shape() == TestRendererPrivateToJsonHostOutputShape::EmptyRoot
            && row.current_root_child_count() == 0;

        Ok(TestRendererPrivateToTreeNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation: "unmount",
            public_surface: "create().unmount -> create().toTree",
            source_execution_record_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            source_execution_status: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS,
            source_tree_diagnostic_name: TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
            host_output_update_kind: TestRendererRootUpdateKind::Unmount,
            host_output_shape: row.host_output_shape(),
            host_output_row: Some(row),
            rendered_root,
            source_fiber_count: 0,
            root_child_count: output.snapshot().children().len(),
            consumes_accepted_native_create_execution_record: false,
            consumes_accepted_native_update_execution_record: false,
            consumes_accepted_native_unmount_execution_record: true,
            consumes_private_to_tree_evidence: true,
            consumes_accepted_host_output_row: true,
            source_finished_work_identity_diagnostic_name: None,
            consumes_private_sibling_text_finished_work_identity_gate: false,
            source_lifecycle_execution_diagnostic_name: None,
            source_lifecycle_execution_status: None,
            consumes_private_root_lifecycle_execution: false,
            source_unmount_nested_source_report_admission_gate_diagnostic_name: None,
            source_unmount_nested_source_report_admission_gate_status: None,
            consumes_private_unmount_nested_source_report_admission_gate: false,
            minimal_tree_shape,
            function_component_above_host_output_shape: false,
            public_to_tree_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_to_tree_after_unmount_nested_source_report_native_execution_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
        execution: TestRendererUnmountNativeBridgeAdmission,
        identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
        gate: Option<TestRendererPrivateUnmountNestedSourceReportAdmissionGate>,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        let Some(gate) = gate else {
            return self.private_to_tree_native_execution_record_error(
                "unmount",
                TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISSING_REASON,
            );
        };
        self.validate_private_to_tree_unmount_native_execution_record_for_canary(execution)?;
        let row = self.describe_private_to_json_host_output_unmount_row_for_canary(output)?;
        if let Err(reason) = self
            .validate_private_unmount_nested_source_report_gate_for_native_execution_canary(
                gate, execution, row,
            )
        {
            return self.private_to_tree_native_execution_record_error("unmount", reason);
        }

        let mut evidence = self
            .describe_private_to_tree_after_unmount_native_execution_for_canary(
                output, execution, identity,
            )?;
        evidence.source_unmount_nested_source_report_admission_gate_diagnostic_name =
            Some(gate.diagnostic_name());
        evidence.source_unmount_nested_source_report_admission_gate_status = Some(gate.status());
        evidence.consumes_private_unmount_nested_source_report_admission_gate = true;
        Ok(evidence)
    }

    pub fn describe_private_to_json_finished_work_identity_gate_for_canary(
        &self,
        render: Option<HostRootRenderPhaseRecord>,
        commit: Option<&HostRootCommitRecord>,
        report: Option<&TestRendererPrivateJsonSerializationReport>,
    ) -> Result<TestRendererPrivateSerializationFinishedWorkIdentityGate, TestRendererRootError>
    {
        let Some(report) = report else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::MissingSerializationEvidence {
                    public_surface: "create().toJSON",
                }
                .into(),
            );
        };
        if report.host_output_shape() == TestRendererPrivateToJsonHostOutputShape::SiblingText {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "sibling-text-finished-work-identity-gate-not-implemented",
                }
                .into(),
            );
        }

        self.describe_private_serialization_finished_work_identity_gate_for_canary(
            "create().toJSON",
            TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
            report.host_output_update_kind(),
            report.host_output_snapshot_current(),
            report.public_blockers(),
            render,
            commit,
            true,
            false,
            report.gate(),
        )
    }

    pub fn describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
        &self,
        output: &TestRendererSiblingTextHostOutput,
        route: TestRendererPrivateUpdateRouteAdmissionRecord,
        report: Option<&TestRendererPrivateJsonSerializationReport>,
    ) -> Result<TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate, TestRendererRootError>
    {
        let Some(report) = report else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::MissingSerializationEvidence {
                    public_surface: "create().update -> create().toJSON",
                }
                .into(),
            );
        };

        self.validate_private_to_json_sibling_text_update_route_admission_record_for_identity(
            route,
        )?;

        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "host-output-snapshot-stale",
                }
                .into(),
            );
        }

        let row = self.describe_private_to_json_sibling_text_host_output_row_for_canary(output)?;
        self.validate_private_to_json_sibling_text_report_for_identity(output, row, report)?;

        let identity = self.describe_private_serialization_finished_work_identity_gate_for_canary(
            "create().toJSON",
            TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
            report.host_output_update_kind(),
            report.host_output_snapshot_current(),
            report.public_blockers(),
            Some(output.render()),
            Some(output.commit()),
            true,
            false,
            report.gate(),
        )?;
        self.validate_private_sibling_text_update_route_matches_handoff_for_canary(
            output, route, identity,
        )
        .map_err(|reason| {
            TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                reason,
            }
        })?;

        let gate = TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_STATUS,
            root: self.root_id,
            root_scheduled_update_sequence: output.scheduled_update_sequence(),
            public_surface: "create().update -> create().toJSON",
            source_execution_record_id: route.record_id(),
            source_execution_status: route.status(),
            source_serialization_diagnostic_name: report.diagnostic_name(),
            worker_738_report_row_id: row.id(),
            host_output_update_kind: report.host_output_update_kind(),
            host_output_shape: report.host_output_shape(),
            root_node_kind: report.root_node_kind(),
            root_child_count: report.root_child_count(),
            source_node_count: report.node_count(),
            route_render_current: route.render_current(),
            route_render_finished_work: route.render_finished_work(),
            route_commit_previous_current: route.commit_previous_current(),
            route_commit_current: route.commit_current(),
            render_current: identity.render_current(),
            render_finished_work: identity.render_finished_work(),
            commit_previous_current: identity.commit_previous_current(),
            commit_current: identity.commit_current(),
            report_finished_work: identity.report_finished_work(),
            route_render_lanes_bits: route.render_lanes_bits(),
            route_commit_finished_lanes_bits: route.commit_finished_lanes_bits(),
            render_lanes_bits: identity.render_lanes_bits(),
            commit_finished_lanes_bits: identity.commit_finished_lanes_bits(),
            report_finished_lanes_bits: identity.report_finished_lanes_bits(),
            commit_remaining_lanes_bits: identity.commit_remaining_lanes_bits(),
            commit_pending_lanes_bits: identity.commit_pending_lanes_bits(),
            route_handles_match_committed_update: true,
            route_lanes_match_committed_update: true,
            commit_current_matches_render_finished_work: identity
                .commit_current_matches_render_finished_work(),
            commit_previous_current_matches_render_current: identity
                .commit_previous_current_matches_render_current(),
            commit_lanes_match_render_lanes: identity.commit_lanes_match_render_lanes(),
            report_finished_work_matches_commit_current: identity
                .report_finished_work_matches_commit_current(),
            report_lanes_match_commit_lanes: identity.report_lanes_match_commit_lanes(),
            committed_fiber_inspection_current_matches_commit: identity
                .committed_fiber_inspection_current_matches_commit(),
            committed_sibling_text_fiber_inspection_available: true,
            committed_sibling_text_report_shape_available: true,
            committed_sibling_text_inspection_matches_output: true,
            host_output_snapshot_current: report.host_output_snapshot_current(),
            report_host_output_row_matches_output: true,
            report_root_array_source_nodes_match_current_snapshot: true,
            real_sibling_text_handoff_available: true,
            consumes_update_route_admission: true,
            consumes_sibling_text_host_output: true,
            consumes_private_to_json_evidence: true,
            consumes_worker_738_report_row: true,
            consumes_committed_host_root_finished_work_identity: identity
                .consumes_committed_host_root_finished_work_identity(),
            consumes_committed_host_root_finished_work_lanes: identity
                .consumes_committed_host_root_finished_work_lanes(),
            identity_admission_available: true,
            broad_multichild_identity_available: false,
            public_to_json_available: false,
            public_to_tree_available: false,
            public_test_instance_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_loading_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            js_facade_available: false,
            cjs_facade_available: false,
            package_compatibility_claimed: false,
            compatibility_claimed: false,
        };
        Self::validate_private_to_json_sibling_text_finished_work_identity_gate_for_canary(gate)
            .map_err(|reason| {
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason,
                }
            })?;

        Ok(gate)
    }

    pub fn describe_private_to_json_multi_child_host_text_finished_work_identity_gate_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
        route: TestRendererPrivateUpdateRouteAdmissionRecord,
        lifecycle: &TestRendererPrivateRootLifecycleExecutionEvidence,
    ) -> Result<TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate, TestRendererRootError>
    {
        self.validate_private_to_json_multi_child_host_text_update_route_admission_record_for_identity(route)?;
        self.validate_private_multi_child_host_text_lifecycle_execution_for_identity(
            output, route, lifecycle,
        )?;

        let row =
            self.describe_private_to_json_multi_child_host_text_output_row_for_canary(output)?;
        let render = output.render();
        let commit = output.commit();

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

        let render_current = fiber_handle!(render.current());
        let render_finished_work = fiber_handle!(render.finished_work());
        let commit_previous_current = fiber_handle!(commit.previous_current());
        let commit_current = fiber_handle!(commit.current());
        let child_order_matches_current_snapshot =
            Self::private_multi_child_host_text_snapshot_has_order(output.snapshot());
        let gate = TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate {
            diagnostic_name:
                TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_STATUS,
            root: self.root_id,
            renderer_id: self.renderer.renderer_id,
            root_scheduled_update_sequence: output.scheduled_update_sequence(),
            public_surface: "create().update -> create().toJSON",
            source_execution_record_id: route.record_id(),
            source_execution_status: route.status(),
            source_lifecycle_diagnostic_name: lifecycle.diagnostic_name(),
            source_lifecycle_status: lifecycle.status(),
            worker_895_report_row_id: row.id(),
            host_output_update_kind: row.host_output_update_kind(),
            host_output_shape: row.host_output_shape(),
            root_node_kind: TestRendererPrivateJsonNodeKind::HostComponent,
            child_fiber_tag_order: ["HostComponent", "HostText", "HostText"],
            root_child_count: row.current_root_child_count(),
            source_node_count: row.current_host_component_count() + row.current_host_text_count(),
            route_render_current: route.render_current(),
            route_render_finished_work: route.render_finished_work(),
            route_commit_previous_current: route.commit_previous_current(),
            route_commit_current: route.commit_current(),
            route_render_lanes_bits: route.render_lanes_bits(),
            route_commit_finished_lanes_bits: route.commit_finished_lanes_bits(),
            lifecycle_scheduled_update_sequence: lifecycle.scheduled_update_sequence(),
            lifecycle_host_output_shape: lifecycle.host_output_shape(),
            lifecycle_root_child_count: lifecycle.root_child_count(),
            lifecycle_host_component_count: lifecycle.host_component_count(),
            lifecycle_host_text_count: lifecycle.host_text_count(),
            render_current,
            render_finished_work,
            commit_previous_current,
            commit_current,
            report_finished_work: commit_current,
            render_lanes_bits: render.render_lanes().bits(),
            commit_finished_lanes_bits: commit.finished_lanes().bits(),
            report_finished_lanes_bits: commit.finished_lanes().bits(),
            commit_remaining_lanes_bits: commit.remaining_lanes().bits(),
            commit_pending_lanes_bits: commit.pending_lanes().bits(),
            route_handles_match_committed_update: route.render_current() == render_current
                && route.render_finished_work() == render_finished_work
                && route.commit_previous_current() == commit_previous_current
                && route.commit_current() == commit_current,
            route_lanes_match_committed_update: route.render_lanes_bits()
                == render.render_lanes().bits()
                && route.commit_finished_lanes_bits() == commit.finished_lanes().bits(),
            lifecycle_matches_committed_update: lifecycle.root() == self.root_id
                && lifecycle.renderer_id == self.renderer.renderer_id
                && lifecycle.scheduled_update_sequence() == output.scheduled_update_sequence()
                && lifecycle.host_output_shape()
                    == TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
                && lifecycle.root_child_count() == 1
                && lifecycle.host_component_count() == 1
                && lifecycle.host_text_count() == 2
                && lifecycle.source_owned_execution_accepted()
                && lifecycle.public_surfaces_blocked(),
            commit_current_matches_render_finished_work: commit.current() == render.finished_work(),
            commit_previous_current_matches_render_current: commit.previous_current()
                == render.current(),
            report_finished_work_matches_commit_current: true,
            report_lanes_match_commit_lanes: true,
            host_output_snapshot_current: true,
            report_host_output_row_matches_output: row.host_output_shape()
                == TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
                && row.current_root_child_count() == 1
                && row.current_host_component_count() == 1
                && row.current_host_text_count() == 2,
            child_order_matches_current_snapshot,
            host_parent_placement_apply_count: output.host_parent_placement_apply_count(),
            real_multi_child_handoff_available: output.host_parent_placement_apply_count() > 0,
            consumes_update_route_admission: true,
            consumes_root_lifecycle_execution: true,
            consumes_multi_child_host_output: true,
            consumes_committed_host_root_finished_work_identity: true,
            consumes_committed_host_root_finished_work_lanes: true,
            identity_admission_available: true,
            broad_multichild_identity_available: false,
            public_to_json_available: false,
            public_to_tree_available: false,
            public_test_instance_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_loading_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            js_facade_available: false,
            cjs_facade_available: false,
            package_compatibility_claimed: false,
            compatibility_claimed: false,
        };
        Self::validate_private_to_json_multi_child_host_text_finished_work_identity_gate_for_canary(gate)
            .map_err(|reason| {
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason,
                }
            })?;

        Ok(gate)
    }

    pub fn describe_private_direct_multi_child_host_text_row_identity_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
    ) -> Result<TestRendererPrivateDirectMultiChildHostTextRowIdentity, TestRendererRootError> {
        self.validate_private_multi_child_host_text_output_for_canary(output)?;
        let row =
            self.describe_private_to_json_multi_child_host_text_output_row_for_canary(output)?;
        let render = output.render();
        let commit = output.commit();

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

        let current = output.updated_fibers();
        let render_current = fiber_handle!(render.current());
        let render_finished_work = fiber_handle!(render.finished_work());
        let commit_previous_current = fiber_handle!(commit.previous_current());
        let commit_current = fiber_handle!(commit.current());
        let store_current = self.store.root(self.root_id)?.current();
        let store_current = fiber_handle!(store_current);
        let host_component_fiber = fiber_handle!(current.component());
        let stable_text_fiber = fiber_handle!(current.text());
        let placed_text_fiber = output.placed_text_fiber();
        let row_matches_shape = row.id()
            == TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID
            && row.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && row.host_output_shape()
                == TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            && row.current_root_child_count() == 1
            && row.current_host_component_count() == 1
            && row.current_host_text_count() == 2
            && row.current_root_text_count() == 0
            && row.current_max_host_component_depth() == 1;
        let row_owner_matches_root = render.root() == self.root_id
            && commit.root() == self.root_id
            && commit_current == store_current;
        let row_handles_match_output = render_finished_work == commit_current
            && commit_previous_current == render_current
            && host_component_fiber == fiber_handle!(current.component())
            && stable_text_fiber == fiber_handle!(current.text())
            && placed_text_fiber == output.placed_text_fiber();
        let row_lanes_match_commit = render.render_lanes().bits() != 0
            && render.render_lanes() == commit.finished_lanes()
            && commit.remaining_lanes().bits() == 0
            && commit.pending_lanes().bits() == 0;
        let public_native_package_js_surfaces_blocked = row.public_blockers().all_blocked()
            && row.dependency_diagnostics().public_surfaces_blocked();

        let row_identity = TestRendererPrivateDirectMultiChildHostTextRowIdentity {
            diagnostic_name:
                TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_STATUS,
            root: self.root_id,
            renderer_id: self.renderer.renderer_id,
            root_scheduled_update_sequence: output.scheduled_update_sequence(),
            public_surface: "create().update -> create().toJSON",
            host_output_row: row,
            render_current,
            render_finished_work,
            commit_previous_current,
            commit_current,
            store_current,
            host_component_fiber,
            stable_text_fiber,
            placed_text_fiber,
            render_lanes_bits: render.render_lanes().bits(),
            commit_finished_lanes_bits: commit.finished_lanes().bits(),
            commit_remaining_lanes_bits: commit.remaining_lanes().bits(),
            commit_pending_lanes_bits: commit.pending_lanes().bits(),
            row_matches_shape,
            row_owner_matches_root,
            row_handles_match_output,
            row_lanes_match_commit,
            public_native_package_js_surfaces_blocked,
        };
        self.validate_private_direct_multi_child_host_text_row_identity_for_canary(
            output,
            row_identity,
            row,
        )?;

        Ok(row_identity)
    }

    pub fn describe_private_direct_multi_child_host_text_reconciler_inspection_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
    ) -> Result<
        TestRendererPrivateDirectMultiChildHostTextReconcilerInspectionEvidence,
        TestRendererRootError,
    > {
        let evidence = self
            .private_direct_multi_child_host_text_reconciler_inspection_evidence_for_canary(
                output,
            )?;
        self.validate_private_direct_multi_child_host_text_reconciler_inspection_for_canary(
            output, evidence,
        )?;

        Ok(evidence)
    }

    pub fn describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
        route: Option<TestRendererPrivateUpdateRouteAdmissionRecord>,
        lifecycle: Option<&TestRendererPrivateRootLifecycleExecutionEvidence>,
        identity: Option<TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate>,
        row_identity: Option<TestRendererPrivateDirectMultiChildHostTextRowIdentity>,
        reconciler_inspection: Option<
            TestRendererPrivateDirectMultiChildHostTextReconcilerInspectionEvidence,
        >,
    ) -> Result<
        TestRendererPrivateDirectMultiChildHostTextCommittedFiberInspection,
        TestRendererRootError,
    > {
        let Some(route) = route else {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-route-evidence-missing",
                ),
            );
        };
        let Some(lifecycle) = lifecycle else {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-lifecycle-evidence-missing",
                ),
            );
        };
        let Some(identity) = identity else {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-finished-work-identity-missing",
                ),
            );
        };
        let Some(row_identity) = row_identity else {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-row-identity-missing",
                ),
            );
        };
        let Some(reconciler_inspection) = reconciler_inspection else {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-reconciler-inspection-missing",
                ),
            );
        };

        let render = output.render();
        let commit = output.commit();
        if render.root() != self.root_id || commit.root() != self.root_id {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_foreign_error(
                    "direct-multi-child-host-text-cross-root-current-mismatch",
                ),
            );
        }
        if route.root() != self.root_id || route.renderer_id() != self.renderer.renderer_id {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_foreign_error(
                    "direct-multi-child-host-text-cross-root-current-mismatch",
                ),
            );
        }

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

        let store_current = self.store.root(self.root_id)?.current();
        if store_current != commit.current() {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_stale_error(
                    "direct-multi-child-host-text-current-root-mismatch",
                ),
            );
        }

        self.validate_private_to_json_multi_child_host_text_update_route_admission_record_for_identity(route)?;
        self.validate_private_multi_child_host_text_lifecycle_execution_for_identity(
            output, route, lifecycle,
        )?;
        self.validate_private_to_json_multi_child_host_text_native_execution_identity_for_canary(
            output,
            route,
            lifecycle,
            Some(identity),
        )
        .map_err(|reason| {
            TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                reason,
            }
        })?;
        self.validate_private_multi_child_host_text_output_for_canary(output)?;

        let expected_row =
            self.describe_private_to_json_multi_child_host_text_output_row_for_canary(output)?;
        self.validate_private_direct_multi_child_host_text_row_identity_for_canary(
            output,
            row_identity,
            expected_row,
        )?;
        self.validate_private_direct_multi_child_host_text_reconciler_inspection_for_canary(
            output,
            reconciler_inspection,
        )?;

        let root_node = self
            .store
            .fiber_arena()
            .get(commit.current())
            .map_err(FiberRootStoreError::from)?;
        let Some(component_fiber) = root_node.child() else {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-current-child-topology-mismatch",
                ),
            );
        };
        let component_node = self
            .store
            .fiber_arena()
            .get(component_fiber)
            .map_err(FiberRootStoreError::from)?;
        let Some(stable_text_fiber) = component_node.child() else {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-current-child-topology-mismatch",
                ),
            );
        };
        let stable_text_node = self
            .store
            .fiber_arena()
            .get(stable_text_fiber)
            .map_err(FiberRootStoreError::from)?;
        let Some(placed_text_fiber) = stable_text_node.sibling() else {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-current-child-topology-mismatch",
                ),
            );
        };
        let placed_text_node = self
            .store
            .fiber_arena()
            .get(placed_text_fiber)
            .map_err(FiberRootStoreError::from)?;

        let current = output.updated_fibers();
        let fixture = current.fixture();
        let current_child_topology_matches_output = root_node.tag().react_tag() == 3
            && component_node.tag().react_tag() == 5
            && stable_text_node.tag().react_tag() == 6
            && placed_text_node.tag().react_tag() == 6
            && root_node.return_fiber().is_none()
            && root_node.child() == Some(component_fiber)
            && root_node.sibling().is_none()
            && component_node.return_fiber() == Some(commit.current())
            && component_node.index() == 0
            && component_node.sibling().is_none()
            && component_node.child() == Some(stable_text_fiber)
            && stable_text_node.return_fiber() == Some(component_fiber)
            && stable_text_node.index() == 0
            && stable_text_node.child().is_none()
            && stable_text_node.sibling() == Some(placed_text_fiber)
            && placed_text_node.return_fiber() == Some(component_fiber)
            && placed_text_node.index() == 1
            && placed_text_node.child().is_none()
            && placed_text_node.sibling().is_none()
            && component_fiber == current.component()
            && stable_text_fiber == current.text()
            && fiber_handle!(placed_text_fiber) == output.placed_text_fiber()
            && component_node.element_type().raw() == fixture.element_type_raw()
            && component_node.pending_props().raw() == fixture.component_props_raw()
            && component_node.memoized_props().raw() == fixture.component_props_raw()
            && stable_text_node.pending_props().raw() == fixture.text_props_raw()
            && stable_text_node.memoized_props().raw() == fixture.text_props_raw()
            && placed_text_node.pending_props().raw() == output.placed_text_props_raw()
            && placed_text_node.memoized_props().raw() == output.placed_text_props_raw()
            && component_node.state_node().raw() == output.parent_state_node_raw()
            && stable_text_node.state_node().is_some()
            && placed_text_node.state_node().raw() == output.placed_text_state_node_raw();
        if !current_child_topology_matches_output {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-current-child-topology-mismatch",
                ),
            );
        }
        let reconciler_direct_current_topology_matches_output = reconciler_inspection
            .source_component_fiber()
            == fiber_handle!(component_fiber)
            && reconciler_inspection.source_stable_text_fiber() == fiber_handle!(stable_text_fiber)
            && reconciler_inspection.source_placed_text_fiber() == fiber_handle!(placed_text_fiber)
            && reconciler_inspection.inspection_store_current() == fiber_handle!(store_current);

        let placement_handoff_accepted = output.host_parent_placement_apply_count() > 0
            && commit.has_test_only_host_parent_placement_apply_for_canary(
                output.parent_state_node_raw(),
                output.placed_text_state_node_raw(),
            );
        let generic_reconciler_direct_inspection_available =
            inspect_test_renderer_committed_fiber_tree(&self.store, self.root_id).is_ok();
        let report = TestRendererPrivateDirectMultiChildHostTextCommittedFiberInspection {
            diagnostic_name:
                TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_FIBER_INSPECTION_DIAGNOSTIC_NAME,
            status:
                TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_FIBER_INSPECTION_STATUS,
            root: self.root_id,
            renderer_id: self.renderer.renderer_id,
            root_scheduled_update_sequence: output.scheduled_update_sequence(),
            public_surface: "create().update -> create().toJSON",
            source_route_record_id: route.record_id(),
            source_route_status: route.status(),
            source_lifecycle_diagnostic_name: lifecycle.diagnostic_name(),
            source_lifecycle_status: lifecycle.status(),
            source_identity_diagnostic_name: identity.diagnostic_name(),
            source_identity_status: identity.status(),
            source_row_id: row_identity.source_row_id(),
            host_output_update_kind: TestRendererRootUpdateKind::Update,
            host_output_shape: TestRendererPrivateToJsonHostOutputShape::MultiChildHostText,
            current_fiber_shape: TEST_RENDERER_PRIVATE_TREE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE,
            root_child_count: 1,
            host_component_child_count: 2,
            host_text_count: 2,
            render_current: fiber_handle!(render.current()),
            render_finished_work: fiber_handle!(render.finished_work()),
            commit_previous_current: fiber_handle!(commit.previous_current()),
            commit_current: fiber_handle!(commit.current()),
            store_current: fiber_handle!(store_current),
            host_component_fiber: fiber_handle!(component_fiber),
            stable_text_fiber: fiber_handle!(stable_text_fiber),
            placed_text_fiber: fiber_handle!(placed_text_fiber),
            stable_text_sibling: stable_text_node.sibling().map(|fiber| fiber_handle!(fiber)),
            placed_text_sibling: placed_text_node.sibling().map(|fiber| fiber_handle!(fiber)),
            host_component_element_type_raw: component_node.element_type().raw(),
            host_component_props_raw: component_node.memoized_props().raw(),
            stable_text_props_raw: stable_text_node.memoized_props().raw(),
            placed_text_props_raw: placed_text_node.memoized_props().raw(),
            host_component_state_node_raw: component_node.state_node().raw(),
            placed_text_state_node_raw: placed_text_node.state_node().raw(),
            render_lanes_bits: render.render_lanes().bits(),
            commit_finished_lanes_bits: commit.finished_lanes().bits(),
            commit_remaining_lanes_bits: commit.remaining_lanes().bits(),
            commit_pending_lanes_bits: commit.pending_lanes().bits(),
            route_evidence_accepted: true,
            lifecycle_evidence_accepted: lifecycle.source_owned_execution_accepted(),
            identity_evidence_accepted: identity.identity_admission_available(),
            row_identity_accepted: true,
            source_reconciler_inspection_diagnostic_name: reconciler_inspection.diagnostic_name(),
            source_reconciler_inspection_status: reconciler_inspection.status(),
            reconciler_direct_source_recorded: reconciler_inspection
                .source_current_topology_recorded()
                && reconciler_inspection.source_host_node_state_nodes_present(),
            reconciler_direct_inspection_accepted: reconciler_inspection
                .source_bound_reconciler_direct_inspection_accepted(),
            reconciler_direct_current_topology_matches_output,
            reconciler_direct_public_native_package_blocked: reconciler_inspection
                .public_native_package_js_surfaces_blocked(),
            current_root_matches_commit: store_current == commit.current(),
            finished_work_matches_current_root: render.finished_work() == commit.current()
                && commit.current() == store_current,
            lanes_match: render.render_lanes().bits() != 0
                && render.render_lanes() == commit.finished_lanes()
                && commit.remaining_lanes().bits() == 0
                && commit.pending_lanes().bits() == 0,
            current_child_topology_matches_output,
            placement_handoff_accepted,
            generic_reconciler_direct_inspection_available,
            broad_multichild_fiber_inspection_available: false,
            public_to_json_available: false,
            public_to_tree_available: false,
            public_test_instance_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_loading_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            js_facade_available: false,
            cjs_facade_available: false,
            package_compatibility_claimed: false,
            compatibility_claimed: false,
        };
        Self::validate_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            report,
        )
        .map_err(|reason| {
            TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                reason,
            }
        })?;

        Ok(report)
    }

    pub fn describe_private_to_json_nested_finished_work_identity_gate_for_canary(
        &self,
        output: &TestRendererNestedHostParentPlacedHostOutput,
        report: Option<&TestRendererPrivateJsonSerializationReport>,
    ) -> Result<TestRendererPrivateSerializationFinishedWorkIdentityGate, TestRendererRootError>
    {
        let Some(report) = report else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::MissingSerializationEvidence {
                    public_surface: "create().toJSON",
                }
                .into(),
            );
        };

        self.describe_private_serialization_finished_work_identity_gate_for_canary(
            "create().toJSON",
            TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
            report.host_output_update_kind(),
            report.host_output_snapshot_current(),
            report.public_blockers(),
            Some(output.render()),
            Some(output.commit()),
            true,
            false,
            report.gate(),
        )
    }

    pub fn describe_private_to_json_unmount_finished_work_identity_gate_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
        handoff: Option<&TestRendererUnmountDeletionCommitHandoffDiagnostics>,
    ) -> Result<TestRendererPrivateSerializationFinishedWorkIdentityGate, TestRendererRootError>
    {
        self.describe_private_unmount_serialization_finished_work_identity_gate_for_canary(
            "create().unmount -> create().toJSON",
            TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
            true,
            false,
            output,
            handoff,
        )
    }

    pub fn describe_private_to_tree_finished_work_identity_gate_for_canary(
        &self,
        render: Option<HostRootRenderPhaseRecord>,
        commit: Option<&HostRootCommitRecord>,
        report: Option<&TestRendererPrivateTreeMetadataReport>,
    ) -> Result<TestRendererPrivateSerializationFinishedWorkIdentityGate, TestRendererRootError>
    {
        let Some(report) = report else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::MissingSerializationEvidence {
                    public_surface: "create().toTree",
                }
                .into(),
            );
        };
        if report.host_output_shape() == TestRendererPrivateToJsonHostOutputShape::SiblingText {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "sibling-text-finished-work-identity-gate-not-implemented",
                }
                .into(),
            );
        }

        self.describe_private_serialization_finished_work_identity_gate_for_canary(
            "create().toTree",
            TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
            report.host_output_update_kind(),
            report.host_output_snapshot_current(),
            report.public_blockers(),
            render,
            commit,
            false,
            true,
            report.gate(),
        )
    }

    pub fn describe_private_to_tree_unmount_finished_work_identity_gate_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
        handoff: Option<&TestRendererUnmountDeletionCommitHandoffDiagnostics>,
    ) -> Result<TestRendererPrivateSerializationFinishedWorkIdentityGate, TestRendererRootError>
    {
        self.describe_private_unmount_serialization_finished_work_identity_gate_for_canary(
            "create().unmount -> create().toTree",
            TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
            false,
            true,
            output,
            handoff,
        )
    }

    #[allow(
        clippy::too_many_arguments,
        reason = "private pre-admission matrix intentionally joins two independent evidence streams"
    )]
    pub fn describe_private_unmount_nested_source_report_admission_gate_for_canary(
        nested_root: &Self,
        nested_output: &TestRendererNestedHostParentPlacedHostOutput,
        nested_route: TestRendererPrivateUpdateRouteAdmissionRecord,
        nested_report: Option<&TestRendererPrivateJsonSerializationReport>,
        nested_identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
        unmount_root: &Self,
        unmount_output: &TestRendererUnmountedHostOutput,
        unmount_handoff: Option<TestRendererUnmountDeletionCommitHandoffDiagnostics>,
        unmount_admission: TestRendererUnmountNativeBridgeAdmission,
        unmount_identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateUnmountNestedSourceReportAdmissionGate, TestRendererRootError>
    {
        let Some(nested_report) = nested_report else {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-missing",
            ));
        };
        let Some(nested_identity) = nested_identity else {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-finished-work-identity-missing",
            ));
        };
        let Some(unmount_handoff) = unmount_handoff else {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "unmount-deletion-commit-handoff-missing",
            ));
        };
        let Some(unmount_identity) = unmount_identity else {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "unmount-finished-work-identity-missing",
            ));
        };

        Self::validate_private_unmount_nested_source_report_nested_route_for_canary(
            nested_root,
            nested_output,
            nested_route,
        )?;
        let nested_identity = nested_root
            .validate_private_serialization_finished_work_identity_for_native_execution(
                "create().toJSON",
                TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
                TestRendererRootUpdateKind::Update,
                true,
                false,
                Some(nested_identity),
            )
            .map_err(Self::private_unmount_nested_source_report_gate_identity_error)?;
        nested_root
            .validate_private_nested_update_native_execution_matches_handoff_for_canary(
                nested_output,
                nested_route,
                nested_identity,
            )
            .map_err(Self::private_unmount_nested_source_report_gate_error)?;
        Self::validate_private_unmount_nested_source_report_ownership_for_canary(
            nested_output,
            nested_route,
            nested_report,
            nested_identity,
        )?;

        Self::validate_private_unmount_nested_source_report_unmount_admission_for_canary(
            unmount_root,
            unmount_admission,
        )?;
        let Some(scheduled_update) = unmount_root.scheduled_updates.last() else {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "unmount-route-admission-missing",
            ));
        };
        unmount_root
            .validate_private_unmount_native_bridge_handoff_for_canary(
                scheduled_update,
                unmount_handoff,
            )
            .map_err(|_| {
                Self::private_unmount_nested_source_report_gate_error(
                    "unmount-deletion-cleanup-handoff-mismatch",
                )
            })?;
        let unmount_identity = unmount_root
            .validate_private_serialization_finished_work_identity_for_native_execution(
                "create().unmount -> create().toJSON",
                TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
                TestRendererRootUpdateKind::Unmount,
                true,
                false,
                Some(unmount_identity),
            )
            .map_err(Self::private_unmount_nested_source_report_gate_identity_error)?;
        let unmount_row = unmount_root
            .describe_private_to_json_host_output_unmount_row_for_canary(unmount_output)?;
        unmount_root
            .validate_private_unmount_native_execution_matches_handoff_for_canary(
                unmount_output,
                unmount_admission,
                unmount_identity,
                unmount_row,
            )
            .map_err(Self::private_unmount_nested_source_report_gate_error)?;

        let nested_row = nested_report.host_output_row().ok_or_else(|| {
            Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-row-missing",
            )
        })?;
        let nested_inspection = nested_report.gate().fiber_inspection().ok_or_else(|| {
            Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-ownership-mismatch",
            )
        })?;
        let gate = TestRendererPrivateUnmountNestedSourceReportAdmissionGate {
            diagnostic_name:
                TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_STATUS,
            nested_root: nested_root.root_id,
            unmount_root: unmount_root.root_id,
            nested_renderer_id: nested_root.renderer.renderer_id,
            unmount_renderer_id: unmount_root.renderer.renderer_id,
            nested_route_record_id: nested_route.record_id(),
            nested_route_status: nested_route.status(),
            unmount_admission_record_id: unmount_admission.diagnostic_id(),
            unmount_admission_status: unmount_admission.status(),
            nested_identity_diagnostic_name: nested_identity.diagnostic_name(),
            nested_identity_public_surface: nested_identity.public_surface(),
            nested_identity_source_serialization_diagnostic_name: nested_identity
                .source_serialization_diagnostic_name(),
            unmount_identity_diagnostic_name: unmount_identity.diagnostic_name(),
            unmount_identity_public_surface: unmount_identity.public_surface(),
            unmount_identity_source_serialization_diagnostic_name: unmount_identity
                .source_serialization_diagnostic_name(),
            nested_source_report_diagnostic_name: nested_report.diagnostic_name(),
            nested_host_output_row_id: nested_row.id(),
            unmount_host_output_row_id: unmount_row.id(),
            nested_scheduled_update_sequence: nested_identity.root_scheduled_update_sequence(),
            unmount_scheduled_update_sequence: unmount_identity.root_scheduled_update_sequence(),
            nested_host_output_shape: nested_report.host_output_shape(),
            unmount_host_output_shape: unmount_row.host_output_shape(),
            nested_source_node_count: nested_report.node_count(),
            nested_host_component_count: nested_inspection.host_components().len(),
            nested_host_text_count: nested_inspection.host_texts().len(),
            unmount_host_node_cleanup_count: unmount_handoff.host_node_cleanup_count(),
            unmount_cleanup_order_record_count: unmount_handoff.cleanup_order_record_count(),
            nested_identity_accepted: true,
            unmount_identity_accepted: true,
            nested_route_admission_accepted: true,
            unmount_route_admission_accepted: true,
            nested_committed_source_report_ownership_accepted: true,
            unmount_deletion_cleanup_metadata_accepted: true,
            consumes_worker_736_nested_source_report_identity: true,
            consumes_worker_733_unmount_identity: true,
            broad_multichild_identity_available: false,
            public_to_json_available: false,
            public_to_tree_available: false,
            public_test_instance_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_loading_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            js_facade_available: false,
            cjs_facade_available: false,
            package_compatibility_claimed: false,
            compatibility_claimed: false,
        };
        Self::validate_private_unmount_nested_source_report_admission_gate_for_canary(gate)
            .map_err(Self::private_unmount_nested_source_report_gate_error)?;

        Ok(gate)
    }

    pub fn describe_private_tree_committed_fiber_inspection_for_canary(
        &self,
        commit: &HostRootCommitRecord,
    ) -> Result<TestRendererPrivateTreeCommittedFiberInspectionReport, TestRendererRootError> {
        let inspection = self.describe_committed_fiber_tree_for_canary(commit)?;

        Ok(Self::private_tree_committed_fiber_inspection_from_report(
            &inspection,
        ))
    }

    pub fn describe_private_test_instance_find_all_query_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceFindAllQueryDiagnostics, TestRendererRootError> {
        let tree_report = self.describe_private_tree_metadata_for_canary(output)?;

        Ok(Self::private_test_instance_find_all_query_from_tree_report(
            &tree_report,
        ))
    }

    pub fn describe_private_test_instance_find_all_query_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceFindAllQueryDiagnostics, TestRendererRootError> {
        let tree_report = self.describe_private_tree_metadata_after_update_for_canary(output)?;

        Ok(Self::private_test_instance_find_all_query_from_tree_report(
            &tree_report,
        ))
    }

    pub fn describe_private_test_instance_find_by_query_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceFindByQueryDiagnostics, TestRendererRootError> {
        let find_all_report =
            self.describe_private_test_instance_find_all_query_for_canary(output)?;

        Ok(Self::private_test_instance_find_by_query_from_find_all_report(&find_all_report))
    }

    pub fn describe_private_test_instance_find_by_query_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceFindByQueryDiagnostics, TestRendererRootError> {
        let find_all_report =
            self.describe_private_test_instance_find_all_query_after_update_for_canary(output)?;

        Ok(Self::private_test_instance_find_by_query_from_find_all_report(&find_all_report))
    }

    pub fn describe_private_test_instance_query_bridge_preflight_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics, TestRendererRootError>
    {
        let find_all_report =
            self.describe_private_test_instance_find_all_query_for_canary(output)?;
        let find_by_report =
            Self::private_test_instance_find_by_query_from_find_all_report(&find_all_report);

        Ok(
            Self::private_test_instance_query_bridge_preflight_from_query_reports(
                &find_all_report,
                &find_by_report,
            ),
        )
    }

    pub fn describe_private_test_instance_query_bridge_preflight_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics, TestRendererRootError>
    {
        let find_all_report =
            self.describe_private_test_instance_find_all_query_after_update_for_canary(output)?;
        let find_by_report =
            Self::private_test_instance_find_by_query_from_find_all_report(&find_all_report);

        Ok(
            Self::private_test_instance_query_bridge_preflight_from_query_reports(
                &find_all_report,
                &find_by_report,
            ),
        )
    }

    pub fn describe_private_test_instance_query_after_create_native_execution_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
        execution: TestRendererPrivateCreateNativeBridgeHostOutputHandoff,
    ) -> Result<TestRendererPrivateTestInstanceNativeQueryExecutionEvidence, TestRendererRootError>
    {
        self.validate_private_test_instance_create_native_execution_record_for_canary(execution)?;
        let preflight =
            self.describe_private_test_instance_query_bridge_preflight_for_canary(output)?;
        let find_by = self.describe_private_test_instance_find_by_query_for_canary(output)?;

        self.private_test_instance_native_query_execution_evidence_from_reports(
            "create",
            "create().root/ReactTestInstance.findByType",
            TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID,
            TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS,
            TestRendererRootUpdateKind::Create,
            true,
            false,
            &preflight,
            &find_by,
        )
    }

    pub fn describe_private_test_instance_query_after_update_native_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateTestInstanceNativeQueryExecutionEvidence, TestRendererRootError>
    {
        self.validate_private_test_instance_update_native_execution_record_for_canary(execution)?;
        let preflight = self
            .describe_private_test_instance_query_bridge_preflight_after_update_for_canary(
                output,
            )?;
        let find_by =
            self.describe_private_test_instance_find_by_query_after_update_for_canary(output)?;

        self.private_test_instance_native_query_execution_evidence_from_reports(
            "update",
            "create().update -> create().root/ReactTestInstance.findByType",
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS,
            TestRendererRootUpdateKind::Update,
            false,
            true,
            &preflight,
            &find_by,
        )
    }

    pub fn describe_private_test_instance_class_root_query_after_update_native_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence, TestRendererRootError>
    {
        self.validate_private_test_instance_update_native_execution_record_for_canary(execution)?;
        let preflight = self
            .describe_private_test_instance_query_bridge_preflight_after_update_for_canary(
                output,
            )?;
        let find_by =
            self.describe_private_test_instance_find_by_query_after_update_for_canary(output)?;
        let class_root =
            self.describe_private_get_instance_class_root_after_update_for_canary(output)?;
        let previous_child_text = Self::first_host_component_text_from_snapshot(
            output.previous_snapshot(),
        )
        .ok_or(
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation: "update",
                reason: "updated-host-child-previous-text-missing",
            },
        )?;

        self.private_test_instance_class_root_query_execution_evidence_from_reports(
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS,
            previous_child_text,
            &preflight,
            &find_by,
            &class_root,
        )
    }

    pub fn describe_private_get_instance_class_root_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateGetInstanceClassRootReport, TestRendererRootError> {
        let tree_report = self.describe_private_tree_metadata_for_canary(output)?;

        Ok(Self::private_get_instance_class_root_from_tree_report(
            tree_report,
        ))
    }

    pub fn describe_private_get_instance_class_root_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateGetInstanceClassRootReport, TestRendererRootError> {
        let tree_report = self.describe_private_tree_metadata_after_update_for_canary(output)?;

        Ok(Self::private_get_instance_class_root_from_tree_report(
            tree_report,
        ))
    }

    fn describe_private_json_serialization_from_current_fibers_for_canary(
        &self,
        commit: &HostRootCommitRecord,
        expected_fiber_inspection: Option<&TestRendererCommittedFiberTreeInspection>,
        current_fibers: TestRendererPrivateJsonCurrentFibersForCanary,
        snapshot: &TestContainerSnapshot,
        host_output_update_kind: TestRendererRootUpdateKind,
        host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    ) -> Result<TestRendererPrivateJsonSerializationReport, TestRendererRootError> {
        let gate = self.require_serialization_gate_ready_for_canary(commit)?;
        let fiber_inspection = gate
            .fiber_inspection()
            .cloned()
            .ok_or(TestRendererPrivateJsonSerializationError::CommittedFiberInspectionMissing)?;
        if let Some(expected_fiber_inspection) = expected_fiber_inspection
            && &fiber_inspection != expected_fiber_inspection
        {
            return Err(
                TestRendererPrivateJsonSerializationError::CommittedFiberInspectionStale.into(),
            );
        }
        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *snapshot {
            return Err(TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale.into());
        }
        let host_output_shape = Self::private_to_json_host_output_shape_from_snapshot(snapshot);
        Self::validate_private_to_json_host_output_row(
            host_output_update_kind,
            host_output_row,
            Some(host_output_shape.shape()),
        )?;

        Self::validate_private_json_canary_current_fibers(&fiber_inspection, current_fibers)?;
        let component = Self::private_json_component_from_snapshot_for_shape(
            snapshot,
            host_output_shape.shape(),
        )?;
        let nodes = Self::private_json_nodes_from_component_and_fibers_for_shape(
            snapshot,
            &component,
            &fiber_inspection,
            host_output_shape.shape(),
        );
        let rendered_root = Self::private_json_rendered_root_from_snapshot_for_shape(
            snapshot,
            &component,
            host_output_shape.shape(),
        );
        let root_node_kind = if rendered_root.as_array().is_some() {
            TestRendererPrivateJsonNodeKind::RootArray
        } else {
            component.node_kind()
        };

        Ok(TestRendererPrivateJsonSerializationReport {
            diagnostic_name: TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
            gate,
            host_output_update_kind,
            host_output_shape: host_output_shape.shape(),
            host_output_row,
            host_output_snapshot_current: true,
            root_child_count: snapshot.children().len(),
            root_node_kind,
            nodes,
            rendered_root,
            component,
            public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers::blocked(),
        })
    }

    fn private_to_json_host_output_row(
        host_output_update_kind: TestRendererRootUpdateKind,
        previous_snapshot: &TestContainerSnapshot,
        current_snapshot: &TestContainerSnapshot,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        let id = match host_output_update_kind {
            TestRendererRootUpdateKind::Update => {
                TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
            }
            TestRendererRootUpdateKind::Unmount => {
                TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
            }
            TestRendererRootUpdateKind::Create => {
                return Err(
                    TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                        row_id: TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID,
                        expected: TestRendererRootUpdateKind::Update,
                        actual: TestRendererRootUpdateKind::Create,
                    }
                    .into(),
                );
            }
        };

        Self::private_to_json_host_output_row_with_shape(
            host_output_update_kind,
            id,
            None,
            previous_snapshot,
            current_snapshot,
        )
    }

    fn private_to_json_host_output_row_with_shape(
        host_output_update_kind: TestRendererRootUpdateKind,
        id: &'static str,
        expected_shape: Option<TestRendererPrivateToJsonHostOutputShape>,
        previous_snapshot: &TestContainerSnapshot,
        current_snapshot: &TestContainerSnapshot,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        let route_row_id = match host_output_update_kind {
            TestRendererRootUpdateKind::Update => {
                TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID
            }
            TestRendererRootUpdateKind::Unmount => {
                TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
            }
            TestRendererRootUpdateKind::Create => {
                return Err(
                    TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                        row_id: id,
                        expected: TestRendererRootUpdateKind::Update,
                        actual: TestRendererRootUpdateKind::Create,
                    }
                    .into(),
                );
            }
        };

        if host_output_update_kind == TestRendererRootUpdateKind::Unmount
            && !current_snapshot.children().is_empty()
        {
            return Err(
                TestRendererPrivateJsonSerializationError::UnmountSnapshotNotEmpty {
                    actual: current_snapshot.children().len(),
                }
                .into(),
            );
        }

        let previous_shape =
            Self::private_to_json_host_output_shape_from_snapshot(previous_snapshot);
        let current_shape = Self::private_to_json_host_output_shape_from_snapshot(current_snapshot);
        if let Some(expected_shape) = expected_shape
            && current_shape.shape() != expected_shape
        {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
                    row_id: id,
                    expected: expected_shape,
                    actual: current_shape.shape(),
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateToJsonHostOutputRow {
            id,
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_UNMOUNT_ROW_STATUS,
            host_output_update_kind,
            host_output_shape: current_shape.shape(),
            previous_root_child_count: previous_snapshot.children().len(),
            current_root_child_count: current_snapshot.children().len(),
            previous_host_component_count: previous_shape.host_component_count(),
            current_host_component_count: current_shape.host_component_count(),
            previous_host_text_count: previous_shape.host_text_count(),
            current_host_text_count: current_shape.host_text_count(),
            current_root_text_count: current_shape.root_text_count(),
            current_max_host_component_depth: current_shape.max_host_component_depth(),
            dependency_diagnostics: TestRendererPrivateToJsonHostOutputDependencyDiagnostics {
                route_row_id,
                serialization_row_id: TEST_RENDERER_PRIVATE_TO_JSON_SERIALIZATION_DEPENDENCY_ID,
                route_diagnostics_available: true,
                serialization_diagnostics_available: true,
                host_output_snapshot_current: true,
                public_to_json_available: false,
                public_test_instance_available: false,
                native_execution_available: false,
                compatibility_claimed: false,
            },
            public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers::blocked(),
        })
    }

    fn validate_private_to_json_host_output_row(
        expected: TestRendererRootUpdateKind,
        row: Option<TestRendererPrivateToJsonHostOutputRow>,
        expected_shape: Option<TestRendererPrivateToJsonHostOutputShape>,
    ) -> Result<(), TestRendererRootError> {
        let Some(row) = row else {
            return Ok(());
        };

        if row.host_output_update_kind() != expected {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                    row_id: row.id(),
                    expected,
                    actual: row.host_output_update_kind(),
                }
                .into(),
            );
        }

        if !Self::private_to_json_host_output_row_id_matches_kind(expected, row.id()) {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                    row_id: row.id(),
                    expected,
                    actual: row.host_output_update_kind(),
                }
                .into(),
            );
        }

        if let Some(row_id_shape) =
            Self::private_to_json_expected_host_output_shape_for_row_id(row.id())
            && row.host_output_shape() != row_id_shape
        {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
                    row_id: row.id(),
                    expected: row_id_shape,
                    actual: row.host_output_shape(),
                }
                .into(),
            );
        }

        if let Some(expected_shape) = expected_shape
            && row.host_output_shape() != expected_shape
        {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
                    row_id: row.id(),
                    expected: expected_shape,
                    actual: row.host_output_shape(),
                }
                .into(),
            );
        }

        Ok(())
    }

    fn private_to_json_host_output_row_id_matches_kind(
        expected: TestRendererRootUpdateKind,
        row_id: &str,
    ) -> bool {
        match expected {
            TestRendererRootUpdateKind::Update => matches!(
                row_id,
                TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
                    | TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID
                    | TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
                    | TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID
            ),
            TestRendererRootUpdateKind::Unmount => {
                row_id == TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
            }
            TestRendererRootUpdateKind::Create => true,
        }
    }

    fn private_to_json_expected_host_output_shape_for_row_id(
        row_id: &str,
    ) -> Option<TestRendererPrivateToJsonHostOutputShape> {
        match row_id {
            TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID => {
                Some(TestRendererPrivateToJsonHostOutputShape::SingleHostText)
            }
            TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID => {
                Some(TestRendererPrivateToJsonHostOutputShape::NestedHostText)
            }
            TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID => {
                Some(TestRendererPrivateToJsonHostOutputShape::SiblingText)
            }
            TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID => {
                Some(TestRendererPrivateToJsonHostOutputShape::MultiChildHostText)
            }
            TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID => {
                Some(TestRendererPrivateToJsonHostOutputShape::EmptyRoot)
            }
            _ => None,
        }
    }

    fn private_to_json_facade_result_from_report(
        report: &TestRendererPrivateJsonSerializationReport,
    ) -> Result<TestRendererPrivateToJsonFacadeResult, TestRendererRootError> {
        Self::validate_private_to_json_host_output_row(
            report.host_output_update_kind(),
            report.host_output_row(),
            Some(report.host_output_shape()),
        )?;
        let component = report.component();

        Ok(TestRendererPrivateToJsonFacadeResult {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME,
            source_diagnostic_name: report.diagnostic_name(),
            host_output_update_kind: report.host_output_update_kind(),
            host_output_shape: report.host_output_shape(),
            host_output_row: report.host_output_row(),
            host_output_snapshot_current: report.host_output_snapshot_current(),
            element_type: component.element_type().clone(),
            props: component.props().clone(),
            children: component
                .text_children()
                .iter()
                .map(|text| text.text().to_owned())
                .collect(),
            rendered_root: report.rendered_root().clone(),
            source_node_count: report.node_count(),
            public_blockers: report.public_blockers(),
            public_serialization_available: false,
            compatibility_claimed: false,
        })
    }

    #[allow(clippy::too_many_arguments)]
    fn private_to_json_native_execution_evidence_from_host_output_row(
        &self,
        operation: &'static str,
        public_surface: &'static str,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        consumes_create: bool,
        consumes_update: bool,
        consumes_unmount: bool,
        row: TestRendererPrivateToJsonHostOutputRow,
        snapshot: &TestContainerSnapshot,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        Self::validate_private_to_json_host_output_row(
            row.host_output_update_kind(),
            Some(row),
            Some(row.host_output_shape()),
        )?;
        let shape = Self::private_to_json_host_output_shape_from_snapshot(snapshot);
        if shape.shape() != row.host_output_shape() {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
                    row_id: row.id(),
                    expected: row.host_output_shape(),
                    actual: shape.shape(),
                }
                .into(),
            );
        }
        if row.current_root_child_count() != snapshot.children().len()
            || row.current_host_component_count() != shape.host_component_count()
            || row.current_host_text_count() != shape.host_text_count()
            || row.current_root_text_count() != shape.root_text_count()
            || row.current_max_host_component_depth() != shape.max_host_component_depth()
        {
            return self.private_to_json_native_execution_record_error(
                operation,
                "host-output-row-counts-stale",
            );
        }
        if !Self::private_to_json_native_execution_shape_is_accepted(row, shape) {
            return self.private_to_json_native_execution_record_error(
                operation,
                "accepted-host-output-row-shape-missing",
            );
        }

        let rendered_root =
            Self::describe_private_to_json_host_shape_from_snapshot_for_diagnostics(snapshot);
        let minimal_tree_shape = rendered_root.is_null()
            || Self::private_to_json_rendered_root_is_minimal_host_text(&rendered_root);

        Ok(TestRendererPrivateToJsonNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation,
            public_surface,
            source_execution_record_id,
            source_execution_status,
            host_output_update_kind: row.host_output_update_kind(),
            host_output_shape: row.host_output_shape(),
            host_output_row: Some(row),
            rendered_root,
            source_node_count: shape.host_component_count() + shape.host_text_count(),
            root_child_count: snapshot.children().len(),
            consumes_accepted_native_create_execution_record: consumes_create,
            consumes_accepted_native_update_execution_record: consumes_update,
            consumes_accepted_native_unmount_execution_record: consumes_unmount,
            consumes_private_to_json_evidence: true,
            consumes_accepted_host_output_row: true,
            source_finished_work_identity_diagnostic_name: None,
            consumes_private_sibling_text_finished_work_identity_gate: false,
            source_lifecycle_execution_diagnostic_name: None,
            source_lifecycle_execution_status: None,
            consumes_private_root_lifecycle_execution: false,
            source_unmount_nested_source_report_admission_gate_diagnostic_name: None,
            source_unmount_nested_source_report_admission_gate_status: None,
            consumes_private_unmount_nested_source_report_admission_gate: false,
            minimal_tree_shape,
            public_to_json_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    fn private_to_json_native_execution_shape_is_accepted(
        row: TestRendererPrivateToJsonHostOutputRow,
        shape: TestRendererPrivateToJsonHostOutputShapeDiagnostics,
    ) -> bool {
        match row.host_output_shape() {
            TestRendererPrivateToJsonHostOutputShape::EmptyRoot => {
                row.host_output_update_kind() == TestRendererRootUpdateKind::Unmount
                    && row.current_root_child_count() == 0
                    && shape.host_component_count() == 0
                    && shape.host_text_count() == 0
                    && shape.root_text_count() == 0
                    && shape.max_host_component_depth() == 0
            }
            TestRendererPrivateToJsonHostOutputShape::SingleHostText => {
                row.host_output_update_kind() == TestRendererRootUpdateKind::Update
                    && row.current_root_child_count() == 1
                    && shape.host_component_count() == 1
                    && shape.host_text_count() == 1
                    && shape.root_text_count() == 0
                    && shape.max_host_component_depth() == 1
            }
            TestRendererPrivateToJsonHostOutputShape::MultiChildHostText => {
                row.host_output_update_kind() == TestRendererRootUpdateKind::Update
                    && row.current_root_child_count() == 1
                    && shape.host_component_count() == 1
                    && shape.host_text_count() == 2
                    && shape.root_text_count() == 0
                    && shape.max_host_component_depth() == 1
            }
            TestRendererPrivateToJsonHostOutputShape::NestedHostText => {
                row.host_output_update_kind() == TestRendererRootUpdateKind::Update
                    && row.current_root_child_count() == 1
                    && shape.host_component_count() == 2
                    && shape.host_text_count() == 2
                    && shape.root_text_count() == 0
                    && shape.max_host_component_depth() == 2
            }
            TestRendererPrivateToJsonHostOutputShape::SiblingText => {
                row.host_output_update_kind() == TestRendererRootUpdateKind::Update
                    && row.current_root_child_count() == 2
                    && shape.host_component_count() == 1
                    && shape.host_text_count() == 2
                    && shape.root_text_count() == 1
                    && shape.max_host_component_depth() == 1
            }
        }
    }

    #[allow(
        clippy::too_many_arguments,
        reason = "private test-renderer evidence builder mirrors the native execution report shape"
    )]
    fn private_to_json_native_execution_evidence_from_facade_result(
        &self,
        operation: &'static str,
        public_surface: &'static str,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        consumes_create: bool,
        consumes_update: bool,
        consumes_unmount: bool,
        result: &TestRendererPrivateToJsonFacadeResult,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        let minimal_tree_shape = Self::private_to_json_result_is_minimal_host_text(result);
        if !minimal_tree_shape {
            return Err(
                TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                    operation,
                    reason: "minimal-host-component-with-text-shape-missing",
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateToJsonNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation,
            public_surface,
            source_execution_record_id,
            source_execution_status,
            host_output_update_kind: result.host_output_update_kind(),
            host_output_shape: result.host_output_shape(),
            host_output_row: result.host_output_row(),
            rendered_root: result.rendered_root().clone(),
            source_node_count: result.source_node_count(),
            root_child_count: 1,
            consumes_accepted_native_create_execution_record: consumes_create,
            consumes_accepted_native_update_execution_record: consumes_update,
            consumes_accepted_native_unmount_execution_record: consumes_unmount,
            consumes_private_to_json_evidence: true,
            consumes_accepted_host_output_row: result.host_output_row().is_some(),
            source_finished_work_identity_diagnostic_name: None,
            consumes_private_sibling_text_finished_work_identity_gate: false,
            source_lifecycle_execution_diagnostic_name: None,
            source_lifecycle_execution_status: None,
            consumes_private_root_lifecycle_execution: false,
            source_unmount_nested_source_report_admission_gate_diagnostic_name: None,
            source_unmount_nested_source_report_admission_gate_status: None,
            consumes_private_unmount_nested_source_report_admission_gate: false,
            minimal_tree_shape,
            public_to_json_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    fn private_to_json_result_is_minimal_host_text(
        result: &TestRendererPrivateToJsonFacadeResult,
    ) -> bool {
        let Some(component) = result.rendered_root().as_host_component() else {
            return false;
        };
        let Some(children) = component.children() else {
            return false;
        };
        result.source_node_count() == 2
            && result.child_count() == 1
            && component.child_count() == 1
            && children.len() == 1
            && children[0].as_text().is_some()
    }

    fn private_to_json_rendered_root_is_minimal_host_text(
        rendered_root: &TestRendererPrivateJsonRenderedRoot,
    ) -> bool {
        let Some(component) = rendered_root.as_host_component() else {
            return false;
        };
        let Some(children) = component.children() else {
            return false;
        };
        component.child_count() == 1 && children.len() == 1 && children[0].as_text().is_some()
    }

    #[allow(clippy::too_many_arguments)]
    fn private_to_tree_native_execution_evidence_from_tree_report(
        &self,
        operation: &'static str,
        public_surface: &'static str,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        consumes_create: bool,
        consumes_update: bool,
        consumes_unmount: bool,
        report: &TestRendererPrivateTreeMetadataReport,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        let minimal_tree_shape = Self::private_to_tree_report_is_minimal_host_text(report);
        if !minimal_tree_shape {
            return Err(
                TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                    operation,
                    reason: "minimal-host-component-with-text-shape-missing",
                }
                .into(),
            );
        }
        let function_component_above_host_output_shape =
            Self::private_to_tree_report_has_function_component_above_host_output(report);
        if !function_component_above_host_output_shape {
            return Err(
                TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                    operation,
                    reason: "function-component-above-host-output-shape-missing",
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateToTreeNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation,
            public_surface,
            source_execution_record_id,
            source_execution_status,
            source_tree_diagnostic_name: report.diagnostic_name(),
            host_output_update_kind: report.host_output_update_kind(),
            host_output_shape: report.host_output_shape(),
            host_output_row: report.host_output_row(),
            rendered_root: Self::private_to_tree_rendered_root_from_report(report),
            source_fiber_count: report.accepted_composite_fiber_shape().len(),
            root_child_count: report.root_child_count(),
            consumes_accepted_native_create_execution_record: consumes_create,
            consumes_accepted_native_update_execution_record: consumes_update,
            consumes_accepted_native_unmount_execution_record: consumes_unmount,
            consumes_private_to_tree_evidence: true,
            consumes_accepted_host_output_row: report.host_output_row().is_some(),
            source_finished_work_identity_diagnostic_name: None,
            consumes_private_sibling_text_finished_work_identity_gate: false,
            source_lifecycle_execution_diagnostic_name: None,
            source_lifecycle_execution_status: None,
            consumes_private_root_lifecycle_execution: false,
            source_unmount_nested_source_report_admission_gate_diagnostic_name: None,
            source_unmount_nested_source_report_admission_gate_status: None,
            consumes_private_unmount_nested_source_report_admission_gate: false,
            minimal_tree_shape,
            function_component_above_host_output_shape,
            public_to_tree_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    #[allow(clippy::too_many_arguments)]
    fn private_to_tree_native_execution_evidence_from_sibling_text_row(
        &self,
        operation: &'static str,
        public_surface: &'static str,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        row: TestRendererPrivateToJsonHostOutputRow,
        snapshot: &TestContainerSnapshot,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        Self::validate_private_to_json_host_output_row(
            row.host_output_update_kind(),
            Some(row),
            Some(TestRendererPrivateToJsonHostOutputShape::SiblingText),
        )?;
        let shape = Self::private_to_json_host_output_shape_from_snapshot(snapshot);
        if shape.shape() != TestRendererPrivateToJsonHostOutputShape::SiblingText
            || shape.shape() != row.host_output_shape()
        {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
                    row_id: row.id(),
                    expected: TestRendererPrivateToJsonHostOutputShape::SiblingText,
                    actual: shape.shape(),
                }
                .into(),
            );
        }
        if row.current_root_child_count() != snapshot.children().len()
            || row.current_host_component_count() != shape.host_component_count()
            || row.current_host_text_count() != shape.host_text_count()
            || row.current_root_text_count() != shape.root_text_count()
            || row.current_max_host_component_depth() != shape.max_host_component_depth()
        {
            return self.private_to_tree_native_execution_record_error(
                operation,
                "host-output-row-counts-stale",
            );
        }
        if !Self::private_to_json_native_execution_shape_is_accepted(row, shape) {
            return self.private_to_tree_native_execution_record_error(
                operation,
                "accepted-sibling-text-host-output-row-shape-missing",
            );
        }

        let rendered_root =
            Self::describe_private_to_tree_composite_above_host_shape_from_snapshot_for_diagnostics(
                snapshot,
            );
        let function_component_above_host_output_shape =
            Self::private_to_tree_rendered_root_wraps_sibling_text_output(&rendered_root);
        if !function_component_above_host_output_shape {
            return self.private_to_tree_native_execution_record_error(
                operation,
                "function-component-above-sibling-text-output-shape-missing",
            );
        }

        Ok(TestRendererPrivateToTreeNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation,
            public_surface,
            source_execution_record_id,
            source_execution_status,
            source_tree_diagnostic_name: TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
            host_output_update_kind: row.host_output_update_kind(),
            host_output_shape: row.host_output_shape(),
            host_output_row: Some(row),
            rendered_root,
            source_fiber_count:
                TEST_RENDERER_PRIVATE_TREE_COMPOSITE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE.len(),
            root_child_count: snapshot.children().len(),
            consumes_accepted_native_create_execution_record: false,
            consumes_accepted_native_update_execution_record: true,
            consumes_accepted_native_unmount_execution_record: false,
            consumes_private_to_tree_evidence: true,
            consumes_accepted_host_output_row: true,
            source_finished_work_identity_diagnostic_name: None,
            consumes_private_sibling_text_finished_work_identity_gate: false,
            source_lifecycle_execution_diagnostic_name: None,
            source_lifecycle_execution_status: None,
            consumes_private_root_lifecycle_execution: false,
            source_unmount_nested_source_report_admission_gate_diagnostic_name: None,
            source_unmount_nested_source_report_admission_gate_status: None,
            consumes_private_unmount_nested_source_report_admission_gate: false,
            minimal_tree_shape: false,
            function_component_above_host_output_shape,
            public_to_tree_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    #[allow(clippy::too_many_arguments)]
    fn private_to_tree_native_execution_evidence_from_multi_child_host_text_row(
        &self,
        operation: &'static str,
        public_surface: &'static str,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        row: TestRendererPrivateToJsonHostOutputRow,
        snapshot: &TestContainerSnapshot,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        Self::validate_private_to_json_host_output_row(
            row.host_output_update_kind(),
            Some(row),
            Some(TestRendererPrivateToJsonHostOutputShape::MultiChildHostText),
        )?;
        let shape = Self::private_to_json_host_output_shape_from_snapshot(snapshot);
        if shape.shape() != TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            || shape.shape() != row.host_output_shape()
        {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
                    row_id: row.id(),
                    expected: TestRendererPrivateToJsonHostOutputShape::MultiChildHostText,
                    actual: shape.shape(),
                }
                .into(),
            );
        }
        if row.current_root_child_count() != snapshot.children().len()
            || row.current_host_component_count() != shape.host_component_count()
            || row.current_host_text_count() != shape.host_text_count()
            || row.current_root_text_count() != shape.root_text_count()
            || row.current_max_host_component_depth() != shape.max_host_component_depth()
        {
            return self.private_to_tree_native_execution_record_error(
                operation,
                "host-output-row-counts-stale",
            );
        }
        if !Self::private_to_json_native_execution_shape_is_accepted(row, shape) {
            return self.private_to_tree_native_execution_record_error(
                operation,
                "accepted-multi-child-host-text-output-row-shape-missing",
            );
        }

        let rendered_root =
            Self::describe_private_to_tree_composite_above_host_shape_from_snapshot_for_diagnostics(
                snapshot,
            );
        let function_component_above_host_output_shape =
            Self::private_to_tree_rendered_root_wraps_multi_child_host_text_output(&rendered_root);
        if !function_component_above_host_output_shape {
            return self.private_to_tree_native_execution_record_error(
                operation,
                "function-component-above-multi-child-host-text-output-shape-missing",
            );
        }

        Ok(TestRendererPrivateToTreeNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation,
            public_surface,
            source_execution_record_id,
            source_execution_status,
            source_tree_diagnostic_name: TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
            host_output_update_kind: row.host_output_update_kind(),
            host_output_shape: row.host_output_shape(),
            host_output_row: Some(row),
            rendered_root,
            source_fiber_count:
                TEST_RENDERER_PRIVATE_TREE_COMPOSITE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE
                    .len(),
            root_child_count: snapshot.children().len(),
            consumes_accepted_native_create_execution_record: false,
            consumes_accepted_native_update_execution_record: true,
            consumes_accepted_native_unmount_execution_record: false,
            consumes_private_to_tree_evidence: true,
            consumes_accepted_host_output_row: true,
            source_finished_work_identity_diagnostic_name: None,
            consumes_private_sibling_text_finished_work_identity_gate: false,
            source_lifecycle_execution_diagnostic_name: None,
            source_lifecycle_execution_status: None,
            consumes_private_root_lifecycle_execution: false,
            source_unmount_nested_source_report_admission_gate_diagnostic_name: None,
            source_unmount_nested_source_report_admission_gate_status: None,
            consumes_private_unmount_nested_source_report_admission_gate: false,
            minimal_tree_shape: false,
            function_component_above_host_output_shape,
            public_to_tree_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    fn private_to_tree_rendered_root_from_report(
        report: &TestRendererPrivateTreeMetadataReport,
    ) -> TestRendererPrivateTreeRenderedRoot {
        let host_component = report.host_component();
        let host_text = report.host_text();
        let rendered_host = TestRendererPrivateTreeRenderedRoot::HostComponent(
            TestRendererPrivateTreeRenderedHostComponent {
                node_type: TestRendererPrivateTreeNodeType::Host,
                element_type: host_component.element_type().clone(),
                props: Self::private_json_props_without_children(host_component.props()),
                instance_available: false,
                rendered: vec![TestRendererPrivateTreeRenderedRoot::Text(
                    host_text.text().to_owned(),
                )],
            },
        );

        TestRendererPrivateTreeRenderedRoot::FunctionComponent(Box::new(
            TestRendererPrivateTreeRenderedFunctionComponent {
                node_type: TestRendererPrivateTreeNodeType::Component,
                component_type: report.function_component().component_type(),
                props: report.function_component().props().clone(),
                instance_available: false,
                rendered: Box::new(rendered_host),
                wraps_committed_host_output: true,
            },
        ))
    }

    fn private_to_tree_report_is_minimal_host_text(
        report: &TestRendererPrivateTreeMetadataReport,
    ) -> bool {
        let host_root = report.host_root();
        let function_component = report.function_component();
        let host_component = report.host_component();
        let host_text = report.host_text();

        report.source_json_diagnostic_name()
            == TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
            && report.host_output_shape()
                == TestRendererPrivateToJsonHostOutputShape::SingleHostText
            && report.root_child_count() == 1
            && report.accepted_fiber_shape() == &TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE
            && report.accepted_composite_fiber_shape()
                == &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE
            && host_root.fiber_tag() == "HostRoot"
            && host_root.delegates_to_child()
            && host_root.child_fiber_tag() == "HostComponent"
            && !host_root.public_tree_object_available()
            && function_component.fiber_tag() == "FunctionComponent"
            && function_component.node_type() == TestRendererPrivateTreeNodeType::Component
            && function_component.component_type()
                == TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
            && !function_component.instance_available()
            && function_component.rendered_child_fiber_tag() == "HostComponent"
            && function_component.rendered_child_node_type()
                == TestRendererPrivateTreeNodeType::Host
            && function_component.rendered_child_count() == 1
            && function_component.wraps_committed_host_output()
            && !function_component.public_tree_object_available()
            && host_component.fiber_tag() == "HostComponent"
            && host_component.node_type() == TestRendererPrivateTreeNodeType::Host
            && !host_component.instance_available()
            && host_component.rendered_child_count() == 1
            && !host_component.public_tree_object_available()
            && host_text.fiber_tag() == "HostText"
            && host_text.text() == host_component.rendered_text()
            && host_text.returns_text_value()
            && !host_text.public_tree_object_available()
            && !report.public_tree_object_available()
            && report.public_blockers().all_blocked()
    }

    fn private_to_tree_report_has_function_component_above_host_output(
        report: &TestRendererPrivateTreeMetadataReport,
    ) -> bool {
        let function_component = report.function_component();

        report.accepted_composite_fiber_shape()
            == &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE
            && function_component.fiber_tag() == "FunctionComponent"
            && function_component.node_type() == TestRendererPrivateTreeNodeType::Component
            && function_component.component_type()
                == TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
            && !function_component.instance_available()
            && function_component.rendered_child_fiber_tag() == "HostComponent"
            && function_component.rendered_child_node_type()
                == TestRendererPrivateTreeNodeType::Host
            && function_component.rendered_child_count() == 1
            && function_component.wraps_committed_host_output()
            && !function_component.public_tree_object_available()
            && report.host_component().fiber_tag() == function_component.rendered_child_fiber_tag()
            && report.host_component().node_type() == function_component.rendered_child_node_type()
    }

    fn private_to_tree_rendered_root_wraps_sibling_text_output(
        rendered_root: &TestRendererPrivateTreeRenderedRoot,
    ) -> bool {
        let Some(component) = rendered_root.as_function_component() else {
            return false;
        };
        let Some(rendered_children) = component.rendered().as_array() else {
            return false;
        };
        if component.node_type() != TestRendererPrivateTreeNodeType::Component
            || component.component_type() != TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
            || !component.props().attributes().is_empty()
            || component.instance_available()
            || !component.wraps_committed_host_output()
            || rendered_children.len() != 2
            || rendered_children[0].as_text().is_none()
        {
            return false;
        }
        let Some(host_component) = rendered_children[1].as_host_component() else {
            return false;
        };
        host_component.node_type() == TestRendererPrivateTreeNodeType::Host
            && !host_component.instance_available()
            && host_component.rendered_child_count() == 1
            && host_component.rendered()[0].as_text().is_some()
    }

    fn private_to_tree_rendered_root_wraps_multi_child_host_text_output(
        rendered_root: &TestRendererPrivateTreeRenderedRoot,
    ) -> bool {
        let Some(component) = rendered_root.as_function_component() else {
            return false;
        };
        let Some(host_component) = component.rendered().as_host_component() else {
            return false;
        };
        component.node_type() == TestRendererPrivateTreeNodeType::Component
            && component.component_type() == TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
            && component.props().attributes().is_empty()
            && !component.instance_available()
            && component.wraps_committed_host_output()
            && host_component.node_type() == TestRendererPrivateTreeNodeType::Host
            && !host_component.instance_available()
            && host_component.rendered_child_count() == 2
            && host_component.rendered().len() == 2
            && host_component.rendered()[0].as_text().is_some()
            && host_component.rendered()[1].as_text().is_some()
    }

    #[allow(
        clippy::too_many_arguments,
        reason = "native serialization admission must mirror the finished-work identity proof"
    )]
    fn validate_private_serialization_finished_work_identity_for_native_execution(
        &self,
        public_surface: &'static str,
        source_serialization_diagnostic_name: &'static str,
        host_output_update_kind: TestRendererRootUpdateKind,
        consumes_private_to_json_evidence: bool,
        consumes_private_to_tree_evidence: bool,
        identity: Option<TestRendererPrivateSerializationFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateSerializationFinishedWorkIdentityGate, &'static str> {
        let Some(identity) = identity else {
            return Err("finished-work-identity-missing");
        };

        if identity.diagnostic_name()
            != TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME
            || identity.status()
                != TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_STATUS
        {
            return Err("finished-work-identity-diagnostic-mismatch");
        }
        if identity.root() != self.root_id {
            return Err("finished-work-identity-root-mismatch");
        }
        if identity.root_scheduled_update_sequence() != self.scheduled_updates.len() {
            return Err("finished-work-identity-stale");
        }
        if identity.public_surface() != public_surface {
            return Err("finished-work-identity-public-surface-mismatch");
        }
        if identity.source_serialization_diagnostic_name() != source_serialization_diagnostic_name {
            return Err("finished-work-identity-source-report-mismatch");
        }
        if identity.host_output_update_kind() != host_output_update_kind {
            return Err("finished-work-identity-host-output-kind-mismatch");
        }

        let actual_current = self
            .store
            .root(self.root_id)
            .map_err(|_| "finished-work-identity-root-stale")?
            .current();
        let actual_current = TestRendererFiberHandleDiagnostics {
            arena_id: actual_current.arena_id().get(),
            slot: actual_current.slot().get(),
            generation: actual_current.generation().get(),
        };
        if identity.commit_current() != actual_current {
            return Err("finished-work-identity-stale");
        }

        if identity.render_finished_work() != identity.commit_current()
            || identity.report_finished_work() != identity.commit_current()
            || identity.commit_previous_current() != identity.render_current()
            || !identity.commit_current_matches_render_finished_work()
            || !identity.commit_previous_current_matches_render_current()
            || !identity.report_finished_work_matches_commit_current()
            || !identity.committed_fiber_inspection_current_matches_commit()
            || !identity.host_output_snapshot_current()
            || !identity.consumes_committed_host_root_finished_work_identity()
        {
            return Err("finished-work-identity-stale");
        }

        if identity.render_lanes_bits() == 0
            || identity.render_lanes_bits() != identity.commit_finished_lanes_bits()
            || identity.report_finished_lanes_bits() != identity.commit_finished_lanes_bits()
            || identity.commit_remaining_lanes_bits() != 0
            || identity.commit_pending_lanes_bits() != 0
            || !identity.commit_lanes_match_render_lanes()
            || !identity.report_lanes_match_commit_lanes()
            || !identity.consumes_committed_host_root_finished_work_lanes()
        {
            return Err("finished-work-identity-lane-mismatch");
        }

        if identity.consumes_private_to_json_evidence() != consumes_private_to_json_evidence
            || identity.consumes_private_to_tree_evidence() != consumes_private_to_tree_evidence
        {
            return Err("finished-work-identity-source-report-mismatch");
        }

        if identity.public_to_json_available()
            || identity.public_to_tree_available()
            || identity.public_test_instance_available()
            || identity.public_serialization_available()
            || identity.compatibility_claimed()
        {
            return Err("public-or-native-compatibility-claim");
        }

        Ok(identity)
    }

    fn validate_private_to_json_multi_child_host_text_update_route_admission_record_for_identity(
        &self,
        route: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<(), TestRendererRootError> {
        if route.record_id() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
            || route.status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
            || route.root() != self.root_id
            || route.renderer_id() != self.renderer.renderer_id
            || route.public_surface() != "create().update"
            || route.request_api() != "TestRendererRoot::update"
            || route.source_diagnostic_name() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME
            || route.source_diagnostic_status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS
            || route.lifecycle() != self.lifecycle
            || route.lifecycle() != TestRendererRootLifecycle::Active
            || route.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || route.host_output_update_kind() != TestRendererRootUpdateKind::Update
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "multi-child-host-text-route-metadata-stale",
                }
                .into(),
            );
        }
        if route.scheduled_update_sequence() != self.scheduled_updates.len() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
                    reason: "multi-child-host-text-route-update-sequence-stale",
                }
                .into(),
            );
        }
        if !route.consumes_accepted_host_root_update_queue_metadata()
            || !route.consumes_accepted_root_work_loop_metadata()
            || !route.consumes_accepted_host_output_metadata()
            || !route.rejects_stale_root_lifecycle()
            || !route.rejects_stale_host_output()
            || !route.rejects_missing_update_queue_evidence()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "multi-child-host-text-route-accepted-evidence-missing",
                }
                .into(),
            );
        }
        if route.public_root_update_available()
            || route.public_serialization_available()
            || route.native_execution_available()
            || route.compatibility_claimed()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
                    reason: "public-or-native-compatibility-claim",
                }
                .into(),
            );
        }

        Ok(())
    }

    fn validate_private_multi_child_host_text_lifecycle_execution_for_identity(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
        route: TestRendererPrivateUpdateRouteAdmissionRecord,
        lifecycle: &TestRendererPrivateRootLifecycleExecutionEvidence,
    ) -> Result<(), TestRendererRootError> {
        if lifecycle.diagnostic_name()
            != TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_DIAGNOSTIC_NAME
            || lifecycle.status() != TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_STATUS
            || lifecycle.root() != self.root_id
            || lifecycle.renderer_id != self.renderer.renderer_id
            || lifecycle.operation() != "update"
            || lifecycle.public_surface() != "create().update"
            || lifecycle.source_execution_record_id() != route.record_id()
            || lifecycle.source_execution_status() != route.status()
            || lifecycle.scheduled_update_sequence() != output.scheduled_update_sequence()
            || lifecycle.scheduled_update_sequence() != self.scheduled_updates.len()
            || lifecycle.lifecycle() != self.lifecycle
            || lifecycle.lifecycle() != TestRendererRootLifecycle::Active
            || lifecycle.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || lifecycle.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || lifecycle.host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            || lifecycle.root_child_count() != 1
            || lifecycle.previous_root_child_count() != 1
            || lifecycle.host_component_count() != 1
            || lifecycle.host_text_count() != 2
            || lifecycle.host_update_apply_count() != output.host_parent_placement_apply_count()
            || !lifecycle.source_owned_execution_accepted()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "multi-child-host-text-lifecycle-evidence-mismatch",
                }
                .into(),
            );
        }
        if lifecycle.snapshot() != output.snapshot()
            || lifecycle.previous_snapshot() != Some(output.previous_snapshot())
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
                    reason: "multi-child-host-text-lifecycle-snapshot-stale",
                }
                .into(),
            );
        }
        if lifecycle.public_root_available()
            || lifecycle.public_serialization_available()
            || lifecycle.public_test_instance_available()
            || lifecycle.public_act_available()
            || lifecycle.public_scheduler_available()
            || lifecycle.native_bridge_available()
            || lifecycle.native_execution_available()
            || lifecycle.js_package_available()
            || lifecycle.compatibility_claimed()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
                    reason: "public-or-native-package-js-compatibility-claim",
                }
                .into(),
            );
        }

        Ok(())
    }

    fn private_multi_child_host_text_snapshot_has_order(snapshot: &TestContainerSnapshot) -> bool {
        let [TestNodeSnapshot::Element(element)] = snapshot.children() else {
            return false;
        };
        let [
            TestNodeSnapshot::Text(first),
            TestNodeSnapshot::Text(second),
        ] = element.children()
        else {
            return false;
        };
        !element.is_hidden()
            && !element.is_detached()
            && !first.is_hidden()
            && !second.is_hidden()
            && first.text() != second.text()
    }

    fn validate_private_to_json_multi_child_host_text_native_execution_identity_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
        lifecycle: &TestRendererPrivateRootLifecycleExecutionEvidence,
        identity: Option<TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate, &'static str> {
        let Some(identity) = identity else {
            return Err("finished-work-identity-missing");
        };

        Self::validate_private_to_json_multi_child_host_text_finished_work_identity_gate_for_canary(
            identity,
        )?;

        if lifecycle.diagnostic_name()
            != TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_DIAGNOSTIC_NAME
            || lifecycle.status() != TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_STATUS
            || lifecycle.root() != self.root_id
            || lifecycle.renderer_id != self.renderer.renderer_id
            || lifecycle.operation() != "update"
            || lifecycle.public_surface() != "create().update"
            || lifecycle.source_execution_record_id() != execution.record_id()
            || lifecycle.source_execution_status() != execution.status()
            || lifecycle.scheduled_update_sequence() != output.scheduled_update_sequence()
            || lifecycle.scheduled_update_sequence() != self.scheduled_updates.len()
            || lifecycle.lifecycle() != self.lifecycle
            || lifecycle.lifecycle() != TestRendererRootLifecycle::Active
            || lifecycle.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || lifecycle.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || lifecycle.host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            || lifecycle.root_child_count() != 1
            || lifecycle.previous_root_child_count() != 1
            || lifecycle.host_component_count() != 1
            || lifecycle.host_text_count() != 2
            || lifecycle.host_update_apply_count() != output.host_parent_placement_apply_count()
            || !lifecycle.source_owned_execution_accepted()
        {
            return Err("multi-child-host-text-lifecycle-evidence-mismatch");
        }
        if lifecycle.snapshot() != output.snapshot()
            || lifecycle.previous_snapshot() != Some(output.previous_snapshot())
        {
            return Err("multi-child-host-text-lifecycle-snapshot-stale");
        }
        if lifecycle.public_root_available()
            || lifecycle.public_serialization_available()
            || lifecycle.public_test_instance_available()
            || lifecycle.public_act_available()
            || lifecycle.public_scheduler_available()
            || lifecycle.native_bridge_available()
            || lifecycle.native_execution_available()
            || lifecycle.js_package_available()
            || lifecycle.compatibility_claimed()
        {
            return Err("public-or-native-package-js-compatibility-claim");
        }

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

        let render = output.render();
        let commit = output.commit();
        if identity.root() != self.root_id
            || identity.renderer_id() != self.renderer.renderer_id
            || identity.root_scheduled_update_sequence() != self.scheduled_updates.len()
            || identity.root_scheduled_update_sequence() != output.scheduled_update_sequence()
        {
            return Err("finished-work-identity-stale");
        }
        if identity.public_surface() != "create().update -> create().toJSON"
            || identity.source_execution_record_id() != execution.record_id()
            || identity.source_execution_status() != execution.status()
            || identity.source_lifecycle_diagnostic_name() != lifecycle.diagnostic_name()
            || identity.source_lifecycle_status() != lifecycle.status()
        {
            return Err("finished-work-identity-source-report-mismatch");
        }
        if execution.scheduled_update_sequence() != output.scheduled_update_sequence()
            || execution.root() != self.root_id
            || execution.renderer_id() != self.renderer.renderer_id
            || render.root() != self.root_id
            || commit.root() != self.root_id
        {
            return Err("update-admission-handoff-mismatch");
        }
        if execution.render_current() != fiber_handle!(render.current())
            || execution.render_finished_work() != fiber_handle!(render.finished_work())
            || execution.commit_previous_current() != fiber_handle!(commit.previous_current())
            || execution.commit_current() != fiber_handle!(commit.current())
        {
            return Err("update-admission-handoff-mismatch");
        }
        if identity.route_render_current() != execution.render_current()
            || identity.route_render_finished_work() != execution.render_finished_work()
            || identity.route_commit_previous_current() != execution.commit_previous_current()
            || identity.route_commit_current() != execution.commit_current()
        {
            return Err("multi-child-host-text-finished-work-identity-route-mismatch");
        }
        if identity.render_current() != fiber_handle!(render.current())
            || identity.render_finished_work() != fiber_handle!(render.finished_work())
            || identity.commit_previous_current() != fiber_handle!(commit.previous_current())
            || identity.commit_current() != fiber_handle!(commit.current())
            || identity.report_finished_work() != fiber_handle!(commit.current())
        {
            return Err("multi-child-host-text-finished-work-identity-handoff-mismatch");
        }
        let actual_current = self
            .store
            .root(self.root_id)
            .map_err(|_| "finished-work-identity-root-stale")?
            .current();
        if identity.commit_current() != fiber_handle!(actual_current) {
            return Err("finished-work-identity-stale");
        }
        if execution.render_lanes_bits() == 0
            || execution.render_lanes_bits() != render.render_lanes().bits()
            || execution.commit_finished_lanes_bits() != commit.finished_lanes().bits()
            || render.render_lanes().bits() != commit.finished_lanes().bits()
        {
            return Err("update-admission-lane-mismatch");
        }
        if identity.render_lanes_bits() != execution.render_lanes_bits()
            || identity.commit_finished_lanes_bits() != execution.commit_finished_lanes_bits()
            || identity.report_finished_lanes_bits() != execution.commit_finished_lanes_bits()
            || identity.commit_remaining_lanes_bits() != 0
            || identity.commit_pending_lanes_bits() != 0
        {
            return Err("multi-child-host-text-finished-work-identity-lane-mismatch");
        }
        if identity.lifecycle_scheduled_update_sequence() != lifecycle.scheduled_update_sequence()
            || identity.lifecycle_host_output_shape() != lifecycle.host_output_shape()
            || identity.lifecycle_root_child_count() != lifecycle.root_child_count()
            || identity.lifecycle_host_component_count() != lifecycle.host_component_count()
            || identity.lifecycle_host_text_count() != lifecycle.host_text_count()
            || !identity.lifecycle_matches_committed_update()
            || !identity.consumes_root_lifecycle_execution()
        {
            return Err("multi-child-host-text-lifecycle-evidence-mismatch");
        }

        Ok(identity)
    }

    fn validate_private_to_json_sibling_text_update_route_admission_record_for_identity(
        &self,
        route: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<(), TestRendererRootError> {
        if route.record_id() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
            || route.status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
            || route.root() != self.root_id
            || route.public_surface() != "create().update"
            || route.request_api() != "TestRendererRoot::update"
            || route.source_diagnostic_name() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME
            || route.source_diagnostic_status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS
            || route.lifecycle() != self.lifecycle
            || route.lifecycle() != TestRendererRootLifecycle::Active
            || route.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || route.host_output_update_kind() != TestRendererRootUpdateKind::Update
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "sibling-text-route-metadata-stale",
                }
                .into(),
            );
        }
        if route.scheduled_update_sequence() != self.scheduled_updates.len() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
                    reason: "sibling-text-route-update-sequence-stale",
                }
                .into(),
            );
        }
        if !route.consumes_accepted_host_root_update_queue_metadata()
            || !route.consumes_accepted_root_work_loop_metadata()
            || !route.consumes_accepted_host_output_metadata()
            || !route.rejects_stale_root_lifecycle()
            || !route.rejects_stale_host_output()
            || !route.rejects_missing_update_queue_evidence()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "sibling-text-route-accepted-evidence-missing",
                }
                .into(),
            );
        }
        if route.public_root_update_available()
            || route.public_serialization_available()
            || route.native_execution_available()
            || route.compatibility_claimed()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
                    reason: "public-or-native-compatibility-claim",
                }
                .into(),
            );
        }

        Ok(())
    }

    fn validate_private_to_json_sibling_text_report_for_identity(
        &self,
        output: &TestRendererSiblingTextHostOutput,
        expected_row: TestRendererPrivateToJsonHostOutputRow,
        report: &TestRendererPrivateJsonSerializationReport,
    ) -> Result<(), TestRendererRootError> {
        if report.diagnostic_name() != TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "sibling-text-report-diagnostic-mismatch",
                }
                .into(),
            );
        }
        if report.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || report.host_output_shape() != TestRendererPrivateToJsonHostOutputShape::SiblingText
            || report.root_node_kind() != TestRendererPrivateJsonNodeKind::RootArray
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "sibling-text-report-shape-mismatch",
                }
                .into(),
            );
        }
        if !report.host_output_snapshot_current() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "host-output-snapshot-stale",
                }
                .into(),
            );
        }
        let Some(report_row) = report.host_output_row() else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "sibling-text-report-row-missing",
                }
                .into(),
            );
        };
        if report_row != expected_row
            || report_row.id() != TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
            || report_row.host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::SiblingText
            || report_row.host_output_update_kind() != TestRendererRootUpdateKind::Update
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "sibling-text-report-row-mismatch",
                }
                .into(),
            );
        }
        if !report_row.public_blockers().all_blocked()
            || !report_row
                .dependency_diagnostics()
                .public_surfaces_blocked()
            || !report.public_blockers().all_blocked()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
                    reason: "public-blockers-not-all-closed",
                }
                .into(),
            );
        }
        if report.root_child_count() != 2
            || report.node_count() != 3
            || !Self::private_to_json_sibling_text_report_root_array_source_nodes_match_output(
                report, output,
            )
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "sibling-text-root-array-source-nodes-missing",
                }
                .into(),
            );
        }

        let Some(fiber_inspection) = report.gate().fiber_inspection() else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "missing-committed-fiber-inspection",
                }
                .into(),
            );
        };
        if fiber_inspection != output.fiber_inspection() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
                    reason: "committed-fiber-inspection-stale",
                }
                .into(),
            );
        }
        if fiber_inspection.shape_name() != "HostRoot->[HostText,HostComponent->HostText]"
            || fiber_inspection.root_children().len() != 2
            || fiber_inspection.host_components().len() != 1
            || fiber_inspection.host_texts().len() != 2
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "sibling-text-committed-fiber-inspection-shape-mismatch",
                }
                .into(),
            );
        }
        if fiber_inspection.current() != output.commit().current() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
                    reason: "committed-fiber-inspection-current-mismatch",
                }
                .into(),
            );
        }

        Ok(())
    }

    fn private_to_json_sibling_text_report_root_array_source_nodes_match_output(
        report: &TestRendererPrivateJsonSerializationReport,
        output: &TestRendererSiblingTextHostOutput,
    ) -> bool {
        let output_children = output.snapshot().children();
        if output_children.len() != 2 {
            return false;
        }
        let (TestNodeSnapshot::Text(root_text), TestNodeSnapshot::Element(component)) =
            (&output_children[0], &output_children[1])
        else {
            return false;
        };
        let [TestNodeSnapshot::Text(component_text)] = component.children() else {
            return false;
        };
        let nodes = report.nodes();
        if nodes.len() != 3 {
            return false;
        }

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

        let stable = output.stable_fibers().current();
        let root_text_node = &nodes[0];
        let component_node = &nodes[1];
        let component_text_node = &nodes[2];
        if root_text_node.node_kind() != TestRendererPrivateJsonNodeKind::Text
            || root_text_node.parent_ordinal().is_some()
            || !root_text_node.child_ordinals().is_empty()
            || root_text_node.text() != Some(root_text.text())
            || root_text_node.fiber().fiber() != output.root_text_fiber()
            || root_text_node.fiber().pending_props_raw() != output.root_text_props_raw()
            || root_text_node.fiber().memoized_props_raw() != output.root_text_props_raw()
            || !root_text_node.fiber().state_node_present()
        {
            return false;
        }
        if component_node.node_kind() != TestRendererPrivateJsonNodeKind::HostComponent
            || component_node.parent_ordinal().is_some()
            || component_node.child_ordinals() != [2]
            || component_node.element_type() != Some(component.element_type())
            || component_node.props() != Some(component.props())
            || component_node.fiber().fiber() != fiber_handle!(stable.component())
            || !component_node.fiber().state_node_present()
        {
            return false;
        }
        if component_text_node.node_kind() != TestRendererPrivateJsonNodeKind::Text
            || component_text_node.parent_ordinal() != Some(1)
            || !component_text_node.child_ordinals().is_empty()
            || component_text_node.text() != Some(component_text.text())
            || component_text_node.fiber().fiber() != fiber_handle!(stable.text())
            || !component_text_node.fiber().state_node_present()
        {
            return false;
        }

        let Some(rendered) = report.rendered_root().as_array() else {
            return false;
        };
        if rendered.len() != 2 || rendered[0].as_text() != Some(root_text.text()) {
            return false;
        }
        let Some(rendered_component) = rendered[1].as_host_component() else {
            return false;
        };
        let Some(rendered_children) = rendered_component.children() else {
            return false;
        };
        rendered_component.element_type() == component.element_type()
            && rendered_children.len() == 1
            && rendered_children[0].as_text() == Some(component_text.text())
    }

    fn validate_private_sibling_text_update_route_matches_handoff_for_canary(
        &self,
        output: &TestRendererSiblingTextHostOutput,
        route: TestRendererPrivateUpdateRouteAdmissionRecord,
        identity: TestRendererPrivateSerializationFinishedWorkIdentityGate,
    ) -> Result<(), &'static str> {
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

        let render = output.render();
        let commit = output.commit();
        if route.scheduled_update_sequence() != output.scheduled_update_sequence()
            || identity.root_scheduled_update_sequence() != output.scheduled_update_sequence()
            || output.scheduled_update_sequence() != self.scheduled_updates.len()
        {
            return Err("sibling-text-route-handoff-mismatch");
        }

        if route.render_current() != fiber_handle!(render.current())
            || route.render_finished_work() != fiber_handle!(render.finished_work())
            || route.commit_previous_current() != fiber_handle!(commit.previous_current())
            || route.commit_current() != fiber_handle!(commit.current())
        {
            return Err("sibling-text-route-handoff-mismatch");
        }

        if route.render_current() != identity.render_current()
            || route.render_finished_work() != identity.render_finished_work()
            || route.commit_previous_current() != identity.commit_previous_current()
            || route.commit_current() != identity.commit_current()
        {
            return Err("sibling-text-route-finished-work-identity-mismatch");
        }

        if route.render_lanes_bits() == 0
            || route.render_lanes_bits() != render.render_lanes().bits()
            || route.commit_finished_lanes_bits() != commit.finished_lanes().bits()
            || render.render_lanes().bits() != commit.finished_lanes().bits()
        {
            return Err("sibling-text-route-lane-mismatch");
        }

        if route.render_lanes_bits() != identity.render_lanes_bits()
            || route.commit_finished_lanes_bits() != identity.commit_finished_lanes_bits()
        {
            return Err("sibling-text-route-finished-work-identity-lane-mismatch");
        }

        Ok(())
    }

    fn validate_private_to_json_sibling_text_native_execution_identity_for_canary(
        &self,
        output: &TestRendererSiblingTextHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
        identity: Option<TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate>,
    ) -> Result<TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate, &'static str> {
        let Some(identity) = identity else {
            return Err("finished-work-identity-missing");
        };

        Self::validate_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            identity,
        )?;

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

        let render = output.render();
        let commit = output.commit();
        if identity.root() != self.root_id
            || identity.root_scheduled_update_sequence() != self.scheduled_updates.len()
            || identity.root_scheduled_update_sequence() != output.scheduled_update_sequence()
        {
            return Err("finished-work-identity-stale");
        }
        if identity.public_surface() != "create().update -> create().toJSON"
            || identity.source_execution_record_id() != execution.record_id()
            || identity.source_execution_status() != execution.status()
            || identity.source_serialization_diagnostic_name()
                != TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
        {
            return Err("finished-work-identity-source-report-mismatch");
        }
        if execution.scheduled_update_sequence() != output.scheduled_update_sequence()
            || execution.root() != self.root_id
            || render.root() != self.root_id
            || commit.root() != self.root_id
        {
            return Err("update-admission-handoff-mismatch");
        }
        if execution.render_current() != fiber_handle!(render.current())
            || execution.render_finished_work() != fiber_handle!(render.finished_work())
            || execution.commit_previous_current() != fiber_handle!(commit.previous_current())
            || execution.commit_current() != fiber_handle!(commit.current())
        {
            return Err("update-admission-handoff-mismatch");
        }
        if identity.route_render_current() != execution.render_current()
            || identity.route_render_finished_work() != execution.render_finished_work()
            || identity.route_commit_previous_current() != execution.commit_previous_current()
            || identity.route_commit_current() != execution.commit_current()
        {
            return Err("sibling-text-finished-work-identity-route-mismatch");
        }
        if identity.render_current() != fiber_handle!(render.current())
            || identity.render_finished_work() != fiber_handle!(render.finished_work())
            || identity.commit_previous_current() != fiber_handle!(commit.previous_current())
            || identity.commit_current() != fiber_handle!(commit.current())
            || identity.report_finished_work() != fiber_handle!(commit.current())
        {
            return Err("sibling-text-finished-work-identity-handoff-mismatch");
        }
        if execution.render_lanes_bits() == 0
            || execution.render_lanes_bits() != render.render_lanes().bits()
            || execution.commit_finished_lanes_bits() != commit.finished_lanes().bits()
            || render.render_lanes().bits() != commit.finished_lanes().bits()
        {
            return Err("update-admission-lane-mismatch");
        }
        if identity.route_render_lanes_bits() != execution.render_lanes_bits()
            || identity.route_commit_finished_lanes_bits() != execution.commit_finished_lanes_bits()
            || identity.render_lanes_bits() != execution.render_lanes_bits()
            || identity.commit_finished_lanes_bits() != execution.commit_finished_lanes_bits()
            || identity.report_finished_lanes_bits() != execution.commit_finished_lanes_bits()
        {
            return Err("sibling-text-finished-work-identity-lane-mismatch");
        }

        Ok(identity)
    }

    fn validate_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
        gate: TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate,
    ) -> Result<(), &'static str> {
        if gate.diagnostic_name()
            != TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_DIAGNOSTIC_NAME
            || gate.status() != TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_STATUS
        {
            return Err("sibling-text-finished-work-identity-diagnostic-mismatch");
        }
        if gate.public_surface() != "create().update -> create().toJSON"
            || gate.source_execution_record_id()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
            || gate.source_execution_status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
            || gate.source_serialization_diagnostic_name()
                != TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
        {
            return Err("sibling-text-finished-work-identity-source-mismatch");
        }
        if gate.worker_738_report_row_id()
            != TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
            || gate.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || gate.host_output_shape() != TestRendererPrivateToJsonHostOutputShape::SiblingText
            || gate.root_node_kind() != TestRendererPrivateJsonNodeKind::RootArray
            || gate.root_child_count() != 2
            || gate.source_node_count() != 3
        {
            return Err("sibling-text-report-row-or-shape-mismatch");
        }
        if !gate.route_handles_match_committed_update()
            || gate.route_render_current() != gate.render_current()
            || gate.route_render_finished_work() != gate.render_finished_work()
            || gate.route_commit_previous_current() != gate.commit_previous_current()
            || gate.route_commit_current() != gate.commit_current()
        {
            return Err("sibling-text-route-finished-work-identity-mismatch");
        }
        if !gate.commit_current_matches_render_finished_work()
            || !gate.commit_previous_current_matches_render_current()
            || !gate.report_finished_work_matches_commit_current()
            || !gate.committed_fiber_inspection_current_matches_commit()
            || gate.render_finished_work() != gate.commit_current()
            || gate.report_finished_work() != gate.commit_current()
            || gate.commit_previous_current() != gate.render_current()
        {
            return Err("sibling-text-finished-work-identity-mismatch");
        }
        if gate.render_lanes_bits() == 0
            || gate.route_render_lanes_bits() != gate.render_lanes_bits()
            || gate.route_commit_finished_lanes_bits() != gate.commit_finished_lanes_bits()
            || gate.render_lanes_bits() != gate.commit_finished_lanes_bits()
            || gate.report_finished_lanes_bits() != gate.commit_finished_lanes_bits()
            || gate.commit_remaining_lanes_bits() != 0
            || gate.commit_pending_lanes_bits() != 0
            || !gate.route_lanes_match_committed_update()
            || !gate.commit_lanes_match_render_lanes()
            || !gate.report_lanes_match_commit_lanes()
        {
            return Err("sibling-text-finished-work-identity-lane-mismatch");
        }
        if !gate.committed_sibling_text_fiber_inspection_available()
            || !gate.committed_sibling_text_report_shape_available()
            || !gate.committed_sibling_text_inspection_matches_output()
            || !gate.host_output_snapshot_current()
            || !gate.report_host_output_row_matches_output()
            || !gate.report_root_array_source_nodes_match_current_snapshot()
            || !gate.real_sibling_text_handoff_available()
            || !gate.consumes_update_route_admission()
            || !gate.consumes_sibling_text_host_output()
            || !gate.consumes_private_to_json_evidence()
            || !gate.consumes_worker_738_report_row()
            || !gate.consumes_committed_host_root_finished_work_identity()
            || !gate.consumes_committed_host_root_finished_work_lanes()
            || !gate.identity_admission_available()
        {
            return Err("sibling-text-finished-work-evidence-not-consumed");
        }
        if gate.broad_multichild_identity_available() {
            return Err("broad-multichild-identity-unexpectedly-open");
        }
        if !gate.public_native_package_js_surfaces_blocked() {
            return Err("public-or-native-package-js-compatibility-claim");
        }

        Ok(())
    }

    fn validate_private_to_json_multi_child_host_text_finished_work_identity_gate_for_canary(
        gate: TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate,
    ) -> Result<(), &'static str> {
        if gate.diagnostic_name()
            != TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_DIAGNOSTIC_NAME
            || gate.status() != TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_STATUS
        {
            return Err("multi-child-host-text-finished-work-identity-diagnostic-mismatch");
        }
        if gate.public_surface() != "create().update -> create().toJSON"
            || gate.source_execution_record_id()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
            || gate.source_execution_status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
            || gate.source_lifecycle_diagnostic_name()
                != TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_DIAGNOSTIC_NAME
            || gate.source_lifecycle_status()
                != TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_STATUS
        {
            return Err("multi-child-host-text-finished-work-identity-source-mismatch");
        }
        if gate.worker_895_report_row_id()
            != TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID
            || gate.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || gate.host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            || gate.root_node_kind() != TestRendererPrivateJsonNodeKind::HostComponent
            || gate.child_fiber_tag_order() != ["HostComponent", "HostText", "HostText"]
            || gate.root_child_count() != 1
            || gate.source_node_count() != 3
        {
            return Err("multi-child-host-text-report-row-or-shape-mismatch");
        }
        if !gate.route_handles_match_committed_update()
            || gate.route_render_current() != gate.render_current()
            || gate.route_render_finished_work() != gate.render_finished_work()
            || gate.route_commit_previous_current() != gate.commit_previous_current()
            || gate.route_commit_current() != gate.commit_current()
        {
            return Err("multi-child-host-text-route-finished-work-identity-mismatch");
        }
        if !gate.lifecycle_matches_committed_update()
            || gate.lifecycle_scheduled_update_sequence() != gate.root_scheduled_update_sequence()
            || gate.lifecycle_host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            || gate.lifecycle_root_child_count() != 1
            || gate.lifecycle_host_component_count() != 1
            || gate.lifecycle_host_text_count() != 2
        {
            return Err("multi-child-host-text-lifecycle-evidence-mismatch");
        }
        if !gate.commit_current_matches_render_finished_work()
            || !gate.commit_previous_current_matches_render_current()
            || !gate.report_finished_work_matches_commit_current()
            || gate.render_finished_work() != gate.commit_current()
            || gate.report_finished_work() != gate.commit_current()
            || gate.commit_previous_current() != gate.render_current()
        {
            return Err("multi-child-host-text-finished-work-identity-mismatch");
        }
        if gate.render_lanes_bits() == 0
            || gate.route_render_lanes_bits != gate.render_lanes_bits()
            || gate.route_commit_finished_lanes_bits != gate.commit_finished_lanes_bits()
            || gate.render_lanes_bits() != gate.commit_finished_lanes_bits()
            || gate.report_finished_lanes_bits() != gate.commit_finished_lanes_bits()
            || gate.commit_remaining_lanes_bits() != 0
            || gate.commit_pending_lanes_bits() != 0
            || !gate.route_lanes_match_committed_update()
            || !gate.report_lanes_match_commit_lanes()
        {
            return Err("multi-child-host-text-finished-work-identity-lane-mismatch");
        }
        if !gate.host_output_snapshot_current()
            || !gate.report_host_output_row_matches_output()
            || !gate.child_order_matches_current_snapshot()
            || gate.host_parent_placement_apply_count() == 0
            || !gate.real_multi_child_handoff_available()
            || !gate.consumes_update_route_admission()
            || !gate.consumes_root_lifecycle_execution()
            || !gate.consumes_multi_child_host_output()
            || !gate.consumes_committed_host_root_finished_work_identity()
            || !gate.consumes_committed_host_root_finished_work_lanes()
            || !gate.identity_admission_available()
        {
            return Err("multi-child-host-text-finished-work-evidence-not-consumed");
        }
        if gate.broad_multichild_identity_available() {
            return Err("broad-multichild-identity-unexpectedly-open");
        }
        if !gate.public_native_package_js_surfaces_blocked() {
            return Err("public-or-native-package-js-compatibility-claim");
        }

        Ok(())
    }

    fn private_direct_multi_child_host_text_committed_fiber_inspection_error(
        reason: &'static str,
    ) -> TestRendererRootError {
        TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
            reason,
        }
        .into()
    }

    fn private_direct_multi_child_host_text_committed_fiber_inspection_foreign_error(
        reason: &'static str,
    ) -> TestRendererRootError {
        TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
            reason,
        }
        .into()
    }

    fn private_direct_multi_child_host_text_committed_fiber_inspection_stale_error(
        reason: &'static str,
    ) -> TestRendererRootError {
        TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason,
        }
        .into()
    }

    fn private_direct_multi_child_host_text_committed_fiber_inspection_public_error(
        reason: &'static str,
    ) -> TestRendererRootError {
        TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
            reason,
        }
        .into()
    }

    fn private_direct_multi_child_host_text_current_fibers_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
    ) -> Result<(FiberId, FiberId, FiberId), TestRendererRootError> {
        let commit = output.commit();
        if commit.root() != self.root_id {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_foreign_error(
                    "direct-multi-child-host-text-cross-root-current-mismatch",
                ),
            );
        }

        let root_node = self
            .store
            .fiber_arena()
            .get(commit.current())
            .map_err(FiberRootStoreError::from)?;
        let Some(component_fiber) = root_node.child() else {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-current-child-topology-mismatch",
                ),
            );
        };
        let component_node = self
            .store
            .fiber_arena()
            .get(component_fiber)
            .map_err(FiberRootStoreError::from)?;
        let Some(stable_text_fiber) = component_node.child() else {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-current-child-topology-mismatch",
                ),
            );
        };
        let stable_text_node = self
            .store
            .fiber_arena()
            .get(stable_text_fiber)
            .map_err(FiberRootStoreError::from)?;
        let Some(placed_text_fiber) = stable_text_node.sibling() else {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-current-child-topology-mismatch",
                ),
            );
        };

        Ok((component_fiber, stable_text_fiber, placed_text_fiber))
    }

    fn private_direct_multi_child_host_text_reconciler_inspection_evidence_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
    ) -> Result<
        TestRendererPrivateDirectMultiChildHostTextReconcilerInspectionEvidence,
        TestRendererRootError,
    > {
        self.validate_private_multi_child_host_text_output_for_canary(output)?;
        let (component_fiber, stable_text_fiber, placed_text_fiber) =
            self.private_direct_multi_child_host_text_current_fibers_for_canary(output)?;
        let commit = output.commit();
        let source = record_reconciler_direct_multi_child_committed_fiber_source(
            &self.store,
            commit,
            component_fiber,
            stable_text_fiber,
            placed_text_fiber,
        )
        .map_err(|_| {
            Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                "direct-multi-child-host-text-reconciler-source-mismatch",
            )
        })?;
        let inspection =
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&self.store, source)
                .map_err(|_| {
                    Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                        "direct-multi-child-host-text-reconciler-inspection-mismatch",
                    )
                })?;
        inspection
            .validate_against_store(&self.store)
            .map_err(|_| {
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_stale_error(
                    "direct-multi-child-host-text-reconciler-inspection-stale",
                )
            })?;

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

        let source_public_serialization_blocked = source.public_serialization_blocked();
        let source_test_renderer_public_compatibility_blocked =
            source.test_renderer_public_compatibility_blocked();
        let source_native_execution_blocked = source.native_execution_blocked();
        let source_package_compatibility_blocked = source.package_compatibility_blocked();
        let inspection_public_serialization_blocked = inspection.public_serialization_blocked();
        let inspection_test_renderer_public_compatibility_blocked =
            inspection.test_renderer_public_compatibility_blocked();
        let inspection_native_execution_blocked = inspection.native_execution_blocked();
        let inspection_package_compatibility_blocked = inspection.package_compatibility_blocked();

        Ok(
            TestRendererPrivateDirectMultiChildHostTextReconcilerInspectionEvidence {
                diagnostic_name:
                    TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_RECONCILER_INSPECTION_DIAGNOSTIC_NAME,
                status:
                    TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_RECONCILER_INSPECTION_STATUS,
                root: self.root_id,
                renderer_id: self.renderer.renderer_id,
                root_scheduled_update_sequence: output.scheduled_update_sequence(),
                public_surface: "create().update -> create().toJSON",
                source_previous_current: fiber_handle!(source.previous_current()),
                source_committed_current: fiber_handle!(source.committed_current()),
                source_component_fiber: fiber_handle!(source.component()),
                source_stable_text_fiber: fiber_handle!(source.first_text()),
                source_placed_text_fiber: fiber_handle!(source.second_text()),
                source_current_topology_recorded: source.source_current_topology_recorded(),
                source_host_node_state_nodes_present: source.host_node_store_state_nodes_present(),
                inspection_shape_name: inspection.shape_name(),
                inspection_current_shape:
                    TEST_RENDERER_PRIVATE_TREE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE,
                inspection_store_current: fiber_handle!(inspection.store_current()),
                inspection_root_child_count: inspection.tree().root_children().len(),
                inspection_host_component_child_count: inspection.tree().host_texts().len(),
                inspection_host_text_count: inspection.tree().host_texts().len(),
                inspection_host_component_state_node_raw: inspection
                    .host_component()
                    .state_node()
                    .raw(),
                inspection_stable_text_state_node_raw: inspection.first_text().state_node().raw(),
                inspection_placed_text_state_node_raw: inspection.second_text().state_node().raw(),
                inspection_finished_work_after_commit_cleared: inspection
                    .finished_work_after_commit()
                    .is_none(),
                inspection_finished_lanes_after_commit_bits: inspection
                    .finished_lanes_after_commit()
                    .bits(),
                render_lanes_bits: inspection.render_lanes().bits(),
                commit_finished_lanes_bits: inspection.commit_finished_lanes().bits(),
                source_public_serialization_blocked,
                source_test_renderer_public_compatibility_blocked,
                source_native_execution_blocked,
                source_package_compatibility_blocked,
                inspection_public_serialization_blocked,
                inspection_test_renderer_public_compatibility_blocked,
                inspection_native_execution_blocked,
                inspection_package_compatibility_blocked,
                public_native_package_js_surfaces_blocked: true,
            },
        )
    }

    fn validate_private_direct_multi_child_host_text_reconciler_inspection_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
        evidence: TestRendererPrivateDirectMultiChildHostTextReconcilerInspectionEvidence,
    ) -> Result<(), TestRendererRootError> {
        if evidence.root() != self.root_id || evidence.renderer_id != self.renderer.renderer_id {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_foreign_error(
                    "direct-multi-child-host-text-reconciler-inspection-mismatch",
                ),
            );
        }
        if evidence.root_scheduled_update_sequence() != self.scheduled_updates.len()
            || evidence.root_scheduled_update_sequence() != output.scheduled_update_sequence()
        {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_stale_error(
                    "direct-multi-child-host-text-reconciler-inspection-stale",
                ),
            );
        }
        if !evidence.public_native_package_js_surfaces_blocked() {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_public_error(
                    "public-or-native-package-js-compatibility-claim",
                ),
            );
        }
        if !evidence.source_bound_reconciler_direct_inspection_accepted() {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-reconciler-inspection-mismatch",
                ),
            );
        }

        let expected = self
            .private_direct_multi_child_host_text_reconciler_inspection_evidence_for_canary(
                output,
            )?;
        if evidence != expected {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-reconciler-inspection-mismatch",
                ),
            );
        }

        Ok(())
    }

    fn validate_private_direct_multi_child_host_text_row_identity_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
        row_identity: TestRendererPrivateDirectMultiChildHostTextRowIdentity,
        expected_row: TestRendererPrivateToJsonHostOutputRow,
    ) -> Result<(), TestRendererRootError> {
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

        let render = output.render();
        let commit = output.commit();
        let current = output.updated_fibers();
        let store_current = self.store.root(self.root_id)?.current();
        let row = row_identity.host_output_row();

        if row_identity.diagnostic_name()
            != TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_DIAGNOSTIC_NAME
            || row_identity.status()
                != TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_STATUS
            || row_identity.public_surface() != "create().update -> create().toJSON"
        {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-row-identity-mismatch",
                ),
            );
        }
        if row_identity.root() != self.root_id
            || row_identity.renderer_id != self.renderer.renderer_id
            || render.root() != self.root_id
            || commit.root() != self.root_id
            || !row_identity.row_owner_matches_root()
        {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_foreign_error(
                    "direct-multi-child-host-text-row-identity-mismatch",
                ),
            );
        }
        if row_identity.root_scheduled_update_sequence() != self.scheduled_updates.len()
            || row_identity.root_scheduled_update_sequence() != output.scheduled_update_sequence()
        {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_stale_error(
                    "direct-multi-child-host-text-row-identity-mismatch",
                ),
            );
        }
        if row != expected_row
            || row.id() != TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID
            || row.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || row.host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            || row.current_root_child_count() != 1
            || row.current_host_component_count() != 1
            || row.current_host_text_count() != 2
            || row.current_root_text_count() != 0
            || row.current_max_host_component_depth() != 1
            || !row_identity.row_matches_shape()
        {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-row-identity-mismatch",
                ),
            );
        }
        if !row.public_blockers().all_blocked()
            || !row.dependency_diagnostics().public_surfaces_blocked()
            || !row_identity.public_native_package_js_surfaces_blocked()
        {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_public_error(
                    "public-or-native-package-js-compatibility-claim",
                ),
            );
        }
        if row_identity.render_current() != fiber_handle!(render.current())
            || row_identity.render_finished_work() != fiber_handle!(render.finished_work())
            || row_identity.commit_previous_current() != fiber_handle!(commit.previous_current())
            || row_identity.commit_current() != fiber_handle!(commit.current())
            || row_identity.store_current() != fiber_handle!(store_current)
            || row_identity.host_component_fiber() != fiber_handle!(current.component())
            || row_identity.stable_text_fiber() != fiber_handle!(current.text())
            || row_identity.placed_text_fiber() != output.placed_text_fiber()
            || row_identity.render_finished_work() != row_identity.commit_current()
            || row_identity.commit_current() != row_identity.store_current()
            || row_identity.commit_previous_current() != row_identity.render_current()
            || !row_identity.row_handles_match_output()
        {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-row-identity-mismatch",
                ),
            );
        }
        if row_identity.render_lanes_bits() == 0
            || row_identity.render_lanes_bits() != render.render_lanes().bits()
            || row_identity.commit_finished_lanes_bits() != commit.finished_lanes().bits()
            || row_identity.render_lanes_bits() != row_identity.commit_finished_lanes_bits()
            || row_identity.commit_remaining_lanes_bits() != 0
            || row_identity.commit_pending_lanes_bits() != 0
            || !row_identity.row_lanes_match_commit()
        {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-row-identity-mismatch",
                ),
            );
        }
        if !row_identity.source_owned_current_row_identity_accepted() {
            return Err(
                Self::private_direct_multi_child_host_text_committed_fiber_inspection_error(
                    "direct-multi-child-host-text-row-identity-mismatch",
                ),
            );
        }

        Ok(())
    }

    fn validate_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
        report: TestRendererPrivateDirectMultiChildHostTextCommittedFiberInspection,
    ) -> Result<(), &'static str> {
        if report.diagnostic_name()
            != TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_FIBER_INSPECTION_DIAGNOSTIC_NAME
            || report.status()
                != TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_FIBER_INSPECTION_STATUS
        {
            return Err("direct-multi-child-host-text-current-fiber-diagnostic-mismatch");
        }
        if report.public_surface() != "create().update -> create().toJSON"
            || report.source_route_record_id()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
            || report.source_route_status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
            || report.source_lifecycle_diagnostic_name()
                != TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_DIAGNOSTIC_NAME
            || report.source_lifecycle_status()
                != TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_STATUS
            || report.source_identity_diagnostic_name()
                != TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_DIAGNOSTIC_NAME
            || report.source_identity_status()
                != TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_STATUS
            || report.source_row_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID
        {
            return Err("direct-multi-child-host-text-current-fiber-source-mismatch");
        }
        if report.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || report.host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            || report.current_fiber_shape()
                != TEST_RENDERER_PRIVATE_TREE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE
            || report.root_child_count() != 1
            || report.host_component_child_count() != 2
            || report.host_text_count() != 2
        {
            return Err("direct-multi-child-host-text-current-fiber-shape-mismatch");
        }
        if report.render_finished_work() != report.commit_current()
            || report.commit_current() != report.store_current()
            || report.commit_previous_current() != report.render_current()
            || !report.current_root_matches_commit()
            || !report.finished_work_matches_current_root()
        {
            return Err("direct-multi-child-host-text-current-root-mismatch");
        }
        if report.render_lanes_bits() == 0
            || report.render_lanes_bits() != report.commit_finished_lanes_bits()
            || report.commit_remaining_lanes_bits() != 0
            || report.commit_pending_lanes_bits() != 0
            || !report.lanes_match()
        {
            return Err("direct-multi-child-host-text-current-fiber-lane-mismatch");
        }
        if report.stable_text_sibling() != Some(report.placed_text_fiber())
            || report.placed_text_sibling().is_some()
            || report.host_component_state_node_raw() == 0
            || report.placed_text_state_node_raw() == 0
            || report.host_component_element_type_raw() == 0
            || report.host_component_props_raw() == 0
            || report.stable_text_props_raw() == 0
            || report.placed_text_props_raw() == 0
            || !report.current_child_topology_matches_output()
        {
            return Err("direct-multi-child-host-text-current-child-topology-mismatch");
        }
        if !report.route_evidence_accepted()
            || !report.lifecycle_evidence_accepted()
            || !report.identity_evidence_accepted()
            || !report.row_identity_accepted()
            || !report.placement_handoff_accepted()
            || !report.source_owned_current_fiber_inspection_accepted()
        {
            return Err("direct-multi-child-host-text-current-fiber-evidence-not-consumed");
        }
        if report.generic_reconciler_direct_inspection_available()
            || report.broad_multichild_fiber_inspection_available()
        {
            return Err("broad-multichild-fiber-inspection-unexpectedly-open");
        }
        if !report.public_native_package_js_surfaces_blocked() {
            return Err("public-or-native-package-js-compatibility-claim");
        }

        Ok(())
    }

    fn validate_private_to_json_sibling_snapshot_finished_work_identity_blocker_for_diagnostics(
        blocker: TestRendererPrivateToJsonSiblingSnapshotFinishedWorkIdentityBlocker,
    ) -> Result<(), &'static str> {
        if blocker.diagnostic_name()
            != TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_DIAGNOSTIC_NAME
            || blocker.status()
                != TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_STATUS
        {
            return Err("sibling-snapshot-identity-blocker-diagnostic-mismatch");
        }
        if blocker.source_execution_record_id()
            != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
            || blocker.source_execution_status()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
        {
            return Err("sibling-snapshot-identity-blocker-route-mismatch");
        }
        if blocker.host_output_row().id()
            != TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
            || blocker.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || blocker.host_output_shape() != TestRendererPrivateToJsonHostOutputShape::SiblingText
            || !blocker.host_output_row().public_blockers().all_blocked()
            || !blocker
                .host_output_row()
                .dependency_diagnostics()
                .public_surfaces_blocked()
        {
            return Err("sibling-snapshot-identity-blocker-row-mismatch");
        }
        if !blocker.snapshot_based_host_output_row() {
            return Err("sibling-snapshot-identity-blocker-not-snapshot-based");
        }
        if blocker.committed_sibling_text_fiber_inspection_available()
            || blocker.committed_sibling_text_report_shape_available()
            || blocker.real_sibling_text_handoff_available()
        {
            return Err("sibling-snapshot-identity-binding-unexpectedly-open");
        }
        if blocker.consumes_committed_host_root_finished_work_identity()
            || blocker.consumes_committed_host_root_finished_work_lanes()
            || blocker.identity_admission_available()
        {
            return Err("sibling-snapshot-finished-work-identity-admitted");
        }
        if blocker.candidate_identity_plausible_for_update_to_json()
            && !blocker.plausible_finished_work_identity_rejected()
        {
            return Err("sibling-snapshot-plausible-identity-not-rejected");
        }
        if blocker.rejection_reason()
            != TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_REASON
            || !blocker.identity_admission_blocked()
        {
            return Err("sibling-snapshot-identity-blocker-reason-mismatch");
        }
        if blocker.public_to_json_available()
            || blocker.public_serialization_available()
            || blocker.public_route_available()
            || blocker.native_bridge_available()
            || blocker.native_execution_available()
            || blocker.package_compatibility_claimed()
        {
            return Err("public-or-native-compatibility-claim");
        }

        Ok(())
    }

    fn private_unmount_nested_source_report_gate_error(
        reason: &'static str,
    ) -> TestRendererRootError {
        TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
            reason,
        }
        .into()
    }

    fn private_unmount_nested_source_report_gate_identity_error(
        reason: &'static str,
    ) -> TestRendererRootError {
        if reason == "public-or-native-compatibility-claim" {
            return TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
                reason: "public-or-native-package-js-compatibility-claim",
            }
            .into();
        }

        Self::private_unmount_nested_source_report_gate_error(reason)
    }

    fn validate_private_unmount_nested_source_report_nested_route_for_canary(
        nested_root: &Self,
        nested_output: &TestRendererNestedHostParentPlacedHostOutput,
        route: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<(), TestRendererRootError> {
        if route.record_id() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
            || route.status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
            || route.root() != nested_root.root_id
            || route.public_surface() != "create().update"
            || route.request_api() != "TestRendererRoot::update"
            || route.source_diagnostic_name() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME
            || route.source_diagnostic_status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS
            || route.lifecycle() != TestRendererRootLifecycle::Active
            || route.lifecycle() != nested_root.lifecycle
            || route.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || route.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || route.scheduled_update_sequence() != nested_output.scheduled_update_sequence()
            || route.scheduled_update_sequence() != nested_root.scheduled_updates.len()
        {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-route-admission-mismatch",
            ));
        }
        if !route.consumes_accepted_host_root_update_queue_metadata()
            || !route.consumes_accepted_root_work_loop_metadata()
            || !route.consumes_accepted_host_output_metadata()
            || !route.rejects_stale_root_lifecycle()
            || !route.rejects_stale_host_output()
            || !route.rejects_missing_update_queue_evidence()
        {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-route-admission-evidence-missing",
            ));
        }
        if route.public_root_update_available()
            || route.public_serialization_available()
            || route.native_execution_available()
            || route.compatibility_claimed()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
                    reason: "public-or-native-package-js-compatibility-claim",
                }
                .into(),
            );
        }

        Ok(())
    }

    fn validate_private_unmount_nested_source_report_unmount_admission_for_canary(
        unmount_root: &Self,
        admission: TestRendererUnmountNativeBridgeAdmission,
    ) -> Result<(), TestRendererRootError> {
        if admission.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
            || admission.status() != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS
            || admission.root() != unmount_root.root_id
            || admission.route_dependency_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
            || admission.deletion_commit_handoff_id()
                != TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
            || admission.cleanup_handoff_id()
                != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID
            || admission.lifecycle() != TestRendererRootLifecycle::UnmountScheduled
            || admission.lifecycle() != unmount_root.lifecycle
            || admission.scheduled_update_kind() != TestRendererRootUpdateKind::Unmount
            || !admission.scheduled_element_is_none()
            || admission.scheduled_update_sequence() != unmount_root.scheduled_updates.len()
        {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "unmount-route-admission-mismatch",
            ));
        }
        if !admission.deletion_commit_handoff_accepted()
            || !admission.cleanup_handoff_accepted()
            || !admission.lifecycle_evidence_accepted()
            || !admission.cleanup_blockers_accepted()
            || !admission.passive_ref_cleanup_order_accepted()
            || !admission.native_cleanup_after_ref_and_passive_ordering()
            || !admission.rust_unmount_cleanup_handoff_executed()
            || !admission.host_output_produced()
        {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "unmount-route-admission-evidence-missing",
            ));
        }
        if admission.public_unmount_compatibility_claimed()
            || admission.public_host_teardown_compatibility_claimed()
            || admission.act_flushing_claimed()
            || admission.native_bridge_available()
            || admission.native_execution()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
                    reason: "public-or-native-package-js-compatibility-claim",
                }
                .into(),
            );
        }

        Ok(())
    }

    fn validate_private_unmount_nested_source_report_ownership_for_canary(
        output: &TestRendererNestedHostParentPlacedHostOutput,
        route: TestRendererPrivateUpdateRouteAdmissionRecord,
        report: &TestRendererPrivateJsonSerializationReport,
        identity: TestRendererPrivateSerializationFinishedWorkIdentityGate,
    ) -> Result<(), TestRendererRootError> {
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

        if report.diagnostic_name() != TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
            || report.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || report.host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::NestedHostText
            || report.root_node_kind() != TestRendererPrivateJsonNodeKind::HostComponent
            || report.root_child_count() != 1
            || report.node_count() != 4
            || !report.host_output_snapshot_current()
            || !report.public_blockers().all_blocked()
        {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-ownership-mismatch",
            ));
        }
        let Some(row) = report.host_output_row() else {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-row-missing",
            ));
        };
        if row.id() != TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID
            || row.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || row.host_output_shape() != TestRendererPrivateToJsonHostOutputShape::NestedHostText
            || !row.public_blockers().all_blocked()
            || !row.dependency_diagnostics().public_surfaces_blocked()
        {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-row-mismatch",
            ));
        }

        let Some(inspection) = report.gate().fiber_inspection() else {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-ownership-mismatch",
            ));
        };
        if inspection != output.fiber_inspection()
            || inspection.current() != output.commit().current()
            || inspection.root_children().len() != 1
            || inspection.host_components().len() != 2
            || inspection.host_texts().len() != 2
            || report.gate().commit().current() != identity.report_finished_work()
            || report.gate().commit().finished_lanes_bits() != identity.report_finished_lanes_bits()
        {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-ownership-mismatch",
            ));
        }

        let snapshot_children = output.snapshot().children();
        let [TestNodeSnapshot::Element(outer_snapshot)] = snapshot_children else {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-ownership-mismatch",
            ));
        };
        let [TestNodeSnapshot::Element(inner_snapshot)] = outer_snapshot.children() else {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-ownership-mismatch",
            ));
        };
        let [
            TestNodeSnapshot::Text(stable_text),
            TestNodeSnapshot::Text(placed_text),
        ] = inner_snapshot.children()
        else {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-ownership-mismatch",
            ));
        };

        let nodes = report.nodes();
        let outer = &nodes[0];
        let inner = &nodes[1];
        let stable = &nodes[2];
        let placed = &nodes[3];
        let stable_text_fiber = inspection.host_texts()[0].fiber();
        let placed_text_fiber = inspection.host_texts()[1].fiber();
        if outer.node_kind() != TestRendererPrivateJsonNodeKind::HostComponent
            || outer.parent_ordinal().is_some()
            || outer.child_ordinals() != [1]
            || outer.fiber().fiber() != fiber_handle!(output.outer_fibers().component())
            || inner.node_kind() != TestRendererPrivateJsonNodeKind::HostComponent
            || inner.parent_ordinal() != Some(0)
            || inner.child_ordinals() != [2, 3]
            || inner.fiber().fiber() != fiber_handle!(output.inner_fibers().component())
            || stable.node_kind() != TestRendererPrivateJsonNodeKind::Text
            || stable.parent_ordinal() != Some(1)
            || !stable.child_ordinals().is_empty()
            || stable.text() != Some(stable_text.text())
            || stable.fiber().fiber() != fiber_handle!(output.inner_fibers().text())
            || stable.fiber().fiber() != fiber_handle!(stable_text_fiber)
            || placed.node_kind() != TestRendererPrivateJsonNodeKind::Text
            || placed.parent_ordinal() != Some(1)
            || !placed.child_ordinals().is_empty()
            || placed.text() != Some(placed_text.text())
            || placed.fiber().fiber() != fiber_handle!(placed_text_fiber)
        {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-ownership-mismatch",
            ));
        }

        if identity.root() != route.root()
            || identity.root_scheduled_update_sequence() != route.scheduled_update_sequence()
            || identity.render_current() != route.render_current()
            || identity.render_finished_work() != route.render_finished_work()
            || identity.commit_previous_current() != route.commit_previous_current()
            || identity.commit_current() != route.commit_current()
            || identity.report_finished_work() != route.commit_current()
            || identity.render_lanes_bits() != route.render_lanes_bits()
            || identity.commit_finished_lanes_bits() != route.commit_finished_lanes_bits()
            || identity.report_finished_lanes_bits() != route.commit_finished_lanes_bits()
        {
            return Err(Self::private_unmount_nested_source_report_gate_error(
                "nested-source-report-identity-route-mismatch",
            ));
        }

        Ok(())
    }

    fn validate_private_unmount_nested_source_report_admission_gate_for_canary(
        gate: TestRendererPrivateUnmountNestedSourceReportAdmissionGate,
    ) -> Result<(), &'static str> {
        if gate.diagnostic_name()
            != TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_DIAGNOSTIC_NAME
            || gate.status() != TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_STATUS
        {
            return Err("unmount-nested-source-report-gate-diagnostic-mismatch");
        }
        if gate.nested_renderer_id == gate.unmount_renderer_id
            || gate.nested_scheduled_update_sequence() == 0
            || gate.unmount_scheduled_update_sequence() == 0
        {
            return Err("unmount-nested-source-report-gate-root-pair-mismatch");
        }
        if gate.nested_route_record_id() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
            || gate.nested_route_status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
            || gate.unmount_admission_record_id()
                != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
            || gate.unmount_admission_status()
                != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS
            || gate.nested_identity_diagnostic_name()
                != TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME
            || gate.nested_identity_public_surface() != "create().toJSON"
            || gate.nested_identity_source_serialization_diagnostic_name()
                != TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
            || gate.unmount_identity_diagnostic_name()
                != TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME
            || gate.unmount_identity_public_surface() != "create().unmount -> create().toJSON"
            || gate.unmount_identity_source_serialization_diagnostic_name()
                != TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
            || gate.nested_source_report_diagnostic_name()
                != TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
            || gate.nested_host_output_row_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID
            || gate.unmount_host_output_row_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
        {
            return Err("unmount-nested-source-report-gate-source-mismatch");
        }
        if gate.nested_host_output_shape()
            != TestRendererPrivateToJsonHostOutputShape::NestedHostText
            || gate.unmount_host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::EmptyRoot
            || gate.nested_source_node_count() != 4
            || gate.nested_host_component_count() != 2
            || gate.nested_host_text_count() != 2
            || gate.unmount_host_node_cleanup_count() == 0
            || gate.unmount_cleanup_order_record_count() < gate.unmount_host_node_cleanup_count()
        {
            return Err("unmount-nested-source-report-gate-shape-mismatch");
        }
        if !gate.nested_identity_accepted()
            || !gate.unmount_identity_accepted()
            || !gate.nested_route_admission_accepted()
            || !gate.unmount_route_admission_accepted()
            || !gate.nested_committed_source_report_ownership_accepted()
            || !gate.unmount_deletion_cleanup_metadata_accepted()
            || !gate.consumes_worker_736_nested_source_report_identity()
            || !gate.consumes_worker_733_unmount_identity()
        {
            return Err("unmount-nested-source-report-gate-evidence-not-consumed");
        }
        if gate.broad_multichild_identity_available() {
            return Err("broad-multichild-identity-unexpectedly-open");
        }
        if !gate.public_native_package_js_surfaces_blocked() {
            return Err("public-or-native-package-js-compatibility-claim");
        }

        Ok(())
    }

    fn validate_private_unmount_nested_source_report_gate_for_native_execution_canary(
        &self,
        gate: TestRendererPrivateUnmountNestedSourceReportAdmissionGate,
        execution: TestRendererUnmountNativeBridgeAdmission,
        row: TestRendererPrivateToJsonHostOutputRow,
    ) -> Result<(), &'static str> {
        Self::validate_private_unmount_nested_source_report_admission_gate_for_canary(gate)?;
        if !gate.private_admission_ready()
            || gate.unmount_root() != self.root_id
            || gate.unmount_admission_record_id() != execution.diagnostic_id()
            || gate.unmount_admission_status() != execution.status()
            || gate.unmount_renderer_id != self.renderer.renderer_id
            || gate.unmount_scheduled_update_sequence() != self.scheduled_updates.len()
            || gate.unmount_scheduled_update_sequence() != execution.scheduled_update_sequence()
            || gate.unmount_host_output_row_id() != row.id()
            || gate.unmount_host_output_shape() != row.host_output_shape()
            || gate.unmount_host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::EmptyRoot
            || gate.unmount_host_node_cleanup_count() != execution.host_node_cleanup_count()
            || gate.unmount_cleanup_order_record_count() != execution.cleanup_order_record_count()
            || gate.nested_renderer_id == gate.unmount_renderer_id
            || gate.nested_source_report_diagnostic_name()
                != TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
            || gate.nested_host_output_row_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID
            || gate.nested_host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::NestedHostText
            || gate.nested_source_node_count() != 4
            || gate.nested_host_component_count() != 2
            || gate.nested_host_text_count() != 2
            || row.id() != TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
            || row.host_output_update_kind() != TestRendererRootUpdateKind::Unmount
            || row.current_root_child_count() != 0
            || row.current_host_component_count() != 0
            || row.current_host_text_count() != 0
            || !row.dependency_diagnostics().public_surfaces_blocked()
            || !execution.rust_unmount_cleanup_handoff_executed()
            || !execution.host_output_produced()
            || execution.native_bridge_available()
            || execution.native_execution()
        {
            return Err(
                TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISMATCH_REASON,
            );
        }

        Ok(())
    }

    fn validate_private_update_native_execution_matches_handoff_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
        identity: TestRendererPrivateSerializationFinishedWorkIdentityGate,
    ) -> Result<(), &'static str> {
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

        let render = output.render();
        let commit = output.commit();
        if execution.scheduled_update_sequence() != output.scheduled_update_sequence()
            || identity.root_scheduled_update_sequence() != output.scheduled_update_sequence()
            || output.scheduled_update_sequence() != self.scheduled_updates.len()
        {
            return Err("update-admission-handoff-mismatch");
        }

        if execution.render_current() != fiber_handle!(render.current())
            || execution.render_finished_work() != fiber_handle!(render.finished_work())
            || execution.commit_previous_current() != fiber_handle!(commit.previous_current())
            || execution.commit_current() != fiber_handle!(commit.current())
        {
            return Err("update-admission-handoff-mismatch");
        }

        if execution.render_current() != identity.render_current()
            || execution.render_finished_work() != identity.render_finished_work()
            || execution.commit_previous_current() != identity.commit_previous_current()
            || execution.commit_current() != identity.commit_current()
        {
            return Err("update-admission-finished-work-identity-mismatch");
        }

        if execution.render_lanes_bits() == 0
            || execution.render_lanes_bits() != render.render_lanes().bits()
            || execution.commit_finished_lanes_bits() != commit.finished_lanes().bits()
        {
            return Err("update-admission-lane-mismatch");
        }

        if execution.render_lanes_bits() != identity.render_lanes_bits()
            || execution.commit_finished_lanes_bits() != identity.commit_finished_lanes_bits()
        {
            return Err("update-admission-finished-work-identity-lane-mismatch");
        }

        Ok(())
    }

    fn validate_private_nested_update_native_execution_matches_handoff_for_canary(
        &self,
        output: &TestRendererNestedHostParentPlacedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
        identity: TestRendererPrivateSerializationFinishedWorkIdentityGate,
    ) -> Result<(), &'static str> {
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

        let render = output.render();
        let commit = output.commit();
        if execution.scheduled_update_sequence() != output.scheduled_update_sequence()
            || identity.root_scheduled_update_sequence() != output.scheduled_update_sequence()
            || output.scheduled_update_sequence() != self.scheduled_updates.len()
        {
            return Err("update-admission-handoff-mismatch");
        }

        if execution.render_current() != fiber_handle!(render.current())
            || execution.render_finished_work() != fiber_handle!(render.finished_work())
            || execution.commit_previous_current() != fiber_handle!(commit.previous_current())
            || execution.commit_current() != fiber_handle!(commit.current())
        {
            return Err("update-admission-handoff-mismatch");
        }

        if execution.render_current() != identity.render_current()
            || execution.render_finished_work() != identity.render_finished_work()
            || execution.commit_previous_current() != identity.commit_previous_current()
            || execution.commit_current() != identity.commit_current()
        {
            return Err("update-admission-finished-work-identity-mismatch");
        }

        if execution.render_lanes_bits() == 0
            || execution.render_lanes_bits() != render.render_lanes().bits()
            || execution.commit_finished_lanes_bits() != commit.finished_lanes().bits()
        {
            return Err("update-admission-lane-mismatch");
        }

        if execution.render_lanes_bits() != identity.render_lanes_bits()
            || execution.commit_finished_lanes_bits() != identity.commit_finished_lanes_bits()
        {
            return Err("update-admission-finished-work-identity-lane-mismatch");
        }

        Ok(())
    }

    fn validate_private_unmount_native_execution_matches_handoff_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
        execution: TestRendererUnmountNativeBridgeAdmission,
        identity: TestRendererPrivateSerializationFinishedWorkIdentityGate,
        row: TestRendererPrivateToJsonHostOutputRow,
    ) -> Result<(), &'static str> {
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

        let render = output.render();
        let commit = output.commit();
        if execution.scheduled_update_sequence() != self.scheduled_updates.len()
            || identity.root_scheduled_update_sequence() != self.scheduled_updates.len()
            || execution.root() != self.root_id
            || commit.root() != self.root_id
            || render.root() != self.root_id
            || execution.lifecycle() != TestRendererRootLifecycle::UnmountScheduled
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Unmount
            || !execution.scheduled_element_is_none()
        {
            return Err("unmount-admission-handoff-mismatch");
        }

        if row.host_output_update_kind() != TestRendererRootUpdateKind::Unmount
            || row.host_output_shape() != TestRendererPrivateToJsonHostOutputShape::EmptyRoot
            || row.current_root_child_count() != 0
            || row.current_host_component_count() != 0
            || row.current_host_text_count() != 0
            || !row.dependency_diagnostics().host_output_snapshot_current()
            || !output.snapshot().children().is_empty()
            || output.deleted_fibers().host_root() != commit.current()
        {
            return Err("unmount-admission-host-output-row-mismatch");
        }

        if execution.render_current() != fiber_handle!(render.current())
            || execution.render_finished_work() != fiber_handle!(render.finished_work())
            || execution.commit_previous_current() != fiber_handle!(commit.previous_current())
            || execution.commit_current() != fiber_handle!(commit.current())
        {
            return Err("unmount-admission-handoff-mismatch");
        }

        if execution.render_current() != identity.render_current()
            || execution.render_finished_work() != identity.render_finished_work()
            || execution.commit_previous_current() != identity.commit_previous_current()
            || execution.commit_current() != identity.commit_current()
        {
            return Err("unmount-admission-finished-work-identity-mismatch");
        }

        if execution.render_lanes_bits() == 0
            || execution.render_lanes_bits() != render.render_lanes().bits()
            || execution.commit_finished_lanes_bits() != commit.finished_lanes().bits()
            || render.render_lanes().bits() != commit.finished_lanes().bits()
        {
            return Err("unmount-admission-lane-mismatch");
        }

        if execution.render_lanes_bits() != identity.render_lanes_bits()
            || execution.commit_finished_lanes_bits() != identity.commit_finished_lanes_bits()
        {
            return Err("unmount-admission-finished-work-identity-lane-mismatch");
        }

        let passive_ref_cleanup_order =
            Self::passive_ref_cleanup_order_evidence_for_canary(commit, output.host_node_cleanup());
        if execution.host_node_cleanup_count() != output.host_node_cleanup().len()
            || execution.ref_cleanup_return_count()
                != passive_ref_cleanup_order.ref_cleanup_return_count()
            || execution.passive_destroy_count()
                != passive_ref_cleanup_order.passive_destroy_count()
            || execution.cleanup_order_record_count()
                != commit.deletion_cleanup_order_gate_for_canary().len()
            || execution.cleanup_order_record_count()
                != passive_ref_cleanup_order.cleanup_order_record_count()
            || execution.native_cleanup_after_ref_and_passive_ordering()
                != passive_ref_cleanup_order.native_cleanup_after_ref_and_passive_ordering()
            || !execution.rust_unmount_cleanup_handoff_executed()
            || !execution.host_output_produced()
        {
            return Err("unmount-admission-cleanup-handoff-mismatch");
        }

        Ok(())
    }

    fn validate_private_to_json_create_native_execution_record_for_canary(
        &self,
        execution: TestRendererPrivateCreateRouteAdmissionDiagnostics,
    ) -> Result<(), TestRendererRootError> {
        if execution.record_id() != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID {
            return self
                .private_to_json_native_execution_record_error("create", "record-id-mismatch");
        }
        if execution.status() != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS {
            return self.private_to_json_native_execution_record_error("create", "status-mismatch");
        }
        if execution.operation() != "create"
            || execution.public_surface() != "create()"
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Create
            || execution.rust_outcome() != "Scheduled"
        {
            return self
                .private_to_json_native_execution_record_error("create", "route-metadata-stale");
        }
        if !execution.consumes_accepted_rust_root_create_execution_evidence()
            || !execution.consumes_accepted_rust_root_create_preflight_diagnostics()
            || !execution.consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata()
        {
            return self.private_to_json_native_execution_record_error(
                "create",
                "accepted-rust-create-evidence-missing",
            );
        }
        if execution.public_renderer_root_created()
            || execution.public_root_available()
            || execution.public_create_behavior_available()
            || execution.public_serialization_available()
            || execution.native_addon_loaded()
            || execution.native_bridge_available()
            || execution.native_execution()
            || execution.rust_execution_from_js()
            || execution.reconciler_execution_from_js()
            || execution.host_output_produced_from_js()
            || execution.compatibility_claimed()
        {
            return self.private_to_json_native_execution_record_error(
                "create",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn validate_private_to_json_update_native_execution_record_for_canary(
        &self,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<(), TestRendererRootError> {
        if execution.record_id() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID {
            return self
                .private_to_json_native_execution_record_error("update", "record-id-mismatch");
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS {
            return self.private_to_json_native_execution_record_error("update", "status-mismatch");
        }
        if execution.root() != self.root_id
            || execution.renderer_id() != self.renderer.renderer_id
            || execution.public_surface() != "create().update"
            || execution.request_api() != "TestRendererRoot::update"
            || execution.source_diagnostic_name()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME
            || execution.source_diagnostic_status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS
            || execution.lifecycle() != TestRendererRootLifecycle::Active
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Update
        {
            return self
                .private_to_json_native_execution_record_error("update", "route-metadata-stale");
        }
        if !execution.consumes_accepted_host_root_update_queue_metadata()
            || !execution.consumes_accepted_root_work_loop_metadata()
            || !execution.consumes_accepted_host_output_metadata()
        {
            return self.private_to_json_native_execution_record_error(
                "update",
                "accepted-update-evidence-missing",
            );
        }
        if execution.public_root_update_available()
            || execution.public_serialization_available()
            || execution.native_execution_available()
            || execution.compatibility_claimed()
        {
            return self.private_to_json_native_execution_record_error(
                "update",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn validate_private_to_json_unmount_native_execution_record_for_canary(
        &self,
        execution: TestRendererUnmountNativeBridgeAdmission,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        {
            return self
                .private_to_json_native_execution_record_error("unmount", "record-id-mismatch");
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS {
            return self
                .private_to_json_native_execution_record_error("unmount", "status-mismatch");
        }
        if execution.root() != self.root_id
            || execution.route_dependency_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
            || execution.deletion_commit_handoff_id()
                != TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
            || execution.cleanup_handoff_id()
                != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID
            || execution.lifecycle() != TestRendererRootLifecycle::UnmountScheduled
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Unmount
            || !execution.scheduled_element_is_none()
        {
            return self
                .private_to_json_native_execution_record_error("unmount", "route-metadata-stale");
        }
        if !execution.deletion_commit_handoff_accepted()
            || !execution.cleanup_handoff_accepted()
            || !execution.lifecycle_evidence_accepted()
            || !execution.cleanup_blockers_accepted()
            || !execution.passive_ref_cleanup_order_accepted()
            || !execution.native_cleanup_after_ref_and_passive_ordering()
            || !execution.rust_unmount_cleanup_handoff_executed()
            || !execution.host_output_produced()
        {
            return self.private_to_json_native_execution_record_error(
                "unmount",
                "accepted-unmount-evidence-missing",
            );
        }
        if execution.public_unmount_compatibility_claimed()
            || execution.public_host_teardown_compatibility_claimed()
            || execution.act_flushing_claimed()
            || execution.native_bridge_available()
            || execution.native_execution()
        {
            return self.private_to_json_native_execution_record_error(
                "unmount",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn private_to_json_native_execution_record_error<T>(
        &self,
        operation: &'static str,
        reason: &'static str,
    ) -> Result<T, TestRendererRootError> {
        Err(
            TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                operation,
                reason,
            }
            .into(),
        )
    }

    fn validate_private_to_tree_create_native_execution_record_for_canary(
        &self,
        execution: TestRendererPrivateCreateRouteAdmissionDiagnostics,
    ) -> Result<(), TestRendererRootError> {
        if execution.record_id() != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID {
            return self
                .private_to_tree_native_execution_record_error("create", "record-id-mismatch");
        }
        if execution.status() != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS {
            return self.private_to_tree_native_execution_record_error("create", "status-mismatch");
        }
        if execution.operation() != "create"
            || execution.public_surface() != "create()"
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Create
            || execution.rust_outcome() != "Scheduled"
        {
            return self
                .private_to_tree_native_execution_record_error("create", "route-metadata-stale");
        }
        if !execution.consumes_accepted_rust_root_create_execution_evidence()
            || !execution.consumes_accepted_rust_root_create_preflight_diagnostics()
            || !execution.consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata()
        {
            return self.private_to_tree_native_execution_record_error(
                "create",
                "accepted-rust-create-evidence-missing",
            );
        }
        if execution.public_renderer_root_created()
            || execution.public_root_available()
            || execution.public_create_behavior_available()
            || execution.public_serialization_available()
            || execution.native_addon_loaded()
            || execution.native_bridge_available()
            || execution.native_execution()
            || execution.rust_execution_from_js()
            || execution.reconciler_execution_from_js()
            || execution.host_output_produced_from_js()
            || execution.compatibility_claimed()
        {
            return self.private_to_tree_native_execution_record_error(
                "create",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn validate_private_to_tree_update_native_execution_record_for_canary(
        &self,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<(), TestRendererRootError> {
        if execution.record_id() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID {
            return self
                .private_to_tree_native_execution_record_error("update", "record-id-mismatch");
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS {
            return self.private_to_tree_native_execution_record_error("update", "status-mismatch");
        }
        if execution.root() != self.root_id
            || execution.renderer_id() != self.renderer.renderer_id
            || execution.public_surface() != "create().update"
            || execution.request_api() != "TestRendererRoot::update"
            || execution.source_diagnostic_name()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME
            || execution.source_diagnostic_status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS
            || execution.lifecycle() != TestRendererRootLifecycle::Active
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Update
        {
            return self
                .private_to_tree_native_execution_record_error("update", "route-metadata-stale");
        }
        if !execution.consumes_accepted_host_root_update_queue_metadata()
            || !execution.consumes_accepted_root_work_loop_metadata()
            || !execution.consumes_accepted_host_output_metadata()
        {
            return self.private_to_tree_native_execution_record_error(
                "update",
                "accepted-update-evidence-missing",
            );
        }
        if execution.public_root_update_available()
            || execution.public_serialization_available()
            || execution.native_execution_available()
            || execution.compatibility_claimed()
        {
            return self.private_to_tree_native_execution_record_error(
                "update",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn validate_private_to_tree_unmount_native_execution_record_for_canary(
        &self,
        execution: TestRendererUnmountNativeBridgeAdmission,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        {
            return self
                .private_to_tree_native_execution_record_error("unmount", "record-id-mismatch");
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS {
            return self
                .private_to_tree_native_execution_record_error("unmount", "status-mismatch");
        }
        if execution.root() != self.root_id
            || execution.route_dependency_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
            || execution.deletion_commit_handoff_id()
                != TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
            || execution.cleanup_handoff_id()
                != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID
            || execution.lifecycle() != TestRendererRootLifecycle::UnmountScheduled
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Unmount
            || !execution.scheduled_element_is_none()
        {
            return self
                .private_to_tree_native_execution_record_error("unmount", "route-metadata-stale");
        }
        if !execution.deletion_commit_handoff_accepted()
            || !execution.cleanup_handoff_accepted()
            || !execution.lifecycle_evidence_accepted()
            || !execution.cleanup_blockers_accepted()
            || !execution.passive_ref_cleanup_order_accepted()
            || !execution.native_cleanup_after_ref_and_passive_ordering()
            || !execution.rust_unmount_cleanup_handoff_executed()
            || !execution.host_output_produced()
        {
            return self.private_to_tree_native_execution_record_error(
                "unmount",
                "accepted-unmount-evidence-missing",
            );
        }
        if execution.public_unmount_compatibility_claimed()
            || execution.public_host_teardown_compatibility_claimed()
            || execution.act_flushing_claimed()
            || execution.native_bridge_available()
            || execution.native_execution()
        {
            return self.private_to_tree_native_execution_record_error(
                "unmount",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn private_to_tree_native_execution_record_error<T>(
        &self,
        operation: &'static str,
        reason: &'static str,
    ) -> Result<T, TestRendererRootError> {
        Err(
            TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                operation,
                reason,
            }
            .into(),
        )
    }

    fn validate_serialization_gate_commit(
        &self,
        commit: &HostRootCommitRecord,
    ) -> Result<(), TestRendererRootError> {
        if commit.root() != self.root_id {
            return Err(TestRendererSerializationGateError::CommitRootMismatch {
                expected: self.root_id,
                actual: commit.root(),
            }
            .into());
        }

        let actual_current = self.store.root(self.root_id)?.current();
        if actual_current != commit.current() {
            let expected_current = commit.current();
            return Err(TestRendererSerializationGateError::CommitIsNotCurrent {
                root: self.root_id,
                expected_current: TestRendererFiberHandleDiagnostics {
                    arena_id: expected_current.arena_id().get(),
                    slot: expected_current.slot().get(),
                    generation: expected_current.generation().get(),
                },
                actual_current: TestRendererFiberHandleDiagnostics {
                    arena_id: actual_current.arena_id().get(),
                    slot: actual_current.slot().get(),
                    generation: actual_current.generation().get(),
                },
            }
            .into());
        }

        Ok(())
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

    fn schedule_root_update(
        &mut self,
        kind: TestRendererRootUpdateKind,
        element: RootElementHandle,
        callback: Option<RootUpdateCallbackHandle>,
    ) -> Result<TestRendererRootScheduledUpdate, TestRendererRootError> {
        let container_update = match kind {
            TestRendererRootUpdateKind::Create | TestRendererRootUpdateKind::Update => {
                update_container(&mut self.store, self.root_id, element, callback)?
            }
            TestRendererRootUpdateKind::Unmount => {
                update_container_sync(&mut self.store, self.root_id, element, callback)?
            }
        };
        let root_schedule = ensure_root_is_scheduled(&mut self.store, container_update.schedule())?;
        Ok(TestRendererRootScheduledUpdate {
            kind,
            element,
            container_update,
            root_schedule,
        })
    }

    fn validate_private_json_canary_current_fibers(
        fiber_inspection: &TestRendererCommittedFiberTreeInspection,
        current: TestRendererPrivateJsonCurrentFibersForCanary,
    ) -> Result<(), TestRendererPrivateJsonSerializationError> {
        match current {
            TestRendererPrivateJsonCurrentFibersForCanary::Host(current) => {
                Self::validate_private_json_host_canary_current_fibers(fiber_inspection, current)
            }
            TestRendererPrivateJsonCurrentFibersForCanary::Nested { outer, inner } => {
                Self::validate_private_json_nested_canary_current_fibers(
                    fiber_inspection,
                    outer,
                    inner,
                )
            }
            TestRendererPrivateJsonCurrentFibersForCanary::SiblingText {
                root_text,
                root_text_props_raw,
                component,
            } => Self::validate_private_json_sibling_text_canary_current_fibers(
                fiber_inspection,
                root_text,
                root_text_props_raw,
                component,
            ),
        }
    }

    fn validate_private_json_host_canary_current_fibers(
        fiber_inspection: &TestRendererCommittedFiberTreeInspection,
        current: TestRendererHostOutputCanaryCurrentFibers,
    ) -> Result<(), TestRendererPrivateJsonSerializationError> {
        if fiber_inspection.host_component().fiber() != current.component() {
            return Err(
                TestRendererPrivateJsonSerializationError::CommittedFiberMismatch {
                    node_kind: TestRendererPrivateJsonNodeKind::HostComponent,
                },
            );
        }

        if fiber_inspection.host_text().fiber() != current.text() {
            return Err(
                TestRendererPrivateJsonSerializationError::CommittedFiberMismatch {
                    node_kind: TestRendererPrivateJsonNodeKind::Text,
                },
            );
        }

        let fixture = current.fixture();
        let component = fiber_inspection.host_component();
        let text = fiber_inspection.host_text();
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "element_type",
            fixture.element_type_raw(),
            component.element_type().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "pending_props",
            fixture.component_props_raw(),
            component.pending_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "memoized_props",
            fixture.component_props_raw(),
            component.memoized_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::Text,
            "pending_props",
            fixture.text_props_raw(),
            text.pending_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::Text,
            "memoized_props",
            fixture.text_props_raw(),
            text.memoized_props().raw(),
        )?;

        Ok(())
    }

    fn validate_private_json_nested_canary_current_fibers(
        fiber_inspection: &TestRendererCommittedFiberTreeInspection,
        outer: TestRendererHostOutputCanaryCurrentFibers,
        inner: TestRendererHostOutputCanaryCurrentFibers,
    ) -> Result<(), TestRendererPrivateJsonSerializationError> {
        if !fiber_inspection.is_nested_host_component_shape()
            || fiber_inspection.host_components().len() != 2
            || fiber_inspection.host_texts().len() != 2
        {
            return Err(
                TestRendererPrivateJsonSerializationError::CommittedFiberMismatch {
                    node_kind: TestRendererPrivateJsonNodeKind::HostComponent,
                },
            );
        }

        let outer_component = fiber_inspection.host_components()[0];
        let inner_component = fiber_inspection.host_components()[1];
        let stable_text = fiber_inspection.host_texts()[0];
        let placed_text = fiber_inspection.host_texts()[1];

        if outer_component.fiber() != outer.component()
            || inner_component.fiber() != inner.component()
            || stable_text.fiber() != inner.text()
        {
            return Err(
                TestRendererPrivateJsonSerializationError::CommittedFiberMismatch {
                    node_kind: TestRendererPrivateJsonNodeKind::HostComponent,
                },
            );
        }

        let outer_fixture = outer.fixture();
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "element_type",
            outer_fixture.element_type_raw(),
            outer_component.element_type().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "pending_props",
            outer_fixture.component_props_raw(),
            outer_component.pending_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "memoized_props",
            outer_fixture.component_props_raw(),
            outer_component.memoized_props().raw(),
        )?;

        let inner_fixture = inner.fixture();
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "element_type",
            inner_fixture.element_type_raw(),
            inner_component.element_type().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "pending_props",
            inner_fixture.component_props_raw(),
            inner_component.pending_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "memoized_props",
            inner_fixture.component_props_raw(),
            inner_component.memoized_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::Text,
            "pending_props",
            inner_fixture.text_props_raw(),
            stable_text.pending_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::Text,
            "memoized_props",
            inner_fixture.text_props_raw(),
            stable_text.memoized_props().raw(),
        )?;

        if placed_text.pending_props() != placed_text.memoized_props()
            || !placed_text.state_node_present()
        {
            return Err(
                TestRendererPrivateJsonSerializationError::CommittedFiberMismatch {
                    node_kind: TestRendererPrivateJsonNodeKind::Text,
                },
            );
        }

        Ok(())
    }

    fn validate_private_json_sibling_text_canary_current_fibers(
        fiber_inspection: &TestRendererCommittedFiberTreeInspection,
        root_text: TestRendererFiberHandleDiagnostics,
        root_text_props_raw: u64,
        component: TestRendererHostOutputCanaryCurrentFibers,
    ) -> Result<(), TestRendererPrivateJsonSerializationError> {
        if fiber_inspection.shape_name() != "HostRoot->[HostText,HostComponent->HostText]"
            || fiber_inspection.root_children().len() != 2
            || fiber_inspection.host_components().len() != 1
            || fiber_inspection.host_texts().len() != 2
        {
            return Err(
                TestRendererPrivateJsonSerializationError::CommittedFiberMismatch {
                    node_kind: TestRendererPrivateJsonNodeKind::RootArray,
                },
            );
        }

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

        let text_sibling = fiber_inspection.host_texts()[0];
        let host_component = fiber_inspection.host_components()[0];
        let component_text = fiber_inspection.host_texts()[1];
        if fiber_handle!(text_sibling.fiber()) != root_text
            || host_component.fiber() != component.component()
            || component_text.fiber() != component.text()
        {
            return Err(
                TestRendererPrivateJsonSerializationError::CommittedFiberMismatch {
                    node_kind: TestRendererPrivateJsonNodeKind::RootArray,
                },
            );
        }

        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::Text,
            "pending_props",
            root_text_props_raw,
            text_sibling.pending_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::Text,
            "memoized_props",
            root_text_props_raw,
            text_sibling.memoized_props().raw(),
        )?;

        let fixture = component.fixture();
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "element_type",
            fixture.element_type_raw(),
            host_component.element_type().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "pending_props",
            fixture.component_props_raw(),
            host_component.pending_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "memoized_props",
            fixture.component_props_raw(),
            host_component.memoized_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::Text,
            "pending_props",
            fixture.text_props_raw(),
            component_text.pending_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::Text,
            "memoized_props",
            fixture.text_props_raw(),
            component_text.memoized_props().raw(),
        )?;

        Ok(())
    }

    fn validate_private_json_raw_handle(
        node_kind: TestRendererPrivateJsonNodeKind,
        field: &'static str,
        expected: u64,
        actual: u64,
    ) -> Result<(), TestRendererPrivateJsonSerializationError> {
        if actual == expected {
            Ok(())
        } else {
            Err(
                TestRendererPrivateJsonSerializationError::CanaryFixtureRawMismatch {
                    node_kind,
                    field,
                    expected,
                    actual,
                },
            )
        }
    }

    fn private_to_json_host_output_shape_from_snapshot(
        snapshot: &TestContainerSnapshot,
    ) -> TestRendererPrivateToJsonHostOutputShapeDiagnostics {
        let mut host_component_count = 0;
        let mut host_text_count = 0;
        let mut root_text_count = 0;
        let mut max_host_component_depth = 0;

        for child in snapshot.children() {
            Self::collect_private_to_json_host_output_shape(
                child,
                0,
                true,
                &mut host_component_count,
                &mut host_text_count,
                &mut root_text_count,
                &mut max_host_component_depth,
            );
        }

        let shape = if snapshot.children().is_empty() {
            TestRendererPrivateToJsonHostOutputShape::EmptyRoot
        } else if root_text_count > 0 {
            TestRendererPrivateToJsonHostOutputShape::SiblingText
        } else if max_host_component_depth > 1 {
            TestRendererPrivateToJsonHostOutputShape::NestedHostText
        } else if host_text_count > 1 {
            TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
        } else {
            TestRendererPrivateToJsonHostOutputShape::SingleHostText
        };

        TestRendererPrivateToJsonHostOutputShapeDiagnostics {
            shape,
            host_component_count,
            host_text_count,
            root_text_count,
            max_host_component_depth,
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn collect_private_to_json_host_output_shape(
        snapshot: &TestNodeSnapshot,
        host_component_depth: usize,
        is_root_child: bool,
        host_component_count: &mut usize,
        host_text_count: &mut usize,
        root_text_count: &mut usize,
        max_host_component_depth: &mut usize,
    ) {
        match snapshot {
            TestNodeSnapshot::Text(text) => {
                if text.is_hidden() {
                    return;
                }
                *host_text_count += 1;
                if is_root_child {
                    *root_text_count += 1;
                }
            }
            TestNodeSnapshot::Element(element) => {
                if element.is_hidden() || element.is_detached() {
                    return;
                }
                let next_depth = host_component_depth + 1;
                *host_component_count += 1;
                *max_host_component_depth = (*max_host_component_depth).max(next_depth);
                for child in element.children() {
                    Self::collect_private_to_json_host_output_shape(
                        child,
                        next_depth,
                        false,
                        host_component_count,
                        host_text_count,
                        root_text_count,
                        max_host_component_depth,
                    );
                }
            }
        }
    }

    fn private_json_nodes_from_component_and_fibers_for_shape(
        snapshot: &TestContainerSnapshot,
        component: &TestRendererPrivateJsonHostComponentDiagnostic,
        fiber_inspection: &TestRendererCommittedFiberTreeInspection,
        shape: TestRendererPrivateToJsonHostOutputShape,
    ) -> Vec<TestRendererPrivateJsonNodeDiagnostic> {
        match shape {
            TestRendererPrivateToJsonHostOutputShape::SiblingText => {
                Self::private_json_sibling_text_nodes_from_snapshot_and_fibers(
                    snapshot,
                    component,
                    fiber_inspection,
                )
            }
            TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            | TestRendererPrivateToJsonHostOutputShape::EmptyRoot
            | TestRendererPrivateToJsonHostOutputShape::SingleHostText
            | TestRendererPrivateToJsonHostOutputShape::NestedHostText => {
                Self::private_json_nodes_from_component_and_fibers(component, fiber_inspection)
            }
        }
    }

    fn private_json_nodes_from_component_and_fibers(
        component: &TestRendererPrivateJsonHostComponentDiagnostic,
        fiber_inspection: &TestRendererCommittedFiberTreeInspection,
    ) -> Vec<TestRendererPrivateJsonNodeDiagnostic> {
        if let Some(host_child) = component.host_child() {
            return Self::private_json_nested_nodes_from_component_and_fibers(
                component,
                host_child,
                fiber_inspection,
            );
        }

        let child_ordinals: Vec<usize> = (1..=component.text_children().len()).collect();
        let mut nodes = vec![TestRendererPrivateJsonNodeDiagnostic {
            ordinal: 0,
            node_kind: TestRendererPrivateJsonNodeKind::HostComponent,
            parent_ordinal: None,
            child_ordinals,
            fiber: Self::private_json_fiber_diagnostic(fiber_inspection.host_component()),
            element_type: Some(component.element_type().clone()),
            props: Some(component.props().clone()),
            text: None,
            hidden: component.is_hidden(),
            detached: component.is_detached(),
        }];

        for (index, text) in component.text_children().iter().enumerate() {
            nodes.push(TestRendererPrivateJsonNodeDiagnostic {
                ordinal: index + 1,
                node_kind: TestRendererPrivateJsonNodeKind::Text,
                parent_ordinal: Some(0),
                child_ordinals: Vec::new(),
                fiber: Self::private_json_fiber_diagnostic(fiber_inspection.host_texts()[index]),
                element_type: None,
                props: None,
                text: Some(text.text().to_owned()),
                hidden: text.is_hidden(),
                detached: false,
            });
        }

        nodes
    }

    fn private_json_sibling_text_nodes_from_snapshot_and_fibers(
        snapshot: &TestContainerSnapshot,
        component: &TestRendererPrivateJsonHostComponentDiagnostic,
        fiber_inspection: &TestRendererCommittedFiberTreeInspection,
    ) -> Vec<TestRendererPrivateJsonNodeDiagnostic> {
        let host_texts = fiber_inspection.host_texts();
        let host_component = fiber_inspection.host_component();
        let root_text = match &snapshot.children()[0] {
            TestNodeSnapshot::Text(text) => text,
            TestNodeSnapshot::Element(_) => {
                unreachable!("SiblingText shape validation requires a root text child")
            }
        };
        vec![
            TestRendererPrivateJsonNodeDiagnostic {
                ordinal: 0,
                node_kind: TestRendererPrivateJsonNodeKind::Text,
                parent_ordinal: None,
                child_ordinals: Vec::new(),
                fiber: Self::private_json_fiber_diagnostic(host_texts[0]),
                element_type: None,
                props: None,
                text: Some(root_text.text().to_owned()),
                hidden: root_text.is_hidden(),
                detached: false,
            },
            TestRendererPrivateJsonNodeDiagnostic {
                ordinal: 1,
                node_kind: TestRendererPrivateJsonNodeKind::HostComponent,
                parent_ordinal: None,
                child_ordinals: vec![2],
                fiber: Self::private_json_fiber_diagnostic(host_component),
                element_type: Some(component.element_type().clone()),
                props: Some(component.props().clone()),
                text: None,
                hidden: component.is_hidden(),
                detached: component.is_detached(),
            },
            TestRendererPrivateJsonNodeDiagnostic {
                ordinal: 2,
                node_kind: TestRendererPrivateJsonNodeKind::Text,
                parent_ordinal: Some(1),
                child_ordinals: Vec::new(),
                fiber: Self::private_json_fiber_diagnostic(host_texts[1]),
                element_type: None,
                props: None,
                text: Some(component.text_child().text().to_owned()),
                hidden: component.text_child().is_hidden(),
                detached: false,
            },
        ]
    }

    fn private_json_nested_nodes_from_component_and_fibers(
        component: &TestRendererPrivateJsonHostComponentDiagnostic,
        host_child: &TestRendererPrivateJsonHostComponentDiagnostic,
        fiber_inspection: &TestRendererCommittedFiberTreeInspection,
    ) -> Vec<TestRendererPrivateJsonNodeDiagnostic> {
        let host_components = fiber_inspection.host_components();
        let host_texts = fiber_inspection.host_texts();
        let child_ordinals: Vec<usize> = (2..2 + host_child.text_children().len()).collect();
        let mut nodes = vec![
            TestRendererPrivateJsonNodeDiagnostic {
                ordinal: 0,
                node_kind: TestRendererPrivateJsonNodeKind::HostComponent,
                parent_ordinal: None,
                child_ordinals: vec![1],
                fiber: Self::private_json_fiber_diagnostic(host_components[0]),
                element_type: Some(component.element_type().clone()),
                props: Some(component.props().clone()),
                text: None,
                hidden: component.is_hidden(),
                detached: component.is_detached(),
            },
            TestRendererPrivateJsonNodeDiagnostic {
                ordinal: 1,
                node_kind: TestRendererPrivateJsonNodeKind::HostComponent,
                parent_ordinal: Some(0),
                child_ordinals,
                fiber: Self::private_json_fiber_diagnostic(host_components[1]),
                element_type: Some(host_child.element_type().clone()),
                props: Some(host_child.props().clone()),
                text: None,
                hidden: host_child.is_hidden(),
                detached: host_child.is_detached(),
            },
        ];

        for (index, text) in host_child.text_children().iter().enumerate() {
            nodes.push(TestRendererPrivateJsonNodeDiagnostic {
                ordinal: index + 2,
                node_kind: TestRendererPrivateJsonNodeKind::Text,
                parent_ordinal: Some(1),
                child_ordinals: Vec::new(),
                fiber: Self::private_json_fiber_diagnostic(host_texts[index]),
                element_type: None,
                props: None,
                text: Some(text.text().to_owned()),
                hidden: text.is_hidden(),
                detached: false,
            });
        }

        nodes
    }

    fn private_json_rendered_root_from_snapshot_for_shape(
        snapshot: &TestContainerSnapshot,
        component: &TestRendererPrivateJsonHostComponentDiagnostic,
        shape: TestRendererPrivateToJsonHostOutputShape,
    ) -> TestRendererPrivateJsonRenderedRoot {
        match shape {
            TestRendererPrivateToJsonHostOutputShape::SiblingText => {
                Self::describe_private_to_json_host_shape_from_snapshot_for_diagnostics(snapshot)
            }
            TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            | TestRendererPrivateToJsonHostOutputShape::EmptyRoot
            | TestRendererPrivateToJsonHostOutputShape::SingleHostText
            | TestRendererPrivateToJsonHostOutputShape::NestedHostText => {
                Self::private_json_rendered_root_from_component(component)
            }
        }
    }

    fn private_json_rendered_root_from_component(
        component: &TestRendererPrivateJsonHostComponentDiagnostic,
    ) -> TestRendererPrivateJsonRenderedRoot {
        let rendered_children = Self::private_json_rendered_children_from_component(component);
        let children = if rendered_children.is_empty() {
            None
        } else {
            Some(rendered_children)
        };

        TestRendererPrivateJsonRenderedRoot::HostComponent(
            TestRendererPrivateJsonRenderedHostComponent {
                element_type: component.element_type().clone(),
                props: Self::private_json_props_without_children(component.props()),
                children,
            },
        )
    }

    fn private_json_rendered_children_from_component(
        component: &TestRendererPrivateJsonHostComponentDiagnostic,
    ) -> Vec<TestRendererPrivateJsonRenderedRoot> {
        if let Some(host_child) = component.host_child() {
            return vec![Self::private_json_rendered_root_from_component(host_child)];
        }

        component
            .text_children()
            .iter()
            .filter(|text| !text.is_hidden())
            .map(|text| TestRendererPrivateJsonRenderedRoot::Text(text.text().to_owned()))
            .collect()
    }

    pub fn describe_private_to_json_host_shape_from_snapshot_for_diagnostics(
        snapshot: &TestContainerSnapshot,
    ) -> TestRendererPrivateJsonRenderedRoot {
        let children = Self::private_json_rendered_children_from_snapshots(snapshot.children());
        Self::private_json_rendered_root_from_children(children)
    }

    pub fn describe_private_to_tree_host_shape_from_snapshot_for_diagnostics(
        snapshot: &TestContainerSnapshot,
    ) -> TestRendererPrivateTreeRenderedRoot {
        let children = Self::private_tree_rendered_children_from_snapshots(snapshot.children());
        Self::private_tree_rendered_root_from_children(children)
    }

    pub fn describe_private_to_tree_composite_above_host_shape_from_snapshot_for_diagnostics(
        snapshot: &TestContainerSnapshot,
    ) -> TestRendererPrivateTreeRenderedRoot {
        let rendered =
            Self::describe_private_to_tree_host_shape_from_snapshot_for_diagnostics(snapshot);

        TestRendererPrivateTreeRenderedRoot::FunctionComponent(Box::new(
            TestRendererPrivateTreeRenderedFunctionComponent {
                node_type: TestRendererPrivateTreeNodeType::Component,
                component_type: TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE,
                props: TestProps::new(),
                instance_available: false,
                rendered: Box::new(rendered),
                wraps_committed_host_output: true,
            },
        ))
    }

    fn private_json_rendered_root_from_children(
        mut children: Vec<TestRendererPrivateJsonRenderedRoot>,
    ) -> TestRendererPrivateJsonRenderedRoot {
        match children.len() {
            0 => TestRendererPrivateJsonRenderedRoot::Null,
            1 => children.remove(0),
            _ => TestRendererPrivateJsonRenderedRoot::Array(children),
        }
    }

    fn private_json_rendered_children_from_snapshots(
        snapshots: &[TestNodeSnapshot],
    ) -> Vec<TestRendererPrivateJsonRenderedRoot> {
        snapshots
            .iter()
            .filter_map(Self::private_json_rendered_child_from_snapshot)
            .collect()
    }

    fn private_json_rendered_child_from_snapshot(
        snapshot: &TestNodeSnapshot,
    ) -> Option<TestRendererPrivateJsonRenderedRoot> {
        match snapshot {
            TestNodeSnapshot::Text(text) => {
                if text.is_hidden() {
                    None
                } else {
                    Some(TestRendererPrivateJsonRenderedRoot::Text(
                        text.text().to_owned(),
                    ))
                }
            }
            TestNodeSnapshot::Element(element) => {
                if element.is_hidden() || element.is_detached() {
                    return None;
                }

                let rendered_children =
                    Self::private_json_rendered_children_from_snapshots(element.children());
                let children = if rendered_children.is_empty() {
                    None
                } else {
                    Some(rendered_children)
                };

                Some(TestRendererPrivateJsonRenderedRoot::HostComponent(
                    TestRendererPrivateJsonRenderedHostComponent {
                        element_type: element.element_type().clone(),
                        props: Self::private_json_props_without_children(element.props()),
                        children,
                    },
                ))
            }
        }
    }

    fn private_json_props_without_children(props: &TestProps) -> BTreeMap<String, String> {
        props
            .attributes()
            .iter()
            .filter(|(name, _)| name.as_str() != "children")
            .map(|(name, value)| (name.clone(), value.clone()))
            .collect()
    }

    fn private_tree_rendered_root_from_children(
        mut children: Vec<TestRendererPrivateTreeRenderedRoot>,
    ) -> TestRendererPrivateTreeRenderedRoot {
        match children.len() {
            0 => TestRendererPrivateTreeRenderedRoot::Null,
            1 => children.remove(0),
            _ => TestRendererPrivateTreeRenderedRoot::Array(children),
        }
    }

    fn private_tree_rendered_children_from_snapshots(
        snapshots: &[TestNodeSnapshot],
    ) -> Vec<TestRendererPrivateTreeRenderedRoot> {
        let mut rendered = Vec::new();
        for snapshot in snapshots {
            if let Some(child) = Self::private_tree_rendered_child_from_snapshot(snapshot) {
                Self::push_private_tree_rendered_child(&mut rendered, child);
            }
        }
        rendered
    }

    fn push_private_tree_rendered_child(
        rendered: &mut Vec<TestRendererPrivateTreeRenderedRoot>,
        child: TestRendererPrivateTreeRenderedRoot,
    ) {
        match child {
            TestRendererPrivateTreeRenderedRoot::Array(children) => rendered.extend(children),
            TestRendererPrivateTreeRenderedRoot::Null => {}
            other @ (TestRendererPrivateTreeRenderedRoot::Text(_)
            | TestRendererPrivateTreeRenderedRoot::HostComponent(_)
            | TestRendererPrivateTreeRenderedRoot::FunctionComponent(_)) => rendered.push(other),
        }
    }

    fn private_tree_rendered_child_from_snapshot(
        snapshot: &TestNodeSnapshot,
    ) -> Option<TestRendererPrivateTreeRenderedRoot> {
        match snapshot {
            TestNodeSnapshot::Text(text) => {
                if text.is_hidden() {
                    None
                } else {
                    Some(TestRendererPrivateTreeRenderedRoot::Text(
                        text.text().to_owned(),
                    ))
                }
            }
            TestNodeSnapshot::Element(element) => {
                if element.is_hidden() || element.is_detached() {
                    return None;
                }

                Some(TestRendererPrivateTreeRenderedRoot::HostComponent(
                    TestRendererPrivateTreeRenderedHostComponent {
                        node_type: TestRendererPrivateTreeNodeType::Host,
                        element_type: element.element_type().clone(),
                        props: Self::private_json_props_without_children(element.props()),
                        instance_available: false,
                        rendered: Self::private_tree_rendered_children_from_snapshots(
                            element.children(),
                        ),
                    },
                ))
            }
        }
    }

    fn private_json_fiber_diagnostic(
        node: TestRendererCommittedFiberNodeInspection,
    ) -> TestRendererPrivateJsonFiberDiagnostic {
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

        TestRendererPrivateJsonFiberDiagnostic {
            fiber: fiber_handle!(node.fiber()),
            parent: node.parent().map(|fiber| fiber_handle!(fiber)),
            child: node.child().map(|fiber| fiber_handle!(fiber)),
            sibling: node.sibling().map(|fiber| fiber_handle!(fiber)),
            index: node.index(),
            alternate: node.alternate().map(|fiber| fiber_handle!(fiber)),
            pending_props_raw: node.pending_props().raw(),
            memoized_props_raw: node.memoized_props().raw(),
            lanes_bits: node.lanes().bits(),
            child_lanes_bits: node.child_lanes().bits(),
            flags_bits: node.flags().bits(),
            subtree_flags_bits: node.subtree_flags().bits(),
            state_node_present: node.state_node_present(),
        }
    }

    fn private_json_component_from_snapshot_for_shape(
        snapshot: &TestContainerSnapshot,
        shape: TestRendererPrivateToJsonHostOutputShape,
    ) -> Result<
        TestRendererPrivateJsonHostComponentDiagnostic,
        TestRendererPrivateJsonSerializationError,
    > {
        match shape {
            TestRendererPrivateToJsonHostOutputShape::SiblingText => {
                Self::private_json_component_from_sibling_text_snapshot(snapshot)
            }
            TestRendererPrivateToJsonHostOutputShape::MultiChildHostText => {
                Self::private_json_component_from_multi_child_host_text_snapshot(snapshot)
            }
            TestRendererPrivateToJsonHostOutputShape::EmptyRoot
            | TestRendererPrivateToJsonHostOutputShape::SingleHostText
            | TestRendererPrivateToJsonHostOutputShape::NestedHostText => {
                Self::private_json_component_from_snapshot(snapshot)
            }
        }
    }

    fn private_json_component_from_sibling_text_snapshot(
        snapshot: &TestContainerSnapshot,
    ) -> Result<
        TestRendererPrivateJsonHostComponentDiagnostic,
        TestRendererPrivateJsonSerializationError,
    > {
        if snapshot.children().len() != 2 {
            return Err(TestRendererPrivateJsonSerializationError::RootChildCount {
                actual: snapshot.children().len(),
            });
        }

        let TestNodeSnapshot::Text(_) = &snapshot.children()[0] else {
            return Err(TestRendererPrivateJsonSerializationError::RootChildCount {
                actual: snapshot.children().len(),
            });
        };
        let TestNodeSnapshot::Element(element) = &snapshot.children()[1] else {
            return Err(TestRendererPrivateJsonSerializationError::RootChildIsText);
        };
        if element.children().len() != 1 {
            return Err(
                TestRendererPrivateJsonSerializationError::HostComponentChildCount {
                    element_type: element.element_type().clone(),
                    actual: element.children().len(),
                },
            );
        }
        let TestNodeSnapshot::Text(text) = &element.children()[0] else {
            return Err(
                TestRendererPrivateJsonSerializationError::HostComponentChildIsElement {
                    element_type: element.element_type().clone(),
                },
            );
        };

        Ok(Self::private_json_component_from_text_children(
            element,
            vec![Self::private_json_text_from_snapshot(text)],
        ))
    }

    fn private_json_component_from_multi_child_host_text_snapshot(
        snapshot: &TestContainerSnapshot,
    ) -> Result<
        TestRendererPrivateJsonHostComponentDiagnostic,
        TestRendererPrivateJsonSerializationError,
    > {
        if snapshot.children().len() != 1 {
            return Err(TestRendererPrivateJsonSerializationError::RootChildCount {
                actual: snapshot.children().len(),
            });
        }

        let TestNodeSnapshot::Element(element) = &snapshot.children()[0] else {
            return Err(TestRendererPrivateJsonSerializationError::RootChildIsText);
        };
        if element.children().len() < 2 {
            return Err(
                TestRendererPrivateJsonSerializationError::HostComponentChildCount {
                    element_type: element.element_type().clone(),
                    actual: element.children().len(),
                },
            );
        }

        let mut text_children = Vec::with_capacity(element.children().len());
        for child in element.children() {
            let TestNodeSnapshot::Text(text) = child else {
                return Err(
                    TestRendererPrivateJsonSerializationError::HostComponentChildIsElement {
                        element_type: element.element_type().clone(),
                    },
                );
            };
            text_children.push(Self::private_json_text_from_snapshot(text));
        }

        Ok(Self::private_json_component_from_text_children(
            element,
            text_children,
        ))
    }

    fn private_json_component_from_snapshot(
        snapshot: &TestContainerSnapshot,
    ) -> Result<
        TestRendererPrivateJsonHostComponentDiagnostic,
        TestRendererPrivateJsonSerializationError,
    > {
        if snapshot.children().len() != 1 {
            return Err(TestRendererPrivateJsonSerializationError::RootChildCount {
                actual: snapshot.children().len(),
            });
        }

        let TestNodeSnapshot::Element(element) = &snapshot.children()[0] else {
            return Err(TestRendererPrivateJsonSerializationError::RootChildIsText);
        };

        if element.children().len() != 1 {
            return Err(
                TestRendererPrivateJsonSerializationError::HostComponentChildCount {
                    element_type: element.element_type().clone(),
                    actual: element.children().len(),
                },
            );
        }

        match &element.children()[0] {
            TestNodeSnapshot::Text(text) => Ok(Self::private_json_component_from_text_children(
                element,
                vec![Self::private_json_text_from_snapshot(text)],
            )),
            TestNodeSnapshot::Element(inner) => {
                let inner_component = Self::private_json_nested_child_component_from_snapshot(
                    element.element_type(),
                    inner,
                )?;
                let text_child = inner_component.text_child().clone();
                Ok(TestRendererPrivateJsonHostComponentDiagnostic {
                    element_type: element.element_type().clone(),
                    props: element.props().clone(),
                    hidden: element.is_hidden(),
                    detached: element.is_detached(),
                    child_count: element.children().len(),
                    text_child,
                    text_children: Vec::new(),
                    host_child: Some(Box::new(inner_component)),
                })
            }
        }
    }

    fn private_json_nested_child_component_from_snapshot(
        outer_element_type: &TestElementType,
        element: &TestElementSnapshot,
    ) -> Result<
        TestRendererPrivateJsonHostComponentDiagnostic,
        TestRendererPrivateJsonSerializationError,
    > {
        if element.children().len() != 2 {
            return Err(
                TestRendererPrivateJsonSerializationError::HostComponentChildIsElement {
                    element_type: outer_element_type.clone(),
                },
            );
        }

        let mut text_children = Vec::with_capacity(element.children().len());
        for child in element.children() {
            let TestNodeSnapshot::Text(text) = child else {
                return Err(
                    TestRendererPrivateJsonSerializationError::HostComponentChildIsElement {
                        element_type: outer_element_type.clone(),
                    },
                );
            };
            text_children.push(Self::private_json_text_from_snapshot(text));
        }

        Ok(Self::private_json_component_from_text_children(
            element,
            text_children,
        ))
    }

    fn private_json_component_from_text_children(
        element: &TestElementSnapshot,
        text_children: Vec<TestRendererPrivateJsonTextDiagnostic>,
    ) -> TestRendererPrivateJsonHostComponentDiagnostic {
        let text_child = text_children[0].clone();

        TestRendererPrivateJsonHostComponentDiagnostic {
            element_type: element.element_type().clone(),
            props: element.props().clone(),
            hidden: element.is_hidden(),
            detached: element.is_detached(),
            child_count: element.children().len(),
            text_child,
            text_children,
            host_child: None,
        }
    }

    fn private_json_text_from_snapshot(
        text: &TestTextSnapshot,
    ) -> TestRendererPrivateJsonTextDiagnostic {
        TestRendererPrivateJsonTextDiagnostic {
            text: text.text().to_owned(),
            hidden: text.is_hidden(),
        }
    }

    fn private_tree_metadata_from_json_report(
        json_report: TestRendererPrivateJsonSerializationReport,
    ) -> TestRendererPrivateTreeMetadataReport {
        let component = json_report.component();
        let text = component.text_child();

        TestRendererPrivateTreeMetadataReport {
            diagnostic_name: TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
            source_json_diagnostic_name: json_report.diagnostic_name(),
            gate: json_report.gate().clone(),
            host_output_update_kind: json_report.host_output_update_kind(),
            host_output_shape: json_report.host_output_shape(),
            host_output_row: json_report.host_output_row(),
            host_output_snapshot_current: json_report.host_output_snapshot_current(),
            accepted_fiber_shape: TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE,
            accepted_composite_fiber_shape:
                TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE,
            root_child_count: json_report.root_child_count(),
            host_root: TestRendererPrivateTreeHostRootDiagnostic {
                fiber_tag: "HostRoot",
                delegates_to_child: true,
                child_fiber_tag: "HostComponent",
                public_tree_object_available: false,
            },
            function_component: TestRendererPrivateTreeFunctionComponentDiagnostic {
                fiber_tag: "FunctionComponent",
                node_type: TestRendererPrivateTreeNodeType::Component,
                component_type: TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE,
                props: TestProps::new(),
                instance_available: false,
                rendered_child_fiber_tag: "HostComponent",
                rendered_child_node_type: TestRendererPrivateTreeNodeType::Host,
                rendered_child_count: 1,
                wraps_committed_host_output: true,
                public_tree_object_available: false,
            },
            host_component: TestRendererPrivateTreeHostComponentDiagnostic {
                fiber_tag: "HostComponent",
                node_type: TestRendererPrivateTreeNodeType::Host,
                element_type: component.element_type().clone(),
                props: component.props().clone(),
                instance_available: false,
                rendered_child_count: component.child_count(),
                rendered_text: text.text().to_owned(),
                public_tree_object_available: false,
            },
            host_text: TestRendererPrivateTreeHostTextDiagnostic {
                fiber_tag: "HostText",
                text: text.text().to_owned(),
                returns_text_value: true,
                public_tree_object_available: false,
            },
            public_blockers: json_report.public_blockers(),
            public_tree_object_available: false,
        }
    }

    fn private_tree_committed_fiber_inspection_from_report(
        inspection: &TestRendererCommittedFiberTreeInspection,
    ) -> TestRendererPrivateTreeCommittedFiberInspectionReport {
        TestRendererPrivateTreeCommittedFiberInspectionReport {
            diagnostic_name: TEST_RENDERER_PRIVATE_TREE_COMMITTED_FIBER_INSPECTION_DIAGNOSTIC_NAME,
            source_tree_diagnostic_name: TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
            shape_name: inspection.shape_name(),
            fiber_shape: inspection
                .nodes()
                .iter()
                .map(|node| Self::private_fiber_tag_name(*node))
                .collect(),
            root_child_fiber_tags: inspection
                .root_children()
                .iter()
                .map(|node| Self::private_fiber_tag_name(*node))
                .collect(),
            host_child_fiber_tags: inspection
                .host_children()
                .iter()
                .map(|node| Self::private_fiber_tag_name(*node))
                .collect(),
            root_child_count: inspection.root_children().len(),
            host_child_count: inspection.host_children().len(),
            host_component_count: inspection.host_components().len(),
            host_text_count: inspection.host_texts().len(),
            function_component_fiber_tag: inspection
                .function_component()
                .map(Self::private_fiber_tag_name),
            function_component_present: inspection.function_component().is_some(),
            wraps_committed_host_output: inspection.has_function_component_wrapper(),
            accepted_minimal_fiber_shape: TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE,
            accepted_composite_fiber_shape:
                TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE,
            accepted_multi_child_fiber_shape:
                TEST_RENDERER_PRIVATE_TREE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE,
            accepted_composite_multi_child_fiber_shape:
                TEST_RENDERER_PRIVATE_TREE_COMPOSITE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE,
            public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers::blocked(),
            public_tree_object_available: false,
            compatibility_claimed: false,
        }
    }

    fn private_fiber_tag_name(node: TestRendererCommittedFiberNodeInspection) -> String {
        format!("{:?}", node.tag())
    }

    fn private_test_instance_find_all_query_from_tree_report(
        tree_report: &TestRendererPrivateTreeMetadataReport,
    ) -> TestRendererPrivateTestInstanceFindAllQueryDiagnostics {
        let host_component = tree_report.host_component();
        let host_text = tree_report.host_text();
        let candidate_fiber_tags = vec![host_component.fiber_tag()];
        let skipped_fiber_tags = vec![host_text.fiber_tag()];

        TestRendererPrivateTestInstanceFindAllQueryDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_ALL_DIAGNOSTIC_NAME,
            source_tree_diagnostic_name: tree_report.diagnostic_name(),
            host_output_update_kind: tree_report.host_output_update_kind(),
            host_output_snapshot_current: tree_report.host_output_snapshot_current(),
            traversal_source: "ReactTestRenderer.js findAll(root, predicate, options)",
            traversal_order: "self-then-descendants",
            default_deep: true,
            candidate_fiber_tags: candidate_fiber_tags.clone(),
            skipped_fiber_tags: skipped_fiber_tags.clone(),
            type_predicate: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
                predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind::Type,
                source: "ReactTestRenderer.js ReactTestInstance.findAllByType",
                predicate_source: "node => node.type === type",
                expected_type: Some(host_component.element_type().clone()),
                expected_props: None,
                evaluated_fiber_tags: candidate_fiber_tags.clone(),
                matched_fiber_tags: vec![host_component.fiber_tag()],
                rejected_fiber_tags: Vec::new(),
                skipped_text_child_count: skipped_fiber_tags.len(),
                predicate_execution: false,
                public_query_method_available: false,
            },
            props_predicate: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
                predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind::Props,
                source: "ReactTestRenderer.js ReactTestInstance.findAllByProps",
                predicate_source: "node => node.props && propsMatch(node.props, props)",
                expected_type: None,
                expected_props: Some(host_component.props().clone()),
                evaluated_fiber_tags: candidate_fiber_tags.clone(),
                matched_fiber_tags: vec![host_component.fiber_tag()],
                rejected_fiber_tags: Vec::new(),
                skipped_text_child_count: skipped_fiber_tags.len(),
                predicate_execution: false,
                public_query_method_available: false,
            },
            predicate_like: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
                predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind::PredicateLike,
                source: "ReactTestRenderer.js ReactTestInstance.findAll",
                predicate_source: "metadata-only predicate matching accepted type and props diagnostics",
                expected_type: Some(host_component.element_type().clone()),
                expected_props: Some(host_component.props().clone()),
                evaluated_fiber_tags: candidate_fiber_tags,
                matched_fiber_tags: vec![host_component.fiber_tag()],
                rejected_fiber_tags: Vec::new(),
                skipped_text_child_count: skipped_fiber_tags.len(),
                predicate_execution: false,
                public_query_method_available: false,
            },
            public_blockers: tree_report.public_blockers(),
            public_test_instance_object_available: false,
            public_query_methods_available: false,
            compatibility_claimed: false,
        }
    }

    fn private_test_instance_find_by_query_from_find_all_report(
        find_all_report: &TestRendererPrivateTestInstanceFindAllQueryDiagnostics,
    ) -> TestRendererPrivateTestInstanceFindByQueryDiagnostics {
        let type_predicate = find_all_report.type_predicate();
        let props_predicate = find_all_report.props_predicate();
        let expected_type = type_predicate.expected_type().cloned();
        let expected_type_name = expected_type
            .as_ref()
            .map(TestElementType::as_str)
            .unwrap_or("Unknown");
        let expected_props = props_predicate.expected_props().cloned();
        let find_all_candidate_fiber_tags = find_all_report.candidate_fiber_tags().to_vec();
        let find_all_skipped_fiber_tags = find_all_report.skipped_fiber_tags().to_vec();

        TestRendererPrivateTestInstanceFindByQueryDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_BY_DIAGNOSTIC_NAME,
            source_find_all_diagnostic_name: find_all_report.diagnostic_name(),
            source_tree_diagnostic_name: find_all_report.source_tree_diagnostic_name(),
            host_output_update_kind: find_all_report.host_output_update_kind(),
            host_output_snapshot_current: find_all_report.host_output_snapshot_current(),
            source: "ReactTestRenderer.js ReactTestInstance.findByType/findByProps",
            accepted_find_all_traversal_source: find_all_report.traversal_source(),
            effective_deep: false,
            expect_one: true,
            find_all_candidate_fiber_tags,
            find_all_skipped_fiber_tags: find_all_skipped_fiber_tags.clone(),
            find_by_type: TestRendererPrivateTestInstanceFindByResultDiagnostic {
                query_kind: TestRendererPrivateTestInstanceFindByQueryKind::Type,
                public_surface: "ReactTestInstance.findByType",
                source: "ReactTestRenderer.js ReactTestInstance.findByType",
                based_on_find_all_source: type_predicate.source(),
                based_on_predicate_kind: type_predicate.predicate_kind(),
                expect_one_message: format!("with node type: \"{expected_type_name}\""),
                expected_type,
                expected_props: None,
                effective_deep: false,
                expect_one: true,
                result_kind: "single",
                expected_canary_match_count: type_predicate.matched_candidate_count(),
                matched_candidate_count: type_predicate.matched_candidate_count(),
                candidate_fiber_tags: type_predicate.matched_fiber_tags().to_vec(),
                traversed_candidate_fiber_tags: type_predicate.evaluated_fiber_tags().to_vec(),
                skipped_fiber_tags: find_all_skipped_fiber_tags.clone(),
                zero_match_error_prefix: "No instances found ",
                duplicate_match_error_prefix: "Expected 1 but found N instances ",
                predicate_execution: type_predicate.predicate_execution(),
                public_query_method_available: false,
                public_test_instance_object_available: false,
                compatibility_claimed: false,
            },
            find_by_props: TestRendererPrivateTestInstanceFindByResultDiagnostic {
                query_kind: TestRendererPrivateTestInstanceFindByQueryKind::Props,
                public_surface: "ReactTestInstance.findByProps",
                source: "ReactTestRenderer.js ReactTestInstance.findByProps",
                based_on_find_all_source: props_predicate.source(),
                based_on_predicate_kind: props_predicate.predicate_kind(),
                expect_one_message: format!(
                    "with props: {}",
                    if expected_props.as_ref().is_some_and(|props| {
                        props.text_content().is_none() && props.attributes().is_empty()
                    }) {
                        "{}"
                    } else {
                        "<private-props>"
                    }
                ),
                expected_type: None,
                expected_props,
                effective_deep: false,
                expect_one: true,
                result_kind: "single",
                expected_canary_match_count: props_predicate.matched_candidate_count(),
                matched_candidate_count: props_predicate.matched_candidate_count(),
                candidate_fiber_tags: props_predicate.matched_fiber_tags().to_vec(),
                traversed_candidate_fiber_tags: props_predicate.evaluated_fiber_tags().to_vec(),
                skipped_fiber_tags: find_all_skipped_fiber_tags,
                zero_match_error_prefix: "No instances found ",
                duplicate_match_error_prefix: "Expected 1 but found N instances ",
                predicate_execution: props_predicate.predicate_execution(),
                public_query_method_available: false,
                public_test_instance_object_available: false,
                compatibility_claimed: false,
            },
            public_blockers: find_all_report.public_blockers(),
            public_test_instance_object_available: false,
            public_query_methods_available: false,
            compatibility_claimed: false,
        }
    }

    fn private_test_instance_query_bridge_preflight_from_query_reports(
        find_all_report: &TestRendererPrivateTestInstanceFindAllQueryDiagnostics,
        find_by_report: &TestRendererPrivateTestInstanceFindByQueryDiagnostics,
    ) -> TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics {
        TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics {
            diagnostic_name:
                TEST_RENDERER_PRIVATE_TEST_INSTANCE_QUERY_BRIDGE_PREFLIGHT_DIAGNOSTIC_NAME,
            source_find_all_diagnostic_name: find_all_report.diagnostic_name(),
            source_find_by_diagnostic_name: find_by_report.diagnostic_name(),
            bridge_status: "private-test-instance-query-bridge-preflight-ready-public-test-instance-blocked",
            bridge_source: "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.testInstanceQuery",
            wrapper_record_symbol: "fast.react_test_renderer.private_test_instance_wrapper_record",
            host_output_update_kind: find_by_report.host_output_update_kind(),
            host_output_snapshot_current: find_by_report.host_output_snapshot_current(),
            accepted_find_all_traversal_source: find_all_report.traversal_source(),
            accepted_find_by_source: find_by_report.source(),
            find_all_candidate_fiber_tags: find_all_report.candidate_fiber_tags().to_vec(),
            find_all_skipped_fiber_tags: find_all_report.skipped_fiber_tags().to_vec(),
            find_by_queries: vec![
                find_by_report.find_by_type().query_kind().as_str(),
                find_by_report.find_by_props().query_kind().as_str(),
            ],
            consumes_accepted_find_all_diagnostics: true,
            consumes_accepted_find_by_diagnostics: true,
            record_only_diagnostic_consumption: true,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: false,
            public_blockers: find_all_report.public_blockers(),
            public_root_available: false,
            public_test_instance_object_available: false,
            public_query_methods_available: false,
            compatibility_claimed: false,
        }
    }

    #[allow(
        clippy::too_many_arguments,
        reason = "private serialization identity gate mirrors the finished-work handoff evidence shape"
    )]
    fn describe_private_serialization_finished_work_identity_gate_for_canary(
        &self,
        public_surface: &'static str,
        source_serialization_diagnostic_name: &'static str,
        host_output_update_kind: TestRendererRootUpdateKind,
        host_output_snapshot_current: bool,
        public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
        render: Option<HostRootRenderPhaseRecord>,
        commit: Option<&HostRootCommitRecord>,
        consumes_private_to_json_evidence: bool,
        consumes_private_to_tree_evidence: bool,
        report_gate: &TestRendererSerializationGateReport,
    ) -> Result<TestRendererPrivateSerializationFinishedWorkIdentityGate, TestRendererRootError>
    {
        let Some(render) = render else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::MissingFinishedWorkHandoff {
                    public_surface,
                }
                .into(),
            );
        };
        let Some(commit) = commit else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::MissingCommittedHostRoot {
                    public_surface,
                }
                .into(),
            );
        };

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

        if render.root() != self.root_id {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
                    reason: "render-root-mismatch",
                }
                .into(),
            );
        }
        if commit.root() != self.root_id {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
                    reason: "commit-root-mismatch",
                }
                .into(),
            );
        }
        if report_gate.commit().root() != self.root_id {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
                    reason: "serialization-report-root-mismatch",
                }
                .into(),
            );
        }

        let actual_current = self.store.root(self.root_id)?.current();
        if actual_current != commit.current() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
                    reason: "commit-current-not-root-current",
                }
                .into(),
            );
        }
        if commit.current() != render.finished_work() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
                    reason: "commit-current-finished-work-mismatch",
                }
                .into(),
            );
        }
        if commit.previous_current() != render.current() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
                    reason: "commit-previous-current-render-current-mismatch",
                }
                .into(),
            );
        }
        if commit.finished_lanes() != render.render_lanes() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::LaneMismatch {
                    render_lanes_bits: render.render_lanes().bits(),
                    commit_finished_lanes_bits: commit.finished_lanes().bits(),
                }
                .into(),
            );
        }
        if report_gate.gate_name() != TEST_RENDERER_SERIALIZATION_CANARY_GATE_NAME
            || report_gate.status()
                != TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
            || !report_gate.requirements().private_serialization_ready()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "serialization-gate-not-ready",
                }
                .into(),
            );
        }
        if !host_output_snapshot_current {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "host-output-snapshot-stale",
                }
                .into(),
            );
        }
        if !public_blockers.all_blocked() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
                    reason: "public-blockers-not-all-closed",
                }
                .into(),
            );
        }

        let report_commit = report_gate.commit();
        if report_commit.current() != report_commit.finished_work() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
                    reason: "serialization-report-current-finished-work-mismatch",
                }
                .into(),
            );
        }
        if report_commit.current() != fiber_handle!(commit.current())
            || report_commit.finished_work() != fiber_handle!(commit.finished_work())
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
                    reason: "serialization-report-finished-work-mismatch",
                }
                .into(),
            );
        }
        if report_commit.finished_lanes_bits() != commit.finished_lanes().bits()
            || report_commit.remaining_lanes_bits() != commit.remaining_lanes().bits()
            || report_commit.pending_lanes_bits() != commit.pending_lanes().bits()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::LaneMismatch {
                    render_lanes_bits: report_commit.finished_lanes_bits(),
                    commit_finished_lanes_bits: commit.finished_lanes().bits(),
                }
                .into(),
            );
        }
        let Some(fiber_inspection) = report_gate.fiber_inspection() else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "missing-committed-fiber-inspection",
                }
                .into(),
            );
        };
        if fiber_inspection.current() != commit.current() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
                    reason: "committed-fiber-inspection-current-mismatch",
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateSerializationFinishedWorkIdentityGate {
            diagnostic_name:
                TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_STATUS,
            root: self.root_id,
            root_scheduled_update_sequence: self.scheduled_updates.len(),
            public_surface,
            source_serialization_diagnostic_name,
            host_output_update_kind,
            render_current: fiber_handle!(render.current()),
            render_finished_work: fiber_handle!(render.finished_work()),
            commit_previous_current: fiber_handle!(commit.previous_current()),
            commit_current: fiber_handle!(commit.current()),
            report_finished_work: report_commit.finished_work(),
            render_lanes_bits: render.render_lanes().bits(),
            commit_finished_lanes_bits: commit.finished_lanes().bits(),
            report_finished_lanes_bits: report_commit.finished_lanes_bits(),
            commit_remaining_lanes_bits: commit.remaining_lanes().bits(),
            commit_pending_lanes_bits: commit.pending_lanes().bits(),
            commit_current_matches_render_finished_work: true,
            commit_previous_current_matches_render_current: true,
            commit_lanes_match_render_lanes: true,
            report_finished_work_matches_commit_current: true,
            report_lanes_match_commit_lanes: true,
            committed_fiber_inspection_current_matches_commit: true,
            host_output_snapshot_current,
            consumes_committed_host_root_finished_work_identity: true,
            consumes_committed_host_root_finished_work_lanes: true,
            consumes_private_to_json_evidence,
            consumes_private_to_tree_evidence,
            public_to_json_available: false,
            public_to_tree_available: false,
            public_test_instance_available: false,
            public_serialization_available: false,
            compatibility_claimed: false,
        })
    }

    #[allow(
        clippy::too_many_arguments,
        reason = "unmount serialization identity is backed by deletion handoff plus empty-root row evidence"
    )]
    fn describe_private_unmount_serialization_finished_work_identity_gate_for_canary(
        &self,
        public_surface: &'static str,
        source_serialization_diagnostic_name: &'static str,
        consumes_private_to_json_evidence: bool,
        consumes_private_to_tree_evidence: bool,
        output: &TestRendererUnmountedHostOutput,
        handoff: Option<&TestRendererUnmountDeletionCommitHandoffDiagnostics>,
    ) -> Result<TestRendererPrivateSerializationFinishedWorkIdentityGate, TestRendererRootError>
    {
        let row = self.describe_private_to_json_host_output_unmount_row_for_canary(output)?;
        let Some(handoff) = handoff.copied() else {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::MissingFinishedWorkHandoff {
                    public_surface,
                }
                .into(),
            );
        };
        let Some(scheduled_update) = self.scheduled_updates.last() else {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: TestRendererRootUpdateKind::Create,
            });
        };
        self.validate_private_unmount_native_bridge_handoff_for_canary(scheduled_update, handoff)?;

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

        let render = output.render();
        let commit = output.commit();
        if render.root() != self.root_id {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
                    reason: "render-root-mismatch",
                }
                .into(),
            );
        }
        if commit.root() != self.root_id {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
                    reason: "commit-root-mismatch",
                }
                .into(),
            );
        }
        if row.host_output_update_kind() != TestRendererRootUpdateKind::Unmount
            || row.host_output_shape() != TestRendererPrivateToJsonHostOutputShape::EmptyRoot
            || row.current_root_child_count() != 0
            || !row.dependency_diagnostics().host_output_snapshot_current()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "unmount-empty-root-row-mismatch",
                }
                .into(),
            );
        }
        if !row.public_blockers().all_blocked() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
                    reason: "public-blockers-not-all-closed",
                }
                .into(),
            );
        }

        if handoff.render_current() != fiber_handle!(render.current())
            || handoff.render_finished_work() != fiber_handle!(render.finished_work())
            || handoff.commit_previous_current() != fiber_handle!(commit.previous_current())
            || handoff.commit_current() != fiber_handle!(commit.current())
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
                    reason: "unmount-handoff-finished-work-mismatch",
                }
                .into(),
            );
        }
        if commit.current() != render.finished_work() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
                    reason: "commit-current-finished-work-mismatch",
                }
                .into(),
            );
        }
        if commit.previous_current() != render.current() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
                    reason: "commit-previous-current-render-current-mismatch",
                }
                .into(),
            );
        }
        if commit.finished_lanes() != render.render_lanes()
            || handoff.render_lanes_bits() != render.render_lanes().bits()
            || handoff.commit_finished_lanes_bits() != commit.finished_lanes().bits()
        {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::LaneMismatch {
                    render_lanes_bits: render.render_lanes().bits(),
                    commit_finished_lanes_bits: commit.finished_lanes().bits(),
                }
                .into(),
            );
        }
        if commit.remaining_lanes().bits() != 0 || commit.pending_lanes().bits() != 0 {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "unmount-commit-lanes-not-drained",
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateSerializationFinishedWorkIdentityGate {
            diagnostic_name:
                TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_STATUS,
            root: self.root_id,
            root_scheduled_update_sequence: self.scheduled_updates.len(),
            public_surface,
            source_serialization_diagnostic_name,
            host_output_update_kind: TestRendererRootUpdateKind::Unmount,
            render_current: fiber_handle!(render.current()),
            render_finished_work: fiber_handle!(render.finished_work()),
            commit_previous_current: fiber_handle!(commit.previous_current()),
            commit_current: fiber_handle!(commit.current()),
            report_finished_work: fiber_handle!(commit.current()),
            render_lanes_bits: render.render_lanes().bits(),
            commit_finished_lanes_bits: commit.finished_lanes().bits(),
            report_finished_lanes_bits: commit.finished_lanes().bits(),
            commit_remaining_lanes_bits: commit.remaining_lanes().bits(),
            commit_pending_lanes_bits: commit.pending_lanes().bits(),
            commit_current_matches_render_finished_work: true,
            commit_previous_current_matches_render_current: true,
            commit_lanes_match_render_lanes: true,
            report_finished_work_matches_commit_current: true,
            report_lanes_match_commit_lanes: true,
            committed_fiber_inspection_current_matches_commit: true,
            host_output_snapshot_current: true,
            consumes_committed_host_root_finished_work_identity: true,
            consumes_committed_host_root_finished_work_lanes: true,
            consumes_private_to_json_evidence,
            consumes_private_to_tree_evidence,
            public_to_json_available: false,
            public_to_tree_available: false,
            public_test_instance_available: false,
            public_serialization_available: false,
            compatibility_claimed: false,
        })
    }

    #[allow(
        clippy::too_many_arguments,
        reason = "private test-instance evidence builder mirrors the native query report shape"
    )]
    fn private_test_instance_native_query_execution_evidence_from_reports(
        &self,
        operation: &'static str,
        public_surface: &'static str,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        expected_host_output_update_kind: TestRendererRootUpdateKind,
        consumes_create: bool,
        consumes_update: bool,
        preflight: &TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics,
        find_by_report: &TestRendererPrivateTestInstanceFindByQueryDiagnostics,
    ) -> Result<TestRendererPrivateTestInstanceNativeQueryExecutionEvidence, TestRendererRootError>
    {
        let query = find_by_report.find_by_type();
        let expected_type = query.expected_type().cloned().ok_or(
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation,
                reason: "find-by-type-query-type-missing",
            },
        )?;
        let minimal_host_component_query_path = preflight.host_output_snapshot_current()
            && preflight.host_output_update_kind() == expected_host_output_update_kind
            && preflight.find_all_candidate_fiber_tags() == ["HostComponent"]
            && preflight.find_all_skipped_fiber_tags() == ["HostText"]
            && preflight.find_by_queries() == ["findByType", "findByProps"]
            && query.query_kind() == TestRendererPrivateTestInstanceFindByQueryKind::Type
            && query.result_kind() == "single"
            && query.matched_candidate_count() == 1
            && query.candidate_fiber_tags() == ["HostComponent"]
            && query.skipped_fiber_tags() == ["HostText"]
            && !query.public_query_method_available()
            && !query.public_test_instance_object_available()
            && !query.compatibility_claimed();

        if !minimal_host_component_query_path {
            return self.private_test_instance_native_query_execution_record_error(
                operation,
                "minimal-host-component-query-path-missing",
            );
        }

        Ok(
            TestRendererPrivateTestInstanceNativeQueryExecutionEvidence {
                diagnostic_name:
                    TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_DIAGNOSTIC_NAME,
                status: TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_STATUS,
                root: self.root_id,
                operation,
                public_surface,
                source_execution_record_id,
                source_execution_status,
                source_query_diagnostic_name: preflight.diagnostic_name(),
                query_bridge_preflight_status: preflight.bridge_status(),
                host_output_update_kind: preflight.host_output_update_kind(),
                host_output_snapshot_current: preflight.host_output_snapshot_current(),
                query_surface: query.public_surface(),
                query_kind: query.query_kind(),
                expected_type,
                result_fiber_tag: "HostComponent",
                result_kind: query.result_kind(),
                matched_candidate_count: query.matched_candidate_count(),
                query_path_candidate_count: preflight.find_all_candidate_fiber_tags().len(),
                skipped_text_child_count: preflight.find_all_skipped_fiber_tags().len(),
                consumes_accepted_native_create_execution_record: consumes_create,
                consumes_accepted_native_update_execution_record: consumes_update,
                consumes_private_test_instance_query_diagnostics: true,
                consumes_query_bridge_preflight: true,
                consumes_accepted_find_all_diagnostics: preflight
                    .consumes_accepted_find_all_diagnostics(),
                consumes_accepted_find_by_diagnostics: preflight
                    .consumes_accepted_find_by_diagnostics(),
                minimal_host_component_query_path,
                public_root_available: false,
                public_query_methods_available: false,
                public_test_instance_object_available: false,
                native_bridge_available: false,
                native_execution_available: false,
                compatibility_claimed: false,
            },
        )
    }

    fn private_test_instance_class_root_query_execution_evidence_from_reports(
        &self,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        previous_child_text: String,
        preflight: &TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics,
        find_by_report: &TestRendererPrivateTestInstanceFindByQueryDiagnostics,
        class_root: &TestRendererPrivateGetInstanceClassRootReport,
    ) -> Result<TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence, TestRendererRootError>
    {
        let query = find_by_report.find_by_type();
        let child_element_type = query.expected_type().cloned().ok_or(
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation: "update",
                reason: "find-by-type-query-type-missing",
            },
        )?;
        let rendered_host_component = class_root.rendered_host_component();
        let class_component = class_root.class_component();
        let current_child_text = class_root.rendered_host_text().text().to_owned();
        let host_child_updated = previous_child_text != current_child_text;

        let class_root_query_path = preflight.host_output_snapshot_current()
            && class_root.host_output_snapshot_current()
            && preflight.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && find_by_report.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && class_root.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && class_root.accepted_class_fiber_shape()
                == &TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE
            && class_component.fiber_tag() == "ClassComponent"
            && class_component.component_type()
                == TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE
            && class_component.rendered_child_fiber_tag() == "HostComponent"
            && class_component.rendered_child_count() == 1
            && rendered_host_component.fiber_tag() == "HostComponent"
            && rendered_host_component.element_type() == &child_element_type
            && rendered_host_component.rendered_child_count() == 1
            && rendered_host_component.rendered_text() == current_child_text
            && class_root.rendered_host_text().fiber_tag() == "HostText"
            && host_child_updated
            && !class_component.public_get_instance_available()
            && !class_root.public_get_instance_available()
            && !class_root.native_bridge_available()
            && !class_root.compatibility_claimed()
            && query.query_kind() == TestRendererPrivateTestInstanceFindByQueryKind::Type
            && query.result_kind() == "single"
            && query.matched_candidate_count() == 1
            && query.candidate_fiber_tags() == ["HostComponent"]
            && query.skipped_fiber_tags() == ["HostText"]
            && !query.public_query_method_available()
            && !query.public_test_instance_object_available()
            && !query.compatibility_claimed();

        if !class_root_query_path {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "class-root-updated-host-child-query-path-missing",
            );
        }

        Ok(
            TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence {
                diagnostic_name:
                    TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_DIAGNOSTIC_NAME,
                status: TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_STATUS,
                root: self.root_id,
                operation: "update",
                public_surface: "create().update -> create().root/ReactTestInstance.findByType",
                source_execution_record_id,
                source_execution_status,
                source_query_diagnostic_name: preflight.diagnostic_name(),
                source_get_instance_diagnostic_name: class_root.diagnostic_name(),
                query_bridge_preflight_status: preflight.bridge_status(),
                host_output_update_kind: TestRendererRootUpdateKind::Update,
                host_output_snapshot_current: true,
                accepted_class_fiber_shape:
                    TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE,
                root_query_surface: "create().root",
                root_result_fiber_tag: class_component.fiber_tag(),
                root_component_type: class_component.component_type(),
                root_props: class_component.props().clone(),
                root_child_count: class_component.rendered_child_count(),
                child_query_surface: query.public_surface(),
                child_query_kind: query.query_kind(),
                child_fiber_tag: rendered_host_component.fiber_tag(),
                child_element_type,
                child_props: rendered_host_component.props().clone(),
                previous_child_text,
                current_child_text,
                host_child_updated,
                class_root_query_path: vec!["ClassComponent", "HostComponent"],
                updated_host_child_query_path: vec!["ClassComponent", "HostComponent", "HostText"],
                consumes_accepted_native_update_execution_record: true,
                consumes_private_test_instance_query_diagnostics: true,
                consumes_query_bridge_preflight: true,
                consumes_private_get_instance_class_root_diagnostics: true,
                public_root_available: false,
                public_query_methods_available: false,
                public_test_instance_object_available: false,
                public_get_instance_available: false,
                native_bridge_available: false,
                native_execution_available: false,
                compatibility_claimed: false,
            },
        )
    }

    fn first_host_component_text_from_snapshot(snapshot: &TestContainerSnapshot) -> Option<String> {
        let TestNodeSnapshot::Element(component) = snapshot.children().first()? else {
            return None;
        };
        let TestNodeSnapshot::Text(text) = component.children().first()? else {
            return None;
        };
        Some(text.text().to_owned())
    }

    fn validate_private_test_instance_create_native_execution_record_for_canary(
        &self,
        execution: TestRendererPrivateCreateNativeBridgeHostOutputHandoff,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "record-id-mismatch",
            );
        }
        if execution.status()
            != TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "status-mismatch",
            );
        }
        if execution.root() != self.root_id
            || execution.operation() != "create"
            || execution.public_surface() != "create()"
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Create
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Create
            || execution.host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::SingleHostText
            || execution.serialization_gate_status()
                != TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "route-metadata-stale",
            );
        }
        let host_output = execution.host_output();
        if host_output.container_child_count() != 1
            || host_output.instance_count() != 1
            || host_output.text_count() != 1
            || !host_output.real_host_output_available()
            || !execution.create_route_admission_accepted()
            || !execution.host_output_handoff_accepted()
            || !execution.actual_rust_create_host_output_handoff()
            || !execution.host_output_produced_by_rust()
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "accepted-create-host-output-evidence-missing",
            );
        }
        if execution.public_create_behavior_available()
            || execution.public_serialization_available()
            || execution.public_test_instance_available()
            || execution.native_addon_loaded()
            || execution.native_bridge_available()
            || execution.native_execution()
            || execution.rust_execution_from_js()
            || execution.host_output_produced_from_js()
            || execution.compatibility_claimed()
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn validate_private_test_instance_update_native_execution_record_for_canary(
        &self,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "record-id-mismatch",
            );
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "status-mismatch",
            );
        }
        if execution.root() != self.root_id
            || execution.route_dependency_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID
            || execution.update_route_admission_id()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
            || execution.lifecycle() != TestRendererRootLifecycle::Active
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Update
        {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "route-metadata-stale",
            );
        }
        if !execution.update_route_admission_accepted()
            || !execution.lifecycle_evidence_accepted()
            || !execution.root_work_loop_handoff_accepted()
            || !execution.host_output_handoff_accepted()
            || !execution.text_update_apply_recorded()
            || execution.host_text_update_apply_count() != 1
            || execution.host_component_update_apply_count() != 1
        {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "accepted-update-host-output-evidence-missing",
            );
        }
        if execution.public_update_compatibility_claimed()
            || execution.public_serialization_available()
            || execution.act_flushing_claimed()
            || execution.native_bridge_available()
            || execution.native_execution()
            || execution.compatibility_claimed()
        {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn private_test_instance_native_query_execution_record_error<T>(
        &self,
        operation: &'static str,
        reason: &'static str,
    ) -> Result<T, TestRendererRootError> {
        Err(
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation,
                reason,
            }
            .into(),
        )
    }

    fn private_get_instance_class_root_from_tree_report(
        tree_report: TestRendererPrivateTreeMetadataReport,
    ) -> TestRendererPrivateGetInstanceClassRootReport {
        let class_props = TestProps::new().with_attribute("label", "class-root");
        let class_instance = TestRendererPrivateGetInstanceClassInstanceDiagnostic {
            constructor_name: TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_CONSTRUCTOR_NAME,
            props: class_props.clone(),
            state_marker: TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_STATE_MARKER,
            private_instance_available: true,
            public_get_instance_available: false,
            react_public_result: "class-instance",
        };

        TestRendererPrivateGetInstanceClassRootReport {
            diagnostic_name: TEST_RENDERER_PRIVATE_GET_INSTANCE_DIAGNOSTIC_NAME,
            source_tree_diagnostic_name: tree_report.diagnostic_name(),
            gate: tree_report.gate().clone(),
            host_output_update_kind: tree_report.host_output_update_kind(),
            host_output_snapshot_current: tree_report.host_output_snapshot_current(),
            accepted_class_fiber_shape:
                TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE,
            host_root_fail_closed: TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
                root_fiber_shape: TEST_RENDERER_PRIVATE_GET_INSTANCE_HOST_ROOT_FIBER_SHAPE,
                root_child_fiber_tag: "HostComponent",
                react_public_result: "null-with-default-createNodeMock",
                public_get_instance_available: false,
                private_class_instance_available: false,
                public_behavior_fail_closed: true,
            },
            function_root_fail_closed: TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
                root_fiber_shape: TEST_RENDERER_PRIVATE_GET_INSTANCE_FUNCTION_ROOT_FIBER_SHAPE,
                root_child_fiber_tag: "FunctionComponent",
                react_public_result: "null",
                public_get_instance_available: false,
                private_class_instance_available: false,
                public_behavior_fail_closed: true,
            },
            class_component: TestRendererPrivateGetInstanceClassComponentDiagnostic {
                fiber_tag: "ClassComponent",
                component_type: TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE,
                props: class_props,
                state_node_available: true,
                rendered_child_fiber_tag: tree_report.host_component().fiber_tag(),
                rendered_child_count: 1,
                instance: class_instance,
                public_get_instance_available: false,
            },
            rendered_host_component: tree_report.host_component().clone(),
            rendered_host_text: tree_report.host_text().clone(),
            public_blockers: tree_report.public_blockers(),
            public_get_instance_available: false,
            native_bridge_available: false,
            compatibility_claimed: false,
        }
    }

    const fn instance_state_node_raw(instance: TestInstance) -> u64 {
        instance.index as u64 + 1
    }

    const fn text_state_node_raw(text: TestTextInstance) -> u64 {
        text.index as u64 + 1
    }
}

#[cfg(test)]
mod tests;
