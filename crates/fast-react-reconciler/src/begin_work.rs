//! Private begin-work handoff for function components and a narrow Fragment canary.
//!
//! This is intentionally below the public work loop. The default handoff
//! delegates only the accepted function-component render skeleton and one
//! unkeyed Fragment with exactly one existing HostComponent/HostText child. The
//! private function-component single-child helper records one admitted
//! HostComponent/HostText output for root-loop canaries. It does not implement
//! broad reconciliation, complete host work, commit effects, mutate hosts, or
//! switch roots.

#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ContextHandle, ContextStackError, ContextStackSnapshot, ContextValueHandle, FiberArena,
    FiberId, FiberTag, FiberTopologyError, Lanes, PropsHandle, ReactKey, StateHandle,
    StateNodeHandle,
};

use crate::{
    RootElementHandle,
    function_component::{
        FunctionComponentContextConsumerInvoker, FunctionComponentContextReadRecord,
        FunctionComponentContextRenderState, FunctionComponentContextRenderStore,
        FunctionComponentHookRenderResult, FunctionComponentHookRenderStore,
        FunctionComponentInvoker, FunctionComponentOutputHandle, FunctionComponentRenderError,
        FunctionComponentRenderRecord, FunctionComponentSingleChildOutputResolver,
        FunctionComponentSingleChildReconciliationError,
        FunctionComponentSingleChildReconciliationRecord, FunctionComponentStateActionHandle,
        FunctionComponentUseContextRenderRecord, FunctionComponentUseStateHookRenderRecord,
        FunctionComponentUseStateRenderRecord, FunctionComponentUseStateRenderRequest,
        reconcile_function_component_single_child_output, render_function_component,
        render_function_component_with_context_reads,
        render_function_component_with_required_use_context,
        render_function_component_with_use_context, render_function_component_with_use_state,
    },
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
    Fragment(FragmentSingleHostChildBeginWorkRecord),
}

impl BeginWorkResult {
    #[must_use]
    pub fn function_component(self) -> FunctionComponentBeginWorkRecord {
        match self {
            Self::FunctionComponent(record) => record,
            Self::Fragment(_) => panic!("begin-work result was not a FunctionComponent"),
        }
    }

    #[must_use]
    pub fn fragment(self) -> FragmentSingleHostChildBeginWorkRecord {
        match self {
            Self::Fragment(record) => record,
            Self::FunctionComponent(_) => panic!("begin-work result was not a Fragment"),
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseStateBeginWorkRecord {
    begin_work: FunctionComponentBeginWorkRecord,
    hook_result: FunctionComponentHookRenderResult,
    state_hook: FunctionComponentUseStateHookRenderRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseContextBeginWorkRecord {
    render: FunctionComponentUseContextRenderRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FragmentSingleHostChildBeginWorkRecord {
    fragment: FiberId,
    current: Option<FiberId>,
    child: FiberId,
    child_tag: FiberTag,
    pending_props: PropsHandle,
    child_pending_props: PropsHandle,
    render_lanes: Lanes,
}

impl FragmentSingleHostChildBeginWorkRecord {
    #[must_use]
    pub const fn fragment(self) -> FiberId {
        self.fragment
    }

    #[must_use]
    pub const fn current(self) -> Option<FiberId> {
        self.current
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.child
    }

    #[must_use]
    pub const fn child_tag(self) -> FiberTag {
        self.child_tag
    }

    #[must_use]
    pub const fn pending_props(self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub const fn child_pending_props(self) -> PropsHandle {
        self.child_pending_props
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }
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

impl FunctionComponentUseStateBeginWorkRecord {
    #[must_use]
    pub const fn begin_work(self) -> FunctionComponentBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.begin_work.render()
    }

    #[must_use]
    pub const fn hook_result(self) -> FunctionComponentHookRenderResult {
        self.hook_result
    }

    #[must_use]
    pub const fn state_hook(self) -> FunctionComponentUseStateHookRenderRecord {
        self.state_hook
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

impl FunctionComponentUseContextBeginWorkRecord {
    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.render.render()
    }

    #[must_use]
    pub const fn use_context_render(self) -> FunctionComponentUseContextRenderRecord {
        self.render
    }

    #[must_use]
    pub const fn context_read(self) -> FunctionComponentContextReadRecord {
        self.render.context_read()
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
    pub const fn context_read_count(self) -> usize {
        self.render.context_read_count()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderBeginWorkRequest {
    provider: FiberId,
    render_lanes: Lanes,
    context: ContextHandle,
    value: ContextValueHandle,
}

impl ContextProviderBeginWorkRequest {
    #[must_use]
    pub const fn new(
        provider: FiberId,
        render_lanes: Lanes,
        context: ContextHandle,
        value: ContextValueHandle,
    ) -> Self {
        Self {
            provider,
            render_lanes,
            context,
            value,
        }
    }

    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn value(self) -> ContextValueHandle {
        self.value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderBeginWorkRecord {
    provider: FiberId,
    child: FiberId,
    context: ContextHandle,
    value: ContextValueHandle,
    provider_snapshot: ContextStackSnapshot,
    pushed_stack_depth: usize,
    restored_stack_depth: usize,
    child_begin_work: FunctionComponentBeginWorkRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUseContextBeginWorkRecord {
    provider: FiberId,
    child: FiberId,
    context: ContextHandle,
    value: ContextValueHandle,
    provider_snapshot: ContextStackSnapshot,
    pushed_stack_depth: usize,
    restored_stack_depth: usize,
    child_begin_work: FunctionComponentUseContextBeginWorkRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUseContextSingleChildBeginWorkRecord {
    begin_work: ContextProviderUseContextBeginWorkRecord,
    single_child: FunctionComponentSingleChildReconciliationRecord,
}

impl ContextProviderBeginWorkRecord {
    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.child
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn value(self) -> ContextValueHandle {
        self.value
    }

    #[must_use]
    pub const fn provider_snapshot(self) -> ContextStackSnapshot {
        self.provider_snapshot
    }

    #[must_use]
    pub const fn pushed_stack_depth(self) -> usize {
        self.pushed_stack_depth
    }

    #[must_use]
    pub const fn restored_stack_depth(self) -> usize {
        self.restored_stack_depth
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentBeginWorkRecord {
        self.child_begin_work
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.child_begin_work.render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.child_begin_work.output()
    }

    #[must_use]
    pub const fn child_context_read_count(self) -> usize {
        self.child_begin_work.context_read_count()
    }
}

impl ContextProviderUseContextBeginWorkRecord {
    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.child
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn value(self) -> ContextValueHandle {
        self.value
    }

    #[must_use]
    pub const fn provider_snapshot(self) -> ContextStackSnapshot {
        self.provider_snapshot
    }

    #[must_use]
    pub const fn pushed_stack_depth(self) -> usize {
        self.pushed_stack_depth
    }

    #[must_use]
    pub const fn restored_stack_depth(self) -> usize {
        self.restored_stack_depth
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.child_begin_work
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.child_begin_work.render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.child_begin_work.output()
    }

    #[must_use]
    pub const fn child_context_read(self) -> FunctionComponentContextReadRecord {
        self.child_begin_work.context_read()
    }

    #[must_use]
    pub const fn child_context_read_count(self) -> usize {
        self.child_begin_work.context_read_count()
    }
}

impl ContextProviderUseContextSingleChildBeginWorkRecord {
    #[must_use]
    pub const fn begin_work(self) -> ContextProviderUseContextBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub const fn single_child(self) -> FunctionComponentSingleChildReconciliationRecord {
        self.single_child
    }

    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.begin_work.provider()
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.begin_work.child()
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.begin_work.context()
    }

    #[must_use]
    pub const fn value(self) -> ContextValueHandle {
        self.begin_work.value()
    }

    #[must_use]
    pub const fn provider_snapshot(self) -> ContextStackSnapshot {
        self.begin_work.provider_snapshot()
    }

    #[must_use]
    pub const fn pushed_stack_depth(self) -> usize {
        self.begin_work.pushed_stack_depth()
    }

    #[must_use]
    pub const fn restored_stack_depth(self) -> usize {
        self.begin_work.restored_stack_depth()
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.begin_work.child_begin_work()
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.begin_work.child_render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.begin_work.child_output()
    }

    #[must_use]
    pub const fn child_context_read(self) -> FunctionComponentContextReadRecord {
        self.begin_work.child_context_read()
    }

    #[must_use]
    pub const fn child_context_read_count(self) -> usize {
        self.begin_work.child_context_read_count()
    }

    #[must_use]
    pub const fn child_element(self) -> RootElementHandle {
        self.single_child.child_element()
    }

    #[must_use]
    pub const fn child_tag(self) -> FiberTag {
        self.single_child.child_tag()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct NestedContextProviderBeginWorkRequest {
    outer_provider: FiberId,
    render_lanes: Lanes,
    outer_context: ContextHandle,
    outer_value: ContextValueHandle,
    inner_context: ContextHandle,
    inner_value: ContextValueHandle,
}

impl NestedContextProviderBeginWorkRequest {
    #[must_use]
    pub const fn new(
        outer_provider: FiberId,
        render_lanes: Lanes,
        outer_context: ContextHandle,
        outer_value: ContextValueHandle,
        inner_context: ContextHandle,
        inner_value: ContextValueHandle,
    ) -> Self {
        Self {
            outer_provider,
            render_lanes,
            outer_context,
            outer_value,
            inner_context,
            inner_value,
        }
    }

    #[must_use]
    pub const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn outer_context(self) -> ContextHandle {
        self.outer_context
    }

    #[must_use]
    pub const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    pub const fn inner_context(self) -> ContextHandle {
        self.inner_context
    }

    #[must_use]
    pub const fn inner_value(self) -> ContextValueHandle {
        self.inner_value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct NestedContextProviderBeginWorkRecord {
    outer_provider: FiberId,
    inner_provider: FiberId,
    child: FiberId,
    outer_context: ContextHandle,
    outer_value: ContextValueHandle,
    inner_context: ContextHandle,
    inner_value: ContextValueHandle,
    outer_provider_snapshot: ContextStackSnapshot,
    inner_provider_snapshot: ContextStackSnapshot,
    outer_pushed_stack_depth: usize,
    inner_pushed_stack_depth: usize,
    inner_restored_stack_depth: usize,
    outer_restored_stack_depth: usize,
    child_begin_work: FunctionComponentBeginWorkRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct NestedContextProviderUseContextBeginWorkRecord {
    outer_provider: FiberId,
    inner_provider: FiberId,
    child: FiberId,
    outer_context: ContextHandle,
    outer_value: ContextValueHandle,
    inner_context: ContextHandle,
    inner_value: ContextValueHandle,
    outer_provider_snapshot: ContextStackSnapshot,
    inner_provider_snapshot: ContextStackSnapshot,
    outer_pushed_stack_depth: usize,
    inner_pushed_stack_depth: usize,
    inner_restored_stack_depth: usize,
    outer_restored_stack_depth: usize,
    child_begin_work: FunctionComponentUseContextBeginWorkRecord,
}

impl NestedContextProviderBeginWorkRecord {
    #[must_use]
    pub const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub const fn inner_provider(self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.child
    }

    #[must_use]
    pub const fn outer_context(self) -> ContextHandle {
        self.outer_context
    }

    #[must_use]
    pub const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    pub const fn inner_context(self) -> ContextHandle {
        self.inner_context
    }

    #[must_use]
    pub const fn inner_value(self) -> ContextValueHandle {
        self.inner_value
    }

    #[must_use]
    pub const fn outer_provider_snapshot(self) -> ContextStackSnapshot {
        self.outer_provider_snapshot
    }

    #[must_use]
    pub const fn inner_provider_snapshot(self) -> ContextStackSnapshot {
        self.inner_provider_snapshot
    }

    #[must_use]
    pub const fn outer_pushed_stack_depth(self) -> usize {
        self.outer_pushed_stack_depth
    }

    #[must_use]
    pub const fn inner_pushed_stack_depth(self) -> usize {
        self.inner_pushed_stack_depth
    }

    #[must_use]
    pub const fn inner_restored_stack_depth(self) -> usize {
        self.inner_restored_stack_depth
    }

    #[must_use]
    pub const fn outer_restored_stack_depth(self) -> usize {
        self.outer_restored_stack_depth
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentBeginWorkRecord {
        self.child_begin_work
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.child_begin_work.render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.child_begin_work.output()
    }

    #[must_use]
    pub const fn child_context_read_count(self) -> usize {
        self.child_begin_work.context_read_count()
    }
}

impl NestedContextProviderUseContextBeginWorkRecord {
    #[must_use]
    pub const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub const fn inner_provider(self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.child
    }

    #[must_use]
    pub const fn outer_context(self) -> ContextHandle {
        self.outer_context
    }

    #[must_use]
    pub const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    pub const fn inner_context(self) -> ContextHandle {
        self.inner_context
    }

    #[must_use]
    pub const fn inner_value(self) -> ContextValueHandle {
        self.inner_value
    }

    #[must_use]
    pub const fn outer_provider_snapshot(self) -> ContextStackSnapshot {
        self.outer_provider_snapshot
    }

    #[must_use]
    pub const fn inner_provider_snapshot(self) -> ContextStackSnapshot {
        self.inner_provider_snapshot
    }

    #[must_use]
    pub const fn outer_pushed_stack_depth(self) -> usize {
        self.outer_pushed_stack_depth
    }

    #[must_use]
    pub const fn inner_pushed_stack_depth(self) -> usize {
        self.inner_pushed_stack_depth
    }

    #[must_use]
    pub const fn inner_restored_stack_depth(self) -> usize {
        self.inner_restored_stack_depth
    }

    #[must_use]
    pub const fn outer_restored_stack_depth(self) -> usize {
        self.outer_restored_stack_depth
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.child_begin_work
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.child_begin_work.render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.child_begin_work.output()
    }

    #[must_use]
    pub const fn child_context_read(self) -> FunctionComponentContextReadRecord {
        self.child_begin_work.context_read()
    }

    #[must_use]
    pub const fn child_context_read_count(self) -> usize {
        self.child_begin_work.context_read_count()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum ContextProviderBeginWorkError {
    FiberTopology(FiberTopologyError),
    ContextStack {
        provider: FiberId,
        context: ContextHandle,
        error: Box<ContextStackError>,
    },
    ContextRestore {
        provider: FiberId,
        context: ContextHandle,
        snapshot: ContextStackSnapshot,
        error: Box<ContextStackError>,
    },
    ContextRestoreAfterChildError {
        provider: FiberId,
        child: FiberId,
        context: ContextHandle,
        child_error: Box<BeginWorkError>,
        restore_error: Box<ContextStackError>,
    },
    ChildBeginWork {
        provider: FiberId,
        child: FiberId,
        error: Box<BeginWorkError>,
    },
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingChild {
        provider: FiberId,
    },
    ProviderSiblingUnsupported {
        provider: FiberId,
        sibling: FiberId,
    },
    MultipleChildren {
        provider: FiberId,
        first_child: FiberId,
        sibling: FiberId,
    },
    UnsupportedChildTag {
        provider: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

impl Display for ContextProviderBeginWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ContextStack {
                provider,
                context,
                error,
            } => write!(
                formatter,
                "ContextProvider fiber {} could not push context {}: {error}",
                provider.slot().get(),
                context.raw()
            ),
            Self::ContextRestore {
                provider,
                context,
                snapshot,
                error,
            } => write!(
                formatter,
                "ContextProvider fiber {} could not restore context {} snapshot at depth {}: {error}",
                provider.slot().get(),
                context.raw(),
                snapshot.depth()
            ),
            Self::ContextRestoreAfterChildError {
                provider,
                child,
                context,
                child_error,
                restore_error,
            } => write!(
                formatter,
                "ContextProvider fiber {} child {} failed begin-work ({child_error}) and context {} restore also failed: {restore_error}",
                provider.slot().get(),
                child.slot().get(),
                context.raw()
            ),
            Self::ChildBeginWork {
                provider,
                child,
                error,
            } => write!(
                formatter,
                "ContextProvider fiber {} child {} failed private begin-work handoff: {error}",
                provider.slot().get(),
                child.slot().get()
            ),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be ContextProvider for private provider begin-work handoff, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::MissingChild { provider } => write!(
                formatter,
                "ContextProvider fiber {} has no child; this private handoff requires exactly one FunctionComponent child",
                provider.slot().get()
            ),
            Self::ProviderSiblingUnsupported { provider, sibling } => write!(
                formatter,
                "ContextProvider fiber {} has sibling {}; this private handoff does not traverse provider siblings",
                provider.slot().get(),
                sibling.slot().get()
            ),
            Self::MultipleChildren {
                provider,
                first_child,
                sibling,
            } => write!(
                formatter,
                "ContextProvider fiber {} has multiple children (first {}, sibling {}); this private handoff admits exactly one FunctionComponent child",
                provider.slot().get(),
                first_child.slot().get(),
                sibling.slot().get()
            ),
            Self::UnsupportedChildTag {
                provider,
                child,
                tag,
            } => write!(
                formatter,
                "ContextProvider fiber {} child {} has unsupported tag {:?}; this private handoff admits only one FunctionComponent child",
                provider.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

impl Error for ContextProviderBeginWorkError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::ContextStack { error, .. } | Self::ContextRestore { error, .. } => Some(error),
            Self::ContextRestoreAfterChildError { child_error, .. }
            | Self::ChildBeginWork {
                error: child_error, ..
            } => Some(child_error),
            Self::UnexpectedFiberTag { .. }
            | Self::MissingChild { .. }
            | Self::ProviderSiblingUnsupported { .. }
            | Self::MultipleChildren { .. }
            | Self::UnsupportedChildTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for ContextProviderBeginWorkError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum NestedContextProviderBeginWorkError {
    FiberTopology(FiberTopologyError),
    ContextStack {
        provider: FiberId,
        context: ContextHandle,
        error: Box<ContextStackError>,
    },
    ContextRestore {
        provider: FiberId,
        context: ContextHandle,
        snapshot: ContextStackSnapshot,
        error: Box<ContextStackError>,
    },
    ContextRestoreAfterChildError {
        outer_provider: FiberId,
        inner_provider: FiberId,
        child: FiberId,
        child_error: Box<BeginWorkError>,
        inner_restore_error: Option<Box<ContextStackError>>,
        outer_restore_error: Option<Box<ContextStackError>>,
    },
    ChildBeginWork {
        outer_provider: FiberId,
        inner_provider: FiberId,
        child: FiberId,
        error: Box<BeginWorkError>,
    },
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingChild {
        provider: FiberId,
    },
    ProviderSiblingUnsupported {
        provider: FiberId,
        sibling: FiberId,
    },
    MultipleChildren {
        provider: FiberId,
        first_child: FiberId,
        sibling: FiberId,
    },
    UnsupportedOuterChildTag {
        outer_provider: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    UnsupportedInnerChildTag {
        inner_provider: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

impl Display for NestedContextProviderBeginWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ContextStack {
                provider,
                context,
                error,
            } => write!(
                formatter,
                "nested ContextProvider fiber {} could not push context {}: {error}",
                provider.slot().get(),
                context.raw()
            ),
            Self::ContextRestore {
                provider,
                context,
                snapshot,
                error,
            } => write!(
                formatter,
                "nested ContextProvider fiber {} could not restore context {} snapshot at depth {}: {error}",
                provider.slot().get(),
                context.raw(),
                snapshot.depth()
            ),
            Self::ContextRestoreAfterChildError {
                outer_provider,
                inner_provider,
                child,
                child_error,
                inner_restore_error,
                outer_restore_error,
            } => write!(
                formatter,
                "nested ContextProvider fibers {} -> {} child {} failed begin-work ({child_error}) and restore errors were inner {:?}, outer {:?}",
                outer_provider.slot().get(),
                inner_provider.slot().get(),
                child.slot().get(),
                inner_restore_error,
                outer_restore_error
            ),
            Self::ChildBeginWork {
                outer_provider,
                inner_provider,
                child,
                error,
            } => write!(
                formatter,
                "nested ContextProvider fibers {} -> {} child {} failed private begin-work handoff: {error}",
                outer_provider.slot().get(),
                inner_provider.slot().get(),
                child.slot().get()
            ),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be outer ContextProvider for private nested provider begin-work handoff, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::MissingChild { provider } => write!(
                formatter,
                "ContextProvider fiber {} has no child; this private nested handoff requires ContextProvider -> FunctionComponent",
                provider.slot().get()
            ),
            Self::ProviderSiblingUnsupported { provider, sibling } => write!(
                formatter,
                "ContextProvider fiber {} has sibling {}; this private nested handoff does not traverse provider siblings",
                provider.slot().get(),
                sibling.slot().get()
            ),
            Self::MultipleChildren {
                provider,
                first_child,
                sibling,
            } => write!(
                formatter,
                "ContextProvider fiber {} has multiple children (first {}, sibling {}); this private nested handoff admits exactly one provider/function child at each level",
                provider.slot().get(),
                first_child.slot().get(),
                sibling.slot().get()
            ),
            Self::UnsupportedOuterChildTag {
                outer_provider,
                child,
                tag,
            } => write!(
                formatter,
                "outer ContextProvider fiber {} child {} has unsupported tag {:?}; this private nested handoff admits exactly one inner ContextProvider child",
                outer_provider.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::UnsupportedInnerChildTag {
                inner_provider,
                child,
                tag,
            } => write!(
                formatter,
                "inner ContextProvider fiber {} child {} has unsupported tag {:?}; this private nested handoff admits exactly one FunctionComponent child",
                inner_provider.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

impl Error for NestedContextProviderBeginWorkError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::ContextStack { error, .. } | Self::ContextRestore { error, .. } => Some(error),
            Self::ContextRestoreAfterChildError { child_error, .. }
            | Self::ChildBeginWork {
                error: child_error, ..
            } => Some(child_error),
            Self::UnexpectedFiberTag { .. }
            | Self::MissingChild { .. }
            | Self::ProviderSiblingUnsupported { .. }
            | Self::MultipleChildren { .. }
            | Self::UnsupportedOuterChildTag { .. }
            | Self::UnsupportedInnerChildTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for NestedContextProviderBeginWorkError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum BeginWorkError {
    FiberTopology(FiberTopologyError),
    FunctionComponent(FunctionComponentRenderError),
    FunctionComponentSingleChild(FunctionComponentSingleChildReconciliationError),
    FragmentSingleHostChild(FragmentSingleHostChildBeginWorkError),
    UnsupportedPortal(UnsupportedPortalBeginWorkRecord),
    UnsupportedFiberTag { fiber: FiberId, tag: FiberTag },
}

impl Display for BeginWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::FunctionComponent(error) => Display::fmt(error, formatter),
            Self::FunctionComponentSingleChild(error) => Display::fmt(error, formatter),
            Self::FragmentSingleHostChild(error) => Display::fmt(error, formatter),
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
                "fiber {} has unsupported begin-work tag {:?}; only FunctionComponent and an exact single-host-child Fragment are delegated by this private handoff",
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
            Self::FragmentSingleHostChild(error) => Some(error),
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

impl From<FragmentSingleHostChildBeginWorkError> for BeginWorkError {
    fn from(error: FragmentSingleHostChildBeginWorkError) -> Self {
        Self::FragmentSingleHostChild(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum FragmentSingleHostChildBeginWorkError {
    FiberTopology(FiberTopologyError),
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    KeyedFragmentUnsupported {
        fragment: FiberId,
        key: ReactKey,
    },
    FragmentSiblingUnsupported {
        fragment: FiberId,
        sibling: FiberId,
    },
    MissingChild {
        fragment: FiberId,
    },
    MultipleChildren {
        fragment: FiberId,
        first_child: FiberId,
        sibling: FiberId,
    },
    UnsupportedChildTag {
        fragment: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    ExistingCurrentChild {
        fragment: FiberId,
        current: FiberId,
        child: FiberId,
    },
}

impl Display for FragmentSingleHostChildBeginWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be Fragment for private single-host-child begin-work, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::KeyedFragmentUnsupported { fragment, key } => write!(
                formatter,
                "Fragment fiber {} has key {:?}; keyed Fragment reconciliation stays unsupported by this canary",
                fragment.slot().get(),
                key.as_str()
            ),
            Self::FragmentSiblingUnsupported { fragment, sibling } => write!(
                formatter,
                "Fragment fiber {} has sibling {}; this private canary does not traverse Fragment siblings",
                fragment.slot().get(),
                sibling.slot().get()
            ),
            Self::MissingChild { fragment } => write!(
                formatter,
                "Fragment fiber {} has no child; this private canary requires exactly one HostComponent or HostText child",
                fragment.slot().get()
            ),
            Self::MultipleChildren {
                fragment,
                first_child,
                sibling,
            } => write!(
                formatter,
                "Fragment fiber {} has multiple children (first {}, sibling {}); this private canary admits exactly one host child",
                fragment.slot().get(),
                first_child.slot().get(),
                sibling.slot().get()
            ),
            Self::UnsupportedChildTag {
                fragment,
                child,
                tag,
            } => write!(
                formatter,
                "Fragment fiber {} child {} has unsupported tag {:?}; this private canary admits only HostComponent and HostText",
                fragment.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::ExistingCurrentChild {
                fragment,
                current,
                child,
            } => write!(
                formatter,
                "Fragment fiber {} current alternate {} already has child {}; update/list reconciliation stays unsupported by this canary",
                fragment.slot().get(),
                current.slot().get(),
                child.slot().get()
            ),
        }
    }
}

impl Error for FragmentSingleHostChildBeginWorkError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::UnexpectedFiberTag { .. }
            | Self::KeyedFragmentUnsupported { .. }
            | Self::FragmentSiblingUnsupported { .. }
            | Self::MissingChild { .. }
            | Self::MultipleChildren { .. }
            | Self::UnsupportedChildTag { .. }
            | Self::ExistingCurrentChild { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for FragmentSingleHostChildBeginWorkError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
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

    match tag {
        FiberTag::FunctionComponent => {
            let render = render_function_component(
                arena,
                work_in_progress,
                request.render_lanes(),
                invoker,
            )?;

            Ok(BeginWorkResult::FunctionComponent(
                FunctionComponentBeginWorkRecord { render },
            ))
        }
        FiberTag::Fragment => Ok(BeginWorkResult::Fragment(
            begin_work_fragment_single_host_child(arena, request)?,
        )),
        FiberTag::Portal => Err(BeginWorkError::UnsupportedPortal(
            unsupported_portal_begin_work_record(arena, request)?,
        )),
        _ => Err(BeginWorkError::UnsupportedFiberTag {
            fiber: work_in_progress,
            tag,
        }),
    }
}

pub(crate) fn begin_work_with_use_state(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    hook_store: &mut FunctionComponentHookRenderStore,
    state_request: FunctionComponentUseStateRenderRequest,
    invoker: &mut impl FunctionComponentInvoker,
    reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
) -> Result<FunctionComponentUseStateBeginWorkRecord, BeginWorkError> {
    let work_in_progress = request.work_in_progress();
    let tag = arena.get(work_in_progress)?.tag();

    match tag {
        FiberTag::FunctionComponent => {
            let state_render = render_function_component_with_use_state(
                arena,
                hook_store,
                work_in_progress,
                request.render_lanes(),
                state_request,
                invoker,
                reducer,
            )?;
            Ok(function_component_use_state_begin_work_record(state_render))
        }
        FiberTag::Portal => Err(BeginWorkError::UnsupportedPortal(
            unsupported_portal_begin_work_record(arena, request)?,
        )),
        _ => Err(BeginWorkError::UnsupportedFiberTag {
            fiber: work_in_progress,
            tag,
        }),
    }
}

fn function_component_use_state_begin_work_record(
    state_render: FunctionComponentUseStateRenderRecord,
) -> FunctionComponentUseStateBeginWorkRecord {
    FunctionComponentUseStateBeginWorkRecord {
        begin_work: FunctionComponentBeginWorkRecord {
            render: state_render.render(),
        },
        hook_result: state_render.hook_result(),
        state_hook: state_render.state_hook(),
    }
}

pub(crate) fn begin_work_fragment_single_host_child(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
) -> Result<FragmentSingleHostChildBeginWorkRecord, FragmentSingleHostChildBeginWorkError> {
    let fragment = request.work_in_progress();
    let node = arena.get(fragment)?;
    let tag = node.tag();
    if tag != FiberTag::Fragment {
        return Err(FragmentSingleHostChildBeginWorkError::UnexpectedFiberTag {
            fiber: fragment,
            tag,
        });
    }
    if let Some(key) = node.key().cloned() {
        return Err(
            FragmentSingleHostChildBeginWorkError::KeyedFragmentUnsupported { fragment, key },
        );
    }
    if let Some(sibling) = node.sibling() {
        return Err(
            FragmentSingleHostChildBeginWorkError::FragmentSiblingUnsupported { fragment, sibling },
        );
    }
    let current = node.alternate();
    let pending_props = node.pending_props();
    let child = node
        .child()
        .ok_or(FragmentSingleHostChildBeginWorkError::MissingChild { fragment })?;

    if let Some(current) = current
        && let Some(child) = arena.get(current)?.child()
    {
        return Err(
            FragmentSingleHostChildBeginWorkError::ExistingCurrentChild {
                fragment,
                current,
                child,
            },
        );
    }

    let child_node = arena.get(child)?;
    if let Some(sibling) = child_node.sibling() {
        return Err(FragmentSingleHostChildBeginWorkError::MultipleChildren {
            fragment,
            first_child: child,
            sibling,
        });
    }
    let child_tag = child_node.tag();
    if !matches!(child_tag, FiberTag::HostComponent | FiberTag::HostText) {
        return Err(FragmentSingleHostChildBeginWorkError::UnsupportedChildTag {
            fragment,
            child,
            tag: child_tag,
        });
    }
    let child_pending_props = child_node.pending_props();

    arena.get_mut(fragment)?.set_memoized_props(pending_props);

    Ok(FragmentSingleHostChildBeginWorkRecord {
        fragment,
        current,
        child,
        child_tag,
        pending_props,
        child_pending_props,
        render_lanes: request.render_lanes(),
    })
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

pub(crate) fn begin_work_function_component_use_context(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<FunctionComponentUseContextBeginWorkRecord, BeginWorkError> {
    begin_work_function_component_use_context_impl(arena, request, context_store, None, invoker)
}

fn begin_work_function_component_required_use_context(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    expected_context: ContextHandle,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<FunctionComponentUseContextBeginWorkRecord, BeginWorkError> {
    begin_work_function_component_use_context_impl(
        arena,
        request,
        context_store,
        Some(expected_context),
        invoker,
    )
}

fn begin_work_function_component_use_context_impl(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    expected_context: Option<ContextHandle>,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<FunctionComponentUseContextBeginWorkRecord, BeginWorkError> {
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

    let render = match expected_context {
        Some(context) => render_function_component_with_required_use_context(
            arena,
            context_store,
            work_in_progress,
            request.render_lanes(),
            context,
            invoker,
        )?,
        None => render_function_component_with_use_context(
            arena,
            context_store,
            work_in_progress,
            request.render_lanes(),
            invoker,
        )?,
    };

    Ok(FunctionComponentUseContextBeginWorkRecord { render })
}

pub(crate) fn begin_work_context_provider_child(
    arena: &mut FiberArena,
    request: ContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<ContextProviderBeginWorkRecord, ContextProviderBeginWorkError> {
    let child = validate_context_provider_handoff_shape(arena, request.provider())?;
    let provider_snapshot = context_store
        .push_provider(request.context(), request.value())
        .map_err(|error| ContextProviderBeginWorkError::ContextStack {
            provider: request.provider(),
            context: request.context(),
            error: Box::new(error),
        })?;
    let pushed_stack_depth = context_store.stack_depth();

    let child_result = begin_work_with_context_reads(
        arena,
        BeginWorkRequest::new(child, request.render_lanes()),
        context_store,
        &[request.context()],
        invoker,
    )
    .map(BeginWorkResult::function_component);
    let restore_result = context_store.restore_snapshot(provider_snapshot);
    let restored_stack_depth = context_store.stack_depth();

    match (child_result, restore_result) {
        (Ok(child_begin_work), Ok(())) => Ok(ContextProviderBeginWorkRecord {
            provider: request.provider(),
            child,
            context: request.context(),
            value: request.value(),
            provider_snapshot,
            pushed_stack_depth,
            restored_stack_depth,
            child_begin_work,
        }),
        (Err(error), Ok(())) => Err(ContextProviderBeginWorkError::ChildBeginWork {
            provider: request.provider(),
            child,
            error: Box::new(error),
        }),
        (Ok(_), Err(error)) => Err(ContextProviderBeginWorkError::ContextRestore {
            provider: request.provider(),
            context: request.context(),
            snapshot: provider_snapshot,
            error: Box::new(error),
        }),
        (Err(child_error), Err(restore_error)) => Err(
            ContextProviderBeginWorkError::ContextRestoreAfterChildError {
                provider: request.provider(),
                child,
                context: request.context(),
                child_error: Box::new(child_error),
                restore_error: Box::new(restore_error),
            },
        ),
    }
}

pub(crate) fn begin_work_context_provider_use_context_child(
    arena: &mut FiberArena,
    request: ContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<ContextProviderUseContextBeginWorkRecord, ContextProviderBeginWorkError> {
    let child = validate_context_provider_handoff_shape(arena, request.provider())?;
    let provider_snapshot = context_store
        .push_provider(request.context(), request.value())
        .map_err(|error| ContextProviderBeginWorkError::ContextStack {
            provider: request.provider(),
            context: request.context(),
            error: Box::new(error),
        })?;
    let pushed_stack_depth = context_store.stack_depth();

    let child_result = begin_work_function_component_required_use_context(
        arena,
        BeginWorkRequest::new(child, request.render_lanes()),
        context_store,
        request.context(),
        invoker,
    );
    let restore_result = context_store.restore_snapshot(provider_snapshot);
    let restored_stack_depth = context_store.stack_depth();

    match (child_result, restore_result) {
        (Ok(child_begin_work), Ok(())) => Ok(ContextProviderUseContextBeginWorkRecord {
            provider: request.provider(),
            child,
            context: request.context(),
            value: request.value(),
            provider_snapshot,
            pushed_stack_depth,
            restored_stack_depth,
            child_begin_work,
        }),
        (Err(error), Ok(())) => Err(ContextProviderBeginWorkError::ChildBeginWork {
            provider: request.provider(),
            child,
            error: Box::new(error),
        }),
        (Ok(_), Err(error)) => Err(ContextProviderBeginWorkError::ContextRestore {
            provider: request.provider(),
            context: request.context(),
            snapshot: provider_snapshot,
            error: Box::new(error),
        }),
        (Err(child_error), Err(restore_error)) => Err(
            ContextProviderBeginWorkError::ContextRestoreAfterChildError {
                provider: request.provider(),
                child,
                context: request.context(),
                child_error: Box::new(child_error),
                restore_error: Box::new(restore_error),
            },
        ),
    }
}

pub(crate) fn begin_work_context_provider_use_context_single_child(
    arena: &mut FiberArena,
    request: ContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
    resolver: &impl FunctionComponentSingleChildOutputResolver,
) -> Result<ContextProviderUseContextSingleChildBeginWorkRecord, ContextProviderBeginWorkError> {
    let begin_work =
        begin_work_context_provider_use_context_child(arena, request, context_store, invoker)?;
    let single_child = reconcile_function_component_single_child_output(
        arena,
        begin_work.child_render(),
        resolver,
    )
    .map_err(|error| ContextProviderBeginWorkError::ChildBeginWork {
        provider: begin_work.provider(),
        child: begin_work.child(),
        error: Box::new(BeginWorkError::FunctionComponentSingleChild(error)),
    })?;

    Ok(ContextProviderUseContextSingleChildBeginWorkRecord {
        begin_work,
        single_child,
    })
}

pub(crate) fn begin_work_nested_context_provider_child(
    arena: &mut FiberArena,
    request: NestedContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<NestedContextProviderBeginWorkRecord, NestedContextProviderBeginWorkError> {
    let shape = validate_nested_context_provider_handoff_shape(arena, request.outer_provider())?;
    let outer_snapshot = context_store
        .push_provider(request.outer_context(), request.outer_value())
        .map_err(|error| NestedContextProviderBeginWorkError::ContextStack {
            provider: request.outer_provider(),
            context: request.outer_context(),
            error: Box::new(error),
        })?;
    let outer_pushed_stack_depth = context_store.stack_depth();

    let inner_snapshot =
        match context_store.push_provider(request.inner_context(), request.inner_value()) {
            Ok(snapshot) => snapshot,
            Err(error) => {
                if let Err(restore_error) = context_store.restore_snapshot(outer_snapshot) {
                    return Err(NestedContextProviderBeginWorkError::ContextRestore {
                        provider: request.outer_provider(),
                        context: request.outer_context(),
                        snapshot: outer_snapshot,
                        error: Box::new(restore_error),
                    });
                }

                return Err(NestedContextProviderBeginWorkError::ContextStack {
                    provider: shape.inner_provider,
                    context: request.inner_context(),
                    error: Box::new(error),
                });
            }
        };
    let inner_pushed_stack_depth = context_store.stack_depth();
    let contexts = [request.outer_context(), request.inner_context()];

    let child_result = begin_work_with_context_reads(
        arena,
        BeginWorkRequest::new(shape.child, request.render_lanes()),
        context_store,
        &contexts,
        invoker,
    )
    .map(BeginWorkResult::function_component);
    let inner_restore_result = context_store.restore_snapshot(inner_snapshot);
    let inner_restored_stack_depth = context_store.stack_depth();
    let outer_restore_result = context_store.restore_snapshot(outer_snapshot);
    let outer_restored_stack_depth = context_store.stack_depth();

    match (child_result, inner_restore_result, outer_restore_result) {
        (Ok(child_begin_work), Ok(()), Ok(())) => Ok(NestedContextProviderBeginWorkRecord {
            outer_provider: request.outer_provider(),
            inner_provider: shape.inner_provider,
            child: shape.child,
            outer_context: request.outer_context(),
            outer_value: request.outer_value(),
            inner_context: request.inner_context(),
            inner_value: request.inner_value(),
            outer_provider_snapshot: outer_snapshot,
            inner_provider_snapshot: inner_snapshot,
            outer_pushed_stack_depth,
            inner_pushed_stack_depth,
            inner_restored_stack_depth,
            outer_restored_stack_depth,
            child_begin_work,
        }),
        (Ok(_), Err(error), _) => Err(NestedContextProviderBeginWorkError::ContextRestore {
            provider: shape.inner_provider,
            context: request.inner_context(),
            snapshot: inner_snapshot,
            error: Box::new(error),
        }),
        (Ok(_), Ok(()), Err(error)) => Err(NestedContextProviderBeginWorkError::ContextRestore {
            provider: request.outer_provider(),
            context: request.outer_context(),
            snapshot: outer_snapshot,
            error: Box::new(error),
        }),
        (Err(error), Ok(()), Ok(())) => Err(NestedContextProviderBeginWorkError::ChildBeginWork {
            outer_provider: request.outer_provider(),
            inner_provider: shape.inner_provider,
            child: shape.child,
            error: Box::new(error),
        }),
        (Err(child_error), inner_restore_error, outer_restore_error) => Err(
            NestedContextProviderBeginWorkError::ContextRestoreAfterChildError {
                outer_provider: request.outer_provider(),
                inner_provider: shape.inner_provider,
                child: shape.child,
                child_error: Box::new(child_error),
                inner_restore_error: inner_restore_error.err().map(Box::new),
                outer_restore_error: outer_restore_error.err().map(Box::new),
            },
        ),
    }
}

pub(crate) fn begin_work_nested_context_provider_use_context_child(
    arena: &mut FiberArena,
    request: NestedContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<NestedContextProviderUseContextBeginWorkRecord, NestedContextProviderBeginWorkError> {
    let shape = validate_nested_context_provider_handoff_shape(arena, request.outer_provider())?;
    let outer_snapshot = context_store
        .push_provider(request.outer_context(), request.outer_value())
        .map_err(|error| NestedContextProviderBeginWorkError::ContextStack {
            provider: request.outer_provider(),
            context: request.outer_context(),
            error: Box::new(error),
        })?;
    let outer_pushed_stack_depth = context_store.stack_depth();

    let inner_snapshot =
        match context_store.push_provider(request.inner_context(), request.inner_value()) {
            Ok(snapshot) => snapshot,
            Err(error) => {
                if let Err(restore_error) = context_store.restore_snapshot(outer_snapshot) {
                    return Err(NestedContextProviderBeginWorkError::ContextRestore {
                        provider: request.outer_provider(),
                        context: request.outer_context(),
                        snapshot: outer_snapshot,
                        error: Box::new(restore_error),
                    });
                }

                return Err(NestedContextProviderBeginWorkError::ContextStack {
                    provider: shape.inner_provider,
                    context: request.inner_context(),
                    error: Box::new(error),
                });
            }
        };
    let inner_pushed_stack_depth = context_store.stack_depth();

    let child_result = begin_work_function_component_use_context(
        arena,
        BeginWorkRequest::new(shape.child, request.render_lanes()),
        context_store,
        invoker,
    );
    let inner_restore_result = context_store.restore_snapshot(inner_snapshot);
    let inner_restored_stack_depth = context_store.stack_depth();
    let outer_restore_result = context_store.restore_snapshot(outer_snapshot);
    let outer_restored_stack_depth = context_store.stack_depth();

    match (child_result, inner_restore_result, outer_restore_result) {
        (Ok(child_begin_work), Ok(()), Ok(())) => {
            Ok(NestedContextProviderUseContextBeginWorkRecord {
                outer_provider: request.outer_provider(),
                inner_provider: shape.inner_provider,
                child: shape.child,
                outer_context: request.outer_context(),
                outer_value: request.outer_value(),
                inner_context: request.inner_context(),
                inner_value: request.inner_value(),
                outer_provider_snapshot: outer_snapshot,
                inner_provider_snapshot: inner_snapshot,
                outer_pushed_stack_depth,
                inner_pushed_stack_depth,
                inner_restored_stack_depth,
                outer_restored_stack_depth,
                child_begin_work,
            })
        }
        (Ok(_), Err(error), _) => Err(NestedContextProviderBeginWorkError::ContextRestore {
            provider: shape.inner_provider,
            context: request.inner_context(),
            snapshot: inner_snapshot,
            error: Box::new(error),
        }),
        (Ok(_), Ok(()), Err(error)) => Err(NestedContextProviderBeginWorkError::ContextRestore {
            provider: request.outer_provider(),
            context: request.outer_context(),
            snapshot: outer_snapshot,
            error: Box::new(error),
        }),
        (Err(error), Ok(()), Ok(())) => Err(NestedContextProviderBeginWorkError::ChildBeginWork {
            outer_provider: request.outer_provider(),
            inner_provider: shape.inner_provider,
            child: shape.child,
            error: Box::new(error),
        }),
        (Err(child_error), inner_restore_error, outer_restore_error) => Err(
            NestedContextProviderBeginWorkError::ContextRestoreAfterChildError {
                outer_provider: request.outer_provider(),
                inner_provider: shape.inner_provider,
                child: shape.child,
                child_error: Box::new(child_error),
                inner_restore_error: inner_restore_error.err().map(Box::new),
                outer_restore_error: outer_restore_error.err().map(Box::new),
            },
        ),
    }
}

fn validate_context_provider_handoff_shape(
    arena: &FiberArena,
    provider: FiberId,
) -> Result<FiberId, ContextProviderBeginWorkError> {
    let provider_node = arena.get(provider)?;
    let provider_tag = provider_node.tag();
    if provider_tag != FiberTag::ContextProvider {
        return Err(ContextProviderBeginWorkError::UnexpectedFiberTag {
            fiber: provider,
            tag: provider_tag,
        });
    }
    if let Some(sibling) = provider_node.sibling() {
        return Err(ContextProviderBeginWorkError::ProviderSiblingUnsupported {
            provider,
            sibling,
        });
    }
    let child = provider_node
        .child()
        .ok_or(ContextProviderBeginWorkError::MissingChild { provider })?;
    let child_node = arena.get(child)?;
    if let Some(sibling) = child_node.sibling() {
        return Err(ContextProviderBeginWorkError::MultipleChildren {
            provider,
            first_child: child,
            sibling,
        });
    }
    let child_tag = child_node.tag();
    if child_tag != FiberTag::FunctionComponent {
        return Err(ContextProviderBeginWorkError::UnsupportedChildTag {
            provider,
            child,
            tag: child_tag,
        });
    }

    Ok(child)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct NestedContextProviderHandoffShape {
    inner_provider: FiberId,
    child: FiberId,
}

fn validate_nested_context_provider_handoff_shape(
    arena: &FiberArena,
    outer_provider: FiberId,
) -> Result<NestedContextProviderHandoffShape, NestedContextProviderBeginWorkError> {
    let outer_node = arena.get(outer_provider)?;
    let outer_tag = outer_node.tag();
    if outer_tag != FiberTag::ContextProvider {
        return Err(NestedContextProviderBeginWorkError::UnexpectedFiberTag {
            fiber: outer_provider,
            tag: outer_tag,
        });
    }
    if let Some(sibling) = outer_node.sibling() {
        return Err(
            NestedContextProviderBeginWorkError::ProviderSiblingUnsupported {
                provider: outer_provider,
                sibling,
            },
        );
    }

    let inner_provider =
        outer_node
            .child()
            .ok_or(NestedContextProviderBeginWorkError::MissingChild {
                provider: outer_provider,
            })?;
    let inner_node = arena.get(inner_provider)?;
    if let Some(sibling) = inner_node.sibling() {
        return Err(NestedContextProviderBeginWorkError::MultipleChildren {
            provider: outer_provider,
            first_child: inner_provider,
            sibling,
        });
    }
    let inner_tag = inner_node.tag();
    if inner_tag != FiberTag::ContextProvider {
        return Err(
            NestedContextProviderBeginWorkError::UnsupportedOuterChildTag {
                outer_provider,
                child: inner_provider,
                tag: inner_tag,
            },
        );
    }

    let child = inner_node
        .child()
        .ok_or(NestedContextProviderBeginWorkError::MissingChild {
            provider: inner_provider,
        })?;
    let child_node = arena.get(child)?;
    if let Some(sibling) = child_node.sibling() {
        return Err(NestedContextProviderBeginWorkError::MultipleChildren {
            provider: inner_provider,
            first_child: child,
            sibling,
        });
    }
    let child_tag = child_node.tag();
    if child_tag != FiberTag::FunctionComponent {
        return Err(
            NestedContextProviderBeginWorkError::UnsupportedInnerChildTag {
                inner_provider,
                child,
                tag: child_tag,
            },
        );
    }

    Ok(NestedContextProviderHandoffShape {
        inner_provider,
        child,
    })
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
        FunctionComponentContextReadRecord, FunctionComponentContextRenderReader,
        FunctionComponentInvocationError, FunctionComponentInvocationRequest,
        FunctionComponentSingleChildOutput, FunctionComponentSingleChildOutputResolver,
        FunctionComponentSingleChildReconciliationError, FunctionComponentStateDispatchRequest,
        FunctionComponentStateUpdateRenderLanes,
    };
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{FiberRootStore, RootElementHandle, RootOptions};
    use fast_react_core::{
        ContextHandle, ContextStackSnapshot, ContextValueHandle, ElementTypeHandle, FiberMode,
        FiberTypeHandle, HookUpdateLane, Lane, PropsHandle, ReactKey, StateHandle, StateNodeHandle,
        UpdateQueueHandle,
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
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadOnce { context },
        );

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
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadOnce { context },
        );

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
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadTwice { context },
        );

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
                FragmentSingleHostChildBeginWorkError::FragmentSiblingUnsupported {
                    fragment,
                    sibling,
                },
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
