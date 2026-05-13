use super::*;

#[test]
fn root_work_loop_managed_child_placement_handoff_executes_private_append_child_after_commit() {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_root_work_loop_managed_child_append_execution_fixture(
        &mut store, &mut host, root_id, 82_800,
    );

    let handoff = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_COMMIT_ORDER,
        ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_REQUEST_ORDER,
    )
    .unwrap();
    let diagnostic = apply_managed_child_complete_work_handoff_for_canary(
        &mut store,
        &mut host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(fixture.previous_current, fixture.render.current());
    assert_eq!(fixture.complete_work.root(), root_id);
    assert_eq!(
        fixture.complete_work.parent_current(),
        fixture.current_parent
    );
    assert_eq!(
        fixture.complete_work.parent_work_in_progress(),
        fixture.work_parent
    );
    assert_eq!(
        fixture.complete_work.parent_state_node(),
        fixture.parent_state_node
    );
    assert_eq!(fixture.complete_work.child(), fixture.child);
    assert_eq!(
        fixture.complete_work.child_state_node(),
        fixture.child_state_node
    );
    assert_eq!(
        fixture.complete_work.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(fixture.complete_work.child_alternate(), None);
    assert_eq!(fixture.complete_work.child_flags(), FiberFlags::PLACEMENT);
    assert!(fixture.complete_work.private_reconciler_handoff_only());
    assert!(!fixture.complete_work.public_dom_compatibility_claimed());
    assert!(!fixture.complete_work.test_renderer_compatibility_claimed());
    assert!(
        !fixture
            .complete_work
            .broad_reconciliation_traversal_claimed()
    );

    assert_eq!(
        handoff.mutation().source(),
        HostRootMutationApplyRecordSource::MutationPhase(
            HostRootMutationPhaseRecordKind::Placement
        )
    );
    assert_eq!(
        handoff.mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent
    );
    assert_eq!(handoff.mutation().parent(), fixture.work_parent);
    assert_eq!(
        handoff.mutation().parent_state_node(),
        fixture.parent_state_node
    );
    assert_eq!(handoff.mutation().fiber(), fixture.child);
    assert_eq!(handoff.mutation().state_node(), fixture.child_state_node);
    let placement_sibling = handoff.mutation().placement_sibling().unwrap();
    assert_eq!(
        placement_sibling.status(),
        HostRootPlacementSiblingStatus::Append
    );
    assert_eq!(placement_sibling.sibling(), None);
    assert_eq!(placement_sibling.sibling_tag(), None);
    assert_eq!(
        placement_sibling.sibling_state_node(),
        StateNodeHandle::NONE
    );
    assert_eq!(placement_sibling.skipped_pending_sibling_count(), 0);
    assert_root_work_loop_managed_child_append_host_execution(
        &store,
        &host,
        root_id,
        &fixture,
        &handoff,
        &diagnostic,
    );
}

#[test]
fn root_work_loop_managed_child_sibling_order_placement_executes_private_insert_before() {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture =
        prepare_root_work_loop_managed_child_placement_sibling_order_execution_fixture(
            &mut store, &mut host, root_id, 82_900,
        );

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_COMMIT_ORDER,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_REQUEST_ORDER,
    )
    .unwrap();
    let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        &mut host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(handoff.order_evidence_name(), "next-sibling");
    assert_eq!(
        handoff.mutation().source(),
        HostRootMutationApplyRecordSource::MutationPhase(
            HostRootMutationPhaseRecordKind::Placement
        )
    );
    assert_eq!(
        handoff.mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    );
    let placement_sibling = handoff.mutation().placement_sibling().unwrap();
    assert_eq!(
        placement_sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(placement_sibling.sibling(), Some(fixture.order_sibling));
    assert_eq!(
        placement_sibling.sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert!(placement_sibling.can_insert_before());
    assert_root_work_loop_managed_child_sibling_order_host_execution(
        &store,
        &host,
        root_id,
        &fixture,
        &handoff,
        &diagnostic,
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::InsertBefore),
        "insert_before",
        0,
        fixture.token_count_before_apply,
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
}

#[test]
fn root_work_loop_managed_child_sibling_order_delete_executes_private_remove_after_commit() {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_root_work_loop_managed_child_delete_sibling_order_execution_fixture(
        &mut store, &mut host, root_id, 83_000,
    );
    let deletion_list = fixture.deletion_list.unwrap();

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_COMMIT_ORDER,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_REQUEST_ORDER,
    )
    .unwrap();
    let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        &mut host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(handoff.order_evidence_name(), "previous-sibling");
    assert_eq!(
        handoff.mutation().source(),
        HostRootMutationApplyRecordSource::DeletionList(deletion_list)
    );
    assert_eq!(
        handoff.mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(handoff.mutation().placement_sibling(), None);
    assert_eq!(handoff.commit().deletion_lists().len(), 1);
    assert_eq!(handoff.commit().deletion_lists()[0].list(), deletion_list);
    assert_eq!(
        handoff.commit().deletion_lists()[0].deleted(),
        &[fixture.child]
    );
    assert_root_work_loop_managed_child_sibling_order_host_execution(
        &store,
        &host,
        root_id,
        &fixture,
        &handoff,
        &diagnostic,
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild),
        "remove_child",
        1,
        fixture.token_count_before_apply + 1,
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
    assert_eq!(
        diagnostic.cleanup_status(),
        Some(
            crate::host_work::TestHostRootDeletionCleanupStatus::Applied(
                crate::host_work::TestHostRootDeletionCleanupAction::DetachDeletedInstance
            )
        )
    );
}

#[test]
fn root_work_loop_managed_child_host_text_placement_executes_private_host_work_append() {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_root_work_loop_managed_child_text_append_execution_fixture(
        &mut store, &mut host, root_id, 83_100,
    );

    let handoff = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_COMMIT_ORDER,
        ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_REQUEST_ORDER,
    )
    .unwrap();
    let diagnostic = apply_managed_child_complete_work_handoff_for_canary(
        &mut store,
        &mut host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(fixture.complete_work.child_tag(), FiberTag::HostText);
    assert_eq!(handoff.mutation().tag(), FiberTag::HostText);
    assert_eq!(
        handoff.mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent
    );
    assert_eq!(
        handoff.mutation().placement_sibling().unwrap().status(),
        HostRootPlacementSiblingStatus::Append
    );
    assert_eq!(
        diagnostic.mutation_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
    );
    assert_eq!(diagnostic.cleanup_status(), None);
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(
        fixture
            .detached_hosts
            .text_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(store.host_tokens().len(), fixture.token_count_before_apply);
    let mut expected_operations = fixture.operations_before_apply.clone();
    expected_operations.push("append_child");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn root_work_loop_managed_child_host_text_sibling_order_executes_private_host_work_insert_before() {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture =
        prepare_root_work_loop_managed_child_text_placement_sibling_order_execution_fixture(
            &mut store, &mut host, root_id, 83_200,
        );

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_COMMIT_ORDER,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_REQUEST_ORDER,
    )
    .unwrap();
    let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        &mut host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(fixture.complete_work.child_tag(), FiberTag::HostText);
    assert_eq!(
        fixture.complete_work.order_sibling_tag(),
        FiberTag::HostText
    );
    assert_eq!(handoff.mutation().tag(), FiberTag::HostText);
    let placement_sibling = handoff.mutation().placement_sibling().unwrap();
    assert_eq!(
        handoff.mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    );
    assert_eq!(
        placement_sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(placement_sibling.sibling(), Some(fixture.order_sibling));
    assert_eq!(placement_sibling.sibling_tag(), Some(FiberTag::HostText));
    assert!(placement_sibling.can_insert_before());
    assert_eq!(
        diagnostic.mutation_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::InsertBefore)
    );
    assert_eq!(diagnostic.cleanup_status(), None);
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(
        fixture
            .detached_hosts
            .text_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .detached_hosts
            .text_metadata(fixture.order_sibling_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(store.host_tokens().len(), fixture.token_count_before_apply);
    let mut expected_operations = fixture.operations_before_apply.clone();
    expected_operations.push("insert_before");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn root_work_loop_managed_child_host_text_sibling_order_delete_executes_private_host_work_remove() {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture =
        prepare_root_work_loop_managed_child_text_delete_sibling_order_execution_fixture(
            &mut store, &mut host, root_id, 83_300,
        );
    let deletion_list = fixture.deletion_list.unwrap();

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_COMMIT_ORDER,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_REQUEST_ORDER,
    )
    .unwrap();
    let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        &mut host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(fixture.complete_work.child_tag(), FiberTag::HostText);
    assert_eq!(
        fixture.complete_work.order_sibling_tag(),
        FiberTag::HostText
    );
    assert_eq!(handoff.mutation().tag(), FiberTag::HostText);
    assert_eq!(
        handoff.mutation().source(),
        HostRootMutationApplyRecordSource::DeletionList(deletion_list)
    );
    assert_eq!(
        handoff.mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(handoff.mutation().placement_sibling(), None);
    assert_eq!(
        diagnostic.mutation_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert_eq!(
        diagnostic.cleanup_status(),
        Some(
            crate::host_work::TestHostRootDeletionCleanupStatus::Applied(
                crate::host_work::TestHostRootDeletionCleanupAction::InvalidateDeletedText
            )
        )
    );
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(
        !fixture
            .detached_hosts
            .text_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .detached_hosts
            .text_metadata(fixture.order_sibling_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        store.host_tokens().len(),
        fixture.token_count_before_apply + 1
    );
    let mut expected_operations = fixture.operations_before_apply.clone();
    expected_operations.push("remove_child");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn root_work_loop_deleted_subtree_teardown_executes_ref_passive_host_detach_and_cleanup_in_order() {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_root_work_loop_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 86_700,
    );
    let queued_passive = fixture.deleted_passive_handoff.records()[0];

    let mut handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        fixture.delete_render,
        Some(fixture.pending),
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER,
    )
    .unwrap();
    handoff
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[fixture
            .deleted_passive_handoff
            .clone()])
        .unwrap();
    let source_request = test_host_root_deletion_teardown_execution_request_for_canary(
        &handoff,
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap();
    let mut executor = RecordingDeletedSubtreeTeardownExecutor::default();

    let diagnostic = execute_test_host_root_deletion_teardown_after_commit_for_canary(
        &mut store,
        &mut host,
        &handoff,
        source_request,
        source_request,
        &mut fixture.detached_hosts,
        &mut executor,
    )
    .unwrap();

    assert_eq!(
        fixture.previous_current,
        handoff.commit().previous_current()
    );
    assert_eq!(fixture.pending.root(), root_id);
    assert_eq!(
        fixture.pending.handoff_order(),
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_SOURCE_ORDER
    );
    assert_eq!(source_request.root(), root_id);
    assert_eq!(
        source_request.source_handoff_order(),
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_SOURCE_ORDER
    );
    assert_eq!(
        source_request.commit_order(),
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER
    );
    assert_eq!(
        source_request.request_order(),
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER
    );
    assert_eq!(source_request.previous_current(), fixture.previous_current);
    assert_eq!(
        source_request.finished_work(),
        fixture.delete_render.finished_work()
    );
    assert_eq!(
        source_request.committed_current(),
        fixture.delete_render.finished_work()
    );
    assert_eq!(source_request.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(source_request.remaining_lanes(), Lanes::NO);
    assert_eq!(source_request.pending_lanes(), Lanes::NO);
    assert_eq!(source_request.deletion_list_count(), 1);
    assert_eq!(source_request.deleted_root_count(), 1);
    assert_eq!(source_request.ref_cleanup_return_count(), 1);
    assert_eq!(source_request.passive_destroy_count(), 1);
    assert_eq!(source_request.host_node_cleanup_count(), 2);
    assert!(source_request.private_test_control_execution_requested());
    assert!(!source_request.public_unmount_compatibility_claimed());
    assert!(!source_request.public_ref_or_effect_compatibility_claimed());

    let plan = source_request.host_detachment_plan();
    assert_eq!(plan.root(), root_id);
    assert_eq!(plan.finished_work(), fixture.delete_render.finished_work());
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
    assert_eq!(plan.cleanup_sequence(), 1);
    assert_eq!(plan.cleanup_order_sequence(), 3);
    assert!(!plan.public_unmount_compatibility_claimed());
    assert!(!plan.broad_host_teardown_enabled());

    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(
        diagnostic.finished_work(),
        fixture.delete_render.finished_work()
    );
    assert_eq!(diagnostic.request(), source_request);
    assert_eq!(
        diagnostic.host_detachment_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert!(diagnostic.ref_cleanup_return_callbacks_invoked());
    assert!(diagnostic.passive_destroy_callbacks_invoked());
    assert!(diagnostic.private_host_subtree_detachment_applied());
    assert!(!diagnostic.public_unmount_compatibility_claimed());
    assert!(!diagnostic.public_ref_or_effect_compatibility_claimed());

    let ref_passive = diagnostic.ref_passive_cleanup();
    assert_eq!(ref_passive.root(), root_id);
    assert_eq!(
        ref_passive.finished_work(),
        fixture.delete_render.finished_work()
    );
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

    let snapshot = diagnostic.execution_snapshot();
    assert_eq!(snapshot.len(), 5);
    assert_eq!(snapshot.ref_cleanup_return_gate_count(), 1);
    assert_eq!(snapshot.passive_destroy_execution_count(), 1);
    assert_eq!(snapshot.host_subtree_detachment_count(), 1);
    assert_eq!(snapshot.host_cleanup_apply_count(), 2);
    assert!(snapshot.private_passive_destroy_callbacks_invoked());
    assert!(snapshot.private_host_subtree_detachment_applied());
    assert!(!snapshot.public_unmount_compatibility_claimed());
    assert!(!snapshot.public_ref_or_effect_compatibility_claimed());
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
    assert_eq!(snapshot.records()[0].deleted_root(), fixture.deleted_host);
    assert_eq!(snapshot.records()[0].ref_cleanup_return_sequence(), Some(0));
    assert_eq!(snapshot.records()[1].fiber(), fixture.deleted_function);
    assert_eq!(
        snapshot.records()[1].passive_destroy_execution_order(),
        Some(0)
    );
    assert_eq!(snapshot.records()[2].fiber(), fixture.deleted_host);
    assert_eq!(
        snapshot.records()[2].host_detachment_cleanup_order_sequence(),
        Some(3)
    );
    assert_eq!(snapshot.records()[3].fiber(), fixture.deleted_text);
    assert_eq!(snapshot.records()[3].host_cleanup_sequence(), Some(0));
    assert_eq!(snapshot.records()[4].fiber(), fixture.deleted_host);
    assert_eq!(snapshot.records()[4].host_cleanup_sequence(), Some(1));

    assert!(
        !fixture
            .detached_hosts
            .text_metadata(fixture.deleted_text_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        !fixture
            .detached_hosts
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
fn root_work_loop_deleted_subtree_teardown_rejects_missing_ref_and_passive_evidence_before_host_calls()
 {
    let (mut store, root_id, mut host) = root_store();
    let fixture = prepare_root_work_loop_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 86_750,
    );
    store
        .fiber_arena_mut()
        .get_mut(fixture.deleted_host)
        .unwrap()
        .set_ref_handle(RefHandle::NONE);

    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        fixture.delete_render,
        Some(fixture.pending),
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER,
    )
    .unwrap();
    let order_gate = handoff.commit().deletion_cleanup_order_gate_for_canary();
    let executor = RecordingDeletedSubtreeTeardownExecutor::default();

    let error = test_host_root_deletion_teardown_execution_request_for_canary(
        &handoff,
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootDeletionTeardownExecutionErrorForCanary::MissingDeletionTeardownMetadata {
            root,
            finished_work,
        } if root == root_id && finished_work == fixture.delete_render.finished_work()
    ));
    assert_eq!(handoff.commit().deletion_lists().len(), 1);
    assert_eq!(
        handoff.commit().deletion_lists()[0].deleted(),
        &[fixture.deleted_host]
    );
    assert_eq!(
        handoff
            .commit()
            .host_node_deletion_cleanup_log()
            .records()
            .len(),
        2
    );
    assert_eq!(order_gate.ref_cleanup_return_count(), 0);
    assert_eq!(order_gate.passive_destroy_count(), 0);
    assert_eq!(order_gate.host_node_cleanup_count(), 2);
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), fixture.operations_before_teardown);
    assert!(
        fixture
            .detached_hosts
            .text_metadata(fixture.deleted_text_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.deleted_host_state_node)
            .unwrap()
            .is_active()
    );
}

#[test]
fn root_work_loop_deleted_subtree_teardown_rejects_cross_root_source_evidence() {
    let (mut store, root_id, mut host) = root_store();
    let foreign_root = store
        .create_client_root(FakeContainer::new(867), RootOptions::new())
        .unwrap();
    let fixture = prepare_root_work_loop_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 86_800,
    );
    let mut foreign_fixture = prepare_root_work_loop_deleted_subtree_teardown_fixture(
        &mut store,
        &mut host,
        foreign_root,
        86_900,
    );
    let mut handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        fixture.delete_render,
        Some(fixture.pending),
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER,
    )
    .unwrap();
    handoff
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[fixture
            .deleted_passive_handoff
            .clone()])
        .unwrap();
    let source_request = test_host_root_deletion_teardown_execution_request_for_canary(
        &handoff,
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap();
    let mut foreign_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        foreign_fixture.delete_render,
        Some(foreign_fixture.pending),
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER + 10,
    )
    .unwrap();
    foreign_handoff
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[foreign_fixture
            .deleted_passive_handoff
            .clone()])
        .unwrap();
    let mut executor = RecordingDeletedSubtreeTeardownExecutor::default();

    let error = execute_test_host_root_deletion_teardown_after_commit_for_canary(
        &mut store,
        &mut host,
        &foreign_handoff,
        source_request,
        source_request,
        &mut foreign_fixture.detached_hosts,
        &mut executor,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootDeletionTeardownExecutionErrorForCanary::MismatchedRootOwnership {
            expected_root,
            actual_root,
        } if expected_root == root_id && actual_root == foreign_root
    ));
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(
        host.operations(),
        foreign_fixture.operations_before_teardown
    );
}

#[test]
fn root_work_loop_deleted_subtree_teardown_rejects_caller_built_stale_evidence() {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_root_work_loop_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 87_000,
    );
    let mut handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        fixture.delete_render,
        Some(fixture.pending),
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER,
    )
    .unwrap();
    handoff
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[fixture
            .deleted_passive_handoff
            .clone()])
        .unwrap();
    let source_request = test_host_root_deletion_teardown_execution_request_for_canary(
        &handoff,
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap();
    let caller_built_request = source_request.with_host_node_cleanup_count_for_canary(0);
    let mut executor = RecordingDeletedSubtreeTeardownExecutor::default();

    let error = execute_test_host_root_deletion_teardown_after_commit_for_canary(
        &mut store,
        &mut host,
        &handoff,
        source_request,
        caller_built_request,
        &mut fixture.detached_hosts,
        &mut executor,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootDeletionTeardownExecutionErrorForCanary::StaleFinishedWorkEvidence {
            root,
            commit_order: ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER,
            request_order: ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
        } if root == root_id
    ));
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), fixture.operations_before_teardown);
}

#[test]
fn root_work_loop_function_component_deleted_subtree_teardown_executes_source_owned_child_in_order()
{
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_root_work_loop_function_component_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 87_900,
    );
    let queued_passive = fixture.deleted_passive_handoff.records()[0];

    let mut handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        fixture.delete_render,
        Some(fixture.pending),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_COMMIT_ORDER,
    )
    .unwrap();
    handoff
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[fixture
            .deleted_passive_handoff
            .clone()])
        .unwrap();
    let source_request = test_host_root_deletion_teardown_execution_request_for_canary(
        &handoff,
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap();
    let mut executor = RecordingDeletedSubtreeTeardownExecutor::default();

    let diagnostic = execute_function_component_deleted_subtree_teardown_for_canary(
        &mut store,
        &mut host,
        &handoff,
        source_request,
        source_request,
        &mut fixture,
        &mut executor,
    )
    .unwrap();

    assert_eq!(
        fixture.previous_current,
        handoff.commit().previous_current()
    );
    assert_eq!(fixture.pending.root(), root_id);
    assert_eq!(
        fixture.pending.handoff_order(),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_SOURCE_ORDER
    );
    assert_eq!(
        fixture.previous_current,
        fixture.mount_render.work_in_progress()
    );
    assert_eq!(fixture.complete_work.root(), root_id);
    assert_eq!(
        fixture.complete_work.host_root_work_in_progress(),
        fixture.mount_render.work_in_progress()
    );
    assert_eq!(
        fixture.complete_work.root_child(),
        Some(fixture.function_component)
    );
    assert_eq!(
        fixture.complete_work.completed_child(),
        Some(fixture.function_host_child)
    );
    assert_single_function_component_container_append(
        &fixture.host_mutation_apply,
        root_id,
        fixture.mount_render.work_in_progress(),
        fixture.function_host_child,
        FiberTag::HostComponent,
    );
    assert_eq!(
        fixture.single_child.function_component(),
        fixture.function_component
    );
    assert_eq!(fixture.single_child.child_tag(), FiberTag::HostComponent);
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.delete_render.finished_work())
            .unwrap()
            .child(),
        None
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.function_component)
            .unwrap()
            .return_fiber(),
        Some(fixture.delete_render.finished_work())
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.function_component)
            .unwrap()
            .child(),
        Some(fixture.function_host_child)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.function_host_child)
            .unwrap()
            .return_fiber(),
        Some(fixture.function_component)
    );

    assert_eq!(source_request.root(), root_id);
    assert_eq!(
        source_request.source_handoff_order(),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_SOURCE_ORDER
    );
    assert_eq!(
        source_request.commit_order(),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_COMMIT_ORDER
    );
    assert_eq!(
        source_request.request_order(),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_REQUEST_ORDER
    );
    assert_eq!(source_request.previous_current(), fixture.previous_current);
    assert_eq!(
        source_request.finished_work(),
        fixture.delete_render.finished_work()
    );
    assert_eq!(
        source_request.committed_current(),
        fixture.delete_render.finished_work()
    );
    assert_eq!(source_request.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(source_request.remaining_lanes(), Lanes::NO);
    assert_eq!(source_request.pending_lanes(), Lanes::NO);
    assert_eq!(source_request.deletion_list_count(), 1);
    assert_eq!(source_request.deleted_root_count(), 1);
    assert_eq!(source_request.ref_cleanup_return_count(), 1);
    assert_eq!(source_request.passive_destroy_count(), 1);
    assert_eq!(source_request.host_node_cleanup_count(), 2);
    assert!(source_request.private_test_control_execution_requested());
    assert!(!source_request.public_unmount_compatibility_claimed());
    assert!(!source_request.public_ref_or_effect_compatibility_claimed());

    assert_eq!(handoff.commit().deletion_lists().len(), 1);
    assert_eq!(
        handoff.commit().deletion_lists()[0].list(),
        fixture.deletion_list
    );
    assert_eq!(
        handoff.commit().deletion_lists()[0].parent(),
        fixture.delete_render.finished_work()
    );
    assert_eq!(
        handoff.commit().deletion_lists()[0].deleted(),
        &[fixture.function_component]
    );
    let mutation_records = handoff.commit().mutation_apply_log().records();
    assert_eq!(mutation_records.len(), 1);
    assert_eq!(
        mutation_records[0].source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.deletion_list)
    );
    assert_eq!(mutation_records[0].fiber(), fixture.function_component);
    assert_eq!(mutation_records[0].tag(), FiberTag::FunctionComponent);
    assert_eq!(
        mutation_records[0].kind(),
        HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
    );

    let plan = source_request.host_detachment_plan();
    assert_eq!(plan.root(), root_id);
    assert_eq!(plan.finished_work(), fixture.delete_render.finished_work());
    assert_eq!(plan.deletion_list(), fixture.deletion_list);
    assert_eq!(plan.deleted_root(), fixture.function_component);
    assert_eq!(plan.deleted_root_tag(), FiberTag::FunctionComponent);
    assert_eq!(plan.parent(), fixture.delete_render.finished_work());
    assert_eq!(plan.parent_tag(), FiberTag::HostRoot);
    assert_eq!(plan.host_parent(), fixture.delete_render.finished_work());
    assert_eq!(plan.host_child(), fixture.function_host_child);
    assert_eq!(plan.host_child_tag(), FiberTag::HostComponent);
    assert_eq!(
        plan.host_child_state_node(),
        fixture.function_host_child_state_node
    );
    assert_eq!(plan.host_child_traversal_depth(), 1);
    assert_eq!(plan.cleanup_sequence(), 1);
    assert_eq!(plan.cleanup_order_sequence(), 3);
    assert!(!plan.public_unmount_compatibility_claimed());
    assert!(!plan.broad_host_teardown_enabled());

    let deleted_passive = handoff
        .commit()
        .function_component_deleted_subtree_passive_effects();
    assert_eq!(deleted_passive.len(), 1);
    assert_eq!(deleted_passive.destroy_count(), 1);
    assert_eq!(deleted_passive.records()[0], queued_passive);
    assert_eq!(queued_passive.fiber(), fixture.function_component);
    assert_eq!(queued_passive.create(), fixture.passive_create);
    assert_eq!(queued_passive.destroy(), Some(fixture.passive_destroy));
    assert_eq!(queued_passive.dependencies(), fixture.passive_dependencies);

    let order_gate = handoff.commit().deletion_cleanup_order_gate_for_canary();
    assert_eq!(
        order_gate
            .records()
            .iter()
            .map(|record| record.phase())
            .collect::<Vec<_>>(),
        vec![
            HostRootDeletionCleanupOrderPhase::RefCleanupReturn,
            HostRootDeletionCleanupOrderPhase::PassiveDestroy,
            HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
            HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
        ]
    );
    assert_eq!(order_gate.records()[0].fiber(), fixture.function_host_child);
    assert_eq!(
        order_gate.records()[0].deleted_root(),
        fixture.function_component
    );
    assert_eq!(order_gate.records()[1].fiber(), fixture.function_component);
    assert_eq!(
        order_gate.records()[1].passive_destroy(),
        Some(fixture.passive_destroy)
    );
    assert_eq!(order_gate.records()[2].fiber(), fixture.function_host_text);
    assert_eq!(order_gate.records()[3].fiber(), fixture.function_host_child);

    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.request(), source_request);
    assert_eq!(
        diagnostic.host_detachment_status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::RemoveChildFromContainer
        )
    );
    assert!(diagnostic.ref_cleanup_return_callbacks_invoked());
    assert!(diagnostic.passive_destroy_callbacks_invoked());
    assert!(diagnostic.private_host_subtree_detachment_applied());
    assert!(!diagnostic.public_unmount_compatibility_claimed());
    assert!(!diagnostic.public_ref_or_effect_compatibility_claimed());

    let ref_passive = diagnostic.ref_passive_cleanup();
    assert_eq!(ref_passive.records().len(), 4);
    assert_eq!(ref_passive.ref_cleanup_return_executions().len(), 1);
    assert_eq!(executor.ref_cleanup_calls().len(), 1);
    assert_eq!(executor.destroy_calls().len(), 1);
    let ref_cleanup = ref_passive.ref_cleanup_return_executions()[0];
    assert_eq!(ref_cleanup.fiber(), fixture.function_host_child);
    assert_eq!(
        ref_cleanup.state_node(),
        fixture.function_host_child_state_node
    );
    assert_eq!(ref_cleanup.ref_handle(), fixture.function_host_child_ref);
    assert_eq!(executor.ref_cleanup_calls()[0], ref_cleanup.request());
    assert_eq!(
        executor.destroy_calls()[0].fiber(),
        fixture.function_component
    );
    assert_eq!(
        executor.destroy_calls()[0].destroy_callback(),
        fixture.passive_destroy
    );

    let snapshot = diagnostic.execution_snapshot();
    assert_eq!(snapshot.len(), 5);
    assert_eq!(snapshot.ref_cleanup_return_gate_count(), 1);
    assert_eq!(snapshot.passive_destroy_execution_count(), 1);
    assert_eq!(snapshot.host_subtree_detachment_count(), 1);
    assert_eq!(snapshot.host_cleanup_apply_count(), 2);
    assert!(snapshot.private_passive_destroy_callbacks_invoked());
    assert!(snapshot.private_host_subtree_detachment_applied());
    assert!(!snapshot.public_unmount_compatibility_claimed());
    assert!(!snapshot.public_ref_or_effect_compatibility_claimed());
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
    assert_eq!(snapshot.records()[0].fiber(), fixture.function_host_child);
    assert_eq!(
        snapshot.records()[0].deleted_root(),
        fixture.function_component
    );
    assert_eq!(snapshot.records()[1].fiber(), fixture.function_component);
    assert_eq!(snapshot.records()[2].fiber(), fixture.function_host_child);
    assert_eq!(
        snapshot.records()[2].host_detachment_cleanup_order_sequence(),
        Some(3)
    );
    assert_eq!(snapshot.records()[3].fiber(), fixture.function_host_text);
    assert_eq!(snapshot.records()[3].host_cleanup_sequence(), Some(0));
    assert_eq!(snapshot.records()[4].fiber(), fixture.function_host_child);
    assert_eq!(snapshot.records()[4].host_cleanup_sequence(), Some(1));

    assert!(
        !fixture
            .detached_hosts
            .text_metadata(fixture.function_host_text_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        !fixture
            .detached_hosts
            .instance_metadata(fixture.function_host_child_state_node)
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
    let mut expected_operations = fixture.operations_before_teardown;
    expected_operations.push("remove_child_from_container");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn root_work_loop_function_component_deleted_subtree_teardown_rejects_newer_committed_current_before_effects()
 {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_root_work_loop_function_component_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 88_000,
    );

    let mut handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        fixture.delete_render,
        Some(fixture.pending),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_COMMIT_ORDER,
    )
    .unwrap();
    handoff
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[fixture
            .deleted_passive_handoff
            .clone()])
        .unwrap();
    let source_request = test_host_root_deletion_teardown_execution_request_for_canary(
        &handoff,
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap();

    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(88_005),
        None,
    )
    .unwrap();
    let newer_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let newer_commit = commit_finished_host_root(&mut store, newer_render).unwrap();
    assert_eq!(host.operations(), fixture.operations_before_teardown);
    let operations_before_teardown = host.operations();
    let mut executor = RecordingDeletedSubtreeTeardownExecutor::default();

    let error = execute_function_component_deleted_subtree_teardown_for_canary(
        &mut store,
        &mut host,
        &handoff,
        source_request,
        source_request,
        &mut fixture,
        &mut executor,
    )
    .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentDeletedSubtreeTeardownExecutionError::StaleCommittedCurrent {
            root: root_id,
            expected_current: source_request.committed_current(),
            actual_current: newer_commit.current(),
        }
    );
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), operations_before_teardown);
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.function_host_child_state_node)
            .unwrap()
            .is_active()
    );
}

#[test]
fn root_work_loop_function_component_deleted_subtree_teardown_rejects_reattached_root_child_before_effects()
 {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_root_work_loop_function_component_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 88_100,
    );

    let mut handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        fixture.delete_render,
        Some(fixture.pending),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_COMMIT_ORDER,
    )
    .unwrap();
    handoff
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[fixture
            .deleted_passive_handoff
            .clone()])
        .unwrap();
    let source_request = test_host_root_deletion_teardown_execution_request_for_canary(
        &handoff,
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap();

    store
        .fiber_arena_mut()
        .set_children(
            source_request.committed_current(),
            &[fixture.function_component],
        )
        .unwrap();
    let operations_before_teardown = host.operations();
    let mut executor = RecordingDeletedSubtreeTeardownExecutor::default();

    let error = execute_function_component_deleted_subtree_teardown_for_canary(
        &mut store,
        &mut host,
        &handoff,
        source_request,
        source_request,
        &mut fixture,
        &mut executor,
    )
    .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentDeletedSubtreeTeardownExecutionError::RootFinishedChildMismatch {
            root: root_id,
            expected_child: None,
            actual_child: Some(fixture.function_component),
        }
    );
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), operations_before_teardown);
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.function_host_child_state_node)
            .unwrap()
            .is_active()
    );
}

#[test]
fn root_work_loop_function_component_deleted_subtree_teardown_rejects_host_child_sibling_before_effects()
 {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture = prepare_root_work_loop_function_component_deleted_subtree_teardown_fixture(
        &mut store, &mut host, root_id, 88_200,
    );

    let mut handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        fixture.delete_render,
        Some(fixture.pending),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_COMMIT_ORDER,
    )
    .unwrap();
    handoff
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[fixture
            .deleted_passive_handoff
            .clone()])
        .unwrap();
    let source_request = test_host_root_deletion_teardown_execution_request_for_canary(
        &handoff,
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap();

    let mode = store
        .fiber_arena()
        .get(fixture.function_component)
        .unwrap()
        .mode();
    let sibling = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(88_205),
        mode,
    );
    store
        .fiber_arena_mut()
        .set_children(
            fixture.function_component,
            &[fixture.function_host_child, sibling],
        )
        .unwrap();
    let operations_before_teardown = host.operations();
    let mut executor = RecordingDeletedSubtreeTeardownExecutor::default();

    let error = execute_function_component_deleted_subtree_teardown_for_canary(
        &mut store,
        &mut host,
        &handoff,
        source_request,
        source_request,
        &mut fixture,
        &mut executor,
    )
    .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentDeletedSubtreeTeardownExecutionError::FunctionComponentHostChildMismatch {
            root: root_id,
            function_component: fixture.function_component,
            expected_child: fixture.function_host_child,
            actual_child: fixture.function_host_child,
            expected_tag: fixture.single_child.child_tag(),
            actual_tag: FiberTag::HostComponent,
            actual_parent: Some(fixture.function_component),
            actual_sibling: Some(sibling),
        }
    );
    assert!(executor.ref_cleanup_calls().is_empty());
    assert!(executor.destroy_calls().is_empty());
    assert_eq!(host.operations(), operations_before_teardown);
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.function_host_child_state_node)
            .unwrap()
            .is_active()
    );
}

#[test]
fn root_work_loop_function_component_deleted_subtree_teardown_rejects_bad_evidence_before_host_calls()
 {
    let (mut missing_store, missing_root, mut missing_host) = root_store();
    let missing_fixture =
        prepare_root_work_loop_function_component_deleted_subtree_teardown_fixture(
            &mut missing_store,
            &mut missing_host,
            missing_root,
            88_000,
        );
    missing_store
        .fiber_arena_mut()
        .get_mut(missing_fixture.function_host_child)
        .unwrap()
        .set_ref_handle(RefHandle::NONE);
    let missing_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut missing_store,
        missing_fixture.delete_render,
        Some(missing_fixture.pending),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_COMMIT_ORDER,
    )
    .unwrap();
    let missing_error = test_host_root_deletion_teardown_execution_request_for_canary(
        &missing_handoff,
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap_err();
    assert!(matches!(
        missing_error,
        TestHostRootDeletionTeardownExecutionErrorForCanary::MissingDeletionTeardownMetadata {
            root,
            finished_work,
        } if root == missing_root && finished_work == missing_fixture.delete_render.finished_work()
    ));
    assert_eq!(
        missing_handoff
            .commit()
            .deletion_cleanup_order_gate_for_canary()
            .ref_cleanup_return_count(),
        0
    );
    assert_eq!(
        missing_handoff
            .commit()
            .deletion_cleanup_order_gate_for_canary()
            .passive_destroy_count(),
        0
    );
    assert_eq!(
        missing_host.operations(),
        missing_fixture.operations_before_teardown
    );
    assert!(
        missing_fixture
            .detached_hosts
            .instance_metadata(missing_fixture.function_host_child_state_node)
            .unwrap()
            .is_active()
    );

    let (mut stale_store, stale_root, mut stale_host) = root_store();
    let mut stale_fixture =
        prepare_root_work_loop_function_component_deleted_subtree_teardown_fixture(
            &mut stale_store,
            &mut stale_host,
            stale_root,
            88_100,
        );
    let mut stale_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut stale_store,
        stale_fixture.delete_render,
        Some(stale_fixture.pending),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_COMMIT_ORDER,
    )
    .unwrap();
    stale_handoff
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[stale_fixture
            .deleted_passive_handoff
            .clone()])
        .unwrap();
    let stale_request = test_host_root_deletion_teardown_execution_request_for_canary(
        &stale_handoff,
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap();
    stale_store
        .fiber_arena_mut()
        .set_children(stale_fixture.function_component, &[])
        .unwrap();
    let mut stale_executor = RecordingDeletedSubtreeTeardownExecutor::default();
    let stale_error = execute_function_component_deleted_subtree_teardown_for_canary(
        &mut stale_store,
        &mut stale_host,
        &stale_handoff,
        stale_request,
        stale_request,
        &mut stale_fixture,
        &mut stale_executor,
    )
    .unwrap_err();
    assert!(matches!(
        stale_error,
        FunctionComponentDeletedSubtreeTeardownExecutionError::FunctionComponentTopologyMismatch {
            root,
            function_component,
            expected_child,
            actual_child: None,
            ..
        } if root == stale_root
            && function_component == stale_fixture.function_component
            && expected_child == stale_fixture.function_host_child
    ));
    assert!(stale_executor.ref_cleanup_calls().is_empty());
    assert!(stale_executor.destroy_calls().is_empty());
    assert_eq!(
        stale_host.operations(),
        stale_fixture.operations_before_teardown
    );
    assert!(
        stale_fixture
            .detached_hosts
            .instance_metadata(stale_fixture.function_host_child_state_node)
            .unwrap()
            .is_active()
    );

    let mut cross_store = FiberRootStore::<RecordingHost>::new();
    let mut cross_host = RecordingHost::default();
    let source_root = cross_store
        .create_client_root(FakeContainer::new(879), RootOptions::new())
        .unwrap();
    let foreign_root = cross_store
        .create_client_root(FakeContainer::new(880), RootOptions::new())
        .unwrap();
    let source_fixture = prepare_root_work_loop_function_component_deleted_subtree_teardown_fixture(
        &mut cross_store,
        &mut cross_host,
        source_root,
        88_200,
    );
    let mut foreign_fixture =
        prepare_root_work_loop_function_component_deleted_subtree_teardown_fixture(
            &mut cross_store,
            &mut cross_host,
            foreign_root,
            88_300,
        );
    let mut source_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut cross_store,
        source_fixture.delete_render,
        Some(source_fixture.pending),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_COMMIT_ORDER,
    )
    .unwrap();
    source_handoff
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[source_fixture
            .deleted_passive_handoff
            .clone()])
        .unwrap();
    let source_request = test_host_root_deletion_teardown_execution_request_for_canary(
        &source_handoff,
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap();
    let mut foreign_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut cross_store,
        foreign_fixture.delete_render,
        Some(foreign_fixture.pending),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_COMMIT_ORDER + 10,
    )
    .unwrap();
    foreign_handoff
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[foreign_fixture
            .deleted_passive_handoff
            .clone()])
        .unwrap();
    let mut cross_executor = RecordingDeletedSubtreeTeardownExecutor::default();
    let cross_error = execute_function_component_deleted_subtree_teardown_for_canary(
        &mut cross_store,
        &mut cross_host,
        &foreign_handoff,
        source_request,
        source_request,
        &mut foreign_fixture,
        &mut cross_executor,
    )
    .unwrap_err();
    assert_eq!(
        cross_error,
        FunctionComponentDeletedSubtreeTeardownExecutionError::HostWork(
            TestHostRootDeletionTeardownExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root: source_root,
                actual_root: foreign_root,
            }
        )
    );
    assert!(cross_executor.ref_cleanup_calls().is_empty());
    assert!(cross_executor.destroy_calls().is_empty());
    assert_eq!(
        cross_host.operations(),
        foreign_fixture.operations_before_teardown
    );

    let (mut caller_store, caller_root, mut caller_host) = root_store();
    let mut caller_fixture =
        prepare_root_work_loop_function_component_deleted_subtree_teardown_fixture(
            &mut caller_store,
            &mut caller_host,
            caller_root,
            88_400,
        );
    let mut caller_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut caller_store,
        caller_fixture.delete_render,
        Some(caller_fixture.pending),
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_COMMIT_ORDER,
    )
    .unwrap();
    caller_handoff
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[caller_fixture
            .deleted_passive_handoff
            .clone()])
        .unwrap();
    let caller_source_request = test_host_root_deletion_teardown_execution_request_for_canary(
        &caller_handoff,
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap();
    let caller_built_request = caller_source_request.with_host_node_cleanup_count_for_canary(0);
    let mut caller_executor = RecordingDeletedSubtreeTeardownExecutor::default();
    let caller_error = execute_function_component_deleted_subtree_teardown_for_canary(
        &mut caller_store,
        &mut caller_host,
        &caller_handoff,
        caller_source_request,
        caller_built_request,
        &mut caller_fixture,
        &mut caller_executor,
    )
    .unwrap_err();
    assert_eq!(
        caller_error,
        FunctionComponentDeletedSubtreeTeardownExecutionError::HostWork(
            TestHostRootDeletionTeardownExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root: caller_root,
                commit_order: ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_COMMIT_ORDER,
                request_order: ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_REQUEST_ORDER,
            }
        )
    );
    assert!(caller_executor.ref_cleanup_calls().is_empty());
    assert!(caller_executor.destroy_calls().is_empty());
    assert_eq!(
        caller_host.operations(),
        caller_fixture.operations_before_teardown
    );
}

#[test]
fn root_work_loop_managed_child_host_text_sibling_order_delete_rejects_stale_text_sibling() {
    let (mut store, root_id, mut host) = root_store();
    let mut fixture =
        prepare_root_work_loop_managed_child_text_delete_sibling_order_execution_fixture(
            &mut store, &mut host, root_id, 83_400,
        );

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_COMMIT_ORDER,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_REQUEST_ORDER,
    )
    .unwrap();
    fixture
        .detached_hosts
        .invalidate_text_for_canary(fixture.order_sibling_state_node)
        .unwrap();

    let error = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        &mut host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        crate::host_work::TestHostRootManagedChildExecutionErrorForCanary::HostWork(
            crate::host_work::HostWorkError::HostNode(ref error)
        ) if error.violation() == crate::host_nodes::HostNodeViolation::Stale
    ));
    assert_eq!(host.operations(), fixture.operations_before_apply);
    assert!(
        fixture
            .detached_hosts
            .text_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        store.host_tokens().len(),
        fixture.token_count_before_apply + 1
    );
}

#[test]
fn root_work_loop_managed_child_sibling_order_placement_handoff_survives_finished_work_commit() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_root_work_loop_managed_child_placement_sibling_order_fixture(
        &mut store, root_id, 82_600,
    );

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_COMMIT_ORDER,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_REQUEST_ORDER,
    )
    .unwrap();

    assert_root_work_loop_managed_child_sibling_order_handoff_common(
        &store,
        &host,
        root_id,
        fixture,
        &handoff,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_COMMIT_ORDER,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_REQUEST_ORDER,
    );

    assert_eq!(
        fixture.complete_work.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(fixture.complete_work.child_alternate(), None);
    assert_eq!(fixture.complete_work.child_flags(), FiberFlags::PLACEMENT);
    assert_eq!(
        handoff.mutation().source(),
        HostRootMutationApplyRecordSource::MutationPhase(
            HostRootMutationPhaseRecordKind::Placement
        )
    );
    assert_eq!(
        handoff.mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    );
    assert_eq!(handoff.mutation().parent(), fixture.work_parent);
    assert_eq!(
        handoff.mutation().parent_state_node(),
        fixture.parent_state_node
    );
    assert_eq!(handoff.mutation().fiber(), fixture.child);
    assert_eq!(handoff.mutation().state_node(), fixture.child_state_node);
    assert_eq!(handoff.mutation().pending_props(), fixture.child_props);
    assert_eq!(handoff.mutation().memoized_props(), fixture.child_props);
    assert_eq!(handoff.mutation().alternate_fiber(), None);
    assert!(
        handoff
            .mutation()
            .effect_flag()
            .contains_all(FiberFlags::PLACEMENT)
    );
    let placement_sibling = handoff.mutation().placement_sibling().unwrap();
    assert_eq!(
        placement_sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(placement_sibling.sibling(), Some(fixture.order_sibling));
    assert_eq!(
        placement_sibling.sibling_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(
        placement_sibling.sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(placement_sibling.skipped_pending_sibling_count(), 0);
    assert!(placement_sibling.can_insert_before());

    let finished_parent = store.fiber_arena().get(fixture.work_parent).unwrap();
    assert_eq!(finished_parent.child(), Some(fixture.child));
    assert_eq!(
        store.fiber_arena().get(fixture.child).unwrap().sibling(),
        Some(fixture.order_sibling)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.order_sibling)
            .unwrap()
            .sibling(),
        None
    );
}

#[test]
fn root_work_loop_managed_child_sibling_order_delete_handoff_survives_finished_work_commit() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_root_work_loop_managed_child_delete_sibling_order_fixture(
        &mut store, root_id, 82_700,
    );
    let deletion_list = fixture.deletion_list.unwrap();

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_COMMIT_ORDER,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_REQUEST_ORDER,
    )
    .unwrap();

    assert_root_work_loop_managed_child_sibling_order_handoff_common(
        &store,
        &host,
        root_id,
        fixture,
        &handoff,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_COMMIT_ORDER,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_REQUEST_ORDER,
    );

    assert_eq!(
        fixture.complete_work.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(fixture.complete_work.child_alternate(), None);
    assert_eq!(fixture.complete_work.deletion_list(), Some(deletion_list));
    assert_eq!(
        fixture.complete_work.parent_flags(),
        FiberFlags::CHILD_DELETION
    );
    assert_eq!(
        handoff.mutation().source(),
        HostRootMutationApplyRecordSource::DeletionList(deletion_list)
    );
    assert_eq!(
        handoff.mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(handoff.mutation().parent(), fixture.work_parent);
    assert_eq!(
        handoff.mutation().parent_state_node(),
        fixture.parent_state_node
    );
    assert_eq!(handoff.mutation().fiber(), fixture.child);
    assert_eq!(handoff.mutation().state_node(), fixture.child_state_node);
    assert_eq!(handoff.mutation().pending_props(), fixture.child_props);
    assert_eq!(handoff.mutation().memoized_props(), fixture.child_props);
    assert!(
        handoff
            .mutation()
            .effect_flag()
            .contains_all(FiberFlags::CHILD_DELETION)
    );
    assert_eq!(handoff.mutation().placement_sibling(), None);
    assert_eq!(handoff.commit().deletion_lists().len(), 1);
    assert_eq!(handoff.commit().deletion_lists()[0].list(), deletion_list);
    assert_eq!(
        handoff.commit().deletion_lists()[0].deleted(),
        &[fixture.child]
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.order_sibling_current)
            .unwrap()
            .sibling(),
        Some(fixture.child)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.work_parent)
            .unwrap()
            .child(),
        Some(fixture.order_sibling)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.order_sibling)
            .unwrap()
            .sibling(),
        None
    );
}
