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

use crate::passive_effects::observe_sync_flush_post_passive_continuation_execution_gate_after_commit;
use crate::root_scheduler::{
    SyncFlushActPostPassiveContinuationGateRecord,
    SyncFlushPostPassiveContinuationExecutionGateRecord, recompute_might_have_pending_sync_work,
    sync_flush_act_continuation_lanes_for_root, sync_flush_act_post_passive_continuation_gate,
    sync_flush_lanes_for_root,
};
use crate::scheduler_bridge::SchedulerActContinuationRecord;
use crate::{
    ExecutionContextState, FiberRootId, FiberRootStore, FiberRootStoreError, HostRootCommitRecord,
    HostRootRenderPhaseRecord, RootCommitError, RootSchedulerError, RootSyncFlushRecord,
    RootUpdateCallbackSnapshot, RootWorkLoopError, commit_finished_host_root,
    render_host_root_for_lanes,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncFlushRootRecord {
    order: usize,
    root: FiberRootId,
    render_lanes: Lanes,
    render_phase: HostRootRenderPhaseRecord,
    commit: HostRootCommitRecord,
    act_continuation: Option<SchedulerActContinuationRecord>,
    act_post_passive_continuation_gate: Option<SyncFlushActPostPassiveContinuationGateRecord>,
}

impl SyncFlushRootRecord {
    #[must_use]
    pub const fn order(&self) -> usize {
        self.order
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn render_phase(&self) -> HostRootRenderPhaseRecord {
        self.render_phase
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub fn root_update_callbacks(&self) -> &RootUpdateCallbackSnapshot {
        self.commit.root_update_callbacks()
    }

    #[allow(
        dead_code,
        reason = "crate-private sync-flush post-passive execution gate reserved for future passive workers"
    )]
    pub(crate) fn post_passive_continuation_execution_gate<H: HostTypes>(
        &self,
        store: &mut FiberRootStore<H>,
        execution_context: &ExecutionContextState,
    ) -> Result<Option<SyncFlushPostPassiveContinuationExecutionGateRecord>, SyncFlushError> {
        observe_sync_flush_post_passive_continuation_execution_gate_after_commit(
            store,
            &self.commit,
            execution_context,
        )
        .map_err(SyncFlushError::from)
    }

    #[must_use]
    pub const fn applied_update_count(&self) -> usize {
        self.render_phase.applied_update_count()
    }

    #[must_use]
    pub const fn skipped_update_count(&self) -> usize {
        self.render_phase.skipped_update_count()
    }

    #[must_use]
    pub const fn remaining_lanes(&self) -> Lanes {
        self.commit.remaining_lanes()
    }

    #[must_use]
    pub const fn pending_lanes(&self) -> Lanes {
        self.commit.pending_lanes()
    }

    #[must_use]
    pub const fn has_remaining_work(&self) -> bool {
        self.commit.has_remaining_work()
    }

    pub fn commit_rendered_sync_flush_record<H: HostTypes>(
        store: &mut FiberRootStore<H>,
        record: RootSyncFlushRecord,
    ) -> Result<Self, SyncFlushError> {
        let committed = commit_render_phase(store, record.order(), record.render_phase())?;
        recompute_might_have_pending_sync_work(store)?;
        Ok(committed)
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

pub fn flush_sync_commit_work_on_all_roots<H: HostTypes>(
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
                records.push(commit_render_phase(store, records.len(), render_phase)?);
                did_perform_some_work = true;
            }

            root = next_root;
        }

        if !did_perform_some_work {
            return Ok(records);
        }
    }
}

fn commit_render_phase<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    order: usize,
    render_phase: HostRootRenderPhaseRecord,
) -> Result<SyncFlushRootRecord, SyncFlushError> {
    let commit = commit_finished_host_root(store, render_phase)?;
    let continuation_lanes =
        sync_flush_act_continuation_lanes_for_root(store, render_phase.root())?;
    let act_continuation = store
        .scheduler_bridge_mut()
        .record_sync_flush_act_continuation(
            render_phase.root(),
            order,
            render_phase.render_lanes(),
            commit.remaining_lanes(),
            continuation_lanes,
        );
    let act_post_passive_continuation_gate = sync_flush_act_post_passive_continuation_gate(
        act_continuation,
        commit.pending_passive_handoff(),
    );
    Ok(SyncFlushRootRecord {
        order,
        root: render_phase.root(),
        render_lanes: render_phase.render_lanes(),
        render_phase,
        commit,
        act_continuation,
        act_post_passive_continuation_gate,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::scheduler_bridge::SchedulerActContinuationStatus;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{
        ExecutionContextState, RootElementHandle, RootOptions, RootSyncFlushExitStatus,
        RootSyncFlushRecordStatus, ensure_root_is_scheduled, flush_sync_work_on_all_roots,
        scheduled_roots, update_container, update_container_sync,
    };
    use crate::{RootUpdateCallbackHandle, RootUpdateCallbackRecord, RootUpdateCallbackVisibility};
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

    fn callback_handles(records: &[RootUpdateCallbackRecord]) -> Vec<RootUpdateCallbackHandle> {
        records.iter().map(|record| record.callback()).collect()
    }

    #[test]
    fn sync_flush_no_op_fast_path_returns_empty_result() {
        let (mut store, _root_id, host) = root_store();

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

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

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

        assert!(result.did_flush_work());
        assert_eq!(result.records().len(), 1);
        let record = &result.records()[0];
        assert_eq!(record.order(), 0);
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
    fn sync_flush_handoff_commits_completed_render_record_as_inert_commit_record() {
        let (mut store, root_id, host) = root_store();
        let element = RootElementHandle::from_raw(66);
        let callback = RootUpdateCallbackHandle::from_raw(660);
        let previous_current = store.root(root_id).unwrap().current();
        let update = update_container_sync(&mut store, root_id, element, Some(callback)).unwrap();
        ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        assert_eq!(rendered.records().len(), 1);
        assert_eq!(
            rendered.records()[0].status(),
            RootSyncFlushRecordStatus::RenderedAwaitingCommit
        );
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert!(store.root_scheduler().might_have_pending_sync_work());

        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();

        assert_eq!(committed.order(), 0);
        assert_eq!(committed.root(), root_id);
        assert_eq!(committed.render_lanes(), Lanes::SYNC);
        assert_eq!(committed.applied_update_count(), 1);
        assert_eq!(committed.skipped_update_count(), 0);
        assert_eq!(committed.remaining_lanes(), Lanes::NO);
        assert_eq!(committed.pending_lanes(), Lanes::NO);
        assert_eq!(committed.commit().previous_current(), previous_current);
        assert_eq!(committed.commit().finished_lanes(), Lanes::SYNC);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            committed.commit().current()
        );
        assert_eq!(current_host_root_element(&store, root_id), element);

        let callbacks = committed.root_update_callbacks();
        assert_eq!(
            callbacks.queue(),
            committed.render_phase().work_in_progress_update_queue()
        );
        assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
        assert_eq!(callbacks.visible()[0].update(), update.update());
        assert!(callbacks.hidden().is_empty());
        assert!(callbacks.deferred_hidden().is_empty());
        assert!(!store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_handoff_records_no_act_continuation_when_act_queue_inactive() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(68));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();

        assert_eq!(committed.remaining_lanes(), Lanes::NO);
        assert_eq!(committed.act_continuation, None);
        assert_eq!(committed.act_post_passive_continuation_gate, None);
        assert!(
            store
                .scheduler_bridge()
                .act_continuation_records()
                .is_empty()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_handoff_records_nested_act_continuation_after_commit() {
        let (mut store, root_id, host) = root_store();
        let sync_element = RootElementHandle::from_raw(69);
        let default_element = RootElementHandle::from_raw(70);
        let enter_outer = store.scheduler_bridge_mut().enter_act_scope();
        let enter_nested = store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, root_id, sync_element);
        let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
        ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();

        let continuation = committed.act_continuation.unwrap();
        assert_eq!(continuation.root(), root_id);
        assert_eq!(continuation.sync_flush_order(), committed.order());
        assert_eq!(continuation.flushed_lanes(), Lanes::SYNC);
        assert_eq!(continuation.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(continuation.continuation_lanes(), Lanes::DEFAULT);
        assert_eq!(continuation.act_scope_depth(), 2);
        assert!(continuation.nested_act_scope());
        assert_eq!(
            continuation.status(),
            SchedulerActContinuationStatus::PendingContinuation
        );
        assert_eq!(
            store.scheduler_bridge().act_continuation_records(),
            &[continuation]
        );
        assert_eq!(
            store.scheduler_bridge().act_scope_boundary_records(),
            &[enter_outer, enter_nested]
        );
        assert_eq!(current_host_root_element(&store, root_id), sync_element);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert!(store.scheduler_bridge().microtask_requests().is_empty());
    }

    #[test]
    fn sync_flush_handoff_records_post_passive_act_gate_without_flushing_effects() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(700));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let render_phase = rendered.records()[0].render_phase();
        let finished_work = render_phase.finished_work();
        store.scheduler_bridge_mut().enter_act_scope();
        let mount_order = {
            let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(root_id, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::SYNC)
                .unwrap()
        };

        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();

        let continuation = committed.act_continuation.unwrap();
        assert_eq!(
            continuation.status(),
            SchedulerActContinuationStatus::NoContinuation
        );
        let gate = committed.act_post_passive_continuation_gate.unwrap();
        assert_eq!(gate.root(), root_id);
        assert_eq!(gate.sync_flush_order(), committed.order());
        assert_eq!(gate.flushed_lanes(), Lanes::SYNC);
        assert_eq!(gate.remaining_lanes(), Lanes::NO);
        assert_eq!(gate.continuation_lanes(), Lanes::NO);
        assert_eq!(gate.pending_passive_finished_work(), finished_work);
        assert_eq!(gate.pending_passive_lanes(), Lanes::SYNC);
        assert_eq!(gate.pending_passive_unmount_count(), 0);
        assert_eq!(gate.pending_passive_mount_count(), 1);
        assert_eq!(gate.pending_passive_record_count(), 1);
        assert_eq!(gate.act_scope_depth(), 1);
        assert!(!gate.nested_act_scope());

        let handoff = committed.commit().pending_passive_handoff().unwrap();
        assert_eq!(handoff.pending_mount_count(), 1);
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();
        assert_eq!(pending_passive.finished_work(), Some(finished_work));
        assert!(pending_passive.has_commit_handoff());
        assert_eq!(pending_passive.passive_mounts().len(), 1);
        assert_eq!(pending_passive.passive_mounts()[0].order(), mount_order);
        assert_eq!(
            store.scheduler_bridge().act_continuation_records(),
            &[continuation]
        );
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_handoff_observes_post_passive_reentry_gate_without_running_effects() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let passive_root = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let continuation_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let continuation_current = store.root(continuation_root).unwrap().current();
        schedule_sync_update(&mut store, passive_root, RootElementHandle::from_raw(701));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let render_phase = rendered.records()[0].render_phase();
        let finished_work = render_phase.finished_work();
        {
            let scheduling = store.root_mut(passive_root).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(passive_root, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::SYNC)
                .unwrap();
        }
        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();
        schedule_sync_update(
            &mut store,
            continuation_root,
            RootElementHandle::from_raw(702),
        );
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let gate = committed
            .post_passive_continuation_execution_gate(&mut store, &ExecutionContextState::new())
            .unwrap()
            .unwrap();

        assert_eq!(gate.exit_status(), RootSyncFlushExitStatus::Completed);
        assert_eq!(gate.pending_passive_root(), passive_root);
        assert_eq!(gate.pending_passive_finished_work(), finished_work);
        assert_eq!(gate.pending_passive_lanes(), Lanes::SYNC);
        assert_eq!(gate.pending_passive_mount_count(), 1);
        assert_eq!(gate.continuation_roots().len(), 1);
        assert_eq!(gate.continuation_roots()[0].root(), continuation_root);
        assert_eq!(gate.continuation_roots()[0].lanes(), Lanes::SYNC);
        assert_eq!(committed.act_continuation, None);
        assert_eq!(committed.act_post_passive_continuation_gate, None);
        assert_eq!(
            store.root(continuation_root).unwrap().current(),
            continuation_current
        );
        assert_eq!(store.root(continuation_root).unwrap().finished_work(), None);
        assert!(
            store
                .root(passive_root)
                .unwrap()
                .scheduling()
                .pending_passive()
                .has_commit_handoff()
        );
        assert_eq!(
            store.scheduler_bridge().callback_requests().len(),
            callback_request_count
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_handoff_records_active_act_boundary_without_pending_continuation() {
        let (mut store, root_id, host) = root_store();
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(71));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();

        let continuation = committed.act_continuation.unwrap();
        assert_eq!(continuation.root(), root_id);
        assert_eq!(continuation.flushed_lanes(), Lanes::SYNC);
        assert_eq!(continuation.remaining_lanes(), Lanes::NO);
        assert_eq!(continuation.continuation_lanes(), Lanes::NO);
        assert_eq!(continuation.act_scope_depth(), 1);
        assert!(!continuation.nested_act_scope());
        assert_eq!(
            continuation.status(),
            SchedulerActContinuationStatus::NoContinuation
        );
        assert_eq!(
            store.scheduler_bridge().act_continuation_records(),
            &[continuation]
        );
        assert_eq!(committed.act_post_passive_continuation_gate, None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_handoff_surfaces_pending_passive_commit_metadata_without_effects() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(67));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(root_id, Lanes::NO);

        let committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();
        let handoff = committed.commit().pending_passive_handoff().unwrap();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.finished_work(), committed.commit().finished_work());
        assert_eq!(handoff.lanes(), Lanes::SYNC);
        assert_eq!(
            pending_passive.finished_work(),
            Some(committed.commit().finished_work())
        );
        assert_eq!(pending_passive.lanes(), Lanes::SYNC);
        assert!(pending_passive.has_commit_handoff());
        assert!(!pending_passive.has_effects());
        assert!(pending_passive.passive_unmounts().is_empty());
        assert!(pending_passive.passive_mounts().is_empty());
        assert_eq!(committed.act_post_passive_continuation_gate, None);
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

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
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

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

        assert_eq!(result.records().len(), 1);
        let record = &result.records()[0];
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

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

        assert_eq!(result.records().len(), 1);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_surfaces_visible_root_update_callback_snapshot() {
        let (mut store, root_id, host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(177);
        let update = update_container_sync(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1770),
            Some(callback),
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

        assert_eq!(result.records().len(), 1);
        let record = &result.records()[0];
        let callbacks = record.root_update_callbacks();
        assert_eq!(
            callbacks.queue(),
            record.render_phase().work_in_progress_update_queue()
        );
        assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
        assert_eq!(callbacks.visible()[0].update(), update.update());
        assert_eq!(callbacks.visible()[0].sequence(), 0);
        assert_eq!(
            callbacks.visible()[0].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert!(callbacks.hidden().is_empty());
        assert!(callbacks.deferred_hidden().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_surfaces_deferred_hidden_root_update_callback_snapshot() {
        let (mut store, root_id, host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(188);
        let update = update_container_sync(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1880),
            Some(callback),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(update.update())
            .unwrap();
        ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

        assert_eq!(result.records().len(), 1);
        let record = &result.records()[0];
        let callbacks = record.root_update_callbacks();
        assert_eq!(
            callbacks.queue(),
            record.render_phase().work_in_progress_update_queue()
        );
        assert!(callbacks.visible().is_empty());
        assert!(callbacks.hidden().is_empty());
        assert_eq!(
            callback_handles(callbacks.deferred_hidden()),
            vec![callback]
        );
        assert_eq!(callbacks.deferred_hidden()[0].update(), update.update());
        assert_eq!(callbacks.deferred_hidden()[0].sequence(), 0);
        assert_eq!(
            callbacks.deferred_hidden()[0].visibility(),
            RootUpdateCallbackVisibility::DeferredHidden
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }
}
