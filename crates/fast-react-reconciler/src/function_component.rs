//! Private function-component render skeleton.
//!
//! This module proves the reconciler-side invocation boundary without public
//! hook facades, effects, host mutation, or child reconciliation.

#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};
#[cfg(test)]
use std::sync::atomic::{AtomicU64, Ordering};

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

#[cfg(test)]
use fast_react_core::{HookUpdateStaging, RenderPhaseHookUpdates};

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

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseReducerAcceptedUpdateEvidenceForCanary {
    root: FiberRootId,
    current: FiberId,
    work_in_progress: FiberId,
    hook_state: FunctionComponentHookRenderState,
    hook: HookSlotId,
    queue: HookQueueId,
    dispatch: FunctionComponentStateDispatchHandle,
    dispatch_update: HookUpdateId,
    dispatch_lane: HookUpdateLane,
    reducer_at_dispatch: FunctionComponentReducerHandle,
    render_reducer: FunctionComponentReducerHandle,
    render_lanes: Lanes,
    applied_update_count: usize,
    skipped_update_count: usize,
    remaining_lanes: Lanes,
}

#[cfg(test)]
impl FunctionComponentUseReducerAcceptedUpdateEvidenceForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(crate) const fn work_in_progress(self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub(crate) const fn hook_state(self) -> FunctionComponentHookRenderState {
        self.hook_state
    }

    #[must_use]
    pub(crate) const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub(crate) const fn queue(self) -> HookQueueId {
        self.queue
    }

    #[must_use]
    pub(crate) const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }

    #[must_use]
    pub(crate) const fn dispatch_update(self) -> HookUpdateId {
        self.dispatch_update
    }

    #[must_use]
    pub(crate) const fn dispatch_lane(self) -> HookUpdateLane {
        self.dispatch_lane
    }

    #[must_use]
    pub(crate) const fn reducer_at_dispatch(self) -> FunctionComponentReducerHandle {
        self.reducer_at_dispatch
    }

    #[must_use]
    pub(crate) const fn render_reducer(self) -> FunctionComponentReducerHandle {
        self.render_reducer
    }

    #[must_use]
    pub(crate) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn applied_update_count(self) -> usize {
        self.applied_update_count
    }

    #[must_use]
    pub(crate) const fn skipped_update_count(self) -> usize {
        self.skipped_update_count
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub(crate) const fn public_hook_compatibility_claimed(self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary {
    MissingAcceptedReducerUpdate {
        root: FiberRootId,
        function_component: FiberId,
    },
    StaleHookQueueRenderEvidence {
        root: FiberRootId,
        queue_owner: FiberId,
        render_fiber: FiberId,
        queue: HookQueueId,
        dispatch: FunctionComponentStateDispatchHandle,
        render_lanes: Lanes,
        dispatch_lanes: Lanes,
    },
}

#[cfg(test)]
impl Display for FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingAcceptedReducerUpdate {
                root,
                function_component,
            } => write!(
                formatter,
                "root {} FunctionComponent fiber {} has no accepted private useReducer update evidence",
                root.raw(),
                function_component.slot().get()
            ),
            Self::StaleHookQueueRenderEvidence {
                root,
                queue_owner,
                render_fiber,
                queue,
                dispatch,
                render_lanes,
                dispatch_lanes,
            } => write!(
                formatter,
                "root {} rejected stale private useReducer queue/render evidence: queue {} dispatch {} belongs to fiber {}, render fiber {} used lanes {:?} for dispatch lanes {:?}",
                root.raw(),
                queue.raw(),
                dispatch.raw(),
                queue_owner.slot().get(),
                render_fiber.slot().get(),
                render_lanes,
                dispatch_lanes
            ),
        }
    }
}

#[cfg(test)]
impl Error for FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary {}

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

#[cfg(test)]
pub(crate) fn function_component_use_reducer_accepted_update_evidence_for_canary(
    dispatch: &FunctionComponentReducerDispatchRootRescheduleRecord,
    render: FunctionComponentUseReducerRenderRecord,
) -> Result<
    FunctionComponentUseReducerAcceptedUpdateEvidenceForCanary,
    FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary,
> {
    let dispatch_record = dispatch.dispatch();
    let update = render.reducer_hook().update_record().ok_or(
        FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary::MissingAcceptedReducerUpdate {
            root: dispatch.root(),
            function_component: render.work_in_progress(),
        },
    )?;
    let hook_state = render.hook_state();
    let current = render.current().ok_or(
        FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary::StaleHookQueueRenderEvidence {
            root: dispatch.root(),
            queue_owner: dispatch_record.fiber(),
            render_fiber: render.work_in_progress(),
            queue: dispatch_record.queue(),
            dispatch: dispatch_record.dispatch(),
            render_lanes: render.render_lanes(),
            dispatch_lanes: dispatch_record.lane().priority_lanes(),
        },
    )?;
    let dispatch_lanes = dispatch_record.lane().priority_lanes();
    let render_owns_dispatch_queue = dispatch.root() == dispatch.reschedule().root()
        && dispatch.root() == dispatch.scheduled().root()
        && current == dispatch_record.fiber()
        && hook_state.phase() == FunctionComponentHookRenderPhase::Update
        && hook_state.render_fiber() == render.work_in_progress()
        && hook_state.current() == Some(dispatch_record.fiber())
        && update.fiber() == render.work_in_progress()
        && update.queue() == dispatch_record.queue()
        && update.dispatch() == dispatch_record.dispatch()
        && update.render_lanes() == render.render_lanes()
        && update.root_render_lanes() == render.render_lanes()
        && render.render_lanes().contains_all(dispatch_lanes)
        && update.applied_update_count() > 0
        && !dispatch_record.lane().is_no_lane();
    if !render_owns_dispatch_queue {
        return Err(
            FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary::StaleHookQueueRenderEvidence {
                root: dispatch.root(),
                queue_owner: dispatch_record.fiber(),
                render_fiber: render.work_in_progress(),
                queue: dispatch_record.queue(),
                dispatch: dispatch_record.dispatch(),
                render_lanes: render.render_lanes(),
                dispatch_lanes,
            },
        );
    }

    Ok(FunctionComponentUseReducerAcceptedUpdateEvidenceForCanary {
        root: dispatch.root(),
        current,
        work_in_progress: render.work_in_progress(),
        hook_state,
        hook: update.hook(),
        queue: update.queue(),
        dispatch: update.dispatch(),
        dispatch_update: dispatch_record.update(),
        dispatch_lane: dispatch_record.lane(),
        reducer_at_dispatch: dispatch_record.reducer(),
        render_reducer: update.reducer(),
        render_lanes: render.render_lanes(),
        applied_update_count: update.applied_update_count(),
        skipped_update_count: update.skipped_update_count(),
        remaining_lanes: update.remaining_lanes(),
    })
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseRefExecutionSourceEvidenceForCanary {
    react_version: &'static str,
    react_hooks_use_ref: &'static str,
    react_fiber_hooks_mount_ref: &'static str,
    react_fiber_hooks_update_ref: &'static str,
    fast_react_mount_ref_hook: &'static str,
    fast_react_update_ref_hook: &'static str,
    public_hook_compatibility_claimed: bool,
    public_root_compatibility_claimed: bool,
    root_scheduler_integration_claimed: bool,
    scheduler_compatibility_claimed: bool,
    act_compatibility_claimed: bool,
    renderer_compatibility_claimed: bool,
}

#[cfg(test)]
impl FunctionComponentUseRefExecutionSourceEvidenceForCanary {
    #[must_use]
    pub const fn react_19_2_6() -> Self {
        Self {
            react_version: "19.2.6",
            react_hooks_use_ref: "ReactHooks.useRef",
            react_fiber_hooks_mount_ref: "ReactFiberHooks.mountRef",
            react_fiber_hooks_update_ref: "ReactFiberHooks.updateRef",
            fast_react_mount_ref_hook: "FunctionComponentHookRenderStore::mount_ref_hook",
            fast_react_update_ref_hook: "FunctionComponentHookRenderStore::update_ref_hook",
            public_hook_compatibility_claimed: false,
            public_root_compatibility_claimed: false,
            root_scheduler_integration_claimed: false,
            scheduler_compatibility_claimed: false,
            act_compatibility_claimed: false,
            renderer_compatibility_claimed: false,
        }
    }

    #[must_use]
    pub const fn react_version(self) -> &'static str {
        self.react_version
    }

    #[must_use]
    pub const fn react_hooks_use_ref(self) -> &'static str {
        self.react_hooks_use_ref
    }

    #[must_use]
    pub const fn react_fiber_hooks_mount_ref(self) -> &'static str {
        self.react_fiber_hooks_mount_ref
    }

    #[must_use]
    pub const fn react_fiber_hooks_update_ref(self) -> &'static str {
        self.react_fiber_hooks_update_ref
    }

    #[must_use]
    pub const fn fast_react_mount_ref_hook(self) -> &'static str {
        self.fast_react_mount_ref_hook
    }

    #[must_use]
    pub const fn fast_react_update_ref_hook(self) -> &'static str {
        self.fast_react_update_ref_hook
    }

    #[must_use]
    pub const fn public_hook_compatibility_claimed(self) -> bool {
        self.public_hook_compatibility_claimed
    }

    #[must_use]
    pub const fn public_root_compatibility_claimed(self) -> bool {
        self.public_root_compatibility_claimed
    }

    #[must_use]
    pub const fn root_scheduler_integration_claimed(self) -> bool {
        self.root_scheduler_integration_claimed
    }

    #[must_use]
    pub const fn scheduler_compatibility_claimed(self) -> bool {
        self.scheduler_compatibility_claimed
    }

    #[must_use]
    pub const fn act_compatibility_claimed(self) -> bool {
        self.act_compatibility_claimed
    }

    #[must_use]
    pub const fn renderer_compatibility_claimed(self) -> bool {
        self.renderer_compatibility_claimed
    }

    #[must_use]
    pub const fn is_private_execution_only(self) -> bool {
        !self.public_hook_compatibility_claimed
            && !self.public_root_compatibility_claimed
            && !self.root_scheduler_integration_claimed
            && !self.scheduler_compatibility_claimed
            && !self.act_compatibility_claimed
            && !self.renderer_compatibility_claimed
    }
}

#[cfg(test)]
#[derive(Debug, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseRefExecutionEvidenceForCanary {
    source: FunctionComponentUseRefExecutionSourceEvidenceForCanary,
    current: FiberId,
    work_in_progress: FiberId,
    mount_hook_state: FunctionComponentHookRenderState,
    update_hook_state: FunctionComponentHookRenderState,
    mount_hook: HookSlotId,
    update_hook: HookSlotId,
    ref_object: FunctionComponentRefObjectHandle,
    current_after_mount: StateHandle,
    current_after_update: StateHandle,
    ignored_update_initial_value: StateHandle,
    mount_render_lanes: Lanes,
    update_render_lanes: Lanes,
    mount_traversed_count: usize,
    update_traversed_count: usize,
    caller_built_rows_accepted: bool,
}

#[cfg(test)]
impl FunctionComponentUseRefExecutionEvidenceForCanary {
    #[must_use]
    pub const fn source(&self) -> FunctionComponentUseRefExecutionSourceEvidenceForCanary {
        self.source
    }

    #[must_use]
    pub const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn work_in_progress(&self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub const fn mount_hook_state(&self) -> FunctionComponentHookRenderState {
        self.mount_hook_state
    }

    #[must_use]
    pub const fn update_hook_state(&self) -> FunctionComponentHookRenderState {
        self.update_hook_state
    }

    #[must_use]
    pub const fn mount_hook(&self) -> HookSlotId {
        self.mount_hook
    }

    #[must_use]
    pub const fn update_hook(&self) -> HookSlotId {
        self.update_hook
    }

    #[must_use]
    pub const fn ref_object(&self) -> FunctionComponentRefObjectHandle {
        self.ref_object
    }

    #[must_use]
    pub const fn current_after_mount(&self) -> StateHandle {
        self.current_after_mount
    }

    #[must_use]
    pub const fn current_after_update(&self) -> StateHandle {
        self.current_after_update
    }

    #[must_use]
    pub const fn ignored_update_initial_value(&self) -> StateHandle {
        self.ignored_update_initial_value
    }

    #[must_use]
    pub const fn mount_render_lanes(&self) -> Lanes {
        self.mount_render_lanes
    }

    #[must_use]
    pub const fn update_render_lanes(&self) -> Lanes {
        self.update_render_lanes
    }

    #[must_use]
    pub const fn mount_traversed_count(&self) -> usize {
        self.mount_traversed_count
    }

    #[must_use]
    pub const fn update_traversed_count(&self) -> usize {
        self.update_traversed_count
    }

    #[must_use]
    pub const fn caller_built_rows_accepted(&self) -> bool {
        self.caller_built_rows_accepted
    }

    #[must_use]
    pub const fn public_hook_compatibility_claimed(&self) -> bool {
        self.source.public_hook_compatibility_claimed()
    }

    #[must_use]
    pub const fn public_root_compatibility_claimed(&self) -> bool {
        self.source.public_root_compatibility_claimed()
    }

    #[must_use]
    pub const fn root_scheduler_integration_claimed(&self) -> bool {
        self.source.root_scheduler_integration_claimed()
    }

    #[must_use]
    pub const fn scheduler_compatibility_claimed(&self) -> bool {
        self.source.scheduler_compatibility_claimed()
    }

    #[must_use]
    pub const fn act_compatibility_claimed(&self) -> bool {
        self.source.act_compatibility_claimed()
    }

    #[must_use]
    pub const fn renderer_compatibility_claimed(&self) -> bool {
        self.source.renderer_compatibility_claimed()
    }

    #[must_use]
    pub fn same_ref_identity_across_update(&self) -> bool {
        self.ref_object.is_some()
            && self.mount_hook != self.update_hook
            && self.current_after_mount == self.current_after_update
            && self.current_after_mount != self.ignored_update_initial_value
    }

    #[must_use]
    pub fn proves_private_mount_update_ref_identity(&self) -> bool {
        self.source.is_private_execution_only()
            && self.same_ref_identity_across_update()
            && !self.caller_built_rows_accepted
            && self.mount_hook_state.phase() == FunctionComponentHookRenderPhase::Mount
            && self.update_hook_state.phase() == FunctionComponentHookRenderPhase::Update
            && self.mount_traversed_count == 1
            && self.update_traversed_count == 1
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseRefExecutionEvidenceErrorForCanary {
    MissingMountUseRef {
        function_component: FiberId,
    },
    MissingUpdateUseRef {
        function_component: FiberId,
    },
    StaleOrCrossComponentUseRefEvidence {
        mount_current: Option<FiberId>,
        update_current: Option<FiberId>,
        mount_work_in_progress: FiberId,
        update_work_in_progress: FiberId,
        expected_current_list: HookListId,
        actual_current_list: Option<HookListId>,
    },
    CallerShapedUseRefEvidence {
        fiber: FiberId,
        hook: HookSlotId,
        ref_object: FunctionComponentRefObjectHandle,
    },
    RefHookListMismatch {
        fiber: FiberId,
        hook: HookSlotId,
        expected_hook_list: HookListId,
        actual_hook_list: HookListId,
        ref_object: FunctionComponentRefObjectHandle,
    },
    RefHookListOwnerMismatch {
        fiber: FiberId,
        hook_list: HookListId,
        owner: FiberId,
        ref_object: FunctionComponentRefObjectHandle,
    },
    RefIdentityMismatch {
        mount_ref_object: FunctionComponentRefObjectHandle,
        update_ref_object: FunctionComponentRefObjectHandle,
    },
    RefCurrentValueOverride {
        ref_object: FunctionComponentRefObjectHandle,
        mount_current: StateHandle,
        update_current: StateHandle,
        ignored_update_initial_value: StateHandle,
    },
}

#[cfg(test)]
impl Display for FunctionComponentUseRefExecutionEvidenceErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingMountUseRef { function_component } => write!(
                formatter,
                "FunctionComponent fiber {} has no private useRef mount evidence",
                function_component.slot().get()
            ),
            Self::MissingUpdateUseRef { function_component } => write!(
                formatter,
                "FunctionComponent fiber {} has no private useRef update evidence",
                function_component.slot().get()
            ),
            Self::StaleOrCrossComponentUseRefEvidence {
                mount_current,
                update_current,
                mount_work_in_progress,
                update_work_in_progress,
                expected_current_list,
                actual_current_list,
            } => write!(
                formatter,
                "rejected stale or cross-component private useRef evidence: mount current {:?}, update current {:?}, mount fiber {}, update fiber {}, expected current list {:?}, actual {:?}",
                mount_current.map(|fiber| fiber.slot().get()),
                update_current.map(|fiber| fiber.slot().get()),
                mount_work_in_progress.slot().get(),
                update_work_in_progress.slot().get(),
                expected_current_list,
                actual_current_list
            ),
            Self::CallerShapedUseRefEvidence {
                fiber,
                hook,
                ref_object,
            } => write!(
                formatter,
                "rejected caller-shaped private useRef evidence for fiber {} hook {} ref object {}",
                fiber.slot().get(),
                hook.slot().get(),
                ref_object.raw()
            ),
            Self::RefHookListMismatch {
                fiber,
                hook,
                expected_hook_list,
                actual_hook_list,
                ref_object,
            } => write!(
                formatter,
                "rejected private useRef evidence for fiber {} hook {} ref object {} because it belongs to hook list {:?}, expected {:?}",
                fiber.slot().get(),
                hook.slot().get(),
                ref_object.raw(),
                actual_hook_list,
                expected_hook_list
            ),
            Self::RefHookListOwnerMismatch {
                fiber,
                hook_list,
                owner,
                ref_object,
            } => write!(
                formatter,
                "rejected private useRef evidence for fiber {} hook list {:?} ref object {} because it is owned by fiber {}",
                fiber.slot().get(),
                hook_list,
                ref_object.raw(),
                owner.slot().get()
            ),
            Self::RefIdentityMismatch {
                mount_ref_object,
                update_ref_object,
            } => write!(
                formatter,
                "private useRef update returned ref object {}, expected mount ref object {}",
                update_ref_object.raw(),
                mount_ref_object.raw()
            ),
            Self::RefCurrentValueOverride {
                ref_object,
                mount_current,
                update_current,
                ignored_update_initial_value,
            } => write!(
                formatter,
                "private useRef ref object {} current value changed from {} to {} while update initializer {} should be ignored",
                ref_object.raw(),
                mount_current.raw(),
                update_current.raw(),
                ignored_update_initial_value.raw()
            ),
        }
    }
}

#[cfg(test)]
impl Error for FunctionComponentUseRefExecutionEvidenceErrorForCanary {}

#[cfg(test)]
fn validate_use_ref_store_record_for_canary(
    hook_store: &FunctionComponentHookRenderStore,
    state: FunctionComponentHookRenderState,
    record: FunctionComponentRefHookRecord,
) -> Result<(), FunctionComponentUseRefExecutionEvidenceErrorForCanary> {
    let fiber = state.render_fiber();
    let work_in_progress_list = hook_store
        .hook_lists()
        .list(state.work_in_progress_list())
        .map_err(|_| {
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::CallerShapedUseRefEvidence {
                fiber,
                hook: record.hook(),
                ref_object: record.ref_object(),
            }
        })?;
    if work_in_progress_list.owner() != fiber {
        return Err(
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::RefHookListOwnerMismatch {
                fiber,
                hook_list: state.work_in_progress_list(),
                owner: work_in_progress_list.owner(),
                ref_object: record.ref_object(),
            },
        );
    }

    let stored = hook_store
        .ref_hook_record(fiber, record.hook())
        .map_err(|_| {
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::CallerShapedUseRefEvidence {
                fiber,
                hook: record.hook(),
                ref_object: record.ref_object(),
            }
        })?;
    if stored.ref_object() != record.ref_object()
        || stored.initial_value() != record.initial_value()
    {
        return Err(
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::CallerShapedUseRefEvidence {
                fiber,
                hook: record.hook(),
                ref_object: record.ref_object(),
            },
        );
    }

    let hook = hook_store.hook_lists().hook(record.hook()).map_err(|_| {
        FunctionComponentUseRefExecutionEvidenceErrorForCanary::CallerShapedUseRefEvidence {
            fiber,
            hook: record.hook(),
            ref_object: record.ref_object(),
        }
    })?;
    let actual_hook_list = hook.list();
    if actual_hook_list != state.work_in_progress_list() {
        return Err(
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::RefHookListMismatch {
                fiber,
                hook: record.hook(),
                expected_hook_list: state.work_in_progress_list(),
                actual_hook_list,
                ref_object: record.ref_object(),
            },
        );
    }

    let payload = hook.payload();
    if payload != ref_payload(record.ref_object()) {
        return Err(
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::CallerShapedUseRefEvidence {
                fiber,
                hook: record.hook(),
                ref_object: record.ref_object(),
            },
        );
    }

    Ok(())
}

#[cfg(test)]
pub(crate) fn function_component_use_ref_execution_evidence_for_canary(
    hook_store: &FunctionComponentHookRenderStore,
    mount: FunctionComponentUseRefRenderRecord,
    update: FunctionComponentUseRefRenderRecord,
) -> Result<
    FunctionComponentUseRefExecutionEvidenceForCanary,
    FunctionComponentUseRefExecutionEvidenceErrorForCanary,
> {
    let mount_ref = mount.ref_hook().mount_record().ok_or(
        FunctionComponentUseRefExecutionEvidenceErrorForCanary::MissingMountUseRef {
            function_component: mount.work_in_progress(),
        },
    )?;
    let update_ref = update.ref_hook().update_record().ok_or(
        FunctionComponentUseRefExecutionEvidenceErrorForCanary::MissingUpdateUseRef {
            function_component: update.work_in_progress(),
        },
    )?;
    let mount_hook_state = mount.hook_state();
    let update_hook_state = update.hook_state();
    let mount_current = mount.current();
    let update_current = update.current();
    let expected_current_list = mount_hook_state.work_in_progress_list();
    let actual_current_list = update_hook_state.current_list();

    if mount.render().hook_state() != Some(mount_hook_state)
        || update.render().hook_state() != Some(update_hook_state)
        || mount_current.is_none()
        || mount_current != update_current
        || mount.work_in_progress() != update.work_in_progress()
        || mount.work_in_progress() != mount_hook_state.render_fiber()
        || update.work_in_progress() != update_hook_state.render_fiber()
        || mount_hook_state.phase() != FunctionComponentHookRenderPhase::Mount
        || mount_hook_state.current() != mount_current
        || update_hook_state.phase() != FunctionComponentHookRenderPhase::Update
        || update_hook_state.current() != update_current
        || actual_current_list != Some(expected_current_list)
        || update_current.and_then(|current| hook_store.current_list(current))
            != Some(expected_current_list)
    {
        return Err(
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::StaleOrCrossComponentUseRefEvidence {
                mount_current,
                update_current,
                mount_work_in_progress: mount.work_in_progress(),
                update_work_in_progress: update.work_in_progress(),
                expected_current_list,
                actual_current_list,
            },
        );
    }

    validate_use_ref_store_record_for_canary(hook_store, mount_hook_state, mount_ref)?;
    validate_use_ref_store_record_for_canary(
        hook_store,
        update_hook_state,
        FunctionComponentRefHookRecord {
            hook: update_ref.hook(),
            ref_object: update_ref.ref_object(),
            initial_value: update_ref.initial_value(),
        },
    )?;

    if mount_ref.ref_object() != update_ref.ref_object() {
        return Err(
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::RefIdentityMismatch {
                mount_ref_object: mount_ref.ref_object(),
                update_ref_object: update_ref.ref_object(),
            },
        );
    }

    if mount_ref.initial_value() != update_ref.initial_value()
        || update_ref.initial_value() == update_ref.ignored_initial_value()
    {
        return Err(
            FunctionComponentUseRefExecutionEvidenceErrorForCanary::RefCurrentValueOverride {
                ref_object: mount_ref.ref_object(),
                mount_current: mount_ref.initial_value(),
                update_current: update_ref.initial_value(),
                ignored_update_initial_value: update_ref.ignored_initial_value(),
            },
        );
    }

    Ok(FunctionComponentUseRefExecutionEvidenceForCanary {
        source: FunctionComponentUseRefExecutionSourceEvidenceForCanary::react_19_2_6(),
        current: mount_current.expect("validated current useRef mount evidence"),
        work_in_progress: mount.work_in_progress(),
        mount_hook_state,
        update_hook_state,
        mount_hook: mount_ref.hook(),
        update_hook: update_ref.hook(),
        ref_object: mount_ref.ref_object(),
        current_after_mount: mount_ref.initial_value(),
        current_after_update: update_ref.initial_value(),
        ignored_update_initial_value: update_ref.ignored_initial_value(),
        mount_render_lanes: mount.render_lanes(),
        update_render_lanes: update.render_lanes(),
        mount_traversed_count: mount.hook_traversal().traversed_count(),
        update_traversed_count: update.hook_traversal().traversed_count(),
        caller_built_rows_accepted: false,
    })
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

#[cfg(test)]
const FUNCTION_COMPONENT_RENDER_PHASE_RE_RENDER_LIMIT: usize = 25;

#[cfg(test)]
const HOOK_ID_GENERATION_SHIFT_FOR_CANARY: u32 = 32;

#[cfg(test)]
static FUNCTION_COMPONENT_RENDER_ATTEMPT_SEQUENCE_FOR_CANARY: AtomicU64 = AtomicU64::new(1);

#[cfg(test)]
#[must_use]
const fn hook_queue_generation_for_canary(queue: HookQueueId) -> u32 {
    (queue.raw() >> HOOK_ID_GENERATION_SHIFT_FOR_CANARY) as u32
}

#[cfg(test)]
#[must_use]
const fn hook_update_generation_for_canary(update: HookUpdateId) -> u32 {
    (update.raw() >> HOOK_ID_GENERATION_SHIFT_FOR_CANARY) as u32
}

#[cfg(test)]
#[must_use]
fn next_render_attempt_id_for_canary(
    state: FunctionComponentHookRenderState,
    render_lanes: Lanes,
) -> FunctionComponentRenderAttemptId {
    let sequence =
        FUNCTION_COMPONENT_RENDER_ATTEMPT_SEQUENCE_FOR_CANARY.fetch_add(1, Ordering::Relaxed);
    FunctionComponentRenderAttemptId::from_raw(
        ((state.render_fiber().slot().get() as u64) << 32)
            ^ (state.work_in_progress_list().arena_id().get() << 17)
            ^ ((state.work_in_progress_list().slot().get() as u64) << 1)
            ^ state.work_in_progress_list().generation().get()
            ^ render_lanes.bits() as u64
            ^ sequence,
    )
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct FunctionComponentRenderAttemptId(u64);

impl FunctionComponentRenderAttemptId {
    #[must_use]
    pub const fn from_raw(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub const fn raw(self) -> u64 {
        self.0
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentRenderPhaseSourceEvidenceForCanary {
    react_version: &'static str,
    render_with_hooks_again: &'static str,
    currently_rendering_fiber: &'static str,
    is_render_phase_update: &'static str,
    enqueue_render_phase_update: &'static str,
    reset_hooks_on_unwind: &'static str,
    hook_queue_generation_guard: &'static str,
    hook_staging_failure_preservation: &'static str,
    bailout_blocker: &'static str,
    rerender_limit: usize,
    public_hook_compatibility_claimed: bool,
    public_root_compatibility_claimed: bool,
    root_scheduler_integration_claimed: bool,
    scheduler_compatibility_claimed: bool,
    act_compatibility_claimed: bool,
    renderer_compatibility_claimed: bool,
}

#[cfg(test)]
impl FunctionComponentRenderPhaseSourceEvidenceForCanary {
    #[must_use]
    pub const fn react_19_2_6() -> Self {
        Self {
            react_version: "19.2.6",
            render_with_hooks_again: "ReactFiberHooks.renderWithHooksAgain",
            currently_rendering_fiber: "currentlyRenderingFiber",
            is_render_phase_update: "isRenderPhaseUpdate",
            enqueue_render_phase_update: "enqueueRenderPhaseUpdate",
            reset_hooks_on_unwind: "resetHooksOnUnwind",
            hook_queue_generation_guard: "HookQueueId generation",
            hook_staging_failure_preservation: "HookUpdateStaging.finish_queueing",
            bailout_blocker: "begin_work_function_component_bailout_blocker",
            rerender_limit: FUNCTION_COMPONENT_RENDER_PHASE_RE_RENDER_LIMIT,
            public_hook_compatibility_claimed: false,
            public_root_compatibility_claimed: false,
            root_scheduler_integration_claimed: false,
            scheduler_compatibility_claimed: false,
            act_compatibility_claimed: false,
            renderer_compatibility_claimed: false,
        }
    }

    #[must_use]
    pub const fn react_version(self) -> &'static str {
        self.react_version
    }

    #[must_use]
    pub const fn render_with_hooks_again(self) -> &'static str {
        self.render_with_hooks_again
    }

    #[must_use]
    pub const fn currently_rendering_fiber(self) -> &'static str {
        self.currently_rendering_fiber
    }

    #[must_use]
    pub const fn is_render_phase_update(self) -> &'static str {
        self.is_render_phase_update
    }

    #[must_use]
    pub const fn enqueue_render_phase_update(self) -> &'static str {
        self.enqueue_render_phase_update
    }

    #[must_use]
    pub const fn reset_hooks_on_unwind(self) -> &'static str {
        self.reset_hooks_on_unwind
    }

    #[must_use]
    pub const fn hook_queue_generation_guard(self) -> &'static str {
        self.hook_queue_generation_guard
    }

    #[must_use]
    pub const fn hook_staging_failure_preservation(self) -> &'static str {
        self.hook_staging_failure_preservation
    }

    #[must_use]
    pub const fn bailout_blocker(self) -> &'static str {
        self.bailout_blocker
    }

    #[must_use]
    pub const fn rerender_limit(self) -> usize {
        self.rerender_limit
    }

    #[must_use]
    pub const fn public_hook_compatibility_claimed(self) -> bool {
        self.public_hook_compatibility_claimed
    }

    #[must_use]
    pub const fn public_root_compatibility_claimed(self) -> bool {
        self.public_root_compatibility_claimed
    }

    #[must_use]
    pub const fn root_scheduler_integration_claimed(self) -> bool {
        self.root_scheduler_integration_claimed
    }

    #[must_use]
    pub const fn scheduler_compatibility_claimed(self) -> bool {
        self.scheduler_compatibility_claimed
    }

    #[must_use]
    pub const fn act_compatibility_claimed(self) -> bool {
        self.act_compatibility_claimed
    }

    #[must_use]
    pub const fn renderer_compatibility_claimed(self) -> bool {
        self.renderer_compatibility_claimed
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentRenderPhaseDispatchKind {
    BasicState,
    Reducer(FunctionComponentReducerHandle),
}

#[cfg(test)]
impl FunctionComponentRenderPhaseDispatchKind {
    #[must_use]
    pub const fn is_basic_state(self) -> bool {
        matches!(self, Self::BasicState)
    }

    #[must_use]
    pub const fn reducer(self) -> Option<FunctionComponentReducerHandle> {
        match self {
            Self::BasicState => None,
            Self::Reducer(reducer) => Some(reducer),
        }
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentRenderPhaseBailoutBlockerState {
    render_fiber: FiberId,
    current: Option<FiberId>,
    render_lanes: Lanes,
    context_dependency_count: usize,
    context_dependency_lanes: Lanes,
    child_traversal_blocked: bool,
}

#[cfg(test)]
impl FunctionComponentRenderPhaseBailoutBlockerState {
    #[must_use]
    pub const fn active_render(
        state: FunctionComponentHookRenderState,
        render_lanes: Lanes,
    ) -> Self {
        Self {
            render_fiber: state.render_fiber(),
            current: state.current(),
            render_lanes,
            context_dependency_count: 0,
            context_dependency_lanes: Lanes::NO,
            child_traversal_blocked: false,
        }
    }

    #[must_use]
    pub const fn with_context_dependency_lanes(
        self,
        context_dependency_count: usize,
        context_dependency_lanes: Lanes,
    ) -> Self {
        Self {
            context_dependency_count,
            context_dependency_lanes,
            ..self
        }
    }

    #[must_use]
    pub const fn with_child_traversal_blocked(self, child_traversal_blocked: bool) -> Self {
        Self {
            child_traversal_blocked,
            ..self
        }
    }

    #[must_use]
    pub const fn with_render_fiber(self, render_fiber: FiberId) -> Self {
        Self {
            render_fiber,
            ..self
        }
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
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn context_dependency_count(self) -> usize {
        self.context_dependency_count
    }

    #[must_use]
    pub const fn context_dependency_lanes(self) -> Lanes {
        self.context_dependency_lanes
    }

    #[must_use]
    pub const fn child_traversal_blocked(self) -> bool {
        self.child_traversal_blocked
    }

    #[must_use]
    pub fn is_current_for_render(
        self,
        state: FunctionComponentHookRenderState,
        render_lanes: Lanes,
    ) -> bool {
        self.render_fiber == state.render_fiber()
            && self.current == state.current()
            && self.render_lanes == render_lanes
            && !self.child_traversal_blocked
            && !self.context_dependency_lanes.contains_any(render_lanes)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentRenderPhaseStagingOwner {
    source_owned: bool,
    caller_built: bool,
    attempt: FunctionComponentRenderAttemptId,
    staging_generation: u64,
    render_fiber: FiberId,
    current: Option<FiberId>,
    work_in_progress_list: HookListId,
    queue_owner: FiberId,
    queue: HookQueueId,
    queue_generation: u32,
    update_generation: u32,
    render_lanes: Lanes,
    update_lane: HookUpdateLane,
    blocker: FunctionComponentRenderPhaseBailoutBlockerState,
}

#[cfg(test)]
impl FunctionComponentRenderPhaseStagingOwner {
    #[must_use]
    fn source_owned(
        gate: &FunctionComponentRenderPhaseUpdateGate,
        binding: FunctionComponentStateDispatchBinding,
        update: HookUpdateId,
        update_lane: HookUpdateLane,
    ) -> Self {
        Self {
            source_owned: true,
            caller_built: false,
            attempt: gate.attempt(),
            staging_generation: gate.staging_generation(),
            render_fiber: gate.state().render_fiber(),
            current: gate.state().current(),
            work_in_progress_list: gate.state().work_in_progress_list(),
            queue_owner: binding.fiber,
            queue: binding.queue,
            queue_generation: hook_queue_generation_for_canary(binding.queue),
            update_generation: hook_update_generation_for_canary(update),
            render_lanes: gate.render_lanes(),
            update_lane,
            blocker: gate.blocker_state(),
        }
    }

    #[must_use]
    pub const fn attempt(self) -> FunctionComponentRenderAttemptId {
        self.attempt
    }

    #[must_use]
    pub const fn staging_generation(self) -> u64 {
        self.staging_generation
    }

    #[must_use]
    pub const fn queue_generation(self) -> u32 {
        self.queue_generation
    }

    #[must_use]
    pub const fn update_generation(self) -> u32 {
        self.update_generation
    }

    #[must_use]
    pub const fn source_owned_currentness(self) -> bool {
        self.source_owned && !self.caller_built
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentRenderPhaseDispatchRecord {
    source: FunctionComponentRenderPhaseSourceEvidenceForCanary,
    attempt: FunctionComponentRenderAttemptId,
    staging_generation: u64,
    pass_index: usize,
    rerender_count: usize,
    render_fiber: FiberId,
    current: Option<FiberId>,
    current_list: Option<HookListId>,
    work_in_progress_list: HookListId,
    queue_owner: FiberId,
    queue: HookQueueId,
    queue_generation: u32,
    dispatch: FunctionComponentStateDispatchHandle,
    update: HookUpdateId,
    update_generation: u32,
    lane: HookUpdateLane,
    revert_lane: HookRevertLane,
    action: FunctionComponentStateActionHandle,
    eager_state: Option<FunctionComponentStateDispatchEagerState>,
    kind: FunctionComponentRenderPhaseDispatchKind,
    did_schedule_render_phase_update: bool,
    did_schedule_render_phase_update_during_this_pass: bool,
    root_scheduled: bool,
    public_hook_compatibility_claimed: bool,
    source_owned_currentness: bool,
    caller_built_rows_accepted: bool,
    blocker: FunctionComponentRenderPhaseBailoutBlockerState,
}

#[cfg(test)]
impl FunctionComponentRenderPhaseDispatchRecord {
    #[must_use]
    pub const fn source(self) -> FunctionComponentRenderPhaseSourceEvidenceForCanary {
        self.source
    }

    #[must_use]
    pub const fn attempt(self) -> FunctionComponentRenderAttemptId {
        self.attempt
    }

    #[must_use]
    pub const fn staging_generation(self) -> u64 {
        self.staging_generation
    }

    #[must_use]
    pub const fn pass_index(self) -> usize {
        self.pass_index
    }

    #[must_use]
    pub const fn rerender_count(self) -> usize {
        self.rerender_count
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

    #[must_use]
    pub const fn queue_owner(self) -> FiberId {
        self.queue_owner
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        self.queue
    }

    #[must_use]
    pub const fn queue_generation(self) -> u32 {
        self.queue_generation
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
    pub const fn update_generation(self) -> u32 {
        self.update_generation
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
    pub const fn kind(self) -> FunctionComponentRenderPhaseDispatchKind {
        self.kind
    }

    #[must_use]
    pub const fn did_schedule_render_phase_update(self) -> bool {
        self.did_schedule_render_phase_update
    }

    #[must_use]
    pub const fn did_schedule_render_phase_update_during_this_pass(self) -> bool {
        self.did_schedule_render_phase_update_during_this_pass
    }

    #[must_use]
    pub const fn root_scheduled(self) -> bool {
        self.root_scheduled
    }

    #[must_use]
    pub const fn public_hook_compatibility_claimed(self) -> bool {
        self.public_hook_compatibility_claimed
    }

    #[must_use]
    pub const fn source_owned_currentness(self) -> bool {
        self.source_owned_currentness
    }

    #[must_use]
    pub const fn caller_built_rows_accepted(self) -> bool {
        self.caller_built_rows_accepted
    }

    #[must_use]
    pub const fn blocker_state(self) -> FunctionComponentRenderPhaseBailoutBlockerState {
        self.blocker
    }

    #[must_use]
    pub fn dispatch_belongs_to_currently_rendering_fiber(self) -> bool {
        self.queue_owner == self.render_fiber || self.current == Some(self.queue_owner)
    }

    #[must_use]
    pub const fn pending_update_did_not_escape_to_root_scheduler(self) -> bool {
        !self.root_scheduled
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentRenderPhaseProcessRecord {
    source: FunctionComponentRenderPhaseSourceEvidenceForCanary,
    attempt: FunctionComponentRenderAttemptId,
    staging_generation: u64,
    pass_index: usize,
    rerender_count: usize,
    render_fiber: FiberId,
    render_lanes: Lanes,
    hook: HookSlotId,
    queue: HookQueueId,
    queue_generation: u32,
    dispatch: FunctionComponentStateDispatchHandle,
    kind: FunctionComponentRenderPhaseDispatchKind,
    previous_memoized_state: StateHandle,
    memoized_state: StateHandle,
    base_state: StateHandle,
    base_queue: Option<HookUpdateId>,
    processed_update_count: usize,
}

#[cfg(test)]
impl FunctionComponentRenderPhaseProcessRecord {
    #[must_use]
    pub const fn source(self) -> FunctionComponentRenderPhaseSourceEvidenceForCanary {
        self.source
    }

    #[must_use]
    pub const fn attempt(self) -> FunctionComponentRenderAttemptId {
        self.attempt
    }

    #[must_use]
    pub const fn staging_generation(self) -> u64 {
        self.staging_generation
    }

    #[must_use]
    pub const fn pass_index(self) -> usize {
        self.pass_index
    }

    #[must_use]
    pub const fn rerender_count(self) -> usize {
        self.rerender_count
    }

    #[must_use]
    pub const fn render_fiber(self) -> FiberId {
        self.render_fiber
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
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
    pub const fn queue_generation(self) -> u32 {
        self.queue_generation
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }

    #[must_use]
    pub const fn kind(self) -> FunctionComponentRenderPhaseDispatchKind {
        self.kind
    }

    #[must_use]
    pub const fn previous_memoized_state(self) -> StateHandle {
        self.previous_memoized_state
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
    pub const fn processed_update_count(self) -> usize {
        self.processed_update_count
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentRenderPhaseRerenderPassRecord {
    source: FunctionComponentRenderPhaseSourceEvidenceForCanary,
    attempt: FunctionComponentRenderAttemptId,
    render_fiber: FiberId,
    pass_index: usize,
    rerender_count: usize,
    limit: usize,
}

#[cfg(test)]
impl FunctionComponentRenderPhaseRerenderPassRecord {
    #[must_use]
    pub const fn source(self) -> FunctionComponentRenderPhaseSourceEvidenceForCanary {
        self.source
    }

    #[must_use]
    pub const fn attempt(self) -> FunctionComponentRenderAttemptId {
        self.attempt
    }

    #[must_use]
    pub const fn render_fiber(self) -> FiberId {
        self.render_fiber
    }

    #[must_use]
    pub const fn pass_index(self) -> usize {
        self.pass_index
    }

    #[must_use]
    pub const fn rerender_count(self) -> usize {
        self.rerender_count
    }

    #[must_use]
    pub const fn limit(self) -> usize {
        self.limit
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentRenderPhaseStagingDrainRecord {
    source: FunctionComponentRenderPhaseSourceEvidenceForCanary,
    attempt: FunctionComponentRenderAttemptId,
    staging_generation: u64,
    next_staging_generation: u64,
    render_fiber: FiberId,
    current: Option<FiberId>,
    render_lanes: Lanes,
    staging_lanes: Lanes,
    blocker: FunctionComponentRenderPhaseBailoutBlockerState,
    queues: Vec<HookQueueId>,
    updates: Vec<HookUpdateId>,
    queue_generations: Vec<u32>,
    update_generations: Vec<u32>,
    source_owned_currentness: bool,
    caller_built_rows_accepted: bool,
    root_scheduled: bool,
}

#[cfg(test)]
impl FunctionComponentRenderPhaseStagingDrainRecord {
    #[must_use]
    pub const fn source(&self) -> FunctionComponentRenderPhaseSourceEvidenceForCanary {
        self.source
    }

    #[must_use]
    pub const fn attempt(&self) -> FunctionComponentRenderAttemptId {
        self.attempt
    }

    #[must_use]
    pub const fn staging_generation(&self) -> u64 {
        self.staging_generation
    }

    #[must_use]
    pub const fn next_staging_generation(&self) -> u64 {
        self.next_staging_generation
    }

    #[must_use]
    pub const fn render_fiber(&self) -> FiberId {
        self.render_fiber
    }

    #[must_use]
    pub const fn current(&self) -> Option<FiberId> {
        self.current
    }

    #[must_use]
    pub const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn staging_lanes(&self) -> Lanes {
        self.staging_lanes
    }

    #[must_use]
    pub const fn blocker_state(&self) -> FunctionComponentRenderPhaseBailoutBlockerState {
        self.blocker
    }

    #[must_use]
    pub fn queues(&self) -> &[HookQueueId] {
        &self.queues
    }

    #[must_use]
    pub fn updates(&self) -> &[HookUpdateId] {
        &self.updates
    }

    #[must_use]
    pub fn queue_generations(&self) -> &[u32] {
        &self.queue_generations
    }

    #[must_use]
    pub fn update_generations(&self) -> &[u32] {
        &self.update_generations
    }

    #[must_use]
    pub fn drained_update_count(&self) -> usize {
        self.updates.len()
    }

    #[must_use]
    pub const fn source_owned_currentness(&self) -> bool {
        self.source_owned_currentness
    }

    #[must_use]
    pub const fn caller_built_rows_accepted(&self) -> bool {
        self.caller_built_rows_accepted
    }

    #[must_use]
    pub const fn root_scheduled(&self) -> bool {
        self.root_scheduled
    }

    #[must_use]
    pub fn proves_current_render_phase_staging(&self) -> bool {
        self.source_owned_currentness
            && !self.caller_built_rows_accepted
            && !self.root_scheduled
            && self.blocker.render_fiber() == self.render_fiber
            && self.blocker.current() == self.current
            && self.blocker.render_lanes() == self.render_lanes
            && !self.blocker.child_traversal_blocked()
            && !self
                .blocker
                .context_dependency_lanes()
                .contains_any(self.render_lanes)
            && self.staging_lanes.is_subset_of(self.render_lanes)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentRenderPhaseCleanupRecord {
    source: FunctionComponentRenderPhaseSourceEvidenceForCanary,
    render_fiber: FiberId,
    queues: Vec<HookQueueId>,
    staged_update_count_before_cleanup: usize,
    did_schedule_render_phase_update_after_cleanup: bool,
    did_schedule_render_phase_update_during_this_pass_after_cleanup: bool,
}

#[cfg(test)]
impl FunctionComponentRenderPhaseCleanupRecord {
    #[must_use]
    pub const fn source(&self) -> FunctionComponentRenderPhaseSourceEvidenceForCanary {
        self.source
    }

    #[must_use]
    pub const fn render_fiber(&self) -> FiberId {
        self.render_fiber
    }

    #[must_use]
    pub fn queues(&self) -> &[HookQueueId] {
        &self.queues
    }

    #[must_use]
    pub fn cleared_queue_count(&self) -> usize {
        self.queues.len()
    }

    #[must_use]
    pub const fn staged_update_count_before_cleanup(&self) -> usize {
        self.staged_update_count_before_cleanup
    }

    #[must_use]
    pub const fn did_schedule_render_phase_update_after_cleanup(&self) -> bool {
        self.did_schedule_render_phase_update_after_cleanup
    }

    #[must_use]
    pub const fn did_schedule_render_phase_update_during_this_pass_after_cleanup(&self) -> bool {
        self.did_schedule_render_phase_update_during_this_pass_after_cleanup
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentRenderPhaseUpdateGate {
    state: FunctionComponentHookRenderState,
    render_lanes: Lanes,
    attempt: FunctionComponentRenderAttemptId,
    staging_generation: u64,
    staging: HookUpdateStaging<FunctionComponentRenderPhaseStagingOwner>,
    blocker: FunctionComponentRenderPhaseBailoutBlockerState,
    recorded: RenderPhaseHookUpdates,
    rerender_count: usize,
    did_schedule_render_phase_update: bool,
    did_schedule_render_phase_update_during_this_pass: bool,
    limit: usize,
}

#[cfg(test)]
impl FunctionComponentRenderPhaseUpdateGate {
    #[must_use]
    pub fn new(state: FunctionComponentHookRenderState, render_lanes: Lanes) -> Self {
        let attempt = next_render_attempt_id_for_canary(state, render_lanes);
        Self {
            state,
            render_lanes,
            attempt,
            staging_generation: 0,
            staging: HookUpdateStaging::new(),
            blocker: FunctionComponentRenderPhaseBailoutBlockerState::active_render(
                state,
                render_lanes,
            ),
            recorded: RenderPhaseHookUpdates::new(),
            rerender_count: 0,
            did_schedule_render_phase_update: false,
            did_schedule_render_phase_update_during_this_pass: false,
            limit: FUNCTION_COMPONENT_RENDER_PHASE_RE_RENDER_LIMIT,
        }
    }

    #[must_use]
    pub const fn state(&self) -> FunctionComponentHookRenderState {
        self.state
    }

    #[must_use]
    pub const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn attempt(&self) -> FunctionComponentRenderAttemptId {
        self.attempt
    }

    #[must_use]
    pub const fn staging_generation(&self) -> u64 {
        self.staging_generation
    }

    #[must_use]
    pub const fn blocker_state(&self) -> FunctionComponentRenderPhaseBailoutBlockerState {
        self.blocker
    }

    pub fn set_blocker_state_for_canary(
        &mut self,
        blocker: FunctionComponentRenderPhaseBailoutBlockerState,
    ) {
        self.blocker = blocker;
    }

    pub fn advance_render_attempt_for_canary(&mut self) {
        self.attempt = next_render_attempt_id_for_canary(self.state, self.render_lanes);
    }

    #[must_use]
    pub const fn rerender_count(&self) -> usize {
        self.rerender_count
    }

    #[must_use]
    pub const fn limit(&self) -> usize {
        self.limit
    }

    #[must_use]
    pub const fn did_schedule_render_phase_update(&self) -> bool {
        self.did_schedule_render_phase_update
    }

    #[must_use]
    pub const fn did_schedule_render_phase_update_during_this_pass(&self) -> bool {
        self.did_schedule_render_phase_update_during_this_pass
    }

    #[must_use]
    pub fn recorded_queues(&self) -> &[HookQueueId] {
        self.recorded.queues()
    }

    #[must_use]
    pub fn staged_update_count(&self) -> usize {
        self.staging.entries().len()
    }

    #[must_use]
    pub const fn staging_lanes(&self) -> Lanes {
        self.staging.lanes()
    }

    pub fn begin_rerender_pass(
        &mut self,
    ) -> Result<FunctionComponentRenderPhaseRerenderPassRecord, FunctionComponentRenderError> {
        if self.rerender_count >= self.limit {
            return Err(FunctionComponentRenderError::TooManyRenderPhaseRerenders {
                fiber: self.state.render_fiber(),
                limit: self.limit,
            });
        }

        let pass_index = self.rerender_count;
        self.rerender_count += 1;
        self.did_schedule_render_phase_update_during_this_pass = false;
        Ok(FunctionComponentRenderPhaseRerenderPassRecord {
            source: FunctionComponentRenderPhaseSourceEvidenceForCanary::react_19_2_6(),
            attempt: self.attempt,
            render_fiber: self.state.render_fiber(),
            pass_index,
            rerender_count: self.rerender_count,
            limit: self.limit,
        })
    }

    pub fn cleanup_pending_render_phase_updates(
        &mut self,
        hook_store: &mut FunctionComponentHookRenderStore,
    ) -> Result<FunctionComponentRenderPhaseCleanupRecord, FunctionComponentRenderError> {
        let queues = self.recorded.queues().to_vec();
        let staged_update_count_before_cleanup = self.staged_update_count();
        hook_store
            .state_queues
            .clear_render_phase_updates(&mut self.recorded)
            .map_err(|error| {
                FunctionComponentRenderError::hook_queue(self.state.render_fiber(), error)
            })?;
        self.staging = HookUpdateStaging::new();
        if staged_update_count_before_cleanup > 0 {
            self.staging_generation += 1;
        }
        self.did_schedule_render_phase_update = false;
        self.did_schedule_render_phase_update_during_this_pass = false;

        Ok(FunctionComponentRenderPhaseCleanupRecord {
            source: FunctionComponentRenderPhaseSourceEvidenceForCanary::react_19_2_6(),
            render_fiber: self.state.render_fiber(),
            queues,
            staged_update_count_before_cleanup,
            did_schedule_render_phase_update_after_cleanup: self.did_schedule_render_phase_update,
            did_schedule_render_phase_update_during_this_pass_after_cleanup: self
                .did_schedule_render_phase_update_during_this_pass,
        })
    }

    fn record_render_phase_update_scheduled(&mut self) {
        self.did_schedule_render_phase_update = true;
        self.did_schedule_render_phase_update_during_this_pass = true;
    }

    fn validate_update_currentness(
        &self,
        lane: HookUpdateLane,
    ) -> Result<(), FunctionComponentRenderError> {
        self.validate_blocker_currentness()?;
        let lane_priority = lane.priority_lanes();
        if lane_priority.is_non_empty() && !self.render_lanes.contains_all(lane_priority) {
            return Err(FunctionComponentRenderError::RenderPhaseLaneMismatch {
                fiber: self.state.render_fiber(),
                render_lanes: self.render_lanes,
                update_lane: lane,
            });
        }
        Ok(())
    }

    fn validate_blocker_currentness(&self) -> Result<(), FunctionComponentRenderError> {
        if self
            .blocker
            .is_current_for_render(self.state, self.render_lanes)
        {
            return Ok(());
        }

        Err(
            FunctionComponentRenderError::RenderPhaseBailoutContextAlias {
                fiber: self.state.render_fiber(),
                blocker_fiber: self.blocker.render_fiber(),
                current: self.state.current(),
                blocker_current: self.blocker.current(),
                render_lanes: self.render_lanes,
                blocker_lanes: self.blocker.render_lanes(),
                context_dependency_count: self.blocker.context_dependency_count(),
                context_dependency_lanes: self.blocker.context_dependency_lanes(),
                child_traversal_blocked: self.blocker.child_traversal_blocked(),
            },
        )
    }

    fn stage_render_phase_update(
        &mut self,
        binding: FunctionComponentStateDispatchBinding,
        update: HookUpdateId,
        lane: HookUpdateLane,
    ) {
        let owner =
            FunctionComponentRenderPhaseStagingOwner::source_owned(self, binding, update, lane);
        self.staging.stage(owner, binding.queue, update, lane);
    }

    fn validate_staged_row_currentness(
        &self,
        owner: FunctionComponentRenderPhaseStagingOwner,
        row_queue: HookQueueId,
        row_update: HookUpdateId,
        row_lane: HookUpdateLane,
    ) -> Result<(), FunctionComponentRenderError> {
        if !owner.source_owned_currentness() {
            return Err(
                FunctionComponentRenderError::RenderPhaseCallerBuiltRowsRejected {
                    fiber: self.state.render_fiber(),
                    queue: row_queue,
                    update: row_update,
                },
            );
        }

        if owner.attempt != self.attempt {
            return Err(FunctionComponentRenderError::StaleRenderPhaseAttempt {
                fiber: self.state.render_fiber(),
                expected: self.attempt,
                actual: owner.attempt,
            });
        }

        if owner.staging_generation != self.staging_generation {
            return Err(
                FunctionComponentRenderError::StaleRenderPhaseStagingGeneration {
                    fiber: self.state.render_fiber(),
                    expected: self.staging_generation,
                    actual: owner.staging_generation,
                },
            );
        }

        if owner.render_fiber != self.state.render_fiber()
            || owner.current != self.state.current()
            || owner.work_in_progress_list != self.state.work_in_progress_list()
            || owner.queue != row_queue
            || owner.queue_generation != hook_queue_generation_for_canary(row_queue)
            || owner.update_generation != hook_update_generation_for_canary(row_update)
            || owner.update_lane != row_lane
            || !(owner.queue_owner == self.state.render_fiber()
                || self.state.current() == Some(owner.queue_owner))
        {
            return Err(
                FunctionComponentRenderError::RenderPhaseWrongFiberOrHookQueue {
                    fiber: self.state.render_fiber(),
                    owner_fiber: owner.render_fiber,
                    queue_owner: owner.queue_owner,
                    expected_queue: owner.queue,
                    actual_queue: row_queue,
                },
            );
        }

        if owner.render_lanes != self.render_lanes {
            return Err(FunctionComponentRenderError::RenderPhaseLaneMismatch {
                fiber: self.state.render_fiber(),
                render_lanes: self.render_lanes,
                update_lane: row_lane,
            });
        }

        self.validate_update_currentness(row_lane)?;
        Ok(())
    }

    fn validate_recorded_queue_for_processing(
        &self,
        queue: HookQueueId,
    ) -> Result<(), FunctionComponentRenderError> {
        if self.recorded.queues().contains(&queue) {
            Ok(())
        } else {
            Err(
                FunctionComponentRenderError::RenderPhaseWrongFiberOrHookQueue {
                    fiber: self.state.render_fiber(),
                    owner_fiber: self.state.render_fiber(),
                    queue_owner: self.state.render_fiber(),
                    expected_queue: queue,
                    actual_queue: queue,
                },
            )
        }
    }

    pub fn finish_staged_render_phase_updates_for_canary(
        &mut self,
        hook_store: &mut FunctionComponentHookRenderStore,
    ) -> Result<FunctionComponentRenderPhaseStagingDrainRecord, FunctionComponentRenderError> {
        self.validate_blocker_currentness()?;
        for entry in self.staging.entries() {
            self.validate_staged_row_currentness(
                *entry.owner(),
                entry.queue(),
                entry.update(),
                entry.lane(),
            )?;
        }

        let attempt = self.attempt;
        let staging_generation = self.staging_generation;
        let render_fiber = self.state.render_fiber();
        let current = self.state.current();
        let render_lanes = self.render_lanes;
        let staging_lanes = self.staging.lanes();
        let blocker = self.blocker;
        let finished = self
            .staging
            .finish_queueing(&mut hook_store.state_queues)
            .map_err(|error| FunctionComponentRenderError::hook_queue(render_fiber, error))?;

        let queues = finished
            .iter()
            .map(|entry| entry.queue())
            .collect::<Vec<_>>();
        let updates = finished
            .iter()
            .map(|entry| entry.update())
            .collect::<Vec<_>>();
        let queue_generations = finished
            .iter()
            .map(|entry| hook_queue_generation_for_canary(entry.queue()))
            .collect::<Vec<_>>();
        let update_generations = finished
            .iter()
            .map(|entry| hook_update_generation_for_canary(entry.update()))
            .collect::<Vec<_>>();
        for queue in &queues {
            self.recorded.record(*queue);
        }
        self.staging_generation += 1;

        Ok(FunctionComponentRenderPhaseStagingDrainRecord {
            source: FunctionComponentRenderPhaseSourceEvidenceForCanary::react_19_2_6(),
            attempt,
            staging_generation,
            next_staging_generation: self.staging_generation,
            render_fiber,
            current,
            render_lanes,
            staging_lanes,
            blocker,
            queues,
            updates,
            queue_generations,
            update_generations,
            source_owned_currentness: true,
            caller_built_rows_accepted: false,
            root_scheduled: false,
        })
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

    #[cfg(test)]
    pub fn enqueue_state_render_phase_update_for_canary(
        &mut self,
        gate: &mut FunctionComponentRenderPhaseUpdateGate,
        request: FunctionComponentStateDispatchRequest,
    ) -> Result<FunctionComponentRenderPhaseDispatchRecord, FunctionComponentRenderError> {
        let binding = self.state_dispatch_binding(request.dispatch())?;
        self.validate_basic_state_dispatch_binding(binding)?;
        self.validate_dispatch_eager_state(binding, request.eager_state())?;
        self.validate_state_dispatch_render_context(gate.state(), binding)?;
        gate.validate_update_currentness(request.lane())?;

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
        gate.stage_render_phase_update(binding, update, request.lane());
        gate.record_render_phase_update_scheduled();

        Ok(FunctionComponentRenderPhaseDispatchRecord {
            source: FunctionComponentRenderPhaseSourceEvidenceForCanary::react_19_2_6(),
            attempt: gate.attempt(),
            staging_generation: gate.staging_generation(),
            pass_index: gate.rerender_count(),
            rerender_count: gate.rerender_count(),
            render_fiber: gate.state().render_fiber(),
            current: gate.state().current(),
            current_list: gate.state().current_list(),
            work_in_progress_list: gate.state().work_in_progress_list(),
            queue_owner: binding.fiber,
            queue: binding.queue,
            queue_generation: hook_queue_generation_for_canary(binding.queue),
            dispatch: binding.handle,
            update,
            update_generation: hook_update_generation_for_canary(update),
            lane: request.lane(),
            revert_lane: request.revert_lane(),
            action: request.action(),
            eager_state: request.eager_state(),
            kind: FunctionComponentRenderPhaseDispatchKind::BasicState,
            did_schedule_render_phase_update: gate.did_schedule_render_phase_update(),
            did_schedule_render_phase_update_during_this_pass: gate
                .did_schedule_render_phase_update_during_this_pass(),
            root_scheduled: false,
            public_hook_compatibility_claimed: false,
            source_owned_currentness: true,
            caller_built_rows_accepted: false,
            blocker: gate.blocker_state(),
        })
    }

    #[cfg(test)]
    pub fn enqueue_reducer_render_phase_update_for_canary(
        &mut self,
        gate: &mut FunctionComponentRenderPhaseUpdateGate,
        request: FunctionComponentReducerDispatchRequest,
    ) -> Result<FunctionComponentRenderPhaseDispatchRecord, FunctionComponentRenderError> {
        let binding = self.state_dispatch_binding(request.dispatch())?;
        self.validate_live_dispatch_binding(binding)?;
        let reducer = self.reducer_for_queue(binding.fiber, binding.queue)?;
        self.validate_dispatch_eager_state(binding, request.eager_state())?;
        self.validate_reducer_dispatch_render_context(gate.state(), binding)?;
        gate.validate_update_currentness(request.lane())?;

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
        gate.stage_render_phase_update(binding, update, request.lane());
        gate.record_render_phase_update_scheduled();

        Ok(FunctionComponentRenderPhaseDispatchRecord {
            source: FunctionComponentRenderPhaseSourceEvidenceForCanary::react_19_2_6(),
            attempt: gate.attempt(),
            staging_generation: gate.staging_generation(),
            pass_index: gate.rerender_count(),
            rerender_count: gate.rerender_count(),
            render_fiber: gate.state().render_fiber(),
            current: gate.state().current(),
            current_list: gate.state().current_list(),
            work_in_progress_list: gate.state().work_in_progress_list(),
            queue_owner: binding.fiber,
            queue: binding.queue,
            queue_generation: hook_queue_generation_for_canary(binding.queue),
            dispatch: binding.handle,
            update,
            update_generation: hook_update_generation_for_canary(update),
            lane: request.lane(),
            revert_lane: request.revert_lane(),
            action: request.action(),
            eager_state: request.eager_state(),
            kind: FunctionComponentRenderPhaseDispatchKind::Reducer(reducer),
            did_schedule_render_phase_update: gate.did_schedule_render_phase_update(),
            did_schedule_render_phase_update_during_this_pass: gate
                .did_schedule_render_phase_update_during_this_pass(),
            root_scheduled: false,
            public_hook_compatibility_claimed: false,
            source_owned_currentness: true,
            caller_built_rows_accepted: false,
            blocker: gate.blocker_state(),
        })
    }

    #[cfg(test)]
    pub fn process_state_render_phase_updates_for_canary(
        &mut self,
        gate: &mut FunctionComponentRenderPhaseUpdateGate,
        hook: HookSlotId,
        reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
    ) -> Result<FunctionComponentRenderPhaseProcessRecord, FunctionComponentRenderError> {
        let state = gate.state();
        let previous_payload = self.state_payload_for_hook(state.render_fiber(), hook)?;
        gate.validate_recorded_queue_for_processing(previous_payload.queue())?;
        let dispatch =
            self.state_dispatch_for_queue(state.render_fiber(), previous_payload.queue())?;
        let binding = self.state_dispatch_binding(dispatch)?;
        self.validate_basic_state_dispatch_binding(binding)?;
        self.validate_state_dispatch_render_context(state, binding)?;
        let mut slot = state_slot_from_payload(previous_payload);
        let result = self
            .state_queues
            .process_render_phase_updates(&mut slot, reducer)
            .map_err(|error| {
                FunctionComponentRenderError::hook_queue(state.render_fiber(), error)
            })?;
        let next_payload = state_payload_from_slot(&slot);
        self.hook_lists
            .set_hook_payload(hook, HookSlotPayload::state(next_payload))
            .map_err(|error| {
                FunctionComponentRenderError::hook_list(state.render_fiber(), error)
            })?;

        Ok(FunctionComponentRenderPhaseProcessRecord {
            source: FunctionComponentRenderPhaseSourceEvidenceForCanary::react_19_2_6(),
            attempt: gate.attempt(),
            staging_generation: gate.staging_generation(),
            pass_index: gate.rerender_count(),
            rerender_count: gate.rerender_count(),
            render_fiber: state.render_fiber(),
            render_lanes: gate.render_lanes(),
            hook,
            queue: previous_payload.queue(),
            queue_generation: hook_queue_generation_for_canary(previous_payload.queue()),
            dispatch,
            kind: FunctionComponentRenderPhaseDispatchKind::BasicState,
            previous_memoized_state: previous_payload.memoized_state(),
            memoized_state: *result.memoized_state(),
            base_state: *slot.base_state(),
            base_queue: slot.base_queue(),
            processed_update_count: result.processed_update_count(),
        })
    }

    #[cfg(test)]
    pub fn process_reducer_render_phase_updates_for_canary(
        &mut self,
        gate: &mut FunctionComponentRenderPhaseUpdateGate,
        hook: HookSlotId,
        reducer_id: FunctionComponentReducerHandle,
        reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
    ) -> Result<FunctionComponentRenderPhaseProcessRecord, FunctionComponentRenderError> {
        let state = gate.state();
        let previous_payload = self.state_payload_for_hook(state.render_fiber(), hook)?;
        gate.validate_recorded_queue_for_processing(previous_payload.queue())?;
        let dispatch =
            self.state_dispatch_for_queue(state.render_fiber(), previous_payload.queue())?;
        let binding = self.state_dispatch_binding(dispatch)?;
        self.validate_live_dispatch_binding(binding)?;
        self.reducer_for_queue(binding.fiber, binding.queue)?;
        self.validate_reducer_dispatch_render_context(state, binding)?;
        self.state_queues
            .queue_mut(previous_payload.queue())
            .map_err(|error| FunctionComponentRenderError::hook_queue(state.render_fiber(), error))?
            .set_last_rendered_reducer(FunctionComponentStateReducerId::Reducer(reducer_id));

        let mut slot = state_slot_from_payload(previous_payload);
        let result = self
            .state_queues
            .process_render_phase_updates(&mut slot, reducer)
            .map_err(|error| {
                FunctionComponentRenderError::hook_queue(state.render_fiber(), error)
            })?;
        let next_payload = state_payload_from_slot(&slot);
        self.hook_lists
            .set_hook_payload(hook, HookSlotPayload::state(next_payload))
            .map_err(|error| {
                FunctionComponentRenderError::hook_list(state.render_fiber(), error)
            })?;

        Ok(FunctionComponentRenderPhaseProcessRecord {
            source: FunctionComponentRenderPhaseSourceEvidenceForCanary::react_19_2_6(),
            attempt: gate.attempt(),
            staging_generation: gate.staging_generation(),
            pass_index: gate.rerender_count(),
            rerender_count: gate.rerender_count(),
            render_fiber: state.render_fiber(),
            render_lanes: gate.render_lanes(),
            hook,
            queue: previous_payload.queue(),
            queue_generation: hook_queue_generation_for_canary(previous_payload.queue()),
            dispatch,
            kind: FunctionComponentRenderPhaseDispatchKind::Reducer(reducer_id),
            previous_memoized_state: previous_payload.memoized_state(),
            memoized_state: *result.memoized_state(),
            base_state: *slot.base_state(),
            base_queue: slot.base_queue(),
            processed_update_count: result.processed_update_count(),
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

    #[cfg(test)]
    fn validate_state_dispatch_render_context(
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
                FunctionComponentRenderError::StateDispatchOutsideRenderContext {
                    dispatch: binding.handle,
                    fiber: binding.fiber,
                    render_fiber: state.render_fiber(),
                    current: state.current(),
                },
            );
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
pub(crate) struct FunctionComponentUseRefRenderRecord {
    render: FunctionComponentRenderRecord,
    hook_result: FunctionComponentHookRenderResult,
    ref_hook: FunctionComponentUseRefHookRenderRecord,
}

impl FunctionComponentUseRefRenderRecord {
    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.render
    }

    #[must_use]
    pub const fn hook_result(self) -> FunctionComponentHookRenderResult {
        self.hook_result
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

pub(crate) fn render_function_component_with_use_ref(
    arena: &mut FiberArena,
    hook_store: &mut FunctionComponentHookRenderStore,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    ref_request: FunctionComponentUseRefRenderRequest,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<FunctionComponentUseRefRenderRecord, FunctionComponentRenderError> {
    let mut request = validate_function_component_render(arena, work_in_progress, render_lanes)?;
    let hook_state = hook_store.prepare_render_state(arena, work_in_progress)?;
    request = request.with_hook_state(hook_state);
    reset_function_component_render_state(arena, work_in_progress)?;

    let mut cursor = hook_store.begin_render_cursor(hook_state)?;
    let ref_hook = match hook_state.phase() {
        FunctionComponentHookRenderPhase::Mount => FunctionComponentUseRefHookRenderRecord::Mount(
            hook_store.mount_ref_hook(&mut cursor, ref_request.initial_value())?,
        ),
        FunctionComponentHookRenderPhase::Update => {
            FunctionComponentUseRefHookRenderRecord::Update(
                hook_store.update_ref_hook(&mut cursor, ref_request.initial_value())?,
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

    Ok(FunctionComponentUseRefRenderRecord {
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
        ref_hook,
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
mod tests;
