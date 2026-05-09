//! React 19.2.6 lane bitset primitives.
//!
//! These constants are anchored to
//! `packages/react-reconciler/src/ReactFiberLane.js` from the React `v19.2.6`
//! source tag. React models lanes as a 31-bit bitset where lower set bits have
//! higher scheduling priority.

use std::ops::{Index, IndexMut};

pub const TOTAL_LANES: usize = 31;
pub const VALID_LANE_BITS: u32 = (1u32 << TOTAL_LANES) - 1;

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Lane(u32);

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Lanes(u32);

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct LaneIndex(u8);

impl LaneIndex {
    pub const MIN: Self = Self(0);
    pub const MAX: Self = Self((TOTAL_LANES - 1) as u8);

    #[must_use]
    pub const fn new(index: usize) -> Option<Self> {
        if index < TOTAL_LANES {
            Some(Self(index as u8))
        } else {
            None
        }
    }

    #[must_use]
    pub const fn get(self) -> usize {
        self.0 as usize
    }

    #[must_use]
    pub const fn lane(self) -> Lane {
        Lane(1u32 << self.0)
    }
}

impl From<LaneIndex> for usize {
    fn from(index: LaneIndex) -> Self {
        index.get()
    }
}

impl Lane {
    pub const NO: Self = Self(0);

    pub const SYNC_HYDRATION: Self = Self(1 << 0);
    pub const SYNC: Self = Self(1 << 1);
    pub const SYNC_INDEX: LaneIndex = LaneIndex(1);

    pub const INPUT_CONTINUOUS_HYDRATION: Self = Self(1 << 2);
    pub const INPUT_CONTINUOUS: Self = Self(1 << 3);

    pub const DEFAULT_HYDRATION: Self = Self(1 << 4);
    pub const DEFAULT: Self = Self(1 << 5);

    pub const GESTURE: Self = Self(1 << 6);

    pub const TRANSITION_HYDRATION: Self = Self(1 << 7);
    pub const TRANSITION_1: Self = Self(1 << 8);
    pub const TRANSITION_2: Self = Self(1 << 9);
    pub const TRANSITION_3: Self = Self(1 << 10);
    pub const TRANSITION_4: Self = Self(1 << 11);
    pub const TRANSITION_5: Self = Self(1 << 12);
    pub const TRANSITION_6: Self = Self(1 << 13);
    pub const TRANSITION_7: Self = Self(1 << 14);
    pub const TRANSITION_8: Self = Self(1 << 15);
    pub const TRANSITION_9: Self = Self(1 << 16);
    pub const TRANSITION_10: Self = Self(1 << 17);
    pub const TRANSITION_11: Self = Self(1 << 18);
    pub const TRANSITION_12: Self = Self(1 << 19);
    pub const TRANSITION_13: Self = Self(1 << 20);
    pub const TRANSITION_14: Self = Self(1 << 21);
    pub const SOME_TRANSITION: Self = Self::TRANSITION_1;

    pub const RETRY_1: Self = Self(1 << 22);
    pub const RETRY_2: Self = Self(1 << 23);
    pub const RETRY_3: Self = Self(1 << 24);
    pub const RETRY_4: Self = Self(1 << 25);
    pub const SOME_RETRY: Self = Self::RETRY_1;

    pub const SELECTIVE_HYDRATION: Self = Self(1 << 26);
    pub const IDLE_HYDRATION: Self = Self(1 << 27);
    pub const IDLE: Self = Self(1 << 28);

    pub const OFFSCREEN: Self = Self(1 << 29);
    pub const DEFERRED: Self = Self(1 << 30);

    pub const ALL: [Self; TOTAL_LANES] = [
        Self::SYNC_HYDRATION,
        Self::SYNC,
        Self::INPUT_CONTINUOUS_HYDRATION,
        Self::INPUT_CONTINUOUS,
        Self::DEFAULT_HYDRATION,
        Self::DEFAULT,
        Self::GESTURE,
        Self::TRANSITION_HYDRATION,
        Self::TRANSITION_1,
        Self::TRANSITION_2,
        Self::TRANSITION_3,
        Self::TRANSITION_4,
        Self::TRANSITION_5,
        Self::TRANSITION_6,
        Self::TRANSITION_7,
        Self::TRANSITION_8,
        Self::TRANSITION_9,
        Self::TRANSITION_10,
        Self::TRANSITION_11,
        Self::TRANSITION_12,
        Self::TRANSITION_13,
        Self::TRANSITION_14,
        Self::RETRY_1,
        Self::RETRY_2,
        Self::RETRY_3,
        Self::RETRY_4,
        Self::SELECTIVE_HYDRATION,
        Self::IDLE_HYDRATION,
        Self::IDLE,
        Self::OFFSCREEN,
        Self::DEFERRED,
    ];

    #[must_use]
    pub const fn from_bits(bits: u32) -> Option<Self> {
        if bits & !VALID_LANE_BITS == 0 && (bits == 0 || bits.count_ones() == 1) {
            Some(Self(bits))
        } else {
            None
        }
    }

    #[must_use]
    pub const fn from_index(index: LaneIndex) -> Self {
        index.lane()
    }

    #[must_use]
    pub const fn bits(self) -> u32 {
        self.0
    }

    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub const fn is_non_empty(self) -> bool {
        self.0 != 0
    }

    #[must_use]
    pub const fn is_valid(self) -> bool {
        self.0 & !VALID_LANE_BITS == 0 && (self.0 == 0 || self.0.count_ones() == 1)
    }

    #[must_use]
    pub const fn to_index(self) -> Option<LaneIndex> {
        if self.is_valid() && self.is_non_empty() {
            Some(LaneIndex(self.0.trailing_zeros() as u8))
        } else {
            None
        }
    }

    #[must_use]
    pub const fn to_lanes(self) -> Lanes {
        Lanes(self.0)
    }

    #[must_use]
    pub const fn higher_priority_lane(a: Self, b: Self) -> Self {
        if a.0 != Self::NO.0 && a.0 < b.0 { a } else { b }
    }

    #[must_use]
    pub const fn is_blocking(self) -> bool {
        self.0 & Lanes::SYNC_DEFAULT.bits() != Lane::NO.0
    }

    #[must_use]
    pub const fn is_transition(self) -> bool {
        self.0 & Lanes::TRANSITION.bits() != Lane::NO.0
    }
}

impl From<Lane> for Lanes {
    fn from(lane: Lane) -> Self {
        lane.to_lanes()
    }
}

impl Lanes {
    pub const NO: Self = Self(0);
    pub const ALL: Self = Self(VALID_LANE_BITS);

    pub const SYNC_HYDRATION: Self = Lane::SYNC_HYDRATION.to_lanes();
    pub const SYNC: Self = Lane::SYNC.to_lanes();
    pub const INPUT_CONTINUOUS_HYDRATION: Self = Lane::INPUT_CONTINUOUS_HYDRATION.to_lanes();
    pub const INPUT_CONTINUOUS: Self = Lane::INPUT_CONTINUOUS.to_lanes();
    pub const DEFAULT_HYDRATION: Self = Lane::DEFAULT_HYDRATION.to_lanes();
    pub const DEFAULT: Self = Lane::DEFAULT.to_lanes();
    pub const GESTURE: Self = Lane::GESTURE.to_lanes();
    pub const TRANSITION_HYDRATION: Self = Lane::TRANSITION_HYDRATION.to_lanes();
    pub const SELECTIVE_HYDRATION: Self = Lane::SELECTIVE_HYDRATION.to_lanes();
    pub const IDLE_HYDRATION: Self = Lane::IDLE_HYDRATION.to_lanes();
    pub const IDLE: Self = Lane::IDLE.to_lanes();
    pub const OFFSCREEN: Self = Lane::OFFSCREEN.to_lanes();
    pub const DEFERRED: Self = Lane::DEFERRED.to_lanes();

    pub const SYNC_UPDATE: Self =
        Self(Lane::SYNC.bits() | Lane::INPUT_CONTINUOUS.bits() | Lane::DEFAULT.bits());
    pub const TRANSITION: Self = Self(0x003f_ff00);
    pub const TRANSITION_UPDATE: Self = Self(0x0003_ff00);
    pub const TRANSITION_DEFERRED: Self = Self(0x003c_0000);
    pub const RETRY: Self = Self(0x03c0_0000);
    pub const NON_IDLE: Self = Self(0x07ff_ffff);
    pub const UPDATE: Self = Self(0x0003_ff2a);
    pub const HYDRATION: Self = Self(0x0c00_0095);
    pub const BLOCKING: Self = Self(0x0000_003f);
    pub const SYNC_DEFAULT: Self = Self(0x0000_007f);
    pub const IDLE_GROUP: Self = Self(0x7c00_0000);
    pub const HYDRATION_OR_OFFSCREEN: Self = Self(0x2c00_0095);
    pub const VIEW_TRANSITION_ELIGIBLE: Self = Self(0x13ff_ff00);
    pub const SUSPENSEY_COMMIT_ELIGIBLE: Self = Self(0x13ff_ff40);
    pub const LOADING_INDICATOR: Self = Self(0x0000_0022);

    #[must_use]
    pub const fn from_bits(bits: u32) -> Option<Self> {
        if bits & !VALID_LANE_BITS == 0 {
            Some(Self(bits))
        } else {
            None
        }
    }

    #[must_use]
    pub const fn from_bits_truncate(bits: u32) -> Self {
        Self(bits & VALID_LANE_BITS)
    }

    #[must_use]
    pub const fn bits(self) -> u32 {
        self.0
    }

    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub const fn is_non_empty(self) -> bool {
        self.0 != 0
    }

    #[must_use]
    pub const fn merge(self, other: Self) -> Self {
        Self(self.0 | other.0)
    }

    #[must_use]
    pub const fn merge_lane(self, lane: Lane) -> Self {
        Self(self.0 | lane.0)
    }

    #[must_use]
    pub const fn remove(self, subset: Self) -> Self {
        Self(self.0 & !subset.0)
    }

    #[must_use]
    pub const fn remove_lane(self, lane: Lane) -> Self {
        Self(self.0 & !lane.0)
    }

    #[must_use]
    pub const fn intersect(self, other: Self) -> Self {
        Self(self.0 & other.0)
    }

    #[must_use]
    pub const fn intersect_lane(self, lane: Lane) -> Self {
        Self(self.0 & lane.0)
    }

    #[must_use]
    pub const fn contains_any(self, other: Self) -> bool {
        self.intersect(other).is_non_empty()
    }

    #[must_use]
    pub const fn contains_lane(self, lane: Lane) -> bool {
        self.0 & lane.0 != Self::NO.0
    }

    #[must_use]
    pub const fn contains_all(self, subset: Self) -> bool {
        self.0 & subset.0 == subset.0
    }

    #[must_use]
    pub const fn contains_all_lane(self, lane: Lane) -> bool {
        self.0 & lane.0 == lane.0
    }

    #[must_use]
    pub const fn is_subset_of(self, set: Self) -> bool {
        set.contains_all(self)
    }

    #[must_use]
    pub const fn highest_priority_lane(self) -> Lane {
        Lane(self.0 & self.0.wrapping_neg())
    }

    #[must_use]
    pub const fn pick_arbitrary_lane(self) -> Lane {
        self.highest_priority_lane()
    }

    #[must_use]
    pub const fn lanes_of_equal_or_higher_priority(self) -> Self {
        if self.is_empty() {
            Self::NO
        } else {
            let lowest_priority_lane_index = 31 - self.0.leading_zeros();
            Self((1u32 << (lowest_priority_lane_index + 1)) - 1)
        }
    }

    #[must_use]
    pub const fn includes_sync_lane(self) -> bool {
        self.0 & (Lane::SYNC_HYDRATION.bits() | Lane::SYNC.bits()) != Self::NO.0
    }

    #[must_use]
    pub const fn includes_non_idle_work(self) -> bool {
        self.0 & Self::NON_IDLE.0 != Self::NO.0
    }

    #[must_use]
    pub const fn includes_only_retries(self) -> bool {
        self.0 & Self::RETRY.0 == self.0
    }

    #[must_use]
    pub const fn includes_only_non_urgent_lanes(self) -> bool {
        self.0 & Self::SYNC_UPDATE.0 == Self::NO.0
    }

    #[must_use]
    pub const fn includes_only_transitions(self) -> bool {
        self.0 & Self::TRANSITION.0 == self.0
    }

    #[must_use]
    pub const fn includes_transition_lane(self) -> bool {
        self.0 & Self::TRANSITION.0 != Self::NO.0
    }

    #[must_use]
    pub const fn includes_retry_lane(self) -> bool {
        self.0 & Self::RETRY.0 != Self::NO.0
    }

    #[must_use]
    pub const fn includes_idle_group_lanes(self) -> bool {
        self.0 & Self::IDLE_GROUP.0 != Self::NO.0
    }

    #[must_use]
    pub const fn includes_only_hydration_lanes(self) -> bool {
        self.0 & Self::HYDRATION.0 == self.0
    }

    #[must_use]
    pub const fn includes_only_offscreen_lanes(self) -> bool {
        self.0 & Lane::OFFSCREEN.bits() == self.0
    }

    #[must_use]
    pub const fn includes_only_hydration_or_offscreen_lanes(self) -> bool {
        self.0 & Self::HYDRATION_OR_OFFSCREEN.0 == self.0
    }

    #[must_use]
    pub const fn includes_only_view_transition_eligible_lanes(self) -> bool {
        self.0 & Self::VIEW_TRANSITION_ELIGIBLE.0 == self.0
    }

    #[must_use]
    pub const fn includes_only_suspensey_commit_eligible_lanes(self) -> bool {
        self.0 & Self::SUSPENSEY_COMMIT_ELIGIBLE.0 == self.0
    }

    #[must_use]
    pub const fn includes_loading_indicator_lanes(self) -> bool {
        self.0 & Self::LOADING_INDICATOR.0 != Self::NO.0
    }

    #[must_use]
    pub const fn includes_blocking_lane(self) -> bool {
        self.0 & Self::SYNC_DEFAULT.0 != Self::NO.0
    }

    #[must_use]
    pub const fn is_gesture_render(self) -> bool {
        self.0 == Lane::GESTURE.bits()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LaneMap<T> {
    entries: [T; TOTAL_LANES],
}

impl<T> LaneMap<T> {
    #[must_use]
    pub fn from_fn(mut make_entry: impl FnMut(LaneIndex) -> T) -> Self {
        Self {
            entries: std::array::from_fn(|index| make_entry(LaneIndex(index as u8))),
        }
    }

    #[must_use]
    pub const fn from_array(entries: [T; TOTAL_LANES]) -> Self {
        Self { entries }
    }

    #[must_use]
    pub fn into_array(self) -> [T; TOTAL_LANES] {
        self.entries
    }

    #[must_use]
    pub const fn as_array(&self) -> &[T; TOTAL_LANES] {
        &self.entries
    }

    #[must_use]
    pub const fn as_slice(&self) -> &[T] {
        &self.entries
    }

    #[must_use]
    pub fn as_mut_slice(&mut self) -> &mut [T] {
        &mut self.entries
    }

    #[must_use]
    pub const fn len(&self) -> usize {
        TOTAL_LANES
    }

    #[must_use]
    pub const fn is_empty(&self) -> bool {
        false
    }

    #[must_use]
    pub fn get(&self, index: LaneIndex) -> &T {
        &self.entries[index.get()]
    }

    #[must_use]
    pub fn get_mut(&mut self, index: LaneIndex) -> &mut T {
        &mut self.entries[index.get()]
    }

    #[must_use]
    pub fn get_lane(&self, lane: Lane) -> Option<&T> {
        lane.to_index().map(|index| self.get(index))
    }

    #[must_use]
    pub fn get_lane_mut(&mut self, lane: Lane) -> Option<&mut T> {
        lane.to_index().map(|index| self.get_mut(index))
    }
}

impl<T: Clone> LaneMap<T> {
    #[must_use]
    pub fn filled(initial: T) -> Self {
        Self::from_fn(|_| initial.clone())
    }
}

impl<T: Copy> LaneMap<T> {
    #[must_use]
    pub const fn filled_copy(initial: T) -> Self {
        Self {
            entries: [initial; TOTAL_LANES],
        }
    }
}

impl<T: Default> Default for LaneMap<T> {
    fn default() -> Self {
        Self::from_fn(|_| T::default())
    }
}

impl<T> Index<LaneIndex> for LaneMap<T> {
    type Output = T;

    fn index(&self, index: LaneIndex) -> &Self::Output {
        self.get(index)
    }
}

impl<T> IndexMut<LaneIndex> for LaneMap<T> {
    fn index_mut(&mut self, index: LaneIndex) -> &mut Self::Output {
        self.get_mut(index)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lane_constants_match_react_19_2_6_source() {
        let expected = [
            (
                "SyncHydrationLane",
                Lane::SYNC_HYDRATION,
                0b0000000000000000000000000000001,
                0,
            ),
            ("SyncLane", Lane::SYNC, 0b0000000000000000000000000000010, 1),
            (
                "InputContinuousHydrationLane",
                Lane::INPUT_CONTINUOUS_HYDRATION,
                0b0000000000000000000000000000100,
                2,
            ),
            (
                "InputContinuousLane",
                Lane::INPUT_CONTINUOUS,
                0b0000000000000000000000000001000,
                3,
            ),
            (
                "DefaultHydrationLane",
                Lane::DEFAULT_HYDRATION,
                0b0000000000000000000000000010000,
                4,
            ),
            (
                "DefaultLane",
                Lane::DEFAULT,
                0b0000000000000000000000000100000,
                5,
            ),
            (
                "GestureLane",
                Lane::GESTURE,
                0b0000000000000000000000001000000,
                6,
            ),
            (
                "TransitionHydrationLane",
                Lane::TRANSITION_HYDRATION,
                0b0000000000000000000000010000000,
                7,
            ),
            (
                "TransitionLane1",
                Lane::TRANSITION_1,
                0b0000000000000000000000100000000,
                8,
            ),
            (
                "TransitionLane2",
                Lane::TRANSITION_2,
                0b0000000000000000000001000000000,
                9,
            ),
            (
                "TransitionLane3",
                Lane::TRANSITION_3,
                0b0000000000000000000010000000000,
                10,
            ),
            (
                "TransitionLane4",
                Lane::TRANSITION_4,
                0b0000000000000000000100000000000,
                11,
            ),
            (
                "TransitionLane5",
                Lane::TRANSITION_5,
                0b0000000000000000001000000000000,
                12,
            ),
            (
                "TransitionLane6",
                Lane::TRANSITION_6,
                0b0000000000000000010000000000000,
                13,
            ),
            (
                "TransitionLane7",
                Lane::TRANSITION_7,
                0b0000000000000000100000000000000,
                14,
            ),
            (
                "TransitionLane8",
                Lane::TRANSITION_8,
                0b0000000000000001000000000000000,
                15,
            ),
            (
                "TransitionLane9",
                Lane::TRANSITION_9,
                0b0000000000000010000000000000000,
                16,
            ),
            (
                "TransitionLane10",
                Lane::TRANSITION_10,
                0b0000000000000100000000000000000,
                17,
            ),
            (
                "TransitionLane11",
                Lane::TRANSITION_11,
                0b0000000000001000000000000000000,
                18,
            ),
            (
                "TransitionLane12",
                Lane::TRANSITION_12,
                0b0000000000010000000000000000000,
                19,
            ),
            (
                "TransitionLane13",
                Lane::TRANSITION_13,
                0b0000000000100000000000000000000,
                20,
            ),
            (
                "TransitionLane14",
                Lane::TRANSITION_14,
                0b0000000001000000000000000000000,
                21,
            ),
            (
                "RetryLane1",
                Lane::RETRY_1,
                0b0000000010000000000000000000000,
                22,
            ),
            (
                "RetryLane2",
                Lane::RETRY_2,
                0b0000000100000000000000000000000,
                23,
            ),
            (
                "RetryLane3",
                Lane::RETRY_3,
                0b0000001000000000000000000000000,
                24,
            ),
            (
                "RetryLane4",
                Lane::RETRY_4,
                0b0000010000000000000000000000000,
                25,
            ),
            (
                "SelectiveHydrationLane",
                Lane::SELECTIVE_HYDRATION,
                0b0000100000000000000000000000000,
                26,
            ),
            (
                "IdleHydrationLane",
                Lane::IDLE_HYDRATION,
                0b0001000000000000000000000000000,
                27,
            ),
            (
                "IdleLane",
                Lane::IDLE,
                0b0010000000000000000000000000000,
                28,
            ),
            (
                "OffscreenLane",
                Lane::OFFSCREEN,
                0b0100000000000000000000000000000,
                29,
            ),
            (
                "DeferredLane",
                Lane::DEFERRED,
                0b1000000000000000000000000000000,
                30,
            ),
        ];

        assert_eq!(TOTAL_LANES, 31);
        assert_eq!(VALID_LANE_BITS, 0x7fff_ffff);
        assert_eq!(Lane::ALL.len(), TOTAL_LANES);

        let mut seen = Lanes::NO;
        for (name, lane, bits, index) in expected {
            assert_eq!(lane.bits(), bits, "{name}");
            assert_eq!(lane.to_index().map(LaneIndex::get), Some(index), "{name}");
            assert_eq!(Lane::from_index(LaneIndex::new(index).unwrap()), lane);
            assert_eq!(Lane::from_bits(bits), Some(lane), "{name}");
            seen = seen.merge_lane(lane);
        }

        assert_eq!(seen.bits(), VALID_LANE_BITS);
        assert_eq!(Lane::SYNC_INDEX.get(), 1);
        assert_eq!(Lane::NO.bits(), 0);
        assert!(Lane::NO.is_empty());
    }

    #[test]
    fn group_masks_match_react_19_2_6_source() {
        assert_eq!(Lanes::SYNC_UPDATE.bits(), 0b0000000000000000000000000101010);
        assert_eq!(Lanes::TRANSITION.bits(), 0b0000000001111111111111100000000);
        assert_eq!(Lanes::TRANSITION_UPDATE.bits(), 0x0003_ff00);
        assert_eq!(Lanes::TRANSITION_DEFERRED.bits(), 0x003c_0000);
        assert_eq!(Lanes::RETRY.bits(), 0b0000011110000000000000000000000);
        assert_eq!(Lanes::NON_IDLE.bits(), 0b0000111111111111111111111111111);
        assert_eq!(Lanes::UPDATE.bits(), 0x0003_ff2a);
        assert_eq!(Lanes::HYDRATION.bits(), 0x0c00_0095);
        assert_eq!(Lanes::BLOCKING.bits(), 0x0000_003f);
        assert_eq!(Lanes::SYNC_DEFAULT.bits(), 0x0000_007f);
        assert_eq!(Lanes::IDLE_GROUP.bits(), 0x7c00_0000);
        assert_eq!(Lanes::HYDRATION_OR_OFFSCREEN.bits(), 0x2c00_0095);
        assert_eq!(Lanes::VIEW_TRANSITION_ELIGIBLE.bits(), 0x13ff_ff00);
        assert_eq!(Lanes::SUSPENSEY_COMMIT_ELIGIBLE.bits(), 0x13ff_ff40);
        assert_eq!(Lanes::LOADING_INDICATOR.bits(), 0x0000_0022);
        assert_eq!(Lane::SOME_TRANSITION, Lane::TRANSITION_1);
        assert_eq!(Lane::SOME_RETRY, Lane::RETRY_1);
    }

    #[test]
    fn lane_and_lanes_constructors_reject_invalid_shapes() {
        assert_eq!(Lane::from_bits(0), Some(Lane::NO));
        assert_eq!(Lane::from_bits(0b11), None);
        assert_eq!(Lane::from_bits(1 << 31), None);
        assert_eq!(Lanes::from_bits(VALID_LANE_BITS), Some(Lanes::ALL));
        assert_eq!(Lanes::from_bits(1 << 31), None);
        assert_eq!(Lanes::from_bits_truncate(u32::MAX), Lanes::ALL);
        assert_eq!(LaneIndex::new(TOTAL_LANES), None);
    }

    #[test]
    fn bitset_helpers_match_react_lane_semantics() {
        let lanes = Lanes::from(Lane::TRANSITION_4)
            .merge_lane(Lane::DEFAULT)
            .merge_lane(Lane::RETRY_2);

        assert_eq!(lanes.highest_priority_lane(), Lane::DEFAULT);
        assert_eq!(lanes.pick_arbitrary_lane(), Lane::DEFAULT);
        assert_eq!(Lanes::NO.highest_priority_lane(), Lane::NO);
        assert_eq!(
            lanes.lanes_of_equal_or_higher_priority(),
            Lanes::from_bits((1 << 24) - 1).unwrap()
        );
        assert_eq!(
            Lanes::from(Lane::OFFSCREEN).lanes_of_equal_or_higher_priority(),
            Lanes::from_bits((1 << 30) - 1).unwrap()
        );

        let merged = Lanes::from(Lane::SYNC).merge(Lanes::from(Lane::DEFAULT));
        assert!(merged.contains_lane(Lane::SYNC));
        assert!(merged.contains_any(Lanes::from(Lane::DEFAULT)));
        assert!(merged.contains_all(Lanes::from(Lane::SYNC)));
        assert!(Lanes::from(Lane::SYNC).is_subset_of(merged));
        assert_eq!(merged.remove_lane(Lane::SYNC), Lanes::from(Lane::DEFAULT));
        assert_eq!(
            merged.remove(Lanes::from(Lane::DEFAULT)),
            Lanes::from(Lane::SYNC)
        );
        assert_eq!(
            merged.intersect(Lanes::from(Lane::DEFAULT)),
            Lanes::from(Lane::DEFAULT)
        );
        assert_eq!(merged.intersect_lane(Lane::INPUT_CONTINUOUS), Lanes::NO);

        assert_eq!(
            Lane::higher_priority_lane(Lane::DEFAULT, Lane::TRANSITION_1),
            Lane::DEFAULT
        );
        assert_eq!(
            Lane::higher_priority_lane(Lane::DEFAULT, Lane::NO),
            Lane::NO
        );
    }

    #[test]
    fn group_checks_match_react_fiber_lane_helpers() {
        assert!(Lanes::from(Lane::SYNC_HYDRATION).includes_sync_lane());
        assert!(Lanes::from(Lane::SYNC).includes_sync_lane());
        assert!(!Lanes::from(Lane::DEFAULT).includes_sync_lane());

        assert!(Lanes::from(Lane::DEFAULT).includes_non_idle_work());
        assert!(!Lanes::from(Lane::IDLE).includes_non_idle_work());
        assert!(Lanes::from(Lane::IDLE).includes_idle_group_lanes());
        assert!(Lanes::from(Lane::DEFERRED).includes_idle_group_lanes());

        assert!(Lanes::from(Lane::RETRY_1).includes_only_retries());
        assert!(Lanes::from(Lane::RETRY_1).includes_retry_lane());
        assert!(
            !Lanes::from(Lane::RETRY_1)
                .merge_lane(Lane::DEFAULT)
                .includes_only_retries()
        );

        assert!(Lanes::from(Lane::TRANSITION_10).includes_only_transitions());
        assert!(Lanes::from(Lane::TRANSITION_11).includes_transition_lane());
        assert!(
            !Lanes::from(Lane::TRANSITION_1)
                .merge_lane(Lane::RETRY_1)
                .includes_only_transitions()
        );

        assert!(Lanes::from(Lane::TRANSITION_HYDRATION).includes_only_non_urgent_lanes());
        assert!(!Lanes::from(Lane::DEFAULT).includes_only_non_urgent_lanes());

        assert!(Lanes::from(Lane::IDLE_HYDRATION).includes_only_hydration_lanes());
        assert!(!Lanes::from(Lane::IDLE).includes_only_hydration_lanes());
        assert!(Lanes::from(Lane::OFFSCREEN).includes_only_offscreen_lanes());
        assert!(
            Lanes::from(Lane::OFFSCREEN)
                .merge_lane(Lane::DEFAULT_HYDRATION)
                .includes_only_hydration_or_offscreen_lanes()
        );
        assert!(
            Lanes::from(Lane::RETRY_4)
                .merge_lane(Lane::IDLE)
                .includes_only_view_transition_eligible_lanes()
        );
        assert!(!Lanes::from(Lane::DEFAULT).includes_only_view_transition_eligible_lanes());
        assert!(Lanes::from(Lane::GESTURE).includes_only_suspensey_commit_eligible_lanes());
        assert!(
            Lanes::from(Lane::RETRY_1)
                .merge_lane(Lane::IDLE)
                .includes_only_suspensey_commit_eligible_lanes()
        );
        assert!(!Lanes::from(Lane::DEFAULT).includes_only_suspensey_commit_eligible_lanes());
        assert!(Lanes::from(Lane::SYNC).includes_loading_indicator_lanes());
        assert!(Lanes::from(Lane::DEFAULT).includes_loading_indicator_lanes());
        assert!(!Lanes::from(Lane::INPUT_CONTINUOUS).includes_loading_indicator_lanes());
        assert!(Lanes::from(Lane::GESTURE).includes_blocking_lane());
        assert!(Lane::GESTURE.is_blocking());
        assert!(Lane::TRANSITION_1.is_transition());
        assert!(!Lane::DEFAULT.is_transition());
        assert!(Lanes::from(Lane::GESTURE).is_gesture_render());
        assert!(
            !Lanes::from(Lane::GESTURE)
                .merge_lane(Lane::DEFAULT)
                .is_gesture_render()
        );

        assert!(Lanes::NO.includes_only_retries());
        assert!(Lanes::NO.includes_only_transitions());
        assert!(Lanes::NO.includes_only_hydration_lanes());
        assert!(Lanes::NO.includes_only_offscreen_lanes());
    }

    #[test]
    fn lane_map_is_fixed_width_and_lane_indexed() {
        let map = LaneMap::from_fn(|index| index.get());
        assert_eq!(map.len(), TOTAL_LANES);
        assert!(!map.is_empty());
        assert_eq!(map[LaneIndex::MIN], 0);
        assert_eq!(map[LaneIndex::MAX], 30);
        assert_eq!(map.get_lane(Lane::SYNC), Some(&1));
        assert_eq!(map.get_lane(Lane::DEFERRED), Some(&30));
        assert_eq!(map.get_lane(Lane::NO), None);

        let no_lanes = LaneMap::filled_copy(Lanes::NO);
        assert_eq!(no_lanes.as_slice().len(), TOTAL_LANES);
        assert!(no_lanes.as_slice().iter().all(|lanes| lanes.is_empty()));
    }

    #[test]
    fn lane_map_supports_non_copy_root_bookkeeping_values() {
        let mut map = LaneMap::filled(String::from("unset"));
        *map.get_lane_mut(Lane::DEFAULT).unwrap() = String::from("default");
        assert_eq!(
            map.get_lane(Lane::DEFAULT).map(String::as_str),
            Some("default")
        );
        assert_eq!(map.get_lane(Lane::SYNC).map(String::as_str), Some("unset"));

        let entries = map.into_array();
        assert_eq!(entries[Lane::DEFAULT.to_index().unwrap().get()], "default");
    }
}
