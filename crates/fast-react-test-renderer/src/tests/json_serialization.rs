use super::*;

#[test]
fn root_private_json_serialization_canary_describes_minimal_host_component_with_text() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let output = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();

    let report = root
        .describe_private_json_serialization_for_canary(&output)
        .unwrap();
    let gate = report.gate();
    let host_output = gate.host_output();
    let fiber_inspection = gate.fiber_inspection().unwrap();
    let blockers = report.public_blockers();
    let component = report.component();
    let text = component.text_child();
    let nodes = report.nodes();
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
    let host_root_fiber = fiber_handle!(fiber_inspection.host_root().fiber());
    let component_fiber = fiber_handle!(fiber_inspection.host_component().fiber());
    let text_fiber = fiber_handle!(fiber_inspection.host_text().fiber());

    assert_eq!(
        report.diagnostic_name(),
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        report.host_output_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert!(report.host_output_snapshot_current());
    assert_eq!(
        gate.status(),
        TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
    );
    assert!(!gate.is_closed());
    assert!(gate.is_ready());
    assert_eq!(host_output.container_child_count(), 1);
    assert_eq!(host_output.instance_count(), 1);
    assert_eq!(host_output.text_count(), 1);
    assert!(host_output.real_host_output_available());
    assert!(gate.requirements().root_commit_diagnostics_available());
    assert!(gate.requirements().real_host_output_available());
    assert!(gate.requirements().committed_fiber_inspection_available());
    assert!(gate.requirements().private_serialization_ready());
    assert_eq!(fiber_inspection.current(), output.commit().current());
    assert_eq!(
        fiber_inspection.host_component().fiber(),
        output.completed_fibers().component()
    );
    assert_eq!(
        fiber_inspection.host_text().fiber(),
        output.completed_fibers().text()
    );
    assert_eq!(report.root_child_count(), 1);
    assert_eq!(
        report.root_node_kind(),
        TestRendererPrivateJsonNodeKind::HostComponent
    );
    assert_eq!(
        component.node_kind(),
        TestRendererPrivateJsonNodeKind::HostComponent
    );
    assert_eq!(report.node_count(), 2);
    assert_eq!(nodes.len(), 2);
    assert_eq!(nodes[0].ordinal(), 0);
    assert_eq!(
        nodes[0].node_kind(),
        TestRendererPrivateJsonNodeKind::HostComponent
    );
    assert_eq!(nodes[0].parent_ordinal(), None);
    assert_eq!(nodes[0].child_ordinals(), &[1]);
    assert_eq!(nodes[0].child_count(), 1);
    assert_eq!(nodes[0].element_type().unwrap().as_str(), "span");
    assert_eq!(nodes[0].props(), Some(&TestProps::new()));
    assert_eq!(nodes[0].text(), None);
    assert!(!nodes[0].is_hidden());
    assert!(!nodes[0].is_detached());
    assert_eq!(nodes[0].fiber().fiber(), component_fiber);
    assert_eq!(nodes[0].fiber().parent(), Some(host_root_fiber));
    assert_eq!(nodes[0].fiber().child(), Some(text_fiber));
    assert_eq!(nodes[0].fiber().sibling(), None);
    assert_eq!(nodes[0].fiber().pending_props_raw(), 1);
    assert_eq!(nodes[0].fiber().memoized_props_raw(), 1);
    assert!(nodes[0].fiber().state_node_present());
    assert_eq!(nodes[1].ordinal(), 1);
    assert_eq!(nodes[1].node_kind(), TestRendererPrivateJsonNodeKind::Text);
    assert_eq!(nodes[1].parent_ordinal(), Some(0));
    assert!(nodes[1].child_ordinals().is_empty());
    assert_eq!(nodes[1].child_count(), 0);
    assert!(nodes[1].element_type().is_none());
    assert!(nodes[1].props().is_none());
    assert_eq!(nodes[1].text(), Some("hello"));
    assert!(!nodes[1].is_hidden());
    assert!(!nodes[1].is_detached());
    assert_eq!(nodes[1].fiber().fiber(), text_fiber);
    assert_eq!(nodes[1].fiber().parent(), Some(component_fiber));
    assert_eq!(nodes[1].fiber().child(), None);
    assert_eq!(nodes[1].fiber().sibling(), None);
    assert_eq!(nodes[1].fiber().pending_props_raw(), 2);
    assert_eq!(nodes[1].fiber().memoized_props_raw(), 2);
    assert!(nodes[1].fiber().state_node_present());
    assert_eq!(component.element_type().as_str(), "span");
    assert_eq!(component.props(), &TestProps::new());
    assert_eq!(component.child_count(), 1);
    assert!(!component.is_hidden());
    assert!(!component.is_detached());
    assert_eq!(text.node_kind(), TestRendererPrivateJsonNodeKind::Text);
    assert_eq!(text.text(), "hello");
    assert!(!text.is_hidden());
    assert!(blockers.all_blocked());
    assert!(blockers.json_method_blocked());
    assert!(blockers.tree_method_blocked());
    assert!(blockers.instance_wrapper_blocked());
    assert!(blockers.js_facade_routing_blocked());
    assert!(blockers.public_act_blocked());
    assert!(blockers.compatibility_claim_blocked());
}

#[test]
fn root_private_json_serialization_canary_describes_updated_host_component_text_after_commit() {
    let initial_props = props().with_attribute("data-state", "old");
    let updated_props = props().with_attribute("data-state", "new");
    let mut root = TestRendererRoot::create_host_component_with_props_and_text_for_canary(
        "span",
        initial_props.clone(),
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let created = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_props_and_text_for_canary(
        "span",
        updated_props.clone(),
        "goodbye",
    )
    .unwrap();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();

    let report = root
        .describe_private_json_serialization_after_update_for_canary(&updated)
        .unwrap();
    let gate = report.gate();
    let fiber_inspection = gate.fiber_inspection().unwrap();
    let component = report.component();
    let text = component.text_child();
    let nodes = report.nodes();

    assert_eq!(updated.render().current(), created.commit().current());
    assert_eq!(updated.commit().current(), updated.render().finished_work());
    assert_eq!(
        report.diagnostic_name(),
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        report.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        report.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SingleHostText
    );
    let row = report.host_output_row().unwrap();
    let dependencies = row.dependency_diagnostics();
    assert_eq!(
        row.id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(
        row.status(),
        TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_UNMOUNT_ROW_STATUS
    );
    assert_eq!(
        row.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        row.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SingleHostText
    );
    assert_eq!(row.previous_root_child_count(), 1);
    assert_eq!(row.current_root_child_count(), 1);
    assert_eq!(row.previous_host_component_count(), 1);
    assert_eq!(row.current_host_component_count(), 1);
    assert_eq!(row.previous_host_text_count(), 1);
    assert_eq!(row.current_host_text_count(), 1);
    assert_eq!(row.current_root_text_count(), 0);
    assert_eq!(row.current_max_host_component_depth(), 1);
    assert_eq!(
        dependencies.route_row_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID
    );
    assert_eq!(
        dependencies.serialization_row_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_SERIALIZATION_DEPENDENCY_ID
    );
    assert!(dependencies.route_diagnostics_available());
    assert!(dependencies.serialization_diagnostics_available());
    assert!(dependencies.host_output_snapshot_current());
    assert!(dependencies.public_surfaces_blocked());
    assert!(row.public_blockers().all_blocked());
    assert!(report.host_output_snapshot_current());
    assert_eq!(
        gate.status(),
        TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
    );
    assert_eq!(fiber_inspection, updated.fiber_inspection());
    assert_eq!(fiber_inspection.current(), updated.commit().current());
    assert_eq!(
        fiber_inspection.host_component().fiber(),
        updated.updated_fibers().component()
    );
    assert_eq!(
        fiber_inspection.host_text().fiber(),
        updated.updated_fibers().text()
    );
    assert_eq!(report.root_child_count(), 1);
    assert_eq!(
        report.root_node_kind(),
        TestRendererPrivateJsonNodeKind::HostComponent
    );
    assert_eq!(report.node_count(), 2);
    assert_eq!(nodes[0].ordinal(), 0);
    assert_eq!(
        nodes[0].node_kind(),
        TestRendererPrivateJsonNodeKind::HostComponent
    );
    assert_eq!(nodes[0].element_type().unwrap().as_str(), "span");
    assert_eq!(nodes[0].props(), Some(&updated_props));
    assert_eq!(nodes[0].child_ordinals(), &[1]);
    assert_eq!(nodes[1].ordinal(), 1);
    assert_eq!(nodes[1].node_kind(), TestRendererPrivateJsonNodeKind::Text);
    assert_eq!(nodes[1].parent_ordinal(), Some(0));
    assert_eq!(nodes[1].text(), Some("goodbye"));
    assert_eq!(component.element_type().as_str(), "span");
    assert_eq!(component.props(), &updated_props);
    assert_eq!(component.child_count(), 1);
    assert_eq!(text.text(), "goodbye");
    assert!(report.public_blockers().all_blocked());

    let TestNodeSnapshot::Element(previous) = &updated.previous_snapshot().children()[0] else {
        panic!("expected previous host component");
    };
    assert_eq!(previous.props(), &initial_props);
    assert_eq!(child_texts(previous), vec!["hello"]);
    let TestNodeSnapshot::Element(current) = &updated.snapshot().children()[0] else {
        panic!("expected updated host component");
    };
    assert_eq!(current.props(), &updated_props);
    assert_eq!(child_texts(current), vec!["goodbye"]);
}

#[test]
fn root_private_to_json_facade_result_canary_wraps_create_serialization_evidence() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let output = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();

    let result = root
        .describe_private_to_json_facade_result_for_canary(&output)
        .unwrap();

    assert_eq!(
        result.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME
    );
    assert_eq!(
        result.source_diagnostic_name(),
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        result.host_output_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert_eq!(
        result.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SingleHostText
    );
    assert!(result.host_output_snapshot_current());
    assert_eq!(result.element_type().as_str(), "span");
    assert_eq!(result.props(), &TestProps::new());
    assert_eq!(result.children(), &["hello".to_owned()]);
    assert_eq!(result.child_count(), 1);
    let rendered_root = result.rendered_root().as_host_component().unwrap();
    assert_eq!(rendered_root.element_type().as_str(), "span");
    assert!(rendered_root.props().is_empty());
    assert_eq!(
        rendered_root.children().unwrap()[0].as_text(),
        Some("hello")
    );
    assert_eq!(result.source_node_count(), 2);
    assert!(result.public_blockers().all_blocked());
    assert!(!result.public_serialization_available());
    assert!(!result.compatibility_claimed());
}

#[test]
fn root_private_to_json_facade_result_canary_wraps_update_serialization_evidence() {
    let initial_props = props().with_attribute("data-state", "old");
    let updated_props = props().with_attribute("data-state", "new");
    let mut root = TestRendererRoot::create_host_component_with_props_and_text_for_canary(
        "span",
        initial_props,
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_props_and_text_for_canary(
        "span",
        updated_props.clone(),
        "goodbye",
    )
    .unwrap();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();

    let result = root
        .describe_private_to_json_facade_result_after_update_for_canary(&updated)
        .unwrap();

    assert_eq!(
        result.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME
    );
    assert_eq!(
        result.source_diagnostic_name(),
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        result.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        result.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SingleHostText
    );
    assert_eq!(
        result.host_output_row().unwrap().id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
    );
    assert!(result.host_output_snapshot_current());
    assert_eq!(result.element_type().as_str(), "span");
    assert_eq!(result.props(), &updated_props);
    assert_eq!(result.children(), &["goodbye".to_owned()]);
    let rendered_root = result.rendered_root().as_host_component().unwrap();
    assert_eq!(
        rendered_root.props().get("data-state").map(String::as_str),
        Some("new")
    );
    assert_eq!(
        rendered_root.children().unwrap()[0].as_text(),
        Some("goodbye")
    );
    assert_eq!(result.source_node_count(), 2);
    assert!(result.public_blockers().all_blocked());
    assert!(!result.public_serialization_available());
    assert!(!result.compatibility_claimed());
}

#[test]
fn root_private_to_json_native_execution_evidence_consumes_create_update_unmount_records() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let create_input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        root_element(1),
        "span",
    );
    let create_preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
        create_input,
        Some(TestRendererOptions::new()),
        TestRendererRootCreatePreflightCanaryApiIdentity::current(),
        Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
    )
    .unwrap();
    let create_admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
        Some(create_preflight),
        Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
    )
    .unwrap();
    let created = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let create_report = root
        .describe_private_json_serialization_for_canary(&created)
        .unwrap();
    let create_identity = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(created.render()),
            Some(created.commit()),
            Some(&create_report),
        )
        .unwrap();

    let create_evidence = root
        .describe_private_to_json_after_create_native_execution_for_canary(
            &created,
            create_admission,
            Some(create_identity),
        )
        .unwrap();

    assert_eq!(
        create_evidence.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        create_evidence.status(),
        TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_STATUS
    );
    assert_eq!(create_evidence.root(), root.root_id());
    assert_eq!(create_evidence.operation(), "create");
    assert_eq!(create_evidence.public_surface(), "create().toJSON");
    assert_eq!(
        create_evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID
    );
    assert_eq!(
        create_evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert_eq!(
        create_evidence.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SingleHostText
    );
    assert!(create_evidence.host_output_row().is_none());
    assert!(
        create_evidence
            .rendered_root()
            .as_host_component()
            .is_some()
    );
    assert_eq!(create_evidence.source_node_count(), 2);
    assert_eq!(create_evidence.root_child_count(), 1);
    assert!(create_evidence.consumes_accepted_native_create_execution_record());
    assert!(!create_evidence.consumes_accepted_native_update_execution_record());
    assert!(!create_evidence.consumes_accepted_native_unmount_execution_record());
    assert!(create_evidence.consumes_private_to_json_evidence());
    assert!(create_evidence.minimal_tree_shape());
    assert!(!create_evidence.public_to_json_available());
    assert!(!create_evidence.public_serialization_available());
    assert!(!create_evidence.public_route_available());
    assert!(!create_evidence.native_bridge_available());
    assert!(!create_evidence.native_execution_available());
    assert!(!create_evidence.compatibility_claimed());

    root.update_host_component_with_props_and_text_for_canary(
        "span",
        props().with_attribute("data-state", "new"),
        "goodbye",
    )
    .unwrap();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    let update_admission = root
        .describe_private_update_route_admission_for_canary(&updated)
        .unwrap();
    let update_report = root
        .describe_private_json_serialization_after_update_for_canary(&updated)
        .unwrap();
    let update_identity = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(updated.render()),
            Some(updated.commit()),
            Some(&update_report),
        )
        .unwrap();

    let update_evidence = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &updated,
            update_admission,
            Some(update_identity),
        )
        .unwrap();

    assert_eq!(update_evidence.operation(), "update");
    assert_eq!(
        update_evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
    );
    assert_eq!(
        update_evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        update_evidence.host_output_row().unwrap().id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
    );
    assert!(!update_evidence.consumes_accepted_native_create_execution_record());
    assert!(update_evidence.consumes_accepted_native_update_execution_record());
    assert!(!update_evidence.consumes_accepted_native_unmount_execution_record());
    assert!(update_evidence.consumes_accepted_host_output_row());
    assert!(update_evidence.minimal_tree_shape());
    let updated_rendered_root = update_evidence.rendered_root().as_host_component().unwrap();
    assert_eq!(
        updated_rendered_root
            .props()
            .get("data-state")
            .map(String::as_str),
        Some("new")
    );
    assert_eq!(
        updated_rendered_root.children().unwrap()[0].as_text(),
        Some("goodbye")
    );
    assert!(!update_evidence.public_serialization_available());
    assert!(!update_evidence.compatibility_claimed());

    let unmount_outcome = root.unmount().unwrap();
    let unmounted = root
        .render_and_commit_host_output_unmount_for_canary()
        .unwrap()
        .unwrap();
    let unmount_handoff = root
        .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
        .unwrap();
    let unmount_admission = root
        .describe_private_unmount_native_bridge_admission_for_canary(
            &unmount_outcome,
            Some(&unmount_handoff),
        )
        .unwrap();
    let unmount_identity = root
        .describe_private_to_json_unmount_finished_work_identity_gate_for_canary(
            &unmounted,
            Some(&unmount_handoff),
        )
        .unwrap();

    let unmount_evidence = root
        .describe_private_to_json_after_unmount_native_execution_for_canary(
            &unmounted,
            unmount_admission,
            Some(unmount_identity),
        )
        .unwrap();

    assert_eq!(unmount_evidence.operation(), "unmount");
    assert_eq!(
        unmount_evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        unmount_evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Unmount
    );
    assert_eq!(
        unmount_evidence.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::EmptyRoot
    );
    assert_eq!(
        unmount_evidence.host_output_row().unwrap().id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
    );
    assert!(unmount_evidence.rendered_root().is_null());
    assert_eq!(unmount_evidence.source_node_count(), 0);
    assert_eq!(unmount_evidence.root_child_count(), 0);
    assert!(!unmount_evidence.consumes_accepted_native_create_execution_record());
    assert!(!unmount_evidence.consumes_accepted_native_update_execution_record());
    assert!(unmount_evidence.consumes_accepted_native_unmount_execution_record());
    assert!(unmount_evidence.consumes_accepted_host_output_row());
    assert!(unmount_evidence.minimal_tree_shape());
    assert!(!unmount_evidence.public_to_json_available());
    assert!(!unmount_evidence.native_bridge_available());
    assert!(!unmount_evidence.native_execution_available());
    assert!(!unmount_evidence.compatibility_claimed());
}

#[test]
fn root_private_to_json_create_native_execution_requires_finished_work_identity_gate() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let create_input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        root_element(1),
        "span",
    );
    let create_preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
        create_input,
        Some(TestRendererOptions::new()),
        TestRendererRootCreatePreflightCanaryApiIdentity::current(),
        Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
    )
    .unwrap();
    let create_admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
        Some(create_preflight),
        Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
    )
    .unwrap();
    let created = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let report = root
        .describe_private_json_serialization_for_canary(&created)
        .unwrap();
    let identity = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(created.render()),
            Some(created.commit()),
            Some(&report),
        )
        .unwrap();

    let error = root
        .describe_private_to_json_after_create_native_execution_for_canary(
            &created,
            create_admission,
            None,
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "create",
            reason: "finished-work-identity-missing"
        }
    ));

    let mut foreign_identity = identity;
    foreign_identity.root = FiberRootId::new(root.root_id().raw() + 1).unwrap();
    let error = root
        .describe_private_to_json_after_create_native_execution_for_canary(
            &created,
            create_admission,
            Some(foreign_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "create",
            reason: "finished-work-identity-root-mismatch"
        }
    ));

    let mut stale_identity = identity;
    stale_identity.commit_current.slot += 1;
    let error = root
        .describe_private_to_json_after_create_native_execution_for_canary(
            &created,
            create_admission,
            Some(stale_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "create",
            reason: "finished-work-identity-stale"
        }
    ));

    let mut lane_identity = identity;
    lane_identity.commit_finished_lanes_bits += 1;
    let error = root
        .describe_private_to_json_after_create_native_execution_for_canary(
            &created,
            create_admission,
            Some(lane_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "create",
            reason: "finished-work-identity-lane-mismatch"
        }
    ));

    let mut surface_identity = identity;
    surface_identity.public_surface = "create().toTree";
    let error = root
        .describe_private_to_json_after_create_native_execution_for_canary(
            &created,
            create_admission,
            Some(surface_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "create",
            reason: "finished-work-identity-public-surface-mismatch"
        }
    ));

    let mut source_identity = identity;
    source_identity.source_serialization_diagnostic_name =
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME;
    let error = root
        .describe_private_to_json_after_create_native_execution_for_canary(
            &created,
            create_admission,
            Some(source_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "create",
            reason: "finished-work-identity-source-report-mismatch"
        }
    ));
}

#[test]
fn root_private_to_json_update_native_execution_requires_finished_work_identity_gate() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    let update_admission = root
        .describe_private_update_route_admission_for_canary(&updated)
        .unwrap();
    let report = root
        .describe_private_json_serialization_after_update_for_canary(&updated)
        .unwrap();
    let identity = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(updated.render()),
            Some(updated.commit()),
            Some(&report),
        )
        .unwrap();

    let error = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &updated,
            update_admission,
            None,
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON update native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "finished-work-identity-missing"
        }
    ));

    let mut wrong_request_admission = update_admission;
    wrong_request_admission.request_api = "TestRendererRoot::create";
    let error = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &updated,
            wrong_request_admission,
            Some(identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON update native execution route rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "route-metadata-stale"
        }
    ));

    let mut foreign_identity = identity;
    foreign_identity.root = FiberRootId::new(root.root_id().raw() + 1).unwrap();
    let error = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &updated,
            update_admission,
            Some(foreign_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON update native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "finished-work-identity-root-mismatch"
        }
    ));

    let mut lane_identity = identity;
    lane_identity.commit_finished_lanes_bits += 1;
    let error = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &updated,
            update_admission,
            Some(lane_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON update native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "finished-work-identity-lane-mismatch"
        }
    ));

    let mut source_identity = identity;
    source_identity.source_serialization_diagnostic_name =
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME;
    let error = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &updated,
            update_admission,
            Some(source_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON update native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "finished-work-identity-source-report-mismatch"
        }
    ));

    let mut create_identity = identity;
    create_identity.host_output_update_kind = TestRendererRootUpdateKind::Create;
    let error = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &updated,
            update_admission,
            Some(create_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON update native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "finished-work-identity-host-output-kind-mismatch"
        }
    ));

    let mut unmount_identity = identity;
    unmount_identity.host_output_update_kind = TestRendererRootUpdateKind::Unmount;
    let error = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &updated,
            update_admission,
            Some(unmount_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON update native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "finished-work-identity-host-output-kind-mismatch"
        }
    ));

    let mut public_identity = identity;
    public_identity.public_serialization_available = true;
    let error = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &updated,
            update_admission,
            Some(public_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON update native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "public-or-native-compatibility-claim"
        }
    ));

    root.update_host_component_with_text_for_canary("span", "later")
        .unwrap();
    let later = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    let later_admission = root
        .describe_private_update_route_admission_for_canary(&later)
        .unwrap();
    let later_report = root
        .describe_private_json_serialization_after_update_for_canary(&later)
        .unwrap();
    let later_identity = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(later.render()),
            Some(later.commit()),
            Some(&later_report),
        )
        .unwrap();
    let error = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &later,
            update_admission,
            Some(later_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON update native execution stale admission rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "update-admission-handoff-mismatch"
        }
    ));

    let later_evidence = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &later,
            later_admission,
            Some(later_identity),
        )
        .unwrap();
    assert_eq!(later_evidence.operation(), "update");
    assert!(later_evidence.consumes_accepted_native_update_execution_record());
    assert!(later_evidence.consumes_private_to_json_evidence());
    assert!(!later_evidence.public_serialization_available());
    assert!(!later_evidence.compatibility_claimed());

    let error = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &later,
            later_admission,
            Some(identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON update native execution stale identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "finished-work-identity-stale"
        }
    ));
}

#[test]
fn root_private_to_json_native_execution_evidence_rejects_stale_update_record() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    let mut update_admission = root
        .describe_private_update_route_admission_for_canary(&updated)
        .unwrap();
    update_admission.host_output_update_kind = TestRendererRootUpdateKind::Create;

    let error = root
        .describe_private_to_json_after_update_native_execution_for_canary(
            &updated,
            update_admission,
            None,
        )
        .unwrap_err();

    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON native execution rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "route-metadata-stale"
        }
    ));
}

#[test]
fn root_private_to_json_nested_update_native_execution_requires_finished_work_identity_gate() {
    let mut root = TestRendererRoot::create_nested_host_components_with_text_for_canary(
        "section",
        "span",
        "stable",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_nested_host_output_for_canary()
        .unwrap()
        .unwrap();
    let placed = root
        .render_and_commit_nested_host_parent_text_placement_for_canary("inserted")
        .unwrap();
    let execution = accepted_nested_update_route_admission_for_root(&root, &placed);
    let report = root
        .describe_private_json_serialization_after_nested_update_for_canary(&placed)
        .unwrap();
    let report_fibers = report.gate().fiber_inspection().unwrap();
    let report_nodes = report.nodes();
    let report_inner = report.component().host_child().unwrap();
    assert_eq!(
        report.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::NestedHostText
    );
    assert_eq!(report.node_count(), 4);
    assert_eq!(report_fibers.host_components().len(), 2);
    assert_eq!(report_fibers.host_texts().len(), 2);
    assert_eq!(
        report_fibers.host_components()[0].fiber(),
        placed.outer_fibers().component()
    );
    assert_eq!(
        report_fibers.host_components()[1].fiber(),
        placed.inner_fibers().component()
    );
    assert_eq!(
        report_nodes[0].node_kind(),
        TestRendererPrivateJsonNodeKind::HostComponent
    );
    assert_eq!(report_nodes[0].child_ordinals(), &[1]);
    assert_eq!(
        report_nodes[1].node_kind(),
        TestRendererPrivateJsonNodeKind::HostComponent
    );
    assert_eq!(report_nodes[1].child_ordinals(), &[2, 3]);
    assert_eq!(
        report_nodes[2].node_kind(),
        TestRendererPrivateJsonNodeKind::Text
    );
    assert_eq!(report_nodes[2].text(), Some("stable"));
    assert_eq!(
        report_nodes[3].node_kind(),
        TestRendererPrivateJsonNodeKind::Text
    );
    assert_eq!(report_nodes[3].text(), Some("inserted"));
    assert_eq!(report_inner.text_children().len(), 2);
    let identity = root
        .describe_private_to_json_nested_finished_work_identity_gate_for_canary(
            &placed,
            Some(&report),
        )
        .unwrap();

    let error = root
        .describe_private_to_json_after_nested_update_native_execution_for_canary(
            &placed, execution, None,
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON nested update native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "finished-work-identity-missing"
        }
    ));

    let mut wrong_request_admission = execution;
    wrong_request_admission.request_api = "TestRendererRoot::create";
    let error = root
        .describe_private_to_json_after_nested_update_native_execution_for_canary(
            &placed,
            wrong_request_admission,
            Some(identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON nested update native execution route rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "route-metadata-stale"
        }
    ));

    let mut stale_identity = identity;
    stale_identity.commit_current.slot += 1;
    let error = root
        .describe_private_to_json_after_nested_update_native_execution_for_canary(
            &placed,
            execution,
            Some(stale_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON nested update native execution stale identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "finished-work-identity-stale"
        }
    ));

    let mut mismatched_identity_handoff = identity;
    mismatched_identity_handoff.render_current.slot += 1;
    mismatched_identity_handoff.commit_previous_current =
        mismatched_identity_handoff.render_current;
    let error = root
        .describe_private_to_json_after_nested_update_native_execution_for_canary(
            &placed,
            execution,
            Some(mismatched_identity_handoff),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON nested update native execution identity handoff rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "update-admission-finished-work-identity-mismatch"
        }
    ));

    let mut stale_sequence_admission = execution;
    stale_sequence_admission.scheduled_update_sequence += 1;
    let error = root
        .describe_private_to_json_after_nested_update_native_execution_for_canary(
            &placed,
            stale_sequence_admission,
            Some(identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON nested update native execution sequence rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "update-admission-handoff-mismatch"
        }
    ));

    let mut mismatched_handoff_admission = execution;
    mismatched_handoff_admission.commit_current.slot += 1;
    let error = root
        .describe_private_to_json_after_nested_update_native_execution_for_canary(
            &placed,
            mismatched_handoff_admission,
            Some(identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON nested update native execution handoff rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "update-admission-handoff-mismatch"
        }
    ));

    let mut identity_lane_mismatch = identity;
    identity_lane_mismatch.render_lanes_bits += 1;
    identity_lane_mismatch.commit_finished_lanes_bits = identity_lane_mismatch.render_lanes_bits;
    identity_lane_mismatch.report_finished_lanes_bits =
        identity_lane_mismatch.commit_finished_lanes_bits;
    let error = root
        .describe_private_to_json_after_nested_update_native_execution_for_canary(
            &placed,
            execution,
            Some(identity_lane_mismatch),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON nested update native execution identity lane rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "update-admission-finished-work-identity-lane-mismatch"
        }
    ));

    let mut lane_admission = execution;
    lane_admission.commit_finished_lanes_bits += 1;
    let error = root
        .describe_private_to_json_after_nested_update_native_execution_for_canary(
            &placed,
            lane_admission,
            Some(identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON nested update native execution lane rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "update-admission-lane-mismatch"
        }
    ));
}

#[test]
fn root_private_to_json_nested_update_native_execution_evidence_consumes_multichild_row() {
    let mut root = TestRendererRoot::create_nested_host_components_with_text_for_canary(
        "section",
        "span",
        "stable",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_nested_host_output_for_canary()
        .unwrap()
        .unwrap();
    let placed = root
        .render_and_commit_nested_host_parent_text_placement_for_canary("inserted")
        .unwrap();
    let execution = accepted_nested_update_route_admission_for_root(&root, &placed);
    let report = root
        .describe_private_json_serialization_after_nested_update_for_canary(&placed)
        .unwrap();
    let identity = root
        .describe_private_to_json_nested_finished_work_identity_gate_for_canary(
            &placed,
            Some(&report),
        )
        .unwrap();

    let evidence = root
        .describe_private_to_json_after_nested_update_native_execution_for_canary(
            &placed,
            execution,
            Some(identity),
        )
        .unwrap();

    assert_eq!(evidence.operation(), "update");
    assert_eq!(
        evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        evidence.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::NestedHostText
    );
    assert_eq!(
        evidence.host_output_row().unwrap().id(),
        TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(evidence.source_node_count(), 4);
    assert_eq!(evidence.root_child_count(), 1);
    assert!(evidence.consumes_accepted_native_update_execution_record());
    assert!(evidence.consumes_accepted_host_output_row());
    assert!(!evidence.minimal_tree_shape());
    assert!(!evidence.public_to_json_available());
    assert!(!evidence.public_serialization_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(!evidence.compatibility_claimed());

    let rendered = evidence.rendered_root().as_host_component().unwrap();
    assert_eq!(rendered.element_type().as_str(), "section");
    let inner = rendered.children().unwrap()[0].as_host_component().unwrap();
    assert_eq!(inner.element_type().as_str(), "span");
    assert_eq!(inner.children().unwrap()[0].as_text(), Some("stable"));
    assert_eq!(inner.children().unwrap()[1].as_text(), Some("inserted"));
}

#[test]
fn root_private_multi_child_host_text_native_execution_consumes_lifecycle_and_identity() {
    let (root, output, route, lifecycle, identity) =
        multi_child_host_text_identity_inputs_for_canary();

    let json_evidence = root
        .describe_private_to_json_after_multi_child_host_text_update_native_execution_for_canary(
            &output,
            route,
            &lifecycle,
            Some(identity),
        )
        .unwrap();

    assert_eq!(json_evidence.operation(), "update");
    assert_eq!(
        json_evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        json_evidence.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
    );
    assert_eq!(
        json_evidence.host_output_row().unwrap().id(),
        TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(json_evidence.source_node_count(), 3);
    assert_eq!(json_evidence.root_child_count(), 1);
    assert_eq!(
        json_evidence.source_finished_work_identity_diagnostic_name(),
        Some(TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_DIAGNOSTIC_NAME)
    );
    assert_eq!(
        json_evidence.source_lifecycle_execution_diagnostic_name(),
        Some(TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_DIAGNOSTIC_NAME)
    );
    assert_eq!(
        json_evidence.source_lifecycle_execution_status(),
        Some(TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_STATUS)
    );
    assert!(json_evidence.consumes_accepted_native_update_execution_record());
    assert!(json_evidence.consumes_accepted_host_output_row());
    assert!(json_evidence.consumes_private_root_lifecycle_execution());
    assert!(json_evidence.consumes_private_to_json_evidence());
    assert!(!json_evidence.consumes_private_sibling_text_finished_work_identity_gate());
    assert!(!json_evidence.minimal_tree_shape());
    assert!(!json_evidence.public_to_json_available());
    assert!(!json_evidence.public_serialization_available());
    assert!(!json_evidence.native_bridge_available());
    assert!(!json_evidence.native_execution_available());
    assert!(!json_evidence.compatibility_claimed());

    let rendered = json_evidence.rendered_root().as_host_component().unwrap();
    assert_eq!(rendered.element_type().as_str(), "span");
    assert_eq!(rendered.child_count(), 2);
    assert_eq!(rendered.children().unwrap()[0].as_text(), Some("hello"));
    assert_eq!(rendered.children().unwrap()[1].as_text(), Some("inserted"));

    let tree_evidence = root
        .describe_private_to_tree_after_multi_child_host_text_update_native_execution_for_canary(
            &output,
            route,
            &lifecycle,
            Some(identity),
        )
        .unwrap();

    assert_eq!(tree_evidence.operation(), "update");
    assert_eq!(
        tree_evidence.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
    );
    assert_eq!(
        tree_evidence.host_output_row().unwrap().id(),
        TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(
        tree_evidence.source_fiber_count(),
        TEST_RENDERER_PRIVATE_TREE_COMPOSITE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE.len()
    );
    assert_eq!(tree_evidence.root_child_count(), 1);
    assert_eq!(
        tree_evidence.source_finished_work_identity_diagnostic_name(),
        Some(TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_DIAGNOSTIC_NAME)
    );
    assert_eq!(
        tree_evidence.source_lifecycle_execution_diagnostic_name(),
        Some(TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_DIAGNOSTIC_NAME)
    );
    assert!(tree_evidence.consumes_accepted_native_update_execution_record());
    assert!(tree_evidence.consumes_accepted_host_output_row());
    assert!(tree_evidence.consumes_private_root_lifecycle_execution());
    assert!(tree_evidence.consumes_private_to_tree_evidence());
    assert!(tree_evidence.function_component_above_host_output_shape());
    assert!(!tree_evidence.public_to_tree_available());
    assert!(!tree_evidence.public_serialization_available());
    assert!(!tree_evidence.native_bridge_available());
    assert!(!tree_evidence.native_execution_available());
    assert!(!tree_evidence.compatibility_claimed());

    let component = tree_evidence
        .rendered_root()
        .as_function_component()
        .unwrap();
    assert_eq!(
        component.component_type(),
        TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
    );
    assert!(component.wraps_committed_host_output());
    let rendered_host = component.rendered().as_host_component().unwrap();
    assert_eq!(rendered_host.rendered_child_count(), 2);
    assert_eq!(rendered_host.rendered()[0].as_text(), Some("hello"));
    assert_eq!(rendered_host.rendered()[1].as_text(), Some("inserted"));
}

#[test]
fn root_private_multi_child_host_text_native_execution_rejects_tampered_stale_and_public_claims() {
    let (root, output, route, lifecycle, identity) =
        multi_child_host_text_identity_inputs_for_canary();

    let error = root
        .describe_private_to_json_after_multi_child_host_text_update_native_execution_for_canary(
            &output, route, &lifecycle, None,
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(error, "update", "finished-work-identity-missing");

    let mut stale_output = output.clone();
    stale_output.snapshot.children.clear();
    let error = root
        .describe_private_to_json_multi_child_host_text_output_row_for_canary(&stale_output)
        .unwrap_err();
    assert_multi_child_host_text_identity_error_reason(
        error,
        "multi-child-host-text-snapshot-stale",
    );
    let error = root
        .describe_private_to_json_multi_child_host_text_finished_work_identity_gate_for_canary(
            &stale_output,
            route,
            &lifecycle,
        )
        .unwrap_err();
    assert_multi_child_host_text_identity_error_reason(
        error,
        "multi-child-host-text-lifecycle-snapshot-stale",
    );

    let mut foreign_route = route;
    foreign_route.renderer_id = TestRendererId(foreign_route.renderer_id.0 + 1);
    let error = root
        .describe_private_to_json_multi_child_host_text_finished_work_identity_gate_for_canary(
            &output,
            foreign_route,
            &lifecycle,
        )
        .unwrap_err();
    assert_multi_child_host_text_identity_error_reason(
        error,
        "multi-child-host-text-route-metadata-stale",
    );

    let mut replayed_route = route;
    replayed_route.scheduled_update_sequence += 1;
    let error = root
        .describe_private_to_json_after_multi_child_host_text_update_native_execution_for_canary(
            &output,
            replayed_route,
            &lifecycle,
            Some(identity),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "update",
        "update-admission-handoff-mismatch",
    );

    let mut unmount_route = route;
    unmount_route.host_output_update_kind = TestRendererRootUpdateKind::Unmount;
    let error = root
        .describe_private_to_json_after_multi_child_host_text_update_native_execution_for_canary(
            &output,
            unmount_route,
            &lifecycle,
            Some(identity),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(error, "update", "route-metadata-stale");

    let mut caller_built_lifecycle = lifecycle.clone();
    caller_built_lifecycle.source_execution_status = "caller-built-lifecycle-row";
    let error = root
        .describe_private_to_json_after_multi_child_host_text_update_native_execution_for_canary(
            &output,
            route,
            &caller_built_lifecycle,
            Some(identity),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "update",
        "multi-child-host-text-lifecycle-evidence-mismatch",
    );

    let mut native_lifecycle = lifecycle.clone();
    native_lifecycle.native_execution_available = true;
    let error = root
        .describe_private_to_json_after_multi_child_host_text_update_native_execution_for_canary(
            &output,
            route,
            &native_lifecycle,
            Some(identity),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "update",
        "public-or-native-package-js-compatibility-claim",
    );

    let mut stale_identity = identity;
    stale_identity.commit_current.slot += 1;
    let error = root
        .describe_private_to_json_after_multi_child_host_text_update_native_execution_for_canary(
            &output,
            route,
            &lifecycle,
            Some(stale_identity),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "update",
        "multi-child-host-text-route-finished-work-identity-mismatch",
    );

    let mut lane_identity = identity;
    lane_identity.route_render_lanes_bits += 1;
    let error = root
        .describe_private_to_tree_after_multi_child_host_text_update_native_execution_for_canary(
            &output,
            route,
            &lifecycle,
            Some(lane_identity),
        )
        .unwrap_err();
    assert_to_tree_native_execution_error_reason(
        error,
        "update",
        "multi-child-host-text-finished-work-identity-lane-mismatch",
    );

    let mut package_identity = identity;
    package_identity.package_compatibility_claimed = true;
    let reason =
        TestRendererRoot::validate_private_to_json_multi_child_host_text_finished_work_identity_gate_for_canary(
            package_identity,
        )
        .unwrap_err();
    assert_eq!(reason, "public-or-native-package-js-compatibility-claim");
}

#[test]
fn root_private_to_json_sibling_text_native_execution_evidence_consumes_sibling_row() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    let execution = root
        .describe_private_update_route_admission_for_canary(&updated)
        .unwrap();
    let previous_snapshot = TestContainerSnapshot {
        children: vec![TestNodeSnapshot::Element(TestElementSnapshot {
            element_type: element_type("span"),
            props: TestProps::new(),
            hidden: false,
            detached: false,
            children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                text: "second sibling".to_owned(),
                hidden: false,
            })],
        })],
    };
    let current_snapshot = TestContainerSnapshot {
        children: vec![
            TestNodeSnapshot::Text(TestTextSnapshot {
                text: "first sibling".to_owned(),
                hidden: false,
            }),
            TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: element_type("span"),
                props: TestProps::new(),
                hidden: false,
                detached: false,
                children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "second sibling".to_owned(),
                    hidden: false,
                })],
            }),
        ],
    };

    let evidence = root
        .describe_private_to_json_sibling_text_update_native_execution_from_snapshot_for_diagnostics(
            &previous_snapshot,
            &current_snapshot,
            execution,
        )
        .unwrap();

    assert_eq!(evidence.operation(), "update");
    assert_eq!(
        evidence.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SiblingText
    );
    assert_eq!(
        evidence.host_output_row().unwrap().id(),
        TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(evidence.source_node_count(), 3);
    assert_eq!(evidence.root_child_count(), 2);
    assert!(evidence.consumes_accepted_native_update_execution_record());
    assert!(evidence.consumes_accepted_host_output_row());
    assert_eq!(
        evidence.source_finished_work_identity_diagnostic_name(),
        None
    );
    assert!(!evidence.consumes_private_sibling_text_finished_work_identity_gate());
    assert!(!evidence.minimal_tree_shape());
    assert!(!evidence.public_to_json_available());
    assert!(!evidence.public_serialization_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());

    let children = evidence.rendered_root().as_array().unwrap();
    assert_eq!(children[0].as_text(), Some("first sibling"));
    let component = children[1].as_host_component().unwrap();
    assert_eq!(component.element_type().as_str(), "span");
    assert_eq!(
        component.children().unwrap()[0].as_text(),
        Some("second sibling")
    );
}

#[test]
fn root_private_to_json_sibling_text_real_output_native_execution_consumes_identity_gate() {
    let (root, output, route, report) = sibling_text_identity_inputs_for_canary();
    let identity = root
        .describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            &output,
            route,
            Some(&report),
        )
        .unwrap();

    let evidence = root
        .describe_private_to_json_after_sibling_text_update_native_execution_for_canary(
            &output,
            route,
            Some(identity),
        )
        .unwrap();

    assert_eq!(evidence.operation(), "update");
    assert_eq!(
        evidence.public_surface(),
        "create().update -> create().toJSON"
    );
    assert_eq!(
        evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
    );
    assert_eq!(
        evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        evidence.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SiblingText
    );
    assert_eq!(
        evidence.host_output_row().unwrap().id(),
        TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(evidence.source_node_count(), 3);
    assert_eq!(evidence.root_child_count(), 2);
    assert!(evidence.consumes_accepted_native_update_execution_record());
    assert!(evidence.consumes_private_to_json_evidence());
    assert!(evidence.consumes_accepted_host_output_row());
    assert_eq!(
        evidence.source_finished_work_identity_diagnostic_name(),
        Some(TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_DIAGNOSTIC_NAME)
    );
    assert!(evidence.consumes_private_sibling_text_finished_work_identity_gate());
    assert!(!evidence.minimal_tree_shape());
    assert!(!evidence.public_to_json_available());
    assert!(!evidence.public_serialization_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(!evidence.compatibility_claimed());

    let children = evidence.rendered_root().as_array().unwrap();
    assert_eq!(children.len(), 2);
    assert_eq!(children[0].as_text(), Some("first sibling"));
    let component = children[1].as_host_component().unwrap();
    assert_eq!(component.element_type().as_str(), "span");
    assert_eq!(
        component.children().unwrap()[0].as_text(),
        Some("second sibling")
    );
}

#[test]
fn root_private_to_json_sibling_text_real_output_native_execution_rejects_missing_or_tampered_identity()
 {
    let (root, mut output, route, report) = sibling_text_identity_inputs_for_canary();
    let identity = root
        .describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            &output,
            route,
            Some(&report),
        )
        .unwrap();

    let error = root
        .describe_private_to_json_after_sibling_text_update_native_execution_for_canary(
            &output, route, None,
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(error, "update", "finished-work-identity-missing");

    let mut wrong_source_identity = identity;
    wrong_source_identity.source_serialization_diagnostic_name =
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME;
    let error = root
        .describe_private_to_json_after_sibling_text_update_native_execution_for_canary(
            &output,
            route,
            Some(wrong_source_identity),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "update",
        "sibling-text-finished-work-identity-source-mismatch",
    );

    let mut wrong_handoff_identity = identity;
    wrong_handoff_identity.route_commit_current.slot += 1;
    let error = root
        .describe_private_to_json_after_sibling_text_update_native_execution_for_canary(
            &output,
            route,
            Some(wrong_handoff_identity),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "update",
        "sibling-text-route-finished-work-identity-mismatch",
    );

    let mut stale_route = route;
    stale_route.commit_current.slot += 1;
    let error = root
        .describe_private_to_json_after_sibling_text_update_native_execution_for_canary(
            &output,
            stale_route,
            Some(identity),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "update",
        "update-admission-handoff-mismatch",
    );

    let mut public_identity = identity;
    public_identity.native_bridge_available = true;
    let error = root
        .describe_private_to_json_after_sibling_text_update_native_execution_for_canary(
            &output,
            route,
            Some(public_identity),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "update",
        "public-or-native-package-js-compatibility-claim",
    );

    output.snapshot.children.clear();
    let error = root
        .describe_private_to_json_after_sibling_text_update_native_execution_for_canary(
            &output,
            route,
            Some(identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON serialization error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale
    ));
}

#[test]
fn root_private_json_sibling_text_report_records_root_array_source_nodes() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "second sibling",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let output = root
        .render_and_commit_sibling_text_host_output_update_for_canary("first sibling")
        .unwrap()
        .unwrap();

    let report = root
        .describe_private_json_serialization_after_sibling_text_update_for_canary(&output)
        .unwrap();

    assert_eq!(
        report.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SiblingText
    );
    assert_eq!(
        report.host_output_row().unwrap().id(),
        TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
    );
    assert!(report.host_output_snapshot_current());
    assert_eq!(report.root_child_count(), 2);
    assert_eq!(
        report.root_node_kind(),
        TestRendererPrivateJsonNodeKind::RootArray
    );
    assert_eq!(report.node_count(), 3);

    let nodes = report.nodes();
    assert_eq!(nodes[0].node_kind(), TestRendererPrivateJsonNodeKind::Text);
    assert_eq!(nodes[0].parent_ordinal(), None);
    assert_eq!(nodes[0].text(), Some("first sibling"));
    assert_eq!(
        nodes[0].fiber().pending_props_raw(),
        output.root_text_props_raw()
    );
    assert_eq!(
        nodes[0].fiber().memoized_props_raw(),
        output.root_text_props_raw()
    );
    assert!(nodes[0].fiber().state_node_present());
    assert_eq!(
        nodes[1].node_kind(),
        TestRendererPrivateJsonNodeKind::HostComponent
    );
    assert_eq!(nodes[1].parent_ordinal(), None);
    assert_eq!(nodes[1].child_ordinals(), [2]);
    assert_eq!(nodes[1].element_type().unwrap().as_str(), "span");
    assert_eq!(nodes[2].node_kind(), TestRendererPrivateJsonNodeKind::Text);
    assert_eq!(nodes[2].parent_ordinal(), Some(1));
    assert_eq!(nodes[2].text(), Some("second sibling"));

    let rendered = report.rendered_root().as_array().unwrap();
    assert_eq!(rendered.len(), 2);
    assert_eq!(rendered[0].as_text(), Some("first sibling"));
    let component = rendered[1].as_host_component().unwrap();
    assert_eq!(component.element_type().as_str(), "span");
    assert_eq!(
        component.children().unwrap()[0].as_text(),
        Some("second sibling")
    );
}

#[test]
fn root_private_to_json_sibling_text_finished_work_identity_gate_consumes_real_output_report_and_route()
 {
    let (root, output, route, report) = sibling_text_identity_inputs_for_canary();

    let gate = root
        .describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            &output,
            route,
            Some(&report),
        )
        .unwrap();

    assert_eq!(
        gate.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_DIAGNOSTIC_NAME
    );
    assert_eq!(
        gate.status(),
        TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_STATUS
    );
    assert_eq!(gate.root(), root.root_id());
    assert_eq!(
        gate.root_scheduled_update_sequence(),
        output.scheduled_update_sequence()
    );
    assert_eq!(gate.public_surface(), "create().update -> create().toJSON");
    assert_eq!(
        gate.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
    );
    assert_eq!(
        gate.source_serialization_diagnostic_name(),
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        gate.worker_738_report_row_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(
        gate.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        gate.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SiblingText
    );
    assert_eq!(
        gate.root_node_kind(),
        TestRendererPrivateJsonNodeKind::RootArray
    );
    assert_eq!(gate.root_child_count(), 2);
    assert_eq!(gate.source_node_count(), 3);
    assert_eq!(gate.route_render_current(), gate.render_current());
    assert_eq!(
        gate.route_render_finished_work(),
        gate.render_finished_work()
    );
    assert_eq!(
        gate.route_commit_previous_current(),
        gate.commit_previous_current()
    );
    assert_eq!(gate.route_commit_current(), gate.commit_current());
    assert_eq!(gate.render_finished_work(), gate.commit_current());
    assert_eq!(gate.report_finished_work(), gate.commit_current());
    assert_eq!(gate.route_render_lanes_bits(), gate.render_lanes_bits());
    assert_eq!(
        gate.route_commit_finished_lanes_bits(),
        gate.commit_finished_lanes_bits()
    );
    assert_eq!(gate.render_lanes_bits(), gate.commit_finished_lanes_bits());
    assert_eq!(
        gate.report_finished_lanes_bits(),
        gate.commit_finished_lanes_bits()
    );
    assert_eq!(gate.commit_remaining_lanes_bits(), 0);
    assert_eq!(gate.commit_pending_lanes_bits(), 0);
    assert!(gate.route_handles_match_committed_update());
    assert!(gate.route_lanes_match_committed_update());
    assert!(gate.commit_current_matches_render_finished_work());
    assert!(gate.commit_previous_current_matches_render_current());
    assert!(gate.commit_lanes_match_render_lanes());
    assert!(gate.report_finished_work_matches_commit_current());
    assert!(gate.report_lanes_match_commit_lanes());
    assert!(gate.committed_fiber_inspection_current_matches_commit());
    assert!(gate.committed_sibling_text_fiber_inspection_available());
    assert!(gate.committed_sibling_text_report_shape_available());
    assert!(gate.committed_sibling_text_inspection_matches_output());
    assert!(gate.host_output_snapshot_current());
    assert!(gate.report_host_output_row_matches_output());
    assert!(gate.report_root_array_source_nodes_match_current_snapshot());
    assert!(gate.real_sibling_text_handoff_available());
    assert!(gate.consumes_update_route_admission());
    assert!(gate.consumes_sibling_text_host_output());
    assert!(gate.consumes_private_to_json_evidence());
    assert!(gate.consumes_worker_738_report_row());
    assert!(gate.consumes_committed_host_root_finished_work_identity());
    assert!(gate.consumes_committed_host_root_finished_work_lanes());
    assert!(gate.identity_admission_available());
    assert!(!gate.broad_multichild_identity_available());
    assert!(gate.public_native_package_js_surfaces_blocked());
    assert!(!gate.public_to_json_available());
    assert!(!gate.native_bridge_loading_available());
    assert!(!gate.native_bridge_available());
    assert!(!gate.native_execution_available());
    assert!(!gate.js_facade_available());
    assert!(!gate.cjs_facade_available());
    assert!(!gate.package_compatibility_claimed());
    assert!(!gate.compatibility_claimed());
}

#[test]
fn root_private_to_json_sibling_text_finished_work_identity_gate_rejects_mismatched_or_stale_evidence()
 {
    let (root, output, route, report) = sibling_text_identity_inputs_for_canary();

    let mut wrong_shape_report = report.clone();
    wrong_shape_report.host_output_shape = TestRendererPrivateToJsonHostOutputShape::SingleHostText;
    let error = root
        .describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            &output,
            route,
            Some(&wrong_shape_report),
        )
        .unwrap_err();
    assert_sibling_text_identity_error_reason(error, "sibling-text-report-shape-mismatch");

    let mut missing_inspection_report = report.clone();
    missing_inspection_report.gate.fiber_inspection = None;
    let error = root
        .describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            &output,
            route,
            Some(&missing_inspection_report),
        )
        .unwrap_err();
    assert_sibling_text_identity_error_reason(error, "missing-committed-fiber-inspection");

    let mut stale_report = report.clone();
    stale_report.gate.commit.current.slot += 1;
    let error = root
        .describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            &output,
            route,
            Some(&stale_report),
        )
        .unwrap_err();
    assert_sibling_text_identity_error_reason(
        error,
        "serialization-report-current-finished-work-mismatch",
    );

    let mut lane_drift_route = route;
    lane_drift_route.commit_finished_lanes_bits += 1;
    let error = root
        .describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            &output,
            lane_drift_route,
            Some(&report),
        )
        .unwrap_err();
    assert_sibling_text_identity_error_reason(error, "sibling-text-route-lane-mismatch");

    let mut mismatched_route = route;
    mismatched_route.commit_current.slot += 1;
    let error = root
        .describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            &output,
            mismatched_route,
            Some(&report),
        )
        .unwrap_err();
    assert_sibling_text_identity_error_reason(error, "sibling-text-route-handoff-mismatch");

    let mut stale_output = output.clone();
    stale_output.snapshot.children.clear();
    let error = root
        .describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            &stale_output,
            route,
            Some(&report),
        )
        .unwrap_err();
    assert_sibling_text_identity_error_reason(error, "host-output-snapshot-stale");
}

#[test]
fn root_private_to_json_sibling_text_finished_work_identity_gate_blocks_public_native_package_js_and_broad_multichild()
 {
    let (root, output, route, report) = sibling_text_identity_inputs_for_canary();
    let gate = root
        .describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            &output,
            route,
            Some(&report),
        )
        .unwrap();

    let mut public_route = route;
    public_route.public_serialization_available = true;
    let error = root
        .describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            &output,
            public_route,
            Some(&report),
        )
        .unwrap_err();
    assert_sibling_text_identity_error_reason(error, "public-or-native-compatibility-claim");

    let mut js_gate = gate;
    js_gate.js_facade_available = true;
    let reason =
        TestRendererRoot::validate_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            js_gate,
        )
        .unwrap_err();
    assert_eq!(reason, "public-or-native-package-js-compatibility-claim");

    let mut package_gate = gate;
    package_gate.package_compatibility_claimed = true;
    let reason =
        TestRendererRoot::validate_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            package_gate,
        )
        .unwrap_err();
    assert_eq!(reason, "public-or-native-package-js-compatibility-claim");

    let mut broad_gate = gate;
    broad_gate.broad_multichild_identity_available = true;
    let reason =
        TestRendererRoot::validate_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            broad_gate,
        )
        .unwrap_err();
    assert_eq!(reason, "broad-multichild-identity-unexpectedly-open");
}

#[test]
fn root_private_to_json_sibling_text_report_fails_closed_in_generic_finished_work_identity_gate() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "second sibling",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let output = root
        .render_and_commit_sibling_text_host_output_update_for_canary("first sibling")
        .unwrap()
        .unwrap();
    let report = root
        .describe_private_json_serialization_after_sibling_text_update_for_canary(&output)
        .unwrap();

    let error = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(output.render()),
            Some(output.commit()),
            Some(&report),
        )
        .unwrap_err();

    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private serialization finished-work identity error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
            reason: "sibling-text-finished-work-identity-gate-not-implemented"
        }
    ));
}

#[test]
fn root_private_to_json_sibling_snapshot_finished_work_identity_blocker_rejects_plausible_identity()
{
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    let execution = root
        .describe_private_update_route_admission_for_canary(&updated)
        .unwrap();
    let report = root
        .describe_private_json_serialization_after_update_for_canary(&updated)
        .unwrap();
    let identity = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(updated.render()),
            Some(updated.commit()),
            Some(&report),
        )
        .unwrap();
    let (previous_snapshot, current_snapshot) = sibling_text_snapshots_for_diagnostics();

    let blocker = root
        .describe_private_to_json_sibling_text_snapshot_finished_work_identity_blocker_for_diagnostics(
            &previous_snapshot,
            &current_snapshot,
            execution,
            Some(identity),
        )
        .unwrap();

    assert_eq!(
        blocker.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_DIAGNOSTIC_NAME
    );
    assert_eq!(
        blocker.status(),
        TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_STATUS
    );
    assert_eq!(blocker.root(), root.root_id());
    assert_eq!(
        blocker.public_surface(),
        "create().update -> create().toJSON"
    );
    assert_eq!(
        blocker.host_output_row().id(),
        TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(
        blocker.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SiblingText
    );
    assert!(blocker.snapshot_based_host_output_row());
    assert!(blocker.candidate_finished_work_identity_supplied());
    assert!(blocker.candidate_identity_plausible_for_update_to_json());
    assert!(blocker.candidate_identity_matches_update_route_handoff());
    assert!(blocker.plausible_finished_work_identity_rejected());
    assert!(!blocker.committed_sibling_text_fiber_inspection_available());
    assert!(!blocker.committed_sibling_text_report_shape_available());
    assert!(!blocker.real_sibling_text_handoff_available());
    assert!(!blocker.consumes_committed_host_root_finished_work_identity());
    assert!(!blocker.consumes_committed_host_root_finished_work_lanes());
    assert!(!blocker.identity_admission_available());
    assert_eq!(
        blocker.rejection_reason(),
        TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_REASON
    );
    assert!(blocker.identity_admission_blocked());
    assert!(!blocker.public_to_json_available());
    assert!(!blocker.public_serialization_available());
    assert!(!blocker.public_route_available());
    assert!(!blocker.native_bridge_available());
    assert!(!blocker.native_execution_available());
    assert!(!blocker.package_compatibility_claimed());

    let evidence = root
        .describe_private_to_json_sibling_text_update_native_execution_from_snapshot_for_diagnostics(
            &previous_snapshot,
            &current_snapshot,
            execution,
        )
        .unwrap();
    assert_eq!(
        evidence.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SiblingText
    );
    assert!(evidence.consumes_accepted_native_update_execution_record());
    assert!(evidence.consumes_accepted_host_output_row());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(!evidence.compatibility_claimed());
}

#[test]
fn root_private_to_json_sibling_snapshot_finished_work_identity_blocker_fails_closed_when_tampered()
{
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    let execution = root
        .describe_private_update_route_admission_for_canary(&updated)
        .unwrap();
    let (previous_snapshot, current_snapshot) = sibling_text_snapshots_for_diagnostics();
    let mut blocker = root
        .describe_private_to_json_sibling_text_snapshot_finished_work_identity_blocker_for_diagnostics(
            &previous_snapshot,
            &current_snapshot,
            execution,
            None,
        )
        .unwrap();

    assert!(blocker.identity_admission_blocked());
    blocker.real_sibling_text_handoff_available = true;

    let reason =
        TestRendererRoot::validate_private_to_json_sibling_snapshot_finished_work_identity_blocker_for_diagnostics(
            blocker,
        )
        .unwrap_err();
    assert_eq!(
        reason,
        "sibling-snapshot-identity-binding-unexpectedly-open"
    );
}

#[test]
fn root_private_to_json_native_execution_evidence_rejects_row_id_shape_mismatch() {
    let root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let previous_snapshot = TestContainerSnapshot { children: vec![] };
    let current_snapshot = TestContainerSnapshot {
        children: vec![
            TestNodeSnapshot::Text(TestTextSnapshot {
                text: "first sibling".to_owned(),
                hidden: false,
            }),
            TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: element_type("span"),
                props: TestProps::new(),
                hidden: false,
                detached: false,
                children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "second sibling".to_owned(),
                    hidden: false,
                })],
            }),
        ],
    };
    let mut row =
        TestRendererRoot::describe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics(
            &previous_snapshot,
            &current_snapshot,
        )
        .unwrap();
    row.id = TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID;

    let error = root
        .private_to_json_native_execution_evidence_from_host_output_row(
            "update",
            "create().update -> create().toJSON",
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            false,
            true,
            false,
            row,
            &current_snapshot,
        )
        .unwrap_err();

    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON serialization error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
            row_id,
            expected: TestRendererPrivateToJsonHostOutputShape::NestedHostText,
            actual: TestRendererPrivateToJsonHostOutputShape::SiblingText,
        } if *row_id == TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID
    ));
}

#[test]
fn root_private_to_json_serialization_finished_work_identity_gate_accepts_committed_handoff() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let output = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let report = root
        .describe_private_json_serialization_for_canary(&output)
        .unwrap();

    let identity = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(output.render()),
            Some(output.commit()),
            Some(&report),
        )
        .unwrap();

    assert_eq!(
        identity.diagnostic_name(),
        TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME
    );
    assert_eq!(
        identity.status(),
        TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_STATUS
    );
    assert_eq!(identity.root(), root.root_id());
    assert_eq!(identity.public_surface(), "create().toJSON");
    assert_eq!(
        identity.source_serialization_diagnostic_name(),
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        identity.host_output_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert_eq!(identity.render_finished_work(), identity.commit_current());
    assert_eq!(identity.report_finished_work(), identity.commit_current());
    assert_eq!(
        identity.render_lanes_bits(),
        identity.commit_finished_lanes_bits()
    );
    assert_eq!(
        identity.report_finished_lanes_bits(),
        identity.commit_finished_lanes_bits()
    );
    assert_eq!(identity.commit_remaining_lanes_bits(), 0);
    assert_eq!(identity.commit_pending_lanes_bits(), 0);
    assert!(identity.commit_current_matches_render_finished_work());
    assert!(identity.commit_previous_current_matches_render_current());
    assert!(identity.commit_lanes_match_render_lanes());
    assert!(identity.report_finished_work_matches_commit_current());
    assert!(identity.report_lanes_match_commit_lanes());
    assert!(identity.committed_fiber_inspection_current_matches_commit());
    assert!(identity.host_output_snapshot_current());
    assert!(identity.consumes_committed_host_root_finished_work_identity());
    assert!(identity.consumes_committed_host_root_finished_work_lanes());
    assert!(identity.consumes_private_to_json_evidence());
    assert!(!identity.consumes_private_to_tree_evidence());
    assert!(!identity.public_to_json_available());
    assert!(!identity.public_to_tree_available());
    assert!(!identity.public_test_instance_available());
    assert!(!identity.public_serialization_available());
    assert!(!identity.compatibility_claimed());
}

#[test]
fn root_private_to_json_update_serialization_finished_work_identity_gate_accepts_committed_handoff()
{
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    let report = root
        .describe_private_json_serialization_after_update_for_canary(&updated)
        .unwrap();

    let identity = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(updated.render()),
            Some(updated.commit()),
            Some(&report),
        )
        .unwrap();

    assert_eq!(identity.public_surface(), "create().toJSON");
    assert_eq!(
        identity.source_serialization_diagnostic_name(),
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        identity.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        identity.render_current(),
        identity.commit_previous_current()
    );
    assert_eq!(identity.render_finished_work(), identity.commit_current());
    assert_eq!(identity.report_finished_work(), identity.commit_current());
    assert_ne!(
        identity.commit_previous_current(),
        identity.commit_current()
    );
    assert_eq!(
        identity.render_lanes_bits(),
        identity.commit_finished_lanes_bits()
    );
    assert_eq!(
        identity.report_finished_lanes_bits(),
        identity.commit_finished_lanes_bits()
    );
    assert!(identity.commit_current_matches_render_finished_work());
    assert!(identity.commit_previous_current_matches_render_current());
    assert!(identity.report_finished_work_matches_commit_current());
    assert!(identity.committed_fiber_inspection_current_matches_commit());
    assert!(identity.host_output_snapshot_current());
    assert!(identity.consumes_committed_host_root_finished_work_identity());
    assert!(identity.consumes_committed_host_root_finished_work_lanes());
    assert!(identity.consumes_private_to_json_evidence());
    assert!(!identity.consumes_private_to_tree_evidence());
    assert!(!identity.public_serialization_available());
    assert!(!identity.compatibility_claimed());
}

#[test]
fn root_private_to_json_unmount_host_output_row_records_empty_snapshot_blockers() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.unmount().unwrap();
    let unmounted = root
        .render_and_commit_host_output_unmount_for_canary()
        .unwrap()
        .unwrap();

    let row = root
        .describe_private_to_json_host_output_unmount_row_for_canary(&unmounted)
        .unwrap();
    let dependencies = row.dependency_diagnostics();

    assert_eq!(
        row.id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(
        row.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME
    );
    assert_eq!(
        row.status(),
        TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_UNMOUNT_ROW_STATUS
    );
    assert_eq!(
        row.host_output_update_kind(),
        TestRendererRootUpdateKind::Unmount
    );
    assert_eq!(
        row.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::EmptyRoot
    );
    assert_eq!(row.previous_root_child_count(), 1);
    assert_eq!(row.current_root_child_count(), 0);
    assert_eq!(row.previous_host_component_count(), 1);
    assert_eq!(row.current_host_component_count(), 0);
    assert_eq!(row.previous_host_text_count(), 1);
    assert_eq!(row.current_host_text_count(), 0);
    assert_eq!(row.current_root_text_count(), 0);
    assert_eq!(row.current_max_host_component_depth(), 0);
    assert_eq!(
        dependencies.route_row_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
    );
    assert_eq!(
        dependencies.serialization_row_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_SERIALIZATION_DEPENDENCY_ID
    );
    assert!(dependencies.route_diagnostics_available());
    assert!(dependencies.serialization_diagnostics_available());
    assert!(dependencies.host_output_snapshot_current());
    assert!(!dependencies.public_to_json_available());
    assert!(!dependencies.public_test_instance_available());
    assert!(!dependencies.native_execution_available());
    assert!(!dependencies.compatibility_claimed());
    assert!(dependencies.public_surfaces_blocked());
    assert!(row.public_blockers().all_blocked());
    assert!(unmounted.snapshot().children().is_empty());
    assert!(
        !unmounted
            .host_node_cleanup()
            .public_unmount_compatibility_claimed()
    );
}

#[test]
fn root_private_to_json_unmount_host_output_row_rejects_stale_snapshot() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.unmount().unwrap();
    let mut unmounted = root
        .render_and_commit_host_output_unmount_for_canary()
        .unwrap()
        .unwrap();
    unmounted.snapshot = unmounted.previous_snapshot.clone();

    let error = root
        .describe_private_to_json_host_output_unmount_row_for_canary(&unmounted)
        .unwrap_err();

    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON serialization error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale
    ));
}

#[test]
fn root_private_to_json_unmount_finished_work_identity_gate_accepts_ref_passive_cleanup_handoff() {
    let (root, unmounted, mut handoff, admission, identity) =
        accepted_unmount_identity_for_root(false, true);

    assert_eq!(identity.root(), root.root_id());
    assert_eq!(
        identity.public_surface(),
        "create().unmount -> create().toJSON"
    );
    assert_eq!(
        identity.source_serialization_diagnostic_name(),
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        identity.host_output_update_kind(),
        TestRendererRootUpdateKind::Unmount
    );
    assert_eq!(identity.render_finished_work(), identity.commit_current());
    assert_eq!(
        identity.render_current(),
        identity.commit_previous_current()
    );
    assert_eq!(
        identity.render_lanes_bits(),
        identity.commit_finished_lanes_bits()
    );
    assert_eq!(identity.commit_remaining_lanes_bits(), 0);
    assert_eq!(identity.commit_pending_lanes_bits(), 0);
    assert!(identity.host_output_snapshot_current());
    assert!(identity.consumes_private_to_json_evidence());
    assert!(!identity.consumes_private_to_tree_evidence());
    assert!(!identity.public_to_json_available());
    assert!(!identity.public_to_tree_available());
    assert!(!identity.public_test_instance_available());
    assert!(!identity.public_serialization_available());
    assert!(!identity.compatibility_claimed());

    assert_eq!(handoff.host_node_cleanup_count(), 2);
    assert_eq!(
        handoff
            .passive_ref_cleanup_order()
            .ref_cleanup_return_count(),
        1
    );
    assert_eq!(
        handoff.passive_ref_cleanup_order().passive_destroy_count(),
        1
    );
    assert_eq!(handoff.cleanup_order_record_count(), 4);
    assert_eq!(admission.ref_cleanup_return_count(), 1);
    assert_eq!(admission.passive_destroy_count(), 1);
    assert!(!admission.minimal_tree_cleanup_handoff());
    assert!(admission.rust_unmount_cleanup_handoff_executed());
    assert!(!admission.native_bridge_available());
    assert!(!admission.native_execution());

    let evidence = root
        .describe_private_to_json_after_unmount_native_execution_for_canary(
            &unmounted,
            admission,
            Some(identity),
        )
        .unwrap();
    assert_eq!(evidence.operation(), "unmount");
    assert!(evidence.consumes_accepted_native_unmount_execution_record());
    assert!(evidence.consumes_private_to_json_evidence());
    assert!(evidence.minimal_tree_shape());
    assert!(!evidence.public_to_json_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(!evidence.compatibility_claimed());

    handoff.cleanup_order_record_count = handoff.host_node_cleanup_count();
    handoff.passive_ref_cleanup_order.cleanup_order_record_count =
        handoff.host_node_cleanup_count();
    let error = root
        .describe_private_to_json_unmount_finished_work_identity_gate_for_canary(
            &unmounted,
            Some(&handoff),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateUnmountNativeBridgeAdmission(error) = error else {
        panic!("expected private unmount cleanup handoff validation error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
            reason: "cleanup-order-count-mismatch"
        }
    ));
}

#[test]
fn root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate() {
    let (root, unmounted, _handoff, admission, identity) =
        accepted_unmount_identity_for_root(false, false);

    let error = root
        .describe_private_to_json_after_unmount_native_execution_for_canary(
            &unmounted, admission, None,
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON unmount native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "finished-work-identity-missing"
        }
    ));

    let mut stale_identity = identity;
    stale_identity.root_scheduled_update_sequence += 1;
    let error = root
        .describe_private_to_json_after_unmount_native_execution_for_canary(
            &unmounted,
            admission,
            Some(stale_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON unmount native execution stale identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "finished-work-identity-stale"
        }
    ));

    let mut mismatched_identity = identity;
    mismatched_identity.render_current.slot += 1;
    mismatched_identity.commit_previous_current = mismatched_identity.render_current;
    let error = root
        .describe_private_to_json_after_unmount_native_execution_for_canary(
            &unmounted,
            admission,
            Some(mismatched_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON unmount native execution identity handoff rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "unmount-admission-finished-work-identity-mismatch"
        }
    ));

    let mut mismatched_admission = admission;
    mismatched_admission.render_current.slot += 1;
    let error = root
        .describe_private_to_json_after_unmount_native_execution_for_canary(
            &unmounted,
            mismatched_admission,
            Some(identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON unmount native execution admission handoff rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "unmount-admission-handoff-mismatch"
        }
    ));

    let mut cleanup_handoff_admission = admission;
    cleanup_handoff_admission.cleanup_handoff_id = "tampered-cleanup-handoff";
    let error = root
        .describe_private_to_json_after_unmount_native_execution_for_canary(
            &unmounted,
            cleanup_handoff_admission,
            Some(identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON unmount native execution cleanup handoff rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "route-metadata-stale"
        }
    ));

    let mut lane_identity = identity;
    lane_identity.render_lanes_bits += 1;
    lane_identity.commit_finished_lanes_bits = lane_identity.render_lanes_bits;
    lane_identity.report_finished_lanes_bits = lane_identity.render_lanes_bits;
    let error = root
        .describe_private_to_json_after_unmount_native_execution_for_canary(
            &unmounted,
            admission,
            Some(lane_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON unmount native execution identity lane rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "unmount-admission-finished-work-identity-lane-mismatch"
        }
    ));

    let mut source_identity = identity;
    source_identity.source_serialization_diagnostic_name =
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME;
    let error = root
        .describe_private_to_json_after_unmount_native_execution_for_canary(
            &unmounted,
            admission,
            Some(source_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON unmount native execution source rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "finished-work-identity-source-report-mismatch"
        }
    ));

    let mut surface_identity = identity;
    surface_identity.public_surface = "create().unmount -> create().toTree";
    let error = root
        .describe_private_to_json_after_unmount_native_execution_for_canary(
            &unmounted,
            admission,
            Some(surface_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON unmount native execution surface rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "finished-work-identity-public-surface-mismatch"
        }
    ));

    let mut public_identity = identity;
    public_identity.public_serialization_available = true;
    let error = root
        .describe_private_to_json_after_unmount_native_execution_for_canary(
            &unmounted,
            admission,
            Some(public_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON unmount native execution public claim rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "public-or-native-compatibility-claim"
        }
    ));

    let mut native_admission = admission;
    native_admission.native_bridge_available = true;
    let error = root
        .describe_private_to_json_after_unmount_native_execution_for_canary(
            &unmounted,
            native_admission,
            Some(identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON unmount native execution native claim rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "public-or-native-compatibility-claim"
        }
    ));
}

#[test]
fn root_private_to_json_shape_diagnostics_serialize_empty_root_as_null() {
    let snapshot = TestContainerSnapshot { children: vec![] };

    let rendered =
        TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics(
            &snapshot,
        );

    assert!(rendered.is_null());
}

#[test]
fn root_private_to_json_shape_diagnostics_serialize_multiple_host_children_and_text_siblings() {
    let snapshot = TestContainerSnapshot {
        children: vec![
            TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: element_type("div"),
                props: props().with_attribute("id", "first"),
                hidden: false,
                detached: false,
                children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "one".to_owned(),
                    hidden: false,
                })],
            }),
            TestNodeSnapshot::Text(TestTextSnapshot {
                text: "tail".to_owned(),
                hidden: false,
            }),
            TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: element_type("span"),
                props: props().with_attribute("className", "tag"),
                hidden: false,
                detached: false,
                children: vec![
                    TestNodeSnapshot::Text(TestTextSnapshot {
                        text: "two".to_owned(),
                        hidden: false,
                    }),
                    TestNodeSnapshot::Text(TestTextSnapshot {
                        text: "three".to_owned(),
                        hidden: false,
                    }),
                ],
            }),
        ],
    };

    let rendered =
        TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics(
            &snapshot,
        );
    let children = rendered.as_array().unwrap();
    let first = children[0].as_host_component().unwrap();
    let second = children[1].as_text().unwrap();
    let third = children[2].as_host_component().unwrap();

    assert_eq!(children.len(), 3);
    assert_eq!(first.element_type().as_str(), "div");
    assert_eq!(first.props().get("id").map(String::as_str), Some("first"));
    assert_eq!(first.child_count(), 1);
    assert_eq!(first.children().unwrap()[0].as_text(), Some("one"));
    assert_eq!(second, "tail");
    assert_eq!(third.element_type().as_str(), "span");
    assert_eq!(
        third.props().get("className").map(String::as_str),
        Some("tag")
    );
    assert_eq!(third.child_count(), 2);
    assert_eq!(third.children().unwrap()[0].as_text(), Some("two"));
    assert_eq!(third.children().unwrap()[1].as_text(), Some("three"));
}

#[test]
fn root_private_to_json_shape_diagnostics_elide_children_prop() {
    let snapshot = TestContainerSnapshot {
        children: vec![TestNodeSnapshot::Element(TestElementSnapshot {
            element_type: element_type("div"),
            props: props()
                .with_attribute("children", "prop child")
                .with_attribute("data-id", "kept"),
            hidden: false,
            detached: false,
            children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                text: "rendered child".to_owned(),
                hidden: false,
            })],
        })],
    };

    let rendered =
        TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics(
            &snapshot,
        );
    let component = rendered.as_host_component().unwrap();

    assert_eq!(component.element_type().as_str(), "div");
    assert_eq!(
        component.props().get("data-id").map(String::as_str),
        Some("kept")
    );
    assert!(!component.props().contains_key("children"));
    assert_eq!(component.child_count(), 1);
    assert_eq!(
        component.children().unwrap()[0].as_text(),
        Some("rendered child")
    );
}

#[test]
fn root_private_json_serialization_canary_rejects_stale_host_output_snapshot() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let mut output = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    output.snapshot = TestContainerSnapshot { children: vec![] };

    let error = root
        .describe_private_json_serialization_for_canary(&output)
        .unwrap_err();

    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON serialization error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale
    ));
}

#[test]
fn root_private_json_serialization_canary_rejects_stale_updated_host_output_snapshot() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let mut updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    updated.snapshot = TestContainerSnapshot { children: vec![] };

    let error = root
        .describe_private_json_serialization_after_update_for_canary(&updated)
        .unwrap_err();

    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON serialization error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale
    ));
}

#[test]
fn root_private_json_serialization_canary_rejects_stale_commit_after_same_shape_update() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let output = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "hello")
        .unwrap();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    assert_eq!(updated.snapshot(), output.snapshot());

    let error = root
        .describe_private_json_serialization_for_canary(&output)
        .unwrap_err();

    let TestRendererRootError::SerializationGate(error) = error else {
        panic!("expected serialization gate error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererSerializationGateError::CommitIsNotCurrent { .. }
    ));
}

#[test]
fn root_private_json_serialization_canary_rejects_non_minimal_snapshot_shapes() {
    let empty_snapshot = TestContainerSnapshot { children: vec![] };
    let text_root_snapshot = TestContainerSnapshot {
        children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
            text: "hello".to_owned(),
            hidden: false,
        })],
    };
    let nested_component_snapshot = TestContainerSnapshot {
        children: vec![TestNodeSnapshot::Element(TestElementSnapshot {
            element_type: TestElementType::new("span"),
            props: TestProps::new(),
            hidden: false,
            detached: false,
            children: vec![TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: TestElementType::new("b"),
                props: TestProps::new(),
                hidden: false,
                detached: false,
                children: vec![],
            })],
        })],
    };

    let empty_error =
        TestRendererRoot::private_json_component_from_snapshot(&empty_snapshot).unwrap_err();
    let text_root_error =
        TestRendererRoot::private_json_component_from_snapshot(&text_root_snapshot).unwrap_err();
    let nested_component_error =
        TestRendererRoot::private_json_component_from_snapshot(&nested_component_snapshot)
            .unwrap_err();

    assert!(matches!(
        empty_error,
        TestRendererPrivateJsonSerializationError::RootChildCount { actual: 0 }
    ));
    assert!(matches!(
        text_root_error,
        TestRendererPrivateJsonSerializationError::RootChildIsText
    ));
    assert!(matches!(
        nested_component_error,
        TestRendererPrivateJsonSerializationError::HostComponentChildIsElement {
            element_type
        } if element_type.as_str() == "span"
    ));
}
