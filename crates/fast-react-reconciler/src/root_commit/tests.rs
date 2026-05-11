use super::*;
use crate::begin_work::{BeginWorkRequest, unsupported_offscreen_begin_work_record};
use crate::complete_work::{
    HostComponentDangerousHtmlTextResetPayloadKindForCanary,
    HostComponentManagedChildCompleteWorkRecordForCanary,
    HostComponentManagedChildMutationKindForCanary,
    complete_offscreen_visibility_transition_blocker_for_test,
    host_component_dangerous_html_text_reset_complete_work_record_for_canary,
    host_component_managed_child_complete_work_record_for_canary,
    host_component_managed_child_sibling_order_complete_work_record_for_canary,
    offscreen_reveal_commit_metadata_for_test,
};
use crate::function_component::{
    FunctionComponentEffectDependencyPhase, FunctionComponentEffectDependencyStatus,
    FunctionComponentEffectPhase, FunctionComponentEffectRegistration,
    FunctionComponentHookRenderState, FunctionComponentHookRenderStore,
};
use crate::passive_effects::{
    PASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS, PassiveEffectCallbackInvocationErrorHandle,
    PassiveEffectCallbackInvocationGateStatus, PassiveEffectCallbackInvocationKind,
    PassiveEffectCallbackInvocationRequest, PassiveEffectCallbackInvocationStatus,
    PassiveEffectCallbackInvocationTestControl, PassiveEffectsFlushStatus,
    execute_passive_effect_callbacks_after_commit_from_committed_fiber_effects_under_test_control_for_canary,
};
use crate::root_callbacks::{
    ROOT_UPDATE_CALLBACK_INVOCATION_EXECUTION_GATE_BLOCKERS,
    ROOT_UPDATE_CALLBACK_INVOCATION_GATE_BLOCKERS, RootUpdateCallbackInvocationErrorHandle,
    RootUpdateCallbackInvocationExecutionGateStatus, RootUpdateCallbackInvocationGateSnapshot,
    RootUpdateCallbackInvocationGateStatus, RootUpdateCallbackInvocationRequest,
    RootUpdateCallbackInvocationStatus, RootUpdateCallbackInvocationTestControl,
};
use crate::test_support::{FakeContainer, RecordingHost};
use crate::unsupported_features::{OFFSCREEN_UNSUPPORTED_FEATURE, SUSPENSE_UNSUPPORTED_FEATURE};
use crate::{
    RootElementHandle, RootOptions, RootTaskScheduleOutcome, RootUpdateCallbackHandle,
    RootUpdateCallbackRecord, RootUpdateCallbackVisibility, UpdateId, ensure_root_is_scheduled,
    process_root_schedule_in_microtask, render_host_root_for_lanes,
    render_host_root_via_scheduler_callback, update_container,
};
use fast_react_core::{
    DeletionListId, DependenciesHandle, FiberFlags, FiberMode, FiberTag, FiberTypeHandle,
    HookEffectCallbackHandle, HookEffectDependencies, HookEffectFlags, Lane, Lanes, PropsHandle,
    ReactKey, RefHandle, StateHandle, StateNodeHandle,
};
use fast_react_host_config::HostFiberTokenViolation;

fn root_store_with_options(
    options: RootOptions,
) -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(FakeContainer::new(1), options)
        .unwrap();
    (store, root_id, host)
}

fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
    root_store_with_options(RootOptions::new())
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct OffscreenRevealCommitFixture {
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    reveal_metadata: OffscreenRevealCommitMetadataRecord,
    previous_offscreen: FiberId,
    offscreen: FiberId,
    child: FiberId,
    hidden_update: UpdateId,
    hidden_callback: RootUpdateCallbackHandle,
}

fn prepare_offscreen_reveal_commit_fixture(
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

fn attach_offscreen_reveal_commit_child(
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

fn host_root_element(store: &FiberRootStore<RecordingHost>, fiber: FiberId) -> RootElementHandle {
    let state = store.fiber_arena().get(fiber).unwrap().memoized_state();
    store.host_root_states().get(state).unwrap().element()
}

fn attach_host_root_child(
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

fn attach_host_root_children(
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

fn bubble_test_fiber(store: &mut FiberRootStore<RecordingHost>, fiber: FiberId) {
    let bubbled = fast_react_core::bubble_properties(store.fiber_arena(), fiber).unwrap();
    let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
}

fn append_function_component_child(
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

fn create_function_component_fiber(
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

fn callback(raw: u64) -> HookEffectCallbackHandle {
    HookEffectCallbackHandle::from_raw(raw)
}

fn root_callback_error(raw: u64) -> RootUpdateCallbackInvocationErrorHandle {
    RootUpdateCallbackInvocationErrorHandle::from_raw(raw)
}

#[derive(Default)]
struct TestRootUpdateCallbackControl {
    calls: Vec<RootUpdateCallbackInvocationRequest>,
    results: Vec<(
        RootUpdateCallbackHandle,
        Result<(), RootUpdateCallbackInvocationErrorHandle>,
    )>,
}

impl TestRootUpdateCallbackControl {
    fn with_result(
        mut self,
        callback: RootUpdateCallbackHandle,
        result: Result<(), RootUpdateCallbackInvocationErrorHandle>,
    ) -> Self {
        self.results.push((callback, result));
        self
    }

    fn calls(&self) -> &[RootUpdateCallbackInvocationRequest] {
        &self.calls
    }

    fn result(
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
struct TestPassiveEffectCallbackControl {
    calls: Vec<PassiveEffectCallbackInvocationRequest>,
    returned_destroy: Option<HookEffectCallbackHandle>,
}

impl TestPassiveEffectCallbackControl {
    fn with_returned_destroy(mut self, destroy: HookEffectCallbackHandle) -> Self {
        self.returned_destroy = Some(destroy);
        self
    }

    fn calls(&self) -> &[PassiveEffectCallbackInvocationRequest] {
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
struct TestLayoutEffectCallbackControl {
    calls: Vec<FunctionComponentLayoutEffectCallbackInvocationRequest>,
    results: Vec<(
        HookEffectCallbackHandle,
        Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle>,
    )>,
}

impl TestLayoutEffectCallbackControl {
    fn with_result(
        mut self,
        callback: HookEffectCallbackHandle,
        result: Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle>,
    ) -> Self {
        self.results.push((callback, result));
        self
    }

    fn calls(&self) -> &[FunctionComponentLayoutEffectCallbackInvocationRequest] {
        &self.calls
    }

    fn result(
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

fn deps(raw: u64) -> HookEffectDependencies {
    HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
}

fn scheduled_callback_node(
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
struct LayoutEffectExecutionFixture {
    finished_work: FiberId,
    finished_function: FiberId,
    state: FunctionComponentHookRenderState,
    previous_layout: FunctionComponentEffectRegistration,
    previous_passive: FunctionComponentEffectRegistration,
    layout: FunctionComponentEffectRegistration,
    passive: FunctionComponentEffectRegistration,
    queued_passive: FunctionComponentPendingPassiveCommitHandoff,
}

fn prepare_layout_effect_execution_fixture(
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

fn first_effect_list_record(
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
struct DeletionMetadataFixture {
    first_parent: FiberId,
    first_parent_state_node: StateNodeHandle,
    first_list: DeletionListId,
    first_deleted: FiberId,
    first_deleted_state_node: StateNodeHandle,
    second_deleted: FiberId,
    second_deleted_state_node: StateNodeHandle,
    nested_deleted_component: FiberId,
    nested_deleted_component_state_node: StateNodeHandle,
    nested_deleted_component_ref: RefHandle,
    nested_deleted_text: FiberId,
    nested_deleted_text_state_node: StateNodeHandle,
    second_parent: FiberId,
    second_parent_state_node: StateNodeHandle,
    second_list: DeletionListId,
    third_deleted: FiberId,
    third_deleted_state_node: StateNodeHandle,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FunctionComponentDeletionHostParentFixture {
    owner: FiberId,
    list: DeletionListId,
    deleted_text: FiberId,
    deleted_text_state_node: StateNodeHandle,
    deleted_component: FiberId,
    deleted_component_state_node: StateNodeHandle,
    nested_text: FiberId,
    nested_text_state_node: StateNodeHandle,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct DeletedHostSubtreeRefPassiveFixture {
    list: DeletionListId,
    deleted_host: FiberId,
    deleted_host_state_node: StateNodeHandle,
    deleted_host_ref: RefHandle,
    deleted_function: FiberId,
    deleted_text: FiberId,
    deleted_text_state_node: StateNodeHandle,
    passive_create: HookEffectCallbackHandle,
    passive_destroy: HookEffectCallbackHandle,
    passive_dependencies: HookEffectDependencies,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct NestedDeletedHostSubtreeRefPassiveFixture {
    host_parent: FiberId,
    host_parent_state_node: StateNodeHandle,
    list: DeletionListId,
    deleted_host: FiberId,
    deleted_host_state_node: StateNodeHandle,
    deleted_host_ref: RefHandle,
    deleted_function: FiberId,
    nested_host: FiberId,
    nested_host_state_node: StateNodeHandle,
    nested_host_ref: RefHandle,
    deleted_text: FiberId,
    deleted_text_state_node: StateNodeHandle,
    passive_create: HookEffectCallbackHandle,
    passive_destroy: HookEffectCallbackHandle,
    passive_dependencies: HookEffectDependencies,
}

fn create_test_fiber(
    store: &mut FiberRootStore<RecordingHost>,
    tag: FiberTag,
    props: u64,
) -> FiberId {
    store
        .fiber_arena_mut()
        .create_fiber(tag, None, PropsHandle::from_raw(props), FiberMode::NO)
}

fn prepare_host_component_update_wip(
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
struct DangerousHtmlTextResetCommitFixture {
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    current_component: FiberId,
    work_in_progress_component: FiberId,
    state_node: StateNodeHandle,
    old_props: PropsHandle,
    new_props: PropsHandle,
}

fn prepare_dangerous_html_text_reset_commit_fixture(
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
struct ManagedChildCommitFixture {
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    sibling_order_complete_work:
        Option<HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary>,
    current_parent: FiberId,
    work_parent: FiberId,
    child: FiberId,
    order_sibling: Option<FiberId>,
    order_sibling_current: Option<FiberId>,
    parent_state_node: StateNodeHandle,
    child_state_node: StateNodeHandle,
    order_sibling_state_node: StateNodeHandle,
    parent_props: PropsHandle,
    child_props: PropsHandle,
    order_sibling_props: PropsHandle,
    previous_current: FiberId,
    deletion_list: Option<DeletionListId>,
}

fn prepare_managed_child_placement_commit_fixture(
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

fn prepare_managed_child_delete_commit_fixture(
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
struct ManagedChildSiblingOrderCommitFixture {
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    current_parent: FiberId,
    work_parent: FiberId,
    child: FiberId,
    order_sibling: FiberId,
    order_sibling_current: FiberId,
    parent_state_node: StateNodeHandle,
    child_state_node: StateNodeHandle,
    order_sibling_state_node: StateNodeHandle,
    parent_props: PropsHandle,
    child_props: PropsHandle,
    order_sibling_props: PropsHandle,
    previous_current: FiberId,
    deletion_list: Option<DeletionListId>,
}

fn prepare_managed_child_placement_sibling_order_commit_fixture(
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

fn prepare_managed_child_delete_sibling_order_commit_fixture(
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
struct NestedHostParentFixture {
    outer_current: FiberId,
    inner_current: FiberId,
    text_current: FiberId,
    outer_state_node: StateNodeHandle,
    inner_state_node: StateNodeHandle,
    text_state_node: StateNodeHandle,
    outer_props: PropsHandle,
    inner_props: PropsHandle,
    text_props: PropsHandle,
}

fn attach_current_nested_host_parent_fixture(
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

fn prepare_nested_host_parent_placement_wip(
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

fn attach_deletion_metadata_fixture(
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

fn attach_function_component_deletion_host_parent_fixture(
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

fn attach_deleted_host_subtree_ref_passive_fixture(
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

fn attach_nested_deleted_host_subtree_ref_passive_fixture(
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
fn root_commit_recovery_snapshot_preserves_failed_root_lane_and_callback_metadata() {
    let (mut store, root_id, host) = root_store();
    let callback = RootUpdateCallbackHandle::from_raw(450);
    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(4500),
        Some(callback),
    )
    .unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let fixture = attach_deletion_metadata_fixture(&mut store, render.finished_work());
    let parent_node = store
        .fiber_arena_mut()
        .get_mut(fixture.first_parent)
        .unwrap();
    parent_node.set_flags(parent_node.flags() - FiberFlags::CHILD_DELETION);
    let before = host_root_commit_recovery_snapshot_for_canary(&store, render).unwrap();

    let error = commit_finished_host_root(&mut store, render).unwrap_err();
    let after = host_root_commit_recovery_snapshot_for_canary(&store, render).unwrap();

    assert!(matches!(
        error,
        RootCommitError::FiberTopology(FiberTopologyError::DeletionListMissingFlag {
            parent,
            list,
        }) if parent == fixture.first_parent && list == fixture.first_list
    ));
    assert_eq!(before.root(), root_id);
    assert_eq!(before.current(), previous_current);
    assert_eq!(before.render_lanes(), Lanes::DEFAULT);
    assert_eq!(before.pending_lanes(), pending_lanes);
    assert_eq!(
        before.callback_queue(),
        render.work_in_progress_update_queue()
    );
    assert_eq!(before.visible_callback_count(), 1);
    assert_eq!(before.hidden_callback_count(), 0);
    assert_eq!(before.deferred_hidden_callback_count(), 0);
    assert_eq!(
        callback_handles(before.root_update_callbacks().visible()),
        vec![callback]
    );
    assert!(after.preserves_lane_and_callback_metadata_from(&before));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        pending_lanes
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
fn root_commit_clears_consumed_render_and_callback_bookkeeping() {
    let (mut store, root_id, host) = root_store();
    let callback_node = scheduled_callback_node(&mut store, root_id);

    let render_result =
        render_host_root_via_scheduler_callback(&mut store, root_id, callback_node, Lanes::DEFAULT)
            .unwrap();
    let render = render_result.render_phase().unwrap();
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render.work_in_progress())
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        callback_node
    );

    commit_finished_host_root(&mut store, render).unwrap();
    let scheduling = store.root(root_id).unwrap().scheduling();

    assert_eq!(scheduling.work_in_progress(), None);
    assert_eq!(scheduling.work_in_progress_root_render_lanes(), Lanes::NO);
    assert_eq!(
        scheduling.render_exit_status(),
        RootRenderExitStatus::NoWork
    );
    assert!(scheduling.callback_node().is_none());
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
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
fn root_commit_dangerous_html_text_reset_handoff_validates_complete_work_before_commit() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_dangerous_html_text_reset_commit_fixture(
        &mut store,
        root_id,
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml,
        9_880,
    );

    let handoff = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        92,
        93,
    )
    .unwrap();
    let request = *handoff.execution_request();
    let mutation = handoff.mutation();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.source_handoff_order(), 91);
    assert_eq!(handoff.commit_order(), 92);
    assert_eq!(handoff.request_order(), 93);
    assert_eq!(
        handoff.payload_kind(),
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml
    );
    assert_eq!(handoff.payload_kind_name(), "dangerous-html");
    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), fixture.render.current());
    assert_eq!(request.finished_work(), fixture.render.finished_work());
    assert_eq!(request.committed_current(), fixture.render.finished_work());
    assert_eq!(request.mutation_index(), 0);
    assert_eq!(request.mutation(), mutation);
    assert_eq!(request.complete_work(), fixture.complete_work);
    assert_eq!(
        request.payload_kind(),
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml
    );
    assert_eq!(
        request.status(),
        HostRootDangerousHtmlTextResetCommitExecutionStatusForCanary::ValidatedForTestHostMutation
    );
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_DANGEROUS_HTML_TEXT_RESET_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(request.private_test_host_mutation_allowed());
    assert!(request.public_root_rendering_blocked());
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_dom_compatibility_claimed());
    assert!(!request.test_renderer_compatibility_claimed());
    assert!(handoff.complete_metadata_matches_mutation());
    assert!(handoff.private_test_host_mutation_allowed());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.public_renderer_mutation_blocked());
    assert!(!handoff.public_dom_compatibility_claimed());
    assert!(!handoff.test_renderer_compatibility_claimed());
    assert_eq!(mutation.root(), root_id);
    assert_eq!(mutation.host_root(), fixture.render.finished_work());
    assert_eq!(mutation.fiber(), fixture.work_in_progress_component);
    assert_eq!(mutation.alternate_fiber(), Some(fixture.current_component));
    assert_eq!(mutation.state_node(), fixture.state_node);
    assert_eq!(mutation.pending_props(), fixture.new_props);
    assert_eq!(mutation.memoized_props(), fixture.new_props);
    assert_eq!(mutation.alternate_memoized_props(), Some(fixture.old_props));
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(handoff.commit().mutation_apply_log().len(), 1);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_dangerous_html_text_reset_handoff_rejects_stale_complete_work_before_switching_current()
 {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_dangerous_html_text_reset_commit_fixture(
        &mut store,
        root_id,
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::TextContentReset,
        9_900,
    );
    let previous_current = store.root(root_id).unwrap().current();
    let stale_complete_work = fixture
        .complete_work
        .with_new_props_for_canary(PropsHandle::from_raw(99_903));

    let error = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_complete_work,
        0,
        94,
        95,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::MetadataPropsMismatch {
            root,
            fiber,
            expected_old_props,
            expected_new_props,
            actual_pending_props,
            actual_memoized_props,
            ..
        } if root == root_id
            && fiber == fixture.work_in_progress_component
            && expected_old_props == fixture.old_props
            && expected_new_props == PropsHandle::from_raw(99_903)
            && actual_pending_props == fixture.new_props
            && actual_memoized_props == fixture.new_props
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_placement_handoff_validates_before_commit() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_placement_commit_fixture(&mut store, root_id, 29_100);

    let handoff = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        122,
        123,
    )
    .unwrap();
    let request = *handoff.execution_request();
    let mutation = handoff.mutation();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.source_handoff_order(), 121);
    assert_eq!(handoff.commit_order(), 122);
    assert_eq!(handoff.request_order(), 123);
    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(handoff.kind_name(), "managed-child-placement");
    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), fixture.previous_current);
    assert_eq!(request.finished_work(), fixture.render.finished_work());
    assert_eq!(request.committed_current(), fixture.render.finished_work());
    assert_eq!(request.mutation_index(), 0);
    assert_eq!(request.mutation(), mutation);
    assert_eq!(request.complete_work(), fixture.complete_work);
    assert_eq!(
        request.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(
        request.status(),
        HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
    );
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(request.private_test_host_mutation_allowed());
    assert!(request.public_root_rendering_blocked());
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_dom_compatibility_claimed());
    assert!(!request.test_renderer_compatibility_claimed());
    assert!(!request.hydration_events_refs_resources_forms_claimed());
    assert_eq!(handoff.complete_work(), fixture.complete_work);
    assert!(handoff.complete_metadata_matches_mutation());
    assert!(handoff.private_test_host_mutation_allowed());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.public_renderer_mutation_blocked());
    assert!(!handoff.public_dom_compatibility_claimed());
    assert!(!handoff.test_renderer_compatibility_claimed());
    assert_eq!(mutation.root(), root_id);
    assert_eq!(mutation.host_root(), fixture.render.finished_work());
    assert_eq!(
        mutation.source(),
        HostRootMutationApplyRecordSource::MutationPhase(
            HostRootMutationPhaseRecordKind::Placement
        )
    );
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent
    );
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_tag(), FiberTag::HostComponent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.alternate_fiber(), None);
    assert_eq!(mutation.tag(), FiberTag::HostComponent);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(mutation.pending_props(), fixture.child_props);
    assert_eq!(mutation.memoized_props(), fixture.child_props);
    assert_eq!(mutation.effect_flag(), FiberFlags::PLACEMENT);
    assert_eq!(
        mutation.placement_sibling().unwrap().status(),
        HostRootPlacementSiblingStatus::Append
    );
    assert_eq!(handoff.commit().mutation_apply_log().len(), 1);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_delete_handoff_validates_before_commit() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_delete_commit_fixture(&mut store, root_id, 29_200);

    let handoff = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        132,
        133,
    )
    .unwrap();
    let request = *handoff.execution_request();
    let mutation = handoff.mutation();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.source_handoff_order(), 131);
    assert_eq!(handoff.commit_order(), 132);
    assert_eq!(handoff.request_order(), 133);
    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(handoff.kind_name(), "managed-child-delete-detach");
    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), fixture.previous_current);
    assert_eq!(request.finished_work(), fixture.render.finished_work());
    assert_eq!(request.committed_current(), fixture.render.finished_work());
    assert_eq!(request.mutation_index(), 0);
    assert_eq!(request.mutation(), mutation);
    assert_eq!(request.complete_work(), fixture.complete_work);
    assert_eq!(
        request.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(
        request.status(),
        HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
    );
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(request.private_test_host_mutation_allowed());
    assert!(request.public_root_rendering_blocked());
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_dom_compatibility_claimed());
    assert!(!request.test_renderer_compatibility_claimed());
    assert!(!request.hydration_events_refs_resources_forms_claimed());
    assert!(handoff.complete_metadata_matches_mutation());
    assert!(handoff.private_test_host_mutation_allowed());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.public_renderer_mutation_blocked());
    assert!(!handoff.public_dom_compatibility_claimed());
    assert!(!handoff.test_renderer_compatibility_claimed());
    assert_eq!(mutation.root(), root_id);
    assert_eq!(mutation.host_root(), fixture.render.finished_work());
    assert_eq!(
        mutation.source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.deletion_list.unwrap())
    );
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_tag(), FiberTag::HostComponent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.alternate_fiber(), None);
    assert_eq!(mutation.tag(), FiberTag::HostComponent);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(mutation.pending_props(), fixture.child_props);
    assert_eq!(mutation.memoized_props(), fixture.child_props);
    assert_eq!(mutation.effect_flag(), FiberFlags::CHILD_DELETION);
    assert_eq!(mutation.placement_sibling(), None);
    assert_eq!(handoff.commit().mutation_apply_log().len(), 1);
    assert_eq!(handoff.commit().deletion_lists().len(), 1);
    assert_eq!(
        handoff.commit().deletion_lists()[0].list(),
        fixture.deletion_list.unwrap()
    );
    assert_eq!(
        handoff.commit().deletion_lists()[0].deleted(),
        &[fixture.child]
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_handoff_rejects_foreign_root_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_placement_commit_fixture(&mut store, root_id, 29_300);
    let foreign_root = FiberRootId::new(root_id.raw() + 1).unwrap();
    let foreign_complete_work = fixture.complete_work.with_root_for_canary(foreign_root);

    let error = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        foreign_complete_work,
        0,
        142,
        143,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataRootMismatch {
            expected_root,
            actual_root,
        } if expected_root == root_id && actual_root == foreign_root
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_handoff_rejects_mismatched_child_state_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_delete_commit_fixture(&mut store, root_id, 29_400);
    let stale_state_node = StateNodeHandle::from_raw(29_499);
    let stale_complete_work = fixture
        .complete_work
        .with_child_state_node_for_canary(stale_state_node);

    let error = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_complete_work,
        0,
        152,
        153,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildStateNodeMismatch {
            root,
            child,
            expected_state_node,
            actual_state_node,
        } if root == root_id
            && child == fixture.child
            && expected_state_node == stale_state_node
            && actual_state_node == fixture.child_state_node
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_handoff_rejects_stale_props_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_placement_commit_fixture(&mut store, root_id, 29_500);
    let stale_props = PropsHandle::from_raw(29_599);
    let stale_complete_work = fixture
        .complete_work
        .with_child_memoized_props_for_canary(stale_props);

    let error = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_complete_work,
        0,
        162,
        163,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildPropsMismatch {
            root,
            child,
            expected_pending_props,
            expected_memoized_props,
            actual_pending_props,
            actual_memoized_props,
        } if root == root_id
            && child == fixture.child
            && expected_pending_props == fixture.child_props
            && expected_memoized_props == stale_props
            && actual_pending_props == fixture.child_props
            && actual_memoized_props == fixture.child_props
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_handoff_rejects_tampered_parent_state_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_placement_commit_fixture(&mut store, root_id, 29_600);
    let tampered_parent_state_node = StateNodeHandle::from_raw(29_699);
    let tampered_complete_work = fixture
        .complete_work
        .with_parent_state_node_for_canary(tampered_parent_state_node);

    let error = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        tampered_complete_work,
        0,
        172,
        173,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataParentStateNodeMismatch {
            root,
            parent,
            expected_state_node,
            actual_state_node,
        } if root == root_id
            && parent == fixture.work_parent
            && expected_state_node == tampered_parent_state_node
            && actual_state_node == fixture.parent_state_node
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_handoff_rejects_tampered_delete_list_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_delete_commit_fixture(&mut store, root_id, 29_700);
    let actual_deletion_list = fixture.deletion_list.unwrap();
    let tampered_deletion_list = DeletionListId::new(
        actual_deletion_list.arena_id(),
        actual_deletion_list.index() + 1,
    );
    let tampered_complete_work = fixture
        .complete_work
        .with_deletion_list_for_canary(Some(tampered_deletion_list));

    let error = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        tampered_complete_work,
        0,
        182,
        183,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataDeletionListMismatch {
            root,
            fiber,
            expected,
            actual,
        } if root == root_id
            && fiber == fixture.child
            && expected == Some(tampered_deletion_list)
            && actual == HostRootMutationApplyRecordSource::DeletionList(actual_deletion_list)
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_sibling_order_placement_handoff_validates_insert_before() {
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_placement_sibling_order_commit_fixture(&mut store, root_id, 29_800);

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        222,
        223,
    )
    .unwrap();
    let request = *handoff.execution_request();
    let mutation = handoff.mutation();
    let placement_sibling = mutation.placement_sibling().unwrap();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.source_handoff_order(), 221);
    assert_eq!(handoff.commit_order(), 222);
    assert_eq!(handoff.request_order(), 223);
    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(handoff.order_evidence_name(), "next-sibling");
    assert_eq!(handoff.order_sibling(), fixture.order_sibling);
    assert_eq!(
        handoff.order_sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), fixture.previous_current);
    assert_eq!(request.finished_work(), fixture.render.finished_work());
    assert_eq!(request.committed_current(), fixture.render.finished_work());
    assert_eq!(request.mutation_index(), 0);
    assert_eq!(request.mutation(), mutation);
    assert_eq!(request.complete_work(), fixture.complete_work);
    assert_eq!(request.order_sibling(), fixture.order_sibling);
    assert_eq!(
        request.order_sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(request.order_evidence_name(), "next-sibling");
    assert_eq!(
        request.status(),
        HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
    );
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(request.private_test_host_mutation_allowed());
    assert!(request.public_root_rendering_blocked());
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_dom_compatibility_claimed());
    assert!(!request.test_renderer_compatibility_claimed());
    assert!(!request.hydration_events_refs_resources_forms_claimed());
    assert!(handoff.complete_metadata_matches_mutation());
    assert!(handoff.private_test_host_mutation_allowed());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.public_renderer_mutation_blocked());
    assert!(!handoff.public_dom_compatibility_claimed());
    assert!(!handoff.test_renderer_compatibility_claimed());
    assert_eq!(
        mutation.source(),
        HostRootMutationApplyRecordSource::MutationPhase(
            HostRootMutationPhaseRecordKind::Placement
        )
    );
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    );
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_tag(), FiberTag::HostComponent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.alternate_fiber(), None);
    assert_eq!(mutation.tag(), FiberTag::HostComponent);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(mutation.pending_props(), fixture.child_props);
    assert_eq!(mutation.memoized_props(), fixture.child_props);
    assert_eq!(mutation.effect_flag(), FiberFlags::PLACEMENT);
    assert_eq!(
        placement_sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(placement_sibling.sibling(), Some(fixture.order_sibling));
    assert_eq!(
        placement_sibling.sibling_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(
        placement_sibling.sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(placement_sibling.skipped_pending_sibling_count(), 0);
    assert!(placement_sibling.can_insert_before());
    assert_eq!(handoff.commit().mutation_apply_log().len(), 1);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_sibling_order_delete_handoff_validates_previous_sibling() {
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_delete_sibling_order_commit_fixture(&mut store, root_id, 29_900);

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        232,
        233,
    )
    .unwrap();
    let request = *handoff.execution_request();
    let mutation = handoff.mutation();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.source_handoff_order(), 231);
    assert_eq!(handoff.commit_order(), 232);
    assert_eq!(handoff.request_order(), 233);
    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(handoff.order_evidence_name(), "previous-sibling");
    assert_eq!(handoff.order_sibling(), fixture.order_sibling);
    assert_eq!(request.order_evidence_name(), "previous-sibling");
    assert_eq!(request.order_sibling(), fixture.order_sibling);
    assert_eq!(
        request.status(),
        HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
    );
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(handoff.complete_metadata_matches_mutation());
    assert_eq!(
        mutation.source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.deletion_list.unwrap())
    );
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_tag(), FiberTag::HostComponent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.tag(), FiberTag::HostComponent);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(mutation.pending_props(), fixture.child_props);
    assert_eq!(mutation.memoized_props(), fixture.child_props);
    assert_eq!(mutation.effect_flag(), FiberFlags::CHILD_DELETION);
    assert_eq!(mutation.placement_sibling(), None);
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.order_sibling_current)
            .unwrap()
            .sibling(),
        Some(fixture.child)
    );
    assert_eq!(handoff.commit().mutation_apply_log().len(), 1);
    assert_eq!(handoff.commit().deletion_lists().len(), 1);
    assert_eq!(
        handoff.commit().deletion_lists()[0].list(),
        fixture.deletion_list.unwrap()
    );
    assert_eq!(
        handoff.commit().deletion_lists()[0].deleted(),
        &[fixture.child]
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_sibling_order_rejects_tampered_order_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_placement_sibling_order_commit_fixture(&mut store, root_id, 30_000);
    store
        .fiber_arena_mut()
        .set_children(fixture.work_parent, &[fixture.order_sibling, fixture.child])
        .unwrap();

    let error = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        242,
        243,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingMismatch {
            root,
            fiber,
            expected_sibling,
            actual_sibling,
        } if root == root_id
            && fiber == fixture.child
            && expected_sibling == fixture.order_sibling
            && actual_sibling == None
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_sibling_order_rejects_foreign_root_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_placement_sibling_order_commit_fixture(&mut store, root_id, 30_050);
    let foreign_root = FiberRootId::new(root_id.raw() + 1).unwrap();
    let foreign_complete_work = fixture.complete_work.with_root_for_canary(foreign_root);

    let error = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        foreign_complete_work,
        0,
        247,
        248,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataRootMismatch {
            expected_root,
            actual_root,
        } if expected_root == root_id && actual_root == foreign_root
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_sibling_order_rejects_tampered_parent_state_before_switching_current()
{
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_placement_sibling_order_commit_fixture(&mut store, root_id, 30_075);
    let stale_parent_state_node = StateNodeHandle::from_raw(30_079);
    let stale_parent = fixture
        .complete_work
        .with_parent_state_node_for_canary(stale_parent_state_node);

    let error = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_parent,
        0,
        249,
        250,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataParentStateNodeMismatch {
            root,
            parent,
            expected_state_node,
            actual_state_node,
        } if root == root_id
            && parent == fixture.work_parent
            && expected_state_node == stale_parent_state_node
            && actual_state_node == fixture.parent_state_node
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_sibling_order_rejects_tampered_child_state_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_placement_sibling_order_commit_fixture(&mut store, root_id, 30_090);
    let stale_child_state_node = StateNodeHandle::from_raw(30_099);
    let stale_child = fixture
        .complete_work
        .with_child_state_node_for_canary(stale_child_state_node);

    let error = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_child,
        0,
        250,
        251,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildStateNodeMismatch {
            root,
            child,
            expected_state_node,
            actual_state_node,
        } if root == root_id
            && child == fixture.child
            && expected_state_node == stale_child_state_node
            && actual_state_node == fixture.child_state_node
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_sibling_order_rejects_tampered_sibling_state_before_switching_current()
{
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_placement_sibling_order_commit_fixture(&mut store, root_id, 30_100);
    let stale_state_node = StateNodeHandle::from_raw(30_199);
    let stale_sibling = fixture
        .complete_work
        .with_order_sibling_state_node_for_canary(stale_state_node);

    let error = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_sibling,
        0,
        252,
        253,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingStateNodeMismatch {
            root,
            sibling,
            expected_state_node,
            actual_state_node,
        } if root == root_id
            && sibling == fixture.order_sibling
            && expected_state_node == stale_state_node
            && actual_state_node == fixture.order_sibling_state_node
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_managed_child_sibling_order_rejects_tampered_delete_list_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_delete_sibling_order_commit_fixture(&mut store, root_id, 30_200);
    let actual_deletion_list = fixture.deletion_list.unwrap();
    let tampered_deletion_list = DeletionListId::new(
        actual_deletion_list.arena_id(),
        actual_deletion_list.index() + 1,
    );
    let stale_delete_list = fixture
        .complete_work
        .with_deletion_list_for_canary(Some(tampered_deletion_list));

    let error = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_delete_list,
        0,
        262,
        263,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataDeletionListMismatch {
            root,
            fiber,
            expected,
            actual,
        } if root == root_id
            && fiber == fixture.child
            && expected == Some(tampered_deletion_list)
            && actual == HostRootMutationApplyRecordSource::DeletionList(actual_deletion_list)
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_offscreen_reveal_complete_metadata_handoff_records_private_commit_proof() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_offscreen_reveal_commit_fixture(
        &mut store,
        root_id,
        RootElementHandle::from_raw(8_610),
        true,
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN),
        FiberTag::HostComponent,
    );

    let handoff = commit_offscreen_reveal_complete_metadata_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.reveal_metadata.clone(),
        2,
    )
    .unwrap();

    assert_eq!(handoff.pending(), fixture.pending);
    assert_eq!(handoff.reveal_metadata(), &fixture.reveal_metadata);
    assert_eq!(handoff.commit_order(), 2);
    assert_eq!(handoff.finished_work_handoff().commit_order(), 2);
    assert_eq!(
        handoff.current_after_commit(),
        fixture.render.finished_work()
    );
    assert!(handoff.consumed_finished_work_record());
    assert!(handoff.complete_metadata_matches_commit());
    assert!(handoff.visibility_commit_work_blocked());
    assert!(handoff.passive_visibility_effects_deferred());
    assert!(handoff.public_compatibility_blocked());
    assert!(handoff.public_passive_compatibility_blocked());
    assert_eq!(handoff.commit().root(), root_id);
    assert_eq!(
        handoff.commit().previous_current(),
        fixture.render.current()
    );
    assert_eq!(
        handoff.commit().finished_work(),
        fixture.render.finished_work()
    );
    assert_eq!(
        handoff.commit().finished_lanes(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert!(handoff.commit().mutation_log().is_empty());
    assert!(handoff.commit().mutation_apply_log().is_empty());

    let request = handoff.execution_request();
    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), fixture.render.current());
    assert_eq!(request.finished_work(), fixture.render.finished_work());
    assert_eq!(
        request.render_lanes(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(request.pending_lanes_before_commit(), Lanes::DEFAULT);
    assert_eq!(request.source_handoff_order(), 1);
    assert_eq!(request.request_order(), 2);
    assert_eq!(request.hidden_update_lane(), Lane::DEFAULT);
    assert_eq!(request.hidden_update_count(), 1);
    assert_eq!(request.offscreen(), fixture.offscreen);
    assert_eq!(request.child(), fixture.child);
    assert_eq!(request.child_tag(), FiberTag::HostComponent);
    assert_eq!(request.committed_lanes(), request.render_lanes());
    assert_eq!(
        request.status(),
        HostRootOffscreenRevealCommitExecutionStatusForCanary::ValidatedForCommitHandoff
    );
    assert!(request.execution_requested());
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_OFFSCREEN_REVEAL_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(request.committed_lanes_match_render());
    assert!(request.offscreen_lane_metadata_recorded());
    assert!(request.hidden_to_visible_reveal());
    assert!(request.host_visibility_mutation_blocked());
    assert!(request.passive_visibility_effects_blocked());
    assert!(request.passive_visibility_effects_deferred());
    assert!(request.newly_visible_suspensey_commit_traversal_blocked());
    assert!(request.would_accumulate_newly_visible_suspensey_commit());
    assert!(request.public_offscreen_compatibility_blocked());
    assert!(request.public_activity_compatibility_blocked());
    assert!(request.public_root_rendering_blocked());
    assert!(request.public_compatibility_claim_blocked());
    assert!(request.public_passive_compatibility_blocked());
    assert_eq!(
        request.actual_candidate_subtree_flags(),
        fixture.reveal_metadata.candidate_subtree_flags()
    );
    assert!(
        request
            .actual_child_flags()
            .contains_all(FiberFlags::PLACEMENT | FiberFlags::MAY_SUSPEND_COMMIT)
    );
    assert_eq!(request.actual_child_subtree_flags(), FiberFlags::NO);
    assert_eq!(
        fixture.reveal_metadata.transition().previous(),
        fixture.previous_offscreen
    );
    assert_eq!(
        store
            .update_queues()
            .update(fixture.hidden_update)
            .unwrap()
            .lane(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_offscreen_hidden_update_is_deferred_then_revealed_with_lane_metadata() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_offscreen_reveal_commit_fixture(
        &mut store,
        root_id,
        RootElementHandle::from_raw(8_615),
        true,
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN),
        FiberTag::HostText,
    );
    let before_commit_callbacks = store
        .update_queues()
        .peek_root_update_callback_records(fixture.render.work_in_progress_update_queue())
        .unwrap();

    assert!(before_commit_callbacks.visible().is_empty());
    assert_eq!(
        callback_handles(before_commit_callbacks.hidden()),
        vec![fixture.hidden_callback]
    );
    assert!(before_commit_callbacks.deferred_hidden().is_empty());
    assert_eq!(
        before_commit_callbacks.hidden()[0].update(),
        fixture.hidden_update
    );
    assert_eq!(
        before_commit_callbacks.hidden()[0].visibility(),
        RootUpdateCallbackVisibility::Hidden
    );

    let handoff = commit_offscreen_reveal_complete_metadata_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.reveal_metadata.clone(),
        3,
    )
    .unwrap();

    assert!(handoff.proves_hidden_update_deferred_and_revealed_through_commit_metadata());
    assert!(handoff.deferred_hidden_update_callbacks_match_reveal_metadata());
    assert!(handoff.complete_metadata_matches_commit());
    assert_eq!(handoff.commit_order(), 3);

    let request = handoff.execution_request();
    assert_eq!(request.hidden_update_lane(), Lane::DEFAULT);
    assert_eq!(request.hidden_update_count(), 1);
    assert!(request.offscreen_lane_metadata_recorded());
    assert!(request.hidden_to_visible_reveal());
    assert_eq!(
        request.render_lanes(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(request.committed_lanes(), request.render_lanes());
    assert!(request.committed_lanes_match_render());

    let callbacks = handoff.commit().root_update_callbacks();
    assert!(callbacks.visible().is_empty());
    assert!(callbacks.hidden().is_empty());
    assert_eq!(
        callback_handles(callbacks.deferred_hidden()),
        vec![fixture.hidden_callback]
    );
    assert_eq!(
        callbacks.deferred_hidden()[0].update(),
        fixture.hidden_update
    );
    assert_eq!(
        callbacks.deferred_hidden()[0].visibility(),
        RootUpdateCallbackVisibility::DeferredHidden
    );

    let diagnostics = handoff
        .commit()
        .root_update_callback_drain_snapshot_for_canary(
            &store,
            handoff.commit_order(),
            request.render_lanes(),
        )
        .unwrap();

    assert_eq!(diagnostics.root(), root_id);
    assert_eq!(diagnostics.commit_order(), handoff.commit_order());
    assert_eq!(diagnostics.render_lanes(), request.render_lanes());
    assert_eq!(diagnostics.finished_lanes(), request.render_lanes());
    assert_eq!(diagnostics.pending_lanes_after_commit(), Lanes::NO);
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics.visible_callback_count(), 0);
    assert_eq!(diagnostics.hidden_callback_count(), 1);
    assert!(diagnostics.records_match_commit_lanes());
    assert!(diagnostics.hidden_callbacks_deferred_without_invocation());
    assert!(diagnostics.proves_deterministic_lane_order());
    assert!(!diagnostics.public_callbacks_invoked());
    assert!(!diagnostics.public_root_callback_behavior_exposed());

    let record = diagnostics.records()[0];
    assert_eq!(record.update(), fixture.hidden_update);
    assert_eq!(record.callback(), fixture.hidden_callback);
    assert_eq!(
        record.visibility(),
        RootUpdateCallbackVisibility::DeferredHidden
    );
    assert_eq!(
        record.update_lanes(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(record.callback_lanes(), Lanes::DEFAULT);
    assert!(record.update_lanes_include_offscreen());
    assert!(record.callback_lanes_match_commit());
    assert!(!record.public_callback_invoked());
    assert!(!record.public_root_callback_behavior_exposed());
    assert_eq!(
        store
            .update_queues()
            .update(fixture.hidden_update)
            .unwrap()
            .lane(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_offscreen_reveal_complete_metadata_requires_retained_offscreen_lane() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_offscreen_reveal_commit_fixture(
        &mut store,
        root_id,
        RootElementHandle::from_raw(8_620),
        false,
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN),
        FiberTag::HostText,
    );
    let previous_current = fixture.render.current();

    let error = commit_offscreen_reveal_complete_metadata_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.reveal_metadata,
        2,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostRootOffscreenRevealCommitHandoffErrorForCanary::OffscreenLaneMetadataMissing {
            root: root_id,
            pending_lanes_before_commit: Lanes::DEFAULT,
            render_lanes: Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN),
        }
    );
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_offscreen_reveal_complete_metadata_rejects_stale_records_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
    let fixture = prepare_offscreen_reveal_commit_fixture(
        &mut store,
        root_id,
        RootElementHandle::from_raw(8_630),
        true,
        Lanes::DEFAULT,
        FiberTag::HostComponent,
    );
    let previous_current = fixture.render.current();

    assert_eq!(
        commit_offscreen_reveal_complete_metadata_handoff_for_canary(
            &mut store,
            fixture.render,
            Some(fixture.pending),
            fixture.reveal_metadata,
            2,
        )
        .unwrap_err(),
        HostRootOffscreenRevealCommitHandoffErrorForCanary::RevealCommitLanesMismatch {
            root: root_id,
            expected_render_lanes: lanes,
            expected_finished_lanes: lanes,
            actual_committed_lanes: Lanes::DEFAULT,
        }
    );
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());

    let (mut store, root_id, host) = root_store();
    let fixture = prepare_offscreen_reveal_commit_fixture(
        &mut store,
        root_id,
        RootElementHandle::from_raw(8_640),
        true,
        lanes,
        FiberTag::HostText,
    );
    let previous_current = fixture.render.current();
    store
        .fiber_arena_mut()
        .get_mut(fixture.child)
        .unwrap()
        .merge_flags(FiberFlags::UPDATE);

    match commit_offscreen_reveal_complete_metadata_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.reveal_metadata.clone(),
        2,
    )
    .unwrap_err()
    {
        HostRootOffscreenRevealCommitHandoffErrorForCanary::StaleRevealChildFlags {
            offscreen,
            child,
            expected_candidate_subtree_flags,
            actual_candidate_subtree_flags,
        } => {
            assert_eq!(offscreen, fixture.offscreen);
            assert_eq!(child, fixture.child);
            assert_eq!(
                expected_candidate_subtree_flags,
                fixture.reveal_metadata.candidate_subtree_flags()
            );
            assert!(
                actual_candidate_subtree_flags
                    .contains_all(FiberFlags::PLACEMENT | FiberFlags::UPDATE)
            );
        }
        other => panic!("expected stale reveal child flags, got {other:?}"),
    }
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
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

#[test]
fn root_commit_error_option_callback_record_preserves_handles_without_callbacks() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(
            FakeContainer::new(1),
            RootOptions::new()
                .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(61))
                .with_on_caught_error(RootErrorCallbackHandle::from_raw(62))
                .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(63)),
        )
        .unwrap();
    let wrong_root = FiberRootId::new(root_id.raw() + 1).unwrap();
    update_container(&mut store, root_id, RootElementHandle::from_raw(7), None).unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .prepare_pending_passive(wrong_root, Lanes::DEFAULT);

    let error = commit_finished_host_root(&mut store, render).unwrap_err();
    let record = record_root_commit_error_option_callbacks(
        &store,
        root_id,
        Some(render.finished_work()),
        render.render_lanes(),
        error,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(record.finished_work(), Some(render.finished_work()));
    assert_eq!(record.finished_lanes(), Lanes::DEFAULT);
    assert!(matches!(
        record.error(),
        RootCommitError::PendingPassiveRootMismatch { root, pending_root }
            if *root == root_id && *pending_root == wrong_root
    ));
    assert_eq!(
        record.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(61)
    );
    assert_eq!(
        record.on_caught_error(),
        RootErrorCallbackHandle::from_raw(62)
    );
    assert_eq!(
        record.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(63)
    );
    let callbacks = record.error_option_callbacks();
    assert_eq!(callbacks.root(), root_id);
    assert_eq!(callbacks.phase(), RootErrorOptionCallbackPhase::Commit);
    assert!(record.has_configured_error_callback());
    assert!(!record.root_error_callbacks_invoked());
    assert!(!record.public_error_boundaries_enabled());
    assert!(!record.recoverable_error_compatibility_claimed());
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert!(host.operations().is_empty());
}

#[test]
fn root_commit_render_failure_evidence_preserves_error_handles_without_callbacks() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(
            FakeContainer::new(1),
            RootOptions::new()
                .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(71))
                .with_on_caught_error(RootErrorCallbackHandle::from_raw(72))
                .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(73)),
        )
        .unwrap();
    let callbacks = store
        .root(root_id)
        .unwrap()
        .options()
        .error_option_callback_record(root_id, RootErrorOptionCallbackPhase::Render);

    let evidence = host_root_render_failure_recovery_commit_evidence_for_canary(
        root_id,
        Lanes::SYNC,
        callbacks,
    );

    assert_eq!(evidence.root(), root_id);
    assert_eq!(evidence.render_lanes(), Lanes::SYNC);
    assert_eq!(evidence.error_option_callbacks(), callbacks);
    assert_eq!(
        evidence.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(71)
    );
    assert_eq!(
        evidence.on_caught_error(),
        RootErrorCallbackHandle::from_raw(72)
    );
    assert_eq!(
        evidence.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(73)
    );
    assert!(evidence.has_configured_error_callback());
    assert!(evidence.accepted_render_failure_metadata());
    assert!(!evidence.commit_attempted());
    assert!(!evidence.root_current_switched());
    assert!(!evidence.retried_public_work());
    assert!(!evidence.invoked_public_callbacks());
    assert!(!evidence.root_error_callbacks_invoked());
    assert!(!evidence.public_error_boundaries_enabled());
    assert!(!evidence.recoverable_error_compatibility_claimed());
    assert!(host.operations().is_empty());
}

#[test]
fn root_commit_hands_off_visible_root_update_callback_records() {
    let (mut store, root_id, host) = root_store();
    let callback = RootUpdateCallbackHandle::from_raw(77);
    let update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(12),
        Some(callback),
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let callbacks = commit.root_update_callbacks();

    assert_eq!(callbacks.queue(), render.work_in_progress_update_queue());
    assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
    assert_eq!(
        callbacks.visible()[0].queue(),
        render.work_in_progress_update_queue()
    );
    assert_eq!(callbacks.visible()[0].update(), update.update());
    assert_eq!(callbacks.visible()[0].sequence(), 0);
    assert_eq!(
        callbacks.visible()[0].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert!(callbacks.hidden().is_empty());
    assert!(callbacks.deferred_hidden().is_empty());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.work_in_progress()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_records_visible_callback_invocation_gate_without_invoking_callbacks() {
    let (mut store, root_id, host) = root_store();
    let first_callback = RootUpdateCallbackHandle::from_raw(177);
    let hidden_callback = RootUpdateCallbackHandle::from_raw(178);
    let second_callback = RootUpdateCallbackHandle::from_raw(179);
    let first = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(17),
        Some(first_callback),
    )
    .unwrap();
    let hidden = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(18),
        Some(hidden_callback),
    )
    .unwrap();
    let second = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(19),
        Some(second_callback),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(hidden.update())
        .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let callbacks = commit.root_update_callbacks();
    let gate = commit.root_update_callback_invocation_gate();
    let records = gate.records();
    let current_queue = store
        .fiber_arena()
        .get(commit.current())
        .unwrap()
        .update_queue();
    let after_commit = store
        .update_queues()
        .peek_root_update_callback_records(current_queue)
        .unwrap();

    assert_eq!(
        callback_handles(callbacks.visible()),
        vec![first_callback, second_callback]
    );
    assert!(callbacks.hidden().is_empty());
    assert_eq!(
        callback_handles(callbacks.deferred_hidden()),
        vec![hidden_callback]
    );
    assert_eq!(gate.len(), 2);
    assert_eq!(gate.hidden_record_count(), 0);
    assert_eq!(gate.deferred_hidden_record_count(), 1);
    assert_root_update_callback_invocation_gate_is_inert(gate);
    assert_eq!(records[0].invocation_order(), 0);
    assert_eq!(records[0].accepted_sequence(), 0);
    assert_eq!(records[0].queue(), callbacks.queue());
    assert_eq!(records[0].update(), first.update());
    assert_eq!(records[0].callback(), first_callback);
    assert_eq!(
        records[0].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert_eq!(records[1].invocation_order(), 1);
    assert_eq!(records[1].accepted_sequence(), 2);
    assert_eq!(records[1].queue(), callbacks.queue());
    assert_eq!(records[1].update(), second.update());
    assert_eq!(records[1].callback(), second_callback);
    assert_eq!(
        records[1].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert!(after_commit.visible().is_empty());
    assert!(after_commit.hidden().is_empty());
    assert_eq!(
        callback_handles(after_commit.deferred_hidden()),
        vec![hidden_callback]
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_callback_drain_diagnostics_record_visible_and_hidden_lane_order() {
    let (mut store, root_id, host) = root_store();
    let first_callback = RootUpdateCallbackHandle::from_raw(5011);
    let hidden_callback = RootUpdateCallbackHandle::from_raw(5012);
    let second_callback = RootUpdateCallbackHandle::from_raw(5013);
    let first = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(5011),
        Some(first_callback),
    )
    .unwrap();
    let hidden = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(5012),
        Some(hidden_callback),
    )
    .unwrap();
    let second = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(5013),
        Some(second_callback),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(hidden.update())
        .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let diagnostics = commit
        .root_update_callback_drain_snapshot_for_canary(&store, 7, render.render_lanes())
        .unwrap();

    assert_eq!(diagnostics.root(), root_id);
    assert_eq!(diagnostics.commit_order(), 7);
    assert_eq!(diagnostics.render_lanes(), Lanes::DEFAULT);
    assert_eq!(diagnostics.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(diagnostics.pending_lanes_after_commit(), Lanes::NO);
    assert_eq!(diagnostics.len(), 3);
    assert_eq!(diagnostics.visible_callback_count(), 2);
    assert_eq!(diagnostics.hidden_callback_count(), 1);
    assert!(diagnostics.has_visible_and_hidden_callbacks());
    assert!(diagnostics.records_in_callback_sequence_order());
    assert!(diagnostics.records_match_commit_lanes());
    assert!(diagnostics.hidden_callbacks_deferred_without_invocation());
    assert!(diagnostics.proves_deterministic_lane_order());
    assert!(!diagnostics.public_callbacks_invoked());
    assert!(!diagnostics.public_root_callback_behavior_exposed());

    let records = diagnostics.records();
    assert_eq!(records[0].callback_order(), 0);
    assert_eq!(records[0].accepted_sequence(), 0);
    assert_eq!(records[0].queue(), commit.root_update_callbacks().queue());
    assert_eq!(records[0].update(), first.update());
    assert_eq!(records[0].callback(), first_callback);
    assert_eq!(
        records[0].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert_eq!(records[0].update_lanes(), Lanes::DEFAULT);
    assert_eq!(records[0].callback_lanes(), Lanes::DEFAULT);
    assert!(records[0].callback_lanes_match_commit());
    assert!(!records[0].public_callback_invoked());

    assert_eq!(records[1].callback_order(), 1);
    assert_eq!(records[1].accepted_sequence(), 1);
    assert_eq!(records[1].update(), hidden.update());
    assert_eq!(records[1].callback(), hidden_callback);
    assert_eq!(
        records[1].visibility(),
        RootUpdateCallbackVisibility::DeferredHidden
    );
    assert_eq!(
        records[1].update_lanes(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(records[1].callback_lanes(), Lanes::DEFAULT);
    assert!(records[1].update_lanes_include_offscreen());
    assert!(records[1].is_hidden_callback());
    assert!(records[1].is_deferred_hidden_callback());
    assert!(records[1].callback_lanes_match_commit());
    assert!(!records[1].public_callback_invoked());

    assert_eq!(records[2].callback_order(), 2);
    assert_eq!(records[2].accepted_sequence(), 2);
    assert_eq!(records[2].update(), second.update());
    assert_eq!(records[2].callback(), second_callback);
    assert_eq!(
        records[2].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert_eq!(records[2].update_lanes(), Lanes::DEFAULT);
    assert_eq!(records[2].callback_lanes(), Lanes::DEFAULT);
    assert!(records[2].callback_lanes_match_commit());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_invocation_execution_gate_drains_visible_callbacks_once_under_test_control() {
    let (mut store, root_id, host) = root_store();
    let first_callback = RootUpdateCallbackHandle::from_raw(277);
    let second_callback = RootUpdateCallbackHandle::from_raw(279);
    let first = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(27),
        Some(first_callback),
    )
    .unwrap();
    let second = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(29),
        Some(second_callback),
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut control = TestRootUpdateCallbackControl::default();

    let execution = commit.drain_root_update_callbacks_under_test_control(&mut control);

    assert_eq!(execution.source_visible_record_count(), 2);
    assert_eq!(execution.hidden_record_count(), 0);
    assert_eq!(execution.deferred_hidden_record_count(), 0);
    assert_eq!(execution.len(), 2);
    assert_eq!(execution.completed_count(), 2);
    assert_eq!(execution.error_count(), 0);
    assert!(!execution.has_errors());
    assert_eq!(execution.errors(), Vec::new());
    assert_eq!(
        execution.status(),
        RootUpdateCallbackInvocationExecutionGateStatus::TestControlOnly
    );
    assert_eq!(
        execution.blockers(),
        &ROOT_UPDATE_CALLBACK_INVOCATION_EXECUTION_GATE_BLOCKERS
    );
    assert!(execution.did_drain_accepted_visible_callbacks());
    assert!(execution.test_control_invoked_callback_handles());
    assert!(!execution.public_js_callbacks_invoked());
    assert!(!execution.public_root_callback_behavior_exposed());
    assert!(!execution.hidden_callbacks_invoked());
    assert!(!execution.root_error_callbacks_invoked());

    let records = execution.records();
    assert_eq!(records[0].invocation_order(), 0);
    assert_eq!(records[0].accepted_sequence(), 0);
    assert_eq!(records[0].update(), first.update());
    assert_eq!(records[0].callback(), first_callback);
    assert_eq!(
        records[0].status(),
        RootUpdateCallbackInvocationStatus::Completed
    );
    assert_eq!(records[1].invocation_order(), 1);
    assert_eq!(records[1].accepted_sequence(), 1);
    assert_eq!(records[1].update(), second.update());
    assert_eq!(records[1].callback(), second_callback);
    assert_eq!(
        records[1].status(),
        RootUpdateCallbackInvocationStatus::Completed
    );
    assert_eq!(control.calls().len(), 2);
    assert_eq!(control.calls()[0].callback(), first_callback);
    assert_eq!(control.calls()[1].callback(), second_callback);
    assert!(commit.root_update_callback_invocation_gate().is_empty());

    let repeated = commit.drain_root_update_callbacks_under_test_control(&mut control);

    assert_eq!(repeated.source_visible_record_count(), 0);
    assert!(repeated.is_empty());
    assert!(!repeated.did_drain_accepted_visible_callbacks());
    assert_eq!(control.calls().len(), 2);
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
fn root_commit_invocation_execution_gate_records_test_control_errors_without_public_callbacks() {
    let (mut store, root_id, host) = root_store();
    let first_callback = RootUpdateCallbackHandle::from_raw(377);
    let second_callback = RootUpdateCallbackHandle::from_raw(379);
    let first = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(37),
        Some(first_callback),
    )
    .unwrap();
    let second = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(39),
        Some(second_callback),
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let second_error = root_callback_error(990);
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let mut control =
        TestRootUpdateCallbackControl::default().with_result(second_callback, Err(second_error));

    let execution = commit.drain_root_update_callbacks_under_test_control(&mut control);

    assert_eq!(execution.len(), 2);
    assert_eq!(execution.completed_count(), 1);
    assert_eq!(execution.error_count(), 1);
    assert!(execution.has_errors());
    assert_eq!(execution.errors(), vec![second_error]);
    assert!(!execution.public_js_callbacks_invoked());
    assert!(!execution.public_root_callback_behavior_exposed());
    assert!(!execution.root_error_callbacks_invoked());
    let records = execution.records();
    assert_eq!(records[0].update(), first.update());
    assert_eq!(records[0].callback(), first_callback);
    assert!(records[0].completed());
    assert_eq!(records[0].error(), None);
    assert_eq!(records[1].update(), second.update());
    assert_eq!(records[1].callback(), second_callback);
    assert!(records[1].errored());
    assert_eq!(records[1].error(), Some(second_error));
    assert_eq!(control.calls().len(), 2);
    assert!(commit.root_update_callback_invocation_gate().is_empty());
    assert_eq!(
        store.scheduler_bridge().callback_requests().len(),
        callback_request_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_commit_drains_visible_callback_records_only_once() {
    let (mut store, root_id, _host) = root_store();
    let callback = RootUpdateCallbackHandle::from_raw(88);
    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(13),
        Some(callback),
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let current_queue = store
        .fiber_arena()
        .get(commit.current())
        .unwrap()
        .update_queue();
    let second_take = store
        .update_queues_mut()
        .take_root_update_callback_records(current_queue)
        .unwrap();
    let stale_commit_error = commit_finished_host_root(&mut store, render).unwrap_err();
    let after_stale_commit = store
        .update_queues_mut()
        .take_root_update_callback_records(current_queue)
        .unwrap();

    assert_eq!(
        callback_handles(commit.root_update_callbacks().visible()),
        vec![callback]
    );
    assert!(second_take.is_empty());
    assert!(matches!(
        stale_commit_error,
        RootCommitError::CurrentMismatch { root, .. } if root == root_id
    ));
    assert!(after_stale_commit.is_empty());
}

#[test]
fn root_commit_defers_hidden_callbacks_without_visible_invocation_records() {
    let (mut store, root_id, host) = root_store();
    let callback = RootUpdateCallbackHandle::from_raw(99);
    let update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(14),
        Some(callback),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(update.update())
        .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let callbacks = commit.root_update_callbacks();
    let current_queue = store
        .fiber_arena()
        .get(commit.current())
        .unwrap()
        .update_queue();
    let after_commit = store
        .update_queues()
        .peek_root_update_callback_records(current_queue)
        .unwrap();

    assert!(callbacks.visible().is_empty());
    assert!(callbacks.hidden().is_empty());
    assert_eq!(
        callback_handles(callbacks.deferred_hidden()),
        vec![callback]
    );
    assert_eq!(callbacks.deferred_hidden()[0].update(), update.update());
    assert_eq!(
        callbacks.deferred_hidden()[0].visibility(),
        RootUpdateCallbackVisibility::DeferredHidden
    );
    assert!(after_commit.visible().is_empty());
    assert!(after_commit.hidden().is_empty());
    assert_eq!(
        callback_handles(after_commit.deferred_hidden()),
        vec![callback]
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

fn callback_handles(records: &[RootUpdateCallbackRecord]) -> Vec<RootUpdateCallbackHandle> {
    records.iter().map(|record| record.callback()).collect()
}

fn create_host_ref_fiber(
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

fn append_host_ref_child(
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

fn assert_active_ref_token(
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

fn assert_dom_ref_callback_gate_is_inert(gate: &HostRootDomRefCallbackCommitGateSnapshot) {
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

fn assert_ref_callback_execution_handoff_keeps_public_blockers(
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

fn assert_ref_cleanup_return_execution_gate_keeps_public_blockers(
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

fn assert_root_update_callback_invocation_gate_is_inert(
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
