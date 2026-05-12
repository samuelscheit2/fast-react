use super::*;

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
