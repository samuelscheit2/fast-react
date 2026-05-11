use super::helpers::*;
use super::*;

#[test]
fn host_work_mounts_one_host_element_with_text_under_host_root_wip() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("span", "hello");
    let current = store.root(root_id).unwrap().current();
    let render = render_test_root(&mut store, root_id, element);
    let work_in_progress = render.work_in_progress();

    let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();

    assert_eq!(result.root, root_id);
    assert_eq!(result.work_in_progress, work_in_progress);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.fiber_arena().get(current).unwrap().child(), None);

    let root = store.fiber_arena().get(work_in_progress).unwrap();
    let component = root.child().unwrap();
    assert_eq!(result.root_child, Some(component));
    assert_eq!(root.child_lanes(), Lanes::NO);
    assert!(root.subtree_flags().contains_all(FiberFlags::PLACEMENT));

    let component_node = store.fiber_arena().get(component).unwrap();
    let text = component_node.child().unwrap();
    assert_eq!(component_node.tag(), FiberTag::HostComponent);
    assert!(component_node.flags().contains_all(FiberFlags::PLACEMENT));
    assert_eq!(component_node.child_lanes(), Lanes::NO);
    assert_eq!(component_node.sibling(), None);
    assert!(component_node.state_node().is_some());

    let text_node = store.fiber_arena().get(text).unwrap();
    assert_eq!(text_node.tag(), FiberTag::HostText);
    assert_eq!(text_node.return_fiber(), Some(component));
    assert_eq!(text_node.sibling(), None);
    assert!(text_node.state_node().is_some());

    let instance = result
        .detached_hosts()
        .instance(component_node.state_node())
        .unwrap();
    let text_instance = result
        .detached_hosts()
        .text(text_node.state_node())
        .unwrap();
    assert_eq!(instance.ty(), "span");
    assert_eq!(text_instance.text(), "hello");
    assert_eq!(text_instance.token(), FakeHostFiberToken(1));
    assert_eq!(instance.token(), FakeHostFiberToken(2));
    assert_eq!(
        instance.children(),
        &[FakeHostChild::Text(text_instance.id())]
    );
    assert_eq!(result.detached_hosts().instance_count(), 1);
    assert_eq!(result.detached_hosts().text_count(), 1);
    assert_eq!(store.host_tokens().len(), 2);
    store.fiber_arena().validate_topology().unwrap();

    assert_eq!(
        host.operations(),
        vec![
            "root_host_context",
            "child_host_context",
            "should_set_text_content",
            "create_text_instance",
            "create_instance",
            "append_initial_child",
            "finalize_initial_children",
        ]
    );
}
#[test]
fn host_work_detached_records_validate_through_host_node_store_scopes() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("article", "stored");
    let render = render_test_root(&mut store, root_id, element);

    let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();

    let component = result.root_child.unwrap();
    let component_node = store.fiber_arena().get(component).unwrap();
    let text = component_node.child().unwrap();
    let text_node = store.fiber_arena().get(text).unwrap();
    let instance_handle = component_node.state_node();
    let text_handle = text_node.state_node();
    assert_ne!(instance_handle, text_handle);

    let instance_metadata = result
        .detached_hosts()
        .instance_metadata(instance_handle)
        .unwrap();
    assert_eq!(instance_metadata.handle(), instance_handle);
    assert_eq!(instance_metadata.root_id(), root_id);
    assert_eq!(instance_metadata.fiber_id(), component);
    assert_eq!(instance_metadata.phase(), HostFiberTokenPhase::Creation);
    assert_eq!(instance_metadata.target(), HostFiberTokenTarget::Instance);
    assert!(instance_metadata.is_active());
    store
        .host_tokens()
        .validate(
            instance_metadata.token_id(),
            root_id,
            component,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        )
        .unwrap();

    let text_metadata = result.detached_hosts().text_metadata(text_handle).unwrap();
    assert_eq!(text_metadata.handle(), text_handle);
    assert_eq!(text_metadata.root_id(), root_id);
    assert_eq!(text_metadata.fiber_id(), text);
    assert_eq!(text_metadata.phase(), HostFiberTokenPhase::Creation);
    assert_eq!(text_metadata.target(), HostFiberTokenTarget::TextInstance);
    assert!(text_metadata.is_active());
    store
        .host_tokens()
        .validate(
            text_metadata.token_id(),
            root_id,
            text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        )
        .unwrap();

    let wrong_fiber_scope = HostNodeScope::new(
        root_id,
        text,
        instance_metadata.token_id(),
        HostFiberTokenPhase::Creation,
    );
    assert_eq!(
        result
            .detached_hosts()
            .nodes
            .instance(instance_handle, wrong_fiber_scope)
            .unwrap_err()
            .violation(),
        HostNodeViolation::WrongFiber
    );

    let instance_scope = HostNodeScope::new(
        root_id,
        component,
        instance_metadata.token_id(),
        HostFiberTokenPhase::Creation,
    );
    assert_eq!(
        result
            .detached_hosts()
            .nodes
            .text(instance_handle, instance_scope)
            .unwrap_err()
            .violation(),
        HostNodeViolation::WrongTarget
    );
}
#[test]
fn host_work_mounts_multiple_host_root_siblings_under_host_root_wip() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let first_element = source.insert_text("first sibling");
    let second_element = source.insert_host_element_with_text("span", "second sibling");
    let current = store.root(root_id).unwrap().current();
    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_700));
    let work_in_progress = render.work_in_progress();

    let result = mount_test_host_sibling_work(
        &mut store,
        &mut host,
        render,
        &source,
        &[first_element, second_element],
    )
    .unwrap();

    assert_eq!(result.root, root_id);
    assert_eq!(result.work_in_progress, work_in_progress);
    assert_eq!(result.root_child_count(), 2);
    assert_eq!(result.completed_child_count(), 2);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.fiber_arena().get(current).unwrap().child(), None);

    let root = store.fiber_arena().get(work_in_progress).unwrap();
    let first = root.child().unwrap();
    let first_node = store.fiber_arena().get(first).unwrap();
    let second = first_node.sibling().unwrap();
    let second_node = store.fiber_arena().get(second).unwrap();
    let nested_text = second_node.child().unwrap();
    assert_eq!(result.root_child, Some(first));
    assert_eq!(result.completed_child, Some(first));
    assert_eq!(result.root_children(), &[first, second]);
    assert_eq!(result.completed_children(), &[first, second]);
    assert_eq!(root.child_lanes(), Lanes::NO);
    assert!(root.subtree_flags().contains_all(FiberFlags::PLACEMENT));

    assert_eq!(first_node.tag(), FiberTag::HostText);
    assert_eq!(first_node.return_fiber(), Some(work_in_progress));
    assert_eq!(first_node.sibling(), Some(second));
    assert!(first_node.flags().contains_all(FiberFlags::PLACEMENT));
    assert!(first_node.state_node().is_some());

    assert_eq!(second_node.tag(), FiberTag::HostComponent);
    assert_eq!(second_node.return_fiber(), Some(work_in_progress));
    assert_eq!(second_node.sibling(), None);
    assert!(second_node.flags().contains_all(FiberFlags::PLACEMENT));
    assert!(second_node.state_node().is_some());

    let nested_text_node = store.fiber_arena().get(nested_text).unwrap();
    assert_eq!(nested_text_node.tag(), FiberTag::HostText);
    assert_eq!(nested_text_node.return_fiber(), Some(second));
    assert_eq!(nested_text_node.sibling(), None);
    assert!(nested_text_node.state_node().is_some());

    let first_text_instance = result
        .detached_hosts()
        .text(first_node.state_node())
        .unwrap();
    let second_instance = result
        .detached_hosts()
        .instance(second_node.state_node())
        .unwrap();
    let nested_text_instance = result
        .detached_hosts()
        .text(nested_text_node.state_node())
        .unwrap();
    assert_eq!(first_text_instance.text(), "first sibling");
    assert_eq!(second_instance.ty(), "span");
    assert_eq!(nested_text_instance.text(), "second sibling");
    assert_eq!(
        second_instance.children(),
        &[FakeHostChild::Text(nested_text_instance.id())]
    );
    assert_eq!(result.detached_hosts().instance_count(), 1);
    assert_eq!(result.detached_hosts().text_count(), 2);
    assert_eq!(store.host_tokens().len(), 3);
    store.fiber_arena().validate_topology().unwrap();

    assert_eq!(
        host.operations(),
        vec![
            "root_host_context",
            "create_text_instance",
            "child_host_context",
            "should_set_text_content",
            "create_text_instance",
            "create_instance",
            "append_initial_child",
            "finalize_initial_children",
        ]
    );
}
#[test]
fn host_work_mounts_text_only_child_under_host_root_wip() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let element = source.insert_text("root text");
    let render = render_test_root(&mut store, root_id, element);

    let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();

    let root = store.fiber_arena().get(render.work_in_progress()).unwrap();
    let text = root.child().unwrap();
    let text_node = store.fiber_arena().get(text).unwrap();
    assert_eq!(text_node.tag(), FiberTag::HostText);
    assert_eq!(text_node.return_fiber(), Some(render.work_in_progress()));
    assert!(text_node.flags().contains_all(FiberFlags::PLACEMENT));
    assert_eq!(root.child_lanes(), Lanes::NO);
    assert!(root.subtree_flags().contains_all(FiberFlags::PLACEMENT));

    let text_instance = result
        .detached_hosts()
        .text(text_node.state_node())
        .unwrap();
    assert_eq!(text_instance.text(), "root text");
    assert_eq!(text_instance.token(), FakeHostFiberToken(1));
    assert_eq!(result.detached_hosts().instance_count(), 0);
    assert_eq!(result.detached_hosts().text_count(), 1);
    assert_eq!(store.host_tokens().len(), 1);
    assert_eq!(
        host.operations(),
        vec!["root_host_context", "create_text_instance"]
    );
}
#[test]
fn host_work_applies_root_text_placement_record_to_test_container_only_after_commit() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(71));
    let child = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        render.finished_work(),
        "placed",
        FiberFlags::PLACEMENT,
    );
    let operations_before_commit = host.operations();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let operations_before_apply = host.operations();
    let apply =
        apply_test_host_root_commit_mutations(&mut store, &mut host, &commit, &mut detached_hosts)
            .unwrap();

    assert_eq!(operations_before_apply, operations_before_commit);
    assert_eq!(apply.root(), root_id);
    assert_eq!(apply.finished_work(), commit.finished_work());
    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().fiber(), child);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::AppendChildToContainer
        )
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert!(host.operations().ends_with(&["append_child_to_container"]));
}
#[test]
fn host_work_applies_root_text_placement_before_recorded_stable_sibling() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(72));
    let current_sibling = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "stable sibling",
        FiberFlags::PLACEMENT,
    );
    let sibling_state_node = store
        .fiber_arena()
        .get(current_sibling)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(73), None).unwrap();
    let insert_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let placed = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        insert_render.finished_work(),
        "inserted before",
        FiberFlags::PLACEMENT,
    );
    let stable_sibling = stable_root_text_work_in_progress_for_commit(
        &mut store,
        current_sibling,
        PropsHandle::from_raw(9003),
    );
    store
        .fiber_arena_mut()
        .set_children(insert_render.finished_work(), &[placed, stable_sibling])
        .unwrap();
    complete_host_root(&mut store, insert_render.finished_work()).unwrap();

    let insert_commit = commit_finished_host_root(&mut store, insert_render).unwrap();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &insert_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().fiber(), placed);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    );
    let sibling = apply.records()[0].mutation().placement_sibling().unwrap();
    assert_eq!(
        sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(sibling.sibling(), Some(stable_sibling));
    assert_eq!(sibling.sibling_tag(), Some(FiberTag::HostText));
    assert_eq!(sibling.sibling_state_node(), sibling_state_node);
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::InsertInContainerBefore
        )
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    let mut expected_operations = operations_before_apply;
    expected_operations.push("insert_in_container_before");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_applies_two_root_host_sibling_placements_in_commit_order() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let component_element = source.insert_host_element_with_text("article", "ignored");
    let component_source = element_from_root(&source, component_element);
    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(75));
    let component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        render.finished_work(),
        component_source,
        FiberFlags::PLACEMENT,
    );
    let component_state_node = store.fiber_arena().get(component).unwrap().state_node();
    let text = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        render.finished_work(),
        "second root child",
        FiberFlags::PLACEMENT,
    );
    let text_state_node = store.fiber_arena().get(text).unwrap().state_node();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[component, text])
        .unwrap();
    complete_host_root(&mut store, render.finished_work()).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let diagnostics = commit.host_root_placement_apply_diagnostics_for_canary();
    let operations_before_apply = host.operations();
    let apply =
        apply_test_host_root_commit_mutations(&mut store, &mut host, &commit, &mut detached_hosts)
            .unwrap();

    assert_eq!(diagnostics.len(), 2);
    assert_eq!(diagnostics[0].fiber(), component);
    assert_eq!(diagnostics[0].tag_name(), "HostComponent");
    assert_eq!(diagnostics[0].state_node(), component_state_node);
    assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
    assert_eq!(diagnostics[0].sibling_status(), "append");
    assert_eq!(diagnostics[0].sibling(), None);
    assert_eq!(diagnostics[0].skipped_pending_sibling_count(), 1);
    assert!(!diagnostics[0].can_insert_before());
    assert_eq!(diagnostics[1].fiber(), text);
    assert_eq!(diagnostics[1].tag_name(), "HostText");
    assert_eq!(diagnostics[1].state_node(), text_state_node);
    assert_eq!(diagnostics[1].apply_kind(), "append-placement-to-container");
    assert_eq!(diagnostics[1].sibling_status(), "append");
    assert_eq!(diagnostics[1].sibling(), None);
    assert_eq!(diagnostics[1].skipped_pending_sibling_count(), 0);
    assert!(!diagnostics[1].can_insert_before());

    assert_eq!(apply.records().len(), 2);
    assert_eq!(apply.records()[0].mutation().fiber(), component);
    assert_eq!(
        apply.records()[0].mutation().state_node(),
        component_state_node
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(
        apply.records()[0]
            .mutation()
            .placement_sibling()
            .unwrap()
            .skipped_pending_sibling_count(),
        1
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::AppendChildToContainer
        )
    );
    assert_eq!(apply.records()[1].mutation().fiber(), text);
    assert_eq!(apply.records()[1].mutation().state_node(), text_state_node);
    assert_eq!(
        apply.records()[1].mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(
        apply.records()[1].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::AppendChildToContainer
        )
    );
    assert_eq!(apply.applied_host_call_count(), 2);
    let mut expected_operations = operations_before_apply;
    expected_operations.push("append_child_to_container");
    expected_operations.push("append_child_to_container");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_inserts_two_root_host_sibling_placements_before_stable_sibling() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let component_element = source.insert_host_element_with_text("article", "ignored");
    let component_source = element_from_root(&source, component_element);
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(76));
    let current_stable = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "stable sibling",
        FiberFlags::PLACEMENT,
    );
    let stable_state_node = store
        .fiber_arena()
        .get(current_stable)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(77), None).unwrap();
    let insert_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        insert_render.finished_work(),
        component_source,
        FiberFlags::PLACEMENT,
    );
    let component_state_node = store.fiber_arena().get(component).unwrap().state_node();
    let text = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        insert_render.finished_work(),
        "inserted text",
        FiberFlags::PLACEMENT,
    );
    let text_state_node = store.fiber_arena().get(text).unwrap().state_node();
    let stable_work = stable_root_text_work_in_progress_for_commit(
        &mut store,
        current_stable,
        PropsHandle::from_raw(9013),
    );
    store
        .fiber_arena_mut()
        .set_children(
            insert_render.finished_work(),
            &[component, text, stable_work],
        )
        .unwrap();
    complete_host_root(&mut store, insert_render.finished_work()).unwrap();

    let insert_commit = commit_finished_host_root(&mut store, insert_render).unwrap();
    let diagnostics = insert_commit.host_root_placement_apply_diagnostics_for_canary();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &insert_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(diagnostics.len(), 2);
    assert_eq!(diagnostics[0].fiber(), component);
    assert_eq!(diagnostics[0].tag_name(), "HostComponent");
    assert_eq!(
        diagnostics[0].apply_kind(),
        "insert-placement-in-container-before"
    );
    assert_eq!(diagnostics[0].sibling_status(), "insert-before");
    assert_eq!(diagnostics[0].sibling(), Some(stable_work));
    assert_eq!(diagnostics[0].sibling_tag_name(), Some("HostText"));
    assert_eq!(diagnostics[0].sibling_state_node(), stable_state_node);
    assert_eq!(diagnostics[0].skipped_pending_sibling_count(), 1);
    assert!(diagnostics[0].can_insert_before());
    assert_eq!(diagnostics[1].fiber(), text);
    assert_eq!(diagnostics[1].tag_name(), "HostText");
    assert_eq!(
        diagnostics[1].apply_kind(),
        "insert-placement-in-container-before"
    );
    assert_eq!(diagnostics[1].sibling_status(), "insert-before");
    assert_eq!(diagnostics[1].sibling(), Some(stable_work));
    assert_eq!(diagnostics[1].sibling_state_node(), stable_state_node);
    assert_eq!(diagnostics[1].skipped_pending_sibling_count(), 0);
    assert!(diagnostics[1].can_insert_before());

    assert_eq!(apply.records().len(), 2);
    assert_eq!(apply.records()[0].mutation().fiber(), component);
    assert_eq!(
        apply.records()[0].mutation().state_node(),
        component_state_node
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    );
    assert_eq!(
        apply.records()[0]
            .mutation()
            .placement_sibling()
            .unwrap()
            .skipped_pending_sibling_count(),
        1
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::InsertInContainerBefore
        )
    );
    assert_eq!(apply.records()[1].mutation().fiber(), text);
    assert_eq!(apply.records()[1].mutation().state_node(), text_state_node);
    assert_eq!(
        apply.records()[1].mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    );
    assert_eq!(
        apply.records()[1].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::InsertInContainerBefore
        )
    );
    assert_eq!(apply.applied_host_call_count(), 2);
    let mut expected_operations = operations_before_apply;
    expected_operations.push("insert_in_container_before");
    expected_operations.push("insert_in_container_before");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_leaves_unproven_root_text_insertion_recorded_only() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(74));
    let placed = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        render.finished_work(),
        "blocked insertion",
        FiberFlags::PLACEMENT,
    );
    let mode = store
        .fiber_arena()
        .get(render.finished_work())
        .unwrap()
        .mode();
    let unproven_sibling = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9004),
        mode,
    );
    store
        .fiber_arena_mut()
        .get_mut(unproven_sibling)
        .unwrap()
        .set_memoized_props(PropsHandle::from_raw(9004));
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[placed, unproven_sibling])
        .unwrap();
    complete_host_root(&mut store, render.finished_work()).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let operations_before_apply = host.operations();
    let apply =
        apply_test_host_root_commit_mutations(&mut store, &mut host, &commit, &mut detached_hosts)
            .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().fiber(), placed);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked
    );
    let sibling = apply.records()[0].mutation().placement_sibling().unwrap();
    assert_eq!(
        sibling.status(),
        HostRootPlacementSiblingStatus::BlockedMissingStateNode
    );
    assert_eq!(sibling.sibling(), Some(unproven_sibling));
    assert_eq!(sibling.sibling_tag(), Some(FiberTag::HostText));
    assert_eq!(sibling.sibling_state_node(), StateNodeHandle::NONE);
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::RecordedOnly
    );
    assert_eq!(apply.applied_host_call_count(), 0);
    assert_eq!(host.operations(), operations_before_apply);
}
#[test]
fn host_work_applies_host_parent_text_placement_record_to_fake_host_config() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_parent = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let parent_state_node = store
        .fiber_arena()
        .get(current_parent)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(78), None).unwrap();
    let placement_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (work_parent, placed_text) = place_detached_text_under_existing_host_parent_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        placement_render.finished_work(),
        current_parent,
        "placed child",
    );
    let text_state_node = store.fiber_arena().get(placed_text).unwrap().state_node();
    let placement_commit = commit_finished_host_root(&mut store, placement_render).unwrap();
    assert_eq!(
        placement_commit.test_only_host_parent_placement_apply_count_for_canary(),
        1
    );
    assert!(
        placement_commit.has_test_only_host_parent_placement_apply_for_canary(
            parent_state_node.raw(),
            text_state_node.raw()
        )
    );
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &placement_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().parent(), work_parent);
    assert_eq!(
        apply.records()[0].mutation().parent_state_node(),
        parent_state_node
    );
    assert_eq!(apply.records()[0].mutation().fiber(), placed_text);
    assert_eq!(apply.records()[0].mutation().state_node(), text_state_node);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(
        detached_hosts.text(text_state_node).unwrap().text(),
        "placed child"
    );
    let mut expected_operations = operations_before_apply;
    expected_operations.push("append_child");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_applies_nested_host_parent_text_placement_record_to_fake_host_config() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(82));
    let (current_outer, current_inner, current_text) =
        attach_detached_nested_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "stable",
        );
    let inner_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
    let outer_state_node = store.fiber_arena().get(current_outer).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(83), None).unwrap();
    let placement_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (_work_outer, work_inner, stable_text, placed_text) =
        place_detached_text_under_existing_nested_host_parent_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            placement_render.finished_work(),
            (current_outer, current_inner, current_text),
            "nested placed",
        );
    let text_state_node = store.fiber_arena().get(placed_text).unwrap().state_node();
    let placement_commit = commit_finished_host_root(&mut store, placement_render).unwrap();
    let diagnostics = placement_commit.host_parent_placement_apply_diagnostics_for_canary();

    assert_eq!(
        placement_commit.test_only_host_parent_placement_apply_count_for_canary(),
        1
    );
    assert!(
        placement_commit.has_test_only_host_parent_placement_apply_for_canary(
            inner_state_node.raw(),
            text_state_node.raw()
        )
    );
    assert!(
        !placement_commit.has_test_only_host_parent_placement_apply_for_canary(
            outer_state_node.raw(),
            text_state_node.raw()
        )
    );
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].parent(), work_inner);
    assert_eq!(diagnostics[0].parent_state_node(), inner_state_node);
    assert_eq!(diagnostics[0].fiber(), placed_text);
    assert_eq!(diagnostics[0].state_node(), text_state_node);
    assert!(diagnostics[0].applies_to_host_parent());
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &placement_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().parent(), work_inner);
    assert_eq!(
        apply.records()[0].mutation().parent_state_node(),
        inner_state_node
    );
    assert_eq!(apply.records()[0].mutation().fiber(), placed_text);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(
        detached_hosts.text(text_state_node).unwrap().text(),
        "nested placed"
    );
    assert_eq!(
        store.fiber_arena().get(work_inner).unwrap().child(),
        Some(stable_text)
    );
    assert_eq!(
        store.fiber_arena().get(stable_text).unwrap().sibling(),
        Some(placed_text)
    );
    let mut expected_operations = operations_before_apply;
    expected_operations.push("append_child");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_reorders_host_parent_text_before_stable_sibling_with_insert_before() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(96));
    let (current_parent, current_stable_text, current_moving_text) =
        attach_detached_root_element_with_two_texts_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "stable",
            "moving",
        );
    let parent_state_node = store
        .fiber_arena()
        .get(current_parent)
        .unwrap()
        .state_node();
    let stable_state_node = store
        .fiber_arena()
        .get(current_stable_text)
        .unwrap()
        .state_node();
    let moving_state_node = store
        .fiber_arena()
        .get(current_moving_text)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(97), None).unwrap();
    let reorder_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (work_parent, moving_work, stable_work) =
        reorder_existing_text_before_stable_host_sibling_for_commit(
            &mut store,
            reorder_render.finished_work(),
            current_parent,
            current_moving_text,
            current_stable_text,
            None,
        );
    let reorder_commit = commit_finished_host_root(&mut store, reorder_render).unwrap();
    let diagnostics = reorder_commit.host_parent_placement_apply_diagnostics_for_canary();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &reorder_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(reorder_commit.mutation_apply_log().records().len(), 1);
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].parent(), work_parent);
    assert_eq!(diagnostics[0].parent_state_node(), parent_state_node);
    assert_eq!(diagnostics[0].fiber(), moving_work);
    assert_eq!(diagnostics[0].state_node(), moving_state_node);
    assert_eq!(
        diagnostics[0].apply_kind(),
        "insert-placement-in-host-parent-before"
    );
    assert_eq!(diagnostics[0].sibling_status(), "insert-before");
    assert_eq!(diagnostics[0].sibling(), Some(stable_work));
    assert_eq!(diagnostics[0].sibling_tag_name(), Some("HostText"));
    assert_eq!(diagnostics[0].sibling_state_node(), stable_state_node);
    assert!(diagnostics[0].can_insert_before());
    assert!(diagnostics[0].applies_to_host_parent());

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().parent(), work_parent);
    assert_eq!(apply.records()[0].mutation().fiber(), moving_work);
    assert_eq!(
        apply.records()[0].mutation().alternate_fiber(),
        Some(current_moving_text)
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    );
    let sibling = apply.records()[0].mutation().placement_sibling().unwrap();
    assert_eq!(
        sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(sibling.sibling(), Some(stable_work));
    assert_eq!(sibling.sibling_state_node(), stable_state_node);
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::InsertBefore)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(
        detached_hosts.text(moving_state_node).unwrap().text(),
        "moving"
    );
    assert_eq!(
        detached_hosts.text(stable_state_node).unwrap().text(),
        "stable"
    );
    assert_eq!(
        detached_hosts
            .text_metadata(moving_state_node)
            .unwrap()
            .fiber_id(),
        current_moving_text
    );
    assert_eq!(
        detached_hosts
            .text_metadata(stable_state_node)
            .unwrap()
            .fiber_id(),
        current_stable_text
    );
    let mut expected_operations = operations_before_apply;
    expected_operations.push("insert_before");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_rejects_host_parent_reorder_with_wrong_sibling_handle_before_mutation() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(98));
    let (current_parent, current_stable_text, current_moving_text) =
        attach_detached_root_element_with_two_texts_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "stable",
            "moving",
        );
    let parent_state_node = store
        .fiber_arena()
        .get(current_parent)
        .unwrap()
        .state_node();
    let moving_state_node = store
        .fiber_arena()
        .get(current_moving_text)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(99), None).unwrap();
    let reorder_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (work_parent, moving_work, stable_work) =
        reorder_existing_text_before_stable_host_sibling_for_commit(
            &mut store,
            reorder_render.finished_work(),
            current_parent,
            current_moving_text,
            current_stable_text,
            Some(parent_state_node),
        );
    let reorder_commit = commit_finished_host_root(&mut store, reorder_render).unwrap();
    let operations_before_apply = host.operations();

    let error = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &reorder_commit,
        &mut detached_hosts,
    )
    .unwrap_err();

    let mutation = reorder_commit.mutation_apply_log().records()[0];
    assert_eq!(mutation.parent(), work_parent);
    assert_eq!(mutation.fiber(), moving_work);
    assert_eq!(mutation.state_node(), moving_state_node);
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    );
    let sibling = mutation.placement_sibling().unwrap();
    assert_eq!(
        sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(sibling.sibling(), Some(stable_work));
    assert_eq!(sibling.sibling_state_node(), parent_state_node);
    assert_eq!(host.operations(), operations_before_apply);
    match error {
        HostWorkError::HostNode(error) => {
            assert_eq!(error.violation(), HostNodeViolation::WrongTarget);
        }
        other => panic!("expected wrong-target host node validation, got {other:?}"),
    }
}
#[test]
fn host_work_leaves_child_placement_under_new_host_parent_recorded_only() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(79));
    let (parent, text) = attach_detached_root_element_with_placed_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "nested",
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 2);
    assert_eq!(apply.records()[0].mutation().fiber(), parent);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::AppendChildToContainer
        )
    );
    assert_eq!(apply.records()[1].mutation().parent(), parent);
    assert_eq!(apply.records()[1].mutation().fiber(), text);
    assert_eq!(
        apply.records()[1].mutation().kind(),
        HostRootMutationApplyRecordKind::SkipUnsupportedNestedPlacement
    );
    assert_eq!(
        apply.records()[1].status(),
        TestHostRootMutationApplyStatus::RecordedOnly
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    let mut expected_operations = operations_before_apply;
    expected_operations.push("append_child_to_container");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_does_not_mutate_container_switch_current_or_finish_work() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("div", "detached");
    let current = store.root(root_id).unwrap().current();
    let render = render_test_root(&mut store, root_id, element);

    let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();

    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(result.work_in_progress)
    );

    let operations = host.operations();
    for forbidden in [
        "prepare_for_commit",
        "reset_after_commit",
        "append_child",
        "append_child_to_container",
        "insert_before",
        "insert_in_container_before",
        "remove_child",
        "remove_child_from_container",
        "clear_container",
    ] {
        assert!(
            !operations.contains(&forbidden),
            "host work unexpectedly called {forbidden}"
        );
    }
    assert!(operations.contains(&"append_initial_child"));
}
