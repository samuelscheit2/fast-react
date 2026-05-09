//! Parent-owned deletion lists for fibers.

use std::slice;

use crate::{FiberArenaId, FiberFlags, FiberId, FiberTopologyError};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct DeletionListId {
    arena_id: FiberArenaId,
    index: usize,
}

impl DeletionListId {
    #[must_use]
    pub const fn new(arena_id: FiberArenaId, index: usize) -> Self {
        Self { arena_id, index }
    }

    #[must_use]
    pub const fn arena_id(self) -> FiberArenaId {
        self.arena_id
    }

    #[must_use]
    pub const fn index(self) -> usize {
        self.index
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DeletionList {
    id: DeletionListId,
    parent: FiberId,
    deleted: Vec<FiberId>,
}

impl DeletionList {
    #[must_use]
    pub(crate) fn new(id: DeletionListId, parent: FiberId) -> Self {
        Self {
            id,
            parent,
            deleted: Vec::new(),
        }
    }

    #[must_use]
    pub const fn id(&self) -> DeletionListId {
        self.id
    }

    #[must_use]
    pub const fn parent(&self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.deleted.is_empty()
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.deleted.len()
    }

    #[must_use]
    pub fn contains(&self, id: FiberId) -> bool {
        self.deleted.contains(&id)
    }

    pub fn iter(&self) -> slice::Iter<'_, FiberId> {
        self.deleted.iter()
    }

    pub(crate) fn push_unique(&mut self, id: FiberId) {
        if !self.contains(id) {
            self.deleted.push(id);
        }
    }
}

impl<'a> IntoIterator for &'a DeletionList {
    type Item = &'a FiberId;
    type IntoIter = slice::Iter<'a, FiberId>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

impl crate::FiberArena {
    pub fn mark_child_for_deletion(
        &mut self,
        parent: FiberId,
        deleted: FiberId,
    ) -> Result<DeletionListId, FiberTopologyError> {
        self.validate_fiber_id(parent)?;
        self.validate_fiber_id(deleted)?;
        parent
            .reject_self_link(deleted, "deletion")
            .map_err(FiberTopologyError::from)?;

        if self.contains_in_child_chain(parent, deleted)? {
            self.remove_child_from_chain(parent, deleted)?;
        }

        let list_id = self.ensure_deletion_list(parent)?;
        let list = self
            .deletion_list_mut(list_id)
            .ok_or(FiberTopologyError::InvalidDeletionList { id: list_id })?;
        list.push_unique(deleted);

        let parent_node = self.get_mut(parent)?;
        parent_node.merge_flags(FiberFlags::CHILD_DELETION);
        let deleted_node = self.get_mut(deleted)?;
        deleted_node.set_return_fiber(Some(parent));
        deleted_node.set_sibling(None);

        Ok(list_id)
    }

    pub fn clear_deletions_after_cleanup(
        &mut self,
        parent: FiberId,
    ) -> Result<(), FiberTopologyError> {
        let list_id = self.get(parent)?.deletions();
        if let Some(list_id) = list_id {
            self.validate_deletion_list_id(list_id)?;
            self.deletion_lists[list_id.index()] = None;
            let parent_node = self.get_mut(parent)?;
            parent_node.set_deletions(None);
            parent_node.set_flags(parent_node.flags() - FiberFlags::CHILD_DELETION);
        }

        Ok(())
    }

    #[must_use]
    pub fn deletion_list(&self, id: DeletionListId) -> Option<&DeletionList> {
        if id.arena_id() != self.arena_id() {
            return None;
        }

        self.deletion_lists.get(id.index()).and_then(Option::as_ref)
    }

    #[must_use]
    pub(crate) fn deletion_list_mut(&mut self, id: DeletionListId) -> Option<&mut DeletionList> {
        if id.arena_id() != self.arena_id() {
            return None;
        }

        self.deletion_lists
            .get_mut(id.index())
            .and_then(Option::as_mut)
    }

    pub(crate) fn ensure_deletion_list(
        &mut self,
        parent: FiberId,
    ) -> Result<DeletionListId, FiberTopologyError> {
        if let Some(id) = self.get(parent)?.deletions() {
            self.validate_deletion_list_id(id)?;
            return Ok(id);
        }

        let id = DeletionListId::new(self.arena_id(), self.deletion_lists.len());
        self.deletion_lists
            .push(Some(DeletionList::new(id, parent)));
        self.get_mut(parent)?.set_deletions(Some(id));
        Ok(id)
    }

    pub(crate) fn validate_deletion_list_id(
        &self,
        id: DeletionListId,
    ) -> Result<(), FiberTopologyError> {
        if id.arena_id() != self.arena_id() {
            return Err(FiberTopologyError::InvalidDeletionList { id });
        }

        if self.deletion_list(id).is_none() {
            return Err(FiberTopologyError::InvalidDeletionList { id });
        }

        Ok(())
    }

    pub(crate) fn is_retained_by_deletion_list(&self, id: FiberId) -> Option<DeletionListId> {
        self.deletion_lists
            .iter()
            .filter_map(Option::as_ref)
            .find(|list| list.contains(id))
            .map(DeletionList::id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{FiberArena, FiberMode, FiberTag, PropsHandle};

    #[test]
    fn fiber_deletions_are_parent_owned_and_ordered() {
        let mut arena = FiberArena::new();
        let parent = arena.create_fiber(
            FiberTag::HostComponent,
            None,
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

        let list_id = arena.mark_child_for_deletion(parent, first).unwrap();
        arena.mark_child_for_deletion(parent, second).unwrap();

        let deleted = arena.deletion_list(list_id).unwrap();
        assert_eq!(deleted.parent(), parent);
        assert_eq!(
            deleted.iter().copied().collect::<Vec<_>>(),
            vec![first, second]
        );
        assert_eq!(arena.get(parent).unwrap().child(), None);
        assert!(
            arena
                .get(parent)
                .unwrap()
                .flags()
                .contains_all(FiberFlags::CHILD_DELETION)
        );
    }

    #[test]
    fn fiber_deletions_remain_reachable_until_explicit_cleanup() {
        let mut arena = FiberArena::new();
        let parent = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let deleted =
            arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);

        let list_id = arena.mark_child_for_deletion(parent, deleted).unwrap();
        assert_eq!(arena.deletion_list(list_id).unwrap().len(), 1);
        assert!(arena.reclaim_fiber_after_cleanup(deleted).is_err());

        arena.clear_deletions_after_cleanup(parent).unwrap();
        assert!(arena.deletion_list(list_id).is_none());
    }
}
