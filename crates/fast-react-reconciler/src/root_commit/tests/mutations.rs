use super::helpers::*;
use super::*;

#[test]
fn root_commit_records_host_root_child_placement_metadata_without_host_mutation() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let child_state_node = StateNodeHandle::from_raw(700);
    let child_props = PropsHandle::from_raw(701);
    let child = attach_host_root_child(
        &mut store,
        render.finished_work(),
        FiberTag::HostText,
        FiberFlags::PLACEMENT,
        child_state_node,
        child_props,
        child_props,
    );

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let log = commit.mutation_log();
    let records = log.records();
    let apply_log = commit.mutation_apply_log();
    let apply_records = apply_log.records();

    assert_eq!(log.root(), root_id);
    assert_eq!(log.finished_work(), render.finished_work());
    assert_eq!(log.len(), 1);
    assert_eq!(records[0].root(), root_id);
    assert_eq!(records[0].host_root(), render.finished_work());
    assert_eq!(records[0].fiber(), child);
    assert_eq!(records[0].alternate_fiber(), None);
    assert_eq!(records[0].tag(), FiberTag::HostText);
    assert_eq!(
        records[0].kind(),
        HostRootMutationPhaseRecordKind::Placement
    );
    assert_eq!(records[0].lanes(), Lanes::DEFAULT);
    assert_eq!(records[0].effect_flag(), FiberFlags::PLACEMENT);
    assert_eq!(records[0].state_node(), child_state_node);
    assert_eq!(records[0].pending_props(), child_props);
    assert_eq!(records[0].memoized_props(), child_props);
    assert_eq!(records[0].alternate_memoized_props(), None);
    let placement_sibling = records[0].placement_sibling().unwrap();
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
    assert_eq!(apply_log.root(), root_id);
    assert_eq!(apply_log.finished_work(), render.finished_work());
    assert_eq!(apply_log.len(), 1);
    assert_eq!(
        apply_records[0].source(),
        HostRootMutationApplyRecordSource::MutationPhase(
            HostRootMutationPhaseRecordKind::Placement
        )
    );
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(apply_records[0].parent(), render.finished_work());
    assert_eq!(apply_records[0].parent_tag(), FiberTag::HostRoot);
    assert_eq!(apply_records[0].parent_state_node(), StateNodeHandle::NONE);
    assert_eq!(apply_records[0].fiber(), child);
    assert_eq!(apply_records[0].alternate_fiber(), None);
    assert_eq!(apply_records[0].tag(), FiberTag::HostText);
    assert_eq!(apply_records[0].state_node(), child_state_node);
    assert_eq!(
        apply_records[0].placement_sibling(),
        records[0].placement_sibling()
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_host_component_text_mutation_execution_gate_blocks_production_host_execution() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    attach_host_root_children(
        &mut store,
        render.finished_work(),
        &[
            (
                FiberTag::HostComponent,
                FiberFlags::PLACEMENT,
                StateNodeHandle::from_raw(702),
                PropsHandle::from_raw(703),
                PropsHandle::from_raw(703),
            ),
            (
                FiberTag::HostText,
                FiberFlags::PLACEMENT,
                StateNodeHandle::from_raw(704),
                PropsHandle::from_raw(705),
                PropsHandle::from_raw(705),
            ),
        ],
    );

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let gate = commit.host_component_text_mutation_execution_gate();

    assert_eq!(gate.root(), root_id);
    assert_eq!(gate.finished_work(), render.finished_work());
    assert_eq!(gate.mutation_apply_record_count(), 2);
    assert_eq!(gate.host_component_record_count(), 1);
    assert_eq!(gate.host_text_record_count(), 1);
    assert_eq!(gate.placement_record_count(), 2);
    assert_eq!(gate.update_record_count(), 0);
    assert_eq!(gate.deletion_record_count(), 0);
    assert_eq!(gate.blocked_record_count(), 2);
    assert_eq!(
        gate.status(),
        HostRootHostMutationExecutionGateStatus::BlockedUntilProductionCompleteCommitPromotion
    );
    assert_eq!(
        gate.status_name(),
        "blocked-until-production-complete-commit-promotion"
    );
    assert_eq!(gate.blockers(), &HOST_ROOT_HOST_MUTATION_EXECUTION_BLOCKERS);
    assert!(gate.host_mutation_execution_blocked());
    assert!(gate.requires_production_complete_work_promotion());
    assert!(gate.requires_production_host_mutation_apply());
    assert!(!gate.production_complete_work_promoted());
    assert!(!gate.production_host_mutation_apply_promoted());
    assert!(!gate.public_dom_compatibility_claimed());
    assert!(!gate.test_renderer_compatibility_claimed());
    assert!(gate.blockers_intact());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_host_component_text_mutation_execution_gate_allows_empty_noop_commit() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(47), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let gate = commit.host_component_text_mutation_execution_gate();

    assert_eq!(gate.root(), root_id);
    assert_eq!(gate.finished_work(), render.finished_work());
    assert_eq!(gate.mutation_apply_record_count(), 0);
    assert_eq!(gate.host_component_record_count(), 0);
    assert_eq!(gate.host_text_record_count(), 0);
    assert_eq!(gate.placement_record_count(), 0);
    assert_eq!(gate.update_record_count(), 0);
    assert_eq!(gate.deletion_record_count(), 0);
    assert_eq!(gate.blocked_record_count(), 0);
    assert_eq!(
        gate.status(),
        HostRootHostMutationExecutionGateStatus::NoHostMutations
    );
    assert_eq!(gate.status_name(), "no-host-mutations");
    assert!(!gate.host_mutation_execution_blocked());
    assert!(!gate.requires_production_complete_work_promotion());
    assert!(!gate.requires_production_host_mutation_apply());
    assert!(!gate.production_complete_work_promoted());
    assert!(!gate.production_host_mutation_apply_promoted());
    assert!(!gate.public_dom_compatibility_claimed());
    assert!(!gate.test_renderer_compatibility_claimed());
    assert!(gate.blockers_intact());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_records_function_component_single_host_child_placement_as_container_append() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let mode = store.fiber_arena().get(finished_work).unwrap().mode();
    let function_component = create_function_component_fiber(
        &mut store,
        mode,
        PropsHandle::from_raw(710),
        FiberTypeHandle::from_raw(711),
    );
    let host_child_state_node = StateNodeHandle::from_raw(712);
    let host_child_props = PropsHandle::from_raw(713);
    let host_child =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, host_child_props, mode);
    {
        let node = store.fiber_arena_mut().get_mut(host_child).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(host_child_state_node);
        node.set_memoized_props(host_child_props);
    }
    store
        .fiber_arena_mut()
        .set_children(function_component, &[host_child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(finished_work, &[function_component])
        .unwrap();
    bubble_test_fiber(&mut store, function_component);
    bubble_test_fiber(&mut store, finished_work);

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();
    let diagnostics = commit.host_root_placement_apply_diagnostics_for_canary();

    assert_eq!(records.len(), 1);
    assert_eq!(records[0].root(), root_id);
    assert_eq!(records[0].host_root(), finished_work);
    assert_eq!(records[0].parent(), finished_work);
    assert_eq!(records[0].parent_tag(), FiberTag::HostRoot);
    assert_eq!(records[0].fiber(), host_child);
    assert_eq!(records[0].tag(), FiberTag::HostComponent);
    assert_eq!(
        records[0].kind(),
        HostRootMutationPhaseRecordKind::Placement
    );
    assert_eq!(records[0].state_node(), host_child_state_node);
    assert_eq!(
        records[0].placement_sibling().unwrap().status(),
        HostRootPlacementSiblingStatus::Append
    );
    assert_eq!(apply_records.len(), 1);
    assert_eq!(apply_records[0].parent(), finished_work);
    assert_eq!(apply_records[0].parent_tag(), FiberTag::HostRoot);
    assert_eq!(apply_records[0].fiber(), host_child);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].fiber(), host_child);
    assert_eq!(diagnostics[0].tag(), FiberTag::HostComponent);
    assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
    assert_eq!(diagnostics[0].sibling_status(), "append");
    assert_eq!(store.root(root_id).unwrap().current(), finished_work);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_insert_before_for_immediate_stable_host_sibling() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let placed_state_node = StateNodeHandle::from_raw(710);
    let stable_state_node = StateNodeHandle::from_raw(711);
    let children = attach_host_root_children(
        &mut store,
        render.finished_work(),
        &[
            (
                FiberTag::HostText,
                FiberFlags::PLACEMENT,
                placed_state_node,
                PropsHandle::from_raw(712),
                PropsHandle::from_raw(712),
            ),
            (
                FiberTag::HostText,
                FiberFlags::NO,
                stable_state_node,
                PropsHandle::from_raw(713),
                PropsHandle::from_raw(713),
            ),
        ],
    );

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();
    let diagnostics = commit.host_root_placement_apply_diagnostics_for_canary();
    let placement_sibling = records[0].placement_sibling().unwrap();

    assert_eq!(records.len(), 1);
    assert_eq!(records[0].fiber(), children[0]);
    assert_eq!(
        records[0].kind(),
        HostRootMutationPhaseRecordKind::Placement
    );
    assert_eq!(
        placement_sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(placement_sibling.sibling(), Some(children[1]));
    assert_eq!(placement_sibling.sibling_tag(), Some(FiberTag::HostText));
    assert_eq!(placement_sibling.sibling_state_node(), stable_state_node);
    assert!(placement_sibling.can_insert_before());
    assert_eq!(apply_records.len(), 1);
    assert_eq!(apply_records[0].fiber(), children[0]);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    );
    assert_eq!(
        apply_records[0].placement_sibling(),
        Some(placement_sibling)
    );
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].root(), root_id);
    assert_eq!(diagnostics[0].host_root(), render.finished_work());
    assert_eq!(diagnostics[0].fiber(), children[0]);
    assert_eq!(diagnostics[0].tag_name(), "HostText");
    assert_eq!(diagnostics[0].state_node_raw(), placed_state_node.raw());
    assert_eq!(
        diagnostics[0].apply_kind(),
        "insert-placement-in-container-before"
    );
    assert_eq!(diagnostics[0].sibling_status(), "insert-before");
    assert_eq!(diagnostics[0].sibling(), Some(children[1]));
    assert_eq!(diagnostics[0].sibling_tag_name(), Some("HostText"));
    assert_eq!(
        diagnostics[0].sibling_state_node_raw(),
        stable_state_node.raw()
    );
    assert!(diagnostics[0].can_insert_before());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_two_root_child_placements_before_stable_sibling() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let component_state_node = StateNodeHandle::from_raw(740);
    let text_state_node = StateNodeHandle::from_raw(741);
    let stable_state_node = StateNodeHandle::from_raw(742);
    let component_props = PropsHandle::from_raw(743);
    let text_props = PropsHandle::from_raw(744);
    let stable_props = PropsHandle::from_raw(745);
    let current_stable = attach_host_root_child(
        &mut store,
        current_root,
        FiberTag::HostText,
        FiberFlags::NO,
        stable_state_node,
        stable_props,
        stable_props,
    );

    update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mode = store
        .fiber_arena()
        .get(render.finished_work())
        .unwrap()
        .mode();
    let placed_component =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, component_props, mode);
    {
        let node = store.fiber_arena_mut().get_mut(placed_component).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(component_state_node);
        node.set_memoized_props(component_props);
    }
    let placed_text =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostText, None, text_props, mode);
    {
        let node = store.fiber_arena_mut().get_mut(placed_text).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(text_state_node);
        node.set_memoized_props(text_props);
    }
    let stable_work = store
        .fiber_arena_mut()
        .create_work_in_progress(current_stable, stable_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(stable_work).unwrap();
        node.set_flags(FiberFlags::NO);
        node.set_state_node(stable_state_node);
        node.set_memoized_props(stable_props);
        node.set_lanes(Lanes::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(
            render.finished_work(),
            &[placed_component, placed_text, stable_work],
        )
        .unwrap();
    bubble_test_fiber(&mut store, placed_component);
    bubble_test_fiber(&mut store, placed_text);
    bubble_test_fiber(&mut store, stable_work);
    bubble_test_fiber(&mut store, render.finished_work());

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();
    let diagnostics = commit.host_root_placement_apply_diagnostics_for_canary();
    let first_sibling = records[0].placement_sibling().unwrap();
    let second_sibling = records[1].placement_sibling().unwrap();

    assert_eq!(records.len(), 2);
    assert_eq!(records[0].fiber(), placed_component);
    assert_eq!(records[0].tag(), FiberTag::HostComponent);
    assert_eq!(
        first_sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(first_sibling.sibling(), Some(stable_work));
    assert_eq!(first_sibling.sibling_tag(), Some(FiberTag::HostText));
    assert_eq!(first_sibling.sibling_state_node(), stable_state_node);
    assert_eq!(first_sibling.skipped_pending_sibling_count(), 1);
    assert!(first_sibling.can_insert_before());

    assert_eq!(records[1].fiber(), placed_text);
    assert_eq!(records[1].tag(), FiberTag::HostText);
    assert_eq!(
        second_sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(second_sibling.sibling(), Some(stable_work));
    assert_eq!(second_sibling.sibling_tag(), Some(FiberTag::HostText));
    assert_eq!(second_sibling.sibling_state_node(), stable_state_node);
    assert_eq!(second_sibling.skipped_pending_sibling_count(), 0);
    assert!(second_sibling.can_insert_before());

    assert_eq!(apply_records.len(), 2);
    assert_eq!(apply_records[0].fiber(), placed_component);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    );
    assert_eq!(apply_records[0].placement_sibling(), Some(first_sibling));
    assert_eq!(apply_records[1].fiber(), placed_text);
    assert_eq!(
        apply_records[1].kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    );
    assert_eq!(apply_records[1].placement_sibling(), Some(second_sibling));

    assert_eq!(diagnostics.len(), 2);
    assert_eq!(diagnostics[0].fiber(), placed_component);
    assert_eq!(diagnostics[0].tag_name(), "HostComponent");
    assert_eq!(
        diagnostics[0].apply_kind(),
        "insert-placement-in-container-before"
    );
    assert_eq!(diagnostics[0].sibling(), Some(stable_work));
    assert_eq!(diagnostics[0].sibling_status(), "insert-before");
    assert_eq!(diagnostics[0].sibling_tag_name(), Some("HostText"));
    assert_eq!(diagnostics[0].sibling_state_node(), stable_state_node);
    assert_eq!(diagnostics[0].skipped_pending_sibling_count(), 1);
    assert!(diagnostics[0].can_insert_before());
    assert_eq!(diagnostics[1].fiber(), placed_text);
    assert_eq!(diagnostics[1].tag_name(), "HostText");
    assert_eq!(
        diagnostics[1].apply_kind(),
        "insert-placement-in-container-before"
    );
    assert_eq!(diagnostics[1].sibling(), Some(stable_work));
    assert_eq!(diagnostics[1].sibling_status(), "insert-before");
    assert_eq!(diagnostics[1].skipped_pending_sibling_count(), 0);
    assert!(diagnostics[1].can_insert_before());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_placement_insertion_blocked_for_unproven_sibling() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let children = attach_host_root_children(
        &mut store,
        render.finished_work(),
        &[
            (
                FiberTag::HostText,
                FiberFlags::PLACEMENT,
                StateNodeHandle::from_raw(720),
                PropsHandle::from_raw(721),
                PropsHandle::from_raw(721),
            ),
            (
                FiberTag::HostText,
                FiberFlags::NO,
                StateNodeHandle::NONE,
                PropsHandle::from_raw(722),
                PropsHandle::from_raw(722),
            ),
        ],
    );

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();
    let diagnostics = commit.host_root_placement_apply_diagnostics_for_canary();
    let placement_sibling = records[0].placement_sibling().unwrap();

    assert_eq!(records.len(), 1);
    assert_eq!(records[0].fiber(), children[0]);
    assert_eq!(
        placement_sibling.status(),
        HostRootPlacementSiblingStatus::BlockedMissingStateNode
    );
    assert_eq!(placement_sibling.sibling(), Some(children[1]));
    assert_eq!(placement_sibling.sibling_tag(), Some(FiberTag::HostText));
    assert_eq!(
        placement_sibling.sibling_state_node(),
        StateNodeHandle::NONE
    );
    assert!(!placement_sibling.can_insert_before());
    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked
    );
    assert_eq!(
        apply_records[0].placement_sibling(),
        Some(placement_sibling)
    );
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].fiber(), children[0]);
    assert_eq!(
        diagnostics[0].apply_kind(),
        "record-placement-insertion-blocked"
    );
    assert_eq!(
        diagnostics[0].sibling_status(),
        "blocked-missing-state-node"
    );
    assert_eq!(diagnostics[0].sibling(), Some(children[1]));
    assert_eq!(diagnostics[0].sibling_tag_name(), Some("HostText"));
    assert_eq!(diagnostics[0].sibling_state_node_raw(), 0);
    assert!(!diagnostics[0].can_insert_before());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_host_parent_child_placement_apply_record_without_host_mutation() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let parent_state_node = StateNodeHandle::from_raw(710);
    let child_state_node = StateNodeHandle::from_raw(711);
    let parent_props = PropsHandle::from_raw(712);
    let child_props = PropsHandle::from_raw(713);
    let current_parent = attach_host_root_child(
        &mut store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        parent_state_node,
        parent_props,
        parent_props,
    );

    update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
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
    let child = create_test_fiber(&mut store, FiberTag::HostText, child_props.raw());
    {
        let node = store.fiber_arena_mut().get_mut(child).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(child_state_node);
        node.set_memoized_props(child_props);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[child])
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
    assert_eq!(records[0].fiber(), child);
    assert_eq!(
        records[0].kind(),
        HostRootMutationPhaseRecordKind::Placement
    );
    assert_eq!(records[0].state_node(), child_state_node);
    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent
    );
    assert_eq!(apply_records[0].parent(), work_parent);
    assert_eq!(apply_records[0].parent_tag(), FiberTag::HostComponent);
    assert_eq!(apply_records[0].parent_state_node(), parent_state_node);
    assert_eq!(apply_records[0].fiber(), child);
    assert_eq!(apply_records[0].state_node(), child_state_node);
    assert_eq!(
        commit.test_only_host_parent_placement_apply_count_for_canary(),
        1
    );
    assert!(commit.has_test_only_host_parent_placement_apply_for_canary(
        parent_state_node.raw(),
        child_state_node.raw()
    ));
    assert!(
        !commit.has_test_only_host_parent_placement_apply_for_canary(
            parent_state_node.raw(),
            StateNodeHandle::from_raw(9999).raw()
        )
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_host_parent_child_reorder_before_stable_sibling_without_host_mutation() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let parent_state_node = StateNodeHandle::from_raw(9_220);
    let stable_state_node = StateNodeHandle::from_raw(9_221);
    let moving_state_node = StateNodeHandle::from_raw(9_222);
    let parent_props = PropsHandle::from_raw(9_223);
    let stable_props = PropsHandle::from_raw(9_224);
    let moving_props = PropsHandle::from_raw(9_225);
    let current_parent = attach_host_root_child(
        &mut store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        parent_state_node,
        parent_props,
        parent_props,
    );
    let mode = store.fiber_arena().get(current_parent).unwrap().mode();
    let stable_current =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostText, None, stable_props, mode);
    let moving_current =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostText, None, moving_props, mode);
    {
        let node = store.fiber_arena_mut().get_mut(stable_current).unwrap();
        node.set_state_node(stable_state_node);
        node.set_memoized_props(stable_props);
    }
    {
        let node = store.fiber_arena_mut().get_mut(moving_current).unwrap();
        node.set_state_node(moving_state_node);
        node.set_memoized_props(moving_props);
    }
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[stable_current, moving_current])
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
        node.set_lanes(Lanes::NO);
    }
    let moving_work = store
        .fiber_arena_mut()
        .create_work_in_progress(moving_current, moving_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(moving_work).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(moving_state_node);
        node.set_memoized_props(moving_props);
        node.set_lanes(Lanes::NO);
    }
    let stable_work = store
        .fiber_arena_mut()
        .create_work_in_progress(stable_current, stable_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(stable_work).unwrap();
        node.set_state_node(stable_state_node);
        node.set_memoized_props(stable_props);
        node.set_lanes(Lanes::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[moving_work, stable_work])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_test_fiber(&mut store, moving_work);
    bubble_test_fiber(&mut store, stable_work);
    bubble_test_fiber(&mut store, work_parent);
    bubble_test_fiber(&mut store, render.finished_work());

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();
    let diagnostics = commit.host_parent_placement_apply_diagnostics_for_canary();
    let placement_sibling = records[0].placement_sibling().unwrap();

    assert_eq!(records.len(), 1);
    assert_eq!(records[0].parent(), work_parent);
    assert_eq!(records[0].parent_tag(), FiberTag::HostComponent);
    assert_eq!(records[0].parent_state_node(), parent_state_node);
    assert_eq!(records[0].fiber(), moving_work);
    assert_eq!(records[0].alternate_fiber(), Some(moving_current));
    assert_eq!(
        placement_sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(placement_sibling.sibling(), Some(stable_work));
    assert_eq!(placement_sibling.sibling_tag(), Some(FiberTag::HostText));
    assert_eq!(placement_sibling.sibling_state_node(), stable_state_node);
    assert!(placement_sibling.can_insert_before());

    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    );
    assert_eq!(apply_records[0].parent(), work_parent);
    assert_eq!(apply_records[0].parent_state_node(), parent_state_node);
    assert_eq!(apply_records[0].fiber(), moving_work);
    assert_eq!(apply_records[0].state_node(), moving_state_node);
    assert_eq!(
        apply_records[0].placement_sibling(),
        Some(placement_sibling)
    );

    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].parent(), work_parent);
    assert_eq!(diagnostics[0].fiber(), moving_work);
    assert_eq!(
        diagnostics[0].apply_kind(),
        "insert-placement-in-host-parent-before"
    );
    assert_eq!(diagnostics[0].sibling_status(), "insert-before");
    assert_eq!(diagnostics[0].sibling(), Some(stable_work));
    assert_eq!(diagnostics[0].sibling_tag_name(), Some("HostText"));
    assert_eq!(
        diagnostics[0].sibling_state_node_raw(),
        stable_state_node.raw()
    );
    assert!(diagnostics[0].can_insert_before());
    assert!(diagnostics[0].applies_to_host_parent());
    assert_eq!(
        commit.test_only_host_parent_placement_apply_count_for_canary(),
        1
    );
    assert!(commit.has_test_only_host_parent_placement_apply_for_canary(
        parent_state_node.raw(),
        moving_state_node.raw()
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_nested_host_parent_child_placement_apply_record_without_host_mutation() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let fixture = attach_current_nested_host_parent_fixture(&mut store, current_root);
    update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let placed_text_state_node = StateNodeHandle::from_raw(9_203);
    let (work_outer, work_inner, stable_text, placed_text) =
        prepare_nested_host_parent_placement_wip(
            &mut store,
            render.finished_work(),
            fixture,
            placed_text_state_node,
        );

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let records = commit.mutation_log().records();
    let apply_records = commit.mutation_apply_log().records();
    let diagnostics = commit.host_parent_placement_apply_diagnostics_for_canary();

    assert_eq!(records.len(), 1);
    assert_eq!(records[0].host_root(), render.finished_work());
    assert_eq!(records[0].parent(), work_inner);
    assert_eq!(records[0].parent_tag(), FiberTag::HostComponent);
    assert_eq!(records[0].parent_state_node(), fixture.inner_state_node);
    assert_eq!(records[0].fiber(), placed_text);
    assert_eq!(records[0].tag(), FiberTag::HostText);
    assert_eq!(
        records[0].kind(),
        HostRootMutationPhaseRecordKind::Placement
    );
    assert_eq!(records[0].state_node(), placed_text_state_node);
    assert_eq!(records[0].placement_sibling().unwrap().sibling(), None);
    assert_eq!(apply_records.len(), 1);
    assert_eq!(apply_records[0].parent(), work_inner);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent
    );
    assert_eq!(apply_records[0].fiber(), placed_text);
    assert_eq!(apply_records[0].state_node(), placed_text_state_node);
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].root(), root_id);
    assert_eq!(diagnostics[0].host_root(), render.finished_work());
    assert_eq!(diagnostics[0].parent(), work_inner);
    assert_eq!(diagnostics[0].parent_tag_name(), "HostComponent");
    assert_eq!(
        diagnostics[0].parent_state_node_raw(),
        fixture.inner_state_node.raw()
    );
    assert_eq!(diagnostics[0].fiber(), placed_text);
    assert_eq!(diagnostics[0].tag_name(), "HostText");
    assert_eq!(
        diagnostics[0].state_node_raw(),
        placed_text_state_node.raw()
    );
    assert_eq!(
        diagnostics[0].apply_kind(),
        "append-placement-to-host-parent"
    );
    assert!(diagnostics[0].applies_to_host_parent());
    assert_eq!(
        store.fiber_arena().get(work_outer).unwrap().child(),
        Some(work_inner)
    );
    assert_eq!(
        store.fiber_arena().get(work_inner).unwrap().child(),
        Some(stable_text)
    );
    assert_eq!(
        store.fiber_arena().get(stable_text).unwrap().sibling(),
        Some(placed_text)
    );
    assert_eq!(
        commit.test_only_host_parent_placement_apply_count_for_canary(),
        1
    );
    assert!(commit.has_test_only_host_parent_placement_apply_for_canary(
        fixture.inner_state_node.raw(),
        placed_text_state_node.raw()
    ));
    assert!(
        !commit.has_test_only_host_parent_placement_apply_for_canary(
            fixture.outer_state_node.raw(),
            placed_text_state_node.raw()
        )
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_does_not_descend_through_unsupported_nested_parent_blockers() {
    for blocker_tag in [FiberTag::Fragment, FiberTag::Portal, FiberTag::Suspense] {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(48), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let outer = create_test_fiber(&mut store, FiberTag::HostComponent, 9_300);
        let blocker = create_test_fiber(&mut store, blocker_tag, 9_301);
        let nested_parent = create_test_fiber(&mut store, FiberTag::HostComponent, 9_302);
        let placed_text = create_test_fiber(&mut store, FiberTag::HostText, 9_303);
        {
            let node = store.fiber_arena_mut().get_mut(outer).unwrap();
            node.set_state_node(StateNodeHandle::from_raw(9_400));
            node.set_memoized_props(PropsHandle::from_raw(9_300));
        }
        {
            let node = store.fiber_arena_mut().get_mut(nested_parent).unwrap();
            node.set_state_node(StateNodeHandle::from_raw(9_401));
            node.set_memoized_props(PropsHandle::from_raw(9_302));
        }
        {
            let node = store.fiber_arena_mut().get_mut(placed_text).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(StateNodeHandle::from_raw(9_402));
            node.set_memoized_props(PropsHandle::from_raw(9_303));
        }
        store
            .fiber_arena_mut()
            .set_children(nested_parent, &[placed_text])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(blocker, &[nested_parent])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(outer, &[blocker])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[outer])
            .unwrap();
        bubble_test_fiber(&mut store, placed_text);
        bubble_test_fiber(&mut store, nested_parent);
        bubble_test_fiber(&mut store, blocker);
        bubble_test_fiber(&mut store, outer);
        bubble_test_fiber(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();

        assert!(commit.mutation_log().is_empty());
        assert!(commit.mutation_apply_log().is_empty());
        assert!(
            commit
                .host_parent_placement_apply_diagnostics_for_canary()
                .is_empty()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }
}
#[test]
fn root_commit_records_nested_placement_under_new_host_parent_as_recorded_only() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(47), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let parent_state_node = StateNodeHandle::from_raw(720);
    let child_state_node = StateNodeHandle::from_raw(721);
    let parent = create_test_fiber(&mut store, FiberTag::HostComponent, 722);
    let child = create_test_fiber(&mut store, FiberTag::HostText, 723);
    {
        let node = store.fiber_arena_mut().get_mut(parent).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(parent_state_node);
        node.set_memoized_props(PropsHandle::from_raw(722));
    }
    {
        let node = store.fiber_arena_mut().get_mut(child).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(child_state_node);
        node.set_memoized_props(PropsHandle::from_raw(723));
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
    let apply_records = commit.mutation_apply_log().records();

    assert_eq!(apply_records.len(), 2);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(apply_records[0].fiber(), parent);
    assert_eq!(
        apply_records[1].kind(),
        HostRootMutationApplyRecordKind::SkipUnsupportedNestedPlacement
    );
    assert_eq!(apply_records[1].parent(), parent);
    assert_eq!(apply_records[1].parent_tag(), FiberTag::HostComponent);
    assert_eq!(apply_records[1].parent_state_node(), parent_state_node);
    assert_eq!(apply_records[1].fiber(), child);
    assert_eq!(apply_records[1].state_node(), child_state_node);
    assert_eq!(
        commit.test_only_host_parent_placement_apply_count_for_canary(),
        0
    );
    assert!(
        !commit.has_test_only_host_parent_placement_apply_for_canary(
            parent_state_node.raw(),
            child_state_node.raw()
        )
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
