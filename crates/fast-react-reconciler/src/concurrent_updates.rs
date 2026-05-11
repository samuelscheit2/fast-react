//! Concurrent update staging hooks.
//!
//! React stages concurrent updates as `(fiber, queue, update, lane)` tuples and
//! drains them into each queue's shared pending ring after the current render
//! boundary. This module keeps that data shape available without implementing
//! the work loop that will eventually decide when to drain it.

use std::collections::HashSet;
use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{FiberId, FiberTag, FiberTopologyError, Lane, Lanes, UpdateQueueHandle};
use fast_react_host_config::HostTypes;

use crate::{FiberRootId, FiberRootStore, FiberRootStoreError, UpdateId, UpdateQueueError};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StagedConcurrentUpdate {
    fiber: FiberId,
    queue: Option<UpdateQueueHandle>,
    update: Option<UpdateId>,
    lane: Lane,
}

impl StagedConcurrentUpdate {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn queue(self) -> Option<UpdateQueueHandle> {
        self.queue
    }

    #[must_use]
    pub const fn update(self) -> Option<UpdateId> {
        self.update
    }

    #[must_use]
    pub const fn lane(self) -> Lane {
        self.lane
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct ConcurrentUpdateStaging {
    staged: Vec<StagedConcurrentUpdate>,
    concurrently_updated_lanes: Lanes,
}

impl ConcurrentUpdateStaging {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            staged: Vec::new(),
            concurrently_updated_lanes: Lanes::NO,
        }
    }

    pub fn push(
        &mut self,
        fiber: FiberId,
        queue: Option<UpdateQueueHandle>,
        update: Option<UpdateId>,
        lane: Lane,
    ) {
        self.staged.push(StagedConcurrentUpdate {
            fiber,
            queue,
            update,
            lane,
        });
        self.concurrently_updated_lanes = self.concurrently_updated_lanes.merge_lane(lane);
    }

    #[must_use]
    pub fn staged(&self) -> &[StagedConcurrentUpdate] {
        &self.staged
    }

    #[must_use]
    pub const fn concurrently_updated_lanes(&self) -> Lanes {
        self.concurrently_updated_lanes
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.staged.is_empty()
    }

    fn take_staged(&mut self) -> Vec<StagedConcurrentUpdate> {
        self.concurrently_updated_lanes = Lanes::NO;
        std::mem::take(&mut self.staged)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConcurrentUpdateError {
    FiberTopology(FiberTopologyError),
    FiberRootStore(FiberRootStoreError),
    UpdateQueue(UpdateQueueError),
    MissingRootForFiber {
        fiber: FiberId,
    },
    InvalidHostRootStateNode {
        fiber: FiberId,
        raw: u64,
    },
    InvalidStagedTupleShape {
        fiber: FiberId,
        queue: Option<UpdateQueueHandle>,
        update: Option<UpdateId>,
    },
    StagingLanesMismatch {
        computed: Lanes,
        recorded: Lanes,
    },
    DuplicateStagedUpdate {
        update: UpdateId,
    },
    StagedUpdateAlreadyLinked {
        update: UpdateId,
        linked_next: UpdateId,
    },
    StagedQueueFiberMismatch {
        fiber: FiberId,
        fiber_queue: UpdateQueueHandle,
        staged_queue: UpdateQueueHandle,
    },
    StagedUpdateLaneMismatch {
        update: UpdateId,
        expected: Lanes,
        actual: Lanes,
    },
    StagedSourceLaneMissing {
        fiber: FiberId,
        lane: Lane,
        source_lanes: Lanes,
    },
    StagedRootCurrentMismatch {
        root: FiberRootId,
        current: FiberId,
        staged_host_root: FiberId,
    },
    DrainedWrongRoot {
        fiber: FiberId,
        expected: FiberRootId,
        actual: FiberRootId,
    },
}

impl Display for ConcurrentUpdateError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::UpdateQueue(error) => Display::fmt(error, formatter),
            Self::MissingRootForFiber { fiber } => {
                write!(
                    formatter,
                    "fiber slot {} is not attached to a HostRoot",
                    fiber.slot().get()
                )
            }
            Self::InvalidHostRootStateNode { fiber, raw } => write!(
                formatter,
                "HostRoot fiber slot {} has invalid root state node handle {}",
                fiber.slot().get(),
                raw
            ),
            Self::InvalidStagedTupleShape {
                fiber,
                queue,
                update,
            } => write!(
                formatter,
                "staged concurrent update for fiber slot {} has incomplete queue/update tuple: queue {:?}, update {:?}",
                fiber.slot().get(),
                queue,
                update
            ),
            Self::StagingLanesMismatch { computed, recorded } => write!(
                formatter,
                "staged concurrent update lanes mismatch: entries compute {:?}, staging recorded {:?}",
                computed, recorded
            ),
            Self::DuplicateStagedUpdate { update } => {
                write!(
                    formatter,
                    "concurrent update {} was staged more than once",
                    update.raw()
                )
            }
            Self::StagedUpdateAlreadyLinked {
                update,
                linked_next,
            } => write!(
                formatter,
                "concurrent update {} is already linked to pending update {}",
                update.raw(),
                linked_next.raw()
            ),
            Self::StagedQueueFiberMismatch {
                fiber,
                fiber_queue,
                staged_queue,
            } => write!(
                formatter,
                "staged concurrent update for fiber slot {} used queue {}, but the fiber owns queue {}",
                fiber.slot().get(),
                staged_queue.raw(),
                fiber_queue.raw()
            ),
            Self::StagedUpdateLaneMismatch {
                update,
                expected,
                actual,
            } => write!(
                formatter,
                "staged concurrent update {} lane mismatch: expected {:?}, actual {:?}",
                update.raw(),
                expected,
                actual
            ),
            Self::StagedSourceLaneMissing {
                fiber,
                lane,
                source_lanes,
            } => write!(
                formatter,
                "staged concurrent update for fiber slot {} did not retain source lane {:?}; source lanes {:?}",
                fiber.slot().get(),
                lane,
                source_lanes
            ),
            Self::StagedRootCurrentMismatch {
                root,
                current,
                staged_host_root,
            } => write!(
                formatter,
                "staged concurrent update for root {} reached HostRoot fiber slot {}, but current is fiber slot {}",
                root.raw(),
                staged_host_root.slot().get(),
                current.slot().get()
            ),
            Self::DrainedWrongRoot {
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "staged concurrent update for fiber slot {} drained to root {}, expected root {}",
                fiber.slot().get(),
                actual.raw(),
                expected.raw()
            ),
        }
    }
}

impl Error for ConcurrentUpdateError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::FiberRootStore(error) => Some(error),
            Self::UpdateQueue(error) => Some(error),
            Self::MissingRootForFiber { .. }
            | Self::InvalidHostRootStateNode { .. }
            | Self::InvalidStagedTupleShape { .. }
            | Self::StagingLanesMismatch { .. }
            | Self::DuplicateStagedUpdate { .. }
            | Self::StagedUpdateAlreadyLinked { .. }
            | Self::StagedQueueFiberMismatch { .. }
            | Self::StagedUpdateLaneMismatch { .. }
            | Self::StagedSourceLaneMissing { .. }
            | Self::StagedRootCurrentMismatch { .. }
            | Self::DrainedWrongRoot { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for ConcurrentUpdateError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<FiberRootStoreError> for ConcurrentUpdateError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<UpdateQueueError> for ConcurrentUpdateError {
    fn from(error: UpdateQueueError) -> Self {
        Self::UpdateQueue(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FinishedConcurrentUpdates {
    drained: Vec<StagedConcurrentUpdate>,
    roots: Vec<FiberRootId>,
    drain_currentness: Vec<ConcurrentUpdateDrainCurrentness>,
}

impl FinishedConcurrentUpdates {
    #[must_use]
    pub fn drained(&self) -> &[StagedConcurrentUpdate] {
        &self.drained
    }

    #[must_use]
    pub fn roots(&self) -> &[FiberRootId] {
        &self.roots
    }

    #[cfg(test)]
    fn drain_currentness(&self) -> &[ConcurrentUpdateDrainCurrentness] {
        &self.drain_currentness
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ConcurrentUpdateDrainCurrentness {
    source_sequence: u64,
    staged_index: usize,
    root: FiberRootId,
    root_current: FiberId,
    staged_host_root: FiberId,
    fiber: FiberId,
    queue: Option<UpdateQueueHandle>,
    update: Option<UpdateId>,
    lane: Lane,
    update_lanes: Lanes,
    queue_pending_before: Option<UpdateId>,
    queue_pending_after: Option<UpdateId>,
    source_lanes_before: Lanes,
    source_lanes_after: Lanes,
    root_pending_lanes_before: Lanes,
    root_pending_lanes_after: Lanes,
    source_owned: bool,
    caller_shaped_rows_accepted: bool,
}

#[cfg(test)]
impl ConcurrentUpdateDrainCurrentness {
    #[must_use]
    pub(crate) const fn source_sequence(self) -> u64 {
        self.source_sequence
    }

    #[must_use]
    pub(crate) const fn staged_index(self) -> usize {
        self.staged_index
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn root_current(self) -> FiberId {
        self.root_current
    }

    #[must_use]
    pub(crate) const fn staged_host_root(self) -> FiberId {
        self.staged_host_root
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn queue(self) -> Option<UpdateQueueHandle> {
        self.queue
    }

    #[must_use]
    pub(crate) const fn update(self) -> Option<UpdateId> {
        self.update
    }

    #[must_use]
    pub(crate) const fn lane(self) -> Lane {
        self.lane
    }

    #[must_use]
    pub(crate) const fn update_lanes(self) -> Lanes {
        self.update_lanes
    }

    #[must_use]
    pub(crate) const fn queue_pending_before(self) -> Option<UpdateId> {
        self.queue_pending_before
    }

    #[must_use]
    pub(crate) const fn queue_pending_after(self) -> Option<UpdateId> {
        self.queue_pending_after
    }

    #[must_use]
    pub(crate) const fn source_lanes_before(self) -> Lanes {
        self.source_lanes_before
    }

    #[must_use]
    pub(crate) const fn source_lanes_after(self) -> Lanes {
        self.source_lanes_after
    }

    #[must_use]
    pub(crate) const fn root_pending_lanes_before(self) -> Lanes {
        self.root_pending_lanes_before
    }

    #[must_use]
    pub(crate) const fn root_pending_lanes_after(self) -> Lanes {
        self.root_pending_lanes_after
    }

    #[must_use]
    pub(crate) const fn source_owned(self) -> bool {
        self.source_owned
    }

    #[must_use]
    pub(crate) const fn caller_shaped_rows_accepted(self) -> bool {
        self.caller_shaped_rows_accepted
    }

    #[must_use]
    pub(crate) fn proves_source_owned_currentness(self) -> bool {
        self.source_owned
            && !self.caller_shaped_rows_accepted
            && self.root_current == self.staged_host_root
            && (self.lane == Lane::NO || self.source_lanes_after.contains_lane(self.lane))
            && (self.lane == Lane::NO || self.root_pending_lanes_after.contains_lane(self.lane))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct ValidatedConcurrentUpdateDrain {
    entry: StagedConcurrentUpdate,
    staged_index: usize,
    root: FiberRootId,
    root_current: FiberId,
    staged_host_root: FiberId,
    queue_pending_before: Option<UpdateId>,
    update_lanes: Lanes,
    source_lanes_before: Lanes,
    root_pending_lanes_before: Lanes,
}

pub fn enqueue_concurrent_host_root_update<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    fiber: FiberId,
    queue: UpdateQueueHandle,
    update: UpdateId,
    lane: Lane,
) -> Result<FiberRootId, ConcurrentUpdateError> {
    mark_source_fiber_lanes(store, fiber, lane.to_lanes())?;
    store
        .concurrent_updates_mut()
        .push(fiber, Some(queue), Some(update), lane);
    root_for_updated_fiber(store, fiber)
}

pub fn finish_queueing_concurrent_updates<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> Result<FinishedConcurrentUpdates, ConcurrentUpdateError> {
    let validated = validate_staged_concurrent_updates_for_drain(store)?;
    let staged = store.concurrent_updates_mut().take_staged();
    let mut roots = Vec::new();
    let mut drain_currentness = Vec::with_capacity(staged.len());

    for (entry, validation) in staged.iter().zip(&validated) {
        debug_assert_eq!(*entry, validation.entry);
        if let (Some(queue), Some(update)) = (entry.queue, entry.update) {
            store
                .update_queues_mut()
                .append_pending_update(queue, update)?;
        }

        if entry.lane != Lane::NO {
            let root = mark_update_lane_from_fiber_to_root(store, entry.fiber, entry.lane)?;
            if root != validation.root {
                return Err(ConcurrentUpdateError::DrainedWrongRoot {
                    fiber: entry.fiber,
                    expected: validation.root,
                    actual: root,
                });
            }
            if !roots.contains(&root) {
                roots.push(root);
            }
        }

        let queue_pending_after = if let Some(queue) = entry.queue {
            store.update_queues().queue(queue)?.shared().pending()
        } else {
            None
        };
        let source_lanes_after = store.fiber_arena().get(entry.fiber)?.lanes();
        let root_pending_lanes_after = store.root(validation.root)?.lanes().pending_lanes();

        drain_currentness.push(ConcurrentUpdateDrainCurrentness {
            source_sequence: validation.staged_index as u64 + 1,
            staged_index: validation.staged_index,
            root: validation.root,
            root_current: validation.root_current,
            staged_host_root: validation.staged_host_root,
            fiber: entry.fiber,
            queue: entry.queue,
            update: entry.update,
            lane: entry.lane,
            update_lanes: validation.update_lanes,
            queue_pending_before: validation.queue_pending_before,
            queue_pending_after,
            source_lanes_before: validation.source_lanes_before,
            source_lanes_after,
            root_pending_lanes_before: validation.root_pending_lanes_before,
            root_pending_lanes_after,
            source_owned: true,
            caller_shaped_rows_accepted: false,
        });
    }

    Ok(FinishedConcurrentUpdates {
        drained: staged,
        roots,
        drain_currentness,
    })
}

fn validate_staged_concurrent_updates_for_drain<H: HostTypes>(
    store: &FiberRootStore<H>,
) -> Result<Vec<ValidatedConcurrentUpdateDrain>, ConcurrentUpdateError> {
    let staged = store.concurrent_updates().staged();
    let mut computed_lanes = Lanes::NO;
    let mut seen_updates = HashSet::new();
    let mut validated = Vec::with_capacity(staged.len());

    for (staged_index, entry) in staged.iter().copied().enumerate() {
        computed_lanes = computed_lanes.merge_lane(entry.lane);

        let (queue_pending_before, update_lanes) = match (entry.queue, entry.update) {
            (Some(queue), Some(update)) => {
                store.update_queues().queue(queue)?;
                let update_record = store.update_queues().update(update)?;
                let update_lanes = update_record.lane();
                let expected_update_lanes = entry.lane.to_lanes();
                if update_lanes.remove_lane(Lane::OFFSCREEN) != expected_update_lanes {
                    return Err(ConcurrentUpdateError::StagedUpdateLaneMismatch {
                        update,
                        expected: expected_update_lanes,
                        actual: update_lanes,
                    });
                }
                if let Some(linked_next) = update_record.next() {
                    return Err(ConcurrentUpdateError::StagedUpdateAlreadyLinked {
                        update,
                        linked_next,
                    });
                }
                if !seen_updates.insert(update) {
                    return Err(ConcurrentUpdateError::DuplicateStagedUpdate { update });
                }
                store.update_queues().pending_updates(queue)?;
                (
                    store.update_queues().queue(queue)?.shared().pending(),
                    update_lanes,
                )
            }
            (None, None) => (None, Lanes::NO),
            _ => {
                return Err(ConcurrentUpdateError::InvalidStagedTupleShape {
                    fiber: entry.fiber,
                    queue: entry.queue,
                    update: entry.update,
                });
            }
        };

        let source = store.fiber_arena().get(entry.fiber)?;
        if let Some(queue) = entry.queue
            && source.update_queue() != queue
        {
            return Err(ConcurrentUpdateError::StagedQueueFiberMismatch {
                fiber: entry.fiber,
                fiber_queue: source.update_queue(),
                staged_queue: queue,
            });
        }

        let source_lanes_before = source.lanes();
        if entry.lane != Lane::NO && !source_lanes_before.contains_lane(entry.lane) {
            return Err(ConcurrentUpdateError::StagedSourceLaneMissing {
                fiber: entry.fiber,
                lane: entry.lane,
                source_lanes: source_lanes_before,
            });
        }

        let (root, staged_host_root) = host_root_for_updated_fiber(store, entry.fiber)?;
        let root_ref = store.root(root)?;
        let root_current = root_ref.current();
        if root_current != staged_host_root {
            return Err(ConcurrentUpdateError::StagedRootCurrentMismatch {
                root,
                current: root_current,
                staged_host_root,
            });
        }

        validated.push(ValidatedConcurrentUpdateDrain {
            entry,
            staged_index,
            root,
            root_current,
            staged_host_root,
            queue_pending_before,
            update_lanes,
            source_lanes_before,
            root_pending_lanes_before: root_ref.lanes().pending_lanes(),
        });
    }

    let recorded_lanes = store.concurrent_updates().concurrently_updated_lanes();
    if computed_lanes != recorded_lanes {
        return Err(ConcurrentUpdateError::StagingLanesMismatch {
            computed: computed_lanes,
            recorded: recorded_lanes,
        });
    }

    Ok(validated)
}

pub fn mark_update_lane_from_fiber_to_root<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    source_fiber: FiberId,
    lane: Lane,
) -> Result<FiberRootId, ConcurrentUpdateError> {
    mark_update_lanes_from_fiber_to_root(store, source_fiber, lane.to_lanes())
}

pub fn mark_update_lanes_from_fiber_to_root<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    source_fiber: FiberId,
    lanes: Lanes,
) -> Result<FiberRootId, ConcurrentUpdateError> {
    mark_source_fiber_lanes(store, source_fiber, lanes)?;
    let mut node = source_fiber;
    let mut parent = store.fiber_arena().get(node)?.return_fiber();

    while let Some(parent_id) = parent {
        {
            let parent_node = store.fiber_arena_mut().get_mut(parent_id)?;
            parent_node.set_child_lanes(parent_node.child_lanes().merge(lanes));
        }

        if let Some(alternate) = store.fiber_arena().get(parent_id)?.alternate() {
            let alternate_node = store.fiber_arena_mut().get_mut(alternate)?;
            alternate_node.set_child_lanes(alternate_node.child_lanes().merge(lanes));
        }

        node = parent_id;
        parent = store.fiber_arena().get(node)?.return_fiber();
    }

    let root = host_root_id_for_fiber(store, node)?;
    for lane in non_empty_lanes(lanes) {
        store.root_mut(root)?.lanes_mut().mark_updated(lane);
    }
    Ok(root)
}

fn mark_source_fiber_lanes<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    source_fiber: FiberId,
    lanes: Lanes,
) -> Result<(), ConcurrentUpdateError> {
    {
        let source = store.fiber_arena_mut().get_mut(source_fiber)?;
        source.merge_lanes(lanes);
    }

    if let Some(alternate) = store.fiber_arena().get(source_fiber)?.alternate() {
        let alternate_node = store.fiber_arena_mut().get_mut(alternate)?;
        alternate_node.merge_lanes(lanes);
    }

    Ok(())
}

fn non_empty_lanes(mut lanes: Lanes) -> impl Iterator<Item = Lane> {
    std::iter::from_fn(move || {
        if lanes.is_empty() {
            return None;
        }
        let lane = lanes.highest_priority_lane();
        lanes = lanes.remove_lane(lane);
        Some(lane)
    })
}

pub(crate) fn root_for_updated_fiber<H: HostTypes>(
    store: &FiberRootStore<H>,
    source_fiber: FiberId,
) -> Result<FiberRootId, ConcurrentUpdateError> {
    host_root_for_updated_fiber(store, source_fiber).map(|(root, _)| root)
}

fn host_root_for_updated_fiber<H: HostTypes>(
    store: &FiberRootStore<H>,
    source_fiber: FiberId,
) -> Result<(FiberRootId, FiberId), ConcurrentUpdateError> {
    let mut node = source_fiber;
    let mut parent = store.fiber_arena().get(node)?.return_fiber();
    while let Some(parent_id) = parent {
        node = parent_id;
        parent = store.fiber_arena().get(node)?.return_fiber();
    }
    Ok((host_root_id_for_fiber(store, node)?, node))
}

fn host_root_id_for_fiber<H: HostTypes>(
    store: &FiberRootStore<H>,
    fiber: FiberId,
) -> Result<FiberRootId, ConcurrentUpdateError> {
    let node = store.fiber_arena().get(fiber)?;
    if node.tag() != FiberTag::HostRoot {
        return Err(ConcurrentUpdateError::MissingRootForFiber { fiber });
    }
    let raw = node.state_node().raw();
    FiberRootId::new(raw).ok_or(ConcurrentUpdateError::InvalidHostRootStateNode { fiber, raw })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{RootElementHandle, RootOptions, RootUpdatePayload};
    use fast_react_core::{PropsHandle, UpdateQueueHandle};

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId) {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id)
    }

    const fn staged_update(
        fiber: FiberId,
        queue: UpdateQueueHandle,
        update: UpdateId,
        lane: Lane,
    ) -> StagedConcurrentUpdate {
        StagedConcurrentUpdate {
            fiber,
            queue: Some(queue),
            update: Some(update),
            lane,
        }
    }

    fn finish_error_preserves_staging(
        store: &mut FiberRootStore<RecordingHost>,
    ) -> ConcurrentUpdateError {
        let before = store.concurrent_updates().clone();
        let error = finish_queueing_concurrent_updates(store).unwrap_err();
        assert_eq!(store.concurrent_updates(), &before);
        error
    }

    #[test]
    fn concurrent_updates_stage_tuple_and_mark_source_fiber_immediately() {
        let (mut store, root_id) = root_store();
        let current = store.root(root_id).unwrap().current();
        let queue = store.ensure_host_root_update_queue(root_id).unwrap();
        let update = store.update_queues_mut().create_update(Lane::DEFAULT);

        let root =
            enqueue_concurrent_host_root_update(&mut store, current, queue, update, Lane::DEFAULT)
                .unwrap();

        assert_eq!(root, root_id);
        assert_eq!(store.concurrent_updates().staged().len(), 1);
        assert!(
            store
                .fiber_arena()
                .get(current)
                .unwrap()
                .lanes()
                .contains_lane(Lane::DEFAULT)
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
    }

    #[test]
    fn concurrent_updates_drain_into_pending_ring_and_mark_root_lanes() {
        let (mut store, root_id) = root_store();
        let current = store.root(root_id).unwrap().current();
        let queue = store.ensure_host_root_update_queue(root_id).unwrap();
        let update = store.update_queues_mut().create_update(Lane::DEFAULT);
        store
            .update_queues_mut()
            .update_mut(update)
            .unwrap()
            .set_payload(RootUpdatePayload::new(RootElementHandle::from_raw(5)));
        enqueue_concurrent_host_root_update(&mut store, current, queue, update, Lane::DEFAULT)
            .unwrap();

        let finished = finish_queueing_concurrent_updates(&mut store).unwrap();

        assert_eq!(finished.roots(), &[root_id]);
        assert_eq!(
            finished.drained(),
            &[staged_update(current, queue, update, Lane::DEFAULT)]
        );
        assert_eq!(store.concurrent_updates().staged(), &[]);
        assert_eq!(
            store.concurrent_updates().concurrently_updated_lanes(),
            Lanes::NO
        );
        assert_eq!(
            store.update_queues().pending_updates(queue).unwrap(),
            vec![update]
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );

        let currentness = finished.drain_currentness();
        assert_eq!(currentness.len(), 1);
        let record = currentness[0];
        assert_eq!(record.source_sequence(), 1);
        assert_eq!(record.staged_index(), 0);
        assert_eq!(record.root(), root_id);
        assert_eq!(record.root_current(), current);
        assert_eq!(record.staged_host_root(), current);
        assert_eq!(record.fiber(), current);
        assert_eq!(record.queue(), Some(queue));
        assert_eq!(record.update(), Some(update));
        assert_eq!(record.lane(), Lane::DEFAULT);
        assert_eq!(record.update_lanes(), Lanes::DEFAULT);
        assert_eq!(record.queue_pending_before(), None);
        assert_eq!(record.queue_pending_after(), Some(update));
        assert_eq!(record.root_pending_lanes_before(), Lanes::NO);
        assert!(record.source_lanes_before().contains_lane(Lane::DEFAULT));
        assert!(record.source_lanes_after().contains_lane(Lane::DEFAULT));
        assert!(
            record
                .root_pending_lanes_after()
                .contains_lane(Lane::DEFAULT)
        );
        assert!(record.source_owned());
        assert!(!record.caller_shaped_rows_accepted());
        assert!(record.proves_source_owned_currentness());
    }

    #[test]
    fn concurrent_update_drain_rejects_incomplete_caller_shaped_tuple() {
        let (mut store, root_id) = root_store();
        let current = store.root(root_id).unwrap().current();
        let queue = store.ensure_host_root_update_queue(root_id).unwrap();

        store
            .concurrent_updates_mut()
            .push(current, Some(queue), None, Lane::DEFAULT);

        let error = finish_error_preserves_staging(&mut store);

        assert!(matches!(
            error,
            ConcurrentUpdateError::InvalidStagedTupleShape {
                fiber,
                queue: Some(actual_queue),
                update: None,
            } if fiber == current && actual_queue == queue
        ));
        assert_eq!(
            store.update_queues().pending_updates(queue).unwrap(),
            Vec::<UpdateId>::new()
        );
    }

    #[test]
    fn concurrent_update_drain_rejects_caller_shaped_row_without_source_lane() {
        let (mut store, root_id) = root_store();
        let current = store.root(root_id).unwrap().current();
        let queue = store.ensure_host_root_update_queue(root_id).unwrap();
        let update = store.update_queues_mut().create_update(Lane::DEFAULT);

        store
            .concurrent_updates_mut()
            .push(current, Some(queue), Some(update), Lane::DEFAULT);

        let error = finish_error_preserves_staging(&mut store);

        assert!(matches!(
            error,
            ConcurrentUpdateError::StagedSourceLaneMissing {
                fiber,
                lane: Lane::DEFAULT,
                source_lanes,
            } if fiber == current && source_lanes == Lanes::NO
        ));
        assert_eq!(
            store.update_queues().pending_updates(queue).unwrap(),
            Vec::<UpdateId>::new()
        );
    }

    #[test]
    fn concurrent_update_drain_rejects_duplicate_staged_update_without_clearing_staging() {
        let (mut store, root_id) = root_store();
        let current = store.root(root_id).unwrap().current();
        let queue = store.ensure_host_root_update_queue(root_id).unwrap();
        let update = store.update_queues_mut().create_update(Lane::DEFAULT);
        enqueue_concurrent_host_root_update(&mut store, current, queue, update, Lane::DEFAULT)
            .unwrap();
        store
            .concurrent_updates_mut()
            .push(current, Some(queue), Some(update), Lane::DEFAULT);

        let error = finish_error_preserves_staging(&mut store);

        assert!(matches!(
            error,
            ConcurrentUpdateError::DuplicateStagedUpdate { update: actual } if actual == update
        ));
        assert_eq!(store.concurrent_updates().staged().len(), 2);
        assert_eq!(
            store.concurrent_updates().concurrently_updated_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(
            store.update_queues().pending_updates(queue).unwrap(),
            Vec::<UpdateId>::new()
        );
    }

    #[test]
    fn concurrent_update_drain_rejects_tampered_staging_lanes_without_clearing_staging() {
        let (mut store, root_id) = root_store();
        let current = store.root(root_id).unwrap().current();
        let queue = store.ensure_host_root_update_queue(root_id).unwrap();
        let update = store.update_queues_mut().create_update(Lane::DEFAULT);
        enqueue_concurrent_host_root_update(&mut store, current, queue, update, Lane::DEFAULT)
            .unwrap();
        store.concurrent_updates_mut().concurrently_updated_lanes = Lanes::SYNC;

        let error = finish_error_preserves_staging(&mut store);

        assert!(matches!(
            error,
            ConcurrentUpdateError::StagingLanesMismatch { computed, recorded }
                if computed == Lanes::DEFAULT && recorded == Lanes::SYNC
        ));
        assert_eq!(
            store.concurrent_updates().concurrently_updated_lanes(),
            Lanes::SYNC
        );
        assert_eq!(
            store.update_queues().pending_updates(queue).unwrap(),
            Vec::<UpdateId>::new()
        );
    }

    #[test]
    fn concurrent_update_drain_rejects_stale_update_and_invalid_queue() {
        let (mut stale_store, stale_root) = root_store();
        let stale_current = stale_store.root(stale_root).unwrap().current();
        let stale_queue = stale_store
            .ensure_host_root_update_queue(stale_root)
            .unwrap();
        let update = stale_store.update_queues_mut().create_update(Lane::DEFAULT);
        let stale_update = UpdateId::new(update.raw() + (1u64 << 32)).unwrap();
        enqueue_concurrent_host_root_update(
            &mut stale_store,
            stale_current,
            stale_queue,
            stale_update,
            Lane::DEFAULT,
        )
        .unwrap();

        let stale_error = finish_error_preserves_staging(&mut stale_store);

        assert!(matches!(
            stale_error,
            ConcurrentUpdateError::UpdateQueue(UpdateQueueError::StaleUpdateId { id, .. })
                if id == stale_update
        ));
        assert_eq!(
            stale_store
                .update_queues()
                .pending_updates(stale_queue)
                .unwrap(),
            Vec::<UpdateId>::new()
        );

        let (mut invalid_queue_store, invalid_queue_root) = root_store();
        let invalid_queue_current = invalid_queue_store
            .root(invalid_queue_root)
            .unwrap()
            .current();
        let queue = invalid_queue_store
            .ensure_host_root_update_queue(invalid_queue_root)
            .unwrap();
        let invalid_queue = UpdateQueueHandle::from_raw(queue.raw() + 100);
        let update = invalid_queue_store
            .update_queues_mut()
            .create_update(Lane::DEFAULT);
        enqueue_concurrent_host_root_update(
            &mut invalid_queue_store,
            invalid_queue_current,
            invalid_queue,
            update,
            Lane::DEFAULT,
        )
        .unwrap();

        let invalid_queue_error = finish_error_preserves_staging(&mut invalid_queue_store);

        assert!(matches!(
            invalid_queue_error,
            ConcurrentUpdateError::UpdateQueue(UpdateQueueError::InvalidQueueHandle { handle })
                if handle == invalid_queue
        ));
    }

    #[test]
    fn concurrent_update_drain_rejects_prelinked_and_replayed_updates() {
        let (mut store, root_id) = root_store();
        let current = store.root(root_id).unwrap().current();
        let queue = store.ensure_host_root_update_queue(root_id).unwrap();
        let prelinked = store.update_queues_mut().create_update(Lane::DEFAULT);
        store
            .update_queues_mut()
            .append_pending_update(queue, prelinked)
            .unwrap();
        enqueue_concurrent_host_root_update(&mut store, current, queue, prelinked, Lane::DEFAULT)
            .unwrap();

        let prelinked_error = finish_error_preserves_staging(&mut store);

        assert!(matches!(
            prelinked_error,
            ConcurrentUpdateError::StagedUpdateAlreadyLinked {
                update,
                linked_next,
            } if update == prelinked && linked_next == prelinked
        ));
        assert_eq!(
            store.update_queues().pending_updates(queue).unwrap(),
            vec![prelinked]
        );

        let (mut replay_store, replay_root) = root_store();
        let replay_current = replay_store.root(replay_root).unwrap().current();
        let replay_queue = replay_store
            .ensure_host_root_update_queue(replay_root)
            .unwrap();
        let replay_update = replay_store
            .update_queues_mut()
            .create_update(Lane::DEFAULT);
        enqueue_concurrent_host_root_update(
            &mut replay_store,
            replay_current,
            replay_queue,
            replay_update,
            Lane::DEFAULT,
        )
        .unwrap();
        finish_queueing_concurrent_updates(&mut replay_store).unwrap();
        enqueue_concurrent_host_root_update(
            &mut replay_store,
            replay_current,
            replay_queue,
            replay_update,
            Lane::DEFAULT,
        )
        .unwrap();

        let replay_error = finish_error_preserves_staging(&mut replay_store);

        assert!(matches!(
            replay_error,
            ConcurrentUpdateError::StagedUpdateAlreadyLinked {
                update,
                linked_next,
            } if update == replay_update && linked_next == replay_update
        ));
        assert_eq!(
            replay_store
                .update_queues()
                .pending_updates(replay_queue)
                .unwrap(),
            vec![replay_update]
        );
    }

    #[test]
    fn concurrent_update_drain_rejects_queue_lane_and_root_current_mismatches() {
        let (mut lane_store, lane_root) = root_store();
        let lane_current = lane_store.root(lane_root).unwrap().current();
        let lane_queue = lane_store.ensure_host_root_update_queue(lane_root).unwrap();
        let lane_update = lane_store.update_queues_mut().create_update(Lane::SYNC);
        enqueue_concurrent_host_root_update(
            &mut lane_store,
            lane_current,
            lane_queue,
            lane_update,
            Lane::DEFAULT,
        )
        .unwrap();

        let lane_error = finish_error_preserves_staging(&mut lane_store);

        assert!(matches!(
            lane_error,
            ConcurrentUpdateError::StagedUpdateLaneMismatch {
                update,
                expected,
                actual,
            } if update == lane_update && expected == Lanes::DEFAULT && actual == Lanes::SYNC
        ));

        let (mut queue_store, first_root) = root_store();
        let second_root = queue_store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let first_current = queue_store.root(first_root).unwrap().current();
        let first_queue = queue_store
            .ensure_host_root_update_queue(first_root)
            .unwrap();
        let second_queue = queue_store
            .ensure_host_root_update_queue(second_root)
            .unwrap();
        let queue_update = queue_store.update_queues_mut().create_update(Lane::DEFAULT);
        enqueue_concurrent_host_root_update(
            &mut queue_store,
            first_current,
            second_queue,
            queue_update,
            Lane::DEFAULT,
        )
        .unwrap();

        let queue_error = finish_error_preserves_staging(&mut queue_store);

        assert!(matches!(
            queue_error,
            ConcurrentUpdateError::StagedQueueFiberMismatch {
                fiber,
                fiber_queue,
                staged_queue,
            } if fiber == first_current
                && fiber_queue == first_queue
                && staged_queue == second_queue
        ));
        assert_eq!(
            queue_store
                .update_queues()
                .pending_updates(second_queue)
                .unwrap(),
            Vec::<UpdateId>::new()
        );

        let (mut current_store, current_root) = root_store();
        let current = current_store.root(current_root).unwrap().current();
        let queue = current_store
            .ensure_host_root_update_queue(current_root)
            .unwrap();
        let work_in_progress = current_store
            .fiber_arena_mut()
            .create_work_in_progress(current, PropsHandle::from_raw(99))
            .unwrap();
        let update = current_store
            .update_queues_mut()
            .create_update(Lane::DEFAULT);
        enqueue_concurrent_host_root_update(
            &mut current_store,
            work_in_progress,
            queue,
            update,
            Lane::DEFAULT,
        )
        .unwrap();

        let current_error = finish_error_preserves_staging(&mut current_store);

        assert!(matches!(
            current_error,
            ConcurrentUpdateError::StagedRootCurrentMismatch {
                root,
                current: actual_current,
                staged_host_root,
            } if root == current_root
                && actual_current == current
                && staged_host_root == work_in_progress
        ));
    }

    #[test]
    fn concurrent_updates_mark_function_component_lane_to_root_path() {
        let (mut store, root_id) = root_store();
        let host_root = store.root(root_id).unwrap().current();
        let function = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            fast_react_core::PropsHandle::from_raw(11),
            fast_react_core::FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(host_root, &[function])
            .unwrap();

        let root =
            mark_update_lane_from_fiber_to_root(&mut store, function, Lane::DEFAULT).unwrap();

        assert_eq!(root, root_id);
        assert!(
            store
                .fiber_arena()
                .get(function)
                .unwrap()
                .lanes()
                .contains_lane(Lane::DEFAULT)
        );
        assert!(
            store
                .fiber_arena()
                .get(host_root)
                .unwrap()
                .child_lanes()
                .contains_lane(Lane::DEFAULT)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );
    }

    #[test]
    fn concurrent_updates_mark_function_component_lanes_to_root_path() {
        let (mut store, root_id) = root_store();
        let host_root = store.root(root_id).unwrap().current();
        let function = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            fast_react_core::PropsHandle::from_raw(21),
            fast_react_core::FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(host_root, &[function])
            .unwrap();
        let lanes = Lanes::SYNC.merge_lane(Lane::TRANSITION_1);

        let root = mark_update_lanes_from_fiber_to_root(&mut store, function, lanes).unwrap();

        assert_eq!(root, root_id);
        assert!(
            store
                .fiber_arena()
                .get(function)
                .unwrap()
                .lanes()
                .contains_all(lanes)
        );
        assert!(
            store
                .fiber_arena()
                .get(host_root)
                .unwrap()
                .child_lanes()
                .contains_all(lanes)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_all(lanes)
        );
    }
}
