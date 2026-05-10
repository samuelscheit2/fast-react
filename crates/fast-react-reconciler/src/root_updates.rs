//! Internal HostRoot update entry points.
//!
//! `update_container` and `update_container_sync` create HostRoot
//! `{element}` updates. They enqueue data, mark lanes, and return scheduler /
//! entanglement records for later slices; they do not render, flush, commit, or
//! mutate a host container.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{FiberId, FiberTopologyError, Lane, Lanes, UpdateQueueHandle};
use fast_react_host_config::HostTypes;

use crate::{
    ConcurrentUpdateError, FiberRootId, FiberRootStore, FiberRootStoreError, RootElementHandle,
    RootUpdateCallbackHandle, RootUpdatePayload, UpdateId, UpdatePriorityState, UpdateQueueError,
    enqueue_concurrent_host_root_update, finish_queueing_concurrent_updates, request_update_lane,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootScheduleUpdateRecord {
    root: FiberRootId,
    fiber: FiberId,
    lane: Lane,
}

impl RootScheduleUpdateRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn lane(self) -> Lane {
        self.lane
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootTransitionEntanglementRecord {
    root: FiberRootId,
    queue: UpdateQueueHandle,
    lane: Lane,
    entangled_lanes: Lanes,
}

impl RootTransitionEntanglementRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn queue(self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub const fn lane(self) -> Lane {
        self.lane
    }

    #[must_use]
    pub const fn entangled_lanes(self) -> Lanes {
        self.entangled_lanes
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UpdateContainerResult {
    lane: Lane,
    update: UpdateId,
    queue: UpdateQueueHandle,
    schedule: RootScheduleUpdateRecord,
    entanglement: Option<RootTransitionEntanglementRecord>,
}

impl UpdateContainerResult {
    #[must_use]
    pub const fn lane(&self) -> Lane {
        self.lane
    }

    #[must_use]
    pub const fn update(&self) -> UpdateId {
        self.update
    }

    #[must_use]
    pub const fn queue(&self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub const fn schedule(&self) -> RootScheduleUpdateRecord {
        self.schedule
    }

    #[must_use]
    pub const fn entanglement(&self) -> Option<RootTransitionEntanglementRecord> {
        self.entanglement
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RootUpdateError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    UpdateQueue(UpdateQueueError),
    ConcurrentUpdate(ConcurrentUpdateError),
    EnqueuedWrongRoot {
        expected: FiberRootId,
        actual: FiberRootId,
    },
}

impl Display for RootUpdateError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UpdateQueue(error) => Display::fmt(error, formatter),
            Self::ConcurrentUpdate(error) => Display::fmt(error, formatter),
            Self::EnqueuedWrongRoot { expected, actual } => write!(
                formatter,
                "enqueued HostRoot update for root {}, expected root {}",
                actual.raw(),
                expected.raw()
            ),
        }
    }
}

impl Error for RootUpdateError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::UpdateQueue(error) => Some(error),
            Self::ConcurrentUpdate(error) => Some(error),
            Self::EnqueuedWrongRoot { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for RootUpdateError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for RootUpdateError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<UpdateQueueError> for RootUpdateError {
    fn from(error: UpdateQueueError) -> Self {
        Self::UpdateQueue(error)
    }
}

impl From<ConcurrentUpdateError> for RootUpdateError {
    fn from(error: ConcurrentUpdateError) -> Self {
        Self::ConcurrentUpdate(error)
    }
}

pub fn update_container<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    element: RootElementHandle,
    callback: Option<RootUpdateCallbackHandle>,
) -> Result<UpdateContainerResult, RootUpdateError> {
    let current = store.root(root_id)?.current();
    let lane = {
        let current_fiber = store.fiber_arena().get(current)?;
        request_update_lane(current_fiber, UpdatePriorityState::new())
    };
    update_container_impl(store, root_id, current, lane, element, callback)
}

pub fn update_container_sync<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    element: RootElementHandle,
    callback: Option<RootUpdateCallbackHandle>,
) -> Result<UpdateContainerResult, RootUpdateError> {
    let current = store.root(root_id)?.current();
    update_container_impl(store, root_id, current, Lane::SYNC, element, callback)
}

fn update_container_impl<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    root_fiber: FiberId,
    lane: Lane,
    element: RootElementHandle,
    callback: Option<RootUpdateCallbackHandle>,
) -> Result<UpdateContainerResult, RootUpdateError> {
    let queue = store.ensure_host_root_update_queue(root_id)?;
    let update = store.update_queues_mut().create_update(lane);
    {
        let update_record = store.update_queues_mut().update_mut(update)?;
        update_record.set_payload(RootUpdatePayload::new(element));
        if let Some(callback) = callback
            && callback.is_some()
        {
            update_record.set_callback(callback);
        }
    }

    let enqueued_root =
        enqueue_concurrent_host_root_update(store, root_fiber, queue, update, lane)?;
    if enqueued_root != root_id {
        return Err(RootUpdateError::EnqueuedWrongRoot {
            expected: root_id,
            actual: enqueued_root,
        });
    }

    // There is no root work loop in this slice, so drain the explicit
    // concurrent staging hook immediately into the HostRoot pending ring. The
    // staging API remains available for future render-boundary control.
    finish_queueing_concurrent_updates(store)?;

    let schedule = RootScheduleUpdateRecord {
        root: root_id,
        fiber: root_fiber,
        lane,
    };

    let root_pending_lanes = store.root(root_id)?.lanes().pending_lanes();
    let entanglement = store
        .update_queues_mut()
        .entangle_transition_update(queue, root_pending_lanes, lane)?
        .map(|entangled_lanes| {
            store
                .root_mut(root_id)?
                .lanes_mut()
                .mark_entangled(entangled_lanes);
            Ok::<_, RootUpdateError>(RootTransitionEntanglementRecord {
                root: root_id,
                queue,
                lane,
                entangled_lanes,
            })
        })
        .transpose()?;

    Ok(UpdateContainerResult {
        lane,
        update,
        queue,
        schedule,
        entanglement,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::RootOptions;
    use crate::test_support::{FakeContainer, RecordingHost};

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id, host)
    }

    #[test]
    fn root_updates_update_container_enqueues_element_payload_on_default_lane() {
        let (mut store, root_id, _host) = root_store();
        let element = RootElementHandle::from_raw(42);

        let result = update_container(&mut store, root_id, element, None).unwrap();

        assert_eq!(result.lane(), Lane::DEFAULT);
        assert_eq!(result.schedule().root(), root_id);
        assert_eq!(
            store
                .update_queues()
                .pending_updates(result.queue())
                .unwrap(),
            vec![result.update()]
        );
        assert_eq!(
            store
                .update_queues()
                .update(result.update())
                .unwrap()
                .payload()
                .unwrap()
                .element(),
            element
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
    fn root_updates_update_container_sync_enqueues_null_element_on_sync_lane_without_flushing() {
        let (mut store, root_id, host) = root_store();

        let result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();

        assert_eq!(result.lane(), Lane::SYNC);
        assert_eq!(
            store
                .update_queues()
                .update(result.update())
                .unwrap()
                .payload()
                .unwrap()
                .element(),
            RootElementHandle::NONE
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::SYNC)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_updates_store_callback_handle_without_invoking_it() {
        let (mut store, root_id, _host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(9);

        let result = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1),
            Some(callback),
        )
        .unwrap();

        assert_eq!(
            store
                .update_queues()
                .update(result.update())
                .unwrap()
                .callback(),
            callback
        );
        assert!(
            store
                .update_queues()
                .queue(result.queue())
                .unwrap()
                .callbacks()
                .is_empty()
        );
    }

    #[test]
    fn root_updates_entangle_transition_update_but_do_not_schedule_work() {
        let (mut store, root_id, _host) = root_store();
        let current = store.root(root_id).unwrap().current();

        let result = update_container_impl(
            &mut store,
            root_id,
            current,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(1),
            None,
        )
        .unwrap();

        assert_eq!(
            result.entanglement().unwrap().entangled_lanes(),
            Lanes::from(Lane::TRANSITION_1)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .entangled_lanes()
                .contains_lane(Lane::TRANSITION_1)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .callback_node()
                .is_none()
        );
    }
}
