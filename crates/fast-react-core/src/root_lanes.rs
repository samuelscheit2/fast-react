//! Root-level lane bookkeeping primitives.
//!
//! These helpers are anchored to React 19.2.6
//! `packages/react-reconciler/src/ReactFiberLane.js`, but intentionally stop
//! before fiber ownership, host rendering, public Scheduler integration, or the
//! root work loop. The state here is the renderer-agnostic lane accounting that
//! later reconciler roots can embed.

use crate::{Lane, LaneIndex, LaneMap, Lanes};

pub type LaneTimestamp = i64;

pub const NO_TIMESTAMP: LaneTimestamp = -1;
pub const SYNC_LANE_EXPIRATION_MS: LaneTimestamp = 250;
pub const TRANSITION_LANE_EXPIRATION_MS: LaneTimestamp = 5_000;
pub const RETRY_LANE_EXPIRATION_MS: LaneTimestamp = 5_000;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootLaneFeatureFlags {
    default_transition_indicator: bool,
    retry_lane_expiration: bool,
}

impl RootLaneFeatureFlags {
    pub const STABLE_REACT_19_2_6: Self = Self {
        default_transition_indicator: false,
        retry_lane_expiration: false,
    };

    #[must_use]
    pub const fn new() -> Self {
        Self::STABLE_REACT_19_2_6
    }

    #[must_use]
    pub const fn with_default_transition_indicator(mut self, enabled: bool) -> Self {
        self.default_transition_indicator = enabled;
        self
    }

    #[must_use]
    pub const fn with_retry_lane_expiration(mut self, enabled: bool) -> Self {
        self.retry_lane_expiration = enabled;
        self
    }

    #[must_use]
    pub const fn default_transition_indicator(self) -> bool {
        self.default_transition_indicator
    }

    #[must_use]
    pub const fn retry_lane_expiration(self) -> bool {
        self.retry_lane_expiration
    }
}

impl Default for RootLaneFeatureFlags {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootFinishedLanes {
    finished_lanes: Lanes,
    remaining_lanes: Lanes,
    spawned_lane: Lane,
    updated_lanes: Lanes,
    suspended_retry_lanes: Lanes,
}

impl RootFinishedLanes {
    #[must_use]
    pub const fn new(finished_lanes: Lanes, remaining_lanes: Lanes) -> Self {
        Self {
            finished_lanes,
            remaining_lanes,
            spawned_lane: Lane::NO,
            updated_lanes: Lanes::NO,
            suspended_retry_lanes: Lanes::NO,
        }
    }

    #[must_use]
    pub const fn with_spawned_lane(mut self, spawned_lane: Lane) -> Self {
        self.spawned_lane = spawned_lane;
        self
    }

    #[must_use]
    pub const fn with_updated_lanes(mut self, updated_lanes: Lanes) -> Self {
        self.updated_lanes = updated_lanes;
        self
    }

    #[must_use]
    pub const fn with_suspended_retry_lanes(mut self, suspended_retry_lanes: Lanes) -> Self {
        self.suspended_retry_lanes = suspended_retry_lanes;
        self
    }

    #[must_use]
    pub const fn finished_lanes(self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub const fn spawned_lane(self) -> Lane {
        self.spawned_lane
    }

    #[must_use]
    pub const fn updated_lanes(self) -> Lanes {
        self.updated_lanes
    }

    #[must_use]
    pub const fn suspended_retry_lanes(self) -> Lanes {
        self.suspended_retry_lanes
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootLaneState {
    features: RootLaneFeatureFlags,
    pending_lanes: Lanes,
    suspended_lanes: Lanes,
    pinged_lanes: Lanes,
    warm_lanes: Lanes,
    expired_lanes: Lanes,
    indicator_lanes: Lanes,
    error_recovery_disabled_lanes: Lanes,
    entangled_lanes: Lanes,
    expiration_times: LaneMap<LaneTimestamp>,
    entanglements: LaneMap<Lanes>,
    // Until update queues exist in core, keep lane-indexed hidden update slots
    // as counts instead of pretending to own fiber/update nodes.
    hidden_update_counts: LaneMap<usize>,
}

impl RootLaneState {
    #[must_use]
    pub fn new() -> Self {
        Self::with_features(RootLaneFeatureFlags::default())
    }

    #[must_use]
    pub fn with_features(features: RootLaneFeatureFlags) -> Self {
        Self {
            features,
            pending_lanes: Lanes::NO,
            suspended_lanes: Lanes::NO,
            pinged_lanes: Lanes::NO,
            warm_lanes: Lanes::NO,
            expired_lanes: Lanes::NO,
            indicator_lanes: Lanes::NO,
            error_recovery_disabled_lanes: Lanes::NO,
            entangled_lanes: Lanes::NO,
            expiration_times: LaneMap::filled_copy(NO_TIMESTAMP),
            entanglements: LaneMap::filled_copy(Lanes::NO),
            hidden_update_counts: LaneMap::filled_copy(0),
        }
    }

    #[must_use]
    pub const fn features(&self) -> RootLaneFeatureFlags {
        self.features
    }

    #[must_use]
    pub const fn pending_lanes(&self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub const fn suspended_lanes(&self) -> Lanes {
        self.suspended_lanes
    }

    #[must_use]
    pub const fn pinged_lanes(&self) -> Lanes {
        self.pinged_lanes
    }

    #[must_use]
    pub const fn warm_lanes(&self) -> Lanes {
        self.warm_lanes
    }

    #[must_use]
    pub const fn expired_lanes(&self) -> Lanes {
        self.expired_lanes
    }

    #[must_use]
    pub const fn indicator_lanes(&self) -> Lanes {
        self.indicator_lanes
    }

    #[must_use]
    pub const fn error_recovery_disabled_lanes(&self) -> Lanes {
        self.error_recovery_disabled_lanes
    }

    #[must_use]
    pub const fn entangled_lanes(&self) -> Lanes {
        self.entangled_lanes
    }

    #[must_use]
    pub const fn expiration_times(&self) -> &LaneMap<LaneTimestamp> {
        &self.expiration_times
    }

    #[must_use]
    pub const fn entanglements(&self) -> &LaneMap<Lanes> {
        &self.entanglements
    }

    #[must_use]
    pub const fn hidden_update_counts(&self) -> &LaneMap<usize> {
        &self.hidden_update_counts
    }

    #[must_use]
    pub fn expiration_time(&self, lane: Lane) -> Option<LaneTimestamp> {
        self.expiration_times.get_lane(lane).copied()
    }

    pub fn set_expiration_time(&mut self, lane: Lane, expiration_time: LaneTimestamp) -> bool {
        if let Some(slot) = self.expiration_times.get_lane_mut(lane) {
            *slot = expiration_time;
            true
        } else {
            false
        }
    }

    #[must_use]
    pub fn entanglement(&self, lane: Lane) -> Option<Lanes> {
        self.entanglements.get_lane(lane).copied()
    }

    #[must_use]
    pub fn hidden_update_count(&self, lane: Lane) -> Option<usize> {
        self.hidden_update_counts.get_lane(lane).copied()
    }

    pub fn mark_updated(&mut self, update_lane: Lane) {
        self.pending_lanes = self.pending_lanes.merge_lane(update_lane);

        if self.features.default_transition_indicator {
            self.indicator_lanes = self
                .indicator_lanes
                .merge(update_lane.to_lanes().intersect(Lanes::TRANSITION));
        }

        if update_lane != Lane::IDLE {
            self.suspended_lanes = Lanes::NO;
            self.pinged_lanes = Lanes::NO;
            self.warm_lanes = Lanes::NO;
        }
    }

    pub fn mark_suspended(
        &mut self,
        suspended_lanes: Lanes,
        spawned_lane: Lane,
        did_attempt_entire_tree: bool,
    ) {
        self.suspended_lanes = self.suspended_lanes.merge(suspended_lanes);
        self.pinged_lanes = self.pinged_lanes.remove(suspended_lanes);

        if did_attempt_entire_tree {
            self.warm_lanes = self.warm_lanes.merge(suspended_lanes);
        }

        for_each_lane(suspended_lanes, |_, index| {
            self.expiration_times[index] = NO_TIMESTAMP;
        });

        if spawned_lane.is_non_empty() {
            self.mark_spawned_deferred_lane(spawned_lane, suspended_lanes);
        }
    }

    pub fn mark_pinged(&mut self, pinged_lanes: Lanes) {
        self.pinged_lanes = self
            .pinged_lanes
            .merge(self.suspended_lanes.intersect(pinged_lanes));
        self.warm_lanes = self.warm_lanes.remove(pinged_lanes);
    }

    pub fn mark_finished(&mut self, finished: RootFinishedLanes) {
        let previously_pending_lanes = self.pending_lanes;
        let no_longer_pending_lanes = previously_pending_lanes.remove(finished.remaining_lanes);

        self.pending_lanes = finished.remaining_lanes;
        self.suspended_lanes = Lanes::NO;
        self.pinged_lanes = Lanes::NO;
        self.warm_lanes = Lanes::NO;

        if self.features.default_transition_indicator {
            self.indicator_lanes = self.indicator_lanes.intersect(finished.remaining_lanes);
        }

        self.expired_lanes = self.expired_lanes.intersect(finished.remaining_lanes);
        self.entangled_lanes = self.entangled_lanes.intersect(finished.remaining_lanes);
        self.error_recovery_disabled_lanes = self
            .error_recovery_disabled_lanes
            .intersect(finished.remaining_lanes);

        for_each_lane(no_longer_pending_lanes, |_, index| {
            self.entanglements[index] = Lanes::NO;
            self.expiration_times[index] = NO_TIMESTAMP;
            self.hidden_update_counts[index] = 0;
        });

        if finished.spawned_lane.is_non_empty() {
            self.mark_spawned_deferred_lane(finished.spawned_lane, Lanes::NO);
        }

        if finished.suspended_retry_lanes.is_non_empty() && finished.updated_lanes.is_empty() {
            let already_pending_retry_lanes =
                previously_pending_lanes.remove(finished.finished_lanes);
            let freshly_spawned_retry_lanes = finished
                .suspended_retry_lanes
                .remove(already_pending_retry_lanes);
            self.suspended_lanes = self.suspended_lanes.merge(freshly_spawned_retry_lanes);
        }
    }

    pub fn mark_entangled(&mut self, entangled_lanes: Lanes) {
        self.entangled_lanes = self.entangled_lanes.merge(entangled_lanes);

        let root_entangled_lanes = self.entangled_lanes;
        for_each_lane(root_entangled_lanes, |lane, index| {
            let lane_lanes = lane.to_lanes();
            if lane_lanes.contains_any(entangled_lanes)
                || self.entanglements[index].contains_any(entangled_lanes)
            {
                self.entanglements[index] = self.entanglements[index].merge(entangled_lanes);
            }
        });
    }

    pub fn upgrade_pending_lanes_to_sync(&mut self, lanes_to_upgrade: Lanes) {
        self.pending_lanes = self.pending_lanes.merge_lane(Lane::SYNC);
        self.entangled_lanes = self.entangled_lanes.merge_lane(Lane::SYNC);

        let sync_index = Lane::SYNC_INDEX;
        for_each_lane(lanes_to_upgrade, |lane, _| {
            self.entanglements[sync_index] = self.entanglements[sync_index].merge_lane(lane);
        });
    }

    pub fn mark_starved_lanes_as_expired(&mut self, current_time: LaneTimestamp) {
        let pending_lanes = self.pending_lanes;
        let suspended_lanes = self.suspended_lanes;
        let pinged_lanes = self.pinged_lanes;
        let lanes_to_check = if self.features.retry_lane_expiration {
            pending_lanes
        } else {
            pending_lanes.remove(Lanes::RETRY)
        };

        for_each_lane(lanes_to_check, |lane, index| {
            let expiration_time = self.expiration_times[index];
            if expiration_time == NO_TIMESTAMP {
                if !suspended_lanes.contains_lane(lane) || pinged_lanes.contains_lane(lane) {
                    self.expiration_times[index] =
                        compute_expiration_time(lane, current_time, self.features);
                }
            } else if expiration_time <= current_time {
                self.expired_lanes = self.expired_lanes.merge_lane(lane);
            }
        });
    }

    pub fn mark_expired(&mut self, lanes: Lanes) {
        self.expired_lanes = self.expired_lanes.merge(lanes);
    }

    pub fn mark_error_recovery_disabled(&mut self, lanes: Lanes) {
        self.error_recovery_disabled_lanes = self.error_recovery_disabled_lanes.merge(lanes);
    }

    #[must_use]
    pub fn includes_expired_lane(&self, lanes: Lanes) -> bool {
        lanes.contains_any(self.expired_lanes)
    }

    #[must_use]
    pub fn highest_priority_pending_lanes(&self) -> Lanes {
        highest_priority_lanes(self.pending_lanes)
    }

    #[must_use]
    pub fn get_next_lanes(&self, wip_lanes: Lanes, root_has_pending_commit: bool) -> Lanes {
        if self.pending_lanes.is_empty() {
            return Lanes::NO;
        }

        let mut next_lanes = Lanes::NO;
        let non_idle_pending_lanes = self.pending_lanes.intersect(Lanes::NON_IDLE);

        if non_idle_pending_lanes.is_non_empty() {
            let non_idle_unblocked_lanes = non_idle_pending_lanes.remove(self.suspended_lanes);
            if non_idle_unblocked_lanes.is_non_empty() {
                next_lanes = highest_priority_lanes(non_idle_unblocked_lanes);
            } else {
                let non_idle_pinged_lanes = non_idle_pending_lanes.intersect(self.pinged_lanes);
                if non_idle_pinged_lanes.is_non_empty() {
                    next_lanes = highest_priority_lanes(non_idle_pinged_lanes);
                } else if !root_has_pending_commit {
                    let lanes_to_prewarm = non_idle_pending_lanes.remove(self.warm_lanes);
                    if lanes_to_prewarm.is_non_empty() {
                        next_lanes = highest_priority_lanes(lanes_to_prewarm);
                    }
                }
            }
        } else {
            let unblocked_lanes = self.pending_lanes.remove(self.suspended_lanes);
            if unblocked_lanes.is_non_empty() {
                next_lanes = highest_priority_lanes(unblocked_lanes);
            } else if self.pinged_lanes.is_non_empty() {
                next_lanes = highest_priority_lanes(self.pinged_lanes);
            } else if !root_has_pending_commit {
                let lanes_to_prewarm = self.pending_lanes.remove(self.warm_lanes);
                if lanes_to_prewarm.is_non_empty() {
                    next_lanes = highest_priority_lanes(lanes_to_prewarm);
                }
            }
        }

        if next_lanes.is_empty() {
            return Lanes::NO;
        }

        if wip_lanes.is_non_empty()
            && wip_lanes != next_lanes
            && wip_lanes.intersect(self.suspended_lanes).is_empty()
        {
            let next_lane = next_lanes.highest_priority_lane();
            let wip_lane = wip_lanes.highest_priority_lane();
            if next_lane.bits() >= wip_lane.bits()
                || (next_lane == Lane::DEFAULT && wip_lane.is_transition())
            {
                return wip_lanes;
            }
        }

        next_lanes
    }

    #[must_use]
    pub fn get_next_lanes_to_flush_sync(
        &self,
        extra_lanes_to_force_sync: impl Into<Lanes>,
    ) -> Lanes {
        let lanes_to_flush = Lanes::SYNC_UPDATE.merge(extra_lanes_to_force_sync.into());

        if self.pending_lanes.is_empty() {
            return Lanes::NO;
        }

        let suspended_but_not_pinged = self.suspended_lanes.remove(self.pinged_lanes);
        let unblocked_lanes = self.pending_lanes.remove(suspended_but_not_pinged);
        let unblocked_lanes_with_matching_priority =
            unblocked_lanes.intersect(lanes_to_flush.lanes_of_equal_or_higher_priority());

        let matching_hydration_lanes =
            unblocked_lanes_with_matching_priority.intersect(Lanes::HYDRATION);
        if matching_hydration_lanes.is_non_empty() {
            return matching_hydration_lanes.merge_lane(Lane::SYNC_HYDRATION);
        }

        if unblocked_lanes_with_matching_priority.is_non_empty() {
            return unblocked_lanes_with_matching_priority.merge_lane(Lane::SYNC);
        }

        Lanes::NO
    }

    #[must_use]
    pub fn check_if_root_is_prerendering(&self, render_lanes: Lanes) -> bool {
        let suspended_but_not_pinged = self.suspended_lanes.remove(self.pinged_lanes);
        let unblocked_lanes = self.pending_lanes.remove(suspended_but_not_pinged);

        unblocked_lanes.intersect(render_lanes).is_empty()
    }

    #[must_use]
    pub fn entangled_lanes_for(&self, render_lanes: Lanes) -> Lanes {
        let mut entangled_lanes = render_lanes;

        if entangled_lanes.contains_lane(Lane::INPUT_CONTINUOUS) {
            entangled_lanes = entangled_lanes.merge(entangled_lanes.intersect(Lanes::DEFAULT));
        }

        let all_entangled_lanes = self.entangled_lanes;
        if all_entangled_lanes.is_non_empty() {
            let lanes = entangled_lanes.intersect(all_entangled_lanes);
            for_each_lane(lanes, |_, index| {
                entangled_lanes = entangled_lanes.merge(self.entanglements[index]);
            });
        }

        entangled_lanes
    }

    pub fn mark_hidden_update(&mut self, lane: Lane) -> Option<Lanes> {
        lane.to_index().map(|index| {
            self.hidden_update_counts[index] = self.hidden_update_counts[index].saturating_add(1);
            lane.to_lanes().merge_lane(Lane::OFFSCREEN)
        })
    }

    pub fn clear_hidden_updates_for_lanes(&mut self, lanes: Lanes) {
        for_each_lane(lanes, |_, index| {
            self.hidden_update_counts[index] = 0;
        });
    }

    fn mark_spawned_deferred_lane(&mut self, spawned_lane: Lane, entangled_lanes: Lanes) {
        let Some(spawned_lane_index) = spawned_lane.to_index() else {
            return;
        };

        self.pending_lanes = self.pending_lanes.merge_lane(spawned_lane);
        self.suspended_lanes = self.suspended_lanes.remove_lane(spawned_lane);
        self.entangled_lanes = self.entangled_lanes.merge_lane(spawned_lane);
        self.entanglements[spawned_lane_index] = self.entanglements[spawned_lane_index]
            .merge_lane(Lane::DEFERRED)
            .merge(entangled_lanes.intersect(Lanes::UPDATE));
    }
}

impl Default for RootLaneState {
    fn default() -> Self {
        Self::new()
    }
}

#[must_use]
pub fn get_next_lanes(
    root_lanes: &RootLaneState,
    wip_lanes: Lanes,
    root_has_pending_commit: bool,
) -> Lanes {
    root_lanes.get_next_lanes(wip_lanes, root_has_pending_commit)
}

#[must_use]
pub fn get_next_lanes_to_flush_sync(
    root_lanes: &RootLaneState,
    extra_lanes_to_force_sync: impl Into<Lanes>,
) -> Lanes {
    root_lanes.get_next_lanes_to_flush_sync(extra_lanes_to_force_sync)
}

#[must_use]
pub fn check_if_root_is_prerendering(root_lanes: &RootLaneState, render_lanes: Lanes) -> bool {
    root_lanes.check_if_root_is_prerendering(render_lanes)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LaneClaimers {
    next_transition_update_lane: Lane,
    next_transition_deferred_lane: Lane,
    next_retry_lane: Lane,
}

impl LaneClaimers {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            next_transition_update_lane: Lane::TRANSITION_1,
            next_transition_deferred_lane: Lane::TRANSITION_11,
            next_retry_lane: Lane::RETRY_1,
        }
    }

    #[must_use]
    pub const fn next_transition_update_lane(&self) -> Lane {
        self.next_transition_update_lane
    }

    #[must_use]
    pub const fn next_transition_deferred_lane(&self) -> Lane {
        self.next_transition_deferred_lane
    }

    #[must_use]
    pub const fn next_retry_lane(&self) -> Lane {
        self.next_retry_lane
    }

    pub fn claim_next_transition_update_lane(&mut self) -> Lane {
        let lane = self.next_transition_update_lane;
        self.next_transition_update_lane =
            advance_claimed_lane(lane, Lanes::TRANSITION_UPDATE, Lane::TRANSITION_1);
        lane
    }

    pub fn claim_next_transition_deferred_lane(&mut self) -> Lane {
        let lane = self.next_transition_deferred_lane;
        self.next_transition_deferred_lane =
            advance_claimed_lane(lane, Lanes::TRANSITION_DEFERRED, Lane::TRANSITION_11);
        lane
    }

    pub fn claim_next_retry_lane(&mut self) -> Lane {
        let lane = self.next_retry_lane;
        self.next_retry_lane = advance_claimed_lane(lane, Lanes::RETRY, Lane::RETRY_1);
        lane
    }
}

impl Default for LaneClaimers {
    fn default() -> Self {
        Self::new()
    }
}

#[must_use]
pub const fn highest_priority_lanes(lanes: Lanes) -> Lanes {
    let pending_sync_lanes = lanes.intersect(Lanes::SYNC_UPDATE);
    if pending_sync_lanes.is_non_empty() {
        return pending_sync_lanes;
    }

    match lanes.highest_priority_lane().bits() {
        bits if bits == Lane::SYNC_HYDRATION.bits() => Lanes::SYNC_HYDRATION,
        bits if bits == Lane::SYNC.bits() => Lanes::SYNC,
        bits if bits == Lane::INPUT_CONTINUOUS_HYDRATION.bits() => {
            Lanes::INPUT_CONTINUOUS_HYDRATION
        }
        bits if bits == Lane::INPUT_CONTINUOUS.bits() => Lanes::INPUT_CONTINUOUS,
        bits if bits == Lane::DEFAULT_HYDRATION.bits() => Lanes::DEFAULT_HYDRATION,
        bits if bits == Lane::DEFAULT.bits() => Lanes::DEFAULT,
        bits if bits == Lane::GESTURE.bits() => Lanes::GESTURE,
        bits if bits == Lane::TRANSITION_HYDRATION.bits() => Lanes::TRANSITION_HYDRATION,
        bits if bits == Lane::TRANSITION_1.bits()
            || bits == Lane::TRANSITION_2.bits()
            || bits == Lane::TRANSITION_3.bits()
            || bits == Lane::TRANSITION_4.bits()
            || bits == Lane::TRANSITION_5.bits()
            || bits == Lane::TRANSITION_6.bits()
            || bits == Lane::TRANSITION_7.bits()
            || bits == Lane::TRANSITION_8.bits()
            || bits == Lane::TRANSITION_9.bits()
            || bits == Lane::TRANSITION_10.bits() =>
        {
            lanes.intersect(Lanes::TRANSITION_UPDATE)
        }
        bits if bits == Lane::TRANSITION_11.bits()
            || bits == Lane::TRANSITION_12.bits()
            || bits == Lane::TRANSITION_13.bits()
            || bits == Lane::TRANSITION_14.bits() =>
        {
            lanes.intersect(Lanes::TRANSITION_DEFERRED)
        }
        bits if bits == Lane::RETRY_1.bits()
            || bits == Lane::RETRY_2.bits()
            || bits == Lane::RETRY_3.bits()
            || bits == Lane::RETRY_4.bits() =>
        {
            lanes.intersect(Lanes::RETRY)
        }
        bits if bits == Lane::SELECTIVE_HYDRATION.bits() => Lanes::SELECTIVE_HYDRATION,
        bits if bits == Lane::IDLE_HYDRATION.bits() => Lanes::IDLE_HYDRATION,
        bits if bits == Lane::IDLE.bits() => Lanes::IDLE,
        bits if bits == Lane::OFFSCREEN.bits() => Lanes::OFFSCREEN,
        bits if bits == Lane::DEFERRED.bits() => Lanes::NO,
        _ => lanes,
    }
}

fn compute_expiration_time(
    lane: Lane,
    current_time: LaneTimestamp,
    features: RootLaneFeatureFlags,
) -> LaneTimestamp {
    match lane {
        Lane::SYNC_HYDRATION
        | Lane::SYNC
        | Lane::INPUT_CONTINUOUS_HYDRATION
        | Lane::INPUT_CONTINUOUS
        | Lane::GESTURE => current_time + SYNC_LANE_EXPIRATION_MS,
        Lane::DEFAULT_HYDRATION
        | Lane::DEFAULT
        | Lane::TRANSITION_HYDRATION
        | Lane::TRANSITION_1
        | Lane::TRANSITION_2
        | Lane::TRANSITION_3
        | Lane::TRANSITION_4
        | Lane::TRANSITION_5
        | Lane::TRANSITION_6
        | Lane::TRANSITION_7
        | Lane::TRANSITION_8
        | Lane::TRANSITION_9
        | Lane::TRANSITION_10
        | Lane::TRANSITION_11
        | Lane::TRANSITION_12
        | Lane::TRANSITION_13
        | Lane::TRANSITION_14 => current_time + TRANSITION_LANE_EXPIRATION_MS,
        Lane::RETRY_1 | Lane::RETRY_2 | Lane::RETRY_3 | Lane::RETRY_4 => {
            if features.retry_lane_expiration {
                current_time + RETRY_LANE_EXPIRATION_MS
            } else {
                NO_TIMESTAMP
            }
        }
        Lane::SELECTIVE_HYDRATION
        | Lane::IDLE_HYDRATION
        | Lane::IDLE
        | Lane::OFFSCREEN
        | Lane::DEFERRED => NO_TIMESTAMP,
        _ => NO_TIMESTAMP,
    }
}

fn advance_claimed_lane(current: Lane, allowed_lanes: Lanes, fallback: Lane) -> Lane {
    let next_bits = current.bits() << 1;
    let Some(next_lane) = Lane::from_bits(next_bits) else {
        return fallback;
    };

    if allowed_lanes.contains_lane(next_lane) {
        next_lane
    } else {
        fallback
    }
}

fn for_each_lane(mut lanes: Lanes, mut visit: impl FnMut(Lane, LaneIndex)) {
    while lanes.is_non_empty() {
        let lane = lanes.highest_priority_lane();
        let Some(index) = lane.to_index() else {
            break;
        };
        visit(lane, index);
        lanes = lanes.remove_lane(lane);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn lanes(lanes: &[Lane]) -> Lanes {
        lanes
            .iter()
            .copied()
            .fold(Lanes::NO, |acc, lane| acc.merge_lane(lane))
    }

    #[test]
    fn root_lane_state_initializes_react_lane_maps() {
        let state = RootLaneState::new();

        assert_eq!(state.features(), RootLaneFeatureFlags::STABLE_REACT_19_2_6);
        assert_eq!(state.pending_lanes(), Lanes::NO);
        assert_eq!(state.suspended_lanes(), Lanes::NO);
        assert_eq!(state.pinged_lanes(), Lanes::NO);
        assert_eq!(state.warm_lanes(), Lanes::NO);
        assert_eq!(state.expired_lanes(), Lanes::NO);
        assert_eq!(state.entangled_lanes(), Lanes::NO);
        assert_eq!(state.indicator_lanes(), Lanes::NO);
        assert_eq!(state.error_recovery_disabled_lanes(), Lanes::NO);

        for lane in Lane::ALL {
            assert_eq!(state.expiration_time(lane), Some(NO_TIMESTAMP));
            assert_eq!(state.entanglement(lane), Some(Lanes::NO));
            assert_eq!(state.hidden_update_count(lane), Some(0));
        }
    }

    #[test]
    fn highest_priority_lanes_match_react_grouping() {
        assert_eq!(highest_priority_lanes(Lanes::NO), Lanes::NO);
        assert_eq!(
            highest_priority_lanes(lanes(&[
                Lane::SYNC,
                Lane::INPUT_CONTINUOUS,
                Lane::DEFAULT,
                Lane::TRANSITION_1,
            ])),
            Lanes::SYNC_UPDATE
        );
        assert_eq!(
            highest_priority_lanes(lanes(&[Lane::TRANSITION_1, Lane::TRANSITION_4])),
            lanes(&[Lane::TRANSITION_1, Lane::TRANSITION_4])
        );
        assert_eq!(
            highest_priority_lanes(lanes(&[Lane::TRANSITION_11, Lane::TRANSITION_14])),
            lanes(&[Lane::TRANSITION_11, Lane::TRANSITION_14])
        );
        assert_eq!(
            highest_priority_lanes(lanes(&[Lane::RETRY_2, Lane::RETRY_4])),
            lanes(&[Lane::RETRY_2, Lane::RETRY_4])
        );
        assert_eq!(highest_priority_lanes(Lanes::DEFERRED), Lanes::NO);
    }

    #[test]
    fn mark_updated_tracks_pending_and_resets_non_idle_suspension() {
        let mut state = RootLaneState::new();

        state.mark_updated(Lane::DEFAULT);
        state.mark_suspended(Lanes::DEFAULT, Lane::NO, true);
        state.mark_pinged(Lanes::DEFAULT);
        assert_eq!(state.suspended_lanes(), Lanes::DEFAULT);
        assert_eq!(state.pinged_lanes(), Lanes::DEFAULT);
        assert_eq!(state.warm_lanes(), Lanes::NO);

        state.mark_updated(Lane::TRANSITION_1);
        assert_eq!(
            state.pending_lanes(),
            lanes(&[Lane::DEFAULT, Lane::TRANSITION_1])
        );
        assert_eq!(state.suspended_lanes(), Lanes::NO);
        assert_eq!(state.pinged_lanes(), Lanes::NO);
        assert_eq!(state.warm_lanes(), Lanes::NO);

        state.mark_suspended(Lanes::DEFAULT, Lane::NO, true);
        state.mark_pinged(Lanes::DEFAULT);
        state.mark_updated(Lane::IDLE);
        assert_eq!(state.suspended_lanes(), Lanes::DEFAULT);
        assert_eq!(state.pinged_lanes(), Lanes::DEFAULT);
        assert_eq!(state.warm_lanes(), Lanes::NO);
    }

    #[test]
    fn transition_indicator_bookkeeping_is_feature_gated() {
        let mut stable_state = RootLaneState::new();
        stable_state.mark_updated(Lane::TRANSITION_1);
        assert_eq!(stable_state.indicator_lanes(), Lanes::NO);

        let mut flagged_state = RootLaneState::with_features(
            RootLaneFeatureFlags::new().with_default_transition_indicator(true),
        );
        flagged_state.mark_updated(Lane::TRANSITION_1);
        flagged_state.mark_updated(Lane::DEFAULT);
        assert_eq!(
            flagged_state.indicator_lanes(),
            Lanes::TRANSITION.intersect(Lanes::from(Lane::TRANSITION_1))
        );
    }

    #[test]
    fn mark_suspended_clears_pings_expiration_and_records_warm_lanes() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::DEFAULT);
        state.mark_pinged(Lanes::DEFAULT);
        assert!(state.set_expiration_time(Lane::DEFAULT, 1234));

        state.mark_suspended(Lanes::DEFAULT, Lane::NO, true);

        assert_eq!(state.suspended_lanes(), Lanes::DEFAULT);
        assert_eq!(state.pinged_lanes(), Lanes::NO);
        assert_eq!(state.warm_lanes(), Lanes::DEFAULT);
        assert_eq!(state.expiration_time(Lane::DEFAULT), Some(NO_TIMESTAMP));
    }

    #[test]
    fn spawned_deferred_lanes_become_pending_and_entangled() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::DEFAULT);
        state.mark_suspended(Lanes::DEFAULT, Lane::TRANSITION_11, true);

        assert!(state.pending_lanes().contains_lane(Lane::TRANSITION_11));
        assert!(!state.suspended_lanes().contains_lane(Lane::TRANSITION_11));
        assert!(state.entangled_lanes().contains_lane(Lane::TRANSITION_11));
        assert_eq!(
            state.entanglement(Lane::TRANSITION_11),
            Some(Lanes::from(Lane::DEFERRED).merge(Lanes::DEFAULT))
        );
    }

    #[test]
    fn mark_pinged_intersects_suspended_lanes_and_clears_warm_state() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::DEFAULT);
        state.mark_updated(Lane::RETRY_1);
        state.mark_suspended(lanes(&[Lane::DEFAULT, Lane::RETRY_1]), Lane::NO, true);

        state.mark_pinged(lanes(&[Lane::DEFAULT, Lane::TRANSITION_1]));

        assert_eq!(state.pinged_lanes(), Lanes::DEFAULT);
        assert_eq!(state.warm_lanes(), Lanes::from(Lane::RETRY_1));
    }

    #[test]
    fn mark_finished_keeps_remaining_lanes_and_clears_completed_bookkeeping() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::DEFAULT);
        state.mark_updated(Lane::RETRY_1);
        assert!(state.set_expiration_time(Lane::DEFAULT, 10));
        state.mark_expired(lanes(&[Lane::DEFAULT, Lane::RETRY_1]));
        state.mark_error_recovery_disabled(lanes(&[Lane::DEFAULT, Lane::RETRY_1]));
        state.mark_entangled(lanes(&[Lane::DEFAULT, Lane::TRANSITION_1]));
        assert_eq!(
            state.mark_hidden_update(Lane::DEFAULT),
            Some(lanes(&[Lane::DEFAULT, Lane::OFFSCREEN]))
        );

        state.mark_finished(RootFinishedLanes::new(
            Lanes::DEFAULT,
            Lanes::from(Lane::RETRY_1),
        ));

        assert_eq!(state.pending_lanes(), Lanes::from(Lane::RETRY_1));
        assert_eq!(state.suspended_lanes(), Lanes::NO);
        assert_eq!(state.expired_lanes(), Lanes::from(Lane::RETRY_1));
        assert_eq!(
            state.error_recovery_disabled_lanes(),
            Lanes::from(Lane::RETRY_1)
        );
        assert_eq!(state.expiration_time(Lane::DEFAULT), Some(NO_TIMESTAMP));
        assert_eq!(state.entanglement(Lane::DEFAULT), Some(Lanes::NO));
        assert_eq!(state.hidden_update_count(Lane::DEFAULT), Some(0));
    }

    #[test]
    fn mark_finished_records_fresh_suspended_retry_lanes_without_updates() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::DEFAULT);

        state.mark_finished(
            RootFinishedLanes::new(Lanes::DEFAULT, Lanes::NO)
                .with_suspended_retry_lanes(Lanes::from(Lane::RETRY_1)),
        );
        assert_eq!(state.suspended_lanes(), Lanes::from(Lane::RETRY_1));

        let mut updated_state = RootLaneState::new();
        updated_state.mark_updated(Lane::DEFAULT);
        updated_state.mark_finished(
            RootFinishedLanes::new(Lanes::DEFAULT, Lanes::NO)
                .with_suspended_retry_lanes(Lanes::from(Lane::RETRY_1))
                .with_updated_lanes(Lanes::DEFAULT),
        );
        assert_eq!(updated_state.suspended_lanes(), Lanes::NO);
    }

    #[test]
    fn mark_entangled_records_react_transitive_bookkeeping() {
        let mut state = RootLaneState::new();

        state.mark_entangled(lanes(&[Lane::TRANSITION_1, Lane::TRANSITION_2]));
        state.mark_entangled(lanes(&[Lane::TRANSITION_2, Lane::TRANSITION_3]));

        assert_eq!(
            state.entanglement(Lane::TRANSITION_1),
            Some(lanes(&[
                Lane::TRANSITION_1,
                Lane::TRANSITION_2,
                Lane::TRANSITION_3,
            ]))
        );
        assert_eq!(
            state.entangled_lanes_for(Lanes::from(Lane::TRANSITION_1)),
            lanes(&[Lane::TRANSITION_1, Lane::TRANSITION_2, Lane::TRANSITION_3,])
        );
    }

    #[test]
    fn upgrade_pending_lanes_to_sync_entangles_upgraded_lanes_with_sync() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::TRANSITION_1);

        state.upgrade_pending_lanes_to_sync(Lanes::from(Lane::TRANSITION_1));

        assert!(state.pending_lanes().contains_lane(Lane::SYNC));
        assert!(state.entangled_lanes().contains_lane(Lane::SYNC));
        assert_eq!(
            state.entanglement(Lane::SYNC),
            Some(Lanes::from(Lane::TRANSITION_1))
        );
        assert_eq!(state.entanglement(Lane::TRANSITION_1), Some(Lanes::NO));
        assert_eq!(
            state.entangled_lanes_for(Lanes::SYNC),
            lanes(&[Lane::SYNC, Lane::TRANSITION_1])
        );
        assert_eq!(
            state.entangled_lanes_for(Lanes::from(Lane::TRANSITION_1)),
            Lanes::from(Lane::TRANSITION_1)
        );
    }

    #[test]
    fn input_continuous_entanglement_matches_react_source_grouping() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::INPUT_CONTINUOUS);
        state.mark_updated(Lane::DEFAULT);

        assert_eq!(
            state.highest_priority_pending_lanes(),
            lanes(&[Lane::INPUT_CONTINUOUS, Lane::DEFAULT])
        );
        assert_eq!(
            state.entangled_lanes_for(lanes(&[Lane::INPUT_CONTINUOUS, Lane::DEFAULT])),
            lanes(&[Lane::INPUT_CONTINUOUS, Lane::DEFAULT])
        );
        assert_eq!(
            state.entangled_lanes_for(Lanes::INPUT_CONTINUOUS),
            Lanes::INPUT_CONTINUOUS
        );
    }

    #[test]
    fn get_next_lanes_returns_no_work_without_pending_lanes() {
        let state = RootLaneState::new();

        assert_eq!(state.get_next_lanes(Lanes::NO, false), Lanes::NO);
        assert_eq!(get_next_lanes(&state, Lanes::NO, false), Lanes::NO);
    }

    #[test]
    fn get_next_lanes_selects_fresh_non_idle_pending_lanes() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::TRANSITION_1);
        state.mark_updated(Lane::DEFAULT);
        state.mark_updated(Lane::IDLE);

        assert_eq!(state.highest_priority_pending_lanes(), Lanes::DEFAULT);
        assert_eq!(state.get_next_lanes(Lanes::NO, false), Lanes::DEFAULT);
    }

    #[test]
    fn get_next_lanes_respects_suspended_pinged_and_prewarm_state() {
        let mut warm_state = RootLaneState::new();
        warm_state.mark_updated(Lane::DEFAULT);
        warm_state.mark_suspended(Lanes::DEFAULT, Lane::NO, true);

        assert_eq!(warm_state.get_next_lanes(Lanes::NO, false), Lanes::NO);
        assert!(warm_state.check_if_root_is_prerendering(Lanes::DEFAULT));

        warm_state.mark_pinged(Lanes::DEFAULT);
        assert_eq!(warm_state.get_next_lanes(Lanes::NO, false), Lanes::DEFAULT);
        assert!(!warm_state.check_if_root_is_prerendering(Lanes::DEFAULT));

        let mut prewarm_state = RootLaneState::new();
        prewarm_state.mark_updated(Lane::DEFAULT);
        prewarm_state.mark_suspended(Lanes::DEFAULT, Lane::NO, false);

        assert_eq!(
            prewarm_state.get_next_lanes(Lanes::NO, false),
            Lanes::DEFAULT
        );
        assert!(check_if_root_is_prerendering(
            &prewarm_state,
            Lanes::DEFAULT
        ));
        assert_eq!(prewarm_state.get_next_lanes(Lanes::NO, true), Lanes::NO);
    }

    #[test]
    fn get_next_lanes_waits_on_non_idle_work_before_idle_work() {
        let mut idle_only = RootLaneState::new();
        idle_only.mark_updated(Lane::IDLE);
        assert_eq!(idle_only.get_next_lanes(Lanes::NO, false), Lanes::IDLE);

        let mut state = RootLaneState::new();
        state.mark_updated(Lane::DEFAULT);
        state.mark_suspended(Lanes::DEFAULT, Lane::NO, true);
        state.mark_updated(Lane::IDLE);

        assert_eq!(state.get_next_lanes(Lanes::NO, false), Lanes::NO);
    }

    #[test]
    fn get_next_lanes_groups_retries_and_waits_for_retry_ping() {
        let mut pending_state = RootLaneState::new();
        pending_state.mark_updated(Lane::RETRY_1);
        pending_state.mark_updated(Lane::RETRY_3);

        assert_eq!(
            pending_state.get_next_lanes(Lanes::NO, false),
            lanes(&[Lane::RETRY_1, Lane::RETRY_3])
        );

        let mut suspended_state = RootLaneState::new();
        suspended_state.mark_updated(Lane::RETRY_1);
        suspended_state.mark_updated(Lane::RETRY_2);
        suspended_state.mark_suspended(lanes(&[Lane::RETRY_1, Lane::RETRY_2]), Lane::NO, true);
        assert_eq!(suspended_state.get_next_lanes(Lanes::NO, false), Lanes::NO);

        suspended_state.mark_pinged(Lanes::from(Lane::RETRY_2));
        assert_eq!(
            suspended_state.get_next_lanes(Lanes::NO, false),
            Lanes::from(Lane::RETRY_2)
        );
    }

    #[test]
    fn get_next_lanes_groups_sync_updates_like_react_source() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::SYNC);
        state.mark_updated(Lane::INPUT_CONTINUOUS);
        state.mark_updated(Lane::DEFAULT);
        state.mark_updated(Lane::TRANSITION_1);

        assert_eq!(state.get_next_lanes(Lanes::NO, false), Lanes::SYNC_UPDATE);
    }

    #[test]
    fn get_next_lanes_preserves_in_progress_work_when_priority_allows() {
        let mut lower_priority_update = RootLaneState::new();
        lower_priority_update.mark_updated(Lane::TRANSITION_1);
        assert_eq!(
            lower_priority_update.get_next_lanes(Lanes::DEFAULT, false),
            Lanes::DEFAULT
        );

        let mut default_during_transition = RootLaneState::new();
        default_during_transition.mark_updated(Lane::DEFAULT);
        default_during_transition.mark_updated(Lane::TRANSITION_1);
        assert_eq!(
            default_during_transition.get_next_lanes(Lanes::from(Lane::TRANSITION_1), false),
            Lanes::from(Lane::TRANSITION_1)
        );

        let mut higher_priority_update = RootLaneState::new();
        higher_priority_update.mark_updated(Lane::SYNC);
        higher_priority_update.mark_updated(Lane::DEFAULT);
        assert_eq!(
            higher_priority_update.get_next_lanes(Lanes::DEFAULT, false),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
    }

    #[test]
    fn get_next_lanes_keeps_selection_priority_separate_from_entanglements() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::DEFAULT);
        state.mark_updated(Lane::TRANSITION_1);
        state.mark_entangled(lanes(&[Lane::DEFAULT, Lane::TRANSITION_1]));

        let selected = state.get_next_lanes(Lanes::NO, false);
        assert_eq!(selected, Lanes::DEFAULT);
        assert_eq!(
            state.entangled_lanes_for(selected),
            lanes(&[Lane::DEFAULT, Lane::TRANSITION_1])
        );
    }

    #[test]
    fn get_next_lanes_exposes_expired_lanes_without_changing_selection_priority() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::TRANSITION_1);
        state.mark_expired(Lanes::from(Lane::TRANSITION_1));

        let expired_selected = state.get_next_lanes(Lanes::NO, false);
        assert_eq!(expired_selected, Lanes::from(Lane::TRANSITION_1));
        assert!(state.includes_expired_lane(expired_selected));

        state.mark_updated(Lane::DEFAULT);
        let higher_priority_selected = state.get_next_lanes(Lanes::NO, false);
        assert_eq!(higher_priority_selected, Lanes::DEFAULT);
        assert!(!state.includes_expired_lane(higher_priority_selected));
    }

    #[test]
    fn get_next_lanes_to_flush_sync_excludes_suspended_lanes_until_pinged() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::DEFAULT);
        state.mark_suspended(Lanes::DEFAULT, Lane::NO, true);

        assert_eq!(get_next_lanes_to_flush_sync(&state, Lanes::NO), Lanes::NO);

        state.mark_pinged(Lanes::DEFAULT);
        assert_eq!(
            state.get_next_lanes_to_flush_sync(Lanes::NO),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
    }

    #[test]
    fn get_next_lanes_to_flush_sync_batches_equal_or_higher_priority_lanes() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::DEFAULT);
        state.mark_updated(Lane::TRANSITION_1);
        state.mark_updated(Lane::RETRY_1);

        let selected = state.get_next_lanes_to_flush_sync(Lane::TRANSITION_1);

        assert_eq!(
            selected,
            lanes(&[Lane::SYNC, Lane::DEFAULT, Lane::TRANSITION_1])
        );
        assert!(!selected.contains_lane(Lane::RETRY_1));
    }

    #[test]
    fn get_next_lanes_to_flush_sync_isolates_hydration_lanes() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::DEFAULT_HYDRATION);
        state.mark_updated(Lane::DEFAULT);

        let selected = state.get_next_lanes_to_flush_sync(Lanes::NO);

        assert_eq!(
            selected,
            lanes(&[Lane::SYNC_HYDRATION, Lane::DEFAULT_HYDRATION])
        );
        assert!(!selected.contains_lane(Lane::DEFAULT));
    }

    #[test]
    fn offscreen_suspended_warm_selection_fails_closed_until_pinged() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::OFFSCREEN);
        state.mark_suspended(Lanes::OFFSCREEN, Lane::NO, true);

        // Core does not own Offscreen visibility or wakeable listeners yet, so
        // fully warm suspended Offscreen work stays unscheduled until a ping or
        // a future update changes the lane state.
        assert_eq!(state.get_next_lanes(Lanes::NO, false), Lanes::NO);
        assert!(state.check_if_root_is_prerendering(Lanes::OFFSCREEN));

        state.mark_pinged(Lanes::OFFSCREEN);
        assert_eq!(state.get_next_lanes(Lanes::NO, false), Lanes::OFFSCREEN);
        assert!(!state.check_if_root_is_prerendering(Lanes::OFFSCREEN));
    }

    #[test]
    fn starved_lane_expiration_matches_stable_feature_flags() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::DEFAULT);
        state.mark_updated(Lane::RETRY_1);
        state.mark_starved_lanes_as_expired(100);

        assert_eq!(
            state.expiration_time(Lane::DEFAULT),
            Some(100 + TRANSITION_LANE_EXPIRATION_MS)
        );
        assert_eq!(state.expiration_time(Lane::RETRY_1), Some(NO_TIMESTAMP));

        state.mark_starved_lanes_as_expired(100 + TRANSITION_LANE_EXPIRATION_MS);
        assert!(state.includes_expired_lane(Lanes::DEFAULT));
        assert!(!state.includes_expired_lane(Lanes::from(Lane::RETRY_1)));
    }

    #[test]
    fn starved_suspended_lanes_only_expire_after_ping() {
        let mut state = RootLaneState::new();
        state.mark_updated(Lane::DEFAULT);
        state.mark_suspended(Lanes::DEFAULT, Lane::NO, false);

        state.mark_starved_lanes_as_expired(100);
        assert_eq!(state.expiration_time(Lane::DEFAULT), Some(NO_TIMESTAMP));

        state.mark_pinged(Lanes::DEFAULT);
        state.mark_starved_lanes_as_expired(100);
        assert_eq!(
            state.expiration_time(Lane::DEFAULT),
            Some(100 + TRANSITION_LANE_EXPIRATION_MS)
        );
    }

    #[test]
    fn retry_lane_expiration_can_be_enabled_for_non_stable_builds() {
        let mut state = RootLaneState::with_features(
            RootLaneFeatureFlags::new().with_retry_lane_expiration(true),
        );
        state.mark_updated(Lane::RETRY_1);

        state.mark_starved_lanes_as_expired(10);
        assert_eq!(
            state.expiration_time(Lane::RETRY_1),
            Some(10 + RETRY_LANE_EXPIRATION_MS)
        );
    }

    #[test]
    fn hidden_update_bookkeeping_tracks_offscreen_lane_marking() {
        let mut state = RootLaneState::new();

        assert_eq!(
            state.mark_hidden_update(Lane::DEFAULT),
            Some(lanes(&[Lane::DEFAULT, Lane::OFFSCREEN]))
        );
        assert_eq!(state.mark_hidden_update(Lane::NO), None);
        assert_eq!(state.hidden_update_count(Lane::DEFAULT), Some(1));

        state.clear_hidden_updates_for_lanes(Lanes::DEFAULT);
        assert_eq!(state.hidden_update_count(Lane::DEFAULT), Some(0));
    }

    #[test]
    fn lane_claimers_cycle_through_react_lane_ranges() {
        let mut claimers = LaneClaimers::new();

        let claimed_transition_updates = (0..11)
            .map(|_| claimers.claim_next_transition_update_lane())
            .collect::<Vec<_>>();
        assert_eq!(claimed_transition_updates[0], Lane::TRANSITION_1);
        assert_eq!(claimed_transition_updates[9], Lane::TRANSITION_10);
        assert_eq!(claimed_transition_updates[10], Lane::TRANSITION_1);

        let claimed_deferred = (0..5)
            .map(|_| claimers.claim_next_transition_deferred_lane())
            .collect::<Vec<_>>();
        assert_eq!(claimed_deferred[0], Lane::TRANSITION_11);
        assert_eq!(claimed_deferred[3], Lane::TRANSITION_14);
        assert_eq!(claimed_deferred[4], Lane::TRANSITION_11);

        let claimed_retries = (0..5)
            .map(|_| claimers.claim_next_retry_lane())
            .collect::<Vec<_>>();
        assert_eq!(claimed_retries[0], Lane::RETRY_1);
        assert_eq!(claimed_retries[3], Lane::RETRY_4);
        assert_eq!(claimed_retries[4], Lane::RETRY_1);
    }
}
