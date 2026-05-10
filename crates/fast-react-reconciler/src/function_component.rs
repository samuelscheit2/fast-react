//! Private function-component render skeleton.
//!
//! This module proves the reconciler-side invocation boundary without public
//! hook facades, effects, host mutation, or child reconciliation.

#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ContextHandle, ContextStack, ContextStackError, ContextStackSnapshot, ContextValueChange,
    ContextValueHandle, ElementTypeHandle, FiberArena, FiberFlags, FiberId, FiberTag,
    FiberTopologyError, FiberTypeHandle, HookEffectArena, HookEffectArenaError,
    HookEffectCallbackHandle, HookEffectDependencies, HookEffectFlags, HookEffectId,
    HookEffectInstanceId, HookEffectPayload, HookEffectRing, HookListArena, HookListError,
    HookListId, HookListMountCursor, HookListTraversalResult, HookListUpdateCursor, HookQueueError,
    HookQueueId, HookQueueStore, HookRevertLane, HookSlotId, HookSlotPayload, HookStatePayload,
    HookStateSlot, HookUpdateId, HookUpdateLane, Lanes, ProcessHookQueueResult, PropsHandle,
    StateHandle, UpdateQueueHandle,
};
use fast_react_host_config::HostTypes;

use crate::root_scheduler::{RootRescheduleRequestRecord, ensure_root_is_rescheduled};
use crate::{
    ConcurrentUpdateError, FiberRootId, FiberRootStore, RootElementHandle, RootSchedulerError,
    ScheduledRootUpdateResult, mark_update_lane_from_fiber_to_root,
    mark_update_lanes_from_fiber_to_root,
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

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct FunctionComponentCallbackHandle(u64);

impl FunctionComponentCallbackHandle {
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

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct FunctionComponentStateActionHandle(u64);

impl FunctionComponentStateActionHandle {
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

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct FunctionComponentReducerHandle(u64);

impl FunctionComponentReducerHandle {
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

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct FunctionComponentStateDispatchHandle(u64);

impl FunctionComponentStateDispatchHandle {
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

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct FunctionComponentRefObjectHandle(u64);

impl FunctionComponentRefObjectHandle {
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

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct FunctionComponentContextDependencyHandle(u64);

impl FunctionComponentContextDependencyHandle {
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
pub(crate) struct FunctionComponentStateDispatchEagerState {
    last_rendered_state: StateHandle,
    eager_state: StateHandle,
}

impl FunctionComponentStateDispatchEagerState {
    #[must_use]
    pub const fn new(last_rendered_state: StateHandle, eager_state: StateHandle) -> Self {
        Self {
            last_rendered_state,
            eager_state,
        }
    }

    #[must_use]
    pub const fn last_rendered_state(self) -> StateHandle {
        self.last_rendered_state
    }

    #[must_use]
    pub const fn eager_state(self) -> StateHandle {
        self.eager_state
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentStateReducerId {
    BasicState,
    Reducer(FunctionComponentReducerHandle),
}

type FunctionComponentStateQueueStore = HookQueueStore<
    StateHandle,
    FunctionComponentStateActionHandle,
    FunctionComponentStateReducerId,
    FunctionComponentStateDispatchHandle,
>;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FunctionComponentStateDispatchBinding {
    handle: FunctionComponentStateDispatchHandle,
    fiber: FiberId,
    queue: HookQueueId,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentStateHookRecord {
    hook: HookSlotId,
    memoized_state: StateHandle,
    base_state: StateHandle,
    base_queue: Option<HookUpdateId>,
    queue: HookQueueId,
    dispatch: FunctionComponentStateDispatchHandle,
}

impl FunctionComponentStateHookRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub const fn base_state(self) -> StateHandle {
        self.base_state
    }

    #[must_use]
    pub const fn base_queue(self) -> Option<HookUpdateId> {
        self.base_queue
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        self.queue
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentReducerHookRecord {
    hook: HookSlotId,
    reducer: FunctionComponentReducerHandle,
    memoized_state: StateHandle,
    base_state: StateHandle,
    base_queue: Option<HookUpdateId>,
    queue: HookQueueId,
    dispatch: FunctionComponentStateDispatchHandle,
}

impl FunctionComponentReducerHookRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn reducer(self) -> FunctionComponentReducerHandle {
        self.reducer
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub const fn base_state(self) -> StateHandle {
        self.base_state
    }

    #[must_use]
    pub const fn base_queue(self) -> Option<HookUpdateId> {
        self.base_queue
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        self.queue
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentStateDispatchRequest {
    dispatch: FunctionComponentStateDispatchHandle,
    action: FunctionComponentStateActionHandle,
    lane: HookUpdateLane,
    revert_lane: HookRevertLane,
    eager_state: Option<FunctionComponentStateDispatchEagerState>,
}

impl FunctionComponentStateDispatchRequest {
    #[must_use]
    pub const fn new(
        dispatch: FunctionComponentStateDispatchHandle,
        action: FunctionComponentStateActionHandle,
        lane: HookUpdateLane,
    ) -> Self {
        Self {
            dispatch,
            action,
            lane,
            revert_lane: HookRevertLane::NO,
            eager_state: None,
        }
    }

    #[must_use]
    pub const fn with_revert_lane(mut self, revert_lane: HookRevertLane) -> Self {
        self.revert_lane = revert_lane;
        self
    }

    #[must_use]
    pub const fn with_eager_state(
        mut self,
        eager_state: FunctionComponentStateDispatchEagerState,
    ) -> Self {
        self.eager_state = Some(eager_state);
        self
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }

    #[must_use]
    pub const fn action(self) -> FunctionComponentStateActionHandle {
        self.action
    }

    #[must_use]
    pub const fn lane(self) -> HookUpdateLane {
        self.lane
    }

    #[must_use]
    pub const fn revert_lane(self) -> HookRevertLane {
        self.revert_lane
    }

    #[must_use]
    pub const fn eager_state(self) -> Option<FunctionComponentStateDispatchEagerState> {
        self.eager_state
    }

    #[must_use]
    pub const fn has_eager_state(self) -> bool {
        self.eager_state.is_some()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentReducerDispatchRequest {
    dispatch: FunctionComponentStateDispatchHandle,
    action: FunctionComponentStateActionHandle,
    lane: HookUpdateLane,
    revert_lane: HookRevertLane,
    eager_state: Option<FunctionComponentStateDispatchEagerState>,
}

impl FunctionComponentReducerDispatchRequest {
    #[must_use]
    pub const fn new(
        dispatch: FunctionComponentStateDispatchHandle,
        action: FunctionComponentStateActionHandle,
        lane: HookUpdateLane,
    ) -> Self {
        Self {
            dispatch,
            action,
            lane,
            revert_lane: HookRevertLane::NO,
            eager_state: None,
        }
    }

    #[must_use]
    pub const fn with_revert_lane(mut self, revert_lane: HookRevertLane) -> Self {
        self.revert_lane = revert_lane;
        self
    }

    #[must_use]
    pub const fn with_eager_state(
        mut self,
        eager_state: FunctionComponentStateDispatchEagerState,
    ) -> Self {
        self.eager_state = Some(eager_state);
        self
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }

    #[must_use]
    pub const fn action(self) -> FunctionComponentStateActionHandle {
        self.action
    }

    #[must_use]
    pub const fn lane(self) -> HookUpdateLane {
        self.lane
    }

    #[must_use]
    pub const fn revert_lane(self) -> HookRevertLane {
        self.revert_lane
    }

    #[must_use]
    pub const fn eager_state(self) -> Option<FunctionComponentStateDispatchEagerState> {
        self.eager_state
    }

    #[must_use]
    pub const fn has_eager_state(self) -> bool {
        self.eager_state.is_some()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentStateDispatchRecord {
    fiber: FiberId,
    queue: HookQueueId,
    dispatch: FunctionComponentStateDispatchHandle,
    update: HookUpdateId,
    lane: HookUpdateLane,
    revert_lane: HookRevertLane,
    action: FunctionComponentStateActionHandle,
    eager_state: Option<FunctionComponentStateDispatchEagerState>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentReducerDispatchRecord {
    fiber: FiberId,
    queue: HookQueueId,
    dispatch: FunctionComponentStateDispatchHandle,
    reducer: FunctionComponentReducerHandle,
    update: HookUpdateId,
    lane: HookUpdateLane,
    revert_lane: HookRevertLane,
    action: FunctionComponentStateActionHandle,
    eager_state: Option<FunctionComponentStateDispatchEagerState>,
}

impl FunctionComponentReducerDispatchRecord {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        self.queue
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }

    #[must_use]
    pub const fn reducer(self) -> FunctionComponentReducerHandle {
        self.reducer
    }

    #[must_use]
    pub const fn update(self) -> HookUpdateId {
        self.update
    }

    #[must_use]
    pub const fn lane(self) -> HookUpdateLane {
        self.lane
    }

    #[must_use]
    pub const fn revert_lane(self) -> HookRevertLane {
        self.revert_lane
    }

    #[must_use]
    pub const fn action(self) -> FunctionComponentStateActionHandle {
        self.action
    }

    #[must_use]
    pub const fn eager_state(self) -> Option<FunctionComponentStateDispatchEagerState> {
        self.eager_state
    }

    #[must_use]
    pub const fn has_eager_state(self) -> bool {
        self.eager_state.is_some()
    }
}

impl FunctionComponentStateDispatchRecord {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        self.queue
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }

    #[must_use]
    pub const fn update(self) -> HookUpdateId {
        self.update
    }

    #[must_use]
    pub const fn lane(self) -> HookUpdateLane {
        self.lane
    }

    #[must_use]
    pub const fn revert_lane(self) -> HookRevertLane {
        self.revert_lane
    }

    #[must_use]
    pub const fn action(self) -> FunctionComponentStateActionHandle {
        self.action
    }

    #[must_use]
    pub const fn eager_state(self) -> Option<FunctionComponentStateDispatchEagerState> {
        self.eager_state
    }

    #[must_use]
    pub const fn has_eager_state(self) -> bool {
        self.eager_state.is_some()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentStateDispatchRootRescheduleRecord {
    dispatch: FunctionComponentStateDispatchRecord,
    root: FiberRootId,
    reschedule: RootRescheduleRequestRecord,
    scheduled: ScheduledRootUpdateResult,
}

impl FunctionComponentStateDispatchRootRescheduleRecord {
    #[must_use]
    pub(crate) const fn dispatch(&self) -> FunctionComponentStateDispatchRecord {
        self.dispatch
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn reschedule(&self) -> RootRescheduleRequestRecord {
        self.reschedule
    }

    #[must_use]
    pub(crate) const fn scheduled(&self) -> ScheduledRootUpdateResult {
        self.scheduled
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentReducerDispatchRootRescheduleRecord {
    dispatch: FunctionComponentReducerDispatchRecord,
    root: FiberRootId,
    reschedule: RootRescheduleRequestRecord,
    scheduled: ScheduledRootUpdateResult,
}

impl FunctionComponentReducerDispatchRootRescheduleRecord {
    #[must_use]
    pub(crate) const fn dispatch(&self) -> FunctionComponentReducerDispatchRecord {
        self.dispatch
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn reschedule(&self) -> RootRescheduleRequestRecord {
        self.reschedule
    }

    #[must_use]
    pub(crate) const fn scheduled(&self) -> ScheduledRootUpdateResult {
        self.scheduled
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentReducerDispatchEagerStateBlocker {
    NoEagerStateRequested,
    ReducerExecutionBlocked,
}

impl FunctionComponentReducerDispatchEagerStateBlocker {
    #[must_use]
    pub const fn for_eager_state(
        eager_state: Option<FunctionComponentStateDispatchEagerState>,
    ) -> Self {
        match eager_state {
            Some(_) => Self::ReducerExecutionBlocked,
            None => Self::NoEagerStateRequested,
        }
    }

    #[must_use]
    pub const fn blocks_eager_state_computation(self) -> bool {
        matches!(self, Self::ReducerExecutionBlocked)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentReducerDispatchNonExecutionMetadata {
    public_hook_execution: bool,
    reducer_execution: bool,
    update_enqueued: bool,
    root_scheduled: bool,
    compatibility_claimed: bool,
}

impl FunctionComponentReducerDispatchNonExecutionMetadata {
    pub const BLOCKED: Self = Self {
        public_hook_execution: false,
        reducer_execution: false,
        update_enqueued: false,
        root_scheduled: false,
        compatibility_claimed: false,
    };

    #[must_use]
    pub const fn public_hook_execution(self) -> bool {
        self.public_hook_execution
    }

    #[must_use]
    pub const fn reducer_execution(self) -> bool {
        self.reducer_execution
    }

    #[must_use]
    pub const fn update_enqueued(self) -> bool {
        self.update_enqueued
    }

    #[must_use]
    pub const fn root_scheduled(self) -> bool {
        self.root_scheduled
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub const fn keeps_dispatch_blocked(self) -> bool {
        !self.public_hook_execution
            && !self.reducer_execution
            && !self.update_enqueued
            && !self.root_scheduled
            && !self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentReducerDispatchQueueRecord {
    diagnostic_index: usize,
    fiber: FiberId,
    current: Option<FiberId>,
    hook_list: HookListId,
    queue_owner: FiberId,
    queue: HookQueueId,
    dispatch: FunctionComponentStateDispatchHandle,
    reducer: FunctionComponentReducerHandle,
    action: FunctionComponentStateActionHandle,
    render_lanes: Lanes,
    dispatch_lane: HookUpdateLane,
    revert_lane: HookRevertLane,
    eager_state: Option<FunctionComponentStateDispatchEagerState>,
    eager_state_blocker: FunctionComponentReducerDispatchEagerStateBlocker,
    non_execution: FunctionComponentReducerDispatchNonExecutionMetadata,
}

impl FunctionComponentReducerDispatchQueueRecord {
    #[must_use]
    pub const fn diagnostic_index(self) -> usize {
        self.diagnostic_index
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn current(self) -> Option<FiberId> {
        self.current
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn queue_owner(self) -> FiberId {
        self.queue_owner
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        self.queue
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }

    #[must_use]
    pub const fn reducer(self) -> FunctionComponentReducerHandle {
        self.reducer
    }

    #[must_use]
    pub const fn action(self) -> FunctionComponentStateActionHandle {
        self.action
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn dispatch_lane(self) -> HookUpdateLane {
        self.dispatch_lane
    }

    #[must_use]
    pub const fn revert_lane(self) -> HookRevertLane {
        self.revert_lane
    }

    #[must_use]
    pub const fn eager_state(self) -> Option<FunctionComponentStateDispatchEagerState> {
        self.eager_state
    }

    #[must_use]
    pub const fn eager_state_blocker(self) -> FunctionComponentReducerDispatchEagerStateBlocker {
        self.eager_state_blocker
    }

    #[must_use]
    pub const fn non_execution(self) -> FunctionComponentReducerDispatchNonExecutionMetadata {
        self.non_execution
    }

    #[must_use]
    pub const fn executes_reducer(self) -> bool {
        self.non_execution.reducer_execution()
    }

    #[must_use]
    pub const fn enqueues_update(self) -> bool {
        self.non_execution.update_enqueued()
    }

    #[must_use]
    pub const fn claims_public_hook_compatibility(self) -> bool {
        self.non_execution.compatibility_claimed()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentStateUpdateRenderLanes {
    render_lanes: Lanes,
    root_render_lanes: Lanes,
}

impl FunctionComponentStateUpdateRenderLanes {
    #[must_use]
    pub const fn new(render_lanes: Lanes, root_render_lanes: Lanes) -> Self {
        Self {
            render_lanes,
            root_render_lanes,
        }
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn root_render_lanes(self) -> Lanes {
        self.root_render_lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentMemoDependencyStatus {
    Changed,
    Unchanged,
}

impl FunctionComponentMemoDependencyStatus {
    #[must_use]
    pub const fn reused_previous_value(self) -> bool {
        matches!(self, Self::Unchanged)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentMemoHookRecord {
    hook: HookSlotId,
    value: StateHandle,
    dependencies: HookEffectDependencies,
}

impl FunctionComponentMemoHookRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn value(self) -> StateHandle {
        self.value
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentMemoUpdateRecord {
    hook: HookSlotId,
    previous_hook: HookSlotId,
    previous_value: StateHandle,
    previous_dependencies: HookEffectDependencies,
    requested_value: StateHandle,
    value: StateHandle,
    dependencies: HookEffectDependencies,
    dependency_status: FunctionComponentMemoDependencyStatus,
}

impl FunctionComponentMemoUpdateRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn previous_hook(self) -> HookSlotId {
        self.previous_hook
    }

    #[must_use]
    pub const fn previous_value(self) -> StateHandle {
        self.previous_value
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> HookEffectDependencies {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn requested_value(self) -> StateHandle {
        self.requested_value
    }

    #[must_use]
    pub const fn value(self) -> StateHandle {
        self.value
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> FunctionComponentMemoDependencyStatus {
        self.dependency_status
    }

    #[must_use]
    pub const fn reused_previous_value(self) -> bool {
        self.dependency_status.reused_previous_value()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentMemoUpdateDiagnosticRecord {
    diagnostic_index: usize,
    fiber: FiberId,
    current: FiberId,
    current_hook_list: HookListId,
    hook_list: HookListId,
    previous_hook: HookSlotId,
    hook: HookSlotId,
    render_lanes: Lanes,
    previous_value: StateHandle,
    previous_dependencies: HookEffectDependencies,
    requested_value: StateHandle,
    value: StateHandle,
    dependencies: HookEffectDependencies,
    dependency_status: FunctionComponentMemoDependencyStatus,
}

impl FunctionComponentMemoUpdateDiagnosticRecord {
    #[must_use]
    pub const fn diagnostic_index(self) -> usize {
        self.diagnostic_index
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn current_hook_list(self) -> HookListId {
        self.current_hook_list
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn previous_hook(self) -> HookSlotId {
        self.previous_hook
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn previous_value(self) -> StateHandle {
        self.previous_value
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> HookEffectDependencies {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn requested_value(self) -> StateHandle {
        self.requested_value
    }

    #[must_use]
    pub const fn value(self) -> StateHandle {
        self.value
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> FunctionComponentMemoDependencyStatus {
        self.dependency_status
    }

    #[must_use]
    pub const fn reused_previous_value(self) -> bool {
        self.dependency_status.reused_previous_value()
    }

    #[must_use]
    pub const fn recomputed_value(self) -> bool {
        matches!(
            self.dependency_status,
            FunctionComponentMemoDependencyStatus::Changed
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentCallbackHookRecord {
    hook: HookSlotId,
    callback: FunctionComponentCallbackHandle,
    dependencies: HookEffectDependencies,
}

impl FunctionComponentCallbackHookRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn callback(self) -> FunctionComponentCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentCallbackUpdateRecord {
    hook: HookSlotId,
    previous_hook: HookSlotId,
    previous_callback: FunctionComponentCallbackHandle,
    previous_dependencies: HookEffectDependencies,
    requested_callback: FunctionComponentCallbackHandle,
    callback: FunctionComponentCallbackHandle,
    dependencies: HookEffectDependencies,
    dependency_status: FunctionComponentMemoDependencyStatus,
}

impl FunctionComponentCallbackUpdateRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn previous_hook(self) -> HookSlotId {
        self.previous_hook
    }

    #[must_use]
    pub const fn previous_callback(self) -> FunctionComponentCallbackHandle {
        self.previous_callback
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> HookEffectDependencies {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn requested_callback(self) -> FunctionComponentCallbackHandle {
        self.requested_callback
    }

    #[must_use]
    pub const fn callback(self) -> FunctionComponentCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> FunctionComponentMemoDependencyStatus {
        self.dependency_status
    }

    #[must_use]
    pub const fn reused_previous_callback(self) -> bool {
        self.dependency_status.reused_previous_value()
    }

    #[must_use]
    pub const fn replaced_callback(self) -> bool {
        matches!(
            self.dependency_status,
            FunctionComponentMemoDependencyStatus::Changed
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentCallbackUpdateDiagnosticRecord {
    diagnostic_index: usize,
    fiber: FiberId,
    current: FiberId,
    current_hook_list: HookListId,
    hook_list: HookListId,
    previous_hook: HookSlotId,
    hook: HookSlotId,
    render_lanes: Lanes,
    previous_callback: FunctionComponentCallbackHandle,
    previous_dependencies: HookEffectDependencies,
    requested_callback: FunctionComponentCallbackHandle,
    callback: FunctionComponentCallbackHandle,
    dependencies: HookEffectDependencies,
    dependency_status: FunctionComponentMemoDependencyStatus,
}

impl FunctionComponentCallbackUpdateDiagnosticRecord {
    #[must_use]
    pub const fn diagnostic_index(self) -> usize {
        self.diagnostic_index
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn current_hook_list(self) -> HookListId {
        self.current_hook_list
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn previous_hook(self) -> HookSlotId {
        self.previous_hook
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn previous_callback(self) -> FunctionComponentCallbackHandle {
        self.previous_callback
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> HookEffectDependencies {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn requested_callback(self) -> FunctionComponentCallbackHandle {
        self.requested_callback
    }

    #[must_use]
    pub const fn callback(self) -> FunctionComponentCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> FunctionComponentMemoDependencyStatus {
        self.dependency_status
    }

    #[must_use]
    pub const fn reused_previous_callback(self) -> bool {
        self.dependency_status.reused_previous_value()
    }

    #[must_use]
    pub const fn replaced_callback(self) -> bool {
        matches!(
            self.dependency_status,
            FunctionComponentMemoDependencyStatus::Changed
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentRefHookRecord {
    hook: HookSlotId,
    ref_object: FunctionComponentRefObjectHandle,
    initial_value: StateHandle,
}

impl FunctionComponentRefHookRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn ref_object(self) -> FunctionComponentRefObjectHandle {
        self.ref_object
    }

    #[must_use]
    pub const fn initial_value(self) -> StateHandle {
        self.initial_value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentRefUpdateRecord {
    hook: HookSlotId,
    ref_object: FunctionComponentRefObjectHandle,
    initial_value: StateHandle,
    ignored_initial_value: StateHandle,
}

impl FunctionComponentRefUpdateRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn ref_object(self) -> FunctionComponentRefObjectHandle {
        self.ref_object
    }

    #[must_use]
    pub const fn initial_value(self) -> StateHandle {
        self.initial_value
    }

    #[must_use]
    pub const fn ignored_initial_value(self) -> StateHandle {
        self.ignored_initial_value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentStateUpdateRenderRecord {
    fiber: FiberId,
    hook: HookSlotId,
    queue: HookQueueId,
    dispatch: FunctionComponentStateDispatchHandle,
    lanes: FunctionComponentStateUpdateRenderLanes,
    previous_memoized_state: StateHandle,
    previous_base_state: StateHandle,
    previous_base_queue: Option<HookUpdateId>,
    memoized_state: StateHandle,
    base_state: StateHandle,
    base_queue: Option<HookUpdateId>,
    remaining_lanes: Lanes,
    applied_update_count: usize,
    skipped_update_count: usize,
    reverted_update_count: usize,
    eager_update_count: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseStateRenderRequest {
    initial_state: StateHandle,
    lanes: FunctionComponentStateUpdateRenderLanes,
}

impl FunctionComponentUseStateRenderRequest {
    #[must_use]
    pub const fn new(
        initial_state: StateHandle,
        lanes: FunctionComponentStateUpdateRenderLanes,
    ) -> Self {
        Self {
            initial_state,
            lanes,
        }
    }

    #[must_use]
    pub const fn initial_state(self) -> StateHandle {
        self.initial_state
    }

    #[must_use]
    pub const fn lanes(self) -> FunctionComponentStateUpdateRenderLanes {
        self.lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseReducerRenderRequest {
    reducer: FunctionComponentReducerHandle,
    initial_state: StateHandle,
    lanes: FunctionComponentStateUpdateRenderLanes,
}

impl FunctionComponentUseReducerRenderRequest {
    #[must_use]
    pub const fn new(
        reducer: FunctionComponentReducerHandle,
        initial_state: StateHandle,
        lanes: FunctionComponentStateUpdateRenderLanes,
    ) -> Self {
        Self {
            reducer,
            initial_state,
            lanes,
        }
    }

    #[must_use]
    pub const fn reducer(self) -> FunctionComponentReducerHandle {
        self.reducer
    }

    #[must_use]
    pub const fn initial_state(self) -> StateHandle {
        self.initial_state
    }

    #[must_use]
    pub const fn lanes(self) -> FunctionComponentStateUpdateRenderLanes {
        self.lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseMemoRenderRequest {
    value: StateHandle,
    dependencies: HookEffectDependencies,
}

impl FunctionComponentUseMemoRenderRequest {
    #[must_use]
    pub const fn new(value: StateHandle, dependencies: HookEffectDependencies) -> Self {
        Self {
            value,
            dependencies,
        }
    }

    #[must_use]
    pub const fn value(self) -> StateHandle {
        self.value
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseCallbackRenderRequest {
    callback: FunctionComponentCallbackHandle,
    dependencies: HookEffectDependencies,
}

impl FunctionComponentUseCallbackRenderRequest {
    #[must_use]
    pub const fn new(
        callback: FunctionComponentCallbackHandle,
        dependencies: HookEffectDependencies,
    ) -> Self {
        Self {
            callback,
            dependencies,
        }
    }

    #[must_use]
    pub const fn callback(self) -> FunctionComponentCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseEffectRenderRequest {
    create: HookEffectCallbackHandle,
    dependencies: HookEffectDependencies,
}

impl FunctionComponentUseEffectRenderRequest {
    #[must_use]
    pub const fn new(
        create: HookEffectCallbackHandle,
        dependencies: HookEffectDependencies,
    ) -> Self {
        Self {
            create,
            dependencies,
        }
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseRefRenderRequest {
    initial_value: StateHandle,
}

impl FunctionComponentUseRefRenderRequest {
    #[must_use]
    pub const fn new(initial_value: StateHandle) -> Self {
        Self { initial_value }
    }

    #[must_use]
    pub const fn initial_value(self) -> StateHandle {
        self.initial_value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentReducerUpdateRenderRecord {
    fiber: FiberId,
    hook: HookSlotId,
    queue: HookQueueId,
    dispatch: FunctionComponentStateDispatchHandle,
    reducer: FunctionComponentReducerHandle,
    lanes: FunctionComponentStateUpdateRenderLanes,
    previous_memoized_state: StateHandle,
    previous_base_state: StateHandle,
    previous_base_queue: Option<HookUpdateId>,
    memoized_state: StateHandle,
    base_state: StateHandle,
    base_queue: Option<HookUpdateId>,
    remaining_lanes: Lanes,
    applied_update_count: usize,
    skipped_update_count: usize,
    reverted_update_count: usize,
    eager_update_count: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseStateHookRenderRecord {
    Mount(FunctionComponentStateHookRecord),
    Update(FunctionComponentStateUpdateRenderRecord),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseReducerHookRenderRecord {
    Mount(FunctionComponentReducerHookRecord),
    Update(FunctionComponentReducerUpdateRenderRecord),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseMemoHookRenderRecord {
    Mount(FunctionComponentMemoHookRecord),
    Update(FunctionComponentMemoUpdateRecord),
}

impl FunctionComponentUseMemoHookRenderRecord {
    #[must_use]
    pub const fn phase(self) -> FunctionComponentHookRenderPhase {
        match self {
            Self::Mount(_) => FunctionComponentHookRenderPhase::Mount,
            Self::Update(_) => FunctionComponentHookRenderPhase::Update,
        }
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        match self {
            Self::Mount(record) => record.hook(),
            Self::Update(record) => record.hook(),
        }
    }

    #[must_use]
    pub const fn value(self) -> StateHandle {
        match self {
            Self::Mount(record) => record.value(),
            Self::Update(record) => record.value(),
        }
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        match self {
            Self::Mount(record) => record.dependencies(),
            Self::Update(record) => record.dependencies(),
        }
    }

    #[must_use]
    pub const fn mount_record(self) -> Option<FunctionComponentMemoHookRecord> {
        match self {
            Self::Mount(record) => Some(record),
            Self::Update(_) => None,
        }
    }

    #[must_use]
    pub const fn update_record(self) -> Option<FunctionComponentMemoUpdateRecord> {
        match self {
            Self::Update(record) => Some(record),
            Self::Mount(_) => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseCallbackHookRenderRecord {
    Mount(FunctionComponentCallbackHookRecord),
    Update(FunctionComponentCallbackUpdateRecord),
}

impl FunctionComponentUseCallbackHookRenderRecord {
    #[must_use]
    pub const fn phase(self) -> FunctionComponentHookRenderPhase {
        match self {
            Self::Mount(_) => FunctionComponentHookRenderPhase::Mount,
            Self::Update(_) => FunctionComponentHookRenderPhase::Update,
        }
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        match self {
            Self::Mount(record) => record.hook(),
            Self::Update(record) => record.hook(),
        }
    }

    #[must_use]
    pub const fn callback(self) -> FunctionComponentCallbackHandle {
        match self {
            Self::Mount(record) => record.callback(),
            Self::Update(record) => record.callback(),
        }
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        match self {
            Self::Mount(record) => record.dependencies(),
            Self::Update(record) => record.dependencies(),
        }
    }

    #[must_use]
    pub const fn mount_record(self) -> Option<FunctionComponentCallbackHookRecord> {
        match self {
            Self::Mount(record) => Some(record),
            Self::Update(_) => None,
        }
    }

    #[must_use]
    pub const fn update_record(self) -> Option<FunctionComponentCallbackUpdateRecord> {
        match self {
            Self::Update(record) => Some(record),
            Self::Mount(_) => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseEffectHookRenderRecord {
    Mount(FunctionComponentEffectRegistration),
    Update(FunctionComponentEffectUpdateQueueRecord),
}

impl FunctionComponentUseEffectHookRenderRecord {
    #[must_use]
    pub const fn render_phase(self) -> FunctionComponentHookRenderPhase {
        match self {
            Self::Mount(_) => FunctionComponentHookRenderPhase::Mount,
            Self::Update(_) => FunctionComponentHookRenderPhase::Update,
        }
    }

    #[must_use]
    pub const fn effect_phase(self) -> FunctionComponentEffectPhase {
        match self {
            Self::Mount(record) => record.phase(),
            Self::Update(record) => record.phase(),
        }
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        match self {
            Self::Mount(record) => record.hook(),
            Self::Update(record) => record.hook(),
        }
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        match self {
            Self::Mount(record) => record.effect(),
            Self::Update(record) => record.effect(),
        }
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        match self {
            Self::Mount(record) => record.instance(),
            Self::Update(record) => record.instance(),
        }
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        match self {
            Self::Mount(record) => record.tag(),
            Self::Update(record) => record.tag(),
        }
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        match self {
            Self::Mount(record) => record.create(),
            Self::Update(record) => record.create(),
        }
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        match self {
            Self::Mount(record) => record.dependencies(),
            Self::Update(record) => record.dependencies(),
        }
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> Option<HookEffectDependencies> {
        match self {
            Self::Mount(_) => None,
            Self::Update(record) => Some(record.previous_dependencies()),
        }
    }

    #[must_use]
    pub const fn dependency_status(self) -> Option<FunctionComponentEffectDependencyStatus> {
        match self {
            Self::Mount(_) => None,
            Self::Update(record) => Some(record.dependency_status()),
        }
    }

    #[must_use]
    pub const fn accepted_for_pending_passive(self) -> bool {
        match self {
            Self::Mount(record) => {
                matches!(record.phase(), FunctionComponentEffectPhase::Passive)
                    && record.tag().fires_in_passive()
            }
            Self::Update(record) => record.accepted_for_pending_passive(),
        }
    }

    #[must_use]
    pub const fn mount_record(self) -> Option<FunctionComponentEffectRegistration> {
        match self {
            Self::Mount(record) => Some(record),
            Self::Update(_) => None,
        }
    }

    #[must_use]
    pub const fn update_record(self) -> Option<FunctionComponentEffectUpdateQueueRecord> {
        match self {
            Self::Update(record) => Some(record),
            Self::Mount(_) => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseRefHookRenderRecord {
    Mount(FunctionComponentRefHookRecord),
    Update(FunctionComponentRefUpdateRecord),
}

impl FunctionComponentUseRefHookRenderRecord {
    #[must_use]
    pub const fn phase(self) -> FunctionComponentHookRenderPhase {
        match self {
            Self::Mount(_) => FunctionComponentHookRenderPhase::Mount,
            Self::Update(_) => FunctionComponentHookRenderPhase::Update,
        }
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        match self {
            Self::Mount(record) => record.hook(),
            Self::Update(record) => record.hook(),
        }
    }

    #[must_use]
    pub const fn ref_object(self) -> FunctionComponentRefObjectHandle {
        match self {
            Self::Mount(record) => record.ref_object(),
            Self::Update(record) => record.ref_object(),
        }
    }

    #[must_use]
    pub const fn initial_value(self) -> StateHandle {
        match self {
            Self::Mount(record) => record.initial_value(),
            Self::Update(record) => record.initial_value(),
        }
    }

    #[must_use]
    pub const fn mount_record(self) -> Option<FunctionComponentRefHookRecord> {
        match self {
            Self::Mount(record) => Some(record),
            Self::Update(_) => None,
        }
    }

    #[must_use]
    pub const fn update_record(self) -> Option<FunctionComponentRefUpdateRecord> {
        match self {
            Self::Update(record) => Some(record),
            Self::Mount(_) => None,
        }
    }
}

impl FunctionComponentUseStateHookRenderRecord {
    #[must_use]
    pub const fn phase(self) -> FunctionComponentHookRenderPhase {
        match self {
            Self::Mount(_) => FunctionComponentHookRenderPhase::Mount,
            Self::Update(_) => FunctionComponentHookRenderPhase::Update,
        }
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        match self {
            Self::Mount(record) => record.hook(),
            Self::Update(record) => record.hook(),
        }
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        match self {
            Self::Mount(record) => record.queue(),
            Self::Update(record) => record.queue(),
        }
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        match self {
            Self::Mount(record) => record.dispatch(),
            Self::Update(record) => record.dispatch(),
        }
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        match self {
            Self::Mount(record) => record.memoized_state(),
            Self::Update(record) => record.memoized_state(),
        }
    }

    #[must_use]
    pub const fn base_state(self) -> StateHandle {
        match self {
            Self::Mount(record) => record.base_state(),
            Self::Update(record) => record.base_state(),
        }
    }

    #[must_use]
    pub const fn base_queue(self) -> Option<HookUpdateId> {
        match self {
            Self::Mount(record) => record.base_queue(),
            Self::Update(record) => record.base_queue(),
        }
    }

    #[must_use]
    pub const fn mount_record(self) -> Option<FunctionComponentStateHookRecord> {
        match self {
            Self::Mount(record) => Some(record),
            Self::Update(_) => None,
        }
    }

    #[must_use]
    pub const fn update_record(self) -> Option<FunctionComponentStateUpdateRenderRecord> {
        match self {
            Self::Update(record) => Some(record),
            Self::Mount(_) => None,
        }
    }
}

impl FunctionComponentUseReducerHookRenderRecord {
    #[must_use]
    pub const fn phase(self) -> FunctionComponentHookRenderPhase {
        match self {
            Self::Mount(_) => FunctionComponentHookRenderPhase::Mount,
            Self::Update(_) => FunctionComponentHookRenderPhase::Update,
        }
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        match self {
            Self::Mount(record) => record.hook(),
            Self::Update(record) => record.hook(),
        }
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        match self {
            Self::Mount(record) => record.queue(),
            Self::Update(record) => record.queue(),
        }
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        match self {
            Self::Mount(record) => record.dispatch(),
            Self::Update(record) => record.dispatch(),
        }
    }

    #[must_use]
    pub const fn reducer(self) -> FunctionComponentReducerHandle {
        match self {
            Self::Mount(record) => record.reducer(),
            Self::Update(record) => record.reducer(),
        }
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        match self {
            Self::Mount(record) => record.memoized_state(),
            Self::Update(record) => record.memoized_state(),
        }
    }

    #[must_use]
    pub const fn base_state(self) -> StateHandle {
        match self {
            Self::Mount(record) => record.base_state(),
            Self::Update(record) => record.base_state(),
        }
    }

    #[must_use]
    pub const fn base_queue(self) -> Option<HookUpdateId> {
        match self {
            Self::Mount(record) => record.base_queue(),
            Self::Update(record) => record.base_queue(),
        }
    }

    #[must_use]
    pub const fn mount_record(self) -> Option<FunctionComponentReducerHookRecord> {
        match self {
            Self::Mount(record) => Some(record),
            Self::Update(_) => None,
        }
    }

    #[must_use]
    pub const fn update_record(self) -> Option<FunctionComponentReducerUpdateRenderRecord> {
        match self {
            Self::Update(record) => Some(record),
            Self::Mount(_) => None,
        }
    }
}

impl FunctionComponentStateUpdateRenderRecord {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        self.queue
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }

    #[must_use]
    pub const fn lanes(self) -> FunctionComponentStateUpdateRenderLanes {
        self.lanes
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.lanes.render_lanes()
    }

    #[must_use]
    pub const fn root_render_lanes(self) -> Lanes {
        self.lanes.root_render_lanes()
    }

    #[must_use]
    pub const fn previous_memoized_state(self) -> StateHandle {
        self.previous_memoized_state
    }

    #[must_use]
    pub const fn previous_base_state(self) -> StateHandle {
        self.previous_base_state
    }

    #[must_use]
    pub const fn previous_base_queue(self) -> Option<HookUpdateId> {
        self.previous_base_queue
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub const fn resulting_state(self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub const fn base_state(self) -> StateHandle {
        self.base_state
    }

    #[must_use]
    pub const fn base_queue(self) -> Option<HookUpdateId> {
        self.base_queue
    }

    #[must_use]
    pub const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub const fn applied_update_count(self) -> usize {
        self.applied_update_count
    }

    #[must_use]
    pub const fn skipped_update_count(self) -> usize {
        self.skipped_update_count
    }

    #[must_use]
    pub const fn reverted_update_count(self) -> usize {
        self.reverted_update_count
    }

    #[must_use]
    pub const fn eager_update_count(self) -> usize {
        self.eager_update_count
    }
}

impl FunctionComponentReducerUpdateRenderRecord {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        self.queue
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }

    #[must_use]
    pub const fn reducer(self) -> FunctionComponentReducerHandle {
        self.reducer
    }

    #[must_use]
    pub const fn lanes(self) -> FunctionComponentStateUpdateRenderLanes {
        self.lanes
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.lanes.render_lanes()
    }

    #[must_use]
    pub const fn root_render_lanes(self) -> Lanes {
        self.lanes.root_render_lanes()
    }

    #[must_use]
    pub const fn previous_memoized_state(self) -> StateHandle {
        self.previous_memoized_state
    }

    #[must_use]
    pub const fn previous_base_state(self) -> StateHandle {
        self.previous_base_state
    }

    #[must_use]
    pub const fn previous_base_queue(self) -> Option<HookUpdateId> {
        self.previous_base_queue
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub const fn resulting_state(self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub const fn base_state(self) -> StateHandle {
        self.base_state
    }

    #[must_use]
    pub const fn base_queue(self) -> Option<HookUpdateId> {
        self.base_queue
    }

    #[must_use]
    pub const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub const fn applied_update_count(self) -> usize {
        self.applied_update_count
    }

    #[must_use]
    pub const fn skipped_update_count(self) -> usize {
        self.skipped_update_count
    }

    #[must_use]
    pub const fn reverted_update_count(self) -> usize {
        self.reverted_update_count
    }

    #[must_use]
    pub const fn eager_update_count(self) -> usize {
        self.eager_update_count
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentHookRenderPhase {
    Mount,
    Update,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentHookRenderState {
    phase: FunctionComponentHookRenderPhase,
    render_fiber: FiberId,
    current: Option<FiberId>,
    current_list: Option<HookListId>,
    work_in_progress_list: HookListId,
}

impl FunctionComponentHookRenderState {
    #[must_use]
    pub const fn phase(self) -> FunctionComponentHookRenderPhase {
        self.phase
    }

    #[must_use]
    pub const fn render_fiber(self) -> FiberId {
        self.render_fiber
    }

    #[must_use]
    pub const fn current(self) -> Option<FiberId> {
        self.current
    }

    #[must_use]
    pub const fn current_list(self) -> Option<HookListId> {
        self.current_list
    }

    #[must_use]
    pub const fn work_in_progress_list(self) -> HookListId {
        self.work_in_progress_list
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentContextRenderState {
    render_fiber: FiberId,
    render_lanes: Lanes,
    context_count: usize,
    stack_depth: usize,
    start_read_index: usize,
    start_dependency_index: usize,
}

impl FunctionComponentContextRenderState {
    #[must_use]
    pub const fn render_fiber(self) -> FiberId {
        self.render_fiber
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn context_count(self) -> usize {
        self.context_count
    }

    #[must_use]
    pub const fn stack_depth(self) -> usize {
        self.stack_depth
    }

    #[must_use]
    pub const fn start_read_index(self) -> usize {
        self.start_read_index
    }

    #[must_use]
    pub const fn start_dependency_index(self) -> usize {
        self.start_dependency_index
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentContextDependencyRecord {
    handle: FunctionComponentContextDependencyHandle,
    fiber: FiberId,
    context: ContextHandle,
    memoized_value: ContextValueHandle,
    read_index: usize,
    render_read_index: usize,
    render_lanes: Lanes,
    dependency_lanes: Lanes,
    next: FunctionComponentContextDependencyHandle,
    renderer_visible_propagation: bool,
    propagation_flags: FiberFlags,
}

impl FunctionComponentContextDependencyRecord {
    #[must_use]
    pub const fn handle(self) -> FunctionComponentContextDependencyHandle {
        self.handle
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
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
    pub const fn read_index(self) -> usize {
        self.read_index
    }

    #[must_use]
    pub const fn render_read_index(self) -> usize {
        self.render_read_index
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn dependency_lanes(self) -> Lanes {
        self.dependency_lanes
    }

    #[must_use]
    pub const fn next(self) -> FunctionComponentContextDependencyHandle {
        self.next
    }

    #[must_use]
    pub const fn has_next(self) -> bool {
        self.next.is_some()
    }

    #[must_use]
    pub const fn renderer_visible_propagation(self) -> bool {
        self.renderer_visible_propagation
    }

    #[must_use]
    pub const fn propagation_flags(self) -> FiberFlags {
        self.propagation_flags
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentContextReadRecord {
    read_index: usize,
    fiber: FiberId,
    context: ContextHandle,
    default_value: ContextValueHandle,
    value: ContextValueHandle,
    active_provider_count: usize,
    dependency: FunctionComponentContextDependencyHandle,
}

impl FunctionComponentContextReadRecord {
    #[must_use]
    pub const fn read_index(self) -> usize {
        self.read_index
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn default_value(self) -> ContextValueHandle {
        self.default_value
    }

    #[must_use]
    pub const fn value(self) -> ContextValueHandle {
        self.value
    }

    #[must_use]
    pub const fn active_provider_count(self) -> usize {
        self.active_provider_count
    }

    #[must_use]
    pub const fn has_active_provider(self) -> bool {
        self.active_provider_count != 0
    }

    #[must_use]
    pub const fn dependency(self) -> FunctionComponentContextDependencyHandle {
        self.dependency
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentContextChangePropagationRequest {
    change: ContextValueChange,
    propagation_lanes: Lanes,
}

impl FunctionComponentContextChangePropagationRequest {
    #[must_use]
    pub const fn new(change: ContextValueChange, propagation_lanes: Lanes) -> Self {
        Self {
            change,
            propagation_lanes,
        }
    }

    #[must_use]
    pub const fn change(self) -> ContextValueChange {
        self.change
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.change.context()
    }

    #[must_use]
    pub const fn previous_value(self) -> ContextValueHandle {
        self.change.previous_value()
    }

    #[must_use]
    pub const fn next_value(self) -> ContextValueHandle {
        self.change.next_value()
    }

    #[must_use]
    pub const fn propagation_lanes(self) -> Lanes {
        self.propagation_lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentContextChangePropagationDependencyRecord {
    dependency: FunctionComponentContextDependencyHandle,
    fiber: FiberId,
    context: ContextHandle,
    memoized_value: ContextValueHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
    previous_dependency_lanes: Lanes,
    dependency_lanes: Lanes,
    root: FiberRootId,
}

impl FunctionComponentContextChangePropagationDependencyRecord {
    #[must_use]
    pub const fn dependency(self) -> FunctionComponentContextDependencyHandle {
        self.dependency
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
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
    pub const fn root(self) -> FiberRootId {
        self.root
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentContextChangePropagationRecord {
    render: FunctionComponentRenderRecord,
    change: ContextValueChange,
    propagation_lanes: Lanes,
    scanned_dependency_count: usize,
    marked_dependencies: Vec<FunctionComponentContextChangePropagationDependencyRecord>,
    roots: Vec<FiberRootId>,
}

impl FunctionComponentContextChangePropagationRecord {
    #[must_use]
    pub const fn render(&self) -> FunctionComponentRenderRecord {
        self.render
    }

    #[must_use]
    pub const fn change(&self) -> ContextValueChange {
        self.change
    }

    #[must_use]
    pub const fn context(&self) -> ContextHandle {
        self.change.context()
    }

    #[must_use]
    pub const fn previous_value(&self) -> ContextValueHandle {
        self.change.previous_value()
    }

    #[must_use]
    pub const fn next_value(&self) -> ContextValueHandle {
        self.change.next_value()
    }

    #[must_use]
    pub const fn propagation_lanes(&self) -> Lanes {
        self.propagation_lanes
    }

    #[must_use]
    pub const fn scanned_dependency_count(&self) -> usize {
        self.scanned_dependency_count
    }

    #[must_use]
    pub fn marked_dependencies(
        &self,
    ) -> &[FunctionComponentContextChangePropagationDependencyRecord] {
        &self.marked_dependencies
    }

    #[must_use]
    pub fn roots(&self) -> &[FiberRootId] {
        &self.roots
    }

    #[must_use]
    pub fn marked_dependency_count(&self) -> usize {
        self.marked_dependencies.len()
    }

    #[must_use]
    pub fn root_count(&self) -> usize {
        self.roots.len()
    }

    #[must_use]
    pub fn has_marked_dependencies(&self) -> bool {
        !self.marked_dependencies.is_empty()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum FunctionComponentContextChangePropagationError {
    FiberTopology(FiberTopologyError),
    ConcurrentUpdate(ConcurrentUpdateError),
    MissingContextDependencies {
        fiber: FiberId,
    },
    EmptyPropagationLanes {
        context: ContextHandle,
    },
    UnsupportedDependencyFiberTag {
        dependency: FunctionComponentContextDependencyHandle,
        fiber: FiberId,
        tag: FiberTag,
    },
}

impl Display for FunctionComponentContextChangePropagationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ConcurrentUpdate(error) => Display::fmt(error, formatter),
            Self::MissingContextDependencies { fiber } => write!(
                formatter,
                "function component fiber {} has no private context dependencies to propagate",
                fiber.slot().get()
            ),
            Self::EmptyPropagationLanes { context } => write!(
                formatter,
                "context {} propagation requires at least one lane",
                context.raw()
            ),
            Self::UnsupportedDependencyFiberTag {
                dependency,
                fiber,
                tag,
            } => write!(
                formatter,
                "context dependency {} belongs to fiber {} with unsupported tag {:?}; private context propagation admits FunctionComponent only",
                dependency.raw(),
                fiber.slot().get(),
                tag
            ),
        }
    }
}

impl Error for FunctionComponentContextChangePropagationError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::ConcurrentUpdate(error) => Some(error),
            Self::MissingContextDependencies { .. }
            | Self::EmptyPropagationLanes { .. }
            | Self::UnsupportedDependencyFiberTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for FunctionComponentContextChangePropagationError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<ConcurrentUpdateError> for FunctionComponentContextChangePropagationError {
    fn from(error: ConcurrentUpdateError) -> Self {
        Self::ConcurrentUpdate(error)
    }
}

#[derive(Debug, Default)]
pub(crate) struct FunctionComponentContextRenderStore {
    stack: ContextStack,
    reads: Vec<FunctionComponentContextReadRecord>,
    dependencies: Vec<FunctionComponentContextDependencyRecord>,
}

impl FunctionComponentContextRenderStore {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub const fn context_stack(&self) -> &ContextStack {
        &self.stack
    }

    pub fn context_stack_mut(&mut self) -> &mut ContextStack {
        &mut self.stack
    }

    pub fn create_context(&mut self, default_value: ContextValueHandle) -> ContextHandle {
        self.stack.create_context(default_value)
    }

    #[must_use]
    pub fn stack_depth(&self) -> usize {
        self.stack.stack_depth()
    }

    pub fn active_provider_count(
        &self,
        context: ContextHandle,
    ) -> Result<usize, ContextStackError> {
        Ok(self.stack.context_slot(context)?.active_provider_count())
    }

    pub fn push_provider(
        &mut self,
        context: ContextHandle,
        value: ContextValueHandle,
    ) -> Result<ContextStackSnapshot, ContextStackError> {
        self.stack.push_provider(context, value)
    }

    pub fn restore_snapshot(
        &mut self,
        snapshot: ContextStackSnapshot,
    ) -> Result<(), ContextStackError> {
        self.stack.restore_snapshot(snapshot)
    }

    pub fn current_value(
        &self,
        context: ContextHandle,
    ) -> Result<ContextValueHandle, ContextStackError> {
        self.stack.current_value(context)
    }

    pub fn prepare_render_state(
        &self,
        work_in_progress: FiberId,
        render_lanes: Lanes,
    ) -> FunctionComponentContextRenderState {
        FunctionComponentContextRenderState {
            render_fiber: work_in_progress,
            render_lanes,
            context_count: self.stack.context_count(),
            stack_depth: self.stack.stack_depth(),
            start_read_index: self.reads.len(),
            start_dependency_index: self.dependencies.len(),
        }
    }

    pub fn read_context(
        &mut self,
        state: FunctionComponentContextRenderState,
        context: ContextHandle,
    ) -> Result<FunctionComponentContextReadRecord, FunctionComponentRenderError> {
        let slot = self.stack.context_slot(context).map_err(|error| {
            FunctionComponentRenderError::context_stack(state.render_fiber(), error)
        })?;
        let read_index = self.reads.len();
        let dependency =
            self.push_context_dependency(state, context, slot.current_value(), read_index);
        let record = FunctionComponentContextReadRecord {
            read_index,
            fiber: state.render_fiber(),
            context,
            default_value: slot.default_value(),
            value: slot.current_value(),
            active_provider_count: slot.active_provider_count(),
            dependency,
        };
        self.reads.push(record);
        Ok(record)
    }

    fn push_context_dependency(
        &mut self,
        state: FunctionComponentContextRenderState,
        context: ContextHandle,
        memoized_value: ContextValueHandle,
        read_index: usize,
    ) -> FunctionComponentContextDependencyHandle {
        let raw = u64::try_from(self.dependencies.len())
            .expect("context dependency count does not fit in u64")
            .checked_add(1)
            .expect("context dependency handle counter wrapped");
        let handle = FunctionComponentContextDependencyHandle::from_raw(raw);
        if self.dependencies.len() > state.start_dependency_index()
            && let Some(previous) = self.dependencies.last_mut()
        {
            previous.next = handle;
        }
        self.dependencies
            .push(FunctionComponentContextDependencyRecord {
                handle,
                fiber: state.render_fiber(),
                context,
                memoized_value,
                read_index,
                render_read_index: read_index - state.start_read_index(),
                render_lanes: state.render_lanes,
                dependency_lanes: Lanes::NO,
                next: FunctionComponentContextDependencyHandle::NONE,
                renderer_visible_propagation: false,
                propagation_flags: FiberFlags::NO,
            });
        handle
    }

    #[must_use]
    pub fn context_reads(&self) -> &[FunctionComponentContextReadRecord] {
        &self.reads
    }

    #[must_use]
    pub fn context_dependencies(&self) -> &[FunctionComponentContextDependencyRecord] {
        &self.dependencies
    }

    #[must_use]
    pub fn context_dependency(
        &self,
        handle: FunctionComponentContextDependencyHandle,
    ) -> Option<FunctionComponentContextDependencyRecord> {
        if handle.is_none() {
            return None;
        }
        let index = usize::try_from(handle.raw().checked_sub(1)?).ok()?;
        self.dependencies.get(index).copied()
    }

    #[must_use]
    pub fn context_reads_for_record(
        &self,
        record: FunctionComponentRenderRecord,
    ) -> &[FunctionComponentContextReadRecord] {
        let Some(state) = record.context_state() else {
            return &[];
        };
        let start = state.start_read_index();
        let end = start + record.context_read_count();
        &self.reads[start..end]
    }

    #[must_use]
    pub fn context_dependencies_for_record(
        &self,
        record: FunctionComponentRenderRecord,
    ) -> &[FunctionComponentContextDependencyRecord] {
        let Some(state) = record.context_state() else {
            return &[];
        };
        let start = state.start_dependency_index();
        let end = start + record.context_read_count();
        &self.dependencies[start..end]
    }
}

pub(crate) struct FunctionComponentContextRenderReader<'a> {
    store: &'a mut FunctionComponentContextRenderStore,
    state: FunctionComponentContextRenderState,
}

impl FunctionComponentContextRenderReader<'_> {
    #[must_use]
    pub const fn state(&self) -> FunctionComponentContextRenderState {
        self.state
    }

    #[must_use]
    pub fn read_count(&self) -> usize {
        self.store.context_reads().len() - self.state.start_read_index()
    }

    pub fn use_context(
        &mut self,
        context: ContextHandle,
    ) -> Result<FunctionComponentContextReadRecord, FunctionComponentRenderError> {
        self.store.read_context(self.state, context)
    }

    pub fn read_context(
        &mut self,
        context: ContextHandle,
    ) -> Result<FunctionComponentContextReadRecord, FunctionComponentRenderError> {
        self.use_context(context)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FunctionComponentCurrentHookList {
    fiber: FiberId,
    list: HookListId,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FunctionComponentEffectRingBinding {
    list: HookListId,
    ring: HookEffectRing,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FunctionComponentPendingEffectQueueBinding {
    fiber: FiberId,
    state: FunctionComponentHookRenderState,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FunctionComponentMemoHookBinding {
    hook: HookSlotId,
    value: StateHandle,
    dependencies: HookEffectDependencies,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentReducerDispatchQueueDiagnostics {
    hook_list: HookListId,
    records: Vec<FunctionComponentReducerDispatchQueueRecord>,
}

impl FunctionComponentReducerDispatchQueueDiagnostics {
    #[must_use]
    pub const fn hook_list(&self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub fn records(&self) -> &[FunctionComponentReducerDispatchQueueRecord] {
        &self.records
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub fn eager_state_blocker_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record
                    .eager_state_blocker()
                    .blocks_eager_state_computation()
            })
            .count()
    }

    #[must_use]
    pub fn non_executed_dispatch_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.non_execution().keeps_dispatch_blocked())
            .count()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentMemoUpdateDiagnostics {
    hook_list: HookListId,
    records: Vec<FunctionComponentMemoUpdateDiagnosticRecord>,
}

impl FunctionComponentMemoUpdateDiagnostics {
    #[must_use]
    pub const fn hook_list(&self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub fn records(&self) -> &[FunctionComponentMemoUpdateDiagnosticRecord] {
        &self.records
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub fn reuse_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.reused_previous_value())
            .count()
    }

    #[must_use]
    pub fn recompute_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.recomputed_value())
            .count()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentCallbackUpdateDiagnostics {
    hook_list: HookListId,
    records: Vec<FunctionComponentCallbackUpdateDiagnosticRecord>,
}

impl FunctionComponentCallbackUpdateDiagnostics {
    #[must_use]
    pub const fn hook_list(&self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub fn records(&self) -> &[FunctionComponentCallbackUpdateDiagnosticRecord] {
        &self.records
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub fn reuse_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.reused_previous_callback())
            .count()
    }

    #[must_use]
    pub fn replacement_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.replaced_callback())
            .count()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FunctionComponentRefHookBinding {
    hook: HookSlotId,
    ref_object: FunctionComponentRefObjectHandle,
    initial_value: StateHandle,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentEffectUpdateQueue {
    hook_list: HookListId,
    records: Vec<FunctionComponentEffectUpdateQueueRecord>,
}

#[allow(
    dead_code,
    reason = "private function-component effect update queue canary for future committed effect ownership"
)]
impl FunctionComponentEffectUpdateQueue {
    #[must_use]
    pub const fn hook_list(&self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub fn records(&self) -> &[FunctionComponentEffectUpdateQueueRecord] {
        &self.records
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub fn changed_dependency_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.dependencies_changed())
            .count()
    }

    #[must_use]
    pub fn unchanged_dependency_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.dependencies_unchanged())
            .count()
    }

    #[must_use]
    pub fn accepted_passive_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.accepted_for_pending_passive())
            .count()
    }

    #[must_use]
    pub fn accepted_layout_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.accepted_for_layout_commit())
            .count()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentEffectUpdateQueueRecord {
    update_index: usize,
    fiber: FiberId,
    hook_list: HookListId,
    hook: HookSlotId,
    previous_effect: HookEffectId,
    effect: HookEffectId,
    instance: HookEffectInstanceId,
    phase: FunctionComponentEffectPhase,
    tag: HookEffectFlags,
    create: HookEffectCallbackHandle,
    destroy: Option<HookEffectCallbackHandle>,
    previous_dependencies: HookEffectDependencies,
    dependencies: HookEffectDependencies,
    dependency_status: FunctionComponentEffectDependencyStatus,
}

#[allow(
    dead_code,
    reason = "private function-component effect update queue canary for future committed effect ownership"
)]
impl FunctionComponentEffectUpdateQueueRecord {
    #[must_use]
    pub const fn update_index(self) -> usize {
        self.update_index
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn previous_effect(self) -> HookEffectId {
        self.previous_effect
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn phase(self) -> FunctionComponentEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> HookEffectDependencies {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> FunctionComponentEffectDependencyStatus {
        self.dependency_status
    }

    #[must_use]
    pub const fn dependencies_changed(self) -> bool {
        matches!(
            self.dependency_status,
            FunctionComponentEffectDependencyStatus::Changed
        )
    }

    #[must_use]
    pub const fn dependencies_unchanged(self) -> bool {
        matches!(
            self.dependency_status,
            FunctionComponentEffectDependencyStatus::Unchanged
        )
    }

    #[must_use]
    pub const fn accepted_for_pending_passive(self) -> bool {
        matches!(self.phase, FunctionComponentEffectPhase::Passive) && self.tag.fires_in_passive()
    }

    #[must_use]
    pub const fn accepted_for_layout_commit(self) -> bool {
        matches!(self.phase, FunctionComponentEffectPhase::Layout) && self.tag.fires_in_layout()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentEffectDestroyHandlePersistenceRecord {
    update_index: usize,
    fiber: FiberId,
    hook_list: HookListId,
    hook: HookSlotId,
    previous_effect: HookEffectId,
    effect: HookEffectId,
    previous_instance: HookEffectInstanceId,
    retained_instance: HookEffectInstanceId,
    phase: FunctionComponentEffectPhase,
    tag: HookEffectFlags,
    recorded_destroy: Option<HookEffectCallbackHandle>,
    previous_destroy: Option<HookEffectCallbackHandle>,
    retained_destroy: Option<HookEffectCallbackHandle>,
    dependency_status: FunctionComponentEffectDependencyStatus,
    accepted_for_pending_passive: bool,
    accepted_for_layout_commit: bool,
}

#[allow(
    dead_code,
    reason = "private effect destroy-handle provenance canary for update lifecycle ordering"
)]
impl FunctionComponentEffectDestroyHandlePersistenceRecord {
    #[must_use]
    pub const fn update_index(self) -> usize {
        self.update_index
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn previous_effect(self) -> HookEffectId {
        self.previous_effect
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn previous_instance(self) -> HookEffectInstanceId {
        self.previous_instance
    }

    #[must_use]
    pub const fn retained_instance(self) -> HookEffectInstanceId {
        self.retained_instance
    }

    #[must_use]
    pub const fn phase(self) -> FunctionComponentEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn recorded_destroy(self) -> Option<HookEffectCallbackHandle> {
        self.recorded_destroy
    }

    #[must_use]
    pub const fn previous_destroy(self) -> Option<HookEffectCallbackHandle> {
        self.previous_destroy
    }

    #[must_use]
    pub const fn retained_destroy(self) -> Option<HookEffectCallbackHandle> {
        self.retained_destroy
    }

    #[must_use]
    pub const fn dependency_status(self) -> FunctionComponentEffectDependencyStatus {
        self.dependency_status
    }

    #[must_use]
    pub const fn accepted_for_pending_passive(self) -> bool {
        self.accepted_for_pending_passive
    }

    #[must_use]
    pub const fn accepted_for_layout_commit(self) -> bool {
        self.accepted_for_layout_commit
    }

    #[must_use]
    pub fn instance_reused(self) -> bool {
        self.previous_instance == self.retained_instance
    }

    #[must_use]
    pub fn destroy_handle_matches_recorded_update_metadata(self) -> bool {
        self.recorded_destroy == self.previous_destroy
            && self.recorded_destroy == self.retained_destroy
    }

    #[must_use]
    pub fn proves_destroy_handle_persisted(self) -> bool {
        self.instance_reused() && self.destroy_handle_matches_recorded_update_metadata()
    }

    #[must_use]
    pub fn proves_update_unmount_metadata_consumes_previous_destroy(self) -> bool {
        self.proves_destroy_handle_persisted()
            && self.recorded_destroy.is_some()
            && (self.accepted_for_pending_passive || self.accepted_for_layout_commit)
    }

    #[must_use]
    pub fn proves_removed_effect_retains_previous_destroy(self) -> bool {
        self.proves_destroy_handle_persisted()
            && self.recorded_destroy.is_some()
            && matches!(
                self.dependency_status,
                FunctionComponentEffectDependencyStatus::Unchanged
            )
            && !self.accepted_for_pending_passive
            && !self.accepted_for_layout_commit
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentCommittedEffectRecord {
    effect_index: usize,
    hook_list: HookListId,
    effect: HookEffectId,
    previous_effect: Option<HookEffectId>,
    instance: HookEffectInstanceId,
    phase: FunctionComponentEffectPhase,
    tag: HookEffectFlags,
    create: HookEffectCallbackHandle,
    destroy: Option<HookEffectCallbackHandle>,
    previous_dependencies: Option<HookEffectDependencies>,
    dependencies: HookEffectDependencies,
    dependency_status: Option<FunctionComponentEffectDependencyStatus>,
    lanes: Lanes,
}

#[allow(
    dead_code,
    reason = "private committed function-component effect queue records for future passive traversal"
)]
impl FunctionComponentCommittedEffectRecord {
    #[must_use]
    pub const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn phase(self) -> FunctionComponentEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> Option<HookEffectDependencies> {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> Option<FunctionComponentEffectDependencyStatus> {
        self.dependency_status
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub const fn matches_flags(self, flags: HookEffectFlags) -> bool {
        self.tag.contains_all(flags)
    }

    #[must_use]
    pub const fn accepted_for_pending_passive(self) -> bool {
        matches!(self.phase, FunctionComponentEffectPhase::Passive) && self.tag.fires_in_passive()
    }

    #[must_use]
    pub const fn accepted_for_layout_commit(self) -> bool {
        matches!(self.phase, FunctionComponentEffectPhase::Layout) && self.tag.fires_in_layout()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentCommittedEffectQueue {
    fiber: FiberId,
    phase: FunctionComponentHookRenderPhase,
    hook_list: HookListId,
    lanes: Lanes,
    records: Vec<FunctionComponentCommittedEffectRecord>,
}

#[allow(
    dead_code,
    reason = "private committed function-component effect queue records for future passive traversal"
)]
impl FunctionComponentCommittedEffectQueue {
    #[must_use]
    pub const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn phase(&self) -> FunctionComponentHookRenderPhase {
        self.phase
    }

    #[must_use]
    pub const fn hook_list(&self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub fn records(&self) -> &[FunctionComponentCommittedEffectRecord] {
        &self.records
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub fn accepted_passive_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.accepted_for_pending_passive())
            .count()
    }

    #[must_use]
    pub fn accepted_layout_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.accepted_for_layout_commit())
            .count()
    }

    #[must_use]
    pub fn passive_effect_metadata(
        &self,
        flags: HookEffectFlags,
    ) -> Vec<FunctionComponentPassiveEffectMetadata> {
        if self.lanes.is_empty() {
            return Vec::new();
        }

        let mut accepted = Vec::new();
        for record in &self.records {
            if record.phase() != FunctionComponentEffectPhase::Passive {
                continue;
            }

            if !record.matches_flags(flags) {
                continue;
            }

            accepted.push(FunctionComponentPassiveEffectMetadata {
                fiber: self.fiber,
                render_phase: self.phase,
                hook_list: record.hook_list(),
                effect_index: accepted.len(),
                effect: record.effect(),
                previous_effect: record.previous_effect(),
                instance: record.instance(),
                tag: record.tag(),
                create: record.create(),
                destroy: record.destroy(),
                dependencies: record.dependencies(),
                lanes: self.lanes,
            });
        }
        accepted
    }

    #[must_use]
    pub fn layout_effect_metadata(
        &self,
        flags: HookEffectFlags,
    ) -> Vec<FunctionComponentLayoutEffectMetadata> {
        if self.lanes.is_empty() {
            return Vec::new();
        }

        let mut accepted = Vec::new();
        for record in &self.records {
            if record.phase() != FunctionComponentEffectPhase::Layout
                || !record.matches_flags(flags)
            {
                continue;
            }

            accepted.push(FunctionComponentLayoutEffectMetadata {
                fiber: self.fiber,
                render_phase: self.phase,
                hook_list: record.hook_list(),
                effect_index: record.effect_index(),
                effect: record.effect(),
                previous_effect: record.previous_effect(),
                instance: record.instance(),
                tag: record.tag(),
                create: record.create(),
                destroy: record.destroy(),
                previous_dependencies: record.previous_dependencies(),
                dependencies: record.dependencies(),
                dependency_status: record.dependency_status(),
                lanes: self.lanes,
            });
        }
        accepted
    }
}

#[derive(Debug, Clone)]
pub(crate) struct FunctionComponentHookRenderStore {
    hook_lists: HookListArena,
    hook_effects: HookEffectArena,
    state_queues: FunctionComponentStateQueueStore,
    current_lists: Vec<FunctionComponentCurrentHookList>,
    effect_rings: Vec<FunctionComponentEffectRingBinding>,
    effect_update_queues: Vec<FunctionComponentEffectUpdateQueue>,
    pending_effect_queues: Vec<FunctionComponentPendingEffectQueueBinding>,
    committed_effect_queues: Vec<FunctionComponentCommittedEffectQueue>,
    memo_hooks: Vec<FunctionComponentMemoHookBinding>,
    reducer_dispatch_diagnostics: Vec<FunctionComponentReducerDispatchQueueDiagnostics>,
    memo_update_diagnostics: Vec<FunctionComponentMemoUpdateDiagnostics>,
    callback_update_diagnostics: Vec<FunctionComponentCallbackUpdateDiagnostics>,
    ref_hooks: Vec<FunctionComponentRefHookBinding>,
    state_dispatches: Vec<FunctionComponentStateDispatchBinding>,
    next_state_dispatch_raw: u64,
    next_ref_object_raw: u64,
}

impl Default for FunctionComponentHookRenderStore {
    fn default() -> Self {
        Self {
            hook_lists: HookListArena::default(),
            hook_effects: HookEffectArena::default(),
            state_queues: FunctionComponentStateQueueStore::default(),
            current_lists: Vec::new(),
            effect_rings: Vec::new(),
            effect_update_queues: Vec::new(),
            pending_effect_queues: Vec::new(),
            committed_effect_queues: Vec::new(),
            memo_hooks: Vec::new(),
            reducer_dispatch_diagnostics: Vec::new(),
            memo_update_diagnostics: Vec::new(),
            callback_update_diagnostics: Vec::new(),
            ref_hooks: Vec::new(),
            state_dispatches: Vec::new(),
            next_state_dispatch_raw: 1,
            next_ref_object_raw: 1,
        }
    }
}

impl FunctionComponentHookRenderStore {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub const fn hook_lists(&self) -> &HookListArena {
        &self.hook_lists
    }

    pub fn hook_lists_mut(&mut self) -> &mut HookListArena {
        &mut self.hook_lists
    }

    #[must_use]
    pub const fn hook_effects(&self) -> &HookEffectArena {
        &self.hook_effects
    }

    pub fn hook_effects_mut(&mut self) -> &mut HookEffectArena {
        &mut self.hook_effects
    }

    #[must_use]
    pub const fn state_queues(&self) -> &FunctionComponentStateQueueStore {
        &self.state_queues
    }

    pub fn state_queues_mut(&mut self) -> &mut FunctionComponentStateQueueStore {
        &mut self.state_queues
    }

    pub fn create_current_list(&mut self, fiber: FiberId) -> HookListId {
        let list = self.hook_lists.create_list(fiber);
        self.bind_current_list_unchecked(fiber, list);
        list
    }

    #[must_use]
    pub fn current_list(&self, fiber: FiberId) -> Option<HookListId> {
        self.current_lists
            .iter()
            .find(|binding| binding.fiber == fiber)
            .map(|binding| binding.list)
    }

    #[must_use]
    pub fn effect_ring(&self, list: HookListId) -> Option<HookEffectRing> {
        self.effect_rings
            .iter()
            .find(|binding| binding.list == list)
            .map(|binding| binding.ring)
    }

    pub fn effect_update_queue(
        &self,
        state: FunctionComponentHookRenderState,
    ) -> Result<Option<&FunctionComponentEffectUpdateQueue>, FunctionComponentRenderError> {
        self.hook_lists
            .list(state.work_in_progress_list())
            .map_err(|error| {
                FunctionComponentRenderError::hook_list(state.render_fiber(), error)
            })?;

        Ok(self
            .effect_update_queues
            .iter()
            .find(|queue| queue.hook_list() == state.work_in_progress_list()))
    }

    pub fn effect_update_queue_records(
        &self,
        state: FunctionComponentHookRenderState,
    ) -> Result<&[FunctionComponentEffectUpdateQueueRecord], FunctionComponentRenderError> {
        match self.effect_update_queue(state)? {
            Some(queue) => Ok(queue.records()),
            None => Ok(&[]),
        }
    }

    pub fn effect_destroy_handle_persistence_records(
        &self,
        state: FunctionComponentHookRenderState,
    ) -> Result<
        Vec<FunctionComponentEffectDestroyHandlePersistenceRecord>,
        FunctionComponentRenderError,
    > {
        let records = self.effect_update_queue_records(state)?;
        let mut persistence = Vec::with_capacity(records.len());

        for record in records {
            let previous_effect = self
                .hook_effects
                .get_effect(record.previous_effect())
                .map_err(|error| {
                    FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
                })?;
            let retained_effect =
                self.hook_effects
                    .get_effect(record.effect())
                    .map_err(|error| {
                        FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
                    })?;
            let previous_destroy = self
                .hook_effects
                .effect_destroy(record.previous_effect())
                .map_err(|error| {
                    FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
                })?;
            let retained_destroy =
                self.hook_effects
                    .effect_destroy(record.effect())
                    .map_err(|error| {
                        FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
                    })?;

            persistence.push(FunctionComponentEffectDestroyHandlePersistenceRecord {
                update_index: record.update_index(),
                fiber: record.fiber(),
                hook_list: record.hook_list(),
                hook: record.hook(),
                previous_effect: record.previous_effect(),
                effect: record.effect(),
                previous_instance: previous_effect.instance(),
                retained_instance: retained_effect.instance(),
                phase: record.phase(),
                tag: record.tag(),
                recorded_destroy: record.destroy(),
                previous_destroy,
                retained_destroy,
                dependency_status: record.dependency_status(),
                accepted_for_pending_passive: record.accepted_for_pending_passive(),
                accepted_for_layout_commit: record.accepted_for_layout_commit(),
            });
        }

        Ok(persistence)
    }

    pub fn memo_update_diagnostics(
        &self,
        state: FunctionComponentHookRenderState,
    ) -> Result<Option<&FunctionComponentMemoUpdateDiagnostics>, FunctionComponentRenderError> {
        self.hook_lists
            .list(state.work_in_progress_list())
            .map_err(|error| {
                FunctionComponentRenderError::hook_list(state.render_fiber(), error)
            })?;

        Ok(self
            .memo_update_diagnostics
            .iter()
            .find(|queue| queue.hook_list() == state.work_in_progress_list()))
    }

    pub fn memo_update_diagnostic_records(
        &self,
        state: FunctionComponentHookRenderState,
    ) -> Result<&[FunctionComponentMemoUpdateDiagnosticRecord], FunctionComponentRenderError> {
        match self.memo_update_diagnostics(state)? {
            Some(queue) => Ok(queue.records()),
            None => Ok(&[]),
        }
    }

    pub fn reducer_dispatch_queue_diagnostics(
        &self,
        state: FunctionComponentHookRenderState,
    ) -> Result<
        Option<&FunctionComponentReducerDispatchQueueDiagnostics>,
        FunctionComponentRenderError,
    > {
        self.hook_lists
            .list(state.work_in_progress_list())
            .map_err(|error| {
                FunctionComponentRenderError::hook_list(state.render_fiber(), error)
            })?;

        Ok(self
            .reducer_dispatch_diagnostics
            .iter()
            .find(|queue| queue.hook_list() == state.work_in_progress_list()))
    }

    pub fn reducer_dispatch_queue_records(
        &self,
        state: FunctionComponentHookRenderState,
    ) -> Result<&[FunctionComponentReducerDispatchQueueRecord], FunctionComponentRenderError> {
        match self.reducer_dispatch_queue_diagnostics(state)? {
            Some(queue) => Ok(queue.records()),
            None => Ok(&[]),
        }
    }

    pub fn callback_update_diagnostics(
        &self,
        state: FunctionComponentHookRenderState,
    ) -> Result<Option<&FunctionComponentCallbackUpdateDiagnostics>, FunctionComponentRenderError>
    {
        self.hook_lists
            .list(state.work_in_progress_list())
            .map_err(|error| {
                FunctionComponentRenderError::hook_list(state.render_fiber(), error)
            })?;

        Ok(self
            .callback_update_diagnostics
            .iter()
            .find(|queue| queue.hook_list() == state.work_in_progress_list()))
    }

    pub fn callback_update_diagnostic_records(
        &self,
        state: FunctionComponentHookRenderState,
    ) -> Result<&[FunctionComponentCallbackUpdateDiagnosticRecord], FunctionComponentRenderError>
    {
        match self.callback_update_diagnostics(state)? {
            Some(queue) => Ok(queue.records()),
            None => Ok(&[]),
        }
    }

    #[must_use]
    pub fn committed_effect_queue(
        &self,
        fiber: FiberId,
    ) -> Option<&FunctionComponentCommittedEffectQueue> {
        self.committed_effect_queues
            .iter()
            .find(|queue| queue.fiber() == fiber)
    }

    #[must_use]
    pub fn committed_passive_effect_metadata(
        &self,
        fiber: FiberId,
        flags: HookEffectFlags,
    ) -> Vec<FunctionComponentPassiveEffectMetadata> {
        self.committed_effect_queue(fiber)
            .map(|queue| queue.passive_effect_metadata(flags))
            .unwrap_or_default()
    }

    #[must_use]
    pub fn committed_layout_effect_metadata(
        &self,
        fiber: FiberId,
        flags: HookEffectFlags,
    ) -> Vec<FunctionComponentLayoutEffectMetadata> {
        self.committed_effect_queue(fiber)
            .map(|queue| queue.layout_effect_metadata(flags))
            .unwrap_or_default()
    }

    pub fn layout_effect_metadata(
        &self,
        state: FunctionComponentHookRenderState,
        lanes: Lanes,
    ) -> Result<Vec<FunctionComponentLayoutEffectMetadata>, FunctionComponentRenderError> {
        if lanes.is_empty() {
            return Ok(Vec::new());
        }

        let list = state.work_in_progress_list();
        self.hook_lists.list(list).map_err(|error| {
            FunctionComponentRenderError::hook_list(state.render_fiber(), error)
        })?;

        if state.phase() == FunctionComponentHookRenderPhase::Update {
            return self.layout_effect_metadata_from_update_queue(state, lanes);
        }

        let Some(ring) = self.effect_ring(list) else {
            return Ok(Vec::new());
        };

        let effects = ring
            .iter_matching(&self.hook_effects, HookEffectFlags::LAYOUT_EFFECT)
            .map_err(|error| {
                FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
            })?;
        let mut records = Vec::new();
        for (effect_index, effect) in effects.enumerate() {
            let effect = effect.map_err(|error| {
                FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
            })?;
            let destroy = self
                .hook_effects
                .effect_destroy(effect.id())
                .map_err(|error| {
                    FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
                })?;
            records.push(FunctionComponentLayoutEffectMetadata {
                fiber: state.render_fiber(),
                render_phase: state.phase(),
                hook_list: list,
                effect_index,
                effect: effect.id(),
                previous_effect: None,
                instance: effect.instance(),
                tag: effect.tag(),
                create: effect.create(),
                destroy,
                previous_dependencies: None,
                dependencies: effect.dependencies(),
                dependency_status: None,
                lanes,
            });
        }

        Ok(records)
    }

    pub fn passive_effect_metadata(
        &self,
        state: FunctionComponentHookRenderState,
        lanes: Lanes,
    ) -> Result<Vec<FunctionComponentPassiveEffectMetadata>, FunctionComponentRenderError> {
        if lanes.is_empty() {
            return Ok(Vec::new());
        }

        let list = state.work_in_progress_list();
        self.hook_lists.list(list).map_err(|error| {
            FunctionComponentRenderError::hook_list(state.render_fiber(), error)
        })?;

        if state.phase() == FunctionComponentHookRenderPhase::Update {
            return self.passive_effect_metadata_from_update_queue(state, lanes);
        }

        let Some(ring) = self.effect_ring(list) else {
            return Ok(Vec::new());
        };

        let effects = ring
            .iter_matching(&self.hook_effects, HookEffectFlags::PASSIVE_EFFECT)
            .map_err(|error| {
                FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
            })?;
        let mut records = Vec::new();
        for (effect_index, effect) in effects.enumerate() {
            let effect = effect.map_err(|error| {
                FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
            })?;
            let destroy = self
                .hook_effects
                .effect_destroy(effect.id())
                .map_err(|error| {
                    FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
                })?;
            records.push(FunctionComponentPassiveEffectMetadata {
                fiber: state.render_fiber(),
                render_phase: state.phase(),
                hook_list: list,
                effect_index,
                effect: effect.id(),
                previous_effect: None,
                instance: effect.instance(),
                tag: effect.tag(),
                create: effect.create(),
                destroy,
                dependencies: effect.dependencies(),
                lanes,
            });
        }

        Ok(records)
    }

    fn passive_effect_metadata_from_update_queue(
        &self,
        state: FunctionComponentHookRenderState,
        lanes: Lanes,
    ) -> Result<Vec<FunctionComponentPassiveEffectMetadata>, FunctionComponentRenderError> {
        let records = self.effect_update_queue_records(state)?;
        let mut accepted = Vec::new();

        for record in records {
            if !record.accepted_for_pending_passive() {
                continue;
            }

            accepted.push(FunctionComponentPassiveEffectMetadata {
                fiber: record.fiber(),
                render_phase: state.phase(),
                hook_list: record.hook_list(),
                effect_index: accepted.len(),
                effect: record.effect(),
                previous_effect: Some(record.previous_effect()),
                instance: record.instance(),
                tag: record.tag(),
                create: record.create(),
                destroy: record.destroy(),
                dependencies: record.dependencies(),
                lanes,
            });
        }

        Ok(accepted)
    }

    fn layout_effect_metadata_from_update_queue(
        &self,
        state: FunctionComponentHookRenderState,
        lanes: Lanes,
    ) -> Result<Vec<FunctionComponentLayoutEffectMetadata>, FunctionComponentRenderError> {
        let records = self.effect_update_queue_records(state)?;
        let mut accepted = Vec::new();

        for record in records {
            if !record.accepted_for_layout_commit() {
                continue;
            }

            accepted.push(FunctionComponentLayoutEffectMetadata {
                fiber: record.fiber(),
                render_phase: state.phase(),
                hook_list: record.hook_list(),
                effect_index: accepted.len(),
                effect: record.effect(),
                previous_effect: Some(record.previous_effect()),
                instance: record.instance(),
                tag: record.tag(),
                create: record.create(),
                destroy: record.destroy(),
                previous_dependencies: Some(record.previous_dependencies()),
                dependencies: record.dependencies(),
                dependency_status: Some(record.dependency_status()),
                lanes,
            });
        }

        Ok(accepted)
    }

    pub fn prepare_render_state(
        &mut self,
        arena: &FiberArena,
        work_in_progress: FiberId,
    ) -> Result<FunctionComponentHookRenderState, FunctionComponentRenderError> {
        let current = arena.get(work_in_progress)?.alternate();
        let current_list = current.and_then(|fiber| self.current_list(fiber));
        let (phase, owner) = match current_list {
            Some(list) => {
                let owner = self
                    .hook_lists
                    .list(list)
                    .map_err(|error| {
                        FunctionComponentRenderError::hook_list(work_in_progress, error)
                    })?
                    .owner();
                (FunctionComponentHookRenderPhase::Update, owner)
            }
            None => (FunctionComponentHookRenderPhase::Mount, work_in_progress),
        };
        let work_in_progress_list = self.hook_lists.create_list(owner);

        let state = FunctionComponentHookRenderState {
            phase,
            render_fiber: work_in_progress,
            current,
            current_list,
            work_in_progress_list,
        };
        self.record_pending_effect_queue_state_unchecked(state);

        Ok(state)
    }

    pub fn begin_render_cursor(
        &self,
        state: FunctionComponentHookRenderState,
    ) -> Result<FunctionComponentHookRenderCursor, FunctionComponentRenderError> {
        match state.phase() {
            FunctionComponentHookRenderPhase::Mount => {
                let cursor = self
                    .hook_lists
                    .begin_mount(state.work_in_progress_list())
                    .map_err(|error| {
                        FunctionComponentRenderError::hook_list(state.render_fiber(), error)
                    })?;
                Ok(FunctionComponentHookRenderCursor::Mount { state, cursor })
            }
            FunctionComponentHookRenderPhase::Update => {
                let current_list = state.current_list().ok_or(
                    FunctionComponentRenderError::MissingCurrentHookList {
                        fiber: state.render_fiber(),
                    },
                )?;
                let cursor = self
                    .hook_lists
                    .begin_update(current_list, state.work_in_progress_list())
                    .map_err(|error| {
                        FunctionComponentRenderError::hook_list(state.render_fiber(), error)
                    })?;
                Ok(FunctionComponentHookRenderCursor::Update { state, cursor })
            }
        }
    }

    pub fn mount_hook_metadata(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
        payload: HookSlotPayload,
    ) -> Result<HookSlotId, FunctionComponentRenderError> {
        match cursor {
            FunctionComponentHookRenderCursor::Mount { state, cursor } => self
                .hook_lists
                .mount_hook(cursor, payload)
                .map_err(|error| {
                    FunctionComponentRenderError::hook_list(state.render_fiber(), error)
                }),
            FunctionComponentHookRenderCursor::Update { state, .. } => {
                Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                    fiber: state.render_fiber(),
                    expected: FunctionComponentHookRenderPhase::Mount,
                    actual: FunctionComponentHookRenderPhase::Update,
                })
            }
        }
    }

    pub fn update_hook_metadata(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
    ) -> Result<HookSlotId, FunctionComponentRenderError> {
        match cursor {
            FunctionComponentHookRenderCursor::Update { state, cursor } => {
                self.hook_lists.update_hook(cursor).map_err(|error| {
                    FunctionComponentRenderError::hook_list(state.render_fiber(), error)
                })
            }
            FunctionComponentHookRenderCursor::Mount { state, .. } => {
                Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                    fiber: state.render_fiber(),
                    expected: FunctionComponentHookRenderPhase::Update,
                    actual: FunctionComponentHookRenderPhase::Mount,
                })
            }
        }
    }

    pub fn mount_memo_hook(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
        value: StateHandle,
        dependencies: HookEffectDependencies,
    ) -> Result<FunctionComponentMemoHookRecord, FunctionComponentRenderError> {
        let state = cursor.state();
        if state.phase() != FunctionComponentHookRenderPhase::Mount {
            return Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                fiber: state.render_fiber(),
                expected: FunctionComponentHookRenderPhase::Mount,
                actual: state.phase(),
            });
        }

        let hook = self.mount_hook_metadata(cursor, HookSlotPayload::opaque(value))?;
        self.bind_memo_hook_unchecked(hook, value, dependencies);

        Ok(FunctionComponentMemoHookRecord {
            hook,
            value,
            dependencies,
        })
    }

    pub fn update_memo_hook(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
        requested_value: StateHandle,
        dependencies: HookEffectDependencies,
    ) -> Result<FunctionComponentMemoUpdateRecord, FunctionComponentRenderError> {
        let previous_hook = self.next_current_hook_for_update_cursor(cursor)?;
        let state = cursor.state();
        let previous = self.memo_hook_record(state.render_fiber(), previous_hook)?;
        let hook = self.update_hook_metadata(cursor)?;
        let dependency_status = memo_dependency_status(previous.dependencies(), dependencies);
        let value = if dependency_status.reused_previous_value() {
            previous.value()
        } else {
            requested_value
        };

        self.hook_lists
            .set_hook_payload(hook, HookSlotPayload::opaque(value))
            .map_err(|error| {
                FunctionComponentRenderError::hook_list(state.render_fiber(), error)
            })?;
        self.bind_memo_hook_unchecked(hook, value, dependencies);

        Ok(FunctionComponentMemoUpdateRecord {
            hook,
            previous_hook,
            previous_value: previous.value(),
            previous_dependencies: previous.dependencies(),
            requested_value,
            value,
            dependencies,
            dependency_status,
        })
    }

    pub fn mount_callback_hook(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
        callback: FunctionComponentCallbackHandle,
        dependencies: HookEffectDependencies,
    ) -> Result<FunctionComponentCallbackHookRecord, FunctionComponentRenderError> {
        let record =
            self.mount_memo_hook(cursor, callback_to_memo_value(callback), dependencies)?;
        Ok(callback_hook_record_from_memo(record))
    }

    pub fn update_callback_hook(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
        requested_callback: FunctionComponentCallbackHandle,
        dependencies: HookEffectDependencies,
    ) -> Result<FunctionComponentCallbackUpdateRecord, FunctionComponentRenderError> {
        let record = self.update_memo_hook(
            cursor,
            callback_to_memo_value(requested_callback),
            dependencies,
        )?;
        Ok(callback_update_record_from_memo(record))
    }

    pub fn mount_ref_hook(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
        initial_value: StateHandle,
    ) -> Result<FunctionComponentRefHookRecord, FunctionComponentRenderError> {
        let state = cursor.state();
        if state.phase() != FunctionComponentHookRenderPhase::Mount {
            return Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                fiber: state.render_fiber(),
                expected: FunctionComponentHookRenderPhase::Mount,
                actual: state.phase(),
            });
        }

        let ref_object = self.create_ref_object()?;
        let hook = self.mount_hook_metadata(cursor, ref_payload(ref_object))?;
        self.bind_ref_hook_unchecked(hook, ref_object, initial_value);

        Ok(FunctionComponentRefHookRecord {
            hook,
            ref_object,
            initial_value,
        })
    }

    pub fn update_ref_hook(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
        ignored_initial_value: StateHandle,
    ) -> Result<FunctionComponentRefUpdateRecord, FunctionComponentRenderError> {
        let previous_hook = self.next_current_hook_for_update_cursor(cursor)?;
        let state = cursor.state();
        let previous = self.ref_hook_record(state.render_fiber(), previous_hook)?;
        let hook = self.update_hook_metadata(cursor)?;

        self.hook_lists
            .set_hook_payload(hook, ref_payload(previous.ref_object()))
            .map_err(|error| {
                FunctionComponentRenderError::hook_list(state.render_fiber(), error)
            })?;
        self.bind_ref_hook_unchecked(hook, previous.ref_object(), previous.initial_value());

        Ok(FunctionComponentRefUpdateRecord {
            hook,
            ref_object: previous.ref_object(),
            initial_value: previous.initial_value(),
            ignored_initial_value,
        })
    }

    pub fn mount_effect_metadata(
        &mut self,
        arena: &mut FiberArena,
        cursor: &mut FunctionComponentHookRenderCursor,
        phase: FunctionComponentEffectPhase,
        create: HookEffectCallbackHandle,
        dependencies: HookEffectDependencies,
    ) -> Result<FunctionComponentEffectRegistration, FunctionComponentRenderError> {
        let (state, cursor) = match cursor {
            FunctionComponentHookRenderCursor::Mount { state, cursor } => (*state, cursor),
            FunctionComponentHookRenderCursor::Update { state, .. } => {
                return Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                    fiber: state.render_fiber(),
                    expected: FunctionComponentHookRenderPhase::Mount,
                    actual: FunctionComponentHookRenderPhase::Update,
                });
            }
        };
        self.ensure_mount_cursor_ready(state, cursor)?;

        let tag = HookEffectFlags::HAS_EFFECT | phase.hook_flags();
        let instance = self.hook_effects.create_effect_instance();
        let effect = self.push_effect_for_list(
            state,
            state.work_in_progress_list(),
            tag,
            instance,
            create,
            dependencies,
        )?;
        let hook = self
            .hook_lists
            .mount_hook(
                cursor,
                HookSlotPayload::effect(HookEffectPayload::new(effect)),
            )
            .map_err(|error| {
                FunctionComponentRenderError::hook_list(state.render_fiber(), error)
            })?;
        let fiber_flags = phase.mount_fiber_flags();
        arena
            .get_mut(state.render_fiber())?
            .merge_flags(fiber_flags);

        Ok(FunctionComponentEffectRegistration {
            hook,
            effect,
            instance,
            phase,
            tag,
            create,
            dependencies,
            fiber_flags,
        })
    }

    pub fn update_effect_metadata(
        &mut self,
        arena: &mut FiberArena,
        cursor: &mut FunctionComponentHookRenderCursor,
        phase: FunctionComponentEffectPhase,
        create: HookEffectCallbackHandle,
        dependencies: HookEffectDependencies,
        dependency_status: FunctionComponentEffectDependencyStatus,
    ) -> Result<FunctionComponentEffectRegistration, FunctionComponentRenderError> {
        let (state, cursor) = match cursor {
            FunctionComponentHookRenderCursor::Update { state, cursor } => (*state, cursor),
            FunctionComponentHookRenderCursor::Mount { state, .. } => {
                return Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                    fiber: state.render_fiber(),
                    expected: FunctionComponentHookRenderPhase::Update,
                    actual: FunctionComponentHookRenderPhase::Mount,
                });
            }
        };

        let hook = self.hook_lists.update_hook(cursor).map_err(|error| {
            FunctionComponentRenderError::hook_list(state.render_fiber(), error)
        })?;
        let previous_effect = self
            .hook_lists
            .hook(hook)
            .map_err(|error| FunctionComponentRenderError::hook_list(state.render_fiber(), error))?
            .payload()
            .effect_payload()
            .ok_or(FunctionComponentRenderError::ExpectedEffectHookPayload {
                fiber: state.render_fiber(),
                hook,
            })?
            .effect();
        let previous_effect_node =
            self.hook_effects
                .get_effect(previous_effect)
                .map_err(|error| {
                    FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
                })?;
        let instance = previous_effect_node.instance();
        let previous_dependencies = previous_effect_node.dependencies();
        let destroy = self
            .hook_effects
            .effect_destroy(previous_effect)
            .map_err(|error| {
                FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
            })?;
        let should_fire =
            dependencies.is_always_run() || dependency_status.should_register_has_effect();
        let tag = if should_fire {
            HookEffectFlags::HAS_EFFECT | phase.hook_flags()
        } else {
            phase.hook_flags()
        };
        let effect = self.push_effect_for_list(
            state,
            state.work_in_progress_list(),
            tag,
            instance,
            create,
            dependencies,
        )?;
        self.hook_lists
            .set_hook_payload(
                hook,
                HookSlotPayload::effect(HookEffectPayload::new(effect)),
            )
            .map_err(|error| {
                FunctionComponentRenderError::hook_list(state.render_fiber(), error)
            })?;

        let fiber_flags = if should_fire {
            phase.update_fiber_flags()
        } else {
            FiberFlags::NO
        };
        if fiber_flags.is_non_empty() {
            arena
                .get_mut(state.render_fiber())?
                .merge_flags(fiber_flags);
        }
        self.push_effect_update_queue_record(FunctionComponentEffectUpdateQueueRecord {
            update_index: 0,
            fiber: state.render_fiber(),
            hook_list: state.work_in_progress_list(),
            hook,
            previous_effect,
            effect,
            instance,
            phase,
            tag,
            create,
            destroy,
            previous_dependencies,
            dependencies,
            dependency_status,
        });

        Ok(FunctionComponentEffectRegistration {
            hook,
            effect,
            instance,
            phase,
            tag,
            create,
            dependencies,
            fiber_flags,
        })
    }

    pub fn update_effect_metadata_with_dependency_check(
        &mut self,
        arena: &mut FiberArena,
        cursor: &mut FunctionComponentHookRenderCursor,
        phase: FunctionComponentEffectPhase,
        create: HookEffectCallbackHandle,
        dependencies: HookEffectDependencies,
    ) -> Result<FunctionComponentEffectRegistration, FunctionComponentRenderError> {
        let dependency_status =
            self.effect_dependency_status_for_update_cursor(cursor, dependencies)?;
        self.update_effect_metadata(
            arena,
            cursor,
            phase,
            create,
            dependencies,
            dependency_status,
        )
    }

    pub fn mount_state_hook(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
        initial_state: StateHandle,
    ) -> Result<FunctionComponentStateHookRecord, FunctionComponentRenderError> {
        let state = cursor.state();
        if state.phase() != FunctionComponentHookRenderPhase::Mount {
            return Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                fiber: state.render_fiber(),
                expected: FunctionComponentHookRenderPhase::Mount,
                actual: state.phase(),
            });
        }

        let state_slot = self.state_queues.create_state_slot(initial_state);
        let dispatch = self.create_state_dispatch(state.render_fiber(), state_slot.queue())?;
        self.initialize_state_queue(state.render_fiber(), state_slot.queue(), dispatch)?;
        let payload = state_payload_from_slot(&state_slot);
        let hook = self.mount_hook_metadata(cursor, HookSlotPayload::state(payload))?;

        Ok(FunctionComponentStateHookRecord {
            hook,
            memoized_state: payload.memoized_state(),
            base_state: payload.base_state(),
            base_queue: payload.base_queue(),
            queue: payload.queue(),
            dispatch,
        })
    }

    pub fn mount_reducer_hook(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
        reducer: FunctionComponentReducerHandle,
        initial_state: StateHandle,
    ) -> Result<FunctionComponentReducerHookRecord, FunctionComponentRenderError> {
        let state = cursor.state();
        if state.phase() != FunctionComponentHookRenderPhase::Mount {
            return Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                fiber: state.render_fiber(),
                expected: FunctionComponentHookRenderPhase::Mount,
                actual: state.phase(),
            });
        }

        let state_slot = self.state_queues.create_state_slot(initial_state);
        let dispatch = self.create_state_dispatch(state.render_fiber(), state_slot.queue())?;
        self.initialize_reducer_queue(state.render_fiber(), state_slot.queue(), dispatch, reducer)?;
        let payload = state_payload_from_slot(&state_slot);
        let hook = self.mount_hook_metadata(cursor, HookSlotPayload::state(payload))?;

        Ok(FunctionComponentReducerHookRecord {
            hook,
            reducer,
            memoized_state: payload.memoized_state(),
            base_state: payload.base_state(),
            base_queue: payload.base_queue(),
            queue: payload.queue(),
            dispatch,
        })
    }

    pub fn update_state_hook(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
    ) -> Result<FunctionComponentStateHookRecord, FunctionComponentRenderError> {
        let state = cursor.state();
        if state.phase() != FunctionComponentHookRenderPhase::Update {
            return Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                fiber: state.render_fiber(),
                expected: FunctionComponentHookRenderPhase::Update,
                actual: state.phase(),
            });
        }

        let hook = self.update_hook_metadata(cursor)?;
        self.state_hook_record(state.render_fiber(), hook)
    }

    pub fn update_reducer_hook(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
        reducer_id: FunctionComponentReducerHandle,
    ) -> Result<FunctionComponentReducerHookRecord, FunctionComponentRenderError> {
        let state = cursor.state();
        if state.phase() != FunctionComponentHookRenderPhase::Update {
            return Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                fiber: state.render_fiber(),
                expected: FunctionComponentHookRenderPhase::Update,
                actual: state.phase(),
            });
        }

        let hook = self.update_hook_metadata(cursor)?;
        let payload = self.state_payload_for_hook(state.render_fiber(), hook)?;
        self.reducer_for_queue(state.render_fiber(), payload.queue())?;
        self.state_queues
            .queue_mut(payload.queue())
            .map_err(|error| FunctionComponentRenderError::hook_queue(state.render_fiber(), error))?
            .set_last_rendered_reducer(FunctionComponentStateReducerId::Reducer(reducer_id));
        self.reducer_hook_record(state.render_fiber(), hook)
    }

    pub fn update_state_hook_with_queued_updates(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
        lanes: FunctionComponentStateUpdateRenderLanes,
        reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
    ) -> Result<FunctionComponentStateUpdateRenderRecord, FunctionComponentRenderError> {
        let state = cursor.state();
        if state.phase() != FunctionComponentHookRenderPhase::Update {
            return Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                fiber: state.render_fiber(),
                expected: FunctionComponentHookRenderPhase::Update,
                actual: state.phase(),
            });
        }

        let hook = self.update_hook_metadata(cursor)?;
        self.process_state_hook_queue(state.render_fiber(), hook, lanes, reducer)
    }

    pub fn update_reducer_hook_with_queued_updates(
        &mut self,
        cursor: &mut FunctionComponentHookRenderCursor,
        reducer_id: FunctionComponentReducerHandle,
        lanes: FunctionComponentStateUpdateRenderLanes,
        reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
    ) -> Result<FunctionComponentReducerUpdateRenderRecord, FunctionComponentRenderError> {
        let state = cursor.state();
        if state.phase() != FunctionComponentHookRenderPhase::Update {
            return Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                fiber: state.render_fiber(),
                expected: FunctionComponentHookRenderPhase::Update,
                actual: state.phase(),
            });
        }

        let hook = self.update_hook_metadata(cursor)?;
        self.process_reducer_hook_queue(state.render_fiber(), hook, reducer_id, lanes, reducer)
    }

    pub fn create_current_state_hook(
        &mut self,
        fiber: FiberId,
        initial_state: StateHandle,
    ) -> Result<FunctionComponentStateHookRecord, FunctionComponentRenderError> {
        let list = self
            .current_list(fiber)
            .unwrap_or_else(|| self.create_current_list(fiber));
        let state_slot = self.state_queues.create_state_slot(initial_state);
        let dispatch = self.create_state_dispatch(fiber, state_slot.queue())?;
        self.initialize_state_queue(fiber, state_slot.queue(), dispatch)?;
        let payload = state_payload_from_slot(&state_slot);
        let hook = self
            .hook_lists
            .append_hook(list, HookSlotPayload::state(payload))
            .map_err(|error| FunctionComponentRenderError::hook_list(fiber, error))?;

        Ok(FunctionComponentStateHookRecord {
            hook,
            memoized_state: payload.memoized_state(),
            base_state: payload.base_state(),
            base_queue: payload.base_queue(),
            queue: payload.queue(),
            dispatch,
        })
    }

    pub fn create_current_reducer_hook(
        &mut self,
        fiber: FiberId,
        reducer: FunctionComponentReducerHandle,
        initial_state: StateHandle,
    ) -> Result<FunctionComponentReducerHookRecord, FunctionComponentRenderError> {
        let list = self
            .current_list(fiber)
            .unwrap_or_else(|| self.create_current_list(fiber));
        let state_slot = self.state_queues.create_state_slot(initial_state);
        let dispatch = self.create_state_dispatch(fiber, state_slot.queue())?;
        self.initialize_reducer_queue(fiber, state_slot.queue(), dispatch, reducer)?;
        let payload = state_payload_from_slot(&state_slot);
        let hook = self
            .hook_lists
            .append_hook(list, HookSlotPayload::state(payload))
            .map_err(|error| FunctionComponentRenderError::hook_list(fiber, error))?;

        Ok(FunctionComponentReducerHookRecord {
            hook,
            reducer,
            memoized_state: payload.memoized_state(),
            base_state: payload.base_state(),
            base_queue: payload.base_queue(),
            queue: payload.queue(),
            dispatch,
        })
    }

    pub fn create_current_memo_hook(
        &mut self,
        fiber: FiberId,
        value: StateHandle,
        dependencies: HookEffectDependencies,
    ) -> Result<FunctionComponentMemoHookRecord, FunctionComponentRenderError> {
        let list = self
            .current_list(fiber)
            .unwrap_or_else(|| self.create_current_list(fiber));
        let hook = self
            .hook_lists
            .append_hook(list, HookSlotPayload::opaque(value))
            .map_err(|error| FunctionComponentRenderError::hook_list(fiber, error))?;
        self.bind_memo_hook_unchecked(hook, value, dependencies);

        Ok(FunctionComponentMemoHookRecord {
            hook,
            value,
            dependencies,
        })
    }

    pub fn create_current_callback_hook(
        &mut self,
        fiber: FiberId,
        callback: FunctionComponentCallbackHandle,
        dependencies: HookEffectDependencies,
    ) -> Result<FunctionComponentCallbackHookRecord, FunctionComponentRenderError> {
        let record =
            self.create_current_memo_hook(fiber, callback_to_memo_value(callback), dependencies)?;
        Ok(callback_hook_record_from_memo(record))
    }

    pub fn create_current_ref_hook(
        &mut self,
        fiber: FiberId,
        initial_value: StateHandle,
    ) -> Result<FunctionComponentRefHookRecord, FunctionComponentRenderError> {
        let list = self
            .current_list(fiber)
            .unwrap_or_else(|| self.create_current_list(fiber));
        let ref_object = self.create_ref_object()?;
        let hook = self
            .hook_lists
            .append_hook(list, ref_payload(ref_object))
            .map_err(|error| FunctionComponentRenderError::hook_list(fiber, error))?;
        self.bind_ref_hook_unchecked(hook, ref_object, initial_value);

        Ok(FunctionComponentRefHookRecord {
            hook,
            ref_object,
            initial_value,
        })
    }

    pub fn create_current_effect_metadata(
        &mut self,
        arena: &mut FiberArena,
        fiber: FiberId,
        phase: FunctionComponentEffectPhase,
        create: HookEffectCallbackHandle,
        dependencies: HookEffectDependencies,
        destroy: Option<HookEffectCallbackHandle>,
    ) -> Result<FunctionComponentEffectRegistration, FunctionComponentRenderError> {
        let list = self
            .current_list(fiber)
            .unwrap_or_else(|| self.create_current_list(fiber));
        let state = FunctionComponentHookRenderState {
            phase: FunctionComponentHookRenderPhase::Mount,
            render_fiber: fiber,
            current: None,
            current_list: None,
            work_in_progress_list: list,
        };
        let tag = HookEffectFlags::HAS_EFFECT | phase.hook_flags();
        let instance = self
            .hook_effects
            .create_effect_instance_with_destroy(destroy);
        let effect = self.push_effect_for_list(state, list, tag, instance, create, dependencies)?;
        let hook = self
            .hook_lists
            .append_hook(
                list,
                HookSlotPayload::effect(HookEffectPayload::new(effect)),
            )
            .map_err(|error| FunctionComponentRenderError::hook_list(fiber, error))?;
        let fiber_flags = phase.mount_fiber_flags();
        arena.get_mut(fiber)?.merge_flags(fiber_flags);

        Ok(FunctionComponentEffectRegistration {
            hook,
            effect,
            instance,
            phase,
            tag,
            create,
            dependencies,
            fiber_flags,
        })
    }

    pub fn commit_pending_effect_queue_for_fiber(
        &mut self,
        fiber: FiberId,
        lanes: Lanes,
    ) -> Result<Option<FunctionComponentCommittedEffectQueue>, FunctionComponentRenderError> {
        let Some(state) = self.pending_effect_queue_state(fiber) else {
            return Ok(None);
        };

        let queue = self.commit_effect_queue_for_render_state(state, lanes)?;
        self.pending_effect_queues
            .retain(|binding| binding.fiber != fiber);
        Ok(Some(queue))
    }

    pub fn commit_effect_queue_for_render_state(
        &mut self,
        state: FunctionComponentHookRenderState,
        lanes: Lanes,
    ) -> Result<FunctionComponentCommittedEffectQueue, FunctionComponentRenderError> {
        let records = self.committed_effect_records_for_render_state(state, lanes)?;
        let queue = FunctionComponentCommittedEffectQueue {
            fiber: state.render_fiber(),
            phase: state.phase(),
            hook_list: state.work_in_progress_list(),
            lanes,
            records,
        };
        self.bind_current_list_unchecked(state.render_fiber(), state.work_in_progress_list());
        self.record_committed_effect_queue_unchecked(queue.clone());
        Ok(queue)
    }

    pub fn dispatch_state_update(
        &mut self,
        request: FunctionComponentStateDispatchRequest,
    ) -> Result<FunctionComponentStateDispatchRecord, FunctionComponentRenderError> {
        let binding = self.state_dispatch_binding(request.dispatch())?;
        self.validate_basic_state_dispatch_binding(binding)?;
        self.validate_dispatch_eager_state(binding, request.eager_state())?;
        let update = self
            .state_queues
            .create_update(request.lane(), request.action());
        {
            let update_record = self
                .state_queues
                .update_mut(update)
                .map_err(|error| FunctionComponentRenderError::hook_queue(binding.fiber, error))?;
            update_record.set_revert_lane(request.revert_lane());
            if let Some(eager_state) = request.eager_state() {
                update_record.set_eager_state(eager_state.eager_state());
            }
        }
        self.state_queues
            .append_pending_update(binding.queue, update)
            .map_err(|error| FunctionComponentRenderError::hook_queue(binding.fiber, error))?;

        Ok(FunctionComponentStateDispatchRecord {
            fiber: binding.fiber,
            queue: binding.queue,
            dispatch: binding.handle,
            update,
            lane: request.lane(),
            revert_lane: request.revert_lane(),
            action: request.action(),
            eager_state: request.eager_state(),
        })
    }

    pub(crate) fn dispatch_state_update_and_reschedule_root<H: HostTypes>(
        &mut self,
        store: &mut FiberRootStore<H>,
        request: FunctionComponentStateDispatchRequest,
    ) -> Result<
        FunctionComponentStateDispatchRootRescheduleRecord,
        FunctionComponentStateDispatchRootRescheduleError,
    > {
        let dispatch = self.dispatch_state_update(request)?;
        let lane = dispatch.lane().priority_lanes().highest_priority_lane();
        if lane.is_empty() {
            return Err(
                FunctionComponentStateDispatchRootRescheduleError::EmptyDispatchLane {
                    fiber: dispatch.fiber(),
                    dispatch: dispatch.dispatch(),
                    lane: dispatch.lane(),
                },
            );
        }

        let root = mark_update_lane_from_fiber_to_root(store, dispatch.fiber(), lane)?;
        let reschedule = RootRescheduleRequestRecord::new(root, dispatch.fiber(), lane);
        let scheduled = ensure_root_is_rescheduled(store, reschedule)?;

        Ok(FunctionComponentStateDispatchRootRescheduleRecord {
            dispatch,
            root,
            reschedule,
            scheduled,
        })
    }

    pub fn dispatch_reducer_update(
        &mut self,
        request: FunctionComponentReducerDispatchRequest,
    ) -> Result<FunctionComponentReducerDispatchRecord, FunctionComponentRenderError> {
        let binding = self.state_dispatch_binding(request.dispatch())?;
        self.validate_live_dispatch_binding(binding)?;
        let reducer = self.reducer_for_queue(binding.fiber, binding.queue)?;
        self.validate_dispatch_eager_state(binding, request.eager_state())?;
        let update = self
            .state_queues
            .create_update(request.lane(), request.action());
        {
            let update_record = self
                .state_queues
                .update_mut(update)
                .map_err(|error| FunctionComponentRenderError::hook_queue(binding.fiber, error))?;
            update_record.set_revert_lane(request.revert_lane());
            if let Some(eager_state) = request.eager_state() {
                update_record.set_eager_state(eager_state.eager_state());
            }
        }
        self.state_queues
            .append_pending_update(binding.queue, update)
            .map_err(|error| FunctionComponentRenderError::hook_queue(binding.fiber, error))?;

        Ok(FunctionComponentReducerDispatchRecord {
            fiber: binding.fiber,
            queue: binding.queue,
            dispatch: binding.handle,
            reducer,
            update,
            lane: request.lane(),
            revert_lane: request.revert_lane(),
            action: request.action(),
            eager_state: request.eager_state(),
        })
    }

    pub(crate) fn dispatch_reducer_update_and_reschedule_root<H: HostTypes>(
        &mut self,
        store: &mut FiberRootStore<H>,
        request: FunctionComponentReducerDispatchRequest,
    ) -> Result<
        FunctionComponentReducerDispatchRootRescheduleRecord,
        FunctionComponentStateDispatchRootRescheduleError,
    > {
        let dispatch = self.dispatch_reducer_update(request)?;
        let lane = dispatch.lane().priority_lanes().highest_priority_lane();
        if lane.is_empty() {
            return Err(
                FunctionComponentStateDispatchRootRescheduleError::EmptyDispatchLane {
                    fiber: dispatch.fiber(),
                    dispatch: dispatch.dispatch(),
                    lane: dispatch.lane(),
                },
            );
        }

        let root = mark_update_lane_from_fiber_to_root(store, dispatch.fiber(), lane)?;
        let reschedule = RootRescheduleRequestRecord::new(root, dispatch.fiber(), lane);
        let scheduled = ensure_root_is_rescheduled(store, reschedule)?;

        Ok(FunctionComponentReducerDispatchRootRescheduleRecord {
            dispatch,
            root,
            reschedule,
            scheduled,
        })
    }

    pub fn record_reducer_dispatch_queue_diagnostic(
        &mut self,
        state: FunctionComponentHookRenderState,
        render_lanes: Lanes,
        request: FunctionComponentReducerDispatchRequest,
    ) -> Result<FunctionComponentReducerDispatchQueueRecord, FunctionComponentRenderError> {
        let binding = self.state_dispatch_binding(request.dispatch())?;
        self.validate_live_dispatch_binding(binding)?;
        let reducer = self.reducer_for_queue(binding.fiber, binding.queue)?;
        self.validate_dispatch_eager_state(binding, request.eager_state())?;
        self.validate_reducer_dispatch_render_context(state, binding)?;

        let diagnostic_index = self
            .reducer_dispatch_diagnostics
            .iter()
            .find(|queue| queue.hook_list() == state.work_in_progress_list())
            .map_or(0, FunctionComponentReducerDispatchQueueDiagnostics::len);
        let record = FunctionComponentReducerDispatchQueueRecord {
            diagnostic_index,
            fiber: state.render_fiber(),
            current: state.current(),
            hook_list: state.work_in_progress_list(),
            queue_owner: binding.fiber,
            queue: binding.queue,
            dispatch: binding.handle,
            reducer,
            action: request.action(),
            render_lanes,
            dispatch_lane: request.lane(),
            revert_lane: request.revert_lane(),
            eager_state: request.eager_state(),
            eager_state_blocker: FunctionComponentReducerDispatchEagerStateBlocker::for_eager_state(
                request.eager_state(),
            ),
            non_execution: FunctionComponentReducerDispatchNonExecutionMetadata::BLOCKED,
        };
        self.record_reducer_dispatch_queue_diagnostic_unchecked(record);
        Ok(record)
    }

    pub fn finish_render_cursor(
        &self,
        cursor: FunctionComponentHookRenderCursor,
    ) -> Result<FunctionComponentHookRenderResult, FunctionComponentRenderError> {
        let (state, traversal) = match cursor {
            FunctionComponentHookRenderCursor::Mount { state, cursor } => {
                let traversal = self.hook_lists.finish_mount(cursor).map_err(|error| {
                    FunctionComponentRenderError::hook_list(state.render_fiber(), error)
                })?;
                (state, traversal)
            }
            FunctionComponentHookRenderCursor::Update { state, cursor } => {
                let traversal = self.hook_lists.finish_update(cursor).map_err(|error| {
                    FunctionComponentRenderError::hook_list(state.render_fiber(), error)
                })?;
                (state, traversal)
            }
        };

        Ok(FunctionComponentHookRenderResult { state, traversal })
    }

    fn initialize_state_queue(
        &mut self,
        fiber: FiberId,
        queue: HookQueueId,
        dispatch: FunctionComponentStateDispatchHandle,
    ) -> Result<(), FunctionComponentRenderError> {
        let queue_record = self
            .state_queues
            .queue_mut(queue)
            .map_err(|error| FunctionComponentRenderError::hook_queue(fiber, error))?;
        queue_record.set_dispatch(dispatch);
        queue_record.set_last_rendered_reducer(FunctionComponentStateReducerId::BasicState);
        Ok(())
    }

    fn initialize_reducer_queue(
        &mut self,
        fiber: FiberId,
        queue: HookQueueId,
        dispatch: FunctionComponentStateDispatchHandle,
        reducer: FunctionComponentReducerHandle,
    ) -> Result<(), FunctionComponentRenderError> {
        let queue_record = self
            .state_queues
            .queue_mut(queue)
            .map_err(|error| FunctionComponentRenderError::hook_queue(fiber, error))?;
        queue_record.set_dispatch(dispatch);
        queue_record.set_last_rendered_reducer(FunctionComponentStateReducerId::Reducer(reducer));
        Ok(())
    }

    fn memo_hook_record(
        &self,
        fiber: FiberId,
        hook: HookSlotId,
    ) -> Result<FunctionComponentMemoHookRecord, FunctionComponentRenderError> {
        self.memo_hooks
            .iter()
            .find(|binding| binding.hook == hook)
            .map(|binding| FunctionComponentMemoHookRecord {
                hook,
                value: binding.value,
                dependencies: binding.dependencies,
            })
            .ok_or(FunctionComponentRenderError::MissingMemoHookRecord { fiber, hook })
    }

    fn ref_hook_record(
        &self,
        fiber: FiberId,
        hook: HookSlotId,
    ) -> Result<FunctionComponentRefHookRecord, FunctionComponentRenderError> {
        self.ref_hooks
            .iter()
            .find(|binding| binding.hook == hook)
            .map(|binding| FunctionComponentRefHookRecord {
                hook,
                ref_object: binding.ref_object,
                initial_value: binding.initial_value,
            })
            .ok_or(FunctionComponentRenderError::MissingRefHookRecord { fiber, hook })
    }

    fn state_hook_record(
        &self,
        fiber: FiberId,
        hook: HookSlotId,
    ) -> Result<FunctionComponentStateHookRecord, FunctionComponentRenderError> {
        let payload = self.state_payload_for_hook(fiber, hook)?;
        let dispatch = self.state_dispatch_for_queue(fiber, payload.queue())?;

        Ok(FunctionComponentStateHookRecord {
            hook,
            memoized_state: payload.memoized_state(),
            base_state: payload.base_state(),
            base_queue: payload.base_queue(),
            queue: payload.queue(),
            dispatch,
        })
    }

    fn reducer_hook_record(
        &self,
        fiber: FiberId,
        hook: HookSlotId,
    ) -> Result<FunctionComponentReducerHookRecord, FunctionComponentRenderError> {
        let payload = self.state_payload_for_hook(fiber, hook)?;
        let dispatch = self.state_dispatch_for_queue(fiber, payload.queue())?;
        let reducer = self.reducer_for_queue(fiber, payload.queue())?;

        Ok(FunctionComponentReducerHookRecord {
            hook,
            reducer,
            memoized_state: payload.memoized_state(),
            base_state: payload.base_state(),
            base_queue: payload.base_queue(),
            queue: payload.queue(),
            dispatch,
        })
    }

    fn process_state_hook_queue(
        &mut self,
        fiber: FiberId,
        hook: HookSlotId,
        lanes: FunctionComponentStateUpdateRenderLanes,
        reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
    ) -> Result<FunctionComponentStateUpdateRenderRecord, FunctionComponentRenderError> {
        let previous_payload = self.state_payload_for_hook(fiber, hook)?;
        let dispatch = self.state_dispatch_for_queue(fiber, previous_payload.queue())?;
        let mut slot = state_slot_from_payload(previous_payload);
        let result = self
            .state_queues
            .process_update_queue(
                &mut slot,
                lanes.render_lanes(),
                lanes.root_render_lanes(),
                reducer,
            )
            .map_err(|error| FunctionComponentRenderError::hook_queue(fiber, error))?;
        let next_payload = state_payload_from_slot(&slot);
        self.hook_lists
            .set_hook_payload(hook, HookSlotPayload::state(next_payload))
            .map_err(|error| FunctionComponentRenderError::hook_list(fiber, error))?;

        Ok(state_update_render_record_from_result(
            fiber,
            hook,
            dispatch,
            lanes,
            previous_payload,
            result,
        ))
    }

    fn process_reducer_hook_queue(
        &mut self,
        fiber: FiberId,
        hook: HookSlotId,
        reducer_id: FunctionComponentReducerHandle,
        lanes: FunctionComponentStateUpdateRenderLanes,
        reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
    ) -> Result<FunctionComponentReducerUpdateRenderRecord, FunctionComponentRenderError> {
        let previous_payload = self.state_payload_for_hook(fiber, hook)?;
        let dispatch = self.state_dispatch_for_queue(fiber, previous_payload.queue())?;
        self.reducer_for_queue(fiber, previous_payload.queue())?;
        self.state_queues
            .queue_mut(previous_payload.queue())
            .map_err(|error| FunctionComponentRenderError::hook_queue(fiber, error))?
            .set_last_rendered_reducer(FunctionComponentStateReducerId::Reducer(reducer_id));
        let mut slot = state_slot_from_payload(previous_payload);
        let result = self
            .state_queues
            .process_update_queue(
                &mut slot,
                lanes.render_lanes(),
                lanes.root_render_lanes(),
                reducer,
            )
            .map_err(|error| FunctionComponentRenderError::hook_queue(fiber, error))?;
        let next_payload = state_payload_from_slot(&slot);
        self.hook_lists
            .set_hook_payload(hook, HookSlotPayload::state(next_payload))
            .map_err(|error| FunctionComponentRenderError::hook_list(fiber, error))?;

        Ok(reducer_update_render_record_from_result(
            fiber,
            hook,
            dispatch,
            reducer_id,
            lanes,
            previous_payload,
            result,
        ))
    }

    fn state_payload_for_hook(
        &self,
        fiber: FiberId,
        hook: HookSlotId,
    ) -> Result<HookStatePayload, FunctionComponentRenderError> {
        self.hook_lists
            .hook(hook)
            .map_err(|error| FunctionComponentRenderError::hook_list(fiber, error))?
            .payload()
            .state_payload()
            .ok_or(FunctionComponentRenderError::MissingStateHookPayload { fiber, hook })
    }

    fn state_dispatch_for_queue(
        &self,
        fiber: FiberId,
        queue: HookQueueId,
    ) -> Result<FunctionComponentStateDispatchHandle, FunctionComponentRenderError> {
        let queue_record = self
            .state_queues
            .queue(queue)
            .map_err(|error| FunctionComponentRenderError::hook_queue(fiber, error))?;
        queue_record
            .dispatch()
            .copied()
            .ok_or(FunctionComponentRenderError::MissingStateDispatch { fiber, queue })
    }

    fn reducer_for_queue(
        &self,
        fiber: FiberId,
        queue: HookQueueId,
    ) -> Result<FunctionComponentReducerHandle, FunctionComponentRenderError> {
        let queue_record = self
            .state_queues
            .queue(queue)
            .map_err(|error| FunctionComponentRenderError::hook_queue(fiber, error))?;
        match queue_record.last_rendered_reducer().copied() {
            Some(FunctionComponentStateReducerId::Reducer(reducer)) => Ok(reducer),
            Some(FunctionComponentStateReducerId::BasicState) | None => {
                Err(FunctionComponentRenderError::ExpectedReducerQueue { fiber, queue })
            }
        }
    }

    fn create_state_dispatch(
        &mut self,
        fiber: FiberId,
        queue: HookQueueId,
    ) -> Result<FunctionComponentStateDispatchHandle, FunctionComponentRenderError> {
        let raw = self.next_state_dispatch_raw;
        if raw == 0 {
            return Err(FunctionComponentRenderError::StateDispatchHandleOverflow);
        }
        let dispatch = FunctionComponentStateDispatchHandle::from_raw(raw);
        self.next_state_dispatch_raw = raw.checked_add(1).unwrap_or(0);
        self.state_dispatches
            .push(FunctionComponentStateDispatchBinding {
                handle: dispatch,
                fiber,
                queue,
            });
        Ok(dispatch)
    }

    fn validate_dispatch_eager_state(
        &self,
        binding: FunctionComponentStateDispatchBinding,
        eager_state: Option<FunctionComponentStateDispatchEagerState>,
    ) -> Result<(), FunctionComponentRenderError> {
        let Some(eager_state) = eager_state else {
            return Ok(());
        };
        let queue = self
            .state_queues
            .queue(binding.queue)
            .map_err(|error| FunctionComponentRenderError::hook_queue(binding.fiber, error))?;
        if queue.last_rendered_reducer().is_none() {
            return Err(FunctionComponentRenderError::MissingStateDispatchReducer {
                fiber: binding.fiber,
                queue: binding.queue,
            });
        }
        let expected = *queue.last_rendered_state();
        let actual = eager_state.last_rendered_state();
        if actual != expected {
            return Err(
                FunctionComponentRenderError::StateDispatchEagerStateMismatch {
                    fiber: binding.fiber,
                    queue: binding.queue,
                    expected,
                    actual,
                },
            );
        }
        Ok(())
    }

    fn validate_live_dispatch_binding(
        &self,
        binding: FunctionComponentStateDispatchBinding,
    ) -> Result<(), FunctionComponentRenderError> {
        let queue = self
            .state_queues
            .queue(binding.queue)
            .map_err(|error| FunctionComponentRenderError::hook_queue(binding.fiber, error))?;
        let Some(queue_dispatch) = queue.dispatch().copied() else {
            return Err(FunctionComponentRenderError::MissingStateDispatch {
                fiber: binding.fiber,
                queue: binding.queue,
            });
        };
        if queue_dispatch != binding.handle {
            return Err(FunctionComponentRenderError::StaleStateDispatch {
                fiber: binding.fiber,
                queue: binding.queue,
                expected: queue_dispatch,
                actual: binding.handle,
            });
        }

        Ok(())
    }

    fn validate_basic_state_dispatch_binding(
        &self,
        binding: FunctionComponentStateDispatchBinding,
    ) -> Result<(), FunctionComponentRenderError> {
        self.validate_live_dispatch_binding(binding)?;
        let queue = self
            .state_queues
            .queue(binding.queue)
            .map_err(|error| FunctionComponentRenderError::hook_queue(binding.fiber, error))?;
        let actual = queue.last_rendered_reducer().copied();
        if actual != Some(FunctionComponentStateReducerId::BasicState) {
            return Err(FunctionComponentRenderError::ExpectedBasicStateQueue {
                fiber: binding.fiber,
                queue: binding.queue,
                actual,
            });
        }

        Ok(())
    }

    fn validate_reducer_dispatch_render_context(
        &self,
        state: FunctionComponentHookRenderState,
        binding: FunctionComponentStateDispatchBinding,
    ) -> Result<(), FunctionComponentRenderError> {
        let context_matches_fiber = state.render_fiber() == binding.fiber
            || state
                .current()
                .is_some_and(|current| current == binding.fiber);
        if !context_matches_fiber
            || !self.reducer_dispatch_queue_in_render_context(state, binding.queue)?
        {
            return Err(
                FunctionComponentRenderError::ReducerDispatchOutsideRenderContext {
                    dispatch: binding.handle,
                    fiber: binding.fiber,
                    render_fiber: state.render_fiber(),
                    current: state.current(),
                },
            );
        }

        Ok(())
    }

    fn reducer_dispatch_queue_in_render_context(
        &self,
        state: FunctionComponentHookRenderState,
        queue: HookQueueId,
    ) -> Result<bool, FunctionComponentRenderError> {
        if self.hook_list_contains_state_queue(
            state.render_fiber(),
            state.work_in_progress_list(),
            queue,
        )? {
            return Ok(true);
        }

        let Some(current_list) = state.current_list() else {
            return Ok(false);
        };

        self.hook_list_contains_state_queue(state.render_fiber(), current_list, queue)
    }

    fn hook_list_contains_state_queue(
        &self,
        fiber: FiberId,
        list: HookListId,
        queue: HookQueueId,
    ) -> Result<bool, FunctionComponentRenderError> {
        for hook in self
            .hook_lists
            .ordered_hooks(list)
            .map_err(|error| FunctionComponentRenderError::hook_list(fiber, error))?
        {
            let payload = self
                .hook_lists
                .hook(hook)
                .map_err(|error| FunctionComponentRenderError::hook_list(fiber, error))?
                .payload();
            if payload
                .state_payload()
                .is_some_and(|payload| payload.queue() == queue)
            {
                return Ok(true);
            }
        }

        Ok(false)
    }

    fn state_dispatch_binding(
        &self,
        dispatch: FunctionComponentStateDispatchHandle,
    ) -> Result<FunctionComponentStateDispatchBinding, FunctionComponentRenderError> {
        self.state_dispatches
            .iter()
            .find(|binding| binding.handle == dispatch)
            .copied()
            .ok_or(FunctionComponentRenderError::UnknownStateDispatch { dispatch })
    }

    fn record_reducer_dispatch_queue_diagnostic_unchecked(
        &mut self,
        record: FunctionComponentReducerDispatchQueueRecord,
    ) {
        if let Some(queue) = self
            .reducer_dispatch_diagnostics
            .iter_mut()
            .find(|queue| queue.hook_list() == record.hook_list())
        {
            queue.records.push(record);
        } else {
            self.reducer_dispatch_diagnostics.push(
                FunctionComponentReducerDispatchQueueDiagnostics {
                    hook_list: record.hook_list(),
                    records: vec![record],
                },
            );
        }
    }

    fn create_ref_object(
        &mut self,
    ) -> Result<FunctionComponentRefObjectHandle, FunctionComponentRenderError> {
        let raw = self.next_ref_object_raw;
        if raw == 0 {
            return Err(FunctionComponentRenderError::RefObjectHandleOverflow);
        }
        let ref_object = FunctionComponentRefObjectHandle::from_raw(raw);
        self.next_ref_object_raw = raw.checked_add(1).unwrap_or(0);
        Ok(ref_object)
    }

    fn bind_memo_hook_unchecked(
        &mut self,
        hook: HookSlotId,
        value: StateHandle,
        dependencies: HookEffectDependencies,
    ) {
        if let Some(binding) = self
            .memo_hooks
            .iter_mut()
            .find(|binding| binding.hook == hook)
        {
            binding.value = value;
            binding.dependencies = dependencies;
        } else {
            self.memo_hooks.push(FunctionComponentMemoHookBinding {
                hook,
                value,
                dependencies,
            });
        }
    }

    fn bind_ref_hook_unchecked(
        &mut self,
        hook: HookSlotId,
        ref_object: FunctionComponentRefObjectHandle,
        initial_value: StateHandle,
    ) {
        if let Some(binding) = self
            .ref_hooks
            .iter_mut()
            .find(|binding| binding.hook == hook)
        {
            binding.ref_object = ref_object;
            binding.initial_value = initial_value;
        } else {
            self.ref_hooks.push(FunctionComponentRefHookBinding {
                hook,
                ref_object,
                initial_value,
            });
        }
    }

    pub(crate) fn bind_current_list_unchecked(&mut self, fiber: FiberId, list: HookListId) {
        if let Some(binding) = self
            .current_lists
            .iter_mut()
            .find(|binding| binding.fiber == fiber)
        {
            binding.list = list;
        } else {
            self.current_lists
                .push(FunctionComponentCurrentHookList { fiber, list });
        }
    }

    fn next_current_hook_for_update_cursor(
        &self,
        cursor: &FunctionComponentHookRenderCursor,
    ) -> Result<HookSlotId, FunctionComponentRenderError> {
        match cursor {
            FunctionComponentHookRenderCursor::Update { state, cursor } => {
                cursor.next_current().ok_or_else(|| {
                    FunctionComponentRenderError::hook_list(
                        state.render_fiber(),
                        HookListError::RenderedMoreHooksThanPreviousRender {
                            current_list: cursor.current_list(),
                            work_in_progress_list: cursor.work_in_progress_list(),
                            attempted_index: cursor.consumed(),
                        },
                    )
                })
            }
            FunctionComponentHookRenderCursor::Mount { state, .. } => {
                Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                    fiber: state.render_fiber(),
                    expected: FunctionComponentHookRenderPhase::Update,
                    actual: FunctionComponentHookRenderPhase::Mount,
                })
            }
        }
    }

    fn effect_dependency_status_for_update_cursor(
        &self,
        cursor: &FunctionComponentHookRenderCursor,
        dependencies: HookEffectDependencies,
    ) -> Result<FunctionComponentEffectDependencyStatus, FunctionComponentRenderError> {
        let previous_hook = self.next_current_hook_for_update_cursor(cursor)?;
        let state = cursor.state();
        let previous_effect = self
            .hook_lists
            .hook(previous_hook)
            .map_err(|error| FunctionComponentRenderError::hook_list(state.render_fiber(), error))?
            .payload()
            .effect_payload()
            .ok_or(FunctionComponentRenderError::ExpectedEffectHookPayload {
                fiber: state.render_fiber(),
                hook: previous_hook,
            })?
            .effect();
        let previous_effect_node =
            self.hook_effects
                .get_effect(previous_effect)
                .map_err(|error| {
                    FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
                })?;

        Ok(effect_dependency_status(
            previous_effect_node.dependencies(),
            dependencies,
        ))
    }

    fn ensure_mount_cursor_ready(
        &self,
        state: FunctionComponentHookRenderState,
        cursor: &HookListMountCursor,
    ) -> Result<(), FunctionComponentRenderError> {
        let list = self.hook_lists.list(cursor.list()).map_err(|error| {
            FunctionComponentRenderError::hook_list(state.render_fiber(), error)
        })?;
        if list.len() != cursor.appended() {
            return Err(FunctionComponentRenderError::hook_list(
                state.render_fiber(),
                HookListError::TraversalCursorOutOfSync {
                    list: cursor.list(),
                    expected_len: cursor.appended(),
                    actual_len: list.len(),
                },
            ));
        }
        Ok(())
    }

    fn push_effect_for_list(
        &mut self,
        state: FunctionComponentHookRenderState,
        list: HookListId,
        tag: HookEffectFlags,
        instance: HookEffectInstanceId,
        create: HookEffectCallbackHandle,
        dependencies: HookEffectDependencies,
    ) -> Result<HookEffectId, FunctionComponentRenderError> {
        self.hook_lists.list(list).map_err(|error| {
            FunctionComponentRenderError::hook_list(state.render_fiber(), error)
        })?;
        let ring_index = self.ensure_effect_ring_index(list);
        let mut ring = self.effect_rings[ring_index].ring;
        let effect = self
            .hook_effects
            .push_effect(&mut ring, tag, instance, create, dependencies)
            .map_err(|error| {
                FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
            })?;
        self.effect_rings[ring_index].ring = ring;
        Ok(effect)
    }

    fn ensure_effect_ring_index(&mut self, list: HookListId) -> usize {
        if let Some(index) = self
            .effect_rings
            .iter()
            .position(|binding| binding.list == list)
        {
            index
        } else {
            self.effect_rings.push(FunctionComponentEffectRingBinding {
                list,
                ring: HookEffectRing::new(),
            });
            self.effect_rings.len() - 1
        }
    }

    fn push_effect_update_queue_record(
        &mut self,
        mut record: FunctionComponentEffectUpdateQueueRecord,
    ) {
        let queue_index = self.ensure_effect_update_queue_index(record.hook_list());
        record.update_index = self.effect_update_queues[queue_index].records.len();
        self.effect_update_queues[queue_index].records.push(record);
    }

    pub fn record_memo_update_diagnostic(
        &mut self,
        state: FunctionComponentHookRenderState,
        render_lanes: Lanes,
        update: FunctionComponentMemoUpdateRecord,
    ) -> Result<FunctionComponentMemoUpdateDiagnosticRecord, FunctionComponentRenderError> {
        if state.phase() != FunctionComponentHookRenderPhase::Update {
            return Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                fiber: state.render_fiber(),
                expected: FunctionComponentHookRenderPhase::Update,
                actual: state.phase(),
            });
        }

        let current =
            state
                .current()
                .ok_or(FunctionComponentRenderError::MissingCurrentHookList {
                    fiber: state.render_fiber(),
                })?;
        let current_hook_list =
            state
                .current_list()
                .ok_or(FunctionComponentRenderError::MissingCurrentHookList {
                    fiber: state.render_fiber(),
                })?;
        self.hook_lists.list(current_hook_list).map_err(|error| {
            FunctionComponentRenderError::hook_list(state.render_fiber(), error)
        })?;
        self.hook_lists
            .list(state.work_in_progress_list())
            .map_err(|error| {
                FunctionComponentRenderError::hook_list(state.render_fiber(), error)
            })?;

        let record = FunctionComponentMemoUpdateDiagnosticRecord {
            diagnostic_index: 0,
            fiber: state.render_fiber(),
            current,
            current_hook_list,
            hook_list: state.work_in_progress_list(),
            previous_hook: update.previous_hook(),
            hook: update.hook(),
            render_lanes,
            previous_value: update.previous_value(),
            previous_dependencies: update.previous_dependencies(),
            requested_value: update.requested_value(),
            value: update.value(),
            dependencies: update.dependencies(),
            dependency_status: update.dependency_status(),
        };
        Ok(self.push_memo_update_diagnostic_record(record))
    }

    fn push_memo_update_diagnostic_record(
        &mut self,
        mut record: FunctionComponentMemoUpdateDiagnosticRecord,
    ) -> FunctionComponentMemoUpdateDiagnosticRecord {
        let queue_index = self.ensure_memo_update_diagnostics_index(record.hook_list());
        record.diagnostic_index = self.memo_update_diagnostics[queue_index].records.len();
        self.memo_update_diagnostics[queue_index]
            .records
            .push(record);
        record
    }

    fn ensure_memo_update_diagnostics_index(&mut self, list: HookListId) -> usize {
        if let Some(index) = self
            .memo_update_diagnostics
            .iter()
            .position(|queue| queue.hook_list() == list)
        {
            index
        } else {
            self.memo_update_diagnostics
                .push(FunctionComponentMemoUpdateDiagnostics {
                    hook_list: list,
                    records: Vec::new(),
                });
            self.memo_update_diagnostics.len() - 1
        }
    }

    pub fn record_callback_update_diagnostic(
        &mut self,
        state: FunctionComponentHookRenderState,
        render_lanes: Lanes,
        update: FunctionComponentCallbackUpdateRecord,
    ) -> Result<FunctionComponentCallbackUpdateDiagnosticRecord, FunctionComponentRenderError> {
        if state.phase() != FunctionComponentHookRenderPhase::Update {
            return Err(FunctionComponentRenderError::HookCursorPhaseMismatch {
                fiber: state.render_fiber(),
                expected: FunctionComponentHookRenderPhase::Update,
                actual: state.phase(),
            });
        }

        let current =
            state
                .current()
                .ok_or(FunctionComponentRenderError::MissingCurrentHookList {
                    fiber: state.render_fiber(),
                })?;
        let current_hook_list =
            state
                .current_list()
                .ok_or(FunctionComponentRenderError::MissingCurrentHookList {
                    fiber: state.render_fiber(),
                })?;
        self.hook_lists.list(current_hook_list).map_err(|error| {
            FunctionComponentRenderError::hook_list(state.render_fiber(), error)
        })?;
        self.hook_lists
            .list(state.work_in_progress_list())
            .map_err(|error| {
                FunctionComponentRenderError::hook_list(state.render_fiber(), error)
            })?;

        let record = FunctionComponentCallbackUpdateDiagnosticRecord {
            diagnostic_index: 0,
            fiber: state.render_fiber(),
            current,
            current_hook_list,
            hook_list: state.work_in_progress_list(),
            previous_hook: update.previous_hook(),
            hook: update.hook(),
            render_lanes,
            previous_callback: update.previous_callback(),
            previous_dependencies: update.previous_dependencies(),
            requested_callback: update.requested_callback(),
            callback: update.callback(),
            dependencies: update.dependencies(),
            dependency_status: update.dependency_status(),
        };
        Ok(self.push_callback_update_diagnostic_record(record))
    }

    fn push_callback_update_diagnostic_record(
        &mut self,
        mut record: FunctionComponentCallbackUpdateDiagnosticRecord,
    ) -> FunctionComponentCallbackUpdateDiagnosticRecord {
        let queue_index = self.ensure_callback_update_diagnostics_index(record.hook_list());
        record.diagnostic_index = self.callback_update_diagnostics[queue_index].records.len();
        self.callback_update_diagnostics[queue_index]
            .records
            .push(record);
        record
    }

    fn ensure_callback_update_diagnostics_index(&mut self, list: HookListId) -> usize {
        if let Some(index) = self
            .callback_update_diagnostics
            .iter()
            .position(|queue| queue.hook_list() == list)
        {
            index
        } else {
            self.callback_update_diagnostics
                .push(FunctionComponentCallbackUpdateDiagnostics {
                    hook_list: list,
                    records: Vec::new(),
                });
            self.callback_update_diagnostics.len() - 1
        }
    }

    fn ensure_effect_update_queue_index(&mut self, list: HookListId) -> usize {
        if let Some(index) = self
            .effect_update_queues
            .iter()
            .position(|queue| queue.hook_list() == list)
        {
            index
        } else {
            self.effect_update_queues
                .push(FunctionComponentEffectUpdateQueue {
                    hook_list: list,
                    records: Vec::new(),
                });
            self.effect_update_queues.len() - 1
        }
    }

    fn record_pending_effect_queue_state_unchecked(
        &mut self,
        state: FunctionComponentHookRenderState,
    ) {
        if let Some(binding) = self
            .pending_effect_queues
            .iter_mut()
            .find(|binding| binding.fiber == state.render_fiber())
        {
            binding.state = state;
        } else {
            self.pending_effect_queues
                .push(FunctionComponentPendingEffectQueueBinding {
                    fiber: state.render_fiber(),
                    state,
                });
        }
    }

    fn pending_effect_queue_state(
        &self,
        fiber: FiberId,
    ) -> Option<FunctionComponentHookRenderState> {
        self.pending_effect_queues
            .iter()
            .find(|binding| binding.fiber == fiber)
            .map(|binding| binding.state)
    }

    fn record_committed_effect_queue_unchecked(
        &mut self,
        queue: FunctionComponentCommittedEffectQueue,
    ) {
        if let Some(existing) = self
            .committed_effect_queues
            .iter_mut()
            .find(|existing| existing.fiber() == queue.fiber())
        {
            *existing = queue;
        } else {
            self.committed_effect_queues.push(queue);
        }
    }

    fn committed_effect_records_for_render_state(
        &self,
        state: FunctionComponentHookRenderState,
        lanes: Lanes,
    ) -> Result<Vec<FunctionComponentCommittedEffectRecord>, FunctionComponentRenderError> {
        let list = state.work_in_progress_list();
        self.hook_lists.list(list).map_err(|error| {
            FunctionComponentRenderError::hook_list(state.render_fiber(), error)
        })?;

        if state.phase() == FunctionComponentHookRenderPhase::Update {
            let update_records = self.effect_update_queue_records(state)?;
            if !update_records.is_empty() {
                return Ok(update_records
                    .iter()
                    .map(|record| FunctionComponentCommittedEffectRecord {
                        effect_index: record.update_index(),
                        hook_list: record.hook_list(),
                        effect: record.effect(),
                        previous_effect: Some(record.previous_effect()),
                        instance: record.instance(),
                        phase: record.phase(),
                        tag: record.tag(),
                        create: record.create(),
                        destroy: record.destroy(),
                        previous_dependencies: Some(record.previous_dependencies()),
                        dependencies: record.dependencies(),
                        dependency_status: Some(record.dependency_status()),
                        lanes,
                    })
                    .collect());
            }
        }

        let Some(ring) = self.effect_ring(list) else {
            return Ok(Vec::new());
        };
        let effects = ring.iter(&self.hook_effects).map_err(|error| {
            FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
        })?;
        let mut records = Vec::new();
        for (effect_index, effect) in effects.enumerate() {
            let effect = effect.map_err(|error| {
                FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
            })?;
            let destroy = self
                .hook_effects
                .effect_destroy(effect.id())
                .map_err(|error| {
                    FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
                })?;
            records.push(FunctionComponentCommittedEffectRecord {
                effect_index,
                hook_list: list,
                effect: effect.id(),
                previous_effect: None,
                instance: effect.instance(),
                phase: function_component_effect_phase_from_flags(effect.tag()),
                tag: effect.tag(),
                create: effect.create(),
                destroy,
                previous_dependencies: None,
                dependencies: effect.dependencies(),
                dependency_status: None,
                lanes,
            });
        }

        Ok(records)
    }
}

fn state_payload_from_slot(slot: &HookStateSlot<StateHandle>) -> HookStatePayload {
    HookStatePayload::new(
        *slot.memoized_state(),
        *slot.base_state(),
        slot.base_queue(),
        slot.queue(),
    )
}

fn state_slot_from_payload(payload: HookStatePayload) -> HookStateSlot<StateHandle> {
    let mut slot = HookStateSlot::new(payload.memoized_state(), payload.queue());
    slot.set_base_state(payload.base_state());
    slot.set_base_queue(payload.base_queue());
    slot
}

fn memo_dependency_status(
    previous: HookEffectDependencies,
    next: HookEffectDependencies,
) -> FunctionComponentMemoDependencyStatus {
    if next.is_always_run() || previous != next {
        FunctionComponentMemoDependencyStatus::Changed
    } else {
        FunctionComponentMemoDependencyStatus::Unchanged
    }
}

fn effect_dependency_status(
    previous: HookEffectDependencies,
    next: HookEffectDependencies,
) -> FunctionComponentEffectDependencyStatus {
    if next.is_always_run() || previous != next {
        FunctionComponentEffectDependencyStatus::Changed
    } else {
        FunctionComponentEffectDependencyStatus::Unchanged
    }
}

fn callback_to_memo_value(callback: FunctionComponentCallbackHandle) -> StateHandle {
    StateHandle::from_raw(callback.raw())
}

fn callback_from_memo_value(value: StateHandle) -> FunctionComponentCallbackHandle {
    FunctionComponentCallbackHandle::from_raw(value.raw())
}

fn callback_hook_record_from_memo(
    record: FunctionComponentMemoHookRecord,
) -> FunctionComponentCallbackHookRecord {
    FunctionComponentCallbackHookRecord {
        hook: record.hook(),
        callback: callback_from_memo_value(record.value()),
        dependencies: record.dependencies(),
    }
}

fn callback_update_record_from_memo(
    record: FunctionComponentMemoUpdateRecord,
) -> FunctionComponentCallbackUpdateRecord {
    FunctionComponentCallbackUpdateRecord {
        hook: record.hook(),
        previous_hook: record.previous_hook(),
        previous_callback: callback_from_memo_value(record.previous_value()),
        previous_dependencies: record.previous_dependencies(),
        requested_callback: callback_from_memo_value(record.requested_value()),
        callback: callback_from_memo_value(record.value()),
        dependencies: record.dependencies(),
        dependency_status: record.dependency_status(),
    }
}

fn ref_payload(ref_object: FunctionComponentRefObjectHandle) -> HookSlotPayload {
    HookSlotPayload::opaque(StateHandle::from_raw(ref_object.raw()))
}

fn state_update_render_record_from_result(
    fiber: FiberId,
    hook: HookSlotId,
    dispatch: FunctionComponentStateDispatchHandle,
    lanes: FunctionComponentStateUpdateRenderLanes,
    previous_payload: HookStatePayload,
    result: ProcessHookQueueResult<StateHandle>,
) -> FunctionComponentStateUpdateRenderRecord {
    FunctionComponentStateUpdateRenderRecord {
        fiber,
        hook,
        queue: previous_payload.queue(),
        dispatch,
        lanes,
        previous_memoized_state: previous_payload.memoized_state(),
        previous_base_state: previous_payload.base_state(),
        previous_base_queue: previous_payload.base_queue(),
        memoized_state: *result.memoized_state(),
        base_state: *result.base_state(),
        base_queue: result.base_queue(),
        remaining_lanes: result.remaining_lanes(),
        applied_update_count: result.applied_update_count(),
        skipped_update_count: result.skipped_update_count(),
        reverted_update_count: result.reverted_update_count(),
        eager_update_count: result.eager_update_count(),
    }
}

fn reducer_update_render_record_from_result(
    fiber: FiberId,
    hook: HookSlotId,
    dispatch: FunctionComponentStateDispatchHandle,
    reducer: FunctionComponentReducerHandle,
    lanes: FunctionComponentStateUpdateRenderLanes,
    previous_payload: HookStatePayload,
    result: ProcessHookQueueResult<StateHandle>,
) -> FunctionComponentReducerUpdateRenderRecord {
    FunctionComponentReducerUpdateRenderRecord {
        fiber,
        hook,
        queue: previous_payload.queue(),
        dispatch,
        reducer,
        lanes,
        previous_memoized_state: previous_payload.memoized_state(),
        previous_base_state: previous_payload.base_state(),
        previous_base_queue: previous_payload.base_queue(),
        memoized_state: *result.memoized_state(),
        base_state: *result.base_state(),
        base_queue: result.base_queue(),
        remaining_lanes: result.remaining_lanes(),
        applied_update_count: result.applied_update_count(),
        skipped_update_count: result.skipped_update_count(),
        reverted_update_count: result.reverted_update_count(),
        eager_update_count: result.eager_update_count(),
    }
}

fn function_component_effect_phase_from_flags(
    tag: HookEffectFlags,
) -> FunctionComponentEffectPhase {
    if tag.contains_any(HookEffectFlags::INSERTION) {
        FunctionComponentEffectPhase::Insertion
    } else if tag.contains_any(HookEffectFlags::LAYOUT) {
        FunctionComponentEffectPhase::Layout
    } else {
        FunctionComponentEffectPhase::Passive
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentHookRenderCursor {
    Mount {
        state: FunctionComponentHookRenderState,
        cursor: HookListMountCursor,
    },
    Update {
        state: FunctionComponentHookRenderState,
        cursor: HookListUpdateCursor,
    },
}

impl FunctionComponentHookRenderCursor {
    #[must_use]
    pub const fn state(self) -> FunctionComponentHookRenderState {
        match self {
            Self::Mount { state, .. } | Self::Update { state, .. } => state,
        }
    }

    #[must_use]
    pub const fn phase(self) -> FunctionComponentHookRenderPhase {
        self.state().phase()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentEffectPhase {
    Insertion,
    Layout,
    Passive,
}

impl FunctionComponentEffectPhase {
    #[must_use]
    pub const fn hook_flags(self) -> HookEffectFlags {
        match self {
            Self::Insertion => HookEffectFlags::INSERTION,
            Self::Layout => HookEffectFlags::LAYOUT,
            Self::Passive => HookEffectFlags::PASSIVE,
        }
    }

    #[must_use]
    pub const fn mount_fiber_flags(self) -> FiberFlags {
        match self {
            Self::Insertion => FiberFlags::UPDATE,
            Self::Layout => FiberFlags::UPDATE.merge(FiberFlags::LAYOUT_STATIC),
            Self::Passive => FiberFlags::PASSIVE.merge(FiberFlags::PASSIVE_STATIC),
        }
    }

    #[must_use]
    pub const fn update_fiber_flags(self) -> FiberFlags {
        match self {
            Self::Insertion | Self::Layout => FiberFlags::UPDATE,
            Self::Passive => FiberFlags::PASSIVE,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentEffectDependencyStatus {
    Changed,
    Unchanged,
}

impl FunctionComponentEffectDependencyStatus {
    #[must_use]
    pub const fn should_register_has_effect(self) -> bool {
        matches!(self, Self::Changed)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentEffectDependencyPhase {
    Mount,
    UpdateChanged,
    UpdateUnchanged,
}

impl FunctionComponentEffectDependencyPhase {
    #[must_use]
    pub const fn from_render_metadata(
        render_phase: FunctionComponentHookRenderPhase,
        dependency_status: Option<FunctionComponentEffectDependencyStatus>,
    ) -> Self {
        match (render_phase, dependency_status) {
            (FunctionComponentHookRenderPhase::Mount, _) => Self::Mount,
            (
                FunctionComponentHookRenderPhase::Update,
                Some(FunctionComponentEffectDependencyStatus::Unchanged),
            ) => Self::UpdateUnchanged,
            (FunctionComponentHookRenderPhase::Update, _) => Self::UpdateChanged,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentEffectRegistration {
    hook: HookSlotId,
    effect: HookEffectId,
    instance: HookEffectInstanceId,
    phase: FunctionComponentEffectPhase,
    tag: HookEffectFlags,
    create: HookEffectCallbackHandle,
    dependencies: HookEffectDependencies,
    fiber_flags: FiberFlags,
}

impl FunctionComponentEffectRegistration {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn phase(self) -> FunctionComponentEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn fiber_flags(self) -> FiberFlags {
        self.fiber_flags
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentPassiveEffectMetadata {
    fiber: FiberId,
    render_phase: FunctionComponentHookRenderPhase,
    hook_list: HookListId,
    effect_index: usize,
    effect: HookEffectId,
    previous_effect: Option<HookEffectId>,
    instance: HookEffectInstanceId,
    tag: HookEffectFlags,
    create: HookEffectCallbackHandle,
    destroy: Option<HookEffectCallbackHandle>,
    dependencies: HookEffectDependencies,
    lanes: Lanes,
}

impl FunctionComponentPassiveEffectMetadata {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn render_phase(self) -> FunctionComponentHookRenderPhase {
        self.render_phase
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectMetadata {
    fiber: FiberId,
    render_phase: FunctionComponentHookRenderPhase,
    hook_list: HookListId,
    effect_index: usize,
    effect: HookEffectId,
    previous_effect: Option<HookEffectId>,
    instance: HookEffectInstanceId,
    tag: HookEffectFlags,
    create: HookEffectCallbackHandle,
    destroy: Option<HookEffectCallbackHandle>,
    previous_dependencies: Option<HookEffectDependencies>,
    dependencies: HookEffectDependencies,
    dependency_status: Option<FunctionComponentEffectDependencyStatus>,
    lanes: Lanes,
}

impl FunctionComponentLayoutEffectMetadata {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn render_phase(self) -> FunctionComponentHookRenderPhase {
        self.render_phase
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> Option<HookEffectDependencies> {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> Option<FunctionComponentEffectDependencyStatus> {
        self.dependency_status
    }

    #[must_use]
    pub const fn dependency_phase(self) -> FunctionComponentEffectDependencyPhase {
        FunctionComponentEffectDependencyPhase::from_render_metadata(
            self.render_phase,
            self.dependency_status,
        )
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentHookRenderResult {
    state: FunctionComponentHookRenderState,
    traversal: HookListTraversalResult,
}

impl FunctionComponentHookRenderResult {
    #[must_use]
    pub const fn state(self) -> FunctionComponentHookRenderState {
        self.state
    }

    #[must_use]
    pub const fn traversal(self) -> HookListTraversalResult {
        self.traversal
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentInvocationRequest {
    fiber: FiberId,
    component: FiberTypeHandle,
    props: PropsHandle,
    render_lanes: Lanes,
    hook_state: Option<FunctionComponentHookRenderState>,
    context_state: Option<FunctionComponentContextRenderState>,
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

    #[must_use]
    pub const fn hook_state(self) -> Option<FunctionComponentHookRenderState> {
        self.hook_state
    }

    #[must_use]
    pub const fn context_state(self) -> Option<FunctionComponentContextRenderState> {
        self.context_state
    }

    #[must_use]
    fn with_hook_state(self, hook_state: FunctionComponentHookRenderState) -> Self {
        Self {
            hook_state: Some(hook_state),
            ..self
        }
    }

    #[must_use]
    fn with_context_state(self, context_state: FunctionComponentContextRenderState) -> Self {
        Self {
            context_state: Some(context_state),
            ..self
        }
    }
}

pub(crate) trait FunctionComponentInvoker {
    fn invoke_function_component(
        &mut self,
        request: FunctionComponentInvocationRequest,
    ) -> Result<FunctionComponentOutputHandle, FunctionComponentInvocationError>;
}

pub(crate) trait FunctionComponentContextConsumerInvoker {
    fn invoke_function_component_context_consumer(
        &mut self,
        request: FunctionComponentInvocationRequest,
        reader: &mut FunctionComponentContextRenderReader<'_>,
    ) -> Result<FunctionComponentOutputHandle, FunctionComponentRenderError>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentSingleChildOutput {
    output: FunctionComponentOutputHandle,
    element: RootElementHandle,
    tag: FiberTag,
    element_type: ElementTypeHandle,
    props: PropsHandle,
}

impl FunctionComponentSingleChildOutput {
    #[must_use]
    pub const fn new(
        output: FunctionComponentOutputHandle,
        element: RootElementHandle,
        tag: FiberTag,
        element_type: ElementTypeHandle,
        props: PropsHandle,
    ) -> Self {
        Self {
            output,
            element,
            tag,
            element_type,
            props,
        }
    }

    #[must_use]
    pub const fn host_component(
        output: FunctionComponentOutputHandle,
        element: RootElementHandle,
        element_type: ElementTypeHandle,
        props: PropsHandle,
    ) -> Self {
        Self::new(
            output,
            element,
            FiberTag::HostComponent,
            element_type,
            props,
        )
    }

    #[must_use]
    pub const fn host_text(
        output: FunctionComponentOutputHandle,
        element: RootElementHandle,
        props: PropsHandle,
    ) -> Self {
        Self::new(
            output,
            element,
            FiberTag::HostText,
            ElementTypeHandle::NONE,
            props,
        )
    }

    #[must_use]
    pub const fn output(self) -> FunctionComponentOutputHandle {
        self.output
    }

    #[must_use]
    pub const fn element(self) -> RootElementHandle {
        self.element
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn element_type(self) -> ElementTypeHandle {
        self.element_type
    }

    #[must_use]
    pub const fn props(self) -> PropsHandle {
        self.props
    }
}

pub(crate) trait FunctionComponentSingleChildOutputResolver {
    fn resolve_function_component_single_child_output(
        &self,
        output: FunctionComponentOutputHandle,
    ) -> Option<FunctionComponentSingleChildOutput>;
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
    fn hook_list(fiber: FiberId, error: HookListError) -> Self {
        Self::HookList {
            fiber,
            error: Box::new(error),
        }
    }

    fn hook_effect(fiber: FiberId, error: HookEffectArenaError) -> Self {
        Self::HookEffect {
            fiber,
            error: Box::new(error),
        }
    }

    fn hook_queue(fiber: FiberId, error: HookQueueError) -> Self {
        Self::HookQueue {
            fiber,
            error: Box::new(error),
        }
    }

    fn context_stack(fiber: FiberId, error: ContextStackError) -> Self {
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentSingleChildReconciliationRecord {
    function_component: FiberId,
    current: Option<FiberId>,
    output: FunctionComponentOutputHandle,
    child_element: RootElementHandle,
    child_tag: FiberTag,
    child_element_type: ElementTypeHandle,
    child_props: PropsHandle,
    render_lanes: Lanes,
}

impl FunctionComponentSingleChildReconciliationRecord {
    #[must_use]
    pub const fn function_component(self) -> FiberId {
        self.function_component
    }

    #[must_use]
    pub const fn current(self) -> Option<FiberId> {
        self.current
    }

    #[must_use]
    pub const fn output(self) -> FunctionComponentOutputHandle {
        self.output
    }

    #[must_use]
    pub const fn child_element(self) -> RootElementHandle {
        self.child_element
    }

    #[must_use]
    pub const fn child_tag(self) -> FiberTag {
        self.child_tag
    }

    #[must_use]
    pub const fn child_element_type(self) -> ElementTypeHandle {
        self.child_element_type
    }

    #[must_use]
    pub const fn child_props(self) -> PropsHandle {
        self.child_props
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentSingleChildUpdateReconciliationRecord {
    function_component: FiberId,
    current: FiberId,
    current_child: FiberId,
    work_in_progress_child: FiberId,
    output: FunctionComponentOutputHandle,
    child_element: RootElementHandle,
    child_tag: FiberTag,
    child_element_type: ElementTypeHandle,
    previous_child_props: PropsHandle,
    child_props: PropsHandle,
    render_lanes: Lanes,
}

impl FunctionComponentSingleChildUpdateReconciliationRecord {
    #[must_use]
    pub const fn function_component(self) -> FiberId {
        self.function_component
    }

    #[must_use]
    pub const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn current_child(self) -> FiberId {
        self.current_child
    }

    #[must_use]
    pub const fn work_in_progress_child(self) -> FiberId {
        self.work_in_progress_child
    }

    #[must_use]
    pub const fn output(self) -> FunctionComponentOutputHandle {
        self.output
    }

    #[must_use]
    pub const fn child_element(self) -> RootElementHandle {
        self.child_element
    }

    #[must_use]
    pub const fn child_tag(self) -> FiberTag {
        self.child_tag
    }

    #[must_use]
    pub const fn child_element_type(self) -> ElementTypeHandle {
        self.child_element_type
    }

    #[must_use]
    pub const fn previous_child_props(self) -> PropsHandle {
        self.previous_child_props
    }

    #[must_use]
    pub const fn child_props(self) -> PropsHandle {
        self.child_props
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentRenderRecord {
    current: Option<FiberId>,
    work_in_progress: FiberId,
    component: FiberTypeHandle,
    props: PropsHandle,
    render_lanes: Lanes,
    hook_state: Option<FunctionComponentHookRenderState>,
    context_state: Option<FunctionComponentContextRenderState>,
    context_read_count: usize,
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
    pub const fn hook_state(self) -> Option<FunctionComponentHookRenderState> {
        self.hook_state
    }

    #[must_use]
    pub const fn context_state(self) -> Option<FunctionComponentContextRenderState> {
        self.context_state
    }

    #[must_use]
    pub const fn context_read_count(self) -> usize {
        self.context_read_count
    }

    #[must_use]
    pub const fn has_context_reads(self) -> bool {
        self.context_read_count != 0
    }

    #[must_use]
    pub const fn output(self) -> FunctionComponentOutputHandle {
        self.output
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseStateRenderRecord {
    render: FunctionComponentRenderRecord,
    hook_result: FunctionComponentHookRenderResult,
    state_hook: FunctionComponentUseStateHookRenderRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseReducerRenderRecord {
    render: FunctionComponentRenderRecord,
    hook_result: FunctionComponentHookRenderResult,
    reducer_hook: FunctionComponentUseReducerHookRenderRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseContextRenderRecord {
    render: FunctionComponentRenderRecord,
    context_read: FunctionComponentContextReadRecord,
}

impl FunctionComponentUseStateRenderRecord {
    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.render
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
    pub const fn hook_state(self) -> FunctionComponentHookRenderState {
        self.hook_result.state()
    }

    #[must_use]
    pub const fn hook_traversal(self) -> HookListTraversalResult {
        self.hook_result.traversal()
    }
}

impl FunctionComponentUseReducerRenderRecord {
    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.render
    }

    #[must_use]
    pub const fn hook_result(self) -> FunctionComponentHookRenderResult {
        self.hook_result
    }

    #[must_use]
    pub const fn reducer_hook(self) -> FunctionComponentUseReducerHookRenderRecord {
        self.reducer_hook
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
    pub const fn hook_state(self) -> FunctionComponentHookRenderState {
        self.hook_result.state()
    }

    #[must_use]
    pub const fn hook_traversal(self) -> HookListTraversalResult {
        self.hook_result.traversal()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseMemoRenderRecord {
    render: FunctionComponentRenderRecord,
    hook_result: FunctionComponentHookRenderResult,
    memo_hook: FunctionComponentUseMemoHookRenderRecord,
    memo_update_diagnostic: Option<FunctionComponentMemoUpdateDiagnosticRecord>,
}

impl FunctionComponentUseMemoRenderRecord {
    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.render
    }

    #[must_use]
    pub const fn hook_result(self) -> FunctionComponentHookRenderResult {
        self.hook_result
    }

    #[must_use]
    pub const fn memo_hook(self) -> FunctionComponentUseMemoHookRenderRecord {
        self.memo_hook
    }

    #[must_use]
    pub const fn memo_update_diagnostic(
        self,
    ) -> Option<FunctionComponentMemoUpdateDiagnosticRecord> {
        self.memo_update_diagnostic
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
    pub const fn hook_state(self) -> FunctionComponentHookRenderState {
        self.hook_result.state()
    }

    #[must_use]
    pub const fn hook_traversal(self) -> HookListTraversalResult {
        self.hook_result.traversal()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseMemoUseRefRenderRecord {
    render: FunctionComponentRenderRecord,
    hook_result: FunctionComponentHookRenderResult,
    memo_hook: FunctionComponentUseMemoHookRenderRecord,
    memo_update_diagnostic: Option<FunctionComponentMemoUpdateDiagnosticRecord>,
    ref_hook: FunctionComponentUseRefHookRenderRecord,
}

impl FunctionComponentUseMemoUseRefRenderRecord {
    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.render
    }

    #[must_use]
    pub const fn hook_result(self) -> FunctionComponentHookRenderResult {
        self.hook_result
    }

    #[must_use]
    pub const fn memo_hook(self) -> FunctionComponentUseMemoHookRenderRecord {
        self.memo_hook
    }

    #[must_use]
    pub const fn memo_update_diagnostic(
        self,
    ) -> Option<FunctionComponentMemoUpdateDiagnosticRecord> {
        self.memo_update_diagnostic
    }

    #[must_use]
    pub const fn ref_hook(self) -> FunctionComponentUseRefHookRenderRecord {
        self.ref_hook
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
    pub const fn hook_state(self) -> FunctionComponentHookRenderState {
        self.hook_result.state()
    }

    #[must_use]
    pub const fn hook_traversal(self) -> HookListTraversalResult {
        self.hook_result.traversal()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseCallbackRenderRecord {
    render: FunctionComponentRenderRecord,
    hook_result: FunctionComponentHookRenderResult,
    callback_hook: FunctionComponentUseCallbackHookRenderRecord,
    callback_update_diagnostic: Option<FunctionComponentCallbackUpdateDiagnosticRecord>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseEffectRenderRecord {
    render: FunctionComponentRenderRecord,
    hook_result: FunctionComponentHookRenderResult,
    effect_hook: FunctionComponentUseEffectHookRenderRecord,
    passive_effects: Vec<FunctionComponentPassiveEffectMetadata>,
}

impl FunctionComponentUseEffectRenderRecord {
    #[must_use]
    pub const fn render(&self) -> FunctionComponentRenderRecord {
        self.render
    }

    #[must_use]
    pub const fn hook_result(&self) -> FunctionComponentHookRenderResult {
        self.hook_result
    }

    #[must_use]
    pub const fn effect_hook(&self) -> FunctionComponentUseEffectHookRenderRecord {
        self.effect_hook
    }

    #[must_use]
    pub fn passive_effects(&self) -> &[FunctionComponentPassiveEffectMetadata] {
        &self.passive_effects
    }

    #[must_use]
    pub const fn current(&self) -> Option<FiberId> {
        self.render.current()
    }

    #[must_use]
    pub const fn work_in_progress(&self) -> FiberId {
        self.render.work_in_progress()
    }

    #[must_use]
    pub const fn render_lanes(&self) -> Lanes {
        self.render.render_lanes()
    }

    #[must_use]
    pub const fn output(&self) -> FunctionComponentOutputHandle {
        self.render.output()
    }

    #[must_use]
    pub const fn hook_state(&self) -> FunctionComponentHookRenderState {
        self.hook_result.state()
    }

    #[must_use]
    pub const fn hook_traversal(&self) -> HookListTraversalResult {
        self.hook_result.traversal()
    }
}

impl FunctionComponentUseCallbackRenderRecord {
    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.render
    }

    #[must_use]
    pub const fn hook_result(self) -> FunctionComponentHookRenderResult {
        self.hook_result
    }

    #[must_use]
    pub const fn callback_hook(self) -> FunctionComponentUseCallbackHookRenderRecord {
        self.callback_hook
    }

    #[must_use]
    pub const fn callback_update_diagnostic(
        self,
    ) -> Option<FunctionComponentCallbackUpdateDiagnosticRecord> {
        self.callback_update_diagnostic
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
    pub const fn hook_state(self) -> FunctionComponentHookRenderState {
        self.hook_result.state()
    }

    #[must_use]
    pub const fn hook_traversal(self) -> HookListTraversalResult {
        self.hook_result.traversal()
    }
}

impl FunctionComponentUseContextRenderRecord {
    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.render
    }

    #[must_use]
    pub const fn context_read(self) -> FunctionComponentContextReadRecord {
        self.context_read
    }

    #[must_use]
    pub const fn context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.context_read.dependency()
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
    pub const fn context_state(self) -> FunctionComponentContextRenderState {
        self.render
            .context_state()
            .expect("use_context render record must carry context state")
    }

    #[must_use]
    pub const fn context_read_count(self) -> usize {
        self.render.context_read_count()
    }
}

pub(crate) fn render_function_component(
    arena: &mut FiberArena,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<FunctionComponentRenderRecord, FunctionComponentRenderError> {
    render_function_component_impl(arena, work_in_progress, render_lanes, invoker, None)
}

pub(crate) fn render_function_component_with_hook_state(
    arena: &mut FiberArena,
    hook_store: &mut FunctionComponentHookRenderStore,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<FunctionComponentRenderRecord, FunctionComponentRenderError> {
    render_function_component_impl(
        arena,
        work_in_progress,
        render_lanes,
        invoker,
        Some(hook_store),
    )
}

pub(crate) fn render_function_component_with_use_state(
    arena: &mut FiberArena,
    hook_store: &mut FunctionComponentHookRenderStore,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    state_request: FunctionComponentUseStateRenderRequest,
    invoker: &mut impl FunctionComponentInvoker,
    mut reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
) -> Result<FunctionComponentUseStateRenderRecord, FunctionComponentRenderError> {
    let mut request = validate_function_component_render(arena, work_in_progress, render_lanes)?;
    let hook_state = hook_store.prepare_render_state(arena, work_in_progress)?;
    request = request.with_hook_state(hook_state);
    reset_function_component_render_state(arena, work_in_progress)?;

    let mut cursor = hook_store.begin_render_cursor(hook_state)?;
    let state_hook = match hook_state.phase() {
        FunctionComponentHookRenderPhase::Mount => {
            FunctionComponentUseStateHookRenderRecord::Mount(
                hook_store.mount_state_hook(&mut cursor, state_request.initial_state())?,
            )
        }
        FunctionComponentHookRenderPhase::Update => {
            FunctionComponentUseStateHookRenderRecord::Update(
                hook_store.update_state_hook_with_queued_updates(
                    &mut cursor,
                    state_request.lanes(),
                    &mut reducer,
                )?,
            )
        }
    };
    let hook_result = hook_store.finish_render_cursor(cursor)?;

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

    Ok(FunctionComponentUseStateRenderRecord {
        render: FunctionComponentRenderRecord {
            current: arena.get(work_in_progress)?.alternate(),
            work_in_progress,
            component: request.component(),
            props: request.props(),
            render_lanes: request.render_lanes(),
            hook_state: request.hook_state(),
            context_state: request.context_state(),
            context_read_count: 0,
            output,
        },
        hook_result,
        state_hook,
    })
}

pub(crate) fn render_function_component_with_use_reducer(
    arena: &mut FiberArena,
    hook_store: &mut FunctionComponentHookRenderStore,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    reducer_request: FunctionComponentUseReducerRenderRequest,
    invoker: &mut impl FunctionComponentInvoker,
    mut reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
) -> Result<FunctionComponentUseReducerRenderRecord, FunctionComponentRenderError> {
    let mut request = validate_function_component_render(arena, work_in_progress, render_lanes)?;
    let hook_state = hook_store.prepare_render_state(arena, work_in_progress)?;
    request = request.with_hook_state(hook_state);
    reset_function_component_render_state(arena, work_in_progress)?;

    let mut cursor = hook_store.begin_render_cursor(hook_state)?;
    let reducer_hook = match hook_state.phase() {
        FunctionComponentHookRenderPhase::Mount => {
            FunctionComponentUseReducerHookRenderRecord::Mount(hook_store.mount_reducer_hook(
                &mut cursor,
                reducer_request.reducer(),
                reducer_request.initial_state(),
            )?)
        }
        FunctionComponentHookRenderPhase::Update => {
            FunctionComponentUseReducerHookRenderRecord::Update(
                hook_store.update_reducer_hook_with_queued_updates(
                    &mut cursor,
                    reducer_request.reducer(),
                    reducer_request.lanes(),
                    &mut reducer,
                )?,
            )
        }
    };
    let hook_result = hook_store.finish_render_cursor(cursor)?;

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

    Ok(FunctionComponentUseReducerRenderRecord {
        render: FunctionComponentRenderRecord {
            current: arena.get(work_in_progress)?.alternate(),
            work_in_progress,
            component: request.component(),
            props: request.props(),
            render_lanes: request.render_lanes(),
            hook_state: request.hook_state(),
            context_state: request.context_state(),
            context_read_count: 0,
            output,
        },
        hook_result,
        reducer_hook,
    })
}

pub(crate) fn render_function_component_with_use_memo(
    arena: &mut FiberArena,
    hook_store: &mut FunctionComponentHookRenderStore,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    memo_request: FunctionComponentUseMemoRenderRequest,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<FunctionComponentUseMemoRenderRecord, FunctionComponentRenderError> {
    let mut request = validate_function_component_render(arena, work_in_progress, render_lanes)?;
    let hook_state = hook_store.prepare_render_state(arena, work_in_progress)?;
    request = request.with_hook_state(hook_state);
    reset_function_component_render_state(arena, work_in_progress)?;

    let mut pending_memo_update = None;
    let mut cursor = hook_store.begin_render_cursor(hook_state)?;
    let memo_hook = match hook_state.phase() {
        FunctionComponentHookRenderPhase::Mount => {
            FunctionComponentUseMemoHookRenderRecord::Mount(hook_store.mount_memo_hook(
                &mut cursor,
                memo_request.value(),
                memo_request.dependencies(),
            )?)
        }
        FunctionComponentHookRenderPhase::Update => {
            let update = hook_store.update_memo_hook(
                &mut cursor,
                memo_request.value(),
                memo_request.dependencies(),
            )?;
            pending_memo_update = Some(update);
            FunctionComponentUseMemoHookRenderRecord::Update(update)
        }
    };
    let hook_result = hook_store.finish_render_cursor(cursor)?;

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

    let memo_update_diagnostic = match pending_memo_update {
        Some(update) => Some(hook_store.record_memo_update_diagnostic(
            hook_state,
            request.render_lanes(),
            update,
        )?),
        None => None,
    };

    Ok(FunctionComponentUseMemoRenderRecord {
        render: FunctionComponentRenderRecord {
            current: arena.get(work_in_progress)?.alternate(),
            work_in_progress,
            component: request.component(),
            props: request.props(),
            render_lanes: request.render_lanes(),
            hook_state: request.hook_state(),
            context_state: request.context_state(),
            context_read_count: 0,
            output,
        },
        hook_result,
        memo_hook,
        memo_update_diagnostic,
    })
}

pub(crate) fn render_function_component_with_use_memo_and_ref(
    arena: &mut FiberArena,
    hook_store: &mut FunctionComponentHookRenderStore,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    memo_request: FunctionComponentUseMemoRenderRequest,
    ref_request: FunctionComponentUseRefRenderRequest,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<FunctionComponentUseMemoUseRefRenderRecord, FunctionComponentRenderError> {
    let mut request = validate_function_component_render(arena, work_in_progress, render_lanes)?;
    let hook_state = hook_store.prepare_render_state(arena, work_in_progress)?;
    request = request.with_hook_state(hook_state);
    reset_function_component_render_state(arena, work_in_progress)?;

    let mut pending_memo_update = None;
    let mut cursor = hook_store.begin_render_cursor(hook_state)?;
    let (memo_hook, ref_hook) = match hook_state.phase() {
        FunctionComponentHookRenderPhase::Mount => (
            FunctionComponentUseMemoHookRenderRecord::Mount(hook_store.mount_memo_hook(
                &mut cursor,
                memo_request.value(),
                memo_request.dependencies(),
            )?),
            FunctionComponentUseRefHookRenderRecord::Mount(
                hook_store.mount_ref_hook(&mut cursor, ref_request.initial_value())?,
            ),
        ),
        FunctionComponentHookRenderPhase::Update => {
            let memo_update = hook_store.update_memo_hook(
                &mut cursor,
                memo_request.value(),
                memo_request.dependencies(),
            )?;
            pending_memo_update = Some(memo_update);
            (
                FunctionComponentUseMemoHookRenderRecord::Update(memo_update),
                FunctionComponentUseRefHookRenderRecord::Update(
                    hook_store.update_ref_hook(&mut cursor, ref_request.initial_value())?,
                ),
            )
        }
    };
    let hook_result = hook_store.finish_render_cursor(cursor)?;

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

    let memo_update_diagnostic = match pending_memo_update {
        Some(update) => Some(hook_store.record_memo_update_diagnostic(
            hook_state,
            request.render_lanes(),
            update,
        )?),
        None => None,
    };

    Ok(FunctionComponentUseMemoUseRefRenderRecord {
        render: FunctionComponentRenderRecord {
            current: arena.get(work_in_progress)?.alternate(),
            work_in_progress,
            component: request.component(),
            props: request.props(),
            render_lanes: request.render_lanes(),
            hook_state: request.hook_state(),
            context_state: request.context_state(),
            context_read_count: 0,
            output,
        },
        hook_result,
        memo_hook,
        memo_update_diagnostic,
        ref_hook,
    })
}

pub(crate) fn render_function_component_with_use_callback(
    arena: &mut FiberArena,
    hook_store: &mut FunctionComponentHookRenderStore,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    callback_request: FunctionComponentUseCallbackRenderRequest,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<FunctionComponentUseCallbackRenderRecord, FunctionComponentRenderError> {
    let mut request = validate_function_component_render(arena, work_in_progress, render_lanes)?;
    let hook_state = hook_store.prepare_render_state(arena, work_in_progress)?;
    request = request.with_hook_state(hook_state);
    reset_function_component_render_state(arena, work_in_progress)?;

    let mut pending_callback_update = None;
    let mut cursor = hook_store.begin_render_cursor(hook_state)?;
    let callback_hook = match hook_state.phase() {
        FunctionComponentHookRenderPhase::Mount => {
            FunctionComponentUseCallbackHookRenderRecord::Mount(hook_store.mount_callback_hook(
                &mut cursor,
                callback_request.callback(),
                callback_request.dependencies(),
            )?)
        }
        FunctionComponentHookRenderPhase::Update => {
            let update = hook_store.update_callback_hook(
                &mut cursor,
                callback_request.callback(),
                callback_request.dependencies(),
            )?;
            pending_callback_update = Some(update);
            FunctionComponentUseCallbackHookRenderRecord::Update(update)
        }
    };
    let hook_result = hook_store.finish_render_cursor(cursor)?;

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

    let callback_update_diagnostic = match pending_callback_update {
        Some(update) => Some(hook_store.record_callback_update_diagnostic(
            hook_state,
            request.render_lanes(),
            update,
        )?),
        None => None,
    };

    Ok(FunctionComponentUseCallbackRenderRecord {
        render: FunctionComponentRenderRecord {
            current: arena.get(work_in_progress)?.alternate(),
            work_in_progress,
            component: request.component(),
            props: request.props(),
            render_lanes: request.render_lanes(),
            hook_state: request.hook_state(),
            context_state: request.context_state(),
            context_read_count: 0,
            output,
        },
        hook_result,
        callback_hook,
        callback_update_diagnostic,
    })
}

pub(crate) fn render_function_component_with_use_effect(
    arena: &mut FiberArena,
    hook_store: &mut FunctionComponentHookRenderStore,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    effect_request: FunctionComponentUseEffectRenderRequest,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<FunctionComponentUseEffectRenderRecord, FunctionComponentRenderError> {
    let mut request = validate_function_component_render(arena, work_in_progress, render_lanes)?;
    let hook_state = hook_store.prepare_render_state(arena, work_in_progress)?;
    request = request.with_hook_state(hook_state);
    reset_function_component_render_state(arena, work_in_progress)?;

    let mut cursor = hook_store.begin_render_cursor(hook_state)?;
    let effect_hook = match hook_state.phase() {
        FunctionComponentHookRenderPhase::Mount => {
            FunctionComponentUseEffectHookRenderRecord::Mount(hook_store.mount_effect_metadata(
                arena,
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                effect_request.create(),
                effect_request.dependencies(),
            )?)
        }
        FunctionComponentHookRenderPhase::Update => {
            let registration = hook_store.update_effect_metadata_with_dependency_check(
                arena,
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                effect_request.create(),
                effect_request.dependencies(),
            )?;
            let record = hook_store
                .effect_update_queue_records(hook_state)?
                .last()
                .copied()
                .filter(|record| record.effect() == registration.effect())
                .ok_or(
                    FunctionComponentRenderError::MissingEffectUpdateQueueRecord {
                        fiber: work_in_progress,
                        effect: registration.effect(),
                    },
                )?;
            FunctionComponentUseEffectHookRenderRecord::Update(record)
        }
    };
    let hook_result = hook_store.finish_render_cursor(cursor)?;
    let passive_effects = hook_store.passive_effect_metadata(hook_state, render_lanes)?;

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

    Ok(FunctionComponentUseEffectRenderRecord {
        render: FunctionComponentRenderRecord {
            current: arena.get(work_in_progress)?.alternate(),
            work_in_progress,
            component: request.component(),
            props: request.props(),
            render_lanes: request.render_lanes(),
            hook_state: request.hook_state(),
            context_state: request.context_state(),
            context_read_count: 0,
            output,
        },
        hook_result,
        effect_hook,
        passive_effects,
    })
}

pub(crate) fn render_function_component_with_context_reads(
    arena: &mut FiberArena,
    context_store: &mut FunctionComponentContextRenderStore,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    contexts: &[ContextHandle],
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<FunctionComponentRenderRecord, FunctionComponentRenderError> {
    let mut request = validate_function_component_render(arena, work_in_progress, render_lanes)?;
    let context_state = context_store.prepare_render_state(work_in_progress, render_lanes);
    request = request.with_context_state(context_state);
    reset_function_component_render_state(arena, work_in_progress)?;

    for &context in contexts {
        context_store.read_context(context_state, context)?;
    }

    let output = invoker
        .invoke_function_component(request)
        .map_err(|error| FunctionComponentRenderError::Invocation {
            fiber: request.fiber(),
            component: request.component(),
            error,
        })?;
    let context_read_count = context_store.context_reads().len() - context_state.start_read_index();

    arena
        .get_mut(work_in_progress)?
        .set_memoized_props(request.props());

    Ok(FunctionComponentRenderRecord {
        current: arena.get(work_in_progress)?.alternate(),
        work_in_progress,
        component: request.component(),
        props: request.props(),
        render_lanes: request.render_lanes(),
        hook_state: request.hook_state(),
        context_state: request.context_state(),
        context_read_count,
        output,
    })
}

pub(crate) fn render_function_component_with_use_context(
    arena: &mut FiberArena,
    context_store: &mut FunctionComponentContextRenderStore,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<FunctionComponentUseContextRenderRecord, FunctionComponentRenderError> {
    render_function_component_with_use_context_impl(
        arena,
        context_store,
        work_in_progress,
        render_lanes,
        None,
        invoker,
    )
}

pub(crate) fn render_function_component_with_required_use_context(
    arena: &mut FiberArena,
    context_store: &mut FunctionComponentContextRenderStore,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    expected_context: ContextHandle,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<FunctionComponentUseContextRenderRecord, FunctionComponentRenderError> {
    render_function_component_with_use_context_impl(
        arena,
        context_store,
        work_in_progress,
        render_lanes,
        Some(expected_context),
        invoker,
    )
}

fn render_function_component_with_use_context_impl(
    arena: &mut FiberArena,
    context_store: &mut FunctionComponentContextRenderStore,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    expected_context: Option<ContextHandle>,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<FunctionComponentUseContextRenderRecord, FunctionComponentRenderError> {
    let mut request = validate_function_component_render(arena, work_in_progress, render_lanes)?;
    let context_state = context_store.prepare_render_state(work_in_progress, render_lanes);
    request = request.with_context_state(context_state);
    reset_function_component_render_state(arena, work_in_progress)?;

    let output = {
        let mut reader = FunctionComponentContextRenderReader {
            store: context_store,
            state: context_state,
        };
        invoker.invoke_function_component_context_consumer(request, &mut reader)?
    };

    let context_read_count = context_store.context_reads().len() - context_state.start_read_index();
    let context_read = match context_read_count {
        0 => {
            return Err(FunctionComponentRenderError::MissingUseContextRead {
                fiber: request.fiber(),
            });
        }
        1 => context_store.context_reads()[context_state.start_read_index()],
        read_count => {
            return Err(
                FunctionComponentRenderError::UnsupportedUseContextReadCount {
                    fiber: request.fiber(),
                    read_count,
                },
            );
        }
    };
    if let Some(expected) = expected_context
        && context_read.context() != expected
    {
        return Err(FunctionComponentRenderError::UnexpectedUseContextContext {
            fiber: request.fiber(),
            expected,
            actual: context_read.context(),
        });
    }

    arena
        .get_mut(work_in_progress)?
        .set_memoized_props(request.props());

    Ok(FunctionComponentUseContextRenderRecord {
        render: FunctionComponentRenderRecord {
            current: arena.get(work_in_progress)?.alternate(),
            work_in_progress,
            component: request.component(),
            props: request.props(),
            render_lanes: request.render_lanes(),
            hook_state: request.hook_state(),
            context_state: request.context_state(),
            context_read_count,
            output,
        },
        context_read,
    })
}

pub(crate) fn propagate_context_change_to_function_component_dependencies<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    context_store: &mut FunctionComponentContextRenderStore,
    render: FunctionComponentRenderRecord,
    request: FunctionComponentContextChangePropagationRequest,
) -> Result<
    FunctionComponentContextChangePropagationRecord,
    FunctionComponentContextChangePropagationError,
> {
    if request.propagation_lanes().is_empty() {
        return Err(
            FunctionComponentContextChangePropagationError::EmptyPropagationLanes {
                context: request.context(),
            },
        );
    }

    let Some(context_state) = render.context_state() else {
        return Err(
            FunctionComponentContextChangePropagationError::MissingContextDependencies {
                fiber: render.work_in_progress(),
            },
        );
    };
    let start = context_state.start_dependency_index();
    let end = start + render.context_read_count();
    let scanned_dependency_count = render.context_read_count();
    let mut marked_dependencies = Vec::new();
    let mut roots = Vec::new();

    if !request.change().is_changed() {
        return Ok(FunctionComponentContextChangePropagationRecord {
            render,
            change: request.change(),
            propagation_lanes: request.propagation_lanes(),
            scanned_dependency_count,
            marked_dependencies,
            roots,
        });
    }

    let matching_dependency_indices = context_store.dependencies[start..end]
        .iter()
        .enumerate()
        .filter_map(|(relative_index, dependency)| {
            if dependency.context() == request.context()
                && request
                    .change()
                    .changes_memoized_value(dependency.memoized_value())
            {
                Some(start + relative_index)
            } else {
                None
            }
        })
        .collect::<Vec<_>>();

    for dependency_index in matching_dependency_indices {
        let dependency = context_store.dependencies[dependency_index];
        let fiber = store.fiber_arena().get(dependency.fiber())?;
        if fiber.tag() != FiberTag::FunctionComponent {
            return Err(
                FunctionComponentContextChangePropagationError::UnsupportedDependencyFiberTag {
                    dependency: dependency.handle(),
                    fiber: dependency.fiber(),
                    tag: fiber.tag(),
                },
            );
        }

        let previous_dependency_lanes = dependency.dependency_lanes();
        let root = mark_update_lanes_from_fiber_to_root(
            store,
            dependency.fiber(),
            request.propagation_lanes(),
        )?;
        let dependency_lanes = previous_dependency_lanes.merge(request.propagation_lanes());
        context_store.dependencies[dependency_index].dependency_lanes = dependency_lanes;

        if !roots.contains(&root) {
            roots.push(root);
        }
        marked_dependencies.push(FunctionComponentContextChangePropagationDependencyRecord {
            dependency: dependency.handle(),
            fiber: dependency.fiber(),
            context: dependency.context(),
            memoized_value: dependency.memoized_value(),
            previous_value: request.previous_value(),
            next_value: request.next_value(),
            propagation_lanes: request.propagation_lanes(),
            previous_dependency_lanes,
            dependency_lanes,
            root,
        });
    }

    Ok(FunctionComponentContextChangePropagationRecord {
        render,
        change: request.change(),
        propagation_lanes: request.propagation_lanes(),
        scanned_dependency_count,
        marked_dependencies,
        roots,
    })
}

pub(crate) fn reconcile_function_component_single_child_output(
    arena: &mut FiberArena,
    render: FunctionComponentRenderRecord,
    resolver: &impl FunctionComponentSingleChildOutputResolver,
) -> Result<
    FunctionComponentSingleChildReconciliationRecord,
    FunctionComponentSingleChildReconciliationError,
> {
    let function_component = render.work_in_progress();
    let node = arena.get(function_component)?;
    let tag = node.tag();
    if tag != FiberTag::FunctionComponent {
        return Err(
            FunctionComponentSingleChildReconciliationError::UnexpectedFiberTag {
                fiber: function_component,
                tag,
            },
        );
    }
    if let Some(child) = node.child() {
        return Err(
            FunctionComponentSingleChildReconciliationError::ExistingWorkInProgressChild {
                fiber: function_component,
                child,
            },
        );
    }
    if let Some(current) = render.current()
        && let Some(child) = arena.get(current)?.child()
    {
        return Err(
            FunctionComponentSingleChildReconciliationError::ExistingCurrentChild {
                fiber: function_component,
                current,
                child,
            },
        );
    }

    let output = render.output();
    if output.is_none() {
        return Err(
            FunctionComponentSingleChildReconciliationError::MissingOutput {
                fiber: function_component,
            },
        );
    }
    let single_child = resolver
        .resolve_function_component_single_child_output(output)
        .ok_or(
            FunctionComponentSingleChildReconciliationError::UnknownOutput {
                fiber: function_component,
                output,
            },
        )?;
    if single_child.output() != output {
        return Err(
            FunctionComponentSingleChildReconciliationError::OutputMismatch {
                fiber: function_component,
                expected: output,
                actual: single_child.output(),
            },
        );
    }
    if single_child.element().is_none() {
        return Err(
            FunctionComponentSingleChildReconciliationError::MissingChildElement {
                fiber: function_component,
                output,
            },
        );
    }
    if !matches!(
        single_child.tag(),
        FiberTag::HostComponent | FiberTag::HostText
    ) {
        return Err(
            FunctionComponentSingleChildReconciliationError::UnsupportedChildTag {
                fiber: function_component,
                output,
                tag: single_child.tag(),
            },
        );
    }

    arena
        .get_mut(function_component)?
        .merge_flags(FiberFlags::PERFORMED_WORK);

    Ok(FunctionComponentSingleChildReconciliationRecord {
        function_component,
        current: render.current(),
        output,
        child_element: single_child.element(),
        child_tag: single_child.tag(),
        child_element_type: single_child.element_type(),
        child_props: single_child.props(),
        render_lanes: render.render_lanes(),
    })
}

pub(crate) fn reconcile_function_component_single_child_update_output(
    arena: &mut FiberArena,
    render: FunctionComponentRenderRecord,
    resolver: &impl FunctionComponentSingleChildOutputResolver,
) -> Result<
    FunctionComponentSingleChildUpdateReconciliationRecord,
    FunctionComponentSingleChildUpdateReconciliationError,
> {
    let function_component = render.work_in_progress();
    let node = arena.get(function_component)?;
    let tag = node.tag();
    if tag != FiberTag::FunctionComponent {
        return Err(
            FunctionComponentSingleChildUpdateReconciliationError::UnexpectedFiberTag {
                fiber: function_component,
                tag,
            },
        );
    }
    if let Some(child) = node.child() {
        return Err(
            FunctionComponentSingleChildUpdateReconciliationError::ExistingWorkInProgressChild {
                fiber: function_component,
                child,
            },
        );
    }
    let current = render.current().ok_or(
        FunctionComponentSingleChildUpdateReconciliationError::MissingCurrent {
            fiber: function_component,
        },
    )?;
    let current_child = arena.get(current)?.child().ok_or(
        FunctionComponentSingleChildUpdateReconciliationError::MissingCurrentChild {
            fiber: function_component,
            current,
        },
    )?;
    if let Some(sibling) = arena.get(current_child)?.sibling() {
        return Err(
            FunctionComponentSingleChildUpdateReconciliationError::UnexpectedCurrentChildSibling {
                fiber: function_component,
                current_child,
                sibling,
            },
        );
    }

    let output = render.output();
    if output.is_none() {
        return Err(
            FunctionComponentSingleChildUpdateReconciliationError::MissingOutput {
                fiber: function_component,
            },
        );
    }
    let single_child = resolver
        .resolve_function_component_single_child_output(output)
        .ok_or(
            FunctionComponentSingleChildUpdateReconciliationError::UnknownOutput {
                fiber: function_component,
                output,
            },
        )?;
    if single_child.output() != output {
        return Err(
            FunctionComponentSingleChildUpdateReconciliationError::OutputMismatch {
                fiber: function_component,
                expected: output,
                actual: single_child.output(),
            },
        );
    }
    if single_child.element().is_none() {
        return Err(
            FunctionComponentSingleChildUpdateReconciliationError::MissingChildElement {
                fiber: function_component,
                output,
            },
        );
    }
    if !matches!(
        single_child.tag(),
        FiberTag::HostComponent | FiberTag::HostText
    ) {
        return Err(
            FunctionComponentSingleChildUpdateReconciliationError::UnsupportedChildTag {
                fiber: function_component,
                output,
                tag: single_child.tag(),
            },
        );
    }

    let current_child_node = arena.get(current_child)?;
    let current_child_tag = current_child_node.tag();
    if current_child_tag != single_child.tag() {
        return Err(
            FunctionComponentSingleChildUpdateReconciliationError::CurrentChildTagMismatch {
                fiber: function_component,
                current_child,
                expected: single_child.tag(),
                actual: current_child_tag,
            },
        );
    }
    if current_child_tag == FiberTag::HostComponent
        && current_child_node.element_type() != single_child.element_type()
    {
        return Err(
            FunctionComponentSingleChildUpdateReconciliationError::HostComponentElementTypeMismatch {
                fiber: function_component,
                current_child,
                expected: single_child.element_type(),
                actual: current_child_node.element_type(),
            },
        );
    }
    if current_child_node.state_node().is_none() {
        return Err(
            FunctionComponentSingleChildUpdateReconciliationError::MissingCurrentChildStateNode {
                child: current_child,
                tag: current_child_tag,
            },
        );
    }
    let previous_child_props = current_child_node.memoized_props();
    if previous_child_props == single_child.props() {
        return Err(
            FunctionComponentSingleChildUpdateReconciliationError::UnchangedChildProps {
                child: current_child,
                props: previous_child_props,
            },
        );
    }

    let work_in_progress_child =
        arena.create_work_in_progress(current_child, single_child.props())?;
    {
        let child_node = arena.get_mut(work_in_progress_child)?;
        child_node.set_element_type(single_child.element_type());
        child_node.set_memoized_props(single_child.props());
        child_node.set_lanes(Lanes::NO);
        child_node.merge_flags(FiberFlags::UPDATE);
    }
    arena.set_children(function_component, &[work_in_progress_child])?;
    arena
        .get_mut(function_component)?
        .merge_flags(FiberFlags::PERFORMED_WORK);

    Ok(FunctionComponentSingleChildUpdateReconciliationRecord {
        function_component,
        current,
        current_child,
        work_in_progress_child,
        output,
        child_element: single_child.element(),
        child_tag: single_child.tag(),
        child_element_type: single_child.element_type(),
        previous_child_props,
        child_props: single_child.props(),
        render_lanes: render.render_lanes(),
    })
}

fn render_function_component_impl(
    arena: &mut FiberArena,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    invoker: &mut impl FunctionComponentInvoker,
    hook_store: Option<&mut FunctionComponentHookRenderStore>,
) -> Result<FunctionComponentRenderRecord, FunctionComponentRenderError> {
    let mut request = validate_function_component_render(arena, work_in_progress, render_lanes)?;
    if let Some(hook_store) = hook_store {
        let hook_state = hook_store.prepare_render_state(arena, work_in_progress)?;
        request = request.with_hook_state(hook_state);
    }
    reset_function_component_render_state(arena, work_in_progress)?;

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
        hook_state: request.hook_state(),
        context_state: request.context_state(),
        context_read_count: 0,
        output,
    })
}

fn validate_function_component_render(
    arena: &FiberArena,
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

    Ok(FunctionComponentInvocationRequest {
        fiber: work_in_progress,
        component,
        props,
        render_lanes,
        hook_state: None,
        context_state: None,
    })
}

fn reset_function_component_render_state(
    arena: &mut FiberArena,
    work_in_progress: FiberId,
) -> Result<(), FunctionComponentRenderError> {
    let node = arena.get_mut(work_in_progress)?;
    node.set_memoized_state(StateHandle::NONE);
    node.set_update_queue(UpdateQueueHandle::NONE);
    node.set_lanes(Lanes::NO);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::root_commit::{
        HostRootFinishedWorkCommitHandoffErrorForCanary,
        HostRootFinishedWorkCommitHandoffRecordForCanary,
        commit_finished_host_root_with_finished_work_handoff_for_canary,
        record_host_root_finished_work_pending_commit_for_canary,
    };
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{
        FiberRootStore, HostRootRenderPhaseRecord, RootOptions, render_host_root_for_lanes,
    };
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
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(store, host_render, 1)?;
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
        let resolver = StaticSingleChildResolver::new(Some(
            FunctionComponentSingleChildOutput::host_component(
                output,
                child_element,
                element_type,
                child_props,
            ),
        ));

        let record =
            reconcile_function_component_single_child_output(&mut arena, render, &resolver)
                .unwrap();

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
            reconcile_function_component_single_child_output(&mut arena, render, &resolver)
                .unwrap();

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
            let render = render_function_component(
                &mut arena,
                work_in_progress,
                Lanes::DEFAULT,
                &mut registry,
            )
            .unwrap();
            let resolver =
                StaticSingleChildResolver::new(Some(FunctionComponentSingleChildOutput::new(
                    output,
                    RootElementHandle::from_raw(59),
                    tag,
                    ElementTypeHandle::from_raw(590),
                    PropsHandle::from_raw(591),
                )));

            let error =
                reconcile_function_component_single_child_output(&mut arena, render, &resolver)
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
        hook_store.bind_current_list_unchecked(
            current,
            changed_render.hook_state().work_in_progress_list(),
        );

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
        let effect_request =
            FunctionComponentUseEffectRenderRequest::new(callback(1100), deps(1101));

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
        let effect_request =
            FunctionComponentUseEffectRenderRequest::new(callback(1123), deps(1124));

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
        let effect_request =
            FunctionComponentUseEffectRenderRequest::new(callback(1133), deps(1131));

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
                FunctionComponentStateDispatchRequest::new(
                    current_state.dispatch(),
                    action(442),
                    lane,
                )
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
        let retry_lanes =
            FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT);
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
        let request = FunctionComponentReducerDispatchRequest::new(
            current_reducer.dispatch(),
            action(7),
            lane,
        )
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
        hook_store.bind_current_list_unchecked(
            current,
            skipped_render.hook_state().work_in_progress_list(),
        );

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
                FunctionComponentReducerDispatchRequest::new(
                    basic_state.dispatch(),
                    action(8),
                    lane,
                ),
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
        let resolver =
            StaticSingleChildResolver::new(Some(FunctionComponentSingleChildOutput::new(
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
                FunctionComponentStateDispatchRequest::new(
                    first_state.dispatch(),
                    action(903),
                    lane,
                ),
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
                FunctionComponentStateDispatchRequest::new(
                    reducer_state.dispatch(),
                    action(905),
                    lane,
                ),
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
        let all_passive = hook_store
            .committed_passive_effect_metadata(work_in_progress, HookEffectFlags::PASSIVE);
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
}
