use super::*;

use fast_react_reconciler::TestRendererHostOutputCanaryMutationKind;

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
