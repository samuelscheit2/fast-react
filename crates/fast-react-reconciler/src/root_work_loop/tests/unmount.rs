use super::*;

#[test]
fn root_work_loop_root_unmount_one_level_child_set_sync_executes_container_removal_and_cleanup() {
    let (mut store, root_id, mut host) = root_store();
    let mut mounted =
        mount_one_level_root_host_output_for_unmount(&mut store, &mut host, root_id, 86_200);
    let update = update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
    let unmount_render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();

    let execution = execute_root_unmount_from_mounted_one_level_output(
        &mut store,
        &mut host,
        unmount_render,
        &mounted.complete_work,
        &mut mounted.host_work,
        ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER + 10,
        ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER + 10,
    )
    .unwrap();

    assert_eq!(update.lane(), Lane::SYNC);
    assert_eq!(
        execution.render.resulting_element(),
        RootElementHandle::NONE
    );
    assert_eq!(execution.render.render_lanes(), Lanes::SYNC);
    assert_eq!(
        execution.deleted_children,
        vec![mounted.first_child, mounted.second_child]
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        execution.render.finished_work()
    );
    assert_eq!(
        current_host_root_element(&store, root_id),
        RootElementHandle::NONE
    );
    assert_eq!(
        execution.finished_work_handoff.commit_order(),
        ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER + 10
    );
    assert!(execution.finished_work_handoff.mutation_execution_blocked());
    assert!(
        execution
            .finished_work_handoff
            .public_root_rendering_blocked()
    );

    let commit = execution.finished_work_handoff.commit();
    assert_eq!(commit.finished_lanes(), Lanes::SYNC);
    assert_eq!(commit.deletion_lists().len(), 1);
    assert_eq!(
        commit.deletion_lists()[0].parent(),
        execution.render.finished_work()
    );
    assert_eq!(
        commit.deletion_lists()[0].deleted(),
        &[mounted.first_child, mounted.second_child]
    );
    assert_eq!(commit.host_node_deletion_cleanup_log().len(), 3);

    assert_eq!(execution.mutation_apply.records().len(), 2);
    assert_eq!(
        execution.mutation_apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    assert_eq!(
        execution.mutation_apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::RemoveChildFromContainer
        )
    );
    assert_eq!(
        execution.mutation_apply.records()[1].mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    assert_eq!(
        execution.mutation_apply.records()[1].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::RemoveChildFromContainer
        )
    );
    assert_eq!(execution.mutation_apply.applied_host_call_count(), 2);

    assert_eq!(execution.deletion_cleanup.root(), root_id);
    assert_eq!(
        execution.deletion_cleanup.finished_work(),
        execution.render.finished_work()
    );
    assert_eq!(execution.deletion_cleanup.records().len(), 3);
    assert_eq!(execution.deletion_cleanup.applied_record_count(), 3);
    assert_eq!(execution.deletion_cleanup.detached_instance_count(), 1);
    assert_eq!(execution.deletion_cleanup.invalidated_text_count(), 2);
    assert_eq!(
        execution
            .deletion_cleanup
            .records()
            .iter()
            .filter(|record| record.previous_metadata().is_some())
            .count(),
        3
    );
    assert!(execution.deletion_cleanup.records().iter().any(|record| {
        record.cleanup().fiber() == mounted.first_child
            && record.status()
                == TestHostRootDeletionCleanupStatus::Applied(
                    TestHostRootDeletionCleanupAction::DetachDeletedInstance,
                )
    }));
    assert!(execution.deletion_cleanup.records().iter().any(|record| {
        record.cleanup().fiber() == mounted.second_child
            && record.status()
                == TestHostRootDeletionCleanupStatus::Applied(
                    TestHostRootDeletionCleanupAction::InvalidateDeletedText,
                )
    }));

    assert!(
        !mounted
            .host_work
            .detached_hosts_mut_for_canary()
            .instance_metadata(mounted.first_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        !mounted
            .host_work
            .detached_hosts_mut_for_canary()
            .text_metadata(mounted.second_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        store.host_tokens().len(),
        mounted.token_count_after_mount + execution.deletion_cleanup.records().len()
    );

    let mut expected_operations = mounted.operations_after_mount.clone();
    expected_operations.push("remove_child_from_container");
    expected_operations.push("remove_child_from_container");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(
        execution.operations_before_apply,
        mounted.operations_after_mount
    );
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn root_work_loop_root_unmount_rejects_stale_detached_host_before_container_remove() {
    let (mut store, root_id, mut host) = root_store();
    let mut mounted =
        mount_one_level_root_host_output_for_unmount(&mut store, &mut host, root_id, 86_210);
    update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
    let unmount_render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    mounted
        .host_work
        .detached_hosts_mut_for_canary()
        .invalidate_text_for_canary(mounted.second_state_node)
        .unwrap();
    let operations_before_unmount = host.operations();

    let error = execute_root_unmount_from_mounted_one_level_output(
        &mut store,
        &mut host,
        unmount_render,
        &mounted.complete_work,
        &mut mounted.host_work,
        ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER + 20,
        ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER + 20,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        RootWorkLoopRootUnmountExecutionError::HostWork(HostWorkError::HostNode(error))
            if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(host.operations(), operations_before_unmount);
}

#[test]
fn root_work_loop_root_unmount_rejects_cross_root_mount_evidence_before_host_call() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let mut host = RecordingHost::default();
    let mut mounted =
        mount_one_level_root_host_output_for_unmount(&mut store, &mut host, first_root, 86_220);
    let first_current_after_mount = store.root(first_root).unwrap().current();
    update_container_sync(&mut store, second_root, RootElementHandle::NONE, None).unwrap();
    let second_render = render_host_root_for_lanes(&mut store, second_root, Lanes::SYNC).unwrap();
    let operations_before_unmount = host.operations();

    let error = execute_root_unmount_from_mounted_one_level_output(
        &mut store,
        &mut host,
        second_render,
        &mounted.complete_work,
        &mut mounted.host_work,
        ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER + 30,
        ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER + 30,
    )
    .unwrap_err();

    assert_eq!(
        error,
        RootWorkLoopRootUnmountExecutionError::MountRootMismatch {
            expected: first_root,
            actual: second_root,
        }
    );
    assert_eq!(host.operations(), operations_before_unmount);
    assert_eq!(
        store.root(first_root).unwrap().current(),
        first_current_after_mount
    );
}

#[test]
fn root_work_loop_root_unmount_rejects_double_unmount_and_render_after_unmount_before_host_call() {
    let (mut store, root_id, mut host) = root_store();
    let mut mounted =
        mount_one_level_root_host_output_for_unmount(&mut store, &mut host, root_id, 86_230);
    update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
    let unmount_render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    let execution = execute_root_unmount_from_mounted_one_level_output(
        &mut store,
        &mut host,
        unmount_render,
        &mounted.complete_work,
        &mut mounted.host_work,
        ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER + 40,
        ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER + 40,
    )
    .unwrap();
    let operations_after_unmount = host.operations();

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
    assert_eq!(host.operations(), operations_after_unmount);

    update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
    let render_after_unmount =
        render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    let render_after_error = execute_root_unmount_from_mounted_one_level_output(
        &mut store,
        &mut host,
        render_after_unmount,
        &mounted.complete_work,
        &mut mounted.host_work,
        ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER + 41,
        ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER + 41,
    )
    .unwrap_err();

    assert!(matches!(
        render_after_error,
        RootWorkLoopRootUnmountExecutionError::AlreadyUnmounted { root, .. }
            if root == root_id
    ));
    assert_eq!(host.operations(), operations_after_unmount);
}
