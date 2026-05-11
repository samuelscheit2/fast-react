use super::*;
use crate::root_commit::{
    HostRootFinishedWorkCommitHandoffErrorForCanary,
    HostRootFinishedWorkCommitHandoffRecordForCanary,
    commit_finished_host_root_with_finished_work_handoff_for_canary,
    record_host_root_finished_work_pending_commit_for_canary,
};
use crate::test_support::{FakeContainer, RecordingHost};
use crate::{FiberRootStore, HostRootRenderPhaseRecord, RootOptions, render_host_root_for_lanes};
use fast_react_core::{DependenciesHandle, FiberMode, FiberTypeHandle, Lane, PropsHandle};

#[derive(Debug, Clone)]
struct RegisteredComponent {
    component: FiberTypeHandle,
    result: Result<FunctionComponentOutputHandle, FunctionComponentInvocationError>,
}

#[derive(Debug, Default)]
struct TestFunctionComponentRegistry {
    components: Vec<RegisteredComponent>,
    calls: Vec<FunctionComponentInvocationRequest>,
}

impl TestFunctionComponentRegistry {
    fn register(
        &mut self,
        component: FiberTypeHandle,
        result: Result<FunctionComponentOutputHandle, FunctionComponentInvocationError>,
    ) {
        self.components
            .push(RegisteredComponent { component, result });
    }

    fn calls(&self) -> &[FunctionComponentInvocationRequest] {
        &self.calls
    }
}

impl FunctionComponentInvoker for TestFunctionComponentRegistry {
    fn invoke_function_component(
        &mut self,
        request: FunctionComponentInvocationRequest,
    ) -> Result<FunctionComponentOutputHandle, FunctionComponentInvocationError> {
        self.calls.push(request);
        self.components
            .iter()
            .find(|component| component.component == request.component())
            .map(|component| component.result.clone())
            .unwrap_or_else(|| {
                Err(FunctionComponentInvocationError::component_error(
                    "missing test component registration",
                ))
            })
    }
}

#[derive(Debug, Clone, Copy)]
enum UseContextBehavior {
    Single {
        context: ContextHandle,
    },
    NoRead {
        output: FunctionComponentOutputHandle,
    },
    Double {
        context: ContextHandle,
    },
    Unknown {
        context: ContextHandle,
    },
}

#[derive(Debug)]
struct TestUseContextComponentRegistry {
    component: FiberTypeHandle,
    behavior: UseContextBehavior,
    calls: Vec<FunctionComponentInvocationRequest>,
    reads: Vec<FunctionComponentContextReadRecord>,
}

impl TestUseContextComponentRegistry {
    fn new(component: FiberTypeHandle, behavior: UseContextBehavior) -> Self {
        Self {
            component,
            behavior,
            calls: Vec::new(),
            reads: Vec::new(),
        }
    }

    fn calls(&self) -> &[FunctionComponentInvocationRequest] {
        &self.calls
    }

    fn reads(&self) -> &[FunctionComponentContextReadRecord] {
        &self.reads
    }
}

impl FunctionComponentContextConsumerInvoker for TestUseContextComponentRegistry {
    fn invoke_function_component_context_consumer(
        &mut self,
        request: FunctionComponentInvocationRequest,
        reader: &mut FunctionComponentContextRenderReader<'_>,
    ) -> Result<FunctionComponentOutputHandle, FunctionComponentRenderError> {
        self.calls.push(request);
        if request.component() != self.component {
            return Err(FunctionComponentRenderError::Invocation {
                fiber: request.fiber(),
                component: request.component(),
                error: FunctionComponentInvocationError::component_error(
                    "missing use_context test component registration",
                ),
            });
        }

        match self.behavior {
            UseContextBehavior::Single { context } => {
                let read = reader.use_context(context)?;
                self.reads.push(read);
                Ok(FunctionComponentOutputHandle::from_raw(read.value().raw()))
            }
            UseContextBehavior::NoRead { output } => Ok(output),
            UseContextBehavior::Double { context } => {
                let first = reader.use_context(context)?;
                let second = reader.use_context(context)?;
                self.reads.push(first);
                self.reads.push(second);
                Ok(FunctionComponentOutputHandle::from_raw(
                    second.value().raw(),
                ))
            }
            UseContextBehavior::Unknown { context } => {
                let read = reader.use_context(context)?;
                self.reads.push(read);
                Ok(FunctionComponentOutputHandle::from_raw(read.value().raw()))
            }
        }
    }
}

#[derive(Debug)]
struct StaticSingleChildResolver {
    child: Option<FunctionComponentSingleChildOutput>,
}

impl StaticSingleChildResolver {
    const fn new(child: Option<FunctionComponentSingleChildOutput>) -> Self {
        Self { child }
    }
}

impl FunctionComponentSingleChildOutputResolver for StaticSingleChildResolver {
    fn resolve_function_component_single_child_output(
        &self,
        _output: FunctionComponentOutputHandle,
    ) -> Option<FunctionComponentSingleChildOutput> {
        self.child
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum FunctionComponentReducerDispatchCommitHandoffCanaryError {
    SingleChild(FunctionComponentSingleChildReconciliationError),
    Commit(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
}

impl From<FunctionComponentSingleChildReconciliationError>
    for FunctionComponentReducerDispatchCommitHandoffCanaryError
{
    fn from(error: FunctionComponentSingleChildReconciliationError) -> Self {
        Self::SingleChild(error)
    }
}

impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for FunctionComponentReducerDispatchCommitHandoffCanaryError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::Commit(Box::new(error))
    }
}

fn function_component_pair() -> (FiberArena, FiberId, FiberId, FiberTypeHandle) {
    let mut arena = FiberArena::new();
    let current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(1),
        FiberMode::NO,
    );
    let component = FiberTypeHandle::from_raw(100);
    arena.get_mut(current).unwrap().set_fiber_type(component);
    let work_in_progress = arena
        .create_work_in_progress(current, PropsHandle::from_raw(2))
        .unwrap();

    (arena, current, work_in_progress, component)
}

fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId) {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    (store, root_id)
}

fn attached_function_component_pair(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) -> (FiberId, FiberId, FiberTypeHandle) {
    let host_root = store.root(root_id).unwrap().current();
    let current = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(1),
        FiberMode::NO,
    );
    let component = FiberTypeHandle::from_raw(100);
    store
        .fiber_arena_mut()
        .get_mut(current)
        .unwrap()
        .set_fiber_type(component);
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current, PropsHandle::from_raw(2))
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_in_progress])
        .unwrap();

    (current, work_in_progress, component)
}

fn attached_current_function_component_pair(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) -> (FiberId, FiberId, FiberTypeHandle) {
    let host_root = store.root(root_id).unwrap().current();
    let current = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(1),
        FiberMode::NO,
    );
    let component = FiberTypeHandle::from_raw(100);
    store
        .fiber_arena_mut()
        .get_mut(current)
        .unwrap()
        .set_fiber_type(component);
    store
        .fiber_arena_mut()
        .set_children(host_root, &[current])
        .unwrap();
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current, PropsHandle::from_raw(2))
        .unwrap();

    (current, work_in_progress, component)
}

fn accept_function_component_reducer_render_for_commit_handoff(
    store: &mut FiberRootStore<RecordingHost>,
    function_render: FunctionComponentRenderRecord,
    host_render: HostRootRenderPhaseRecord,
    resolver: &impl FunctionComponentSingleChildOutputResolver,
) -> Result<
    (
        FunctionComponentSingleChildReconciliationRecord,
        HostRootFinishedWorkCommitHandoffRecordForCanary,
    ),
    FunctionComponentReducerDispatchCommitHandoffCanaryError,
> {
    let single_child = reconcile_function_component_single_child_output(
        store.fiber_arena_mut(),
        function_render,
        resolver,
    )?;
    let pending = record_host_root_finished_work_pending_commit_for_canary(store, host_render, 1)?;
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        host_render,
        Some(pending),
        2,
    )?;

    Ok((single_child, handoff))
}

fn opaque(raw: u64) -> HookSlotPayload {
    HookSlotPayload::opaque(StateHandle::from_raw(raw))
}

fn opaque_value(payload: HookSlotPayload) -> StateHandle {
    match payload {
        HookSlotPayload::Opaque(payload) => payload.memoized_state(),
        other => panic!("expected opaque hook payload, got {other:?}"),
    }
}

fn callback(raw: u64) -> HookEffectCallbackHandle {
    HookEffectCallbackHandle::from_raw(raw)
}

fn component_callback(raw: u64) -> FunctionComponentCallbackHandle {
    FunctionComponentCallbackHandle::from_raw(raw)
}

fn deps(raw: u64) -> HookEffectDependencies {
    HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
}

fn context_value(raw: u64) -> ContextValueHandle {
    ContextValueHandle::from_raw(raw)
}

fn assert_private_context_dependency_metadata(
    arena: &FiberArena,
    context_store: &FunctionComponentContextRenderStore,
    render: FunctionComponentRenderRecord,
    read: FunctionComponentContextReadRecord,
    expected_render_read_index: usize,
) -> FunctionComponentContextDependencyRecord {
    let dependency = context_store
        .context_dependency(read.dependency())
        .expect("context read must carry private dependency metadata");
    assert_eq!(dependency.handle(), read.dependency());
    assert_eq!(dependency.fiber(), read.fiber());
    assert_eq!(dependency.context(), read.context());
    assert_eq!(dependency.memoized_value(), read.value());
    assert_eq!(dependency.read_index(), read.read_index());
    assert_eq!(dependency.render_read_index(), expected_render_read_index);
    assert_eq!(dependency.render_lanes(), render.render_lanes());
    assert_eq!(dependency.dependency_lanes(), Lanes::NO);
    assert!(!dependency.renderer_visible_propagation());
    assert_eq!(dependency.propagation_flags(), FiberFlags::NO);

    let fiber = arena.get(read.fiber()).unwrap();
    assert_eq!(fiber.dependencies(), DependenciesHandle::NONE);
    assert!(!fiber.flags().contains_any(FiberFlags::NEEDS_PROPAGATION));

    dependency
}

fn seed_current_effect_metadata(
    arena: &mut FiberArena,
    hook_store: &mut FunctionComponentHookRenderStore,
    current: FiberId,
    current_list: HookListId,
    phase: FunctionComponentEffectPhase,
    create: HookEffectCallbackHandle,
    dependencies: HookEffectDependencies,
) -> FunctionComponentEffectRegistration {
    let state = FunctionComponentHookRenderState {
        phase: FunctionComponentHookRenderPhase::Mount,
        render_fiber: current,
        current: None,
        current_list: None,
        work_in_progress_list: current_list,
    };
    let cursor = hook_store.hook_lists().begin_mount(current_list).unwrap();
    let mut cursor = FunctionComponentHookRenderCursor::Mount { state, cursor };
    let registration = hook_store
        .mount_effect_metadata(arena, &mut cursor, phase, create, dependencies)
        .unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();
    assert_eq!(finished.traversal().traversed_count(), 1);
    registration
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

fn reducer_adds_action(
    state: StateHandle,
    action: &FunctionComponentStateActionHandle,
) -> StateHandle {
    StateHandle::from_raw(state.raw() + action.raw())
}

#[test]
fn function_component_render_phase_state_dispatch_records_current_queue_and_processes_rerender() {
    let (mut store, root_id) = root_store();
    let (_current, work_in_progress, component) =
        attached_function_component_pair(&mut store, root_id);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(910)));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let render = render_function_component_with_use_state(
        store.fiber_arena_mut(),
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(10), lanes),
        &mut registry,
        action_as_state,
    )
    .unwrap();
    let hook_state = render.hook_state();
    let mount = render.state_hook().mount_record().unwrap();
    let mut gate = FunctionComponentRenderPhaseUpdateGate::new(hook_state, Lanes::DEFAULT);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    let dispatch = hook_store
        .enqueue_state_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentStateDispatchRequest::new(mount.dispatch(), action(11), lane),
        )
        .unwrap();

    assert_eq!(dispatch.source().react_version(), "19.2.6");
    assert_eq!(
        dispatch.source().render_with_hooks_again(),
        "ReactFiberHooks.renderWithHooksAgain"
    );
    assert_eq!(
        dispatch.source().hook_staging_failure_preservation(),
        "HookUpdateStaging.finish_queueing"
    );
    assert_eq!(dispatch.source().rerender_limit(), 25);
    assert_eq!(dispatch.attempt(), gate.attempt());
    assert_eq!(dispatch.staging_generation(), 0);
    assert!(dispatch.kind().is_basic_state());
    assert_eq!(dispatch.render_fiber(), work_in_progress);
    assert_eq!(dispatch.queue_owner(), work_in_progress);
    assert_eq!(dispatch.queue(), mount.queue());
    assert_eq!(
        dispatch.queue_generation(),
        hook_queue_generation_for_canary(mount.queue())
    );
    assert_eq!(dispatch.dispatch(), mount.dispatch());
    assert_eq!(dispatch.lane(), lane);
    assert_eq!(dispatch.action(), action(11));
    assert_eq!(
        dispatch.update_generation(),
        hook_update_generation_for_canary(dispatch.update())
    );
    assert!(dispatch.dispatch_belongs_to_currently_rendering_fiber());
    assert!(dispatch.did_schedule_render_phase_update());
    assert!(dispatch.did_schedule_render_phase_update_during_this_pass());
    assert!(dispatch.pending_update_did_not_escape_to_root_scheduler());
    assert!(!dispatch.public_hook_compatibility_claimed());
    assert!(dispatch.source_owned_currentness());
    assert!(!dispatch.caller_built_rows_accepted());
    assert_eq!(
        dispatch.blocker_state(),
        FunctionComponentRenderPhaseBailoutBlockerState::active_render(hook_state, Lanes::DEFAULT,)
    );
    assert_eq!(gate.staged_update_count(), 1);
    assert_eq!(gate.staging_lanes(), Lanes::DEFAULT);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(mount.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );

    let drain = gate
        .finish_staged_render_phase_updates_for_canary(&mut hook_store)
        .unwrap();

    assert!(drain.proves_current_render_phase_staging());
    assert_eq!(drain.attempt(), dispatch.attempt());
    assert_eq!(drain.staging_generation(), 0);
    assert_eq!(drain.next_staging_generation(), 1);
    assert_eq!(drain.render_fiber(), work_in_progress);
    assert_eq!(drain.current(), Some(_current));
    assert_eq!(drain.render_lanes(), Lanes::DEFAULT);
    assert_eq!(drain.staging_lanes(), Lanes::DEFAULT);
    assert_eq!(drain.queues(), &[mount.queue()]);
    assert_eq!(drain.updates(), &[dispatch.update()]);
    assert_eq!(drain.queue_generations(), &[dispatch.queue_generation()]);
    assert_eq!(drain.update_generations(), &[dispatch.update_generation()]);
    assert!(drain.source_owned_currentness());
    assert!(!drain.caller_built_rows_accepted());
    assert!(!drain.root_scheduled());
    assert_eq!(gate.recorded_queues(), &[mount.queue()]);
    assert_eq!(gate.staged_update_count(), 0);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(mount.queue())
            .unwrap(),
        vec![dispatch.update()]
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        crate::scheduled_roots(&store).unwrap(),
        Vec::<FiberRootId>::new()
    );

    let pass = gate.begin_rerender_pass().unwrap();
    assert_eq!(pass.attempt(), dispatch.attempt());
    assert_eq!(pass.render_fiber(), work_in_progress);
    assert_eq!(pass.pass_index(), 0);
    assert_eq!(pass.rerender_count(), 1);
    assert_eq!(pass.limit(), 25);
    assert!(!gate.did_schedule_render_phase_update_during_this_pass());

    let processed = hook_store
        .process_state_render_phase_updates_for_canary(&mut gate, mount.hook(), action_as_state)
        .unwrap();

    assert_eq!(
        processed.source().enqueue_render_phase_update(),
        "enqueueRenderPhaseUpdate"
    );
    assert_eq!(processed.pass_index(), 1);
    assert_eq!(processed.rerender_count(), 1);
    assert_eq!(processed.render_fiber(), work_in_progress);
    assert_eq!(processed.render_lanes(), Lanes::DEFAULT);
    assert_eq!(processed.attempt(), dispatch.attempt());
    assert_eq!(processed.staging_generation(), 1);
    assert_eq!(processed.hook(), mount.hook());
    assert_eq!(processed.queue(), mount.queue());
    assert_eq!(processed.queue_generation(), dispatch.queue_generation());
    assert_eq!(processed.dispatch(), mount.dispatch());
    assert_eq!(
        processed.kind(),
        FunctionComponentRenderPhaseDispatchKind::BasicState
    );
    assert_eq!(
        processed.previous_memoized_state(),
        StateHandle::from_raw(10)
    );
    assert_eq!(processed.memoized_state(), StateHandle::from_raw(11));
    assert_eq!(processed.base_state(), StateHandle::from_raw(11));
    assert_eq!(processed.base_queue(), None);
    assert_eq!(processed.processed_update_count(), 1);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(mount.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn function_component_render_phase_reducer_dispatch_records_current_queue_and_processes_rerender() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_reducer = reducer(920);
    let next_reducer = reducer(921);
    let current_reducer = hook_store
        .create_current_reducer_hook(current, previous_reducer, StateHandle::from_raw(20))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(920)));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let render = render_function_component_with_use_reducer(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseReducerRenderRequest::new(
            next_reducer,
            StateHandle::from_raw(999),
            lanes,
        ),
        &mut registry,
        reducer_adds_action,
    )
    .unwrap();
    let update = render.reducer_hook().update_record().unwrap();
    let mut gate = FunctionComponentRenderPhaseUpdateGate::new(render.hook_state(), Lanes::DEFAULT);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    let dispatch = hook_store
        .enqueue_reducer_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentReducerDispatchRequest::new(
                current_reducer.dispatch(),
                action(3),
                lane,
            ),
        )
        .unwrap();

    assert_eq!(
        dispatch.kind(),
        FunctionComponentRenderPhaseDispatchKind::Reducer(next_reducer)
    );
    assert_eq!(dispatch.kind().reducer(), Some(next_reducer));
    assert_eq!(dispatch.render_fiber(), work_in_progress);
    assert_eq!(dispatch.current(), Some(current));
    assert_eq!(dispatch.queue_owner(), current);
    assert_eq!(dispatch.queue(), current_reducer.queue());
    assert_eq!(dispatch.dispatch(), current_reducer.dispatch());
    assert!(dispatch.dispatch_belongs_to_currently_rendering_fiber());
    assert_eq!(dispatch.current_list(), render.hook_state().current_list());
    assert_eq!(
        dispatch.work_in_progress_list(),
        render.hook_state().work_in_progress_list()
    );
    assert_eq!(gate.staged_update_count(), 1);
    assert_eq!(gate.recorded_queues(), &[]);

    let drain = gate
        .finish_staged_render_phase_updates_for_canary(&mut hook_store)
        .unwrap();
    assert!(drain.proves_current_render_phase_staging());
    assert_eq!(drain.queues(), &[current_reducer.queue()]);
    assert_eq!(drain.updates(), &[dispatch.update()]);
    assert_eq!(gate.recorded_queues(), &[current_reducer.queue()]);

    gate.begin_rerender_pass().unwrap();
    let processed = hook_store
        .process_reducer_render_phase_updates_for_canary(
            &mut gate,
            update.hook(),
            next_reducer,
            reducer_adds_action,
        )
        .unwrap();

    assert_eq!(
        processed.kind(),
        FunctionComponentRenderPhaseDispatchKind::Reducer(next_reducer)
    );
    assert_eq!(
        processed.previous_memoized_state(),
        StateHandle::from_raw(20)
    );
    assert_eq!(processed.memoized_state(), StateHandle::from_raw(23));
    assert_eq!(processed.base_state(), StateHandle::from_raw(23));
    assert_eq!(processed.processed_update_count(), 1);
    assert_eq!(
        hook_store
            .state_queues()
            .queue(current_reducer.queue())
            .unwrap()
            .last_rendered_reducer()
            .copied(),
        Some(FunctionComponentStateReducerId::Reducer(next_reducer))
    );
}

#[test]
fn function_component_render_phase_rejects_stale_dispatch_from_another_fiber() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let other_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(3),
        FiberMode::NO,
    );
    let other_component = FiberTypeHandle::from_raw(901);
    arena
        .get_mut(other_current)
        .unwrap()
        .set_fiber_type(other_component);
    let other_state = hook_store
        .create_current_state_hook(other_current, StateHandle::from_raw(30))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(911)));
    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let mut gate =
        FunctionComponentRenderPhaseUpdateGate::new(render.hook_state().unwrap(), Lanes::DEFAULT);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    assert_eq!(
        hook_store.enqueue_state_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentStateDispatchRequest::new(other_state.dispatch(), action(31), lane,),
        ),
        Err(
            FunctionComponentRenderError::StateDispatchOutsideRenderContext {
                dispatch: other_state.dispatch(),
                fiber: other_current,
                render_fiber: work_in_progress,
                current: Some(current),
            }
        )
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(other_state.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
    assert!(!gate.did_schedule_render_phase_update());
}

#[test]
fn function_component_render_phase_rejects_reducer_queue_on_usestate_path() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = reducer(930);
    let current_reducer = hook_store
        .create_current_reducer_hook(current, reducer_id, StateHandle::from_raw(40))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(912)));
    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let mut gate =
        FunctionComponentRenderPhaseUpdateGate::new(render.hook_state().unwrap(), Lanes::DEFAULT);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    assert_eq!(
        hook_store.enqueue_state_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentStateDispatchRequest::new(
                current_reducer.dispatch(),
                action(41),
                lane,
            ),
        ),
        Err(FunctionComponentRenderError::ExpectedBasicStateQueue {
            fiber: current,
            queue: current_reducer.queue(),
            actual: Some(FunctionComponentStateReducerId::Reducer(reducer_id)),
        })
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_reducer.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn function_component_render_phase_rejects_usestate_queue_on_reducer_path() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(50))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(913)));
    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let mut gate =
        FunctionComponentRenderPhaseUpdateGate::new(render.hook_state().unwrap(), Lanes::DEFAULT);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    assert_eq!(
        hook_store.enqueue_reducer_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentReducerDispatchRequest::new(
                current_state.dispatch(),
                action(51),
                lane,
            ),
        ),
        Err(FunctionComponentRenderError::ExpectedReducerQueue {
            fiber: current,
            queue: current_state.queue(),
        })
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_state.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn function_component_render_phase_update_does_not_escape_into_root_scheduler() {
    let (mut store, root_id) = root_store();
    let root_current = store.root(root_id).unwrap().current();
    let (_current, work_in_progress, component) =
        attached_function_component_pair(&mut store, root_id);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(914)));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let render = render_function_component_with_use_state(
        store.fiber_arena_mut(),
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(60), lanes),
        &mut registry,
        action_as_state,
    )
    .unwrap();
    let mount = render.state_hook().mount_record().unwrap();
    let mut gate = FunctionComponentRenderPhaseUpdateGate::new(render.hook_state(), Lanes::DEFAULT);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    let dispatch = hook_store
        .enqueue_state_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentStateDispatchRequest::new(mount.dispatch(), action(61), lane),
        )
        .unwrap();
    let drain = gate
        .finish_staged_render_phase_updates_for_canary(&mut hook_store)
        .unwrap();

    assert!(dispatch.pending_update_did_not_escape_to_root_scheduler());
    assert!(!drain.root_scheduled());
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        store.fiber_arena().get(root_current).unwrap().child_lanes(),
        Lanes::NO
    );
    assert_eq!(
        store.fiber_arena().get(work_in_progress).unwrap().lanes(),
        Lanes::NO
    );
    assert_eq!(
        crate::scheduled_roots(&store).unwrap(),
        Vec::<FiberRootId>::new()
    );
}

#[test]
fn function_component_render_phase_blocks_over_limit_rerender() {
    let (arena, _current, work_in_progress, _component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let state = hook_store
        .prepare_render_state(&arena, work_in_progress)
        .unwrap();
    let mut gate = FunctionComponentRenderPhaseUpdateGate::new(state, Lanes::DEFAULT);

    for expected in 1..=FUNCTION_COMPONENT_RENDER_PHASE_RE_RENDER_LIMIT {
        let pass = gate.begin_rerender_pass().unwrap();
        assert_eq!(pass.rerender_count(), expected);
        assert_eq!(
            pass.limit(),
            FUNCTION_COMPONENT_RENDER_PHASE_RE_RENDER_LIMIT
        );
    }

    assert_eq!(
        gate.begin_rerender_pass(),
        Err(FunctionComponentRenderError::TooManyRenderPhaseRerenders {
            fiber: work_in_progress,
            limit: FUNCTION_COMPONENT_RENDER_PHASE_RE_RENDER_LIMIT,
        })
    );
}

#[test]
fn function_component_render_phase_rejects_stale_eager_state_without_pending_update() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(70))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(915)));
    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let mut gate =
        FunctionComponentRenderPhaseUpdateGate::new(render.hook_state().unwrap(), Lanes::DEFAULT);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let stale_eager = FunctionComponentStateDispatchEagerState::new(
        StateHandle::from_raw(69),
        StateHandle::from_raw(71),
    );

    assert_eq!(
        hook_store.enqueue_state_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentStateDispatchRequest::new(current_state.dispatch(), action(71), lane,)
                .with_eager_state(stale_eager),
        ),
        Err(
            FunctionComponentRenderError::StateDispatchEagerStateMismatch {
                fiber: current,
                queue: current_state.queue(),
                expected: StateHandle::from_raw(70),
                actual: StateHandle::from_raw(69),
            }
        )
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_state.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
    assert!(gate.recorded_queues().is_empty());
}

#[test]
fn function_component_render_phase_cleanup_clears_recorded_pending_updates_only() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let other_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(4),
        FiberMode::NO,
    );
    let other_state = hook_store
        .create_current_state_hook(other_current, StateHandle::from_raw(80))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(916)));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let render = render_function_component_with_use_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(81), lanes),
        &mut registry,
        action_as_state,
    )
    .unwrap();
    let mount = render.state_hook().mount_record().unwrap();
    let normal_lane = HookUpdateLane::from_lane(Lane::SYNC).unwrap();
    let normal = hook_store
        .dispatch_state_update(FunctionComponentStateDispatchRequest::new(
            other_state.dispatch(),
            action(82),
            normal_lane,
        ))
        .unwrap();
    let mut gate = FunctionComponentRenderPhaseUpdateGate::new(render.hook_state(), Lanes::DEFAULT);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    hook_store
        .enqueue_state_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentStateDispatchRequest::new(mount.dispatch(), action(83), lane),
        )
        .unwrap();
    gate.finish_staged_render_phase_updates_for_canary(&mut hook_store)
        .unwrap();

    let cleanup = gate
        .cleanup_pending_render_phase_updates(&mut hook_store)
        .unwrap();

    assert_eq!(
        cleanup.source().reset_hooks_on_unwind(),
        "resetHooksOnUnwind"
    );
    assert_eq!(cleanup.render_fiber(), work_in_progress);
    assert_eq!(cleanup.queues(), &[mount.queue()]);
    assert_eq!(cleanup.cleared_queue_count(), 1);
    assert_eq!(cleanup.staged_update_count_before_cleanup(), 0);
    assert!(!cleanup.did_schedule_render_phase_update_after_cleanup());
    assert!(!cleanup.did_schedule_render_phase_update_during_this_pass_after_cleanup());
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(mount.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(other_state.queue())
            .unwrap(),
        vec![normal.update()]
    );
}

#[test]
fn function_component_render_phase_hook_staging_rejects_stale_render_attempt() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(917)));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let render = render_function_component_with_use_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(90), lanes),
        &mut registry,
        action_as_state,
    )
    .unwrap();
    let mount = render.state_hook().mount_record().unwrap();
    let mut gate = FunctionComponentRenderPhaseUpdateGate::new(render.hook_state(), Lanes::DEFAULT);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let dispatch = hook_store
        .enqueue_state_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentStateDispatchRequest::new(mount.dispatch(), action(91), lane),
        )
        .unwrap();

    gate.advance_render_attempt_for_canary();

    assert_eq!(
        gate.finish_staged_render_phase_updates_for_canary(&mut hook_store),
        Err(FunctionComponentRenderError::StaleRenderPhaseAttempt {
            fiber: work_in_progress,
            expected: gate.attempt(),
            actual: dispatch.attempt(),
        })
    );
    assert_eq!(gate.staged_update_count(), 1);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(mount.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn function_component_render_phase_hook_staging_preserves_failure_and_rejects_replay() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(918)));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let render = render_function_component_with_use_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(100), lanes),
        &mut registry,
        action_as_state,
    )
    .unwrap();
    let mount = render.state_hook().mount_record().unwrap();
    let mut gate = FunctionComponentRenderPhaseUpdateGate::new(render.hook_state(), Lanes::DEFAULT);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let dispatch = hook_store
        .enqueue_state_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentStateDispatchRequest::new(mount.dispatch(), action(101), lane),
        )
        .unwrap();
    let entry = gate.staging.entries()[0].clone();
    gate.staging
        .stage(*entry.owner(), entry.queue(), entry.update(), entry.lane());

    for _ in 0..2 {
        let error = gate
            .finish_staged_render_phase_updates_for_canary(&mut hook_store)
            .unwrap_err();
        match error {
            FunctionComponentRenderError::HookQueue { fiber, error } => {
                assert_eq!(fiber, work_in_progress);
                assert!(matches!(
                    *error,
                    HookQueueError::DuplicateStagedUpdate { id }
                        if id == dispatch.update()
                ));
            }
            other => panic!("unexpected render-phase staging error: {other:?}"),
        }
        assert_eq!(gate.staged_update_count(), 2);
        assert_eq!(
            hook_store
                .state_queues()
                .pending_updates(mount.queue())
                .unwrap(),
            Vec::<HookUpdateId>::new()
        );
    }
}

#[test]
fn function_component_render_phase_hook_staging_rejects_wrong_fiber_hook_queue() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(919)));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let render = render_function_component_with_use_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(110), lanes),
        &mut registry,
        action_as_state,
    )
    .unwrap();
    let mount = render.state_hook().mount_record().unwrap();
    let other_fiber = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(5),
        FiberMode::NO,
    );
    let other_state = hook_store
        .create_current_state_hook(other_fiber, StateHandle::from_raw(111))
        .unwrap();
    let mut gate = FunctionComponentRenderPhaseUpdateGate::new(render.hook_state(), Lanes::DEFAULT);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let dispatch = hook_store
        .enqueue_state_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentStateDispatchRequest::new(mount.dispatch(), action(112), lane),
        )
        .unwrap();
    let mut owner = *gate.staging.entries()[0].owner();
    owner.render_fiber = other_fiber;
    owner.queue_owner = other_fiber;
    owner.queue = other_state.queue();
    owner.queue_generation = hook_queue_generation_for_canary(other_state.queue());
    gate.staging = HookUpdateStaging::new();
    gate.staging
        .stage(owner, mount.queue(), dispatch.update(), lane);

    assert_eq!(
        gate.finish_staged_render_phase_updates_for_canary(&mut hook_store),
        Err(
            FunctionComponentRenderError::RenderPhaseWrongFiberOrHookQueue {
                fiber: work_in_progress,
                owner_fiber: other_fiber,
                queue_owner: other_fiber,
                expected_queue: other_state.queue(),
                actual_queue: mount.queue(),
            }
        )
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(mount.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn function_component_render_phase_hook_staging_rejects_lane_mismatch() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(120))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(920)));
    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let mut gate =
        FunctionComponentRenderPhaseUpdateGate::new(render.hook_state().unwrap(), Lanes::DEFAULT);
    let sync_lane = HookUpdateLane::from_lane(Lane::SYNC).unwrap();

    assert_eq!(
        hook_store.enqueue_state_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentStateDispatchRequest::new(
                current_state.dispatch(),
                action(121),
                sync_lane,
            ),
        ),
        Err(FunctionComponentRenderError::RenderPhaseLaneMismatch {
            fiber: work_in_progress,
            render_lanes: Lanes::DEFAULT,
            update_lane: sync_lane,
        })
    );
    assert_eq!(gate.staged_update_count(), 0);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_state.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn function_component_render_phase_hook_staging_rejects_bailout_context_alias() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(130))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(921)));
    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let state = render.hook_state().unwrap();
    let mut gate = FunctionComponentRenderPhaseUpdateGate::new(state, Lanes::DEFAULT);
    let blocker =
        FunctionComponentRenderPhaseBailoutBlockerState::active_render(state, Lanes::DEFAULT)
            .with_render_fiber(current)
            .with_context_dependency_lanes(1, Lanes::DEFAULT)
            .with_child_traversal_blocked(true);
    gate.set_blocker_state_for_canary(blocker);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    assert_eq!(
        hook_store.enqueue_state_render_phase_update_for_canary(
            &mut gate,
            FunctionComponentStateDispatchRequest::new(
                current_state.dispatch(),
                action(131),
                lane,
            ),
        ),
        Err(
            FunctionComponentRenderError::RenderPhaseBailoutContextAlias {
                fiber: work_in_progress,
                blocker_fiber: current,
                current: Some(current),
                blocker_current: Some(current),
                render_lanes: Lanes::DEFAULT,
                blocker_lanes: Lanes::DEFAULT,
                context_dependency_count: 1,
                context_dependency_lanes: Lanes::DEFAULT,
                child_traversal_blocked: true,
            }
        )
    );
    assert_eq!(gate.staged_update_count(), 0);
}

#[test]
fn function_component_render_phase_hook_staging_rejects_caller_built_rows() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(922)));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let render = render_function_component_with_use_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(140), lanes),
        &mut registry,
        action_as_state,
    )
    .unwrap();
    let mount = render.state_hook().mount_record().unwrap();
    let mut gate = FunctionComponentRenderPhaseUpdateGate::new(render.hook_state(), Lanes::DEFAULT);
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let update = hook_store
        .state_queues_mut()
        .create_update(lane, action(141));
    let owner = FunctionComponentRenderPhaseStagingOwner {
        source_owned: false,
        caller_built: true,
        attempt: gate.attempt(),
        staging_generation: gate.staging_generation(),
        render_fiber: work_in_progress,
        current: gate.state().current(),
        work_in_progress_list: gate.state().work_in_progress_list(),
        queue_owner: work_in_progress,
        queue: mount.queue(),
        queue_generation: hook_queue_generation_for_canary(mount.queue()),
        update_generation: hook_update_generation_for_canary(update),
        render_lanes: Lanes::DEFAULT,
        update_lane: lane,
        blocker: gate.blocker_state(),
    };
    gate.staging.stage(owner, mount.queue(), update, lane);

    assert_eq!(
        gate.finish_staged_render_phase_updates_for_canary(&mut hook_store),
        Err(
            FunctionComponentRenderError::RenderPhaseCallerBuiltRowsRejected {
                fiber: work_in_progress,
                queue: mount.queue(),
                update,
            }
        )
    );
    assert_eq!(gate.staged_update_count(), 1);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(mount.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn function_component_render_phase_evidence_does_not_claim_public_hook_root_scheduler_act_or_renderer_compatibility()
 {
    let evidence = FunctionComponentRenderPhaseSourceEvidenceForCanary::react_19_2_6();

    assert_eq!(evidence.react_version(), "19.2.6");
    assert_eq!(
        evidence.currently_rendering_fiber(),
        "currentlyRenderingFiber"
    );
    assert_eq!(evidence.is_render_phase_update(), "isRenderPhaseUpdate");
    assert_eq!(
        evidence.enqueue_render_phase_update(),
        "enqueueRenderPhaseUpdate"
    );
    assert_eq!(
        evidence.hook_queue_generation_guard(),
        "HookQueueId generation"
    );
    assert_eq!(
        evidence.hook_staging_failure_preservation(),
        "HookUpdateStaging.finish_queueing"
    );
    assert_eq!(
        evidence.bailout_blocker(),
        "begin_work_function_component_bailout_blocker"
    );
    assert_eq!(evidence.rerender_limit(), 25);
    assert!(!evidence.public_hook_compatibility_claimed());
    assert!(!evidence.public_root_compatibility_claimed());
    assert!(!evidence.root_scheduler_integration_claimed());
    assert!(!evidence.scheduler_compatibility_claimed());
    assert!(!evidence.act_compatibility_claimed());
    assert!(!evidence.renderer_compatibility_claimed());
}

#[test]
fn function_component_render_invokes_registered_component_and_records_output() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let output = FunctionComponentOutputHandle::from_raw(44);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let record =
        render_function_component(&mut arena, work_in_progress, Lanes::DEFAULT, &mut registry)
            .unwrap();

    assert_eq!(record.current(), Some(current));
    assert_eq!(record.work_in_progress(), work_in_progress);
    assert_eq!(record.component(), component);
    assert_eq!(record.props(), PropsHandle::from_raw(2));
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(record.output(), output);
    assert_eq!(record.hook_state(), None);
    assert_eq!(record.context_state(), None);
    assert_eq!(record.context_read_count(), 0);
    assert!(!record.has_context_reads());
    assert_eq!(record.output().raw(), 44);
    assert!(FunctionComponentOutputHandle::NONE.is_none());
    assert!(record.output().is_some());
    assert_eq!(
        registry.calls(),
        &[FunctionComponentInvocationRequest {
            fiber: work_in_progress,
            component,
            props: PropsHandle::from_raw(2),
            render_lanes: Lanes::DEFAULT,
            hook_state: None,
            context_state: None,
        }]
    );

    let current_node = arena.get(current).unwrap();
    let work_node = arena.get(work_in_progress).unwrap();
    assert_eq!(current_node.memoized_props(), PropsHandle::NONE);
    assert_eq!(work_node.memoized_props(), PropsHandle::from_raw(2));
    assert_eq!(work_node.memoized_state(), StateHandle::NONE);
    assert_eq!(work_node.update_queue(), UpdateQueueHandle::NONE);
    assert_eq!(work_node.lanes(), Lanes::NO);
    assert_eq!(work_node.child(), None);
}

#[test]
fn function_component_context_read_canary_records_default_value() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let output = FunctionComponentOutputHandle::from_raw(61);
    let default_value = context_value(10);
    let mut context_store = FunctionComponentContextRenderStore::new();
    let context = context_store.create_context(default_value);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let record = render_function_component_with_context_reads(
        &mut arena,
        &mut context_store,
        work_in_progress,
        Lanes::DEFAULT,
        &[context],
        &mut registry,
    )
    .unwrap();

    let state = record.context_state().unwrap();
    assert_eq!(record.current(), Some(current));
    assert_eq!(record.output(), output);
    assert_eq!(record.hook_state(), None);
    assert_eq!(record.context_read_count(), 1);
    assert!(record.has_context_reads());
    assert_eq!(state.render_fiber(), work_in_progress);
    assert_eq!(state.render_lanes(), Lanes::DEFAULT);
    assert_eq!(state.context_count(), 1);
    assert_eq!(state.stack_depth(), 0);
    assert_eq!(state.start_read_index(), 0);
    assert_eq!(state.start_dependency_index(), 0);
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.calls()[0].context_state(), Some(state));

    let reads = context_store.context_reads_for_record(record);
    assert_eq!(reads.len(), 1);
    assert_eq!(reads[0].fiber(), work_in_progress);
    assert_eq!(reads[0].context(), context);
    assert_eq!(reads[0].default_value(), default_value);
    assert_eq!(reads[0].value(), default_value);
    assert_eq!(reads[0].active_provider_count(), 0);
    assert!(!reads[0].has_active_provider());
    let dependency =
        assert_private_context_dependency_metadata(&arena, &context_store, record, reads[0], 0);
    assert_eq!(
        context_store.context_dependencies_for_record(record),
        &[dependency]
    );
    assert_eq!(
        dependency.next(),
        FunctionComponentContextDependencyHandle::NONE
    );
    assert!(!dependency.has_next());
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.context_stack().stack_depth(), 0);
}

#[test]
fn function_component_context_read_canary_records_provider_value_then_default_after_unwind() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let default_value = context_value(20);
    let provided_value = context_value(30);
    let mut context_store = FunctionComponentContextRenderStore::new();
    let context = context_store.create_context(default_value);
    let before_provider = context_store
        .push_provider(context, provided_value)
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(62)));

    let provider_record = render_function_component_with_context_reads(
        &mut arena,
        &mut context_store,
        work_in_progress,
        Lanes::DEFAULT,
        &[context],
        &mut registry,
    )
    .unwrap();

    let provider_state = provider_record.context_state().unwrap();
    assert_eq!(provider_state.stack_depth(), 1);
    assert_eq!(provider_state.start_read_index(), 0);
    assert_eq!(provider_state.start_dependency_index(), 0);
    assert_eq!(provider_record.context_read_count(), 1);
    let provider_reads = context_store.context_reads_for_record(provider_record);
    assert_eq!(provider_reads[0].value(), provided_value);
    assert_eq!(provider_reads[0].default_value(), default_value);
    assert_eq!(provider_reads[0].active_provider_count(), 1);
    assert!(provider_reads[0].has_active_provider());
    let provider_dependency = assert_private_context_dependency_metadata(
        &arena,
        &context_store,
        provider_record,
        provider_reads[0],
        0,
    );
    assert_eq!(
        context_store.context_dependencies_for_record(provider_record),
        &[provider_dependency]
    );
    assert_eq!(
        context_store.current_value(context).unwrap(),
        provided_value
    );

    context_store.restore_snapshot(before_provider).unwrap();
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.context_stack().stack_depth(), 0);

    let default_record = render_function_component_with_context_reads(
        &mut arena,
        &mut context_store,
        work_in_progress,
        Lanes::SYNC,
        &[context],
        &mut registry,
    )
    .unwrap();

    let default_state = default_record.context_state().unwrap();
    assert_eq!(default_state.stack_depth(), 0);
    assert_eq!(default_state.start_read_index(), 1);
    assert_eq!(default_state.start_dependency_index(), 1);
    assert_eq!(default_record.context_read_count(), 1);
    let default_reads = context_store.context_reads_for_record(default_record);
    assert_eq!(default_reads[0].value(), default_value);
    assert_eq!(default_reads[0].active_provider_count(), 0);
    assert!(!default_reads[0].has_active_provider());
    let default_dependency = assert_private_context_dependency_metadata(
        &arena,
        &context_store,
        default_record,
        default_reads[0],
        0,
    );
    assert_eq!(
        context_store.context_dependencies_for_record(default_record),
        &[default_dependency]
    );
    assert_eq!(
        provider_dependency.next(),
        FunctionComponentContextDependencyHandle::NONE
    );
    assert_eq!(
        default_dependency.next(),
        FunctionComponentContextDependencyHandle::NONE
    );
    assert_eq!(registry.calls().len(), 2);
    assert_eq!(registry.calls()[0].context_state(), Some(provider_state));
    assert_eq!(registry.calls()[1].context_state(), Some(default_state));
    assert_eq!(
        context_store
            .context_reads()
            .iter()
            .map(|read| read.value())
            .collect::<Vec<_>>(),
        vec![provided_value, default_value]
    );
}

#[test]
fn function_component_context_read_canary_records_nested_provider_reads_in_order() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut context_store = FunctionComponentContextRenderStore::new();
    let outer_default = context_value(31);
    let inner_default = context_value(41);
    let outer_value = context_value(32);
    let inner_value = context_value(42);
    let outer_context = context_store.create_context(outer_default);
    let inner_context = context_store.create_context(inner_default);
    let before_outer = context_store
        .push_provider(outer_context, outer_value)
        .unwrap();
    let before_inner = context_store
        .push_provider(inner_context, inner_value)
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(63)));

    let record = render_function_component_with_context_reads(
        &mut arena,
        &mut context_store,
        work_in_progress,
        Lanes::DEFAULT,
        &[outer_context, inner_context],
        &mut registry,
    )
    .unwrap();

    let state = record.context_state().unwrap();
    assert_eq!(state.stack_depth(), 2);
    assert_eq!(state.start_read_index(), 0);
    assert_eq!(state.start_dependency_index(), 0);
    assert_eq!(record.context_read_count(), 2);
    assert_eq!(registry.calls()[0].context_state(), Some(state));
    let reads = context_store.context_reads_for_record(record);
    assert_eq!(reads.len(), 2);
    assert_eq!(reads[0].context(), outer_context);
    assert_eq!(reads[0].default_value(), outer_default);
    assert_eq!(reads[0].value(), outer_value);
    assert_eq!(reads[0].active_provider_count(), 1);
    assert_eq!(reads[1].context(), inner_context);
    assert_eq!(reads[1].default_value(), inner_default);
    assert_eq!(reads[1].value(), inner_value);
    assert_eq!(reads[1].active_provider_count(), 1);
    let first_dependency =
        assert_private_context_dependency_metadata(&arena, &context_store, record, reads[0], 0);
    let second_dependency =
        assert_private_context_dependency_metadata(&arena, &context_store, record, reads[1], 1);
    assert_eq!(first_dependency.next(), second_dependency.handle());
    assert!(first_dependency.has_next());
    assert_eq!(
        second_dependency.next(),
        FunctionComponentContextDependencyHandle::NONE
    );
    assert!(!second_dependency.has_next());
    assert_eq!(
        context_store.context_dependencies_for_record(record),
        &[first_dependency, second_dependency]
    );

    context_store.restore_snapshot(before_inner).unwrap();
    assert_eq!(context_store.stack_depth(), 1);
    assert_eq!(
        context_store.current_value(outer_context).unwrap(),
        outer_value
    );
    assert_eq!(
        context_store.current_value(inner_context).unwrap(),
        inner_default
    );
    context_store.restore_snapshot(before_outer).unwrap();
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(
        context_store.current_value(outer_context).unwrap(),
        outer_default
    );
    assert_eq!(
        context_store.current_value(inner_context).unwrap(),
        inner_default
    );
}

#[test]
fn function_component_use_context_render_reads_nearest_provider_during_invocation() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(700);
    let outer_value = context_value(701);
    let inner_value = context_value(702);
    let context = context_store.create_context(default_value);
    let before_outer = context_store.push_provider(context, outer_value).unwrap();
    let before_inner = context_store.push_provider(context, inner_value).unwrap();
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::Single { context });

    let record = render_function_component_with_use_context(
        &mut arena,
        &mut context_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.current(), Some(current));
    assert_eq!(record.work_in_progress(), work_in_progress);
    assert_eq!(
        record.output(),
        FunctionComponentOutputHandle::from_raw(702)
    );
    assert_eq!(record.context_read_count(), 1);
    assert!(record.render().has_context_reads());
    let state = record.context_state();
    assert_eq!(state.render_fiber(), work_in_progress);
    assert_eq!(state.render_lanes(), Lanes::DEFAULT);
    assert_eq!(state.stack_depth(), 2);
    assert_eq!(state.start_dependency_index(), 0);
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.calls()[0].context_state(), Some(state));

    let read = record.context_read();
    assert_eq!(read.fiber(), work_in_progress);
    assert_eq!(read.context(), context);
    assert_eq!(read.default_value(), default_value);
    assert_eq!(read.value(), inner_value);
    assert_eq!(read.active_provider_count(), 2);
    assert!(read.has_active_provider());
    assert_eq!(record.context_dependency(), read.dependency());
    let dependency = assert_private_context_dependency_metadata(
        &arena,
        &context_store,
        record.render(),
        read,
        0,
    );
    assert_eq!(
        context_store.context_dependencies_for_record(record.render()),
        &[dependency]
    );
    assert_eq!(
        dependency.next(),
        FunctionComponentContextDependencyHandle::NONE
    );
    assert_eq!(registry.reads(), &[read]);
    assert_eq!(
        context_store.context_reads_for_record(record.render()),
        &[read]
    );
    assert_eq!(context_store.current_value(context).unwrap(), inner_value);
    assert_eq!(
        arena.get(work_in_progress).unwrap().memoized_props(),
        PropsHandle::from_raw(2)
    );

    context_store.restore_snapshot(before_inner).unwrap();
    assert_eq!(context_store.current_value(context).unwrap(), outer_value);
    context_store.restore_snapshot(before_outer).unwrap();
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
}

#[test]
fn function_component_use_context_render_fails_closed_without_a_consumer_read() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut context_store = FunctionComponentContextRenderStore::new();
    let mut registry = TestUseContextComponentRegistry::new(
        component,
        UseContextBehavior::NoRead {
            output: FunctionComponentOutputHandle::from_raw(710),
        },
    );

    let error = render_function_component_with_use_context(
        &mut arena,
        &mut context_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentRenderError::MissingUseContextRead {
            fiber: work_in_progress,
        }
    );
    assert_eq!(registry.calls().len(), 1);
    assert!(registry.reads().is_empty());
    assert!(context_store.context_reads().is_empty());
    assert!(context_store.context_dependencies().is_empty());
    assert_eq!(
        arena.get(work_in_progress).unwrap().memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn function_component_use_context_render_rejects_multiple_consumer_reads() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut context_store = FunctionComponentContextRenderStore::new();
    let context = context_store.create_context(context_value(720));
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::Double { context });

    let error = render_function_component_with_use_context(
        &mut arena,
        &mut context_store,
        work_in_progress,
        Lanes::SYNC,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentRenderError::UnsupportedUseContextReadCount {
            fiber: work_in_progress,
            read_count: 2,
        }
    );
    assert_eq!(registry.reads().len(), 2);
    assert_eq!(context_store.context_reads().len(), 2);
    assert_eq!(context_store.context_dependencies().len(), 2);
    assert_eq!(
        context_store.context_dependencies()[0].next(),
        context_store.context_dependencies()[1].handle()
    );
    assert_eq!(
        context_store.context_dependencies()[1].next(),
        FunctionComponentContextDependencyHandle::NONE
    );
    assert_eq!(
        arena.get(work_in_progress).unwrap().memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn function_component_use_context_render_propagates_unknown_context_diagnostic() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut context_store = FunctionComponentContextRenderStore::new();
    let unknown = ContextHandle::from_raw(7_700);
    let mut registry = TestUseContextComponentRegistry::new(
        component,
        UseContextBehavior::Unknown { context: unknown },
    );

    let error = render_function_component_with_use_context(
        &mut arena,
        &mut context_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentRenderError::ContextStack {
            fiber: work_in_progress,
            error: Box::new(ContextStackError::UnknownContext { context: unknown }),
        }
    );
    assert_eq!(registry.calls().len(), 1);
    assert!(registry.reads().is_empty());
    assert!(context_store.context_reads().is_empty());
    assert!(context_store.context_dependencies().is_empty());
    assert_eq!(
        arena.get(work_in_progress).unwrap().memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn function_component_required_use_context_rejects_unexpected_context_before_memoizing() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut context_store = FunctionComponentContextRenderStore::new();
    let expected_context = context_store.create_context(context_value(730));
    let actual_context = context_store.create_context(context_value(731));
    let before_provider = context_store
        .push_provider(expected_context, context_value(732))
        .unwrap();
    let mut registry = TestUseContextComponentRegistry::new(
        component,
        UseContextBehavior::Single {
            context: actual_context,
        },
    );

    let error = render_function_component_with_required_use_context(
        &mut arena,
        &mut context_store,
        work_in_progress,
        Lanes::DEFAULT,
        expected_context,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentRenderError::UnexpectedUseContextContext {
            fiber: work_in_progress,
            expected: expected_context,
            actual: actual_context,
        }
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.reads().len(), 1);
    let read = registry.reads()[0];
    assert_eq!(read.context(), actual_context);
    assert_eq!(read.default_value(), context_value(731));
    assert_eq!(read.value(), context_value(731));
    assert_eq!(read.active_provider_count(), 0);
    assert_eq!(context_store.context_reads(), &[read]);
    assert_eq!(context_store.context_dependencies().len(), 1);
    let dependency = context_store.context_dependencies()[0];
    assert_eq!(dependency.handle(), read.dependency());
    assert_eq!(dependency.fiber(), work_in_progress);
    assert_eq!(dependency.context(), actual_context);
    assert_eq!(dependency.memoized_value(), context_value(731));
    assert_eq!(dependency.read_index(), read.read_index());
    assert_eq!(dependency.render_read_index(), 0);
    assert_eq!(dependency.render_lanes(), Lanes::DEFAULT);
    assert_eq!(dependency.dependency_lanes(), Lanes::NO);
    assert_eq!(
        dependency.next(),
        FunctionComponentContextDependencyHandle::NONE
    );
    assert!(!dependency.renderer_visible_propagation());
    assert_eq!(dependency.propagation_flags(), FiberFlags::NO);
    let fiber = arena.get(work_in_progress).unwrap();
    assert_eq!(fiber.dependencies(), DependenciesHandle::NONE);
    assert!(!fiber.flags().contains_any(FiberFlags::NEEDS_PROPAGATION));
    assert_eq!(
        context_store.current_value(expected_context).unwrap(),
        context_value(732)
    );
    assert_eq!(
        arena.get(work_in_progress).unwrap().memoized_props(),
        PropsHandle::NONE
    );

    context_store.restore_snapshot(before_provider).unwrap();
    assert_eq!(
        context_store.current_value(expected_context).unwrap(),
        context_value(730)
    );
}

#[test]
fn function_component_context_change_propagation_marks_dependency_fiber_and_root_lanes() {
    let (mut store, root_id) = root_store();
    let host_root = store.root(root_id).unwrap().current();
    let (current, work_in_progress, component) =
        attached_function_component_pair(&mut store, root_id);
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(740);
    let previous_value = context_value(741);
    let next_value = context_value(742);
    let context = context_store.create_context(default_value);
    let provider_snapshot = context_store
        .push_provider(context, previous_value)
        .unwrap();
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::Single { context });
    let render = render_function_component_with_use_context(
        store.fiber_arena_mut(),
        &mut context_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap()
    .render();
    context_store.restore_snapshot(provider_snapshot).unwrap();
    let read = context_store.context_reads_for_record(render)[0];
    let dependency = context_store.context_dependency(read.dependency()).unwrap();
    assert_eq!(dependency.dependency_lanes(), Lanes::NO);
    let propagation_lanes = Lanes::SYNC.merge_lane(Lane::TRANSITION_1);

    let propagation = propagate_context_change_to_function_component_dependencies(
        &mut store,
        &mut context_store,
        render,
        FunctionComponentContextChangePropagationRequest::new(
            ContextValueChange::new(context, previous_value, next_value),
            propagation_lanes,
        ),
    )
    .unwrap();

    assert_eq!(propagation.render(), render);
    assert_eq!(propagation.context(), context);
    assert_eq!(propagation.previous_value(), previous_value);
    assert_eq!(propagation.next_value(), next_value);
    assert_eq!(propagation.propagation_lanes(), propagation_lanes);
    assert_eq!(propagation.scanned_dependency_count(), 1);
    assert_eq!(propagation.marked_dependency_count(), 1);
    assert!(propagation.has_marked_dependencies());
    assert_eq!(propagation.roots(), &[root_id]);
    assert_eq!(propagation.root_count(), 1);

    let marked = propagation.marked_dependencies()[0];
    assert_eq!(marked.dependency(), read.dependency());
    assert_eq!(marked.fiber(), work_in_progress);
    assert_eq!(marked.context(), context);
    assert_eq!(marked.memoized_value(), previous_value);
    assert_eq!(marked.previous_value(), previous_value);
    assert_eq!(marked.next_value(), next_value);
    assert_eq!(marked.propagation_lanes(), propagation_lanes);
    assert_eq!(marked.previous_dependency_lanes(), Lanes::NO);
    assert_eq!(marked.dependency_lanes(), propagation_lanes);
    assert_eq!(marked.root(), root_id);

    let updated_dependency = context_store.context_dependency(read.dependency()).unwrap();
    assert_eq!(updated_dependency.dependency_lanes(), propagation_lanes);
    assert!(!updated_dependency.renderer_visible_propagation());
    assert_eq!(updated_dependency.propagation_flags(), FiberFlags::NO);
    assert!(
        store
            .fiber_arena()
            .get(work_in_progress)
            .unwrap()
            .lanes()
            .contains_all(propagation_lanes)
    );
    assert!(
        store
            .fiber_arena()
            .get(current)
            .unwrap()
            .lanes()
            .contains_all(propagation_lanes)
    );
    assert!(
        store
            .fiber_arena()
            .get(host_root)
            .unwrap()
            .child_lanes()
            .contains_all(propagation_lanes)
    );
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_all(propagation_lanes)
    );
    let fiber = store.fiber_arena().get(work_in_progress).unwrap();
    assert_eq!(fiber.dependencies(), DependenciesHandle::NONE);
    assert!(!fiber.flags().contains_any(FiberFlags::NEEDS_PROPAGATION));
}

#[test]
fn function_component_context_change_propagation_skips_unchanged_and_unmatched_dependencies() {
    let (mut store, root_id) = root_store();
    let host_root = store.root(root_id).unwrap().current();
    let (_current, work_in_progress, component) =
        attached_function_component_pair(&mut store, root_id);
    let mut context_store = FunctionComponentContextRenderStore::new();
    let previous_value = context_value(750);
    let context = context_store.create_context(context_value(749));
    let other_context = context_store.create_context(context_value(760));
    let provider_snapshot = context_store
        .push_provider(context, previous_value)
        .unwrap();
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::Single { context });
    let render = render_function_component_with_use_context(
        store.fiber_arena_mut(),
        &mut context_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap()
    .render();
    context_store.restore_snapshot(provider_snapshot).unwrap();
    let read = context_store.context_reads_for_record(render)[0];

    let unchanged = propagate_context_change_to_function_component_dependencies(
        &mut store,
        &mut context_store,
        render,
        FunctionComponentContextChangePropagationRequest::new(
            ContextValueChange::new(context, previous_value, previous_value),
            Lanes::SYNC,
        ),
    )
    .unwrap();
    let unmatched = propagate_context_change_to_function_component_dependencies(
        &mut store,
        &mut context_store,
        render,
        FunctionComponentContextChangePropagationRequest::new(
            ContextValueChange::new(other_context, context_value(760), context_value(761)),
            Lanes::SYNC,
        ),
    )
    .unwrap();

    assert_eq!(unchanged.scanned_dependency_count(), 1);
    assert_eq!(unchanged.marked_dependency_count(), 0);
    assert_eq!(unchanged.roots(), &[]);
    assert_eq!(unmatched.scanned_dependency_count(), 1);
    assert_eq!(unmatched.marked_dependency_count(), 0);
    assert_eq!(unmatched.roots(), &[]);
    assert_eq!(
        context_store
            .context_dependency(read.dependency())
            .unwrap()
            .dependency_lanes(),
        Lanes::NO
    );
    assert_eq!(
        store.fiber_arena().get(work_in_progress).unwrap().lanes(),
        Lanes::NO
    );
    assert_eq!(
        store.fiber_arena().get(host_root).unwrap().child_lanes(),
        Lanes::NO
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
}

#[test]
fn function_component_context_change_propagation_rejects_empty_lanes() {
    let (mut store, root_id) = root_store();
    let (_current, work_in_progress, component) =
        attached_function_component_pair(&mut store, root_id);
    let mut context_store = FunctionComponentContextRenderStore::new();
    let context = context_store.create_context(context_value(770));
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::Single { context });
    let render = render_function_component_with_use_context(
        store.fiber_arena_mut(),
        &mut context_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap()
    .render();

    let error = propagate_context_change_to_function_component_dependencies(
        &mut store,
        &mut context_store,
        render,
        FunctionComponentContextChangePropagationRequest::new(
            ContextValueChange::new(context, context_value(770), context_value(771)),
            Lanes::NO,
        ),
    )
    .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentContextChangePropagationError::EmptyPropagationLanes { context }
    );
    assert_eq!(
        store.fiber_arena().get(work_in_progress).unwrap().lanes(),
        Lanes::NO
    );
}

#[test]
fn function_component_single_child_reconciliation_records_host_component_handoff() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let output = FunctionComponentOutputHandle::from_raw(56);
    let child_element = RootElementHandle::from_raw(56);
    let element_type = ElementTypeHandle::from_raw(560);
    let child_props = PropsHandle::from_raw(561);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let render =
        render_function_component(&mut arena, work_in_progress, Lanes::DEFAULT, &mut registry)
            .unwrap();
    let resolver =
        StaticSingleChildResolver::new(Some(FunctionComponentSingleChildOutput::host_component(
            output,
            child_element,
            element_type,
            child_props,
        )));

    let record =
        reconcile_function_component_single_child_output(&mut arena, render, &resolver).unwrap();

    assert_eq!(record.function_component(), work_in_progress);
    assert_eq!(record.current(), Some(current));
    assert_eq!(record.output(), output);
    assert_eq!(record.child_element(), child_element);
    assert_eq!(record.child_tag(), FiberTag::HostComponent);
    assert_eq!(record.child_element_type(), element_type);
    assert_eq!(record.child_props(), child_props);
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(arena.get(work_in_progress).unwrap().child(), None);
    assert!(
        arena
            .get(work_in_progress)
            .unwrap()
            .flags()
            .contains_all(FiberFlags::PERFORMED_WORK)
    );
    assert_eq!(arena.get(current).unwrap().child(), None);
}

#[test]
fn function_component_single_child_reconciliation_records_host_text_handoff() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let output = FunctionComponentOutputHandle::from_raw(57);
    let child_element = RootElementHandle::from_raw(57);
    let child_props = PropsHandle::from_raw(571);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let render =
        render_function_component(&mut arena, work_in_progress, Lanes::SYNC, &mut registry)
            .unwrap();
    let resolver = StaticSingleChildResolver::new(Some(
        FunctionComponentSingleChildOutput::host_text(output, child_element, child_props),
    ));

    let record =
        reconcile_function_component_single_child_output(&mut arena, render, &resolver).unwrap();

    assert_eq!(record.child_tag(), FiberTag::HostText);
    assert_eq!(record.child_element_type(), ElementTypeHandle::NONE);
    assert_eq!(record.child_props(), child_props);
    assert_eq!(record.render_lanes(), Lanes::SYNC);
}

#[test]
fn function_component_single_child_reconciliation_fails_closed_for_unknown_output() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let output = FunctionComponentOutputHandle::from_raw(58);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let render =
        render_function_component(&mut arena, work_in_progress, Lanes::DEFAULT, &mut registry)
            .unwrap();
    let resolver = StaticSingleChildResolver::new(None);

    let error = reconcile_function_component_single_child_output(&mut arena, render, &resolver)
        .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentSingleChildReconciliationError::UnknownOutput {
            fiber: work_in_progress,
            output,
        }
    );
    assert_eq!(arena.get(work_in_progress).unwrap().flags(), FiberFlags::NO);
}

#[test]
fn function_component_single_child_reconciliation_rejects_unsupported_child_tags() {
    for tag in [
        FiberTag::Fragment,
        FiberTag::Portal,
        FiberTag::Suspense,
        FiberTag::HostSingleton,
    ] {
        let (mut arena, _current, work_in_progress, component) = function_component_pair();
        let output = FunctionComponentOutputHandle::from_raw(59);
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let render =
            render_function_component(&mut arena, work_in_progress, Lanes::DEFAULT, &mut registry)
                .unwrap();
        let resolver =
            StaticSingleChildResolver::new(Some(FunctionComponentSingleChildOutput::new(
                output,
                RootElementHandle::from_raw(59),
                tag,
                ElementTypeHandle::from_raw(590),
                PropsHandle::from_raw(591),
            )));

        let error = reconcile_function_component_single_child_output(&mut arena, render, &resolver)
            .unwrap_err();

        assert_eq!(
            error,
            FunctionComponentSingleChildReconciliationError::UnsupportedChildTag {
                fiber: work_in_progress,
                output,
                tag,
            }
        );
        assert_eq!(arena.get(work_in_progress).unwrap().child(), None);
    }
}

#[test]
fn function_component_single_child_reconciliation_rejects_existing_children() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let existing = arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(590),
        FiberMode::NO,
    );
    arena.set_children(current, &[existing]).unwrap();
    let output = FunctionComponentOutputHandle::from_raw(60);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let render =
        render_function_component(&mut arena, work_in_progress, Lanes::DEFAULT, &mut registry)
            .unwrap();
    let resolver =
        StaticSingleChildResolver::new(Some(FunctionComponentSingleChildOutput::host_text(
            output,
            RootElementHandle::from_raw(60),
            PropsHandle::from_raw(601),
        )));

    let error = reconcile_function_component_single_child_output(&mut arena, render, &resolver)
        .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentSingleChildReconciliationError::ExistingCurrentChild {
            fiber: work_in_progress,
            current,
            child: existing,
        }
    );
}

#[test]
fn function_component_render_propagates_invocation_errors() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut registry = TestFunctionComponentRegistry::default();
    let invocation_error = FunctionComponentInvocationError::component_error("boom");
    registry.register(component, Err(invocation_error.clone()));

    let error =
        render_function_component(&mut arena, work_in_progress, Lanes::DEFAULT, &mut registry)
            .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentRenderError::Invocation {
            fiber: work_in_progress,
            component,
            error: invocation_error,
        }
    );
    assert_eq!(
        arena.get(work_in_progress).unwrap().memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn function_component_render_associates_mount_hook_metadata_with_request() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let output = FunctionComponentOutputHandle::from_raw(45);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();

    let state = record.hook_state().unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Mount);
    assert_eq!(state.render_fiber(), work_in_progress);
    assert_eq!(state.current(), Some(current));
    assert_eq!(state.current_list(), None);
    assert_eq!(record.output(), output);
    assert_eq!(registry.calls()[0].hook_state(), Some(state));
    assert_eq!(
        hook_store
            .hook_lists()
            .list(state.work_in_progress_list())
            .unwrap()
            .owner(),
        work_in_progress
    );

    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    assert_eq!(cursor.phase(), FunctionComponentHookRenderPhase::Mount);
    let mounted_hook = hook_store
        .mount_hook_metadata(&mut cursor, opaque(30))
        .unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();
    assert_eq!(finished.state(), state);
    assert_eq!(finished.traversal().traversed_count(), 1);
    assert_eq!(
        hook_store
            .hook_lists()
            .ordered_hooks(state.work_in_progress_list())
            .unwrap(),
        vec![mounted_hook]
    );
    assert_eq!(
        hook_store
            .hook_lists()
            .hook(mounted_hook)
            .unwrap()
            .payload(),
        opaque(30)
    );
}

#[test]
fn function_component_render_associates_update_hook_metadata_with_request() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_list = hook_store.create_current_list(current);
    let first_payload = opaque(10);
    let second_payload = opaque(20);
    let current_first = hook_store
        .hook_lists_mut()
        .append_hook(current_list, first_payload)
        .unwrap();
    let current_second = hook_store
        .hook_lists_mut()
        .append_hook(current_list, second_payload)
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(46);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();

    let state = record.hook_state().unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
    assert_eq!(state.render_fiber(), work_in_progress);
    assert_eq!(state.current(), Some(current));
    assert_eq!(state.current_list(), Some(current_list));
    assert_eq!(record.output(), output);
    assert_eq!(registry.calls()[0].hook_state(), Some(state));
    assert_eq!(
        hook_store
            .hook_lists()
            .list(state.work_in_progress_list())
            .unwrap()
            .owner(),
        current
    );

    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    assert_eq!(cursor.phase(), FunctionComponentHookRenderPhase::Update);
    assert_eq!(cursor.state(), state);
    let work_first = hook_store.update_hook_metadata(&mut cursor).unwrap();
    let work_second = hook_store.update_hook_metadata(&mut cursor).unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();

    assert_eq!(finished.state(), state);
    assert_eq!(finished.traversal().traversed_count(), 2);
    assert_eq!(
        hook_store.hook_lists().ordered_hooks(current_list).unwrap(),
        vec![current_first, current_second]
    );
    assert_eq!(
        hook_store
            .hook_lists()
            .ordered_hooks(state.work_in_progress_list())
            .unwrap(),
        vec![work_first, work_second]
    );
    assert_ne!(current_first, work_first);
    assert_eq!(
        hook_store.hook_lists().hook(work_first).unwrap().payload(),
        first_payload
    );
    assert_eq!(
        hook_store.hook_lists().hook(work_second).unwrap().payload(),
        second_payload
    );
}

#[test]
fn function_component_effect_metadata_mount_registers_ring_hook_and_flags() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let output = FunctionComponentOutputHandle::from_raw(47);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let state = record.hook_state().unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();

    let registration = hook_store
        .mount_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(70),
            deps(700),
        )
        .unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();

    assert_eq!(finished.traversal().traversed_count(), 1);
    assert_eq!(registration.phase(), FunctionComponentEffectPhase::Passive);
    assert_eq!(registration.tag(), HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(registration.dependencies(), deps(700));
    assert_eq!(
        registration.fiber_flags(),
        FiberFlags::PASSIVE | FiberFlags::PASSIVE_STATIC
    );
    assert_eq!(
        arena.get(work_in_progress).unwrap().flags(),
        FiberFlags::PASSIVE | FiberFlags::PASSIVE_STATIC
    );
    assert_eq!(
        hook_store
            .hook_lists()
            .hook(registration.hook())
            .unwrap()
            .payload(),
        HookSlotPayload::effect(HookEffectPayload::new(registration.effect()))
    );

    let ring = hook_store
        .effect_ring(state.work_in_progress_list())
        .unwrap();
    assert_eq!(ring.last_effect(), Some(registration.effect()));
    assert_eq!(
        ring.first_effect(hook_store.hook_effects()).unwrap(),
        Some(registration.effect())
    );
    let effect = hook_store
        .hook_effects()
        .get_effect(registration.effect())
        .unwrap();
    assert_eq!(effect.tag(), HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(effect.create(), callback(70));
    assert_eq!(effect.dependencies(), deps(700));
    assert_eq!(effect.instance(), registration.instance());
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(registration.instance())
            .unwrap()
            .destroy(),
        None
    );

    let pending_metadata = hook_store
        .passive_effect_metadata(state, Lanes::DEFAULT)
        .unwrap();
    assert_eq!(pending_metadata.len(), 1);
    assert_eq!(pending_metadata[0].fiber(), work_in_progress);
    assert_eq!(
        pending_metadata[0].hook_list(),
        state.work_in_progress_list()
    );
    assert_eq!(pending_metadata[0].effect_index(), 0);
    assert_eq!(pending_metadata[0].effect(), registration.effect());
    assert_eq!(pending_metadata[0].instance(), registration.instance());
    assert_eq!(pending_metadata[0].tag(), HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(pending_metadata[0].create(), callback(70));
    assert_eq!(pending_metadata[0].destroy(), None);
    assert_eq!(pending_metadata[0].dependencies(), deps(700));
    assert_eq!(pending_metadata[0].lanes(), Lanes::DEFAULT);
    assert!(
        hook_store
            .passive_effect_metadata(state, Lanes::NO)
            .unwrap()
            .is_empty()
    );
}

#[test]
fn function_component_passive_metadata_carries_destroy_callback_handle_without_taking_it() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            &mut arena,
            current,
            FunctionComponentEffectPhase::Passive,
            callback(92),
            deps(920),
            Some(callback(921)),
        )
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(92)));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let state = record.hook_state().unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let registration = hook_store
        .update_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(922),
            deps(923),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let pending_metadata = hook_store
        .passive_effect_metadata(state, Lanes::DEFAULT)
        .unwrap();

    assert_eq!(pending_metadata.len(), 1);
    assert_eq!(pending_metadata[0].effect(), registration.effect());
    assert_eq!(pending_metadata[0].instance(), previous.instance());
    assert_eq!(pending_metadata[0].instance(), registration.instance());
    assert_eq!(pending_metadata[0].create(), callback(922));
    assert_eq!(pending_metadata[0].destroy(), Some(callback(921)));
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(previous.instance())
            .unwrap()
            .destroy(),
        Some(callback(921))
    );
}

#[test]
fn function_component_layout_metadata_mount_is_distinct_from_passive_metadata() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(94)));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let state = record.hook_state().unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let layout = hook_store
        .mount_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Layout,
            callback(940),
            deps(941),
        )
        .unwrap();
    let passive = hook_store
        .mount_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(942),
            deps(943),
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let layout_metadata = hook_store
        .layout_effect_metadata(state, Lanes::DEFAULT)
        .unwrap();
    assert_eq!(layout_metadata.len(), 1);
    assert_eq!(layout_metadata[0].fiber(), work_in_progress);
    assert_eq!(
        layout_metadata[0].hook_list(),
        state.work_in_progress_list()
    );
    assert_eq!(layout_metadata[0].effect_index(), 0);
    assert_eq!(layout_metadata[0].effect(), layout.effect());
    assert_eq!(layout_metadata[0].previous_effect(), None);
    assert_eq!(layout_metadata[0].instance(), layout.instance());
    assert_eq!(layout_metadata[0].tag(), HookEffectFlags::LAYOUT_EFFECT);
    assert_eq!(layout_metadata[0].create(), callback(940));
    assert_eq!(layout_metadata[0].destroy(), None);
    assert_eq!(layout_metadata[0].previous_dependencies(), None);
    assert_eq!(layout_metadata[0].dependencies(), deps(941));
    assert_eq!(layout_metadata[0].dependency_status(), None);
    assert_eq!(
        layout_metadata[0].dependency_phase(),
        FunctionComponentEffectDependencyPhase::Mount
    );
    assert_eq!(layout_metadata[0].lanes(), Lanes::DEFAULT);
    assert!(
        hook_store
            .layout_effect_metadata(state, Lanes::NO)
            .unwrap()
            .is_empty()
    );

    let passive_metadata = hook_store
        .passive_effect_metadata(state, Lanes::DEFAULT)
        .unwrap();
    assert_eq!(passive_metadata.len(), 1);
    assert_eq!(passive_metadata[0].effect(), passive.effect());
    assert_eq!(passive_metadata[0].tag(), HookEffectFlags::PASSIVE_EFFECT);
}

#[test]
fn function_component_committed_effect_queue_records_rendered_effects_by_fiber() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(93)));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let state = record.hook_state().unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let layout = hook_store
        .mount_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Layout,
            callback(930),
            deps(931),
        )
        .unwrap();
    let passive = hook_store
        .mount_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(932),
            deps(933),
        )
        .unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();
    assert_eq!(finished.traversal().traversed_count(), 2);

    let committed = hook_store
        .commit_pending_effect_queue_for_fiber(work_in_progress, Lanes::DEFAULT)
        .unwrap()
        .unwrap();

    assert_eq!(committed.fiber(), work_in_progress);
    assert_eq!(committed.phase(), FunctionComponentHookRenderPhase::Mount);
    assert_eq!(committed.hook_list(), state.work_in_progress_list());
    assert_eq!(committed.lanes(), Lanes::DEFAULT);
    assert_eq!(committed.len(), 2);
    assert!(!committed.is_empty());
    assert_eq!(committed.accepted_passive_count(), 1);
    assert_eq!(committed.accepted_layout_count(), 1);
    assert_eq!(
        hook_store.current_list(work_in_progress),
        Some(state.work_in_progress_list())
    );
    assert_eq!(
        hook_store.committed_effect_queue(work_in_progress),
        Some(&committed)
    );
    assert!(
        hook_store
            .commit_pending_effect_queue_for_fiber(work_in_progress, Lanes::DEFAULT)
            .unwrap()
            .is_none()
    );

    let records = committed.records();
    assert_eq!(records[0].effect_index(), 0);
    assert_eq!(records[0].effect(), layout.effect());
    assert_eq!(records[0].previous_effect(), None);
    assert_eq!(records[0].phase(), FunctionComponentEffectPhase::Layout);
    assert_eq!(records[0].tag(), HookEffectFlags::LAYOUT_EFFECT);
    assert_eq!(records[0].create(), callback(930));
    assert_eq!(records[0].destroy(), None);
    assert_eq!(records[0].previous_dependencies(), None);
    assert_eq!(records[0].dependencies(), deps(931));
    assert_eq!(records[0].dependency_status(), None);
    assert_eq!(records[0].lanes(), Lanes::DEFAULT);
    assert!(!records[0].accepted_for_pending_passive());
    assert!(records[0].accepted_for_layout_commit());
    assert_eq!(records[1].effect_index(), 1);
    assert_eq!(records[1].effect(), passive.effect());
    assert_eq!(records[1].phase(), FunctionComponentEffectPhase::Passive);
    assert_eq!(records[1].tag(), HookEffectFlags::PASSIVE_EFFECT);
    assert!(records[1].accepted_for_pending_passive());
    assert!(!records[1].accepted_for_layout_commit());

    let layout_metadata = hook_store
        .committed_layout_effect_metadata(work_in_progress, HookEffectFlags::LAYOUT_EFFECT);
    assert_eq!(layout_metadata.len(), 1);
    assert_eq!(layout_metadata[0].fiber(), work_in_progress);
    assert_eq!(
        layout_metadata[0].render_phase(),
        FunctionComponentHookRenderPhase::Mount
    );
    assert_eq!(
        layout_metadata[0].hook_list(),
        state.work_in_progress_list()
    );
    assert_eq!(layout_metadata[0].effect_index(), 0);
    assert_eq!(layout_metadata[0].effect(), layout.effect());
    assert_eq!(layout_metadata[0].previous_effect(), None);
    assert_eq!(layout_metadata[0].instance(), layout.instance());
    assert_eq!(layout_metadata[0].tag(), HookEffectFlags::LAYOUT_EFFECT);
    assert_eq!(layout_metadata[0].create(), callback(930));
    assert_eq!(layout_metadata[0].destroy(), None);
    assert_eq!(layout_metadata[0].previous_dependencies(), None);
    assert_eq!(layout_metadata[0].dependencies(), deps(931));
    assert_eq!(layout_metadata[0].dependency_status(), None);
    assert_eq!(
        layout_metadata[0].dependency_phase(),
        FunctionComponentEffectDependencyPhase::Mount
    );
    assert_eq!(layout_metadata[0].lanes(), Lanes::DEFAULT);
    assert!(
        hook_store
            .committed_layout_effect_metadata(work_in_progress, HookEffectFlags::PASSIVE)
            .is_empty()
    );

    let passive_metadata = hook_store
        .committed_passive_effect_metadata(work_in_progress, HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(passive_metadata.len(), 1);
    assert_eq!(passive_metadata[0].fiber(), work_in_progress);
    assert_eq!(
        passive_metadata[0].hook_list(),
        state.work_in_progress_list()
    );
    assert_eq!(passive_metadata[0].effect_index(), 0);
    assert_eq!(passive_metadata[0].effect(), passive.effect());
    assert_eq!(passive_metadata[0].instance(), passive.instance());
    assert_eq!(passive_metadata[0].tag(), HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(passive_metadata[0].create(), callback(932));
    assert_eq!(passive_metadata[0].destroy(), None);
    assert_eq!(passive_metadata[0].dependencies(), deps(933));
    assert_eq!(passive_metadata[0].lanes(), Lanes::DEFAULT);
    assert!(
        hook_store
            .committed_passive_effect_metadata(work_in_progress, HookEffectFlags::LAYOUT)
            .is_empty()
    );
}

#[test]
fn private_use_state_mount_records_queue_dispatch_and_pending_update() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let output = FunctionComponentOutputHandle::from_raw(47);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();

    let state = record.hook_state().unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let state_record = hook_store
        .mount_state_hook(&mut cursor, StateHandle::from_raw(300))
        .unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();
    assert_eq!(finished.traversal().traversed_count(), 1);
    assert_eq!(state_record.memoized_state(), StateHandle::from_raw(300));
    assert_eq!(state_record.base_state(), StateHandle::from_raw(300));
    assert_eq!(state_record.base_queue(), None);
    assert!(state_record.dispatch().is_some());
    assert_eq!(FunctionComponentStateDispatchHandle::NONE.raw(), 0);
    assert!(FunctionComponentStateActionHandle::NONE.is_none());

    let hook_payload = hook_store
        .hook_lists()
        .hook(state_record.hook())
        .unwrap()
        .payload()
        .state_payload()
        .unwrap();
    assert_eq!(hook_payload.queue(), state_record.queue());
    assert_eq!(hook_payload.memoized_state(), StateHandle::from_raw(300));

    let queue = hook_store
        .state_queues()
        .queue(state_record.queue())
        .unwrap();
    assert_eq!(queue.dispatch().copied(), Some(state_record.dispatch()));
    assert_eq!(
        queue.last_rendered_reducer().copied(),
        Some(FunctionComponentStateReducerId::BasicState)
    );
    assert_eq!(*queue.last_rendered_state(), StateHandle::from_raw(300));
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(state_record.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );

    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let dispatch_record = hook_store
        .dispatch_state_update(FunctionComponentStateDispatchRequest::new(
            state_record.dispatch(),
            action(900),
            lane,
        ))
        .unwrap();

    assert_eq!(dispatch_record.fiber(), work_in_progress);
    assert_eq!(dispatch_record.queue(), state_record.queue());
    assert_eq!(dispatch_record.dispatch(), state_record.dispatch());
    assert_eq!(dispatch_record.lane(), lane);
    assert_eq!(dispatch_record.revert_lane(), HookRevertLane::NO);
    assert_eq!(dispatch_record.action(), action(900));
    assert_eq!(dispatch_record.eager_state(), None);
    assert!(!dispatch_record.has_eager_state());
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(state_record.queue())
            .unwrap(),
        vec![dispatch_record.update()]
    );
    let update = hook_store
        .state_queues()
        .update(dispatch_record.update())
        .unwrap();
    assert_eq!(update.lane(), lane);
    assert_eq!(update.revert_lane(), HookRevertLane::NO);
    assert_eq!(*update.action(), action(900));
    assert!(!update.has_eager_state());
}

#[test]
fn private_use_state_update_clones_current_queue_and_reuses_dispatch() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(400))
        .unwrap();
    let current_list = hook_store.current_list(current).unwrap();
    let output = FunctionComponentOutputHandle::from_raw(48);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();

    let state = record.hook_state().unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
    assert_eq!(state.current_list(), Some(current_list));
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let work_state = hook_store.update_state_hook(&mut cursor).unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();

    assert_eq!(finished.traversal().traversed_count(), 1);
    assert_ne!(current_state.hook(), work_state.hook());
    assert_eq!(work_state.queue(), current_state.queue());
    assert_eq!(work_state.dispatch(), current_state.dispatch());
    assert_eq!(work_state.memoized_state(), StateHandle::from_raw(400));
    assert_eq!(
        hook_store
            .hook_lists()
            .ordered_hooks(state.work_in_progress_list())
            .unwrap(),
        vec![work_state.hook()]
    );

    let lane = HookUpdateLane::from_lane(Lane::SYNC).unwrap();
    let dispatch_record = hook_store
        .dispatch_state_update(FunctionComponentStateDispatchRequest::new(
            work_state.dispatch(),
            action(901),
            lane,
        ))
        .unwrap();

    assert_eq!(dispatch_record.fiber(), current);
    assert_eq!(dispatch_record.queue(), current_state.queue());
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_state.queue())
            .unwrap(),
        vec![dispatch_record.update()]
    );
}

#[test]
fn private_use_state_update_render_processes_queued_update_and_records_state_handle() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(410))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let queued = hook_store
        .dispatch_state_update(FunctionComponentStateDispatchRequest::new(
            current_state.dispatch(),
            action(411),
            lane,
        ))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(66)));

    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let state = render.hook_state().unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let update_render = hook_store
        .update_state_hook_with_queued_updates(&mut cursor, lanes, action_as_state)
        .unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();

    assert_eq!(finished.traversal().traversed_count(), 1);
    assert_eq!(update_render.fiber(), work_in_progress);
    assert_eq!(update_render.queue(), current_state.queue());
    assert_eq!(update_render.dispatch(), current_state.dispatch());
    assert_eq!(update_render.lanes(), lanes);
    assert_eq!(update_render.render_lanes(), Lanes::DEFAULT);
    assert_eq!(update_render.root_render_lanes(), Lanes::DEFAULT);
    assert_eq!(
        update_render.previous_memoized_state(),
        StateHandle::from_raw(410)
    );
    assert_eq!(
        update_render.previous_base_state(),
        StateHandle::from_raw(410)
    );
    assert_eq!(update_render.previous_base_queue(), None);
    assert_eq!(update_render.memoized_state(), StateHandle::from_raw(411));
    assert_eq!(update_render.resulting_state(), StateHandle::from_raw(411));
    assert_eq!(update_render.base_state(), StateHandle::from_raw(411));
    assert_eq!(update_render.base_queue(), None);
    assert_eq!(update_render.remaining_lanes(), Lanes::NO);
    assert_eq!(update_render.applied_update_count(), 1);
    assert_eq!(update_render.skipped_update_count(), 0);
    assert_eq!(update_render.reverted_update_count(), 0);
    assert_eq!(update_render.eager_update_count(), 0);

    let work_payload = hook_store
        .hook_lists()
        .hook(update_render.hook())
        .unwrap()
        .payload()
        .state_payload()
        .unwrap();
    assert_eq!(work_payload.memoized_state(), StateHandle::from_raw(411));
    assert_eq!(work_payload.base_state(), StateHandle::from_raw(411));
    assert_eq!(work_payload.base_queue(), None);
    assert_eq!(work_payload.queue(), current_state.queue());
    let current_payload = hook_store
        .hook_lists()
        .hook(current_state.hook())
        .unwrap()
        .payload()
        .state_payload()
        .unwrap();
    assert_eq!(current_payload.memoized_state(), StateHandle::from_raw(410));
    assert_eq!(current_payload.base_queue(), None);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_state.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
    let queue = hook_store
        .state_queues()
        .queue(current_state.queue())
        .unwrap();
    assert_eq!(*queue.last_rendered_state(), StateHandle::from_raw(411));
    assert_eq!(
        queue.last_rendered_reducer().copied(),
        Some(FunctionComponentStateReducerId::BasicState)
    );
    assert_eq!(
        *hook_store
            .state_queues()
            .update(queued.update())
            .unwrap()
            .action(),
        action(411)
    );
}

#[test]
fn private_use_state_render_path_mounts_state_hook_during_render() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let output = FunctionComponentOutputHandle::from_raw(72);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let state_request =
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(610), lanes);

    let record = render_function_component_with_use_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        state_request,
        &mut registry,
        action_as_state,
    )
    .unwrap();

    let hook_state = record.hook_state();
    let state_hook = record.state_hook();
    let mount = state_hook.mount_record().unwrap();
    assert_eq!(record.current(), Some(current));
    assert_eq!(record.work_in_progress(), work_in_progress);
    assert_eq!(record.output(), output);
    assert_eq!(record.render().hook_state(), Some(hook_state));
    assert_eq!(hook_state.phase(), FunctionComponentHookRenderPhase::Mount);
    assert_eq!(record.hook_traversal().traversed_count(), 1);
    assert_eq!(state_hook.phase(), FunctionComponentHookRenderPhase::Mount);
    assert_eq!(state_hook.memoized_state(), StateHandle::from_raw(610));
    assert_eq!(state_hook.base_state(), StateHandle::from_raw(610));
    assert_eq!(state_hook.base_queue(), None);
    assert_eq!(state_hook.hook(), mount.hook());
    assert_eq!(state_hook.queue(), mount.queue());
    assert_eq!(state_hook.dispatch(), mount.dispatch());
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.calls()[0].hook_state(), Some(hook_state));

    let queue = hook_store.state_queues().queue(mount.queue()).unwrap();
    assert_eq!(queue.dispatch().copied(), Some(mount.dispatch()));
    assert_eq!(
        queue.last_rendered_reducer().copied(),
        Some(FunctionComponentStateReducerId::BasicState)
    );
    assert_eq!(*queue.last_rendered_state(), StateHandle::from_raw(610));
    assert_eq!(
        hook_store
            .hook_lists()
            .ordered_hooks(hook_state.work_in_progress_list())
            .unwrap(),
        vec![mount.hook()]
    );
}

#[test]
fn private_use_reducer_render_path_mounts_reducer_hook_during_render() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = reducer(720);
    let output = FunctionComponentOutputHandle::from_raw(721);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let reducer_request = FunctionComponentUseReducerRenderRequest::new(
        reducer_id,
        StateHandle::from_raw(722),
        lanes,
    );

    let record = render_function_component_with_use_reducer(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        reducer_request,
        &mut registry,
        reducer_adds_action,
    )
    .unwrap();

    let hook_state = record.hook_state();
    let reducer_hook = record.reducer_hook();
    let mount = reducer_hook.mount_record().unwrap();
    assert_eq!(record.current(), Some(current));
    assert_eq!(record.work_in_progress(), work_in_progress);
    assert_eq!(record.output(), output);
    assert_eq!(record.render().hook_state(), Some(hook_state));
    assert_eq!(hook_state.phase(), FunctionComponentHookRenderPhase::Mount);
    assert_eq!(record.hook_traversal().traversed_count(), 1);
    assert_eq!(
        reducer_hook.phase(),
        FunctionComponentHookRenderPhase::Mount
    );
    assert_eq!(reducer_hook.reducer(), reducer_id);
    assert_eq!(reducer_hook.memoized_state(), StateHandle::from_raw(722));
    assert_eq!(reducer_hook.base_state(), StateHandle::from_raw(722));
    assert_eq!(reducer_hook.base_queue(), None);
    assert_eq!(reducer_hook.hook(), mount.hook());
    assert_eq!(reducer_hook.queue(), mount.queue());
    assert_eq!(reducer_hook.dispatch(), mount.dispatch());
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.calls()[0].hook_state(), Some(hook_state));

    let queue = hook_store.state_queues().queue(mount.queue()).unwrap();
    assert_eq!(queue.dispatch().copied(), Some(mount.dispatch()));
    assert_eq!(
        queue.last_rendered_reducer().copied(),
        Some(FunctionComponentStateReducerId::Reducer(reducer_id))
    );
    assert_eq!(*queue.last_rendered_state(), StateHandle::from_raw(722));
}

#[test]
fn private_use_reducer_render_path_updates_reducer_hook_before_invocation() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_reducer = reducer(730);
    let next_reducer = reducer(731);
    let current_reducer = hook_store
        .create_current_reducer_hook(current, previous_reducer, StateHandle::from_raw(732))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    hook_store
        .dispatch_reducer_update(FunctionComponentReducerDispatchRequest::new(
            current_reducer.dispatch(),
            action(8),
            lane,
        ))
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(733);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let reducer_request = FunctionComponentUseReducerRenderRequest::new(
        next_reducer,
        StateHandle::from_raw(999),
        lanes,
    );
    let mut reducer_calls = 0;

    let record = render_function_component_with_use_reducer(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        reducer_request,
        &mut registry,
        |state, action| {
            reducer_calls += 1;
            StateHandle::from_raw(state.raw() + action.raw())
        },
    )
    .unwrap();

    let hook_state = record.hook_state();
    let reducer_hook = record.reducer_hook();
    let update = reducer_hook.update_record().unwrap();
    assert_eq!(record.current(), Some(current));
    assert_eq!(record.output(), output);
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(record.hook_traversal().traversed_count(), 1);
    assert_eq!(hook_state.phase(), FunctionComponentHookRenderPhase::Update);
    assert_eq!(
        reducer_hook.phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(reducer_hook.reducer(), next_reducer);
    assert_eq!(reducer_hook.queue(), current_reducer.queue());
    assert_eq!(reducer_hook.dispatch(), current_reducer.dispatch());
    assert_eq!(update.previous_memoized_state(), StateHandle::from_raw(732));
    assert_eq!(update.memoized_state(), StateHandle::from_raw(740));
    assert_eq!(update.base_state(), StateHandle::from_raw(740));
    assert_eq!(update.remaining_lanes(), Lanes::NO);
    assert_eq!(update.applied_update_count(), 1);
    assert_eq!(update.skipped_update_count(), 0);
    assert_eq!(reducer_calls, 1);
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.calls()[0].hook_state(), Some(hook_state));
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_reducer.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
    let queue = hook_store
        .state_queues()
        .queue(current_reducer.queue())
        .unwrap();
    assert_eq!(
        queue.last_rendered_reducer().copied(),
        Some(FunctionComponentStateReducerId::Reducer(next_reducer))
    );
    assert_eq!(*queue.last_rendered_state(), StateHandle::from_raw(740));
}

#[test]
fn private_use_state_dispatch_after_initial_render_records_root_reschedule_request() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let root_current = store.root(root_id).unwrap().current();
    let (current, work_in_progress, component) =
        attached_function_component_pair(&mut store, root_id);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let output = FunctionComponentOutputHandle::from_raw(75);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let state_request =
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(640), lanes);

    let render = render_function_component_with_use_state(
        store.fiber_arena_mut(),
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        state_request,
        &mut registry,
        action_as_state,
    )
    .unwrap();
    let mount = render.state_hook().mount_record().unwrap();
    assert_eq!(render.current(), Some(current));
    assert_eq!(render.output(), output);
    assert_eq!(mount.memoized_state(), StateHandle::from_raw(640));
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(mount.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        crate::scheduled_roots(&store).unwrap(),
        Vec::<FiberRootId>::new()
    );

    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let rescheduled = hook_store
        .dispatch_state_update_and_reschedule_root(
            &mut store,
            FunctionComponentStateDispatchRequest::new(mount.dispatch(), action(641), lane),
        )
        .unwrap();

    assert_eq!(rescheduled.root(), root_id);
    assert_eq!(rescheduled.dispatch().fiber(), work_in_progress);
    assert_eq!(rescheduled.dispatch().queue(), mount.queue());
    assert_eq!(rescheduled.dispatch().dispatch(), mount.dispatch());
    assert_eq!(rescheduled.dispatch().lane(), lane);
    assert_eq!(rescheduled.reschedule().root(), root_id);
    assert_eq!(rescheduled.reschedule().fiber(), work_in_progress);
    assert_eq!(rescheduled.reschedule().lane(), Lane::DEFAULT);
    assert_eq!(rescheduled.scheduled().root(), root_id);
    assert!(rescheduled.scheduled().inserted());
    assert!(rescheduled.scheduled().microtask().is_some());
    assert_eq!(crate::scheduled_roots(&store).unwrap(), vec![root_id]);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(mount.queue())
            .unwrap(),
        vec![rescheduled.dispatch().update()]
    );
    assert!(
        store
            .fiber_arena()
            .get(work_in_progress)
            .unwrap()
            .lanes()
            .contains_lane(Lane::DEFAULT)
    );
    assert!(
        store
            .fiber_arena()
            .get(current)
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

    let processed = crate::process_root_schedule_in_microtask(&mut store).unwrap();
    assert_eq!(processed.records().len(), 1);
    let task = processed.records()[0];
    assert_eq!(task.root(), root_id);
    assert_eq!(task.next_lanes(), Lanes::DEFAULT);
    assert_eq!(task.outcome(), crate::RootTaskScheduleOutcome::Scheduled);
    assert_eq!(task.scheduled_callback().unwrap().root(), root_id);
    assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), root_current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
}

#[test]
fn private_use_state_render_path_updates_from_queue_and_hook_list() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(620))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    hook_store
        .dispatch_state_update(FunctionComponentStateDispatchRequest::new(
            current_state.dispatch(),
            action(621),
            lane,
        ))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(73)));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let state_request =
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(999), lanes);

    let record = render_function_component_with_use_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        state_request,
        &mut registry,
        action_as_state,
    )
    .unwrap();

    let state_hook = record.state_hook();
    let update = state_hook.update_record().unwrap();
    assert_eq!(
        record.hook_state().phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(record.hook_traversal().traversed_count(), 1);
    assert_eq!(state_hook.phase(), FunctionComponentHookRenderPhase::Update);
    assert_eq!(state_hook.queue(), current_state.queue());
    assert_eq!(state_hook.dispatch(), current_state.dispatch());
    assert_eq!(state_hook.memoized_state(), StateHandle::from_raw(621));
    assert_eq!(update.previous_memoized_state(), StateHandle::from_raw(620));
    assert_eq!(update.memoized_state(), StateHandle::from_raw(621));
    assert_eq!(update.base_queue(), None);
    assert_eq!(update.remaining_lanes(), Lanes::NO);
    assert_eq!(update.applied_update_count(), 1);
    assert_eq!(update.skipped_update_count(), 0);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_state.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );

    let current_payload = hook_store
        .hook_lists()
        .hook(current_state.hook())
        .unwrap()
        .payload()
        .state_payload()
        .unwrap();
    let work_payload = hook_store
        .hook_lists()
        .hook(update.hook())
        .unwrap()
        .payload()
        .state_payload()
        .unwrap();
    assert_eq!(current_payload.memoized_state(), StateHandle::from_raw(620));
    assert_eq!(work_payload.memoized_state(), StateHandle::from_raw(621));
    assert_eq!(
        hook_store
            .state_queues()
            .queue(current_state.queue())
            .unwrap()
            .last_rendered_state(),
        &StateHandle::from_raw(621)
    );
}

#[test]
fn private_use_state_render_path_rebases_skipped_updates_before_invocation() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(630))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    hook_store
        .dispatch_state_update(FunctionComponentStateDispatchRequest::new(
            current_state.dispatch(),
            action(631),
            lane,
        ))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(74)));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::SYNC, Lanes::SYNC);
    let state_request =
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(999), lanes);

    let record = render_function_component_with_use_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::SYNC,
        state_request,
        &mut registry,
        |_, _| panic!("skipped useState update should not run reducer"),
    )
    .unwrap();

    let update = record.state_hook().update_record().unwrap();
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(update.memoized_state(), StateHandle::from_raw(630));
    assert_eq!(update.base_state(), StateHandle::from_raw(630));
    assert_eq!(update.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(update.applied_update_count(), 0);
    assert_eq!(update.skipped_update_count(), 1);
    let rebased = hook_store
        .state_queues()
        .update_ring(update.base_queue())
        .unwrap();
    assert_eq!(rebased.len(), 1);
    assert_eq!(
        hook_store
            .state_queues()
            .update(rebased[0])
            .unwrap()
            .lane()
            .priority_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(
        *hook_store
            .state_queues()
            .update(rebased[0])
            .unwrap()
            .action(),
        action(631)
    );
}

#[test]
fn private_use_memo_ref_render_path_mounts_hooks_before_invocation() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let output = FunctionComponentOutputHandle::from_raw(75);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let memo_request =
        FunctionComponentUseMemoRenderRequest::new(StateHandle::from_raw(710), deps(7100));
    let ref_request = FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(720));

    let record = render_function_component_with_use_memo_and_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        memo_request,
        ref_request,
        &mut registry,
    )
    .unwrap();

    let hook_state = record.hook_state();
    let memo_hook = record.memo_hook();
    let ref_hook = record.ref_hook();
    let memo_mount = memo_hook.mount_record().unwrap();
    let ref_mount = ref_hook.mount_record().unwrap();
    assert_eq!(record.current(), Some(current));
    assert_eq!(record.work_in_progress(), work_in_progress);
    assert_eq!(record.output(), output);
    assert_eq!(record.render().hook_state(), Some(hook_state));
    assert_eq!(record.memo_update_diagnostic(), None);
    assert_eq!(hook_state.phase(), FunctionComponentHookRenderPhase::Mount);
    assert_eq!(record.hook_traversal().traversed_count(), 2);
    assert_eq!(memo_hook.phase(), FunctionComponentHookRenderPhase::Mount);
    assert_eq!(memo_hook.value(), StateHandle::from_raw(710));
    assert_eq!(memo_hook.dependencies(), deps(7100));
    assert_eq!(memo_hook.hook(), memo_mount.hook());
    assert_eq!(ref_hook.phase(), FunctionComponentHookRenderPhase::Mount);
    assert!(ref_hook.ref_object().is_some());
    assert_eq!(FunctionComponentRefObjectHandle::NONE.raw(), 0);
    assert!(FunctionComponentRefObjectHandle::NONE.is_none());
    assert_eq!(ref_hook.initial_value(), StateHandle::from_raw(720));
    assert_eq!(ref_hook.hook(), ref_mount.hook());
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.calls()[0].hook_state(), Some(hook_state));

    let hooks = hook_store
        .hook_lists()
        .ordered_hooks(hook_state.work_in_progress_list())
        .unwrap();
    assert_eq!(hooks, vec![memo_mount.hook(), ref_mount.hook()]);
    assert_eq!(
        opaque_value(
            hook_store
                .hook_lists()
                .hook(memo_mount.hook())
                .unwrap()
                .payload()
        ),
        StateHandle::from_raw(710)
    );
    assert_eq!(
        opaque_value(
            hook_store
                .hook_lists()
                .hook(ref_mount.hook())
                .unwrap()
                .payload()
        ),
        StateHandle::from_raw(ref_mount.ref_object().raw())
    );
    assert!(
        hook_store
            .memo_update_diagnostic_records(hook_state)
            .unwrap()
            .is_empty()
    );
}

#[test]
fn private_use_ref_execution_evidence_records_mount_update_ref_identity() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let output = FunctionComponentOutputHandle::from_raw(96);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let mount = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(920)),
        &mut registry,
    )
    .unwrap();
    hook_store.bind_current_list_unchecked(current, mount.hook_state().work_in_progress_list());
    let update = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::SYNC,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(921)),
        &mut registry,
    )
    .unwrap();

    let mount_ref = mount.ref_hook().mount_record().unwrap();
    let update_ref = update.ref_hook().update_record().unwrap();
    let evidence =
        function_component_use_ref_execution_evidence_for_canary(&hook_store, mount, update)
            .unwrap();
    let source = evidence.source();

    assert_eq!(source.react_version(), "19.2.6");
    assert_eq!(source.react_hooks_use_ref(), "ReactHooks.useRef");
    assert_eq!(
        source.react_fiber_hooks_mount_ref(),
        "ReactFiberHooks.mountRef"
    );
    assert_eq!(
        source.react_fiber_hooks_update_ref(),
        "ReactFiberHooks.updateRef"
    );
    assert_eq!(
        source.fast_react_mount_ref_hook(),
        "FunctionComponentHookRenderStore::mount_ref_hook"
    );
    assert_eq!(
        source.fast_react_update_ref_hook(),
        "FunctionComponentHookRenderStore::update_ref_hook"
    );
    assert!(source.is_private_execution_only());
    assert_eq!(evidence.current(), current);
    assert_eq!(evidence.work_in_progress(), work_in_progress);
    assert_eq!(
        evidence.mount_hook_state().phase(),
        FunctionComponentHookRenderPhase::Mount
    );
    assert_eq!(
        evidence.update_hook_state().phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(evidence.mount_hook(), mount_ref.hook());
    assert_eq!(evidence.update_hook(), update_ref.hook());
    assert_ne!(evidence.mount_hook(), evidence.update_hook());
    assert_eq!(evidence.ref_object(), mount_ref.ref_object());
    assert_eq!(evidence.ref_object(), update_ref.ref_object());
    assert_eq!(evidence.current_after_mount(), StateHandle::from_raw(920));
    assert_eq!(evidence.current_after_update(), StateHandle::from_raw(920));
    assert_eq!(
        evidence.ignored_update_initial_value(),
        StateHandle::from_raw(921)
    );
    assert_eq!(evidence.mount_render_lanes(), Lanes::DEFAULT);
    assert_eq!(evidence.update_render_lanes(), Lanes::SYNC);
    assert_eq!(evidence.mount_traversed_count(), 1);
    assert_eq!(evidence.update_traversed_count(), 1);
    assert!(!evidence.caller_built_rows_accepted());
    assert!(!evidence.public_hook_compatibility_claimed());
    assert!(!evidence.public_root_compatibility_claimed());
    assert!(!evidence.root_scheduler_integration_claimed());
    assert!(!evidence.scheduler_compatibility_claimed());
    assert!(!evidence.act_compatibility_claimed());
    assert!(!evidence.renderer_compatibility_claimed());
    assert!(evidence.same_ref_identity_across_update());
    assert!(evidence.proves_private_mount_update_ref_identity());
    assert_eq!(
        hook_store
            .hook_lists()
            .hook(evidence.mount_hook())
            .unwrap()
            .payload(),
        ref_payload(evidence.ref_object())
    );
    assert_eq!(
        hook_store
            .hook_lists()
            .hook(evidence.update_hook())
            .unwrap()
            .payload(),
        ref_payload(evidence.ref_object())
    );
    assert_eq!(registry.calls().len(), 2);
    assert_eq!(registry.calls()[0].hook_state(), Some(mount.hook_state()));
    assert_eq!(registry.calls()[1].hook_state(), Some(update.hook_state()));
}

#[test]
fn private_use_ref_execution_evidence_rejects_stale_and_caller_shaped_records() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(97)));

    let mount = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(930)),
        &mut registry,
    )
    .unwrap();
    hook_store.bind_current_list_unchecked(current, mount.hook_state().work_in_progress_list());
    let update = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(931)),
        &mut registry,
    )
    .unwrap();
    assert!(
        function_component_use_ref_execution_evidence_for_canary(&hook_store, mount, update)
            .unwrap()
            .proves_private_mount_update_ref_identity()
    );

    let stale_update_state = FunctionComponentHookRenderState {
        current_list: Some(update.hook_state().work_in_progress_list()),
        ..update.hook_state()
    };
    let stale_update = FunctionComponentUseRefRenderRecord {
        render: FunctionComponentRenderRecord {
            hook_state: Some(stale_update_state),
            ..update.render()
        },
        hook_result: FunctionComponentHookRenderResult {
            state: stale_update_state,
            ..update.hook_result()
        },
        ..update
    };
    assert!(matches!(
        function_component_use_ref_execution_evidence_for_canary(
            &hook_store,
            mount,
            stale_update,
        ),
        Err(
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::StaleOrCrossComponentUseRefEvidence {
                ..
            }
        )
    ));

    let cross_component_update = FunctionComponentUseRefRenderRecord {
        render: FunctionComponentRenderRecord {
            work_in_progress: current,
            ..update.render()
        },
        ..update
    };
    assert!(matches!(
        function_component_use_ref_execution_evidence_for_canary(
            &hook_store,
            mount,
            cross_component_update,
        ),
        Err(
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::StaleOrCrossComponentUseRefEvidence {
                ..
            }
        )
    ));

    let update_ref = update.ref_hook().update_record().unwrap();
    let ref_override_update = FunctionComponentUseRefRenderRecord {
        ref_hook: FunctionComponentUseRefHookRenderRecord::Update(
            FunctionComponentRefUpdateRecord {
                ref_object: FunctionComponentRefObjectHandle::from_raw(
                    update_ref.ref_object().raw() + 100,
                ),
                ..update_ref
            },
        ),
        ..update
    };
    assert!(matches!(
        function_component_use_ref_execution_evidence_for_canary(
            &hook_store,
            mount,
            ref_override_update,
        ),
        Err(
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::CallerShapedUseRefEvidence { .. }
        )
    ));

    let same_initializer_update = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(930)),
        &mut registry,
    )
    .unwrap();
    assert!(matches!(
        function_component_use_ref_execution_evidence_for_canary(
            &hook_store,
            mount,
            same_initializer_update,
        ),
        Err(FunctionComponentUseRefExecutionEvidenceErrorForCanary::RefCurrentValueOverride { .. })
    ));
}

#[test]
fn private_use_ref_execution_evidence_rejects_cross_component_real_ref_records() {
    let (mut arena, current_a, work_in_progress_a, component_a) = function_component_pair();
    let current_b = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(3),
        FiberMode::NO,
    );
    let component_b = FiberTypeHandle::from_raw(101);
    arena
        .get_mut(current_b)
        .unwrap()
        .set_fiber_type(component_b);
    let work_in_progress_b = arena
        .create_work_in_progress(current_b, PropsHandle::from_raw(4))
        .unwrap();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component_a, Ok(FunctionComponentOutputHandle::from_raw(98)));
    registry.register(component_b, Ok(FunctionComponentOutputHandle::from_raw(99)));

    let mount_a = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress_a,
        Lanes::DEFAULT,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(940)),
        &mut registry,
    )
    .unwrap();
    hook_store.bind_current_list_unchecked(current_a, mount_a.hook_state().work_in_progress_list());
    let update_a = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress_a,
        Lanes::DEFAULT,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(941)),
        &mut registry,
    )
    .unwrap();
    assert!(
        function_component_use_ref_execution_evidence_for_canary(&hook_store, mount_a, update_a,)
            .unwrap()
            .proves_private_mount_update_ref_identity()
    );

    let mount_b = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress_b,
        Lanes::SYNC,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(950)),
        &mut registry,
    )
    .unwrap();
    hook_store.bind_current_list_unchecked(current_b, mount_b.hook_state().work_in_progress_list());
    let update_b = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress_b,
        Lanes::SYNC,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(951)),
        &mut registry,
    )
    .unwrap();
    assert!(
        function_component_use_ref_execution_evidence_for_canary(&hook_store, mount_b, update_b,)
            .unwrap()
            .proves_private_mount_update_ref_identity()
    );

    let forged_mount = FunctionComponentUseRefRenderRecord {
        ref_hook: mount_b.ref_hook(),
        ..mount_a
    };
    let forged_update = FunctionComponentUseRefRenderRecord {
        ref_hook: update_b.ref_hook(),
        ..update_a
    };

    assert!(matches!(
        function_component_use_ref_execution_evidence_for_canary(
            &hook_store,
            forged_mount,
            forged_update,
        ),
        Err(FunctionComponentUseRefExecutionEvidenceErrorForCanary::RefHookListMismatch { .. })
    ));
}

#[test]
fn private_use_ref_execution_evidence_rejects_forged_work_in_progress_identity() {
    let (mut arena, current_a, work_in_progress_a, component_a) = function_component_pair();
    let current_b = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(5),
        FiberMode::NO,
    );
    arena
        .get_mut(current_b)
        .unwrap()
        .set_fiber_type(FiberTypeHandle::from_raw(102));
    let work_in_progress_b = arena
        .create_work_in_progress(current_b, PropsHandle::from_raw(6))
        .unwrap();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(
        component_a,
        Ok(FunctionComponentOutputHandle::from_raw(100)),
    );

    let mount_a = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress_a,
        Lanes::DEFAULT,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(960)),
        &mut registry,
    )
    .unwrap();
    hook_store.bind_current_list_unchecked(current_a, mount_a.hook_state().work_in_progress_list());
    let update_a = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress_a,
        Lanes::DEFAULT,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(961)),
        &mut registry,
    )
    .unwrap();
    assert!(
        function_component_use_ref_execution_evidence_for_canary(&hook_store, mount_a, update_a,)
            .unwrap()
            .proves_private_mount_update_ref_identity()
    );

    let forged_mount = FunctionComponentUseRefRenderRecord {
        render: FunctionComponentRenderRecord {
            work_in_progress: work_in_progress_b,
            ..mount_a.render()
        },
        ..mount_a
    };
    let forged_update = FunctionComponentUseRefRenderRecord {
        render: FunctionComponentRenderRecord {
            work_in_progress: work_in_progress_b,
            ..update_a.render()
        },
        ..update_a
    };

    assert!(matches!(
        function_component_use_ref_execution_evidence_for_canary(
            &hook_store,
            forged_mount,
            forged_update,
        ),
        Err(
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::StaleOrCrossComponentUseRefEvidence {
                ..
            }
        )
    ));
}

#[test]
fn private_use_ref_execution_evidence_rejects_forged_hook_state_fiber_identity() {
    let (mut arena, current_a, work_in_progress_a, component_a) = function_component_pair();
    let current_b = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(7),
        FiberMode::NO,
    );
    arena
        .get_mut(current_b)
        .unwrap()
        .set_fiber_type(FiberTypeHandle::from_raw(103));
    let work_in_progress_b = arena
        .create_work_in_progress(current_b, PropsHandle::from_raw(8))
        .unwrap();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(
        component_a,
        Ok(FunctionComponentOutputHandle::from_raw(101)),
    );

    let mount_a = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress_a,
        Lanes::DEFAULT,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(970)),
        &mut registry,
    )
    .unwrap();
    hook_store.bind_current_list_unchecked(current_a, mount_a.hook_state().work_in_progress_list());
    let update_a = render_function_component_with_use_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress_a,
        Lanes::DEFAULT,
        FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(971)),
        &mut registry,
    )
    .unwrap();
    assert!(
        function_component_use_ref_execution_evidence_for_canary(&hook_store, mount_a, update_a,)
            .unwrap()
            .proves_private_mount_update_ref_identity()
    );

    let forged_mount_state = FunctionComponentHookRenderState {
        render_fiber: work_in_progress_b,
        ..mount_a.hook_state()
    };
    let forged_update_state = FunctionComponentHookRenderState {
        render_fiber: work_in_progress_b,
        ..update_a.hook_state()
    };
    let forged_mount = FunctionComponentUseRefRenderRecord {
        render: FunctionComponentRenderRecord {
            work_in_progress: work_in_progress_b,
            hook_state: Some(forged_mount_state),
            ..mount_a.render()
        },
        hook_result: FunctionComponentHookRenderResult {
            state: forged_mount_state,
            ..mount_a.hook_result()
        },
        ..mount_a
    };
    let forged_update = FunctionComponentUseRefRenderRecord {
        render: FunctionComponentRenderRecord {
            work_in_progress: work_in_progress_b,
            hook_state: Some(forged_update_state),
            ..update_a.render()
        },
        hook_result: FunctionComponentHookRenderResult {
            state: forged_update_state,
            ..update_a.hook_result()
        },
        ..update_a
    };

    assert!(matches!(
        function_component_use_ref_execution_evidence_for_canary(
            &hook_store,
            forged_mount,
            forged_update,
        ),
        Err(
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::RefHookListOwnerMismatch { .. }
        )
    ));
}

#[test]
fn private_use_memo_render_path_records_reuse_diagnostic_when_deps_match() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_memo = hook_store
        .create_current_memo_hook(current, StateHandle::from_raw(700), deps(7000))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(74)));
    let memo_request =
        FunctionComponentUseMemoRenderRequest::new(StateHandle::from_raw(701), deps(7000));

    let record = render_function_component_with_use_memo(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        memo_request,
        &mut registry,
    )
    .unwrap();

    let memo_update = record.memo_hook().update_record().unwrap();
    let diagnostic = record.memo_update_diagnostic().unwrap();
    assert_eq!(record.hook_traversal().traversed_count(), 1);
    assert_eq!(memo_update.previous_hook(), current_memo.hook());
    assert_eq!(diagnostic.diagnostic_index(), 0);
    assert_eq!(diagnostic.fiber(), work_in_progress);
    assert_eq!(diagnostic.current(), current);
    assert_eq!(
        diagnostic.current_hook_list(),
        record.hook_state().current_list().unwrap()
    );
    assert_eq!(
        diagnostic.hook_list(),
        record.hook_state().work_in_progress_list()
    );
    assert_eq!(diagnostic.previous_hook(), current_memo.hook());
    assert_eq!(diagnostic.hook(), memo_update.hook());
    assert_eq!(diagnostic.render_lanes(), Lanes::DEFAULT);
    assert_eq!(diagnostic.previous_value(), StateHandle::from_raw(700));
    assert_eq!(diagnostic.previous_dependencies(), deps(7000));
    assert_eq!(diagnostic.requested_value(), StateHandle::from_raw(701));
    assert_eq!(diagnostic.value(), StateHandle::from_raw(700));
    assert_eq!(diagnostic.dependencies(), deps(7000));
    assert_eq!(
        diagnostic.dependency_status(),
        FunctionComponentMemoDependencyStatus::Unchanged
    );
    assert!(diagnostic.reused_previous_value());
    assert!(!diagnostic.recomputed_value());

    let queue = hook_store
        .memo_update_diagnostics(record.hook_state())
        .unwrap()
        .unwrap();
    assert_eq!(
        queue.hook_list(),
        record.hook_state().work_in_progress_list()
    );
    assert_eq!(queue.len(), 1);
    assert!(!queue.is_empty());
    assert_eq!(queue.reuse_count(), 1);
    assert_eq!(queue.recompute_count(), 0);
    assert_eq!(queue.records(), &[diagnostic]);
}

#[test]
fn private_use_memo_reuses_recomputed_value_across_update_renders_when_deps_match() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_memo = hook_store
        .create_current_memo_hook(current, StateHandle::from_raw(900), deps(9000))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(94)));

    let changed_render = render_function_component_with_use_memo(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseMemoRenderRequest::new(StateHandle::from_raw(901), deps(9010)),
        &mut registry,
    )
    .unwrap();

    let changed_update = changed_render.memo_hook().update_record().unwrap();
    let changed_diagnostic = changed_render.memo_update_diagnostic().unwrap();
    assert_eq!(changed_update.previous_hook(), current_memo.hook());
    assert_eq!(
        changed_update.dependency_status(),
        FunctionComponentMemoDependencyStatus::Changed
    );
    assert_eq!(changed_update.previous_value(), StateHandle::from_raw(900));
    assert_eq!(changed_update.requested_value(), StateHandle::from_raw(901));
    assert_eq!(changed_update.value(), StateHandle::from_raw(901));
    assert_eq!(changed_update.dependencies(), deps(9010));
    assert!(changed_diagnostic.recomputed_value());
    assert_eq!(changed_diagnostic.value(), StateHandle::from_raw(901));
    assert_eq!(
        changed_render.output(),
        FunctionComponentOutputHandle::from_raw(94)
    );
    assert_eq!(
        changed_render.hook_state().phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(changed_render.hook_traversal().traversed_count(), 1);
    hook_store
        .bind_current_list_unchecked(current, changed_render.hook_state().work_in_progress_list());

    let reused_render = render_function_component_with_use_memo(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::SYNC,
        FunctionComponentUseMemoRenderRequest::new(StateHandle::from_raw(902), deps(9010)),
        &mut registry,
    )
    .unwrap();

    let reused_update = reused_render.memo_hook().update_record().unwrap();
    let reused_diagnostic = reused_render.memo_update_diagnostic().unwrap();
    assert_eq!(reused_update.previous_hook(), changed_update.hook());
    assert_eq!(reused_update.previous_value(), StateHandle::from_raw(901));
    assert_eq!(reused_update.previous_dependencies(), deps(9010));
    assert_eq!(reused_update.requested_value(), StateHandle::from_raw(902));
    assert_eq!(reused_update.value(), StateHandle::from_raw(901));
    assert_eq!(reused_update.dependencies(), deps(9010));
    assert_eq!(
        reused_update.dependency_status(),
        FunctionComponentMemoDependencyStatus::Unchanged
    );
    assert!(reused_update.reused_previous_value());
    assert_eq!(
        reused_render.memo_hook().value(),
        StateHandle::from_raw(901)
    );
    assert_eq!(
        reused_diagnostic.current_hook_list(),
        changed_render.hook_state().work_in_progress_list()
    );
    assert_eq!(reused_diagnostic.previous_hook(), changed_update.hook());
    assert_eq!(reused_diagnostic.hook(), reused_update.hook());
    assert_eq!(reused_diagnostic.render_lanes(), Lanes::SYNC);
    assert_eq!(
        reused_diagnostic.previous_value(),
        StateHandle::from_raw(901)
    );
    assert_eq!(
        reused_diagnostic.requested_value(),
        StateHandle::from_raw(902)
    );
    assert_eq!(reused_diagnostic.value(), StateHandle::from_raw(901));
    assert_eq!(
        reused_diagnostic.dependency_status(),
        FunctionComponentMemoDependencyStatus::Unchanged
    );
    assert!(reused_diagnostic.reused_previous_value());
    assert!(!reused_diagnostic.recomputed_value());
    assert_eq!(
        opaque_value(
            hook_store
                .hook_lists()
                .hook(reused_update.hook())
                .unwrap()
                .payload()
        ),
        StateHandle::from_raw(901)
    );
    assert_eq!(registry.calls().len(), 2);
    assert_eq!(
        registry.calls()[0].hook_state(),
        Some(changed_render.hook_state())
    );
    assert_eq!(
        registry.calls()[1].hook_state(),
        Some(reused_render.hook_state())
    );
}

#[test]
fn private_use_memo_update_diagnostics_count_reuse_and_recompute() {
    let (arena, current, work_in_progress, _component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let first_current = hook_store
        .create_current_memo_hook(current, StateHandle::from_raw(702), deps(7020))
        .unwrap();
    let second_current = hook_store
        .create_current_memo_hook(current, StateHandle::from_raw(703), deps(7030))
        .unwrap();
    let state = hook_store
        .prepare_render_state(&arena, work_in_progress)
        .unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();

    let first_update = hook_store
        .update_memo_hook(&mut cursor, StateHandle::from_raw(712), deps(7020))
        .unwrap();
    let second_update = hook_store
        .update_memo_hook(&mut cursor, StateHandle::from_raw(713), deps(7130))
        .unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();

    assert_eq!(finished.traversal().traversed_count(), 2);
    assert_eq!(first_update.previous_hook(), first_current.hook());
    assert_eq!(second_update.previous_hook(), second_current.hook());
    let first_diagnostic = hook_store
        .record_memo_update_diagnostic(state, Lanes::DEFAULT, first_update)
        .unwrap();
    let second_diagnostic = hook_store
        .record_memo_update_diagnostic(state, Lanes::SYNC, second_update)
        .unwrap();
    let queue = hook_store.memo_update_diagnostics(state).unwrap().unwrap();

    assert_eq!(first_diagnostic.diagnostic_index(), 0);
    assert_eq!(second_diagnostic.diagnostic_index(), 1);
    assert_eq!(queue.len(), 2);
    assert_eq!(queue.reuse_count(), 1);
    assert_eq!(queue.recompute_count(), 1);
    assert!(first_diagnostic.reused_previous_value());
    assert!(!first_diagnostic.recomputed_value());
    assert!(!second_diagnostic.reused_previous_value());
    assert!(second_diagnostic.recomputed_value());
    assert_eq!(second_diagnostic.render_lanes(), Lanes::SYNC);
    assert_eq!(queue.records(), &[first_diagnostic, second_diagnostic]);
}

#[test]
fn private_use_memo_ref_render_path_reuses_memo_value_when_deps_match() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_memo = hook_store
        .create_current_memo_hook(current, StateHandle::from_raw(730), deps(7300))
        .unwrap();
    let current_ref = hook_store
        .create_current_ref_hook(current, StateHandle::from_raw(740))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(76)));
    let memo_request =
        FunctionComponentUseMemoRenderRequest::new(StateHandle::from_raw(731), deps(7300));
    let ref_request = FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(741));

    let record = render_function_component_with_use_memo_and_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        memo_request,
        ref_request,
        &mut registry,
    )
    .unwrap();

    let memo_update = record.memo_hook().update_record().unwrap();
    let memo_diagnostic = record.memo_update_diagnostic().unwrap();
    let ref_update = record.ref_hook().update_record().unwrap();
    assert_eq!(
        record.hook_state().phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(record.hook_traversal().traversed_count(), 2);
    assert_ne!(memo_update.hook(), current_memo.hook());
    assert_eq!(memo_update.previous_value(), StateHandle::from_raw(730));
    assert_eq!(memo_update.previous_dependencies(), deps(7300));
    assert_eq!(memo_update.requested_value(), StateHandle::from_raw(731));
    assert_eq!(memo_update.value(), StateHandle::from_raw(730));
    assert_eq!(memo_update.dependencies(), deps(7300));
    assert_eq!(
        memo_update.dependency_status(),
        FunctionComponentMemoDependencyStatus::Unchanged
    );
    assert!(memo_update.reused_previous_value());
    assert_eq!(record.memo_hook().value(), StateHandle::from_raw(730));
    assert_eq!(memo_diagnostic.previous_hook(), current_memo.hook());
    assert_eq!(memo_diagnostic.hook(), memo_update.hook());
    assert_eq!(
        memo_diagnostic.hook_list(),
        record.hook_state().work_in_progress_list()
    );
    assert_eq!(memo_diagnostic.render_lanes(), Lanes::DEFAULT);
    assert_eq!(
        memo_diagnostic.dependency_status(),
        FunctionComponentMemoDependencyStatus::Unchanged
    );
    assert!(memo_diagnostic.reused_previous_value());
    assert!(!memo_diagnostic.recomputed_value());

    assert_ne!(ref_update.hook(), current_ref.hook());
    assert_eq!(ref_update.ref_object(), current_ref.ref_object());
    assert_eq!(ref_update.initial_value(), StateHandle::from_raw(740));
    assert_eq!(
        ref_update.ignored_initial_value(),
        StateHandle::from_raw(741)
    );
    assert_eq!(record.ref_hook().ref_object(), current_ref.ref_object());

    let hooks = hook_store
        .hook_lists()
        .ordered_hooks(record.hook_state().work_in_progress_list())
        .unwrap();
    assert_eq!(hooks, vec![memo_update.hook(), ref_update.hook()]);
    assert_eq!(
        opaque_value(
            hook_store
                .hook_lists()
                .hook(memo_update.hook())
                .unwrap()
                .payload()
        ),
        StateHandle::from_raw(730)
    );
    assert_eq!(
        opaque_value(
            hook_store
                .hook_lists()
                .hook(ref_update.hook())
                .unwrap()
                .payload()
        ),
        StateHandle::from_raw(current_ref.ref_object().raw())
    );
    assert_eq!(
        opaque_value(
            hook_store
                .hook_lists()
                .hook(current_memo.hook())
                .unwrap()
                .payload()
        ),
        StateHandle::from_raw(730)
    );
}

#[test]
fn private_use_memo_ref_render_path_records_changed_memo_dependencies() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    hook_store
        .create_current_memo_hook(current, StateHandle::from_raw(750), deps(7500))
        .unwrap();
    let current_ref = hook_store
        .create_current_ref_hook(current, StateHandle::from_raw(760))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(77)));
    let memo_request =
        FunctionComponentUseMemoRenderRequest::new(StateHandle::from_raw(751), deps(7510));
    let ref_request = FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(761));

    let record = render_function_component_with_use_memo_and_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        memo_request,
        ref_request,
        &mut registry,
    )
    .unwrap();

    let memo_update = record.memo_hook().update_record().unwrap();
    let memo_diagnostic = record.memo_update_diagnostic().unwrap();
    let ref_update = record.ref_hook().update_record().unwrap();
    assert_eq!(memo_update.previous_value(), StateHandle::from_raw(750));
    assert_eq!(memo_update.previous_dependencies(), deps(7500));
    assert_eq!(memo_update.requested_value(), StateHandle::from_raw(751));
    assert_eq!(memo_update.value(), StateHandle::from_raw(751));
    assert_eq!(memo_update.dependencies(), deps(7510));
    assert_eq!(
        memo_update.dependency_status(),
        FunctionComponentMemoDependencyStatus::Changed
    );
    assert!(!memo_update.reused_previous_value());
    assert_eq!(record.memo_hook().value(), StateHandle::from_raw(751));
    assert_eq!(memo_diagnostic.previous_hook(), memo_update.previous_hook());
    assert_eq!(memo_diagnostic.hook(), memo_update.hook());
    assert_eq!(
        memo_diagnostic.dependency_status(),
        FunctionComponentMemoDependencyStatus::Changed
    );
    assert!(!memo_diagnostic.reused_previous_value());
    assert!(memo_diagnostic.recomputed_value());
    assert_eq!(ref_update.ref_object(), current_ref.ref_object());
    assert_eq!(
        ref_update.ignored_initial_value(),
        StateHandle::from_raw(761)
    );
    assert_eq!(
        opaque_value(
            hook_store
                .hook_lists()
                .hook(memo_update.hook())
                .unwrap()
                .payload()
        ),
        StateHandle::from_raw(751)
    );
}

#[test]
fn private_use_memo_update_treats_missing_dependencies_as_always_changed() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    hook_store
        .create_current_memo_hook(current, StateHandle::from_raw(770), deps(7700))
        .unwrap();
    hook_store
        .create_current_ref_hook(current, StateHandle::from_raw(780))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(78)));
    let memo_request = FunctionComponentUseMemoRenderRequest::new(
        StateHandle::from_raw(771),
        HookEffectDependencies::AlwaysRun,
    );
    let ref_request = FunctionComponentUseRefRenderRequest::new(StateHandle::from_raw(781));

    let record = render_function_component_with_use_memo_and_ref(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        memo_request,
        ref_request,
        &mut registry,
    )
    .unwrap();

    let memo_update = record.memo_hook().update_record().unwrap();
    assert_eq!(
        memo_update.dependency_status(),
        FunctionComponentMemoDependencyStatus::Changed
    );
    assert_eq!(memo_update.value(), StateHandle::from_raw(771));
    assert_eq!(
        memo_update.dependencies(),
        HookEffectDependencies::AlwaysRun
    );
    assert!(memo_update.dependencies().is_always_run());
}

#[test]
fn private_use_callback_render_path_mounts_callback_with_memo_payload() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let output = FunctionComponentOutputHandle::from_raw(82);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let callback_request =
        FunctionComponentUseCallbackRenderRequest::new(component_callback(810), deps(8100));

    let record = render_function_component_with_use_callback(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        callback_request,
        &mut registry,
    )
    .unwrap();

    let hook_state = record.hook_state();
    let callback_hook = record.callback_hook();
    let callback_mount = callback_hook.mount_record().unwrap();
    assert_eq!(record.current(), Some(current));
    assert_eq!(record.work_in_progress(), work_in_progress);
    assert_eq!(record.output(), output);
    assert_eq!(record.render().hook_state(), Some(hook_state));
    assert_eq!(record.callback_update_diagnostic(), None);
    assert_eq!(hook_state.phase(), FunctionComponentHookRenderPhase::Mount);
    assert_eq!(record.hook_traversal().traversed_count(), 1);
    assert_eq!(
        callback_hook.phase(),
        FunctionComponentHookRenderPhase::Mount
    );
    assert_eq!(callback_hook.callback(), component_callback(810));
    assert_eq!(callback_hook.dependencies(), deps(8100));
    assert_eq!(callback_hook.hook(), callback_mount.hook());
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.calls()[0].hook_state(), Some(hook_state));

    let hooks = hook_store
        .hook_lists()
        .ordered_hooks(hook_state.work_in_progress_list())
        .unwrap();
    assert_eq!(hooks, vec![callback_mount.hook()]);
    assert_eq!(
        opaque_value(
            hook_store
                .hook_lists()
                .hook(callback_mount.hook())
                .unwrap()
                .payload()
        ),
        StateHandle::from_raw(810)
    );
}

#[test]
fn private_use_callback_render_path_reuses_callback_when_deps_match() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_callback = hook_store
        .create_current_callback_hook(current, component_callback(830), deps(8300))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(83)));
    let callback_request =
        FunctionComponentUseCallbackRenderRequest::new(component_callback(831), deps(8300));

    let record = render_function_component_with_use_callback(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        callback_request,
        &mut registry,
    )
    .unwrap();

    let callback_update = record.callback_hook().update_record().unwrap();
    let diagnostic = record.callback_update_diagnostic().unwrap();
    assert_eq!(
        record.hook_state().phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(record.hook_traversal().traversed_count(), 1);
    assert_ne!(callback_update.hook(), current_callback.hook());
    assert_eq!(callback_update.previous_hook(), current_callback.hook());
    assert_eq!(callback_update.previous_callback(), component_callback(830));
    assert_eq!(callback_update.previous_dependencies(), deps(8300));
    assert_eq!(
        callback_update.requested_callback(),
        component_callback(831)
    );
    assert_eq!(callback_update.callback(), component_callback(830));
    assert_eq!(callback_update.dependencies(), deps(8300));
    assert_eq!(
        callback_update.dependency_status(),
        FunctionComponentMemoDependencyStatus::Unchanged
    );
    assert!(callback_update.reused_previous_callback());
    assert!(!callback_update.replaced_callback());
    assert_eq!(record.callback_hook().callback(), component_callback(830));
    assert_eq!(diagnostic.diagnostic_index(), 0);
    assert_eq!(diagnostic.fiber(), work_in_progress);
    assert_eq!(diagnostic.current(), current);
    assert_eq!(
        diagnostic.current_hook_list(),
        record.hook_state().current_list().unwrap()
    );
    assert_eq!(
        diagnostic.hook_list(),
        record.hook_state().work_in_progress_list()
    );
    assert_eq!(diagnostic.previous_hook(), current_callback.hook());
    assert_eq!(diagnostic.hook(), callback_update.hook());
    assert_eq!(diagnostic.render_lanes(), Lanes::DEFAULT);
    assert_eq!(diagnostic.previous_callback(), component_callback(830));
    assert_eq!(diagnostic.previous_dependencies(), deps(8300));
    assert_eq!(diagnostic.requested_callback(), component_callback(831));
    assert_eq!(diagnostic.callback(), component_callback(830));
    assert_eq!(diagnostic.dependencies(), deps(8300));
    assert_eq!(
        diagnostic.dependency_status(),
        FunctionComponentMemoDependencyStatus::Unchanged
    );
    assert!(diagnostic.reused_previous_callback());
    assert!(!diagnostic.replaced_callback());
    let queue = hook_store
        .callback_update_diagnostics(record.hook_state())
        .unwrap()
        .unwrap();
    assert_eq!(
        queue.hook_list(),
        record.hook_state().work_in_progress_list()
    );
    assert_eq!(queue.len(), 1);
    assert_eq!(queue.reuse_count(), 1);
    assert_eq!(queue.replacement_count(), 0);
    assert_eq!(queue.records(), &[diagnostic]);
    assert_eq!(
        opaque_value(
            hook_store
                .hook_lists()
                .hook(callback_update.hook())
                .unwrap()
                .payload()
        ),
        StateHandle::from_raw(830)
    );
}

#[test]
fn private_use_callback_reuses_replaced_callback_across_update_renders_when_deps_match() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_callback = hook_store
        .create_current_callback_hook(current, component_callback(910), deps(9100))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(95)));

    let replaced_render = render_function_component_with_use_callback(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseCallbackRenderRequest::new(component_callback(911), deps(9110)),
        &mut registry,
    )
    .unwrap();

    let replaced_update = replaced_render.callback_hook().update_record().unwrap();
    let replaced_diagnostic = replaced_render.callback_update_diagnostic().unwrap();
    assert_eq!(replaced_update.previous_hook(), current_callback.hook());
    assert_eq!(
        replaced_update.dependency_status(),
        FunctionComponentMemoDependencyStatus::Changed
    );
    assert_eq!(replaced_update.previous_callback(), component_callback(910));
    assert_eq!(
        replaced_update.requested_callback(),
        component_callback(911)
    );
    assert_eq!(replaced_update.callback(), component_callback(911));
    assert_eq!(replaced_update.dependencies(), deps(9110));
    assert!(replaced_diagnostic.replaced_callback());
    assert_eq!(replaced_diagnostic.callback(), component_callback(911));
    assert_eq!(
        replaced_render.hook_state().phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(replaced_render.hook_traversal().traversed_count(), 1);
    hook_store.bind_current_list_unchecked(
        current,
        replaced_render.hook_state().work_in_progress_list(),
    );

    let reused_render = render_function_component_with_use_callback(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::SYNC,
        FunctionComponentUseCallbackRenderRequest::new(component_callback(912), deps(9110)),
        &mut registry,
    )
    .unwrap();

    let reused_update = reused_render.callback_hook().update_record().unwrap();
    let reused_diagnostic = reused_render.callback_update_diagnostic().unwrap();
    assert_eq!(reused_update.previous_hook(), replaced_update.hook());
    assert_eq!(reused_update.previous_callback(), component_callback(911));
    assert_eq!(reused_update.previous_dependencies(), deps(9110));
    assert_eq!(reused_update.requested_callback(), component_callback(912));
    assert_eq!(reused_update.callback(), component_callback(911));
    assert_eq!(reused_update.dependencies(), deps(9110));
    assert_eq!(
        reused_update.dependency_status(),
        FunctionComponentMemoDependencyStatus::Unchanged
    );
    assert!(reused_update.reused_previous_callback());
    assert_eq!(
        reused_render.callback_hook().callback(),
        component_callback(911)
    );
    assert_eq!(
        reused_diagnostic.current_hook_list(),
        replaced_render.hook_state().work_in_progress_list()
    );
    assert_eq!(reused_diagnostic.previous_hook(), replaced_update.hook());
    assert_eq!(reused_diagnostic.hook(), reused_update.hook());
    assert_eq!(reused_diagnostic.render_lanes(), Lanes::SYNC);
    assert_eq!(
        reused_diagnostic.previous_callback(),
        component_callback(911)
    );
    assert_eq!(
        reused_diagnostic.requested_callback(),
        component_callback(912)
    );
    assert_eq!(reused_diagnostic.callback(), component_callback(911));
    assert_eq!(
        reused_diagnostic.dependency_status(),
        FunctionComponentMemoDependencyStatus::Unchanged
    );
    assert!(reused_diagnostic.reused_previous_callback());
    assert!(!reused_diagnostic.replaced_callback());
    assert_eq!(
        opaque_value(
            hook_store
                .hook_lists()
                .hook(reused_update.hook())
                .unwrap()
                .payload()
        ),
        StateHandle::from_raw(911)
    );
    assert_eq!(registry.calls().len(), 2);
    assert_eq!(
        registry.calls()[0].hook_state(),
        Some(replaced_render.hook_state())
    );
    assert_eq!(
        registry.calls()[1].hook_state(),
        Some(reused_render.hook_state())
    );
}

#[test]
fn private_use_callback_render_path_records_changed_dependencies() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_callback = hook_store
        .create_current_callback_hook(current, component_callback(850), deps(8500))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(84)));
    let callback_request =
        FunctionComponentUseCallbackRenderRequest::new(component_callback(851), deps(8510));

    let record = render_function_component_with_use_callback(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        callback_request,
        &mut registry,
    )
    .unwrap();

    let callback_update = record.callback_hook().update_record().unwrap();
    let diagnostic = record.callback_update_diagnostic().unwrap();
    assert_eq!(callback_update.previous_hook(), current_callback.hook());
    assert_eq!(callback_update.previous_callback(), component_callback(850));
    assert_eq!(callback_update.previous_dependencies(), deps(8500));
    assert_eq!(
        callback_update.requested_callback(),
        component_callback(851)
    );
    assert_eq!(callback_update.callback(), component_callback(851));
    assert_eq!(callback_update.dependencies(), deps(8510));
    assert_eq!(
        callback_update.dependency_status(),
        FunctionComponentMemoDependencyStatus::Changed
    );
    assert!(!callback_update.reused_previous_callback());
    assert!(callback_update.replaced_callback());
    assert_eq!(record.callback_hook().callback(), component_callback(851));
    assert_eq!(diagnostic.previous_hook(), current_callback.hook());
    assert_eq!(diagnostic.hook(), callback_update.hook());
    assert_eq!(
        diagnostic.dependency_status(),
        FunctionComponentMemoDependencyStatus::Changed
    );
    assert!(!diagnostic.reused_previous_callback());
    assert!(diagnostic.replaced_callback());
    assert_eq!(diagnostic.previous_callback(), component_callback(850));
    assert_eq!(diagnostic.requested_callback(), component_callback(851));
    assert_eq!(diagnostic.callback(), component_callback(851));
    assert_eq!(diagnostic.dependencies(), deps(8510));
    assert_eq!(
        opaque_value(
            hook_store
                .hook_lists()
                .hook(callback_update.hook())
                .unwrap()
                .payload()
        ),
        StateHandle::from_raw(851)
    );
}

#[test]
fn private_use_callback_update_diagnostics_count_reuse_and_replacement() {
    let (arena, current, work_in_progress, _component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let first_current = hook_store
        .create_current_callback_hook(current, component_callback(880), deps(8800))
        .unwrap();
    let second_current = hook_store
        .create_current_callback_hook(current, component_callback(881), deps(8810))
        .unwrap();
    let state = hook_store
        .prepare_render_state(&arena, work_in_progress)
        .unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();

    let first_update = hook_store
        .update_callback_hook(&mut cursor, component_callback(890), deps(8800))
        .unwrap();
    let second_update = hook_store
        .update_callback_hook(&mut cursor, component_callback(891), deps(8910))
        .unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();

    assert_eq!(finished.traversal().traversed_count(), 2);
    assert_eq!(first_update.previous_hook(), first_current.hook());
    assert_eq!(second_update.previous_hook(), second_current.hook());
    let first_diagnostic = hook_store
        .record_callback_update_diagnostic(state, Lanes::DEFAULT, first_update)
        .unwrap();
    let second_diagnostic = hook_store
        .record_callback_update_diagnostic(state, Lanes::SYNC, second_update)
        .unwrap();
    let queue = hook_store
        .callback_update_diagnostics(state)
        .unwrap()
        .unwrap();

    assert_eq!(first_diagnostic.diagnostic_index(), 0);
    assert_eq!(second_diagnostic.diagnostic_index(), 1);
    assert_eq!(queue.len(), 2);
    assert_eq!(queue.reuse_count(), 1);
    assert_eq!(queue.replacement_count(), 1);
    assert!(first_diagnostic.reused_previous_callback());
    assert!(!first_diagnostic.replaced_callback());
    assert!(!second_diagnostic.reused_previous_callback());
    assert!(second_diagnostic.replaced_callback());
    assert_eq!(second_diagnostic.render_lanes(), Lanes::SYNC);
    assert_eq!(queue.records(), &[first_diagnostic, second_diagnostic]);
}

#[test]
fn private_use_callback_update_treats_missing_dependencies_as_always_changed() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    hook_store
        .create_current_callback_hook(current, component_callback(870), deps(8700))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(85)));
    let callback_request = FunctionComponentUseCallbackRenderRequest::new(
        component_callback(871),
        HookEffectDependencies::AlwaysRun,
    );

    let record = render_function_component_with_use_callback(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        callback_request,
        &mut registry,
    )
    .unwrap();

    let callback_update = record.callback_hook().update_record().unwrap();
    let diagnostic = record.callback_update_diagnostic().unwrap();
    assert_eq!(
        callback_update.dependency_status(),
        FunctionComponentMemoDependencyStatus::Changed
    );
    assert_eq!(callback_update.callback(), component_callback(871));
    assert_eq!(
        callback_update.dependencies(),
        HookEffectDependencies::AlwaysRun
    );
    assert!(callback_update.dependencies().is_always_run());
    assert!(diagnostic.replaced_callback());
    assert_eq!(diagnostic.callback(), component_callback(871));
}

#[test]
fn private_use_effect_render_path_mount_records_passive_metadata_without_execution() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let output = FunctionComponentOutputHandle::from_raw(86);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let effect_request = FunctionComponentUseEffectRenderRequest::new(callback(1100), deps(1101));

    let record = render_function_component_with_use_effect(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        effect_request,
        &mut registry,
    )
    .unwrap();

    let hook_state = record.hook_state();
    let effect_hook = record.effect_hook();
    let mount = effect_hook.mount_record().unwrap();
    assert_eq!(record.current(), Some(current));
    assert_eq!(record.work_in_progress(), work_in_progress);
    assert_eq!(record.output(), output);
    assert_eq!(record.render().hook_state(), Some(hook_state));
    assert_eq!(hook_state.phase(), FunctionComponentHookRenderPhase::Mount);
    assert_eq!(record.hook_traversal().traversed_count(), 1);
    assert_eq!(
        effect_hook.render_phase(),
        FunctionComponentHookRenderPhase::Mount
    );
    assert_eq!(
        effect_hook.effect_phase(),
        FunctionComponentEffectPhase::Passive
    );
    assert_eq!(effect_hook.hook(), mount.hook());
    assert_eq!(effect_hook.effect(), mount.effect());
    assert_eq!(effect_hook.instance(), mount.instance());
    assert_eq!(effect_hook.tag(), HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(effect_hook.create(), callback(1100));
    assert_eq!(effect_hook.dependencies(), deps(1101));
    assert_eq!(effect_hook.previous_dependencies(), None);
    assert_eq!(effect_hook.dependency_status(), None);
    assert!(effect_hook.accepted_for_pending_passive());
    assert_eq!(mount.phase(), FunctionComponentEffectPhase::Passive);
    assert_eq!(
        mount.fiber_flags(),
        FiberFlags::PASSIVE | FiberFlags::PASSIVE_STATIC
    );
    assert_eq!(
        arena.get(work_in_progress).unwrap().flags(),
        FiberFlags::PASSIVE | FiberFlags::PASSIVE_STATIC
    );

    let passive = record.passive_effects();
    assert_eq!(passive.len(), 1);
    assert_eq!(passive[0].fiber(), work_in_progress);
    assert_eq!(
        passive[0].render_phase(),
        FunctionComponentHookRenderPhase::Mount
    );
    assert_eq!(passive[0].hook_list(), hook_state.work_in_progress_list());
    assert_eq!(passive[0].effect_index(), 0);
    assert_eq!(passive[0].effect(), mount.effect());
    assert_eq!(passive[0].instance(), mount.instance());
    assert_eq!(passive[0].tag(), HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(passive[0].create(), callback(1100));
    assert_eq!(passive[0].destroy(), None);
    assert_eq!(passive[0].dependencies(), deps(1101));
    assert_eq!(passive[0].lanes(), Lanes::DEFAULT);
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(mount.instance())
            .unwrap()
            .destroy(),
        None
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.calls()[0].hook_state(), Some(hook_state));
}

#[test]
fn private_use_effect_render_path_update_changed_deps_records_passive_phase_metadata() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            &mut arena,
            current,
            FunctionComponentEffectPhase::Passive,
            callback(1120),
            deps(1121),
            Some(callback(1122)),
        )
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(87)));
    let effect_request = FunctionComponentUseEffectRenderRequest::new(callback(1123), deps(1124));

    let record = render_function_component_with_use_effect(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        effect_request,
        &mut registry,
    )
    .unwrap();

    let hook_state = record.hook_state();
    let effect_hook = record.effect_hook();
    let update = effect_hook.update_record().unwrap();
    assert_eq!(hook_state.phase(), FunctionComponentHookRenderPhase::Update);
    assert_eq!(
        effect_hook.render_phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(
        effect_hook.effect_phase(),
        FunctionComponentEffectPhase::Passive
    );
    assert_eq!(effect_hook.hook(), update.hook());
    assert_eq!(effect_hook.previous_dependencies(), Some(deps(1121)));
    assert_eq!(
        effect_hook.dependency_status(),
        Some(FunctionComponentEffectDependencyStatus::Changed)
    );
    assert_eq!(update.previous_effect(), previous.effect());
    assert_eq!(update.instance(), previous.instance());
    assert_eq!(update.phase(), FunctionComponentEffectPhase::Passive);
    assert_eq!(update.tag(), HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(update.create(), callback(1123));
    assert_eq!(update.destroy(), Some(callback(1122)));
    assert_eq!(update.previous_dependencies(), deps(1121));
    assert_eq!(update.dependencies(), deps(1124));
    assert!(update.dependencies_changed());
    assert!(update.accepted_for_pending_passive());
    assert_eq!(
        arena.get(work_in_progress).unwrap().flags(),
        FiberFlags::PASSIVE
    );

    let passive = record.passive_effects();
    assert_eq!(passive.len(), 1);
    assert_eq!(passive[0].fiber(), work_in_progress);
    assert_eq!(
        passive[0].render_phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(passive[0].hook_list(), hook_state.work_in_progress_list());
    assert_eq!(passive[0].effect_index(), 0);
    assert_eq!(passive[0].effect(), update.effect());
    assert_eq!(passive[0].instance(), previous.instance());
    assert_eq!(passive[0].tag(), HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(passive[0].create(), callback(1123));
    assert_eq!(passive[0].destroy(), Some(callback(1122)));
    assert_eq!(passive[0].dependencies(), deps(1124));
    assert_eq!(passive[0].lanes(), Lanes::DEFAULT);
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(previous.instance())
            .unwrap()
            .destroy(),
        Some(callback(1122))
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.calls()[0].hook_state(), Some(hook_state));
}

#[test]
fn private_use_effect_render_path_update_equal_deps_records_passive_phase_without_handoff() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            &mut arena,
            current,
            FunctionComponentEffectPhase::Passive,
            callback(1130),
            deps(1131),
            Some(callback(1132)),
        )
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(88)));
    let effect_request = FunctionComponentUseEffectRenderRequest::new(callback(1133), deps(1131));

    let record = render_function_component_with_use_effect(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        effect_request,
        &mut registry,
    )
    .unwrap();

    let hook_state = record.hook_state();
    let effect_hook = record.effect_hook();
    let update = effect_hook.update_record().unwrap();
    assert_eq!(hook_state.phase(), FunctionComponentHookRenderPhase::Update);
    assert_eq!(
        effect_hook.render_phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(
        effect_hook.effect_phase(),
        FunctionComponentEffectPhase::Passive
    );
    assert_eq!(effect_hook.previous_dependencies(), Some(deps(1131)));
    assert_eq!(
        effect_hook.dependency_status(),
        Some(FunctionComponentEffectDependencyStatus::Unchanged)
    );
    assert_eq!(update.previous_effect(), previous.effect());
    assert_eq!(update.instance(), previous.instance());
    assert_eq!(update.phase(), FunctionComponentEffectPhase::Passive);
    assert_eq!(update.tag(), HookEffectFlags::PASSIVE);
    assert_eq!(update.create(), callback(1133));
    assert_eq!(update.destroy(), Some(callback(1132)));
    assert_eq!(update.previous_dependencies(), deps(1131));
    assert_eq!(update.dependencies(), deps(1131));
    assert!(!update.dependencies_changed());
    assert!(update.dependencies_unchanged());
    assert!(!update.accepted_for_pending_passive());
    assert_eq!(arena.get(work_in_progress).unwrap().flags(), FiberFlags::NO);
    assert!(record.passive_effects().is_empty());

    let queue = hook_store.effect_update_queue(hook_state).unwrap().unwrap();
    assert_eq!(queue.len(), 1);
    assert_eq!(queue.changed_dependency_count(), 0);
    assert_eq!(queue.unchanged_dependency_count(), 1);
    assert_eq!(queue.accepted_passive_count(), 0);
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(previous.instance())
            .unwrap()
            .destroy(),
        Some(callback(1132))
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.calls()[0].hook_state(), Some(hook_state));
}

#[test]
fn private_use_memo_callback_and_ref_updates_require_matching_hook_metadata() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_list = hook_store.create_current_list(current);
    let opaque_hook = hook_store
        .hook_lists_mut()
        .append_hook(current_list, opaque(790))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(79)));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let mut cursor = hook_store
        .begin_render_cursor(record.hook_state().unwrap())
        .unwrap();

    assert_eq!(
        hook_store.update_memo_hook(&mut cursor, StateHandle::from_raw(791), deps(7910)),
        Err(FunctionComponentRenderError::MissingMemoHookRecord {
            fiber: work_in_progress,
            hook: opaque_hook,
        })
    );
    assert_eq!(
        hook_store.update_callback_hook(&mut cursor, component_callback(793), deps(7930)),
        Err(FunctionComponentRenderError::MissingMemoHookRecord {
            fiber: work_in_progress,
            hook: opaque_hook,
        })
    );
    assert_eq!(
        hook_store.update_ref_hook(&mut cursor, StateHandle::from_raw(792)),
        Err(FunctionComponentRenderError::MissingRefHookRecord {
            fiber: work_in_progress,
            hook: opaque_hook,
        })
    );
}

#[test]
fn private_use_state_dispatch_records_validates_and_rebases_eager_metadata() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(440))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let revert_lane = HookRevertLane::from_lane(Lane::TRANSITION_1);
    let eager_state = FunctionComponentStateDispatchEagerState::new(
        StateHandle::from_raw(440),
        StateHandle::from_raw(441),
    );
    let queued = hook_store
        .dispatch_state_update(
            FunctionComponentStateDispatchRequest::new(current_state.dispatch(), action(442), lane)
                .with_revert_lane(revert_lane)
                .with_eager_state(eager_state),
        )
        .unwrap();

    assert_eq!(queued.fiber(), current);
    assert_eq!(queued.queue(), current_state.queue());
    assert_eq!(queued.dispatch(), current_state.dispatch());
    assert_eq!(queued.lane(), lane);
    assert_eq!(queued.revert_lane(), revert_lane);
    assert_eq!(queued.action(), action(442));
    assert_eq!(queued.eager_state(), Some(eager_state));
    assert!(queued.has_eager_state());
    assert_eq!(arena.get(current).unwrap().lanes(), Lanes::NO);
    assert_eq!(arena.get(work_in_progress).unwrap().lanes(), Lanes::NO);
    let update = hook_store.state_queues().update(queued.update()).unwrap();
    assert_eq!(update.lane(), lane);
    assert_eq!(update.revert_lane(), revert_lane);
    assert_eq!(*update.action(), action(442));
    assert_eq!(
        update.eager_state().copied(),
        Some(StateHandle::from_raw(441))
    );

    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(69)));
    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::SYNC,
        &mut registry,
    )
    .unwrap();
    let mut cursor = hook_store
        .begin_render_cursor(render.hook_state().unwrap())
        .unwrap();
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::SYNC, Lanes::SYNC);
    let update_render = hook_store
        .update_state_hook_with_queued_updates(&mut cursor, lanes, action_as_state)
        .unwrap();

    assert_eq!(update_render.memoized_state(), StateHandle::from_raw(440));
    assert_eq!(update_render.base_state(), StateHandle::from_raw(440));
    assert_eq!(update_render.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(update_render.applied_update_count(), 0);
    assert_eq!(update_render.skipped_update_count(), 1);
    assert_eq!(update_render.eager_update_count(), 0);
    let rebased = hook_store
        .state_queues()
        .update_ring(update_render.base_queue())
        .unwrap();
    assert_eq!(rebased.len(), 1);
    let rebased_update = hook_store.state_queues().update(rebased[0]).unwrap();
    assert_eq!(rebased_update.lane().priority_lanes(), Lanes::DEFAULT);
    assert_eq!(rebased_update.revert_lane(), revert_lane);
    assert_eq!(*rebased_update.action(), action(442));
    assert_eq!(
        rebased_update.eager_state().copied(),
        Some(StateHandle::from_raw(441))
    );

    hook_store.finish_render_cursor(cursor).unwrap();
}

#[test]
fn private_use_state_dispatch_rejects_stale_eager_last_rendered_state() {
    let (_arena, current, _work_in_progress, _component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(450))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let stale_eager_state = FunctionComponentStateDispatchEagerState::new(
        StateHandle::from_raw(449),
        StateHandle::from_raw(451),
    );

    assert_eq!(
        hook_store.dispatch_state_update(
            FunctionComponentStateDispatchRequest::new(
                current_state.dispatch(),
                action(452),
                lane,
            )
            .with_eager_state(stale_eager_state),
        ),
        Err(
            FunctionComponentRenderError::StateDispatchEagerStateMismatch {
                fiber: current,
                queue: current_state.queue(),
                expected: StateHandle::from_raw(450),
                actual: StateHandle::from_raw(449),
            },
        )
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_state.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn private_use_state_update_render_rebases_skipped_lane_without_applying_action() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(420))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    hook_store
        .dispatch_state_update(FunctionComponentStateDispatchRequest::new(
            current_state.dispatch(),
            action(421),
            lane,
        ))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(67)));

    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::SYNC,
        &mut registry,
    )
    .unwrap();
    let mut cursor = hook_store
        .begin_render_cursor(render.hook_state().unwrap())
        .unwrap();
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::SYNC, Lanes::SYNC);
    let update_render = hook_store
        .update_state_hook_with_queued_updates(&mut cursor, lanes, action_as_state)
        .unwrap();

    assert_eq!(update_render.memoized_state(), StateHandle::from_raw(420));
    assert_eq!(update_render.resulting_state(), StateHandle::from_raw(420));
    assert_eq!(update_render.base_state(), StateHandle::from_raw(420));
    assert_eq!(update_render.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(update_render.applied_update_count(), 0);
    assert_eq!(update_render.skipped_update_count(), 1);
    assert_eq!(update_render.render_lanes(), Lanes::SYNC);
    assert_eq!(update_render.root_render_lanes(), Lanes::SYNC);
    let base_tail = update_render.base_queue().unwrap();
    let rebased = hook_store
        .state_queues()
        .update_ring(Some(base_tail))
        .unwrap();
    assert_eq!(rebased.len(), 1);
    assert_eq!(
        hook_store
            .state_queues()
            .update(rebased[0])
            .unwrap()
            .lane()
            .priority_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(
        *hook_store
            .state_queues()
            .update(rebased[0])
            .unwrap()
            .action(),
        action(421)
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_state.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
    let work_payload = hook_store
        .hook_lists()
        .hook(update_render.hook())
        .unwrap()
        .payload()
        .state_payload()
        .unwrap();
    assert_eq!(work_payload.memoized_state(), StateHandle::from_raw(420));
    assert_eq!(work_payload.base_state(), StateHandle::from_raw(420));
    assert_eq!(work_payload.base_queue(), Some(base_tail));

    hook_store.finish_render_cursor(cursor).unwrap();
}

#[test]
fn private_use_state_update_render_uses_root_lanes_for_hidden_updates() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(430))
        .unwrap();
    let hidden_lane = HookUpdateLane::hidden(Lane::DEFAULT).unwrap();
    hook_store
        .dispatch_state_update(FunctionComponentStateDispatchRequest::new(
            current_state.dispatch(),
            action(431),
            hidden_lane,
        ))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(68)));

    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let mut cursor = hook_store
        .begin_render_cursor(render.hook_state().unwrap())
        .unwrap();
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::NO);
    let update_render = hook_store
        .update_state_hook_with_queued_updates(&mut cursor, lanes, action_as_state)
        .unwrap();

    assert_eq!(update_render.memoized_state(), StateHandle::from_raw(430));
    assert_eq!(update_render.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(update_render.applied_update_count(), 0);
    assert_eq!(update_render.skipped_update_count(), 1);
    assert_eq!(update_render.render_lanes(), Lanes::DEFAULT);
    assert_eq!(update_render.root_render_lanes(), Lanes::NO);
    let rebased = hook_store
        .state_queues()
        .update_ring(update_render.base_queue())
        .unwrap();
    assert_eq!(rebased.len(), 1);
    assert_eq!(
        hook_store
            .state_queues()
            .update(rebased[0])
            .unwrap()
            .lane()
            .priority_lanes(),
        Lanes::DEFAULT
    );
    assert!(
        !hook_store
            .state_queues()
            .update(rebased[0])
            .unwrap()
            .lane()
            .is_hidden()
    );

    hook_store.finish_render_cursor(cursor).unwrap();
}

#[test]
fn private_use_reducer_mount_records_queue_reducer_dispatch_and_pending_update() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = reducer(700);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(69)));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();

    let mut cursor = hook_store
        .begin_render_cursor(record.hook_state().unwrap())
        .unwrap();
    let reducer_record = hook_store
        .mount_reducer_hook(&mut cursor, reducer_id, StateHandle::from_raw(500))
        .unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();
    assert_eq!(finished.traversal().traversed_count(), 1);
    assert_eq!(reducer_record.reducer(), reducer_id);
    assert_eq!(reducer_record.memoized_state(), StateHandle::from_raw(500));
    assert_eq!(reducer_record.base_state(), StateHandle::from_raw(500));
    assert_eq!(reducer_record.base_queue(), None);
    assert!(reducer_record.dispatch().is_some());
    assert_eq!(FunctionComponentReducerHandle::NONE.raw(), 0);
    assert!(FunctionComponentReducerHandle::NONE.is_none());

    let queue = hook_store
        .state_queues()
        .queue(reducer_record.queue())
        .unwrap();
    assert_eq!(queue.dispatch().copied(), Some(reducer_record.dispatch()));
    assert_eq!(
        queue.last_rendered_reducer().copied(),
        Some(FunctionComponentStateReducerId::Reducer(reducer_id))
    );
    assert_eq!(*queue.last_rendered_state(), StateHandle::from_raw(500));

    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let dispatch_record = hook_store
        .dispatch_reducer_update(FunctionComponentReducerDispatchRequest::new(
            reducer_record.dispatch(),
            action(7),
            lane,
        ))
        .unwrap();

    assert_eq!(dispatch_record.fiber(), work_in_progress);
    assert_eq!(dispatch_record.queue(), reducer_record.queue());
    assert_eq!(dispatch_record.dispatch(), reducer_record.dispatch());
    assert_eq!(dispatch_record.reducer(), reducer_id);
    assert_eq!(dispatch_record.lane(), lane);
    assert_eq!(dispatch_record.revert_lane(), HookRevertLane::NO);
    assert_eq!(dispatch_record.action(), action(7));
    assert_eq!(dispatch_record.eager_state(), None);
    assert!(!dispatch_record.has_eager_state());
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(reducer_record.queue())
            .unwrap(),
        vec![dispatch_record.update()]
    );
}

#[test]
fn private_use_reducer_dispatch_queue_diagnostic_records_blocked_dispatch() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = reducer(708);
    let current_reducer = hook_store
        .create_current_reducer_hook(current, reducer_id, StateHandle::from_raw(80))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(74)));
    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let hook_state = render.hook_state().unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let revert_lane = HookRevertLane::from_lane(Lane::TRANSITION_1);
    let eager_state = FunctionComponentStateDispatchEagerState::new(
        StateHandle::from_raw(80),
        StateHandle::from_raw(88),
    );

    let first = hook_store
        .record_reducer_dispatch_queue_diagnostic(
            hook_state,
            render.render_lanes(),
            FunctionComponentReducerDispatchRequest::new(
                current_reducer.dispatch(),
                action(8),
                lane,
            )
            .with_revert_lane(revert_lane)
            .with_eager_state(eager_state),
        )
        .unwrap();
    let second = hook_store
        .record_reducer_dispatch_queue_diagnostic(
            hook_state,
            render.render_lanes(),
            FunctionComponentReducerDispatchRequest::new(
                current_reducer.dispatch(),
                action(9),
                HookUpdateLane::from_lane(Lane::SYNC).unwrap(),
            ),
        )
        .unwrap();

    assert_eq!(first.diagnostic_index(), 0);
    assert_eq!(first.fiber(), work_in_progress);
    assert_eq!(first.current(), Some(current));
    assert_eq!(first.hook_list(), hook_state.work_in_progress_list());
    assert_eq!(first.queue_owner(), current);
    assert_eq!(first.queue(), current_reducer.queue());
    assert_eq!(first.dispatch(), current_reducer.dispatch());
    assert_eq!(first.reducer(), reducer_id);
    assert_eq!(first.action(), action(8));
    assert_eq!(first.render_lanes(), Lanes::DEFAULT);
    assert_eq!(first.dispatch_lane(), lane);
    assert_eq!(first.revert_lane(), revert_lane);
    assert_eq!(first.eager_state(), Some(eager_state));
    assert_eq!(
        first.eager_state_blocker(),
        FunctionComponentReducerDispatchEagerStateBlocker::ReducerExecutionBlocked
    );
    assert!(first.eager_state_blocker().blocks_eager_state_computation());
    assert!(first.non_execution().keeps_dispatch_blocked());
    assert!(!first.non_execution().public_hook_execution());
    assert!(!first.executes_reducer());
    assert!(!first.enqueues_update());
    assert!(!first.non_execution().root_scheduled());
    assert!(!first.claims_public_hook_compatibility());

    assert_eq!(second.diagnostic_index(), 1);
    assert_eq!(second.action(), action(9));
    assert_eq!(
        second.eager_state_blocker(),
        FunctionComponentReducerDispatchEagerStateBlocker::NoEagerStateRequested
    );
    assert!(
        !second
            .eager_state_blocker()
            .blocks_eager_state_computation()
    );
    assert!(second.non_execution().keeps_dispatch_blocked());
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_reducer.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );

    let diagnostics = hook_store
        .reducer_dispatch_queue_diagnostics(hook_state)
        .unwrap()
        .unwrap();
    assert_eq!(diagnostics.hook_list(), hook_state.work_in_progress_list());
    assert_eq!(diagnostics.len(), 2);
    assert!(!diagnostics.is_empty());
    assert_eq!(diagnostics.eager_state_blocker_count(), 1);
    assert_eq!(diagnostics.non_executed_dispatch_count(), 2);
    assert_eq!(diagnostics.records(), &[first, second]);
    assert_eq!(
        hook_store
            .reducer_dispatch_queue_records(hook_state)
            .unwrap(),
        &[first, second]
    );
}

#[test]
fn private_use_reducer_dispatch_queue_diagnostic_rejects_outside_render_context() {
    let (mut arena, current, _work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_reducer = hook_store
        .create_current_reducer_hook(current, reducer(709), StateHandle::from_raw(90))
        .unwrap();
    let other_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(3),
        FiberMode::NO,
    );
    let other_component = FiberTypeHandle::from_raw(200);
    arena
        .get_mut(other_current)
        .unwrap()
        .set_fiber_type(other_component);
    let other_work_in_progress = arena
        .create_work_in_progress(other_current, PropsHandle::from_raw(4))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(75)));
    registry.register(
        other_component,
        Ok(FunctionComponentOutputHandle::from_raw(76)),
    );
    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        other_work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let hook_state = render.hook_state().unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    assert_eq!(
        hook_store.record_reducer_dispatch_queue_diagnostic(
            hook_state,
            render.render_lanes(),
            FunctionComponentReducerDispatchRequest::new(
                current_reducer.dispatch(),
                action(10),
                lane,
            ),
        ),
        Err(
            FunctionComponentRenderError::ReducerDispatchOutsideRenderContext {
                dispatch: current_reducer.dispatch(),
                fiber: current,
                render_fiber: other_work_in_progress,
                current: Some(other_current),
            },
        )
    );
    assert_eq!(
        hook_store
            .reducer_dispatch_queue_records(hook_state)
            .unwrap(),
        &[]
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_reducer.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn private_use_reducer_update_render_processes_queued_update_and_refreshes_reducer() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_reducer = reducer(701);
    let next_reducer = reducer(702);
    let current_reducer = hook_store
        .create_current_reducer_hook(current, previous_reducer, StateHandle::from_raw(10))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let queued = hook_store
        .dispatch_reducer_update(FunctionComponentReducerDispatchRequest::new(
            current_reducer.dispatch(),
            action(5),
            lane,
        ))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(70)));

    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let mut cursor = hook_store
        .begin_render_cursor(render.hook_state().unwrap())
        .unwrap();
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let update_render = hook_store
        .update_reducer_hook_with_queued_updates(
            &mut cursor,
            next_reducer,
            lanes,
            reducer_adds_action,
        )
        .unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();

    assert_eq!(finished.traversal().traversed_count(), 1);
    assert_eq!(queued.reducer(), previous_reducer);
    assert_eq!(update_render.fiber(), work_in_progress);
    assert_eq!(update_render.queue(), current_reducer.queue());
    assert_eq!(update_render.dispatch(), current_reducer.dispatch());
    assert_eq!(update_render.reducer(), next_reducer);
    assert_eq!(update_render.lanes(), lanes);
    assert_eq!(
        update_render.previous_memoized_state(),
        StateHandle::from_raw(10)
    );
    assert_eq!(
        update_render.previous_base_state(),
        StateHandle::from_raw(10)
    );
    assert_eq!(update_render.previous_base_queue(), None);
    assert_eq!(update_render.memoized_state(), StateHandle::from_raw(15));
    assert_eq!(update_render.resulting_state(), StateHandle::from_raw(15));
    assert_eq!(update_render.base_state(), StateHandle::from_raw(15));
    assert_eq!(update_render.base_queue(), None);
    assert_eq!(update_render.remaining_lanes(), Lanes::NO);
    assert_eq!(update_render.applied_update_count(), 1);
    assert_eq!(update_render.skipped_update_count(), 0);
    assert_eq!(update_render.reverted_update_count(), 0);
    assert_eq!(update_render.eager_update_count(), 0);

    let work_payload = hook_store
        .hook_lists()
        .hook(update_render.hook())
        .unwrap()
        .payload()
        .state_payload()
        .unwrap();
    assert_eq!(work_payload.memoized_state(), StateHandle::from_raw(15));
    assert_eq!(work_payload.base_state(), StateHandle::from_raw(15));
    assert_eq!(work_payload.base_queue(), None);
    let queue = hook_store
        .state_queues()
        .queue(current_reducer.queue())
        .unwrap();
    assert_eq!(
        queue.last_rendered_reducer().copied(),
        Some(FunctionComponentStateReducerId::Reducer(next_reducer))
    );
    assert_eq!(*queue.last_rendered_state(), StateHandle::from_raw(15));
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_reducer.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn private_use_reducer_render_execution_processes_update_and_invokes_component() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_reducer = reducer(713);
    let next_reducer = reducer(714);
    let current_reducer = hook_store
        .create_current_reducer_hook(current, previous_reducer, StateHandle::from_raw(40))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    hook_store
        .dispatch_reducer_update(FunctionComponentReducerDispatchRequest::new(
            current_reducer.dispatch(),
            action(6),
            lane,
        ))
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(830);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let record = render_function_component_with_use_reducer(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        FunctionComponentUseReducerRenderRequest::new(
            next_reducer,
            StateHandle::from_raw(999),
            lanes,
        ),
        &mut registry,
        reducer_adds_action,
    )
    .unwrap();

    assert_eq!(record.current(), Some(current));
    assert_eq!(record.work_in_progress(), work_in_progress);
    assert_eq!(record.output(), output);
    assert_eq!(
        record.hook_state().phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(record.hook_traversal().traversed_count(), 1);
    assert_eq!(
        record.reducer_hook().phase(),
        FunctionComponentHookRenderPhase::Update
    );
    let update = record.reducer_hook().update_record().unwrap();
    assert_eq!(update.reducer(), next_reducer);
    assert_eq!(update.previous_memoized_state(), StateHandle::from_raw(40));
    assert_eq!(update.memoized_state(), StateHandle::from_raw(46));
    assert_eq!(update.applied_update_count(), 1);
    assert_eq!(update.skipped_update_count(), 0);
    assert_eq!(update.remaining_lanes(), Lanes::NO);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_reducer.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
    assert_eq!(
        hook_store
            .state_queues()
            .queue(current_reducer.queue())
            .unwrap()
            .last_rendered_reducer()
            .copied(),
        Some(FunctionComponentStateReducerId::Reducer(next_reducer))
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.calls()[0].hook_state(), Some(record.hook_state()));
}

#[test]
fn private_use_reducer_update_render_rebases_skipped_lane_without_applying_action() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_reducer = reducer(703);
    let next_reducer = reducer(704);
    let current_reducer = hook_store
        .create_current_reducer_hook(current, previous_reducer, StateHandle::from_raw(20))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    hook_store
        .dispatch_reducer_update(FunctionComponentReducerDispatchRequest::new(
            current_reducer.dispatch(),
            action(6),
            lane,
        ))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(71)));

    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::SYNC,
        &mut registry,
    )
    .unwrap();
    let mut cursor = hook_store
        .begin_render_cursor(render.hook_state().unwrap())
        .unwrap();
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::SYNC, Lanes::SYNC);
    let update_render = hook_store
        .update_reducer_hook_with_queued_updates(&mut cursor, next_reducer, lanes, |_, _| {
            panic!("skipped reducer update should not be applied")
        })
        .unwrap();

    assert_eq!(update_render.reducer(), next_reducer);
    assert_eq!(update_render.memoized_state(), StateHandle::from_raw(20));
    assert_eq!(update_render.resulting_state(), StateHandle::from_raw(20));
    assert_eq!(update_render.base_state(), StateHandle::from_raw(20));
    assert_eq!(update_render.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(update_render.applied_update_count(), 0);
    assert_eq!(update_render.skipped_update_count(), 1);
    let base_tail = update_render.base_queue().unwrap();
    let rebased = hook_store
        .state_queues()
        .update_ring(Some(base_tail))
        .unwrap();
    assert_eq!(rebased.len(), 1);
    assert_eq!(
        hook_store
            .state_queues()
            .update(rebased[0])
            .unwrap()
            .lane()
            .priority_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(
        *hook_store
            .state_queues()
            .update(rebased[0])
            .unwrap()
            .action(),
        action(6)
    );
    assert_eq!(
        hook_store
            .state_queues()
            .queue(current_reducer.queue())
            .unwrap()
            .last_rendered_reducer()
            .copied(),
        Some(FunctionComponentStateReducerId::Reducer(next_reducer))
    );

    hook_store.finish_render_cursor(cursor).unwrap();
}

#[test]
fn private_use_reducer_dispatch_records_and_rebases_eager_metadata() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = reducer(705);
    let current_reducer = hook_store
        .create_current_reducer_hook(current, reducer_id, StateHandle::from_raw(50))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let revert_lane = HookRevertLane::from_lane(Lane::TRANSITION_1);
    let eager_state = FunctionComponentStateDispatchEagerState::new(
        StateHandle::from_raw(50),
        StateHandle::from_raw(57),
    );
    let queued = hook_store
        .dispatch_reducer_update(
            FunctionComponentReducerDispatchRequest::new(
                current_reducer.dispatch(),
                action(7),
                lane,
            )
            .with_revert_lane(revert_lane)
            .with_eager_state(eager_state),
        )
        .unwrap();

    assert_eq!(queued.fiber(), current);
    assert_eq!(queued.queue(), current_reducer.queue());
    assert_eq!(queued.dispatch(), current_reducer.dispatch());
    assert_eq!(queued.reducer(), reducer_id);
    assert_eq!(queued.lane(), lane);
    assert_eq!(queued.revert_lane(), revert_lane);
    assert_eq!(queued.action(), action(7));
    assert_eq!(queued.eager_state(), Some(eager_state));
    assert!(queued.has_eager_state());
    let update = hook_store.state_queues().update(queued.update()).unwrap();
    assert_eq!(update.lane(), lane);
    assert_eq!(update.revert_lane(), revert_lane);
    assert_eq!(*update.action(), action(7));
    assert_eq!(
        update.eager_state().copied(),
        Some(StateHandle::from_raw(57))
    );

    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(72)));
    let render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::SYNC,
        &mut registry,
    )
    .unwrap();
    let mut cursor = hook_store
        .begin_render_cursor(render.hook_state().unwrap())
        .unwrap();
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::SYNC, Lanes::SYNC);
    let update_render = hook_store
        .update_reducer_hook_with_queued_updates(&mut cursor, reducer_id, lanes, |_, _| {
            panic!("skipped eager reducer update should not be applied")
        })
        .unwrap();

    assert_eq!(update_render.memoized_state(), StateHandle::from_raw(50));
    assert_eq!(update_render.base_state(), StateHandle::from_raw(50));
    assert_eq!(update_render.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(update_render.applied_update_count(), 0);
    assert_eq!(update_render.skipped_update_count(), 1);
    assert_eq!(update_render.eager_update_count(), 0);
    let rebased = hook_store
        .state_queues()
        .update_ring(update_render.base_queue())
        .unwrap();
    assert_eq!(rebased.len(), 1);
    let rebased_update = hook_store.state_queues().update(rebased[0]).unwrap();
    assert_eq!(rebased_update.lane().priority_lanes(), Lanes::DEFAULT);
    assert_eq!(rebased_update.revert_lane(), revert_lane);
    assert_eq!(*rebased_update.action(), action(7));
    assert_eq!(
        rebased_update.eager_state().copied(),
        Some(StateHandle::from_raw(57))
    );

    hook_store.finish_render_cursor(cursor).unwrap();
}

#[test]
fn private_use_reducer_update_render_applies_rebased_eager_state_without_reducer_call() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = reducer(706);
    let current_reducer = hook_store
        .create_current_reducer_hook(current, reducer_id, StateHandle::from_raw(60))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let eager_state = FunctionComponentStateDispatchEagerState::new(
        StateHandle::from_raw(60),
        StateHandle::from_raw(67),
    );
    hook_store
        .dispatch_reducer_update(
            FunctionComponentReducerDispatchRequest::new(
                current_reducer.dispatch(),
                action(7),
                lane,
            )
            .with_eager_state(eager_state),
        )
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(73)));

    let skipped_render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::SYNC,
        &mut registry,
    )
    .unwrap();
    let skipped_state = skipped_render.hook_state().unwrap();
    let mut skipped_cursor = hook_store.begin_render_cursor(skipped_state).unwrap();
    let skipped_lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::SYNC, Lanes::SYNC);
    let skipped_update = hook_store
        .update_reducer_hook_with_queued_updates(
            &mut skipped_cursor,
            reducer_id,
            skipped_lanes,
            |_, _| panic!("skipped eager reducer update should not be applied"),
        )
        .unwrap();
    assert_eq!(skipped_update.skipped_update_count(), 1);
    assert_eq!(skipped_update.eager_update_count(), 0);
    hook_store.finish_render_cursor(skipped_cursor).unwrap();
    hook_store.bind_current_list_unchecked(current, skipped_state.work_in_progress_list());

    let retry_render = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let mut retry_cursor = hook_store
        .begin_render_cursor(retry_render.hook_state().unwrap())
        .unwrap();
    let retry_lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let mut reducer_calls = 0;
    let applied_update = hook_store
        .update_reducer_hook_with_queued_updates(
            &mut retry_cursor,
            reducer_id,
            retry_lanes,
            |state, action| {
                reducer_calls += 1;
                StateHandle::from_raw(state.raw() + action.raw())
            },
        )
        .unwrap();

    assert_eq!(applied_update.memoized_state(), StateHandle::from_raw(67));
    assert_eq!(applied_update.resulting_state(), StateHandle::from_raw(67));
    assert_eq!(applied_update.base_state(), StateHandle::from_raw(67));
    assert_eq!(applied_update.base_queue(), None);
    assert_eq!(applied_update.remaining_lanes(), Lanes::NO);
    assert_eq!(applied_update.applied_update_count(), 1);
    assert_eq!(applied_update.skipped_update_count(), 0);
    assert_eq!(applied_update.eager_update_count(), 1);
    assert_eq!(reducer_calls, 0);
    let queue = hook_store
        .state_queues()
        .queue(current_reducer.queue())
        .unwrap();
    assert_eq!(*queue.last_rendered_state(), StateHandle::from_raw(67));
    hook_store.finish_render_cursor(retry_cursor).unwrap();
}

#[test]
fn private_use_reducer_dispatch_rejects_stale_eager_last_rendered_state() {
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut arena = FiberArena::new();
    let current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(1),
        FiberMode::NO,
    );
    let current_reducer = hook_store
        .create_current_reducer_hook(current, reducer(707), StateHandle::from_raw(70))
        .unwrap();
    let stale_eager_state = FunctionComponentStateDispatchEagerState::new(
        StateHandle::from_raw(69),
        StateHandle::from_raw(77),
    );
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    assert_eq!(
        hook_store.dispatch_reducer_update(
            FunctionComponentReducerDispatchRequest::new(
                current_reducer.dispatch(),
                action(7),
                lane,
            )
            .with_eager_state(stale_eager_state),
        ),
        Err(
            FunctionComponentRenderError::StateDispatchEagerStateMismatch {
                fiber: current,
                queue: current_reducer.queue(),
                expected: StateHandle::from_raw(70),
                actual: StateHandle::from_raw(69),
            },
        )
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_reducer.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn private_use_reducer_dispatch_rejects_basic_state_queue() {
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let mut arena = FiberArena::new();
    let current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(1),
        FiberMode::NO,
    );
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(30))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    assert_eq!(
        hook_store.dispatch_reducer_update(FunctionComponentReducerDispatchRequest::new(
            current_state.dispatch(),
            action(8),
            lane,
        )),
        Err(FunctionComponentRenderError::ExpectedReducerQueue {
            fiber: current,
            queue: current_state.queue(),
        })
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_state.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn private_use_reducer_dispatch_schedules_root_and_links_accepted_output_to_commit_handoff() {
    let (mut store, root_id) = root_store();
    let root_current = store.root(root_id).unwrap().current();
    let (current, work_in_progress, component) =
        attached_current_function_component_pair(&mut store, root_id);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = reducer(710);
    let current_reducer = hook_store
        .create_current_reducer_hook(current, reducer_id, StateHandle::from_raw(100))
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(810);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let eager_state = FunctionComponentStateDispatchEagerState::new(
        StateHandle::from_raw(100),
        StateHandle::from_raw(107),
    );
    let request =
        FunctionComponentReducerDispatchRequest::new(current_reducer.dispatch(), action(7), lane)
            .with_eager_state(eager_state);

    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        crate::scheduled_roots(&store).unwrap(),
        Vec::<FiberRootId>::new()
    );
    let rescheduled = hook_store
        .dispatch_reducer_update_and_reschedule_root(&mut store, request)
        .unwrap();

    assert_eq!(rescheduled.root(), root_id);
    assert_eq!(rescheduled.dispatch().fiber(), current);
    assert_eq!(rescheduled.dispatch().queue(), current_reducer.queue());
    assert_eq!(
        rescheduled.dispatch().dispatch(),
        current_reducer.dispatch()
    );
    assert_eq!(rescheduled.dispatch().reducer(), reducer_id);
    assert_eq!(rescheduled.dispatch().lane(), lane);
    assert_eq!(rescheduled.dispatch().action(), action(7));
    assert_eq!(rescheduled.dispatch().eager_state(), Some(eager_state));
    assert_eq!(rescheduled.reschedule().root(), root_id);
    assert_eq!(rescheduled.reschedule().fiber(), current);
    assert_eq!(rescheduled.reschedule().lane(), Lane::DEFAULT);
    assert_eq!(rescheduled.scheduled().root(), root_id);
    assert!(rescheduled.scheduled().inserted());
    assert!(rescheduled.scheduled().microtask().is_some());
    assert_eq!(crate::scheduled_roots(&store).unwrap(), vec![root_id]);
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_lane(Lane::DEFAULT)
    );
    assert!(
        store
            .fiber_arena()
            .get(current)
            .unwrap()
            .lanes()
            .contains_lane(Lane::DEFAULT)
    );
    assert!(
        store
            .fiber_arena()
            .get(work_in_progress)
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

    let skipped_render = render_function_component_with_hook_state(
        store.fiber_arena_mut(),
        &mut hook_store,
        work_in_progress,
        Lanes::SYNC,
        &mut registry,
    )
    .unwrap();
    let skipped_state = skipped_render.hook_state().unwrap();
    let diagnostic = hook_store
        .record_reducer_dispatch_queue_diagnostic(
            skipped_state,
            skipped_render.render_lanes(),
            request,
        )
        .unwrap();
    assert_eq!(diagnostic.fiber(), work_in_progress);
    assert_eq!(diagnostic.current(), Some(current));
    assert_eq!(diagnostic.queue_owner(), current);
    assert_eq!(diagnostic.queue(), current_reducer.queue());
    assert_eq!(diagnostic.reducer(), reducer_id);
    assert_eq!(diagnostic.action(), action(7));
    assert_eq!(diagnostic.render_lanes(), Lanes::SYNC);
    assert_eq!(diagnostic.dispatch_lane(), lane);
    assert_eq!(diagnostic.eager_state(), Some(eager_state));
    assert_eq!(
        diagnostic.eager_state_blocker(),
        FunctionComponentReducerDispatchEagerStateBlocker::ReducerExecutionBlocked
    );
    assert!(diagnostic.non_execution().keeps_dispatch_blocked());
    assert!(!diagnostic.non_execution().root_scheduled());
    assert!(!diagnostic.claims_public_hook_compatibility());

    let mut skipped_cursor = hook_store.begin_render_cursor(skipped_state).unwrap();
    let skipped_lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::SYNC, Lanes::SYNC);
    let skipped_update = hook_store
        .update_reducer_hook_with_queued_updates(
            &mut skipped_cursor,
            reducer_id,
            skipped_lanes,
            |_, _| panic!("skipped eager reducer update should not run the reducer"),
        )
        .unwrap();
    assert_eq!(skipped_update.memoized_state(), StateHandle::from_raw(100));
    assert_eq!(skipped_update.base_state(), StateHandle::from_raw(100));
    assert_eq!(skipped_update.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(skipped_update.applied_update_count(), 0);
    assert_eq!(skipped_update.skipped_update_count(), 1);
    assert_eq!(skipped_update.eager_update_count(), 0);
    let rebased = hook_store
        .state_queues()
        .update_ring(skipped_update.base_queue())
        .unwrap();
    assert_eq!(rebased.len(), 1);
    let rebased_update = hook_store.state_queues().update(rebased[0]).unwrap();
    assert_eq!(rebased_update.lane().priority_lanes(), Lanes::DEFAULT);
    assert_eq!(*rebased_update.action(), action(7));
    assert_eq!(
        rebased_update.eager_state().copied(),
        Some(StateHandle::from_raw(107))
    );
    hook_store.finish_render_cursor(skipped_cursor).unwrap();
    hook_store.bind_current_list_unchecked(current, skipped_state.work_in_progress_list());

    let accepted_render = render_function_component_with_hook_state(
        store.fiber_arena_mut(),
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let accepted_state = accepted_render.hook_state().unwrap();
    let mut accepted_cursor = hook_store.begin_render_cursor(accepted_state).unwrap();
    let accepted_lanes =
        FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let mut reducer_calls = 0;
    let accepted_update = hook_store
        .update_reducer_hook_with_queued_updates(
            &mut accepted_cursor,
            reducer_id,
            accepted_lanes,
            |state, action| {
                reducer_calls += 1;
                StateHandle::from_raw(state.raw() + action.raw())
            },
        )
        .unwrap();
    assert_eq!(accepted_render.output(), output);
    assert_eq!(accepted_update.memoized_state(), StateHandle::from_raw(107));
    assert_eq!(accepted_update.base_state(), StateHandle::from_raw(107));
    assert_eq!(accepted_update.remaining_lanes(), Lanes::NO);
    assert_eq!(accepted_update.applied_update_count(), 1);
    assert_eq!(accepted_update.skipped_update_count(), 0);
    assert_eq!(accepted_update.eager_update_count(), 1);
    assert_eq!(reducer_calls, 0);
    hook_store.finish_render_cursor(accepted_cursor).unwrap();
    store
        .fiber_arena_mut()
        .get_mut(current)
        .unwrap()
        .set_lanes(accepted_update.remaining_lanes());
    store
        .fiber_arena_mut()
        .get_mut(current)
        .unwrap()
        .set_child_lanes(Lanes::NO);
    store
        .fiber_arena_mut()
        .get_mut(work_in_progress)
        .unwrap()
        .set_lanes(accepted_update.remaining_lanes());
    store
        .fiber_arena_mut()
        .get_mut(work_in_progress)
        .unwrap()
        .set_child_lanes(Lanes::NO);
    store
        .fiber_arena_mut()
        .get_mut(root_current)
        .unwrap()
        .set_child_lanes(accepted_update.remaining_lanes());

    let resolver =
        StaticSingleChildResolver::new(Some(FunctionComponentSingleChildOutput::host_text(
            output,
            RootElementHandle::from_raw(811),
            PropsHandle::from_raw(812),
        )));
    let host_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (single_child, commit_handoff) =
        accept_function_component_reducer_render_for_commit_handoff(
            &mut store,
            accepted_render,
            host_render,
            &resolver,
        )
        .unwrap();

    assert_eq!(single_child.function_component(), work_in_progress);
    assert_eq!(single_child.current(), Some(current));
    assert_eq!(single_child.output(), output);
    assert_eq!(single_child.child_tag(), FiberTag::HostText);
    assert_eq!(
        single_child.child_element(),
        RootElementHandle::from_raw(811)
    );
    assert_eq!(single_child.render_lanes(), accepted_render.render_lanes());
    assert!(
        store
            .fiber_arena()
            .get(work_in_progress)
            .unwrap()
            .flags()
            .contains_all(FiberFlags::PERFORMED_WORK)
    );

    let pending = commit_handoff.pending();
    assert_eq!(pending.root(), root_id);
    assert_eq!(pending.previous_current(), root_current);
    assert_eq!(pending.pending_work(), Some(host_render.finished_work()));
    assert_eq!(pending.finished_work(), host_render.finished_work());
    assert_eq!(pending.render_lanes(), accepted_render.render_lanes());
    assert_eq!(pending.finished_lanes(), accepted_render.render_lanes());
    assert_eq!(pending.pending_lanes_before_commit(), Lanes::DEFAULT);
    assert!(pending.records_finished_work());
    let execution = *commit_handoff.execution_request();
    assert!(execution.execution_requested());
    assert!(execution.accepted_current_finished_work_record_shape());
    assert_eq!(execution.root(), root_id);
    assert_eq!(execution.finished_work(), host_render.finished_work());
    assert_eq!(execution.render_lanes(), accepted_render.render_lanes());
    assert!(execution.compatibility_claim_blocked());
    assert!(execution.refs_effects_and_hydration_blocked());
    assert!(commit_handoff.commit_order_after_pending_record());
    assert_eq!(commit_handoff.commit().root(), root_id);
    assert_eq!(
        commit_handoff.current_after_commit(),
        host_render.finished_work()
    );
    assert_eq!(commit_handoff.finished_work_after_commit(), None);
    assert_eq!(commit_handoff.finished_lanes_after_commit(), Lanes::NO);
    assert_eq!(commit_handoff.render_phase_work_after_commit(), None);
    assert!(commit_handoff.consumed_finished_work_record());
    assert!(commit_handoff.public_root_rendering_blocked());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        host_render.finished_work()
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
}

#[test]
fn private_use_reducer_transition_lane_rebase_then_accepts_matching_lane() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = reducer(715);
    let current_reducer = hook_store
        .create_current_reducer_hook(current, reducer_id, StateHandle::from_raw(1_200))
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(1_216);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let transition_lanes = Lanes::from(Lane::TRANSITION_1);
    let transition_lane = HookUpdateLane::from_lane(Lane::TRANSITION_1).unwrap();
    let dispatch_request = FunctionComponentReducerDispatchRequest::new(
        current_reducer.dispatch(),
        action(16),
        transition_lane,
    );
    hook_store
        .dispatch_reducer_update(dispatch_request)
        .unwrap();

    let skipped_render = render_function_component_with_use_reducer(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::SYNC,
        FunctionComponentUseReducerRenderRequest::new(
            reducer_id,
            StateHandle::from_raw(9_999),
            FunctionComponentStateUpdateRenderLanes::new(Lanes::SYNC, Lanes::SYNC),
        ),
        &mut registry,
        |_, _| panic!("transition useReducer update should be rebased on sync render"),
    )
    .unwrap();
    let skipped_update = skipped_render.reducer_hook().update_record().unwrap();

    assert_eq!(skipped_render.render_lanes(), Lanes::SYNC);
    assert_eq!(skipped_render.output(), output);
    assert_eq!(
        skipped_update.memoized_state(),
        StateHandle::from_raw(1_200)
    );
    assert_eq!(skipped_update.base_state(), StateHandle::from_raw(1_200));
    assert_eq!(skipped_update.remaining_lanes(), transition_lanes);
    assert_eq!(skipped_update.applied_update_count(), 0);
    assert_eq!(skipped_update.skipped_update_count(), 1);
    assert_eq!(skipped_update.eager_update_count(), 0);
    let diagnostic = hook_store
        .record_reducer_dispatch_queue_diagnostic(
            skipped_render.hook_state(),
            skipped_render.render_lanes(),
            dispatch_request,
        )
        .unwrap();
    assert_eq!(diagnostic.dispatch_lane(), transition_lane);
    assert!(diagnostic.non_execution().keeps_dispatch_blocked());
    assert!(!diagnostic.claims_public_hook_compatibility());
    let skipped_base_tail = skipped_update.base_queue().unwrap();
    let rebased = hook_store
        .state_queues()
        .update_ring(Some(skipped_base_tail))
        .unwrap();
    assert_eq!(rebased.len(), 1);
    let rebased_update = hook_store.state_queues().update(rebased[0]).unwrap();
    assert_eq!(rebased_update.lane(), transition_lane);
    assert_eq!(*rebased_update.action(), action(16));
    hook_store
        .bind_current_list_unchecked(current, skipped_render.hook_state().work_in_progress_list());

    let mut reducer_calls = 0;
    let accepted_render = render_function_component_with_use_reducer(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        transition_lanes,
        FunctionComponentUseReducerRenderRequest::new(
            reducer_id,
            StateHandle::from_raw(9_999),
            FunctionComponentStateUpdateRenderLanes::new(transition_lanes, transition_lanes),
        ),
        &mut registry,
        |state, action| {
            reducer_calls += 1;
            StateHandle::from_raw(state.raw() + action.raw())
        },
    )
    .unwrap();
    let accepted_update = accepted_render.reducer_hook().update_record().unwrap();

    assert_eq!(accepted_render.render_lanes(), transition_lanes);
    assert_eq!(accepted_render.output(), output);
    assert_eq!(
        accepted_update.previous_base_queue(),
        Some(skipped_base_tail)
    );
    assert_eq!(
        accepted_update.memoized_state(),
        StateHandle::from_raw(1_216)
    );
    assert_eq!(
        accepted_update.resulting_state(),
        StateHandle::from_raw(1_216)
    );
    assert_eq!(accepted_update.base_state(), StateHandle::from_raw(1_216));
    assert_eq!(accepted_update.base_queue(), None);
    assert_eq!(accepted_update.remaining_lanes(), Lanes::NO);
    assert_eq!(accepted_update.applied_update_count(), 1);
    assert_eq!(accepted_update.skipped_update_count(), 0);
    assert_eq!(accepted_update.eager_update_count(), 0);
    assert_eq!(reducer_calls, 1);
    assert_eq!(registry.calls().len(), 2);
    let queue = hook_store
        .state_queues()
        .queue(current_reducer.queue())
        .unwrap();
    assert_eq!(*queue.last_rendered_state(), StateHandle::from_raw(1_216));
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_reducer.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
}

#[test]
fn private_use_reducer_dispatch_reschedule_rejects_stale_and_basic_state_before_root_mark() {
    let (mut stale_store, stale_root) = root_store();
    let (stale_current, _stale_work, _stale_component) =
        attached_current_function_component_pair(&mut stale_store, stale_root);
    let mut stale_hook_store = FunctionComponentHookRenderStore::new();
    let stale_reducer = stale_hook_store
        .create_current_reducer_hook(stale_current, reducer(711), StateHandle::from_raw(200))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let stale_eager_state = FunctionComponentStateDispatchEagerState::new(
        StateHandle::from_raw(199),
        StateHandle::from_raw(207),
    );

    assert_eq!(
        stale_hook_store.dispatch_reducer_update_and_reschedule_root(
            &mut stale_store,
            FunctionComponentReducerDispatchRequest::new(
                stale_reducer.dispatch(),
                action(7),
                lane,
            )
            .with_eager_state(stale_eager_state),
        ),
        Err(FunctionComponentStateDispatchRootRescheduleError::Render(
            FunctionComponentRenderError::StateDispatchEagerStateMismatch {
                fiber: stale_current,
                queue: stale_reducer.queue(),
                expected: StateHandle::from_raw(200),
                actual: StateHandle::from_raw(199),
            },
        ))
    );
    assert_eq!(
        stale_hook_store
            .state_queues()
            .pending_updates(stale_reducer.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
    assert_eq!(
        stale_store
            .root(stale_root)
            .unwrap()
            .lanes()
            .pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        crate::scheduled_roots(&stale_store).unwrap(),
        Vec::<FiberRootId>::new()
    );

    let (mut basic_store, basic_root) = root_store();
    let (basic_current, _basic_work, _basic_component) =
        attached_current_function_component_pair(&mut basic_store, basic_root);
    let mut basic_hook_store = FunctionComponentHookRenderStore::new();
    let basic_state = basic_hook_store
        .create_current_state_hook(basic_current, StateHandle::from_raw(300))
        .unwrap();

    assert_eq!(
        basic_hook_store.dispatch_reducer_update_and_reschedule_root(
            &mut basic_store,
            FunctionComponentReducerDispatchRequest::new(basic_state.dispatch(), action(8), lane,),
        ),
        Err(FunctionComponentStateDispatchRootRescheduleError::Render(
            FunctionComponentRenderError::ExpectedReducerQueue {
                fiber: basic_current,
                queue: basic_state.queue(),
            },
        ))
    );
    assert_eq!(
        basic_hook_store
            .state_queues()
            .pending_updates(basic_state.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
    assert_eq!(
        basic_store
            .root(basic_root)
            .unwrap()
            .lanes()
            .pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        crate::scheduled_roots(&basic_store).unwrap(),
        Vec::<FiberRootId>::new()
    );
}

#[test]
fn private_use_reducer_commit_handoff_rejects_unsupported_output_before_commit() {
    let (mut store, root_id) = root_store();
    let root_current = store.root(root_id).unwrap().current();
    let (current, work_in_progress, component) =
        attached_current_function_component_pair(&mut store, root_id);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = reducer(712);
    let current_reducer = hook_store
        .create_current_reducer_hook(current, reducer_id, StateHandle::from_raw(400))
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(820);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    hook_store
        .dispatch_reducer_update_and_reschedule_root(
            &mut store,
            FunctionComponentReducerDispatchRequest::new(
                current_reducer.dispatch(),
                action(4),
                lane,
            ),
        )
        .unwrap();

    let function_render = render_function_component_with_hook_state(
        store.fiber_arena_mut(),
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let hook_state = function_render.hook_state().unwrap();
    let mut cursor = hook_store.begin_render_cursor(hook_state).unwrap();
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let update = hook_store
        .update_reducer_hook_with_queued_updates(
            &mut cursor,
            reducer_id,
            lanes,
            reducer_adds_action,
        )
        .unwrap();
    assert_eq!(update.memoized_state(), StateHandle::from_raw(404));
    hook_store.finish_render_cursor(cursor).unwrap();

    let host_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let resolver = StaticSingleChildResolver::new(Some(FunctionComponentSingleChildOutput::new(
        output,
        RootElementHandle::from_raw(821),
        FiberTag::Fragment,
        ElementTypeHandle::NONE,
        PropsHandle::from_raw(822),
    )));

    assert_eq!(
        accept_function_component_reducer_render_for_commit_handoff(
            &mut store,
            function_render,
            host_render,
            &resolver,
        ),
        Err(
            FunctionComponentReducerDispatchCommitHandoffCanaryError::SingleChild(
                FunctionComponentSingleChildReconciliationError::UnsupportedChildTag {
                    fiber: work_in_progress,
                    output,
                    tag: FiberTag::Fragment,
                },
            ),
        )
    );
    assert_eq!(store.root(root_id).unwrap().current(), root_current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(host_render.finished_work())
    );
}

#[test]
fn private_use_state_dispatch_reschedule_rejects_stale_queue_dispatch_before_scheduling() {
    let (mut store, root_id) = root_store();
    let root_current = store.root(root_id).unwrap().current();
    let (_current, work_in_progress, _component) =
        attached_function_component_pair(&mut store, root_id);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let first_state = hook_store
        .create_current_state_hook(work_in_progress, StateHandle::from_raw(32))
        .unwrap();
    let second_state = hook_store
        .create_current_state_hook(work_in_progress, StateHandle::from_raw(33))
        .unwrap();
    hook_store
        .state_queues_mut()
        .queue_mut(first_state.queue())
        .unwrap()
        .set_dispatch(second_state.dispatch());
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    let error = hook_store
        .dispatch_state_update_and_reschedule_root(
            &mut store,
            FunctionComponentStateDispatchRequest::new(first_state.dispatch(), action(903), lane),
        )
        .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentStateDispatchRootRescheduleError::Render(
            FunctionComponentRenderError::StaleStateDispatch {
                fiber: work_in_progress,
                queue: first_state.queue(),
                expected: second_state.dispatch(),
                actual: first_state.dispatch(),
            },
        )
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(first_state.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        crate::scheduled_roots(&store).unwrap(),
        Vec::<FiberRootId>::new()
    );
    assert_eq!(
        store.fiber_arena().get(work_in_progress).unwrap().lanes(),
        Lanes::NO
    );
    assert_eq!(
        store.fiber_arena().get(root_current).unwrap().child_lanes(),
        Lanes::NO
    );
}

#[test]
fn private_use_state_dispatch_reschedule_rejects_reducer_queue_before_scheduling() {
    let (mut store, root_id) = root_store();
    let root_current = store.root(root_id).unwrap().current();
    let (_current, work_in_progress, _component) =
        attached_function_component_pair(&mut store, root_id);
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let reducer_id = reducer(904);
    let reducer_state = hook_store
        .create_current_reducer_hook(work_in_progress, reducer_id, StateHandle::from_raw(34))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

    let error = hook_store
        .dispatch_state_update_and_reschedule_root(
            &mut store,
            FunctionComponentStateDispatchRequest::new(reducer_state.dispatch(), action(905), lane),
        )
        .unwrap_err();

    assert_eq!(
        error,
        FunctionComponentStateDispatchRootRescheduleError::Render(
            FunctionComponentRenderError::ExpectedBasicStateQueue {
                fiber: work_in_progress,
                queue: reducer_state.queue(),
                actual: Some(FunctionComponentStateReducerId::Reducer(reducer_id)),
            },
        )
    );
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(reducer_state.queue())
            .unwrap(),
        Vec::<HookUpdateId>::new()
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        crate::scheduled_roots(&store).unwrap(),
        Vec::<FiberRootId>::new()
    );
    assert_eq!(
        store.fiber_arena().get(work_in_progress).unwrap().lanes(),
        Lanes::NO
    );
    assert_eq!(
        store.fiber_arena().get(root_current).unwrap().child_lanes(),
        Lanes::NO
    );
}

#[test]
fn private_use_state_dispatch_rejects_unknown_handles() {
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let dispatch = FunctionComponentStateDispatchHandle::from_raw(999);

    assert_eq!(
        hook_store.dispatch_state_update(FunctionComponentStateDispatchRequest::new(
            dispatch,
            action(902),
            lane,
        )),
        Err(FunctionComponentRenderError::UnknownStateDispatch { dispatch })
    );
}

#[test]
fn private_use_state_update_requires_state_hook_payload() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_list = hook_store.create_current_list(current);
    hook_store
        .hook_lists_mut()
        .append_hook(current_list, opaque(10))
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(49);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();

    let state = record.hook_state().unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let error = hook_store.update_state_hook(&mut cursor).unwrap_err();
    let cloned_hook = hook_store
        .hook_lists()
        .ordered_hooks(state.work_in_progress_list())
        .unwrap()[0];

    assert_eq!(
        error,
        FunctionComponentRenderError::MissingStateHookPayload {
            fiber: work_in_progress,
            hook: cloned_hook,
        }
    );
}

#[test]
fn function_component_effect_metadata_update_changed_deps_reuses_instance_and_marks_flags() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_list = hook_store.create_current_list(current);
    let previous = seed_current_effect_metadata(
        &mut arena,
        &mut hook_store,
        current,
        current_list,
        FunctionComponentEffectPhase::Layout,
        callback(80),
        deps(800),
    );
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(48)));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let state = record.hook_state().unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let registration = hook_store
        .update_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Layout,
            callback(81),
            deps(801),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    let finished = hook_store.finish_render_cursor(cursor).unwrap();

    assert_eq!(finished.traversal().traversed_count(), 1);
    assert_ne!(registration.effect(), previous.effect());
    assert_eq!(registration.instance(), previous.instance());
    assert_eq!(registration.tag(), HookEffectFlags::LAYOUT_EFFECT);
    assert_eq!(registration.fiber_flags(), FiberFlags::UPDATE);
    assert_eq!(
        arena.get(work_in_progress).unwrap().flags(),
        FiberFlags::UPDATE
    );

    let ring = hook_store
        .effect_ring(state.work_in_progress_list())
        .unwrap();
    assert_eq!(ring.last_effect(), Some(registration.effect()));
    let effect = hook_store
        .hook_effects()
        .get_effect(registration.effect())
        .unwrap();
    assert_eq!(effect.instance(), previous.instance());
    assert_eq!(effect.create(), callback(81));
    assert_eq!(effect.dependencies(), deps(801));
}

#[test]
fn function_component_effect_metadata_update_equal_deps_skips_has_effect_and_flags() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_list = hook_store.create_current_list(current);
    let previous = seed_current_effect_metadata(
        &mut arena,
        &mut hook_store,
        current,
        current_list,
        FunctionComponentEffectPhase::Passive,
        callback(90),
        deps(900),
    );
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(49)));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let state = record.hook_state().unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let registration = hook_store
        .update_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(91),
            deps(900),
            FunctionComponentEffectDependencyStatus::Unchanged,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    assert_eq!(registration.instance(), previous.instance());
    assert_eq!(registration.tag(), HookEffectFlags::PASSIVE);
    assert!(!registration.tag().should_fire());
    assert_eq!(registration.fiber_flags(), FiberFlags::NO);
    assert_eq!(arena.get(work_in_progress).unwrap().flags(), FiberFlags::NO);
    assert_eq!(
        hook_store
            .hook_effects()
            .get_instance(previous.instance())
            .unwrap()
            .destroy(),
        None
    );
    assert!(
        hook_store
            .effect_ring(state.work_in_progress_list())
            .unwrap()
            .iter_matching(hook_store.hook_effects(), HookEffectFlags::PASSIVE_EFFECT)
            .unwrap()
            .next()
            .is_none()
    );
    assert!(
        hook_store
            .passive_effect_metadata(state, Lanes::DEFAULT)
            .unwrap()
            .is_empty()
    );
}

#[test]
fn function_component_effect_update_queue_records_changed_and_unchanged_dependencies() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_changed = hook_store
        .create_current_effect_metadata(
            &mut arena,
            current,
            FunctionComponentEffectPhase::Passive,
            callback(1000),
            deps(1001),
            Some(callback(1002)),
        )
        .unwrap();
    let previous_unchanged = hook_store
        .create_current_effect_metadata(
            &mut arena,
            current,
            FunctionComponentEffectPhase::Passive,
            callback(1010),
            deps(1011),
            Some(callback(1012)),
        )
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(50)));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let state = record.hook_state().unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let changed = hook_store
        .update_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(1003),
            deps(1004),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    let unchanged = hook_store
        .update_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(1013),
            deps(1011),
            FunctionComponentEffectDependencyStatus::Unchanged,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let queue = hook_store.effect_update_queue(state).unwrap().unwrap();
    assert_eq!(queue.hook_list(), state.work_in_progress_list());
    assert_eq!(queue.len(), 2);
    assert!(!queue.is_empty());
    assert_eq!(queue.changed_dependency_count(), 1);
    assert_eq!(queue.unchanged_dependency_count(), 1);
    assert_eq!(queue.accepted_passive_count(), 1);

    let records = queue.records();
    assert_eq!(records[0].update_index(), 0);
    assert_eq!(records[0].fiber(), work_in_progress);
    assert_eq!(records[0].hook(), changed.hook());
    assert_eq!(records[0].previous_effect(), previous_changed.effect());
    assert_eq!(records[0].effect(), changed.effect());
    assert_eq!(records[0].instance(), previous_changed.instance());
    assert_eq!(records[0].phase(), FunctionComponentEffectPhase::Passive);
    assert_eq!(records[0].tag(), HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(records[0].create(), callback(1003));
    assert_eq!(records[0].destroy(), Some(callback(1002)));
    assert_eq!(records[0].previous_dependencies(), deps(1001));
    assert_eq!(records[0].dependencies(), deps(1004));
    assert_eq!(
        records[0].dependency_status(),
        FunctionComponentEffectDependencyStatus::Changed
    );
    assert!(records[0].dependencies_changed());
    assert!(!records[0].dependencies_unchanged());
    assert!(records[0].accepted_for_pending_passive());

    assert_eq!(records[1].update_index(), 1);
    assert_eq!(records[1].fiber(), work_in_progress);
    assert_eq!(records[1].hook(), unchanged.hook());
    assert_eq!(records[1].previous_effect(), previous_unchanged.effect());
    assert_eq!(records[1].effect(), unchanged.effect());
    assert_eq!(records[1].instance(), previous_unchanged.instance());
    assert_eq!(records[1].phase(), FunctionComponentEffectPhase::Passive);
    assert_eq!(records[1].tag(), HookEffectFlags::PASSIVE);
    assert_eq!(records[1].create(), callback(1013));
    assert_eq!(records[1].destroy(), Some(callback(1012)));
    assert_eq!(records[1].previous_dependencies(), deps(1011));
    assert_eq!(records[1].dependencies(), deps(1011));
    assert_eq!(
        records[1].dependency_status(),
        FunctionComponentEffectDependencyStatus::Unchanged
    );
    assert!(!records[1].dependencies_changed());
    assert!(records[1].dependencies_unchanged());
    assert!(!records[1].accepted_for_pending_passive());

    let persistence = hook_store
        .effect_destroy_handle_persistence_records(state)
        .unwrap();
    assert_eq!(persistence.len(), 2);
    assert_eq!(persistence[0].update_index(), 0);
    assert_eq!(persistence[0].previous_effect(), previous_changed.effect());
    assert_eq!(persistence[0].effect(), changed.effect());
    assert_eq!(
        persistence[0].previous_instance(),
        previous_changed.instance()
    );
    assert_eq!(persistence[0].retained_instance(), changed.instance());
    assert_eq!(persistence[0].recorded_destroy(), Some(callback(1002)));
    assert_eq!(persistence[0].previous_destroy(), Some(callback(1002)));
    assert_eq!(persistence[0].retained_destroy(), Some(callback(1002)));
    assert!(persistence[0].proves_destroy_handle_persisted());
    assert!(persistence[0].proves_update_unmount_metadata_consumes_previous_destroy());
    assert!(!persistence[0].proves_removed_effect_retains_previous_destroy());
    assert_eq!(persistence[1].update_index(), 1);
    assert_eq!(
        persistence[1].previous_effect(),
        previous_unchanged.effect()
    );
    assert_eq!(persistence[1].effect(), unchanged.effect());
    assert_eq!(
        persistence[1].previous_instance(),
        previous_unchanged.instance()
    );
    assert_eq!(persistence[1].retained_instance(), unchanged.instance());
    assert_eq!(persistence[1].recorded_destroy(), Some(callback(1012)));
    assert_eq!(persistence[1].previous_destroy(), Some(callback(1012)));
    assert_eq!(persistence[1].retained_destroy(), Some(callback(1012)));
    assert!(persistence[1].proves_destroy_handle_persisted());
    assert!(!persistence[1].proves_update_unmount_metadata_consumes_previous_destroy());
    assert!(persistence[1].proves_removed_effect_retains_previous_destroy());

    let passive = hook_store
        .passive_effect_metadata(state, Lanes::DEFAULT)
        .unwrap();
    assert_eq!(passive.len(), 1);
    assert_eq!(passive[0].fiber(), work_in_progress);
    assert_eq!(passive[0].hook_list(), state.work_in_progress_list());
    assert_eq!(passive[0].effect_index(), 0);
    assert_eq!(passive[0].effect(), changed.effect());
    assert_eq!(
        passive[0].previous_effect(),
        Some(previous_changed.effect())
    );
    assert_eq!(passive[0].instance(), changed.instance());
    assert_eq!(passive[0].tag(), HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(passive[0].create(), callback(1003));
    assert_eq!(passive[0].destroy(), Some(callback(1002)));
    assert_eq!(passive[0].dependencies(), deps(1004));
    assert_eq!(passive[0].lanes(), Lanes::DEFAULT);

    let committed = hook_store
        .commit_pending_effect_queue_for_fiber(work_in_progress, Lanes::DEFAULT)
        .unwrap()
        .unwrap();
    assert_eq!(committed.fiber(), work_in_progress);
    assert_eq!(committed.phase(), FunctionComponentHookRenderPhase::Update);
    assert_eq!(committed.hook_list(), state.work_in_progress_list());
    assert_eq!(committed.len(), 2);
    assert_eq!(committed.accepted_passive_count(), 1);
    assert_eq!(
        hook_store.current_list(work_in_progress),
        Some(state.work_in_progress_list())
    );

    let committed_records = committed.records();
    assert_eq!(committed_records[0].effect_index(), 0);
    assert_eq!(
        committed_records[0].previous_effect(),
        Some(previous_changed.effect())
    );
    assert_eq!(committed_records[0].effect(), changed.effect());
    assert_eq!(
        committed_records[0].previous_dependencies(),
        Some(deps(1001))
    );
    assert_eq!(committed_records[0].dependencies(), deps(1004));
    assert_eq!(
        committed_records[0].dependency_status(),
        Some(FunctionComponentEffectDependencyStatus::Changed)
    );
    assert!(committed_records[0].accepted_for_pending_passive());
    assert_eq!(committed_records[1].effect_index(), 1);
    assert_eq!(
        committed_records[1].previous_effect(),
        Some(previous_unchanged.effect())
    );
    assert_eq!(committed_records[1].effect(), unchanged.effect());
    assert_eq!(
        committed_records[1].dependency_status(),
        Some(FunctionComponentEffectDependencyStatus::Unchanged)
    );
    assert!(!committed_records[1].accepted_for_pending_passive());

    let firing_passive = hook_store
        .committed_passive_effect_metadata(work_in_progress, HookEffectFlags::PASSIVE_EFFECT);
    assert_eq!(firing_passive.len(), 1);
    assert_eq!(firing_passive[0].effect(), changed.effect());
    assert_eq!(
        firing_passive[0].previous_effect(),
        Some(previous_changed.effect())
    );
    assert_eq!(firing_passive[0].destroy(), Some(callback(1002)));
    let all_passive =
        hook_store.committed_passive_effect_metadata(work_in_progress, HookEffectFlags::PASSIVE);
    assert_eq!(all_passive.len(), 2);
    assert_eq!(all_passive[0].effect(), changed.effect());
    assert_eq!(
        all_passive[0].previous_effect(),
        Some(previous_changed.effect())
    );
    assert_eq!(all_passive[1].effect(), unchanged.effect());
    assert_eq!(
        all_passive[1].previous_effect(),
        Some(previous_unchanged.effect())
    );
}

#[test]
fn function_component_effect_destroy_persistence_evidence_detects_foreign_handle_drift() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous = hook_store
        .create_current_effect_metadata(
            &mut arena,
            current,
            FunctionComponentEffectPhase::Passive,
            callback(1040),
            deps(1041),
            Some(callback(1042)),
        )
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(52)));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let state = record.hook_state().unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let changed = hook_store
        .update_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Passive,
            callback(1043),
            deps(1044),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let evidence = hook_store
        .effect_destroy_handle_persistence_records(state)
        .unwrap();
    assert_eq!(evidence.len(), 1);
    assert_eq!(evidence[0].previous_effect(), previous.effect());
    assert_eq!(evidence[0].effect(), changed.effect());
    assert_eq!(evidence[0].recorded_destroy(), Some(callback(1042)));
    assert!(evidence[0].proves_update_unmount_metadata_consumes_previous_destroy());

    hook_store
        .hook_effects_mut()
        .get_instance_mut(changed.instance())
        .unwrap()
        .set_destroy(Some(callback(1049)));

    let drifted = hook_store
        .effect_destroy_handle_persistence_records(state)
        .unwrap();
    assert_eq!(drifted.len(), 1);
    assert_eq!(drifted[0].recorded_destroy(), Some(callback(1042)));
    assert_eq!(drifted[0].previous_destroy(), Some(callback(1049)));
    assert_eq!(drifted[0].retained_destroy(), Some(callback(1049)));
    assert!(!drifted[0].destroy_handle_matches_recorded_update_metadata());
    assert!(!drifted[0].proves_update_unmount_metadata_consumes_previous_destroy());
}

#[test]
fn function_component_layout_metadata_update_records_changed_and_unchanged_dependencies() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let previous_changed = hook_store
        .create_current_effect_metadata(
            &mut arena,
            current,
            FunctionComponentEffectPhase::Layout,
            callback(1020),
            deps(1021),
            Some(callback(1022)),
        )
        .unwrap();
    let previous_unchanged = hook_store
        .create_current_effect_metadata(
            &mut arena,
            current,
            FunctionComponentEffectPhase::Layout,
            callback(1030),
            deps(1031),
            Some(callback(1032)),
        )
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(51)));

    let record = render_function_component_with_hook_state(
        &mut arena,
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let state = record.hook_state().unwrap();
    assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let changed = hook_store
        .update_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Layout,
            callback(1023),
            deps(1024),
            FunctionComponentEffectDependencyStatus::Changed,
        )
        .unwrap();
    let unchanged = hook_store
        .update_effect_metadata(
            &mut arena,
            &mut cursor,
            FunctionComponentEffectPhase::Layout,
            callback(1033),
            deps(1031),
            FunctionComponentEffectDependencyStatus::Unchanged,
        )
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    let queue = hook_store.effect_update_queue(state).unwrap().unwrap();
    assert_eq!(queue.len(), 2);
    assert_eq!(queue.changed_dependency_count(), 1);
    assert_eq!(queue.unchanged_dependency_count(), 1);
    assert_eq!(queue.accepted_layout_count(), 1);
    assert_eq!(queue.accepted_passive_count(), 0);

    let records = queue.records();
    assert_eq!(records[0].update_index(), 0);
    assert_eq!(records[0].fiber(), work_in_progress);
    assert_eq!(records[0].hook(), changed.hook());
    assert_eq!(records[0].previous_effect(), previous_changed.effect());
    assert_eq!(records[0].effect(), changed.effect());
    assert_eq!(records[0].instance(), previous_changed.instance());
    assert_eq!(records[0].phase(), FunctionComponentEffectPhase::Layout);
    assert_eq!(records[0].tag(), HookEffectFlags::LAYOUT_EFFECT);
    assert_eq!(records[0].create(), callback(1023));
    assert_eq!(records[0].destroy(), Some(callback(1022)));
    assert_eq!(records[0].previous_dependencies(), deps(1021));
    assert_eq!(records[0].dependencies(), deps(1024));
    assert_eq!(
        records[0].dependency_status(),
        FunctionComponentEffectDependencyStatus::Changed
    );
    assert!(records[0].accepted_for_layout_commit());
    assert!(!records[0].accepted_for_pending_passive());

    assert_eq!(records[1].update_index(), 1);
    assert_eq!(records[1].fiber(), work_in_progress);
    assert_eq!(records[1].hook(), unchanged.hook());
    assert_eq!(records[1].previous_effect(), previous_unchanged.effect());
    assert_eq!(records[1].effect(), unchanged.effect());
    assert_eq!(records[1].instance(), previous_unchanged.instance());
    assert_eq!(records[1].phase(), FunctionComponentEffectPhase::Layout);
    assert_eq!(records[1].tag(), HookEffectFlags::LAYOUT);
    assert_eq!(records[1].create(), callback(1033));
    assert_eq!(records[1].destroy(), Some(callback(1032)));
    assert_eq!(records[1].previous_dependencies(), deps(1031));
    assert_eq!(records[1].dependencies(), deps(1031));
    assert_eq!(
        records[1].dependency_status(),
        FunctionComponentEffectDependencyStatus::Unchanged
    );
    assert!(!records[1].accepted_for_layout_commit());
    assert!(!records[1].accepted_for_pending_passive());

    let persistence = hook_store
        .effect_destroy_handle_persistence_records(state)
        .unwrap();
    assert_eq!(persistence.len(), 2);
    assert_eq!(persistence[0].previous_effect(), previous_changed.effect());
    assert_eq!(persistence[0].effect(), changed.effect());
    assert_eq!(persistence[0].recorded_destroy(), Some(callback(1022)));
    assert_eq!(persistence[0].previous_destroy(), Some(callback(1022)));
    assert_eq!(persistence[0].retained_destroy(), Some(callback(1022)));
    assert!(persistence[0].proves_update_unmount_metadata_consumes_previous_destroy());
    assert_eq!(
        persistence[1].previous_effect(),
        previous_unchanged.effect()
    );
    assert_eq!(persistence[1].effect(), unchanged.effect());
    assert_eq!(persistence[1].recorded_destroy(), Some(callback(1032)));
    assert_eq!(persistence[1].previous_destroy(), Some(callback(1032)));
    assert_eq!(persistence[1].retained_destroy(), Some(callback(1032)));
    assert!(persistence[1].proves_removed_effect_retains_previous_destroy());

    let layout = hook_store
        .layout_effect_metadata(state, Lanes::DEFAULT)
        .unwrap();
    assert_eq!(layout.len(), 1);
    assert_eq!(layout[0].fiber(), work_in_progress);
    assert_eq!(
        layout[0].render_phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(layout[0].hook_list(), state.work_in_progress_list());
    assert_eq!(layout[0].effect_index(), 0);
    assert_eq!(layout[0].effect(), changed.effect());
    assert_eq!(layout[0].previous_effect(), Some(previous_changed.effect()));
    assert_eq!(layout[0].instance(), changed.instance());
    assert_eq!(layout[0].tag(), HookEffectFlags::LAYOUT_EFFECT);
    assert_eq!(layout[0].create(), callback(1023));
    assert_eq!(layout[0].destroy(), Some(callback(1022)));
    assert_eq!(layout[0].previous_dependencies(), Some(deps(1021)));
    assert_eq!(layout[0].dependencies(), deps(1024));
    assert_eq!(
        layout[0].dependency_status(),
        Some(FunctionComponentEffectDependencyStatus::Changed)
    );
    assert_eq!(
        layout[0].dependency_phase(),
        FunctionComponentEffectDependencyPhase::UpdateChanged
    );
    assert_eq!(layout[0].lanes(), Lanes::DEFAULT);
    assert!(
        hook_store
            .passive_effect_metadata(state, Lanes::DEFAULT)
            .unwrap()
            .is_empty()
    );

    let committed = hook_store
        .commit_pending_effect_queue_for_fiber(work_in_progress, Lanes::DEFAULT)
        .unwrap()
        .unwrap();
    assert_eq!(committed.fiber(), work_in_progress);
    assert_eq!(committed.phase(), FunctionComponentHookRenderPhase::Update);
    assert_eq!(committed.hook_list(), state.work_in_progress_list());
    assert_eq!(committed.len(), 2);
    assert_eq!(committed.accepted_layout_count(), 1);
    assert_eq!(committed.accepted_passive_count(), 0);

    let committed_records = committed.records();
    assert_eq!(committed_records[0].effect_index(), 0);
    assert_eq!(
        committed_records[0].previous_effect(),
        Some(previous_changed.effect())
    );
    assert_eq!(committed_records[0].effect(), changed.effect());
    assert_eq!(
        committed_records[0].previous_dependencies(),
        Some(deps(1021))
    );
    assert_eq!(committed_records[0].dependencies(), deps(1024));
    assert_eq!(
        committed_records[0].dependency_status(),
        Some(FunctionComponentEffectDependencyStatus::Changed)
    );
    assert!(committed_records[0].accepted_for_layout_commit());
    assert!(!committed_records[0].accepted_for_pending_passive());
    assert_eq!(committed_records[1].effect_index(), 1);
    assert_eq!(
        committed_records[1].previous_effect(),
        Some(previous_unchanged.effect())
    );
    assert_eq!(committed_records[1].effect(), unchanged.effect());
    assert_eq!(
        committed_records[1].dependency_status(),
        Some(FunctionComponentEffectDependencyStatus::Unchanged)
    );
    assert!(!committed_records[1].accepted_for_layout_commit());
    assert!(!committed_records[1].accepted_for_pending_passive());

    let firing_layout = hook_store
        .committed_layout_effect_metadata(work_in_progress, HookEffectFlags::LAYOUT_EFFECT);
    assert_eq!(firing_layout.len(), 1);
    assert_eq!(
        firing_layout[0].render_phase(),
        FunctionComponentHookRenderPhase::Update
    );
    assert_eq!(firing_layout[0].effect_index(), 0);
    assert_eq!(firing_layout[0].effect(), changed.effect());
    assert_eq!(
        firing_layout[0].previous_effect(),
        Some(previous_changed.effect())
    );
    assert_eq!(firing_layout[0].instance(), previous_changed.instance());
    assert_eq!(firing_layout[0].create(), callback(1023));
    assert_eq!(firing_layout[0].destroy(), Some(callback(1022)));
    assert_eq!(firing_layout[0].previous_dependencies(), Some(deps(1021)));
    assert_eq!(firing_layout[0].dependencies(), deps(1024));
    assert_eq!(
        firing_layout[0].dependency_status(),
        Some(FunctionComponentEffectDependencyStatus::Changed)
    );
    assert_eq!(
        firing_layout[0].dependency_phase(),
        FunctionComponentEffectDependencyPhase::UpdateChanged
    );
    assert_eq!(firing_layout[0].lanes(), Lanes::DEFAULT);

    let all_layout =
        hook_store.committed_layout_effect_metadata(work_in_progress, HookEffectFlags::LAYOUT);
    assert_eq!(all_layout.len(), 2);
    assert_eq!(all_layout[0].effect(), changed.effect());
    assert_eq!(all_layout[1].effect(), unchanged.effect());
    assert_eq!(
        all_layout[1].previous_effect(),
        Some(previous_unchanged.effect())
    );
    assert_eq!(
        all_layout[1].dependency_status(),
        Some(FunctionComponentEffectDependencyStatus::Unchanged)
    );
    assert_eq!(
        all_layout[1].dependency_phase(),
        FunctionComponentEffectDependencyPhase::UpdateUnchanged
    );
    assert!(
        hook_store
            .committed_passive_effect_metadata(work_in_progress, HookEffectFlags::PASSIVE)
            .is_empty()
    );
    assert!(
        hook_store
            .committed_layout_effect_metadata(work_in_progress, HookEffectFlags::PASSIVE)
            .is_empty()
    );
}

#[test]
fn function_component_effect_phase_maps_to_react_effect_flags() {
    assert_eq!(
        FunctionComponentEffectPhase::Insertion.hook_flags(),
        HookEffectFlags::INSERTION
    );
    assert_eq!(
        FunctionComponentEffectPhase::Insertion.mount_fiber_flags(),
        FiberFlags::UPDATE
    );
    assert_eq!(
        FunctionComponentEffectPhase::Layout.mount_fiber_flags(),
        FiberFlags::UPDATE | FiberFlags::LAYOUT_STATIC
    );
    assert_eq!(
        FunctionComponentEffectPhase::Passive.update_fiber_flags(),
        FiberFlags::PASSIVE
    );
}

#[test]
fn function_component_render_reports_unsupported_component_shapes() {
    let mut arena = FiberArena::new();
    let class_fiber = arena.create_fiber(
        FiberTag::ClassComponent,
        None,
        PropsHandle::NONE,
        FiberMode::NO,
    );
    let context_fiber = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::NONE,
        FiberMode::NO,
    );
    let throw_fiber = arena.create_fiber(FiberTag::Throw, None, PropsHandle::NONE, FiberMode::NO);
    let mut registry = TestFunctionComponentRegistry::default();

    assert_eq!(
        render_function_component(&mut arena, class_fiber, Lanes::DEFAULT, &mut registry),
        Err(FunctionComponentRenderError::Unsupported {
            fiber: class_fiber,
            feature: UnsupportedFunctionComponentFeature::ClassComponent,
        })
    );
    assert_eq!(
        render_function_component(&mut arena, context_fiber, Lanes::DEFAULT, &mut registry),
        Err(FunctionComponentRenderError::Unsupported {
            fiber: context_fiber,
            feature: UnsupportedFunctionComponentFeature::Context,
        })
    );
    assert_eq!(
        render_function_component(&mut arena, throw_fiber, Lanes::DEFAULT, &mut registry),
        Err(FunctionComponentRenderError::Unsupported {
            fiber: throw_fiber,
            feature: UnsupportedFunctionComponentFeature::ThrownValue,
        })
    );
}

#[test]
fn function_component_render_propagates_unsupported_hooks_context_and_thrown_values() {
    let unsupported = [
        FunctionComponentInvocationError::unsupported_hook("useState"),
        FunctionComponentInvocationError::unsupported_hook("useCallback"),
        FunctionComponentInvocationError::unsupported_hook("useMemo"),
        FunctionComponentInvocationError::unsupported_hook("useRef"),
        FunctionComponentInvocationError::unsupported_context(),
        FunctionComponentInvocationError::unsupported_thrown_value(),
    ];

    for invocation_error in unsupported {
        let (mut arena, _current, work_in_progress, component) = function_component_pair();
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Err(invocation_error.clone()));

        let error =
            render_function_component(&mut arena, work_in_progress, Lanes::DEFAULT, &mut registry)
                .unwrap_err();

        assert_eq!(
            error,
            FunctionComponentRenderError::Invocation {
                fiber: work_in_progress,
                component,
                error: invocation_error,
            }
        );
    }
}

#[test]
fn function_component_render_does_not_mutate_host_or_commit_root_work() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let root_current = store.root(root_id).unwrap().current();
    let current = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(1),
        FiberMode::NO,
    );
    let component = FiberTypeHandle::from_raw(101);
    store
        .fiber_arena_mut()
        .get_mut(current)
        .unwrap()
        .set_fiber_type(component);
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current, PropsHandle::from_raw(2))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(55)));
    let mut hook_store = FunctionComponentHookRenderStore::new();

    let record = render_function_component_with_hook_state(
        store.fiber_arena_mut(),
        &mut hook_store,
        work_in_progress,
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();

    let state = record.hook_state().unwrap();
    let mut cursor = hook_store.begin_render_cursor(state).unwrap();
    let state_record = hook_store
        .mount_state_hook(&mut cursor, StateHandle::from_raw(600))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    let dispatch_record = hook_store
        .dispatch_state_update(FunctionComponentStateDispatchRequest::new(
            state_record.dispatch(),
            action(950),
            lane,
        ))
        .unwrap();
    hook_store.finish_render_cursor(cursor).unwrap();

    assert_eq!(record.output(), FunctionComponentOutputHandle::from_raw(55));
    assert_eq!(dispatch_record.queue(), state_record.queue());
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(state_record.queue())
            .unwrap(),
        vec![dispatch_record.update()]
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), root_current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
}
