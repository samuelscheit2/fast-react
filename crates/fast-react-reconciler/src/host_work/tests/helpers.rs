use super::*;

pub(super) fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId) {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    (store, root_id)
}
pub(super) fn render_test_root(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    element: RootElementHandle,
) -> HostRootRenderPhaseRecord {
    update_container(store, root_id, element, None).unwrap();
    render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap()
}
pub(super) fn text_from_root(source: &TestHostTree, element: RootElementHandle) -> &TestHostText {
    match source.root(element).unwrap() {
        TestHostNode::Text(text) => text,
        TestHostNode::Element(_) => panic!("expected text root"),
    }
}
pub(super) fn element_from_root(
    source: &TestHostTree,
    element: RootElementHandle,
) -> &TestHostElement {
    match source.root(element).unwrap() {
        TestHostNode::Element(element) => element,
        TestHostNode::Text(_) => panic!("expected host element root"),
    }
}
pub(super) fn first_text_child(element: &TestHostElement) -> &TestHostText {
    match element.children().first().unwrap() {
        TestHostNode::Text(text) => text,
        TestHostNode::Element(_) => panic!("expected host text child"),
    }
}
pub(super) fn callback(raw: u64) -> HookEffectCallbackHandle {
    HookEffectCallbackHandle::from_raw(raw)
}
pub(super) fn deps(raw: u64) -> HookEffectDependencies {
    HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
}
pub(super) fn attach_detached_root_instance_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    element: &TestHostElement,
    flags: FiberFlags,
) -> FiberId {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let fiber =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, element.props(), mode);
    let scope =
        issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::Instance)
            .unwrap();
    let token = FakeHostFiberToken(scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let mut instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &element.ty(),
            &(),
            &container,
            &(),
        )
        .unwrap();
    host.finalize_initial_children(&mut instance, &element.ty(), &(), &container, &())
        .unwrap();
    let state_node = detached_hosts.insert_instance(scope, instance);
    {
        let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
        node.set_element_type(element.element_type());
        node.set_flags(flags);
        node.set_state_node(state_node);
        node.set_memoized_props(element.props());
    }
    store
        .fiber_arena_mut()
        .set_children(host_root, &[fiber])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    fiber
}
pub(super) fn create_detached_root_text_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    text: &str,
    flags: FiberFlags,
) -> FiberId {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9001),
        mode,
    );
    let scope =
        issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::TextInstance)
            .unwrap();
    let token = FakeHostFiberToken(scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let text_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            text,
            &container,
            &(),
        )
        .unwrap();
    let state_node = detached_hosts.insert_text(scope, text_instance);
    {
        let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
        node.set_flags(flags);
        node.set_state_node(state_node);
        node.set_memoized_props(PropsHandle::from_raw(9001));
    }
    fiber
}
pub(super) fn attach_detached_root_text_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    text: &str,
    flags: FiberFlags,
) -> FiberId {
    let fiber = create_detached_root_text_for_commit(
        store,
        host,
        detached_hosts,
        root_id,
        host_root,
        text,
        flags,
    );
    store
        .fiber_arena_mut()
        .set_children(host_root, &[fiber])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    fiber
}
pub(super) fn stable_root_text_work_in_progress_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    current_text: FiberId,
    next_props: PropsHandle,
) -> FiberId {
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current_text, next_props)
        .unwrap();
    let node = store.fiber_arena_mut().get_mut(work_in_progress).unwrap();
    node.set_flags(FiberFlags::NO);
    node.set_lanes(Lanes::NO);
    node.set_memoized_props(next_props);
    work_in_progress
}
pub(super) fn update_root_component_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host_root: FiberId,
    current_component: FiberId,
    next_element: &TestHostElement,
    detached_hosts: &mut DetachedHostRecords,
) -> HostComponentUpdatePayload {
    let payload = update_test_host_component_work(
        store,
        root_id,
        current_component,
        next_element,
        Lanes::NO,
        detached_hosts,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[payload.work_in_progress()])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    payload
}
pub(super) fn assert_single_test_property_update(
    detached_hosts: &DetachedHostRecords,
    handle: StateNodeHandle,
    root_id: FiberRootId,
    current_component: FiberId,
    old_props: PropsHandle,
    new_props: PropsHandle,
) {
    assert_single_component_property_update(
        detached_hosts,
        handle,
        root_id,
        current_component,
        old_props,
        new_props,
        TestHostComponentPropertyPayloadKind::SafeTestProperty,
        TEST_HOST_SAFE_PROPERTY_PROP_NAME,
        TEST_HOST_SAFE_PROPERTY_NAME,
        HostNodePropertyUpdateExecution::CommitUpdate,
    );
}
#[allow(clippy::too_many_arguments)]
pub(super) fn assert_single_component_property_update(
    detached_hosts: &DetachedHostRecords,
    handle: StateNodeHandle,
    root_id: FiberRootId,
    current_component: FiberId,
    old_props: PropsHandle,
    new_props: PropsHandle,
    payload_kind: TestHostComponentPropertyPayloadKind,
    prop_name: &'static str,
    property_name: &'static str,
    execution: HostNodePropertyUpdateExecution,
) {
    let metadata = detached_hosts.instance_metadata(handle).unwrap();
    let updates = detached_hosts.instance_property_updates(handle).unwrap();
    assert_eq!(updates.len(), 1);
    assert_eq!(updates[0].sequence(), 0);
    assert_eq!(updates[0].store_order(), 0);
    assert_eq!(updates[0].handle(), handle);
    assert_eq!(updates[0].root_id(), root_id);
    assert_eq!(updates[0].fiber_id(), current_component);
    assert_eq!(updates[0].token_id(), metadata.token_id());
    assert_eq!(updates[0].phase(), metadata.phase());
    assert_eq!(updates[0].target(), HostFiberTokenTarget::Instance);
    assert_eq!(updates[0].source_currentness().handle(), handle);
    assert_eq!(updates[0].source_currentness().root_id(), root_id);
    assert_eq!(
        updates[0].source_currentness().fiber_id(),
        current_component
    );
    assert_eq!(
        updates[0].source_currentness().token_id(),
        metadata.token_id()
    );
    assert_eq!(updates[0].source_currentness().phase(), metadata.phase());
    assert_eq!(
        updates[0].source_currentness().target(),
        HostFiberTokenTarget::Instance
    );
    assert!(
        !updates[0]
            .source_currentness()
            .public_dom_compatibility_claimed()
    );
    assert_eq!(updates[0].payload_kind(), payload_kind.as_str());
    assert_eq!(updates[0].prop_name(), prop_name);
    assert_eq!(updates[0].property_name(), property_name);
    assert_eq!(updates[0].old_props(), old_props);
    assert_eq!(updates[0].new_props(), new_props);
    assert_eq!(updates[0].execution(), execution);
}
#[allow(clippy::too_many_arguments)]
pub(super) fn assert_single_latest_props_update_after_property_update(
    detached_hosts: &DetachedHostRecords,
    handle: StateNodeHandle,
    root_id: FiberRootId,
    current_component: FiberId,
    old_props: PropsHandle,
    new_props: PropsHandle,
    payload_kind: TestHostComponentPropertyPayloadKind,
    prop_name: &'static str,
) {
    let metadata = detached_hosts.instance_metadata(handle).unwrap();
    let property_updates = detached_hosts.instance_property_updates(handle).unwrap();
    let latest_props_updates = detached_hosts
        .instance_latest_props_updates(handle)
        .unwrap();
    assert_eq!(property_updates.len(), 1);
    assert_eq!(latest_props_updates.len(), 1);
    assert_eq!(latest_props_updates[0].sequence(), 0);
    assert_eq!(latest_props_updates[0].store_order(), 1);
    assert!(latest_props_updates[0].store_order() > property_updates[0].store_order());
    assert_eq!(latest_props_updates[0].handle(), handle);
    assert_eq!(latest_props_updates[0].root_id(), root_id);
    assert_eq!(latest_props_updates[0].fiber_id(), current_component);
    assert_eq!(latest_props_updates[0].token_id(), metadata.token_id());
    assert_eq!(latest_props_updates[0].phase(), metadata.phase());
    assert_eq!(
        latest_props_updates[0].target(),
        HostFiberTokenTarget::Instance
    );
    assert_eq!(
        latest_props_updates[0].source_currentness(),
        property_updates[0].source_currentness()
    );
    assert_eq!(
        latest_props_updates[0].source_currentness().handle(),
        handle
    );
    assert_eq!(
        latest_props_updates[0].source_currentness().root_id(),
        root_id
    );
    assert_eq!(
        latest_props_updates[0].source_currentness().fiber_id(),
        current_component
    );
    assert_eq!(
        latest_props_updates[0].source_currentness().token_id(),
        metadata.token_id()
    );
    assert_eq!(
        latest_props_updates[0].source_currentness().phase(),
        metadata.phase()
    );
    assert_eq!(
        latest_props_updates[0].source_currentness().target(),
        HostFiberTokenTarget::Instance
    );
    assert_eq!(
        latest_props_updates[0].payload_kind(),
        payload_kind.as_str()
    );
    assert_eq!(latest_props_updates[0].prop_name(), prop_name);
    assert_eq!(
        latest_props_updates[0].property_update_sequence(),
        property_updates[0].sequence()
    );
    assert_eq!(
        latest_props_updates[0].property_update_store_order(),
        property_updates[0].store_order()
    );
    assert_eq!(latest_props_updates[0].old_props(), old_props);
    assert_eq!(latest_props_updates[0].previous_latest_props(), None);
    assert_eq!(latest_props_updates[0].latest_props(), new_props);
    assert!(!latest_props_updates[0].public_dom_compatibility_claimed());
    assert_eq!(
        detached_hosts.instance_latest_props(handle).unwrap(),
        Some(new_props)
    );
}
pub(super) struct RootComponentUpdateApplyFixture {
    pub(super) store: FiberRootStore<RecordingHost>,
    pub(super) root_id: FiberRootId,
    pub(super) host: RecordingHost,
    pub(super) detached_hosts: DetachedHostRecords,
    pub(super) commit: HostRootCommitRecord,
    pub(super) payload: HostComponentUpdatePayload,
    pub(super) state_node: StateNodeHandle,
    pub(super) operations_before_apply: Vec<&'static str>,
    pub(super) token_count_before_apply: usize,
}
pub(super) fn root_component_update_apply_fixture() -> RootComponentUpdateApplyFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let state_node = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let payload = update_root_component_for_commit(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    let commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    RootComponentUpdateApplyFixture {
        store,
        root_id,
        host,
        detached_hosts,
        commit,
        payload,
        state_node,
        operations_before_apply,
        token_count_before_apply,
    }
}
pub(super) struct DangerousHtmlTextResetHandoffFixture {
    pub(super) store: FiberRootStore<RecordingHost>,
    pub(super) root_id: FiberRootId,
    pub(super) host: RecordingHost,
    pub(super) detached_hosts: DetachedHostRecords,
    pub(super) render: HostRootRenderPhaseRecord,
    pub(super) pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    pub(super) complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    pub(super) payload: HostComponentUpdatePayload,
    pub(super) state_node: StateNodeHandle,
    pub(super) previous_current: FiberId,
    pub(super) operations_before_apply: Vec<&'static str>,
    pub(super) token_count_before_apply: usize,
}
pub(super) fn dangerous_html_text_reset_handoff_fixture(
    payload_kind: HostComponentDangerousHtmlTextResetPayloadKindForCanary,
    handoff_order: usize,
) -> DangerousHtmlTextResetHandoffFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let state_node = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let render = render_test_root(&mut store, root_id, next_element);
    let payload = update_root_component_for_commit(
        &mut store,
        root_id,
        render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    let complete_work = host_component_dangerous_html_text_reset_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        payload.work_in_progress(),
        payload_kind,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
            .unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    DangerousHtmlTextResetHandoffFixture {
        store,
        root_id,
        host,
        detached_hosts,
        render,
        pending,
        complete_work,
        payload,
        state_node,
        previous_current,
        operations_before_apply,
        token_count_before_apply,
    }
}
pub(super) fn assert_component_property_payload_error(
    error: HostWorkError,
    root_id: FiberRootId,
    fiber: FiberId,
    prop_name: &'static str,
    violation: TestHostComponentPropertyPayloadViolation,
) {
    match error {
        HostWorkError::InvalidHostComponentPropertyUpdatePayload {
            root,
            fiber: actual_fiber,
            prop_name: actual_prop_name,
            violation: actual_violation,
        } => {
            assert_eq!(root, root_id);
            assert_eq!(actual_fiber, fiber);
            assert_eq!(actual_prop_name, prop_name);
            assert_eq!(actual_violation, violation);
        }
        other => panic!("expected invalid component property payload, got {other:?}"),
    }
}
pub(super) fn update_root_text_for_commit_with_payload(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host_root: FiberId,
    current_text: FiberId,
    next_text: &TestHostText,
    detached_hosts: &mut DetachedHostRecords,
) -> HostTextUpdateDiff {
    let diff = update_test_host_text_work(
        store,
        root_id,
        current_text,
        next_text,
        Lanes::NO,
        detached_hosts,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[diff.work_in_progress()])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    diff
}
pub(super) fn update_host_parent_text_for_commit_with_payload(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host_root: FiberId,
    current_parent: FiberId,
    current_text: FiberId,
    next_text: &TestHostText,
    detached_hosts: &mut DetachedHostRecords,
) -> (FiberId, HostTextUpdateDiff) {
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_node.state_node();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    let diff = update_test_host_text_work(
        store,
        root_id,
        current_text,
        next_text,
        Lanes::NO,
        detached_hosts,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[diff.work_in_progress()])
        .unwrap();
    complete_fiber_common(
        store,
        work_parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    (work_parent, diff)
}
#[allow(clippy::too_many_arguments)]
pub(super) fn update_host_parent_component_and_text_for_commit_with_payload(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host_root: FiberId,
    current_parent: FiberId,
    current_component: FiberId,
    current_text: FiberId,
    next_component: &TestHostElement,
    next_text: &TestHostText,
    detached_hosts: &mut DetachedHostRecords,
) -> (FiberId, HostComponentUpdatePayload, HostTextUpdateDiff) {
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_node.state_node();
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

    let payload = update_test_host_component_work(
        store,
        root_id,
        current_component,
        next_component,
        Lanes::NO,
        detached_hosts,
    )
    .unwrap();
    let diff = update_test_host_text_work(
        store,
        root_id,
        current_text,
        next_text,
        Lanes::NO,
        detached_hosts,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(payload.work_in_progress(), &[diff.work_in_progress()])
        .unwrap();
    complete_fiber_common(
        store,
        payload.work_in_progress(),
        next_component.props(),
        payload.state_node(),
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[payload.work_in_progress()])
        .unwrap();
    complete_fiber_common(
        store,
        work_parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    (work_parent, payload, diff)
}
pub(super) fn update_root_text_for_commit_without_payload(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    current_text: FiberId,
    next_props: PropsHandle,
) -> FiberId {
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current_text, next_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_in_progress).unwrap();
        node.set_flags(FiberFlags::UPDATE);
        node.set_memoized_props(next_props);
    }
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_in_progress])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    work_in_progress
}
pub(super) fn update_root_component_for_commit_without_payload(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    current_component: FiberId,
    next_props: PropsHandle,
) -> FiberId {
    let state_node = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .state_node();
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current_component, next_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_in_progress).unwrap();
        node.set_flags(FiberFlags::UPDATE);
        node.set_state_node(state_node);
        node.set_memoized_props(next_props);
    }
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_in_progress])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    work_in_progress
}
pub(super) fn attach_detached_root_element_with_text_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    text: &str,
) -> (FiberId, FiberId) {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let component = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9010),
        mode,
    );
    let text_fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9011),
        mode,
    );

    let text_scope = issue_creation_host_node_scope(
        store,
        root_id,
        text_fiber,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let text_token = FakeHostFiberToken(text_scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let text_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            text,
            &container,
            &(),
        )
        .unwrap();
    let text_state_node = detached_hosts.insert_text(text_scope, text_instance);
    complete_fiber_common(
        store,
        text_fiber,
        PropsHandle::from_raw(9011),
        text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let component_scope =
        issue_creation_host_node_scope(store, root_id, component, HostFiberTokenTarget::Instance)
            .unwrap();
    let component_token = FakeHostFiberToken(component_scope.token_id().raw());
    let mut instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &component_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"div",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut instance,
            root_id,
            store.fiber_arena().get(text_fiber).unwrap(),
        )
        .unwrap();
    let component_state_node = detached_hosts.insert_instance(component_scope, instance);
    store
        .fiber_arena_mut()
        .set_children(component, &[text_fiber])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(component).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    complete_fiber_common(
        store,
        component,
        PropsHandle::from_raw(9010),
        component_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    store
        .fiber_arena_mut()
        .set_children(host_root, &[component])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    (component, text_fiber)
}
pub(super) fn attach_detached_root_element_with_two_texts_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    first_text: &str,
    second_text: &str,
) -> (FiberId, FiberId, FiberId) {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let component = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9_060),
        mode,
    );
    let first_text_fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9_061),
        mode,
    );
    let second_text_fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9_062),
        mode,
    );
    let container = *store.root(root_id).unwrap().container_info();

    let first_scope = issue_creation_host_node_scope(
        store,
        root_id,
        first_text_fiber,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let first_token = FakeHostFiberToken(first_scope.token_id().raw());
    let first_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &first_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            first_text,
            &container,
            &(),
        )
        .unwrap();
    let first_state_node = detached_hosts.insert_text(first_scope, first_instance);
    complete_fiber_common(
        store,
        first_text_fiber,
        PropsHandle::from_raw(9_061),
        first_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let second_scope = issue_creation_host_node_scope(
        store,
        root_id,
        second_text_fiber,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let second_token = FakeHostFiberToken(second_scope.token_id().raw());
    let second_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &second_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            second_text,
            &container,
            &(),
        )
        .unwrap();
    let second_state_node = detached_hosts.insert_text(second_scope, second_instance);
    complete_fiber_common(
        store,
        second_text_fiber,
        PropsHandle::from_raw(9_062),
        second_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let component_scope =
        issue_creation_host_node_scope(store, root_id, component, HostFiberTokenTarget::Instance)
            .unwrap();
    let component_token = FakeHostFiberToken(component_scope.token_id().raw());
    let mut instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &component_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"section",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut instance,
            root_id,
            store.fiber_arena().get(first_text_fiber).unwrap(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut instance,
            root_id,
            store.fiber_arena().get(second_text_fiber).unwrap(),
        )
        .unwrap();
    let component_state_node = detached_hosts.insert_instance(component_scope, instance);
    store
        .fiber_arena_mut()
        .set_children(component, &[first_text_fiber, second_text_fiber])
        .unwrap();
    store
        .fiber_arena_mut()
        .get_mut(component)
        .unwrap()
        .set_flags(FiberFlags::PLACEMENT);
    complete_fiber_common(
        store,
        component,
        PropsHandle::from_raw(9_060),
        component_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[component])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    (component, first_text_fiber, second_text_fiber)
}
pub(super) fn reorder_existing_text_before_stable_host_sibling_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    current_parent: FiberId,
    current_moving_text: FiberId,
    current_stable_text: FiberId,
    stable_state_node_override: Option<StateNodeHandle>,
) -> (FiberId, FiberId, FiberId) {
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_node.state_node();
    let moving_node = store.fiber_arena().get(current_moving_text).unwrap();
    let moving_props = moving_node.memoized_props();
    let moving_state_node = moving_node.state_node();
    let stable_node = store.fiber_arena().get(current_stable_text).unwrap();
    let stable_props = stable_node.memoized_props();
    let stable_state_node = stable_state_node_override.unwrap_or(stable_node.state_node());

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
        .create_work_in_progress(current_moving_text, moving_props)
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
        .create_work_in_progress(current_stable_text, stable_props)
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
    complete_fiber_common(
        store,
        moving_work,
        moving_props,
        moving_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    complete_fiber_common(
        store,
        stable_work,
        stable_props,
        stable_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    complete_fiber_common(
        store,
        work_parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    (work_parent, moving_work, stable_work)
}
pub(super) struct DeletedHostSubtreePassiveCleanupFixture {
    pub(super) host_parent: FiberId,
    pub(super) host_parent_state_node: StateNodeHandle,
    pub(super) deleted_host: FiberId,
    pub(super) deleted_host_state_node: StateNodeHandle,
    pub(super) deleted_host_ref: RefHandle,
    pub(super) deleted_function: FiberId,
    pub(super) deleted_text: FiberId,
    pub(super) deleted_text_state_node: StateNodeHandle,
    pub(super) passive_create: HookEffectCallbackHandle,
    pub(super) passive_destroy: HookEffectCallbackHandle,
    pub(super) passive_dependencies: HookEffectDependencies,
}
pub(super) fn attach_detached_host_subtree_with_passive_cleanup_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    hook_store: &mut FunctionComponentHookRenderStore,
    text: &str,
) -> DeletedHostSubtreePassiveCleanupFixture {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let container = *store.root(root_id).unwrap().container_info();

    let deleted_text = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9_621),
        mode,
    );
    let deleted_text_scope = issue_creation_host_node_scope(
        store,
        root_id,
        deleted_text,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let deleted_text_token = FakeHostFiberToken(deleted_text_scope.token_id().raw());
    let deleted_text_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &deleted_text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            text,
            &container,
            &(),
        )
        .unwrap();
    let deleted_text_state_node =
        detached_hosts.insert_text(deleted_text_scope, deleted_text_instance);
    complete_fiber_common(
        store,
        deleted_text,
        PropsHandle::from_raw(9_621),
        deleted_text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let deleted_function = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(9_622),
        mode,
    );
    store
        .fiber_arena_mut()
        .get_mut(deleted_function)
        .unwrap()
        .set_fiber_type(FiberTypeHandle::from_raw(9_623));
    store
        .fiber_arena_mut()
        .set_children(deleted_function, &[deleted_text])
        .unwrap();
    let passive_create = callback(9_624);
    let passive_destroy = callback(9_625);
    let passive_dependencies = deps(9_626);
    hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            deleted_function,
            FunctionComponentEffectPhase::Passive,
            passive_create,
            passive_dependencies,
            Some(passive_destroy),
        )
        .unwrap();
    complete_function_component_parent(store, deleted_function).unwrap();

    let deleted_host = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9_627),
        mode,
    );
    let deleted_host_scope = issue_creation_host_node_scope(
        store,
        root_id,
        deleted_host,
        HostFiberTokenTarget::Instance,
    )
    .unwrap();
    let deleted_host_token = FakeHostFiberToken(deleted_host_scope.token_id().raw());
    let mut deleted_host_instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &deleted_host_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"article",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut deleted_host_instance,
            root_id,
            store.fiber_arena().get(deleted_text).unwrap(),
        )
        .unwrap();
    let deleted_host_state_node =
        detached_hosts.insert_instance(deleted_host_scope, deleted_host_instance);
    let deleted_host_ref = RefHandle::from_raw(9_628);
    store
        .fiber_arena_mut()
        .set_children(deleted_host, &[deleted_function])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(deleted_host).unwrap();
        node.set_ref_handle(deleted_host_ref);
    }
    complete_fiber_common(
        store,
        deleted_host,
        PropsHandle::from_raw(9_627),
        deleted_host_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let host_parent = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9_629),
        mode,
    );
    let host_parent_scope =
        issue_creation_host_node_scope(store, root_id, host_parent, HostFiberTokenTarget::Instance)
            .unwrap();
    let host_parent_token = FakeHostFiberToken(host_parent_scope.token_id().raw());
    let mut host_parent_instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &host_parent_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"section",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut host_parent_instance,
            root_id,
            store.fiber_arena().get(deleted_host).unwrap(),
        )
        .unwrap();
    let host_parent_state_node =
        detached_hosts.insert_instance(host_parent_scope, host_parent_instance);
    store
        .fiber_arena_mut()
        .set_children(host_parent, &[deleted_host])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(host_parent).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    complete_fiber_common(
        store,
        host_parent,
        PropsHandle::from_raw(9_629),
        host_parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    store
        .fiber_arena_mut()
        .set_children(host_root, &[host_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();

    DeletedHostSubtreePassiveCleanupFixture {
        host_parent,
        host_parent_state_node,
        deleted_host,
        deleted_host_state_node,
        deleted_host_ref,
        deleted_function,
        deleted_text,
        deleted_text_state_node,
        passive_create,
        passive_destroy,
        passive_dependencies,
    }
}
#[derive(Default)]
pub(super) struct RecordingDeletedSubtreeDestroyExecutor {
    pub(super) calls: Vec<PassiveEffectDestroyCallbackExecutionRequest>,
}
impl RecordingDeletedSubtreeDestroyExecutor {
    pub(super) fn calls(&self) -> &[PassiveEffectDestroyCallbackExecutionRequest] {
        &self.calls
    }
}
impl PassiveEffectDestroyCallbackExecutor for RecordingDeletedSubtreeDestroyExecutor {
    fn execute_destroy_callback(
        &mut self,
        request: PassiveEffectDestroyCallbackExecutionRequest,
    ) -> Result<(), PassiveEffectDestroyCallbackErrorHandle> {
        self.calls.push(request);
        Ok(())
    }
}
pub(super) fn delete_host_text_under_host_parent_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    current_parent: FiberId,
    current_text: FiberId,
) -> FiberId {
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, PropsHandle::from_raw(9020))
        .unwrap();
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, current_text)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    work_parent
}
pub(super) fn delete_host_component_under_host_parent_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    current_parent: FiberId,
    current_component: FiberId,
) -> FiberId {
    let parent_props = store
        .fiber_arena()
        .get(current_parent)
        .unwrap()
        .memoized_props();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_memoized_props(parent_props);
    }
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, current_component)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    work_parent
}
pub(super) fn wrap_current_host_child_in_deleted_root(
    store: &mut FiberRootStore<RecordingHost>,
    current_parent: FiberId,
    current_child: FiberId,
    wrapper_tag: FiberTag,
    wrapper_state_node: StateNodeHandle,
) -> FiberId {
    let mode = store.fiber_arena().get(current_parent).unwrap().mode();
    let wrapper =
        store
            .fiber_arena_mut()
            .create_fiber(wrapper_tag, None, PropsHandle::from_raw(9_080), mode);
    {
        let node = store.fiber_arena_mut().get_mut(wrapper).unwrap();
        node.set_state_node(wrapper_state_node);
        node.set_memoized_props(PropsHandle::from_raw(9_080));
    }
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(wrapper, &[current_child])
        .unwrap();
    complete_host_root(store, wrapper).unwrap();
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[wrapper])
        .unwrap();
    complete_host_root(store, current_parent).unwrap();
    wrapper
}
pub(super) fn delete_non_host_root_under_host_parent_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    current_parent: FiberId,
    deleted_root: FiberId,
    parent_state_node_override: Option<StateNodeHandle>,
) -> FiberId {
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_state_node_override.unwrap_or(parent_node.state_node());
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
    }
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, deleted_root)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    work_parent
}
pub(super) fn place_detached_text_under_existing_host_parent_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    current_parent: FiberId,
    text: &str,
) -> (FiberId, FiberId) {
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, PropsHandle::from_raw(9040))
        .unwrap();
    let mode = store.fiber_arena().get(work_parent).unwrap().mode();
    let text_fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9041),
        mode,
    );
    {
        let node = store.fiber_arena_mut().get_mut(text_fiber).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }

    let text_scope = issue_creation_host_node_scope(
        store,
        root_id,
        text_fiber,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let text_token = FakeHostFiberToken(text_scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let text_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            text,
            &container,
            &(),
        )
        .unwrap();
    let text_state_node = detached_hosts.insert_text(text_scope, text_instance);
    complete_fiber_common(
        store,
        text_fiber,
        PropsHandle::from_raw(9041),
        text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let parent_state_node = store.fiber_arena().get(work_parent).unwrap().state_node();
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[text_fiber])
        .unwrap();
    complete_fiber_common(
        store,
        work_parent,
        PropsHandle::from_raw(9040),
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();

    (work_parent, text_fiber)
}
pub(super) fn attach_detached_nested_root_element_with_text_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    text: &str,
) -> (FiberId, FiberId, FiberId) {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let outer = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9050),
        mode,
    );
    let inner = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9051),
        mode,
    );
    let text_fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9052),
        mode,
    );

    let container = *store.root(root_id).unwrap().container_info();
    let text_scope = issue_creation_host_node_scope(
        store,
        root_id,
        text_fiber,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let text_token = FakeHostFiberToken(text_scope.token_id().raw());
    let text_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            text,
            &container,
            &(),
        )
        .unwrap();
    let text_state_node = detached_hosts.insert_text(text_scope, text_instance);
    complete_fiber_common(
        store,
        text_fiber,
        PropsHandle::from_raw(9052),
        text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let inner_scope =
        issue_creation_host_node_scope(store, root_id, inner, HostFiberTokenTarget::Instance)
            .unwrap();
    let inner_token = FakeHostFiberToken(inner_scope.token_id().raw());
    let mut inner_instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &inner_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"label",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut inner_instance,
            root_id,
            store.fiber_arena().get(text_fiber).unwrap(),
        )
        .unwrap();
    let inner_state_node = detached_hosts.insert_instance(inner_scope, inner_instance);
    store
        .fiber_arena_mut()
        .set_children(inner, &[text_fiber])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(inner).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    complete_fiber_common(
        store,
        inner,
        PropsHandle::from_raw(9051),
        inner_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let outer_scope =
        issue_creation_host_node_scope(store, root_id, outer, HostFiberTokenTarget::Instance)
            .unwrap();
    let outer_token = FakeHostFiberToken(outer_scope.token_id().raw());
    let mut outer_instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &outer_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"section",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut outer_instance,
            root_id,
            store.fiber_arena().get(inner).unwrap(),
        )
        .unwrap();
    let outer_state_node = detached_hosts.insert_instance(outer_scope, outer_instance);
    store
        .fiber_arena_mut()
        .set_children(outer, &[inner])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(outer).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    complete_fiber_common(
        store,
        outer,
        PropsHandle::from_raw(9050),
        outer_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    store
        .fiber_arena_mut()
        .set_children(host_root, &[outer])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    (outer, inner, text_fiber)
}
pub(super) fn place_detached_text_under_existing_nested_host_parent_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    current_fibers: (FiberId, FiberId, FiberId),
    text: &str,
) -> (FiberId, FiberId, FiberId, FiberId) {
    let (current_outer, current_inner, current_text) = current_fibers;
    let outer_props = store
        .fiber_arena()
        .get(current_outer)
        .unwrap()
        .memoized_props();
    let inner_props = store
        .fiber_arena()
        .get(current_inner)
        .unwrap()
        .memoized_props();
    let text_props = store
        .fiber_arena()
        .get(current_text)
        .unwrap()
        .memoized_props();
    let outer_state_node = store.fiber_arena().get(current_outer).unwrap().state_node();
    let inner_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();

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
        .create_work_in_progress(current_inner, inner_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_inner).unwrap();
        node.set_state_node(inner_state_node);
        node.set_memoized_props(inner_props);
        node.set_lanes(Lanes::NO);
    }
    let stable_text = store
        .fiber_arena_mut()
        .create_work_in_progress(current_text, text_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(stable_text).unwrap();
        node.set_state_node(text_state_node);
        node.set_memoized_props(text_props);
        node.set_lanes(Lanes::NO);
    }

    let mode = store.fiber_arena().get(work_inner).unwrap().mode();
    let placed_text = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9053),
        mode,
    );
    {
        let node = store.fiber_arena_mut().get_mut(placed_text).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    let text_scope = issue_creation_host_node_scope(
        store,
        root_id,
        placed_text,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let text_token = FakeHostFiberToken(text_scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let text_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            text,
            &container,
            &(),
        )
        .unwrap();
    let placed_text_state_node = detached_hosts.insert_text(text_scope, text_instance);
    complete_fiber_common(
        store,
        placed_text,
        PropsHandle::from_raw(9053),
        placed_text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    store
        .fiber_arena_mut()
        .set_children(work_inner, &[stable_text, placed_text])
        .unwrap();
    complete_fiber_common(
        store,
        stable_text,
        text_props,
        text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    complete_fiber_common(
        store,
        work_inner,
        inner_props,
        inner_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(work_outer, &[work_inner])
        .unwrap();
    complete_fiber_common(
        store,
        work_outer,
        outer_props,
        outer_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_outer])
        .unwrap();
    complete_host_root(store, host_root).unwrap();

    (work_outer, work_inner, stable_text, placed_text)
}
pub(super) fn attach_detached_root_element_with_placed_text_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    text: &str,
) -> (FiberId, FiberId) {
    let (component, text_fiber) = attach_detached_root_element_with_text_for_commit(
        store,
        host,
        detached_hosts,
        root_id,
        host_root,
        text,
    );
    store
        .fiber_arena_mut()
        .get_mut(text_fiber)
        .unwrap()
        .merge_flags(FiberFlags::PLACEMENT);
    let component_state_node = store.fiber_arena().get(component).unwrap().state_node();
    complete_fiber_common(
        store,
        component,
        PropsHandle::from_raw(9010),
        component_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    complete_host_root(store, host_root).unwrap();
    (component, text_fiber)
}
pub(super) fn create_detached_host_component_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    mode_source: FiberId,
    ty: &'static str,
    props: PropsHandle,
    flags: FiberFlags,
) -> FiberId {
    let mode = store.fiber_arena().get(mode_source).unwrap().mode();
    let fiber = store
        .fiber_arena_mut()
        .create_fiber(FiberTag::HostComponent, None, props, mode);
    store
        .fiber_arena_mut()
        .get_mut(fiber)
        .unwrap()
        .set_flags(flags);

    let scope =
        issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::Instance)
            .unwrap();
    let token = FakeHostFiberToken(scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let mut instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &ty,
            &(),
            &container,
            &(),
        )
        .unwrap();
    host.finalize_initial_children(&mut instance, &ty, &(), &container, &())
        .unwrap();
    let state_node = detached_hosts.insert_instance(scope, instance);
    complete_fiber_common(
        store,
        fiber,
        props,
        state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    fiber
}
pub(super) fn place_detached_host_component_under_existing_host_parent_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    current_parent: FiberId,
    props: PropsHandle,
) -> (FiberId, FiberId) {
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_node.state_node();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
    }

    let child = create_detached_host_component_for_commit(
        store,
        host,
        detached_hosts,
        root_id,
        work_parent,
        "span",
        props,
        FiberFlags::PLACEMENT,
    );
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[child])
        .unwrap();
    complete_fiber_common(
        store,
        work_parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();

    (work_parent, child)
}
pub(super) fn attach_detached_root_host_component_with_child_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
) -> (FiberId, FiberId) {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let child_props = PropsHandle::from_raw(9_083);
    let child = create_detached_host_component_for_commit(
        store,
        host,
        detached_hosts,
        root_id,
        host_root,
        "span",
        child_props,
        FiberFlags::NO,
    );

    let parent_props = PropsHandle::from_raw(9_082);
    let parent =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
    let scope =
        issue_creation_host_node_scope(store, root_id, parent, HostFiberTokenTarget::Instance)
            .unwrap();
    let token = FakeHostFiberToken(scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let mut instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"section",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut instance,
            root_id,
            store.fiber_arena().get(child).unwrap(),
        )
        .unwrap();
    host.finalize_initial_children(&mut instance, &"section", &(), &container, &())
        .unwrap();
    let parent_state_node = detached_hosts.insert_instance(scope, instance);
    store
        .fiber_arena_mut()
        .set_children(parent, &[child])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(parent).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    complete_fiber_common(
        store,
        parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();

    (parent, child)
}
pub(super) fn attach_detached_root_host_component_with_two_children_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
) -> (FiberId, FiberId, FiberId) {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let order_sibling_props = PropsHandle::from_raw(9_085);
    let order_sibling = create_detached_host_component_for_commit(
        store,
        host,
        detached_hosts,
        root_id,
        host_root,
        "strong",
        order_sibling_props,
        FiberFlags::NO,
    );
    let child_props = PropsHandle::from_raw(9_086);
    let child = create_detached_host_component_for_commit(
        store,
        host,
        detached_hosts,
        root_id,
        host_root,
        "span",
        child_props,
        FiberFlags::NO,
    );

    let parent_props = PropsHandle::from_raw(9_087);
    let parent =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
    let scope =
        issue_creation_host_node_scope(store, root_id, parent, HostFiberTokenTarget::Instance)
            .unwrap();
    let token = FakeHostFiberToken(scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let mut instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"section",
            &(),
            &container,
            &(),
        )
        .unwrap();
    for child_fiber in [order_sibling, child] {
        detached_hosts
            .append_initial_child(
                store.host_tokens(),
                host,
                &mut instance,
                root_id,
                store.fiber_arena().get(child_fiber).unwrap(),
            )
            .unwrap();
    }
    host.finalize_initial_children(&mut instance, &"section", &(), &container, &())
        .unwrap();
    let parent_state_node = detached_hosts.insert_instance(scope, instance);
    store
        .fiber_arena_mut()
        .set_children(parent, &[order_sibling, child])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(parent).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    complete_fiber_common(
        store,
        parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();

    (parent, order_sibling, child)
}
pub(super) struct ManagedChildHostWorkHandoffFixture {
    pub(super) store: FiberRootStore<RecordingHost>,
    pub(super) root_id: FiberRootId,
    pub(super) host: RecordingHost,
    pub(super) detached_hosts: DetachedHostRecords,
    pub(super) render: HostRootRenderPhaseRecord,
    pub(super) pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    pub(super) complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    pub(super) current_parent: FiberId,
    pub(super) work_parent: FiberId,
    pub(super) child: FiberId,
    pub(super) parent_state_node: StateNodeHandle,
    pub(super) child_state_node: StateNodeHandle,
    pub(super) previous_current: FiberId,
    pub(super) operations_before_apply: Vec<&'static str>,
    pub(super) token_count_before_apply: usize,
}
pub(super) struct ManagedChildSiblingOrderHostWorkHandoffFixture {
    pub(super) store: FiberRootStore<RecordingHost>,
    pub(super) root_id: FiberRootId,
    pub(super) host: RecordingHost,
    pub(super) detached_hosts: DetachedHostRecords,
    pub(super) render: HostRootRenderPhaseRecord,
    pub(super) pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    pub(super) complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    pub(super) current_parent: FiberId,
    pub(super) work_parent: FiberId,
    pub(super) child: FiberId,
    pub(super) order_sibling: FiberId,
    pub(super) order_sibling_current: FiberId,
    pub(super) parent_state_node: StateNodeHandle,
    pub(super) child_state_node: StateNodeHandle,
    pub(super) order_sibling_state_node: StateNodeHandle,
    pub(super) previous_current: FiberId,
    pub(super) deletion_list: Option<DeletionListId>,
    pub(super) operations_before_apply: Vec<&'static str>,
    pub(super) token_count_before_apply: usize,
}
pub(super) fn managed_child_placement_host_work_handoff_fixture(
    handoff_order: usize,
) -> ManagedChildHostWorkHandoffFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let parent_element = source.insert_host_element_with_text("section", "ignored");
    let parent = element_from_root(&source, parent_element);
    let create_render = render_test_root(&mut store, root_id, parent_element);
    let current_parent = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        parent,
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

    let next_element = source.insert_host_element_with_text("section", "next");
    let render = render_test_root(&mut store, root_id, next_element);
    let (work_parent, child) = place_detached_host_component_under_existing_host_parent_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        render.finished_work(),
        current_parent,
        PropsHandle::from_raw(9_081),
    );
    let complete_work = host_component_managed_child_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        HostComponentManagedChildMutationKindForCanary::Placement,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
            .unwrap();
    let parent_state_node = store.fiber_arena().get(work_parent).unwrap().state_node();
    let child_state_node = store.fiber_arena().get(child).unwrap().state_node();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildHostWorkHandoffFixture {
        store,
        root_id,
        host,
        detached_hosts,
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        parent_state_node,
        child_state_node,
        previous_current,
        operations_before_apply,
        token_count_before_apply,
    }
}
pub(super) fn managed_child_placement_sibling_order_host_work_handoff_fixture(
    handoff_order: usize,
) -> ManagedChildSiblingOrderHostWorkHandoffFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(288));
    let (current_parent, order_sibling_current) =
        attach_detached_root_host_component_with_child_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
        );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(289));
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_node.state_node();
    let sibling_node = store.fiber_arena().get(order_sibling_current).unwrap();
    let order_sibling_props = sibling_node.memoized_props();
    let order_sibling_state_node = sibling_node.state_node();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
    }
    let child = create_detached_host_component_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        work_parent,
        "strong",
        PropsHandle::from_raw(9_084),
        FiberFlags::PLACEMENT,
    );
    let child_state_node = store.fiber_arena().get(child).unwrap().state_node();
    let order_sibling = store
        .fiber_arena_mut()
        .create_work_in_progress(order_sibling_current, order_sibling_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[child, order_sibling])
        .unwrap();
    complete_fiber_common(
        &mut store,
        order_sibling,
        order_sibling_props,
        order_sibling_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    complete_fiber_common(
        &mut store,
        work_parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    complete_host_root(&mut store, render.finished_work()).unwrap();

    let complete_work = host_component_managed_child_sibling_order_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        order_sibling,
        HostComponentManagedChildMutationKindForCanary::Placement,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
            .unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildSiblingOrderHostWorkHandoffFixture {
        store,
        root_id,
        host,
        detached_hosts,
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        order_sibling,
        order_sibling_current,
        parent_state_node,
        child_state_node,
        order_sibling_state_node,
        previous_current,
        deletion_list: None,
        operations_before_apply,
        token_count_before_apply,
    }
}
pub(super) fn managed_child_delete_sibling_order_host_work_handoff_fixture(
    handoff_order: usize,
) -> ManagedChildSiblingOrderHostWorkHandoffFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(290));
    let (current_parent, order_sibling_current, child) =
        attach_detached_root_host_component_with_two_children_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
        );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(291));
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_node.state_node();
    let order_sibling_node = store.fiber_arena().get(order_sibling_current).unwrap();
    let order_sibling_props = order_sibling_node.memoized_props();
    let order_sibling_state_node = order_sibling_node.state_node();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
    }
    let order_sibling = store
        .fiber_arena_mut()
        .create_work_in_progress(order_sibling_current, order_sibling_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[order_sibling])
        .unwrap();
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, child)
        .unwrap();
    complete_fiber_common(
        &mut store,
        order_sibling,
        order_sibling_props,
        order_sibling_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    complete_fiber_common(
        &mut store,
        work_parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    complete_host_root(&mut store, render.finished_work()).unwrap();

    let complete_work = host_component_managed_child_sibling_order_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        order_sibling,
        HostComponentManagedChildMutationKindForCanary::DeleteDetach,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
            .unwrap();
    let child_state_node = store.fiber_arena().get(child).unwrap().state_node();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildSiblingOrderHostWorkHandoffFixture {
        store,
        root_id,
        host,
        detached_hosts,
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        order_sibling,
        order_sibling_current,
        parent_state_node,
        child_state_node,
        order_sibling_state_node,
        previous_current,
        deletion_list: Some(deletion_list),
        operations_before_apply,
        token_count_before_apply,
    }
}
pub(super) fn managed_child_delete_host_work_handoff_fixture(
    handoff_order: usize,
) -> ManagedChildHostWorkHandoffFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(188));
    let (current_parent, child) = attach_detached_root_host_component_with_child_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(189));
    let work_parent = delete_host_component_under_host_parent_for_commit(
        &mut store,
        render.finished_work(),
        current_parent,
        child,
    );
    let complete_work = host_component_managed_child_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        HostComponentManagedChildMutationKindForCanary::DeleteDetach,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
            .unwrap();
    let parent_state_node = store.fiber_arena().get(work_parent).unwrap().state_node();
    let child_state_node = store.fiber_arena().get(child).unwrap().state_node();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildHostWorkHandoffFixture {
        store,
        root_id,
        host,
        detached_hosts,
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        parent_state_node,
        child_state_node,
        previous_current,
        operations_before_apply,
        token_count_before_apply,
    }
}
pub(super) struct RootReplacementExecutionFixture {
    pub(super) store: FiberRootStore<RecordingHost>,
    pub(super) root_id: FiberRootId,
    pub(super) host: RecordingHost,
    pub(super) update_render: HostRootRenderPhaseRecord,
    pub(super) handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    pub(super) request: TestHostRootChildReplacementExecutionRequestForCanary,
    pub(super) host_work: HostWorkResult,
    pub(super) operations_before_execute: Vec<&'static str>,
}
pub(super) fn root_replacement_text_to_component_execution_fixture()
-> RootReplacementExecutionFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_text("replace me");
    let initial_render = render_test_root(&mut store, root_id, initial_element);
    let mut initial_host_work =
        mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        &initial_commit,
        &mut initial_host_work,
    )
    .unwrap();

    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_host_element_with_text("section", "replacement child");
    let update_render = render_test_root(&mut store, root_id, next_element);
    let host_work = replace_test_host_root_child_work_with_detached_hosts_for_canary(
        &mut store,
        &mut host,
        update_render,
        &source,
        detached_hosts,
    )
    .unwrap();
    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        954_101,
        954_102,
    )
    .unwrap();
    let request =
        test_host_root_child_replacement_execution_request_for_canary(&store, &handoff, 954_103)
            .unwrap();
    let operations_before_execute = host.operations();

    RootReplacementExecutionFixture {
        store,
        root_id,
        host,
        update_render,
        handoff,
        request,
        host_work,
        operations_before_execute,
    }
}
pub(super) fn root_replacement_component_to_text_execution_fixture()
-> (RootReplacementExecutionFixture, StateNodeHandle) {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("article", "old child");
    let initial_render = render_test_root(&mut store, root_id, initial_element);
    let mut initial_host_work =
        mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        &initial_commit,
        &mut initial_host_work,
    )
    .unwrap();

    let current_component = initial_host_work.root_child().unwrap();
    let deleted_text = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .child()
        .unwrap();
    let deleted_text_state_node = store.fiber_arena().get(deleted_text).unwrap().state_node();
    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_text("new root text");
    let update_render = render_test_root(&mut store, root_id, next_element);
    let host_work = replace_test_host_root_child_work_with_detached_hosts_for_canary(
        &mut store,
        &mut host,
        update_render,
        &source,
        detached_hosts,
    )
    .unwrap();
    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        954_201,
        954_202,
    )
    .unwrap();
    let request =
        test_host_root_child_replacement_execution_request_for_canary(&store, &handoff, 954_203)
            .unwrap();
    let operations_before_execute = host.operations();

    (
        RootReplacementExecutionFixture {
            store,
            root_id,
            host,
            update_render,
            handoff,
            request,
            host_work,
            operations_before_execute,
        },
        deleted_text_state_node,
    )
}
pub(super) struct RootReplacementSiblingOrderExecutionFixture {
    pub(super) store: FiberRootStore<RecordingHost>,
    pub(super) root_id: FiberRootId,
    pub(super) host: RecordingHost,
    pub(super) update_render: HostRootRenderPhaseRecord,
    pub(super) handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    pub(super) request: TestHostRootChildReplacementExecutionRequestForCanary,
    pub(super) host_work: HostWorkResult,
    pub(super) operations_before_execute: Vec<&'static str>,
    pub(super) deleted_current: FiberId,
    pub(super) deleted_state_node: StateNodeHandle,
    pub(super) stable_work: FiberId,
    pub(super) stable_current_state_node: StateNodeHandle,
    pub(super) placement_sibling_state_node: StateNodeHandle,
    pub(super) replacement_component: FiberId,
    pub(super) replacement_component_state_node: StateNodeHandle,
}
pub(super) struct RootReplacementBetweenStableSiblingsExecutionFixture {
    pub(super) store: FiberRootStore<RecordingHost>,
    pub(super) root_id: FiberRootId,
    pub(super) host: RecordingHost,
    pub(super) update_render: HostRootRenderPhaseRecord,
    pub(super) handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    pub(super) request: TestHostRootChildReplacementExecutionRequestForCanary,
    pub(super) host_work: HostWorkResult,
    pub(super) operations_before_execute: Vec<&'static str>,
    pub(super) stable_previous_work: FiberId,
    pub(super) stable_previous_current: FiberId,
    pub(super) stable_previous_state_node: StateNodeHandle,
    pub(super) deleted_current: FiberId,
    pub(super) deleted_state_node: StateNodeHandle,
    pub(super) stable_trailing_work: FiberId,
    pub(super) stable_trailing_state_node: StateNodeHandle,
    pub(super) replacement_component: FiberId,
    pub(super) replacement_component_state_node: StateNodeHandle,
}
pub(super) fn root_replacement_text_to_component_before_stable_sibling_execution_fixture(
    cross_root_sibling_state_node: bool,
) -> RootReplacementSiblingOrderExecutionFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let mut detached_hosts = DetachedHostRecords::default();
    let initial_render =
        render_test_root(&mut store, root_id, RootElementHandle::from_raw(973_001));
    let deleted_current = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        initial_render.finished_work(),
        "replace before stable sibling",
        FiberFlags::PLACEMENT,
    );
    let deleted_state_node = store
        .fiber_arena()
        .get(deleted_current)
        .unwrap()
        .state_node();
    let stable_current = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        initial_render.finished_work(),
        "stable sibling",
        FiberFlags::PLACEMENT,
    );
    let stable_current_state_node = store
        .fiber_arena()
        .get(stable_current)
        .unwrap()
        .state_node();
    store
        .fiber_arena_mut()
        .set_children(
            initial_render.finished_work(),
            &[deleted_current, stable_current],
        )
        .unwrap();
    complete_host_root(&mut store, initial_render.finished_work()).unwrap();
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &initial_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "replacement child");
    let update_render = render_test_root(&mut store, root_id, next_element);
    let mut host_work =
        replace_test_host_root_child_before_stable_sibling_work_with_detached_hosts_for_canary(
            &mut store,
            &mut host,
            update_render,
            &source,
            deleted_current,
            stable_current,
            detached_hosts,
        )
        .unwrap();
    let replacement_component = host_work.root_child().unwrap();
    let replacement_component_state_node = store
        .fiber_arena()
        .get(replacement_component)
        .unwrap()
        .state_node();
    let stable_work = store
        .fiber_arena()
        .get(replacement_component)
        .unwrap()
        .sibling()
        .unwrap();
    let mut placement_sibling_state_node = stable_current_state_node;

    if cross_root_sibling_state_node {
        let other_root = store
            .create_client_root(FakeContainer::new(973), RootOptions::new())
            .unwrap();
        let other_render =
            render_test_root(&mut store, other_root, RootElementHandle::from_raw(973_901));
        let other_text = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            host_work.detached_hosts_mut_for_canary(),
            other_root,
            other_render.finished_work(),
            "wrong-root stable sibling state",
            FiberFlags::PLACEMENT,
        );
        placement_sibling_state_node = store.fiber_arena().get(other_text).unwrap().state_node();
        store
            .fiber_arena_mut()
            .get_mut(stable_work)
            .unwrap()
            .set_state_node(placement_sibling_state_node);
        complete_host_root(&mut store, update_render.finished_work()).unwrap();
    }

    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        973_101,
        973_102,
    )
    .unwrap();
    let request =
        test_host_root_child_replacement_execution_request_for_canary(&store, &handoff, 973_103)
            .unwrap();
    let operations_before_execute = host.operations();

    RootReplacementSiblingOrderExecutionFixture {
        store,
        root_id,
        host,
        update_render,
        handoff,
        request,
        host_work,
        operations_before_execute,
        deleted_current,
        deleted_state_node,
        stable_work,
        stable_current_state_node,
        placement_sibling_state_node,
        replacement_component,
        replacement_component_state_node,
    }
}
pub(super) fn root_replacement_text_to_component_between_stable_siblings_execution_fixture(
    cross_root_previous_sibling_state_node: bool,
) -> RootReplacementBetweenStableSiblingsExecutionFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let mut detached_hosts = DetachedHostRecords::default();
    let initial_render =
        render_test_root(&mut store, root_id, RootElementHandle::from_raw(991_001));
    let stable_previous_current = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        initial_render.finished_work(),
        "stable previous sibling",
        FiberFlags::PLACEMENT,
    );
    let stable_previous_state_node = store
        .fiber_arena()
        .get(stable_previous_current)
        .unwrap()
        .state_node();
    let deleted_current = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        initial_render.finished_work(),
        "replace middle sibling",
        FiberFlags::PLACEMENT,
    );
    let deleted_state_node = store
        .fiber_arena()
        .get(deleted_current)
        .unwrap()
        .state_node();
    let stable_trailing_current = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        initial_render.finished_work(),
        "stable trailing sibling",
        FiberFlags::PLACEMENT,
    );
    let stable_trailing_state_node = store
        .fiber_arena()
        .get(stable_trailing_current)
        .unwrap()
        .state_node();
    store
        .fiber_arena_mut()
        .set_children(
            initial_render.finished_work(),
            &[
                stable_previous_current,
                deleted_current,
                stable_trailing_current,
            ],
        )
        .unwrap();
    complete_host_root(&mut store, initial_render.finished_work()).unwrap();
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &initial_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "replacement child");
    let update_render = render_test_root(&mut store, root_id, next_element);
    let mut host_work =
        replace_test_host_root_child_between_stable_siblings_work_with_detached_hosts_for_canary(
            &mut store,
            &mut host,
            update_render,
            &source,
            stable_previous_current,
            deleted_current,
            stable_trailing_current,
            detached_hosts,
        )
        .unwrap();
    let stable_previous_work = host_work.root_children()[0];
    let replacement_component = host_work.root_children()[1];
    let stable_trailing_work = host_work.root_children()[2];
    let replacement_component_state_node = store
        .fiber_arena()
        .get(replacement_component)
        .unwrap()
        .state_node();

    if cross_root_previous_sibling_state_node {
        let other_root = store
            .create_client_root(FakeContainer::new(991), RootOptions::new())
            .unwrap();
        let other_render =
            render_test_root(&mut store, other_root, RootElementHandle::from_raw(991_901));
        let other_text = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            host_work.detached_hosts_mut_for_canary(),
            other_root,
            other_render.finished_work(),
            "wrong-root previous sibling state",
            FiberFlags::PLACEMENT,
        );
        let wrong_state_node = store.fiber_arena().get(other_text).unwrap().state_node();
        store
            .fiber_arena_mut()
            .get_mut(stable_previous_work)
            .unwrap()
            .set_state_node(wrong_state_node);
        complete_host_root(&mut store, update_render.finished_work()).unwrap();
    }

    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        991_101,
        991_102,
    )
    .unwrap();
    let request =
        test_host_root_child_replacement_execution_request_for_canary(&store, &handoff, 991_103)
            .unwrap();
    let operations_before_execute = host.operations();

    RootReplacementBetweenStableSiblingsExecutionFixture {
        store,
        root_id,
        host,
        update_render,
        handoff,
        request,
        host_work,
        operations_before_execute,
        stable_previous_work,
        stable_previous_current,
        stable_previous_state_node,
        deleted_current,
        deleted_state_node,
        stable_trailing_work,
        stable_trailing_state_node,
        replacement_component,
        replacement_component_state_node,
    }
}
