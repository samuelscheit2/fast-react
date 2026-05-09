//! Current/work-in-progress alternate links for fibers.

use crate::{FiberArena, FiberId, FiberIdError, FiberTopologyError, PropsHandle};

impl FiberArena {
    pub fn link_alternates(
        &mut self,
        first: FiberId,
        second: FiberId,
    ) -> Result<(), FiberTopologyError> {
        self.validate_fiber_id(first)?;
        self.validate_fiber_id(second)?;
        first
            .reject_self_link(second, "alternate")
            .map_err(FiberTopologyError::from)?;
        self.validate_alternate_stable_identity(first, second)?;

        self.get_mut(first)?.set_alternate(Some(second));
        self.get_mut(second)?.set_alternate(Some(first));
        Ok(())
    }

    pub fn create_work_in_progress(
        &mut self,
        current: FiberId,
        pending_props: PropsHandle,
    ) -> Result<FiberId, FiberTopologyError> {
        self.validate_fiber_id(current)?;

        if let Some(existing) = self.get(current)?.alternate() {
            self.validate_alternate_pair(current, existing)?;
            let replacement = self
                .get(current)?
                .clone_for_alternate(existing, pending_props);
            self.replace_fiber_node(existing, replacement)?;
            self.get_mut(current)?.set_alternate(Some(existing));
            return Ok(existing);
        }

        let current_node = self.get(current)?.clone();
        let work_in_progress = self.create_fiber(
            current_node.tag(),
            current_node.key().cloned(),
            pending_props,
            current_node.mode(),
        );
        let replacement = current_node.clone_for_alternate(work_in_progress, pending_props);
        self.replace_fiber_node(work_in_progress, replacement)?;
        self.get_mut(current)?.set_alternate(Some(work_in_progress));
        Ok(work_in_progress)
    }

    pub fn validate_alternate_pair(
        &self,
        first: FiberId,
        second: FiberId,
    ) -> Result<(), FiberTopologyError> {
        self.validate_fiber_id(first)?;
        self.validate_fiber_id(second)?;
        first
            .reject_self_link(second, "alternate")
            .map_err(FiberTopologyError::from)?;
        self.validate_alternate_stable_identity(first, second)?;

        if self.get(first)?.alternate() != Some(second) {
            return Err(FiberTopologyError::NonReciprocalAlternate {
                fiber: first,
                alternate: second,
            });
        }
        if self.get(second)?.alternate() != Some(first) {
            return Err(FiberTopologyError::NonReciprocalAlternate {
                fiber: second,
                alternate: first,
            });
        }

        Ok(())
    }

    fn validate_alternate_stable_identity(
        &self,
        first: FiberId,
        second: FiberId,
    ) -> Result<(), FiberTopologyError> {
        if first.arena_id() != self.arena_id() {
            return Err(FiberIdError::WrongArena {
                expected: self.arena_id(),
                actual: first.arena_id(),
            }
            .into());
        }
        if second.arena_id() != self.arena_id() {
            return Err(FiberIdError::WrongArena {
                expected: self.arena_id(),
                actual: second.arena_id(),
            }
            .into());
        }

        let first_node = self.get(first)?;
        let second_node = self.get(second)?;
        if first_node.tag() != second_node.tag() || first_node.key() != second_node.key() {
            return Err(FiberTopologyError::AlternateStableIdentityMismatch {
                fiber: first,
                alternate: second,
            });
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{FiberArena, FiberMode, FiberTag, PropsHandle, ReactKey};

    #[test]
    fn fiber_alternate_create_work_in_progress_links_reciprocally() {
        let mut arena = FiberArena::new();
        let current = arena.create_fiber(
            FiberTag::HostComponent,
            Some(ReactKey::from_normalized("current")),
            PropsHandle::from_raw(1),
            FiberMode::CONCURRENT,
        );

        let work_in_progress = arena
            .create_work_in_progress(current, PropsHandle::from_raw(2))
            .unwrap();

        assert_ne!(current, work_in_progress);
        assert_eq!(
            arena.get(current).unwrap().alternate(),
            Some(work_in_progress)
        );
        assert_eq!(
            arena.get(work_in_progress).unwrap().alternate(),
            Some(current)
        );
        assert_eq!(
            arena.get(work_in_progress).unwrap().pending_props(),
            PropsHandle::from_raw(2)
        );
        assert_eq!(arena.validate_topology().unwrap().live_fibers(), 2);
    }

    #[test]
    fn fiber_alternate_reuses_existing_work_in_progress() {
        let mut arena = FiberArena::new();
        let current = arena.create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(1),
            FiberMode::NO,
        );
        let first = arena
            .create_work_in_progress(current, PropsHandle::from_raw(2))
            .unwrap();
        let second = arena
            .create_work_in_progress(current, PropsHandle::from_raw(3))
            .unwrap();

        assert_eq!(first, second);
        assert_eq!(
            arena.get(second).unwrap().pending_props(),
            PropsHandle::from_raw(3)
        );
        assert_eq!(
            arena.get(current).unwrap().pending_props(),
            PropsHandle::from_raw(1)
        );
    }

    #[test]
    fn fiber_alternate_rejects_stable_identity_mismatch() {
        let mut arena = FiberArena::new();
        let first = arena.create_fiber(
            FiberTag::HostComponent,
            Some(ReactKey::from_normalized("a")),
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let second = arena.create_fiber(
            FiberTag::HostText,
            Some(ReactKey::from_normalized("a")),
            PropsHandle::NONE,
            FiberMode::NO,
        );

        assert_eq!(
            arena.link_alternates(first, second),
            Err(FiberTopologyError::AlternateStableIdentityMismatch {
                fiber: first,
                alternate: second
            })
        );
    }

    #[test]
    fn fiber_alternate_edits_do_not_mutate_current_topology() {
        let mut arena = FiberArena::new();
        let current = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let current_child = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(1),
            FiberMode::NO,
        );
        arena.set_children(current, &[current_child]).unwrap();

        let work_in_progress = arena
            .create_work_in_progress(current, PropsHandle::from_raw(2))
            .unwrap();
        let wip_child = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(3),
            FiberMode::NO,
        );
        arena.set_children(work_in_progress, &[wip_child]).unwrap();

        assert_eq!(arena.get(current).unwrap().child(), Some(current_child));
        assert_eq!(
            arena.get(work_in_progress).unwrap().child(),
            Some(wip_child)
        );
    }
}
