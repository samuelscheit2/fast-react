use super::super::*;

impl TestRendererRoot {
    pub fn describe_private_root_create_preflight_for_canary(
        input_shape: TestRendererRootCreatePreflightInputShape,
        options: Option<TestRendererOptions>,
        canary_api_identity: TestRendererRootCreatePreflightCanaryApiIdentity,
        work_loop_metadata: Option<TestRendererRootWorkLoopFinishedWorkPreflightMetadata>,
    ) -> Result<TestRendererRootCreatePreflightDiagnostics, TestRendererRootError> {
        if !input_shape
            .child_shape()
            .is_supported_for_create_preflight()
        {
            return Err(TestRendererRootCreatePreflightError::UnsupportedChildren {
                child_shape: input_shape.child_shape(),
            }
            .into());
        }

        if !canary_api_identity.is_current() {
            let current = TestRendererRootCreatePreflightCanaryApiIdentity::current();
            return Err(TestRendererRootCreatePreflightError::StaleCanaryMetadata {
                expected_metadata_id: current.metadata_id(),
                actual_metadata_id: canary_api_identity.metadata_id(),
                expected_root_api: current.root_api(),
                actual_root_api: canary_api_identity.root_api(),
            }
            .into());
        }

        let Some(work_loop_metadata) = work_loop_metadata else {
            return Err(
                TestRendererRootCreatePreflightError::MissingWorkLoopFinishedWorkPreflightMetadata
                    .into(),
            );
        };
        if !work_loop_metadata.is_current() {
            let current = TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current();
            return Err(
                TestRendererRootCreatePreflightError::StaleWorkLoopFinishedWorkPreflightMetadata {
                    expected_metadata_id: current.metadata_id(),
                    actual_metadata_id: work_loop_metadata.metadata_id(),
                    expected_render_phase_api: current.render_phase_api(),
                    actual_render_phase_api: work_loop_metadata.render_phase_api(),
                }
                .into(),
            );
        }

        let Some(options) = options else {
            return Err(TestRendererRootCreatePreflightError::MissingRootOptions.into());
        };
        let root_options = TestRendererRootCreatePreflightOptionsMetadata::from_options(&options);
        let mut root = Self::create(input_shape.element(), options)?;
        let (scheduled_update_kind, scheduled_element) = {
            let scheduled_update = root
                .last_scheduled_update()
                .expect("TestRendererRoot::create schedules an initial HostRoot update");
            (scheduled_update.kind(), scheduled_update.element())
        };
        let render = root
            .render_latest_scheduled_host_root_for_commit_handoff()?
            .expect("private root-create preflight schedules HostRoot render work");
        let previous_current = render.current();
        let finished_work = render.finished_work();
        let work_loop_finished_work_preflight =
            TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
                row_id: TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_ROW_ID,
                status: TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_STATUS,
                metadata: work_loop_metadata,
                root: root.root_id(),
                previous_current: TestRendererFiberHandleDiagnostics {
                    arena_id: previous_current.arena_id().get(),
                    slot: previous_current.slot().get(),
                    generation: previous_current.generation().get(),
                },
                finished_work: TestRendererFiberHandleDiagnostics {
                    arena_id: finished_work.arena_id().get(),
                    slot: finished_work.slot().get(),
                    generation: finished_work.generation().get(),
                },
                resulting_element: render.resulting_element(),
                scheduled_update_kind,
                render_lanes_empty: render.render_lanes().is_empty(),
                render_lanes_bits: render.render_lanes().bits(),
                remaining_lanes_empty: render.remaining_lanes().is_empty(),
                remaining_lanes_bits: render.remaining_lanes().bits(),
                finished_work_matches_render_phase: finished_work == render.work_in_progress(),
                records_accepted_finished_work_metadata: true,
                public_create_behavior_available: false,
                host_mutation_execution_blocked: true,
                effects_refs_and_hydration_blocked: true,
                compatibility_claimed: false,
            };

        Ok(TestRendererRootCreatePreflightDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS,
            root: root.root_id(),
            input_shape,
            root_options,
            canary_api_identity,
            scheduled_update_kind,
            scheduled_element,
            container_update_api: scheduled_update_kind.container_update_api(),
            scheduler_api: "ensure_root_is_scheduled",
            work_loop_finished_work_preflight,
            private_rust_root_created: true,
            private_root_canary_boundary_validated: true,
            public_renderer_root_created: false,
            public_root_available: false,
            native_addon_loaded: false,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: false,
            host_output_produced_from_js: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_root_create_preflight_from_render_for_canary(
        &self,
        input_shape: TestRendererRootCreatePreflightInputShape,
        canary_api_identity: TestRendererRootCreatePreflightCanaryApiIdentity,
        work_loop_metadata: Option<TestRendererRootWorkLoopFinishedWorkPreflightMetadata>,
        render: HostRootRenderPhaseRecord,
    ) -> Result<TestRendererRootCreatePreflightDiagnostics, TestRendererRootError> {
        if !input_shape
            .child_shape()
            .is_supported_for_create_preflight()
        {
            return Err(TestRendererRootCreatePreflightError::UnsupportedChildren {
                child_shape: input_shape.child_shape(),
            }
            .into());
        }

        if !canary_api_identity.is_current() {
            let current = TestRendererRootCreatePreflightCanaryApiIdentity::current();
            return Err(TestRendererRootCreatePreflightError::StaleCanaryMetadata {
                expected_metadata_id: current.metadata_id(),
                actual_metadata_id: canary_api_identity.metadata_id(),
                expected_root_api: current.root_api(),
                actual_root_api: canary_api_identity.root_api(),
            }
            .into());
        }

        let Some(work_loop_metadata) = work_loop_metadata else {
            return Err(
                TestRendererRootCreatePreflightError::MissingWorkLoopFinishedWorkPreflightMetadata
                    .into(),
            );
        };
        if !work_loop_metadata.is_current() {
            let current = TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current();
            return Err(
                TestRendererRootCreatePreflightError::StaleWorkLoopFinishedWorkPreflightMetadata {
                    expected_metadata_id: current.metadata_id(),
                    actual_metadata_id: work_loop_metadata.metadata_id(),
                    expected_render_phase_api: current.render_phase_api(),
                    actual_render_phase_api: work_loop_metadata.render_phase_api(),
                }
                .into(),
            );
        }

        let scheduled_update = self
            .last_scheduled_update()
            .expect("TestRendererRoot::create schedules an initial HostRoot update");
        let scheduled_update_kind = scheduled_update.kind();
        let scheduled_element = scheduled_update.element();
        let previous_current = render.current();
        let finished_work = render.finished_work();
        let work_loop_finished_work_preflight =
            TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
                row_id: TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_ROW_ID,
                status: TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_STATUS,
                metadata: work_loop_metadata,
                root: self.root_id(),
                previous_current: TestRendererFiberHandleDiagnostics {
                    arena_id: previous_current.arena_id().get(),
                    slot: previous_current.slot().get(),
                    generation: previous_current.generation().get(),
                },
                finished_work: TestRendererFiberHandleDiagnostics {
                    arena_id: finished_work.arena_id().get(),
                    slot: finished_work.slot().get(),
                    generation: finished_work.generation().get(),
                },
                resulting_element: render.resulting_element(),
                scheduled_update_kind,
                render_lanes_empty: render.render_lanes().is_empty(),
                render_lanes_bits: render.render_lanes().bits(),
                remaining_lanes_empty: render.remaining_lanes().is_empty(),
                remaining_lanes_bits: render.remaining_lanes().bits(),
                finished_work_matches_render_phase: finished_work == render.work_in_progress(),
                records_accepted_finished_work_metadata: true,
                public_create_behavior_available: false,
                host_mutation_execution_blocked: true,
                effects_refs_and_hydration_blocked: true,
                compatibility_claimed: false,
            };

        Ok(TestRendererRootCreatePreflightDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS,
            root: self.root_id(),
            input_shape,
            root_options: TestRendererRootCreatePreflightOptionsMetadata::from_options(
                &self.options,
            ),
            canary_api_identity,
            scheduled_update_kind,
            scheduled_element,
            container_update_api: scheduled_update_kind.container_update_api(),
            scheduler_api: "ensure_root_is_scheduled",
            work_loop_finished_work_preflight,
            private_rust_root_created: true,
            private_root_canary_boundary_validated: true,
            public_renderer_root_created: false,
            public_root_available: false,
            native_addon_loaded: false,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: false,
            host_output_produced_from_js: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_create_route_admission_for_canary(
        root_create_preflight: Option<TestRendererRootCreatePreflightDiagnostics>,
        rust_admission_metadata: Option<TestRendererPrivateCreateRouteAdmissionMetadata>,
    ) -> Result<TestRendererPrivateCreateRouteAdmissionDiagnostics, TestRendererRootError> {
        let Some(rust_admission_metadata) = rust_admission_metadata else {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::MissingRustAdmissionRecord.into(),
            );
        };
        if !rust_admission_metadata.is_current() {
            let current = TestRendererPrivateCreateRouteAdmissionMetadata::current();
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleRustAdmissionRecord {
                    expected_metadata_id: current.metadata_id(),
                    actual_metadata_id: rust_admission_metadata.metadata_id(),
                    expected_root_api: current.root_api(),
                    actual_root_api: rust_admission_metadata.root_api(),
                }
                .into(),
            );
        }

        let Some(root_create_preflight) = root_create_preflight else {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::MissingRootCreatePreflight.into(),
            );
        };
        if root_create_preflight.diagnostic_name()
            != TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME
            || root_create_preflight.status() != TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS
        {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleRootCreatePreflight {
                    expected_diagnostic_name:
                        TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME,
                    actual_diagnostic_name: root_create_preflight.diagnostic_name(),
                    expected_status: TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS,
                    actual_status: root_create_preflight.status(),
                }
                .into(),
            );
        }

        let work_loop_finished_work_preflight =
            root_create_preflight.work_loop_finished_work_preflight();
        let work_loop_metadata = work_loop_finished_work_preflight.metadata();
        if !work_loop_metadata.is_current() {
            let current = TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current();
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleWorkLoopFinishedWorkPreflight {
                    expected_metadata_id: current.metadata_id(),
                    actual_metadata_id: work_loop_metadata.metadata_id(),
                    expected_render_phase_api: current.render_phase_api(),
                    actual_render_phase_api: work_loop_metadata.render_phase_api(),
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateCreateRouteAdmissionDiagnostics {
            record_id: TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID,
            diagnostic_name: TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS,
            root: root_create_preflight.root(),
            operation: "create",
            public_surface: "create()",
            js_facade_metadata_source: "FastReactTestRendererPrivateRootRequestRecord",
            rust_admission_metadata,
            root_create_preflight,
            work_loop_finished_work_preflight,
            scheduled_update_kind: root_create_preflight.scheduled_update_kind(),
            scheduled_element: root_create_preflight.scheduled_element(),
            rust_outcome: "Scheduled",
            consumes_js_facade_create_metadata: true,
            consumes_accepted_rust_root_create_execution_evidence: true,
            consumes_accepted_rust_root_create_preflight_diagnostics: true,
            consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata: true,
            missing_rust_admission_record_rejection: true,
            stale_rust_admission_record_rejection: true,
            public_renderer_root_created: false,
            public_root_available: false,
            public_create_behavior_available: false,
            public_serialization_available: false,
            native_addon_loaded: false,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: false,
            reconciler_execution_from_js: false,
            host_output_produced_from_js: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_create_native_bridge_host_output_handoff_for_canary(
        &self,
        admission: &TestRendererPrivateCreateRouteAdmissionDiagnostics,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateCreateNativeBridgeHostOutputHandoff, TestRendererRootError> {
        self.validate_private_create_native_bridge_host_output_handoff_for_canary(
            admission, output,
        )?;

        let gate = self.require_serialization_gate_ready_for_canary(output.commit())?;
        let shape =
            Self::private_to_json_host_output_shape_from_snapshot(output.snapshot()).shape();
        if shape != TestRendererPrivateToJsonHostOutputShape::SingleHostText {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::UnexpectedCreateHostOutputShape {
                    expected: TestRendererPrivateToJsonHostOutputShape::SingleHostText,
                    actual: shape,
                }
                .into(),
            );
        }
        Self::validate_private_json_canary_current_fibers(
            output.fiber_inspection(),
            TestRendererPrivateJsonCurrentFibersForCanary::Host(
                output.completed_fibers().current(),
            ),
        )?;

        let host_output = gate.host_output();
        if host_output.container_child_count() != 1
            || host_output.instance_count() != 1
            || host_output.text_count() != 1
            || !host_output.real_host_output_available()
        {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "host-output-counts-not-minimal-single-host-text",
                }
                .into(),
            );
        }

        let render_finished_work_handle = output.render().finished_work();
        let commit_current_handle = output.commit().current();
        let render_lanes_bits = output.render().render_lanes().bits();
        let commit_finished_lanes_bits = output.commit().finished_lanes().bits();
        let render_finished_work = TestRendererFiberHandleDiagnostics {
            arena_id: render_finished_work_handle.arena_id().get(),
            slot: render_finished_work_handle.slot().get(),
            generation: render_finished_work_handle.generation().get(),
        };
        let commit_current = TestRendererFiberHandleDiagnostics {
            arena_id: commit_current_handle.arena_id().get(),
            slot: commit_current_handle.slot().get(),
            generation: commit_current_handle.generation().get(),
        };
        let work_loop_finished_work_preflight = admission.work_loop_finished_work_preflight();

        Ok(TestRendererPrivateCreateNativeBridgeHostOutputHandoff {
            diagnostic_id:
                TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS,
            root: self.root_id,
            renderer_id: self.renderer.renderer_id,
            operation: "create",
            public_surface: "create()",
            create_route_admission_record_id: admission.record_id(),
            create_route_admission_status: admission.status(),
            scheduled_update_kind: admission.scheduled_update_kind(),
            scheduled_element: admission.scheduled_element(),
            host_output_update_kind: TestRendererRootUpdateKind::Create,
            host_output_shape: shape,
            host_output,
            serialization_gate_status: gate.status(),
            render_finished_work,
            commit_current,
            work_loop_finished_work_preflight,
            render_lanes_bits,
            commit_finished_lanes_bits,
            commit_remaining_lanes_bits: output.commit().remaining_lanes().bits(),
            commit_pending_lanes_bits: output.commit().pending_lanes().bits(),
            render_finished_work_matches_create_route_preflight: render_finished_work
                == work_loop_finished_work_preflight.finished_work(),
            commit_current_matches_render_finished_work: commit_current == render_finished_work,
            commit_lanes_match_render_lanes: commit_finished_lanes_bits == render_lanes_bits,
            minimal_tree_host_output_consumes_root_finished_work: true,
            minimal_tree_host_output_consumes_root_finished_lanes: true,
            create_route_admission_accepted: true,
            host_output_handoff_accepted: true,
            actual_rust_create_host_output_handoff: true,
            host_output_produced_by_rust: true,
            public_create_behavior_available: false,
            public_serialization_available: false,
            public_test_instance_available: false,
            native_addon_loaded: false,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: false,
            host_output_produced_from_js: false,
            compatibility_claimed: false,
        })
    }

    fn validate_private_create_native_bridge_host_output_handoff_for_canary(
        &self,
        admission: &TestRendererPrivateCreateRouteAdmissionDiagnostics,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<(), TestRendererRootError> {
        if admission.record_id() != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID
            || admission.diagnostic_name()
                != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_DIAGNOSTIC_NAME
            || admission.status() != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS
            || admission.operation() != "create"
            || admission.public_surface() != "create()"
        {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "create-route-admission-identity-mismatch",
                }
                .into(),
            );
        }
        if admission.root() != self.root_id {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "create-route-admission-root-mismatch",
                }
                .into(),
            );
        }
        if admission.scheduled_update_kind() != TestRendererRootUpdateKind::Create {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "create-route-admission-update-kind-mismatch",
                }
                .into(),
            );
        }

        let Some(scheduled_update) = self.scheduled_updates.last() else {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "missing-scheduled-create-update",
                }
                .into(),
            );
        };
        if scheduled_update.kind() != TestRendererRootUpdateKind::Create {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "scheduled-update-kind-mismatch",
                }
                .into(),
            );
        }
        if scheduled_update.element() != admission.scheduled_element() {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "scheduled-element-mismatch",
                }
                .into(),
            );
        }

        let render = output.render();
        let commit = output.commit();
        if render.root() != self.root_id || commit.root() != self.root_id {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "host-output-root-mismatch",
                }
                .into(),
            );
        }
        if render.resulting_element() != admission.scheduled_element() {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "host-output-resulting-element-mismatch",
                }
                .into(),
            );
        }
        if commit.current() != render.finished_work() {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "commit-current-finished-work-mismatch",
                }
                .into(),
            );
        }
        if render.render_lanes().is_empty()
            || commit.finished_lanes() != render.render_lanes()
            || !commit.remaining_lanes().is_empty()
            || !commit.pending_lanes().is_empty()
        {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "commit-finished-lanes-render-lanes-mismatch",
                }
                .into(),
            );
        }
        let work_loop_finished_work_preflight = admission.work_loop_finished_work_preflight();
        let render_finished_work = TestRendererFiberHandleDiagnostics {
            arena_id: render.finished_work().arena_id().get(),
            slot: render.finished_work().slot().get(),
            generation: render.finished_work().generation().get(),
        };
        if work_loop_finished_work_preflight.finished_work() != render_finished_work {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "create-route-admission-finished-work-mismatch",
                }
                .into(),
            );
        }
        if work_loop_finished_work_preflight.render_lanes_bits() != render.render_lanes().bits()
            || work_loop_finished_work_preflight.remaining_lanes_bits()
                != render.remaining_lanes().bits()
        {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "create-route-admission-finished-lanes-mismatch",
                }
                .into(),
            );
        }
        if !work_loop_finished_work_preflight.finished_work_matches_render_phase()
            || !work_loop_finished_work_preflight.records_accepted_finished_work_metadata()
        {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "create-route-admission-work-loop-preflight-not-accepted",
                }
                .into(),
            );
        }

        Ok(())
    }
}
