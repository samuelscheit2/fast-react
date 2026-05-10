//! Private begin-work handoff for function components.
//!
//! This is intentionally below the public work loop. The default handoff
//! delegates only the accepted function-component render skeleton; the private
//! single-child helper records one admitted HostComponent/HostText output for
//! root-loop canaries. It does not implement broad reconciliation, complete
//! host work, commit effects, mutate hosts, or switch roots.

#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ContextHandle, FiberArena, FiberId, FiberTag, FiberTopologyError, Lanes, PropsHandle, ReactKey,
    StateNodeHandle,
};

use crate::function_component::{
    FunctionComponentContextRenderState, FunctionComponentContextRenderStore,
    FunctionComponentInvoker, FunctionComponentOutputHandle, FunctionComponentRenderError,
    FunctionComponentRenderRecord, FunctionComponentSingleChildOutputResolver,
    FunctionComponentSingleChildReconciliationError,
    FunctionComponentSingleChildReconciliationRecord,
    reconcile_function_component_single_child_output, render_function_component,
    render_function_component_with_context_reads,
};

pub(crate) const PORTAL_RECONCILER_UNSUPPORTED_FEATURE: &str = "Reconciler.fiber.Portal";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct BeginWorkRequest {
    work_in_progress: FiberId,
    render_lanes: Lanes,
}

impl BeginWorkRequest {
    #[must_use]
    pub const fn new(work_in_progress: FiberId, render_lanes: Lanes) -> Self {
        Self {
            work_in_progress,
            render_lanes,
        }
    }

    #[must_use]
    pub const fn work_in_progress(self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum BeginWorkResult {
    FunctionComponent(FunctionComponentBeginWorkRecord),
}

impl BeginWorkResult {
    #[must_use]
    pub const fn function_component(self) -> FunctionComponentBeginWorkRecord {
        match self {
            Self::FunctionComponent(record) => record,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct UnsupportedPortalBeginWorkRecord {
    fiber: FiberId,
    key: Option<ReactKey>,
    pending_props: PropsHandle,
    state_node: StateNodeHandle,
    child: Option<FiberId>,
    render_lanes: Lanes,
    feature: &'static str,
}

impl UnsupportedPortalBeginWorkRecord {
    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) fn key(&self) -> Option<&ReactKey> {
        self.key.as_ref()
    }

    #[must_use]
    pub(crate) const fn pending_props(&self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub(crate) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn child(&self) -> Option<FiberId> {
        self.child
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn feature(&self) -> &'static str {
        self.feature
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentBeginWorkRecord {
    render: FunctionComponentRenderRecord,
}

impl FunctionComponentBeginWorkRecord {
    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.render
    }

    #[must_use]
    pub const fn current(self) -> Option<FiberId> {
        self.render.current()
    }

    #[must_use]
    pub const fn work_in_progress(self) -> FiberId {
        self.render.work_in_progress()
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render.render_lanes()
    }

    #[must_use]
    pub const fn output(self) -> FunctionComponentOutputHandle {
        self.render.output()
    }

    #[must_use]
    pub const fn context_state(self) -> Option<FunctionComponentContextRenderState> {
        self.render.context_state()
    }

    #[must_use]
    pub const fn context_read_count(self) -> usize {
        self.render.context_read_count()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentSingleChildBeginWorkRecord {
    begin_work: FunctionComponentBeginWorkRecord,
    single_child: FunctionComponentSingleChildReconciliationRecord,
}

impl FunctionComponentSingleChildBeginWorkRecord {
    #[must_use]
    pub const fn begin_work(self) -> FunctionComponentBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub const fn single_child(self) -> FunctionComponentSingleChildReconciliationRecord {
        self.single_child
    }

    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.begin_work.render()
    }

    #[must_use]
    pub const fn work_in_progress(self) -> FiberId {
        self.begin_work.work_in_progress()
    }

    #[must_use]
    pub const fn output(self) -> FunctionComponentOutputHandle {
        self.begin_work.output()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum BeginWorkError {
    FiberTopology(FiberTopologyError),
    FunctionComponent(FunctionComponentRenderError),
    FunctionComponentSingleChild(FunctionComponentSingleChildReconciliationError),
    UnsupportedPortal(UnsupportedPortalBeginWorkRecord),
    UnsupportedFiberTag { fiber: FiberId, tag: FiberTag },
}

impl Display for BeginWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::FunctionComponent(error) => Display::fmt(error, formatter),
            Self::FunctionComponentSingleChild(error) => Display::fmt(error, formatter),
            Self::UnsupportedPortal(record) => write!(
                formatter,
                "portal fiber {} reached begin-work but {feature} is unsupported; key {:?}, child {:?}, pending props {:?}, state node {:?}",
                record.fiber().slot().get(),
                record.key().map(ReactKey::as_str),
                record.child().map(|fiber| fiber.slot().get()),
                record.pending_props(),
                record.state_node(),
                feature = record.feature()
            ),
            Self::UnsupportedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} has unsupported begin-work tag {:?}; only FunctionComponent is delegated by this private handoff",
                fiber.slot().get(),
                tag
            ),
        }
    }
}

impl Error for BeginWorkError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::FunctionComponent(error) => Some(error),
            Self::FunctionComponentSingleChild(error) => Some(error),
            Self::UnsupportedPortal(_) | Self::UnsupportedFiberTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for BeginWorkError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<FunctionComponentRenderError> for BeginWorkError {
    fn from(error: FunctionComponentRenderError) -> Self {
        Self::FunctionComponent(error)
    }
}

impl From<FunctionComponentSingleChildReconciliationError> for BeginWorkError {
    fn from(error: FunctionComponentSingleChildReconciliationError) -> Self {
        Self::FunctionComponentSingleChild(error)
    }
}

pub(crate) fn unsupported_portal_begin_work_record(
    arena: &FiberArena,
    request: BeginWorkRequest,
) -> Result<UnsupportedPortalBeginWorkRecord, BeginWorkError> {
    let fiber = request.work_in_progress();
    let node = arena.get(fiber)?;
    let tag = node.tag();

    if tag != FiberTag::Portal {
        return Err(BeginWorkError::UnsupportedFiberTag { fiber, tag });
    }

    Ok(UnsupportedPortalBeginWorkRecord {
        fiber,
        key: node.key().cloned(),
        pending_props: node.pending_props(),
        state_node: node.state_node(),
        child: node.child(),
        render_lanes: request.render_lanes(),
        feature: PORTAL_RECONCILER_UNSUPPORTED_FEATURE,
    })
}

pub(crate) fn begin_work(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<BeginWorkResult, BeginWorkError> {
    let work_in_progress = request.work_in_progress();
    let tag = arena.get(work_in_progress)?.tag();

    if tag != FiberTag::FunctionComponent {
        if tag == FiberTag::Portal {
            return Err(BeginWorkError::UnsupportedPortal(
                unsupported_portal_begin_work_record(arena, request)?,
            ));
        }

        return Err(BeginWorkError::UnsupportedFiberTag {
            fiber: work_in_progress,
            tag,
        });
    }

    let render =
        render_function_component(arena, work_in_progress, request.render_lanes(), invoker)?;

    Ok(BeginWorkResult::FunctionComponent(
        FunctionComponentBeginWorkRecord { render },
    ))
}

pub(crate) fn begin_work_with_context_reads(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    contexts: &[ContextHandle],
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<BeginWorkResult, BeginWorkError> {
    let work_in_progress = request.work_in_progress();
    let tag = arena.get(work_in_progress)?.tag();

    if tag != FiberTag::FunctionComponent {
        if tag == FiberTag::Portal {
            return Err(BeginWorkError::UnsupportedPortal(
                unsupported_portal_begin_work_record(arena, request)?,
            ));
        }

        return Err(BeginWorkError::UnsupportedFiberTag {
            fiber: work_in_progress,
            tag,
        });
    }

    let render = render_function_component_with_context_reads(
        arena,
        context_store,
        work_in_progress,
        request.render_lanes(),
        contexts,
        invoker,
    )?;

    Ok(BeginWorkResult::FunctionComponent(
        FunctionComponentBeginWorkRecord { render },
    ))
}

pub(crate) fn begin_work_reconcile_function_component_single_child(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    invoker: &mut impl FunctionComponentInvoker,
    resolver: &impl FunctionComponentSingleChildOutputResolver,
) -> Result<FunctionComponentSingleChildBeginWorkRecord, BeginWorkError> {
    let begin_work = begin_work(arena, request, invoker)?.function_component();
    let single_child =
        reconcile_function_component_single_child_output(arena, begin_work.render(), resolver)?;

    Ok(FunctionComponentSingleChildBeginWorkRecord {
        begin_work,
        single_child,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::function_component::{
        FunctionComponentInvocationError, FunctionComponentInvocationRequest,
        FunctionComponentSingleChildOutput, FunctionComponentSingleChildOutputResolver,
        FunctionComponentSingleChildReconciliationError,
    };
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{FiberRootStore, RootElementHandle, RootOptions};
    use fast_react_core::{
        ContextHandle, ContextStackSnapshot, ContextValueHandle, ElementTypeHandle, FiberMode,
        FiberTypeHandle, PropsHandle, ReactKey, StateHandle, StateNodeHandle, UpdateQueueHandle,
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
        assert_eq!(context_store.context_stack().stack_depth(), 1);

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
        assert_eq!(context_store.context_stack().stack_depth(), 0);
        assert_eq!(
            context_store
                .context_stack()
                .context_slot(context)
                .unwrap()
                .active_provider_count(),
            0
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
        let resolver = StaticSingleChildResolver::new(Some(
            FunctionComponentSingleChildOutput::host_component(
                output,
                child_element,
                child_type,
                child_props,
            ),
        ));

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

            assert_eq!(
                error,
                BeginWorkError::UnsupportedFiberTag {
                    fiber: work_in_progress,
                    tag,
                }
            );
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
}
