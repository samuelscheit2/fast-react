use super::helpers::*;
use super::*;

#[test]
fn host_work_applies_root_text_deletion_record_to_test_container_without_cleanup() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(72));
    let child = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "deleted",
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

    update_container(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(delete_render.finished_work(), child)
        .unwrap();
    let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().fiber(), child);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::RemoveChildFromContainer
        )
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(
        detached_hosts
            .text(store.fiber_arena().get(child).unwrap().state_node())
            .unwrap()
            .text(),
        "deleted"
    );
    assert!(
        host.operations()
            .ends_with(&["append_child_to_container", "remove_child_from_container"])
    );
}
#[test]
fn host_work_applies_host_parent_text_deletion_record_without_cleanup() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(73));
    let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "nested",
    );
    let parent_state_node = store
        .fiber_arena()
        .get(current_parent)
        .unwrap()
        .state_node();
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(74), None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = delete_host_text_under_host_parent_for_commit(
        &mut store,
        delete_render.finished_work(),
        current_parent,
        current_text,
    );
    let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().parent(), work_parent);
    assert_eq!(
        apply.records()[0].mutation().parent_state_node(),
        parent_state_node
    );
    assert_eq!(apply.records()[0].mutation().fiber(), current_text);
    assert_eq!(apply.records()[0].mutation().state_node(), text_state_node);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(
        detached_hosts.text(text_state_node).unwrap().text(),
        "nested"
    );
    assert!(
        detached_hosts
            .instance(parent_state_node)
            .unwrap()
            .children()
            .contains(&FakeHostChild::Text(
                detached_hosts.text(text_state_node).unwrap().id()
            ))
    );
    assert!(
        host.operations()
            .ends_with(&["append_child_to_container", "remove_child"])
    );
}
#[test]
fn host_work_applies_host_component_subtree_deletion_cleanup_with_ref_evidence() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(84));
    let (current_outer, current_inner, current_text) =
        attach_detached_nested_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "deleted subtree",
        );
    let outer_state_node = store.fiber_arena().get(current_outer).unwrap().state_node();
    let inner_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let inner_host_child =
        FakeHostChild::Instance(detached_hosts.instance(inner_state_node).unwrap().id());
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let deleted_ref = RefHandle::from_raw(9_500);
    store
        .fiber_arena_mut()
        .get_mut(current_inner)
        .unwrap()
        .set_ref_handle(deleted_ref);

    update_container(&mut store, root_id, RootElementHandle::from_raw(85), None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_outer = delete_host_component_under_host_parent_for_commit(
        &mut store,
        delete_render.finished_work(),
        current_outer,
        current_inner,
    );
    let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    let operations_before_apply = host.operations();
    let mutation_apply = apply_test_host_root_commit_mutations(
        &mut store,
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

    assert_eq!(mutation_apply.records().len(), 1);
    assert_eq!(mutation_apply.records()[0].mutation().parent(), work_outer);
    assert_eq!(
        mutation_apply.records()[0].mutation().parent_state_node(),
        outer_state_node
    );
    assert_eq!(
        mutation_apply.records()[0].mutation().fiber(),
        current_inner
    );
    assert_eq!(
        mutation_apply.records()[0].mutation().state_node(),
        inner_state_node
    );
    assert_eq!(
        mutation_apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(
        mutation_apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );

    assert_eq!(cleanup_apply.root(), root_id);
    assert_eq!(cleanup_apply.finished_work(), delete_commit.finished_work());
    assert_eq!(cleanup_apply.records().len(), 2);
    assert_eq!(cleanup_apply.applied_record_count(), 2);
    assert_eq!(cleanup_apply.detached_instance_count(), 1);
    assert_eq!(cleanup_apply.records()[0].cleanup().fiber(), current_text);
    assert_eq!(
        cleanup_apply.records()[0].cleanup().token_target(),
        HostFiberTokenTarget::TextInstance
    );
    assert_eq!(
        cleanup_apply.records()[0].status(),
        TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::InvalidateDeletedText
        )
    );
    assert_eq!(
        cleanup_apply.records()[0]
            .previous_metadata()
            .unwrap()
            .fiber_id(),
        current_text
    );
    assert_eq!(
        cleanup_apply.records()[0]
            .previous_metadata()
            .unwrap()
            .target(),
        HostFiberTokenTarget::TextInstance
    );
    assert_eq!(cleanup_apply.records()[1].cleanup().fiber(), current_inner);
    assert_eq!(
        cleanup_apply.records()[1].cleanup().token_target(),
        HostFiberTokenTarget::Instance
    );
    assert_eq!(
        cleanup_apply.records()[1].status(),
        TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::DetachDeletedInstance
        )
    );
    assert_eq!(
        cleanup_apply.records()[1]
            .previous_metadata()
            .unwrap()
            .fiber_id(),
        current_inner
    );
    assert_eq!(
        cleanup_apply.records()[1]
            .previous_metadata()
            .unwrap()
            .target(),
        HostFiberTokenTarget::Instance
    );

    assert!(
        !detached_hosts
            .text_metadata(text_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        !detached_hosts
            .instance_metadata(inner_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        detached_hosts
            .nodes
            .text(
                text_state_node,
                detached_hosts
                    .scope(text_state_node, HostFiberTokenTarget::TextInstance)
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
                inner_state_node,
                detached_hosts
                    .scope(inner_state_node, HostFiberTokenTarget::Instance)
                    .unwrap()
            )
            .unwrap_err()
            .violation(),
        HostNodeViolation::Stale
    );
    assert!(
        detached_hosts
            .instance(outer_state_node)
            .unwrap()
            .children()
            .contains(&inner_host_child)
    );

    let refs = delete_commit.ref_commit_metadata();
    assert_eq!(refs.attach().len(), 0);
    assert_eq!(refs.detach().len(), 1);
    assert_eq!(refs.detach()[0].fiber(), current_inner);
    assert_eq!(refs.detach()[0].ref_handle(), deleted_ref);
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
    store
        .host_tokens()
        .validate(
            refs.detach()[0].token(),
            refs.detach()[0].root(),
            refs.detach()[0].fiber(),
            refs.detach()[0].token_phase(),
            refs.detach()[0].token_target(),
        )
        .unwrap();

    let gate = delete_commit.dom_ref_callback_commit_gate();
    assert_eq!(gate.len(), 1);
    assert_eq!(gate.records()[0].fiber(), current_inner);
    assert_eq!(gate.records()[0].token(), refs.detach()[0].token());
    assert!(!gate.callback_refs_invoked());
    assert!(!gate.object_refs_mutated());
    assert!(!gate.react_dom_ref_compatibility_claimed());

    let mut expected_operations = operations_before_apply;
    expected_operations.push("remove_child");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_deletion_detaches_fragment_host_child_after_cleanup_order_validation() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(86));
    let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "fragment deleted",
    );
    let parent_state_node = store
        .fiber_arena()
        .get(current_parent)
        .unwrap()
        .state_node();
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let fragment = wrap_current_host_child_in_deleted_root(
        &mut store,
        current_parent,
        current_text,
        FiberTag::Fragment,
        StateNodeHandle::NONE,
    );
    update_container(&mut store, root_id, RootElementHandle::from_raw(87), None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = delete_non_host_root_under_host_parent_for_commit(
        &mut store,
        delete_render.finished_work(),
        current_parent,
        fragment,
        None,
    );
    let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    let operations_before_detach = host.operations();
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

    assert_eq!(delete_commit.deletion_lists().len(), 1);
    assert_eq!(delete_commit.deletion_lists()[0].deleted(), &[fragment]);
    assert_eq!(delete_commit.mutation_apply_log().records().len(), 1);
    assert_eq!(
        delete_commit.mutation_apply_log().records()[0].kind(),
        HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
    );
    assert_eq!(
        delete_commit
            .deletion_cleanup_order_gate_for_canary()
            .host_node_cleanup_count(),
        1
    );

    assert_eq!(detach_apply.root(), root_id);
    assert_eq!(detach_apply.finished_work(), delete_commit.finished_work());
    assert_eq!(
        detach_apply.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert!(!detach_apply.public_unmount_compatibility_claimed());
    assert!(!detach_apply.broad_host_teardown_enabled());
    let plan = detach_apply.plan();
    assert_eq!(plan.deleted_root(), fragment);
    assert_eq!(plan.deleted_root_tag(), FiberTag::Fragment);
    assert_eq!(plan.parent(), work_parent);
    assert_eq!(plan.host_parent(), work_parent);
    assert_eq!(plan.host_parent_state_node(), parent_state_node);
    assert_eq!(plan.host_child(), current_text);
    assert_eq!(plan.host_child_tag(), FiberTag::HostText);
    assert_eq!(plan.host_child_state_node(), text_state_node);
    assert_eq!(plan.host_child_traversal_depth(), 1);
    assert_eq!(plan.cleanup_sequence(), 0);
    assert_eq!(plan.cleanup_order_sequence(), 0);

    assert_eq!(cleanup_apply.records().len(), 1);
    assert_eq!(cleanup_apply.records()[0].cleanup().fiber(), current_text);
    assert_eq!(
        cleanup_apply.records()[0].status(),
        TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::InvalidateDeletedText
        )
    );
    assert!(
        !detached_hosts
            .text_metadata(text_state_node)
            .unwrap()
            .is_active()
    );

    let mut expected_operations = operations_before_detach;
    expected_operations.push("remove_child");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_deletion_rejects_portal_and_suspense_roots_for_subtree_host_detachment() {
    for blocked_tag in [FiberTag::Portal, FiberTag::Suspense] {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(88));
        let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "blocked deleted root",
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let deleted_root = wrap_current_host_child_in_deleted_root(
            &mut store,
            current_parent,
            current_text,
            blocked_tag,
            if blocked_tag == FiberTag::Portal {
                StateNodeHandle::from_raw(9_090)
            } else {
                StateNodeHandle::NONE
            },
        );
        update_container(&mut store, root_id, RootElementHandle::from_raw(89), None).unwrap();
        let delete_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        delete_non_host_root_under_host_parent_for_commit(
            &mut store,
            delete_render.finished_work(),
            current_parent,
            deleted_root,
            None,
        );
        let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
        let operations_before_detach = host.operations();

        let error = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
            &store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap_err();

        match (blocked_tag, error) {
            (
                FiberTag::Portal,
                HostWorkError::DeletionSubtreeHostDetachmentPlan(
                    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::PortalDeletedRootBlocked {
                        deleted_root: actual,
                        ..
                    },
                ),
            ) => assert_eq!(actual, deleted_root),
            (
                FiberTag::Suspense,
                HostWorkError::DeletionSubtreeHostDetachmentPlan(
                    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::SuspenseDeletedRootBlocked {
                        deleted_root: actual,
                        tag,
                        ..
                    },
                ),
            ) => {
                assert_eq!(actual, deleted_root);
                assert_eq!(tag, FiberTag::Suspense);
            }
            (_, other) => panic!("unexpected detachment error: {other:?}"),
        }
        assert_eq!(host.operations(), operations_before_detach);
    }
}
#[test]
fn host_work_deletion_rejects_nested_portal_and_suspense_boundaries_before_detachment() {
    for blocked_tag in [FiberTag::Portal, FiberTag::Suspense] {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(94));
        let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "nested blocked boundary",
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let blocked = wrap_current_host_child_in_deleted_root(
            &mut store,
            current_parent,
            current_text,
            blocked_tag,
            if blocked_tag == FiberTag::Portal {
                StateNodeHandle::from_raw(9_091)
            } else {
                StateNodeHandle::NONE
            },
        );
        let fragment = wrap_current_host_child_in_deleted_root(
            &mut store,
            current_parent,
            blocked,
            FiberTag::Fragment,
            StateNodeHandle::NONE,
        );
        update_container(&mut store, root_id, RootElementHandle::from_raw(95), None).unwrap();
        let delete_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        delete_non_host_root_under_host_parent_for_commit(
            &mut store,
            delete_render.finished_work(),
            current_parent,
            fragment,
            None,
        );
        let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
        let operations_before_detach = host.operations();

        let error = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
            &store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap_err();

        match (blocked_tag, error) {
            (
                FiberTag::Portal,
                HostWorkError::DeletionSubtreeHostDetachmentPlan(
                    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::PortalDeletedSubtreeBlocked {
                        deleted_root,
                        portal,
                        ..
                    },
                ),
            ) => {
                assert_eq!(deleted_root, fragment);
                assert_eq!(portal, blocked);
            }
            (
                FiberTag::Suspense,
                HostWorkError::DeletionSubtreeHostDetachmentPlan(
                    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::SuspenseDeletedSubtreeBlocked {
                        deleted_root,
                        fiber,
                        tag,
                        ..
                    },
                ),
            ) => {
                assert_eq!(deleted_root, fragment);
                assert_eq!(fiber, blocked);
                assert_eq!(tag, FiberTag::Suspense);
            }
            (_, other) => panic!("unexpected nested boundary error: {other:?}"),
        }
        assert_eq!(host.operations(), operations_before_detach);
    }
}
#[test]
fn host_work_deletion_rejects_stale_deleted_host_child_before_detachment() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(90));
    let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "stale deleted root",
    );
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let fragment = wrap_current_host_child_in_deleted_root(
        &mut store,
        current_parent,
        current_text,
        FiberTag::Fragment,
        StateNodeHandle::NONE,
    );
    update_container(&mut store, root_id, RootElementHandle::from_raw(91), None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    delete_non_host_root_under_host_parent_for_commit(
        &mut store,
        delete_render.finished_work(),
        current_parent,
        fragment,
        None,
    );
    let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    apply_test_host_root_deletion_cleanup(&store, &mut host, &delete_commit, &mut detached_hosts)
        .unwrap();
    let operations_before_detach = host.operations();

    let error = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
        &store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert!(
        !detached_hosts
            .text_metadata(text_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(host.operations(), operations_before_detach);
    match error {
        HostWorkError::HostNode(error) => {
            assert_eq!(error.violation(), HostNodeViolation::Stale);
        }
        other => panic!("unexpected stale detachment error: {other:?}"),
    }
}
#[test]
fn host_work_deletion_rejects_wrong_parent_handle_for_subtree_host_detachment() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(92));
    let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "wrong parent",
    );
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let fragment = wrap_current_host_child_in_deleted_root(
        &mut store,
        current_parent,
        current_text,
        FiberTag::Fragment,
        StateNodeHandle::NONE,
    );
    update_container(&mut store, root_id, RootElementHandle::from_raw(93), None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    delete_non_host_root_under_host_parent_for_commit(
        &mut store,
        delete_render.finished_work(),
        current_parent,
        fragment,
        Some(text_state_node),
    );
    let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    let operations_before_detach = host.operations();

    let error = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
        &store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert_eq!(host.operations(), operations_before_detach);
    match error {
        HostWorkError::HostNode(error) => {
            assert_eq!(error.violation(), HostNodeViolation::WrongTarget);
        }
        other => panic!("unexpected wrong-parent detachment error: {other:?}"),
    }
}
#[test]
fn host_work_leaves_host_parent_deletion_recorded_only_without_host_handles() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(75));
    let mode = store
        .fiber_arena()
        .get(render.finished_work())
        .unwrap()
        .mode();
    let parent = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9030),
        mode,
    );
    let deleted = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9031),
        mode,
    );
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(parent, deleted)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[parent])
        .unwrap();
    complete_host_root(&mut store, render.finished_work()).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let operations_before_apply = host.operations();
    let apply =
        apply_test_host_root_commit_mutations(&mut store, &mut host, &commit, &mut detached_hosts)
            .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::RecordedOnly
    );
    assert_eq!(apply.applied_host_call_count(), 0);
    assert_eq!(host.operations(), operations_before_apply);
}
