//! React 19.2.6 lane-backed event priority primitives.
//!
//! These constants and helpers mirror
//! `packages/react-reconciler/src/ReactEventPriorities.js` from the React
//! `v19.2.6` source tag. Event priorities are internal React lanes, not public
//! `scheduler` package priority values.

use crate::{Lane, Lanes};

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub struct EventPriority(Lane);

impl EventPriority {
    pub const NO: Self = Self(Lane::NO);
    pub const DISCRETE: Self = Self(Lane::SYNC);
    pub const CONTINUOUS: Self = Self(Lane::INPUT_CONTINUOUS);
    pub const DEFAULT: Self = Self(Lane::DEFAULT);
    pub const IDLE: Self = Self(Lane::IDLE);

    #[must_use]
    pub const fn from_lane(lane: Lane) -> Option<Self> {
        if lane.bits() == Self::NO.lane().bits()
            || lane.bits() == Self::DISCRETE.lane().bits()
            || lane.bits() == Self::CONTINUOUS.lane().bits()
            || lane.bits() == Self::DEFAULT.lane().bits()
            || lane.bits() == Self::IDLE.lane().bits()
        {
            Some(Self(lane))
        } else {
            None
        }
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
    pub const fn is_no(self) -> bool {
        self.0.bits() == Self::NO.0.bits()
    }

    #[must_use]
    pub const fn higher(self, other: Self) -> Self {
        higher_event_priority(self, other)
    }

    #[must_use]
    pub const fn lower(self, other: Self) -> Self {
        lower_event_priority(self, other)
    }

    #[must_use]
    pub const fn is_higher_than(self, other: Self) -> bool {
        is_higher_event_priority(self, other)
    }
}

impl From<EventPriority> for Lane {
    fn from(priority: EventPriority) -> Self {
        priority.lane()
    }
}

impl From<EventPriority> for Lanes {
    fn from(priority: EventPriority) -> Self {
        priority.lanes()
    }
}

#[must_use]
pub const fn higher_event_priority(a: EventPriority, b: EventPriority) -> EventPriority {
    if a.lane().bits() != Lane::NO.bits() && a.lane().bits() < b.lane().bits() {
        a
    } else {
        b
    }
}

#[must_use]
pub const fn lower_event_priority(a: EventPriority, b: EventPriority) -> EventPriority {
    if a.lane().bits() == Lane::NO.bits() || a.lane().bits() > b.lane().bits() {
        a
    } else {
        b
    }
}

#[must_use]
pub const fn is_higher_event_priority(a: EventPriority, b: EventPriority) -> bool {
    a.lane().bits() != Lane::NO.bits() && a.lane().bits() < b.lane().bits()
}

#[must_use]
pub const fn event_priority_to_lane(update_priority: EventPriority) -> Lane {
    update_priority.lane()
}

#[must_use]
pub const fn lanes_to_event_priority(lanes: Lanes) -> EventPriority {
    let lane = EventPriority(lanes.highest_priority_lane());
    if !is_higher_event_priority(EventPriority::DISCRETE, lane) {
        EventPriority::DISCRETE
    } else if !is_higher_event_priority(EventPriority::CONTINUOUS, lane) {
        EventPriority::CONTINUOUS
    } else if lane.lane().to_lanes().includes_non_idle_work() {
        EventPriority::DEFAULT
    } else {
        EventPriority::IDLE
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn constants_match_react_19_2_6_event_priorities() {
        let expected = [
            ("NoEventPriority", EventPriority::NO, Lane::NO, 0),
            (
                "DiscreteEventPriority",
                EventPriority::DISCRETE,
                Lane::SYNC,
                0b0000000000000000000000000000010,
            ),
            (
                "ContinuousEventPriority",
                EventPriority::CONTINUOUS,
                Lane::INPUT_CONTINUOUS,
                0b0000000000000000000000000001000,
            ),
            (
                "DefaultEventPriority",
                EventPriority::DEFAULT,
                Lane::DEFAULT,
                0b0000000000000000000000000100000,
            ),
            (
                "IdleEventPriority",
                EventPriority::IDLE,
                Lane::IDLE,
                0b0010000000000000000000000000000,
            ),
        ];

        for (name, priority, lane, bits) in expected {
            assert_eq!(priority.lane(), lane, "{name}");
            assert_eq!(priority.lane().bits(), bits, "{name}");
            assert_eq!(priority.lanes(), lane.to_lanes(), "{name}");
            assert_eq!(EventPriority::from_lane(lane), Some(priority), "{name}");
            assert_eq!(event_priority_to_lane(priority), lane, "{name}");
            assert_eq!(Lane::from(priority), lane, "{name}");
            assert_eq!(Lanes::from(priority), lane.to_lanes(), "{name}");
        }
    }

    #[test]
    fn lane_conversion_rejects_non_event_priority_lanes() {
        for lane in Lane::ALL {
            let expected = if lane == Lane::SYNC {
                Some(EventPriority::DISCRETE)
            } else if lane == Lane::INPUT_CONTINUOUS {
                Some(EventPriority::CONTINUOUS)
            } else if lane == Lane::DEFAULT {
                Some(EventPriority::DEFAULT)
            } else if lane == Lane::IDLE {
                Some(EventPriority::IDLE)
            } else {
                None
            };
            assert_eq!(EventPriority::from_lane(lane), expected, "{lane:?}");
        }
    }

    #[test]
    fn ordering_helpers_match_react_event_priority_semantics() {
        assert_eq!(
            higher_event_priority(EventPriority::DISCRETE, EventPriority::CONTINUOUS),
            EventPriority::DISCRETE
        );
        assert_eq!(
            higher_event_priority(EventPriority::CONTINUOUS, EventPriority::DISCRETE),
            EventPriority::DISCRETE
        );
        assert_eq!(
            higher_event_priority(EventPriority::DISCRETE, EventPriority::DISCRETE),
            EventPriority::DISCRETE
        );
        assert_eq!(
            lower_event_priority(EventPriority::DISCRETE, EventPriority::CONTINUOUS),
            EventPriority::CONTINUOUS
        );
        assert_eq!(
            lower_event_priority(EventPriority::IDLE, EventPriority::DEFAULT),
            EventPriority::IDLE
        );
        assert_eq!(
            lower_event_priority(EventPriority::NO, EventPriority::NO),
            EventPriority::NO
        );
        assert!(is_higher_event_priority(
            EventPriority::CONTINUOUS,
            EventPriority::DEFAULT
        ));
        assert!(!is_higher_event_priority(
            EventPriority::DEFAULT,
            EventPriority::CONTINUOUS
        ));

        assert_eq!(
            EventPriority::DISCRETE.higher(EventPriority::DEFAULT),
            EventPriority::DISCRETE
        );
        assert_eq!(
            EventPriority::DISCRETE.lower(EventPriority::DEFAULT),
            EventPriority::DEFAULT
        );
        assert!(EventPriority::DISCRETE.is_higher_than(EventPriority::DEFAULT));
    }

    #[test]
    fn no_event_priority_keeps_react_zero_sentinel_behavior() {
        assert!(EventPriority::NO.is_no());
        assert!(!EventPriority::DEFAULT.is_no());
        assert!(!is_higher_event_priority(
            EventPriority::NO,
            EventPriority::DISCRETE
        ));
        assert!(!is_higher_event_priority(
            EventPriority::DISCRETE,
            EventPriority::NO
        ));
        assert_eq!(
            higher_event_priority(EventPriority::NO, EventPriority::DEFAULT),
            EventPriority::DEFAULT
        );
        assert_eq!(
            higher_event_priority(EventPriority::DEFAULT, EventPriority::NO),
            EventPriority::NO
        );
        assert_eq!(
            lower_event_priority(EventPriority::NO, EventPriority::DEFAULT),
            EventPriority::NO
        );
        assert_eq!(
            lower_event_priority(EventPriority::DEFAULT, EventPriority::NO),
            EventPriority::DEFAULT
        );
    }

    #[test]
    fn lanes_to_event_priority_uses_highest_lane_and_react_thresholds() {
        assert_eq!(lanes_to_event_priority(Lanes::NO), EventPriority::DISCRETE);
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::SYNC_HYDRATION)),
            EventPriority::DISCRETE
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::SYNC)),
            EventPriority::DISCRETE
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::INPUT_CONTINUOUS_HYDRATION)),
            EventPriority::CONTINUOUS
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::INPUT_CONTINUOUS)),
            EventPriority::CONTINUOUS
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::DEFAULT_HYDRATION)),
            EventPriority::DEFAULT
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::DEFAULT)),
            EventPriority::DEFAULT
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::GESTURE)),
            EventPriority::DEFAULT
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::TRANSITION_1)),
            EventPriority::DEFAULT
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::RETRY_4)),
            EventPriority::DEFAULT
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::SELECTIVE_HYDRATION)),
            EventPriority::DEFAULT
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::IDLE_HYDRATION)),
            EventPriority::IDLE
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::IDLE)),
            EventPriority::IDLE
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::OFFSCREEN)),
            EventPriority::IDLE
        );
        assert_eq!(
            lanes_to_event_priority(Lanes::from(Lane::DEFERRED)),
            EventPriority::IDLE
        );
    }

    #[test]
    fn lanes_to_event_priority_selects_the_highest_priority_lane_in_a_set() {
        let continuous_and_default = Lanes::from(Lane::DEFAULT).merge_lane(Lane::INPUT_CONTINUOUS);
        assert_eq!(
            lanes_to_event_priority(continuous_and_default),
            EventPriority::CONTINUOUS
        );

        let default_and_idle = Lanes::from(Lane::IDLE).merge_lane(Lane::TRANSITION_8);
        assert_eq!(
            lanes_to_event_priority(default_and_idle),
            EventPriority::DEFAULT
        );

        let sync_and_idle = Lanes::from(Lane::IDLE).merge_lane(Lane::SYNC);
        assert_eq!(
            lanes_to_event_priority(sync_and_idle),
            EventPriority::DISCRETE
        );
    }
}
