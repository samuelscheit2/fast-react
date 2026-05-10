//! Concurrent update staging hooks.
//!
//! React stages concurrent updates as `(fiber, queue, update, lane)` tuples and
//! drains them into each queue's shared pending ring after the current render
//! boundary. This module keeps that data shape available without implementing
//! the work loop that will eventually decide when to drain it.

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
    MissingRootForFiber { fiber: FiberId },
    InvalidHostRootStateNode { fiber: FiberId, raw: u64 },
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
        }
    }
}

impl Error for ConcurrentUpdateError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::FiberRootStore(error) => Some(error),
            Self::UpdateQueue(error) => Some(error),
            Self::MissingRootForFiber { .. } | Self::InvalidHostRootStateNode { .. } => None,
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
    let staged = store.concurrent_updates_mut().take_staged();
    let mut roots = Vec::new();

    for entry in &staged {
        if let (Some(queue), Some(update)) = (entry.queue, entry.update) {
            store
                .update_queues_mut()
                .append_pending_update(queue, update)?;
        }

        if entry.lane != Lane::NO {
            let root = mark_update_lane_from_fiber_to_root(store, entry.fiber, entry.lane)?;
            if !roots.contains(&root) {
                roots.push(root);
            }
        }
    }

    Ok(FinishedConcurrentUpdates {
        drained: staged,
        roots,
    })
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
    let mut node = source_fiber;
    let mut parent = store.fiber_arena().get(node)?.return_fiber();
    while let Some(parent_id) = parent {
        node = parent_id;
        parent = store.fiber_arena().get(node)?.return_fiber();
    }
    host_root_id_for_fiber(store, node)
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

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId) {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id)
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
        assert_eq!(store.concurrent_updates().staged(), &[]);
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
