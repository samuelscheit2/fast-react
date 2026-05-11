use super::*;
use crate::begin_work::{BeginWorkRequest, unsupported_offscreen_begin_work_record};
use crate::complete_work::{
    complete_offscreen_visibility_transition_blocker_for_test,
    offscreen_reveal_commit_metadata_for_test,
};
use crate::function_component::{
    FunctionComponentEffectDependencyStatus, FunctionComponentEffectPhase,
    FunctionComponentHookRenderPhase, FunctionComponentHookRenderStore,
};
use crate::root_commit::{
    FunctionComponentEffectListCommitPhaseOrderKind,
    FunctionComponentLayoutEffectCallbackInvocationErrorHandle,
    FunctionComponentLayoutEffectCallbackInvocationRequest,
    FunctionComponentLayoutEffectCallbackInvocationTestControl, HostRootDeletionCleanupOrderPhase,
    commit_function_component_effect_queues_for_committed_root,
    commit_offscreen_reveal_complete_metadata_handoff_for_canary,
    queue_function_component_deleted_subtree_pending_passive_effects,
    queue_function_component_pending_passive_effects,
    record_host_root_finished_work_pending_commit_for_canary,
};
use crate::root_config::PendingPassiveUnmountOrigin;
use crate::root_scheduler::schedule_passive_effects_flush_after_commit_for_canary;
use crate::test_support::{FakeContainer, RecordingHost};
use crate::{
    RootElementHandle, RootErrorCallbackHandle, RootOptions, RootRecoverableErrorCallbackHandle,
    RootSchedulerCallbackHandle, RootSyncFlushExitStatus, RootUpdateCallbackHandle,
    SchedulerPriority, commit_finished_host_root, ensure_root_is_scheduled,
    render_host_root_for_lanes, update_container, update_container_sync,
};
use fast_react_core::{
    DependenciesHandle, FiberFlags, FiberMode, FiberTag, FiberTypeHandle, HookEffectCallbackHandle,
    HookEffectDependencies, Lane, PropsHandle, ReactKey, RefHandle, StateHandle, StateNodeHandle,
};

fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    (store, root_id, host)
}

fn schedule_sync_update(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    element: RootElementHandle,
) {
    let update = update_container_sync(store, root_id, element, None).unwrap();
    ensure_root_is_scheduled(store, update.schedule()).unwrap();
}

fn current_host_root_element(
    store: &FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) -> RootElementHandle {
    let current = store.root(root_id).unwrap().current();
    let state = store.fiber_arena().get(current).unwrap().memoized_state();
    store.host_root_states().get(state).unwrap().element()
}

fn append_function_component_child(
    store: &mut FiberRootStore<RecordingHost>,
    parent: FiberId,
    props: PropsHandle,
    component: FiberTypeHandle,
) -> FiberId {
    let mode = store.fiber_arena().get(parent).unwrap().mode();
    let child =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::FunctionComponent, None, props, mode);
    store
        .fiber_arena_mut()
        .get_mut(child)
        .unwrap()
        .set_fiber_type(component);
    store
        .fiber_arena_mut()
        .set_children(parent, &[child])
        .unwrap();
    child
}

fn attach_offscreen_passive_reveal_child(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> (FiberId, FiberId, FiberId) {
    let previous = store.fiber_arena_mut().create_fiber(
        FiberTag::Offscreen,
        Some(ReactKey::from_normalized("passive-reveal")),
        PropsHandle::from_raw(12_500),
        FiberMode::CONCURRENT,
    );
    {
        let node = store.fiber_arena_mut().get_mut(previous).unwrap();
        node.set_memoized_state(StateHandle::from_raw(12_501));
        node.set_lanes(Lanes::OFFSCREEN);
        node.set_child_lanes(Lanes::from(Lane::RETRY_1));
        node.set_state_node(StateNodeHandle::from_raw(12_502));
    }

    let offscreen = store
        .fiber_arena_mut()
        .create_work_in_progress(previous, PropsHandle::from_raw(12_503))
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(offscreen).unwrap();
        node.set_memoized_props(PropsHandle::from_raw(12_504));
        node.set_memoized_state(StateHandle::NONE);
        node.set_lanes(Lanes::DEFAULT);
        node.set_child_lanes(Lanes::from(Lane::TRANSITION_1));
        node.set_state_node(StateNodeHandle::from_raw(12_505));
    }

    let hidden_subtree = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(12_506),
        FiberMode::CONCURRENT,
    );
    store
        .fiber_arena_mut()
        .get_mut(hidden_subtree)
        .unwrap()
        .merge_flags(FiberFlags::PLACEMENT | FiberFlags::MAY_SUSPEND_COMMIT);
    store
        .fiber_arena_mut()
        .set_children(offscreen, &[hidden_subtree])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[offscreen])
        .unwrap();

    (previous, offscreen, hidden_subtree)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct DeletedHostSubtreeRefPassiveFixture {
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

fn create_host_ref_fiber(
    store: &mut FiberRootStore<RecordingHost>,
    mode: FiberMode,
    ref_handle: RefHandle,
    state_node: StateNodeHandle,
) -> FiberId {
    let fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::NONE,
        mode,
    );
    let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
    node.set_state_node(state_node);
    node.set_ref_handle(ref_handle);
    fiber
}

fn create_host_text_fiber(
    store: &mut FiberRootStore<RecordingHost>,
    mode: FiberMode,
    props: PropsHandle,
    state_node: StateNodeHandle,
) -> FiberId {
    let fiber = store
        .fiber_arena_mut()
        .create_fiber(FiberTag::HostText, None, props, mode);
    store
        .fiber_arena_mut()
        .get_mut(fiber)
        .unwrap()
        .set_state_node(state_node);
    fiber
}

fn bubble_test_fiber(store: &mut FiberRootStore<RecordingHost>, fiber: FiberId) {
    let bubbled = fast_react_core::bubble_properties(store.fiber_arena(), fiber).unwrap();
    let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
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
    let deleted_host_ref = RefHandle::from_raw(9_701);
    let deleted_host_state_node = StateNodeHandle::from_raw(9_801);
    let deleted_text_state_node = StateNodeHandle::from_raw(9_803);
    let deleted_host =
        create_host_ref_fiber(store, mode, deleted_host_ref, deleted_host_state_node);
    let deleted_function = create_function_component_fiber(
        store,
        mode,
        PropsHandle::from_raw(9_702),
        FiberTypeHandle::from_raw(9_902),
    );
    let deleted_text = create_host_text_fiber(
        store,
        mode,
        PropsHandle::from_raw(9_703),
        deleted_text_state_node,
    );
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

    let passive_create = callback(9_901);
    let passive_destroy = callback(9_911);
    let passive_dependencies = deps(9_921);
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

    store
        .fiber_arena_mut()
        .mark_child_for_deletion(host_root_work_in_progress, deleted_host)
        .unwrap();
    bubble_test_fiber(store, host_root_work_in_progress);

    DeletedHostSubtreeRefPassiveFixture {
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
    let host_parent = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9_731),
        mode,
    );
    let host_parent_state_node = StateNodeHandle::from_raw(9_831);
    store
        .fiber_arena_mut()
        .get_mut(host_parent)
        .unwrap()
        .set_state_node(host_parent_state_node);

    let deleted_host_ref = RefHandle::from_raw(9_732);
    let deleted_host_state_node = StateNodeHandle::from_raw(9_832);
    let deleted_host =
        create_host_ref_fiber(store, mode, deleted_host_ref, deleted_host_state_node);
    let deleted_function = create_function_component_fiber(
        store,
        mode,
        PropsHandle::from_raw(9_733),
        FiberTypeHandle::from_raw(9_933),
    );
    let nested_host_ref = RefHandle::from_raw(9_734);
    let nested_host_state_node = StateNodeHandle::from_raw(9_834);
    let nested_host = create_host_ref_fiber(store, mode, nested_host_ref, nested_host_state_node);
    let deleted_text = create_host_text_fiber(
        store,
        mode,
        PropsHandle::from_raw(9_735),
        StateNodeHandle::from_raw(9_835),
    );
    let deleted_text_state_node = StateNodeHandle::from_raw(9_835);
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

    let passive_create = callback(9_934);
    let passive_destroy = callback(9_935);
    let passive_dependencies = deps(9_936);
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

    store
        .fiber_arena_mut()
        .mark_child_for_deletion(host_parent, deleted_host)
        .unwrap();
    bubble_test_fiber(store, host_root_work_in_progress);

    NestedDeletedHostSubtreeRefPassiveFixture {
        host_parent,
        host_parent_state_node,
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

fn callback(raw: u64) -> HookEffectCallbackHandle {
    HookEffectCallbackHandle::from_raw(raw)
}

fn destroy_error(raw: u64) -> PassiveEffectDestroyCallbackErrorHandle {
    PassiveEffectDestroyCallbackErrorHandle::from_raw(raw)
}

fn mount_create_error(raw: u64) -> PassiveEffectMountCreateCallbackErrorHandle {
    PassiveEffectMountCreateCallbackErrorHandle::from_raw(raw)
}

fn deps(raw: u64) -> HookEffectDependencies {
    HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
}

fn callback_error(raw: u64) -> PassiveEffectCallbackInvocationErrorHandle {
    PassiveEffectCallbackInvocationErrorHandle::from_raw(raw)
}

#[derive(Debug, Clone)]
struct CommittedPassiveUpdateFixture {
    root_id: FiberRootId,
    finished_work: FiberId,
    finished_function: FiberId,
    effect: HookEffectId,
    previous_instance: HookEffectInstanceId,
    current_instance: HookEffectInstanceId,
    destroy_callback: HookEffectCallbackHandle,
    create_callback: HookEffectCallbackHandle,
    returned_destroy_callback: HookEffectCallbackHandle,
    unmount_order: PendingPassiveEffectOrder,
    mount_order: PendingPassiveEffectOrder,
    commit: HostRootCommitRecord,
}

fn prepare_committed_passive_update_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    base: u64,
) -> CommittedPassiveUpdateFixture {
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(base + 1);
    let current_function = append_function_component_child(
        store,
        previous_current,
        PropsHandle::from_raw(base + 2),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(base + 3),
            deps(base + 4),
            Some(callback(base + 5)),
        )
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(base + 6), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        store,
        finished_work,
        PropsHandle::from_raw(base + 7),
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
            callback(base + 8),
            deps(base + 9),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let queued = queue_function_component_pending_passive_effects(
        store,
        root_id,
        &hook_store,
        state,
        Lanes::DEFAULT,
    )
    .unwrap();
    assert_eq!(queued.queued_unmount_count(), 1);
    assert_eq!(queued.queued_mount_count(), 1);
    let queued_effect = queued.records()[0];
    let mut commit = commit_finished_host_root(store, render).unwrap();
    let committed_queues = commit_function_component_effect_queues_for_committed_root(
        store,
        root_id,
        &mut hook_store,
        Lanes::DEFAULT,
    )
    .unwrap();
    assert_eq!(committed_queues.len(), 1);
    commit
        .record_function_component_committed_passive_effects_from_committed_effect_queues_for_canary(
            store,
            &hook_store,
            std::slice::from_ref(&queued),
        )
        .unwrap();

    CommittedPassiveUpdateFixture {
        root_id,
        finished_work,
        finished_function,
        effect: registration.effect(),
        previous_instance: previous.instance(),
        current_instance: registration.instance(),
        destroy_callback: callback(base + 5),
        create_callback: callback(base + 8),
        returned_destroy_callback: callback(base + 10),
        unmount_order: queued_effect.unmount_order().unwrap(),
        mount_order: queued_effect.mount_order(),
        commit,
    }
}

#[derive(Default)]
struct TestLayoutEffectCallbackControl {
    calls: Vec<FunctionComponentLayoutEffectCallbackInvocationRequest>,
}

impl TestLayoutEffectCallbackControl {
    fn calls(&self) -> &[FunctionComponentLayoutEffectCallbackInvocationRequest] {
        &self.calls
    }
}

impl FunctionComponentLayoutEffectCallbackInvocationTestControl
    for TestLayoutEffectCallbackControl
{
    fn invoke_layout_effect_create(
        &mut self,
        request: FunctionComponentLayoutEffectCallbackInvocationRequest,
    ) -> Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle> {
        self.calls.push(request);
        Ok(())
    }
}

#[derive(Default)]
struct TestPassiveEffectCallbackControl {
    calls: Vec<PassiveEffectCallbackInvocationRequest>,
    destroy_results: Vec<(
        HookEffectCallbackHandle,
        Result<(), PassiveEffectCallbackInvocationErrorHandle>,
    )>,
    create_results: Vec<(
        HookEffectCallbackHandle,
        Result<Option<HookEffectCallbackHandle>, PassiveEffectCallbackInvocationErrorHandle>,
    )>,
}

impl TestPassiveEffectCallbackControl {
    fn with_destroy_result(
        mut self,
        callback: HookEffectCallbackHandle,
        result: Result<(), PassiveEffectCallbackInvocationErrorHandle>,
    ) -> Self {
        self.destroy_results.push((callback, result));
        self
    }

    fn with_create_result(
        mut self,
        callback: HookEffectCallbackHandle,
        result: Result<
            Option<HookEffectCallbackHandle>,
            PassiveEffectCallbackInvocationErrorHandle,
        >,
    ) -> Self {
        self.create_results.push((callback, result));
        self
    }

    fn calls(&self) -> &[PassiveEffectCallbackInvocationRequest] {
        &self.calls
    }

    fn destroy_result(
        &self,
        callback: HookEffectCallbackHandle,
    ) -> Result<(), PassiveEffectCallbackInvocationErrorHandle> {
        self.destroy_results
            .iter()
            .find(|(accepted, _)| *accepted == callback)
            .map_or(Ok(()), |(_, result)| *result)
    }

    fn create_result(
        &self,
        callback: HookEffectCallbackHandle,
    ) -> Result<Option<HookEffectCallbackHandle>, PassiveEffectCallbackInvocationErrorHandle> {
        self.create_results
            .iter()
            .find(|(accepted, _)| *accepted == callback)
            .map_or(Ok(None), |(_, result)| *result)
    }
}

impl PassiveEffectCallbackInvocationTestControl for TestPassiveEffectCallbackControl {
    fn invoke_passive_effect_destroy(
        &mut self,
        request: PassiveEffectCallbackInvocationRequest,
    ) -> Result<(), PassiveEffectCallbackInvocationErrorHandle> {
        self.calls.push(request);
        self.destroy_result(request.callback())
    }

    fn invoke_passive_effect_create(
        &mut self,
        request: PassiveEffectCallbackInvocationRequest,
    ) -> Result<Option<HookEffectCallbackHandle>, PassiveEffectCallbackInvocationErrorHandle> {
        self.calls.push(request);
        self.create_result(request.callback())
    }
}

#[derive(Default)]
struct RecordingDestroyExecutor {
    fail_callback: Option<HookEffectCallbackHandle>,
    error: PassiveEffectDestroyCallbackErrorHandle,
    calls: Vec<PassiveEffectDestroyCallbackExecutionRequest>,
}

impl RecordingDestroyExecutor {
    fn with_error(
        callback: HookEffectCallbackHandle,
        error: PassiveEffectDestroyCallbackErrorHandle,
    ) -> Self {
        Self {
            fail_callback: Some(callback),
            error,
            calls: Vec::new(),
        }
    }

    fn calls(&self) -> &[PassiveEffectDestroyCallbackExecutionRequest] {
        &self.calls
    }
}

impl PassiveEffectDestroyCallbackExecutor for RecordingDestroyExecutor {
    fn execute_destroy_callback(
        &mut self,
        request: PassiveEffectDestroyCallbackExecutionRequest,
    ) -> Result<(), PassiveEffectDestroyCallbackErrorHandle> {
        self.calls.push(request);
        if self.fail_callback == Some(request.destroy_callback()) {
            Err(self.error)
        } else {
            Ok(())
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum DeletedCleanupExecutionEvent {
    RefCleanup(FiberId),
    PassiveDestroy(HookEffectCallbackHandle),
}

#[derive(Default)]
struct RecordingDeletedCleanupExecutor {
    events: Vec<DeletedCleanupExecutionEvent>,
    ref_cleanup_calls: Vec<DeletedSubtreeRefCleanupReturnExecutionRequest>,
    destroy_calls: Vec<PassiveEffectDestroyCallbackExecutionRequest>,
}

impl RecordingDeletedCleanupExecutor {
    fn events(&self) -> &[DeletedCleanupExecutionEvent] {
        &self.events
    }

    fn ref_cleanup_calls(&self) -> &[DeletedSubtreeRefCleanupReturnExecutionRequest] {
        &self.ref_cleanup_calls
    }

    fn destroy_calls(&self) -> &[PassiveEffectDestroyCallbackExecutionRequest] {
        &self.destroy_calls
    }
}

impl DeletedSubtreeRefCleanupReturnExecutor for RecordingDeletedCleanupExecutor {
    fn execute_deleted_ref_cleanup_return(
        &mut self,
        request: DeletedSubtreeRefCleanupReturnExecutionRequest,
    ) {
        self.events
            .push(DeletedCleanupExecutionEvent::RefCleanup(request.fiber()));
        self.ref_cleanup_calls.push(request);
    }
}

impl PassiveEffectDestroyCallbackExecutor for RecordingDeletedCleanupExecutor {
    fn execute_destroy_callback(
        &mut self,
        request: PassiveEffectDestroyCallbackExecutionRequest,
    ) -> Result<(), PassiveEffectDestroyCallbackErrorHandle> {
        self.events
            .push(DeletedCleanupExecutionEvent::PassiveDestroy(
                request.destroy_callback(),
            ));
        self.destroy_calls.push(request);
        Ok(())
    }
}

#[derive(Default)]
struct RecordingMountCreateExecutor {
    fail_callback: Option<HookEffectCallbackHandle>,
    error: PassiveEffectMountCreateCallbackErrorHandle,
    returned_destroy: Vec<(HookEffectCallbackHandle, Option<HookEffectCallbackHandle>)>,
    calls: Vec<PassiveEffectMountCreateCallbackExecutionRequest>,
}

impl RecordingMountCreateExecutor {
    fn with_error(
        mut self,
        callback: HookEffectCallbackHandle,
        error: PassiveEffectMountCreateCallbackErrorHandle,
    ) -> Self {
        self.fail_callback = Some(callback);
        self.error = error;
        self
    }

    fn with_returned_destroy(
        mut self,
        callback: HookEffectCallbackHandle,
        destroy: Option<HookEffectCallbackHandle>,
    ) -> Self {
        self.returned_destroy.push((callback, destroy));
        self
    }

    fn calls(&self) -> &[PassiveEffectMountCreateCallbackExecutionRequest] {
        &self.calls
    }

    fn returned_destroy(
        &self,
        callback: HookEffectCallbackHandle,
    ) -> Option<HookEffectCallbackHandle> {
        self.returned_destroy
            .iter()
            .find(|(accepted, _)| *accepted == callback)
            .and_then(|(_, destroy)| *destroy)
    }
}

impl PassiveEffectMountCreateCallbackExecutor for RecordingMountCreateExecutor {
    fn execute_mount_create_callback(
        &mut self,
        request: PassiveEffectMountCreateCallbackExecutionRequest,
    ) -> Result<Option<HookEffectCallbackHandle>, PassiveEffectMountCreateCallbackErrorHandle> {
        self.calls.push(request);
        if self.fail_callback == Some(request.create_callback()) {
            Err(self.error)
        } else {
            Ok(self.returned_destroy(request.create_callback()))
        }
    }
}

#[test]
fn passive_effects_flush_returns_noop_record_without_commit_handoff() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(10), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let commit = commit_finished_host_root(&mut store, render).unwrap();

    let flush = flush_passive_effects_after_commit(&mut store, &commit).unwrap();

    assert_eq!(flush.root(), root_id);
    assert_eq!(flush.finished_work(), None);
    assert_eq!(flush.lanes(), Lanes::NO);
    assert_eq!(flush.status(), PassiveEffectsFlushStatus::NoPendingPassive);
    assert!(!flush.consumed_pending_passive());
    assert!(!flush.did_flush_records());
    assert!(flush.records().is_empty());
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
fn passive_effects_flush_emits_unmounts_before_mounts_and_clears_pending_state() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(20), None).unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();

    let (mount_order, unmount_order) = {
        let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(root_id, Lanes::NO);
        let mount_order = scheduling
            .pending_passive_mut()
            .queue_mount(finished_work, Lanes::DEFAULT)
            .unwrap();
        let unmount_order = scheduling
            .pending_passive_mut()
            .queue_unmount(
                previous_current,
                PendingPassiveUnmountOrigin::UpdatedFiber,
                Lanes::SYNC,
            )
            .unwrap();
        (mount_order, unmount_order)
    };

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let flush = flush_passive_effects_after_commit(&mut store, &commit).unwrap();

    assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(flush.consumed_pending_passive());
    assert!(flush.did_flush_records());
    assert_eq!(flush.root(), root_id);
    assert_eq!(flush.finished_work(), Some(finished_work));
    assert_eq!(flush.lanes(), Lanes::DEFAULT);
    assert_eq!(flush.records().len(), 2);

    let unmount = flush.records()[0];
    assert_eq!(unmount.flush_index(), 0);
    assert_eq!(unmount.root(), root_id);
    assert_eq!(unmount.finished_work(), finished_work);
    assert_eq!(unmount.committed_lanes(), Lanes::DEFAULT);
    assert_eq!(unmount.fiber(), previous_current);
    assert_eq!(unmount.effect_lanes(), Lanes::SYNC);
    assert_eq!(unmount.phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(unmount.pending_order(), unmount_order);
    assert_eq!(
        unmount.unmount_origin(),
        Some(PendingPassiveUnmountOrigin::UpdatedFiber)
    );

    let mount = flush.records()[1];
    assert_eq!(mount.flush_index(), 1);
    assert_eq!(mount.root(), root_id);
    assert_eq!(mount.finished_work(), finished_work);
    assert_eq!(mount.committed_lanes(), Lanes::DEFAULT);
    assert_eq!(mount.fiber(), finished_work);
    assert_eq!(mount.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(mount.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(mount.pending_order(), mount_order);
    assert_eq!(mount.unmount_origin(), None);

    assert!(unmount.pending_order().flush_rank() < mount.pending_order().flush_rank());
    assert_eq!(
        store.root(root_id).unwrap().scheduling().pending_passive(),
        &PendingPassiveState::NONE
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_callback_invocation_gate_skips_flush_records_without_callback_handles() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(22), None).unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();

    {
        let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(root_id, Lanes::NO);
        scheduling
            .pending_passive_mut()
            .queue_unmount(
                previous_current,
                PendingPassiveUnmountOrigin::UpdatedFiber,
                Lanes::DEFAULT,
            )
            .unwrap();
        scheduling
            .pending_passive_mut()
            .queue_mount(finished_work, Lanes::DEFAULT)
            .unwrap();
    }

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let flush = flush_passive_effects_after_commit(&mut store, &commit).unwrap();
    assert_eq!(flush.records().len(), 2);
    assert!(flush.records().iter().all(|record| {
        record.create_callback().is_none()
            && record.destroy_callback().is_none()
            && !record.create_callback_invoked()
            && !record.destroy_callback_invoked()
    }));
    let mut control = TestPassiveEffectCallbackControl::default();

    let gate = invoke_passive_effect_callbacks_under_test_control(flush, &mut control);

    assert_eq!(gate.root(), root_id);
    assert_eq!(gate.finished_work(), Some(finished_work));
    assert_eq!(gate.lanes(), Lanes::DEFAULT);
    assert_eq!(gate.flush_status(), PassiveEffectsFlushStatus::Flushed);
    assert_eq!(gate.flush_record_count(), 2);
    assert_eq!(gate.skipped_flush_records_without_callbacks(), 2);
    assert!(gate.is_empty());
    assert_eq!(gate.len(), 0);
    assert_eq!(gate.completed_count(), 0);
    assert_eq!(gate.error_count(), 0);
    assert!(!gate.has_errors());
    assert_eq!(
        gate.status(),
        PassiveEffectCallbackInvocationGateStatus::TestControlOnly
    );
    assert_eq!(
        gate.blockers(),
        &PASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
    );
    assert!(!gate.public_effect_execution_enabled());
    assert!(!gate.public_act_compatibility_claimed());
    assert!(!gate.scheduler_driven_passive_execution_enabled());
    assert!(control.calls().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_flush_consumes_function_component_passive_metadata_data_only() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(21), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let component = FiberTypeHandle::from_raw(820);
    let function_fiber = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(821),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), function_fiber)
        .unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Mount);
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let registration = hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(822),
            deps(823),
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
    assert_eq!(queued.records().len(), 1);
    assert_eq!(queued.queued_unmount_count(), 0);
    assert_eq!(queued.queued_mount_count(), 1);

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let handoff = commit.pending_passive_handoff().unwrap();
    assert_eq!(handoff.pending_unmount_count(), 0);
    assert_eq!(handoff.pending_mount_count(), 1);

    let flush = flush_passive_effects_after_commit_with_function_component_handoffs(
        &mut store,
        &commit,
        std::slice::from_ref(&queued),
    )
    .unwrap();

    assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(flush.consumed_pending_passive());
    assert_eq!(flush.root(), root_id);
    assert_eq!(flush.finished_work(), Some(finished_work));
    assert_eq!(flush.lanes(), Lanes::DEFAULT);
    assert_eq!(flush.records().len(), 1);
    assert!(!flush.did_execute_destroy_callbacks());
    assert!(!flush.did_record_destroy_callback_errors());
    assert!(flush.destroy_callback_executions().is_empty());
    assert!(flush.destroy_callback_errors().is_empty());
    assert!(!flush.did_execute_mount_create_callbacks());
    assert!(!flush.did_record_mount_create_callback_errors());
    assert!(flush.mount_create_callback_executions().is_empty());
    assert!(flush.mount_create_callback_errors().is_empty());
    let record = flush.records()[0];
    assert_eq!(record.flush_index(), 0);
    assert_eq!(record.fiber(), function_fiber);
    assert_eq!(record.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(record.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(record.pending_order(), queued.records()[0].mount_order());
    assert_eq!(record.unmount_origin(), None);
    assert_eq!(record.effect_index(), Some(0));
    assert_eq!(record.effect(), Some(registration.effect()));
    assert_eq!(record.effect_instance(), Some(registration.instance()));
    assert_eq!(record.create_callback(), Some(callback(822)));
    assert_eq!(record.destroy_callback(), None);
    assert!(!record.create_callback_invoked());
    assert!(!record.destroy_callback_invoked());
    assert_eq!(
        record.effect_record().unwrap().effect(),
        registration.effect()
    );
    assert_eq!(
        record.effect_record().unwrap().create_callback(),
        Some(callback(822))
    );
    assert_eq!(record.effect_record().unwrap().destroy_callback(), None);
    assert!(!record.effect_record().unwrap().create_callback_invoked());
    assert!(!record.effect_record().unwrap().destroy_callback_invoked());
    assert_eq!(
        hook_store
            .hook_effects()
            .get_effect(registration.effect())
            .unwrap()
            .create(),
        callback(822)
    );
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(registration.instance())
            .unwrap()
            .destroy(),
        None
    );
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
fn passive_effects_flush_rejects_effect_handoff_lane_drift_before_consuming() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(824), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let function_fiber = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(825),
        FiberTypeHandle::from_raw(826),
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), function_fiber)
        .unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(827),
            deps(828),
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();
    let queued = queue_function_component_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        state,
        Lanes::SYNC,
    )
    .unwrap();
    let commit = commit_finished_host_root(&mut store, render).unwrap();

    let error = flush_passive_effects_after_commit_with_function_component_handoffs(
        &mut store,
        &commit,
        std::slice::from_ref(&queued),
    )
    .unwrap_err();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert!(matches!(
        error,
        PassiveEffectsFlushError::PendingPassiveEffectHandoffLanesMismatch {
            root,
            expected,
            actual,
        } if root == root_id && expected == Lanes::DEFAULT && actual == Lanes::SYNC
    ));
    assert_eq!(pending_passive.root(), Some(root_id));
    assert_eq!(pending_passive.finished_work(), Some(finished_work));
    assert_eq!(pending_passive.lanes(), Lanes::DEFAULT);
    assert_eq!(pending_passive.passive_mounts().len(), 1);
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_flush_carries_effect_ids_through_update_unmount_and_mount() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(830);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(831),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(832),
            deps(833),
            Some(callback(834)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(835), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(836),
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
            callback(837),
            deps(838),
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
    assert_eq!(queued.queued_unmount_count(), 1);
    assert_eq!(queued.queued_mount_count(), 1);
    let queued_effect = queued.records()[0];

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let flush = flush_passive_effects_after_commit_with_function_component_handoffs(
        &mut store,
        &commit,
        std::slice::from_ref(&queued),
    )
    .unwrap();

    assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert_eq!(flush.records().len(), 2);
    assert!(!flush.did_execute_destroy_callbacks());
    assert!(!flush.did_record_destroy_callback_errors());
    assert!(flush.destroy_callback_executions().is_empty());
    assert!(flush.destroy_callback_errors().is_empty());
    assert!(!flush.did_execute_mount_create_callbacks());
    assert!(!flush.did_record_mount_create_callback_errors());
    assert!(flush.mount_create_callback_executions().is_empty());
    assert!(flush.mount_create_callback_errors().is_empty());
    let unmount = flush.records()[0];
    assert_eq!(unmount.flush_index(), 0);
    assert_eq!(unmount.fiber(), finished_function);
    assert_eq!(unmount.phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(
        unmount.pending_order(),
        queued_effect.unmount_order().unwrap()
    );
    assert_eq!(unmount.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(unmount.effect_index(), Some(0));
    assert_eq!(unmount.effect(), Some(registration.effect()));
    assert_eq!(unmount.effect_instance(), Some(previous.instance()));
    assert_eq!(unmount.effect_instance(), Some(registration.instance()));
    assert_eq!(unmount.create_callback(), None);
    assert_eq!(unmount.destroy_callback(), Some(callback(834)));
    assert!(!unmount.create_callback_invoked());
    assert!(!unmount.destroy_callback_invoked());
    assert_eq!(
        unmount.unmount_origin(),
        Some(PendingPassiveUnmountOrigin::UpdatedFiber)
    );

    let mount = flush.records()[1];
    assert_eq!(mount.flush_index(), 1);
    assert_eq!(mount.fiber(), finished_function);
    assert_eq!(mount.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(mount.pending_order(), queued_effect.mount_order());
    assert_eq!(mount.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(mount.effect_index(), Some(0));
    assert_eq!(mount.effect(), Some(registration.effect()));
    assert_eq!(mount.effect_instance(), Some(registration.instance()));
    assert_eq!(mount.create_callback(), Some(callback(837)));
    assert_eq!(mount.destroy_callback(), None);
    assert!(!mount.create_callback_invoked());
    assert!(!mount.destroy_callback_invoked());
    assert_eq!(mount.unmount_origin(), None);
    assert!(unmount.pending_order() < mount.pending_order());
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .is_empty()
    );
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(previous.instance())
            .unwrap()
            .destroy(),
        Some(callback(834))
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_queue_accepts_changed_update_queue_metadata_and_skips_unchanged() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(970);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(971),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_changed = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(972),
            deps(973),
            Some(callback(974)),
        )
        .unwrap();
    let previous_unchanged = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(975),
            deps(976),
            Some(callback(977)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(978), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(979),
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
    let changed = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(980),
            deps(981),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    let unchanged = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(982),
            deps(976),
            FunctionComponentEffectDependencyStatus::Unchanged,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let update_queue = hook_store.effect_update_queue(state).unwrap().unwrap();
    assert_eq!(update_queue.len(), 2);
    assert_eq!(update_queue.changed_dependency_count(), 1);
    assert_eq!(update_queue.unchanged_dependency_count(), 1);
    assert_eq!(update_queue.accepted_passive_count(), 1);

    let queued = queue_function_component_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        state,
        Lanes::DEFAULT,
    )
    .unwrap();
    assert_eq!(queued.records().len(), 1);
    assert_eq!(queued.queued_unmount_count(), 1);
    assert_eq!(queued.queued_mount_count(), 1);
    assert_eq!(queued.records()[0].effect(), changed.effect());
    assert_ne!(queued.records()[0].effect(), unchanged.effect());
    assert_eq!(queued.records()[0].instance(), previous_changed.instance());
    assert_ne!(
        queued.records()[0].instance(),
        previous_unchanged.instance()
    );
    assert_eq!(queued.records()[0].create(), callback(980));
    assert_eq!(queued.records()[0].destroy(), Some(callback(974)));

    let pending = store.root(root_id).unwrap().scheduling().pending_passive();
    assert_eq!(pending.root(), Some(root_id));
    assert_eq!(pending.finished_work(), None);
    assert_eq!(pending.lanes(), Lanes::DEFAULT);
    assert_eq!(pending.passive_unmounts().len(), 1);
    assert_eq!(pending.passive_mounts().len(), 1);

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let handoff = commit.pending_passive_handoff().unwrap();
    assert_eq!(handoff.pending_unmount_count(), 1);
    assert_eq!(handoff.pending_mount_count(), 1);
    let flush = flush_passive_effects_after_commit_with_function_component_handoffs(
        &mut store,
        &commit,
        std::slice::from_ref(&queued),
    )
    .unwrap();

    assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert_eq!(flush.records().len(), 2);
    assert!(!flush.did_execute_destroy_callbacks());
    assert!(!flush.did_execute_mount_create_callbacks());
    let unmount = flush.records()[0];
    let mount = flush.records()[1];
    assert_eq!(unmount.phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(mount.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(unmount.effect(), Some(changed.effect()));
    assert_eq!(mount.effect(), Some(changed.effect()));
    assert_eq!(unmount.effect_index(), Some(0));
    assert_eq!(mount.effect_index(), Some(0));
    assert_eq!(unmount.effect_instance(), Some(previous_changed.instance()));
    assert_eq!(mount.effect_instance(), Some(changed.instance()));
    assert_eq!(unmount.create_callback(), None);
    assert_eq!(unmount.destroy_callback(), Some(callback(974)));
    assert_eq!(mount.create_callback(), Some(callback(980)));
    assert_eq!(mount.destroy_callback(), None);
    assert!(!unmount.create_callback_invoked());
    assert!(!unmount.destroy_callback_invoked());
    assert!(!mount.create_callback_invoked());
    assert!(!mount.destroy_callback_invoked());
    assert_eq!(
        unmount.unmount_origin(),
        Some(PendingPassiveUnmountOrigin::UpdatedFiber)
    );
    assert!(unmount.pending_order() < mount.pending_order());
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(previous_changed.instance())
            .unwrap()
            .destroy(),
        Some(callback(974))
    );
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(previous_unchanged.instance())
            .unwrap()
            .destroy(),
        Some(callback(977))
    );
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
fn passive_effects_dependency_comparison_executes_changed_update_and_skips_equal() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(11_200);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(11_201),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_changed = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(11_202),
            deps(11_203),
            Some(callback(11_204)),
        )
        .unwrap();
    let previous_unchanged = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(11_205),
            deps(11_206),
            Some(callback(11_207)),
        )
        .unwrap();

    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(11_208),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(11_209),
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
    let changed = hook_store
        .update_effect_metadata_with_dependency_check(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(11_210),
            deps(11_211),
        )
        .unwrap();
    let unchanged = hook_store
        .update_effect_metadata_with_dependency_check(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(11_212),
            deps(11_206),
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let update_queue = hook_store.effect_update_queue(state).unwrap().unwrap();
    assert_eq!(update_queue.len(), 2);
    assert_eq!(update_queue.changed_dependency_count(), 1);
    assert_eq!(update_queue.unchanged_dependency_count(), 1);
    assert_eq!(update_queue.accepted_passive_count(), 1);
    assert_eq!(update_queue.accepted_layout_count(), 0);

    let records = update_queue.records();
    assert_eq!(
        records[0].dependency_status(),
        FunctionComponentEffectDependencyStatus::Changed
    );
    assert_eq!(records[0].previous_effect(), previous_changed.effect());
    assert_eq!(records[0].effect(), changed.effect());
    assert_eq!(records[0].previous_dependencies(), deps(11_203));
    assert_eq!(records[0].dependencies(), deps(11_211));
    assert_eq!(records[0].destroy(), Some(callback(11_204)));
    assert!(records[0].accepted_for_pending_passive());
    assert_eq!(
        records[1].dependency_status(),
        FunctionComponentEffectDependencyStatus::Unchanged
    );
    assert_eq!(records[1].previous_effect(), previous_unchanged.effect());
    assert_eq!(records[1].effect(), unchanged.effect());
    assert_eq!(records[1].previous_dependencies(), deps(11_206));
    assert_eq!(records[1].dependencies(), deps(11_206));
    assert_eq!(records[1].destroy(), Some(callback(11_207)));
    assert!(!records[1].accepted_for_pending_passive());
    assert_eq!(
        store.fiber_arena().get(finished_function).unwrap().flags(),
        FiberFlags::PASSIVE
    );

    let queued = queue_function_component_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        state,
        Lanes::DEFAULT,
    )
    .unwrap();
    assert_eq!(queued.records().len(), 1);
    assert_eq!(queued.queued_unmount_count(), 1);
    assert_eq!(queued.queued_mount_count(), 1);
    assert_eq!(queued.records()[0].effect(), changed.effect());
    assert_ne!(queued.records()[0].effect(), unchanged.effect());
    assert_eq!(queued.records()[0].destroy(), Some(callback(11_204)));
    assert_eq!(queued.records()[0].create(), callback(11_210));

    let pending = store.root(root_id).unwrap().scheduling().pending_passive();
    assert_eq!(pending.passive_unmounts().len(), 1);
    assert_eq!(pending.passive_mounts().len(), 1);

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut destroy_executor = RecordingDestroyExecutor::default();
    let mut mount_create_executor = RecordingMountCreateExecutor::default()
        .with_returned_destroy(callback(11_210), Some(callback(11_213)));
    let flush = flush_passive_effects_after_commit_with_callback_executors(
        &mut store,
        &commit,
        std::slice::from_ref(&queued),
        &mut destroy_executor,
        &mut mount_create_executor,
    )
    .unwrap();

    assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(flush.consumed_pending_passive());
    assert_eq!(flush.root(), root_id);
    assert_eq!(flush.finished_work(), Some(finished_work));
    assert_eq!(flush.lanes(), Lanes::DEFAULT);
    assert_eq!(flush.records().len(), 2);
    assert!(flush.did_execute_destroy_callbacks());
    assert!(flush.did_execute_mount_create_callbacks());
    assert!(!flush.did_record_destroy_callback_errors());
    assert!(!flush.did_record_mount_create_callback_errors());
    assert!(flush.destroy_callback_errors().is_empty());
    assert!(flush.mount_create_callback_errors().is_empty());
    assert_eq!(
        flush.mount_create_callback_execution_gate_status(),
        PassiveEffectMountCreateCallbackExecutionGateStatus::TestControlOnly
    );
    assert_eq!(
        flush.mount_create_callback_execution_gate_blockers(),
        &PASSIVE_EFFECT_MOUNT_CREATE_CALLBACK_EXECUTION_GATE_BLOCKERS
    );
    assert!(!flush.public_effect_execution_enabled());
    assert!(!flush.public_act_compatibility_claimed());
    assert!(!flush.scheduler_driven_passive_execution_enabled());

    let unmount = flush.records()[0];
    let mount = flush.records()[1];
    assert_eq!(unmount.phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(mount.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(
        unmount.pending_order(),
        queued.records()[0].unmount_order().unwrap()
    );
    assert_eq!(mount.pending_order(), queued.records()[0].mount_order());
    assert!(unmount.pending_order() < mount.pending_order());
    assert_eq!(unmount.effect(), Some(changed.effect()));
    assert_eq!(mount.effect(), Some(changed.effect()));
    assert_eq!(unmount.effect_instance(), Some(previous_changed.instance()));
    assert_eq!(mount.effect_instance(), Some(changed.instance()));
    assert_eq!(unmount.destroy_callback(), Some(callback(11_204)));
    assert_eq!(unmount.create_callback(), None);
    assert_eq!(mount.create_callback(), Some(callback(11_210)));
    assert_eq!(mount.destroy_callback(), None);
    assert!(unmount.destroy_callback_invoked());
    assert!(!unmount.create_callback_invoked());
    assert!(mount.create_callback_invoked());
    assert!(!mount.destroy_callback_invoked());
    assert_eq!(
        unmount.unmount_origin(),
        Some(PendingPassiveUnmountOrigin::UpdatedFiber)
    );
    assert_eq!(mount.unmount_origin(), None);

    let destroy_execution = flush.destroy_callback_executions()[0];
    assert_eq!(destroy_execution.execution_order(), 0);
    assert_eq!(destroy_execution.flush_index(), unmount.flush_index());
    assert_eq!(destroy_execution.destroy_callback(), callback(11_204));
    assert_eq!(destroy_executor.calls(), &[destroy_execution.request()]);
    let create_execution = flush.mount_create_callback_executions()[0];
    assert_eq!(create_execution.execution_order(), 0);
    assert_eq!(create_execution.flush_index(), mount.flush_index());
    assert_eq!(create_execution.create_callback(), callback(11_210));
    assert_eq!(create_execution.returned_destroy(), Some(callback(11_213)));
    assert_eq!(mount_create_executor.calls(), &[create_execution.request()]);
    assert!(
        destroy_executor
            .calls()
            .iter()
            .all(|request| request.destroy_callback() != callback(11_207))
    );
    assert!(
        mount_create_executor
            .calls()
            .iter()
            .all(|request| request.create_callback() != callback(11_212))
    );
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(previous_unchanged.instance())
            .unwrap()
            .destroy(),
        Some(callback(11_207))
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
fn passive_effects_flush_consumes_committed_fiber_records_without_handoff_argument() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(1020);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(1021),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(1022),
            deps(1023),
            Some(callback(1024)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(1025), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(1026),
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
            callback(1027),
            deps(1028),
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
    assert_eq!(queued.queued_unmount_count(), 1);
    assert_eq!(queued.queued_mount_count(), 1);
    let queued_effect = queued.records()[0];

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let committed = commit
        .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
            &queued,
        ))
        .unwrap()
        .clone();
    assert_eq!(committed.fiber_count(), 1);
    assert_eq!(committed.queued_unmount_count(), 1);
    assert_eq!(committed.queued_mount_count(), 1);
    assert_eq!(committed.fibers()[0].fiber(), finished_function);
    assert_eq!(
        committed.fibers()[0].phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(committed.fibers()[0].lanes(), Lanes::DEFAULT);
    assert_eq!(committed.fibers()[0].records().len(), 2);
    assert_eq!(
        committed.fibers()[0].records()[0].order(),
        queued_effect.unmount_order().unwrap()
    );
    assert_eq!(
        committed.fibers()[0].records()[1].order(),
        queued_effect.mount_order()
    );

    let flush = flush_passive_effects_after_commit_from_committed_fiber_effects_for_canary(
        &mut store, &commit,
    )
    .unwrap();

    assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(flush.consumed_pending_passive());
    assert_eq!(flush.root(), root_id);
    assert_eq!(flush.finished_work(), Some(finished_work));
    assert_eq!(flush.lanes(), Lanes::DEFAULT);
    assert_eq!(flush.records().len(), 2);
    assert!(!flush.did_execute_destroy_callbacks());
    assert!(!flush.did_execute_mount_create_callbacks());

    let unmount = flush.records()[0];
    let mount = flush.records()[1];
    assert_eq!(unmount.flush_index(), 0);
    assert_eq!(mount.flush_index(), 1);
    assert_eq!(unmount.fiber(), finished_function);
    assert_eq!(mount.fiber(), finished_function);
    assert_eq!(unmount.phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(mount.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(
        unmount.pending_order(),
        queued_effect.unmount_order().unwrap()
    );
    assert_eq!(mount.pending_order(), queued_effect.mount_order());
    assert_eq!(unmount.effect_index(), Some(0));
    assert_eq!(mount.effect_index(), Some(0));
    assert_eq!(unmount.effect(), Some(registration.effect()));
    assert_eq!(mount.effect(), Some(registration.effect()));
    assert_eq!(unmount.effect_instance(), Some(previous.instance()));
    assert_eq!(mount.effect_instance(), Some(registration.instance()));
    assert_eq!(unmount.create_callback(), None);
    assert_eq!(unmount.destroy_callback(), Some(callback(1024)));
    assert_eq!(mount.create_callback(), Some(callback(1027)));
    assert_eq!(mount.destroy_callback(), None);
    assert!(!unmount.create_callback_invoked());
    assert!(!unmount.destroy_callback_invoked());
    assert!(!mount.create_callback_invoked());
    assert!(!mount.destroy_callback_invoked());
    assert_eq!(
        unmount.unmount_origin(),
        Some(PendingPassiveUnmountOrigin::UpdatedFiber)
    );
    assert_eq!(mount.unmount_origin(), None);
    assert!(unmount.pending_order() < mount.pending_order());
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
fn passive_effects_committed_fiber_traversal_requires_committed_records_before_consuming() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(1030), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let function_fiber = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(1031),
        FiberTypeHandle::from_raw(1032),
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), function_fiber)
        .unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(1033),
            deps(1034),
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
    assert_eq!(queued.queued_unmount_count(), 0);
    assert_eq!(queued.queued_mount_count(), 1);
    let commit = commit_finished_host_root(&mut store, render).unwrap();

    let error = flush_passive_effects_after_commit_from_committed_fiber_effects_for_canary(
        &mut store, &commit,
    )
    .unwrap_err();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert!(matches!(
        error,
        PassiveEffectsFlushError::CommittedPassiveEffectRecordCountMismatch {
            root,
            expected_unmounts: 0,
            actual_unmounts: 0,
            expected_mounts: 1,
            actual_mounts: 0,
        } if root == root_id
    ));
    assert_eq!(pending_passive.root(), Some(root_id));
    assert_eq!(pending_passive.finished_work(), Some(finished_work));
    assert_eq!(pending_passive.lanes(), Lanes::DEFAULT);
    assert_eq!(pending_passive.passive_mounts().len(), 1);
    assert_eq!(pending_passive.passive_mounts()[0].fiber(), function_fiber);
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_scheduler_flush_gate_executes_private_destroy_create_callbacks() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(1040);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(1041),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(1042),
            deps(1043),
            Some(callback(1044)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(1045), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(1046),
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
            callback(1047),
            deps(1048),
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
    commit
        .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
            &queued,
        ))
        .unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let microtask_request_count = store.scheduler_bridge().microtask_requests().len();

    let scheduler_gate =
        schedule_passive_effects_flush_after_commit_for_canary(&mut store, &commit).unwrap();
    let mut destroy_executor = RecordingDestroyExecutor::default();
    let mut mount_create_executor = RecordingMountCreateExecutor::default()
        .with_returned_destroy(callback(1047), Some(callback(1049)));

    assert!(scheduler_gate.did_schedule_scheduler_flush_request());
    assert_eq!(scheduler_gate.root(), root_id);
    assert_eq!(scheduler_gate.finished_work(), Some(finished_work));
    assert_eq!(scheduler_gate.lanes(), Lanes::DEFAULT);
    assert_eq!(scheduler_gate.pending_unmount_count(), 1);
    assert_eq!(scheduler_gate.pending_mount_count(), 1);
    assert_eq!(scheduler_gate.pending_record_count(), 2);
    assert!(!scheduler_gate.executes_public_effects());
    assert!(!scheduler_gate.public_act_compatibility_claimed());
    assert!(!scheduler_gate.public_scheduler_package_behavior_changed());
    let scheduler_request = scheduler_gate.scheduler_request().unwrap();
    assert_eq!(scheduler_request.order(), 0);
    assert_eq!(
        scheduler_request.node(),
        RootSchedulerCallbackHandle::from_raw(1)
    );
    assert_eq!(scheduler_request.root(), root_id);
    assert_eq!(scheduler_request.finished_work(), finished_work);
    assert_eq!(scheduler_request.lanes(), Lanes::DEFAULT);
    assert_eq!(
        scheduler_request.scheduler_priority(),
        SchedulerPriority::Normal
    );
    assert_eq!(
        store.scheduler_bridge().passive_effects_flush_requests(),
        &[scheduler_request]
    );
    let pending_before_execution = store.root(root_id).unwrap().scheduling().pending_passive();
    assert_eq!(
        pending_before_execution.finished_work(),
        Some(finished_work)
    );
    assert!(pending_before_execution.has_commit_handoff());
    assert_eq!(pending_before_execution.passive_unmounts().len(), 1);
    assert_eq!(pending_before_execution.passive_mounts().len(), 1);

    let execution =
        flush_passive_effects_after_scheduler_flush_gate_from_committed_fiber_effects_for_canary(
            &mut store,
            &commit,
            scheduler_gate,
            Some(&mut destroy_executor),
            Some(&mut mount_create_executor),
        )
        .unwrap()
        .unwrap();

    assert_eq!(execution.execution_order(), scheduler_request.order());
    assert_eq!(execution.scheduler_gate(), scheduler_gate);
    assert_eq!(execution.scheduler_request(), scheduler_request);
    assert_eq!(execution.root(), root_id);
    assert_eq!(execution.finished_work(), finished_work);
    assert_eq!(execution.lanes(), Lanes::DEFAULT);
    assert_eq!(execution.pending_unmount_count(), 1);
    assert_eq!(execution.pending_mount_count(), 1);
    assert_eq!(execution.pending_record_count(), 2);
    assert!(execution.did_flush_pending_passive());
    assert!(execution.did_execute_private_callback_executors());
    assert!(!execution.executes_public_effects());
    assert!(!execution.public_act_compatibility_claimed());
    assert!(!execution.public_scheduler_package_behavior_changed());

    let passive = execution.passive_effects();
    assert_eq!(passive.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(passive.consumed_pending_passive());
    assert_eq!(passive.records().len(), 2);
    assert!(passive.did_execute_destroy_callbacks());
    assert!(passive.did_execute_mount_create_callbacks());
    assert_eq!(passive.destroy_callback_executions().len(), 1);
    assert_eq!(passive.mount_create_callback_executions().len(), 1);
    assert!(!passive.public_effect_execution_enabled());
    assert!(!passive.public_act_compatibility_claimed());
    assert!(passive.scheduler_driven_passive_execution_enabled());

    let unmount = passive.records()[0];
    let mount = passive.records()[1];
    assert_eq!(unmount.flush_index(), 0);
    assert_eq!(mount.flush_index(), 1);
    assert_eq!(unmount.phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(mount.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(
        unmount.pending_order(),
        queued_effect.unmount_order().unwrap()
    );
    assert_eq!(mount.pending_order(), queued_effect.mount_order());
    assert!(unmount.pending_order() < mount.pending_order());
    assert_eq!(unmount.fiber(), finished_function);
    assert_eq!(mount.fiber(), finished_function);
    assert_eq!(unmount.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(mount.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(unmount.effect_index(), Some(0));
    assert_eq!(mount.effect_index(), Some(0));
    assert_eq!(unmount.effect(), Some(registration.effect()));
    assert_eq!(mount.effect(), Some(registration.effect()));
    assert_eq!(unmount.effect_instance(), Some(previous.instance()));
    assert_eq!(mount.effect_instance(), Some(registration.instance()));
    assert_eq!(unmount.destroy_callback(), Some(callback(1044)));
    assert_eq!(mount.create_callback(), Some(callback(1047)));
    assert!(unmount.destroy_callback_invoked());
    assert!(mount.create_callback_invoked());
    assert!(!unmount.create_callback_invoked());
    assert!(!mount.destroy_callback_invoked());

    let destroy_execution = passive.destroy_callback_executions()[0];
    assert_eq!(destroy_execution.execution_order(), 0);
    assert_eq!(
        destroy_execution.pending_order(),
        queued_effect.unmount_order().unwrap()
    );
    assert_eq!(destroy_execution.destroy_callback(), callback(1044));
    let mount_create_execution = passive.mount_create_callback_executions()[0];
    assert_eq!(mount_create_execution.execution_order(), 0);
    assert_eq!(
        mount_create_execution.pending_order(),
        queued_effect.mount_order()
    );
    assert_eq!(mount_create_execution.create_callback(), callback(1047));
    assert_eq!(
        mount_create_execution.returned_destroy(),
        Some(callback(1049))
    );
    assert_eq!(destroy_executor.calls().len(), 1);
    assert_eq!(
        destroy_executor.calls()[0].destroy_callback(),
        callback(1044)
    );
    assert_eq!(mount_create_executor.calls().len(), 1);
    assert_eq!(
        mount_create_executor.calls()[0].create_callback(),
        callback(1047)
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
    assert_eq!(
        store.scheduler_bridge().microtask_requests().len(),
        microtask_request_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_scheduler_execution_rejects_foreign_gate_before_callbacks() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let first = prepare_committed_passive_update_fixture(&mut store, first_root, 13_400);
    let second = prepare_committed_passive_update_fixture(&mut store, second_root, 13_500);
    let foreign_scheduler_gate =
        schedule_passive_effects_flush_after_commit_for_canary(&mut store, &first.commit).unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut destroy_executor = RecordingDestroyExecutor::default();
    let mut mount_create_executor = RecordingMountCreateExecutor::default().with_returned_destroy(
        second.create_callback,
        Some(second.returned_destroy_callback),
    );

    let error =
        flush_passive_effects_after_scheduler_flush_gate_from_committed_fiber_effects_for_canary(
            &mut store,
            &second.commit,
            foreign_scheduler_gate,
            Some(&mut destroy_executor),
            Some(&mut mount_create_executor),
        )
        .unwrap_err();

    assert!(matches!(
        error,
        PassiveEffectsFlushError::SchedulerPassiveFlushGateRootMismatch {
            expected,
            actual,
        } if expected == second_root && actual == first_root
    ));
    assert!(destroy_executor.calls().is_empty());
    assert!(mount_create_executor.calls().is_empty());
    let second_pending = store
        .root(second_root)
        .unwrap()
        .scheduling()
        .pending_passive();
    assert_eq!(second_pending.root(), Some(second_root));
    assert_eq!(second_pending.finished_work(), Some(second.finished_work));
    assert!(second_pending.has_commit_handoff());
    assert_eq!(second_pending.passive_unmount_count(), 1);
    assert_eq!(second_pending.passive_mount_count(), 1);
    assert_eq!(second_pending.pending_record_count(), 2);
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
fn passive_effects_scheduler_execution_rejects_stale_fiber_before_callbacks() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_committed_passive_update_fixture(&mut store, root_id, 13_600);
    let scheduler_gate =
        schedule_passive_effects_flush_after_commit_for_canary(&mut store, &fixture.commit)
            .unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    store
        .fiber_arena_mut()
        .set_children(fixture.finished_work, &[])
        .unwrap();
    let mut destroy_executor = RecordingDestroyExecutor::default();
    let mut mount_create_executor = RecordingMountCreateExecutor::default().with_returned_destroy(
        fixture.create_callback,
        Some(fixture.returned_destroy_callback),
    );

    let error =
        flush_passive_effects_after_scheduler_flush_gate_from_committed_fiber_effects_for_canary(
            &mut store,
            &fixture.commit,
            scheduler_gate,
            Some(&mut destroy_executor),
            Some(&mut mount_create_executor),
        )
        .unwrap_err();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert!(matches!(
        error,
        PassiveEffectsFlushError::CommittedPassiveCallbackInvocationStaleFiber {
            root,
            finished_work,
            fiber,
        } if root == root_id
            && finished_work == fixture.finished_work
            && fiber == fixture.finished_function
    ));
    assert!(destroy_executor.calls().is_empty());
    assert!(mount_create_executor.calls().is_empty());
    assert_eq!(pending_passive.root(), Some(root_id));
    assert_eq!(pending_passive.finished_work(), Some(fixture.finished_work));
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(pending_passive.passive_unmount_count(), 1);
    assert_eq!(pending_passive.passive_mount_count(), 1);
    assert_eq!(pending_passive.pending_record_count(), 2);
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
fn passive_effects_scheduler_execution_rejects_wrong_pending_order_before_callbacks() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_committed_passive_update_fixture(&mut store, root_id, 13_700);
    let scheduler_gate =
        schedule_passive_effects_flush_after_commit_for_canary(&mut store, &fixture.commit)
            .unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let (mount_order, unmount_order) = {
        let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(root_id, Lanes::NO);
        let mount_order = scheduling
            .pending_passive_mut()
            .queue_mount(fixture.finished_function, Lanes::DEFAULT)
            .unwrap();
        let unmount_order = scheduling
            .pending_passive_mut()
            .queue_unmount(
                fixture.finished_function,
                PendingPassiveUnmountOrigin::UpdatedFiber,
                Lanes::DEFAULT,
            )
            .unwrap();
        assert!(scheduling.pending_passive_mut().record_commit_handoff(
            root_id,
            fixture.finished_work,
            Lanes::DEFAULT,
        ));
        (mount_order, unmount_order)
    };
    assert_eq!(mount_order.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(unmount_order.phase(), PendingPassiveEffectPhase::Unmount);
    assert!(mount_order.sequence() < unmount_order.sequence());
    let mut destroy_executor = RecordingDestroyExecutor::default();
    let mut mount_create_executor = RecordingMountCreateExecutor::default().with_returned_destroy(
        fixture.create_callback,
        Some(fixture.returned_destroy_callback),
    );

    let error =
        flush_passive_effects_after_scheduler_flush_gate_from_committed_fiber_effects_for_canary(
            &mut store,
            &fixture.commit,
            scheduler_gate,
            Some(&mut destroy_executor),
            Some(&mut mount_create_executor),
        )
        .unwrap_err();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert!(matches!(
        error,
        PassiveEffectsFlushError::CommittedPassiveEffectRecordMismatch {
            root,
            fiber,
            phase: PendingPassiveEffectPhase::Unmount,
            order,
        } if root == root_id && fiber == fixture.finished_function && order == unmount_order
    ));
    assert!(destroy_executor.calls().is_empty());
    assert!(mount_create_executor.calls().is_empty());
    assert_eq!(pending_passive.root(), Some(root_id));
    assert_eq!(pending_passive.finished_work(), Some(fixture.finished_work));
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(pending_passive.passive_unmount_count(), 1);
    assert_eq!(pending_passive.passive_mount_count(), 1);
    assert_eq!(pending_passive.pending_record_count(), 2);
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
fn passive_effects_scheduler_execution_requires_scheduled_handoff_before_consuming() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_committed_passive_update_fixture(&mut store, root_id, 13_800);
    let no_handoff_root = store
        .create_client_root(FakeContainer::new(3), RootOptions::new())
        .unwrap();
    update_container(
        &mut store,
        no_handoff_root,
        RootElementHandle::from_raw(13_810),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, no_handoff_root, Lanes::DEFAULT).unwrap();
    let no_handoff_commit = commit_finished_host_root(&mut store, render).unwrap();
    let scheduler_gate =
        schedule_passive_effects_flush_after_commit_for_canary(&mut store, &no_handoff_commit)
            .unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut destroy_executor = RecordingDestroyExecutor::default();
    let mut mount_create_executor = RecordingMountCreateExecutor::default().with_returned_destroy(
        fixture.create_callback,
        Some(fixture.returned_destroy_callback),
    );

    let execution =
        flush_passive_effects_after_scheduler_flush_gate_from_committed_fiber_effects_for_canary(
            &mut store,
            &fixture.commit,
            scheduler_gate,
            Some(&mut destroy_executor),
            Some(&mut mount_create_executor),
        )
        .unwrap();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert_eq!(scheduler_gate.scheduler_request(), None);
    assert_eq!(execution, None);
    assert!(destroy_executor.calls().is_empty());
    assert!(mount_create_executor.calls().is_empty());
    assert_eq!(pending_passive.root(), Some(root_id));
    assert_eq!(pending_passive.finished_work(), Some(fixture.finished_work));
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(pending_passive.passive_unmount_count(), 1);
    assert_eq!(pending_passive.passive_mount_count(), 1);
    assert_eq!(pending_passive.pending_record_count(), 2);
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
fn passive_effects_scheduler_preflight_invokes_private_destroy_before_create_without_public_claim()
{
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_committed_passive_update_fixture(&mut store, root_id, 13_000);
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let microtask_request_count = store.scheduler_bridge().microtask_requests().len();
    let scheduler_gate =
        schedule_passive_effects_flush_after_commit_for_canary(&mut store, &fixture.commit)
            .unwrap();
    let scheduler_request = scheduler_gate.scheduler_request().unwrap();
    let mut control = TestPassiveEffectCallbackControl::default()
        .with_destroy_result(fixture.destroy_callback, Ok(()))
        .with_create_result(
            fixture.create_callback,
            Ok(Some(fixture.returned_destroy_callback)),
        );

    let preflight =
        preflight_passive_destroy_create_after_scheduler_flush_gate_from_committed_fiber_effects_under_test_control_for_canary(
            &mut store,
            &fixture.commit,
            scheduler_gate,
            &mut control,
        )
        .unwrap();

    assert_eq!(preflight.root(), fixture.root_id);
    assert_eq!(preflight.finished_work(), fixture.finished_work);
    assert_eq!(preflight.lanes(), Lanes::DEFAULT);
    assert_eq!(preflight.pending_unmount_count(), 1);
    assert_eq!(preflight.pending_mount_count(), 1);
    assert_eq!(preflight.pending_record_count(), 2);
    assert_eq!(preflight.scheduler_gate(), scheduler_gate);
    assert_eq!(preflight.scheduler_request(), scheduler_request);
    assert!(preflight.did_flush_pending_passive());
    assert!(preflight.private_scheduler_flush_request_metadata_consumed());
    assert!(preflight.did_invoke_private_destroy_create_callbacks());
    assert!(preflight.proves_destroy_before_create_order());
    assert!(!preflight.executes_public_effects());
    assert!(!preflight.public_effect_flushing_claimed());
    assert!(!preflight.public_act_compatibility_claimed());
    assert!(!preflight.executes_public_root_work());
    assert!(!preflight.public_scheduler_package_behavior_changed());
    assert!(!preflight.scheduler_driven_public_passive_execution_enabled());

    let scheduler_execution = preflight.scheduler_execution();
    assert_eq!(
        scheduler_execution.execution_order(),
        scheduler_request.order()
    );
    assert!(scheduler_execution.did_flush_pending_passive());
    assert!(!scheduler_execution.did_execute_private_callback_executors());
    assert!(!scheduler_execution.executes_public_effects());
    assert!(!scheduler_execution.public_act_compatibility_claimed());
    assert!(!scheduler_execution.public_scheduler_package_behavior_changed());

    let passive = preflight.passive_effects();
    assert_eq!(passive.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(passive.consumed_pending_passive());
    assert_eq!(passive.records().len(), 2);
    assert!(!passive.did_execute_destroy_callbacks());
    assert!(!passive.did_execute_mount_create_callbacks());
    assert!(!passive.public_effect_execution_enabled());
    assert!(!passive.public_act_compatibility_claimed());
    assert!(!passive.scheduler_driven_passive_execution_enabled());

    let callback_gate = preflight.callback_invocation();
    assert_eq!(callback_gate.root(), fixture.root_id);
    assert_eq!(callback_gate.finished_work(), Some(fixture.finished_work));
    assert_eq!(callback_gate.lanes(), Lanes::DEFAULT);
    assert_eq!(
        callback_gate.flush_status(),
        PassiveEffectsFlushStatus::Flushed
    );
    assert_eq!(callback_gate.flush_record_count(), 2);
    assert_eq!(callback_gate.skipped_flush_records_without_callbacks(), 0);
    assert_eq!(callback_gate.len(), 2);
    assert_eq!(callback_gate.completed_count(), 2);
    assert_eq!(callback_gate.error_count(), 0);
    assert!(!callback_gate.has_errors());
    assert!(!callback_gate.public_effect_execution_enabled());
    assert!(!callback_gate.public_act_compatibility_claimed());
    assert!(!callback_gate.scheduler_driven_passive_execution_enabled());

    let records = callback_gate.records();
    assert_eq!(records[0].invocation_order(), 0);
    assert_eq!(
        records[0].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(records[0].phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(records[0].pending_order(), fixture.unmount_order);
    assert_eq!(records[0].flush_index(), 0);
    assert_eq!(records[0].fiber(), fixture.finished_function);
    assert_eq!(records[0].effect(), fixture.effect);
    assert_eq!(records[0].instance(), fixture.previous_instance);
    assert_eq!(records[0].callback(), fixture.destroy_callback);
    assert!(records[0].completed());
    assert_eq!(records[0].returned_destroy(), None);

    assert_eq!(records[1].invocation_order(), 1);
    assert_eq!(
        records[1].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert_eq!(records[1].phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(records[1].pending_order(), fixture.mount_order);
    assert_eq!(records[1].flush_index(), 1);
    assert_eq!(records[1].fiber(), fixture.finished_function);
    assert_eq!(records[1].effect(), fixture.effect);
    assert_eq!(records[1].instance(), fixture.current_instance);
    assert_eq!(records[1].callback(), fixture.create_callback);
    assert!(records[1].completed());
    assert_eq!(
        records[1].returned_destroy(),
        Some(fixture.returned_destroy_callback)
    );
    assert!(records[0].pending_order() < records[1].pending_order());

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
        store.scheduler_bridge().passive_effects_flush_requests(),
        &[scheduler_request]
    );
    assert_eq!(
        store.scheduler_bridge().callback_requests().len(),
        callback_request_count
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert_eq!(
        store.scheduler_bridge().microtask_requests().len(),
        microtask_request_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_scheduler_preflight_rejects_foreign_scheduler_gate_before_consuming() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let first = prepare_committed_passive_update_fixture(&mut store, first_root, 13_100);
    let second = prepare_committed_passive_update_fixture(&mut store, second_root, 13_200);
    let foreign_scheduler_gate =
        schedule_passive_effects_flush_after_commit_for_canary(&mut store, &first.commit).unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut control = TestPassiveEffectCallbackControl::default()
        .with_destroy_result(second.destroy_callback, Ok(()))
        .with_create_result(
            second.create_callback,
            Ok(Some(second.returned_destroy_callback)),
        );

    let error =
        preflight_passive_destroy_create_after_scheduler_flush_gate_from_committed_fiber_effects_under_test_control_for_canary(
            &mut store,
            &second.commit,
            foreign_scheduler_gate,
            &mut control,
        )
        .unwrap_err();

    assert!(matches!(
        error,
        PassiveEffectDestroyCreateSchedulerPreflightError::SchedulerGateRootMismatch {
            expected,
            actual,
        } if expected == second_root && actual == first_root
    ));
    assert!(control.calls().is_empty());
    let second_pending = store
        .root(second_root)
        .unwrap()
        .scheduling()
        .pending_passive();
    assert_eq!(second_pending.root(), Some(second_root));
    assert_eq!(second_pending.finished_work(), Some(second.finished_work));
    assert!(second_pending.has_commit_handoff());
    assert_eq!(second_pending.passive_unmount_count(), 1);
    assert_eq!(second_pending.passive_mount_count(), 1);
    assert_eq!(second_pending.pending_record_count(), 2);
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
fn passive_effects_scheduler_preflight_rejects_stale_committed_fiber_before_callbacks() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(13_300);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(13_301),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(13_302),
            deps(13_303),
            Some(callback(13_304)),
        )
        .unwrap();

    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(13_305),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let mode = store.fiber_arena().get(finished_work).unwrap().mode();
    let stale_finished_function =
        create_function_component_fiber(&mut store, mode, PropsHandle::from_raw(13_306), component);
    store
        .fiber_arena_mut()
        .link_alternates(current_function, stale_finished_function)
        .unwrap();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), stale_finished_function)
        .unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(13_307),
            deps(13_308),
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
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    commit
        .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
            &queued,
        ))
        .unwrap();
    let scheduler_gate =
        schedule_passive_effects_flush_after_commit_for_canary(&mut store, &commit).unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut control = TestPassiveEffectCallbackControl::default()
        .with_destroy_result(callback(13_304), Ok(()))
        .with_create_result(callback(13_307), Ok(Some(callback(13_309))));

    let error =
        preflight_passive_destroy_create_after_scheduler_flush_gate_from_committed_fiber_effects_under_test_control_for_canary(
            &mut store,
            &commit,
            scheduler_gate,
            &mut control,
        )
        .unwrap_err();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert!(matches!(
        error,
        PassiveEffectDestroyCreateSchedulerPreflightError::PassiveEffects(
            PassiveEffectsFlushError::CommittedPassiveCallbackInvocationStaleFiber {
                root,
                finished_work: error_finished_work,
                fiber,
            }
        ) if root == root_id
            && error_finished_work == finished_work
            && fiber == stale_finished_function
    ));
    assert!(control.calls().is_empty());
    assert_eq!(pending_passive.root(), Some(root_id));
    assert_eq!(pending_passive.finished_work(), Some(finished_work));
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(pending_passive.passive_unmount_count(), 1);
    assert_eq!(pending_passive.passive_mount_count(), 1);
    assert_eq!(pending_passive.pending_record_count(), 2);
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
fn passive_effects_offscreen_reveal_records_deferred_hidden_subtree_passive_evidence() {
    let (mut store, root_id, host) = root_store();
    let hidden_update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(12_520),
        Some(RootUpdateCallbackHandle::from_raw(12_521)),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(hidden_update.update())
        .unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_hidden_update(hidden_update.lane())
        .unwrap();

    let lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
    let render = render_host_root_for_lanes(&mut store, root_id, lanes).unwrap();
    let (_, offscreen, hidden_subtree) =
        attach_offscreen_passive_reveal_child(&mut store, render.finished_work());
    let hidden_function = append_function_component_child(
        &mut store,
        hidden_subtree,
        PropsHandle::from_raw(12_522),
        FiberTypeHandle::from_raw(12_523),
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), hidden_function)
        .unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Mount);
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let registration = hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(12_524),
            deps(12_525),
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();
    let queued = queue_function_component_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        state,
        lanes,
    )
    .unwrap();
    assert_eq!(queued.queued_unmount_count(), 0);
    assert_eq!(queued.queued_mount_count(), 1);

    let begin_work = unsupported_offscreen_begin_work_record(
        store.fiber_arena(),
        BeginWorkRequest::new(offscreen, lanes),
    )
    .unwrap();
    let complete_work = complete_offscreen_visibility_transition_blocker_for_test(
        store.fiber_arena(),
        offscreen,
        &begin_work,
        lanes,
    )
    .unwrap();
    let reveal_metadata = offscreen_reveal_commit_metadata_for_test(&complete_work, lanes).unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, 1).unwrap();
    let reveal_handoff = commit_offscreen_reveal_complete_metadata_handoff_for_canary(
        &mut store,
        render,
        Some(pending),
        reveal_metadata,
        2,
    )
    .unwrap();
    assert!(reveal_handoff.passive_visibility_effects_deferred());
    assert!(reveal_handoff.public_passive_compatibility_blocked());

    let mut commit = reveal_handoff.commit().clone();
    commit
        .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
            &queued,
        ))
        .unwrap();
    let passive_flush = flush_passive_effects_after_commit_from_committed_fiber_effects_for_canary(
        &mut store, &commit,
    )
    .unwrap();

    let evidence = record_offscreen_passive_defer_reveal_evidence_for_canary(
        &store,
        &reveal_handoff,
        &passive_flush,
    )
    .unwrap();

    assert_eq!(evidence.root(), root_id);
    assert_eq!(evidence.finished_work(), render.finished_work());
    assert_eq!(evidence.lanes(), lanes);
    assert_eq!(evidence.offscreen(), offscreen);
    assert_eq!(evidence.hidden_subtree(), hidden_subtree);
    assert_eq!(evidence.hidden_subtree_tag(), FiberTag::HostComponent);
    assert_eq!(evidence.hidden_update_lane(), Lane::DEFAULT);
    assert_eq!(evidence.hidden_update_count(), 1);
    assert_eq!(evidence.passive_record_count(), 1);
    assert_eq!(evidence.hidden_subtree_passive_record_count(), 1);
    assert_eq!(evidence.passive_unmount_count(), 0);
    assert_eq!(evidence.passive_mount_count(), 1);
    assert_eq!(evidence.first_passive_flush_index(), Some(0));
    assert_eq!(
        evidence.first_passive_pending_order(),
        Some(queued.records()[0].mount_order())
    );
    assert!(evidence.passive_visibility_effects_deferred());
    assert!(evidence.passive_callbacks_deferred());
    assert!(evidence.public_offscreen_compatibility_blocked());
    assert!(evidence.public_passive_compatibility_blocked());
    assert!(evidence.proves_deferred_reveal_for_one_hidden_subtree());

    let record = passive_flush.records()[0];
    assert_eq!(record.fiber(), hidden_function);
    assert_eq!(record.effect(), Some(registration.effect()));
    assert_eq!(record.create_callback(), Some(callback(12_524)));
    assert!(!record.create_callback_invoked());
    assert!(!passive_flush.public_effect_execution_enabled());
    assert!(!passive_flush.public_act_compatibility_claimed());
    assert!(!passive_flush.scheduler_driven_passive_execution_enabled());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_committed_execution_gate_invokes_destroy_before_create_under_test_control() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(1050);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(1051),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(1052),
            deps(1053),
            Some(callback(1054)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(1055), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(1056),
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
            callback(1057),
            deps(1058),
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
    assert_eq!(queued.queued_unmount_count(), 1);
    assert_eq!(queued.queued_mount_count(), 1);
    let queued_effect = queued.records()[0];
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let committed = commit
        .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
            &queued,
        ))
        .unwrap()
        .clone();
    assert_eq!(committed.fiber_count(), 1);
    assert_eq!(committed.queued_unmount_count(), 1);
    assert_eq!(committed.queued_mount_count(), 1);

    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut control = TestPassiveEffectCallbackControl::default()
        .with_destroy_result(callback(1054), Ok(()))
        .with_create_result(callback(1057), Ok(Some(callback(1059))));

    let gate =
        execute_update_passive_effect_callbacks_after_commit_from_accepted_committed_function_component_under_test_control_for_canary(
            &mut store,
            &commit,
            &mut control,
        )
        .unwrap();

    assert_eq!(gate.root(), root_id);
    assert_eq!(gate.finished_work(), Some(finished_work));
    assert_eq!(gate.lanes(), Lanes::DEFAULT);
    assert_eq!(gate.flush_status(), PassiveEffectsFlushStatus::Flushed);
    assert_eq!(gate.flush_record_count(), 2);
    assert_eq!(gate.skipped_flush_records_without_callbacks(), 0);
    assert_eq!(gate.len(), 2);
    assert_eq!(gate.completed_count(), 2);
    assert_eq!(gate.error_count(), 0);
    assert!(!gate.has_errors());
    assert_eq!(
        gate.status(),
        PassiveEffectCallbackInvocationGateStatus::TestControlOnly
    );
    assert_eq!(
        gate.blockers(),
        &PASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
    );
    assert!(!gate.public_effect_execution_enabled());
    assert!(!gate.public_act_compatibility_claimed());
    assert!(!gate.scheduler_driven_passive_execution_enabled());

    let records = gate.records();
    assert_eq!(records[0].invocation_order(), 0);
    assert_eq!(
        records[0].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(records[0].phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(
        records[0].pending_order(),
        queued_effect.unmount_order().unwrap()
    );
    assert_eq!(records[0].flush_index(), 0);
    assert_eq!(records[0].fiber(), finished_function);
    assert_eq!(records[0].effect_lanes(), Lanes::DEFAULT);
    assert_eq!(records[0].effect_index(), 0);
    assert_eq!(records[0].effect(), registration.effect());
    assert_eq!(records[0].instance(), previous.instance());
    assert_eq!(records[0].callback(), callback(1054));
    assert_eq!(
        records[0].status(),
        PassiveEffectCallbackInvocationStatus::Completed
    );
    assert_eq!(records[0].returned_destroy(), None);

    assert_eq!(records[1].invocation_order(), 1);
    assert_eq!(
        records[1].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert_eq!(records[1].phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(records[1].pending_order(), queued_effect.mount_order());
    assert_eq!(records[1].flush_index(), 1);
    assert_eq!(records[1].fiber(), finished_function);
    assert_eq!(records[1].effect_lanes(), Lanes::DEFAULT);
    assert_eq!(records[1].effect_index(), 0);
    assert_eq!(records[1].effect(), registration.effect());
    assert_eq!(records[1].instance(), registration.instance());
    assert_eq!(records[1].callback(), callback(1057));
    assert_eq!(
        records[1].status(),
        PassiveEffectCallbackInvocationStatus::Completed
    );
    assert_eq!(records[1].returned_destroy(), Some(callback(1059)));
    assert!(records[0].pending_order() < records[1].pending_order());

    assert_eq!(control.calls().len(), 2);
    assert_eq!(
        control.calls()[0].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(control.calls()[0].callback(), callback(1054));
    assert_eq!(
        control.calls()[1].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert_eq!(control.calls()[1].callback(), callback(1057));
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
fn passive_effects_function_component_update_metadata_execution_gate_runs_destroy_create_pair() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(1_060);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(1_061),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(1_062),
            deps(1_063),
            Some(callback(1_064)),
        )
        .unwrap();

    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(1_065),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(1_066),
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
            callback(1_067),
            deps(1_068),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let update_queue = hook_store.effect_update_queue(state).unwrap().unwrap();
    assert_eq!(update_queue.accepted_passive_count(), 1);
    assert_eq!(update_queue.records()[0].effect(), registration.effect());
    assert_eq!(update_queue.records()[0].destroy(), Some(callback(1_064)));
    assert!(update_queue.records()[0].accepted_for_pending_passive());

    let queued = queue_function_component_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        state,
        Lanes::DEFAULT,
    )
    .unwrap();
    let queued_effect = queued.records()[0];
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let committed_queues = commit_function_component_effect_queues_for_committed_root(
        &store,
        root_id,
        &mut hook_store,
        Lanes::DEFAULT,
    )
    .unwrap();
    assert_eq!(committed_queues.len(), 1);
    assert_eq!(committed_queues[0].fiber(), finished_function);
    assert_eq!(
        committed_queues[0].phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(committed_queues[0].accepted_passive_count(), 1);
    assert_eq!(
        committed_queues[0].records()[0].dependency_status(),
        Some(FunctionComponentEffectDependencyStatus::Changed)
    );

    let committed = commit
        .record_function_component_committed_passive_effects_from_committed_effect_queues_for_canary(
            &store,
            &hook_store,
            std::slice::from_ref(&queued),
        )
        .unwrap()
        .clone();
    assert_eq!(committed.fiber_count(), 1);
    assert_eq!(committed.queued_unmount_count(), 1);
    assert_eq!(committed.queued_mount_count(), 1);

    let mut control = TestPassiveEffectCallbackControl::default()
        .with_destroy_result(callback(1_064), Ok(()))
        .with_create_result(callback(1_067), Ok(Some(callback(1_069))));
    let gate =
        execute_update_passive_effect_callbacks_after_commit_from_accepted_committed_function_component_under_test_control_for_canary(
            &mut store,
            &commit,
            &mut control,
        )
        .unwrap();

    assert_eq!(gate.flush_status(), PassiveEffectsFlushStatus::Flushed);
    assert_eq!(gate.len(), 2);
    assert_eq!(gate.completed_count(), 2);
    assert_eq!(gate.error_count(), 0);
    assert_eq!(
        gate.status(),
        PassiveEffectCallbackInvocationGateStatus::TestControlOnly
    );
    assert!(!gate.public_effect_execution_enabled());
    assert!(!gate.public_act_compatibility_claimed());
    assert!(!gate.scheduler_driven_passive_execution_enabled());

    let records = gate.records();
    assert_eq!(
        records[0].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(
        records[0].pending_order(),
        queued_effect.unmount_order().unwrap()
    );
    assert_eq!(records[0].effect(), registration.effect());
    assert_eq!(records[0].instance(), previous.instance());
    assert_eq!(records[0].callback(), callback(1_064));

    assert_eq!(
        records[1].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert_eq!(records[1].pending_order(), queued_effect.mount_order());
    assert_eq!(records[1].effect(), registration.effect());
    assert_eq!(records[1].instance(), registration.instance());
    assert_eq!(records[1].callback(), callback(1_067));
    assert_eq!(records[1].returned_destroy(), Some(callback(1_069)));
    assert!(records[0].pending_order() < records[1].pending_order());

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

    let returned_destroy_persistence =
        persist_passive_effect_returned_destroy_handles_for_canary(&mut hook_store, &gate).unwrap();
    assert_eq!(returned_destroy_persistence.len(), 1);
    assert!(returned_destroy_persistence.proves_returned_destroy_handles_persisted());
    assert!(!returned_destroy_persistence.public_effect_execution_enabled());
    assert!(!returned_destroy_persistence.public_act_compatibility_claimed());
    assert!(!returned_destroy_persistence.scheduler_driven_passive_execution_enabled());

    let returned_destroy_record = returned_destroy_persistence.records()[0];
    assert_eq!(returned_destroy_record.persistence_order(), 0);
    assert_eq!(returned_destroy_record.root(), root_id);
    assert_eq!(returned_destroy_record.finished_work(), finished_work);
    assert_eq!(returned_destroy_record.lanes(), Lanes::DEFAULT);
    assert_eq!(returned_destroy_record.fiber(), finished_function);
    assert_eq!(returned_destroy_record.effect(), registration.effect());
    assert_eq!(
        returned_destroy_record.effect_instance(),
        registration.instance()
    );
    assert_eq!(
        returned_destroy_record.invocation_instance(),
        registration.instance()
    );
    assert_eq!(returned_destroy_record.create(), callback(1_067));
    assert_eq!(
        returned_destroy_record.previous_destroy(),
        Some(callback(1_064))
    );
    assert_eq!(returned_destroy_record.returned_destroy(), callback(1_069));
    assert_eq!(
        returned_destroy_record.stored_destroy(),
        Some(callback(1_069))
    );
    assert!(
        returned_destroy_record.proves_returned_destroy_persisted(),
        "test-controlled passive create return must be stored on the reused hook effect instance"
    );
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(registration.instance())
            .unwrap()
            .destroy(),
        Some(callback(1_069))
    );

    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(1_070),
        None,
    )
    .unwrap();
    let second_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let second_finished_work = second_render.finished_work();
    let second_finished_function = append_function_component_child(
        &mut store,
        second_finished_work,
        PropsHandle::from_raw(1_071),
        component,
    );
    store
        .fiber_arena_mut()
        .link_alternates(finished_function, second_finished_function)
        .unwrap();
    let second_state = hook_store
        .prepare_render_state(store.fiber_arena(), second_finished_function)
        .unwrap();
    assert_eq!(
        second_state.phase(),
        FunctionComponentHookRenderPhase::Update
    );
    let mut second_cursor = hook_store.begin_render_cursor(second_state).unwrap();
    let second_registration = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut second_cursor,
            FunctionComponentEffectPhase::Passive,
            callback(1_072),
            deps(1_073),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    hook_store.finish_render_cursor(second_cursor).unwrap();

    let second_persistence = hook_store
        .effect_destroy_handle_persistence_records(second_state)
        .unwrap();
    assert_eq!(second_persistence.len(), 1);
    assert_eq!(
        second_persistence[0].previous_effect(),
        registration.effect()
    );
    assert_eq!(second_persistence[0].effect(), second_registration.effect());
    assert_eq!(
        second_persistence[0].previous_instance(),
        registration.instance()
    );
    assert_eq!(
        second_persistence[0].retained_instance(),
        second_registration.instance()
    );
    assert_eq!(
        second_persistence[0].recorded_destroy(),
        Some(callback(1_069))
    );
    assert_eq!(
        second_persistence[0].previous_destroy(),
        Some(callback(1_069))
    );
    assert_eq!(
        second_persistence[0].retained_destroy(),
        Some(callback(1_069))
    );
    assert!(second_persistence[0].proves_destroy_handle_persisted());
    assert!(second_persistence[0].proves_update_unmount_metadata_consumes_previous_destroy());

    let second_queued = queue_function_component_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        second_state,
        Lanes::DEFAULT,
    )
    .unwrap();
    assert_eq!(second_queued.records().len(), 1);
    assert_eq!(
        second_queued.records()[0].previous_effect(),
        Some(registration.effect())
    );
    assert_eq!(
        second_queued.records()[0].effect(),
        second_registration.effect()
    );
    assert_eq!(second_queued.records()[0].destroy(), Some(callback(1_069)));
    assert_eq!(second_queued.records()[0].create(), callback(1_072));
    bubble_test_fiber(&mut store, second_finished_function);
    bubble_test_fiber(&mut store, second_finished_work);

    let mut second_commit = commit_finished_host_root(&mut store, second_render).unwrap();
    let second_committed_queues = commit_function_component_effect_queues_for_committed_root(
        &store,
        root_id,
        &mut hook_store,
        Lanes::DEFAULT,
    )
    .unwrap();
    assert_eq!(second_committed_queues.len(), 1);
    assert_eq!(second_committed_queues[0].fiber(), second_finished_function);
    assert_eq!(second_committed_queues[0].accepted_passive_count(), 1);

    let second_effect_list = second_commit
        .record_function_component_effect_list_commit_phase_order_for_canary(
            &store,
            &mut hook_store,
            std::slice::from_ref(&second_queued),
        )
        .unwrap()
        .clone();
    let second_passive_unmount = second_effect_list
        .records()
        .iter()
        .find(|record| {
            record.kind()
                == FunctionComponentEffectListCommitPhaseOrderKind::PassiveUnmountScheduled
        })
        .copied()
        .unwrap();
    assert_eq!(second_passive_unmount.fiber(), second_finished_function);
    assert_eq!(
        second_passive_unmount.effect(),
        Some(second_registration.effect())
    );
    assert_eq!(
        second_passive_unmount.previous_effect(),
        Some(registration.effect())
    );
    assert_eq!(second_passive_unmount.destroy(), Some(callback(1_069)));

    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_update_lifecycle_execution_evidence_orders_layout_before_passive_callbacks() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(1_080);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(1_081),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_layout = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Layout,
            callback(1_082),
            deps(1_083),
            Some(callback(1_084)),
        )
        .unwrap();
    let previous_passive = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(1_085),
            deps(1_086),
            Some(callback(1_087)),
        )
        .unwrap();

    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(1_088),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(1_089),
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
            callback(1_090),
            deps(1_091),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    let passive = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(1_092),
            deps(1_093),
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
    bubble_test_fiber(&mut store, finished_function);
    bubble_test_fiber(&mut store, finished_work);

    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let layout_record = {
        let effect_list = commit
            .record_function_component_effect_list_commit_phase_order_for_canary(
                &store,
                &mut hook_store,
                std::slice::from_ref(&queued),
            )
            .unwrap()
            .clone();
        effect_list
            .records()
            .iter()
            .find(|record| {
                record.kind() == FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate
            })
            .copied()
            .unwrap()
    };
    let mut layout_control = TestLayoutEffectCallbackControl::default();
    let layout_execution = commit
        .execute_function_component_layout_effect_record_under_test_control_for_canary(
            &store,
            &hook_store,
            layout_record,
            &mut layout_control,
        )
        .unwrap()
        .clone();
    let mut passive_control = TestPassiveEffectCallbackControl::default()
        .with_destroy_result(callback(1_087), Ok(()))
        .with_create_result(callback(1_092), Ok(Some(callback(1_094))));
    let passive_execution =
        execute_update_passive_effect_callbacks_after_commit_from_accepted_committed_function_component_under_test_control_for_canary(
            &mut store,
            &commit,
            &mut passive_control,
        )
        .unwrap();

    let evidence = record_update_effect_lifecycle_execution_evidence_for_canary(
        &commit,
        &layout_execution,
        &passive_execution,
    )
    .unwrap();

    assert_eq!(evidence.root(), Some(root_id));
    assert_eq!(evidence.finished_work(), Some(finished_work));
    assert_eq!(evidence.lanes(), Lanes::DEFAULT);
    assert_eq!(evidence.len(), 4);
    assert_eq!(evidence.private_layout_callback_count(), 1);
    assert_eq!(evidence.private_passive_callback_count(), 2);
    assert!(evidence.proves_update_destroy_before_create_order());
    assert!(!evidence.public_effect_execution_enabled());
    assert!(!evidence.public_effect_compatibility_claimed());
    assert!(!evidence.public_act_compatibility_claimed());
    assert!(!evidence.scheduler_driven_passive_execution_enabled());
    assert_eq!(
        evidence
            .records()
            .iter()
            .map(|record| record.kind_name())
            .collect::<Vec<_>>(),
        vec![
            "layout-destroy-metadata",
            "layout-create-callback",
            "passive-destroy-callback",
            "passive-create-callback",
        ]
    );
    assert_eq!(
        evidence
            .records()
            .iter()
            .map(|record| record.phase_name())
            .collect::<Vec<_>>(),
        vec!["mutation", "layout", "passive", "passive"]
    );
    let records = evidence.records();
    assert_eq!(records[0].fiber(), finished_function);
    assert_eq!(records[0].effect(), Some(previous_layout.effect()));
    assert_eq!(records[0].callback(), Some(callback(1_084)));
    assert_eq!(records[1].fiber(), finished_function);
    assert_eq!(records[1].effect(), Some(layout.effect()));
    assert_eq!(records[1].callback(), Some(callback(1_090)));
    assert_eq!(records[1].invocation_order(), Some(0));
    assert_eq!(records[2].fiber(), finished_function);
    assert_eq!(records[2].effect(), Some(passive.effect()));
    assert_eq!(records[2].callback(), Some(callback(1_087)));
    assert_eq!(records[2].invocation_order(), Some(0));
    assert_eq!(
        records[2].pending_order(),
        Some(queued.records()[0].unmount_order().unwrap())
    );
    assert_eq!(records[3].fiber(), finished_function);
    assert_eq!(records[3].effect(), Some(passive.effect()));
    assert_eq!(records[3].callback(), Some(callback(1_092)));
    assert_eq!(records[3].invocation_order(), Some(1));
    assert_eq!(
        records[3].pending_order(),
        Some(queued.records()[0].mount_order())
    );
    assert!(records[1].metadata_sequence().unwrap() < records[2].metadata_sequence().unwrap());
    assert!(records[2].pending_order().unwrap() < records[3].pending_order().unwrap());
    assert_eq!(layout_control.calls().len(), 1);
    assert_eq!(passive_control.calls().len(), 2);
    assert_eq!(previous_passive.instance(), passive.instance());
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
fn passive_effects_committed_execution_gate_rejects_missing_handoff_before_callbacks() {
    let (mut store, root_id, host) = root_store();
    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(1_060),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let mut control = TestPassiveEffectCallbackControl::default()
        .with_destroy_result(callback(1_061), Ok(()))
        .with_create_result(callback(1_062), Ok(Some(callback(1_063))));

    let error =
        execute_passive_effect_callbacks_after_commit_from_committed_fiber_effects_under_test_control_for_canary(
            &mut store,
            &commit,
            &mut control,
        )
        .unwrap_err();

    assert!(matches!(
        error,
        PassiveEffectsFlushError::CommittedPassiveCallbackInvocationMissingHandoff { root }
            if root == root_id
    ));
    assert!(control.calls().is_empty());
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
fn passive_effects_committed_execution_gate_rejects_stale_fiber_before_callbacks() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(1_070);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(1_071),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(1_072),
            deps(1_073),
            Some(callback(1_074)),
        )
        .unwrap();

    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(1_075),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let mode = store.fiber_arena().get(finished_work).unwrap().mode();
    let stale_finished_function =
        create_function_component_fiber(&mut store, mode, PropsHandle::from_raw(1_076), component);
    store
        .fiber_arena_mut()
        .link_alternates(current_function, stale_finished_function)
        .unwrap();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), stale_finished_function)
        .unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(1_077),
            deps(1_078),
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

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    commit
        .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
            &queued,
        ))
        .unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut control = TestPassiveEffectCallbackControl::default()
        .with_destroy_result(callback(1_074), Ok(()))
        .with_create_result(callback(1_077), Ok(Some(callback(1_079))));

    let error =
        execute_update_passive_effect_callbacks_after_commit_from_accepted_committed_function_component_under_test_control_for_canary(
            &mut store,
            &commit,
            &mut control,
        )
        .unwrap_err();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert!(matches!(
        error,
        PassiveEffectsFlushError::CommittedPassiveCallbackInvocationStaleFiber {
            root,
            finished_work: error_finished_work,
            fiber,
        } if root == root_id
            && error_finished_work == finished_work
            && fiber == stale_finished_function
    ));
    assert!(control.calls().is_empty());
    assert_eq!(pending_passive.root(), Some(root_id));
    assert_eq!(pending_passive.finished_work(), Some(finished_work));
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(pending_passive.passive_unmount_count(), 1);
    assert_eq!(pending_passive.passive_mount_count(), 1);
    assert_eq!(pending_passive.pending_record_count(), 2);
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
fn passive_effects_committed_execution_gate_rejects_mount_phase_before_callbacks() {
    let (mut store, root_id, host) = root_store();
    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(1_080),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let function_fiber = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(1_081),
        FiberTypeHandle::from_raw(1_082),
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), function_fiber)
        .unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Mount);
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(1_083),
            deps(1_084),
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
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let committed = commit
        .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
            &queued,
        ))
        .unwrap()
        .clone();
    assert_eq!(committed.fiber_count(), 1);
    assert_eq!(
        committed.fibers()[0].phase(),
        FunctionComponentHookRenderPhase::Mount
    );
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut control = TestPassiveEffectCallbackControl::default()
        .with_create_result(callback(1_083), Ok(Some(callback(1_085))));

    let error =
        execute_update_passive_effect_callbacks_after_commit_from_accepted_committed_function_component_under_test_control_for_canary(
            &mut store,
            &commit,
            &mut control,
        )
        .unwrap_err();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert!(matches!(
        error,
        PassiveEffectsFlushError::CommittedPassiveCallbackInvocationWrongRenderPhase {
            root,
            fiber,
            expected: FunctionComponentHookRenderPhase::Update,
            actual: FunctionComponentHookRenderPhase::Mount,
        } if root == root_id && fiber == function_fiber
    ));
    assert!(control.calls().is_empty());
    assert_eq!(pending_passive.root(), Some(root_id));
    assert_eq!(pending_passive.finished_work(), Some(finished_work));
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(pending_passive.passive_unmount_count(), 0);
    assert_eq!(pending_passive.passive_mount_count(), 1);
    assert_eq!(pending_passive.pending_record_count(), 1);
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
fn passive_effects_callback_invocation_gate_invokes_destroy_before_create_under_test_control() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(840);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(841),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(842),
            deps(843),
            Some(callback(844)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(845), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(846),
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
            callback(847),
            deps(848),
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

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let flush = flush_passive_effects_after_commit_with_function_component_handoffs(
        &mut store,
        &commit,
        std::slice::from_ref(&queued),
    )
    .unwrap();
    assert_eq!(flush.records().len(), 2);
    assert!(!flush.records()[0].destroy_callback_invoked());
    assert!(!flush.records()[1].create_callback_invoked());
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut control = TestPassiveEffectCallbackControl::default()
        .with_destroy_result(callback(844), Ok(()))
        .with_create_result(callback(847), Ok(Some(callback(849))));

    let gate = invoke_passive_effect_callbacks_under_test_control(flush, &mut control);

    assert_eq!(gate.root(), root_id);
    assert_eq!(gate.finished_work(), Some(finished_work));
    assert_eq!(gate.lanes(), Lanes::DEFAULT);
    assert_eq!(gate.flush_status(), PassiveEffectsFlushStatus::Flushed);
    assert_eq!(gate.flush_record_count(), 2);
    assert_eq!(gate.skipped_flush_records_without_callbacks(), 0);
    assert_eq!(gate.len(), 2);
    assert_eq!(gate.completed_count(), 2);
    assert_eq!(gate.error_count(), 0);
    assert!(!gate.has_errors());
    assert_eq!(gate.errors(), Vec::new());
    assert_eq!(
        gate.status(),
        PassiveEffectCallbackInvocationGateStatus::TestControlOnly
    );
    assert_eq!(
        gate.blockers(),
        &PASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
    );
    assert!(!gate.public_effect_execution_enabled());
    assert!(!gate.public_act_compatibility_claimed());
    assert!(!gate.scheduler_driven_passive_execution_enabled());

    let records = gate.records();
    assert_eq!(records[0].invocation_order(), 0);
    assert_eq!(
        records[0].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(
        records[0].kind().phase(),
        PendingPassiveEffectPhase::Unmount
    );
    assert_eq!(records[0].phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(records[0].flush_index(), 0);
    assert_eq!(
        records[0].pending_order(),
        queued_effect.unmount_order().unwrap()
    );
    assert_eq!(records[0].root(), root_id);
    assert_eq!(records[0].finished_work(), finished_work);
    assert_eq!(records[0].committed_lanes(), Lanes::DEFAULT);
    assert_eq!(records[0].fiber(), finished_function);
    assert_eq!(records[0].effect_lanes(), Lanes::DEFAULT);
    assert_eq!(records[0].effect_index(), 0);
    assert_eq!(records[0].effect(), registration.effect());
    assert_eq!(records[0].instance(), previous.instance());
    assert_eq!(records[0].instance(), registration.instance());
    assert_eq!(records[0].callback(), callback(844));
    assert_eq!(
        records[0].status(),
        PassiveEffectCallbackInvocationStatus::Completed
    );
    assert!(records[0].completed());
    assert!(!records[0].errored());
    assert_eq!(records[0].error(), None);
    assert_eq!(records[0].returned_destroy(), None);

    assert_eq!(records[1].invocation_order(), 1);
    assert_eq!(
        records[1].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert_eq!(records[1].kind().phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(records[1].phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(records[1].flush_index(), 1);
    assert_eq!(records[1].pending_order(), queued_effect.mount_order());
    assert_eq!(records[1].root(), root_id);
    assert_eq!(records[1].finished_work(), finished_work);
    assert_eq!(records[1].committed_lanes(), Lanes::DEFAULT);
    assert_eq!(records[1].fiber(), finished_function);
    assert_eq!(records[1].effect_lanes(), Lanes::DEFAULT);
    assert_eq!(records[1].effect_index(), 0);
    assert_eq!(records[1].effect(), registration.effect());
    assert_eq!(records[1].instance(), registration.instance());
    assert_eq!(records[1].callback(), callback(847));
    assert_eq!(
        records[1].status(),
        PassiveEffectCallbackInvocationStatus::Completed
    );
    assert!(records[1].completed());
    assert!(!records[1].errored());
    assert_eq!(records[1].error(), None);
    assert_eq!(records[1].returned_destroy(), Some(callback(849)));
    assert_eq!(records[1].request().callback(), callback(847));

    assert_eq!(control.calls().len(), 2);
    assert_eq!(
        control.calls()[0].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(control.calls()[0].callback(), callback(844));
    assert_eq!(
        control.calls()[1].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert_eq!(control.calls()[1].callback(), callback(847));
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_callback_gate_runs_unmount_destroys_before_creates_after_error() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(910);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(911),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_first = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(912),
            deps(913),
            Some(callback(914)),
        )
        .unwrap();
    let previous_second = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(915),
            deps(916),
            Some(callback(917)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(918), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(919),
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
    let first_registration = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(920),
            deps(921),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    let second_registration = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(922),
            deps(923),
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
    assert_eq!(queued.records().len(), 2);
    assert_eq!(queued.queued_unmount_count(), 2);
    assert_eq!(queued.queued_mount_count(), 2);
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let flush = flush_passive_effects_after_commit_with_function_component_handoffs(
        &mut store,
        &commit,
        std::slice::from_ref(&queued),
    )
    .unwrap();
    assert_eq!(flush.records().len(), 4);
    assert_eq!(
        flush.records()[0].phase(),
        PendingPassiveEffectPhase::Unmount
    );
    assert_eq!(
        flush.records()[1].phase(),
        PendingPassiveEffectPhase::Unmount
    );
    assert_eq!(flush.records()[2].phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(flush.records()[3].phase(), PendingPassiveEffectPhase::Mount);
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut control = TestPassiveEffectCallbackControl::default()
        .with_destroy_result(callback(914), Err(callback_error(930)))
        .with_destroy_result(callback(917), Ok(()))
        .with_create_result(callback(920), Ok(Some(callback(931))))
        .with_create_result(callback(922), Ok(None));

    let gate = invoke_passive_effect_callbacks_under_test_control(flush, &mut control);

    assert_eq!(gate.root(), root_id);
    assert_eq!(gate.finished_work(), Some(finished_work));
    assert_eq!(gate.lanes(), Lanes::DEFAULT);
    assert_eq!(gate.flush_status(), PassiveEffectsFlushStatus::Flushed);
    assert_eq!(gate.flush_record_count(), 4);
    assert_eq!(gate.skipped_flush_records_without_callbacks(), 0);
    assert_eq!(gate.len(), 4);
    assert_eq!(gate.completed_count(), 3);
    assert_eq!(gate.error_count(), 1);
    assert!(gate.has_errors());
    assert_eq!(gate.errors(), vec![callback_error(930)]);
    assert!(!gate.public_effect_execution_enabled());
    assert!(!gate.public_act_compatibility_claimed());
    assert!(!gate.scheduler_driven_passive_execution_enabled());

    let records = gate.records();
    assert_eq!(records[0].invocation_order(), 0);
    assert_eq!(records[1].invocation_order(), 1);
    assert_eq!(records[2].invocation_order(), 2);
    assert_eq!(records[3].invocation_order(), 3);
    assert_eq!(
        records[0].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(
        records[1].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(
        records[2].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert_eq!(
        records[3].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert_eq!(records[0].phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(records[1].phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(records[2].phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(records[3].phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(records[0].flush_index(), 0);
    assert_eq!(records[1].flush_index(), 1);
    assert_eq!(records[2].flush_index(), 2);
    assert_eq!(records[3].flush_index(), 3);
    assert_eq!(
        records[0].pending_order(),
        queued.records()[0].unmount_order().unwrap()
    );
    assert_eq!(
        records[1].pending_order(),
        queued.records()[1].unmount_order().unwrap()
    );
    assert_eq!(
        records[2].pending_order(),
        queued.records()[0].mount_order()
    );
    assert_eq!(
        records[3].pending_order(),
        queued.records()[1].mount_order()
    );
    assert!(records[1].pending_order() < records[2].pending_order());
    assert_eq!(records[0].fiber(), finished_function);
    assert_eq!(records[1].fiber(), finished_function);
    assert_eq!(records[2].fiber(), finished_function);
    assert_eq!(records[3].fiber(), finished_function);
    assert_eq!(records[0].effect_index(), 0);
    assert_eq!(records[1].effect_index(), 1);
    assert_eq!(records[2].effect_index(), 0);
    assert_eq!(records[3].effect_index(), 1);
    assert_eq!(records[0].effect(), first_registration.effect());
    assert_eq!(records[1].effect(), second_registration.effect());
    assert_eq!(records[2].effect(), first_registration.effect());
    assert_eq!(records[3].effect(), second_registration.effect());
    assert_eq!(records[0].instance(), previous_first.instance());
    assert_eq!(records[1].instance(), previous_second.instance());
    assert_eq!(records[2].instance(), first_registration.instance());
    assert_eq!(records[3].instance(), second_registration.instance());
    assert_eq!(records[0].callback(), callback(914));
    assert_eq!(records[1].callback(), callback(917));
    assert_eq!(records[2].callback(), callback(920));
    assert_eq!(records[3].callback(), callback(922));
    assert_eq!(
        records[0].status(),
        PassiveEffectCallbackInvocationStatus::Errored
    );
    assert_eq!(
        records[1].status(),
        PassiveEffectCallbackInvocationStatus::Completed
    );
    assert_eq!(
        records[2].status(),
        PassiveEffectCallbackInvocationStatus::Completed
    );
    assert_eq!(
        records[3].status(),
        PassiveEffectCallbackInvocationStatus::Completed
    );
    assert!(records[0].errored());
    assert!(records[1].completed());
    assert!(records[2].completed());
    assert!(records[3].completed());
    assert_eq!(records[0].error(), Some(callback_error(930)));
    assert_eq!(records[1].error(), None);
    assert_eq!(records[2].error(), None);
    assert_eq!(records[3].error(), None);
    assert_eq!(records[0].returned_destroy(), None);
    assert_eq!(records[1].returned_destroy(), None);
    assert_eq!(records[2].returned_destroy(), Some(callback(931)));
    assert_eq!(records[3].returned_destroy(), None);

    assert_eq!(control.calls().len(), 4);
    assert_eq!(
        control.calls()[0].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(
        control.calls()[1].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(
        control.calls()[2].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert_eq!(
        control.calls()[3].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert_eq!(control.calls()[0].callback(), callback(914));
    assert_eq!(control.calls()[1].callback(), callback(917));
    assert_eq!(control.calls()[2].callback(), callback(920));
    assert_eq!(control.calls()[3].callback(), callback(922));
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
fn passive_effects_callback_invocation_gate_records_errors_without_public_act() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(850);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(851),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(852),
            deps(853),
            Some(callback(854)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(855), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_function = append_function_component_child(
        &mut store,
        render.finished_work(),
        PropsHandle::from_raw(856),
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
            callback(857),
            deps(858),
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
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let flush = flush_passive_effects_after_commit_with_function_component_handoffs(
        &mut store,
        &commit,
        std::slice::from_ref(&queued),
    )
    .unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut control = TestPassiveEffectCallbackControl::default()
        .with_destroy_result(callback(854), Err(callback_error(901)))
        .with_create_result(callback(857), Err(callback_error(902)));

    let gate = invoke_passive_effect_callbacks_under_test_control(flush, &mut control);

    assert_eq!(gate.len(), 2);
    assert_eq!(gate.completed_count(), 0);
    assert_eq!(gate.error_count(), 2);
    assert!(gate.has_errors());
    assert_eq!(
        gate.errors(),
        vec![callback_error(901), callback_error(902)]
    );
    assert!(!gate.public_effect_execution_enabled());
    assert!(!gate.public_act_compatibility_claimed());
    assert!(!gate.scheduler_driven_passive_execution_enabled());

    let records = gate.records();
    assert_eq!(records[0].invocation_order(), 0);
    assert_eq!(
        records[0].kind(),
        PassiveEffectCallbackInvocationKind::Destroy
    );
    assert_eq!(
        records[0].status(),
        PassiveEffectCallbackInvocationStatus::Errored
    );
    assert!(!records[0].completed());
    assert!(records[0].errored());
    assert_eq!(records[0].error(), Some(callback_error(901)));
    assert_eq!(records[0].returned_destroy(), None);
    assert_eq!(records[1].invocation_order(), 1);
    assert_eq!(
        records[1].kind(),
        PassiveEffectCallbackInvocationKind::Create
    );
    assert_eq!(
        records[1].status(),
        PassiveEffectCallbackInvocationStatus::Errored
    );
    assert!(!records[1].completed());
    assert!(records[1].errored());
    assert_eq!(records[1].error(), Some(callback_error(902)));
    assert_eq!(records[1].returned_destroy(), None);
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
fn passive_effects_destroy_executor_runs_unmounts_in_flush_order_and_records_errors() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(880);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(881),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_first = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(882),
            deps(883),
            Some(callback(884)),
        )
        .unwrap();
    let previous_second = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(885),
            deps(886),
            Some(callback(887)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(888), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(889),
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
    let first_registration = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(890),
            deps(891),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    let second_registration = hook_store
        .update_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(892),
            deps(893),
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
    assert_eq!(queued.records().len(), 2);
    assert_eq!(queued.queued_unmount_count(), 2);
    assert_eq!(queued.queued_mount_count(), 2);

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let mut destroy_executor =
        RecordingDestroyExecutor::with_error(callback(884), destroy_error(900));
    let flush = flush_passive_effects_after_commit_with_destroy_executor(
        &mut store,
        &commit,
        std::slice::from_ref(&queued),
        &mut destroy_executor,
    )
    .unwrap();

    assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert_eq!(flush.records().len(), 4);
    assert!(flush.did_execute_destroy_callbacks());
    assert!(flush.did_record_destroy_callback_errors());
    assert_eq!(flush.destroy_callback_executions().len(), 2);
    assert_eq!(flush.destroy_callback_errors().len(), 1);
    assert!(!flush.did_execute_mount_create_callbacks());
    assert!(!flush.did_record_mount_create_callback_errors());
    assert!(flush.mount_create_callback_executions().is_empty());
    assert!(flush.mount_create_callback_errors().is_empty());
    assert_eq!(destroy_executor.calls().len(), 2);

    let first_unmount = flush.records()[0];
    let second_unmount = flush.records()[1];
    let first_mount = flush.records()[2];
    let second_mount = flush.records()[3];
    assert_eq!(first_unmount.flush_index(), 0);
    assert_eq!(second_unmount.flush_index(), 1);
    assert_eq!(first_mount.flush_index(), 2);
    assert_eq!(second_mount.flush_index(), 3);
    assert_eq!(first_unmount.phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(second_unmount.phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(first_mount.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(second_mount.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(
        first_unmount.pending_order(),
        queued.records()[0].unmount_order().unwrap()
    );
    assert_eq!(
        second_unmount.pending_order(),
        queued.records()[1].unmount_order().unwrap()
    );
    assert_eq!(
        first_mount.pending_order(),
        queued.records()[0].mount_order()
    );
    assert_eq!(
        second_mount.pending_order(),
        queued.records()[1].mount_order()
    );
    assert!(first_unmount.pending_order() < second_unmount.pending_order());
    assert!(second_unmount.pending_order() < first_mount.pending_order());
    assert!(first_mount.pending_order() < second_mount.pending_order());

    assert_eq!(first_unmount.effect_index(), Some(0));
    assert_eq!(second_unmount.effect_index(), Some(1));
    assert_eq!(first_unmount.effect(), Some(first_registration.effect()));
    assert_eq!(second_unmount.effect(), Some(second_registration.effect()));
    assert_eq!(
        first_unmount.effect_instance(),
        Some(previous_first.instance())
    );
    assert_eq!(
        second_unmount.effect_instance(),
        Some(previous_second.instance())
    );
    assert_eq!(first_unmount.destroy_callback(), Some(callback(884)));
    assert_eq!(second_unmount.destroy_callback(), Some(callback(887)));
    assert!(first_unmount.destroy_callback_invoked());
    assert!(second_unmount.destroy_callback_invoked());
    assert!(!first_mount.destroy_callback_invoked());
    assert!(!second_mount.destroy_callback_invoked());
    assert!(!first_unmount.create_callback_invoked());
    assert!(!second_unmount.create_callback_invoked());
    assert_eq!(
        first_unmount.unmount_origin(),
        Some(PendingPassiveUnmountOrigin::UpdatedFiber)
    );
    assert_eq!(
        second_unmount.unmount_origin(),
        Some(PendingPassiveUnmountOrigin::UpdatedFiber)
    );

    let first_execution = flush.destroy_callback_executions()[0];
    let second_execution = flush.destroy_callback_executions()[1];
    assert_eq!(first_execution.execution_order(), 0);
    assert_eq!(second_execution.execution_order(), 1);
    assert_eq!(first_execution.flush_index(), first_unmount.flush_index());
    assert_eq!(second_execution.flush_index(), second_unmount.flush_index());
    assert_eq!(first_execution.root(), root_id);
    assert_eq!(first_execution.finished_work(), finished_work);
    assert_eq!(first_execution.committed_lanes(), Lanes::DEFAULT);
    assert_eq!(first_execution.fiber(), finished_function);
    assert_eq!(second_execution.fiber(), finished_function);
    assert_eq!(first_execution.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(second_execution.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(first_execution.phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(second_execution.phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(
        first_execution.pending_order(),
        first_unmount.pending_order()
    );
    assert_eq!(
        second_execution.pending_order(),
        second_unmount.pending_order()
    );
    assert_eq!(
        first_execution.unmount_origin(),
        Some(PendingPassiveUnmountOrigin::UpdatedFiber)
    );
    assert_eq!(
        second_execution.unmount_origin(),
        Some(PendingPassiveUnmountOrigin::UpdatedFiber)
    );
    assert_eq!(first_execution.effect_index(), Some(0));
    assert_eq!(second_execution.effect_index(), Some(1));
    assert_eq!(first_execution.effect(), Some(first_registration.effect()));
    assert_eq!(
        second_execution.effect(),
        Some(second_registration.effect())
    );
    assert_eq!(
        first_execution.effect_instance(),
        Some(previous_first.instance())
    );
    assert_eq!(
        second_execution.effect_instance(),
        Some(previous_second.instance())
    );
    assert_eq!(first_execution.destroy_callback(), callback(884));
    assert_eq!(second_execution.destroy_callback(), callback(887));
    assert_eq!(destroy_executor.calls()[0], first_execution.request());
    assert_eq!(destroy_executor.calls()[1], second_execution.request());

    let error = flush.destroy_callback_errors()[0];
    assert_eq!(error.execution(), first_execution);
    assert_eq!(error.error(), destroy_error(900));
    assert!(error.error().is_some());
    assert!(!error.error().is_none());
    assert_eq!(error.error().raw(), 900);

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
fn passive_effects_deleted_subtree_destroy_executor_consumes_private_order_metadata() {
    let (mut store, root_id, host) = root_store();
    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(9_940),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let fixture =
        attach_deleted_host_subtree_ref_passive_fixture(&mut store, &mut hook_store, finished_work);
    let deleted_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        finished_work,
        fixture.deleted_host,
        Lanes::DEFAULT,
    )
    .unwrap();
    assert_eq!(deleted_handoff.queued_unmount_count(), 1);
    let queued_passive = deleted_handoff.records()[0];

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let passive_snapshot = commit
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[deleted_handoff])
        .unwrap()
        .clone();
    let order_gate = commit.deletion_cleanup_order_gate_for_canary();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut destroy_executor = RecordingDestroyExecutor::default();

    let flush =
        flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary(
            &mut store,
            &commit,
            &mut destroy_executor,
        )
        .unwrap();

    assert_eq!(passive_snapshot.len(), 1);
    assert_eq!(passive_snapshot.destroy_count(), 1);
    assert_eq!(passive_snapshot.records()[0], queued_passive);
    assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(flush.consumed_pending_passive());
    assert_eq!(flush.root(), root_id);
    assert_eq!(flush.finished_work(), Some(finished_work));
    assert_eq!(flush.lanes(), Lanes::DEFAULT);
    assert_eq!(flush.records().len(), 1);
    assert!(flush.did_execute_destroy_callbacks());
    assert!(!flush.did_record_destroy_callback_errors());
    assert_eq!(flush.destroy_callback_executions().len(), 1);
    assert!(flush.destroy_callback_errors().is_empty());
    assert!(!flush.did_execute_mount_create_callbacks());
    assert!(flush.mount_create_callback_executions().is_empty());
    assert!(!flush.public_effect_execution_enabled());
    assert!(!flush.public_act_compatibility_claimed());
    assert!(!flush.scheduler_driven_passive_execution_enabled());

    let record = flush.records()[0];
    assert_eq!(record.flush_index(), 0);
    assert_eq!(record.fiber(), fixture.deleted_function);
    assert_eq!(record.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(record.phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(record.pending_order(), queued_passive.unmount_order());
    assert_eq!(
        record.unmount_origin(),
        Some(PendingPassiveUnmountOrigin::DeletedSubtree {
            nearest_mounted_ancestor: finished_work,
        })
    );
    assert_eq!(record.effect_index(), Some(0));
    assert_eq!(record.effect(), Some(queued_passive.effect()));
    assert_eq!(record.effect_instance(), Some(queued_passive.instance()));
    assert_eq!(record.create_callback(), None);
    assert_eq!(record.destroy_callback(), Some(fixture.passive_destroy));
    assert!(record.destroy_callback_invoked());
    assert!(!record.create_callback_invoked());

    let execution = flush.destroy_callback_executions()[0];
    assert_eq!(execution.execution_order(), 0);
    assert_eq!(execution.flush_index(), 0);
    assert_eq!(execution.root(), root_id);
    assert_eq!(execution.finished_work(), finished_work);
    assert_eq!(execution.committed_lanes(), Lanes::DEFAULT);
    assert_eq!(execution.fiber(), fixture.deleted_function);
    assert_eq!(execution.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(execution.phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(execution.pending_order(), queued_passive.unmount_order());
    assert_eq!(execution.effect_index(), Some(0));
    assert_eq!(execution.effect(), Some(queued_passive.effect()));
    assert_eq!(execution.effect_instance(), Some(queued_passive.instance()));
    assert_eq!(execution.destroy_callback(), fixture.passive_destroy);
    assert_eq!(
        execution.unmount_origin(),
        Some(PendingPassiveUnmountOrigin::DeletedSubtree {
            nearest_mounted_ancestor: finished_work,
        })
    );
    assert_eq!(destroy_executor.calls(), &[execution.request()]);

    assert_eq!(order_gate.len(), 4);
    assert_eq!(order_gate.ref_cleanup_return_count(), 1);
    assert_eq!(order_gate.passive_destroy_count(), 1);
    assert_eq!(order_gate.host_node_cleanup_count(), 2);
    assert_eq!(
        order_gate
            .records()
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
    assert_eq!(order_gate.records()[0].fiber(), fixture.deleted_host);
    assert_eq!(
        order_gate.records()[0].ref_cleanup_return_sequence(),
        Some(0)
    );
    assert_eq!(order_gate.records()[1].fiber(), fixture.deleted_function);
    assert_eq!(
        order_gate.records()[1].passive_unmount_order(),
        Some(queued_passive.unmount_order())
    );
    assert_eq!(
        order_gate.records()[1].passive_destroy(),
        Some(fixture.passive_destroy)
    );
    assert_eq!(order_gate.records()[2].fiber(), fixture.deleted_text);
    assert_eq!(order_gate.records()[2].host_cleanup_sequence(), Some(0));
    assert_eq!(order_gate.records()[3].fiber(), fixture.deleted_host);
    assert_eq!(order_gate.records()[3].host_cleanup_sequence(), Some(1));
    assert!(!order_gate.ref_cleanup_return_callbacks_invoked());
    assert!(!order_gate.passive_destroy_callbacks_invoked());
    assert!(!order_gate.public_effects_flushed());
    assert!(!order_gate.public_ref_or_effect_compatibility_claimed());

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
fn passive_effects_deleted_subtree_unmount_lifecycle_execution_evidence_consumes_cleanup_order_metadata()
 {
    let (mut store, root_id, host) = root_store();
    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(9_930),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let fixture =
        attach_deleted_host_subtree_ref_passive_fixture(&mut store, &mut hook_store, finished_work);
    let deleted_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        finished_work,
        fixture.deleted_host,
        Lanes::DEFAULT,
    )
    .unwrap();
    let queued_passive = deleted_handoff.records()[0];

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    commit
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[deleted_handoff])
        .unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut destroy_executor = RecordingDestroyExecutor::default();

    let flush =
        flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary(
            &mut store,
            &commit,
            &mut destroy_executor,
        )
        .unwrap();
    let evidence = record_deleted_subtree_unmount_effect_lifecycle_execution_evidence_for_canary(
        &commit, &flush,
    )
    .unwrap();

    assert_eq!(evidence.root(), Some(root_id));
    assert_eq!(evidence.finished_work(), Some(finished_work));
    assert_eq!(evidence.lanes(), Lanes::DEFAULT);
    assert_eq!(evidence.len(), 4);
    assert_eq!(evidence.private_layout_callback_count(), 0);
    assert_eq!(evidence.private_passive_callback_count(), 1);
    assert!(evidence.proves_deleted_subtree_unmount_destroy_order());
    assert!(!evidence.public_effect_execution_enabled());
    assert!(!evidence.public_effect_compatibility_claimed());
    assert!(!evidence.public_act_compatibility_claimed());
    assert!(!evidence.scheduler_driven_passive_execution_enabled());
    assert_eq!(
        evidence
            .records()
            .iter()
            .map(|record| record.kind_name())
            .collect::<Vec<_>>(),
        vec![
            "deleted-subtree-passive-destroy-metadata",
            "deleted-subtree-passive-destroy-callback",
            "deleted-subtree-host-cleanup-metadata",
            "deleted-subtree-host-cleanup-metadata",
        ]
    );
    assert_eq!(
        evidence
            .records()
            .iter()
            .map(|record| record.phase_name())
            .collect::<Vec<_>>(),
        vec!["passive", "passive", "mutation", "mutation"]
    );

    let records = evidence.records();
    assert_eq!(records[0].fiber(), fixture.deleted_function);
    assert_eq!(records[0].effect(), Some(queued_passive.effect()));
    assert_eq!(records[0].callback(), Some(fixture.passive_destroy));
    assert_eq!(
        records[0].pending_order(),
        Some(queued_passive.unmount_order())
    );
    assert_eq!(records[1].fiber(), fixture.deleted_function);
    assert_eq!(records[1].effect(), Some(queued_passive.effect()));
    assert_eq!(records[1].callback(), Some(fixture.passive_destroy));
    assert_eq!(records[1].invocation_order(), Some(0));
    assert_eq!(
        records[1].pending_order(),
        Some(queued_passive.unmount_order())
    );
    assert_eq!(
        records[0].metadata_sequence(),
        records[1].metadata_sequence()
    );
    assert!(records[0].metadata_sequence().unwrap() < records[2].metadata_sequence().unwrap());
    assert_eq!(records[2].fiber(), fixture.deleted_text);
    assert_eq!(records[3].fiber(), fixture.deleted_host);

    assert_eq!(flush.destroy_callback_executions().len(), 1);
    assert_eq!(
        flush.destroy_callback_executions()[0].destroy_callback(),
        fixture.passive_destroy
    );
    assert_eq!(
        flush.destroy_callback_executions()[0].unmount_origin(),
        Some(PendingPassiveUnmountOrigin::DeletedSubtree {
            nearest_mounted_ancestor: finished_work,
        })
    );
    assert_eq!(
        destroy_executor.calls(),
        &[flush.destroy_callback_executions()[0].request()]
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
fn deletion_ref_passive_cleanup_execution_runs_ref_cleanup_before_deleted_passive_destroy() {
    let (mut store, root_id, host) = root_store();
    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(9_965),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let fixture =
        attach_deleted_host_subtree_ref_passive_fixture(&mut store, &mut hook_store, finished_work);
    let deleted_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        finished_work,
        fixture.deleted_host,
        Lanes::DEFAULT,
    )
    .unwrap();
    let queued_passive = deleted_handoff.records()[0];

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    commit
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[deleted_handoff])
        .unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut executor = RecordingDeletedCleanupExecutor::default();

    let execution = execute_deleted_subtree_ref_and_passive_cleanup_after_commit_for_canary(
        &mut store,
        &commit,
        &mut executor,
    )
    .unwrap();

    assert_eq!(execution.root(), root_id);
    assert_eq!(execution.finished_work(), finished_work);
    assert!(execution.ref_cleanup_return_callbacks_invoked());
    assert!(execution.passive_destroy_callbacks_invoked());
    assert!(!execution.public_unmount_compatibility_claimed());
    assert!(!execution.public_ref_or_effect_compatibility_claimed());
    assert_eq!(
        executor.events(),
        &[
            DeletedCleanupExecutionEvent::RefCleanup(fixture.deleted_host),
            DeletedCleanupExecutionEvent::PassiveDestroy(fixture.passive_destroy),
        ]
    );
    assert_eq!(executor.ref_cleanup_calls().len(), 1);
    assert_eq!(executor.destroy_calls().len(), 1);

    let ref_execution = execution.ref_cleanup_return_executions()[0];
    assert_eq!(ref_execution.execution_order(), 0);
    assert_eq!(ref_execution.root(), root_id);
    assert_eq!(ref_execution.finished_work(), finished_work);
    assert_eq!(ref_execution.deleted_root(), fixture.deleted_host);
    assert_eq!(ref_execution.fiber(), fixture.deleted_host);
    assert_eq!(ref_execution.state_node(), fixture.deleted_host_state_node);
    assert_eq!(ref_execution.ref_handle(), fixture.deleted_host_ref);
    assert_eq!(ref_execution.request(), executor.ref_cleanup_calls()[0]);
    assert_eq!(ref_execution.request().order_gate_sequence(), 0);
    assert_eq!(ref_execution.request().cleanup_return_sequence(), 0);

    let passive = execution.passive_effects().unwrap();
    assert_eq!(passive.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(passive.consumed_pending_passive());
    assert!(passive.did_execute_destroy_callbacks());
    assert!(!passive.public_effect_execution_enabled());
    assert!(!passive.public_act_compatibility_claimed());
    assert!(!passive.scheduler_driven_passive_execution_enabled());
    assert_eq!(passive.destroy_callback_executions().len(), 1);
    assert_eq!(passive.records().len(), 1);
    assert_eq!(
        passive.records()[0].unmount_origin(),
        Some(PendingPassiveUnmountOrigin::DeletedSubtree {
            nearest_mounted_ancestor: finished_work,
        })
    );
    assert_eq!(
        passive.records()[0].destroy_callback(),
        Some(fixture.passive_destroy)
    );
    assert!(passive.records()[0].destroy_callback_invoked());

    let passive_execution = passive.destroy_callback_executions()[0];
    assert_eq!(passive_execution.execution_order(), 0);
    assert_eq!(passive_execution.fiber(), fixture.deleted_function);
    assert_eq!(
        passive_execution.pending_order(),
        queued_passive.unmount_order()
    );
    assert_eq!(
        passive_execution.destroy_callback(),
        fixture.passive_destroy
    );
    assert_eq!(executor.destroy_calls()[0], passive_execution.request());

    let records = execution.records();
    assert_eq!(records.len(), 4);
    assert_eq!(
        records
            .iter()
            .map(|record| record.sequence())
            .collect::<Vec<_>>(),
        vec![0, 1, 2, 3]
    );
    assert_eq!(
        records
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
    assert_eq!(records[0].order_gate_sequence(), 0);
    assert_eq!(records[0].fiber(), fixture.deleted_host);
    assert_eq!(records[0].deleted_root(), fixture.deleted_host);
    assert_eq!(records[0].ref_cleanup_return_execution_order(), Some(0));
    assert_eq!(records[0].passive_destroy_execution_order(), None);
    assert_eq!(records[0].host_cleanup_sequence(), None);
    assert_eq!(records[1].order_gate_sequence(), 1);
    assert_eq!(records[1].fiber(), fixture.deleted_function);
    assert_eq!(records[1].deleted_root(), fixture.deleted_host);
    assert_eq!(records[1].ref_cleanup_return_execution_order(), None);
    assert_eq!(records[1].passive_destroy_execution_order(), Some(0));
    assert_eq!(records[1].host_cleanup_sequence(), None);
    assert_eq!(records[2].fiber(), fixture.deleted_text);
    assert_eq!(records[2].host_cleanup_sequence(), Some(0));
    assert_eq!(records[3].fiber(), fixture.deleted_host);
    assert_eq!(records[3].host_cleanup_sequence(), Some(1));

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
    assert!(
        !commit
            .host_node_deletion_cleanup_log()
            .public_unmount_compatibility_claimed()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn deletion_ref_passive_cleanup_execution_orders_nested_host_refs_before_passive_destroy() {
    let (mut store, root_id, host) = root_store();
    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(9_966),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let fixture = attach_nested_deleted_host_subtree_ref_passive_fixture(
        &mut store,
        &mut hook_store,
        finished_work,
    );
    let deleted_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        fixture.host_parent,
        fixture.deleted_host,
        Lanes::DEFAULT,
    )
    .unwrap();
    let queued_passive = deleted_handoff.records()[0];

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    commit
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[deleted_handoff])
        .unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut executor = RecordingDeletedCleanupExecutor::default();

    let execution = execute_deleted_subtree_ref_and_passive_cleanup_after_commit_for_canary(
        &mut store,
        &commit,
        &mut executor,
    )
    .unwrap();

    assert_eq!(execution.root(), root_id);
    assert_eq!(execution.finished_work(), finished_work);
    assert!(execution.ref_cleanup_return_callbacks_invoked());
    assert!(execution.passive_destroy_callbacks_invoked());
    assert!(!execution.public_unmount_compatibility_claimed());
    assert!(!execution.public_ref_or_effect_compatibility_claimed());
    assert_eq!(
        executor.events(),
        &[
            DeletedCleanupExecutionEvent::RefCleanup(fixture.deleted_host),
            DeletedCleanupExecutionEvent::RefCleanup(fixture.nested_host),
            DeletedCleanupExecutionEvent::PassiveDestroy(fixture.passive_destroy),
        ]
    );
    assert_eq!(executor.ref_cleanup_calls().len(), 2);
    assert_eq!(executor.destroy_calls().len(), 1);

    let first_ref = execution.ref_cleanup_return_executions()[0];
    assert_eq!(first_ref.execution_order(), 0);
    assert_eq!(first_ref.deleted_root(), fixture.deleted_host);
    assert_eq!(first_ref.fiber(), fixture.deleted_host);
    assert_eq!(first_ref.state_node(), fixture.deleted_host_state_node);
    assert_eq!(first_ref.ref_handle(), fixture.deleted_host_ref);
    assert_eq!(first_ref.request(), executor.ref_cleanup_calls()[0]);
    assert_eq!(first_ref.request().order_gate_sequence(), 0);
    assert_eq!(first_ref.request().cleanup_return_sequence(), 0);

    let second_ref = execution.ref_cleanup_return_executions()[1];
    assert_eq!(second_ref.execution_order(), 1);
    assert_eq!(second_ref.deleted_root(), fixture.deleted_host);
    assert_eq!(second_ref.fiber(), fixture.nested_host);
    assert_eq!(second_ref.state_node(), fixture.nested_host_state_node);
    assert_eq!(second_ref.ref_handle(), fixture.nested_host_ref);
    assert_eq!(second_ref.request(), executor.ref_cleanup_calls()[1]);
    assert_eq!(second_ref.request().order_gate_sequence(), 1);
    assert_eq!(second_ref.request().cleanup_return_sequence(), 1);

    let passive = execution.passive_effects().unwrap();
    assert_eq!(passive.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(passive.consumed_pending_passive());
    assert!(passive.did_execute_destroy_callbacks());
    assert!(!passive.public_effect_execution_enabled());
    assert!(!passive.public_act_compatibility_claimed());
    assert!(!passive.scheduler_driven_passive_execution_enabled());
    assert_eq!(passive.records().len(), 1);
    assert_eq!(passive.records()[0].fiber(), fixture.deleted_function);
    assert_eq!(
        passive.records()[0].unmount_origin(),
        Some(PendingPassiveUnmountOrigin::DeletedSubtree {
            nearest_mounted_ancestor: fixture.host_parent,
        })
    );
    assert_eq!(
        passive.records()[0].destroy_callback(),
        Some(fixture.passive_destroy)
    );
    assert!(passive.records()[0].destroy_callback_invoked());
    assert_eq!(passive.destroy_callback_executions().len(), 1);
    let passive_execution = passive.destroy_callback_executions()[0];
    assert_eq!(passive_execution.execution_order(), 0);
    assert_eq!(passive_execution.fiber(), fixture.deleted_function);
    assert_eq!(
        passive_execution.pending_order(),
        queued_passive.unmount_order()
    );
    assert_eq!(
        passive_execution.destroy_callback(),
        fixture.passive_destroy
    );
    assert_eq!(executor.destroy_calls()[0], passive_execution.request());

    let records = execution.records();
    assert_eq!(records.len(), 6);
    assert_eq!(
        records
            .iter()
            .map(|record| record.sequence())
            .collect::<Vec<_>>(),
        vec![0, 1, 2, 3, 4, 5]
    );
    assert_eq!(
        records
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
    assert_eq!(records[0].fiber(), fixture.deleted_host);
    assert_eq!(records[0].deleted_root(), fixture.deleted_host);
    assert_eq!(records[0].ref_cleanup_return_execution_order(), Some(0));
    assert_eq!(records[0].passive_destroy_execution_order(), None);
    assert_eq!(records[0].host_cleanup_sequence(), None);
    assert_eq!(records[1].fiber(), fixture.nested_host);
    assert_eq!(records[1].deleted_root(), fixture.deleted_host);
    assert_eq!(records[1].ref_cleanup_return_execution_order(), Some(1));
    assert_eq!(records[1].passive_destroy_execution_order(), None);
    assert_eq!(records[1].host_cleanup_sequence(), None);
    assert_eq!(records[2].fiber(), fixture.deleted_function);
    assert_eq!(records[2].deleted_root(), fixture.deleted_host);
    assert_eq!(records[2].ref_cleanup_return_execution_order(), None);
    assert_eq!(records[2].passive_destroy_execution_order(), Some(0));
    assert_eq!(records[2].host_cleanup_sequence(), None);
    assert_eq!(records[3].fiber(), fixture.deleted_text);
    assert_eq!(records[3].host_cleanup_sequence(), Some(0));
    assert_eq!(records[4].fiber(), fixture.nested_host);
    assert_eq!(records[4].host_cleanup_sequence(), Some(1));
    assert_eq!(records[5].fiber(), fixture.deleted_host);
    assert_eq!(records[5].host_cleanup_sequence(), Some(2));

    assert_eq!(queued_passive.create(), fixture.passive_create);
    assert_eq!(queued_passive.destroy(), Some(fixture.passive_destroy));
    assert_eq!(queued_passive.dependencies(), fixture.passive_dependencies);
    assert_eq!(
        commit.host_node_deletion_cleanup_log().records()[0].state_node(),
        fixture.deleted_text_state_node
    );
    assert_eq!(
        commit.host_node_deletion_cleanup_log().records()[1].state_node(),
        fixture.nested_host_state_node
    );
    assert_eq!(
        commit.host_node_deletion_cleanup_log().records()[2].state_node(),
        fixture.deleted_host_state_node
    );
    for cleanup in commit.host_node_deletion_cleanup_log().records() {
        assert_eq!(cleanup.host_parent(), Some(fixture.host_parent));
        assert_eq!(
            cleanup.host_parent_state_node(),
            fixture.host_parent_state_node
        );
    }
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

fn passive_effects_deleted_subtree_destroy_executor_rejects_non_deleted_unmounts() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(9_950),
        FiberTypeHandle::from_raw(9_951),
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(9_952),
            deps(9_953),
            Some(callback(9_954)),
        )
        .unwrap();

    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(9_955),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(9_956),
        FiberTypeHandle::from_raw(9_951),
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
            callback(9_957),
            deps(9_958),
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
    assert_eq!(queued.queued_unmount_count(), 1);
    assert_eq!(queued.queued_mount_count(), 1);
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut destroy_executor = RecordingDestroyExecutor::default();

    let error =
        flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary(
            &mut store,
            &commit,
            &mut destroy_executor,
        )
        .unwrap_err();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert!(matches!(
        error,
        PassiveEffectsFlushError::CommittedPassiveEffectRecordCountMismatch {
            root,
            expected_unmounts: 1,
            actual_unmounts: 0,
            expected_mounts: 1,
            actual_mounts: 0,
        } if root == root_id
    ));
    assert_eq!(destroy_executor.calls().len(), 0);
    assert_eq!(pending_passive.root(), Some(root_id));
    assert_eq!(pending_passive.finished_work(), Some(finished_work));
    assert_eq!(pending_passive.passive_unmounts().len(), 1);
    assert_eq!(pending_passive.passive_mounts().len(), 1);
    assert_eq!(
        pending_passive.passive_unmounts()[0].unmount_origin(),
        Some(PendingPassiveUnmountOrigin::UpdatedFiber)
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
fn passive_effects_mount_create_executor_runs_mounts_in_flush_order_and_records_errors() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(910), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let function_fiber = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(911),
        FiberTypeHandle::from_raw(912),
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let state = hook_store
        .prepare_render_state(store.fiber_arena(), function_fiber)
        .unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Mount);
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let first_registration = hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(913),
            deps(914),
        )
        .unwrap();
    let second_registration = hook_store
        .mount_effect_metadata(
            store.fiber_arena_mut(),
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(915),
            deps(916),
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
    assert_eq!(queued.records().len(), 2);
    assert_eq!(queued.queued_unmount_count(), 0);
    assert_eq!(queued.queued_mount_count(), 2);

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut mount_create_executor = RecordingMountCreateExecutor::default()
        .with_error(callback(913), mount_create_error(917))
        .with_returned_destroy(callback(915), Some(callback(918)));

    let flush = flush_passive_effects_after_commit_with_mount_create_executor(
        &mut store,
        &commit,
        std::slice::from_ref(&queued),
        &mut mount_create_executor,
    )
    .unwrap();

    assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(flush.consumed_pending_passive());
    assert_eq!(flush.root(), root_id);
    assert_eq!(flush.finished_work(), Some(finished_work));
    assert_eq!(flush.lanes(), Lanes::DEFAULT);
    assert_eq!(flush.records().len(), 2);
    assert!(!flush.did_execute_destroy_callbacks());
    assert!(!flush.did_record_destroy_callback_errors());
    assert!(flush.destroy_callback_executions().is_empty());
    assert!(flush.destroy_callback_errors().is_empty());
    assert!(flush.did_execute_mount_create_callbacks());
    assert!(flush.did_record_mount_create_callback_errors());
    assert_eq!(flush.mount_create_callback_executions().len(), 2);
    assert_eq!(flush.mount_create_callback_errors().len(), 1);
    assert_eq!(
        flush.mount_create_callback_execution_gate_status(),
        PassiveEffectMountCreateCallbackExecutionGateStatus::TestControlOnly
    );
    assert_eq!(
        flush.mount_create_callback_execution_gate_blockers(),
        &PASSIVE_EFFECT_MOUNT_CREATE_CALLBACK_EXECUTION_GATE_BLOCKERS
    );
    assert!(!flush.public_effect_execution_enabled());
    assert!(!flush.public_act_compatibility_claimed());
    assert!(!flush.scheduler_driven_passive_execution_enabled());

    let first_mount = flush.records()[0];
    let second_mount = flush.records()[1];
    assert_eq!(first_mount.flush_index(), 0);
    assert_eq!(second_mount.flush_index(), 1);
    assert_eq!(first_mount.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(second_mount.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(
        first_mount.pending_order(),
        queued.records()[0].mount_order()
    );
    assert_eq!(
        second_mount.pending_order(),
        queued.records()[1].mount_order()
    );
    assert!(first_mount.pending_order() < second_mount.pending_order());
    assert_eq!(first_mount.fiber(), function_fiber);
    assert_eq!(second_mount.fiber(), function_fiber);
    assert_eq!(first_mount.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(second_mount.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(first_mount.effect_index(), Some(0));
    assert_eq!(second_mount.effect_index(), Some(1));
    assert_eq!(first_mount.effect(), Some(first_registration.effect()));
    assert_eq!(second_mount.effect(), Some(second_registration.effect()));
    assert_eq!(
        first_mount.effect_instance(),
        Some(first_registration.instance())
    );
    assert_eq!(
        second_mount.effect_instance(),
        Some(second_registration.instance())
    );
    assert_eq!(first_mount.create_callback(), Some(callback(913)));
    assert_eq!(second_mount.create_callback(), Some(callback(915)));
    assert_eq!(first_mount.destroy_callback(), None);
    assert_eq!(second_mount.destroy_callback(), None);
    assert!(first_mount.create_callback_invoked());
    assert!(second_mount.create_callback_invoked());
    assert!(!first_mount.destroy_callback_invoked());
    assert!(!second_mount.destroy_callback_invoked());
    assert_eq!(first_mount.unmount_origin(), None);
    assert_eq!(second_mount.unmount_origin(), None);

    let first_execution = flush.mount_create_callback_executions()[0];
    let second_execution = flush.mount_create_callback_executions()[1];
    assert_eq!(first_execution.execution_order(), 0);
    assert_eq!(second_execution.execution_order(), 1);
    assert_eq!(first_execution.flush_index(), first_mount.flush_index());
    assert_eq!(second_execution.flush_index(), second_mount.flush_index());
    assert_eq!(first_execution.root(), root_id);
    assert_eq!(second_execution.root(), root_id);
    assert_eq!(first_execution.finished_work(), finished_work);
    assert_eq!(second_execution.finished_work(), finished_work);
    assert_eq!(first_execution.committed_lanes(), Lanes::DEFAULT);
    assert_eq!(second_execution.committed_lanes(), Lanes::DEFAULT);
    assert_eq!(first_execution.fiber(), function_fiber);
    assert_eq!(second_execution.fiber(), function_fiber);
    assert_eq!(first_execution.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(second_execution.effect_lanes(), Lanes::DEFAULT);
    assert_eq!(first_execution.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(second_execution.phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(first_execution.pending_order(), first_mount.pending_order());
    assert_eq!(
        second_execution.pending_order(),
        second_mount.pending_order()
    );
    assert_eq!(first_execution.effect_index(), Some(0));
    assert_eq!(second_execution.effect_index(), Some(1));
    assert_eq!(first_execution.effect(), Some(first_registration.effect()));
    assert_eq!(
        second_execution.effect(),
        Some(second_registration.effect())
    );
    assert_eq!(
        first_execution.effect_instance(),
        Some(first_registration.instance())
    );
    assert_eq!(
        second_execution.effect_instance(),
        Some(second_registration.instance())
    );
    assert_eq!(first_execution.create_callback(), callback(913));
    assert_eq!(second_execution.create_callback(), callback(915));
    assert_eq!(first_execution.returned_destroy(), None);
    assert_eq!(second_execution.returned_destroy(), Some(callback(918)));
    assert_eq!(mount_create_executor.calls()[0], first_execution.request());
    assert_eq!(mount_create_executor.calls()[1], second_execution.request());

    let error = flush.mount_create_callback_errors()[0];
    assert_eq!(error.execution(), first_execution);
    assert_eq!(error.error(), mount_create_error(917));
    assert!(error.error().is_some());
    assert!(!error.error().is_none());
    assert_eq!(error.error().raw(), 917);

    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(first_registration.instance())
            .unwrap()
            .destroy(),
        None
    );
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(second_registration.instance())
            .unwrap()
            .destroy(),
        None
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
fn passive_effects_callback_executor_errors_preserve_cross_phase_order_and_block_root_errors() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(
            FakeContainer::new(1),
            RootOptions::new()
                .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(1001))
                .with_on_caught_error(RootErrorCallbackHandle::from_raw(1002))
                .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(1003)),
        )
        .unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let component = FiberTypeHandle::from_raw(1004);
    let current_function = append_function_component_child(
        &mut store,
        previous_current,
        PropsHandle::from_raw(1005),
        component,
    );
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            current_function,
            FunctionComponentEffectPhase::Passive,
            callback(1006),
            deps(1007),
            Some(callback(1008)),
        )
        .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(1009), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    let finished_function = append_function_component_child(
        &mut store,
        finished_work,
        PropsHandle::from_raw(1010),
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
            callback(1011),
            deps(1012),
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
    assert_eq!(queued.queued_unmount_count(), 1);
    assert_eq!(queued.queued_mount_count(), 1);
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut destroy_executor =
        RecordingDestroyExecutor::with_error(callback(1008), destroy_error(1013));
    let mut mount_create_executor = RecordingMountCreateExecutor::default()
        .with_error(callback(1011), mount_create_error(1014));

    let flush = flush_passive_effects_after_commit_with_callback_executors(
        &mut store,
        &commit,
        std::slice::from_ref(&queued),
        &mut destroy_executor,
        &mut mount_create_executor,
    )
    .unwrap();

    assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert_eq!(flush.records().len(), 2);
    assert_eq!(flush.destroy_callback_errors().len(), 1);
    assert_eq!(flush.mount_create_callback_errors().len(), 1);
    assert!(flush.did_record_callback_execution_errors());
    assert!(flush.did_schedule_root_error_captures());
    assert!(flush.did_record_root_error_routing());
    assert!(flush.did_record_blocked_root_error_propagation());
    assert!(!flush.public_effect_execution_enabled());
    assert!(!flush.public_act_compatibility_claimed());
    assert!(!flush.scheduler_driven_passive_execution_enabled());

    let root_error = flush.root_error_propagation().unwrap();
    assert_eq!(root_error.root(), root_id);
    let root_error_callbacks = root_error.error_option_callbacks();
    assert_eq!(root_error_callbacks.root(), root_id);
    assert_eq!(
        root_error_callbacks.phase(),
        RootErrorOptionCallbackPhase::Commit
    );
    assert_eq!(
        root_error.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(1001)
    );
    assert_eq!(
        root_error.on_caught_error(),
        RootErrorCallbackHandle::from_raw(1002)
    );
    assert_eq!(
        root_error.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(1003)
    );
    assert_eq!(
        root_error.status(),
        PassiveEffectRootErrorPropagationStatus::CapturedForRootUpdate
    );
    assert_eq!(
        root_error.blockers(),
        &PASSIVE_EFFECT_ROOT_ERROR_CALLBACK_BLOCKERS
    );
    assert!(root_error.has_configured_error_callback());
    assert!(root_error.root_error_update_scheduled());
    assert_eq!(root_error.scheduled_root_error_count(), 2);
    assert!(!root_error.root_error_callbacks_invoked());
    assert!(!root_error.public_error_boundaries_enabled());
    assert!(!root_error.public_act_error_aggregation_enabled());
    assert!(!root_error.recoverable_error_compatibility_claimed());
    assert!(!root_error_callbacks.root_error_callbacks_invoked());
    assert!(!root_error_callbacks.public_error_boundaries_enabled());
    assert!(!root_error_callbacks.recoverable_error_compatibility_claimed());

    let errors = flush.callback_execution_errors();
    let captures = flush.root_error_captures();
    let routing = flush.root_error_routing();
    assert_eq!(errors.len(), 2);
    assert_eq!(captures.len(), 2);
    assert_eq!(routing.len(), 2);
    assert_eq!(errors[0].error_order(), 0);
    assert_eq!(errors[1].error_order(), 1);
    assert_eq!(captures[0].capture_order(), 0);
    assert_eq!(captures[1].capture_order(), 1);
    assert_eq!(routing[0].routing_order(), 0);
    assert_eq!(routing[1].routing_order(), 1);
    assert_eq!(
        errors[0].kind(),
        PassiveEffectCallbackExecutionErrorKind::Destroy
    );
    assert_eq!(errors[0].kind().phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(
        errors[1].kind(),
        PassiveEffectCallbackExecutionErrorKind::MountCreate
    );
    assert_eq!(errors[1].kind().phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(errors[0].phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(errors[1].phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(errors[0].flush_index(), 0);
    assert_eq!(errors[1].flush_index(), 1);
    assert_eq!(
        errors[0].pending_order(),
        queued.records()[0].unmount_order().unwrap()
    );
    assert_eq!(errors[1].pending_order(), queued.records()[0].mount_order());
    assert!(errors[0].pending_order() < errors[1].pending_order());
    assert_eq!(errors[0].root(), root_id);
    assert_eq!(errors[1].root(), root_id);
    assert_eq!(errors[0].finished_work(), finished_work);
    assert_eq!(errors[1].finished_work(), finished_work);
    assert_eq!(errors[0].committed_lanes(), Lanes::DEFAULT);
    assert_eq!(errors[1].committed_lanes(), Lanes::DEFAULT);
    assert_eq!(errors[0].fiber(), finished_function);
    assert_eq!(errors[1].fiber(), finished_function);
    assert_eq!(errors[0].effect_lanes(), Lanes::DEFAULT);
    assert_eq!(errors[1].effect_lanes(), Lanes::DEFAULT);
    assert_eq!(errors[0].effect_index(), Some(0));
    assert_eq!(errors[1].effect_index(), Some(0));
    assert_eq!(errors[0].effect(), Some(registration.effect()));
    assert_eq!(errors[1].effect(), Some(registration.effect()));
    assert_eq!(errors[0].effect_instance(), Some(previous.instance()));
    assert_eq!(errors[1].effect_instance(), Some(registration.instance()));
    assert_eq!(errors[0].callback(), callback(1008));
    assert_eq!(errors[1].callback(), callback(1011));
    assert_eq!(
        errors[0].error(),
        PassiveEffectCallbackExecutionErrorHandle::Destroy(destroy_error(1013))
    );
    assert_eq!(
        errors[1].error(),
        PassiveEffectCallbackExecutionErrorHandle::MountCreate(mount_create_error(1014))
    );
    assert!(errors[0].error().is_some());
    assert!(!errors[0].error().is_none());
    assert!(errors[1].error().is_some());
    assert_eq!(errors[0].root_error_propagation(), root_error);
    assert_eq!(errors[1].root_error_propagation(), root_error);
    assert_eq!(errors[0].root_error_capture(), captures[0]);
    assert_eq!(errors[1].root_error_capture(), captures[1]);
    assert_eq!(errors[0].root_error_routing(), routing[0]);
    assert_eq!(errors[1].root_error_routing(), routing[1]);
    assert_eq!(
        captures[0].kind(),
        PassiveEffectCallbackExecutionErrorKind::Destroy
    );
    assert_eq!(
        captures[1].kind(),
        PassiveEffectCallbackExecutionErrorKind::MountCreate
    );
    assert_eq!(captures[0].root(), root_id);
    assert_eq!(captures[1].root(), root_id);
    assert_eq!(captures[0].finished_work(), finished_work);
    assert_eq!(captures[1].finished_work(), finished_work);
    assert_eq!(captures[0].committed_lanes(), Lanes::DEFAULT);
    assert_eq!(captures[1].committed_lanes(), Lanes::DEFAULT);
    assert_eq!(captures[0].fiber(), finished_function);
    assert_eq!(captures[1].fiber(), finished_function);
    assert_eq!(captures[0].effect_lanes(), Lanes::DEFAULT);
    assert_eq!(captures[1].effect_lanes(), Lanes::DEFAULT);
    assert_eq!(captures[0].phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(captures[1].phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(captures[0].pending_order(), errors[0].pending_order());
    assert_eq!(captures[1].pending_order(), errors[1].pending_order());
    assert_eq!(captures[0].flush_index(), 0);
    assert_eq!(captures[1].flush_index(), 1);
    assert_eq!(captures[0].effect_index(), Some(0));
    assert_eq!(captures[1].effect_index(), Some(0));
    assert_eq!(captures[0].effect(), Some(registration.effect()));
    assert_eq!(captures[1].effect(), Some(registration.effect()));
    assert_eq!(captures[0].effect_instance(), Some(previous.instance()));
    assert_eq!(captures[1].effect_instance(), Some(registration.instance()));
    assert_eq!(captures[0].callback(), callback(1008));
    assert_eq!(captures[1].callback(), callback(1011));
    assert_eq!(
        captures[0].error(),
        PassiveEffectCallbackExecutionErrorHandle::Destroy(destroy_error(1013))
    );
    assert_eq!(
        captures[1].error(),
        PassiveEffectCallbackExecutionErrorHandle::MountCreate(mount_create_error(1014))
    );
    assert!(captures[0].root_error_update_scheduled());
    assert!(captures[1].root_error_update_scheduled());
    assert!(!captures[0].root_error_callbacks_invoked());
    assert!(!captures[1].root_error_callbacks_invoked());
    assert!(!captures[0].public_act_error_aggregation_enabled());
    assert!(!captures[1].public_act_error_aggregation_enabled());
    assert!(captures[0].has_configured_error_callback());
    assert!(captures[1].has_configured_error_callback());
    assert_eq!(captures[0].error_option_callbacks(), root_error_callbacks);
    assert_eq!(captures[1].error_option_callbacks(), root_error_callbacks);
    assert_eq!(
        captures[0].on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(1001)
    );
    assert_eq!(
        captures[1].on_caught_error(),
        RootErrorCallbackHandle::from_raw(1002)
    );
    assert_eq!(
        captures[0].on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(1003)
    );
    assert_eq!(
        routing[0].kind(),
        PassiveEffectCallbackExecutionErrorKind::Destroy
    );
    assert_eq!(
        routing[1].kind(),
        PassiveEffectCallbackExecutionErrorKind::MountCreate
    );
    assert_eq!(routing[0].root(), root_id);
    assert_eq!(routing[1].root(), root_id);
    assert_eq!(routing[0].finished_work(), finished_work);
    assert_eq!(routing[1].finished_work(), finished_work);
    assert_eq!(routing[0].committed_lanes(), Lanes::DEFAULT);
    assert_eq!(routing[1].committed_lanes(), Lanes::DEFAULT);
    assert_eq!(routing[0].fiber(), finished_function);
    assert_eq!(routing[1].fiber(), finished_function);
    assert_eq!(routing[0].effect_lanes(), Lanes::DEFAULT);
    assert_eq!(routing[1].effect_lanes(), Lanes::DEFAULT);
    assert_eq!(routing[0].phase(), PendingPassiveEffectPhase::Unmount);
    assert_eq!(routing[1].phase(), PendingPassiveEffectPhase::Mount);
    assert_eq!(routing[0].pending_order(), errors[0].pending_order());
    assert_eq!(routing[1].pending_order(), errors[1].pending_order());
    assert_eq!(routing[0].flush_index(), 0);
    assert_eq!(routing[1].flush_index(), 1);
    assert_eq!(routing[0].effect_index(), Some(0));
    assert_eq!(routing[1].effect_index(), Some(0));
    assert_eq!(routing[0].effect(), Some(registration.effect()));
    assert_eq!(routing[1].effect(), Some(registration.effect()));
    assert_eq!(routing[0].effect_instance(), Some(previous.instance()));
    assert_eq!(routing[1].effect_instance(), Some(registration.instance()));
    assert_eq!(routing[0].callback(), callback(1008));
    assert_eq!(routing[1].callback(), callback(1011));
    assert_eq!(
        routing[0].error(),
        PassiveEffectCallbackExecutionErrorHandle::Destroy(destroy_error(1013))
    );
    assert_eq!(
        routing[1].error(),
        PassiveEffectCallbackExecutionErrorHandle::MountCreate(mount_create_error(1014))
    );
    assert_eq!(routing[0].root_error_capture(), captures[0]);
    assert_eq!(routing[1].root_error_capture(), captures[1]);
    assert_eq!(routing[0].root_error_propagation(), root_error);
    assert_eq!(routing[1].root_error_propagation(), root_error);
    assert_eq!(routing[0].error_option_callbacks(), root_error_callbacks);
    assert_eq!(routing[1].error_option_callbacks(), root_error_callbacks);
    assert_eq!(
        routing[0].status(),
        PassiveEffectRootErrorRoutingStatus::CapturedForRootUpdate
    );
    assert_eq!(
        routing[1].status(),
        PassiveEffectRootErrorRoutingStatus::CapturedForRootUpdate
    );
    assert!(routing[0].root_error_update_scheduled());
    assert!(routing[1].root_error_update_scheduled());
    assert!(!routing[0].root_error_callbacks_invoked());
    assert!(!routing[1].root_error_callbacks_invoked());
    assert!(!routing[0].public_error_boundaries_enabled());
    assert!(!routing[1].public_error_boundaries_enabled());
    assert!(!routing[0].public_act_error_aggregation_enabled());
    assert!(!routing[1].public_act_error_aggregation_enabled());
    assert!(!routing[0].recoverable_error_compatibility_claimed());
    assert!(!routing[1].recoverable_error_compatibility_claimed());
    assert!(routing[0].has_configured_error_callback());
    assert!(routing[1].has_configured_error_callback());
    assert_eq!(
        routing[0].on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(1001)
    );
    assert_eq!(
        routing[1].on_caught_error(),
        RootErrorCallbackHandle::from_raw(1002)
    );
    assert_eq!(
        routing[0].on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(1003)
    );
    let first_schedule = captures[0].schedule();
    let second_schedule = captures[1].schedule();
    assert_eq!(routing[0].schedule(), first_schedule);
    assert_eq!(routing[1].schedule(), second_schedule);
    assert_eq!(
        first_schedule.source(),
        RootErrorCaptureSource::PassiveEffectDestroy
    );
    assert_eq!(
        second_schedule.source(),
        RootErrorCaptureSource::PassiveEffectMountCreate
    );
    assert_eq!(first_schedule.root(), root_id);
    assert_eq!(second_schedule.root(), root_id);
    assert_eq!(first_schedule.root_fiber(), finished_work);
    assert_eq!(second_schedule.root_fiber(), finished_work);
    assert_eq!(first_schedule.source_fiber(), finished_function);
    assert_eq!(second_schedule.source_fiber(), finished_function);
    assert_eq!(first_schedule.lane(), Lane::SYNC);
    assert_eq!(second_schedule.lane(), Lane::SYNC);
    assert_eq!(first_schedule.pending_lanes_before(), Lanes::NO);
    assert!(
        first_schedule
            .pending_lanes_after()
            .contains_lane(Lane::SYNC)
    );
    assert!(
        second_schedule
            .pending_lanes_before()
            .contains_lane(Lane::SYNC)
    );
    assert!(
        second_schedule
            .pending_lanes_after()
            .contains_lane(Lane::SYNC)
    );
    assert_eq!(
        first_schedule.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(1001)
    );
    assert_eq!(
        second_schedule.on_caught_error(),
        RootErrorCallbackHandle::from_raw(1002)
    );
    assert_eq!(
        first_schedule.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(1003)
    );
    assert!(first_schedule.root_error_update_scheduled());
    assert!(second_schedule.root_error_update_scheduled());
    assert!(!first_schedule.root_error_callbacks_invoked());
    assert!(!second_schedule.root_error_callbacks_invoked());
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::SYNC
    );

    assert_eq!(destroy_executor.calls().len(), 1);
    assert_eq!(mount_create_executor.calls().len(), 1);
    assert!(flush.records()[0].destroy_callback_invoked());
    assert!(flush.records()[1].create_callback_invoked());
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
fn passive_effects_flush_consumes_empty_handoff_without_records() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(30), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .prepare_pending_passive(root_id, Lanes::NO);
    let commit = commit_finished_host_root(&mut store, render).unwrap();

    let flush = flush_passive_effects_after_commit(&mut store, &commit).unwrap();

    assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(flush.consumed_pending_passive());
    assert!(!flush.did_flush_records());
    assert_eq!(flush.finished_work(), Some(finished_work));
    assert_eq!(flush.lanes(), Lanes::DEFAULT);
    assert!(flush.records().is_empty());
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
fn passive_effects_observes_post_passive_sync_flush_gate_without_consuming_handoff() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let passive_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let continuation_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let continuation_current = store.root(continuation_root).unwrap().current();
    update_container(
        &mut store,
        passive_root,
        RootElementHandle::from_raw(60),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, passive_root, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    store
        .root_mut(passive_root)
        .unwrap()
        .scheduling_mut()
        .prepare_pending_passive(passive_root, Lanes::NO);
    store
        .root_mut(passive_root)
        .unwrap()
        .scheduling_mut()
        .pending_passive_mut()
        .queue_mount(finished_work, Lanes::DEFAULT)
        .unwrap();
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    schedule_sync_update(
        &mut store,
        continuation_root,
        RootElementHandle::from_raw(61),
    );
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

    let gate = observe_sync_flush_post_passive_continuation_execution_gate_after_commit(
        &mut store,
        &commit,
        &ExecutionContextState::new(),
    )
    .unwrap()
    .unwrap();

    assert_eq!(gate.exit_status(), RootSyncFlushExitStatus::Completed);
    assert_eq!(gate.pending_passive_root(), passive_root);
    assert_eq!(gate.pending_passive_finished_work(), finished_work);
    assert_eq!(gate.pending_passive_lanes(), Lanes::DEFAULT);
    assert_eq!(gate.pending_passive_unmount_count(), 0);
    assert_eq!(gate.pending_passive_mount_count(), 1);
    assert_eq!(gate.pending_passive_record_count(), 1);
    assert_eq!(gate.continuation_roots().len(), 1);
    assert_eq!(gate.continuation_roots()[0].root(), continuation_root);
    assert_eq!(gate.continuation_roots()[0].lanes(), Lanes::SYNC);
    let pending_passive = store
        .root(passive_root)
        .unwrap()
        .scheduling()
        .pending_passive();
    assert_eq!(pending_passive.finished_work(), Some(finished_work));
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(pending_passive.passive_mounts().len(), 1);
    assert_eq!(
        store.root(continuation_root).unwrap().current(),
        continuation_current
    );
    assert_eq!(store.root(continuation_root).unwrap().finished_work(), None);
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
fn passive_effects_flush_executes_private_post_passive_sync_flush_continuation() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let passive_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let continuation_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let continuation_element = RootElementHandle::from_raw(65);
    update_container(
        &mut store,
        passive_root,
        RootElementHandle::from_raw(64),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, passive_root, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    {
        let scheduling = store.root_mut(passive_root).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(passive_root, Lanes::NO);
        scheduling
            .pending_passive_mut()
            .queue_mount(finished_work, Lanes::DEFAULT)
            .unwrap();
    }
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    schedule_sync_update(&mut store, continuation_root, continuation_element);
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

    let result = flush_passive_effects_after_commit_and_sync_flush_continuation(
        &mut store,
        &commit,
        &ExecutionContextState::new(),
    )
    .unwrap();

    let passive = result.passive_effects();
    assert_eq!(passive.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(passive.consumed_pending_passive());
    assert_eq!(passive.root(), passive_root);
    assert_eq!(passive.finished_work(), Some(finished_work));
    assert_eq!(passive.lanes(), Lanes::DEFAULT);
    assert_eq!(passive.records().len(), 1);
    assert_eq!(
        passive.records()[0].phase(),
        PendingPassiveEffectPhase::Mount
    );
    assert!(!passive.records()[0].create_callback_invoked());
    assert!(!passive.records()[0].destroy_callback_invoked());

    let continuation = result.sync_flush_continuation().unwrap();
    assert!(result.did_request_follow_up_sync_flush());
    assert!(continuation.did_execute_follow_up_sync_flush());
    assert!(result.did_flush_follow_up_sync_work());
    assert_eq!(
        continuation.gate().exit_status(),
        RootSyncFlushExitStatus::Completed
    );
    assert!(continuation.gate().should_execute_follow_up_sync_flush());
    assert_eq!(continuation.gate().pending_passive_root(), passive_root);
    assert_eq!(
        continuation.gate().pending_passive_finished_work(),
        finished_work
    );
    assert_eq!(continuation.gate().pending_passive_lanes(), Lanes::DEFAULT);
    assert_eq!(continuation.gate().continuation_roots().len(), 1);
    assert_eq!(
        continuation.gate().continuation_roots()[0].root(),
        continuation_root
    );
    assert_eq!(
        continuation.gate().continuation_roots()[0].lanes(),
        Lanes::SYNC
    );

    let sync_flush = continuation.sync_flush_result().unwrap();
    assert!(sync_flush.did_flush_work());
    assert_eq!(sync_flush.records().len(), 1);
    assert_eq!(sync_flush.records()[0].root(), continuation_root);
    assert_eq!(sync_flush.records()[0].render_lanes(), Lanes::SYNC);
    assert_eq!(
        current_host_root_element(&store, continuation_root),
        continuation_element
    );
    assert!(
        store
            .root(passive_root)
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
fn passive_effects_flush_records_blocked_post_passive_sync_flush_without_committing() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let passive_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let continuation_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let continuation_current = store.root(continuation_root).unwrap().current();
    update_container(
        &mut store,
        passive_root,
        RootElementHandle::from_raw(66),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, passive_root, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    {
        let scheduling = store.root_mut(passive_root).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(passive_root, Lanes::NO);
        scheduling
            .pending_passive_mut()
            .queue_mount(finished_work, Lanes::DEFAULT)
            .unwrap();
    }
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    schedule_sync_update(
        &mut store,
        continuation_root,
        RootElementHandle::from_raw(67),
    );
    let mut execution_context = ExecutionContextState::new();

    let result = execution_context
        .with_commit_context(|execution_context| {
            flush_passive_effects_after_commit_and_sync_flush_continuation(
                &mut store,
                &commit,
                execution_context,
            )
        })
        .unwrap();

    assert_eq!(
        result.passive_effects().status(),
        PassiveEffectsFlushStatus::Flushed
    );
    assert!(result.passive_effects().consumed_pending_passive());
    let continuation = result.sync_flush_continuation().unwrap();
    assert!(!result.did_request_follow_up_sync_flush());
    assert!(!continuation.did_execute_follow_up_sync_flush());
    assert!(!result.did_flush_follow_up_sync_work());
    assert_eq!(
        continuation.gate().exit_status(),
        RootSyncFlushExitStatus::BlockedByExecutionContext
    );
    assert!(
        continuation
            .gate()
            .execution_context()
            .blocked_by_render_or_commit()
    );
    assert!(continuation.gate().continuation_roots().is_empty());
    assert_eq!(
        store.root(continuation_root).unwrap().current(),
        continuation_current
    );
    assert!(
        store
            .root(passive_root)
            .unwrap()
            .scheduling()
            .pending_passive()
            .is_empty()
    );
    assert!(store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_post_passive_sync_flush_gate_requires_passive_handoff() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let passive_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let continuation_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    update_container(
        &mut store,
        passive_root,
        RootElementHandle::from_raw(62),
        None,
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, passive_root, Lanes::DEFAULT).unwrap();
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    schedule_sync_update(
        &mut store,
        continuation_root,
        RootElementHandle::from_raw(63),
    );

    let gate = observe_sync_flush_post_passive_continuation_execution_gate_after_commit(
        &mut store,
        &commit,
        &ExecutionContextState::new(),
    )
    .unwrap();

    assert_eq!(gate, None);
    assert!(
        store
            .root(passive_root)
            .unwrap()
            .scheduling()
            .pending_passive()
            .is_empty()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_flush_rejects_cleared_handoff_without_side_effects() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(40), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .prepare_pending_passive(root_id, Lanes::NO);
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .clear_pending_passive();

    let error = flush_passive_effects_after_commit(&mut store, &commit).unwrap_err();

    assert!(matches!(
        error,
        PassiveEffectsFlushError::PendingPassiveRootMismatch {
            commit_root,
            pending_root: None,
        } if commit_root == root_id
    ));
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
fn passive_effects_flush_rejects_mismatched_pending_lanes_before_consuming() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(50), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .prepare_pending_passive(root_id, Lanes::NO);
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let finished_work = commit.finished_work();

    {
        let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(root_id, Lanes::SYNC);
        assert!(scheduling.pending_passive_mut().record_commit_handoff(
            root_id,
            finished_work,
            Lanes::SYNC
        ));
    }

    let error = flush_passive_effects_after_commit(&mut store, &commit).unwrap_err();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert!(matches!(
        error,
        PassiveEffectsFlushError::PendingPassiveLanesMismatch {
            root,
            expected,
            actual,
        } if root == root_id && expected == Lanes::DEFAULT && actual == Lanes::SYNC
    ));
    assert_eq!(pending_passive.root(), Some(root_id));
    assert_eq!(pending_passive.finished_work(), Some(finished_work));
    assert_eq!(pending_passive.lanes(), Lanes::SYNC);
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn passive_effects_flush_rejects_pending_record_count_drift_before_consuming() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(51), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    {
        let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(root_id, Lanes::NO);
        scheduling
            .pending_passive_mut()
            .queue_mount(finished_work, Lanes::DEFAULT)
            .unwrap();
    }
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    assert_eq!(
        commit
            .pending_passive_handoff()
            .unwrap()
            .pending_mount_count(),
        1
    );
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .pending_passive_mut()
        .queue_mount(finished_work, Lanes::DEFAULT)
        .unwrap();

    let error = flush_passive_effects_after_commit(&mut store, &commit).unwrap_err();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert!(matches!(
        error,
        PassiveEffectsFlushError::PendingPassiveRecordCountMismatch {
            root,
            expected_unmounts: 0,
            actual_unmounts: 0,
            expected_mounts: 1,
            actual_mounts: 2,
        } if root == root_id
    ));
    assert_eq!(pending_passive.passive_mounts().len(), 2);
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
