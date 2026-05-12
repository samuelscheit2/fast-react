use fast_react_core::{FiberId, LaneTimestamp, Lanes};
use fast_react_host_config::HostTypes;

use crate::root_commit::{HostRootCommitRecord, PendingPassiveCommitHandoff};
#[cfg(test)]
use crate::root_commit::{
    HostRootFinishedWorkCommitHandoffRecordForCanary,
    commit_completed_host_root_render_with_finished_work_handoff_for_canary,
};
use crate::scheduler_bridge::{
    SchedulerActContinuationRecord, SchedulerActContinuationStatus, SchedulerActQueueTaskKind,
    SchedulerBridge,
};
use crate::{
    FiberRootId, FiberRootStore, HostRootRenderPhaseRecord, RootCallbackPriority,
    SchedulerActQueueRequest, render_host_root_for_lanes,
};

use super::{
    RootExpiredLaneSyncSchedulerContinuationRecord, RootExpiredLaneSyncSchedulerContinuationStatus,
    RootScheduleMicrotaskResult, RootSchedulerError, SchedulerBridgeActContinuationExecutionError,
    SchedulerBridgeActQueueExecutionError,
    execute_expired_lane_sync_scheduler_continuation_for_root_for_canary,
    process_root_schedule_in_microtask, recompute_might_have_pending_sync_work,
    select_lanes_for_scheduled_task,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushActPostPassiveContinuationGateRecord {
    root: FiberRootId,
    sync_flush_order: usize,
    flushed_lanes: Lanes,
    remaining_lanes: Lanes,
    continuation_lanes: Lanes,
    pending_passive_finished_work: FiberId,
    pending_passive_lanes: Lanes,
    pending_passive_unmount_count: usize,
    pending_passive_mount_count: usize,
    act_scope_depth: usize,
    nested_act_scope: bool,
}

#[allow(
    dead_code,
    reason = "crate-private post-passive act continuation gate metadata for future act workers"
)]
impl SyncFlushActPostPassiveContinuationGateRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn sync_flush_order(self) -> usize {
        self.sync_flush_order
    }

    #[must_use]
    pub(crate) const fn flushed_lanes(self) -> Lanes {
        self.flushed_lanes
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub(crate) const fn continuation_lanes(self) -> Lanes {
        self.continuation_lanes
    }

    #[must_use]
    pub(crate) const fn pending_passive_finished_work(self) -> FiberId {
        self.pending_passive_finished_work
    }

    #[must_use]
    pub(crate) const fn pending_passive_lanes(self) -> Lanes {
        self.pending_passive_lanes
    }

    #[must_use]
    pub(crate) const fn pending_passive_unmount_count(self) -> usize {
        self.pending_passive_unmount_count
    }

    #[must_use]
    pub(crate) const fn pending_passive_mount_count(self) -> usize {
        self.pending_passive_mount_count
    }

    #[must_use]
    pub(crate) const fn pending_passive_record_count(self) -> usize {
        self.pending_passive_unmount_count + self.pending_passive_mount_count
    }

    #[must_use]
    pub(crate) const fn act_scope_depth(self) -> usize {
        self.act_scope_depth
    }

    #[must_use]
    pub(crate) const fn nested_act_scope(self) -> bool {
        self.nested_act_scope
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushActContinuationDrainRecord {
    pub(super) root: FiberRootId,
    pub(super) sync_flush_order: usize,
    pub(super) flushed_lanes: Lanes,
    pub(super) remaining_lanes: Lanes,
    pub(super) continuation_lanes: Lanes,
    pub(super) act_scope_depth: usize,
    pub(super) nested_act_scope: bool,
    pub(super) source_status: SchedulerActContinuationStatus,
    pub(super) host_output_canary_committed: bool,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush/act canary drain diagnostic reserved for private act workers"
)]
impl SyncFlushActContinuationDrainRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn sync_flush_order(self) -> usize {
        self.sync_flush_order
    }

    #[must_use]
    pub(crate) const fn flushed_lanes(self) -> Lanes {
        self.flushed_lanes
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub(crate) const fn continuation_lanes(self) -> Lanes {
        self.continuation_lanes
    }

    #[must_use]
    pub(crate) const fn act_scope_depth(self) -> usize {
        self.act_scope_depth
    }

    #[must_use]
    pub(crate) const fn nested_act_scope(self) -> bool {
        self.nested_act_scope
    }

    #[must_use]
    pub(crate) const fn source_status(self) -> SchedulerActContinuationStatus {
        self.source_status
    }

    #[must_use]
    pub(crate) const fn host_output_canary_committed(self) -> bool {
        self.host_output_canary_committed
    }

    #[must_use]
    pub(crate) const fn drains_public_react_act_queue(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_queued_work(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_effects(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn is_accepted_internal_act_continuation(self) -> bool {
        self.host_output_canary_committed
            && matches!(
                self.source_status,
                SchedulerActContinuationStatus::PendingContinuation
            )
            && self.continuation_lanes.is_non_empty()
            && !self.drains_public_react_act_queue()
            && !self.public_act_compatibility_claimed()
            && !self.public_flush_sync_compatibility_claimed()
            && !self.executes_queued_work()
            && !self.executes_effects()
    }

    #[must_use]
    pub(crate) fn matches_source_act_continuation(
        self,
        source: SchedulerActContinuationRecord,
    ) -> bool {
        self.root == source.root()
            && self.sync_flush_order == source.sync_flush_order()
            && self.flushed_lanes == source.flushed_lanes()
            && self.remaining_lanes == source.remaining_lanes()
            && self.continuation_lanes == source.continuation_lanes()
            && self.act_scope_depth == source.act_scope_depth()
            && self.nested_act_scope == source.nested_act_scope()
            && self.source_status == source.status()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SchedulerBridgeActContinuationExecutionStatus {
    RejectedContinuation,
    NoContinuationWork,
    BlockedByLaneMismatch,
    RenderedAndCommitted,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SchedulerBridgeActContinuationExecutionRecord {
    continuation: SyncFlushActContinuationDrainRecord,
    execution_order: usize,
    selected_lanes: Lanes,
    pending_lanes_before_execution: Lanes,
    pending_lanes_after_execution: Lanes,
    status: SchedulerBridgeActContinuationExecutionStatus,
    render_phase: Option<HostRootRenderPhaseRecord>,
    commit: Option<HostRootCommitRecord>,
    #[cfg(test)]
    root_commit_handoff: Option<HostRootFinishedWorkCommitHandoffRecordForCanary>,
}

#[allow(
    dead_code,
    reason = "crate-private scheduler-bridge act continuation execution diagnostics reserved for private act workers"
)]
impl SchedulerBridgeActContinuationExecutionRecord {
    #[must_use]
    pub(crate) const fn continuation(&self) -> SyncFlushActContinuationDrainRecord {
        self.continuation
    }

    #[must_use]
    pub(crate) const fn execution_order(&self) -> usize {
        self.execution_order
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.continuation.root()
    }

    #[must_use]
    pub(crate) const fn requested_lanes(&self) -> Lanes {
        self.continuation.continuation_lanes()
    }

    #[must_use]
    pub(crate) const fn selected_lanes(&self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before_execution(&self) -> Lanes {
        self.pending_lanes_before_execution
    }

    #[must_use]
    pub(crate) const fn pending_lanes_after_execution(&self) -> Lanes {
        self.pending_lanes_after_execution
    }

    #[must_use]
    pub(crate) const fn status(&self) -> SchedulerBridgeActContinuationExecutionStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn render_phase(&self) -> Option<HostRootRenderPhaseRecord> {
        self.render_phase
    }

    #[must_use]
    pub(crate) fn commit(&self) -> Option<&HostRootCommitRecord> {
        self.commit.as_ref()
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn root_commit_handoff_for_canary(
        &self,
    ) -> Option<&HostRootFinishedWorkCommitHandoffRecordForCanary> {
        self.root_commit_handoff.as_ref()
    }

    #[must_use]
    pub(crate) const fn did_execute_accepted_internal_act_continuation(&self) -> bool {
        matches!(
            self.status,
            SchedulerBridgeActContinuationExecutionStatus::RenderedAndCommitted
        )
    }

    #[must_use]
    pub(crate) const fn rejected_unaccepted_continuation(&self) -> bool {
        matches!(
            self.status,
            SchedulerBridgeActContinuationExecutionStatus::RejectedContinuation
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_lane_mismatch(&self) -> bool {
        matches!(
            self.status,
            SchedulerBridgeActContinuationExecutionStatus::BlockedByLaneMismatch
        )
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
    pub(crate) const fn public_flush_sync_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_timing_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_effects(&self) -> bool {
        false
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn accepted_root_scheduler_execution_evidence_for_canary(&self) -> bool {
        self.did_execute_accepted_internal_act_continuation()
            && self.render_phase.is_some()
            && self.commit.is_some()
            && self.selected_lanes == self.continuation.continuation_lanes()
    }

    #[must_use]
    pub(crate) fn consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary(
        &self,
    ) -> bool {
        self.did_execute_accepted_internal_act_continuation()
            && self
                .pending_lanes_before_execution
                .contains_all(self.continuation.continuation_lanes())
            && !self
                .pending_lanes_after_execution
                .contains_any(self.continuation.continuation_lanes())
            && self.commit.as_ref().is_some_and(|commit| {
                commit.finished_lanes() == self.continuation.continuation_lanes()
                    && commit.remaining_lanes() == self.pending_lanes_after_execution
                    && commit.pending_lanes() == self.pending_lanes_after_execution
            })
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn accepted_root_commit_execution_evidence_for_canary(&self) -> bool {
        self.root_commit_handoff
            .as_ref()
            .is_some_and(HostRootFinishedWorkCommitHandoffRecordForCanary::proves_private_root_finished_work_commit_metadata_handoff)
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn routed_through_root_scheduler_and_commit_evidence_for_canary(&self) -> bool {
        self.accepted_root_scheduler_execution_evidence_for_canary()
            && self.accepted_root_commit_execution_evidence_for_canary()
            && !self.drains_public_react_act_queue()
            && !self.public_act_compatibility_claimed()
            && !self.public_flush_sync_compatibility_claimed()
            && !self.public_scheduler_timing_compatibility_claimed()
            && !self.executes_effects()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SchedulerBridgeActContinuationExecutionResult {
    records: Vec<SchedulerBridgeActContinuationExecutionRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private scheduler-bridge act continuation execution diagnostics reserved for private act workers"
)]
impl SchedulerBridgeActContinuationExecutionResult {
    #[must_use]
    pub(crate) fn records(&self) -> &[SchedulerBridgeActContinuationExecutionRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn executed_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.did_execute_accepted_internal_act_continuation())
            .count()
    }

    #[must_use]
    pub(crate) fn rejected_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.rejected_unaccepted_continuation())
            .count()
    }

    #[must_use]
    pub(crate) fn blocked_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.blocked_by_lane_mismatch()
                    || matches!(
                        record.status(),
                        SchedulerBridgeActContinuationExecutionStatus::NoContinuationWork
                    )
            })
            .count()
    }

    #[must_use]
    pub(crate) fn did_execute_accepted_internal_act_continuations(&self) -> bool {
        self.executed_count() > 0
            && self.records.iter().all(|record| {
                !record.did_execute_accepted_internal_act_continuation()
                    || record
                        .continuation()
                        .is_accepted_internal_act_continuation()
            })
    }

    #[must_use]
    pub(crate) fn records_preserve_sync_flush_order(&self) -> bool {
        self.records
            .iter()
            .enumerate()
            .all(|(order, record)| record.execution_order() == order)
            && self.records.windows(2).all(|records| {
                records[0].continuation().sync_flush_order()
                    <= records[1].continuation().sync_flush_order()
            })
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn preserves_nested_act_root_continuation_order_and_lanes_for_canary(&self) -> bool {
        !self.records.is_empty()
            && self.records_preserve_sync_flush_order()
            && self.records.iter().all(|record| {
                record.did_execute_accepted_internal_act_continuation()
                    && record.continuation().nested_act_scope()
                    && record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary()
                    && record.routed_through_root_scheduler_and_commit_evidence_for_canary()
                    && !record.drains_public_react_act_queue()
                    && !record.public_act_compatibility_claimed()
                    && !record.public_flush_sync_compatibility_claimed()
                    && !record.public_scheduler_timing_compatibility_claimed()
                    && !record.executes_effects()
            })
            && !self.drains_public_react_act_queue()
            && !self.public_act_compatibility_claimed()
            && !self.public_flush_sync_compatibility_claimed()
            && !self.public_scheduler_timing_compatibility_claimed()
            && !self.executes_effects()
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
    pub(crate) const fn public_flush_sync_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_timing_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_effects(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SchedulerBridgeActQueueRequestExecutionStatus {
    RejectedUnqueuedRequest,
    RejectedMalformedRequest,
    RootScheduleProcessed,
    RenderCallbackStaleCallbackNode,
    RenderCallbackNoExpiredLanes,
    RenderCallbackNoExpiredWorkSelected,
    RenderCallbackBlockedByPendingPassive,
    RenderCallbackNoContinuationWork,
    RenderCallbackBlockedByLaneMismatch,
    RenderCallbackBlockedByFinishedWorkHandoffMismatch,
    RenderCallbackRenderedAndCommitted,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SchedulerBridgeActQueueRequestExecutionRecord {
    request: SchedulerActQueueRequest,
    execution_order: usize,
    status: SchedulerBridgeActQueueRequestExecutionStatus,
    root_schedule: Option<RootScheduleMicrotaskResult>,
    render_callback: Option<RootExpiredLaneSyncSchedulerContinuationRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private scheduler-bridge act queue execution diagnostics reserved for private act workers"
)]
impl SchedulerBridgeActQueueRequestExecutionRecord {
    #[must_use]
    pub(crate) const fn request(&self) -> SchedulerActQueueRequest {
        self.request
    }

    #[must_use]
    pub(crate) const fn queue_order(&self) -> usize {
        self.request.queue_order()
    }

    #[must_use]
    pub(crate) const fn execution_order(&self) -> usize {
        self.execution_order
    }

    #[must_use]
    pub(crate) const fn status(&self) -> SchedulerBridgeActQueueRequestExecutionStatus {
        self.status
    }

    #[must_use]
    pub(crate) fn root_schedule(&self) -> Option<&RootScheduleMicrotaskResult> {
        self.root_schedule.as_ref()
    }

    #[must_use]
    pub(crate) fn render_callback(
        &self,
    ) -> Option<&RootExpiredLaneSyncSchedulerContinuationRecord> {
        self.render_callback.as_ref()
    }

    #[must_use]
    pub(crate) const fn rejected_unqueued_request(&self) -> bool {
        matches!(
            self.status,
            SchedulerBridgeActQueueRequestExecutionStatus::RejectedUnqueuedRequest
        )
    }

    #[must_use]
    pub(crate) const fn rejected_malformed_request(&self) -> bool {
        matches!(
            self.status,
            SchedulerBridgeActQueueRequestExecutionStatus::RejectedMalformedRequest
        )
    }

    #[must_use]
    pub(crate) const fn did_process_root_schedule(&self) -> bool {
        matches!(
            self.status,
            SchedulerBridgeActQueueRequestExecutionStatus::RootScheduleProcessed
        )
    }

    #[must_use]
    pub(crate) const fn stale_render_callback(&self) -> bool {
        matches!(
            self.status,
            SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackStaleCallbackNode
        )
    }

    #[must_use]
    pub(crate) fn did_execute_accepted_render_callback(&self) -> bool {
        matches!(
            self.status,
            SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackRenderedAndCommitted
        ) && self.render_callback.as_ref().is_some_and(|record| {
            record.did_execute_expired_lane_sync_continuation()
                && record.consumed_accepted_scheduler_continuation_record()
        })
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn accepted_root_scheduler_execution_evidence_for_canary(&self) -> bool {
        self.render_callback.as_ref().is_some_and(|record| {
            self.did_execute_accepted_render_callback()
                && record.consumed_accepted_scheduler_continuation_record()
                && record.continuation().is_some_and(|continuation| {
                    continuation.routed_through_root_scheduler_and_commit_evidence_for_canary()
                })
        })
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
    pub(crate) const fn public_root_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_timing_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_effects(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SchedulerBridgeActQueueExecutionResult {
    request_records: Vec<SchedulerBridgeActQueueRequestExecutionRecord>,
    continuation_execution: Option<SchedulerBridgeActContinuationExecutionResult>,
}

#[allow(
    dead_code,
    reason = "crate-private scheduler-bridge act queue execution diagnostics reserved for private act workers"
)]
impl SchedulerBridgeActQueueExecutionResult {
    #[must_use]
    pub(crate) fn request_records(&self) -> &[SchedulerBridgeActQueueRequestExecutionRecord] {
        &self.request_records
    }

    #[must_use]
    pub(crate) fn continuation_execution(
        &self,
    ) -> Option<&SchedulerBridgeActContinuationExecutionResult> {
        self.continuation_execution.as_ref()
    }

    #[must_use]
    pub(crate) fn consumed_request_count(&self) -> usize {
        self.request_records
            .iter()
            .filter(|record| {
                !record.rejected_unqueued_request() && !record.rejected_malformed_request()
            })
            .count()
    }

    #[must_use]
    pub(crate) fn rejected_request_count(&self) -> usize {
        self.request_records
            .iter()
            .filter(|record| {
                record.rejected_unqueued_request() || record.rejected_malformed_request()
            })
            .count()
    }

    #[must_use]
    pub(crate) fn executed_render_callback_count(&self) -> usize {
        self.request_records
            .iter()
            .filter(|record| record.did_execute_accepted_render_callback())
            .count()
    }

    #[must_use]
    pub(crate) fn did_consume_queued_act_requests(&self) -> bool {
        !self.request_records.is_empty()
            && self.request_records.iter().all(|record| {
                !record.rejected_unqueued_request()
                    && !record.rejected_malformed_request()
                    && !record.drains_public_react_act_queue()
                    && !record.public_act_compatibility_claimed()
                    && !record.public_root_compatibility_claimed()
                    && !record.public_scheduler_timing_compatibility_claimed()
                    && !record.executes_effects()
            })
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn did_execute_accepted_render_callbacks(&self) -> bool {
        self.executed_render_callback_count() > 0
            && self
                .request_records
                .iter()
                .filter(|record| record.did_execute_accepted_render_callback())
                .all(|record| record.accepted_root_scheduler_execution_evidence_for_canary())
    }

    #[must_use]
    pub(crate) fn did_execute_accepted_internal_act_continuations(&self) -> bool {
        self.continuation_execution
            .as_ref()
            .is_some_and(SchedulerBridgeActContinuationExecutionResult::did_execute_accepted_internal_act_continuations)
    }

    #[must_use]
    pub(crate) fn records_preserve_act_queue_order(&self) -> bool {
        self.request_records
            .iter()
            .enumerate()
            .all(|(order, record)| record.execution_order() == order)
            && self
                .request_records
                .windows(2)
                .all(|records| records[0].queue_order() <= records[1].queue_order())
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn routed_private_act_queue_requests_and_continuations_for_canary(&self) -> bool {
        self.did_consume_queued_act_requests()
            && self.records_preserve_act_queue_order()
            && self.did_execute_accepted_render_callbacks()
            && self
                .continuation_execution
                .as_ref()
                .is_none_or(|execution| {
                    execution.did_execute_accepted_internal_act_continuations()
                        && execution.records_preserve_sync_flush_order()
                        && !execution.drains_public_react_act_queue()
                        && !execution.public_act_compatibility_claimed()
                        && !execution.public_flush_sync_compatibility_claimed()
                        && !execution.public_scheduler_timing_compatibility_claimed()
                        && !execution.executes_effects()
                })
            && !self.drains_public_react_act_queue()
            && !self.public_act_compatibility_claimed()
            && !self.public_root_compatibility_claimed()
            && !self.public_flush_sync_compatibility_claimed()
            && !self.public_scheduler_timing_compatibility_claimed()
            && !self.executes_effects()
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
    pub(crate) const fn public_root_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_timing_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_effects(&self) -> bool {
        false
    }
}

pub(crate) fn sync_flush_act_continuation_lanes_for_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<Lanes, RootSchedulerError> {
    Ok(select_lanes_for_scheduled_task(store, root_id)?.render_lanes())
}

pub(crate) fn sync_flush_act_post_passive_continuation_gate(
    act_continuation: Option<SchedulerActContinuationRecord>,
    pending_passive_handoff: Option<PendingPassiveCommitHandoff>,
) -> Option<SyncFlushActPostPassiveContinuationGateRecord> {
    let (Some(act_continuation), Some(pending_passive_handoff)) =
        (act_continuation, pending_passive_handoff)
    else {
        return None;
    };

    Some(SyncFlushActPostPassiveContinuationGateRecord {
        root: act_continuation.root(),
        sync_flush_order: act_continuation.sync_flush_order(),
        flushed_lanes: act_continuation.flushed_lanes(),
        remaining_lanes: act_continuation.remaining_lanes(),
        continuation_lanes: act_continuation.continuation_lanes(),
        pending_passive_finished_work: pending_passive_handoff.finished_work(),
        pending_passive_lanes: pending_passive_handoff.lanes(),
        pending_passive_unmount_count: pending_passive_handoff.pending_unmount_count(),
        pending_passive_mount_count: pending_passive_handoff.pending_mount_count(),
        act_scope_depth: act_continuation.act_scope_depth(),
        nested_act_scope: act_continuation.nested_act_scope(),
    })
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush/act canary drain helper is exercised by tests and reserved for private act workers"
)]
pub(crate) fn sync_flush_act_continuation_drain_record_after_host_output_canary(
    act_continuation: SchedulerActContinuationRecord,
    host_output_canary_committed: bool,
) -> Option<SyncFlushActContinuationDrainRecord> {
    let record = SyncFlushActContinuationDrainRecord {
        root: act_continuation.root(),
        sync_flush_order: act_continuation.sync_flush_order(),
        flushed_lanes: act_continuation.flushed_lanes(),
        remaining_lanes: act_continuation.remaining_lanes(),
        continuation_lanes: act_continuation.continuation_lanes(),
        act_scope_depth: act_continuation.act_scope_depth(),
        nested_act_scope: act_continuation.nested_act_scope(),
        source_status: act_continuation.status(),
        host_output_canary_committed,
    };

    record
        .is_accepted_internal_act_continuation()
        .then_some(record)
}

pub(crate) fn execute_scheduler_bridge_act_continuations<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    continuations: &[SyncFlushActContinuationDrainRecord],
) -> Result<
    SchedulerBridgeActContinuationExecutionResult,
    SchedulerBridgeActContinuationExecutionError,
> {
    let mut records = Vec::with_capacity(continuations.len());
    for (execution_order, continuation) in continuations.iter().enumerate() {
        records.push(execute_scheduler_bridge_act_continuation(
            store,
            execution_order,
            *continuation,
        )?);
    }

    Ok(SchedulerBridgeActContinuationExecutionResult { records })
}

fn execute_scheduler_bridge_act_continuation<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    execution_order: usize,
    continuation: SyncFlushActContinuationDrainRecord,
) -> Result<
    SchedulerBridgeActContinuationExecutionRecord,
    SchedulerBridgeActContinuationExecutionError,
> {
    if !continuation.is_accepted_internal_act_continuation() {
        return Ok(scheduler_bridge_act_continuation_execution_record(
            continuation,
            execution_order,
            Lanes::NO,
            Lanes::NO,
            Lanes::NO,
            SchedulerBridgeActContinuationExecutionStatus::RejectedContinuation,
            None,
            None,
        ));
    }

    #[cfg(test)]
    if !store
        .scheduler_bridge()
        .act_continuation_records()
        .iter()
        .copied()
        .any(|source| continuation.matches_source_act_continuation(source))
    {
        return Ok(scheduler_bridge_act_continuation_execution_record(
            continuation,
            execution_order,
            Lanes::NO,
            Lanes::NO,
            Lanes::NO,
            SchedulerBridgeActContinuationExecutionStatus::RejectedContinuation,
            None,
            None,
        ));
    }

    let pending_lanes_before_execution = store
        .root(continuation.root())
        .map_err(RootSchedulerError::from)?
        .lanes()
        .pending_lanes();
    let selected_lanes = sync_flush_act_continuation_lanes_for_root(store, continuation.root())?;
    if selected_lanes.is_empty() {
        return Ok(scheduler_bridge_act_continuation_execution_record(
            continuation,
            execution_order,
            selected_lanes,
            pending_lanes_before_execution,
            pending_lanes_before_execution,
            SchedulerBridgeActContinuationExecutionStatus::NoContinuationWork,
            None,
            None,
        ));
    }

    if selected_lanes != continuation.continuation_lanes() {
        return Ok(scheduler_bridge_act_continuation_execution_record(
            continuation,
            execution_order,
            selected_lanes,
            pending_lanes_before_execution,
            pending_lanes_before_execution,
            SchedulerBridgeActContinuationExecutionStatus::BlockedByLaneMismatch,
            None,
            None,
        ));
    }

    let render_phase = render_host_root_for_lanes(store, continuation.root(), selected_lanes)
        .map_err(RootSchedulerError::from)?;
    #[cfg(test)]
    let root_commit_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            store,
            render_phase,
            continuation.sync_flush_order(),
            continuation.sync_flush_order().saturating_add(1),
        )?;
    #[cfg(test)]
    let commit = root_commit_handoff.commit().clone();
    #[cfg(not(test))]
    let commit = crate::commit_finished_host_root(store, render_phase)?;
    recompute_might_have_pending_sync_work(store)?;
    let pending_lanes_after_execution = store
        .root(continuation.root())
        .map_err(RootSchedulerError::from)?
        .lanes()
        .pending_lanes();

    let record = scheduler_bridge_act_continuation_execution_record(
        continuation,
        execution_order,
        selected_lanes,
        pending_lanes_before_execution,
        pending_lanes_after_execution,
        SchedulerBridgeActContinuationExecutionStatus::RenderedAndCommitted,
        Some(render_phase),
        Some(commit),
    );
    #[cfg(test)]
    let record = {
        let mut record = record;
        record.root_commit_handoff = Some(root_commit_handoff);
        record
    };

    Ok(record)
}

#[allow(
    clippy::too_many_arguments,
    reason = "private scheduler continuation evidence record mirrors the canary assertion shape"
)]
fn scheduler_bridge_act_continuation_execution_record(
    continuation: SyncFlushActContinuationDrainRecord,
    execution_order: usize,
    selected_lanes: Lanes,
    pending_lanes_before_execution: Lanes,
    pending_lanes_after_execution: Lanes,
    status: SchedulerBridgeActContinuationExecutionStatus,
    render_phase: Option<HostRootRenderPhaseRecord>,
    commit: Option<HostRootCommitRecord>,
) -> SchedulerBridgeActContinuationExecutionRecord {
    SchedulerBridgeActContinuationExecutionRecord {
        continuation,
        execution_order,
        selected_lanes,
        pending_lanes_before_execution,
        pending_lanes_after_execution,
        status,
        render_phase,
        commit,
        #[cfg(test)]
        root_commit_handoff: None,
    }
}

#[allow(
    dead_code,
    reason = "crate-private scheduler-bridge act queue execution is exercised by private act canaries"
)]
pub(crate) fn execute_scheduler_bridge_act_queue_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    current_time: LaneTimestamp,
    continuations: &[SyncFlushActContinuationDrainRecord],
) -> Result<SchedulerBridgeActQueueExecutionResult, SchedulerBridgeActQueueExecutionError> {
    let mut request_records = Vec::new();
    let continuation_execution = if continuations.is_empty() {
        None
    } else {
        Some(execute_scheduler_bridge_act_continuations(
            store,
            continuations,
        )?)
    };

    while let Some(request) = store
        .scheduler_bridge_mut()
        .consume_next_act_queue_request()
    {
        let execution_order = request_records.len();
        request_records.push(execute_scheduler_bridge_act_queue_request_for_canary(
            store,
            execution_order,
            current_time,
            request,
        )?);
    }

    Ok(SchedulerBridgeActQueueExecutionResult {
        request_records,
        continuation_execution,
    })
}

#[allow(
    dead_code,
    reason = "crate-private scheduler-bridge act queue execution is exercised by private act canaries"
)]
pub(crate) fn execute_scheduler_bridge_act_queue_request_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    execution_order: usize,
    current_time: LaneTimestamp,
    request: SchedulerActQueueRequest,
) -> Result<SchedulerBridgeActQueueRequestExecutionRecord, SchedulerBridgeActQueueExecutionError> {
    if !scheduler_bridge_act_queue_request_is_recorded(store, request) {
        return Ok(scheduler_bridge_act_queue_request_execution_record(
            request,
            execution_order,
            SchedulerBridgeActQueueRequestExecutionStatus::RejectedUnqueuedRequest,
            None,
            None,
        ));
    }

    match request.kind() {
        SchedulerActQueueTaskKind::RootSchedule => {
            if request.node().is_some()
                || request.root().is_some()
                || request.scheduler_priority().is_some()
                || request.callback_priority() != RootCallbackPriority::NO
            {
                return Ok(scheduler_bridge_act_queue_request_execution_record(
                    request,
                    execution_order,
                    SchedulerBridgeActQueueRequestExecutionStatus::RejectedMalformedRequest,
                    None,
                    None,
                ));
            }

            let root_schedule = process_root_schedule_in_microtask(store)?;
            Ok(scheduler_bridge_act_queue_request_execution_record(
                request,
                execution_order,
                SchedulerBridgeActQueueRequestExecutionStatus::RootScheduleProcessed,
                Some(root_schedule),
                None,
            ))
        }
        SchedulerActQueueTaskKind::RenderCallback => {
            let Some(root) = request.root() else {
                return Ok(scheduler_bridge_act_queue_request_execution_record(
                    request,
                    execution_order,
                    SchedulerBridgeActQueueRequestExecutionStatus::RejectedMalformedRequest,
                    None,
                    None,
                ));
            };

            if !SchedulerBridge::is_fake_act_callback_node(request.node())
                || request.scheduler_priority().is_none()
                || request.callback_priority() == RootCallbackPriority::NO
            {
                return Ok(scheduler_bridge_act_queue_request_execution_record(
                    request,
                    execution_order,
                    SchedulerBridgeActQueueRequestExecutionStatus::RejectedMalformedRequest,
                    None,
                    None,
                ));
            }

            let render_callback =
                execute_expired_lane_sync_scheduler_continuation_for_root_for_canary(
                    store,
                    root,
                    current_time,
                    request.node(),
                )?;
            let status =
                scheduler_bridge_act_queue_render_callback_status(render_callback.status());

            Ok(scheduler_bridge_act_queue_request_execution_record(
                request,
                execution_order,
                status,
                None,
                Some(render_callback),
            ))
        }
    }
}

fn scheduler_bridge_act_queue_request_is_recorded<H: HostTypes>(
    store: &FiberRootStore<H>,
    request: SchedulerActQueueRequest,
) -> bool {
    store
        .scheduler_bridge()
        .act_queue_requests()
        .get(request.queue_order())
        .is_some_and(|recorded| *recorded == request)
}

fn scheduler_bridge_act_queue_render_callback_status(
    status: RootExpiredLaneSyncSchedulerContinuationStatus,
) -> SchedulerBridgeActQueueRequestExecutionStatus {
    match status {
        RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode => {
            SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackStaleCallbackNode
        }
        RootExpiredLaneSyncSchedulerContinuationStatus::NoExpiredLanes => {
            SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackNoExpiredLanes
        }
        RootExpiredLaneSyncSchedulerContinuationStatus::NoExpiredWorkSelected => {
            SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackNoExpiredWorkSelected
        }
        RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByPendingPassive => {
            SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackBlockedByPendingPassive
        }
        RootExpiredLaneSyncSchedulerContinuationStatus::NoContinuationWork => {
            SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackNoContinuationWork
        }
        RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByLaneMismatch => {
            SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackBlockedByLaneMismatch
        }
        RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByFinishedWorkHandoffMismatch => {
            SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackBlockedByFinishedWorkHandoffMismatch
        }
        RootExpiredLaneSyncSchedulerContinuationStatus::RenderedAndCommitted => {
            SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackRenderedAndCommitted
        }
    }
}

fn scheduler_bridge_act_queue_request_execution_record(
    request: SchedulerActQueueRequest,
    execution_order: usize,
    status: SchedulerBridgeActQueueRequestExecutionStatus,
    root_schedule: Option<RootScheduleMicrotaskResult>,
    render_callback: Option<RootExpiredLaneSyncSchedulerContinuationRecord>,
) -> SchedulerBridgeActQueueRequestExecutionRecord {
    SchedulerBridgeActQueueRequestExecutionRecord {
        request,
        execution_order,
        status,
        root_schedule,
        render_callback,
    }
}
