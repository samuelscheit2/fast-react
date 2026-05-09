//! HostRoot current/work-in-progress helpers.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{FiberId, FiberTag, FiberTopologyError, PropsHandle};
use fast_react_host_config::HostTypes;

use crate::{FiberRootId, FiberRootStore, FiberRootStoreError};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WorkInProgressError {
    RootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    ExpectedHostRoot { fiber: FiberId, tag: FiberTag },
}

impl Display for WorkInProgressError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::RootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ExpectedHostRoot { fiber, tag } => write!(
                formatter,
                "fiber {} must be HostRoot to create HostRoot work-in-progress, found {:?}",
                fiber.slot().get(),
                tag
            ),
        }
    }
}

impl Error for WorkInProgressError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::RootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::ExpectedHostRoot { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for WorkInProgressError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::RootStore(error)
    }
}

impl From<FiberTopologyError> for WorkInProgressError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

pub fn create_host_root_work_in_progress<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    pending_props: PropsHandle,
) -> Result<FiberId, WorkInProgressError> {
    let current = store.root(root_id)?.current();
    let current_tag = store.fiber_arena().get(current)?.tag();
    if current_tag != FiberTag::HostRoot {
        return Err(WorkInProgressError::ExpectedHostRoot {
            fiber: current,
            tag: current_tag,
        });
    }

    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current, pending_props)?;
    let work_tag = store.fiber_arena().get(work_in_progress)?.tag();
    if work_tag != FiberTag::HostRoot {
        return Err(WorkInProgressError::ExpectedHostRoot {
            fiber: work_in_progress,
            tag: work_tag,
        });
    }

    Ok(work_in_progress)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{FiberRootStore, RootOptions};
    use fast_react_core::{FiberFlags, Lanes, UpdateQueueHandle};

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId) {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id)
    }

    #[test]
    fn work_in_progress_creates_distinct_host_root_alternate() {
        let (mut store, root_id) = root_store();
        let current = store.root(root_id).unwrap().current();

        let work_in_progress =
            create_host_root_work_in_progress(&mut store, root_id, PropsHandle::from_raw(10))
                .unwrap();

        assert_ne!(current, work_in_progress);
        assert_eq!(
            store.fiber_arena().get(current).unwrap().alternate(),
            Some(work_in_progress)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(work_in_progress)
                .unwrap()
                .alternate(),
            Some(current)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(work_in_progress)
                .unwrap()
                .pending_props(),
            PropsHandle::from_raw(10)
        );
    }

    #[test]
    fn work_in_progress_reuses_existing_host_root_alternate_and_keeps_current() {
        let (mut store, root_id) = root_store();
        let current = store.root(root_id).unwrap().current();
        let first =
            create_host_root_work_in_progress(&mut store, root_id, PropsHandle::from_raw(10))
                .unwrap();
        store
            .fiber_arena_mut()
            .get_mut(first)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT);

        let second =
            create_host_root_work_in_progress(&mut store, root_id, PropsHandle::from_raw(11))
                .unwrap();
        let second_node = store.fiber_arena().get(second).unwrap();

        assert_eq!(first, second);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(second_node.pending_props(), PropsHandle::from_raw(11));
        assert_eq!(second_node.flags(), FiberFlags::NO);
        assert_eq!(second_node.subtree_flags(), FiberFlags::NO);
        assert_eq!(second_node.deletions(), None);
    }

    #[test]
    fn work_in_progress_preserves_host_root_slots_and_valid_topology() {
        let (mut store, root_id) = root_store();
        let current = store.root(root_id).unwrap().current();
        let current_state = store.fiber_arena().get(current).unwrap().memoized_state();
        let current_state_node = store.fiber_arena().get(current).unwrap().state_node();

        let work_in_progress =
            create_host_root_work_in_progress(&mut store, root_id, PropsHandle::from_raw(12))
                .unwrap();
        let work_node = store.fiber_arena().get(work_in_progress).unwrap();

        assert_eq!(work_node.tag(), FiberTag::HostRoot);
        assert_eq!(work_node.memoized_state(), current_state);
        assert_eq!(work_node.state_node(), current_state_node);
        assert_eq!(work_node.update_queue(), UpdateQueueHandle::NONE);
        assert_eq!(work_node.lanes(), Lanes::NO);
        assert_eq!(work_node.child_lanes(), Lanes::NO);
        assert_eq!(
            store
                .fiber_arena()
                .validate_topology()
                .unwrap()
                .live_fibers(),
            2
        );
    }
}
