use super::*;

#[test]
fn root_private_unmount_nested_source_report_gate_consumes_worker_733_and_736_evidence() {
    let (nested_root, nested_output, nested_route, nested_report, nested_identity) =
        nested_source_report_identity_inputs_for_canary();
    let (unmount_root, unmounted, handoff, admission, unmount_identity) =
        accepted_unmount_identity_for_root(false, true);

    let gate =
        TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
            &nested_root,
            &nested_output,
            nested_route,
            Some(&nested_report),
            Some(nested_identity),
            &unmount_root,
            &unmounted,
            Some(handoff),
            admission,
            Some(unmount_identity),
        )
        .unwrap();

    assert_eq!(
        gate.diagnostic_name(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_DIAGNOSTIC_NAME
    );
    assert_eq!(
        gate.status(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_STATUS
    );
    assert_eq!(gate.nested_root(), nested_root.root_id());
    assert_eq!(gate.unmount_root(), unmount_root.root_id());
    assert_ne!(gate.nested_renderer_id, gate.unmount_renderer_id);
    assert_eq!(gate.nested_renderer_id, nested_root.renderer.renderer_id);
    assert_eq!(gate.unmount_renderer_id, unmount_root.renderer.renderer_id);
    assert_eq!(gate.nested_identity_public_surface(), "create().toJSON");
    assert_eq!(
        gate.nested_identity_source_serialization_diagnostic_name(),
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        gate.unmount_identity_public_surface(),
        "create().unmount -> create().toJSON"
    );
    assert_eq!(
        gate.unmount_identity_source_serialization_diagnostic_name(),
        TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        gate.nested_host_output_row_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(
        gate.unmount_host_output_row_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(
        gate.nested_scheduled_update_sequence(),
        nested_route.scheduled_update_sequence()
    );
    assert_eq!(
        gate.unmount_scheduled_update_sequence(),
        admission.scheduled_update_sequence()
    );
    assert_eq!(
        gate.nested_host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::NestedHostText
    );
    assert_eq!(
        gate.unmount_host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::EmptyRoot
    );
    assert_eq!(gate.nested_source_node_count(), 4);
    assert_eq!(gate.nested_host_component_count(), 2);
    assert_eq!(gate.nested_host_text_count(), 2);
    assert_eq!(gate.unmount_host_node_cleanup_count(), 2);
    assert_eq!(gate.unmount_cleanup_order_record_count(), 4);
    assert!(gate.nested_identity_accepted());
    assert!(gate.unmount_identity_accepted());
    assert!(gate.nested_route_admission_accepted());
    assert!(gate.unmount_route_admission_accepted());
    assert!(gate.nested_committed_source_report_ownership_accepted());
    assert!(gate.unmount_deletion_cleanup_metadata_accepted());
    assert!(gate.consumes_worker_736_nested_source_report_identity());
    assert!(gate.consumes_worker_733_unmount_identity());
    assert!(gate.private_admission_ready());
    assert!(!gate.broad_multichild_identity_available());
    assert!(!gate.public_to_json_available());
    assert!(!gate.public_to_tree_available());
    assert!(!gate.public_test_instance_available());
    assert!(!gate.public_serialization_available());
    assert!(!gate.public_route_available());
    assert!(!gate.native_bridge_loading_available());
    assert!(!gate.native_bridge_available());
    assert!(!gate.native_execution_available());
    assert!(!gate.js_facade_available());
    assert!(!gate.cjs_facade_available());
    assert!(!gate.package_compatibility_claimed());
    assert!(!gate.compatibility_claimed());
    assert!(gate.public_native_package_js_surfaces_blocked());
}

#[test]
fn root_private_unmount_nested_source_report_gate_rejects_stale_foreign_tampered_handoffs() {
    let (nested_root, nested_output, nested_route, nested_report, nested_identity) =
        nested_source_report_identity_inputs_for_canary();
    let (unmount_root, unmounted, handoff, admission, unmount_identity) =
        accepted_unmount_identity_for_root(false, true);

    let error =
        TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
            &nested_root,
            &nested_output,
            nested_route,
            Some(&nested_report),
            None,
            &unmount_root,
            &unmounted,
            Some(handoff),
            admission,
            Some(unmount_identity),
        )
        .unwrap_err();
    assert_unmount_nested_source_report_gate_error_reason(
        error,
        "nested-finished-work-identity-missing",
    );

    let error =
        TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
            &nested_root,
            &nested_output,
            nested_route,
            Some(&nested_report),
            Some(unmount_identity),
            &unmount_root,
            &unmounted,
            Some(handoff),
            admission,
            Some(unmount_identity),
        )
        .unwrap_err();
    assert_unmount_nested_source_report_gate_error_reason(
        error,
        "finished-work-identity-public-surface-mismatch",
    );

    let mut stale_nested_identity = nested_identity;
    stale_nested_identity.commit_current.slot += 1;
    let error =
        TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
            &nested_root,
            &nested_output,
            nested_route,
            Some(&nested_report),
            Some(stale_nested_identity),
            &unmount_root,
            &unmounted,
            Some(handoff),
            admission,
            Some(unmount_identity),
        )
        .unwrap_err();
    assert_unmount_nested_source_report_gate_error_reason(error, "finished-work-identity-stale");

    let mut stale_nested_route = nested_route;
    stale_nested_route.commit_current.slot += 1;
    let error =
        TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
            &nested_root,
            &nested_output,
            stale_nested_route,
            Some(&nested_report),
            Some(nested_identity),
            &unmount_root,
            &unmounted,
            Some(handoff),
            admission,
            Some(unmount_identity),
        )
        .unwrap_err();
    assert_unmount_nested_source_report_gate_error_reason(
        error,
        "update-admission-handoff-mismatch",
    );

    let mut broad_report = nested_report.clone();
    broad_report.host_output_shape = TestRendererPrivateToJsonHostOutputShape::SiblingText;
    let error =
        TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
            &nested_root,
            &nested_output,
            nested_route,
            Some(&broad_report),
            Some(nested_identity),
            &unmount_root,
            &unmounted,
            Some(handoff),
            admission,
            Some(unmount_identity),
        )
        .unwrap_err();
    assert_unmount_nested_source_report_gate_error_reason(
        error,
        "nested-source-report-ownership-mismatch",
    );

    let mut tampered_placed_text_report = nested_report.clone();
    tampered_placed_text_report.nodes[3].fiber = tampered_placed_text_report.nodes[2].fiber;
    let error =
        TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
            &nested_root,
            &nested_output,
            nested_route,
            Some(&tampered_placed_text_report),
            Some(nested_identity),
            &unmount_root,
            &unmounted,
            Some(handoff),
            admission,
            Some(unmount_identity),
        )
        .unwrap_err();
    assert_unmount_nested_source_report_gate_error_reason(
        error,
        "nested-source-report-ownership-mismatch",
    );

    let mut stale_handoff = handoff;
    stale_handoff.cleanup_order_record_count = stale_handoff.host_node_cleanup_count();
    stale_handoff
        .passive_ref_cleanup_order
        .cleanup_order_record_count = stale_handoff.host_node_cleanup_count();
    let error =
        TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
            &nested_root,
            &nested_output,
            nested_route,
            Some(&nested_report),
            Some(nested_identity),
            &unmount_root,
            &unmounted,
            Some(stale_handoff),
            admission,
            Some(unmount_identity),
        )
        .unwrap_err();
    assert_unmount_nested_source_report_gate_error_reason(
        error,
        "unmount-deletion-cleanup-handoff-mismatch",
    );

    let mut tampered_admission = admission;
    tampered_admission.cleanup_handoff_id = "tampered-cleanup-handoff";
    let error =
        TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
            &nested_root,
            &nested_output,
            nested_route,
            Some(&nested_report),
            Some(nested_identity),
            &unmount_root,
            &unmounted,
            Some(handoff),
            tampered_admission,
            Some(unmount_identity),
        )
        .unwrap_err();
    assert_unmount_nested_source_report_gate_error_reason(
        error,
        "unmount-route-admission-mismatch",
    );
}

#[test]
fn root_private_unmount_nested_source_report_gate_rejects_public_native_package_claims() {
    let (nested_root, nested_output, nested_route, nested_report, nested_identity) =
        nested_source_report_identity_inputs_for_canary();
    let (unmount_root, unmounted, handoff, admission, unmount_identity) =
        accepted_unmount_identity_for_root(false, true);

    let mut public_nested_identity = nested_identity;
    public_nested_identity.public_to_json_available = true;
    let error =
        TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
            &nested_root,
            &nested_output,
            nested_route,
            Some(&nested_report),
            Some(public_nested_identity),
            &unmount_root,
            &unmounted,
            Some(handoff),
            admission,
            Some(unmount_identity),
        )
        .unwrap_err();
    assert_unmount_nested_source_report_gate_error_reason(
        error,
        "public-or-native-package-js-compatibility-claim",
    );

    let mut native_admission = admission;
    native_admission.native_bridge_available = true;
    let error =
        TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
            &nested_root,
            &nested_output,
            nested_route,
            Some(&nested_report),
            Some(nested_identity),
            &unmount_root,
            &unmounted,
            Some(handoff),
            native_admission,
            Some(unmount_identity),
        )
        .unwrap_err();
    assert_unmount_nested_source_report_gate_error_reason(
        error,
        "public-or-native-package-js-compatibility-claim",
    );

    let gate =
        TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
            &nested_root,
            &nested_output,
            nested_route,
            Some(&nested_report),
            Some(nested_identity),
            &unmount_root,
            &unmounted,
            Some(handoff),
            admission,
            Some(unmount_identity),
        )
        .unwrap();

    let mut broad_gate = gate;
    broad_gate.broad_multichild_identity_available = true;
    assert_eq!(
        TestRendererRoot::validate_private_unmount_nested_source_report_admission_gate_for_canary(
            broad_gate,
        )
        .unwrap_err(),
        "broad-multichild-identity-unexpectedly-open"
    );

    let mut test_instance_gate = gate;
    test_instance_gate.public_test_instance_available = true;
    assert_eq!(
        TestRendererRoot::validate_private_unmount_nested_source_report_admission_gate_for_canary(
            test_instance_gate,
        )
        .unwrap_err(),
        "public-or-native-package-js-compatibility-claim"
    );

    let mut js_gate = gate;
    js_gate.native_bridge_loading_available = true;
    js_gate.js_facade_available = true;
    js_gate.cjs_facade_available = true;
    js_gate.package_compatibility_claimed = true;
    assert_eq!(
        TestRendererRoot::validate_private_unmount_nested_source_report_admission_gate_for_canary(
            js_gate,
        )
        .unwrap_err(),
        "public-or-native-package-js-compatibility-claim"
    );
}

#[test]
fn root_private_unmount_nested_source_report_to_json_native_execution_consumes_gate() {
    let (unmount_root, unmounted, handoff, admission, identity) =
        accepted_unmount_identity_for_root(false, true);
    let gate = accepted_unmount_nested_source_report_gate_for_unmount_root(
        &unmount_root,
        &unmounted,
        handoff,
        admission,
        identity,
    );

    let evidence = unmount_root
        .describe_private_to_json_after_unmount_nested_source_report_native_execution_for_canary(
            &unmounted,
            admission,
            Some(identity),
            Some(gate),
        )
        .unwrap();

    assert_eq!(evidence.operation(), "unmount");
    assert_eq!(
        evidence.public_surface(),
        "create().unmount -> create().toJSON"
    );
    assert_eq!(
        evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        evidence.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::EmptyRoot
    );
    assert_eq!(
        evidence.host_output_row().unwrap().id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
    );
    assert!(evidence.consumes_accepted_native_unmount_execution_record());
    assert!(evidence.consumes_private_to_json_evidence());
    assert!(evidence.consumes_accepted_host_output_row());
    assert_eq!(
        evidence.source_unmount_nested_source_report_admission_gate_diagnostic_name(),
        Some(TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_DIAGNOSTIC_NAME)
    );
    assert_eq!(
        evidence.source_unmount_nested_source_report_admission_gate_status(),
        Some(TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_STATUS)
    );
    assert!(evidence.consumes_private_unmount_nested_source_report_admission_gate());
    assert!(evidence.minimal_tree_shape());
    assert!(!evidence.public_to_json_available());
    assert!(!evidence.public_serialization_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(!evidence.compatibility_claimed());

    let error = unmount_root
        .describe_private_to_json_after_unmount_nested_source_report_native_execution_for_canary(
            &unmounted,
            admission,
            Some(identity),
            None,
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "unmount",
        TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISSING_REASON,
    );

    let mut stale_gate = gate;
    stale_gate.unmount_host_node_cleanup_count += 1;
    let error = unmount_root
        .describe_private_to_json_after_unmount_nested_source_report_native_execution_for_canary(
            &unmounted,
            admission,
            Some(identity),
            Some(stale_gate),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "unmount",
        TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISMATCH_REASON,
    );
}

#[test]
fn root_private_unmount_nested_source_report_to_tree_native_execution_consumes_gate() {
    let (unmount_root, unmounted, handoff, admission, json_identity) =
        accepted_unmount_identity_for_root(false, true);
    let tree_identity = unmount_root
        .describe_private_to_tree_unmount_finished_work_identity_gate_for_canary(
            &unmounted,
            Some(&handoff),
        )
        .unwrap();
    let gate = accepted_unmount_nested_source_report_gate_for_unmount_root(
        &unmount_root,
        &unmounted,
        handoff,
        admission,
        json_identity,
    );

    let evidence = unmount_root
        .describe_private_to_tree_after_unmount_nested_source_report_native_execution_for_canary(
            &unmounted,
            admission,
            Some(tree_identity),
            Some(gate),
        )
        .unwrap();

    assert_eq!(evidence.operation(), "unmount");
    assert_eq!(
        evidence.public_surface(),
        "create().unmount -> create().toTree"
    );
    assert_eq!(
        evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        evidence.source_tree_diagnostic_name(),
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
    );
    assert_eq!(
        evidence.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::EmptyRoot
    );
    assert!(evidence.consumes_accepted_native_unmount_execution_record());
    assert!(evidence.consumes_private_to_tree_evidence());
    assert!(evidence.consumes_accepted_host_output_row());
    assert_eq!(
        evidence.source_unmount_nested_source_report_admission_gate_diagnostic_name(),
        Some(TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_DIAGNOSTIC_NAME)
    );
    assert_eq!(
        evidence.source_unmount_nested_source_report_admission_gate_status(),
        Some(TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_STATUS)
    );
    assert!(evidence.consumes_private_unmount_nested_source_report_admission_gate());
    assert!(evidence.minimal_tree_shape());
    assert!(!evidence.function_component_above_host_output_shape());
    assert!(!evidence.public_to_tree_available());
    assert!(!evidence.public_serialization_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(!evidence.compatibility_claimed());

    let error = unmount_root
        .describe_private_to_tree_after_unmount_nested_source_report_native_execution_for_canary(
            &unmounted,
            admission,
            Some(tree_identity),
            None,
        )
        .unwrap_err();
    assert_to_tree_native_execution_error_reason(
        error,
        "unmount",
        TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISSING_REASON,
    );

    let mut stale_gate = gate;
    stale_gate.unmount_root = FiberRootId::new(stale_gate.unmount_root().raw() + 1).unwrap();
    let error = unmount_root
        .describe_private_to_tree_after_unmount_nested_source_report_native_execution_for_canary(
            &unmounted,
            admission,
            Some(tree_identity),
            Some(stale_gate),
        )
        .unwrap_err();
    assert_to_tree_native_execution_error_reason(
        error,
        "unmount",
        TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISMATCH_REASON,
    );
}

#[test]
fn root_private_unmount_nested_source_report_native_execution_rejects_cross_surface_identities() {
    let (unmount_root, unmounted, handoff, admission, json_identity) =
        accepted_unmount_identity_for_root(false, true);
    let tree_identity = unmount_root
        .describe_private_to_tree_unmount_finished_work_identity_gate_for_canary(
            &unmounted,
            Some(&handoff),
        )
        .unwrap();
    let gate = accepted_unmount_nested_source_report_gate_for_unmount_root(
        &unmount_root,
        &unmounted,
        handoff,
        admission,
        json_identity,
    );

    let error = unmount_root
        .describe_private_to_json_after_unmount_nested_source_report_native_execution_for_canary(
            &unmounted,
            admission,
            Some(tree_identity),
            Some(gate),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "unmount",
        "finished-work-identity-public-surface-mismatch",
    );

    let error = unmount_root
        .describe_private_to_tree_after_unmount_nested_source_report_native_execution_for_canary(
            &unmounted,
            admission,
            Some(json_identity),
            Some(gate),
        )
        .unwrap_err();
    assert_to_tree_native_execution_error_reason(
        error,
        "unmount",
        "finished-work-identity-public-surface-mismatch",
    );
}

#[test]
fn root_private_unmount_nested_source_report_native_execution_rejects_wrong_unmount_pairing() {
    let (source_root, source_unmounted, source_handoff, source_admission, source_identity) =
        accepted_unmount_identity_for_root(false, true);
    let source_gate = accepted_unmount_nested_source_report_gate_for_unmount_root(
        &source_root,
        &source_unmounted,
        source_handoff,
        source_admission,
        source_identity,
    );
    let (other_root, other_unmounted, _other_handoff, other_admission, other_identity) =
        accepted_unmount_identity_for_root(false, true);

    let error = other_root
        .describe_private_to_json_after_unmount_nested_source_report_native_execution_for_canary(
            &other_unmounted,
            other_admission,
            Some(other_identity),
            Some(source_gate),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "unmount",
        TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISMATCH_REASON,
    );

    let mut stale_gate = source_gate;
    stale_gate.unmount_scheduled_update_sequence += 1;
    let error = source_root
        .describe_private_to_json_after_unmount_nested_source_report_native_execution_for_canary(
            &source_unmounted,
            source_admission,
            Some(source_identity),
            Some(stale_gate),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "unmount",
        TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISMATCH_REASON,
    );

    let mut stale_execution = source_admission;
    stale_execution.scheduled_update_sequence += 1;
    let error = source_root
        .describe_private_to_json_after_unmount_nested_source_report_native_execution_for_canary(
            &source_unmounted,
            stale_execution,
            Some(source_identity),
            Some(source_gate),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "unmount",
        TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISMATCH_REASON,
    );

    let mut self_paired_gate = source_gate;
    self_paired_gate.nested_renderer_id = self_paired_gate.unmount_renderer_id;
    let error = source_root
        .describe_private_to_json_after_unmount_nested_source_report_native_execution_for_canary(
            &source_unmounted,
            source_admission,
            Some(source_identity),
            Some(self_paired_gate),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "unmount",
        "unmount-nested-source-report-gate-root-pair-mismatch",
    );
}

#[test]
fn root_private_unmount_nested_source_report_native_execution_rejects_caller_built_gate_fields() {
    let (unmount_root, unmounted, handoff, admission, identity) =
        accepted_unmount_identity_for_root(false, true);
    let gate = accepted_unmount_nested_source_report_gate_for_unmount_root(
        &unmount_root,
        &unmounted,
        handoff,
        admission,
        identity,
    );

    let caller_built_missing_nested_row =
        TestRendererPrivateUnmountNestedSourceReportAdmissionGate {
            nested_host_output_row_id: "caller-built-nested-row",
            ..gate
        };
    let error = unmount_root
        .describe_private_to_json_after_unmount_nested_source_report_native_execution_for_canary(
            &unmounted,
            admission,
            Some(identity),
            Some(caller_built_missing_nested_row),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "unmount",
        "unmount-nested-source-report-gate-source-mismatch",
    );

    let caller_built_missing_unmount_row =
        TestRendererPrivateUnmountNestedSourceReportAdmissionGate {
            unmount_host_output_row_id: "caller-built-unmount-row",
            ..gate
        };
    let error = unmount_root
        .describe_private_to_json_after_unmount_nested_source_report_native_execution_for_canary(
            &unmounted,
            admission,
            Some(identity),
            Some(caller_built_missing_unmount_row),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "unmount",
        "unmount-nested-source-report-gate-source-mismatch",
    );

    let caller_built_cross_surface_gate =
        TestRendererPrivateUnmountNestedSourceReportAdmissionGate {
            unmount_identity_source_serialization_diagnostic_name:
                TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
            ..gate
        };
    let error = unmount_root
        .describe_private_to_tree_after_unmount_nested_source_report_native_execution_for_canary(
            &unmounted,
            admission,
            Some(
                unmount_root
                    .describe_private_to_tree_unmount_finished_work_identity_gate_for_canary(
                        &unmounted,
                        Some(&handoff),
                    )
                    .unwrap(),
            ),
            Some(caller_built_cross_surface_gate),
        )
        .unwrap_err();
    assert_to_tree_native_execution_error_reason(
        error,
        "unmount",
        "unmount-nested-source-report-gate-source-mismatch",
    );

    let caller_built_missing_shape = TestRendererPrivateUnmountNestedSourceReportAdmissionGate {
        nested_host_component_count: 1,
        ..gate
    };
    let error = unmount_root
        .describe_private_to_json_after_unmount_nested_source_report_native_execution_for_canary(
            &unmounted,
            admission,
            Some(identity),
            Some(caller_built_missing_shape),
        )
        .unwrap_err();
    assert_to_json_native_execution_error_reason(
        error,
        "unmount",
        "unmount-nested-source-report-gate-shape-mismatch",
    );
}

#[test]
fn root_private_unmount_native_bridge_admission_executes_minimal_cleanup_handoff() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();

    let cleanup_handoff = root
        .execute_private_unmount_native_bridge_cleanup_handoff_for_canary()
        .unwrap();
    let deletion_handoff = cleanup_handoff.deletion_commit_handoff();
    let admission = cleanup_handoff.native_bridge_admission();
    let passive_ref_order = cleanup_handoff.passive_ref_cleanup_order();

    assert_eq!(
        cleanup_handoff.diagnostic_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID
    );
    assert_eq!(
        cleanup_handoff.status(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_STATUS
    );
    assert_eq!(cleanup_handoff.root(), root.root_id());
    assert_eq!(cleanup_handoff.route_outcome(), "Scheduled");
    assert_eq!(
        cleanup_handoff.route_dependency_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
    );
    assert_eq!(
        cleanup_handoff.deletion_commit_handoff_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
    );
    assert_eq!(
        cleanup_handoff.admission_diagnostic_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        cleanup_handoff.lifecycle(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(
        cleanup_handoff.scheduled_update_kind(),
        TestRendererRootUpdateKind::Unmount
    );
    assert!(cleanup_handoff.scheduled_element_is_none());
    assert_eq!(cleanup_handoff.previous_root_child_count(), 1);
    assert_eq!(cleanup_handoff.current_root_child_count(), 0);
    assert!(cleanup_handoff.detached_instance());
    assert_eq!(cleanup_handoff.detached_instance_child_count(), 0);
    assert_eq!(cleanup_handoff.host_node_cleanup_count(), 2);
    assert_eq!(cleanup_handoff.ref_cleanup_return_count(), 0);
    assert_eq!(cleanup_handoff.passive_destroy_count(), 0);
    assert_eq!(cleanup_handoff.cleanup_order_record_count(), 2);
    assert!(cleanup_handoff.native_cleanup_after_ref_and_passive_ordering());
    assert!(cleanup_handoff.minimal_tree_cleanup_handoff());
    assert!(cleanup_handoff.rust_unmount_cleanup_handoff_executed());
    assert!(cleanup_handoff.host_output_produced());
    assert_eq!(
        passive_ref_order.diagnostic_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_DIAGNOSTIC_ID
    );
    assert_eq!(passive_ref_order.ref_cleanup_return_count(), 0);
    assert_eq!(passive_ref_order.passive_destroy_count(), 0);
    assert_eq!(passive_ref_order.host_node_cleanup_count(), 2);
    assert_eq!(passive_ref_order.cleanup_order_record_count(), 2);
    assert_eq!(passive_ref_order.first_host_node_cleanup_order(), Some(0));
    assert!(passive_ref_order.native_cleanup_after_ref_and_passive_ordering());
    assert!(passive_ref_order.minimal_tree_ordering_is_host_cleanup_only());
    assert!(!passive_ref_order.public_ref_or_effect_compatibility_claimed());
    assert_eq!(
        deletion_handoff.diagnostic_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
    );
    assert_eq!(
        admission.diagnostic_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert!(admission.deletion_commit_handoff_accepted());
    assert!(admission.cleanup_handoff_accepted());
    assert!(admission.passive_ref_cleanup_order_accepted());
    assert_eq!(admission.ref_cleanup_return_count(), 0);
    assert_eq!(admission.passive_destroy_count(), 0);
    assert!(admission.native_cleanup_after_ref_and_passive_ordering());
    assert!(admission.rust_unmount_cleanup_handoff_executed());
    assert!(admission.host_output_produced());
    assert!(admission.minimal_tree_cleanup_handoff());
    assert!(!cleanup_handoff.public_unmount_compatibility_claimed());
    assert!(!cleanup_handoff.public_host_teardown_compatibility_claimed());
    assert!(!cleanup_handoff.act_flushing_claimed());
    assert!(!cleanup_handoff.native_bridge_available());
    assert!(!cleanup_handoff.native_execution());
    assert!(!admission.public_unmount_compatibility_claimed());
    assert!(!admission.public_host_teardown_compatibility_claimed());
    assert!(!admission.act_flushing_claimed());
    assert!(!admission.native_bridge_available());
    assert!(!admission.native_execution());
    assert_eq!(host_storage_counts(&root), (1, 1, 1));
    assert_eq!(host_node_activity_counts(&root), (0, 2));
    assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn root_private_unmount_native_bridge_cleanup_handoff_carries_ref_passive_cleanup_evidence() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();

    let cleanup_handoff = root
        .execute_private_unmount_native_bridge_cleanup_handoff_with_ref_passive_cleanup_for_canary()
        .unwrap();
    let deletion_handoff = cleanup_handoff.deletion_commit_handoff();
    let admission = cleanup_handoff.native_bridge_admission();
    let passive_ref_order = cleanup_handoff.passive_ref_cleanup_order();

    assert_eq!(cleanup_handoff.previous_root_child_count(), 1);
    assert_eq!(cleanup_handoff.current_root_child_count(), 0);
    assert!(cleanup_handoff.detached_instance());
    assert_eq!(cleanup_handoff.detached_instance_child_count(), 0);
    assert_eq!(cleanup_handoff.host_node_cleanup_count(), 2);
    assert_eq!(cleanup_handoff.ref_cleanup_return_count(), 1);
    assert_eq!(cleanup_handoff.passive_destroy_count(), 1);
    assert_eq!(cleanup_handoff.cleanup_order_record_count(), 4);
    assert!(cleanup_handoff.native_cleanup_after_ref_and_passive_ordering());
    assert!(!cleanup_handoff.minimal_tree_cleanup_handoff());
    assert!(cleanup_handoff.rust_unmount_cleanup_handoff_executed());
    assert!(cleanup_handoff.host_output_produced());

    assert_eq!(deletion_handoff.host_node_cleanup_count(), 2);
    assert_eq!(deletion_handoff.cleanup_order_record_count(), 4);
    assert!(deletion_handoff.cleanup_records_match_deletion_commit());
    assert_eq!(passive_ref_order.ref_cleanup_return_count(), 1);
    assert_eq!(passive_ref_order.passive_destroy_count(), 1);
    assert_eq!(passive_ref_order.host_node_cleanup_count(), 2);
    assert_eq!(passive_ref_order.cleanup_order_record_count(), 4);
    assert_eq!(passive_ref_order.last_ref_cleanup_return_order(), Some(0));
    assert_eq!(passive_ref_order.first_passive_destroy_order(), Some(1));
    assert_eq!(passive_ref_order.last_passive_destroy_order(), Some(1));
    assert_eq!(passive_ref_order.first_host_node_cleanup_order(), Some(2));
    assert!(passive_ref_order.ref_cleanup_return_precedes_passive_destroy());
    assert!(passive_ref_order.host_cleanup_follows_ref_cleanup_return());
    assert!(passive_ref_order.host_cleanup_follows_passive_destroy());
    assert!(passive_ref_order.native_cleanup_after_ref_and_passive_ordering());
    assert!(!passive_ref_order.minimal_tree_ordering_is_host_cleanup_only());
    assert!(!passive_ref_order.ref_cleanup_return_callbacks_invoked());
    assert!(!passive_ref_order.passive_destroy_callbacks_invoked());
    assert!(!passive_ref_order.public_effects_flushed());
    assert!(!passive_ref_order.public_ref_or_effect_compatibility_claimed());
    assert!(!passive_ref_order.public_unmount_compatibility_claimed());
    assert!(!passive_ref_order.act_flushing_claimed());

    assert_eq!(admission.host_node_cleanup_count(), 2);
    assert_eq!(admission.ref_cleanup_return_count(), 1);
    assert_eq!(admission.passive_destroy_count(), 1);
    assert_eq!(admission.cleanup_order_record_count(), 4);
    assert!(admission.native_cleanup_after_ref_and_passive_ordering());
    assert!(!admission.minimal_tree_cleanup_handoff());
    assert!(admission.rust_unmount_cleanup_handoff_executed());
    assert!(admission.host_output_produced());
    assert!(!cleanup_handoff.public_unmount_compatibility_claimed());
    assert!(!cleanup_handoff.public_host_teardown_compatibility_claimed());
    assert!(!cleanup_handoff.act_flushing_claimed());
    assert!(!cleanup_handoff.native_bridge_available());
    assert!(!cleanup_handoff.native_execution());
    assert!(!admission.public_unmount_compatibility_claimed());
    assert!(!admission.public_host_teardown_compatibility_claimed());
    assert!(!admission.act_flushing_claimed());
    assert!(!admission.native_bridge_available());
    assert!(!admission.native_execution());
    assert_eq!(host_storage_counts(&root), (1, 1, 1));
    assert_eq!(host_node_activity_counts(&root), (0, 2));
    assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
}

#[test]
fn root_private_unmount_native_bridge_admission_rejects_stale_ref_passive_cleanup_order_count() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let outcome = root.unmount().unwrap();
    let unmounted = root
        .render_and_commit_host_output_unmount_with_ref_passive_cleanup_for_canary()
        .unwrap()
        .unwrap();
    let mut handoff = root
        .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
        .unwrap();
    assert_eq!(handoff.cleanup_order_record_count(), 4);
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
    handoff.cleanup_order_record_count = handoff.host_node_cleanup_count();
    handoff.passive_ref_cleanup_order.cleanup_order_record_count =
        handoff.host_node_cleanup_count();

    let error = root
        .describe_private_unmount_native_bridge_admission_for_canary(&outcome, Some(&handoff))
        .unwrap_err();

    let TestRendererRootError::PrivateUnmountNativeBridgeAdmission(error) = error else {
        panic!("expected private unmount native bridge cleanup order rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
            reason: "cleanup-order-count-mismatch"
        }
    ));
}

#[test]
fn root_private_unmount_route_rejects_stale_deletion_commit_handoff() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let created = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();

    root.unmount().unwrap();
    let mut unmounted = root
        .render_and_commit_host_output_unmount_for_canary()
        .unwrap()
        .unwrap();
    unmounted.commit = created.commit().clone();

    let error = root
        .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
        .unwrap_err();

    let TestRendererRootError::SerializationGate(error) = error else {
        panic!("expected serialization gate stale commit rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererSerializationGateError::CommitIsNotCurrent { root: error_root, .. }
            if *error_root == root.root_id()
    ));
}

#[test]
fn root_private_unmount_native_bridge_admission_rejects_stale_handoff() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let outcome = root.unmount().unwrap();
    let unmounted = root
        .render_and_commit_host_output_unmount_for_canary()
        .unwrap()
        .unwrap();
    let mut handoff = root
        .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
        .unwrap();
    handoff.commit_current_is_store_current = false;

    let error = root
        .describe_private_unmount_native_bridge_admission_for_canary(&outcome, Some(&handoff))
        .unwrap_err();

    let TestRendererRootError::PrivateUnmountNativeBridgeAdmission(error) = error else {
        panic!("expected private unmount native bridge admission rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
            reason: "commit-handoff-identity-mismatch"
        }
    ));
}

#[test]
fn root_private_unmount_native_bridge_admission_rejects_missing_cleanup_blockers() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let outcome = root.unmount().unwrap();
    let unmounted = root
        .render_and_commit_host_output_unmount_for_canary()
        .unwrap()
        .unwrap();
    let mut handoff = root
        .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
        .unwrap();
    handoff.host_node_cleanup_count = 0;

    let error = root
        .describe_private_unmount_native_bridge_admission_for_canary(&outcome, Some(&handoff))
        .unwrap_err();

    let TestRendererRootError::PrivateUnmountNativeBridgeAdmission(error) = error else {
        panic!("expected private unmount native bridge admission rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
            reason: "missing-host-node-cleanup-records"
        }
    ));
}

#[test]
fn root_private_unmount_passive_ref_order_rejects_native_cleanup_mismatch() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let outcome = root.unmount().unwrap();
    let unmounted = root
        .render_and_commit_host_output_unmount_for_canary()
        .unwrap()
        .unwrap();
    let mut handoff = root
        .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
        .unwrap();
    handoff
        .passive_ref_cleanup_order
        .native_cleanup_after_ref_and_passive_ordering = false;

    let error = root
        .describe_private_unmount_native_bridge_admission_for_canary(&outcome, Some(&handoff))
        .unwrap_err();

    let TestRendererRootError::PrivateUnmountNativeBridgeAdmission(error) = error else {
        panic!("expected private unmount native bridge passive/ref order rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
            reason: "passive-ref-cleanup-order-mismatch"
        }
    ));
}

#[test]
fn root_private_unmount_native_bridge_admission_rejects_already_unmounted_root() {
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
    let handoff = root
        .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
        .unwrap();
    let second_outcome = root.unmount().unwrap();

    let error = root
        .describe_private_unmount_native_bridge_admission_for_canary(
            &second_outcome,
            Some(&handoff),
        )
        .unwrap_err();

    let TestRendererRootError::PrivateUnmountNativeBridgeAdmission(error) = error else {
        panic!("expected private unmount native bridge admission rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateUnmountNativeBridgeAdmissionError::AlreadyUnmountedRoot
    ));
}

#[test]
fn root_unmount_enqueues_sync_null_update_before_wrapper_invalidation() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let current = root.store().root(root.root_id()).unwrap().current();

    let outcome = root.unmount().unwrap();
    let unmount = outcome.scheduled().unwrap();

    assert_eq!(
        root.lifecycle(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(unmount.kind(), TestRendererRootUpdateKind::Unmount);
    assert_eq!(unmount.element(), RootElementHandle::NONE);
    assert!(
        unmount
            .container_update()
            .lane()
            .to_lanes()
            .includes_sync_lane()
    );
    assert_eq!(
        root.store()
            .update_queues()
            .update(unmount.container_update().update())
            .unwrap()
            .payload()
            .unwrap()
            .element(),
        RootElementHandle::NONE
    );
    assert!(root.store().root_scheduler().might_have_pending_sync_work());
    assert_eq!(
        root.store().root(root.root_id()).unwrap().current(),
        current
    );
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn root_unmount_is_idempotent() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();

    assert!(matches!(
        root.unmount().unwrap(),
        TestRendererRootUpdateOutcome::Scheduled(_)
    ));
    let scheduled_count = root.scheduled_updates().len();
    let second = root.unmount().unwrap();

    assert_eq!(
        second,
        TestRendererRootUpdateOutcome::AlreadyUnmountScheduled
    );
    assert_eq!(root.scheduled_updates().len(), scheduled_count);
}

#[test]
fn root_update_after_unmount_does_not_mutate_or_reschedule() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    root.unmount().unwrap();
    let scheduled_count = root.scheduled_updates().len();
    let scheduled_roots = root.scheduled_roots_for_canary().unwrap();
    let queue = root
        .last_scheduled_update()
        .unwrap()
        .container_update()
        .queue();
    let pending_before = root.store().update_queues().pending_updates(queue).unwrap();

    let outcome = root.update(root_element(2)).unwrap();
    let pending_after = root.store().update_queues().pending_updates(queue).unwrap();

    assert_eq!(outcome, TestRendererRootUpdateOutcome::IgnoredAfterUnmount);
    assert_eq!(root.scheduled_updates().len(), scheduled_count);
    assert_eq!(root.scheduled_roots_for_canary().unwrap(), scheduled_roots);
    assert_eq!(pending_after, pending_before);
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
    );
}
