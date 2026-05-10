//! Internal HostRoot-only sync flush integration.
//!
//! This module stitches the accepted HostRoot render-phase and current-switch
//! commit foundations into a narrow sync flush path. It traverses the internal
//! scheduled-root list, renders only sync lanes, and commits the completed
//! HostRoot work. It deliberately does not call host operations, run effects,
//! invoke callbacks, or wire public DOM/test-renderer facade behavior.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{FiberId, Lanes, UpdateQueueHandle};
use fast_react_host_config::HostTypes;

use crate::root_commit::PendingPassiveCommitHandoff;
use crate::root_scheduler::{
    SyncFlushActContinuationDrainRecord, SyncFlushActPostPassiveContinuationGateRecord,
    SyncFlushPostPassiveContinuationExecutionGateRecord, recompute_might_have_pending_sync_work,
    sync_flush_act_continuation_drain_record_after_host_output_canary,
    sync_flush_act_continuation_lanes_for_root, sync_flush_act_post_passive_continuation_gate,
    sync_flush_lanes_for_root, sync_flush_post_passive_continuation_execution_gate,
};
use crate::scheduler_bridge::SchedulerActContinuationRecord;
use crate::{
    ExecutionContextState, FiberRootId, FiberRootStore, FiberRootStoreError, HostRootCommitRecord,
    HostRootRenderPhaseRecord, RootCallbackPriority, RootCommitError, RootSchedulerCallbackHandle,
    RootSchedulerError, RootSyncFlushRecord, RootUpdateCallbackSnapshot, RootWorkLoopError,
    commit_finished_host_root, render_host_root_for_lanes,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[doc(hidden)]
pub struct SyncFlushRootHostOutputCommitDiagnosticsForCanary {
    root: FiberRootId,
    order: usize,
    callback_queue: UpdateQueueHandle,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    remaining_lanes: Lanes,
    commit_pending_lanes: Lanes,
    root_pending_lanes_after_commit: Lanes,
    root_current_after_commit: FiberId,
    committed_current: FiberId,
    render_phase_work_after_commit: Option<FiberId>,
    render_phase_lanes_after_commit: Lanes,
    callback_node_after_commit: RootSchedulerCallbackHandle,
    callback_priority_after_commit: RootCallbackPriority,
    might_have_pending_sync_work: bool,
    accepted_visible_callback_count: usize,
    accepted_hidden_callback_count: usize,
    accepted_deferred_hidden_callback_count: usize,
    post_commit_visible_callback_count: usize,
    post_commit_hidden_callback_count: usize,
    post_commit_deferred_hidden_callback_count: usize,
    mutation_record_count: usize,
    mutation_apply_record_count: usize,
    host_root_placement_apply_count: usize,
}

impl SyncFlushRootHostOutputCommitDiagnosticsForCanary {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn order(self) -> usize {
        self.order
    }

    #[must_use]
    pub const fn callback_queue(self) -> UpdateQueueHandle {
        self.callback_queue
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
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
    pub const fn commit_pending_lanes(self) -> Lanes {
        self.commit_pending_lanes
    }

    #[must_use]
    pub const fn root_pending_lanes_after_commit(self) -> Lanes {
        self.root_pending_lanes_after_commit
    }

    #[must_use]
    pub const fn root_current_after_commit(self) -> FiberId {
        self.root_current_after_commit
    }

    #[must_use]
    pub const fn committed_current(self) -> FiberId {
        self.committed_current
    }

    #[must_use]
    pub const fn render_phase_work_after_commit(self) -> Option<FiberId> {
        self.render_phase_work_after_commit
    }

    #[must_use]
    pub const fn render_phase_lanes_after_commit(self) -> Lanes {
        self.render_phase_lanes_after_commit
    }

    #[must_use]
    pub const fn callback_node_after_commit(self) -> RootSchedulerCallbackHandle {
        self.callback_node_after_commit
    }

    #[must_use]
    pub const fn callback_priority_after_commit(self) -> RootCallbackPriority {
        self.callback_priority_after_commit
    }

    #[must_use]
    pub const fn might_have_pending_sync_work(self) -> bool {
        self.might_have_pending_sync_work
    }

    #[must_use]
    pub const fn accepted_visible_callback_count(self) -> usize {
        self.accepted_visible_callback_count
    }

    #[must_use]
    pub const fn accepted_hidden_callback_count(self) -> usize {
        self.accepted_hidden_callback_count
    }

    #[must_use]
    pub const fn accepted_deferred_hidden_callback_count(self) -> usize {
        self.accepted_deferred_hidden_callback_count
    }

    #[must_use]
    pub const fn accepted_callback_count(self) -> usize {
        self.accepted_visible_callback_count
            + self.accepted_hidden_callback_count
            + self.accepted_deferred_hidden_callback_count
    }

    #[must_use]
    pub const fn post_commit_visible_callback_count(self) -> usize {
        self.post_commit_visible_callback_count
    }

    #[must_use]
    pub const fn post_commit_hidden_callback_count(self) -> usize {
        self.post_commit_hidden_callback_count
    }

    #[must_use]
    pub const fn post_commit_deferred_hidden_callback_count(self) -> usize {
        self.post_commit_deferred_hidden_callback_count
    }

    #[must_use]
    pub const fn mutation_record_count(self) -> usize {
        self.mutation_record_count
    }

    #[must_use]
    pub const fn mutation_apply_record_count(self) -> usize {
        self.mutation_apply_record_count
    }

    #[must_use]
    pub const fn host_root_placement_apply_count(self) -> usize {
        self.host_root_placement_apply_count
    }

    #[must_use]
    pub fn committed_current_matches_root(self) -> bool {
        self.root_current_after_commit == self.committed_current
    }

    #[must_use]
    pub fn pending_lanes_match_root(self) -> bool {
        self.root_pending_lanes_after_commit == self.commit_pending_lanes
    }

    #[must_use]
    pub const fn render_phase_state_consumed(self) -> bool {
        self.render_phase_work_after_commit.is_none()
            && self.render_phase_lanes_after_commit.is_empty()
    }

    #[must_use]
    pub fn callback_state_cleared(self) -> bool {
        self.callback_node_after_commit.is_none()
            && self.callback_priority_after_commit == RootCallbackPriority::NO
    }

    #[must_use]
    pub const fn rendered_lanes_consumed_from_root(self) -> bool {
        self.finished_lanes.contains_all(self.render_lanes)
            && !self
                .root_pending_lanes_after_commit
                .contains_any(self.render_lanes)
    }

    #[must_use]
    pub const fn visible_callback_state_drained(self) -> bool {
        self.post_commit_visible_callback_count == 0 && self.post_commit_hidden_callback_count == 0
    }

    #[must_use]
    pub const fn recorded_host_output_mutation_metadata(self) -> bool {
        self.mutation_record_count > 0 && self.mutation_apply_record_count > 0
    }

    #[must_use]
    pub fn commit_handoff_state_consumed(self) -> bool {
        self.committed_current_matches_root()
            && self.pending_lanes_match_root()
            && self.render_phase_state_consumed()
            && self.callback_state_cleared()
            && self.rendered_lanes_consumed_from_root()
            && self.visible_callback_state_drained()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushActPrivateExecutionDiagnosticsForCanary {
    root: FiberRootId,
    order: usize,
    host_output_canary_committed: bool,
    blocked_by_pending_post_passive_gate: bool,
    drained_act_continuations: Vec<SyncFlushActContinuationDrainRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush/act canary execution diagnostic reserved for private act workers"
)]
impl SyncFlushActPrivateExecutionDiagnosticsForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn order(&self) -> usize {
        self.order
    }

    #[must_use]
    pub(crate) const fn host_output_canary_committed(&self) -> bool {
        self.host_output_canary_committed
    }

    #[must_use]
    pub(crate) const fn blocked_by_pending_post_passive_gate(&self) -> bool {
        self.blocked_by_pending_post_passive_gate
    }

    #[must_use]
    pub(crate) fn drained_act_continuations(&self) -> &[SyncFlushActContinuationDrainRecord] {
        &self.drained_act_continuations
    }

    #[must_use]
    pub(crate) fn drained_count(&self) -> usize {
        self.drained_act_continuations.len()
    }

    #[must_use]
    pub(crate) fn did_drain_accepted_internal_act_continuations(&self) -> bool {
        !self.drained_act_continuations.is_empty()
            && self
                .drained_act_continuations
                .iter()
                .all(|record| record.is_accepted_internal_act_continuation())
    }

    #[must_use]
    pub(crate) const fn drains_public_react_act_queue(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_timing_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_queued_work(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_effects(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
#[doc(hidden)]
pub struct SyncFlushCrossRootRenderDiagnosticsForCanary {
    committed_root_order: Vec<FiberRootId>,
    render_lanes_by_root: Vec<Lanes>,
    remaining_lanes_by_root: Vec<Lanes>,
    pending_lanes_by_root_after_commit: Vec<Lanes>,
    applied_update_counts_by_root: Vec<usize>,
    skipped_update_counts_by_root: Vec<usize>,
    skipped_reentrant_flush: bool,
    skipped_no_sync_work: bool,
    might_have_pending_sync_work_after_flush: bool,
    root_current_matches_commits: bool,
    sync_lanes_consumed_from_roots: bool,
}

impl SyncFlushCrossRootRenderDiagnosticsForCanary {
    #[must_use]
    pub fn committed_root_order(&self) -> &[FiberRootId] {
        &self.committed_root_order
    }

    #[must_use]
    pub fn render_lanes_by_root(&self) -> &[Lanes] {
        &self.render_lanes_by_root
    }

    #[must_use]
    pub fn remaining_lanes_by_root(&self) -> &[Lanes] {
        &self.remaining_lanes_by_root
    }

    #[must_use]
    pub fn pending_lanes_by_root_after_commit(&self) -> &[Lanes] {
        &self.pending_lanes_by_root_after_commit
    }

    #[must_use]
    pub fn applied_update_counts_by_root(&self) -> &[usize] {
        &self.applied_update_counts_by_root
    }

    #[must_use]
    pub fn skipped_update_counts_by_root(&self) -> &[usize] {
        &self.skipped_update_counts_by_root
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
    pub const fn might_have_pending_sync_work_after_flush(&self) -> bool {
        self.might_have_pending_sync_work_after_flush
    }

    #[must_use]
    pub const fn root_current_matches_commits(&self) -> bool {
        self.root_current_matches_commits
    }

    #[must_use]
    pub const fn sync_lanes_consumed_from_roots(&self) -> bool {
        self.sync_lanes_consumed_from_roots
    }

    #[must_use]
    pub fn proves_cross_root_sync_flush_scheduling(&self) -> bool {
        self.committed_root_order.len() >= 2
            && self.render_lanes_by_root.len() == self.committed_root_order.len()
            && self.remaining_lanes_by_root.len() == self.committed_root_order.len()
            && self.pending_lanes_by_root_after_commit.len() == self.committed_root_order.len()
            && self
                .render_lanes_by_root
                .iter()
                .all(|lanes| *lanes == Lanes::SYNC)
            && self
                .remaining_lanes_by_root
                .iter()
                .all(|lanes| lanes.is_empty())
            && self
                .pending_lanes_by_root_after_commit
                .iter()
                .all(|lanes| lanes.is_empty())
            && !self.skipped_reentrant_flush
            && !self.skipped_no_sync_work
            && !self.might_have_pending_sync_work_after_flush
            && self.root_current_matches_commits
            && self.sync_lanes_consumed_from_roots
    }
}

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
        sync_flush_post_passive_continuation_execution_gate(
            store,
            execution_context,
            self.commit.pending_passive_handoff(),
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

    #[doc(hidden)]
    pub fn commit_rendered_sync_flush_record_with_diagnostics_for_canary<H: HostTypes>(
        store: &mut FiberRootStore<H>,
        record: RootSyncFlushRecord,
    ) -> Result<(Self, SyncFlushRootHostOutputCommitDiagnosticsForCanary), SyncFlushError> {
        let committed = Self::commit_rendered_sync_flush_record(store, record)?;
        let diagnostics = committed.host_output_commit_diagnostics_for_canary(store)?;
        Ok((committed, diagnostics))
    }

    #[doc(hidden)]
    pub fn host_output_commit_diagnostics_for_canary<H: HostTypes>(
        &self,
        store: &FiberRootStore<H>,
    ) -> Result<SyncFlushRootHostOutputCommitDiagnosticsForCanary, SyncFlushError> {
        let root = store.root(self.root)?;
        let scheduling = root.scheduling();
        let callback_queue = self.render_phase.work_in_progress_update_queue();
        let post_commit_callbacks = store
            .update_queues()
            .peek_root_update_callback_records(callback_queue)
            .map_err(RootCommitError::from)?;
        let accepted_callbacks = self.root_update_callbacks();

        Ok(SyncFlushRootHostOutputCommitDiagnosticsForCanary {
            root: self.root,
            order: self.order,
            callback_queue,
            render_lanes: self.render_lanes,
            finished_lanes: self.commit.finished_lanes(),
            remaining_lanes: self.commit.remaining_lanes(),
            commit_pending_lanes: self.commit.pending_lanes(),
            root_pending_lanes_after_commit: root.lanes().pending_lanes(),
            root_current_after_commit: root.current(),
            committed_current: self.commit.current(),
            render_phase_work_after_commit: scheduling.work_in_progress(),
            render_phase_lanes_after_commit: scheduling.work_in_progress_root_render_lanes(),
            callback_node_after_commit: scheduling.callback_node(),
            callback_priority_after_commit: scheduling.callback_priority(),
            might_have_pending_sync_work: store.root_scheduler().might_have_pending_sync_work(),
            accepted_visible_callback_count: accepted_callbacks.visible().len(),
            accepted_hidden_callback_count: accepted_callbacks.hidden().len(),
            accepted_deferred_hidden_callback_count: accepted_callbacks.deferred_hidden().len(),
            post_commit_visible_callback_count: post_commit_callbacks.visible().len(),
            post_commit_hidden_callback_count: post_commit_callbacks.hidden().len(),
            post_commit_deferred_hidden_callback_count: post_commit_callbacks
                .deferred_hidden()
                .len(),
            mutation_record_count: self.commit.mutation_log().len(),
            mutation_apply_record_count: self.commit.mutation_apply_log().len(),
            host_root_placement_apply_count: self
                .commit
                .host_root_placement_apply_diagnostics_for_canary()
                .len(),
        })
    }

    #[doc(hidden)]
    #[allow(
        dead_code,
        reason = "crate-private sync-flush/act canary drain helper is exercised by tests and reserved for private act workers"
    )]
    pub(crate) fn drain_accepted_act_continuations_after_host_output_canary(
        &mut self,
        diagnostics: SyncFlushRootHostOutputCommitDiagnosticsForCanary,
    ) -> SyncFlushActPrivateExecutionDiagnosticsForCanary {
        let host_output_canary_committed =
            self.accepts_host_output_canary_commit_diagnostics(diagnostics);
        let blocked_by_pending_post_passive_gate =
            host_output_canary_committed && self.act_post_passive_continuation_gate.is_some();
        let can_drain = host_output_canary_committed && !blocked_by_pending_post_passive_gate;
        let mut drained_act_continuations = Vec::new();
        if can_drain
            && let Some(continuation) = self.act_continuation
            && let Some(record) = sync_flush_act_continuation_drain_record_after_host_output_canary(
                continuation,
                true,
            )
        {
            self.act_continuation = None;
            drained_act_continuations.push(record);
        }

        SyncFlushActPrivateExecutionDiagnosticsForCanary {
            root: self.root,
            order: self.order,
            host_output_canary_committed,
            blocked_by_pending_post_passive_gate,
            drained_act_continuations,
        }
    }

    #[allow(
        dead_code,
        reason = "crate-private sync-flush/act canary acceptance helper is exercised by tests and reserved for private act workers"
    )]
    fn accepts_host_output_canary_commit_diagnostics(
        &self,
        diagnostics: SyncFlushRootHostOutputCommitDiagnosticsForCanary,
    ) -> bool {
        diagnostics.root() == self.root
            && diagnostics.order() == self.order
            && diagnostics.render_lanes() == self.render_lanes
            && diagnostics.committed_current() == self.commit.current()
            && diagnostics.commit_handoff_state_consumed()
            && diagnostics.recorded_host_output_mutation_metadata()
            && diagnostics.host_root_placement_apply_count() > 0
            && diagnostics.root_current_after_commit() == self.commit.current()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushPostPassiveContinuationExecutionRecord {
    gate: SyncFlushPostPassiveContinuationExecutionGateRecord,
    sync_flush_result: Option<SyncFlushResult>,
}

#[allow(
    dead_code,
    reason = "crate-private post-passive sync-flush continuation execution metadata for future passive workers"
)]
impl SyncFlushPostPassiveContinuationExecutionRecord {
    #[must_use]
    pub(crate) const fn gate(&self) -> &SyncFlushPostPassiveContinuationExecutionGateRecord {
        &self.gate
    }

    #[must_use]
    pub(crate) fn sync_flush_result(&self) -> Option<&SyncFlushResult> {
        self.sync_flush_result.as_ref()
    }

    #[must_use]
    pub(crate) const fn did_request_follow_up_sync_flush(&self) -> bool {
        self.gate.should_execute_follow_up_sync_flush()
    }

    #[must_use]
    pub(crate) fn did_execute_follow_up_sync_flush(&self) -> bool {
        self.sync_flush_result.is_some()
    }

    #[must_use]
    pub(crate) fn did_flush_follow_up_sync_work(&self) -> bool {
        match &self.sync_flush_result {
            Some(result) => result.did_flush_work(),
            None => false,
        }
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

    #[doc(hidden)]
    pub fn cross_root_render_diagnostics_for_canary<H: HostTypes>(
        &self,
        store: &FiberRootStore<H>,
    ) -> Result<SyncFlushCrossRootRenderDiagnosticsForCanary, SyncFlushError> {
        let mut committed_root_order = Vec::with_capacity(self.records.len());
        let mut render_lanes_by_root = Vec::with_capacity(self.records.len());
        let mut remaining_lanes_by_root = Vec::with_capacity(self.records.len());
        let mut pending_lanes_by_root_after_commit = Vec::with_capacity(self.records.len());
        let mut applied_update_counts_by_root = Vec::with_capacity(self.records.len());
        let mut skipped_update_counts_by_root = Vec::with_capacity(self.records.len());
        let mut root_current_matches_commits = true;
        let mut sync_lanes_consumed_from_roots = true;

        for record in &self.records {
            let root = store.root(record.root())?;
            let pending_lanes = root.lanes().pending_lanes();
            committed_root_order.push(record.root());
            render_lanes_by_root.push(record.render_lanes());
            remaining_lanes_by_root.push(record.remaining_lanes());
            pending_lanes_by_root_after_commit.push(pending_lanes);
            applied_update_counts_by_root.push(record.applied_update_count());
            skipped_update_counts_by_root.push(record.skipped_update_count());
            root_current_matches_commits &= root.current() == record.commit().current()
                && record.commit().current() == record.render_phase().finished_work();
            sync_lanes_consumed_from_roots &= record
                .commit()
                .finished_lanes()
                .contains_all(record.render_lanes())
                && !pending_lanes.contains_any(record.render_lanes());
        }

        Ok(SyncFlushCrossRootRenderDiagnosticsForCanary {
            committed_root_order,
            render_lanes_by_root,
            remaining_lanes_by_root,
            pending_lanes_by_root_after_commit,
            applied_update_counts_by_root,
            skipped_update_counts_by_root,
            skipped_reentrant_flush: self.skipped_reentrant_flush,
            skipped_no_sync_work: self.skipped_no_sync_work,
            might_have_pending_sync_work_after_flush: store
                .root_scheduler()
                .might_have_pending_sync_work(),
            root_current_matches_commits,
            sync_lanes_consumed_from_roots,
        })
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

pub(crate) fn flush_sync_post_passive_continuation_after_passive_effects<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    execution_context: &ExecutionContextState,
    pending_passive_handoff: Option<PendingPassiveCommitHandoff>,
) -> Result<Option<SyncFlushPostPassiveContinuationExecutionRecord>, SyncFlushError> {
    let Some(gate) = sync_flush_post_passive_continuation_execution_gate(
        store,
        execution_context,
        pending_passive_handoff,
    )?
    else {
        return Ok(None);
    };

    let sync_flush_result = if gate.should_execute_follow_up_sync_flush() {
        Some(flush_sync_commit_work_on_all_roots(store)?)
    } else {
        None
    };

    Ok(Some(SyncFlushPostPassiveContinuationExecutionRecord {
        gate,
        sync_flush_result,
    }))
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
        RootSyncFlushRecordStatus, TestRendererHostOutputCanaryFixture,
        TestRendererHostOutputCanaryMutationKind, ensure_root_is_scheduled,
        finish_test_renderer_host_output_canary_fibers, flush_sync_work_on_all_roots,
        inspect_test_renderer_host_output_canary_commit,
        prepare_test_renderer_host_output_canary_fibers, scheduled_roots, update_container,
        update_container_sync,
    };
    use crate::{RootUpdateCallbackHandle, RootUpdateCallbackRecord, RootUpdateCallbackVisibility};
    use fast_react_core::{FiberTag, Lane, Lanes};

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
    fn sync_flush_handoff_commits_already_renderable_host_output_canary_with_diagnostics() {
        let (mut store, root_id, host) = root_store();
        let sync_element = RootElementHandle::from_raw(800);
        let default_element = RootElementHandle::from_raw(801);
        let callback = RootUpdateCallbackHandle::from_raw(802);
        let previous_current = store.root(root_id).unwrap().current();
        let sync_update =
            update_container_sync(&mut store, root_id, sync_element, Some(callback)).unwrap();
        ensure_root_is_scheduled(&mut store, sync_update.schedule()).unwrap();
        let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
        ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        assert_eq!(rendered.records().len(), 1);
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        assert_eq!(render_phase.root(), root_id);
        assert_eq!(render_phase.render_lanes(), Lanes::SYNC);
        assert_eq!(render_phase.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert!(store.root_scheduler().might_have_pending_sync_work());

        let fixture = TestRendererHostOutputCanaryFixture::new(810, 811, 812);
        let prepared =
            prepare_test_renderer_host_output_canary_fibers(&mut store, render_phase, fixture)
                .unwrap();
        let completed =
            finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 813, 814).unwrap();

        let (committed, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered_record,
            )
            .unwrap();

        assert_eq!(committed.order(), 0);
        assert_eq!(committed.root(), root_id);
        assert_eq!(committed.render_lanes(), Lanes::SYNC);
        assert_eq!(committed.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(committed.pending_lanes(), Lanes::DEFAULT);
        assert!(committed.has_remaining_work());
        assert_eq!(committed.commit().previous_current(), previous_current);
        assert_eq!(committed.commit().current(), completed.host_root());
        assert_eq!(
            store.root(root_id).unwrap().current(),
            completed.host_root()
        );
        assert_eq!(current_host_root_element(&store, root_id), sync_element);
        assert!(
            !store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::SYNC)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );

        let callbacks = committed.root_update_callbacks();
        assert_eq!(
            callbacks.queue(),
            render_phase.work_in_progress_update_queue()
        );
        assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
        assert_eq!(callbacks.visible()[0].update(), sync_update.update());
        assert!(callbacks.hidden().is_empty());
        assert!(callbacks.deferred_hidden().is_empty());

        let host_output = inspect_test_renderer_host_output_canary_commit(committed.commit());
        assert_eq!(host_output.mutation_records().len(), 1);
        assert!(host_output.deletion_lists().is_empty());
        assert_eq!(
            host_output.mutation_records()[0].kind(),
            TestRendererHostOutputCanaryMutationKind::Placement
        );
        assert_eq!(
            host_output.mutation_records()[0].fiber(),
            completed.component()
        );
        assert_eq!(
            host_output.mutation_records()[0].tag(),
            FiberTag::HostComponent
        );
        assert_eq!(host_output.mutation_records()[0].state_node_raw(), 813);
        assert_eq!(
            store
                .fiber_arena()
                .get(completed.component())
                .unwrap()
                .child(),
            Some(completed.text())
        );

        let placement_diagnostics = committed
            .commit()
            .host_root_placement_apply_diagnostics_for_canary();
        assert_eq!(placement_diagnostics.len(), 1);
        assert_eq!(placement_diagnostics[0].fiber(), completed.component());
        assert_eq!(
            placement_diagnostics[0].apply_kind(),
            "append-placement-to-container"
        );
        assert_eq!(placement_diagnostics[0].sibling_status(), "append");

        assert_eq!(diagnostics.root(), root_id);
        assert_eq!(diagnostics.order(), 0);
        assert_eq!(
            diagnostics.callback_queue(),
            render_phase.work_in_progress_update_queue()
        );
        assert_eq!(diagnostics.render_lanes(), Lanes::SYNC);
        assert_eq!(diagnostics.finished_lanes(), Lanes::SYNC);
        assert_eq!(diagnostics.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(diagnostics.commit_pending_lanes(), Lanes::DEFAULT);
        assert_eq!(
            diagnostics.root_pending_lanes_after_commit(),
            Lanes::DEFAULT
        );
        assert_eq!(
            diagnostics.root_current_after_commit(),
            completed.host_root()
        );
        assert_eq!(diagnostics.committed_current(), completed.host_root());
        assert_eq!(diagnostics.render_phase_work_after_commit(), None);
        assert_eq!(diagnostics.render_phase_lanes_after_commit(), Lanes::NO);
        assert_eq!(
            diagnostics.callback_node_after_commit(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(
            diagnostics.callback_priority_after_commit(),
            RootCallbackPriority::NO
        );
        assert!(!diagnostics.might_have_pending_sync_work());
        assert_eq!(diagnostics.accepted_visible_callback_count(), 1);
        assert_eq!(diagnostics.accepted_hidden_callback_count(), 0);
        assert_eq!(diagnostics.accepted_deferred_hidden_callback_count(), 0);
        assert_eq!(diagnostics.accepted_callback_count(), 1);
        assert_eq!(diagnostics.post_commit_visible_callback_count(), 0);
        assert_eq!(diagnostics.post_commit_hidden_callback_count(), 0);
        assert_eq!(diagnostics.post_commit_deferred_hidden_callback_count(), 0);
        assert_eq!(diagnostics.mutation_record_count(), 1);
        assert_eq!(diagnostics.mutation_apply_record_count(), 1);
        assert_eq!(diagnostics.host_root_placement_apply_count(), 1);
        assert!(diagnostics.recorded_host_output_mutation_metadata());
        assert!(diagnostics.commit_handoff_state_consumed());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_act_private_execution_drains_pending_continuation_after_canary() {
        let (mut store, root_id, host) = root_store();
        let sync_element = RootElementHandle::from_raw(820);
        let default_element = RootElementHandle::from_raw(821);
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, root_id, sync_element);
        let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
        ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        let prepared = prepare_test_renderer_host_output_canary_fibers(
            &mut store,
            render_phase,
            TestRendererHostOutputCanaryFixture::new(822, 823, 824),
        )
        .unwrap();
        let completed =
            finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 825, 826).unwrap();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let (mut committed, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered_record,
            )
            .unwrap();

        let continuation = committed.act_continuation.unwrap();
        assert_eq!(
            continuation.status(),
            SchedulerActContinuationStatus::PendingContinuation
        );
        assert_eq!(continuation.continuation_lanes(), Lanes::DEFAULT);

        let private_execution =
            committed.drain_accepted_act_continuations_after_host_output_canary(diagnostics);

        assert_eq!(private_execution.root(), root_id);
        assert_eq!(private_execution.order(), committed.order());
        assert!(private_execution.host_output_canary_committed());
        assert!(!private_execution.blocked_by_pending_post_passive_gate());
        assert_eq!(private_execution.drained_count(), 1);
        assert!(private_execution.did_drain_accepted_internal_act_continuations());
        assert!(!private_execution.drains_public_react_act_queue());
        assert!(!private_execution.public_act_compatibility_claimed());
        assert!(!private_execution.public_scheduler_timing_compatibility_claimed());
        assert!(!private_execution.executes_queued_work());
        assert!(!private_execution.executes_effects());
        let drained = private_execution.drained_act_continuations()[0];
        assert_eq!(drained.root(), root_id);
        assert_eq!(drained.sync_flush_order(), committed.order());
        assert_eq!(drained.flushed_lanes(), Lanes::SYNC);
        assert_eq!(drained.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(drained.continuation_lanes(), Lanes::DEFAULT);
        assert_eq!(drained.act_scope_depth(), 1);
        assert!(!drained.nested_act_scope());
        assert!(drained.host_output_canary_committed());
        assert_eq!(
            drained.source_status(),
            SchedulerActContinuationStatus::PendingContinuation
        );
        assert!(drained.is_accepted_internal_act_continuation());
        assert_eq!(committed.act_continuation, None);
        assert_eq!(committed.act_post_passive_continuation_gate, None);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            completed.host_root()
        );
        assert_eq!(current_host_root_element(&store, root_id), sync_element);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn sync_flush_act_private_execution_requires_canary_and_passive_clearance() {
        let (mut store, root_id, host) = root_store();
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(830));
        let default_update =
            update_container(&mut store, root_id, RootElementHandle::from_raw(831), None).unwrap();
        ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        let mut committed = SyncFlushRootRecord::commit_rendered_sync_flush_record(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();
        let continuation_before = committed.act_continuation;
        let diagnostics = committed
            .host_output_commit_diagnostics_for_canary(&store)
            .unwrap();

        let without_canary =
            committed.drain_accepted_act_continuations_after_host_output_canary(diagnostics);

        assert!(!without_canary.host_output_canary_committed());
        assert!(!without_canary.blocked_by_pending_post_passive_gate());
        assert_eq!(without_canary.drained_count(), 0);
        assert!(!without_canary.did_drain_accepted_internal_act_continuations());
        assert_eq!(committed.act_continuation, continuation_before);

        let mut store = FiberRootStore::<RecordingHost>::new();
        let host_with_passive = RecordingHost::default();
        let passive_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_sync_update(&mut store, passive_root, RootElementHandle::from_raw(832));
        let passive_default = update_container(
            &mut store,
            passive_root,
            RootElementHandle::from_raw(833),
            None,
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, passive_default.schedule()).unwrap();
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let rendered_record = rendered.records()[0];
        let render_phase = rendered_record.render_phase();
        let finished_work = render_phase.finished_work();
        {
            let scheduling = store.root_mut(passive_root).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(passive_root, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::SYNC)
                .unwrap();
        }
        let prepared = prepare_test_renderer_host_output_canary_fibers(
            &mut store,
            render_phase,
            TestRendererHostOutputCanaryFixture::new(834, 835, 836),
        )
        .unwrap();
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 837, 838).unwrap();

        let (mut committed_with_passive, diagnostics) =
            SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
                &mut store,
                rendered_record,
            )
            .unwrap();
        let continuation_before = committed_with_passive.act_continuation;

        let blocked = committed_with_passive
            .drain_accepted_act_continuations_after_host_output_canary(diagnostics);

        assert!(blocked.host_output_canary_committed());
        assert!(blocked.blocked_by_pending_post_passive_gate());
        assert_eq!(blocked.drained_count(), 0);
        assert_eq!(committed_with_passive.act_continuation, continuation_before);
        assert!(
            committed_with_passive
                .act_post_passive_continuation_gate
                .is_some()
        );
        assert!(
            store
                .root(passive_root)
                .unwrap()
                .scheduling()
                .pending_passive()
                .has_commit_handoff()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(host_with_passive.operations(), Vec::<&'static str>::new());
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
    fn sync_flush_post_passive_continuation_executes_private_follow_up_sync_flush() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let passive_root = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let continuation_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let continuation_element = RootElementHandle::from_raw(704);
        schedule_sync_update(&mut store, passive_root, RootElementHandle::from_raw(703));
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
        let handoff = committed.commit().pending_passive_handoff();
        store
            .root_mut(passive_root)
            .unwrap()
            .scheduling_mut()
            .clear_pending_passive();
        schedule_sync_update(&mut store, continuation_root, continuation_element);
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let continuation = flush_sync_post_passive_continuation_after_passive_effects(
            &mut store,
            &ExecutionContextState::new(),
            handoff,
        )
        .unwrap()
        .unwrap();

        assert!(continuation.did_request_follow_up_sync_flush());
        assert!(continuation.did_execute_follow_up_sync_flush());
        assert!(continuation.did_flush_follow_up_sync_work());
        assert_eq!(
            continuation.gate().exit_status(),
            RootSyncFlushExitStatus::Completed
        );
        assert_eq!(continuation.gate().pending_passive_root(), passive_root);
        assert_eq!(
            continuation.gate().pending_passive_finished_work(),
            finished_work
        );
        assert_eq!(continuation.gate().pending_passive_lanes(), Lanes::SYNC);
        assert_eq!(continuation.gate().pending_passive_mount_count(), 1);
        assert_eq!(continuation.gate().continuation_roots().len(), 1);
        assert_eq!(
            continuation.gate().continuation_roots()[0].root(),
            continuation_root
        );
        let result = continuation.sync_flush_result().unwrap();
        assert!(result.did_flush_work());
        assert_eq!(result.records().len(), 1);
        assert_eq!(result.records()[0].root(), continuation_root);
        assert_eq!(result.records()[0].render_lanes(), Lanes::SYNC);
        assert_eq!(
            current_host_root_element(&store, continuation_root),
            continuation_element
        );
        assert!(
            store
                .root(passive_root)
                .unwrap()
                .scheduling()
                .pending_passive()
                .is_empty()
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
    fn sync_flush_post_passive_continuation_requires_passive_handoff() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(705));

        let continuation = flush_sync_post_passive_continuation_after_passive_effects(
            &mut store,
            &ExecutionContextState::new(),
            None,
        )
        .unwrap();

        assert_eq!(continuation, None);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert!(store.root_scheduler().might_have_pending_sync_work());
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
    fn sync_flush_cross_root_render_diagnostics_prove_scheduled_private_flush() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let first = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let first_element = RootElementHandle::from_raw(901);
        let second_element = RootElementHandle::from_raw(902);

        schedule_sync_update(&mut store, first, first_element);
        schedule_sync_update(&mut store, second, second_element);

        let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
        let diagnostics = result
            .cross_root_render_diagnostics_for_canary(&store)
            .unwrap();

        assert!(result.did_flush_work());
        assert_eq!(result.records().len(), 2);
        assert_eq!(diagnostics.committed_root_order(), &[first, second]);
        assert_eq!(
            diagnostics.render_lanes_by_root(),
            &[Lanes::SYNC, Lanes::SYNC]
        );
        assert_eq!(
            diagnostics.remaining_lanes_by_root(),
            &[Lanes::NO, Lanes::NO]
        );
        assert_eq!(
            diagnostics.pending_lanes_by_root_after_commit(),
            &[Lanes::NO, Lanes::NO]
        );
        assert_eq!(diagnostics.applied_update_counts_by_root(), &[1, 1]);
        assert_eq!(diagnostics.skipped_update_counts_by_root(), &[0, 0]);
        assert!(!diagnostics.skipped_reentrant_flush());
        assert!(!diagnostics.skipped_no_sync_work());
        assert!(!diagnostics.might_have_pending_sync_work_after_flush());
        assert!(diagnostics.root_current_matches_commits());
        assert!(diagnostics.sync_lanes_consumed_from_roots());
        assert!(diagnostics.proves_cross_root_sync_flush_scheduling());
        assert_eq!(current_host_root_element(&store, first), first_element);
        assert_eq!(current_host_root_element(&store, second), second_element);
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
