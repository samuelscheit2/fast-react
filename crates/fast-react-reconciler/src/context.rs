//! Private context provider update diagnostics.
//!
//! This module composes the accepted exact-shape Provider/useContext begin-work
//! records with the private context dependency lane propagation primitive. It
//! is intentionally test-only and does not expose public `useContext`,
//! renderer-visible dependency storage, or real rerender execution.

#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ContextFrameId, ContextHandle, ContextValueChange, ContextValueHandle, FiberFlags, FiberId,
    FiberTag, FiberTopologyError, Lanes,
};
use fast_react_host_config::HostTypes;

use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError,
    begin_work::NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    function_component::{
        FunctionComponentContextChangePropagationError,
        FunctionComponentContextChangePropagationRecord,
        FunctionComponentContextChangePropagationRequest, FunctionComponentContextDependencyHandle,
        FunctionComponentContextRenderStore,
        propagate_context_change_to_function_component_dependencies,
    },
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ContextProviderUpdateConsumerOrder {
    First,
    Second,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateDependencyPath {
    first_dependency: FunctionComponentContextDependencyHandle,
    second_dependency: FunctionComponentContextDependencyHandle,
}

impl ContextProviderUpdateDependencyPath {
    #[must_use]
    pub const fn new(
        first_dependency: FunctionComponentContextDependencyHandle,
        second_dependency: FunctionComponentContextDependencyHandle,
    ) -> Self {
        Self {
            first_dependency,
            second_dependency,
        }
    }

    #[must_use]
    pub const fn from_begin_work(
        begin_work: NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    ) -> Self {
        Self {
            first_dependency: begin_work.first_child_context_dependency(),
            second_dependency: begin_work.second_child_context_dependency(),
        }
    }

    #[must_use]
    pub const fn first_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.first_dependency
    }

    #[must_use]
    pub const fn second_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.second_dependency
    }

    #[must_use]
    const fn dependency_for_order(
        self,
        order: ContextProviderUpdateConsumerOrder,
    ) -> FunctionComponentContextDependencyHandle {
        match order {
            ContextProviderUpdateConsumerOrder::First => self.first_dependency,
            ContextProviderUpdateConsumerOrder::Second => self.second_dependency,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateTwoConsumerLaneRequest {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    outer_provider_token: ContextFrameId,
    inner_provider_token: ContextFrameId,
    context: ContextHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
    dependency_path: ContextProviderUpdateDependencyPath,
}

impl ContextProviderUpdateTwoConsumerLaneRequest {
    #[must_use]
    pub const fn new(
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        outer_provider_token: ContextFrameId,
        inner_provider_token: ContextFrameId,
        context: ContextHandle,
        previous_value: ContextValueHandle,
        next_value: ContextValueHandle,
        propagation_lanes: Lanes,
        dependency_path: ContextProviderUpdateDependencyPath,
    ) -> Self {
        Self {
            root,
            host_root_work_in_progress,
            outer_provider_token,
            inner_provider_token,
            context,
            previous_value,
            next_value,
            propagation_lanes,
            dependency_path,
        }
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub const fn outer_provider_token(self) -> ContextFrameId {
        self.outer_provider_token
    }

    #[must_use]
    pub const fn inner_provider_token(self) -> ContextFrameId {
        self.inner_provider_token
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn previous_value(self) -> ContextValueHandle {
        self.previous_value
    }

    #[must_use]
    pub const fn next_value(self) -> ContextValueHandle {
        self.next_value
    }

    #[must_use]
    pub const fn propagation_lanes(self) -> Lanes {
        self.propagation_lanes
    }

    #[must_use]
    pub const fn dependency_path(self) -> ContextProviderUpdateDependencyPath {
        self.dependency_path
    }

    #[must_use]
    const fn change(self) -> ContextValueChange {
        ContextValueChange::new(self.context, self.previous_value, self.next_value)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateProviderStackRecord {
    provider: FiberId,
    context: ContextHandle,
    pushed_value: ContextValueHandle,
    provider_token: ContextFrameId,
    pushed_stack_depth: usize,
    restored_stack_depth: usize,
}

impl ContextProviderUpdateProviderStackRecord {
    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn pushed_value(self) -> ContextValueHandle {
        self.pushed_value
    }

    #[must_use]
    pub const fn provider_token(self) -> ContextFrameId {
        self.provider_token
    }

    #[must_use]
    pub const fn pushed_stack_depth(self) -> usize {
        self.pushed_stack_depth
    }

    #[must_use]
    pub const fn restored_stack_depth(self) -> usize {
        self.restored_stack_depth
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateConsumerLaneRecord {
    order: ContextProviderUpdateConsumerOrder,
    consumer: FiberId,
    dependency: FunctionComponentContextDependencyHandle,
    context: ContextHandle,
    memoized_value: ContextValueHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
    previous_dependency_lanes: Lanes,
    dependency_lanes: Lanes,
    fiber_lanes_after: Lanes,
    scanned_dependency_count: usize,
    root: FiberRootId,
}

impl ContextProviderUpdateConsumerLaneRecord {
    #[must_use]
    pub const fn order(self) -> ContextProviderUpdateConsumerOrder {
        self.order
    }

    #[must_use]
    pub const fn consumer(self) -> FiberId {
        self.consumer
    }

    #[must_use]
    pub const fn dependency(self) -> FunctionComponentContextDependencyHandle {
        self.dependency
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn memoized_value(self) -> ContextValueHandle {
        self.memoized_value
    }

    #[must_use]
    pub const fn previous_value(self) -> ContextValueHandle {
        self.previous_value
    }

    #[must_use]
    pub const fn next_value(self) -> ContextValueHandle {
        self.next_value
    }

    #[must_use]
    pub const fn propagation_lanes(self) -> Lanes {
        self.propagation_lanes
    }

    #[must_use]
    pub const fn previous_dependency_lanes(self) -> Lanes {
        self.previous_dependency_lanes
    }

    #[must_use]
    pub const fn dependency_lanes(self) -> Lanes {
        self.dependency_lanes
    }

    #[must_use]
    pub const fn fiber_lanes_after(self) -> Lanes {
        self.fiber_lanes_after
    }

    #[must_use]
    pub const fn scanned_dependency_count(self) -> usize {
        self.scanned_dependency_count
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateTwoConsumerLaneRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    outer_provider: FiberId,
    inner_provider: FiberId,
    context: ContextHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
    begin_work: NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    provider_stack_pushes: [ContextProviderUpdateProviderStackRecord; 2],
    dependent_consumers: [ContextProviderUpdateConsumerLaneRecord; 2],
    host_root_child_lanes_after: Lanes,
    outer_provider_child_lanes_after: Lanes,
    inner_provider_child_lanes_after: Lanes,
    root_pending_lanes_after: Lanes,
}

impl ContextProviderUpdateTwoConsumerLaneRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub const fn inner_provider(self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn previous_value(self) -> ContextValueHandle {
        self.previous_value
    }

    #[must_use]
    pub const fn next_value(self) -> ContextValueHandle {
        self.next_value
    }

    #[must_use]
    pub const fn propagation_lanes(self) -> Lanes {
        self.propagation_lanes
    }

    #[must_use]
    pub const fn begin_work(self) -> NestedContextProviderTwoConsumerUseContextBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub const fn provider_stack_pushes(self) -> [ContextProviderUpdateProviderStackRecord; 2] {
        self.provider_stack_pushes
    }

    #[must_use]
    pub const fn provider_stack_pops(self) -> [ContextProviderUpdateProviderStackRecord; 2] {
        [self.provider_stack_pushes[1], self.provider_stack_pushes[0]]
    }

    #[must_use]
    pub const fn dependent_consumers(self) -> [ContextProviderUpdateConsumerLaneRecord; 2] {
        self.dependent_consumers
    }

    #[must_use]
    pub const fn host_root_child_lanes_after(self) -> Lanes {
        self.host_root_child_lanes_after
    }

    #[must_use]
    pub const fn outer_provider_child_lanes_after(self) -> Lanes {
        self.outer_provider_child_lanes_after
    }

    #[must_use]
    pub const fn inner_provider_child_lanes_after(self) -> Lanes {
        self.inner_provider_child_lanes_after
    }

    #[must_use]
    pub const fn root_pending_lanes_after(self) -> Lanes {
        self.root_pending_lanes_after
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum ContextProviderUpdateLaneGateError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    Propagation(FunctionComponentContextChangePropagationError),
    UnchangedProviderValue {
        context: ContextHandle,
        previous_value: ContextValueHandle,
        next_value: ContextValueHandle,
    },
    ProviderValuePathMismatch {
        expected_context: ContextHandle,
        actual_context: ContextHandle,
        expected_previous_value: ContextValueHandle,
        actual_previous_value: ContextValueHandle,
    },
    StaleProviderToken {
        provider: FiberId,
        expected_token: ContextFrameId,
        actual_token: ContextFrameId,
    },
    MismatchedDependencyPath {
        order: ContextProviderUpdateConsumerOrder,
        expected_dependency: FunctionComponentContextDependencyHandle,
        actual_dependency: FunctionComponentContextDependencyHandle,
    },
    MissingDependency {
        order: ContextProviderUpdateConsumerOrder,
        dependency: FunctionComponentContextDependencyHandle,
    },
    DependencyRecordMismatch {
        order: ContextProviderUpdateConsumerOrder,
        dependency: FunctionComponentContextDependencyHandle,
        expected_fiber: FiberId,
        actual_fiber: FiberId,
        expected_context: ContextHandle,
        actual_context: ContextHandle,
        expected_memoized_value: ContextValueHandle,
        actual_memoized_value: ContextValueHandle,
    },
    MissingMarkedDependency {
        order: ContextProviderUpdateConsumerOrder,
        expected_dependency: FunctionComponentContextDependencyHandle,
    },
    UnexpectedMarkedDependencyCount {
        order: ContextProviderUpdateConsumerOrder,
        expected_dependency: FunctionComponentContextDependencyHandle,
        marked_dependency_count: usize,
    },
    UnexpectedMarkedDependency {
        order: ContextProviderUpdateConsumerOrder,
        expected_dependency: FunctionComponentContextDependencyHandle,
        actual_dependency: FunctionComponentContextDependencyHandle,
        expected_fiber: FiberId,
        actual_fiber: FiberId,
    },
}

impl Display for ContextProviderUpdateLaneGateError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::Propagation(error) => Display::fmt(error, formatter),
            Self::UnchangedProviderValue {
                context,
                previous_value,
                next_value,
            } => write!(
                formatter,
                "context {} provider update must change value; previous {} next {}",
                context.raw(),
                previous_value.raw(),
                next_value.raw()
            ),
            Self::ProviderValuePathMismatch {
                expected_context,
                actual_context,
                expected_previous_value,
                actual_previous_value,
            } => write!(
                formatter,
                "provider update path expected context {} value {}, found context {} value {}",
                expected_context.raw(),
                expected_previous_value.raw(),
                actual_context.raw(),
                actual_previous_value.raw()
            ),
            Self::StaleProviderToken {
                provider,
                expected_token,
                actual_token,
            } => write!(
                formatter,
                "provider {} update token {} is stale; active begin-work token is {}",
                provider.slot().get(),
                expected_token.raw(),
                actual_token.raw()
            ),
            Self::MismatchedDependencyPath {
                order,
                expected_dependency,
                actual_dependency,
            } => write!(
                formatter,
                "{order:?} provider update dependency path expected dependency {}, found {}",
                expected_dependency.raw(),
                actual_dependency.raw()
            ),
            Self::MissingDependency { order, dependency } => write!(
                formatter,
                "{order:?} provider update dependency {} is missing",
                dependency.raw()
            ),
            Self::DependencyRecordMismatch {
                order,
                dependency,
                expected_fiber,
                actual_fiber,
                expected_context,
                actual_context,
                expected_memoized_value,
                actual_memoized_value,
            } => write!(
                formatter,
                "{order:?} provider update dependency {} expected fiber {} context {} value {}, found fiber {} context {} value {}",
                dependency.raw(),
                expected_fiber.slot().get(),
                expected_context.raw(),
                expected_memoized_value.raw(),
                actual_fiber.slot().get(),
                actual_context.raw(),
                actual_memoized_value.raw()
            ),
            Self::MissingMarkedDependency {
                order,
                expected_dependency,
            } => write!(
                formatter,
                "{order:?} provider update did not mark expected dependency {}",
                expected_dependency.raw()
            ),
            Self::UnexpectedMarkedDependencyCount {
                order,
                expected_dependency,
                marked_dependency_count,
            } => write!(
                formatter,
                "{order:?} provider update expected exactly one mark for dependency {}, found {}",
                expected_dependency.raw(),
                marked_dependency_count
            ),
            Self::UnexpectedMarkedDependency {
                order,
                expected_dependency,
                actual_dependency,
                expected_fiber,
                actual_fiber,
            } => write!(
                formatter,
                "{order:?} provider update expected dependency {} on fiber {}, found dependency {} on fiber {}",
                expected_dependency.raw(),
                expected_fiber.slot().get(),
                actual_dependency.raw(),
                actual_fiber.slot().get()
            ),
        }
    }
}

impl Error for ContextProviderUpdateLaneGateError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::Propagation(error) => Some(error),
            Self::UnchangedProviderValue { .. }
            | Self::ProviderValuePathMismatch { .. }
            | Self::StaleProviderToken { .. }
            | Self::MismatchedDependencyPath { .. }
            | Self::MissingDependency { .. }
            | Self::DependencyRecordMismatch { .. }
            | Self::MissingMarkedDependency { .. }
            | Self::UnexpectedMarkedDependencyCount { .. }
            | Self::UnexpectedMarkedDependency { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for ContextProviderUpdateLaneGateError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for ContextProviderUpdateLaneGateError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<FunctionComponentContextChangePropagationError> for ContextProviderUpdateLaneGateError {
    fn from(error: FunctionComponentContextChangePropagationError) -> Self {
        Self::Propagation(error)
    }
}

pub(crate) fn record_context_provider_update_two_consumer_lane_gate<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    request: ContextProviderUpdateTwoConsumerLaneRequest,
) -> Result<ContextProviderUpdateTwoConsumerLaneRecord, ContextProviderUpdateLaneGateError> {
    validate_provider_update_request(context_store, begin_work, request)?;

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
    let first_consumer = consumer_lane_record_from_propagation(
        store,
        ContextProviderUpdateConsumerOrder::First,
        &first_propagation,
        begin_work.first_child(),
        begin_work.first_child_context_dependency(),
    )?;

    let second_propagation = propagate_context_change_to_function_component_dependencies(
        store,
        context_store,
        begin_work.second_child_render(),
        propagation_request,
    )?;
    let second_consumer = consumer_lane_record_from_propagation(
        store,
        ContextProviderUpdateConsumerOrder::Second,
        &second_propagation,
        begin_work.second_child(),
        begin_work.second_child_context_dependency(),
    )?;

    let host_root_child_lanes_after = store
        .fiber_arena()
        .get(request.host_root_work_in_progress())?
        .child_lanes();
    let outer_provider_child_lanes_after = store
        .fiber_arena()
        .get(begin_work.outer_provider())?
        .child_lanes();
    let inner_provider_child_lanes_after = store
        .fiber_arena()
        .get(begin_work.inner_provider())?
        .child_lanes();
    let root_pending_lanes_after = store.root(request.root())?.lanes().pending_lanes();

    Ok(ContextProviderUpdateTwoConsumerLaneRecord {
        root: request.root(),
        host_root_work_in_progress: request.host_root_work_in_progress(),
        outer_provider: begin_work.outer_provider(),
        inner_provider: begin_work.inner_provider(),
        context: request.context(),
        previous_value: request.previous_value(),
        next_value: request.next_value(),
        propagation_lanes: request.propagation_lanes(),
        begin_work,
        provider_stack_pushes: [
            ContextProviderUpdateProviderStackRecord {
                provider: begin_work.outer_provider(),
                context: begin_work.outer_context(),
                pushed_value: begin_work.outer_value(),
                provider_token: begin_work.outer_provider_token(),
                pushed_stack_depth: begin_work.outer_pushed_stack_depth(),
                restored_stack_depth: begin_work.outer_restored_stack_depth(),
            },
            ContextProviderUpdateProviderStackRecord {
                provider: begin_work.inner_provider(),
                context: begin_work.inner_context(),
                pushed_value: begin_work.inner_value(),
                provider_token: begin_work.inner_provider_token(),
                pushed_stack_depth: begin_work.inner_pushed_stack_depth(),
                restored_stack_depth: begin_work.inner_restored_stack_depth(),
            },
        ],
        dependent_consumers: [first_consumer, second_consumer],
        host_root_child_lanes_after,
        outer_provider_child_lanes_after,
        inner_provider_child_lanes_after,
        root_pending_lanes_after,
    })
}

fn validate_provider_update_request(
    context_store: &FunctionComponentContextRenderStore,
    begin_work: NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    request: ContextProviderUpdateTwoConsumerLaneRequest,
) -> Result<(), ContextProviderUpdateLaneGateError> {
    if !request.change().is_changed() {
        return Err(ContextProviderUpdateLaneGateError::UnchangedProviderValue {
            context: request.context(),
            previous_value: request.previous_value(),
            next_value: request.next_value(),
        });
    }

    if request.context() != begin_work.inner_context()
        || request.previous_value() != begin_work.inner_value()
    {
        return Err(
            ContextProviderUpdateLaneGateError::ProviderValuePathMismatch {
                expected_context: begin_work.inner_context(),
                actual_context: request.context(),
                expected_previous_value: begin_work.inner_value(),
                actual_previous_value: request.previous_value(),
            },
        );
    }

    if request.outer_provider_token() != begin_work.outer_provider_token() {
        return Err(ContextProviderUpdateLaneGateError::StaleProviderToken {
            provider: begin_work.outer_provider(),
            expected_token: request.outer_provider_token(),
            actual_token: begin_work.outer_provider_token(),
        });
    }

    if request.inner_provider_token() != begin_work.inner_provider_token() {
        return Err(ContextProviderUpdateLaneGateError::StaleProviderToken {
            provider: begin_work.inner_provider(),
            expected_token: request.inner_provider_token(),
            actual_token: begin_work.inner_provider_token(),
        });
    }

    validate_dependency_path(
        context_store,
        ContextProviderUpdateConsumerOrder::First,
        begin_work.first_child(),
        begin_work.inner_context(),
        begin_work.inner_value(),
        begin_work.first_child_context_dependency(),
        request
            .dependency_path()
            .dependency_for_order(ContextProviderUpdateConsumerOrder::First),
    )?;
    validate_dependency_path(
        context_store,
        ContextProviderUpdateConsumerOrder::Second,
        begin_work.second_child(),
        begin_work.inner_context(),
        begin_work.inner_value(),
        begin_work.second_child_context_dependency(),
        request
            .dependency_path()
            .dependency_for_order(ContextProviderUpdateConsumerOrder::Second),
    )
}

fn validate_dependency_path(
    context_store: &FunctionComponentContextRenderStore,
    order: ContextProviderUpdateConsumerOrder,
    expected_fiber: FiberId,
    expected_context: ContextHandle,
    expected_memoized_value: ContextValueHandle,
    expected_dependency: FunctionComponentContextDependencyHandle,
    actual_dependency: FunctionComponentContextDependencyHandle,
) -> Result<(), ContextProviderUpdateLaneGateError> {
    if actual_dependency != expected_dependency {
        return Err(
            ContextProviderUpdateLaneGateError::MismatchedDependencyPath {
                order,
                expected_dependency,
                actual_dependency,
            },
        );
    }

    let dependency = context_store.context_dependency(actual_dependency).ok_or(
        ContextProviderUpdateLaneGateError::MissingDependency {
            order,
            dependency: actual_dependency,
        },
    )?;

    if dependency.fiber() != expected_fiber
        || dependency.context() != expected_context
        || dependency.memoized_value() != expected_memoized_value
    {
        return Err(
            ContextProviderUpdateLaneGateError::DependencyRecordMismatch {
                order,
                dependency: actual_dependency,
                expected_fiber,
                actual_fiber: dependency.fiber(),
                expected_context,
                actual_context: dependency.context(),
                expected_memoized_value,
                actual_memoized_value: dependency.memoized_value(),
            },
        );
    }

    Ok(())
}

fn consumer_lane_record_from_propagation<H: HostTypes>(
    store: &FiberRootStore<H>,
    order: ContextProviderUpdateConsumerOrder,
    propagation: &FunctionComponentContextChangePropagationRecord,
    expected_fiber: FiberId,
    expected_dependency: FunctionComponentContextDependencyHandle,
) -> Result<ContextProviderUpdateConsumerLaneRecord, ContextProviderUpdateLaneGateError> {
    match propagation.marked_dependency_count() {
        0 => {
            return Err(
                ContextProviderUpdateLaneGateError::MissingMarkedDependency {
                    order,
                    expected_dependency,
                },
            );
        }
        1 => {}
        marked_dependency_count => {
            return Err(
                ContextProviderUpdateLaneGateError::UnexpectedMarkedDependencyCount {
                    order,
                    expected_dependency,
                    marked_dependency_count,
                },
            );
        }
    }

    let marked = propagation.marked_dependencies()[0];
    if marked.dependency() != expected_dependency || marked.fiber() != expected_fiber {
        return Err(
            ContextProviderUpdateLaneGateError::UnexpectedMarkedDependency {
                order,
                expected_dependency,
                actual_dependency: marked.dependency(),
                expected_fiber,
                actual_fiber: marked.fiber(),
            },
        );
    }

    let fiber_lanes_after = store.fiber_arena().get(expected_fiber)?.lanes();
    Ok(ContextProviderUpdateConsumerLaneRecord {
        order,
        consumer: marked.fiber(),
        dependency: marked.dependency(),
        context: marked.context(),
        memoized_value: marked.memoized_value(),
        previous_value: marked.previous_value(),
        next_value: marked.next_value(),
        propagation_lanes: marked.propagation_lanes(),
        previous_dependency_lanes: marked.previous_dependency_lanes(),
        dependency_lanes: marked.dependency_lanes(),
        fiber_lanes_after,
        scanned_dependency_count: propagation.scanned_dependency_count(),
        root: marked.root(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::begin_work::{
        NestedContextProviderBeginWorkRequest,
        begin_work_nested_context_provider_two_consumer_use_context_children,
    };
    use crate::function_component::{
        FunctionComponentContextConsumerInvoker, FunctionComponentContextReadRecord,
        FunctionComponentContextRenderReader, FunctionComponentInvocationError,
        FunctionComponentInvocationRequest, FunctionComponentOutputHandle,
        FunctionComponentRenderError,
    };
    use crate::root_work_loop::render_host_root_for_lanes;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{RootElementHandle, RootOptions, update_container};
    use fast_react_core::{DependenciesHandle, FiberMode, FiberTypeHandle, Lane, PropsHandle};

    #[derive(Debug, Clone, Copy)]
    enum UseContextBehavior {
        ReadOnce { context: ContextHandle },
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
            }
        }
    }

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id, host)
    }

    fn attach_nested_context_provider_two_consumer_wip_children(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (
        FiberId,
        FiberId,
        FiberId,
        FiberTypeHandle,
        FiberId,
        FiberTypeHandle,
    ) {
        let outer_provider = store.fiber_arena_mut().create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(1_301),
            FiberMode::NO,
        );
        let inner_provider = store.fiber_arena_mut().create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(1_302),
            FiberMode::NO,
        );
        let first_current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(1_303),
            FiberMode::NO,
        );
        let first_component = FiberTypeHandle::from_raw(1_304);
        store
            .fiber_arena_mut()
            .get_mut(first_current)
            .unwrap()
            .set_fiber_type(first_component);
        let first_work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(first_current, PropsHandle::from_raw(1_305))
            .unwrap();
        let second_current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(1_306),
            FiberMode::NO,
        );
        let second_component = FiberTypeHandle::from_raw(1_307);
        store
            .fiber_arena_mut()
            .get_mut(second_current)
            .unwrap()
            .set_fiber_type(second_component);
        let second_work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(second_current, PropsHandle::from_raw(1_308))
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(
                inner_provider,
                &[first_work_in_progress, second_work_in_progress],
            )
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(outer_provider, &[inner_provider])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[outer_provider])
            .unwrap();

        (
            outer_provider,
            inner_provider,
            first_work_in_progress,
            first_component,
            second_work_in_progress,
            second_component,
        )
    }

    fn context_value(raw: u64) -> ContextValueHandle {
        ContextValueHandle::from_raw(raw)
    }

    #[test]
    fn context_provider_update_lane_gate_records_two_consumer_order_and_lanes() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_320),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (
            outer_provider,
            inner_provider,
            first_function_component,
            first_component,
            second_function_component,
            second_component,
        ) = attach_nested_context_provider_two_consumer_wip_children(
            &mut store,
            host_root_work_in_progress,
        );
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(1_330);
        let outer_value = context_value(1_331);
        let previous_inner_value = context_value(1_332);
        let next_inner_value = context_value(1_333);
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            first_component,
            UseContextBehavior::ReadOnce { context },
        );
        registry.register(second_component, UseContextBehavior::ReadOnce { context });
        let begin_work = begin_work_nested_context_provider_two_consumer_use_context_children(
            store.fiber_arena_mut(),
            NestedContextProviderBeginWorkRequest::new(
                outer_provider,
                Lanes::DEFAULT,
                context,
                outer_value,
                context,
                previous_inner_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let propagation_lanes = Lanes::SYNC
            .merge_lane(Lane::TRANSITION_1)
            .merge_lane(Lane::RETRY_2);

        let record = record_context_provider_update_two_consumer_lane_gate(
            &mut store,
            &mut context_store,
            begin_work,
            ContextProviderUpdateTwoConsumerLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                begin_work.outer_provider_token(),
                begin_work.inner_provider_token(),
                context,
                previous_inner_value,
                next_inner_value,
                propagation_lanes,
                ContextProviderUpdateDependencyPath::from_begin_work(begin_work),
            ),
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            host_root_work_in_progress
        );
        assert_eq!(record.outer_provider(), outer_provider);
        assert_eq!(record.inner_provider(), inner_provider);
        assert_eq!(record.context(), context);
        assert_eq!(record.previous_value(), previous_inner_value);
        assert_eq!(record.next_value(), next_inner_value);
        assert_eq!(record.propagation_lanes(), propagation_lanes);

        let pushes = record.provider_stack_pushes();
        assert_eq!(pushes[0].provider(), outer_provider);
        assert_eq!(pushes[0].context(), context);
        assert_eq!(pushes[0].pushed_value(), outer_value);
        assert_eq!(
            pushes[0].provider_token(),
            begin_work.outer_provider_token()
        );
        assert_eq!(pushes[0].pushed_stack_depth(), 1);
        assert_eq!(pushes[0].restored_stack_depth(), 0);
        assert_eq!(pushes[1].provider(), inner_provider);
        assert_eq!(pushes[1].context(), context);
        assert_eq!(pushes[1].pushed_value(), previous_inner_value);
        assert_eq!(
            pushes[1].provider_token(),
            begin_work.inner_provider_token()
        );
        assert_eq!(pushes[1].pushed_stack_depth(), 2);
        assert_eq!(pushes[1].restored_stack_depth(), 1);
        assert!(pushes[0].provider_token().is_some());
        assert!(pushes[1].provider_token().is_some());
        assert_ne!(pushes[0].provider_token(), pushes[1].provider_token());
        let pops = record.provider_stack_pops();
        assert_eq!(pops[0].provider(), inner_provider);
        assert_eq!(pops[1].provider(), outer_provider);

        assert_eq!(registry.calls().len(), 2);
        assert_eq!(registry.calls()[0].fiber(), first_function_component);
        assert_eq!(registry.calls()[1].fiber(), second_function_component);
        assert_eq!(
            registry.calls()[0].context_state().unwrap().stack_depth(),
            2
        );
        assert_eq!(
            registry.calls()[1].context_state().unwrap().stack_depth(),
            2
        );
        assert_eq!(
            registry.reads(),
            &[
                begin_work.first_child_context_read(),
                begin_work.second_child_context_read()
            ]
        );
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(context_store.active_provider_count(context).unwrap(), 0);

        let consumers = record.dependent_consumers();
        assert_eq!(
            consumers[0].order(),
            ContextProviderUpdateConsumerOrder::First
        );
        assert_eq!(consumers[0].consumer(), first_function_component);
        assert_eq!(
            consumers[0].dependency(),
            begin_work.first_child_context_dependency()
        );
        assert_eq!(
            consumers[1].order(),
            ContextProviderUpdateConsumerOrder::Second
        );
        assert_eq!(consumers[1].consumer(), second_function_component);
        assert_eq!(
            consumers[1].dependency(),
            begin_work.second_child_context_dependency()
        );
        for consumer in consumers {
            assert_eq!(consumer.context(), context);
            assert_eq!(consumer.memoized_value(), previous_inner_value);
            assert_eq!(consumer.previous_value(), previous_inner_value);
            assert_eq!(consumer.next_value(), next_inner_value);
            assert_eq!(consumer.propagation_lanes(), propagation_lanes);
            assert_eq!(consumer.previous_dependency_lanes(), Lanes::NO);
            assert_eq!(consumer.dependency_lanes(), propagation_lanes);
            assert!(consumer.fiber_lanes_after().contains_all(propagation_lanes));
            assert_eq!(consumer.scanned_dependency_count(), 1);
            assert_eq!(consumer.root(), root_id);
            assert_eq!(
                context_store
                    .context_dependency(consumer.dependency())
                    .unwrap()
                    .dependency_lanes(),
                propagation_lanes
            );
        }

        assert!(
            record
                .host_root_child_lanes_after()
                .contains_all(propagation_lanes)
        );
        assert!(
            record
                .outer_provider_child_lanes_after()
                .contains_all(propagation_lanes)
        );
        assert!(
            record
                .inner_provider_child_lanes_after()
                .contains_all(propagation_lanes)
        );
        assert!(
            record
                .root_pending_lanes_after()
                .contains_all(propagation_lanes)
        );

        for consumer in [first_function_component, second_function_component] {
            let node = store.fiber_arena().get(consumer).unwrap();
            assert!(node.lanes().contains_all(propagation_lanes));
            assert_eq!(node.dependencies(), DependenciesHandle::NONE);
            assert!(!node.flags().contains_any(FiberFlags::NEEDS_PROPAGATION));
        }
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn context_provider_update_lane_gate_fails_closed_for_stale_provider_token() {
        let (mut store, root_id, _host) = root_store();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_340),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (
            outer_provider,
            _inner_provider,
            first_function_component,
            first_component,
            second_function_component,
            second_component,
        ) = attach_nested_context_provider_two_consumer_wip_children(
            &mut store,
            host_root_work_in_progress,
        );
        let mut context_store = FunctionComponentContextRenderStore::new();
        let context = context_store.create_context(context_value(1_350));
        let previous_inner_value = context_value(1_352);
        let mut registry = TestUseContextComponentRegistry::new(
            first_component,
            UseContextBehavior::ReadOnce { context },
        );
        registry.register(second_component, UseContextBehavior::ReadOnce { context });
        let begin_work = begin_work_nested_context_provider_two_consumer_use_context_children(
            store.fiber_arena_mut(),
            NestedContextProviderBeginWorkRequest::new(
                outer_provider,
                Lanes::DEFAULT,
                context,
                context_value(1_351),
                context,
                previous_inner_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let propagation_lanes = Lanes::SYNC.merge_lane(Lane::TRANSITION_2);
        let stale_inner_token =
            ContextFrameId::from_raw(begin_work.inner_provider_token().raw() + 1);

        let error = record_context_provider_update_two_consumer_lane_gate(
            &mut store,
            &mut context_store,
            begin_work,
            ContextProviderUpdateTwoConsumerLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                begin_work.outer_provider_token(),
                stale_inner_token,
                context,
                previous_inner_value,
                context_value(1_353),
                propagation_lanes,
                ContextProviderUpdateDependencyPath::from_begin_work(begin_work),
            ),
        )
        .unwrap_err();

        assert_eq!(
            error,
            ContextProviderUpdateLaneGateError::StaleProviderToken {
                provider: begin_work.inner_provider(),
                expected_token: stale_inner_token,
                actual_token: begin_work.inner_provider_token(),
            }
        );
        for consumer in [first_function_component, second_function_component] {
            assert!(
                !store
                    .fiber_arena()
                    .get(consumer)
                    .unwrap()
                    .lanes()
                    .contains_any(propagation_lanes)
            );
        }
        assert!(
            !store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_any(propagation_lanes)
        );
    }

    #[test]
    fn context_provider_update_lane_gate_fails_closed_for_mismatched_dependency_path() {
        let (mut store, root_id, _host) = root_store();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_360),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (
            outer_provider,
            _inner_provider,
            first_function_component,
            first_component,
            second_function_component,
            second_component,
        ) = attach_nested_context_provider_two_consumer_wip_children(
            &mut store,
            host_root_work_in_progress,
        );
        let mut context_store = FunctionComponentContextRenderStore::new();
        let context = context_store.create_context(context_value(1_370));
        let previous_inner_value = context_value(1_372);
        let mut registry = TestUseContextComponentRegistry::new(
            first_component,
            UseContextBehavior::ReadOnce { context },
        );
        registry.register(second_component, UseContextBehavior::ReadOnce { context });
        let begin_work = begin_work_nested_context_provider_two_consumer_use_context_children(
            store.fiber_arena_mut(),
            NestedContextProviderBeginWorkRequest::new(
                outer_provider,
                Lanes::DEFAULT,
                context,
                context_value(1_371),
                context,
                previous_inner_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let propagation_lanes = Lanes::SYNC.merge_lane(Lane::RETRY_1);
        let mismatched_path = ContextProviderUpdateDependencyPath::new(
            begin_work.second_child_context_dependency(),
            begin_work.first_child_context_dependency(),
        );

        let error = record_context_provider_update_two_consumer_lane_gate(
            &mut store,
            &mut context_store,
            begin_work,
            ContextProviderUpdateTwoConsumerLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                begin_work.outer_provider_token(),
                begin_work.inner_provider_token(),
                context,
                previous_inner_value,
                context_value(1_373),
                propagation_lanes,
                mismatched_path,
            ),
        )
        .unwrap_err();

        assert_eq!(
            error,
            ContextProviderUpdateLaneGateError::MismatchedDependencyPath {
                order: ContextProviderUpdateConsumerOrder::First,
                expected_dependency: begin_work.first_child_context_dependency(),
                actual_dependency: begin_work.second_child_context_dependency(),
            }
        );
        for consumer in [first_function_component, second_function_component] {
            assert!(
                !store
                    .fiber_arena()
                    .get(consumer)
                    .unwrap()
                    .lanes()
                    .contains_any(propagation_lanes)
            );
        }
        assert!(
            !store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_any(propagation_lanes)
        );
    }
}
