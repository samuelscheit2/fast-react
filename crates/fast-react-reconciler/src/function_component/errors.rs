use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ContextHandle, ContextStackError, ElementTypeHandle, FiberId, FiberTag, FiberTopologyError,
    FiberTypeHandle, HookEffectArenaError, HookEffectId, HookListError, HookQueueError,
    HookQueueId, HookSlotId, HookUpdateId, HookUpdateLane, Lanes, PropsHandle, StateHandle,
};

use crate::{ConcurrentUpdateError, RootSchedulerError};

use super::{
    FunctionComponentHookRenderPhase, FunctionComponentOutputHandle,
    FunctionComponentRenderAttemptId, FunctionComponentStateDispatchHandle,
    FunctionComponentStateReducerId,
};

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
    HookList {
        fiber: FiberId,
        error: Box<HookListError>,
    },
    HookEffect {
        fiber: FiberId,
        error: Box<HookEffectArenaError>,
    },
    HookQueue {
        fiber: FiberId,
        error: Box<HookQueueError>,
    },
    ContextStack {
        fiber: FiberId,
        error: Box<ContextStackError>,
    },
    MissingCurrentHookList {
        fiber: FiberId,
    },
    MissingStateHookPayload {
        fiber: FiberId,
        hook: HookSlotId,
    },
    MissingMemoHookRecord {
        fiber: FiberId,
        hook: HookSlotId,
    },
    MissingRefHookRecord {
        fiber: FiberId,
        hook: HookSlotId,
    },
    MissingStateDispatch {
        fiber: FiberId,
        queue: HookQueueId,
    },
    ExpectedReducerQueue {
        fiber: FiberId,
        queue: HookQueueId,
    },
    MissingStateDispatchReducer {
        fiber: FiberId,
        queue: HookQueueId,
    },
    StateDispatchEagerStateMismatch {
        fiber: FiberId,
        queue: HookQueueId,
        expected: StateHandle,
        actual: StateHandle,
    },
    StaleStateDispatch {
        fiber: FiberId,
        queue: HookQueueId,
        expected: FunctionComponentStateDispatchHandle,
        actual: FunctionComponentStateDispatchHandle,
    },
    ExpectedBasicStateQueue {
        fiber: FiberId,
        queue: HookQueueId,
        actual: Option<FunctionComponentStateReducerId>,
    },
    ReducerDispatchOutsideRenderContext {
        dispatch: FunctionComponentStateDispatchHandle,
        fiber: FiberId,
        render_fiber: FiberId,
        current: Option<FiberId>,
    },
    StateDispatchOutsideRenderContext {
        dispatch: FunctionComponentStateDispatchHandle,
        fiber: FiberId,
        render_fiber: FiberId,
        current: Option<FiberId>,
    },
    StaleRenderPhaseAttempt {
        fiber: FiberId,
        expected: FunctionComponentRenderAttemptId,
        actual: FunctionComponentRenderAttemptId,
    },
    StaleRenderPhaseStagingGeneration {
        fiber: FiberId,
        expected: u64,
        actual: u64,
    },
    RenderPhaseLaneMismatch {
        fiber: FiberId,
        render_lanes: Lanes,
        update_lane: HookUpdateLane,
    },
    RenderPhaseBailoutContextAlias {
        fiber: FiberId,
        blocker_fiber: FiberId,
        current: Option<FiberId>,
        blocker_current: Option<FiberId>,
        render_lanes: Lanes,
        blocker_lanes: Lanes,
        context_dependency_count: usize,
        context_dependency_lanes: Lanes,
        child_traversal_blocked: bool,
    },
    RenderPhaseWrongFiberOrHookQueue {
        fiber: FiberId,
        owner_fiber: FiberId,
        queue_owner: FiberId,
        expected_queue: HookQueueId,
        actual_queue: HookQueueId,
    },
    RenderPhaseCallerBuiltRowsRejected {
        fiber: FiberId,
        queue: HookQueueId,
        update: HookUpdateId,
    },
    TooManyRenderPhaseRerenders {
        fiber: FiberId,
        limit: usize,
    },
    UnknownStateDispatch {
        dispatch: FunctionComponentStateDispatchHandle,
    },
    StateDispatchHandleOverflow,
    RefObjectHandleOverflow,
    MissingUseContextRead {
        fiber: FiberId,
    },
    UnsupportedUseContextReadCount {
        fiber: FiberId,
        read_count: usize,
    },
    UnexpectedUseContextContext {
        fiber: FiberId,
        expected: ContextHandle,
        actual: ContextHandle,
    },
    HookCursorPhaseMismatch {
        fiber: FiberId,
        expected: FunctionComponentHookRenderPhase,
        actual: FunctionComponentHookRenderPhase,
    },
    ExpectedEffectHookPayload {
        fiber: FiberId,
        hook: HookSlotId,
    },
    MissingEffectUpdateQueueRecord {
        fiber: FiberId,
        effect: HookEffectId,
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum FunctionComponentStateDispatchRootRescheduleError {
    Render(FunctionComponentRenderError),
    ConcurrentUpdate(ConcurrentUpdateError),
    RootScheduler(RootSchedulerError),
    EmptyDispatchLane {
        fiber: FiberId,
        dispatch: FunctionComponentStateDispatchHandle,
        lane: HookUpdateLane,
    },
}

impl Display for FunctionComponentStateDispatchRootRescheduleError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Render(error) => Display::fmt(error, formatter),
            Self::ConcurrentUpdate(error) => Display::fmt(error, formatter),
            Self::RootScheduler(error) => Display::fmt(error, formatter),
            Self::EmptyDispatchLane {
                fiber,
                dispatch,
                lane,
            } => write!(
                formatter,
                "function component fiber {} dispatch handle {} cannot reschedule root from empty hook lane {}",
                fiber.slot().get(),
                dispatch.raw(),
                lane.lanes().bits()
            ),
        }
    }
}

impl Error for FunctionComponentStateDispatchRootRescheduleError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Render(error) => Some(error),
            Self::ConcurrentUpdate(error) => Some(error),
            Self::RootScheduler(error) => Some(error),
            Self::EmptyDispatchLane { .. } => None,
        }
    }
}

impl From<FunctionComponentRenderError> for FunctionComponentStateDispatchRootRescheduleError {
    fn from(error: FunctionComponentRenderError) -> Self {
        Self::Render(error)
    }
}

impl From<ConcurrentUpdateError> for FunctionComponentStateDispatchRootRescheduleError {
    fn from(error: ConcurrentUpdateError) -> Self {
        Self::ConcurrentUpdate(error)
    }
}

impl From<RootSchedulerError> for FunctionComponentStateDispatchRootRescheduleError {
    fn from(error: RootSchedulerError) -> Self {
        Self::RootScheduler(error)
    }
}

impl FunctionComponentRenderError {
    pub(super) fn hook_list(fiber: FiberId, error: HookListError) -> Self {
        Self::HookList {
            fiber,
            error: Box::new(error),
        }
    }

    pub(super) fn hook_effect(fiber: FiberId, error: HookEffectArenaError) -> Self {
        Self::HookEffect {
            fiber,
            error: Box::new(error),
        }
    }

    pub(super) fn hook_queue(fiber: FiberId, error: HookQueueError) -> Self {
        Self::HookQueue {
            fiber,
            error: Box::new(error),
        }
    }

    pub(super) fn context_stack(fiber: FiberId, error: ContextStackError) -> Self {
        Self::ContextStack {
            fiber,
            error: Box::new(error),
        }
    }
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
            Self::HookList { fiber, error } => write!(
                formatter,
                "function component fiber {} hook-list render metadata failed: {error}",
                fiber.slot().get()
            ),
            Self::HookEffect { fiber, error } => write!(
                formatter,
                "function component fiber {} hook-effect render metadata failed: {error}",
                fiber.slot().get()
            ),
            Self::HookQueue { fiber, error } => write!(
                formatter,
                "function component fiber {} hook state queue metadata failed: {error}",
                fiber.slot().get()
            ),
            Self::ContextStack { fiber, error } => write!(
                formatter,
                "function component fiber {} context read metadata failed: {error}",
                fiber.slot().get()
            ),
            Self::MissingCurrentHookList { fiber } => write!(
                formatter,
                "function component fiber {} entered update hook-list traversal without a current hook list",
                fiber.slot().get()
            ),
            Self::MissingStateHookPayload { fiber, hook } => write!(
                formatter,
                "function component fiber {} expected hook slot {} to contain useState metadata",
                fiber.slot().get(),
                hook.slot().get()
            ),
            Self::MissingMemoHookRecord { fiber, hook } => write!(
                formatter,
                "function component fiber {} expected hook slot {} to contain private useMemo metadata",
                fiber.slot().get(),
                hook.slot().get()
            ),
            Self::MissingRefHookRecord { fiber, hook } => write!(
                formatter,
                "function component fiber {} expected hook slot {} to contain private useRef metadata",
                fiber.slot().get(),
                hook.slot().get()
            ),
            Self::MissingStateDispatch { fiber, queue } => write!(
                formatter,
                "function component fiber {} state queue {} has no private dispatch handle",
                fiber.slot().get(),
                queue.raw()
            ),
            Self::ExpectedReducerQueue { fiber, queue } => write!(
                formatter,
                "function component fiber {} state queue {} is not a private useReducer queue",
                fiber.slot().get(),
                queue.raw()
            ),
            Self::MissingStateDispatchReducer { fiber, queue } => write!(
                formatter,
                "function component fiber {} state queue {} has no last-rendered reducer for private eager dispatch metadata",
                fiber.slot().get(),
                queue.raw()
            ),
            Self::StateDispatchEagerStateMismatch {
                fiber,
                queue,
                expected,
                actual,
            } => write!(
                formatter,
                "function component fiber {} state queue {} eager dispatch metadata used last-rendered state {}, expected {}",
                fiber.slot().get(),
                queue.raw(),
                actual.raw(),
                expected.raw()
            ),
            Self::StaleStateDispatch {
                fiber,
                queue,
                expected,
                actual,
            } => write!(
                formatter,
                "function component fiber {} state queue {} rejected stale private dispatch handle {}; current queue dispatch is {}",
                fiber.slot().get(),
                queue.raw(),
                actual.raw(),
                expected.raw()
            ),
            Self::ExpectedBasicStateQueue {
                fiber,
                queue,
                actual,
            } => write!(
                formatter,
                "function component fiber {} state queue {} expected a useState basic-state queue for private dispatch, found {:?}",
                fiber.slot().get(),
                queue.raw(),
                actual
            ),
            Self::ReducerDispatchOutsideRenderContext {
                dispatch,
                fiber,
                render_fiber,
                current,
            } => write!(
                formatter,
                "private reducer dispatch handle {} for fiber {} is outside accepted render context for fiber {} with current {:?}",
                dispatch.raw(),
                fiber.slot().get(),
                render_fiber.slot().get(),
                current.map(|fiber| fiber.slot().get())
            ),
            Self::StateDispatchOutsideRenderContext {
                dispatch,
                fiber,
                render_fiber,
                current,
            } => write!(
                formatter,
                "private state dispatch handle {} for fiber {} is outside accepted render context for fiber {} with current {:?}",
                dispatch.raw(),
                fiber.slot().get(),
                render_fiber.slot().get(),
                current.map(|fiber| fiber.slot().get())
            ),
            Self::StaleRenderPhaseAttempt {
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "function component fiber {} rejected render-phase update from stale render attempt {}; current attempt is {}",
                fiber.slot().get(),
                actual.raw(),
                expected.raw()
            ),
            Self::StaleRenderPhaseStagingGeneration {
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "function component fiber {} rejected render-phase staging generation {}; current generation is {}",
                fiber.slot().get(),
                actual,
                expected
            ),
            Self::RenderPhaseLaneMismatch {
                fiber,
                render_lanes,
                update_lane,
            } => write!(
                formatter,
                "function component fiber {} rejected render-phase update lane {:?}; active render lanes are {:?}",
                fiber.slot().get(),
                update_lane.lanes(),
                render_lanes
            ),
            Self::RenderPhaseBailoutContextAlias {
                fiber,
                blocker_fiber,
                current,
                blocker_current,
                render_lanes,
                blocker_lanes,
                context_dependency_count,
                context_dependency_lanes,
                child_traversal_blocked,
            } => write!(
                formatter,
                "function component fiber {} rejected render-phase update because bailout/context blocker state belongs to fiber {} current {:?}, lanes {:?}, {} context dependencies {:?}, child traversal blocked {}; active current {:?}, lanes {:?}",
                fiber.slot().get(),
                blocker_fiber.slot().get(),
                blocker_current.map(|fiber| fiber.slot().get()),
                blocker_lanes,
                context_dependency_count,
                context_dependency_lanes,
                child_traversal_blocked,
                current.map(|fiber| fiber.slot().get()),
                render_lanes
            ),
            Self::RenderPhaseWrongFiberOrHookQueue {
                fiber,
                owner_fiber,
                queue_owner,
                expected_queue,
                actual_queue,
            } => write!(
                formatter,
                "function component fiber {} rejected render-phase staged row for owner fiber {}, queue owner {}, expected queue {}, actual queue {}",
                fiber.slot().get(),
                owner_fiber.slot().get(),
                queue_owner.slot().get(),
                expected_queue.raw(),
                actual_queue.raw()
            ),
            Self::RenderPhaseCallerBuiltRowsRejected {
                fiber,
                queue,
                update,
            } => write!(
                formatter,
                "function component fiber {} rejected caller-built render-phase staged row for queue {} update {}",
                fiber.slot().get(),
                queue.raw(),
                update.raw()
            ),
            Self::TooManyRenderPhaseRerenders { fiber, limit } => write!(
                formatter,
                "function component fiber {} exceeded private render-phase rerender limit {}",
                fiber.slot().get(),
                limit
            ),
            Self::UnknownStateDispatch { dispatch } => write!(
                formatter,
                "private state hook dispatch handle {} is not registered",
                dispatch.raw()
            ),
            Self::StateDispatchHandleOverflow => {
                formatter.write_str("private state hook dispatch handle counter overflowed")
            }
            Self::RefObjectHandleOverflow => {
                formatter.write_str("private ref object handle counter overflowed")
            }
            Self::MissingUseContextRead { fiber } => write!(
                formatter,
                "function component fiber {} completed private use_context render without reading context",
                fiber.slot().get()
            ),
            Self::UnsupportedUseContextReadCount { fiber, read_count } => write!(
                formatter,
                "function component fiber {} performed {read_count} private use_context reads; this canary admits exactly one read",
                fiber.slot().get()
            ),
            Self::UnexpectedUseContextContext {
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "function component fiber {} read private context {}, expected provider context {}",
                fiber.slot().get(),
                actual.raw(),
                expected.raw()
            ),
            Self::HookCursorPhaseMismatch {
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "function component fiber {} used a {:?} hook-list cursor where {:?} metadata was required",
                fiber.slot().get(),
                actual,
                expected
            ),
            Self::ExpectedEffectHookPayload { fiber, hook } => write!(
                formatter,
                "function component fiber {} expected hook slot {} to carry effect metadata",
                fiber.slot().get(),
                hook.slot().get()
            ),
            Self::MissingEffectUpdateQueueRecord { fiber, effect } => write!(
                formatter,
                "function component fiber {} did not record private effect update queue metadata for effect {:?}",
                fiber.slot().get(),
                effect
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
            Self::HookList { error, .. } => Some(error),
            Self::HookEffect { error, .. } => Some(error),
            Self::HookQueue { error, .. } => Some(error),
            Self::ContextStack { error, .. } => Some(error),
            Self::Invocation { error, .. } => Some(error),
            Self::ExpectedEffectHookPayload { .. }
            | Self::MissingEffectUpdateQueueRecord { .. }
            | Self::MissingComponentHandle { .. }
            | Self::MissingCurrentHookList { .. }
            | Self::MissingMemoHookRecord { .. }
            | Self::MissingRefHookRecord { .. }
            | Self::MissingStateHookPayload { .. }
            | Self::MissingStateDispatch { .. }
            | Self::ExpectedReducerQueue { .. }
            | Self::MissingStateDispatchReducer { .. }
            | Self::StateDispatchEagerStateMismatch { .. }
            | Self::StaleStateDispatch { .. }
            | Self::ExpectedBasicStateQueue { .. }
            | Self::ReducerDispatchOutsideRenderContext { .. }
            | Self::StateDispatchOutsideRenderContext { .. }
            | Self::StaleRenderPhaseAttempt { .. }
            | Self::StaleRenderPhaseStagingGeneration { .. }
            | Self::RenderPhaseLaneMismatch { .. }
            | Self::RenderPhaseBailoutContextAlias { .. }
            | Self::RenderPhaseWrongFiberOrHookQueue { .. }
            | Self::RenderPhaseCallerBuiltRowsRejected { .. }
            | Self::TooManyRenderPhaseRerenders { .. }
            | Self::UnknownStateDispatch { .. }
            | Self::StateDispatchHandleOverflow
            | Self::RefObjectHandleOverflow
            | Self::MissingUseContextRead { .. }
            | Self::UnsupportedUseContextReadCount { .. }
            | Self::UnexpectedUseContextContext { .. }
            | Self::HookCursorPhaseMismatch { .. }
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum FunctionComponentSingleChildReconciliationError {
    FiberTopology(FiberTopologyError),
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingOutput {
        fiber: FiberId,
    },
    UnknownOutput {
        fiber: FiberId,
        output: FunctionComponentOutputHandle,
    },
    OutputMismatch {
        fiber: FiberId,
        expected: FunctionComponentOutputHandle,
        actual: FunctionComponentOutputHandle,
    },
    MissingChildElement {
        fiber: FiberId,
        output: FunctionComponentOutputHandle,
    },
    UnsupportedChildTag {
        fiber: FiberId,
        output: FunctionComponentOutputHandle,
        tag: FiberTag,
    },
    ExistingCurrentChild {
        fiber: FiberId,
        current: FiberId,
        child: FiberId,
    },
    ExistingWorkInProgressChild {
        fiber: FiberId,
        child: FiberId,
    },
}

impl Display for FunctionComponentSingleChildReconciliationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be FunctionComponent for private single-child reconciliation, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::MissingOutput { fiber } => write!(
                formatter,
                "function component fiber {} returned no output for private single-child reconciliation",
                fiber.slot().get()
            ),
            Self::UnknownOutput { fiber, output } => write!(
                formatter,
                "function component fiber {} output handle {} is not a supported private single-child output",
                fiber.slot().get(),
                output.raw()
            ),
            Self::OutputMismatch {
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "function component fiber {} resolved output handle {} while render returned {}",
                fiber.slot().get(),
                actual.raw(),
                expected.raw()
            ),
            Self::MissingChildElement { fiber, output } => write!(
                formatter,
                "function component fiber {} output handle {} resolved to an empty child element",
                fiber.slot().get(),
                output.raw()
            ),
            Self::UnsupportedChildTag { fiber, output, tag } => write!(
                formatter,
                "function component fiber {} output handle {} resolved to unsupported private single-child tag {:?}; only HostComponent and HostText are admitted",
                fiber.slot().get(),
                output.raw(),
                tag
            ),
            Self::ExistingCurrentChild {
                fiber,
                current,
                child,
            } => write!(
                formatter,
                "function component fiber {} current alternate {} already has child {}; update/list reconciliation is not supported by this canary",
                fiber.slot().get(),
                current.slot().get(),
                child.slot().get()
            ),
            Self::ExistingWorkInProgressChild { fiber, child } => write!(
                formatter,
                "function component fiber {} already has work-in-progress child {}; this canary only admits one fresh child handoff",
                fiber.slot().get(),
                child.slot().get()
            ),
        }
    }
}

impl Error for FunctionComponentSingleChildReconciliationError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::UnexpectedFiberTag { .. }
            | Self::MissingOutput { .. }
            | Self::UnknownOutput { .. }
            | Self::OutputMismatch { .. }
            | Self::MissingChildElement { .. }
            | Self::UnsupportedChildTag { .. }
            | Self::ExistingCurrentChild { .. }
            | Self::ExistingWorkInProgressChild { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for FunctionComponentSingleChildReconciliationError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum FunctionComponentSingleChildUpdateReconciliationError {
    FiberTopology(FiberTopologyError),
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingCurrent {
        fiber: FiberId,
    },
    MissingCurrentChild {
        fiber: FiberId,
        current: FiberId,
    },
    UnexpectedCurrentChildSibling {
        fiber: FiberId,
        current_child: FiberId,
        sibling: FiberId,
    },
    ExistingWorkInProgressChild {
        fiber: FiberId,
        child: FiberId,
    },
    MissingOutput {
        fiber: FiberId,
    },
    UnknownOutput {
        fiber: FiberId,
        output: FunctionComponentOutputHandle,
    },
    OutputMismatch {
        fiber: FiberId,
        expected: FunctionComponentOutputHandle,
        actual: FunctionComponentOutputHandle,
    },
    MissingChildElement {
        fiber: FiberId,
        output: FunctionComponentOutputHandle,
    },
    UnsupportedChildTag {
        fiber: FiberId,
        output: FunctionComponentOutputHandle,
        tag: FiberTag,
    },
    CurrentChildTagMismatch {
        fiber: FiberId,
        current_child: FiberId,
        expected: FiberTag,
        actual: FiberTag,
    },
    HostComponentElementTypeMismatch {
        fiber: FiberId,
        current_child: FiberId,
        expected: ElementTypeHandle,
        actual: ElementTypeHandle,
    },
    MissingCurrentChildStateNode {
        child: FiberId,
        tag: FiberTag,
    },
    UnchangedChildProps {
        child: FiberId,
        props: PropsHandle,
    },
}

impl Display for FunctionComponentSingleChildUpdateReconciliationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be FunctionComponent for private single-child update reconciliation, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::MissingCurrent { fiber } => write!(
                formatter,
                "function component fiber {} requires a current alternate for private single-child update reconciliation",
                fiber.slot().get()
            ),
            Self::MissingCurrentChild { fiber, current } => write!(
                formatter,
                "function component fiber {} current alternate {} has no child for private single-child update reconciliation",
                fiber.slot().get(),
                current.slot().get()
            ),
            Self::UnexpectedCurrentChildSibling {
                fiber,
                current_child,
                sibling,
            } => write!(
                formatter,
                "function component fiber {} current child {} has sibling {}; private single-child update reconciliation admits exactly one current child",
                fiber.slot().get(),
                current_child.slot().get(),
                sibling.slot().get()
            ),
            Self::ExistingWorkInProgressChild { fiber, child } => write!(
                formatter,
                "function component fiber {} already has work-in-progress child {}; private single-child update reconciliation requires an empty child slot",
                fiber.slot().get(),
                child.slot().get()
            ),
            Self::MissingOutput { fiber } => write!(
                formatter,
                "function component fiber {} returned no output for private single-child update reconciliation",
                fiber.slot().get()
            ),
            Self::UnknownOutput { fiber, output } => write!(
                formatter,
                "function component fiber {} output handle {} is not a supported private single-child update output",
                fiber.slot().get(),
                output.raw()
            ),
            Self::OutputMismatch {
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "function component fiber {} resolved update output handle {} while render returned {}",
                fiber.slot().get(),
                actual.raw(),
                expected.raw()
            ),
            Self::MissingChildElement { fiber, output } => write!(
                formatter,
                "function component fiber {} update output handle {} resolved to an empty child element",
                fiber.slot().get(),
                output.raw()
            ),
            Self::UnsupportedChildTag { fiber, output, tag } => write!(
                formatter,
                "function component fiber {} update output handle {} resolved to unsupported private single-child tag {:?}; only HostComponent and HostText are admitted",
                fiber.slot().get(),
                output.raw(),
                tag
            ),
            Self::CurrentChildTagMismatch {
                fiber,
                current_child,
                expected,
                actual,
            } => write!(
                formatter,
                "function component fiber {} current child {} is {:?}, but update output resolved to {:?}; replacements are not admitted by this canary",
                fiber.slot().get(),
                current_child.slot().get(),
                actual,
                expected
            ),
            Self::HostComponentElementTypeMismatch {
                fiber,
                current_child,
                expected,
                actual,
            } => write!(
                formatter,
                "function component fiber {} current HostComponent child {} has element type {}, but update output resolved to {}; replacements are not admitted by this canary",
                fiber.slot().get(),
                current_child.slot().get(),
                actual.raw(),
                expected.raw()
            ),
            Self::MissingCurrentChildStateNode { child, tag } => write!(
                formatter,
                "{:?} current child {} has no state node for private single-child update reconciliation",
                tag,
                child.slot().get()
            ),
            Self::UnchangedChildProps { child, props } => write!(
                formatter,
                "current child {} already has props {}; private single-child update reconciliation requires a HostComponent/HostText update",
                child.slot().get(),
                props.raw()
            ),
        }
    }
}

impl Error for FunctionComponentSingleChildUpdateReconciliationError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::UnexpectedFiberTag { .. }
            | Self::MissingCurrent { .. }
            | Self::MissingCurrentChild { .. }
            | Self::UnexpectedCurrentChildSibling { .. }
            | Self::ExistingWorkInProgressChild { .. }
            | Self::MissingOutput { .. }
            | Self::UnknownOutput { .. }
            | Self::OutputMismatch { .. }
            | Self::MissingChildElement { .. }
            | Self::UnsupportedChildTag { .. }
            | Self::CurrentChildTagMismatch { .. }
            | Self::HostComponentElementTypeMismatch { .. }
            | Self::MissingCurrentChildStateNode { .. }
            | Self::UnchangedChildProps { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for FunctionComponentSingleChildUpdateReconciliationError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}
