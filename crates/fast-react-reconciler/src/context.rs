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
    ContextFrameId, ContextHandle, ContextStackSnapshot, ContextValueChange, ContextValueHandle,
    DependenciesHandle, FiberArena, FiberFlags, FiberId, FiberTag, FiberTopologyError, Lanes,
};
use fast_react_host_config::HostTypes;

#[cfg(test)]
use crate::begin_work::ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord;
use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError,
    begin_work::{
        CONTEXT_PROVIDER_SUBTREE_TRAVERSAL_MAX_FIBERS,
        ContextProviderSubtreeUseContextBeginWorkRecord,
        ContextProviderSubtreeUseContextConsumerBeginWorkRecord,
        NestedContextProviderOuterInnerConsumerUseContextBeginWorkRecord,
        NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
        SiblingContextProviderTwoConsumerUseContextBeginWorkRecord,
    },
    function_component::{
        FunctionComponentContextChangePropagationError,
        FunctionComponentContextChangePropagationRecord,
        FunctionComponentContextChangePropagationRequest, FunctionComponentContextDependencyHandle,
        FunctionComponentContextRenderStore, FunctionComponentRenderRecord,
        propagate_context_change_to_function_component_dependencies,
    },
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ContextProviderUpdateConsumerOrder {
    First,
    Second,
}

impl ContextProviderUpdateConsumerOrder {
    #[must_use]
    const fn index(self) -> usize {
        match self {
            Self::First => 0,
            Self::Second => 1,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ContextProviderUpdateShape {
    Nested,
    Sibling,
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
    pub const fn from_outer_inner_begin_work(
        begin_work: NestedContextProviderOuterInnerConsumerUseContextBeginWorkRecord,
    ) -> Self {
        Self {
            first_dependency: begin_work.outer_child_context_dependency(),
            second_dependency: begin_work.inner_child_context_dependency(),
        }
    }

    #[must_use]
    pub const fn from_sibling_begin_work(
        begin_work: SiblingContextProviderTwoConsumerUseContextBeginWorkRecord,
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
pub(crate) struct ContextProviderUpdateProviderChangeRequest {
    provider_snapshot: ContextStackSnapshot,
    provider_token: ContextFrameId,
    context: ContextHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
}

impl ContextProviderUpdateProviderChangeRequest {
    #[must_use]
    pub const fn new(
        provider_snapshot: ContextStackSnapshot,
        provider_token: ContextFrameId,
        context: ContextHandle,
        previous_value: ContextValueHandle,
        next_value: ContextValueHandle,
        propagation_lanes: Lanes,
    ) -> Self {
        Self {
            provider_snapshot,
            provider_token,
            context,
            previous_value,
            next_value,
            propagation_lanes,
        }
    }

    #[must_use]
    pub const fn provider_snapshot(self) -> ContextStackSnapshot {
        self.provider_snapshot
    }

    #[must_use]
    pub const fn provider_token(self) -> ContextFrameId {
        self.provider_token
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
    const fn change(self) -> ContextValueChange {
        ContextValueChange::new(self.context, self.previous_value, self.next_value)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateMultiProviderLaneRequest {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    first_provider: ContextProviderUpdateProviderChangeRequest,
    second_provider: ContextProviderUpdateProviderChangeRequest,
    dependency_path: ContextProviderUpdateDependencyPath,
}

impl ContextProviderUpdateMultiProviderLaneRequest {
    #[must_use]
    pub const fn new(
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        first_provider: ContextProviderUpdateProviderChangeRequest,
        second_provider: ContextProviderUpdateProviderChangeRequest,
        dependency_path: ContextProviderUpdateDependencyPath,
    ) -> Self {
        Self {
            root,
            host_root_work_in_progress,
            first_provider,
            second_provider,
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
    pub const fn first_provider(self) -> ContextProviderUpdateProviderChangeRequest {
        self.first_provider
    }

    #[must_use]
    pub const fn second_provider(self) -> ContextProviderUpdateProviderChangeRequest {
        self.second_provider
    }

    #[must_use]
    pub const fn dependency_path(self) -> ContextProviderUpdateDependencyPath {
        self.dependency_path
    }

    #[must_use]
    const fn provider_for_order(
        self,
        order: ContextProviderUpdateConsumerOrder,
    ) -> ContextProviderUpdateProviderChangeRequest {
        match order {
            ContextProviderUpdateConsumerOrder::First => self.first_provider,
            ContextProviderUpdateConsumerOrder::Second => self.second_provider,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateSubtreeLaneRequest {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    provider_snapshot: ContextStackSnapshot,
    provider_token: ContextFrameId,
    context: ContextHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
}

impl ContextProviderUpdateSubtreeLaneRequest {
    #[must_use]
    pub const fn new(
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        provider_snapshot: ContextStackSnapshot,
        provider_token: ContextFrameId,
        context: ContextHandle,
        previous_value: ContextValueHandle,
        next_value: ContextValueHandle,
        propagation_lanes: Lanes,
    ) -> Self {
        Self {
            root,
            host_root_work_in_progress,
            provider_snapshot,
            provider_token,
            context,
            previous_value,
            next_value,
            propagation_lanes,
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
    pub const fn provider_snapshot(self) -> ContextStackSnapshot {
        self.provider_snapshot
    }

    #[must_use]
    pub const fn provider_token(self) -> ContextFrameId {
        self.provider_token
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
    const fn change(self) -> ContextValueChange {
        ContextValueChange::new(self.context, self.previous_value, self.next_value)
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

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateSingleConsumerLaneRequest {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    provider_snapshot: ContextStackSnapshot,
    provider_token: ContextFrameId,
    context: ContextHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
}

#[cfg(test)]
impl ContextProviderUpdateSingleConsumerLaneRequest {
    #[must_use]
    pub const fn new(
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        provider_snapshot: ContextStackSnapshot,
        provider_token: ContextFrameId,
        context: ContextHandle,
        previous_value: ContextValueHandle,
        next_value: ContextValueHandle,
        propagation_lanes: Lanes,
    ) -> Self {
        Self {
            root,
            host_root_work_in_progress,
            provider_snapshot,
            provider_token,
            context,
            previous_value,
            next_value,
            propagation_lanes,
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
    pub const fn provider_snapshot(self) -> ContextStackSnapshot {
        self.provider_snapshot
    }

    #[must_use]
    pub const fn provider_token(self) -> ContextFrameId {
        self.provider_token
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
    const fn change(self) -> ContextValueChange {
        ContextValueChange::new(self.context, self.previous_value, self.next_value)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateProviderStackRecord {
    provider: FiberId,
    context: ContextHandle,
    pushed_value: ContextValueHandle,
    provider_snapshot: ContextStackSnapshot,
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
    pub const fn provider_snapshot(self) -> ContextStackSnapshot {
        self.provider_snapshot
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
    render_lanes: Lanes,
    propagation_lanes: Lanes,
    previous_dependency_lanes: Lanes,
    dependency_lanes: Lanes,
    fiber_lanes_after: Lanes,
    scanned_dependency_count: usize,
    marked_dependency_count: usize,
    provider_changed: bool,
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
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
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
    pub const fn marked_dependency_count(self) -> usize {
        self.marked_dependency_count
    }

    #[must_use]
    pub const fn provider_changed(self) -> bool {
        self.provider_changed
    }

    #[must_use]
    pub const fn unchanged_provider_bailout(self) -> bool {
        !self.provider_changed && self.marked_dependency_count == 0
    }

    #[must_use]
    pub const fn marked_changed_provider_lanes(self) -> bool {
        self.provider_changed && self.marked_dependency_count == 1
    }

    #[must_use]
    pub fn dependency_lanes_include_propagation(self) -> bool {
        self.dependency_lanes.contains_all(self.propagation_lanes)
    }

    #[must_use]
    pub fn fiber_lanes_include_propagation(self) -> bool {
        self.fiber_lanes_after.contains_all(self.propagation_lanes)
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateProviderChangeRecord {
    provider: FiberId,
    context: ContextHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
    provider_changed: bool,
}

impl ContextProviderUpdateProviderChangeRecord {
    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.provider
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
    pub const fn provider_changed(self) -> bool {
        self.provider_changed
    }

    #[must_use]
    pub const fn unchanged_provider_bailout(self) -> bool {
        !self.provider_changed
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
    pub const fn render_lanes(self) -> Lanes {
        self.begin_work.render_lanes()
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

    #[must_use]
    pub const fn provider_changed(self) -> bool {
        self.previous_value.raw() != self.next_value.raw()
    }

    #[must_use]
    pub const fn unchanged_provider_bailout(self) -> bool {
        !self.provider_changed()
    }

    #[must_use]
    pub const fn marked_dependency_count(self) -> usize {
        self.dependent_consumers[0].marked_dependency_count
            + self.dependent_consumers[1].marked_dependency_count
    }

    #[must_use]
    pub const fn dependent_consumer_count(self) -> usize {
        2
    }

    #[must_use]
    pub fn all_marked_consumers_include_propagation_lanes(self) -> bool {
        self.dependent_consumers.iter().all(|consumer| {
            consumer.marked_changed_provider_lanes()
                && consumer.dependency_lanes_include_propagation()
                && consumer.fiber_lanes_include_propagation()
        })
    }

    #[must_use]
    pub const fn public_context_compatibility_blocked(self) -> bool {
        true
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateNestedInnerProviderLaneRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    outer_provider: FiberId,
    inner_provider: FiberId,
    outer_consumer: FiberId,
    inner_consumer: FiberId,
    context: ContextHandle,
    outer_value: ContextValueHandle,
    previous_inner_value: ContextValueHandle,
    next_inner_value: ContextValueHandle,
    propagation_lanes: Lanes,
    begin_work: NestedContextProviderOuterInnerConsumerUseContextBeginWorkRecord,
    provider_stack_pushes: [ContextProviderUpdateProviderStackRecord; 2],
    preserved_outer_consumer: ContextProviderUpdateConsumerLaneRecord,
    dependent_inner_consumer: ContextProviderUpdateConsumerLaneRecord,
    host_root_child_lanes_after: Lanes,
    outer_provider_child_lanes_after: Lanes,
    inner_provider_child_lanes_after: Lanes,
    root_pending_lanes_after: Lanes,
}

impl ContextProviderUpdateNestedInnerProviderLaneRecord {
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
    pub const fn outer_consumer(self) -> FiberId {
        self.outer_consumer
    }

    #[must_use]
    pub const fn inner_consumer(self) -> FiberId {
        self.inner_consumer
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    pub const fn previous_inner_value(self) -> ContextValueHandle {
        self.previous_inner_value
    }

    #[must_use]
    pub const fn next_inner_value(self) -> ContextValueHandle {
        self.next_inner_value
    }

    #[must_use]
    pub const fn propagation_lanes(self) -> Lanes {
        self.propagation_lanes
    }

    #[must_use]
    pub const fn begin_work(
        self,
    ) -> NestedContextProviderOuterInnerConsumerUseContextBeginWorkRecord {
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
    pub const fn preserved_outer_consumer(self) -> ContextProviderUpdateConsumerLaneRecord {
        self.preserved_outer_consumer
    }

    #[must_use]
    pub const fn dependent_inner_consumer(self) -> ContextProviderUpdateConsumerLaneRecord {
        self.dependent_inner_consumer
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

    #[must_use]
    pub const fn provider_changed(self) -> bool {
        self.previous_inner_value.raw() != self.next_inner_value.raw()
    }

    #[must_use]
    pub const fn marked_dependency_count(self) -> usize {
        self.preserved_outer_consumer.marked_dependency_count
            + self.dependent_inner_consumer.marked_dependency_count
    }

    #[must_use]
    pub fn preserves_outer_provider_value(self) -> bool {
        self.preserved_outer_consumer.context() == self.context
            && self.preserved_outer_consumer.memoized_value() == self.outer_value
            && self.preserved_outer_consumer.previous_value() == self.outer_value
            && self.preserved_outer_consumer.next_value() == self.outer_value
            && self.preserved_outer_consumer.unchanged_provider_bailout()
            && !self
                .preserved_outer_consumer
                .dependency_lanes()
                .contains_any(self.propagation_lanes)
            && !self
                .preserved_outer_consumer
                .fiber_lanes_after()
                .contains_any(self.propagation_lanes)
    }

    #[must_use]
    pub fn inner_subtree_only_consumer_marked(self) -> bool {
        self.preserves_outer_provider_value()
            && self
                .dependent_inner_consumer
                .marked_changed_provider_lanes()
            && self
                .dependent_inner_consumer
                .dependency_lanes_include_propagation()
            && self
                .dependent_inner_consumer
                .fiber_lanes_include_propagation()
    }

    #[must_use]
    pub const fn public_context_compatibility_blocked(self) -> bool {
        true
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateSingleConsumerLaneRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    provider: FiberId,
    consumer: FiberId,
    context: ContextHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
    begin_work: ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord,
    provider_stack_push: ContextProviderUpdateProviderStackRecord,
    dependent_consumer: ContextProviderUpdateConsumerLaneRecord,
    host_root_child_lanes_after: Lanes,
    provider_child_lanes_after: Lanes,
    root_pending_lanes_after: Lanes,
}

#[cfg(test)]
impl ContextProviderUpdateSingleConsumerLaneRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn consumer(self) -> FiberId {
        self.consumer
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
    pub const fn begin_work(self) -> ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub const fn provider_stack_push(self) -> ContextProviderUpdateProviderStackRecord {
        self.provider_stack_push
    }

    #[must_use]
    pub const fn dependent_consumer(self) -> ContextProviderUpdateConsumerLaneRecord {
        self.dependent_consumer
    }

    #[must_use]
    pub const fn host_root_child_lanes_after(self) -> Lanes {
        self.host_root_child_lanes_after
    }

    #[must_use]
    pub const fn provider_child_lanes_after(self) -> Lanes {
        self.provider_child_lanes_after
    }

    #[must_use]
    pub const fn root_pending_lanes_after(self) -> Lanes {
        self.root_pending_lanes_after
    }

    #[must_use]
    pub const fn provider_changed(self) -> bool {
        self.previous_value.raw() != self.next_value.raw()
    }

    #[must_use]
    pub const fn marked_dependency_count(self) -> usize {
        self.dependent_consumer.marked_dependency_count()
    }

    #[must_use]
    pub const fn public_context_compatibility_blocked(self) -> bool {
        true
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateMultiProviderLaneRecord {
    shape: ContextProviderUpdateShape,
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
    provider_changes: [ContextProviderUpdateProviderChangeRecord; 2],
    provider_stack_pushes: [ContextProviderUpdateProviderStackRecord; 2],
    dependent_consumers: [ContextProviderUpdateConsumerLaneRecord; 2],
    host_root_child_lanes_after: Lanes,
    first_provider_child_lanes_after: Lanes,
    second_provider_child_lanes_after: Lanes,
    root_pending_lanes_after: Lanes,
}

impl ContextProviderUpdateMultiProviderLaneRecord {
    #[must_use]
    pub const fn shape(&self) -> ContextProviderUpdateShape {
        self.shape
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn provider_changes(&self) -> [ContextProviderUpdateProviderChangeRecord; 2] {
        self.provider_changes
    }

    #[must_use]
    pub const fn changed_contexts(&self) -> [ContextHandle; 2] {
        [
            self.provider_changes[0].context,
            self.provider_changes[1].context,
        ]
    }

    #[must_use]
    pub const fn provider_stack_pushes(&self) -> [ContextProviderUpdateProviderStackRecord; 2] {
        self.provider_stack_pushes
    }

    #[must_use]
    pub const fn provider_stack_pops(&self) -> [ContextProviderUpdateProviderStackRecord; 2] {
        match self.shape {
            ContextProviderUpdateShape::Nested => {
                [self.provider_stack_pushes[1], self.provider_stack_pushes[0]]
            }
            ContextProviderUpdateShape::Sibling => self.provider_stack_pushes,
        }
    }

    #[must_use]
    pub fn dependent_consumers(&self) -> &[ContextProviderUpdateConsumerLaneRecord; 2] {
        &self.dependent_consumers
    }

    #[must_use]
    pub const fn host_root_child_lanes_after(&self) -> Lanes {
        self.host_root_child_lanes_after
    }

    #[must_use]
    pub const fn first_provider_child_lanes_after(&self) -> Lanes {
        self.first_provider_child_lanes_after
    }

    #[must_use]
    pub const fn second_provider_child_lanes_after(&self) -> Lanes {
        self.second_provider_child_lanes_after
    }

    #[must_use]
    pub const fn root_pending_lanes_after(&self) -> Lanes {
        self.root_pending_lanes_after
    }

    #[must_use]
    pub const fn changed_provider_count(&self) -> usize {
        (if self.provider_changes[0].provider_changed {
            1
        } else {
            0
        }) + (if self.provider_changes[1].provider_changed {
            1
        } else {
            0
        })
    }

    #[must_use]
    pub const fn unchanged_provider_bailout_count(&self) -> usize {
        2 - self.changed_provider_count()
    }

    #[must_use]
    pub const fn marked_dependency_count(&self) -> usize {
        self.dependent_consumers[0].marked_dependency_count
            + self.dependent_consumers[1].marked_dependency_count
    }

    #[must_use]
    pub const fn public_context_compatibility_blocked(&self) -> bool {
        true
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateSubtreeVisitedFiberRecord {
    traversal_index: usize,
    fiber: FiberId,
    tag: FiberTag,
    depth: usize,
}

impl ContextProviderUpdateSubtreeVisitedFiberRecord {
    #[must_use]
    pub const fn traversal_index(self) -> usize {
        self.traversal_index
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn depth(self) -> usize {
        self.depth
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ContextProviderUpdateSubtreeDependencyBlocker {
    MissingPrivateDependency,
    MultiplePrivateDependencies,
    DependencyHandleMismatch,
    DependencyFiberMismatch,
    DependencyContextMismatch,
    DependencyValueMismatch,
    LinkedDependencyUnsupported,
    RendererVisibleDependencyUnsupported,
    PropagationFlagsUnsupported,
    PublicFiberDependenciesUnsupported,
    PublicPropagationFlagUnsupported,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateSubtreeConsumerLaneRecord {
    traversal_index: usize,
    consumer_index: usize,
    depth: usize,
    consumer: FiberId,
    dependency: FunctionComponentContextDependencyHandle,
    context: ContextHandle,
    memoized_value: ContextValueHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    render_lanes: Lanes,
    propagation_lanes: Lanes,
    previous_dependency_lanes: Lanes,
    dependency_lanes: Lanes,
    fiber_lanes_after: Lanes,
    scanned_dependency_count: usize,
    root: FiberRootId,
}

impl ContextProviderUpdateSubtreeConsumerLaneRecord {
    #[must_use]
    pub const fn traversal_index(self) -> usize {
        self.traversal_index
    }

    #[must_use]
    pub const fn consumer_index(self) -> usize {
        self.consumer_index
    }

    #[must_use]
    pub const fn depth(self) -> usize {
        self.depth
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
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct ContextProviderUpdateSubtreeLaneRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    provider: FiberId,
    context: ContextHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
    provider_stack_push: ContextProviderUpdateProviderStackRecord,
    visited_fibers: Vec<ContextProviderUpdateSubtreeVisitedFiberRecord>,
    dependent_consumers: Vec<ContextProviderUpdateSubtreeConsumerLaneRecord>,
    host_root_child_lanes_after: Lanes,
    provider_child_lanes_after: Lanes,
    root_pending_lanes_after: Lanes,
}

impl ContextProviderUpdateSubtreeLaneRecord {
    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub const fn provider(&self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn context(&self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn previous_value(&self) -> ContextValueHandle {
        self.previous_value
    }

    #[must_use]
    pub const fn next_value(&self) -> ContextValueHandle {
        self.next_value
    }

    #[must_use]
    pub const fn propagation_lanes(&self) -> Lanes {
        self.propagation_lanes
    }

    #[must_use]
    pub const fn provider_stack_push(&self) -> ContextProviderUpdateProviderStackRecord {
        self.provider_stack_push
    }

    #[must_use]
    pub fn visited_fibers(&self) -> &[ContextProviderUpdateSubtreeVisitedFiberRecord] {
        &self.visited_fibers
    }

    #[must_use]
    pub fn dependent_consumers(&self) -> &[ContextProviderUpdateSubtreeConsumerLaneRecord] {
        &self.dependent_consumers
    }

    #[must_use]
    pub const fn host_root_child_lanes_after(&self) -> Lanes {
        self.host_root_child_lanes_after
    }

    #[must_use]
    pub const fn provider_child_lanes_after(&self) -> Lanes {
        self.provider_child_lanes_after
    }

    #[must_use]
    pub const fn root_pending_lanes_after(&self) -> Lanes {
        self.root_pending_lanes_after
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum ContextProviderUpdateLaneGateError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    Propagation(FunctionComponentContextChangePropagationError),
    EmptyPropagationLanes {
        context: ContextHandle,
    },
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
    StaleProviderSnapshot {
        provider: FiberId,
        expected_snapshot: ContextStackSnapshot,
        actual_snapshot: ContextStackSnapshot,
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
    MissingSubtreeConsumers {
        provider: FiberId,
    },
    SubtreeTraversalLimitExceeded {
        provider: FiberId,
        max_fibers: usize,
        next_fiber: FiberId,
    },
    UnsupportedSubtreeFiberTag {
        provider: FiberId,
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingSubtreeRender {
        provider: FiberId,
        consumer: FiberId,
    },
    UnsupportedSubtreeDependencyRecord {
        consumer: FiberId,
        dependency: FunctionComponentContextDependencyHandle,
        blocker: ContextProviderUpdateSubtreeDependencyBlocker,
    },
    MissingSubtreeMarkedDependency {
        consumer: FiberId,
        expected_dependency: FunctionComponentContextDependencyHandle,
    },
    UnexpectedSubtreeMarkedDependencyCount {
        consumer: FiberId,
        expected_dependency: FunctionComponentContextDependencyHandle,
        marked_dependency_count: usize,
    },
    UnexpectedSubtreeMarkedDependency {
        consumer: FiberId,
        expected_dependency: FunctionComponentContextDependencyHandle,
        actual_dependency: FunctionComponentContextDependencyHandle,
        actual_fiber: FiberId,
    },
}

impl Display for ContextProviderUpdateLaneGateError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::Propagation(error) => Display::fmt(error, formatter),
            Self::EmptyPropagationLanes { context } => write!(
                formatter,
                "context {} provider update cannot propagate empty lanes",
                context.raw()
            ),
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
            Self::StaleProviderSnapshot {
                provider,
                expected_snapshot,
                actual_snapshot,
            } => write!(
                formatter,
                "provider {} update snapshot is stale; expected depth {} top {}, active begin-work depth {} top {}",
                provider.slot().get(),
                expected_snapshot.depth(),
                expected_snapshot.top_frame().raw(),
                actual_snapshot.depth(),
                actual_snapshot.top_frame().raw()
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
            Self::MissingSubtreeConsumers { provider } => write!(
                formatter,
                "provider {} subtree traversal found no private context consumers",
                provider.slot().get()
            ),
            Self::SubtreeTraversalLimitExceeded {
                provider,
                max_fibers,
                next_fiber,
            } => write!(
                formatter,
                "provider {} subtree traversal exceeded {} fibers before visiting {}",
                provider.slot().get(),
                max_fibers,
                next_fiber.slot().get()
            ),
            Self::UnsupportedSubtreeFiberTag {
                provider,
                fiber,
                tag,
            } => write!(
                formatter,
                "provider {} subtree traversal reached unsupported fiber {} with tag {:?}",
                provider.slot().get(),
                fiber.slot().get(),
                tag
            ),
            Self::MissingSubtreeRender { provider, consumer } => write!(
                formatter,
                "provider {} subtree traversal found consumer {} without matching begin-work render",
                provider.slot().get(),
                consumer.slot().get()
            ),
            Self::UnsupportedSubtreeDependencyRecord {
                consumer,
                dependency,
                blocker,
            } => write!(
                formatter,
                "provider subtree consumer {} dependency {} is unsupported for private traversal: {:?}",
                consumer.slot().get(),
                dependency.raw(),
                blocker
            ),
            Self::MissingSubtreeMarkedDependency {
                consumer,
                expected_dependency,
            } => write!(
                formatter,
                "provider subtree consumer {} did not mark expected dependency {}",
                consumer.slot().get(),
                expected_dependency.raw()
            ),
            Self::UnexpectedSubtreeMarkedDependencyCount {
                consumer,
                expected_dependency,
                marked_dependency_count,
            } => write!(
                formatter,
                "provider subtree consumer {} expected exactly one mark for dependency {}, found {}",
                consumer.slot().get(),
                expected_dependency.raw(),
                marked_dependency_count
            ),
            Self::UnexpectedSubtreeMarkedDependency {
                consumer,
                expected_dependency,
                actual_dependency,
                actual_fiber,
            } => write!(
                formatter,
                "provider subtree consumer {} expected dependency {}, found dependency {} on fiber {}",
                consumer.slot().get(),
                expected_dependency.raw(),
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
            Self::EmptyPropagationLanes { .. }
            | Self::UnchangedProviderValue { .. }
            | Self::ProviderValuePathMismatch { .. }
            | Self::StaleProviderToken { .. }
            | Self::StaleProviderSnapshot { .. }
            | Self::MismatchedDependencyPath { .. }
            | Self::MissingDependency { .. }
            | Self::DependencyRecordMismatch { .. }
            | Self::MissingMarkedDependency { .. }
            | Self::UnexpectedMarkedDependencyCount { .. }
            | Self::UnexpectedMarkedDependency { .. }
            | Self::MissingSubtreeConsumers { .. }
            | Self::SubtreeTraversalLimitExceeded { .. }
            | Self::UnsupportedSubtreeFiberTag { .. }
            | Self::MissingSubtreeRender { .. }
            | Self::UnsupportedSubtreeDependencyRecord { .. }
            | Self::MissingSubtreeMarkedDependency { .. }
            | Self::UnexpectedSubtreeMarkedDependencyCount { .. }
            | Self::UnexpectedSubtreeMarkedDependency { .. } => None,
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

pub(crate) fn record_context_provider_update_subtree_lane_gate<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: ContextProviderSubtreeUseContextBeginWorkRecord,
    request: ContextProviderUpdateSubtreeLaneRequest,
) -> Result<ContextProviderUpdateSubtreeLaneRecord, ContextProviderUpdateLaneGateError> {
    validate_context_provider_update_subtree_request(store, context_store, &begin_work, request)?;
    let traversal = collect_context_provider_update_subtree_consumers(
        store.fiber_arena(),
        begin_work.provider(),
    )?;

    let propagation_request = FunctionComponentContextChangePropagationRequest::new(
        request.change(),
        request.propagation_lanes(),
    );
    let mut dependent_consumers = Vec::with_capacity(traversal.consumers.len());
    for (consumer_index, consumer) in traversal.consumers.iter().copied().enumerate() {
        let begin_work_consumer = subtree_begin_work_consumer_for_fiber(&begin_work, consumer)
            .ok_or(ContextProviderUpdateLaneGateError::MissingSubtreeRender {
                provider: begin_work.provider(),
                consumer,
            })?;
        let propagation = propagate_context_change_to_function_component_dependencies(
            store,
            context_store,
            begin_work_consumer.child_render(),
            propagation_request,
        )?;
        dependent_consumers.push(subtree_consumer_lane_record_from_propagation(
            store,
            consumer_index,
            begin_work_consumer.traversal_index(),
            begin_work_consumer.depth(),
            &propagation,
            consumer,
            begin_work_consumer.child_context_dependency(),
        )?);
    }

    let host_root_child_lanes_after = store
        .fiber_arena()
        .get(request.host_root_work_in_progress())?
        .child_lanes();
    let provider_child_lanes_after = store
        .fiber_arena()
        .get(begin_work.provider())?
        .child_lanes();
    let root_pending_lanes_after = store.root(request.root())?.lanes().pending_lanes();

    Ok(ContextProviderUpdateSubtreeLaneRecord {
        root: request.root(),
        host_root_work_in_progress: request.host_root_work_in_progress(),
        provider: begin_work.provider(),
        context: request.context(),
        previous_value: request.previous_value(),
        next_value: request.next_value(),
        propagation_lanes: request.propagation_lanes(),
        provider_stack_push: ContextProviderUpdateProviderStackRecord {
            provider: begin_work.provider(),
            context: begin_work.context(),
            pushed_value: begin_work.value(),
            provider_snapshot: begin_work.provider_snapshot(),
            provider_token: begin_work.provider_token(),
            pushed_stack_depth: begin_work.pushed_stack_depth(),
            restored_stack_depth: begin_work.restored_stack_depth(),
        },
        visited_fibers: traversal.visited_fibers,
        dependent_consumers,
        host_root_child_lanes_after,
        provider_child_lanes_after,
        root_pending_lanes_after,
    })
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct ContextProviderUpdateSubtreeTraversal {
    visited_fibers: Vec<ContextProviderUpdateSubtreeVisitedFiberRecord>,
    consumers: Vec<FiberId>,
}

fn collect_context_provider_update_subtree_consumers(
    arena: &FiberArena,
    provider: FiberId,
) -> Result<ContextProviderUpdateSubtreeTraversal, ContextProviderUpdateLaneGateError> {
    let mut visited_fibers = Vec::new();
    let mut consumers = Vec::new();
    let mut pending = arena
        .child_ids(provider)?
        .into_iter()
        .rev()
        .map(|fiber| (fiber, 1))
        .collect::<Vec<_>>();

    while let Some((fiber, depth)) = pending.pop() {
        let traversal_index = visited_fibers.len();
        if traversal_index >= CONTEXT_PROVIDER_SUBTREE_TRAVERSAL_MAX_FIBERS {
            return Err(
                ContextProviderUpdateLaneGateError::SubtreeTraversalLimitExceeded {
                    provider,
                    max_fibers: CONTEXT_PROVIDER_SUBTREE_TRAVERSAL_MAX_FIBERS,
                    next_fiber: fiber,
                },
            );
        }

        let tag = arena.get(fiber)?.tag();
        visited_fibers.push(ContextProviderUpdateSubtreeVisitedFiberRecord {
            traversal_index,
            fiber,
            tag,
            depth,
        });

        match tag {
            FiberTag::FunctionComponent => consumers.push(fiber),
            FiberTag::Fragment | FiberTag::Mode | FiberTag::HostComponent => {
                for child in arena.child_ids(fiber)?.into_iter().rev() {
                    pending.push((child, depth + 1));
                }
            }
            FiberTag::HostText => {}
            _ => {
                return Err(
                    ContextProviderUpdateLaneGateError::UnsupportedSubtreeFiberTag {
                        provider,
                        fiber,
                        tag,
                    },
                );
            }
        }
    }

    if consumers.is_empty() {
        return Err(ContextProviderUpdateLaneGateError::MissingSubtreeConsumers { provider });
    }

    Ok(ContextProviderUpdateSubtreeTraversal {
        visited_fibers,
        consumers,
    })
}

fn validate_context_provider_update_subtree_request<H: HostTypes>(
    store: &FiberRootStore<H>,
    context_store: &FunctionComponentContextRenderStore,
    begin_work: &ContextProviderSubtreeUseContextBeginWorkRecord,
    request: ContextProviderUpdateSubtreeLaneRequest,
) -> Result<(), ContextProviderUpdateLaneGateError> {
    if !request.change().is_changed() {
        return Err(ContextProviderUpdateLaneGateError::UnchangedProviderValue {
            context: request.context(),
            previous_value: request.previous_value(),
            next_value: request.next_value(),
        });
    }

    if request.context() != begin_work.context() || request.previous_value() != begin_work.value() {
        return Err(
            ContextProviderUpdateLaneGateError::ProviderValuePathMismatch {
                expected_context: begin_work.context(),
                actual_context: request.context(),
                expected_previous_value: begin_work.value(),
                actual_previous_value: request.previous_value(),
            },
        );
    }

    if request.provider_token() != begin_work.provider_token() {
        return Err(ContextProviderUpdateLaneGateError::StaleProviderToken {
            provider: begin_work.provider(),
            expected_token: request.provider_token(),
            actual_token: begin_work.provider_token(),
        });
    }

    if request.provider_snapshot() != begin_work.provider_snapshot() {
        return Err(ContextProviderUpdateLaneGateError::StaleProviderSnapshot {
            provider: begin_work.provider(),
            expected_snapshot: request.provider_snapshot(),
            actual_snapshot: begin_work.provider_snapshot(),
        });
    }

    let traversal = collect_context_provider_update_subtree_consumers(
        store.fiber_arena(),
        begin_work.provider(),
    )?;
    for consumer in traversal.consumers {
        let begin_work_consumer = subtree_begin_work_consumer_for_fiber(begin_work, consumer)
            .ok_or(ContextProviderUpdateLaneGateError::MissingSubtreeRender {
                provider: begin_work.provider(),
                consumer,
            })?;
        validate_subtree_consumer_dependency_record(
            store,
            context_store,
            begin_work_consumer,
            request,
        )?;
    }

    Ok(())
}

fn subtree_begin_work_consumer_for_fiber(
    begin_work: &ContextProviderSubtreeUseContextBeginWorkRecord,
    fiber: FiberId,
) -> Option<ContextProviderSubtreeUseContextConsumerBeginWorkRecord> {
    begin_work
        .consumers()
        .iter()
        .copied()
        .find(|consumer| consumer.fiber() == fiber)
}

fn validate_subtree_consumer_dependency_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    context_store: &FunctionComponentContextRenderStore,
    consumer: ContextProviderSubtreeUseContextConsumerBeginWorkRecord,
    request: ContextProviderUpdateSubtreeLaneRequest,
) -> Result<(), ContextProviderUpdateLaneGateError> {
    let fiber_node = store.fiber_arena().get(consumer.fiber())?;
    if fiber_node.tag() != FiberTag::FunctionComponent {
        return Err(
            ContextProviderUpdateLaneGateError::UnsupportedSubtreeFiberTag {
                provider: consumer.fiber(),
                fiber: consumer.fiber(),
                tag: fiber_node.tag(),
            },
        );
    }
    if fiber_node.dependencies() != DependenciesHandle::NONE {
        return Err(
            ContextProviderUpdateLaneGateError::UnsupportedSubtreeDependencyRecord {
                consumer: consumer.fiber(),
                dependency: consumer.child_context_dependency(),
                blocker: ContextProviderUpdateSubtreeDependencyBlocker::PublicFiberDependenciesUnsupported,
            },
        );
    }
    if fiber_node
        .flags()
        .contains_any(FiberFlags::NEEDS_PROPAGATION)
    {
        return Err(
            ContextProviderUpdateLaneGateError::UnsupportedSubtreeDependencyRecord {
                consumer: consumer.fiber(),
                dependency: consumer.child_context_dependency(),
                blocker:
                    ContextProviderUpdateSubtreeDependencyBlocker::PublicPropagationFlagUnsupported,
            },
        );
    }

    let dependencies = context_store.context_dependencies_for_record(consumer.child_render());
    let dependency = match dependencies {
        [] => {
            return Err(
                ContextProviderUpdateLaneGateError::UnsupportedSubtreeDependencyRecord {
                    consumer: consumer.fiber(),
                    dependency: consumer.child_context_dependency(),
                    blocker:
                        ContextProviderUpdateSubtreeDependencyBlocker::MissingPrivateDependency,
                },
            );
        }
        [dependency] => *dependency,
        _ => {
            return Err(
                ContextProviderUpdateLaneGateError::UnsupportedSubtreeDependencyRecord {
                    consumer: consumer.fiber(),
                    dependency: consumer.child_context_dependency(),
                    blocker:
                        ContextProviderUpdateSubtreeDependencyBlocker::MultiplePrivateDependencies,
                },
            );
        }
    };

    if dependency.handle() != consumer.child_context_dependency() {
        return Err(
            ContextProviderUpdateLaneGateError::UnsupportedSubtreeDependencyRecord {
                consumer: consumer.fiber(),
                dependency: dependency.handle(),
                blocker: ContextProviderUpdateSubtreeDependencyBlocker::DependencyHandleMismatch,
            },
        );
    }
    if dependency.fiber() != consumer.fiber() {
        return Err(
            ContextProviderUpdateLaneGateError::UnsupportedSubtreeDependencyRecord {
                consumer: consumer.fiber(),
                dependency: dependency.handle(),
                blocker: ContextProviderUpdateSubtreeDependencyBlocker::DependencyFiberMismatch,
            },
        );
    }
    if dependency.context() != request.context() {
        return Err(
            ContextProviderUpdateLaneGateError::UnsupportedSubtreeDependencyRecord {
                consumer: consumer.fiber(),
                dependency: dependency.handle(),
                blocker: ContextProviderUpdateSubtreeDependencyBlocker::DependencyContextMismatch,
            },
        );
    }
    if dependency.memoized_value() != request.previous_value() {
        return Err(
            ContextProviderUpdateLaneGateError::UnsupportedSubtreeDependencyRecord {
                consumer: consumer.fiber(),
                dependency: dependency.handle(),
                blocker: ContextProviderUpdateSubtreeDependencyBlocker::DependencyValueMismatch,
            },
        );
    }
    if dependency.has_next() {
        return Err(
            ContextProviderUpdateLaneGateError::UnsupportedSubtreeDependencyRecord {
                consumer: consumer.fiber(),
                dependency: dependency.handle(),
                blocker: ContextProviderUpdateSubtreeDependencyBlocker::LinkedDependencyUnsupported,
            },
        );
    }
    if dependency.renderer_visible_propagation() {
        return Err(
            ContextProviderUpdateLaneGateError::UnsupportedSubtreeDependencyRecord {
                consumer: consumer.fiber(),
                dependency: dependency.handle(),
                blocker: ContextProviderUpdateSubtreeDependencyBlocker::RendererVisibleDependencyUnsupported,
            },
        );
    }
    if dependency.propagation_flags() != FiberFlags::NO {
        return Err(
            ContextProviderUpdateLaneGateError::UnsupportedSubtreeDependencyRecord {
                consumer: consumer.fiber(),
                dependency: dependency.handle(),
                blocker: ContextProviderUpdateSubtreeDependencyBlocker::PropagationFlagsUnsupported,
            },
        );
    }

    Ok(())
}

#[cfg(test)]
pub(crate) fn record_context_provider_update_single_consumer_lane_gate<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord,
    request: ContextProviderUpdateSingleConsumerLaneRequest,
) -> Result<ContextProviderUpdateSingleConsumerLaneRecord, ContextProviderUpdateLaneGateError> {
    validate_single_consumer_provider_update_request(context_store, begin_work, request)?;

    let dependent_consumer = consumer_lane_record_from_provider_decision(
        store,
        context_store,
        ContextProviderUpdateConsumerOrder::First,
        begin_work.child_render(),
        request.change(),
        request.propagation_lanes(),
        request.root(),
        begin_work.child(),
        begin_work.child_context_dependency(),
    )?;

    let host_root_child_lanes_after = store
        .fiber_arena()
        .get(request.host_root_work_in_progress())?
        .child_lanes();
    let provider_child_lanes_after = store
        .fiber_arena()
        .get(begin_work.provider())?
        .child_lanes();
    let root_pending_lanes_after = store.root(request.root())?.lanes().pending_lanes();

    Ok(ContextProviderUpdateSingleConsumerLaneRecord {
        root: request.root(),
        host_root_work_in_progress: request.host_root_work_in_progress(),
        provider: begin_work.provider(),
        consumer: begin_work.child(),
        context: request.context(),
        previous_value: request.previous_value(),
        next_value: request.next_value(),
        propagation_lanes: request.propagation_lanes(),
        begin_work,
        provider_stack_push: ContextProviderUpdateProviderStackRecord {
            provider: begin_work.provider(),
            context: begin_work.context(),
            pushed_value: begin_work.value(),
            provider_snapshot: begin_work.provider_snapshot(),
            provider_token: begin_work.provider_token(),
            pushed_stack_depth: begin_work.pushed_stack_depth(),
            restored_stack_depth: 0,
        },
        dependent_consumer,
        host_root_child_lanes_after,
        provider_child_lanes_after,
        root_pending_lanes_after,
    })
}

#[cfg(test)]
fn validate_single_consumer_provider_update_request(
    context_store: &FunctionComponentContextRenderStore,
    begin_work: ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord,
    request: ContextProviderUpdateSingleConsumerLaneRequest,
) -> Result<(), ContextProviderUpdateLaneGateError> {
    if request.propagation_lanes().is_empty() {
        return Err(ContextProviderUpdateLaneGateError::EmptyPropagationLanes {
            context: request.context(),
        });
    }

    if request.context() != begin_work.context() || request.previous_value() != begin_work.value() {
        return Err(
            ContextProviderUpdateLaneGateError::ProviderValuePathMismatch {
                expected_context: begin_work.context(),
                actual_context: request.context(),
                expected_previous_value: begin_work.value(),
                actual_previous_value: request.previous_value(),
            },
        );
    }

    if request.provider_token() != begin_work.provider_token() {
        return Err(ContextProviderUpdateLaneGateError::StaleProviderToken {
            provider: begin_work.provider(),
            expected_token: request.provider_token(),
            actual_token: begin_work.provider_token(),
        });
    }

    if request.provider_snapshot() != begin_work.provider_snapshot() {
        return Err(ContextProviderUpdateLaneGateError::StaleProviderSnapshot {
            provider: begin_work.provider(),
            expected_snapshot: request.provider_snapshot(),
            actual_snapshot: begin_work.provider_snapshot(),
        });
    }

    validate_dependency_path(
        context_store,
        ContextProviderUpdateConsumerOrder::First,
        begin_work.child(),
        begin_work.context(),
        begin_work.value(),
        begin_work.child_context_dependency(),
        begin_work.child_context_dependency(),
    )
}

pub(crate) fn record_context_provider_update_two_consumer_lane_gate<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    request: ContextProviderUpdateTwoConsumerLaneRequest,
) -> Result<ContextProviderUpdateTwoConsumerLaneRecord, ContextProviderUpdateLaneGateError> {
    validate_provider_update_request(context_store, begin_work, request)?;

    let first_consumer = consumer_lane_record_from_provider_decision(
        store,
        context_store,
        ContextProviderUpdateConsumerOrder::First,
        begin_work.first_child_render(),
        request.change(),
        request.propagation_lanes(),
        request.root(),
        begin_work.first_child(),
        begin_work.first_child_context_dependency(),
    )?;

    let second_consumer = consumer_lane_record_from_provider_decision(
        store,
        context_store,
        ContextProviderUpdateConsumerOrder::Second,
        begin_work.second_child_render(),
        request.change(),
        request.propagation_lanes(),
        request.root(),
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
                provider_snapshot: begin_work.outer_provider_snapshot(),
                provider_token: begin_work.outer_provider_token(),
                pushed_stack_depth: begin_work.outer_pushed_stack_depth(),
                restored_stack_depth: begin_work.outer_restored_stack_depth(),
            },
            ContextProviderUpdateProviderStackRecord {
                provider: begin_work.inner_provider(),
                context: begin_work.inner_context(),
                pushed_value: begin_work.inner_value(),
                provider_snapshot: begin_work.inner_provider_snapshot(),
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

pub(crate) fn record_context_provider_update_nested_inner_provider_lane_gate<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: NestedContextProviderOuterInnerConsumerUseContextBeginWorkRecord,
    request: ContextProviderUpdateTwoConsumerLaneRequest,
) -> Result<ContextProviderUpdateNestedInnerProviderLaneRecord, ContextProviderUpdateLaneGateError>
{
    validate_nested_inner_provider_update_request(context_store, begin_work, request)?;

    let preserved_outer_consumer = consumer_lane_record_from_unchanged_provider_bailout(
        store,
        context_store,
        ContextProviderUpdateConsumerOrder::First,
        begin_work.outer_child_render(),
        ContextValueChange::new(
            begin_work.outer_context(),
            begin_work.outer_value(),
            begin_work.outer_value(),
        ),
        request.propagation_lanes(),
        request.root(),
        begin_work.outer_child(),
        begin_work.outer_child_context_dependency(),
    )?;

    let dependent_inner_consumer = consumer_lane_record_from_provider_decision(
        store,
        context_store,
        ContextProviderUpdateConsumerOrder::Second,
        begin_work.inner_child_render(),
        request.change(),
        request.propagation_lanes(),
        request.root(),
        begin_work.inner_child(),
        begin_work.inner_child_context_dependency(),
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

    Ok(ContextProviderUpdateNestedInnerProviderLaneRecord {
        root: request.root(),
        host_root_work_in_progress: request.host_root_work_in_progress(),
        outer_provider: begin_work.outer_provider(),
        inner_provider: begin_work.inner_provider(),
        outer_consumer: begin_work.outer_child(),
        inner_consumer: begin_work.inner_child(),
        context: request.context(),
        outer_value: begin_work.outer_value(),
        previous_inner_value: request.previous_value(),
        next_inner_value: request.next_value(),
        propagation_lanes: request.propagation_lanes(),
        begin_work,
        provider_stack_pushes: [
            ContextProviderUpdateProviderStackRecord {
                provider: begin_work.outer_provider(),
                context: begin_work.outer_context(),
                pushed_value: begin_work.outer_value(),
                provider_snapshot: begin_work.outer_provider_snapshot(),
                provider_token: begin_work.outer_provider_token(),
                pushed_stack_depth: begin_work.outer_pushed_stack_depth(),
                restored_stack_depth: begin_work.outer_restored_stack_depth(),
            },
            ContextProviderUpdateProviderStackRecord {
                provider: begin_work.inner_provider(),
                context: begin_work.inner_context(),
                pushed_value: begin_work.inner_value(),
                provider_snapshot: begin_work.inner_provider_snapshot(),
                provider_token: begin_work.inner_provider_token(),
                pushed_stack_depth: begin_work.inner_pushed_stack_depth(),
                restored_stack_depth: begin_work.inner_restored_stack_depth(),
            },
        ],
        preserved_outer_consumer,
        dependent_inner_consumer,
        host_root_child_lanes_after,
        outer_provider_child_lanes_after,
        inner_provider_child_lanes_after,
        root_pending_lanes_after,
    })
}

#[derive(Debug, Clone, Copy)]
struct ContextProviderUpdateMultiProviderBeginWorkParts {
    shape: ContextProviderUpdateShape,
    render_lanes: Lanes,
    providers: [FiberId; 2],
    contexts: [ContextHandle; 2],
    values: [ContextValueHandle; 2],
    snapshots: [ContextStackSnapshot; 2],
    tokens: [ContextFrameId; 2],
    pushed_stack_depths: [usize; 2],
    restored_stack_depths: [usize; 2],
    consumers: [FiberId; 2],
    renders: [FunctionComponentRenderRecord; 2],
    dependencies: [FunctionComponentContextDependencyHandle; 2],
}

impl ContextProviderUpdateMultiProviderBeginWorkParts {
    #[must_use]
    const fn from_nested(
        begin_work: NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    ) -> Self {
        Self {
            shape: ContextProviderUpdateShape::Nested,
            render_lanes: begin_work.render_lanes(),
            providers: [begin_work.outer_provider(), begin_work.inner_provider()],
            contexts: [begin_work.outer_context(), begin_work.inner_context()],
            values: [begin_work.outer_value(), begin_work.inner_value()],
            snapshots: [
                begin_work.outer_provider_snapshot(),
                begin_work.inner_provider_snapshot(),
            ],
            tokens: [
                begin_work.outer_provider_token(),
                begin_work.inner_provider_token(),
            ],
            pushed_stack_depths: [
                begin_work.outer_pushed_stack_depth(),
                begin_work.inner_pushed_stack_depth(),
            ],
            restored_stack_depths: [
                begin_work.outer_restored_stack_depth(),
                begin_work.inner_restored_stack_depth(),
            ],
            consumers: [begin_work.first_child(), begin_work.second_child()],
            renders: [
                begin_work.first_child_render(),
                begin_work.second_child_render(),
            ],
            dependencies: [
                begin_work.first_child_context_dependency(),
                begin_work.second_child_context_dependency(),
            ],
        }
    }

    #[must_use]
    const fn from_sibling(
        begin_work: SiblingContextProviderTwoConsumerUseContextBeginWorkRecord,
    ) -> Self {
        Self {
            shape: ContextProviderUpdateShape::Sibling,
            render_lanes: begin_work.render_lanes(),
            providers: [begin_work.first_provider(), begin_work.second_provider()],
            contexts: [begin_work.first_context(), begin_work.second_context()],
            values: [begin_work.first_value(), begin_work.second_value()],
            snapshots: [
                begin_work.first_provider_snapshot(),
                begin_work.second_provider_snapshot(),
            ],
            tokens: [
                begin_work.first_provider_token(),
                begin_work.second_provider_token(),
            ],
            pushed_stack_depths: [
                begin_work.first_pushed_stack_depth(),
                begin_work.second_pushed_stack_depth(),
            ],
            restored_stack_depths: [
                begin_work.first_restored_stack_depth(),
                begin_work.second_restored_stack_depth(),
            ],
            consumers: [begin_work.first_child(), begin_work.second_child()],
            renders: [
                begin_work.first_child_render(),
                begin_work.second_child_render(),
            ],
            dependencies: [
                begin_work.first_child_context_dependency(),
                begin_work.second_child_context_dependency(),
            ],
        }
    }
}

pub(crate) fn record_context_provider_update_nested_two_provider_lane_gate<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    request: ContextProviderUpdateMultiProviderLaneRequest,
) -> Result<ContextProviderUpdateMultiProviderLaneRecord, ContextProviderUpdateLaneGateError> {
    record_context_provider_update_multi_provider_lane_gate(
        store,
        context_store,
        ContextProviderUpdateMultiProviderBeginWorkParts::from_nested(begin_work),
        request,
    )
}

pub(crate) fn record_context_provider_update_sibling_two_provider_lane_gate<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: SiblingContextProviderTwoConsumerUseContextBeginWorkRecord,
    request: ContextProviderUpdateMultiProviderLaneRequest,
) -> Result<ContextProviderUpdateMultiProviderLaneRecord, ContextProviderUpdateLaneGateError> {
    record_context_provider_update_multi_provider_lane_gate(
        store,
        context_store,
        ContextProviderUpdateMultiProviderBeginWorkParts::from_sibling(begin_work),
        request,
    )
}

fn record_context_provider_update_multi_provider_lane_gate<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: ContextProviderUpdateMultiProviderBeginWorkParts,
    request: ContextProviderUpdateMultiProviderLaneRequest,
) -> Result<ContextProviderUpdateMultiProviderLaneRecord, ContextProviderUpdateLaneGateError> {
    validate_multi_provider_update_request(context_store, begin_work, request)?;

    let first_request = request.provider_for_order(ContextProviderUpdateConsumerOrder::First);
    let first_consumer = consumer_lane_record_from_provider_decision(
        store,
        context_store,
        ContextProviderUpdateConsumerOrder::First,
        begin_work.renders[0],
        first_request.change(),
        first_request.propagation_lanes(),
        request.root(),
        begin_work.consumers[0],
        begin_work.dependencies[0],
    )?;

    let second_request = request.provider_for_order(ContextProviderUpdateConsumerOrder::Second);
    let second_consumer = consumer_lane_record_from_provider_decision(
        store,
        context_store,
        ContextProviderUpdateConsumerOrder::Second,
        begin_work.renders[1],
        second_request.change(),
        second_request.propagation_lanes(),
        request.root(),
        begin_work.consumers[1],
        begin_work.dependencies[1],
    )?;

    let host_root_child_lanes_after = store
        .fiber_arena()
        .get(request.host_root_work_in_progress())?
        .child_lanes();
    let first_provider_child_lanes_after = store
        .fiber_arena()
        .get(begin_work.providers[0])?
        .child_lanes();
    let second_provider_child_lanes_after = store
        .fiber_arena()
        .get(begin_work.providers[1])?
        .child_lanes();
    let root_pending_lanes_after = store.root(request.root())?.lanes().pending_lanes();

    Ok(ContextProviderUpdateMultiProviderLaneRecord {
        shape: begin_work.shape,
        root: request.root(),
        host_root_work_in_progress: request.host_root_work_in_progress(),
        render_lanes: begin_work.render_lanes,
        provider_changes: [
            ContextProviderUpdateProviderChangeRecord {
                provider: begin_work.providers[0],
                context: first_request.context(),
                previous_value: first_request.previous_value(),
                next_value: first_request.next_value(),
                propagation_lanes: first_request.propagation_lanes(),
                provider_changed: first_request.change().is_changed(),
            },
            ContextProviderUpdateProviderChangeRecord {
                provider: begin_work.providers[1],
                context: second_request.context(),
                previous_value: second_request.previous_value(),
                next_value: second_request.next_value(),
                propagation_lanes: second_request.propagation_lanes(),
                provider_changed: second_request.change().is_changed(),
            },
        ],
        provider_stack_pushes: [
            ContextProviderUpdateProviderStackRecord {
                provider: begin_work.providers[0],
                context: begin_work.contexts[0],
                pushed_value: begin_work.values[0],
                provider_snapshot: begin_work.snapshots[0],
                provider_token: begin_work.tokens[0],
                pushed_stack_depth: begin_work.pushed_stack_depths[0],
                restored_stack_depth: begin_work.restored_stack_depths[0],
            },
            ContextProviderUpdateProviderStackRecord {
                provider: begin_work.providers[1],
                context: begin_work.contexts[1],
                pushed_value: begin_work.values[1],
                provider_snapshot: begin_work.snapshots[1],
                provider_token: begin_work.tokens[1],
                pushed_stack_depth: begin_work.pushed_stack_depths[1],
                restored_stack_depth: begin_work.restored_stack_depths[1],
            },
        ],
        dependent_consumers: [first_consumer, second_consumer],
        host_root_child_lanes_after,
        first_provider_child_lanes_after,
        second_provider_child_lanes_after,
        root_pending_lanes_after,
    })
}

fn validate_multi_provider_update_request(
    context_store: &FunctionComponentContextRenderStore,
    begin_work: ContextProviderUpdateMultiProviderBeginWorkParts,
    request: ContextProviderUpdateMultiProviderLaneRequest,
) -> Result<(), ContextProviderUpdateLaneGateError> {
    for order in [
        ContextProviderUpdateConsumerOrder::First,
        ContextProviderUpdateConsumerOrder::Second,
    ] {
        let index = order.index();
        let provider_request = request.provider_for_order(order);
        if provider_request.propagation_lanes().is_empty() {
            return Err(ContextProviderUpdateLaneGateError::EmptyPropagationLanes {
                context: provider_request.context(),
            });
        }

        if provider_request.context() != begin_work.contexts[index]
            || provider_request.previous_value() != begin_work.values[index]
        {
            return Err(
                ContextProviderUpdateLaneGateError::ProviderValuePathMismatch {
                    expected_context: begin_work.contexts[index],
                    actual_context: provider_request.context(),
                    expected_previous_value: begin_work.values[index],
                    actual_previous_value: provider_request.previous_value(),
                },
            );
        }

        if provider_request.provider_token() != begin_work.tokens[index] {
            return Err(ContextProviderUpdateLaneGateError::StaleProviderToken {
                provider: begin_work.providers[index],
                expected_token: provider_request.provider_token(),
                actual_token: begin_work.tokens[index],
            });
        }

        if provider_request.provider_snapshot() != begin_work.snapshots[index] {
            return Err(ContextProviderUpdateLaneGateError::StaleProviderSnapshot {
                provider: begin_work.providers[index],
                expected_snapshot: provider_request.provider_snapshot(),
                actual_snapshot: begin_work.snapshots[index],
            });
        }
    }

    validate_dependency_path(
        context_store,
        ContextProviderUpdateConsumerOrder::First,
        begin_work.consumers[0],
        begin_work.contexts[0],
        begin_work.values[0],
        begin_work.dependencies[0],
        request
            .dependency_path()
            .dependency_for_order(ContextProviderUpdateConsumerOrder::First),
    )?;
    validate_dependency_path(
        context_store,
        ContextProviderUpdateConsumerOrder::Second,
        begin_work.consumers[1],
        begin_work.contexts[1],
        begin_work.values[1],
        begin_work.dependencies[1],
        request
            .dependency_path()
            .dependency_for_order(ContextProviderUpdateConsumerOrder::Second),
    )
}

fn validate_provider_update_request(
    context_store: &FunctionComponentContextRenderStore,
    begin_work: NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    request: ContextProviderUpdateTwoConsumerLaneRequest,
) -> Result<(), ContextProviderUpdateLaneGateError> {
    if request.propagation_lanes().is_empty() {
        return Err(ContextProviderUpdateLaneGateError::EmptyPropagationLanes {
            context: request.context(),
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

fn validate_nested_inner_provider_update_request(
    context_store: &FunctionComponentContextRenderStore,
    begin_work: NestedContextProviderOuterInnerConsumerUseContextBeginWorkRecord,
    request: ContextProviderUpdateTwoConsumerLaneRequest,
) -> Result<(), ContextProviderUpdateLaneGateError> {
    if request.propagation_lanes().is_empty() {
        return Err(ContextProviderUpdateLaneGateError::EmptyPropagationLanes {
            context: request.context(),
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
        begin_work.outer_child(),
        begin_work.outer_context(),
        begin_work.outer_value(),
        begin_work.outer_child_context_dependency(),
        request
            .dependency_path()
            .dependency_for_order(ContextProviderUpdateConsumerOrder::First),
    )?;
    validate_dependency_path(
        context_store,
        ContextProviderUpdateConsumerOrder::Second,
        begin_work.inner_child(),
        begin_work.inner_context(),
        begin_work.inner_value(),
        begin_work.inner_child_context_dependency(),
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

fn consumer_lane_record_from_provider_decision<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    context_store: &mut FunctionComponentContextRenderStore,
    order: ContextProviderUpdateConsumerOrder,
    render: FunctionComponentRenderRecord,
    change: ContextValueChange,
    propagation_lanes: Lanes,
    root: FiberRootId,
    expected_fiber: FiberId,
    expected_dependency: FunctionComponentContextDependencyHandle,
) -> Result<ContextProviderUpdateConsumerLaneRecord, ContextProviderUpdateLaneGateError> {
    if !change.is_changed() {
        return consumer_lane_record_from_unchanged_provider_bailout(
            store,
            context_store,
            order,
            render,
            change,
            propagation_lanes,
            root,
            expected_fiber,
            expected_dependency,
        );
    }

    let propagation = propagate_context_change_to_function_component_dependencies(
        store,
        context_store,
        render,
        FunctionComponentContextChangePropagationRequest::new(change, propagation_lanes),
    )?;
    consumer_lane_record_from_propagation(
        store,
        order,
        &propagation,
        expected_fiber,
        expected_dependency,
    )
}

fn consumer_lane_record_from_unchanged_provider_bailout<H: HostTypes>(
    store: &FiberRootStore<H>,
    context_store: &FunctionComponentContextRenderStore,
    order: ContextProviderUpdateConsumerOrder,
    render: FunctionComponentRenderRecord,
    change: ContextValueChange,
    propagation_lanes: Lanes,
    root: FiberRootId,
    expected_fiber: FiberId,
    expected_dependency: FunctionComponentContextDependencyHandle,
) -> Result<ContextProviderUpdateConsumerLaneRecord, ContextProviderUpdateLaneGateError> {
    let dependency = context_store
        .context_dependency(expected_dependency)
        .ok_or(ContextProviderUpdateLaneGateError::MissingDependency {
            order,
            dependency: expected_dependency,
        })?;
    if dependency.fiber() != expected_fiber
        || dependency.context() != change.context()
        || dependency.memoized_value() != change.previous_value()
    {
        return Err(
            ContextProviderUpdateLaneGateError::DependencyRecordMismatch {
                order,
                dependency: expected_dependency,
                expected_fiber,
                actual_fiber: dependency.fiber(),
                expected_context: change.context(),
                actual_context: dependency.context(),
                expected_memoized_value: change.previous_value(),
                actual_memoized_value: dependency.memoized_value(),
            },
        );
    }

    let fiber_lanes_after = store.fiber_arena().get(expected_fiber)?.lanes();
    Ok(ContextProviderUpdateConsumerLaneRecord {
        order,
        consumer: dependency.fiber(),
        dependency: dependency.handle(),
        context: dependency.context(),
        memoized_value: dependency.memoized_value(),
        previous_value: change.previous_value(),
        next_value: change.next_value(),
        render_lanes: render.render_lanes(),
        propagation_lanes,
        previous_dependency_lanes: dependency.dependency_lanes(),
        dependency_lanes: dependency.dependency_lanes(),
        fiber_lanes_after,
        scanned_dependency_count: render.context_read_count(),
        marked_dependency_count: 0,
        provider_changed: false,
        root,
    })
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
        render_lanes: propagation.render().render_lanes(),
        propagation_lanes: marked.propagation_lanes(),
        previous_dependency_lanes: marked.previous_dependency_lanes(),
        dependency_lanes: marked.dependency_lanes(),
        fiber_lanes_after,
        scanned_dependency_count: propagation.scanned_dependency_count(),
        marked_dependency_count: propagation.marked_dependency_count(),
        provider_changed: true,
        root: marked.root(),
    })
}

fn subtree_consumer_lane_record_from_propagation<H: HostTypes>(
    store: &FiberRootStore<H>,
    consumer_index: usize,
    traversal_index: usize,
    depth: usize,
    propagation: &FunctionComponentContextChangePropagationRecord,
    expected_fiber: FiberId,
    expected_dependency: FunctionComponentContextDependencyHandle,
) -> Result<ContextProviderUpdateSubtreeConsumerLaneRecord, ContextProviderUpdateLaneGateError> {
    match propagation.marked_dependency_count() {
        0 => {
            return Err(
                ContextProviderUpdateLaneGateError::MissingSubtreeMarkedDependency {
                    consumer: expected_fiber,
                    expected_dependency,
                },
            );
        }
        1 => {}
        marked_dependency_count => {
            return Err(
                ContextProviderUpdateLaneGateError::UnexpectedSubtreeMarkedDependencyCount {
                    consumer: expected_fiber,
                    expected_dependency,
                    marked_dependency_count,
                },
            );
        }
    }

    let marked = propagation.marked_dependencies()[0];
    if marked.dependency() != expected_dependency || marked.fiber() != expected_fiber {
        return Err(
            ContextProviderUpdateLaneGateError::UnexpectedSubtreeMarkedDependency {
                consumer: expected_fiber,
                expected_dependency,
                actual_dependency: marked.dependency(),
                actual_fiber: marked.fiber(),
            },
        );
    }

    let fiber_lanes_after = store.fiber_arena().get(expected_fiber)?.lanes();
    Ok(ContextProviderUpdateSubtreeConsumerLaneRecord {
        traversal_index,
        consumer_index,
        depth,
        consumer: marked.fiber(),
        dependency: marked.dependency(),
        context: marked.context(),
        memoized_value: marked.memoized_value(),
        previous_value: marked.previous_value(),
        next_value: marked.next_value(),
        render_lanes: propagation.render().render_lanes(),
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
        ContextProviderBeginWorkRequest, NestedContextProviderBeginWorkRequest,
        SiblingContextProviderBeginWorkRequest, begin_work_context_provider_use_context_subtree,
        begin_work_nested_context_provider_outer_inner_consumer_use_context_children,
        begin_work_nested_context_provider_two_consumer_use_context_children,
        begin_work_nested_context_provider_two_provider_use_context_children,
        begin_work_sibling_context_provider_two_consumer_use_context_children,
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

    fn attach_nested_context_provider_outer_inner_consumer_wip_children(
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
            PropsHandle::from_raw(1_309),
            FiberMode::NO,
        );
        let inner_provider = store.fiber_arena_mut().create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(1_310),
            FiberMode::NO,
        );
        let outer_current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(1_311),
            FiberMode::NO,
        );
        let outer_component = FiberTypeHandle::from_raw(1_312);
        store
            .fiber_arena_mut()
            .get_mut(outer_current)
            .unwrap()
            .set_fiber_type(outer_component);
        let outer_work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(outer_current, PropsHandle::from_raw(1_313))
            .unwrap();
        let inner_current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(1_314),
            FiberMode::NO,
        );
        let inner_component = FiberTypeHandle::from_raw(1_315);
        store
            .fiber_arena_mut()
            .get_mut(inner_current)
            .unwrap()
            .set_fiber_type(inner_component);
        let inner_work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(inner_current, PropsHandle::from_raw(1_316))
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(inner_provider, &[inner_work_in_progress])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(outer_provider, &[outer_work_in_progress, inner_provider])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[outer_provider])
            .unwrap();

        (
            outer_provider,
            inner_provider,
            outer_work_in_progress,
            outer_component,
            inner_work_in_progress,
            inner_component,
        )
    }

    fn attach_sibling_context_provider_wip_children(
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
        let first_provider = store.fiber_arena_mut().create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(1_309),
            FiberMode::NO,
        );
        let second_provider = store.fiber_arena_mut().create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(1_310),
            FiberMode::NO,
        );
        let first_current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(1_311),
            FiberMode::NO,
        );
        let first_component = FiberTypeHandle::from_raw(1_312);
        store
            .fiber_arena_mut()
            .get_mut(first_current)
            .unwrap()
            .set_fiber_type(first_component);
        let first_work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(first_current, PropsHandle::from_raw(1_313))
            .unwrap();
        let second_current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(1_314),
            FiberMode::NO,
        );
        let second_component = FiberTypeHandle::from_raw(1_315);
        store
            .fiber_arena_mut()
            .get_mut(second_current)
            .unwrap()
            .set_fiber_type(second_component);
        let second_work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(second_current, PropsHandle::from_raw(1_316))
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(first_provider, &[first_work_in_progress])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(second_provider, &[second_work_in_progress])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(
                host_root_work_in_progress,
                &[first_provider, second_provider],
            )
            .unwrap();

        (
            first_provider,
            second_provider,
            first_work_in_progress,
            first_component,
            second_work_in_progress,
            second_component,
        )
    }

    fn create_function_component_wip(
        store: &mut FiberRootStore<RecordingHost>,
        current_props: u64,
        component_raw: u64,
        wip_props: u64,
    ) -> (FiberId, FiberTypeHandle) {
        let current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(current_props),
            FiberMode::NO,
        );
        let component = FiberTypeHandle::from_raw(component_raw);
        store
            .fiber_arena_mut()
            .get_mut(current)
            .unwrap()
            .set_fiber_type(component);
        let work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(current, PropsHandle::from_raw(wip_props))
            .unwrap();

        (work_in_progress, component)
    }

    fn attach_context_provider_broad_subtree_wip_children(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (
        FiberId,
        FiberId,
        FiberTypeHandle,
        FiberId,
        FiberTypeHandle,
        FiberId,
        FiberTypeHandle,
        FiberId,
        FiberId,
    ) {
        let provider = store.fiber_arena_mut().create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(1_317),
            FiberMode::NO,
        );
        let (first_work_in_progress, first_component) =
            create_function_component_wip(store, 1_318, 1_319, 1_320);
        let fragment = store.fiber_arena_mut().create_fiber(
            FiberTag::Fragment,
            None,
            PropsHandle::from_raw(1_321),
            FiberMode::NO,
        );
        let (second_work_in_progress, second_component) =
            create_function_component_wip(store, 1_322, 1_323, 1_324);
        let host_component = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(1_325),
            FiberMode::NO,
        );
        let (third_work_in_progress, third_component) =
            create_function_component_wip(store, 1_326, 1_327, 1_328);

        store
            .fiber_arena_mut()
            .set_children(fragment, &[second_work_in_progress])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_component, &[third_work_in_progress])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(
                provider,
                &[first_work_in_progress, fragment, host_component],
            )
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[provider])
            .unwrap();

        (
            provider,
            first_work_in_progress,
            first_component,
            second_work_in_progress,
            second_component,
            third_work_in_progress,
            third_component,
            fragment,
            host_component,
        )
    }

    fn attach_context_provider_single_consumer_wip_child(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (FiberId, FiberId, FiberTypeHandle) {
        let provider = store.fiber_arena_mut().create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(1_329),
            FiberMode::NO,
        );
        let (consumer, component) = create_function_component_wip(store, 1_330, 1_331, 1_332);
        store
            .fiber_arena_mut()
            .set_children(provider, &[consumer])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[provider])
            .unwrap();

        (provider, consumer, component)
    }

    fn context_value(raw: u64) -> ContextValueHandle {
        ContextValueHandle::from_raw(raw)
    }

    #[test]
    fn context_provider_update_subtree_lane_gate_discovers_consumers_across_child_shapes() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_500),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (
            provider,
            first_function_component,
            first_component,
            second_function_component,
            second_component,
            third_function_component,
            third_component,
            fragment,
            host_component,
        ) = attach_context_provider_broad_subtree_wip_children(
            &mut store,
            host_root_work_in_progress,
        );
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(1_510);
        let previous_value = context_value(1_511);
        let next_value = context_value(1_512);
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            first_component,
            UseContextBehavior::ReadOnce { context },
        );
        registry.register(second_component, UseContextBehavior::ReadOnce { context });
        registry.register(third_component, UseContextBehavior::ReadOnce { context });
        let begin_work = begin_work_context_provider_use_context_subtree(
            store.fiber_arena_mut(),
            ContextProviderBeginWorkRequest::new(provider, Lanes::DEFAULT, context, previous_value),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let propagation_lanes = Lanes::SYNC
            .merge_lane(Lane::TRANSITION_1)
            .merge_lane(Lane::RETRY_2);

        let record = record_context_provider_update_subtree_lane_gate(
            &mut store,
            &mut context_store,
            begin_work.clone(),
            ContextProviderUpdateSubtreeLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                begin_work.provider_snapshot(),
                begin_work.provider_token(),
                context,
                previous_value,
                next_value,
                propagation_lanes,
            ),
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            host_root_work_in_progress
        );
        assert_eq!(record.provider(), provider);
        assert_eq!(record.context(), context);
        assert_eq!(record.previous_value(), previous_value);
        assert_eq!(record.next_value(), next_value);
        assert_eq!(record.propagation_lanes(), propagation_lanes);
        let provider_stack = record.provider_stack_push();
        assert_eq!(provider_stack.provider(), provider);
        assert_eq!(provider_stack.context(), context);
        assert_eq!(provider_stack.pushed_value(), previous_value);
        assert_eq!(
            provider_stack.provider_snapshot(),
            begin_work.provider_snapshot()
        );
        assert_eq!(provider_stack.provider_token(), begin_work.provider_token());
        assert_eq!(provider_stack.pushed_stack_depth(), 1);
        assert_eq!(provider_stack.restored_stack_depth(), 0);
        assert_eq!(
            record
                .visited_fibers()
                .iter()
                .map(|visited| {
                    (
                        visited.traversal_index(),
                        visited.fiber(),
                        visited.tag(),
                        visited.depth(),
                    )
                })
                .collect::<Vec<_>>(),
            vec![
                (0, first_function_component, FiberTag::FunctionComponent, 1),
                (1, fragment, FiberTag::Fragment, 1),
                (2, second_function_component, FiberTag::FunctionComponent, 2),
                (3, host_component, FiberTag::HostComponent, 1),
                (4, third_function_component, FiberTag::FunctionComponent, 2),
            ]
        );

        let consumers = record.dependent_consumers();
        assert_eq!(consumers.len(), 3);
        for (index, (consumer, traversal_index, depth)) in [
            (first_function_component, 0, 1),
            (second_function_component, 2, 2),
            (third_function_component, 4, 2),
        ]
        .into_iter()
        .enumerate()
        {
            assert_eq!(consumers[index].consumer_index(), index);
            assert_eq!(consumers[index].consumer(), consumer);
            assert_eq!(consumers[index].traversal_index(), traversal_index);
            assert_eq!(consumers[index].depth(), depth);
            assert_eq!(consumers[index].context(), context);
            assert_eq!(consumers[index].memoized_value(), previous_value);
            assert_eq!(consumers[index].previous_value(), previous_value);
            assert_eq!(consumers[index].next_value(), next_value);
            assert_eq!(consumers[index].render_lanes(), Lanes::DEFAULT);
            assert_eq!(consumers[index].propagation_lanes(), propagation_lanes);
            assert_eq!(consumers[index].previous_dependency_lanes(), Lanes::NO);
            assert_eq!(consumers[index].dependency_lanes(), propagation_lanes);
            assert!(
                consumers[index]
                    .fiber_lanes_after()
                    .contains_all(propagation_lanes)
            );
            assert_eq!(consumers[index].scanned_dependency_count(), 1);
            assert_eq!(consumers[index].root(), root_id);
            assert_eq!(
                context_store
                    .context_dependency(consumers[index].dependency())
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
                .provider_child_lanes_after()
                .contains_all(propagation_lanes)
        );
        assert!(
            record
                .root_pending_lanes_after()
                .contains_all(propagation_lanes)
        );
        for consumer in [
            first_function_component,
            second_function_component,
            third_function_component,
        ] {
            let node = store.fiber_arena().get(consumer).unwrap();
            assert!(node.lanes().contains_all(propagation_lanes));
            assert_eq!(node.dependencies(), DependenciesHandle::NONE);
            assert!(!node.flags().contains_any(FiberFlags::NEEDS_PROPAGATION));
        }
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn context_provider_update_subtree_lane_gate_fails_closed_for_stale_provider_token() {
        let (mut store, root_id, _host) = root_store();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_530),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (provider, consumer, component) = attach_context_provider_single_consumer_wip_child(
            &mut store,
            host_root_work_in_progress,
        );
        let mut context_store = FunctionComponentContextRenderStore::new();
        let context = context_store.create_context(context_value(1_531));
        let previous_value = context_value(1_532);
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadOnce { context },
        );
        let begin_work = begin_work_context_provider_use_context_subtree(
            store.fiber_arena_mut(),
            ContextProviderBeginWorkRequest::new(provider, Lanes::DEFAULT, context, previous_value),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let propagation_lanes = Lanes::SYNC.merge_lane(Lane::TRANSITION_1);
        let stale_token = ContextFrameId::from_raw(begin_work.provider_token().raw() + 1);

        let error = record_context_provider_update_subtree_lane_gate(
            &mut store,
            &mut context_store,
            begin_work.clone(),
            ContextProviderUpdateSubtreeLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                begin_work.provider_snapshot(),
                stale_token,
                context,
                previous_value,
                context_value(1_533),
                propagation_lanes,
            ),
        )
        .unwrap_err();

        assert_eq!(
            error,
            ContextProviderUpdateLaneGateError::StaleProviderToken {
                provider,
                expected_token: stale_token,
                actual_token: begin_work.provider_token(),
            }
        );
        assert!(
            !store
                .fiber_arena()
                .get(consumer)
                .unwrap()
                .lanes()
                .contains_any(propagation_lanes)
        );
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
    fn context_provider_update_subtree_lane_gate_fails_closed_for_unsupported_boundaries() {
        for tag in [
            FiberTag::Portal,
            FiberTag::Suspense,
            FiberTag::ClassComponent,
            FiberTag::ContextConsumer,
        ] {
            let (mut store, root_id, _host) = root_store();
            update_container(
                &mut store,
                root_id,
                RootElementHandle::from_raw(1_540 + u64::from(tag.react_tag())),
                None,
            )
            .unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let host_root_work_in_progress = render.work_in_progress();
            let (provider, consumer, component) = attach_context_provider_single_consumer_wip_child(
                &mut store,
                host_root_work_in_progress,
            );
            let mut context_store = FunctionComponentContextRenderStore::new();
            let context = context_store.create_context(context_value(1_550));
            let previous_value = context_value(1_551);
            let mut registry = TestUseContextComponentRegistry::new(
                component,
                UseContextBehavior::ReadOnce { context },
            );
            let begin_work = begin_work_context_provider_use_context_subtree(
                store.fiber_arena_mut(),
                ContextProviderBeginWorkRequest::new(
                    provider,
                    Lanes::DEFAULT,
                    context,
                    previous_value,
                ),
                &mut context_store,
                &mut registry,
            )
            .unwrap();
            let unsupported = store.fiber_arena_mut().create_fiber(
                tag,
                None,
                PropsHandle::from_raw(1_552),
                FiberMode::NO,
            );
            store
                .fiber_arena_mut()
                .set_children(provider, &[consumer, unsupported])
                .unwrap();
            let propagation_lanes = Lanes::SYNC.merge_lane(Lane::RETRY_1);

            let error = record_context_provider_update_subtree_lane_gate(
                &mut store,
                &mut context_store,
                begin_work.clone(),
                ContextProviderUpdateSubtreeLaneRequest::new(
                    root_id,
                    host_root_work_in_progress,
                    begin_work.provider_snapshot(),
                    begin_work.provider_token(),
                    context,
                    previous_value,
                    context_value(1_553),
                    propagation_lanes,
                ),
            )
            .unwrap_err();

            assert_eq!(
                error,
                ContextProviderUpdateLaneGateError::UnsupportedSubtreeFiberTag {
                    provider,
                    fiber: unsupported,
                    tag,
                }
            );
            assert!(
                !store
                    .fiber_arena()
                    .get(consumer)
                    .unwrap()
                    .lanes()
                    .contains_any(propagation_lanes)
            );
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

    #[test]
    fn context_provider_update_subtree_lane_gate_fails_closed_for_public_dependency_records() {
        let (mut store, root_id, _host) = root_store();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_560),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (provider, consumer, component) = attach_context_provider_single_consumer_wip_child(
            &mut store,
            host_root_work_in_progress,
        );
        let mut context_store = FunctionComponentContextRenderStore::new();
        let context = context_store.create_context(context_value(1_561));
        let previous_value = context_value(1_562);
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadOnce { context },
        );
        let begin_work = begin_work_context_provider_use_context_subtree(
            store.fiber_arena_mut(),
            ContextProviderBeginWorkRequest::new(provider, Lanes::DEFAULT, context, previous_value),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .get_mut(consumer)
            .unwrap()
            .set_dependencies(DependenciesHandle::from_raw(1_563));
        let propagation_lanes = Lanes::SYNC.merge_lane(Lane::RETRY_2);

        let error = record_context_provider_update_subtree_lane_gate(
            &mut store,
            &mut context_store,
            begin_work.clone(),
            ContextProviderUpdateSubtreeLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                begin_work.provider_snapshot(),
                begin_work.provider_token(),
                context,
                previous_value,
                context_value(1_564),
                propagation_lanes,
            ),
        )
        .unwrap_err();

        assert_eq!(
            error,
            ContextProviderUpdateLaneGateError::UnsupportedSubtreeDependencyRecord {
                consumer,
                dependency: begin_work.consumers()[0].child_context_dependency(),
                blocker:
                    ContextProviderUpdateSubtreeDependencyBlocker::PublicFiberDependenciesUnsupported,
            }
        );
        assert!(
            !store
                .fiber_arena()
                .get(consumer)
                .unwrap()
                .lanes()
                .contains_any(propagation_lanes)
        );
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
            pushes[0].provider_snapshot(),
            begin_work.outer_provider_snapshot()
        );
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
            pushes[1].provider_snapshot(),
            begin_work.inner_provider_snapshot()
        );
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
            assert_eq!(consumer.render_lanes(), Lanes::DEFAULT);
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
    fn nested_context_provider_update_marks_inner_consumer_without_outer_consumer() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
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
            inner_provider,
            outer_function_component,
            outer_component,
            inner_function_component,
            inner_component,
        ) = attach_nested_context_provider_outer_inner_consumer_wip_children(
            &mut store,
            host_root_work_in_progress,
        );
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(1_361);
        let outer_value = context_value(1_362);
        let previous_inner_value = context_value(1_363);
        let next_inner_value = context_value(1_364);
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            outer_component,
            UseContextBehavior::ReadOnce { context },
        );
        registry.register(inner_component, UseContextBehavior::ReadOnce { context });
        let begin_work =
            begin_work_nested_context_provider_outer_inner_consumer_use_context_children(
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
        let propagation_lanes = Lanes::SYNC.merge_lane(Lane::TRANSITION_2);

        let record = record_context_provider_update_nested_inner_provider_lane_gate(
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
                ContextProviderUpdateDependencyPath::from_outer_inner_begin_work(begin_work),
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
        assert_eq!(record.outer_consumer(), outer_function_component);
        assert_eq!(record.inner_consumer(), inner_function_component);
        assert_eq!(record.context(), context);
        assert_eq!(record.outer_value(), outer_value);
        assert_eq!(record.previous_inner_value(), previous_inner_value);
        assert_eq!(record.next_inner_value(), next_inner_value);
        assert_eq!(record.propagation_lanes(), propagation_lanes);
        assert!(record.provider_changed());
        assert_eq!(record.marked_dependency_count(), 1);
        assert!(record.preserves_outer_provider_value());
        assert!(record.inner_subtree_only_consumer_marked());
        assert!(record.public_context_compatibility_blocked());

        let pushes = record.provider_stack_pushes();
        assert_eq!(pushes[0].provider(), outer_provider);
        assert_eq!(pushes[0].context(), context);
        assert_eq!(pushes[0].pushed_value(), outer_value);
        assert_eq!(pushes[0].pushed_stack_depth(), 1);
        assert_eq!(pushes[0].restored_stack_depth(), 0);
        assert_eq!(pushes[1].provider(), inner_provider);
        assert_eq!(pushes[1].context(), context);
        assert_eq!(pushes[1].pushed_value(), previous_inner_value);
        assert_eq!(pushes[1].pushed_stack_depth(), 2);
        assert_eq!(pushes[1].restored_stack_depth(), 1);
        assert_eq!(record.provider_stack_pops(), [pushes[1], pushes[0]]);

        let outer_read = begin_work.outer_child_context_read();
        let inner_read = begin_work.inner_child_context_read();
        assert_eq!(outer_read.context(), context);
        assert_eq!(outer_read.value(), outer_value);
        assert_eq!(outer_read.active_provider_count(), 1);
        assert_eq!(inner_read.context(), context);
        assert_eq!(inner_read.value(), previous_inner_value);
        assert_eq!(inner_read.active_provider_count(), 2);
        assert_eq!(registry.reads(), &[outer_read, inner_read]);
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(context_store.active_provider_count(context).unwrap(), 0);

        let preserved_outer = record.preserved_outer_consumer();
        assert_eq!(
            preserved_outer.order(),
            ContextProviderUpdateConsumerOrder::First
        );
        assert_eq!(preserved_outer.consumer(), outer_function_component);
        assert_eq!(
            preserved_outer.dependency(),
            begin_work.outer_child_context_dependency()
        );
        assert_eq!(preserved_outer.context(), context);
        assert_eq!(preserved_outer.memoized_value(), outer_value);
        assert_eq!(preserved_outer.previous_value(), outer_value);
        assert_eq!(preserved_outer.next_value(), outer_value);
        assert_eq!(preserved_outer.render_lanes(), Lanes::DEFAULT);
        assert_eq!(preserved_outer.propagation_lanes(), propagation_lanes);
        assert_eq!(preserved_outer.previous_dependency_lanes(), Lanes::NO);
        assert_eq!(preserved_outer.dependency_lanes(), Lanes::NO);
        assert_eq!(preserved_outer.marked_dependency_count(), 0);
        assert!(preserved_outer.unchanged_provider_bailout());
        assert!(
            !preserved_outer
                .fiber_lanes_after()
                .contains_any(propagation_lanes)
        );
        assert_eq!(
            context_store
                .context_dependency(preserved_outer.dependency())
                .unwrap()
                .dependency_lanes(),
            Lanes::NO
        );

        let dependent_inner = record.dependent_inner_consumer();
        assert_eq!(
            dependent_inner.order(),
            ContextProviderUpdateConsumerOrder::Second
        );
        assert_eq!(dependent_inner.consumer(), inner_function_component);
        assert_eq!(
            dependent_inner.dependency(),
            begin_work.inner_child_context_dependency()
        );
        assert_eq!(dependent_inner.context(), context);
        assert_eq!(dependent_inner.memoized_value(), previous_inner_value);
        assert_eq!(dependent_inner.previous_value(), previous_inner_value);
        assert_eq!(dependent_inner.next_value(), next_inner_value);
        assert_eq!(dependent_inner.render_lanes(), Lanes::DEFAULT);
        assert_eq!(dependent_inner.propagation_lanes(), propagation_lanes);
        assert_eq!(dependent_inner.previous_dependency_lanes(), Lanes::NO);
        assert_eq!(dependent_inner.dependency_lanes(), propagation_lanes);
        assert!(
            dependent_inner
                .fiber_lanes_after()
                .contains_all(propagation_lanes)
        );
        assert_eq!(dependent_inner.marked_dependency_count(), 1);
        assert!(dependent_inner.marked_changed_provider_lanes());
        assert_eq!(
            context_store
                .context_dependency(dependent_inner.dependency())
                .unwrap()
                .dependency_lanes(),
            propagation_lanes
        );

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

        let outer_node = store.fiber_arena().get(outer_function_component).unwrap();
        assert!(!outer_node.lanes().contains_any(propagation_lanes));
        assert_eq!(outer_node.dependencies(), DependenciesHandle::NONE);
        assert!(
            !outer_node
                .flags()
                .contains_any(FiberFlags::NEEDS_PROPAGATION)
        );
        let inner_node = store.fiber_arena().get(inner_function_component).unwrap();
        assert!(inner_node.lanes().contains_all(propagation_lanes));
        assert_eq!(inner_node.dependencies(), DependenciesHandle::NONE);
        assert!(
            !inner_node
                .flags()
                .contains_any(FiberFlags::NEEDS_PROPAGATION)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn context_provider_update_lane_gate_records_nested_two_provider_changes() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_380),
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
        let outer_default_value = context_value(1_390);
        let inner_default_value = context_value(1_391);
        let previous_outer_value = context_value(1_392);
        let previous_inner_value = context_value(1_393);
        let next_outer_value = context_value(1_394);
        let next_inner_value = context_value(1_395);
        let outer_context = context_store.create_context(outer_default_value);
        let inner_context = context_store.create_context(inner_default_value);
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
        let begin_work = begin_work_nested_context_provider_two_provider_use_context_children(
            store.fiber_arena_mut(),
            NestedContextProviderBeginWorkRequest::new(
                outer_provider,
                Lanes::DEFAULT,
                outer_context,
                previous_outer_value,
                inner_context,
                previous_inner_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let outer_lanes = Lanes::SYNC.merge_lane(Lane::RETRY_1);
        let inner_lanes = Lanes::DEFAULT.merge_lane(Lane::TRANSITION_2);

        let record = record_context_provider_update_nested_two_provider_lane_gate(
            &mut store,
            &mut context_store,
            begin_work,
            ContextProviderUpdateMultiProviderLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                ContextProviderUpdateProviderChangeRequest::new(
                    begin_work.outer_provider_snapshot(),
                    begin_work.outer_provider_token(),
                    outer_context,
                    previous_outer_value,
                    next_outer_value,
                    outer_lanes,
                ),
                ContextProviderUpdateProviderChangeRequest::new(
                    begin_work.inner_provider_snapshot(),
                    begin_work.inner_provider_token(),
                    inner_context,
                    previous_inner_value,
                    next_inner_value,
                    inner_lanes,
                ),
                ContextProviderUpdateDependencyPath::from_begin_work(begin_work),
            ),
        )
        .unwrap();

        assert_eq!(record.shape(), ContextProviderUpdateShape::Nested);
        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            host_root_work_in_progress
        );
        assert_eq!(record.render_lanes(), Lanes::DEFAULT);
        assert_eq!(record.changed_contexts(), [outer_context, inner_context]);
        let changes = record.provider_changes();
        assert_eq!(changes[0].provider(), outer_provider);
        assert_eq!(changes[0].context(), outer_context);
        assert_eq!(changes[0].previous_value(), previous_outer_value);
        assert_eq!(changes[0].next_value(), next_outer_value);
        assert_eq!(changes[0].propagation_lanes(), outer_lanes);
        assert_eq!(changes[1].provider(), inner_provider);
        assert_eq!(changes[1].context(), inner_context);
        assert_eq!(changes[1].previous_value(), previous_inner_value);
        assert_eq!(changes[1].next_value(), next_inner_value);
        assert_eq!(changes[1].propagation_lanes(), inner_lanes);

        let pushes = record.provider_stack_pushes();
        assert_eq!(pushes[0].provider(), outer_provider);
        assert_eq!(pushes[0].context(), outer_context);
        assert_eq!(
            pushes[0].provider_snapshot(),
            begin_work.outer_provider_snapshot()
        );
        assert_eq!(
            pushes[0].provider_token(),
            begin_work.outer_provider_token()
        );
        assert_eq!(pushes[0].pushed_stack_depth(), 1);
        assert_eq!(pushes[0].restored_stack_depth(), 0);
        assert_eq!(pushes[1].provider(), inner_provider);
        assert_eq!(pushes[1].context(), inner_context);
        assert_eq!(
            pushes[1].provider_snapshot(),
            begin_work.inner_provider_snapshot()
        );
        assert_eq!(
            pushes[1].provider_token(),
            begin_work.inner_provider_token()
        );
        assert_eq!(pushes[1].pushed_stack_depth(), 2);
        assert_eq!(pushes[1].restored_stack_depth(), 1);
        let pops = record.provider_stack_pops();
        assert_eq!(pops[0].provider(), inner_provider);
        assert_eq!(pops[1].provider(), outer_provider);

        let first_read = begin_work.first_child_context_read();
        let second_read = begin_work.second_child_context_read();
        assert_eq!(first_read.context(), outer_context);
        assert_eq!(first_read.value(), previous_outer_value);
        assert_eq!(second_read.context(), inner_context);
        assert_eq!(second_read.value(), previous_inner_value);
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

        let consumers = record.dependent_consumers();
        assert_eq!(consumers[0].consumer(), first_function_component);
        assert_eq!(consumers[0].context(), outer_context);
        assert_eq!(consumers[0].memoized_value(), previous_outer_value);
        assert_eq!(consumers[0].previous_value(), previous_outer_value);
        assert_eq!(consumers[0].next_value(), next_outer_value);
        assert_eq!(consumers[0].render_lanes(), Lanes::DEFAULT);
        assert_eq!(consumers[0].propagation_lanes(), outer_lanes);
        assert_eq!(consumers[0].dependency_lanes(), outer_lanes);
        assert_eq!(consumers[1].consumer(), second_function_component);
        assert_eq!(consumers[1].context(), inner_context);
        assert_eq!(consumers[1].memoized_value(), previous_inner_value);
        assert_eq!(consumers[1].previous_value(), previous_inner_value);
        assert_eq!(consumers[1].next_value(), next_inner_value);
        assert_eq!(consumers[1].render_lanes(), Lanes::DEFAULT);
        assert_eq!(consumers[1].propagation_lanes(), inner_lanes);
        assert_eq!(consumers[1].dependency_lanes(), inner_lanes);

        let combined_lanes = outer_lanes.merge(inner_lanes);
        assert!(
            record
                .host_root_child_lanes_after()
                .contains_all(combined_lanes)
        );
        assert!(
            record
                .first_provider_child_lanes_after()
                .contains_all(combined_lanes)
        );
        assert!(
            record
                .second_provider_child_lanes_after()
                .contains_all(combined_lanes)
        );
        assert!(
            record
                .root_pending_lanes_after()
                .contains_all(combined_lanes)
        );
        for (consumer, lanes) in [
            (first_function_component, outer_lanes),
            (second_function_component, inner_lanes),
        ] {
            let node = store.fiber_arena().get(consumer).unwrap();
            assert!(node.lanes().contains_all(lanes));
            assert_eq!(node.dependencies(), DependenciesHandle::NONE);
            assert!(!node.flags().contains_any(FiberFlags::NEEDS_PROPAGATION));
        }
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn context_provider_update_lane_gate_records_sibling_two_provider_changes() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_400),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (
            first_provider,
            second_provider,
            first_function_component,
            first_component,
            second_function_component,
            second_component,
        ) = attach_sibling_context_provider_wip_children(&mut store, host_root_work_in_progress);
        let mut context_store = FunctionComponentContextRenderStore::new();
        let first_default_value = context_value(1_410);
        let second_default_value = context_value(1_411);
        let previous_first_value = context_value(1_412);
        let previous_second_value = context_value(1_413);
        let next_first_value = context_value(1_414);
        let next_second_value = context_value(1_415);
        let first_context = context_store.create_context(first_default_value);
        let second_context = context_store.create_context(second_default_value);
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
        let begin_work = begin_work_sibling_context_provider_two_consumer_use_context_children(
            store.fiber_arena_mut(),
            SiblingContextProviderBeginWorkRequest::new(
                first_provider,
                Lanes::DEFAULT,
                first_context,
                previous_first_value,
                second_context,
                previous_second_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let first_lanes = Lanes::SYNC.merge_lane(Lane::TRANSITION_1);
        let second_lanes = Lanes::DEFAULT.merge_lane(Lane::RETRY_2);

        let record = record_context_provider_update_sibling_two_provider_lane_gate(
            &mut store,
            &mut context_store,
            begin_work,
            ContextProviderUpdateMultiProviderLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                ContextProviderUpdateProviderChangeRequest::new(
                    begin_work.first_provider_snapshot(),
                    begin_work.first_provider_token(),
                    first_context,
                    previous_first_value,
                    next_first_value,
                    first_lanes,
                ),
                ContextProviderUpdateProviderChangeRequest::new(
                    begin_work.second_provider_snapshot(),
                    begin_work.second_provider_token(),
                    second_context,
                    previous_second_value,
                    next_second_value,
                    second_lanes,
                ),
                ContextProviderUpdateDependencyPath::from_sibling_begin_work(begin_work),
            ),
        )
        .unwrap();

        assert_eq!(record.shape(), ContextProviderUpdateShape::Sibling);
        assert_eq!(record.render_lanes(), Lanes::DEFAULT);
        assert_eq!(record.changed_contexts(), [first_context, second_context]);
        assert_eq!(record.changed_provider_count(), 2);
        assert_eq!(record.unchanged_provider_bailout_count(), 0);
        assert_eq!(record.marked_dependency_count(), 2);
        assert!(record.public_context_compatibility_blocked());
        let pushes = record.provider_stack_pushes();
        assert_eq!(pushes[0].provider(), first_provider);
        assert_eq!(
            pushes[0].provider_snapshot(),
            begin_work.first_provider_snapshot()
        );
        assert_eq!(pushes[0].pushed_stack_depth(), 1);
        assert_eq!(pushes[0].restored_stack_depth(), 0);
        assert_eq!(pushes[1].provider(), second_provider);
        assert_eq!(
            pushes[1].provider_snapshot(),
            begin_work.second_provider_snapshot()
        );
        assert_eq!(pushes[1].pushed_stack_depth(), 1);
        assert_eq!(pushes[1].restored_stack_depth(), 0);
        assert_eq!(record.provider_stack_pops(), pushes);

        let consumers = record.dependent_consumers();
        assert_eq!(consumers[0].consumer(), first_function_component);
        assert_eq!(consumers[0].context(), first_context);
        assert_eq!(consumers[0].memoized_value(), previous_first_value);
        assert_eq!(consumers[0].propagation_lanes(), first_lanes);
        assert_eq!(consumers[0].dependency_lanes(), first_lanes);
        assert_eq!(consumers[0].render_lanes(), Lanes::DEFAULT);
        assert_eq!(consumers[0].marked_dependency_count(), 1);
        assert!(consumers[0].marked_changed_provider_lanes());
        assert_eq!(consumers[1].consumer(), second_function_component);
        assert_eq!(consumers[1].context(), second_context);
        assert_eq!(consumers[1].memoized_value(), previous_second_value);
        assert_eq!(consumers[1].propagation_lanes(), second_lanes);
        assert_eq!(consumers[1].dependency_lanes(), second_lanes);
        assert_eq!(consumers[1].render_lanes(), Lanes::DEFAULT);
        assert_eq!(consumers[1].marked_dependency_count(), 1);
        assert!(consumers[1].marked_changed_provider_lanes());

        assert!(
            record
                .host_root_child_lanes_after()
                .contains_all(first_lanes.merge(second_lanes))
        );
        assert!(
            record
                .first_provider_child_lanes_after()
                .contains_all(first_lanes)
        );
        assert!(
            !record
                .first_provider_child_lanes_after()
                .contains_any(second_lanes)
        );
        assert!(
            record
                .second_provider_child_lanes_after()
                .contains_all(second_lanes)
        );
        assert!(
            !record
                .second_provider_child_lanes_after()
                .contains_any(first_lanes)
        );
        assert!(
            record
                .root_pending_lanes_after()
                .contains_all(first_lanes.merge(second_lanes))
        );
        for consumer in [first_function_component, second_function_component] {
            let node = store.fiber_arena().get(consumer).unwrap();
            assert_eq!(node.dependencies(), DependenciesHandle::NONE);
            assert!(!node.flags().contains_any(FiberFlags::NEEDS_PROPAGATION));
        }
        assert_eq!(
            context_store.current_value(first_context).unwrap(),
            first_default_value
        );
        assert_eq!(
            context_store.current_value(second_context).unwrap(),
            second_default_value
        );
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn context_provider_update_lane_gate_records_unchanged_provider_bailout_and_changed_mark() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_416),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (
            first_provider,
            second_provider,
            first_function_component,
            first_component,
            second_function_component,
            second_component,
        ) = attach_sibling_context_provider_wip_children(&mut store, host_root_work_in_progress);
        let mut context_store = FunctionComponentContextRenderStore::new();
        let first_default_value = context_value(1_417);
        let second_default_value = context_value(1_418);
        let previous_first_value = context_value(1_419);
        let previous_second_value = context_value(1_420);
        let next_second_value = context_value(1_421);
        let first_context = context_store.create_context(first_default_value);
        let second_context = context_store.create_context(second_default_value);
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
        let begin_work = begin_work_sibling_context_provider_two_consumer_use_context_children(
            store.fiber_arena_mut(),
            SiblingContextProviderBeginWorkRequest::new(
                first_provider,
                Lanes::DEFAULT,
                first_context,
                previous_first_value,
                second_context,
                previous_second_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let unchanged_lanes = Lanes::SYNC.merge_lane(Lane::RETRY_1);
        let changed_lanes = Lanes::DEFAULT.merge_lane(Lane::TRANSITION_2);

        let record = record_context_provider_update_sibling_two_provider_lane_gate(
            &mut store,
            &mut context_store,
            begin_work,
            ContextProviderUpdateMultiProviderLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                ContextProviderUpdateProviderChangeRequest::new(
                    begin_work.first_provider_snapshot(),
                    begin_work.first_provider_token(),
                    first_context,
                    previous_first_value,
                    previous_first_value,
                    unchanged_lanes,
                ),
                ContextProviderUpdateProviderChangeRequest::new(
                    begin_work.second_provider_snapshot(),
                    begin_work.second_provider_token(),
                    second_context,
                    previous_second_value,
                    next_second_value,
                    changed_lanes,
                ),
                ContextProviderUpdateDependencyPath::from_sibling_begin_work(begin_work),
            ),
        )
        .unwrap();

        assert_eq!(record.changed_provider_count(), 1);
        assert_eq!(record.unchanged_provider_bailout_count(), 1);
        assert_eq!(record.marked_dependency_count(), 1);
        assert!(record.public_context_compatibility_blocked());

        let changes = record.provider_changes();
        assert_eq!(changes[0].provider(), first_provider);
        assert!(!changes[0].provider_changed());
        assert!(changes[0].unchanged_provider_bailout());
        assert_eq!(changes[0].propagation_lanes(), unchanged_lanes);
        assert_eq!(changes[1].provider(), second_provider);
        assert!(changes[1].provider_changed());
        assert!(!changes[1].unchanged_provider_bailout());
        assert_eq!(changes[1].propagation_lanes(), changed_lanes);

        let consumers = record.dependent_consumers();
        assert_eq!(
            consumers[0].dependency(),
            begin_work.first_child_context_dependency()
        );
        assert_eq!(consumers[0].consumer(), first_function_component);
        assert_eq!(consumers[0].context(), first_context);
        assert_eq!(consumers[0].memoized_value(), previous_first_value);
        assert_eq!(consumers[0].previous_value(), previous_first_value);
        assert_eq!(consumers[0].next_value(), previous_first_value);
        assert_eq!(consumers[0].propagation_lanes(), unchanged_lanes);
        assert_eq!(consumers[0].previous_dependency_lanes(), Lanes::NO);
        assert_eq!(consumers[0].dependency_lanes(), Lanes::NO);
        assert_eq!(consumers[0].marked_dependency_count(), 0);
        assert!(consumers[0].unchanged_provider_bailout());
        assert!(!consumers[0].provider_changed());
        assert_eq!(consumers[0].scanned_dependency_count(), 1);
        assert_eq!(consumers[0].root(), root_id);

        assert_eq!(
            consumers[1].dependency(),
            begin_work.second_child_context_dependency()
        );
        assert_eq!(consumers[1].consumer(), second_function_component);
        assert_eq!(consumers[1].context(), second_context);
        assert_eq!(consumers[1].memoized_value(), previous_second_value);
        assert_eq!(consumers[1].previous_value(), previous_second_value);
        assert_eq!(consumers[1].next_value(), next_second_value);
        assert_eq!(consumers[1].propagation_lanes(), changed_lanes);
        assert_eq!(consumers[1].previous_dependency_lanes(), Lanes::NO);
        assert_eq!(consumers[1].dependency_lanes(), changed_lanes);
        assert_eq!(consumers[1].marked_dependency_count(), 1);
        assert!(consumers[1].marked_changed_provider_lanes());
        assert_eq!(consumers[1].scanned_dependency_count(), 1);
        assert_eq!(consumers[1].root(), root_id);

        assert_eq!(
            context_store
                .context_dependency(begin_work.first_child_context_dependency())
                .unwrap()
                .dependency_lanes(),
            Lanes::NO
        );
        assert_eq!(
            context_store
                .context_dependency(begin_work.second_child_context_dependency())
                .unwrap()
                .dependency_lanes(),
            changed_lanes
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(first_function_component)
                .unwrap()
                .lanes(),
            Lanes::NO
        );
        assert!(
            store
                .fiber_arena()
                .get(second_function_component)
                .unwrap()
                .lanes()
                .contains_all(changed_lanes)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(first_provider)
                .unwrap()
                .child_lanes(),
            Lanes::NO
        );
        assert!(
            store
                .fiber_arena()
                .get(second_provider)
                .unwrap()
                .child_lanes()
                .contains_all(changed_lanes)
        );
        assert!(
            store
                .fiber_arena()
                .get(host_root_work_in_progress)
                .unwrap()
                .child_lanes()
                .contains_all(changed_lanes)
        );
        assert!(
            !store
                .fiber_arena()
                .get(host_root_work_in_progress)
                .unwrap()
                .child_lanes()
                .contains_any(unchanged_lanes)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_all(changed_lanes)
        );
        assert!(
            !store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_any(unchanged_lanes)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn context_provider_update_lane_gate_rejects_empty_lanes_before_marking_dependencies() {
        let (mut store, root_id, _host) = root_store();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_422),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (
            first_provider,
            _second_provider,
            first_function_component,
            first_component,
            second_function_component,
            second_component,
        ) = attach_sibling_context_provider_wip_children(&mut store, host_root_work_in_progress);
        let mut context_store = FunctionComponentContextRenderStore::new();
        let first_context = context_store.create_context(context_value(1_423));
        let second_context = context_store.create_context(context_value(1_424));
        let previous_first_value = context_value(1_425);
        let previous_second_value = context_value(1_426);
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
        let begin_work = begin_work_sibling_context_provider_two_consumer_use_context_children(
            store.fiber_arena_mut(),
            SiblingContextProviderBeginWorkRequest::new(
                first_provider,
                Lanes::DEFAULT,
                first_context,
                previous_first_value,
                second_context,
                previous_second_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let first_lanes = Lanes::SYNC.merge_lane(Lane::TRANSITION_1);

        let error = record_context_provider_update_sibling_two_provider_lane_gate(
            &mut store,
            &mut context_store,
            begin_work,
            ContextProviderUpdateMultiProviderLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                ContextProviderUpdateProviderChangeRequest::new(
                    begin_work.first_provider_snapshot(),
                    begin_work.first_provider_token(),
                    first_context,
                    previous_first_value,
                    context_value(1_427),
                    first_lanes,
                ),
                ContextProviderUpdateProviderChangeRequest::new(
                    begin_work.second_provider_snapshot(),
                    begin_work.second_provider_token(),
                    second_context,
                    previous_second_value,
                    context_value(1_428),
                    Lanes::NO,
                ),
                ContextProviderUpdateDependencyPath::from_sibling_begin_work(begin_work),
            ),
        )
        .unwrap_err();

        assert_eq!(
            error,
            ContextProviderUpdateLaneGateError::EmptyPropagationLanes {
                context: second_context,
            }
        );
        for dependency in [
            begin_work.first_child_context_dependency(),
            begin_work.second_child_context_dependency(),
        ] {
            assert_eq!(
                context_store
                    .context_dependency(dependency)
                    .unwrap()
                    .dependency_lanes(),
                Lanes::NO
            );
        }
        for consumer in [first_function_component, second_function_component] {
            assert_eq!(
                store.fiber_arena().get(consumer).unwrap().lanes(),
                Lanes::NO
            );
        }
        assert!(
            !store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_any(first_lanes)
        );
    }

    #[test]
    fn context_provider_update_lane_gate_fails_closed_for_stale_stack_snapshot() {
        let (mut store, root_id, _host) = root_store();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_420),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (
            first_provider,
            _second_provider,
            first_function_component,
            first_component,
            second_function_component,
            second_component,
        ) = attach_sibling_context_provider_wip_children(&mut store, host_root_work_in_progress);
        let mut context_store = FunctionComponentContextRenderStore::new();
        let first_context = context_store.create_context(context_value(1_430));
        let second_context = context_store.create_context(context_value(1_431));
        let previous_first_value = context_value(1_432);
        let previous_second_value = context_value(1_433);
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
        let begin_work = begin_work_sibling_context_provider_two_consumer_use_context_children(
            store.fiber_arena_mut(),
            SiblingContextProviderBeginWorkRequest::new(
                first_provider,
                Lanes::DEFAULT,
                first_context,
                previous_first_value,
                second_context,
                previous_second_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let propagation_lanes = Lanes::SYNC.merge_lane(Lane::RETRY_1);
        let stale_snapshot = FunctionComponentContextRenderStore::new()
            .context_stack()
            .snapshot();

        let error = record_context_provider_update_sibling_two_provider_lane_gate(
            &mut store,
            &mut context_store,
            begin_work,
            ContextProviderUpdateMultiProviderLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                ContextProviderUpdateProviderChangeRequest::new(
                    stale_snapshot,
                    begin_work.first_provider_token(),
                    first_context,
                    previous_first_value,
                    context_value(1_434),
                    propagation_lanes,
                ),
                ContextProviderUpdateProviderChangeRequest::new(
                    begin_work.second_provider_snapshot(),
                    begin_work.second_provider_token(),
                    second_context,
                    previous_second_value,
                    context_value(1_435),
                    propagation_lanes,
                ),
                ContextProviderUpdateDependencyPath::from_sibling_begin_work(begin_work),
            ),
        )
        .unwrap_err();

        assert_eq!(
            error,
            ContextProviderUpdateLaneGateError::StaleProviderSnapshot {
                provider: first_provider,
                expected_snapshot: stale_snapshot,
                actual_snapshot: begin_work.first_provider_snapshot(),
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
    fn context_provider_update_lane_gate_fails_closed_for_missing_consumer_dependency() {
        let (mut store, root_id, _host) = root_store();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_440),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (
            first_provider,
            _second_provider,
            first_function_component,
            first_component,
            second_function_component,
            second_component,
        ) = attach_sibling_context_provider_wip_children(&mut store, host_root_work_in_progress);
        let mut context_store = FunctionComponentContextRenderStore::new();
        let first_context = context_store.create_context(context_value(1_450));
        let second_context = context_store.create_context(context_value(1_451));
        let previous_first_value = context_value(1_452);
        let previous_second_value = context_value(1_453);
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
        let begin_work = begin_work_sibling_context_provider_two_consumer_use_context_children(
            store.fiber_arena_mut(),
            SiblingContextProviderBeginWorkRequest::new(
                first_provider,
                Lanes::DEFAULT,
                first_context,
                previous_first_value,
                second_context,
                previous_second_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let propagation_lanes = Lanes::SYNC.merge_lane(Lane::TRANSITION_1);
        let mut empty_context_store = FunctionComponentContextRenderStore::new();

        let error = record_context_provider_update_sibling_two_provider_lane_gate(
            &mut store,
            &mut empty_context_store,
            begin_work,
            ContextProviderUpdateMultiProviderLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                ContextProviderUpdateProviderChangeRequest::new(
                    begin_work.first_provider_snapshot(),
                    begin_work.first_provider_token(),
                    first_context,
                    previous_first_value,
                    context_value(1_454),
                    propagation_lanes,
                ),
                ContextProviderUpdateProviderChangeRequest::new(
                    begin_work.second_provider_snapshot(),
                    begin_work.second_provider_token(),
                    second_context,
                    previous_second_value,
                    context_value(1_455),
                    propagation_lanes,
                ),
                ContextProviderUpdateDependencyPath::from_sibling_begin_work(begin_work),
            ),
        )
        .unwrap_err();

        assert_eq!(
            error,
            ContextProviderUpdateLaneGateError::MissingDependency {
                order: ContextProviderUpdateConsumerOrder::First,
                dependency: begin_work.first_child_context_dependency(),
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
