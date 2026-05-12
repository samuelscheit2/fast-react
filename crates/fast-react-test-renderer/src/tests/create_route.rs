use super::*;

use std::sync::{
    Arc,
    atomic::{AtomicUsize, Ordering},
};

#[test]
fn root_private_create_preflight_validates_create_canary_without_public_root() {
    let invocation_count = Arc::new(AtomicUsize::new(0));
    let invocation_count_for_mock = Arc::clone(&invocation_count);
    let options = TestRendererOptions::new()
        .with_strict_mode(true)
        .with_create_node_mock(TestCreateNodeMock::new(move || {
            invocation_count_for_mock.fetch_add(1, Ordering::SeqCst);
        }))
        .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(611))
        .with_on_caught_error(RootErrorCallbackHandle::from_raw(612))
        .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(613));
    let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        root_element(91),
        "div",
    );

    let diagnostics = TestRendererRoot::describe_private_root_create_preflight_for_canary(
        input,
        Some(options),
        TestRendererRootCreatePreflightCanaryApiIdentity::current(),
        Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
    )
    .unwrap();

    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME
    );
    assert_eq!(
        diagnostics.status(),
        TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS
    );
    assert_eq!(diagnostics.input_shape(), input);
    assert_eq!(diagnostics.input_shape().root_node_kind(), "HostComponent");
    assert_eq!(diagnostics.input_shape().element_type(), "div");
    assert_eq!(
        diagnostics.input_shape().child_shape(),
        TestRendererRootCreatePreflightChildShape::Text
    );
    assert_eq!(
        diagnostics.scheduled_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert_eq!(diagnostics.scheduled_element(), root_element(91));
    assert_eq!(diagnostics.container_update_api(), "update_container");
    assert_eq!(diagnostics.scheduler_api(), "ensure_root_is_scheduled");
    let work_loop_preflight = diagnostics.work_loop_finished_work_preflight();
    assert_eq!(
        work_loop_preflight.row_id(),
        TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_ROW_ID
    );
    assert_eq!(
        work_loop_preflight.status(),
        TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_STATUS
    );
    assert_eq!(
        work_loop_preflight.metadata(),
        TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()
    );
    assert_eq!(work_loop_preflight.root(), diagnostics.root());
    assert_eq!(
        work_loop_preflight.resulting_element(),
        diagnostics.scheduled_element()
    );
    assert_eq!(
        work_loop_preflight.scheduled_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert!(!work_loop_preflight.render_lanes_empty());
    assert_ne!(work_loop_preflight.render_lanes_bits(), 0);
    assert!(work_loop_preflight.remaining_lanes_empty());
    assert_eq!(work_loop_preflight.remaining_lanes_bits(), 0);
    assert!(work_loop_preflight.finished_work_matches_render_phase());
    assert!(work_loop_preflight.records_accepted_finished_work_metadata());
    assert_ne!(
        work_loop_preflight.previous_current(),
        work_loop_preflight.finished_work()
    );
    assert!(!work_loop_preflight.public_create_behavior_available());
    assert!(work_loop_preflight.host_mutation_execution_blocked());
    assert!(work_loop_preflight.effects_refs_and_hydration_blocked());
    assert!(!work_loop_preflight.compatibility_claimed());

    let api_identity = diagnostics.canary_api_identity();
    assert_eq!(
        api_identity.metadata_id(),
        TEST_RENDERER_CURRENT_ROOT_CANARY_METADATA_ID
    );
    assert_eq!(api_identity.operation(), "create");
    assert_eq!(api_identity.root_api(), "TestRendererRoot::create");
    assert_eq!(
        api_identity.preflight_api(),
        "TestRendererRoot::describe_private_root_create_preflight_for_canary"
    );
    assert_eq!(api_identity.root_options_type(), "RootOptions");
    assert_eq!(
        api_identity.test_renderer_options_type(),
        "TestRendererOptions"
    );

    let root_options = diagnostics.root_options();
    assert_eq!(root_options.options_type(), "TestRendererOptions");
    assert!(root_options.strict_mode());
    assert!(root_options.has_create_node_mock());
    assert!(root_options.root_options_metadata_available());
    assert!(!root_options.create_node_mock_invoked());
    assert_eq!(
        root_options.root_error_options().on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(611)
    );
    assert_eq!(
        root_options.root_error_options().on_caught_error(),
        RootErrorCallbackHandle::from_raw(612)
    );
    assert_eq!(
        root_options.root_error_options().on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(613)
    );
    assert!(!root_options.public_root_error_callbacks_invoked());

    assert!(diagnostics.private_rust_root_created());
    assert!(diagnostics.private_root_canary_boundary_validated());
    assert!(!diagnostics.public_renderer_root_created());
    assert!(!diagnostics.public_root_available());
    assert!(!diagnostics.native_addon_loaded());
    assert!(!diagnostics.native_bridge_available());
    assert!(!diagnostics.native_execution());
    assert!(!diagnostics.rust_execution_from_js());
    assert!(!diagnostics.host_output_produced_from_js());
    assert!(!diagnostics.compatibility_claimed());
    assert_eq!(invocation_count.load(Ordering::SeqCst), 0);
}

#[test]
fn root_private_create_preflight_fails_closed_for_unsupported_children() {
    let input = TestRendererRootCreatePreflightInputShape::host_component_with_unsupported_children(
        root_element(92),
        "div",
    );

    let error = TestRendererRoot::describe_private_root_create_preflight_for_canary(
        input,
        Some(TestRendererOptions::new()),
        TestRendererRootCreatePreflightCanaryApiIdentity::current(),
        Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
    )
    .unwrap_err();

    let TestRendererRootError::RootCreatePreflight(error) = error else {
        panic!("expected root-create preflight error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererRootCreatePreflightError::UnsupportedChildren {
            child_shape: TestRendererRootCreatePreflightChildShape::Unsupported
        }
    ));
}

#[test]
fn root_private_create_preflight_fails_closed_for_stale_canary_metadata() {
    let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        root_element(93),
        "div",
    );
    let stale_identity = TestRendererRootCreatePreflightCanaryApiIdentity::new_for_canary(
        "fast-react-test-renderer-stale-root-canary-metadata",
        "private-root-execution-bridge-current-rust-canary-metadata",
        "TestRendererRoot::create_legacy",
    );

    let error = TestRendererRoot::describe_private_root_create_preflight_for_canary(
        input,
        Some(TestRendererOptions::new()),
        stale_identity,
        Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
    )
    .unwrap_err();

    let TestRendererRootError::RootCreatePreflight(error) = error else {
        panic!("expected root-create preflight error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererRootCreatePreflightError::StaleCanaryMetadata {
            expected_metadata_id: TEST_RENDERER_CURRENT_ROOT_CANARY_METADATA_ID,
            actual_metadata_id: "fast-react-test-renderer-stale-root-canary-metadata",
            expected_root_api: "TestRendererRoot::create",
            actual_root_api: "TestRendererRoot::create_legacy"
        }
    ));
}

#[test]
fn root_private_create_preflight_fails_closed_without_root_options() {
    let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        root_element(94),
        "div",
    );

    let error = TestRendererRoot::describe_private_root_create_preflight_for_canary(
        input,
        None,
        TestRendererRootCreatePreflightCanaryApiIdentity::current(),
        Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
    )
    .unwrap_err();

    let TestRendererRootError::RootCreatePreflight(error) = error else {
        panic!("expected root-create preflight error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererRootCreatePreflightError::MissingRootOptions
    ));
}

#[test]
fn root_private_create_preflight_fails_closed_without_work_loop_metadata() {
    let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        root_element(95),
        "div",
    );

    let error = TestRendererRoot::describe_private_root_create_preflight_for_canary(
        input,
        Some(TestRendererOptions::new()),
        TestRendererRootCreatePreflightCanaryApiIdentity::current(),
        None,
    )
    .unwrap_err();

    let TestRendererRootError::RootCreatePreflight(error) = error else {
        panic!("expected root-create preflight error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererRootCreatePreflightError::MissingWorkLoopFinishedWorkPreflightMetadata
    ));
}

#[test]
fn root_private_create_preflight_fails_closed_for_stale_work_loop_metadata() {
    let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        root_element(96),
        "div",
    );
    let stale_metadata = TestRendererRootWorkLoopFinishedWorkPreflightMetadata::new_for_canary(
        "fast-react-test-renderer-stale-work-loop-preflight-metadata",
        TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS,
        "TestRendererRoot::render_stale_host_root_for_commit_handoff",
    );

    let error = TestRendererRoot::describe_private_root_create_preflight_for_canary(
        input,
        Some(TestRendererOptions::new()),
        TestRendererRootCreatePreflightCanaryApiIdentity::current(),
        Some(stale_metadata),
    )
    .unwrap_err();

    let TestRendererRootError::RootCreatePreflight(error) = error else {
        panic!("expected root-create preflight error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererRootCreatePreflightError::StaleWorkLoopFinishedWorkPreflightMetadata {
            expected_metadata_id: TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_ID,
            actual_metadata_id: "fast-react-test-renderer-stale-work-loop-preflight-metadata",
            expected_render_phase_api: "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff",
            actual_render_phase_api: "TestRendererRoot::render_stale_host_root_for_commit_handoff"
        }
    ));
}

#[test]
fn root_private_create_route_admission_consumes_create_and_work_loop_evidence() {
    let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        root_element(97),
        "div",
    );
    let preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
        input,
        Some(TestRendererOptions::new()),
        TestRendererRootCreatePreflightCanaryApiIdentity::current(),
        Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
    )
    .unwrap();

    let admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
        Some(preflight),
        Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
    )
    .unwrap();

    assert_eq!(
        admission.record_id(),
        TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID
    );
    assert_eq!(
        admission.diagnostic_name(),
        TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        admission.status(),
        TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS
    );
    assert_eq!(admission.root(), preflight.root());
    assert_eq!(admission.operation(), "create");
    assert_eq!(admission.public_surface(), "create()");
    assert_eq!(
        admission.js_facade_metadata_source(),
        "FastReactTestRendererPrivateRootRequestRecord"
    );
    assert_eq!(
        admission.rust_admission_metadata(),
        TestRendererPrivateCreateRouteAdmissionMetadata::current()
    );
    assert_eq!(admission.root_create_preflight(), preflight);
    assert_eq!(
        admission.work_loop_finished_work_preflight(),
        preflight.work_loop_finished_work_preflight()
    );
    assert_eq!(
        admission.scheduled_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert_eq!(admission.scheduled_element(), root_element(97));
    assert_eq!(admission.rust_outcome(), "Scheduled");
    assert!(admission.consumes_js_facade_create_metadata());
    assert!(admission.consumes_accepted_rust_root_create_execution_evidence());
    assert!(admission.consumes_accepted_rust_root_create_preflight_diagnostics());
    assert!(admission.consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata());
    assert!(admission.missing_rust_admission_record_rejection());
    assert!(admission.stale_rust_admission_record_rejection());
    assert!(!admission.public_renderer_root_created());
    assert!(!admission.public_root_available());
    assert!(!admission.public_create_behavior_available());
    assert!(!admission.public_serialization_available());
    assert!(!admission.native_addon_loaded());
    assert!(!admission.native_bridge_available());
    assert!(!admission.native_execution());
    assert!(!admission.rust_execution_from_js());
    assert!(!admission.reconciler_execution_from_js());
    assert!(!admission.host_output_produced_from_js());
    assert!(!admission.compatibility_claimed());
}

#[test]
fn root_private_create_native_bridge_handoff_consumes_actual_host_output() {
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

    let handoff = root
        .describe_private_create_native_bridge_host_output_handoff_for_canary(&admission, &output)
        .unwrap();
    let host_output = handoff.host_output();

    assert_eq!(
        handoff.diagnostic_id(),
        TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID
    );
    assert_eq!(
        handoff.status(),
        TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS
    );
    assert_eq!(handoff.root(), root.root_id());
    assert_eq!(handoff.operation(), "create");
    assert_eq!(handoff.public_surface(), "create()");
    assert_eq!(
        handoff.create_route_admission_record_id(),
        TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID
    );
    assert_eq!(
        handoff.create_route_admission_status(),
        TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS
    );
    assert_eq!(
        handoff.scheduled_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert_eq!(
        handoff.scheduled_element(),
        output.render().resulting_element()
    );
    assert_eq!(
        handoff.host_output_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert_eq!(
        handoff.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SingleHostText
    );
    assert_eq!(
        handoff.serialization_gate_status(),
        TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
    );
    assert_eq!(host_output.container_child_count(), 1);
    assert_eq!(host_output.instance_count(), 1);
    assert_eq!(host_output.text_count(), 1);
    assert!(host_output.real_host_output_available());
    assert_eq!(
        handoff.render_finished_work().slot(),
        output.render().finished_work().slot().get()
    );
    assert_eq!(
        handoff.commit_current().slot(),
        output.commit().current().slot().get()
    );
    assert_eq!(
        handoff.work_loop_finished_work_preflight(),
        admission.work_loop_finished_work_preflight()
    );
    assert_ne!(handoff.render_lanes_bits(), 0);
    assert_eq!(
        handoff.render_lanes_bits(),
        admission
            .work_loop_finished_work_preflight()
            .render_lanes_bits()
    );
    assert_eq!(
        handoff.commit_finished_lanes_bits(),
        handoff.render_lanes_bits()
    );
    assert_eq!(handoff.commit_remaining_lanes_bits(), 0);
    assert_eq!(handoff.commit_pending_lanes_bits(), 0);
    assert!(handoff.render_finished_work_matches_create_route_preflight());
    assert!(handoff.commit_current_matches_render_finished_work());
    assert!(handoff.commit_lanes_match_render_lanes());
    assert!(handoff.minimal_tree_host_output_consumes_root_finished_work());
    assert!(handoff.minimal_tree_host_output_consumes_root_finished_lanes());
    assert!(handoff.create_route_admission_accepted());
    assert!(handoff.host_output_handoff_accepted());
    assert!(handoff.actual_rust_create_host_output_handoff());
    assert!(handoff.host_output_produced_by_rust());
    assert!(!handoff.public_create_behavior_available());
    assert!(!handoff.public_serialization_available());
    assert!(!handoff.public_test_instance_available());
    assert!(!handoff.native_addon_loaded());
    assert!(!handoff.native_bridge_available());
    assert!(!handoff.native_execution());
    assert!(!handoff.rust_execution_from_js());
    assert!(!handoff.host_output_produced_from_js());
    assert!(!handoff.compatibility_claimed());
}

#[test]
fn root_private_create_native_bridge_handoff_rejects_stale_admission() {
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
    let stale_input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        root_element(2),
        "span",
    );
    let preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
        stale_input,
        Some(TestRendererOptions::new()),
        TestRendererRootCreatePreflightCanaryApiIdentity::current(),
        Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
    )
    .unwrap();
    let admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
        Some(preflight),
        Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
    )
    .unwrap();

    let error = root
        .describe_private_create_native_bridge_host_output_handoff_for_canary(&admission, &output)
        .unwrap_err();

    let TestRendererRootError::PrivateCreateRouteAdmission(error) = error else {
        panic!("expected create-route admission error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
            reason: "scheduled-element-mismatch"
        }
    ));
}

#[test]
fn root_private_create_native_bridge_handoff_rejects_mismatched_finished_work_preflight() {
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
    let mut admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
        Some(preflight),
        Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
    )
    .unwrap();
    admission.work_loop_finished_work_preflight.finished_work = admission
        .work_loop_finished_work_preflight
        .previous_current();

    let error = root
        .describe_private_create_native_bridge_host_output_handoff_for_canary(&admission, &output)
        .unwrap_err();

    let TestRendererRootError::PrivateCreateRouteAdmission(error) = error else {
        panic!("expected create-route admission error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
            reason: "create-route-admission-finished-work-mismatch"
        }
    ));
}

#[test]
fn root_private_create_native_bridge_handoff_rejects_mismatched_finished_lanes_preflight() {
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
    let mut admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
        Some(preflight),
        Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
    )
    .unwrap();
    admission
        .work_loop_finished_work_preflight
        .render_lanes_bits += 1;

    let error = root
        .describe_private_create_native_bridge_host_output_handoff_for_canary(&admission, &output)
        .unwrap_err();

    let TestRendererRootError::PrivateCreateRouteAdmission(error) = error else {
        panic!("expected create-route admission error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
            reason: "create-route-admission-finished-lanes-mismatch"
        }
    ));
}

#[test]
fn root_private_create_route_admission_rejects_missing_rust_admission_record() {
    let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        root_element(98),
        "div",
    );
    let preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
        input,
        Some(TestRendererOptions::new()),
        TestRendererRootCreatePreflightCanaryApiIdentity::current(),
        Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
    )
    .unwrap();

    let error =
        TestRendererRoot::describe_private_create_route_admission_for_canary(Some(preflight), None)
            .unwrap_err();

    let TestRendererRootError::PrivateCreateRouteAdmission(error) = error else {
        panic!("expected create-route admission error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateCreateRouteAdmissionError::MissingRustAdmissionRecord
    ));
}

#[test]
fn root_private_create_route_admission_rejects_stale_rust_admission_record() {
    let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        root_element(99),
        "div",
    );
    let preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
        input,
        Some(TestRendererOptions::new()),
        TestRendererRootCreatePreflightCanaryApiIdentity::current(),
        Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
    )
    .unwrap();
    let stale_admission_metadata = TestRendererPrivateCreateRouteAdmissionMetadata::new_for_canary(
        "fast-react-test-renderer-stale-create-route-admission-metadata",
        TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_STATUS,
        "TestRendererRoot::create_legacy",
    );

    let error = TestRendererRoot::describe_private_create_route_admission_for_canary(
        Some(preflight),
        Some(stale_admission_metadata),
    )
    .unwrap_err();

    let TestRendererRootError::PrivateCreateRouteAdmission(error) = error else {
        panic!("expected create-route admission error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateCreateRouteAdmissionError::StaleRustAdmissionRecord {
            expected_metadata_id: TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_ID,
            actual_metadata_id: "fast-react-test-renderer-stale-create-route-admission-metadata",
            expected_root_api: "TestRendererRoot::create",
            actual_root_api: "TestRendererRoot::create_legacy"
        }
    ));
}

#[test]
fn root_private_create_route_admission_rejects_missing_root_create_preflight() {
    let error = TestRendererRoot::describe_private_create_route_admission_for_canary(
        None,
        Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
    )
    .unwrap_err();

    let TestRendererRootError::PrivateCreateRouteAdmission(error) = error else {
        panic!("expected create-route admission error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateCreateRouteAdmissionError::MissingRootCreatePreflight
    ));
}

#[test]
fn root_create_enqueues_host_root_update_without_host_mutation() {
    let element = root_element(42);
    let root = TestRendererRoot::create(element, TestRendererOptions::new()).unwrap();
    let update = root.last_scheduled_update().unwrap();
    let pending_updates = root
        .store()
        .update_queues()
        .pending_updates(update.container_update().queue())
        .unwrap();

    assert_eq!(root.store().len(), 1);
    assert_eq!(root.lifecycle(), TestRendererRootLifecycle::Active);
    assert_eq!(update.kind(), TestRendererRootUpdateKind::Create);
    assert_eq!(update.element(), element);
    assert_eq!(update.container_update().schedule().root(), root.root_id());
    assert_eq!(
        update.container_update().schedule().fiber(),
        root.store().root(root.root_id()).unwrap().current()
    );
    assert_eq!(update.root_schedule().root(), root.root_id());
    assert!(update.root_schedule().inserted());
    assert!(update.root_schedule().microtask().is_some());
    assert_eq!(
        root.scheduled_roots_for_canary().unwrap(),
        vec![root.root_id()]
    );
    assert_eq!(pending_updates, vec![update.container_update().update()]);
    assert_eq!(
        root.store()
            .update_queues()
            .update(update.container_update().update())
            .unwrap()
            .payload()
            .unwrap()
            .element(),
        element
    );
    assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
    );
}
