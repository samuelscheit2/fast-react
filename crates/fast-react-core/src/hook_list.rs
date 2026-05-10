//! Ordered function-component hook list storage.
//!
//! React stores hooks as an ordered linked list on a function component fiber.
//! This module models that list shape as pure core data: stable arena-scoped
//! IDs, renderer-agnostic payload metadata, append helpers for mount, and
//! fail-closed update traversal that clones current slots into a fresh work
//! list.

use std::collections::HashSet;
use std::error::Error;
use std::fmt::{self, Display, Formatter};
use std::sync::atomic::{AtomicU64, Ordering};

use crate::{FiberId, HookEffectId, HookQueueId, HookUpdateId, StateHandle};

static NEXT_HOOK_LIST_ARENA_ID: AtomicU64 = AtomicU64::new(1);

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HookListArenaId(u64);

impl HookListArenaId {
    #[must_use]
    pub const fn new(raw: u64) -> Option<Self> {
        if raw == 0 { None } else { Some(Self(raw)) }
    }

    #[must_use]
    pub const fn get(self) -> u64 {
        self.0
    }

    #[must_use]
    fn allocate() -> Self {
        let raw = NEXT_HOOK_LIST_ARENA_ID.fetch_add(1, Ordering::Relaxed);
        assert_ne!(raw, 0, "hook list arena id counter wrapped");
        Self(raw)
    }
}

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HookListSlot(usize);

impl HookListSlot {
    #[must_use]
    pub const fn new(index: usize) -> Self {
        Self(index)
    }

    #[must_use]
    pub const fn get(self) -> usize {
        self.0
    }
}

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HookListGeneration(u64);

impl HookListGeneration {
    pub const INITIAL: Self = Self(0);

    #[must_use]
    pub const fn new(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub const fn get(self) -> u64 {
        self.0
    }

    #[must_use]
    const fn next(self) -> Option<Self> {
        match self.0.checked_add(1) {
            Some(next) => Some(Self(next)),
            None => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HookListId {
    arena_id: HookListArenaId,
    slot: HookListSlot,
    generation: HookListGeneration,
}

impl HookListId {
    #[must_use]
    pub const fn new(
        arena_id: HookListArenaId,
        slot: HookListSlot,
        generation: HookListGeneration,
    ) -> Self {
        Self {
            arena_id,
            slot,
            generation,
        }
    }

    #[must_use]
    pub const fn arena_id(self) -> HookListArenaId {
        self.arena_id
    }

    #[must_use]
    pub const fn slot(self) -> HookListSlot {
        self.slot
    }

    #[must_use]
    pub const fn generation(self) -> HookListGeneration {
        self.generation
    }

    pub fn validate_arena(self, expected: HookListArenaId) -> Result<(), HookListError> {
        if self.arena_id == expected {
            Ok(())
        } else {
            Err(HookListError::WrongArena {
                expected,
                actual: self.arena_id,
            })
        }
    }
}

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HookSlotIndex(usize);

impl HookSlotIndex {
    #[must_use]
    pub const fn new(index: usize) -> Self {
        Self(index)
    }

    #[must_use]
    pub const fn get(self) -> usize {
        self.0
    }
}

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HookSlotGeneration(u64);

impl HookSlotGeneration {
    pub const INITIAL: Self = Self(0);

    #[must_use]
    pub const fn new(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub const fn get(self) -> u64 {
        self.0
    }

    #[must_use]
    const fn next(self) -> Option<Self> {
        match self.0.checked_add(1) {
            Some(next) => Some(Self(next)),
            None => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HookSlotId {
    arena_id: HookListArenaId,
    slot: HookSlotIndex,
    generation: HookSlotGeneration,
}

impl HookSlotId {
    #[must_use]
    pub const fn new(
        arena_id: HookListArenaId,
        slot: HookSlotIndex,
        generation: HookSlotGeneration,
    ) -> Self {
        Self {
            arena_id,
            slot,
            generation,
        }
    }

    #[must_use]
    pub const fn arena_id(self) -> HookListArenaId {
        self.arena_id
    }

    #[must_use]
    pub const fn slot(self) -> HookSlotIndex {
        self.slot
    }

    #[must_use]
    pub const fn generation(self) -> HookSlotGeneration {
        self.generation
    }

    pub fn validate_arena(self, expected: HookListArenaId) -> Result<(), HookListError> {
        if self.arena_id == expected {
            Ok(())
        } else {
            Err(HookListError::WrongArena {
                expected,
                actual: self.arena_id,
            })
        }
    }
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HookSlotPayload {
    #[default]
    Empty,
    Opaque(HookOpaquePayload),
    State(HookStatePayload),
    Effect(HookEffectPayload),
}

impl HookSlotPayload {
    #[must_use]
    pub const fn opaque(memoized_state: StateHandle) -> Self {
        Self::Opaque(HookOpaquePayload { memoized_state })
    }

    #[must_use]
    pub const fn state(payload: HookStatePayload) -> Self {
        Self::State(payload)
    }

    #[must_use]
    pub const fn effect(payload: HookEffectPayload) -> Self {
        Self::Effect(payload)
    }

    #[must_use]
    pub const fn state_payload(self) -> Option<HookStatePayload> {
        match self {
            Self::State(payload) => Some(payload),
            Self::Empty | Self::Opaque(_) | Self::Effect(_) => None,
        }
    }

    #[must_use]
    pub const fn effect_payload(self) -> Option<HookEffectPayload> {
        match self {
            Self::Effect(payload) => Some(payload),
            Self::Empty | Self::Opaque(_) | Self::State(_) => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HookOpaquePayload {
    memoized_state: StateHandle,
}

impl HookOpaquePayload {
    #[must_use]
    pub const fn new(memoized_state: StateHandle) -> Self {
        Self { memoized_state }
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        self.memoized_state
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HookStatePayload {
    memoized_state: StateHandle,
    base_state: StateHandle,
    base_queue: Option<HookUpdateId>,
    queue: HookQueueId,
}

impl HookStatePayload {
    #[must_use]
    pub const fn new(
        memoized_state: StateHandle,
        base_state: StateHandle,
        base_queue: Option<HookUpdateId>,
        queue: HookQueueId,
    ) -> Self {
        Self {
            memoized_state,
            base_state,
            base_queue,
            queue,
        }
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
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HookEffectPayload {
    effect: HookEffectId,
}

impl HookEffectPayload {
    #[must_use]
    pub const fn new(effect: HookEffectId) -> Self {
        Self { effect }
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookList {
    id: HookListId,
    owner: FiberId,
    first: Option<HookSlotId>,
    last: Option<HookSlotId>,
    len: usize,
}

impl HookList {
    #[must_use]
    const fn new(id: HookListId, owner: FiberId) -> Self {
        Self {
            id,
            owner,
            first: None,
            last: None,
            len: 0,
        }
    }

    #[must_use]
    pub const fn id(&self) -> HookListId {
        self.id
    }

    #[must_use]
    pub const fn owner(&self) -> FiberId {
        self.owner
    }

    #[must_use]
    pub const fn first(&self) -> Option<HookSlotId> {
        self.first
    }

    #[must_use]
    pub const fn last(&self) -> Option<HookSlotId> {
        self.last
    }

    #[must_use]
    pub const fn len(&self) -> usize {
        self.len
    }

    #[must_use]
    pub const fn is_empty(&self) -> bool {
        self.len == 0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookSlot {
    id: HookSlotId,
    list: HookListId,
    index: usize,
    payload: HookSlotPayload,
    next: Option<HookSlotId>,
}

impl HookSlot {
    #[must_use]
    const fn new(id: HookSlotId, list: HookListId, index: usize, payload: HookSlotPayload) -> Self {
        Self {
            id,
            list,
            index,
            payload,
            next: None,
        }
    }

    #[must_use]
    pub const fn id(&self) -> HookSlotId {
        self.id
    }

    #[must_use]
    pub const fn list(&self) -> HookListId {
        self.list
    }

    #[must_use]
    pub const fn index(&self) -> usize {
        self.index
    }

    #[must_use]
    pub const fn payload(&self) -> HookSlotPayload {
        self.payload
    }

    #[must_use]
    pub const fn next(&self) -> Option<HookSlotId> {
        self.next
    }

    pub fn set_payload(&mut self, payload: HookSlotPayload) {
        self.payload = payload;
    }
}

#[derive(Debug, Clone)]
struct HookListEntry {
    generation: HookListGeneration,
    list: Option<HookList>,
}

impl HookListEntry {
    const fn vacant(generation: HookListGeneration) -> Self {
        Self {
            generation,
            list: None,
        }
    }
}

#[derive(Debug, Clone)]
struct HookSlotEntry {
    generation: HookSlotGeneration,
    hook: Option<HookSlot>,
}

impl HookSlotEntry {
    const fn vacant(generation: HookSlotGeneration) -> Self {
        Self {
            generation,
            hook: None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct HookListArena {
    arena_id: HookListArenaId,
    lists: Vec<HookListEntry>,
    vacant_lists: Vec<HookListSlot>,
    hooks: Vec<HookSlotEntry>,
    vacant_hooks: Vec<HookSlotIndex>,
}

impl HookListArena {
    #[must_use]
    pub fn new() -> Self {
        Self {
            arena_id: HookListArenaId::allocate(),
            lists: Vec::new(),
            vacant_lists: Vec::new(),
            hooks: Vec::new(),
            vacant_hooks: Vec::new(),
        }
    }

    #[must_use]
    pub const fn arena_id(&self) -> HookListArenaId {
        self.arena_id
    }

    #[must_use]
    pub fn list_len(&self) -> usize {
        self.lists
            .iter()
            .filter(|entry| entry.list.is_some())
            .count()
    }

    #[must_use]
    pub fn hook_len(&self) -> usize {
        self.hooks
            .iter()
            .filter(|entry| entry.hook.is_some())
            .count()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.list_len() == 0 && self.hook_len() == 0
    }

    pub fn create_list(&mut self, owner: FiberId) -> HookListId {
        let slot = self.vacant_lists.pop().unwrap_or_else(|| {
            let slot = HookListSlot::new(self.lists.len());
            self.lists
                .push(HookListEntry::vacant(HookListGeneration::INITIAL));
            slot
        });
        let generation = self.lists[slot.get()].generation;
        let id = HookListId::new(self.arena_id, slot, generation);
        self.lists[slot.get()].list = Some(HookList::new(id, owner));
        id
    }

    pub fn list(&self, id: HookListId) -> Result<&HookList, HookListError> {
        let index = self.validate_list_id(id)?;
        Ok(self.lists[index]
            .list
            .as_ref()
            .expect("validated hook list slot is occupied"))
    }

    pub fn hook(&self, id: HookSlotId) -> Result<&HookSlot, HookListError> {
        let index = self.validate_hook_id(id)?;
        Ok(self.hooks[index]
            .hook
            .as_ref()
            .expect("validated hook slot is occupied"))
    }

    pub fn hook_mut(&mut self, id: HookSlotId) -> Result<&mut HookSlot, HookListError> {
        let index = self.validate_hook_id(id)?;
        Ok(self.hooks[index]
            .hook
            .as_mut()
            .expect("validated hook slot is occupied"))
    }

    pub fn set_hook_payload(
        &mut self,
        id: HookSlotId,
        payload: HookSlotPayload,
    ) -> Result<(), HookListError> {
        self.hook_mut(id)?.set_payload(payload);
        Ok(())
    }

    pub fn ordered_hooks(&self, list: HookListId) -> Result<Vec<HookSlotId>, HookListError> {
        self.collect_list_hooks(list)
    }

    pub fn append_hook(
        &mut self,
        list: HookListId,
        payload: HookSlotPayload,
    ) -> Result<HookSlotId, HookListError> {
        self.validate_list_links(list)?;
        self.append_hook_unchecked(list, payload)
    }

    pub fn begin_mount(&self, list: HookListId) -> Result<HookListMountCursor, HookListError> {
        self.validate_list_links(list)?;
        if !self.list(list)?.is_empty() {
            return Err(HookListError::MountListNotEmpty { list });
        }
        Ok(HookListMountCursor { list, appended: 0 })
    }

    pub fn mount_hook(
        &mut self,
        cursor: &mut HookListMountCursor,
        payload: HookSlotPayload,
    ) -> Result<HookSlotId, HookListError> {
        let actual_len = self.list(cursor.list)?.len();
        if actual_len != cursor.appended {
            return Err(HookListError::TraversalCursorOutOfSync {
                list: cursor.list,
                expected_len: cursor.appended,
                actual_len,
            });
        }
        let hook = self.append_hook(cursor.list, payload)?;
        cursor.appended += 1;
        Ok(hook)
    }

    pub fn finish_mount(
        &self,
        cursor: HookListMountCursor,
    ) -> Result<HookListTraversalResult, HookListError> {
        self.validate_list_links(cursor.list)?;
        let actual_len = self.list(cursor.list)?.len();
        if actual_len != cursor.appended {
            return Err(HookListError::TraversalCursorOutOfSync {
                list: cursor.list,
                expected_len: cursor.appended,
                actual_len,
            });
        }
        Ok(HookListTraversalResult {
            list: cursor.list,
            traversed_count: cursor.appended,
        })
    }

    pub fn begin_update(
        &self,
        current_list: HookListId,
        work_in_progress_list: HookListId,
    ) -> Result<HookListUpdateCursor, HookListError> {
        self.validate_list_links(current_list)?;
        self.validate_list_links(work_in_progress_list)?;

        let current = self.list(current_list)?;
        let work_in_progress = self.list(work_in_progress_list)?;
        if current.owner() != work_in_progress.owner() {
            return Err(HookListError::ListOwnerMismatch {
                current_list,
                work_in_progress_list,
                current_owner: current.owner(),
                work_in_progress_owner: work_in_progress.owner(),
            });
        }
        if !work_in_progress.is_empty() {
            return Err(HookListError::WorkInProgressListNotEmpty {
                list: work_in_progress_list,
            });
        }

        Ok(HookListUpdateCursor {
            current_list,
            work_in_progress_list,
            next_current: current.first(),
            consumed: 0,
            expected_count: current.len(),
        })
    }

    pub fn update_hook(
        &mut self,
        cursor: &mut HookListUpdateCursor,
    ) -> Result<HookSlotId, HookListError> {
        self.ensure_update_cursor_lists_unchanged(cursor)?;
        let current_hook =
            cursor
                .next_current
                .ok_or(HookListError::RenderedMoreHooksThanPreviousRender {
                    current_list: cursor.current_list,
                    work_in_progress_list: cursor.work_in_progress_list,
                    attempted_index: cursor.consumed,
                })?;

        let current = self.hook(current_hook)?.clone();
        self.ensure_hook_belongs_to_list(current_hook, cursor.current_list)?;
        if let Some(next) = current.next() {
            self.ensure_hook_belongs_to_list(next, cursor.current_list)?;
        }

        let cloned = self.append_hook(cursor.work_in_progress_list, current.payload())?;
        cursor.next_current = current.next();
        cursor.consumed += 1;
        Ok(cloned)
    }

    pub fn finish_update(
        &self,
        cursor: HookListUpdateCursor,
    ) -> Result<HookListTraversalResult, HookListError> {
        self.ensure_update_cursor_lists_unchanged(&cursor)?;
        if let Some(next_current) = cursor.next_current {
            return Err(HookListError::RenderedFewerHooksThanExpected {
                current_list: cursor.current_list,
                work_in_progress_list: cursor.work_in_progress_list,
                next_unvisited: next_current,
                remaining: cursor.expected_count - cursor.consumed,
            });
        }
        Ok(HookListTraversalResult {
            list: cursor.work_in_progress_list,
            traversed_count: cursor.consumed,
        })
    }

    pub fn discard_list(&mut self, list: HookListId) -> Result<(), HookListError> {
        let hooks = self.collect_list_hooks(list)?;
        for hook in hooks {
            let hook_index = self.validate_hook_id(hook)?;
            let next_generation = self.hooks[hook_index]
                .generation
                .next()
                .ok_or(HookListError::GenerationOverflow)?;
            self.hooks[hook_index].hook = None;
            self.hooks[hook_index].generation = next_generation;
            self.vacant_hooks.push(hook.slot());
        }

        let list_index = self.validate_list_id(list)?;
        let next_generation = self.lists[list_index]
            .generation
            .next()
            .ok_or(HookListError::GenerationOverflow)?;
        self.lists[list_index].list = None;
        self.lists[list_index].generation = next_generation;
        self.vacant_lists.push(list.slot());
        Ok(())
    }

    fn append_hook_unchecked(
        &mut self,
        list: HookListId,
        payload: HookSlotPayload,
    ) -> Result<HookSlotId, HookListError> {
        let list_index = self.validate_list_id(list)?;
        let (last, hook_index_in_list) = {
            let list_record = self.lists[list_index]
                .list
                .as_ref()
                .expect("validated hook list slot is occupied");
            (list_record.last, list_record.len)
        };

        let slot = self.vacant_hooks.pop().unwrap_or_else(|| {
            let slot = HookSlotIndex::new(self.hooks.len());
            self.hooks
                .push(HookSlotEntry::vacant(HookSlotGeneration::INITIAL));
            slot
        });
        let generation = self.hooks[slot.get()].generation;
        let id = HookSlotId::new(self.arena_id, slot, generation);
        self.hooks[slot.get()].hook = Some(HookSlot::new(id, list, hook_index_in_list, payload));

        if let Some(last) = last {
            self.hook_mut(last)?.next = Some(id);
        } else {
            self.lists[list_index]
                .list
                .as_mut()
                .expect("validated hook list slot is occupied")
                .first = Some(id);
        }

        let list_record = self.lists[list_index]
            .list
            .as_mut()
            .expect("validated hook list slot is occupied");
        list_record.last = Some(id);
        list_record.len += 1;

        Ok(id)
    }

    fn validate_list_id(&self, id: HookListId) -> Result<usize, HookListError> {
        id.validate_arena(self.arena_id)?;
        let entry = self
            .lists
            .get(id.slot().get())
            .ok_or(HookListError::InvalidListSlot {
                arena_id: self.arena_id,
                slot: id.slot(),
            })?;

        if entry.generation != id.generation() {
            return Err(HookListError::StaleListGeneration {
                id,
                current_generation: entry.generation,
            });
        }
        if entry.list.is_none() {
            return Err(HookListError::VacantListSlot { id });
        }
        Ok(id.slot().get())
    }

    fn validate_hook_id(&self, id: HookSlotId) -> Result<usize, HookListError> {
        id.validate_arena(self.arena_id)?;
        let entry = self
            .hooks
            .get(id.slot().get())
            .ok_or(HookListError::InvalidHookSlot {
                arena_id: self.arena_id,
                slot: id.slot(),
            })?;

        if entry.generation != id.generation() {
            return Err(HookListError::StaleHookGeneration {
                id,
                current_generation: entry.generation,
            });
        }
        if entry.hook.is_none() {
            return Err(HookListError::VacantHookSlot { id });
        }
        Ok(id.slot().get())
    }

    fn ensure_hook_belongs_to_list(
        &self,
        hook: HookSlotId,
        list: HookListId,
    ) -> Result<(), HookListError> {
        let actual = self.hook(hook)?.list();
        if actual == list {
            Ok(())
        } else {
            Err(HookListError::WrongHookListOwner {
                hook,
                expected: list,
                actual,
            })
        }
    }

    fn collect_list_hooks(&self, list: HookListId) -> Result<Vec<HookSlotId>, HookListError> {
        self.validate_list_id(list)?;
        let list_record = self.list(list)?;
        if list_record.is_empty() {
            if list_record.first().is_none() && list_record.last().is_none() {
                return Ok(Vec::new());
            }
            return Err(HookListError::EmptyListHasLinks { list });
        }
        let Some(first) = list_record.first() else {
            return Err(HookListError::NonEmptyListMissingHead { list });
        };
        let Some(expected_last) = list_record.last() else {
            return Err(HookListError::NonEmptyListMissingTail { list });
        };

        let mut hooks = Vec::with_capacity(list_record.len());
        let mut seen = HashSet::new();
        let mut next = Some(first);

        while let Some(hook_id) = next {
            self.ensure_hook_belongs_to_list(hook_id, list)?;
            if !seen.insert(hook_id) {
                return Err(HookListError::RepeatedHookSlot {
                    list,
                    repeated: hook_id,
                });
            }
            if hooks.len() >= list_record.len() {
                return Err(HookListError::HookListLengthMismatch {
                    list,
                    expected: list_record.len(),
                    actual: hooks.len() + 1,
                });
            }

            let hook = self.hook(hook_id)?;
            next = hook.next();
            hooks.push(hook_id);
        }

        if hooks.len() != list_record.len() {
            return Err(HookListError::HookListLengthMismatch {
                list,
                expected: list_record.len(),
                actual: hooks.len(),
            });
        }
        let actual_last = hooks.last().copied();
        if actual_last != Some(expected_last) {
            return Err(HookListError::HookListTailMismatch {
                list,
                expected: expected_last,
                actual: actual_last,
            });
        }
        Ok(hooks)
    }

    fn validate_list_links(&self, list: HookListId) -> Result<(), HookListError> {
        self.collect_list_hooks(list).map(|_| ())
    }

    fn ensure_update_cursor_lists_unchanged(
        &self,
        cursor: &HookListUpdateCursor,
    ) -> Result<(), HookListError> {
        self.validate_list_links(cursor.current_list)?;
        self.validate_list_links(cursor.work_in_progress_list)?;
        let current = self.list(cursor.current_list)?;
        let work_in_progress = self.list(cursor.work_in_progress_list)?;
        if current.owner() != work_in_progress.owner() {
            return Err(HookListError::ListOwnerMismatch {
                current_list: cursor.current_list,
                work_in_progress_list: cursor.work_in_progress_list,
                current_owner: current.owner(),
                work_in_progress_owner: work_in_progress.owner(),
            });
        }
        if current.len() != cursor.expected_count {
            return Err(HookListError::TraversalCursorOutOfSync {
                list: cursor.current_list,
                expected_len: cursor.expected_count,
                actual_len: current.len(),
            });
        }
        if work_in_progress.len() != cursor.consumed {
            return Err(HookListError::TraversalCursorOutOfSync {
                list: cursor.work_in_progress_list,
                expected_len: cursor.consumed,
                actual_len: work_in_progress.len(),
            });
        }
        Ok(())
    }
}

impl Default for HookListArena {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HookListMountCursor {
    list: HookListId,
    appended: usize,
}

impl HookListMountCursor {
    #[must_use]
    pub const fn list(self) -> HookListId {
        self.list
    }

    #[must_use]
    pub const fn appended(self) -> usize {
        self.appended
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HookListUpdateCursor {
    current_list: HookListId,
    work_in_progress_list: HookListId,
    next_current: Option<HookSlotId>,
    consumed: usize,
    expected_count: usize,
}

impl HookListUpdateCursor {
    #[must_use]
    pub const fn current_list(self) -> HookListId {
        self.current_list
    }

    #[must_use]
    pub const fn work_in_progress_list(self) -> HookListId {
        self.work_in_progress_list
    }

    #[must_use]
    pub const fn next_current(self) -> Option<HookSlotId> {
        self.next_current
    }

    #[must_use]
    pub const fn consumed(self) -> usize {
        self.consumed
    }

    #[must_use]
    pub const fn expected_count(self) -> usize {
        self.expected_count
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HookListTraversalResult {
    list: HookListId,
    traversed_count: usize,
}

impl HookListTraversalResult {
    #[must_use]
    pub const fn list(self) -> HookListId {
        self.list
    }

    #[must_use]
    pub const fn traversed_count(self) -> usize {
        self.traversed_count
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HookListError {
    WrongArena {
        expected: HookListArenaId,
        actual: HookListArenaId,
    },
    InvalidListSlot {
        arena_id: HookListArenaId,
        slot: HookListSlot,
    },
    StaleListGeneration {
        id: HookListId,
        current_generation: HookListGeneration,
    },
    VacantListSlot {
        id: HookListId,
    },
    InvalidHookSlot {
        arena_id: HookListArenaId,
        slot: HookSlotIndex,
    },
    StaleHookGeneration {
        id: HookSlotId,
        current_generation: HookSlotGeneration,
    },
    VacantHookSlot {
        id: HookSlotId,
    },
    WrongHookListOwner {
        hook: HookSlotId,
        expected: HookListId,
        actual: HookListId,
    },
    ListOwnerMismatch {
        current_list: HookListId,
        work_in_progress_list: HookListId,
        current_owner: FiberId,
        work_in_progress_owner: FiberId,
    },
    MountListNotEmpty {
        list: HookListId,
    },
    WorkInProgressListNotEmpty {
        list: HookListId,
    },
    RenderedMoreHooksThanPreviousRender {
        current_list: HookListId,
        work_in_progress_list: HookListId,
        attempted_index: usize,
    },
    RenderedFewerHooksThanExpected {
        current_list: HookListId,
        work_in_progress_list: HookListId,
        next_unvisited: HookSlotId,
        remaining: usize,
    },
    TraversalCursorOutOfSync {
        list: HookListId,
        expected_len: usize,
        actual_len: usize,
    },
    EmptyListHasLinks {
        list: HookListId,
    },
    NonEmptyListMissingHead {
        list: HookListId,
    },
    NonEmptyListMissingTail {
        list: HookListId,
    },
    RepeatedHookSlot {
        list: HookListId,
        repeated: HookSlotId,
    },
    HookListLengthMismatch {
        list: HookListId,
        expected: usize,
        actual: usize,
    },
    HookListTailMismatch {
        list: HookListId,
        expected: HookSlotId,
        actual: Option<HookSlotId>,
    },
    GenerationOverflow,
}

impl Display for HookListError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::WrongArena { expected, actual } => write!(
                formatter,
                "hook list id belongs to arena {}, expected arena {}",
                actual.get(),
                expected.get()
            ),
            Self::InvalidListSlot { arena_id, slot } => write!(
                formatter,
                "hook list slot {} is outside arena {}",
                slot.get(),
                arena_id.get()
            ),
            Self::StaleListGeneration {
                id,
                current_generation,
            } => write!(
                formatter,
                "hook list slot {} has stale generation {}, current generation is {}",
                id.slot().get(),
                id.generation().get(),
                current_generation.get()
            ),
            Self::VacantListSlot { id } => write!(
                formatter,
                "hook list slot {} in arena {} is vacant",
                id.slot().get(),
                id.arena_id().get()
            ),
            Self::InvalidHookSlot { arena_id, slot } => write!(
                formatter,
                "hook slot {} is outside arena {}",
                slot.get(),
                arena_id.get()
            ),
            Self::StaleHookGeneration {
                id,
                current_generation,
            } => write!(
                formatter,
                "hook slot {} has stale generation {}, current generation is {}",
                id.slot().get(),
                id.generation().get(),
                current_generation.get()
            ),
            Self::VacantHookSlot { id } => write!(
                formatter,
                "hook slot {} in arena {} is vacant",
                id.slot().get(),
                id.arena_id().get()
            ),
            Self::WrongHookListOwner {
                hook,
                expected,
                actual,
            } => write!(
                formatter,
                "hook slot {} belongs to hook list slot {}, expected hook list slot {}",
                hook.slot().get(),
                actual.slot().get(),
                expected.slot().get()
            ),
            Self::ListOwnerMismatch {
                current_list,
                work_in_progress_list,
                current_owner,
                work_in_progress_owner,
            } => write!(
                formatter,
                "hook list owner mismatch between current list slot {} owned by fiber slot {} and work-in-progress list slot {} owned by fiber slot {}",
                current_list.slot().get(),
                current_owner.slot().get(),
                work_in_progress_list.slot().get(),
                work_in_progress_owner.slot().get()
            ),
            Self::MountListNotEmpty { list } => write!(
                formatter,
                "hook list slot {} is not empty at mount traversal start",
                list.slot().get()
            ),
            Self::WorkInProgressListNotEmpty { list } => write!(
                formatter,
                "hook list slot {} must be empty before update traversal",
                list.slot().get()
            ),
            Self::RenderedMoreHooksThanPreviousRender {
                current_list,
                work_in_progress_list,
                attempted_index,
            } => write!(
                formatter,
                "rendered more hooks than previous render while cloning current list slot {} into work-in-progress list slot {} at hook index {}",
                current_list.slot().get(),
                work_in_progress_list.slot().get(),
                attempted_index
            ),
            Self::RenderedFewerHooksThanExpected {
                current_list,
                work_in_progress_list,
                next_unvisited,
                remaining,
            } => write!(
                formatter,
                "rendered fewer hooks than expected while cloning current list slot {} into work-in-progress list slot {}; next unvisited hook slot {} with {} remaining",
                current_list.slot().get(),
                work_in_progress_list.slot().get(),
                next_unvisited.slot().get(),
                remaining
            ),
            Self::TraversalCursorOutOfSync {
                list,
                expected_len,
                actual_len,
            } => write!(
                formatter,
                "hook traversal cursor for list slot {} expected length {}, actual length is {}",
                list.slot().get(),
                expected_len,
                actual_len
            ),
            Self::EmptyListHasLinks { list } => write!(
                formatter,
                "empty hook list slot {} still has first or last links",
                list.slot().get()
            ),
            Self::NonEmptyListMissingHead { list } => write!(
                formatter,
                "non-empty hook list slot {} is missing first link",
                list.slot().get()
            ),
            Self::NonEmptyListMissingTail { list } => write!(
                formatter,
                "non-empty hook list slot {} is missing tail link",
                list.slot().get()
            ),
            Self::RepeatedHookSlot { list, repeated } => write!(
                formatter,
                "hook list slot {} repeats hook slot {} before terminating",
                list.slot().get(),
                repeated.slot().get()
            ),
            Self::HookListLengthMismatch {
                list,
                expected,
                actual,
            } => write!(
                formatter,
                "hook list slot {} expected {} hook slots but traversed {}",
                list.slot().get(),
                expected,
                actual
            ),
            Self::HookListTailMismatch {
                list,
                expected,
                actual,
            } => write!(
                formatter,
                "hook list slot {} expected tail hook slot {}, actual tail is {}",
                list.slot().get(),
                expected.slot().get(),
                actual.map_or_else(|| "none".to_string(), |id| id.slot().get().to_string())
            ),
            Self::GenerationOverflow => formatter.write_str("hook list generation overflowed"),
        }
    }
}

impl Error for HookListError {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        FiberArena, FiberMode, FiberTag, HookEffectArena, HookEffectCallbackHandle,
        HookEffectDependencies, HookEffectFlags, HookEffectRing, HookQueueStore, HookUpdateLane,
        Lane, PropsHandle,
    };

    fn owner() -> FiberId {
        let mut fibers = FiberArena::new();
        fibers.create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        )
    }

    fn owners() -> (FiberId, FiberId) {
        let mut fibers = FiberArena::new();
        let first = fibers.create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let second = fibers.create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        (first, second)
    }

    fn opaque(raw: u64) -> HookSlotPayload {
        HookSlotPayload::opaque(StateHandle::from_raw(raw))
    }

    #[test]
    fn append_preserves_hook_call_order() {
        let mut arena = HookListArena::new();
        let list = arena.create_list(owner());
        let mut mount = arena.begin_mount(list).unwrap();

        let first = arena.mount_hook(&mut mount, opaque(1)).unwrap();
        let second = arena.mount_hook(&mut mount, opaque(2)).unwrap();
        let third = arena.mount_hook(&mut mount, opaque(3)).unwrap();
        let mounted = arena.finish_mount(mount).unwrap();

        assert_eq!(mounted.traversed_count(), 3);
        assert_eq!(arena.list(list).unwrap().first(), Some(first));
        assert_eq!(arena.list(list).unwrap().last(), Some(third));
        assert_eq!(arena.list(list).unwrap().len(), 3);
        assert_eq!(
            arena.ordered_hooks(list).unwrap(),
            vec![first, second, third]
        );
        assert_eq!(arena.hook(first).unwrap().next(), Some(second));
        assert_eq!(arena.hook(second).unwrap().next(), Some(third));
        assert_eq!(arena.hook(third).unwrap().next(), None);
        assert_eq!(arena.hook(second).unwrap().payload(), opaque(2));
    }

    #[test]
    fn update_traversal_clones_current_hooks_in_order() {
        let mut arena = HookListArena::new();
        let owner = owner();
        let current = arena.create_list(owner);
        let work = arena.create_list(owner);
        let first_payload = opaque(10);
        let second_payload = opaque(20);
        let third_payload = opaque(30);
        let current_first = arena.append_hook(current, first_payload).unwrap();
        let current_second = arena.append_hook(current, second_payload).unwrap();
        let current_third = arena.append_hook(current, third_payload).unwrap();

        let mut update = arena.begin_update(current, work).unwrap();
        let work_first = arena.update_hook(&mut update).unwrap();
        let work_second = arena.update_hook(&mut update).unwrap();
        let work_third = arena.update_hook(&mut update).unwrap();
        let finished = arena.finish_update(update).unwrap();

        assert_eq!(finished.list(), work);
        assert_eq!(finished.traversed_count(), 3);
        assert_eq!(
            arena.ordered_hooks(current).unwrap(),
            vec![current_first, current_second, current_third]
        );
        assert_eq!(
            arena.ordered_hooks(work).unwrap(),
            vec![work_first, work_second, work_third]
        );
        assert_ne!(current_first, work_first);
        assert_eq!(arena.hook(work_first).unwrap().payload(), first_payload);
        assert_eq!(arena.hook(work_second).unwrap().payload(), second_payload);
        assert_eq!(arena.hook(work_third).unwrap().payload(), third_payload);
        assert_eq!(arena.hook(work_first).unwrap().list(), work);
    }

    #[test]
    fn update_traversal_reports_too_many_and_too_few_hooks() {
        let mut arena = HookListArena::new();
        let owner = owner();
        let current = arena.create_list(owner);
        let too_many_work = arena.create_list(owner);
        arena.append_hook(current, opaque(1)).unwrap();

        let mut too_many = arena.begin_update(current, too_many_work).unwrap();
        arena.update_hook(&mut too_many).unwrap();
        assert!(matches!(
            arena.update_hook(&mut too_many),
            Err(HookListError::RenderedMoreHooksThanPreviousRender { .. })
        ));

        let current_with_two = arena.create_list(owner);
        let too_few_work = arena.create_list(owner);
        arena.append_hook(current_with_two, opaque(1)).unwrap();
        arena.append_hook(current_with_two, opaque(2)).unwrap();

        let mut too_few = arena.begin_update(current_with_two, too_few_work).unwrap();
        arena.update_hook(&mut too_few).unwrap();
        assert!(matches!(
            arena.finish_update(too_few),
            Err(HookListError::RenderedFewerHooksThanExpected { remaining: 1, .. })
        ));
    }

    #[test]
    fn wrong_owner_or_slot_list_membership_fails_closed() {
        let mut arena = HookListArena::new();
        let (first_owner, second_owner) = owners();
        let current = arena.create_list(first_owner);
        let wrong_owner_work = arena.create_list(second_owner);
        arena.append_hook(current, opaque(1)).unwrap();

        assert!(matches!(
            arena.begin_update(current, wrong_owner_work),
            Err(HookListError::ListOwnerMismatch { .. })
        ));

        let other_list = arena.create_list(first_owner);
        let hook = arena.append_hook(current, opaque(2)).unwrap();
        arena.hook_mut(hook).unwrap().list = other_list;

        assert_eq!(
            arena.ordered_hooks(current),
            Err(HookListError::WrongHookListOwner {
                hook,
                expected: current,
                actual: other_list,
            })
        );
    }

    #[test]
    fn stale_list_and_hook_handles_fail_after_discard_and_reuse() {
        let mut arena = HookListArena::new();
        let owner = owner();
        let list = arena.create_list(owner);
        let hook = arena.append_hook(list, opaque(1)).unwrap();

        arena.discard_list(list).unwrap();
        let reused_list = arena.create_list(owner);
        let reused_hook = arena.append_hook(reused_list, opaque(2)).unwrap();

        assert_ne!(list, reused_list);
        assert_ne!(hook, reused_hook);
        assert!(matches!(
            arena.list(list),
            Err(HookListError::StaleListGeneration { .. })
        ));
        assert!(matches!(
            arena.hook(hook),
            Err(HookListError::StaleHookGeneration { .. })
        ));
    }

    #[test]
    fn corrupt_hook_links_return_structured_errors() {
        let mut arena = HookListArena::new();
        let list = arena.create_list(owner());
        let first = arena.append_hook(list, opaque(1)).unwrap();
        let second = arena.append_hook(list, opaque(2)).unwrap();
        arena.hook_mut(second).unwrap().next = Some(first);

        assert_eq!(
            arena.ordered_hooks(list),
            Err(HookListError::RepeatedHookSlot {
                list,
                repeated: first,
            })
        );
    }

    #[test]
    fn state_and_effect_payload_metadata_remain_explicitly_separate() {
        let mut hook_queues = HookQueueStore::<i32, i32>::new();
        let state_slot = hook_queues.create_state_slot(0);
        let update = hook_queues.create_update(HookUpdateLane::from_lane(Lane::SYNC).unwrap(), 1);

        let state_payload = HookStatePayload::new(
            StateHandle::from_raw(10),
            StateHandle::from_raw(11),
            Some(update),
            state_slot.queue(),
        );

        let mut effect_arena = HookEffectArena::new();
        let mut effect_ring = HookEffectRing::new();
        let effect_instance = effect_arena.create_effect_instance();
        let effect = effect_arena
            .push_effect(
                &mut effect_ring,
                HookEffectFlags::PASSIVE_EFFECT,
                effect_instance,
                HookEffectCallbackHandle::from_raw(99),
                HookEffectDependencies::AlwaysRun,
            )
            .unwrap();
        let effect_payload = HookEffectPayload::new(effect);

        let mut arena = HookListArena::new();
        let list = arena.create_list(owner());
        let state_hook = arena
            .append_hook(list, HookSlotPayload::state(state_payload))
            .unwrap();
        let effect_hook = arena
            .append_hook(list, HookSlotPayload::effect(effect_payload))
            .unwrap();

        let stored_state = arena
            .hook(state_hook)
            .unwrap()
            .payload()
            .state_payload()
            .unwrap();
        let stored_effect = arena
            .hook(effect_hook)
            .unwrap()
            .payload()
            .effect_payload()
            .unwrap();

        assert_eq!(stored_state.queue(), state_slot.queue());
        assert_eq!(stored_state.base_queue(), Some(update));
        assert_eq!(stored_state.memoized_state(), StateHandle::from_raw(10));
        assert_eq!(stored_state.base_state(), StateHandle::from_raw(11));
        assert_eq!(stored_effect.effect(), effect);
        assert_eq!(
            arena.hook(state_hook).unwrap().payload().effect_payload(),
            None
        );
        assert_eq!(
            arena.hook(effect_hook).unwrap().payload().state_payload(),
            None
        );
    }
}
