use super::*;

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
