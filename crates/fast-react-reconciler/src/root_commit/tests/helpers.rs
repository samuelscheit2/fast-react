use super::*;

pub(super) fn root_store_with_options(
    options: RootOptions,
) -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(FakeContainer::new(1), options)
        .unwrap();
    (store, root_id, host)
}
pub(super) fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
    root_store_with_options(RootOptions::new())
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct OffscreenRevealCommitFixture {
    pub(super) render: HostRootRenderPhaseRecord,
    pub(super) pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    pub(super) reveal_metadata: OffscreenRevealCommitMetadataRecord,
    pub(super) previous_offscreen: FiberId,
    pub(super) offscreen: FiberId,
    pub(super) child: FiberId,
    pub(super) hidden_update: UpdateId,
    pub(super) hidden_callback: RootUpdateCallbackHandle,
}
pub(super) fn prepare_offscreen_reveal_commit_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    root: FiberRootId,
    element: RootElementHandle,
    retain_offscreen_lane: bool,
    reveal_committed_lanes: Lanes,
    child_tag: FiberTag,
) -> OffscreenRevealCommitFixture {
    let hidden_callback = RootUpdateCallbackHandle::from_raw(element.raw() + 10_000);
    let hidden_update = update_container(store, root, element, Some(hidden_callback)).unwrap();
    if retain_offscreen_lane {
        store
            .update_queues_mut()
            .mark_update_hidden(hidden_update.update())
            .unwrap();
        store
            .root_mut(root)
            .unwrap()
            .lanes_mut()
            .mark_hidden_update(hidden_update.lane())
            .unwrap();
    }

    let render_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
    let render = render_host_root_for_lanes(store, root, render_lanes).unwrap();
    let (previous_offscreen, offscreen, child) =
        attach_offscreen_reveal_commit_child(store, render.finished_work(), child_tag);
    let begin_work = unsupported_offscreen_begin_work_record(
        store.fiber_arena(),
        BeginWorkRequest::new(offscreen, render_lanes),
    )
    .unwrap();
    let complete_work = complete_offscreen_visibility_transition_blocker_for_test(
        store.fiber_arena(),
        offscreen,
        &begin_work,
        render_lanes,
    )
    .unwrap();
    let reveal_metadata =
        offscreen_reveal_commit_metadata_for_test(&complete_work, reveal_committed_lanes).unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(store, render, 1).unwrap();

    OffscreenRevealCommitFixture {
        render,
        pending,
        reveal_metadata,
        previous_offscreen,
        offscreen,
        child,
        hidden_update: hidden_update.update(),
        hidden_callback,
    }
}
pub(super) fn attach_offscreen_reveal_commit_child(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
    child_tag: FiberTag,
) -> (FiberId, FiberId, FiberId) {
    let previous = store.fiber_arena_mut().create_fiber(
        FiberTag::Offscreen,
        Some(ReactKey::from_normalized("commit-reveal")),
        PropsHandle::from_raw(8_600),
        FiberMode::CONCURRENT,
    );
    {
        let node = store.fiber_arena_mut().get_mut(previous).unwrap();
        node.set_memoized_state(StateHandle::from_raw(8_601));
        node.set_lanes(Lanes::OFFSCREEN);
        node.set_child_lanes(Lanes::from(Lane::RETRY_1));
        node.set_state_node(StateNodeHandle::from_raw(8_602));
    }

    let offscreen = store
        .fiber_arena_mut()
        .create_work_in_progress(previous, PropsHandle::from_raw(8_603))
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(offscreen).unwrap();
        node.set_memoized_props(PropsHandle::from_raw(8_604));
        node.set_memoized_state(StateHandle::NONE);
        node.set_lanes(Lanes::DEFAULT);
        node.set_child_lanes(Lanes::from(Lane::TRANSITION_1));
        node.set_state_node(StateNodeHandle::from_raw(8_605));
    }

    let child = store.fiber_arena_mut().create_fiber(
        child_tag,
        None,
        PropsHandle::from_raw(8_606),
        FiberMode::NO,
    );
    {
        let node = store.fiber_arena_mut().get_mut(child).unwrap();
        node.merge_flags(FiberFlags::PLACEMENT | FiberFlags::MAY_SUSPEND_COMMIT);
        node.set_state_node(StateNodeHandle::from_raw(8_607));
    }

    store
        .fiber_arena_mut()
        .set_children(offscreen, &[child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[offscreen])
        .unwrap();

    (previous, offscreen, child)
}
pub(super) fn host_root_element(
    store: &FiberRootStore<RecordingHost>,
    fiber: FiberId,
) -> RootElementHandle {
    let state = store.fiber_arena().get(fiber).unwrap().memoized_state();
    store.host_root_states().get(state).unwrap().element()
}
pub(super) fn attach_host_root_child(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    tag: FiberTag,
    flags: FiberFlags,
    state_node: StateNodeHandle,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
) -> FiberId {
    attach_host_root_children(
        store,
        host_root,
        &[(tag, flags, state_node, pending_props, memoized_props)],
    )[0]
}
pub(super) fn attach_host_root_children(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    children: &[(
        FiberTag,
        FiberFlags,
        StateNodeHandle,
        PropsHandle,
        PropsHandle,
    )],
) -> Vec<FiberId> {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let mut child_ids = Vec::with_capacity(children.len());
    let mut subtree_flags = store.fiber_arena().get(host_root).unwrap().subtree_flags();
    for &(tag, flags, state_node, pending_props, memoized_props) in children {
        let child = store
            .fiber_arena_mut()
            .create_fiber(tag, None, pending_props, mode);
        {
            let node = store.fiber_arena_mut().get_mut(child).unwrap();
            node.set_flags(flags);
            node.set_state_node(state_node);
            node.set_memoized_props(memoized_props);
        }
        subtree_flags |= flags;
        child_ids.push(child);
    }
    store
        .fiber_arena_mut()
        .set_children(host_root, &child_ids)
        .unwrap();
    store
        .fiber_arena_mut()
        .get_mut(host_root)
        .unwrap()
        .set_subtree_flags(subtree_flags);
    child_ids
}
pub(super) fn bubble_test_fiber(store: &mut FiberRootStore<RecordingHost>, fiber: FiberId) {
    let bubbled = fast_react_core::bubble_properties(store.fiber_arena(), fiber).unwrap();
    let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
}
pub(super) fn append_function_component_child(
    store: &mut FiberRootStore<RecordingHost>,
    parent: FiberId,
    props: PropsHandle,
    component: FiberTypeHandle,
) -> FiberId {
    let mode = store.fiber_arena().get(parent).unwrap().mode();
    let child = create_function_component_fiber(store, mode, props, component);
    store
        .fiber_arena_mut()
        .set_children(parent, &[child])
        .unwrap();
    child
}
pub(super) fn create_function_component_fiber(
    store: &mut FiberRootStore<RecordingHost>,
    mode: FiberMode,
    props: PropsHandle,
    component: FiberTypeHandle,
) -> FiberId {
    let fiber =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::FunctionComponent, None, props, mode);
    store
        .fiber_arena_mut()
        .get_mut(fiber)
        .unwrap()
        .set_fiber_type(component);
    fiber
}
pub(super) fn callback(raw: u64) -> HookEffectCallbackHandle {
    HookEffectCallbackHandle::from_raw(raw)
}
pub(super) fn root_callback_error(raw: u64) -> RootUpdateCallbackInvocationErrorHandle {
    RootUpdateCallbackInvocationErrorHandle::from_raw(raw)
}
#[derive(Default)]
pub(super) struct TestRootUpdateCallbackControl {
    pub(super) calls: Vec<RootUpdateCallbackInvocationRequest>,
    pub(super) results: Vec<(
        RootUpdateCallbackHandle,
        Result<(), RootUpdateCallbackInvocationErrorHandle>,
    )>,
}
impl TestRootUpdateCallbackControl {
    pub(super) fn with_result(
        mut self,
        callback: RootUpdateCallbackHandle,
        result: Result<(), RootUpdateCallbackInvocationErrorHandle>,
    ) -> Self {
        self.results.push((callback, result));
        self
    }

    pub(super) fn calls(&self) -> &[RootUpdateCallbackInvocationRequest] {
        &self.calls
    }

    pub(super) fn result(
        &self,
        callback: RootUpdateCallbackHandle,
    ) -> Result<(), RootUpdateCallbackInvocationErrorHandle> {
        self.results
            .iter()
            .find(|(accepted, _)| *accepted == callback)
            .map_or(Ok(()), |(_, result)| *result)
    }
}
impl RootUpdateCallbackInvocationTestControl for TestRootUpdateCallbackControl {
    fn invoke_root_update_callback(
        &mut self,
        request: RootUpdateCallbackInvocationRequest,
    ) -> Result<(), RootUpdateCallbackInvocationErrorHandle> {
        self.calls.push(request);
        self.result(request.callback())
    }
}
#[derive(Default)]
pub(super) struct TestPassiveEffectCallbackControl {
    pub(super) calls: Vec<PassiveEffectCallbackInvocationRequest>,
    pub(super) returned_destroy: Option<HookEffectCallbackHandle>,
}
impl TestPassiveEffectCallbackControl {
    pub(super) fn with_returned_destroy(mut self, destroy: HookEffectCallbackHandle) -> Self {
        self.returned_destroy = Some(destroy);
        self
    }

    pub(super) fn calls(&self) -> &[PassiveEffectCallbackInvocationRequest] {
        &self.calls
    }
}
impl PassiveEffectCallbackInvocationTestControl for TestPassiveEffectCallbackControl {
    fn invoke_passive_effect_destroy(
        &mut self,
        request: PassiveEffectCallbackInvocationRequest,
    ) -> Result<(), PassiveEffectCallbackInvocationErrorHandle> {
        self.calls.push(request);
        Ok(())
    }

    fn invoke_passive_effect_create(
        &mut self,
        request: PassiveEffectCallbackInvocationRequest,
    ) -> Result<Option<HookEffectCallbackHandle>, PassiveEffectCallbackInvocationErrorHandle> {
        self.calls.push(request);
        Ok(self.returned_destroy)
    }
}
#[derive(Default)]
pub(super) struct TestLayoutEffectCallbackControl {
    pub(super) calls: Vec<FunctionComponentLayoutEffectCallbackInvocationRequest>,
    pub(super) results: Vec<(
        HookEffectCallbackHandle,
        Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle>,
    )>,
}
impl TestLayoutEffectCallbackControl {
    pub(super) fn with_result(
        mut self,
        callback: HookEffectCallbackHandle,
        result: Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle>,
    ) -> Self {
        self.results.push((callback, result));
        self
    }

    pub(super) fn calls(&self) -> &[FunctionComponentLayoutEffectCallbackInvocationRequest] {
        &self.calls
    }

    pub(super) fn result(
        &self,
        callback: HookEffectCallbackHandle,
    ) -> Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle> {
        self.results
            .iter()
            .find(|(accepted, _)| *accepted == callback)
            .map_or(Ok(()), |(_, result)| *result)
    }
}
impl FunctionComponentLayoutEffectCallbackInvocationTestControl
    for TestLayoutEffectCallbackControl
{
    fn invoke_layout_effect_destroy(
        &mut self,
        request: FunctionComponentLayoutEffectCallbackInvocationRequest,
    ) -> Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle> {
        self.calls.push(request);
        self.result(request.callback())
    }

    fn invoke_layout_effect_create(
        &mut self,
        request: FunctionComponentLayoutEffectCallbackInvocationRequest,
    ) -> Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle> {
        self.calls.push(request);
        self.result(request.callback())
    }
}
pub(super) fn deps(raw: u64) -> HookEffectDependencies {
    HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
}
pub(super) fn scheduled_callback_node(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) -> crate::RootSchedulerCallbackHandle {
    let result = update_container(store, root_id, RootElementHandle::from_raw(1), None).unwrap();
    ensure_root_is_scheduled(store, result.schedule()).unwrap();
    let processed = process_root_schedule_in_microtask(store).unwrap();
    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    store.root(root_id).unwrap().scheduling().callback_node()
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct LayoutEffectExecutionFixture {
    pub(super) finished_work: FiberId,
    pub(super) finished_function: FiberId,
    pub(super) state: FunctionComponentHookRenderState,
    pub(super) previous_layout: FunctionComponentEffectRegistration,
    pub(super) previous_passive: FunctionComponentEffectRegistration,
    pub(super) layout: FunctionComponentEffectRegistration,
    pub(super) passive: FunctionComponentEffectRegistration,
    pub(super) queued_passive: FunctionComponentPendingPassiveCommitHandoff,
}
pub(super) fn prepare_layout_effect_execution_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    hook_store: &mut FunctionComponentHookRenderStore,
    raw: u64,
) -> (HostRootRenderPhaseRecord, LayoutEffectExecutionFixture) {
    let current_root = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(raw);
    let current_function = append_function_component_child(
        store,
        current_root,
        PropsHandle::from_raw(raw + 1),
        component,
    );
    let previous_layout = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Layout,
            callback(raw + 2),
            deps(raw + 3),
            Some(callback(raw + 4)),
        )
        .unwrap();
    let previous_passive = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(raw + 5),
            deps(raw + 6),
            Some(callback(raw + 7)),
        )
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 8), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        store,
        finished_work,
        PropsHandle::from_raw(raw + 9),
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
            callback(raw + 10),
            deps(raw + 11),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    let passive = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(raw + 12),
            deps(raw + 13),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let queued_passive = queue_function_component_pending_passive_effects(
        store,
        root_id,
        hook_store,
        state,
        Lanes::DEFAULT,
    )
    .unwrap();
    bubble_test_fiber(store, finished_function);
    bubble_test_fiber(store, finished_work);

    (
        render,
        LayoutEffectExecutionFixture {
            finished_work,
            finished_function,
            state,
            previous_layout,
            previous_passive,
            layout,
            passive,
            queued_passive,
        },
    )
}
pub(super) fn first_effect_list_record(
    snapshot: &FunctionComponentEffectListCommitPhaseOrderSnapshot,
    kind: FunctionComponentEffectListCommitPhaseOrderKind,
) -> FunctionComponentEffectListCommitPhaseOrderRecord {
    snapshot
        .records()
        .iter()
        .copied()
        .find(|record| record.kind() == kind)
        .unwrap()
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct DeletionMetadataFixture {
    pub(super) first_parent: FiberId,
    pub(super) first_parent_state_node: StateNodeHandle,
    pub(super) first_list: DeletionListId,
    pub(super) first_deleted: FiberId,
    pub(super) first_deleted_state_node: StateNodeHandle,
    pub(super) second_deleted: FiberId,
    pub(super) second_deleted_state_node: StateNodeHandle,
    pub(super) nested_deleted_component: FiberId,
    pub(super) nested_deleted_component_state_node: StateNodeHandle,
    pub(super) nested_deleted_component_ref: RefHandle,
    pub(super) nested_deleted_text: FiberId,
    pub(super) nested_deleted_text_state_node: StateNodeHandle,
    pub(super) second_parent: FiberId,
    pub(super) second_parent_state_node: StateNodeHandle,
    pub(super) second_list: DeletionListId,
    pub(super) third_deleted: FiberId,
    pub(super) third_deleted_state_node: StateNodeHandle,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct FunctionComponentDeletionHostParentFixture {
    pub(super) owner: FiberId,
    pub(super) list: DeletionListId,
    pub(super) deleted_text: FiberId,
    pub(super) deleted_text_state_node: StateNodeHandle,
    pub(super) deleted_component: FiberId,
    pub(super) deleted_component_state_node: StateNodeHandle,
    pub(super) nested_text: FiberId,
    pub(super) nested_text_state_node: StateNodeHandle,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct DeletedHostSubtreeRefPassiveFixture {
    pub(super) list: DeletionListId,
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
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct NestedDeletedHostSubtreeRefPassiveFixture {
    pub(super) host_parent: FiberId,
    pub(super) host_parent_state_node: StateNodeHandle,
    pub(super) list: DeletionListId,
    pub(super) deleted_host: FiberId,
    pub(super) deleted_host_state_node: StateNodeHandle,
    pub(super) deleted_host_ref: RefHandle,
    pub(super) deleted_function: FiberId,
    pub(super) nested_host: FiberId,
    pub(super) nested_host_state_node: StateNodeHandle,
    pub(super) nested_host_ref: RefHandle,
    pub(super) deleted_text: FiberId,
    pub(super) deleted_text_state_node: StateNodeHandle,
    pub(super) passive_create: HookEffectCallbackHandle,
    pub(super) passive_destroy: HookEffectCallbackHandle,
    pub(super) passive_dependencies: HookEffectDependencies,
}
pub(super) fn create_test_fiber(
    store: &mut FiberRootStore<RecordingHost>,
    tag: FiberTag,
    props: u64,
) -> FiberId {
    store
        .fiber_arena_mut()
        .create_fiber(tag, None, PropsHandle::from_raw(props), FiberMode::NO)
}
pub(super) fn prepare_host_component_update_wip(
    store: &mut FiberRootStore<RecordingHost>,
    current: FiberId,
    state_node: StateNodeHandle,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
) -> FiberId {
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current, pending_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_in_progress).unwrap();
        node.set_flags(FiberFlags::UPDATE);
        node.set_state_node(state_node);
        node.set_memoized_props(memoized_props);
        node.set_lanes(Lanes::NO);
    }
    work_in_progress
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct DangerousHtmlTextResetCommitFixture {
    pub(super) render: HostRootRenderPhaseRecord,
    pub(super) pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    pub(super) complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    pub(super) current_component: FiberId,
    pub(super) work_in_progress_component: FiberId,
    pub(super) state_node: StateNodeHandle,
    pub(super) old_props: PropsHandle,
    pub(super) new_props: PropsHandle,
}
pub(super) fn prepare_dangerous_html_text_reset_commit_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    payload_kind: HostComponentDangerousHtmlTextResetPayloadKindForCanary,
    raw: u64,
) -> DangerousHtmlTextResetCommitFixture {
    let current_root = store.root(root_id).unwrap().current();
    let state_node = StateNodeHandle::from_raw(raw + 1);
    let old_props = PropsHandle::from_raw(raw + 2);
    let new_props = PropsHandle::from_raw(raw + 3);
    let current_component = attach_host_root_child(
        store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        state_node,
        old_props,
        old_props,
    );

    update_container(store, root_id, RootElementHandle::from_raw(raw + 4), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let work_in_progress_component = prepare_host_component_update_wip(
        store,
        current_component,
        state_node,
        new_props,
        new_props,
    );
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_in_progress_component])
        .unwrap();
    bubble_test_fiber(store, render.finished_work());

    let complete_work = host_component_dangerous_html_text_reset_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_in_progress_component,
        payload_kind,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(store, render, 91).unwrap();

    DangerousHtmlTextResetCommitFixture {
        render,
        pending,
        complete_work,
        current_component,
        work_in_progress_component,
        state_node,
        old_props,
        new_props,
    }
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct ManagedChildCommitFixture {
    pub(super) render: HostRootRenderPhaseRecord,
    pub(super) pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    pub(super) complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    pub(super) sibling_order_complete_work:
        Option<HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary>,
    pub(super) current_parent: FiberId,
    pub(super) work_parent: FiberId,
    pub(super) child: FiberId,
    pub(super) order_sibling: Option<FiberId>,
    pub(super) order_sibling_current: Option<FiberId>,
    pub(super) parent_state_node: StateNodeHandle,
    pub(super) child_state_node: StateNodeHandle,
    pub(super) order_sibling_state_node: StateNodeHandle,
    pub(super) parent_props: PropsHandle,
    pub(super) child_props: PropsHandle,
    pub(super) order_sibling_props: PropsHandle,
    pub(super) previous_current: FiberId,
    pub(super) deletion_list: Option<DeletionListId>,
}
pub(super) fn prepare_managed_child_placement_commit_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    raw: u64,
) -> ManagedChildCommitFixture {
    let current_root = store.root(root_id).unwrap().current();
    let parent_state_node = StateNodeHandle::from_raw(raw + 1);
    let child_state_node = StateNodeHandle::from_raw(raw + 2);
    let parent_props = PropsHandle::from_raw(raw + 3);
    let child_props = PropsHandle::from_raw(raw + 4);
    let current_parent = attach_host_root_child(
        store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        parent_state_node,
        parent_props,
        parent_props,
    );

    update_container(store, root_id, RootElementHandle::from_raw(raw + 5), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
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
    let mode = store.fiber_arena().get(work_parent).unwrap().mode();
    let child =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, child_props, mode);
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
    bubble_test_fiber(store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_test_fiber(store, render.finished_work());

    let complete_work = host_component_managed_child_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        HostComponentManagedChildMutationKindForCanary::Placement,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(store, render, 121).unwrap();
    let previous_current = store.root(root_id).unwrap().current();

    ManagedChildCommitFixture {
        render,
        pending,
        complete_work,
        sibling_order_complete_work: None,
        current_parent,
        work_parent,
        child,
        order_sibling: None,
        order_sibling_current: None,
        parent_state_node,
        child_state_node,
        order_sibling_state_node: StateNodeHandle::NONE,
        parent_props,
        child_props,
        order_sibling_props: PropsHandle::NONE,
        previous_current,
        deletion_list: None,
    }
}
pub(super) fn prepare_managed_child_delete_commit_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    raw: u64,
) -> ManagedChildCommitFixture {
    let current_root = store.root(root_id).unwrap().current();
    let parent_state_node = StateNodeHandle::from_raw(raw + 1);
    let child_state_node = StateNodeHandle::from_raw(raw + 2);
    let parent_props = PropsHandle::from_raw(raw + 3);
    let child_props = PropsHandle::from_raw(raw + 4);
    let current_parent = attach_host_root_child(
        store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        parent_state_node,
        parent_props,
        parent_props,
    );
    let mode = store.fiber_arena().get(current_parent).unwrap().mode();
    let child =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, child_props, mode);
    {
        let node = store.fiber_arena_mut().get_mut(child).unwrap();
        node.set_state_node(child_state_node);
        node.set_memoized_props(child_props);
    }
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[child])
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 5), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
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
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, child)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_test_fiber(store, render.finished_work());

    let complete_work = host_component_managed_child_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        HostComponentManagedChildMutationKindForCanary::DeleteDetach,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(store, render, 131).unwrap();
    let previous_current = store.root(root_id).unwrap().current();

    ManagedChildCommitFixture {
        render,
        pending,
        complete_work,
        sibling_order_complete_work: None,
        current_parent,
        work_parent,
        child,
        order_sibling: None,
        order_sibling_current: None,
        parent_state_node,
        child_state_node,
        order_sibling_state_node: StateNodeHandle::NONE,
        parent_props,
        child_props,
        order_sibling_props: PropsHandle::NONE,
        previous_current,
        deletion_list: Some(deletion_list),
    }
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct ManagedChildSiblingOrderCommitFixture {
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
    pub(super) parent_props: PropsHandle,
    pub(super) child_props: PropsHandle,
    pub(super) order_sibling_props: PropsHandle,
    pub(super) previous_current: FiberId,
    pub(super) deletion_list: Option<DeletionListId>,
}
pub(super) fn prepare_managed_child_placement_sibling_order_commit_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    raw: u64,
) -> ManagedChildSiblingOrderCommitFixture {
    let current_root = store.root(root_id).unwrap().current();
    let parent_state_node = StateNodeHandle::from_raw(raw + 1);
    let child_state_node = StateNodeHandle::from_raw(raw + 2);
    let order_sibling_state_node = StateNodeHandle::from_raw(raw + 3);
    let parent_props = PropsHandle::from_raw(raw + 4);
    let child_props = PropsHandle::from_raw(raw + 5);
    let order_sibling_props = PropsHandle::from_raw(raw + 6);
    let current_parent = attach_host_root_child(
        store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        parent_state_node,
        parent_props,
        parent_props,
    );
    let mode = store.fiber_arena().get(current_parent).unwrap().mode();
    let order_sibling_current = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        order_sibling_props,
        mode,
    );
    {
        let node = store
            .fiber_arena_mut()
            .get_mut(order_sibling_current)
            .unwrap();
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
    }
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[order_sibling_current])
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 7), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
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
    let child =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, child_props, mode);
    {
        let node = store.fiber_arena_mut().get_mut(child).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(child_state_node);
        node.set_memoized_props(child_props);
    }
    let order_sibling = store
        .fiber_arena_mut()
        .create_work_in_progress(order_sibling_current, order_sibling_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
        node.set_lanes(Lanes::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[child, order_sibling])
        .unwrap();
    bubble_test_fiber(store, child);
    bubble_test_fiber(store, order_sibling);
    bubble_test_fiber(store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_test_fiber(store, render.finished_work());

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
        record_host_root_finished_work_pending_commit_for_canary(store, render, 221).unwrap();
    let previous_current = store.root(root_id).unwrap().current();

    ManagedChildSiblingOrderCommitFixture {
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
        parent_props,
        child_props,
        order_sibling_props,
        previous_current,
        deletion_list: None,
    }
}
pub(super) fn prepare_managed_child_delete_sibling_order_commit_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    raw: u64,
) -> ManagedChildSiblingOrderCommitFixture {
    let current_root = store.root(root_id).unwrap().current();
    let parent_state_node = StateNodeHandle::from_raw(raw + 1);
    let child_state_node = StateNodeHandle::from_raw(raw + 2);
    let order_sibling_state_node = StateNodeHandle::from_raw(raw + 3);
    let parent_props = PropsHandle::from_raw(raw + 4);
    let child_props = PropsHandle::from_raw(raw + 5);
    let order_sibling_props = PropsHandle::from_raw(raw + 6);
    let current_parent = attach_host_root_child(
        store,
        current_root,
        FiberTag::HostComponent,
        FiberFlags::NO,
        parent_state_node,
        parent_props,
        parent_props,
    );
    let mode = store.fiber_arena().get(current_parent).unwrap().mode();
    let order_sibling_current = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        order_sibling_props,
        mode,
    );
    let child =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, child_props, mode);
    {
        let node = store
            .fiber_arena_mut()
            .get_mut(order_sibling_current)
            .unwrap();
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
    }
    {
        let node = store.fiber_arena_mut().get_mut(child).unwrap();
        node.set_state_node(child_state_node);
        node.set_memoized_props(child_props);
    }
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[order_sibling_current, child])
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 7), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
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
    let order_sibling = store
        .fiber_arena_mut()
        .create_work_in_progress(order_sibling_current, order_sibling_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
        node.set_lanes(Lanes::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[order_sibling])
        .unwrap();
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, child)
        .unwrap();
    bubble_test_fiber(store, order_sibling);
    bubble_test_fiber(store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_test_fiber(store, render.finished_work());

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
        record_host_root_finished_work_pending_commit_for_canary(store, render, 231).unwrap();
    let previous_current = store.root(root_id).unwrap().current();

    ManagedChildSiblingOrderCommitFixture {
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
        parent_props,
        child_props,
        order_sibling_props,
        previous_current,
        deletion_list: Some(deletion_list),
    }
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct NestedHostParentFixture {
    pub(super) outer_current: FiberId,
    pub(super) inner_current: FiberId,
    pub(super) text_current: FiberId,
    pub(super) outer_state_node: StateNodeHandle,
    pub(super) inner_state_node: StateNodeHandle,
    pub(super) text_state_node: StateNodeHandle,
    pub(super) outer_props: PropsHandle,
    pub(super) inner_props: PropsHandle,
    pub(super) text_props: PropsHandle,
}
pub(super) fn attach_current_nested_host_parent_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
) -> NestedHostParentFixture {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let outer_current = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9_100),
        mode,
    );
    let inner_current = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9_101),
        mode,
    );
    let text_current = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9_102),
        mode,
    );
    let fixture = NestedHostParentFixture {
        outer_current,
        inner_current,
        text_current,
        outer_state_node: StateNodeHandle::from_raw(9_200),
        inner_state_node: StateNodeHandle::from_raw(9_201),
        text_state_node: StateNodeHandle::from_raw(9_202),
        outer_props: PropsHandle::from_raw(9_100),
        inner_props: PropsHandle::from_raw(9_101),
        text_props: PropsHandle::from_raw(9_102),
    };
    {
        let node = store.fiber_arena_mut().get_mut(outer_current).unwrap();
        node.set_state_node(fixture.outer_state_node);
        node.set_memoized_props(fixture.outer_props);
    }
    {
        let node = store.fiber_arena_mut().get_mut(inner_current).unwrap();
        node.set_state_node(fixture.inner_state_node);
        node.set_memoized_props(fixture.inner_props);
    }
    {
        let node = store.fiber_arena_mut().get_mut(text_current).unwrap();
        node.set_state_node(fixture.text_state_node);
        node.set_memoized_props(fixture.text_props);
    }
    store
        .fiber_arena_mut()
        .set_children(inner_current, &[text_current])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(outer_current, &[inner_current])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[outer_current])
        .unwrap();
    fixture
}
pub(super) fn prepare_nested_host_parent_placement_wip(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    fixture: NestedHostParentFixture,
    placed_text_state_node: StateNodeHandle,
) -> (FiberId, FiberId, FiberId, FiberId) {
    let work_outer = store
        .fiber_arena_mut()
        .create_work_in_progress(fixture.outer_current, fixture.outer_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_outer).unwrap();
        node.set_state_node(fixture.outer_state_node);
        node.set_memoized_props(fixture.outer_props);
        node.set_lanes(Lanes::NO);
    }
    let work_inner = store
        .fiber_arena_mut()
        .create_work_in_progress(fixture.inner_current, fixture.inner_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_inner).unwrap();
        node.set_state_node(fixture.inner_state_node);
        node.set_memoized_props(fixture.inner_props);
        node.set_lanes(Lanes::NO);
    }
    let stable_text = store
        .fiber_arena_mut()
        .create_work_in_progress(fixture.text_current, fixture.text_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(stable_text).unwrap();
        node.set_state_node(fixture.text_state_node);
        node.set_memoized_props(fixture.text_props);
        node.set_lanes(Lanes::NO);
    }
    let mode = store.fiber_arena().get(work_inner).unwrap().mode();
    let placed_text = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9_103),
        mode,
    );
    {
        let node = store.fiber_arena_mut().get_mut(placed_text).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(placed_text_state_node);
        node.set_memoized_props(PropsHandle::from_raw(9_103));
    }
    store
        .fiber_arena_mut()
        .set_children(work_inner, &[stable_text, placed_text])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(work_outer, &[work_inner])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_outer])
        .unwrap();
    bubble_test_fiber(store, stable_text);
    bubble_test_fiber(store, placed_text);
    bubble_test_fiber(store, work_inner);
    bubble_test_fiber(store, work_outer);
    bubble_test_fiber(store, host_root);
    (work_outer, work_inner, stable_text, placed_text)
}
pub(super) fn attach_deletion_metadata_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> DeletionMetadataFixture {
    let first_parent = create_test_fiber(store, FiberTag::HostComponent, 101);
    let second_parent = create_test_fiber(store, FiberTag::HostComponent, 102);
    let first_parent_state_node = StateNodeHandle::from_raw(8101);
    let second_parent_state_node = StateNodeHandle::from_raw(8102);
    store
        .fiber_arena_mut()
        .get_mut(first_parent)
        .unwrap()
        .set_state_node(first_parent_state_node);
    store
        .fiber_arena_mut()
        .get_mut(second_parent)
        .unwrap()
        .set_state_node(second_parent_state_node);
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[first_parent, second_parent])
        .unwrap();

    let first_kept = create_test_fiber(store, FiberTag::HostText, 201);
    let first_deleted = create_test_fiber(store, FiberTag::HostText, 202);
    let second_deleted = create_test_fiber(store, FiberTag::HostText, 203);
    let nested_deleted_component = create_test_fiber(store, FiberTag::HostComponent, 204);
    let nested_deleted_text = create_test_fiber(store, FiberTag::HostText, 205);
    let first_deleted_state_node = StateNodeHandle::from_raw(8202);
    let second_deleted_state_node = StateNodeHandle::from_raw(8203);
    let nested_deleted_component_state_node = StateNodeHandle::from_raw(8204);
    let nested_deleted_component_ref = RefHandle::from_raw(8206);
    let nested_deleted_text_state_node = StateNodeHandle::from_raw(8205);
    store
        .fiber_arena_mut()
        .get_mut(first_deleted)
        .unwrap()
        .set_state_node(first_deleted_state_node);
    store
        .fiber_arena_mut()
        .get_mut(second_deleted)
        .unwrap()
        .set_state_node(second_deleted_state_node);
    store
        .fiber_arena_mut()
        .get_mut(nested_deleted_component)
        .unwrap()
        .set_state_node(nested_deleted_component_state_node);
    store
        .fiber_arena_mut()
        .get_mut(nested_deleted_component)
        .unwrap()
        .set_ref_handle(nested_deleted_component_ref);
    store
        .fiber_arena_mut()
        .get_mut(nested_deleted_text)
        .unwrap()
        .set_state_node(nested_deleted_text_state_node);
    store
        .fiber_arena_mut()
        .set_children(nested_deleted_component, &[nested_deleted_text])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(
            first_parent,
            &[
                first_kept,
                first_deleted,
                second_deleted,
                nested_deleted_component,
            ],
        )
        .unwrap();
    let first_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(first_parent, second_deleted)
        .unwrap();
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(first_parent, first_deleted)
        .unwrap();
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(first_parent, nested_deleted_component)
        .unwrap();

    let third_deleted = create_test_fiber(store, FiberTag::HostText, 301);
    let third_deleted_state_node = StateNodeHandle::from_raw(8301);
    store
        .fiber_arena_mut()
        .get_mut(third_deleted)
        .unwrap()
        .set_state_node(third_deleted_state_node);
    store
        .fiber_arena_mut()
        .set_children(second_parent, &[third_deleted])
        .unwrap();
    let second_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(second_parent, third_deleted)
        .unwrap();
    bubble_test_fiber(store, host_root_work_in_progress);

    DeletionMetadataFixture {
        first_parent,
        first_parent_state_node,
        first_list,
        first_deleted,
        first_deleted_state_node,
        second_deleted,
        second_deleted_state_node,
        nested_deleted_component,
        nested_deleted_component_state_node,
        nested_deleted_component_ref,
        nested_deleted_text,
        nested_deleted_text_state_node,
        second_parent,
        second_parent_state_node,
        second_list,
        third_deleted,
        third_deleted_state_node,
    }
}
pub(super) fn attach_function_component_deletion_host_parent_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> FunctionComponentDeletionHostParentFixture {
    let owner = create_test_fiber(store, FiberTag::FunctionComponent, 401);
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[owner])
        .unwrap();

    let deleted_text = create_test_fiber(store, FiberTag::HostText, 402);
    let deleted_component = create_test_fiber(store, FiberTag::HostComponent, 403);
    let nested_text = create_test_fiber(store, FiberTag::HostText, 404);
    let deleted_text_state_node = StateNodeHandle::from_raw(8402);
    let deleted_component_state_node = StateNodeHandle::from_raw(8403);
    let nested_text_state_node = StateNodeHandle::from_raw(8404);
    store
        .fiber_arena_mut()
        .get_mut(deleted_text)
        .unwrap()
        .set_state_node(deleted_text_state_node);
    store
        .fiber_arena_mut()
        .get_mut(deleted_component)
        .unwrap()
        .set_state_node(deleted_component_state_node);
    store
        .fiber_arena_mut()
        .get_mut(nested_text)
        .unwrap()
        .set_state_node(nested_text_state_node);
    store
        .fiber_arena_mut()
        .set_children(deleted_component, &[nested_text])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(owner, &[deleted_text, deleted_component])
        .unwrap();
    let list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(owner, deleted_text)
        .unwrap();
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(owner, deleted_component)
        .unwrap();
    bubble_test_fiber(store, host_root_work_in_progress);

    FunctionComponentDeletionHostParentFixture {
        owner,
        list,
        deleted_text,
        deleted_text_state_node,
        deleted_component,
        deleted_component_state_node,
        nested_text,
        nested_text_state_node,
    }
}
pub(super) fn attach_deleted_host_subtree_ref_passive_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    hook_store: &mut FunctionComponentHookRenderStore,
    host_root_work_in_progress: FiberId,
) -> DeletedHostSubtreeRefPassiveFixture {
    let mode = store
        .fiber_arena()
        .get(host_root_work_in_progress)
        .unwrap()
        .mode();
    let deleted_host = create_host_ref_fiber(
        store,
        RefHandle::from_raw(8_701),
        StateNodeHandle::from_raw(8_801),
        FiberFlags::NO,
    );
    let deleted_function = create_function_component_fiber(
        store,
        mode,
        PropsHandle::from_raw(8_702),
        FiberTypeHandle::from_raw(8_902),
    );
    let deleted_text = create_test_fiber(store, FiberTag::HostText, 8_703);
    let deleted_text_state_node = StateNodeHandle::from_raw(8_803);
    store
        .fiber_arena_mut()
        .get_mut(deleted_text)
        .unwrap()
        .set_state_node(deleted_text_state_node);
    store
        .fiber_arena_mut()
        .set_children(deleted_function, &[deleted_text])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(deleted_host, &[deleted_function])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[deleted_host])
        .unwrap();

    let passive_create = callback(8_901);
    let passive_destroy = callback(8_911);
    let passive_dependencies = deps(8_921);
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

    let list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(host_root_work_in_progress, deleted_host)
        .unwrap();
    bubble_test_fiber(store, host_root_work_in_progress);

    DeletedHostSubtreeRefPassiveFixture {
        list,
        deleted_host,
        deleted_host_state_node: StateNodeHandle::from_raw(8_801),
        deleted_host_ref: RefHandle::from_raw(8_701),
        deleted_function,
        deleted_text,
        deleted_text_state_node,
        passive_create,
        passive_destroy,
        passive_dependencies,
    }
}
pub(super) fn attach_nested_deleted_host_subtree_ref_passive_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    hook_store: &mut FunctionComponentHookRenderStore,
    host_root_work_in_progress: FiberId,
) -> NestedDeletedHostSubtreeRefPassiveFixture {
    let mode = store
        .fiber_arena()
        .get(host_root_work_in_progress)
        .unwrap()
        .mode();
    let host_parent = create_test_fiber(store, FiberTag::HostComponent, 8_731);
    let host_parent_state_node = StateNodeHandle::from_raw(8_831);
    store
        .fiber_arena_mut()
        .get_mut(host_parent)
        .unwrap()
        .set_state_node(host_parent_state_node);

    let deleted_host_ref = RefHandle::from_raw(8_732);
    let deleted_host_state_node = StateNodeHandle::from_raw(8_832);
    let deleted_host = create_host_ref_fiber(
        store,
        deleted_host_ref,
        deleted_host_state_node,
        FiberFlags::NO,
    );
    let deleted_function = create_function_component_fiber(
        store,
        mode,
        PropsHandle::from_raw(8_733),
        FiberTypeHandle::from_raw(8_933),
    );
    let nested_host_ref = RefHandle::from_raw(8_734);
    let nested_host_state_node = StateNodeHandle::from_raw(8_834);
    let nested_host = create_host_ref_fiber(
        store,
        nested_host_ref,
        nested_host_state_node,
        FiberFlags::NO,
    );
    let deleted_text = create_test_fiber(store, FiberTag::HostText, 8_735);
    let deleted_text_state_node = StateNodeHandle::from_raw(8_835);
    store
        .fiber_arena_mut()
        .get_mut(deleted_text)
        .unwrap()
        .set_state_node(deleted_text_state_node);
    store
        .fiber_arena_mut()
        .set_children(nested_host, &[deleted_text])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(deleted_function, &[nested_host])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(deleted_host, &[deleted_function])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_parent, &[deleted_host])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[host_parent])
        .unwrap();

    let passive_create = callback(8_934);
    let passive_destroy = callback(8_935);
    let passive_dependencies = deps(8_936);
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

    let list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(host_parent, deleted_host)
        .unwrap();
    bubble_test_fiber(store, host_root_work_in_progress);

    NestedDeletedHostSubtreeRefPassiveFixture {
        host_parent,
        host_parent_state_node,
        list,
        deleted_host,
        deleted_host_state_node,
        deleted_host_ref,
        deleted_function,
        nested_host,
        nested_host_state_node,
        nested_host_ref,
        deleted_text,
        deleted_text_state_node,
        passive_create,
        passive_destroy,
        passive_dependencies,
    }
}
pub(super) fn callback_handles(
    records: &[RootUpdateCallbackRecord],
) -> Vec<RootUpdateCallbackHandle> {
    records.iter().map(|record| record.callback()).collect()
}
pub(super) fn create_host_ref_fiber(
    store: &mut FiberRootStore<RecordingHost>,
    ref_handle: RefHandle,
    state_node: StateNodeHandle,
    flags: FiberFlags,
) -> FiberId {
    let fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::NONE,
        FiberMode::NO,
    );
    let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
    node.set_state_node(state_node);
    node.set_ref_handle(ref_handle);
    node.set_flags(flags);
    fiber
}
pub(super) fn append_host_ref_child(
    store: &mut FiberRootStore<RecordingHost>,
    parent: FiberId,
    ref_handle: RefHandle,
    state_node: StateNodeHandle,
    flags: FiberFlags,
) -> FiberId {
    let child = create_host_ref_fiber(store, ref_handle, state_node, flags);
    store
        .fiber_arena_mut()
        .set_children(parent, &[child])
        .unwrap();
    child
}
pub(super) fn assert_active_ref_token(
    store: &FiberRootStore<RecordingHost>,
    record: &HostRootRefCommitRecord,
) {
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
    let metadata = store
        .host_tokens()
        .metadata(record.token(), record.token_phase(), record.token_target())
        .unwrap();
    assert_eq!(metadata.root_id(), record.root());
    assert_eq!(metadata.phase(), record.token_phase());
    assert_eq!(metadata.target(), record.token_target());
    assert!(metadata.is_active());
}
pub(super) fn assert_dom_ref_callback_gate_is_inert(
    gate: &HostRootDomRefCallbackCommitGateSnapshot,
) {
    assert!(!gate.callback_refs_invoked());
    assert!(!gate.object_refs_mutated());
    assert!(!gate.layout_effects_run());
    assert!(!gate.public_instances_exposed());
    assert!(!gate.react_dom_ref_compatibility_claimed());
    for record in gate.records() {
        assert_eq!(
            record.status(),
            HostRootDomRefCallbackCommitGateStatus::Blocked
        );
        assert_eq!(record.blockers(), &DOM_REF_CALLBACK_GATE_BLOCKERS);
    }
}
pub(super) fn assert_ref_callback_execution_handoff_keeps_public_blockers(
    handoff: &HostRootRefCallbackExecutionHandoffSnapshot,
) {
    assert!(!handoff.callback_refs_invoked());
    assert!(!handoff.object_refs_mutated());
    assert!(!handoff.public_roots_touched());
    assert!(!handoff.root_errors_reported());
    assert!(!handoff.react_dom_ref_compatibility_claimed());
    for record in handoff.records() {
        assert_eq!(
            record.status(),
            HostRootRefCallbackExecutionHandoffStatus::PrivateExecutionHandoff
        );
        assert_eq!(record.blockers(), &REF_CALLBACK_EXECUTION_HANDOFF_BLOCKERS);
    }
}
pub(super) fn assert_ref_cleanup_return_execution_gate_keeps_public_blockers(
    gate: &HostRootRefCleanupReturnExecutionGateSnapshot,
) {
    assert!(!gate.callback_refs_invoked());
    assert!(!gate.cleanup_return_callbacks_invoked());
    assert!(!gate.object_refs_mutated());
    assert!(!gate.public_roots_touched());
    assert!(!gate.root_errors_reported());
    assert!(!gate.react_dom_ref_compatibility_claimed());
    for record in gate.records() {
        assert_eq!(
            record.status(),
            HostRootRefCleanupReturnExecutionGateStatus::TestOnlyExecutionGate
        );
        assert_eq!(
            record.blockers(),
            &REF_CLEANUP_RETURN_EXECUTION_GATE_BLOCKERS
        );
    }
}
pub(super) fn assert_root_update_callback_invocation_gate_is_inert(
    gate: &RootUpdateCallbackInvocationGateSnapshot,
) {
    assert!(!gate.user_callbacks_invoked());
    assert!(!gate.hidden_callbacks_invoked());
    assert!(!gate.public_root_callback_behavior_exposed());
    for record in gate.records() {
        assert_eq!(
            record.status(),
            RootUpdateCallbackInvocationGateStatus::Blocked
        );
        assert_eq!(
            record.blockers(),
            &ROOT_UPDATE_CALLBACK_INVOCATION_GATE_BLOCKERS
        );
        assert_eq!(record.visibility(), RootUpdateCallbackVisibility::Visible);
    }
}
