//! Internal FiberRoot scheduler foundation.
//!
//! This module models the React-style scheduled-root list and per-root
//! callback bookkeeping on top of HostRoot update records. Most scheduler
//! helpers remain planning-only; the public sync-flush record path may render
//! HostRoot lanes for a later commit handoff, while one crate-private sync
//! continuation can consume an accepted handoff without opening broad
//! scheduler compatibility, passive effects, or public host containers.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    EventPriority, FiberId, FiberTag, Lane, LaneTimestamp, Lanes, RootLaneState, UpdateQueueHandle,
    lanes_to_event_priority,
};
use fast_react_host_config::HostTypes;

use crate::begin_work::UnsupportedSuspenseChildShapeRecord;
use crate::concurrent_updates::{mark_update_lane_from_fiber_to_root, root_for_updated_fiber};
use crate::root_commit::{HostRootCommitRecord, PendingPassiveCommitHandoff};
#[cfg(test)]
use crate::root_commit::{
    HostRootFinishedWorkCommitHandoffErrorForCanary,
    HostRootFinishedWorkCommitHandoffRecordForCanary,
    commit_completed_host_root_render_with_finished_work_handoff_for_canary,
    commit_finished_host_root_with_finished_work_handoff_for_canary,
    record_host_root_finished_work_pending_commit_for_canary,
};
use crate::root_config::{RootErrorOptionCallbackPhase, RootErrorOptionCallbackRecord};
use crate::root_updates::validate_update_container_lane_diagnostics_for_canary;
use crate::scheduler_bridge::{
    SchedulerActContinuationRecord, SchedulerActContinuationStatus,
    SchedulerPassiveEffectsFlushRequest,
};
use crate::{
    ConcurrentUpdateError, ExecutionContextState, FiberRootId, FiberRootStore, FiberRootStoreError,
    HostRootRenderPhaseRecord, RootCallbackPriority, RootCommitError, RootErrorCallbackHandle,
    RootRecoverableErrorCallbackHandle, RootRenderExitStatus, RootScheduleUpdateRecord,
    RootSchedulerCallbackHandle, RootTransitionEntanglementRecord, RootUpdateError,
    RootUpdateLaneSourcePriority, RootWorkLoopError, SchedulerActQueueRequest,
    SchedulerActQueueTaskKind, SchedulerBridge, SchedulerCallbackRequest,
    SchedulerCallbackValidationRecord, SchedulerCancellationRecord, SchedulerMicrotaskKind,
    SchedulerMicrotaskRequest, SchedulerPriority, SyncFlushExecutionContextRecord,
    UpdateContainerResult, UpdateId, render_host_root_for_lanes,
    render_host_root_via_scheduler_callback, validate_scheduled_host_root_callback,
};

pub(crate) const SYNC_FLUSH_LANES: Lanes = Lanes::SYNC_HYDRATION.merge(Lanes::SYNC);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootErrorCaptureSource {
    PassiveEffectDestroy,
    PassiveEffectMountCreate,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootErrorCaptureScheduleRecord {
    source: RootErrorCaptureSource,
    root: FiberRootId,
    root_fiber: FiberId,
    source_fiber: FiberId,
    lane: Lane,
    pending_lanes_before: Lanes,
    pending_lanes_after: Lanes,
    scheduled_root: ScheduledRootUpdateResult,
    error_option_callbacks: RootErrorOptionCallbackRecord,
}

#[allow(
    dead_code,
    reason = "crate-private root error capture metadata is reserved for passive error workers"
)]
impl RootErrorCaptureScheduleRecord {
    #[must_use]
    pub(crate) const fn source(self) -> RootErrorCaptureSource {
        self.source
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn root_fiber(self) -> FiberId {
        self.root_fiber
    }

    #[must_use]
    pub(crate) const fn source_fiber(self) -> FiberId {
        self.source_fiber
    }

    #[must_use]
    pub(crate) const fn lane(self) -> Lane {
        self.lane
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before(self) -> Lanes {
        self.pending_lanes_before
    }

    #[must_use]
    pub(crate) const fn pending_lanes_after(self) -> Lanes {
        self.pending_lanes_after
    }

    #[must_use]
    pub(crate) const fn scheduled_root(self) -> ScheduledRootUpdateResult {
        self.scheduled_root
    }

    #[must_use]
    pub(crate) const fn error_option_callbacks(self) -> RootErrorOptionCallbackRecord {
        self.error_option_callbacks
    }

    #[must_use]
    pub(crate) const fn on_uncaught_error(self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_uncaught_error()
    }

    #[must_use]
    pub(crate) const fn on_caught_error(self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_caught_error()
    }

    #[must_use]
    pub(crate) const fn on_recoverable_error(self) -> RootRecoverableErrorCallbackHandle {
        self.error_option_callbacks.on_recoverable_error()
    }

    #[must_use]
    pub(crate) const fn root_error_update_scheduled(self) -> bool {
        self.pending_lanes_after.contains_lane(self.lane)
            && self.scheduled_root.root().raw() == self.root.raw()
            && self.scheduled_root.might_have_pending_sync_work()
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_error_aggregation_enabled(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn has_configured_error_callback(self) -> bool {
        self.error_option_callbacks.has_configured_error_callback()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootSchedulerState {
    first_scheduled_root: Option<FiberRootId>,
    last_scheduled_root: Option<FiberRootId>,
    did_schedule_microtask: bool,
    did_schedule_microtask_act: bool,
    might_have_pending_sync_work: bool,
    is_flushing_work: bool,
    current_event_transition_lane: Lane,
}

impl RootSchedulerState {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            first_scheduled_root: None,
            last_scheduled_root: None,
            did_schedule_microtask: false,
            did_schedule_microtask_act: false,
            might_have_pending_sync_work: false,
            is_flushing_work: false,
            current_event_transition_lane: Lane::NO,
        }
    }

    #[must_use]
    pub const fn first_scheduled_root(&self) -> Option<FiberRootId> {
        self.first_scheduled_root
    }

    #[must_use]
    pub const fn last_scheduled_root(&self) -> Option<FiberRootId> {
        self.last_scheduled_root
    }

    #[must_use]
    pub const fn did_schedule_microtask(&self) -> bool {
        self.did_schedule_microtask
    }

    #[must_use]
    pub const fn did_schedule_microtask_act(&self) -> bool {
        self.did_schedule_microtask_act
    }

    #[must_use]
    pub const fn might_have_pending_sync_work(&self) -> bool {
        self.might_have_pending_sync_work
    }

    #[must_use]
    pub const fn is_flushing_work(&self) -> bool {
        self.is_flushing_work
    }

    #[must_use]
    pub const fn current_event_transition_lane(&self) -> Lane {
        self.current_event_transition_lane
    }

    pub(crate) fn set_first_scheduled_root(&mut self, root: Option<FiberRootId>) {
        self.first_scheduled_root = root;
    }

    pub(crate) fn set_last_scheduled_root(&mut self, root: Option<FiberRootId>) {
        self.last_scheduled_root = root;
    }

    pub(crate) fn mark_microtask_scheduled(&mut self) {
        self.did_schedule_microtask = true;
    }

    pub(crate) fn mark_act_microtask_scheduled(&mut self) {
        self.did_schedule_microtask_act = true;
    }

    pub(crate) fn reset_microtask_scheduled(&mut self) {
        self.did_schedule_microtask = false;
        self.did_schedule_microtask_act = false;
    }

    pub(crate) fn set_might_have_pending_sync_work(&mut self, value: bool) {
        self.might_have_pending_sync_work = value;
    }

    pub(crate) fn set_is_flushing_work(&mut self, value: bool) {
        self.is_flushing_work = value;
    }

    fn set_current_event_transition_lane(&mut self, lane: Lane) {
        self.current_event_transition_lane = lane;
    }
}

impl Default for RootSchedulerState {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ScheduledRootUpdateResult {
    root: FiberRootId,
    inserted: bool,
    microtask: Option<SchedulerMicrotaskRequest>,
    act_queue_task: Option<SchedulerActQueueRequest>,
    might_have_pending_sync_work: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootRescheduleRequestRecord {
    root: FiberRootId,
    fiber: FiberId,
    lane: Lane,
}

impl RootRescheduleRequestRecord {
    #[must_use]
    pub(crate) const fn new(root: FiberRootId, fiber: FiberId, lane: Lane) -> Self {
        Self { root, fiber, lane }
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn lane(self) -> Lane {
        self.lane
    }
}

impl ScheduledRootUpdateResult {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn inserted(self) -> bool {
        self.inserted
    }

    #[must_use]
    pub const fn microtask(self) -> Option<SchedulerMicrotaskRequest> {
        self.microtask
    }

    #[must_use]
    pub const fn act_queue_task(self) -> Option<SchedulerActQueueRequest> {
        self.act_queue_task
    }

    #[must_use]
    pub const fn might_have_pending_sync_work(self) -> bool {
        self.might_have_pending_sync_work
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootTransitionLaneSchedulerRequestRecord {
    root: FiberRootId,
    fiber: FiberId,
    update: UpdateId,
    queue: UpdateQueueHandle,
    lane: Lane,
    event_priority: EventPriority,
    pending_lanes_before_enqueue: Lanes,
    pending_lanes_after_enqueue: Lanes,
    selected_next_lanes: Lanes,
    entangled_lanes: Lanes,
    current_event_transition_lane_before: Lane,
    current_event_transition_lane_after: Lane,
    scheduled_root: ScheduledRootUpdateResult,
}

#[allow(
    dead_code,
    reason = "crate-private transition lane scheduler diagnostics are reserved for root scheduler canaries"
)]
impl RootTransitionLaneSchedulerRequestRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn update(self) -> UpdateId {
        self.update
    }

    #[must_use]
    pub(crate) const fn queue(self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub(crate) const fn lane(self) -> Lane {
        self.lane
    }

    #[must_use]
    pub(crate) const fn event_priority(self) -> EventPriority {
        self.event_priority
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before_enqueue(self) -> Lanes {
        self.pending_lanes_before_enqueue
    }

    #[must_use]
    pub(crate) const fn pending_lanes_after_enqueue(self) -> Lanes {
        self.pending_lanes_after_enqueue
    }

    #[must_use]
    pub(crate) const fn selected_next_lanes(self) -> Lanes {
        self.selected_next_lanes
    }

    #[must_use]
    pub(crate) const fn entangled_lanes(self) -> Lanes {
        self.entangled_lanes
    }

    #[must_use]
    pub(crate) const fn current_event_transition_lane_before(self) -> Lane {
        self.current_event_transition_lane_before
    }

    #[must_use]
    pub(crate) const fn current_event_transition_lane_after(self) -> Lane {
        self.current_event_transition_lane_after
    }

    #[must_use]
    pub(crate) const fn scheduled_root(self) -> ScheduledRootUpdateResult {
        self.scheduled_root
    }

    #[must_use]
    pub(crate) const fn routed_to_private_root_scheduler(self) -> bool {
        self.scheduled_root.root().raw() == self.root.raw()
            && self.current_event_transition_lane_after.bits() == self.lane.bits()
            && self.scheduled_root.might_have_pending_sync_work()
    }

    #[must_use]
    pub(crate) const fn callback_execution_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_update_scheduling_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_scheduler_compatibility_claimed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RootTaskScheduleOutcome {
    NoWork,
    Sync,
    Scheduled,
    Reused,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootTaskScheduleRecord {
    root: FiberRootId,
    next_lanes: Lanes,
    outcome: RootTaskScheduleOutcome,
    callback_priority: RootCallbackPriority,
    callback_node: RootSchedulerCallbackHandle,
    scheduler_priority: Option<SchedulerPriority>,
    scheduled_callback: Option<SchedulerCallbackRequest>,
    scheduled_act_queue_task: Option<SchedulerActQueueRequest>,
    canceled_callback: Option<SchedulerCancellationRecord>,
}

impl RootTaskScheduleRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn next_lanes(self) -> Lanes {
        self.next_lanes
    }

    #[must_use]
    pub const fn outcome(self) -> RootTaskScheduleOutcome {
        self.outcome
    }

    #[must_use]
    pub const fn callback_priority(self) -> RootCallbackPriority {
        self.callback_priority
    }

    #[must_use]
    pub const fn callback_node(self) -> RootSchedulerCallbackHandle {
        self.callback_node
    }

    #[must_use]
    pub const fn scheduler_priority(self) -> Option<SchedulerPriority> {
        self.scheduler_priority
    }

    #[must_use]
    pub const fn scheduled_callback(self) -> Option<SchedulerCallbackRequest> {
        self.scheduled_callback
    }

    #[must_use]
    pub const fn scheduled_act_queue_task(self) -> Option<SchedulerActQueueRequest> {
        self.scheduled_act_queue_task
    }

    #[must_use]
    pub const fn canceled_callback(self) -> Option<SchedulerCancellationRecord> {
        self.canceled_callback
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectSchedulerFlushGateStatus {
    NoPendingPassive,
    Scheduled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectSchedulerFlushGateRecord {
    root: FiberRootId,
    finished_work: Option<FiberId>,
    lanes: Lanes,
    pending_unmount_count: usize,
    pending_mount_count: usize,
    scheduler_request: Option<SchedulerPassiveEffectsFlushRequest>,
}

#[allow(
    dead_code,
    reason = "crate-private passive scheduler flush gate metadata is reserved for passive-effect workers"
)]
impl PassiveEffectSchedulerFlushGateRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn pending_unmount_count(self) -> usize {
        self.pending_unmount_count
    }

    #[must_use]
    pub(crate) const fn pending_mount_count(self) -> usize {
        self.pending_mount_count
    }

    #[must_use]
    pub(crate) const fn pending_record_count(self) -> usize {
        self.pending_unmount_count + self.pending_mount_count
    }

    #[must_use]
    pub(crate) const fn scheduler_request(self) -> Option<SchedulerPassiveEffectsFlushRequest> {
        self.scheduler_request
    }

    #[must_use]
    pub(crate) const fn status(self) -> PassiveEffectSchedulerFlushGateStatus {
        match self.scheduler_request {
            Some(_) => PassiveEffectSchedulerFlushGateStatus::Scheduled,
            None => PassiveEffectSchedulerFlushGateStatus::NoPendingPassive,
        }
    }

    #[must_use]
    pub(crate) const fn did_schedule_scheduler_flush_request(self) -> bool {
        matches!(
            self.status(),
            PassiveEffectSchedulerFlushGateStatus::Scheduled
        )
    }

    #[must_use]
    pub(crate) const fn executes_public_effects(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_package_behavior_changed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct RootLaneSelection {
    priority_lanes: Lanes,
    render_lanes: Lanes,
}

impl RootLaneSelection {
    #[must_use]
    const fn no_work() -> Self {
        Self {
            priority_lanes: Lanes::NO,
            render_lanes: Lanes::NO,
        }
    }

    #[must_use]
    const fn priority_lanes(self) -> Lanes {
        self.priority_lanes
    }

    #[must_use]
    const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootScheduleMicrotaskResult {
    records: Vec<RootTaskScheduleRecord>,
}

impl RootScheduleMicrotaskResult {
    #[must_use]
    pub fn records(&self) -> &[RootTaskScheduleRecord] {
        &self.records
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RootSchedulerCallbackExecutionStatus {
    StaleCallback,
    NoWork,
    Rendered,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootSchedulerCallbackExecutionRecord {
    callback: SchedulerCallbackRequest,
    validation: SchedulerCallbackValidationRecord,
    selected_lanes: Lanes,
    status: RootSchedulerCallbackExecutionStatus,
    render_phase: Option<HostRootRenderPhaseRecord>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootRenderErrorOptionCallbackRecord {
    root: FiberRootId,
    render_lanes: Lanes,
    error: RootWorkLoopError,
    error_option_callbacks: RootErrorOptionCallbackRecord,
}

#[allow(
    dead_code,
    reason = "crate-private render error option metadata for future root error routing"
)]
impl RootRenderErrorOptionCallbackRecord {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn error(&self) -> &RootWorkLoopError {
        &self.error
    }

    #[must_use]
    pub(crate) const fn error_option_callbacks(&self) -> RootErrorOptionCallbackRecord {
        self.error_option_callbacks
    }

    #[must_use]
    pub(crate) const fn on_uncaught_error(&self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_uncaught_error()
    }

    #[must_use]
    pub(crate) const fn on_caught_error(&self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_caught_error()
    }

    #[must_use]
    pub(crate) const fn on_recoverable_error(&self) -> RootRecoverableErrorCallbackHandle {
        self.error_option_callbacks.on_recoverable_error()
    }

    #[must_use]
    pub(crate) const fn has_configured_error_callback(&self) -> bool {
        self.error_option_callbacks.has_configured_error_callback()
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_error_boundaries_enabled(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn recoverable_error_compatibility_claimed(&self) -> bool {
        false
    }
}

impl RootSchedulerCallbackExecutionRecord {
    #[must_use]
    pub const fn callback(self) -> SchedulerCallbackRequest {
        self.callback
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.callback.root()
    }

    #[must_use]
    pub const fn callback_node(self) -> RootSchedulerCallbackHandle {
        self.callback.node()
    }

    #[must_use]
    pub const fn validation(self) -> SchedulerCallbackValidationRecord {
        self.validation
    }

    #[must_use]
    pub const fn selected_lanes(self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub const fn status(self) -> RootSchedulerCallbackExecutionStatus {
        self.status
    }

    #[must_use]
    pub const fn render_phase(self) -> Option<HostRootRenderPhaseRecord> {
        self.render_phase
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootPingedRetryExecutionStatus {
    StaleCallback,
    NoWork,
    NoPingedRetryWork,
    RejectedSuspenseRetryRequest,
    StaleThenableBlocker,
    Rendered,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootPingedRetryExecutionRecord {
    callback: SchedulerCallbackRequest,
    validation: SchedulerCallbackValidationRecord,
    pinged_retry_lanes: Lanes,
    selected_priority_lanes: Lanes,
    selected_render_lanes: Lanes,
    status: RootPingedRetryExecutionStatus,
    render_phase: Option<HostRootRenderPhaseRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private ping/retry execution metadata for future Suspense retry workers"
)]
impl RootPingedRetryExecutionRecord {
    #[must_use]
    pub(crate) const fn callback(self) -> SchedulerCallbackRequest {
        self.callback
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.callback.root()
    }

    #[must_use]
    pub(crate) const fn callback_node(self) -> RootSchedulerCallbackHandle {
        self.callback.node()
    }

    #[must_use]
    pub(crate) const fn validation(self) -> SchedulerCallbackValidationRecord {
        self.validation
    }

    #[must_use]
    pub(crate) const fn pinged_retry_lanes(self) -> Lanes {
        self.pinged_retry_lanes
    }

    #[must_use]
    pub(crate) const fn selected_priority_lanes(self) -> Lanes {
        self.selected_priority_lanes
    }

    #[must_use]
    pub(crate) const fn selected_render_lanes(self) -> Lanes {
        self.selected_render_lanes
    }

    #[must_use]
    pub(crate) const fn status(self) -> RootPingedRetryExecutionStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn render_phase(self) -> Option<HostRootRenderPhaseRecord> {
        self.render_phase
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SuspenseThenableRetryRootSchedulerStatus {
    Accepted,
    RejectedUnacceptedRecord,
    RejectedOffscreenOnlyRecord,
    RejectedStaleBoundary,
    RejectedIncompatibleLaneSet,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SuspenseThenableRetrySchedulerCallbackBlocker {
    SuspenseBoundaryRendering,
    FallbackTraversal,
    WakeableSubscription,
    PublicSuspenseCompatibility,
}

pub(crate) const SUSPENSE_THENABLE_RETRY_SCHEDULER_CALLBACK_BLOCKERS:
    [SuspenseThenableRetrySchedulerCallbackBlocker; 4] = [
    SuspenseThenableRetrySchedulerCallbackBlocker::SuspenseBoundaryRendering,
    SuspenseThenableRetrySchedulerCallbackBlocker::FallbackTraversal,
    SuspenseThenableRetrySchedulerCallbackBlocker::WakeableSubscription,
    SuspenseThenableRetrySchedulerCallbackBlocker::PublicSuspenseCompatibility,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SuspenseThenableRetryRootSchedulerRequestRecord {
    root: FiberRootId,
    boundary: FiberId,
    retry_queue: UpdateQueueHandle,
    primary_offscreen_retry_queue: Option<UpdateQueueHandle>,
    retry_lane: Lane,
    pinged_lanes: Lanes,
    root_pinged_lanes_before: Lanes,
    root_pinged_lanes_after: Lanes,
    status: SuspenseThenableRetryRootSchedulerStatus,
    scheduled_root: Option<ScheduledRootUpdateResult>,
    scheduler_callback_blockers: &'static [SuspenseThenableRetrySchedulerCallbackBlocker; 4],
}

#[allow(
    dead_code,
    reason = "crate-private Suspense retry scheduler metadata is reserved for future Suspense workers"
)]
impl SuspenseThenableRetryRootSchedulerRequestRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn boundary(self) -> FiberId {
        self.boundary
    }

    #[must_use]
    pub(crate) const fn retry_queue(self) -> UpdateQueueHandle {
        self.retry_queue
    }

    #[must_use]
    pub(crate) const fn primary_offscreen_retry_queue(self) -> Option<UpdateQueueHandle> {
        self.primary_offscreen_retry_queue
    }

    #[must_use]
    pub(crate) const fn retry_lane(self) -> Lane {
        self.retry_lane
    }

    #[must_use]
    pub(crate) const fn pinged_lanes(self) -> Lanes {
        self.pinged_lanes
    }

    #[must_use]
    pub(crate) const fn root_pinged_lanes_before(self) -> Lanes {
        self.root_pinged_lanes_before
    }

    #[must_use]
    pub(crate) const fn root_pinged_lanes_after(self) -> Lanes {
        self.root_pinged_lanes_after
    }

    #[must_use]
    pub(crate) const fn status(self) -> SuspenseThenableRetryRootSchedulerStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn scheduled_root(self) -> Option<ScheduledRootUpdateResult> {
        self.scheduled_root
    }

    #[must_use]
    pub(crate) fn thenable_ping_scheduled_expected_retry_lane(self) -> bool {
        let expected_lanes = Lanes::from(self.retry_lane);
        let Some(scheduled_root) = self.scheduled_root else {
            return false;
        };

        self.accepted()
            && self.retry_lane.is_non_empty()
            && self.pinged_lanes == expected_lanes
            && self.pinged_lanes.includes_only_retries()
            && !self
                .root_pinged_lanes_before
                .contains_all(self.pinged_lanes)
            && self.root_pinged_lanes_after.contains_all(self.pinged_lanes)
            && scheduled_root.root() == self.root
    }

    #[must_use]
    pub(crate) const fn accepted(self) -> bool {
        matches!(
            self.status,
            SuspenseThenableRetryRootSchedulerStatus::Accepted
        )
    }

    #[must_use]
    pub(crate) const fn scheduler_callback_blockers(
        self,
    ) -> &'static [SuspenseThenableRetrySchedulerCallbackBlocker; 4] {
        self.scheduler_callback_blockers
    }

    #[must_use]
    pub(crate) const fn suspense_boundary_rendering_executed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn fallback_traversal_executed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn wakeable_subscription_performed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_suspense_compatibility_claimed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SuspenseThenableRetryRootRenderHandoffRecord {
    request: SuspenseThenableRetryRootSchedulerRequestRecord,
    execution: RootPingedRetryExecutionRecord,
}

#[allow(
    dead_code,
    reason = "crate-private Suspense retry render handoff metadata is reserved for future Suspense workers"
)]
impl SuspenseThenableRetryRootRenderHandoffRecord {
    #[must_use]
    pub(crate) const fn request(self) -> SuspenseThenableRetryRootSchedulerRequestRecord {
        self.request
    }

    #[must_use]
    pub(crate) const fn execution(self) -> RootPingedRetryExecutionRecord {
        self.execution
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.request.root()
    }

    #[must_use]
    pub(crate) const fn boundary(self) -> FiberId {
        self.request.boundary()
    }

    #[must_use]
    pub(crate) const fn retry_lane(self) -> Lane {
        self.request.retry_lane()
    }

    #[must_use]
    pub(crate) const fn pinged_lanes(self) -> Lanes {
        self.request.pinged_lanes()
    }

    #[must_use]
    pub(crate) const fn callback(self) -> SchedulerCallbackRequest {
        self.execution.callback()
    }

    #[must_use]
    pub(crate) const fn status(self) -> RootPingedRetryExecutionStatus {
        self.execution.status()
    }

    #[must_use]
    pub(crate) const fn render_phase(self) -> Option<HostRootRenderPhaseRecord> {
        self.execution.render_phase()
    }

    #[must_use]
    pub(crate) const fn scheduled_root(self) -> Option<ScheduledRootUpdateResult> {
        self.request.scheduled_root()
    }

    #[must_use]
    pub(crate) fn thenable_ping_scheduled_expected_retry_lane(self) -> bool {
        self.request.thenable_ping_scheduled_expected_retry_lane()
    }

    #[must_use]
    pub(crate) fn thenable_ping_reached_expected_retry_handoff(self) -> bool {
        self.thenable_ping_scheduled_expected_retry_lane() && self.root_work_loop_reached()
    }

    #[must_use]
    pub(crate) fn root_work_loop_reached(self) -> bool {
        let Some(render) = self.render_phase() else {
            return false;
        };

        self.request.accepted()
            && self.status() == RootPingedRetryExecutionStatus::Rendered
            && !self.execution.validation().is_stale()
            && render.root() == self.root()
            && self.execution.validation().root() == self.root()
            && self
                .execution
                .pinged_retry_lanes()
                .contains_all(self.pinged_lanes())
            && self.execution.selected_priority_lanes() == self.pinged_lanes()
            && render.render_lanes() == self.pinged_lanes()
            && self.execution.selected_render_lanes() == self.pinged_lanes()
    }

    #[must_use]
    pub(crate) fn proves_private_thenable_ping_render_handoff(self) -> bool {
        self.thenable_ping_reached_expected_retry_handoff()
            && !self.suspense_boundary_rendering_executed()
            && !self.fallback_traversal_executed()
            && !self.wakeable_subscription_performed()
            && !self.public_suspense_compatibility_claimed()
            && !self.public_root_compatibility_claimed()
    }

    #[must_use]
    pub(crate) const fn suspense_boundary_rendering_executed(self) -> bool {
        self.request.suspense_boundary_rendering_executed()
    }

    #[must_use]
    pub(crate) const fn fallback_traversal_executed(self) -> bool {
        self.request.fallback_traversal_executed()
    }

    #[must_use]
    pub(crate) const fn wakeable_subscription_performed(self) -> bool {
        self.request.wakeable_subscription_performed()
    }

    #[must_use]
    pub(crate) const fn public_suspense_compatibility_claimed(self) -> bool {
        self.request.public_suspense_compatibility_claimed()
    }

    #[must_use]
    pub(crate) const fn public_root_compatibility_claimed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootSyncFlushPlan {
    skipped_reentrant_flush: bool,
    skipped_no_sync_work: bool,
    sync_roots: Vec<FiberRootId>,
}

impl RootSyncFlushPlan {
    #[must_use]
    pub fn sync_roots(&self) -> &[FiberRootId] {
        &self.sync_roots
    }

    #[must_use]
    pub const fn skipped_reentrant_flush(&self) -> bool {
        self.skipped_reentrant_flush
    }

    #[must_use]
    pub const fn skipped_no_sync_work(&self) -> bool {
        self.skipped_no_sync_work
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RootSyncFlushExitStatus {
    BlockedByExecutionContext,
    SkippedReentrantFlush,
    SkippedNoPendingSyncWork,
    Completed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RootSyncFlushRecordStatus {
    RenderedAwaitingCommit,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootSyncFlushRecord {
    order: usize,
    root: FiberRootId,
    lanes: Lanes,
    status: RootSyncFlushRecordStatus,
    render_phase: HostRootRenderPhaseRecord,
}

impl RootSyncFlushRecord {
    #[must_use]
    pub const fn order(self) -> usize {
        self.order
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub const fn status(self) -> RootSyncFlushRecordStatus {
        self.status
    }

    #[must_use]
    pub const fn render_phase(self) -> HostRootRenderPhaseRecord {
        self.render_phase
    }
}

#[cfg(test)]
pub(crate) const fn root_sync_flush_record_for_canary(
    order: usize,
    root: FiberRootId,
    lanes: Lanes,
    render_phase: HostRootRenderPhaseRecord,
) -> RootSyncFlushRecord {
    RootSyncFlushRecord {
        order,
        root,
        lanes,
        status: RootSyncFlushRecordStatus::RenderedAwaitingCommit,
        render_phase,
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootSyncSchedulerContinuationExecutionStatus {
    StaleCallbackNode,
    BlockedByPendingPassive,
    NoSyncWork,
    BlockedByLaneMismatch,
    #[allow(
        dead_code,
        reason = "constructed by test-only finished-work handoff validation"
    )]
    BlockedByFinishedWorkHandoffMismatch,
    RenderedAndCommitted,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootExpiredLaneSyncSchedulerContinuationStatus {
    StaleCallbackNode,
    NoExpiredLanes,
    NoExpiredWorkSelected,
    BlockedByPendingPassive,
    NoContinuationWork,
    BlockedByLaneMismatch,
    #[allow(
        dead_code,
        reason = "mirrors the test-only sync continuation finished-work blocker"
    )]
    BlockedByFinishedWorkHandoffMismatch,
    RenderedAndCommitted,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootSyncSchedulerFinishedWorkHandoffIdentityForCanary {
    root: FiberRootId,
    render_phase_root: FiberRootId,
    selected_lanes: Lanes,
    previous_current: FiberId,
    current_before_commit: FiberId,
    pending_work_before_commit: Option<FiberId>,
    root_finished_work_before_commit: Option<FiberId>,
    finished_work: FiberId,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    root_finished_lanes_before_commit: Lanes,
    pending_lanes_before_commit: Lanes,
    render_phase_lanes_before_commit: Lanes,
}

#[allow(
    dead_code,
    reason = "crate-private root scheduler finished-work identity is reserved for canary continuation checks"
)]
impl RootSyncSchedulerFinishedWorkHandoffIdentityForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn render_phase_root(self) -> FiberRootId {
        self.render_phase_root
    }

    #[must_use]
    pub(crate) const fn selected_lanes(self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub(crate) const fn previous_current(self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub(crate) const fn current_before_commit(self) -> FiberId {
        self.current_before_commit
    }

    #[must_use]
    pub(crate) const fn pending_work_before_commit(self) -> Option<FiberId> {
        self.pending_work_before_commit
    }

    #[must_use]
    pub(crate) const fn root_finished_work_before_commit(self) -> Option<FiberId> {
        self.root_finished_work_before_commit
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn finished_lanes(self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn root_finished_lanes_before_commit(self) -> Lanes {
        self.root_finished_lanes_before_commit
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before_commit(self) -> Lanes {
        self.pending_lanes_before_commit
    }

    #[must_use]
    pub(crate) const fn render_phase_lanes_before_commit(self) -> Lanes {
        self.render_phase_lanes_before_commit
    }

    #[must_use]
    pub(crate) fn accepted_for_root_scheduler_commit_handoff(self) -> bool {
        self.root == self.render_phase_root
            && self.current_before_commit == self.previous_current
            && self.pending_work_before_commit == Some(self.finished_work)
            && self.root_finished_work_before_commit == Some(self.finished_work)
            && self.render_lanes == self.selected_lanes
            && self.finished_lanes == self.selected_lanes
            && self.root_finished_lanes_before_commit == self.finished_lanes
            && self.render_phase_lanes_before_commit == self.render_lanes
            && self
                .pending_lanes_before_commit
                .contains_all(self.selected_lanes)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootSyncSchedulerPendingPassiveBlockerRecord {
    root: FiberRootId,
    finished_work: Option<FiberId>,
    lanes: Lanes,
    pending_unmount_count: usize,
    pending_mount_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private sync scheduler continuation metadata is reserved for private root execution workers"
)]
impl RootSyncSchedulerPendingPassiveBlockerRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn pending_unmount_count(self) -> usize {
        self.pending_unmount_count
    }

    #[must_use]
    pub(crate) const fn pending_mount_count(self) -> usize {
        self.pending_mount_count
    }

    #[must_use]
    pub(crate) const fn pending_record_count(self) -> usize {
        self.pending_unmount_count + self.pending_mount_count
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootSyncSchedulerContinuationExecutionRecord {
    handoff: RootSyncFlushRecord,
    requested_callback_node: RootSchedulerCallbackHandle,
    current_callback_node: RootSchedulerCallbackHandle,
    selected_lanes: Lanes,
    pending_passive_blocker: Option<RootSyncSchedulerPendingPassiveBlockerRecord>,
    finished_work_handoff_identity: Option<RootSyncSchedulerFinishedWorkHandoffIdentityForCanary>,
    status: RootSyncSchedulerContinuationExecutionStatus,
    commit: Option<HostRootCommitRecord>,
    #[cfg(test)]
    root_commit_handoff: Option<HostRootFinishedWorkCommitHandoffRecordForCanary>,
}

#[allow(
    dead_code,
    reason = "crate-private sync scheduler continuation metadata is reserved for private root execution workers"
)]
impl RootSyncSchedulerContinuationExecutionRecord {
    #[must_use]
    pub(crate) const fn handoff(&self) -> RootSyncFlushRecord {
        self.handoff
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.handoff.root()
    }

    #[must_use]
    pub(crate) const fn requested_callback_node(&self) -> RootSchedulerCallbackHandle {
        self.requested_callback_node
    }

    #[must_use]
    pub(crate) const fn current_callback_node(&self) -> RootSchedulerCallbackHandle {
        self.current_callback_node
    }

    #[must_use]
    pub(crate) const fn handoff_lanes(&self) -> Lanes {
        self.handoff.lanes()
    }

    #[must_use]
    pub(crate) const fn selected_lanes(&self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub(crate) const fn pending_passive_blocker(
        &self,
    ) -> Option<RootSyncSchedulerPendingPassiveBlockerRecord> {
        self.pending_passive_blocker
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff_identity(
        &self,
    ) -> Option<RootSyncSchedulerFinishedWorkHandoffIdentityForCanary> {
        self.finished_work_handoff_identity
    }

    #[must_use]
    pub(crate) const fn status(&self) -> RootSyncSchedulerContinuationExecutionStatus {
        self.status
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
    pub(crate) const fn did_execute_private_sync_scheduler_continuation(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
        )
    }

    #[must_use]
    pub(crate) const fn rejected_stale_callback_node(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerContinuationExecutionStatus::StaleCallbackNode
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_pending_passive(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerContinuationExecutionStatus::BlockedByPendingPassive
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_lane_mismatch(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerContinuationExecutionStatus::BlockedByLaneMismatch
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_finished_work_handoff_mismatch(&self) -> bool {
        matches!(
            self.status,
            RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch
        )
    }

    #[must_use]
    pub(crate) fn consumed_accepted_render_handoff(&self) -> bool {
        self.commit.as_ref().is_some_and(|commit| {
            self.did_execute_private_sync_scheduler_continuation()
                && commit.root() == self.root()
                && commit.current() == self.handoff.render_phase().finished_work()
                && commit.finished_lanes() == self.handoff.lanes()
                && self
                    .finished_work_handoff_identity
                    .is_some_and(RootSyncSchedulerFinishedWorkHandoffIdentityForCanary::accepted_for_root_scheduler_commit_handoff)
        })
    }

    #[must_use]
    pub(crate) const fn async_callback_execution_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_update_scheduling_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_root_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_public_effects(&self) -> bool {
        false
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) fn accepted_root_scheduler_execution_evidence_for_canary(&self) -> bool {
        self.did_execute_private_sync_scheduler_continuation()
            && self.consumed_accepted_render_handoff()
            && self.selected_lanes == self.handoff.lanes()
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
            && self.async_callback_execution_blocked()
            && self.public_update_scheduling_blocked()
            && !self.public_root_compatibility_claimed()
            && !self.executes_public_effects()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootExpiredLaneSyncSchedulerContinuationRecord {
    root: FiberRootId,
    current_time: LaneTimestamp,
    requested_callback_node: RootSchedulerCallbackHandle,
    current_callback_node: RootSchedulerCallbackHandle,
    expired_lanes_before: Lanes,
    expired_lanes_after: Lanes,
    selected_priority_lanes: Lanes,
    selected_render_lanes: Lanes,
    handoff: Option<RootSyncFlushRecord>,
    continuation: Option<RootSyncSchedulerContinuationExecutionRecord>,
    status: RootExpiredLaneSyncSchedulerContinuationStatus,
}

#[allow(
    dead_code,
    reason = "crate-private expired-lane sync continuation metadata is reserved for private root execution workers"
)]
impl RootExpiredLaneSyncSchedulerContinuationRecord {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current_time(&self) -> LaneTimestamp {
        self.current_time
    }

    #[must_use]
    pub(crate) const fn requested_callback_node(&self) -> RootSchedulerCallbackHandle {
        self.requested_callback_node
    }

    #[must_use]
    pub(crate) const fn current_callback_node(&self) -> RootSchedulerCallbackHandle {
        self.current_callback_node
    }

    #[must_use]
    pub(crate) const fn expired_lanes_before(&self) -> Lanes {
        self.expired_lanes_before
    }

    #[must_use]
    pub(crate) const fn expired_lanes_after(&self) -> Lanes {
        self.expired_lanes_after
    }

    #[must_use]
    pub(crate) const fn selected_priority_lanes(&self) -> Lanes {
        self.selected_priority_lanes
    }

    #[must_use]
    pub(crate) const fn selected_render_lanes(&self) -> Lanes {
        self.selected_render_lanes
    }

    #[must_use]
    pub(crate) const fn selected_expired_lanes(&self) -> Lanes {
        self.selected_render_lanes
            .intersect(self.expired_lanes_after)
    }

    #[must_use]
    pub(crate) const fn handoff(&self) -> Option<RootSyncFlushRecord> {
        self.handoff
    }

    #[must_use]
    pub(crate) fn continuation(&self) -> Option<&RootSyncSchedulerContinuationExecutionRecord> {
        self.continuation.as_ref()
    }

    #[must_use]
    pub(crate) const fn status(&self) -> RootExpiredLaneSyncSchedulerContinuationStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn did_execute_expired_lane_sync_continuation(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::RenderedAndCommitted
        )
    }

    #[must_use]
    pub(crate) const fn rejected_stale_callback_node(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode
        )
    }

    #[must_use]
    pub(crate) const fn skipped_without_expired_lanes(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::NoExpiredLanes
        )
    }

    #[must_use]
    pub(crate) const fn skipped_by_priority_selection(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::NoExpiredWorkSelected
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_pending_passive(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByPendingPassive
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_lane_mismatch(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByLaneMismatch
        )
    }

    #[must_use]
    pub(crate) const fn blocked_by_finished_work_handoff_mismatch(&self) -> bool {
        matches!(
            self.status,
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByFinishedWorkHandoffMismatch
        )
    }

    #[must_use]
    pub(crate) fn commit(&self) -> Option<&HostRootCommitRecord> {
        self.continuation
            .as_ref()
            .and_then(|record| record.commit())
    }

    #[must_use]
    pub(crate) fn consumed_accepted_scheduler_continuation_record(&self) -> bool {
        self.continuation.as_ref().is_some_and(|record| {
            self.did_execute_expired_lane_sync_continuation()
                && record.consumed_accepted_render_handoff()
                && self
                    .handoff
                    .is_some_and(|handoff| handoff == record.handoff())
        })
    }

    #[must_use]
    pub(crate) const fn async_callback_execution_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_update_scheduling_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_root_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_public_effects(&self) -> bool {
        false
    }
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush recovery diagnostics are reserved for private error workers"
)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushRootRecoverySnapshotForCanary {
    root: FiberRootId,
    selected_lanes: Lanes,
    pending_lanes: Lanes,
    callback_node: RootSchedulerCallbackHandle,
    callback_priority: RootCallbackPriority,
    render_phase_work: Option<FiberId>,
    render_phase_lanes: Lanes,
    render_exit_status: RootRenderExitStatus,
    might_have_pending_sync_work: bool,
    is_flushing_work: bool,
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush recovery diagnostics are reserved for private error workers"
)]
impl SyncFlushRootRecoverySnapshotForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn selected_lanes(self) -> Lanes {
        self.selected_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes(self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub(crate) const fn callback_node(self) -> RootSchedulerCallbackHandle {
        self.callback_node
    }

    #[must_use]
    pub(crate) const fn callback_priority(self) -> RootCallbackPriority {
        self.callback_priority
    }

    #[must_use]
    pub(crate) const fn render_phase_work(self) -> Option<FiberId> {
        self.render_phase_work
    }

    #[must_use]
    pub(crate) const fn render_phase_lanes(self) -> Lanes {
        self.render_phase_lanes
    }

    #[must_use]
    pub(crate) const fn render_exit_status(self) -> RootRenderExitStatus {
        self.render_exit_status
    }

    #[must_use]
    pub(crate) const fn might_have_pending_sync_work(self) -> bool {
        self.might_have_pending_sync_work
    }

    #[must_use]
    pub(crate) const fn is_flushing_work(self) -> bool {
        self.is_flushing_work
    }

    #[must_use]
    pub(crate) fn preserves_lane_and_callback_metadata_from(self, before: Self) -> bool {
        self.root == before.root
            && self.selected_lanes == before.selected_lanes
            && self.pending_lanes == before.pending_lanes
            && self.callback_node == before.callback_node
            && self.callback_priority == before.callback_priority
            && self.might_have_pending_sync_work == before.might_have_pending_sync_work
    }
}

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
    root: FiberRootId,
    sync_flush_order: usize,
    flushed_lanes: Lanes,
    remaining_lanes: Lanes,
    continuation_lanes: Lanes,
    act_scope_depth: usize,
    nested_act_scope: bool,
    source_status: SchedulerActContinuationStatus,
    host_output_canary_committed: bool,
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushPostPassiveContinuationRootRecord {
    order: usize,
    root: FiberRootId,
    lanes: Lanes,
}

#[allow(
    dead_code,
    reason = "crate-private post-passive sync-flush continuation metadata for future passive workers"
)]
impl SyncFlushPostPassiveContinuationRootRecord {
    #[must_use]
    pub(crate) const fn order(self) -> usize {
        self.order
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SyncFlushPostPassiveRootErrorPropagationStatus {
    Blocked,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SyncFlushPostPassiveRootErrorPropagationBlocker {
    PassiveEffectErrorCapture,
    RootErrorUpdateScheduling,
    RootErrorCallbackInvocation,
    PublicActErrorAggregation,
}

pub(crate) const SYNC_FLUSH_POST_PASSIVE_ROOT_ERROR_PROPAGATION_BLOCKERS:
    [SyncFlushPostPassiveRootErrorPropagationBlocker; 4] = [
    SyncFlushPostPassiveRootErrorPropagationBlocker::PassiveEffectErrorCapture,
    SyncFlushPostPassiveRootErrorPropagationBlocker::RootErrorUpdateScheduling,
    SyncFlushPostPassiveRootErrorPropagationBlocker::RootErrorCallbackInvocation,
    SyncFlushPostPassiveRootErrorPropagationBlocker::PublicActErrorAggregation,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushPostPassiveRootErrorPropagationRecord {
    root: FiberRootId,
    error_option_callbacks: RootErrorOptionCallbackRecord,
}

#[allow(
    dead_code,
    reason = "crate-private post-passive root-error blocker metadata for future passive workers"
)]
impl SyncFlushPostPassiveRootErrorPropagationRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn error_option_callbacks(self) -> RootErrorOptionCallbackRecord {
        self.error_option_callbacks
    }

    #[must_use]
    pub(crate) const fn on_uncaught_error(self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_uncaught_error()
    }

    #[must_use]
    pub(crate) const fn on_caught_error(self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_caught_error()
    }

    #[must_use]
    pub(crate) const fn on_recoverable_error(self) -> RootRecoverableErrorCallbackHandle {
        self.error_option_callbacks.on_recoverable_error()
    }

    #[must_use]
    pub(crate) const fn status(self) -> SyncFlushPostPassiveRootErrorPropagationStatus {
        SyncFlushPostPassiveRootErrorPropagationStatus::Blocked
    }

    #[must_use]
    pub(crate) const fn blockers(
        self,
    ) -> &'static [SyncFlushPostPassiveRootErrorPropagationBlocker; 4] {
        &SYNC_FLUSH_POST_PASSIVE_ROOT_ERROR_PROPAGATION_BLOCKERS
    }

    #[must_use]
    pub(crate) const fn root_error_update_scheduled(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_error_aggregation_enabled(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn has_configured_error_callback(self) -> bool {
        self.error_option_callbacks.has_configured_error_callback()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushPostPassiveContinuationExecutionGateRecord {
    pending_passive_root: FiberRootId,
    pending_passive_finished_work: FiberId,
    pending_passive_lanes: Lanes,
    pending_passive_unmount_count: usize,
    pending_passive_mount_count: usize,
    execution_context: SyncFlushExecutionContextRecord,
    exit_status: RootSyncFlushExitStatus,
    root_error_propagation: SyncFlushPostPassiveRootErrorPropagationRecord,
    continuation_roots: Vec<SyncFlushPostPassiveContinuationRootRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private post-passive sync-flush continuation metadata for future passive workers"
)]
impl SyncFlushPostPassiveContinuationExecutionGateRecord {
    #[must_use]
    pub(crate) const fn pending_passive_root(&self) -> FiberRootId {
        self.pending_passive_root
    }

    #[must_use]
    pub(crate) const fn pending_passive_finished_work(&self) -> FiberId {
        self.pending_passive_finished_work
    }

    #[must_use]
    pub(crate) const fn pending_passive_lanes(&self) -> Lanes {
        self.pending_passive_lanes
    }

    #[must_use]
    pub(crate) const fn pending_passive_unmount_count(&self) -> usize {
        self.pending_passive_unmount_count
    }

    #[must_use]
    pub(crate) const fn pending_passive_mount_count(&self) -> usize {
        self.pending_passive_mount_count
    }

    #[must_use]
    pub(crate) const fn pending_passive_record_count(&self) -> usize {
        self.pending_passive_unmount_count + self.pending_passive_mount_count
    }

    #[must_use]
    pub(crate) const fn execution_context(&self) -> SyncFlushExecutionContextRecord {
        self.execution_context
    }

    #[must_use]
    pub(crate) const fn exit_status(&self) -> RootSyncFlushExitStatus {
        self.exit_status
    }

    #[must_use]
    pub(crate) const fn root_error_propagation(
        &self,
    ) -> SyncFlushPostPassiveRootErrorPropagationRecord {
        self.root_error_propagation
    }

    #[must_use]
    pub(crate) fn continuation_roots(&self) -> &[SyncFlushPostPassiveContinuationRootRecord] {
        &self.continuation_roots
    }

    #[must_use]
    pub(crate) fn did_find_continuation_roots(&self) -> bool {
        !self.continuation_roots.is_empty()
    }

    #[must_use]
    pub(crate) const fn should_execute_follow_up_sync_flush(&self) -> bool {
        match self.exit_status {
            RootSyncFlushExitStatus::Completed => true,
            RootSyncFlushExitStatus::BlockedByExecutionContext
            | RootSyncFlushExitStatus::SkippedReentrantFlush
            | RootSyncFlushExitStatus::SkippedNoPendingSyncWork => false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootSyncFlushResult {
    execution_context: SyncFlushExecutionContextRecord,
    exit_status: RootSyncFlushExitStatus,
    records: Vec<RootSyncFlushRecord>,
}

impl RootSyncFlushResult {
    #[must_use]
    pub const fn execution_context(&self) -> SyncFlushExecutionContextRecord {
        self.execution_context
    }

    #[must_use]
    pub const fn exit_status(&self) -> RootSyncFlushExitStatus {
        self.exit_status
    }

    #[must_use]
    pub fn records(&self) -> &[RootSyncFlushRecord] {
        &self.records
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RootSchedulerError {
    FiberRootStore(FiberRootStoreError),
    ConcurrentUpdate(ConcurrentUpdateError),
    RootUpdate(RootUpdateError),
    RootWorkLoop(RootWorkLoopError),
    ScheduleRecordWrongFiber {
        root: FiberRootId,
        expected: FiberId,
        actual: FiberId,
    },
    RescheduleRecordWrongRoot {
        expected: FiberRootId,
        actual: FiberRootId,
        fiber: FiberId,
    },
    RescheduleRecordMissingLane {
        root: FiberRootId,
        fiber: FiberId,
        lane: Lane,
        pending_lanes: Lanes,
    },
    TransitionSchedulerUnsupportedLane {
        root: FiberRootId,
        lane: Lane,
        source_priority: RootUpdateLaneSourcePriority,
        selected_lanes: Lanes,
    },
    TransitionSchedulerUnsupportedLaneSet {
        root: FiberRootId,
        lane: Lane,
        selected_lanes: Lanes,
    },
    TransitionSchedulerMissingEntanglement {
        root: FiberRootId,
        lane: Lane,
    },
    TransitionSchedulerEntanglementMismatch {
        root: FiberRootId,
        lane: Lane,
        queue: UpdateQueueHandle,
        entanglement: RootTransitionEntanglementRecord,
    },
    TransitionSchedulerIncompatibleEventLane {
        root: FiberRootId,
        requested_lane: Lane,
        current_event_transition_lane: Lane,
    },
}

impl Display for RootSchedulerError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::ConcurrentUpdate(error) => Display::fmt(error, formatter),
            Self::RootUpdate(error) => Display::fmt(error, formatter),
            Self::RootWorkLoop(error) => Display::fmt(error, formatter),
            Self::ScheduleRecordWrongFiber {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "schedule record for root {} references fiber slot {}, expected current HostRoot fiber slot {}",
                root.raw(),
                actual.slot().get(),
                expected.slot().get()
            ),
            Self::RescheduleRecordWrongRoot {
                expected,
                actual,
                fiber,
            } => write!(
                formatter,
                "reschedule record for root {} references fiber slot {} attached to root {}",
                expected.raw(),
                fiber.slot().get(),
                actual.raw()
            ),
            Self::RescheduleRecordMissingLane {
                root,
                fiber,
                lane,
                pending_lanes,
            } => write!(
                formatter,
                "reschedule record for root {} references fiber slot {} lane {}, but root pending lanes are {}",
                root.raw(),
                fiber.slot().get(),
                lane.bits(),
                pending_lanes.bits()
            ),
            Self::TransitionSchedulerUnsupportedLane {
                root,
                lane,
                source_priority,
                selected_lanes,
            } => write!(
                formatter,
                "root {} transition scheduler diagnostics require transition lane metadata; got lane {} from {:?} with selected lanes {}",
                root.raw(),
                lane.bits(),
                source_priority,
                selected_lanes.bits()
            ),
            Self::TransitionSchedulerUnsupportedLaneSet {
                root,
                lane,
                selected_lanes,
            } => write!(
                formatter,
                "root {} transition scheduler diagnostics cannot route lane {} from selected lanes {}",
                root.raw(),
                lane.bits(),
                selected_lanes.bits()
            ),
            Self::TransitionSchedulerMissingEntanglement { root, lane } => write!(
                formatter,
                "root {} transition scheduler diagnostics require entanglement evidence for lane {}",
                root.raw(),
                lane.bits()
            ),
            Self::TransitionSchedulerEntanglementMismatch {
                root,
                lane,
                queue,
                entanglement,
            } => write!(
                formatter,
                "root {} transition scheduler diagnostics have incompatible entanglement for lane {} queue {}; entanglement root {} lane {} queue {} lanes {}",
                root.raw(),
                lane.bits(),
                queue.raw(),
                entanglement.root().raw(),
                entanglement.lane().bits(),
                entanglement.queue().raw(),
                entanglement.entangled_lanes().bits()
            ),
            Self::TransitionSchedulerIncompatibleEventLane {
                root,
                requested_lane,
                current_event_transition_lane,
            } => write!(
                formatter,
                "root {} transition scheduler diagnostics requested lane {} but current event transition lane is {}",
                root.raw(),
                requested_lane.bits(),
                current_event_transition_lane.bits()
            ),
        }
    }
}

impl Error for RootSchedulerError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::ConcurrentUpdate(error) => Some(error),
            Self::RootUpdate(error) => Some(error),
            Self::RootWorkLoop(error) => Some(error),
            Self::ScheduleRecordWrongFiber { .. }
            | Self::RescheduleRecordWrongRoot { .. }
            | Self::RescheduleRecordMissingLane { .. }
            | Self::TransitionSchedulerUnsupportedLane { .. }
            | Self::TransitionSchedulerUnsupportedLaneSet { .. }
            | Self::TransitionSchedulerMissingEntanglement { .. }
            | Self::TransitionSchedulerEntanglementMismatch { .. }
            | Self::TransitionSchedulerIncompatibleEventLane { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for RootSchedulerError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<ConcurrentUpdateError> for RootSchedulerError {
    fn from(error: ConcurrentUpdateError) -> Self {
        Self::ConcurrentUpdate(error)
    }
}

impl From<RootUpdateError> for RootSchedulerError {
    fn from(error: RootUpdateError) -> Self {
        Self::RootUpdate(error)
    }
}

impl From<RootWorkLoopError> for RootSchedulerError {
    fn from(error: RootWorkLoopError) -> Self {
        Self::RootWorkLoop(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum SchedulerBridgeActContinuationExecutionError {
    Scheduler(RootSchedulerError),
    Commit(RootCommitError),
    #[cfg(test)]
    CommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
}

impl Display for SchedulerBridgeActContinuationExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Scheduler(error) => Display::fmt(error, formatter),
            Self::Commit(error) => Display::fmt(error, formatter),
            #[cfg(test)]
            Self::CommitHandoff(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for SchedulerBridgeActContinuationExecutionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Scheduler(error) => Some(error),
            Self::Commit(error) => Some(error),
            #[cfg(test)]
            Self::CommitHandoff(error) => Some(error.as_ref()),
        }
    }
}

impl From<RootSchedulerError> for SchedulerBridgeActContinuationExecutionError {
    fn from(error: RootSchedulerError) -> Self {
        Self::Scheduler(error)
    }
}

impl From<RootCommitError> for SchedulerBridgeActContinuationExecutionError {
    fn from(error: RootCommitError) -> Self {
        Self::Commit(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for SchedulerBridgeActContinuationExecutionError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::CommitHandoff(Box::new(error))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum SchedulerBridgeActQueueExecutionError {
    Scheduler(RootSchedulerError),
    SyncContinuation(RootSyncSchedulerContinuationExecutionError),
    ActContinuation(SchedulerBridgeActContinuationExecutionError),
}

impl Display for SchedulerBridgeActQueueExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Scheduler(error) => Display::fmt(error, formatter),
            Self::SyncContinuation(error) => Display::fmt(error, formatter),
            Self::ActContinuation(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for SchedulerBridgeActQueueExecutionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Scheduler(error) => Some(error),
            Self::SyncContinuation(error) => Some(error),
            Self::ActContinuation(error) => Some(error),
        }
    }
}

impl From<RootSchedulerError> for SchedulerBridgeActQueueExecutionError {
    fn from(error: RootSchedulerError) -> Self {
        Self::Scheduler(error)
    }
}

impl From<RootSyncSchedulerContinuationExecutionError> for SchedulerBridgeActQueueExecutionError {
    fn from(error: RootSyncSchedulerContinuationExecutionError) -> Self {
        Self::SyncContinuation(error)
    }
}

impl From<SchedulerBridgeActContinuationExecutionError> for SchedulerBridgeActQueueExecutionError {
    fn from(error: SchedulerBridgeActContinuationExecutionError) -> Self {
        Self::ActContinuation(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum RootSyncSchedulerContinuationExecutionError {
    Scheduler(RootSchedulerError),
    Commit(RootCommitError),
    #[cfg(test)]
    CommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
}

impl Display for RootSyncSchedulerContinuationExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Scheduler(error) => Display::fmt(error, formatter),
            Self::Commit(error) => Display::fmt(error, formatter),
            #[cfg(test)]
            Self::CommitHandoff(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for RootSyncSchedulerContinuationExecutionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Scheduler(error) => Some(error),
            Self::Commit(error) => Some(error),
            #[cfg(test)]
            Self::CommitHandoff(error) => Some(error.as_ref()),
        }
    }
}

impl From<RootSchedulerError> for RootSyncSchedulerContinuationExecutionError {
    fn from(error: RootSchedulerError) -> Self {
        Self::Scheduler(error)
    }
}

impl From<RootCommitError> for RootSyncSchedulerContinuationExecutionError {
    fn from(error: RootCommitError) -> Self {
        Self::Commit(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for RootSyncSchedulerContinuationExecutionError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::CommitHandoff(Box::new(error))
    }
}

pub fn ensure_root_is_scheduled<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    record: RootScheduleUpdateRecord,
) -> Result<ScheduledRootUpdateResult, RootSchedulerError> {
    validate_schedule_record(store, record)?;
    ensure_root_schedule_entry(store, record.root())
}

#[allow(
    dead_code,
    reason = "crate-private transition scheduler route is currently exercised by canary tests"
)]
pub(crate) fn record_transition_lane_scheduler_request_from_update_diagnostics_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    result: &UpdateContainerResult,
) -> Result<RootTransitionLaneSchedulerRequestRecord, RootSchedulerError> {
    validate_update_container_lane_diagnostics_for_canary(store, result)?;
    validate_schedule_record(store, result.schedule())?;

    let root = result.schedule().root();
    let lane = result.lane();
    let selected_next_lanes = result.selected_next_lanes();
    if result.source_priority() != RootUpdateLaneSourcePriority::TransitionLane
        || !lane.is_transition()
    {
        return Err(RootSchedulerError::TransitionSchedulerUnsupportedLane {
            root,
            lane,
            source_priority: result.source_priority(),
            selected_lanes: selected_next_lanes,
        });
    }

    validate_transition_lane_scheduler_lanes_for_canary(root, lane, selected_next_lanes)?;

    let entanglement = result
        .entanglement()
        .ok_or(RootSchedulerError::TransitionSchedulerMissingEntanglement { root, lane })?;
    validate_transition_lane_scheduler_entanglement_for_canary(store, result, entanglement)?;

    let current_event_transition_lane_before =
        store.root_scheduler().current_event_transition_lane();
    if current_event_transition_lane_before.is_non_empty()
        && current_event_transition_lane_before != lane
    {
        return Err(
            RootSchedulerError::TransitionSchedulerIncompatibleEventLane {
                root,
                requested_lane: lane,
                current_event_transition_lane: current_event_transition_lane_before,
            },
        );
    }

    let scheduled_root = ensure_root_schedule_entry(store, root)?;
    store
        .root_scheduler_mut()
        .set_current_event_transition_lane(lane);

    Ok(RootTransitionLaneSchedulerRequestRecord {
        root,
        fiber: result.schedule().fiber(),
        update: result.update(),
        queue: result.queue(),
        lane,
        event_priority: result.event_priority(),
        pending_lanes_before_enqueue: result.pending_lanes_before_enqueue(),
        pending_lanes_after_enqueue: result.pending_lanes_after_enqueue(),
        selected_next_lanes,
        entangled_lanes: entanglement.entangled_lanes(),
        current_event_transition_lane_before,
        current_event_transition_lane_after: store.root_scheduler().current_event_transition_lane(),
        scheduled_root,
    })
}

#[allow(
    dead_code,
    reason = "crate-private render error option metadata for future root error routing"
)]
pub(crate) fn record_root_render_error_option_callbacks<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    render_lanes: Lanes,
    error: RootWorkLoopError,
) -> Result<RootRenderErrorOptionCallbackRecord, RootSchedulerError> {
    let root = store.root(root_id)?;
    Ok(RootRenderErrorOptionCallbackRecord {
        root: root_id,
        render_lanes,
        error,
        error_option_callbacks: root
            .options()
            .error_option_callback_record(root_id, RootErrorOptionCallbackPhase::Render),
    })
}

#[allow(
    dead_code,
    reason = "crate-private passive scheduler flush gate is currently exercised by canary tests"
)]
pub(crate) fn schedule_passive_effects_flush_after_commit_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
) -> Result<PassiveEffectSchedulerFlushGateRecord, RootSchedulerError> {
    let root_id = commit.root();
    let Some(handoff) = commit.pending_passive_handoff() else {
        return Ok(PassiveEffectSchedulerFlushGateRecord {
            root: root_id,
            finished_work: None,
            lanes: Lanes::NO,
            pending_unmount_count: 0,
            pending_mount_count: 0,
            scheduler_request: None,
        });
    };

    store.root(handoff.root())?;
    let scheduler_request = store.scheduler_bridge_mut().schedule_passive_effects_flush(
        handoff.root(),
        handoff.finished_work(),
        handoff.lanes(),
        handoff.pending_unmount_count(),
        handoff.pending_mount_count(),
    );

    Ok(PassiveEffectSchedulerFlushGateRecord {
        root: handoff.root(),
        finished_work: Some(handoff.finished_work()),
        lanes: handoff.lanes(),
        pending_unmount_count: handoff.pending_unmount_count(),
        pending_mount_count: handoff.pending_mount_count(),
        scheduler_request: Some(scheduler_request),
    })
}

pub(crate) fn capture_passive_effect_root_error<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    source_fiber: FiberId,
    source: RootErrorCaptureSource,
) -> Result<RootErrorCaptureScheduleRecord, RootSchedulerError> {
    let (root_fiber, pending_lanes_before, error_option_callbacks) = {
        let root = store.root(root_id)?;
        (
            root.current(),
            root.lanes().pending_lanes(),
            root.options()
                .error_option_callback_record(root_id, RootErrorOptionCallbackPhase::Commit),
        )
    };
    let lane = Lane::SYNC;
    let marked_root = mark_update_lane_from_fiber_to_root(store, source_fiber, lane)?;
    if marked_root != root_id {
        return Err(RootSchedulerError::RescheduleRecordWrongRoot {
            expected: root_id,
            actual: marked_root,
            fiber: source_fiber,
        });
    }

    let scheduled_root = ensure_root_schedule_entry(store, root_id)?;
    let pending_lanes_after = store.root(root_id)?.lanes().pending_lanes();

    Ok(RootErrorCaptureScheduleRecord {
        source,
        root: root_id,
        root_fiber,
        source_fiber,
        lane,
        pending_lanes_before,
        pending_lanes_after,
        scheduled_root,
        error_option_callbacks,
    })
}

pub(crate) fn ensure_root_is_rescheduled<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    record: RootRescheduleRequestRecord,
) -> Result<ScheduledRootUpdateResult, RootSchedulerError> {
    validate_reschedule_record(store, record)?;
    ensure_root_schedule_entry(store, record.root())
}

fn ensure_root_schedule_entry<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<ScheduledRootUpdateResult, RootSchedulerError> {
    let already_scheduled = {
        let scheduler = store.root_scheduler();
        scheduler.last_scheduled_root() == Some(root_id)
            || store
                .root(root_id)?
                .scheduling()
                .next_scheduled_root()
                .is_some()
    };

    let inserted = if already_scheduled {
        false
    } else {
        append_scheduled_root(store, root_id)?;
        true
    };

    store
        .root_scheduler_mut()
        .set_might_have_pending_sync_work(true);

    let (microtask, act_queue_task) = ensure_schedule_microtask_is_scheduled(store);

    Ok(ScheduledRootUpdateResult {
        root: root_id,
        inserted,
        microtask,
        act_queue_task,
        might_have_pending_sync_work: store.root_scheduler().might_have_pending_sync_work(),
    })
}

pub fn process_root_schedule_in_microtask<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> Result<RootScheduleMicrotaskResult, RootSchedulerError> {
    store.root_scheduler_mut().reset_microtask_scheduled();
    store
        .root_scheduler_mut()
        .set_might_have_pending_sync_work(false);

    let mut records = Vec::new();
    let mut previous_root = None;
    let mut root = store.root_scheduler().first_scheduled_root();

    while let Some(root_id) = root {
        let next_root = store.root(root_id)?.scheduling().next_scheduled_root();
        let record = schedule_task_for_root_during_microtask(store, root_id)?;

        if record.next_lanes().is_empty() {
            store
                .root_mut(root_id)?
                .scheduling_mut()
                .set_next_scheduled_root(None);

            if let Some(previous_root_id) = previous_root {
                store
                    .root_mut(previous_root_id)?
                    .scheduling_mut()
                    .set_next_scheduled_root(next_root);
            } else {
                store
                    .root_scheduler_mut()
                    .set_first_scheduled_root(next_root);
            }

            if next_root.is_none() {
                store
                    .root_scheduler_mut()
                    .set_last_scheduled_root(previous_root);
            }
        } else {
            if record.next_lanes().includes_sync_lane() {
                store
                    .root_scheduler_mut()
                    .set_might_have_pending_sync_work(true);
            }
            previous_root = Some(root_id);
        }

        records.push(record);
        root = next_root;
    }

    Ok(RootScheduleMicrotaskResult { records })
}

pub fn schedule_task_for_root_during_microtask<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<RootTaskScheduleRecord, RootSchedulerError> {
    let lane_selection = select_lanes_for_scheduled_task(store, root_id)?;
    let next_lanes = lane_selection.render_lanes();
    let existing_callback_node = store.root(root_id)?.scheduling().callback_node();

    if next_lanes.is_empty() {
        let canceled_callback = store
            .scheduler_bridge_mut()
            .cancel_callback(existing_callback_node);
        store.root_mut(root_id)?.scheduling_mut().clear_callback();
        return Ok(RootTaskScheduleRecord {
            root: root_id,
            next_lanes,
            outcome: RootTaskScheduleOutcome::NoWork,
            callback_priority: RootCallbackPriority::NO,
            callback_node: RootSchedulerCallbackHandle::NONE,
            scheduler_priority: None,
            scheduled_callback: None,
            scheduled_act_queue_task: None,
            canceled_callback,
        });
    }

    if lane_selection.priority_lanes().includes_sync_lane()
        && !root_is_prerendering(store, root_id, lane_selection.priority_lanes())?
    {
        let canceled_callback = store
            .scheduler_bridge_mut()
            .cancel_callback(existing_callback_node);
        store.root_mut(root_id)?.scheduling_mut().set_callback(
            RootSchedulerCallbackHandle::NONE,
            RootCallbackPriority::new(Lane::SYNC),
        );

        return Ok(RootTaskScheduleRecord {
            root: root_id,
            next_lanes,
            outcome: RootTaskScheduleOutcome::Sync,
            callback_priority: RootCallbackPriority::new(Lane::SYNC),
            callback_node: RootSchedulerCallbackHandle::NONE,
            scheduler_priority: None,
            scheduled_callback: None,
            scheduled_act_queue_task: None,
            canceled_callback,
        });
    }

    let new_callback_priority =
        RootCallbackPriority::new(lane_selection.priority_lanes().highest_priority_lane());
    let existing_callback_priority = store.root(root_id)?.scheduling().callback_priority();
    let act_queue_active = store.scheduler_bridge().is_act_queue_active();

    if new_callback_priority == existing_callback_priority
        && existing_callback_node.is_some()
        && (!act_queue_active || SchedulerBridge::is_fake_act_callback_node(existing_callback_node))
    {
        return Ok(RootTaskScheduleRecord {
            root: root_id,
            next_lanes,
            outcome: RootTaskScheduleOutcome::Reused,
            callback_priority: new_callback_priority,
            callback_node: existing_callback_node,
            scheduler_priority: Some(scheduler_priority_for_lanes(
                lane_selection.priority_lanes(),
            )),
            scheduled_callback: None,
            scheduled_act_queue_task: None,
            canceled_callback: None,
        });
    }

    let canceled_callback = store
        .scheduler_bridge_mut()
        .cancel_callback(existing_callback_node);
    let scheduler_priority = scheduler_priority_for_lanes(lane_selection.priority_lanes());

    if act_queue_active {
        let scheduled_act_queue_task = store.scheduler_bridge_mut().schedule_act_callback(
            root_id,
            scheduler_priority,
            new_callback_priority,
        );
        store
            .root_mut(root_id)?
            .scheduling_mut()
            .set_callback(scheduled_act_queue_task.node(), new_callback_priority);

        return Ok(RootTaskScheduleRecord {
            root: root_id,
            next_lanes,
            outcome: RootTaskScheduleOutcome::Scheduled,
            callback_priority: new_callback_priority,
            callback_node: scheduled_act_queue_task.node(),
            scheduler_priority: Some(scheduler_priority),
            scheduled_callback: None,
            scheduled_act_queue_task: Some(scheduled_act_queue_task),
            canceled_callback,
        });
    }

    let scheduled_callback = store.scheduler_bridge_mut().schedule_callback(
        root_id,
        scheduler_priority,
        new_callback_priority,
    );
    store
        .root_mut(root_id)?
        .scheduling_mut()
        .set_callback(scheduled_callback.node(), new_callback_priority);

    Ok(RootTaskScheduleRecord {
        root: root_id,
        next_lanes,
        outcome: RootTaskScheduleOutcome::Scheduled,
        callback_priority: new_callback_priority,
        callback_node: scheduled_callback.node(),
        scheduler_priority: Some(scheduler_priority),
        scheduled_callback: Some(scheduled_callback),
        scheduled_act_queue_task: None,
        canceled_callback,
    })
}

pub fn execute_scheduled_root_callback<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    callback: SchedulerCallbackRequest,
) -> Result<RootSchedulerCallbackExecutionRecord, RootSchedulerError> {
    let validation =
        validate_scheduled_host_root_callback(store, callback.root(), callback.node())?;
    if validation.is_stale() {
        return Ok(RootSchedulerCallbackExecutionRecord {
            callback,
            validation,
            selected_lanes: Lanes::NO,
            status: RootSchedulerCallbackExecutionStatus::StaleCallback,
            render_phase: None,
        });
    }

    let selected_lanes = select_lanes_for_scheduled_task(store, callback.root())?.render_lanes();
    if selected_lanes.is_empty() {
        store
            .root_mut(callback.root())?
            .scheduling_mut()
            .clear_callback();
        return Ok(RootSchedulerCallbackExecutionRecord {
            callback,
            validation,
            selected_lanes,
            status: RootSchedulerCallbackExecutionStatus::NoWork,
            render_phase: None,
        });
    }

    let render_result = render_host_root_via_scheduler_callback(
        store,
        callback.root(),
        callback.node(),
        selected_lanes,
    )?;
    let render_phase = render_result.render_phase();
    let status = if render_phase.is_some() {
        RootSchedulerCallbackExecutionStatus::Rendered
    } else {
        RootSchedulerCallbackExecutionStatus::StaleCallback
    };

    Ok(RootSchedulerCallbackExecutionRecord {
        callback,
        validation: render_result.validation(),
        selected_lanes,
        status,
        render_phase,
    })
}

#[allow(
    dead_code,
    reason = "crate-private ping/retry execution path reserved for future Suspense retry workers"
)]
pub(crate) fn execute_pinged_retry_root_callback<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    callback: SchedulerCallbackRequest,
) -> Result<RootPingedRetryExecutionRecord, RootSchedulerError> {
    let validation =
        validate_scheduled_host_root_callback(store, callback.root(), callback.node())?;
    if validation.is_stale() {
        return Ok(RootPingedRetryExecutionRecord {
            callback,
            validation,
            pinged_retry_lanes: Lanes::NO,
            selected_priority_lanes: Lanes::NO,
            selected_render_lanes: Lanes::NO,
            status: RootPingedRetryExecutionStatus::StaleCallback,
            render_phase: None,
        });
    }

    let pinged_retry_lanes = store
        .root(callback.root())?
        .lanes()
        .pinged_lanes()
        .intersect(Lanes::RETRY);
    let lane_selection = select_lanes_for_scheduled_task(store, callback.root())?;
    let selected_priority_lanes = lane_selection.priority_lanes();
    let selected_render_lanes = lane_selection.render_lanes();

    if selected_render_lanes.is_empty() {
        store
            .root_mut(callback.root())?
            .scheduling_mut()
            .clear_callback();
        return Ok(RootPingedRetryExecutionRecord {
            callback,
            validation,
            pinged_retry_lanes,
            selected_priority_lanes,
            selected_render_lanes,
            status: RootPingedRetryExecutionStatus::NoWork,
            render_phase: None,
        });
    }

    let selected_priority_is_pinged_retry = selected_priority_lanes.includes_only_retries()
        && selected_priority_lanes.intersect(pinged_retry_lanes) == selected_priority_lanes;
    let selected_render_is_pinged_retry = selected_render_lanes.includes_only_retries()
        && selected_render_lanes.intersect(pinged_retry_lanes) == selected_render_lanes;

    if !selected_priority_is_pinged_retry || !selected_render_is_pinged_retry {
        return Ok(RootPingedRetryExecutionRecord {
            callback,
            validation,
            pinged_retry_lanes,
            selected_priority_lanes,
            selected_render_lanes,
            status: RootPingedRetryExecutionStatus::NoPingedRetryWork,
            render_phase: None,
        });
    }

    let render_result = render_host_root_via_scheduler_callback(
        store,
        callback.root(),
        callback.node(),
        selected_render_lanes,
    )?;
    let render_phase = render_result.render_phase();
    let status = if render_phase.is_some() {
        RootPingedRetryExecutionStatus::Rendered
    } else {
        RootPingedRetryExecutionStatus::StaleCallback
    };

    Ok(RootPingedRetryExecutionRecord {
        callback,
        validation: render_result.validation(),
        pinged_retry_lanes,
        selected_priority_lanes,
        selected_render_lanes,
        status,
        render_phase,
    })
}

#[allow(
    dead_code,
    reason = "crate-private Suspense retry execution path reserved for future Suspense retry workers"
)]
pub(crate) fn execute_suspense_thenable_retry_root_callback<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    request: SuspenseThenableRetryRootSchedulerRequestRecord,
    callback: SchedulerCallbackRequest,
) -> Result<RootPingedRetryExecutionRecord, RootSchedulerError> {
    let validation =
        validate_scheduled_host_root_callback(store, callback.root(), callback.node())?;
    let pinged_retry_lanes = store
        .root(callback.root())?
        .lanes()
        .pinged_lanes()
        .intersect(Lanes::RETRY);

    if validation.is_stale() {
        return Ok(RootPingedRetryExecutionRecord {
            callback,
            validation,
            pinged_retry_lanes,
            selected_priority_lanes: Lanes::NO,
            selected_render_lanes: Lanes::NO,
            status: RootPingedRetryExecutionStatus::StaleCallback,
            render_phase: None,
        });
    }

    if !suspense_retry_request_is_accepted_for_callback(request, callback, pinged_retry_lanes) {
        return Ok(RootPingedRetryExecutionRecord {
            callback,
            validation,
            pinged_retry_lanes,
            selected_priority_lanes: Lanes::NO,
            selected_render_lanes: Lanes::NO,
            status: RootPingedRetryExecutionStatus::RejectedSuspenseRetryRequest,
            render_phase: None,
        });
    }

    if !suspense_retry_request_is_current(store, request) {
        return Ok(RootPingedRetryExecutionRecord {
            callback,
            validation,
            pinged_retry_lanes,
            selected_priority_lanes: Lanes::NO,
            selected_render_lanes: Lanes::NO,
            status: RootPingedRetryExecutionStatus::StaleThenableBlocker,
            render_phase: None,
        });
    }

    execute_pinged_retry_root_callback(store, callback)
}

#[allow(
    dead_code,
    reason = "crate-private Suspense retry render handoff is reserved for future Suspense workers"
)]
pub(crate) fn execute_suspense_thenable_retry_root_render_handoff<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    request: SuspenseThenableRetryRootSchedulerRequestRecord,
    callback: SchedulerCallbackRequest,
) -> Result<SuspenseThenableRetryRootRenderHandoffRecord, RootSchedulerError> {
    let execution = execute_suspense_thenable_retry_root_callback(store, request, callback)?;

    Ok(SuspenseThenableRetryRootRenderHandoffRecord { request, execution })
}

fn suspense_thenable_retry_root_scheduler_record(
    root: FiberRootId,
    suspense: &UnsupportedSuspenseChildShapeRecord,
    status: SuspenseThenableRetryRootSchedulerStatus,
    root_pinged_lanes_before: Lanes,
    root_pinged_lanes_after: Lanes,
    scheduled_root: Option<ScheduledRootUpdateResult>,
) -> SuspenseThenableRetryRootSchedulerRequestRecord {
    let thenable = suspense.thenable_ping_blocker();

    SuspenseThenableRetryRootSchedulerRequestRecord {
        root,
        boundary: suspense.fiber(),
        retry_queue: thenable.retry_queue(),
        primary_offscreen_retry_queue: thenable.primary_offscreen_retry_queue(),
        retry_lane: thenable.ping_lane(),
        pinged_lanes: thenable.ping_lanes(),
        root_pinged_lanes_before,
        root_pinged_lanes_after,
        status,
        scheduled_root,
        scheduler_callback_blockers: &SUSPENSE_THENABLE_RETRY_SCHEDULER_CALLBACK_BLOCKERS,
    }
}

fn suspense_retry_request_is_accepted_for_callback(
    request: SuspenseThenableRetryRootSchedulerRequestRecord,
    callback: SchedulerCallbackRequest,
    pinged_retry_lanes: Lanes,
) -> bool {
    request.accepted()
        && request.root == callback.root()
        && request.pinged_lanes.is_non_empty()
        && request.pinged_lanes.includes_only_retries()
        && request.pinged_lanes.intersect(pinged_retry_lanes) == request.pinged_lanes
}

fn suspense_retry_request_is_current<H: HostTypes>(
    store: &FiberRootStore<H>,
    request: SuspenseThenableRetryRootSchedulerRequestRecord,
) -> bool {
    let Ok(node) = store.fiber_arena().get(request.boundary) else {
        return false;
    };

    if node.tag() != FiberTag::Suspense || node.update_queue() != request.retry_queue {
        return false;
    }

    matches!(root_for_updated_fiber(store, request.boundary), Ok(actual) if actual == request.root)
}

fn suspense_boundary_is_current_for_retry<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    suspense: &UnsupportedSuspenseChildShapeRecord,
) -> bool {
    let thenable = suspense.thenable_ping_blocker();
    let Ok(node) = store.fiber_arena().get(suspense.fiber()) else {
        return false;
    };

    if node.tag() != FiberTag::Suspense || node.update_queue() != thenable.retry_queue() {
        return false;
    }

    matches!(root_for_updated_fiber(store, suspense.fiber()), Ok(actual) if actual == root_id)
}

fn root_lane_state_accepts_suspense_retry(root_lanes: &RootLaneState, pinged_lanes: Lanes) -> bool {
    root_lanes.pending_lanes().contains_all(pinged_lanes)
        && root_lanes.suspended_lanes().contains_all(pinged_lanes)
}

#[allow(
    dead_code,
    reason = "crate-private Suspense retry scheduler request path reserved for future Suspense workers"
)]
pub(crate) fn request_suspense_thenable_retry_root_scheduler<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    suspense: &UnsupportedSuspenseChildShapeRecord,
) -> Result<SuspenseThenableRetryRootSchedulerRequestRecord, RootSchedulerError> {
    let thenable = suspense.thenable_ping_blocker();
    let root_pinged_lanes_before = store.root(root_id)?.lanes().pinged_lanes();

    if thenable.is_offscreen_only_retry_queue() {
        return Ok(suspense_thenable_retry_root_scheduler_record(
            root_id,
            suspense,
            SuspenseThenableRetryRootSchedulerStatus::RejectedOffscreenOnlyRecord,
            root_pinged_lanes_before,
            root_pinged_lanes_before,
            None,
        ));
    }

    if !thenable.has_suspense_boundary_retry_queue() {
        return Ok(suspense_thenable_retry_root_scheduler_record(
            root_id,
            suspense,
            SuspenseThenableRetryRootSchedulerStatus::RejectedUnacceptedRecord,
            root_pinged_lanes_before,
            root_pinged_lanes_before,
            None,
        ));
    }

    if !thenable.has_compatible_retry_ping_lanes() {
        return Ok(suspense_thenable_retry_root_scheduler_record(
            root_id,
            suspense,
            SuspenseThenableRetryRootSchedulerStatus::RejectedIncompatibleLaneSet,
            root_pinged_lanes_before,
            root_pinged_lanes_before,
            None,
        ));
    }

    if !suspense_boundary_is_current_for_retry(store, root_id, suspense) {
        return Ok(suspense_thenable_retry_root_scheduler_record(
            root_id,
            suspense,
            SuspenseThenableRetryRootSchedulerStatus::RejectedStaleBoundary,
            root_pinged_lanes_before,
            root_pinged_lanes_before,
            None,
        ));
    }

    if !root_lane_state_accepts_suspense_retry(store.root(root_id)?.lanes(), thenable.ping_lanes())
    {
        return Ok(suspense_thenable_retry_root_scheduler_record(
            root_id,
            suspense,
            SuspenseThenableRetryRootSchedulerStatus::RejectedIncompatibleLaneSet,
            root_pinged_lanes_before,
            root_pinged_lanes_before,
            None,
        ));
    }

    store
        .root_mut(root_id)?
        .lanes_mut()
        .mark_pinged(thenable.ping_lanes());
    let scheduled_root = ensure_root_schedule_entry(store, root_id)?;
    let root_pinged_lanes_after = store.root(root_id)?.lanes().pinged_lanes();

    Ok(suspense_thenable_retry_root_scheduler_record(
        root_id,
        suspense,
        SuspenseThenableRetryRootSchedulerStatus::Accepted,
        root_pinged_lanes_before,
        root_pinged_lanes_after,
        Some(scheduled_root),
    ))
}

pub fn collect_sync_flush_plan<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> Result<RootSyncFlushPlan, RootSchedulerError> {
    if store.root_scheduler().is_flushing_work() {
        return Ok(RootSyncFlushPlan {
            skipped_reentrant_flush: true,
            skipped_no_sync_work: false,
            sync_roots: Vec::new(),
        });
    }

    if !store.root_scheduler().might_have_pending_sync_work() {
        return Ok(RootSyncFlushPlan {
            skipped_reentrant_flush: false,
            skipped_no_sync_work: true,
            sync_roots: Vec::new(),
        });
    }

    store.root_scheduler_mut().set_is_flushing_work(true);
    let sync_roots = (|| {
        let mut sync_roots = Vec::new();
        let mut root = store.root_scheduler().first_scheduled_root();
        while let Some(root_id) = root {
            if sync_flush_lanes_for_root(store, root_id)?.is_non_empty() {
                sync_roots.push(root_id);
            }
            root = store.root(root_id)?.scheduling().next_scheduled_root();
        }
        Ok::<_, RootSchedulerError>(sync_roots)
    })();
    store.root_scheduler_mut().set_is_flushing_work(false);
    let sync_roots = sync_roots?;

    Ok(RootSyncFlushPlan {
        skipped_reentrant_flush: false,
        skipped_no_sync_work: false,
        sync_roots,
    })
}

pub(crate) fn sync_flush_lanes_for_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<Lanes, RootSchedulerError> {
    Ok(next_lanes_for_root(store, root_id)?.intersect(SYNC_FLUSH_LANES))
}

#[allow(
    dead_code,
    reason = "crate-private sync-flush recovery diagnostics are reserved for private error workers"
)]
pub(crate) fn sync_flush_root_recovery_snapshot_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    selected_lanes: Lanes,
) -> Result<SyncFlushRootRecoverySnapshotForCanary, RootSchedulerError> {
    let root = store.root(root_id)?;
    let scheduling = root.scheduling();
    Ok(SyncFlushRootRecoverySnapshotForCanary {
        root: root_id,
        selected_lanes,
        pending_lanes: root.lanes().pending_lanes(),
        callback_node: scheduling.callback_node(),
        callback_priority: scheduling.callback_priority(),
        render_phase_work: scheduling.work_in_progress(),
        render_phase_lanes: scheduling.work_in_progress_root_render_lanes(),
        render_exit_status: scheduling.render_exit_status(),
        might_have_pending_sync_work: store.root_scheduler().might_have_pending_sync_work(),
        is_flushing_work: store.root_scheduler().is_flushing_work(),
    })
}

pub(crate) fn recompute_might_have_pending_sync_work<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> Result<bool, RootSchedulerError> {
    let mut has_pending_sync_work = false;
    let mut root = store.root_scheduler().first_scheduled_root();
    while let Some(root_id) = root {
        if sync_flush_lanes_for_root(store, root_id)?.is_non_empty() {
            has_pending_sync_work = true;
            break;
        }
        root = store.root(root_id)?.scheduling().next_scheduled_root();
    }

    store
        .root_scheduler_mut()
        .set_might_have_pending_sync_work(has_pending_sync_work);
    Ok(has_pending_sync_work)
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

#[allow(
    dead_code,
    reason = "crate-private expired-lane sync scheduler continuation is exercised by canary tests"
)]
pub(crate) fn execute_expired_lane_sync_scheduler_continuation_for_root_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    current_time: LaneTimestamp,
    requested_callback_node: RootSchedulerCallbackHandle,
) -> Result<
    RootExpiredLaneSyncSchedulerContinuationRecord,
    RootSyncSchedulerContinuationExecutionError,
> {
    let current_callback_node = store
        .root(root_id)
        .map_err(RootSchedulerError::from)?
        .scheduling()
        .callback_node();
    let expired_lanes_before = store
        .root(root_id)
        .map_err(RootSchedulerError::from)?
        .lanes()
        .expired_lanes();

    if current_callback_node != requested_callback_node {
        return Ok(expired_lane_sync_scheduler_continuation_record(
            root_id,
            current_time,
            requested_callback_node,
            current_callback_node,
            expired_lanes_before,
            expired_lanes_before,
            Lanes::NO,
            Lanes::NO,
            None,
            None,
            RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode,
        ));
    }

    store
        .root_mut(root_id)
        .map_err(RootSchedulerError::from)?
        .lanes_mut()
        .mark_starved_lanes_as_expired(current_time);
    let expired_lanes_after = store
        .root(root_id)
        .map_err(RootSchedulerError::from)?
        .lanes()
        .expired_lanes();
    let lane_selection = select_lanes_for_scheduled_task(store, root_id)?;
    let selected_priority_lanes = lane_selection.priority_lanes();
    let selected_render_lanes = lane_selection.render_lanes();

    if expired_lanes_after.is_empty() {
        return Ok(expired_lane_sync_scheduler_continuation_record(
            root_id,
            current_time,
            requested_callback_node,
            current_callback_node,
            expired_lanes_before,
            expired_lanes_after,
            selected_priority_lanes,
            selected_render_lanes,
            None,
            None,
            RootExpiredLaneSyncSchedulerContinuationStatus::NoExpiredLanes,
        ));
    }

    if selected_render_lanes.is_empty() || !selected_render_lanes.contains_any(expired_lanes_after)
    {
        return Ok(expired_lane_sync_scheduler_continuation_record(
            root_id,
            current_time,
            requested_callback_node,
            current_callback_node,
            expired_lanes_before,
            expired_lanes_after,
            selected_priority_lanes,
            selected_render_lanes,
            None,
            None,
            RootExpiredLaneSyncSchedulerContinuationStatus::NoExpiredWorkSelected,
        ));
    }

    let render_phase = render_host_root_for_lanes(store, root_id, selected_render_lanes)
        .map_err(RootSchedulerError::from)?;
    #[cfg(test)]
    record_root_finished_work_for_scheduler_handoff_for_canary(store, render_phase)?;
    let handoff = RootSyncFlushRecord {
        order: 0,
        root: root_id,
        lanes: selected_render_lanes,
        status: RootSyncFlushRecordStatus::RenderedAwaitingCommit,
        render_phase,
    };
    let continuation = execute_sync_scheduler_continuation_for_render_handoff(
        store,
        handoff,
        requested_callback_node,
    )?;
    let status = expired_lane_sync_scheduler_status_from_sync_continuation(continuation.status());

    Ok(expired_lane_sync_scheduler_continuation_record(
        root_id,
        current_time,
        requested_callback_node,
        current_callback_node,
        expired_lanes_before,
        expired_lanes_after,
        selected_priority_lanes,
        selected_render_lanes,
        Some(handoff),
        Some(continuation),
        status,
    ))
}

fn expired_lane_sync_scheduler_status_from_sync_continuation(
    status: RootSyncSchedulerContinuationExecutionStatus,
) -> RootExpiredLaneSyncSchedulerContinuationStatus {
    match status {
        RootSyncSchedulerContinuationExecutionStatus::StaleCallbackNode => {
            RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode
        }
        RootSyncSchedulerContinuationExecutionStatus::BlockedByPendingPassive => {
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByPendingPassive
        }
        RootSyncSchedulerContinuationExecutionStatus::NoSyncWork => {
            RootExpiredLaneSyncSchedulerContinuationStatus::NoContinuationWork
        }
        RootSyncSchedulerContinuationExecutionStatus::BlockedByLaneMismatch => {
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByLaneMismatch
        }
        RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch => {
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByFinishedWorkHandoffMismatch
        }
        RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted => {
            RootExpiredLaneSyncSchedulerContinuationStatus::RenderedAndCommitted
        }
    }
}

#[allow(clippy::too_many_arguments)]
fn expired_lane_sync_scheduler_continuation_record(
    root: FiberRootId,
    current_time: LaneTimestamp,
    requested_callback_node: RootSchedulerCallbackHandle,
    current_callback_node: RootSchedulerCallbackHandle,
    expired_lanes_before: Lanes,
    expired_lanes_after: Lanes,
    selected_priority_lanes: Lanes,
    selected_render_lanes: Lanes,
    handoff: Option<RootSyncFlushRecord>,
    continuation: Option<RootSyncSchedulerContinuationExecutionRecord>,
    status: RootExpiredLaneSyncSchedulerContinuationStatus,
) -> RootExpiredLaneSyncSchedulerContinuationRecord {
    RootExpiredLaneSyncSchedulerContinuationRecord {
        root,
        current_time,
        requested_callback_node,
        current_callback_node,
        expired_lanes_before,
        expired_lanes_after,
        selected_priority_lanes,
        selected_render_lanes,
        handoff,
        continuation,
        status,
    }
}

pub(crate) fn execute_sync_scheduler_continuation_for_render_handoff<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    handoff: RootSyncFlushRecord,
    requested_callback_node: RootSchedulerCallbackHandle,
) -> Result<RootSyncSchedulerContinuationExecutionRecord, RootSyncSchedulerContinuationExecutionError>
{
    let current_callback_node = store
        .root(handoff.root())
        .map_err(RootSchedulerError::from)?
        .scheduling()
        .callback_node();
    if current_callback_node != requested_callback_node {
        return Ok(sync_scheduler_continuation_execution_record(
            handoff,
            requested_callback_node,
            current_callback_node,
            Lanes::NO,
            None,
            None,
            RootSyncSchedulerContinuationExecutionStatus::StaleCallbackNode,
            None,
        ));
    }

    let selected_lanes = sync_scheduler_continuation_lanes_for_root(store, handoff.root())?;
    let pending_passive_blocker =
        sync_scheduler_pending_passive_blocker_for_root(store, handoff.root())?;
    if pending_passive_blocker.is_some() {
        return Ok(sync_scheduler_continuation_execution_record(
            handoff,
            requested_callback_node,
            current_callback_node,
            selected_lanes,
            pending_passive_blocker,
            None,
            RootSyncSchedulerContinuationExecutionStatus::BlockedByPendingPassive,
            None,
        ));
    }

    if selected_lanes.is_empty() {
        return Ok(sync_scheduler_continuation_execution_record(
            handoff,
            requested_callback_node,
            current_callback_node,
            selected_lanes,
            None,
            None,
            RootSyncSchedulerContinuationExecutionStatus::NoSyncWork,
            None,
        ));
    }

    if selected_lanes != handoff.lanes() {
        return Ok(sync_scheduler_continuation_execution_record(
            handoff,
            requested_callback_node,
            current_callback_node,
            selected_lanes,
            None,
            None,
            RootSyncSchedulerContinuationExecutionStatus::BlockedByLaneMismatch,
            None,
        ));
    }

    #[cfg(test)]
    let finished_work_handoff_identity =
        root_sync_scheduler_finished_work_handoff_identity_for_canary(store, handoff)?;
    #[cfg(test)]
    if !finished_work_handoff_identity.accepted_for_root_scheduler_commit_handoff() {
        return Ok(sync_scheduler_continuation_execution_record(
            handoff,
            requested_callback_node,
            current_callback_node,
            selected_lanes,
            None,
            Some(finished_work_handoff_identity),
            RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch,
            None,
        ));
    }

    #[cfg(test)]
    let root_commit_handoff = {
        let pending = record_host_root_finished_work_pending_commit_for_canary(
            store,
            handoff.render_phase(),
            handoff.order(),
        )?;
        commit_finished_host_root_with_finished_work_handoff_for_canary(
            store,
            handoff.render_phase(),
            Some(pending),
            handoff.order().saturating_add(1),
        )?
    };
    #[cfg(test)]
    let commit = root_commit_handoff.commit().clone();
    #[cfg(not(test))]
    let commit = crate::commit_finished_host_root(store, handoff.render_phase())?;
    #[cfg(test)]
    let finished_work_identity_for_record = Some(finished_work_handoff_identity);
    #[cfg(not(test))]
    let finished_work_identity_for_record = None;
    recompute_might_have_pending_sync_work(store)?;

    let record = sync_scheduler_continuation_execution_record(
        handoff,
        requested_callback_node,
        current_callback_node,
        selected_lanes,
        None,
        finished_work_identity_for_record,
        RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted,
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

fn sync_scheduler_continuation_lanes_for_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<Lanes, RootSchedulerError> {
    let expired_lanes = store.root(root_id)?.lanes().expired_lanes();
    if expired_lanes.is_non_empty() {
        let lane_selection = select_lanes_for_scheduled_task(store, root_id)?;
        let render_lanes = lane_selection.render_lanes();
        if render_lanes.contains_any(expired_lanes) {
            return Ok(render_lanes);
        }
    }

    let sync_lanes = sync_flush_lanes_for_root(store, root_id)?;
    if sync_lanes.is_non_empty() {
        return Ok(sync_lanes);
    }

    Ok(Lanes::NO)
}

fn sync_scheduler_pending_passive_blocker_for_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<Option<RootSyncSchedulerPendingPassiveBlockerRecord>, RootSchedulerError> {
    let root = store.root(root_id)?;
    let pending_passive = root.scheduling().pending_passive();
    if !pending_passive.has_commit_handoff() {
        return Ok(None);
    }

    Ok(Some(RootSyncSchedulerPendingPassiveBlockerRecord {
        root: pending_passive.root().unwrap_or(root_id),
        finished_work: pending_passive.finished_work(),
        lanes: pending_passive.lanes(),
        pending_unmount_count: pending_passive.passive_unmounts().len(),
        pending_mount_count: pending_passive.passive_mounts().len(),
    }))
}

#[allow(
    clippy::too_many_arguments,
    reason = "private sync scheduler continuation evidence mirrors the canary assertion shape"
)]
fn sync_scheduler_continuation_execution_record(
    handoff: RootSyncFlushRecord,
    requested_callback_node: RootSchedulerCallbackHandle,
    current_callback_node: RootSchedulerCallbackHandle,
    selected_lanes: Lanes,
    pending_passive_blocker: Option<RootSyncSchedulerPendingPassiveBlockerRecord>,
    finished_work_handoff_identity: Option<RootSyncSchedulerFinishedWorkHandoffIdentityForCanary>,
    status: RootSyncSchedulerContinuationExecutionStatus,
    commit: Option<HostRootCommitRecord>,
) -> RootSyncSchedulerContinuationExecutionRecord {
    RootSyncSchedulerContinuationExecutionRecord {
        handoff,
        requested_callback_node,
        current_callback_node,
        selected_lanes,
        pending_passive_blocker,
        finished_work_handoff_identity,
        status,
        commit,
        #[cfg(test)]
        root_commit_handoff: None,
    }
}

#[cfg(test)]
fn root_sync_scheduler_finished_work_handoff_identity_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    handoff: RootSyncFlushRecord,
) -> Result<
    RootSyncSchedulerFinishedWorkHandoffIdentityForCanary,
    RootSyncSchedulerContinuationExecutionError,
> {
    let root = store
        .root(handoff.root())
        .map_err(RootSchedulerError::from)?;
    let scheduling = root.scheduling();
    let render_phase = handoff.render_phase();

    Ok(RootSyncSchedulerFinishedWorkHandoffIdentityForCanary {
        root: handoff.root(),
        render_phase_root: render_phase.root(),
        selected_lanes: handoff.lanes(),
        previous_current: render_phase.current(),
        current_before_commit: root.current(),
        pending_work_before_commit: scheduling.work_in_progress(),
        root_finished_work_before_commit: root.finished_work(),
        finished_work: render_phase.finished_work(),
        render_lanes: render_phase.render_lanes(),
        finished_lanes: render_phase.render_lanes(),
        root_finished_lanes_before_commit: root.finished_lanes(),
        pending_lanes_before_commit: root.lanes().pending_lanes(),
        render_phase_lanes_before_commit: scheduling.work_in_progress_root_render_lanes(),
    })
}

pub(crate) fn sync_flush_post_passive_continuation_execution_gate<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    execution_context: &ExecutionContextState,
    pending_passive_handoff: Option<PendingPassiveCommitHandoff>,
) -> Result<Option<SyncFlushPostPassiveContinuationExecutionGateRecord>, RootSchedulerError> {
    let Some(pending_passive_handoff) = pending_passive_handoff else {
        return Ok(None);
    };

    let root_error_propagation = sync_flush_post_passive_root_error_propagation_record(
        store,
        pending_passive_handoff.root(),
    )?;
    let execution_context_record = execution_context.sync_flush_record();
    if !execution_context_record.can_enter_sync_flush() {
        return Ok(Some(sync_flush_post_passive_continuation_gate_record(
            pending_passive_handoff,
            execution_context_record,
            RootSyncFlushExitStatus::BlockedByExecutionContext,
            root_error_propagation,
            Vec::new(),
        )));
    }

    if store.root_scheduler().is_flushing_work() {
        return Ok(Some(sync_flush_post_passive_continuation_gate_record(
            pending_passive_handoff,
            execution_context_record,
            RootSyncFlushExitStatus::SkippedReentrantFlush,
            root_error_propagation,
            Vec::new(),
        )));
    }

    if !store.root_scheduler().might_have_pending_sync_work() {
        return Ok(Some(sync_flush_post_passive_continuation_gate_record(
            pending_passive_handoff,
            execution_context_record,
            RootSyncFlushExitStatus::SkippedNoPendingSyncWork,
            root_error_propagation,
            Vec::new(),
        )));
    }

    store.root_scheduler_mut().set_is_flushing_work(true);
    let continuation_roots = collect_sync_flush_post_passive_continuation_roots(store);
    store.root_scheduler_mut().set_is_flushing_work(false);
    let continuation_roots = continuation_roots?;

    Ok(Some(sync_flush_post_passive_continuation_gate_record(
        pending_passive_handoff,
        execution_context_record,
        RootSyncFlushExitStatus::Completed,
        root_error_propagation,
        continuation_roots,
    )))
}

fn collect_sync_flush_post_passive_continuation_roots<H: HostTypes>(
    store: &FiberRootStore<H>,
) -> Result<Vec<SyncFlushPostPassiveContinuationRootRecord>, RootSchedulerError> {
    let mut records = Vec::new();
    let mut root = store.root_scheduler().first_scheduled_root();

    while let Some(root_id) = root {
        let lanes = sync_flush_lanes_for_root(store, root_id)?;
        if lanes.is_non_empty() {
            records.push(SyncFlushPostPassiveContinuationRootRecord {
                order: records.len(),
                root: root_id,
                lanes,
            });
        }
        root = store.root(root_id)?.scheduling().next_scheduled_root();
    }

    Ok(records)
}

fn sync_flush_post_passive_root_error_propagation_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<SyncFlushPostPassiveRootErrorPropagationRecord, RootSchedulerError> {
    let root = store.root(root_id)?;
    Ok(SyncFlushPostPassiveRootErrorPropagationRecord {
        root: root_id,
        error_option_callbacks: root
            .options()
            .error_option_callback_record(root_id, RootErrorOptionCallbackPhase::Commit),
    })
}

fn sync_flush_post_passive_continuation_gate_record(
    pending_passive_handoff: PendingPassiveCommitHandoff,
    execution_context: SyncFlushExecutionContextRecord,
    exit_status: RootSyncFlushExitStatus,
    root_error_propagation: SyncFlushPostPassiveRootErrorPropagationRecord,
    continuation_roots: Vec<SyncFlushPostPassiveContinuationRootRecord>,
) -> SyncFlushPostPassiveContinuationExecutionGateRecord {
    SyncFlushPostPassiveContinuationExecutionGateRecord {
        pending_passive_root: pending_passive_handoff.root(),
        pending_passive_finished_work: pending_passive_handoff.finished_work(),
        pending_passive_lanes: pending_passive_handoff.lanes(),
        pending_passive_unmount_count: pending_passive_handoff.pending_unmount_count(),
        pending_passive_mount_count: pending_passive_handoff.pending_mount_count(),
        execution_context,
        exit_status,
        root_error_propagation,
        continuation_roots,
    }
}

/// Prepare all currently scheduled sync roots for a later commit handoff.
///
/// This is the first data-producing foundation for React's
/// `flushSyncWorkOnAllRoots`: it checks execution-context and scheduler
/// reentry guards, traverses the scheduled-root list in insertion order, and
/// renders each sync HostRoot lane into a deterministic record. It deliberately
/// stops before the commit worker's responsibilities: no lane is marked
/// finished, `root.current` is not switched, and host mutation APIs are not
/// called.
pub fn flush_sync_work_on_all_roots<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    execution_context: &ExecutionContextState,
) -> Result<RootSyncFlushResult, RootSchedulerError> {
    let execution_context_record = execution_context.sync_flush_record();
    if !execution_context_record.can_enter_sync_flush() {
        return Ok(RootSyncFlushResult {
            execution_context: execution_context_record,
            exit_status: RootSyncFlushExitStatus::BlockedByExecutionContext,
            records: Vec::new(),
        });
    }

    if store.root_scheduler().is_flushing_work() {
        return Ok(RootSyncFlushResult {
            execution_context: execution_context_record,
            exit_status: RootSyncFlushExitStatus::SkippedReentrantFlush,
            records: Vec::new(),
        });
    }

    if !store.root_scheduler().might_have_pending_sync_work() {
        return Ok(RootSyncFlushResult {
            execution_context: execution_context_record,
            exit_status: RootSyncFlushExitStatus::SkippedNoPendingSyncWork,
            records: Vec::new(),
        });
    }

    store.root_scheduler_mut().set_is_flushing_work(true);
    let records = (|| {
        let mut records = Vec::new();
        let mut root = store.root_scheduler().first_scheduled_root();

        while let Some(root_id) = root {
            let next_root = store.root(root_id)?.scheduling().next_scheduled_root();
            let next_lanes = sync_flush_lanes_for_root(store, root_id)?;

            if next_lanes.is_non_empty() {
                let render_phase = render_host_root_for_lanes(store, root_id, next_lanes)?;
                #[cfg(test)]
                record_root_finished_work_for_scheduler_handoff_for_canary(store, render_phase)?;
                records.push(RootSyncFlushRecord {
                    order: records.len(),
                    root: root_id,
                    lanes: next_lanes,
                    status: RootSyncFlushRecordStatus::RenderedAwaitingCommit,
                    render_phase,
                });
            }

            root = next_root;
        }

        Ok::<_, RootSchedulerError>(records)
    })();
    store.root_scheduler_mut().set_is_flushing_work(false);
    let records = records?;

    Ok(RootSyncFlushResult {
        execution_context: execution_context_record,
        exit_status: RootSyncFlushExitStatus::Completed,
        records,
    })
}

#[cfg(test)]
fn record_root_finished_work_for_scheduler_handoff_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render_phase: HostRootRenderPhaseRecord,
) -> Result<(), RootSchedulerError> {
    store
        .root_mut(render_phase.root())?
        .record_finished_work_for_canary(render_phase.finished_work(), render_phase.render_lanes());
    Ok(())
}

pub fn scheduled_roots<H: HostTypes>(
    store: &FiberRootStore<H>,
) -> Result<Vec<FiberRootId>, RootSchedulerError> {
    let mut roots = Vec::new();
    let mut root = store.root_scheduler().first_scheduled_root();
    while let Some(root_id) = root {
        roots.push(root_id);
        root = store.root(root_id)?.scheduling().next_scheduled_root();
    }
    Ok(roots)
}

fn validate_schedule_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    record: RootScheduleUpdateRecord,
) -> Result<(), RootSchedulerError> {
    let root = store.root(record.root())?;
    let current = root.current();
    if record.fiber() != current {
        return Err(RootSchedulerError::ScheduleRecordWrongFiber {
            root: record.root(),
            expected: current,
            actual: record.fiber(),
        });
    }
    Ok(())
}

fn validate_reschedule_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    record: RootRescheduleRequestRecord,
) -> Result<(), RootSchedulerError> {
    let actual_root = root_for_updated_fiber(store, record.fiber())?;
    if actual_root != record.root() {
        return Err(RootSchedulerError::RescheduleRecordWrongRoot {
            expected: record.root(),
            actual: actual_root,
            fiber: record.fiber(),
        });
    }

    let pending_lanes = store.root(record.root())?.lanes().pending_lanes();
    if !pending_lanes.contains_lane(record.lane()) {
        return Err(RootSchedulerError::RescheduleRecordMissingLane {
            root: record.root(),
            fiber: record.fiber(),
            lane: record.lane(),
            pending_lanes,
        });
    }

    Ok(())
}

fn validate_transition_lane_scheduler_lanes_for_canary(
    root: FiberRootId,
    lane: Lane,
    selected_lanes: Lanes,
) -> Result<(), RootSchedulerError> {
    if !lane.is_transition()
        || selected_lanes.is_empty()
        || !selected_lanes.contains_lane(lane)
        || !selected_lanes.includes_only_transitions()
    {
        return Err(RootSchedulerError::TransitionSchedulerUnsupportedLaneSet {
            root,
            lane,
            selected_lanes,
        });
    }

    Ok(())
}

fn validate_transition_lane_scheduler_entanglement_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    result: &UpdateContainerResult,
    entanglement: RootTransitionEntanglementRecord,
) -> Result<(), RootSchedulerError> {
    let root = result.schedule().root();
    let lane = result.lane();
    let queue = result.queue();
    let root_entangled_lanes = store.root(root)?.lanes().entangled_lanes();
    let entangled_lanes = entanglement.entangled_lanes();

    if entanglement.root() != root
        || entanglement.queue() != queue
        || entanglement.lane() != lane
        || !entangled_lanes.contains_lane(lane)
        || !entangled_lanes.includes_only_transitions()
        || !root_entangled_lanes.contains_all(entangled_lanes)
    {
        return Err(
            RootSchedulerError::TransitionSchedulerEntanglementMismatch {
                root,
                lane,
                queue,
                entanglement,
            },
        );
    }

    Ok(())
}

fn append_scheduled_root<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<(), RootSchedulerError> {
    let last_root = store.root_scheduler().last_scheduled_root();
    if let Some(last_root_id) = last_root {
        store
            .root_mut(last_root_id)?
            .scheduling_mut()
            .set_next_scheduled_root(Some(root_id));
        store
            .root_scheduler_mut()
            .set_last_scheduled_root(Some(root_id));
    } else {
        store
            .root_scheduler_mut()
            .set_first_scheduled_root(Some(root_id));
        store
            .root_scheduler_mut()
            .set_last_scheduled_root(Some(root_id));
    }
    Ok(())
}

fn ensure_schedule_microtask_is_scheduled<H: HostTypes>(
    store: &mut FiberRootStore<H>,
) -> (
    Option<SchedulerMicrotaskRequest>,
    Option<SchedulerActQueueRequest>,
) {
    if store.scheduler_bridge().is_act_queue_active() {
        if store.root_scheduler().did_schedule_microtask_act() {
            return (None, None);
        }

        store.root_scheduler_mut().mark_act_microtask_scheduled();
        return (
            None,
            Some(
                store
                    .scheduler_bridge_mut()
                    .request_act_root_schedule_task(),
            ),
        );
    }

    if store.root_scheduler().did_schedule_microtask() {
        return (None, None);
    }

    store.root_scheduler_mut().mark_microtask_scheduled();
    (
        Some(
            store
                .scheduler_bridge_mut()
                .request_microtask(SchedulerMicrotaskKind::RootSchedule),
        ),
        None,
    )
}

fn next_lanes_for_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<Lanes, RootSchedulerError> {
    let root = store.root(root_id)?;
    let next_lanes = root.lanes().highest_priority_pending_lanes();
    Ok(root.lanes().entangled_lanes_for(next_lanes))
}

fn select_lanes_for_scheduled_task<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<RootLaneSelection, RootSchedulerError> {
    let root = store.root(root_id)?;
    let wip_lanes = if root.scheduling().work_in_progress().is_some() {
        root.scheduling().work_in_progress_root_render_lanes()
    } else {
        Lanes::NO
    };
    Ok(select_lanes_from_root_state(
        root.lanes(),
        wip_lanes,
        root_has_pending_commit(store, root_id)?,
    ))
}

fn select_lanes_from_root_state(
    root_lanes: &RootLaneState,
    wip_lanes: Lanes,
    root_has_pending_commit: bool,
) -> RootLaneSelection {
    let priority_lanes = root_lanes.get_next_lanes(wip_lanes, root_has_pending_commit);
    if priority_lanes.is_empty() {
        return RootLaneSelection::no_work();
    }

    RootLaneSelection {
        priority_lanes,
        render_lanes: root_lanes.entangled_lanes_for(priority_lanes),
    }
}

fn root_has_pending_commit<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<bool, RootSchedulerError> {
    let root = store.root(root_id)?;
    Ok(root.pending_commit().is_some()
        || root.scheduling().cancel_pending_commit().is_some()
        || root.scheduling().timeout_handle().is_some())
}

fn root_is_prerendering<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    render_lanes: Lanes,
) -> Result<bool, RootSchedulerError> {
    Ok(store
        .root(root_id)?
        .lanes()
        .check_if_root_is_prerendering(render_lanes))
}

fn scheduler_priority_for_lanes(lanes: Lanes) -> SchedulerPriority {
    match lanes_to_event_priority(lanes) {
        EventPriority::DISCRETE | EventPriority::CONTINUOUS => SchedulerPriority::UserBlocking,
        EventPriority::IDLE => SchedulerPriority::Idle,
        EventPriority::DEFAULT | EventPriority::NO => SchedulerPriority::Normal,
        _ => SchedulerPriority::Normal,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::RootOptions;
    use crate::begin_work::{
        BeginWorkRequest, UnsupportedSuspenseChildShapeRecord, UnsupportedThenableRetryQueueKind,
        unsupported_suspense_begin_work_record,
    };
    use crate::root_config::PendingPassiveUnmountOrigin;
    use crate::root_updates::update_container_transition_for_canary;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{
        RootElementHandle, RootErrorCallbackHandle, RootRecoverableErrorCallbackHandle,
        SchedulerActQueueTaskKind, commit_finished_host_root, update_container,
        update_container_sync,
    };
    use fast_react_core::{
        FiberMode, FiberTag, Lanes, PropsHandle, ReactKey, RootFinishedLanes, RootLaneState,
        UpdateQueueHandle,
    };

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id, host)
    }

    fn schedule_default_update(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> ScheduledRootUpdateResult {
        let result =
            update_container(store, root_id, RootElementHandle::from_raw(1), None).unwrap();
        ensure_root_is_scheduled(store, result.schedule()).unwrap()
    }

    fn activate_act_queue(store: &mut FiberRootStore<RecordingHost>) {
        store.scheduler_bridge_mut().set_act_queue_active(true);
    }

    #[test]
    fn root_scheduler_recovery_snapshot_preserves_reentry_guard_callback_metadata() {
        let (mut store, root_id, host) = root_store();
        schedule_default_update(&mut store, root_id);
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let scheduled = processed.records()[0];
        assert_eq!(scheduled.outcome(), RootTaskScheduleOutcome::Scheduled);
        let callback_node = store.root(root_id).unwrap().scheduling().callback_node();
        let callback_priority = store
            .root(root_id)
            .unwrap()
            .scheduling()
            .callback_priority();

        let before =
            sync_flush_root_recovery_snapshot_for_canary(&store, root_id, Lanes::DEFAULT).unwrap();
        store.root_scheduler_mut().set_is_flushing_work(true);
        let guarded =
            sync_flush_root_recovery_snapshot_for_canary(&store, root_id, Lanes::DEFAULT).unwrap();
        store.root_scheduler_mut().set_is_flushing_work(false);

        assert_eq!(before.root(), root_id);
        assert_eq!(before.selected_lanes(), Lanes::DEFAULT);
        assert_eq!(before.pending_lanes(), Lanes::DEFAULT);
        assert_eq!(before.callback_node(), callback_node);
        assert_eq!(before.callback_priority(), callback_priority);
        assert_eq!(before.render_phase_work(), None);
        assert_eq!(before.render_phase_lanes(), Lanes::NO);
        assert_eq!(before.render_exit_status(), RootRenderExitStatus::NoWork);
        assert!(!before.is_flushing_work());
        assert!(guarded.is_flushing_work());
        assert!(guarded.preserves_lane_and_callback_metadata_from(before));
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    fn scheduled_callback_request(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> SchedulerCallbackRequest {
        schedule_default_update(store, root_id);
        let processed = process_root_schedule_in_microtask(store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        store.scheduler_bridge().callback_requests()[0]
    }

    fn mark_default_suspended_with_pending_transition(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) {
        let lanes = store.root_mut(root_id).unwrap().lanes_mut();
        lanes.mark_updated(Lane::TRANSITION_1);
        lanes.mark_suspended(Lanes::DEFAULT, Lane::NO, true);
    }

    fn schedule_sync_update(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        element: RootElementHandle,
    ) -> ScheduledRootUpdateResult {
        let result = update_container_sync(store, root_id, element, None).unwrap();
        ensure_root_is_scheduled(store, result.schedule()).unwrap()
    }

    fn attach_function_component_child(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        props: PropsHandle,
    ) -> FiberId {
        let host_root = store.root(root_id).unwrap().current();
        let function = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            props,
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(host_root, &[function])
            .unwrap();
        function
    }

    fn attach_suspense_retry_boundary(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        render_lanes: Lanes,
        boundary_retry_queue: UpdateQueueHandle,
        primary_offscreen_retry_queue: Option<UpdateQueueHandle>,
    ) -> UnsupportedSuspenseChildShapeRecord {
        let host_root = store.root(root_id).unwrap().current();
        let suspense = store.fiber_arena_mut().create_fiber(
            FiberTag::Suspense,
            Some(ReactKey::from_normalized("retry-boundary")),
            PropsHandle::from_raw(901),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .get_mut(suspense)
            .unwrap()
            .set_update_queue(boundary_retry_queue);
        let primary = store.fiber_arena_mut().create_fiber(
            FiberTag::Offscreen,
            None,
            PropsHandle::from_raw(902),
            FiberMode::NO,
        );
        if let Some(queue) = primary_offscreen_retry_queue {
            store
                .fiber_arena_mut()
                .get_mut(primary)
                .unwrap()
                .set_update_queue(queue);
        }
        let primary_child = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(903),
            FiberMode::NO,
        );
        let fallback = store.fiber_arena_mut().create_fiber(
            FiberTag::Fragment,
            None,
            PropsHandle::from_raw(904),
            FiberMode::NO,
        );
        let fallback_child = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(905),
            FiberMode::NO,
        );

        store
            .fiber_arena_mut()
            .set_children(primary, &[primary_child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(fallback, &[fallback_child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(suspense, &[primary, fallback])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[suspense])
            .unwrap();

        unsupported_suspense_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(suspense, render_lanes),
        )
        .unwrap()
    }

    fn mark_suspended_lane(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        lane: Lane,
    ) {
        let lanes = store.root_mut(root_id).unwrap().lanes_mut();
        lanes.mark_updated(lane);
        lanes.mark_suspended(Lanes::from(lane), Lane::NO, true);
    }

    #[test]
    fn root_scheduler_inserts_first_scheduled_root_and_requests_microtask() {
        let (mut store, root_id, _host) = root_store();

        let scheduled = schedule_default_update(&mut store, root_id);

        assert_eq!(scheduled.root(), root_id);
        assert!(scheduled.inserted());
        assert!(scheduled.microtask().is_some());
        assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
        assert_eq!(store.root_scheduler().first_scheduled_root(), Some(root_id));
        assert_eq!(store.root_scheduler().last_scheduled_root(), Some(root_id));
        assert!(store.root_scheduler().did_schedule_microtask());
        assert!(!store.root_scheduler().did_schedule_microtask_act());
        assert_eq!(store.scheduler_bridge().microtask_requests().len(), 1);
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    }

    #[test]
    fn root_scheduler_reschedules_function_component_source_after_lane_mark() {
        let (mut store, root_id, _host) = root_store();
        let function =
            attach_function_component_child(&mut store, root_id, PropsHandle::from_raw(201));
        let marked_root =
            crate::mark_update_lane_from_fiber_to_root(&mut store, function, Lane::DEFAULT)
                .unwrap();
        let request = RootRescheduleRequestRecord::new(marked_root, function, Lane::DEFAULT);

        let scheduled = ensure_root_is_rescheduled(&mut store, request).unwrap();

        assert_eq!(request.root(), root_id);
        assert_eq!(request.fiber(), function);
        assert_eq!(request.lane(), Lane::DEFAULT);
        assert_eq!(scheduled.root(), root_id);
        assert!(scheduled.inserted());
        assert!(scheduled.microtask().is_some());
        assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
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
    fn root_scheduler_dedupes_same_root_schedule_entries() {
        let (mut store, root_id, _host) = root_store();

        let first = schedule_default_update(&mut store, root_id);
        let second = schedule_default_update(&mut store, root_id);

        assert!(first.inserted());
        assert!(!second.inserted());
        assert_eq!(second.microtask(), None);
        assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
        assert_eq!(store.scheduler_bridge().microtask_requests().len(), 1);
    }

    #[test]
    fn root_scheduler_routes_root_schedule_tasks_to_act_queue() {
        let (mut store, root_id, _host) = root_store();
        activate_act_queue(&mut store);

        let first = schedule_default_update(&mut store, root_id);
        let second = schedule_default_update(&mut store, root_id);

        let act_task = first.act_queue_task().unwrap();
        assert_eq!(first.microtask(), None);
        assert_eq!(second.act_queue_task(), None);
        assert_eq!(act_task.kind(), SchedulerActQueueTaskKind::RootSchedule);
        assert_eq!(act_task.node(), RootSchedulerCallbackHandle::NONE);
        assert!(store.root_scheduler().did_schedule_microtask_act());
        assert!(!store.root_scheduler().did_schedule_microtask());
        assert!(store.scheduler_bridge().microtask_requests().is_empty());
        assert_eq!(store.scheduler_bridge().act_queue_requests(), &[act_task]);
    }

    #[test]
    fn root_scheduler_records_transition_lane_request_without_callback_execution() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let result = update_container_transition_for_canary(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(5661),
            None,
        )
        .unwrap();

        let record = record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
            &mut store, &result,
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(record.fiber(), current);
        assert_eq!(record.update(), result.update());
        assert_eq!(record.queue(), result.queue());
        assert_eq!(record.lane(), Lane::TRANSITION_1);
        assert_eq!(record.event_priority(), EventPriority::DEFAULT);
        assert_eq!(record.pending_lanes_before_enqueue(), Lanes::NO);
        assert_eq!(
            record.pending_lanes_after_enqueue(),
            Lanes::from(Lane::TRANSITION_1)
        );
        assert_eq!(
            record.selected_next_lanes(),
            Lanes::from(Lane::TRANSITION_1)
        );
        assert_eq!(record.entangled_lanes(), Lanes::from(Lane::TRANSITION_1));
        assert_eq!(record.current_event_transition_lane_before(), Lane::NO);
        assert_eq!(
            record.current_event_transition_lane_after(),
            Lane::TRANSITION_1
        );
        assert!(record.routed_to_private_root_scheduler());
        assert!(record.callback_execution_blocked());
        assert!(record.public_update_scheduling_blocked());
        assert!(!record.public_scheduler_compatibility_claimed());

        let scheduled = record.scheduled_root();
        assert_eq!(scheduled.root(), root_id);
        assert!(scheduled.inserted());
        assert!(scheduled.microtask().is_some());
        assert_eq!(scheduled.act_queue_task(), None);
        assert!(scheduled.might_have_pending_sync_work());
        assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
        assert_eq!(
            store.root_scheduler().current_event_transition_lane(),
            Lane::TRANSITION_1
        );
        assert!(store.root_scheduler().did_schedule_microtask());
        assert!(store.root_scheduler().might_have_pending_sync_work());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
        assert_eq!(store.scheduler_bridge().microtask_requests().len(), 1);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_transition_lane_request_rejects_unsupported_lane_sets() {
        let (mut store, root_id, _host) = root_store();
        let default =
            update_container(&mut store, root_id, RootElementHandle::from_raw(5662), None).unwrap();

        let default_error =
            record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
                &mut store, &default,
            )
            .unwrap_err();
        assert_eq!(
            default_error,
            RootSchedulerError::TransitionSchedulerUnsupportedLane {
                root: root_id,
                lane: Lane::DEFAULT,
                source_priority: RootUpdateLaneSourcePriority::DefaultEventPriority,
                selected_lanes: Lanes::DEFAULT,
            }
        );

        let sync =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(5663), None)
                .unwrap();
        let sync_error =
            record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
                &mut store, &sync,
            )
            .unwrap_err();
        assert_eq!(
            sync_error,
            RootSchedulerError::TransitionSchedulerUnsupportedLane {
                root: root_id,
                lane: Lane::SYNC,
                source_priority: RootUpdateLaneSourcePriority::ExplicitSync,
                selected_lanes: Lanes::SYNC.merge(Lanes::DEFAULT),
            }
        );

        for (lane, selected_lanes) in [
            (Lane::DEFAULT, Lanes::DEFAULT),
            (Lane::SYNC, Lanes::SYNC),
            (Lane::OFFSCREEN, Lanes::OFFSCREEN),
            (
                Lane::TRANSITION_1,
                Lanes::from(Lane::TRANSITION_1).merge(Lanes::OFFSCREEN),
            ),
        ] {
            let error =
                validate_transition_lane_scheduler_lanes_for_canary(root_id, lane, selected_lanes)
                    .unwrap_err();
            assert_eq!(
                error,
                RootSchedulerError::TransitionSchedulerUnsupportedLaneSet {
                    root: root_id,
                    lane,
                    selected_lanes,
                }
            );
        }

        assert_eq!(store.root_scheduler().first_scheduled_root(), None);
        assert_eq!(store.root_scheduler().last_scheduled_root(), None);
        assert_eq!(
            store.root_scheduler().current_event_transition_lane(),
            Lane::NO
        );
        assert!(!store.root_scheduler().did_schedule_microtask());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
        assert!(store.scheduler_bridge().microtask_requests().is_empty());
    }

    #[test]
    fn root_scheduler_transition_lane_request_rejects_stale_update_diagnostics() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let result = update_container_transition_for_canary(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(5664),
            None,
        )
        .unwrap();
        let render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::from(Lane::TRANSITION_1))
                .unwrap();

        let error = record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
            &mut store, &result,
        )
        .unwrap_err();

        assert_eq!(render.applied_update_count(), 1);
        assert_eq!(
            error,
            RootSchedulerError::RootUpdate(RootUpdateError::StaleQueueEvidence {
                root: root_id,
                queue: result.queue(),
                update: result.update(),
                expected_pending_lanes: Lanes::from(Lane::TRANSITION_1),
                actual_pending_lanes: Lanes::from(Lane::TRANSITION_1),
            })
        );
        assert_eq!(store.root_scheduler().first_scheduled_root(), None);
        assert_eq!(store.root_scheduler().last_scheduled_root(), None);
        assert_eq!(
            store.root_scheduler().current_event_transition_lane(),
            Lane::NO
        );
        assert!(store.scheduler_bridge().microtask_requests().is_empty());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_transition_lane_request_rejects_incompatible_event_lane() {
        let (mut store, root_id, _host) = root_store();
        let result = update_container_transition_for_canary(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(5665),
            None,
        )
        .unwrap();
        store
            .root_scheduler_mut()
            .set_current_event_transition_lane(Lane::TRANSITION_2);

        let error = record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
            &mut store, &result,
        )
        .unwrap_err();

        assert_eq!(
            error,
            RootSchedulerError::TransitionSchedulerIncompatibleEventLane {
                root: root_id,
                requested_lane: Lane::TRANSITION_1,
                current_event_transition_lane: Lane::TRANSITION_2,
            }
        );
        assert_eq!(store.root_scheduler().first_scheduled_root(), None);
        assert_eq!(store.root_scheduler().last_scheduled_root(), None);
        assert_eq!(
            store.root_scheduler().current_event_transition_lane(),
            Lane::TRANSITION_2
        );
        assert!(!store.root_scheduler().did_schedule_microtask());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
        assert!(store.scheduler_bridge().microtask_requests().is_empty());
    }

    #[test]
    fn root_scheduler_passive_effect_scheduler_flush_gate_ignores_commits_without_handoff() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(401), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let commit = commit_finished_host_root(&mut store, render).unwrap();

        let gate =
            schedule_passive_effects_flush_after_commit_for_canary(&mut store, &commit).unwrap();

        assert_eq!(gate.root(), root_id);
        assert_eq!(gate.finished_work(), None);
        assert_eq!(gate.lanes(), Lanes::NO);
        assert_eq!(gate.pending_record_count(), 0);
        assert_eq!(
            gate.status(),
            PassiveEffectSchedulerFlushGateStatus::NoPendingPassive
        );
        assert!(!gate.did_schedule_scheduler_flush_request());
        assert_eq!(gate.scheduler_request(), None);
        assert!(!gate.executes_public_effects());
        assert!(!gate.public_act_compatibility_claimed());
        assert!(!gate.public_scheduler_package_behavior_changed());
        assert!(
            store
                .scheduler_bridge()
                .passive_effects_flush_requests()
                .is_empty()
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
        assert!(store.scheduler_bridge().microtask_requests().is_empty());
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .pending_passive()
                .is_empty()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_passive_effect_scheduler_flush_gate_records_request_without_consuming() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(402), None).unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        {
            let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(root_id, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_unmount(
                    previous_current,
                    PendingPassiveUnmountOrigin::UpdatedFiber,
                    Lanes::SYNC,
                )
                .unwrap();
            scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::DEFAULT)
                .unwrap();
        }
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let microtask_request_count = store.scheduler_bridge().microtask_requests().len();

        let gate =
            schedule_passive_effects_flush_after_commit_for_canary(&mut store, &commit).unwrap();

        assert_eq!(gate.root(), root_id);
        assert_eq!(gate.finished_work(), Some(finished_work));
        assert_eq!(gate.lanes(), Lanes::DEFAULT);
        assert_eq!(gate.pending_unmount_count(), 1);
        assert_eq!(gate.pending_mount_count(), 1);
        assert_eq!(gate.pending_record_count(), 2);
        assert_eq!(
            gate.status(),
            PassiveEffectSchedulerFlushGateStatus::Scheduled
        );
        assert!(gate.did_schedule_scheduler_flush_request());
        assert!(!gate.executes_public_effects());
        assert!(!gate.public_act_compatibility_claimed());
        assert!(!gate.public_scheduler_package_behavior_changed());

        let request = gate.scheduler_request().unwrap();
        assert_eq!(request.order(), 0);
        assert_eq!(request.node(), RootSchedulerCallbackHandle::from_raw(1));
        assert_eq!(request.root(), root_id);
        assert_eq!(request.finished_work(), finished_work);
        assert_eq!(request.lanes(), Lanes::DEFAULT);
        assert_eq!(request.pending_unmount_count(), 1);
        assert_eq!(request.pending_mount_count(), 1);
        assert_eq!(request.pending_record_count(), 2);
        assert_eq!(request.scheduler_priority(), SchedulerPriority::Normal);
        assert!(!request.executes_public_effects());
        assert!(!request.public_act_compatibility_claimed());
        assert!(!request.public_scheduler_package_behavior_changed());
        assert_eq!(
            store.scheduler_bridge().passive_effects_flush_requests(),
            &[request]
        );
        assert_eq!(
            store.scheduler_bridge().callback_requests().len(),
            callback_request_count
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert_eq!(
            store.scheduler_bridge().microtask_requests().len(),
            microtask_request_count
        );
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();
        assert_eq!(pending_passive.root(), Some(root_id));
        assert_eq!(pending_passive.finished_work(), Some(finished_work));
        assert_eq!(pending_passive.lanes(), Lanes::DEFAULT);
        assert!(pending_passive.has_commit_handoff());
        assert_eq!(pending_passive.passive_unmounts().len(), 1);
        assert_eq!(pending_passive.passive_mounts().len(), 1);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_preserves_multiple_root_insertion_order() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let first = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let third = store
            .create_client_root(FakeContainer::new(3), RootOptions::new())
            .unwrap();

        schedule_default_update(&mut store, first);
        schedule_default_update(&mut store, second);
        schedule_default_update(&mut store, third);

        assert_eq!(scheduled_roots(&store).unwrap(), vec![first, second, third]);
        assert_eq!(
            store
                .root(first)
                .unwrap()
                .scheduling()
                .next_scheduled_root(),
            Some(second)
        );
        assert_eq!(
            store
                .root(second)
                .unwrap()
                .scheduling()
                .next_scheduled_root(),
            Some(third)
        );
        assert_eq!(store.root_scheduler().last_scheduled_root(), Some(third));
    }

    #[test]
    fn root_scheduler_sync_lane_marks_possible_sync_work_and_bypasses_async_callback() {
        let (mut store, root_id, _host) = root_store();
        let result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        let scheduled = ensure_root_is_scheduled(&mut store, result.schedule()).unwrap();

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert!(scheduled.might_have_pending_sync_work());
        assert!(store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(processed.records().len(), 1);
        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Sync
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .callback_priority(),
            RootCallbackPriority::new(Lane::SYNC)
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
    }

    #[test]
    fn root_scheduler_non_sync_lane_requests_bridge_callback() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        assert_eq!(
            processed.records()[0].scheduler_priority(),
            Some(SchedulerPriority::Normal)
        );
        assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
        assert_eq!(
            store.scheduler_bridge().callback_requests()[0].root(),
            root_id
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            store.scheduler_bridge().callback_requests()[0].node()
        );
        assert!(processed.records()[0].scheduled_act_queue_task().is_none());
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    }

    #[test]
    fn root_scheduler_non_sync_lane_routes_callback_to_act_queue() {
        let (mut store, root_id, _host) = root_store();
        activate_act_queue(&mut store);
        schedule_default_update(&mut store, root_id);

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        let act_callback = processed.records()[0].scheduled_act_queue_task().unwrap();
        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        assert_eq!(
            processed.records()[0].callback_node(),
            SchedulerBridge::fake_act_callback_node()
        );
        assert_eq!(
            act_callback.kind(),
            SchedulerActQueueTaskKind::RenderCallback
        );
        assert_eq!(act_callback.root(), Some(root_id));
        assert_eq!(
            act_callback.scheduler_priority(),
            Some(SchedulerPriority::Normal)
        );
        assert_eq!(
            act_callback.node(),
            SchedulerBridge::fake_act_callback_node()
        );
        assert!(processed.records()[0].scheduled_callback().is_none());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            SchedulerBridge::fake_act_callback_node()
        );
        assert_eq!(store.scheduler_bridge().act_queue_requests().len(), 2);
        assert_eq!(
            store.scheduler_bridge().act_queue_requests()[0].kind(),
            SchedulerActQueueTaskKind::RootSchedule
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_requests()[1],
            act_callback
        );
    }

    #[test]
    fn root_scheduler_act_queue_execution_consumes_root_schedule_and_render_callback() {
        let (mut store, root_id, host) = root_store();
        activate_act_queue(&mut store);
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_expired(Lanes::DEFAULT);

        let execution =
            execute_scheduler_bridge_act_queue_for_canary(&mut store, 1_000_000, &[]).unwrap();

        assert_eq!(execution.request_records().len(), 2);
        assert_eq!(execution.consumed_request_count(), 2);
        assert_eq!(execution.rejected_request_count(), 0);
        assert_eq!(execution.executed_render_callback_count(), 1);
        assert!(execution.did_consume_queued_act_requests());
        assert!(execution.did_execute_accepted_render_callbacks());
        assert!(execution.records_preserve_act_queue_order());
        assert!(execution.routed_private_act_queue_requests_and_continuations_for_canary());
        assert!(!execution.drains_public_react_act_queue());
        assert!(!execution.public_act_compatibility_claimed());
        assert!(!execution.public_root_compatibility_claimed());
        assert!(!execution.public_flush_sync_compatibility_claimed());
        assert!(!execution.public_scheduler_timing_compatibility_claimed());
        assert!(!execution.executes_effects());
        assert!(execution.continuation_execution().is_none());

        let root_schedule = &execution.request_records()[0];
        assert_eq!(root_schedule.execution_order(), 0);
        assert_eq!(root_schedule.queue_order(), 0);
        assert_eq!(
            root_schedule.request().kind(),
            SchedulerActQueueTaskKind::RootSchedule
        );
        assert!(root_schedule.did_process_root_schedule());
        let processed = root_schedule.root_schedule().unwrap();
        assert_eq!(processed.records().len(), 1);
        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        assert!(processed.records()[0].scheduled_act_queue_task().is_some());
        assert!(!root_schedule.drains_public_react_act_queue());
        assert!(!root_schedule.public_act_compatibility_claimed());
        assert!(!root_schedule.public_root_compatibility_claimed());
        assert!(!root_schedule.public_scheduler_timing_compatibility_claimed());
        assert!(!root_schedule.executes_effects());

        let render_callback = &execution.request_records()[1];
        assert_eq!(render_callback.execution_order(), 1);
        assert_eq!(render_callback.queue_order(), 1);
        assert_eq!(
            render_callback.request().kind(),
            SchedulerActQueueTaskKind::RenderCallback
        );
        assert_eq!(
            render_callback.status(),
            SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackRenderedAndCommitted
        );
        assert!(render_callback.did_execute_accepted_render_callback());
        assert!(render_callback.accepted_root_scheduler_execution_evidence_for_canary());
        assert!(!render_callback.drains_public_react_act_queue());
        assert!(!render_callback.public_act_compatibility_claimed());
        assert!(!render_callback.public_root_compatibility_claimed());
        assert!(!render_callback.public_scheduler_timing_compatibility_claimed());
        assert!(!render_callback.executes_effects());

        let expired = render_callback.render_callback().unwrap();
        assert_eq!(expired.root(), root_id);
        assert!(expired.did_execute_expired_lane_sync_continuation());
        assert!(expired.consumed_accepted_scheduler_continuation_record());
        assert_eq!(expired.selected_expired_lanes(), Lanes::DEFAULT);
        let continuation = expired.continuation().unwrap();
        assert!(continuation.routed_through_root_scheduler_and_commit_evidence_for_canary());
        assert_eq!(
            continuation.status(),
            RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
        );
        assert_eq!(continuation.selected_lanes(), Lanes::DEFAULT);
        assert_eq!(
            continuation.commit().unwrap().finished_lanes(),
            Lanes::DEFAULT
        );
        assert_ne!(store.root(root_id).unwrap().current(), current);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_consumed_request_count(),
            2
        );
        assert_eq!(
            store.scheduler_bridge().pending_act_queue_request_count(),
            0
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_act_queue_execution_rejects_stale_render_callback() {
        let (mut store, root_id, host) = root_store();
        activate_act_queue(&mut store);
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let render_request = store.scheduler_bridge().act_queue_requests()[1];
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .clear_callback();

        let record = execute_scheduler_bridge_act_queue_request_for_canary(
            &mut store,
            0,
            1_000_000,
            render_request,
        )
        .unwrap();

        assert_eq!(
            record.status(),
            SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackStaleCallbackNode
        );
        assert!(record.stale_render_callback());
        assert!(!record.did_execute_accepted_render_callback());
        assert!(!record.accepted_root_scheduler_execution_evidence_for_canary());
        assert!(!record.drains_public_react_act_queue());
        assert!(!record.public_act_compatibility_claimed());
        assert!(!record.public_root_compatibility_claimed());
        assert!(!record.public_scheduler_timing_compatibility_claimed());
        assert!(!record.executes_effects());
        let expired = record.render_callback().unwrap();
        assert!(expired.rejected_stale_callback_node());
        assert_eq!(expired.requested_callback_node(), render_request.node());
        assert_eq!(
            expired.current_callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert!(expired.continuation().is_none());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_act_queue_execution_rejects_foreign_unqueued_request() {
        let (mut foreign_store, foreign_root, _foreign_host) = root_store();
        activate_act_queue(&mut foreign_store);
        schedule_default_update(&mut foreign_store, foreign_root);
        let foreign_request = foreign_store.scheduler_bridge().act_queue_requests()[0];

        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let record = execute_scheduler_bridge_act_queue_request_for_canary(
            &mut store,
            0,
            1_000_000,
            foreign_request,
        )
        .unwrap();

        assert_eq!(
            record.status(),
            SchedulerBridgeActQueueRequestExecutionStatus::RejectedUnqueuedRequest
        );
        assert!(record.rejected_unqueued_request());
        assert!(!record.did_process_root_schedule());
        assert!(!record.did_execute_accepted_render_callback());
        assert!(record.root_schedule().is_none());
        assert!(record.render_callback().is_none());
        assert!(!record.drains_public_react_act_queue());
        assert!(!record.public_act_compatibility_claimed());
        assert!(!record.public_root_compatibility_claimed());
        assert!(!record.public_scheduler_timing_compatibility_claimed());
        assert!(!record.executes_effects());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_act_queue_helper_routes_fabricated_continuation_to_existing_rejection() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        let fabricated = SyncFlushActContinuationDrainRecord {
            root: root_id,
            sync_flush_order: 88,
            flushed_lanes: Lanes::SYNC,
            remaining_lanes: Lanes::DEFAULT,
            continuation_lanes: Lanes::DEFAULT,
            act_scope_depth: 1,
            nested_act_scope: false,
            source_status: SchedulerActContinuationStatus::PendingContinuation,
            host_output_canary_committed: true,
        };

        let execution =
            execute_scheduler_bridge_act_queue_for_canary(&mut store, 1_000_000, &[fabricated])
                .unwrap();

        assert!(execution.request_records().is_empty());
        assert_eq!(execution.consumed_request_count(), 0);
        assert_eq!(execution.rejected_request_count(), 0);
        assert!(!execution.did_consume_queued_act_requests());
        assert!(!execution.did_execute_accepted_render_callbacks());
        assert!(!execution.routed_private_act_queue_requests_and_continuations_for_canary());
        assert!(!execution.drains_public_react_act_queue());
        assert!(!execution.public_act_compatibility_claimed());
        assert!(!execution.public_root_compatibility_claimed());
        assert!(!execution.public_flush_sync_compatibility_claimed());
        assert!(!execution.public_scheduler_timing_compatibility_claimed());
        assert!(!execution.executes_effects());

        let continuation_execution = execution.continuation_execution().unwrap();
        assert_eq!(continuation_execution.records().len(), 1);
        assert_eq!(continuation_execution.executed_count(), 0);
        assert_eq!(continuation_execution.rejected_count(), 1);
        assert_eq!(continuation_execution.blocked_count(), 0);
        assert!(!continuation_execution.did_execute_accepted_internal_act_continuations());
        let rejected = &continuation_execution.records()[0];
        assert_eq!(
            rejected.status(),
            SchedulerBridgeActContinuationExecutionStatus::RejectedContinuation
        );
        assert!(rejected.rejected_unaccepted_continuation());
        assert_eq!(rejected.continuation(), fabricated);
        assert!(!rejected.drains_public_react_act_queue());
        assert!(!rejected.public_act_compatibility_claimed());
        assert!(!rejected.public_flush_sync_compatibility_claimed());
        assert!(!rejected.public_scheduler_timing_compatibility_claimed());
        assert!(!rejected.executes_effects());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_suspended_unpinged_warm_lanes_do_not_schedule_async_callback() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_suspended(Lanes::DEFAULT, Lane::NO, true);

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(processed.records().len(), 1);
        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::NoWork
        );
        assert_eq!(processed.records()[0].next_lanes(), Lanes::NO);
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(scheduled_roots(&store).unwrap(), Vec::<FiberRootId>::new());
    }

    #[test]
    fn root_scheduler_pinged_suspended_lanes_schedule_async_callback() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        {
            let lanes = store.root_mut(root_id).unwrap().lanes_mut();
            lanes.mark_suspended(Lanes::DEFAULT, Lane::NO, true);
            lanes.mark_pinged(Lanes::DEFAULT);
        }

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        assert_eq!(processed.records()[0].next_lanes(), Lanes::DEFAULT);
        assert_eq!(
            processed.records()[0].scheduler_priority(),
            Some(SchedulerPriority::Normal)
        );
        assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
        assert_eq!(
            store.scheduler_bridge().callback_requests()[0].root(),
            root_id
        );
    }

    #[test]
    fn root_scheduler_pinged_retry_lane_schedules_deterministic_callback_metadata() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        let retry_lanes = Lanes::from(Lane::RETRY_1).merge_lane(Lane::RETRY_2);
        let retry_and_offscreen = retry_lanes.merge(Lanes::OFFSCREEN);
        {
            let lanes = store.root_mut(root_id).unwrap().lanes_mut();
            lanes.mark_updated(Lane::RETRY_1);
            lanes.mark_updated(Lane::RETRY_2);
            lanes.mark_updated(Lane::OFFSCREEN);
            lanes.mark_finished(RootFinishedLanes::new(Lanes::DEFAULT, retry_and_offscreen));
            lanes.mark_suspended(retry_and_offscreen, Lane::NO, true);
            lanes.mark_pinged(Lanes::from(Lane::RETRY_2));
        }

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let record = processed.records()[0];
        let scheduled_callback = record.scheduled_callback().unwrap();

        assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
        assert_eq!(record.next_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(
            record.callback_priority(),
            RootCallbackPriority::new(Lane::RETRY_2)
        );
        assert_eq!(record.callback_node(), scheduled_callback.node());
        assert_eq!(record.scheduler_priority(), Some(SchedulerPriority::Normal));
        assert_eq!(record.scheduled_act_queue_task(), None);
        assert_eq!(record.canceled_callback(), None);
        assert_eq!(scheduled_callback.root(), root_id);
        assert_eq!(
            scheduled_callback.callback_priority(),
            RootCallbackPriority::new(Lane::RETRY_2)
        );
        assert_eq!(
            scheduled_callback.scheduler_priority(),
            SchedulerPriority::Normal
        );
        assert_eq!(
            store.scheduler_bridge().callback_requests(),
            &[scheduled_callback]
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            scheduled_callback.node()
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .callback_priority(),
            RootCallbackPriority::new(Lane::RETRY_2)
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            retry_and_offscreen
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().suspended_lanes(),
            retry_and_offscreen
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pinged_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().warm_lanes(),
            Lanes::from(Lane::RETRY_1).merge(Lanes::OFFSCREEN)
        );
        assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_suspense_thenable_retry_request_marks_pinged_lanes_and_schedules_root() {
        let (mut store, root_id, host) = root_store();
        let suspense = attach_suspense_retry_boundary(
            &mut store,
            root_id,
            Lanes::from(Lane::RETRY_2),
            UpdateQueueHandle::from_raw(941),
            Some(UpdateQueueHandle::from_raw(942)),
        );
        mark_suspended_lane(&mut store, root_id, Lane::RETRY_2);

        let request =
            request_suspense_thenable_retry_root_scheduler(&mut store, root_id, &suspense).unwrap();

        assert_eq!(
            suspense.thenable_ping_blocker().retry_queue_kind(),
            UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen
        );
        assert!(
            suspense
                .thenable_ping_blocker()
                .is_accepted_suspense_retry_ping_blocker()
        );
        assert_eq!(
            request.status(),
            SuspenseThenableRetryRootSchedulerStatus::Accepted
        );
        assert!(request.accepted());
        assert!(request.thenable_ping_scheduled_expected_retry_lane());
        assert_eq!(request.root(), root_id);
        assert_eq!(request.boundary(), suspense.fiber());
        assert_eq!(request.retry_queue(), UpdateQueueHandle::from_raw(941));
        assert_eq!(
            request.primary_offscreen_retry_queue(),
            Some(UpdateQueueHandle::from_raw(942))
        );
        assert_eq!(request.retry_lane(), Lane::RETRY_2);
        assert_eq!(request.pinged_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(request.root_pinged_lanes_before(), Lanes::NO);
        assert_eq!(
            request.root_pinged_lanes_after(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            request.scheduler_callback_blockers(),
            &SUSPENSE_THENABLE_RETRY_SCHEDULER_CALLBACK_BLOCKERS
        );
        assert_eq!(
            request.scheduler_callback_blockers(),
            &[
                SuspenseThenableRetrySchedulerCallbackBlocker::SuspenseBoundaryRendering,
                SuspenseThenableRetrySchedulerCallbackBlocker::FallbackTraversal,
                SuspenseThenableRetrySchedulerCallbackBlocker::WakeableSubscription,
                SuspenseThenableRetrySchedulerCallbackBlocker::PublicSuspenseCompatibility,
            ]
        );
        assert!(!request.suspense_boundary_rendering_executed());
        assert!(!request.fallback_traversal_executed());
        assert!(!request.wakeable_subscription_performed());
        assert!(!request.public_suspense_compatibility_claimed());

        let scheduled_root = request.scheduled_root().unwrap();
        assert_eq!(scheduled_root.root(), root_id);
        assert!(scheduled_root.inserted());
        assert!(scheduled_root.microtask().is_some());
        assert_eq!(scheduled_root.act_queue_task(), None);
        assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().suspended_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pinged_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let scheduled_callback = processed.records()[0].scheduled_callback().unwrap();
        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        assert_eq!(
            processed.records()[0].next_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            scheduled_callback.callback_priority(),
            RootCallbackPriority::new(Lane::RETRY_2)
        );
        assert_eq!(
            store.scheduler_bridge().callback_requests(),
            &[scheduled_callback]
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_suspense_thenable_retry_request_rejects_blocked_records() {
        let (mut offscreen_store, offscreen_root, _host) = root_store();
        let offscreen_only = attach_suspense_retry_boundary(
            &mut offscreen_store,
            offscreen_root,
            Lanes::from(Lane::RETRY_1),
            UpdateQueueHandle::NONE,
            Some(UpdateQueueHandle::from_raw(952)),
        );
        mark_suspended_lane(&mut offscreen_store, offscreen_root, Lane::RETRY_1);

        let offscreen_request = request_suspense_thenable_retry_root_scheduler(
            &mut offscreen_store,
            offscreen_root,
            &offscreen_only,
        )
        .unwrap();

        assert_eq!(
            offscreen_only.thenable_ping_blocker().retry_queue_kind(),
            UnsupportedThenableRetryQueueKind::PrimaryOffscreen
        );
        assert!(
            offscreen_only
                .thenable_ping_blocker()
                .is_offscreen_only_retry_queue()
        );
        assert_eq!(
            offscreen_request.status(),
            SuspenseThenableRetryRootSchedulerStatus::RejectedOffscreenOnlyRecord
        );
        assert_eq!(offscreen_request.scheduled_root(), None);
        assert_eq!(
            offscreen_store
                .root(offscreen_root)
                .unwrap()
                .lanes()
                .pinged_lanes(),
            Lanes::NO
        );
        assert!(
            offscreen_store
                .scheduler_bridge()
                .microtask_requests()
                .is_empty()
        );

        let (mut stale_store, stale_root, _host) = root_store();
        let stale = attach_suspense_retry_boundary(
            &mut stale_store,
            stale_root,
            Lanes::from(Lane::RETRY_2),
            UpdateQueueHandle::from_raw(961),
            Some(UpdateQueueHandle::from_raw(962)),
        );
        mark_suspended_lane(&mut stale_store, stale_root, Lane::RETRY_2);
        let stale_host_root = stale_store.root(stale_root).unwrap().current();
        stale_store
            .fiber_arena_mut()
            .set_children(stale_host_root, &[])
            .unwrap();

        let stale_request =
            request_suspense_thenable_retry_root_scheduler(&mut stale_store, stale_root, &stale)
                .unwrap();

        assert_eq!(
            stale_request.status(),
            SuspenseThenableRetryRootSchedulerStatus::RejectedStaleBoundary
        );
        assert_eq!(stale_request.scheduled_root(), None);
        assert_eq!(
            stale_store.root(stale_root).unwrap().lanes().pinged_lanes(),
            Lanes::NO
        );
        assert!(
            stale_store
                .scheduler_bridge()
                .microtask_requests()
                .is_empty()
        );

        let (mut lane_store, lane_root, _host) = root_store();
        let incompatible_lanes = attach_suspense_retry_boundary(
            &mut lane_store,
            lane_root,
            Lanes::DEFAULT,
            UpdateQueueHandle::from_raw(971),
            Some(UpdateQueueHandle::from_raw(972)),
        );
        mark_suspended_lane(&mut lane_store, lane_root, Lane::DEFAULT);

        let lane_request = request_suspense_thenable_retry_root_scheduler(
            &mut lane_store,
            lane_root,
            &incompatible_lanes,
        )
        .unwrap();

        assert!(
            incompatible_lanes
                .thenable_ping_blocker()
                .has_suspense_boundary_retry_queue()
        );
        assert!(
            !incompatible_lanes
                .thenable_ping_blocker()
                .has_compatible_retry_ping_lanes()
        );
        assert_eq!(
            lane_request.status(),
            SuspenseThenableRetryRootSchedulerStatus::RejectedIncompatibleLaneSet
        );
        assert_eq!(lane_request.scheduled_root(), None);
        assert!(
            lane_store
                .scheduler_bridge()
                .microtask_requests()
                .is_empty()
        );

        let (mut root_lane_store, root_lane_root, _host) = root_store();
        let root_lane_mismatch = attach_suspense_retry_boundary(
            &mut root_lane_store,
            root_lane_root,
            Lanes::from(Lane::RETRY_3),
            UpdateQueueHandle::from_raw(981),
            Some(UpdateQueueHandle::from_raw(982)),
        );
        mark_suspended_lane(&mut root_lane_store, root_lane_root, Lane::RETRY_2);

        let root_lane_request = request_suspense_thenable_retry_root_scheduler(
            &mut root_lane_store,
            root_lane_root,
            &root_lane_mismatch,
        )
        .unwrap();

        assert!(
            root_lane_mismatch
                .thenable_ping_blocker()
                .has_compatible_retry_ping_lanes()
        );
        assert_eq!(
            root_lane_request.status(),
            SuspenseThenableRetryRootSchedulerStatus::RejectedIncompatibleLaneSet
        );
        assert_eq!(root_lane_request.scheduled_root(), None);
        assert_eq!(
            root_lane_store
                .root(root_lane_root)
                .unwrap()
                .lanes()
                .pinged_lanes(),
            Lanes::NO
        );
        assert!(
            root_lane_store
                .scheduler_bridge()
                .microtask_requests()
                .is_empty()
        );
    }

    #[test]
    fn root_scheduler_pinged_retry_execution_path_reselects_and_renders_host_root_handoff() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        let retry_lanes = Lanes::from(Lane::RETRY_1).merge_lane(Lane::RETRY_2);
        let retry_and_offscreen = retry_lanes.merge(Lanes::OFFSCREEN);
        {
            let lanes = store.root_mut(root_id).unwrap().lanes_mut();
            lanes.mark_updated(Lane::RETRY_1);
            lanes.mark_updated(Lane::RETRY_2);
            lanes.mark_updated(Lane::OFFSCREEN);
            lanes.mark_finished(RootFinishedLanes::new(Lanes::DEFAULT, retry_and_offscreen));
            lanes.mark_suspended(retry_and_offscreen, Lane::NO, true);
            lanes.mark_pinged(Lanes::from(Lane::RETRY_2));
        }
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let callback = processed.records()[0].scheduled_callback().unwrap();

        let execution = execute_pinged_retry_root_callback(&mut store, callback).unwrap();
        let render = execution.render_phase().unwrap();

        assert_eq!(execution.callback(), callback);
        assert_eq!(execution.root(), root_id);
        assert_eq!(execution.callback_node(), callback.node());
        assert!(!execution.validation().is_stale());
        assert_eq!(execution.status(), RootPingedRetryExecutionStatus::Rendered);
        assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(
            execution.selected_priority_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            execution.selected_render_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(render.root(), root_id);
        assert_eq!(render.current(), current);
        assert_eq!(render.render_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(render.applied_update_count(), 0);
        assert_eq!(render.skipped_update_count(), 1);
        assert_eq!(render.resulting_element(), RootElementHandle::NONE);
        assert_eq!(render.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .work_in_progress_root_render_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            retry_and_offscreen
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().suspended_lanes(),
            retry_and_offscreen
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pinged_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().warm_lanes(),
            Lanes::from(Lane::RETRY_1).merge(Lanes::OFFSCREEN)
        );
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_suspense_thenable_retry_render_handoff_records_root_work_loop_evidence() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let suspense = attach_suspense_retry_boundary(
            &mut store,
            root_id,
            Lanes::from(Lane::RETRY_2),
            UpdateQueueHandle::from_raw(996),
            Some(UpdateQueueHandle::from_raw(997)),
        );
        mark_suspended_lane(&mut store, root_id, Lane::RETRY_2);

        let request =
            request_suspense_thenable_retry_root_scheduler(&mut store, root_id, &suspense).unwrap();
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let schedule = processed.records()[0];
        let callback = schedule.scheduled_callback().unwrap();
        let handoff =
            execute_suspense_thenable_retry_root_render_handoff(&mut store, request, callback)
                .unwrap();
        let execution = handoff.execution();
        let render = handoff.render_phase().unwrap();

        assert_eq!(handoff.request(), request);
        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.boundary(), suspense.fiber());
        assert_eq!(handoff.retry_lane(), Lane::RETRY_2);
        assert_eq!(handoff.pinged_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(handoff.callback(), callback);
        assert_eq!(handoff.scheduled_root(), request.scheduled_root());
        assert!(handoff.thenable_ping_scheduled_expected_retry_lane());
        assert!(handoff.thenable_ping_reached_expected_retry_handoff());
        assert!(handoff.root_work_loop_reached());
        assert!(handoff.proves_private_thenable_ping_render_handoff());
        assert!(!handoff.suspense_boundary_rendering_executed());
        assert!(!handoff.fallback_traversal_executed());
        assert!(!handoff.wakeable_subscription_performed());
        assert!(!handoff.public_suspense_compatibility_claimed());
        assert!(!handoff.public_root_compatibility_claimed());

        assert_eq!(schedule.root(), root_id);
        assert_eq!(schedule.outcome(), RootTaskScheduleOutcome::Scheduled);
        assert_eq!(schedule.next_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(handoff.status(), RootPingedRetryExecutionStatus::Rendered);
        assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(
            execution.selected_priority_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            execution.selected_render_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(render.root(), root_id);
        assert_eq!(render.current(), current);
        assert_eq!(render.render_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(render.resulting_element(), RootElementHandle::NONE);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .render_exit_status(),
            RootRenderExitStatus::Completed
        );
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pinged_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_pinged_retry_execution_path_rejects_non_retry_selection() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let callback = scheduled_callback_request(&mut store, root_id);

        let execution = execute_pinged_retry_root_callback(&mut store, callback).unwrap();

        assert_eq!(
            execution.status(),
            RootPingedRetryExecutionStatus::NoPingedRetryWork
        );
        assert!(!execution.validation().is_stale());
        assert_eq!(execution.pinged_retry_lanes(), Lanes::NO);
        assert_eq!(execution.selected_priority_lanes(), Lanes::DEFAULT);
        assert_eq!(execution.selected_render_lanes(), Lanes::DEFAULT);
        assert_eq!(execution.render_phase(), None);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.fiber_arena().get(current).unwrap().alternate(), None);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            callback.node()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_pinged_retry_execution_path_rejects_non_retry_reselection() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let suspense = attach_suspense_retry_boundary(
            &mut store,
            root_id,
            Lanes::from(Lane::RETRY_2),
            UpdateQueueHandle::from_raw(991),
            Some(UpdateQueueHandle::from_raw(992)),
        );
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_updated(Lane::DEFAULT);
        mark_suspended_lane(&mut store, root_id, Lane::RETRY_2);
        let request =
            request_suspense_thenable_retry_root_scheduler(&mut store, root_id, &suspense).unwrap();
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let callback = processed.records()[0].scheduled_callback().unwrap();

        let execution =
            execute_suspense_thenable_retry_root_callback(&mut store, request, callback).unwrap();

        assert_eq!(
            execution.status(),
            RootPingedRetryExecutionStatus::NoPingedRetryWork
        );
        assert!(!execution.validation().is_stale());
        assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(execution.selected_priority_lanes(), Lanes::DEFAULT);
        assert_eq!(execution.selected_render_lanes(), Lanes::DEFAULT);
        assert_eq!(execution.render_phase(), None);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            None
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            callback.node()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_pinged_retry_execution_path_rejects_stale_thenable_blocker() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let suspense = attach_suspense_retry_boundary(
            &mut store,
            root_id,
            Lanes::from(Lane::RETRY_2),
            UpdateQueueHandle::from_raw(993),
            Some(UpdateQueueHandle::from_raw(994)),
        );
        mark_suspended_lane(&mut store, root_id, Lane::RETRY_2);
        let request =
            request_suspense_thenable_retry_root_scheduler(&mut store, root_id, &suspense).unwrap();
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let callback = processed.records()[0].scheduled_callback().unwrap();
        store
            .fiber_arena_mut()
            .get_mut(suspense.fiber())
            .unwrap()
            .set_update_queue(UpdateQueueHandle::from_raw(995));

        let execution =
            execute_suspense_thenable_retry_root_callback(&mut store, request, callback).unwrap();

        assert_eq!(
            execution.status(),
            RootPingedRetryExecutionStatus::StaleThenableBlocker
        );
        assert!(!execution.validation().is_stale());
        assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(execution.selected_priority_lanes(), Lanes::NO);
        assert_eq!(execution.selected_render_lanes(), Lanes::NO);
        assert_eq!(execution.render_phase(), None);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            None
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            callback.node()
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pinged_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_prewarm_lane_selection_fails_closed_with_pending_commit() {
        let mut root_lanes = RootLaneState::new();
        root_lanes.mark_updated(Lane::DEFAULT);
        root_lanes.mark_suspended(Lanes::DEFAULT, Lane::NO, false);

        let without_pending_commit = select_lanes_from_root_state(&root_lanes, Lanes::NO, false);
        let with_pending_commit = select_lanes_from_root_state(&root_lanes, Lanes::NO, true);

        assert_eq!(without_pending_commit.priority_lanes(), Lanes::DEFAULT);
        assert_eq!(without_pending_commit.render_lanes(), Lanes::DEFAULT);
        assert_eq!(with_pending_commit.priority_lanes(), Lanes::NO);
        assert_eq!(with_pending_commit.render_lanes(), Lanes::NO);
    }

    #[test]
    fn root_scheduler_idle_work_waits_behind_suspended_non_idle_work() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        {
            let lanes = store.root_mut(root_id).unwrap().lanes_mut();
            lanes.mark_suspended(Lanes::DEFAULT, Lane::NO, true);
            lanes.mark_updated(Lane::IDLE);
        }

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::NoWork
        );
        assert_eq!(processed.records()[0].next_lanes(), Lanes::NO);
        assert!(store.scheduler_bridge().callback_requests().is_empty());
    }

    #[test]
    fn root_scheduler_entangled_lanes_expand_after_priority_selection() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        {
            let lanes = store.root_mut(root_id).unwrap().lanes_mut();
            lanes.mark_updated(Lane::TRANSITION_1);
            lanes.mark_entangled(Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1));
        }

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let record = processed.records()[0];

        assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
        assert_eq!(
            record.next_lanes(),
            Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1)
        );
        assert_eq!(
            record.callback_priority(),
            RootCallbackPriority::new(Lane::DEFAULT)
        );
        assert_eq!(record.scheduler_priority(), Some(SchedulerPriority::Normal));
    }

    #[test]
    fn root_scheduler_execute_callback_renders_matching_host_root_callback() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let callback = scheduled_callback_request(&mut store, root_id);

        let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();
        let render = execution.render_phase().unwrap();

        assert_eq!(
            execution.status(),
            RootSchedulerCallbackExecutionStatus::Rendered
        );
        assert_eq!(execution.callback(), callback);
        assert_eq!(execution.root(), root_id);
        assert_eq!(execution.callback_node(), callback.node());
        assert!(!execution.validation().is_stale());
        assert_eq!(execution.selected_lanes(), Lanes::DEFAULT);
        assert_eq!(render.root(), root_id);
        assert_eq!(render.current(), current);
        assert_eq!(render.applied_update_count(), 1);
        assert_eq!(render.resulting_element(), RootElementHandle::from_raw(1));
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_execute_callback_reports_stale_callback_without_rendering() {
        let (mut store, root_id, _host) = root_store();
        let callback = scheduled_callback_request(&mut store, root_id);
        let sync_result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
        process_root_schedule_in_microtask(&mut store).unwrap();
        let current = store.root(root_id).unwrap().current();

        let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();

        assert_eq!(
            execution.status(),
            RootSchedulerCallbackExecutionStatus::StaleCallback
        );
        assert!(execution.validation().is_stale());
        assert_eq!(
            execution.validation().requested_callback_node(),
            callback.node()
        );
        assert_eq!(execution.selected_lanes(), Lanes::NO);
        assert_eq!(execution.render_phase(), None);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.fiber_arena().get(current).unwrap().alternate(), None);
    }

    #[test]
    fn root_scheduler_execute_callback_reports_no_work_without_rendering() {
        let (mut store, root_id, _host) = root_store();
        let callback = scheduled_callback_request(&mut store, root_id);
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_finished(RootFinishedLanes::new(Lanes::DEFAULT, Lanes::NO));
        let current = store.root(root_id).unwrap().current();

        let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();

        assert_eq!(
            execution.status(),
            RootSchedulerCallbackExecutionStatus::NoWork
        );
        assert!(!execution.validation().is_stale());
        assert_eq!(execution.selected_lanes(), Lanes::NO);
        assert_eq!(execution.render_phase(), None);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .callback_priority(),
            RootCallbackPriority::NO
        );
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.fiber_arena().get(current).unwrap().alternate(), None);
    }

    #[test]
    fn root_scheduler_execute_callback_rechecks_suspended_lane_selection() {
        let (mut store, root_id, _host) = root_store();
        let callback = scheduled_callback_request(&mut store, root_id);
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_suspended(Lanes::DEFAULT, Lane::NO, true);
        let current = store.root(root_id).unwrap().current();

        let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();

        assert_eq!(
            execution.status(),
            RootSchedulerCallbackExecutionStatus::NoWork
        );
        assert_eq!(execution.selected_lanes(), Lanes::NO);
        assert_eq!(execution.render_phase(), None);
        assert_eq!(store.root(root_id).unwrap().current(), current);
    }

    #[test]
    fn root_scheduler_microtask_cancels_existing_callback_when_reselection_finds_no_work() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let original_node = store.root(root_id).unwrap().scheduling().callback_node();

        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_suspended(Lanes::DEFAULT, Lane::NO, true);
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let record = processed.records()[0];

        assert_eq!(record.outcome(), RootTaskScheduleOutcome::NoWork);
        assert_eq!(record.next_lanes(), Lanes::NO);
        assert_eq!(record.canceled_callback().unwrap().node(), original_node);
        assert_eq!(store.scheduler_bridge().cancellation_records().len(), 1);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(scheduled_roots(&store).unwrap(), Vec::<FiberRootId>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_microtask_cancels_callback_when_reselection_changes_callback_lane() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let original_node = store.root(root_id).unwrap().scheduling().callback_node();

        mark_default_suspended_with_pending_transition(&mut store, root_id);
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let record = processed.records()[0];

        assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
        assert_eq!(record.next_lanes(), Lanes::from(Lane::TRANSITION_1));
        assert_eq!(
            record.callback_priority(),
            RootCallbackPriority::new(Lane::TRANSITION_1)
        );
        assert_eq!(record.scheduler_priority(), Some(SchedulerPriority::Normal));
        assert_eq!(record.canceled_callback().unwrap().node(), original_node);
        assert_eq!(store.scheduler_bridge().cancellation_records().len(), 1);
        assert_eq!(store.scheduler_bridge().callback_requests().len(), 2);
        assert_ne!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            original_node
        );
        assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_execute_callback_reselects_lanes_before_render_handoff() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let callback = scheduled_callback_request(&mut store, root_id);

        mark_default_suspended_with_pending_transition(&mut store, root_id);
        let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();
        let render = execution.render_phase().unwrap();

        assert_eq!(
            execution.status(),
            RootSchedulerCallbackExecutionStatus::Rendered
        );
        assert!(!execution.validation().is_stale());
        assert_eq!(execution.selected_lanes(), Lanes::from(Lane::TRANSITION_1));
        assert_eq!(render.render_lanes(), Lanes::from(Lane::TRANSITION_1));
        assert_eq!(render.applied_update_count(), 0);
        assert_eq!(render.skipped_update_count(), 1);
        assert_eq!(render.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_reuses_equal_priority_callback() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let original_node = store.root(root_id).unwrap().scheduling().callback_node();

        schedule_default_update(&mut store, root_id);
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Reused
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            original_node
        );
        assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
        assert!(store.scheduler_bridge().cancellation_records().is_empty());
    }

    #[test]
    fn root_scheduler_act_queue_cancels_real_callback_before_rerouting() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let original_node = store.root(root_id).unwrap().scheduling().callback_node();

        activate_act_queue(&mut store);
        schedule_default_update(&mut store, root_id);
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        let record = processed.records()[0];
        assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
        assert_eq!(record.canceled_callback().unwrap().node(), original_node);
        assert!(record.scheduled_callback().is_none());
        assert!(record.scheduled_act_queue_task().is_some());
        assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
        assert_eq!(store.scheduler_bridge().cancellation_records().len(), 1);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            SchedulerBridge::fake_act_callback_node()
        );
    }

    #[test]
    fn root_scheduler_canceling_fake_act_callback_is_noop() {
        let (mut store, root_id, _host) = root_store();
        activate_act_queue(&mut store);
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();

        let sync_result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Sync
        );
        assert_eq!(processed.records()[0].canceled_callback(), None);
        assert!(store.scheduler_bridge().cancellation_records().is_empty());
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
    }

    #[test]
    fn root_scheduler_priority_change_cancels_stale_callback_and_replaces_after_sync_clears() {
        let (mut store, root_id, _host) = root_store();
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let original_node = store.root(root_id).unwrap().scheduling().callback_node();

        let sync_result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
        let sync_processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(
            sync_processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Sync
        );
        assert_eq!(
            sync_processed.records()[0]
                .canceled_callback()
                .unwrap()
                .node(),
            original_node
        );
        assert_eq!(store.scheduler_bridge().cancellation_records().len(), 1);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            RootSchedulerCallbackHandle::NONE
        );

        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_finished(RootFinishedLanes::new(Lanes::SYNC, Lanes::NO));
        let replacement = schedule_default_update(&mut store, root_id);
        let replacement_processed = process_root_schedule_in_microtask(&mut store).unwrap();

        assert!(!replacement.inserted());
        assert_eq!(
            replacement_processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        assert_eq!(store.scheduler_bridge().callback_requests().len(), 2);
        assert_ne!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            original_node
        );
    }

    #[test]
    fn root_scheduler_no_render_commit_or_host_mutation_side_effects() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();

        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_passive_root_error_capture_schedules_sync_metadata_without_callbacks() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let root_id = store
            .create_client_root(
                FakeContainer::new(1),
                RootOptions::new()
                    .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(701))
                    .with_on_caught_error(RootErrorCallbackHandle::from_raw(702))
                    .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(703)),
            )
            .unwrap();
        let current = store.root(root_id).unwrap().current();
        let microtask_count = store.scheduler_bridge().microtask_requests().len();

        let first = capture_passive_effect_root_error(
            &mut store,
            root_id,
            current,
            RootErrorCaptureSource::PassiveEffectDestroy,
        )
        .unwrap();

        assert_eq!(first.source(), RootErrorCaptureSource::PassiveEffectDestroy);
        assert_eq!(first.root(), root_id);
        assert_eq!(first.root_fiber(), current);
        assert_eq!(first.source_fiber(), current);
        assert_eq!(first.lane(), Lane::SYNC);
        assert_eq!(first.pending_lanes_before(), Lanes::NO);
        assert_eq!(first.pending_lanes_after(), Lanes::SYNC);
        assert_eq!(
            first.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(701)
        );
        assert_eq!(
            first.on_caught_error(),
            RootErrorCallbackHandle::from_raw(702)
        );
        assert_eq!(
            first.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(703)
        );
        let first_callbacks = first.error_option_callbacks();
        assert_eq!(first_callbacks.root(), root_id);
        assert_eq!(
            first_callbacks.phase(),
            RootErrorOptionCallbackPhase::Commit
        );
        assert_eq!(
            first_callbacks.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(701)
        );
        assert_eq!(
            first_callbacks.on_caught_error(),
            RootErrorCallbackHandle::from_raw(702)
        );
        assert_eq!(
            first_callbacks.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(703)
        );
        assert!(!first_callbacks.root_error_callbacks_invoked());
        assert!(!first_callbacks.public_error_boundaries_enabled());
        assert!(!first_callbacks.recoverable_error_compatibility_claimed());
        assert!(first.root_error_update_scheduled());
        assert!(first.has_configured_error_callback());
        assert!(!first.root_error_callbacks_invoked());
        assert!(!first.public_act_error_aggregation_enabled());
        assert!(first.scheduled_root().inserted());
        assert_eq!(first.scheduled_root().root(), root_id);
        assert_eq!(
            store.scheduler_bridge().microtask_requests().len(),
            microtask_count + 1
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());

        let second = capture_passive_effect_root_error(
            &mut store,
            root_id,
            current,
            RootErrorCaptureSource::PassiveEffectMountCreate,
        )
        .unwrap();

        assert_eq!(
            second.source(),
            RootErrorCaptureSource::PassiveEffectMountCreate
        );
        assert_eq!(second.pending_lanes_before(), Lanes::SYNC);
        assert_eq!(second.pending_lanes_after(), Lanes::SYNC);
        assert!(!second.scheduled_root().inserted());
        assert!(second.root_error_update_scheduled());
        assert!(!second.root_error_callbacks_invoked());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::SYNC
        );
        assert_eq!(
            store.scheduler_bridge().microtask_requests().len(),
            microtask_count + 1
        );
        assert!(host.operations().is_empty());
    }

    #[test]
    fn root_scheduler_render_error_option_callback_record_preserves_handles_without_callbacks() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let root_id = store
            .create_client_root(
                FakeContainer::new(1),
                RootOptions::new()
                    .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(711))
                    .with_on_caught_error(RootErrorCallbackHandle::from_raw(712))
                    .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(713)),
            )
            .unwrap();
        let current = store.root(root_id).unwrap().current();
        let error = RootWorkLoopError::MissingHostRootUpdateQueue {
            root: root_id,
            fiber: current,
        };

        let record =
            record_root_render_error_option_callbacks(&store, root_id, Lanes::DEFAULT, error)
                .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(record.render_lanes(), Lanes::DEFAULT);
        assert!(matches!(
            record.error(),
            RootWorkLoopError::MissingHostRootUpdateQueue { root, fiber }
                if *root == root_id && *fiber == current
        ));
        assert_eq!(
            record.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(711)
        );
        assert_eq!(
            record.on_caught_error(),
            RootErrorCallbackHandle::from_raw(712)
        );
        assert_eq!(
            record.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(713)
        );
        let callbacks = record.error_option_callbacks();
        assert_eq!(callbacks.root(), root_id);
        assert_eq!(callbacks.phase(), RootErrorOptionCallbackPhase::Render);
        assert!(record.has_configured_error_callback());
        assert!(!record.root_error_callbacks_invoked());
        assert!(!record.public_error_boundaries_enabled());
        assert!(!record.recoverable_error_compatibility_claimed());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
        assert!(host.operations().is_empty());
    }

    #[test]
    fn root_scheduler_act_routing_has_no_render_commit_or_host_mutation_side_effects() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        activate_act_queue(&mut store);

        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();

        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
    }

    #[test]
    fn root_scheduler_sync_flush_plan_uses_fast_path_and_reentry_guard() {
        let (mut store, root_id, _host) = root_store();

        let empty_plan = collect_sync_flush_plan(&mut store).unwrap();

        assert!(empty_plan.skipped_no_sync_work());
        assert!(!empty_plan.skipped_reentrant_flush());
        assert!(empty_plan.sync_roots().is_empty());

        let result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        ensure_root_is_scheduled(&mut store, result.schedule()).unwrap();

        let sync_plan = collect_sync_flush_plan(&mut store).unwrap();

        assert_eq!(sync_plan.sync_roots(), &[root_id]);
        assert!(!store.root_scheduler().is_flushing_work());

        store.root_scheduler_mut().set_is_flushing_work(true);
        let reentrant_plan = collect_sync_flush_plan(&mut store).unwrap();
        store.root_scheduler_mut().set_is_flushing_work(false);

        assert!(reentrant_plan.skipped_reentrant_flush());
        assert!(reentrant_plan.sync_roots().is_empty());
    }

    #[test]
    fn root_scheduler_sync_flush_lanes_filter_non_sync_lanes_and_recompute_flag() {
        let (mut store, root_id, _host) = root_store();
        let sync_result =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(1), None)
                .unwrap();
        ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
        schedule_default_update(&mut store, root_id);

        let sync_lanes = sync_flush_lanes_for_root(&store, root_id).unwrap();

        assert_eq!(sync_lanes, Lanes::SYNC);
        assert!(
            !sync_lanes.contains_lane(Lane::DEFAULT),
            "default work must stay out of the sync flush lane set"
        );

        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_finished(RootFinishedLanes::new(Lanes::SYNC, Lanes::DEFAULT));
        let still_has_sync = recompute_might_have_pending_sync_work(&mut store).unwrap();

        assert!(!still_has_sync);
        assert!(!store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::DEFAULT
        );
    }

    #[test]
    fn root_scheduler_sync_flush_act_continuation_lanes_use_post_commit_selection() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let sync_result =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(1), None)
                .unwrap();
        ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
        schedule_default_update(&mut store, root_id);

        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_finished(RootFinishedLanes::new(Lanes::SYNC, Lanes::DEFAULT));

        let continuation_lanes =
            sync_flush_act_continuation_lanes_for_root(&store, root_id).unwrap();

        assert_eq!(continuation_lanes, Lanes::DEFAULT);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_flush_act_continuation_lanes_respect_suspended_selection() {
        let (mut store, root_id, host) = root_store();
        schedule_default_update(&mut store, root_id);
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_suspended(Lanes::DEFAULT, Lane::NO, true);

        let continuation_lanes =
            sync_flush_act_continuation_lanes_for_root(&store, root_id).unwrap();

        assert_eq!(continuation_lanes, Lanes::NO);
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_flush_act_post_passive_gate_records_pending_passive_metadata() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(91));
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
        let finished_work = render.finished_work();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(root_id, Lanes::NO);
        let commit = commit_finished_host_root(&mut store, render).unwrap();

        store.scheduler_bridge_mut().enter_act_scope();
        store.scheduler_bridge_mut().enter_act_scope();
        let act_continuation = store
            .scheduler_bridge_mut()
            .record_sync_flush_act_continuation(root_id, 7, Lanes::SYNC, Lanes::NO, Lanes::NO);

        let gate = sync_flush_act_post_passive_continuation_gate(
            act_continuation,
            commit.pending_passive_handoff(),
        )
        .unwrap();

        assert_eq!(gate.root(), root_id);
        assert_eq!(gate.sync_flush_order(), 7);
        assert_eq!(gate.flushed_lanes(), Lanes::SYNC);
        assert_eq!(gate.remaining_lanes(), Lanes::NO);
        assert_eq!(gate.continuation_lanes(), Lanes::NO);
        assert_eq!(gate.pending_passive_finished_work(), finished_work);
        assert_eq!(gate.pending_passive_lanes(), Lanes::SYNC);
        assert_eq!(gate.pending_passive_unmount_count(), 0);
        assert_eq!(gate.pending_passive_mount_count(), 0);
        assert_eq!(gate.pending_passive_record_count(), 0);
        assert_eq!(gate.act_scope_depth(), 2);
        assert!(gate.nested_act_scope());
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .pending_passive()
                .has_commit_handoff()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_flush_act_post_passive_gate_requires_act_and_passive_handoff() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(92));
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
        store.scheduler_bridge_mut().enter_act_scope();
        let act_continuation = store
            .scheduler_bridge_mut()
            .record_sync_flush_act_continuation(root_id, 8, Lanes::SYNC, Lanes::NO, Lanes::NO);
        let commit_without_passive = commit_finished_host_root(&mut store, render).unwrap();

        assert_eq!(
            sync_flush_act_post_passive_continuation_gate(act_continuation, None),
            None
        );
        assert_eq!(
            sync_flush_act_post_passive_continuation_gate(
                act_continuation,
                commit_without_passive.pending_passive_handoff()
            ),
            None
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_act_continuation_drain_accepts_only_pending_after_canary() {
        let (mut store, root_id, host) = root_store();
        store.scheduler_bridge_mut().enter_act_scope();
        let pending = store
            .scheduler_bridge_mut()
            .record_sync_flush_act_continuation(
                root_id,
                9,
                Lanes::SYNC,
                Lanes::DEFAULT,
                Lanes::DEFAULT,
            )
            .unwrap();
        let no_continuation = store
            .scheduler_bridge_mut()
            .record_sync_flush_act_continuation(root_id, 10, Lanes::SYNC, Lanes::NO, Lanes::NO)
            .unwrap();

        let drained =
            sync_flush_act_continuation_drain_record_after_host_output_canary(pending, true)
                .unwrap();

        assert_eq!(drained.root(), root_id);
        assert_eq!(drained.sync_flush_order(), 9);
        assert_eq!(drained.flushed_lanes(), Lanes::SYNC);
        assert_eq!(drained.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(drained.continuation_lanes(), Lanes::DEFAULT);
        assert_eq!(drained.act_scope_depth(), 1);
        assert!(!drained.nested_act_scope());
        assert_eq!(
            drained.source_status(),
            SchedulerActContinuationStatus::PendingContinuation
        );
        assert!(drained.host_output_canary_committed());
        assert!(drained.is_accepted_internal_act_continuation());
        assert!(!drained.drains_public_react_act_queue());
        assert!(!drained.public_act_compatibility_claimed());
        assert!(!drained.public_flush_sync_compatibility_claimed());
        assert!(!drained.executes_queued_work());
        assert!(!drained.executes_effects());
        assert_eq!(
            sync_flush_act_continuation_drain_record_after_host_output_canary(pending, false),
            None
        );
        assert_eq!(
            sync_flush_act_continuation_drain_record_after_host_output_canary(
                no_continuation,
                true,
            ),
            None
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_scheduler_bridge_act_continuation_execution_commits_accepted_work() {
        let (mut store, root_id, host) = root_store();
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_default_update(&mut store, root_id);
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let pending = store
            .scheduler_bridge_mut()
            .record_sync_flush_act_continuation(
                root_id,
                11,
                Lanes::SYNC,
                Lanes::DEFAULT,
                Lanes::DEFAULT,
            )
            .unwrap();
        let accepted =
            sync_flush_act_continuation_drain_record_after_host_output_canary(pending, true)
                .unwrap();

        let result = execute_scheduler_bridge_act_continuations(&mut store, &[accepted]).unwrap();

        assert_eq!(result.records().len(), 1);
        assert_eq!(result.executed_count(), 1);
        assert_eq!(result.rejected_count(), 0);
        assert_eq!(result.blocked_count(), 0);
        assert!(result.did_execute_accepted_internal_act_continuations());
        assert!(result.records_preserve_sync_flush_order());
        assert!(!result.drains_public_react_act_queue());
        assert!(!result.public_act_compatibility_claimed());
        assert!(!result.public_flush_sync_compatibility_claimed());
        assert!(!result.public_scheduler_timing_compatibility_claimed());
        assert!(!result.executes_effects());

        let record = &result.records()[0];
        assert_eq!(record.execution_order(), 0);
        assert_eq!(
            record.status(),
            SchedulerBridgeActContinuationExecutionStatus::RenderedAndCommitted
        );
        assert_eq!(record.root(), root_id);
        assert_eq!(record.requested_lanes(), Lanes::DEFAULT);
        assert_eq!(record.selected_lanes(), Lanes::DEFAULT);
        assert_eq!(record.pending_lanes_before_execution(), Lanes::DEFAULT);
        assert_eq!(record.pending_lanes_after_execution(), Lanes::NO);
        assert!(record.did_execute_accepted_internal_act_continuation());
        assert!(record.accepted_root_scheduler_execution_evidence_for_canary());
        assert!(record.accepted_root_commit_execution_evidence_for_canary());
        assert!(record.routed_through_root_scheduler_and_commit_evidence_for_canary());
        assert!(record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary());
        assert!(!record.drains_public_react_act_queue());
        assert!(!record.public_act_compatibility_claimed());
        assert!(!record.public_flush_sync_compatibility_claimed());
        assert!(!record.public_scheduler_timing_compatibility_claimed());
        assert!(!record.executes_effects());
        let handoff = record.root_commit_handoff_for_canary().unwrap();
        assert!(handoff.proves_private_root_finished_work_commit_metadata_handoff());
        assert_eq!(handoff.pending().root(), root_id);
        assert_eq!(
            handoff.pending().root_finished_work(),
            Some(handoff.pending().finished_work())
        );
        assert_eq!(handoff.pending().render_lanes(), Lanes::DEFAULT);
        assert_eq!(handoff.execution_request().render_lanes(), Lanes::DEFAULT);
        assert!(handoff.execution_request().records_root_finished_work());
        assert!(handoff.execution_request().compatibility_claim_blocked());
        let render_phase = record.render_phase().unwrap();
        assert_eq!(render_phase.root(), root_id);
        assert_eq!(render_phase.render_lanes(), Lanes::DEFAULT);
        assert_eq!(
            render_phase.resulting_element(),
            RootElementHandle::from_raw(1)
        );
        let commit = record.commit().unwrap();
        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(commit.remaining_lanes(), Lanes::NO);
        assert_eq!(store.root(root_id).unwrap().current(), commit.current());
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
        assert!(!store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_nested_act_continuations_preserve_order_and_remaining_lanes() {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let first = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        store.scheduler_bridge_mut().enter_act_scope();
        store.scheduler_bridge_mut().enter_act_scope();

        let first_default =
            update_container(&mut store, first, RootElementHandle::from_raw(21), None).unwrap();
        ensure_root_is_scheduled(&mut store, first_default.schedule()).unwrap();
        let first_transition = update_container_transition_for_canary(
            &mut store,
            first,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(22),
            None,
        )
        .unwrap();
        ensure_root_is_scheduled(&mut store, first_transition.schedule()).unwrap();
        let second_default =
            update_container(&mut store, second, RootElementHandle::from_raw(23), None).unwrap();
        ensure_root_is_scheduled(&mut store, second_default.schedule()).unwrap();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let first_continuation = store
            .scheduler_bridge_mut()
            .record_sync_flush_act_continuation(
                first,
                0,
                Lanes::SYNC,
                Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1),
                Lanes::DEFAULT,
            )
            .unwrap();
        let second_continuation = store
            .scheduler_bridge_mut()
            .record_sync_flush_act_continuation(
                second,
                1,
                Lanes::SYNC,
                Lanes::DEFAULT,
                Lanes::DEFAULT,
            )
            .unwrap();
        let first_accepted = sync_flush_act_continuation_drain_record_after_host_output_canary(
            first_continuation,
            true,
        )
        .unwrap();
        let second_accepted = sync_flush_act_continuation_drain_record_after_host_output_canary(
            second_continuation,
            true,
        )
        .unwrap();

        let result = execute_scheduler_bridge_act_continuations(
            &mut store,
            &[first_accepted, second_accepted],
        )
        .unwrap();

        assert_eq!(result.records().len(), 2);
        assert_eq!(result.executed_count(), 2);
        assert_eq!(result.rejected_count(), 0);
        assert_eq!(result.blocked_count(), 0);
        assert!(result.did_execute_accepted_internal_act_continuations());
        assert!(result.records_preserve_sync_flush_order());
        assert!(result.preserves_nested_act_root_continuation_order_and_lanes_for_canary());
        assert!(!result.drains_public_react_act_queue());
        assert!(!result.public_act_compatibility_claimed());
        assert!(!result.public_flush_sync_compatibility_claimed());
        assert!(!result.public_scheduler_timing_compatibility_claimed());
        assert!(!result.executes_effects());

        let first_record = &result.records()[0];
        assert_eq!(first_record.execution_order(), 0);
        assert_eq!(first_record.root(), first);
        assert_eq!(first_record.continuation().sync_flush_order(), 0);
        assert!(first_record.continuation().nested_act_scope());
        assert_eq!(first_record.requested_lanes(), Lanes::DEFAULT);
        assert_eq!(first_record.selected_lanes(), Lanes::DEFAULT);
        assert_eq!(
            first_record.pending_lanes_before_execution(),
            Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1)
        );
        assert_eq!(
            first_record.pending_lanes_after_execution(),
            Lanes::from(Lane::TRANSITION_1)
        );
        assert!(
            first_record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary()
        );
        assert_eq!(
            first_record.render_phase().unwrap().resulting_element(),
            RootElementHandle::from_raw(21)
        );
        assert_eq!(
            first_record.commit().unwrap().pending_lanes(),
            Lanes::from(Lane::TRANSITION_1)
        );

        let second_record = &result.records()[1];
        assert_eq!(second_record.execution_order(), 1);
        assert_eq!(second_record.root(), second);
        assert_eq!(second_record.continuation().sync_flush_order(), 1);
        assert!(second_record.continuation().nested_act_scope());
        assert_eq!(second_record.requested_lanes(), Lanes::DEFAULT);
        assert_eq!(second_record.selected_lanes(), Lanes::DEFAULT);
        assert_eq!(
            second_record.pending_lanes_before_execution(),
            Lanes::DEFAULT
        );
        assert_eq!(second_record.pending_lanes_after_execution(), Lanes::NO);
        assert!(
            second_record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary()
        );
        assert_eq!(
            second_record.render_phase().unwrap().resulting_element(),
            RootElementHandle::from_raw(23)
        );

        assert_eq!(
            store.root(first).unwrap().lanes().pending_lanes(),
            Lanes::from(Lane::TRANSITION_1)
        );
        assert_eq!(
            store.root(second).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_scheduler_bridge_act_continuation_execution_rejects_unaccepted_records() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        let unaccepted = SyncFlushActContinuationDrainRecord {
            root: root_id,
            sync_flush_order: 12,
            flushed_lanes: Lanes::SYNC,
            remaining_lanes: Lanes::DEFAULT,
            continuation_lanes: Lanes::DEFAULT,
            act_scope_depth: 1,
            nested_act_scope: false,
            source_status: SchedulerActContinuationStatus::NoContinuation,
            host_output_canary_committed: true,
        };

        let result = execute_scheduler_bridge_act_continuations(&mut store, &[unaccepted]).unwrap();

        assert_eq!(result.records().len(), 1);
        assert_eq!(result.executed_count(), 0);
        assert_eq!(result.rejected_count(), 1);
        assert_eq!(result.blocked_count(), 0);
        assert!(!result.did_execute_accepted_internal_act_continuations());
        let record = &result.records()[0];
        assert_eq!(
            record.status(),
            SchedulerBridgeActContinuationExecutionStatus::RejectedContinuation
        );
        assert!(record.rejected_unaccepted_continuation());
        assert_eq!(record.selected_lanes(), Lanes::NO);
        assert_eq!(record.render_phase(), None);
        assert!(record.commit().is_none());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_scheduler_bridge_act_continuation_execution_rejects_fabricated_sequence() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        store.scheduler_bridge_mut().enter_act_scope();
        schedule_default_update(&mut store, root_id);
        let fabricated = SyncFlushActContinuationDrainRecord {
            root: root_id,
            sync_flush_order: 99,
            flushed_lanes: Lanes::SYNC,
            remaining_lanes: Lanes::DEFAULT,
            continuation_lanes: Lanes::DEFAULT,
            act_scope_depth: 1,
            nested_act_scope: false,
            source_status: SchedulerActContinuationStatus::PendingContinuation,
            host_output_canary_committed: true,
        };

        let result = execute_scheduler_bridge_act_continuations(&mut store, &[fabricated]).unwrap();

        assert_eq!(result.records().len(), 1);
        assert_eq!(result.executed_count(), 0);
        assert_eq!(result.rejected_count(), 1);
        assert_eq!(result.blocked_count(), 0);
        assert!(!result.did_execute_accepted_internal_act_continuations());
        assert!(!result.drains_public_react_act_queue());
        assert!(!result.public_act_compatibility_claimed());
        assert!(!result.public_flush_sync_compatibility_claimed());
        assert!(!result.public_scheduler_timing_compatibility_claimed());
        assert!(!result.executes_effects());
        let record = &result.records()[0];
        assert_eq!(
            record.status(),
            SchedulerBridgeActContinuationExecutionStatus::RejectedContinuation
        );
        assert!(record.rejected_unaccepted_continuation());
        assert_eq!(record.continuation(), fabricated);
        assert_eq!(record.selected_lanes(), Lanes::NO);
        assert_eq!(record.render_phase(), None);
        assert!(record.commit().is_none());
        assert!(!record.drains_public_react_act_queue());
        assert!(!record.public_act_compatibility_claimed());
        assert!(!record.public_flush_sync_compatibility_claimed());
        assert!(!record.public_scheduler_timing_compatibility_claimed());
        assert!(!record.executes_effects());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_scheduler_bridge_act_continuation_execution_blocks_stale_lane_order() {
        let (mut store, root_id, host) = root_store();
        store.scheduler_bridge_mut().enter_act_scope();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        let pending = store
            .scheduler_bridge_mut()
            .record_sync_flush_act_continuation(
                root_id,
                13,
                Lanes::SYNC,
                Lanes::DEFAULT,
                Lanes::DEFAULT,
            )
            .unwrap();
        let accepted =
            sync_flush_act_continuation_drain_record_after_host_output_canary(pending, true)
                .unwrap();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(2));

        let result = execute_scheduler_bridge_act_continuations(&mut store, &[accepted]).unwrap();

        assert_eq!(result.records().len(), 1);
        assert_eq!(result.executed_count(), 0);
        assert_eq!(result.rejected_count(), 0);
        assert_eq!(result.blocked_count(), 1);
        let record = &result.records()[0];
        assert_eq!(
            record.status(),
            SchedulerBridgeActContinuationExecutionStatus::BlockedByLaneMismatch
        );
        assert!(record.blocked_by_lane_mismatch());
        assert_eq!(record.requested_lanes(), Lanes::DEFAULT);
        assert!(record.selected_lanes().contains_lane(Lane::SYNC));
        assert!(record.selected_lanes().contains_lane(Lane::DEFAULT));
        assert_eq!(record.render_phase(), None);
        assert!(record.commit().is_none());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
        assert!(pending_lanes.contains_lane(Lane::SYNC));
        assert!(pending_lanes.contains_lane(Lane::DEFAULT));
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_continuation_execution_commits_accepted_render_handoff() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5961));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let handoff = rendered.records()[0];

        let execution = execute_sync_scheduler_continuation_for_render_handoff(
            &mut store,
            handoff,
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
        );
        assert_eq!(execution.handoff(), handoff);
        assert_eq!(execution.root(), root_id);
        assert_eq!(
            execution.requested_callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(
            execution.current_callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(execution.handoff_lanes(), Lanes::SYNC);
        assert_eq!(execution.selected_lanes(), Lanes::SYNC);
        let identity = execution.finished_work_handoff_identity().unwrap();
        assert_eq!(identity.root(), root_id);
        assert_eq!(identity.render_phase_root(), root_id);
        assert_eq!(identity.previous_current(), current);
        assert_eq!(identity.current_before_commit(), current);
        assert_eq!(
            identity.pending_work_before_commit(),
            Some(handoff.render_phase().finished_work())
        );
        assert_eq!(
            identity.root_finished_work_before_commit(),
            Some(handoff.render_phase().finished_work())
        );
        assert_eq!(
            identity.finished_work(),
            handoff.render_phase().finished_work()
        );
        assert_eq!(identity.selected_lanes(), Lanes::SYNC);
        assert_eq!(identity.render_lanes(), Lanes::SYNC);
        assert_eq!(identity.finished_lanes(), Lanes::SYNC);
        assert_eq!(identity.root_finished_lanes_before_commit(), Lanes::SYNC);
        assert_eq!(identity.pending_lanes_before_commit(), Lanes::SYNC);
        assert_eq!(identity.render_phase_lanes_before_commit(), Lanes::SYNC);
        assert!(identity.accepted_for_root_scheduler_commit_handoff());
        assert!(execution.did_execute_private_sync_scheduler_continuation());
        assert!(execution.consumed_accepted_render_handoff());
        assert!(execution.accepted_root_scheduler_execution_evidence_for_canary());
        assert!(execution.accepted_root_commit_execution_evidence_for_canary());
        assert!(execution.routed_through_root_scheduler_and_commit_evidence_for_canary());
        assert!(execution.async_callback_execution_blocked());
        assert!(execution.public_update_scheduling_blocked());
        assert!(!execution.public_root_compatibility_claimed());
        assert!(!execution.executes_public_effects());
        let handoff_record = execution.root_commit_handoff_for_canary().unwrap();
        assert!(handoff_record.proves_private_root_finished_work_commit_metadata_handoff());
        assert_eq!(handoff_record.pending().root(), root_id);
        assert_eq!(
            handoff_record.pending().root_finished_work(),
            Some(handoff_record.pending().finished_work())
        );
        assert_eq!(handoff_record.pending().render_lanes(), Lanes::SYNC);
        assert_eq!(
            handoff_record.execution_request().render_lanes(),
            Lanes::SYNC
        );
        assert!(
            handoff_record
                .execution_request()
                .records_root_finished_work()
        );
        assert!(
            handoff_record
                .execution_request()
                .compatibility_claim_blocked()
        );
        let commit = execution.commit().unwrap();
        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.previous_current(), current);
        assert_eq!(commit.current(), handoff.render_phase().finished_work());
        assert_eq!(commit.finished_lanes(), Lanes::SYNC);
        assert_eq!(commit.pending_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            handoff.render_phase().finished_work()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
        assert!(!store.root_scheduler().might_have_pending_sync_work());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_continuation_rejects_stale_callback_node() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let stale_callback = scheduled_callback_request(&mut store, root_id);
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5962));
        process_root_schedule_in_microtask(&mut store).unwrap();
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        let execution = execute_sync_scheduler_continuation_for_render_handoff(
            &mut store,
            rendered.records()[0],
            stale_callback.node(),
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootSyncSchedulerContinuationExecutionStatus::StaleCallbackNode
        );
        assert!(execution.rejected_stale_callback_node());
        assert_eq!(execution.requested_callback_node(), stale_callback.node());
        assert_eq!(
            execution.current_callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(execution.selected_lanes(), Lanes::NO);
        assert!(execution.commit().is_none());
        assert_eq!(store.root(root_id).unwrap().current(), current);
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
    fn root_scheduler_sync_continuation_rejects_pending_passive_blocker() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5963));
        let passive_render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
        let passive_finished_work = passive_render.finished_work();
        {
            let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(root_id, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_mount(passive_finished_work, Lanes::SYNC)
                .unwrap();
        }
        let passive_commit = commit_finished_host_root(&mut store, passive_render).unwrap();
        assert!(passive_commit.pending_passive_handoff().is_some());

        let current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5964));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        let execution = execute_sync_scheduler_continuation_for_render_handoff(
            &mut store,
            rendered.records()[0],
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootSyncSchedulerContinuationExecutionStatus::BlockedByPendingPassive
        );
        assert!(execution.blocked_by_pending_passive());
        assert_eq!(execution.selected_lanes(), Lanes::SYNC);
        let blocker = execution.pending_passive_blocker().unwrap();
        assert_eq!(blocker.root(), root_id);
        assert_eq!(blocker.finished_work(), Some(passive_finished_work));
        assert_eq!(blocker.lanes(), Lanes::SYNC);
        assert_eq!(blocker.pending_unmount_count(), 0);
        assert_eq!(blocker.pending_mount_count(), 1);
        assert_eq!(blocker.pending_record_count(), 1);
        assert!(execution.commit().is_none());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .pending_passive()
                .has_commit_handoff()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_continuation_rejects_mismatched_lanes() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5965));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_finished(RootFinishedLanes::new(
                Lanes::SYNC,
                Lanes::from(Lane::SYNC_HYDRATION),
            ));

        let execution = execute_sync_scheduler_continuation_for_render_handoff(
            &mut store,
            rendered.records()[0],
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootSyncSchedulerContinuationExecutionStatus::BlockedByLaneMismatch
        );
        assert!(execution.blocked_by_lane_mismatch());
        assert_eq!(execution.handoff_lanes(), Lanes::SYNC);
        assert_eq!(
            execution.selected_lanes(),
            Lanes::from(Lane::SYNC_HYDRATION)
        );
        assert!(execution.commit().is_none());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_continuation_rejects_missing_finished_work_handoff() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5966));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let handoff = rendered.records()[0];
        store.root_mut(root_id).unwrap().clear_finished_work();

        let execution = execute_sync_scheduler_continuation_for_render_handoff(
            &mut store,
            handoff,
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch
        );
        assert!(execution.blocked_by_finished_work_handoff_mismatch());
        assert_eq!(execution.selected_lanes(), Lanes::SYNC);
        assert!(execution.commit().is_none());
        assert!(execution.root_commit_handoff_for_canary().is_none());
        let identity = execution.finished_work_handoff_identity().unwrap();
        assert_eq!(identity.root(), root_id);
        assert_eq!(identity.render_phase_root(), root_id);
        assert_eq!(
            identity.pending_work_before_commit(),
            Some(handoff.render_phase().finished_work())
        );
        assert_eq!(identity.root_finished_work_before_commit(), None);
        assert_eq!(identity.root_finished_lanes_before_commit(), Lanes::NO);
        assert!(!identity.accepted_for_root_scheduler_commit_handoff());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(handoff.render_phase().finished_work())
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_continuation_rejects_stale_finished_work_handoff() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5967));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let handoff = rendered.records()[0];
        store
            .root_mut(root_id)
            .unwrap()
            .record_finished_work_for_canary(current, Lanes::SYNC);

        let execution = execute_sync_scheduler_continuation_for_render_handoff(
            &mut store,
            handoff,
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch
        );
        assert!(execution.blocked_by_finished_work_handoff_mismatch());
        assert!(execution.commit().is_none());
        let identity = execution.finished_work_handoff_identity().unwrap();
        assert_eq!(identity.root_finished_work_before_commit(), Some(current));
        assert_eq!(
            identity.finished_work(),
            handoff.render_phase().finished_work()
        );
        assert_eq!(identity.root_finished_lanes_before_commit(), Lanes::SYNC);
        assert!(!identity.accepted_for_root_scheduler_commit_handoff());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_continuation_rejects_finished_lanes_mismatch() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(59671));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let handoff = rendered.records()[0];
        store
            .root_mut(root_id)
            .unwrap()
            .record_finished_work_for_canary(
                handoff.render_phase().finished_work(),
                Lanes::from(Lane::SYNC_HYDRATION),
            );

        let execution = execute_sync_scheduler_continuation_for_render_handoff(
            &mut store,
            handoff,
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch
        );
        assert!(execution.blocked_by_finished_work_handoff_mismatch());
        assert!(execution.commit().is_none());
        assert!(execution.root_commit_handoff_for_canary().is_none());
        assert!(!execution.did_execute_private_sync_scheduler_continuation());
        assert!(!execution.public_root_compatibility_claimed());
        assert!(!execution.executes_public_effects());
        let identity = execution.finished_work_handoff_identity().unwrap();
        assert_eq!(
            identity.root_finished_work_before_commit(),
            Some(handoff.render_phase().finished_work())
        );
        assert_eq!(
            identity.root_finished_lanes_before_commit(),
            Lanes::from(Lane::SYNC_HYDRATION)
        );
        assert_eq!(identity.finished_lanes(), Lanes::SYNC);
        assert!(!identity.accepted_for_root_scheduler_commit_handoff());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_continuation_rejects_foreign_finished_work_handoff() {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let first = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let first_current = store.root(first).unwrap().current();
        let second_current = store.root(second).unwrap().current();
        schedule_sync_update(&mut store, first, RootElementHandle::from_raw(5968));
        schedule_sync_update(&mut store, second, RootElementHandle::from_raw(5969));
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let first_handoff = rendered
            .records()
            .iter()
            .copied()
            .find(|record| record.root() == first)
            .unwrap();
        let foreign_handoff =
            root_sync_flush_record_for_canary(0, second, Lanes::SYNC, first_handoff.render_phase());

        let execution = execute_sync_scheduler_continuation_for_render_handoff(
            &mut store,
            foreign_handoff,
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch
        );
        assert!(execution.blocked_by_finished_work_handoff_mismatch());
        assert!(execution.commit().is_none());
        let identity = execution.finished_work_handoff_identity().unwrap();
        assert_eq!(identity.root(), second);
        assert_eq!(identity.render_phase_root(), first);
        assert_ne!(
            identity.root_finished_work_before_commit(),
            Some(identity.finished_work())
        );
        assert!(!identity.accepted_for_root_scheduler_commit_handoff());
        assert_eq!(store.root(first).unwrap().current(), first_current);
        assert_eq!(store.root(second).unwrap().current(), second_current);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_expired_lane_continuation_marks_starved_default_and_commits_private_handoff()
    {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        assert!(
            store
                .root_mut(root_id)
                .unwrap()
                .lanes_mut()
                .set_expiration_time(Lane::DEFAULT, 10)
        );

        let execution = execute_expired_lane_sync_scheduler_continuation_for_root_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerContinuationStatus::RenderedAndCommitted
        );
        assert_eq!(execution.root(), root_id);
        assert_eq!(execution.current_time(), 10);
        assert_eq!(
            execution.requested_callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(
            execution.current_callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(execution.expired_lanes_before(), Lanes::NO);
        assert_eq!(execution.expired_lanes_after(), Lanes::DEFAULT);
        assert_eq!(execution.selected_priority_lanes(), Lanes::DEFAULT);
        assert_eq!(execution.selected_render_lanes(), Lanes::DEFAULT);
        assert_eq!(execution.selected_expired_lanes(), Lanes::DEFAULT);
        assert!(execution.did_execute_expired_lane_sync_continuation());
        assert!(execution.consumed_accepted_scheduler_continuation_record());
        assert!(execution.async_callback_execution_blocked());
        assert!(execution.public_update_scheduling_blocked());
        assert!(!execution.public_root_compatibility_claimed());
        assert!(!execution.executes_public_effects());

        let handoff = execution.handoff().unwrap();
        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.lanes(), Lanes::DEFAULT);
        assert_eq!(
            handoff.status(),
            RootSyncFlushRecordStatus::RenderedAwaitingCommit
        );
        let continuation = execution.continuation().unwrap();
        assert_eq!(
            continuation.status(),
            RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
        );
        assert_eq!(continuation.handoff(), handoff);
        assert_eq!(continuation.selected_lanes(), Lanes::DEFAULT);
        assert!(continuation.did_execute_private_sync_scheduler_continuation());
        let commit = execution.commit().unwrap();
        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.previous_current(), current);
        assert_eq!(commit.current(), handoff.render_phase().finished_work());
        assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(commit.pending_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            handoff.render_phase().finished_work()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
        assert!(!store.root_scheduler().might_have_pending_sync_work());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_expired_lane_continuation_uses_priority_selection_for_sync_batch() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        assert!(
            store
                .root_mut(root_id)
                .unwrap()
                .lanes_mut()
                .set_expiration_time(Lane::DEFAULT, 10)
        );
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(6252));

        let execution = execute_expired_lane_sync_scheduler_continuation_for_root_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerContinuationStatus::RenderedAndCommitted
        );
        assert_eq!(execution.expired_lanes_after(), Lanes::DEFAULT);
        assert_eq!(
            execution.selected_priority_lanes(),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
        assert_eq!(
            execution.selected_render_lanes(),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
        assert_eq!(execution.selected_expired_lanes(), Lanes::DEFAULT);
        assert!(execution.did_execute_expired_lane_sync_continuation());
        let handoff = execution.handoff().unwrap();
        assert_eq!(handoff.lanes(), Lanes::SYNC.merge(Lanes::DEFAULT));
        let continuation = execution.continuation().unwrap();
        assert_eq!(
            continuation.status(),
            RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
        );
        assert_eq!(
            continuation.selected_lanes(),
            Lanes::SYNC.merge(Lanes::DEFAULT)
        );
        let commit = execution.commit().unwrap();
        assert_eq!(commit.previous_current(), current);
        assert_eq!(commit.current(), handoff.render_phase().finished_work());
        assert_eq!(commit.finished_lanes(), Lanes::SYNC.merge(Lanes::DEFAULT));
        assert_eq!(commit.pending_lanes(), Lanes::NO);
        assert_eq!(store.root(root_id).unwrap().current(), commit.current());
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_expired_lane_continuation_rejects_stale_callback_before_expiration() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        schedule_default_update(&mut store, root_id);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let current_callback = store.root(root_id).unwrap().scheduling().callback_node();
        assert!(current_callback.is_some());
        assert!(
            store
                .root_mut(root_id)
                .unwrap()
                .lanes_mut()
                .set_expiration_time(Lane::DEFAULT, 10)
        );

        let execution = execute_expired_lane_sync_scheduler_continuation_for_root_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode
        );
        assert!(execution.rejected_stale_callback_node());
        assert_eq!(
            execution.requested_callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(execution.current_callback_node(), current_callback);
        assert_eq!(execution.expired_lanes_before(), Lanes::NO);
        assert_eq!(execution.expired_lanes_after(), Lanes::NO);
        assert_eq!(execution.selected_priority_lanes(), Lanes::NO);
        assert_eq!(execution.selected_render_lanes(), Lanes::NO);
        assert!(execution.handoff().is_none());
        assert!(execution.continuation().is_none());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(
            store.root(root_id).unwrap().lanes().expired_lanes(),
            Lanes::NO
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_expired_lane_continuation_rejects_foreign_callback_node() {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let first = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        schedule_default_update(&mut store, first);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let first_callback = *store.scheduler_bridge().callback_requests().last().unwrap();
        schedule_default_update(&mut store, second);
        process_root_schedule_in_microtask(&mut store).unwrap();
        let second_callback = *store.scheduler_bridge().callback_requests().last().unwrap();
        assert_eq!(first_callback.root(), first);
        assert_eq!(second_callback.root(), second);
        assert_ne!(first_callback.node(), second_callback.node());
        assert_eq!(
            store.root(second).unwrap().scheduling().callback_node(),
            second_callback.node()
        );
        let second_current = store.root(second).unwrap().current();
        assert!(
            store
                .root_mut(second)
                .unwrap()
                .lanes_mut()
                .set_expiration_time(Lane::DEFAULT, 625)
        );

        let execution = execute_expired_lane_sync_scheduler_continuation_for_root_for_canary(
            &mut store,
            second,
            625,
            first_callback.node(),
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode
        );
        assert!(execution.rejected_stale_callback_node());
        assert_eq!(execution.root(), second);
        assert_eq!(execution.requested_callback_node(), first_callback.node());
        assert_eq!(execution.current_callback_node(), second_callback.node());
        assert!(execution.handoff().is_none());
        assert!(execution.continuation().is_none());
        assert!(!execution.did_execute_expired_lane_sync_continuation());
        assert!(execution.async_callback_execution_blocked());
        assert!(execution.public_update_scheduling_blocked());
        assert_eq!(store.root(second).unwrap().current(), second_current);
        assert_eq!(
            store.root(second).unwrap().lanes().pending_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_expired_lane_continuation_uses_pending_passive_blocker_from_sync_record() {
        let (mut store, root_id, host) = root_store();
        schedule_default_update(&mut store, root_id);
        let passive_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let passive_finished_work = passive_render.finished_work();
        {
            let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(root_id, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_mount(passive_finished_work, Lanes::DEFAULT)
                .unwrap();
        }
        let passive_commit = commit_finished_host_root(&mut store, passive_render).unwrap();
        assert!(passive_commit.pending_passive_handoff().is_some());
        let current = store.root(root_id).unwrap().current();

        schedule_default_update(&mut store, root_id);
        assert!(
            store
                .root_mut(root_id)
                .unwrap()
                .lanes_mut()
                .set_expiration_time(Lane::DEFAULT, 20)
        );

        let execution = execute_expired_lane_sync_scheduler_continuation_for_root_for_canary(
            &mut store,
            root_id,
            20,
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByPendingPassive
        );
        assert!(execution.blocked_by_pending_passive());
        assert_eq!(execution.selected_render_lanes(), Lanes::DEFAULT);
        let handoff = execution.handoff().unwrap();
        assert_eq!(handoff.lanes(), Lanes::DEFAULT);
        let continuation = execution.continuation().unwrap();
        assert_eq!(
            continuation.status(),
            RootSyncSchedulerContinuationExecutionStatus::BlockedByPendingPassive
        );
        let blocker = continuation.pending_passive_blocker().unwrap();
        assert_eq!(blocker.root(), root_id);
        assert_eq!(blocker.finished_work(), Some(passive_finished_work));
        assert_eq!(blocker.lanes(), Lanes::DEFAULT);
        assert_eq!(blocker.pending_unmount_count(), 0);
        assert_eq!(blocker.pending_mount_count(), 1);
        assert_eq!(blocker.pending_record_count(), 1);
        assert!(execution.commit().is_none());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .pending_passive()
                .has_commit_handoff()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_flush_post_passive_gate_records_reentry_roots_data_only() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let passive_root = store
            .create_client_root(
                FakeContainer::new(1),
                RootOptions::new()
                    .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(951))
                    .with_on_caught_error(RootErrorCallbackHandle::from_raw(952))
                    .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(953)),
            )
            .unwrap();
        let continuation_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let continuation_current = store.root(continuation_root).unwrap().current();

        schedule_sync_update(&mut store, passive_root, RootElementHandle::from_raw(93));
        let render = render_host_root_for_lanes(&mut store, passive_root, Lanes::SYNC).unwrap();
        let finished_work = render.finished_work();
        store
            .root_mut(passive_root)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(passive_root, Lanes::NO);
        store
            .root_mut(passive_root)
            .unwrap()
            .scheduling_mut()
            .pending_passive_mut()
            .queue_mount(finished_work, Lanes::SYNC)
            .unwrap();
        let commit = commit_finished_host_root(&mut store, render).unwrap();

        schedule_default_update(&mut store, continuation_root);
        schedule_sync_update(
            &mut store,
            continuation_root,
            RootElementHandle::from_raw(94),
        );
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let gate = sync_flush_post_passive_continuation_execution_gate(
            &mut store,
            &ExecutionContextState::new(),
            commit.pending_passive_handoff(),
        )
        .unwrap()
        .unwrap();

        assert_eq!(gate.exit_status(), RootSyncFlushExitStatus::Completed);
        assert!(gate.execution_context().can_enter_sync_flush());
        assert_eq!(gate.pending_passive_root(), passive_root);
        assert_eq!(gate.pending_passive_finished_work(), finished_work);
        assert_eq!(gate.pending_passive_lanes(), Lanes::SYNC);
        assert_eq!(gate.pending_passive_unmount_count(), 0);
        assert_eq!(gate.pending_passive_mount_count(), 1);
        assert_eq!(gate.pending_passive_record_count(), 1);
        let root_error = gate.root_error_propagation();
        assert_eq!(root_error.root(), passive_root);
        assert_eq!(
            root_error.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(951)
        );
        assert_eq!(
            root_error.on_caught_error(),
            RootErrorCallbackHandle::from_raw(952)
        );
        assert_eq!(
            root_error.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(953)
        );
        assert_eq!(
            root_error.status(),
            SyncFlushPostPassiveRootErrorPropagationStatus::Blocked
        );
        assert_eq!(
            root_error.blockers(),
            &SYNC_FLUSH_POST_PASSIVE_ROOT_ERROR_PROPAGATION_BLOCKERS
        );
        assert!(root_error.has_configured_error_callback());
        assert!(!root_error.root_error_update_scheduled());
        assert!(!root_error.root_error_callbacks_invoked());
        assert!(!root_error.public_act_error_aggregation_enabled());
        assert!(gate.should_execute_follow_up_sync_flush());
        assert!(gate.did_find_continuation_roots());
        assert_eq!(gate.continuation_roots().len(), 1);
        let continuation = gate.continuation_roots()[0];
        assert_eq!(continuation.order(), 0);
        assert_eq!(continuation.root(), continuation_root);
        assert_eq!(continuation.lanes(), Lanes::SYNC);
        assert!(
            !continuation.lanes().contains_lane(Lane::DEFAULT),
            "default work must not enter the post-passive sync-flush continuation gate"
        );
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
        assert!(!store.root_scheduler().is_flushing_work());
    }

    #[test]
    fn root_scheduler_sync_flush_post_passive_gate_preserves_guards() {
        let (mut store, root_id, host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(95));
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(root_id, Lanes::NO);
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let handoff = commit.pending_passive_handoff();
        let mut execution_context = ExecutionContextState::new();

        let blocked = execution_context
            .with_render_context(|execution_context| {
                sync_flush_post_passive_continuation_execution_gate(
                    &mut store,
                    execution_context,
                    handoff,
                )
            })
            .unwrap()
            .unwrap();

        assert_eq!(
            blocked.exit_status(),
            RootSyncFlushExitStatus::BlockedByExecutionContext
        );
        assert!(!blocked.should_execute_follow_up_sync_flush());
        assert!(blocked.execution_context().blocked_by_render_or_commit());
        assert!(blocked.continuation_roots().is_empty());
        assert!(!store.root_scheduler().is_flushing_work());

        store.root_scheduler_mut().set_is_flushing_work(true);
        let reentrant = sync_flush_post_passive_continuation_execution_gate(
            &mut store,
            &ExecutionContextState::new(),
            handoff,
        )
        .unwrap()
        .unwrap();
        assert_eq!(
            reentrant.exit_status(),
            RootSyncFlushExitStatus::SkippedReentrantFlush
        );
        assert!(!reentrant.should_execute_follow_up_sync_flush());
        assert!(reentrant.continuation_roots().is_empty());
        assert!(store.root_scheduler().is_flushing_work());
        store.root_scheduler_mut().set_is_flushing_work(false);

        recompute_might_have_pending_sync_work(&mut store).unwrap();
        let no_work = sync_flush_post_passive_continuation_execution_gate(
            &mut store,
            &ExecutionContextState::new(),
            handoff,
        )
        .unwrap()
        .unwrap();
        assert_eq!(
            no_work.exit_status(),
            RootSyncFlushExitStatus::SkippedNoPendingSyncWork
        );
        assert!(!no_work.should_execute_follow_up_sync_flush());
        assert!(no_work.continuation_roots().is_empty());
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .pending_passive()
                .has_commit_handoff()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_scheduler_sync_flush_records_fast_path_when_no_pending_sync_work() {
        let (mut store, _root_id, _host) = root_store();
        let execution_context = ExecutionContextState::new();

        let result = flush_sync_work_on_all_roots(&mut store, &execution_context).unwrap();

        assert_eq!(
            result.exit_status(),
            RootSyncFlushExitStatus::SkippedNoPendingSyncWork
        );
        assert!(result.execution_context().can_enter_sync_flush());
        assert!(result.records().is_empty());
        assert!(!store.root_scheduler().is_flushing_work());
    }

    #[test]
    fn root_scheduler_sync_flush_records_reject_render_or_commit_context() {
        let (mut store, root_id, _host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::NONE);
        let mut execution_context = ExecutionContextState::new();

        let render_result = execution_context
            .with_render_context(|execution_context| {
                flush_sync_work_on_all_roots(&mut store, execution_context)
            })
            .unwrap();

        assert_eq!(
            render_result.exit_status(),
            RootSyncFlushExitStatus::BlockedByExecutionContext
        );
        assert!(
            render_result
                .execution_context()
                .blocked_by_render_or_commit()
        );
        assert!(render_result.records().is_empty());
        assert!(!store.root_scheduler().is_flushing_work());
        assert!(store.root_scheduler().might_have_pending_sync_work());

        let commit_result = execution_context
            .with_commit_context(|execution_context| {
                flush_sync_work_on_all_roots(&mut store, execution_context)
            })
            .unwrap();

        assert_eq!(
            commit_result.exit_status(),
            RootSyncFlushExitStatus::BlockedByExecutionContext
        );
        assert!(
            commit_result
                .execution_context()
                .blocked_by_render_or_commit()
        );
        assert!(commit_result.records().is_empty());
        assert!(!store.root_scheduler().is_flushing_work());
    }

    #[test]
    fn root_scheduler_sync_flush_records_reentrant_guard_without_clearing_state() {
        let (mut store, root_id, _host) = root_store();
        schedule_sync_update(&mut store, root_id, RootElementHandle::NONE);
        store.root_scheduler_mut().set_is_flushing_work(true);

        let result =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        assert_eq!(
            result.exit_status(),
            RootSyncFlushExitStatus::SkippedReentrantFlush
        );
        assert!(result.records().is_empty());
        assert!(store.root_scheduler().is_flushing_work());
        assert!(store.root_scheduler().might_have_pending_sync_work());

        store.root_scheduler_mut().set_is_flushing_work(false);
    }

    #[test]
    fn root_scheduler_sync_flush_records_roots_in_scheduled_order_and_renders_for_commit_handoff() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let second_scheduled = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let first_scheduled = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second_current = store.root(second_scheduled).unwrap().current();
        let first_current = store.root(first_scheduled).unwrap().current();

        schedule_sync_update(
            &mut store,
            second_scheduled,
            RootElementHandle::from_raw(20),
        );
        schedule_sync_update(&mut store, first_scheduled, RootElementHandle::from_raw(10));

        let result =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

        assert_eq!(result.exit_status(), RootSyncFlushExitStatus::Completed);
        assert_eq!(result.records().len(), 2);
        assert_eq!(result.records()[0].order(), 0);
        assert_eq!(result.records()[0].root(), second_scheduled);
        assert_eq!(result.records()[0].lanes(), Lanes::SYNC);
        assert_eq!(
            result.records()[0].status(),
            RootSyncFlushRecordStatus::RenderedAwaitingCommit
        );
        assert_eq!(
            result.records()[0].render_phase().resulting_element(),
            RootElementHandle::from_raw(20)
        );
        assert_eq!(result.records()[1].order(), 1);
        assert_eq!(result.records()[1].root(), first_scheduled);
        assert_eq!(result.records()[1].lanes(), Lanes::SYNC);
        assert_eq!(
            result.records()[1].render_phase().resulting_element(),
            RootElementHandle::from_raw(10)
        );
        assert_eq!(
            store.root(second_scheduled).unwrap().current(),
            second_current
        );
        assert_eq!(
            store.root(first_scheduled).unwrap().current(),
            first_current
        );
        assert_eq!(
            store.root(second_scheduled).unwrap().finished_work(),
            Some(result.records()[0].render_phase().finished_work())
        );
        assert_eq!(
            store.root(second_scheduled).unwrap().finished_lanes(),
            Lanes::SYNC
        );
        assert_eq!(
            store.root(first_scheduled).unwrap().finished_work(),
            Some(result.records()[1].render_phase().finished_work())
        );
        assert_eq!(
            store.root(first_scheduled).unwrap().finished_lanes(),
            Lanes::SYNC
        );
        assert!(!store.root_scheduler().is_flushing_work());
    }
}
