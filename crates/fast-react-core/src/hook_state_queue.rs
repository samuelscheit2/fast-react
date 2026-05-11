//! Pure hook state update queue primitives.
//!
//! React hook state queues store pending updates as circular rings, then merge
//! those rings into a circular base queue during render. This module models
//! that data shape without owning hook dispatchers, function component
//! rendering, root scheduling, or JavaScript values.

use std::collections::HashSet;
use std::error::Error;
use std::fmt::{self, Display, Formatter};

use crate::hook_list::{HookListArena, HookListError, HookStateQueueSource};
use crate::{Lane, Lanes};

const ID_SLOT_BITS: u64 = 32;
const ID_SLOT_MASK: u64 = (1u64 << ID_SLOT_BITS) - 1;

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HookQueueId(u64);

impl HookQueueId {
    #[must_use]
    pub const fn new(raw: u64) -> Option<Self> {
        if raw == 0 || raw & ID_SLOT_MASK == 0 {
            None
        } else {
            Some(Self(raw))
        }
    }

    #[must_use]
    const fn from_parts(slot_index: usize, generation: u32) -> Self {
        let slot = slot_index as u64 + 1;
        assert!(slot <= ID_SLOT_MASK);
        Self(((generation as u64) << ID_SLOT_BITS) | slot)
    }

    #[must_use]
    pub const fn raw(self) -> u64 {
        self.0
    }

    #[must_use]
    const fn slot_index(self) -> usize {
        ((self.0 & ID_SLOT_MASK) - 1) as usize
    }

    #[must_use]
    const fn generation(self) -> u32 {
        (self.0 >> ID_SLOT_BITS) as u32
    }
}

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HookUpdateId(u64);

impl HookUpdateId {
    #[must_use]
    pub const fn new(raw: u64) -> Option<Self> {
        if raw == 0 || raw & ID_SLOT_MASK == 0 {
            None
        } else {
            Some(Self(raw))
        }
    }

    #[must_use]
    const fn from_parts(slot_index: usize, generation: u32) -> Self {
        let slot = slot_index as u64 + 1;
        assert!(slot <= ID_SLOT_MASK);
        Self(((generation as u64) << ID_SLOT_BITS) | slot)
    }

    #[must_use]
    pub const fn raw(self) -> u64 {
        self.0
    }

    #[must_use]
    const fn slot_index(self) -> usize {
        ((self.0 & ID_SLOT_MASK) - 1) as usize
    }

    #[must_use]
    const fn generation(self) -> u32 {
        (self.0 >> ID_SLOT_BITS) as u32
    }
}

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HookUpdateLane(Lanes);

impl HookUpdateLane {
    pub const NO: Self = Self(Lanes::NO);

    #[must_use]
    pub const fn new(lanes: Lanes) -> Option<Self> {
        let priority_lanes = lanes.remove_lane(Lane::OFFSCREEN);
        if priority_lanes.is_empty() {
            if lanes.contains_lane(Lane::OFFSCREEN) {
                None
            } else {
                Some(Self(lanes))
            }
        } else if priority_lanes.bits().count_ones() == 1 {
            Some(Self(lanes))
        } else {
            None
        }
    }

    pub fn from_lanes(lanes: Lanes) -> Result<Self, HookQueueError> {
        Self::new(lanes).ok_or(HookQueueError::InvalidHookUpdateLane { lanes })
    }

    #[must_use]
    pub const fn from_lane(lane: Lane) -> Option<Self> {
        Self::new(lane.to_lanes())
    }

    #[must_use]
    pub const fn hidden(lane: Lane) -> Option<Self> {
        Self::new(lane.to_lanes().merge_lane(Lane::OFFSCREEN))
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.0
    }

    #[must_use]
    pub const fn priority_lanes(self) -> Lanes {
        self.0.remove_lane(Lane::OFFSCREEN)
    }

    #[must_use]
    pub const fn is_hidden(self) -> bool {
        self.0.contains_lane(Lane::OFFSCREEN)
    }

    #[must_use]
    pub const fn is_no_lane(self) -> bool {
        self.0.is_empty()
    }
}

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HookRevertLane(Lane);

impl HookRevertLane {
    pub const NO: Self = Self(Lane::NO);

    #[must_use]
    pub const fn from_lane(lane: Lane) -> Self {
        Self(lane)
    }

    #[must_use]
    pub const fn lane(self) -> Lane {
        self.0
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.0.to_lanes()
    }

    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.0.is_empty()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookUpdate<Action, State> {
    lane: HookUpdateLane,
    revert_lane: HookRevertLane,
    action: Action,
    eager_state: Option<State>,
    next: Option<HookUpdateId>,
}

impl<Action, State> HookUpdate<Action, State> {
    #[must_use]
    pub fn new(lane: HookUpdateLane, action: Action) -> Self {
        Self {
            lane,
            revert_lane: HookRevertLane::NO,
            action,
            eager_state: None,
            next: None,
        }
    }

    #[must_use]
    pub const fn lane(&self) -> HookUpdateLane {
        self.lane
    }

    #[must_use]
    pub const fn revert_lane(&self) -> HookRevertLane {
        self.revert_lane
    }

    #[must_use]
    pub const fn action(&self) -> &Action {
        &self.action
    }

    #[must_use]
    pub const fn eager_state(&self) -> Option<&State> {
        self.eager_state.as_ref()
    }

    #[must_use]
    pub const fn has_eager_state(&self) -> bool {
        self.eager_state.is_some()
    }

    #[must_use]
    pub const fn next(&self) -> Option<HookUpdateId> {
        self.next
    }

    pub fn set_lane(&mut self, lane: HookUpdateLane) {
        self.lane = lane;
    }

    pub fn set_revert_lane(&mut self, revert_lane: HookRevertLane) {
        self.revert_lane = revert_lane;
    }

    pub fn set_eager_state(&mut self, eager_state: State) {
        self.eager_state = Some(eager_state);
    }

    pub fn clear_eager_state(&mut self) {
        self.eager_state = None;
    }
}

impl<Action: Clone, State: Clone> HookUpdate<Action, State> {
    fn clone_for_rebase(&self, lane: HookUpdateLane, revert_lane: HookRevertLane) -> Self {
        Self {
            lane,
            revert_lane,
            action: self.action.clone(),
            eager_state: self.eager_state.clone(),
            next: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookUpdateDispatchMetadata<Action, State> {
    lane: HookUpdateLane,
    revert_lane: HookRevertLane,
    action: Action,
    eager_state: Option<State>,
}

impl<Action, State> HookUpdateDispatchMetadata<Action, State> {
    #[must_use]
    pub fn new(lane: HookUpdateLane, action: Action) -> Self {
        Self {
            lane,
            revert_lane: HookRevertLane::NO,
            action,
            eager_state: None,
        }
    }

    #[must_use]
    pub fn with_revert_lane(mut self, revert_lane: HookRevertLane) -> Self {
        self.revert_lane = revert_lane;
        self
    }

    #[must_use]
    pub fn with_eager_state(mut self, eager_state: State) -> Self {
        self.eager_state = Some(eager_state);
        self
    }

    #[must_use]
    pub const fn lane(&self) -> HookUpdateLane {
        self.lane
    }

    #[must_use]
    pub const fn revert_lane(&self) -> HookRevertLane {
        self.revert_lane
    }

    #[must_use]
    pub const fn action(&self) -> &Action {
        &self.action
    }

    #[must_use]
    pub const fn eager_state(&self) -> Option<&State> {
        self.eager_state.as_ref()
    }

    #[must_use]
    pub const fn has_eager_state(&self) -> bool {
        self.eager_state.is_some()
    }
}

impl<Action, State> From<HookUpdateDispatchMetadata<Action, State>> for HookUpdate<Action, State> {
    fn from(metadata: HookUpdateDispatchMetadata<Action, State>) -> Self {
        Self {
            lane: metadata.lane,
            revert_lane: metadata.revert_lane,
            action: metadata.action,
            eager_state: metadata.eager_state,
            next: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookQueue<State, ReducerId = (), DispatchId = ()> {
    pending: Option<HookUpdateId>,
    lanes: Lanes,
    dispatch: Option<DispatchId>,
    last_rendered_reducer: Option<ReducerId>,
    last_rendered_state: State,
}

impl<State: Clone, ReducerId, DispatchId> HookQueue<State, ReducerId, DispatchId> {
    #[must_use]
    pub fn new(initial_state: State) -> Self {
        Self {
            pending: None,
            lanes: Lanes::NO,
            dispatch: None,
            last_rendered_reducer: None,
            last_rendered_state: initial_state,
        }
    }
}

impl<State, ReducerId, DispatchId> HookQueue<State, ReducerId, DispatchId> {
    #[must_use]
    pub const fn pending(&self) -> Option<HookUpdateId> {
        self.pending
    }

    #[must_use]
    pub const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub const fn dispatch(&self) -> Option<&DispatchId> {
        self.dispatch.as_ref()
    }

    #[must_use]
    pub const fn last_rendered_reducer(&self) -> Option<&ReducerId> {
        self.last_rendered_reducer.as_ref()
    }

    #[must_use]
    pub const fn last_rendered_state(&self) -> &State {
        &self.last_rendered_state
    }

    pub fn set_lanes(&mut self, lanes: Lanes) {
        self.lanes = lanes;
    }

    pub fn set_dispatch(&mut self, dispatch: DispatchId) {
        self.dispatch = Some(dispatch);
    }

    pub fn clear_dispatch(&mut self) {
        self.dispatch = None;
    }

    pub fn set_last_rendered_reducer(&mut self, reducer: ReducerId) {
        self.last_rendered_reducer = Some(reducer);
    }

    pub fn clear_last_rendered_reducer(&mut self) {
        self.last_rendered_reducer = None;
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookStateSlot<State> {
    memoized_state: State,
    base_state: State,
    base_queue: Option<HookUpdateId>,
    queue: HookQueueId,
}

impl<State: Clone> HookStateSlot<State> {
    #[must_use]
    pub fn new(initial_state: State, queue: HookQueueId) -> Self {
        Self {
            memoized_state: initial_state.clone(),
            base_state: initial_state,
            base_queue: None,
            queue,
        }
    }
}

impl<State> HookStateSlot<State> {
    #[must_use]
    pub const fn memoized_state(&self) -> &State {
        &self.memoized_state
    }

    #[must_use]
    pub const fn base_state(&self) -> &State {
        &self.base_state
    }

    #[must_use]
    pub const fn base_queue(&self) -> Option<HookUpdateId> {
        self.base_queue
    }

    #[must_use]
    pub const fn queue(&self) -> HookQueueId {
        self.queue
    }

    pub fn set_memoized_state(&mut self, memoized_state: State) {
        self.memoized_state = memoized_state;
    }

    pub fn set_base_state(&mut self, base_state: State) {
        self.base_state = base_state;
    }

    pub fn set_base_queue(&mut self, base_queue: Option<HookUpdateId>) {
        self.base_queue = base_queue;
    }
}

#[derive(Debug, Clone)]
struct QueueSlot<State, ReducerId, DispatchId> {
    generation: u32,
    queue: Option<HookQueue<State, ReducerId, DispatchId>>,
}

impl<State, ReducerId, DispatchId> QueueSlot<State, ReducerId, DispatchId> {
    const fn vacant(generation: u32) -> Self {
        Self {
            generation,
            queue: None,
        }
    }
}

#[derive(Debug, Clone)]
struct UpdateSlot<Action, State> {
    generation: u32,
    update: Option<HookUpdate<Action, State>>,
    pending_source: Option<HookPendingUpdateSourceState>,
}

impl<Action, State> UpdateSlot<Action, State> {
    const fn vacant(generation: u32) -> Self {
        Self {
            generation,
            update: None,
            pending_source: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct HookPendingUpdateSourceState {
    source: HookPendingUpdateSource,
    consumed: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct HookPendingUpdateSource {
    hook_source: HookStateQueueSource,
    update: HookUpdateId,
    update_generation: u32,
    lane: HookUpdateLane,
    source_owned: bool,
}

#[allow(dead_code)]
impl HookPendingUpdateSource {
    #[must_use]
    fn source_owned(
        hook_source: HookStateQueueSource,
        update: HookUpdateId,
        lane: HookUpdateLane,
    ) -> Self {
        Self {
            hook_source,
            update,
            update_generation: update.generation(),
            lane,
            source_owned: true,
        }
    }

    #[must_use]
    const fn queue(self) -> HookQueueId {
        self.hook_source.queue()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HookQueueError {
    InvalidQueueId {
        id: HookQueueId,
    },
    VacantQueue {
        id: HookQueueId,
    },
    StaleQueueId {
        id: HookQueueId,
        current_generation: u32,
    },
    InvalidUpdateId {
        id: HookUpdateId,
    },
    VacantUpdate {
        id: HookUpdateId,
    },
    StaleUpdateId {
        id: HookUpdateId,
        current_generation: u32,
    },
    MissingCircularNext {
        id: HookUpdateId,
    },
    CorruptRing {
        tail: HookUpdateId,
    },
    LinkedUpdateCannotBeReclaimed {
        id: HookUpdateId,
    },
    LinkedQueueCannotBeReclaimed {
        id: HookQueueId,
    },
    DuplicateStagedUpdate {
        id: HookUpdateId,
    },
    MissingStagedUpdateSource {
        id: HookUpdateId,
    },
    CallerShapedHookQueueSource {
        queue: HookQueueId,
    },
    CallerShapedStagedUpdateSource {
        id: HookUpdateId,
    },
    StagedUpdateSourceMismatch {
        source_update: HookUpdateId,
        staged_update: HookUpdateId,
        source_queue: HookQueueId,
        staged_queue: HookQueueId,
    },
    StagedUpdateAlreadyConsumed {
        id: HookUpdateId,
    },
    ExistingPendingUpdateSourceNotConsumed {
        id: HookUpdateId,
    },
    InvalidStagedHookSource {
        id: HookUpdateId,
        source: HookListError,
    },
    GenerationOverflow,
    InvalidHookUpdateLane {
        lanes: Lanes,
    },
}

impl Display for HookQueueError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidQueueId { id } => {
                write!(formatter, "hook queue id {} is invalid", id.raw())
            }
            Self::VacantQueue { id } => write!(formatter, "hook queue id {} is vacant", id.raw()),
            Self::StaleQueueId {
                id,
                current_generation,
            } => write!(
                formatter,
                "hook queue id {} has stale generation {}, current generation is {}",
                id.raw(),
                id.generation(),
                current_generation
            ),
            Self::InvalidUpdateId { id } => {
                write!(formatter, "hook update id {} is invalid", id.raw())
            }
            Self::VacantUpdate { id } => write!(formatter, "hook update id {} is vacant", id.raw()),
            Self::StaleUpdateId {
                id,
                current_generation,
            } => write!(
                formatter,
                "hook update id {} has stale generation {}, current generation is {}",
                id.raw(),
                id.generation(),
                current_generation
            ),
            Self::MissingCircularNext { id } => {
                write!(
                    formatter,
                    "hook update id {} is missing circular next",
                    id.raw()
                )
            }
            Self::CorruptRing { tail } => {
                write!(
                    formatter,
                    "hook update ring with tail {} is corrupt",
                    tail.raw()
                )
            }
            Self::LinkedUpdateCannotBeReclaimed { id } => write!(
                formatter,
                "hook update id {} is still linked and cannot be reclaimed",
                id.raw()
            ),
            Self::LinkedQueueCannotBeReclaimed { id } => write!(
                formatter,
                "hook queue id {} still has pending updates and cannot be reclaimed",
                id.raw()
            ),
            Self::DuplicateStagedUpdate { id } => {
                write!(
                    formatter,
                    "hook update id {} was staged more than once",
                    id.raw()
                )
            }
            Self::MissingStagedUpdateSource { id } => write!(
                formatter,
                "hook update id {} is missing source-owned staging currentness",
                id.raw()
            ),
            Self::CallerShapedHookQueueSource { queue } => write!(
                formatter,
                "hook queue id {} has caller-shaped hook-list source currentness",
                queue.raw()
            ),
            Self::CallerShapedStagedUpdateSource { id } => write!(
                formatter,
                "hook update id {} has caller-shaped staging source currentness",
                id.raw()
            ),
            Self::StagedUpdateSourceMismatch {
                source_update,
                staged_update,
                source_queue,
                staged_queue,
            } => write!(
                formatter,
                "staged hook update source points at update {} queue {}, but row points at update {} queue {}",
                source_update.raw(),
                source_queue.raw(),
                staged_update.raw(),
                staged_queue.raw()
            ),
            Self::StagedUpdateAlreadyConsumed { id } => write!(
                formatter,
                "hook update id {} source currentness was already consumed",
                id.raw()
            ),
            Self::ExistingPendingUpdateSourceNotConsumed { id } => write!(
                formatter,
                "existing pending hook update id {} has unconsumed source currentness",
                id.raw()
            ),
            Self::InvalidStagedHookSource { id, source } => write!(
                formatter,
                "hook update id {} has invalid hook-list source currentness: {}",
                id.raw(),
                source
            ),
            Self::GenerationOverflow => formatter.write_str("hook queue generation overflowed"),
            Self::InvalidHookUpdateLane { lanes } => {
                write!(
                    formatter,
                    "hook update lane bitset {:#x} is invalid",
                    lanes.bits()
                )
            }
        }
    }
}

impl Error for HookQueueError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProcessHookQueueResult<State> {
    memoized_state: State,
    base_state: State,
    base_queue: Option<HookUpdateId>,
    remaining_lanes: Lanes,
    applied_update_count: usize,
    skipped_update_count: usize,
    reverted_update_count: usize,
    eager_update_count: usize,
}

impl<State> ProcessHookQueueResult<State> {
    #[must_use]
    pub const fn memoized_state(&self) -> &State {
        &self.memoized_state
    }

    #[must_use]
    pub const fn base_state(&self) -> &State {
        &self.base_state
    }

    #[must_use]
    pub const fn base_queue(&self) -> Option<HookUpdateId> {
        self.base_queue
    }

    #[must_use]
    pub const fn remaining_lanes(&self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub const fn applied_update_count(&self) -> usize {
        self.applied_update_count
    }

    #[must_use]
    pub const fn skipped_update_count(&self) -> usize {
        self.skipped_update_count
    }

    #[must_use]
    pub const fn reverted_update_count(&self) -> usize {
        self.reverted_update_count
    }

    #[must_use]
    pub const fn eager_update_count(&self) -> usize {
        self.eager_update_count
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderPhaseHookQueueResult<State> {
    memoized_state: State,
    processed_update_count: usize,
}

impl<State> RenderPhaseHookQueueResult<State> {
    #[must_use]
    pub const fn memoized_state(&self) -> &State {
        &self.memoized_state
    }

    #[must_use]
    pub const fn processed_update_count(&self) -> usize {
        self.processed_update_count
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderPhaseHookUpdates {
    queues: Vec<HookQueueId>,
}

impl RenderPhaseHookUpdates {
    #[must_use]
    pub const fn new() -> Self {
        Self { queues: Vec::new() }
    }

    pub fn record(&mut self, queue: HookQueueId) {
        if !self.queues.contains(&queue) {
            self.queues.push(queue);
        }
    }

    #[must_use]
    pub fn queues(&self) -> &[HookQueueId] {
        &self.queues
    }

    pub fn clear(&mut self) {
        self.queues.clear();
    }
}

impl Default for RenderPhaseHookUpdates {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StagedHookUpdate<OwnerId> {
    owner: OwnerId,
    queue: HookQueueId,
    update: HookUpdateId,
    lane: HookUpdateLane,
    source: Option<HookPendingUpdateSource>,
}

impl<OwnerId> StagedHookUpdate<OwnerId> {
    #[must_use]
    pub const fn new(
        owner: OwnerId,
        queue: HookQueueId,
        update: HookUpdateId,
        lane: HookUpdateLane,
    ) -> Self {
        Self {
            owner,
            queue,
            update,
            lane,
            source: None,
        }
    }

    #[must_use]
    #[allow(dead_code)]
    fn source_owned(owner: OwnerId, source: HookPendingUpdateSource) -> Self {
        Self {
            owner,
            queue: source.queue(),
            update: source.update,
            lane: source.lane,
            source: Some(source),
        }
    }

    #[must_use]
    pub const fn owner(&self) -> &OwnerId {
        &self.owner
    }

    #[must_use]
    pub const fn queue(&self) -> HookQueueId {
        self.queue
    }

    #[must_use]
    pub const fn update(&self) -> HookUpdateId {
        self.update
    }

    #[must_use]
    pub const fn lane(&self) -> HookUpdateLane {
        self.lane
    }

    #[must_use]
    #[allow(dead_code)]
    const fn source(&self) -> Option<HookPendingUpdateSource> {
        self.source
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookUpdateStaging<OwnerId> {
    entries: Vec<StagedHookUpdate<OwnerId>>,
    lanes: Lanes,
}

impl<OwnerId> HookUpdateStaging<OwnerId> {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            entries: Vec::new(),
            lanes: Lanes::NO,
        }
    }

    pub fn stage(
        &mut self,
        owner: OwnerId,
        queue: HookQueueId,
        update: HookUpdateId,
        lane: HookUpdateLane,
    ) {
        self.lanes = self.lanes.merge(lane.lanes());
        self.entries
            .push(StagedHookUpdate::new(owner, queue, update, lane));
    }

    #[allow(dead_code)]
    fn stage_source_owned(&mut self, owner: OwnerId, source: HookPendingUpdateSource) {
        self.lanes = self.lanes.merge(source.lane.lanes());
        self.entries
            .push(StagedHookUpdate::source_owned(owner, source));
    }

    #[must_use]
    pub fn entries(&self) -> &[StagedHookUpdate<OwnerId>] {
        &self.entries
    }

    #[must_use]
    pub const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub const fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

impl<OwnerId> Default for HookUpdateStaging<OwnerId> {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone)]
pub struct HookQueueStore<State, Action, ReducerId = (), DispatchId = ()> {
    queues: Vec<QueueSlot<State, ReducerId, DispatchId>>,
    vacant_queues: Vec<usize>,
    updates: Vec<UpdateSlot<Action, State>>,
    vacant_updates: Vec<usize>,
}

impl<State, Action, ReducerId, DispatchId> HookQueueStore<State, Action, ReducerId, DispatchId> {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            queues: Vec::new(),
            vacant_queues: Vec::new(),
            updates: Vec::new(),
            vacant_updates: Vec::new(),
        }
    }
}

impl<State, Action, ReducerId, DispatchId> Default
    for HookQueueStore<State, Action, ReducerId, DispatchId>
{
    fn default() -> Self {
        Self::new()
    }
}

impl<State: Clone, Action, ReducerId, DispatchId>
    HookQueueStore<State, Action, ReducerId, DispatchId>
{
    pub fn create_queue(&mut self, initial_state: State) -> HookQueueId {
        let slot_index = self.vacant_queues.pop().unwrap_or_else(|| {
            let slot_index = self.queues.len();
            self.queues.push(QueueSlot::vacant(0));
            slot_index
        });
        let generation = self.queues[slot_index].generation;
        let id = HookQueueId::from_parts(slot_index, generation);
        self.queues[slot_index].queue = Some(HookQueue::new(initial_state));
        id
    }

    #[must_use]
    pub fn create_state_slot(&mut self, initial_state: State) -> HookStateSlot<State> {
        let queue = self.create_queue(initial_state.clone());
        HookStateSlot::new(initial_state, queue)
    }
}

impl<State, Action, ReducerId, DispatchId> HookQueueStore<State, Action, ReducerId, DispatchId> {
    pub fn create_update(&mut self, lane: HookUpdateLane, action: Action) -> HookUpdateId {
        self.insert_update(HookUpdate::new(lane, action))
    }

    #[allow(dead_code)]
    fn create_source_owned_update(
        &mut self,
        hook_source: HookStateQueueSource,
        lane: HookUpdateLane,
        action: Action,
    ) -> Result<HookPendingUpdateSource, HookQueueError> {
        if !hook_source.is_source_owned() {
            return Err(HookQueueError::CallerShapedHookQueueSource {
                queue: hook_source.queue(),
            });
        }

        self.validate_queue_id(hook_source.queue())?;
        let update = self.insert_update(HookUpdate::new(lane, action));
        let source = HookPendingUpdateSource::source_owned(hook_source, update, lane);
        self.updates[update.slot_index()].pending_source = Some(HookPendingUpdateSourceState {
            source,
            consumed: false,
        });
        Ok(source)
    }

    pub fn create_update_from_dispatch_metadata(
        &mut self,
        metadata: HookUpdateDispatchMetadata<Action, State>,
    ) -> HookUpdateId {
        self.insert_update(HookUpdate::from(metadata))
    }

    pub fn update(&self, id: HookUpdateId) -> Result<&HookUpdate<Action, State>, HookQueueError> {
        let index = self.validate_update_id(id)?;
        self.updates[index]
            .update
            .as_ref()
            .ok_or(HookQueueError::VacantUpdate { id })
    }

    pub fn update_mut(
        &mut self,
        id: HookUpdateId,
    ) -> Result<&mut HookUpdate<Action, State>, HookQueueError> {
        let index = self.validate_update_id(id)?;
        self.updates[index]
            .update
            .as_mut()
            .ok_or(HookQueueError::VacantUpdate { id })
    }

    pub fn queue(
        &self,
        id: HookQueueId,
    ) -> Result<&HookQueue<State, ReducerId, DispatchId>, HookQueueError> {
        let index = self.validate_queue_id(id)?;
        self.queues[index]
            .queue
            .as_ref()
            .ok_or(HookQueueError::VacantQueue { id })
    }

    pub fn queue_mut(
        &mut self,
        id: HookQueueId,
    ) -> Result<&mut HookQueue<State, ReducerId, DispatchId>, HookQueueError> {
        let index = self.validate_queue_id(id)?;
        self.queues[index]
            .queue
            .as_mut()
            .ok_or(HookQueueError::VacantQueue { id })
    }

    pub fn reclaim_update(&mut self, id: HookUpdateId) -> Result<(), HookQueueError> {
        let index = self.validate_update_id(id)?;
        if self.updates[index]
            .update
            .as_ref()
            .expect("validated update slot is occupied")
            .next
            .is_some()
        {
            return Err(HookQueueError::LinkedUpdateCannotBeReclaimed { id });
        }
        let next_generation = self.updates[index]
            .generation
            .checked_add(1)
            .ok_or(HookQueueError::GenerationOverflow)?;
        self.updates[index].update = None;
        self.updates[index].pending_source = None;
        self.updates[index].generation = next_generation;
        self.vacant_updates.push(index);
        Ok(())
    }

    pub fn reclaim_queue(&mut self, id: HookQueueId) -> Result<(), HookQueueError> {
        let index = self.validate_queue_id(id)?;
        if self.queues[index]
            .queue
            .as_ref()
            .expect("validated queue slot is occupied")
            .pending
            .is_some()
        {
            return Err(HookQueueError::LinkedQueueCannotBeReclaimed { id });
        }
        let next_generation = self.queues[index]
            .generation
            .checked_add(1)
            .ok_or(HookQueueError::GenerationOverflow)?;
        self.queues[index].queue = None;
        self.queues[index].generation = next_generation;
        self.vacant_queues.push(index);
        Ok(())
    }

    pub fn append_pending_update(
        &mut self,
        queue: HookQueueId,
        update: HookUpdateId,
    ) -> Result<(), HookQueueError> {
        self.validate_update_id(update)?;
        self.ensure_update_is_unlinked(update)?;
        self.append_pending_update_unchecked(queue, update)
    }

    pub fn enqueue_render_phase_update(
        &mut self,
        queue: HookQueueId,
        update: HookUpdateId,
        recorded: &mut RenderPhaseHookUpdates,
    ) -> Result<(), HookQueueError> {
        self.append_pending_update(queue, update)?;
        recorded.record(queue);
        Ok(())
    }

    pub fn pending_updates(&self, queue: HookQueueId) -> Result<Vec<HookUpdateId>, HookQueueError> {
        self.update_ring(self.queue(queue)?.pending)
    }

    pub fn update_ring(
        &self,
        tail: Option<HookUpdateId>,
    ) -> Result<Vec<HookUpdateId>, HookQueueError> {
        let Some(tail) = tail else {
            return Ok(Vec::new());
        };
        self.collect_ring_ids(tail)
    }

    pub fn clear_render_phase_updates(
        &mut self,
        recorded: &mut RenderPhaseHookUpdates,
    ) -> Result<(), HookQueueError> {
        for &queue in recorded.queues() {
            self.queue_mut(queue)?.pending = None;
        }
        recorded.clear();
        Ok(())
    }

    fn validate_queue_id(&self, id: HookQueueId) -> Result<usize, HookQueueError> {
        let entry = self
            .queues
            .get(id.slot_index())
            .ok_or(HookQueueError::InvalidQueueId { id })?;
        if entry.generation != id.generation() {
            return Err(HookQueueError::StaleQueueId {
                id,
                current_generation: entry.generation,
            });
        }
        if entry.queue.is_none() {
            return Err(HookQueueError::VacantQueue { id });
        }
        Ok(id.slot_index())
    }

    fn validate_update_id(&self, id: HookUpdateId) -> Result<usize, HookQueueError> {
        let entry = self
            .updates
            .get(id.slot_index())
            .ok_or(HookQueueError::InvalidUpdateId { id })?;
        if entry.generation != id.generation() {
            return Err(HookQueueError::StaleUpdateId {
                id,
                current_generation: entry.generation,
            });
        }
        if entry.update.is_none() {
            return Err(HookQueueError::VacantUpdate { id });
        }
        Ok(id.slot_index())
    }

    fn ensure_update_is_unlinked(&self, id: HookUpdateId) -> Result<(), HookQueueError> {
        if self.update(id)?.next.is_some() {
            Err(HookQueueError::LinkedUpdateCannotBeReclaimed { id })
        } else {
            Ok(())
        }
    }

    fn append_pending_update_unchecked(
        &mut self,
        queue: HookQueueId,
        update: HookUpdateId,
    ) -> Result<(), HookQueueError> {
        let pending = self.queue(queue)?.pending;
        if let Some(pending_tail) = pending {
            let first = self.next_in_ring(pending_tail)?;
            self.update_mut(update)?.next = Some(first);
            self.update_mut(pending_tail)?.next = Some(update);
        } else {
            self.update_mut(update)?.next = Some(update);
        }
        self.queue_mut(queue)?.pending = Some(update);
        Ok(())
    }

    fn insert_update(&mut self, update: HookUpdate<Action, State>) -> HookUpdateId {
        let slot_index = self.vacant_updates.pop().unwrap_or_else(|| {
            let slot_index = self.updates.len();
            self.updates.push(UpdateSlot::vacant(0));
            slot_index
        });
        let generation = self.updates[slot_index].generation;
        let id = HookUpdateId::from_parts(slot_index, generation);
        self.updates[slot_index].update = Some(update);
        self.updates[slot_index].pending_source = None;
        id
    }

    fn next_in_ring(&self, id: HookUpdateId) -> Result<HookUpdateId, HookQueueError> {
        self.update(id)?
            .next
            .ok_or(HookQueueError::MissingCircularNext { id })
    }

    fn collect_ring_ids(&self, tail: HookUpdateId) -> Result<Vec<HookUpdateId>, HookQueueError> {
        self.validate_update_id(tail)?;
        let first = self.next_in_ring(tail)?;
        self.validate_update_id(first)?;

        let mut ids = Vec::new();
        let mut seen = HashSet::new();
        let mut next = first;

        loop {
            self.validate_update_id(next)?;
            if !seen.insert(next) {
                if next == first {
                    break;
                }
                return Err(HookQueueError::CorruptRing { tail });
            }
            ids.push(next);
            next = self.next_in_ring(next)?;
            if next == first {
                break;
            }
            if ids.len() > self.updates.len() {
                return Err(HookQueueError::CorruptRing { tail });
            }
        }

        if !seen.contains(&tail) {
            return Err(HookQueueError::CorruptRing { tail });
        }

        Ok(ids)
    }

    #[allow(dead_code)]
    fn validate_source_owned_staged_entry<OwnerId>(
        &self,
        entry: &StagedHookUpdate<OwnerId>,
        hook_lists: &HookListArena,
    ) -> Result<(), HookQueueError> {
        let source = entry
            .source()
            .ok_or(HookQueueError::MissingStagedUpdateSource { id: entry.update })?;
        if !source.source_owned || !source.hook_source.is_source_owned() {
            return Err(HookQueueError::CallerShapedStagedUpdateSource { id: entry.update });
        }
        if source.update != entry.update
            || source.update_generation != entry.update.generation()
            || source.queue() != entry.queue
            || source.lane != entry.lane
        {
            return Err(HookQueueError::StagedUpdateSourceMismatch {
                source_update: source.update,
                staged_update: entry.update,
                source_queue: source.queue(),
                staged_queue: entry.queue,
            });
        }

        hook_lists
            .validate_state_queue_source(source.hook_source)
            .map_err(|error| HookQueueError::InvalidStagedHookSource {
                id: entry.update,
                source: error,
            })?;
        self.validate_queue_id(entry.queue)?;
        self.validate_update_id(entry.update)?;
        self.ensure_update_is_unlinked(entry.update)?;

        let slot = &self.updates[entry.update.slot_index()];
        let stored = slot
            .pending_source
            .as_ref()
            .ok_or(HookQueueError::MissingStagedUpdateSource { id: entry.update })?;
        if stored.consumed {
            return Err(HookQueueError::StagedUpdateAlreadyConsumed { id: entry.update });
        }
        if stored.source != source {
            return Err(HookQueueError::StagedUpdateSourceMismatch {
                source_update: source.update,
                staged_update: entry.update,
                source_queue: source.queue(),
                staged_queue: entry.queue,
            });
        }

        Ok(())
    }

    #[allow(dead_code)]
    fn validate_source_owned_pending_ring(
        &self,
        queue: HookQueueId,
        tail: HookUpdateId,
        hook_lists: &HookListArena,
    ) -> Result<(), HookQueueError> {
        for update in self.collect_ring_ids(tail)? {
            self.validate_source_owned_pending_update(queue, update, hook_lists)?;
        }
        Ok(())
    }

    #[allow(dead_code)]
    fn validate_source_owned_pending_update(
        &self,
        queue: HookQueueId,
        update: HookUpdateId,
        hook_lists: &HookListArena,
    ) -> Result<(), HookQueueError> {
        self.validate_update_id(update)?;
        let stored = self.updates[update.slot_index()]
            .pending_source
            .as_ref()
            .ok_or(HookQueueError::MissingStagedUpdateSource { id: update })?;
        if !stored.consumed {
            return Err(HookQueueError::ExistingPendingUpdateSourceNotConsumed { id: update });
        }

        let source = stored.source;
        if !source.source_owned || !source.hook_source.is_source_owned() {
            return Err(HookQueueError::CallerShapedStagedUpdateSource { id: update });
        }
        if source.update != update
            || source.update_generation != update.generation()
            || source.queue() != queue
            || source.lane != self.update(update)?.lane()
        {
            return Err(HookQueueError::StagedUpdateSourceMismatch {
                source_update: source.update,
                staged_update: update,
                source_queue: source.queue(),
                staged_queue: queue,
            });
        }

        hook_lists
            .validate_state_queue_source(source.hook_source)
            .map_err(|error| HookQueueError::InvalidStagedHookSource {
                id: update,
                source: error,
            })?;
        Ok(())
    }

    #[allow(dead_code)]
    fn consume_pending_update_source(
        &mut self,
        update: HookUpdateId,
    ) -> Result<(), HookQueueError> {
        let index = self.validate_update_id(update)?;
        let stored = self.updates[index]
            .pending_source
            .as_mut()
            .ok_or(HookQueueError::MissingStagedUpdateSource { id: update })?;
        if stored.consumed {
            return Err(HookQueueError::StagedUpdateAlreadyConsumed { id: update });
        }
        stored.consumed = true;
        Ok(())
    }
}

impl<State: Clone, Action: Clone, ReducerId, DispatchId>
    HookQueueStore<State, Action, ReducerId, DispatchId>
{
    pub fn process_update_queue(
        &mut self,
        slot: &mut HookStateSlot<State>,
        render_lanes: Lanes,
        root_render_lanes: Lanes,
        mut reducer: impl FnMut(State, &Action) -> State,
    ) -> Result<ProcessHookQueueResult<State>, HookQueueError> {
        self.merge_pending_into_base_queue(slot)?;

        let base_queue_on_entry = slot.base_queue;
        let Some(base_tail) = base_queue_on_entry else {
            slot.memoized_state = slot.base_state.clone();
            self.queue_mut(slot.queue)?.lanes = Lanes::NO;
            let state = slot.memoized_state.clone();
            return Ok(ProcessHookQueueResult {
                memoized_state: state,
                base_state: slot.base_state.clone(),
                base_queue: None,
                remaining_lanes: Lanes::NO,
                applied_update_count: 0,
                skipped_update_count: 0,
                reverted_update_count: 0,
                eager_update_count: 0,
            });
        };

        let update_ids = self.collect_ring_ids(base_tail)?;
        let mut new_state = slot.base_state.clone();
        let mut new_base_state = None;
        let mut new_base_queue_first = None;
        let mut new_base_queue_last = None;
        let mut remaining_lanes = Lanes::NO;
        let mut applied_update_count = 0;
        let mut skipped_update_count = 0;
        let mut reverted_update_count = 0;
        let mut eager_update_count = 0;

        for update_id in update_ids {
            let original = self.update(update_id)?.clone();
            let update_lane = original.lane.priority_lanes();
            let lane_scope = if original.lane.is_hidden() {
                root_render_lanes
            } else {
                render_lanes
            };
            let should_skip_update = !update_lane.is_subset_of(lane_scope);

            if should_skip_update {
                let clone = original.clone_for_rebase(
                    HookUpdateLane::from_lanes(update_lane)?,
                    original.revert_lane,
                );
                let clone_id = self.insert_update(clone);
                if new_base_queue_last.is_none() {
                    new_base_state = Some(new_state.clone());
                }
                self.append_to_new_base_queue(
                    &mut new_base_queue_first,
                    &mut new_base_queue_last,
                    clone_id,
                )?;
                remaining_lanes = remaining_lanes.merge(update_lane);
                skipped_update_count += 1;
            } else if original.revert_lane.is_empty() {
                if new_base_queue_last.is_some() {
                    let clone = original.clone_for_rebase(HookUpdateLane::NO, HookRevertLane::NO);
                    let clone_id = self.insert_update(clone);
                    self.append_to_new_base_queue(
                        &mut new_base_queue_first,
                        &mut new_base_queue_last,
                        clone_id,
                    )?;
                }

                let (next_state, used_eager) =
                    reduce_hook_update(new_state, &original, &mut reducer, true);
                new_state = next_state;
                applied_update_count += 1;
                if used_eager {
                    eager_update_count += 1;
                }
            } else if render_lanes.contains_lane(original.revert_lane.lane()) {
                reverted_update_count += 1;
            } else {
                let clone = original.clone_for_rebase(HookUpdateLane::NO, original.revert_lane);
                let clone_id = self.insert_update(clone);
                if new_base_queue_last.is_none() {
                    new_base_state = Some(new_state.clone());
                }
                self.append_to_new_base_queue(
                    &mut new_base_queue_first,
                    &mut new_base_queue_last,
                    clone_id,
                )?;
                remaining_lanes = remaining_lanes.merge(original.revert_lane.lanes());

                let (next_state, used_eager) =
                    reduce_hook_update(new_state, &original, &mut reducer, false);
                new_state = next_state;
                applied_update_count += 1;
                if used_eager {
                    eager_update_count += 1;
                }
            }
        }

        if new_base_queue_last.is_none() {
            new_base_state = Some(new_state.clone());
        } else if let Some(last) = new_base_queue_last {
            self.update_mut(last)?.next = new_base_queue_first;
        }

        slot.memoized_state = new_state.clone();
        slot.base_state = new_base_state.expect("base state is set after hook queue processing");
        slot.base_queue = new_base_queue_last;
        self.queue_mut(slot.queue)?.last_rendered_state = new_state.clone();

        Ok(ProcessHookQueueResult {
            memoized_state: new_state,
            base_state: slot.base_state.clone(),
            base_queue: slot.base_queue,
            remaining_lanes,
            applied_update_count,
            skipped_update_count,
            reverted_update_count,
            eager_update_count,
        })
    }

    pub fn process_render_phase_updates(
        &mut self,
        slot: &mut HookStateSlot<State>,
        mut reducer: impl FnMut(State, &Action) -> State,
    ) -> Result<RenderPhaseHookQueueResult<State>, HookQueueError> {
        let pending = self.queue(slot.queue)?.pending;
        let ids = self.update_ring(pending)?;
        self.queue_mut(slot.queue)?.pending = None;

        let mut new_state = slot.memoized_state.clone();
        for id in &ids {
            let action = self.update(*id)?.action.clone();
            new_state = reducer(new_state, &action);
        }

        slot.memoized_state = new_state.clone();
        if slot.base_queue.is_none() {
            slot.base_state = new_state.clone();
        }
        self.queue_mut(slot.queue)?.last_rendered_state = new_state.clone();

        Ok(RenderPhaseHookQueueResult {
            memoized_state: new_state,
            processed_update_count: ids.len(),
        })
    }

    fn merge_pending_into_base_queue(
        &mut self,
        slot: &mut HookStateSlot<State>,
    ) -> Result<(), HookQueueError> {
        let Some(pending_tail) = self.queue(slot.queue)?.pending else {
            return Ok(());
        };
        self.next_in_ring(pending_tail)?;

        if let Some(base_tail) = slot.base_queue {
            let base_first = self.next_in_ring(base_tail)?;
            let pending_first = self.next_in_ring(pending_tail)?;
            self.update_mut(base_tail)?.next = Some(pending_first);
            self.update_mut(pending_tail)?.next = Some(base_first);
        }

        self.queue_mut(slot.queue)?.pending = None;
        slot.base_queue = Some(pending_tail);
        Ok(())
    }

    fn append_to_new_base_queue(
        &mut self,
        first: &mut Option<HookUpdateId>,
        last: &mut Option<HookUpdateId>,
        update: HookUpdateId,
    ) -> Result<(), HookQueueError> {
        self.update_mut(update)?.next = None;
        if let Some(last_id) = *last {
            self.update_mut(last_id)?.next = Some(update);
        } else {
            *first = Some(update);
        }
        *last = Some(update);
        Ok(())
    }
}

impl<OwnerId: Clone> HookUpdateStaging<OwnerId> {
    pub fn finish_queueing<State, Action, ReducerId, DispatchId>(
        &mut self,
        store: &mut HookQueueStore<State, Action, ReducerId, DispatchId>,
    ) -> Result<Vec<StagedHookUpdate<OwnerId>>, HookQueueError> {
        // React drains staged `(fiber, queue, update, lane)` rows into each hook
        // queue's pending ring. This store uses generational IDs, so validate
        // every row and existing ring before mutating or clearing the staging
        // buffer; failed currentness checks must leave pending work observable.
        let mut seen_updates = HashSet::new();
        let mut seen_queues = HashSet::new();
        for entry in &self.entries {
            store.validate_queue_id(entry.queue)?;
            store.validate_update_id(entry.update)?;
            store.ensure_update_is_unlinked(entry.update)?;
            if !seen_updates.insert(entry.update) {
                return Err(HookQueueError::DuplicateStagedUpdate { id: entry.update });
            }
            if seen_queues.insert(entry.queue) {
                if let Some(pending) = store.queue(entry.queue)?.pending {
                    store.collect_ring_ids(pending)?;
                }
            }
        }

        let finished = self.entries.clone();
        for entry in &finished {
            store.append_pending_update_unchecked(entry.queue, entry.update)?;
        }
        self.entries.clear();
        self.lanes = Lanes::NO;
        Ok(finished)
    }

    #[allow(dead_code)]
    fn finish_queueing_with_source_currentness<State, Action, ReducerId, DispatchId>(
        &mut self,
        store: &mut HookQueueStore<State, Action, ReducerId, DispatchId>,
        hook_lists: &HookListArena,
    ) -> Result<Vec<StagedHookUpdate<OwnerId>>, HookQueueError> {
        let mut seen_updates = HashSet::new();
        let mut seen_queues = HashSet::new();
        for entry in &self.entries {
            store.validate_source_owned_staged_entry(entry, hook_lists)?;
            if !seen_updates.insert(entry.update) {
                return Err(HookQueueError::DuplicateStagedUpdate { id: entry.update });
            }
            if seen_queues.insert(entry.queue) {
                if let Some(pending) = store.queue(entry.queue)?.pending {
                    store.validate_source_owned_pending_ring(entry.queue, pending, hook_lists)?;
                }
            }
        }

        let finished = self.entries.clone();
        for entry in &finished {
            store.append_pending_update_unchecked(entry.queue, entry.update)?;
        }
        for entry in &finished {
            store.consume_pending_update_source(entry.update)?;
        }
        self.entries.clear();
        self.lanes = Lanes::NO;
        Ok(finished)
    }
}

fn reduce_hook_update<State: Clone, Action>(
    state: State,
    update: &HookUpdate<Action, State>,
    reducer: &mut impl FnMut(State, &Action) -> State,
    allow_eager_state: bool,
) -> (State, bool) {
    if allow_eager_state && let Some(eager_state) = update.eager_state.clone() {
        (eager_state, true)
    } else {
        (reducer(state, &update.action), false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::hook_list::HookStateQueueSource;
    use crate::{
        FiberArena, FiberId, FiberMode, FiberTag, HookListArena, HookListError, HookSlotId,
        HookSlotPayload, HookStatePayload, PropsHandle, StateHandle,
    };

    fn lane(lane: Lane) -> HookUpdateLane {
        HookUpdateLane::from_lane(lane).unwrap()
    }

    fn add(state: i32, action: &i32) -> i32 {
        state + action
    }

    fn owner() -> FiberId {
        let mut fibers = FiberArena::new();
        fibers.create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        )
    }

    fn append_state_hook_source(
        hook_lists: &mut HookListArena,
        list: crate::HookListId,
        slot: &HookStateSlot<i32>,
        raw_state: u64,
    ) -> (HookSlotId, HookStateQueueSource) {
        let payload = HookStatePayload::new(
            StateHandle::from_raw(raw_state),
            StateHandle::from_raw(raw_state),
            slot.base_queue(),
            slot.queue(),
        );
        let hook = hook_lists
            .append_hook(list, HookSlotPayload::state(payload))
            .unwrap();
        let source = hook_lists.state_queue_source(hook).unwrap();
        (hook, source)
    }

    fn assert_staging_preserved(
        staging: &HookUpdateStaging<&'static str>,
        expected_lanes: Lanes,
        expected_updates: &[HookUpdateId],
    ) {
        assert_eq!(staging.lanes(), expected_lanes);
        assert_eq!(
            staging
                .entries()
                .iter()
                .map(StagedHookUpdate::update)
                .collect::<Vec<_>>(),
            expected_updates
        );
    }

    #[test]
    fn hook_update_lane_accepts_no_single_and_hidden_lanes() {
        assert_eq!(HookUpdateLane::NO.lanes(), Lanes::NO);
        assert_eq!(lane(Lane::DEFAULT).priority_lanes(), Lanes::DEFAULT);

        let hidden = HookUpdateLane::hidden(Lane::DEFAULT).unwrap();
        assert!(hidden.is_hidden());
        assert_eq!(hidden.priority_lanes(), Lanes::DEFAULT);
    }

    #[test]
    fn hook_update_lane_rejects_ambiguous_bitsets() {
        assert_eq!(
            HookUpdateLane::from_lanes(Lanes::DEFAULT.merge(Lanes::SYNC)),
            Err(HookQueueError::InvalidHookUpdateLane {
                lanes: Lanes::DEFAULT.merge(Lanes::SYNC)
            })
        );
        assert_eq!(HookUpdateLane::from_lane(Lane::OFFSCREEN), None);
    }

    #[test]
    fn pending_append_preserves_insertion_order_as_circular_tail_ring() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let mut slot = store.create_state_slot(0);
        let first = store.create_update(lane(Lane::DEFAULT), 1);
        let second = store.create_update(lane(Lane::SYNC), 2);

        store.append_pending_update(slot.queue(), first).unwrap();
        store.append_pending_update(slot.queue(), second).unwrap();

        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            vec![first, second]
        );
        assert_eq!(store.queue(slot.queue()).unwrap().pending(), Some(second));
        assert_eq!(store.update(first).unwrap().next(), Some(second));
        assert_eq!(store.update(second).unwrap().next(), Some(first));

        let result = store
            .process_update_queue(&mut slot, Lanes::SYNC_DEFAULT, Lanes::SYNC_DEFAULT, add)
            .unwrap();
        assert_eq!(*result.memoized_state(), 3);
    }

    #[test]
    fn pending_merge_into_existing_base_preserves_base_then_pending_order() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let mut slot = store.create_state_slot(0);
        let skipped = store.create_update(lane(Lane::DEFAULT), 10);
        let applied = store.create_update(lane(Lane::SYNC), 1);
        store.append_pending_update(slot.queue(), skipped).unwrap();
        store.append_pending_update(slot.queue(), applied).unwrap();

        store
            .process_update_queue(&mut slot, Lanes::SYNC, Lanes::SYNC, add)
            .unwrap();
        let base_after_sync = store.update_ring(slot.base_queue()).unwrap();
        assert_eq!(base_after_sync.len(), 2);
        assert_eq!(store.update(base_after_sync[0]).unwrap().action(), &10);
        assert_eq!(store.update(base_after_sync[1]).unwrap().action(), &1);

        let pending = store.create_update(lane(Lane::DEFAULT), 100);
        store.append_pending_update(slot.queue(), pending).unwrap();
        store
            .process_update_queue(&mut slot, Lanes::DEFAULT, Lanes::DEFAULT, add)
            .unwrap();

        assert_eq!(*slot.memoized_state(), 111);
        assert_eq!(
            store.update_ring(slot.base_queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
    }

    #[test]
    fn process_rebases_skipped_lanes_and_no_lane_clones_in_order() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let mut slot = store.create_state_slot(0);
        let a_sync = store.create_update(lane(Lane::SYNC), 1);
        let b_default = store.create_update(lane(Lane::DEFAULT), 10);
        let c_sync = store.create_update(lane(Lane::SYNC), 2);
        let d_default = store.create_update(lane(Lane::DEFAULT), 100);
        for update in [a_sync, b_default, c_sync, d_default] {
            store.append_pending_update(slot.queue(), update).unwrap();
        }

        let sync_result = store
            .process_update_queue(&mut slot, Lanes::SYNC, Lanes::SYNC, add)
            .unwrap();
        let rebased = store.update_ring(slot.base_queue()).unwrap();

        assert_eq!(*sync_result.memoized_state(), 3);
        assert_eq!(*sync_result.base_state(), 1);
        assert_eq!(sync_result.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(sync_result.applied_update_count(), 2);
        assert_eq!(sync_result.skipped_update_count(), 2);
        assert_eq!(rebased.len(), 3);
        assert_eq!(
            store.update(rebased[0]).unwrap().lane().priority_lanes(),
            Lanes::DEFAULT
        );
        assert!(store.update(rebased[1]).unwrap().lane().is_no_lane());
        assert_eq!(
            store.update(rebased[2]).unwrap().lane().priority_lanes(),
            Lanes::DEFAULT
        );

        let default_result = store
            .process_update_queue(&mut slot, Lanes::DEFAULT, Lanes::DEFAULT, add)
            .unwrap();
        assert_eq!(*default_result.memoized_state(), 113);
        assert_eq!(
            store.update_ring(slot.base_queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
    }

    #[test]
    fn hidden_updates_strip_offscreen_before_priority_checks() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let mut slot = store.create_state_slot(0);
        let hidden = store.create_update(HookUpdateLane::hidden(Lane::DEFAULT).unwrap(), 5);
        store.append_pending_update(slot.queue(), hidden).unwrap();

        let skipped = store
            .process_update_queue(&mut slot, Lanes::DEFAULT, Lanes::NO, add)
            .unwrap();
        assert_eq!(skipped.skipped_update_count(), 1);
        assert_eq!(skipped.remaining_lanes(), Lanes::DEFAULT);

        let still_skipped = store
            .process_update_queue(&mut slot, Lanes::NO, Lanes::DEFAULT, add)
            .unwrap();
        assert_eq!(still_skipped.skipped_update_count(), 1);

        let applied = store
            .process_update_queue(&mut slot, Lanes::DEFAULT, Lanes::DEFAULT, add)
            .unwrap();
        assert_eq!(applied.applied_update_count(), 1);
        assert_eq!(*applied.memoized_state(), 5);
    }

    #[test]
    fn eager_no_lane_update_is_represented_and_does_not_call_reducer() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let mut slot = store.create_state_slot(7);
        let update = store.create_update(HookUpdateLane::NO, 1000);
        store.update_mut(update).unwrap().set_eager_state(7);
        store.append_pending_update(slot.queue(), update).unwrap();
        let mut reducer_calls = 0;

        let result = store
            .process_update_queue(&mut slot, Lanes::NO, Lanes::NO, |state, action| {
                reducer_calls += 1;
                state + action
            })
            .unwrap();

        assert_eq!(*result.memoized_state(), 7);
        assert_eq!(result.remaining_lanes(), Lanes::NO);
        assert_eq!(result.eager_update_count(), 1);
        assert_eq!(reducer_calls, 0);
    }

    #[test]
    fn eager_dispatch_metadata_rebases_deterministically() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let mut slot = store.create_state_slot(1);
        let update = store.create_update_from_dispatch_metadata(
            HookUpdateDispatchMetadata::new(lane(Lane::DEFAULT), 1000).with_eager_state(7),
        );
        store.append_pending_update(slot.queue(), update).unwrap();

        let skipped = store
            .process_update_queue(&mut slot, Lanes::SYNC, Lanes::SYNC, add)
            .unwrap();
        let rebased = store.update_ring(slot.base_queue()).unwrap();

        assert_eq!(*skipped.memoized_state(), 1);
        assert_eq!(skipped.skipped_update_count(), 1);
        assert_eq!(skipped.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(rebased.len(), 1);
        let rebased_update = store.update(rebased[0]).unwrap();
        assert_eq!(rebased_update.lane().priority_lanes(), Lanes::DEFAULT);
        assert_eq!(rebased_update.revert_lane(), HookRevertLane::NO);
        assert_eq!(*rebased_update.action(), 1000);
        assert_eq!(rebased_update.eager_state(), Some(&7));

        let mut reducer_calls = 0;
        let applied = store
            .process_update_queue(
                &mut slot,
                Lanes::DEFAULT,
                Lanes::DEFAULT,
                |state, action| {
                    reducer_calls += 1;
                    state + action
                },
            )
            .unwrap();

        assert_eq!(*applied.memoized_state(), 7);
        assert_eq!(applied.applied_update_count(), 1);
        assert_eq!(applied.eager_update_count(), 1);
        assert_eq!(reducer_calls, 0);
        assert_eq!(
            store.update_ring(slot.base_queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
    }

    #[test]
    fn eager_metadata_survives_no_lane_clone_after_prior_skip() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let mut slot = store.create_state_slot(1);
        let skipped = store.create_update(lane(Lane::DEFAULT), 10);
        let eager_applied = store.create_update_from_dispatch_metadata(
            HookUpdateDispatchMetadata::new(lane(Lane::SYNC), 1000).with_eager_state(7),
        );
        store.append_pending_update(slot.queue(), skipped).unwrap();
        store
            .append_pending_update(slot.queue(), eager_applied)
            .unwrap();
        let mut reducer_calls = 0;

        let result = store
            .process_update_queue(&mut slot, Lanes::SYNC, Lanes::SYNC, |state, action| {
                reducer_calls += 1;
                state + action
            })
            .unwrap();

        assert_eq!(*result.memoized_state(), 7);
        assert_eq!(*result.base_state(), 1);
        assert_eq!(result.applied_update_count(), 1);
        assert_eq!(result.skipped_update_count(), 1);
        assert_eq!(result.eager_update_count(), 1);
        assert_eq!(reducer_calls, 0);
        let rebased = store.update_ring(slot.base_queue()).unwrap();
        assert_eq!(rebased.len(), 2);
        assert_eq!(
            store.update(rebased[0]).unwrap().lane().priority_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(store.update(rebased[0]).unwrap().eager_state(), None);
        assert!(store.update(rebased[1]).unwrap().lane().is_no_lane());
        assert_eq!(store.update(rebased[1]).unwrap().eager_state(), Some(&7));
    }

    #[test]
    fn optimistic_update_applies_until_revert_lane_renders() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let mut slot = store.create_state_slot(0);
        let optimistic = store.create_update(lane(Lane::SYNC), 5);
        store
            .update_mut(optimistic)
            .unwrap()
            .set_revert_lane(HookRevertLane::from_lane(Lane::TRANSITION_1));
        store
            .append_pending_update(slot.queue(), optimistic)
            .unwrap();

        let applied = store
            .process_update_queue(&mut slot, Lanes::SYNC, Lanes::SYNC, add)
            .unwrap();
        let rebased = store.update_ring(slot.base_queue()).unwrap();
        assert_eq!(*applied.memoized_state(), 5);
        assert_eq!(applied.remaining_lanes(), Lane::TRANSITION_1.to_lanes());
        assert_eq!(store.update(rebased[0]).unwrap().lane(), HookUpdateLane::NO);
        assert_eq!(
            store.update(rebased[0]).unwrap().revert_lane(),
            HookRevertLane::from_lane(Lane::TRANSITION_1)
        );

        let reverted = store
            .process_update_queue(
                &mut slot,
                Lane::TRANSITION_1.to_lanes(),
                Lane::TRANSITION_1.to_lanes(),
                add,
            )
            .unwrap();
        assert_eq!(*reverted.memoized_state(), 0);
        assert_eq!(reverted.reverted_update_count(), 1);
        assert_eq!(
            store.update_ring(slot.base_queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
    }

    #[test]
    fn render_phase_updates_process_without_lane_checks_and_clear_pending() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let mut slot = store.create_state_slot(0);
        let mut recorded = RenderPhaseHookUpdates::new();
        let update = store.create_update(lane(Lane::DEFAULT), 3);
        store
            .enqueue_render_phase_update(slot.queue(), update, &mut recorded)
            .unwrap();

        let result = store.process_render_phase_updates(&mut slot, add).unwrap();

        assert_eq!(*result.memoized_state(), 3);
        assert_eq!(result.processed_update_count(), 1);
        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
        assert_eq!(*slot.base_state(), 3);
    }

    #[test]
    fn render_phase_cleanup_only_clears_recorded_queues() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot_a = store.create_state_slot(0);
        let slot_b = store.create_state_slot(0);
        let update_a = store.create_update(lane(Lane::DEFAULT), 1);
        let update_b = store.create_update(lane(Lane::DEFAULT), 2);
        let mut recorded = RenderPhaseHookUpdates::new();
        store
            .enqueue_render_phase_update(slot_a.queue(), update_a, &mut recorded)
            .unwrap();
        store
            .append_pending_update(slot_b.queue(), update_b)
            .unwrap();

        store.clear_render_phase_updates(&mut recorded).unwrap();

        assert_eq!(
            store.pending_updates(slot_a.queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
        assert_eq!(
            store.pending_updates(slot_b.queue()).unwrap(),
            vec![update_b]
        );
    }

    #[test]
    fn staged_updates_are_invisible_until_finish_and_then_append_in_order() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let first = store.create_update(lane(Lane::SYNC), 1);
        let second = store.create_update(lane(Lane::DEFAULT), 2);
        let mut staging = HookUpdateStaging::new();
        staging.stage("owner", slot.queue(), first, lane(Lane::SYNC));
        staging.stage("owner", slot.queue(), second, lane(Lane::DEFAULT));

        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
        assert_eq!(staging.lanes(), Lanes::SYNC.merge(Lanes::DEFAULT));

        let finished = staging.finish_queueing(&mut store).unwrap();
        assert_eq!(finished.len(), 2);
        assert!(staging.is_empty());
        assert_eq!(staging.lanes(), Lanes::NO);
        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            vec![first, second]
        );
    }

    #[test]
    fn source_owned_finish_appends_and_consumes_pending_sources() {
        let mut hook_lists = HookListArena::new();
        let list = hook_lists.create_list(owner());
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let (_hook, hook_source) = append_state_hook_source(&mut hook_lists, list, &slot, 10);
        let first = store
            .create_source_owned_update(hook_source, lane(Lane::SYNC), 1)
            .unwrap();
        let second = store
            .create_source_owned_update(hook_source, lane(Lane::DEFAULT), 2)
            .unwrap();
        let mut staging = HookUpdateStaging::new();
        staging.stage_source_owned("owner", first);
        staging.stage_source_owned("owner", second);

        let finished = staging
            .finish_queueing_with_source_currentness(&mut store, &hook_lists)
            .unwrap();

        assert_eq!(finished.len(), 2);
        assert!(staging.is_empty());
        assert_eq!(staging.lanes(), Lanes::NO);
        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            vec![first.update, second.update]
        );

        let third = store
            .create_source_owned_update(hook_source, lane(Lane::TRANSITION_1), 3)
            .unwrap();
        staging.stage_source_owned("owner", third);
        let appended = staging
            .finish_queueing_with_source_currentness(&mut store, &hook_lists)
            .unwrap();

        assert_eq!(appended.len(), 1);
        assert!(staging.is_empty());
        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            vec![first.update, second.update, third.update]
        );
    }

    #[test]
    fn source_owned_finish_rejects_missing_and_caller_shaped_currentness_without_clearing() {
        let mut hook_lists = HookListArena::new();
        let list = hook_lists.create_list(owner());
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let (hook, hook_source) = append_state_hook_source(&mut hook_lists, list, &slot, 10);
        let update = store.create_update(lane(Lane::SYNC), 1);
        let mut missing = HookUpdateStaging::new();
        missing.stage("owner", slot.queue(), update, lane(Lane::SYNC));

        assert_eq!(
            missing.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::MissingStagedUpdateSource { id: update })
        );
        assert_staging_preserved(&missing, Lanes::SYNC, &[update]);
        assert_eq!(store.update(update).unwrap().next(), None);

        let caller_source =
            HookStateQueueSource::caller_shaped_for_canary(list, hook, slot.queue());
        assert_eq!(
            store.create_source_owned_update(caller_source, lane(Lane::DEFAULT), 2),
            Err(HookQueueError::CallerShapedHookQueueSource {
                queue: slot.queue()
            })
        );

        let source = store
            .create_source_owned_update(hook_source, lane(Lane::DEFAULT), 3)
            .unwrap();
        let mut caller_shaped = HookUpdateStaging::new();
        caller_shaped.stage_source_owned("owner", source);
        caller_shaped.entries[0]
            .source
            .as_mut()
            .unwrap()
            .source_owned = false;

        assert_eq!(
            caller_shaped.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::CallerShapedStagedUpdateSource { id: source.update })
        );
        assert_staging_preserved(&caller_shaped, Lanes::DEFAULT, &[source.update]);
        assert_eq!(store.update(source.update).unwrap().next(), None);
    }

    #[test]
    fn source_owned_finish_rejects_cross_queue_smuggling_without_clearing() {
        let mut hook_lists = HookListArena::new();
        let list = hook_lists.create_list(owner());
        let mut store = HookQueueStore::<i32, i32>::new();
        let first_slot = store.create_state_slot(0);
        let second_slot = store.create_state_slot(0);
        let (_first_hook, first_source) =
            append_state_hook_source(&mut hook_lists, list, &first_slot, 10);
        let (_second_hook, _second_source) =
            append_state_hook_source(&mut hook_lists, list, &second_slot, 20);
        let source = store
            .create_source_owned_update(first_source, lane(Lane::DEFAULT), 1)
            .unwrap();
        let mut staging = HookUpdateStaging::new();
        staging.stage_source_owned("owner", source);
        staging.entries[0].queue = second_slot.queue();

        assert_eq!(
            staging.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::StagedUpdateSourceMismatch {
                source_update: source.update,
                staged_update: source.update,
                source_queue: first_slot.queue(),
                staged_queue: second_slot.queue()
            })
        );
        assert_staging_preserved(&staging, Lanes::DEFAULT, &[source.update]);
        assert_eq!(
            store.pending_updates(first_slot.queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
        assert_eq!(
            store.pending_updates(second_slot.queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
        assert_eq!(store.update(source.update).unwrap().next(), None);
    }

    #[test]
    fn source_owned_finish_rejects_no_source_existing_pending_ring_without_clearing() {
        let mut hook_lists = HookListArena::new();
        let list = hook_lists.create_list(owner());
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let (_hook, hook_source) = append_state_hook_source(&mut hook_lists, list, &slot, 10);
        let existing = store.create_update(lane(Lane::SYNC), 1);
        store.append_pending_update(slot.queue(), existing).unwrap();
        let source = store
            .create_source_owned_update(hook_source, lane(Lane::DEFAULT), 2)
            .unwrap();
        let mut staging = HookUpdateStaging::new();
        staging.stage_source_owned("owner", source);

        assert_eq!(
            staging.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::MissingStagedUpdateSource { id: existing })
        );
        assert_staging_preserved(&staging, Lanes::DEFAULT, &[source.update]);
        assert_eq!(store.pending_updates(slot.queue()).unwrap(), vec![existing]);
        assert_eq!(store.update(source.update).unwrap().next(), None);
    }

    #[test]
    fn source_owned_finish_rejects_caller_shaped_existing_pending_ring_without_clearing() {
        let mut hook_lists = HookListArena::new();
        let list = hook_lists.create_list(owner());
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let (_hook, hook_source) = append_state_hook_source(&mut hook_lists, list, &slot, 10);
        let existing = store
            .create_source_owned_update(hook_source, lane(Lane::SYNC), 1)
            .unwrap();
        let mut first = HookUpdateStaging::new();
        first.stage_source_owned("owner", existing);
        first
            .finish_queueing_with_source_currentness(&mut store, &hook_lists)
            .unwrap();
        store.updates[existing.update.slot_index()]
            .pending_source
            .as_mut()
            .unwrap()
            .source
            .source_owned = false;

        let staged = store
            .create_source_owned_update(hook_source, lane(Lane::DEFAULT), 2)
            .unwrap();
        let mut staging = HookUpdateStaging::new();
        staging.stage_source_owned("owner", staged);

        assert_eq!(
            staging.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::CallerShapedStagedUpdateSource {
                id: existing.update
            })
        );
        assert_staging_preserved(&staging, Lanes::DEFAULT, &[staged.update]);
        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            vec![existing.update]
        );
        assert_eq!(store.update(staged.update).unwrap().next(), None);
    }

    #[test]
    fn source_owned_finish_rejects_cross_queue_existing_pending_ring_without_clearing() {
        let mut hook_lists = HookListArena::new();
        let list = hook_lists.create_list(owner());
        let mut store = HookQueueStore::<i32, i32>::new();
        let first_slot = store.create_state_slot(0);
        let second_slot = store.create_state_slot(0);
        let (_first_hook, first_source) =
            append_state_hook_source(&mut hook_lists, list, &first_slot, 10);
        let (_second_hook, second_source) =
            append_state_hook_source(&mut hook_lists, list, &second_slot, 20);
        let existing = store
            .create_source_owned_update(first_source, lane(Lane::SYNC), 1)
            .unwrap();
        let mut first = HookUpdateStaging::new();
        first.stage_source_owned("owner", existing);
        first
            .finish_queueing_with_source_currentness(&mut store, &hook_lists)
            .unwrap();

        store.queue_mut(second_slot.queue()).unwrap().pending = Some(existing.update);
        let staged = store
            .create_source_owned_update(second_source, lane(Lane::DEFAULT), 2)
            .unwrap();
        let mut staging = HookUpdateStaging::new();
        staging.stage_source_owned("owner", staged);

        assert_eq!(
            staging.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::StagedUpdateSourceMismatch {
                source_update: existing.update,
                staged_update: existing.update,
                source_queue: first_slot.queue(),
                staged_queue: second_slot.queue()
            })
        );
        assert_staging_preserved(&staging, Lanes::DEFAULT, &[staged.update]);
        assert_eq!(store.update(staged.update).unwrap().next(), None);
        assert_eq!(
            store.queue(second_slot.queue()).unwrap().pending(),
            Some(existing.update)
        );
    }

    #[test]
    fn source_owned_finish_rejects_cross_list_existing_pending_ring_without_clearing() {
        let mut hook_lists = HookListArena::new();
        let first_list = hook_lists.create_list(owner());
        let second_list = hook_lists.create_list(owner());
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let (first_hook, first_source) =
            append_state_hook_source(&mut hook_lists, first_list, &slot, 10);
        let (_second_hook, second_source) =
            append_state_hook_source(&mut hook_lists, second_list, &slot, 20);
        let existing = store
            .create_source_owned_update(first_source, lane(Lane::SYNC), 1)
            .unwrap();
        let mut first = HookUpdateStaging::new();
        first.stage_source_owned("owner", existing);
        first
            .finish_queueing_with_source_currentness(&mut store, &hook_lists)
            .unwrap();
        hook_lists
            .set_hook_list_for_canary(first_hook, second_list)
            .unwrap();

        let staged = store
            .create_source_owned_update(second_source, lane(Lane::DEFAULT), 2)
            .unwrap();
        let mut staging = HookUpdateStaging::new();
        staging.stage_source_owned("owner", staged);

        assert!(matches!(
            staging.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::InvalidStagedHookSource {
                id,
                source: HookListError::WrongHookListOwner { hook: wrong_hook, expected, actual }
            }) if id == existing.update
                && wrong_hook == first_hook
                && expected == first_list
                && actual == second_list
        ));
        assert_staging_preserved(&staging, Lanes::DEFAULT, &[staged.update]);
        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            vec![existing.update]
        );
        assert_eq!(store.update(staged.update).unwrap().next(), None);
    }

    #[test]
    fn source_owned_finish_rejects_cross_list_smuggling_without_clearing() {
        let mut hook_lists = HookListArena::new();
        let first_list = hook_lists.create_list(owner());
        let second_list = hook_lists.create_list(owner());
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let (hook, hook_source) = append_state_hook_source(&mut hook_lists, first_list, &slot, 10);
        let source = store
            .create_source_owned_update(hook_source, lane(Lane::DEFAULT), 1)
            .unwrap();
        let mut staging = HookUpdateStaging::new();
        staging.stage_source_owned("owner", source);
        hook_lists
            .set_hook_list_for_canary(hook, second_list)
            .unwrap();

        assert!(matches!(
            staging.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::InvalidStagedHookSource {
                id,
                source: HookListError::WrongHookListOwner { hook: wrong_hook, expected, actual }
            }) if id == source.update
                && wrong_hook == hook
                && expected == first_list
                && actual == second_list
        ));
        assert_staging_preserved(&staging, Lanes::DEFAULT, &[source.update]);
        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
        assert_eq!(store.update(source.update).unwrap().next(), None);
    }

    #[test]
    fn source_owned_finish_rejects_stale_hook_source_without_clearing() {
        let mut hook_lists = HookListArena::new();
        let list = hook_lists.create_list(owner());
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let (_hook, hook_source) = append_state_hook_source(&mut hook_lists, list, &slot, 10);
        let source = store
            .create_source_owned_update(hook_source, lane(Lane::DEFAULT), 1)
            .unwrap();
        let mut staging = HookUpdateStaging::new();
        staging.stage_source_owned("owner", source);
        hook_lists.discard_list(list).unwrap();

        assert!(matches!(
            staging.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::InvalidStagedHookSource {
                id,
                source: HookListError::StaleListGeneration { id: stale_list, .. }
            }) if id == source.update && stale_list == list
        ));
        assert_staging_preserved(&staging, Lanes::DEFAULT, &[source.update]);
        assert_eq!(store.update(source.update).unwrap().next(), None);
    }

    #[test]
    fn source_owned_finish_rejects_stale_queue_source_without_clearing() {
        let mut hook_lists = HookListArena::new();
        let list = hook_lists.create_list(owner());
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let (_hook, hook_source) = append_state_hook_source(&mut hook_lists, list, &slot, 10);
        let source = store
            .create_source_owned_update(hook_source, lane(Lane::DEFAULT), 1)
            .unwrap();
        let mut staging = HookUpdateStaging::new();
        staging.stage_source_owned("owner", source);

        store.reclaim_queue(slot.queue()).unwrap();
        let reused = store.create_queue(0);
        assert_ne!(slot.queue(), reused);

        assert!(matches!(
            staging.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::StaleQueueId { id, current_generation: 1 })
                if id == slot.queue()
        ));
        assert_staging_preserved(&staging, Lanes::DEFAULT, &[source.update]);
        assert_eq!(store.queue(reused).unwrap().pending(), None);
        assert_eq!(store.update(source.update).unwrap().next(), None);
    }

    #[test]
    fn source_owned_finish_rejects_duplicate_prelinked_corrupt_and_stale_ids_without_clearing() {
        let mut hook_lists = HookListArena::new();
        let list = hook_lists.create_list(owner());
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let (_hook, hook_source) = append_state_hook_source(&mut hook_lists, list, &slot, 10);
        let duplicate = store
            .create_source_owned_update(hook_source, lane(Lane::SYNC), 1)
            .unwrap();
        let mut duplicate_staging = HookUpdateStaging::new();
        duplicate_staging.stage_source_owned("owner", duplicate);
        duplicate_staging.stage_source_owned("owner", duplicate);

        assert_eq!(
            duplicate_staging.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::DuplicateStagedUpdate {
                id: duplicate.update
            })
        );
        assert_staging_preserved(
            &duplicate_staging,
            Lanes::SYNC,
            &[duplicate.update, duplicate.update],
        );

        let linked = store
            .create_source_owned_update(hook_source, lane(Lane::DEFAULT), 2)
            .unwrap();
        store
            .append_pending_update(slot.queue(), linked.update)
            .unwrap();
        let staged = store
            .create_source_owned_update(hook_source, lane(Lane::SYNC), 3)
            .unwrap();
        let mut prelinked_staging = HookUpdateStaging::new();
        prelinked_staging.stage_source_owned("owner", linked);
        prelinked_staging.stage_source_owned("owner", staged);

        assert_eq!(
            prelinked_staging.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::LinkedUpdateCannotBeReclaimed { id: linked.update })
        );
        assert_staging_preserved(
            &prelinked_staging,
            Lanes::DEFAULT.merge(Lanes::SYNC),
            &[linked.update, staged.update],
        );
        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            vec![linked.update]
        );
        assert_eq!(store.update(staged.update).unwrap().next(), None);

        let corrupt = store
            .create_source_owned_update(hook_source, lane(Lane::SYNC), 4)
            .unwrap();
        let mut corrupt_staging = HookUpdateStaging::new();
        corrupt_staging.stage_source_owned("owner", corrupt);
        store.update_mut(linked.update).unwrap().next = None;

        assert_eq!(
            corrupt_staging.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::MissingCircularNext { id: linked.update })
        );
        assert_staging_preserved(&corrupt_staging, Lanes::SYNC, &[corrupt.update]);
        assert_eq!(
            store.queue(slot.queue()).unwrap().pending(),
            Some(linked.update)
        );
        assert_eq!(store.update(corrupt.update).unwrap().next(), None);

        store.queue_mut(slot.queue()).unwrap().pending = None;
        store.update_mut(linked.update).unwrap().next = None;
        store.reclaim_update(corrupt.update).unwrap();
        let reused = store.create_update(lane(Lane::SYNC), 5);
        assert_ne!(corrupt.update, reused);
        let mut stale_staging = HookUpdateStaging::new();
        stale_staging.stage_source_owned("owner", corrupt);

        assert!(matches!(
            stale_staging.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::StaleUpdateId { id, current_generation: 1 })
                if id == corrupt.update
        ));
        assert_staging_preserved(&stale_staging, Lanes::SYNC, &[corrupt.update]);
    }

    #[test]
    fn source_owned_finish_rejects_replay_after_double_consume_without_clearing() {
        let mut hook_lists = HookListArena::new();
        let list = hook_lists.create_list(owner());
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let (_hook, hook_source) = append_state_hook_source(&mut hook_lists, list, &slot, 10);
        let source = store
            .create_source_owned_update(hook_source, lane(Lane::SYNC), 1)
            .unwrap();
        let mut first = HookUpdateStaging::new();
        first.stage_source_owned("owner", source);
        first
            .finish_queueing_with_source_currentness(&mut store, &hook_lists)
            .unwrap();

        store.queue_mut(slot.queue()).unwrap().pending = None;
        store.update_mut(source.update).unwrap().next = None;
        let mut replay = HookUpdateStaging::new();
        replay.stage_source_owned("owner", source);

        assert_eq!(
            replay.finish_queueing_with_source_currentness(&mut store, &hook_lists),
            Err(HookQueueError::StagedUpdateAlreadyConsumed { id: source.update })
        );
        assert_staging_preserved(&replay, Lanes::SYNC, &[source.update]);
        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
        assert_eq!(store.update(source.update).unwrap().next(), None);
    }

    #[test]
    fn finish_queueing_rejects_duplicate_staged_update_without_clearing() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let update = store.create_update(lane(Lane::SYNC), 1);
        let mut staging = HookUpdateStaging::new();
        staging.stage("owner", slot.queue(), update, lane(Lane::SYNC));
        staging.stage("owner", slot.queue(), update, lane(Lane::SYNC));

        assert_eq!(
            staging.finish_queueing(&mut store),
            Err(HookQueueError::DuplicateStagedUpdate { id: update })
        );
        assert_staging_preserved(&staging, Lanes::SYNC, &[update, update]);
        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
        assert_eq!(store.update(update).unwrap().next(), None);
    }

    #[test]
    fn finish_queueing_rejects_stale_queue_row_without_clearing() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let stale_queue = store.create_queue(0);
        let update = store.create_update(lane(Lane::DEFAULT), 1);
        let mut staging = HookUpdateStaging::new();
        staging.stage("owner", stale_queue, update, lane(Lane::DEFAULT));

        store.reclaim_queue(stale_queue).unwrap();
        let current_queue = store.create_queue(0);

        assert_ne!(stale_queue, current_queue);
        assert!(matches!(
            staging.finish_queueing(&mut store),
            Err(HookQueueError::StaleQueueId {
                id,
                current_generation: 1
            }) if id == stale_queue
        ));
        assert_staging_preserved(&staging, Lanes::DEFAULT, &[update]);
        assert_eq!(store.queue(current_queue).unwrap().pending(), None);
        assert_eq!(store.update(update).unwrap().next(), None);
    }

    #[test]
    fn finish_queueing_rejects_stale_update_row_without_clearing() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let stale_update = store.create_update(lane(Lane::DEFAULT), 1);
        let mut staging = HookUpdateStaging::new();
        staging.stage("owner", slot.queue(), stale_update, lane(Lane::DEFAULT));

        store.reclaim_update(stale_update).unwrap();
        let current_update = store.create_update(lane(Lane::DEFAULT), 2);

        assert_ne!(stale_update, current_update);
        assert!(matches!(
            staging.finish_queueing(&mut store),
            Err(HookQueueError::StaleUpdateId {
                id,
                current_generation: 1
            }) if id == stale_update
        ));
        assert_staging_preserved(&staging, Lanes::DEFAULT, &[stale_update]);
        assert_eq!(
            store.pending_updates(slot.queue()).unwrap(),
            Vec::<HookUpdateId>::new()
        );
    }

    #[test]
    fn finish_queueing_rejects_already_linked_update_without_clearing() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let linked = store.create_update(lane(Lane::SYNC), 1);
        let staged = store.create_update(lane(Lane::DEFAULT), 2);
        let mut staging = HookUpdateStaging::new();
        store.append_pending_update(slot.queue(), linked).unwrap();
        staging.stage("owner", slot.queue(), linked, lane(Lane::SYNC));
        staging.stage("owner", slot.queue(), staged, lane(Lane::DEFAULT));

        assert_eq!(
            staging.finish_queueing(&mut store),
            Err(HookQueueError::LinkedUpdateCannotBeReclaimed { id: linked })
        );
        assert_staging_preserved(
            &staging,
            Lanes::SYNC.merge(Lanes::DEFAULT),
            &[linked, staged],
        );
        assert_eq!(store.pending_updates(slot.queue()).unwrap(), vec![linked]);
        assert_eq!(store.update(staged).unwrap().next(), None);
    }

    #[test]
    fn finish_queueing_rejects_corrupt_existing_pending_ring_without_clearing() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let first = store.create_update(lane(Lane::SYNC), 1);
        let tail = store.create_update(lane(Lane::SYNC), 2);
        let staged = store.create_update(lane(Lane::DEFAULT), 3);
        let mut staging = HookUpdateStaging::new();
        store.append_pending_update(slot.queue(), first).unwrap();
        store.append_pending_update(slot.queue(), tail).unwrap();
        store.update_mut(first).unwrap().next = Some(first);
        staging.stage("owner", slot.queue(), staged, lane(Lane::DEFAULT));

        assert_eq!(
            staging.finish_queueing(&mut store),
            Err(HookQueueError::CorruptRing { tail })
        );
        assert_staging_preserved(&staging, Lanes::DEFAULT, &[staged]);
        assert_eq!(store.queue(slot.queue()).unwrap().pending(), Some(tail));
        assert_eq!(store.update(first).unwrap().next(), Some(first));
        assert_eq!(store.update(tail).unwrap().next(), Some(first));
        assert_eq!(store.update(staged).unwrap().next(), None);
    }

    #[test]
    fn stale_update_handles_fail_after_reclaim_and_reuse() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let first = store.create_update(lane(Lane::SYNC), 1);
        store.reclaim_update(first).unwrap();
        let reused = store.create_update(lane(Lane::SYNC), 2);

        assert_ne!(first, reused);
        assert!(matches!(
            store.update(first),
            Err(HookQueueError::StaleUpdateId { .. })
        ));
    }

    #[test]
    fn corrupt_ring_missing_next_returns_structured_error() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let slot = store.create_state_slot(0);
        let update = store.create_update(lane(Lane::SYNC), 1);
        store.append_pending_update(slot.queue(), update).unwrap();
        store.update_mut(update).unwrap().next = None;

        assert_eq!(
            store.pending_updates(slot.queue()),
            Err(HookQueueError::MissingCircularNext { id: update })
        );
    }

    #[test]
    fn processing_corrupt_base_ring_returns_structured_error() {
        let mut store = HookQueueStore::<i32, i32>::new();
        let mut slot = store.create_state_slot(0);
        let update = store.create_update(lane(Lane::DEFAULT), 1);
        store.append_pending_update(slot.queue(), update).unwrap();
        store
            .process_update_queue(&mut slot, Lanes::SYNC, Lanes::SYNC, add)
            .unwrap();
        let base_tail = slot.base_queue().unwrap();
        store.update_mut(base_tail).unwrap().next = None;

        assert_eq!(
            store.process_update_queue(&mut slot, Lanes::DEFAULT, Lanes::DEFAULT, add),
            Err(HookQueueError::MissingCircularNext { id: base_tail })
        );
    }
}
