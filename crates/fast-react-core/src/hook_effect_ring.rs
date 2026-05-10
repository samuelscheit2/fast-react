//! Arena-backed hook effect rings.
//!
//! React stores function component hook effects as a per-fiber circular ring
//! whose tail points at the last appended effect. `last.next` is therefore the
//! first effect in hook declaration order.

use std::error::Error;
use std::fmt::{self, Display, Formatter};
use std::sync::atomic::{AtomicU64, Ordering};

use crate::{DependenciesHandle, HookEffectFlags};

static NEXT_HOOK_EFFECT_ARENA_ID: AtomicU64 = AtomicU64::new(1);

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HookEffectArenaId(u64);

impl HookEffectArenaId {
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
        let raw = NEXT_HOOK_EFFECT_ARENA_ID.fetch_add(1, Ordering::Relaxed);
        assert_ne!(raw, 0, "hook effect arena id counter wrapped");
        Self(raw)
    }
}

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HookEffectSlot(usize);

impl HookEffectSlot {
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
pub struct HookEffectGeneration(u64);

impl HookEffectGeneration {
    pub const INITIAL: Self = Self(0);

    #[must_use]
    pub const fn new(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub const fn get(self) -> u64 {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HookEffectId {
    arena_id: HookEffectArenaId,
    slot: HookEffectSlot,
    generation: HookEffectGeneration,
}

impl HookEffectId {
    #[must_use]
    pub const fn new(
        arena_id: HookEffectArenaId,
        slot: HookEffectSlot,
        generation: HookEffectGeneration,
    ) -> Self {
        Self {
            arena_id,
            slot,
            generation,
        }
    }

    #[must_use]
    pub const fn arena_id(self) -> HookEffectArenaId {
        self.arena_id
    }

    #[must_use]
    pub const fn slot(self) -> HookEffectSlot {
        self.slot
    }

    #[must_use]
    pub const fn generation(self) -> HookEffectGeneration {
        self.generation
    }

    pub fn validate_arena(self, expected: HookEffectArenaId) -> Result<(), HookEffectArenaError> {
        if self.arena_id == expected {
            Ok(())
        } else {
            Err(HookEffectArenaError::WrongArena {
                expected,
                actual: self.arena_id,
            })
        }
    }
}

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HookEffectInstanceSlot(usize);

impl HookEffectInstanceSlot {
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
pub struct HookEffectInstanceGeneration(u64);

impl HookEffectInstanceGeneration {
    pub const INITIAL: Self = Self(0);

    #[must_use]
    pub const fn new(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub const fn get(self) -> u64 {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HookEffectInstanceId {
    arena_id: HookEffectArenaId,
    slot: HookEffectInstanceSlot,
    generation: HookEffectInstanceGeneration,
}

impl HookEffectInstanceId {
    #[must_use]
    pub const fn new(
        arena_id: HookEffectArenaId,
        slot: HookEffectInstanceSlot,
        generation: HookEffectInstanceGeneration,
    ) -> Self {
        Self {
            arena_id,
            slot,
            generation,
        }
    }

    #[must_use]
    pub const fn arena_id(self) -> HookEffectArenaId {
        self.arena_id
    }

    #[must_use]
    pub const fn slot(self) -> HookEffectInstanceSlot {
        self.slot
    }

    #[must_use]
    pub const fn generation(self) -> HookEffectInstanceGeneration {
        self.generation
    }

    pub fn validate_arena(self, expected: HookEffectArenaId) -> Result<(), HookEffectArenaError> {
        if self.arena_id == expected {
            Ok(())
        } else {
            Err(HookEffectArenaError::WrongArena {
                expected,
                actual: self.arena_id,
            })
        }
    }
}

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HookEffectCallbackHandle(u64);

impl HookEffectCallbackHandle {
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

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HookEffectDependencies {
    #[default]
    AlwaysRun,
    Array(DependenciesHandle),
}

impl HookEffectDependencies {
    #[must_use]
    pub const fn array(handle: DependenciesHandle) -> Self {
        Self::Array(handle)
    }

    #[must_use]
    pub const fn is_always_run(self) -> bool {
        matches!(self, Self::AlwaysRun)
    }

    #[must_use]
    pub const fn array_handle(self) -> Option<DependenciesHandle> {
        match self {
            Self::AlwaysRun => None,
            Self::Array(handle) => Some(handle),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookEffectInstance {
    id: HookEffectInstanceId,
    destroy: Option<HookEffectCallbackHandle>,
}

impl HookEffectInstance {
    #[must_use]
    pub const fn new(id: HookEffectInstanceId, destroy: Option<HookEffectCallbackHandle>) -> Self {
        Self { id, destroy }
    }

    #[must_use]
    pub const fn id(&self) -> HookEffectInstanceId {
        self.id
    }

    #[must_use]
    pub const fn destroy(&self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    pub fn set_destroy(&mut self, destroy: Option<HookEffectCallbackHandle>) {
        self.destroy = destroy;
    }

    pub fn clear_destroy(&mut self) {
        self.destroy = None;
    }

    pub fn take_destroy(&mut self) -> Option<HookEffectCallbackHandle> {
        self.destroy.take()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookEffectNode {
    id: HookEffectId,
    tag: HookEffectFlags,
    instance: HookEffectInstanceId,
    create: HookEffectCallbackHandle,
    dependencies: HookEffectDependencies,
    next: HookEffectId,
}

impl HookEffectNode {
    #[must_use]
    pub const fn new(
        id: HookEffectId,
        tag: HookEffectFlags,
        instance: HookEffectInstanceId,
        create: HookEffectCallbackHandle,
        dependencies: HookEffectDependencies,
        next: HookEffectId,
    ) -> Self {
        Self {
            id,
            tag,
            instance,
            create,
            dependencies,
            next,
        }
    }

    #[must_use]
    pub const fn id(&self) -> HookEffectId {
        self.id
    }

    #[must_use]
    pub const fn tag(&self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn instance(&self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn create(&self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn dependencies(&self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn next(&self) -> HookEffectId {
        self.next
    }

    #[must_use]
    pub const fn matches_flags(&self, flags: HookEffectFlags) -> bool {
        self.tag.contains_all(flags)
    }

    fn set_next(&mut self, next: HookEffectId) {
        self.next = next;
    }
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct HookEffectRing {
    last_effect: Option<HookEffectId>,
}

impl HookEffectRing {
    #[must_use]
    pub const fn new() -> Self {
        Self { last_effect: None }
    }

    #[must_use]
    pub const fn is_empty(&self) -> bool {
        self.last_effect.is_none()
    }

    #[must_use]
    pub const fn last_effect(&self) -> Option<HookEffectId> {
        self.last_effect
    }

    pub fn first_effect(
        &self,
        arena: &HookEffectArena,
    ) -> Result<Option<HookEffectId>, HookEffectArenaError> {
        let Some(last_effect) = self.last_effect else {
            return Ok(None);
        };

        let first_effect = arena.get_effect(last_effect)?.next();
        arena.validate_effect_id(first_effect)?;
        Ok(Some(first_effect))
    }

    pub fn iter<'a>(
        &self,
        arena: &'a HookEffectArena,
    ) -> Result<HookEffectIter<'a>, HookEffectArenaError> {
        let first = self.first_effect(arena)?;
        Ok(HookEffectIter {
            arena,
            first,
            next: first,
            remaining: arena.effect_len(),
        })
    }

    pub fn iter_matching<'a>(
        &self,
        arena: &'a HookEffectArena,
        flags: HookEffectFlags,
    ) -> Result<HookEffectFilteredIter<'a>, HookEffectArenaError> {
        Ok(HookEffectFilteredIter {
            inner: self.iter(arena)?,
            flags,
        })
    }
}

#[derive(Debug, Clone)]
struct HookEffectSlotEntry {
    generation: HookEffectGeneration,
    node: Option<HookEffectNode>,
}

#[derive(Debug, Clone)]
struct HookEffectInstanceSlotEntry {
    generation: HookEffectInstanceGeneration,
    instance: Option<HookEffectInstance>,
}

#[derive(Debug, Clone)]
pub struct HookEffectArena {
    arena_id: HookEffectArenaId,
    effects: Vec<HookEffectSlotEntry>,
    instances: Vec<HookEffectInstanceSlotEntry>,
}

impl HookEffectArena {
    #[must_use]
    pub fn new() -> Self {
        Self {
            arena_id: HookEffectArenaId::allocate(),
            effects: Vec::new(),
            instances: Vec::new(),
        }
    }

    #[must_use]
    pub const fn arena_id(&self) -> HookEffectArenaId {
        self.arena_id
    }

    #[must_use]
    pub fn effect_len(&self) -> usize {
        self.effects
            .iter()
            .filter(|entry| entry.node.is_some())
            .count()
    }

    #[must_use]
    pub fn is_effect_empty(&self) -> bool {
        self.effect_len() == 0
    }

    #[must_use]
    pub fn instance_len(&self) -> usize {
        self.instances
            .iter()
            .filter(|entry| entry.instance.is_some())
            .count()
    }

    #[must_use]
    pub fn is_instance_empty(&self) -> bool {
        self.instance_len() == 0
    }

    pub fn create_effect_instance(&mut self) -> HookEffectInstanceId {
        self.create_effect_instance_with_destroy(None)
    }

    pub fn create_effect_instance_with_destroy(
        &mut self,
        destroy: Option<HookEffectCallbackHandle>,
    ) -> HookEffectInstanceId {
        let slot = HookEffectInstanceSlot::new(self.instances.len());
        let generation = HookEffectInstanceGeneration::INITIAL;
        let id = HookEffectInstanceId::new(self.arena_id, slot, generation);
        self.instances.push(HookEffectInstanceSlotEntry {
            generation,
            instance: Some(HookEffectInstance::new(id, destroy)),
        });
        id
    }

    pub fn push_effect(
        &mut self,
        ring: &mut HookEffectRing,
        tag: HookEffectFlags,
        instance: HookEffectInstanceId,
        create: HookEffectCallbackHandle,
        dependencies: HookEffectDependencies,
    ) -> Result<HookEffectId, HookEffectArenaError> {
        self.validate_instance_id(instance)?;

        let tail = match ring.last_effect {
            Some(last_effect) => {
                let last_index = self.validate_effect_id(last_effect)?;
                let first_effect = self.effects[last_index]
                    .node
                    .as_ref()
                    .expect("validated hook effect slot is occupied")
                    .next();
                self.validate_effect_id(first_effect)?;
                Some((last_index, first_effect))
            }
            None => None,
        };

        let slot = HookEffectSlot::new(self.effects.len());
        let generation = HookEffectGeneration::INITIAL;
        let id = HookEffectId::new(self.arena_id, slot, generation);
        let next = tail.map_or(id, |(_, first_effect)| first_effect);

        self.effects.push(HookEffectSlotEntry {
            generation,
            node: Some(HookEffectNode::new(
                id,
                tag,
                instance,
                create,
                dependencies,
                next,
            )),
        });

        if let Some((last_index, _)) = tail {
            self.effects[last_index]
                .node
                .as_mut()
                .expect("validated hook effect slot is occupied")
                .set_next(id);
        }

        ring.last_effect = Some(id);
        Ok(id)
    }

    pub fn validate_effect_id(&self, id: HookEffectId) -> Result<usize, HookEffectArenaError> {
        id.validate_arena(self.arena_id)?;
        let entry =
            self.effects
                .get(id.slot().get())
                .ok_or(HookEffectArenaError::InvalidEffectSlot {
                    arena_id: self.arena_id,
                    slot: id.slot(),
                })?;

        if entry.generation != id.generation() {
            return Err(HookEffectArenaError::StaleEffectGeneration {
                id,
                current_generation: entry.generation,
            });
        }

        if entry.node.is_none() {
            return Err(HookEffectArenaError::VacantEffectSlot { id });
        }

        Ok(id.slot().get())
    }

    pub fn validate_instance_id(
        &self,
        id: HookEffectInstanceId,
    ) -> Result<usize, HookEffectArenaError> {
        id.validate_arena(self.arena_id)?;
        let entry = self.instances.get(id.slot().get()).ok_or(
            HookEffectArenaError::InvalidEffectInstanceSlot {
                arena_id: self.arena_id,
                slot: id.slot(),
            },
        )?;

        if entry.generation != id.generation() {
            return Err(HookEffectArenaError::StaleEffectInstanceGeneration {
                id,
                current_generation: entry.generation,
            });
        }

        if entry.instance.is_none() {
            return Err(HookEffectArenaError::VacantEffectInstanceSlot { id });
        }

        Ok(id.slot().get())
    }

    pub fn get_effect(&self, id: HookEffectId) -> Result<&HookEffectNode, HookEffectArenaError> {
        let index = self.validate_effect_id(id)?;
        Ok(self.effects[index]
            .node
            .as_ref()
            .expect("validated hook effect slot is occupied"))
    }

    pub fn get_effect_mut(
        &mut self,
        id: HookEffectId,
    ) -> Result<&mut HookEffectNode, HookEffectArenaError> {
        let index = self.validate_effect_id(id)?;
        Ok(self.effects[index]
            .node
            .as_mut()
            .expect("validated hook effect slot is occupied"))
    }

    pub fn get_instance(
        &self,
        id: HookEffectInstanceId,
    ) -> Result<&HookEffectInstance, HookEffectArenaError> {
        let index = self.validate_instance_id(id)?;
        Ok(self.instances[index]
            .instance
            .as_ref()
            .expect("validated hook effect instance slot is occupied"))
    }

    pub fn get_instance_mut(
        &mut self,
        id: HookEffectInstanceId,
    ) -> Result<&mut HookEffectInstance, HookEffectArenaError> {
        let index = self.validate_instance_id(id)?;
        Ok(self.instances[index]
            .instance
            .as_mut()
            .expect("validated hook effect instance slot is occupied"))
    }

    pub fn effect_destroy(
        &self,
        id: HookEffectId,
    ) -> Result<Option<HookEffectCallbackHandle>, HookEffectArenaError> {
        let instance = self.get_effect(id)?.instance();
        Ok(self.get_instance(instance)?.destroy())
    }
}

impl Default for HookEffectArena {
    fn default() -> Self {
        Self::new()
    }
}

pub struct HookEffectIter<'a> {
    arena: &'a HookEffectArena,
    first: Option<HookEffectId>,
    next: Option<HookEffectId>,
    remaining: usize,
}

impl<'a> Iterator for HookEffectIter<'a> {
    type Item = Result<&'a HookEffectNode, HookEffectArenaError>;

    fn next(&mut self) -> Option<Self::Item> {
        let effect_id = self.next?;
        let first = self
            .first
            .expect("non-empty hook effect iterator has first effect");

        if self.remaining == 0 {
            self.next = None;
            return Some(Err(HookEffectArenaError::CorruptEffectRing {
                first,
                repeated: effect_id,
            }));
        }
        self.remaining -= 1;

        match self.arena.get_effect(effect_id) {
            Ok(node) => {
                let next = node.next();
                self.next = if next == first { None } else { Some(next) };
                Some(Ok(node))
            }
            Err(error) => {
                self.next = None;
                Some(Err(error))
            }
        }
    }
}

pub struct HookEffectFilteredIter<'a> {
    inner: HookEffectIter<'a>,
    flags: HookEffectFlags,
}

impl<'a> Iterator for HookEffectFilteredIter<'a> {
    type Item = Result<&'a HookEffectNode, HookEffectArenaError>;

    fn next(&mut self) -> Option<Self::Item> {
        loop {
            match self.inner.next()? {
                Ok(node) if node.matches_flags(self.flags) => return Some(Ok(node)),
                Ok(_) => {}
                Err(error) => return Some(Err(error)),
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HookEffectArenaError {
    WrongArena {
        expected: HookEffectArenaId,
        actual: HookEffectArenaId,
    },
    InvalidEffectSlot {
        arena_id: HookEffectArenaId,
        slot: HookEffectSlot,
    },
    StaleEffectGeneration {
        id: HookEffectId,
        current_generation: HookEffectGeneration,
    },
    VacantEffectSlot {
        id: HookEffectId,
    },
    InvalidEffectInstanceSlot {
        arena_id: HookEffectArenaId,
        slot: HookEffectInstanceSlot,
    },
    StaleEffectInstanceGeneration {
        id: HookEffectInstanceId,
        current_generation: HookEffectInstanceGeneration,
    },
    VacantEffectInstanceSlot {
        id: HookEffectInstanceId,
    },
    CorruptEffectRing {
        first: HookEffectId,
        repeated: HookEffectId,
    },
}

impl Display for HookEffectArenaError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::WrongArena { expected, actual } => write!(
                formatter,
                "hook effect id belongs to arena {}, expected arena {}",
                actual.get(),
                expected.get()
            ),
            Self::InvalidEffectSlot { arena_id, slot } => write!(
                formatter,
                "hook effect slot {} is outside arena {}",
                slot.get(),
                arena_id.get()
            ),
            Self::StaleEffectGeneration {
                id,
                current_generation,
            } => write!(
                formatter,
                "hook effect slot {} has stale generation {}, current generation is {}",
                id.slot().get(),
                id.generation().get(),
                current_generation.get()
            ),
            Self::VacantEffectSlot { id } => write!(
                formatter,
                "hook effect slot {} in arena {} is vacant",
                id.slot().get(),
                id.arena_id().get()
            ),
            Self::InvalidEffectInstanceSlot { arena_id, slot } => write!(
                formatter,
                "hook effect instance slot {} is outside arena {}",
                slot.get(),
                arena_id.get()
            ),
            Self::StaleEffectInstanceGeneration {
                id,
                current_generation,
            } => write!(
                formatter,
                "hook effect instance slot {} has stale generation {}, current generation is {}",
                id.slot().get(),
                id.generation().get(),
                current_generation.get()
            ),
            Self::VacantEffectInstanceSlot { id } => write!(
                formatter,
                "hook effect instance slot {} in arena {} is vacant",
                id.slot().get(),
                id.arena_id().get()
            ),
            Self::CorruptEffectRing { first, repeated } => write!(
                formatter,
                "hook effect ring starting at slot {} repeated slot {} before returning to first",
                first.slot().get(),
                repeated.slot().get()
            ),
        }
    }
}

impl Error for HookEffectArenaError {}

#[cfg(test)]
mod tests {
    use super::*;

    fn callback(raw: u64) -> HookEffectCallbackHandle {
        HookEffectCallbackHandle::from_raw(raw)
    }

    #[test]
    fn hook_effect_ring_empty_and_first_append_self_loops() {
        let mut arena = HookEffectArena::new();
        let mut ring = HookEffectRing::new();

        assert!(ring.is_empty());
        assert_eq!(ring.first_effect(&arena).unwrap(), None);
        assert!(ring.iter(&arena).unwrap().next().is_none());

        let instance = arena.create_effect_instance();
        let effect = arena
            .push_effect(
                &mut ring,
                HookEffectFlags::INSERTION_EFFECT,
                instance,
                callback(1),
                HookEffectDependencies::AlwaysRun,
            )
            .unwrap();

        assert_eq!(ring.last_effect(), Some(effect));
        assert_eq!(ring.first_effect(&arena).unwrap(), Some(effect));
        assert_eq!(arena.get_effect(effect).unwrap().next(), effect);
        let ids = ring
            .iter(&arena)
            .unwrap()
            .map(|result| result.unwrap().id())
            .collect::<Vec<_>>();
        assert_eq!(ids, vec![effect]);
    }

    #[test]
    fn hook_effect_ring_appends_in_order_and_keeps_tail_handle() {
        let mut arena = HookEffectArena::new();
        let mut ring = HookEffectRing::new();
        let first_instance = arena.create_effect_instance();
        let second_instance = arena.create_effect_instance();
        let third_instance = arena.create_effect_instance();

        let first = arena
            .push_effect(
                &mut ring,
                HookEffectFlags::INSERTION_EFFECT,
                first_instance,
                callback(1),
                HookEffectDependencies::AlwaysRun,
            )
            .unwrap();
        let second = arena
            .push_effect(
                &mut ring,
                HookEffectFlags::LAYOUT_EFFECT,
                second_instance,
                callback(2),
                HookEffectDependencies::array(DependenciesHandle::from_raw(20)),
            )
            .unwrap();
        let third = arena
            .push_effect(
                &mut ring,
                HookEffectFlags::PASSIVE_EFFECT,
                third_instance,
                callback(3),
                HookEffectDependencies::array(DependenciesHandle::from_raw(30)),
            )
            .unwrap();

        assert_eq!(ring.last_effect(), Some(third));
        assert_eq!(ring.first_effect(&arena).unwrap(), Some(first));
        assert_eq!(arena.get_effect(first).unwrap().next(), second);
        assert_eq!(arena.get_effect(second).unwrap().next(), third);
        assert_eq!(arena.get_effect(third).unwrap().next(), first);

        let ids = ring
            .iter(&arena)
            .unwrap()
            .map(|result| result.unwrap().id())
            .collect::<Vec<_>>();
        assert_eq!(ids, vec![first, second, third]);
    }

    #[test]
    fn hook_effect_ring_filters_by_all_requested_flags() {
        let mut arena = HookEffectArena::new();
        let mut ring = HookEffectRing::new();
        let insertion_instance = arena.create_effect_instance();
        let layout_without_has_effect_instance = arena.create_effect_instance();
        let layout_instance = arena.create_effect_instance();
        let passive_instance = arena.create_effect_instance();
        let passive_without_has_effect_instance = arena.create_effect_instance();

        let insertion = arena
            .push_effect(
                &mut ring,
                HookEffectFlags::INSERTION_EFFECT,
                insertion_instance,
                callback(1),
                HookEffectDependencies::AlwaysRun,
            )
            .unwrap();
        let layout_without_has_effect = arena
            .push_effect(
                &mut ring,
                HookEffectFlags::LAYOUT,
                layout_without_has_effect_instance,
                callback(2),
                HookEffectDependencies::AlwaysRun,
            )
            .unwrap();
        let layout = arena
            .push_effect(
                &mut ring,
                HookEffectFlags::LAYOUT_EFFECT,
                layout_instance,
                callback(3),
                HookEffectDependencies::AlwaysRun,
            )
            .unwrap();
        let passive = arena
            .push_effect(
                &mut ring,
                HookEffectFlags::PASSIVE_EFFECT,
                passive_instance,
                callback(4),
                HookEffectDependencies::AlwaysRun,
            )
            .unwrap();
        arena
            .push_effect(
                &mut ring,
                HookEffectFlags::PASSIVE,
                passive_without_has_effect_instance,
                callback(5),
                HookEffectDependencies::AlwaysRun,
            )
            .unwrap();

        let all_ids = ring
            .iter(&arena)
            .unwrap()
            .map(|result| result.unwrap().id())
            .collect::<Vec<_>>();
        assert!(all_ids.contains(&layout_without_has_effect));

        let insertion_ids = ring
            .iter_matching(&arena, HookEffectFlags::INSERTION_EFFECT)
            .unwrap()
            .map(|result| result.unwrap().id())
            .collect::<Vec<_>>();
        let layout_ids = ring
            .iter_matching(&arena, HookEffectFlags::LAYOUT_EFFECT)
            .unwrap()
            .map(|result| result.unwrap().id())
            .collect::<Vec<_>>();
        let passive_ids = ring
            .iter_matching(&arena, HookEffectFlags::PASSIVE_EFFECT)
            .unwrap()
            .map(|result| result.unwrap().id())
            .collect::<Vec<_>>();

        assert_eq!(insertion_ids, vec![insertion]);
        assert_eq!(layout_ids, vec![layout]);
        assert_eq!(passive_ids, vec![passive]);
    }

    #[test]
    fn hook_effect_ring_can_reuse_instance_without_has_effect() {
        let mut arena = HookEffectArena::new();
        let mut ring = HookEffectRing::new();
        let instance =
            arena.create_effect_instance_with_destroy(Some(HookEffectCallbackHandle::from_raw(99)));

        let effect = arena
            .push_effect(
                &mut ring,
                HookEffectFlags::LAYOUT,
                instance,
                callback(7),
                HookEffectDependencies::array(DependenciesHandle::from_raw(70)),
            )
            .unwrap();

        let node = arena.get_effect(effect).unwrap();
        assert_eq!(node.instance(), instance);
        assert!(!node.tag().should_fire());
        assert_eq!(
            arena.get_instance(instance).unwrap().destroy(),
            Some(callback(99))
        );
        assert!(
            ring.iter_matching(&arena, HookEffectFlags::LAYOUT_EFFECT)
                .unwrap()
                .next()
                .is_none()
        );
    }

    #[test]
    fn hook_effect_instance_stores_destroy_separately_from_nodes() {
        let mut arena = HookEffectArena::new();
        let mut ring = HookEffectRing::new();
        let instance =
            arena.create_effect_instance_with_destroy(Some(HookEffectCallbackHandle::from_raw(11)));
        let effect = arena
            .push_effect(
                &mut ring,
                HookEffectFlags::PASSIVE_EFFECT,
                instance,
                callback(10),
                HookEffectDependencies::AlwaysRun,
            )
            .unwrap();

        assert_eq!(arena.get_effect(effect).unwrap().instance(), instance);
        assert_eq!(arena.get_effect(effect).unwrap().create(), callback(10));
        assert_eq!(arena.effect_destroy(effect).unwrap(), Some(callback(11)));
        assert_eq!(
            arena.get_instance_mut(instance).unwrap().take_destroy(),
            Some(callback(11))
        );
        assert_eq!(arena.get_instance(instance).unwrap().destroy(), None);
        assert_eq!(arena.effect_destroy(effect).unwrap(), None);
        assert_eq!(arena.get_effect(effect).unwrap().create(), callback(10));
    }

    #[test]
    fn hook_effect_ring_rejects_wrong_arena_invalid_and_stale_handles() {
        let mut arena = HookEffectArena::new();
        let mut other_arena = HookEffectArena::new();
        let mut ring = HookEffectRing::new();
        let instance = arena.create_effect_instance();
        let effect = arena
            .push_effect(
                &mut ring,
                HookEffectFlags::PASSIVE_EFFECT,
                instance,
                callback(1),
                HookEffectDependencies::AlwaysRun,
            )
            .unwrap();

        assert!(matches!(
            other_arena.push_effect(
                &mut HookEffectRing::new(),
                HookEffectFlags::PASSIVE_EFFECT,
                instance,
                callback(2),
                HookEffectDependencies::AlwaysRun,
            ),
            Err(HookEffectArenaError::WrongArena { .. })
        ));
        assert!(matches!(
            ring.iter(&other_arena),
            Err(HookEffectArenaError::WrongArena { .. })
        ));

        let invalid_effect = HookEffectId::new(
            arena.arena_id(),
            HookEffectSlot::new(1000),
            HookEffectGeneration::INITIAL,
        );
        assert!(matches!(
            arena.get_effect(invalid_effect),
            Err(HookEffectArenaError::InvalidEffectSlot { .. })
        ));

        let stale_effect = HookEffectId::new(
            arena.arena_id(),
            effect.slot(),
            HookEffectGeneration::new(effect.generation().get() + 1),
        );
        assert!(matches!(
            arena.get_effect(stale_effect),
            Err(HookEffectArenaError::StaleEffectGeneration { .. })
        ));

        let stale_instance = HookEffectInstanceId::new(
            arena.arena_id(),
            instance.slot(),
            HookEffectInstanceGeneration::new(instance.generation().get() + 1),
        );
        assert!(matches!(
            arena.get_instance(stale_instance),
            Err(HookEffectArenaError::StaleEffectInstanceGeneration { .. })
        ));
    }
}
