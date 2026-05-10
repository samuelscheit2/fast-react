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
    HookSlotId, HookSlotPayload, HookStatePayload, HookStateSlot, HookUpdateId, HookUpdateLane,
    Lanes, ProcessHookQueueResult, PropsHandle, StateHandle, UpdateQueueHandle,
};

use crate::RootElementHandle;

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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentStateReducerId {
    BasicState,
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
pub(crate) struct FunctionComponentStateDispatchRequest {
    dispatch: FunctionComponentStateDispatchHandle,
    action: FunctionComponentStateActionHandle,
    lane: HookUpdateLane,
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
        }
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
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentStateDispatchRecord {
    fiber: FiberId,
    queue: HookQueueId,
    dispatch: FunctionComponentStateDispatchHandle,
    update: HookUpdateId,
    lane: HookUpdateLane,
    action: FunctionComponentStateActionHandle,
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
    pub const fn action(self) -> FunctionComponentStateActionHandle {
        self.action
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

#[derive(Debug, Clone)]
pub(crate) struct FunctionComponentHookRenderStore {
    hook_lists: HookListArena,
    hook_effects: HookEffectArena,
    state_queues: FunctionComponentStateQueueStore,
    current_lists: Vec<FunctionComponentCurrentHookList>,
    effect_rings: Vec<FunctionComponentEffectRingBinding>,
    state_dispatches: Vec<FunctionComponentStateDispatchBinding>,
    next_state_dispatch_raw: u64,
}

impl Default for FunctionComponentHookRenderStore {
    fn default() -> Self {
        Self {
            hook_lists: HookListArena::default(),
            hook_effects: HookEffectArena::default(),
            state_queues: FunctionComponentStateQueueStore::default(),
            current_lists: Vec::new(),
            effect_rings: Vec::new(),
            state_dispatches: Vec::new(),
            next_state_dispatch_raw: 1,
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
            records.push(FunctionComponentPassiveEffectMetadata {
                fiber: state.render_fiber(),
                hook_list: list,
                effect_index,
                effect: effect.id(),
                instance: effect.instance(),
                tag: effect.tag(),
                create: effect.create(),
                dependencies: effect.dependencies(),
                lanes,
            });
        }

        Ok(records)
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
        let instance = self
            .hook_effects
            .get_effect(previous_effect)
            .map_err(|error| {
                FunctionComponentRenderError::hook_effect(state.render_fiber(), error)
            })?
            .instance();
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
        let update = self
            .state_queues
            .create_update(request.lane(), request.action());
        self.state_queues
            .append_pending_update(binding.queue, update)
            .map_err(|error| FunctionComponentRenderError::hook_queue(binding.fiber, error))?;

        Ok(FunctionComponentStateDispatchRecord {
            fiber: binding.fiber,
            queue: binding.queue,
            dispatch: binding.handle,
            update,
            lane: request.lane(),
            action: request.action(),
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
    MissingStateDispatch {
        fiber: FiberId,
        queue: HookQueueId,
    },
    UnknownStateDispatch {
        dispatch: FunctionComponentStateDispatchHandle,
    },
    StateDispatchHandleOverflow,
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
            Self::MissingStateDispatch { fiber, queue } => write!(
                formatter,
                "function component fiber {} state queue {} has no private dispatch handle",
                fiber.slot().get(),
                queue.raw()
            ),
            Self::UnknownStateDispatch { dispatch } => write!(
                formatter,
                "private useState dispatch handle {} is not registered",
                dispatch.raw()
            ),
            Self::StateDispatchHandleOverflow => {
                formatter.write_str("private useState dispatch handle counter overflowed")
            }
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
            | Self::MissingStateHookPayload { .. }
            | Self::MissingStateDispatch { .. }
            | Self::UnknownStateDispatch { .. }
            | Self::StateDispatchHandleOverflow
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

    fn opaque(raw: u64) -> HookSlotPayload {
        HookSlotPayload::opaque(StateHandle::from_raw(raw))
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

    fn action_as_state(
        _state: StateHandle,
        action: &FunctionComponentStateActionHandle,
    ) -> StateHandle {
        StateHandle::from_raw(action.raw())
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
        assert_eq!(dispatch_record.action(), action(900));
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
        assert_eq!(*update.action(), action(900));
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
