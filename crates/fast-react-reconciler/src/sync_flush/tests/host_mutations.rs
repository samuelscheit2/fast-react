use super::*;

#[test]
fn sync_flush_handoff_commits_already_renderable_host_output_canary_with_diagnostics() {
    let (mut store, root_id, host) = root_store();
    let sync_element = RootElementHandle::from_raw(800);
    let default_element = RootElementHandle::from_raw(801);
    let callback = RootUpdateCallbackHandle::from_raw(802);
    let previous_current = store.root(root_id).unwrap().current();
    let sync_update =
        update_container_sync(&mut store, root_id, sync_element, Some(callback)).unwrap();
    ensure_root_is_scheduled(&mut store, sync_update.schedule()).unwrap();
    let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
    ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

    assert_eq!(rendered.records().len(), 1);
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    assert_eq!(render_phase.root(), root_id);
    assert_eq!(render_phase.render_lanes(), Lanes::SYNC);
    assert_eq!(render_phase.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert!(store.root_scheduler().might_have_pending_sync_work());

    let fixture = TestRendererHostOutputCanaryFixture::new(810, 811, 812);
    let prepared =
        prepare_test_renderer_host_output_canary_fibers(&mut store, render_phase, fixture).unwrap();
    let completed =
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 813, 814).unwrap();

    let (committed, diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut store,
            rendered_record,
        )
        .unwrap();

    assert_eq!(committed.order(), 0);
    assert_eq!(committed.root(), root_id);
    assert_eq!(committed.render_lanes(), Lanes::SYNC);
    assert_eq!(committed.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(committed.pending_lanes(), Lanes::DEFAULT);
    assert!(committed.has_remaining_work());
    assert_eq!(committed.commit().previous_current(), previous_current);
    assert_eq!(committed.commit().current(), completed.host_root());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        completed.host_root()
    );
    assert_eq!(current_host_root_element(&store, root_id), sync_element);
    assert!(
        !store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_lane(Lane::SYNC)
    );
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_lane(Lane::DEFAULT)
    );

    let callbacks = committed.root_update_callbacks();
    assert_eq!(
        callbacks.queue(),
        render_phase.work_in_progress_update_queue()
    );
    assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
    assert_eq!(callbacks.visible()[0].update(), sync_update.update());
    assert!(callbacks.hidden().is_empty());
    assert!(callbacks.deferred_hidden().is_empty());

    let host_output = inspect_test_renderer_host_output_canary_commit(committed.commit());
    assert_eq!(host_output.mutation_records().len(), 1);
    assert!(host_output.deletion_lists().is_empty());
    assert_eq!(
        host_output.mutation_records()[0].kind(),
        TestRendererHostOutputCanaryMutationKind::Placement
    );
    assert_eq!(
        host_output.mutation_records()[0].fiber(),
        completed.component()
    );
    assert_eq!(
        host_output.mutation_records()[0].tag(),
        FiberTag::HostComponent
    );
    assert_eq!(host_output.mutation_records()[0].state_node_raw(), 813);
    assert_eq!(
        store
            .fiber_arena()
            .get(completed.component())
            .unwrap()
            .child(),
        Some(completed.text())
    );

    let placement_diagnostics = committed
        .commit()
        .host_root_placement_apply_diagnostics_for_canary();
    assert_eq!(placement_diagnostics.len(), 1);
    assert_eq!(placement_diagnostics[0].fiber(), completed.component());
    assert_eq!(
        placement_diagnostics[0].apply_kind(),
        "append-placement-to-container"
    );
    assert_eq!(placement_diagnostics[0].sibling_status(), "append");

    assert_eq!(diagnostics.root(), root_id);
    assert_eq!(diagnostics.order(), 0);
    assert_eq!(
        diagnostics.callback_queue(),
        render_phase.work_in_progress_update_queue()
    );
    assert_eq!(diagnostics.render_lanes(), Lanes::SYNC);
    assert_eq!(diagnostics.finished_lanes(), Lanes::SYNC);
    assert!(diagnostics.finished_work_handoff_identity_recorded());
    assert!(diagnostics.commit_result_identity_recorded());
    assert!(diagnostics.accepted_finished_work_handoff_identity());
    assert!(diagnostics.commit_result_matches_finished_work_handoff());
    assert!(diagnostics.finished_work_root_commit_handoff_verified());
    assert!(diagnostics.accepted_finished_work_handoff());
    assert_eq!(
        diagnostics.root_finished_work_before_commit(),
        Some(completed.host_root())
    );
    assert_eq!(
        diagnostics.root_finished_lanes_before_commit(),
        Some(Lanes::SYNC)
    );
    assert_eq!(diagnostics.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(diagnostics.commit_pending_lanes(), Lanes::DEFAULT);
    assert_eq!(
        diagnostics.root_pending_lanes_after_commit(),
        Lanes::DEFAULT
    );
    assert_eq!(
        diagnostics.root_current_after_commit(),
        completed.host_root()
    );
    assert_eq!(diagnostics.committed_current(), completed.host_root());
    assert_eq!(diagnostics.render_phase_work_after_commit(), None);
    assert_eq!(diagnostics.render_phase_lanes_after_commit(), Lanes::NO);
    assert_eq!(
        diagnostics.callback_node_after_commit(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(
        diagnostics.callback_priority_after_commit(),
        RootCallbackPriority::NO
    );
    assert!(!diagnostics.might_have_pending_sync_work());
    assert_eq!(diagnostics.accepted_visible_callback_count(), 1);
    assert_eq!(diagnostics.accepted_hidden_callback_count(), 0);
    assert_eq!(diagnostics.accepted_deferred_hidden_callback_count(), 0);
    assert_eq!(diagnostics.accepted_callback_count(), 1);
    assert_eq!(diagnostics.post_commit_visible_callback_count(), 0);
    assert_eq!(diagnostics.post_commit_hidden_callback_count(), 0);
    assert_eq!(diagnostics.post_commit_deferred_hidden_callback_count(), 0);
    assert_eq!(diagnostics.mutation_record_count(), 1);
    assert_eq!(diagnostics.mutation_apply_record_count(), 1);
    assert_eq!(diagnostics.host_root_placement_apply_count(), 1);
    assert!(diagnostics.recorded_host_output_mutation_metadata());
    assert!(diagnostics.commit_handoff_state_consumed());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_private_host_mutation_execution_opt_in_applies_host_work_after_commit() {
    let mut fixture = sync_flush_host_mutation_fixture("sync flush host mutation");

    assert_eq!(fixture.committed.root(), fixture.root_id);
    assert_eq!(fixture.committed.render_lanes(), Lanes::SYNC);
    assert!(
        fixture
            .committed
            .accepted_finished_work_handoff_for_canary()
    );
    assert!(fixture.diagnostics.accepted_finished_work_handoff());
    assert_eq!(fixture.diagnostics.mutation_record_count(), 1);
    assert_eq!(fixture.diagnostics.mutation_apply_record_count(), 1);
    assert_eq!(fixture.diagnostics.host_root_placement_apply_count(), 1);
    assert_eq!(
        fixture.host_work.work_in_progress(),
        fixture.committed.commit().finished_work()
    );
    assert_eq!(fixture.host.operations(), fixture.operations_before_opt_in);

    let request = sync_flush_host_mutation_execution_request_for_canary(
        &fixture.committed,
        fixture.diagnostics,
    )
    .unwrap();

    assert_eq!(request.root(), fixture.root_id);
    assert_eq!(request.order(), fixture.committed.order());
    assert_eq!(request.render_lanes(), Lanes::SYNC);
    assert_eq!(request.finished_lanes(), Lanes::SYNC);
    assert_eq!(request.mutation_record_count(), 1);
    assert_eq!(request.mutation_apply_record_count(), 1);
    assert_eq!(request.host_root_placement_apply_count(), 1);
    assert!(request.private_opt_in_host_mutation_execution_requested());
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_flush_sync_compatibility_claimed());

    let execution = execute_sync_flush_host_mutations_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.committed,
        fixture.diagnostics,
        request,
        &mut fixture.host_work,
    )
    .unwrap();

    assert_eq!(execution.request(), request);
    assert_eq!(execution.root(), fixture.root_id);
    assert_eq!(execution.order(), fixture.committed.order());
    assert_eq!(
        execution.finished_work(),
        fixture.committed.commit().finished_work()
    );
    assert_eq!(execution.mutation_apply_record_count(), 1);
    assert_eq!(execution.applied_host_call_count(), 1);
    assert_eq!(execution.private_host_store_update_count(), 0);
    assert_eq!(execution.recorded_only_count(), 0);
    assert!(execution.private_opt_in_host_mutation_execution_requested());
    assert!(execution.private_test_host_mutation_executed());
    assert!(execution.public_renderer_mutation_blocked());
    assert!(!execution.public_flush_sync_compatibility_claimed());
    assert!(!execution.react_dom_compatibility_claimed());
    assert!(!execution.test_renderer_compatibility_claimed());

    let mut expected_operations = fixture.operations_before_opt_in.clone();
    expected_operations.push("append_child_to_container");
    assert_eq!(fixture.host.operations(), expected_operations);
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        fixture.committed.commit().current()
    );
}

#[test]
fn sync_flush_private_host_mutation_execution_applies_text_update_after_commit() {
    let mut fixture = sync_flush_text_host_mutation_fixture("sync flush text before");
    let initial_execution = execute_fixture_sync_flush_host_mutations(&mut fixture);
    assert_eq!(initial_execution.applied_host_call_count(), 1);
    assert_eq!(initial_execution.deletion_cleanup_apply_count(), 0);

    let update_element = fixture.source.insert_text("sync flush text after");
    schedule_sync_update(&mut fixture.store, fixture.root_id, update_element);
    let rendered =
        flush_sync_work_on_all_roots(&mut fixture.store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    update_test_host_work_root_text_for_canary(
        &mut fixture.store,
        &mut fixture.host_work,
        rendered_record.render_phase(),
        text_from_root(&fixture.source, update_element),
    )
    .unwrap();
    let operations_before_update_opt_in = fixture.host.operations();

    let (committed, diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut fixture.store,
            rendered_record,
        )
        .unwrap();

    let apply_records = committed.commit().mutation_apply_log().records();
    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(diagnostics.mutation_record_count(), 1);
    assert_eq!(diagnostics.mutation_apply_record_count(), 1);
    assert_eq!(diagnostics.host_root_placement_apply_count(), 0);
    assert_eq!(fixture.host.operations(), operations_before_update_opt_in);

    let request =
        sync_flush_host_mutation_execution_request_for_canary(&committed, diagnostics).unwrap();
    let execution = execute_sync_flush_host_mutations_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &committed,
        diagnostics,
        request,
        &mut fixture.host_work,
    )
    .unwrap();

    assert_eq!(execution.request(), request);
    assert_eq!(execution.root(), fixture.root_id);
    assert_eq!(execution.mutation_apply_record_count(), 1);
    assert_eq!(execution.applied_host_call_count(), 1);
    assert_eq!(execution.private_host_store_update_count(), 0);
    assert_eq!(execution.recorded_only_count(), 0);
    assert_eq!(execution.deletion_cleanup_apply_count(), 0);
    assert!(execution.private_test_host_mutation_executed());
    assert!(execution.public_renderer_mutation_blocked());
    assert!(!execution.public_flush_sync_compatibility_claimed());

    let mut expected_operations = operations_before_update_opt_in;
    expected_operations.push("commit_text_update");
    assert_eq!(fixture.host.operations(), expected_operations);

    let operations_after_execution = fixture.host.operations();
    let replay_error = execute_sync_flush_host_mutations_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &committed,
        diagnostics,
        request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        replay_error,
        SyncFlushHostMutationExecutionErrorForCanary::ReplayedHostMutationExecution {
            root,
            order,
            finished_work,
        } if root == fixture.root_id
            && order == committed.order()
            && finished_work == committed.commit().finished_work()
    ));
    assert_eq!(fixture.host.operations(), operations_after_execution);
}

#[test]
fn sync_flush_private_host_mutation_execution_applies_component_update_after_commit() {
    let mut fixture = sync_flush_host_mutation_fixture("sync flush component before");
    let initial_execution = execute_fixture_sync_flush_host_mutations(&mut fixture);
    assert_eq!(initial_execution.applied_host_call_count(), 1);
    assert_eq!(initial_execution.deletion_cleanup_apply_count(), 0);

    let update_element = fixture
        .source
        .insert_host_element_with_text("section", "sync flush component after");
    schedule_sync_update(&mut fixture.store, fixture.root_id, update_element);
    let rendered =
        flush_sync_work_on_all_roots(&mut fixture.store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    update_test_host_work_root_component_for_canary(
        &mut fixture.store,
        &mut fixture.host_work,
        rendered_record.render_phase(),
        element_from_root(&fixture.source, update_element),
    )
    .unwrap();
    let operations_before_update_opt_in = fixture.host.operations();

    let (committed, diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut fixture.store,
            rendered_record,
        )
        .unwrap();

    let apply_records = committed.commit().mutation_apply_log().records();
    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(diagnostics.mutation_record_count(), 1);
    assert_eq!(diagnostics.mutation_apply_record_count(), 1);
    assert_eq!(diagnostics.host_root_placement_apply_count(), 0);
    assert_eq!(fixture.host.operations(), operations_before_update_opt_in);

    let request =
        sync_flush_host_mutation_execution_request_for_canary(&committed, diagnostics).unwrap();
    let execution = execute_sync_flush_host_mutations_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &committed,
        diagnostics,
        request,
        &mut fixture.host_work,
    )
    .unwrap();

    assert_eq!(execution.request(), request);
    assert_eq!(execution.root(), fixture.root_id);
    assert_eq!(execution.mutation_apply_record_count(), 1);
    assert_eq!(execution.applied_host_call_count(), 1);
    assert_eq!(execution.private_host_store_update_count(), 0);
    assert_eq!(execution.recorded_only_count(), 0);
    assert_eq!(execution.deletion_cleanup_apply_count(), 0);
    assert!(execution.private_test_host_mutation_executed());
    assert!(execution.public_renderer_mutation_blocked());
    assert!(!execution.public_flush_sync_compatibility_claimed());

    let mut expected_operations = operations_before_update_opt_in;
    expected_operations.push("commit_update");
    assert_eq!(fixture.host.operations(), expected_operations);

    let operations_after_execution = fixture.host.operations();
    let replay_error = execute_sync_flush_host_mutations_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &committed,
        diagnostics,
        request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        replay_error,
        SyncFlushHostMutationExecutionErrorForCanary::ReplayedHostMutationExecution {
            root,
            order,
            finished_work,
        } if root == fixture.root_id
            && order == committed.order()
            && finished_work == committed.commit().finished_work()
    ));
    assert_eq!(fixture.host.operations(), operations_after_execution);
}

#[test]
fn sync_flush_private_host_mutation_execution_applies_root_unmount_after_commit() {
    let mut fixture = sync_flush_host_mutation_fixture("sync flush unmount");
    let initial_execution = execute_fixture_sync_flush_host_mutations(&mut fixture);
    assert_eq!(initial_execution.applied_host_call_count(), 1);
    assert_eq!(initial_execution.deletion_cleanup_apply_count(), 0);

    schedule_sync_update(&mut fixture.store, fixture.root_id, RootElementHandle::NONE);
    let rendered =
        flush_sync_work_on_all_roots(&mut fixture.store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    delete_test_host_work_root_child_for_canary(
        &mut fixture.store,
        &mut fixture.host_work,
        rendered_record.render_phase(),
    )
    .unwrap();
    let operations_before_unmount_opt_in = fixture.host.operations();

    let (committed, diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut fixture.store,
            rendered_record,
        )
        .unwrap();

    let apply_records = committed.commit().mutation_apply_log().records();
    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    assert_eq!(diagnostics.mutation_record_count(), 0);
    assert_eq!(diagnostics.mutation_apply_record_count(), 1);
    assert_eq!(diagnostics.host_root_placement_apply_count(), 0);
    assert_eq!(fixture.host.operations(), operations_before_unmount_opt_in);

    let request =
        sync_flush_host_mutation_execution_request_for_canary(&committed, diagnostics).unwrap();
    let execution = execute_sync_flush_host_mutations_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &committed,
        diagnostics,
        request,
        &mut fixture.host_work,
    )
    .unwrap();

    assert_eq!(execution.request(), request);
    assert_eq!(execution.root(), fixture.root_id);
    assert_eq!(execution.mutation_apply_record_count(), 1);
    assert_eq!(execution.applied_host_call_count(), 1);
    assert_eq!(execution.private_host_store_update_count(), 0);
    assert_eq!(execution.recorded_only_count(), 0);
    assert_eq!(execution.deletion_cleanup_apply_count(), 2);
    assert!(execution.private_test_host_mutation_executed());
    assert!(execution.public_renderer_mutation_blocked());
    assert!(!execution.public_flush_sync_compatibility_claimed());
    assert!(!execution.react_dom_compatibility_claimed());
    assert!(!execution.test_renderer_compatibility_claimed());

    let mut expected_operations = operations_before_unmount_opt_in;
    expected_operations.push("remove_child_from_container");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(fixture.host.operations(), expected_operations);
}

#[test]
fn sync_flush_private_deleted_subtree_teardown_executes_ref_passive_host_detach_and_cleanup_in_order()
 {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_sync_flush_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 889_100,
    );
    let queued_passive = fixture.deleted_passive_handoff.records()[0];
    let handoff = fixture
        .committed
        .root_finished_work_commit_handoff_for_canary()
        .unwrap()
        .clone();
    let mut executor = RecordingSyncFlushDeletedSubtreeTeardownExecutor::default();

    let diagnostic = execute_sync_flush_deleted_subtree_teardown_for_canary(
        &mut store,
        &mut host,
        &fixture.committed,
        fixture.diagnostics,
        fixture.sync_request,
        &handoff,
        fixture.deletion_request,
        fixture.deletion_request,
        &mut fixture.host_work,
        &mut executor,
    )
    .unwrap();

    assert_eq!(
        fixture.previous_current,
        fixture.committed.commit().previous_current()
    );
    assert_eq!(fixture.sync_request.root(), root_id);
    assert_eq!(fixture.sync_request.order(), fixture.committed.order());
    assert_eq!(fixture.sync_request.render_lanes(), Lanes::SYNC);
    assert_eq!(fixture.sync_request.finished_lanes(), Lanes::SYNC);
    assert_eq!(fixture.sync_request.remaining_lanes(), Lanes::NO);
    assert_eq!(fixture.sync_request.pending_lanes(), Lanes::NO);
    assert_eq!(
        fixture.sync_request.finished_work(),
        fixture.committed.commit().finished_work()
    );
    assert_eq!(
        fixture.sync_request.committed_current(),
        fixture.committed.commit().current()
    );
    assert_eq!(fixture.sync_request.mutation_apply_record_count(), 1);
    assert_eq!(fixture.sync_request.host_root_placement_apply_count(), 0);

    let apply_records = fixture.committed.commit().mutation_apply_log().records();
    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.deletion_list)
    );
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );

    assert_eq!(fixture.deletion_request.root(), root_id);
    assert_eq!(fixture.deletion_request.finished_lanes(), Lanes::SYNC);
    assert_eq!(fixture.deletion_request.remaining_lanes(), Lanes::NO);
    assert_eq!(fixture.deletion_request.pending_lanes(), Lanes::NO);
    assert_eq!(fixture.deletion_request.deletion_list_count(), 1);
    assert_eq!(fixture.deletion_request.deleted_root_count(), 1);
    assert_eq!(fixture.deletion_request.ref_cleanup_return_count(), 1);
    assert_eq!(fixture.deletion_request.passive_destroy_count(), 1);
    assert_eq!(fixture.deletion_request.host_node_cleanup_count(), 2);
    assert!(
        fixture
            .deletion_request
            .private_test_control_execution_requested()
    );
    assert!(
        !fixture
            .deletion_request
            .public_unmount_compatibility_claimed()
    );
    assert!(
        !fixture
            .deletion_request
            .public_ref_or_effect_compatibility_claimed()
    );

    let plan = fixture.deletion_request.host_detachment_plan();
    assert_eq!(plan.root(), root_id);
    assert_eq!(plan.finished_work(), fixture.sync_request.finished_work());
    assert_eq!(plan.deletion_list(), fixture.deletion_list);
    assert_eq!(plan.deleted_root(), fixture.deleted_host);
    assert_eq!(plan.host_parent(), fixture.work_parent);
    assert_eq!(
        plan.host_parent_state_node(),
        fixture.host_parent_state_node
    );
    assert_eq!(plan.host_child(), fixture.deleted_host);
    assert_eq!(
        plan.host_child_state_node(),
        fixture.deleted_host_state_node
    );

    assert_eq!(diagnostic.sync_flush_request(), fixture.sync_request);
    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.order(), fixture.committed.order());
    assert_eq!(
        diagnostic.finished_work(),
        fixture.committed.commit().finished_work()
    );
    assert_eq!(
        diagnostic.deletion_teardown().request(),
        fixture.deletion_request
    );
    assert_eq!(
        diagnostic.deletion_teardown().host_detachment_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert!(diagnostic.ref_cleanup_return_callbacks_invoked());
    assert!(diagnostic.passive_destroy_callbacks_invoked());
    assert!(diagnostic.private_host_subtree_detachment_applied());
    assert!(diagnostic.private_opt_in_sync_flush_teardown_requested());
    assert!(!diagnostic.public_flush_sync_compatibility_claimed());
    assert!(!diagnostic.public_unmount_compatibility_claimed());
    assert!(!diagnostic.public_ref_or_effect_compatibility_claimed());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());

    let ref_passive = diagnostic.deletion_teardown().ref_passive_cleanup();
    assert_eq!(ref_passive.records().len(), 4);
    assert_eq!(ref_passive.ref_cleanup_return_executions().len(), 1);
    assert_eq!(executor.ref_cleanup_calls().len(), 1);
    assert_eq!(executor.destroy_calls().len(), 1);
    let ref_cleanup = ref_passive.ref_cleanup_return_executions()[0];
    assert_eq!(ref_cleanup.fiber(), fixture.deleted_host);
    assert_eq!(ref_cleanup.state_node(), fixture.deleted_host_state_node);
    assert_eq!(ref_cleanup.ref_handle(), fixture.deleted_host_ref);
    assert_eq!(executor.ref_cleanup_calls()[0], ref_cleanup.request());
    assert_eq!(
        executor.destroy_calls()[0].fiber(),
        fixture.deleted_function
    );
    assert_eq!(
        executor.destroy_calls()[0].destroy_callback(),
        fixture.passive_destroy
    );

    let snapshot = diagnostic.deletion_teardown().execution_snapshot();
    assert_eq!(snapshot.len(), 5);
    assert_eq!(snapshot.ref_cleanup_return_gate_count(), 1);
    assert_eq!(snapshot.passive_destroy_execution_count(), 1);
    assert_eq!(snapshot.host_subtree_detachment_count(), 1);
    assert_eq!(snapshot.host_cleanup_apply_count(), 2);
    assert_eq!(
        snapshot
            .records()
            .iter()
            .map(|record| record.phase())
            .collect::<Vec<_>>(),
        vec![
            TestHostRootDeletionRefPassiveCleanupExecutionPhase::RefCleanupReturnGate,
            TestHostRootDeletionRefPassiveCleanupExecutionPhase::PassiveDestroyCallback,
            TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostSubtreeDetach,
            TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostNodeCleanup,
            TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostNodeCleanup,
        ]
    );
    assert_eq!(snapshot.records()[0].fiber(), fixture.deleted_host);
    assert_eq!(snapshot.records()[1].fiber(), fixture.deleted_function);
    assert_eq!(snapshot.records()[2].fiber(), fixture.deleted_host);
    assert_eq!(snapshot.records()[3].fiber(), fixture.deleted_text);
    assert_eq!(snapshot.records()[4].fiber(), fixture.deleted_host);

    assert!(
        !fixture
            .host_work
            .detached_hosts_mut_for_canary()
            .text_metadata(fixture.deleted_text_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        !fixture
            .host_work
            .detached_hosts_mut_for_canary()
            .instance_metadata(fixture.deleted_host_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .is_empty()
    );
    assert_eq!(queued_passive.create(), fixture.passive_create);
    assert_eq!(queued_passive.destroy(), Some(fixture.passive_destroy));
    assert_eq!(queued_passive.dependencies(), fixture.passive_dependencies);

    let mut expected_operations = fixture.operations_before_teardown;
    expected_operations.push("remove_child");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn sync_flush_private_deleted_subtree_teardown_rejects_missing_ref_passive_or_host_cleanup_evidence()
 {
    let mut fixture = sync_flush_host_mutation_fixture("missing deleted teardown evidence");
    schedule_sync_update(&mut fixture.store, fixture.root_id, RootElementHandle::NONE);
    let rendered =
        flush_sync_work_on_all_roots(&mut fixture.store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    delete_test_host_work_root_child_for_canary(
        &mut fixture.store,
        &mut fixture.host_work,
        rendered_record.render_phase(),
    )
    .unwrap();
    let operations_before_request = fixture.host.operations();
    let (committed, _diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut fixture.store,
            rendered_record,
        )
        .unwrap();

    let error = test_host_root_deletion_teardown_execution_request_for_canary(
        committed
            .root_finished_work_commit_handoff_for_canary()
            .unwrap(),
        SYNC_FLUSH_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootDeletionTeardownExecutionErrorForCanary::MissingDeletionTeardownMetadata {
            root,
            finished_work,
        } if root == fixture.root_id && finished_work == committed.commit().finished_work()
    ));
    assert_eq!(committed.commit().deletion_lists().len(), 1);
    assert_eq!(
        committed
            .commit()
            .deletion_cleanup_order_gate_for_canary()
            .ref_cleanup_return_count(),
        0
    );
    assert_eq!(
        committed
            .commit()
            .deletion_cleanup_order_gate_for_canary()
            .passive_destroy_count(),
        0
    );
    assert!(
        committed
            .commit()
            .deletion_cleanup_order_gate_for_canary()
            .host_node_cleanup_count()
            > 0
    );
    assert_eq!(fixture.host.operations(), operations_before_request);
}

#[test]
fn sync_flush_private_deleted_subtree_teardown_rejects_stale_sync_flush_request_and_topology() {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_sync_flush_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 889_200,
    );
    let handoff = fixture
        .committed
        .root_finished_work_commit_handoff_for_canary()
        .unwrap()
        .clone();
    let mut executor = RecordingSyncFlushDeletedSubtreeTeardownExecutor::default();
    let mut stale_record = fixture.committed.clone();
    stale_record.finished_work_handoff_identity = None;
    let operations_before_stale_sync = host.operations();

    let stale_sync_error = execute_sync_flush_deleted_subtree_teardown_for_canary(
        &mut store,
        &mut host,
        &stale_record,
        fixture.diagnostics,
        fixture.sync_request,
        &handoff,
        fixture.deletion_request,
        fixture.deletion_request,
        &mut fixture.host_work,
        &mut executor,
    )
    .unwrap_err();

    assert!(matches!(
        stale_sync_error,
        SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::SyncFlushHostMutation(
            SyncFlushHostMutationExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root,
                order,
            }
        ) if root == root_id && order == fixture.committed.order()
    ));
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), operations_before_stale_sync);

    store
        .root_mut(root_id)
        .unwrap()
        .set_current(fixture.previous_current);
    let stale_topology_error = execute_sync_flush_deleted_subtree_teardown_for_canary(
        &mut store,
        &mut host,
        &fixture.committed,
        fixture.diagnostics,
        fixture.sync_request,
        &handoff,
        fixture.deletion_request,
        fixture.deletion_request,
        &mut fixture.host_work,
        &mut executor,
    )
    .unwrap_err();

    assert!(matches!(
        stale_topology_error,
        SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::SyncFlushHostMutation(
            SyncFlushHostMutationExecutionErrorForCanary::HostWork(
                HostWorkError::CommitCurrentMismatch {
                    root,
                    expected,
                    actual,
                }
            )
        ) if root == root_id
            && expected == fixture.committed.commit().current()
            && actual == fixture.previous_current
    ));
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), operations_before_stale_sync);
}

#[test]
fn sync_flush_private_deleted_subtree_teardown_rejects_cross_root_and_caller_built_deletion_evidence()
 {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_sync_flush_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 889_300,
    );
    let foreign_root = store
        .create_client_root(FakeContainer::new(889), RootOptions::new())
        .unwrap();
    let mut foreign_fixture = prepare_sync_flush_deleted_subtree_teardown_fixture(
        &mut store,
        &mut host,
        foreign_root,
        889_400,
    );
    let foreign_handoff = foreign_fixture
        .committed
        .root_finished_work_commit_handoff_for_canary()
        .unwrap()
        .clone();
    let mut executor = RecordingSyncFlushDeletedSubtreeTeardownExecutor::default();
    let operations_before_cross_root = host.operations();

    let cross_root_error = execute_sync_flush_deleted_subtree_teardown_for_canary(
        &mut store,
        &mut host,
        &fixture.committed,
        fixture.diagnostics,
        fixture.sync_request,
        &foreign_handoff,
        foreign_fixture.deletion_request,
        foreign_fixture.deletion_request,
        &mut fixture.host_work,
        &mut executor,
    )
    .unwrap_err();

    assert!(matches!(
        cross_root_error,
        SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::MismatchedRootOwnership {
            expected_root,
            actual_root,
        } if expected_root == root_id && actual_root == foreign_root
    ));
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), operations_before_cross_root);

    let handoff = fixture
        .committed
        .root_finished_work_commit_handoff_for_canary()
        .unwrap()
        .clone();
    let caller_built_deletion_request = fixture
        .deletion_request
        .with_host_node_cleanup_count_for_canary(0);

    let caller_built_error = execute_sync_flush_deleted_subtree_teardown_for_canary(
        &mut store,
        &mut host,
        &fixture.committed,
        fixture.diagnostics,
        fixture.sync_request,
        &handoff,
        fixture.deletion_request,
        caller_built_deletion_request,
        &mut fixture.host_work,
        &mut executor,
    )
    .unwrap_err();

    assert!(matches!(
        caller_built_error,
        SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::DeletedSubtreeTeardown(
            TestHostRootDeletionTeardownExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root,
                commit_order: _,
                request_order: SYNC_FLUSH_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
            }
        ) if root == root_id
    ));
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), operations_before_cross_root);

    assert!(
        foreign_fixture
            .host_work
            .detached_hosts_mut_for_canary()
            .instance_metadata(foreign_fixture.deleted_host_state_node)
            .unwrap()
            .is_active()
    );
}

#[test]
fn sync_flush_private_deleted_subtree_teardown_rejects_replayed_host_mutation_records_before_host_calls()
 {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_sync_flush_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 889_500,
    );
    let handoff = fixture
        .committed
        .root_finished_work_commit_handoff_for_canary()
        .unwrap()
        .clone();
    let mut executor = RecordingSyncFlushDeletedSubtreeTeardownExecutor::default();

    let diagnostic = execute_sync_flush_deleted_subtree_teardown_for_canary(
        &mut store,
        &mut host,
        &fixture.committed,
        fixture.diagnostics,
        fixture.sync_request,
        &handoff,
        fixture.deletion_request,
        fixture.deletion_request,
        &mut fixture.host_work,
        &mut executor,
    )
    .unwrap();
    assert!(diagnostic.private_host_subtree_detachment_applied());
    assert_eq!(executor.ref_cleanup_calls().len(), 1);
    assert_eq!(executor.destroy_calls().len(), 1);
    let operations_after_first_execute = host.operations();

    let replay_error = execute_sync_flush_deleted_subtree_teardown_for_canary(
        &mut store,
        &mut host,
        &fixture.committed,
        fixture.diagnostics,
        fixture.sync_request,
        &handoff,
        fixture.deletion_request,
        fixture.deletion_request,
        &mut fixture.host_work,
        &mut executor,
    )
    .unwrap_err();

    assert!(matches!(
        replay_error,
        SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::SyncFlushHostMutation(
            SyncFlushHostMutationExecutionErrorForCanary::ReplayedHostMutationExecution {
                root,
                order,
                finished_work,
            }
        ) if root == root_id
            && order == fixture.committed.order()
            && finished_work == fixture.committed.commit().finished_work()
    ));
    assert_eq!(executor.ref_cleanup_calls().len(), 1);
    assert_eq!(executor.destroy_calls().len(), 1);
    assert_eq!(host.operations(), operations_after_first_execute);
}

#[test]
fn sync_flush_private_deleted_subtree_post_passive_continuation_runs_after_ref_passive_and_host_cleanup()
 {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let mut host = RecordingHost::default();
    let root_id = store
        .create_client_root(FakeContainer::new(890), RootOptions::new())
        .unwrap();
    let continuation_root = store
        .create_client_root(FakeContainer::new(891), RootOptions::new())
        .unwrap();
    let mut fixture = prepare_sync_flush_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 890_100,
    );
    let post_passive_handoff = fixture
        .committed
        .commit()
        .pending_passive_handoff()
        .unwrap();
    let deletion_handoff = fixture
        .committed
        .root_finished_work_commit_handoff_for_canary()
        .unwrap()
        .clone();
    let continuation_element = RootElementHandle::from_raw(890_111);
    schedule_sync_update(&mut store, continuation_root, continuation_element);
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut executor = RecordingSyncFlushDeletedSubtreeTeardownExecutor::default();

    let diagnostic =
        execute_sync_flush_deleted_subtree_teardown_and_post_passive_continuation_for_canary(
            &mut store,
            &mut host,
            &fixture.committed,
            fixture.diagnostics,
            fixture.sync_request,
            &deletion_handoff,
            fixture.deletion_request,
            fixture.deletion_request,
            post_passive_handoff,
            continuation_root,
            Lanes::SYNC,
            &mut fixture.host_work,
            &mut executor,
        )
        .unwrap();

    let teardown = diagnostic.deleted_subtree_teardown();
    assert_eq!(teardown.root(), root_id);
    assert_eq!(teardown.sync_flush_request(), fixture.sync_request);
    assert!(teardown.ref_cleanup_return_callbacks_invoked());
    assert!(teardown.passive_destroy_callbacks_invoked());
    assert!(teardown.private_host_subtree_detachment_applied());
    assert!(teardown.private_opt_in_sync_flush_teardown_requested());
    assert!(!teardown.public_flush_sync_compatibility_claimed());
    assert!(!teardown.public_unmount_compatibility_claimed());
    assert!(!teardown.public_ref_or_effect_compatibility_claimed());

    let apply_records = fixture.committed.commit().mutation_apply_log().records();
    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.deletion_list)
    );
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );

    let ref_passive = teardown.deletion_teardown().ref_passive_cleanup();
    assert_eq!(ref_passive.ref_cleanup_return_executions().len(), 1);
    assert_eq!(executor.ref_cleanup_calls().len(), 1);
    assert_eq!(executor.destroy_calls().len(), 1);
    assert_eq!(
        ref_passive.passive_effects().unwrap().records()[0].fiber(),
        fixture.deleted_function
    );
    assert_eq!(
        ref_passive
            .passive_effects()
            .unwrap()
            .destroy_callback_executions()[0]
            .destroy_callback(),
        fixture.passive_destroy
    );

    let snapshot = teardown.deletion_teardown().execution_snapshot();
    let mut observed_order = vec!["deletion-record"];
    observed_order.extend(
        snapshot
            .records()
            .iter()
            .map(|record| match record.phase() {
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::RefCleanupReturnGate => {
                    "ref-cleanup"
                }
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::PassiveDestroyCallback => {
                    "passive-destroy"
                }
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostSubtreeDetach => {
                    "host-detach"
                }
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostNodeCleanup => {
                    "host-cleanup"
                }
            }),
    );
    observed_order.push("post-passive-sync-flush-continuation");
    assert_eq!(
        observed_order,
        vec![
            "deletion-record",
            "ref-cleanup",
            "passive-destroy",
            "host-detach",
            "host-cleanup",
            "host-cleanup",
            "post-passive-sync-flush-continuation",
        ]
    );

    let continuation = diagnostic.post_passive_continuation();
    assert!(continuation.did_request_follow_up_sync_flush());
    assert!(continuation.did_execute_follow_up_sync_flush());
    assert!(continuation.did_flush_follow_up_sync_work());
    assert_eq!(
        continuation.gate().exit_status(),
        RootSyncFlushExitStatus::Completed
    );
    assert_eq!(continuation.gate().pending_passive_root(), root_id);
    assert_eq!(
        continuation.gate().pending_passive_finished_work(),
        fixture.sync_request.finished_work()
    );
    assert_eq!(continuation.gate().pending_passive_lanes(), Lanes::SYNC);
    assert_eq!(continuation.gate().pending_passive_unmount_count(), 1);
    assert_eq!(continuation.gate().pending_passive_mount_count(), 0);
    assert_eq!(continuation.gate().pending_passive_record_count(), 1);
    assert_eq!(continuation.gate().continuation_roots().len(), 1);
    assert_eq!(
        continuation.gate().continuation_roots()[0].root(),
        continuation_root
    );
    assert_eq!(
        continuation.gate().continuation_roots()[0].lanes(),
        Lanes::SYNC
    );

    let sync_flush = continuation.sync_flush_result().unwrap();
    assert!(sync_flush.did_flush_work());
    assert_eq!(sync_flush.records().len(), 1);
    assert_eq!(sync_flush.records()[0].root(), continuation_root);
    assert_eq!(sync_flush.records()[0].render_lanes(), Lanes::SYNC);
    assert_eq!(
        current_host_root_element(&store, continuation_root),
        continuation_element
    );
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .is_empty()
    );
    assert!(
        !fixture
            .host_work
            .detached_hosts_mut_for_canary()
            .text_metadata(fixture.deleted_text_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        !fixture
            .host_work
            .detached_hosts_mut_for_canary()
            .instance_metadata(fixture.deleted_host_state_node)
            .unwrap()
            .is_active()
    );
    let mut expected_operations = fixture.operations_before_teardown;
    expected_operations.push("remove_child");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(host.operations(), expected_operations);
    assert_eq!(
        store.scheduler_bridge().callback_requests().len(),
        callback_request_count
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
}

#[test]
fn sync_flush_private_deleted_subtree_post_passive_continuation_rejects_missing_ref_passive_evidence_before_host_calls()
 {
    let mut fixture =
        sync_flush_host_mutation_fixture("missing deleted post passive continuation evidence");
    schedule_sync_update(&mut fixture.store, fixture.root_id, RootElementHandle::NONE);
    let rendered =
        flush_sync_work_on_all_roots(&mut fixture.store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    delete_test_host_work_root_child_for_canary(
        &mut fixture.store,
        &mut fixture.host_work,
        rendered_record.render_phase(),
    )
    .unwrap();
    let operations_before_request = fixture.host.operations();
    let (committed, _diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut fixture.store,
            rendered_record,
        )
        .unwrap();

    let error = test_host_root_deletion_teardown_execution_request_for_canary(
        committed
            .root_finished_work_commit_handoff_for_canary()
            .unwrap(),
        SYNC_FLUSH_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootDeletionTeardownExecutionErrorForCanary::MissingDeletionTeardownMetadata {
            root,
            finished_work,
        } if root == fixture.root_id && finished_work == committed.commit().finished_work()
    ));
    assert_eq!(fixture.host.operations(), operations_before_request);
}

#[test]
fn sync_flush_private_deleted_subtree_post_passive_continuation_rejects_stale_continuation_and_cross_root_deletion_evidence()
 {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let mut host = RecordingHost::default();
    let root_id = store
        .create_client_root(FakeContainer::new(892), RootOptions::new())
        .unwrap();
    let foreign_root = store
        .create_client_root(FakeContainer::new(893), RootOptions::new())
        .unwrap();
    let continuation_root = store
        .create_client_root(FakeContainer::new(894), RootOptions::new())
        .unwrap();
    let mut fixture = prepare_sync_flush_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 890_200,
    );
    let mut foreign_fixture = prepare_sync_flush_deleted_subtree_teardown_fixture(
        &mut store,
        &mut host,
        foreign_root,
        890_300,
    );
    let source_post_passive_handoff = fixture
        .committed
        .commit()
        .pending_passive_handoff()
        .unwrap();
    let foreign_post_passive_handoff = foreign_fixture
        .committed
        .commit()
        .pending_passive_handoff()
        .unwrap();
    let source_deletion_handoff = fixture
        .committed
        .root_finished_work_commit_handoff_for_canary()
        .unwrap()
        .clone();
    let foreign_deletion_handoff = foreign_fixture
        .committed
        .root_finished_work_commit_handoff_for_canary()
        .unwrap()
        .clone();
    schedule_sync_update(
        &mut store,
        continuation_root,
        RootElementHandle::from_raw(890_301),
    );
    let operations_before_rejections = host.operations();
    let mut executor = RecordingSyncFlushDeletedSubtreeTeardownExecutor::default();

    let stale_continuation_error =
        execute_sync_flush_deleted_subtree_teardown_and_post_passive_continuation_for_canary(
            &mut store,
            &mut host,
            &fixture.committed,
            fixture.diagnostics,
            fixture.sync_request,
            &source_deletion_handoff,
            fixture.deletion_request,
            fixture.deletion_request,
            foreign_post_passive_handoff,
            continuation_root,
            Lanes::SYNC,
            &mut fixture.host_work,
            &mut executor,
        )
        .unwrap_err();

    assert!(matches!(
        stale_continuation_error,
        SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::StalePostPassiveContinuationEvidence {
            expected_root,
            actual_root,
            expected_lanes: Lanes::SYNC,
            actual_lanes: Lanes::SYNC,
            ..
        } if expected_root == root_id && actual_root == foreign_root
    ));
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), operations_before_rejections);

    let cross_root_deletion_error =
        execute_sync_flush_deleted_subtree_teardown_and_post_passive_continuation_for_canary(
            &mut store,
            &mut host,
            &fixture.committed,
            fixture.diagnostics,
            fixture.sync_request,
            &foreign_deletion_handoff,
            foreign_fixture.deletion_request,
            foreign_fixture.deletion_request,
            source_post_passive_handoff,
            continuation_root,
            Lanes::SYNC,
            &mut fixture.host_work,
            &mut executor,
        )
        .unwrap_err();

    assert!(matches!(
        cross_root_deletion_error,
        SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::DeletedSubtreeTeardown(
            SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root,
                actual_root,
            }
        ) if expected_root == root_id && actual_root == foreign_root
    ));
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), operations_before_rejections);
    assert!(
        fixture
            .host_work
            .detached_hosts_mut_for_canary()
            .instance_metadata(fixture.deleted_host_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        foreign_fixture
            .host_work
            .detached_hosts_mut_for_canary()
            .instance_metadata(foreign_fixture.deleted_host_state_node)
            .unwrap()
            .is_active()
    );
}

#[test]
fn sync_flush_private_deleted_subtree_post_passive_continuation_rejects_stale_topology_and_caller_built_request()
 {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let mut host = RecordingHost::default();
    let root_id = store
        .create_client_root(FakeContainer::new(895), RootOptions::new())
        .unwrap();
    let continuation_root = store
        .create_client_root(FakeContainer::new(896), RootOptions::new())
        .unwrap();
    let mut fixture = prepare_sync_flush_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 890_400,
    );
    let post_passive_handoff = fixture
        .committed
        .commit()
        .pending_passive_handoff()
        .unwrap();
    let deletion_handoff = fixture
        .committed
        .root_finished_work_commit_handoff_for_canary()
        .unwrap()
        .clone();
    schedule_sync_update(
        &mut store,
        continuation_root,
        RootElementHandle::from_raw(890_401),
    );
    store
        .root_mut(root_id)
        .unwrap()
        .set_current(fixture.previous_current);
    let operations_before_topology_error = host.operations();
    let mut executor = RecordingSyncFlushDeletedSubtreeTeardownExecutor::default();

    let stale_topology_error =
        execute_sync_flush_deleted_subtree_teardown_and_post_passive_continuation_for_canary(
            &mut store,
            &mut host,
            &fixture.committed,
            fixture.diagnostics,
            fixture.sync_request,
            &deletion_handoff,
            fixture.deletion_request,
            fixture.deletion_request,
            post_passive_handoff,
            continuation_root,
            Lanes::SYNC,
            &mut fixture.host_work,
            &mut executor,
        )
        .unwrap_err();

    assert!(matches!(
        stale_topology_error,
        SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::DeletedSubtreeTeardown(
            SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::SyncFlushHostMutation(
                SyncFlushHostMutationExecutionErrorForCanary::HostWork(
                    HostWorkError::CommitCurrentMismatch {
                        root,
                        expected,
                        actual,
                    }
                )
            )
        ) if root == root_id
            && expected == fixture.committed.commit().current()
            && actual == fixture.previous_current
    ));
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), operations_before_topology_error);

    let mut store = FiberRootStore::<RecordingHost>::new();
    let mut host = RecordingHost::default();
    let root_id = store
        .create_client_root(FakeContainer::new(897), RootOptions::new())
        .unwrap();
    let continuation_root = store
        .create_client_root(FakeContainer::new(898), RootOptions::new())
        .unwrap();
    let mut fixture = prepare_sync_flush_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 890_500,
    );
    let post_passive_handoff = fixture
        .committed
        .commit()
        .pending_passive_handoff()
        .unwrap();
    let deletion_handoff = fixture
        .committed
        .root_finished_work_commit_handoff_for_canary()
        .unwrap()
        .clone();
    schedule_sync_update(
        &mut store,
        continuation_root,
        RootElementHandle::from_raw(890_501),
    );
    let caller_built_deletion_request = fixture
        .deletion_request
        .with_host_node_cleanup_count_for_canary(0);
    let operations_before_caller_error = host.operations();
    let mut executor = RecordingSyncFlushDeletedSubtreeTeardownExecutor::default();

    let caller_built_error =
        execute_sync_flush_deleted_subtree_teardown_and_post_passive_continuation_for_canary(
            &mut store,
            &mut host,
            &fixture.committed,
            fixture.diagnostics,
            fixture.sync_request,
            &deletion_handoff,
            fixture.deletion_request,
            caller_built_deletion_request,
            post_passive_handoff,
            continuation_root,
            Lanes::SYNC,
            &mut fixture.host_work,
            &mut executor,
        )
        .unwrap_err();

    assert!(matches!(
        caller_built_error,
        SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::DeletedSubtreeTeardown(
            SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::DeletedSubtreeTeardown(
                TestHostRootDeletionTeardownExecutionErrorForCanary::StaleFinishedWorkEvidence {
                    root,
                    request_order: SYNC_FLUSH_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
                    ..
                }
            )
        ) if root == root_id
    ));
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), operations_before_caller_error);
}

#[test]
fn sync_flush_private_deleted_subtree_post_passive_continuation_rejects_replay_before_second_host_calls()
 {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let mut host = RecordingHost::default();
    let root_id = store
        .create_client_root(FakeContainer::new(899), RootOptions::new())
        .unwrap();
    let continuation_root = store
        .create_client_root(FakeContainer::new(900), RootOptions::new())
        .unwrap();
    let mut fixture = prepare_sync_flush_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 890_600,
    );
    let post_passive_handoff = fixture
        .committed
        .commit()
        .pending_passive_handoff()
        .unwrap();
    let deletion_handoff = fixture
        .committed
        .root_finished_work_commit_handoff_for_canary()
        .unwrap()
        .clone();
    let continuation_element = RootElementHandle::from_raw(890_601);
    schedule_sync_update(&mut store, continuation_root, continuation_element);
    let mut executor = RecordingSyncFlushDeletedSubtreeTeardownExecutor::default();
    let first =
        execute_sync_flush_deleted_subtree_teardown_and_post_passive_continuation_for_canary(
            &mut store,
            &mut host,
            &fixture.committed,
            fixture.diagnostics,
            fixture.sync_request,
            &deletion_handoff,
            fixture.deletion_request,
            fixture.deletion_request,
            post_passive_handoff,
            continuation_root,
            Lanes::SYNC,
            &mut fixture.host_work,
            &mut executor,
        )
        .unwrap();
    assert!(
        first
            .deleted_subtree_teardown()
            .private_host_subtree_detachment_applied()
    );
    assert!(
        first
            .post_passive_continuation()
            .did_flush_follow_up_sync_work()
    );
    assert_eq!(executor.ref_cleanup_calls().len(), 1);
    assert_eq!(executor.destroy_calls().len(), 1);
    assert_eq!(
        current_host_root_element(&store, continuation_root),
        continuation_element
    );
    let operations_after_first_execute = host.operations();

    let replay_error =
        execute_sync_flush_deleted_subtree_teardown_and_post_passive_continuation_for_canary(
            &mut store,
            &mut host,
            &fixture.committed,
            fixture.diagnostics,
            fixture.sync_request,
            &deletion_handoff,
            fixture.deletion_request,
            fixture.deletion_request,
            post_passive_handoff,
            continuation_root,
            Lanes::SYNC,
            &mut fixture.host_work,
            &mut executor,
        )
        .unwrap_err();

    assert!(matches!(
        replay_error,
        SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::DeletedSubtreeTeardown(
            SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::SyncFlushHostMutation(
                SyncFlushHostMutationExecutionErrorForCanary::ReplayedHostMutationExecution {
                    root,
                    order,
                    finished_work,
                }
            )
        ) if root == root_id
            && order == fixture.committed.order()
            && finished_work == fixture.committed.commit().finished_work()
    ));
    assert_eq!(executor.ref_cleanup_calls().len(), 1);
    assert_eq!(executor.destroy_calls().len(), 1);
    assert_eq!(host.operations(), operations_after_first_execute);
}

#[test]
fn sync_flush_private_host_mutation_execution_rejects_stale_finished_work_evidence() {
    let mut fixture = sync_flush_host_mutation_fixture("stale sync flush host mutation");
    let mut stale_record = fixture.committed.clone();
    stale_record.finished_work_handoff_identity = None;

    let error =
        sync_flush_host_mutation_execution_request_for_canary(&stale_record, fixture.diagnostics)
            .unwrap_err();

    assert!(matches!(
        error,
        SyncFlushHostMutationExecutionErrorForCanary::StaleFinishedWorkEvidence {
            root,
            order,
        } if root == fixture.root_id && order == fixture.committed.order()
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_opt_in);

    let request = sync_flush_host_mutation_execution_request_for_canary(
        &fixture.committed,
        fixture.diagnostics,
    )
    .unwrap();
    let mut stale_execution_record = fixture.committed.clone();
    stale_execution_record.finished_work_handoff_identity = None;

    let error = execute_sync_flush_host_mutations_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &stale_execution_record,
        fixture.diagnostics,
        request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        SyncFlushHostMutationExecutionErrorForCanary::StaleFinishedWorkEvidence {
            root,
            order,
        } if root == fixture.root_id && order == fixture.committed.order()
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_opt_in);

    let previous_current = fixture.committed.commit().previous_current();
    fixture
        .store
        .root_mut(fixture.root_id)
        .unwrap()
        .set_current(previous_current);

    let error = execute_sync_flush_host_mutations_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.committed,
        fixture.diagnostics,
        request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        SyncFlushHostMutationExecutionErrorForCanary::HostWork(
            HostWorkError::CommitCurrentMismatch {
                root,
                expected,
                actual,
            }
        ) if root == fixture.root_id
            && expected == fixture.committed.commit().current()
            && actual == previous_current
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_opt_in);
}

#[test]
fn sync_flush_private_host_mutation_execution_rejects_root_and_lane_tampering() {
    let mut fixture = sync_flush_host_mutation_fixture("tampered sync flush host mutation");
    let foreign_root = fixture
        .store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let mut foreign_root_record = fixture.committed.clone();
    foreign_root_record.root = foreign_root;

    let error = sync_flush_host_mutation_execution_request_for_canary(
        &foreign_root_record,
        fixture.diagnostics,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        SyncFlushHostMutationExecutionErrorForCanary::MismatchedRootOwnership {
            expected_root,
            actual_root,
        } if expected_root == foreign_root && actual_root == fixture.root_id
    ));

    let mut missing_lanes_record = fixture.committed.clone();
    missing_lanes_record.render_lanes = Lanes::NO;

    let error = sync_flush_host_mutation_execution_request_for_canary(
        &missing_lanes_record,
        fixture.diagnostics,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        SyncFlushHostMutationExecutionErrorForCanary::MismatchedSyncFlushLanes {
            root,
            expected_render_lanes,
            actual_render_lanes,
            expected_finished_lanes,
            actual_finished_lanes,
        } if root == fixture.root_id
            && expected_render_lanes == Lanes::NO
            && actual_render_lanes == Lanes::SYNC
            && expected_finished_lanes == Lanes::SYNC
            && actual_finished_lanes == Lanes::SYNC
    ));

    let mut caller_built_lane_diagnostics = fixture.diagnostics;
    caller_built_lane_diagnostics.remaining_lanes = Lanes::DEFAULT;
    caller_built_lane_diagnostics.commit_pending_lanes = Lanes::DEFAULT;
    caller_built_lane_diagnostics.root_pending_lanes_after_commit = Lanes::DEFAULT;

    let error = sync_flush_host_mutation_execution_request_for_canary(
        &fixture.committed,
        caller_built_lane_diagnostics,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        SyncFlushHostMutationExecutionErrorForCanary::MismatchedSyncFlushLanes {
            root,
            expected_render_lanes,
            actual_render_lanes,
            expected_finished_lanes,
            actual_finished_lanes,
        } if root == fixture.root_id
            && expected_render_lanes == Lanes::SYNC
            && actual_render_lanes == Lanes::SYNC
            && expected_finished_lanes == Lanes::SYNC
            && actual_finished_lanes == Lanes::SYNC
    ));

    let request = sync_flush_host_mutation_execution_request_for_canary(
        &fixture.committed,
        fixture.diagnostics,
    )
    .unwrap();
    let mut foreign_source = TestHostTree::new();
    let foreign_element =
        foreign_source.insert_host_element_with_text("article", "foreign host work");
    schedule_sync_update(&mut fixture.store, foreign_root, foreign_element);
    let foreign_rendered =
        flush_sync_work_on_all_roots(&mut fixture.store, &ExecutionContextState::new()).unwrap();
    let mut foreign_host = RecordingHost::default();
    let mut foreign_host_work = mount_test_host_work(
        &mut fixture.store,
        &mut foreign_host,
        foreign_rendered.records()[0].render_phase(),
        &foreign_source,
    )
    .unwrap();
    let error = execute_sync_flush_host_mutations_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.committed,
        fixture.diagnostics,
        request,
        &mut foreign_host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        SyncFlushHostMutationExecutionErrorForCanary::MismatchedRootOwnership {
            expected_root,
            actual_root,
        } if expected_root == fixture.root_id && actual_root == foreign_root
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_opt_in);
}

#[test]
fn sync_flush_private_host_mutation_execution_requires_host_mutation_metadata() {
    let (mut store, root_id, host) = root_store();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(806));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let (committed, diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();

    assert!(committed.accepted_finished_work_handoff_for_canary());
    assert!(diagnostics.accepted_finished_work_handoff());
    assert_eq!(diagnostics.mutation_record_count(), 0);
    assert_eq!(diagnostics.mutation_apply_record_count(), 0);

    let error =
        sync_flush_host_mutation_execution_request_for_canary(&committed, diagnostics).unwrap_err();

    assert!(matches!(
        error,
        SyncFlushHostMutationExecutionErrorForCanary::MissingHostMutationMetadata {
            root,
            finished_work,
        } if root == root_id && finished_work == committed.commit().finished_work()
    ));
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
