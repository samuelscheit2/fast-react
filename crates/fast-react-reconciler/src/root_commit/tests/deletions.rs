use super::helpers::*;
use super::*;

#[test]
fn root_commit_records_deletion_cleanup_metadata_in_child_before_parent_order() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let fixture = attach_deletion_metadata_fixture(&mut store, render.finished_work());

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let deletion_lists = commit.deletion_lists();
    let apply_records = commit.mutation_apply_log().records();
    let cleanup_log = commit.host_node_deletion_cleanup_log();
    let cleanup_records = cleanup_log.records();

    assert_eq!(deletion_lists.len(), 2);
    assert_eq!(deletion_lists[0].parent(), fixture.first_parent);
    assert_eq!(deletion_lists[0].list(), fixture.first_list);
    assert_eq!(
        deletion_lists[0].deleted(),
        &[
            fixture.second_deleted,
            fixture.first_deleted,
            fixture.nested_deleted_component,
        ]
    );
    assert_eq!(deletion_lists[1].parent(), fixture.second_parent);
    assert_eq!(deletion_lists[1].list(), fixture.second_list);
    assert_eq!(deletion_lists[1].deleted(), &[fixture.third_deleted]);
    assert_eq!(apply_records.len(), 4);
    assert_eq!(
        apply_records[0].source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.first_list)
    );
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(apply_records[0].parent(), fixture.first_parent);
    assert_eq!(
        apply_records[0].parent_state_node(),
        fixture.first_parent_state_node
    );
    assert_eq!(apply_records[0].fiber(), fixture.second_deleted);
    assert_eq!(
        apply_records[0].state_node(),
        fixture.second_deleted_state_node
    );
    assert_eq!(apply_records[1].fiber(), fixture.first_deleted);
    assert_eq!(
        apply_records[1].parent_state_node(),
        fixture.first_parent_state_node
    );
    assert_eq!(
        apply_records[1].state_node(),
        fixture.first_deleted_state_node
    );
    assert_eq!(
        apply_records[2].source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.first_list)
    );
    assert_eq!(apply_records[2].parent(), fixture.first_parent);
    assert_eq!(
        apply_records[2].kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(
        apply_records[2].parent_state_node(),
        fixture.first_parent_state_node
    );
    assert_eq!(apply_records[2].fiber(), fixture.nested_deleted_component);
    assert_eq!(
        apply_records[2].state_node(),
        fixture.nested_deleted_component_state_node
    );
    assert_eq!(
        apply_records[3].source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.second_list)
    );
    assert_eq!(apply_records[3].parent(), fixture.second_parent);
    assert_eq!(
        apply_records[3].parent_state_node(),
        fixture.second_parent_state_node
    );
    assert_eq!(apply_records[3].fiber(), fixture.third_deleted);
    assert_eq!(
        apply_records[3].state_node(),
        fixture.third_deleted_state_node
    );
    assert_eq!(cleanup_log.root(), root_id);
    assert_eq!(cleanup_log.finished_work(), render.finished_work());
    assert_eq!(cleanup_log.len(), 5);
    assert!(!cleanup_log.ref_detach_executed());
    assert!(!cleanup_log.passive_effects_flushed());
    assert!(!cleanup_log.public_unmount_compatibility_claimed());
    assert_eq!(cleanup_records[0].sequence(), 0);
    assert_eq!(cleanup_records[0].deletion_list(), fixture.first_list);
    assert_eq!(cleanup_records[0].deletion_list_index(), 0);
    assert_eq!(cleanup_records[0].deleted_index(), 0);
    assert_eq!(cleanup_records[0].subtree_index(), 0);
    assert_eq!(cleanup_records[0].parent(), fixture.first_parent);
    assert_eq!(cleanup_records[0].parent_tag(), FiberTag::HostComponent);
    assert_eq!(cleanup_records[0].host_parent(), Some(fixture.first_parent));
    assert_eq!(
        cleanup_records[0].host_parent_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(
        cleanup_records[0].host_parent_state_node(),
        fixture.first_parent_state_node
    );
    assert_eq!(cleanup_records[0].host_parent_traversal_depth(), Some(0));
    assert_eq!(cleanup_records[0].deleted_root(), fixture.second_deleted);
    assert_eq!(cleanup_records[0].fiber(), fixture.second_deleted);
    assert_eq!(cleanup_records[0].tag(), FiberTag::HostText);
    assert_eq!(
        cleanup_records[0].state_node(),
        fixture.second_deleted_state_node
    );
    assert_eq!(
        cleanup_records[0].token_phase(),
        HostFiberTokenPhase::Deletion
    );
    assert_eq!(
        cleanup_records[0].token_target(),
        HostFiberTokenTarget::TextInstance
    );
    assert_eq!(cleanup_records[1].sequence(), 1);
    assert_eq!(cleanup_records[1].deletion_list(), fixture.first_list);
    assert_eq!(cleanup_records[1].deletion_list_index(), 0);
    assert_eq!(cleanup_records[1].deleted_index(), 1);
    assert_eq!(cleanup_records[1].subtree_index(), 0);
    assert_eq!(cleanup_records[1].deleted_root(), fixture.first_deleted);
    assert_eq!(cleanup_records[1].fiber(), fixture.first_deleted);
    assert_eq!(
        cleanup_records[1].state_node(),
        fixture.first_deleted_state_node
    );
    assert_eq!(cleanup_records[2].sequence(), 2);
    assert_eq!(cleanup_records[2].deletion_list(), fixture.first_list);
    assert_eq!(cleanup_records[2].deletion_list_index(), 0);
    assert_eq!(cleanup_records[2].deleted_index(), 2);
    assert_eq!(cleanup_records[2].subtree_index(), 0);
    assert_eq!(cleanup_records[2].parent(), fixture.first_parent);
    assert_eq!(
        cleanup_records[2].deleted_root(),
        fixture.nested_deleted_component
    );
    assert_eq!(cleanup_records[2].fiber(), fixture.nested_deleted_text);
    assert_eq!(cleanup_records[2].tag(), FiberTag::HostText);
    assert_eq!(
        cleanup_records[2].state_node(),
        fixture.nested_deleted_text_state_node
    );
    assert_eq!(
        cleanup_records[2].token_target(),
        HostFiberTokenTarget::TextInstance
    );
    assert_eq!(cleanup_records[3].sequence(), 3);
    assert_eq!(cleanup_records[3].deletion_list(), fixture.first_list);
    assert_eq!(cleanup_records[3].deletion_list_index(), 0);
    assert_eq!(cleanup_records[3].deleted_index(), 2);
    assert_eq!(cleanup_records[3].subtree_index(), 1);
    assert_eq!(cleanup_records[3].parent(), fixture.first_parent);
    assert_eq!(
        cleanup_records[3].deleted_root(),
        fixture.nested_deleted_component
    );
    assert_eq!(cleanup_records[3].fiber(), fixture.nested_deleted_component);
    assert_eq!(cleanup_records[3].tag(), FiberTag::HostComponent);
    assert_eq!(
        cleanup_records[3].state_node(),
        fixture.nested_deleted_component_state_node
    );
    assert_eq!(
        cleanup_records[3].token_target(),
        HostFiberTokenTarget::Instance
    );
    assert_eq!(cleanup_records[4].sequence(), 4);
    assert_eq!(cleanup_records[4].deletion_list(), fixture.second_list);
    assert_eq!(cleanup_records[4].deletion_list_index(), 1);
    assert_eq!(cleanup_records[4].deleted_index(), 0);
    assert_eq!(cleanup_records[4].subtree_index(), 0);
    assert_eq!(cleanup_records[4].parent(), fixture.second_parent);
    assert_eq!(cleanup_records[4].deleted_root(), fixture.third_deleted);
    assert_eq!(cleanup_records[4].fiber(), fixture.third_deleted);
    assert_eq!(
        cleanup_records[4].state_node(),
        fixture.third_deleted_state_node
    );
    let refs = commit.ref_commit_metadata();
    let gate = commit.dom_ref_callback_commit_gate();
    assert_eq!(refs.attach().len(), 0);
    assert_eq!(refs.detach().len(), 1);
    assert_eq!(refs.detach()[0].fiber(), fixture.nested_deleted_component);
    assert_eq!(
        refs.detach()[0].state_node(),
        fixture.nested_deleted_component_state_node
    );
    assert_eq!(
        refs.detach()[0].ref_handle(),
        fixture.nested_deleted_component_ref
    );
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
    assert_dom_ref_callback_gate_is_inert(gate);
    assert_eq!(gate.len(), 1);
    assert_eq!(gate.records()[0].sequence(), 0);
    assert_eq!(gate.records()[0].fiber(), fixture.nested_deleted_component);
    assert_eq!(gate.records()[0].token(), refs.detach()[0].token());
    assert_eq!(gate.records()[0].action(), HostRootRefCommitAction::Detach);
    assert_eq!(
        gate.records()[0].detach_reason(),
        Some(HostRootRefDetachReason::Deleted)
    );
    for record in cleanup_records {
        store
            .host_tokens()
            .validate(
                record.token(),
                record.root(),
                record.fiber(),
                record.token_phase(),
                record.token_target(),
            )
            .unwrap();
    }
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert!(
        store
            .fiber_arena()
            .deletion_list(fixture.first_list)
            .is_some()
    );
    assert!(
        store
            .fiber_arena()
            .deletion_list(fixture.second_list)
            .is_some()
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.first_parent)
            .unwrap()
            .deletions(),
        Some(fixture.first_list)
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_deletion_cleanup_finds_nearest_host_root_parent_through_function_component() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let host_root_state_node = store.fiber_arena().get(finished_work).unwrap().state_node();
    let fixture = attach_function_component_deletion_host_parent_fixture(&mut store, finished_work);

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let deletion_lists = commit.deletion_lists();
    let apply_records = commit.mutation_apply_log().records();
    let cleanup_records = commit.host_node_deletion_cleanup_log().records();

    assert_eq!(deletion_lists.len(), 1);
    assert_eq!(deletion_lists[0].parent(), fixture.owner);
    assert_eq!(deletion_lists[0].list(), fixture.list);
    assert_eq!(
        deletion_lists[0].deleted(),
        &[fixture.deleted_text, fixture.deleted_component]
    );

    assert_eq!(apply_records.len(), 2);
    assert_eq!(
        apply_records[0].source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.list)
    );
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    assert_eq!(apply_records[0].parent(), finished_work);
    assert_eq!(apply_records[0].parent_tag(), FiberTag::HostRoot);
    assert_eq!(apply_records[0].parent_state_node(), host_root_state_node);
    assert_eq!(apply_records[0].fiber(), fixture.deleted_text);
    assert_eq!(
        apply_records[0].state_node(),
        fixture.deleted_text_state_node
    );
    assert_eq!(
        apply_records[1].kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    assert_eq!(apply_records[1].parent(), finished_work);
    assert_eq!(apply_records[1].parent_tag(), FiberTag::HostRoot);
    assert_eq!(apply_records[1].fiber(), fixture.deleted_component);
    assert_eq!(
        apply_records[1].state_node(),
        fixture.deleted_component_state_node
    );

    assert_eq!(cleanup_records.len(), 3);
    assert_eq!(cleanup_records[0].sequence(), 0);
    assert_eq!(cleanup_records[0].deletion_list_index(), 0);
    assert_eq!(cleanup_records[0].deleted_index(), 0);
    assert_eq!(cleanup_records[0].subtree_index(), 0);
    assert_eq!(cleanup_records[0].parent(), fixture.owner);
    assert_eq!(cleanup_records[0].parent_tag(), FiberTag::FunctionComponent);
    assert_eq!(cleanup_records[0].host_parent(), Some(finished_work));
    assert_eq!(
        cleanup_records[0].host_parent_tag(),
        Some(FiberTag::HostRoot)
    );
    assert_eq!(
        cleanup_records[0].host_parent_state_node(),
        host_root_state_node
    );
    assert_eq!(cleanup_records[0].host_parent_traversal_depth(), Some(1));
    assert_eq!(cleanup_records[0].deleted_root(), fixture.deleted_text);
    assert_eq!(cleanup_records[0].fiber(), fixture.deleted_text);
    assert_eq!(cleanup_records[0].tag(), FiberTag::HostText);

    assert_eq!(cleanup_records[1].sequence(), 1);
    assert_eq!(cleanup_records[1].deleted_index(), 1);
    assert_eq!(cleanup_records[1].subtree_index(), 0);
    assert_eq!(cleanup_records[1].parent(), fixture.owner);
    assert_eq!(cleanup_records[1].host_parent(), Some(finished_work));
    assert_eq!(cleanup_records[1].host_parent_traversal_depth(), Some(1));
    assert_eq!(cleanup_records[1].deleted_root(), fixture.deleted_component);
    assert_eq!(cleanup_records[1].fiber(), fixture.nested_text);
    assert_eq!(cleanup_records[1].tag(), FiberTag::HostText);
    assert_eq!(
        cleanup_records[1].state_node(),
        fixture.nested_text_state_node
    );

    assert_eq!(cleanup_records[2].sequence(), 2);
    assert_eq!(cleanup_records[2].deleted_index(), 1);
    assert_eq!(cleanup_records[2].subtree_index(), 1);
    assert_eq!(cleanup_records[2].parent(), fixture.owner);
    assert_eq!(cleanup_records[2].host_parent(), Some(finished_work));
    assert_eq!(cleanup_records[2].host_parent_traversal_depth(), Some(1));
    assert_eq!(cleanup_records[2].deleted_root(), fixture.deleted_component);
    assert_eq!(cleanup_records[2].fiber(), fixture.deleted_component);
    assert_eq!(cleanup_records[2].tag(), FiberTag::HostComponent);
    assert_eq!(
        cleanup_records[2].state_node(),
        fixture.deleted_component_state_node
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_deletion_host_parent_traversal_keeps_fragment_and_portal_blocked() {
    for blocker_tag in [FiberTag::Fragment, FiberTag::Portal] {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(47), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let owner = create_test_fiber(&mut store, blocker_tag, 501);
        let deleted_text = create_test_fiber(&mut store, FiberTag::HostText, 502);
        let deleted_text_state_node = StateNodeHandle::from_raw(8502);
        store
            .fiber_arena_mut()
            .get_mut(deleted_text)
            .unwrap()
            .set_state_node(deleted_text_state_node);
        store
            .fiber_arena_mut()
            .set_children(owner, &[deleted_text])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[owner])
            .unwrap();
        let list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(owner, deleted_text)
            .unwrap();
        bubble_test_fiber(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let apply_records = commit.mutation_apply_log().records();
        let cleanup_records = commit.host_node_deletion_cleanup_log().records();

        assert_eq!(commit.deletion_lists().len(), 1);
        assert_eq!(commit.deletion_lists()[0].parent(), owner);
        assert_eq!(commit.deletion_lists()[0].list(), list);
        assert_eq!(apply_records.len(), 1);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
        );
        assert_eq!(apply_records[0].parent(), owner);
        assert_eq!(apply_records[0].parent_tag(), blocker_tag);
        assert_eq!(apply_records[0].fiber(), deleted_text);
        assert_eq!(cleanup_records.len(), 1);
        assert_eq!(cleanup_records[0].parent(), owner);
        assert_eq!(cleanup_records[0].parent_tag(), blocker_tag);
        assert_eq!(cleanup_records[0].host_parent(), None);
        assert_eq!(cleanup_records[0].host_parent_tag(), None);
        assert_eq!(
            cleanup_records[0].host_parent_state_node(),
            StateNodeHandle::NONE
        );
        assert_eq!(cleanup_records[0].host_parent_traversal_depth(), None);
        assert_eq!(cleanup_records[0].fiber(), deleted_text);
        assert_eq!(cleanup_records[0].state_node(), deleted_text_state_node);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }
}
#[test]
fn root_commit_deletion_subtree_host_detachment_plan_validates_single_fragment_host_child() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(49), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let owner = create_test_fiber(&mut store, FiberTag::HostComponent, 9_530);
    let fragment = create_test_fiber(&mut store, FiberTag::Fragment, 9_531);
    let text = create_test_fiber(&mut store, FiberTag::HostText, 9_532);
    let owner_state_node = StateNodeHandle::from_raw(9_540);
    let text_state_node = StateNodeHandle::from_raw(9_541);

    store
        .fiber_arena_mut()
        .get_mut(owner)
        .unwrap()
        .set_state_node(owner_state_node);
    store
        .fiber_arena_mut()
        .get_mut(text)
        .unwrap()
        .set_state_node(text_state_node);
    store
        .fiber_arena_mut()
        .set_children(fragment, &[text])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(owner, &[fragment])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[owner])
        .unwrap();
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(owner, fragment)
        .unwrap();
    bubble_test_fiber(&mut store, render.finished_work());

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let plan = commit
        .deletion_subtree_host_detachment_plan_for_canary()
        .unwrap();

    assert_eq!(commit.deletion_lists().len(), 1);
    assert_eq!(commit.deletion_lists()[0].list(), deletion_list);
    assert_eq!(commit.deletion_lists()[0].deleted(), &[fragment]);
    assert_eq!(commit.host_node_deletion_cleanup_log().len(), 1);
    assert_eq!(
        commit
            .deletion_cleanup_order_gate_for_canary()
            .host_node_cleanup_count(),
        1
    );
    assert_eq!(plan.root(), root_id);
    assert_eq!(plan.finished_work(), render.finished_work());
    assert_eq!(plan.deletion_list(), deletion_list);
    assert_eq!(plan.deletion_list_index(), 0);
    assert_eq!(plan.deleted_index(), 0);
    assert_eq!(plan.deleted_root(), fragment);
    assert_eq!(plan.deleted_root_tag(), FiberTag::Fragment);
    assert_eq!(plan.parent(), owner);
    assert_eq!(plan.parent_tag(), FiberTag::HostComponent);
    assert_eq!(plan.host_parent(), owner);
    assert_eq!(plan.host_parent_state_node(), owner_state_node);
    assert_eq!(plan.host_parent_traversal_depth(), 0);
    assert_eq!(plan.host_child(), text);
    assert_eq!(plan.host_child_tag(), FiberTag::HostText);
    assert_eq!(plan.host_child_state_node(), text_state_node);
    assert_eq!(plan.host_child_traversal_depth(), 1);
    assert_eq!(plan.cleanup_sequence(), 0);
    assert_eq!(plan.cleanup_order_sequence(), 0);
    assert!(!plan.public_unmount_compatibility_claimed());
    assert!(!plan.broad_host_teardown_enabled());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_deletion_subtree_traversal_gate_records_fragment_and_portal_deleted_roots() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(49), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let owner = create_test_fiber(&mut store, FiberTag::HostComponent, 9_500);
    let fragment = create_test_fiber(&mut store, FiberTag::Fragment, 9_501);
    let fragment_text = create_test_fiber(&mut store, FiberTag::HostText, 9_502);
    let portal = create_test_fiber(&mut store, FiberTag::Portal, 9_503);
    let portal_host = create_test_fiber(&mut store, FiberTag::HostComponent, 9_504);
    let portal_text = create_test_fiber(&mut store, FiberTag::HostText, 9_505);
    let owner_state_node = StateNodeHandle::from_raw(9_600);
    let fragment_text_state_node = StateNodeHandle::from_raw(9_601);
    let portal_container_state_node = StateNodeHandle::from_raw(9_602);
    let portal_host_state_node = StateNodeHandle::from_raw(9_603);
    let portal_text_state_node = StateNodeHandle::from_raw(9_604);

    {
        let node = store.fiber_arena_mut().get_mut(owner).unwrap();
        node.set_state_node(owner_state_node);
        node.set_memoized_props(PropsHandle::from_raw(9_500));
    }
    store
        .fiber_arena_mut()
        .get_mut(fragment_text)
        .unwrap()
        .set_state_node(fragment_text_state_node);
    {
        let node = store.fiber_arena_mut().get_mut(portal).unwrap();
        node.set_state_node(portal_container_state_node);
        node.set_memoized_props(PropsHandle::from_raw(9_503));
    }
    {
        let node = store.fiber_arena_mut().get_mut(portal_host).unwrap();
        node.set_state_node(portal_host_state_node);
        node.set_memoized_props(PropsHandle::from_raw(9_504));
    }
    store
        .fiber_arena_mut()
        .get_mut(portal_text)
        .unwrap()
        .set_state_node(portal_text_state_node);
    store
        .fiber_arena_mut()
        .set_children(fragment, &[fragment_text])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(portal_host, &[portal_text])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(portal, &[portal_host])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(owner, &[fragment, portal])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[owner])
        .unwrap();
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(owner, fragment)
        .unwrap();
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(owner, portal)
        .unwrap();
    bubble_test_fiber(&mut store, render.finished_work());

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let apply_records = commit.mutation_apply_log().records();
    let cleanup_records = commit.host_node_deletion_cleanup_log().records();
    let gate = commit.deletion_subtree_traversal_gate_for_canary();
    let traversal_records = gate.records();

    assert_eq!(commit.deletion_lists().len(), 1);
    assert_eq!(commit.deletion_lists()[0].list(), deletion_list);
    assert_eq!(commit.deletion_lists()[0].deleted(), &[fragment, portal]);
    assert_eq!(apply_records.len(), 2);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
    );
    assert_eq!(apply_records[0].fiber(), fragment);
    assert_eq!(
        apply_records[1].kind(),
        HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
    );
    assert_eq!(apply_records[1].fiber(), portal);

    assert_eq!(cleanup_records.len(), 3);
    assert_eq!(cleanup_records[0].deleted_root(), fragment);
    assert_eq!(cleanup_records[0].fiber(), fragment_text);
    assert_eq!(cleanup_records[0].subtree_index(), 0);
    assert_eq!(cleanup_records[0].host_parent(), Some(owner));
    assert_eq!(
        cleanup_records[0].host_parent_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(cleanup_records[1].deleted_root(), portal);
    assert_eq!(cleanup_records[1].fiber(), portal_text);
    assert_eq!(cleanup_records[1].subtree_index(), 0);
    assert_eq!(cleanup_records[1].host_parent(), Some(owner));
    assert_eq!(cleanup_records[2].deleted_root(), portal);
    assert_eq!(cleanup_records[2].fiber(), portal_host);
    assert_eq!(cleanup_records[2].subtree_index(), 1);
    assert_eq!(cleanup_records[2].host_parent(), Some(owner));

    assert_eq!(gate.len(), 5);
    assert_eq!(gate.fragment_deleted_subtree_count(), 1);
    assert_eq!(gate.portal_deleted_subtree_count(), 1);
    assert_eq!(gate.host_node_cleanup_metadata_count(), 3);
    assert_eq!(gate.unsupported_traversal_count(), 0);
    assert!(!gate.real_fragment_dom_mutation_executed());
    assert!(!gate.real_portal_dom_mutation_executed());
    assert!(!gate.broad_deletion_traversal_enabled());
    assert!(!gate.public_unmount_compatibility_claimed());

    assert_eq!(traversal_records[0].sequence(), 0);
    assert_eq!(
        traversal_records[0].status(),
        HostRootDeletionSubtreeTraversalGateStatus::FragmentDeletedSubtreeDiagnostic
    );
    assert_eq!(
        traversal_records[0].status_name(),
        "fragment-deleted-subtree-diagnostic"
    );
    assert_eq!(traversal_records[0].deleted_root(), fragment);
    assert_eq!(traversal_records[0].fiber(), fragment);
    assert_eq!(traversal_records[0].tag_name(), "Fragment");
    assert_eq!(traversal_records[0].traversal_depth(), 0);
    assert_eq!(
        traversal_records[1].status(),
        HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata
    );
    assert_eq!(traversal_records[1].deleted_root(), fragment);
    assert_eq!(traversal_records[1].fiber(), fragment_text);
    assert_eq!(traversal_records[1].tag_name(), "HostText");
    assert_eq!(traversal_records[1].traversal_depth(), 1);
    assert_eq!(traversal_records[1].state_node(), fragment_text_state_node);
    assert_eq!(
        traversal_records[2].status(),
        HostRootDeletionSubtreeTraversalGateStatus::PortalDeletedSubtreeDiagnostic
    );
    assert_eq!(
        traversal_records[2].status_name(),
        "portal-deleted-subtree-diagnostic"
    );
    assert_eq!(traversal_records[2].deleted_root(), portal);
    assert_eq!(traversal_records[2].fiber(), portal);
    assert_eq!(traversal_records[2].tag_name(), "Portal");
    assert_eq!(
        traversal_records[2].portal_container_state_node(),
        portal_container_state_node
    );
    assert_eq!(
        traversal_records[3].status(),
        HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata
    );
    assert_eq!(traversal_records[3].fiber(), portal_text);
    assert_eq!(traversal_records[3].traversal_depth(), 2);
    assert_eq!(
        traversal_records[3].portal_container_state_node(),
        portal_container_state_node
    );
    assert_eq!(
        traversal_records[4].status(),
        HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata
    );
    assert_eq!(traversal_records[4].fiber(), portal_host);
    assert_eq!(traversal_records[4].traversal_depth(), 1);
    assert_eq!(
        traversal_records[4].portal_container_state_node(),
        portal_container_state_node
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_deletion_subtree_traversal_gate_blocks_suspense_and_offscreen_roots() {
    for (blocked_tag, expected_status, expected_feature) in [
        (
            FiberTag::Suspense,
            HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked,
            SUSPENSE_UNSUPPORTED_FEATURE,
        ),
        (
            FiberTag::Offscreen,
            HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked,
            OFFSCREEN_UNSUPPORTED_FEATURE,
        ),
    ] {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(50), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let owner = create_test_fiber(&mut store, FiberTag::HostComponent, 9_700);
        let blocked = create_test_fiber(&mut store, blocked_tag, 9_701);
        let blocked_child = create_test_fiber(&mut store, FiberTag::HostText, 9_702);
        let owner_state_node = StateNodeHandle::from_raw(9_710);
        let blocked_child_state_node = StateNodeHandle::from_raw(9_711);

        store
            .fiber_arena_mut()
            .get_mut(owner)
            .unwrap()
            .set_state_node(owner_state_node);
        store
            .fiber_arena_mut()
            .get_mut(blocked_child)
            .unwrap()
            .set_state_node(blocked_child_state_node);
        store
            .fiber_arena_mut()
            .set_children(blocked, &[blocked_child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(owner, &[blocked])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[owner])
            .unwrap();
        let deletion_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(owner, blocked)
            .unwrap();
        bubble_test_fiber(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let apply_records = commit.mutation_apply_log().records();
        let cleanup_records = commit.host_node_deletion_cleanup_log().records();
        let gate = commit.deletion_subtree_traversal_gate_for_canary();
        let records = gate.records();

        assert_eq!(commit.deletion_lists().len(), 1);
        assert_eq!(commit.deletion_lists()[0].list(), deletion_list);
        assert_eq!(commit.deletion_lists()[0].deleted(), &[blocked]);
        assert_eq!(apply_records.len(), 1);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
        );
        assert_eq!(apply_records[0].fiber(), blocked);
        assert!(cleanup_records.is_empty());

        assert_eq!(gate.len(), 1);
        assert_eq!(gate.host_node_cleanup_metadata_count(), 0);
        assert_eq!(gate.unsupported_traversal_count(), 1);
        assert_eq!(
            gate.unsupported_suspense_traversal_count(),
            usize::from(blocked_tag == FiberTag::Suspense)
        );
        assert_eq!(
            gate.unsupported_offscreen_traversal_count(),
            usize::from(blocked_tag == FiberTag::Offscreen)
        );
        assert_eq!(gate.broad_traversal_blocked_count(), 0);
        assert!(!gate.broad_deletion_traversal_enabled());
        assert!(!gate.public_unmount_compatibility_claimed());

        assert_eq!(records[0].status(), expected_status);
        assert_eq!(records[0].deleted_root(), blocked);
        assert_eq!(records[0].deleted_root_tag(), blocked_tag);
        assert_eq!(records[0].fiber(), blocked);
        assert_eq!(records[0].tag(), blocked_tag);
        assert_eq!(records[0].traversal_depth(), 0);
        assert_eq!(records[0].unsupported_feature(), Some(expected_feature));
        assert_eq!(records[0].host_parent(), Some(owner));
        assert_eq!(records[0].host_parent_tag(), Some(FiberTag::HostComponent));
        assert_eq!(records[0].host_parent_state_node(), owner_state_node);
        assert_eq!(records[0].host_parent_traversal_depth(), Some(0));
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }
}
#[test]
fn root_commit_rejects_invalid_deletion_list_before_switch_or_callback_drain() {
    let (mut store, root_id, host) = root_store();
    let callback = RootUpdateCallbackHandle::from_raw(123);
    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(46),
        Some(callback),
    )
    .unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let fixture = attach_deletion_metadata_fixture(&mut store, render.finished_work());
    let callbacks_before = store
        .update_queues()
        .peek_root_update_callback_records(render.work_in_progress_update_queue())
        .unwrap();
    let parent_node = store
        .fiber_arena_mut()
        .get_mut(fixture.first_parent)
        .unwrap();
    parent_node.set_flags(parent_node.flags() - FiberFlags::CHILD_DELETION);

    let error = commit_finished_host_root(&mut store, render).unwrap_err();
    let callbacks_after = store
        .update_queues()
        .peek_root_update_callback_records(render.work_in_progress_update_queue())
        .unwrap();

    assert!(matches!(
        error,
        RootCommitError::FiberTopology(FiberTopologyError::DeletionListMissingFlag {
            parent,
            list,
        }) if parent == fixture.first_parent && list == fixture.first_list
    ));
    assert_eq!(callback_handles(callbacks_before.visible()), vec![callback]);
    assert_eq!(callback_handles(callbacks_after.visible()), vec![callback]);
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        pending_lanes
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_placement_before_update_without_deletion_records() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(47), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let child = attach_host_root_child(
        &mut store,
        render.finished_work(),
        FiberTag::HostComponent,
        FiberFlags::PLACEMENT | FiberFlags::UPDATE | FiberFlags::CHILD_DELETION,
        StateNodeHandle::from_raw(900),
        PropsHandle::from_raw(901),
        PropsHandle::from_raw(902),
    );

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();

    assert_eq!(records.len(), 2);
    assert_eq!(
        records[0].kind(),
        HostRootMutationPhaseRecordKind::Placement
    );
    assert_eq!(records[1].kind(), HostRootMutationPhaseRecordKind::Update);
    assert_eq!(records[0].fiber(), child);
    assert_eq!(records[1].fiber(), child);
    assert_eq!(records[0].effect_flag(), FiberFlags::PLACEMENT);
    assert_eq!(records[1].effect_flag(), FiberFlags::UPDATE);
    assert_eq!(apply_records.len(), 2);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(
        apply_records[1].kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(apply_records[0].fiber(), child);
    assert_eq!(apply_records[1].fiber(), child);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
