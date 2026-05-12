use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{ContextHandle, ContextValueHandle, FiberId, FiberTag, Lanes};
#[cfg(test)]
use fast_react_core::{ContextValueChange, FiberTopologyError, bubble_properties};
use fast_react_host_config::HostTypes;

use crate::{
    FiberRootId, FiberRootStore,
    begin_work::{
        NestedContextProviderBeginWorkError, NestedContextProviderBeginWorkRecord,
        NestedContextProviderBeginWorkRequest, NestedContextProviderUseContextBeginWorkRecord,
        begin_work_nested_context_provider_child,
        begin_work_nested_context_provider_use_context_child,
    },
    function_component::{
        FunctionComponentContextConsumerInvoker, FunctionComponentContextRenderStore,
        FunctionComponentInvoker,
    },
};
#[cfg(test)]
use crate::{
    HostRootCommitRecord, RootElementHandle,
    begin_work::{
        ContextProviderBeginWorkError, ContextProviderBeginWorkRecord,
        ContextProviderBeginWorkRequest, ContextProviderUseContextBeginWorkRecord,
        ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord,
        ContextProviderUseContextSingleChildBeginWorkRecord,
        NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
        begin_work_context_provider_child, begin_work_context_provider_use_context_child,
        begin_work_context_provider_use_context_single_child,
        begin_work_context_provider_use_context_single_child_for_complete_traversal,
        begin_work_nested_context_provider_two_consumer_use_context_children,
    },
    complete_work::{
        ContextProviderStackRestorationError, ContextProviderStackRestorationRecord,
        complete_context_provider_for_test, unwind_context_provider_for_test,
    },
    context::{
        ContextProviderUpdateDependencyPath, ContextProviderUpdateLaneGateError,
        ContextProviderUpdateSingleConsumerLaneRecord,
        ContextProviderUpdateSingleConsumerLaneRequest, ContextProviderUpdateTwoConsumerLaneRecord,
        ContextProviderUpdateTwoConsumerLaneRequest,
        record_context_provider_update_single_consumer_lane_gate,
        record_context_provider_update_two_consumer_lane_gate,
    },
    function_component::{
        FunctionComponentContextChangePropagationError,
        FunctionComponentContextChangePropagationRecord,
        FunctionComponentContextChangePropagationRequest,
        propagate_context_change_to_function_component_dependencies,
    },
    host_work::{HostWorkResult, mount_test_function_component_single_host_child_work},
    root_commit::{
        HostRootContextProviderUpdateCommitHandoffErrorForCanary,
        HostRootContextProviderUpdateCommitHandoffRecordForCanary,
        HostRootFinishedWorkCommitHandoffErrorForCanary,
        HostRootFinishedWorkCommitHandoffRecordForCanary,
        HostRootPlacementApplyDiagnosticForCanary,
        commit_completed_host_root_render_with_finished_work_handoff_for_canary,
        record_context_provider_update_two_consumer_commit_handoff_for_canary,
    },
    test_support::{RecordingHost, TestHostTree},
};

use super::{HostRootChildBeginWorkPreflightError, validate_host_root_child_preflight};
#[cfg(test)]
use super::{
    HostRootRenderPhaseRecord, HostRootTestHostTreeFunctionOutputResolver,
    complete_handoff::{
        HostRootCompleteWorkCommitHandoffRecord, HostRootCompleteWorkHandoffError,
        HostRootCompleteWorkHandoffRecord, optional_fiber_tag,
        validate_completed_host_root_render_for_complete_work_handoff,
    },
};

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootContextProviderUseContextCompleteWorkHandoffRequest {
    context: ContextHandle,
    value: ContextValueHandle,
}

#[cfg(test)]
impl HostRootContextProviderUseContextCompleteWorkHandoffRequest {
    #[must_use]
    pub(super) const fn new(context: ContextHandle, value: ContextValueHandle) -> Self {
        Self { context, value }
    }

    #[must_use]
    pub(super) const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub(super) const fn value(self) -> ContextValueHandle {
        self.value
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootContextProviderUseContextCompleteWorkHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    original_root_element: RootElementHandle,
    provider: FiberId,
    function_component: FiberId,
    begin_work: ContextProviderUseContextSingleChildBeginWorkRecord,
    complete_work: HostRootCompleteWorkHandoffRecord,
}

#[cfg(test)]
impl HostRootContextProviderUseContextCompleteWorkHandoffRecord {
    #[must_use]
    pub(super) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn original_root_element(self) -> RootElementHandle {
        self.original_root_element
    }

    #[must_use]
    pub(super) const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub(super) const fn function_component(self) -> FiberId {
        self.function_component
    }

    #[must_use]
    pub(super) const fn begin_work(self) -> ContextProviderUseContextSingleChildBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub(super) const fn complete_work(self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_work
    }

    #[must_use]
    pub(super) const fn child_element(self) -> RootElementHandle {
        self.begin_work.child_element()
    }

    #[must_use]
    pub(super) const fn child_tag(self) -> FiberTag {
        self.begin_work.child_tag()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootContextProviderUseContextCompleteWorkHandoffError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    ContextProvider(ContextProviderBeginWorkError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    CompletedChildTagMismatch {
        expected: FiberTag,
        actual: Option<FiberTag>,
    },
}

#[cfg(test)]
impl Display for HostRootContextProviderUseContextCompleteWorkHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::ContextProvider(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private context complete-work handoff",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private context complete-work handoff, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::CompletedChildTagMismatch { expected, actual } => write!(
                formatter,
                "private context-provider complete-work handoff resolved {:?}, but complete-work produced {:?}",
                expected, actual
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootContextProviderUseContextCompleteWorkHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::ContextProvider(error) => Some(error),
            Self::CompleteWork(error) => Some(error),
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. }
            | Self::CompletedChildTagMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootContextProviderUseContextCompleteWorkHandoffError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<ContextProviderBeginWorkError>
    for HostRootContextProviderUseContextCompleteWorkHandoffError
{
    fn from(error: ContextProviderBeginWorkError) -> Self {
        Self::ContextProvider(error)
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootContextProviderUseContextCompleteWorkHandoffError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootContextProviderUseContextPropagationGateRequest {
    context: ContextHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
}

#[cfg(test)]
impl HostRootContextProviderUseContextPropagationGateRequest {
    #[must_use]
    pub(super) const fn new(
        context: ContextHandle,
        previous_value: ContextValueHandle,
        next_value: ContextValueHandle,
        propagation_lanes: Lanes,
    ) -> Self {
        Self {
            context,
            previous_value,
            next_value,
            propagation_lanes,
        }
    }

    #[must_use]
    pub(super) const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub(super) const fn previous_value(self) -> ContextValueHandle {
        self.previous_value
    }

    #[must_use]
    pub(super) const fn next_value(self) -> ContextValueHandle {
        self.next_value
    }

    #[must_use]
    pub(super) const fn propagation_lanes(self) -> Lanes {
        self.propagation_lanes
    }

    #[must_use]
    pub(super) const fn change(self) -> ContextValueChange {
        ContextValueChange::new(self.context, self.previous_value, self.next_value)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct HostRootContextProviderUseContextPropagationGateRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    provider: FiberId,
    function_component: FiberId,
    begin_work: ContextProviderUseContextBeginWorkRecord,
    propagation: FunctionComponentContextChangePropagationRecord,
}

#[cfg(test)]
impl HostRootContextProviderUseContextPropagationGateRecord {
    #[must_use]
    pub(super) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn provider(&self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub(super) const fn function_component(&self) -> FiberId {
        self.function_component
    }

    #[must_use]
    pub(super) const fn begin_work(&self) -> ContextProviderUseContextBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub(super) const fn propagation(&self) -> &FunctionComponentContextChangePropagationRecord {
        &self.propagation
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootNestedContextProviderTwoConsumerPropagationGateRequest {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
    outer_context: ContextHandle,
    outer_value: ContextValueHandle,
    inner_context: ContextHandle,
    inner_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
}

#[cfg(test)]
impl HostRootNestedContextProviderTwoConsumerPropagationGateRequest {
    #[must_use]
    #[allow(
        clippy::too_many_arguments,
        reason = "test propagation request constructor mirrors the two-provider evidence shape"
    )]
    pub(super) const fn new(
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        render_lanes: Lanes,
        outer_context: ContextHandle,
        outer_value: ContextValueHandle,
        inner_context: ContextHandle,
        inner_value: ContextValueHandle,
        next_value: ContextValueHandle,
        propagation_lanes: Lanes,
    ) -> Self {
        Self {
            root,
            host_root_work_in_progress,
            render_lanes,
            outer_context,
            outer_value,
            inner_context,
            inner_value,
            next_value,
            propagation_lanes,
        }
    }

    #[must_use]
    pub(super) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(super) const fn outer_context(self) -> ContextHandle {
        self.outer_context
    }

    #[must_use]
    pub(super) const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    pub(super) const fn inner_context(self) -> ContextHandle {
        self.inner_context
    }

    #[must_use]
    pub(super) const fn inner_value(self) -> ContextValueHandle {
        self.inner_value
    }

    #[must_use]
    pub(super) const fn next_value(self) -> ContextValueHandle {
        self.next_value
    }

    #[must_use]
    pub(super) const fn propagation_lanes(self) -> Lanes {
        self.propagation_lanes
    }

    #[must_use]
    pub(super) const fn change(self) -> ContextValueChange {
        ContextValueChange::new(self.inner_context, self.inner_value, self.next_value)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct HostRootNestedContextProviderTwoConsumerPropagationGateRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    outer_provider: FiberId,
    inner_provider: FiberId,
    first_function_component: FiberId,
    second_function_component: FiberId,
    begin_work: NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    first_propagation: FunctionComponentContextChangePropagationRecord,
    second_propagation: FunctionComponentContextChangePropagationRecord,
}

#[cfg(test)]
impl HostRootNestedContextProviderTwoConsumerPropagationGateRecord {
    #[must_use]
    pub(super) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn outer_provider(&self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub(super) const fn inner_provider(&self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    pub(super) const fn first_function_component(&self) -> FiberId {
        self.first_function_component
    }

    #[must_use]
    pub(super) const fn second_function_component(&self) -> FiberId {
        self.second_function_component
    }

    #[must_use]
    pub(super) const fn begin_work(
        &self,
    ) -> NestedContextProviderTwoConsumerUseContextBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub(super) const fn first_propagation(
        &self,
    ) -> &FunctionComponentContextChangePropagationRecord {
        &self.first_propagation
    }

    #[must_use]
    pub(super) const fn second_propagation(
        &self,
    ) -> &FunctionComponentContextChangePropagationRecord {
        &self.second_propagation
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootContextProviderUseContextPropagationGateError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    ContextProvider(ContextProviderBeginWorkError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    Propagation(FunctionComponentContextChangePropagationError),
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootContextProviderUseContextPropagationGateError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<ContextProviderBeginWorkError> for HostRootContextProviderUseContextPropagationGateError {
    fn from(error: ContextProviderBeginWorkError) -> Self {
        Self::ContextProvider(error)
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootContextProviderUseContextPropagationGateError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<FunctionComponentContextChangePropagationError>
    for HostRootContextProviderUseContextPropagationGateError
{
    fn from(error: FunctionComponentContextChangePropagationError) -> Self {
        Self::Propagation(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootNestedContextProviderTwoConsumerPropagationGateError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    NestedContextProvider(Box<NestedContextProviderBeginWorkError>),
    CompleteWork(HostRootCompleteWorkHandoffError),
    Propagation(FunctionComponentContextChangePropagationError),
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

#[cfg(test)]
impl Display for HostRootNestedContextProviderTwoConsumerPropagationGateError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::NestedContextProvider(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::Propagation(error) => Display::fmt(error, formatter),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private nested multi-consumer context propagation",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private nested multi-consumer context propagation, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootNestedContextProviderTwoConsumerPropagationGateError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::NestedContextProvider(error) => Some(error.as_ref()),
            Self::CompleteWork(error) => Some(error),
            Self::Propagation(error) => Some(error),
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootNestedContextProviderTwoConsumerPropagationGateError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<NestedContextProviderBeginWorkError>
    for HostRootNestedContextProviderTwoConsumerPropagationGateError
{
    fn from(error: NestedContextProviderBeginWorkError) -> Self {
        Self::NestedContextProvider(Box::new(error))
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootNestedContextProviderTwoConsumerPropagationGateError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<FunctionComponentContextChangePropagationError>
    for HostRootNestedContextProviderTwoConsumerPropagationGateError
{
    fn from(error: FunctionComponentContextChangePropagationError) -> Self {
        Self::Propagation(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootContextProviderUseContextCompleteUnwindTraversalRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    original_root_element: RootElementHandle,
    provider: FiberId,
    function_component: FiberId,
    begin_work: ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord,
    stack_depth_after_begin: usize,
    stack_depth_after_host_child_complete: usize,
    provider_complete: ContextProviderStackRestorationRecord,
    complete_work: HostRootCompleteWorkHandoffRecord,
}

#[cfg(test)]
impl HostRootContextProviderUseContextCompleteUnwindTraversalRecord {
    #[must_use]
    pub(super) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn original_root_element(self) -> RootElementHandle {
        self.original_root_element
    }

    #[must_use]
    pub(super) const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub(super) const fn function_component(self) -> FiberId {
        self.function_component
    }

    #[must_use]
    pub(super) const fn begin_work(
        self,
    ) -> ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub(super) const fn stack_depth_after_begin(self) -> usize {
        self.stack_depth_after_begin
    }

    #[must_use]
    pub(super) const fn stack_depth_after_host_child_complete(self) -> usize {
        self.stack_depth_after_host_child_complete
    }

    #[must_use]
    pub(super) const fn provider_complete(self) -> ContextProviderStackRestorationRecord {
        self.provider_complete
    }

    #[must_use]
    pub(super) const fn complete_work(self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_work
    }

    #[must_use]
    pub(super) const fn child_element(self) -> RootElementHandle {
        self.begin_work.child_element()
    }

    #[must_use]
    pub(super) const fn child_tag(self) -> FiberTag {
        self.begin_work.child_tag()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct HostRootContextProviderUpdateRenderCommitTraversalRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    original_root_element: RootElementHandle,
    provider: FiberId,
    function_component: FiberId,
    begin_work: ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord,
    provider_update: ContextProviderUpdateSingleConsumerLaneRecord,
    stack_depth_after_begin: usize,
    stack_depth_after_provider_update: usize,
    stack_depth_after_host_child_complete: usize,
    provider_complete: ContextProviderStackRestorationRecord,
    complete_commit: HostRootCompleteWorkCommitHandoffRecord,
}

#[cfg(test)]
impl HostRootContextProviderUpdateRenderCommitTraversalRecord {
    #[must_use]
    pub(super) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn original_root_element(&self) -> RootElementHandle {
        self.original_root_element
    }

    #[must_use]
    pub(super) const fn provider(&self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub(super) const fn function_component(&self) -> FiberId {
        self.function_component
    }

    #[must_use]
    pub(super) const fn begin_work(
        &self,
    ) -> ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub(super) const fn provider_update(&self) -> ContextProviderUpdateSingleConsumerLaneRecord {
        self.provider_update
    }

    #[must_use]
    pub(super) const fn stack_depth_after_begin(&self) -> usize {
        self.stack_depth_after_begin
    }

    #[must_use]
    pub(super) const fn stack_depth_after_provider_update(&self) -> usize {
        self.stack_depth_after_provider_update
    }

    #[must_use]
    pub(super) const fn stack_depth_after_host_child_complete(&self) -> usize {
        self.stack_depth_after_host_child_complete
    }

    #[must_use]
    pub(super) const fn provider_complete(&self) -> ContextProviderStackRestorationRecord {
        self.provider_complete
    }

    #[must_use]
    pub(super) const fn complete_work(&self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_commit.complete_work()
    }

    #[must_use]
    pub(super) const fn commit(&self) -> &HostRootCommitRecord {
        self.complete_commit.commit()
    }

    #[must_use]
    pub(super) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        self.complete_commit.finished_work_handoff()
    }

    #[must_use]
    pub(super) fn placement_apply_diagnostics(
        &self,
    ) -> &[HostRootPlacementApplyDiagnosticForCanary] {
        self.complete_commit.placement_apply_diagnostics()
    }

    #[must_use]
    pub(super) const fn child_element(&self) -> RootElementHandle {
        self.begin_work.child_element()
    }

    #[must_use]
    pub(super) const fn child_tag(&self) -> FiberTag {
        self.begin_work.child_tag()
    }

    #[must_use]
    pub(super) const fn host_operations_unchanged_by_commit(&self) -> bool {
        self.complete_commit.host_operations_unchanged_by_commit()
    }

    #[must_use]
    pub(super) const fn public_context_compatibility_blocked(&self) -> bool {
        true
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct HostRootNestedContextProviderUpdateRenderCommitHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    original_root_element: RootElementHandle,
    outer_provider: FiberId,
    inner_provider: FiberId,
    first_function_component: FiberId,
    second_function_component: FiberId,
    begin_work: NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    provider_update: ContextProviderUpdateTwoConsumerLaneRecord,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    context_update_commit_handoff: HostRootContextProviderUpdateCommitHandoffRecordForCanary,
}

#[cfg(test)]
impl HostRootNestedContextProviderUpdateRenderCommitHandoffRecord {
    #[must_use]
    pub(super) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn original_root_element(&self) -> RootElementHandle {
        self.original_root_element
    }

    #[must_use]
    pub(super) const fn outer_provider(&self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub(super) const fn inner_provider(&self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    pub(super) const fn first_function_component(&self) -> FiberId {
        self.first_function_component
    }

    #[must_use]
    pub(super) const fn second_function_component(&self) -> FiberId {
        self.second_function_component
    }

    #[must_use]
    pub(super) const fn begin_work(
        &self,
    ) -> NestedContextProviderTwoConsumerUseContextBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub(super) const fn provider_update(&self) -> ContextProviderUpdateTwoConsumerLaneRecord {
        self.provider_update
    }

    #[must_use]
    pub(super) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    pub(super) const fn context_update_commit_handoff(
        &self,
    ) -> &HostRootContextProviderUpdateCommitHandoffRecordForCanary {
        &self.context_update_commit_handoff
    }

    #[must_use]
    pub(super) const fn commit(&self) -> &HostRootCommitRecord {
        self.finished_work_handoff.commit()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootContextProviderUseContextCompleteUnwindTraversalError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    ContextProvider(ContextProviderBeginWorkError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    ProviderStackRestoration(ContextProviderStackRestorationError),
    ProviderStackUnwindAfterCompleteWorkError {
        complete_error: Box<HostRootCompleteWorkHandoffError>,
        unwind_error: Box<ContextProviderStackRestorationError>,
    },
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    CompletedChildTagMismatch {
        expected: FiberTag,
        actual: Option<FiberTag>,
    },
}

#[cfg(test)]
impl Display for HostRootContextProviderUseContextCompleteUnwindTraversalError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::ContextProvider(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::ProviderStackRestoration(error) => Display::fmt(error, formatter),
            Self::ProviderStackUnwindAfterCompleteWorkError {
                complete_error,
                unwind_error,
            } => write!(
                formatter,
                "private context-provider complete traversal failed ({complete_error}) and provider unwind also failed: {unwind_error}"
            ),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private provider complete/unwind traversal",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private provider complete/unwind traversal, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::CompletedChildTagMismatch { expected, actual } => write!(
                formatter,
                "private context-provider complete/unwind traversal resolved {:?}, but complete-work produced {:?}",
                expected, actual
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootContextProviderUseContextCompleteUnwindTraversalError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::ContextProvider(error) => Some(error),
            Self::CompleteWork(error) => Some(error),
            Self::ProviderStackRestoration(error) => Some(error),
            Self::ProviderStackUnwindAfterCompleteWorkError { complete_error, .. } => {
                Some(complete_error.as_ref())
            }
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. }
            | Self::CompletedChildTagMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootContextProviderUseContextCompleteUnwindTraversalError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<ContextProviderBeginWorkError>
    for HostRootContextProviderUseContextCompleteUnwindTraversalError
{
    fn from(error: ContextProviderBeginWorkError) -> Self {
        Self::ContextProvider(error)
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootContextProviderUseContextCompleteUnwindTraversalError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<ContextProviderStackRestorationError>
    for HostRootContextProviderUseContextCompleteUnwindTraversalError
{
    fn from(error: ContextProviderStackRestorationError) -> Self {
        Self::ProviderStackRestoration(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootContextProviderUpdateRenderCommitTraversalError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    ContextProvider(ContextProviderBeginWorkError),
    ContextProviderUpdate(ContextProviderUpdateLaneGateError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    ProviderStackRestoration(ContextProviderStackRestorationError),
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    ProviderStackUnwindAfterCompleteWorkError {
        complete_error: Box<HostRootCompleteWorkHandoffError>,
        unwind_error: Box<ContextProviderStackRestorationError>,
    },
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    CompletedChildTagMismatch {
        expected: FiberTag,
        actual: Option<FiberTag>,
    },
}

#[cfg(test)]
impl Display for HostRootContextProviderUpdateRenderCommitTraversalError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::ContextProvider(error) => Display::fmt(error, formatter),
            Self::ContextProviderUpdate(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::ProviderStackRestoration(error) => Display::fmt(error, formatter),
            Self::FinishedWorkCommitHandoff(error) => Display::fmt(error, formatter),
            Self::ProviderStackUnwindAfterCompleteWorkError {
                complete_error,
                unwind_error,
            } => write!(
                formatter,
                "private context-provider update complete traversal failed ({complete_error}) and provider unwind also failed: {unwind_error}"
            ),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private provider update render/commit traversal",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private provider update render/commit traversal, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::CompletedChildTagMismatch { expected, actual } => write!(
                formatter,
                "private context-provider update render/commit traversal resolved {:?}, but complete-work produced {:?}",
                expected, actual
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootContextProviderUpdateRenderCommitTraversalError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::ContextProvider(error) => Some(error),
            Self::ContextProviderUpdate(error) => Some(error),
            Self::CompleteWork(error) => Some(error),
            Self::ProviderStackRestoration(error) => Some(error),
            Self::FinishedWorkCommitHandoff(error) => Some(error.as_ref()),
            Self::ProviderStackUnwindAfterCompleteWorkError { complete_error, .. } => {
                Some(complete_error.as_ref())
            }
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. }
            | Self::CompletedChildTagMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootContextProviderUpdateRenderCommitTraversalError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<ContextProviderBeginWorkError>
    for HostRootContextProviderUpdateRenderCommitTraversalError
{
    fn from(error: ContextProviderBeginWorkError) -> Self {
        Self::ContextProvider(error)
    }
}

#[cfg(test)]
impl From<ContextProviderUpdateLaneGateError>
    for HostRootContextProviderUpdateRenderCommitTraversalError
{
    fn from(error: ContextProviderUpdateLaneGateError) -> Self {
        Self::ContextProviderUpdate(error)
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootContextProviderUpdateRenderCommitTraversalError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<ContextProviderStackRestorationError>
    for HostRootContextProviderUpdateRenderCommitTraversalError
{
    fn from(error: ContextProviderStackRestorationError) -> Self {
        Self::ProviderStackRestoration(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootContextProviderUpdateRenderCommitTraversalError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootNestedContextProviderUpdateRenderCommitHandoffError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    NestedContextProvider(Box<NestedContextProviderBeginWorkError>),
    ContextProviderUpdate(ContextProviderUpdateLaneGateError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    ContextUpdateCommitHandoff(HostRootContextProviderUpdateCommitHandoffErrorForCanary),
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

#[cfg(test)]
impl Display for HostRootNestedContextProviderUpdateRenderCommitHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::NestedContextProvider(error) => Display::fmt(error, formatter),
            Self::ContextProviderUpdate(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::FinishedWorkCommitHandoff(error) => Display::fmt(error, formatter),
            Self::ContextUpdateCommitHandoff(error) => Display::fmt(error, formatter),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private nested provider update render/commit handoff",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private nested provider update render/commit handoff, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootNestedContextProviderUpdateRenderCommitHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::NestedContextProvider(error) => Some(error.as_ref()),
            Self::ContextProviderUpdate(error) => Some(error),
            Self::CompleteWork(error) => Some(error),
            Self::FinishedWorkCommitHandoff(error) => Some(error.as_ref()),
            Self::ContextUpdateCommitHandoff(error) => Some(error),
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootNestedContextProviderUpdateRenderCommitHandoffError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<NestedContextProviderBeginWorkError>
    for HostRootNestedContextProviderUpdateRenderCommitHandoffError
{
    fn from(error: NestedContextProviderBeginWorkError) -> Self {
        Self::NestedContextProvider(Box::new(error))
    }
}

#[cfg(test)]
impl From<ContextProviderUpdateLaneGateError>
    for HostRootNestedContextProviderUpdateRenderCommitHandoffError
{
    fn from(error: ContextProviderUpdateLaneGateError) -> Self {
        Self::ContextProviderUpdate(error)
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootNestedContextProviderUpdateRenderCommitHandoffError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootNestedContextProviderUpdateRenderCommitHandoffError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

#[cfg(test)]
impl From<HostRootContextProviderUpdateCommitHandoffErrorForCanary>
    for HostRootNestedContextProviderUpdateRenderCommitHandoffError
{
    fn from(error: HostRootContextProviderUpdateCommitHandoffErrorForCanary) -> Self {
        Self::ContextUpdateCommitHandoff(error)
    }
}

#[cfg(test)]
pub(super) fn propagate_host_root_context_provider_use_context_change_for_test(
    store: &mut FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    request: HostRootContextProviderUseContextPropagationGateRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootContextProviderUseContextPropagationGateRecord,
    HostRootContextProviderUseContextPropagationGateError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;
    let provider = validated.child.ok_or(
        HostRootContextProviderUseContextPropagationGateError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootContextProviderUseContextPropagationGateError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootContextProviderUseContextPropagationGateError::ExpectedContextProviderChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child: provider,
                tag: child_tag,
            },
        );
    }

    let begin_work = begin_work_context_provider_use_context_child(
        store.fiber_arena_mut(),
        ContextProviderBeginWorkRequest::new(
            provider,
            render.render_lanes(),
            request.context(),
            request.previous_value(),
        ),
        context_store,
        invoker,
    )?;
    let propagation = propagate_context_change_to_function_component_dependencies(
        store,
        context_store,
        begin_work.child_render(),
        FunctionComponentContextChangePropagationRequest::new(
            request.change(),
            request.propagation_lanes(),
        ),
    )?;

    Ok(HostRootContextProviderUseContextPropagationGateRecord {
        root: render.root(),
        host_root_work_in_progress: render.work_in_progress(),
        provider,
        function_component: begin_work.child(),
        begin_work,
        propagation,
    })
}

#[cfg(test)]
pub(super) fn propagate_host_root_nested_context_provider_two_consumer_use_context_change_for_test(
    store: &mut FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    request: HostRootNestedContextProviderTwoConsumerPropagationGateRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootNestedContextProviderTwoConsumerPropagationGateRecord,
    HostRootNestedContextProviderTwoConsumerPropagationGateError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        request.root(),
        request.host_root_work_in_progress(),
        request.render_lanes(),
    )?;
    let outer_provider = validated.child.ok_or(
        HostRootNestedContextProviderTwoConsumerPropagationGateError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootNestedContextProviderTwoConsumerPropagationGateError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootNestedContextProviderTwoConsumerPropagationGateError::ExpectedContextProviderChild {
                root: request.root(),
                host_root_work_in_progress: request.host_root_work_in_progress(),
                child: outer_provider,
                tag: child_tag,
            },
        );
    }

    let begin_work = begin_work_nested_context_provider_two_consumer_use_context_children(
        store.fiber_arena_mut(),
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            request.render_lanes(),
            request.outer_context(),
            request.outer_value(),
            request.inner_context(),
            request.inner_value(),
        ),
        context_store,
        invoker,
    )?;
    let propagation_request = FunctionComponentContextChangePropagationRequest::new(
        request.change(),
        request.propagation_lanes(),
    );
    let first_propagation = propagate_context_change_to_function_component_dependencies(
        store,
        context_store,
        begin_work.first_child_render(),
        propagation_request,
    )?;
    let second_propagation = propagate_context_change_to_function_component_dependencies(
        store,
        context_store,
        begin_work.second_child_render(),
        propagation_request,
    )?;

    Ok(
        HostRootNestedContextProviderTwoConsumerPropagationGateRecord {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
            outer_provider,
            inner_provider: begin_work.inner_provider(),
            first_function_component: begin_work.first_child(),
            second_function_component: begin_work.second_child(),
            begin_work,
            first_propagation,
            second_propagation,
        },
    )
}

#[cfg(test)]
pub(super) fn handoff_nested_context_provider_two_consumer_update_to_test_render_commit(
    store: &mut FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    request: HostRootNestedContextProviderTwoConsumerPropagationGateRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootNestedContextProviderUpdateRenderCommitHandoffRecord,
    HostRootNestedContextProviderUpdateRenderCommitHandoffError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        request.root(),
        request.host_root_work_in_progress(),
        request.render_lanes(),
    )?;
    let outer_provider = validated.child.ok_or(
        HostRootNestedContextProviderUpdateRenderCommitHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootNestedContextProviderUpdateRenderCommitHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootNestedContextProviderUpdateRenderCommitHandoffError::ExpectedContextProviderChild {
                root: request.root(),
                host_root_work_in_progress: request.host_root_work_in_progress(),
                child: outer_provider,
                tag: child_tag,
            },
        );
    }

    let begin_work = begin_work_nested_context_provider_two_consumer_use_context_children(
        store.fiber_arena_mut(),
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            request.render_lanes(),
            request.outer_context(),
            request.outer_value(),
            request.inner_context(),
            request.inner_value(),
        ),
        context_store,
        invoker,
    )?;
    let provider_update = record_context_provider_update_two_consumer_lane_gate(
        store,
        context_store,
        begin_work,
        ContextProviderUpdateTwoConsumerLaneRequest::new(
            request.root(),
            request.host_root_work_in_progress(),
            begin_work.outer_provider_token(),
            begin_work.inner_provider_token(),
            request.inner_context(),
            request.inner_value(),
            request.next_value(),
            request.propagation_lanes(),
            ContextProviderUpdateDependencyPath::from_begin_work(begin_work),
        ),
    )?;

    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            store, render, 1, 2,
        )?;
    let context_update_commit_handoff =
        record_context_provider_update_two_consumer_commit_handoff_for_canary(
            store,
            &finished_work_handoff,
            provider_update,
            3,
        )?;

    Ok(
        HostRootNestedContextProviderUpdateRenderCommitHandoffRecord {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
            original_root_element: render.resulting_element(),
            outer_provider,
            inner_provider: begin_work.inner_provider(),
            first_function_component: begin_work.first_child(),
            second_function_component: begin_work.second_child(),
            begin_work,
            provider_update,
            finished_work_handoff,
            context_update_commit_handoff,
        },
    )
}

#[cfg(test)]
pub(super) fn handoff_completed_context_provider_use_context_child_to_test_complete_work(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    request: HostRootContextProviderUseContextCompleteWorkHandoffRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootContextProviderUseContextCompleteWorkHandoffRecord,
    HostRootContextProviderUseContextCompleteWorkHandoffError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;
    let provider = validated.child.ok_or(
        HostRootContextProviderUseContextCompleteWorkHandoffError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootContextProviderUseContextCompleteWorkHandoffError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootContextProviderUseContextCompleteWorkHandoffError::ExpectedContextProviderChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child: provider,
                tag: child_tag,
            },
        );
    }

    let resolver = HostRootTestHostTreeFunctionOutputResolver::new(source);
    let begin_work = begin_work_context_provider_use_context_single_child(
        store.fiber_arena_mut(),
        ContextProviderBeginWorkRequest::new(
            provider,
            render.render_lanes(),
            request.context(),
            request.value(),
        ),
        context_store,
        invoker,
        &resolver,
    )?;
    let function_component = begin_work.child();
    let child_element = begin_work.child_element();
    let expected_child_tag = begin_work.child_tag();

    let complete_work = mount_test_context_provider_function_component_single_host_child_work(
        store,
        host,
        render,
        provider,
        function_component,
        child_element,
        source,
    )?;
    if complete_work.completed_child_tag() != Some(expected_child_tag) {
        return Err(
            HostRootContextProviderUseContextCompleteWorkHandoffError::CompletedChildTagMismatch {
                expected: expected_child_tag,
                actual: complete_work.completed_child_tag(),
            },
        );
    }

    Ok(HostRootContextProviderUseContextCompleteWorkHandoffRecord {
        root: render.root(),
        host_root_work_in_progress: render.work_in_progress(),
        original_root_element: render.resulting_element(),
        provider,
        function_component,
        begin_work,
        complete_work,
    })
}

#[cfg(test)]
pub(super) fn handoff_completed_context_provider_use_context_child_to_test_complete_work_with_provider_unwind(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    request: HostRootContextProviderUseContextCompleteWorkHandoffRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootContextProviderUseContextCompleteUnwindTraversalRecord,
    HostRootContextProviderUseContextCompleteUnwindTraversalError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;
    let provider = validated.child.ok_or(
        HostRootContextProviderUseContextCompleteUnwindTraversalError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootContextProviderUseContextCompleteUnwindTraversalError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootContextProviderUseContextCompleteUnwindTraversalError::ExpectedContextProviderChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child: provider,
                tag: child_tag,
            },
        );
    }

    let resolver = HostRootTestHostTreeFunctionOutputResolver::new(source);
    let begin_work = begin_work_context_provider_use_context_single_child_for_complete_traversal(
        store.fiber_arena_mut(),
        ContextProviderBeginWorkRequest::new(
            provider,
            render.render_lanes(),
            request.context(),
            request.value(),
        ),
        context_store,
        invoker,
        &resolver,
    )?;
    let function_component = begin_work.child();
    let child_element = begin_work.child_element();
    let expected_child_tag = begin_work.child_tag();
    let stack_depth_after_begin = context_store.stack_depth();

    let host_work = mount_test_context_provider_function_component_single_host_child_work_until_provider_complete(
        store,
        host,
        render,
        provider,
        function_component,
        child_element,
        source,
    );
    let host_work = match host_work {
        Ok(host_work) => host_work,
        Err(error) => {
            match unwind_context_provider_for_test(
                store.fiber_arena_mut(),
                context_store,
                begin_work.begin_work(),
            ) {
                Ok(_) => {
                    return Err(
                        HostRootContextProviderUseContextCompleteUnwindTraversalError::CompleteWork(
                            error,
                        ),
                    );
                }
                Err(unwind_error) => {
                    return Err(
                        HostRootContextProviderUseContextCompleteUnwindTraversalError::ProviderStackUnwindAfterCompleteWorkError {
                            complete_error: Box::new(error),
                            unwind_error: Box::new(unwind_error),
                        },
                    );
                }
            }
        }
    };
    let stack_depth_after_host_child_complete = context_store.stack_depth();

    let provider_complete = complete_context_provider_for_test(
        store.fiber_arena_mut(),
        context_store,
        begin_work.begin_work(),
    )?;
    complete_host_root_after_context_provider(store, render.work_in_progress())?;
    let complete_work = host_root_complete_work_handoff_record_from_context_provider_host_work(
        store,
        render,
        provider,
        child_element,
        &host_work,
    )?;
    if complete_work.completed_child_tag() != Some(expected_child_tag) {
        return Err(
            HostRootContextProviderUseContextCompleteUnwindTraversalError::CompletedChildTagMismatch {
                expected: expected_child_tag,
                actual: complete_work.completed_child_tag(),
            },
        );
    }

    Ok(
        HostRootContextProviderUseContextCompleteUnwindTraversalRecord {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
            original_root_element: render.resulting_element(),
            provider,
            function_component,
            begin_work,
            stack_depth_after_begin,
            stack_depth_after_host_child_complete,
            provider_complete,
            complete_work,
        },
    )
}

#[cfg(test)]
pub(super) fn handoff_context_provider_update_to_test_render_commit_traversal(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    request: HostRootContextProviderUseContextPropagationGateRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootContextProviderUpdateRenderCommitTraversalRecord,
    HostRootContextProviderUpdateRenderCommitTraversalError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;
    let provider = validated.child.ok_or(
        HostRootContextProviderUpdateRenderCommitTraversalError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootContextProviderUpdateRenderCommitTraversalError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootContextProviderUpdateRenderCommitTraversalError::ExpectedContextProviderChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child: provider,
                tag: child_tag,
            },
        );
    }

    let resolver = HostRootTestHostTreeFunctionOutputResolver::new(source);
    let begin_work = begin_work_context_provider_use_context_single_child_for_complete_traversal(
        store.fiber_arena_mut(),
        ContextProviderBeginWorkRequest::new(
            provider,
            render.render_lanes(),
            request.context(),
            request.previous_value(),
        ),
        context_store,
        invoker,
        &resolver,
    )?;
    let function_component = begin_work.child();
    let child_element = begin_work.child_element();
    let expected_child_tag = begin_work.child_tag();
    let stack_depth_after_begin = context_store.stack_depth();

    let provider_update = record_context_provider_update_single_consumer_lane_gate(
        store,
        context_store,
        begin_work,
        ContextProviderUpdateSingleConsumerLaneRequest::new(
            render.root(),
            render.work_in_progress(),
            begin_work.provider_snapshot(),
            begin_work.provider_token(),
            request.context(),
            request.previous_value(),
            request.next_value(),
            request.propagation_lanes(),
        ),
    )?;
    let stack_depth_after_provider_update = context_store.stack_depth();

    let host_work = mount_test_context_provider_function_component_single_host_child_work_until_provider_complete(
        store,
        host,
        render,
        provider,
        function_component,
        child_element,
        source,
    );
    let host_work = match host_work {
        Ok(host_work) => host_work,
        Err(error) => {
            match unwind_context_provider_for_test(
                store.fiber_arena_mut(),
                context_store,
                begin_work.begin_work(),
            ) {
                Ok(_) => {
                    return Err(
                        HostRootContextProviderUpdateRenderCommitTraversalError::CompleteWork(
                            error,
                        ),
                    );
                }
                Err(unwind_error) => {
                    return Err(
                        HostRootContextProviderUpdateRenderCommitTraversalError::ProviderStackUnwindAfterCompleteWorkError {
                            complete_error: Box::new(error),
                            unwind_error: Box::new(unwind_error),
                        },
                    );
                }
            }
        }
    };
    let stack_depth_after_host_child_complete = context_store.stack_depth();

    let provider_complete = complete_context_provider_for_test(
        store.fiber_arena_mut(),
        context_store,
        begin_work.begin_work(),
    )?;
    complete_host_root_after_context_provider(store, render.work_in_progress())?;
    let complete_work = host_root_complete_work_handoff_record_from_context_provider_host_work(
        store,
        render,
        provider,
        child_element,
        &host_work,
    )?;
    if complete_work.completed_child_tag() != Some(expected_child_tag) {
        return Err(
            HostRootContextProviderUpdateRenderCommitTraversalError::CompletedChildTagMismatch {
                expected: expected_child_tag,
                actual: complete_work.completed_child_tag(),
            },
        );
    }

    let host_operation_count_after_complete_work = host.operations().len();
    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            store, render, 1, 2,
        )?;
    let host_operation_count_after_commit = host.operations().len();
    let placement_apply_diagnostics = finished_work_handoff
        .commit()
        .host_root_placement_apply_diagnostics_for_canary();

    Ok(HostRootContextProviderUpdateRenderCommitTraversalRecord {
        root: render.root(),
        host_root_work_in_progress: render.work_in_progress(),
        original_root_element: render.resulting_element(),
        provider,
        function_component,
        begin_work,
        provider_update,
        stack_depth_after_begin,
        stack_depth_after_provider_update,
        stack_depth_after_host_child_complete,
        provider_complete,
        complete_commit: HostRootCompleteWorkCommitHandoffRecord {
            complete_work,
            finished_work_handoff,
            placement_apply_diagnostics,
            host_operation_count_after_complete_work,
            host_operation_count_after_commit,
        },
    })
}

#[cfg(test)]
pub(super) fn mount_test_context_provider_function_component_single_host_child_work(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    provider: FiberId,
    function_component: FiberId,
    child_element: RootElementHandle,
    source: &TestHostTree,
) -> Result<HostRootCompleteWorkHandoffRecord, HostRootCompleteWorkHandoffError> {
    let host_work =
        mount_test_context_provider_function_component_single_host_child_work_until_provider_complete(
            store,
            host,
            render,
            provider,
            function_component,
            child_element,
            source,
        )?;

    complete_context_provider_function_component_ancestors(
        store,
        render.work_in_progress(),
        provider,
    )?;
    host_root_complete_work_handoff_record_from_context_provider_host_work(
        store,
        render,
        provider,
        child_element,
        &host_work,
    )
}

#[cfg(test)]
pub(super) fn mount_test_context_provider_function_component_single_host_child_work_until_provider_complete(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    provider: FiberId,
    function_component: FiberId,
    child_element: RootElementHandle,
    source: &TestHostTree,
) -> Result<HostWorkResult, HostRootCompleteWorkHandoffError> {
    // Reuse the accepted direct FunctionComponent complete-work fixture for the
    // child host work, then put the Provider parent back before the Provider
    // complete/unwind canary restores context.
    store
        .fiber_arena_mut()
        .set_children(provider, &[])
        .map_err(HostRootCompleteWorkHandoffError::from)?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[function_component])
        .map_err(HostRootCompleteWorkHandoffError::from)?;

    let host_work = mount_test_function_component_single_host_child_work(
        store,
        host,
        render,
        function_component,
        child_element,
        source,
    );
    let restore = restore_context_provider_function_component_topology(
        store,
        render.work_in_progress(),
        provider,
        function_component,
    );

    match (host_work, restore) {
        (Ok(host_work), Ok(())) => Ok(host_work),
        (Err(error), Ok(())) => Err(HostRootCompleteWorkHandoffError::from(error)),
        (_, Err(error)) => Err(HostRootCompleteWorkHandoffError::from(error)),
    }
}

#[cfg(test)]
pub(super) fn restore_context_provider_function_component_topology(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
    provider: FiberId,
    function_component: FiberId,
) -> Result<(), FiberTopologyError> {
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[])?;
    store
        .fiber_arena_mut()
        .set_children(provider, &[function_component])?;
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[provider])?;
    Ok(())
}

#[cfg(test)]
pub(super) fn complete_context_provider_function_component_ancestors(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
    provider: FiberId,
) -> Result<(), HostRootCompleteWorkHandoffError> {
    let provider_bubbled = bubble_properties(store.fiber_arena(), provider)?;
    {
        let provider_node = store.fiber_arena_mut().get_mut(provider)?;
        provider_node.set_child_lanes(provider_bubbled.child_lanes());
        provider_node.set_subtree_flags(provider_bubbled.subtree_flags());
    }

    let root_bubbled = bubble_properties(store.fiber_arena(), host_root_work_in_progress)?;
    let root_node = store
        .fiber_arena_mut()
        .get_mut(host_root_work_in_progress)?;
    root_node.set_child_lanes(root_bubbled.child_lanes());
    root_node.set_subtree_flags(root_bubbled.subtree_flags());
    Ok(())
}

#[cfg(test)]
pub(super) fn complete_host_root_after_context_provider(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> Result<(), HostRootCompleteWorkHandoffError> {
    let root_bubbled = bubble_properties(store.fiber_arena(), host_root_work_in_progress)?;
    let root_node = store
        .fiber_arena_mut()
        .get_mut(host_root_work_in_progress)?;
    root_node.set_child_lanes(root_bubbled.child_lanes());
    root_node.set_subtree_flags(root_bubbled.subtree_flags());
    Ok(())
}

#[cfg(test)]
pub(super) fn host_root_complete_work_handoff_record_from_context_provider_host_work(
    store: &FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    provider: FiberId,
    resulting_element: RootElementHandle,
    host_work: &HostWorkResult,
) -> Result<HostRootCompleteWorkHandoffRecord, HostRootCompleteWorkHandoffError> {
    let completed_child = host_work.completed_child();
    let completed_child_tag = optional_fiber_tag(store, completed_child)?;
    let last_completed_child = host_work.completed_children().last().copied();
    let last_completed_child_tag = optional_fiber_tag(store, last_completed_child)?;

    Ok(HostRootCompleteWorkHandoffRecord {
        root: render.root(),
        host_root_work_in_progress: render.work_in_progress(),
        root_child: Some(provider),
        root_child_tag: Some(FiberTag::ContextProvider),
        root_child_count: 1,
        last_root_child: Some(provider),
        last_root_child_tag: Some(FiberTag::ContextProvider),
        completed_child,
        completed_child_tag,
        completed_child_count: host_work.completed_child_count(),
        last_completed_child,
        last_completed_child_tag,
        render_lanes: render.render_lanes(),
        resulting_element,
        detached_instance_count: host_work.detached_instance_count(),
        detached_text_count: host_work.detached_text_count(),
    })
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootContextProviderBeginWorkHandoffRequest {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
    context: ContextHandle,
    value: ContextValueHandle,
}

#[cfg(test)]
impl HostRootContextProviderBeginWorkHandoffRequest {
    #[must_use]
    pub(super) const fn new(
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        render_lanes: Lanes,
        context: ContextHandle,
        value: ContextValueHandle,
    ) -> Self {
        Self {
            root,
            host_root_work_in_progress,
            render_lanes,
            context,
            value,
        }
    }

    #[must_use]
    pub(super) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(super) const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub(super) const fn value(self) -> ContextValueHandle {
        self.value
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootContextProviderBeginWorkHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    provider: FiberId,
    begin_work: ContextProviderBeginWorkRecord,
}

#[cfg(test)]
impl HostRootContextProviderBeginWorkHandoffRecord {
    #[must_use]
    pub(super) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub(super) const fn begin_work(self) -> ContextProviderBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub(super) const fn function_component(self) -> FiberId {
        self.begin_work.child()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootContextProviderBeginWorkHandoffError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    ContextProvider(ContextProviderBeginWorkError),
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

#[cfg(test)]
impl Display for HostRootContextProviderBeginWorkHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::ContextProvider(error) => Display::fmt(error, formatter),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private context handoff",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private context handoff, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootContextProviderBeginWorkHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::ContextProvider(error) => Some(error),
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError> for HostRootContextProviderBeginWorkHandoffError {
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<ContextProviderBeginWorkError> for HostRootContextProviderBeginWorkHandoffError {
    fn from(error: ContextProviderBeginWorkError) -> Self {
        Self::ContextProvider(error)
    }
}

#[cfg(test)]
pub(super) fn handoff_host_root_context_provider_child_begin_work(
    store: &mut FiberRootStore<RecordingHost>,
    request: HostRootContextProviderBeginWorkHandoffRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<
    HostRootContextProviderBeginWorkHandoffRecord,
    HostRootContextProviderBeginWorkHandoffError,
> {
    let validated = validate_host_root_child_preflight(
        store,
        request.root(),
        request.host_root_work_in_progress(),
        request.render_lanes(),
    )?;
    let provider = validated.child.ok_or(
        HostRootContextProviderBeginWorkHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootContextProviderBeginWorkHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootContextProviderBeginWorkHandoffError::ExpectedContextProviderChild {
                root: request.root(),
                host_root_work_in_progress: request.host_root_work_in_progress(),
                child: provider,
                tag: child_tag,
            },
        );
    }

    let begin_work = begin_work_context_provider_child(
        store.fiber_arena_mut(),
        ContextProviderBeginWorkRequest::new(
            provider,
            request.render_lanes(),
            request.context(),
            request.value(),
        ),
        context_store,
        invoker,
    )?;

    Ok(HostRootContextProviderBeginWorkHandoffRecord {
        root: request.root(),
        host_root_work_in_progress: request.host_root_work_in_progress(),
        provider,
        begin_work,
    })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootNestedContextProviderBeginWorkHandoffRequest {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
    outer_context: ContextHandle,
    outer_value: ContextValueHandle,
    inner_context: ContextHandle,
    inner_value: ContextValueHandle,
}

impl HostRootNestedContextProviderBeginWorkHandoffRequest {
    #[must_use]
    pub(super) const fn new(
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        render_lanes: Lanes,
        outer_context: ContextHandle,
        outer_value: ContextValueHandle,
        inner_context: ContextHandle,
        inner_value: ContextValueHandle,
    ) -> Self {
        Self {
            root,
            host_root_work_in_progress,
            render_lanes,
            outer_context,
            outer_value,
            inner_context,
            inner_value,
        }
    }

    #[must_use]
    pub(super) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(super) const fn outer_context(self) -> ContextHandle {
        self.outer_context
    }

    #[must_use]
    pub(super) const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    pub(super) const fn inner_context(self) -> ContextHandle {
        self.inner_context
    }

    #[must_use]
    pub(super) const fn inner_value(self) -> ContextValueHandle {
        self.inner_value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootNestedContextProviderBeginWorkHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    outer_provider: FiberId,
    inner_provider: FiberId,
    function_component: FiberId,
    begin_work: NestedContextProviderBeginWorkRecord,
}

impl HostRootNestedContextProviderBeginWorkHandoffRecord {
    #[must_use]
    pub(super) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub(super) const fn inner_provider(self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    pub(super) const fn function_component(self) -> FiberId {
        self.function_component
    }

    #[must_use]
    pub(super) const fn begin_work(self) -> NestedContextProviderBeginWorkRecord {
        self.begin_work
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootNestedContextProviderUseContextBeginWorkHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    outer_provider: FiberId,
    inner_provider: FiberId,
    function_component: FiberId,
    begin_work: NestedContextProviderUseContextBeginWorkRecord,
}

impl HostRootNestedContextProviderUseContextBeginWorkHandoffRecord {
    #[must_use]
    pub(super) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub(super) const fn inner_provider(self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    pub(super) const fn function_component(self) -> FiberId {
        self.function_component
    }

    #[must_use]
    pub(super) const fn begin_work(self) -> NestedContextProviderUseContextBeginWorkRecord {
        self.begin_work
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootNestedContextProviderBeginWorkHandoffError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    NestedContextProvider(Box<NestedContextProviderBeginWorkError>),
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

impl Display for HostRootNestedContextProviderBeginWorkHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::NestedContextProvider(error) => Display::fmt(error, formatter),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private nested context handoff",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private nested context handoff, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

impl Error for HostRootNestedContextProviderBeginWorkHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::NestedContextProvider(error) => Some(error.as_ref()),
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. } => None,
        }
    }
}

impl From<HostRootChildBeginWorkPreflightError>
    for HostRootNestedContextProviderBeginWorkHandoffError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

impl From<NestedContextProviderBeginWorkError>
    for HostRootNestedContextProviderBeginWorkHandoffError
{
    fn from(error: NestedContextProviderBeginWorkError) -> Self {
        Self::NestedContextProvider(Box::new(error))
    }
}

pub(super) fn handoff_host_root_nested_context_provider_child_begin_work<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    request: HostRootNestedContextProviderBeginWorkHandoffRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<
    HostRootNestedContextProviderBeginWorkHandoffRecord,
    HostRootNestedContextProviderBeginWorkHandoffError,
> {
    let validated = validate_host_root_child_preflight(
        store,
        request.root(),
        request.host_root_work_in_progress(),
        request.render_lanes(),
    )?;
    let outer_provider = validated.child.ok_or(
        HostRootNestedContextProviderBeginWorkHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootNestedContextProviderBeginWorkHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootNestedContextProviderBeginWorkHandoffError::ExpectedContextProviderChild {
                root: request.root(),
                host_root_work_in_progress: request.host_root_work_in_progress(),
                child: outer_provider,
                tag: child_tag,
            },
        );
    }

    let begin_work = begin_work_nested_context_provider_child(
        store.fiber_arena_mut(),
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            request.render_lanes(),
            request.outer_context(),
            request.outer_value(),
            request.inner_context(),
            request.inner_value(),
        ),
        context_store,
        invoker,
    )?;

    Ok(HostRootNestedContextProviderBeginWorkHandoffRecord {
        root: request.root(),
        host_root_work_in_progress: request.host_root_work_in_progress(),
        outer_provider,
        inner_provider: begin_work.inner_provider(),
        function_component: begin_work.child(),
        begin_work,
    })
}

pub(super) fn handoff_host_root_nested_context_provider_use_context_child_begin_work<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    request: HostRootNestedContextProviderBeginWorkHandoffRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootNestedContextProviderUseContextBeginWorkHandoffRecord,
    HostRootNestedContextProviderBeginWorkHandoffError,
> {
    let validated = validate_host_root_child_preflight(
        store,
        request.root(),
        request.host_root_work_in_progress(),
        request.render_lanes(),
    )?;
    let outer_provider = validated.child.ok_or(
        HostRootNestedContextProviderBeginWorkHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootNestedContextProviderBeginWorkHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootNestedContextProviderBeginWorkHandoffError::ExpectedContextProviderChild {
                root: request.root(),
                host_root_work_in_progress: request.host_root_work_in_progress(),
                child: outer_provider,
                tag: child_tag,
            },
        );
    }

    let begin_work = begin_work_nested_context_provider_use_context_child(
        store.fiber_arena_mut(),
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            request.render_lanes(),
            request.outer_context(),
            request.outer_value(),
            request.inner_context(),
            request.inner_value(),
        ),
        context_store,
        invoker,
    )?;

    Ok(
        HostRootNestedContextProviderUseContextBeginWorkHandoffRecord {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
            outer_provider,
            inner_provider: begin_work.inner_provider(),
            function_component: begin_work.child(),
            begin_work,
        },
    )
}
