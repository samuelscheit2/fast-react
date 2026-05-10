//! Internal HostRoot-only sync flush integration.
//!
//! This module stitches the accepted HostRoot render-phase and current-switch
//! commit foundations into a narrow sync flush path. It traverses the internal
//! scheduled-root list, renders only sync lanes, and commits the completed
//! HostRoot work. It deliberately does not call host operations, run effects,
//! invoke callbacks, or wire public DOM/test-renderer facade behavior.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::Lanes;
use fast_react_host_config::HostTypes;

use crate::root_scheduler::{recompute_might_have_pending_sync_work, sync_flush_lanes_for_root};
use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostRootCommitRecord,
    HostRootRenderPhaseRecord, RootCommitError, RootSchedulerError, RootWorkLoopError,
    commit_finished_host_root, render_host_root_for_lanes,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SyncFlushRootRecord {
    root: FiberRootId,
    render_lanes: Lanes,
    render_phase: HostRootRenderPhaseRecord,
    commit: HostRootCommitRecord,
}

impl SyncFlushRootRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn render_phase(self) -> HostRootRenderPhaseRecord {
        self.render_phase
    }

    #[must_use]
    pub const fn commit(self) -> HostRootCommitRecord {
        self.commit
    }

    #[must_use]
    pub const fn applied_update_count(self) -> usize {
        self.render_phase.applied_update_count()
    }

    #[must_use]
    pub const fn skipped_update_count(self) -> usize {
        self.render_phase.skipped_update_count()
    }

    #[must_use]
    pub const fn remaining_lanes(self) -> Lanes {
        self.commit.remaining_lanes()
    }

    #[must_use]
    pub const fn pending_lanes(self) -> Lanes {
        self.commit.pending_lanes()
    }

    #[must_use]
    pub const fn has_remaining_work(self) -> bool {
        self.commit.has_remaining_work()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncFlushResult {
    skipped_reentrant_flush: bool,
    skipped_no_sync_work: bool,
    records: Vec<SyncFlushRootRecord>,
}

impl SyncFlushResult {
    #[must_use]
    pub fn records(&self) -> &[SyncFlushRootRecord] {
        &self.records
    }

    #[must_use]
    pub const fn skipped_reentrant_flush(&self) -> bool {
        self.skipped_reentrant_flush
    }

    #[must_use]
    pub const fn skipped_no_sync_work(&self) -> bool {
        self.skipped_no_sync_work
    }

    #[must_use]
    pub fn did_flush_work(&self) -> bool {
        !self.records.is_empty()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SyncFlushError {
    FiberRootStore(FiberRootStoreError),
    RootScheduler(RootSchedulerError),
    RootWorkLoop(RootWorkLoopError),
    RootCommit(RootCommitError),
}

impl Display for SyncFlushError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::RootScheduler(error) => Display::fmt(error, formatter),
            Self::RootWorkLoop(error) => Display::fmt(error, formatter),
            Self::RootCommit(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for SyncFlushError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::RootScheduler(error) => Some(error),
            Self::RootWorkLoop(error) => Some(error),
            Self::RootCommit(error) => Some(error),
        }
    }
}

impl From<FiberRootStoreError> for SyncFlushError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<RootSchedulerError> for SyncFlushError {
    fn from(error: RootSchedulerError) -> Self {
        Self::RootScheduler(error)
    }
}

impl From<RootWorkLoopError> for SyncFlushError {
    fn from(error: RootWorkLoopError) -> Self {
        Self::RootWorkLoop(error)
    }
}

impl From<RootCommitError> for SyncFlushError {
    fn from(error: RootCommitError) -> Self {
        Self::RootCommit(error)
    }
}

pub fn flush_sync_work_on_all_roots<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> Result<SyncFlushResult, SyncFlushError> {
    if store.root_scheduler().is_flushing_work() {
        return Ok(SyncFlushResult {
            skipped_reentrant_flush: true,
            skipped_no_sync_work: false,
            records: Vec::new(),
        });
    }

    if !store.root_scheduler().might_have_pending_sync_work() {
        return Ok(SyncFlushResult {
            skipped_reentrant_flush: false,
            skipped_no_sync_work: true,
            records: Vec::new(),
        });
    }

    store.root_scheduler_mut().set_is_flushing_work(true);
    let records = flush_sync_work_across_scheduled_roots(store);
    store.root_scheduler_mut().set_is_flushing_work(false);
    let records = records?;

    recompute_might_have_pending_sync_work(store)?;

    Ok(SyncFlushResult {
        skipped_reentrant_flush: false,
        skipped_no_sync_work: false,
        records,
    })
}

fn flush_sync_work_across_scheduled_roots<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> Result<Vec<SyncFlushRootRecord>, SyncFlushError> {
    let mut records = Vec::new();

    loop {
        let mut did_perform_some_work = false;
        let mut root = store.root_scheduler().first_scheduled_root();

        while let Some(root_id) = root {
            let next_root = store.root(root_id)?.scheduling().next_scheduled_root();
            let render_lanes = sync_flush_lanes_for_root(store, root_id)?;

            if render_lanes.is_non_empty() {
                let render_phase = render_host_root_for_lanes(store, root_id, render_lanes)?;
                let commit = commit_finished_host_root(store, render_phase)?;
                records.push(SyncFlushRootRecord {
                    root: root_id,
                    render_lanes,
                    render_phase,
                    commit,
                });
                did_perform_some_work = true;
            }

            root = next_root;
        }

        if !did_perform_some_work {
            return Ok(records);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{
        RootElementHandle, RootOptions, ensure_root_is_scheduled, scheduled_roots,
        update_container, update_container_sync,
    };
    use fast_react_core::{Lane, Lanes};

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id, host)
    }

    fn current_host_root_element(
        store: &FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> RootElementHandle {
        let current = store.root(root_id).unwrap().current();
        host_root_element(store, current)
    }

    fn host_root_element(
        store: &FiberRootStore<RecordingHost>,
        fiber: fast_react_core::FiberId,
    ) -> RootElementHandle {
        let state = store.fiber_arena().get(fiber).unwrap().memoized_state();
        store.host_root_states().get(state).unwrap().element()
    }

    fn schedule_sync_update(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        element: RootElementHandle,
    ) {
        let result = update_container_sync(store, root_id, element, None).unwrap();
        ensure_root_is_scheduled(store, result.schedule()).unwrap();
    }

    #[test]
    fn sync_flush_no_op_fast_path_returns_empty_result() {
        let (mut store, _root_id, host) = root_store();

        let result = flush_sync_work_on_all_roots(&mut store).unwrap();

        assert!(result.skipped_no_sync_work());
        assert!(!result.skipped_reentrant_flush());
        assert!(!result.did_flush_work());
        assert!(result.records().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_commits_one_root_sync_work() {
        let (mut store, root_id, host) = root_store();
        let element = RootElementHandle::from_raw(42);
        let previous_current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, element);

        let result = flush_sync_work_on_all_roots(&mut store).unwrap();

        assert!(result.did_flush_work());
        assert_eq!(result.records().len(), 1);
        let record = result.records()[0];
        assert_eq!(record.root(), root_id);
        assert_eq!(record.render_lanes(), Lanes::SYNC);
        assert_eq!(record.applied_update_count(), 1);
        assert_eq!(record.skipped_update_count(), 0);
        assert_eq!(record.remaining_lanes(), Lanes::NO);
        assert_eq!(record.pending_lanes(), Lanes::NO);
        assert!(!record.has_remaining_work());
        assert_eq!(record.commit().previous_current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            record.commit().current()
        );
        assert_eq!(current_host_root_element(&store, root_id), element);
        assert!(!store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_commits_multiple_roots_in_scheduled_order() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let first = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let third = store
            .create_client_root(FakeContainer::new(3), RootOptions::new())
            .unwrap();

        schedule_sync_update(&mut store, second, RootElementHandle::from_raw(20));
        schedule_sync_update(&mut store, first, RootElementHandle::from_raw(10));
        schedule_sync_update(&mut store, third, RootElementHandle::from_raw(30));

        let result = flush_sync_work_on_all_roots(&mut store).unwrap();
        let committed_roots = result
            .records()
            .iter()
            .map(|record| record.root())
            .collect::<Vec<_>>();

        assert_eq!(committed_roots, vec![second, first, third]);
        assert_eq!(scheduled_roots(&store).unwrap(), vec![second, first, third]);
        assert_eq!(
            current_host_root_element(&store, first),
            RootElementHandle::from_raw(10)
        );
        assert_eq!(
            current_host_root_element(&store, second),
            RootElementHandle::from_raw(20)
        );
        assert_eq!(
            current_host_root_element(&store, third),
            RootElementHandle::from_raw(30)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_retains_skipped_non_sync_lanes_in_result_and_root() {
        let (mut store, root_id, _host) = root_store();
        let sync_element = RootElementHandle::from_raw(1);
        let default_element = RootElementHandle::from_raw(2);
        schedule_sync_update(&mut store, root_id, sync_element);
        let default_result = update_container(&mut store, root_id, default_element, None).unwrap();
        ensure_root_is_scheduled(&mut store, default_result.schedule()).unwrap();

        let result = flush_sync_work_on_all_roots(&mut store).unwrap();

        assert_eq!(result.records().len(), 1);
        let record = result.records()[0];
        assert_eq!(record.render_lanes(), Lanes::SYNC);
        assert_eq!(record.applied_update_count(), 1);
        assert_eq!(record.skipped_update_count(), 1);
        assert_eq!(record.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(record.pending_lanes(), Lanes::DEFAULT);
        assert!(record.has_remaining_work());
        assert_eq!(current_host_root_element(&store, root_id), sync_element);
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );
        assert!(
            !store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::SYNC)
        );

        let current = store.root(root_id).unwrap().current();
        let current_queue = store.fiber_arena().get(current).unwrap().update_queue();
        let rebased = store.update_queues().base_updates(current_queue).unwrap();
        assert_eq!(rebased.len(), 1);
        assert_eq!(
            store.update_queues().update(rebased[0]).unwrap().lane(),
            Lanes::DEFAULT
        );
    }

    #[test]
    fn sync_flush_does_not_call_host_operations() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(99));

        let result = flush_sync_work_on_all_roots(&mut store).unwrap();

        assert_eq!(result.records().len(), 1);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }
}
