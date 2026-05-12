use super::super::*;

impl TestRendererRoot {
    pub fn describe_private_update_route_via_root_work_loop_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateUpdateRouteDiagnostics, TestRendererRootError> {
        if self.lifecycle != TestRendererRootLifecycle::Active {
            return Err(TestRendererPrivateUpdateRouteError::RootNotActive {
                lifecycle: self.lifecycle,
            }
            .into());
        }
        self.validate_serialization_gate_commit(output.commit())?;

        let Some(scheduled_update) = self.scheduled_updates.last() else {
            return Err(TestRendererPrivateUpdateRouteError::MissingScheduledUpdate.into());
        };
        let scheduled_update_sequence = self.scheduled_updates.len();
        if scheduled_update.kind() != TestRendererRootUpdateKind::Update {
            return Err(
                TestRendererPrivateUpdateRouteError::UnexpectedScheduledUpdateKind {
                    actual: scheduled_update.kind(),
                }
                .into(),
            );
        }

        let render = output.render();
        let commit = output.commit();
        if render.root() != self.root_id {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "render-root-mismatch",
                }
                .into(),
            );
        }
        if commit.current() != render.finished_work() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "commit-current-finished-work-mismatch",
                }
                .into(),
            );
        }
        if commit.previous_current() != render.current() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "commit-previous-current-mismatch",
                }
                .into(),
            );
        }
        if commit.finished_lanes() != render.render_lanes() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "commit-finished-lanes-mismatch",
                }
                .into(),
            );
        }
        if render.applied_update_count() != 1 || render.skipped_update_count() != 0 {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "unexpected-render-update-counts",
                }
                .into(),
            );
        }
        if scheduled_update.element() != render.resulting_element() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "scheduled-element-mismatch",
                }
                .into(),
            );
        }
        if scheduled_update.container_update().queue() != render.current_update_queue() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "update-queue-mismatch",
                }
                .into(),
            );
        }
        if scheduled_update
            .container_update()
            .pending_lanes_after_enqueue()
            != render.render_lanes()
        {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "pending-lanes-mismatch",
                }
                .into(),
            );
        }
        if scheduled_update.container_update().selected_next_lanes() != render.render_lanes() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "selected-lanes-mismatch",
                }
                .into(),
            );
        }

        let committed_current_update_queue = self
            .store
            .fiber_arena()
            .get(commit.current())
            .map_err(FiberRootStoreError::from)?
            .update_queue();
        if committed_current_update_queue != render.work_in_progress_update_queue() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "committed-current-queue-mismatch",
                }
                .into(),
            );
        }

        let updated_fibers = output.updated_fibers();
        let text_update_apply_recorded = commit.has_test_only_host_text_update_apply_for_canary(
            updated_fibers.previous().text(),
            updated_fibers.current().text(),
            updated_fibers.text_state_node_raw(),
        );
        if !text_update_apply_recorded {
            return Err(TestRendererPrivateUpdateRouteError::MissingHostTextUpdateApply.into());
        }
        let Some(TestNodeSnapshot::Element(previous_component)) =
            output.previous_snapshot().children().first()
        else {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "previous-host-component-snapshot-missing",
                }
                .into(),
            );
        };
        let Some(TestNodeSnapshot::Element(current_component)) =
            output.snapshot().children().first()
        else {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "current-host-component-snapshot-missing",
                }
                .into(),
            );
        };
        let host_component_prop_update_recorded =
            previous_component.props().attributes() != current_component.props().attributes();
        let host_component_style_update_recorded =
            previous_component.props().styles() != current_component.props().styles();

        let schedule_fiber = scheduled_update.container_update().schedule().fiber();
        let render_current = render.current();
        let render_finished_work = render.finished_work();
        let commit_previous_current = commit.previous_current();
        let commit_current = commit.current();
        Ok(TestRendererPrivateUpdateRouteDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS,
            root: self.root_id,
            host_output_update_kind: TestRendererRootUpdateKind::Update,
            update_queue: TestRendererPrivateUpdateRouteQueueDiagnostics {
                root: scheduled_update.container_update().schedule().root(),
                scheduled_update_kind: scheduled_update.kind(),
                scheduled_element: scheduled_update.element(),
                update_raw: scheduled_update.container_update().update().raw(),
                queue_raw: scheduled_update.container_update().queue().raw(),
                schedule_fiber: TestRendererFiberHandleDiagnostics {
                    arena_id: schedule_fiber.arena_id().get(),
                    slot: schedule_fiber.slot().get(),
                    generation: schedule_fiber.generation().get(),
                },
                lane_bits: scheduled_update.container_update().lane().bits(),
                pending_lanes_before_enqueue_bits: scheduled_update
                    .container_update()
                    .pending_lanes_before_enqueue()
                    .bits(),
                pending_lanes_after_enqueue_bits: scheduled_update
                    .container_update()
                    .pending_lanes_after_enqueue()
                    .bits(),
                selected_next_lanes_bits: scheduled_update
                    .container_update()
                    .selected_next_lanes()
                    .bits(),
                render_lanes_bits: render.render_lanes().bits(),
                queue_matches_render_current_queue: scheduled_update.container_update().queue()
                    == render.current_update_queue(),
                selected_lanes_match_render_lanes: scheduled_update
                    .container_update()
                    .selected_next_lanes()
                    == render.render_lanes(),
                pending_lanes_after_enqueue_match_render_lanes: scheduled_update
                    .container_update()
                    .pending_lanes_after_enqueue()
                    == render.render_lanes(),
                root_schedule_inserted: scheduled_update.root_schedule().inserted(),
                root_schedule_microtask_requested: scheduled_update
                    .root_schedule()
                    .microtask()
                    .is_some(),
                root_schedule_might_have_pending_sync_work: scheduled_update
                    .root_schedule()
                    .might_have_pending_sync_work(),
            },
            root_work_loop: TestRendererPrivateUpdateRouteWorkLoopDiagnostics {
                root: render.root(),
                render_current: TestRendererFiberHandleDiagnostics {
                    arena_id: render_current.arena_id().get(),
                    slot: render_current.slot().get(),
                    generation: render_current.generation().get(),
                },
                render_finished_work: TestRendererFiberHandleDiagnostics {
                    arena_id: render_finished_work.arena_id().get(),
                    slot: render_finished_work.slot().get(),
                    generation: render_finished_work.generation().get(),
                },
                commit_current: TestRendererFiberHandleDiagnostics {
                    arena_id: commit_current.arena_id().get(),
                    slot: commit_current.slot().get(),
                    generation: commit_current.generation().get(),
                },
                current_update_queue_raw: render.current_update_queue().raw(),
                work_in_progress_update_queue_raw: render.work_in_progress_update_queue().raw(),
                committed_current_update_queue_raw: committed_current_update_queue.raw(),
                applied_update_count: render.applied_update_count(),
                skipped_update_count: render.skipped_update_count(),
                remaining_lanes_empty: render.remaining_lanes().is_empty(),
                commit_finished_lanes_bits: commit.finished_lanes().bits(),
                commit_remaining_lanes_empty: commit.remaining_lanes().is_empty(),
                commit_pending_lanes_empty: commit.pending_lanes().is_empty(),
                commit_current_matches_render_finished_work: commit.current()
                    == render.finished_work(),
                commit_previous_current_matches_render_current: commit.previous_current()
                    == render.current(),
                commit_lanes_match_render_lanes: commit.finished_lanes() == render.render_lanes(),
                committed_current_queue_matches_work_in_progress: committed_current_update_queue
                    == render.work_in_progress_update_queue(),
                root_current_matches_commit_current: self.store.root(self.root_id)?.current()
                    == commit.current(),
            },
            host_text_update: TestRendererPrivateUpdateRouteHostTextDiagnostics {
                previous_text_fiber: TestRendererFiberHandleDiagnostics {
                    arena_id: updated_fibers.previous().text().arena_id().get(),
                    slot: updated_fibers.previous().text().slot().get(),
                    generation: updated_fibers.previous().text().generation().get(),
                },
                updated_text_fiber: TestRendererFiberHandleDiagnostics {
                    arena_id: updated_fibers.current().text().arena_id().get(),
                    slot: updated_fibers.current().text().slot().get(),
                    generation: updated_fibers.current().text().generation().get(),
                },
                text_state_node_raw: updated_fibers.text_state_node_raw(),
                host_component_prop_update_recorded,
                host_component_style_update_recorded,
                text_update_apply_recorded,
                host_text_update_apply_count: commit
                    .test_only_host_text_update_apply_count_for_canary(),
                host_component_update_apply_count: commit
                    .test_only_host_component_update_apply_count_for_canary(),
            },
            admission: TestRendererPrivateUpdateRouteAdmissionRecord {
                record_id: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
                status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
                public_surface: "create().update",
                root: self.root_id,
                renderer_id: self.renderer.renderer_id,
                scheduled_update_sequence,
                request_api: "TestRendererRoot::update",
                source_diagnostic_name: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME,
                source_diagnostic_status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS,
                lifecycle: self.lifecycle,
                scheduled_update_kind: scheduled_update.kind(),
                host_output_update_kind: TestRendererRootUpdateKind::Update,
                render_current: TestRendererFiberHandleDiagnostics {
                    arena_id: render_current.arena_id().get(),
                    slot: render_current.slot().get(),
                    generation: render_current.generation().get(),
                },
                render_finished_work: TestRendererFiberHandleDiagnostics {
                    arena_id: render_finished_work.arena_id().get(),
                    slot: render_finished_work.slot().get(),
                    generation: render_finished_work.generation().get(),
                },
                commit_previous_current: TestRendererFiberHandleDiagnostics {
                    arena_id: commit_previous_current.arena_id().get(),
                    slot: commit_previous_current.slot().get(),
                    generation: commit_previous_current.generation().get(),
                },
                commit_current: TestRendererFiberHandleDiagnostics {
                    arena_id: commit_current.arena_id().get(),
                    slot: commit_current.slot().get(),
                    generation: commit_current.generation().get(),
                },
                render_lanes_bits: render.render_lanes().bits(),
                commit_finished_lanes_bits: commit.finished_lanes().bits(),
                consumes_accepted_host_root_update_queue_metadata: true,
                consumes_accepted_root_work_loop_metadata: true,
                consumes_accepted_host_output_metadata: true,
                rejects_stale_root_lifecycle: true,
                rejects_stale_host_output: true,
                rejects_missing_update_queue_evidence: true,
                public_root_update_available: false,
                public_serialization_available: false,
                native_execution_available: false,
                compatibility_claimed: false,
            },
            consumes_accepted_host_root_update_queue_metadata: true,
            consumes_accepted_root_work_loop_metadata: true,
            consumes_manual_host_output_canary: true,
            public_root_update_available: false,
            public_serialization_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_update_route_admission_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateUpdateRouteAdmissionRecord, TestRendererRootError> {
        Ok(self
            .describe_private_update_route_via_root_work_loop_for_canary(output)?
            .admission())
    }

    pub fn describe_private_sibling_text_update_route_admission_for_canary(
        &self,
        output: &TestRendererSiblingTextHostOutput,
    ) -> Result<TestRendererPrivateUpdateRouteAdmissionRecord, TestRendererRootError> {
        if self.lifecycle != TestRendererRootLifecycle::Active {
            return Err(TestRendererPrivateUpdateRouteError::RootNotActive {
                lifecycle: self.lifecycle,
            }
            .into());
        }
        let Some(scheduled_update) = self.scheduled_updates.last() else {
            return Err(TestRendererPrivateUpdateRouteError::MissingScheduledUpdate.into());
        };
        if scheduled_update.kind() != TestRendererRootUpdateKind::Update {
            return Err(
                TestRendererPrivateUpdateRouteError::UnexpectedScheduledUpdateKind {
                    actual: scheduled_update.kind(),
                }
                .into(),
            );
        }
        if output.scheduled_update_sequence() != self.scheduled_updates.len() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "sibling-text-handoff-update-sequence-stale",
                }
                .into(),
            );
        }

        self.validate_serialization_gate_commit(output.commit())?;
        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Err(
                TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
                    reason: "host-output-snapshot-stale",
                }
                .into(),
            );
        }
        if output.fiber_inspection().shape_name() != "HostRoot->[HostText,HostComponent->HostText]"
        {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "sibling-text-committed-fiber-inspection-shape-mismatch",
                }
                .into(),
            );
        }

        let render = output.render();
        let commit = output.commit();
        if render.root() != self.root_id || commit.root() != self.root_id {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "sibling-text-route-root-mismatch",
                }
                .into(),
            );
        }
        if commit.current() != render.finished_work()
            || commit.previous_current() != render.current()
        {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "sibling-text-route-finished-work-mismatch",
                }
                .into(),
            );
        }
        if commit.finished_lanes() != render.render_lanes()
            || commit.remaining_lanes().bits() != 0
            || commit.pending_lanes().bits() != 0
        {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "sibling-text-route-lane-mismatch",
                }
                .into(),
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

        Ok(TestRendererPrivateUpdateRouteAdmissionRecord {
            record_id: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            public_surface: "create().update",
            root: self.root_id,
            renderer_id: self.renderer.renderer_id,
            scheduled_update_sequence: output.scheduled_update_sequence(),
            request_api: "TestRendererRoot::update",
            source_diagnostic_name: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME,
            source_diagnostic_status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS,
            lifecycle: self.lifecycle,
            scheduled_update_kind: scheduled_update.kind(),
            host_output_update_kind: TestRendererRootUpdateKind::Update,
            render_current: fiber_handle!(render.current()),
            render_finished_work: fiber_handle!(render.finished_work()),
            commit_previous_current: fiber_handle!(commit.previous_current()),
            commit_current: fiber_handle!(commit.current()),
            render_lanes_bits: render.render_lanes().bits(),
            commit_finished_lanes_bits: commit.finished_lanes().bits(),
            consumes_accepted_host_root_update_queue_metadata: true,
            consumes_accepted_root_work_loop_metadata: true,
            consumes_accepted_host_output_metadata: true,
            rejects_stale_root_lifecycle: true,
            rejects_stale_host_output: true,
            rejects_missing_update_queue_evidence: true,
            public_root_update_available: false,
            public_serialization_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_multi_child_host_text_update_route_admission_for_canary(
        &self,
        output: &TestRendererHostParentPlacedHostOutput,
    ) -> Result<TestRendererPrivateUpdateRouteAdmissionRecord, TestRendererRootError> {
        if self.lifecycle != TestRendererRootLifecycle::Active {
            return Err(TestRendererPrivateUpdateRouteError::RootNotActive {
                lifecycle: self.lifecycle,
            }
            .into());
        }
        let Some(scheduled_update) = self.scheduled_updates.last() else {
            return Err(TestRendererPrivateUpdateRouteError::MissingScheduledUpdate.into());
        };
        if scheduled_update.kind() != TestRendererRootUpdateKind::Update {
            return Err(
                TestRendererPrivateUpdateRouteError::UnexpectedScheduledUpdateKind {
                    actual: scheduled_update.kind(),
                }
                .into(),
            );
        }
        if output.scheduled_update_sequence() != self.scheduled_updates.len() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "multi-child-host-text-output-update-sequence-stale",
                }
                .into(),
            );
        }

        self.validate_private_multi_child_host_text_output_for_canary(output)?;

        let render = output.render();
        let commit = output.commit();
        if render.root() != self.root_id || commit.root() != self.root_id {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "multi-child-host-text-route-root-mismatch",
                }
                .into(),
            );
        }
        if commit.current() != render.finished_work()
            || commit.previous_current() != render.current()
        {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "multi-child-host-text-finished-work-mismatch",
                }
                .into(),
            );
        }
        if commit.finished_lanes() != render.render_lanes()
            || commit.remaining_lanes().bits() != 0
            || commit.pending_lanes().bits() != 0
        {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "multi-child-host-text-lane-mismatch",
                }
                .into(),
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

        Ok(TestRendererPrivateUpdateRouteAdmissionRecord {
            record_id: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            public_surface: "create().update",
            root: self.root_id,
            renderer_id: self.renderer.renderer_id,
            scheduled_update_sequence: output.scheduled_update_sequence(),
            request_api: "TestRendererRoot::update",
            source_diagnostic_name: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME,
            source_diagnostic_status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS,
            lifecycle: self.lifecycle,
            scheduled_update_kind: scheduled_update.kind(),
            host_output_update_kind: TestRendererRootUpdateKind::Update,
            render_current: fiber_handle!(render.current()),
            render_finished_work: fiber_handle!(render.finished_work()),
            commit_previous_current: fiber_handle!(commit.previous_current()),
            commit_current: fiber_handle!(commit.current()),
            render_lanes_bits: render.render_lanes().bits(),
            commit_finished_lanes_bits: commit.finished_lanes().bits(),
            consumes_accepted_host_root_update_queue_metadata: true,
            consumes_accepted_root_work_loop_metadata: true,
            consumes_accepted_host_output_metadata: true,
            rejects_stale_root_lifecycle: true,
            rejects_stale_host_output: true,
            rejects_missing_update_queue_evidence: true,
            public_root_update_available: false,
            public_serialization_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_update_native_bridge_admission_for_canary(
        &self,
        route_outcome: &TestRendererRootUpdateOutcome,
        handoff: Option<&TestRendererUpdatedHostOutput>,
    ) -> Result<TestRendererUpdateNativeBridgeAdmission, TestRendererRootError> {
        let Some(scheduled_update) = route_outcome.scheduled() else {
            return Err(
                TestRendererPrivateUpdateNativeBridgeAdmissionError::UnexpectedRouteOutcome {
                    actual: route_outcome.code(),
                }
                .into(),
            );
        };
        if scheduled_update.kind() != TestRendererRootUpdateKind::Update {
            return Err(
                TestRendererPrivateUpdateNativeBridgeAdmissionError::UnexpectedScheduledUpdateKind {
                    actual: scheduled_update.kind(),
                }
                .into(),
            );
        }
        if self.scheduled_updates.last() != Some(scheduled_update) {
            return Err(
                TestRendererPrivateUpdateNativeBridgeAdmissionError::StaleRouteOutcome.into(),
            );
        }

        let Some(handoff) = handoff else {
            return Err(
                TestRendererPrivateUpdateNativeBridgeAdmissionError::MissingHostOutputHandoff
                    .into(),
            );
        };
        let route = self.describe_private_update_route_via_root_work_loop_for_canary(handoff)?;
        let host_text_update = route.host_text_update();

        Ok(TestRendererUpdateNativeBridgeAdmission {
            diagnostic_id: TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS,
            root: self.root_id,
            renderer_id: self.renderer.renderer_id,
            route_dependency_id: TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID,
            update_route_admission_id: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            lifecycle: self.lifecycle,
            scheduled_update_kind: scheduled_update.kind(),
            host_output_update_kind: route.host_output_update_kind(),
            update_route_admission_accepted: route.admission().record_id()
                == TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            lifecycle_evidence_accepted: true,
            root_work_loop_handoff_accepted: true,
            host_output_handoff_accepted: true,
            host_component_prop_update_recorded: host_text_update
                .host_component_prop_update_recorded(),
            host_component_style_update_recorded: host_text_update
                .host_component_style_update_recorded(),
            text_update_apply_recorded: host_text_update.text_update_apply_recorded(),
            host_text_update_apply_count: host_text_update.host_text_update_apply_count(),
            host_component_update_apply_count: host_text_update.host_component_update_apply_count(),
            rejects_stale_update_handoffs: true,
            rejects_unmounted_roots: true,
            rejects_missing_host_output_handoff: true,
            public_update_compatibility_claimed: false,
            public_serialization_available: false,
            act_flushing_claimed: false,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: true,
            reconciler_execution_from_js: true,
            compatibility_claimed: false,
        })
    }

    pub fn render_and_admit_private_update_native_bridge_handoff_for_canary(
        &mut self,
        element_type: impl Into<TestElementType>,
        props: TestProps,
        text: impl Into<String>,
    ) -> Result<
        (
            TestRendererRootUpdateOutcome,
            TestRendererUpdatedHostOutput,
            TestRendererUpdateNativeBridgeAdmission,
        ),
        TestRendererRootError,
    > {
        let route_outcome =
            self.update_host_component_with_props_and_text_for_canary(element_type, props, text)?;
        let Some(handoff) = self.render_and_commit_host_output_update_for_canary()? else {
            return Err(
                TestRendererPrivateUpdateNativeBridgeAdmissionError::MissingHostOutputHandoff
                    .into(),
            );
        };
        let admission = self.describe_private_update_native_bridge_admission_for_canary(
            &route_outcome,
            Some(&handoff),
        )?;
        Ok((route_outcome, handoff, admission))
    }
}
