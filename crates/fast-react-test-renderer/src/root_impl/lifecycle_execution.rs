use super::super::*;

impl TestRendererRoot {
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
}
