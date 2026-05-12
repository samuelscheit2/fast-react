use super::*;
use std::sync::atomic::AtomicUsize;

use fast_react_host_config::{HostOperationErrorKind, HostTreeUpdateMode, MutationRenderer};
use fast_react_reconciler::{
    RootTaskScheduleOutcome, RootUpdateCallbackRecord, RootUpdateCallbackVisibility,
    TestRendererHostOutputCanaryMutationKind,
};

static TEST_HOST_FIBER_TOKEN: TestHostFiberToken = 1;

fn element_type(name: &str) -> TestElementType {
    TestElementType::new(name)
}

fn props() -> TestProps {
    TestProps::new()
}

fn host_fiber_token(
    phase: HostFiberTokenPhase,
    target: HostFiberTokenTarget,
) -> HostFiberTokenRef<'static, TestRenderer> {
    HostFiberTokenRef::new(&TEST_HOST_FIBER_TOKEN, phase, target)
}

fn creation_instance_token() -> HostFiberTokenRef<'static, TestRenderer> {
    host_fiber_token(
        HostFiberTokenPhase::Creation,
        HostFiberTokenTarget::Instance,
    )
}

fn creation_text_token() -> HostFiberTokenRef<'static, TestRenderer> {
    host_fiber_token(
        HostFiberTokenPhase::Creation,
        HostFiberTokenTarget::TextInstance,
    )
}

fn commit_instance_token() -> HostFiberTokenRef<'static, TestRenderer> {
    host_fiber_token(HostFiberTokenPhase::Commit, HostFiberTokenTarget::Instance)
}

fn deletion_instance_token() -> HostFiberTokenRef<'static, TestRenderer> {
    host_fiber_token(
        HostFiberTokenPhase::Deletion,
        HostFiberTokenTarget::Instance,
    )
}

fn create_instance(
    renderer: &mut TestRenderer,
    container: &TestContainer,
    name: &str,
) -> TestInstance {
    let context = renderer.root_host_context(container).unwrap();
    renderer
        .create_instance(
            creation_instance_token(),
            &element_type(name),
            &props(),
            container,
            &context,
        )
        .unwrap()
}

fn create_text(
    renderer: &mut TestRenderer,
    container: &TestContainer,
    text: &str,
) -> TestTextInstance {
    let context = renderer.root_host_context(container).unwrap();
    renderer
        .create_text_instance(creation_text_token(), text, container, &context)
        .unwrap()
}

fn child_texts(snapshot: &TestElementSnapshot) -> Vec<&str> {
    snapshot
        .children()
        .iter()
        .map(|child| match child {
            TestNodeSnapshot::Text(text) => text.text(),
            TestNodeSnapshot::Element(_) => panic!("expected text child"),
        })
        .collect()
}

fn container_element_names(snapshot: &TestContainerSnapshot) -> Vec<&str> {
    snapshot
        .children()
        .iter()
        .map(|child| match child {
            TestNodeSnapshot::Element(element) => element.element_type().as_str(),
            TestNodeSnapshot::Text(_) => panic!("expected element child"),
        })
        .collect()
}

fn container_element_texts(snapshot: &TestContainerSnapshot) -> Vec<&str> {
    snapshot
        .children()
        .iter()
        .map(|child| match child {
            TestNodeSnapshot::Element(element) => match &element.children()[0] {
                TestNodeSnapshot::Text(text) => text.text(),
                TestNodeSnapshot::Element(_) => panic!("expected text child"),
            },
            TestNodeSnapshot::Text(_) => panic!("expected element child"),
        })
        .collect()
}

fn nested_container_inner_names(snapshot: &TestContainerSnapshot) -> Vec<&str> {
    snapshot
        .children()
        .iter()
        .map(|child| match child {
            TestNodeSnapshot::Element(outer) => match &outer.children()[0] {
                TestNodeSnapshot::Element(inner) => inner.element_type().as_str(),
                TestNodeSnapshot::Text(_) => panic!("expected nested element child"),
            },
            TestNodeSnapshot::Text(_) => panic!("expected outer element child"),
        })
        .collect()
}

fn nested_container_inner_texts(snapshot: &TestContainerSnapshot) -> Vec<&str> {
    let TestNodeSnapshot::Element(outer) = &snapshot.children()[0] else {
        panic!("expected outer element child");
    };
    let TestNodeSnapshot::Element(inner) = &outer.children()[0] else {
        panic!("expected inner element child");
    };
    child_texts(inner)
}

fn assert_mutation_renderer<T: MutationRenderer>(_renderer: &T) {}

fn assert_operation_error(error: HostError, expected: HostOperationErrorKind) {
    let operation = error.as_operation_error().unwrap();

    assert!(error.as_unsupported_capability().is_none());
    assert_eq!(operation.renderer_name(), TEST_RENDERER_NAME);
    assert_eq!(operation.kind(), &expected);
}

fn root_element(raw: u64) -> RootElementHandle {
    RootElementHandle::from_raw(raw)
}

fn create_lifecycle_handoff_for_root() -> (
    TestRendererRoot,
    TestRendererCommittedHostOutput,
    TestRendererPrivateCreateNativeBridgeHostOutputHandoff,
) {
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

    (root, output, handoff)
}

fn assert_root_lifecycle_execution_error_reason(
    error: TestRendererRootError,
    operation: &'static str,
    reason: &'static str,
) {
    let TestRendererRootError::PrivateRootLifecycleExecution(error) = error else {
        panic!("expected private root lifecycle execution error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateRootLifecycleExecutionError::LifecycleExecutionRecordMismatch {
            operation: actual_operation,
            reason: actual_reason,
        } if *actual_operation == operation && *actual_reason == reason
    ));
}

fn assert_private_root_lifecycle_execution_blocks_public_surfaces(
    evidence: &TestRendererPrivateRootLifecycleExecutionEvidence,
) {
    assert!(evidence.source_renderer_owner_accepted());
    assert!(evidence.source_lifecycle_row_accepted());
    assert!(evidence.source_reconciler_host_execution_consumed());
    assert!(evidence.snapshot_produced_from_executed_state());
    assert!(evidence.host_output_snapshot_current());
    assert!(evidence.source_owned_execution_accepted());
    assert!(!evidence.public_root_available());
    assert!(!evidence.public_serialization_available());
    assert!(!evidence.public_test_instance_available());
    assert!(!evidence.public_act_available());
    assert!(!evidence.public_scheduler_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(!evidence.js_package_available());
    assert!(!evidence.compatibility_claimed());
    assert!(evidence.public_blockers().all_blocked());
    assert!(evidence.public_surfaces_blocked());
}

#[test]
fn root_private_root_lifecycle_execution_consumes_create_update_unmount_rows() {
    let (mut root, created, create_handoff) = create_lifecycle_handoff_for_root();
    let span = element_type("span");
    let create_evidence = root
        .describe_private_root_create_lifecycle_execution_for_canary(&created, create_handoff)
        .unwrap();

    assert_eq!(
        create_evidence.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        create_evidence.status(),
        TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_STATUS
    );
    assert_eq!(create_evidence.root(), root.root_id());
    assert_eq!(create_evidence.renderer_id, root.renderer.renderer_id);
    assert_eq!(create_evidence.operation(), "create");
    assert_eq!(create_evidence.public_surface(), "create()");
    assert_eq!(
        create_evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID
    );
    assert_eq!(
        create_evidence.source_execution_status(),
        TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS
    );
    assert_eq!(
        create_evidence.lifecycle(),
        TestRendererRootLifecycle::Active
    );
    assert_eq!(
        create_evidence.scheduled_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert_eq!(
        create_evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Create
    );
    assert_eq!(
        create_evidence.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SingleHostText
    );
    assert_eq!(create_evidence.previous_snapshot(), None);
    assert_eq!(create_evidence.snapshot(), created.snapshot());
    assert_eq!(create_evidence.executed_element_type(), Some(&span));
    assert_eq!(create_evidence.executed_props(), Some(&props()));
    assert_eq!(create_evidence.executed_text(), Some("hello"));
    assert_eq!(create_evidence.detached_instance_snapshot(), None);
    assert_eq!(create_evidence.root_child_count(), 1);
    assert_eq!(create_evidence.previous_root_child_count(), 0);
    assert_eq!(create_evidence.host_component_count(), 1);
    assert_eq!(create_evidence.host_text_count(), 1);
    assert_eq!(create_evidence.host_node_cleanup_count(), 0);
    assert_eq!(create_evidence.host_update_apply_count(), 0);
    assert_private_root_lifecycle_execution_blocks_public_surfaces(&create_evidence);

    let updated_props = props().with_attribute("data-state", "new");
    let (_outcome, updated, update_admission) = root
        .render_and_admit_private_update_native_bridge_handoff_for_canary(
            "span",
            updated_props.clone(),
            "goodbye",
        )
        .unwrap();
    let update_evidence = root
        .describe_private_root_update_lifecycle_execution_for_canary(&updated, update_admission)
        .unwrap();

    assert_eq!(update_evidence.root(), root.root_id());
    assert_eq!(update_evidence.renderer_id, root.renderer.renderer_id);
    assert_eq!(update_evidence.operation(), "update");
    assert_eq!(update_evidence.public_surface(), "create().update");
    assert_eq!(
        update_evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        update_evidence.source_execution_status(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
    );
    assert_eq!(
        update_evidence.scheduled_update_sequence(),
        updated.scheduled_update_sequence()
    );
    assert_eq!(
        update_evidence.lifecycle(),
        TestRendererRootLifecycle::Active
    );
    assert_eq!(
        update_evidence.scheduled_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        update_evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        update_evidence.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SingleHostText
    );
    assert_eq!(
        update_evidence.previous_snapshot(),
        Some(updated.previous_snapshot())
    );
    assert_eq!(
        container_element_texts(updated.previous_snapshot()),
        vec!["hello"]
    );
    assert_eq!(update_evidence.snapshot(), updated.snapshot());
    assert_eq!(update_evidence.executed_element_type(), Some(&span));
    assert_eq!(update_evidence.executed_props(), Some(&updated_props));
    assert_eq!(update_evidence.executed_text(), Some("goodbye"));
    assert_eq!(update_evidence.detached_instance_snapshot(), None);
    assert_eq!(update_evidence.root_child_count(), 1);
    assert_eq!(update_evidence.previous_root_child_count(), 1);
    assert_eq!(update_evidence.host_component_count(), 1);
    assert_eq!(update_evidence.host_text_count(), 1);
    assert_eq!(update_evidence.host_node_cleanup_count(), 0);
    assert_eq!(update_evidence.host_update_apply_count(), 2);
    assert_private_root_lifecycle_execution_blocks_public_surfaces(&update_evidence);

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
    let unmount_sequence = unmount_admission.scheduled_update_sequence();
    let unmount_evidence = root
        .describe_private_root_unmount_lifecycle_execution_for_canary(&unmounted, unmount_admission)
        .unwrap();

    assert_eq!(unmount_evidence.root(), root.root_id());
    assert_eq!(unmount_evidence.renderer_id, root.renderer.renderer_id);
    assert_eq!(unmount_evidence.operation(), "unmount");
    assert_eq!(unmount_evidence.public_surface(), "create().unmount");
    assert_eq!(
        unmount_evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        unmount_evidence.source_execution_status(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS
    );
    assert_eq!(
        unmount_evidence.scheduled_update_sequence(),
        unmount_sequence
    );
    assert_eq!(
        unmount_evidence.lifecycle(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(
        unmount_evidence.scheduled_update_kind(),
        TestRendererRootUpdateKind::Unmount
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
        unmount_evidence.previous_snapshot(),
        Some(unmounted.previous_snapshot())
    );
    assert_eq!(
        container_element_texts(unmounted.previous_snapshot()),
        vec!["goodbye"]
    );
    assert_eq!(unmount_evidence.snapshot(), unmounted.snapshot());
    assert!(unmount_evidence.snapshot().children().is_empty());
    assert_eq!(unmount_evidence.executed_element_type(), None);
    assert_eq!(unmount_evidence.executed_props(), None);
    assert_eq!(unmount_evidence.executed_text(), None);
    let detached = unmount_evidence
        .detached_instance_snapshot()
        .expect("expected detached instance evidence");
    assert!(detached.is_detached());
    assert!(detached.children().is_empty());
    assert_eq!(unmount_evidence.root_child_count(), 0);
    assert_eq!(unmount_evidence.previous_root_child_count(), 1);
    assert_eq!(unmount_evidence.host_component_count(), 0);
    assert_eq!(unmount_evidence.host_text_count(), 0);
    assert_eq!(unmount_evidence.host_node_cleanup_count(), 2);
    assert_eq!(unmount_evidence.host_update_apply_count(), 0);
    assert_private_root_lifecycle_execution_blocks_public_surfaces(&unmount_evidence);
}

#[test]
fn root_private_multi_child_host_text_lifecycle_and_identity_consume_real_update_handoff() {
    let (root, output, route, lifecycle, identity) =
        multi_child_host_text_identity_inputs_for_canary();
    let row = root
        .describe_private_to_json_multi_child_host_text_output_row_for_canary(&output)
        .unwrap();

    assert_eq!(route.root(), root.root_id());
    assert_eq!(route.renderer_id(), root.renderer.renderer_id);
    assert_eq!(
        route.scheduled_update_sequence(),
        output.scheduled_update_sequence()
    );
    assert_eq!(
        route.render_current().slot(),
        output.render().current().slot().get()
    );
    assert_eq!(
        lifecycle.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_DIAGNOSTIC_NAME
    );
    assert_eq!(lifecycle.root(), root.root_id());
    assert_eq!(lifecycle.renderer_id, root.renderer.renderer_id);
    assert_eq!(lifecycle.operation(), "update");
    assert_eq!(lifecycle.public_surface(), "create().update");
    assert_eq!(lifecycle.source_execution_record_id(), route.record_id());
    assert_eq!(lifecycle.source_execution_status(), route.status());
    assert_eq!(
        lifecycle.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
    );
    assert_eq!(lifecycle.root_child_count(), 1);
    assert_eq!(lifecycle.previous_root_child_count(), 1);
    assert_eq!(lifecycle.host_component_count(), 1);
    assert_eq!(lifecycle.host_text_count(), 2);
    assert_eq!(
        lifecycle.host_update_apply_count(),
        output.host_parent_placement_apply_count()
    );
    assert_eq!(lifecycle.snapshot(), output.snapshot());
    assert_eq!(
        lifecycle.previous_snapshot(),
        Some(output.previous_snapshot())
    );
    let TestNodeSnapshot::Element(element) = &output.snapshot().children()[0] else {
        panic!("expected multi-child host component");
    };
    assert_eq!(child_texts(element), vec!["hello", "inserted"]);
    assert_private_root_lifecycle_execution_blocks_public_surfaces(&lifecycle);

    assert_eq!(
        row.id(),
        TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(
        row.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
    );
    assert_eq!(row.previous_root_child_count(), 1);
    assert_eq!(row.current_root_child_count(), 1);
    assert_eq!(row.previous_host_text_count(), 1);
    assert_eq!(row.current_host_text_count(), 2);
    assert_eq!(row.current_root_text_count(), 0);
    assert_eq!(row.current_max_host_component_depth(), 1);
    assert!(row.public_blockers().all_blocked());

    assert_eq!(
        identity.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_DIAGNOSTIC_NAME
    );
    assert_eq!(identity.root(), root.root_id());
    assert_eq!(identity.renderer_id(), root.renderer.renderer_id);
    assert_eq!(
        identity.public_surface(),
        "create().update -> create().toJSON"
    );
    assert_eq!(identity.source_execution_record_id(), route.record_id());
    assert_eq!(
        identity.source_lifecycle_diagnostic_name(),
        lifecycle.diagnostic_name()
    );
    assert_eq!(
        identity.worker_895_report_row_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(
        identity.child_fiber_tag_order(),
        ["HostComponent", "HostText", "HostText"]
    );
    assert_eq!(identity.root_child_count(), 1);
    assert_eq!(identity.source_node_count(), 3);
    assert_eq!(identity.route_render_current(), identity.render_current());
    assert_eq!(
        identity.route_render_finished_work(),
        identity.render_finished_work()
    );
    assert_eq!(
        identity.route_commit_previous_current(),
        identity.commit_previous_current()
    );
    assert_eq!(identity.route_commit_current(), identity.commit_current());
    assert_eq!(identity.render_finished_work(), identity.commit_current());
    assert_eq!(identity.report_finished_work(), identity.commit_current());
    assert_eq!(
        identity.route_render_lanes_bits(),
        identity.render_lanes_bits()
    );
    assert_eq!(
        identity.route_commit_finished_lanes_bits(),
        identity.commit_finished_lanes_bits()
    );
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
    assert!(identity.route_handles_match_committed_update());
    assert!(identity.route_lanes_match_committed_update());
    assert!(identity.lifecycle_matches_committed_update());
    assert!(identity.commit_current_matches_render_finished_work());
    assert!(identity.commit_previous_current_matches_render_current());
    assert!(identity.report_finished_work_matches_commit_current());
    assert!(identity.report_lanes_match_commit_lanes());
    assert!(identity.host_output_snapshot_current());
    assert!(identity.report_host_output_row_matches_output());
    assert!(identity.child_order_matches_current_snapshot());
    assert_eq!(
        identity.host_parent_placement_apply_count(),
        output.host_parent_placement_apply_count()
    );
    assert!(identity.real_multi_child_handoff_available());
    assert!(identity.consumes_update_route_admission());
    assert!(identity.consumes_root_lifecycle_execution());
    assert!(identity.consumes_multi_child_host_output());
    assert!(identity.consumes_committed_host_root_finished_work_identity());
    assert!(identity.consumes_committed_host_root_finished_work_lanes());
    assert!(identity.identity_admission_available());
    assert!(!identity.broad_multichild_identity_available());
    assert!(identity.public_native_package_js_surfaces_blocked());
}

#[test]
fn root_private_direct_multi_child_host_text_committed_fiber_inspection_consumes_source_owned_current_topology()
 {
    let (
        root,
        output,
        route,
        lifecycle,
        identity,
        row,
        row_identity,
        reconciler_inspection,
        inspection,
    ) = direct_multi_child_host_text_fiber_inspection_inputs_for_canary();

    assert_eq!(
        inspection.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_FIBER_INSPECTION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        inspection.status(),
        TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_FIBER_INSPECTION_STATUS
    );
    assert_eq!(inspection.root(), root.root_id());
    assert_eq!(inspection.renderer_id(), root.renderer.renderer_id);
    assert_eq!(
        inspection.root_scheduled_update_sequence(),
        output.scheduled_update_sequence()
    );
    assert_eq!(
        inspection.public_surface(),
        "create().update -> create().toJSON"
    );
    assert_eq!(inspection.source_route_record_id(), route.record_id());
    assert_eq!(inspection.source_route_status(), route.status());
    assert_eq!(
        inspection.source_lifecycle_diagnostic_name(),
        lifecycle.diagnostic_name()
    );
    assert_eq!(inspection.source_lifecycle_status(), lifecycle.status());
    assert_eq!(
        inspection.source_identity_diagnostic_name(),
        identity.diagnostic_name()
    );
    assert_eq!(inspection.source_identity_status(), identity.status());
    assert_eq!(inspection.source_row_id(), row.id());
    assert_eq!(
        row_identity.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_DIAGNOSTIC_NAME
    );
    assert_eq!(
        row_identity.status(),
        TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_STATUS
    );
    assert_eq!(row_identity.root(), root.root_id());
    assert_eq!(row_identity.renderer_id(), root.renderer.renderer_id);
    assert_eq!(
        row_identity.root_scheduled_update_sequence(),
        output.scheduled_update_sequence()
    );
    assert_eq!(
        row_identity.public_surface(),
        "create().update -> create().toJSON"
    );
    assert_eq!(row_identity.host_output_row(), row);
    assert_eq!(row_identity.source_row_id(), row.id());
    assert_eq!(row_identity.render_current(), route.render_current());
    assert_eq!(
        row_identity.render_finished_work(),
        route.render_finished_work()
    );
    assert_eq!(
        row_identity.commit_previous_current(),
        route.commit_previous_current()
    );
    assert_eq!(row_identity.commit_current(), route.commit_current());
    assert_eq!(row_identity.store_current(), row_identity.commit_current());
    assert_eq!(
        row_identity.host_component_fiber().slot(),
        output.updated_fibers().component().slot().get()
    );
    assert_eq!(
        row_identity.stable_text_fiber().slot(),
        output.updated_fibers().text().slot().get()
    );
    assert_eq!(row_identity.placed_text_fiber(), output.placed_text_fiber());
    assert_eq!(row_identity.render_lanes_bits(), route.render_lanes_bits());
    assert_eq!(
        row_identity.commit_finished_lanes_bits(),
        route.commit_finished_lanes_bits()
    );
    assert_eq!(row_identity.commit_remaining_lanes_bits(), 0);
    assert_eq!(row_identity.commit_pending_lanes_bits(), 0);
    assert!(row_identity.row_matches_shape());
    assert!(row_identity.row_owner_matches_root());
    assert!(row_identity.row_handles_match_output());
    assert!(row_identity.row_lanes_match_commit());
    assert!(row_identity.public_native_package_js_surfaces_blocked());
    assert!(row_identity.source_owned_current_row_identity_accepted());
    assert_eq!(
        reconciler_inspection.diagnostic_name(),
        TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_RECONCILER_INSPECTION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        reconciler_inspection.status(),
        TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_RECONCILER_INSPECTION_STATUS
    );
    assert_eq!(reconciler_inspection.root(), root.root_id());
    assert_eq!(
        reconciler_inspection.renderer_id(),
        root.renderer.renderer_id
    );
    assert_eq!(
        reconciler_inspection.root_scheduled_update_sequence(),
        output.scheduled_update_sequence()
    );
    assert_eq!(
        reconciler_inspection.public_surface(),
        "create().update -> create().toJSON"
    );
    assert_eq!(
        reconciler_inspection.source_committed_current(),
        row_identity.commit_current()
    );
    assert_eq!(
        reconciler_inspection.inspection_store_current(),
        row_identity.store_current()
    );
    assert_eq!(
        reconciler_inspection.source_component_fiber(),
        row_identity.host_component_fiber()
    );
    assert_eq!(
        reconciler_inspection.source_stable_text_fiber(),
        row_identity.stable_text_fiber()
    );
    assert_eq!(
        reconciler_inspection.source_placed_text_fiber(),
        row_identity.placed_text_fiber()
    );
    assert!(reconciler_inspection.source_current_topology_recorded());
    assert!(reconciler_inspection.source_host_node_state_nodes_present());
    assert_eq!(
        reconciler_inspection.inspection_shape_name(),
        "HostRoot->HostComponent->[HostText,HostText]"
    );
    assert_eq!(
        reconciler_inspection.inspection_current_shape(),
        TEST_RENDERER_PRIVATE_TREE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE
    );
    assert_eq!(reconciler_inspection.inspection_root_child_count(), 1);
    assert_eq!(
        reconciler_inspection.inspection_host_component_child_count(),
        2
    );
    assert_eq!(reconciler_inspection.inspection_host_text_count(), 2);
    assert_eq!(
        reconciler_inspection.inspection_host_component_state_node_raw(),
        output.parent_state_node_raw()
    );
    assert_ne!(
        reconciler_inspection.inspection_stable_text_state_node_raw(),
        0
    );
    assert_eq!(
        reconciler_inspection.inspection_placed_text_state_node_raw(),
        output.placed_text_state_node_raw()
    );
    assert!(reconciler_inspection.inspection_finished_work_after_commit_cleared());
    assert_eq!(
        reconciler_inspection.inspection_finished_lanes_after_commit_bits(),
        0
    );
    assert_eq!(
        reconciler_inspection.render_lanes_bits(),
        route.render_lanes_bits()
    );
    assert_eq!(
        reconciler_inspection.commit_finished_lanes_bits(),
        route.commit_finished_lanes_bits()
    );
    assert!(reconciler_inspection.public_native_package_js_surfaces_blocked());
    assert!(reconciler_inspection.source_bound_reconciler_direct_inspection_accepted());
    assert_eq!(
        inspection.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        inspection.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
    );
    assert_eq!(
        inspection.current_fiber_shape(),
        TEST_RENDERER_PRIVATE_TREE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE
    );
    assert_eq!(inspection.root_child_count(), 1);
    assert_eq!(inspection.host_component_child_count(), 2);
    assert_eq!(inspection.host_text_count(), 2);
    assert_eq!(inspection.render_current(), route.render_current());
    assert_eq!(
        inspection.render_finished_work(),
        route.render_finished_work()
    );
    assert_eq!(
        inspection.commit_previous_current(),
        route.commit_previous_current()
    );
    assert_eq!(inspection.commit_current(), route.commit_current());
    assert_eq!(inspection.store_current(), inspection.commit_current());
    assert_eq!(
        inspection.render_finished_work(),
        inspection.commit_current()
    );
    assert_eq!(
        inspection.host_component_fiber().slot(),
        output.updated_fibers().component().slot().get()
    );
    assert_eq!(
        inspection.stable_text_fiber().slot(),
        output.updated_fibers().text().slot().get()
    );
    assert_eq!(inspection.placed_text_fiber(), output.placed_text_fiber());
    assert_eq!(
        inspection.stable_text_sibling(),
        Some(inspection.placed_text_fiber())
    );
    assert_eq!(inspection.placed_text_sibling(), None);
    assert_eq!(
        inspection.host_component_element_type_raw(),
        output.updated_fibers().fixture().element_type_raw()
    );
    assert_eq!(
        inspection.host_component_props_raw(),
        output.updated_fibers().fixture().component_props_raw()
    );
    assert_eq!(
        inspection.stable_text_props_raw(),
        output.updated_fibers().fixture().text_props_raw()
    );
    assert_eq!(
        inspection.placed_text_props_raw(),
        output.placed_text_props_raw()
    );
    assert_eq!(
        inspection.host_component_state_node_raw(),
        output.parent_state_node_raw()
    );
    assert_eq!(
        inspection.placed_text_state_node_raw(),
        output.placed_text_state_node_raw()
    );
    assert_eq!(inspection.render_lanes_bits(), route.render_lanes_bits());
    assert_eq!(
        inspection.commit_finished_lanes_bits(),
        route.commit_finished_lanes_bits()
    );
    assert_eq!(inspection.commit_remaining_lanes_bits(), 0);
    assert_eq!(inspection.commit_pending_lanes_bits(), 0);
    assert!(inspection.route_evidence_accepted());
    assert!(inspection.lifecycle_evidence_accepted());
    assert!(inspection.identity_evidence_accepted());
    assert!(inspection.row_identity_accepted());
    assert_eq!(
        inspection.source_reconciler_inspection_diagnostic_name(),
        reconciler_inspection.diagnostic_name()
    );
    assert_eq!(
        inspection.source_reconciler_inspection_status(),
        reconciler_inspection.status()
    );
    assert!(inspection.reconciler_direct_source_recorded());
    assert!(inspection.reconciler_direct_inspection_accepted());
    assert!(inspection.reconciler_direct_current_topology_matches_output());
    assert!(inspection.reconciler_direct_public_native_package_blocked());
    assert!(inspection.current_root_matches_commit());
    assert!(inspection.finished_work_matches_current_root());
    assert!(inspection.lanes_match());
    assert!(inspection.current_child_topology_matches_output());
    assert!(inspection.placement_handoff_accepted());
    assert!(inspection.source_owned_current_fiber_inspection_accepted());
    assert!(!inspection.generic_reconciler_direct_inspection_available());
    assert!(!inspection.broad_multichild_fiber_inspection_available());
    assert!(inspection.public_native_package_js_surfaces_blocked());

    let generic_error = root
        .describe_committed_fiber_tree_for_canary(output.commit())
        .unwrap_err();
    assert!(matches!(
        generic_error,
        TestRendererRootError::FiberInspection(_)
    ));
}

#[test]
fn root_private_direct_multi_child_host_text_committed_fiber_inspection_rejects_missing_stale_or_replayed_source_rows()
 {
    let (
        root,
        output,
        route,
        lifecycle,
        identity,
        _row,
        row_identity,
        reconciler_inspection,
        _inspection,
    ) = direct_multi_child_host_text_fiber_inspection_inputs_for_canary();

    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            None,
            Some(&lifecycle),
            Some(identity),
            Some(row_identity),
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-route-evidence-missing",
    );

    let mut stale_route = route;
    stale_route.scheduled_update_sequence += 1;
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(stale_route),
            Some(&lifecycle),
            Some(identity),
            Some(row_identity),
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "multi-child-host-text-route-update-sequence-stale",
    );

    let (
        _other_root,
        _other_output,
        other_route,
        _other_lifecycle,
        _other_identity,
        _other_row,
        _other_row_identity,
        _other_reconciler_inspection,
        _other_inspection,
    ) = direct_multi_child_host_text_fiber_inspection_inputs_for_canary();
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(other_route),
            Some(&lifecycle),
            Some(identity),
            Some(row_identity),
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-cross-root-current-mismatch",
    );

    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            None,
            Some(identity),
            Some(row_identity),
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-lifecycle-evidence-missing",
    );

    let mut cloned_lifecycle = lifecycle.clone();
    cloned_lifecycle.source_lifecycle_row_accepted = false;
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&cloned_lifecycle),
            Some(identity),
            Some(row_identity),
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "multi-child-host-text-lifecycle-evidence-mismatch",
    );

    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            None,
            Some(row_identity),
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-finished-work-identity-missing",
    );

    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(identity),
            None,
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-row-identity-missing",
    );

    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(identity),
            Some(row_identity),
            None,
        )
        .unwrap_err(),
        "direct-multi-child-host-text-reconciler-inspection-missing",
    );
}

#[test]
fn root_private_direct_multi_child_host_text_committed_fiber_inspection_rejects_same_shape_foreign_row_identity()
 {
    let (
        root,
        output,
        route,
        lifecycle,
        identity,
        row,
        row_identity,
        reconciler_inspection,
        _inspection,
    ) = direct_multi_child_host_text_fiber_inspection_inputs_for_canary();
    let (
        _other_root,
        _other_output,
        _other_route,
        _other_lifecycle,
        _other_identity,
        other_row,
        other_row_identity,
        _other_reconciler_inspection,
        _other_inspection,
    ) = direct_multi_child_host_text_fiber_inspection_inputs_for_canary();

    assert_eq!(row, other_row);
    assert_ne!(row_identity.renderer_id(), other_row_identity.renderer_id());
    assert_ne!(
        row_identity.host_component_fiber(),
        other_row_identity.host_component_fiber()
    );
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(identity),
            Some(other_row_identity),
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-row-identity-mismatch",
    );
}

#[test]
fn root_private_direct_multi_child_host_text_committed_fiber_inspection_rejects_caller_shaped_reconciler_evidence()
 {
    let (
        root,
        output,
        route,
        lifecycle,
        identity,
        _row,
        row_identity,
        reconciler_inspection,
        _inspection,
    ) = direct_multi_child_host_text_fiber_inspection_inputs_for_canary();

    let mut missing_source_topology = reconciler_inspection;
    missing_source_topology.source_current_topology_recorded = false;
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(identity),
            Some(row_identity),
            Some(missing_source_topology),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-reconciler-inspection-mismatch",
    );

    let mut caller_shaped_direct_child = reconciler_inspection;
    caller_shaped_direct_child.source_component_fiber =
        reconciler_inspection.source_placed_text_fiber();
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(identity),
            Some(row_identity),
            Some(caller_shaped_direct_child),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-reconciler-inspection-mismatch",
    );

    let mut stale_reconciler_inspection = reconciler_inspection;
    stale_reconciler_inspection.root_scheduled_update_sequence += 1;
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(identity),
            Some(row_identity),
            Some(stale_reconciler_inspection),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-reconciler-inspection-stale",
    );

    let (
        _other_root,
        _other_output,
        _other_route,
        _other_lifecycle,
        _other_identity,
        _other_row,
        _other_row_identity,
        other_reconciler_inspection,
        _other_inspection,
    ) = direct_multi_child_host_text_fiber_inspection_inputs_for_canary();
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(identity),
            Some(row_identity),
            Some(other_reconciler_inspection),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-reconciler-inspection-mismatch",
    );

    let mut native_claim = reconciler_inspection;
    native_claim.source_native_execution_blocked = false;
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(identity),
            Some(row_identity),
            Some(native_claim),
        )
        .unwrap_err(),
        "public-or-native-package-js-compatibility-claim",
    );
}

#[test]
fn root_private_direct_multi_child_host_text_committed_fiber_inspection_rejects_row_topology_lane_current_and_public_aliases()
 {
    let (
        root,
        output,
        route,
        lifecycle,
        identity,
        _row,
        row_identity,
        reconciler_inspection,
        _inspection,
    ) = direct_multi_child_host_text_fiber_inspection_inputs_for_canary();

    let mut wrong_kind_route = route;
    wrong_kind_route.host_output_update_kind = TestRendererRootUpdateKind::Create;
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(wrong_kind_route),
            Some(&lifecycle),
            Some(identity),
            Some(row_identity),
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "multi-child-host-text-route-metadata-stale",
    );

    let mut wrong_kind_row_identity = row_identity;
    wrong_kind_row_identity
        .host_output_row
        .host_output_update_kind = TestRendererRootUpdateKind::Create;
    wrong_kind_row_identity.row_matches_shape = false;
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(identity),
            Some(wrong_kind_row_identity),
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-row-identity-mismatch",
    );

    let mut lane_drift_identity = identity;
    lane_drift_identity.report_finished_lanes_bits += 1;
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(lane_drift_identity),
            Some(row_identity),
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "multi-child-host-text-finished-work-identity-lane-mismatch",
    );

    let mut stale_topology_output = output.clone();
    stale_topology_output.placed_text_fiber.slot += 1;
    let mut stale_topology_row_identity = row_identity;
    stale_topology_row_identity.placed_text_fiber = stale_topology_output.placed_text_fiber();
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &stale_topology_output,
            Some(route),
            Some(&lifecycle),
            Some(identity),
            Some(stale_topology_row_identity),
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-current-child-topology-mismatch",
    );

    let (
        _cross_root,
        cross_output,
        cross_route,
        cross_lifecycle,
        cross_identity,
        _cross_row,
        cross_row_identity,
        cross_reconciler_inspection,
        _cross_inspection,
    ) = direct_multi_child_host_text_fiber_inspection_inputs_for_canary();
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &cross_output,
            Some(cross_route),
            Some(&cross_lifecycle),
            Some(cross_identity),
            Some(cross_row_identity),
            Some(cross_reconciler_inspection),
        )
        .unwrap_err(),
        "direct-multi-child-host-text-cross-root-current-mismatch",
    );

    let mut public_alias_identity = identity;
    public_alias_identity.package_compatibility_claimed = true;
    assert_direct_multi_child_host_text_inspection_error_reason(
        root.describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(public_alias_identity),
            Some(row_identity),
            Some(reconciler_inspection),
        )
        .unwrap_err(),
        "public-or-native-package-js-compatibility-claim",
    );
}

#[test]
fn root_private_root_lifecycle_execution_rejects_stale_or_cross_surface_rows() {
    let (mut root, created, create_handoff) = create_lifecycle_handoff_for_root();
    root.update_host_component_with_text_for_canary("span", "later")
        .unwrap();
    root.render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();

    let error = root
        .describe_private_root_create_lifecycle_execution_for_canary(&created, create_handoff)
        .unwrap_err();
    assert_root_lifecycle_execution_error_reason(error, "create", "executed-snapshot-stale");

    let (mut root, _created, _create_handoff) = create_lifecycle_handoff_for_root();
    let (_outcome, updated, update_admission) = root
        .render_and_admit_private_update_native_bridge_handoff_for_canary(
            "span",
            props(),
            "goodbye",
        )
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "later")
        .unwrap();
    root.render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();

    let error = root
        .describe_private_root_update_lifecycle_execution_for_canary(&updated, update_admission)
        .unwrap_err();
    assert_root_lifecycle_execution_error_reason(error, "update", "source-update-sequence-stale");

    let (mut root, _created, _create_handoff) = create_lifecycle_handoff_for_root();
    let (_outcome, updated, update_admission) = root
        .render_and_admit_private_update_native_bridge_handoff_for_canary(
            "span",
            props(),
            "goodbye",
        )
        .unwrap();
    let mut cross_surface_admission = update_admission;
    cross_surface_admission.host_output_update_kind = TestRendererRootUpdateKind::Unmount;
    let error = root
        .describe_private_root_update_lifecycle_execution_for_canary(
            &updated,
            cross_surface_admission,
        )
        .unwrap_err();
    assert_root_lifecycle_execution_error_reason(
        error,
        "update",
        "source-kind-or-lifecycle-mismatch",
    );

    let mut foreign_owner_admission = update_admission;
    foreign_owner_admission.renderer_id = TestRendererId(foreign_owner_admission.renderer_id.0 + 1);
    let error = root
        .describe_private_root_update_lifecycle_execution_for_canary(
            &updated,
            foreign_owner_admission,
        )
        .unwrap_err();
    assert_root_lifecycle_execution_error_reason(error, "update", "source-owner-mismatch");
}

#[test]
fn root_private_root_lifecycle_execution_rejects_cloned_unmount_and_public_claims() {
    let (mut root, _created, _create_handoff) = create_lifecycle_handoff_for_root();
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

    let mut cloned_stale_admission = unmount_admission;
    cloned_stale_admission.scheduled_update_sequence += 1;
    let error = root
        .describe_private_root_unmount_lifecycle_execution_for_canary(
            &unmounted,
            cloned_stale_admission,
        )
        .unwrap_err();
    assert_root_lifecycle_execution_error_reason(
        error,
        "unmount",
        "source-kind-sequence-or-lifecycle-mismatch",
    );

    let mut foreign_owner_admission = unmount_admission;
    foreign_owner_admission.renderer_id = TestRendererId(foreign_owner_admission.renderer_id.0 + 1);
    let error = root
        .describe_private_root_unmount_lifecycle_execution_for_canary(
            &unmounted,
            foreign_owner_admission,
        )
        .unwrap_err();
    assert_root_lifecycle_execution_error_reason(error, "unmount", "source-owner-mismatch");

    let mut native_claim_admission = unmount_admission;
    native_claim_admission.native_bridge_available = true;
    let error = root
        .describe_private_root_unmount_lifecycle_execution_for_canary(
            &unmounted,
            native_claim_admission,
        )
        .unwrap_err();
    assert_root_lifecycle_execution_error_reason(
        error,
        "unmount",
        "public-native-js-act-compatibility-claim",
    );

    let mut act_claim_admission = unmount_admission;
    act_claim_admission.act_flushing_claimed = true;
    let error = root
        .describe_private_root_unmount_lifecycle_execution_for_canary(
            &unmounted,
            act_claim_admission,
        )
        .unwrap_err();
    assert_root_lifecycle_execution_error_reason(
        error,
        "unmount",
        "public-native-js-act-compatibility-claim",
    );
}

fn sibling_text_snapshots_for_diagnostics() -> (TestContainerSnapshot, TestContainerSnapshot) {
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

    (previous_snapshot, current_snapshot)
}

fn sibling_text_identity_inputs_for_canary() -> (
    TestRendererRoot,
    TestRendererSiblingTextHostOutput,
    TestRendererPrivateUpdateRouteAdmissionRecord,
    TestRendererPrivateJsonSerializationReport,
) {
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
    let route = root
        .describe_private_sibling_text_update_route_admission_for_canary(&output)
        .unwrap();
    let report = root
        .describe_private_json_serialization_after_sibling_text_update_for_canary(&output)
        .unwrap();

    (root, output, route, report)
}

fn nested_source_report_identity_inputs_for_canary() -> (
    TestRendererRoot,
    TestRendererNestedHostParentPlacedHostOutput,
    TestRendererPrivateUpdateRouteAdmissionRecord,
    TestRendererPrivateJsonSerializationReport,
    TestRendererPrivateSerializationFinishedWorkIdentityGate,
) {
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
    let output = root
        .render_and_commit_nested_host_parent_text_placement_for_canary("inserted")
        .unwrap();
    let route = accepted_nested_update_route_admission_for_root(&root, &output);
    let report = root
        .describe_private_json_serialization_after_nested_update_for_canary(&output)
        .unwrap();
    let identity = root
        .describe_private_to_json_nested_finished_work_identity_gate_for_canary(
            &output,
            Some(&report),
        )
        .unwrap();

    (root, output, route, report, identity)
}

fn multi_child_host_text_identity_inputs_for_canary() -> (
    TestRendererRoot,
    TestRendererHostParentPlacedHostOutput,
    TestRendererPrivateUpdateRouteAdmissionRecord,
    TestRendererPrivateRootLifecycleExecutionEvidence,
    TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate,
) {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let output = root
        .render_and_commit_host_parent_text_placement_for_canary("inserted")
        .unwrap();
    let route = root
        .describe_private_multi_child_host_text_update_route_admission_for_canary(&output)
        .unwrap();
    let lifecycle = root
        .describe_private_root_multi_child_host_text_update_lifecycle_execution_for_canary(
            &output, route,
        )
        .unwrap();
    let identity = root
        .describe_private_to_json_multi_child_host_text_finished_work_identity_gate_for_canary(
            &output, route, &lifecycle,
        )
        .unwrap();

    (root, output, route, lifecycle, identity)
}

fn direct_multi_child_host_text_fiber_inspection_inputs_for_canary() -> (
    TestRendererRoot,
    TestRendererHostParentPlacedHostOutput,
    TestRendererPrivateUpdateRouteAdmissionRecord,
    TestRendererPrivateRootLifecycleExecutionEvidence,
    TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate,
    TestRendererPrivateToJsonHostOutputRow,
    TestRendererPrivateDirectMultiChildHostTextRowIdentity,
    TestRendererPrivateDirectMultiChildHostTextReconcilerInspectionEvidence,
    TestRendererPrivateDirectMultiChildHostTextCommittedFiberInspection,
) {
    let (root, output, route, lifecycle, identity) =
        multi_child_host_text_identity_inputs_for_canary();
    let row = root
        .describe_private_to_json_multi_child_host_text_output_row_for_canary(&output)
        .unwrap();
    let row_identity = root
        .describe_private_direct_multi_child_host_text_row_identity_for_canary(&output)
        .unwrap();
    let reconciler_inspection = root
        .describe_private_direct_multi_child_host_text_reconciler_inspection_for_canary(&output)
        .unwrap();
    let inspection = root
        .describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(identity),
            Some(row_identity),
            Some(reconciler_inspection),
        )
        .unwrap();

    (
        root,
        output,
        route,
        lifecycle,
        identity,
        row,
        row_identity,
        reconciler_inspection,
        inspection,
    )
}

fn assert_sibling_text_identity_error_reason(
    error: TestRendererRootError,
    expected_reason: &'static str,
) {
    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected sibling-text private finished-work identity error");
    };
    match error.as_ref() {
        TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
            reason,
        } => assert_eq!(*reason, expected_reason),
        other => panic!("unexpected sibling-text identity error: {other:?}"),
    }
}

fn assert_multi_child_host_text_identity_error_reason(
    error: TestRendererRootError,
    expected_reason: &'static str,
) {
    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected multi-child HostText private finished-work identity error");
    };
    match error.as_ref() {
        TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
            reason,
        } => assert_eq!(*reason, expected_reason),
        other => panic!("unexpected multi-child HostText identity error: {other:?}"),
    }
}

fn assert_direct_multi_child_host_text_inspection_error_reason(
    error: TestRendererRootError,
    expected_reason: &'static str,
) {
    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected direct multi-child HostText private fiber inspection error");
    };
    match error.as_ref() {
        TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
            reason,
        } => assert_eq!(*reason, expected_reason),
        TestRendererPrivateSerializationFinishedWorkIdentityError::LaneMismatch {
            ..
        } => assert_eq!(expected_reason, "lane-mismatch"),
        other => {
            panic!("unexpected direct multi-child HostText fiber inspection error: {other:?}")
        }
    }
}

fn assert_unmount_nested_source_report_gate_error_reason(
    error: TestRendererRootError,
    expected_reason: &'static str,
) {
    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private unmount/nested source-report gate error");
    };
    match error.as_ref() {
        TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
            reason,
        } => assert_eq!(*reason, expected_reason),
        other => panic!("unexpected private unmount/nested gate error: {other:?}"),
    }
}

fn assert_to_json_native_execution_error_reason(
    error: TestRendererRootError,
    expected_operation: &'static str,
    expected_reason: &'static str,
) {
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON native execution error");
    };
    match error.as_ref() {
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation,
            reason,
        } => {
            assert_eq!(*operation, expected_operation);
            assert_eq!(*reason, expected_reason);
        }
        other => panic!("unexpected private JSON native execution error: {other:?}"),
    }
}

fn assert_to_tree_native_execution_error_reason(
    error: TestRendererRootError,
    expected_operation: &'static str,
    expected_reason: &'static str,
) {
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree native execution error");
    };
    match error.as_ref() {
        TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
            operation,
            reason,
        } => {
            assert_eq!(*operation, expected_operation);
            assert_eq!(*reason, expected_reason);
        }
        other => panic!("unexpected private toTree native execution error: {other:?}"),
    }
}

fn accepted_nested_update_route_admission_for_root(
    root: &TestRendererRoot,
    output: &TestRendererNestedHostParentPlacedHostOutput,
) -> TestRendererPrivateUpdateRouteAdmissionRecord {
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
    TestRendererPrivateUpdateRouteAdmissionRecord {
        record_id: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
        status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
        public_surface: "create().update",
        root: root.root_id(),
        renderer_id: root.renderer.renderer_id,
        scheduled_update_sequence: output.scheduled_update_sequence(),
        request_api: "TestRendererRoot::update",
        source_diagnostic_name: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME,
        source_diagnostic_status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS,
        lifecycle: TestRendererRootLifecycle::Active,
        scheduled_update_kind: TestRendererRootUpdateKind::Update,
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
    }
}

fn accepted_unmount_identity_for_root(
    to_tree: bool,
    include_ref_passive_cleanup: bool,
) -> (
    TestRendererRoot,
    TestRendererUnmountedHostOutput,
    TestRendererUnmountDeletionCommitHandoffDiagnostics,
    TestRendererUnmountNativeBridgeAdmission,
    TestRendererPrivateSerializationFinishedWorkIdentityGate,
) {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let unmount_outcome = root.unmount().unwrap();
    let unmounted = if include_ref_passive_cleanup {
        root.render_and_commit_host_output_unmount_with_ref_passive_cleanup_for_canary()
            .unwrap()
            .unwrap()
    } else {
        root.render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap()
    };
    let handoff = root
        .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
        .unwrap();
    let admission = root
        .describe_private_unmount_native_bridge_admission_for_canary(
            &unmount_outcome,
            Some(&handoff),
        )
        .unwrap();
    let identity = if to_tree {
        root.describe_private_to_tree_unmount_finished_work_identity_gate_for_canary(
            &unmounted,
            Some(&handoff),
        )
        .unwrap()
    } else {
        root.describe_private_to_json_unmount_finished_work_identity_gate_for_canary(
            &unmounted,
            Some(&handoff),
        )
        .unwrap()
    };

    (root, unmounted, handoff, admission, identity)
}

fn accepted_unmount_nested_source_report_gate_for_unmount_root(
    unmount_root: &TestRendererRoot,
    unmounted: &TestRendererUnmountedHostOutput,
    handoff: TestRendererUnmountDeletionCommitHandoffDiagnostics,
    admission: TestRendererUnmountNativeBridgeAdmission,
    unmount_identity: TestRendererPrivateSerializationFinishedWorkIdentityGate,
) -> TestRendererPrivateUnmountNestedSourceReportAdmissionGate {
    let (nested_root, nested_output, nested_route, nested_report, nested_identity) =
        nested_source_report_identity_inputs_for_canary();

    TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
        &nested_root,
        &nested_output,
        nested_route,
        Some(&nested_report),
        Some(nested_identity),
        unmount_root,
        unmounted,
        Some(handoff),
        admission,
        Some(unmount_identity),
    )
    .unwrap()
}

#[test]
fn root_lifecycle_update_and_outcome_codes_are_stable_for_private_bridges() {
    assert_eq!(TestRendererRootLifecycle::Active.code(), "Active");
    assert_eq!(
        TestRendererRootLifecycle::UnmountScheduled.code(),
        "UnmountScheduled"
    );

    assert_eq!(TestRendererRootUpdateKind::Create.code(), "Create");
    assert_eq!(TestRendererRootUpdateKind::Update.code(), "Update");
    assert_eq!(TestRendererRootUpdateKind::Unmount.code(), "Unmount");
    assert_eq!(
        TestRendererRootUpdateKind::Create.container_update_api(),
        "update_container"
    );
    assert_eq!(
        TestRendererRootUpdateKind::Update.container_update_api(),
        "update_container"
    );
    assert_eq!(
        TestRendererRootUpdateKind::Unmount.container_update_api(),
        "update_container_sync"
    );
    assert!(!TestRendererRootUpdateKind::Create.sync());
    assert!(!TestRendererRootUpdateKind::Update.sync());
    assert!(TestRendererRootUpdateKind::Unmount.sync());

    let scheduled = TestRendererRoot::create(root_element(1), TestRendererOptions::new())
        .unwrap()
        .last_scheduled_update()
        .cloned()
        .expect("create schedules a root update");

    assert_eq!(
        TestRendererRootUpdateOutcome::Scheduled(scheduled).code(),
        "Scheduled"
    );
    assert_eq!(
        TestRendererRootUpdateOutcome::IgnoredAfterUnmount.code(),
        "IgnoredAfterUnmount"
    );
    assert_eq!(
        TestRendererRootUpdateOutcome::AlreadyUnmountScheduled.code(),
        "AlreadyUnmountScheduled"
    );
}

fn current_host_root_element(root: &TestRendererRoot) -> RootElementHandle {
    let current = root.store().root(root.root_id()).unwrap().current();
    let state = root
        .store()
        .fiber_arena()
        .get(current)
        .unwrap()
        .memoized_state();
    root.store()
        .host_root_states()
        .get(state)
        .unwrap()
        .element()
}

fn host_storage_counts(root: &TestRendererRoot) -> (usize, usize, usize) {
    (
        root.renderer.containers.len(),
        root.renderer.instances.len(),
        root.renderer.texts.len(),
    )
}

fn host_node_activity_counts(root: &TestRendererRoot) -> (usize, usize) {
    (
        root.host_nodes.active_total(),
        root.host_nodes.inactive_total(),
    )
}

fn render_and_commit_latest_host_root(
    root: &mut TestRendererRoot,
) -> (HostRootRenderPhaseRecord, HostRootCommitRecord) {
    let render = root
        .render_latest_scheduled_host_root_for_commit_handoff()
        .unwrap()
        .unwrap();
    let commit = root.commit_host_root_render_for_canary(render).unwrap();
    (render, commit)
}

fn assert_empty_root_update_callback_snapshot(
    commit: &HostRootCommitRecord,
    render: &HostRootRenderPhaseRecord,
) {
    let callbacks = commit.root_update_callbacks();

    assert_eq!(callbacks.queue(), render.work_in_progress_update_queue());
    assert!(callbacks.is_empty());
    assert!(callbacks.visible().is_empty());
    assert!(callbacks.hidden().is_empty());
    assert!(callbacks.deferred_hidden().is_empty());
}

fn assert_visible_root_update_callback_snapshot(
    commit: &HostRootCommitRecord,
    render: &HostRootRenderPhaseRecord,
    scheduled_update: &TestRendererRootScheduledUpdate,
    callback: RootUpdateCallbackHandle,
) {
    let callbacks = commit.root_update_callbacks();

    assert_eq!(callbacks.queue(), render.work_in_progress_update_queue());
    assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
    assert_eq!(
        callbacks.visible()[0].queue(),
        render.work_in_progress_update_queue()
    );
    assert_eq!(
        callbacks.visible()[0].update(),
        scheduled_update.container_update().update()
    );
    assert_eq!(callbacks.visible()[0].sequence(), 0);
    assert_eq!(
        callbacks.visible()[0].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert!(callbacks.hidden().is_empty());
    assert!(callbacks.deferred_hidden().is_empty());
}

fn callback_handles(records: &[RootUpdateCallbackRecord]) -> Vec<RootUpdateCallbackHandle> {
    records.iter().map(|record| record.callback()).collect()
}

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

#[test]
fn root_update_reuses_same_fiber_root_and_shared_scheduler_record() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let root_id = root.root_id();
    let current = root.store().root(root_id).unwrap().current();
    let first_queue = root
        .last_scheduled_update()
        .unwrap()
        .container_update()
        .queue();

    let outcome = root.update(root_element(2)).unwrap();
    let update = outcome.scheduled().unwrap();
    let pending_updates = root
        .store()
        .update_queues()
        .pending_updates(update.container_update().queue())
        .unwrap();

    assert_eq!(root.root_id(), root_id);
    assert_eq!(root.store().root(root_id).unwrap().current(), current);
    assert_eq!(root.scheduled_updates().len(), 2);
    assert_eq!(update.kind(), TestRendererRootUpdateKind::Update);
    assert_eq!(update.element(), root_element(2));
    assert_eq!(update.container_update().queue(), first_queue);
    assert!(!update.root_schedule().inserted());
    assert_eq!(update.root_schedule().microtask(), None);
    assert_eq!(root.scheduled_roots_for_canary().unwrap(), vec![root_id]);
    assert_eq!(pending_updates.len(), 2);
    assert_eq!(
        root.store()
            .update_queues()
            .update(update.container_update().update())
            .unwrap()
            .payload()
            .unwrap()
            .element(),
        root_element(2)
    );
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn root_render_phase_canary_reaches_wip_state_without_committing() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    root.update(root_element(2)).unwrap();
    let current = root.store().root(root.root_id()).unwrap().current();

    let schedule = root.process_root_schedule_microtask_for_canary().unwrap();
    let render = root
        .render_latest_scheduled_host_root_for_commit_handoff()
        .unwrap()
        .unwrap();

    assert_eq!(schedule.records().len(), 1);
    assert_eq!(
        schedule.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    assert_eq!(render.root(), root.root_id());
    assert_eq!(render.resulting_element(), root_element(2));
    assert_eq!(render.applied_update_count(), 2);
    assert_eq!(render.skipped_update_count(), 0);
    assert_eq!(
        render.render_lanes(),
        root.last_scheduled_update()
            .unwrap()
            .container_update()
            .lane()
            .to_lanes()
    );
    assert_eq!(
        root.store().root(root.root_id()).unwrap().current(),
        current
    );
    assert_eq!(
        root.store().root(root.root_id()).unwrap().finished_work(),
        None
    );
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn root_host_output_canary_commits_minimal_host_component_with_text() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let previous_current = root.store().root(root.root_id()).unwrap().current();

    let output = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let render = output.render();
    let commit = output.commit();
    let completed = output.completed_fibers();
    let prepared = output.prepared_fibers();
    let fiber_inspection = output.fiber_inspection();
    let snapshot = output.snapshot();

    assert_eq!(render.root(), root.root_id());
    assert_eq!(render.current(), previous_current);
    assert_eq!(commit.root(), root.root_id());
    assert_eq!(commit.previous_current(), previous_current);
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(completed.root(), root.root_id());
    assert_eq!(completed.host_root(), render.finished_work());
    assert_eq!(completed.prepared(), prepared);
    assert_ne!(completed.component(), completed.text());
    assert_eq!(completed.component_state_node_raw(), 1);
    assert_eq!(completed.text_state_node_raw(), 1);
    assert_eq!(prepared.text_token().raw(), 1);
    assert_eq!(prepared.component_token().raw(), 2);
    assert_eq!(root.store().host_tokens().len(), 2);
    assert_eq!(fiber_inspection.root(), root.root_id());
    assert_eq!(fiber_inspection.current(), commit.current());
    assert_eq!(
        fiber_inspection.resulting_element(),
        render.resulting_element()
    );
    assert_eq!(fiber_inspection.host_root().fiber(), commit.current());
    assert_eq!(
        fiber_inspection.host_root().child(),
        Some(completed.component())
    );
    assert_eq!(
        fiber_inspection.host_component().fiber(),
        completed.component()
    );
    assert_eq!(
        fiber_inspection.host_component().parent(),
        Some(commit.current())
    );
    assert_eq!(
        fiber_inspection.host_component().child(),
        Some(completed.text())
    );
    assert_eq!(fiber_inspection.host_text().fiber(), completed.text());
    assert_eq!(
        fiber_inspection.host_text().parent(),
        Some(completed.component())
    );
    assert_eq!(fiber_inspection.host_text().child(), None);
    assert!(fiber_inspection.host_component().state_node_present());
    assert!(fiber_inspection.host_text().state_node_present());
    assert_empty_root_update_callback_snapshot(commit, &render);
    assert_eq!(
        root.store().root(root.root_id()).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host_storage_counts(&root), (1, 1, 1));
    assert_eq!(host_node_activity_counts(&root), (2, 0));
    assert_eq!(snapshot.children().len(), 1);

    let TestNodeSnapshot::Element(element) = &snapshot.children()[0] else {
        panic!("expected committed host component");
    };
    assert_eq!(element.element_type().as_str(), "span");
    assert_eq!(element.props(), &TestProps::new());
    assert!(!element.is_hidden());
    assert!(!element.is_detached());
    assert_eq!(child_texts(element), vec!["hello"]);
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot.clone()
    );
}

#[test]
fn root_host_output_canary_applies_host_parent_text_placement_privately() {
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

    let placed = root
        .render_and_commit_host_parent_text_placement_for_canary("inserted")
        .unwrap();
    let render = placed.render();
    let commit = placed.commit();
    let diagnostics = placed.commit_diagnostics();

    assert_eq!(render.root(), root.root_id());
    assert_eq!(render.current(), created.commit().current());
    assert_eq!(render.resulting_element(), root_element(1));
    assert_eq!(commit.previous_current(), created.commit().current());
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(placed.host_parent_placement_apply_count(), 1);
    assert!(commit.has_test_only_host_parent_placement_apply_for_canary(1, 2));
    assert_eq!(diagnostics.deletion_lists().len(), 0);
    assert_eq!(diagnostics.mutation_records().len(), 1);
    assert_eq!(
        diagnostics.mutation_records()[0].kind(),
        TestRendererHostOutputCanaryMutationKind::Placement
    );
    assert_eq!(diagnostics.mutation_records()[0].state_node_raw(), 2);
    assert_eq!(diagnostics.mutation_records()[0].memoized_props_raw(), 1003);
    assert_eq!(host_storage_counts(&root), (1, 1, 2));
    assert_eq!(placed.placed_text_snapshot().text(), "inserted");

    let TestNodeSnapshot::Element(previous) = &placed.previous_snapshot().children()[0] else {
        panic!("expected previous host component");
    };
    assert_eq!(child_texts(previous), vec!["hello"]);
    let TestNodeSnapshot::Element(element) = &placed.snapshot().children()[0] else {
        panic!("expected placed host component");
    };
    assert_eq!(element.element_type().as_str(), "span");
    assert_eq!(child_texts(element), vec!["hello", "inserted"]);
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        placed.snapshot().clone()
    );
    assert_eq!(current_host_root_element(&root), root_element(1));

    let inspection_error = root
        .describe_committed_fiber_tree_for_canary(commit)
        .unwrap_err();
    assert!(matches!(
        inspection_error,
        TestRendererRootError::FiberInspection(_)
    ));
}

#[test]
fn root_host_output_canary_applies_nested_host_parent_text_placement_privately() {
    let mut root = TestRendererRoot::create_nested_host_components_with_text_for_canary(
        "section",
        "label",
        "stable",
        TestRendererOptions::new(),
    )
    .unwrap();
    let created = root
        .render_and_commit_nested_host_output_for_canary()
        .unwrap()
        .unwrap();

    assert_eq!(container_element_names(created.snapshot()), vec!["section"]);
    assert_eq!(
        nested_container_inner_names(created.snapshot()),
        vec!["label"]
    );
    assert_eq!(
        nested_container_inner_texts(created.snapshot()),
        vec!["stable"]
    );

    let placed = root
        .render_and_commit_nested_host_parent_text_placement_for_canary("inserted")
        .unwrap();
    let commit = placed.commit();
    let diagnostics = commit.host_parent_placement_apply_diagnostics_for_canary();

    assert_eq!(placed.render().current(), created.commit().current());
    assert_eq!(commit.previous_current(), created.commit().current());
    assert_eq!(commit.current(), placed.render().finished_work());
    assert_eq!(placed.host_parent_placement_apply_count(), 1);
    assert!(commit.has_test_only_host_parent_placement_apply_for_canary(
        placed.nested_parent_state_node_raw(),
        placed.placed_text_state_node_raw()
    ));
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].parent_tag_name(), "HostComponent");
    assert_eq!(
        diagnostics[0].parent_state_node_raw(),
        placed.nested_parent_state_node_raw()
    );
    assert_eq!(diagnostics[0].tag_name(), "HostText");
    assert_eq!(
        diagnostics[0].state_node_raw(),
        placed.placed_text_state_node_raw()
    );
    assert_eq!(
        diagnostics[0].apply_kind(),
        "append-placement-to-host-parent"
    );
    assert!(diagnostics[0].applies_to_host_parent());
    assert_eq!(placed.commit_diagnostics().mutation_records().len(), 1);
    assert_eq!(
        placed.commit_diagnostics().mutation_records()[0].kind(),
        TestRendererHostOutputCanaryMutationKind::Placement
    );
    assert_eq!(placed.placed_text_snapshot().text(), "inserted");
    assert_eq!(
        nested_container_inner_texts(placed.previous_snapshot()),
        vec!["stable"]
    );
    assert_eq!(
        nested_container_inner_texts(placed.snapshot()),
        vec!["stable", "inserted"]
    );
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        placed.snapshot().clone()
    );
}

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
fn root_sibling_text_host_output_update_commits_real_root_text_before_component() {
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

    assert_eq!(output.previous_snapshot().children().len(), 1);
    assert_eq!(
        container_element_texts(output.previous_snapshot()),
        vec!["second sibling"]
    );
    assert_eq!(output.snapshot().children().len(), 2);
    let TestNodeSnapshot::Text(root_text) = &output.snapshot().children()[0] else {
        panic!("expected root text sibling");
    };
    assert_eq!(root_text.text(), "first sibling");
    let TestNodeSnapshot::Element(component) = &output.snapshot().children()[1] else {
        panic!("expected stable component sibling");
    };
    assert_eq!(component.element_type().as_str(), "span");
    assert_eq!(child_texts(component), vec!["second sibling"]);
    assert_eq!(output.root_text_snapshot().text(), "first sibling");
    assert_eq!(output.root_text_state_node_raw(), 2);
    assert_eq!(output.component_state_node_raw(), 1);
    assert_eq!(output.component_text_state_node_raw(), 1);
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        *output.snapshot()
    );

    let placement_records = output
        .commit()
        .host_root_placement_apply_diagnostics_for_canary();
    assert_eq!(placement_records.len(), 1);
    let placement = placement_records[0];
    assert_eq!(
        placement.apply_kind(),
        "insert-placement-in-container-before"
    );
    assert_eq!(placement.sibling_status(), "insert-before");
    assert_eq!(
        placement.state_node_raw(),
        output.root_text_state_node_raw()
    );
    assert_eq!(
        placement.sibling_state_node_raw(),
        output.component_state_node_raw()
    );
    assert!(placement.can_insert_before());

    let mutation_records = output.commit_diagnostics().mutation_records();
    assert_eq!(mutation_records.len(), 1);
    assert_eq!(
        mutation_records[0].kind(),
        TestRendererHostOutputCanaryMutationKind::Placement
    );
    assert_eq!(
        mutation_records[0].state_node_raw(),
        output.root_text_state_node_raw()
    );
}

#[test]
fn root_sibling_text_host_output_update_exposes_committed_fiber_inspection() {
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
    let inspection = output.fiber_inspection();

    assert_eq!(
        inspection.shape_name(),
        "HostRoot->[HostText,HostComponent->HostText]"
    );
    assert_eq!(inspection.root_children().len(), 2);
    assert_eq!(inspection.host_children().len(), 2);
    assert_eq!(inspection.host_components().len(), 1);
    assert_eq!(inspection.host_texts().len(), 2);
    assert_eq!(
        inspection.host_texts()[0].sibling(),
        Some(inspection.host_component().fiber())
    );
    assert_eq!(inspection.host_texts()[0].index(), 0);
    assert_eq!(inspection.host_component().index(), 1);
    assert_eq!(
        inspection.host_component().child(),
        Some(inspection.host_text().fiber())
    );
    assert_eq!(inspection.host_text().index(), 0);
    assert!(inspection.host_texts()[0].state_node_present());
    assert!(inspection.host_component().state_node_present());
    assert!(inspection.host_text().state_node_present());
    assert_eq!(
        output.root_text_fiber(),
        TestRendererFiberHandleDiagnostics {
            arena_id: inspection.host_texts()[0].fiber().arena_id().get(),
            slot: inspection.host_texts()[0].fiber().slot().get(),
            generation: inspection.host_texts()[0].fiber().generation().get(),
        }
    );
}

#[test]
fn root_private_to_json_sibling_text_host_output_row_uses_real_committed_output() {
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

    let row = root
        .describe_private_to_json_sibling_text_host_output_row_for_canary(&output)
        .unwrap();

    assert_eq!(
        row.id(),
        TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(
        row.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SiblingText
    );
    assert_eq!(row.previous_root_child_count(), 1);
    assert_eq!(row.current_root_child_count(), 2);
    assert_eq!(row.previous_host_component_count(), 1);
    assert_eq!(row.current_host_component_count(), 1);
    assert_eq!(row.previous_host_text_count(), 1);
    assert_eq!(row.current_host_text_count(), 2);
    assert_eq!(row.current_root_text_count(), 1);
    assert_eq!(row.current_max_host_component_depth(), 1);
    assert!(row.dependency_diagnostics().host_output_snapshot_current());
    assert!(row.dependency_diagnostics().public_surfaces_blocked());
    assert!(row.public_blockers().all_blocked());
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
fn root_private_serialization_finished_work_identity_gate_rejects_missing_evidence() {
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

    let error = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(output.render()),
            Some(output.commit()),
            None,
        )
        .unwrap_err();

    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private serialization finished-work identity error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateSerializationFinishedWorkIdentityError::MissingSerializationEvidence {
            public_surface: "create().toJSON"
        }
    ));
}

#[test]
fn root_private_serialization_finished_work_identity_gate_rejects_foreign_evidence() {
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
    let mut report = root
        .describe_private_json_serialization_for_canary(&output)
        .unwrap();
    report.gate.commit.root = FiberRootId::new(root.root_id().raw() + 1).unwrap();

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
        TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
            reason: "serialization-report-root-mismatch"
        }
    ));
}

#[test]
fn root_private_serialization_finished_work_identity_gate_rejects_stale_evidence() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let stale_output = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let stale_report = root
        .describe_private_json_serialization_for_canary(&stale_output)
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    root.render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();

    let error = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(stale_output.render()),
            Some(stale_output.commit()),
            Some(&stale_report),
        )
        .unwrap_err();

    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private serialization finished-work identity error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason: "commit-current-not-root-current"
        }
    ));
}

#[test]
fn root_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence() {
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
    let stale_update = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    let stale_report = root
        .describe_private_json_serialization_after_update_for_canary(&stale_update)
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "later")
        .unwrap();
    root.render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();

    let error = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(stale_update.render()),
            Some(stale_update.commit()),
            Some(&stale_report),
        )
        .unwrap_err();

    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private serialization finished-work identity error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason: "commit-current-not-root-current"
        }
    ));
}

#[test]
fn root_private_serialization_finished_work_identity_gate_rejects_non_committed_identity() {
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
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let render = root
        .render_latest_scheduled_host_root_for_commit_handoff()
        .unwrap()
        .unwrap();

    let error = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(render),
            Some(output.commit()),
            Some(&report),
        )
        .unwrap_err();

    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private serialization finished-work identity error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
            reason: "commit-current-finished-work-mismatch"
        }
    ));
}

#[test]
fn root_private_serialization_finished_work_identity_gate_rejects_lane_mismatch() {
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
    let mut report = root
        .describe_private_json_serialization_for_canary(&output)
        .unwrap();
    report.gate.commit.finished_lanes_bits = 0;

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
        TestRendererPrivateSerializationFinishedWorkIdentityError::LaneMismatch {
            render_lanes_bits: 0,
            commit_finished_lanes_bits
        } if *commit_finished_lanes_bits != 0
    ));
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
fn root_private_to_json_nested_host_output_update_row_records_nested_text_rows() {
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

    let row = root
        .describe_private_to_json_nested_host_output_update_row_for_canary(&placed)
        .unwrap();
    let dependencies = row.dependency_diagnostics();

    assert_eq!(
        row.id(),
        TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID
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
        TestRendererPrivateToJsonHostOutputShape::NestedHostText
    );
    assert_eq!(row.previous_root_child_count(), 1);
    assert_eq!(row.current_root_child_count(), 1);
    assert_eq!(row.previous_host_component_count(), 2);
    assert_eq!(row.current_host_component_count(), 2);
    assert_eq!(row.previous_host_text_count(), 1);
    assert_eq!(row.current_host_text_count(), 2);
    assert_eq!(row.current_root_text_count(), 0);
    assert_eq!(row.current_max_host_component_depth(), 2);
    assert_eq!(
        dependencies.route_row_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID
    );
    assert_eq!(
        dependencies.serialization_row_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_SERIALIZATION_DEPENDENCY_ID
    );
    assert!(dependencies.host_output_snapshot_current());
    assert!(dependencies.public_surfaces_blocked());
    assert!(row.public_blockers().all_blocked());
    assert_eq!(
        nested_container_inner_texts(placed.previous_snapshot()),
        vec!["stable"]
    );
    assert_eq!(
        nested_container_inner_texts(placed.snapshot()),
        vec!["stable", "inserted"]
    );
}

#[test]
fn root_private_to_json_nested_host_output_update_row_rejects_stale_snapshot() {
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
    let mut placed = root
        .render_and_commit_nested_host_parent_text_placement_for_canary("inserted")
        .unwrap();
    placed.snapshot = placed.previous_snapshot.clone();

    let error = root
        .describe_private_to_json_nested_host_output_update_row_for_canary(&placed)
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
fn root_private_to_json_sibling_text_host_output_row_records_text_sibling_shape() {
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

    let row =
        TestRendererRoot::describe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics(
            &previous_snapshot,
            &current_snapshot,
        )
        .unwrap();

    assert_eq!(
        row.id(),
        TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
    );
    assert_eq!(
        row.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        row.host_output_shape(),
        TestRendererPrivateToJsonHostOutputShape::SiblingText
    );
    assert_eq!(row.previous_root_child_count(), 1);
    assert_eq!(row.current_root_child_count(), 2);
    assert_eq!(row.previous_host_component_count(), 1);
    assert_eq!(row.current_host_component_count(), 1);
    assert_eq!(row.previous_host_text_count(), 1);
    assert_eq!(row.current_host_text_count(), 2);
    assert_eq!(row.current_root_text_count(), 1);
    assert_eq!(row.current_max_host_component_depth(), 1);
    assert!(row.dependency_diagnostics().public_surfaces_blocked());
    assert!(row.public_blockers().all_blocked());
}

#[test]
fn root_private_to_json_sibling_text_host_output_row_rejects_mismatched_shape() {
    let previous_snapshot = TestContainerSnapshot { children: vec![] };
    let current_snapshot = TestContainerSnapshot {
        children: vec![TestNodeSnapshot::Element(TestElementSnapshot {
            element_type: element_type("span"),
            props: TestProps::new(),
            hidden: false,
            detached: false,
            children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                text: "only child".to_owned(),
                hidden: false,
            })],
        })],
    };

    let error =
        TestRendererRoot::describe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics(
            &previous_snapshot,
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
            expected: TestRendererPrivateToJsonHostOutputShape::SiblingText,
            actual: TestRendererPrivateToJsonHostOutputShape::SingleHostText,
        } if *row_id == TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
    ));
}

#[test]
fn root_private_to_json_update_host_output_row_rejects_mismatched_row_kind() {
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
    let mut report = root
        .describe_private_json_serialization_after_update_for_canary(&updated)
        .unwrap();
    let mut row = report.host_output_row().unwrap();
    row.host_output_update_kind = TestRendererRootUpdateKind::Unmount;
    report.host_output_row = Some(row);

    let error = TestRendererRoot::private_to_json_facade_result_from_report(&report).unwrap_err();

    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON serialization error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
            row_id,
            expected: TestRendererRootUpdateKind::Update,
            actual: TestRendererRootUpdateKind::Unmount,
        } if *row_id == TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
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

#[test]
fn root_host_output_canary_updates_committed_text_with_update_diagnostics() {
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
    let create_current = created.completed_fibers().current();
    let outcome = root
        .update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let scheduled = outcome.scheduled().unwrap();

    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    let render = updated.render();
    let commit = updated.commit();
    let fibers = updated.updated_fibers();
    let diagnostics = updated.commit_diagnostics();

    assert_eq!(scheduled.kind(), TestRendererRootUpdateKind::Update);
    assert_eq!(scheduled.element(), root_element(2));
    assert_eq!(render.root(), root.root_id());
    assert_eq!(render.current(), created.commit().current());
    assert_eq!(render.resulting_element(), root_element(2));
    assert_eq!(commit.previous_current(), created.commit().current());
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(fibers.previous(), create_current);
    assert_eq!(fibers.current().host_root(), render.finished_work());
    assert_ne!(fibers.current().component(), create_current.component());
    assert_ne!(fibers.current().text(), create_current.text());
    assert_eq!(fibers.component_state_node_raw(), 1);
    assert_eq!(fibers.text_state_node_raw(), 1);
    assert!(fibers.component_props_changed());
    assert!(fibers.text_props_changed());
    assert_eq!(root.store().host_tokens().len(), 3);
    assert_eq!(host_storage_counts(&root), (1, 1, 1));
    assert_eq!(host_node_activity_counts(&root), (2, 0));
    assert!(diagnostics.deletion_lists().is_empty());
    assert_eq!(diagnostics.mutation_records().len(), 2);
    let text_mutation = diagnostics.mutation_records()[0];
    assert_eq!(
        text_mutation.kind(),
        TestRendererHostOutputCanaryMutationKind::Update
    );
    assert_eq!(text_mutation.fiber(), fibers.current().text());
    assert_eq!(text_mutation.host_root(), render.finished_work());
    assert_eq!(text_mutation.state_node_raw(), 1);
    assert_eq!(text_mutation.pending_props_raw(), 4);
    assert_eq!(text_mutation.memoized_props_raw(), 4);
    assert_eq!(text_mutation.alternate_memoized_props_raw(), Some(2));
    let mutation = diagnostics.mutation_records()[1];
    assert_eq!(
        mutation.kind(),
        TestRendererHostOutputCanaryMutationKind::Update
    );
    assert_eq!(mutation.fiber(), fibers.component());
    assert_eq!(mutation.host_root(), render.finished_work());
    assert_eq!(mutation.state_node_raw(), 1);
    assert_eq!(mutation.pending_props_raw(), 3);
    assert_eq!(mutation.memoized_props_raw(), 3);
    assert_eq!(mutation.alternate_memoized_props_raw(), Some(1));
    assert_eq!(
        commit.test_only_host_component_update_apply_count_for_canary(),
        1
    );
    assert_eq!(
        commit.test_only_host_text_update_apply_count_for_canary(),
        1
    );
    assert!(commit.has_test_only_host_text_update_apply_for_canary(
        create_current.text(),
        fibers.current().text(),
        1
    ));

    let TestNodeSnapshot::Element(previous) = &updated.previous_snapshot().children()[0] else {
        panic!("expected previous host component");
    };
    assert_eq!(child_texts(previous), vec!["hello"]);
    let TestNodeSnapshot::Element(element) = &updated.snapshot().children()[0] else {
        panic!("expected updated host component");
    };
    assert_eq!(element.element_type().as_str(), "span");
    assert_eq!(child_texts(element), vec!["goodbye"]);
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        updated.snapshot().clone()
    );
    assert_eq!(current_host_root_element(&root), root_element(2));
}

#[test]
fn root_private_update_route_consumes_root_work_loop_update_queue_and_text_update_metadata() {
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
    let scheduled = root.last_scheduled_update().unwrap().clone();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();

    let diagnostics = root
        .describe_private_update_route_via_root_work_loop_for_canary(&updated)
        .unwrap();
    let queue = diagnostics.update_queue();
    let work_loop = diagnostics.root_work_loop();
    let host_text = diagnostics.host_text_update();
    let admission = diagnostics.admission();

    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME
    );
    assert_eq!(
        diagnostics.status(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS
    );
    assert_eq!(diagnostics.root(), root.root_id());
    assert_eq!(
        diagnostics.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert!(diagnostics.consumes_accepted_host_root_update_queue_metadata());
    assert!(diagnostics.consumes_accepted_root_work_loop_metadata());
    assert!(diagnostics.consumes_manual_host_output_canary());
    assert!(!diagnostics.public_root_update_available());
    assert!(!diagnostics.public_serialization_available());
    assert!(!diagnostics.native_execution_available());
    assert!(!diagnostics.compatibility_claimed());

    assert_eq!(
        admission.record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
    );
    assert_eq!(
        admission.status(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
    );
    assert_eq!(admission.public_surface(), "create().update");
    assert_eq!(admission.root(), root.root_id());
    assert_eq!(admission.request_api(), "TestRendererRoot::update");
    assert_eq!(
        admission.source_diagnostic_name(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME
    );
    assert_eq!(
        admission.source_diagnostic_status(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS
    );
    assert_eq!(admission.lifecycle(), TestRendererRootLifecycle::Active);
    assert_eq!(
        admission.scheduled_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        admission.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert!(admission.consumes_accepted_host_root_update_queue_metadata());
    assert!(admission.consumes_accepted_root_work_loop_metadata());
    assert!(admission.consumes_accepted_host_output_metadata());
    assert!(admission.rejects_stale_root_lifecycle());
    assert!(admission.rejects_stale_host_output());
    assert!(admission.rejects_missing_update_queue_evidence());
    assert!(!admission.public_root_update_available());
    assert!(!admission.public_serialization_available());
    assert!(!admission.native_execution_available());
    assert!(!admission.compatibility_claimed());

    assert_eq!(queue.root(), root.root_id());
    assert_eq!(
        queue.scheduled_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(queue.scheduled_element(), root_element(2));
    assert_eq!(
        queue.update_raw(),
        scheduled.container_update().update().raw()
    );
    assert_eq!(
        queue.queue_raw(),
        scheduled.container_update().queue().raw()
    );
    assert_eq!(
        queue.schedule_fiber().slot(),
        updated.render().current().slot().get()
    );
    assert_eq!(
        queue.lane_bits(),
        scheduled.container_update().lane().bits()
    );
    assert_eq!(queue.pending_lanes_before_enqueue_bits(), 0);
    assert_eq!(
        queue.pending_lanes_after_enqueue_bits(),
        updated.render().render_lanes().bits()
    );
    assert_eq!(
        queue.selected_next_lanes_bits(),
        updated.render().render_lanes().bits()
    );
    assert_eq!(
        queue.render_lanes_bits(),
        updated.render().render_lanes().bits()
    );
    assert!(queue.queue_matches_render_current_queue());
    assert!(queue.selected_lanes_match_render_lanes());
    assert!(queue.pending_lanes_after_enqueue_match_render_lanes());
    assert_eq!(
        queue.root_schedule_inserted(),
        scheduled.root_schedule().inserted()
    );
    assert_eq!(
        queue.root_schedule_microtask_requested(),
        scheduled.root_schedule().microtask().is_some()
    );
    assert_eq!(
        queue.root_schedule_might_have_pending_sync_work(),
        scheduled.root_schedule().might_have_pending_sync_work()
    );

    assert_eq!(work_loop.root(), root.root_id());
    assert_eq!(
        work_loop.render_current().slot(),
        updated.render().current().slot().get()
    );
    assert_eq!(
        work_loop.render_finished_work().slot(),
        updated.render().finished_work().slot().get()
    );
    assert_eq!(
        work_loop.commit_current().slot(),
        updated.commit().current().slot().get()
    );
    assert_eq!(
        work_loop.current_update_queue_raw(),
        updated.render().current_update_queue().raw()
    );
    assert_eq!(
        work_loop.work_in_progress_update_queue_raw(),
        updated.render().work_in_progress_update_queue().raw()
    );
    assert_eq!(
        work_loop.committed_current_update_queue_raw(),
        updated.render().work_in_progress_update_queue().raw()
    );
    assert_eq!(work_loop.applied_update_count(), 1);
    assert_eq!(work_loop.skipped_update_count(), 0);
    assert!(work_loop.remaining_lanes_empty());
    assert_eq!(
        work_loop.commit_finished_lanes_bits(),
        updated.render().render_lanes().bits()
    );
    assert!(work_loop.commit_remaining_lanes_empty());
    assert!(work_loop.commit_pending_lanes_empty());
    assert!(work_loop.commit_current_matches_render_finished_work());
    assert!(work_loop.commit_previous_current_matches_render_current());
    assert!(work_loop.commit_lanes_match_render_lanes());
    assert!(work_loop.committed_current_queue_matches_work_in_progress());
    assert!(work_loop.root_current_matches_commit_current());

    assert_eq!(
        host_text.previous_text_fiber().slot(),
        updated.updated_fibers().previous().text().slot().get()
    );
    assert_eq!(
        host_text.updated_text_fiber().slot(),
        updated.updated_fibers().current().text().slot().get()
    );
    assert_eq!(host_text.text_state_node_raw(), 1);
    assert!(host_text.text_update_apply_recorded());
    assert_eq!(host_text.host_text_update_apply_count(), 1);
    assert_eq!(host_text.host_component_update_apply_count(), 1);
}

#[test]
fn root_private_update_route_admission_record_consumes_update_work_loop_diagnostics() {
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

    let admission = root
        .describe_private_update_route_admission_for_canary(&updated)
        .unwrap();

    assert_eq!(
        admission.record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
    );
    assert_eq!(
        admission.status(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
    );
    assert_eq!(admission.request_api(), "TestRendererRoot::update");
    assert!(admission.consumes_accepted_host_root_update_queue_metadata());
    assert!(admission.consumes_accepted_root_work_loop_metadata());
    assert!(admission.consumes_accepted_host_output_metadata());
    assert!(!admission.public_root_update_available());
    assert!(!admission.public_serialization_available());
    assert!(!admission.native_execution_available());
    assert!(!admission.compatibility_claimed());
}

#[test]
fn root_private_update_route_rejects_stale_root_update_output() {
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
    let stale = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "later")
        .unwrap();
    root.render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();

    let error = root
        .describe_private_update_route_via_root_work_loop_for_canary(&stale)
        .unwrap_err();

    let TestRendererRootError::SerializationGate(error) = error else {
        panic!("expected stale commit rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererSerializationGateError::CommitIsNotCurrent { root: error_root, .. }
            if *error_root == root.root_id()
    ));
}

#[test]
fn root_private_update_route_rejects_missing_update_queue_evidence() {
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
    root.scheduled_updates.clear();

    let error = root
        .describe_private_update_route_via_root_work_loop_for_canary(&updated)
        .unwrap_err();

    let TestRendererRootError::PrivateUpdateRoute(error) = error else {
        panic!("expected private update route rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateUpdateRouteError::MissingScheduledUpdate
    ));
}

#[test]
fn root_private_update_route_rejects_unmounted_root() {
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
    root.unmount().unwrap();

    let error = root
        .describe_private_update_route_via_root_work_loop_for_canary(&updated)
        .unwrap_err();

    let TestRendererRootError::PrivateUpdateRoute(error) = error else {
        panic!("expected private update route rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateUpdateRouteError::RootNotActive {
            lifecycle: TestRendererRootLifecycle::UnmountScheduled
        }
    ));
}

#[test]
fn root_private_update_route_rejects_incompatible_finished_work_record() {
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
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let mut incompatible = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    incompatible.render = created.render();

    let error = root
        .describe_private_update_route_via_root_work_loop_for_canary(&incompatible)
        .unwrap_err();

    let TestRendererRootError::PrivateUpdateRoute(error) = error else {
        panic!("expected private update route rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
            reason: "commit-current-finished-work-mismatch"
        }
    ));
}

#[test]
fn root_private_update_native_bridge_admission_consumes_actual_update_host_output_handoff() {
    let initial_props = props().with_attribute("data-state", "old");
    let updated_props = props().with_attribute("data-state", "new");
    let mut root = TestRendererRoot::create_host_component_with_props_and_text_for_canary(
        "span",
        initial_props.clone(),
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();

    let (outcome, updated, admission) = root
        .render_and_admit_private_update_native_bridge_handoff_for_canary(
            "span",
            updated_props.clone(),
            "goodbye",
        )
        .unwrap();

    assert!(matches!(
        outcome,
        TestRendererRootUpdateOutcome::Scheduled(_)
    ));
    assert!(updated.updated_fibers().component_props_changed());
    assert!(updated.updated_fibers().text_props_changed());
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
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        *updated.snapshot()
    );

    assert_eq!(
        admission.diagnostic_id(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        admission.status(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
    );
    assert_eq!(admission.root(), root.root_id());
    assert_eq!(
        admission.route_dependency_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID
    );
    assert_eq!(
        admission.update_route_admission_id(),
        TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
    );
    assert_eq!(admission.lifecycle(), TestRendererRootLifecycle::Active);
    assert_eq!(
        admission.scheduled_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        admission.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert!(admission.update_route_admission_accepted());
    assert!(admission.lifecycle_evidence_accepted());
    assert!(admission.root_work_loop_handoff_accepted());
    assert!(admission.host_output_handoff_accepted());
    assert!(admission.text_update_apply_recorded());
    assert_eq!(admission.host_text_update_apply_count(), 1);
    assert_eq!(admission.host_component_update_apply_count(), 1);
    assert!(admission.rejects_stale_update_handoffs());
    assert!(admission.rejects_unmounted_roots());
    assert!(admission.rejects_missing_host_output_handoff());
    assert!(!admission.public_update_compatibility_claimed());
    assert!(!admission.public_serialization_available());
    assert!(!admission.act_flushing_claimed());
    assert!(!admission.native_bridge_available());
    assert!(!admission.native_execution());
    assert!(admission.rust_execution_from_js());
    assert!(admission.reconciler_execution_from_js());
    assert!(!admission.compatibility_claimed());
}

#[test]
fn root_private_update_native_bridge_admission_consumes_prop_style_text_update_execution() {
    let initial_props = props()
        .with_attribute("data-state", "old")
        .with_style("color", "red");
    let updated_props = props()
        .with_attribute("data-state", "new")
        .with_style("color", "blue");
    let mut root = TestRendererRoot::create_host_component_with_props_and_text_for_canary(
        "span",
        initial_props.clone(),
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();

    let (_outcome, updated, admission) = root
        .render_and_admit_private_update_native_bridge_handoff_for_canary(
            "span",
            updated_props.clone(),
            "goodbye",
        )
        .unwrap();
    let route = root
        .describe_private_update_route_via_root_work_loop_for_canary(&updated)
        .unwrap();
    let host_output = route.host_text_update();

    assert!(updated.updated_fibers().component_props_changed());
    assert!(updated.updated_fibers().text_props_changed());
    let TestNodeSnapshot::Element(previous) = &updated.previous_snapshot().children()[0] else {
        panic!("expected previous host component");
    };
    assert_eq!(previous.props(), &initial_props);
    assert_eq!(
        previous.props().styles().get("color").map(String::as_str),
        Some("red")
    );
    assert_eq!(child_texts(previous), vec!["hello"]);
    let TestNodeSnapshot::Element(current) = &updated.snapshot().children()[0] else {
        panic!("expected updated host component");
    };
    assert_eq!(current.props(), &updated_props);
    assert_eq!(
        current.props().styles().get("color").map(String::as_str),
        Some("blue")
    );
    assert_eq!(child_texts(current), vec!["goodbye"]);

    assert!(host_output.host_component_prop_update_recorded());
    assert!(host_output.host_component_style_update_recorded());
    assert!(host_output.text_update_apply_recorded());
    assert_eq!(host_output.host_component_update_apply_count(), 1);
    assert_eq!(host_output.host_text_update_apply_count(), 1);
    assert!(admission.host_component_prop_update_recorded());
    assert!(admission.host_component_style_update_recorded());
    assert!(admission.text_update_apply_recorded());
    assert!(admission.update_route_admission_accepted());
    assert!(admission.host_output_handoff_accepted());
    assert!(!admission.public_update_compatibility_claimed());
    assert!(!admission.public_serialization_available());
    assert!(!admission.native_bridge_available());
    assert!(!admission.native_execution());
    assert!(!admission.compatibility_claimed());
}

#[test]
fn root_private_update_native_bridge_admission_rejects_missing_handoff() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let outcome = root
        .update_host_component_with_props_and_text_for_canary(
            "span",
            props().with_attribute("data-state", "new"),
            "goodbye",
        )
        .unwrap();

    let error = root
        .describe_private_update_native_bridge_admission_for_canary(&outcome, None)
        .unwrap_err();

    let TestRendererRootError::PrivateUpdateNativeBridgeAdmission(error) = error else {
        panic!("expected private update native bridge admission rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateUpdateNativeBridgeAdmissionError::MissingHostOutputHandoff
    ));
}

#[test]
fn root_private_update_native_bridge_admission_rejects_stale_route_outcome() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let stale_outcome = root
        .update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let stale_handoff = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "later")
        .unwrap();
    root.render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();

    let error = root
        .describe_private_update_native_bridge_admission_for_canary(
            &stale_outcome,
            Some(&stale_handoff),
        )
        .unwrap_err();

    let TestRendererRootError::PrivateUpdateNativeBridgeAdmission(error) = error else {
        panic!("expected private update native bridge admission rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateUpdateNativeBridgeAdmissionError::StaleRouteOutcome
    ));
}

#[test]
fn root_host_output_canary_inserts_placed_child_before_stable_sibling() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "Stable",
        "stable",
        TestRendererOptions::new(),
    )
    .unwrap();
    let created = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let outcome = root
        .insert_host_component_with_text_before_stable_sibling_for_canary("Inserted", "inserted")
        .unwrap();
    let scheduled = outcome.scheduled().unwrap();

    let inserted = root
        .render_and_commit_host_output_insert_before_stable_sibling_for_canary()
        .unwrap()
        .unwrap();
    let diagnostics = inserted.insertion_diagnostics();
    let commit_diagnostics = inserted.commit_diagnostics();

    assert_eq!(scheduled.kind(), TestRendererRootUpdateKind::Update);
    assert_eq!(scheduled.element(), root_element(2));
    assert_eq!(inserted.render().current(), created.commit().current());
    assert_eq!(
        inserted.commit().previous_current(),
        created.commit().current()
    );
    assert_eq!(
        inserted.commit().current(),
        inserted.render().finished_work()
    );
    assert_eq!(
        inserted.stable_fibers().previous(),
        created.completed_fibers().current()
    );
    assert_eq!(
        inserted.stable_fibers().component_state_node_raw(),
        created.completed_fibers().component_state_node_raw()
    );
    assert_eq!(inserted.inserted_fibers().component_state_node_raw(), 2);
    assert_eq!(inserted.inserted_fibers().text_state_node_raw(), 2);
    assert_eq!(
        diagnostics.apply_kind(),
        TestRendererStableSiblingInsertionApplyKind::InsertInContainerBefore
    );
    assert_eq!(
        diagnostics.sibling_status(),
        TestRendererStableSiblingInsertionSiblingStatus::InsertBefore
    );
    assert_eq!(
        diagnostics.mutation_status(),
        TestRendererStableSiblingInsertionMutationStatus::AppliedInsertInContainerBefore
    );
    assert!(diagnostics.can_insert_before());
    assert_eq!(diagnostics.state_node_raw(), 2);
    assert_eq!(diagnostics.sibling_state_node_raw(), 1);
    assert_eq!(
        diagnostics.fiber().slot(),
        inserted.inserted_fibers().component().slot().get()
    );
    assert_eq!(
        diagnostics.sibling().unwrap().slot(),
        inserted.stable_fibers().component().slot().get()
    );
    assert_eq!(commit_diagnostics.mutation_records().len(), 1);
    assert_eq!(
        commit_diagnostics.mutation_records()[0].kind(),
        TestRendererHostOutputCanaryMutationKind::Placement
    );
    assert_eq!(
        commit_diagnostics.mutation_records()[0].fiber(),
        inserted.inserted_fibers().component()
    );
    assert_eq!(
        container_element_texts(inserted.previous_snapshot()),
        vec!["stable"]
    );
    assert_eq!(
        container_element_names(inserted.snapshot()),
        vec!["Inserted", "Stable"]
    );
    assert_eq!(
        container_element_texts(inserted.snapshot()),
        vec!["inserted", "stable"]
    );
    assert_eq!(host_storage_counts(&root), (1, 2, 2));
    assert!(root.current_host_output.is_none());
}

#[test]
fn root_host_output_canary_keeps_ambiguous_sibling_insertion_recorded_only() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "Stable",
        "stable",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.insert_host_component_with_text_before_stable_sibling_for_canary("Inserted", "inserted")
        .unwrap();

    let blocked = root
        .render_and_commit_host_output_insert_before_ambiguous_sibling_for_canary()
        .unwrap()
        .unwrap();
    let diagnostics = blocked.insertion_diagnostics();

    assert_eq!(
        diagnostics.apply_kind(),
        TestRendererStableSiblingInsertionApplyKind::InsertionBlocked
    );
    assert_eq!(
        diagnostics.sibling_status(),
        TestRendererStableSiblingInsertionSiblingStatus::BlockedMissingStateNode
    );
    assert_eq!(
        diagnostics.mutation_status(),
        TestRendererStableSiblingInsertionMutationStatus::RecordedOnly
    );
    assert!(!diagnostics.can_insert_before());
    assert_eq!(diagnostics.state_node_raw(), 2);
    assert_eq!(diagnostics.sibling_state_node_raw(), 0);
    assert_eq!(blocked.commit_diagnostics().mutation_records().len(), 1);
    assert_eq!(
        blocked.commit_diagnostics().mutation_records()[0].fiber(),
        blocked.inserted_fibers().component()
    );
    assert_eq!(
        container_element_texts(blocked.previous_snapshot()),
        vec!["stable"]
    );
    assert_eq!(container_element_texts(blocked.snapshot()), vec!["stable"]);
    assert_eq!(host_storage_counts(&root), (1, 2, 2));
    assert!(root.current_host_output.is_none());
}

#[test]
fn root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics() {
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
    let current = created.completed_fibers().current();
    let outcome = root.unmount().unwrap();
    let scheduled = outcome.scheduled().unwrap();

    let unmounted = root
        .render_and_commit_host_output_unmount_for_canary()
        .unwrap()
        .unwrap();
    let render = unmounted.render();
    let commit = unmounted.commit();
    let deleted = unmounted.deleted_fibers();
    let diagnostics = unmounted.commit_diagnostics();
    let cleanup = unmounted.host_node_cleanup();
    let cleanup_records = cleanup.records();
    let order_gate = commit.deletion_cleanup_order_gate_for_canary();
    let order_records = order_gate.records();
    let handoff = root
        .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
        .unwrap();
    let admission = root
        .describe_private_unmount_native_bridge_admission_for_canary(&outcome, Some(&handoff))
        .unwrap();
    let detachment_blockers = handoff.host_child_detachment_blockers();
    let passive_ref_order = handoff.passive_ref_cleanup_order();

    assert_eq!(scheduled.kind(), TestRendererRootUpdateKind::Unmount);
    assert_eq!(scheduled.element(), RootElementHandle::NONE);
    assert_eq!(
        root.lifecycle(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(render.root(), root.root_id());
    assert_eq!(render.current(), created.commit().current());
    assert_eq!(render.resulting_element(), RootElementHandle::NONE);
    assert_eq!(commit.previous_current(), created.commit().current());
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(deleted.current(), current);
    assert_eq!(deleted.host_root(), render.finished_work());
    assert_eq!(deleted.deleted_component(), current.component());
    assert_eq!(deleted.deleted_text(), current.text());
    assert_eq!(root.store().host_tokens().len(), 5);
    assert!(diagnostics.mutation_records().is_empty());
    assert_eq!(diagnostics.deletion_lists().len(), 1);
    assert_eq!(
        diagnostics.deletion_lists()[0].parent(),
        render.finished_work()
    );
    assert_eq!(
        diagnostics.deletion_lists()[0].deleted(),
        &[current.component()]
    );
    assert_eq!(cleanup.root(), root.root_id());
    assert_eq!(cleanup.len(), 2);
    assert!(!cleanup.is_empty());
    assert_eq!(cleanup.active_instance_count(), 0);
    assert_eq!(cleanup.active_text_count(), 0);
    assert_eq!(cleanup.inactive_instance_count(), 1);
    assert_eq!(cleanup.inactive_text_count(), 1);
    assert!(!cleanup.public_unmount_compatibility_claimed());
    assert_eq!(cleanup_records[0].sequence(), 0);
    assert_eq!(cleanup_records[0].deletion_list_index(), 0);
    assert_eq!(cleanup_records[0].deleted_index(), 0);
    assert_eq!(cleanup_records[0].subtree_index(), 0);
    assert_eq!(
        cleanup_records[0].target(),
        Some(TestRendererHostNodeCleanupTarget::Text)
    );
    assert_eq!(
        cleanup_records[0].status(),
        TestRendererHostNodeCleanupStatus::Invalidated
    );
    assert_eq!(
        cleanup_records[0].parent().slot(),
        render.finished_work().slot().get()
    );
    assert_eq!(
        cleanup_records[0].deleted_root().slot(),
        current.component().slot().get()
    );
    assert_eq!(
        cleanup_records[0].fiber().slot(),
        current.text().slot().get()
    );
    assert_eq!(cleanup_records[0].state_node_raw(), 1);
    assert_eq!(cleanup_records[0].token_raw(), 4);
    assert_eq!(
        cleanup_records[0].token_phase(),
        HostFiberTokenPhase::Deletion
    );
    assert_eq!(cleanup_records[1].sequence(), 1);
    assert_eq!(cleanup_records[1].deletion_list_index(), 0);
    assert_eq!(cleanup_records[1].deleted_index(), 0);
    assert_eq!(cleanup_records[1].subtree_index(), 1);
    assert_eq!(
        cleanup_records[1].target(),
        Some(TestRendererHostNodeCleanupTarget::Instance)
    );
    assert_eq!(
        cleanup_records[1].status(),
        TestRendererHostNodeCleanupStatus::Invalidated
    );
    assert_eq!(
        cleanup_records[1].deleted_root().slot(),
        current.component().slot().get()
    );
    assert_eq!(
        cleanup_records[1].fiber().slot(),
        current.component().slot().get()
    );
    assert_eq!(cleanup_records[1].state_node_raw(), 1);
    assert_eq!(cleanup_records[1].token_raw(), 5);
    assert_eq!(order_gate.len(), 2);
    assert_eq!(order_gate.ref_cleanup_return_count(), 0);
    assert_eq!(order_gate.passive_destroy_count(), 0);
    assert_eq!(order_gate.host_node_cleanup_count(), 2);
    assert!(!order_gate.ref_cleanup_return_callbacks_invoked());
    assert!(!order_gate.passive_destroy_callbacks_invoked());
    assert!(!order_gate.public_effects_flushed());
    assert!(!order_gate.public_ref_or_effect_compatibility_claimed());
    assert_eq!(order_records[0].sequence(), 0);
    assert_eq!(order_records[0].phase_name(), "host-node-cleanup");
    assert_eq!(order_records[0].host_cleanup_sequence(), Some(0));
    assert_eq!(
        order_records[0].deletion_list_index(),
        Some(cleanup_records[0].deletion_list_index())
    );
    assert_eq!(
        order_records[0].deleted_index(),
        Some(cleanup_records[0].deleted_index())
    );
    assert_eq!(
        order_records[0].subtree_index(),
        Some(cleanup_records[0].subtree_index())
    );
    assert_eq!(order_records[1].sequence(), 1);
    assert_eq!(order_records[1].phase_name(), "host-node-cleanup");
    assert_eq!(order_records[1].host_cleanup_sequence(), Some(1));
    assert_eq!(
        order_records[1].subtree_index(),
        Some(cleanup_records[1].subtree_index())
    );
    assert_eq!(host_node_activity_counts(&root), (0, 2));
    assert_eq!(unmounted.previous_snapshot().children().len(), 1);
    assert!(unmounted.snapshot().children().is_empty());
    assert!(unmounted.detached_instance_snapshot().is_detached());
    assert!(unmounted.detached_instance_snapshot().children().is_empty());
    assert_eq!(
        handoff.diagnostic_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
    );
    assert_eq!(
        handoff.status(),
        TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_STATUS
    );
    assert_eq!(handoff.root(), root.root_id());
    assert_eq!(
        handoff.lifecycle(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(
        handoff.scheduled_update_kind(),
        TestRendererRootUpdateKind::Unmount
    );
    assert_eq!(handoff.scheduled_element(), RootElementHandle::NONE);
    assert!(handoff.scheduled_element_is_none());
    assert_eq!(
        handoff.render_current().slot(),
        render.current().slot().get()
    );
    assert_eq!(
        handoff.commit_previous_current().slot(),
        commit.previous_current().slot().get()
    );
    assert_eq!(
        handoff.commit_current().slot(),
        commit.current().slot().get()
    );
    assert_eq!(
        handoff.render_finished_work().slot(),
        render.finished_work().slot().get()
    );
    assert_eq!(
        handoff.deleted_root().slot(),
        render.finished_work().slot().get()
    );
    assert_eq!(
        handoff.deleted_component().slot(),
        current.component().slot().get()
    );
    assert_eq!(handoff.deleted_text().slot(), current.text().slot().get());
    assert!(handoff.commit_current_is_store_current());
    assert!(handoff.render_current_matches_commit_previous_current());
    assert!(handoff.render_finished_work_matches_commit_current());
    assert_eq!(handoff.deletion_list_count(), 1);
    assert_eq!(handoff.deleted_root_count(), 1);
    assert_eq!(handoff.host_node_cleanup_count(), 2);
    assert!(handoff.cleanup_records_match_deletion_commit());
    assert_eq!(handoff.cleanup_order_record_count(), 2);
    assert_eq!(
        passive_ref_order.diagnostic_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_DIAGNOSTIC_ID
    );
    assert_eq!(
        passive_ref_order.status(),
        TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_STATUS
    );
    assert_eq!(passive_ref_order.root(), root.root_id());
    assert_eq!(passive_ref_order.ref_cleanup_return_count(), 0);
    assert_eq!(passive_ref_order.passive_destroy_count(), 0);
    assert_eq!(passive_ref_order.host_node_cleanup_count(), 2);
    assert_eq!(passive_ref_order.cleanup_order_record_count(), 2);
    assert_eq!(passive_ref_order.first_host_node_cleanup_order(), Some(0));
    assert_eq!(passive_ref_order.last_ref_cleanup_return_order(), None);
    assert_eq!(passive_ref_order.first_passive_destroy_order(), None);
    assert_eq!(passive_ref_order.last_passive_destroy_order(), None);
    assert!(passive_ref_order.ref_cleanup_return_precedes_passive_destroy());
    assert!(passive_ref_order.host_cleanup_follows_ref_cleanup_return());
    assert!(passive_ref_order.host_cleanup_follows_passive_destroy());
    assert!(passive_ref_order.native_cleanup_after_ref_and_passive_ordering());
    assert!(passive_ref_order.minimal_tree_ordering_is_host_cleanup_only());
    assert!(!passive_ref_order.ref_cleanup_return_callbacks_invoked());
    assert!(!passive_ref_order.passive_destroy_callbacks_invoked());
    assert!(!passive_ref_order.public_effects_flushed());
    assert!(!passive_ref_order.public_ref_or_effect_compatibility_claimed());
    assert!(!passive_ref_order.public_unmount_compatibility_claimed());
    assert!(!passive_ref_order.act_flushing_claimed());
    assert!(!handoff.public_unmount_compatibility_claimed());
    assert!(!handoff.public_host_teardown_compatibility_claimed());
    assert!(!handoff.act_flushing_claimed());
    assert!(detachment_blockers.detached_instance());
    assert_eq!(detachment_blockers.detached_instance_child_count(), 0);
    assert_eq!(detachment_blockers.host_node_cleanup_invalidated_count(), 2);
    assert_eq!(
        detachment_blockers.host_node_cleanup_already_inactive_count(),
        0
    );
    assert_eq!(
        detachment_blockers.host_node_cleanup_missing_host_node_count(),
        0
    );
    assert_eq!(
        detachment_blockers.host_node_cleanup_missing_state_node_count(),
        0
    );
    assert!(detachment_blockers.broad_host_child_detachment_blocked());
    assert!(!detachment_blockers.public_host_teardown_compatibility_claimed());
    assert!(!detachment_blockers.public_unmount_compatibility_claimed());
    assert!(!detachment_blockers.act_flushing_claimed());
    assert_eq!(
        admission.diagnostic_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        admission.status(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS
    );
    assert_eq!(admission.root(), root.root_id());
    assert_eq!(
        admission.route_dependency_id(),
        TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
    );
    assert_eq!(
        admission.deletion_commit_handoff_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
    );
    assert_eq!(
        admission.cleanup_handoff_id(),
        TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID
    );
    assert_eq!(
        admission.lifecycle(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(
        admission.scheduled_update_kind(),
        TestRendererRootUpdateKind::Unmount
    );
    assert!(admission.scheduled_element_is_none());
    assert!(admission.deletion_commit_handoff_accepted());
    assert!(admission.cleanup_handoff_accepted());
    assert!(admission.lifecycle_evidence_accepted());
    assert!(admission.cleanup_blockers_accepted());
    assert!(admission.passive_ref_cleanup_order_accepted());
    assert_eq!(admission.host_node_cleanup_count(), 2);
    assert_eq!(admission.ref_cleanup_return_count(), 0);
    assert_eq!(admission.passive_destroy_count(), 0);
    assert_eq!(admission.cleanup_order_record_count(), 2);
    assert!(admission.native_cleanup_after_ref_and_passive_ordering());
    assert!(admission.rust_unmount_cleanup_handoff_executed());
    assert!(admission.host_output_produced());
    assert!(admission.minimal_tree_cleanup_handoff());
    assert!(admission.rejects_already_unmounted_roots());
    assert!(admission.rejects_stale_deletion_handoffs());
    assert!(admission.rejects_missing_cleanup_blockers());
    assert!(!admission.public_unmount_compatibility_claimed());
    assert!(!admission.public_host_teardown_compatibility_claimed());
    assert!(!admission.act_flushing_claimed());
    assert!(!admission.native_bridge_available());
    assert!(!admission.native_execution());
    assert_eq!(host_storage_counts(&root), (1, 1, 1));
    assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
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
fn root_host_output_unmount_canary_rejects_already_unmounted_root_record() {
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
    root.render_and_commit_host_output_unmount_for_canary()
        .unwrap()
        .unwrap();

    assert_eq!(
        root.unmount().unwrap(),
        TestRendererRootUpdateOutcome::AlreadyUnmountScheduled
    );
    let error = root
        .render_and_commit_host_output_unmount_for_canary()
        .unwrap_err();

    assert!(matches!(
        error,
        TestRendererRootError::MissingCommittedHostOutput {
            operation: TestRendererRootUpdateKind::Unmount
        }
    ));
}

#[test]
fn root_host_output_update_canary_fails_closed_without_committed_output() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let current = root.store().root(root.root_id()).unwrap().current();

    let error = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap_err();

    assert!(matches!(
        error,
        TestRendererRootError::MissingCommittedHostOutput {
            operation: TestRendererRootUpdateKind::Update
        }
    ));
    assert_eq!(
        root.store().root(root.root_id()).unwrap().current(),
        current
    );
    assert_eq!(host_storage_counts(&root), (1, 0, 0));
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn root_host_output_canary_rejects_non_fixture_element_without_mutation() {
    let mut root = TestRendererRoot::create(root_element(99), TestRendererOptions::new()).unwrap();
    let current = root.store().root(root.root_id()).unwrap().current();

    let error = root.render_and_commit_host_output_for_canary().unwrap_err();

    assert!(matches!(
        error,
        TestRendererRootError::MissingHostOutputFixture { element }
            if element == root_element(99)
    ));
    assert_eq!(
        root.store().root(root.root_id()).unwrap().current(),
        current
    );
    assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
    assert_eq!(host_storage_counts(&root), (1, 0, 0));
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn root_serialization_gate_sees_private_committed_fiber_inspection_after_host_output() {
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
    let commit = output.commit();

    let report = root
        .require_serialization_gate_ready_for_canary(commit)
        .unwrap();
    let requirements = report.requirements();
    let fiber_inspection = report.fiber_inspection().unwrap();

    assert_eq!(
        report.status(),
        TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
    );
    assert!(report.is_ready());
    assert!(requirements.root_commit_diagnostics_available());
    assert!(requirements.real_host_output_available());
    assert!(requirements.committed_fiber_inspection_available());
    assert!(requirements.private_serialization_ready());
    assert!(!report.oracle().compatibility_claimed());
    assert_eq!(report.host_output().container_child_count(), 1);
    assert_eq!(report.host_output().instance_count(), 1);
    assert_eq!(report.host_output().text_count(), 1);
    assert_eq!(fiber_inspection.current(), commit.current());
    assert_eq!(
        fiber_inspection.host_component().fiber(),
        output.completed_fibers().component()
    );
    assert_eq!(
        fiber_inspection.host_text().fiber(),
        output.completed_fibers().text()
    );
}

#[test]
fn root_create_commit_handoff_switches_current_and_state_without_host_mutation() {
    let element = root_element(42);
    let mut root = TestRendererRoot::create(element, TestRendererOptions::new()).unwrap();
    let previous_current = root.store().root(root.root_id()).unwrap().current();
    let snapshot_before = root.diagnostic_container_snapshot().unwrap();
    let storage_before = host_storage_counts(&root);

    let (render, commit) = render_and_commit_latest_host_root(&mut root);
    let new_current = root.store().root(root.root_id()).unwrap().current();

    assert_eq!(render.root(), root.root_id());
    assert_eq!(render.current(), previous_current);
    assert_eq!(render.resulting_element(), element);
    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(render.skipped_update_count(), 0);
    assert!(render.remaining_lanes().is_empty());
    assert_eq!(commit.root(), root.root_id());
    assert_eq!(commit.previous_current(), previous_current);
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(commit.finished_lanes(), render.render_lanes());
    assert!(commit.remaining_lanes().is_empty());
    assert!(commit.pending_lanes().is_empty());
    assert_empty_root_update_callback_snapshot(&commit, &render);
    assert_eq!(new_current, render.finished_work());
    assert_ne!(new_current, previous_current);
    assert_eq!(current_host_root_element(&root), element);
    assert!(
        root.store()
            .root(root.root_id())
            .unwrap()
            .lanes()
            .pending_lanes()
            .is_empty()
    );
    assert_eq!(
        root.store()
            .root(root.root_id())
            .unwrap()
            .scheduling()
            .work_in_progress(),
        None
    );
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot_before
    );
    assert_eq!(host_storage_counts(&root), storage_before);
}

#[test]
fn root_update_commit_handoff_switches_current_again_and_updates_state_only() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let (_create_render, create_commit) = render_and_commit_latest_host_root(&mut root);
    let previous_current = root.store().root(root.root_id()).unwrap().current();
    let snapshot_after_create = root.diagnostic_container_snapshot().unwrap();
    let storage_after_create = host_storage_counts(&root);

    assert_eq!(create_commit.current(), previous_current);
    assert_eq!(current_host_root_element(&root), root_element(1));

    let outcome = root.update(root_element(2)).unwrap();
    let update = outcome.scheduled().unwrap();
    let (render, commit) = render_and_commit_latest_host_root(&mut root);
    let new_current = root.store().root(root.root_id()).unwrap().current();

    assert_eq!(update.kind(), TestRendererRootUpdateKind::Update);
    assert_eq!(render.current(), previous_current);
    assert_eq!(render.resulting_element(), root_element(2));
    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(render.skipped_update_count(), 0);
    assert_eq!(commit.previous_current(), previous_current);
    assert_eq!(commit.current(), render.finished_work());
    assert!(commit.pending_lanes().is_empty());
    assert_empty_root_update_callback_snapshot(&commit, &render);
    assert_eq!(new_current, render.finished_work());
    assert_ne!(new_current, previous_current);
    assert_eq!(current_host_root_element(&root), root_element(2));
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot_after_create
    );
    assert_eq!(host_storage_counts(&root), storage_after_create);
}

#[test]
fn root_unmount_commit_handoff_commits_none_without_host_teardown_output() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    render_and_commit_latest_host_root(&mut root);
    let previous_current = root.store().root(root.root_id()).unwrap().current();
    let snapshot_after_create = root.diagnostic_container_snapshot().unwrap();
    let storage_after_create = host_storage_counts(&root);

    let outcome = root.unmount().unwrap();
    let unmount = outcome.scheduled().unwrap();
    let (render, commit) = render_and_commit_latest_host_root(&mut root);
    let new_current = root.store().root(root.root_id()).unwrap().current();

    assert_eq!(unmount.kind(), TestRendererRootUpdateKind::Unmount);
    assert_eq!(unmount.element(), RootElementHandle::NONE);
    assert_eq!(
        root.lifecycle(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(render.current(), previous_current);
    assert_eq!(render.resulting_element(), RootElementHandle::NONE);
    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(render.skipped_update_count(), 0);
    assert!(render.render_lanes().includes_sync_lane());
    assert_eq!(commit.previous_current(), previous_current);
    assert_eq!(commit.current(), render.finished_work());
    assert!(commit.pending_lanes().is_empty());
    assert_empty_root_update_callback_snapshot(&commit, &render);
    assert_eq!(new_current, render.finished_work());
    assert_ne!(new_current, previous_current);
    assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot_after_create
    );
    assert_eq!(host_storage_counts(&root), storage_after_create);
}

#[test]
fn root_create_commit_handoff_exposes_visible_callback_snapshot() {
    let callback = RootUpdateCallbackHandle::from_raw(77);
    let mut root = TestRendererRoot::create_with_root_update_callback_for_canary(
        root_element(10),
        TestRendererOptions::new(),
        callback,
    )
    .unwrap();
    let scheduled_update = root.last_scheduled_update().unwrap().clone();
    let snapshot_before = root.diagnostic_container_snapshot().unwrap();
    let storage_before = host_storage_counts(&root);

    let (render, commit) = render_and_commit_latest_host_root(&mut root);

    assert_eq!(scheduled_update.kind(), TestRendererRootUpdateKind::Create);
    assert_visible_root_update_callback_snapshot(&commit, &render, &scheduled_update, callback);
    assert_eq!(current_host_root_element(&root), root_element(10));
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot_before
    );
    assert_eq!(host_storage_counts(&root), storage_before);
}

#[test]
fn root_update_commit_handoff_exposes_visible_callback_snapshot() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    render_and_commit_latest_host_root(&mut root);
    let callback = RootUpdateCallbackHandle::from_raw(88);

    let outcome = root
        .update_with_root_update_callback_for_canary(root_element(2), callback)
        .unwrap();
    let scheduled_update = outcome.scheduled().unwrap().clone();
    let snapshot_after_create = root.diagnostic_container_snapshot().unwrap();
    let storage_after_create = host_storage_counts(&root);
    let (render, commit) = render_and_commit_latest_host_root(&mut root);

    assert_eq!(scheduled_update.kind(), TestRendererRootUpdateKind::Update);
    assert_visible_root_update_callback_snapshot(&commit, &render, &scheduled_update, callback);
    assert_eq!(current_host_root_element(&root), root_element(2));
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot_after_create
    );
    assert_eq!(host_storage_counts(&root), storage_after_create);
}

#[test]
fn root_unmount_commit_handoff_exposes_visible_callback_snapshot() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    render_and_commit_latest_host_root(&mut root);
    let callback = RootUpdateCallbackHandle::from_raw(99);

    let outcome = root
        .unmount_with_root_update_callback_for_canary(callback)
        .unwrap();
    let scheduled_update = outcome.scheduled().unwrap().clone();
    let snapshot_after_create = root.diagnostic_container_snapshot().unwrap();
    let storage_after_create = host_storage_counts(&root);
    let (render, commit) = render_and_commit_latest_host_root(&mut root);

    assert_eq!(scheduled_update.kind(), TestRendererRootUpdateKind::Unmount);
    assert_visible_root_update_callback_snapshot(&commit, &render, &scheduled_update, callback);
    assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
    assert_eq!(
        root.lifecycle(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot_after_create
    );
    assert_eq!(host_storage_counts(&root), storage_after_create);
}

#[test]
fn root_serialization_gate_reports_committed_diagnostics_and_missing_host_output() {
    let callback = RootUpdateCallbackHandle::from_raw(101);
    let mut root = TestRendererRoot::create_with_root_update_callback_for_canary(
        root_element(10),
        TestRendererOptions::new(),
        callback,
    )
    .unwrap();
    let (render, commit) = render_and_commit_latest_host_root(&mut root);

    let report = root
        .describe_serialization_gate_for_canary(&commit)
        .unwrap();
    let requirements = report.requirements();
    let oracle = report.oracle();
    let commit_diagnostics = report.commit();
    let callback_diagnostics = commit_diagnostics.root_update_callbacks();
    let host_output = report.host_output();

    assert_eq!(
        report.gate_name(),
        TEST_RENDERER_SERIALIZATION_CANARY_GATE_NAME
    );
    assert_eq!(
        report.status(),
        TestRendererSerializationGateStatus::ClosedMissingHostOutput
    );
    assert!(report.is_closed());
    assert!(!report.is_ready());
    assert!(requirements.root_commit_diagnostics_available());
    assert!(!requirements.real_host_output_available());
    assert!(!requirements.committed_fiber_inspection_available());
    assert!(!requirements.private_serialization_ready());
    assert!(report.fiber_inspection().is_none());
    assert_eq!(
        oracle.oracle_kind(),
        TEST_RENDERER_SERIALIZATION_ORACLE_KIND
    );
    assert_eq!(
        oracle.probe_mode_count(),
        TEST_RENDERER_SERIALIZATION_ORACLE_PROBE_MODE_COUNT
    );
    assert_eq!(
        oracle.scenario_count(),
        TEST_RENDERER_SERIALIZATION_ORACLE_SCENARIO_COUNT
    );
    assert!(!oracle.compatibility_claimed());
    assert_eq!(commit_diagnostics.root(), root.root_id());
    assert_eq!(
        commit_diagnostics.lifecycle(),
        TestRendererRootLifecycle::Active
    );
    assert_eq!(
        commit_diagnostics.last_update_kind(),
        Some(TestRendererRootUpdateKind::Create)
    );
    assert_eq!(
        commit_diagnostics.last_scheduled_element(),
        Some(root_element(10))
    );
    assert_eq!(
        commit_diagnostics.previous_current().slot(),
        commit.previous_current().slot().get()
    );
    assert_eq!(
        commit_diagnostics.current().slot(),
        commit.current().slot().get()
    );
    assert_eq!(
        commit_diagnostics.finished_work().slot(),
        commit.finished_work().slot().get()
    );
    assert_eq!(
        commit_diagnostics.current(),
        commit_diagnostics.finished_work()
    );
    assert_eq!(commit.current(), render.finished_work());
    assert!(!commit_diagnostics.finished_lanes_empty());
    assert!(!commit_diagnostics.finished_lanes_include_sync());
    assert!(commit_diagnostics.remaining_lanes_empty());
    assert!(commit_diagnostics.pending_lanes_empty());
    assert!(!commit_diagnostics.has_remaining_work());
    assert!(!callback_diagnostics.is_empty());
    assert_eq!(callback_diagnostics.visible_count(), 1);
    assert_eq!(callback_diagnostics.hidden_count(), 0);
    assert_eq!(callback_diagnostics.deferred_hidden_count(), 0);
    assert_eq!(host_output.container_child_count(), 0);
    assert_eq!(host_output.instance_count(), 0);
    assert_eq!(host_output.text_count(), 0);
    assert!(!host_output.real_host_output_available());
}

#[test]
fn root_serialization_gate_fails_closed_before_real_host_output() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let (_render, commit) = render_and_commit_latest_host_root(&mut root);

    let error = root
        .require_serialization_gate_ready_for_canary(&commit)
        .unwrap_err();

    let TestRendererRootError::SerializationGate(error) = error else {
        panic!("expected serialization gate closure");
    };
    let TestRendererSerializationGateError::Closed(report) = error.as_ref() else {
        panic!("expected serialization gate closure");
    };
    assert_eq!(
        report.status(),
        TestRendererSerializationGateStatus::ClosedMissingHostOutput
    );
    assert_eq!(report.commit().root(), root.root_id());
    assert_eq!(report.host_output().container_child_count(), 0);
    assert!(!report.requirements().real_host_output_available());
    assert!(report.fiber_inspection().is_none());
}

#[test]
fn root_serialization_gate_rejects_stale_commit_diagnostics() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let (_create_render, create_commit) = render_and_commit_latest_host_root(&mut root);
    root.update(root_element(2)).unwrap();
    render_and_commit_latest_host_root(&mut root);

    let error = root
        .describe_serialization_gate_for_canary(&create_commit)
        .unwrap_err();

    let TestRendererRootError::SerializationGate(error) = error else {
        panic!("expected serialization gate error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererSerializationGateError::CommitIsNotCurrent { root: error_root, .. }
            if *error_root == root.root_id()
    ));
}

#[test]
fn root_commit_handoff_rejects_reused_render_record_after_current_switch() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let render = root
        .render_latest_scheduled_host_root_for_commit_handoff()
        .unwrap()
        .unwrap();

    let commit = root.commit_host_root_render_for_canary(render).unwrap();
    let error = root.commit_host_root_render_for_canary(render).unwrap_err();

    assert_eq!(
        root.store().root(root.root_id()).unwrap().current(),
        commit.current()
    );
    assert!(matches!(
        error,
        TestRendererRootError::RootCommit(RootCommitError::CurrentMismatch {
            root: commit_root,
            ..
        }) if commit_root == root.root_id()
    ));
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
    );
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

#[test]
fn root_options_store_strict_mode_and_create_node_mock_without_invocation() {
    let invocation_count = Arc::new(AtomicUsize::new(0));
    let invocation_count_for_mock = Arc::clone(&invocation_count);
    let create_node_mock = TestCreateNodeMock::new(move || {
        invocation_count_for_mock.fetch_add(1, Ordering::SeqCst);
    });
    let options = TestRendererOptions::new()
        .with_strict_mode(true)
        .with_create_node_mock(create_node_mock);

    let mut root = TestRendererRoot::create(root_element(1), options).unwrap();
    root.update(root_element(2)).unwrap();
    root.unmount().unwrap();

    assert!(root.options().strict_mode());
    assert!(root.options().has_create_node_mock());
    assert!(root.options().create_node_mock().is_some());
    assert!(
        root.store()
            .root(root.root_id())
            .unwrap()
            .options()
            .is_strict_mode()
    );
    assert_eq!(invocation_count.load(Ordering::SeqCst), 0);
}

#[test]
fn root_options_store_error_callback_handles_without_invocation() {
    let options = TestRendererOptions::new()
        .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(501))
        .with_on_caught_error(RootErrorCallbackHandle::from_raw(502))
        .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(503));

    let mut root = TestRendererRoot::create(root_element(1), options).unwrap();
    root.update(root_element(2)).unwrap();
    root.unmount().unwrap();

    assert_eq!(
        root.options().on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(501)
    );
    assert_eq!(
        root.options().on_caught_error(),
        RootErrorCallbackHandle::from_raw(502)
    );
    assert_eq!(
        root.options().on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(503)
    );

    let root_options = root.store().root(root.root_id()).unwrap().options();
    assert_eq!(
        root_options.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(501)
    );
    assert_eq!(
        root_options.on_caught_error(),
        RootErrorCallbackHandle::from_raw(502)
    );
    assert_eq!(
        root_options.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(503)
    );
}

#[test]
fn root_private_error_boundary_diagnostics_record_update_and_commit_rows_from_options() {
    let options = TestRendererOptions::new()
        .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(601))
        .with_on_caught_error(RootErrorCallbackHandle::from_raw(602))
        .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(603));
    let mut root =
        TestRendererRoot::create_host_component_with_text_for_canary("span", "hello", options)
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
        .describe_private_error_boundary_update_diagnostics_for_canary(&updated)
        .unwrap();
    let root_error_options = diagnostics.root_error_options();
    let dependencies = diagnostics.dependency_diagnostics();

    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME
    );
    assert_eq!(
        diagnostics.status(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS
    );
    assert_eq!(diagnostics.root(), root.root_id());
    assert_eq!(
        diagnostics.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert!(root_error_options.root_error_option_metadata_available());
    assert!(root_error_options.has_configured_error_callback());
    assert_eq!(
        root_error_options.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(601)
    );
    assert_eq!(
        root_error_options.on_caught_error(),
        RootErrorCallbackHandle::from_raw(602)
    );
    assert_eq!(
        root_error_options.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(603)
    );
    assert!(!diagnostics.public_error_boundary_behavior_available());
    assert!(!diagnostics.public_root_error_callbacks_invoked());
    assert!(!diagnostics.compatibility_claimed());
    assert!(dependencies.update_commit_rows_ready());
    assert!(dependencies.update_route_diagnostics_available());
    assert!(dependencies.serialization_diagnostics_available());
    assert!(dependencies.test_instance_query_diagnostics_available());
    assert!(dependencies.act_scheduler_metadata_available());
    assert!(!dependencies.public_renderer_roots_executed());
    assert!(!dependencies.public_lifecycle_methods_executed());
    assert!(!dependencies.error_boundary_recovery_executed());
    assert!(!dependencies.compatibility_claimed());

    let rows = diagnostics.rows();
    assert_eq!(rows.len(), 2);
    assert_eq!(
        rows[0].id(),
        "react-test-renderer-update-error-root-option-private-diagnostic"
    );
    assert_eq!(
        rows[0].phase(),
        TestRendererPrivateErrorDiagnosticPhase::Update
    );
    assert_eq!(
        rows[1].id(),
        "react-test-renderer-commit-error-root-option-private-diagnostic"
    );
    assert_eq!(
        rows[1].phase(),
        TestRendererPrivateErrorDiagnosticPhase::Commit
    );
    for row in rows {
        assert_eq!(
            row.diagnostic_name(),
            TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME
        );
        assert_eq!(
            row.status(),
            TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS
        );
        assert_eq!(
            row.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(row.root(), root.root_id());
        assert_eq!(row.root_error_channel(), "onUncaughtError");
        assert_eq!(row.root_error_options(), root_error_options);
        assert_eq!(row.dependency_diagnostics(), dependencies);
        assert!(row.dependency_diagnostics().update_commit_rows_ready());
        assert!(row.root_error_options().has_configured_error_callback());
        assert!(!row.root_error_update_scheduled());
        assert!(!row.public_root_error_callbacks_invoked());
        assert!(!row.public_error_boundary_behavior_available());
        assert!(!row.compatibility_claimed());
    }
}

#[test]
fn root_private_error_boundary_native_execution_evidence_consumes_update_failure_path() {
    let options = TestRendererOptions::new()
        .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(701))
        .with_on_caught_error(RootErrorCallbackHandle::from_raw(702))
        .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(703));
    let mut root =
        TestRendererRoot::create_host_component_with_text_for_canary("span", "hello", options)
            .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let (_outcome, updated, admission) = root
        .render_and_admit_private_update_native_bridge_handoff_for_canary(
            "span",
            props().with_attribute("data-error-path", "update"),
            "goodbye",
        )
        .unwrap();

    let evidence = root
        .describe_private_error_boundary_commit_recovery_for_canary(&updated, admission)
        .unwrap();
    let diagnostics = evidence.error_diagnostics();
    let commit_recovery = evidence.commit_recovery_metadata();

    assert_eq!(
        evidence.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        evidence.status(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_STATUS
    );
    assert_eq!(evidence.root(), root.root_id());
    assert_eq!(evidence.operation(), "update");
    assert_eq!(evidence.public_surface(), "create().update error boundary");
    assert_eq!(evidence.update_failure_path(), "update");
    assert_eq!(
        commit_recovery.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_DIAGNOSTIC_NAME
    );
    assert_eq!(
        commit_recovery.status(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_STATUS
    );
    assert_eq!(
        commit_recovery.accepted_rust_api(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_API
    );
    assert_eq!(commit_recovery.root(), root.root_id());
    assert_eq!(commit_recovery.operation(), "update");
    assert_eq!(commit_recovery.update_failure_path(), "commit");
    assert_eq!(
        commit_recovery.commit_phase_recovery_path(),
        "ReactFiberWorkLoop.captureCommitPhaseError"
    );
    assert_eq!(
        commit_recovery.commit_phase_recovery_action(),
        "createRootErrorUpdate(SyncLane)"
    );
    assert_eq!(
        commit_recovery.react_reference(),
        "ReactFiberWorkLoop.captureCommitPhaseError -> createRootErrorUpdate(SyncLane)"
    );
    assert_eq!(
        commit_recovery.source_update_record(),
        "TestRendererUpdateNativeBridgeAdmission"
    );
    assert_eq!(
        commit_recovery.source_update_record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        commit_recovery.source_update_record_status(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
    );
    assert_eq!(
        commit_recovery.source_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        commit_recovery.source_failure_record(),
        "HostRootRenderFailureRecoveryCommitEvidenceForCanary"
    );
    assert_eq!(
        commit_recovery.source_commit_recovery_snapshot_record(),
        "HostRootCommitRecoverySnapshotForCanary"
    );
    assert_eq!(
        commit_recovery.root_error_options(),
        diagnostics.root_error_options()
    );
    assert!(commit_recovery.consumes_accepted_rust_update_metadata());
    assert!(commit_recovery.consumes_accepted_rust_failure_metadata());
    assert!(commit_recovery.consumes_accepted_commit_recovery_snapshot());
    assert!(commit_recovery.preserves_root_error_option_handles());
    assert!(commit_recovery.commit_phase_recovery_path_consumed());
    assert!(commit_recovery.accepted_private_commit_phase_recovery_metadata());
    assert!(!commit_recovery.root_error_update_scheduled());
    assert!(!commit_recovery.public_root_error_callbacks_invoked());
    assert!(!commit_recovery.public_error_boundary_behavior_available());
    assert!(!commit_recovery.public_error_recovery_available());
    assert!(!commit_recovery.compatibility_claimed());
    assert_eq!(
        evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        evidence.source_execution_status(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
    );
    assert_eq!(
        evidence.source_execution_scheduled_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME
    );
    assert_eq!(diagnostics.root(), root.root_id());
    assert_eq!(evidence.row_count(), 2);
    assert_eq!(evidence.rows(), diagnostics.rows());
    assert!(evidence.consumes_accepted_root_execution_diagnostics());
    assert!(evidence.consumes_accepted_native_update_execution_record());
    assert!(evidence.consumes_private_error_boundary_diagnostics());
    assert!(evidence.consumes_private_commit_recovery_metadata());
    assert!(evidence.consumes_accepted_rust_failure_metadata());
    assert!(evidence.preserves_root_error_option_handles());
    assert!(evidence.consumes_update_error_row());
    assert!(evidence.consumes_commit_error_row());
    assert!(!evidence.root_error_update_scheduled());
    assert!(!evidence.public_root_error_callbacks_invoked());
    assert!(!evidence.public_error_boundary_behavior_available());
    assert!(!evidence.error_boundary_recovery_executed());
    assert!(!evidence.public_error_recovery_available());
    assert!(!evidence.public_commit_phase_recovery_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(evidence.rust_execution_from_js());
    assert!(evidence.reconciler_execution_from_js());
    assert!(!evidence.compatibility_claimed());
    assert!(!diagnostics.public_error_boundary_behavior_available());
    assert!(!diagnostics.public_root_error_callbacks_invoked());
    assert!(!diagnostics.compatibility_claimed());
    assert_eq!(
        root.describe_private_error_boundary_update_native_execution_for_canary(
            &updated, admission
        )
        .unwrap()
        .commit_recovery_metadata(),
        commit_recovery
    );

    let mut stale_admission = admission;
    stale_admission.host_output_update_kind = TestRendererRootUpdateKind::Create;
    let error = root
        .describe_private_error_boundary_commit_recovery_for_canary(&updated, stale_admission)
        .unwrap_err();
    let TestRendererRootError::PrivateErrorBoundaryNativeExecution(error) = error else {
        panic!("expected private error boundary native execution rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
            reason: "host-output-update-kind"
        }
    ));

    let mut missing_update_metadata = admission;
    missing_update_metadata.text_update_apply_recorded = false;
    let error = root
        .describe_private_error_boundary_commit_recovery_for_canary(
            &updated,
            missing_update_metadata,
        )
        .unwrap_err();
    let TestRendererRootError::PrivateErrorBoundaryNativeExecution(error) = error else {
        panic!("expected private error boundary native execution update metadata rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
            reason: "update-execution-admission-not-accepted"
        }
    ));
}

#[test]
fn root_private_act_passive_effect_drain_consumes_metadata_without_public_act() {
    let root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let finished_work = TestRendererFiberHandleDiagnostics::from_raw_parts_for_canary(7, 8, 9);
    let metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
        root.root_id(),
        finished_work,
        1,
        2,
    );

    let diagnostics = root.consume_private_act_pending_passive_flush_metadata_for_canary(metadata);

    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME
    );
    assert_eq!(
        diagnostics.status(),
        TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_STATUS
    );
    assert_eq!(
        diagnostics.accepted_reconciler_records(),
        &TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_ACCEPTED_RECORDS
    );
    assert_eq!(diagnostics.metadata(), metadata);
    assert!(diagnostics.metadata_root_matches_renderer_root());
    assert!(diagnostics.consumes_pending_passive_flush_metadata());
    assert!(diagnostics.consumes_accepted_scheduler_flush_metadata());
    assert!(diagnostics.private_scheduler_flush_request_metadata_consumed());
    assert!(!diagnostics.consumes_accepted_native_update_execution());
    assert_eq!(diagnostics.private_update_native_bridge_admission(), None);
    assert!(!diagnostics.host_output_produced_from_native_update());
    assert_eq!(metadata.finished_work(), finished_work);
    assert_eq!(metadata.pending_unmount_count(), 1);
    assert_eq!(metadata.pending_mount_count(), 2);
    assert_eq!(metadata.pending_record_count(), 3);
    assert_eq!(metadata.scheduler_request_order(), 0);
    assert_eq!(metadata.scheduler_priority(), "Normal");
    assert!(!diagnostics.executes_passive_effects());
    assert!(!diagnostics.invokes_effect_callbacks());
    assert!(!diagnostics.invokes_act_callback());
    assert!(!diagnostics.public_update_compatibility_claimed());
    assert!(!diagnostics.public_act_compatibility_claimed());
    assert!(!diagnostics.compatibility_claimed());
}

#[test]
fn root_private_act_passive_effect_drain_consumes_native_update_execution_metadata() {
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

    let (_outcome, updated, admission) = root
        .render_and_admit_private_update_native_bridge_handoff_for_canary(
            "span",
            updated_props,
            "goodbye",
        )
        .unwrap();
    let finished_work = updated.commit().current();
    let metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
        root.root_id(),
        TestRendererFiberHandleDiagnostics {
            arena_id: finished_work.arena_id().get(),
            slot: finished_work.slot().get(),
            generation: finished_work.generation().get(),
        },
        0,
        1,
    );

    let diagnostics = root
        .consume_private_act_update_native_execution_and_pending_passive_flush_metadata_for_canary(
            admission, metadata,
        );

    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME
    );
    assert_eq!(diagnostics.metadata(), metadata);
    assert!(diagnostics.metadata_root_matches_renderer_root());
    assert!(diagnostics.consumes_pending_passive_flush_metadata());
    assert!(diagnostics.consumes_accepted_scheduler_flush_metadata());
    assert!(diagnostics.private_scheduler_flush_request_metadata_consumed());
    assert!(diagnostics.consumes_accepted_native_update_execution());
    assert_eq!(
        diagnostics.private_update_native_bridge_admission(),
        Some(admission)
    );
    assert!(diagnostics.host_output_produced_from_native_update());
    assert!(!diagnostics.executes_passive_effects());
    assert!(!diagnostics.invokes_effect_callbacks());
    assert!(!diagnostics.invokes_act_callback());
    assert!(!diagnostics.public_update_compatibility_claimed());
    assert!(!diagnostics.public_act_compatibility_claimed());
    assert!(!diagnostics.compatibility_claimed());
}

#[test]
fn root_private_act_nested_scope_passive_flush_keeps_deterministic_private_order() {
    let root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let finished_work = TestRendererFiberHandleDiagnostics::from_raw_parts_for_canary(11, 12, 13);
    let metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
        root.root_id(),
        finished_work,
        1,
        1,
    );

    let diagnostics = root
        .describe_private_act_nested_scope_passive_flush_for_canary(metadata)
        .unwrap();

    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_DIAGNOSTIC_NAME
    );
    assert_eq!(
        diagnostics.status(),
        TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_STATUS
    );
    assert_eq!(
        diagnostics.flush_order(),
        &TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_ORDER
    );
    assert_eq!(diagnostics.outer_scope_depth(), 1);
    assert_eq!(diagnostics.inner_scope_depth(), 2);
    assert_eq!(diagnostics.passive_flush_order_index(), 2);
    assert_eq!(diagnostics.pending_unmount_count(), 1);
    assert_eq!(diagnostics.pending_mount_count(), 1);
    assert_eq!(diagnostics.pending_passive_record_count(), 2);
    assert!(diagnostics.nested_scope_metadata_accepted());
    assert!(diagnostics.private_passive_flush_metadata_accepted());
    assert!(diagnostics.drains_accepted_pending_passive_flush_metadata());
    assert!(diagnostics.deterministic_flush_order());

    let passive_drain = diagnostics.passive_drain();
    assert_eq!(passive_drain.metadata(), metadata);
    assert!(passive_drain.metadata_root_matches_renderer_root());
    assert!(passive_drain.consumes_pending_passive_flush_metadata());
    assert!(passive_drain.consumes_accepted_scheduler_flush_metadata());
    assert!(passive_drain.private_scheduler_flush_request_metadata_consumed());
    assert!(!passive_drain.executes_passive_effects());
    assert!(!passive_drain.invokes_effect_callbacks());
    assert!(!passive_drain.invokes_act_callback());
    assert!(!passive_drain.public_act_compatibility_claimed());
    assert!(!passive_drain.compatibility_claimed());

    assert!(!diagnostics.public_act_scope_depth_tracking_available());
    assert!(!diagnostics.public_nested_act_queue_reuse_available());
    assert!(!diagnostics.public_overlapping_act_warning_emission_available());
    assert!(!diagnostics.invokes_act_callback());
    assert!(!diagnostics.executes_passive_effects());
    assert!(!diagnostics.invokes_effect_callbacks());
    assert!(!diagnostics.public_act_compatibility_claimed());
    assert!(!diagnostics.compatibility_claimed());
}

#[test]
fn root_private_act_nested_scope_passive_flush_rejects_stale_or_empty_metadata() {
    let root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let finished_work = TestRendererFiberHandleDiagnostics::from_raw_parts_for_canary(21, 22, 23);
    let stale_root = FiberRootId::new(root.root_id().raw() + 1).unwrap();
    let stale_metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
        stale_root,
        finished_work,
        1,
        0,
    );

    let error = root
        .describe_private_act_nested_scope_passive_flush_for_canary(stale_metadata)
        .unwrap_err();
    let TestRendererRootError::PrivateActNestedScopePassiveFlush(error) = error else {
        panic!("expected private nested act passive flush rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateActNestedScopePassiveFlushError::RootMismatch { .. }
    ));

    let empty_metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
        root.root_id(),
        finished_work,
        0,
        0,
    );
    let error = root
        .describe_private_act_nested_scope_passive_flush_for_canary(empty_metadata)
        .unwrap_err();
    let TestRendererRootError::PrivateActNestedScopePassiveFlush(error) = error else {
        panic!("expected private nested act passive flush rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateActNestedScopePassiveFlushError::RecordMismatch {
            reason: "missing-pending-passive-work"
        }
    ));
}

#[test]
fn reports_mutation_only_capabilities() {
    let renderer = TestRenderer::new();
    let capabilities = renderer.capabilities();

    assert_eq!(renderer.renderer_name(), TEST_RENDERER_NAME);
    assert_eq!(
        capabilities.tree_update_mode(),
        Ok(HostTreeUpdateMode::Mutation)
    );
    assert!(capabilities.supports(HostCapability::Mutation));
    assert!(!capabilities.supports(HostCapability::Persistence));
    assert!(!capabilities.supports(HostCapability::Hydration));
    assert!(!capabilities.supports(HostCapability::Resources));
    assert!(!capabilities.supports(HostCapability::Singletons));
    assert!(!capabilities.supports(HostCapability::ViewTransitions));
    assert_mutation_renderer(&renderer);
}

#[test]
fn creates_instances_text_and_host_context() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let context = renderer.root_host_context(&container).unwrap();
    let child_context = renderer
        .child_host_context(&context, &element_type("View"), &props())
        .unwrap();
    let text_props = TestProps::with_text_content("inline");

    let instance = renderer
        .create_instance(
            creation_instance_token(),
            &element_type("View"),
            &props().with_attribute("role", "main"),
            &container,
            &context,
        )
        .unwrap();
    let text = renderer
        .create_text_instance(creation_text_token(), "hello", &container, &context)
        .unwrap();

    assert_eq!(context.depth(), 0);
    assert_eq!(child_context.depth(), 1);
    assert!(renderer.should_set_text_content(&element_type("Text"), &text_props, &context));
    assert_eq!(
        renderer
            .snapshot_instance(&instance)
            .unwrap()
            .element_type()
            .as_str(),
        "View"
    );
    assert_eq!(
        renderer
            .snapshot_instance(&instance)
            .unwrap()
            .props()
            .attributes()["role"],
        "main"
    );
    assert_eq!(renderer.snapshot_text(&text).unwrap().text(), "hello");
    assert_eq!(renderer.get_public_instance(&instance).unwrap(), instance);
}

#[test]
fn append_initial_child_records_detached_children() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let mut parent = create_instance(&mut renderer, &container, "View");
    let text = create_text(&mut renderer, &container, "alpha");

    renderer
        .append_initial_child(&mut parent, HostChild::Text(&text))
        .unwrap();
    let finalization = renderer
        .finalize_initial_children(
            &mut parent,
            &element_type("View"),
            &props(),
            &container,
            &renderer.root_host_context(&container).unwrap(),
        )
        .unwrap();

    assert_eq!(finalization, InitialChildrenFinalization::NoCommitMount);
    assert_eq!(
        child_texts(&renderer.snapshot_instance(&parent).unwrap()),
        vec!["alpha"]
    );
}

#[test]
fn append_child_and_append_child_to_container_record_order() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let mut parent = create_instance(&mut renderer, &container, "View");
    let child = create_instance(&mut renderer, &container, "Text");
    let text = create_text(&mut renderer, &container, "inside");

    renderer
        .append_child(&mut parent, HostChild::Instance(&child))
        .unwrap();
    renderer
        .append_child(&mut parent, HostChild::Text(&text))
        .unwrap();
    renderer
        .append_child_to_container(&mut container, HostChild::Instance(&parent))
        .unwrap();

    let parent_snapshot = renderer.snapshot_instance(&parent).unwrap();
    assert_eq!(parent_snapshot.children().len(), 2);
    match &parent_snapshot.children()[0] {
        TestNodeSnapshot::Element(element) => {
            assert_eq!(element.element_type().as_str(), "Text");
        }
        TestNodeSnapshot::Text(_) => panic!("expected element child"),
    }
    match &parent_snapshot.children()[1] {
        TestNodeSnapshot::Text(text) => {
            assert_eq!(text.text(), "inside");
        }
        TestNodeSnapshot::Element(_) => panic!("expected text child"),
    }
    assert_eq!(
        container_element_names(&renderer.snapshot_container(&container).unwrap()),
        vec!["View"]
    );
}

#[test]
fn insert_before_reorders_instance_children() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let mut parent = create_instance(&mut renderer, &container, "View");
    let a = create_text(&mut renderer, &container, "a");
    let b = create_text(&mut renderer, &container, "b");
    let c = create_text(&mut renderer, &container, "c");

    renderer
        .append_child(&mut parent, HostChild::Text(&a))
        .unwrap();
    renderer
        .append_child(&mut parent, HostChild::Text(&c))
        .unwrap();
    renderer
        .insert_before(&mut parent, HostChild::Text(&b), HostChild::Text(&c))
        .unwrap();
    renderer
        .insert_before(&mut parent, HostChild::Text(&a), HostChild::Text(&c))
        .unwrap();

    assert_eq!(
        child_texts(&renderer.snapshot_instance(&parent).unwrap()),
        vec!["b", "a", "c"]
    );
}

#[test]
fn insert_in_container_before_reorders_root_children() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let first = create_instance(&mut renderer, &container, "First");
    let second = create_instance(&mut renderer, &container, "Second");

    renderer
        .append_child_to_container(&mut container, HostChild::Instance(&second))
        .unwrap();
    renderer
        .insert_in_container_before(
            &mut container,
            HostChild::Instance(&first),
            HostChild::Instance(&second),
        )
        .unwrap();

    assert_eq!(
        container_element_names(&renderer.snapshot_container(&container).unwrap()),
        vec!["First", "Second"]
    );
}

#[test]
fn moving_children_detaches_from_previous_parent_or_container() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let mut old_parent = create_instance(&mut renderer, &container, "OldParent");
    let mut new_parent = create_instance(&mut renderer, &container, "NewParent");
    let child = create_text(&mut renderer, &container, "move me");

    renderer
        .append_child(&mut old_parent, HostChild::Text(&child))
        .unwrap();
    renderer
        .append_child_to_container(&mut container, HostChild::Text(&child))
        .unwrap();
    assert!(
        renderer
            .snapshot_instance(&old_parent)
            .unwrap()
            .children()
            .is_empty()
    );

    renderer
        .append_child(&mut new_parent, HostChild::Text(&child))
        .unwrap();
    assert!(
        renderer
            .snapshot_container(&container)
            .unwrap()
            .children()
            .is_empty()
    );
    assert_eq!(
        child_texts(&renderer.snapshot_instance(&new_parent).unwrap()),
        vec!["move me"]
    );
}

#[test]
fn remove_child_and_remove_child_from_container_detach_links_only() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let mut parent = create_instance(&mut renderer, &container, "View");
    let text = create_text(&mut renderer, &container, "remove me");

    renderer
        .append_child(&mut parent, HostChild::Text(&text))
        .unwrap();
    renderer
        .append_child_to_container(&mut container, HostChild::Instance(&parent))
        .unwrap();
    renderer
        .remove_child(&mut parent, HostChild::Text(&text))
        .unwrap();
    renderer
        .remove_child_from_container(&mut container, HostChild::Instance(&parent))
        .unwrap();

    assert!(
        renderer
            .snapshot_instance(&parent)
            .unwrap()
            .children()
            .is_empty()
    );
    assert!(
        renderer
            .snapshot_container(&container)
            .unwrap()
            .children()
            .is_empty()
    );
    assert_eq!(renderer.snapshot_text(&text).unwrap().text(), "remove me");
}

#[test]
fn clear_container_removes_all_root_children() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let first = create_instance(&mut renderer, &container, "First");
    let second = create_instance(&mut renderer, &container, "Second");

    renderer
        .append_child_to_container(&mut container, HostChild::Instance(&first))
        .unwrap();
    renderer
        .append_child_to_container(&mut container, HostChild::Instance(&second))
        .unwrap();
    renderer.clear_container(&mut container).unwrap();

    assert!(
        renderer
            .snapshot_container(&container)
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn commit_hooks_update_props_text_visibility_and_detachment() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let mut instance = create_instance(&mut renderer, &container, "View");
    let mut text = create_text(&mut renderer, &container, "old");
    let commit_state = renderer.prepare_for_commit(&container).unwrap();

    renderer
        .commit_update(
            commit_instance_token(),
            &mut instance,
            TestUpdatePayload::replace_props(props().with_attribute("updated", "yes")),
            &element_type("View"),
            &props(),
            &props().with_attribute("updated", "yes"),
        )
        .unwrap();
    renderer
        .commit_text_update(&mut text, "old", "new")
        .unwrap();
    renderer.hide_instance(&mut instance).unwrap();
    renderer.hide_text_instance(&mut text).unwrap();
    renderer
        .reset_after_commit(&container, commit_state)
        .unwrap();

    assert!(renderer.snapshot_instance(&instance).unwrap().is_hidden());
    assert!(renderer.snapshot_text(&text).unwrap().is_hidden());
    assert_eq!(
        renderer
            .snapshot_instance(&instance)
            .unwrap()
            .props()
            .attributes()["updated"],
        "yes"
    );
    assert_eq!(renderer.snapshot_text(&text).unwrap().text(), "new");

    renderer.unhide_instance(&mut instance, &props()).unwrap();
    renderer.unhide_text_instance(&mut text, "new").unwrap();
    renderer
        .detach_deleted_instance(deletion_instance_token(), instance)
        .unwrap();

    let snapshot = renderer.snapshot_instance(&instance).unwrap();
    assert!(!snapshot.is_hidden());
    assert!(snapshot.is_detached());
    assert!(snapshot.children().is_empty());
}

#[test]
fn lifecycle_hooks_reject_wrong_fiber_token_phase_or_target() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let context = renderer.root_host_context(&container).unwrap();
    let mut instance = create_instance(&mut renderer, &container, "View");

    assert_operation_error(
        renderer
            .create_instance(
                commit_instance_token(),
                &element_type("View"),
                &props(),
                &container,
                &context,
            )
            .unwrap_err(),
        HostOperationErrorKind::InvalidFiberToken {
            phase: HostFiberTokenPhase::Commit,
            target: HostFiberTokenTarget::Instance,
            violation: HostFiberTokenViolation::WrongPhase,
        },
    );

    assert_operation_error(
        renderer
            .create_text_instance(creation_instance_token(), "text", &container, &context)
            .unwrap_err(),
        HostOperationErrorKind::InvalidFiberToken {
            phase: HostFiberTokenPhase::Creation,
            target: HostFiberTokenTarget::Instance,
            violation: HostFiberTokenViolation::WrongTarget,
        },
    );

    assert_operation_error(
        renderer
            .commit_mount(
                creation_instance_token(),
                &mut instance,
                &element_type("View"),
                &props(),
            )
            .unwrap_err(),
        HostOperationErrorKind::InvalidFiberToken {
            phase: HostFiberTokenPhase::Creation,
            target: HostFiberTokenTarget::Instance,
            violation: HostFiberTokenViolation::WrongPhase,
        },
    );

    assert_operation_error(
        renderer
            .commit_update(
                creation_instance_token(),
                &mut instance,
                TestUpdatePayload::replace_props(props().with_attribute("updated", "no")),
                &element_type("View"),
                &props(),
                &props().with_attribute("updated", "no"),
            )
            .unwrap_err(),
        HostOperationErrorKind::InvalidFiberToken {
            phase: HostFiberTokenPhase::Creation,
            target: HostFiberTokenTarget::Instance,
            violation: HostFiberTokenViolation::WrongPhase,
        },
    );

    assert_operation_error(
        renderer
            .detach_deleted_instance(commit_instance_token(), instance)
            .unwrap_err(),
        HostOperationErrorKind::InvalidFiberToken {
            phase: HostFiberTokenPhase::Commit,
            target: HostFiberTokenTarget::Instance,
            violation: HostFiberTokenViolation::WrongPhase,
        },
    );

    let snapshot = renderer.snapshot_instance(&instance).unwrap();
    assert!(!snapshot.is_detached());
    assert!(snapshot.props().attributes().is_empty());
}

#[test]
fn invalid_same_renderer_handles_are_structured_operation_errors() {
    let mut renderer = TestRenderer::new();
    let mut invalid_container = TestContainer {
        renderer_id: renderer.renderer_id,
        index: 0,
    };
    let invalid_instance = TestInstance {
        renderer_id: renderer.renderer_id,
        index: 0,
    };
    let mut invalid_text = TestTextInstance {
        renderer_id: renderer.renderer_id,
        index: 0,
    };

    assert_operation_error(
        renderer.root_host_context(&invalid_container).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Container,
        },
    );
    assert_operation_error(
        renderer
            .create_instance(
                creation_instance_token(),
                &element_type("View"),
                &props(),
                &invalid_container,
                &TestHostContext::default(),
            )
            .unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Container,
        },
    );
    assert_operation_error(
        renderer
            .clear_container(&mut invalid_container)
            .unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Container,
        },
    );
    assert_operation_error(
        renderer.get_public_instance(&invalid_instance).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Instance,
        },
    );
    assert_operation_error(
        renderer
            .commit_text_update(&mut invalid_text, "old", "new")
            .unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::TextInstance,
        },
    );

    assert_operation_error(
        renderer.snapshot_container(&invalid_container).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Container,
        },
    );
    assert_operation_error(
        renderer.snapshot_instance(&invalid_instance).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Instance,
        },
    );
    assert_operation_error(
        renderer.snapshot_text(&invalid_text).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::TextInstance,
        },
    );
}

#[test]
fn cross_renderer_handles_are_rejected_even_with_same_indices() {
    let mut left = TestRenderer::new();
    let left_container = left.create_container();
    let mut right = TestRenderer::new();
    let right_container = right.create_container();
    let right_instance = create_instance(&mut right, &right_container, "Foreign");
    let mut right_text = create_text(&mut right, &right_container, "foreign");

    assert_eq!(left_container.index, right_container.index);
    assert_eq!(right_instance.index, 0);
    assert_eq!(right_text.index, 0);

    assert_operation_error(
        left.root_host_context(&right_container).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Container,
        },
    );
    assert_operation_error(
        left.get_public_instance(&right_instance).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Instance,
        },
    );
    assert_operation_error(
        left.commit_text_update(&mut right_text, "foreign", "changed")
            .unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::TextInstance,
        },
    );
}

#[test]
fn missing_insert_targets_return_errors_without_detaching_existing_child() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let mut old_parent = create_instance(&mut renderer, &container, "OldParent");
    let mut new_parent = create_instance(&mut renderer, &container, "NewParent");
    let moving = create_text(&mut renderer, &container, "moving");
    let missing_before = create_text(&mut renderer, &container, "missing");

    renderer
        .append_child(&mut old_parent, HostChild::Text(&moving))
        .unwrap();

    assert_operation_error(
        renderer
            .insert_before(
                &mut new_parent,
                HostChild::Text(&moving),
                HostChild::Text(&missing_before),
            )
            .unwrap_err(),
        HostOperationErrorKind::MissingInsertionTarget {
            parent: HostParentKind::Instance,
            target: HostChildKind::TextInstance,
        },
    );
    assert_eq!(
        child_texts(&renderer.snapshot_instance(&old_parent).unwrap()),
        vec!["moving"]
    );
    assert!(
        renderer
            .snapshot_instance(&new_parent)
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn missing_container_insert_targets_return_errors_without_detaching_child() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let mut old_parent = create_instance(&mut renderer, &container, "OldParent");
    let moving = create_text(&mut renderer, &container, "moving");
    let missing_before = create_text(&mut renderer, &container, "missing");

    renderer
        .append_child(&mut old_parent, HostChild::Text(&moving))
        .unwrap();

    assert_operation_error(
        renderer
            .insert_in_container_before(
                &mut container,
                HostChild::Text(&moving),
                HostChild::Text(&missing_before),
            )
            .unwrap_err(),
        HostOperationErrorKind::MissingInsertionTarget {
            parent: HostParentKind::Container,
            target: HostChildKind::TextInstance,
        },
    );
    assert_eq!(
        child_texts(&renderer.snapshot_instance(&old_parent).unwrap()),
        vec!["moving"]
    );
    assert!(
        renderer
            .snapshot_container(&container)
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn missing_removal_targets_return_errors_without_changing_tree() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let mut parent = create_instance(&mut renderer, &container, "Parent");
    let attached = create_text(&mut renderer, &container, "attached");
    let missing = create_text(&mut renderer, &container, "missing");

    renderer
        .append_child(&mut parent, HostChild::Text(&attached))
        .unwrap();
    renderer
        .append_child_to_container(&mut container, HostChild::Instance(&parent))
        .unwrap();

    assert_operation_error(
        renderer
            .remove_child(&mut parent, HostChild::Text(&missing))
            .unwrap_err(),
        HostOperationErrorKind::MissingRemovalTarget {
            parent: HostParentKind::Instance,
            child: HostChildKind::TextInstance,
        },
    );
    assert_operation_error(
        renderer
            .remove_child_from_container(&mut container, HostChild::Text(&missing))
            .unwrap_err(),
        HostOperationErrorKind::MissingRemovalTarget {
            parent: HostParentKind::Container,
            child: HostChildKind::TextInstance,
        },
    );
    assert_eq!(
        child_texts(&renderer.snapshot_instance(&parent).unwrap()),
        vec!["attached"]
    );
    assert_eq!(
        container_element_names(&renderer.snapshot_container(&container).unwrap()),
        vec!["Parent"]
    );
}

#[test]
fn impossible_self_and_cycle_mutations_return_operation_errors() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let mut parent = create_instance(&mut renderer, &container, "Parent");
    let mut child = create_instance(&mut renderer, &container, "Child");

    let same_parent = parent;
    assert_operation_error(
        renderer
            .append_child(&mut parent, HostChild::Instance(&same_parent))
            .unwrap_err(),
        HostOperationErrorKind::ImpossibleMutation {
            parent: HostParentKind::Instance,
            child: HostChildKind::Instance,
            violation: HostMutationViolation::ChildIsParent,
        },
    );

    renderer
        .append_child(&mut parent, HostChild::Instance(&child))
        .unwrap();

    assert_operation_error(
        renderer
            .append_child(&mut child, HostChild::Instance(&parent))
            .unwrap_err(),
        HostOperationErrorKind::ImpossibleMutation {
            parent: HostParentKind::Instance,
            child: HostChildKind::Instance,
            violation: HostMutationViolation::ChildIsAncestorOfParent,
        },
    );
    assert_eq!(
        renderer
            .snapshot_instance(&parent)
            .unwrap()
            .children()
            .len(),
        1
    );
    assert!(
        renderer
            .snapshot_instance(&child)
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn unsupported_capabilities_are_structured_errors() {
    let mut renderer = TestRenderer::new();

    for capability in [
        HostCapability::Persistence,
        HostCapability::Hydration,
        HostCapability::Resources,
        HostCapability::Singletons,
        HostCapability::ViewTransitions,
    ] {
        let error = renderer.require_capability(capability).unwrap_err();
        let unsupported = error.as_unsupported_capability().unwrap();
        assert_eq!(unsupported.renderer_name(), TEST_RENDERER_NAME);
        assert_eq!(unsupported.capability(), capability);
        assert!(error.as_operation_error().is_none());
    }

    let mut form = ();
    let error = renderer.reset_form_instance(&mut form).unwrap_err();
    let unsupported = error.as_unsupported_capability().unwrap();
    assert_eq!(unsupported.renderer_name(), TEST_RENDERER_NAME);
    assert_eq!(unsupported.capability(), HostCapability::Forms);
    assert!(error.as_operation_error().is_none());
}
