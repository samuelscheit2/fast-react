use super::*;

#[test]
fn root_work_loop_hands_function_component_host_component_output_to_test_complete_work() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let child_element = source.insert_host_element_with_text("main", "from function");
    let original_root_element = RootElementHandle::from_raw(900);
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, original_root_element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (_current_child, function_component, component) =
        attach_function_component_wip_child(&mut store, render.work_in_progress());
    let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver = TestHostTreeFunctionOutputResolver::new(&source);

    let record = handoff_completed_function_component_single_child_to_test_complete_work(
        &mut store,
        &mut host,
        render,
        &source,
        &mut registry,
        &resolver,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.original_root_element(), original_root_element);
    assert_eq!(record.function_component(), function_component);
    assert_eq!(record.begin_work().output(), output);
    assert_eq!(
        record.begin_work().single_child().function_component(),
        function_component
    );
    assert_eq!(record.child_element(), child_element);
    assert_eq!(record.child_tag(), FiberTag::HostComponent);
    assert_eq!(record.complete_work().resulting_element(), child_element);
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

    let root_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
    assert_eq!(root_node.child(), Some(function_component));
    let function_node = store.fiber_arena().get(function_component).unwrap();
    let host_child = record.complete_work().completed_child().unwrap();
    assert_eq!(
        function_node.return_fiber(),
        Some(render.work_in_progress())
    );
    assert_eq!(function_node.sibling(), None);
    assert_eq!(function_node.child(), Some(host_child));
    assert!(
        function_node
            .flags()
            .contains_all(FiberFlags::PERFORMED_WORK)
    );
    assert!(
        function_node
            .subtree_flags()
            .contains_all(FiberFlags::PLACEMENT)
    );
    assert_eq!(
        store.fiber_arena().get(host_child).unwrap().tag(),
        FiberTag::HostComponent
    );
    assert_eq!(
        store.fiber_arena().get(host_child).unwrap().return_fiber(),
        Some(function_component)
    );
    store.fiber_arena().validate_topology().unwrap();
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
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
        ]
    );
}

#[test]
fn root_work_loop_hands_function_component_host_text_output_to_test_complete_work() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let child_element = source.insert_text("function text");
    let original_root_element = RootElementHandle::from_raw(901);
    update_container(&mut store, root_id, original_root_element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (_current_child, function_component, component) =
        attach_function_component_wip_child(&mut store, render.work_in_progress());
    let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver = TestHostTreeFunctionOutputResolver::new(&source);

    let record = handoff_completed_function_component_single_child_to_test_complete_work(
        &mut store,
        &mut host,
        render,
        &source,
        &mut registry,
        &resolver,
    )
    .unwrap();

    assert_eq!(record.function_component(), function_component);
    assert_eq!(record.original_root_element(), original_root_element);
    assert_eq!(record.child_element(), child_element);
    assert_eq!(record.child_tag(), FiberTag::HostText);
    assert_eq!(
        record.complete_work().root_child_tag(),
        Some(FiberTag::FunctionComponent)
    );
    assert_eq!(
        record.complete_work().completed_child_tag(),
        Some(FiberTag::HostText)
    );
    assert_eq!(record.complete_work().detached_instance_count(), 0);
    assert_eq!(record.complete_work().detached_text_count(), 1);
    let root_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
    assert_eq!(root_node.child(), Some(function_component));
    let function_node = store.fiber_arena().get(function_component).unwrap();
    let host_child = record.complete_work().completed_child().unwrap();
    assert_eq!(
        function_node.return_fiber(),
        Some(render.work_in_progress())
    );
    assert_eq!(function_node.child(), Some(host_child));
    let host_child_node = store.fiber_arena().get(host_child).unwrap();
    assert_eq!(host_child_node.tag(), FiberTag::HostText);
    assert_eq!(host_child_node.return_fiber(), Some(function_component));
    assert!(host_child_node.state_node().is_some());
    store.fiber_arena().validate_topology().unwrap();
    assert_eq!(
        host.operations(),
        vec!["root_host_context", "create_text_instance"]
    );
}

#[test]
fn root_work_loop_function_component_single_child_executes_private_container_append_after_commit() {
    for (index, expected_tag) in [FiberTag::HostText, FiberTag::HostComponent]
        .into_iter()
        .enumerate()
    {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let child_element = match expected_tag {
            FiberTag::HostText => source.insert_text("function text execution"),
            FiberTag::HostComponent => {
                source.insert_host_element_with_text("main", "function host execution")
            }
            _ => unreachable!("test only covers HostText and HostComponent"),
        };
        let root_element = RootElementHandle::from_raw(86_500 + index as u64);
        let mut fixture = function_component_single_child_commit_fixture(
            &mut store,
            &mut host,
            root_id,
            &source,
            root_element,
            child_element,
        );
        let completed_child = fixture.complete_work.completed_child().unwrap();
        let operations_before_execute = host.operations();

        let apply = execute_function_component_single_child_host_mutation_for_canary(
            &mut store,
            &mut host,
            fixture.render,
            fixture.function_component,
            fixture.single_child,
            fixture.complete_work,
            fixture.finished_work_handoff.commit(),
            &mut fixture.host_work,
        )
        .unwrap();

        assert!(fixture.finished_work_handoff.mutation_execution_blocked());
        assert!(
            fixture
                .finished_work_handoff
                .public_root_rendering_blocked()
        );
        assert!(
            fixture
                .finished_work_handoff
                .effects_refs_and_hydration_blocked()
        );
        assert_eq!(fixture.single_child.child_tag(), expected_tag);
        assert_single_function_component_container_append(
            &apply,
            root_id,
            fixture.render.work_in_progress(),
            completed_child,
            expected_tag,
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            fixture.render.work_in_progress()
        );
        let mut expected_operations = operations_before_execute;
        expected_operations.push("append_child_to_container");
        assert_eq!(host.operations(), expected_operations);
    }
}

#[test]
fn root_work_loop_function_component_bailout_consumes_begin_work_blocker_after_single_child_mount()
{
    let mut fixture = function_component_bailout_consumer_fixture(982_001);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(
        fixture.source.function_component_type(),
        Ok(FunctionComponentOutputHandle::from_raw(982_901)),
    );
    let context_store = FunctionComponentContextRenderStore::new();
    let operations_before = fixture.host.operations();
    let root_current_before = fixture.store.root(fixture.root_id).unwrap().current();

    let record =
        consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
            &mut fixture.store,
            &fixture.host,
            fixture.render,
            &fixture.source,
            HostRootFunctionComponentBailoutConsumerRequestForCanary::new(
                fixture.function_component_work_in_progress,
            ),
            &context_store,
        )
        .unwrap();

    assert_eq!(record.root(), fixture.root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        fixture.render.work_in_progress()
    );
    assert_eq!(record.previous_current(), fixture.source.previous_current());
    assert_eq!(
        record.function_component_current(),
        fixture.source.function_component()
    );
    assert_eq!(
        record.function_component_work_in_progress(),
        fixture.function_component_work_in_progress
    );
    assert_eq!(record.mount_source().root(), fixture.root_id);
    assert_eq!(
        record.mount_source().root_token(),
        fixture.root_id.state_node_handle()
    );
    assert_eq!(
        record.mount_source().root_element(),
        RootElementHandle::from_raw(982_001)
    );
    assert_eq!(record.mount_source().render_lanes(), Lanes::DEFAULT);
    assert_eq!(
        record.mount_source().single_child(),
        fixture.source.single_child()
    );
    assert_eq!(
        record.mount_source().complete_work(),
        fixture.source.complete_work()
    );
    assert_eq!(
        record
            .mount_source()
            .finished_work_handoff()
            .current_after_commit(),
        fixture.source.committed_current()
    );
    assert_eq!(record.mount_source().child(), fixture.source.child());
    assert_eq!(
        record.mount_source().child_tag(),
        fixture.source.child_tag()
    );
    assert_eq!(
        record.mount_source().child_element(),
        fixture.source.child_element()
    );
    assert_eq!(
        record.mount_source().child_props(),
        fixture.source.child_props()
    );
    assert!(record.mount_source().source_owned_mount_path_recorded());
    assert!(!record.mount_source().caller_built());
    assert!(!record.mount_source().public_compatibility_claimed());
    assert!(!record.mount_source().public_root_compatibility_claimed());
    assert!(!record.mount_source().react_dom_compatibility_claimed());
    assert!(
        !record
            .mount_source()
            .native_renderer_compatibility_claimed()
    );
    assert!(!record.mount_source().test_renderer_compatibility_claimed());
    assert!(!record.mount_source().scheduler_compatibility_claimed());
    assert!(!record.mount_source().package_compatibility_claimed());
    assert!(record.mount_source().compatibility_claim_blocked());

    let blocker = record.bailout_blocker();
    assert_eq!(blocker.current(), fixture.source.function_component());
    assert_eq!(
        blocker.work_in_progress(),
        fixture.function_component_work_in_progress
    );
    assert_eq!(
        blocker.pending_props(),
        fixture.source.function_component_memoized_props()
    );
    assert_eq!(
        blocker.memoized_props(),
        fixture.source.function_component_memoized_props()
    );
    assert_eq!(blocker.render_lanes(), Lanes::DEFAULT);
    assert_eq!(blocker.context_dependency_count(), 0);
    assert_eq!(blocker.context_dependency_lanes(), Lanes::NO);
    assert_eq!(blocker.child_to_visit(), None);
    assert!(blocker.child_traversal_blocked());
    assert!(record.same_props_proven());
    assert!(record.no_relevant_component_lanes());
    assert!(record.no_context_lane());
    assert!(record.no_child_lane_traversal());
    assert!(record.consumed_worker_921_begin_work_blocker());
    assert!(record.component_invocation_blocked());
    assert!(record.host_output_unchanged());
    assert!(record.current_switch_blocked());
    assert!(record.public_renderer_behavior_blocked());
    assert!(record.compatibility_claim_blocked());
    assert!(!record.public_compatibility_claimed());
    assert!(!record.public_root_compatibility_claimed());
    assert!(!record.react_dom_compatibility_claimed());
    assert!(!record.native_renderer_compatibility_claimed());
    assert!(!record.test_renderer_compatibility_claimed());
    assert!(!record.scheduler_compatibility_claimed());
    assert!(!record.package_compatibility_claimed());
    assert_eq!(registry.calls(), &[]);
    assert_eq!(fixture.host.operations(), operations_before);
    assert_eq!(
        record.host_operation_count_before(),
        operations_before.len()
    );
    assert_eq!(record.host_operation_count_after(), operations_before.len());
    assert_eq!(record.root_current_before(), root_current_before);
    assert_eq!(record.root_current_after(), root_current_before);
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        fixture.source.committed_current()
    );
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().finished_work(),
        None
    );
    assert_eq!(
        fixture
            .store
            .root(fixture.root_id)
            .unwrap()
            .finished_lanes(),
        Lanes::NO
    );
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.function_component_work_in_progress)
            .unwrap()
            .child(),
        None
    );
}

#[test]
fn root_work_loop_function_component_bailout_rejects_props_lanes_context_and_child_lanes() {
    let mut props_fixture = function_component_bailout_consumer_fixture(982_020);
    let props_operations = props_fixture.host.operations().len();
    let changed_props = PropsHandle::from_raw(982_021);
    props_fixture
        .store
        .fiber_arena_mut()
        .get_mut(props_fixture.function_component_work_in_progress)
        .unwrap()
        .set_pending_props(changed_props);
    let props_error =
        consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
            &mut props_fixture.store,
            &props_fixture.host,
            props_fixture.render,
            &props_fixture.source,
            HostRootFunctionComponentBailoutConsumerRequestForCanary::new(
                props_fixture.function_component_work_in_progress,
            ),
            &FunctionComponentContextRenderStore::new(),
        )
        .unwrap_err();
    assert!(matches!(
        props_error,
        HostRootFunctionComponentBailoutConsumerErrorForCanary::BeginWorkBailout(
            FunctionComponentBeginWorkBailoutBlockerError::PropsChanged {
                pending_props,
                ..
            }
        ) if pending_props == changed_props
    ));
    assert_function_component_bailout_consumer_failure_is_inert(&props_fixture, props_operations);

    let mut lane_fixture = function_component_bailout_consumer_fixture(982_030);
    let lane_operations = lane_fixture.host.operations().len();
    lane_fixture
        .store
        .fiber_arena_mut()
        .get_mut(lane_fixture.source.function_component())
        .unwrap()
        .set_lanes(Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1));
    let lane_error =
        consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
            &mut lane_fixture.store,
            &lane_fixture.host,
            lane_fixture.render,
            &lane_fixture.source,
            HostRootFunctionComponentBailoutConsumerRequestForCanary::new(
                lane_fixture.function_component_work_in_progress,
            ),
            &FunctionComponentContextRenderStore::new(),
        )
        .unwrap_err();
    assert!(matches!(
        lane_error,
        HostRootFunctionComponentBailoutConsumerErrorForCanary::BeginWorkBailout(
            FunctionComponentBeginWorkBailoutBlockerError::ScheduledUpdate {
                current_lanes,
                ..
            }
        ) if current_lanes == Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1)
    ));
    assert_function_component_bailout_consumer_failure_is_inert(&lane_fixture, lane_operations);

    let mut context_fixture = function_component_bailout_consumer_fixture(982_040);
    let context_operations = context_fixture.host.operations().len();
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(982_041);
    let previous_value = context_value(982_042);
    let next_value = context_value(982_043);
    let context = context_store.create_context(default_value);
    let provider_snapshot = context_store
        .push_provider(context, previous_value)
        .unwrap();
    let mut registry = TestUseContextComponentRegistry::new(
        context_fixture.source.function_component_type(),
        UseContextBehavior::ReadOnce { context },
    );
    let context_render = begin_work_function_component_use_context(
        context_fixture.store.fiber_arena_mut(),
        BeginWorkRequest::new(
            context_fixture.function_component_work_in_progress,
            Lanes::DEFAULT,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap()
    .render();
    context_store.restore_snapshot(provider_snapshot).unwrap();
    let propagation = propagate_context_change_to_function_component_dependencies(
        &mut context_fixture.store,
        &mut context_store,
        context_render,
        FunctionComponentContextChangePropagationRequest::new(
            ContextValueChange::new(context, previous_value, next_value),
            Lanes::DEFAULT,
        ),
    )
    .unwrap();
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(propagation.marked_dependency_count(), 1);
    let context_error =
        consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
            &mut context_fixture.store,
            &context_fixture.host,
            context_fixture.render,
            &context_fixture.source,
            HostRootFunctionComponentBailoutConsumerRequestForCanary::new(
                context_fixture.function_component_work_in_progress,
            ),
            &context_store,
        )
        .unwrap_err();
    assert!(matches!(
        context_error,
        HostRootFunctionComponentBailoutConsumerErrorForCanary::BeginWorkBailout(
            FunctionComponentBeginWorkBailoutBlockerError::ContextChanged {
                context_dependency_count: 1,
                context_dependency_lanes,
                ..
            }
        ) if context_dependency_lanes == Lanes::DEFAULT
    ));
    assert_function_component_bailout_consumer_failure_is_inert(
        &context_fixture,
        context_operations,
    );

    let mut child_lane_fixture = function_component_bailout_consumer_fixture(982_050);
    let child_lane_operations = child_lane_fixture.host.operations().len();
    let child_work_in_progress = child_lane_fixture
        .store
        .fiber_arena_mut()
        .create_work_in_progress(
            child_lane_fixture.source.child(),
            child_lane_fixture.source.child_props(),
        )
        .unwrap();
    child_lane_fixture
        .store
        .fiber_arena_mut()
        .set_children(
            child_lane_fixture.function_component_work_in_progress,
            &[child_work_in_progress],
        )
        .unwrap();
    child_lane_fixture
        .store
        .fiber_arena_mut()
        .get_mut(child_lane_fixture.function_component_work_in_progress)
        .unwrap()
        .set_child_lanes(Lanes::DEFAULT);
    let child_lane_error =
        consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
            &mut child_lane_fixture.store,
            &child_lane_fixture.host,
            child_lane_fixture.render,
            &child_lane_fixture.source,
            HostRootFunctionComponentBailoutConsumerRequestForCanary::new(
                child_lane_fixture.function_component_work_in_progress,
            ),
            &FunctionComponentContextRenderStore::new(),
        )
        .unwrap_err();
    assert!(matches!(
        child_lane_error,
        HostRootFunctionComponentBailoutConsumerErrorForCanary::BeginWorkBailout(
            FunctionComponentBeginWorkBailoutBlockerError::ChildLanesIntersectRenderLanes {
                child: Some(child),
                child_lanes,
                ..
            }
        ) if child == child_work_in_progress && child_lanes == Lanes::DEFAULT
    ));
    assert_function_component_bailout_consumer_failure_is_inert(
        &child_lane_fixture,
        child_lane_operations,
    );
}

#[test]
fn root_work_loop_function_component_bailout_rejects_memo_and_unsupported_tag_smuggling() {
    for (index, tag) in [FiberTag::MemoComponent, FiberTag::SimpleMemoComponent]
        .into_iter()
        .enumerate()
    {
        let mut fixture = function_component_bailout_consumer_fixture(982_100 + index as u64);
        let operations = fixture.host.operations().len();
        let smuggled = fixture.store.fiber_arena_mut().create_fiber(
            tag,
            None,
            fixture.source.function_component_memoized_props(),
            FiberMode::NO,
        );
        fixture
            .store
            .fiber_arena_mut()
            .set_children(fixture.render.work_in_progress(), &[smuggled])
            .unwrap();

        let error =
            consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
                &mut fixture.store,
                &fixture.host,
                fixture.render,
                &fixture.source,
                HostRootFunctionComponentBailoutConsumerRequestForCanary::new(smuggled),
                &FunctionComponentContextRenderStore::new(),
            )
            .unwrap_err();

        assert!(matches!(
            error,
            HostRootFunctionComponentBailoutConsumerErrorForCanary::ExpectedFunctionComponentChild {
                child,
                tag: actual,
                ..
            } if child == smuggled && actual == tag
        ));
        assert_function_component_bailout_consumer_failure_is_inert(&fixture, operations);
    }

    let mut unsupported_fixture = function_component_bailout_consumer_fixture(982_120);
    let operations = unsupported_fixture.host.operations().len();
    let unsupported = unsupported_fixture.store.fiber_arena_mut().create_fiber(
        FiberTag::ViewTransition,
        None,
        PropsHandle::from_raw(982_121),
        FiberMode::NO,
    );
    unsupported_fixture
        .store
        .fiber_arena_mut()
        .set_children(
            unsupported_fixture.render.work_in_progress(),
            &[unsupported],
        )
        .unwrap();
    let error =
        consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
            &mut unsupported_fixture.store,
            &unsupported_fixture.host,
            unsupported_fixture.render,
            &unsupported_fixture.source,
            HostRootFunctionComponentBailoutConsumerRequestForCanary::new(unsupported),
            &FunctionComponentContextRenderStore::new(),
        )
        .unwrap_err();

    assert!(matches!(
        error,
        HostRootFunctionComponentBailoutConsumerErrorForCanary::ChildPreflight(error)
            if matches!(
                *error,
                HostRootChildBeginWorkPreflightError::UnsupportedReconcilerFiberFeature {
                    fiber,
                    tag: FiberTag::ViewTransition,
                    ..
                } if fiber == unsupported
            )
    ));
    assert_function_component_bailout_consumer_failure_is_inert(&unsupported_fixture, operations);
}

#[test]
fn root_work_loop_function_component_bailout_rejects_stale_cloned_and_caller_shaped_mount_evidence()
{
    let mut caller_fixture = function_component_bailout_consumer_fixture(982_200);
    let caller_operations = caller_fixture.host.operations().len();
    let mut caller_source = caller_fixture.source.clone();
    caller_source.caller_built = true;
    let caller_error =
        consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
            &mut caller_fixture.store,
            &caller_fixture.host,
            caller_fixture.render,
            &caller_source,
            HostRootFunctionComponentBailoutConsumerRequestForCanary::new(
                caller_fixture.function_component_work_in_progress,
            ),
            &FunctionComponentContextRenderStore::new(),
        )
        .unwrap_err();
    assert_eq!(
        caller_error,
        HostRootFunctionComponentBailoutConsumerErrorForCanary::CallerShapedMountEvidence
    );
    assert_function_component_bailout_consumer_failure_is_inert(&caller_fixture, caller_operations);

    let mut missing_fixture = function_component_bailout_consumer_fixture(982_210);
    let missing_operations = missing_fixture.host.operations().len();
    let mut missing_source = missing_fixture.source.clone();
    missing_source.source_owned_mount_path_recorded = false;
    let missing_error =
        consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
            &mut missing_fixture.store,
            &missing_fixture.host,
            missing_fixture.render,
            &missing_source,
            HostRootFunctionComponentBailoutConsumerRequestForCanary::new(
                missing_fixture.function_component_work_in_progress,
            ),
            &FunctionComponentContextRenderStore::new(),
        )
        .unwrap_err();
    assert_eq!(
        missing_error,
        HostRootFunctionComponentBailoutConsumerErrorForCanary::MissingAcceptedMountEvidence {
            field: "source_owned_mount_path_recorded"
        }
    );
    assert_function_component_bailout_consumer_failure_is_inert(
        &missing_fixture,
        missing_operations,
    );

    let mut caller_row_fixture = function_component_bailout_consumer_fixture(982_220);
    let caller_row_operations = caller_row_fixture.host.operations().len();
    let mut caller_row_source = caller_row_fixture.source.clone();
    caller_row_source.child_props = PropsHandle::from_raw(982_221);
    let caller_row_error =
        consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
            &mut caller_row_fixture.store,
            &caller_row_fixture.host,
            caller_row_fixture.render,
            &caller_row_source,
            HostRootFunctionComponentBailoutConsumerRequestForCanary::new(
                caller_row_fixture.function_component_work_in_progress,
            ),
            &FunctionComponentContextRenderStore::new(),
        )
        .unwrap_err();
    assert_eq!(
        caller_row_error,
        HostRootFunctionComponentBailoutConsumerErrorForCanary::StaleOrClonedMountEvidence {
            field: "single_child"
        }
    );
    assert_function_component_bailout_consumer_failure_is_inert(
        &caller_row_fixture,
        caller_row_operations,
    );

    let mut stale_fixture = function_component_bailout_consumer_fixture(982_230);
    let stale_source = stale_fixture.source.clone();
    let stale_render = stale_fixture.render;
    let stale_work_in_progress = stale_fixture.function_component_work_in_progress;
    let mut replacement_source = TestHostTree::new();
    let replacement = replacement_source.insert_text("replacement after cloned source");
    update_container(
        &mut stale_fixture.store,
        stale_fixture.root_id,
        replacement,
        None,
    )
    .unwrap();
    let replacement_render = render_host_root_for_lanes(
        &mut stale_fixture.store,
        stale_fixture.root_id,
        Lanes::DEFAULT,
    )
    .unwrap();
    let _replacement_complete = handoff_completed_host_root_render_to_test_complete_work(
        &mut stale_fixture.store,
        &mut stale_fixture.host,
        replacement_render,
        &replacement_source,
    )
    .unwrap();
    let _replacement_commit =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut stale_fixture.store,
            replacement_render,
            982_231,
            982_232,
        )
        .unwrap();
    let operations_after_replacement = stale_fixture.host.operations().len();

    let stale_error =
        consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
            &mut stale_fixture.store,
            &stale_fixture.host,
            stale_render,
            &stale_source,
            HostRootFunctionComponentBailoutConsumerRequestForCanary::new(stale_work_in_progress),
            &FunctionComponentContextRenderStore::new(),
        )
        .unwrap_err();
    assert_eq!(
        stale_error,
        HostRootFunctionComponentBailoutConsumerErrorForCanary::StaleOrClonedMountEvidence {
            field: "root.current"
        }
    );
    assert_eq!(
        stale_fixture.host.operations().len(),
        operations_after_replacement
    );
    assert_ne!(
        stale_fixture
            .store
            .root(stale_fixture.root_id)
            .unwrap()
            .current(),
        stale_source.committed_current()
    );
}

#[test]
fn root_work_loop_function_component_bailout_rejects_public_renderer_scheduler_and_package_claims()
{
    for (index, surface) in [
        HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::Public,
        HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::PublicRoot,
        HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::ReactDom,
        HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::NativeRenderer,
        HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::ReactTestRenderer,
        HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::Scheduler,
        HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::Package,
    ]
    .into_iter()
    .enumerate()
    {
        let mut fixture = function_component_bailout_consumer_fixture(982_300 + index as u64);
        let operations = fixture.host.operations().len();
        let error =
            consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
                &mut fixture.store,
                &fixture.host,
                fixture.render,
                &fixture.source,
                HostRootFunctionComponentBailoutConsumerRequestForCanary::new(
                    fixture.function_component_work_in_progress,
                )
                .with_compatibility_claim(surface),
                &FunctionComponentContextRenderStore::new(),
            )
            .unwrap_err();

        assert_eq!(
            error,
            HostRootFunctionComponentBailoutConsumerErrorForCanary::CompatibilityClaim { surface }
        );
        assert_function_component_bailout_consumer_failure_is_inert(&fixture, operations);
    }

    let mut source_claim_fixture = function_component_bailout_consumer_fixture(982_330);
    let operations = source_claim_fixture.host.operations().len();
    let mut source_claim = source_claim_fixture.source.clone();
    source_claim.compatibility_claims =
        HostRootFunctionComponentBailoutCompatibilityClaimsForCanary::none()
            .with_claim(HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::Package);
    let error =
        consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
            &mut source_claim_fixture.store,
            &source_claim_fixture.host,
            source_claim_fixture.render,
            &source_claim,
            HostRootFunctionComponentBailoutConsumerRequestForCanary::new(
                source_claim_fixture.function_component_work_in_progress,
            ),
            &FunctionComponentContextRenderStore::new(),
        )
        .unwrap_err();

    assert_eq!(
        error,
        HostRootFunctionComponentBailoutConsumerErrorForCanary::CompatibilityClaim {
            surface: HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::Package
        }
    );
    assert_function_component_bailout_consumer_failure_is_inert(&source_claim_fixture, operations);
}

#[test]
fn root_work_loop_function_component_render_phase_update_consumes_private_currentness_evidence() {
    let mut fixture = function_component_render_phase_update_root_consumer_fixture(985_001);
    let operations_before = fixture.host.operations();
    let root_current_before = fixture.store.root(fixture.root_id).unwrap().current();
    let source_token = fixture.source.source_token().unwrap();

    let record =
        consume_root_work_loop_function_component_render_phase_update_currentness_for_canary(
            &fixture.store,
            &fixture.host,
            &fixture.hook_store,
            fixture.render,
            &mut fixture.source,
            HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary::new(
                fixture.function_component_work_in_progress,
            ),
        )
        .unwrap();

    assert_eq!(record.root(), fixture.root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        fixture.render.work_in_progress()
    );
    assert_eq!(record.root_current_before(), root_current_before);
    assert_eq!(record.root_current_after(), root_current_before);
    assert_eq!(
        record.function_component_current(),
        fixture.source.function_component_current()
    );
    assert_eq!(
        record.function_component_work_in_progress(),
        fixture.function_component_work_in_progress
    );
    assert_eq!(
        record.current_hook_list(),
        fixture.source.current_hook_list()
    );
    assert_eq!(
        record.work_in_progress_hook_list(),
        fixture.source.work_in_progress_hook_list()
    );
    assert_eq!(
        record.hook_list_owner(),
        fixture.source.function_component_current()
    );
    assert_eq!(record.hook_state(), fixture.source.hook_state());
    assert_eq!(record.queue(), fixture.source.queue());
    assert_eq!(record.update(), fixture.source.update());
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(record.source_token(), source_token);
    assert_eq!(record.dispatch(), fixture.source.dispatch());
    assert_eq!(record.drain(), fixture.source.drain());
    assert_eq!(record.drain().drained_update_count(), 1);
    assert_eq!(record.drain().queues(), &[record.queue()]);
    assert_eq!(record.drain().updates(), &[record.update()]);
    assert!(record.drain().proves_current_render_phase_staging());
    assert!(record.exact_function_component_hook_identity());
    assert!(record.consumed_source_owned_render_phase_update());
    assert!(record.render_phase_update_did_not_escape_to_root_scheduler());
    assert!(record.component_invocation_blocked());
    assert!(record.host_output_unchanged());
    assert!(record.current_switch_blocked());
    assert!(record.public_renderer_behavior_blocked());
    assert!(record.compatibility_claim_blocked());
    assert!(!record.public_hook_compatibility_claimed());
    assert!(!record.public_root_compatibility_claimed());
    assert!(!record.root_prerequisite_claimed());
    assert!(!record.react_dom_compatibility_claimed());
    assert!(!record.native_renderer_compatibility_claimed());
    assert!(!record.test_renderer_compatibility_claimed());
    assert!(!record.scheduler_compatibility_claimed());
    assert!(!record.act_compatibility_claimed());
    assert!(!record.package_compatibility_claimed());
    assert!(fixture.source.source_owned_update_path_recorded());
    assert!(!fixture.source.caller_built());
    assert!(fixture.source.consumed());
    assert!(fixture.source.compatibility_claim_blocked());
    assert_eq!(fixture.source.root(), fixture.root_id);
    assert_eq!(
        fixture.source.root_token(),
        fixture.root_id.state_node_handle()
    );
    assert_eq!(fixture.source.root_current(), root_current_before);
    assert_eq!(
        fixture.source.host_root_work_in_progress(),
        fixture.render.work_in_progress()
    );
    assert_eq!(fixture.source.render_lanes(), Lanes::DEFAULT);
    assert_eq!(
        fixture.source.function_component_work_in_progress(),
        fixture.function_component_work_in_progress
    );
    assert_eq!(
        fixture.source.hook_list_owner(),
        fixture.source.function_component_current()
    );
    assert_eq!(
        fixture.source.queue_generation(),
        record.dispatch().queue_generation()
    );
    assert_eq!(
        fixture.source.update_generation(),
        record.dispatch().update_generation()
    );

    let dispatch_source = record.dispatch().source();
    assert_eq!(dispatch_source.react_version(), "19.2.6");
    assert_eq!(
        dispatch_source.render_with_hooks_again(),
        "ReactFiberHooks.renderWithHooksAgain"
    );
    assert_eq!(
        dispatch_source.is_render_phase_update(),
        "isRenderPhaseUpdate"
    );
    assert_eq!(
        dispatch_source.enqueue_render_phase_update(),
        "enqueueRenderPhaseUpdate"
    );
    assert!(!dispatch_source.public_hook_compatibility_claimed());
    assert!(!dispatch_source.public_root_compatibility_claimed());
    assert!(!dispatch_source.root_scheduler_integration_claimed());
    assert!(!dispatch_source.scheduler_compatibility_claimed());
    assert!(!dispatch_source.act_compatibility_claimed());
    assert!(!dispatch_source.renderer_compatibility_claimed());

    assert_eq!(fixture.host.operations(), operations_before);
    assert_eq!(
        record.host_operation_count_before(),
        operations_before.len()
    );
    assert_eq!(record.host_operation_count_after(), operations_before.len());
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        root_current_before
    );
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().finished_work(),
        None
    );
    assert_eq!(
        fixture
            .store
            .root(fixture.root_id)
            .unwrap()
            .finished_lanes(),
        Lanes::NO
    );
}

#[test]
fn root_work_loop_function_component_render_phase_update_rejects_cloned_caller_and_replay_evidence()
{
    let fixture = function_component_render_phase_update_root_consumer_fixture(985_020);
    let operations = fixture.host.operations().len();
    let mut cloned_source = fixture.source.clone();
    let cloned_error =
        consume_root_work_loop_function_component_render_phase_update_currentness_for_canary(
            &fixture.store,
            &fixture.host,
            &fixture.hook_store,
            fixture.render,
            &mut cloned_source,
            HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary::new(
                fixture.function_component_work_in_progress,
            ),
        )
        .unwrap_err();
    assert_eq!(
        cloned_error,
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::MissingSourceToken
    );
    assert!(!cloned_source.consumed());
    assert_render_phase_update_consumer_failure_is_inert(&fixture, operations);

    let mut caller_fixture = function_component_render_phase_update_root_consumer_fixture(985_030);
    let caller_operations = caller_fixture.host.operations().len();
    caller_fixture.source.caller_built = true;
    let caller_error =
        consume_root_work_loop_function_component_render_phase_update_currentness_for_canary(
            &caller_fixture.store,
            &caller_fixture.host,
            &caller_fixture.hook_store,
            caller_fixture.render,
            &mut caller_fixture.source,
            HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary::new(
                caller_fixture.function_component_work_in_progress,
            ),
        )
        .unwrap_err();
    assert_eq!(
        caller_error,
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::CallerShapedRenderPhaseEvidence
    );
    assert_render_phase_update_consumer_failure_is_inert(&caller_fixture, caller_operations);

    let mut replay_fixture = function_component_render_phase_update_root_consumer_fixture(985_040);
    let replay_operations = replay_fixture.host.operations().len();
    let token = replay_fixture.source.source_token().unwrap();
    consume_root_work_loop_function_component_render_phase_update_currentness_for_canary(
        &replay_fixture.store,
        &replay_fixture.host,
        &replay_fixture.hook_store,
        replay_fixture.render,
        &mut replay_fixture.source,
        HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary::new(
            replay_fixture.function_component_work_in_progress,
        ),
    )
    .unwrap();
    let replay_error =
        consume_root_work_loop_function_component_render_phase_update_currentness_for_canary(
            &replay_fixture.store,
            &replay_fixture.host,
            &replay_fixture.hook_store,
            replay_fixture.render,
            &mut replay_fixture.source,
            HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary::new(
                replay_fixture.function_component_work_in_progress,
            ),
        )
        .unwrap_err();
    assert_eq!(
        replay_error,
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::AlreadyConsumed { token }
    );
    assert!(replay_fixture.source.consumed());
    assert_eq!(replay_fixture.host.operations().len(), replay_operations);
}

#[test]
fn root_work_loop_function_component_render_phase_update_rejects_stale_cross_root_and_cross_fiber_evidence()
 {
    let mut stale_fixture = function_component_render_phase_update_root_consumer_fixture(985_100);
    let mut replacement_source = TestHostTree::new();
    let replacement = replacement_source.insert_text("render phase stale replacement");
    update_container(
        &mut stale_fixture.store,
        stale_fixture.root_id,
        replacement,
        None,
    )
    .unwrap();
    let replacement_render = render_host_root_for_lanes(
        &mut stale_fixture.store,
        stale_fixture.root_id,
        Lanes::DEFAULT,
    )
    .unwrap();
    let _replacement_complete = handoff_completed_host_root_render_to_test_complete_work(
        &mut stale_fixture.store,
        &mut stale_fixture.host,
        replacement_render,
        &replacement_source,
    )
    .unwrap();
    let _replacement_commit =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut stale_fixture.store,
            replacement_render,
            985_101,
            985_102,
        )
        .unwrap();
    let stale_operations = stale_fixture.host.operations().len();
    let stale_error =
        consume_root_work_loop_function_component_render_phase_update_currentness_for_canary(
            &stale_fixture.store,
            &stale_fixture.host,
            &stale_fixture.hook_store,
            stale_fixture.render,
            &mut stale_fixture.source,
            HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary::new(
                stale_fixture.function_component_work_in_progress,
            ),
        )
        .unwrap_err();
    assert!(matches!(
        stale_error,
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::MountSource(error)
            if matches!(
                *error,
                HostRootFunctionComponentBailoutConsumerErrorForCanary::StaleOrClonedMountEvidence {
                    field: "root.current"
                }
            )
    ));
    assert!(!stale_fixture.source.consumed());
    assert_eq!(stale_fixture.host.operations().len(), stale_operations);

    let mut cross_root_fixture =
        function_component_render_phase_update_root_consumer_fixture(985_120);
    let other_root = cross_root_fixture
        .store
        .create_client_root(FakeContainer::new(985_121), RootOptions::new())
        .unwrap();
    update_container(
        &mut cross_root_fixture.store,
        other_root,
        RootElementHandle::from_raw(985_122),
        None,
    )
    .unwrap();
    let other_render =
        render_host_root_for_lanes(&mut cross_root_fixture.store, other_root, Lanes::DEFAULT)
            .unwrap();
    let cross_root_operations = cross_root_fixture.host.operations().len();
    let cross_root_error =
        consume_root_work_loop_function_component_render_phase_update_currentness_for_canary(
            &cross_root_fixture.store,
            &cross_root_fixture.host,
            &cross_root_fixture.hook_store,
            other_render,
            &mut cross_root_fixture.source,
            HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary::new(
                cross_root_fixture.function_component_work_in_progress,
            ),
        )
        .unwrap_err();
    assert_eq!(
        cross_root_error,
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::SourceMismatch {
            field: "render.root"
        }
    );
    assert_render_phase_update_consumer_failure_is_inert(
        &cross_root_fixture,
        cross_root_operations,
    );

    let mut cross_fiber_fixture =
        function_component_render_phase_update_root_consumer_fixture(985_140);
    let cross_fiber_operations = cross_fiber_fixture.host.operations().len();
    let other_function = cross_fiber_fixture.store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(985_142),
        FiberMode::NO,
    );
    cross_fiber_fixture
        .source
        .function_component_work_in_progress = other_function;
    let cross_fiber_error =
        consume_root_work_loop_function_component_render_phase_update_currentness_for_canary(
            &cross_fiber_fixture.store,
            &cross_fiber_fixture.host,
            &cross_fiber_fixture.hook_store,
            cross_fiber_fixture.render,
            &mut cross_fiber_fixture.source,
            HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary::new(other_function),
        )
        .unwrap_err();
    assert!(matches!(
        cross_fiber_error,
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::FunctionComponentWorkMismatch {
            expected,
            actual,
        } if expected == other_function
            && actual == cross_fiber_fixture.function_component_work_in_progress
    ));
    assert_render_phase_update_consumer_failure_is_inert(
        &cross_fiber_fixture,
        cross_fiber_operations,
    );
}

#[test]
fn root_work_loop_function_component_render_phase_update_rejects_hook_list_owner_mismatch() {
    let mut fixture = function_component_render_phase_update_root_consumer_fixture(985_200);
    let operations = fixture.host.operations().len();
    let other_function = fixture.store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(985_202),
        FiberMode::NO,
    );
    let other_list = fixture.hook_store.create_current_list(other_function);
    fixture.source.current_hook_list = other_list;

    let error =
        consume_root_work_loop_function_component_render_phase_update_currentness_for_canary(
            &fixture.store,
            &fixture.host,
            &fixture.hook_store,
            fixture.render,
            &mut fixture.source,
            HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary::new(
                fixture.function_component_work_in_progress,
            ),
        )
        .unwrap_err();

    assert_eq!(
        error,
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::HookListOwnerMismatch {
            hook_list: other_list,
            expected_owner: fixture.source.function_component_current(),
            actual_owner: other_function,
        }
    );
    assert_render_phase_update_consumer_failure_is_inert(&fixture, operations);
}

#[test]
fn root_work_loop_function_component_render_phase_update_rejects_public_scheduler_act_and_root_prerequisite_claims()
 {
    for (index, surface) in [
        HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::PublicHook,
        HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::PublicRoot,
        HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::RootPrerequisite,
        HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::ReactDom,
        HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::NativeRenderer,
        HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::ReactTestRenderer,
        HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Renderer,
        HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Scheduler,
        HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Act,
        HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Package,
    ]
    .into_iter()
    .enumerate()
    {
        let mut fixture =
            function_component_render_phase_update_root_consumer_fixture(985_300 + index as u64);
        let operations = fixture.host.operations().len();
        let error =
            consume_root_work_loop_function_component_render_phase_update_currentness_for_canary(
                &fixture.store,
                &fixture.host,
                &fixture.hook_store,
                fixture.render,
                &mut fixture.source,
                HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary::new(
                    fixture.function_component_work_in_progress,
                )
                .with_compatibility_claim(surface),
            )
            .unwrap_err();

        assert_eq!(
            error,
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::CompatibilityClaim {
                surface
            }
        );
        assert_render_phase_update_consumer_failure_is_inert(&fixture, operations);
    }

    let mut source_claim_fixture =
        function_component_render_phase_update_root_consumer_fixture(985_330);
    let operations = source_claim_fixture.host.operations().len();
    source_claim_fixture.source.compatibility_claims =
        HostRootFunctionComponentRenderPhaseUpdateCompatibilityClaimsForCanary::none().with_claim(
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Act,
        );
    let error =
        consume_root_work_loop_function_component_render_phase_update_currentness_for_canary(
            &source_claim_fixture.store,
            &source_claim_fixture.host,
            &source_claim_fixture.hook_store,
            source_claim_fixture.render,
            &mut source_claim_fixture.source,
            HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary::new(
                source_claim_fixture.function_component_work_in_progress,
            ),
        )
        .unwrap_err();
    assert_eq!(
        error,
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::CompatibilityClaim {
            surface: HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Act
        }
    );
    assert_render_phase_update_consumer_failure_is_inert(&source_claim_fixture, operations);
}

#[test]
fn root_work_loop_function_component_host_mutation_rejects_stale_cross_root_or_missing_child_evidence()
 {
    let (mut missing_store, missing_root, mut missing_host) = root_store();
    let mut missing_source = TestHostTree::new();
    let missing_child = missing_source.insert_text("missing child evidence");
    let mut missing_fixture = function_component_single_child_commit_fixture(
        &mut missing_store,
        &mut missing_host,
        missing_root,
        &missing_source,
        RootElementHandle::from_raw(86_600),
        missing_child,
    );
    let missing_completed_child = missing_fixture.complete_work.completed_child().unwrap();
    missing_store
        .fiber_arena_mut()
        .set_children(missing_fixture.function_component, &[])
        .unwrap();
    let missing_operations_before_execute = missing_host.operations();

    let missing_error = execute_function_component_single_child_host_mutation_for_canary(
        &mut missing_store,
        &mut missing_host,
        missing_fixture.render,
        missing_fixture.function_component,
        missing_fixture.single_child,
        missing_fixture.complete_work,
        missing_fixture.finished_work_handoff.commit(),
        &mut missing_fixture.host_work,
    )
    .unwrap_err();

    assert_eq!(
        missing_error,
        HostRootFunctionComponentSingleChildHostMutationExecutionError::FunctionComponentHostChildMismatch {
            root: missing_root,
            function_component: missing_fixture.function_component,
            expected_child: missing_completed_child,
            actual_child: None,
        }
    );
    assert_eq!(missing_host.operations(), missing_operations_before_execute);

    let (mut root_child_store, root_child_root, mut root_child_host) = root_store();
    let mut root_child_source = TestHostTree::new();
    let root_child_element = root_child_source.insert_text("detached root child evidence");
    let mut root_child_fixture = function_component_single_child_commit_fixture(
        &mut root_child_store,
        &mut root_child_host,
        root_child_root,
        &root_child_source,
        RootElementHandle::from_raw(86_605),
        root_child_element,
    );
    root_child_store
        .fiber_arena_mut()
        .set_children(root_child_fixture.render.work_in_progress(), &[])
        .unwrap();
    assert_eq!(
        root_child_store.root(root_child_root).unwrap().current(),
        root_child_fixture.render.work_in_progress()
    );
    let root_child_operations_before_execute = root_child_host.operations();

    let root_child_error = execute_function_component_single_child_host_mutation_for_canary(
        &mut root_child_store,
        &mut root_child_host,
        root_child_fixture.render,
        root_child_fixture.function_component,
        root_child_fixture.single_child,
        root_child_fixture.complete_work,
        root_child_fixture.finished_work_handoff.commit(),
        &mut root_child_fixture.host_work,
    )
    .unwrap_err();

    assert_eq!(
        root_child_error,
        HostRootFunctionComponentSingleChildHostMutationExecutionError::RootFunctionComponentMismatch {
            root: root_child_root,
            expected_function_component: root_child_fixture.function_component,
            actual_root_child: None,
        }
    );
    assert_eq!(
        root_child_host.operations(),
        root_child_operations_before_execute
    );

    let (mut stale_store, stale_root, mut stale_host) = root_store();
    let mut stale_source = TestHostTree::new();
    let stale_child = stale_source.insert_text("stale function evidence");
    let mut stale_fixture = function_component_single_child_commit_fixture(
        &mut stale_store,
        &mut stale_host,
        stale_root,
        &stale_source,
        RootElementHandle::from_raw(86_610),
        stale_child,
    );
    let stale_current = stale_store.fiber_arena_mut().create_fiber(
        FiberTag::HostRoot,
        None,
        PropsHandle::NONE,
        FiberMode::NO,
    );
    stale_store
        .root_mut(stale_root)
        .unwrap()
        .set_current(stale_current);
    let stale_operations_before_execute = stale_host.operations();

    let stale_error = execute_function_component_single_child_host_mutation_for_canary(
        &mut stale_store,
        &mut stale_host,
        stale_fixture.render,
        stale_fixture.function_component,
        stale_fixture.single_child,
        stale_fixture.complete_work,
        stale_fixture.finished_work_handoff.commit(),
        &mut stale_fixture.host_work,
    )
    .unwrap_err();

    assert_eq!(
        stale_error,
        HostRootFunctionComponentSingleChildHostMutationExecutionError::StaleFinishedWorkEvidence {
            root: stale_root,
            expected_current: stale_fixture.finished_work_handoff.commit().current(),
            actual_current: stale_current,
        }
    );
    assert_eq!(stale_host.operations(), stale_operations_before_execute);

    let mut cross_store = FiberRootStore::<RecordingHost>::new();
    let mut cross_host = RecordingHost::default();
    let cross_root = cross_store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let other_root = cross_store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let mut cross_source = TestHostTree::new();
    let cross_child = cross_source.insert_text("cross root function evidence");
    let other_child = cross_source.insert_text("other root function evidence");
    let cross_fixture = function_component_single_child_commit_fixture(
        &mut cross_store,
        &mut cross_host,
        cross_root,
        &cross_source,
        RootElementHandle::from_raw(86_620),
        cross_child,
    );
    let mut other_fixture = function_component_single_child_commit_fixture(
        &mut cross_store,
        &mut cross_host,
        other_root,
        &cross_source,
        RootElementHandle::from_raw(86_630),
        other_child,
    );
    let cross_operations_before_execute = cross_host.operations();

    let cross_error = execute_function_component_single_child_host_mutation_for_canary(
        &mut cross_store,
        &mut cross_host,
        cross_fixture.render,
        cross_fixture.function_component,
        cross_fixture.single_child,
        cross_fixture.complete_work,
        cross_fixture.finished_work_handoff.commit(),
        &mut other_fixture.host_work,
    )
    .unwrap_err();

    assert_eq!(
        cross_error,
        HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedRootOwnership {
            expected_root: cross_root,
            actual_root: other_root,
        }
    );
    assert_eq!(cross_host.operations(), cross_operations_before_execute);
}

#[test]
fn root_work_loop_use_state_dispatch_renders_function_host_text_and_commits_metadata() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let child_element = source.insert_text("state text commit");
    let root_current = store.root(root_id).unwrap().current();
    let (function_current, function_work_in_progress, component) =
        attach_function_component_current_child_with_work_pair(&mut store, root_id);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(function_current, StateHandle::from_raw(700))
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver = TestHostTreeFunctionOutputResolver::new(&source);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    let rescheduled = hook_store
        .dispatch_state_update_and_reschedule_root(
            &mut store,
            FunctionComponentStateDispatchRequest::new(current_state.dispatch(), action(701), lane),
        )
        .unwrap();

    assert_eq!(rescheduled.root(), root_id);
    assert_eq!(rescheduled.dispatch().fiber(), function_current);
    assert_eq!(rescheduled.dispatch().queue(), current_state.queue());
    assert_eq!(rescheduled.dispatch().dispatch(), current_state.dispatch());
    assert_eq!(rescheduled.reschedule().fiber(), function_current);
    assert_eq!(rescheduled.scheduled().root(), root_id);
    assert!(rescheduled.scheduled().inserted());
    assert!(rescheduled.scheduled().microtask().is_some());
    assert!(
        store
            .fiber_arena()
            .get(function_current)
            .unwrap()
            .lanes()
            .contains_lane(Lane::DEFAULT)
    );
    assert!(
        store
            .fiber_arena()
            .get(function_work_in_progress)
            .unwrap()
            .lanes()
            .contains_lane(Lane::DEFAULT)
    );
    assert!(
        store
            .fiber_arena()
            .get(root_current)
            .unwrap()
            .child_lanes()
            .contains_lane(Lane::DEFAULT)
    );
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_lane(Lane::DEFAULT)
    );

    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    assert_eq!(processed.records().len(), 1);
    assert_eq!(processed.records()[0].root(), root_id);
    assert_eq!(processed.records()[0].next_lanes(), Lanes::DEFAULT);
    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    let callback = processed.records()[0].scheduled_callback().unwrap();
    let callback_render = render_host_root_via_scheduler_callback(
        &mut store,
        root_id,
        callback.node(),
        Lanes::DEFAULT,
    )
    .unwrap();
    assert_eq!(
        callback_render.status(),
        SchedulerCallbackRenderStatus::Rendered
    );
    assert_eq!(callback_render.validation().root(), root_id);
    let render = callback_render.render_phase().unwrap();
    assert_eq!(render.root(), root_id);
    assert_eq!(render.current(), root_current);
    assert_eq!(render.render_lanes(), Lanes::DEFAULT);
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
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.original_root_element(), render.resulting_element());
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
        StateHandle::from_raw(700)
    );
    assert_eq!(state_update.memoized_state(), StateHandle::from_raw(701));
    assert_eq!(state_update.applied_update_count(), 1);
    assert_eq!(state_update.skipped_update_count(), 0);
    assert_eq!(state_update.remaining_lanes(), Lanes::NO);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_state.queue())
            .unwrap(),
        Vec::<fast_react_core::HookUpdateId>::new()
    );
    assert_eq!(record.single_child().child_tag(), FiberTag::HostText);
    assert_eq!(record.single_child().child_element(), child_element);
    assert_eq!(
        record.complete_work().root_child_tag(),
        Some(FiberTag::FunctionComponent)
    );
    assert_eq!(
        record.complete_work().completed_child_tag(),
        Some(FiberTag::HostText)
    );
    assert_eq!(record.complete_work().detached_text_count(), 1);
    assert_eq!(record.complete_work().detached_instance_count(), 0);

    let finished_work_handoff = record.finished_work_handoff();
    assert_eq!(finished_work_handoff.pending().root(), root_id);
    assert_eq!(
        finished_work_handoff.pending().finished_work(),
        render.finished_work()
    );
    assert_eq!(
        finished_work_handoff.pending().finished_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(
        finished_work_handoff.execution_request().finished_work(),
        render.finished_work()
    );
    assert!(finished_work_handoff.consumed_finished_work_record());
    assert!(finished_work_handoff.mutation_execution_blocked());
    assert!(finished_work_handoff.public_root_rendering_blocked());
    assert!(finished_work_handoff.effects_refs_and_hydration_blocked());
    assert_eq!(record.commit().root(), root_id);
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
        FiberTag::HostText,
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
    assert_eq!(diagnostics[0].tag(), FiberTag::HostText);
    assert_eq!(diagnostics[0].tag_name(), "HostText");
    assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
    assert_eq!(diagnostics[0].sibling_status(), "append");
    assert_eq!(diagnostics[0].sibling(), None);
    assert_eq!(diagnostics[0].sibling_tag(), None);
    assert!(!diagnostics[0].can_insert_before());
    assert_eq!(
        store.fiber_arena().get(completed_child).unwrap().tag(),
        FiberTag::HostText
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.work_in_progress()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .render_exit_status(),
        RootRenderExitStatus::NoWork
    );
    assert_eq!(
        host.operations(),
        vec![
            "root_host_context",
            "create_text_instance",
            "append_child_to_container"
        ]
    );

    let public_error = crate::render_mutation_placeholder(&mut host).unwrap_err();
    assert_eq!(
        public_error,
        ReconcilerError::unimplemented(MUTATION_RENDER_PLACEHOLDER_FEATURE)
    );
}

#[test]
fn root_work_loop_use_reducer_dispatch_renders_function_host_child_and_commits_metadata() {
    let mut source = TestHostTree::new();
    let host_text = source.insert_text("reducer text commit");
    let host_component = source.insert_host_element_with_text("section", "reducer host commit");

    for (
        expected_tag,
        child_element,
        initial_state,
        action_handle,
        previous_reducer,
        next_reducer,
    ) in [
        (
            FiberTag::HostText,
            host_text,
            StateHandle::from_raw(800),
            action(8),
            reducer(801),
            reducer(802),
        ),
        (
            FiberTag::HostComponent,
            host_component,
            StateHandle::from_raw(900),
            action(9),
            reducer(901),
            reducer(902),
        ),
    ] {
        let (mut store, root_id, mut host) = root_store();
        let root_current = store.root(root_id).unwrap().current();
        let (function_current, function_work_in_progress, component) =
            attach_function_component_current_child_with_work_pair(&mut store, root_id);
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let current_reducer = hook_store
            .create_current_reducer_hook(function_current, previous_reducer, initial_state)
            .unwrap();
        let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver = TestHostTreeFunctionOutputResolver::new(&source);
        let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

        let rescheduled = hook_store
            .dispatch_reducer_update_and_reschedule_root(
                &mut store,
                FunctionComponentReducerDispatchRequest::new(
                    current_reducer.dispatch(),
                    action_handle,
                    lane,
                ),
            )
            .unwrap();

        assert_eq!(rescheduled.root(), root_id);
        assert_eq!(rescheduled.dispatch().fiber(), function_current);
        assert_eq!(rescheduled.dispatch().queue(), current_reducer.queue());
        assert_eq!(
            rescheduled.dispatch().dispatch(),
            current_reducer.dispatch()
        );
        assert_eq!(rescheduled.dispatch().reducer(), previous_reducer);
        assert_eq!(rescheduled.reschedule().fiber(), function_current);
        assert_eq!(rescheduled.scheduled().root(), root_id);
        assert!(rescheduled.scheduled().inserted());
        assert!(rescheduled.scheduled().microtask().is_some());
        assert!(
            store
                .fiber_arena()
                .get(function_current)
                .unwrap()
                .lanes()
                .contains_lane(Lane::DEFAULT)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        assert_eq!(processed.records().len(), 1);
        let callback = processed.records()[0].scheduled_callback().unwrap();
        let callback_render = render_host_root_via_scheduler_callback(
            &mut store,
            root_id,
            callback.node(),
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(
            callback_render.status(),
            SchedulerCallbackRenderStatus::Rendered
        );
        let render = callback_render.render_phase().unwrap();
        assert_eq!(render.root(), root_id);
        assert_eq!(render.current(), root_current);
        assert_eq!(render.render_lanes(), Lanes::DEFAULT);
        store
            .fiber_arena_mut()
            .set_children(render.work_in_progress(), &[function_work_in_progress])
            .unwrap();

        let reducer_request = FunctionComponentUseReducerRenderRequest::new(
            next_reducer,
            StateHandle::from_raw(999),
            FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT),
        );
        let mut reducer_calls = 0;
        let record =
            handoff_completed_function_component_use_reducer_single_child_to_test_complete_work_and_commit(
                &mut store,
                &mut host,
                render,
                &source,
                &mut hook_store,
                reducer_request,
                &mut registry,
                &resolver,
                |state, action| {
                    reducer_calls += 1;
                    StateHandle::from_raw(state.raw() + action.raw())
                },
            )
            .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.original_root_element(), render.resulting_element());
        assert_eq!(record.function_component(), function_work_in_progress);
        assert_eq!(
            record.use_reducer_render().current(),
            Some(function_current)
        );
        assert_eq!(
            record.use_reducer_render().work_in_progress(),
            function_work_in_progress
        );
        assert_eq!(record.use_reducer_render().output(), output);
        let reducer_update = record
            .use_reducer_render()
            .reducer_hook()
            .update_record()
            .unwrap();
        assert_eq!(reducer_update.reducer(), next_reducer);
        assert_eq!(reducer_update.previous_memoized_state(), initial_state);
        assert_eq!(
            reducer_update.memoized_state(),
            StateHandle::from_raw(initial_state.raw() + action_handle.raw())
        );
        assert_eq!(reducer_update.remaining_lanes(), Lanes::NO);
        assert_eq!(reducer_update.applied_update_count(), 1);
        assert_eq!(reducer_update.skipped_update_count(), 0);
        assert_eq!(reducer_calls, 1);
        assert_eq!(record.single_child().child_tag(), expected_tag);
        assert_eq!(record.single_child().child_element(), child_element);
        assert_eq!(
            record.complete_work().root_child_tag(),
            Some(FiberTag::FunctionComponent)
        );
        assert_eq!(
            record.complete_work().completed_child_tag(),
            Some(expected_tag)
        );
        assert_eq!(record.complete_work().completed_child_count(), 1);
        assert_eq!(record.finished_work_handoff().pending().root(), root_id);
        assert_eq!(
            record.finished_work_handoff().pending().finished_work(),
            render.finished_work()
        );
        assert!(
            record
                .finished_work_handoff()
                .consumed_finished_work_record()
        );
        assert!(record.finished_work_handoff().mutation_execution_blocked());
        assert!(
            record
                .finished_work_handoff()
                .public_root_rendering_blocked()
        );
        assert!(
            record
                .finished_work_handoff()
                .effects_refs_and_hydration_blocked()
        );
        assert_eq!(record.commit().root(), root_id);
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
            expected_tag,
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
        assert_eq!(diagnostics[0].tag(), expected_tag);
        assert_eq!(
            diagnostics[0].tag_name(),
            match expected_tag {
                FiberTag::HostText => "HostText",
                FiberTag::HostComponent => "HostComponent",
                _ => unreachable!("test only covers HostText and HostComponent"),
            }
        );
        assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
        assert_eq!(diagnostics[0].sibling_status(), "append");
        assert_eq!(diagnostics[0].sibling(), None);
        assert_eq!(diagnostics[0].sibling_tag(), None);
        assert!(!diagnostics[0].can_insert_before());
        assert_eq!(
            store.fiber_arena().get(completed_child).unwrap().tag(),
            expected_tag
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.work_in_progress()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
        assert_eq!(registry.calls().len(), 1);
        assert_eq!(
            hook_store
                .state_queues()
                .pending_updates(current_reducer.queue())
                .unwrap(),
            Vec::<fast_react_core::HookUpdateId>::new()
        );
        let queue = hook_store
            .state_queues()
            .queue(current_reducer.queue())
            .unwrap();
        assert_eq!(
            queue.last_rendered_reducer().copied(),
            Some(FunctionComponentStateReducerId::Reducer(next_reducer))
        );
        assert_eq!(
            *queue.last_rendered_state(),
            StateHandle::from_raw(initial_state.raw() + action_handle.raw())
        );
        let expected_operations = match expected_tag {
            FiberTag::HostText => vec![
                "root_host_context",
                "create_text_instance",
                "append_child_to_container",
            ],
            FiberTag::HostComponent => vec![
                "root_host_context",
                "child_host_context",
                "should_set_text_content",
                "create_text_instance",
                "create_instance",
                "append_initial_child",
                "finalize_initial_children",
                "append_child_to_container",
            ],
            _ => unreachable!("test only covers HostText and HostComponent"),
        };
        assert_eq!(host.operations(), expected_operations);
    }
}

#[test]
fn root_work_loop_use_reducer_transition_lane_rebase_then_commit() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let child_element = source.insert_text("transition reducer commit");
    let root_current = store.root(root_id).unwrap().current();
    let (function_current, function_work_in_progress, component) =
        attach_function_component_current_child_with_work_pair(&mut store, root_id);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = FunctionComponentReducerHandle::from_raw(1_203);
    let current_reducer = hook_store
        .create_current_reducer_hook(function_current, reducer_id, StateHandle::from_raw(1_300))
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver = TestHostTreeFunctionOutputResolver::new(&source);
    let transition_lanes = Lanes::from(Lane::TRANSITION_1);
    let transition_lane = HookUpdateLane::from_lane(Lane::TRANSITION_1).unwrap();
    let dispatch_request = FunctionComponentReducerDispatchRequest::new(
        current_reducer.dispatch(),
        action(23),
        transition_lane,
    );

    let rescheduled = hook_store
        .dispatch_reducer_update_and_reschedule_root(&mut store, dispatch_request)
        .unwrap();

    assert_eq!(rescheduled.root(), root_id);
    assert_eq!(rescheduled.dispatch().fiber(), function_current);
    assert_eq!(rescheduled.dispatch().queue(), current_reducer.queue());
    assert_eq!(rescheduled.dispatch().reducer(), reducer_id);
    assert_eq!(rescheduled.dispatch().lane(), transition_lane);
    assert_eq!(rescheduled.reschedule().lane(), Lane::TRANSITION_1);
    assert_eq!(rescheduled.scheduled().root(), root_id);
    assert!(rescheduled.scheduled().inserted());
    assert!(rescheduled.scheduled().microtask().is_some());
    assert!(
        store
            .fiber_arena()
            .get(function_current)
            .unwrap()
            .lanes()
            .contains_lane(Lane::TRANSITION_1)
    );
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_lane(Lane::TRANSITION_1)
    );

    let skipped_render = render_function_component_with_use_reducer(
        store.fiber_arena_mut(),
        &mut hook_store,
        function_work_in_progress,
        Lanes::SYNC,
        FunctionComponentUseReducerRenderRequest::new(
            reducer_id,
            StateHandle::from_raw(9_999),
            FunctionComponentStateUpdateRenderLanes::new(Lanes::SYNC, Lanes::SYNC),
        ),
        &mut registry,
        |_, _| panic!("transition reducer update should skip during sync render"),
    )
    .unwrap();
    let skipped_update = skipped_render.reducer_hook().update_record().unwrap();

    assert_eq!(skipped_render.render_lanes(), Lanes::SYNC);
    assert_eq!(
        skipped_update.memoized_state(),
        StateHandle::from_raw(1_300)
    );
    assert_eq!(skipped_update.base_state(), StateHandle::from_raw(1_300));
    assert_eq!(skipped_update.remaining_lanes(), transition_lanes);
    assert_eq!(skipped_update.applied_update_count(), 0);
    assert_eq!(skipped_update.skipped_update_count(), 1);
    let skipped_base_tail = skipped_update.base_queue().unwrap();
    let rebased = hook_store
        .state_queues()
        .update_ring(Some(skipped_base_tail))
        .unwrap();
    assert_eq!(rebased.len(), 1);
    let rebased_update = hook_store.state_queues().update(rebased[0]).unwrap();
    assert_eq!(rebased_update.lane(), transition_lane);
    assert_eq!(*rebased_update.action(), action(23));
    hook_store.bind_current_list_unchecked(
        function_current,
        skipped_render.hook_state().work_in_progress_list(),
    );

    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    assert_eq!(processed.records().len(), 1);
    assert_eq!(processed.records()[0].root(), root_id);
    assert_eq!(processed.records()[0].next_lanes(), transition_lanes);
    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    let callback = processed.records()[0].scheduled_callback().unwrap();
    let callback_render = render_host_root_via_scheduler_callback(
        &mut store,
        root_id,
        callback.node(),
        transition_lanes,
    )
    .unwrap();
    assert_eq!(
        callback_render.status(),
        SchedulerCallbackRenderStatus::Rendered
    );
    let render = callback_render.render_phase().unwrap();
    assert_eq!(render.root(), root_id);
    assert_eq!(render.current(), root_current);
    assert_eq!(render.render_lanes(), transition_lanes);
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[function_work_in_progress])
        .unwrap();

    let mut reducer_calls = 0;
    let record =
        handoff_completed_function_component_use_reducer_single_child_to_test_complete_work_and_commit(
            &mut store,
            &mut host,
            render,
            &source,
            &mut hook_store,
            FunctionComponentUseReducerRenderRequest::new(
                reducer_id,
                StateHandle::from_raw(9_999),
                FunctionComponentStateUpdateRenderLanes::new(
                    transition_lanes,
                    transition_lanes,
                ),
            ),
            &mut registry,
            &resolver,
            |state, action| {
                reducer_calls += 1;
                StateHandle::from_raw(state.raw() + action.raw())
            },
        )
        .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.function_component(), function_work_in_progress);
    assert_eq!(
        record.use_reducer_render().current(),
        Some(function_current)
    );
    assert_eq!(record.use_reducer_render().render_lanes(), transition_lanes);
    assert_eq!(record.use_reducer_render().output(), output);
    let accepted_update = record
        .use_reducer_render()
        .reducer_hook()
        .update_record()
        .unwrap();
    assert_eq!(
        accepted_update.previous_base_queue(),
        Some(skipped_base_tail)
    );
    assert_eq!(
        accepted_update.memoized_state(),
        StateHandle::from_raw(1_323)
    );
    assert_eq!(accepted_update.base_state(), StateHandle::from_raw(1_323));
    assert_eq!(accepted_update.base_queue(), None);
    assert_eq!(accepted_update.remaining_lanes(), Lanes::NO);
    assert_eq!(accepted_update.applied_update_count(), 1);
    assert_eq!(accepted_update.skipped_update_count(), 0);
    assert_eq!(reducer_calls, 1);
    assert_eq!(record.single_child().child_tag(), FiberTag::HostText);
    assert_eq!(record.single_child().child_element(), child_element);
    assert_eq!(
        record.finished_work_handoff().pending().finished_lanes(),
        transition_lanes
    );
    assert!(
        record
            .finished_work_handoff()
            .execution_request()
            .compatibility_claim_blocked()
    );
    assert!(
        record
            .finished_work_handoff()
            .public_root_rendering_blocked()
    );
    assert!(record.public_render_blocked());
    assert_eq!(record.commit().root(), root_id);
    assert_eq!(record.commit().previous_current(), root_current);
    assert_eq!(record.commit().current(), render.work_in_progress());
    assert_eq!(record.commit().finished_lanes(), transition_lanes);
    assert_eq!(record.commit().pending_lanes(), Lanes::NO);
    let completed_child = record.complete_work().completed_child().unwrap();
    assert_single_function_component_container_append(
        record.host_mutation_apply(),
        root_id,
        render.work_in_progress(),
        completed_child,
        FiberTag::HostText,
    );
    assert!(record.private_test_host_mutation_executed());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.work_in_progress()
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(registry.calls().len(), 2);
    assert_eq!(
        host.operations(),
        vec![
            "root_host_context",
            "create_text_instance",
            "append_child_to_container"
        ]
    );
}

#[test]
fn root_work_loop_use_reducer_single_host_update_executes_host_work() {
    let mut source = TestHostTree::new();
    let updated_text = source.insert_text("reducer text update");
    let updated_component =
        source.insert_host_element_with_text("section", "reducer component update");

    for (child_element, previous_props, initial_state, action_handle, reducer_id) in [
        (
            updated_text,
            PropsHandle::from_raw(9_001),
            StateHandle::from_raw(1_000),
            action(11),
            reducer(1_101),
        ),
        (
            updated_component,
            PropsHandle::from_raw(9_002),
            StateHandle::from_raw(2_000),
            action(12),
            reducer(1_102),
        ),
    ] {
        let (expected_tag, element_type, next_props, expected_update_kind) =
            match source.root(child_element).unwrap() {
                TestHostNode::Text(text) => (
                    FiberTag::HostText,
                    ElementTypeHandle::NONE,
                    text.props(),
                    HostRootMutationApplyRecordKind::CommitHostTextUpdate,
                ),
                TestHostNode::Element(element) => (
                    FiberTag::HostComponent,
                    element.element_type(),
                    element.props(),
                    HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
                ),
            };
        let (mut store, root_id, mut host) = root_store();
        let root_current = store.root(root_id).unwrap().current();
        let (function_current, function_work_in_progress, component) =
            attach_function_component_current_child_with_work_pair(&mut store, root_id);
        let current_child = attach_current_single_host_child(
            &mut store,
            function_current,
            expected_tag,
            previous_props,
            element_type,
            StateNodeHandle::NONE,
        );
        let mut detached_hosts = DetachedHostRecords::new_for_canary();
        let state_node = match source.root(child_element).unwrap() {
            TestHostNode::Text(_) => create_detached_test_host_text_for_existing_fiber_for_canary(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                current_child,
                "previous reducer text update",
                previous_props,
            )
            .unwrap(),
            TestHostNode::Element(element) => {
                create_detached_test_host_component_for_existing_fiber_for_canary(
                    &mut store,
                    &mut host,
                    &mut detached_hosts,
                    root_id,
                    current_child,
                    element.ty(),
                    previous_props,
                    &[],
                )
                .unwrap()
            }
        };
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let current_reducer = hook_store
            .create_current_reducer_hook(function_current, reducer_id, initial_state)
            .unwrap();
        let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver = TestHostTreeFunctionOutputResolver::new(&source);
        let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
        let rescheduled = hook_store
            .dispatch_reducer_update_and_reschedule_root(
                &mut store,
                FunctionComponentReducerDispatchRequest::new(
                    current_reducer.dispatch(),
                    action_handle,
                    lane,
                ),
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

        let mut reducer_calls = 0;
        let record = handoff_completed_function_component_use_reducer_single_host_update_to_commit(
            &mut store,
            &mut host,
            render,
            &source,
            detached_hosts,
            rescheduled,
            &mut hook_store,
            FunctionComponentUseReducerRenderRequest::new(
                reducer_id,
                StateHandle::from_raw(999),
                FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT),
            ),
            &mut registry,
            &resolver,
            |state, action| {
                reducer_calls += 1;
                StateHandle::from_raw(state.raw() + action.raw())
            },
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.original_root_element(), render.resulting_element());
        assert_eq!(record.function_component(), function_work_in_progress);
        assert_eq!(
            record.use_reducer_render().current(),
            Some(function_current)
        );
        assert_eq!(record.use_reducer_render().output(), output);
        assert_eq!(record.hook_evidence().root(), root_id);
        assert_eq!(record.hook_evidence().current(), function_current);
        assert_eq!(
            record.hook_evidence().work_in_progress(),
            function_work_in_progress
        );
        assert_eq!(record.hook_evidence().queue(), current_reducer.queue());
        assert_eq!(
            record.hook_evidence().dispatch(),
            current_reducer.dispatch()
        );
        assert_eq!(record.hook_evidence().dispatch_lane(), lane);
        assert_eq!(record.hook_evidence().render_lanes(), Lanes::DEFAULT);
        assert_eq!(record.hook_evidence().applied_update_count(), 1);
        assert_eq!(record.hook_evidence().skipped_update_count(), 0);
        assert!(!record.hook_evidence().public_hook_compatibility_claimed());
        let reducer_update = record
            .use_reducer_render()
            .reducer_hook()
            .update_record()
            .unwrap();
        assert_eq!(
            reducer_update.memoized_state(),
            StateHandle::from_raw(initial_state.raw() + action_handle.raw())
        );
        assert_eq!(reducer_update.remaining_lanes(), Lanes::NO);
        assert_eq!(reducer_update.applied_update_count(), 1);
        assert_eq!(reducer_update.skipped_update_count(), 0);
        assert_eq!(reducer_calls, 1);

        let single_child = record.single_child_update();
        assert_eq!(single_child.function_component(), function_work_in_progress);
        assert_eq!(single_child.current(), function_current);
        assert_eq!(single_child.current_child(), current_child);
        assert_eq!(single_child.output(), output);
        assert_eq!(single_child.child_element(), child_element);
        assert_eq!(single_child.child_tag(), expected_tag);
        assert_eq!(single_child.child_element_type(), element_type);
        assert_eq!(single_child.previous_child_props(), previous_props);
        assert_eq!(single_child.child_props(), next_props);
        assert_eq!(single_child.render_lanes(), Lanes::DEFAULT);

        let updated_child = single_child.work_in_progress_child();
        let updated_child_node = store.fiber_arena().get(updated_child).unwrap();
        assert_eq!(updated_child_node.alternate(), Some(current_child));
        assert_eq!(
            updated_child_node.return_fiber(),
            Some(function_work_in_progress)
        );
        assert_eq!(updated_child_node.tag(), expected_tag);
        assert_eq!(updated_child_node.state_node(), state_node);
        assert_eq!(updated_child_node.pending_props(), next_props);
        assert_eq!(updated_child_node.memoized_props(), next_props);
        assert!(updated_child_node.flags().contains_all(FiberFlags::UPDATE));
        assert!(
            store
                .fiber_arena()
                .get(function_work_in_progress)
                .unwrap()
                .subtree_flags()
                .contains_all(FiberFlags::UPDATE)
        );
        assert!(
            store
                .fiber_arena()
                .get(render.work_in_progress())
                .unwrap()
                .subtree_flags()
                .contains_all(FiberFlags::UPDATE)
        );
        assert_eq!(
            record.complete_work().root_child_tag(),
            Some(FiberTag::FunctionComponent)
        );
        assert_eq!(
            record.complete_work().completed_child(),
            Some(updated_child)
        );
        assert_eq!(
            record.complete_work().completed_child_tag(),
            Some(expected_tag)
        );
        assert_eq!(record.complete_work().completed_child_count(), 1);
        match expected_tag {
            FiberTag::HostText => {
                assert_eq!(record.complete_work().detached_text_count(), 1);
                assert_eq!(record.complete_work().detached_instance_count(), 0);
            }
            FiberTag::HostComponent => {
                assert_eq!(record.complete_work().detached_instance_count(), 1);
                assert_eq!(record.complete_work().detached_text_count(), 0);
            }
            _ => unreachable!("test only covers HostText and HostComponent"),
        }

        let pending_update = record.pending_host_update();
        assert_eq!(pending_update.root(), root_id);
        assert_eq!(pending_update.finished_work(), render.finished_work());
        assert_eq!(pending_update.mutation_record_count(), 1);
        assert_eq!(pending_update.host_update_record_count(), 1);
        assert_eq!(pending_update.fiber(), updated_child);
        assert_eq!(pending_update.alternate_fiber(), Some(current_child));
        assert_eq!(pending_update.state_node(), state_node);
        assert_eq!(pending_update.kind(), expected_update_kind);
        match expected_tag {
            FiberTag::HostText => {
                assert!(pending_update.is_host_text_content_update());
                assert!(!pending_update.is_host_component_props_update());
            }
            FiberTag::HostComponent => {
                assert!(pending_update.is_host_component_props_update());
                assert!(!pending_update.is_host_text_content_update());
            }
            _ => unreachable!("test only covers HostText and HostComponent"),
        }
        assert_eq!(record.committed_host_update(), pending_update);
        assert_eq!(record.host_execution().root(), root_id);
        assert_eq!(
            record.host_execution().finished_work(),
            render.finished_work()
        );
        assert_eq!(record.host_execution().source_handoff_order(), 1);
        assert_eq!(record.host_execution().commit_order(), 2);
        assert_eq!(
            record.host_execution().mutation(),
            pending_update.mutation()
        );
        assert_eq!(record.host_execution().payload().current(), current_child);
        assert_eq!(
            record.host_execution().payload().work_in_progress(),
            updated_child
        );
        assert_eq!(record.host_execution().payload().state_node(), state_node);
        assert_eq!(record.host_execution().applied_host_call_count(), 1);
        assert_eq!(record.host_execution().private_host_store_update_count(), 0);
        assert!(record.host_execution().test_host_commit_executed());
        assert!(!record.host_execution().react_dom_compatibility_claimed());
        assert!(
            !record
                .host_execution()
                .test_renderer_compatibility_claimed()
        );
        match expected_tag {
            FiberTag::HostText => {
                assert!(
                    record
                        .host_execution()
                        .payload()
                        .is_host_text_content_update()
                );
                assert_eq!(
                    record.host_execution().payload().host_text_old_text(),
                    Some("previous reducer text update")
                );
                assert_eq!(
                    record.host_execution().payload().host_text_new_text(),
                    Some("reducer text update")
                );
            }
            FiberTag::HostComponent => {
                assert!(
                    record
                        .host_execution()
                        .payload()
                        .is_host_component_props_update()
                );
                assert_eq!(
                    record.host_execution().payload().host_component_prop_name(),
                    Some("testHostProperty")
                );
            }
            _ => unreachable!("test only covers HostText and HostComponent"),
        }
        assert_eq!(record.commit().mutation_log().len(), 1);
        assert_eq!(record.commit().mutation_apply_log().len(), 1);
        assert_eq!(
            record.finished_work_handoff().pending().finished_work(),
            render.finished_work()
        );
        assert!(
            record
                .finished_work_handoff()
                .consumed_finished_work_record()
        );
        assert!(record.public_render_blocked());
        assert_eq!(record.commit().root(), root_id);
        assert_eq!(record.commit().previous_current(), root_current);
        assert_eq!(record.commit().current(), render.work_in_progress());
        assert_eq!(record.commit().finished_lanes(), Lanes::DEFAULT);
        assert_eq!(record.commit().pending_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.work_in_progress()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
    }
}
