use super::*;

#[test]
fn root_private_to_tree_sibling_text_real_output_native_execution_consumes_identity_gate() {
    let (root, output, route, report) = sibling_text_identity_inputs_for_canary();
    let identity = root
        .describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(
            &output,
            route,
            Some(&report),
        )
        .unwrap();

    let evidence = root
        .describe_private_to_tree_after_sibling_text_update_native_execution_for_canary(
            &output,
            route,
            Some(identity),
        )
        .unwrap();

    assert_eq!(evidence.operation(), "update");
    assert_eq!(
        evidence.public_surface(),
        "create().update -> create().toTree"
    );
    assert_eq!(
        evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
    );
    assert_eq!(
        evidence.source_tree_diagnostic_name(),
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
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
    assert_eq!(
        evidence.source_fiber_count(),
        TEST_RENDERER_PRIVATE_TREE_COMPOSITE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE.len()
    );
    assert_eq!(evidence.root_child_count(), 2);
    assert!(evidence.consumes_accepted_native_update_execution_record());
    assert!(evidence.consumes_private_to_tree_evidence());
    assert!(evidence.consumes_accepted_host_output_row());
    assert_eq!(
        evidence.source_finished_work_identity_diagnostic_name(),
        Some(TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_DIAGNOSTIC_NAME)
    );
    assert!(evidence.consumes_private_sibling_text_finished_work_identity_gate());
    assert!(!evidence.minimal_tree_shape());
    assert!(evidence.function_component_above_host_output_shape());
    assert!(!evidence.public_to_tree_available());
    assert!(!evidence.public_serialization_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(!evidence.compatibility_claimed());

    let component = evidence.rendered_root().as_function_component().unwrap();
    let children = component.rendered().as_array().unwrap();
    assert_eq!(component.component_type(), "CanaryFunctionComponent");
    assert!(component.wraps_committed_host_output());
    assert_eq!(children.len(), 2);
    assert_eq!(children[0].as_text(), Some("first sibling"));
    let host = children[1].as_host_component().unwrap();
    assert_eq!(host.element_type().as_str(), "span");
    assert_eq!(host.rendered()[0].as_text(), Some("second sibling"));
}

#[test]
fn root_private_to_tree_sibling_text_real_output_native_execution_rejects_missing_or_tampered_identity()
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
        .describe_private_to_tree_after_sibling_text_update_native_execution_for_canary(
            &output, route, None,
        )
        .unwrap_err();
    assert_to_tree_native_execution_error_reason(error, "update", "finished-work-identity-missing");

    let mut wrong_source_identity = identity;
    wrong_source_identity.source_serialization_diagnostic_name =
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME;
    let error = root
        .describe_private_to_tree_after_sibling_text_update_native_execution_for_canary(
            &output,
            route,
            Some(wrong_source_identity),
        )
        .unwrap_err();
    assert_to_tree_native_execution_error_reason(
        error,
        "update",
        "sibling-text-finished-work-identity-source-mismatch",
    );

    let mut wrong_surface_identity = identity;
    wrong_surface_identity.public_surface = "create().update -> create().toTree";
    let error = root
        .describe_private_to_tree_after_sibling_text_update_native_execution_for_canary(
            &output,
            route,
            Some(wrong_surface_identity),
        )
        .unwrap_err();
    assert_to_tree_native_execution_error_reason(
        error,
        "update",
        "sibling-text-finished-work-identity-source-mismatch",
    );

    let mut wrong_route_identity = identity;
    wrong_route_identity.route_commit_current.slot += 1;
    let error = root
        .describe_private_to_tree_after_sibling_text_update_native_execution_for_canary(
            &output,
            route,
            Some(wrong_route_identity),
        )
        .unwrap_err();
    assert_to_tree_native_execution_error_reason(
        error,
        "update",
        "sibling-text-route-finished-work-identity-mismatch",
    );

    let mut stale_route = route;
    stale_route.commit_current.slot += 1;
    let error = root
        .describe_private_to_tree_after_sibling_text_update_native_execution_for_canary(
            &output,
            stale_route,
            Some(identity),
        )
        .unwrap_err();
    assert_to_tree_native_execution_error_reason(
        error,
        "update",
        "update-admission-handoff-mismatch",
    );

    let mut lane_identity = identity;
    lane_identity.report_finished_lanes_bits += 1;
    let error = root
        .describe_private_to_tree_after_sibling_text_update_native_execution_for_canary(
            &output,
            route,
            Some(lane_identity),
        )
        .unwrap_err();
    assert_to_tree_native_execution_error_reason(
        error,
        "update",
        "sibling-text-finished-work-identity-lane-mismatch",
    );

    let mut public_identity = identity;
    public_identity.package_compatibility_claimed = true;
    let error = root
        .describe_private_to_tree_after_sibling_text_update_native_execution_for_canary(
            &output,
            route,
            Some(public_identity),
        )
        .unwrap_err();
    assert_to_tree_native_execution_error_reason(
        error,
        "update",
        "public-or-native-package-js-compatibility-claim",
    );

    output.snapshot.children.clear();
    let error = root
        .describe_private_to_tree_after_sibling_text_update_native_execution_for_canary(
            &output,
            route,
            Some(identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree serialization error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale
    ));
}

#[test]
fn root_private_to_tree_sibling_text_report_fails_closed_in_generic_finished_work_identity_gate() {
    let (root, output, _route, json_report) = sibling_text_identity_inputs_for_canary();
    let tree_report = TestRendererRoot::private_tree_metadata_from_json_report(json_report);

    let error = root
        .describe_private_to_tree_finished_work_identity_gate_for_canary(
            Some(output.render()),
            Some(output.commit()),
            Some(&tree_report),
        )
        .unwrap_err();

    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private toTree finished-work identity error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
            reason: "sibling-text-finished-work-identity-gate-not-implemented"
        }
    ));
}

#[test]
fn root_private_to_tree_native_execution_evidence_consumes_create_update_unmount_records() {
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
        .describe_private_tree_metadata_for_canary(&created)
        .unwrap();
    let create_identity = root
        .describe_private_to_tree_finished_work_identity_gate_for_canary(
            Some(created.render()),
            Some(created.commit()),
            Some(&create_report),
        )
        .unwrap();

    let create_evidence = root
        .describe_private_to_tree_after_create_native_execution_for_canary(
            &created,
            create_admission,
            Some(create_identity),
        )
        .unwrap();

    assert_eq!(
        create_evidence.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        create_evidence.status(),
        TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_STATUS
    );
    assert_eq!(create_evidence.root(), root.root_id());
    assert_eq!(create_evidence.operation(), "create");
    assert_eq!(create_evidence.public_surface(), "create().toTree");
    assert_eq!(
        create_evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID
    );
    assert_eq!(
        create_evidence.source_tree_diagnostic_name(),
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
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
    let create_component = create_evidence
        .rendered_root()
        .as_function_component()
        .unwrap();
    let create_host = create_component.rendered().as_host_component().unwrap();
    assert_eq!(create_component.component_type(), "CanaryFunctionComponent");
    assert_eq!(create_host.element_type().as_str(), "span");
    assert_eq!(create_host.rendered()[0].as_text(), Some("hello"));
    assert_eq!(
        create_evidence.source_fiber_count(),
        TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE.len()
    );
    assert_eq!(create_evidence.root_child_count(), 1);
    assert!(create_evidence.consumes_accepted_native_create_execution_record());
    assert!(!create_evidence.consumes_accepted_native_update_execution_record());
    assert!(!create_evidence.consumes_accepted_native_unmount_execution_record());
    assert!(create_evidence.consumes_private_to_tree_evidence());
    assert!(!create_evidence.consumes_accepted_host_output_row());
    assert!(create_evidence.minimal_tree_shape());
    assert!(create_evidence.function_component_above_host_output_shape());
    assert!(!create_evidence.public_to_tree_available());
    assert!(!create_evidence.public_serialization_available());
    assert!(!create_evidence.public_route_available());
    assert!(!create_evidence.native_bridge_available());
    assert!(!create_evidence.native_execution_available());
    assert!(!create_evidence.compatibility_claimed());

    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    let update_admission = root
        .describe_private_update_route_admission_for_canary(&updated)
        .unwrap();
    let update_report = root
        .describe_private_tree_metadata_after_update_for_canary(&updated)
        .unwrap();
    let update_identity = root
        .describe_private_to_tree_finished_work_identity_gate_for_canary(
            Some(updated.render()),
            Some(updated.commit()),
            Some(&update_report),
        )
        .unwrap();

    let update_evidence = root
        .describe_private_to_tree_after_update_native_execution_for_canary(
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
    let update_component = update_evidence
        .rendered_root()
        .as_function_component()
        .unwrap();
    let update_host = update_component.rendered().as_host_component().unwrap();
    assert_eq!(update_host.rendered()[0].as_text(), Some("goodbye"));
    assert!(update_evidence.function_component_above_host_output_shape());
    assert!(!update_evidence.public_to_tree_available());
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
        .describe_private_to_tree_unmount_finished_work_identity_gate_for_canary(
            &unmounted,
            Some(&unmount_handoff),
        )
        .unwrap();

    let unmount_evidence = root
        .describe_private_to_tree_after_unmount_native_execution_for_canary(
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
    assert_eq!(unmount_evidence.source_fiber_count(), 0);
    assert_eq!(unmount_evidence.root_child_count(), 0);
    assert!(!unmount_evidence.consumes_accepted_native_create_execution_record());
    assert!(!unmount_evidence.consumes_accepted_native_update_execution_record());
    assert!(unmount_evidence.consumes_accepted_native_unmount_execution_record());
    assert!(unmount_evidence.consumes_accepted_host_output_row());
    assert!(unmount_evidence.minimal_tree_shape());
    assert!(!unmount_evidence.function_component_above_host_output_shape());
    assert!(!unmount_evidence.public_to_tree_available());
    assert!(!unmount_evidence.native_bridge_available());
    assert!(!unmount_evidence.native_execution_available());
    assert!(!unmount_evidence.compatibility_claimed());
}

#[test]
fn root_private_to_tree_native_execution_evidence_records_composite_host_shape() {
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
        .describe_private_tree_metadata_for_canary(&created)
        .unwrap();
    let create_identity = root
        .describe_private_to_tree_finished_work_identity_gate_for_canary(
            Some(created.render()),
            Some(created.commit()),
            Some(&create_report),
        )
        .unwrap();

    let evidence = root
        .describe_private_to_tree_after_create_native_execution_for_canary(
            &created,
            create_admission,
            Some(create_identity),
        )
        .unwrap();
    let component = evidence.rendered_root().as_function_component().unwrap();
    let rendered_host = component.rendered().as_host_component().unwrap();

    assert_eq!(
        evidence.source_fiber_count(),
        TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE.len()
    );
    assert!(evidence.minimal_tree_shape());
    assert!(evidence.function_component_above_host_output_shape());
    assert_eq!(
        component.node_type(),
        TestRendererPrivateTreeNodeType::Component
    );
    assert_eq!(
        component.component_type(),
        TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
    );
    assert!(!component.instance_available());
    assert!(component.wraps_committed_host_output());
    assert_eq!(
        rendered_host.node_type(),
        TestRendererPrivateTreeNodeType::Host
    );
    assert_eq!(rendered_host.rendered()[0].as_text(), Some("hello"));
    assert!(!evidence.public_to_tree_available());
    assert!(!evidence.native_execution_available());
    assert!(!evidence.compatibility_claimed());
}

#[test]
fn root_private_to_tree_create_native_execution_requires_finished_work_identity_gate() {
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
        .describe_private_tree_metadata_for_canary(&created)
        .unwrap();
    let identity = root
        .describe_private_to_tree_finished_work_identity_gate_for_canary(
            Some(created.render()),
            Some(created.commit()),
            Some(&report),
        )
        .unwrap();

    let error = root
        .describe_private_to_tree_after_create_native_execution_for_canary(
            &created,
            create_admission,
            None,
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
            operation: "create",
            reason: "finished-work-identity-missing"
        }
    ));

    let mut source_identity = identity;
    source_identity.source_serialization_diagnostic_name =
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME;
    let error = root
        .describe_private_to_tree_after_create_native_execution_for_canary(
            &created,
            create_admission,
            Some(source_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
            operation: "create",
            reason: "finished-work-identity-source-report-mismatch"
        }
    ));
}

#[test]
fn root_private_to_tree_update_native_execution_requires_finished_work_identity_gate() {
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
        .describe_private_tree_metadata_after_update_for_canary(&updated)
        .unwrap();
    let identity = root
        .describe_private_to_tree_finished_work_identity_gate_for_canary(
            Some(updated.render()),
            Some(updated.commit()),
            Some(&report),
        )
        .unwrap();

    let error = root
        .describe_private_to_tree_after_update_native_execution_for_canary(
            &updated,
            update_admission,
            None,
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree update native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
            operation: "update",
            reason: "finished-work-identity-missing"
        }
    ));

    let mut source_identity = identity;
    source_identity.source_serialization_diagnostic_name =
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME;
    let error = root
        .describe_private_to_tree_after_update_native_execution_for_canary(
            &updated,
            update_admission,
            Some(source_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree update native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
            operation: "update",
            reason: "finished-work-identity-source-report-mismatch"
        }
    ));

    let mut public_identity = identity;
    public_identity.compatibility_claimed = true;
    let error = root
        .describe_private_to_tree_after_update_native_execution_for_canary(
            &updated,
            update_admission,
            Some(public_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree update native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
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
        .describe_private_tree_metadata_after_update_for_canary(&later)
        .unwrap();
    let later_identity = root
        .describe_private_to_tree_finished_work_identity_gate_for_canary(
            Some(later.render()),
            Some(later.commit()),
            Some(&later_report),
        )
        .unwrap();

    let error = root
        .describe_private_to_tree_after_update_native_execution_for_canary(
            &later,
            update_admission,
            Some(later_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree update native execution stale admission rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
            operation: "update",
            reason: "update-admission-handoff-mismatch"
        }
    ));

    let later_evidence = root
        .describe_private_to_tree_after_update_native_execution_for_canary(
            &later,
            later_admission,
            Some(later_identity),
        )
        .unwrap();
    assert_eq!(later_evidence.operation(), "update");
    assert!(later_evidence.consumes_accepted_native_update_execution_record());
    assert!(later_evidence.consumes_private_to_tree_evidence());
    assert!(!later_evidence.public_to_tree_available());
    assert!(!later_evidence.compatibility_claimed());
}

#[test]
fn root_private_to_tree_serialization_finished_work_identity_gate_accepts_committed_handoff() {
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
        .describe_private_tree_metadata_for_canary(&output)
        .unwrap();

    let identity = root
        .describe_private_to_tree_finished_work_identity_gate_for_canary(
            Some(output.render()),
            Some(output.commit()),
            Some(&report),
        )
        .unwrap();

    assert_eq!(identity.public_surface(), "create().toTree");
    assert_eq!(
        identity.source_serialization_diagnostic_name(),
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
    );
    assert_eq!(identity.render_finished_work(), identity.commit_current());
    assert_eq!(
        identity.render_lanes_bits(),
        identity.commit_finished_lanes_bits()
    );
    assert!(!identity.consumes_private_to_json_evidence());
    assert!(identity.consumes_private_to_tree_evidence());
    assert!(!identity.public_serialization_available());
    assert!(!identity.compatibility_claimed());
}

#[test]
fn root_private_to_tree_update_serialization_finished_work_identity_gate_accepts_committed_handoff()
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
        .describe_private_tree_metadata_after_update_for_canary(&updated)
        .unwrap();

    let identity = root
        .describe_private_to_tree_finished_work_identity_gate_for_canary(
            Some(updated.render()),
            Some(updated.commit()),
            Some(&report),
        )
        .unwrap();

    assert_eq!(identity.public_surface(), "create().toTree");
    assert_eq!(
        identity.source_serialization_diagnostic_name(),
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
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
    assert!(!identity.consumes_private_to_json_evidence());
    assert!(identity.consumes_private_to_tree_evidence());
    assert!(!identity.public_serialization_available());
    assert!(!identity.compatibility_claimed());
}

#[test]
fn root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate() {
    let (root, unmounted, _handoff, admission, identity) =
        accepted_unmount_identity_for_root(true, false);

    let evidence = root
        .describe_private_to_tree_after_unmount_native_execution_for_canary(
            &unmounted,
            admission,
            Some(identity),
        )
        .unwrap();
    assert_eq!(evidence.operation(), "unmount");
    assert!(evidence.consumes_accepted_native_unmount_execution_record());
    assert!(evidence.consumes_private_to_tree_evidence());
    assert!(evidence.minimal_tree_shape());
    assert!(!evidence.public_to_tree_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(!evidence.compatibility_claimed());

    let error = root
        .describe_private_to_tree_after_unmount_native_execution_for_canary(
            &unmounted, admission, None,
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree unmount native execution identity rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "finished-work-identity-missing"
        }
    ));

    let mut cleanup_handoff_admission = admission;
    cleanup_handoff_admission.cleanup_handoff_id = "tampered-cleanup-handoff";
    let error = root
        .describe_private_to_tree_after_unmount_native_execution_for_canary(
            &unmounted,
            cleanup_handoff_admission,
            Some(identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree unmount native execution cleanup handoff rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "route-metadata-stale"
        }
    ));

    let mut source_identity = identity;
    source_identity.source_serialization_diagnostic_name =
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME;
    let error = root
        .describe_private_to_tree_after_unmount_native_execution_for_canary(
            &unmounted,
            admission,
            Some(source_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree unmount native execution source rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "finished-work-identity-source-report-mismatch"
        }
    ));

    let mut public_identity = identity;
    public_identity.compatibility_claimed = true;
    let error = root
        .describe_private_to_tree_after_unmount_native_execution_for_canary(
            &unmounted,
            admission,
            Some(public_identity),
        )
        .unwrap_err();
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree unmount native execution public claim rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
            operation: "unmount",
            reason: "public-or-native-compatibility-claim"
        }
    ));
}

#[test]
fn root_private_to_tree_shape_diagnostics_serialize_multiple_host_children_and_text_siblings() {
    let snapshot = TestContainerSnapshot {
        children: vec![
            TestNodeSnapshot::Text(TestTextSnapshot {
                text: "first sibling".to_owned(),
                hidden: false,
            }),
            TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: element_type("span"),
                props: props(),
                hidden: false,
                detached: false,
                children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "second sibling".to_owned(),
                    hidden: false,
                })],
            }),
        ],
    };

    let rendered =
        TestRendererRoot::describe_private_to_tree_host_shape_from_snapshot_for_diagnostics(
            &snapshot,
        );
    let children = rendered.as_array().unwrap();
    let component = children[1].as_host_component().unwrap();

    assert_eq!(
        TEST_RENDERER_PRIVATE_TREE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE,
        ["HostRoot", "HostText", "HostComponent", "HostText"]
    );
    assert_eq!(children.len(), 2);
    assert_eq!(children[0].as_text(), Some("first sibling"));
    assert_eq!(component.node_type(), TestRendererPrivateTreeNodeType::Host);
    assert_eq!(component.node_type().as_str(), "host");
    assert_eq!(component.element_type().as_str(), "span");
    assert!(component.props().is_empty());
    assert!(!component.instance_available());
    assert_eq!(component.rendered_child_count(), 1);
    assert_eq!(component.rendered()[0].as_text(), Some("second sibling"));
}

#[test]
fn root_private_to_tree_shape_diagnostics_wrap_composite_above_multi_child_host_output() {
    let snapshot = TestContainerSnapshot {
        children: vec![
            TestNodeSnapshot::Text(TestTextSnapshot {
                text: "first sibling".to_owned(),
                hidden: false,
            }),
            TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: element_type("span"),
                props: props(),
                hidden: false,
                detached: false,
                children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "second sibling".to_owned(),
                    hidden: false,
                })],
            }),
        ],
    };

    let rendered = TestRendererRoot::describe_private_to_tree_composite_above_host_shape_from_snapshot_for_diagnostics(&snapshot);
    let component = rendered.as_function_component().unwrap();
    let rendered_children = component.rendered().as_array().unwrap();
    let host_child = rendered_children[1].as_host_component().unwrap();

    assert_eq!(
        TEST_RENDERER_PRIVATE_TREE_COMPOSITE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE,
        [
            "HostRoot",
            "FunctionComponent",
            "HostText",
            "HostComponent",
            "HostText"
        ]
    );
    assert_eq!(
        component.node_type(),
        TestRendererPrivateTreeNodeType::Component
    );
    assert_eq!(component.node_type().as_str(), "component");
    assert_eq!(
        component.component_type(),
        TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
    );
    assert_eq!(component.props(), &TestProps::new());
    assert!(!component.instance_available());
    assert!(component.wraps_committed_host_output());
    assert_eq!(rendered_children.len(), 2);
    assert_eq!(rendered_children[0].as_text(), Some("first sibling"));
    assert_eq!(host_child.element_type().as_str(), "span");
    assert_eq!(host_child.rendered()[0].as_text(), Some("second sibling"));
}

#[test]
fn root_private_tree_metadata_canary_describes_minimal_host_component_with_text() {
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
        .describe_private_tree_metadata_for_canary(&output)
        .unwrap();
    let gate = report.gate();
    let host_root = report.host_root();
    let function_component = report.function_component();
    let component = report.host_component();
    let text = report.host_text();
    let blockers = report.public_blockers();

    assert_eq!(
        report.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
    );
    assert_eq!(
        report.source_json_diagnostic_name(),
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
    assert_eq!(
        gate.fiber_inspection().unwrap().current(),
        output.commit().current()
    );
    assert_eq!(
        report.accepted_fiber_shape(),
        &TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE
    );
    assert_eq!(
        report.accepted_composite_fiber_shape(),
        &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE
    );
    assert_eq!(report.root_child_count(), 1);
    assert_eq!(host_root.fiber_tag(), "HostRoot");
    assert!(host_root.delegates_to_child());
    assert_eq!(host_root.child_fiber_tag(), "HostComponent");
    assert!(!host_root.public_tree_object_available());
    assert_eq!(function_component.fiber_tag(), "FunctionComponent");
    assert_eq!(
        function_component.node_type(),
        TestRendererPrivateTreeNodeType::Component
    );
    assert_eq!(function_component.node_type().as_str(), "component");
    assert_eq!(
        function_component.component_type(),
        TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
    );
    assert_eq!(function_component.props(), &TestProps::new());
    assert!(!function_component.instance_available());
    assert_eq!(
        function_component.rendered_child_fiber_tag(),
        "HostComponent"
    );
    assert_eq!(
        function_component.rendered_child_node_type(),
        TestRendererPrivateTreeNodeType::Host
    );
    assert_eq!(function_component.rendered_child_count(), 1);
    assert!(function_component.wraps_committed_host_output());
    assert!(!function_component.public_tree_object_available());
    assert_eq!(component.fiber_tag(), "HostComponent");
    assert_eq!(component.node_type(), TestRendererPrivateTreeNodeType::Host);
    assert_eq!(component.node_type().as_str(), "host");
    assert_eq!(component.element_type().as_str(), "span");
    assert_eq!(component.props(), &TestProps::new());
    assert!(!component.instance_available());
    assert_eq!(component.rendered_child_count(), 1);
    assert_eq!(component.rendered_text(), "hello");
    assert!(!component.public_tree_object_available());
    assert_eq!(text.fiber_tag(), "HostText");
    assert_eq!(text.text(), "hello");
    assert!(text.returns_text_value());
    assert!(!text.public_tree_object_available());
    assert!(!report.public_tree_object_available());
    assert!(blockers.all_blocked());
    assert!(blockers.tree_method_blocked());
    assert!(blockers.json_method_blocked());
    assert!(blockers.instance_wrapper_blocked());
    assert!(blockers.js_facade_routing_blocked());
    assert!(blockers.compatibility_claim_blocked());
}

#[test]
fn root_private_tree_metadata_canary_describes_updated_host_component_text_after_commit() {
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
        .describe_private_tree_metadata_after_update_for_canary(&updated)
        .unwrap();

    assert_eq!(
        report.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
    );
    assert_eq!(
        report.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert!(report.host_output_snapshot_current());
    assert_eq!(
        report.gate().status(),
        TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
    );
    assert_eq!(
        report.gate().fiber_inspection().unwrap(),
        updated.fiber_inspection()
    );
    assert_eq!(report.root_child_count(), 1);
    assert_eq!(
        report.accepted_composite_fiber_shape(),
        &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE
    );
    assert_eq!(report.function_component().fiber_tag(), "FunctionComponent");
    assert_eq!(
        report.function_component().node_type(),
        TestRendererPrivateTreeNodeType::Component
    );
    assert_eq!(
        report.function_component().component_type(),
        TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
    );
    assert_eq!(
        report.function_component().rendered_child_fiber_tag(),
        "HostComponent"
    );
    assert!(report.function_component().wraps_committed_host_output());
    assert_eq!(report.host_component().element_type().as_str(), "span");
    assert_eq!(report.host_component().props(), &TestProps::new());
    assert_eq!(report.host_component().node_type().as_str(), "host");
    assert!(!report.host_component().instance_available());
    assert_eq!(report.host_component().rendered_child_count(), 1);
    assert_eq!(report.host_component().rendered_text(), "goodbye");
    assert_eq!(report.host_text().text(), "goodbye");
    assert!(report.host_text().returns_text_value());
    assert!(!report.public_tree_object_available());
    assert!(report.public_blockers().all_blocked());
}

#[test]
fn root_private_tree_metadata_canary_describes_function_component_above_host_output() {
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
        .describe_private_tree_metadata_for_canary(&output)
        .unwrap();
    let function_component = report.function_component();

    assert_eq!(
        report.accepted_fiber_shape(),
        &TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE
    );
    assert_eq!(
        report.accepted_composite_fiber_shape(),
        &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE
    );
    assert_eq!(function_component.fiber_tag(), "FunctionComponent");
    assert_eq!(
        function_component.node_type(),
        TestRendererPrivateTreeNodeType::Component
    );
    assert_eq!(
        function_component.component_type(),
        TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
    );
    assert_eq!(function_component.props(), &TestProps::new());
    assert!(!function_component.instance_available());
    assert_eq!(
        function_component.rendered_child_fiber_tag(),
        report.host_component().fiber_tag()
    );
    assert_eq!(
        function_component.rendered_child_node_type(),
        report.host_component().node_type()
    );
    assert_eq!(function_component.rendered_child_count(), 1);
    assert!(function_component.wraps_committed_host_output());
    assert!(!function_component.public_tree_object_available());
    assert_eq!(report.host_component().rendered_text(), "hello");
    assert!(!report.public_tree_object_available());
    assert!(report.public_blockers().tree_method_blocked());
}

#[test]
fn root_private_tree_committed_fiber_inspection_records_minimal_shape_privately() {
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
        .describe_private_tree_committed_fiber_inspection_for_canary(output.commit())
        .unwrap();

    assert_eq!(
        report.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TREE_COMMITTED_FIBER_INSPECTION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        report.source_tree_diagnostic_name(),
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
    );
    assert_eq!(report.shape_name(), "HostRoot->HostComponent->HostText");
    assert_eq!(
        report.fiber_shape(),
        &["HostRoot", "HostComponent", "HostText"]
    );
    assert_eq!(report.root_child_fiber_tags(), &["HostComponent"]);
    assert_eq!(report.host_child_fiber_tags(), &["HostComponent"]);
    assert_eq!(report.root_child_count(), 1);
    assert_eq!(report.host_child_count(), 1);
    assert_eq!(report.host_component_count(), 1);
    assert_eq!(report.host_text_count(), 1);
    assert!(report.function_component_fiber_tag().is_none());
    assert!(!report.function_component_present());
    assert!(!report.wraps_committed_host_output());
    assert_eq!(
        report.accepted_minimal_fiber_shape(),
        &TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE
    );
    assert_eq!(
        report.accepted_composite_fiber_shape(),
        &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE
    );
    assert_eq!(
        report.accepted_multi_child_fiber_shape(),
        &TEST_RENDERER_PRIVATE_TREE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE
    );
    assert_eq!(
        report.accepted_composite_multi_child_fiber_shape(),
        &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE
    );
    assert!(report.public_blockers().all_blocked());
    assert!(!report.public_tree_object_available());
    assert!(!report.compatibility_claimed());
}

#[test]
fn root_private_tree_metadata_canary_rejects_stale_host_output_snapshot() {
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
        .describe_private_tree_metadata_for_canary(&output)
        .unwrap_err();

    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON serialization error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale
    ));
}
