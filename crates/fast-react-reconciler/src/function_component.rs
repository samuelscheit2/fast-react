//! Private function-component render skeleton.
//!
//! This module proves the reconciler-side invocation boundary without public
//! hook facades, effects, host mutation, or child reconciliation.

#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ContextHandle, ContextStack, ContextStackError, ContextStackSnapshot, ContextValueHandle,
    ElementTypeHandle, FiberArena, FiberFlags, FiberId, FiberTag, FiberTopologyError,
    FiberTypeHandle, HookEffectArena, HookEffectArenaError, HookEffectCallbackHandle,
    HookEffectDependencies, HookEffectFlags, HookEffectId, HookEffectInstanceId, HookEffectPayload,
    HookEffectRing, HookListArena, HookListError, HookListId, HookListMountCursor,
    HookListTraversalResult, HookListUpdateCursor, HookQueueError, HookQueueId, HookQueueStore,
    HookRevertLane, HookSlotId, HookSlotPayload, HookStatePayload, HookStateSlot, HookUpdateId,
    HookUpdateLane, Lanes, ProcessHookQueueResult, PropsHandle, StateHandle, UpdateQueueHandle,
};
use fast_react_host_config::HostTypes;

use crate::root_scheduler::{RootRescheduleRequestRecord, ensure_root_is_rescheduled};
use crate::{
    ConcurrentUpdateError, FiberRootId, FiberRootStore, RootElementHandle, RootSchedulerError,
    ScheduledRootUpdateResult, mark_update_lane_from_fiber_to_root,
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
    context_count: usize,
    stack_depth: usize,
    start_read_index: usize,
}

impl FunctionComponentContextRenderState {
    #[must_use]
    pub const fn render_fiber(self) -> FiberId {
        self.render_fiber
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
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentContextReadRecord {
    fiber: FiberId,
    context: ContextHandle,
    default_value: ContextValueHandle,
    value: ContextValueHandle,
    active_provider_count: usize,
}

impl FunctionComponentContextReadRecord {
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
}

#[derive(Debug, Default)]
pub(crate) struct FunctionComponentContextRenderStore {
    stack: ContextStack,
    reads: Vec<FunctionComponentContextReadRecord>,
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
    ) -> FunctionComponentContextRenderState {
        FunctionComponentContextRenderState {
            render_fiber: work_in_progress,
            context_count: self.stack.context_count(),
            stack_depth: self.stack.stack_depth(),
            start_read_index: self.reads.len(),
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
        let record = FunctionComponentContextReadRecord {
            fiber: state.render_fiber(),
            context,
            default_value: slot.default_value(),
            value: slot.current_value(),
            active_provider_count: slot.active_provider_count(),
        };
        self.reads.push(record);
        Ok(record)
    }

    #[must_use]
    pub fn context_reads(&self) -> &[FunctionComponentContextReadRecord] {
        &self.reads
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
struct FunctionComponentMemoHookBinding {
    hook: HookSlotId,
    value: StateHandle,
    dependencies: HookEffectDependencies,
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
}

#[derive(Debug, Clone)]
pub(crate) struct FunctionComponentHookRenderStore {
    hook_lists: HookListArena,
    hook_effects: HookEffectArena,
    state_queues: FunctionComponentStateQueueStore,
    current_lists: Vec<FunctionComponentCurrentHookList>,
    effect_rings: Vec<FunctionComponentEffectRingBinding>,
    effect_update_queues: Vec<FunctionComponentEffectUpdateQueue>,
    memo_hooks: Vec<FunctionComponentMemoHookBinding>,
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
            memo_hooks: Vec::new(),
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
                hook_list: list,
                effect_index,
                effect: effect.id(),
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
                hook_list: record.hook_list(),
                effect_index: accepted.len(),
                effect: record.effect(),
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

        Ok(FunctionComponentHookRenderState {
            phase,
            render_fiber: work_in_progress,
            current,
            current_list,
            work_in_progress_list,
        })
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
            previous_value: previous.value(),
            previous_dependencies: previous.dependencies(),
            requested_value,
            value,
            dependencies,
            dependency_status,
        })
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
            dependencies,
            fiber_flags,
        })
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
            dependencies,
            fiber_flags,
        })
    }

    pub fn dispatch_state_update(
        &mut self,
        request: FunctionComponentStateDispatchRequest,
    ) -> Result<FunctionComponentStateDispatchRecord, FunctionComponentRenderError> {
        let binding = self.state_dispatch_binding(request.dispatch())?;
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

    fn bind_current_list_unchecked(&mut self, fiber: FiberId, list: HookListId) {
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
pub(crate) struct FunctionComponentEffectRegistration {
    hook: HookSlotId,
    effect: HookEffectId,
    instance: HookEffectInstanceId,
    phase: FunctionComponentEffectPhase,
    tag: HookEffectFlags,
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
    hook_list: HookListId,
    effect_index: usize,
    effect: HookEffectId,
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
    HookCursorPhaseMismatch {
        fiber: FiberId,
        expected: FunctionComponentHookRenderPhase,
        actual: FunctionComponentHookRenderPhase,
    },
    ExpectedEffectHookPayload {
        fiber: FiberId,
        hook: HookSlotId,
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
            | Self::MissingComponentHandle { .. }
            | Self::MissingCurrentHookList { .. }
            | Self::MissingMemoHookRecord { .. }
            | Self::MissingRefHookRecord { .. }
            | Self::MissingStateHookPayload { .. }
            | Self::MissingStateDispatch { .. }
            | Self::ExpectedReducerQueue { .. }
            | Self::MissingStateDispatchReducer { .. }
            | Self::StateDispatchEagerStateMismatch { .. }
            | Self::UnknownStateDispatch { .. }
            | Self::StateDispatchHandleOverflow
            | Self::RefObjectHandleOverflow
            | Self::MissingUseContextRead { .. }
            | Self::UnsupportedUseContextReadCount { .. }
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseMemoUseRefRenderRecord {
    render: FunctionComponentRenderRecord,
    hook_result: FunctionComponentHookRenderResult,
    memo_hook: FunctionComponentUseMemoHookRenderRecord,
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
        FunctionComponentHookRenderPhase::Update => (
            FunctionComponentUseMemoHookRenderRecord::Update(hook_store.update_memo_hook(
                &mut cursor,
                memo_request.value(),
                memo_request.dependencies(),
            )?),
            FunctionComponentUseRefHookRenderRecord::Update(
                hook_store.update_ref_hook(&mut cursor, ref_request.initial_value())?,
            ),
        ),
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
        ref_hook,
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
    let context_state = context_store.prepare_render_state(work_in_progress);
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
    let mut request = validate_function_component_render(arena, work_in_progress, render_lanes)?;
    let context_state = context_store.prepare_render_state(work_in_progress);
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
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{FiberRootStore, RootOptions};
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

    fn deps(raw: u64) -> HookEffectDependencies {
        HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
    }

    fn context_value(raw: u64) -> ContextValueHandle {
        ContextValueHandle::from_raw(raw)
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
        assert_eq!(state.context_count(), 1);
        assert_eq!(state.stack_depth(), 0);
        assert_eq!(state.start_read_index(), 0);
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
        assert_eq!(provider_record.context_read_count(), 1);
        let provider_reads = context_store.context_reads_for_record(provider_record);
        assert_eq!(provider_reads[0].value(), provided_value);
        assert_eq!(provider_reads[0].default_value(), default_value);
        assert_eq!(provider_reads[0].active_provider_count(), 1);
        assert!(provider_reads[0].has_active_provider());
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
        assert_eq!(default_record.context_read_count(), 1);
        let default_reads = context_store.context_reads_for_record(default_record);
        assert_eq!(default_reads[0].value(), default_value);
        assert_eq!(default_reads[0].active_provider_count(), 0);
        assert!(!default_reads[0].has_active_provider());
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
        assert_eq!(state.stack_depth(), 2);
        assert_eq!(registry.calls().len(), 1);
        assert_eq!(registry.calls()[0].context_state(), Some(state));

        let read = record.context_read();
        assert_eq!(read.fiber(), work_in_progress);
        assert_eq!(read.context(), context);
        assert_eq!(read.default_value(), default_value);
        assert_eq!(read.value(), inner_value);
        assert_eq!(read.active_provider_count(), 2);
        assert!(read.has_active_provider());
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
        assert_eq!(
            arena.get(work_in_progress).unwrap().memoized_props(),
            PropsHandle::NONE
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
    fn private_use_memo_and_ref_updates_require_matching_hook_metadata() {
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

        let passive = hook_store
            .passive_effect_metadata(state, Lanes::DEFAULT)
            .unwrap();
        assert_eq!(passive.len(), 1);
        assert_eq!(passive[0].fiber(), work_in_progress);
        assert_eq!(passive[0].hook_list(), state.work_in_progress_list());
        assert_eq!(passive[0].effect_index(), 0);
        assert_eq!(passive[0].effect(), changed.effect());
        assert_eq!(passive[0].instance(), changed.instance());
        assert_eq!(passive[0].tag(), HookEffectFlags::PASSIVE_EFFECT);
        assert_eq!(passive[0].create(), callback(1003));
        assert_eq!(passive[0].destroy(), Some(callback(1002)));
        assert_eq!(passive[0].dependencies(), deps(1004));
        assert_eq!(passive[0].lanes(), Lanes::DEFAULT);
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
