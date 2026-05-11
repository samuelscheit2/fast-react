use super::*;

#[test]
fn root_work_loop_host_update_executes_host_text_commit_after_prior_mount() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_text("before root text");
    update_container(&mut store, root_id, initial_element, None).unwrap();
    let initial_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut initial_host_work =
        mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
    let initial_handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        initial_render,
        863_001,
        863_002,
    )
    .unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        initial_handoff.commit(),
        &mut initial_host_work,
    )
    .unwrap();

    let current_text = initial_host_work.root_child().unwrap();
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_text("after root text");
    update_container(&mut store, root_id, next_element, None).unwrap();
    let update_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut update_host_work = update_test_host_root_work_with_detached_hosts_for_canary(
        &mut store,
        update_render,
        &source,
        detached_hosts,
    )
    .unwrap();
    let updated_text = update_host_work.root_child().unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 863_003)
            .unwrap();
    let operations_before_execute = host.operations();

    let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(pending),
        863_004,
        update_host_work.detached_hosts_mut_for_canary(),
    )
    .unwrap();

    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.finished_work(), update_render.finished_work());
    assert_eq!(diagnostic.source_handoff_order(), 863_003);
    assert_eq!(diagnostic.commit_order(), 863_004);
    assert_eq!(diagnostic.mutation().fiber(), updated_text);
    assert_eq!(diagnostic.mutation().alternate_fiber(), Some(current_text));
    assert_eq!(
        diagnostic.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitTextUpdate)
    );
    assert!(diagnostic.test_host_commit_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.private_host_store_update_count(), 0);
    assert!(diagnostic.payload().is_host_text_content_update());
    assert_eq!(diagnostic.payload().current(), current_text);
    assert_eq!(diagnostic.payload().work_in_progress(), updated_text);
    assert_eq!(diagnostic.payload().state_node(), state_node);
    assert_eq!(
        diagnostic.payload().host_text_old_text(),
        Some("before root text")
    );
    assert_eq!(
        diagnostic.payload().host_text_new_text(),
        Some("after root text")
    );
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert_eq!(
        update_host_work
            .test_host_text_record_text_for_canary(state_node)
            .unwrap(),
        "after root text"
    );
    assert_eq!(
        update_host_work
            .test_host_text_record_update_count_for_canary(state_node)
            .unwrap(),
        1
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        update_render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    let mut expected_operations = operations_before_execute;
    expected_operations.push("commit_text_update");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn root_work_loop_host_update_executes_host_component_commit_update_after_prior_mount() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "before component text");
    update_container(&mut store, root_id, initial_element, None).unwrap();
    let initial_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut initial_host_work =
        mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
    let initial_handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        initial_render,
        863_101,
        863_102,
    )
    .unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        initial_handoff.commit(),
        &mut initial_host_work,
    )
    .unwrap();

    let current_component = initial_host_work.root_child().unwrap();
    let state_node = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .state_node();
    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_host_element_with_text("section", "after component text");
    update_container(&mut store, root_id, next_element, None).unwrap();
    let update_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut update_host_work = update_test_host_root_work_with_detached_hosts_for_canary(
        &mut store,
        update_render,
        &source,
        detached_hosts,
    )
    .unwrap();
    let updated_component = update_host_work.root_child().unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 863_103)
            .unwrap();
    let operations_before_execute = host.operations();
    let token_count_before_execute = store.host_tokens().len();

    let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(pending),
        863_104,
        update_host_work.detached_hosts_mut_for_canary(),
    )
    .unwrap();

    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.finished_work(), update_render.finished_work());
    assert_eq!(diagnostic.mutation().fiber(), updated_component);
    assert_eq!(
        diagnostic.mutation().alternate_fiber(),
        Some(current_component)
    );
    assert_eq!(
        diagnostic.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    assert!(diagnostic.test_host_commit_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.private_host_store_update_count(), 0);
    assert!(diagnostic.payload().is_host_component_props_update());
    assert_eq!(diagnostic.payload().current(), current_component);
    assert_eq!(diagnostic.payload().work_in_progress(), updated_component);
    assert_eq!(diagnostic.payload().state_node(), state_node);
    assert_eq!(
        diagnostic.payload().host_component_property_payload_kind(),
        Some(TestHostComponentPropertyPayloadKind::SafeTestProperty)
    );
    assert!(!diagnostic.public_dom_property_compatibility_claimed());
    assert_eq!(store.host_tokens().len(), token_count_before_execute + 1);
    assert_eq!(
        update_host_work
            .instance_property_update_count_for_canary(state_node)
            .unwrap(),
        1
    );
    assert_eq!(
        update_host_work
            .instance_latest_props_for_canary(state_node)
            .unwrap(),
        None
    );
    let mut expected_operations = operations_before_execute;
    expected_operations.push("commit_update");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn root_work_loop_host_update_commits_style_payload_to_private_store_after_prior_mount() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "style before");
    update_container(&mut store, root_id, initial_element, None).unwrap();
    let initial_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut initial_host_work =
        mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
    let initial_handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        initial_render,
        863_201,
        863_202,
    )
    .unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        initial_handoff.commit(),
        &mut initial_host_work,
    )
    .unwrap();

    let current_component = initial_host_work.root_child().unwrap();
    let state_node = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .state_node();
    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_host_element_with_text("section", "style after");
    let next_props = match source.root(next_element).unwrap() {
        TestHostNode::Element(element) => element.props(),
        TestHostNode::Text(_) => unreachable!("component test source must be an element"),
    };
    update_container(&mut store, root_id, next_element, None).unwrap();
    let update_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut update_host_work = update_test_host_root_work_with_detached_hosts_for_canary(
        &mut store,
        update_render,
        &source,
        detached_hosts,
    )
    .unwrap();
    update_host_work
        .mark_completed_host_component_update_payload_as_style_for_canary()
        .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 863_203)
            .unwrap();
    let operations_before_execute = host.operations();
    let token_count_before_execute = store.host_tokens().len();

    let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(pending),
        863_204,
        update_host_work.detached_hosts_mut_for_canary(),
    )
    .unwrap();

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
    assert!(!diagnostic.public_dom_property_compatibility_claimed());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert_eq!(store.host_tokens().len(), token_count_before_execute);
    assert_eq!(
        update_host_work
            .instance_property_update_count_for_canary(state_node)
            .unwrap(),
        1
    );
    assert_eq!(
        update_host_work
            .instance_latest_props_for_canary(state_node)
            .unwrap(),
        Some(next_props)
    );
    assert_eq!(
        update_host_work
            .instance_latest_props_update_count_for_canary(state_node)
            .unwrap(),
        1
    );
    assert_eq!(host.operations(), operations_before_execute);
}

#[test]
fn root_work_loop_host_update_rejects_text_content_conflict_before_host_call() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "before conflict");
    update_container(&mut store, root_id, initial_element, None).unwrap();
    let initial_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut initial_host_work =
        mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
    let initial_handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        initial_render,
        863_301,
        863_302,
    )
    .unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        initial_handoff.commit(),
        &mut initial_host_work,
    )
    .unwrap();

    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_host_element_with_text("section", "after conflict");
    update_container(&mut store, root_id, next_element, None).unwrap();
    let update_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut update_host_work =
        update_test_host_root_component_with_text_child_work_with_detached_hosts_for_canary(
            &mut store,
            update_render,
            &source,
            detached_hosts,
        )
        .unwrap();
    let updated_component = update_host_work.root_child().unwrap();
    update_host_work
        .mark_completed_host_component_update_payload_as_text_content_reset_for_canary()
        .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 863_303)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        863_304,
    )
    .unwrap();
    let operations_before_apply = host.operations();

    let error = apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        handoff.commit(),
        &mut update_host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::InvalidHostComponentPropertyUpdatePayload {
            root,
            fiber,
            violation,
            ..
        } if root == root_id
            && fiber == updated_component
            && violation
                == crate::host_work::TestHostComponentPropertyPayloadViolation::ConflictingTextUpdate
    ));
    assert_eq!(host.operations(), operations_before_apply);
}

#[test]
fn root_work_loop_host_update_rejects_cross_root_finished_work_record_before_host_call() {
    let (mut store, root_id, mut host) = root_store();
    let second_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "cross before");
    update_container(&mut store, root_id, initial_element, None).unwrap();
    let initial_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut initial_host_work =
        mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
    let initial_handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        initial_render,
        863_401,
        863_402,
    )
    .unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        initial_handoff.commit(),
        &mut initial_host_work,
    )
    .unwrap();

    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_host_element_with_text("section", "cross after");
    update_container(&mut store, root_id, next_element, None).unwrap();
    let update_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut update_host_work = update_test_host_root_work_with_detached_hosts_for_canary(
        &mut store,
        update_render,
        &source,
        detached_hosts,
    )
    .unwrap();
    update_container(
        &mut store,
        second_root,
        RootElementHandle::from_raw(863_405),
        None,
    )
    .unwrap();
    let second_render =
        render_host_root_for_lanes(&mut store, second_root, Lanes::DEFAULT).unwrap();
    let wrong_pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, second_render, 863_403)
            .unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_execute = host.operations();

    let error = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(wrong_pending),
        863_404,
        update_host_work.detached_hosts_mut_for_canary(),
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
                } if *expected_root == root_id && *actual_root == second_root
            )
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(host.operations(), operations_before_execute);
}

#[test]
fn root_work_loop_multichild_host_text_update_executes_with_stable_root_siblings() {
    let (mut store, root_id, mut host) = root_store();
    let mut mounted = mount_three_text_root_output_for_multichild_host_mutation(
        &mut store, &mut host, root_id, 878_100,
    );
    let fixture = prepare_root_work_loop_multichild_text_update_fixture(
        &mut store,
        root_id,
        &mut mounted,
        878_110,
    );
    let pending = fixture.pending;
    let render = fixture.render;
    let previous_current = fixture.previous_current;
    let stable_before_work = fixture.stable_before_work;
    let updated_work = fixture.updated_work;
    let stable_after_work = fixture.stable_after_work;
    let stable_before_state_node = fixture.stable_before_state_node;
    let updated_state_node = fixture.updated_state_node;
    let stable_after_state_node = fixture.stable_after_state_node;
    let mounted_root = mounted.complete_work.complete_work().root();
    let mounted_root_element = mounted.root_element;

    let execution = execute_root_work_loop_multichild_text_update(
        &mut store,
        &mut host,
        root_id,
        mounted_root,
        mounted_root_element,
        &mut mounted.host_work,
        fixture,
        pending,
        ROOT_WORK_LOOP_MULTICHILD_UPDATE_COMMIT_ORDER,
    )
    .unwrap();

    assert_eq!(mounted_root, root_id);
    assert_eq!(render.current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store
            .fiber_arena()
            .child_ids(render.finished_work())
            .unwrap(),
        vec![stable_before_work, updated_work, stable_after_work]
    );
    assert_eq!(
        execution
            .finished_work_handoff
            .pending()
            .root_finished_work(),
        Some(render.finished_work())
    );
    assert!(
        execution
            .finished_work_handoff
            .consumed_finished_work_record()
    );
    assert_root_work_loop_multichild_finished_work_blockers(&execution.finished_work_handoff);
    assert_eq!(
        execution.finished_work_handoff.commit_order(),
        ROOT_WORK_LOOP_MULTICHILD_UPDATE_COMMIT_ORDER
    );
    assert_eq!(
        execution.finished_work_handoff.commit().previous_current(),
        previous_current
    );
    assert_eq!(
        execution.finished_work_handoff.commit().finished_lanes(),
        Lanes::DEFAULT
    );

    assert_eq!(execution.mutation_apply.records().len(), 1);
    let apply_record = execution.mutation_apply.records()[0];
    assert_eq!(apply_record.mutation().fiber(), updated_work);
    assert_eq!(
        apply_record.mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        apply_record.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitTextUpdate)
    );
    assert_eq!(execution.mutation_apply.applied_host_call_count(), 1);
    assert_eq!(
        mounted
            .host_work
            .test_host_text_record_text_for_canary(updated_state_node)
            .unwrap(),
        "target after 878110"
    );
    assert_eq!(
        mounted
            .host_work
            .test_host_text_record_update_count_for_canary(updated_state_node)
            .unwrap(),
        1
    );
    assert_eq!(
        mounted
            .host_work
            .test_host_text_record_update_count_for_canary(stable_before_state_node)
            .unwrap(),
        0
    );
    assert_eq!(
        mounted
            .host_work
            .test_host_text_record_update_count_for_canary(stable_after_state_node)
            .unwrap(),
        0
    );
    assert!(
        mounted
            .host_work
            .detached_hosts_mut_for_canary()
            .text_metadata(stable_before_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        mounted
            .host_work
            .detached_hosts_mut_for_canary()
            .text_metadata(stable_after_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(store.host_tokens().len(), mounted.token_count_after_mount);

    let mut expected_operations = mounted.operations_after_mount.clone();
    expected_operations.push("commit_text_update");
    assert_eq!(
        execution.operations_before_apply,
        mounted.operations_after_mount
    );
    assert_eq!(host.operations(), expected_operations);

    let operations_after_first_apply = host.operations();
    let replay_error = apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        execution.finished_work_handoff.commit(),
        &mut mounted.host_work,
    )
    .unwrap_err();
    assert!(matches!(
        replay_error,
        HostWorkError::ConsumedHostUpdatePayload {
            root,
            fiber,
            state_node,
            kind,
        } if root == root_id
            && fiber == updated_work
            && state_node == updated_state_node
            && kind == HostRootMutationApplyRecordKind::CommitHostTextUpdate
    ));
    assert_eq!(host.operations(), operations_after_first_apply);
}

#[test]
fn root_work_loop_multichild_host_text_delete_executes_with_stable_siblings() {
    let (mut store, root_id, mut host) = root_store();
    let mut mounted = mount_three_text_root_output_for_multichild_host_mutation(
        &mut store, &mut host, root_id, 878_200,
    );
    let fixture = prepare_root_work_loop_multichild_text_delete_fixture(
        &mut store,
        root_id,
        &mut mounted,
        878_210,
    );
    let pending = fixture.pending;
    let render = fixture.render;
    let previous_current = fixture.previous_current;
    let stable_before_work = fixture.stable_before_work;
    let stable_after_work = fixture.stable_after_work;
    let deleted_current = fixture.deleted_current;
    let deleted_state_node = fixture.deleted_state_node;
    let stable_before_state_node = fixture.stable_before_state_node;
    let stable_after_state_node = fixture.stable_after_state_node;
    let mounted_root = mounted.complete_work.complete_work().root();
    let mounted_root_element = mounted.root_element;

    let execution = execute_root_work_loop_multichild_text_delete(
        &mut store,
        &mut host,
        root_id,
        mounted_root,
        mounted_root_element,
        &mut mounted.host_work,
        fixture,
        pending,
        ROOT_WORK_LOOP_MULTICHILD_DELETE_COMMIT_ORDER,
    )
    .unwrap();

    assert_eq!(render.current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(
        store
            .fiber_arena()
            .child_ids(render.finished_work())
            .unwrap(),
        vec![stable_before_work, stable_after_work]
    );
    assert_eq!(
        execution.finished_work_handoff.commit_order(),
        ROOT_WORK_LOOP_MULTICHILD_DELETE_COMMIT_ORDER
    );
    assert!(
        execution
            .finished_work_handoff
            .consumed_finished_work_record()
    );
    assert_root_work_loop_multichild_finished_work_blockers(&execution.finished_work_handoff);
    assert_eq!(
        execution
            .finished_work_handoff
            .commit()
            .deletion_lists()
            .len(),
        1
    );
    assert_eq!(
        execution.finished_work_handoff.commit().deletion_lists()[0].deleted(),
        &[deleted_current]
    );
    assert_eq!(execution.mutation_apply.records().len(), 1);
    let apply_record = execution.mutation_apply.records()[0];
    assert_eq!(apply_record.mutation().fiber(), deleted_current);
    assert_eq!(
        apply_record.mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    assert_eq!(
        apply_record.status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::RemoveChildFromContainer
        )
    );
    assert_eq!(execution.mutation_apply.applied_host_call_count(), 1);
    assert_eq!(execution.deletion_cleanup.records().len(), 1);
    assert_eq!(execution.deletion_cleanup.invalidated_text_count(), 1);
    assert_eq!(
        execution.deletion_cleanup.records()[0].status(),
        TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::InvalidateDeletedText
        )
    );
    assert!(
        !mounted
            .host_work
            .detached_hosts_mut_for_canary()
            .text_metadata(deleted_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        mounted
            .host_work
            .detached_hosts_mut_for_canary()
            .text_metadata(stable_before_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        mounted
            .host_work
            .detached_hosts_mut_for_canary()
            .text_metadata(stable_after_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        store.host_tokens().len(),
        mounted.token_count_after_mount + execution.deletion_cleanup.records().len()
    );

    let mut expected_operations = mounted.operations_after_mount.clone();
    expected_operations.push("remove_child_from_container");
    assert_eq!(
        execution.operations_before_apply,
        mounted.operations_after_mount
    );
    assert_eq!(host.operations(), expected_operations);

    let operations_after_delete = host.operations();
    let replay_error = preflight_test_host_root_deletion_apply_and_cleanup_for_canary(
        &store,
        execution.finished_work_handoff.commit(),
        &mounted.host_work,
    )
    .unwrap_err();
    assert!(matches!(
        replay_error,
        HostWorkError::HostNode(error) if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(host.operations(), operations_after_delete);
}

#[test]
fn root_work_loop_multichild_host_text_update_rejects_stale_finished_work_before_host_call() {
    let (mut store, root_id, mut host) = root_store();
    let mut mounted = mount_three_text_root_output_for_multichild_host_mutation(
        &mut store, &mut host, root_id, 878_300,
    );
    let fixture = prepare_root_work_loop_multichild_text_update_fixture(
        &mut store,
        root_id,
        &mut mounted,
        878_310,
    );
    let render = fixture.render;
    let stale_pending = fixture
        .pending
        .with_previous_current_for_canary(render.finished_work());
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_execute = host.operations();
    let mounted_root = mounted.complete_work.complete_work().root();
    let mounted_root_element = mounted.root_element;

    let error = execute_root_work_loop_multichild_text_update(
        &mut store,
        &mut host,
        root_id,
        mounted_root,
        mounted_root_element,
        &mut mounted.host_work,
        fixture,
        stale_pending,
        ROOT_WORK_LOOP_MULTICHILD_UPDATE_COMMIT_ORDER + 300,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        RootWorkLoopMultiChildHostMutationExecutionError::FinishedWorkCommitHandoff(error)
            if matches!(
                error.as_ref(),
                HostRootFinishedWorkCommitHandoffErrorForCanary::StaleFinishedWorkRecord {
                    root,
                    finished_work,
                    ..
                } if *root == root_id && *finished_work == render.finished_work()
            )
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(host.operations(), operations_before_execute);
}

#[test]
fn root_work_loop_multichild_host_text_delete_rejects_stale_finished_work_before_host_call() {
    let (mut store, root_id, mut host) = root_store();
    let mut mounted = mount_three_text_root_output_for_multichild_host_mutation(
        &mut store, &mut host, root_id, 878_400,
    );
    let fixture = prepare_root_work_loop_multichild_text_delete_fixture(
        &mut store,
        root_id,
        &mut mounted,
        878_410,
    );
    let render = fixture.render;
    let stale_pending = fixture
        .pending
        .with_previous_current_for_canary(render.finished_work());
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_execute = host.operations();
    let mounted_root = mounted.complete_work.complete_work().root();
    let mounted_root_element = mounted.root_element;

    let error = execute_root_work_loop_multichild_text_delete(
        &mut store,
        &mut host,
        root_id,
        mounted_root,
        mounted_root_element,
        &mut mounted.host_work,
        fixture,
        stale_pending,
        ROOT_WORK_LOOP_MULTICHILD_DELETE_COMMIT_ORDER + 400,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        RootWorkLoopMultiChildHostMutationExecutionError::FinishedWorkCommitHandoff(error)
            if matches!(
                error.as_ref(),
                HostRootFinishedWorkCommitHandoffErrorForCanary::StaleFinishedWorkRecord {
                    root,
                    finished_work,
                    ..
                } if *root == root_id && *finished_work == render.finished_work()
            )
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(host.operations(), operations_before_execute);
}

#[test]
fn root_work_loop_multichild_host_update_rejects_wrong_sibling_topology_before_host_call() {
    let (mut store, root_id, mut host) = root_store();
    let mut mounted = mount_three_text_root_output_for_multichild_host_mutation(
        &mut store, &mut host, root_id, 878_500,
    );
    let fixture = prepare_root_work_loop_multichild_text_update_fixture(
        &mut store,
        root_id,
        &mut mounted,
        878_510,
    );
    let pending = fixture.pending;
    store
        .fiber_arena_mut()
        .set_children(
            fixture.render.finished_work(),
            &[
                fixture.updated_work,
                fixture.stable_before_work,
                fixture.stable_after_work,
            ],
        )
        .unwrap();
    let operations_before_execute = host.operations();
    let mounted_root = mounted.complete_work.complete_work().root();
    let mounted_root_element = mounted.root_element;

    let error = execute_root_work_loop_multichild_text_update(
        &mut store,
        &mut host,
        root_id,
        mounted_root,
        mounted_root_element,
        &mut mounted.host_work,
        fixture,
        pending,
        ROOT_WORK_LOOP_MULTICHILD_UPDATE_COMMIT_ORDER + 500,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        RootWorkLoopMultiChildHostMutationExecutionError::FinishedChildListMismatch {
            root,
            ..
        } if root == root_id
    ));
    assert_eq!(host.operations(), operations_before_execute);
}

#[test]
fn root_work_loop_multichild_host_update_rejects_cross_root_mount_evidence_before_host_call() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let mut host = RecordingHost::default();
    let mut mounted = mount_three_text_root_output_for_multichild_host_mutation(
        &mut store, &mut host, first_root, 878_600,
    );
    let fixture = prepare_root_work_loop_multichild_text_update_fixture(
        &mut store,
        first_root,
        &mut mounted,
        878_610,
    );
    let pending = fixture.pending;
    let operations_before_execute = host.operations();
    let mounted_root = mounted.complete_work.complete_work().root();
    let mounted_root_element = mounted.root_element;

    let error = execute_root_work_loop_multichild_text_update(
        &mut store,
        &mut host,
        second_root,
        mounted_root,
        mounted_root_element,
        &mut mounted.host_work,
        fixture,
        pending,
        ROOT_WORK_LOOP_MULTICHILD_UPDATE_COMMIT_ORDER + 600,
    )
    .unwrap_err();

    assert_eq!(
        error,
        RootWorkLoopMultiChildHostMutationExecutionError::MountRootMismatch {
            expected: second_root,
            actual: first_root,
        }
    );
    assert_eq!(host.operations(), operations_before_execute);
}

#[test]
fn root_work_loop_use_reducer_single_host_update_rejects_stale_hook_render_evidence() {
    let mut source = TestHostTree::new();
    let child_element = source.insert_text("stale reducer text update");
    let (mut store, root_id, mut host) = root_store();
    let root_current = store.root(root_id).unwrap().current();
    let (function_current, function_work_in_progress, component) =
        attach_function_component_current_child_with_work_pair(&mut store, root_id);
    let previous_props = PropsHandle::from_raw(9_201);
    let current_child = attach_current_single_host_child(
        &mut store,
        function_current,
        FiberTag::HostText,
        previous_props,
        ElementTypeHandle::NONE,
        StateNodeHandle::NONE,
    );
    let mut detached_hosts = DetachedHostRecords::new_for_canary();
    create_detached_test_host_text_for_existing_fiber_for_canary(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        current_child,
        "previous stale reducer text update",
        previous_props,
    )
    .unwrap();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = reducer(1_201);
    let current_reducer = hook_store
        .create_current_reducer_hook(function_current, reducer_id, StateHandle::from_raw(2_100))
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver = TestHostTreeFunctionOutputResolver::new(&source);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let rescheduled = hook_store
        .dispatch_reducer_update_and_reschedule_root(
            &mut store,
            FunctionComponentReducerDispatchRequest::new(
                current_reducer.dispatch(),
                action(13),
                lane,
            ),
        )
        .unwrap();
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let callback = processed.records()[0].scheduled_callback().unwrap();
    let render = render_host_root_via_scheduler_callback(
        &mut store,
        root_id,
        callback.node(),
        Lanes::DEFAULT,
    )
    .unwrap()
    .render_phase()
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[function_work_in_progress])
        .unwrap();
    let operations_before = host.operations();

    let error = handoff_completed_function_component_use_reducer_single_host_update_to_commit(
        &mut store,
        &mut host,
        render,
        &source,
        detached_hosts,
        rescheduled,
        &mut hook_store,
        FunctionComponentUseReducerRenderRequest::new(
            reducer_id,
            StateHandle::from_raw(999),
            FunctionComponentStateUpdateRenderLanes::new(Lanes::SYNC, Lanes::SYNC),
        ),
        &mut registry,
        &resolver,
        |_, _| panic!("stale hook render evidence should skip the reducer update"),
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError::HookEvidence(
            FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary::StaleHookQueueRenderEvidence {
                root,
                queue,
                render_lanes,
                dispatch_lanes,
                ..
            }
        ) if root == root_id
            && queue == current_reducer.queue()
            && render_lanes == Lanes::DEFAULT
            && dispatch_lanes == Lanes::DEFAULT
    ));
    assert_eq!(store.root(root_id).unwrap().current(), root_current);
    assert_eq!(host.operations(), operations_before);
}

#[test]
fn root_work_loop_use_reducer_single_host_update_rejects_missing_detached_host_payload() {
    let mut source = TestHostTree::new();
    let child_element = source.insert_text("missing payload reducer text update");
    let (mut store, root_id, mut host) = root_store();
    let root_current = store.root(root_id).unwrap().current();
    let (function_current, function_work_in_progress, component) =
        attach_function_component_current_child_with_work_pair(&mut store, root_id);
    let previous_props = PropsHandle::from_raw(9_301);
    let current_child = attach_current_single_host_child(
        &mut store,
        function_current,
        FiberTag::HostText,
        previous_props,
        ElementTypeHandle::NONE,
        StateNodeHandle::NONE,
    );
    let mut source_detached_hosts = DetachedHostRecords::new_for_canary();
    let state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
        &mut store,
        &mut host,
        &mut source_detached_hosts,
        root_id,
        current_child,
        "previous missing payload reducer text update",
        previous_props,
    )
    .unwrap();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = reducer(1_301);
    let current_reducer = hook_store
        .create_current_reducer_hook(function_current, reducer_id, StateHandle::from_raw(3_100))
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver = TestHostTreeFunctionOutputResolver::new(&source);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let rescheduled = hook_store
        .dispatch_reducer_update_and_reschedule_root(
            &mut store,
            FunctionComponentReducerDispatchRequest::new(
                current_reducer.dispatch(),
                action(14),
                lane,
            ),
        )
        .unwrap();
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let callback = processed.records()[0].scheduled_callback().unwrap();
    let render = render_host_root_via_scheduler_callback(
        &mut store,
        root_id,
        callback.node(),
        Lanes::DEFAULT,
    )
    .unwrap()
    .render_phase()
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[function_work_in_progress])
        .unwrap();
    let operations_before = host.operations();

    let error = handoff_completed_function_component_use_reducer_single_host_update_to_commit(
        &mut store,
        &mut host,
        render,
        &source,
        DetachedHostRecords::new_for_canary(),
        rescheduled,
        &mut hook_store,
        FunctionComponentUseReducerRenderRequest::new(
            reducer_id,
            StateHandle::from_raw(999),
            FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT),
        ),
        &mut registry,
        &resolver,
        |state, action| StateHandle::from_raw(state.raw() + action.raw()),
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError::HostWork(
            HostWorkError::InvalidDetachedText { handle }
        ) if handle == state_node
    ));
    assert_eq!(store.root(root_id).unwrap().current(), root_current);
    assert_eq!(host.operations(), operations_before);
}
