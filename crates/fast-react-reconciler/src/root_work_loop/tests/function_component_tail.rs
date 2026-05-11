use super::*;

#[test]
fn root_work_loop_use_state_dispatch_renders_function_host_component_and_commits_metadata() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let child_element = source.insert_host_element_with_text("section", "host component state");
    let root_current = store.root(root_id).unwrap().current();
    let (function_current, function_work_in_progress, component) =
        attach_function_component_current_child_with_work_pair(&mut store, root_id);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(function_current, StateHandle::from_raw(710))
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver = TestHostTreeFunctionOutputResolver::new(&source);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    hook_store
        .dispatch_state_update_and_reschedule_root(
            &mut store,
            FunctionComponentStateDispatchRequest::new(current_state.dispatch(), action(711), lane),
        )
        .unwrap();
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let callback = processed.records()[0].scheduled_callback().unwrap();
    let render = render_host_root_via_scheduler_callback(
        &mut store,
        root_id,
        callback.node(),
        Lanes::DEFAULT,
    )
    .unwrap()
    .render_phase()
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[function_work_in_progress])
        .unwrap();
    let state_request = FunctionComponentUseStateRenderRequest::new(
        StateHandle::from_raw(999),
        FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT),
    );

    let record =
        handoff_completed_function_component_use_state_host_child_to_test_complete_work_and_commit(
            &mut store,
            &mut host,
            render,
            &source,
            &mut hook_store,
            state_request,
            &mut registry,
            &resolver,
            action_as_state,
        )
        .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(record.function_component(), function_work_in_progress);
    assert_eq!(
        record.use_state_begin_work().render().current(),
        Some(function_current)
    );
    assert_eq!(
        record.use_state_begin_work().work_in_progress(),
        function_work_in_progress
    );
    assert_eq!(record.use_state_begin_work().output(), output);
    let state_update = record
        .use_state_begin_work()
        .state_hook()
        .update_record()
        .unwrap();
    assert_eq!(
        state_update.previous_memoized_state(),
        StateHandle::from_raw(710)
    );
    assert_eq!(state_update.memoized_state(), StateHandle::from_raw(711));
    assert_eq!(state_update.applied_update_count(), 1);
    assert_eq!(state_update.remaining_lanes(), Lanes::NO);
    assert_eq!(record.single_child().child_tag(), FiberTag::HostComponent);
    assert_eq!(record.single_child().child_element(), child_element);
    assert_eq!(
        record.complete_work().root_child_tag(),
        Some(FiberTag::FunctionComponent)
    );
    assert_eq!(
        record.complete_work().completed_child_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(record.complete_work().detached_instance_count(), 1);
    assert_eq!(record.complete_work().detached_text_count(), 1);

    let finished_work_handoff = record.finished_work_handoff();
    assert_eq!(finished_work_handoff.pending().root(), root_id);
    assert_eq!(
        finished_work_handoff.pending().finished_work(),
        render.finished_work()
    );
    assert!(finished_work_handoff.consumed_finished_work_record());
    assert_eq!(record.commit().previous_current(), root_current);
    assert_eq!(record.commit().current(), render.work_in_progress());
    assert_eq!(record.commit().finished_lanes(), Lanes::DEFAULT);
    assert_eq!(record.commit().pending_lanes(), Lanes::NO);
    assert_eq!(record.commit().mutation_log().len(), 1);
    assert_eq!(record.commit().mutation_apply_log().len(), 1);
    assert!(record.host_operations_unchanged_by_commit());
    let completed_child = record.complete_work().completed_child().unwrap();
    assert_single_function_component_container_append(
        record.host_mutation_apply(),
        root_id,
        render.work_in_progress(),
        completed_child,
        FiberTag::HostComponent,
    );
    assert!(record.private_test_host_mutation_executed());
    assert_eq!(
        record.host_operation_count_after_host_mutation(),
        host.operations().len()
    );
    assert!(record.public_render_blocked());

    let diagnostics = record.placement_apply_diagnostics();
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].root(), root_id);
    assert_eq!(diagnostics[0].host_root(), render.finished_work());
    assert_eq!(diagnostics[0].tag(), FiberTag::HostComponent);
    assert_eq!(diagnostics[0].tag_name(), "HostComponent");
    assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
    assert_eq!(diagnostics[0].sibling_status(), "append");
    assert_eq!(diagnostics[0].sibling(), None);
    assert_eq!(diagnostics[0].sibling_tag(), None);
    assert!(!diagnostics[0].can_insert_before());
    assert_eq!(
        store.fiber_arena().get(completed_child).unwrap().tag(),
        FiberTag::HostComponent
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.work_in_progress()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_state.queue())
            .unwrap(),
        Vec::<fast_react_core::HookUpdateId>::new()
    );
    assert_eq!(
        host.operations(),
        vec![
            "root_host_context",
            "child_host_context",
            "should_set_text_content",
            "create_text_instance",
            "create_instance",
            "append_initial_child",
            "finalize_initial_children",
            "append_child_to_container",
        ]
    );
}

#[test]
fn root_work_loop_function_component_single_child_handoff_fails_closed_for_unknown_output() {
    let (mut store, root_id, mut host) = root_store();
    let source = TestHostTree::new();
    update_container(&mut store, root_id, RootElementHandle::from_raw(902), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (_current_child, function_component, component) =
        attach_function_component_wip_child(&mut store, render.work_in_progress());
    let output = FunctionComponentOutputHandle::from_raw(404);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver = TestHostTreeFunctionOutputResolver::new(&source);

    let error = handoff_completed_function_component_single_child_to_test_complete_work(
        &mut store,
        &mut host,
        render,
        &source,
        &mut registry,
        &resolver,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostRootFunctionComponentSingleChildCompleteWorkHandoffError::BeginWork(
            BeginWorkError::FunctionComponentSingleChild(
                FunctionComponentSingleChildReconciliationError::UnknownOutput {
                    fiber: function_component,
                    output,
                },
            ),
        )
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(
        store
            .fiber_arena()
            .get(render.work_in_progress())
            .unwrap()
            .child(),
        Some(function_component)
    );
    assert_eq!(
        store.fiber_arena().get(function_component).unwrap().flags(),
        FiberFlags::NO
    );
}

#[test]
fn root_work_loop_function_component_parent_topology_handoff_fails_closed_for_sibling() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let child_element = source.insert_text("sibling blocked");
    update_container(&mut store, root_id, RootElementHandle::from_raw(903), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (_current_child, function_component, component) =
        attach_function_component_wip_child(&mut store, render.work_in_progress());
    let sibling = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::NONE,
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[function_component, sibling])
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver = TestHostTreeFunctionOutputResolver::new(&source);

    let error = handoff_completed_function_component_single_child_to_test_complete_work(
        &mut store,
        &mut host,
        render,
        &source,
        &mut registry,
        &resolver,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostRootFunctionComponentSingleChildCompleteWorkHandoffError::UnexpectedFunctionComponentSibling {
            root: root_id,
            host_root_work_in_progress: render.work_in_progress(),
            function_component,
            sibling,
        }
    );
    assert!(registry.calls().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    let function_node = store.fiber_arena().get(function_component).unwrap();
    assert_eq!(
        function_node.return_fiber(),
        Some(render.work_in_progress())
    );
    assert_eq!(function_node.sibling(), Some(sibling));
    assert_eq!(function_node.child(), None);
}

#[test]
fn root_work_loop_function_component_single_child_handoff_rejects_unsupported_outputs() {
    for (index, tag) in [
        FiberTag::Suspense,
        FiberTag::Offscreen,
        FiberTag::Activity,
        FiberTag::ViewTransition,
        FiberTag::Fragment,
        FiberTag::Portal,
    ]
    .into_iter()
    .enumerate()
    {
        let raw = index as u64;
        let (mut store, root_id, mut host) = root_store();
        let source = TestHostTree::new();
        let original_root_element = RootElementHandle::from_raw(930 + raw);
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, original_root_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (_current_child, function_component, component) =
            attach_function_component_wip_child(&mut store, render.work_in_progress());
        let output = FunctionComponentOutputHandle::from_raw(960 + raw);
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver =
            StaticSingleChildOutputResolver::new(FunctionComponentSingleChildOutput::new(
                output,
                RootElementHandle::from_raw(970 + raw),
                tag,
                ElementTypeHandle::from_raw(980 + raw),
                PropsHandle::from_raw(990 + raw),
            ));

        let error = handoff_completed_function_component_single_child_to_test_complete_work(
            &mut store,
            &mut host,
            render,
            &source,
            &mut registry,
            &resolver,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootFunctionComponentSingleChildCompleteWorkHandoffError::BeginWork(
                BeginWorkError::FunctionComponentSingleChild(
                    FunctionComponentSingleChildReconciliationError::UnsupportedChildTag {
                        fiber: function_component,
                        output,
                        tag,
                    },
                ),
            )
        );
        assert_eq!(registry.calls().len(), 1);
        assert_client_root_fail_closed_without_side_effects(
            &store,
            &host,
            root_id,
            current,
            render,
            function_component,
        );
        let function_node = store.fiber_arena().get(function_component).unwrap();
        assert_eq!(function_node.child(), None);
        assert_eq!(function_node.flags(), FiberFlags::NO);
    }
}

#[test]
fn root_work_loop_function_component_complete_handoff_preserves_root_preflight() {
    for (tag, feature) in [
        (FiberTag::Suspense, SUSPENSE_UNSUPPORTED_FEATURE),
        (FiberTag::Offscreen, OFFSCREEN_UNSUPPORTED_FEATURE),
        (FiberTag::Activity, ACTIVITY_UNSUPPORTED_FEATURE),
        (
            FiberTag::ViewTransition,
            VIEW_TRANSITION_UNSUPPORTED_FEATURE,
        ),
        (FiberTag::SuspenseList, SUSPENSE_LIST_UNSUPPORTED_FEATURE),
    ] {
        let (mut store, root_id, mut host) = root_store();
        let source = TestHostTree::new();
        let original_root_element = RootElementHandle::from_raw(1_020);
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, original_root_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let child = attach_wip_child_with_tag(&mut store, render.work_in_progress(), tag);
        let mut registry = TestFunctionComponentRegistry::default();
        let resolver = TestHostTreeFunctionOutputResolver::new(&source);

        let error = handoff_completed_function_component_single_child_to_test_complete_work(
            &mut store,
            &mut host,
            render,
            &source,
            &mut registry,
            &resolver,
        )
        .unwrap_err();

        match error {
            HostRootFunctionComponentSingleChildCompleteWorkHandoffError::ChildPreflight(error) => {
                assert_root_child_preflight_blocks_unsupported_tag(
                    *error,
                    root_id,
                    render.work_in_progress(),
                    child,
                    tag,
                    feature,
                    render.render_lanes(),
                );
            }
            other => panic!("expected child preflight error, got {other:?}"),
        }
        assert!(registry.calls().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &store, &host, root_id, current, render, child,
        );
        let child_node = store.fiber_arena().get(child).unwrap();
        assert_eq!(child_node.memoized_props(), PropsHandle::NONE);
        assert_eq!(child_node.flags(), FiberFlags::NO);
    }

    let (mut portal_store, portal_root_id, mut portal_host) = root_store();
    let portal_source = TestHostTree::new();
    let portal_current = portal_store.root(portal_root_id).unwrap().current();
    update_container(
        &mut portal_store,
        portal_root_id,
        RootElementHandle::from_raw(1_021),
        None,
    )
    .unwrap();
    let portal_render =
        render_host_root_for_lanes(&mut portal_store, portal_root_id, Lanes::DEFAULT).unwrap();
    let (portal, portal_child) =
        attach_portal_wip_child(&mut portal_store, portal_render.work_in_progress());
    let mut portal_registry = TestFunctionComponentRegistry::default();
    let portal_resolver = TestHostTreeFunctionOutputResolver::new(&portal_source);

    let portal_error = handoff_completed_function_component_single_child_to_test_complete_work(
        &mut portal_store,
        &mut portal_host,
        portal_render,
        &portal_source,
        &mut portal_registry,
        &portal_resolver,
    )
    .unwrap_err();

    match portal_error {
        HostRootFunctionComponentSingleChildCompleteWorkHandoffError::ChildPreflight(error) => {
            match *error {
                HostRootChildBeginWorkPreflightError::UnsupportedPortal {
                    root,
                    host_root_work_in_progress,
                    portal: record,
                } => {
                    assert_eq!(root, portal_root_id);
                    assert_eq!(host_root_work_in_progress, portal_render.work_in_progress());
                    assert_eq!(record.fiber(), portal);
                    assert_eq!(record.child(), Some(portal_child));
                    assert_eq!(record.feature(), PORTAL_RECONCILER_UNSUPPORTED_FEATURE);
                }
                other => panic!("expected portal preflight diagnostic, got {other:?}"),
            }
        }
        other => panic!("expected child preflight error, got {other:?}"),
    }
    assert!(portal_registry.calls().is_empty());
    assert_client_root_fail_closed_without_side_effects(
        &portal_store,
        &portal_host,
        portal_root_id,
        portal_current,
        portal_render,
        portal,
    );

    let (mut fragment_store, fragment_root_id, mut fragment_host) = root_store();
    let fragment_source = TestHostTree::new();
    let fragment_current = fragment_store.root(fragment_root_id).unwrap().current();
    update_container(
        &mut fragment_store,
        fragment_root_id,
        RootElementHandle::from_raw(1_022),
        None,
    )
    .unwrap();
    let fragment_render =
        render_host_root_for_lanes(&mut fragment_store, fragment_root_id, Lanes::DEFAULT).unwrap();
    let (fragment, fragment_child) = attach_fragment_wip_child_with_descendant(
        &mut fragment_store,
        fragment_render.work_in_progress(),
    );
    let mut fragment_registry = TestFunctionComponentRegistry::default();
    let fragment_resolver = TestHostTreeFunctionOutputResolver::new(&fragment_source);

    let fragment_error = handoff_completed_function_component_single_child_to_test_complete_work(
        &mut fragment_store,
        &mut fragment_host,
        fragment_render,
        &fragment_source,
        &mut fragment_registry,
        &fragment_resolver,
    )
    .unwrap_err();

    assert_eq!(
        fragment_error,
        HostRootFunctionComponentSingleChildCompleteWorkHandoffError::ExpectedFunctionComponentChild {
            root: fragment_root_id,
            host_root_work_in_progress: fragment_render.work_in_progress(),
            child: fragment,
            tag: FiberTag::Fragment,
        }
    );
    assert!(fragment_registry.calls().is_empty());
    assert_client_root_fail_closed_without_side_effects(
        &fragment_store,
        &fragment_host,
        fragment_root_id,
        fragment_current,
        fragment_render,
        fragment,
    );
    let fragment_node = fragment_store.fiber_arena().get(fragment).unwrap();
    assert_eq!(fragment_node.memoized_props(), PropsHandle::NONE);
    assert_eq!(fragment_node.child(), Some(fragment_child));
}
