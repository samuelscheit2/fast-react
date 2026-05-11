use super::helpers::*;
use super::*;

#[test]
fn host_work_deletion_executes_passive_destroy_before_host_cleanup_with_ref_order_evidence() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(186));
    let fixture = attach_detached_host_subtree_with_passive_cleanup_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        &mut hook_store,
        "deleted passive subtree",
    );
    let deleted_host_child = FakeHostChild::Instance(
        detached_hosts
            .instance(fixture.deleted_host_state_node)
            .unwrap()
            .id(),
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(187), None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = delete_host_component_under_host_parent_for_commit(
        &mut store,
        delete_render.finished_work(),
        fixture.host_parent,
        fixture.deleted_host,
    );
    let deleted_passive_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        work_parent,
        fixture.deleted_host,
        Lanes::DEFAULT,
    )
    .unwrap();
    let queued_passive = deleted_passive_handoff.records()[0];
    let mut delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    delete_commit
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[
            deleted_passive_handoff,
        ])
        .unwrap();
    let operations_before_apply = host.operations();
    let mut destroy_executor = RecordingDeletedSubtreeDestroyExecutor::default();
    let passive_flush =
        flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary(
            &mut store,
            &delete_commit,
            &mut destroy_executor,
        )
        .unwrap();
    let detach_apply = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
        &store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let cleanup_apply = apply_test_host_root_deletion_cleanup(
        &store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let execution_snapshot =
        materialize_test_host_root_deletion_ref_passive_cleanup_execution_for_canary(
            &delete_commit,
            &passive_flush,
            &detach_apply,
            &cleanup_apply,
        );

    assert_eq!(delete_commit.mutation_apply_log().records().len(), 1);
    assert_eq!(
        delete_commit.mutation_apply_log().records()[0].kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(
        delete_commit.mutation_apply_log().records()[0].parent(),
        work_parent
    );
    assert_eq!(
        delete_commit.mutation_apply_log().records()[0].parent_state_node(),
        fixture.host_parent_state_node
    );
    assert_eq!(
        delete_commit.mutation_apply_log().records()[0].fiber(),
        fixture.deleted_host
    );
    assert_eq!(detach_apply.root(), root_id);
    assert_eq!(detach_apply.finished_work(), delete_commit.finished_work());
    assert_eq!(
        detach_apply.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert!(!detach_apply.public_unmount_compatibility_claimed());
    assert!(!detach_apply.broad_host_teardown_enabled());
    assert_eq!(detach_apply.plan().deleted_root(), fixture.deleted_host);
    assert_eq!(detach_apply.plan().host_parent(), work_parent);
    assert_eq!(
        detach_apply.plan().host_parent_state_node(),
        fixture.host_parent_state_node
    );
    assert_eq!(detach_apply.plan().host_child(), fixture.deleted_host);
    assert_eq!(
        detach_apply.plan().host_child_tag(),
        FiberTag::HostComponent
    );
    assert_eq!(
        detach_apply.plan().host_child_state_node(),
        fixture.deleted_host_state_node
    );
    assert_eq!(detach_apply.plan().cleanup_sequence(), 1);
    assert_eq!(detach_apply.plan().cleanup_order_sequence(), 3);

    let refs = delete_commit.ref_commit_metadata();
    assert_eq!(refs.attach().len(), 0);
    assert_eq!(refs.detach().len(), 1);
    assert_eq!(refs.detach()[0].fiber(), fixture.deleted_host);
    assert_eq!(
        refs.detach()[0].state_node(),
        fixture.deleted_host_state_node
    );
    assert_eq!(refs.detach()[0].ref_handle(), fixture.deleted_host_ref);
    assert_eq!(
        refs.detach()[0].detach_reason(),
        Some(HostRootRefDetachReason::Deleted)
    );
    assert_eq!(
        refs.detach()[0].token_phase(),
        HostFiberTokenPhase::Deletion
    );
    assert_eq!(
        refs.detach()[0].token_target(),
        HostFiberTokenTarget::Instance
    );

    let cleanup_gate = delete_commit.ref_cleanup_return_execution_gate();
    assert_eq!(cleanup_gate.len(), 1);
    assert_eq!(cleanup_gate.cleanup_return_execution_gate_count(), 1);
    assert_eq!(cleanup_gate.records()[0].fiber(), fixture.deleted_host);
    assert_eq!(cleanup_gate.records()[0].token(), refs.detach()[0].token());
    assert!(cleanup_gate.records()[0].cleanup_return_execution_gate());
    assert!(!cleanup_gate.cleanup_return_callbacks_invoked());

    assert_eq!(passive_flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(passive_flush.consumed_pending_passive());
    assert_eq!(passive_flush.records().len(), 1);
    assert_eq!(passive_flush.records()[0].fiber(), fixture.deleted_function);
    assert_eq!(
        passive_flush.records()[0].phase(),
        PendingPassiveEffectPhase::Unmount
    );
    assert_eq!(
        passive_flush.records()[0].unmount_origin(),
        Some(PendingPassiveUnmountOrigin::DeletedSubtree {
            nearest_mounted_ancestor: work_parent
        })
    );
    assert_eq!(
        passive_flush.records()[0].destroy_callback(),
        Some(fixture.passive_destroy)
    );
    assert!(passive_flush.records()[0].destroy_callback_invoked());
    assert!(passive_flush.did_execute_destroy_callbacks());
    assert_eq!(passive_flush.destroy_callback_executions().len(), 1);
    assert_eq!(destroy_executor.calls().len(), 1);
    let destroy_execution = passive_flush.destroy_callback_executions()[0];
    assert_eq!(destroy_execution.fiber(), fixture.deleted_function);
    assert_eq!(
        destroy_execution.pending_order(),
        queued_passive.unmount_order()
    );
    assert_eq!(
        destroy_execution.destroy_callback(),
        fixture.passive_destroy
    );
    assert_eq!(destroy_executor.calls()[0], destroy_execution.request());
    assert!(!passive_flush.public_effect_execution_enabled());
    assert!(!passive_flush.public_act_compatibility_claimed());
    assert!(!passive_flush.scheduler_driven_passive_execution_enabled());

    assert_eq!(cleanup_apply.records().len(), 2);
    assert_eq!(cleanup_apply.applied_record_count(), 2);
    assert_eq!(
        cleanup_apply.records()[0].cleanup().fiber(),
        fixture.deleted_text
    );
    assert_eq!(
        cleanup_apply.records()[0].status(),
        TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::InvalidateDeletedText
        )
    );
    assert_eq!(
        cleanup_apply.records()[1].cleanup().fiber(),
        fixture.deleted_host
    );
    assert_eq!(
        cleanup_apply.records()[1].status(),
        TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::DetachDeletedInstance
        )
    );
    assert!(
        !detached_hosts
            .text_metadata(fixture.deleted_text_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        !detached_hosts
            .instance_metadata(fixture.deleted_host_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        detached_hosts
            .nodes
            .text(
                fixture.deleted_text_state_node,
                detached_hosts
                    .scope(
                        fixture.deleted_text_state_node,
                        HostFiberTokenTarget::TextInstance
                    )
                    .unwrap()
            )
            .unwrap_err()
            .violation(),
        HostNodeViolation::Stale
    );
    assert_eq!(
        detached_hosts
            .nodes
            .instance(
                fixture.deleted_host_state_node,
                detached_hosts
                    .scope(
                        fixture.deleted_host_state_node,
                        HostFiberTokenTarget::Instance
                    )
                    .unwrap()
            )
            .unwrap_err()
            .violation(),
        HostNodeViolation::Stale
    );
    assert!(
        detached_hosts
            .instance(fixture.host_parent_state_node)
            .unwrap()
            .children()
            .contains(&deleted_host_child)
    );

    let order_gate = delete_commit.deletion_cleanup_order_gate_for_canary();
    assert_eq!(order_gate.len(), 4);
    assert_eq!(order_gate.ref_cleanup_return_count(), 1);
    assert_eq!(order_gate.passive_destroy_count(), 1);
    assert_eq!(order_gate.host_node_cleanup_count(), 2);
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
    assert_eq!(order_gate.records()[0].fiber(), fixture.deleted_host);
    assert_eq!(
        order_gate.records()[0].ref_cleanup_return_sequence(),
        Some(0)
    );
    assert_eq!(order_gate.records()[1].fiber(), fixture.deleted_function);
    assert_eq!(
        order_gate.records()[1].passive_unmount_order(),
        Some(queued_passive.unmount_order())
    );
    assert_eq!(
        order_gate.records()[1].passive_destroy(),
        Some(fixture.passive_destroy)
    );
    assert_eq!(order_gate.records()[2].fiber(), fixture.deleted_text);
    assert_eq!(order_gate.records()[2].host_cleanup_sequence(), Some(0));
    assert_eq!(order_gate.records()[3].fiber(), fixture.deleted_host);
    assert_eq!(order_gate.records()[3].host_cleanup_sequence(), Some(1));
    assert!(!order_gate.ref_cleanup_return_callbacks_invoked());
    assert!(!order_gate.passive_destroy_callbacks_invoked());
    assert!(!order_gate.public_effects_flushed());
    assert!(!order_gate.public_ref_or_effect_compatibility_claimed());
    assert!(
        !delete_commit
            .host_node_deletion_cleanup_log()
            .public_unmount_compatibility_claimed()
    );

    assert_eq!(execution_snapshot.len(), 5);
    assert_eq!(execution_snapshot.ref_cleanup_return_gate_count(), 1);
    assert_eq!(execution_snapshot.passive_destroy_execution_count(), 1);
    assert_eq!(execution_snapshot.host_subtree_detachment_count(), 1);
    assert_eq!(execution_snapshot.host_cleanup_apply_count(), 2);
    assert!(execution_snapshot.private_passive_destroy_callbacks_invoked());
    assert!(execution_snapshot.private_host_subtree_detachment_applied());
    assert!(!execution_snapshot.public_unmount_compatibility_claimed());
    assert!(!execution_snapshot.public_ref_or_effect_compatibility_claimed());
    assert_eq!(
        execution_snapshot
            .records()
            .iter()
            .map(|record| record.sequence())
            .collect::<Vec<_>>(),
        vec![0, 1, 2, 3, 4]
    );
    assert_eq!(
        execution_snapshot
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
    assert_eq!(
        execution_snapshot.records()[0].fiber(),
        fixture.deleted_host
    );
    assert_eq!(
        execution_snapshot.records()[0].deleted_root(),
        fixture.deleted_host
    );
    assert_eq!(
        execution_snapshot.records()[0].ref_cleanup_return_sequence(),
        Some(0)
    );
    assert_eq!(
        execution_snapshot.records()[0].passive_destroy_execution_order(),
        None
    );
    assert_eq!(
        execution_snapshot.records()[1].fiber(),
        fixture.deleted_function
    );
    assert_eq!(
        execution_snapshot.records()[1].deleted_root(),
        fixture.deleted_host
    );
    assert_eq!(
        execution_snapshot.records()[1].ref_cleanup_return_sequence(),
        None
    );
    assert_eq!(
        execution_snapshot.records()[1].passive_destroy_execution_order(),
        Some(0)
    );
    assert_eq!(
        execution_snapshot.records()[2].fiber(),
        fixture.deleted_host
    );
    assert_eq!(
        execution_snapshot.records()[2].host_detachment_cleanup_order_sequence(),
        Some(3)
    );
    assert_eq!(
        execution_snapshot.records()[2].host_cleanup_sequence(),
        None
    );
    assert_eq!(
        execution_snapshot.records()[3].fiber(),
        fixture.deleted_text
    );
    assert_eq!(
        execution_snapshot.records()[3].host_cleanup_sequence(),
        Some(0)
    );
    assert_eq!(
        execution_snapshot.records()[4].fiber(),
        fixture.deleted_host
    );
    assert_eq!(
        execution_snapshot.records()[4].host_cleanup_sequence(),
        Some(1)
    );

    let mut expected_operations = operations_before_apply;
    expected_operations.push("remove_child");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(host.operations(), expected_operations);
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
}
