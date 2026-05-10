//! Private function-component render skeleton.
//!
//! This module proves the reconciler-side invocation boundary without public
//! hook facades, effects, host mutation, or child reconciliation.

#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    FiberArena, FiberId, FiberTag, FiberTopologyError, FiberTypeHandle, Lanes, PropsHandle,
    StateHandle, UpdateQueueHandle,
};

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct FunctionComponentOutputHandle(u64);

impl FunctionComponentOutputHandle {
    pub const NONE: Self = Self(0);

    #[must_use]
    pub const fn from_raw(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub const fn raw(self) -> u64 {
        self.0
    }

    #[must_use]
    pub const fn is_none(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub const fn is_some(self) -> bool {
        self.0 != 0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentInvocationRequest {
    fiber: FiberId,
    component: FiberTypeHandle,
    props: PropsHandle,
    render_lanes: Lanes,
}

impl FunctionComponentInvocationRequest {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn component(self) -> FiberTypeHandle {
        self.component
    }

    #[must_use]
    pub const fn props(self) -> PropsHandle {
        self.props
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }
}

pub(crate) trait FunctionComponentInvoker {
    fn invoke_function_component(
        &mut self,
        request: FunctionComponentInvocationRequest,
    ) -> Result<FunctionComponentOutputHandle, FunctionComponentInvocationError>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UnsupportedFunctionComponentFeature {
    Hook { name: &'static str },
    Context,
    ClassComponent,
    ThrownValue,
}

impl Display for UnsupportedFunctionComponentFeature {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Hook { name } => write!(
                formatter,
                "hook {name} is not supported by the private function-component render skeleton"
            ),
            Self::Context => write!(
                formatter,
                "context is not supported by the private function-component render skeleton"
            ),
            Self::ClassComponent => write!(
                formatter,
                "class components are not supported by the private function-component render skeleton"
            ),
            Self::ThrownValue => write!(
                formatter,
                "thrown render values are not supported by the private function-component render skeleton"
            ),
        }
    }
}

impl Error for UnsupportedFunctionComponentFeature {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum FunctionComponentInvocationError {
    Unsupported(UnsupportedFunctionComponentFeature),
    ComponentError { message: &'static str },
}

impl FunctionComponentInvocationError {
    #[must_use]
    pub const fn unsupported_hook(name: &'static str) -> Self {
        Self::Unsupported(UnsupportedFunctionComponentFeature::Hook { name })
    }

    #[must_use]
    pub const fn unsupported_context() -> Self {
        Self::Unsupported(UnsupportedFunctionComponentFeature::Context)
    }

    #[must_use]
    pub const fn unsupported_thrown_value() -> Self {
        Self::Unsupported(UnsupportedFunctionComponentFeature::ThrownValue)
    }

    #[must_use]
    pub const fn component_error(message: &'static str) -> Self {
        Self::ComponentError { message }
    }
}

impl Display for FunctionComponentInvocationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Unsupported(feature) => Display::fmt(feature, formatter),
            Self::ComponentError { message } => {
                write!(formatter, "function component invocation failed: {message}")
            }
        }
    }
}

impl Error for FunctionComponentInvocationError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Unsupported(feature) => Some(feature),
            Self::ComponentError { .. } => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum FunctionComponentRenderError {
    FiberTopology(FiberTopologyError),
    MissingComponentHandle {
        fiber: FiberId,
    },
    Unsupported {
        fiber: FiberId,
        feature: UnsupportedFunctionComponentFeature,
    },
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    Invocation {
        fiber: FiberId,
        component: FiberTypeHandle,
        error: FunctionComponentInvocationError,
    },
}

impl Display for FunctionComponentRenderError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::MissingComponentHandle { fiber } => write!(
                formatter,
                "function component fiber {} has no component handle",
                fiber.slot().get()
            ),
            Self::Unsupported { fiber, feature } => write!(
                formatter,
                "function component fiber {} cannot render: {feature}",
                fiber.slot().get()
            ),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be FunctionComponent to use the private function-component render skeleton, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::Invocation {
                fiber,
                component,
                error,
            } => write!(
                formatter,
                "function component fiber {} component handle {} failed during invocation: {error}",
                fiber.slot().get(),
                component.raw()
            ),
        }
    }
}

impl Error for FunctionComponentRenderError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::Invocation { error, .. } => Some(error),
            Self::MissingComponentHandle { .. }
            | Self::Unsupported { .. }
            | Self::UnexpectedFiberTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for FunctionComponentRenderError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentRenderRecord {
    current: Option<FiberId>,
    work_in_progress: FiberId,
    component: FiberTypeHandle,
    props: PropsHandle,
    render_lanes: Lanes,
    output: FunctionComponentOutputHandle,
}

impl FunctionComponentRenderRecord {
    #[must_use]
    pub const fn current(self) -> Option<FiberId> {
        self.current
    }

    #[must_use]
    pub const fn work_in_progress(self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub const fn component(self) -> FiberTypeHandle {
        self.component
    }

    #[must_use]
    pub const fn props(self) -> PropsHandle {
        self.props
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn output(self) -> FunctionComponentOutputHandle {
        self.output
    }
}

pub(crate) fn render_function_component(
    arena: &mut FiberArena,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<FunctionComponentRenderRecord, FunctionComponentRenderError> {
    let request = prepare_function_component_render(arena, work_in_progress, render_lanes)?;
    let output = invoker
        .invoke_function_component(request)
        .map_err(|error| FunctionComponentRenderError::Invocation {
            fiber: request.fiber(),
            component: request.component(),
            error,
        })?;

    arena
        .get_mut(work_in_progress)?
        .set_memoized_props(request.props());

    Ok(FunctionComponentRenderRecord {
        current: arena.get(work_in_progress)?.alternate(),
        work_in_progress,
        component: request.component(),
        props: request.props(),
        render_lanes: request.render_lanes(),
        output,
    })
}

fn prepare_function_component_render(
    arena: &mut FiberArena,
    work_in_progress: FiberId,
    render_lanes: Lanes,
) -> Result<FunctionComponentInvocationRequest, FunctionComponentRenderError> {
    let node = arena.get(work_in_progress)?;
    let tag = node.tag();
    let component = node.fiber_type();
    let props = node.pending_props();

    match tag {
        FiberTag::FunctionComponent => {}
        FiberTag::ClassComponent | FiberTag::IncompleteClassComponent => {
            return Err(FunctionComponentRenderError::Unsupported {
                fiber: work_in_progress,
                feature: UnsupportedFunctionComponentFeature::ClassComponent,
            });
        }
        FiberTag::ContextConsumer | FiberTag::ContextProvider => {
            return Err(FunctionComponentRenderError::Unsupported {
                fiber: work_in_progress,
                feature: UnsupportedFunctionComponentFeature::Context,
            });
        }
        FiberTag::Throw => {
            return Err(FunctionComponentRenderError::Unsupported {
                fiber: work_in_progress,
                feature: UnsupportedFunctionComponentFeature::ThrownValue,
            });
        }
        other => {
            return Err(FunctionComponentRenderError::UnexpectedFiberTag {
                fiber: work_in_progress,
                tag: other,
            });
        }
    }

    if component.is_none() {
        return Err(FunctionComponentRenderError::MissingComponentHandle {
            fiber: work_in_progress,
        });
    }

    let node = arena.get_mut(work_in_progress)?;
    node.set_memoized_state(StateHandle::NONE);
    node.set_update_queue(UpdateQueueHandle::NONE);
    node.set_lanes(Lanes::NO);

    Ok(FunctionComponentInvocationRequest {
        fiber: work_in_progress,
        component,
        props,
        render_lanes,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{FiberRootStore, RootOptions};
    use fast_react_core::{FiberMode, FiberTypeHandle, PropsHandle};

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
        let throw_fiber =
            arena.create_fiber(FiberTag::Throw, None, PropsHandle::NONE, FiberMode::NO);
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
            FunctionComponentInvocationError::unsupported_context(),
            FunctionComponentInvocationError::unsupported_thrown_value(),
        ];

        for invocation_error in unsupported {
            let (mut arena, _current, work_in_progress, component) = function_component_pair();
            let mut registry = TestFunctionComponentRegistry::default();
            registry.register(component, Err(invocation_error.clone()));

            let error = render_function_component(
                &mut arena,
                work_in_progress,
                Lanes::DEFAULT,
                &mut registry,
            )
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

        let record = render_function_component(
            store.fiber_arena_mut(),
            work_in_progress,
            Lanes::DEFAULT,
            &mut registry,
        )
        .unwrap();

        assert_eq!(record.output(), FunctionComponentOutputHandle::from_raw(55));
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), root_current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }
}
