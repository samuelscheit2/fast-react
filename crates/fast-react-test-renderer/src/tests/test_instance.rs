use super::*;

#[test]
fn root_private_test_instance_find_all_query_diagnostics_describe_type_props_and_predicate_metadata()
 {
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

    let diagnostics = root
        .describe_private_test_instance_find_all_query_for_canary(&output)
        .unwrap();
    let type_predicate = diagnostics.type_predicate();
    let props_predicate = diagnostics.props_predicate();
    let predicate_like = diagnostics.predicate_like();

    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_ALL_DIAGNOSTIC_NAME
    );
    assert_eq!(
        diagnostics.source_tree_diagnostic_name(),
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
    );
    assert_eq!(
        diagnostics.host_output_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert!(diagnostics.host_output_snapshot_current());
    assert_eq!(
        diagnostics.traversal_source(),
        "ReactTestRenderer.js findAll(root, predicate, options)"
    );
    assert_eq!(diagnostics.traversal_order(), "self-then-descendants");
    assert!(diagnostics.default_deep());
    assert_eq!(diagnostics.candidate_fiber_tags(), &["HostComponent"]);
    assert_eq!(diagnostics.skipped_fiber_tags(), &["HostText"]);
    assert_eq!(diagnostics.candidate_count(), 1);
    assert_eq!(diagnostics.skipped_text_child_count(), 1);

    assert_eq!(
        type_predicate.predicate_kind(),
        TestRendererPrivateTestInstanceFindAllPredicateKind::Type
    );
    assert_eq!(type_predicate.predicate_kind().as_str(), "type");
    assert_eq!(
        type_predicate.source(),
        "ReactTestRenderer.js ReactTestInstance.findAllByType"
    );
    assert_eq!(
        type_predicate.predicate_source(),
        "node => node.type === type"
    );
    assert_eq!(type_predicate.expected_type().unwrap().as_str(), "span");
    assert!(type_predicate.expected_props().is_none());
    assert_eq!(type_predicate.evaluated_fiber_tags(), &["HostComponent"]);
    assert_eq!(type_predicate.matched_fiber_tags(), &["HostComponent"]);
    assert!(type_predicate.rejected_fiber_tags().is_empty());
    assert_eq!(type_predicate.evaluated_candidate_count(), 1);
    assert_eq!(type_predicate.matched_candidate_count(), 1);
    assert_eq!(type_predicate.rejected_candidate_count(), 0);
    assert_eq!(type_predicate.skipped_text_child_count(), 1);
    assert!(!type_predicate.predicate_execution());
    assert!(!type_predicate.public_query_method_available());

    assert_eq!(
        props_predicate.predicate_kind(),
        TestRendererPrivateTestInstanceFindAllPredicateKind::Props
    );
    assert_eq!(props_predicate.predicate_kind().as_str(), "props");
    assert_eq!(
        props_predicate.source(),
        "ReactTestRenderer.js ReactTestInstance.findAllByProps"
    );
    assert_eq!(
        props_predicate.predicate_source(),
        "node => node.props && propsMatch(node.props, props)"
    );
    assert!(props_predicate.expected_type().is_none());
    assert_eq!(props_predicate.expected_props().unwrap(), &TestProps::new());
    assert_eq!(props_predicate.evaluated_fiber_tags(), &["HostComponent"]);
    assert_eq!(props_predicate.matched_fiber_tags(), &["HostComponent"]);
    assert!(props_predicate.rejected_fiber_tags().is_empty());
    assert_eq!(props_predicate.skipped_text_child_count(), 1);
    assert!(!props_predicate.predicate_execution());
    assert!(!props_predicate.public_query_method_available());

    assert_eq!(
        predicate_like.predicate_kind(),
        TestRendererPrivateTestInstanceFindAllPredicateKind::PredicateLike
    );
    assert_eq!(predicate_like.predicate_kind().as_str(), "predicate-like");
    assert_eq!(
        predicate_like.source(),
        "ReactTestRenderer.js ReactTestInstance.findAll"
    );
    assert_eq!(
        predicate_like.predicate_source(),
        "metadata-only predicate matching accepted type and props diagnostics"
    );
    assert_eq!(predicate_like.expected_type().unwrap().as_str(), "span");
    assert_eq!(predicate_like.expected_props().unwrap(), &TestProps::new());
    assert_eq!(predicate_like.evaluated_fiber_tags(), &["HostComponent"]);
    assert_eq!(predicate_like.matched_fiber_tags(), &["HostComponent"]);
    assert!(predicate_like.rejected_fiber_tags().is_empty());
    assert_eq!(predicate_like.skipped_text_child_count(), 1);
    assert!(!predicate_like.predicate_execution());
    assert!(!predicate_like.public_query_method_available());

    assert!(diagnostics.public_blockers().all_blocked());
    assert!(diagnostics.public_blockers().instance_wrapper_blocked());
    assert!(!diagnostics.public_test_instance_object_available());
    assert!(!diagnostics.public_query_methods_available());
    assert!(!diagnostics.compatibility_claimed());
}

#[test]
fn root_private_test_instance_find_all_query_diagnostics_follow_update_host_output() {
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

    let diagnostics = root
        .describe_private_test_instance_find_all_query_after_update_for_canary(&updated)
        .unwrap();

    assert_eq!(
        diagnostics.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert!(diagnostics.host_output_snapshot_current());
    assert_eq!(diagnostics.candidate_fiber_tags(), &["HostComponent"]);
    assert_eq!(diagnostics.skipped_fiber_tags(), &["HostText"]);
    assert_eq!(
        diagnostics
            .type_predicate()
            .expected_type()
            .unwrap()
            .as_str(),
        "span"
    );
    assert_eq!(
        diagnostics
            .predicate_like()
            .expected_type()
            .unwrap()
            .as_str(),
        "span"
    );
    assert_eq!(
        diagnostics.props_predicate().expected_props().unwrap(),
        &TestProps::new()
    );
    assert_eq!(diagnostics.type_predicate().matched_candidate_count(), 1);
    assert_eq!(diagnostics.props_predicate().matched_candidate_count(), 1);
    assert_eq!(diagnostics.predicate_like().matched_candidate_count(), 1);
    assert!(!diagnostics.public_query_methods_available());
    assert!(!diagnostics.public_test_instance_object_available());
    assert!(!diagnostics.compatibility_claimed());
}

#[test]
fn root_private_test_instance_find_by_query_diagnostics_build_on_find_all_metadata() {
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

    let find_all = root
        .describe_private_test_instance_find_all_query_for_canary(&output)
        .unwrap();
    let diagnostics = root
        .describe_private_test_instance_find_by_query_for_canary(&output)
        .unwrap();
    let find_by_type = diagnostics.find_by_type();
    let find_by_props = diagnostics.find_by_props();

    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_BY_DIAGNOSTIC_NAME
    );
    assert_eq!(
        diagnostics.source_find_all_diagnostic_name(),
        find_all.diagnostic_name()
    );
    assert_eq!(
        diagnostics.source_tree_diagnostic_name(),
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
    );
    assert_eq!(
        diagnostics.host_output_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert!(diagnostics.host_output_snapshot_current());
    assert_eq!(
        diagnostics.source(),
        "ReactTestRenderer.js ReactTestInstance.findByType/findByProps"
    );
    assert_eq!(
        diagnostics.accepted_find_all_traversal_source(),
        find_all.traversal_source()
    );
    assert!(!diagnostics.effective_deep());
    assert!(diagnostics.expect_one());
    assert_eq!(
        diagnostics.find_all_candidate_fiber_tags(),
        find_all.candidate_fiber_tags()
    );
    assert_eq!(
        diagnostics.find_all_skipped_fiber_tags(),
        find_all.skipped_fiber_tags()
    );

    assert_eq!(
        find_by_type.query_kind(),
        TestRendererPrivateTestInstanceFindByQueryKind::Type
    );
    assert_eq!(find_by_type.query_kind().as_str(), "findByType");
    assert_eq!(find_by_type.query_kind().criteria_kind(), "type");
    assert_eq!(
        find_by_type.public_surface(),
        "ReactTestInstance.findByType"
    );
    assert_eq!(
        find_by_type.source(),
        "ReactTestRenderer.js ReactTestInstance.findByType"
    );
    assert_eq!(
        find_by_type.based_on_find_all_source(),
        find_all.type_predicate().source()
    );
    assert_eq!(
        find_by_type.based_on_predicate_kind(),
        TestRendererPrivateTestInstanceFindAllPredicateKind::Type
    );
    assert_eq!(
        find_by_type.expect_one_message(),
        "with node type: \"span\""
    );
    assert_eq!(find_by_type.expected_type().unwrap().as_str(), "span");
    assert!(find_by_type.expected_props().is_none());
    assert!(!find_by_type.effective_deep());
    assert!(find_by_type.expect_one());
    assert_eq!(find_by_type.result_kind(), "single");
    assert_eq!(find_by_type.expected_canary_match_count(), 1);
    assert_eq!(find_by_type.matched_candidate_count(), 1);
    assert_eq!(find_by_type.candidate_fiber_tags(), &["HostComponent"]);
    assert_eq!(
        find_by_type.traversed_candidate_fiber_tags(),
        find_all.type_predicate().evaluated_fiber_tags()
    );
    assert_eq!(find_by_type.skipped_fiber_tags(), &["HostText"]);
    assert_eq!(
        find_by_type.zero_match_error_prefix(),
        "No instances found "
    );
    assert_eq!(
        find_by_type.duplicate_match_error_prefix(),
        "Expected 1 but found N instances "
    );
    assert!(!find_by_type.predicate_execution());
    assert!(!find_by_type.public_query_method_available());
    assert!(!find_by_type.public_test_instance_object_available());
    assert!(!find_by_type.compatibility_claimed());

    assert_eq!(
        find_by_props.query_kind(),
        TestRendererPrivateTestInstanceFindByQueryKind::Props
    );
    assert_eq!(find_by_props.query_kind().as_str(), "findByProps");
    assert_eq!(find_by_props.query_kind().criteria_kind(), "props");
    assert_eq!(
        find_by_props.public_surface(),
        "ReactTestInstance.findByProps"
    );
    assert_eq!(
        find_by_props.source(),
        "ReactTestRenderer.js ReactTestInstance.findByProps"
    );
    assert_eq!(
        find_by_props.based_on_find_all_source(),
        find_all.props_predicate().source()
    );
    assert_eq!(
        find_by_props.based_on_predicate_kind(),
        TestRendererPrivateTestInstanceFindAllPredicateKind::Props
    );
    assert_eq!(find_by_props.expect_one_message(), "with props: {}");
    assert!(find_by_props.expected_type().is_none());
    assert_eq!(find_by_props.expected_props().unwrap(), &TestProps::new());
    assert!(!find_by_props.effective_deep());
    assert!(find_by_props.expect_one());
    assert_eq!(find_by_props.result_kind(), "single");
    assert_eq!(find_by_props.expected_canary_match_count(), 1);
    assert_eq!(find_by_props.matched_candidate_count(), 1);
    assert_eq!(find_by_props.candidate_fiber_tags(), &["HostComponent"]);
    assert_eq!(
        find_by_props.traversed_candidate_fiber_tags(),
        find_all.props_predicate().evaluated_fiber_tags()
    );
    assert_eq!(find_by_props.skipped_fiber_tags(), &["HostText"]);
    assert_eq!(
        find_by_props.zero_match_error_prefix(),
        "No instances found "
    );
    assert_eq!(
        find_by_props.duplicate_match_error_prefix(),
        "Expected 1 but found N instances "
    );
    assert!(!find_by_props.predicate_execution());
    assert!(!find_by_props.public_query_method_available());
    assert!(!find_by_props.public_test_instance_object_available());
    assert!(!find_by_props.compatibility_claimed());

    assert!(diagnostics.public_blockers().all_blocked());
    assert!(diagnostics.public_blockers().instance_wrapper_blocked());
    assert!(!diagnostics.public_test_instance_object_available());
    assert!(!diagnostics.public_query_methods_available());
    assert!(!diagnostics.compatibility_claimed());
}

#[test]
fn root_private_test_instance_find_by_query_diagnostics_follow_update_host_output() {
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

    let find_all = root
        .describe_private_test_instance_find_all_query_after_update_for_canary(&updated)
        .unwrap();
    let diagnostics = root
        .describe_private_test_instance_find_by_query_after_update_for_canary(&updated)
        .unwrap();

    assert_eq!(
        diagnostics.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert!(diagnostics.host_output_snapshot_current());
    assert_eq!(
        diagnostics.source_find_all_diagnostic_name(),
        find_all.diagnostic_name()
    );
    assert_eq!(
        diagnostics.find_all_candidate_fiber_tags(),
        find_all.candidate_fiber_tags()
    );
    assert_eq!(
        diagnostics.find_all_skipped_fiber_tags(),
        find_all.skipped_fiber_tags()
    );
    assert_eq!(
        diagnostics.find_by_type().expected_type().unwrap().as_str(),
        "span"
    );
    assert_eq!(
        diagnostics.find_by_props().expected_props().unwrap(),
        &TestProps::new()
    );
    assert_eq!(diagnostics.find_by_type().matched_candidate_count(), 1);
    assert_eq!(diagnostics.find_by_props().matched_candidate_count(), 1);
    assert!(!diagnostics.public_query_methods_available());
    assert!(!diagnostics.public_test_instance_object_available());
    assert!(!diagnostics.compatibility_claimed());
}

#[test]
fn root_private_test_instance_query_bridge_preflight_ties_find_all_and_find_by_records() {
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

    let find_all = root
        .describe_private_test_instance_find_all_query_for_canary(&output)
        .unwrap();
    let find_by = root
        .describe_private_test_instance_find_by_query_for_canary(&output)
        .unwrap();
    let preflight = root
        .describe_private_test_instance_query_bridge_preflight_for_canary(&output)
        .unwrap();

    assert_eq!(
        preflight.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TEST_INSTANCE_QUERY_BRIDGE_PREFLIGHT_DIAGNOSTIC_NAME
    );
    assert_eq!(
        preflight.source_find_all_diagnostic_name(),
        find_all.diagnostic_name()
    );
    assert_eq!(
        preflight.source_find_by_diagnostic_name(),
        find_by.diagnostic_name()
    );
    assert_eq!(
        preflight.bridge_status(),
        "private-test-instance-query-bridge-preflight-ready-public-test-instance-blocked"
    );
    assert_eq!(
        preflight.bridge_source(),
        "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.testInstanceQuery"
    );
    assert_eq!(
        preflight.wrapper_record_symbol(),
        "fast.react_test_renderer.private_test_instance_wrapper_record"
    );
    assert_eq!(
        preflight.host_output_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert!(preflight.host_output_snapshot_current());
    assert_eq!(
        preflight.accepted_find_all_traversal_source(),
        find_all.traversal_source()
    );
    assert_eq!(preflight.accepted_find_by_source(), find_by.source());
    assert_eq!(
        preflight.find_all_candidate_fiber_tags(),
        find_all.candidate_fiber_tags()
    );
    assert_eq!(
        preflight.find_all_skipped_fiber_tags(),
        find_all.skipped_fiber_tags()
    );
    assert_eq!(preflight.find_by_queries(), &["findByType", "findByProps"]);
    assert!(preflight.consumes_accepted_find_all_diagnostics());
    assert!(preflight.consumes_accepted_find_by_diagnostics());
    assert!(preflight.record_only_diagnostic_consumption());
    assert!(!preflight.native_bridge_available());
    assert!(!preflight.native_execution());
    assert!(!preflight.rust_execution_from_js());
    assert!(preflight.public_blockers().all_blocked());
    assert!(!preflight.public_root_available());
    assert!(!preflight.public_test_instance_object_available());
    assert!(!preflight.public_query_methods_available());
    assert!(!preflight.compatibility_claimed());
}

#[test]
fn root_private_test_instance_query_bridge_preflight_follows_update_records() {
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

    let find_all = root
        .describe_private_test_instance_find_all_query_after_update_for_canary(&updated)
        .unwrap();
    let find_by = root
        .describe_private_test_instance_find_by_query_after_update_for_canary(&updated)
        .unwrap();
    let preflight = root
        .describe_private_test_instance_query_bridge_preflight_after_update_for_canary(&updated)
        .unwrap();

    assert_eq!(
        preflight.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert!(preflight.host_output_snapshot_current());
    assert_eq!(
        preflight.source_find_all_diagnostic_name(),
        find_all.diagnostic_name()
    );
    assert_eq!(
        preflight.source_find_by_diagnostic_name(),
        find_by.diagnostic_name()
    );
    assert_eq!(
        preflight.find_all_candidate_fiber_tags(),
        find_all.candidate_fiber_tags()
    );
    assert_eq!(
        preflight.find_all_skipped_fiber_tags(),
        find_all.skipped_fiber_tags()
    );
    assert_eq!(preflight.find_by_queries(), &["findByType", "findByProps"]);
    assert!(preflight.record_only_diagnostic_consumption());
    assert!(!preflight.rust_execution_from_js());
    assert!(!preflight.public_root_available());
    assert!(!preflight.public_query_methods_available());
    assert!(!preflight.compatibility_claimed());
}

#[test]
fn root_private_test_instance_native_query_execution_consumes_create_and_update_records() {
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
    let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        output.render().resulting_element(),
        "span",
    );
    let preflight = root
        .describe_private_root_create_preflight_from_render_for_canary(
            input,
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
            output.render(),
        )
        .unwrap();
    let admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
        Some(preflight),
        Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
    )
    .unwrap();
    let create_handoff = root
        .describe_private_create_native_bridge_host_output_handoff_for_canary(&admission, &output)
        .unwrap();

    let create_evidence = root
        .describe_private_test_instance_query_after_create_native_execution_for_canary(
            &output,
            create_handoff,
        )
        .unwrap();

    assert_eq!(
        create_evidence.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        create_evidence.status(),
        TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_STATUS
    );
    assert_eq!(create_evidence.root(), root.root_id());
    assert_eq!(create_evidence.operation(), "create");
    assert_eq!(
        create_evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID
    );
    assert_eq!(
        create_evidence.source_execution_status(),
        TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS
    );
    assert_eq!(
        create_evidence.source_query_diagnostic_name(),
        TEST_RENDERER_PRIVATE_TEST_INSTANCE_QUERY_BRIDGE_PREFLIGHT_DIAGNOSTIC_NAME
    );
    assert_eq!(
        create_evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert_eq!(
        create_evidence.query_surface(),
        "ReactTestInstance.findByType"
    );
    assert_eq!(
        create_evidence.query_kind(),
        TestRendererPrivateTestInstanceFindByQueryKind::Type
    );
    assert_eq!(create_evidence.expected_type().as_str(), "span");
    assert_eq!(create_evidence.result_fiber_tag(), "HostComponent");
    assert_eq!(create_evidence.result_kind(), "single");
    assert_eq!(create_evidence.matched_candidate_count(), 1);
    assert_eq!(create_evidence.query_path_candidate_count(), 1);
    assert_eq!(create_evidence.skipped_text_child_count(), 1);
    assert!(create_evidence.host_output_snapshot_current());
    assert!(create_evidence.consumes_accepted_native_create_execution_record());
    assert!(!create_evidence.consumes_accepted_native_update_execution_record());
    assert!(create_evidence.consumes_private_test_instance_query_diagnostics());
    assert!(create_evidence.consumes_query_bridge_preflight());
    assert!(create_evidence.consumes_accepted_find_all_diagnostics());
    assert!(create_evidence.consumes_accepted_find_by_diagnostics());
    assert!(create_evidence.minimal_host_component_query_path());
    assert!(!create_evidence.public_root_available());
    assert!(!create_evidence.public_query_methods_available());
    assert!(!create_evidence.public_test_instance_object_available());
    assert!(!create_evidence.native_bridge_available());
    assert!(!create_evidence.native_execution_available());
    assert!(!create_evidence.compatibility_claimed());

    let (_route, updated, update_admission) = root
        .render_and_admit_private_update_native_bridge_handoff_for_canary(
            "span",
            TestProps::new(),
            "goodbye",
        )
        .unwrap();
    let update_evidence = root
        .describe_private_test_instance_query_after_update_native_execution_for_canary(
            &updated,
            update_admission,
        )
        .unwrap();

    assert_eq!(update_evidence.operation(), "update");
    assert_eq!(
        update_evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        update_evidence.source_execution_status(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
    );
    assert_eq!(
        update_evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(update_evidence.expected_type().as_str(), "span");
    assert!(!update_evidence.consumes_accepted_native_create_execution_record());
    assert!(update_evidence.consumes_accepted_native_update_execution_record());
    assert!(update_evidence.consumes_private_test_instance_query_diagnostics());
    assert!(update_evidence.minimal_host_component_query_path());
    assert!(!update_evidence.public_root_available());
    assert!(!update_evidence.public_query_methods_available());
    assert!(!update_evidence.public_test_instance_object_available());
    assert!(!update_evidence.native_execution_available());
    assert!(!update_evidence.compatibility_claimed());
}

#[test]
fn root_private_test_instance_class_query_execution_consumes_update_record_and_updated_child() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let (_route, updated, update_admission) = root
        .render_and_admit_private_update_native_bridge_handoff_for_canary(
            "span",
            TestProps::new(),
            "goodbye",
        )
        .unwrap();

    let evidence = root
        .describe_private_test_instance_class_root_query_after_update_native_execution_for_canary(
            &updated,
            update_admission,
        )
        .unwrap();

    assert_eq!(
        evidence.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        evidence.status(),
        TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_STATUS
    );
    assert_eq!(evidence.root(), root.root_id());
    assert_eq!(evidence.operation(), "update");
    assert_eq!(
        evidence.public_surface(),
        "create().update -> create().root/ReactTestInstance.findByType"
    );
    assert_eq!(
        evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        evidence.source_execution_status(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
    );
    assert_eq!(
        evidence.source_query_diagnostic_name(),
        TEST_RENDERER_PRIVATE_TEST_INSTANCE_QUERY_BRIDGE_PREFLIGHT_DIAGNOSTIC_NAME
    );
    assert_eq!(
        evidence.source_get_instance_diagnostic_name(),
        TEST_RENDERER_PRIVATE_GET_INSTANCE_DIAGNOSTIC_NAME
    );
    assert_eq!(
        evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert!(evidence.host_output_snapshot_current());
    assert_eq!(
        evidence.accepted_class_fiber_shape(),
        &TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE
    );
    assert_eq!(evidence.root_query_surface(), "create().root");
    assert_eq!(evidence.root_result_fiber_tag(), "ClassComponent");
    assert_eq!(
        evidence.root_component_type(),
        TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE
    );
    assert_eq!(
        evidence.root_props(),
        &TestProps::new().with_attribute("label", "class-root")
    );
    assert_eq!(evidence.root_child_count(), 1);
    assert_eq!(
        evidence.child_query_surface(),
        "ReactTestInstance.findByType"
    );
    assert_eq!(
        evidence.child_query_kind(),
        TestRendererPrivateTestInstanceFindByQueryKind::Type
    );
    assert_eq!(evidence.child_fiber_tag(), "HostComponent");
    assert_eq!(evidence.child_element_type().as_str(), "span");
    assert_eq!(evidence.child_props(), &TestProps::new());
    assert_eq!(evidence.previous_child_text(), "hello");
    assert_eq!(evidence.current_child_text(), "goodbye");
    assert!(evidence.host_child_updated());
    assert_eq!(
        evidence.class_root_query_path(),
        &["ClassComponent", "HostComponent"]
    );
    assert_eq!(
        evidence.updated_host_child_query_path(),
        &["ClassComponent", "HostComponent", "HostText"]
    );
    assert!(evidence.consumes_accepted_native_update_execution_record());
    assert!(evidence.consumes_private_test_instance_query_diagnostics());
    assert!(evidence.consumes_query_bridge_preflight());
    assert!(evidence.consumes_private_get_instance_class_root_diagnostics());
    assert!(!evidence.public_root_available());
    assert!(!evidence.public_query_methods_available());
    assert!(!evidence.public_test_instance_object_available());
    assert!(!evidence.public_get_instance_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(!evidence.compatibility_claimed());
}

#[test]
fn root_private_test_instance_class_query_execution_rejects_stale_updated_child() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let (_route, updated, _update_admission) = root
        .render_and_admit_private_update_native_bridge_handoff_for_canary(
            "span",
            TestProps::new(),
            "goodbye",
        )
        .unwrap();
    let preflight = root
        .describe_private_test_instance_query_bridge_preflight_after_update_for_canary(&updated)
        .unwrap();
    let find_by = root
        .describe_private_test_instance_find_by_query_after_update_for_canary(&updated)
        .unwrap();
    let mut class_root = root
        .describe_private_get_instance_class_root_after_update_for_canary(&updated)
        .unwrap();
    class_root.rendered_host_component.rendered_text = "hello".to_owned();
    class_root.rendered_host_text.text = "hello".to_owned();

    let error = root
        .private_test_instance_class_root_query_execution_evidence_from_reports(
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS,
            "hello".to_owned(),
            &preflight,
            &find_by,
            &class_root,
        )
        .unwrap_err();
    let TestRendererRootError::PrivateTestInstanceNativeQueryExecution(error) = error else {
        panic!("expected private TestInstance class query execution rejection");
    };

    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
            operation: "update",
            reason: "class-root-updated-host-child-query-path-missing",
        }
    ));
}

#[test]
fn root_private_test_instance_native_query_execution_rejects_public_testinstance_claim() {
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
    let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        output.render().resulting_element(),
        "span",
    );
    let preflight = root
        .describe_private_root_create_preflight_from_render_for_canary(
            input,
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
            output.render(),
        )
        .unwrap();
    let admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
        Some(preflight),
        Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
    )
    .unwrap();
    let mut create_handoff = root
        .describe_private_create_native_bridge_host_output_handoff_for_canary(&admission, &output)
        .unwrap();
    create_handoff.public_test_instance_available = true;

    let error = root
        .describe_private_test_instance_query_after_create_native_execution_for_canary(
            &output,
            create_handoff,
        )
        .unwrap_err();
    let TestRendererRootError::PrivateTestInstanceNativeQueryExecution(error) = error else {
        panic!("expected private TestInstance native query execution rejection");
    };

    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
            operation: "create",
            reason: "public-or-native-compatibility-claim",
        }
    ));
}

#[test]
fn root_private_get_instance_class_root_canary_describes_class_instance_shape() {
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
        .describe_private_get_instance_class_root_for_canary(&output)
        .unwrap();
    let host_root = report.host_root_fail_closed();
    let function_root = report.function_root_fail_closed();
    let class_component = report.class_component();
    let instance = class_component.instance();

    assert_eq!(
        report.diagnostic_name(),
        TEST_RENDERER_PRIVATE_GET_INSTANCE_DIAGNOSTIC_NAME
    );
    assert_eq!(
        report.source_tree_diagnostic_name(),
        TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
    );
    assert_eq!(
        report.host_output_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert!(report.host_output_snapshot_current());
    assert_eq!(
        report.gate().status(),
        TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
    );
    assert_eq!(
        report.accepted_class_fiber_shape(),
        &TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE
    );
    assert_eq!(
        host_root.root_fiber_shape(),
        &TEST_RENDERER_PRIVATE_GET_INSTANCE_HOST_ROOT_FIBER_SHAPE
    );
    assert_eq!(host_root.root_child_fiber_tag(), "HostComponent");
    assert_eq!(
        host_root.react_public_result(),
        "null-with-default-createNodeMock"
    );
    assert!(host_root.public_behavior_fail_closed());
    assert!(!host_root.public_get_instance_available());
    assert!(!host_root.private_class_instance_available());
    assert_eq!(
        function_root.root_fiber_shape(),
        &TEST_RENDERER_PRIVATE_GET_INSTANCE_FUNCTION_ROOT_FIBER_SHAPE
    );
    assert_eq!(function_root.root_child_fiber_tag(), "FunctionComponent");
    assert_eq!(function_root.react_public_result(), "null");
    assert!(function_root.public_behavior_fail_closed());
    assert!(!function_root.public_get_instance_available());
    assert!(!function_root.private_class_instance_available());
    assert_eq!(class_component.fiber_tag(), "ClassComponent");
    assert_eq!(
        class_component.component_type(),
        TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE
    );
    assert_eq!(
        class_component.props(),
        &TestProps::new().with_attribute("label", "class-root")
    );
    assert!(class_component.state_node_available());
    assert_eq!(class_component.rendered_child_fiber_tag(), "HostComponent");
    assert_eq!(class_component.rendered_child_count(), 1);
    assert!(!class_component.public_get_instance_available());
    assert_eq!(
        instance.constructor_name(),
        TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_CONSTRUCTOR_NAME
    );
    assert_eq!(
        instance.props(),
        &TestProps::new().with_attribute("label", "class-root")
    );
    assert_eq!(
        instance.state_marker(),
        TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_STATE_MARKER
    );
    assert!(instance.private_instance_available());
    assert!(!instance.public_get_instance_available());
    assert_eq!(instance.react_public_result(), "class-instance");
    assert_eq!(
        report.rendered_host_component().element_type().as_str(),
        "span"
    );
    assert_eq!(report.rendered_host_component().rendered_text(), "hello");
    assert_eq!(report.rendered_host_text().text(), "hello");
    assert!(report.public_blockers().all_blocked());
    assert!(!report.public_get_instance_available());
    assert!(!report.native_bridge_available());
    assert!(!report.compatibility_claimed());
}

#[test]
fn root_private_get_instance_class_root_canary_updates_rendered_host_child_only() {
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
        .describe_private_get_instance_class_root_after_update_for_canary(&updated)
        .unwrap();

    assert_eq!(
        report.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        report.accepted_class_fiber_shape(),
        &TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE
    );
    assert_eq!(
        report.class_component().component_type(),
        TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE
    );
    assert_eq!(
        report.class_component().instance().constructor_name(),
        TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_CONSTRUCTOR_NAME
    );
    assert_eq!(report.rendered_host_component().rendered_text(), "goodbye");
    assert_eq!(report.rendered_host_text().text(), "goodbye");
    assert!(
        !report
            .host_root_fail_closed()
            .public_get_instance_available()
    );
    assert!(
        report
            .function_root_fail_closed()
            .public_behavior_fail_closed()
    );
    assert!(!report.public_get_instance_available());
    assert!(!report.compatibility_claimed());
}
