use super::*;
use crate::function_component::{
    FunctionComponentContextChangePropagationRequest, FunctionComponentContextReadRecord,
    FunctionComponentContextRenderReader, FunctionComponentInvocationError,
    FunctionComponentInvocationRequest, FunctionComponentSingleChildOutput,
    FunctionComponentSingleChildOutputResolver, FunctionComponentSingleChildReconciliationError,
    FunctionComponentStateDispatchRequest, FunctionComponentStateUpdateRenderLanes,
    propagate_context_change_to_function_component_dependencies,
};
use crate::test_support::{FakeContainer, RecordingHost};
use crate::{FiberRootId, FiberRootStore, RootElementHandle, RootOptions};
use fast_react_core::{
    ContextHandle, ContextStackSnapshot, ContextValueChange, ContextValueHandle,
    DependenciesHandle, ElementTypeHandle, FiberFlags, FiberMode, FiberTypeHandle, HookUpdateLane,
    Lane, PropsHandle, ReactKey, StateHandle, StateNodeHandle, UpdateQueueHandle,
};

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
    ReadOnce { context: ContextHandle },
    ReadTwice { context: ContextHandle },
}

#[derive(Debug, Clone, Copy)]
struct RegisteredUseContextComponent {
    component: FiberTypeHandle,
    behavior: UseContextBehavior,
}

#[derive(Debug)]
struct TestUseContextComponentRegistry {
    components: Vec<RegisteredUseContextComponent>,
    calls: Vec<FunctionComponentInvocationRequest>,
    reads: Vec<FunctionComponentContextReadRecord>,
}

impl TestUseContextComponentRegistry {
    fn new(component: FiberTypeHandle, behavior: UseContextBehavior) -> Self {
        let mut registry = Self {
            components: Vec::new(),
            calls: Vec::new(),
            reads: Vec::new(),
        };
        registry.register(component, behavior);
        registry
    }

    fn register(&mut self, component: FiberTypeHandle, behavior: UseContextBehavior) {
        self.components.push(RegisteredUseContextComponent {
            component,
            behavior,
        });
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
        let Some(component) = self
            .components
            .iter()
            .find(|component| component.component == request.component())
        else {
            return Err(FunctionComponentRenderError::Invocation {
                fiber: request.fiber(),
                component: request.component(),
                error: FunctionComponentInvocationError::component_error(
                    "missing use_context test component registration",
                ),
            });
        };

        match component.behavior {
            UseContextBehavior::ReadOnce { context } => {
                let read = reader.use_context(context)?;
                self.reads.push(read);
                Ok(FunctionComponentOutputHandle::from_raw(read.value().raw()))
            }
            UseContextBehavior::ReadTwice { context } => {
                let first = reader.use_context(context)?;
                let second = reader.read_context(context)?;
                self.reads.push(first);
                self.reads.push(second);
                Ok(FunctionComponentOutputHandle::from_raw(
                    second.value().raw(),
                ))
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

#[derive(Debug, Clone, Copy)]
struct FakeProviderBoundary {
    fiber: FiberId,
    context: ContextHandle,
    value: ContextValueHandle,
}

fn context_value(raw: u64) -> ContextValueHandle {
    ContextValueHandle::from_raw(raw)
}

fn action(raw: u64) -> FunctionComponentStateActionHandle {
    FunctionComponentStateActionHandle::from_raw(raw)
}

fn action_as_state(
    _state: StateHandle,
    action: &FunctionComponentStateActionHandle,
) -> StateHandle {
    StateHandle::from_raw(action.raw())
}

fn push_fake_provider_boundary(
    arena: &FiberArena,
    context_store: &mut FunctionComponentContextRenderStore,
    boundary: FakeProviderBoundary,
) -> ContextStackSnapshot {
    assert_eq!(
        arena.get(boundary.fiber).unwrap().tag(),
        FiberTag::ContextProvider
    );
    context_store
        .push_provider(boundary.context, boundary.value)
        .unwrap()
}

fn function_component_pair() -> (FiberArena, FiberId, FiberId, FiberTypeHandle) {
    let mut arena = FiberArena::new();
    let current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(1),
        FiberMode::NO,
    );
    let component = FiberTypeHandle::from_raw(200);
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
    let component = FiberTypeHandle::from_raw(200);
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

fn mark_same_props_for_bailout(
    arena: &mut FiberArena,
    current: FiberId,
    work_in_progress: FiberId,
    props: PropsHandle,
) {
    arena.get_mut(current).unwrap().set_memoized_props(props);
    arena
        .get_mut(work_in_progress)
        .unwrap()
        .set_memoized_props(props);
}

fn fragment_with_host_child(
    child_tag: FiberTag,
    fragment_props: PropsHandle,
    child_props: PropsHandle,
) -> (FiberArena, FiberId, FiberId) {
    assert!(matches!(
        child_tag,
        FiberTag::HostComponent | FiberTag::HostText
    ));
    let mut arena = FiberArena::new();
    let fragment = arena.create_fiber(FiberTag::Fragment, None, fragment_props, FiberMode::NO);
    let child = arena.create_fiber(child_tag, None, child_props, FiberMode::NO);
    arena.set_children(fragment, &[child]).unwrap();

    (arena, fragment, child)
}

#[test]
fn begin_work_context_stack_canary_pushes_reads_and_unwinds_around_fake_provider_boundary() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(10);
    let provided_value = context_value(20);
    let context = context_store.create_context(default_value);
    assert_eq!(context_store.current_value(context).unwrap(), default_value);

    let (mut arena, _current, child_work_in_progress, component) = function_component_pair();
    let provider_current = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(30),
        FiberMode::NO,
    );
    let provider_work_in_progress = arena
        .create_work_in_progress(provider_current, PropsHandle::from_raw(31))
        .unwrap();
    arena
        .set_children(provider_work_in_progress, &[child_work_in_progress])
        .unwrap();
    assert_eq!(
        arena.get(child_work_in_progress).unwrap().return_fiber(),
        Some(provider_work_in_progress)
    );

    let before_provider = push_fake_provider_boundary(
        &arena,
        &mut context_store,
        FakeProviderBoundary {
            fiber: provider_work_in_progress,
            context,
            value: provided_value,
        },
    );
    assert!(before_provider.is_root());
    assert_eq!(
        context_store.current_value(context).unwrap(),
        provided_value
    );
    assert_eq!(context_store.stack_depth(), 1);

    let output = FunctionComponentOutputHandle::from_raw(90);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let result = begin_work_with_context_reads(
        &mut arena,
        BeginWorkRequest::new(child_work_in_progress, Lanes::DEFAULT),
        &mut context_store,
        &[context],
        &mut registry,
    )
    .unwrap()
    .function_component();

    assert_eq!(result.output(), output);
    assert_eq!(result.render().component(), component);
    assert_eq!(result.context_read_count(), 1);
    let context_state = result.context_state().unwrap();
    assert_eq!(context_state.render_fiber(), child_work_in_progress);
    assert_eq!(context_state.stack_depth(), 1);
    assert_eq!(registry.calls()[0].context_state(), Some(context_state));

    let reads = context_store.context_reads_for_record(result.render());
    assert_eq!(reads.len(), 1);
    assert_eq!(reads[0].fiber(), child_work_in_progress);
    assert_eq!(reads[0].context(), context);
    assert_eq!(reads[0].default_value(), default_value);
    assert_eq!(reads[0].value(), provided_value);
    assert_eq!(reads[0].active_provider_count(), 1);

    context_store.restore_snapshot(before_provider).unwrap();
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
}

#[test]
fn context_provider_begin_work_pushes_delegates_child_read_and_unwinds() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(110);
    let provided_value = context_value(120);
    let context = context_store.create_context(default_value);
    let (mut arena, _current, child_work_in_progress, component) = function_component_pair();
    let provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(130),
        FiberMode::NO,
    );
    arena
        .set_children(provider, &[child_work_in_progress])
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(140);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let record = begin_work_context_provider_child(
        &mut arena,
        ContextProviderBeginWorkRequest::new(provider, Lanes::DEFAULT, context, provided_value),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.provider(), provider);
    assert_eq!(record.child(), child_work_in_progress);
    assert_eq!(record.context(), context);
    assert_eq!(record.value(), provided_value);
    assert!(record.provider_snapshot().is_root());
    assert_eq!(record.pushed_stack_depth(), 1);
    assert_eq!(record.restored_stack_depth(), 0);
    assert_eq!(record.child_output(), output);
    assert_eq!(record.child_context_read_count(), 1);
    assert_eq!(
        record.child_begin_work().work_in_progress(),
        child_work_in_progress
    );
    assert_eq!(
        record.child_render().context_state().unwrap().stack_depth(),
        1
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(
        registry.calls()[0].context_state(),
        record.child_render().context_state()
    );

    let reads = context_store.context_reads_for_record(record.child_render());
    assert_eq!(reads.len(), 1);
    assert_eq!(reads[0].fiber(), child_work_in_progress);
    assert_eq!(reads[0].context(), context);
    assert_eq!(reads[0].default_value(), default_value);
    assert_eq!(reads[0].value(), provided_value);
    assert_eq!(reads[0].active_provider_count(), 1);
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
    assert_eq!(
        arena.get(provider).unwrap().memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn context_provider_use_context_child_reads_provider_value_during_invocation() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(180);
    let provided_value = context_value(181);
    let context = context_store.create_context(default_value);
    let (mut arena, _current, child_work_in_progress, component) = function_component_pair();
    let provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(182),
        FiberMode::NO,
    );
    arena
        .set_children(provider, &[child_work_in_progress])
        .unwrap();
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadOnce { context });

    let record = begin_work_context_provider_use_context_child(
        &mut arena,
        ContextProviderBeginWorkRequest::new(provider, Lanes::DEFAULT, context, provided_value),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.provider(), provider);
    assert_eq!(record.child(), child_work_in_progress);
    assert_eq!(record.context(), context);
    assert_eq!(record.value(), provided_value);
    assert!(record.provider_snapshot().is_root());
    assert_eq!(record.pushed_stack_depth(), 1);
    assert_eq!(record.restored_stack_depth(), 0);
    assert_eq!(
        record.child_output(),
        FunctionComponentOutputHandle::from_raw(provided_value.raw())
    );
    assert_eq!(record.child_context_read_count(), 1);
    assert_eq!(
        record.child_begin_work().work_in_progress(),
        child_work_in_progress
    );
    let read = record.child_context_read();
    assert_eq!(read.fiber(), child_work_in_progress);
    assert_eq!(read.context(), context);
    assert_eq!(read.default_value(), default_value);
    assert_eq!(read.value(), provided_value);
    assert_eq!(read.active_provider_count(), 1);
    assert_eq!(record.child_context_dependency(), read.dependency());
    assert_eq!(context_store.context_dependencies().len(), 1);
    let dependency = context_store.context_dependencies()[0];
    assert_eq!(dependency.handle(), read.dependency());
    assert_eq!(dependency.fiber(), child_work_in_progress);
    assert_eq!(dependency.context(), record.context());
    assert_eq!(dependency.memoized_value(), record.value());
    assert_eq!(dependency.render_lanes(), Lanes::DEFAULT);
    assert_eq!(dependency.dependency_lanes(), Lanes::NO);
    assert_eq!(
        dependency.next(),
        FunctionComponentContextDependencyHandle::NONE
    );
    assert!(!dependency.renderer_visible_propagation());
    assert_eq!(registry.reads(), &[read]);
    assert_eq!(
        context_store.context_reads_for_record(record.child_render()),
        &[read]
    );
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
    assert_eq!(
        arena.get(child_work_in_progress).unwrap().memoized_props(),
        PropsHandle::from_raw(2)
    );
}

#[test]
fn context_provider_use_context_complete_traversal_begin_leaves_provider_stack_open() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(185);
    let provided_value = context_value(186);
    let context = context_store.create_context(default_value);
    let (mut arena, _current, child_work_in_progress, component) = function_component_pair();
    let provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(187),
        FiberMode::NO,
    );
    arena
        .set_children(provider, &[child_work_in_progress])
        .unwrap();
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadOnce { context });
    let output = FunctionComponentOutputHandle::from_raw(provided_value.raw());
    let child_element = RootElementHandle::from_raw(provided_value.raw());
    let resolver =
        StaticSingleChildResolver::new(Some(FunctionComponentSingleChildOutput::host_text(
            output,
            child_element,
            PropsHandle::from_raw(188),
        )));

    let record = begin_work_context_provider_use_context_single_child_for_complete_traversal(
        &mut arena,
        ContextProviderBeginWorkRequest::new(provider, Lanes::DEFAULT, context, provided_value),
        &mut context_store,
        &mut registry,
        &resolver,
    )
    .unwrap();

    assert_eq!(record.provider(), provider);
    assert_eq!(record.child(), child_work_in_progress);
    assert_eq!(record.context(), context);
    assert_eq!(record.value(), provided_value);
    assert!(record.provider_snapshot().is_root());
    assert_eq!(record.pushed_stack_depth(), 1);
    assert_eq!(record.child_element(), child_element);
    assert_eq!(record.child_tag(), FiberTag::HostText);
    assert_eq!(record.child_context_read_count(), 1);
    let read = record.child_context_read();
    assert_eq!(read.value(), provided_value);
    assert_eq!(read.active_provider_count(), 1);
    assert_eq!(
        context_store.current_value(context).unwrap(),
        provided_value
    );
    assert_eq!(context_store.stack_depth(), 1);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 1);

    context_store
        .restore_snapshot(record.provider_snapshot())
        .unwrap();
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
}

#[test]
fn context_provider_use_context_subtree_walks_bounded_wrappers_and_unwinds() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(189);
    let provided_value = context_value(190);
    let context = context_store.create_context(default_value);
    let mut arena = FiberArena::new();
    let provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(191),
        FiberMode::NO,
    );
    let first_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(192),
        FiberMode::NO,
    );
    let first_component = FiberTypeHandle::from_raw(193);
    arena
        .get_mut(first_current)
        .unwrap()
        .set_fiber_type(first_component);
    let first_work_in_progress = arena
        .create_work_in_progress(first_current, PropsHandle::from_raw(194))
        .unwrap();
    let fragment = arena.create_fiber(
        FiberTag::Fragment,
        None,
        PropsHandle::from_raw(195),
        FiberMode::NO,
    );
    let second_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(196),
        FiberMode::NO,
    );
    let second_component = FiberTypeHandle::from_raw(197);
    arena
        .get_mut(second_current)
        .unwrap()
        .set_fiber_type(second_component);
    let second_work_in_progress = arena
        .create_work_in_progress(second_current, PropsHandle::from_raw(198))
        .unwrap();
    let host_component = arena.create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(199),
        FiberMode::NO,
    );
    let third_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(200),
        FiberMode::NO,
    );
    let third_component = FiberTypeHandle::from_raw(201);
    arena
        .get_mut(third_current)
        .unwrap()
        .set_fiber_type(third_component);
    let third_work_in_progress = arena
        .create_work_in_progress(third_current, PropsHandle::from_raw(202))
        .unwrap();
    let text = arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(203),
        FiberMode::NO,
    );
    arena
        .set_children(fragment, &[second_work_in_progress])
        .unwrap();
    arena
        .set_children(host_component, &[third_work_in_progress])
        .unwrap();
    arena
        .set_children(
            provider,
            &[first_work_in_progress, fragment, host_component, text],
        )
        .unwrap();
    let mut registry = TestUseContextComponentRegistry::new(
        first_component,
        UseContextBehavior::ReadOnce { context },
    );
    registry.register(second_component, UseContextBehavior::ReadOnce { context });
    registry.register(third_component, UseContextBehavior::ReadOnce { context });

    let record = begin_work_context_provider_use_context_subtree(
        &mut arena,
        ContextProviderBeginWorkRequest::new(provider, Lanes::DEFAULT, context, provided_value),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.provider(), provider);
    assert_eq!(record.context(), context);
    assert_eq!(record.value(), provided_value);
    assert!(record.provider_snapshot().is_root());
    assert!(record.provider_token().is_some());
    assert_eq!(record.pushed_stack_depth(), 1);
    assert_eq!(record.restored_stack_depth(), 0);
    assert_eq!(record.consumer_count(), 3);
    assert_eq!(
        record
            .visited_fibers()
            .iter()
            .map(|visited| (
                visited.traversal_index(),
                visited.fiber(),
                visited.tag(),
                visited.depth()
            ))
            .collect::<Vec<_>>(),
        vec![
            (0, first_work_in_progress, FiberTag::FunctionComponent, 1),
            (1, fragment, FiberTag::Fragment, 1),
            (2, second_work_in_progress, FiberTag::FunctionComponent, 2),
            (3, host_component, FiberTag::HostComponent, 1),
            (4, third_work_in_progress, FiberTag::FunctionComponent, 2),
            (5, text, FiberTag::HostText, 1),
        ]
    );
    let consumers = record.consumers();
    assert_eq!(consumers[0].fiber(), first_work_in_progress);
    assert_eq!(consumers[0].traversal_index(), 0);
    assert_eq!(consumers[0].depth(), 1);
    assert_eq!(consumers[1].fiber(), second_work_in_progress);
    assert_eq!(consumers[1].traversal_index(), 2);
    assert_eq!(consumers[1].depth(), 2);
    assert_eq!(consumers[2].fiber(), third_work_in_progress);
    assert_eq!(consumers[2].traversal_index(), 4);
    assert_eq!(consumers[2].depth(), 2);
    assert_eq!(
        registry
            .calls()
            .iter()
            .map(|request| request.fiber())
            .collect::<Vec<_>>(),
        vec![
            first_work_in_progress,
            second_work_in_progress,
            third_work_in_progress
        ]
    );
    for (consumer, read) in consumers.iter().zip(registry.reads()) {
        assert_eq!(consumer.child_context_read(), *read);
        assert_eq!(read.context(), context);
        assert_eq!(read.value(), provided_value);
        assert_eq!(read.active_provider_count(), 1);
    }
    assert_eq!(context_store.context_dependencies().len(), 3);
    for dependency in context_store.context_dependencies() {
        assert_eq!(dependency.context(), context);
        assert_eq!(dependency.memoized_value(), provided_value);
        assert!(!dependency.renderer_visible_propagation());
        assert_eq!(dependency.propagation_flags(), FiberFlags::NO);
    }
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
}

#[test]
fn context_provider_use_context_child_rejects_other_context_read_and_unwinds() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let provider_default = context_value(190);
    let provided_value = context_value(191);
    let other_default = context_value(192);
    let provider_context = context_store.create_context(provider_default);
    let other_context = context_store.create_context(other_default);
    let (mut arena, _current, child_work_in_progress, component) = function_component_pair();
    let provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(193),
        FiberMode::NO,
    );
    arena
        .set_children(provider, &[child_work_in_progress])
        .unwrap();
    let mut registry = TestUseContextComponentRegistry::new(
        component,
        UseContextBehavior::ReadOnce {
            context: other_context,
        },
    );

    let error = begin_work_context_provider_use_context_child(
        &mut arena,
        ContextProviderBeginWorkRequest::new(
            provider,
            Lanes::DEFAULT,
            provider_context,
            provided_value,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        ContextProviderBeginWorkError::ChildBeginWork {
            provider,
            child: child_work_in_progress,
            error: Box::new(BeginWorkError::FunctionComponent(
                FunctionComponentRenderError::UnexpectedUseContextContext {
                    fiber: child_work_in_progress,
                    expected: provider_context,
                    actual: other_context,
                },
            )),
        }
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.reads().len(), 1);
    let read = registry.reads()[0];
    assert_eq!(read.fiber(), child_work_in_progress);
    assert_eq!(read.context(), other_context);
    assert_eq!(read.default_value(), other_default);
    assert_eq!(read.value(), other_default);
    assert_eq!(read.active_provider_count(), 0);
    assert_eq!(context_store.context_reads(), &[read]);
    assert_eq!(context_store.context_dependencies().len(), 1);
    let dependency = context_store.context_dependencies()[0];
    assert_eq!(dependency.handle(), read.dependency());
    assert_eq!(dependency.context(), other_context);
    assert_eq!(dependency.memoized_value(), other_default);
    assert_eq!(dependency.dependency_lanes(), Lanes::NO);
    assert!(!dependency.renderer_visible_propagation());
    assert_eq!(
        context_store.current_value(provider_context).unwrap(),
        provider_default
    );
    assert_eq!(
        context_store.current_value(other_context).unwrap(),
        other_default
    );
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(
        context_store
            .active_provider_count(provider_context)
            .unwrap(),
        0
    );
    assert_eq!(
        arena.get(child_work_in_progress).unwrap().memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn nested_context_provider_begin_work_pushes_reads_and_unwinds_in_lifo_order() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let outer_default = context_value(150);
    let inner_default = context_value(160);
    let outer_value = context_value(151);
    let inner_value = context_value(161);
    let outer_context = context_store.create_context(outer_default);
    let inner_context = context_store.create_context(inner_default);
    let (mut arena, _current, child_work_in_progress, component) = function_component_pair();
    let outer_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(170),
        FiberMode::NO,
    );
    let inner_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(171),
        FiberMode::NO,
    );
    arena
        .set_children(inner_provider, &[child_work_in_progress])
        .unwrap();
    arena
        .set_children(outer_provider, &[inner_provider])
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(172);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let record = begin_work_nested_context_provider_child(
        &mut arena,
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            Lanes::DEFAULT,
            outer_context,
            outer_value,
            inner_context,
            inner_value,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.outer_provider(), outer_provider);
    assert_eq!(record.inner_provider(), inner_provider);
    assert_eq!(record.child(), child_work_in_progress);
    assert_eq!(record.outer_context(), outer_context);
    assert_eq!(record.outer_value(), outer_value);
    assert_eq!(record.inner_context(), inner_context);
    assert_eq!(record.inner_value(), inner_value);
    assert!(record.outer_provider_snapshot().is_root());
    assert_eq!(record.inner_provider_snapshot().depth(), 1);
    assert_eq!(record.outer_pushed_stack_depth(), 1);
    assert_eq!(record.inner_pushed_stack_depth(), 2);
    assert_eq!(record.inner_restored_stack_depth(), 1);
    assert_eq!(record.outer_restored_stack_depth(), 0);
    assert_eq!(record.child_output(), output);
    assert_eq!(record.child_context_read_count(), 2);
    assert_eq!(
        record.child_begin_work().work_in_progress(),
        child_work_in_progress
    );
    let context_state = record.child_render().context_state().unwrap();
    assert_eq!(context_state.render_fiber(), child_work_in_progress);
    assert_eq!(context_state.stack_depth(), 2);
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.calls()[0].context_state(), Some(context_state));

    let reads = context_store.context_reads_for_record(record.child_render());
    assert_eq!(reads.len(), 2);
    assert_eq!(reads[0].fiber(), child_work_in_progress);
    assert_eq!(reads[0].context(), outer_context);
    assert_eq!(reads[0].default_value(), outer_default);
    assert_eq!(reads[0].value(), outer_value);
    assert_eq!(reads[0].active_provider_count(), 1);
    assert_eq!(reads[1].fiber(), child_work_in_progress);
    assert_eq!(reads[1].context(), inner_context);
    assert_eq!(reads[1].default_value(), inner_default);
    assert_eq!(reads[1].value(), inner_value);
    assert_eq!(reads[1].active_provider_count(), 1);
    assert_eq!(
        context_store.current_value(outer_context).unwrap(),
        outer_default
    );
    assert_eq!(
        context_store.current_value(inner_context).unwrap(),
        inner_default
    );
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(
        context_store.active_provider_count(outer_context).unwrap(),
        0
    );
    assert_eq!(
        context_store.active_provider_count(inner_context).unwrap(),
        0
    );
    assert_eq!(
        arena.get(outer_provider).unwrap().memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn nested_context_provider_use_context_child_reads_nearest_provider_value() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(430);
    let outer_value = context_value(431);
    let inner_value = context_value(432);
    let context = context_store.create_context(default_value);
    let (mut arena, _current, child_work_in_progress, component) = function_component_pair();
    let outer_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(433),
        FiberMode::NO,
    );
    let inner_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(434),
        FiberMode::NO,
    );
    arena
        .set_children(inner_provider, &[child_work_in_progress])
        .unwrap();
    arena
        .set_children(outer_provider, &[inner_provider])
        .unwrap();
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadOnce { context });

    let record = begin_work_nested_context_provider_use_context_child(
        &mut arena,
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            Lanes::DEFAULT,
            context,
            outer_value,
            context,
            inner_value,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.outer_provider(), outer_provider);
    assert_eq!(record.inner_provider(), inner_provider);
    assert_eq!(record.child(), child_work_in_progress);
    assert_eq!(record.outer_context(), context);
    assert_eq!(record.inner_context(), context);
    assert_eq!(record.outer_value(), outer_value);
    assert_eq!(record.inner_value(), inner_value);
    assert_eq!(record.outer_pushed_stack_depth(), 1);
    assert_eq!(record.inner_pushed_stack_depth(), 2);
    assert_eq!(record.inner_restored_stack_depth(), 1);
    assert_eq!(record.outer_restored_stack_depth(), 0);
    assert_eq!(
        record.child_output(),
        FunctionComponentOutputHandle::from_raw(inner_value.raw())
    );
    assert_eq!(record.child_context_read_count(), 1);
    let read = record.child_context_read();
    assert_eq!(read.fiber(), child_work_in_progress);
    assert_eq!(read.context(), context);
    assert_eq!(read.default_value(), default_value);
    assert_eq!(read.value(), inner_value);
    assert_eq!(read.active_provider_count(), 2);
    assert_eq!(record.child_context_dependency(), read.dependency());
    assert_eq!(context_store.context_dependencies().len(), 1);
    let dependency = context_store.context_dependencies()[0];
    assert_eq!(dependency.handle(), read.dependency());
    assert_eq!(dependency.context(), context);
    assert_eq!(dependency.memoized_value(), inner_value);
    assert_eq!(dependency.dependency_lanes(), Lanes::NO);
    assert!(!dependency.renderer_visible_propagation());
    assert_eq!(registry.reads(), &[read]);
    assert_eq!(
        context_store.context_reads_for_record(record.child_render()),
        &[read]
    );
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
    assert_eq!(
        arena.get(child_work_in_progress).unwrap().memoized_props(),
        PropsHandle::from_raw(2)
    );
}

#[test]
fn nested_context_provider_two_consumer_use_context_children_read_inner_provider_and_unwind() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(450);
    let outer_value = context_value(451);
    let inner_value = context_value(452);
    let context = context_store.create_context(default_value);
    let mut arena = FiberArena::new();
    let outer_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(453),
        FiberMode::NO,
    );
    let inner_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(454),
        FiberMode::NO,
    );
    let first_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(455),
        FiberMode::NO,
    );
    let first_component = FiberTypeHandle::from_raw(456);
    arena
        .get_mut(first_current)
        .unwrap()
        .set_fiber_type(first_component);
    let first_work_in_progress = arena
        .create_work_in_progress(first_current, PropsHandle::from_raw(457))
        .unwrap();
    let second_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(458),
        FiberMode::NO,
    );
    let second_component = FiberTypeHandle::from_raw(459);
    arena
        .get_mut(second_current)
        .unwrap()
        .set_fiber_type(second_component);
    let second_work_in_progress = arena
        .create_work_in_progress(second_current, PropsHandle::from_raw(460))
        .unwrap();
    arena
        .set_children(
            inner_provider,
            &[first_work_in_progress, second_work_in_progress],
        )
        .unwrap();
    arena
        .set_children(outer_provider, &[inner_provider])
        .unwrap();
    let mut registry = TestUseContextComponentRegistry::new(
        first_component,
        UseContextBehavior::ReadOnce { context },
    );
    registry.register(second_component, UseContextBehavior::ReadOnce { context });

    let record = begin_work_nested_context_provider_two_consumer_use_context_children(
        &mut arena,
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            Lanes::DEFAULT,
            context,
            outer_value,
            context,
            inner_value,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.outer_provider(), outer_provider);
    assert_eq!(record.inner_provider(), inner_provider);
    assert_eq!(record.first_child(), first_work_in_progress);
    assert_eq!(record.second_child(), second_work_in_progress);
    assert_eq!(record.outer_context(), context);
    assert_eq!(record.inner_context(), context);
    assert_eq!(record.outer_value(), outer_value);
    assert_eq!(record.inner_value(), inner_value);
    assert!(record.outer_provider_snapshot().is_root());
    assert_eq!(record.inner_provider_snapshot().depth(), 1);
    assert!(record.outer_provider_token().is_some());
    assert!(record.inner_provider_token().is_some());
    assert_ne!(record.outer_provider_token(), record.inner_provider_token());
    assert_eq!(record.outer_pushed_stack_depth(), 1);
    assert_eq!(record.inner_pushed_stack_depth(), 2);
    assert_eq!(record.inner_restored_stack_depth(), 1);
    assert_eq!(record.outer_restored_stack_depth(), 0);
    assert_eq!(record.first_child_context_read_count(), 1);
    assert_eq!(record.second_child_context_read_count(), 1);
    assert_eq!(
        record.first_child_output(),
        FunctionComponentOutputHandle::from_raw(inner_value.raw())
    );
    assert_eq!(
        record.second_child_output(),
        FunctionComponentOutputHandle::from_raw(inner_value.raw())
    );
    assert_eq!(registry.calls().len(), 2);
    assert_eq!(registry.calls()[0].fiber(), first_work_in_progress);
    assert_eq!(registry.calls()[1].fiber(), second_work_in_progress);
    assert_eq!(
        registry.calls()[0].context_state().unwrap().stack_depth(),
        2
    );
    assert_eq!(
        registry.calls()[1].context_state().unwrap().stack_depth(),
        2
    );

    let first_read = record.first_child_context_read();
    let second_read = record.second_child_context_read();
    assert_eq!(registry.reads(), &[first_read, second_read]);
    for (read, child) in [
        (first_read, first_work_in_progress),
        (second_read, second_work_in_progress),
    ] {
        assert_eq!(read.fiber(), child);
        assert_eq!(read.context(), context);
        assert_eq!(read.default_value(), default_value);
        assert_eq!(read.value(), inner_value);
        assert_eq!(read.active_provider_count(), 2);
    }
    assert_eq!(
        record.first_child_context_dependency(),
        first_read.dependency()
    );
    assert_eq!(
        record.second_child_context_dependency(),
        second_read.dependency()
    );
    assert_eq!(
        context_store.context_reads_for_record(record.first_child_render()),
        &[first_read]
    );
    assert_eq!(
        context_store.context_reads_for_record(record.second_child_render()),
        &[second_read]
    );
    assert_eq!(context_store.context_dependencies().len(), 2);
    let first_dependency = context_store.context_dependencies()[0];
    let second_dependency = context_store.context_dependencies()[1];
    assert_eq!(first_dependency.handle(), first_read.dependency());
    assert_eq!(first_dependency.fiber(), first_work_in_progress);
    assert_eq!(first_dependency.context(), context);
    assert_eq!(first_dependency.memoized_value(), inner_value);
    assert_eq!(first_dependency.dependency_lanes(), Lanes::NO);
    assert_eq!(
        first_dependency.next(),
        FunctionComponentContextDependencyHandle::NONE
    );
    assert_eq!(second_dependency.handle(), second_read.dependency());
    assert_eq!(second_dependency.fiber(), second_work_in_progress);
    assert_eq!(second_dependency.context(), context);
    assert_eq!(second_dependency.memoized_value(), inner_value);
    assert_eq!(second_dependency.dependency_lanes(), Lanes::NO);
    assert_eq!(
        second_dependency.next(),
        FunctionComponentContextDependencyHandle::NONE
    );
    assert!(!first_dependency.renderer_visible_propagation());
    assert!(!second_dependency.renderer_visible_propagation());
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
    assert_eq!(
        arena.get(inner_provider).unwrap().child(),
        Some(first_work_in_progress)
    );
    assert_eq!(
        arena.get(first_work_in_progress).unwrap().sibling(),
        Some(second_work_in_progress)
    );
    assert_eq!(arena.get(second_work_in_progress).unwrap().sibling(), None);
}

#[test]
fn nested_context_provider_two_provider_use_context_children_read_distinct_providers() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let outer_default_value = context_value(461);
    let inner_default_value = context_value(462);
    let outer_value = context_value(463);
    let inner_value = context_value(464);
    let outer_context = context_store.create_context(outer_default_value);
    let inner_context = context_store.create_context(inner_default_value);
    let mut arena = FiberArena::new();
    let outer_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(465),
        FiberMode::NO,
    );
    let inner_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(466),
        FiberMode::NO,
    );
    let first_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(467),
        FiberMode::NO,
    );
    let first_component = FiberTypeHandle::from_raw(468);
    arena
        .get_mut(first_current)
        .unwrap()
        .set_fiber_type(first_component);
    let first_work_in_progress = arena
        .create_work_in_progress(first_current, PropsHandle::from_raw(469))
        .unwrap();
    let second_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(470),
        FiberMode::NO,
    );
    let second_component = FiberTypeHandle::from_raw(471);
    arena
        .get_mut(second_current)
        .unwrap()
        .set_fiber_type(second_component);
    let second_work_in_progress = arena
        .create_work_in_progress(second_current, PropsHandle::from_raw(472))
        .unwrap();
    arena
        .set_children(
            inner_provider,
            &[first_work_in_progress, second_work_in_progress],
        )
        .unwrap();
    arena
        .set_children(outer_provider, &[inner_provider])
        .unwrap();
    let mut registry = TestUseContextComponentRegistry::new(
        first_component,
        UseContextBehavior::ReadOnce {
            context: outer_context,
        },
    );
    registry.register(
        second_component,
        UseContextBehavior::ReadOnce {
            context: inner_context,
        },
    );

    let record = begin_work_nested_context_provider_two_provider_use_context_children(
        &mut arena,
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            Lanes::DEFAULT,
            outer_context,
            outer_value,
            inner_context,
            inner_value,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.outer_provider(), outer_provider);
    assert_eq!(record.inner_provider(), inner_provider);
    assert_eq!(record.first_child(), first_work_in_progress);
    assert_eq!(record.second_child(), second_work_in_progress);
    assert_eq!(record.outer_context(), outer_context);
    assert_eq!(record.inner_context(), inner_context);
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(record.outer_pushed_stack_depth(), 1);
    assert_eq!(record.inner_pushed_stack_depth(), 2);
    assert_eq!(record.inner_restored_stack_depth(), 1);
    assert_eq!(record.outer_restored_stack_depth(), 0);
    assert_eq!(registry.calls().len(), 2);
    assert_eq!(
        registry.calls()[0].context_state().unwrap().stack_depth(),
        2
    );
    assert_eq!(
        registry.calls()[1].context_state().unwrap().stack_depth(),
        2
    );

    let first_read = record.first_child_context_read();
    assert_eq!(first_read.fiber(), first_work_in_progress);
    assert_eq!(first_read.context(), outer_context);
    assert_eq!(first_read.default_value(), outer_default_value);
    assert_eq!(first_read.value(), outer_value);
    assert_eq!(first_read.active_provider_count(), 1);
    let second_read = record.second_child_context_read();
    assert_eq!(second_read.fiber(), second_work_in_progress);
    assert_eq!(second_read.context(), inner_context);
    assert_eq!(second_read.default_value(), inner_default_value);
    assert_eq!(second_read.value(), inner_value);
    assert_eq!(second_read.active_provider_count(), 1);
    assert_eq!(registry.reads(), &[first_read, second_read]);
    assert_eq!(
        context_store.current_value(outer_context).unwrap(),
        outer_default_value
    );
    assert_eq!(
        context_store.current_value(inner_context).unwrap(),
        inner_default_value
    );
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(
        context_store.active_provider_count(outer_context).unwrap(),
        0
    );
    assert_eq!(
        context_store.active_provider_count(inner_context).unwrap(),
        0
    );
}

#[test]
fn nested_context_provider_outer_inner_consumers_preserve_outer_value_and_unwind() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(516);
    let outer_value = context_value(517);
    let inner_value = context_value(518);
    let context = context_store.create_context(default_value);
    let mut arena = FiberArena::new();
    let outer_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(519),
        FiberMode::NO,
    );
    let inner_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(520),
        FiberMode::NO,
    );
    let outer_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(521),
        FiberMode::NO,
    );
    let outer_component = FiberTypeHandle::from_raw(522);
    arena
        .get_mut(outer_current)
        .unwrap()
        .set_fiber_type(outer_component);
    let outer_work_in_progress = arena
        .create_work_in_progress(outer_current, PropsHandle::from_raw(523))
        .unwrap();
    let inner_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(524),
        FiberMode::NO,
    );
    let inner_component = FiberTypeHandle::from_raw(525);
    arena
        .get_mut(inner_current)
        .unwrap()
        .set_fiber_type(inner_component);
    let inner_work_in_progress = arena
        .create_work_in_progress(inner_current, PropsHandle::from_raw(526))
        .unwrap();
    arena
        .set_children(inner_provider, &[inner_work_in_progress])
        .unwrap();
    arena
        .set_children(outer_provider, &[outer_work_in_progress, inner_provider])
        .unwrap();
    let mut registry = TestUseContextComponentRegistry::new(
        outer_component,
        UseContextBehavior::ReadOnce { context },
    );
    registry.register(inner_component, UseContextBehavior::ReadOnce { context });

    let record = begin_work_nested_context_provider_outer_inner_consumer_use_context_children(
        &mut arena,
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            Lanes::DEFAULT,
            context,
            outer_value,
            context,
            inner_value,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.outer_provider(), outer_provider);
    assert_eq!(record.inner_provider(), inner_provider);
    assert_eq!(record.outer_child(), outer_work_in_progress);
    assert_eq!(record.inner_child(), inner_work_in_progress);
    assert_eq!(record.outer_context(), context);
    assert_eq!(record.inner_context(), context);
    assert_eq!(record.outer_value(), outer_value);
    assert_eq!(record.inner_value(), inner_value);
    assert!(record.outer_provider_snapshot().is_root());
    assert_eq!(record.inner_provider_snapshot().depth(), 1);
    assert!(record.outer_provider_token().is_some());
    assert!(record.inner_provider_token().is_some());
    assert_ne!(record.outer_provider_token(), record.inner_provider_token());
    assert_eq!(record.outer_pushed_stack_depth(), 1);
    assert_eq!(record.inner_pushed_stack_depth(), 2);
    assert_eq!(record.inner_restored_stack_depth(), 1);
    assert_eq!(record.outer_restored_stack_depth(), 0);
    assert_eq!(record.outer_child_context_read_count(), 1);
    assert_eq!(record.inner_child_context_read_count(), 1);
    assert_eq!(
        record.outer_child_output(),
        FunctionComponentOutputHandle::from_raw(outer_value.raw())
    );
    assert_eq!(
        record.inner_child_output(),
        FunctionComponentOutputHandle::from_raw(inner_value.raw())
    );
    assert_eq!(registry.calls().len(), 2);
    assert_eq!(registry.calls()[0].fiber(), outer_work_in_progress);
    assert_eq!(registry.calls()[1].fiber(), inner_work_in_progress);
    assert_eq!(
        registry.calls()[0].context_state().unwrap().stack_depth(),
        1
    );
    assert_eq!(
        registry.calls()[1].context_state().unwrap().stack_depth(),
        2
    );

    let outer_read = record.outer_child_context_read();
    assert_eq!(outer_read.fiber(), outer_work_in_progress);
    assert_eq!(outer_read.context(), context);
    assert_eq!(outer_read.default_value(), default_value);
    assert_eq!(outer_read.value(), outer_value);
    assert_eq!(outer_read.active_provider_count(), 1);
    let inner_read = record.inner_child_context_read();
    assert_eq!(inner_read.fiber(), inner_work_in_progress);
    assert_eq!(inner_read.context(), context);
    assert_eq!(inner_read.default_value(), default_value);
    assert_eq!(inner_read.value(), inner_value);
    assert_eq!(inner_read.active_provider_count(), 2);
    assert_eq!(registry.reads(), &[outer_read, inner_read]);
    assert_eq!(
        context_store.context_reads_for_record(record.outer_child_render()),
        &[outer_read]
    );
    assert_eq!(
        context_store.context_reads_for_record(record.inner_child_render()),
        &[inner_read]
    );

    let dependencies = context_store.context_dependencies();
    assert_eq!(dependencies.len(), 2);
    assert_eq!(dependencies[0].fiber(), outer_work_in_progress);
    assert_eq!(dependencies[0].context(), context);
    assert_eq!(dependencies[0].memoized_value(), outer_value);
    assert_eq!(dependencies[0].dependency_lanes(), Lanes::NO);
    assert_eq!(dependencies[1].fiber(), inner_work_in_progress);
    assert_eq!(dependencies[1].context(), context);
    assert_eq!(dependencies[1].memoized_value(), inner_value);
    assert_eq!(dependencies[1].dependency_lanes(), Lanes::NO);
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
}

#[test]
fn sibling_context_provider_two_consumer_use_context_children_read_and_unwind_each_branch() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let first_default_value = context_value(490);
    let second_default_value = context_value(491);
    let first_value = context_value(492);
    let second_value = context_value(493);
    let first_context = context_store.create_context(first_default_value);
    let second_context = context_store.create_context(second_default_value);
    let mut arena = FiberArena::new();
    let parent = arena.create_fiber(
        FiberTag::HostRoot,
        None,
        PropsHandle::from_raw(494),
        FiberMode::NO,
    );
    let first_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(495),
        FiberMode::NO,
    );
    let second_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(496),
        FiberMode::NO,
    );
    let first_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(497),
        FiberMode::NO,
    );
    let first_component = FiberTypeHandle::from_raw(498);
    arena
        .get_mut(first_current)
        .unwrap()
        .set_fiber_type(first_component);
    let first_work_in_progress = arena
        .create_work_in_progress(first_current, PropsHandle::from_raw(499))
        .unwrap();
    let second_current = arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(500),
        FiberMode::NO,
    );
    let second_component = FiberTypeHandle::from_raw(501);
    arena
        .get_mut(second_current)
        .unwrap()
        .set_fiber_type(second_component);
    let second_work_in_progress = arena
        .create_work_in_progress(second_current, PropsHandle::from_raw(502))
        .unwrap();
    arena
        .set_children(first_provider, &[first_work_in_progress])
        .unwrap();
    arena
        .set_children(second_provider, &[second_work_in_progress])
        .unwrap();
    arena
        .set_children(parent, &[first_provider, second_provider])
        .unwrap();
    let mut registry = TestUseContextComponentRegistry::new(
        first_component,
        UseContextBehavior::ReadOnce {
            context: first_context,
        },
    );
    registry.register(
        second_component,
        UseContextBehavior::ReadOnce {
            context: second_context,
        },
    );

    let record = begin_work_sibling_context_provider_two_consumer_use_context_children(
        &mut arena,
        SiblingContextProviderBeginWorkRequest::new(
            first_provider,
            Lanes::DEFAULT,
            first_context,
            first_value,
            second_context,
            second_value,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.first_provider(), first_provider);
    assert_eq!(record.second_provider(), second_provider);
    assert_eq!(record.first_child(), first_work_in_progress);
    assert_eq!(record.second_child(), second_work_in_progress);
    assert_eq!(record.first_context(), first_context);
    assert_eq!(record.second_context(), second_context);
    assert_eq!(record.first_value(), first_value);
    assert_eq!(record.second_value(), second_value);
    assert!(record.first_provider_snapshot().is_root());
    assert!(record.second_provider_snapshot().is_root());
    assert!(record.first_provider_token().is_some());
    assert!(record.second_provider_token().is_some());
    assert_ne!(
        record.first_provider_token(),
        record.second_provider_token()
    );
    assert_eq!(record.first_pushed_stack_depth(), 1);
    assert_eq!(record.first_restored_stack_depth(), 0);
    assert_eq!(record.second_pushed_stack_depth(), 1);
    assert_eq!(record.second_restored_stack_depth(), 0);
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(registry.calls().len(), 2);
    assert_eq!(registry.calls()[0].fiber(), first_work_in_progress);
    assert_eq!(registry.calls()[1].fiber(), second_work_in_progress);
    assert_eq!(
        registry.calls()[0].context_state().unwrap().stack_depth(),
        1
    );
    assert_eq!(
        registry.calls()[1].context_state().unwrap().stack_depth(),
        1
    );

    let first_read = record.first_child_context_read();
    let second_read = record.second_child_context_read();
    assert_eq!(registry.reads(), &[first_read, second_read]);
    assert_eq!(first_read.context(), first_context);
    assert_eq!(first_read.value(), first_value);
    assert_eq!(first_read.active_provider_count(), 1);
    assert_eq!(second_read.context(), second_context);
    assert_eq!(second_read.value(), second_value);
    assert_eq!(second_read.active_provider_count(), 1);
    assert_eq!(
        context_store.context_reads_for_record(record.first_child_render()),
        &[first_read]
    );
    assert_eq!(
        context_store.context_reads_for_record(record.second_child_render()),
        &[second_read]
    );
    assert_eq!(
        context_store.current_value(first_context).unwrap(),
        first_default_value
    );
    assert_eq!(
        context_store.current_value(second_context).unwrap(),
        second_default_value
    );
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(
        context_store.active_provider_count(first_context).unwrap(),
        0
    );
    assert_eq!(
        context_store.active_provider_count(second_context).unwrap(),
        0
    );
}

#[test]
fn nested_context_provider_two_consumer_use_context_rejects_non_exact_shapes_before_push() {
    let mut missing_store = FunctionComponentContextRenderStore::new();
    let missing_context = missing_store.create_context(context_value(470));
    let (mut missing_arena, _current, first_child, component) = function_component_pair();
    let missing_outer = missing_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(471),
        FiberMode::NO,
    );
    let missing_inner = missing_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(472),
        FiberMode::NO,
    );
    missing_arena
        .set_children(missing_inner, &[first_child])
        .unwrap();
    missing_arena
        .set_children(missing_outer, &[missing_inner])
        .unwrap();
    let mut missing_registry = TestUseContextComponentRegistry::new(
        component,
        UseContextBehavior::ReadOnce {
            context: missing_context,
        },
    );

    let missing_error = begin_work_nested_context_provider_two_consumer_use_context_children(
        &mut missing_arena,
        NestedContextProviderBeginWorkRequest::new(
            missing_outer,
            Lanes::DEFAULT,
            missing_context,
            context_value(473),
            missing_context,
            context_value(474),
        ),
        &mut missing_store,
        &mut missing_registry,
    )
    .unwrap_err();

    assert_eq!(
        missing_error,
        NestedContextProviderBeginWorkError::MissingSecondConsumer {
            inner_provider: missing_inner,
            first_child,
        }
    );
    assert!(missing_registry.calls().is_empty());
    assert_eq!(
        missing_store.current_value(missing_context).unwrap(),
        context_value(470)
    );
    assert_eq!(missing_store.stack_depth(), 0);

    let mut extra_store = FunctionComponentContextRenderStore::new();
    let extra_context = extra_store.create_context(context_value(480));
    let mut extra_arena = FiberArena::new();
    let extra_outer = extra_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(481),
        FiberMode::NO,
    );
    let extra_inner = extra_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(482),
        FiberMode::NO,
    );
    let first = extra_arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(483),
        FiberMode::NO,
    );
    let second = extra_arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(484),
        FiberMode::NO,
    );
    let third = extra_arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(485),
        FiberMode::NO,
    );
    let extra_component = FiberTypeHandle::from_raw(486);
    for child in [first, second, third] {
        extra_arena
            .get_mut(child)
            .unwrap()
            .set_fiber_type(extra_component);
    }
    extra_arena
        .set_children(extra_inner, &[first, second, third])
        .unwrap();
    extra_arena
        .set_children(extra_outer, &[extra_inner])
        .unwrap();
    let mut extra_registry = TestUseContextComponentRegistry::new(
        extra_component,
        UseContextBehavior::ReadOnce {
            context: extra_context,
        },
    );

    let extra_error = begin_work_nested_context_provider_two_consumer_use_context_children(
        &mut extra_arena,
        NestedContextProviderBeginWorkRequest::new(
            extra_outer,
            Lanes::DEFAULT,
            extra_context,
            context_value(487),
            extra_context,
            context_value(488),
        ),
        &mut extra_store,
        &mut extra_registry,
    )
    .unwrap_err();

    assert_eq!(
        extra_error,
        NestedContextProviderBeginWorkError::TooManyConsumers {
            inner_provider: extra_inner,
            first_child: first,
            second_child: second,
            sibling: third,
        }
    );
    assert!(extra_registry.calls().is_empty());
    assert_eq!(
        extra_store.current_value(extra_context).unwrap(),
        context_value(480)
    );
    assert_eq!(extra_store.stack_depth(), 0);
}

#[test]
fn sibling_context_provider_two_consumer_use_context_rejects_non_exact_shapes_before_push() {
    let mut missing_store = FunctionComponentContextRenderStore::new();
    let first_context = missing_store.create_context(context_value(503));
    let second_context = missing_store.create_context(context_value(504));
    let (mut missing_arena, _current, first_child, component) = function_component_pair();
    let first_provider = missing_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(505),
        FiberMode::NO,
    );
    missing_arena
        .set_children(first_provider, &[first_child])
        .unwrap();
    let mut missing_registry = TestUseContextComponentRegistry::new(
        component,
        UseContextBehavior::ReadOnce {
            context: first_context,
        },
    );

    let missing_error = begin_work_sibling_context_provider_two_consumer_use_context_children(
        &mut missing_arena,
        SiblingContextProviderBeginWorkRequest::new(
            first_provider,
            Lanes::DEFAULT,
            first_context,
            context_value(506),
            second_context,
            context_value(507),
        ),
        &mut missing_store,
        &mut missing_registry,
    )
    .unwrap_err();

    assert_eq!(
        missing_error,
        SiblingContextProviderBeginWorkError::MissingSecondProvider { first_provider }
    );
    assert!(missing_registry.calls().is_empty());
    assert_eq!(
        missing_store.current_value(first_context).unwrap(),
        context_value(503)
    );
    assert_eq!(
        missing_store.current_value(second_context).unwrap(),
        context_value(504)
    );
    assert_eq!(missing_store.stack_depth(), 0);

    let mut extra_store = FunctionComponentContextRenderStore::new();
    let first_context = extra_store.create_context(context_value(508));
    let second_context = extra_store.create_context(context_value(509));
    let mut extra_arena = FiberArena::new();
    let parent = extra_arena.create_fiber(
        FiberTag::HostRoot,
        None,
        PropsHandle::from_raw(510),
        FiberMode::NO,
    );
    let first_provider = extra_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(511),
        FiberMode::NO,
    );
    let second_provider = extra_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(512),
        FiberMode::NO,
    );
    let third_provider = extra_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(513),
        FiberMode::NO,
    );
    extra_arena
        .set_children(parent, &[first_provider, second_provider, third_provider])
        .unwrap();
    let mut extra_registry = TestUseContextComponentRegistry::new(
        component,
        UseContextBehavior::ReadOnce {
            context: first_context,
        },
    );

    let extra_error = begin_work_sibling_context_provider_two_consumer_use_context_children(
        &mut extra_arena,
        SiblingContextProviderBeginWorkRequest::new(
            first_provider,
            Lanes::DEFAULT,
            first_context,
            context_value(514),
            second_context,
            context_value(515),
        ),
        &mut extra_store,
        &mut extra_registry,
    )
    .unwrap_err();

    assert_eq!(
        extra_error,
        SiblingContextProviderBeginWorkError::TooManyProviders {
            first_provider,
            second_provider,
            sibling: third_provider,
        }
    );
    assert!(extra_registry.calls().is_empty());
    assert_eq!(
        extra_store.current_value(first_context).unwrap(),
        context_value(508)
    );
    assert_eq!(
        extra_store.current_value(second_context).unwrap(),
        context_value(509)
    );
    assert_eq!(extra_store.stack_depth(), 0);
}

#[test]
fn nested_context_provider_use_context_child_unwinds_after_unsupported_consumer_shape() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(440);
    let context = context_store.create_context(default_value);
    let (mut arena, _current, child_work_in_progress, component) = function_component_pair();
    let outer_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(441),
        FiberMode::NO,
    );
    let inner_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(442),
        FiberMode::NO,
    );
    arena
        .set_children(inner_provider, &[child_work_in_progress])
        .unwrap();
    arena
        .set_children(outer_provider, &[inner_provider])
        .unwrap();
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadTwice { context });

    let error = begin_work_nested_context_provider_use_context_child(
        &mut arena,
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            Lanes::DEFAULT,
            context,
            context_value(443),
            context,
            context_value(444),
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        NestedContextProviderBeginWorkError::ChildBeginWork {
            outer_provider,
            inner_provider,
            child: child_work_in_progress,
            error: Box::new(BeginWorkError::FunctionComponent(
                FunctionComponentRenderError::UnsupportedUseContextReadCount {
                    fiber: child_work_in_progress,
                    read_count: 2,
                },
            )),
        }
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.reads().len(), 2);
    assert_eq!(context_store.context_dependencies().len(), 2);
    assert_eq!(
        context_store.context_dependencies()[0].next(),
        context_store.context_dependencies()[1].handle()
    );
    assert!(!context_store.context_dependencies()[0].renderer_visible_propagation());
    assert!(!context_store.context_dependencies()[1].renderer_visible_propagation());
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
    assert_eq!(
        arena.get(child_work_in_progress).unwrap().memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn context_provider_begin_work_unwinds_after_child_invocation_error() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(210);
    let provided_value = context_value(220);
    let context = context_store.create_context(default_value);
    let (mut arena, _current, child_work_in_progress, component) = function_component_pair();
    let provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(230),
        FiberMode::NO,
    );
    arena
        .set_children(provider, &[child_work_in_progress])
        .unwrap();
    let invocation_error = FunctionComponentInvocationError::component_error("boom");
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Err(invocation_error.clone()));

    let error = begin_work_context_provider_child(
        &mut arena,
        ContextProviderBeginWorkRequest::new(provider, Lanes::DEFAULT, context, provided_value),
        &mut context_store,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        ContextProviderBeginWorkError::ChildBeginWork {
            provider,
            child: child_work_in_progress,
            error: Box::new(BeginWorkError::FunctionComponent(
                FunctionComponentRenderError::Invocation {
                    fiber: child_work_in_progress,
                    component,
                    error: invocation_error,
                },
            )),
        }
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
    assert_eq!(
        arena.get(child_work_in_progress).unwrap().memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn nested_context_provider_begin_work_unwinds_both_providers_after_child_invocation_error() {
    let mut context_store = FunctionComponentContextRenderStore::new();
    let outer_default = context_value(240);
    let inner_default = context_value(250);
    let outer_context = context_store.create_context(outer_default);
    let inner_context = context_store.create_context(inner_default);
    let (mut arena, _current, child_work_in_progress, component) = function_component_pair();
    let outer_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(260),
        FiberMode::NO,
    );
    let inner_provider = arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(261),
        FiberMode::NO,
    );
    arena
        .set_children(inner_provider, &[child_work_in_progress])
        .unwrap();
    arena
        .set_children(outer_provider, &[inner_provider])
        .unwrap();
    let invocation_error = FunctionComponentInvocationError::component_error("nested boom");
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Err(invocation_error.clone()));

    let error = begin_work_nested_context_provider_child(
        &mut arena,
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            Lanes::DEFAULT,
            outer_context,
            context_value(241),
            inner_context,
            context_value(251),
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        NestedContextProviderBeginWorkError::ChildBeginWork {
            outer_provider,
            inner_provider,
            child: child_work_in_progress,
            error: Box::new(BeginWorkError::FunctionComponent(
                FunctionComponentRenderError::Invocation {
                    fiber: child_work_in_progress,
                    component,
                    error: invocation_error,
                },
            )),
        }
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(
        registry.calls()[0].context_state().unwrap().stack_depth(),
        2
    );
    assert_eq!(
        context_store.current_value(outer_context).unwrap(),
        outer_default
    );
    assert_eq!(
        context_store.current_value(inner_context).unwrap(),
        inner_default
    );
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(
        context_store.active_provider_count(outer_context).unwrap(),
        0
    );
    assert_eq!(
        context_store.active_provider_count(inner_context).unwrap(),
        0
    );
    assert_eq!(
        arena.get(child_work_in_progress).unwrap().memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn context_provider_begin_work_fails_closed_for_nested_or_unsupported_shapes() {
    let shape_cases = [
        FiberTag::ContextProvider,
        FiberTag::HostText,
        FiberTag::Fragment,
    ];

    for tag in shape_cases {
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(310);
        let context = context_store.create_context(default_value);
        let mut arena = FiberArena::new();
        let provider = arena.create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(320),
            FiberMode::NO,
        );
        let child = arena.create_fiber(tag, None, PropsHandle::from_raw(321), FiberMode::NO);
        arena.set_children(provider, &[child]).unwrap();
        let mut registry = TestFunctionComponentRegistry::default();

        let error = begin_work_context_provider_child(
            &mut arena,
            ContextProviderBeginWorkRequest::new(
                provider,
                Lanes::DEFAULT,
                context,
                context_value(330),
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(
            error,
            ContextProviderBeginWorkError::UnsupportedChildTag {
                provider,
                child,
                tag,
            }
        );
        assert!(registry.calls().is_empty());
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
    }
}

#[test]
fn nested_context_provider_begin_work_rejects_unsupported_provider_shapes_before_push() {
    let mut outer_multiple_store = FunctionComponentContextRenderStore::new();
    let outer_context = outer_multiple_store.create_context(context_value(340));
    let inner_context = outer_multiple_store.create_context(context_value(341));
    let (mut outer_multiple_arena, _current, child, component) = function_component_pair();
    let outer_provider = outer_multiple_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(342),
        FiberMode::NO,
    );
    let inner_provider = outer_multiple_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(343),
        FiberMode::NO,
    );
    let outer_sibling = outer_multiple_arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(344),
        FiberMode::NO,
    );
    outer_multiple_arena
        .set_children(inner_provider, &[child])
        .unwrap();
    outer_multiple_arena
        .set_children(outer_provider, &[inner_provider, outer_sibling])
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(345)));
    assert_eq!(
        begin_work_nested_context_provider_child(
            &mut outer_multiple_arena,
            NestedContextProviderBeginWorkRequest::new(
                outer_provider,
                Lanes::DEFAULT,
                outer_context,
                context_value(346),
                inner_context,
                context_value(347),
            ),
            &mut outer_multiple_store,
            &mut registry,
        ),
        Err(NestedContextProviderBeginWorkError::MultipleChildren {
            provider: outer_provider,
            first_child: inner_provider,
            sibling: outer_sibling,
        })
    );
    assert!(registry.calls().is_empty());
    assert_eq!(
        outer_multiple_store.current_value(outer_context).unwrap(),
        context_value(340)
    );
    assert_eq!(
        outer_multiple_store.current_value(inner_context).unwrap(),
        context_value(341)
    );
    assert_eq!(outer_multiple_store.stack_depth(), 0);

    let mut inner_multiple_store = FunctionComponentContextRenderStore::new();
    let outer_context = inner_multiple_store.create_context(context_value(350));
    let inner_context = inner_multiple_store.create_context(context_value(351));
    let (mut inner_multiple_arena, _current, child, component) = function_component_pair();
    let outer_provider = inner_multiple_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(352),
        FiberMode::NO,
    );
    let inner_provider = inner_multiple_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(353),
        FiberMode::NO,
    );
    let inner_sibling = inner_multiple_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(354),
        FiberMode::NO,
    );
    inner_multiple_arena
        .set_children(inner_provider, &[child, inner_sibling])
        .unwrap();
    inner_multiple_arena
        .set_children(outer_provider, &[inner_provider])
        .unwrap();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(355)));
    assert_eq!(
        begin_work_nested_context_provider_child(
            &mut inner_multiple_arena,
            NestedContextProviderBeginWorkRequest::new(
                outer_provider,
                Lanes::DEFAULT,
                outer_context,
                context_value(356),
                inner_context,
                context_value(357),
            ),
            &mut inner_multiple_store,
            &mut registry,
        ),
        Err(NestedContextProviderBeginWorkError::MultipleChildren {
            provider: inner_provider,
            first_child: child,
            sibling: inner_sibling,
        })
    );
    assert_eq!(
        inner_multiple_store.current_value(outer_context).unwrap(),
        context_value(350)
    );
    assert_eq!(
        inner_multiple_store.current_value(inner_context).unwrap(),
        context_value(351)
    );
    assert_eq!(inner_multiple_store.stack_depth(), 0);

    let mut sibling_store = FunctionComponentContextRenderStore::new();
    let outer_context = sibling_store.create_context(context_value(366));
    let inner_context = sibling_store.create_context(context_value(367));
    let (mut sibling_arena, _current, child, component) = function_component_pair();
    let parent = sibling_arena.create_fiber(
        FiberTag::HostRoot,
        None,
        PropsHandle::from_raw(368),
        FiberMode::NO,
    );
    let outer_provider = sibling_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(369),
        FiberMode::NO,
    );
    let inner_provider = sibling_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(370),
        FiberMode::NO,
    );
    let provider_sibling = sibling_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(371),
        FiberMode::NO,
    );
    sibling_arena
        .set_children(inner_provider, &[child])
        .unwrap();
    sibling_arena
        .set_children(outer_provider, &[inner_provider])
        .unwrap();
    sibling_arena
        .set_children(parent, &[outer_provider, provider_sibling])
        .unwrap();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(372)));
    assert_eq!(
        begin_work_nested_context_provider_child(
            &mut sibling_arena,
            NestedContextProviderBeginWorkRequest::new(
                outer_provider,
                Lanes::DEFAULT,
                outer_context,
                context_value(373),
                inner_context,
                context_value(374),
            ),
            &mut sibling_store,
            &mut registry,
        ),
        Err(
            NestedContextProviderBeginWorkError::ProviderSiblingUnsupported {
                provider: outer_provider,
                sibling: provider_sibling,
            }
        )
    );
    assert_eq!(
        sibling_store.current_value(outer_context).unwrap(),
        context_value(366)
    );
    assert_eq!(
        sibling_store.current_value(inner_context).unwrap(),
        context_value(367)
    );
    assert_eq!(sibling_store.stack_depth(), 0);

    let mut unsupported_store = FunctionComponentContextRenderStore::new();
    let outer_context = unsupported_store.create_context(context_value(360));
    let inner_context = unsupported_store.create_context(context_value(361));
    let (mut unsupported_arena, _current, outer_child, component) = function_component_pair();
    let outer_provider = unsupported_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(362),
        FiberMode::NO,
    );
    unsupported_arena
        .set_children(outer_provider, &[outer_child])
        .unwrap();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(363)));
    assert_eq!(
        begin_work_nested_context_provider_child(
            &mut unsupported_arena,
            NestedContextProviderBeginWorkRequest::new(
                outer_provider,
                Lanes::DEFAULT,
                outer_context,
                context_value(364),
                inner_context,
                context_value(365),
            ),
            &mut unsupported_store,
            &mut registry,
        ),
        Err(
            NestedContextProviderBeginWorkError::UnsupportedOuterChildTag {
                outer_provider,
                child: outer_child,
                tag: FiberTag::FunctionComponent,
            }
        )
    );
    assert_eq!(
        unsupported_store.current_value(outer_context).unwrap(),
        context_value(360)
    );
    assert_eq!(
        unsupported_store.current_value(inner_context).unwrap(),
        context_value(361)
    );
    assert_eq!(unsupported_store.stack_depth(), 0);
}

#[test]
fn context_provider_begin_work_rejects_missing_multiple_or_sibling_shapes_before_push() {
    let mut missing_store = FunctionComponentContextRenderStore::new();
    let missing_context = missing_store.create_context(context_value(400));
    let mut missing_arena = FiberArena::new();
    let missing_provider = missing_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(401),
        FiberMode::NO,
    );
    let mut registry = TestFunctionComponentRegistry::default();
    assert_eq!(
        begin_work_context_provider_child(
            &mut missing_arena,
            ContextProviderBeginWorkRequest::new(
                missing_provider,
                Lanes::DEFAULT,
                missing_context,
                context_value(402),
            ),
            &mut missing_store,
            &mut registry,
        ),
        Err(ContextProviderBeginWorkError::MissingChild {
            provider: missing_provider,
        })
    );
    assert_eq!(
        missing_store.current_value(missing_context).unwrap(),
        context_value(400)
    );

    let mut multiple_store = FunctionComponentContextRenderStore::new();
    let multiple_context = multiple_store.create_context(context_value(410));
    let (mut multiple_arena, _current, first_child, component) = function_component_pair();
    let provider = multiple_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(411),
        FiberMode::NO,
    );
    let sibling = multiple_arena.create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(412),
        FiberMode::NO,
    );
    multiple_arena
        .set_children(provider, &[first_child, sibling])
        .unwrap();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(413)));
    assert_eq!(
        begin_work_context_provider_child(
            &mut multiple_arena,
            ContextProviderBeginWorkRequest::new(
                provider,
                Lanes::DEFAULT,
                multiple_context,
                context_value(414),
            ),
            &mut multiple_store,
            &mut registry,
        ),
        Err(ContextProviderBeginWorkError::MultipleChildren {
            provider,
            first_child,
            sibling,
        })
    );
    assert_eq!(
        multiple_store.current_value(multiple_context).unwrap(),
        context_value(410)
    );

    let mut sibling_store = FunctionComponentContextRenderStore::new();
    let sibling_context = sibling_store.create_context(context_value(420));
    let (mut sibling_arena, _current, child, component) = function_component_pair();
    let parent = sibling_arena.create_fiber(
        FiberTag::HostRoot,
        None,
        PropsHandle::from_raw(421),
        FiberMode::NO,
    );
    let provider = sibling_arena.create_fiber(
        FiberTag::ContextProvider,
        None,
        PropsHandle::from_raw(422),
        FiberMode::NO,
    );
    let provider_sibling = sibling_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(423),
        FiberMode::NO,
    );
    sibling_arena.set_children(provider, &[child]).unwrap();
    sibling_arena
        .set_children(parent, &[provider, provider_sibling])
        .unwrap();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(424)));
    assert_eq!(
        begin_work_context_provider_child(
            &mut sibling_arena,
            ContextProviderBeginWorkRequest::new(
                provider,
                Lanes::DEFAULT,
                sibling_context,
                context_value(425),
            ),
            &mut sibling_store,
            &mut registry,
        ),
        Err(ContextProviderBeginWorkError::ProviderSiblingUnsupported {
            provider,
            sibling: provider_sibling,
        })
    );
    assert_eq!(
        sibling_store.current_value(sibling_context).unwrap(),
        context_value(420)
    );
}

#[test]
fn begin_work_delegates_function_component_to_render_skeleton() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let existing_child = arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9),
        FiberMode::NO,
    );
    arena
        .set_children(work_in_progress, &[existing_child])
        .unwrap();
    let output = FunctionComponentOutputHandle::from_raw(77);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let result = begin_work(
        &mut arena,
        BeginWorkRequest::new(work_in_progress, Lanes::DEFAULT),
        &mut registry,
    )
    .unwrap()
    .function_component();

    assert_eq!(result.current(), Some(current));
    assert_eq!(result.work_in_progress(), work_in_progress);
    assert_eq!(result.render_lanes(), Lanes::DEFAULT);
    assert_eq!(result.output(), output);
    assert_eq!(result.render().component(), component);
    assert_eq!(result.render().props(), PropsHandle::from_raw(2));
    assert_eq!(registry.calls().len(), 1);
    let call = registry.calls()[0];
    assert_eq!(call.fiber(), work_in_progress);
    assert_eq!(call.component(), component);
    assert_eq!(call.props(), PropsHandle::from_raw(2));
    assert_eq!(call.render_lanes(), Lanes::DEFAULT);

    let work_node = arena.get(work_in_progress).unwrap();
    assert_eq!(work_node.memoized_props(), PropsHandle::from_raw(2));
    assert_eq!(work_node.memoized_state(), StateHandle::NONE);
    assert_eq!(work_node.update_queue(), UpdateQueueHandle::NONE);
    assert_eq!(work_node.lanes(), Lanes::NO);
    assert_eq!(work_node.child(), Some(existing_child));
    assert_eq!(
        arena.get(existing_child).unwrap().return_fiber(),
        Some(work_in_progress)
    );
}

#[test]
fn begin_work_function_component_bailout_blocker_records_child_block() {
    let (mut arena, current, work_in_progress, _component) = function_component_pair();
    let props = PropsHandle::from_raw(2);
    mark_same_props_for_bailout(&mut arena, current, work_in_progress, props);
    let child = arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(900),
        FiberMode::NO,
    );
    arena.set_children(work_in_progress, &[child]).unwrap();

    let current_lanes = Lanes::from(Lane::TRANSITION_1);
    let skipped_lanes = Lanes::from(Lane::TRANSITION_2);
    let child_lanes = Lanes::from(Lane::TRANSITION_3);
    let current_update_queue = UpdateQueueHandle::from_raw(501);
    let current_dependencies = DependenciesHandle::from_raw(601);
    let stale_update_queue = UpdateQueueHandle::from_raw(502);
    let stale_dependencies = DependenciesHandle::from_raw(602);
    let flags_before = FiberFlags::PASSIVE
        | FiberFlags::UPDATE
        | FiberFlags::PLACEMENT
        | FiberFlags::PASSIVE_STATIC;
    {
        let current_node = arena.get_mut(current).unwrap();
        current_node.set_lanes(current_lanes);
        current_node.set_update_queue(current_update_queue);
        current_node.set_dependencies(current_dependencies);
    }
    {
        let work_node = arena.get_mut(work_in_progress).unwrap();
        work_node.set_lanes(skipped_lanes);
        work_node.set_child_lanes(child_lanes);
        work_node.set_update_queue(stale_update_queue);
        work_node.set_dependencies(stale_dependencies);
        work_node.set_flags(flags_before);
    }

    let record = begin_work_function_component_bailout_blocker(
        &mut arena,
        BeginWorkRequest::new(work_in_progress, Lanes::DEFAULT),
        &[],
    )
    .unwrap();

    assert_eq!(record.current(), current);
    assert_eq!(record.work_in_progress(), work_in_progress);
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(record.pending_props(), props);
    assert_eq!(record.memoized_props(), props);
    assert_eq!(record.current_lanes_before(), current_lanes);
    assert_eq!(record.current_lanes_after(), current_lanes);
    assert_eq!(record.skipped_lanes(), skipped_lanes);
    assert_eq!(record.child(), Some(child));
    assert_eq!(record.child_lanes(), child_lanes);
    assert_eq!(record.child_to_visit(), None);
    assert!(record.child_traversal_blocked());
    assert_eq!(record.context_dependency_count(), 0);
    assert_eq!(record.context_dependency_lanes(), Lanes::NO);
    assert_eq!(
        record.work_in_progress_update_queue_before(),
        stale_update_queue
    );
    assert_eq!(
        record.work_in_progress_update_queue_after(),
        current_update_queue
    );
    assert_eq!(
        record.work_in_progress_dependencies_before(),
        stale_dependencies
    );
    assert_eq!(
        record.work_in_progress_dependencies_after(),
        current_dependencies
    );
    assert_eq!(record.reused_update_queue(), current_update_queue);
    assert_eq!(record.reused_dependencies(), current_dependencies);
    assert!(record.reused_hook_update_queue());
    assert!(record.reused_current_dependencies());
    assert_eq!(record.work_in_progress_flags_before(), flags_before);
    assert_eq!(
        record.removed_hook_effect_flags(),
        FiberFlags::PASSIVE | FiberFlags::UPDATE
    );
    assert_eq!(
        record.work_in_progress_flags_after(),
        FiberFlags::PLACEMENT | FiberFlags::PASSIVE_STATIC
    );

    let current_node = arena.get(current).unwrap();
    assert_eq!(current_node.lanes(), current_lanes);
    assert_eq!(current_node.update_queue(), current_update_queue);
    assert_eq!(current_node.dependencies(), current_dependencies);

    let work_node = arena.get(work_in_progress).unwrap();
    assert_eq!(work_node.update_queue(), current_update_queue);
    assert_eq!(work_node.dependencies(), current_dependencies);
    assert_eq!(
        work_node.flags(),
        FiberFlags::PLACEMENT | FiberFlags::PASSIVE_STATIC
    );
    assert_eq!(work_node.child(), Some(child));
    assert_eq!(work_node.child_lanes(), child_lanes);
}

#[test]
fn begin_work_function_component_bailout_blocker_rejects_props_lanes_and_child_lanes() {
    let (mut props_arena, props_current, props_work_in_progress, _component) =
        function_component_pair();
    props_arena
        .get_mut(props_current)
        .unwrap()
        .set_memoized_props(PropsHandle::from_raw(1));
    assert_eq!(
        begin_work_function_component_bailout_blocker(
            &mut props_arena,
            BeginWorkRequest::new(props_work_in_progress, Lanes::DEFAULT),
            &[],
        ),
        Err(
            FunctionComponentBeginWorkBailoutBlockerError::PropsChanged {
                current: props_current,
                work_in_progress: props_work_in_progress,
                memoized_props: PropsHandle::from_raw(1),
                pending_props: PropsHandle::from_raw(2),
            },
        )
    );

    let (mut lane_arena, lane_current, lane_work_in_progress, _component) =
        function_component_pair();
    mark_same_props_for_bailout(
        &mut lane_arena,
        lane_current,
        lane_work_in_progress,
        PropsHandle::from_raw(2),
    );
    lane_arena
        .get_mut(lane_current)
        .unwrap()
        .set_lanes(Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1));
    assert_eq!(
        begin_work_function_component_bailout_blocker(
            &mut lane_arena,
            BeginWorkRequest::new(lane_work_in_progress, Lanes::DEFAULT),
            &[],
        ),
        Err(
            FunctionComponentBeginWorkBailoutBlockerError::ScheduledUpdate {
                current: lane_current,
                render_lanes: Lanes::DEFAULT,
                current_lanes: Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1),
            },
        )
    );

    let (mut child_arena, child_current, child_work_in_progress, _component) =
        function_component_pair();
    mark_same_props_for_bailout(
        &mut child_arena,
        child_current,
        child_work_in_progress,
        PropsHandle::from_raw(2),
    );
    let child = child_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(903),
        FiberMode::NO,
    );
    child_arena
        .set_children(child_work_in_progress, &[child])
        .unwrap();
    child_arena
        .get_mut(child_work_in_progress)
        .unwrap()
        .set_child_lanes(Lanes::DEFAULT);
    assert_eq!(
        begin_work_function_component_bailout_blocker(
            &mut child_arena,
            BeginWorkRequest::new(child_work_in_progress, Lanes::DEFAULT),
            &[],
        ),
        Err(
            FunctionComponentBeginWorkBailoutBlockerError::ChildLanesIntersectRenderLanes {
                work_in_progress: child_work_in_progress,
                render_lanes: Lanes::DEFAULT,
                child_lanes: Lanes::DEFAULT,
                child: Some(child),
            },
        )
    );
}

#[test]
fn begin_work_function_component_bailout_blocker_rejects_context_dependency_lanes() {
    let (mut store, root_id) = root_store();
    let (current, work_in_progress, component) =
        attached_function_component_pair(&mut store, root_id);
    mark_same_props_for_bailout(
        store.fiber_arena_mut(),
        current,
        work_in_progress,
        PropsHandle::from_raw(2),
    );
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(930);
    let previous_value = context_value(931);
    let next_value = context_value(932);
    let context = context_store.create_context(default_value);
    let provider_snapshot = context_store
        .push_provider(context, previous_value)
        .unwrap();
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadOnce { context });

    let render = begin_work_function_component_use_context(
        store.fiber_arena_mut(),
        BeginWorkRequest::new(work_in_progress, Lanes::DEFAULT),
        &mut context_store,
        &mut registry,
    )
    .unwrap()
    .render();
    context_store.restore_snapshot(provider_snapshot).unwrap();
    assert_eq!(registry.calls().len(), 1);
    let propagation = propagate_context_change_to_function_component_dependencies(
        &mut store,
        &mut context_store,
        render,
        FunctionComponentContextChangePropagationRequest::new(
            ContextValueChange::new(context, previous_value, next_value),
            Lanes::DEFAULT,
        ),
    )
    .unwrap();
    assert_eq!(propagation.marked_dependency_count(), 1);
    assert_eq!(
        context_store.context_dependencies()[0].dependency_lanes(),
        Lanes::DEFAULT
    );

    assert_eq!(
        begin_work_function_component_bailout_blocker(
            store.fiber_arena_mut(),
            BeginWorkRequest::new(work_in_progress, Lanes::DEFAULT),
            context_store.context_dependencies(),
        ),
        Err(
            FunctionComponentBeginWorkBailoutBlockerError::ContextChanged {
                current,
                work_in_progress,
                render_lanes: Lanes::DEFAULT,
                context_dependency_count: 1,
                context_dependency_lanes: Lanes::DEFAULT,
            },
        )
    );
}

#[test]
fn begin_work_function_component_bailout_blocker_keeps_memo_tags_unsupported() {
    for tag in [FiberTag::MemoComponent, FiberTag::SimpleMemoComponent] {
        let mut arena = FiberArena::new();
        let fiber = arena.create_fiber(tag, None, PropsHandle::from_raw(940), FiberMode::NO);

        assert_eq!(
            begin_work_function_component_bailout_blocker(
                &mut arena,
                BeginWorkRequest::new(fiber, Lanes::DEFAULT),
                &[],
            ),
            Err(FunctionComponentBeginWorkBailoutBlockerError::UnexpectedFiberTag { fiber, tag },)
        );
    }
}

#[test]
fn begin_work_with_use_state_mounts_state_hook_on_private_path() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let output = FunctionComponentOutputHandle::from_raw(78);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let state_request =
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(810), lanes);

    let record = begin_work_with_use_state(
        &mut arena,
        BeginWorkRequest::new(work_in_progress, Lanes::DEFAULT),
        &mut hook_store,
        state_request,
        &mut registry,
        action_as_state,
    )
    .unwrap();

    assert_eq!(record.begin_work().current(), Some(current));
    assert_eq!(record.work_in_progress(), work_in_progress);
    assert_eq!(record.output(), output);
    assert_eq!(record.hook_result().traversal().traversed_count(), 1);
    assert_eq!(
        record.state_hook().phase(),
        crate::function_component::FunctionComponentHookRenderPhase::Mount
    );
    assert_eq!(
        record.state_hook().memoized_state(),
        StateHandle::from_raw(810)
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(
        registry.calls()[0].hook_state(),
        record.render().hook_state()
    );
    let work_node = arena.get(work_in_progress).unwrap();
    assert_eq!(work_node.memoized_props(), PropsHandle::from_raw(2));
    assert_eq!(work_node.memoized_state(), StateHandle::NONE);
    assert_eq!(work_node.update_queue(), UpdateQueueHandle::NONE);
}

#[test]
fn begin_work_with_use_state_updates_state_hook_from_pending_queue() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let current_state = hook_store
        .create_current_state_hook(current, StateHandle::from_raw(820))
        .unwrap();
    let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
    hook_store
        .dispatch_state_update(FunctionComponentStateDispatchRequest::new(
            current_state.dispatch(),
            action(821),
            lane,
        ))
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(79)));
    let lanes = FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
    let state_request =
        FunctionComponentUseStateRenderRequest::new(StateHandle::from_raw(999), lanes);

    let record = begin_work_with_use_state(
        &mut arena,
        BeginWorkRequest::new(work_in_progress, Lanes::DEFAULT),
        &mut hook_store,
        state_request,
        &mut registry,
        action_as_state,
    )
    .unwrap();

    let update = record.state_hook().update_record().unwrap();
    assert_eq!(update.fiber(), work_in_progress);
    assert_eq!(update.queue(), current_state.queue());
    assert_eq!(update.dispatch(), current_state.dispatch());
    assert_eq!(update.memoized_state(), StateHandle::from_raw(821));
    assert_eq!(update.applied_update_count(), 1);
    assert_eq!(update.remaining_lanes(), Lanes::NO);
    assert_eq!(
        hook_store
            .state_queues()
            .pending_updates(current_state.queue())
            .unwrap(),
        Vec::new()
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(
        registry.calls()[0].hook_state(),
        record.render().hook_state()
    );
}

#[test]
fn begin_work_reconciles_function_component_host_text_single_child() {
    let (mut arena, current, work_in_progress, component) = function_component_pair();
    let output = FunctionComponentOutputHandle::from_raw(91);
    let child_element = RootElementHandle::from_raw(91);
    let child_props = PropsHandle::from_raw(911);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver = StaticSingleChildResolver::new(Some(
        FunctionComponentSingleChildOutput::host_text(output, child_element, child_props),
    ));

    let record = begin_work_reconcile_function_component_single_child(
        &mut arena,
        BeginWorkRequest::new(work_in_progress, Lanes::DEFAULT),
        &mut registry,
        &resolver,
    )
    .unwrap();

    assert_eq!(record.begin_work().current(), Some(current));
    assert_eq!(record.work_in_progress(), work_in_progress);
    assert_eq!(record.output(), output);
    assert_eq!(record.render().component(), component);
    assert_eq!(record.single_child().function_component(), work_in_progress);
    assert_eq!(record.single_child().child_element(), child_element);
    assert_eq!(record.single_child().child_tag(), FiberTag::HostText);
    assert_eq!(record.single_child().child_props(), child_props);
    assert_eq!(record.single_child().render_lanes(), Lanes::DEFAULT);
    assert_eq!(registry.calls().len(), 1);
    assert!(
        arena
            .get(work_in_progress)
            .unwrap()
            .flags()
            .contains_all(fast_react_core::FiberFlags::PERFORMED_WORK)
    );
}

#[test]
fn begin_work_reconciles_function_component_host_component_single_child() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let output = FunctionComponentOutputHandle::from_raw(92);
    let child_element = RootElementHandle::from_raw(92);
    let child_type = ElementTypeHandle::from_raw(920);
    let child_props = PropsHandle::from_raw(921);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver =
        StaticSingleChildResolver::new(Some(FunctionComponentSingleChildOutput::host_component(
            output,
            child_element,
            child_type,
            child_props,
        )));

    let record = begin_work_reconcile_function_component_single_child(
        &mut arena,
        BeginWorkRequest::new(work_in_progress, Lanes::SYNC),
        &mut registry,
        &resolver,
    )
    .unwrap();

    assert_eq!(record.single_child().child_tag(), FiberTag::HostComponent);
    assert_eq!(record.single_child().child_element_type(), child_type);
    assert_eq!(record.single_child().child_props(), child_props);
    assert_eq!(record.single_child().render_lanes(), Lanes::SYNC);
}

#[test]
fn begin_work_delegates_unkeyed_fragment_with_single_host_child_without_invoking() {
    for (child_tag, raw) in [(FiberTag::HostText, 710), (FiberTag::HostComponent, 720)] {
        let fragment_props = PropsHandle::from_raw(raw);
        let child_props = PropsHandle::from_raw(raw + 1);
        let (mut arena, fragment, child) =
            fragment_with_host_child(child_tag, fragment_props, child_props);
        let mut registry = TestFunctionComponentRegistry::default();

        let record = begin_work(
            &mut arena,
            BeginWorkRequest::new(fragment, Lanes::DEFAULT),
            &mut registry,
        )
        .unwrap()
        .fragment();

        assert_eq!(record.fragment(), fragment);
        assert_eq!(record.current(), None);
        assert_eq!(record.child(), child);
        assert_eq!(record.child_tag(), child_tag);
        assert_eq!(record.pending_props(), fragment_props);
        assert_eq!(record.child_pending_props(), child_props);
        assert_eq!(record.render_lanes(), Lanes::DEFAULT);
        assert!(registry.calls().is_empty());

        let fragment_node = arena.get(fragment).unwrap();
        assert_eq!(fragment_node.child(), Some(child));
        assert_eq!(fragment_node.memoized_props(), fragment_props);
        assert_eq!(fragment_node.flags(), fast_react_core::FiberFlags::NO);
        let child_node = arena.get(child).unwrap();
        assert_eq!(child_node.return_fiber(), Some(fragment));
        assert_eq!(child_node.memoized_props(), PropsHandle::NONE);
        assert_eq!(child_node.lanes(), Lanes::NO);
        assert_eq!(child_node.flags(), fast_react_core::FiberFlags::NO);
    }
}

#[test]
fn begin_work_fragment_single_host_child_fails_closed_for_keyed_multiple_or_missing_children() {
    let mut registry = TestFunctionComponentRegistry::default();
    let mut keyed_arena = FiberArena::new();
    let keyed_fragment = keyed_arena.create_fiber(
        FiberTag::Fragment,
        Some(ReactKey::from_normalized("frag")),
        PropsHandle::from_raw(730),
        FiberMode::NO,
    );
    let keyed_child = keyed_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(731),
        FiberMode::NO,
    );
    keyed_arena
        .set_children(keyed_fragment, &[keyed_child])
        .unwrap();
    assert_eq!(
        begin_work(
            &mut keyed_arena,
            BeginWorkRequest::new(keyed_fragment, Lanes::DEFAULT),
            &mut registry,
        ),
        Err(BeginWorkError::FragmentSingleHostChild(
            FragmentSingleHostChildBeginWorkError::KeyedFragmentUnsupported {
                fragment: keyed_fragment,
                key: ReactKey::from_normalized("frag"),
            },
        ))
    );

    let mut missing_arena = FiberArena::new();
    let missing_fragment = missing_arena.create_fiber(
        FiberTag::Fragment,
        None,
        PropsHandle::from_raw(740),
        FiberMode::NO,
    );
    assert_eq!(
        begin_work(
            &mut missing_arena,
            BeginWorkRequest::new(missing_fragment, Lanes::DEFAULT),
            &mut registry,
        ),
        Err(BeginWorkError::FragmentSingleHostChild(
            FragmentSingleHostChildBeginWorkError::MissingChild {
                fragment: missing_fragment,
            },
        ))
    );

    let mut multiple_arena = FiberArena::new();
    let multiple_fragment = multiple_arena.create_fiber(
        FiberTag::Fragment,
        None,
        PropsHandle::from_raw(750),
        FiberMode::NO,
    );
    let first_child = multiple_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(751),
        FiberMode::NO,
    );
    let sibling = multiple_arena.create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(752),
        FiberMode::NO,
    );
    multiple_arena
        .set_children(multiple_fragment, &[first_child, sibling])
        .unwrap();
    assert_eq!(
        begin_work(
            &mut multiple_arena,
            BeginWorkRequest::new(multiple_fragment, Lanes::DEFAULT),
            &mut registry,
        ),
        Err(BeginWorkError::FragmentSingleHostChild(
            FragmentSingleHostChildBeginWorkError::MultipleChildren {
                fragment: multiple_fragment,
                first_child,
                sibling,
            },
        ))
    );

    assert!(registry.calls().is_empty());
    assert_eq!(
        keyed_arena.get(keyed_fragment).unwrap().memoized_props(),
        PropsHandle::NONE
    );
    assert_eq!(
        missing_arena
            .get(missing_fragment)
            .unwrap()
            .memoized_props(),
        PropsHandle::NONE
    );
    assert_eq!(
        multiple_arena
            .get(multiple_fragment)
            .unwrap()
            .memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn begin_work_fragment_fails_closed_for_sibling_update_or_unsupported_child() {
    let mut sibling_arena = FiberArena::new();
    let parent = sibling_arena.create_fiber(
        FiberTag::HostRoot,
        None,
        PropsHandle::from_raw(760),
        FiberMode::NO,
    );
    let fragment = sibling_arena.create_fiber(
        FiberTag::Fragment,
        None,
        PropsHandle::from_raw(761),
        FiberMode::NO,
    );
    let fragment_child = sibling_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(762),
        FiberMode::NO,
    );
    sibling_arena
        .set_children(fragment, &[fragment_child])
        .unwrap();
    let sibling = sibling_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(763),
        FiberMode::NO,
    );
    sibling_arena
        .set_children(parent, &[fragment, sibling])
        .unwrap();
    let mut registry = TestFunctionComponentRegistry::default();
    assert_eq!(
        begin_work(
            &mut sibling_arena,
            BeginWorkRequest::new(fragment, Lanes::DEFAULT),
            &mut registry,
        ),
        Err(BeginWorkError::FragmentSingleHostChild(
            FragmentSingleHostChildBeginWorkError::FragmentSiblingUnsupported { fragment, sibling },
        ))
    );

    let mut update_arena = FiberArena::new();
    let current = update_arena.create_fiber(
        FiberTag::Fragment,
        None,
        PropsHandle::from_raw(770),
        FiberMode::NO,
    );
    let current_child = update_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(771),
        FiberMode::NO,
    );
    update_arena
        .set_children(current, &[current_child])
        .unwrap();
    let work_in_progress = update_arena
        .create_work_in_progress(current, PropsHandle::from_raw(772))
        .unwrap();
    let wip_child = update_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(773),
        FiberMode::NO,
    );
    update_arena
        .set_children(work_in_progress, &[wip_child])
        .unwrap();
    assert_eq!(
        begin_work(
            &mut update_arena,
            BeginWorkRequest::new(work_in_progress, Lanes::DEFAULT),
            &mut registry,
        ),
        Err(BeginWorkError::FragmentSingleHostChild(
            FragmentSingleHostChildBeginWorkError::ExistingCurrentChild {
                fragment: work_in_progress,
                current,
                child: current_child,
            },
        ))
    );

    for tag in [
        FiberTag::FunctionComponent,
        FiberTag::Fragment,
        FiberTag::Portal,
        FiberTag::Suspense,
        FiberTag::Offscreen,
        FiberTag::Activity,
        FiberTag::ViewTransition,
        FiberTag::SuspenseList,
    ] {
        let mut arena = FiberArena::new();
        let fragment = arena.create_fiber(
            FiberTag::Fragment,
            None,
            PropsHandle::from_raw(780),
            FiberMode::NO,
        );
        let child = arena.create_fiber(tag, None, PropsHandle::from_raw(781), FiberMode::NO);
        arena.set_children(fragment, &[child]).unwrap();

        assert_eq!(
            begin_work(
                &mut arena,
                BeginWorkRequest::new(fragment, Lanes::DEFAULT),
                &mut registry,
            ),
            Err(BeginWorkError::FragmentSingleHostChild(
                FragmentSingleHostChildBeginWorkError::UnsupportedChildTag {
                    fragment,
                    child,
                    tag,
                },
            ))
        );
        assert_eq!(
            arena.get(fragment).unwrap().memoized_props(),
            PropsHandle::NONE
        );
    }

    assert!(registry.calls().is_empty());
}

#[test]
fn begin_work_host_root_one_level_child_set_accepts_array_and_unkeyed_fragment() {
    let root_element = RootElementHandle::from_raw(800);
    let first = RootElementHandle::from_raw(801);
    let second = RootElementHandle::from_raw(802);
    let third = RootElementHandle::from_raw(803);

    let array = HostRootOneLevelChildSet::array(
        root_element,
        vec![
            HostRootOneLevelChildSetEntry::host(first),
            HostRootOneLevelChildSetEntry::host(second),
            HostRootOneLevelChildSetEntry::host(third),
        ],
    );
    let array_record = begin_work_host_root_one_level_child_set(&array).unwrap();

    assert_eq!(array_record.root_element(), root_element);
    assert_eq!(array_record.kind(), HostRootOneLevelChildSetKind::Array);
    assert_eq!(array_record.child_count(), 3);
    assert_eq!(array_record.first_child(), first);
    assert_eq!(array_record.last_child(), third);
    assert_eq!(array_record.children(), &[first, second, third]);

    let fragment = HostRootOneLevelChildSet::fragment(
        root_element,
        None,
        vec![
            HostRootOneLevelChildSetEntry::host(first),
            HostRootOneLevelChildSetEntry::host(second),
        ],
    );
    let fragment_record = begin_work_host_root_one_level_child_set(&fragment).unwrap();

    assert_eq!(fragment_record.root_element(), root_element);
    assert_eq!(
        fragment_record.kind(),
        HostRootOneLevelChildSetKind::Fragment
    );
    assert_eq!(fragment_record.child_count(), 2);
    assert_eq!(fragment_record.first_child(), first);
    assert_eq!(fragment_record.last_child(), second);
    assert_eq!(fragment_record.children(), &[first, second]);
}

#[test]
fn begin_work_host_root_one_level_child_set_fails_closed_for_missing_or_single_child() {
    let root_element = RootElementHandle::from_raw(810);
    assert_eq!(
        begin_work_host_root_one_level_child_set(&HostRootOneLevelChildSet::array(
            RootElementHandle::NONE,
            vec![
                HostRootOneLevelChildSetEntry::host(RootElementHandle::from_raw(811)),
                HostRootOneLevelChildSetEntry::host(RootElementHandle::from_raw(812)),
            ],
        )),
        Err(HostRootOneLevelChildSetBeginWorkError::RootElementMissing {
            kind: HostRootOneLevelChildSetKind::Array,
        },)
    );

    assert_eq!(
        begin_work_host_root_one_level_child_set(&HostRootOneLevelChildSet::fragment(
            root_element,
            None,
            vec![HostRootOneLevelChildSetEntry::host(RootElementHandle::NONE)],
        )),
        Err(HostRootOneLevelChildSetBeginWorkError::MissingHostChild {
            root_element,
            kind: HostRootOneLevelChildSetKind::Fragment,
            child_index: 0,
        },)
    );

    assert_eq!(
        begin_work_host_root_one_level_child_set(&HostRootOneLevelChildSet::array(
            root_element,
            vec![HostRootOneLevelChildSetEntry::host(
                RootElementHandle::from_raw(813),
            )],
        )),
        Err(
            HostRootOneLevelChildSetBeginWorkError::ExpectedMultipleHostChildren {
                root_element,
                kind: HostRootOneLevelChildSetKind::Array,
                count: 1,
            },
        )
    );
}

#[test]
fn begin_work_host_root_one_level_child_set_fails_closed_for_keyed_or_nested_shapes() {
    let root_element = RootElementHandle::from_raw(820);
    assert_eq!(
        begin_work_host_root_one_level_child_set(&HostRootOneLevelChildSet::fragment(
            root_element,
            Some(ReactKey::from_normalized("root-fragment")),
            vec![
                HostRootOneLevelChildSetEntry::host(RootElementHandle::from_raw(821)),
                HostRootOneLevelChildSetEntry::host(RootElementHandle::from_raw(822)),
            ],
        )),
        Err(
            HostRootOneLevelChildSetBeginWorkError::KeyedFragmentUnsupported {
                root_element,
                key: ReactKey::from_normalized("root-fragment"),
            },
        )
    );

    assert_eq!(
        begin_work_host_root_one_level_child_set(&HostRootOneLevelChildSet::array(
            root_element,
            vec![
                HostRootOneLevelChildSetEntry::keyed_host(
                    RootElementHandle::from_raw(823),
                    ReactKey::from_normalized("child"),
                ),
                HostRootOneLevelChildSetEntry::host(RootElementHandle::from_raw(824)),
            ],
        )),
        Err(
            HostRootOneLevelChildSetBeginWorkError::KeyedHostChildUnsupported {
                root_element,
                kind: HostRootOneLevelChildSetKind::Array,
                child_index: 0,
                element: RootElementHandle::from_raw(823),
                key: ReactKey::from_normalized("child"),
            },
        )
    );

    assert_eq!(
        begin_work_host_root_one_level_child_set(&HostRootOneLevelChildSet::array(
            root_element,
            vec![
                HostRootOneLevelChildSetEntry::host(RootElementHandle::from_raw(825)),
                HostRootOneLevelChildSetEntry::nested_array(Some(
                    RootElementHandle::from_raw(826,)
                )),
            ],
        )),
        Err(
            HostRootOneLevelChildSetBeginWorkError::NestedChildSetUnsupported {
                root_element,
                kind: HostRootOneLevelChildSetKind::Array,
                child_index: 1,
                nested_kind: HostRootOneLevelChildSetKind::Array,
                first_child: Some(RootElementHandle::from_raw(826)),
            },
        )
    );

    assert_eq!(
        begin_work_host_root_one_level_child_set(&HostRootOneLevelChildSet::fragment(
            root_element,
            None,
            vec![
                HostRootOneLevelChildSetEntry::nested_fragment(
                    Some(ReactKey::from_normalized("nested-fragment")),
                    Some(RootElementHandle::from_raw(827)),
                ),
                HostRootOneLevelChildSetEntry::host(RootElementHandle::from_raw(828)),
            ],
        )),
        Err(
            HostRootOneLevelChildSetBeginWorkError::NestedChildSetUnsupported {
                root_element,
                kind: HostRootOneLevelChildSetKind::Fragment,
                child_index: 0,
                nested_kind: HostRootOneLevelChildSetKind::Fragment,
                first_child: Some(RootElementHandle::from_raw(827)),
            },
        )
    );
}

#[test]
fn begin_work_fails_closed_with_suspense_and_offscreen_child_shape_diagnostics() {
    let mut registry = TestFunctionComponentRegistry::default();

    let mut suspense_arena = FiberArena::new();
    let suspense = suspense_arena.create_fiber(
        FiberTag::Suspense,
        Some(ReactKey::from_normalized("boundary")),
        PropsHandle::from_raw(840),
        FiberMode::NO,
    );
    {
        let node = suspense_arena.get_mut(suspense).unwrap();
        node.set_memoized_state(StateHandle::from_raw(841));
        node.set_update_queue(UpdateQueueHandle::from_raw(846));
    }
    let primary = suspense_arena.create_fiber(
        FiberTag::Offscreen,
        None,
        PropsHandle::from_raw(842),
        FiberMode::NO,
    );
    suspense_arena
        .get_mut(primary)
        .unwrap()
        .set_update_queue(UpdateQueueHandle::from_raw(847));
    let primary_child = suspense_arena.create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(843),
        FiberMode::NO,
    );
    suspense_arena
        .set_children(primary, &[primary_child])
        .unwrap();
    let fallback = suspense_arena.create_fiber(
        FiberTag::Fragment,
        None,
        PropsHandle::from_raw(844),
        FiberMode::NO,
    );
    let fallback_child = suspense_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(845),
        FiberMode::NO,
    );
    suspense_arena
        .set_children(fallback, &[fallback_child])
        .unwrap();
    suspense_arena
        .set_children(suspense, &[primary, fallback])
        .unwrap();

    let suspense_error = begin_work(
        &mut suspense_arena,
        BeginWorkRequest::new(suspense, Lanes::from(Lane::RETRY_1)),
        &mut registry,
    )
    .unwrap_err();

    let suspense_record = match suspense_error {
        BeginWorkError::UnsupportedSuspenseChildShape(record) => record,
        other => panic!("expected Suspense child-shape diagnostic, got {other:?}"),
    };
    assert_eq!(suspense_record.fiber(), suspense);
    assert_eq!(
        suspense_record.key().map(ReactKey::as_str),
        Some("boundary")
    );
    assert_eq!(suspense_record.pending_props(), PropsHandle::from_raw(840));
    assert_eq!(suspense_record.memoized_state(), StateHandle::from_raw(841));
    assert_eq!(suspense_record.child(), Some(primary));
    assert_eq!(suspense_record.child_tag(), Some(FiberTag::Offscreen));
    assert_eq!(suspense_record.fallback_child(), Some(fallback));
    assert_eq!(
        suspense_record.fallback_child_tag(),
        Some(FiberTag::Fragment)
    );
    assert_eq!(
        suspense_record.shape(),
        UnsupportedSuspenseChildShapeKind::PrimaryOffscreenWithFallback
    );
    assert_eq!(suspense_record.render_lanes(), Lanes::from(Lane::RETRY_1));
    let suspense_thenable = suspense_record.thenable_ping_blocker();
    assert_eq!(
        suspense_thenable.thenable_identity_class(),
        UnsupportedThenableIdentityClass::OpaqueWakeable
    );
    assert_eq!(suspense_thenable.ping_lane(), Lane::RETRY_1);
    assert_eq!(suspense_thenable.ping_lanes(), Lanes::from(Lane::RETRY_1));
    assert_eq!(
        suspense_thenable.retry_queue_kind(),
        UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen
    );
    assert_eq!(
        suspense_thenable.retry_queue(),
        UpdateQueueHandle::from_raw(846)
    );
    assert_eq!(
        suspense_thenable.primary_offscreen_retry_queue(),
        Some(UpdateQueueHandle::from_raw(847))
    );
    assert!(!suspense_thenable.schedule_retry_flag());
    assert!(suspense_thenable.primary_child_rendering_blocked());
    assert!(suspense_thenable.fallback_child_rendering_blocked());
    assert!(suspense_thenable.has_suspense_boundary_retry_queue());
    assert!(!suspense_thenable.is_offscreen_only_retry_queue());
    assert!(suspense_thenable.has_compatible_retry_ping_lanes());
    assert!(suspense_thenable.is_accepted_suspense_retry_ping_blocker());
    assert_eq!(suspense_record.feature(), SUSPENSE_UNSUPPORTED_FEATURE);
    assert_eq!(
        suspense_arena.get(suspense).unwrap().memoized_props(),
        PropsHandle::NONE
    );
    assert_eq!(
        suspense_arena.get(primary).unwrap().return_fiber(),
        Some(suspense)
    );
    assert_eq!(
        suspense_arena.get(fallback).unwrap().return_fiber(),
        Some(suspense)
    );

    let mut offscreen_arena = FiberArena::new();
    let offscreen = offscreen_arena.create_fiber(
        FiberTag::Offscreen,
        Some(ReactKey::from_normalized("hidden")),
        PropsHandle::from_raw(850),
        FiberMode::NO,
    );
    {
        let node = offscreen_arena.get_mut(offscreen).unwrap();
        node.set_memoized_props(PropsHandle::from_raw(851));
        node.set_memoized_state(StateHandle::from_raw(852));
        node.set_state_node(StateNodeHandle::from_raw(853));
        node.set_update_queue(UpdateQueueHandle::from_raw(856));
        node.merge_flags(FiberFlags::SCHEDULE_RETRY);
    }
    let first_child = offscreen_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(854),
        FiberMode::NO,
    );
    let second_child = offscreen_arena.create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(855),
        FiberMode::NO,
    );
    offscreen_arena
        .set_children(offscreen, &[first_child, second_child])
        .unwrap();

    let offscreen_error = begin_work(
        &mut offscreen_arena,
        BeginWorkRequest::new(offscreen, Lanes::OFFSCREEN),
        &mut registry,
    )
    .unwrap_err();

    let offscreen_record = match offscreen_error {
        BeginWorkError::UnsupportedOffscreenChildShape(record) => record,
        other => panic!("expected Offscreen child-shape diagnostic, got {other:?}"),
    };
    assert_eq!(offscreen_record.fiber(), offscreen);
    assert_eq!(offscreen_record.key().map(ReactKey::as_str), Some("hidden"));
    assert_eq!(offscreen_record.pending_props(), PropsHandle::from_raw(850));
    assert_eq!(
        offscreen_record.memoized_props(),
        PropsHandle::from_raw(851)
    );
    assert_eq!(
        offscreen_record.memoized_state(),
        StateHandle::from_raw(852)
    );
    assert_eq!(
        offscreen_record.state_node(),
        StateNodeHandle::from_raw(853)
    );
    assert_eq!(offscreen_record.child(), Some(first_child));
    assert_eq!(offscreen_record.child_tag(), Some(FiberTag::HostText));
    assert_eq!(offscreen_record.child_sibling(), Some(second_child));
    assert_eq!(
        offscreen_record.child_sibling_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(
        offscreen_record.shape(),
        UnsupportedOffscreenChildShapeKind::MultipleChildren
    );
    assert_eq!(offscreen_record.render_lanes(), Lanes::OFFSCREEN);
    let offscreen_thenable = offscreen_record.thenable_ping_blocker();
    assert_eq!(
        offscreen_thenable.thenable_identity_class(),
        UnsupportedThenableIdentityClass::OpaqueWakeableAndSuspenseyCommitResource
    );
    assert_eq!(offscreen_thenable.ping_lane(), Lane::OFFSCREEN);
    assert_eq!(offscreen_thenable.ping_lanes(), Lanes::OFFSCREEN);
    assert_eq!(
        offscreen_thenable.retry_queue_kind(),
        UnsupportedThenableRetryQueueKind::Offscreen
    );
    assert_eq!(
        offscreen_thenable.retry_queue(),
        UpdateQueueHandle::from_raw(856)
    );
    assert_eq!(offscreen_thenable.primary_offscreen_retry_queue(), None);
    assert!(offscreen_thenable.schedule_retry_flag());
    assert!(offscreen_thenable.primary_child_rendering_blocked());
    assert!(!offscreen_thenable.fallback_child_rendering_blocked());
    assert!(!offscreen_thenable.has_suspense_boundary_retry_queue());
    assert!(offscreen_thenable.is_offscreen_only_retry_queue());
    assert!(!offscreen_thenable.has_compatible_retry_ping_lanes());
    assert!(!offscreen_thenable.is_accepted_suspense_retry_ping_blocker());
    assert_eq!(offscreen_record.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);
    assert_eq!(
        offscreen_arena.get(first_child).unwrap().return_fiber(),
        Some(offscreen)
    );
    assert_eq!(
        offscreen_arena.get(second_child).unwrap().return_fiber(),
        Some(offscreen)
    );

    assert!(registry.calls().is_empty());
}

fn offscreen_transition_pair(
    key: &'static str,
    previous_hidden_state: StateHandle,
    current_hidden_state: StateHandle,
    previous_lanes: Lanes,
    previous_child_lanes: Lanes,
    work_in_progress_lanes: Lanes,
    work_in_progress_child_lanes: Lanes,
) -> (FiberArena, FiberId, FiberId, FiberId) {
    let mut arena = FiberArena::new();
    let previous = arena.create_fiber(
        FiberTag::Offscreen,
        Some(ReactKey::from_normalized(key)),
        PropsHandle::from_raw(890),
        FiberMode::CONCURRENT,
    );
    {
        let node = arena.get_mut(previous).unwrap();
        node.set_memoized_state(previous_hidden_state);
        node.set_lanes(previous_lanes);
        node.set_child_lanes(previous_child_lanes);
        node.set_state_node(StateNodeHandle::from_raw(891));
    }
    let work_in_progress = arena
        .create_work_in_progress(previous, PropsHandle::from_raw(892))
        .unwrap();
    {
        let node = arena.get_mut(work_in_progress).unwrap();
        node.set_memoized_props(PropsHandle::from_raw(893));
        node.set_memoized_state(current_hidden_state);
        node.set_lanes(work_in_progress_lanes);
        node.set_child_lanes(work_in_progress_child_lanes);
        node.set_state_node(StateNodeHandle::from_raw(894));
    }
    let child = arena.create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(895),
        FiberMode::NO,
    );
    arena.set_children(work_in_progress, &[child]).unwrap();

    (arena, previous, work_in_progress, child)
}

#[allow(clippy::too_many_arguments)]
fn assert_offscreen_visibility_transition(
    transition: &UnsupportedOffscreenVisibilityTransitionRecord,
    previous: FiberId,
    work_in_progress: FiberId,
    key: &'static str,
    mode: UnsupportedOffscreenVisibilityMode,
    previous_visibility: UnsupportedOffscreenVisibility,
    current_visibility: UnsupportedOffscreenVisibility,
    transition_kind: UnsupportedOffscreenVisibilityTransitionKind,
    child_traversal_blocker: UnsupportedOffscreenVisibilityChildTraversalBlocker,
    render_lanes: Lanes,
    previous_lanes: Lanes,
    previous_child_lanes: Lanes,
    work_in_progress_lanes: Lanes,
    work_in_progress_child_lanes: Lanes,
    render_includes_offscreen_lane: bool,
    work_in_progress_includes_offscreen_lane: bool,
) {
    assert_eq!(transition.previous(), previous);
    assert_eq!(transition.work_in_progress(), work_in_progress);
    assert_eq!(transition.key().map(ReactKey::as_str), Some(key));
    assert_eq!(transition.mode(), mode);
    assert_eq!(transition.previous_visibility(), previous_visibility);
    assert_eq!(transition.current_visibility(), current_visibility);
    assert_eq!(transition.transition(), transition_kind);
    assert_eq!(
        transition.child_traversal_blocker(),
        child_traversal_blocker
    );
    assert_eq!(transition.render_lanes(), render_lanes);
    assert_eq!(transition.previous_lanes(), previous_lanes);
    assert_eq!(transition.previous_child_lanes(), previous_child_lanes);
    assert_eq!(transition.work_in_progress_lanes(), work_in_progress_lanes);
    assert_eq!(
        transition.work_in_progress_child_lanes(),
        work_in_progress_child_lanes
    );
    assert_eq!(
        transition.render_includes_offscreen_lane(),
        render_includes_offscreen_lane
    );
    assert_eq!(
        transition.work_in_progress_includes_offscreen_lane(),
        work_in_progress_includes_offscreen_lane
    );
}

#[test]
fn begin_work_fails_closed_with_offscreen_visibility_transition_diagnostics() {
    let hidden_to_visible_render_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
    let previous_lanes = Lanes::OFFSCREEN;
    let previous_child_lanes = Lanes::from(Lane::RETRY_1);
    let work_in_progress_lanes = Lanes::DEFAULT;
    let work_in_progress_child_lanes = Lanes::from(Lane::TRANSITION_1);
    let (mut hidden_to_visible_arena, previous, work_in_progress, child) =
        offscreen_transition_pair(
            "hidden-panel",
            StateHandle::from_raw(896),
            StateHandle::NONE,
            previous_lanes,
            previous_child_lanes,
            work_in_progress_lanes,
            work_in_progress_child_lanes,
        );
    let mut registry = TestFunctionComponentRegistry::default();

    let error = begin_work(
        &mut hidden_to_visible_arena,
        BeginWorkRequest::new(work_in_progress, hidden_to_visible_render_lanes),
        &mut registry,
    )
    .unwrap_err();

    let record = match error {
        BeginWorkError::UnsupportedOffscreenChildShape(record) => record,
        other => panic!("expected Offscreen visibility diagnostic, got {other:?}"),
    };
    assert_eq!(record.fiber(), work_in_progress);
    assert_eq!(record.child(), Some(child));
    assert_eq!(record.child_tag(), Some(FiberTag::HostComponent));
    assert_eq!(record.child_sibling(), None);
    assert_eq!(
        record.shape(),
        UnsupportedOffscreenChildShapeKind::SingleChild
    );
    assert_eq!(record.render_lanes(), hidden_to_visible_render_lanes);
    assert_offscreen_visibility_transition(
        record
            .visibility_transition()
            .expect("hidden to visible transition diagnostic"),
        previous,
        work_in_progress,
        "hidden-panel",
        UnsupportedOffscreenVisibilityMode::Visible,
        UnsupportedOffscreenVisibility::Hidden,
        UnsupportedOffscreenVisibility::Visible,
        UnsupportedOffscreenVisibilityTransitionKind::HiddenToVisible,
        UnsupportedOffscreenVisibilityChildTraversalBlocker::BeginWorkDoesNotTraverseOffscreenChildren,
        hidden_to_visible_render_lanes,
        previous_lanes,
        previous_child_lanes,
        work_in_progress_lanes,
        work_in_progress_child_lanes,
        true,
        false,
    );
    let transition = record
        .visibility_transition()
        .expect("hidden to visible transition diagnostic");
    assert!(transition.is_hidden_to_visible_reveal());
    assert!(!transition.is_visible_to_hidden_hide());
    assert!(transition.records_offscreen_lane_participation());
    assert_eq!(
        hidden_to_visible_arena
            .get(work_in_progress)
            .unwrap()
            .memoized_state(),
        StateHandle::NONE
    );

    let visible_to_hidden_render_lanes = Lanes::DEFAULT;
    let previous_lanes = Lanes::SYNC;
    let previous_child_lanes = Lanes::from(Lane::TRANSITION_2);
    let work_in_progress_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
    let work_in_progress_child_lanes = Lanes::from(Lane::RETRY_2);
    let (mut visible_to_hidden_arena, previous, work_in_progress, child) =
        offscreen_transition_pair(
            "visible-panel",
            StateHandle::NONE,
            StateHandle::from_raw(897),
            previous_lanes,
            previous_child_lanes,
            work_in_progress_lanes,
            work_in_progress_child_lanes,
        );

    let error = begin_work(
        &mut visible_to_hidden_arena,
        BeginWorkRequest::new(work_in_progress, visible_to_hidden_render_lanes),
        &mut registry,
    )
    .unwrap_err();

    let record = match error {
        BeginWorkError::UnsupportedOffscreenChildShape(record) => record,
        other => panic!("expected Offscreen visibility diagnostic, got {other:?}"),
    };
    assert_eq!(record.fiber(), work_in_progress);
    assert_eq!(record.child(), Some(child));
    assert_eq!(record.child_tag(), Some(FiberTag::HostComponent));
    assert_eq!(record.child_sibling(), None);
    assert_eq!(
        record.shape(),
        UnsupportedOffscreenChildShapeKind::SingleChild
    );
    assert_eq!(record.render_lanes(), visible_to_hidden_render_lanes);
    assert_offscreen_visibility_transition(
        record
            .visibility_transition()
            .expect("visible to hidden transition diagnostic"),
        previous,
        work_in_progress,
        "visible-panel",
        UnsupportedOffscreenVisibilityMode::Hidden,
        UnsupportedOffscreenVisibility::Visible,
        UnsupportedOffscreenVisibility::Hidden,
        UnsupportedOffscreenVisibilityTransitionKind::VisibleToHidden,
        UnsupportedOffscreenVisibilityChildTraversalBlocker::BeginWorkDoesNotTraverseOffscreenChildren,
        visible_to_hidden_render_lanes,
        previous_lanes,
        previous_child_lanes,
        work_in_progress_lanes,
        work_in_progress_child_lanes,
        false,
        true,
    );
    let transition = record
        .visibility_transition()
        .expect("visible to hidden transition diagnostic");
    assert!(!transition.is_hidden_to_visible_reveal());
    assert!(transition.is_visible_to_hidden_hide());
    assert!(transition.records_offscreen_lane_participation());
    assert_eq!(
        visible_to_hidden_arena
            .get(work_in_progress)
            .unwrap()
            .memoized_state(),
        StateHandle::from_raw(897)
    );
    assert!(registry.calls().is_empty());
}

#[test]
fn begin_work_fails_closed_with_suspense_list_and_activity_child_shape_diagnostics() {
    let mut registry = TestFunctionComponentRegistry::default();

    let mut suspense_list_arena = FiberArena::new();
    let suspense_list = suspense_list_arena.create_fiber(
        FiberTag::SuspenseList,
        Some(ReactKey::from_normalized("rows")),
        PropsHandle::from_raw(860),
        FiberMode::NO,
    );
    {
        let node = suspense_list_arena.get_mut(suspense_list).unwrap();
        node.set_memoized_props(PropsHandle::from_raw(861));
        node.set_memoized_state(StateHandle::from_raw(862));
    }
    let first_row = suspense_list_arena.create_fiber(
        FiberTag::Suspense,
        None,
        PropsHandle::from_raw(863),
        FiberMode::NO,
    );
    let second_row = suspense_list_arena.create_fiber(
        FiberTag::Suspense,
        None,
        PropsHandle::from_raw(864),
        FiberMode::NO,
    );
    suspense_list_arena
        .set_children(suspense_list, &[first_row, second_row])
        .unwrap();

    let suspense_list_error = begin_work(
        &mut suspense_list_arena,
        BeginWorkRequest::new(suspense_list, Lanes::from(Lane::RETRY_3)),
        &mut registry,
    )
    .unwrap_err();

    let suspense_list_record = match suspense_list_error {
        BeginWorkError::UnsupportedSuspenseListChildShape(record) => record,
        other => panic!("expected SuspenseList child-shape diagnostic, got {other:?}"),
    };
    assert_eq!(suspense_list_record.fiber(), suspense_list);
    assert_eq!(
        suspense_list_record.key().map(ReactKey::as_str),
        Some("rows")
    );
    assert_eq!(
        suspense_list_record.pending_props(),
        PropsHandle::from_raw(860)
    );
    assert_eq!(
        suspense_list_record.memoized_props(),
        PropsHandle::from_raw(861)
    );
    assert_eq!(
        suspense_list_record.memoized_state(),
        StateHandle::from_raw(862)
    );
    assert_eq!(suspense_list_record.child(), Some(first_row));
    assert_eq!(suspense_list_record.child_tag(), Some(FiberTag::Suspense));
    assert_eq!(suspense_list_record.child_sibling(), Some(second_row));
    assert_eq!(
        suspense_list_record.child_sibling_tag(),
        Some(FiberTag::Suspense)
    );
    assert_eq!(
        suspense_list_record.shape(),
        UnsupportedSuspenseListChildShapeKind::MultipleChildren
    );
    assert_eq!(
        suspense_list_record.render_lanes(),
        Lanes::from(Lane::RETRY_3)
    );
    assert_eq!(
        suspense_list_record.feature(),
        SUSPENSE_LIST_UNSUPPORTED_FEATURE
    );
    assert_eq!(
        suspense_list_arena.get(first_row).unwrap().return_fiber(),
        Some(suspense_list)
    );
    assert_eq!(
        suspense_list_arena.get(second_row).unwrap().return_fiber(),
        Some(suspense_list)
    );

    let mut activity_arena = FiberArena::new();
    let activity = activity_arena.create_fiber(
        FiberTag::Activity,
        Some(ReactKey::from_normalized("activity")),
        PropsHandle::from_raw(870),
        FiberMode::NO,
    );
    {
        let node = activity_arena.get_mut(activity).unwrap();
        node.set_memoized_props(PropsHandle::from_raw(871));
        node.set_state_node(StateNodeHandle::from_raw(872));
    }
    let primary = activity_arena.create_fiber(
        FiberTag::Offscreen,
        None,
        PropsHandle::from_raw(873),
        FiberMode::NO,
    );
    let primary_child = activity_arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(874),
        FiberMode::NO,
    );
    activity_arena
        .set_children(primary, &[primary_child])
        .unwrap();
    activity_arena.set_children(activity, &[primary]).unwrap();

    let activity_error = begin_work(
        &mut activity_arena,
        BeginWorkRequest::new(activity, Lanes::from(Lane::RETRY_2)),
        &mut registry,
    )
    .unwrap_err();

    let activity_record = match activity_error {
        BeginWorkError::UnsupportedActivityChildShape(record) => record,
        other => panic!("expected Activity child-shape diagnostic, got {other:?}"),
    };
    assert_eq!(activity_record.fiber(), activity);
    assert_eq!(
        activity_record.key().map(ReactKey::as_str),
        Some("activity")
    );
    assert_eq!(activity_record.pending_props(), PropsHandle::from_raw(870));
    assert_eq!(activity_record.memoized_props(), PropsHandle::from_raw(871));
    assert_eq!(activity_record.memoized_state(), StateHandle::NONE);
    assert_eq!(activity_record.state_node(), StateNodeHandle::from_raw(872));
    assert_eq!(activity_record.child(), Some(primary));
    assert_eq!(activity_record.child_tag(), Some(FiberTag::Offscreen));
    assert_eq!(activity_record.child_sibling(), None);
    assert_eq!(activity_record.child_sibling_tag(), None);
    assert_eq!(
        activity_record.shape(),
        UnsupportedActivityChildShapeKind::PrimaryOffscreen
    );
    assert_eq!(activity_record.render_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(activity_record.feature(), ACTIVITY_UNSUPPORTED_FEATURE);
    assert_eq!(
        activity_arena.get(primary).unwrap().return_fiber(),
        Some(activity)
    );
    assert_eq!(
        activity_arena.get(primary_child).unwrap().return_fiber(),
        Some(primary)
    );

    let mut dehydrated_activity_arena = FiberArena::new();
    let dehydrated_activity = dehydrated_activity_arena.create_fiber(
        FiberTag::Activity,
        None,
        PropsHandle::from_raw(880),
        FiberMode::NO,
    );
    dehydrated_activity_arena
        .get_mut(dehydrated_activity)
        .unwrap()
        .set_memoized_state(StateHandle::from_raw(881));

    let dehydrated_error = begin_work(
        &mut dehydrated_activity_arena,
        BeginWorkRequest::new(dehydrated_activity, Lanes::OFFSCREEN),
        &mut registry,
    )
    .unwrap_err();

    let dehydrated_record = match dehydrated_error {
        BeginWorkError::UnsupportedActivityChildShape(record) => record,
        other => panic!("expected dehydrated Activity diagnostic, got {other:?}"),
    };
    assert_eq!(dehydrated_record.fiber(), dehydrated_activity);
    assert_eq!(
        dehydrated_record.pending_props(),
        PropsHandle::from_raw(880)
    );
    assert_eq!(
        dehydrated_record.memoized_state(),
        StateHandle::from_raw(881)
    );
    assert_eq!(dehydrated_record.child(), None);
    assert_eq!(
        dehydrated_record.shape(),
        UnsupportedActivityChildShapeKind::Dehydrated
    );
    assert_eq!(dehydrated_record.render_lanes(), Lanes::OFFSCREEN);
    assert_eq!(dehydrated_record.feature(), ACTIVITY_UNSUPPORTED_FEATURE);

    assert!(registry.calls().is_empty());
}

#[test]
fn begin_work_single_child_reconciliation_fails_closed_for_unknown_output() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let output = FunctionComponentOutputHandle::from_raw(93);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver = StaticSingleChildResolver::new(None);

    let error = begin_work_reconcile_function_component_single_child(
        &mut arena,
        BeginWorkRequest::new(work_in_progress, Lanes::DEFAULT),
        &mut registry,
        &resolver,
    )
    .unwrap_err();

    assert_eq!(
        error,
        BeginWorkError::FunctionComponentSingleChild(
            FunctionComponentSingleChildReconciliationError::UnknownOutput {
                fiber: work_in_progress,
                output,
            }
        )
    );
    assert_eq!(registry.calls().len(), 1);
}

#[test]
fn begin_work_rejects_non_function_component_tags_without_invoking() {
    let unsupported_tags = [
        FiberTag::HostRoot,
        FiberTag::ClassComponent,
        FiberTag::ContextProvider,
        FiberTag::Suspense,
        FiberTag::Offscreen,
        FiberTag::Activity,
        FiberTag::ViewTransition,
        FiberTag::SuspenseList,
    ];

    for tag in unsupported_tags {
        let mut arena = FiberArena::new();
        let work_in_progress = arena.create_fiber(tag, None, PropsHandle::NONE, FiberMode::NO);
        let mut registry = TestFunctionComponentRegistry::default();

        let error = begin_work(
            &mut arena,
            BeginWorkRequest::new(work_in_progress, Lanes::DEFAULT),
            &mut registry,
        )
        .unwrap_err();

        match tag {
            FiberTag::Suspense => match error {
                BeginWorkError::UnsupportedSuspenseChildShape(record) => {
                    assert_eq!(record.fiber(), work_in_progress);
                    assert_eq!(record.shape(), UnsupportedSuspenseChildShapeKind::Empty);
                    assert_eq!(record.child(), None);
                    assert_eq!(record.feature(), SUSPENSE_UNSUPPORTED_FEATURE);
                }
                other => panic!("expected Suspense shape diagnostic, got {other:?}"),
            },
            FiberTag::Offscreen => match error {
                BeginWorkError::UnsupportedOffscreenChildShape(record) => {
                    assert_eq!(record.fiber(), work_in_progress);
                    assert_eq!(record.shape(), UnsupportedOffscreenChildShapeKind::Empty);
                    assert_eq!(record.child(), None);
                    assert_eq!(record.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);
                }
                other => panic!("expected Offscreen shape diagnostic, got {other:?}"),
            },
            FiberTag::Activity => match error {
                BeginWorkError::UnsupportedActivityChildShape(record) => {
                    assert_eq!(record.fiber(), work_in_progress);
                    assert_eq!(record.shape(), UnsupportedActivityChildShapeKind::Empty);
                    assert_eq!(record.child(), None);
                    assert_eq!(record.feature(), ACTIVITY_UNSUPPORTED_FEATURE);
                }
                other => panic!("expected Activity shape diagnostic, got {other:?}"),
            },
            FiberTag::SuspenseList => match error {
                BeginWorkError::UnsupportedSuspenseListChildShape(record) => {
                    assert_eq!(record.fiber(), work_in_progress);
                    assert_eq!(record.shape(), UnsupportedSuspenseListChildShapeKind::Empty);
                    assert_eq!(record.child(), None);
                    assert_eq!(record.feature(), SUSPENSE_LIST_UNSUPPORTED_FEATURE);
                }
                other => panic!("expected SuspenseList shape diagnostic, got {other:?}"),
            },
            _ => assert_eq!(
                error,
                BeginWorkError::UnsupportedFiberTag {
                    fiber: work_in_progress,
                    tag,
                }
            ),
        }
        assert!(registry.calls().is_empty());
    }
}

#[test]
fn begin_work_fails_closed_for_portal_fibers_without_invoking_or_scheduling_children() {
    let mut arena = FiberArena::new();
    let portal = arena.create_fiber(
        FiberTag::Portal,
        Some(ReactKey::from_normalized("portal-key")),
        PropsHandle::from_raw(303),
        FiberMode::NO,
    );
    arena
        .get_mut(portal)
        .unwrap()
        .set_state_node(StateNodeHandle::from_raw(404));
    let portal_child = arena.create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(505),
        FiberMode::NO,
    );
    arena.set_children(portal, &[portal_child]).unwrap();
    let mut registry = TestFunctionComponentRegistry::default();

    let error = begin_work(
        &mut arena,
        BeginWorkRequest::new(portal, Lanes::DEFAULT),
        &mut registry,
    )
    .unwrap_err();

    let record = match error {
        BeginWorkError::UnsupportedPortal(record) => record,
        other => panic!("expected portal diagnostic, got {other:?}"),
    };
    assert_eq!(record.fiber(), portal);
    assert_eq!(record.key().map(ReactKey::as_str), Some("portal-key"));
    assert_eq!(record.pending_props(), PropsHandle::from_raw(303));
    assert_eq!(record.state_node(), StateNodeHandle::from_raw(404));
    assert_eq!(record.child(), Some(portal_child));
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(record.feature(), PORTAL_RECONCILER_UNSUPPORTED_FEATURE);
    assert!(registry.calls().is_empty());

    let portal_node = arena.get(portal).unwrap();
    assert_eq!(portal_node.child(), Some(portal_child));
    assert_eq!(portal_node.memoized_props(), PropsHandle::NONE);
    assert_eq!(portal_node.lanes(), Lanes::NO);
    let child_node = arena.get(portal_child).unwrap();
    assert_eq!(child_node.return_fiber(), Some(portal));
    assert_eq!(child_node.memoized_props(), PropsHandle::NONE);
    assert_eq!(child_node.lanes(), Lanes::NO);
}

#[test]
fn begin_work_propagates_function_component_invocation_errors() {
    let (mut arena, _current, work_in_progress, component) = function_component_pair();
    let invocation_error = FunctionComponentInvocationError::component_error("boom");
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Err(invocation_error.clone()));

    let error = begin_work(
        &mut arena,
        BeginWorkRequest::new(work_in_progress, Lanes::DEFAULT),
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        BeginWorkError::FunctionComponent(FunctionComponentRenderError::Invocation {
            fiber: work_in_progress,
            component,
            error: invocation_error,
        })
    );
    assert_eq!(
        arena.get(work_in_progress).unwrap().memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn begin_work_does_not_commit_switch_root_or_mutate_host() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let root_current = store.root(root_id).unwrap().current();
    let current = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(1),
        FiberMode::NO,
    );
    let component = FiberTypeHandle::from_raw(201);
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
    registry.register(component, Ok(FunctionComponentOutputHandle::from_raw(88)));

    let result = begin_work(
        store.fiber_arena_mut(),
        BeginWorkRequest::new(work_in_progress, Lanes::DEFAULT),
        &mut registry,
    )
    .unwrap()
    .function_component();

    assert_eq!(result.output(), FunctionComponentOutputHandle::from_raw(88));
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), root_current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        None
    );
}
