use super::*;

#[test]
fn root_work_loop_complete_work_commit_handoff_rejects_finished_lanes_mismatch() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("section", "stale lanes");
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let complete_work = handoff_completed_host_root_render_to_test_complete_work(
        &mut store, &mut host, render, &source,
    )
    .unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .record_finished_work_for_canary(render.finished_work(), render.render_lanes());
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, 31).unwrap();
    let host_operation_count_after_complete_work = host.operations().len();
    store
        .root_mut(root_id)
        .unwrap()
        .record_finished_work_for_canary(render.finished_work(), Lanes::from(Lane::SYNC_HYDRATION));

    let error = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        render,
        Some(pending),
        32,
    )
    .unwrap_err();

    assert_eq!(complete_work.root(), root_id);
    assert_eq!(
        complete_work.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(
        complete_work.root_child_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(pending.root_finished_work(), Some(render.finished_work()));
    assert_eq!(pending.root_finished_lanes(), Lanes::DEFAULT);
    assert!(matches!(
        error,
        HostRootFinishedWorkCommitHandoffErrorForCanary::FinishedWorkRootMetadataMismatch {
            root,
            expected_finished_work,
            actual_finished_work,
            expected_finished_lanes,
            actual_finished_lanes,
        } if root == root_id
            && expected_finished_work == Some(render.finished_work())
            && actual_finished_work == Some(render.finished_work())
            && expected_finished_lanes == Lanes::DEFAULT
            && actual_finished_lanes == Lanes::from(Lane::SYNC_HYDRATION)
    ));
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(
        store.root(root_id).unwrap().finished_work(),
        Some(render.finished_work())
    );
    assert_eq!(
        store.root(root_id).unwrap().finished_lanes(),
        Lanes::from(Lane::SYNC_HYDRATION)
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render.finished_work())
    );
    assert_eq!(
        host.operations().len(),
        host_operation_count_after_complete_work
    );
}

#[test]
fn root_work_loop_complete_work_handoff_feeds_private_sync_scheduler_continuation() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("section", "scheduler commit");
    let current = store.root(root_id).unwrap().current();
    let sync_update = update_container_sync(&mut store, root_id, element, None).unwrap();
    ensure_root_is_scheduled(&mut store, sync_update.schedule()).unwrap();
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let sync_handoff = rendered.records()[0];
    let render = sync_handoff.render_phase();

    let complete_work = handoff_completed_host_root_render_to_test_complete_work(
        &mut store, &mut host, render, &source,
    )
    .unwrap();
    let pending_finished_work =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, 596).unwrap();
    let host_operation_count_after_complete_work = host.operations().len();

    let execution = execute_sync_scheduler_continuation_for_render_handoff(
        &mut store,
        sync_handoff,
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(complete_work.root(), root_id);
    assert_eq!(
        complete_work.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(
        complete_work.root_child_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(complete_work.completed_child_count(), 1);
    assert_eq!(pending_finished_work.root(), root_id);
    assert_eq!(pending_finished_work.previous_current(), current);
    assert_eq!(
        pending_finished_work.finished_work(),
        render.finished_work()
    );
    assert_eq!(pending_finished_work.render_lanes(), Lanes::SYNC);
    assert_eq!(pending_finished_work.finished_lanes(), Lanes::SYNC);
    assert_eq!(pending_finished_work.remaining_lanes(), Lanes::NO);
    assert_eq!(
        pending_finished_work.pending_lanes_before_commit(),
        Lanes::SYNC
    );
    assert!(pending_finished_work.records_finished_work());
    assert_eq!(
        execution.status(),
        RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
    );
    assert_eq!(execution.handoff(), sync_handoff);
    assert_eq!(execution.selected_lanes(), Lanes::SYNC);
    assert!(execution.did_execute_private_sync_scheduler_continuation());
    assert!(execution.consumed_accepted_render_handoff());
    assert!(execution.async_callback_execution_blocked());
    assert!(execution.public_update_scheduling_blocked());
    assert!(!execution.public_root_compatibility_claimed());
    assert!(!execution.executes_public_effects());
    let root_commit_handoff = execution.root_commit_handoff_for_canary().unwrap();
    assert!(root_commit_handoff.proves_private_root_finished_work_commit_metadata_handoff());
    assert_eq!(
        root_commit_handoff.pending().root_finished_work(),
        Some(render.finished_work())
    );
    assert_eq!(
        root_commit_handoff
            .execution_request()
            .root_finished_lanes(),
        Lanes::SYNC
    );
    let commit = execution.commit().unwrap();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(commit.finished_lanes(), Lanes::SYNC);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(commit.mutation_log().len(), 1);
    assert_eq!(commit.mutation_apply_log().len(), 1);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        None
    );
    assert_eq!(
        host.operations().len(),
        host_operation_count_after_complete_work
    );
}

#[test]
fn root_work_loop_complete_work_handoff_feeds_expired_lane_sync_scheduler_continuation() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("main", "expired scheduler commit");
    let current = store.root(root_id).unwrap().current();
    let update = update_container(&mut store, root_id, element, None).unwrap();
    ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();
    assert!(
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .set_expiration_time(Lane::DEFAULT, 625)
    );
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_starved_lanes_as_expired(625);

    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let complete_work = handoff_completed_host_root_render_to_test_complete_work(
        &mut store, &mut host, render, &source,
    )
    .unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .record_finished_work_for_canary(render.finished_work(), render.render_lanes());
    let pending_finished_work =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, 625).unwrap();
    let host_operation_count_after_complete_work = host.operations().len();
    let expired_handoff = root_sync_flush_record_for_canary(0, root_id, Lanes::DEFAULT, render);

    let execution = execute_sync_scheduler_continuation_for_render_handoff(
        &mut store,
        expired_handoff,
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(complete_work.root(), root_id);
    assert_eq!(
        complete_work.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(
        complete_work.root_child_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(complete_work.completed_child_count(), 1);
    assert_eq!(pending_finished_work.root(), root_id);
    assert_eq!(pending_finished_work.previous_current(), current);
    assert_eq!(
        pending_finished_work.finished_work(),
        render.finished_work()
    );
    assert_eq!(pending_finished_work.render_lanes(), Lanes::DEFAULT);
    assert_eq!(pending_finished_work.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(pending_finished_work.remaining_lanes(), Lanes::NO);
    assert_eq!(
        pending_finished_work.pending_lanes_before_commit(),
        Lanes::DEFAULT
    );
    assert!(pending_finished_work.records_finished_work());
    assert_eq!(
        execution.status(),
        RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
    );
    assert_eq!(execution.handoff(), expired_handoff);
    assert_eq!(execution.selected_lanes(), Lanes::DEFAULT);
    assert!(execution.did_execute_private_sync_scheduler_continuation());
    assert!(execution.consumed_accepted_render_handoff());
    assert!(execution.async_callback_execution_blocked());
    assert!(execution.public_update_scheduling_blocked());
    assert!(!execution.public_root_compatibility_claimed());
    assert!(!execution.executes_public_effects());
    let root_commit_handoff = execution.root_commit_handoff_for_canary().unwrap();
    assert!(root_commit_handoff.proves_private_root_finished_work_commit_metadata_handoff());
    assert_eq!(
        root_commit_handoff.pending().root_finished_work(),
        Some(render.finished_work())
    );
    assert_eq!(
        root_commit_handoff
            .execution_request()
            .root_finished_lanes(),
        Lanes::DEFAULT
    );
    let commit = execution.commit().unwrap();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(commit.mutation_log().len(), 1);
    assert_eq!(commit.mutation_apply_log().len(), 1);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        None
    );
    assert_eq!(
        host.operations().len(),
        host_operation_count_after_complete_work
    );
}

#[test]
fn root_work_loop_complete_work_commit_handoff_records_root_text_diagnostic() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_text("root text commit");
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let record = handoff_completed_host_root_render_to_test_complete_work_and_commit(
        &mut store, &mut host, render, &source,
    )
    .unwrap();

    let complete_work = record.complete_work();
    assert_eq!(complete_work.root_child_tag(), Some(FiberTag::HostText));
    assert_eq!(
        complete_work.completed_child_tag(),
        Some(FiberTag::HostText)
    );
    assert_eq!(complete_work.detached_instance_count(), 0);
    assert_eq!(complete_work.detached_text_count(), 1);
    assert_eq!(record.commit().previous_current(), current);
    assert_eq!(record.commit().current(), render.work_in_progress());
    assert_eq!(
        record.finished_work_handoff().pending().finished_work(),
        render.finished_work()
    );
    assert_eq!(
        record.finished_work_handoff().pending().root_token(),
        root_id.state_node_handle()
    );
    assert!(
        record
            .finished_work_handoff()
            .commit_order_after_pending_record()
    );
    assert_eq!(record.commit().mutation_log().len(), 1);
    assert_eq!(record.commit().mutation_apply_log().len(), 1);
    assert!(record.host_operations_unchanged_by_commit());

    let text = complete_work.root_child().unwrap();
    let text_state_node = store.fiber_arena().get(text).unwrap().state_node();
    let diagnostics = record.placement_apply_diagnostics();
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].fiber(), text);
    assert_eq!(diagnostics[0].tag(), FiberTag::HostText);
    assert_eq!(diagnostics[0].tag_name(), "HostText");
    assert_eq!(diagnostics[0].state_node(), text_state_node);
    assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
    assert_eq!(diagnostics[0].sibling_status(), "append");
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.work_in_progress()
    );
}

#[test]
fn root_work_loop_hands_multiple_host_siblings_to_test_complete_work() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let first_element = source.insert_host_element_with_text("article", "first");
    let second_element = source.insert_text("second");
    let original_root_element = RootElementHandle::from_raw(980);
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, original_root_element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let record = handoff_completed_host_root_render_to_test_complete_work_for_siblings(
        &mut store,
        &mut host,
        render,
        &source,
        &[first_element, second_element],
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.root_child_count(), 2);
    assert_eq!(record.completed_child_count(), 2);
    assert_eq!(record.root_child_tag(), Some(FiberTag::HostComponent));
    assert_eq!(record.last_root_child_tag(), Some(FiberTag::HostText));
    assert_eq!(record.completed_child_tag(), Some(FiberTag::HostComponent));
    assert_eq!(record.last_completed_child_tag(), Some(FiberTag::HostText));
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(record.resulting_element(), original_root_element);
    assert_eq!(record.detached_instance_count(), 1);
    assert_eq!(record.detached_text_count(), 2);

    let first = record.root_child().unwrap();
    let second = record.last_root_child().unwrap();
    assert_eq!(record.completed_child(), Some(first));
    assert_eq!(record.last_completed_child(), Some(second));
    let root_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
    assert_eq!(root_node.child(), Some(first));
    assert!(
        root_node
            .subtree_flags()
            .contains_all(FiberFlags::PLACEMENT)
    );
    assert_eq!(root_node.child_lanes(), Lanes::NO);

    let first_node = store.fiber_arena().get(first).unwrap();
    let second_node = store.fiber_arena().get(second).unwrap();
    assert_eq!(first_node.tag(), FiberTag::HostComponent);
    assert_eq!(first_node.return_fiber(), Some(render.work_in_progress()));
    assert_eq!(first_node.sibling(), Some(second));
    assert!(first_node.state_node().is_some());
    assert!(first_node.flags().contains_all(FiberFlags::PLACEMENT));
    assert_eq!(second_node.tag(), FiberTag::HostText);
    assert_eq!(second_node.return_fiber(), Some(render.work_in_progress()));
    assert_eq!(second_node.sibling(), None);
    assert!(second_node.state_node().is_some());
    assert!(second_node.flags().contains_all(FiberFlags::PLACEMENT));
    store.fiber_arena().validate_topology().unwrap();

    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render.work_in_progress())
    );
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
            "create_text_instance",
        ]
    );
}

#[test]
fn root_work_loop_hands_one_level_array_or_fragment_child_set_to_test_complete_work() {
    for (index, kind) in [
        HostRootOneLevelChildSetKind::Array,
        HostRootOneLevelChildSetKind::Fragment,
    ]
    .into_iter()
    .enumerate()
    {
        let raw = index as u64;
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let first_element = source.insert_host_element_with_text("article", format!("first {raw}"));
        let second_element = source.insert_text(format!("second {raw}"));
        let original_root_element = RootElementHandle::from_raw(1_200 + raw);
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, original_root_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let entries = vec![
            HostRootOneLevelChildSetEntry::host(first_element),
            HostRootOneLevelChildSetEntry::host(second_element),
        ];
        let child_set = match kind {
            HostRootOneLevelChildSetKind::Array => {
                HostRootOneLevelChildSet::array(original_root_element, entries)
            }
            HostRootOneLevelChildSetKind::Fragment => {
                HostRootOneLevelChildSet::fragment(original_root_element, None, entries)
            }
        };

        let record =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
                &mut store, &mut host, render, &source, &child_set,
            )
            .unwrap();

        assert_eq!(record.kind(), kind);
        assert_eq!(record.root_element(), original_root_element);
        assert_eq!(record.child_count(), 2);
        assert_eq!(
            record.begin_work().children(),
            &[first_element, second_element]
        );
        assert_eq!(record.begin_work().first_child(), first_element);
        assert_eq!(record.begin_work().last_child(), second_element);

        let completion = record.child_set_completion();
        assert_eq!(completion.host_root(), render.work_in_progress());
        assert_eq!(completion.child_count(), 2);
        assert_eq!(completion.first_child_tag(), FiberTag::HostComponent);
        assert_eq!(completion.last_child_tag(), FiberTag::HostText);
        assert!(
            completion
                .subtree_flags()
                .contains_all(FiberFlags::PLACEMENT)
        );

        let complete_work = record.complete_work();
        assert_eq!(complete_work.root(), root_id);
        assert_eq!(
            complete_work.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(complete_work.root_child_count(), 2);
        assert_eq!(complete_work.completed_child_count(), 2);
        assert_eq!(
            complete_work.root_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(
            complete_work.last_root_child_tag(),
            Some(FiberTag::HostText)
        );
        assert_eq!(
            complete_work.completed_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(
            complete_work.last_completed_child_tag(),
            Some(FiberTag::HostText)
        );
        assert_eq!(complete_work.render_lanes(), Lanes::DEFAULT);
        assert_eq!(complete_work.resulting_element(), original_root_element);
        assert_eq!(complete_work.detached_instance_count(), 1);
        assert_eq!(complete_work.detached_text_count(), 2);

        let first = complete_work.root_child().unwrap();
        let second = complete_work.last_root_child().unwrap();
        assert_eq!(completion.first_child(), first);
        assert_eq!(completion.last_child(), second);
        assert_eq!(complete_work.completed_child(), Some(first));
        assert_eq!(complete_work.last_completed_child(), Some(second));

        let root_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
        assert_eq!(root_node.child(), Some(first));
        assert!(
            root_node
                .subtree_flags()
                .contains_all(FiberFlags::PLACEMENT)
        );
        assert_eq!(root_node.child_lanes(), Lanes::NO);

        let first_node = store.fiber_arena().get(first).unwrap();
        let second_node = store.fiber_arena().get(second).unwrap();
        assert_eq!(first_node.tag(), FiberTag::HostComponent);
        assert_eq!(first_node.return_fiber(), Some(render.work_in_progress()));
        assert_eq!(first_node.sibling(), Some(second));
        assert!(first_node.state_node().is_some());
        assert!(first_node.flags().contains_all(FiberFlags::PLACEMENT));
        assert_eq!(second_node.tag(), FiberTag::HostText);
        assert_eq!(second_node.return_fiber(), Some(render.work_in_progress()));
        assert_eq!(second_node.sibling(), None);
        assert!(second_node.state_node().is_some());
        assert!(second_node.flags().contains_all(FiberFlags::PLACEMENT));
        store.fiber_arena().validate_topology().unwrap();

        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.work_in_progress())
        );
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
                "create_text_instance",
            ]
        );
    }
}

#[test]
fn root_work_loop_one_level_child_set_executes_private_container_appends_after_commit() {
    for (index, kind) in [
        HostRootOneLevelChildSetKind::Array,
        HostRootOneLevelChildSetKind::Fragment,
    ]
    .into_iter()
    .enumerate()
    {
        let raw = index as u64;
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let first_element = source.insert_host_element_with_text("article", format!("first {raw}"));
        let second_element = source.insert_text(format!("second {raw}"));
        let original_root_element = RootElementHandle::from_raw(85_500 + raw);
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, original_root_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let entries = vec![
            HostRootOneLevelChildSetEntry::host(first_element),
            HostRootOneLevelChildSetEntry::host(second_element),
        ];
        let child_set = match kind {
            HostRootOneLevelChildSetKind::Array => {
                HostRootOneLevelChildSet::array(original_root_element, entries)
            }
            HostRootOneLevelChildSetKind::Fragment => {
                HostRootOneLevelChildSet::fragment(original_root_element, None, entries)
            }
        };

        let (record, mut host_work) =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
                &mut store,
                &mut host,
                render,
                &source,
                &child_set,
                DetachedHostRecords::default(),
            )
            .unwrap();
        let host_operation_count_after_complete_work = host.operations().len();
        let finished_work_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                &mut store,
                render,
                855_001 + index,
                855_101 + index,
            )
            .unwrap();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            finished_work_handoff.commit(),
            &mut host_work,
        )
        .unwrap();

        assert_eq!(record.kind(), kind);
        assert_eq!(record.root_element(), original_root_element);
        assert_eq!(
            record.begin_work().children(),
            &[first_element, second_element]
        );
        assert_eq!(record.child_count(), 2);
        assert_eq!(
            host_operation_count_after_complete_work,
            operations_before_apply.len()
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.work_in_progress()
        );
        assert_eq!(finished_work_handoff.pending().previous_current(), current);
        assert!(finished_work_handoff.mutation_execution_blocked());
        assert!(finished_work_handoff.public_root_rendering_blocked());

        let complete_work = record.complete_work();
        let first = complete_work.root_child().unwrap();
        let second = complete_work.last_root_child().unwrap();
        let first_state_node = store.fiber_arena().get(first).unwrap().state_node();
        let second_state_node = store.fiber_arena().get(second).unwrap().state_node();
        assert_eq!(complete_work.root_child_count(), 2);
        assert_eq!(complete_work.completed_child_count(), 2);
        assert_eq!(
            complete_work.root_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(
            complete_work.last_root_child_tag(),
            Some(FiberTag::HostText)
        );

        let diagnostics = finished_work_handoff
            .commit()
            .host_root_placement_apply_diagnostics_for_canary();
        assert_eq!(diagnostics.len(), 2);
        assert_eq!(diagnostics[0].fiber(), first);
        assert_eq!(diagnostics[0].tag(), FiberTag::HostComponent);
        assert_eq!(diagnostics[0].state_node(), first_state_node);
        assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
        assert_eq!(diagnostics[0].sibling_status(), "append");
        assert_eq!(diagnostics[0].skipped_pending_sibling_count(), 1);
        assert!(!diagnostics[0].can_insert_before());
        assert_eq!(diagnostics[1].fiber(), second);
        assert_eq!(diagnostics[1].tag(), FiberTag::HostText);
        assert_eq!(diagnostics[1].state_node(), second_state_node);
        assert_eq!(diagnostics[1].apply_kind(), "append-placement-to-container");
        assert_eq!(diagnostics[1].sibling_status(), "append");
        assert_eq!(diagnostics[1].skipped_pending_sibling_count(), 0);
        assert!(!diagnostics[1].can_insert_before());

        assert_eq!(apply.root(), root_id);
        assert_eq!(apply.finished_work(), render.work_in_progress());
        assert_eq!(apply.records().len(), 2);
        assert_eq!(apply.records()[0].mutation().fiber(), first);
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
        assert_eq!(apply.records()[1].mutation().fiber(), second);
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
        assert_eq!(apply.private_host_store_update_count(), 0);
        let mut expected_operations = operations_before_apply;
        expected_operations.push("append_child_to_container");
        expected_operations.push("append_child_to_container");
        assert_eq!(host.operations(), expected_operations);
    }
}

#[test]
fn root_work_loop_one_level_child_set_executes_private_insert_before_stable_root_sibling() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let stable_element = source.insert_text("stable sibling");
    update_container(&mut store, root_id, stable_element, None).unwrap();
    let stable_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut stable_host_work =
        mount_test_host_work(&mut store, &mut host, stable_render, &source).unwrap();
    let stable_handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        stable_render,
        855_201,
        855_202,
    )
    .unwrap();
    let stable_apply = apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        stable_handoff.commit(),
        &mut stable_host_work,
    )
    .unwrap();
    assert_eq!(stable_apply.applied_host_call_count(), 1);
    assert_eq!(
        stable_apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::AppendChildToContainer
        )
    );

    let stable_current = stable_host_work.root_child().unwrap();
    let stable_node = store.fiber_arena().get(stable_current).unwrap();
    let stable_state_node = stable_node.state_node();
    let stable_props = stable_node.memoized_props();
    let detached_hosts = stable_host_work.into_detached_hosts_for_canary();

    let first_element = source.insert_host_element_with_text("article", "inserted component");
    let second_element = source.insert_text("inserted text");
    let update_root_element = RootElementHandle::from_raw(85_520);
    update_container(&mut store, root_id, update_root_element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let child_set = HostRootOneLevelChildSet::array(
        update_root_element,
        vec![
            HostRootOneLevelChildSetEntry::host(first_element),
            HostRootOneLevelChildSetEntry::host(second_element),
        ],
    );
    let (record, mut host_work) =
        handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
            &mut store,
            &mut host,
            render,
            &source,
            &child_set,
            detached_hosts,
        )
        .unwrap();
    let first = record.complete_work().root_child().unwrap();
    let second = record.complete_work().last_root_child().unwrap();
    let stable_work = append_stable_root_text_work_after_one_level_child_set(
        &mut store,
        render,
        first,
        second,
        stable_current,
        stable_state_node,
        stable_props,
    );
    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut store, render, 855_203, 855_204,
        )
        .unwrap();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        finished_work_handoff.commit(),
        &mut host_work,
    )
    .unwrap();

    assert_eq!(
        record.begin_work().children(),
        &[first_element, second_element]
    );
    assert_eq!(
        record.complete_work().root_child_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(
        record.complete_work().last_root_child_tag(),
        Some(FiberTag::HostText)
    );

    let diagnostics = finished_work_handoff
        .commit()
        .host_root_placement_apply_diagnostics_for_canary();
    assert_eq!(diagnostics.len(), 2);
    assert_eq!(diagnostics[0].fiber(), first);
    assert_eq!(
        diagnostics[0].apply_kind(),
        "insert-placement-in-container-before"
    );
    assert_eq!(diagnostics[0].sibling_status(), "insert-before");
    assert_eq!(diagnostics[0].sibling(), Some(stable_work));
    assert_eq!(diagnostics[0].sibling_tag(), Some(FiberTag::HostText));
    assert_eq!(diagnostics[0].sibling_state_node(), stable_state_node);
    assert_eq!(diagnostics[0].skipped_pending_sibling_count(), 1);
    assert!(diagnostics[0].can_insert_before());
    assert_eq!(diagnostics[1].fiber(), second);
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
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::InsertInContainerBefore
        )
    );
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
fn root_work_loop_one_level_child_set_records_only_for_unproven_stable_sibling() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let first_element = source.insert_host_element_with_text("article", "blocked component");
    let second_element = source.insert_text("blocked text");
    let root_element = RootElementHandle::from_raw(85_530);
    update_container(&mut store, root_id, root_element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let child_set = HostRootOneLevelChildSet::array(
        root_element,
        vec![
            HostRootOneLevelChildSetEntry::host(first_element),
            HostRootOneLevelChildSetEntry::host(second_element),
        ],
    );
    let (record, mut host_work) =
        handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
            &mut store,
            &mut host,
            render,
            &source,
            &child_set,
            DetachedHostRecords::default(),
        )
        .unwrap();
    let first = record.complete_work().root_child().unwrap();
    let second = record.complete_work().last_root_child().unwrap();
    let mode = store
        .fiber_arena()
        .get(render.work_in_progress())
        .unwrap()
        .mode();
    let unproven_sibling = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(85_531),
        mode,
    );
    store
        .fiber_arena_mut()
        .get_mut(unproven_sibling)
        .unwrap()
        .set_memoized_props(PropsHandle::from_raw(85_531));
    store
        .fiber_arena_mut()
        .set_children(
            render.work_in_progress(),
            &[first, second, unproven_sibling],
        )
        .unwrap();
    complete_host_root_one_level_child_set_for_test(
        store.fiber_arena_mut(),
        render.work_in_progress(),
        3,
    )
    .unwrap();
    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut store, render, 855_301, 855_302,
        )
        .unwrap();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        finished_work_handoff.commit(),
        &mut host_work,
    )
    .unwrap();

    let diagnostics = finished_work_handoff
        .commit()
        .host_root_placement_apply_diagnostics_for_canary();
    assert_eq!(diagnostics.len(), 2);
    assert_eq!(
        diagnostics[0].apply_kind(),
        "record-placement-insertion-blocked"
    );
    assert_eq!(
        diagnostics[0].sibling_status(),
        "blocked-missing-state-node"
    );
    assert_eq!(diagnostics[0].sibling(), Some(unproven_sibling));
    assert_eq!(
        diagnostics[1].apply_kind(),
        "record-placement-insertion-blocked"
    );
    assert_eq!(
        diagnostics[1].sibling_status(),
        "blocked-missing-state-node"
    );
    assert_eq!(diagnostics[1].sibling(), Some(unproven_sibling));
    assert_eq!(apply.records().len(), 2);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::RecordedOnly
    );
    assert_eq!(
        apply.records()[1].mutation().kind(),
        HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked
    );
    assert_eq!(
        apply.records()[1].status(),
        TestHostRootMutationApplyStatus::RecordedOnly
    );
    assert_eq!(apply.applied_host_call_count(), 0);
    assert_eq!(host.operations(), operations_before_apply);
}

#[test]
fn root_work_loop_one_level_child_set_rejects_stale_insert_before_sibling_before_host_call() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let stable_element = source.insert_text("stale sibling");
    update_container(&mut store, root_id, stable_element, None).unwrap();
    let stable_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut stable_host_work =
        mount_test_host_work(&mut store, &mut host, stable_render, &source).unwrap();
    let stable_handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        stable_render,
        855_401,
        855_402,
    )
    .unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        stable_handoff.commit(),
        &mut stable_host_work,
    )
    .unwrap();

    let stable_current = stable_host_work.root_child().unwrap();
    let stable_node = store.fiber_arena().get(stable_current).unwrap();
    let stable_state_node = stable_node.state_node();
    let stable_props = stable_node.memoized_props();
    let detached_hosts = stable_host_work.into_detached_hosts_for_canary();

    let first_element = source.insert_host_element_with_text("article", "stale component");
    let second_element = source.insert_text("stale text");
    let update_root_element = RootElementHandle::from_raw(85_540);
    update_container(&mut store, root_id, update_root_element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let child_set = HostRootOneLevelChildSet::array(
        update_root_element,
        vec![
            HostRootOneLevelChildSetEntry::host(first_element),
            HostRootOneLevelChildSetEntry::host(second_element),
        ],
    );
    let (record, mut host_work) =
        handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
            &mut store,
            &mut host,
            render,
            &source,
            &child_set,
            detached_hosts,
        )
        .unwrap();
    let first = record.complete_work().root_child().unwrap();
    let second = record.complete_work().last_root_child().unwrap();
    append_stable_root_text_work_after_one_level_child_set(
        &mut store,
        render,
        first,
        second,
        stable_current,
        stable_state_node,
        stable_props,
    );
    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut store, render, 855_403, 855_404,
        )
        .unwrap();
    let operations_before_apply = host.operations();
    host_work
        .detached_hosts_mut_for_canary()
        .invalidate_text_for_canary(stable_state_node)
        .unwrap();

    let error = apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        finished_work_handoff.commit(),
        &mut host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostNode(error) if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(host.operations(), operations_before_apply);
}
