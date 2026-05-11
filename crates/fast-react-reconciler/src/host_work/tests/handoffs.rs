use super::helpers::*;
use super::*;

#[test]
fn host_work_multiple_sibling_handoff_rejects_non_multiple_or_existing_children() {
    let (mut single_store, single_root_id) = root_store();
    let mut single_host = RecordingHost::default();
    let mut single_source = TestHostTree::new();
    let only_child = single_source.insert_text("only");
    let single_render = render_test_root(
        &mut single_store,
        single_root_id,
        RootElementHandle::from_raw(7_710),
    );

    let single_error = mount_test_host_sibling_work(
        &mut single_store,
        &mut single_host,
        single_render,
        &single_source,
        &[only_child],
    )
    .unwrap_err();

    assert_eq!(
        single_error,
        HostWorkError::ExpectedMultipleRootChildren { count: 1 }
    );
    assert_eq!(single_host.operations(), Vec::<&'static str>::new());
    assert_eq!(
        single_store
            .fiber_arena()
            .get(single_render.work_in_progress())
            .unwrap()
            .child(),
        None
    );

    let (mut existing_store, existing_root_id) = root_store();
    let mut existing_host = RecordingHost::default();
    let mut existing_source = TestHostTree::new();
    let first = existing_source.insert_text("first");
    let second = existing_source.insert_text("second");
    let existing_render = render_test_root(
        &mut existing_store,
        existing_root_id,
        RootElementHandle::from_raw(7_720),
    );
    let existing_mode = existing_store
        .fiber_arena()
        .get(existing_render.work_in_progress())
        .unwrap()
        .mode();
    let existing_child = existing_store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(7_721),
        existing_mode,
    );
    existing_store
        .fiber_arena_mut()
        .set_children(existing_render.work_in_progress(), &[existing_child])
        .unwrap();

    let existing_error = mount_test_host_sibling_work(
        &mut existing_store,
        &mut existing_host,
        existing_render,
        &existing_source,
        &[first, second],
    )
    .unwrap_err();

    assert_eq!(
        existing_error,
        HostWorkError::UnexpectedExistingChild {
            parent: existing_render.work_in_progress(),
            child: existing_child,
        }
    );
    assert_eq!(existing_host.operations(), Vec::<&'static str>::new());
    assert_eq!(
        existing_store
            .fiber_arena()
            .get(existing_render.work_in_progress())
            .unwrap()
            .child(),
        Some(existing_child)
    );
}
#[test]
fn host_work_finished_work_handoff_applies_one_host_component_update_to_test_host_commit_path() {
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
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 7).unwrap();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(pending),
        8,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.finished_work(), update_render.finished_work());
    assert_eq!(diagnostic.source_handoff_order(), 7);
    assert_eq!(diagnostic.commit_order(), 8);
    assert_eq!(diagnostic.mutation().fiber(), payload.work_in_progress());
    assert_eq!(
        diagnostic.mutation().alternate_fiber(),
        Some(current_component)
    );
    assert_eq!(
        diagnostic.mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(
        diagnostic.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    assert!(diagnostic.test_host_commit_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_HOST_UPDATE_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(!diagnostic.public_renderer_package_behavior_exposed());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(diagnostic.payload().is_host_component_props_update());
    assert_eq!(diagnostic.payload().current(), current_component);
    assert_eq!(
        diagnostic.payload().host_component_property_payload_kind(),
        Some(TestHostComponentPropertyPayloadKind::SafeTestProperty)
    );
    assert_eq!(
        diagnostic.payload().host_component_prop_name(),
        Some(TEST_HOST_SAFE_PROPERTY_PROP_NAME)
    );
    assert_eq!(
        diagnostic.payload().host_component_property_name(),
        Some(TEST_HOST_SAFE_PROPERTY_NAME)
    );
    assert_eq!(
        diagnostic.payload().work_in_progress(),
        payload.work_in_progress()
    );
    assert_eq!(diagnostic.payload().state_node(), state_node);
    assert_eq!(
        diagnostic.payload(),
        &TestHostRootHostUpdatePayloadForCanary::HostComponent {
            current: current_component,
            work_in_progress: payload.work_in_progress(),
            state_node,
            old_props: initial_props,
            new_props: next.props(),
            ty: "section",
            property_payload_kind: TestHostComponentPropertyPayloadKind::SafeTestProperty,
            prop_name: TEST_HOST_SAFE_PROPERTY_PROP_NAME,
            property_name: TEST_HOST_SAFE_PROPERTY_NAME,
        }
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        update_render.finished_work()
    );
    assert_eq!(store.host_tokens().len(), token_count_before_apply + 1);
    let mut expected_operations = operations_before_apply;
    expected_operations.push("commit_update");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_root_commit_pipeline_replaces_one_host_text_and_updates_private_record() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_text("before");
    let create_render = render_test_root(&mut store, root_id, initial_element);
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
    let current_root_before_update = store.root(root_id).unwrap().current();
    assert_eq!(
        store
            .fiber_arena()
            .get(current_root_before_update)
            .unwrap()
            .child(),
        Some(current_text)
    );

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
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 17)
            .unwrap();
    let operations_before_apply = host.operations();

    let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(pending),
        18,
        &mut detached_hosts,
    )
    .unwrap();

    let final_root = store.root(root_id).unwrap().current();
    assert_eq!(final_root, update_render.finished_work());
    assert_eq!(
        store.fiber_arena().get(final_root).unwrap().child(),
        Some(diff.work_in_progress())
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(diff.work_in_progress())
            .unwrap()
            .alternate(),
        Some(current_text)
    );
    assert_eq!(
        store.fiber_arena().get(current_text).unwrap().alternate(),
        Some(diff.work_in_progress())
    );

    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.finished_work(), update_render.finished_work());
    assert_eq!(diagnostic.source_handoff_order(), 17);
    assert_eq!(diagnostic.commit_order(), 18);
    assert_eq!(diagnostic.mutation().fiber(), diff.work_in_progress());
    assert_eq!(diagnostic.mutation().alternate_fiber(), Some(current_text));
    assert_eq!(
        diagnostic.mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        diagnostic.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitTextUpdate)
    );
    assert!(diagnostic.test_host_commit_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert!(diagnostic.payload().is_host_text_content_update());
    assert_eq!(diagnostic.payload().current(), current_text);
    assert_eq!(
        diagnostic.payload().work_in_progress(),
        diff.work_in_progress()
    );
    assert_eq!(diagnostic.payload().state_node(), state_node);
    assert_eq!(diagnostic.payload().host_text_old_text(), Some("before"));
    assert_eq!(diagnostic.payload().host_text_new_text(), Some("after"));
    assert_eq!(
        diagnostic.payload(),
        &TestHostRootHostUpdatePayloadForCanary::HostText {
            current: current_text,
            work_in_progress: diff.work_in_progress(),
            state_node,
            old_text: "before".to_owned(),
            new_text: "after".to_owned(),
        }
    );
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_HOST_UPDATE_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(!diagnostic.public_renderer_package_behavior_exposed());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert_eq!(
        detached_hosts
            .test_host_text_record_text(state_node)
            .unwrap(),
        "after"
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        1
    );
    let text_updates = detached_hosts
        .test_host_text_record_updates(state_node)
        .unwrap();
    let text_metadata = detached_hosts.text_metadata(state_node).unwrap();
    assert_eq!(text_updates.len(), 1);
    assert_eq!(text_updates[0].sequence(), 0);
    assert_eq!(text_updates[0].handle(), state_node);
    assert_eq!(text_updates[0].root_id(), root_id);
    assert_eq!(text_updates[0].fiber_id(), current_text);
    assert_eq!(text_updates[0].token_id(), text_metadata.token_id());
    assert_eq!(text_updates[0].phase(), text_metadata.phase());
    assert_eq!(text_updates[0].target(), HostFiberTokenTarget::TextInstance);
    assert_eq!(text_updates[0].source_currentness().handle(), state_node);
    assert_eq!(text_updates[0].source_currentness().root_id(), root_id);
    assert_eq!(
        text_updates[0].source_currentness().fiber_id(),
        current_text
    );
    assert_eq!(
        text_updates[0].source_currentness().token_id(),
        text_metadata.token_id()
    );
    assert_eq!(
        text_updates[0].source_currentness().phase(),
        text_metadata.phase()
    );
    assert_eq!(
        text_updates[0].source_currentness().target(),
        HostFiberTokenTarget::TextInstance
    );
    assert!(
        !text_updates[0]
            .source_currentness()
            .public_dom_compatibility_claimed()
    );
    assert_eq!(text_updates[0].old_text(), "before");
    assert_eq!(text_updates[0].new_text(), "after");
    assert_eq!(detached_hosts.text(state_node).unwrap().text(), "before");

    let mut expected_operations = operations_before_apply;
    expected_operations.push("commit_text_update");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_finished_work_handoff_commits_one_style_update_to_private_host_store_only() {
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
    let row = TestHostComponentPropertyPayloadRow::style(payload.old_props(), payload.new_props());
    detached_hosts.component_updates[0].property_row = row;
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 17)
            .unwrap();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(pending),
        18,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.source_handoff_order(), 17);
    assert_eq!(diagnostic.commit_order(), 18);
    assert_eq!(diagnostic.mutation().fiber(), payload.work_in_progress());
    assert_eq!(
        diagnostic.status(),
        TestHostRootMutationApplyStatus::PrivateHostStoreOnly(
            TestHostRootPrivateStoreMutation::HostComponentPropertyAndLatestProps
        )
    );
    assert!(!diagnostic.test_host_commit_executed());
    assert!(diagnostic.private_host_store_only_commit_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 0);
    assert_eq!(diagnostic.private_host_store_update_count(), 1);
    assert_eq!(
        diagnostic.payload().host_component_property_payload_kind(),
        Some(TestHostComponentPropertyPayloadKind::Style)
    );
    assert_eq!(
        diagnostic.payload().host_component_prop_name(),
        Some(TEST_HOST_STYLE_PROP_NAME)
    );
    assert_eq!(
        diagnostic.payload(),
        &TestHostRootHostUpdatePayloadForCanary::HostComponent {
            current: current_component,
            work_in_progress: payload.work_in_progress(),
            state_node,
            old_props: initial_props,
            new_props: next.props(),
            ty: "section",
            property_payload_kind: TestHostComponentPropertyPayloadKind::Style,
            prop_name: TEST_HOST_STYLE_PROP_NAME,
            property_name: TEST_HOST_STYLE_PROP_NAME,
        }
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        update_render.finished_work()
    );
    assert_eq!(store.host_tokens().len(), token_count_before_apply);
    assert_single_component_property_update(
        &detached_hosts,
        state_node,
        root_id,
        current_component,
        payload.old_props(),
        payload.new_props(),
        row.kind(),
        row.prop_name(),
        row.property_name(),
        HostNodePropertyUpdateExecution::CommitUpdate,
    );
    assert_single_latest_props_update_after_property_update(
        &detached_hosts,
        state_node,
        root_id,
        current_component,
        payload.old_props(),
        payload.new_props(),
        row.kind(),
        row.prop_name(),
    );
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!row.public_dom_property_compatibility_claimed());
    assert_eq!(host.operations(), operations_before_apply);
}
#[test]
fn host_work_host_component_update_handoff_rejects_stale_finished_work_before_mutation() {
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
    update_root_component_for_commit(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    let stale_pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 9)
            .unwrap()
            .with_previous_current_for_canary(update_render.finished_work());
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();

    let error = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(stale_pending),
        10,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootHostUpdateExecutionErrorForCanary::FinishedWorkHandoff(error)
            if matches!(
                error.as_ref(),
                HostRootFinishedWorkCommitHandoffErrorForCanary::StaleFinishedWorkRecord {
                    root,
                    finished_work,
                    ..
                } if *root == root_id && *finished_work == update_render.finished_work()
            )
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(update_render.finished_work())
    );
    assert_eq!(host.operations(), operations_before_apply);
}
#[test]
fn host_work_host_component_update_handoff_rejects_unsupported_payload_before_mutation() {
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
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(86));
    let updated_component = update_root_component_for_commit_without_payload(
        &mut store,
        update_render.finished_work(),
        current_component,
        PropsHandle::from_raw(9_603),
    );
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 11)
            .unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();

    let error = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(pending),
        12,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootHostUpdateExecutionErrorForCanary::UnsupportedPayload {
            root,
            finished_work,
            fiber,
            kind,
        } if root == root_id
            && finished_work == update_render.finished_work()
            && fiber == updated_component
            && kind == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(update_render.finished_work())
    );
    assert_eq!(host.operations(), operations_before_apply);
}
#[test]
fn host_work_host_component_update_handoff_rejects_wrong_root_record_before_mutation() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let create_render = render_test_root(&mut store, first_root, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        first_root,
        create_render.finished_work(),
        initial,
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

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, first_root, next_element);
    update_root_component_for_commit(
        &mut store,
        first_root,
        update_render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    update_container(
        &mut store,
        second_root,
        RootElementHandle::from_raw(9_604),
        None,
    )
    .unwrap();
    let second_render =
        render_host_root_for_lanes(&mut store, second_root, Lanes::DEFAULT).unwrap();
    let wrong_root_pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, second_render, 13)
            .unwrap();
    let previous_current = store.root(first_root).unwrap().current();
    let operations_before_apply = host.operations();

    let error = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(wrong_root_pending),
        14,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootHostUpdateExecutionErrorForCanary::FinishedWorkHandoff(error)
            if matches!(
                error.as_ref(),
                HostRootFinishedWorkCommitHandoffErrorForCanary::ForeignFinishedWorkRecord {
                    expected_root,
                    actual_root,
                    ..
                } if *expected_root == first_root && *actual_root == second_root
            )
    ));
    assert_eq!(store.root(first_root).unwrap().current(), previous_current);
    assert_eq!(
        store
            .root(first_root)
            .unwrap()
            .scheduling()
            .work_in_progress(),
        Some(update_render.finished_work())
    );
    assert_eq!(host.operations(), operations_before_apply);
}
#[test]
fn host_work_records_dangerous_html_row_as_private_payload_execution_evidence() {
    let mut fixture = root_component_update_apply_fixture();
    let row = TestHostComponentPropertyPayloadRow::dangerous_html(
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
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply + 1
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
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("commit_update");
    assert_eq!(fixture.host.operations(), expected_operations);
}
#[test]
fn host_work_dangerous_html_complete_work_handoff_executes_canonical_private_row() {
    let mut fixture = dangerous_html_text_reset_handoff_fixture(
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml,
        61,
    );
    let finished_work = fixture.render.finished_work();

    let handoff = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        62,
        63,
    )
    .unwrap();

    assert_eq!(handoff.root(), fixture.root_id);
    assert_eq!(handoff.finished_work(), finished_work);
    assert_eq!(handoff.source_handoff_order(), 61);
    assert_eq!(handoff.commit_order(), 62);
    assert_eq!(handoff.request_order(), 63);
    assert_eq!(handoff.payload_kind_name(), "dangerous-html");
    assert!(handoff.complete_metadata_matches_mutation());
    assert!(handoff.private_test_host_mutation_allowed());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.public_renderer_mutation_blocked());
    assert!(!handoff.public_dom_compatibility_claimed());
    assert!(!handoff.test_renderer_compatibility_claimed());
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        finished_work
    );

    let diagnostic = apply_dangerous_html_text_reset_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(diagnostic.root(), fixture.root_id);
    assert_eq!(diagnostic.finished_work(), finished_work);
    assert_eq!(diagnostic.source_handoff_order(), 61);
    assert_eq!(diagnostic.commit_order(), 62);
    assert_eq!(diagnostic.mutation(), handoff.mutation());
    assert_eq!(
        diagnostic.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    assert!(diagnostic.test_host_commit_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.private_host_store_update_count(), 0);
    assert_eq!(
        diagnostic.payload().host_component_property_payload_kind(),
        Some(TestHostComponentPropertyPayloadKind::DangerousHtml)
    );
    assert_eq!(
        diagnostic.payload().host_component_prop_name(),
        Some(TEST_HOST_DANGEROUS_HTML_PROP_NAME)
    );
    assert_eq!(
        diagnostic.payload().host_component_property_name(),
        Some(TEST_HOST_DANGEROUS_HTML_PROPERTY_NAME)
    );
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(!diagnostic.public_renderer_package_behavior_exposed());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply + 1
    );
    assert_single_component_property_update(
        &fixture.detached_hosts,
        fixture.state_node,
        fixture.root_id,
        fixture.payload.current(),
        fixture.payload.old_props(),
        fixture.payload.new_props(),
        TestHostComponentPropertyPayloadKind::DangerousHtml,
        TEST_HOST_DANGEROUS_HTML_PROP_NAME,
        TEST_HOST_DANGEROUS_HTML_PROPERTY_NAME,
        HostNodePropertyUpdateExecution::CommitUpdate,
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("commit_update");
    assert_eq!(fixture.host.operations(), expected_operations);
}
#[test]
fn host_work_text_reset_complete_work_handoff_executes_without_public_dom_claim() {
    let mut fixture = dangerous_html_text_reset_handoff_fixture(
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::TextContentReset,
        71,
    );
    let finished_work = fixture.render.finished_work();

    let handoff = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        72,
        73,
    )
    .unwrap();
    let diagnostic = apply_dangerous_html_text_reset_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(handoff.root(), fixture.root_id);
    assert_eq!(handoff.finished_work(), finished_work);
    assert_eq!(handoff.payload_kind_name(), "text-content");
    assert_eq!(
        handoff.complete_work().expected_private_host_execution(),
        "reset-text-content"
    );
    assert!(handoff.complete_work().host_component_update_required());
    assert!(handoff.complete_work().private_reconciler_handoff_only());
    assert!(!handoff.complete_work().public_dom_compatibility_claimed());
    assert!(!handoff.complete_work().public_root_compatibility_claimed());
    assert!(handoff.complete_metadata_matches_mutation());
    assert_eq!(
        diagnostic.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::ResetTextContent)
    );
    assert!(diagnostic.test_host_commit_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.private_host_store_update_count(), 0);
    assert_eq!(
        diagnostic.payload().host_component_property_payload_kind(),
        Some(TestHostComponentPropertyPayloadKind::TextContent)
    );
    assert_eq!(
        diagnostic.payload().host_component_prop_name(),
        Some(TEST_HOST_TEXT_CONTENT_PROP_NAME)
    );
    assert_eq!(
        diagnostic.payload().host_component_property_name(),
        Some(TEST_HOST_TEXT_CONTENT_PROPERTY_NAME)
    );
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
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
fn host_work_dangerous_html_text_reset_handoff_rejects_stale_metadata_before_mutation() {
    let mut fixture = dangerous_html_text_reset_handoff_fixture(
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml,
        81,
    );
    let finished_work = fixture.render.finished_work();
    let stale_complete_work = fixture
        .complete_work
        .with_new_props_for_canary(PropsHandle::from_raw(98_881));

    let error = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        stale_complete_work,
        0,
        82,
        83,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        crate::root_commit::HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::MetadataPropsMismatch {
            root,
            fiber,
            expected_old_props,
            expected_new_props,
            actual_pending_props,
            actual_memoized_props,
            ..
        } if root == fixture.root_id
            && fiber == fixture.payload.work_in_progress()
            && expected_old_props == fixture.payload.old_props()
            && expected_new_props == PropsHandle::from_raw(98_881)
            && actual_pending_props == fixture.payload.new_props()
            && actual_memoized_props == fixture.payload.new_props()
    ));
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        fixture
            .store
            .root(fixture.root_id)
            .unwrap()
            .scheduling()
            .work_in_progress(),
        Some(finished_work)
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
fn host_work_managed_child_placement_handoff_executes_private_append_child() {
    let mut fixture = managed_child_placement_host_work_handoff_fixture(91);
    let finished_work = fixture.render.finished_work();

    let handoff = commit_managed_child_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        92,
        93,
    )
    .unwrap();
    let diagnostic = apply_managed_child_complete_work_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(handoff.root(), fixture.root_id);
    assert_eq!(handoff.finished_work(), finished_work);
    assert_eq!(
        handoff.execution_request().previous_current(),
        fixture.previous_current
    );
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        finished_work
    );
    assert_eq!(diagnostic.root(), fixture.root_id);
    assert_eq!(diagnostic.finished_work(), finished_work);
    assert_eq!(diagnostic.source_handoff_order(), 91);
    assert_eq!(diagnostic.commit_order(), 92);
    assert_eq!(diagnostic.request_order(), 93);
    assert_eq!(
        diagnostic.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(diagnostic.mutation(), handoff.mutation());
    assert_eq!(
        diagnostic.mutation_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
    );
    assert_eq!(diagnostic.cleanup_status(), None);
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 0);
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(diagnostic.public_renderer_mutation_blocked());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

    let mutation = diagnostic.mutation();
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.work_parent)
            .unwrap()
            .alternate(),
        Some(fixture.current_parent)
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("append_child");
    assert_eq!(fixture.host.operations(), expected_operations);
}
#[test]
fn host_work_managed_child_sibling_order_placement_handoff_executes_private_insert_before() {
    let mut fixture = managed_child_placement_sibling_order_host_work_handoff_fixture(111);
    let finished_work = fixture.render.finished_work();

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        112,
        113,
    )
    .unwrap();
    let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(handoff.root(), fixture.root_id);
    assert_eq!(handoff.finished_work(), finished_work);
    assert_eq!(
        handoff.execution_request().previous_current(),
        fixture.previous_current
    );
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        finished_work
    );
    assert_eq!(diagnostic.root(), fixture.root_id);
    assert_eq!(diagnostic.finished_work(), finished_work);
    assert_eq!(diagnostic.source_handoff_order(), 111);
    assert_eq!(diagnostic.commit_order(), 112);
    assert_eq!(diagnostic.request_order(), 113);
    assert_eq!(
        diagnostic.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(diagnostic.order_evidence_name(), "next-sibling");
    assert_eq!(diagnostic.order_sibling(), fixture.order_sibling);
    assert_eq!(
        diagnostic.order_sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(diagnostic.mutation(), handoff.mutation());
    assert_eq!(
        diagnostic.mutation_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::InsertBefore)
    );
    assert_eq!(diagnostic.cleanup_status(), None);
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 0);
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(diagnostic.public_renderer_mutation_blocked());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

    let mutation = diagnostic.mutation();
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    );
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    let sibling = mutation.placement_sibling().unwrap();
    assert_eq!(sibling.sibling(), Some(fixture.order_sibling));
    assert_eq!(
        sibling.sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert!(sibling.can_insert_before());
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.work_parent)
            .unwrap()
            .alternate(),
        Some(fixture.current_parent)
    );
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.order_sibling)
            .unwrap()
            .alternate(),
        Some(fixture.order_sibling_current)
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.order_sibling_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("insert_before");
    assert_eq!(fixture.host.operations(), expected_operations);
}
#[test]
fn host_work_managed_child_sibling_order_delete_handoff_executes_private_remove_and_cleanup() {
    let mut fixture = managed_child_delete_sibling_order_host_work_handoff_fixture(121);
    let finished_work = fixture.render.finished_work();
    let order_sibling_host_child = FakeHostChild::Instance(
        fixture
            .detached_hosts
            .instance(fixture.order_sibling_state_node)
            .unwrap()
            .id(),
    );
    let deleted_host_child = FakeHostChild::Instance(
        fixture
            .detached_hosts
            .instance(fixture.child_state_node)
            .unwrap()
            .id(),
    );
    assert_eq!(
        fixture
            .detached_hosts
            .instance(fixture.parent_state_node)
            .unwrap()
            .children(),
        &[order_sibling_host_child, deleted_host_child]
    );

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        122,
        123,
    )
    .unwrap();
    let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(handoff.root(), fixture.root_id);
    assert_eq!(handoff.finished_work(), finished_work);
    assert_eq!(
        handoff.execution_request().previous_current(),
        fixture.previous_current
    );
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        finished_work
    );
    assert_eq!(diagnostic.root(), fixture.root_id);
    assert_eq!(diagnostic.finished_work(), finished_work);
    assert_eq!(diagnostic.source_handoff_order(), 121);
    assert_eq!(diagnostic.commit_order(), 122);
    assert_eq!(diagnostic.request_order(), 123);
    assert_eq!(
        diagnostic.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(diagnostic.order_evidence_name(), "previous-sibling");
    assert_eq!(diagnostic.order_sibling(), fixture.order_sibling);
    assert_eq!(
        diagnostic.order_sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(diagnostic.mutation(), handoff.mutation());
    assert_eq!(
        diagnostic.mutation_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert_eq!(
        diagnostic.cleanup_status(),
        Some(TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::DetachDeletedInstance
        ))
    );
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(diagnostic.public_renderer_mutation_blocked());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

    let mutation = diagnostic.mutation();
    assert_eq!(
        mutation.source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.deletion_list.unwrap())
    );
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(mutation.placement_sibling(), None);
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.work_parent)
            .unwrap()
            .alternate(),
        Some(fixture.current_parent)
    );
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.order_sibling)
            .unwrap()
            .alternate(),
        Some(fixture.order_sibling_current)
    );
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.work_parent)
            .unwrap()
            .child(),
        Some(fixture.order_sibling)
    );
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.order_sibling)
            .unwrap()
            .sibling(),
        None
    );
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.order_sibling_current)
            .unwrap()
            .sibling(),
        Some(fixture.child)
    );
    assert!(
        !fixture
            .detached_hosts
            .instance_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.order_sibling_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.parent_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply + 1
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("remove_child");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(fixture.host.operations(), expected_operations);
}
#[test]
fn host_work_managed_child_sibling_order_delete_rejects_stale_previous_sibling_before_remove() {
    let mut fixture = managed_child_delete_sibling_order_host_work_handoff_fixture(131);

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        132,
        133,
    )
    .unwrap();
    let order_sibling_scope = fixture
        .detached_hosts
        .scope(
            fixture.order_sibling_state_node,
            HostFiberTokenTarget::Instance,
        )
        .unwrap();
    fixture
        .detached_hosts
        .nodes
        .invalidate_instance(fixture.order_sibling_state_node, order_sibling_scope)
        .unwrap();

    let error = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootManagedChildExecutionErrorForCanary::HostWork(
            HostWorkError::HostNode(ref error)
        ) if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply + 1
    );
}
#[test]
fn host_work_managed_child_delete_handoff_executes_private_remove_and_cleanup() {
    let mut fixture = managed_child_delete_host_work_handoff_fixture(101);
    let finished_work = fixture.render.finished_work();

    let handoff = commit_managed_child_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        102,
        103,
    )
    .unwrap();
    let diagnostic = apply_managed_child_complete_work_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(handoff.root(), fixture.root_id);
    assert_eq!(handoff.finished_work(), finished_work);
    assert_eq!(
        handoff.execution_request().previous_current(),
        fixture.previous_current
    );
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        finished_work
    );
    assert_eq!(diagnostic.root(), fixture.root_id);
    assert_eq!(diagnostic.finished_work(), finished_work);
    assert_eq!(diagnostic.source_handoff_order(), 101);
    assert_eq!(diagnostic.commit_order(), 102);
    assert_eq!(diagnostic.request_order(), 103);
    assert_eq!(
        diagnostic.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(diagnostic.mutation(), handoff.mutation());
    assert_eq!(
        diagnostic.mutation_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert_eq!(
        diagnostic.cleanup_status(),
        Some(TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::DetachDeletedInstance
        ))
    );
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(diagnostic.public_renderer_mutation_blocked());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

    let mutation = diagnostic.mutation();
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.work_parent)
            .unwrap()
            .alternate(),
        Some(fixture.current_parent)
    );
    assert!(
        !fixture
            .detached_hosts
            .instance_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.parent_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply + 1
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("remove_child");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(fixture.host.operations(), expected_operations);
}
#[test]
fn host_text_update_commit_execution_mutates_test_host_record_after_payload_and_handoff_validation()
{
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_900));
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
    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_901));
    let (_work_parent, diff) = update_host_parent_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_parent,
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 21)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        22,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 23).unwrap();
    let operations_before_execute = host.operations();

    let execution =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap();

    assert_eq!(execution.root(), root_id);
    assert_eq!(execution.finished_work(), update_render.finished_work());
    assert_eq!(execution.current(), current_text);
    assert_eq!(execution.work_in_progress(), diff.work_in_progress());
    assert_eq!(execution.state_node(), state_node);
    assert_eq!(execution.old_text(), "before");
    assert_eq!(execution.new_text(), "after");
    assert_eq!(execution.update_count(), 1);
    assert!(execution.payload_accepted());
    assert!(execution.commit_handoff_validated());
    assert!(!execution.public_renderer_compatibility_claimed());
    assert_eq!(
        execution.mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_text(state_node)
            .unwrap(),
        "after"
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        1
    );
    let text_updates = detached_hosts
        .test_host_text_record_updates(state_node)
        .unwrap();
    let text_metadata = detached_hosts.text_metadata(state_node).unwrap();
    assert_eq!(text_updates.len(), 1);
    assert_eq!(text_updates[0].source_currentness().handle(), state_node);
    assert_eq!(text_updates[0].source_currentness().root_id(), root_id);
    assert_eq!(
        text_updates[0].source_currentness().fiber_id(),
        current_text
    );
    assert_eq!(
        text_updates[0].source_currentness().token_id(),
        text_metadata.token_id()
    );
    assert_eq!(
        text_updates[0].source_currentness().phase(),
        text_metadata.phase()
    );
    assert_eq!(
        text_updates[0].source_currentness().target(),
        HostFiberTokenTarget::TextInstance
    );
    assert_eq!(detached_hosts.text(state_node).unwrap().text(), "before");
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_renderer_compatibility_claimed());

    let mut expected_operations = operations_before_execute;
    expected_operations.push("commit_text_update");
    assert_eq!(host.operations(), expected_operations);

    let operations_after_first_execute = host.operations();
    let replay_error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();
    assert!(matches!(
        replay_error,
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
    assert_eq!(host.operations(), operations_after_first_execute);
}
