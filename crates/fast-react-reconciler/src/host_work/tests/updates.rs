use super::helpers::*;
use super::*;

#[test]
fn host_work_rejects_sequence_only_component_payload_currentness_before_recording() {
    let mut fixture = root_component_update_apply_fixture();
    let scope = fixture
        .detached_hosts
        .scope(fixture.state_node, HostFiberTokenTarget::Instance)
        .unwrap();
    let row = fixture.payload.property_row();
    let update = HostNodePropertyUpdate::new(
        row.prop_name(),
        row.property_name(),
        fixture.payload.old_props(),
        fixture.payload.new_props(),
    )
    .with_payload_kind(row.kind().as_str())
    .with_execution(HostNodePropertyUpdateExecution::CommitUpdate);

    let error = fixture
        .detached_hosts
        .nodes
        .apply_instance_property_update(fixture.state_node, scope, update)
        .unwrap_err();

    assert_eq!(error.violation(), HostNodeViolation::MissingCurrentness);
    assert_eq!(
        fixture
            .detached_hosts
            .instance_property_updates(fixture.state_node)
            .unwrap(),
        &[]
    );
}
#[test]
fn host_work_rejects_sequence_only_text_payload_currentness_before_recording() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(79_200));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let scope = detached_hosts
        .scope(state_node, HostFiberTokenTarget::TextInstance)
        .unwrap();

    let error = detached_hosts
        .nodes
        .apply_text_update(
            state_node,
            scope,
            HostNodeTextUpdate::new("before", "after"),
        )
        .unwrap_err();

    assert_eq!(error.violation(), HostNodeViolation::MissingCurrentness);
    assert_eq!(
        detached_hosts
            .test_host_text_record_updates(state_node)
            .unwrap(),
        &[]
    );
}
#[test]
fn host_work_host_text_update_records_changed_diff_through_host_node_store() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("span", "before");
    let render = render_test_root(&mut store, root_id, element);
    let mut result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();
    let component = result.root_child.unwrap();
    let current_text = store.fiber_arena().get(component).unwrap().child().unwrap();
    let current_text_node = store.fiber_arena().get(current_text).unwrap();
    let state_node = current_text_node.state_node();
    let update_element = source.insert_text("after");
    let update_text = text_from_root(&source, update_element);
    let operations_before_update = host.operations();

    let diff = update_test_host_text_work(
        &mut store,
        root_id,
        current_text,
        update_text,
        Lanes::DEFAULT,
        result.detached_hosts_mut(),
    )
    .unwrap();

    assert_eq!(diff.current(), current_text);
    assert_ne!(diff.work_in_progress(), current_text);
    assert_eq!(diff.state_node(), state_node);
    assert_eq!(diff.old_text(), "before");
    assert_eq!(diff.new_text(), "after");
    assert!(diff.changed());
    assert_eq!(diff.metadata().handle(), state_node);
    assert_eq!(diff.metadata().root_id(), root_id);
    assert_eq!(diff.metadata().fiber_id(), current_text);
    assert_eq!(diff.metadata().phase(), HostFiberTokenPhase::Creation);
    assert_eq!(diff.metadata().target(), HostFiberTokenTarget::TextInstance);

    let work_text = store.fiber_arena().get(diff.work_in_progress()).unwrap();
    assert_eq!(work_text.alternate(), Some(current_text));
    assert_eq!(work_text.state_node(), state_node);
    assert_eq!(work_text.memoized_props(), update_text.props());
    assert!(work_text.flags().contains_all(FiberFlags::UPDATE));
    assert!(!work_text.flags().contains_all(FiberFlags::PLACEMENT));
    assert_eq!(
        result.detached_hosts().text(state_node).unwrap().text(),
        "before"
    );
    assert_eq!(result.detached_hosts().text_count(), 1);
    assert_eq!(store.host_tokens().len(), 2);
    assert_eq!(host.operations(), operations_before_update);

    let wip_scope = HostNodeScope::new(
        root_id,
        diff.work_in_progress(),
        diff.metadata().token_id(),
        HostFiberTokenPhase::Creation,
    );
    assert_eq!(
        result
            .detached_hosts()
            .nodes
            .text(state_node, wip_scope)
            .unwrap_err()
            .violation(),
        HostNodeViolation::WrongFiber
    );
    store.fiber_arena().validate_topology().unwrap();
}
#[test]
fn host_work_host_text_update_records_unchanged_diff_without_update_flag() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("span", "stable");
    let render = render_test_root(&mut store, root_id, element);
    let mut result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();
    let component = result.root_child.unwrap();
    let current_text = store.fiber_arena().get(component).unwrap().child().unwrap();
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let update_element = source.insert_text("stable");
    let update_text = text_from_root(&source, update_element);
    let operations_before_update = host.operations();

    let diff = update_test_host_text_work(
        &mut store,
        root_id,
        current_text,
        update_text,
        Lanes::DEFAULT,
        result.detached_hosts_mut(),
    )
    .unwrap();

    assert_eq!(diff.current(), current_text);
    assert_eq!(diff.state_node(), state_node);
    assert_eq!(diff.old_text(), "stable");
    assert_eq!(diff.new_text(), "stable");
    assert!(!diff.changed());
    assert_eq!(diff.metadata().fiber_id(), current_text);

    let work_text = store.fiber_arena().get(diff.work_in_progress()).unwrap();
    assert_eq!(work_text.state_node(), state_node);
    assert_eq!(work_text.memoized_props(), update_text.props());
    assert_eq!(work_text.flags(), FiberFlags::NO);
    assert_eq!(
        result.detached_hosts().text(state_node).unwrap().text(),
        "stable"
    );
    assert_eq!(result.detached_hosts().text_count(), 1);
    assert_eq!(store.host_tokens().len(), 2);
    assert_eq!(host.operations(), operations_before_update);
    store.fiber_arena().validate_topology().unwrap();
}
#[test]
fn host_work_applies_root_host_component_update_payload_to_fake_host_config() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let initial_props = initial.props();
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let state_node = store
        .fiber_arena()
        .get(current_component)
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

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let payload = update_root_component_for_commit(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(payload.root(), root_id);
    assert_eq!(payload.current(), current_component);
    assert_eq!(payload.state_node(), state_node);
    assert_eq!(payload.old_props(), initial_props);
    assert_eq!(payload.new_props(), next.props());
    assert_eq!(payload.ty(), "section");
    assert_eq!(
        payload.property_row().kind(),
        TestHostComponentPropertyPayloadKind::SafeTestProperty
    );
    assert_eq!(
        payload.property_row().prop_name(),
        TEST_HOST_SAFE_PROPERTY_PROP_NAME
    );
    assert!(
        !payload
            .property_row()
            .public_dom_property_compatibility_claimed()
    );
    assert_eq!(apply.records().len(), 1);
    assert_eq!(
        apply.records()[0].mutation().fiber(),
        payload.work_in_progress()
    );
    assert_eq!(
        apply.records()[0].mutation().alternate_fiber(),
        Some(current_component)
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(store.host_tokens().len(), token_count_before_apply + 1);
    assert_eq!(detached_hosts.instance(state_node).unwrap().ty(), "section");
    assert_single_test_property_update(
        &detached_hosts,
        state_node,
        root_id,
        current_component,
        initial_props,
        next.props(),
    );
    let mut expected_operations = operations_before_apply;
    expected_operations.push("commit_update");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_host_component_update_rejects_replayed_commit_record_before_second_host_call() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let state_node = store
        .fiber_arena()
        .get(current_component)
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

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let payload = update_root_component_for_commit(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let first_apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();
    assert_eq!(first_apply.applied_host_call_count(), 1);
    assert_eq!(
        first_apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    let operations_after_first_apply = host.operations();
    let token_count_after_first_apply = store.host_tokens().len();

    let error = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::ConsumedHostUpdatePayload {
            root,
            fiber,
            state_node: consumed_state_node,
            kind,
        } if root == root_id
            && fiber == payload.work_in_progress()
            && consumed_state_node == state_node
            && kind == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    ));
    assert_eq!(host.operations(), operations_after_first_apply);
    assert_eq!(store.host_tokens().len(), token_count_after_first_apply);
}
#[test]
fn host_work_commits_style_row_to_private_host_store_then_latest_props_without_host_call() {
    let mut fixture = root_component_update_apply_fixture();
    let row = TestHostComponentPropertyPayloadRow::style(
        fixture.payload.old_props(),
        fixture.payload.new_props(),
    );
    fixture.detached_hosts.component_updates[0].property_row = row;

    let apply = apply_test_host_root_commit_mutations(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.commit,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::PrivateHostStoreOnly(
            TestHostRootPrivateStoreMutation::HostComponentPropertyAndLatestProps
        )
    );
    assert_eq!(apply.applied_host_call_count(), 0);
    assert_eq!(apply.private_host_store_update_count(), 1);
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
    assert_single_component_property_update(
        &fixture.detached_hosts,
        fixture.state_node,
        fixture.root_id,
        fixture.payload.current(),
        fixture.payload.old_props(),
        fixture.payload.new_props(),
        row.kind(),
        row.prop_name(),
        row.property_name(),
        HostNodePropertyUpdateExecution::CommitUpdate,
    );
    assert_single_latest_props_update_after_property_update(
        &fixture.detached_hosts,
        fixture.state_node,
        fixture.root_id,
        fixture.payload.current(),
        fixture.payload.old_props(),
        fixture.payload.new_props(),
        row.kind(),
        row.prop_name(),
    );
    assert!(!row.public_dom_property_compatibility_claimed());
    assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
}
#[test]
fn host_work_records_text_content_reset_row_as_private_host_payload_execution() {
    let mut fixture = root_component_update_apply_fixture();
    let row = TestHostComponentPropertyPayloadRow::text_content_reset(
        fixture.payload.old_props(),
        fixture.payload.new_props(),
    );
    fixture.detached_hosts.component_updates[0].property_row = row;

    let apply = apply_test_host_root_commit_mutations(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.commit,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::ResetTextContent)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
    assert_single_component_property_update(
        &fixture.detached_hosts,
        fixture.state_node,
        fixture.root_id,
        fixture.payload.current(),
        fixture.payload.old_props(),
        fixture.payload.new_props(),
        TestHostComponentPropertyPayloadKind::TextContent,
        TEST_HOST_TEXT_CONTENT_PROP_NAME,
        TEST_HOST_TEXT_CONTENT_PROPERTY_NAME,
        HostNodePropertyUpdateExecution::ResetTextContent,
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("reset_text_content");
    assert_eq!(fixture.host.operations(), expected_operations);
}
#[test]
fn host_work_host_component_rejects_property_payload_metadata_mismatch_before_commit() {
    let mut fixture = root_component_update_apply_fixture();
    fixture.detached_hosts.component_updates[0].new_props = PropsHandle::from_raw(98_608);

    let error = apply_test_host_root_commit_mutations(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.commit,
        &mut fixture.detached_hosts,
    )
    .unwrap_err();

    assert_component_property_payload_error(
        error,
        fixture.root_id,
        fixture.payload.work_in_progress(),
        TEST_HOST_SAFE_PROPERTY_PROP_NAME,
        TestHostComponentPropertyPayloadViolation::WrongPendingProps,
    );
    assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
    assert!(
        fixture
            .detached_hosts
            .instance_property_updates(fixture.state_node)
            .unwrap()
            .is_empty()
    );
}

#[test]
fn host_work_rejects_update_cleanup_transfer_when_detached_metadata_is_updated_owned() {
    let fixture = root_component_update_apply_fixture();
    let source_scope = fixture
        .detached_hosts
        .scope(fixture.state_node, HostFiberTokenTarget::Instance)
        .unwrap();
    let instance = fixture
        .detached_hosts
        .instance(fixture.state_node)
        .unwrap()
        .clone();
    let mut updated_owned_detached_hosts = DetachedHostRecords::default();
    let updated_owned_state_node = updated_owned_detached_hosts.insert_instance(
        HostNodeScope::new(
            fixture.root_id,
            fixture.payload.work_in_progress(),
            source_scope.token_id(),
            source_scope.phase(),
        ),
        instance,
    );

    let error = detached_host_cleanup_ownership_transfer_for_update(
        &updated_owned_detached_hosts,
        fixture.root_id,
        fixture.commit.finished_work(),
        fixture.payload.current(),
        fixture.payload.work_in_progress(),
        FiberTag::HostComponent,
        updated_owned_state_node,
        HostFiberTokenTarget::Instance,
    )
    .unwrap_err();

    let HostWorkError::HostNode(error) = error else {
        panic!("expected HostNode wrong-fiber error for updated-owned cleanup transfer");
    };
    assert_eq!(error.violation(), HostNodeViolation::WrongFiber);
}

#[test]
fn host_work_host_component_rejects_stale_property_update_handles_before_commit_token_issue() {
    let mut fixture = root_component_update_apply_fixture();
    let scope = fixture
        .detached_hosts
        .scope(fixture.state_node, HostFiberTokenTarget::Instance)
        .unwrap();
    fixture
        .detached_hosts
        .nodes
        .invalidate_instance(fixture.state_node, scope)
        .unwrap();

    let error = apply_test_host_root_commit_mutations(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.commit,
        &mut fixture.detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostNode(ref error)
            if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
}
#[test]
fn host_work_applies_root_text_update_payload_to_fake_host_config() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(75));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_text("after");
    let next_text = text_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let diff = update_root_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(diff.current(), current_text);
    assert_eq!(diff.state_node(), state_node);
    assert_eq!(diff.old_text(), "before");
    assert_eq!(diff.new_text(), "after");
    assert_eq!(apply.records().len(), 1);
    assert_eq!(
        apply.records()[0].mutation().fiber(),
        diff.work_in_progress()
    );
    assert_eq!(
        apply.records()[0].mutation().alternate_fiber(),
        Some(current_text)
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitTextUpdate)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(detached_hosts.text(state_node).unwrap().text(), "before");
    let mut expected_operations = operations_before_apply;
    expected_operations.push("commit_text_update");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_host_text_update_rejects_replayed_commit_record_before_second_host_call() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(75_100));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_text("after");
    let next_text = text_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let diff = update_root_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let first_apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();
    assert_eq!(first_apply.applied_host_call_count(), 1);
    assert_eq!(
        first_apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitTextUpdate)
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        1
    );
    let operations_after_first_apply = host.operations();

    let error = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::ConsumedHostUpdatePayload {
            root,
            fiber,
            state_node: consumed_state_node,
            kind,
        } if root == root_id
            && fiber == diff.work_in_progress()
            && consumed_state_node == state_node
            && kind == HostRootMutationApplyRecordKind::CommitHostTextUpdate
    ));
    assert_eq!(host.operations(), operations_after_first_apply);
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        1
    );
}
#[test]
fn host_work_applies_host_parent_text_update_payload_to_fake_host_config() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(79));
    let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_text("after");
    let next_text = text_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let (work_parent, diff) = update_host_parent_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_parent,
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(diff.current(), current_text);
    assert_eq!(diff.state_node(), state_node);
    assert_eq!(diff.old_text(), "before");
    assert_eq!(diff.new_text(), "after");
    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().parent(), work_parent);
    assert_eq!(
        apply.records()[0].mutation().parent_tag(),
        FiberTag::HostComponent
    );
    assert_eq!(
        apply.records()[0].mutation().fiber(),
        diff.work_in_progress()
    );
    assert_eq!(
        apply.records()[0].mutation().alternate_fiber(),
        Some(current_text)
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitTextUpdate)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(detached_hosts.text(state_node).unwrap().text(), "before");
    let mut expected_operations = operations_before_apply;
    expected_operations.push("commit_text_update");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_text_update_commit_execution_rejects_tampered_finished_work_before_payload_consumption() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_905));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_text("after");
    let next_text = text_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_906));
    update_root_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 24)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        25,
    )
    .unwrap();
    let request = host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 26)
        .unwrap()
        .with_finished_work_for_canary(create_render.finished_work());
    let operations_before_execute = host.operations();

    let error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::InvalidHostTextCommitExecutionRequest {
            root,
            finished_work,
            fiber,
            violation: HostTextCommitExecutionRequestViolation::WrongFinishedWork,
        } if root == root_id
            && finished_work == create_render.finished_work()
            && fiber != current_text
    ));
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        0
    );
    assert_eq!(host.operations(), operations_before_execute);
}
#[test]
fn host_text_update_commit_execution_rejects_payload_without_source_currentness_before_host_call() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_907));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_908));
    let work_text = update_root_text_for_commit_without_payload(
        &mut store,
        update_render.finished_work(),
        current_text,
        PropsHandle::from_raw(7_909),
    );
    detached_hosts.record_text_update(HostTextUpdatePayload {
        root: root_id,
        current: current_text,
        work_in_progress: work_text,
        state_node,
        old_text: "before".to_owned(),
        new_text: "after".to_owned(),
        source_currentness: None,
    });
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 27)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        28,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 29).unwrap();
    let operations_before_execute = host.operations();

    let error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostNode(error)
            if error.violation() == HostNodeViolation::MissingCurrentness
    ));
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        0
    );
    assert_eq!(host.operations(), operations_before_execute);
}
#[test]
fn host_text_update_commit_execution_rejects_cross_sibling_payload_currentness_before_host_call() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_914));
    let current_text = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let sibling_text = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "sibling",
        FiberFlags::PLACEMENT,
    );
    store
        .fiber_arena_mut()
        .set_children(create_render.finished_work(), &[current_text, sibling_text])
        .unwrap();
    complete_host_root(&mut store, create_render.finished_work()).unwrap();
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let sibling_state_node = store.fiber_arena().get(sibling_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_915));
    let work_text = update_root_text_for_commit_without_payload(
        &mut store,
        update_render.finished_work(),
        current_text,
        PropsHandle::from_raw(7_916),
    );
    let sibling_metadata = detached_hosts.text_metadata(sibling_state_node).unwrap();
    detached_hosts.record_text_update(HostTextUpdatePayload {
        root: root_id,
        current: current_text,
        work_in_progress: work_text,
        state_node,
        old_text: "before".to_owned(),
        new_text: "after".to_owned(),
        source_currentness: Some(
            HostNodeUpdateCurrentness::new()
                .with_handle(state_node)
                .with_root_id(root_id)
                .with_fiber_id(sibling_text)
                .with_token_id(sibling_metadata.token_id())
                .with_phase(sibling_metadata.phase())
                .with_target(HostFiberTokenTarget::TextInstance),
        ),
    });
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 34)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        35,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 36).unwrap();
    let operations_before_execute = host.operations();

    let error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostNode(error)
            if error.violation() == HostNodeViolation::WrongFiber
    ));
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        0
    );
    assert_eq!(host.operations(), operations_before_execute);
}
#[test]
fn host_text_update_commit_execution_rejects_unchanged_payload_without_mutating_record() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_910));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "stable",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_911));
    let work_text = update_root_text_for_commit_without_payload(
        &mut store,
        update_render.finished_work(),
        current_text,
        PropsHandle::from_raw(7_912),
    );
    detached_hosts.record_text_update(HostTextUpdatePayload {
        root: root_id,
        current: current_text,
        work_in_progress: work_text,
        state_node,
        old_text: "stable".to_owned(),
        new_text: "stable".to_owned(),
        source_currentness: None,
    });
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 31)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        32,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 33).unwrap();
    let operations_before_execute = host.operations();

    let error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::UnchangedHostTextUpdatePayload {
            root,
            current,
            work_in_progress,
            state_node: rejected_state_node
        } if root == root_id
            && current == current_text
            && work_in_progress == work_text
            && rejected_state_node == state_node
    ));
    assert_eq!(
        detached_hosts
            .test_host_text_record_text(state_node)
            .unwrap(),
        "stable"
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        0
    );
    assert_eq!(host.operations(), operations_before_execute);
}
#[test]
fn host_text_update_commit_execution_rejects_stale_host_token_before_mutating_record() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_920));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_text("after");
    let next_text = text_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_921));
    let diff = update_root_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 41)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        42,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 43).unwrap();
    let metadata = detached_hosts.text_metadata(state_node).unwrap();
    store
        .host_tokens_mut()
        .invalidate(metadata.token_id(), metadata.phase(), metadata.target())
        .unwrap();
    let operations_before_execute = host.operations();

    let error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostFiberToken(error)
            if error.violation() == HostFiberTokenViolation::Stale
    ));
    assert_eq!(diff.old_text(), "before");
    assert_eq!(diff.new_text(), "after");
    assert_eq!(
        detached_hosts
            .test_host_text_record_text(state_node)
            .unwrap(),
        "before"
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        0
    );
    assert_eq!(host.operations(), operations_before_execute);
}
#[test]
fn host_text_update_commit_execution_rejects_wrong_root_text_handle_before_mutating_record() {
    let (mut store, root_id) = root_store();
    let second_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let second_render =
        render_test_root(&mut store, second_root, RootElementHandle::from_raw(7_930));
    let second_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        second_root,
        second_render.finished_work(),
        "foreign",
        FiberFlags::PLACEMENT,
    );
    let foreign_state_node = store.fiber_arena().get(second_text).unwrap().state_node();

    let current_root = store.root(root_id).unwrap().current();
    let mode = store.fiber_arena().get(current_root).unwrap().mode();
    let current_text = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(7_931),
        mode,
    );
    {
        let node = store.fiber_arena_mut().get_mut(current_text).unwrap();
        node.set_state_node(foreign_state_node);
        node.set_memoized_props(PropsHandle::from_raw(7_931));
    }
    store
        .fiber_arena_mut()
        .set_children(current_root, &[current_text])
        .unwrap();
    complete_host_root(&mut store, current_root).unwrap();

    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_932));
    let work_text = update_root_text_for_commit_without_payload(
        &mut store,
        update_render.finished_work(),
        current_text,
        PropsHandle::from_raw(7_933),
    );
    detached_hosts.record_text_update(HostTextUpdatePayload {
        root: root_id,
        current: current_text,
        work_in_progress: work_text,
        state_node: foreign_state_node,
        old_text: "foreign".to_owned(),
        new_text: "after".to_owned(),
        source_currentness: None,
    });
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 51)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        52,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 53).unwrap();
    let operations_before_execute = host.operations();

    let error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostNode(error)
            if error.violation() == HostNodeViolation::WrongRoot
    ));
    assert_eq!(
        detached_hosts
            .test_host_text_record_text(foreign_state_node)
            .unwrap(),
        "foreign"
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(foreign_state_node)
            .unwrap(),
        0
    );
    assert_eq!(host.operations(), operations_before_execute);
}
#[test]
fn host_work_applies_host_component_property_and_text_update_payloads_to_fake_host_config() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(80));
    let (current_outer, current_inner, current_text) =
        attach_detached_nested_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "before",
        );
    let component_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let old_component_props = store
        .fiber_arena()
        .get(current_inner)
        .unwrap()
        .memoized_props();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_host_element_with_text("label", "after");
    let next_component = element_from_root(&source, next_element);
    let next_text = first_text_child(next_component);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let (work_outer, payload, diff) = update_host_parent_component_and_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_outer,
        current_inner,
        current_text,
        next_component,
        next_text,
        &mut detached_hosts,
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(payload.root(), root_id);
    assert_eq!(payload.current(), current_inner);
    assert_eq!(payload.state_node(), component_state_node);
    assert_eq!(payload.old_props(), old_component_props);
    assert_eq!(payload.new_props(), next_component.props());
    assert_eq!(payload.ty(), "label");
    assert_eq!(
        payload.property_row().kind(),
        TestHostComponentPropertyPayloadKind::SafeTestProperty
    );
    assert!(
        !payload
            .property_row()
            .public_dom_property_compatibility_claimed()
    );
    assert_eq!(diff.current(), current_text);
    assert_eq!(diff.state_node(), text_state_node);
    assert_eq!(diff.old_text(), "before");
    assert_eq!(diff.new_text(), "after");
    assert_eq!(apply.records().len(), 2);
    assert_eq!(
        apply.records()[0].mutation().parent(),
        payload.work_in_progress()
    );
    assert_eq!(
        apply.records()[0].mutation().fiber(),
        diff.work_in_progress()
    );
    assert_eq!(
        apply.records()[0].mutation().alternate_fiber(),
        Some(current_text)
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitTextUpdate)
    );
    assert_eq!(apply.records()[1].mutation().parent(), work_outer);
    assert_eq!(
        apply.records()[1].mutation().fiber(),
        payload.work_in_progress()
    );
    assert_eq!(
        apply.records()[1].mutation().alternate_fiber(),
        Some(current_inner)
    );
    assert_eq!(
        apply.records()[1].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(
        apply.records()[1].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    assert_eq!(apply.applied_host_call_count(), 2);
    assert_eq!(store.host_tokens().len(), token_count_before_apply + 1);
    assert_eq!(
        detached_hosts.instance(component_state_node).unwrap().ty(),
        "label"
    );
    assert_single_test_property_update(
        &detached_hosts,
        component_state_node,
        root_id,
        current_inner,
        old_component_props,
        next_component.props(),
    );
    assert_eq!(
        detached_hosts.text(text_state_node).unwrap().text(),
        "before"
    );
    let mut expected_operations = operations_before_apply;
    expected_operations.push("commit_text_update");
    expected_operations.push("commit_update");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_host_component_rejects_text_content_property_row_when_host_text_update_is_pending() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(81));
    let (current_outer, current_inner, current_text) =
        attach_detached_nested_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "before",
        );
    let component_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_host_element_with_text("label", "after");
    let next_component = element_from_root(&source, next_element);
    let next_text = first_text_child(next_component);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let (_work_outer, payload, diff) =
        update_host_parent_component_and_text_for_commit_with_payload(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_outer,
            current_inner,
            current_text,
            next_component,
            next_text,
            &mut detached_hosts,
        );
    detached_hosts.component_updates[0].property_row =
        TestHostComponentPropertyPayloadRow::text_content_reset(
            payload.old_props(),
            payload.new_props(),
        );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    let error = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert_eq!(diff.current(), current_text);
    assert_component_property_payload_error(
        error,
        root_id,
        payload.work_in_progress(),
        TEST_HOST_TEXT_CONTENT_PROP_NAME,
        TestHostComponentPropertyPayloadViolation::ConflictingTextUpdate,
    );
    assert_eq!(host.operations(), operations_before_apply);
    assert_eq!(store.host_tokens().len(), token_count_before_apply);
    assert!(
        detached_hosts
            .instance_property_updates(component_state_node)
            .unwrap()
            .is_empty()
    );
}
#[test]
fn host_work_leaves_root_text_update_apply_record_recorded_only() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(76));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(77), None).unwrap();
    let update_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let updated_text = update_root_text_for_commit_without_payload(
        &mut store,
        update_render.finished_work(),
        current_text,
        PropsHandle::from_raw(9002),
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().fiber(), updated_text);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::RecordedOnly
    );
    assert_eq!(apply.applied_host_call_count(), 0);
    assert_eq!(host.operations(), operations_before_apply);
}
