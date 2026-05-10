//! Lane selection for internal root updates.
//!
//! This is a narrow data hook for the HostRoot update slice. Event dispatch,
//! transitions, render-phase updates, and public Scheduler integration are
//! intentionally outside this worker.

use fast_react_core::{FiberMode, FiberNode, Lane};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UpdatePriorityState {
    current_update_lane: Lane,
    default_update_lane: Lane,
}

impl UpdatePriorityState {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            current_update_lane: Lane::NO,
            default_update_lane: Lane::DEFAULT,
        }
    }

    #[must_use]
    pub const fn with_current_update_lane(mut self, lane: Lane) -> Self {
        self.current_update_lane = lane;
        self
    }

    #[must_use]
    pub const fn with_default_update_lane(mut self, lane: Lane) -> Self {
        self.default_update_lane = lane;
        self
    }

    #[must_use]
    pub const fn current_update_lane(self) -> Lane {
        self.current_update_lane
    }

    #[must_use]
    pub const fn default_update_lane(self) -> Lane {
        self.default_update_lane
    }
}

impl Default for UpdatePriorityState {
    fn default() -> Self {
        Self::new()
    }
}

#[must_use]
pub fn request_update_lane(fiber: &FiberNode, priority: UpdatePriorityState) -> Lane {
    if priority.current_update_lane().is_non_empty() {
        return priority.current_update_lane();
    }

    if fiber.mode().contains_any(FiberMode::CONCURRENT) {
        priority.default_update_lane()
    } else {
        Lane::SYNC
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use fast_react_core::{
        FiberArenaId, FiberGeneration, FiberId, FiberSlot, FiberTag, PropsHandle,
    };

    fn fiber(mode: FiberMode) -> FiberNode {
        FiberNode::new(
            FiberId::new(
                FiberArenaId::new(1).unwrap(),
                FiberSlot::new(0),
                FiberGeneration::INITIAL,
            ),
            FiberTag::HostRoot,
            None,
            PropsHandle::NONE,
            mode,
        )
    }

    #[test]
    fn update_priority_defaults_concurrent_root_updates_to_default_lane() {
        assert_eq!(
            request_update_lane(&fiber(FiberMode::CONCURRENT), UpdatePriorityState::new()),
            Lane::DEFAULT
        );
    }

    #[test]
    fn update_priority_uses_sync_lane_for_non_concurrent_roots() {
        assert_eq!(
            request_update_lane(&fiber(FiberMode::NO), UpdatePriorityState::new()),
            Lane::SYNC
        );
    }

    #[test]
    fn update_priority_current_update_lane_overrides_default_lane() {
        let priority = UpdatePriorityState::new().with_current_update_lane(Lane::TRANSITION_1);

        assert_eq!(
            request_update_lane(&fiber(FiberMode::CONCURRENT), priority),
            Lane::TRANSITION_1
        );
    }
}
