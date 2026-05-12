use super::super::*;

impl TestRendererRoot {
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

    pub(crate) fn private_to_json_facade_result_from_report(
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
    pub(crate) fn private_to_json_native_execution_evidence_from_host_output_row(
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

    pub(crate) fn validate_private_to_json_sibling_snapshot_finished_work_identity_blocker_for_diagnostics(
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

    pub(crate) fn validate_private_unmount_nested_source_report_admission_gate_for_canary(
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
}
