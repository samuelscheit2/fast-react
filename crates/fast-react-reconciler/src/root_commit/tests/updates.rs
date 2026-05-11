use super::helpers::*;
use super::*;

#[test]
fn root_commit_switches_current_to_completed_host_root_wip() {
    let (mut store, root_id, host) = root_store();
    let element = RootElementHandle::from_raw(42);
    update_container(&mut store, root_id, element, None).unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let new_current = store.root(root_id).unwrap().current();

    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), previous_current);
    assert_eq!(commit.current(), render.work_in_progress());
    assert_eq!(commit.finished_work(), render.work_in_progress());
    assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(commit.remaining_lanes(), Lanes::NO);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(commit.pending_passive_handoff(), None);
    assert!(commit.function_component_layout_effects().is_empty());
    assert!(commit.mutation_log().is_empty());
    assert!(commit.mutation_apply_log().is_empty());
    assert!(commit.deletion_lists().is_empty());
    assert!(
        commit
            .deletion_subtree_traversal_gate_for_canary()
            .is_empty()
    );
    assert!(commit.host_node_deletion_cleanup_log().is_empty());
    assert!(commit.ref_commit_metadata().is_empty());
    assert!(commit.dom_ref_callback_commit_gate().is_empty());
    assert_dom_ref_callback_gate_is_inert(commit.dom_ref_callback_commit_gate());
    assert!(commit.ref_callback_execution_handoff().is_empty());
    assert_ref_callback_execution_handoff_keeps_public_blockers(
        commit.ref_callback_execution_handoff(),
    );
    assert!(commit.ref_cleanup_return_execution_gate().is_empty());
    assert_ref_cleanup_return_execution_gate_keeps_public_blockers(
        commit.ref_cleanup_return_execution_gate(),
    );
    assert!(commit.root_update_callback_invocation_gate().is_empty());
    assert_root_update_callback_invocation_gate_is_inert(
        commit.root_update_callback_invocation_gate(),
    );
    assert!(!commit.has_remaining_work());
    assert_eq!(new_current, render.work_in_progress());
    assert_eq!(host_root_element(&store, new_current), element);
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .is_empty()
    );
    assert_eq!(
        store.fiber_arena().get(new_current).unwrap().alternate(),
        Some(previous_current)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(previous_current)
            .unwrap()
            .alternate(),
        Some(new_current)
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_host_parent_text_update_apply_record_without_host_mutation() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let parent_state_node = StateNodeHandle::from_raw(730);
    let text_state_node = StateNodeHandle::from_raw(731);
    let parent_props = PropsHandle::from_raw(732);
    let old_text_props = PropsHandle::from_raw(733);
    let next_pending_props = PropsHandle::from_raw(734);
    let next_memoized_props = PropsHandle::from_raw(735);
    let current_parent = attach_host_root_child(
        &mut store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        parent_state_node,
        parent_props,
        parent_props,
    );
    let current_text = create_test_fiber(&mut store, FiberTag::HostText, old_text_props.raw());
    {
        let node = store.fiber_arena_mut().get_mut(current_text).unwrap();
        node.set_state_node(text_state_node);
        node.set_memoized_props(old_text_props);
    }
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[current_text])
        .unwrap();
    bubble_test_fiber(&mut store, current_parent);
    bubble_test_fiber(&mut store, current_root);

    update_container(&mut store, root_id, RootElementHandle::from_raw(48), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
    }
    let work_text = store
        .fiber_arena_mut()
        .create_work_in_progress(current_text, next_pending_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_text).unwrap();
        node.set_flags(FiberFlags::UPDATE);
        node.set_state_node(text_state_node);
        node.set_memoized_props(next_memoized_props);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[work_text])
        .unwrap();
    bubble_test_fiber(&mut store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_test_fiber(&mut store, render.finished_work());

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();

    assert_eq!(records.len(), 1);
    assert_eq!(records[0].parent(), work_parent);
    assert_eq!(records[0].parent_tag(), FiberTag::HostComponent);
    assert_eq!(records[0].parent_state_node(), parent_state_node);
    assert_eq!(records[0].fiber(), work_text);
    assert_eq!(records[0].alternate_fiber(), Some(current_text));
    assert_eq!(records[0].tag(), FiberTag::HostText);
    assert_eq!(records[0].kind(), HostRootMutationPhaseRecordKind::Update);
    assert_eq!(records[0].state_node(), text_state_node);
    assert_eq!(records[0].pending_props(), next_pending_props);
    assert_eq!(records[0].memoized_props(), next_memoized_props);
    assert_eq!(records[0].alternate_memoized_props(), Some(old_text_props));
    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(apply_records[0].parent(), work_parent);
    assert_eq!(apply_records[0].parent_tag(), FiberTag::HostComponent);
    assert_eq!(apply_records[0].parent_state_node(), parent_state_node);
    assert_eq!(apply_records[0].fiber(), work_text);
    assert_eq!(apply_records[0].alternate_fiber(), Some(current_text));
    assert_eq!(apply_records[0].state_node(), text_state_node);
    assert_eq!(
        commit.test_only_host_text_update_apply_count_for_canary(),
        1
    );
    assert!(commit.has_test_only_host_text_update_apply_for_canary(
        current_text,
        work_text,
        text_state_node.raw()
    ));
    assert!(!commit.has_test_only_host_text_update_apply_for_canary(
        current_text,
        work_text,
        StateNodeHandle::from_raw(9999).raw()
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_validates_host_text_update_execution_request_after_finished_work_handoff() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let parent_state_node = StateNodeHandle::from_raw(7_830);
    let text_state_node = StateNodeHandle::from_raw(7_831);
    let parent_props = PropsHandle::from_raw(7_832);
    let old_text_props = PropsHandle::from_raw(7_833);
    let next_pending_props = PropsHandle::from_raw(7_834);
    let next_memoized_props = PropsHandle::from_raw(7_835);
    let current_parent = attach_host_root_child(
        &mut store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        parent_state_node,
        parent_props,
        parent_props,
    );
    let current_text = create_test_fiber(&mut store, FiberTag::HostText, old_text_props.raw());
    {
        let node = store.fiber_arena_mut().get_mut(current_text).unwrap();
        node.set_state_node(text_state_node);
        node.set_memoized_props(old_text_props);
    }
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[current_text])
        .unwrap();
    bubble_test_fiber(&mut store, current_parent);
    bubble_test_fiber(&mut store, current_root);

    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(7_836),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
    }
    let work_text = store
        .fiber_arena_mut()
        .create_work_in_progress(current_text, next_pending_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_text).unwrap();
        node.set_flags(FiberFlags::UPDATE);
        node.set_state_node(text_state_node);
        node.set_memoized_props(next_memoized_props);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[work_text])
        .unwrap();
    bubble_test_fiber(&mut store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_test_fiber(&mut store, render.finished_work());
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, 11).unwrap();

    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        render,
        Some(pending),
        12,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 13).unwrap();

    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), current_root);
    assert_eq!(request.finished_work(), render.finished_work());
    assert_eq!(request.committed_current(), render.finished_work());
    assert_eq!(request.source_handoff_order(), 11);
    assert_eq!(request.commit_order(), 12);
    assert_eq!(request.request_order(), 13);
    assert_eq!(request.mutation_index(), 0);
    assert_eq!(
        request.status(),
        HostRootTextUpdateCommitExecutionStatusForCanary::ValidatedForTestHostMutation
    );
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_TEXT_UPDATE_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(request.private_test_host_text_mutation_allowed());
    assert!(request.committed_current_is_finished_work());
    assert!(request.previous_current_was_replaced());
    assert!(request.public_root_rendering_blocked());
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_renderer_compatibility_claimed());

    let mutation = request.mutation();
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(mutation.root(), root_id);
    assert_eq!(mutation.host_root(), render.finished_work());
    assert_eq!(mutation.parent(), work_parent);
    assert_eq!(mutation.parent_tag(), FiberTag::HostComponent);
    assert_eq!(mutation.parent_state_node(), parent_state_node);
    assert_eq!(mutation.fiber(), work_text);
    assert_eq!(mutation.alternate_fiber(), Some(current_text));
    assert_eq!(mutation.tag(), FiberTag::HostText);
    assert_eq!(mutation.state_node(), text_state_node);
    assert_eq!(mutation.effect_flag(), FiberFlags::UPDATE);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_host_parent_component_and_text_update_apply_records_without_host_mutation() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let outer_state_node = StateNodeHandle::from_raw(750);
    let inner_state_node = StateNodeHandle::from_raw(751);
    let text_state_node = StateNodeHandle::from_raw(752);
    let outer_props = PropsHandle::from_raw(753);
    let old_inner_props = PropsHandle::from_raw(754);
    let old_text_props = PropsHandle::from_raw(755);
    let next_inner_pending_props = PropsHandle::from_raw(756);
    let next_inner_memoized_props = PropsHandle::from_raw(757);
    let next_text_pending_props = PropsHandle::from_raw(758);
    let next_text_memoized_props = PropsHandle::from_raw(759);
    let current_outer = attach_host_root_child(
        &mut store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        outer_state_node,
        outer_props,
        outer_props,
    );
    let current_inner =
        create_test_fiber(&mut store, FiberTag::HostComponent, old_inner_props.raw());
    let current_text = create_test_fiber(&mut store, FiberTag::HostText, old_text_props.raw());
    {
        let node = store.fiber_arena_mut().get_mut(current_inner).unwrap();
        node.set_state_node(inner_state_node);
        node.set_memoized_props(old_inner_props);
    }
    {
        let node = store.fiber_arena_mut().get_mut(current_text).unwrap();
        node.set_state_node(text_state_node);
        node.set_memoized_props(old_text_props);
    }
    store
        .fiber_arena_mut()
        .set_children(current_inner, &[current_text])
        .unwrap();
    bubble_test_fiber(&mut store, current_inner);
    store
        .fiber_arena_mut()
        .set_children(current_outer, &[current_inner])
        .unwrap();
    bubble_test_fiber(&mut store, current_outer);
    bubble_test_fiber(&mut store, current_root);

    update_container(&mut store, root_id, RootElementHandle::from_raw(50), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_outer = store
        .fiber_arena_mut()
        .create_work_in_progress(current_outer, outer_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_outer).unwrap();
        node.set_state_node(outer_state_node);
        node.set_memoized_props(outer_props);
        node.set_lanes(Lanes::NO);
    }
    let work_inner = store
        .fiber_arena_mut()
        .create_work_in_progress(current_inner, next_inner_pending_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_inner).unwrap();
        node.set_flags(FiberFlags::UPDATE);
        node.set_state_node(inner_state_node);
        node.set_memoized_props(next_inner_memoized_props);
        node.set_lanes(Lanes::NO);
    }
    let work_text = store
        .fiber_arena_mut()
        .create_work_in_progress(current_text, next_text_pending_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_text).unwrap();
        node.set_flags(FiberFlags::UPDATE);
        node.set_state_node(text_state_node);
        node.set_memoized_props(next_text_memoized_props);
        node.set_lanes(Lanes::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(work_inner, &[work_text])
        .unwrap();
    bubble_test_fiber(&mut store, work_inner);
    store
        .fiber_arena_mut()
        .set_children(work_outer, &[work_inner])
        .unwrap();
    bubble_test_fiber(&mut store, work_outer);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_outer])
        .unwrap();
    bubble_test_fiber(&mut store, render.finished_work());

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();

    assert_eq!(records.len(), 2);
    assert_eq!(records[0].parent(), work_inner);
    assert_eq!(records[0].parent_tag(), FiberTag::HostComponent);
    assert_eq!(records[0].parent_state_node(), inner_state_node);
    assert_eq!(records[0].fiber(), work_text);
    assert_eq!(records[0].alternate_fiber(), Some(current_text));
    assert_eq!(records[0].tag(), FiberTag::HostText);
    assert_eq!(records[0].kind(), HostRootMutationPhaseRecordKind::Update);
    assert_eq!(records[0].state_node(), text_state_node);
    assert_eq!(records[0].pending_props(), next_text_pending_props);
    assert_eq!(records[0].memoized_props(), next_text_memoized_props);
    assert_eq!(records[0].alternate_memoized_props(), Some(old_text_props));
    assert_eq!(records[1].parent(), work_outer);
    assert_eq!(records[1].parent_tag(), FiberTag::HostComponent);
    assert_eq!(records[1].parent_state_node(), outer_state_node);
    assert_eq!(records[1].fiber(), work_inner);
    assert_eq!(records[1].alternate_fiber(), Some(current_inner));
    assert_eq!(records[1].tag(), FiberTag::HostComponent);
    assert_eq!(records[1].kind(), HostRootMutationPhaseRecordKind::Update);
    assert_eq!(records[1].state_node(), inner_state_node);
    assert_eq!(records[1].pending_props(), next_inner_pending_props);
    assert_eq!(records[1].memoized_props(), next_inner_memoized_props);
    assert_eq!(records[1].alternate_memoized_props(), Some(old_inner_props));
    assert_eq!(apply_records.len(), 2);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(apply_records[0].parent(), work_inner);
    assert_eq!(apply_records[0].fiber(), work_text);
    assert_eq!(apply_records[0].alternate_fiber(), Some(current_text));
    assert_eq!(apply_records[0].state_node(), text_state_node);
    assert_eq!(
        apply_records[1].kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(apply_records[1].parent(), work_outer);
    assert_eq!(apply_records[1].fiber(), work_inner);
    assert_eq!(apply_records[1].alternate_fiber(), Some(current_inner));
    assert_eq!(apply_records[1].state_node(), inner_state_node);
    assert_eq!(
        commit.test_only_host_component_update_apply_count_for_canary(),
        1
    );
    assert!(commit.has_test_only_host_component_update_apply_for_canary(
        current_inner,
        work_inner,
        inner_state_node.raw()
    ));
    assert!(
        !commit.has_test_only_host_component_update_apply_for_canary(
            current_inner,
            work_inner,
            StateNodeHandle::from_raw(9999).raw()
        )
    );
    assert_eq!(
        commit.test_only_host_text_update_apply_count_for_canary(),
        1
    );
    assert!(commit.has_test_only_host_text_update_apply_for_canary(
        current_text,
        work_text,
        text_state_node.raw()
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        commit.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_ordered_host_component_update_apply_traversal_without_host_mutation() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let outer_state_node = StateNodeHandle::from_raw(770);
    let middle_state_node = StateNodeHandle::from_raw(771);
    let inner_state_node = StateNodeHandle::from_raw(772);
    let sibling_state_node = StateNodeHandle::from_raw(773);
    let outer_old_props = PropsHandle::from_raw(774);
    let middle_old_props = PropsHandle::from_raw(775);
    let inner_old_props = PropsHandle::from_raw(776);
    let sibling_old_props = PropsHandle::from_raw(777);
    let outer_next_pending_props = PropsHandle::from_raw(778);
    let outer_next_memoized_props = PropsHandle::from_raw(779);
    let middle_next_pending_props = PropsHandle::from_raw(780);
    let middle_next_memoized_props = PropsHandle::from_raw(781);
    let inner_next_pending_props = PropsHandle::from_raw(782);
    let inner_next_memoized_props = PropsHandle::from_raw(783);
    let sibling_next_pending_props = PropsHandle::from_raw(784);
    let sibling_next_memoized_props = PropsHandle::from_raw(785);

    let current_outer = attach_host_root_child(
        &mut store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        outer_state_node,
        outer_old_props,
        outer_old_props,
    );
    let current_middle =
        create_test_fiber(&mut store, FiberTag::HostComponent, middle_old_props.raw());
    let current_inner =
        create_test_fiber(&mut store, FiberTag::HostComponent, inner_old_props.raw());
    let current_sibling =
        create_test_fiber(&mut store, FiberTag::HostComponent, sibling_old_props.raw());
    {
        let node = store.fiber_arena_mut().get_mut(current_middle).unwrap();
        node.set_state_node(middle_state_node);
        node.set_memoized_props(middle_old_props);
    }
    {
        let node = store.fiber_arena_mut().get_mut(current_inner).unwrap();
        node.set_state_node(inner_state_node);
        node.set_memoized_props(inner_old_props);
    }
    {
        let node = store.fiber_arena_mut().get_mut(current_sibling).unwrap();
        node.set_state_node(sibling_state_node);
        node.set_memoized_props(sibling_old_props);
    }
    store
        .fiber_arena_mut()
        .set_children(current_middle, &[current_inner])
        .unwrap();
    bubble_test_fiber(&mut store, current_middle);
    store
        .fiber_arena_mut()
        .set_children(current_outer, &[current_middle, current_sibling])
        .unwrap();
    bubble_test_fiber(&mut store, current_outer);
    bubble_test_fiber(&mut store, current_root);

    update_container(&mut store, root_id, RootElementHandle::from_raw(52), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_outer = prepare_host_component_update_wip(
        &mut store,
        current_outer,
        outer_state_node,
        outer_next_pending_props,
        outer_next_memoized_props,
    );
    let work_middle = prepare_host_component_update_wip(
        &mut store,
        current_middle,
        middle_state_node,
        middle_next_pending_props,
        middle_next_memoized_props,
    );
    let work_inner = prepare_host_component_update_wip(
        &mut store,
        current_inner,
        inner_state_node,
        inner_next_pending_props,
        inner_next_memoized_props,
    );
    let work_sibling = prepare_host_component_update_wip(
        &mut store,
        current_sibling,
        sibling_state_node,
        sibling_next_pending_props,
        sibling_next_memoized_props,
    );
    store
        .fiber_arena_mut()
        .set_children(work_middle, &[work_inner])
        .unwrap();
    bubble_test_fiber(&mut store, work_middle);
    store
        .fiber_arena_mut()
        .set_children(work_outer, &[work_middle, work_sibling])
        .unwrap();
    bubble_test_fiber(&mut store, work_outer);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_outer])
        .unwrap();
    bubble_test_fiber(&mut store, render.finished_work());

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();
    let diagnostics = commit.host_component_update_apply_diagnostics_for_canary();

    assert_eq!(
        records
            .iter()
            .map(|record| record.fiber())
            .collect::<Vec<_>>(),
        vec![work_inner, work_middle, work_sibling, work_outer]
    );
    assert!(
        records
            .iter()
            .all(|record| record.kind() == HostRootMutationPhaseRecordKind::Update)
    );
    assert_eq!(
        apply_records
            .iter()
            .map(|record| record.kind())
            .collect::<Vec<_>>(),
        vec![
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
        ]
    );
    assert_eq!(
        apply_records
            .iter()
            .map(|record| record.fiber())
            .collect::<Vec<_>>(),
        vec![work_inner, work_middle, work_sibling, work_outer]
    );
    assert_eq!(
        apply_records
            .iter()
            .map(|record| record.alternate_fiber())
            .collect::<Vec<_>>(),
        vec![
            Some(current_inner),
            Some(current_middle),
            Some(current_sibling),
            Some(current_outer),
        ]
    );
    assert_eq!(
        apply_records
            .iter()
            .map(|record| record.parent())
            .collect::<Vec<_>>(),
        vec![work_middle, work_outer, work_outer, render.finished_work()]
    );
    assert_eq!(diagnostics.len(), 4);
    assert_eq!(
        diagnostics
            .iter()
            .map(|diagnostic| diagnostic.sequence())
            .collect::<Vec<_>>(),
        vec![0, 1, 2, 3]
    );
    assert_eq!(
        diagnostics
            .iter()
            .map(|diagnostic| diagnostic.fiber())
            .collect::<Vec<_>>(),
        vec![work_inner, work_middle, work_sibling, work_outer]
    );
    assert_eq!(diagnostics[0].root(), root_id);
    assert_eq!(diagnostics[0].host_root(), render.finished_work());
    assert_eq!(diagnostics[0].parent(), work_middle);
    assert_eq!(diagnostics[0].parent_tag_name(), "HostComponent");
    assert_eq!(
        diagnostics[0].parent_state_node_raw(),
        middle_state_node.raw()
    );
    assert_eq!(diagnostics[0].alternate_fiber(), Some(current_inner));
    assert_eq!(diagnostics[0].tag_name(), "HostComponent");
    assert_eq!(diagnostics[0].state_node_raw(), inner_state_node.raw());
    assert_eq!(diagnostics[0].pending_props(), inner_next_pending_props);
    assert_eq!(diagnostics[0].memoized_props(), inner_next_memoized_props);
    assert_eq!(
        diagnostics[0].alternate_memoized_props(),
        Some(inner_old_props)
    );
    assert_eq!(diagnostics[0].apply_kind(), "commit-host-component-update");
    assert_eq!(diagnostics[3].parent_tag(), FiberTag::HostRoot);
    assert_eq!(diagnostics[3].parent_state_node(), StateNodeHandle::NONE);
    assert_eq!(
        commit.test_only_host_component_update_apply_count_for_canary(),
        4
    );
    assert_eq!(
        commit.test_only_host_text_update_apply_count_for_canary(),
        0
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_stops_host_component_update_traversal_at_canary_depth() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let state_nodes = [
        StateNodeHandle::from_raw(790),
        StateNodeHandle::from_raw(791),
        StateNodeHandle::from_raw(792),
        StateNodeHandle::from_raw(793),
        StateNodeHandle::from_raw(794),
    ];
    let old_props = [
        PropsHandle::from_raw(795),
        PropsHandle::from_raw(796),
        PropsHandle::from_raw(797),
        PropsHandle::from_raw(798),
        PropsHandle::from_raw(799),
    ];
    let next_pending_props = [
        PropsHandle::from_raw(800),
        PropsHandle::from_raw(801),
        PropsHandle::from_raw(802),
        PropsHandle::from_raw(803),
        PropsHandle::from_raw(804),
    ];
    let next_memoized_props = [
        PropsHandle::from_raw(805),
        PropsHandle::from_raw(806),
        PropsHandle::from_raw(807),
        PropsHandle::from_raw(808),
        PropsHandle::from_raw(809),
    ];

    let current = old_props
        .iter()
        .map(|props| create_test_fiber(&mut store, FiberTag::HostComponent, props.raw()))
        .collect::<Vec<_>>();
    for ((&fiber, &state_node), &props) in
        current.iter().zip(state_nodes.iter()).zip(old_props.iter())
    {
        let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
        node.set_state_node(state_node);
        node.set_memoized_props(props);
    }
    for index in (0..current.len() - 1).rev() {
        store
            .fiber_arena_mut()
            .set_children(current[index], &[current[index + 1]])
            .unwrap();
        bubble_test_fiber(&mut store, current[index]);
    }
    store
        .fiber_arena_mut()
        .set_children(current_root, &[current[0]])
        .unwrap();
    bubble_test_fiber(&mut store, current_root);

    update_container(&mut store, root_id, RootElementHandle::from_raw(53), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work = current
        .iter()
        .enumerate()
        .map(|(index, &fiber)| {
            prepare_host_component_update_wip(
                &mut store,
                fiber,
                state_nodes[index],
                next_pending_props[index],
                next_memoized_props[index],
            )
        })
        .collect::<Vec<_>>();
    for index in (0..work.len() - 1).rev() {
        store
            .fiber_arena_mut()
            .set_children(work[index], &[work[index + 1]])
            .unwrap();
        bubble_test_fiber(&mut store, work[index]);
    }
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work[0]])
        .unwrap();
    bubble_test_fiber(&mut store, render.finished_work());

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let diagnostics = commit.host_component_update_apply_diagnostics_for_canary();

    assert_eq!(
        diagnostics
            .iter()
            .map(|diagnostic| diagnostic.fiber())
            .collect::<Vec<_>>(),
        vec![work[3], work[2], work[1], work[0]]
    );
    assert!(
        !commit.has_test_only_host_component_update_apply_for_canary(
            current[4],
            work[4],
            state_nodes[4].raw()
        )
    );
    assert_eq!(
        commit.test_only_host_component_update_apply_count_for_canary(),
        HOST_COMPONENT_UPDATE_CANARY_MAX_HOST_COMPONENT_DEPTH
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_skips_host_text_update_under_new_host_parent_placement_boundary() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(49), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let parent_state_node = StateNodeHandle::from_raw(740);
    let text_state_node = StateNodeHandle::from_raw(741);
    let parent = create_test_fiber(&mut store, FiberTag::HostComponent, 742);
    let text = create_test_fiber(&mut store, FiberTag::HostText, 743);
    {
        let node = store.fiber_arena_mut().get_mut(parent).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(parent_state_node);
        node.set_memoized_props(PropsHandle::from_raw(742));
    }
    {
        let node = store.fiber_arena_mut().get_mut(text).unwrap();
        node.set_flags(FiberFlags::UPDATE);
        node.set_state_node(text_state_node);
        node.set_memoized_props(PropsHandle::from_raw(743));
    }
    store
        .fiber_arena_mut()
        .set_children(parent, &[text])
        .unwrap();
    bubble_test_fiber(&mut store, parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[parent])
        .unwrap();
    bubble_test_fiber(&mut store, render.finished_work());

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();

    assert_eq!(records.len(), 1);
    assert_eq!(records[0].fiber(), parent);
    assert_eq!(
        records[0].kind(),
        HostRootMutationPhaseRecordKind::Placement
    );
    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(apply_records[0].fiber(), parent);
    assert_eq!(
        commit.test_only_host_text_update_apply_count_for_canary(),
        0
    );
    assert!(!commit.has_test_only_host_text_update_apply_for_canary(
        text,
        text,
        text_state_node.raw()
    ));
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_skips_host_component_update_under_new_host_parent_placement_boundary() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(51), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let parent_state_node = StateNodeHandle::from_raw(760);
    let child_state_node = StateNodeHandle::from_raw(761);
    let parent = create_test_fiber(&mut store, FiberTag::HostComponent, 762);
    let child = create_test_fiber(&mut store, FiberTag::HostComponent, 763);
    {
        let node = store.fiber_arena_mut().get_mut(parent).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(parent_state_node);
        node.set_memoized_props(PropsHandle::from_raw(762));
    }
    {
        let node = store.fiber_arena_mut().get_mut(child).unwrap();
        node.set_flags(FiberFlags::UPDATE);
        node.set_state_node(child_state_node);
        node.set_memoized_props(PropsHandle::from_raw(763));
    }
    store
        .fiber_arena_mut()
        .set_children(parent, &[child])
        .unwrap();
    bubble_test_fiber(&mut store, parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[parent])
        .unwrap();
    bubble_test_fiber(&mut store, render.finished_work());

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();

    assert_eq!(records.len(), 1);
    assert_eq!(records[0].fiber(), parent);
    assert_eq!(
        records[0].kind(),
        HostRootMutationPhaseRecordKind::Placement
    );
    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(apply_records[0].fiber(), parent);
    assert_eq!(
        commit.test_only_host_component_update_apply_count_for_canary(),
        0
    );
    assert!(
        !commit.has_test_only_host_component_update_apply_for_canary(
            child,
            child,
            child_state_node.raw()
        )
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_host_root_child_update_metadata_without_invoking_host_commit() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let current_props = PropsHandle::from_raw(801);
    let next_pending_props = PropsHandle::from_raw(802);
    let next_memoized_props = PropsHandle::from_raw(803);
    let state_node = StateNodeHandle::from_raw(804);
    let current_child = attach_host_root_child(
        &mut store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        state_node,
        current_props,
        current_props,
    );
    update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_child = attach_host_root_child(
        &mut store,
        render.finished_work(),
        FiberTag::HostComponent,
        FiberFlags::UPDATE,
        state_node,
        next_pending_props,
        next_memoized_props,
    );
    store
        .fiber_arena_mut()
        .link_alternates(current_child, finished_child)
        .unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();

    assert_eq!(records.len(), 1);
    assert_eq!(records[0].kind(), HostRootMutationPhaseRecordKind::Update);
    assert_eq!(records[0].fiber(), finished_child);
    assert_eq!(records[0].alternate_fiber(), Some(current_child));
    assert_eq!(records[0].tag(), FiberTag::HostComponent);
    assert_eq!(records[0].state_node(), state_node);
    assert_eq!(records[0].pending_props(), next_pending_props);
    assert_eq!(records[0].memoized_props(), next_memoized_props);
    assert_eq!(records[0].alternate_memoized_props(), Some(current_props));
    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(apply_records[0].fiber(), finished_child);
    assert_eq!(apply_records[0].alternate_fiber(), Some(current_child));
    assert_eq!(apply_records[0].state_node(), state_node);
    assert_eq!(
        apply_records[0].alternate_memoized_props(),
        Some(current_props)
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_host_component_update_single_record_diagnostic_stays_private() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let current_props = PropsHandle::from_raw(805);
    let next_pending_props = PropsHandle::from_raw(806);
    let next_memoized_props = PropsHandle::from_raw(807);
    let state_node = StateNodeHandle::from_raw(808);
    let current_child = attach_host_root_child(
        &mut store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        state_node,
        current_props,
        current_props,
    );
    update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_child = attach_host_root_child(
        &mut store,
        render.finished_work(),
        FiberTag::HostComponent,
        FiberFlags::UPDATE,
        state_node,
        next_pending_props,
        next_memoized_props,
    );
    store
        .fiber_arena_mut()
        .link_alternates(current_child, finished_child)
        .unwrap();

    let pending_update =
        record_host_root_single_host_update_apply_for_canary(&store, render).unwrap();

    assert_eq!(pending_update.root(), root_id);
    assert_eq!(pending_update.finished_work(), render.finished_work());
    assert_eq!(pending_update.mutation_record_count(), 1);
    assert_eq!(pending_update.host_update_record_count(), 1);
    assert_eq!(pending_update.fiber(), finished_child);
    assert_eq!(pending_update.alternate_fiber(), Some(current_child));
    assert_eq!(pending_update.state_node(), state_node);
    assert_eq!(
        pending_update.kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(pending_update.kind_name(), "commit-host-component-update");
    assert!(pending_update.is_host_component_props_update());
    assert!(!pending_update.is_host_text_content_update());
    assert!(pending_update.test_host_commit_path_only());
    assert!(pending_update.private_host_store_commit_evidence_supported());
    assert!(pending_update.latest_props_publication_after_payload_required());
    assert!(pending_update.public_root_rendering_blocked());
    assert!(!pending_update.public_renderer_package_behavior_exposed());
    assert!(!pending_update.react_dom_compatibility_claimed());
    assert!(!pending_update.test_renderer_compatibility_claimed());

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let committed_update = commit.single_host_update_apply_record_for_canary().unwrap();
    assert_eq!(committed_update, pending_update);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_marks_finished_lanes_and_keeps_skipped_lanes_pending() {
    let (mut store, root_id, _host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(11), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let current = store.root(root_id).unwrap().current();
    let current_queue = store.fiber_arena().get(current).unwrap().update_queue();

    assert_eq!(commit.finished_lanes(), Lanes::SYNC);
    assert_eq!(commit.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(commit.pending_lanes(), Lanes::DEFAULT);
    assert!(commit.has_remaining_work());
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_lane(Lane::DEFAULT)
    );
    assert_eq!(host_root_element(&store, current), RootElementHandle::NONE);
    assert_eq!(
        store
            .update_queues()
            .base_updates(current_queue)
            .unwrap()
            .len(),
        1
    );
}
#[test]
fn root_commit_finished_work_handoff_records_identity_lanes_root_token_and_order() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(510), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, 3).unwrap();

    assert_eq!(pending.root(), root_id);
    assert_eq!(pending.root_token(), root_id.state_node_handle());
    assert_eq!(pending.previous_current(), render.current());
    assert_eq!(pending.pending_work(), Some(render.finished_work()));
    assert_eq!(pending.finished_work(), render.finished_work());
    assert_eq!(pending.render_lanes(), Lanes::DEFAULT);
    assert_eq!(pending.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(pending.remaining_lanes(), Lanes::NO);
    assert_eq!(pending.pending_lanes_before_commit(), Lanes::DEFAULT);
    assert_eq!(pending.handoff_order(), 3);
    assert!(pending.records_finished_work());

    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        render,
        Some(pending),
        4,
    )
    .unwrap();

    assert_eq!(handoff.pending(), pending);
    assert_eq!(handoff.commit_order(), 4);
    assert!(handoff.commit_order_after_pending_record());
    let request = *handoff.execution_request();
    assert_eq!(
        request.status(),
        HostRootFinishedWorkCommitExecutionStatusForCanary::Requested
    );
    assert!(request.execution_requested());
    assert!(request.accepted_current_finished_work_record_shape());
    assert_eq!(request.source_handoff_order(), pending.handoff_order());
    assert_eq!(request.request_order(), 4);
    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), render.current());
    assert_eq!(request.pending_work(), Some(render.finished_work()));
    assert_eq!(request.finished_work(), render.finished_work());
    assert_eq!(request.render_lanes(), Lanes::DEFAULT);
    assert_eq!(request.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(request.remaining_lanes(), Lanes::NO);
    assert_eq!(request.pending_lanes_before_commit(), Lanes::DEFAULT);
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_FINISHED_WORK_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(request.host_mutation_execution_blocked());
    assert!(request.public_root_rendering_blocked());
    assert!(request.ref_attach_detach_blocked());
    assert!(request.layout_effect_execution_blocked());
    assert!(request.passive_effect_execution_blocked());
    assert!(request.hydration_blocked());
    assert!(request.compatibility_claim_blocked());
    assert!(request.refs_effects_and_hydration_blocked());
    assert_eq!(handoff.commit().root(), root_id);
    assert_eq!(handoff.commit().finished_work(), render.finished_work());
    assert_eq!(handoff.current_after_commit(), render.finished_work());
    assert_eq!(handoff.finished_work_after_commit(), None);
    assert_eq!(handoff.finished_lanes_after_commit(), Lanes::NO);
    assert_eq!(handoff.render_phase_work_after_commit(), None);
    assert!(handoff.consumed_finished_work_record());
    assert!(handoff.mutation_execution_blocked());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.effects_refs_and_hydration_blocked());
    assert!(handoff.proves_private_finished_work_commit_execution());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_finished_work_handoff_consumes_root_finished_work_metadata() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(511), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .record_finished_work_for_canary(render.finished_work(), render.render_lanes());

    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, 5).unwrap();

    assert_eq!(pending.root_finished_work(), Some(render.finished_work()));
    assert_eq!(pending.root_finished_lanes(), Lanes::DEFAULT);
    assert_eq!(
        pending.render_exit_status(),
        RootRenderExitStatus::Completed
    );
    assert!(pending.records_root_finished_work());

    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        render,
        Some(pending),
        6,
    )
    .unwrap();
    let request = *handoff.execution_request();

    assert_eq!(request.root_finished_work(), Some(render.finished_work()));
    assert_eq!(request.root_finished_lanes(), Lanes::DEFAULT);
    assert_eq!(
        request.render_exit_status(),
        RootRenderExitStatus::Completed
    );
    assert!(request.records_root_finished_work());
    assert!(handoff.proves_private_root_finished_work_commit_metadata_handoff());
    assert_eq!(handoff.finished_work_after_commit(), None);
    assert_eq!(handoff.finished_lanes_after_commit(), Lanes::NO);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_completed_host_root_entrypoint_records_finished_work_identity() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(512), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);

    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store, render, 7, 8,
    )
    .unwrap();
    let pending = handoff.pending();
    let request = *handoff.execution_request();
    let commit = handoff.commit();

    assert_eq!(pending.root(), root_id);
    assert_eq!(pending.root_token(), root_id.state_node_handle());
    assert_eq!(pending.previous_current(), previous_current);
    assert_eq!(pending.pending_work(), Some(render.finished_work()));
    assert_eq!(pending.root_finished_work(), Some(render.finished_work()));
    assert_eq!(pending.finished_work(), render.finished_work());
    assert_eq!(pending.render_lanes(), Lanes::DEFAULT);
    assert_eq!(pending.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(pending.root_finished_lanes(), Lanes::DEFAULT);
    assert_eq!(pending.remaining_lanes(), Lanes::NO);
    assert_eq!(pending.pending_lanes_before_commit(), Lanes::DEFAULT);
    assert_eq!(
        pending.render_exit_status(),
        RootRenderExitStatus::Completed
    );
    assert_eq!(pending.handoff_order(), 7);
    assert!(pending.records_finished_work());
    assert!(pending.records_root_finished_work());

    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), previous_current);
    assert_eq!(request.pending_work(), Some(render.finished_work()));
    assert_eq!(request.root_finished_work(), Some(render.finished_work()));
    assert_eq!(request.finished_work(), render.finished_work());
    assert_eq!(request.render_lanes(), Lanes::DEFAULT);
    assert_eq!(request.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(request.root_finished_lanes(), Lanes::DEFAULT);
    assert_eq!(request.remaining_lanes(), Lanes::NO);
    assert_eq!(request.pending_lanes_before_commit(), Lanes::DEFAULT);
    assert_eq!(
        request.render_exit_status(),
        RootRenderExitStatus::Completed
    );
    assert_eq!(request.source_handoff_order(), 7);
    assert_eq!(request.request_order(), 8);
    assert!(request.execution_requested());
    assert!(request.records_root_finished_work());
    assert!(request.host_mutation_execution_blocked());
    assert!(request.public_root_rendering_blocked());
    assert!(request.refs_effects_and_hydration_blocked());
    assert!(request.compatibility_claim_blocked());

    assert_eq!(handoff.commit_order(), 8);
    assert!(handoff.commit_order_after_pending_record());
    assert!(handoff.consumed_finished_work_record());
    assert!(handoff.proves_private_root_finished_work_commit_metadata_handoff());
    assert_eq!(handoff.current_after_commit(), render.finished_work());
    assert_eq!(handoff.finished_work_after_commit(), None);
    assert_eq!(handoff.finished_lanes_after_commit(), Lanes::NO);
    assert_eq!(handoff.render_phase_work_after_commit(), None);

    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), previous_current);
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(commit.finished_work(), render.finished_work());
    assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(commit.remaining_lanes(), Lanes::NO);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        None
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_finished_work_handoff_rejects_missing_record_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(511), None).unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let error = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store, render, None, 1,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootFinishedWorkCommitHandoffErrorForCanary::MissingFinishedWorkRecord {
            root,
            finished_work
        } if root == root_id && finished_work == render.finished_work()
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_finished_work_handoff_rejects_foreign_record_before_switching_current() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    update_container(
        &mut store,
        first_root,
        RootElementHandle::from_raw(512),
        None,
    )
    .unwrap();
    update_container(
        &mut store,
        second_root,
        RootElementHandle::from_raw(513),
        None,
    )
    .unwrap();
    let first_current = store.root(first_root).unwrap().current();
    let first_render = render_host_root_for_lanes(&mut store, first_root, Lanes::DEFAULT).unwrap();
    let second_render =
        render_host_root_for_lanes(&mut store, second_root, Lanes::DEFAULT).unwrap();
    let second_pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, second_render, 1).unwrap();

    let error = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        first_render,
        Some(second_pending),
        2,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootFinishedWorkCommitHandoffErrorForCanary::ForeignFinishedWorkRecord {
            expected_root,
            actual_root,
            expected_root_token,
            actual_root_token
        } if expected_root == first_root
            && actual_root == second_root
            && expected_root_token == first_root.state_node_handle()
            && actual_root_token == second_root.state_node_handle()
    ));
    assert_eq!(store.root(first_root).unwrap().current(), first_current);
    assert_eq!(
        store
            .root(first_root)
            .unwrap()
            .scheduling()
            .work_in_progress(),
        Some(first_render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_finished_work_handoff_rejects_stale_record_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(514), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let previous_current = render.current();
    let mut pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, 1).unwrap();
    pending.previous_current = render.finished_work();

    let error = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        render,
        Some(pending),
        2,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootFinishedWorkCommitHandoffErrorForCanary::StaleFinishedWorkRecord {
            root,
            expected_current,
            actual_current,
            expected_pending_work,
            actual_pending_work,
            finished_work
        } if root == root_id
            && expected_current == render.finished_work()
            && actual_current == previous_current
            && expected_pending_work == Some(render.finished_work())
            && actual_pending_work == Some(render.finished_work())
            && finished_work == render.finished_work()
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_finished_work_handoff_rejects_already_committed_record_deterministically() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(515), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, 1).unwrap();
    commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        render,
        Some(pending),
        2,
    )
    .unwrap();

    let error = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        render,
        Some(pending),
        3,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootFinishedWorkCommitHandoffErrorForCanary::AlreadyCommittedFinishedWorkRecord {
            root,
            current,
            finished_work,
            pending_work_after_commit,
            handoff_order,
        } if root == root_id
            && finished_work == render.finished_work()
            && current == render.finished_work()
            && pending_work_after_commit.is_none()
            && handoff_order == 1
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_rejects_stale_render_record_after_current_switch() {
    let (mut store, root_id, _host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(5), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    commit_finished_host_root(&mut store, render).unwrap();
    let error = commit_finished_host_root(&mut store, render).unwrap_err();

    assert!(matches!(
        error,
        RootCommitError::CurrentMismatch { root, .. } if root == root_id
    ));
}
