use super::helpers::*;
use super::*;

#[test]
fn root_commit_records_ref_attach_metadata_with_commit_instance_token() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let ref_handle = RefHandle::from_raw(101);
    let state_node = StateNodeHandle::from_raw(201);
    let child = append_host_ref_child(
        &mut store,
        render.work_in_progress(),
        ref_handle,
        state_node,
        FiberFlags::REF,
    );
    store
        .fiber_arena_mut()
        .get_mut(render.work_in_progress())
        .unwrap()
        .set_subtree_flags(FiberFlags::REF);

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let refs = commit.ref_commit_metadata();
    let gate = commit.dom_ref_callback_commit_gate();
    let handoff = commit.ref_callback_execution_handoff();
    let cleanup_gate = commit.ref_cleanup_return_execution_gate();

    assert!(refs.detach().is_empty());
    assert_eq!(refs.attach().len(), 1);
    assert_eq!(refs.len(), 1);
    let attach = refs.attach()[0];
    assert_eq!(attach.root(), root_id);
    assert_eq!(attach.fiber(), child);
    assert_eq!(attach.state_node(), state_node);
    assert_eq!(attach.ref_handle(), ref_handle);
    assert_eq!(attach.action(), HostRootRefCommitAction::Attach);
    assert_eq!(attach.detach_reason(), None);
    assert_eq!(attach.token_phase(), HostFiberTokenPhase::Commit);
    assert_eq!(attach.token_target(), HostFiberTokenTarget::Instance);
    assert_active_ref_token(&store, &attach);
    assert_dom_ref_callback_gate_is_inert(gate);
    assert_eq!(gate.len(), 1);
    let gate_record = gate.records()[0];
    assert_eq!(gate_record.sequence(), 0);
    assert_eq!(gate_record.root(), root_id);
    assert_eq!(gate_record.fiber(), child);
    assert_eq!(gate_record.state_node(), state_node);
    assert_eq!(gate_record.ref_handle(), ref_handle);
    assert_eq!(gate_record.token(), attach.token());
    assert_eq!(gate_record.token_phase(), HostFiberTokenPhase::Commit);
    assert_eq!(gate_record.token_target(), HostFiberTokenTarget::Instance);
    assert_eq!(gate_record.action(), HostRootRefCommitAction::Attach);
    assert_eq!(gate_record.detach_reason(), None);
    assert_ref_callback_execution_handoff_keeps_public_blockers(handoff);
    assert_eq!(handoff.len(), 1);
    assert_eq!(handoff.detach_count(), 0);
    assert_eq!(handoff.attach_count(), 1);
    assert_eq!(handoff.changed_ref_detach_before_attach_count(), 0);
    let handoff_record = handoff.records()[0];
    assert_eq!(handoff_record.sequence(), 0);
    assert_eq!(
        handoff_record.source_gate_sequence(),
        gate_record.sequence()
    );
    assert_eq!(handoff_record.root(), root_id);
    assert_eq!(handoff_record.fiber(), child);
    assert_eq!(handoff_record.state_node(), state_node);
    assert_eq!(handoff_record.ref_handle(), ref_handle);
    assert_eq!(handoff_record.token(), attach.token());
    assert_eq!(handoff_record.action(), HostRootRefCommitAction::Attach);
    assert_eq!(
        handoff_record.execution_phase(),
        HostRootRefCallbackExecutionPhase::CallbackAttach
    );
    assert!(!handoff_record.changed_ref_detach_before_attach());
    assert_ref_cleanup_return_execution_gate_keeps_public_blockers(cleanup_gate);
    assert_eq!(cleanup_gate.len(), 1);
    assert_eq!(cleanup_gate.cleanup_return_handle_record_gate_count(), 1);
    assert_eq!(cleanup_gate.cleanup_return_execution_gate_count(), 0);
    assert_eq!(cleanup_gate.changed_ref_cleanup_before_attach_count(), 0);
    let cleanup_record = cleanup_gate.records()[0];
    assert_eq!(cleanup_record.sequence(), 0);
    assert_eq!(
        cleanup_record.source_handoff_sequence(),
        handoff_record.sequence()
    );
    assert_eq!(
        cleanup_record.source_gate_sequence(),
        gate_record.sequence()
    );
    assert_eq!(cleanup_record.root(), root_id);
    assert_eq!(cleanup_record.fiber(), child);
    assert_eq!(cleanup_record.state_node(), state_node);
    assert_eq!(cleanup_record.ref_handle(), ref_handle);
    assert_eq!(cleanup_record.token(), attach.token());
    assert_eq!(cleanup_record.action(), HostRootRefCommitAction::Attach);
    assert_eq!(
        cleanup_record.cleanup_return_phase(),
        HostRootRefCleanupReturnExecutionPhase::RecordAttachCleanupReturnHandle
    );
    assert!(cleanup_record.cleanup_return_handle_recording_gate());
    assert!(!cleanup_record.cleanup_return_execution_gate());
    assert!(!cleanup_record.changed_ref_cleanup_before_attach());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.work_in_progress()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_changed_ref_detach_before_new_ref_attach_metadata() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let old_ref = RefHandle::from_raw(111);
    let new_ref = RefHandle::from_raw(112);
    let old_state_node = StateNodeHandle::from_raw(211);
    let new_state_node = StateNodeHandle::from_raw(212);
    let current_child =
        append_host_ref_child(&mut store, current, old_ref, old_state_node, FiberFlags::NO);

    update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_child = append_host_ref_child(
        &mut store,
        render.work_in_progress(),
        new_ref,
        new_state_node,
        FiberFlags::REF,
    );
    store
        .fiber_arena_mut()
        .link_alternates(current_child, finished_child)
        .unwrap();
    store
        .fiber_arena_mut()
        .get_mut(render.work_in_progress())
        .unwrap()
        .set_subtree_flags(FiberFlags::REF);

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let refs = commit.ref_commit_metadata();
    let gate = commit.dom_ref_callback_commit_gate();
    let handoff = commit.ref_callback_execution_handoff();
    let cleanup_gate = commit.ref_cleanup_return_execution_gate();

    assert_eq!(refs.detach().len(), 1);
    assert_eq!(refs.attach().len(), 1);
    let detach = refs.detach()[0];
    assert_eq!(detach.fiber(), current_child);
    assert_eq!(detach.state_node(), old_state_node);
    assert_eq!(detach.ref_handle(), old_ref);
    assert_eq!(detach.action(), HostRootRefCommitAction::Detach);
    assert_eq!(
        detach.detach_reason(),
        Some(HostRootRefDetachReason::RefChanged)
    );
    assert_eq!(detach.token_phase(), HostFiberTokenPhase::Deletion);
    assert_eq!(detach.token_target(), HostFiberTokenTarget::Instance);
    assert_active_ref_token(&store, &detach);

    let attach = refs.attach()[0];
    assert_eq!(attach.fiber(), finished_child);
    assert_eq!(attach.state_node(), new_state_node);
    assert_eq!(attach.ref_handle(), new_ref);
    assert_eq!(attach.action(), HostRootRefCommitAction::Attach);
    assert_eq!(attach.token_phase(), HostFiberTokenPhase::Commit);
    assert_active_ref_token(&store, &attach);
    assert_dom_ref_callback_gate_is_inert(gate);
    assert_eq!(gate.len(), 2);
    assert_eq!(gate.records()[0].sequence(), 0);
    assert_eq!(gate.records()[0].fiber(), current_child);
    assert_eq!(gate.records()[0].token(), detach.token());
    assert_eq!(gate.records()[0].action(), HostRootRefCommitAction::Detach);
    assert_eq!(
        gate.records()[0].detach_reason(),
        Some(HostRootRefDetachReason::RefChanged)
    );
    assert_eq!(gate.records()[1].sequence(), 1);
    assert_eq!(gate.records()[1].fiber(), finished_child);
    assert_eq!(gate.records()[1].token(), attach.token());
    assert_eq!(gate.records()[1].action(), HostRootRefCommitAction::Attach);
    assert_eq!(gate.records()[1].detach_reason(), None);
    assert_ref_callback_execution_handoff_keeps_public_blockers(handoff);
    assert_eq!(handoff.len(), 2);
    assert_eq!(handoff.detach_count(), 1);
    assert_eq!(handoff.attach_count(), 1);
    assert_eq!(handoff.changed_ref_detach_before_attach_count(), 1);
    assert_eq!(handoff.records()[0].sequence(), 0);
    assert_eq!(handoff.records()[0].source_gate_sequence(), 0);
    assert_eq!(handoff.records()[0].fiber(), current_child);
    assert_eq!(handoff.records()[0].token(), detach.token());
    assert_eq!(
        handoff.records()[0].action(),
        HostRootRefCommitAction::Detach
    );
    assert_eq!(
        handoff.records()[0].execution_phase(),
        HostRootRefCallbackExecutionPhase::CallbackDetachCleanupOrNull
    );
    assert!(!handoff.records()[0].changed_ref_detach_before_attach());
    assert_eq!(handoff.records()[1].sequence(), 1);
    assert_eq!(handoff.records()[1].source_gate_sequence(), 1);
    assert_eq!(handoff.records()[1].fiber(), finished_child);
    assert_eq!(handoff.records()[1].token(), attach.token());
    assert_eq!(
        handoff.records()[1].action(),
        HostRootRefCommitAction::Attach
    );
    assert_eq!(
        handoff.records()[1].execution_phase(),
        HostRootRefCallbackExecutionPhase::CallbackAttach
    );
    assert!(handoff.records()[1].changed_ref_detach_before_attach());
    assert_ref_cleanup_return_execution_gate_keeps_public_blockers(cleanup_gate);
    assert_eq!(cleanup_gate.len(), 2);
    assert_eq!(cleanup_gate.cleanup_return_handle_record_gate_count(), 1);
    assert_eq!(cleanup_gate.cleanup_return_execution_gate_count(), 1);
    assert_eq!(cleanup_gate.changed_ref_cleanup_before_attach_count(), 1);
    assert_eq!(cleanup_gate.records()[0].sequence(), 0);
    assert_eq!(cleanup_gate.records()[0].source_handoff_sequence(), 0);
    assert_eq!(cleanup_gate.records()[0].source_gate_sequence(), 0);
    assert_eq!(cleanup_gate.records()[0].fiber(), current_child);
    assert_eq!(cleanup_gate.records()[0].token(), detach.token());
    assert_eq!(
        cleanup_gate.records()[0].cleanup_return_phase(),
        HostRootRefCleanupReturnExecutionPhase::ExecuteDetachCleanupReturnHandleOrNull
    );
    assert!(!cleanup_gate.records()[0].cleanup_return_handle_recording_gate());
    assert!(cleanup_gate.records()[0].cleanup_return_execution_gate());
    assert!(!cleanup_gate.records()[0].changed_ref_cleanup_before_attach());
    assert_eq!(cleanup_gate.records()[1].sequence(), 1);
    assert_eq!(cleanup_gate.records()[1].source_handoff_sequence(), 1);
    assert_eq!(cleanup_gate.records()[1].source_gate_sequence(), 1);
    assert_eq!(cleanup_gate.records()[1].fiber(), finished_child);
    assert_eq!(cleanup_gate.records()[1].token(), attach.token());
    assert_eq!(
        cleanup_gate.records()[1].cleanup_return_phase(),
        HostRootRefCleanupReturnExecutionPhase::RecordAttachCleanupReturnHandle
    );
    assert!(cleanup_gate.records()[1].cleanup_return_handle_recording_gate());
    assert!(!cleanup_gate.records()[1].cleanup_return_execution_gate());
    assert!(cleanup_gate.records()[1].changed_ref_cleanup_before_attach());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_ref_detach_update_attach_order_for_host_component_update() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let old_ref = RefHandle::from_raw(113);
    let new_ref = RefHandle::from_raw(114);
    let state_node = StateNodeHandle::from_raw(213);
    let current_props = PropsHandle::from_raw(313);
    let next_pending_props = PropsHandle::from_raw(314);
    let next_memoized_props = PropsHandle::from_raw(315);
    let current_child = attach_host_root_child(
        &mut store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        state_node,
        current_props,
        current_props,
    );
    store
        .fiber_arena_mut()
        .get_mut(current_child)
        .unwrap()
        .set_ref_handle(old_ref);

    update_container(&mut store, root_id, RootElementHandle::from_raw(48), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_child = attach_host_root_child(
        &mut store,
        render.finished_work(),
        FiberTag::HostComponent,
        FiberFlags::UPDATE | FiberFlags::REF,
        state_node,
        next_pending_props,
        next_memoized_props,
    );
    store
        .fiber_arena_mut()
        .get_mut(finished_child)
        .unwrap()
        .set_ref_handle(new_ref);
    store
        .fiber_arena_mut()
        .link_alternates(current_child, finished_child)
        .unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let apply_records = commit.mutation_apply_log().records();
    let refs = commit.ref_commit_metadata();
    let handoff = commit.ref_callback_execution_handoff();
    let cleanup_gate = commit.ref_cleanup_return_execution_gate();
    let order = commit.ref_host_component_update_order_for_canary();
    let order_records = order.records();

    assert_eq!(apply_records.len(), 1);
    assert_eq!(
        apply_records[0].kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(apply_records[0].fiber(), finished_child);
    assert_eq!(apply_records[0].alternate_fiber(), Some(current_child));
    assert_eq!(apply_records[0].state_node(), state_node);
    assert_eq!(apply_records[0].pending_props(), next_pending_props);
    assert_eq!(apply_records[0].memoized_props(), next_memoized_props);
    assert_eq!(
        apply_records[0].alternate_memoized_props(),
        Some(current_props)
    );

    assert_eq!(refs.detach().len(), 1);
    assert_eq!(refs.attach().len(), 1);
    assert_eq!(refs.detach()[0].fiber(), current_child);
    assert_eq!(refs.detach()[0].state_node(), state_node);
    assert_eq!(refs.detach()[0].ref_handle(), old_ref);
    assert_eq!(
        refs.detach()[0].detach_reason(),
        Some(HostRootRefDetachReason::RefChanged)
    );
    assert_eq!(refs.attach()[0].fiber(), finished_child);
    assert_eq!(refs.attach()[0].state_node(), state_node);
    assert_eq!(refs.attach()[0].ref_handle(), new_ref);

    assert_ref_callback_execution_handoff_keeps_public_blockers(handoff);
    assert_eq!(handoff.len(), 2);
    assert_eq!(handoff.detach_count(), 1);
    assert_eq!(handoff.attach_count(), 1);
    assert_eq!(handoff.changed_ref_detach_before_attach_count(), 1);
    assert_ref_cleanup_return_execution_gate_keeps_public_blockers(cleanup_gate);

    assert_eq!(order.changed_ref_update_count(), 1);
    assert_eq!(order.len(), 3);
    assert!(order.records_in_ref_detach_update_attach_order());
    assert!(!order.callback_refs_invoked());
    assert!(!order.object_refs_mutated());
    assert!(!order.host_mutations_executed());
    assert!(!order.public_roots_touched());
    assert!(!order.react_dom_ref_compatibility_claimed());
    assert_eq!(
        order_records
            .iter()
            .map(|record| record.sequence())
            .collect::<Vec<_>>(),
        vec![0, 1, 2]
    );
    assert_eq!(
        order_records
            .iter()
            .map(|record| record.kind_name())
            .collect::<Vec<_>>(),
        vec!["ref-detach", "host-component-update", "ref-attach"]
    );
    assert_eq!(
        order_records
            .iter()
            .map(|record| record.order_group())
            .collect::<Vec<_>>(),
        vec![0, 0, 0]
    );
    assert_eq!(
        order_records
            .iter()
            .map(|record| record.root())
            .collect::<Vec<_>>(),
        vec![root_id, root_id, root_id]
    );
    assert_eq!(
        order_records
            .iter()
            .map(|record| record.finished_work())
            .collect::<Vec<_>>(),
        vec![
            render.finished_work(),
            render.finished_work(),
            render.finished_work()
        ]
    );
    assert_eq!(
        order_records
            .iter()
            .map(|record| record.current_fiber())
            .collect::<Vec<_>>(),
        vec![
            Some(current_child),
            Some(current_child),
            Some(current_child)
        ]
    );
    assert_eq!(
        order_records
            .iter()
            .map(|record| record.updated_fiber())
            .collect::<Vec<_>>(),
        vec![finished_child, finished_child, finished_child]
    );
    assert_eq!(
        order_records
            .iter()
            .map(|record| record.fiber())
            .collect::<Vec<_>>(),
        vec![current_child, finished_child, finished_child]
    );
    assert_eq!(
        order_records
            .iter()
            .map(|record| record.state_node())
            .collect::<Vec<_>>(),
        vec![state_node, state_node, state_node]
    );
    assert_eq!(
        order_records
            .iter()
            .map(|record| record.source_sequence())
            .collect::<Vec<_>>(),
        vec![0, 0, 1]
    );
    assert_eq!(order_records[0].ref_handle(), old_ref);
    assert_eq!(order_records[1].ref_handle(), RefHandle::NONE);
    assert_eq!(order_records[2].ref_handle(), new_ref);
    assert_eq!(
        order_records[0].detach_reason(),
        Some(HostRootRefDetachReason::RefChanged)
    );
    assert_eq!(order_records[1].detach_reason(), None);
    assert_eq!(order_records[2].detach_reason(), None);
    assert_eq!(order_records[0].mutation_kind(), None);
    assert_eq!(
        order_records[1].mutation_kind(),
        Some(HostRootMutationApplyRecordKind::CommitHostComponentUpdate)
    );
    assert_eq!(
        order_records[1].mutation_kind_name(),
        Some("commit-host-component-update")
    );
    assert_eq!(order_records[2].mutation_kind(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_deleted_ref_detach_metadata_in_parent_before_child_order() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(47), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let deleted_parent = create_host_ref_fiber(
        &mut store,
        RefHandle::from_raw(121),
        StateNodeHandle::from_raw(221),
        FiberFlags::NO,
    );
    let deleted_child = create_host_ref_fiber(
        &mut store,
        RefHandle::from_raw(122),
        StateNodeHandle::from_raw(222),
        FiberFlags::NO,
    );
    store
        .fiber_arena_mut()
        .set_children(deleted_parent, &[deleted_child])
        .unwrap();
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(render.work_in_progress(), deleted_parent)
        .unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let refs = commit.ref_commit_metadata();
    let gate = commit.dom_ref_callback_commit_gate();
    let handoff = commit.ref_callback_execution_handoff();
    let cleanup_gate = commit.ref_cleanup_return_execution_gate();

    assert_eq!(refs.attach().len(), 0);
    assert_eq!(refs.detach().len(), 2);
    assert_eq!(refs.detach()[0].fiber(), deleted_parent);
    assert_eq!(refs.detach()[0].ref_handle(), RefHandle::from_raw(121));
    assert_eq!(
        refs.detach()[0].detach_reason(),
        Some(HostRootRefDetachReason::Deleted)
    );
    assert_eq!(
        refs.detach()[0].token_phase(),
        HostFiberTokenPhase::Deletion
    );
    assert_eq!(refs.detach()[1].fiber(), deleted_child);
    assert_eq!(refs.detach()[1].ref_handle(), RefHandle::from_raw(122));
    assert_eq!(
        refs.detach()[1].detach_reason(),
        Some(HostRootRefDetachReason::Deleted)
    );
    for record in refs.detach() {
        assert_eq!(record.action(), HostRootRefCommitAction::Detach);
        assert_eq!(record.token_target(), HostFiberTokenTarget::Instance);
        assert_active_ref_token(&store, record);
    }
    assert_dom_ref_callback_gate_is_inert(gate);
    assert_eq!(gate.len(), 2);
    assert_eq!(gate.records()[0].sequence(), 0);
    assert_eq!(gate.records()[0].fiber(), deleted_parent);
    assert_eq!(gate.records()[0].token(), refs.detach()[0].token());
    assert_eq!(gate.records()[0].action(), HostRootRefCommitAction::Detach);
    assert_eq!(
        gate.records()[0].detach_reason(),
        Some(HostRootRefDetachReason::Deleted)
    );
    assert_eq!(gate.records()[1].sequence(), 1);
    assert_eq!(gate.records()[1].fiber(), deleted_child);
    assert_eq!(gate.records()[1].token(), refs.detach()[1].token());
    assert_eq!(gate.records()[1].action(), HostRootRefCommitAction::Detach);
    assert_eq!(
        gate.records()[1].detach_reason(),
        Some(HostRootRefDetachReason::Deleted)
    );
    assert_ref_callback_execution_handoff_keeps_public_blockers(handoff);
    assert_eq!(handoff.len(), 2);
    assert_eq!(handoff.detach_count(), 2);
    assert_eq!(handoff.attach_count(), 0);
    assert_eq!(handoff.changed_ref_detach_before_attach_count(), 0);
    assert_eq!(handoff.records()[0].source_gate_sequence(), 0);
    assert_eq!(handoff.records()[0].fiber(), deleted_parent);
    assert_eq!(handoff.records()[0].token(), refs.detach()[0].token());
    assert_eq!(
        handoff.records()[0].detach_reason(),
        Some(HostRootRefDetachReason::Deleted)
    );
    assert_eq!(handoff.records()[1].source_gate_sequence(), 1);
    assert_eq!(handoff.records()[1].fiber(), deleted_child);
    assert_eq!(handoff.records()[1].token(), refs.detach()[1].token());
    assert_eq!(
        handoff.records()[1].detach_reason(),
        Some(HostRootRefDetachReason::Deleted)
    );
    assert_ref_cleanup_return_execution_gate_keeps_public_blockers(cleanup_gate);
    assert_eq!(cleanup_gate.len(), 2);
    assert_eq!(cleanup_gate.cleanup_return_handle_record_gate_count(), 0);
    assert_eq!(cleanup_gate.cleanup_return_execution_gate_count(), 2);
    assert_eq!(cleanup_gate.changed_ref_cleanup_before_attach_count(), 0);
    assert_eq!(cleanup_gate.records()[0].source_handoff_sequence(), 0);
    assert_eq!(cleanup_gate.records()[0].fiber(), deleted_parent);
    assert_eq!(cleanup_gate.records()[0].token(), refs.detach()[0].token());
    assert_eq!(
        cleanup_gate.records()[0].cleanup_return_phase(),
        HostRootRefCleanupReturnExecutionPhase::ExecuteDetachCleanupReturnHandleOrNull
    );
    assert!(cleanup_gate.records()[0].cleanup_return_execution_gate());
    assert_eq!(cleanup_gate.records()[1].source_handoff_sequence(), 1);
    assert_eq!(cleanup_gate.records()[1].fiber(), deleted_child);
    assert_eq!(cleanup_gate.records()[1].token(), refs.detach()[1].token());
    assert_eq!(
        cleanup_gate.records()[1].cleanup_return_phase(),
        HostRootRefCleanupReturnExecutionPhase::ExecuteDetachCleanupReturnHandleOrNull
    );
    assert!(cleanup_gate.records()[1].cleanup_return_execution_gate());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_deletion_order_gate_records_ref_cleanup_before_passive_destroy_metadata() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(48), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let fixture = attach_deleted_host_subtree_ref_passive_fixture(
        &mut store,
        &mut hook_store,
        render.finished_work(),
    );
    let deleted_passive_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        render.finished_work(),
        fixture.deleted_host,
        Lanes::DEFAULT,
    )
    .unwrap();

    assert_eq!(deleted_passive_handoff.root(), root_id);
    assert_eq!(
        deleted_passive_handoff.nearest_mounted_ancestor(),
        render.finished_work()
    );
    assert_eq!(deleted_passive_handoff.deleted_root(), fixture.deleted_host);
    assert_eq!(deleted_passive_handoff.queued_unmount_count(), 1);
    let queued_passive = deleted_passive_handoff.records()[0];
    assert_eq!(queued_passive.fiber(), fixture.deleted_function);
    assert_eq!(queued_passive.traversal_index(), 0);
    assert_eq!(queued_passive.create(), fixture.passive_create);
    assert_eq!(queued_passive.destroy(), Some(fixture.passive_destroy));
    assert_eq!(queued_passive.dependencies(), fixture.passive_dependencies);
    assert_eq!(
        queued_passive.unmount_order().phase(),
        PendingPassiveEffectPhase::Unmount
    );

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let handoff = commit.pending_passive_handoff().unwrap();
    assert_eq!(handoff.pending_unmount_count(), 1);
    assert_eq!(handoff.pending_mount_count(), 0);
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();
    assert_eq!(pending_passive.passive_unmounts().len(), 1);
    assert_eq!(
        pending_passive.passive_unmounts()[0].unmount_origin(),
        Some(PendingPassiveUnmountOrigin::DeletedSubtree {
            nearest_mounted_ancestor: render.finished_work()
        })
    );

    let passive_snapshot = commit
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[
            deleted_passive_handoff,
        ])
        .unwrap()
        .clone();
    let refs = commit.ref_commit_metadata();
    let cleanup_gate = commit.ref_cleanup_return_execution_gate();
    let host_cleanup = commit.host_node_deletion_cleanup_log();
    let order_gate = commit.deletion_cleanup_order_gate_for_canary();
    let order_records = order_gate.records();

    assert_eq!(commit.deletion_lists().len(), 1);
    assert_eq!(commit.deletion_lists()[0].list(), fixture.list);
    assert_eq!(
        commit.deletion_lists()[0].deleted(),
        &[fixture.deleted_host]
    );
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
    assert_ref_cleanup_return_execution_gate_keeps_public_blockers(cleanup_gate);
    assert_eq!(cleanup_gate.cleanup_return_execution_gate_count(), 1);
    assert_eq!(cleanup_gate.records()[0].fiber(), fixture.deleted_host);
    assert_eq!(cleanup_gate.records()[0].sequence(), 0);
    assert!(cleanup_gate.records()[0].cleanup_return_execution_gate());

    assert_eq!(passive_snapshot.len(), 1);
    assert_eq!(passive_snapshot.destroy_count(), 1);
    assert_eq!(passive_snapshot.records()[0], queued_passive);
    assert_eq!(host_cleanup.len(), 2);
    assert_eq!(host_cleanup.records()[0].fiber(), fixture.deleted_text);
    assert_eq!(
        host_cleanup.records()[0].state_node(),
        fixture.deleted_text_state_node
    );
    assert_eq!(host_cleanup.records()[1].fiber(), fixture.deleted_host);
    assert_eq!(
        host_cleanup.records()[1].state_node(),
        fixture.deleted_host_state_node
    );

    assert_eq!(order_gate.len(), 4);
    assert_eq!(order_gate.ref_cleanup_return_count(), 1);
    assert_eq!(order_gate.passive_destroy_count(), 1);
    assert_eq!(order_gate.host_node_cleanup_count(), 2);
    assert!(!order_gate.ref_cleanup_return_callbacks_invoked());
    assert!(!order_gate.passive_destroy_callbacks_invoked());
    assert!(!order_gate.public_effects_flushed());
    assert!(!order_gate.public_ref_or_effect_compatibility_claimed());
    assert_eq!(
        order_records
            .iter()
            .map(|record| record.sequence())
            .collect::<Vec<_>>(),
        vec![0, 1, 2, 3]
    );
    assert_eq!(
        order_records
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
    assert_eq!(order_records[0].fiber(), fixture.deleted_host);
    assert_eq!(order_records[0].deleted_root(), fixture.deleted_host);
    assert_eq!(order_records[0].deletion_list(), Some(fixture.list));
    assert_eq!(order_records[0].deletion_list_index(), Some(0));
    assert_eq!(order_records[0].deleted_index(), Some(0));
    assert_eq!(order_records[0].subtree_index(), Some(1));
    assert_eq!(order_records[0].ref_cleanup_return_sequence(), Some(0));
    assert_eq!(order_records[0].passive_unmount_order(), None);
    assert_eq!(order_records[0].host_cleanup_sequence(), None);
    assert_eq!(order_records[1].fiber(), fixture.deleted_function);
    assert_eq!(order_records[1].deleted_root(), fixture.deleted_host);
    assert_eq!(order_records[1].deletion_list(), Some(fixture.list));
    assert_eq!(order_records[1].subtree_index(), Some(0));
    assert_eq!(
        order_records[1].passive_unmount_order(),
        Some(queued_passive.unmount_order())
    );
    assert_eq!(
        order_records[1].passive_destroy(),
        Some(fixture.passive_destroy)
    );
    assert_eq!(order_records[2].fiber(), fixture.deleted_text);
    assert_eq!(order_records[2].host_cleanup_sequence(), Some(0));
    assert_eq!(order_records[3].fiber(), fixture.deleted_host);
    assert_eq!(order_records[3].host_cleanup_sequence(), Some(1));
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_nested_deletion_orders_ref_cleanup_passive_schedule_and_host_detach_plan() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(50), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let fixture = attach_nested_deleted_host_subtree_ref_passive_fixture(
        &mut store,
        &mut hook_store,
        render.finished_work(),
    );
    let deleted_passive_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        fixture.host_parent,
        fixture.deleted_host,
        Lanes::DEFAULT,
    )
    .unwrap();

    assert_eq!(deleted_passive_handoff.root(), root_id);
    assert_eq!(
        deleted_passive_handoff.nearest_mounted_ancestor(),
        fixture.host_parent
    );
    assert_eq!(deleted_passive_handoff.deleted_root(), fixture.deleted_host);
    assert_eq!(deleted_passive_handoff.queued_unmount_count(), 1);
    let queued_passive = deleted_passive_handoff.records()[0];
    assert_eq!(queued_passive.fiber(), fixture.deleted_function);
    assert_eq!(queued_passive.traversal_index(), 0);
    assert_eq!(queued_passive.create(), fixture.passive_create);
    assert_eq!(queued_passive.destroy(), Some(fixture.passive_destroy));
    assert_eq!(queued_passive.dependencies(), fixture.passive_dependencies);

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let handoff = commit.pending_passive_handoff().unwrap();
    assert_eq!(handoff.pending_unmount_count(), 1);
    assert_eq!(handoff.pending_mount_count(), 0);
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();
    assert_eq!(pending_passive.passive_unmounts().len(), 1);
    assert_eq!(
        pending_passive.passive_unmounts()[0].fiber(),
        fixture.deleted_function
    );
    assert_eq!(
        pending_passive.passive_unmounts()[0].unmount_origin(),
        Some(PendingPassiveUnmountOrigin::DeletedSubtree {
            nearest_mounted_ancestor: fixture.host_parent
        })
    );

    let passive_snapshot = commit
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[
            deleted_passive_handoff,
        ])
        .unwrap()
        .clone();
    let refs = commit.ref_commit_metadata();
    let cleanup_gate = commit.ref_cleanup_return_execution_gate();
    let host_cleanup = commit.host_node_deletion_cleanup_log();
    let order_gate = commit.deletion_cleanup_order_gate_for_canary();
    let order_records = order_gate.records();
    let plan = commit
        .deletion_subtree_host_detachment_plan_for_canary()
        .unwrap();

    assert_eq!(commit.deletion_lists().len(), 1);
    assert_eq!(commit.deletion_lists()[0].parent(), fixture.host_parent);
    assert_eq!(commit.deletion_lists()[0].list(), fixture.list);
    assert_eq!(
        commit.deletion_lists()[0].deleted(),
        &[fixture.deleted_host]
    );
    assert_eq!(refs.attach().len(), 0);
    assert_eq!(refs.detach().len(), 2);
    assert_eq!(refs.detach()[0].fiber(), fixture.deleted_host);
    assert_eq!(
        refs.detach()[0].state_node(),
        fixture.deleted_host_state_node
    );
    assert_eq!(refs.detach()[0].ref_handle(), fixture.deleted_host_ref);
    assert_eq!(refs.detach()[1].fiber(), fixture.nested_host);
    assert_eq!(
        refs.detach()[1].state_node(),
        fixture.nested_host_state_node
    );
    assert_eq!(refs.detach()[1].ref_handle(), fixture.nested_host_ref);
    for record in refs.detach() {
        assert_eq!(record.action(), HostRootRefCommitAction::Detach);
        assert_eq!(
            record.detach_reason(),
            Some(HostRootRefDetachReason::Deleted)
        );
        assert_eq!(record.token_phase(), HostFiberTokenPhase::Deletion);
        assert_eq!(record.token_target(), HostFiberTokenTarget::Instance);
        assert_active_ref_token(&store, record);
    }
    assert_ref_cleanup_return_execution_gate_keeps_public_blockers(cleanup_gate);
    assert_eq!(cleanup_gate.len(), 2);
    assert_eq!(cleanup_gate.cleanup_return_execution_gate_count(), 2);
    assert_eq!(cleanup_gate.records()[0].fiber(), fixture.deleted_host);
    assert_eq!(cleanup_gate.records()[0].sequence(), 0);
    assert_eq!(cleanup_gate.records()[1].fiber(), fixture.nested_host);
    assert_eq!(cleanup_gate.records()[1].sequence(), 1);

    assert_eq!(passive_snapshot.len(), 1);
    assert_eq!(passive_snapshot.destroy_count(), 1);
    assert_eq!(passive_snapshot.records()[0], queued_passive);
    assert_eq!(host_cleanup.len(), 3);
    assert_eq!(host_cleanup.records()[0].fiber(), fixture.deleted_text);
    assert_eq!(
        host_cleanup.records()[0].state_node(),
        fixture.deleted_text_state_node
    );
    assert_eq!(host_cleanup.records()[0].subtree_index(), 0);
    assert_eq!(host_cleanup.records()[1].fiber(), fixture.nested_host);
    assert_eq!(
        host_cleanup.records()[1].state_node(),
        fixture.nested_host_state_node
    );
    assert_eq!(host_cleanup.records()[1].subtree_index(), 1);
    assert_eq!(host_cleanup.records()[2].fiber(), fixture.deleted_host);
    assert_eq!(
        host_cleanup.records()[2].state_node(),
        fixture.deleted_host_state_node
    );
    assert_eq!(host_cleanup.records()[2].subtree_index(), 2);
    for record in host_cleanup.records() {
        assert_eq!(record.host_parent(), Some(fixture.host_parent));
        assert_eq!(record.host_parent_tag(), Some(FiberTag::HostComponent));
        assert_eq!(
            record.host_parent_state_node(),
            fixture.host_parent_state_node
        );
        assert_eq!(record.host_parent_traversal_depth(), Some(0));
        assert_eq!(record.deleted_root(), fixture.deleted_host);
    }

    assert_eq!(order_gate.len(), 6);
    assert_eq!(order_gate.ref_cleanup_return_count(), 2);
    assert_eq!(order_gate.passive_destroy_count(), 1);
    assert_eq!(order_gate.host_node_cleanup_count(), 3);
    assert!(!order_gate.ref_cleanup_return_callbacks_invoked());
    assert!(!order_gate.passive_destroy_callbacks_invoked());
    assert!(!order_gate.public_effects_flushed());
    assert!(!order_gate.public_ref_or_effect_compatibility_claimed());
    assert_eq!(
        order_records
            .iter()
            .map(|record| record.phase())
            .collect::<Vec<_>>(),
        vec![
            HostRootDeletionCleanupOrderPhase::RefCleanupReturn,
            HostRootDeletionCleanupOrderPhase::RefCleanupReturn,
            HostRootDeletionCleanupOrderPhase::PassiveDestroy,
            HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
            HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
            HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
        ]
    );
    assert_eq!(order_records[0].fiber(), fixture.deleted_host);
    assert_eq!(order_records[0].subtree_index(), Some(2));
    assert_eq!(order_records[0].ref_cleanup_return_sequence(), Some(0));
    assert_eq!(order_records[1].fiber(), fixture.nested_host);
    assert_eq!(order_records[1].subtree_index(), Some(1));
    assert_eq!(order_records[1].ref_cleanup_return_sequence(), Some(1));
    assert_eq!(order_records[2].fiber(), fixture.deleted_function);
    assert_eq!(
        order_records[2].passive_unmount_order(),
        Some(queued_passive.unmount_order())
    );
    assert_eq!(
        order_records[2].passive_destroy(),
        Some(fixture.passive_destroy)
    );
    assert_eq!(order_records[3].fiber(), fixture.deleted_text);
    assert_eq!(order_records[3].host_cleanup_sequence(), Some(0));
    assert_eq!(order_records[4].fiber(), fixture.nested_host);
    assert_eq!(order_records[4].host_cleanup_sequence(), Some(1));
    assert_eq!(order_records[5].fiber(), fixture.deleted_host);
    assert_eq!(order_records[5].host_cleanup_sequence(), Some(2));

    assert_eq!(plan.root(), root_id);
    assert_eq!(plan.finished_work(), render.finished_work());
    assert_eq!(plan.deletion_list(), fixture.list);
    assert_eq!(plan.deleted_root(), fixture.deleted_host);
    assert_eq!(plan.deleted_root_tag(), FiberTag::HostComponent);
    assert_eq!(plan.parent(), fixture.host_parent);
    assert_eq!(plan.parent_tag(), FiberTag::HostComponent);
    assert_eq!(plan.host_parent(), fixture.host_parent);
    assert_eq!(
        plan.host_parent_state_node(),
        fixture.host_parent_state_node
    );
    assert_eq!(plan.host_parent_traversal_depth(), 0);
    assert_eq!(plan.host_child(), fixture.deleted_host);
    assert_eq!(plan.host_child_tag(), FiberTag::HostComponent);
    assert_eq!(
        plan.host_child_state_node(),
        fixture.deleted_host_state_node
    );
    assert_eq!(plan.host_child_traversal_depth(), 0);
    assert_eq!(plan.cleanup_sequence(), 2);
    assert_eq!(plan.cleanup_order_sequence(), 5);
    assert!(!plan.public_unmount_compatibility_claimed());
    assert!(!plan.broad_host_teardown_enabled());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_rejects_ref_metadata_without_host_state_node_before_switching_current() {
    let (mut store, root_id, _host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(48), None).unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let child = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::NONE,
        FiberMode::NO,
    );
    {
        let node = store.fiber_arena_mut().get_mut(child).unwrap();
        node.set_ref_handle(RefHandle::from_raw(131));
        node.set_flags(FiberFlags::REF);
    }
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[child])
        .unwrap();
    store
        .fiber_arena_mut()
        .get_mut(render.work_in_progress())
        .unwrap()
        .set_subtree_flags(FiberFlags::REF);

    let error = commit_finished_host_root(&mut store, render).unwrap_err();

    assert!(matches!(
        error,
        RootCommitError::RefHostInstanceMissing {
            root,
            fiber
        } if root == root_id && fiber == child
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert!(store.host_tokens().is_empty());
}
#[test]
fn dom_ref_callback_gate_revalidates_source_tokens_by_phase_and_target() {
    let (mut store, root_id, _host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(49), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let ref_handle = RefHandle::from_raw(141);
    let state_node = StateNodeHandle::from_raw(241);
    append_host_ref_child(
        &mut store,
        render.work_in_progress(),
        ref_handle,
        state_node,
        FiberFlags::REF,
    );
    store
        .fiber_arena_mut()
        .get_mut(render.work_in_progress())
        .unwrap()
        .set_subtree_flags(FiberFlags::REF);
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let metadata = commit.ref_commit_metadata().clone();
    let attach = metadata.attach()[0];
    store
        .host_tokens_mut()
        .invalidate(attach.token(), attach.token_phase(), attach.token_target())
        .unwrap();

    let error = materialize_dom_ref_callback_commit_gate(&store, &metadata).unwrap_err();

    assert!(matches!(
        error,
        RootCommitError::HostFiberToken(error)
            if error.violation() == HostFiberTokenViolation::Stale
                && error.phase() == HostFiberTokenPhase::Commit
                && error.target() == HostFiberTokenTarget::Instance
    ));
}
#[test]
fn ref_callback_execution_handoff_revalidates_root_commit_source_tokens() {
    let (mut store, root_id, _host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(50), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let ref_handle = RefHandle::from_raw(142);
    let state_node = StateNodeHandle::from_raw(242);
    append_host_ref_child(
        &mut store,
        render.work_in_progress(),
        ref_handle,
        state_node,
        FiberFlags::REF,
    );
    store
        .fiber_arena_mut()
        .get_mut(render.work_in_progress())
        .unwrap()
        .set_subtree_flags(FiberFlags::REF);
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let gate = commit.dom_ref_callback_commit_gate().clone();
    let attach = commit.ref_commit_metadata().attach()[0];
    store
        .host_tokens_mut()
        .invalidate(attach.token(), attach.token_phase(), attach.token_target())
        .unwrap();

    let error = materialize_ref_callback_execution_handoff(&store, &gate).unwrap_err();

    assert!(matches!(
        error,
        RootCommitError::HostFiberToken(error)
            if error.violation() == HostFiberTokenViolation::Stale
                && error.phase() == HostFiberTokenPhase::Commit
                && error.target() == HostFiberTokenTarget::Instance
    ));
}
#[test]
fn ref_cleanup_return_execution_gate_revalidates_handoff_source_tokens() {
    let (mut store, root_id, _host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(51), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let ref_handle = RefHandle::from_raw(143);
    let state_node = StateNodeHandle::from_raw(243);
    append_host_ref_child(
        &mut store,
        render.work_in_progress(),
        ref_handle,
        state_node,
        FiberFlags::REF,
    );
    store
        .fiber_arena_mut()
        .get_mut(render.work_in_progress())
        .unwrap()
        .set_subtree_flags(FiberFlags::REF);
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let handoff = commit.ref_callback_execution_handoff().clone();
    let attach = commit.ref_commit_metadata().attach()[0];
    store
        .host_tokens_mut()
        .invalidate(attach.token(), attach.token_phase(), attach.token_target())
        .unwrap();

    let error = materialize_ref_cleanup_return_execution_gate(&store, &handoff).unwrap_err();

    assert!(matches!(
        error,
        RootCommitError::HostFiberToken(error)
            if error.violation() == HostFiberTokenViolation::Stale
                && error.phase() == HostFiberTokenPhase::Commit
                && error.target() == HostFiberTokenTarget::Instance
    ));
}
#[test]
fn dom_ref_callback_gate_rejects_invalid_source_metadata_shape() {
    let (mut store, root_id, _host) = root_store();
    let fiber = create_host_ref_fiber(
        &mut store,
        RefHandle::from_raw(151),
        StateNodeHandle::from_raw(251),
        FiberFlags::NO,
    );
    let token = store.host_tokens_mut().issue(
        root_id,
        fiber,
        HostFiberTokenPhase::Commit,
        HostFiberTokenTarget::Instance,
    );
    let metadata = HostRootRefCommitSnapshot {
        detach: Vec::new(),
        attach: vec![HostRootRefCommitRecord {
            root: root_id,
            fiber,
            state_node: StateNodeHandle::from_raw(251),
            ref_handle: RefHandle::from_raw(151),
            token,
            token_phase: HostFiberTokenPhase::Commit,
            token_target: HostFiberTokenTarget::Instance,
            action: HostRootRefCommitAction::Attach,
            detach_reason: Some(HostRootRefDetachReason::RefChanged),
        }],
    };

    let error = materialize_dom_ref_callback_commit_gate(&store, &metadata).unwrap_err();

    assert!(matches!(
        error,
        RootCommitError::DomRefCallbackGateDetachReasonMismatch {
            root,
            fiber: error_fiber,
            action: "attach",
            detach_reason: Some("ref-changed")
        } if root == root_id && error_fiber == fiber
    ));
}
