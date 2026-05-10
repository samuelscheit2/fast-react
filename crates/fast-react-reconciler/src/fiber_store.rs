//! Root store tying reconciler FiberRoot records to the core FiberArena.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    FiberArena, FiberTopologyError, StateHandle, StateNodeHandle, UpdateQueueHandle,
};
use fast_react_host_config::HostTypes;

use crate::{
    ConcurrentUpdateStaging, FiberRoot, HostFiberTokenStore, HostRootState, HostRootStateStore,
    HostRootStateStoreError, RootElementHandle, RootOptions, RootSchedulerState, RootTag,
    SchedulerBridge, UpdateQueueStore, create_host_root_current_fiber,
};

const ROOT_ID_SLOT_BITS: u64 = 32;
const ROOT_ID_SLOT_MASK: u64 = (1u64 << ROOT_ID_SLOT_BITS) - 1;

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct FiberRootId(u64);

impl FiberRootId {
    #[must_use]
    pub const fn new(raw: u64) -> Option<Self> {
        if raw == 0 || raw & ROOT_ID_SLOT_MASK == 0 {
            None
        } else {
            Some(Self(raw))
        }
    }

    #[must_use]
    pub(crate) const fn from_parts(slot_index: usize, generation: u32) -> Self {
        let slot = slot_index as u64 + 1;
        assert!(slot <= ROOT_ID_SLOT_MASK);
        Self(((generation as u64) << ROOT_ID_SLOT_BITS) | slot)
    }

    #[must_use]
    pub const fn raw(self) -> u64 {
        self.0
    }

    #[must_use]
    pub const fn slot_index(self) -> usize {
        ((self.0 & ROOT_ID_SLOT_MASK) - 1) as usize
    }

    #[must_use]
    pub const fn generation(self) -> u32 {
        (self.0 >> ROOT_ID_SLOT_BITS) as u32
    }

    #[must_use]
    pub const fn state_node_handle(self) -> StateNodeHandle {
        StateNodeHandle::from_raw(self.raw())
    }
}

struct RootSlot<H: HostTypes> {
    generation: u32,
    root: Option<FiberRoot<H>>,
}

impl<H: HostTypes> RootSlot<H> {
    const fn vacant(generation: u32) -> Self {
        Self {
            generation,
            root: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FiberRootStoreError {
    InvalidRootId {
        id: FiberRootId,
    },
    VacantRoot {
        id: FiberRootId,
    },
    StaleRootId {
        id: FiberRootId,
        current_generation: u32,
    },
    RootGenerationOverflow {
        id: FiberRootId,
    },
    FiberTopology(FiberTopologyError),
    HostRootState(HostRootStateStoreError),
}

impl Display for FiberRootStoreError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidRootId { id } => {
                write!(formatter, "fiber root id {} is invalid", id.raw())
            }
            Self::VacantRoot { id } => {
                write!(formatter, "fiber root slot {} is vacant", id.slot_index())
            }
            Self::StaleRootId {
                id,
                current_generation,
            } => write!(
                formatter,
                "fiber root slot {} has stale generation {}, current generation is {}",
                id.slot_index(),
                id.generation(),
                current_generation
            ),
            Self::RootGenerationOverflow { id } => write!(
                formatter,
                "fiber root slot {} generation overflowed during disposal",
                id.slot_index()
            ),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::HostRootState(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for FiberRootStoreError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::HostRootState(error) => Some(error),
            Self::InvalidRootId { .. }
            | Self::VacantRoot { .. }
            | Self::StaleRootId { .. }
            | Self::RootGenerationOverflow { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for FiberRootStoreError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<HostRootStateStoreError> for FiberRootStoreError {
    fn from(error: HostRootStateStoreError) -> Self {
        Self::HostRootState(error)
    }
}

pub struct FiberRootStore<H: HostTypes> {
    roots: Vec<RootSlot<H>>,
    vacant_slots: Vec<usize>,
    fiber_arena: FiberArena,
    host_root_states: HostRootStateStore,
    host_tokens: HostFiberTokenStore,
    update_queues: UpdateQueueStore,
    concurrent_updates: ConcurrentUpdateStaging,
    root_scheduler: RootSchedulerState,
    scheduler_bridge: SchedulerBridge,
}

impl<H: HostTypes> FiberRootStore<H> {
    #[must_use]
    pub fn new() -> Self {
        Self {
            roots: Vec::new(),
            vacant_slots: Vec::new(),
            fiber_arena: FiberArena::new(),
            host_root_states: HostRootStateStore::new(),
            host_tokens: HostFiberTokenStore::new(),
            update_queues: UpdateQueueStore::new(),
            concurrent_updates: ConcurrentUpdateStaging::new(),
            root_scheduler: RootSchedulerState::new(),
            scheduler_bridge: SchedulerBridge::new(),
        }
    }

    pub fn create_client_root(
        &mut self,
        container_info: H::Container,
        options: RootOptions,
    ) -> Result<FiberRootId, FiberRootStoreError> {
        let slot_index = self.reserve_slot();
        let generation = self.roots[slot_index].generation;
        let id = FiberRootId::from_parts(slot_index, generation);
        let state = HostRootState::client(RootElementHandle::NONE, options.form_state());
        let state_handle = self.host_root_states.insert(state);
        let current = create_host_root_current_fiber(
            &mut self.fiber_arena,
            id,
            options.host_root_mode(RootTag::Concurrent),
            state_handle,
        )?;
        self.roots[slot_index].root =
            Some(FiberRoot::new_client(id, container_info, current, options));
        Ok(id)
    }

    pub fn root(&self, id: FiberRootId) -> Result<&FiberRoot<H>, FiberRootStoreError> {
        let slot = self.validate_root_id(id)?;
        slot.root
            .as_ref()
            .ok_or(FiberRootStoreError::VacantRoot { id })
    }

    pub fn root_mut(&mut self, id: FiberRootId) -> Result<&mut FiberRoot<H>, FiberRootStoreError> {
        self.validate_root_id(id)?;
        let slot_index = id.slot_index();
        self.roots[slot_index]
            .root
            .as_mut()
            .ok_or(FiberRootStoreError::VacantRoot { id })
    }

    #[must_use]
    pub const fn fiber_arena(&self) -> &FiberArena {
        &self.fiber_arena
    }

    #[must_use]
    pub(crate) fn fiber_arena_mut(&mut self) -> &mut FiberArena {
        &mut self.fiber_arena
    }

    #[must_use]
    pub const fn host_root_states(&self) -> &HostRootStateStore {
        &self.host_root_states
    }

    pub(crate) fn insert_host_root_state(&mut self, state: HostRootState) -> StateHandle {
        self.host_root_states.insert(state)
    }

    #[must_use]
    pub const fn host_tokens(&self) -> &HostFiberTokenStore {
        &self.host_tokens
    }

    #[must_use]
    pub fn host_tokens_mut(&mut self) -> &mut HostFiberTokenStore {
        &mut self.host_tokens
    }

    #[must_use]
    pub const fn update_queues(&self) -> &UpdateQueueStore {
        &self.update_queues
    }

    #[must_use]
    pub fn update_queues_mut(&mut self) -> &mut UpdateQueueStore {
        &mut self.update_queues
    }

    #[must_use]
    pub const fn concurrent_updates(&self) -> &ConcurrentUpdateStaging {
        &self.concurrent_updates
    }

    #[must_use]
    pub(crate) fn concurrent_updates_mut(&mut self) -> &mut ConcurrentUpdateStaging {
        &mut self.concurrent_updates
    }

    #[must_use]
    pub const fn root_scheduler(&self) -> &RootSchedulerState {
        &self.root_scheduler
    }

    #[must_use]
    pub(crate) fn root_scheduler_mut(&mut self) -> &mut RootSchedulerState {
        &mut self.root_scheduler
    }

    #[must_use]
    pub const fn scheduler_bridge(&self) -> &SchedulerBridge {
        &self.scheduler_bridge
    }

    #[must_use]
    pub(crate) fn scheduler_bridge_mut(&mut self) -> &mut SchedulerBridge {
        &mut self.scheduler_bridge
    }

    pub fn ensure_host_root_update_queue(
        &mut self,
        root_id: FiberRootId,
    ) -> Result<UpdateQueueHandle, FiberRootStoreError> {
        let current = self.root(root_id)?.current();
        let current_queue = self.fiber_arena.get(current)?.update_queue();
        if current_queue.is_some() {
            return Ok(current_queue);
        }

        let state = *self
            .host_root_states
            .get(self.fiber_arena.get(current)?.memoized_state())?;
        let queue = self.update_queues.initialize_host_root_queue(state);
        self.fiber_arena.get_mut(current)?.set_update_queue(queue);

        if let Some(alternate) = self.fiber_arena.get(current)?.alternate() {
            self.fiber_arena.get_mut(alternate)?.set_update_queue(queue);
        }

        Ok(queue)
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.roots.iter().filter(|slot| slot.root.is_some()).count()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    fn reserve_slot(&mut self) -> usize {
        if let Some(slot_index) = self.vacant_slots.pop() {
            return slot_index;
        }

        let slot_index = self.roots.len();
        self.roots.push(RootSlot::vacant(0));
        slot_index
    }

    fn validate_root_id(&self, id: FiberRootId) -> Result<&RootSlot<H>, FiberRootStoreError> {
        let slot = self
            .roots
            .get(id.slot_index())
            .ok_or(FiberRootStoreError::InvalidRootId { id })?;
        if slot.generation != id.generation() {
            return Err(FiberRootStoreError::StaleRootId {
                id,
                current_generation: slot.generation,
            });
        }
        Ok(slot)
    }
}

impl<H: HostTypes> Default for FiberRootStore<H> {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{
        RootErrorCallbackHandle, RootLifecycleState, RootRecoverableErrorCallbackHandle,
        RootWorkStatus,
    };
    use fast_react_core::{FiberTag, Lanes, UpdateQueueHandle};

    #[test]
    fn fiber_store_creates_concurrent_client_root_with_host_root_current() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let root = store.root(id).unwrap();
        let current = store.fiber_arena().get(root.current()).unwrap();
        let host_root_state = store
            .host_root_states()
            .get(current.memoized_state())
            .unwrap();

        assert_eq!(root.id(), id);
        assert_eq!(root.tag(), RootTag::Concurrent);
        assert_eq!(root.kind(), crate::RootKind::Client);
        assert_eq!(root.lifecycle(), RootLifecycleState::Active);
        assert_eq!(root.work_status(), RootWorkStatus::Idle);
        assert_eq!(root.lanes().pending_lanes(), Lanes::NO);
        assert_eq!(current.tag(), FiberTag::HostRoot);
        assert_eq!(current.state_node(), id.state_node_handle());
        assert_eq!(current.update_queue(), UpdateQueueHandle::NONE);
        assert_eq!(host_root_state.element(), RootElementHandle::NONE);
        assert!(!host_root_state.is_dehydrated());
    }

    #[test]
    fn fiber_store_keeps_root_construction_side_effect_free() {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let _id = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();

        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn fiber_store_preserves_root_options_and_typed_callback_handles() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let options = RootOptions::new()
            .with_identifier_prefix("app-")
            .with_strict_mode(true)
            .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(10))
            .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(11));
        let id = store
            .create_client_root(FakeContainer::new(3), options)
            .unwrap();
        let root = store.root(id).unwrap();
        let current = store.fiber_arena().get(root.current()).unwrap();

        assert_eq!(root.options().identifier_prefix(), "app-");
        assert_eq!(
            root.options().on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(10)
        );
        assert_eq!(
            root.options().on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(11)
        );
        assert!(
            current
                .mode()
                .contains_all(fast_react_core::FiberMode::CONCURRENT)
        );
        assert!(
            current
                .mode()
                .contains_all(fast_react_core::FiberMode::STRICT_LEGACY)
        );
        assert!(
            current
                .mode()
                .contains_all(fast_react_core::FiberMode::STRICT_EFFECTS)
        );
    }

    #[test]
    fn fiber_store_rejects_invalid_root_ids() {
        let store = FiberRootStore::<RecordingHost>::new();
        let id = FiberRootId::from_parts(3, 0);

        assert!(matches!(
            store.root(id),
            Err(FiberRootStoreError::InvalidRootId { .. })
        ));
        assert_eq!(FiberRootId::new(0), None);
    }
}
