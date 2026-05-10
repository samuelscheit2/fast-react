//! HostRoot/class-style update queue storage.
//!
//! React stores class and HostRoot updates in insertion order, with a shared
//! circular pending ring and a linear base queue for rebasing skipped lanes.
//! This module implements that data shape for HostRoot updates only; it does
//! not run the scheduler, begin work, commit callbacks, or call host APIs.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{Lane, Lanes, UpdateQueueHandle};

use crate::{HostRootState, RootElementHandle};

const UPDATE_ID_SLOT_BITS: u64 = 32;
const UPDATE_ID_SLOT_MASK: u64 = (1u64 << UPDATE_ID_SLOT_BITS) - 1;

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct UpdateId(u64);

impl UpdateId {
    #[must_use]
    pub const fn new(raw: u64) -> Option<Self> {
        if raw == 0 || raw & UPDATE_ID_SLOT_MASK == 0 {
            None
        } else {
            Some(Self(raw))
        }
    }

    #[must_use]
    const fn from_parts(slot_index: usize, generation: u32) -> Self {
        let slot = slot_index as u64 + 1;
        assert!(slot <= UPDATE_ID_SLOT_MASK);
        Self(((generation as u64) << UPDATE_ID_SLOT_BITS) | slot)
    }

    #[must_use]
    pub const fn raw(self) -> u64 {
        self.0
    }

    #[must_use]
    const fn slot_index(self) -> usize {
        ((self.0 & UPDATE_ID_SLOT_MASK) - 1) as usize
    }

    #[must_use]
    const fn generation(self) -> u32 {
        (self.0 >> UPDATE_ID_SLOT_BITS) as u32
    }
}

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct RootUpdateCallbackHandle(u64);

impl RootUpdateCallbackHandle {
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum UpdateTag {
    UpdateState,
    ReplaceState,
    ForceUpdate,
    CaptureUpdate,
}

impl UpdateTag {
    #[must_use]
    pub const fn react_tag(self) -> u8 {
        match self {
            Self::UpdateState => 0,
            Self::ReplaceState => 1,
            Self::ForceUpdate => 2,
            Self::CaptureUpdate => 3,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootUpdatePayload {
    element: RootElementHandle,
}

impl RootUpdatePayload {
    #[must_use]
    pub const fn new(element: RootElementHandle) -> Self {
        Self { element }
    }

    #[must_use]
    pub const fn element(self) -> RootElementHandle {
        self.element
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootUpdate {
    lane: Lanes,
    tag: UpdateTag,
    payload: Option<RootUpdatePayload>,
    callback: RootUpdateCallbackHandle,
    next: Option<UpdateId>,
}

impl RootUpdate {
    #[must_use]
    pub const fn new(lane: Lane) -> Self {
        Self {
            lane: lane.to_lanes(),
            tag: UpdateTag::UpdateState,
            payload: None,
            callback: RootUpdateCallbackHandle::NONE,
            next: None,
        }
    }

    #[must_use]
    pub const fn lane(self) -> Lanes {
        self.lane
    }

    #[must_use]
    pub const fn tag(self) -> UpdateTag {
        self.tag
    }

    #[must_use]
    pub const fn payload(self) -> Option<RootUpdatePayload> {
        self.payload
    }

    #[must_use]
    pub const fn callback(self) -> RootUpdateCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn next(self) -> Option<UpdateId> {
        self.next
    }

    pub fn set_lane(&mut self, lane: Lanes) {
        self.lane = lane;
    }

    pub fn set_payload(&mut self, payload: RootUpdatePayload) {
        self.payload = Some(payload);
    }

    pub fn set_callback(&mut self, callback: RootUpdateCallbackHandle) {
        self.callback = callback;
    }

    pub fn mark_hidden(&mut self) {
        self.lane = self.lane.merge_lane(Lane::OFFSCREEN);
    }

    fn clone_with_lane_and_callback(self, lane: Lanes, callback: RootUpdateCallbackHandle) -> Self {
        Self {
            lane,
            tag: self.tag,
            payload: self.payload,
            callback,
            next: None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CollectedRootUpdateCallback {
    callback: RootUpdateCallbackHandle,
    hidden: bool,
}

impl CollectedRootUpdateCallback {
    #[must_use]
    pub const fn callback(self) -> RootUpdateCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn hidden(self) -> bool {
        self.hidden
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SharedQueue {
    pending: Option<UpdateId>,
    lanes: Lanes,
    hidden_callbacks: Vec<RootUpdateCallbackHandle>,
}

impl SharedQueue {
    #[must_use]
    const fn new() -> Self {
        Self {
            pending: None,
            lanes: Lanes::NO,
            hidden_callbacks: Vec::new(),
        }
    }

    #[must_use]
    pub const fn pending(&self) -> Option<UpdateId> {
        self.pending
    }

    #[must_use]
    pub const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub fn hidden_callbacks(&self) -> &[RootUpdateCallbackHandle] {
        &self.hidden_callbacks
    }
}

impl Default for SharedQueue {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UpdateQueue {
    base_state: HostRootState,
    first_base_update: Option<UpdateId>,
    last_base_update: Option<UpdateId>,
    shared: SharedQueue,
    callbacks: Vec<CollectedRootUpdateCallback>,
}

impl UpdateQueue {
    #[must_use]
    pub fn new(base_state: HostRootState) -> Self {
        Self {
            base_state,
            first_base_update: None,
            last_base_update: None,
            shared: SharedQueue::new(),
            callbacks: Vec::new(),
        }
    }

    #[must_use]
    pub const fn base_state(&self) -> HostRootState {
        self.base_state
    }

    #[must_use]
    pub const fn first_base_update(&self) -> Option<UpdateId> {
        self.first_base_update
    }

    #[must_use]
    pub const fn last_base_update(&self) -> Option<UpdateId> {
        self.last_base_update
    }

    #[must_use]
    pub const fn shared(&self) -> &SharedQueue {
        &self.shared
    }

    #[must_use]
    pub fn callbacks(&self) -> &[CollectedRootUpdateCallback] {
        &self.callbacks
    }
}

struct UpdateSlot {
    generation: u32,
    update: Option<RootUpdate>,
}

impl UpdateSlot {
    const fn vacant(generation: u32) -> Self {
        Self {
            generation,
            update: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum UpdateQueueError {
    EmptyQueueHandle,
    InvalidQueueHandle {
        handle: UpdateQueueHandle,
    },
    InvalidUpdateId {
        id: UpdateId,
    },
    VacantUpdate {
        id: UpdateId,
    },
    StaleUpdateId {
        id: UpdateId,
        current_generation: u32,
    },
    MissingCircularNext {
        id: UpdateId,
    },
}

impl Display for UpdateQueueError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyQueueHandle => formatter.write_str("update queue handle is empty"),
            Self::InvalidQueueHandle { handle } => {
                write!(formatter, "update queue handle {} is invalid", handle.raw())
            }
            Self::InvalidUpdateId { id } => write!(formatter, "update id {} is invalid", id.raw()),
            Self::VacantUpdate { id } => write!(formatter, "update id {} is vacant", id.raw()),
            Self::StaleUpdateId {
                id,
                current_generation,
            } => write!(
                formatter,
                "update id {} has stale generation {}, current generation is {}",
                id.raw(),
                id.generation(),
                current_generation
            ),
            Self::MissingCircularNext { id } => {
                write!(
                    formatter,
                    "pending update {} is missing circular next",
                    id.raw()
                )
            }
        }
    }
}

impl Error for UpdateQueueError {}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ProcessUpdateQueueResult {
    memoized_state: HostRootState,
    remaining_lanes: Lanes,
    applied_update_count: usize,
    skipped_update_count: usize,
}

impl ProcessUpdateQueueResult {
    #[must_use]
    pub const fn memoized_state(self) -> HostRootState {
        self.memoized_state
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
}

#[derive(Default)]
pub struct UpdateQueueStore {
    queues: Vec<UpdateQueue>,
    updates: Vec<UpdateSlot>,
    vacant_updates: Vec<usize>,
}

impl UpdateQueueStore {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            queues: Vec::new(),
            updates: Vec::new(),
            vacant_updates: Vec::new(),
        }
    }

    pub fn initialize_host_root_queue(&mut self, base_state: HostRootState) -> UpdateQueueHandle {
        let raw = self.queues.len() as u64 + 1;
        self.queues.push(UpdateQueue::new(base_state));
        UpdateQueueHandle::from_raw(raw)
    }

    pub fn create_update(&mut self, lane: Lane) -> UpdateId {
        self.insert_update(RootUpdate::new(lane))
    }

    pub fn update(&self, id: UpdateId) -> Result<&RootUpdate, UpdateQueueError> {
        let index = self.validate_update_id(id)?;
        self.updates[index]
            .update
            .as_ref()
            .ok_or(UpdateQueueError::VacantUpdate { id })
    }

    pub fn update_mut(&mut self, id: UpdateId) -> Result<&mut RootUpdate, UpdateQueueError> {
        let index = self.validate_update_id(id)?;
        self.updates[index]
            .update
            .as_mut()
            .ok_or(UpdateQueueError::VacantUpdate { id })
    }

    pub fn queue(&self, handle: UpdateQueueHandle) -> Result<&UpdateQueue, UpdateQueueError> {
        self.queue_index(handle).and_then(|index| {
            self.queues
                .get(index)
                .ok_or(UpdateQueueError::InvalidQueueHandle { handle })
        })
    }

    pub fn queue_mut(
        &mut self,
        handle: UpdateQueueHandle,
    ) -> Result<&mut UpdateQueue, UpdateQueueError> {
        let index = self.queue_index(handle)?;
        self.queues
            .get_mut(index)
            .ok_or(UpdateQueueError::InvalidQueueHandle { handle })
    }

    pub fn append_pending_update(
        &mut self,
        queue: UpdateQueueHandle,
        update: UpdateId,
    ) -> Result<(), UpdateQueueError> {
        self.validate_update_id(update)?;
        let pending = self.queue(queue)?.shared.pending;
        if let Some(pending) = pending {
            let first = self.update(pending)?.next;
            self.update_mut(update)?.next = first;
            self.update_mut(pending)?.next = Some(update);
        } else {
            self.update_mut(update)?.next = Some(update);
        }
        self.queue_mut(queue)?.shared.pending = Some(update);
        Ok(())
    }

    pub fn entangle_transition_update(
        &mut self,
        queue: UpdateQueueHandle,
        root_pending_lanes: Lanes,
        lane: Lane,
    ) -> Result<Option<Lanes>, UpdateQueueError> {
        if !lane.is_transition() {
            return Ok(None);
        }

        let shared = &mut self.queue_mut(queue)?.shared;
        let queue_lanes = shared.lanes.intersect(root_pending_lanes);
        let new_queue_lanes = queue_lanes.merge_lane(lane);
        shared.lanes = new_queue_lanes;
        Ok(Some(new_queue_lanes))
    }

    pub fn mark_update_hidden(&mut self, update: UpdateId) -> Result<(), UpdateQueueError> {
        self.update_mut(update)?.mark_hidden();
        Ok(())
    }

    pub fn pending_updates(
        &self,
        queue: UpdateQueueHandle,
    ) -> Result<Vec<UpdateId>, UpdateQueueError> {
        let Some(tail) = self.queue(queue)?.shared.pending else {
            return Ok(Vec::new());
        };
        let first = self
            .update(tail)?
            .next
            .ok_or(UpdateQueueError::MissingCircularNext { id: tail })?;
        let mut ids = vec![first];
        let mut next = self.update(first)?.next;

        while let Some(id) = next {
            if id == first {
                break;
            }
            ids.push(id);
            next = self.update(id)?.next;
        }
        Ok(ids)
    }

    pub fn base_updates(
        &self,
        queue: UpdateQueueHandle,
    ) -> Result<Vec<UpdateId>, UpdateQueueError> {
        let mut ids = Vec::new();
        let mut next = self.queue(queue)?.first_base_update;
        while let Some(id) = next {
            ids.push(id);
            next = self.update(id)?.next;
        }
        Ok(ids)
    }

    pub fn defer_collected_hidden_callbacks(
        &mut self,
        queue: UpdateQueueHandle,
    ) -> Result<(), UpdateQueueError> {
        let queue = self.queue_mut(queue)?;
        let mut visible_callbacks = Vec::new();
        for callback in queue.callbacks.drain(..) {
            if callback.hidden {
                queue.shared.hidden_callbacks.push(callback.callback);
            } else {
                visible_callbacks.push(callback);
            }
        }
        queue.callbacks = visible_callbacks;
        Ok(())
    }

    pub fn take_callbacks(
        &mut self,
        queue: UpdateQueueHandle,
    ) -> Result<Vec<CollectedRootUpdateCallback>, UpdateQueueError> {
        Ok(std::mem::take(&mut self.queue_mut(queue)?.callbacks))
    }

    pub fn take_hidden_callbacks(
        &mut self,
        queue: UpdateQueueHandle,
    ) -> Result<Vec<RootUpdateCallbackHandle>, UpdateQueueError> {
        Ok(std::mem::take(
            &mut self.queue_mut(queue)?.shared.hidden_callbacks,
        ))
    }

    pub fn process_host_root_update_queue(
        &mut self,
        queue: UpdateQueueHandle,
        current_queue: Option<UpdateQueueHandle>,
        render_lanes: Lanes,
        root_render_lanes: Lanes,
    ) -> Result<ProcessUpdateQueueResult, UpdateQueueError> {
        self.transfer_pending_to_base_queue(queue, current_queue)?;

        let first_base_update = self.queue(queue)?.first_base_update;
        let mut update = first_base_update;
        let mut new_state = self.queue(queue)?.base_state;
        let mut new_base_state = None;
        let mut new_first_base_update = None;
        let mut new_last_base_update = None;
        let mut new_lanes = Lanes::NO;
        let mut applied_update_count = 0;
        let mut skipped_update_count = 0;

        while let Some(update_id) = update {
            let original = *self.update(update_id)?;
            let update_lane = original.lane.remove_lane(Lane::OFFSCREEN);
            let is_hidden_update = update_lane != original.lane;
            let lane_scope = if is_hidden_update {
                root_render_lanes
            } else {
                render_lanes
            };
            let should_skip_update = !update_lane.is_subset_of(lane_scope);

            if should_skip_update {
                let clone = original.clone_with_lane_and_callback(update_lane, original.callback);
                let clone_id = self.insert_update(clone);
                if new_last_base_update.is_none() {
                    new_first_base_update = Some(clone_id);
                    new_base_state = Some(new_state);
                } else if let Some(last) = new_last_base_update {
                    self.update_mut(last)?.next = Some(clone_id);
                }
                new_last_base_update = Some(clone_id);
                new_lanes = new_lanes.merge(update_lane);
                skipped_update_count += 1;
            } else {
                if let Some(last) = new_last_base_update {
                    let clone = original
                        .clone_with_lane_and_callback(Lanes::NO, RootUpdateCallbackHandle::NONE);
                    let clone_id = self.insert_update(clone);
                    self.update_mut(last)?.next = Some(clone_id);
                    new_last_base_update = Some(clone_id);
                }

                new_state = apply_root_update(new_state, original);
                if original.callback.is_some() {
                    self.queue_mut(queue)?
                        .callbacks
                        .push(CollectedRootUpdateCallback {
                            callback: original.callback,
                            hidden: is_hidden_update,
                        });
                }
                applied_update_count += 1;
            }

            update = original.next;
            if update.is_none() {
                self.transfer_pending_to_base_queue(queue, None)?;
                update = self.update(update_id)?.next;
            }
        }

        if new_last_base_update.is_none() {
            new_base_state = Some(new_state);
        }

        let queue_ref = self.queue_mut(queue)?;
        queue_ref.base_state = new_base_state.expect("base state is set after processing");
        queue_ref.first_base_update = new_first_base_update;
        queue_ref.last_base_update = new_last_base_update;
        if queue_ref.first_base_update.is_none() {
            queue_ref.shared.lanes = Lanes::NO;
        }

        Ok(ProcessUpdateQueueResult {
            memoized_state: new_state,
            remaining_lanes: new_lanes,
            applied_update_count,
            skipped_update_count,
        })
    }

    fn transfer_pending_to_base_queue(
        &mut self,
        queue: UpdateQueueHandle,
        current_queue: Option<UpdateQueueHandle>,
    ) -> Result<(), UpdateQueueError> {
        let Some(last_pending_update) = self.queue(queue)?.shared.pending else {
            return Ok(());
        };
        self.queue_mut(queue)?.shared.pending = None;
        let first_pending_update = self.update(last_pending_update)?.next.ok_or(
            UpdateQueueError::MissingCircularNext {
                id: last_pending_update,
            },
        )?;
        self.update_mut(last_pending_update)?.next = None;
        self.append_linear_segment_to_base_queue(queue, first_pending_update, last_pending_update)?;

        if let Some(current_queue) = current_queue
            && current_queue != queue
            && self.queue(current_queue)?.last_base_update != Some(last_pending_update)
        {
            self.append_linear_segment_to_base_queue(
                current_queue,
                first_pending_update,
                last_pending_update,
            )?;
        }

        Ok(())
    }

    fn append_linear_segment_to_base_queue(
        &mut self,
        queue: UpdateQueueHandle,
        first: UpdateId,
        last: UpdateId,
    ) -> Result<(), UpdateQueueError> {
        let previous_last = self.queue(queue)?.last_base_update;
        if let Some(previous_last) = previous_last {
            self.update_mut(previous_last)?.next = Some(first);
        } else {
            self.queue_mut(queue)?.first_base_update = Some(first);
        }
        self.queue_mut(queue)?.last_base_update = Some(last);
        Ok(())
    }

    fn insert_update(&mut self, update: RootUpdate) -> UpdateId {
        let slot_index = self.vacant_updates.pop().unwrap_or_else(|| {
            let slot_index = self.updates.len();
            self.updates.push(UpdateSlot::vacant(0));
            slot_index
        });
        let generation = self.updates[slot_index].generation;
        let id = UpdateId::from_parts(slot_index, generation);
        self.updates[slot_index].update = Some(update);
        id
    }

    fn queue_index(&self, handle: UpdateQueueHandle) -> Result<usize, UpdateQueueError> {
        if handle.is_none() {
            return Err(UpdateQueueError::EmptyQueueHandle);
        }
        Ok((handle.raw() - 1) as usize)
    }

    fn validate_update_id(&self, id: UpdateId) -> Result<usize, UpdateQueueError> {
        let entry = self
            .updates
            .get(id.slot_index())
            .ok_or(UpdateQueueError::InvalidUpdateId { id })?;
        if entry.generation != id.generation() {
            return Err(UpdateQueueError::StaleUpdateId {
                id,
                current_generation: entry.generation,
            });
        }
        if entry.update.is_none() {
            return Err(UpdateQueueError::VacantUpdate { id });
        }
        Ok(id.slot_index())
    }
}

fn apply_root_update(prev_state: HostRootState, update: RootUpdate) -> HostRootState {
    match update.tag {
        UpdateTag::UpdateState | UpdateTag::CaptureUpdate => {
            update.payload.map_or(prev_state, |payload| {
                prev_state.with_element(payload.element())
            })
        }
        UpdateTag::ReplaceState => update.payload.map_or(prev_state, |payload| {
            HostRootState::client(payload.element(), prev_state.form_state())
        }),
        UpdateTag::ForceUpdate => prev_state,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::RootFormStateHandle;

    fn state(element: u64) -> HostRootState {
        HostRootState::client(
            RootElementHandle::from_raw(element),
            RootFormStateHandle::NONE,
        )
    }

    #[test]
    fn update_queue_appends_pending_updates_as_circular_ring() {
        let mut store = UpdateQueueStore::new();
        let queue = store.initialize_host_root_queue(state(0));
        let first = store.create_update(Lane::DEFAULT);
        let second = store.create_update(Lane::SYNC);

        store.append_pending_update(queue, first).unwrap();
        store.append_pending_update(queue, second).unwrap();

        assert_eq!(store.pending_updates(queue).unwrap(), vec![first, second]);
        assert_eq!(store.queue(queue).unwrap().shared().pending(), Some(second));
        assert_eq!(store.update(first).unwrap().next(), Some(second));
        assert_eq!(store.update(second).unwrap().next(), Some(first));
    }

    #[test]
    fn update_queue_transfers_pending_ring_to_base_queue() {
        let mut store = UpdateQueueStore::new();
        let queue = store.initialize_host_root_queue(state(0));
        let first = store.create_update(Lane::DEFAULT);
        let second = store.create_update(Lane::SYNC);
        store.append_pending_update(queue, first).unwrap();
        store.append_pending_update(queue, second).unwrap();

        let result = store
            .process_host_root_update_queue(queue, None, Lanes::SYNC_DEFAULT, Lanes::SYNC_DEFAULT)
            .unwrap();

        assert_eq!(result.applied_update_count(), 2);
        assert_eq!(
            store.pending_updates(queue).unwrap(),
            Vec::<UpdateId>::new()
        );
        assert_eq!(store.base_updates(queue).unwrap(), Vec::<UpdateId>::new());
    }

    #[test]
    fn update_queue_transfers_pending_segment_to_distinct_current_queue() {
        let mut store = UpdateQueueStore::new();
        let work_in_progress_queue = store.initialize_host_root_queue(state(0));
        let current_queue = store.initialize_host_root_queue(state(0));
        let update = update_with_element(&mut store, Lane::DEFAULT, 7);
        store
            .append_pending_update(work_in_progress_queue, update)
            .unwrap();

        let result = store
            .process_host_root_update_queue(
                work_in_progress_queue,
                Some(current_queue),
                Lanes::DEFAULT,
                Lanes::DEFAULT,
            )
            .unwrap();

        assert_eq!(
            result.memoized_state().element(),
            RootElementHandle::from_raw(7)
        );
        assert_eq!(
            store.base_updates(work_in_progress_queue).unwrap(),
            Vec::<UpdateId>::new()
        );
        assert_eq!(store.base_updates(current_queue).unwrap(), vec![update]);
    }

    #[test]
    fn update_queue_rebases_skipped_lanes_in_insertion_order() {
        let mut store = UpdateQueueStore::new();
        let queue = store.initialize_host_root_queue(state(0));
        let a1 = update_with_element(&mut store, Lane::SYNC, 1);
        let b2 = update_with_element(&mut store, Lane::DEFAULT, 2);
        let c1 = update_with_element(&mut store, Lane::SYNC, 3);
        let d2 = update_with_element(&mut store, Lane::DEFAULT, 4);
        for update in [a1, b2, c1, d2] {
            store.append_pending_update(queue, update).unwrap();
        }

        let sync_result = store
            .process_host_root_update_queue(queue, None, Lanes::SYNC, Lanes::SYNC)
            .unwrap();
        let rebased = store.base_updates(queue).unwrap();

        assert_eq!(
            sync_result.memoized_state().element(),
            RootElementHandle::from_raw(3)
        );
        assert_eq!(sync_result.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(sync_result.applied_update_count(), 2);
        assert_eq!(sync_result.skipped_update_count(), 2);
        assert_eq!(rebased.len(), 3);
        assert_eq!(store.update(rebased[0]).unwrap().lane(), Lanes::DEFAULT);
        assert_eq!(store.update(rebased[1]).unwrap().lane(), Lanes::NO);
        assert_eq!(store.update(rebased[2]).unwrap().lane(), Lanes::DEFAULT);

        let default_result = store
            .process_host_root_update_queue(queue, None, Lanes::DEFAULT, Lanes::DEFAULT)
            .unwrap();
        assert_eq!(
            default_result.memoized_state().element(),
            RootElementHandle::from_raw(4)
        );
        assert_eq!(store.base_updates(queue).unwrap(), Vec::<UpdateId>::new());
    }

    #[test]
    fn update_queue_preserves_skipped_callbacks_but_drops_no_lane_clone_callbacks() {
        let mut store = UpdateQueueStore::new();
        let queue = store.initialize_host_root_queue(state(0));
        let skipped = update_with_element(&mut store, Lane::DEFAULT, 1);
        let applied_after_skip = update_with_element(&mut store, Lane::SYNC, 2);
        store
            .update_mut(skipped)
            .unwrap()
            .set_callback(RootUpdateCallbackHandle::from_raw(10));
        store
            .update_mut(applied_after_skip)
            .unwrap()
            .set_callback(RootUpdateCallbackHandle::from_raw(11));
        store.append_pending_update(queue, skipped).unwrap();
        store
            .append_pending_update(queue, applied_after_skip)
            .unwrap();

        store
            .process_host_root_update_queue(queue, None, Lanes::SYNC, Lanes::SYNC)
            .unwrap();
        let rebased = store.base_updates(queue).unwrap();
        let callbacks = store.queue(queue).unwrap().callbacks();

        assert_eq!(callbacks.len(), 1);
        assert_eq!(
            callbacks[0].callback(),
            RootUpdateCallbackHandle::from_raw(11)
        );
        assert_eq!(
            store.update(rebased[0]).unwrap().callback(),
            RootUpdateCallbackHandle::from_raw(10)
        );
        assert_eq!(
            store.update(rebased[1]).unwrap().callback(),
            RootUpdateCallbackHandle::NONE
        );
    }

    #[test]
    fn update_queue_strips_offscreen_lane_when_testing_hidden_update_priority() {
        let mut store = UpdateQueueStore::new();
        let queue = store.initialize_host_root_queue(state(0));
        let hidden = update_with_element(&mut store, Lane::DEFAULT, 1);
        store.mark_update_hidden(hidden).unwrap();
        store.append_pending_update(queue, hidden).unwrap();

        let skipped = store
            .process_host_root_update_queue(queue, None, Lanes::DEFAULT, Lanes::NO)
            .unwrap();
        assert_eq!(skipped.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(skipped.skipped_update_count(), 1);

        let applied = store
            .process_host_root_update_queue(queue, None, Lanes::NO, Lanes::DEFAULT)
            .unwrap();
        assert_eq!(applied.skipped_update_count(), 1);

        let applied = store
            .process_host_root_update_queue(queue, None, Lanes::DEFAULT, Lanes::DEFAULT)
            .unwrap();
        assert_eq!(
            applied.memoized_state().element(),
            RootElementHandle::from_raw(1)
        );
    }

    #[test]
    fn update_queue_can_defer_hidden_callbacks_without_invoking_them() {
        let mut store = UpdateQueueStore::new();
        let queue = store.initialize_host_root_queue(state(0));
        let hidden = update_with_element(&mut store, Lane::DEFAULT, 1);
        let callback = RootUpdateCallbackHandle::from_raw(99);
        store.update_mut(hidden).unwrap().set_callback(callback);
        store.mark_update_hidden(hidden).unwrap();
        store.append_pending_update(queue, hidden).unwrap();

        store
            .process_host_root_update_queue(queue, None, Lanes::DEFAULT, Lanes::DEFAULT)
            .unwrap();
        assert_eq!(store.queue(queue).unwrap().callbacks().len(), 1);

        store.defer_collected_hidden_callbacks(queue).unwrap();

        assert!(store.queue(queue).unwrap().callbacks().is_empty());
        assert_eq!(
            store.queue(queue).unwrap().shared().hidden_callbacks(),
            &[callback]
        );
        assert_eq!(store.take_hidden_callbacks(queue).unwrap(), vec![callback]);
    }

    #[test]
    fn update_queue_entangles_transition_lanes_through_shared_queue() {
        let mut store = UpdateQueueStore::new();
        let queue = store.initialize_host_root_queue(state(0));

        assert_eq!(
            store
                .entangle_transition_update(
                    queue,
                    Lanes::from(Lane::TRANSITION_1),
                    Lane::TRANSITION_1
                )
                .unwrap(),
            Some(Lanes::from(Lane::TRANSITION_1))
        );
        let entangled = store
            .entangle_transition_update(queue, Lanes::from(Lane::TRANSITION_1), Lane::TRANSITION_2)
            .unwrap();

        assert_eq!(
            entangled,
            Some(Lanes::from(Lane::TRANSITION_1).merge_lane(Lane::TRANSITION_2))
        );
        assert_eq!(
            store.queue(queue).unwrap().shared().lanes(),
            Lanes::from(Lane::TRANSITION_1).merge_lane(Lane::TRANSITION_2)
        );
    }

    fn update_with_element(store: &mut UpdateQueueStore, lane: Lane, element: u64) -> UpdateId {
        let update = store.create_update(lane);
        store
            .update_mut(update)
            .unwrap()
            .set_payload(RootUpdatePayload::new(RootElementHandle::from_raw(element)));
        update
    }
}
