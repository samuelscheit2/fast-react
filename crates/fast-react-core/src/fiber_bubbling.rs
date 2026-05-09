//! Pure fiber lane and flag bubbling helpers.

use crate::{FiberArena, FiberFlags, FiberId, FiberTopologyError, Lanes};

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct FiberBubbledProperties {
    child_lanes: Lanes,
    subtree_flags: FiberFlags,
}

impl FiberBubbledProperties {
    #[must_use]
    pub const fn new(child_lanes: Lanes, subtree_flags: FiberFlags) -> Self {
        Self {
            child_lanes,
            subtree_flags,
        }
    }

    #[must_use]
    pub const fn child_lanes(self) -> Lanes {
        self.child_lanes
    }

    #[must_use]
    pub const fn subtree_flags(self) -> FiberFlags {
        self.subtree_flags
    }
}

pub fn bubble_child_lanes(
    arena: &FiberArena,
    parent: FiberId,
) -> Result<Lanes, FiberTopologyError> {
    let mut child_lanes = Lanes::NO;

    for child in arena.child_ids(parent)? {
        let child_node = arena.get(child)?;
        child_lanes = child_lanes
            .merge(child_node.lanes())
            .merge(child_node.child_lanes());
    }

    Ok(child_lanes)
}

pub fn bubble_subtree_flags(
    arena: &FiberArena,
    parent: FiberId,
) -> Result<FiberFlags, FiberTopologyError> {
    let mut subtree_flags = FiberFlags::NO;

    for child in arena.child_ids(parent)? {
        let child_node = arena.get(child)?;
        subtree_flags |= child_node.flags() | child_node.subtree_flags();
    }

    Ok(subtree_flags)
}

pub fn bubble_properties(
    arena: &FiberArena,
    parent: FiberId,
) -> Result<FiberBubbledProperties, FiberTopologyError> {
    Ok(FiberBubbledProperties::new(
        bubble_child_lanes(arena, parent)?,
        bubble_subtree_flags(arena, parent)?,
    ))
}

#[must_use]
pub const fn preserve_static_subtree_flags(flags: FiberFlags) -> FiberFlags {
    flags.static_flags()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{FiberArena, FiberMode, FiberTag, PropsHandle};

    #[test]
    fn fiber_bubbling_bubbles_child_lanes_from_descendants() {
        let mut arena = FiberArena::new();
        let parent = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let first = arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);
        let second = arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);
        arena.get_mut(first).unwrap().set_lanes(Lanes::SYNC);
        arena.get_mut(second).unwrap().set_lanes(Lanes::DEFAULT);
        arena
            .get_mut(second)
            .unwrap()
            .set_child_lanes(Lanes::TRANSITION);
        arena.set_children(parent, &[first, second]).unwrap();

        assert_eq!(
            bubble_child_lanes(&arena, parent).unwrap(),
            Lanes::SYNC.merge(Lanes::DEFAULT).merge(Lanes::TRANSITION)
        );
    }

    #[test]
    fn fiber_bubbling_ignores_parent_deletion_lists() {
        let mut arena = FiberArena::new();
        let parent = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let kept = arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);
        let deleted =
            arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);
        arena.get_mut(kept).unwrap().set_lanes(Lanes::SYNC);
        arena.get_mut(deleted).unwrap().set_lanes(Lanes::DEFAULT);
        arena.set_children(parent, &[kept, deleted]).unwrap();
        arena.mark_child_for_deletion(parent, deleted).unwrap();

        assert_eq!(bubble_child_lanes(&arena, parent).unwrap(), Lanes::SYNC);
    }

    #[test]
    fn fiber_bubbling_bubbles_subtree_flags_from_children() {
        let mut arena = FiberArena::new();
        let parent = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let child = arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);
        arena
            .get_mut(child)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT);
        arena
            .get_mut(child)
            .unwrap()
            .set_subtree_flags(FiberFlags::PASSIVE);
        arena.set_children(parent, &[child]).unwrap();

        assert_eq!(
            bubble_subtree_flags(&arena, parent).unwrap(),
            FiberFlags::PLACEMENT | FiberFlags::PASSIVE
        );
        assert_eq!(
            bubble_properties(&arena, parent).unwrap().subtree_flags(),
            FiberFlags::PLACEMENT | FiberFlags::PASSIVE
        );
    }

    #[test]
    fn fiber_bubbling_static_preservation_uses_core_fiber_flag_mask() {
        let flags = FiberFlags::PLACEMENT | FiberFlags::LAYOUT_STATIC | FiberFlags::PASSIVE_STATIC;

        assert_eq!(
            preserve_static_subtree_flags(flags),
            FiberFlags::LAYOUT_STATIC | FiberFlags::PASSIVE_STATIC
        );
    }
}
