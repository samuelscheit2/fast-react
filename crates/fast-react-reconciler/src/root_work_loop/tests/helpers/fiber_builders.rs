fn current_host_root_element(
    store: &FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) -> RootElementHandle {
    let current = store.root(root_id).unwrap().current();
    let state = store.fiber_arena().get(current).unwrap().memoized_state();
    store.host_root_states().get(state).unwrap().element()
}

fn scheduled_callback_node(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) -> RootSchedulerCallbackHandle {
    let result = update_container(store, root_id, RootElementHandle::from_raw(1), None).unwrap();
    ensure_root_is_scheduled(store, result.schedule()).unwrap();
    let processed = process_root_schedule_in_microtask(store).unwrap();

    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    store.root(root_id).unwrap().scheduling().callback_node()
}

fn scheduled_pinged_retry_callback(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) -> SchedulerCallbackRequest {
    let result = update_container(store, root_id, RootElementHandle::from_raw(1), None).unwrap();
    ensure_root_is_scheduled(store, result.schedule()).unwrap();
    let retry_lanes = Lanes::from(Lane::RETRY_1).merge_lane(Lane::RETRY_2);
    let retry_and_offscreen = retry_lanes.merge(Lanes::OFFSCREEN);
    {
        let lanes = store.root_mut(root_id).unwrap().lanes_mut();
        lanes.mark_updated(Lane::RETRY_1);
        lanes.mark_updated(Lane::RETRY_2);
        lanes.mark_updated(Lane::OFFSCREEN);
        lanes.mark_finished(RootFinishedLanes::new(Lanes::DEFAULT, retry_and_offscreen));
        lanes.mark_suspended(retry_and_offscreen, Lane::NO, true);
        lanes.mark_pinged(Lanes::from(Lane::RETRY_2));
    }
    let processed = process_root_schedule_in_microtask(store).unwrap();
    let record = processed.records()[0];

    assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
    assert_eq!(record.next_lanes(), Lanes::from(Lane::RETRY_2));
    record.scheduled_callback().unwrap()
}

fn schedule_retry_update(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    lane: Lane,
    element: RootElementHandle,
) -> UpdateId {
    let current = store.root(root_id).unwrap().current();
    let queue = store.ensure_host_root_update_queue(root_id).unwrap();
    let update = store.update_queues_mut().create_update(lane);
    store
        .update_queues_mut()
        .update_mut(update)
        .unwrap()
        .set_payload(RootUpdatePayload::new(element));

    let enqueued_root =
        enqueue_concurrent_host_root_update(store, current, queue, update, lane).unwrap();
    assert_eq!(enqueued_root, root_id);
    let finished = finish_queueing_concurrent_updates(store).unwrap();
    assert_eq!(finished.roots(), &[root_id]);

    update
}

fn attach_function_component_wip_child(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (FiberId, FiberId, FiberTypeHandle) {
    let current = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(501),
        FiberMode::NO,
    );
    let component = FiberTypeHandle::from_raw(601);
    store
        .fiber_arena_mut()
        .get_mut(current)
        .unwrap()
        .set_fiber_type(component);
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current, PropsHandle::from_raw(502))
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[work_in_progress])
        .unwrap();

    (current, work_in_progress, component)
}

fn attach_function_component_current_child_with_work_pair(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) -> (FiberId, FiberId, FiberTypeHandle) {
    let host_root_current = store.root(root_id).unwrap().current();
    let current = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(551),
        FiberMode::NO,
    );
    let component = FiberTypeHandle::from_raw(651);
    store
        .fiber_arena_mut()
        .get_mut(current)
        .unwrap()
        .set_fiber_type(component);
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current, PropsHandle::from_raw(552))
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_current, &[current])
        .unwrap();

    (current, work_in_progress, component)
}

fn attach_current_single_host_child(
    store: &mut FiberRootStore<RecordingHost>,
    function_current: FiberId,
    tag: FiberTag,
    props: PropsHandle,
    element_type: ElementTypeHandle,
    state_node: StateNodeHandle,
) -> FiberId {
    let child = store
        .fiber_arena_mut()
        .create_fiber(tag, None, props, FiberMode::NO);
    {
        let node = store.fiber_arena_mut().get_mut(child).unwrap();
        node.set_element_type(element_type);
        node.set_memoized_props(props);
        node.set_state_node(state_node);
    }
    store
        .fiber_arena_mut()
        .set_children(function_current, &[child])
        .unwrap();
    child
}

fn action(raw: u64) -> FunctionComponentStateActionHandle {
    FunctionComponentStateActionHandle::from_raw(raw)
}

fn reducer(raw: u64) -> FunctionComponentReducerHandle {
    FunctionComponentReducerHandle::from_raw(raw)
}

fn action_as_state(
    _state: StateHandle,
    action: &FunctionComponentStateActionHandle,
) -> StateHandle {
    StateHandle::from_raw(action.raw())
}

fn attach_context_provider_wip_child(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (FiberId, FiberId, FiberTypeHandle) {
    let provider = store.fiber_arena_mut().create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(801),
        FiberMode::NO,
    );
    let current = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(802),
        FiberMode::NO,
    );
    let component = FiberTypeHandle::from_raw(803);
    store
        .fiber_arena_mut()
        .get_mut(current)
        .unwrap()
        .set_fiber_type(component);
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current, PropsHandle::from_raw(804))
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(provider, &[work_in_progress])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[provider])
        .unwrap();

    (provider, work_in_progress, component)
}

fn attach_nested_context_provider_wip_child(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (FiberId, FiberId, FiberId, FiberTypeHandle) {
    let outer_provider = store.fiber_arena_mut().create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(821),
        FiberMode::NO,
    );
    let inner_provider = store.fiber_arena_mut().create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(822),
        FiberMode::NO,
    );
    let current = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(823),
        FiberMode::NO,
    );
    let component = FiberTypeHandle::from_raw(824);
    store
        .fiber_arena_mut()
        .get_mut(current)
        .unwrap()
        .set_fiber_type(component);
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current, PropsHandle::from_raw(825))
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(inner_provider, &[work_in_progress])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(outer_provider, &[inner_provider])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[outer_provider])
        .unwrap();

    (outer_provider, inner_provider, work_in_progress, component)
}

fn attach_nested_context_provider_two_consumer_wip_children(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (
    FiberId,
    FiberId,
    FiberId,
    FiberTypeHandle,
    FiberId,
    FiberTypeHandle,
) {
    let outer_provider = store.fiber_arena_mut().create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(841),
        FiberMode::NO,
    );
    let inner_provider = store.fiber_arena_mut().create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(842),
        FiberMode::NO,
    );
    let first_current = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(843),
        FiberMode::NO,
    );
    let first_component = FiberTypeHandle::from_raw(844);
    store
        .fiber_arena_mut()
        .get_mut(first_current)
        .unwrap()
        .set_fiber_type(first_component);
    let first_work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(first_current, PropsHandle::from_raw(845))
        .unwrap();
    let second_current = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(846),
        FiberMode::NO,
    );
    let second_component = FiberTypeHandle::from_raw(847);
    store
        .fiber_arena_mut()
        .get_mut(second_current)
        .unwrap()
        .set_fiber_type(second_component);
    let second_work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(second_current, PropsHandle::from_raw(848))
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(
            inner_provider,
            &[first_work_in_progress, second_work_in_progress],
        )
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(outer_provider, &[inner_provider])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[outer_provider])
        .unwrap();

    (
        outer_provider,
        inner_provider,
        first_work_in_progress,
        first_component,
        second_work_in_progress,
        second_component,
    )
}

fn context_value(raw: u64) -> ContextValueHandle {
    ContextValueHandle::from_raw(raw)
}

fn attach_wip_child_with_tag(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
    tag: FiberTag,
) -> FiberId {
    let child = store
        .fiber_arena_mut()
        .create_fiber(tag, None, PropsHandle::NONE, FiberMode::NO);
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[child])
        .unwrap();
    child
}

fn attach_portal_wip_child(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (FiberId, FiberId) {
    let portal = store.fiber_arena_mut().create_fiber(
        FiberTag::Portal,
        Some(ReactKey::from_normalized("portal-root")),
        PropsHandle::from_raw(701),
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .get_mut(portal)
        .unwrap()
        .set_state_node(StateNodeHandle::from_raw(702));
    let portal_child = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(703),
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .set_children(portal, &[portal_child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[portal])
        .unwrap();

    (portal, portal_child)
}

fn attach_suspense_wip_child_with_primary_and_fallback(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (FiberId, FiberId, FiberId, FiberId, FiberId) {
    let suspense = store.fiber_arena_mut().create_fiber(
        FiberTag::Suspense,
        Some(ReactKey::from_normalized("boundary")),
        PropsHandle::from_raw(741),
        FiberMode::NO,
    );
    {
        let node = store.fiber_arena_mut().get_mut(suspense).unwrap();
        node.set_memoized_state(StateHandle::from_raw(742));
        node.set_update_queue(UpdateQueueHandle::from_raw(747));
    }
    let primary = store.fiber_arena_mut().create_fiber(
        FiberTag::Offscreen,
        None,
        PropsHandle::from_raw(743),
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .get_mut(primary)
        .unwrap()
        .set_update_queue(UpdateQueueHandle::from_raw(748));
    let primary_child = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(744),
        FiberMode::NO,
    );
    let fallback = store.fiber_arena_mut().create_fiber(
        FiberTag::Fragment,
        None,
        PropsHandle::from_raw(745),
        FiberMode::NO,
    );
    let fallback_child = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(746),
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .set_children(primary, &[primary_child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(fallback, &[fallback_child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(suspense, &[primary, fallback])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[suspense])
        .unwrap();

    (suspense, primary, primary_child, fallback, fallback_child)
}

fn attach_offscreen_wip_child_with_descendants(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (FiberId, FiberId, FiberId) {
    let offscreen = store.fiber_arena_mut().create_fiber(
        FiberTag::Offscreen,
        Some(ReactKey::from_normalized("hidden")),
        PropsHandle::from_raw(751),
        FiberMode::NO,
    );
    {
        let node = store.fiber_arena_mut().get_mut(offscreen).unwrap();
        node.set_memoized_props(PropsHandle::from_raw(752));
        node.set_memoized_state(StateHandle::from_raw(753));
        node.set_state_node(StateNodeHandle::from_raw(754));
        node.set_update_queue(UpdateQueueHandle::from_raw(757));
        node.merge_flags(FiberFlags::SCHEDULE_RETRY);
    }
    let first_child = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(755),
        FiberMode::NO,
    );
    let second_child = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(756),
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .set_children(offscreen, &[first_child, second_child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[offscreen])
        .unwrap();

    (offscreen, first_child, second_child)
}

fn attach_offscreen_reveal_wip_child(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
    child_tag: FiberTag,
) -> (FiberId, FiberId, FiberId, FiberId) {
    let previous = store.fiber_arena_mut().create_fiber(
        FiberTag::Offscreen,
        Some(ReactKey::from_normalized("reveal")),
        PropsHandle::from_raw(758),
        FiberMode::CONCURRENT,
    );
    {
        let node = store.fiber_arena_mut().get_mut(previous).unwrap();
        node.set_memoized_state(StateHandle::from_raw(759));
        node.set_lanes(Lanes::OFFSCREEN);
        node.set_child_lanes(Lanes::from(Lane::RETRY_1));
        node.set_state_node(StateNodeHandle::from_raw(760));
    }
    let offscreen = store
        .fiber_arena_mut()
        .create_work_in_progress(previous, PropsHandle::from_raw(761))
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(offscreen).unwrap();
        node.set_memoized_props(PropsHandle::from_raw(762));
        node.set_memoized_state(StateHandle::NONE);
        node.set_lanes(Lanes::DEFAULT);
        node.set_child_lanes(Lanes::from(Lane::TRANSITION_1));
        node.set_state_node(StateNodeHandle::from_raw(763));
    }
    let child = store.fiber_arena_mut().create_fiber(
        child_tag,
        None,
        PropsHandle::from_raw(764),
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .get_mut(child)
        .unwrap()
        .merge_flags(FiberFlags::PLACEMENT | FiberFlags::MAY_SUSPEND_COMMIT);
    store
        .fiber_arena_mut()
        .set_children(offscreen, &[child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[offscreen])
        .unwrap();

    (previous, offscreen, child, host_root_work_in_progress)
}

fn offscreen_begin_work_record_from_host_root_preflight(
    store: &mut FiberRootStore<RecordingHost>,
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
) -> UnsupportedOffscreenChildShapeRecord {
    let mut registry = TestFunctionComponentRegistry::default();
    match preflight_host_root_child_begin_work(
        store,
        root,
        host_root_work_in_progress,
        render_lanes,
        &mut registry,
    )
    .unwrap_err()
    {
        HostRootChildBeginWorkPreflightError::UnsupportedOffscreenChildShape {
            offscreen, ..
        } => {
            assert!(registry.calls().is_empty());
            *offscreen
        }
        other => panic!("expected Offscreen preflight blocker, got {other:?}"),
    }
}

fn attach_suspense_list_wip_child_with_rows(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (FiberId, FiberId, FiberId) {
    let suspense_list = store.fiber_arena_mut().create_fiber(
        FiberTag::SuspenseList,
        Some(ReactKey::from_normalized("rows")),
        PropsHandle::from_raw(761),
        FiberMode::NO,
    );
    {
        let node = store.fiber_arena_mut().get_mut(suspense_list).unwrap();
        node.set_memoized_props(PropsHandle::from_raw(762));
        node.set_memoized_state(StateHandle::from_raw(763));
    }
    let first_row = store.fiber_arena_mut().create_fiber(
        FiberTag::Suspense,
        None,
        PropsHandle::from_raw(764),
        FiberMode::NO,
    );
    let second_row = store.fiber_arena_mut().create_fiber(
        FiberTag::Suspense,
        None,
        PropsHandle::from_raw(765),
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .set_children(suspense_list, &[first_row, second_row])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[suspense_list])
        .unwrap();

    (suspense_list, first_row, second_row)
}

fn attach_activity_wip_child_with_primary(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (FiberId, FiberId, FiberId) {
    let activity = store.fiber_arena_mut().create_fiber(
        FiberTag::Activity,
        Some(ReactKey::from_normalized("activity")),
        PropsHandle::from_raw(771),
        FiberMode::NO,
    );
    {
        let node = store.fiber_arena_mut().get_mut(activity).unwrap();
        node.set_memoized_props(PropsHandle::from_raw(772));
        node.set_state_node(StateNodeHandle::from_raw(773));
    }
    let primary = store.fiber_arena_mut().create_fiber(
        FiberTag::Offscreen,
        None,
        PropsHandle::from_raw(774),
        FiberMode::NO,
    );
    let primary_child = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(775),
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .set_children(primary, &[primary_child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(activity, &[primary])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[activity])
        .unwrap();

    (activity, primary, primary_child)
}

fn attach_fragment_wip_child_with_descendant(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (FiberId, FiberId) {
    let fragment = store.fiber_arena_mut().create_fiber(
        FiberTag::Fragment,
        None,
        PropsHandle::from_raw(801),
        FiberMode::NO,
    );
    let fragment_child = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(802),
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .set_children(fragment, &[fragment_child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[fragment])
        .unwrap();

    (fragment, fragment_child)
}

fn attach_keyed_fragment_wip_child_with_descendant(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (FiberId, FiberId) {
    let fragment = store.fiber_arena_mut().create_fiber(
        FiberTag::Fragment,
        Some(ReactKey::from_normalized("fragment-key")),
        PropsHandle::from_raw(811),
        FiberMode::NO,
    );
    let fragment_child = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(812),
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .set_children(fragment, &[fragment_child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[fragment])
        .unwrap();

    (fragment, fragment_child)
}

fn attach_fragment_wip_child_with_tagged_descendant(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
    tag: FiberTag,
) -> (FiberId, FiberId) {
    let fragment = store.fiber_arena_mut().create_fiber(
        FiberTag::Fragment,
        None,
        PropsHandle::from_raw(821),
        FiberMode::NO,
    );
    let fragment_child =
        store
            .fiber_arena_mut()
            .create_fiber(tag, None, PropsHandle::from_raw(822), FiberMode::NO);
    store
        .fiber_arena_mut()
        .set_children(fragment, &[fragment_child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[fragment])
        .unwrap();

    (fragment, fragment_child)
}

fn attach_fragment_wip_child_with_two_host_descendants(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (FiberId, FiberId, FiberId) {
    let fragment = store.fiber_arena_mut().create_fiber(
        FiberTag::Fragment,
        None,
        PropsHandle::from_raw(831),
        FiberMode::NO,
    );
    let first = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(832),
        FiberMode::NO,
    );
    let sibling = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(833),
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .set_children(fragment, &[first, sibling])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[fragment])
        .unwrap();

    (fragment, first, sibling)
}

