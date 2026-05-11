use super::helpers::*;
use super::*;

#[test]
fn root_commit_records_pending_passive_handoff_without_effect_traversal() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(44), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .prepare_pending_passive(root_id, Lanes::NO);

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let handoff = commit.pending_passive_handoff().unwrap();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), render.finished_work());
    assert_eq!(handoff.lanes(), Lanes::DEFAULT);
    assert_eq!(pending_passive.root(), Some(root_id));
    assert_eq!(
        pending_passive.finished_work(),
        Some(render.finished_work())
    );
    assert_eq!(pending_passive.lanes(), Lanes::DEFAULT);
    assert!(pending_passive.has_commit_handoff());
    assert!(!pending_passive.has_effects());
    assert!(pending_passive.passive_unmounts().is_empty());
    assert!(pending_passive.passive_mounts().is_empty());
    assert!(commit.root_update_callbacks().is_empty());
    assert!(commit.ref_commit_metadata().is_empty());
    assert!(commit.dom_ref_callback_commit_gate().is_empty());
    assert!(commit.ref_callback_execution_handoff().is_empty());
    assert!(commit.ref_cleanup_return_execution_gate().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_queues_function_component_passive_metadata_into_handoff_without_effects() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(710);
    let current_function = append_function_component_child(
        &mut store,
        current_root,
        PropsHandle::from_raw(711),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(712),
            deps(713),
            Some(callback(714)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_function = append_function_component_child(
        &mut store,
        render.finished_work(),
        PropsHandle::from_raw(715),
        component,
    );
    store
        .fiber_arena_mut()
        .link_alternates(current_function, finished_function)
        .unwrap();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), finished_function)
        .unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let registration = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(716),
            deps(717),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let queued = queue_function_component_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        state,
        Lanes::DEFAULT,
    )
    .unwrap();

    assert_eq!(queued.root(), root_id);
    assert_eq!(queued.fiber(), finished_function);
    assert_eq!(queued.phase(), FunctionComponentHookRenderPhase::Update);
    assert_eq!(queued.lanes(), Lanes::DEFAULT);
    assert_eq!(queued.records().len(), 1);
    assert_eq!(queued.queued_unmount_count(), 1);
    assert_eq!(queued.queued_mount_count(), 1);
    let queued_effect = queued.records()[0];
    assert_eq!(queued_effect.fiber(), finished_function);
    assert_eq!(queued_effect.effect_index(), 0);
    assert_eq!(queued_effect.effect(), registration.effect());
    assert_eq!(queued_effect.previous_effect(), Some(previous.effect()));
    assert_eq!(queued_effect.instance(), previous.instance());
    assert_eq!(queued_effect.instance(), registration.instance());
    assert_eq!(queued_effect.create(), callback(716));
    assert_eq!(queued_effect.destroy(), Some(callback(714)));
    assert_eq!(queued_effect.lanes(), Lanes::DEFAULT);
    assert!(
        queued_effect.unmount_order().unwrap().flush_rank()
            < queued_effect.mount_order().flush_rank()
    );
    let phase_records = queued.effect_phase_records();
    assert_eq!(phase_records.len(), 2);
    assert_eq!(phase_records[0].fiber(), finished_function);
    assert_eq!(phase_records[0].effect_index(), 0);
    assert_eq!(phase_records[0].effect(), registration.effect());
    assert_eq!(phase_records[0].previous_effect(), Some(previous.effect()));
    assert_eq!(phase_records[0].instance(), registration.instance());
    assert_eq!(phase_records[0].create(), None);
    assert_eq!(phase_records[0].destroy(), Some(callback(714)));
    assert_eq!(phase_records[0].lanes(), Lanes::DEFAULT);
    assert_eq!(phase_records[0].phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(
        phase_records[0].order(),
        queued_effect.unmount_order().unwrap()
    );
    assert_eq!(phase_records[1].fiber(), finished_function);
    assert_eq!(phase_records[1].effect_index(), 0);
    assert_eq!(phase_records[1].effect(), registration.effect());
    assert_eq!(phase_records[1].previous_effect(), Some(previous.effect()));
    assert_eq!(phase_records[1].instance(), registration.instance());
    assert_eq!(phase_records[1].create(), Some(callback(716)));
    assert_eq!(phase_records[1].destroy(), None);
    assert_eq!(phase_records[1].lanes(), Lanes::DEFAULT);
    assert_eq!(phase_records[1].phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(phase_records[1].order(), queued_effect.mount_order());
    assert!(phase_records[0].order() < phase_records[1].order());

    let pending_before_commit = store.root(root_id).unwrap().scheduling().pending_passive();
    assert_eq!(pending_before_commit.root(), Some(root_id));
    assert_eq!(pending_before_commit.finished_work(), None);
    assert_eq!(pending_before_commit.passive_unmounts().len(), 1);
    assert_eq!(pending_before_commit.passive_mounts().len(), 1);
    assert_eq!(
        pending_before_commit.passive_unmounts()[0].fiber(),
        finished_function
    );
    assert_eq!(
        pending_before_commit.passive_mounts()[0].fiber(),
        finished_function
    );
    assert_eq!(
        pending_before_commit.passive_unmounts()[0].unmount_origin(),
        Some(PendingPassiveUnmountOrigin::UpdatedFiber)
    );

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let handoff = commit.pending_passive_handoff().unwrap();
    let pending_after_commit = store.root(root_id).unwrap().scheduling().pending_passive();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), render.finished_work());
    assert_eq!(handoff.lanes(), Lanes::DEFAULT);
    assert_eq!(handoff.pending_unmount_count(), 1);
    assert_eq!(handoff.pending_mount_count(), 1);
    assert_eq!(handoff.pending_record_count(), 2);
    assert_eq!(
        pending_after_commit.finished_work(),
        Some(render.finished_work())
    );
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(previous.instance())
            .unwrap()
            .destroy(),
        Some(callback(714))
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_persists_function_component_effect_queue_without_passive_handoff_metadata() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(720);
    let current_function = append_function_component_child(
        &mut store,
        current_root,
        PropsHandle::from_raw(721),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_changed = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(722),
            deps(723),
            Some(callback(724)),
        )
        .unwrap();
    let previous_unchanged = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(725),
            deps(726),
            Some(callback(727)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_function = append_function_component_child(
        &mut store,
        render.finished_work(),
        PropsHandle::from_raw(728),
        component,
    );
    store
        .fiber_arena_mut()
        .link_alternates(current_function, finished_function)
        .unwrap();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), finished_function)
        .unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let changed = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(729),
            deps(730),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    let unchanged = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(731),
            deps(726),
            FunctionComponentEffectDependencyStatus::Unchanged,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    assert_eq!(commit.pending_passive_handoff(), None);
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .is_empty()
    );

    let committed = commit_function_component_effect_queues_for_committed_root(
        &store,
        root_id,
        &mut hook_store,
        Lanes::DEFAULT,
    )
    .unwrap();

    assert_eq!(committed.len(), 1);
    let queue = &committed[0];
    assert_eq!(queue.fiber(), finished_function);
    assert_eq!(queue.phase(), FunctionComponentHookRenderPhase::Update);
    assert_eq!(queue.hook_list(), state.work_in_progress_list());
    assert_eq!(queue.lanes(), Lanes::DEFAULT);
    assert_eq!(queue.len(), 2);
    assert_eq!(queue.accepted_passive_count(), 1);
    assert_eq!(
        hook_store.current_list(finished_function),
        Some(state.work_in_progress_list())
    );
    assert_eq!(
        hook_store.committed_effect_queue(finished_function),
        Some(queue)
    );

    let records = queue.records();
    assert_eq!(
        records[0].previous_effect(),
        Some(previous_changed.effect())
    );
    assert_eq!(records[0].effect(), changed.effect());
    assert_eq!(records[0].destroy(), Some(callback(724)));
    assert!(records[0].accepted_for_pending_passive());
    assert_eq!(
        records[1].previous_effect(),
        Some(previous_unchanged.effect())
    );
    assert_eq!(records[1].effect(), unchanged.effect());
    assert_eq!(records[1].destroy(), Some(callback(727)));
    assert!(!records[1].accepted_for_pending_passive());

    let firing_passive = hook_store
        .committed_passive_effect_metadata(finished_function, HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(firing_passive.len(), 1);
    assert_eq!(firing_passive[0].effect(), changed.effect());
    assert_eq!(firing_passive[0].destroy(), Some(callback(724)));
    let all_passive =
        hook_store.committed_passive_effect_metadata(finished_function, HookEffectFlags::PASSIVE);
    assert_eq!(all_passive.len(), 2);
    assert_eq!(all_passive[0].effect(), changed.effect());
    assert_eq!(all_passive[1].effect(), unchanged.effect());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_committed_passive_execution_gate_runs_callbacks_under_test_control() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(732);
    let current_function = append_function_component_child(
        &mut store,
        current_root,
        PropsHandle::from_raw(733),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(734),
            deps(735),
            Some(callback(736)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(49), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(737),
        component,
    );
    store
        .fiber_arena_mut()
        .link_alternates(current_function, finished_function)
        .unwrap();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), finished_function)
        .unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let registration = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(738),
            deps(739),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let queued = queue_function_component_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        state,
        Lanes::DEFAULT,
    )
    .unwrap();
    let queued_effect = queued.records()[0];
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let committed = commit
        .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
            &queued,
        ))
        .unwrap();
    assert_eq!(committed.fiber_count(), 1);
    assert_eq!(committed.fibers()[0].fiber(), finished_function);
    assert_eq!(committed.queued_unmount_count(), 1);
    assert_eq!(committed.queued_mount_count(), 1);

    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut control =
        TestPassiveEffectCallbackControl::default().with_returned_destroy(callback(740));

    let execution =
            execute_passive_effect_callbacks_after_commit_from_committed_fiber_effects_under_test_control_for_canary(
                &mut store,
                &commit,
                &mut control,
            )
            .unwrap();

    assert_eq!(execution.root(), root_id);
    assert_eq!(execution.finished_work(), Some(finished_work));
    assert_eq!(execution.lanes(), Lanes::DEFAULT);
    assert_eq!(execution.flush_status(), PassiveEffectsFlushStatus::Flushed);
    assert_eq!(execution.flush_record_count(), 2);
    assert_eq!(execution.skipped_flush_records_without_callbacks(), 0);
    assert_eq!(execution.len(), 2);
    assert_eq!(execution.completed_count(), 2);
    assert_eq!(execution.error_count(), 0);
    assert!(!execution.has_errors());
    assert_eq!(
        execution.status(),
        PassiveEffectCallbackInvocationGateStatus::TestControlOnly
    );
    assert_eq!(
        execution.blockers(),
        &PASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
    );
    assert!(!execution.public_effect_execution_enabled());
    assert!(!execution.public_act_compatibility_claimed());
    assert!(!execution.scheduler_driven_passive_execution_enabled());

    let records = execution.records();
    assert_eq!(records[0].invocation_order(), 0);
    assert_eq!(records[1].invocation_order(), 1);
    assert_eq!(
        records[0].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(
        records[1].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert_eq!(
        records[0].status(),
        PassiveEffectCallbackInvocationStatus::Completed
    );
    assert_eq!(
        records[1].status(),
        PassiveEffectCallbackInvocationStatus::Completed
    );
    assert_eq!(
        records[0].pending_order(),
        queued_effect.unmount_order().unwrap()
    );
    assert_eq!(records[1].pending_order(), queued_effect.mount_order());
    assert!(records[0].pending_order() < records[1].pending_order());
    assert_eq!(records[0].fiber(), finished_function);
    assert_eq!(records[1].fiber(), finished_function);
    assert_eq!(records[0].effect(), registration.effect());
    assert_eq!(records[1].effect(), registration.effect());
    assert_eq!(records[0].instance(), previous.instance());
    assert_eq!(records[1].instance(), registration.instance());
    assert_eq!(records[0].callback(), callback(736));
    assert_eq!(records[1].callback(), callback(738));
    assert_eq!(records[0].returned_destroy(), None);
    assert_eq!(records[1].returned_destroy(), Some(callback(740)));

    assert_eq!(control.calls().len(), 2);
    assert_eq!(
        control.calls()[0].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(
        control.calls()[1].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .is_empty()
    );
    assert_eq!(
        store.scheduler_bridge().callback_requests().len(),
        callback_request_count
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_layout_effect_handoff_in_react_order_without_callbacks() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(47), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mode = store
        .fiber_arena()
        .get(render.finished_work())
        .unwrap()
        .mode();
    let parent = create_function_component_fiber(
        &mut store,
        mode,
        PropsHandle::from_raw(740),
        FiberTypeHandle::from_raw(741),
    );
    let child = create_function_component_fiber(
        &mut store,
        mode,
        PropsHandle::from_raw(742),
        FiberTypeHandle::from_raw(743),
    );
    let sibling = create_function_component_fiber(
        &mut store,
        mode,
        PropsHandle::from_raw(744),
        FiberTypeHandle::from_raw(745),
    );
    store
        .fiber_arena_mut()
        .set_children(parent, &[child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[parent, sibling])
        .unwrap();

    let mut hook_store = FunctionComponentHookRenderStore::new();
    let parent_state = hook_store
        .prepare_render_state(store.fiber_arena(), parent)
        .unwrap();
    let mut parent_cursor = hook_store.begin_render_cursor(parent_state).unwrap();
    let parent_layout = hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut parent_cursor,
            FunctionComponentEffectPhase::Layout,
            callback(746),
            deps(747),
        )
        .unwrap();
    let parent_passive = hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut parent_cursor,
            FunctionComponentEffectPhase::Passive,
            callback(748),
            deps(749),
        )
        .unwrap();
    hook_store.finish_render_cursor(parent_cursor).unwrap();

    let child_state = hook_store
        .prepare_render_state(store.fiber_arena(), child)
        .unwrap();
    let mut child_cursor = hook_store.begin_render_cursor(child_state).unwrap();
    let child_layout = hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut child_cursor,
            FunctionComponentEffectPhase::Layout,
            callback(750),
            deps(751),
        )
        .unwrap();
    hook_store.finish_render_cursor(child_cursor).unwrap();

    let sibling_state = hook_store
        .prepare_render_state(store.fiber_arena(), sibling)
        .unwrap();
    let mut sibling_cursor = hook_store.begin_render_cursor(sibling_state).unwrap();
    let sibling_layout = hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut sibling_cursor,
            FunctionComponentEffectPhase::Layout,
            callback(752),
            deps(753),
        )
        .unwrap();
    hook_store.finish_render_cursor(sibling_cursor).unwrap();

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    assert!(commit.function_component_layout_effects().is_empty());
    let snapshot = commit
        .record_function_component_layout_effects_for_canary(&store, &mut hook_store)
        .unwrap()
        .clone();

    assert_eq!(snapshot.len(), 3);
    assert_eq!(snapshot.destroy_count(), 0);
    assert_eq!(snapshot.create_count(), 3);
    assert_eq!(snapshot.phase_records().len(), 3);
    assert!(!snapshot.layout_callbacks_invoked());
    assert!(!snapshot.dom_mutation_side_effects_performed());
    assert!(!snapshot.refs_attached_or_detached());
    assert!(!snapshot.public_effect_compatibility_claimed());
    assert_eq!(commit.function_component_layout_effects(), &snapshot);
    let records = snapshot.records();
    assert_eq!(records[0].commit_order(), 0);
    assert_eq!(records[0].destroy_order(), None);
    assert_eq!(records[0].create_order(), 0);
    assert_eq!(records[0].fiber(), child);
    assert_eq!(
        records[0].render_phase(),
        FunctionComponentHookRenderPhase::Mount
    );
    assert_eq!(
        records[0].dependency_phase(),
        FunctionComponentEffectDependencyPhase::Mount
    );
    assert_eq!(records[0].hook_list(), child_state.work_in_progress_list());
    assert_eq!(records[0].effect_index(), 0);
    assert_eq!(records[0].effect(), child_layout.effect());
    assert_eq!(records[0].previous_effect(), None);
    assert_eq!(records[0].instance(), child_layout.instance());
    assert_eq!(records[0].tag(), HookEffectFlags::LAYOUT_EFFECT);
    assert_eq!(records[0].create(), callback(750));
    assert_eq!(records[0].destroy(), None);
    assert_eq!(records[0].previous_dependencies(), None);
    assert_eq!(records[0].dependencies(), deps(751));
    assert_eq!(records[0].dependency_status(), None);
    assert_eq!(records[0].lanes(), Lanes::DEFAULT);
    let phase_records = snapshot.phase_records();
    assert_eq!(
        phase_records[0].handoff(),
        FunctionComponentLayoutEffectHandoff::Create
    );
    assert_eq!(
        phase_records[0].commit_phase(),
        FunctionComponentLayoutEffectCommitPhase::Layout
    );
    assert_eq!(phase_records[0].order(), 0);
    assert_eq!(phase_records[0].source_commit_order(), 0);
    assert_eq!(phase_records[0].create(), Some(callback(750)));
    assert_eq!(phase_records[0].destroy(), None);

    assert_eq!(records[1].commit_order(), 1);
    assert_eq!(records[1].create_order(), 1);
    assert_eq!(records[1].fiber(), parent);
    assert_eq!(records[1].effect(), parent_layout.effect());
    assert_eq!(records[1].create(), callback(746));
    assert_eq!(records[1].dependencies(), deps(747));
    assert_eq!(records[2].commit_order(), 2);
    assert_eq!(records[2].create_order(), 2);
    assert_eq!(records[2].fiber(), sibling);
    assert_eq!(records[2].effect(), sibling_layout.effect());
    assert_eq!(records[2].create(), callback(752));
    assert_eq!(records[2].dependencies(), deps(753));

    let parent_queue = hook_store.committed_effect_queue(parent).unwrap();
    assert_eq!(parent_queue.accepted_layout_count(), 1);
    assert_eq!(parent_queue.accepted_passive_count(), 1);
    assert_eq!(parent_queue.records()[1].effect(), parent_passive.effect());
    assert_eq!(commit.pending_passive_handoff(), None);
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .is_empty()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_rejects_stale_layout_effect_handoff_lanes_without_callbacks() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(147), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mode = store
        .fiber_arena()
        .get(render.finished_work())
        .unwrap()
        .mode();
    let function = create_function_component_fiber(
        &mut store,
        mode,
        PropsHandle::from_raw(148),
        FiberTypeHandle::from_raw(149),
    );
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[function])
        .unwrap();

    let mut hook_store = FunctionComponentHookRenderStore::new();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), function)
        .unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Layout,
            callback(150),
            deps(151),
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();
    let stale_queue = hook_store
        .commit_pending_effect_queue_for_fiber(function, Lanes::SYNC)
        .unwrap()
        .unwrap();
    assert_eq!(stale_queue.lanes(), Lanes::SYNC);

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let error = commit
        .record_function_component_layout_effects_for_canary(&store, &mut hook_store)
        .unwrap_err();

    assert!(
        matches!(
            error,
            RootCommitError::LayoutEffectHandoffLanesMismatch {
                root,
                fiber,
                expected,
                actual,
            } if root == root_id
                && fiber == function
                && expected == Lanes::DEFAULT
                && actual == Lanes::SYNC
        ),
        "unexpected error: {error:?}"
    );
    assert!(commit.function_component_layout_effects().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_private_effect_metadata_in_deterministic_commit_order_without_execution() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(760);
    let current_function = append_function_component_child(
        &mut store,
        current_root,
        PropsHandle::from_raw(761),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_layout = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Layout,
            callback(762),
            deps(763),
            Some(callback(764)),
        )
        .unwrap();
    let previous_passive = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(765),
            deps(766),
            Some(callback(767)),
        )
        .unwrap();
    bubble_test_fiber(&mut store, current_function);
    bubble_test_fiber(&mut store, current_root);

    let root_callback = RootUpdateCallbackHandle::from_raw(768);
    let root_update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(769),
        Some(root_callback),
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(770),
        component,
    );
    store
        .fiber_arena_mut()
        .link_alternates(current_function, finished_function)
        .unwrap();
    let ref_child = append_host_ref_child(
        &mut store,
        finished_function,
        RefHandle::from_raw(771),
        StateNodeHandle::from_raw(772),
        FiberFlags::REF,
    );

    let deletion_parent = create_test_fiber(&mut store, FiberTag::HostComponent, 773);
    let deleted_text = create_test_fiber(&mut store, FiberTag::HostText, 774);
    let deletion_parent_state_node = StateNodeHandle::from_raw(775);
    let deleted_text_state_node = StateNodeHandle::from_raw(776);
    {
        let node = store.fiber_arena_mut().get_mut(deletion_parent).unwrap();
        node.set_state_node(deletion_parent_state_node);
        node.set_memoized_props(PropsHandle::from_raw(773));
    }
    {
        let node = store.fiber_arena_mut().get_mut(deleted_text).unwrap();
        node.set_state_node(deleted_text_state_node);
        node.set_memoized_props(PropsHandle::from_raw(774));
    }
    store
        .fiber_arena_mut()
        .set_children(deletion_parent, &[deleted_text])
        .unwrap();
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(deletion_parent, deleted_text)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(finished_work, &[finished_function, deletion_parent])
        .unwrap();

    let state = hook_store
        .prepare_render_state(store.fiber_arena(), finished_function)
        .unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let layout = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Layout,
            callback(777),
            deps(778),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    let passive = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(779),
            deps(780),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let queued_passive = queue_function_component_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        state,
        Lanes::DEFAULT,
    )
    .unwrap();
    bubble_test_fiber(&mut store, ref_child);
    bubble_test_fiber(&mut store, finished_function);
    bubble_test_fiber(&mut store, deletion_parent);
    bubble_test_fiber(&mut store, finished_work);

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let layout_snapshot = commit
        .record_function_component_layout_effects_for_canary(&store, &mut hook_store)
        .unwrap()
        .clone();
    let passive_snapshot = commit
        .record_function_component_committed_passive_effects_for_canary(&[queued_passive])
        .unwrap()
        .clone();
    let diagnostics = commit.commit_order_diagnostics_for_canary();
    let records = diagnostics.records();

    assert_eq!(commit.deletion_lists().len(), 1);
    assert_eq!(commit.deletion_lists()[0].list(), deletion_list);
    assert_eq!(commit.deletion_lists()[0].deleted(), &[deleted_text]);
    assert_eq!(commit.host_node_deletion_cleanup_log().len(), 1);
    assert_eq!(commit.ref_callback_execution_handoff().len(), 1);
    assert_eq!(layout_snapshot.len(), 1);
    assert_eq!(layout_snapshot.destroy_count(), 1);
    assert_eq!(layout_snapshot.create_count(), 1);
    assert_eq!(layout_snapshot.phase_records().len(), 2);
    assert_eq!(passive_snapshot.phase_records().len(), 2);
    assert_eq!(commit.root_update_callback_invocation_gate().len(), 1);
    assert_eq!(diagnostics.len(), 7);
    assert!(!diagnostics.public_effects_invoked());
    assert!(!diagnostics.host_containers_mutated());
    assert_eq!(
        records
            .iter()
            .map(|record| record.sequence())
            .collect::<Vec<_>>(),
        vec![0, 1, 2, 3, 4, 5, 6]
    );
    assert_eq!(
        records
            .iter()
            .map(|record| record.phase_name())
            .collect::<Vec<_>>(),
        vec![
            "mutation", "mutation", "layout", "layout", "layout", "passive", "passive"
        ]
    );
    assert_eq!(
        records
            .iter()
            .map(|record| record.metadata_kind_name())
            .collect::<Vec<_>>(),
        vec![
            "deletion-cleanup",
            "layout-effect-destroy",
            "ref-attach",
            "layout-effect-create",
            "root-update-callback",
            "passive-unmount",
            "passive-mount",
        ]
    );

    assert_eq!(records[0].fiber(), deleted_text);
    assert_eq!(records[0].tag_name(), "HostText");
    assert_eq!(records[0].source_order(), 0);
    assert_eq!(records[1].fiber(), finished_function);
    assert_eq!(records[1].tag_name(), "FunctionComponent");
    assert_eq!(records[1].source_order(), 0);
    assert_eq!(records[2].fiber(), ref_child);
    assert_eq!(records[2].tag_name(), "HostComponent");
    assert_eq!(records[2].source_order(), 0);
    assert_eq!(records[3].fiber(), finished_function);
    assert_eq!(records[3].tag_name(), "FunctionComponent");
    assert_eq!(records[3].source_order(), 0);
    assert_eq!(records[4].fiber(), finished_work);
    assert_eq!(records[4].tag_name(), "HostRoot");
    assert_eq!(records[4].source_order(), 0);
    assert_eq!(records[5].fiber(), finished_function);
    assert_eq!(records[5].tag_name(), "FunctionComponent");
    assert!(records[5].source_order() < records[6].source_order());
    assert_eq!(records[6].fiber(), finished_function);
    assert_eq!(records[6].tag_name(), "FunctionComponent");

    assert!(!layout_snapshot.layout_callbacks_invoked());
    assert!(!layout_snapshot.dom_mutation_side_effects_performed());
    assert!(!layout_snapshot.refs_attached_or_detached());
    assert!(!layout_snapshot.public_effect_compatibility_claimed());
    assert_eq!(layout_snapshot.records()[0].effect(), layout.effect());
    assert_eq!(
        layout_snapshot.records()[0].previous_effect(),
        Some(previous_layout.effect())
    );
    assert_eq!(
        layout_snapshot.records()[0].instance(),
        previous_layout.instance()
    );
    assert_eq!(
        layout_snapshot.records()[0].dependency_phase(),
        FunctionComponentEffectDependencyPhase::UpdateChanged
    );
    assert_eq!(
        layout_snapshot.records()[0].previous_dependencies(),
        Some(deps(763))
    );
    assert_eq!(layout_snapshot.records()[0].dependencies(), deps(778));
    assert_eq!(layout_snapshot.records()[0].create(), callback(777));
    assert_eq!(layout_snapshot.records()[0].destroy(), Some(callback(764)));
    assert_eq!(layout_snapshot.records()[0].destroy_order(), Some(0));
    assert_eq!(layout_snapshot.records()[0].create_order(), 0);
    let layout_phase_records = layout_snapshot.phase_records();
    assert_eq!(
        layout_phase_records[0].handoff(),
        FunctionComponentLayoutEffectHandoff::Destroy
    );
    assert_eq!(
        layout_phase_records[0].commit_phase(),
        FunctionComponentLayoutEffectCommitPhase::Mutation
    );
    assert_eq!(layout_phase_records[0].effect(), previous_layout.effect());
    assert_eq!(
        layout_phase_records[0].previous_effect(),
        Some(previous_layout.effect())
    );
    assert_eq!(layout_phase_records[0].create(), None);
    assert_eq!(layout_phase_records[0].destroy(), Some(callback(764)));
    assert_eq!(
        layout_phase_records[1].handoff(),
        FunctionComponentLayoutEffectHandoff::Create
    );
    assert_eq!(
        layout_phase_records[1].commit_phase(),
        FunctionComponentLayoutEffectCommitPhase::Layout
    );
    assert_eq!(layout_phase_records[1].effect(), layout.effect());
    assert_eq!(layout_phase_records[1].create(), Some(callback(777)));
    assert_eq!(layout_phase_records[1].destroy(), None);
    assert_eq!(
        passive_snapshot.phase_records()[0].phase(),
        PendingPassiveEffectPhase::Unmount
    );
    assert_eq!(
        passive_snapshot.phase_records()[0].destroy(),
        Some(callback(767))
    );
    assert_eq!(
        passive_snapshot.phase_records()[1].phase(),
        PendingPassiveEffectPhase::Mount
    );
    assert_eq!(
        passive_snapshot.phase_records()[1].create(),
        Some(callback(779))
    );
    assert_eq!(
        passive.effect(),
        passive_snapshot.phase_records()[1].effect()
    );
    assert_eq!(
        passive_snapshot.phase_records()[1].instance(),
        previous_passive.instance()
    );
    assert_eq!(
        commit.root_update_callback_invocation_gate().records()[0].update(),
        root_update.update()
    );
    assert_eq!(
        commit.root_update_callback_invocation_gate().records()[0].callback(),
        root_callback
    );
    assert_dom_ref_callback_gate_is_inert(commit.dom_ref_callback_commit_gate());
    assert_ref_callback_execution_handoff_keeps_public_blockers(
        commit.ref_callback_execution_handoff(),
    );
    assert_ref_cleanup_return_execution_gate_keeps_public_blockers(
        commit.ref_cleanup_return_execution_gate(),
    );
    assert_root_update_callback_invocation_gate_is_inert(
        commit.root_update_callback_invocation_gate(),
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_function_component_effect_list_phase_order_without_callbacks() {
    let (mut store, root_id, host) = root_store();
    let current_root = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(7_900);
    let current_function = append_function_component_child(
        &mut store,
        current_root,
        PropsHandle::from_raw(7_901),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_layout = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Layout,
            callback(7_902),
            deps(7_903),
            Some(callback(7_904)),
        )
        .unwrap();
    let previous_passive = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(7_905),
            deps(7_906),
            Some(callback(7_907)),
        )
        .unwrap();

    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(7_908),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(7_909),
        component,
    );
    store
        .fiber_arena_mut()
        .link_alternates(current_function, finished_function)
        .unwrap();

    let state = hook_store
        .prepare_render_state(store.fiber_arena(), finished_function)
        .unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let layout = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Layout,
            callback(7_910),
            deps(7_911),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    let passive = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(7_912),
            deps(7_913),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();
    let queued_passive = queue_function_component_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        state,
        Lanes::DEFAULT,
    )
    .unwrap();
    bubble_test_fiber(&mut store, finished_function);
    bubble_test_fiber(&mut store, finished_work);

    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let snapshot = commit
        .record_function_component_effect_list_commit_phase_order_for_canary(
            &store,
            &mut hook_store,
            std::slice::from_ref(&queued_passive),
        )
        .unwrap()
        .clone();
    let records = snapshot.records();

    assert_eq!(snapshot.root(), Some(root_id));
    assert_eq!(snapshot.finished_work(), Some(finished_work));
    assert_eq!(snapshot.lanes(), Lanes::DEFAULT);
    assert_eq!(snapshot.len(), 5);
    assert_eq!(snapshot.before_mutation_count(), 1);
    assert_eq!(snapshot.layout_destroy_count(), 1);
    assert_eq!(snapshot.layout_create_count(), 1);
    assert_eq!(snapshot.passive_unmount_schedule_count(), 1);
    assert_eq!(snapshot.passive_mount_schedule_count(), 1);
    assert!(snapshot.records_in_commit_phase_order());
    assert!(!snapshot.layout_callbacks_invoked());
    assert!(!snapshot.passive_callbacks_invoked());
    assert!(!snapshot.public_act_execution_enabled());
    assert!(!snapshot.public_effect_compatibility_claimed());
    assert_eq!(
        commit.function_component_effect_list_commit_phase_order(),
        &snapshot
    );
    assert_eq!(
        records
            .iter()
            .map(|record| record.phase_name())
            .collect::<Vec<_>>(),
        vec![
            "before-mutation",
            "mutation",
            "layout",
            "passive-scheduling",
            "passive-scheduling",
        ]
    );
    assert_eq!(
        records
            .iter()
            .map(|record| record.kind_name())
            .collect::<Vec<_>>(),
        vec![
            "effect-list-before-mutation",
            "layout-destroy",
            "layout-create",
            "passive-unmount-scheduled",
            "passive-mount-scheduled",
        ]
    );
    assert_eq!(records[0].fiber(), finished_function);
    assert_eq!(records[0].hook_list(), state.work_in_progress_list());
    assert_eq!(
        records[0].render_phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(records[0].effect(), None);
    assert_eq!(records[0].create(), None);
    assert_eq!(records[0].destroy(), None);

    assert_eq!(records[1].fiber(), finished_function);
    assert_eq!(records[1].effect(), Some(previous_layout.effect()));
    assert_eq!(records[1].previous_effect(), Some(previous_layout.effect()));
    assert_eq!(records[1].create(), None);
    assert_eq!(records[1].destroy(), Some(callback(7_904)));
    assert_eq!(records[1].source_order(), 0);

    assert_eq!(records[2].fiber(), finished_function);
    assert_eq!(records[2].effect(), Some(layout.effect()));
    assert_eq!(records[2].previous_effect(), Some(previous_layout.effect()));
    assert_eq!(records[2].create(), Some(callback(7_910)));
    assert_eq!(records[2].destroy(), None);
    assert_eq!(records[2].source_order(), 0);

    assert_eq!(records[3].fiber(), finished_function);
    assert_eq!(records[3].effect(), Some(passive.effect()));
    assert_eq!(
        records[3].previous_effect(),
        Some(previous_passive.effect())
    );
    assert_eq!(records[3].create(), None);
    assert_eq!(records[3].destroy(), Some(callback(7_907)));
    assert_eq!(records[4].fiber(), finished_function);
    assert_eq!(records[4].effect(), Some(passive.effect()));
    assert_eq!(
        records[4].previous_effect(),
        Some(previous_passive.effect())
    );
    assert_eq!(records[4].create(), Some(callback(7_912)));
    assert_eq!(records[4].destroy(), None);
    assert!(records[3].source_order() < records[4].source_order());

    assert_eq!(
        hook_store
            .committed_effect_queue(finished_function)
            .unwrap()
            .accepted_layout_count(),
        1
    );
    assert_eq!(
        hook_store
            .committed_effect_queue(finished_function)
            .unwrap()
            .accepted_passive_count(),
        1
    );
    assert_eq!(
        commit
            .pending_passive_handoff()
            .unwrap()
            .pending_record_count(),
        2
    );
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .has_commit_handoff()
    );
    assert_eq!(
        store.scheduler_bridge().callback_requests().len(),
        callback_request_count
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert_eq!(previous_passive.instance(), passive.instance());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_effect_list_layout_effect_execution_gate_invokes_destroy_before_create_before_passive()
 {
    let (mut store, root_id, host) = root_store();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let (render, fixture) =
        prepare_layout_effect_execution_fixture(&mut store, root_id, &mut hook_store, 8_100);

    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let effect_list = commit
        .record_function_component_effect_list_commit_phase_order_for_canary(
            &store,
            &mut hook_store,
            std::slice::from_ref(&fixture.queued_passive),
        )
        .unwrap()
        .clone();
    let layout_destroy_record = first_effect_list_record(
        &effect_list,
        FunctionComponentEffectListCommitPhaseOrderKind::LayoutDestroy,
    );
    let layout_create_record = first_effect_list_record(
        &effect_list,
        FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate,
    );
    let mut control = TestLayoutEffectCallbackControl::default();

    let execution = commit
            .execute_function_component_layout_effect_update_destroy_create_under_test_control_for_canary(
                &store,
                &hook_store,
                layout_create_record,
                &mut control,
            )
            .unwrap()
            .clone();

    assert_eq!(execution.root(), Some(root_id));
    assert_eq!(execution.finished_work(), Some(fixture.finished_work));
    assert_eq!(execution.lanes(), Lanes::DEFAULT);
    assert_eq!(execution.len(), 2);
    assert_eq!(execution.completed_count(), 2);
    assert_eq!(execution.destroy_callback_count(), 1);
    assert_eq!(execution.create_callback_count(), 1);
    assert_eq!(execution.error_count(), 0);
    assert_eq!(execution.error_capture_count(), 0);
    assert!(!execution.has_errors());
    assert!(!execution.did_record_error_capture_metadata());
    assert!(execution.destroy_before_create_order_proven());
    assert_eq!(
        execution.status(),
        FunctionComponentLayoutEffectCallbackInvocationGateStatus::TestControlOnly
    );
    assert_eq!(
        execution.blockers(),
        &FUNCTION_COMPONENT_LAYOUT_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
    );
    assert!(execution.did_invoke_test_layout_callback());
    assert!(!execution.public_use_layout_effect_compatibility_claimed());
    assert!(!execution.public_act_compatibility_claimed());
    assert!(!execution.passive_phase_callbacks_invoked());
    assert!(!execution.root_error_callbacks_invoked());
    assert!(!execution.scheduler_queues_touched());

    let records = execution.records();
    assert_eq!(records[0].invocation_order(), 0);
    assert_eq!(
        records[0].status(),
        FunctionComponentLayoutEffectCallbackInvocationStatus::Completed
    );
    assert!(records[0].is_destroy_callback());
    assert_eq!(
        records[0].handoff(),
        FunctionComponentLayoutEffectHandoff::Destroy
    );
    assert_eq!(
        records[0].commit_phase(),
        FunctionComponentLayoutEffectCommitPhase::Mutation
    );
    assert_eq!(records[0].root(), root_id);
    assert_eq!(records[0].finished_work(), fixture.finished_work);
    assert_eq!(records[0].fiber(), fixture.finished_function);
    assert_eq!(records[0].effect(), fixture.previous_layout.effect());
    assert_eq!(records[0].callback(), callback(8_104));
    let destroy_request = records[0].request();
    assert_eq!(
        destroy_request.effect_list_sequence(),
        layout_destroy_record.sequence()
    );
    assert_eq!(
        destroy_request.matched_mutation_sequence(),
        layout_destroy_record.sequence()
    );
    assert!(!destroy_request.after_matching_mutation_metadata());
    assert!(destroy_request.before_passive_metadata());
    assert_eq!(
        destroy_request.previous_effect(),
        Some(fixture.previous_layout.effect())
    );
    assert_eq!(destroy_request.instance(), fixture.layout.instance());
    assert_eq!(
        destroy_request.hook_list(),
        fixture.state.work_in_progress_list()
    );

    assert_eq!(records[1].invocation_order(), 1);
    assert_eq!(
        records[1].status(),
        FunctionComponentLayoutEffectCallbackInvocationStatus::Completed
    );
    assert!(records[1].is_create_callback());
    assert_eq!(
        records[1].handoff(),
        FunctionComponentLayoutEffectHandoff::Create
    );
    assert_eq!(
        records[1].commit_phase(),
        FunctionComponentLayoutEffectCommitPhase::Layout
    );
    assert_eq!(records[1].root(), root_id);
    assert_eq!(records[1].finished_work(), fixture.finished_work);
    assert_eq!(records[1].fiber(), fixture.finished_function);
    assert_eq!(records[1].effect(), fixture.layout.effect());
    assert_eq!(records[1].callback(), callback(8_110));
    let create_request = records[1].request();
    assert_eq!(
        create_request.effect_list_sequence(),
        layout_create_record.sequence()
    );
    assert!(create_request.after_matching_mutation_metadata());
    assert!(create_request.before_passive_metadata());
    assert_eq!(
        create_request.first_passive_sequence(),
        Some(
            first_effect_list_record(
                &effect_list,
                FunctionComponentEffectListCommitPhaseOrderKind::PassiveUnmountScheduled,
            )
            .sequence()
        )
    );
    assert_eq!(
        create_request.previous_effect(),
        Some(fixture.previous_layout.effect())
    );
    assert_eq!(create_request.instance(), fixture.layout.instance());
    assert_eq!(
        create_request.hook_list(),
        fixture.state.work_in_progress_list()
    );

    assert_eq!(control.calls(), &[destroy_request, create_request]);
    assert_eq!(
        commit.function_component_layout_effect_callback_invocation_gate(),
        &execution
    );
    let diagnostics = commit.commit_order_diagnostics_for_canary();
    assert_eq!(
        diagnostics
            .records()
            .iter()
            .map(|record| record.metadata_kind_name())
            .collect::<Vec<_>>(),
        vec![
            "layout-effect-destroy",
            "layout-effect-callback",
            "layout-effect-create",
            "layout-effect-callback",
            "passive-unmount",
            "passive-mount",
        ]
    );
    assert_eq!(
        diagnostics
            .records()
            .iter()
            .map(|record| record.phase_name())
            .collect::<Vec<_>>(),
        vec![
            "mutation", "mutation", "layout", "layout", "passive", "passive"
        ]
    );
    assert_eq!(
        commit
            .function_component_committed_passive_effects()
            .phase_records()[0]
            .destroy(),
        Some(callback(8_107))
    );
    assert_eq!(
        fixture.passive.effect(),
        fixture.queued_passive.records()[0].effect()
    );
    assert_eq!(
        fixture.previous_passive.instance(),
        fixture.passive.instance()
    );
    assert_eq!(
        store.scheduler_bridge().callback_requests().len(),
        callback_request_count
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_effect_list_layout_effect_execution_gate_records_error_capture_metadata_without_public_callbacks()
 {
    let options = RootOptions::new()
        .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(91))
        .with_on_caught_error(RootErrorCallbackHandle::from_raw(92))
        .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(93));
    let (mut store, root_id, host) = root_store_with_options(options);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let (render, fixture) =
        prepare_layout_effect_execution_fixture(&mut store, root_id, &mut hook_store, 8_500);

    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let effect_list = commit
        .record_function_component_effect_list_commit_phase_order_for_canary(
            &store,
            &mut hook_store,
            std::slice::from_ref(&fixture.queued_passive),
        )
        .unwrap()
        .clone();
    let layout_create_record = first_effect_list_record(
        &effect_list,
        FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate,
    );
    let destroy_error = FunctionComponentLayoutEffectCallbackInvocationErrorHandle::from_raw(51);
    let create_error = FunctionComponentLayoutEffectCallbackInvocationErrorHandle::from_raw(52);
    let mut control = TestLayoutEffectCallbackControl::default()
        .with_result(callback(8_504), Err(destroy_error))
        .with_result(callback(8_510), Err(create_error));

    let execution = commit
            .execute_function_component_layout_effect_update_destroy_create_under_test_control_for_canary(
                &store,
                &hook_store,
                layout_create_record,
                &mut control,
            )
            .unwrap()
            .clone();

    assert_eq!(execution.len(), 2);
    assert_eq!(execution.completed_count(), 0);
    assert_eq!(execution.error_count(), 2);
    assert_eq!(execution.error_capture_count(), 2);
    assert!(execution.has_errors());
    assert!(execution.did_record_error_capture_metadata());
    assert!(execution.destroy_before_create_order_proven());
    assert!(!execution.public_use_layout_effect_compatibility_claimed());
    assert!(!execution.public_act_compatibility_claimed());
    assert!(!execution.root_error_callbacks_invoked());
    assert!(!execution.scheduler_queues_touched());
    assert_eq!(execution.errors(), vec![destroy_error, create_error]);
    assert_eq!(
        control.calls(),
        &[
            execution.records()[0].request(),
            execution.records()[1].request()
        ]
    );

    let captures = execution.error_captures();
    assert_eq!(captures[0].capture_order(), 0);
    assert_eq!(
        captures[0].handoff(),
        FunctionComponentLayoutEffectHandoff::Destroy
    );
    assert_eq!(
        captures[0].commit_phase(),
        FunctionComponentLayoutEffectCommitPhase::Mutation
    );
    assert_eq!(captures[0].root(), root_id);
    assert_eq!(captures[0].finished_work(), fixture.finished_work);
    assert_eq!(captures[0].lanes(), Lanes::DEFAULT);
    assert_eq!(captures[0].fiber(), fixture.finished_function);
    assert_eq!(captures[0].effect(), fixture.previous_layout.effect());
    assert_eq!(
        captures[0].previous_effect(),
        Some(fixture.previous_layout.effect())
    );
    assert_eq!(captures[0].instance(), fixture.layout.instance());
    assert_eq!(captures[0].callback(), callback(8_504));
    assert_eq!(captures[0].error(), destroy_error);
    assert!(!captures[0].root_error_update_scheduled());
    assert!(!captures[0].scheduler_queue_touched());
    assert!(!captures[0].root_error_callbacks_invoked());
    assert!(!captures[0].public_act_error_aggregation_enabled());
    assert!(!captures[0].public_use_layout_effect_compatibility_claimed());
    assert!(captures[0].has_configured_error_callback());

    assert_eq!(captures[1].capture_order(), 1);
    assert_eq!(
        captures[1].handoff(),
        FunctionComponentLayoutEffectHandoff::Create
    );
    assert_eq!(
        captures[1].commit_phase(),
        FunctionComponentLayoutEffectCommitPhase::Layout
    );
    assert_eq!(captures[1].root(), root_id);
    assert_eq!(captures[1].finished_work(), fixture.finished_work);
    assert_eq!(captures[1].lanes(), Lanes::DEFAULT);
    assert_eq!(captures[1].fiber(), fixture.finished_function);
    assert_eq!(captures[1].effect(), fixture.layout.effect());
    assert_eq!(
        captures[1].previous_effect(),
        Some(fixture.previous_layout.effect())
    );
    assert_eq!(captures[1].instance(), fixture.layout.instance());
    assert_eq!(captures[1].callback(), callback(8_510));
    assert_eq!(captures[1].error(), create_error);
    assert!(!captures[1].root_error_update_scheduled());
    assert!(!captures[1].scheduler_queue_touched());
    assert!(!captures[1].root_error_callbacks_invoked());
    assert!(!captures[1].public_act_error_aggregation_enabled());
    assert!(!captures[1].public_use_layout_effect_compatibility_claimed());
    assert!(captures[1].has_configured_error_callback());

    let callbacks = captures[0].error_option_callbacks();
    assert_eq!(callbacks.root(), root_id);
    assert_eq!(callbacks.phase(), RootErrorOptionCallbackPhase::Commit);
    assert_eq!(
        callbacks.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(91)
    );
    assert_eq!(
        callbacks.on_caught_error(),
        RootErrorCallbackHandle::from_raw(92)
    );
    assert_eq!(
        captures[1].error_option_callbacks().on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(93)
    );
    assert_eq!(
        store.scheduler_bridge().callback_requests().len(),
        callback_request_count
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_layout_create_throw_preserves_destroy_before_create_order_and_fail_closed_metadata()
{
    let options = RootOptions::new()
        .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(101))
        .with_on_caught_error(RootErrorCallbackHandle::from_raw(102))
        .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(103));
    let (mut store, root_id, host) = root_store_with_options(options);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let (render, fixture) =
        prepare_layout_effect_execution_fixture(&mut store, root_id, &mut hook_store, 8_600);

    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let effect_list = commit
        .record_function_component_effect_list_commit_phase_order_for_canary(
            &store,
            &mut hook_store,
            std::slice::from_ref(&fixture.queued_passive),
        )
        .unwrap()
        .clone();
    let layout_destroy_record = first_effect_list_record(
        &effect_list,
        FunctionComponentEffectListCommitPhaseOrderKind::LayoutDestroy,
    );
    let layout_create_record = first_effect_list_record(
        &effect_list,
        FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate,
    );
    let create_error = FunctionComponentLayoutEffectCallbackInvocationErrorHandle::from_raw(61);
    let mut control =
        TestLayoutEffectCallbackControl::default().with_result(callback(8_610), Err(create_error));

    let execution = commit
            .execute_function_component_layout_effect_update_destroy_create_under_test_control_for_canary(
                &store,
                &hook_store,
                layout_create_record,
                &mut control,
            )
            .unwrap()
            .clone();

    assert_eq!(execution.root(), Some(root_id));
    assert_eq!(execution.finished_work(), Some(fixture.finished_work));
    assert_eq!(execution.lanes(), Lanes::DEFAULT);
    assert_eq!(execution.len(), 2);
    assert_eq!(execution.completed_count(), 1);
    assert_eq!(execution.error_count(), 1);
    assert_eq!(execution.error_capture_count(), 1);
    assert!(execution.has_errors());
    assert!(execution.did_record_error_capture_metadata());
    assert!(execution.did_record_fail_closed_error_metadata());
    assert!(execution.destroy_before_create_order_proven());
    assert!(!execution.public_effect_compatibility_claimed());
    assert!(!execution.public_use_layout_effect_compatibility_claimed());
    assert!(!execution.public_act_compatibility_claimed());
    assert!(!execution.passive_phase_callbacks_invoked());
    assert!(!execution.root_error_callbacks_invoked());
    assert!(!execution.scheduler_queues_touched());
    assert_eq!(execution.errors(), vec![create_error]);

    let records = execution.records();
    assert_eq!(records[0].invocation_order(), 0);
    assert!(records[0].completed());
    assert!(records[0].is_destroy_callback());
    assert_eq!(
        records[0].commit_phase(),
        FunctionComponentLayoutEffectCommitPhase::Mutation
    );
    assert_eq!(records[0].effect(), fixture.previous_layout.effect());
    assert_eq!(records[0].callback(), callback(8_604));
    assert_eq!(records[0].error(), None);

    assert_eq!(records[1].invocation_order(), 1);
    assert!(records[1].errored());
    assert!(records[1].is_create_callback());
    assert_eq!(
        records[1].commit_phase(),
        FunctionComponentLayoutEffectCommitPhase::Layout
    );
    assert_eq!(records[1].effect(), fixture.layout.effect());
    assert_eq!(records[1].callback(), callback(8_610));
    assert_eq!(records[1].error(), Some(create_error));

    let destroy_request = records[0].request();
    let create_request = records[1].request();
    assert_eq!(
        destroy_request.effect_list_sequence(),
        layout_destroy_record.sequence()
    );
    assert_eq!(
        create_request.effect_list_sequence(),
        layout_create_record.sequence()
    );
    assert!(destroy_request.effect_list_sequence() < create_request.effect_list_sequence());
    assert!(!destroy_request.after_matching_mutation_metadata());
    assert!(create_request.after_matching_mutation_metadata());
    assert!(destroy_request.before_passive_metadata());
    assert!(create_request.before_passive_metadata());
    assert_eq!(
        create_request.first_passive_sequence(),
        Some(
            first_effect_list_record(
                &effect_list,
                FunctionComponentEffectListCommitPhaseOrderKind::PassiveUnmountScheduled,
            )
            .sequence()
        )
    );
    assert_eq!(
        create_request.previous_effect(),
        Some(fixture.previous_layout.effect())
    );
    assert_eq!(create_request.instance(), fixture.layout.instance());
    assert_eq!(
        control.calls(),
        &[destroy_request, create_request],
        "test control must observe cleanup before the throwing create callback"
    );

    let captures = execution.error_captures();
    assert_eq!(captures[0].capture_order(), 0);
    assert_eq!(captures[0].request(), create_request);
    assert_eq!(
        captures[0].handoff(),
        FunctionComponentLayoutEffectHandoff::Create
    );
    assert_eq!(
        captures[0].commit_phase(),
        FunctionComponentLayoutEffectCommitPhase::Layout
    );
    assert_eq!(captures[0].root(), root_id);
    assert_eq!(captures[0].finished_work(), fixture.finished_work);
    assert_eq!(captures[0].fiber(), fixture.finished_function);
    assert_eq!(captures[0].effect(), fixture.layout.effect());
    assert_eq!(
        captures[0].previous_effect(),
        Some(fixture.previous_layout.effect())
    );
    assert_eq!(captures[0].callback(), callback(8_610));
    assert_eq!(captures[0].error(), create_error);
    assert!(captures[0].error_metadata_fail_closed());
    assert!(!captures[0].public_effect_compatibility_claimed());
    assert!(!captures[0].public_use_layout_effect_compatibility_claimed());
    assert!(captures[0].has_configured_error_callback());
    let callbacks = captures[0].error_option_callbacks();
    assert_eq!(callbacks.root(), root_id);
    assert_eq!(callbacks.phase(), RootErrorOptionCallbackPhase::Commit);
    assert_eq!(
        callbacks.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(101)
    );
    assert_eq!(
        callbacks.on_caught_error(),
        RootErrorCallbackHandle::from_raw(102)
    );
    assert_eq!(
        callbacks.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(103)
    );

    let diagnostics = commit.commit_order_diagnostics_for_canary();
    assert_eq!(
        diagnostics
            .records()
            .iter()
            .map(|record| record.metadata_kind_name())
            .collect::<Vec<_>>(),
        vec![
            "layout-effect-destroy",
            "layout-effect-callback",
            "layout-effect-create",
            "layout-effect-callback",
            "passive-unmount",
            "passive-mount",
        ]
    );
    assert_eq!(
        diagnostics
            .records()
            .iter()
            .map(|record| record.phase_name())
            .collect::<Vec<_>>(),
        vec![
            "mutation", "mutation", "layout", "layout", "passive", "passive"
        ]
    );
    assert_eq!(
        store.scheduler_bridge().callback_requests().len(),
        callback_request_count
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_effect_list_layout_effect_execution_gate_rejects_passive_phase_records() {
    let (mut store, root_id, host) = root_store();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let (render, fixture) =
        prepare_layout_effect_execution_fixture(&mut store, root_id, &mut hook_store, 8_200);
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let effect_list = commit
        .record_function_component_effect_list_commit_phase_order_for_canary(
            &store,
            &mut hook_store,
            std::slice::from_ref(&fixture.queued_passive),
        )
        .unwrap()
        .clone();
    let passive_record = first_effect_list_record(
        &effect_list,
        FunctionComponentEffectListCommitPhaseOrderKind::PassiveMountScheduled,
    );
    let mut control = TestLayoutEffectCallbackControl::default();

    let error = commit
        .execute_function_component_layout_effect_record_under_test_control_for_canary(
            &store,
            &hook_store,
            passive_record,
            &mut control,
        )
        .unwrap_err();

    assert!(
        matches!(
            error,
            RootCommitError::LayoutEffectCallbackExecutionPassiveRecordRejected {
                root,
                fiber,
                effect,
            } if root == root_id
                && fiber == fixture.finished_function
                && effect == Some(fixture.passive.effect())
        ),
        "unexpected error: {error:?}"
    );
    assert!(control.calls().is_empty());
    assert!(
        commit
            .function_component_layout_effect_callback_invocation_gate()
            .is_empty()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_effect_list_layout_effect_execution_gate_rejects_stale_effect_rings() {
    let (mut store, root_id, host) = root_store();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let (render, fixture) =
        prepare_layout_effect_execution_fixture(&mut store, root_id, &mut hook_store, 8_300);
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let effect_list = commit
        .record_function_component_effect_list_commit_phase_order_for_canary(
            &store,
            &mut hook_store,
            std::slice::from_ref(&fixture.queued_passive),
        )
        .unwrap()
        .clone();
    let layout_record = first_effect_list_record(
        &effect_list,
        FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate,
    );
    let stale_hook_store = FunctionComponentHookRenderStore::new();
    let mut control = TestLayoutEffectCallbackControl::default();

    let error = commit
        .execute_function_component_layout_effect_record_under_test_control_for_canary(
            &store,
            &stale_hook_store,
            layout_record,
            &mut control,
        )
        .unwrap_err();

    assert!(
        matches!(
            error,
            RootCommitError::LayoutEffectCallbackExecutionStaleEffectRing {
                root,
                fiber,
                hook_list,
                current_list,
            } if root == root_id
                && fiber == fixture.finished_function
                && hook_list == fixture.state.work_in_progress_list()
                && current_list.is_none()
        ),
        "unexpected error: {error:?}"
    );
    assert!(control.calls().is_empty());
    assert!(
        commit
            .function_component_layout_effect_callback_invocation_gate()
            .is_empty()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_effect_list_layout_effect_execution_gate_rejects_unsupported_fiber_tags() {
    let (mut store, root_id, host) = root_store();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let (render, fixture) =
        prepare_layout_effect_execution_fixture(&mut store, root_id, &mut hook_store, 8_400);
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let effect_list = commit
        .record_function_component_effect_list_commit_phase_order_for_canary(
            &store,
            &mut hook_store,
            std::slice::from_ref(&fixture.queued_passive),
        )
        .unwrap()
        .clone();
    let layout_record = first_effect_list_record(
        &effect_list,
        FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate,
    );
    let unsupported_record = FunctionComponentEffectListCommitPhaseOrderRecord {
        fiber: fixture.finished_work,
        ..layout_record
    };
    let mut control = TestLayoutEffectCallbackControl::default();

    let error = commit
        .execute_function_component_layout_effect_record_under_test_control_for_canary(
            &store,
            &hook_store,
            unsupported_record,
            &mut control,
        )
        .unwrap_err();

    assert!(
        matches!(
            error,
            RootCommitError::LayoutEffectCallbackExecutionUnsupportedFiberTag {
                root,
                fiber,
                tag,
                unsupported_feature,
            } if root == root_id
                && fiber == fixture.finished_work
                && tag == FiberTag::HostRoot
                && unsupported_feature.is_none()
        ),
        "unexpected error: {error:?}"
    );
    assert!(control.calls().is_empty());
    assert!(
        commit
            .function_component_layout_effect_callback_invocation_gate()
            .is_empty()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_effect_list_phase_order_rejects_cross_root_passive_handoff() {
    let (mut store, root_id, host) = root_store();
    let other_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let mut hook_store = FunctionComponentHookRenderStore::new();

    let current_root = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(7_930);
    let current_function = append_function_component_child(
        &mut store,
        current_root,
        PropsHandle::from_raw(7_931),
        component,
    );
    hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(7_932),
            deps(7_933),
            Some(callback(7_934)),
        )
        .unwrap();
    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(7_935),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_function = append_function_component_child(
        &mut store,
        render.finished_work(),
        PropsHandle::from_raw(7_936),
        component,
    );
    store
        .fiber_arena_mut()
        .link_alternates(current_function, finished_function)
        .unwrap();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), finished_function)
        .unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(7_937),
            deps(7_938),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();
    queue_function_component_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        state,
        Lanes::DEFAULT,
    )
    .unwrap();

    let other_current_root = store.root(other_root).unwrap().current();
    let other_component = FiberTypeHandle::from_raw(7_940);
    let other_current_function = append_function_component_child(
        &mut store,
        other_current_root,
        PropsHandle::from_raw(7_941),
        other_component,
    );
    hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            other_current_function,
            FunctionComponentEffectPhase::Passive,
            callback(7_942),
            deps(7_943),
            Some(callback(7_944)),
        )
        .unwrap();
    update_container(
        &mut store,
        other_root,
        RootElementHandle::from_raw(7_945),
        None,
    )
    .unwrap();
    let other_render = render_host_root_for_lanes(&mut store, other_root, Lanes::DEFAULT).unwrap();
    let other_finished_function = append_function_component_child(
        &mut store,
        other_render.finished_work(),
        PropsHandle::from_raw(7_946),
        other_component,
    );
    store
        .fiber_arena_mut()
        .link_alternates(other_current_function, other_finished_function)
        .unwrap();
    let other_state = hook_store
        .prepare_render_state(store.fiber_arena(), other_finished_function)
        .unwrap();
    let mut other_cursor = hook_store.begin_render_cursor(other_state).unwrap();
    hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut other_cursor,
            FunctionComponentEffectPhase::Passive,
            callback(7_947),
            deps(7_948),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    hook_store.finish_render_cursor(other_cursor).unwrap();
    let other_handoff = queue_function_component_pending_passive_effects(
        &mut store,
        other_root,
        &hook_store,
        other_state,
        Lanes::DEFAULT,
    )
    .unwrap();

    bubble_test_fiber(&mut store, finished_function);
    bubble_test_fiber(&mut store, render.finished_work());
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let error = commit
        .record_function_component_effect_list_commit_phase_order_for_canary(
            &store,
            &mut hook_store,
            std::slice::from_ref(&other_handoff),
        )
        .unwrap_err();

    assert!(
        matches!(
            error,
            RootCommitError::CommittedPassiveEffectHandoffRootMismatch {
                commit_root,
                handoff_root,
            } if commit_root == root_id && handoff_root == other_root
        ),
        "unexpected error: {error:?}"
    );
    assert!(
        commit
            .function_component_effect_list_commit_phase_order()
            .is_empty()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_effect_list_phase_order_rejects_stale_passive_handoff_fiber() {
    let (mut store, root_id, host) = root_store();
    let mode = store
        .fiber_arena()
        .get(store.root(root_id).unwrap().current())
        .unwrap()
        .mode();
    let stale_function = create_function_component_fiber(
        &mut store,
        mode,
        PropsHandle::from_raw(7_960),
        FiberTypeHandle::from_raw(7_961),
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let stale_state = hook_store
        .prepare_render_state(store.fiber_arena(), stale_function)
        .unwrap();
    let mut stale_cursor = hook_store.begin_render_cursor(stale_state).unwrap();
    hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut stale_cursor,
            FunctionComponentEffectPhase::Passive,
            callback(7_962),
            deps(7_963),
        )
        .unwrap();
    hook_store.finish_render_cursor(stale_cursor).unwrap();
    let stale_handoff = queue_function_component_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        stale_state,
        Lanes::DEFAULT,
    )
    .unwrap();

    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(7_964),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let error = commit
        .record_function_component_effect_list_commit_phase_order_for_canary(
            &store,
            &mut hook_store,
            std::slice::from_ref(&stale_handoff),
        )
        .unwrap_err();

    assert!(
        matches!(
            error,
            RootCommitError::CommittedPassiveEffectHandoffFiberStale {
                root,
                finished_work: error_finished_work,
                fiber,
            } if root == root_id
                && error_finished_work == finished_work
                && fiber == stale_function
        ),
        "unexpected error: {error:?}"
    );
    assert!(
        commit
            .function_component_effect_list_commit_phase_order()
            .is_empty()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_deletion_passive_snapshot_exposes_unmount_phase_records_for_private_flush() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(49), None).unwrap();
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
    let queued_passive = deleted_passive_handoff.records()[0];

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    commit
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[
            deleted_passive_handoff,
        ])
        .unwrap();
    let snapshot = commit.function_component_deleted_subtree_passive_effects();
    let phase_records = snapshot.effect_phase_records();

    assert_eq!(snapshot.len(), 1);
    assert_eq!(snapshot.destroy_count(), 1);
    assert_eq!(snapshot.records()[0], queued_passive);
    assert_eq!(phase_records.len(), 1);
    assert_eq!(phase_records[0].fiber(), fixture.deleted_function);
    assert_eq!(phase_records[0].effect_index(), 0);
    assert_eq!(phase_records[0].effect(), queued_passive.effect());
    assert_eq!(phase_records[0].instance(), queued_passive.instance());
    assert_eq!(phase_records[0].create(), None);
    assert_eq!(phase_records[0].destroy(), Some(fixture.passive_destroy));
    assert_eq!(phase_records[0].lanes(), Lanes::DEFAULT);
    assert_eq!(phase_records[0].phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(phase_records[0].order(), queued_passive.unmount_order());

    let order_gate = commit.deletion_cleanup_order_gate_for_canary();
    assert_eq!(
        order_gate.records()[0].phase(),
        HostRootDeletionCleanupOrderPhase::RefCleanupReturn
    );
    assert_eq!(
        order_gate.records()[1].phase(),
        HostRootDeletionCleanupOrderPhase::PassiveDestroy
    );
    assert_eq!(
        order_gate.records()[2].phase(),
        HostRootDeletionCleanupOrderPhase::HostNodeCleanup
    );
    assert!(!order_gate.public_ref_or_effect_compatibility_claimed());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_rejects_wrong_root_pending_passive_handoff_before_switching_current() {
    let (mut store, root_id, _host) = root_store();
    let wrong_root = FiberRootId::new(root_id.raw() + 1).unwrap();
    update_container(&mut store, root_id, RootElementHandle::from_raw(6), None).unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .prepare_pending_passive(wrong_root, Lanes::DEFAULT);

    let error = commit_finished_host_root(&mut store, render).unwrap_err();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert!(matches!(
        error,
        RootCommitError::PendingPassiveRootMismatch { root, pending_root }
            if root == root_id && pending_root == wrong_root
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(pending_passive.root(), Some(wrong_root));
    assert_eq!(pending_passive.finished_work(), None);
    assert_eq!(pending_passive.lanes(), Lanes::DEFAULT);
    assert!(!pending_passive.has_commit_handoff());
}
