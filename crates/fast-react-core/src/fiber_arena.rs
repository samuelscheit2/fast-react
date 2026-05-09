//! Owning arena storage and validated topology mutation for fibers.

use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::fmt::{self, Display, Formatter};

use crate::{
    DeletionList, DeletionListId, FiberArenaId, FiberGeneration, FiberId, FiberIdError, FiberMode,
    FiberNode, FiberSlot, FiberTag, PropsHandle, ReactKey,
};

#[derive(Debug, Clone)]
pub(crate) struct FiberSlotEntry {
    pub(crate) generation: FiberGeneration,
    pub(crate) node: Option<FiberNode>,
}

#[derive(Debug, Clone)]
pub struct FiberArena {
    pub(crate) arena_id: FiberArenaId,
    pub(crate) slots: Vec<FiberSlotEntry>,
    pub(crate) vacant_slots: Vec<FiberSlot>,
    pub(crate) deletion_lists: Vec<Option<DeletionList>>,
}

impl FiberArena {
    #[must_use]
    pub fn new() -> Self {
        Self {
            arena_id: FiberArenaId::allocate(),
            slots: Vec::new(),
            vacant_slots: Vec::new(),
            deletion_lists: Vec::new(),
        }
    }

    #[must_use]
    pub const fn arena_id(&self) -> FiberArenaId {
        self.arena_id
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.slots
            .iter()
            .filter(|entry| entry.node.is_some())
            .count()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    #[must_use]
    pub fn create_fiber(
        &mut self,
        tag: FiberTag,
        key: Option<ReactKey>,
        pending_props: PropsHandle,
        mode: FiberMode,
    ) -> FiberId {
        let slot = self.vacant_slots.pop().unwrap_or_else(|| {
            let slot = FiberSlot::new(self.slots.len());
            self.slots.push(FiberSlotEntry {
                generation: FiberGeneration::INITIAL,
                node: None,
            });
            slot
        });
        let generation = self.slots[slot.get()].generation;
        let id = FiberId::new(self.arena_id, slot, generation);
        self.slots[slot.get()].node = Some(FiberNode::new(id, tag, key, pending_props, mode));
        id
    }

    pub fn validate_fiber_id(&self, id: FiberId) -> Result<usize, FiberTopologyError> {
        id.validate_arena(self.arena_id)
            .map_err(FiberTopologyError::from)?;
        let entry = self
            .slots
            .get(id.slot().get())
            .ok_or_else(|| FiberIdError::InvalidSlot {
                arena_id: self.arena_id,
                slot: id.slot(),
            })?;

        if entry.generation != id.generation() {
            return Err(FiberIdError::StaleGeneration {
                id,
                current_generation: entry.generation,
            }
            .into());
        }

        if entry.node.is_none() {
            return Err(FiberIdError::VacantSlot { id }.into());
        }

        Ok(id.slot().get())
    }

    pub fn get(&self, id: FiberId) -> Result<&FiberNode, FiberTopologyError> {
        let index = self.validate_fiber_id(id)?;
        Ok(self.slots[index]
            .node
            .as_ref()
            .expect("validated fiber slot is occupied"))
    }

    pub fn get_mut(&mut self, id: FiberId) -> Result<&mut FiberNode, FiberTopologyError> {
        let index = self.validate_fiber_id(id)?;
        Ok(self.slots[index]
            .node
            .as_mut()
            .expect("validated fiber slot is occupied"))
    }

    #[must_use]
    pub fn ids(&self) -> Vec<FiberId> {
        self.slots
            .iter()
            .enumerate()
            .filter_map(|(index, entry)| {
                entry.node.as_ref().map(|node| {
                    FiberId::new(self.arena_id, FiberSlot::new(index), node.id().generation())
                })
            })
            .collect()
    }

    pub fn set_children(
        &mut self,
        parent: FiberId,
        children: &[FiberId],
    ) -> Result<(), FiberTopologyError> {
        self.validate_fiber_id(parent)?;

        let mut seen = HashSet::new();
        for &child in children {
            self.validate_fiber_id(child)?;
            parent
                .reject_self_link(child, "child")
                .map_err(FiberTopologyError::from)?;
            if !seen.insert(child) {
                return Err(FiberTopologyError::DuplicateChild { parent, child });
            }
            if self.is_ancestor(child, parent)? {
                return Err(FiberTopologyError::ParentCycle { parent, child });
            }
            if let Some(current_parent) = self.get(child)?.return_fiber()
                && current_parent != parent
            {
                return Err(FiberTopologyError::AlreadyHasParent {
                    child,
                    current_parent,
                    new_parent: parent,
                });
            }
        }

        let old_children = self.child_ids(parent)?;
        let new_children: HashSet<_> = children.iter().copied().collect();
        for old_child in old_children {
            if !new_children.contains(&old_child) {
                let node = self.get_mut(old_child)?;
                node.set_return_fiber(None);
                node.set_sibling(None);
                node.set_index(0);
            }
        }

        self.get_mut(parent)?.set_child(children.first().copied());

        for (index, &child) in children.iter().enumerate() {
            let sibling = children.get(index + 1).copied();
            let node = self.get_mut(child)?;
            node.set_return_fiber(Some(parent));
            node.set_sibling(sibling);
            node.set_index(index);
        }

        Ok(())
    }

    pub fn append_child(
        &mut self,
        parent: FiberId,
        child: FiberId,
    ) -> Result<(), FiberTopologyError> {
        let mut children = self.child_ids(parent)?;
        children.push(child);
        self.set_children(parent, &children)
    }

    pub fn child_ids(&self, parent: FiberId) -> Result<Vec<FiberId>, FiberTopologyError> {
        self.validate_fiber_id(parent)?;
        let mut children = Vec::new();
        let mut seen = HashSet::new();
        let mut next = self.get(parent)?.child();

        while let Some(child) = next {
            self.validate_fiber_id(child)?;
            if !seen.insert(child) {
                return Err(FiberTopologyError::SiblingCycle {
                    start: parent,
                    repeated: child,
                });
            }

            children.push(child);
            next = self.get(child)?.sibling();
        }

        Ok(children)
    }

    pub fn contains_in_child_chain(
        &self,
        parent: FiberId,
        target: FiberId,
    ) -> Result<bool, FiberTopologyError> {
        Ok(self.child_ids(parent)?.contains(&target))
    }

    pub(crate) fn remove_child_from_chain(
        &mut self,
        parent: FiberId,
        child: FiberId,
    ) -> Result<bool, FiberTopologyError> {
        let mut children = self.child_ids(parent)?;
        let original_len = children.len();
        children.retain(|&id| id != child);
        if children.len() == original_len {
            return Ok(false);
        }

        self.set_children(parent, &children)?;
        let child_node = self.get_mut(child)?;
        child_node.set_sibling(None);
        Ok(true)
    }

    pub fn reclaim_fiber_after_cleanup(&mut self, id: FiberId) -> Result<(), FiberTopologyError> {
        let index = self.validate_fiber_id(id)?;
        let node = self.get(id)?;
        if node.return_fiber().is_some()
            || node.child().is_some()
            || node.sibling().is_some()
            || node.alternate().is_some()
            || node.deletions().is_some()
        {
            return Err(FiberTopologyError::LinkedFiberCannotBeReclaimed { id });
        }
        if let Some(list) = self.is_retained_by_deletion_list(id) {
            return Err(FiberTopologyError::DeletionListRetainsFiber { id, list });
        }

        let next_generation = self.slots[index]
            .generation
            .next()
            .ok_or(FiberTopologyError::GenerationOverflow { id })?;
        self.slots[index].node = None;
        self.slots[index].generation = next_generation;
        self.vacant_slots.push(id.slot());
        Ok(())
    }

    pub(crate) fn replace_fiber_node(
        &mut self,
        id: FiberId,
        mut node: FiberNode,
    ) -> Result<(), FiberTopologyError> {
        let index = self.validate_fiber_id(id)?;
        if node.id() != id {
            return Err(FiberTopologyError::ReplacementIdMismatch {
                expected: id,
                actual: node.id(),
            });
        }
        node.set_deletions(None);
        self.slots[index].node = Some(node);
        Ok(())
    }

    pub(crate) fn is_ancestor(
        &self,
        ancestor: FiberId,
        child: FiberId,
    ) -> Result<bool, FiberTopologyError> {
        self.validate_fiber_id(ancestor)?;
        self.validate_fiber_id(child)?;
        let mut seen = HashSet::new();
        let mut next = Some(child);

        while let Some(id) = next {
            if id == ancestor {
                return Ok(true);
            }
            if !seen.insert(id) {
                return Err(FiberTopologyError::ReturnCycle {
                    start: child,
                    repeated: id,
                });
            }
            next = self.get(id)?.return_fiber();
        }

        Ok(false)
    }

    pub fn validate_topology(&self) -> Result<FiberArenaValidation, FiberTopologyError> {
        let mut owned_children: HashMap<FiberId, FiberId> = HashMap::new();
        let mut live_fibers = 0;

        for id in self.ids() {
            live_fibers += 1;
            let node = self.get(id)?;

            for (field, maybe_link) in [
                ("return", node.return_fiber()),
                ("child", node.child()),
                ("sibling", node.sibling()),
                ("alternate", node.alternate()),
            ] {
                if let Some(link) = maybe_link {
                    id.reject_self_link(link, field)
                        .map_err(FiberTopologyError::from)?;
                    self.validate_fiber_id(link)?;
                }
            }

            if let Some(alternate) = node.alternate() {
                let alternate_node = self.get(alternate)?;
                if alternate_node.alternate() != Some(id) {
                    return Err(FiberTopologyError::NonReciprocalAlternate {
                        fiber: id,
                        alternate,
                    });
                }
                if node.tag() != alternate_node.tag() || node.key() != alternate_node.key() {
                    return Err(FiberTopologyError::AlternateStableIdentityMismatch {
                        fiber: id,
                        alternate,
                    });
                }
            }

            if let Some(list_id) = node.deletions() {
                self.validate_deletion_list_id(list_id)?;
                let list = self
                    .deletion_list(list_id)
                    .ok_or(FiberTopologyError::InvalidDeletionList { id: list_id })?;
                if list.parent() != id {
                    return Err(FiberTopologyError::InvalidDeletionList { id: list_id });
                }
                if !list.is_empty() && !node.flags().contains_all(crate::FiberFlags::CHILD_DELETION)
                {
                    return Err(FiberTopologyError::DeletionListMissingFlag {
                        parent: id,
                        list: list_id,
                    });
                }
                for &deleted in list {
                    self.validate_fiber_id(deleted)?;
                    if self.contains_in_child_chain(id, deleted)? {
                        return Err(FiberTopologyError::DeletedChildStillInFinishedChain {
                            parent: id,
                            deleted,
                        });
                    }
                }
            }

            let children = self.child_ids(id)?;
            for (expected_index, child) in children.into_iter().enumerate() {
                let child_node = self.get(child)?;
                if child_node.return_fiber() != Some(id) {
                    return Err(FiberTopologyError::MixedParentSiblingChain {
                        parent: id,
                        child,
                        actual_parent: child_node.return_fiber(),
                    });
                }
                if child_node.index() != expected_index {
                    return Err(FiberTopologyError::InvalidIndex {
                        parent: id,
                        child,
                        expected: expected_index,
                        actual: child_node.index(),
                    });
                }
                if let Some(previous_parent) = owned_children.insert(child, id) {
                    return Err(FiberTopologyError::DuplicateChildOwnership {
                        child,
                        first_parent: previous_parent,
                        second_parent: id,
                    });
                }
            }
        }

        Ok(FiberArenaValidation {
            live_fibers,
            deletion_lists: self
                .deletion_lists
                .iter()
                .filter(|list| list.is_some())
                .count(),
        })
    }
}

impl Default for FiberArena {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FiberArenaValidation {
    live_fibers: usize,
    deletion_lists: usize,
}

impl FiberArenaValidation {
    #[must_use]
    pub const fn live_fibers(self) -> usize {
        self.live_fibers
    }

    #[must_use]
    pub const fn deletion_lists(self) -> usize {
        self.deletion_lists
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FiberTopologyError {
    Identity(FiberIdError),
    DuplicateChild {
        parent: FiberId,
        child: FiberId,
    },
    AlreadyHasParent {
        child: FiberId,
        current_parent: FiberId,
        new_parent: FiberId,
    },
    ParentCycle {
        parent: FiberId,
        child: FiberId,
    },
    ReturnCycle {
        start: FiberId,
        repeated: FiberId,
    },
    SiblingCycle {
        start: FiberId,
        repeated: FiberId,
    },
    MixedParentSiblingChain {
        parent: FiberId,
        child: FiberId,
        actual_parent: Option<FiberId>,
    },
    DuplicateChildOwnership {
        child: FiberId,
        first_parent: FiberId,
        second_parent: FiberId,
    },
    NonReciprocalAlternate {
        fiber: FiberId,
        alternate: FiberId,
    },
    AlternateStableIdentityMismatch {
        fiber: FiberId,
        alternate: FiberId,
    },
    InvalidDeletionList {
        id: DeletionListId,
    },
    DeletionListMissingFlag {
        parent: FiberId,
        list: DeletionListId,
    },
    DeletedChildStillInFinishedChain {
        parent: FiberId,
        deleted: FiberId,
    },
    InvalidIndex {
        parent: FiberId,
        child: FiberId,
        expected: usize,
        actual: usize,
    },
    LinkedFiberCannotBeReclaimed {
        id: FiberId,
    },
    DeletionListRetainsFiber {
        id: FiberId,
        list: DeletionListId,
    },
    GenerationOverflow {
        id: FiberId,
    },
    ReplacementIdMismatch {
        expected: FiberId,
        actual: FiberId,
    },
}

impl From<FiberIdError> for FiberTopologyError {
    fn from(error: FiberIdError) -> Self {
        Self::Identity(error)
    }
}

impl Display for FiberTopologyError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Identity(error) => Display::fmt(error, formatter),
            Self::DuplicateChild { parent, child } => write!(
                formatter,
                "fiber {} appears more than once under parent {}",
                child.slot().get(),
                parent.slot().get()
            ),
            Self::AlreadyHasParent {
                child,
                current_parent,
                new_parent,
            } => write!(
                formatter,
                "fiber {} already has parent {}, cannot attach to {}",
                child.slot().get(),
                current_parent.slot().get(),
                new_parent.slot().get()
            ),
            Self::ParentCycle { parent, child } => write!(
                formatter,
                "attaching fiber {} under {} would create a parent cycle",
                child.slot().get(),
                parent.slot().get()
            ),
            Self::ReturnCycle { start, repeated } => write!(
                formatter,
                "return chain from fiber {} repeats fiber {}",
                start.slot().get(),
                repeated.slot().get()
            ),
            Self::SiblingCycle { start, repeated } => write!(
                formatter,
                "child chain under fiber {} repeats sibling {}",
                start.slot().get(),
                repeated.slot().get()
            ),
            Self::MixedParentSiblingChain {
                parent,
                child,
                actual_parent,
            } => write!(
                formatter,
                "fiber {} in child chain for {} has return {:?}",
                child.slot().get(),
                parent.slot().get(),
                actual_parent.map(|id| id.slot().get())
            ),
            Self::DuplicateChildOwnership {
                child,
                first_parent,
                second_parent,
            } => write!(
                formatter,
                "fiber {} is owned by both parent {} and parent {}",
                child.slot().get(),
                first_parent.slot().get(),
                second_parent.slot().get()
            ),
            Self::NonReciprocalAlternate { fiber, alternate } => write!(
                formatter,
                "alternate link from fiber {} to {} is not reciprocal",
                fiber.slot().get(),
                alternate.slot().get()
            ),
            Self::AlternateStableIdentityMismatch { fiber, alternate } => write!(
                formatter,
                "alternate pair {} and {} disagree on stable identity",
                fiber.slot().get(),
                alternate.slot().get()
            ),
            Self::InvalidDeletionList { id } => write!(
                formatter,
                "deletion list {} is invalid for arena {}",
                id.index(),
                id.arena_id().get()
            ),
            Self::DeletionListMissingFlag { parent, list } => write!(
                formatter,
                "parent {} has non-empty deletion list {} without ChildDeletion",
                parent.slot().get(),
                list.index()
            ),
            Self::DeletedChildStillInFinishedChain { parent, deleted } => write!(
                formatter,
                "deleted fiber {} is still in finished child chain for parent {}",
                deleted.slot().get(),
                parent.slot().get()
            ),
            Self::InvalidIndex {
                parent,
                child,
                expected,
                actual,
            } => write!(
                formatter,
                "fiber {} under parent {} has index {}, expected {}",
                child.slot().get(),
                parent.slot().get(),
                actual,
                expected
            ),
            Self::LinkedFiberCannotBeReclaimed { id } => write!(
                formatter,
                "fiber {} cannot be reclaimed while topology links remain",
                id.slot().get()
            ),
            Self::DeletionListRetainsFiber { id, list } => write!(
                formatter,
                "fiber {} cannot be reclaimed while deletion list {} retains it",
                id.slot().get(),
                list.index()
            ),
            Self::GenerationOverflow { id } => write!(
                formatter,
                "fiber {} generation overflowed during reclaim",
                id.slot().get()
            ),
            Self::ReplacementIdMismatch { expected, actual } => write!(
                formatter,
                "replacement fiber id {} does not match slot id {}",
                actual.slot().get(),
                expected.slot().get()
            ),
        }
    }
}

impl Error for FiberTopologyError {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{FiberFlags, Lanes};

    #[test]
    fn fiber_arena_allocates_unique_ids_and_rejects_cross_arena_ids() {
        let mut first_arena = FiberArena::new();
        let mut second_arena = FiberArena::new();
        let first = first_arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let second =
            first_arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);
        let foreign =
            second_arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);

        assert_ne!(first, second);
        assert!(matches!(
            first_arena.get(foreign),
            Err(FiberTopologyError::Identity(
                FiberIdError::WrongArena { .. }
            ))
        ));
    }

    #[test]
    fn fiber_arena_rejects_stale_generations_after_reclaim() {
        let mut arena = FiberArena::new();
        let first = arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);

        arena.reclaim_fiber_after_cleanup(first).unwrap();
        let second = arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);

        assert_eq!(first.slot(), second.slot());
        assert_ne!(first.generation(), second.generation());
        assert!(matches!(
            arena.get(first),
            Err(FiberTopologyError::Identity(
                FiberIdError::StaleGeneration { .. }
            ))
        ));
    }

    #[test]
    fn fiber_arena_sets_parent_sibling_order_and_indices() {
        let mut arena = FiberArena::new();
        let parent = arena.create_fiber(
            FiberTag::HostComponent,
            Some(ReactKey::from_normalized("parent")),
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let first = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(1),
            FiberMode::NO,
        );
        let second = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(2),
            FiberMode::NO,
        );

        arena.set_children(parent, &[first, second]).unwrap();

        assert_eq!(arena.get(parent).unwrap().child(), Some(first));
        assert_eq!(arena.get(first).unwrap().return_fiber(), Some(parent));
        assert_eq!(arena.get(first).unwrap().sibling(), Some(second));
        assert_eq!(arena.get(first).unwrap().index(), 0);
        assert_eq!(arena.get(second).unwrap().return_fiber(), Some(parent));
        assert_eq!(arena.get(second).unwrap().sibling(), None);
        assert_eq!(arena.get(second).unwrap().index(), 1);
        assert_eq!(arena.validate_topology().unwrap().live_fibers(), 3);
    }

    #[test]
    fn fiber_arena_rejects_self_duplicate_and_multi_parent_children() {
        let mut arena = FiberArena::new();
        let first_parent = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let second_parent = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let child = arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);

        assert!(matches!(
            arena.set_children(first_parent, &[first_parent]),
            Err(FiberTopologyError::Identity(FiberIdError::SelfLink { .. }))
        ));
        assert_eq!(
            arena.set_children(first_parent, &[child, child]),
            Err(FiberTopologyError::DuplicateChild {
                parent: first_parent,
                child
            })
        );
        arena.set_children(first_parent, &[child]).unwrap();
        assert_eq!(
            arena.set_children(second_parent, &[child]),
            Err(FiberTopologyError::AlreadyHasParent {
                child,
                current_parent: first_parent,
                new_parent: second_parent
            })
        );
    }

    #[test]
    fn fiber_arena_validates_lane_and_flag_storage_without_host_types() {
        let mut arena = FiberArena::new();
        let fiber = arena.create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(11),
            FiberMode::CONCURRENT,
        );
        let node = arena.get_mut(fiber).unwrap();
        node.set_lanes(Lanes::SYNC);
        node.set_child_lanes(Lanes::DEFAULT);
        node.merge_flags(FiberFlags::PLACEMENT);

        let node = arena.get(fiber).unwrap();
        assert_eq!(node.lanes(), Lanes::SYNC);
        assert_eq!(node.child_lanes(), Lanes::DEFAULT);
        assert_eq!(node.flags(), FiberFlags::PLACEMENT);
    }
}
