//! Private passive-effects flush skeleton.
//!
//! This module consumes the accepted pending passive metadata as deterministic
//! data. The default flush path remains metadata-only; crate-private,
//! test-controlled mount-create and destroy executors plus a callback
//! invocation gate can consume accepted callback handles. Those private gates
//! remain detached from public effect execution, scheduler-driven passive
//! execution, and `act` compatibility. A narrow lifecycle evidence gate can
//! compose the accepted layout/passive metadata with those private execution
//! snapshots for update and deleted-subtree unmount ordering canaries.

#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

mod deleted_subtree;

#[cfg(test)]
use fast_react_core::FiberTag;
use fast_react_core::{
    FiberId, HookEffectArenaError, HookEffectCallbackHandle, HookEffectId, HookEffectInstanceId,
    Lanes,
};
use fast_react_host_config::HostTypes;

use crate::function_component::{
    FunctionComponentHookRenderPhase, FunctionComponentHookRenderStore,
};
#[cfg(test)]
use crate::root_commit::HostRootOffscreenRevealCommitHandoffRecordForCanary;
use crate::root_commit::{
    FunctionComponentCommittedPassiveEffectsSnapshot, FunctionComponentEffectListCommitPhase,
    FunctionComponentEffectListCommitPhaseOrderKind,
    FunctionComponentEffectListCommitPhaseOrderRecord,
    FunctionComponentLayoutEffectCallbackInvocationGateSnapshot,
    FunctionComponentPendingPassiveCommitHandoff,
    FunctionComponentPendingPassiveEffectPhaseCommitRecord, PendingPassiveCommitHandoff,
};
use crate::root_config::{
    PendingPassiveEffectOrder, PendingPassiveEffectPhase, PendingPassiveState,
    PendingPassiveUnmountOrigin, RootErrorCallbackHandle, RootErrorOptionCallbackPhase,
    RootErrorOptionCallbackRecord, RootRecoverableErrorCallbackHandle,
};
use crate::root_scheduler::{
    PassiveEffectSchedulerFlushGateRecord, RootErrorCaptureScheduleRecord, RootErrorCaptureSource,
    SyncFlushPostPassiveContinuationExecutionGateRecord, capture_passive_effect_root_error,
    sync_flush_post_passive_continuation_execution_gate,
};
use crate::scheduler_bridge::SchedulerPassiveEffectsFlushRequest;
use crate::sync_flush::{
    SyncFlushError, SyncFlushPostPassiveContinuationExecutionRecord,
    flush_sync_post_passive_continuation_after_passive_effects,
};
use crate::{
    ExecutionContextState, FiberRootId, FiberRootStore, FiberRootStoreError, HostRootCommitRecord,
    RootSchedulerError,
};

use deleted_subtree::validate_committed_deleted_subtree_passive_effects;
#[allow(
    unused_imports,
    reason = "crate-visible deleted-subtree passive cleanup paths are preserved for canaries outside the lib target"
)]
pub(crate) use deleted_subtree::{
    DeletedSubtreeRefCleanupReturnExecutionRecord, DeletedSubtreeRefCleanupReturnExecutionRequest,
    DeletedSubtreeRefCleanupReturnExecutor, DeletedSubtreeRefPassiveCleanupExecutionError,
    DeletedSubtreeRefPassiveCleanupExecutionRecord, DeletedSubtreeRefPassiveCleanupExecutionResult,
    execute_deleted_subtree_ref_and_passive_cleanup_after_commit_for_canary,
    flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary,
    record_deleted_subtree_unmount_effect_lifecycle_execution_evidence_for_canary,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectsFlushStatus {
    NoPendingPassive,
    Flushed,
}

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct PassiveEffectDestroyCallbackErrorHandle(u64);

impl PassiveEffectDestroyCallbackErrorHandle {
    pub const NONE: Self = Self(0);

    #[must_use]
    pub const fn from_raw(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub const fn raw(self) -> u64 {
        self.0
    }

    #[must_use]
    pub const fn is_none(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub const fn is_some(self) -> bool {
        self.0 != 0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectFlushEffectRecord {
    effect_index: usize,
    effect: HookEffectId,
    instance: HookEffectInstanceId,
    create: Option<HookEffectCallbackHandle>,
    destroy: Option<HookEffectCallbackHandle>,
    create_invoked: bool,
    destroy_invoked: bool,
}

impl PassiveEffectFlushEffectRecord {
    #[must_use]
    pub const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn create_callback(self) -> Option<HookEffectCallbackHandle> {
        self.create
    }

    #[must_use]
    pub const fn destroy_callback(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub const fn create_callback_invoked(self) -> bool {
        self.create_invoked
    }

    #[must_use]
    pub const fn destroy_callback_invoked(self) -> bool {
        self.destroy_invoked
    }

    fn mark_destroy_callback_invoked(&mut self) {
        self.destroy_invoked = true;
    }

    fn mark_create_callback_invoked(&mut self) {
        self.create_invoked = true;
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectFlushRecord {
    flush_index: usize,
    root: FiberRootId,
    finished_work: FiberId,
    committed_lanes: Lanes,
    fiber: FiberId,
    effect_lanes: Lanes,
    phase: PendingPassiveEffectPhase,
    pending_order: PendingPassiveEffectOrder,
    unmount_origin: Option<PendingPassiveUnmountOrigin>,
    effect: Option<PassiveEffectFlushEffectRecord>,
}

impl PassiveEffectFlushRecord {
    #[must_use]
    pub const fn flush_index(&self) -> usize {
        self.flush_index
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub const fn committed_lanes(&self) -> Lanes {
        self.committed_lanes
    }

    #[must_use]
    pub const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn effect_lanes(&self) -> Lanes {
        self.effect_lanes
    }

    #[must_use]
    pub const fn phase(&self) -> PendingPassiveEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn pending_order(&self) -> PendingPassiveEffectOrder {
        self.pending_order
    }

    #[must_use]
    pub const fn unmount_origin(&self) -> Option<PendingPassiveUnmountOrigin> {
        self.unmount_origin
    }

    #[must_use]
    pub const fn effect_record(&self) -> Option<PassiveEffectFlushEffectRecord> {
        self.effect
    }

    #[must_use]
    pub const fn effect(&self) -> Option<HookEffectId> {
        match self.effect {
            Some(effect) => Some(effect.effect()),
            None => None,
        }
    }

    #[must_use]
    pub const fn effect_index(&self) -> Option<usize> {
        match self.effect {
            Some(effect) => Some(effect.effect_index()),
            None => None,
        }
    }

    #[must_use]
    pub const fn effect_instance(&self) -> Option<HookEffectInstanceId> {
        match self.effect {
            Some(effect) => Some(effect.instance()),
            None => None,
        }
    }

    #[must_use]
    pub const fn create_callback(&self) -> Option<HookEffectCallbackHandle> {
        match self.effect {
            Some(effect) => effect.create_callback(),
            None => None,
        }
    }

    #[must_use]
    pub const fn destroy_callback(&self) -> Option<HookEffectCallbackHandle> {
        match self.effect {
            Some(effect) => effect.destroy_callback(),
            None => None,
        }
    }

    #[must_use]
    pub const fn create_callback_invoked(&self) -> bool {
        match self.effect {
            Some(effect) => effect.create_callback_invoked(),
            None => false,
        }
    }

    #[must_use]
    pub const fn destroy_callback_invoked(&self) -> bool {
        match self.effect {
            Some(effect) => effect.destroy_callback_invoked(),
            None => false,
        }
    }

    fn mark_destroy_callback_invoked(&mut self) {
        if let Some(effect) = self.effect.as_mut() {
            effect.mark_destroy_callback_invoked();
        }
    }

    fn mark_create_callback_invoked(&mut self) {
        if let Some(effect) = self.effect.as_mut() {
            effect.mark_create_callback_invoked();
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectDestroyCallbackExecutionRequest {
    execution_order: usize,
    flush_record: PassiveEffectFlushRecord,
    destroy: HookEffectCallbackHandle,
}

impl PassiveEffectDestroyCallbackExecutionRequest {
    #[must_use]
    pub const fn execution_order(self) -> usize {
        self.execution_order
    }

    #[must_use]
    pub const fn flush_record(self) -> PassiveEffectFlushRecord {
        self.flush_record
    }

    #[must_use]
    pub const fn flush_index(self) -> usize {
        self.flush_record.flush_index()
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.flush_record.root()
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.flush_record.finished_work()
    }

    #[must_use]
    pub const fn committed_lanes(self) -> Lanes {
        self.flush_record.committed_lanes()
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.flush_record.fiber()
    }

    #[must_use]
    pub const fn effect_lanes(self) -> Lanes {
        self.flush_record.effect_lanes()
    }

    #[must_use]
    pub const fn phase(self) -> PendingPassiveEffectPhase {
        self.flush_record.phase()
    }

    #[must_use]
    pub const fn pending_order(self) -> PendingPassiveEffectOrder {
        self.flush_record.pending_order()
    }

    #[must_use]
    pub const fn unmount_origin(self) -> Option<PendingPassiveUnmountOrigin> {
        self.flush_record.unmount_origin()
    }

    #[must_use]
    pub const fn effect_index(self) -> Option<usize> {
        self.flush_record.effect_index()
    }

    #[must_use]
    pub const fn effect(self) -> Option<HookEffectId> {
        self.flush_record.effect()
    }

    #[must_use]
    pub const fn effect_instance(self) -> Option<HookEffectInstanceId> {
        self.flush_record.effect_instance()
    }

    #[must_use]
    pub const fn destroy_callback(self) -> HookEffectCallbackHandle {
        self.destroy
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectDestroyCallbackExecutionRecord {
    request: PassiveEffectDestroyCallbackExecutionRequest,
}

impl PassiveEffectDestroyCallbackExecutionRecord {
    #[must_use]
    pub const fn request(self) -> PassiveEffectDestroyCallbackExecutionRequest {
        self.request
    }

    #[must_use]
    pub const fn execution_order(self) -> usize {
        self.request.execution_order()
    }

    #[must_use]
    pub const fn flush_index(self) -> usize {
        self.request.flush_index()
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.request.root()
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.request.finished_work()
    }

    #[must_use]
    pub const fn committed_lanes(self) -> Lanes {
        self.request.committed_lanes()
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.request.fiber()
    }

    #[must_use]
    pub const fn effect_lanes(self) -> Lanes {
        self.request.effect_lanes()
    }

    #[must_use]
    pub const fn phase(self) -> PendingPassiveEffectPhase {
        self.request.phase()
    }

    #[must_use]
    pub const fn pending_order(self) -> PendingPassiveEffectOrder {
        self.request.pending_order()
    }

    #[must_use]
    pub const fn unmount_origin(self) -> Option<PendingPassiveUnmountOrigin> {
        self.request.unmount_origin()
    }

    #[must_use]
    pub const fn effect_index(self) -> Option<usize> {
        self.request.effect_index()
    }

    #[must_use]
    pub const fn effect(self) -> Option<HookEffectId> {
        self.request.effect()
    }

    #[must_use]
    pub const fn effect_instance(self) -> Option<HookEffectInstanceId> {
        self.request.effect_instance()
    }

    #[must_use]
    pub const fn destroy_callback(self) -> HookEffectCallbackHandle {
        self.request.destroy_callback()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectDestroyCallbackErrorRecord {
    execution: PassiveEffectDestroyCallbackExecutionRecord,
    error: PassiveEffectDestroyCallbackErrorHandle,
}

impl PassiveEffectDestroyCallbackErrorRecord {
    #[must_use]
    pub const fn execution(self) -> PassiveEffectDestroyCallbackExecutionRecord {
        self.execution
    }

    #[must_use]
    pub const fn error(self) -> PassiveEffectDestroyCallbackErrorHandle {
        self.error
    }
}

pub(crate) trait PassiveEffectDestroyCallbackExecutor {
    fn execute_destroy_callback(
        &mut self,
        request: PassiveEffectDestroyCallbackExecutionRequest,
    ) -> Result<(), PassiveEffectDestroyCallbackErrorHandle>;
}

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct PassiveEffectMountCreateCallbackErrorHandle(u64);

impl PassiveEffectMountCreateCallbackErrorHandle {
    pub const NONE: Self = Self(0);

    #[must_use]
    pub const fn from_raw(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub const fn raw(self) -> u64 {
        self.0
    }

    #[must_use]
    pub const fn is_none(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub const fn is_some(self) -> bool {
        self.0 != 0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectMountCreateCallbackExecutionRequest {
    execution_order: usize,
    flush_record: PassiveEffectFlushRecord,
    create: HookEffectCallbackHandle,
}

impl PassiveEffectMountCreateCallbackExecutionRequest {
    #[must_use]
    pub const fn execution_order(self) -> usize {
        self.execution_order
    }

    #[must_use]
    pub const fn flush_record(self) -> PassiveEffectFlushRecord {
        self.flush_record
    }

    #[must_use]
    pub const fn flush_index(self) -> usize {
        self.flush_record.flush_index()
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.flush_record.root()
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.flush_record.finished_work()
    }

    #[must_use]
    pub const fn committed_lanes(self) -> Lanes {
        self.flush_record.committed_lanes()
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.flush_record.fiber()
    }

    #[must_use]
    pub const fn effect_lanes(self) -> Lanes {
        self.flush_record.effect_lanes()
    }

    #[must_use]
    pub const fn phase(self) -> PendingPassiveEffectPhase {
        self.flush_record.phase()
    }

    #[must_use]
    pub const fn pending_order(self) -> PendingPassiveEffectOrder {
        self.flush_record.pending_order()
    }

    #[must_use]
    pub const fn effect_index(self) -> Option<usize> {
        self.flush_record.effect_index()
    }

    #[must_use]
    pub const fn effect(self) -> Option<HookEffectId> {
        self.flush_record.effect()
    }

    #[must_use]
    pub const fn effect_instance(self) -> Option<HookEffectInstanceId> {
        self.flush_record.effect_instance()
    }

    #[must_use]
    pub const fn create_callback(self) -> HookEffectCallbackHandle {
        self.create
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectMountCreateCallbackExecutionRecord {
    request: PassiveEffectMountCreateCallbackExecutionRequest,
    returned_destroy: Option<HookEffectCallbackHandle>,
}

impl PassiveEffectMountCreateCallbackExecutionRecord {
    #[must_use]
    pub const fn request(self) -> PassiveEffectMountCreateCallbackExecutionRequest {
        self.request
    }

    #[must_use]
    pub const fn returned_destroy(self) -> Option<HookEffectCallbackHandle> {
        self.returned_destroy
    }

    #[must_use]
    pub const fn execution_order(self) -> usize {
        self.request.execution_order()
    }

    #[must_use]
    pub const fn flush_index(self) -> usize {
        self.request.flush_index()
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.request.root()
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.request.finished_work()
    }

    #[must_use]
    pub const fn committed_lanes(self) -> Lanes {
        self.request.committed_lanes()
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.request.fiber()
    }

    #[must_use]
    pub const fn effect_lanes(self) -> Lanes {
        self.request.effect_lanes()
    }

    #[must_use]
    pub const fn phase(self) -> PendingPassiveEffectPhase {
        self.request.phase()
    }

    #[must_use]
    pub const fn pending_order(self) -> PendingPassiveEffectOrder {
        self.request.pending_order()
    }

    #[must_use]
    pub const fn effect_index(self) -> Option<usize> {
        self.request.effect_index()
    }

    #[must_use]
    pub const fn effect(self) -> Option<HookEffectId> {
        self.request.effect()
    }

    #[must_use]
    pub const fn effect_instance(self) -> Option<HookEffectInstanceId> {
        self.request.effect_instance()
    }

    #[must_use]
    pub const fn create_callback(self) -> HookEffectCallbackHandle {
        self.request.create_callback()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectMountCreateCallbackErrorRecord {
    execution: PassiveEffectMountCreateCallbackExecutionRecord,
    error: PassiveEffectMountCreateCallbackErrorHandle,
}

impl PassiveEffectMountCreateCallbackErrorRecord {
    #[must_use]
    pub const fn execution(self) -> PassiveEffectMountCreateCallbackExecutionRecord {
        self.execution
    }

    #[must_use]
    pub const fn error(self) -> PassiveEffectMountCreateCallbackErrorHandle {
        self.error
    }
}

pub(crate) trait PassiveEffectMountCreateCallbackExecutor {
    fn execute_mount_create_callback(
        &mut self,
        request: PassiveEffectMountCreateCallbackExecutionRequest,
    ) -> Result<Option<HookEffectCallbackHandle>, PassiveEffectMountCreateCallbackErrorHandle>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectMountCreateCallbackExecutionGateStatus {
    TestControlOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectMountCreateCallbackExecutionGateBlocker {
    PublicEffectExecution,
    PublicActCompatibility,
    SchedulerDrivenPassiveExecution,
}

pub(crate) const PASSIVE_EFFECT_MOUNT_CREATE_CALLBACK_EXECUTION_GATE_BLOCKERS:
    [PassiveEffectMountCreateCallbackExecutionGateBlocker; 3] = [
    PassiveEffectMountCreateCallbackExecutionGateBlocker::PublicEffectExecution,
    PassiveEffectMountCreateCallbackExecutionGateBlocker::PublicActCompatibility,
    PassiveEffectMountCreateCallbackExecutionGateBlocker::SchedulerDrivenPassiveExecution,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectRootErrorPropagationStatus {
    Blocked,
    CapturedForRootUpdate,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectRootErrorPropagationBlocker {
    CommitPhaseErrorCapture,
    RootErrorUpdateScheduling,
    RootErrorCallbackInvocation,
    PublicActErrorAggregation,
}

pub(crate) const PASSIVE_EFFECT_ROOT_ERROR_PROPAGATION_BLOCKERS:
    [PassiveEffectRootErrorPropagationBlocker; 4] = [
    PassiveEffectRootErrorPropagationBlocker::CommitPhaseErrorCapture,
    PassiveEffectRootErrorPropagationBlocker::RootErrorUpdateScheduling,
    PassiveEffectRootErrorPropagationBlocker::RootErrorCallbackInvocation,
    PassiveEffectRootErrorPropagationBlocker::PublicActErrorAggregation,
];

pub(crate) const PASSIVE_EFFECT_ROOT_ERROR_CALLBACK_BLOCKERS:
    [PassiveEffectRootErrorPropagationBlocker; 2] = [
    PassiveEffectRootErrorPropagationBlocker::RootErrorCallbackInvocation,
    PassiveEffectRootErrorPropagationBlocker::PublicActErrorAggregation,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectRootErrorPropagationRecord {
    root: FiberRootId,
    error_option_callbacks: RootErrorOptionCallbackRecord,
    scheduled_root_error_count: usize,
}

impl PassiveEffectRootErrorPropagationRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn error_option_callbacks(self) -> RootErrorOptionCallbackRecord {
        self.error_option_callbacks
    }

    #[must_use]
    pub const fn on_uncaught_error(self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_uncaught_error()
    }

    #[must_use]
    pub const fn on_caught_error(self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_caught_error()
    }

    #[must_use]
    pub const fn on_recoverable_error(self) -> RootRecoverableErrorCallbackHandle {
        self.error_option_callbacks.on_recoverable_error()
    }

    #[must_use]
    pub const fn status(self) -> PassiveEffectRootErrorPropagationStatus {
        if self.root_error_update_scheduled() {
            PassiveEffectRootErrorPropagationStatus::CapturedForRootUpdate
        } else {
            PassiveEffectRootErrorPropagationStatus::Blocked
        }
    }

    #[must_use]
    pub const fn blockers(self) -> &'static [PassiveEffectRootErrorPropagationBlocker] {
        if self.root_error_update_scheduled() {
            &PASSIVE_EFFECT_ROOT_ERROR_CALLBACK_BLOCKERS
        } else {
            &PASSIVE_EFFECT_ROOT_ERROR_PROPAGATION_BLOCKERS
        }
    }

    #[must_use]
    pub const fn root_error_update_scheduled(self) -> bool {
        self.scheduled_root_error_count > 0
    }

    #[must_use]
    pub const fn scheduled_root_error_count(self) -> usize {
        self.scheduled_root_error_count
    }

    #[must_use]
    pub const fn root_error_callbacks_invoked(self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_act_error_aggregation_enabled(self) -> bool {
        false
    }

    #[must_use]
    pub const fn has_configured_error_callback(self) -> bool {
        self.error_option_callbacks.has_configured_error_callback()
    }

    #[must_use]
    pub const fn public_error_boundaries_enabled(self) -> bool {
        false
    }

    #[must_use]
    pub const fn recoverable_error_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    const fn with_scheduled_root_error_count(mut self, count: usize) -> Self {
        self.scheduled_root_error_count = count;
        self
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectCallbackExecutionErrorKind {
    Destroy,
    MountCreate,
}

impl PassiveEffectCallbackExecutionErrorKind {
    #[must_use]
    pub const fn phase(self) -> PendingPassiveEffectPhase {
        match self {
            Self::Destroy => PendingPassiveEffectPhase::Unmount,
            Self::MountCreate => PendingPassiveEffectPhase::Mount,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectCallbackExecutionErrorHandle {
    Destroy(PassiveEffectDestroyCallbackErrorHandle),
    MountCreate(PassiveEffectMountCreateCallbackErrorHandle),
}

impl PassiveEffectCallbackExecutionErrorHandle {
    #[must_use]
    pub const fn is_some(self) -> bool {
        match self {
            Self::Destroy(error) => error.is_some(),
            Self::MountCreate(error) => error.is_some(),
        }
    }

    #[must_use]
    pub const fn is_none(self) -> bool {
        !self.is_some()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectRootErrorCaptureRecord {
    capture_order: usize,
    kind: PassiveEffectCallbackExecutionErrorKind,
    root: FiberRootId,
    finished_work: FiberId,
    committed_lanes: Lanes,
    fiber: FiberId,
    effect_lanes: Lanes,
    phase: PendingPassiveEffectPhase,
    pending_order: PendingPassiveEffectOrder,
    flush_index: usize,
    effect_index: Option<usize>,
    effect: Option<HookEffectId>,
    instance: Option<HookEffectInstanceId>,
    callback: HookEffectCallbackHandle,
    error: PassiveEffectCallbackExecutionErrorHandle,
    schedule: RootErrorCaptureScheduleRecord,
}

impl PassiveEffectRootErrorCaptureRecord {
    #[must_use]
    pub const fn capture_order(self) -> usize {
        self.capture_order
    }

    #[must_use]
    pub const fn kind(self) -> PassiveEffectCallbackExecutionErrorKind {
        self.kind
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub const fn committed_lanes(self) -> Lanes {
        self.committed_lanes
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn effect_lanes(self) -> Lanes {
        self.effect_lanes
    }

    #[must_use]
    pub const fn phase(self) -> PendingPassiveEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn pending_order(self) -> PendingPassiveEffectOrder {
        self.pending_order
    }

    #[must_use]
    pub const fn flush_index(self) -> usize {
        self.flush_index
    }

    #[must_use]
    pub const fn effect_index(self) -> Option<usize> {
        self.effect_index
    }

    #[must_use]
    pub const fn effect(self) -> Option<HookEffectId> {
        self.effect
    }

    #[must_use]
    pub const fn effect_instance(self) -> Option<HookEffectInstanceId> {
        self.instance
    }

    #[must_use]
    pub const fn callback(self) -> HookEffectCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn error(self) -> PassiveEffectCallbackExecutionErrorHandle {
        self.error
    }

    #[must_use]
    pub const fn schedule(self) -> RootErrorCaptureScheduleRecord {
        self.schedule
    }

    #[must_use]
    pub const fn error_option_callbacks(self) -> RootErrorOptionCallbackRecord {
        self.schedule.error_option_callbacks()
    }

    #[must_use]
    pub const fn on_uncaught_error(self) -> RootErrorCallbackHandle {
        self.schedule.on_uncaught_error()
    }

    #[must_use]
    pub const fn on_caught_error(self) -> RootErrorCallbackHandle {
        self.schedule.on_caught_error()
    }

    #[must_use]
    pub const fn on_recoverable_error(self) -> RootRecoverableErrorCallbackHandle {
        self.schedule.on_recoverable_error()
    }

    #[must_use]
    pub const fn root_error_update_scheduled(self) -> bool {
        self.schedule.root_error_update_scheduled()
    }

    #[must_use]
    pub const fn root_error_callbacks_invoked(self) -> bool {
        self.schedule.root_error_callbacks_invoked()
    }

    #[must_use]
    pub const fn public_act_error_aggregation_enabled(self) -> bool {
        self.schedule.public_act_error_aggregation_enabled()
    }

    #[must_use]
    pub const fn has_configured_error_callback(self) -> bool {
        self.schedule.has_configured_error_callback()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectRootErrorRoutingStatus {
    CapturedForRootUpdate,
    Blocked,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectRootErrorRoutingRecord {
    routing_order: usize,
    root_error_capture: PassiveEffectRootErrorCaptureRecord,
    root_error_propagation: PassiveEffectRootErrorPropagationRecord,
}

impl PassiveEffectRootErrorRoutingRecord {
    #[must_use]
    pub const fn routing_order(self) -> usize {
        self.routing_order
    }

    #[must_use]
    pub const fn kind(self) -> PassiveEffectCallbackExecutionErrorKind {
        self.root_error_capture.kind()
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root_error_capture.root()
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.root_error_capture.finished_work()
    }

    #[must_use]
    pub const fn committed_lanes(self) -> Lanes {
        self.root_error_capture.committed_lanes()
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.root_error_capture.fiber()
    }

    #[must_use]
    pub const fn effect_lanes(self) -> Lanes {
        self.root_error_capture.effect_lanes()
    }

    #[must_use]
    pub const fn phase(self) -> PendingPassiveEffectPhase {
        self.root_error_capture.phase()
    }

    #[must_use]
    pub const fn pending_order(self) -> PendingPassiveEffectOrder {
        self.root_error_capture.pending_order()
    }

    #[must_use]
    pub const fn flush_index(self) -> usize {
        self.root_error_capture.flush_index()
    }

    #[must_use]
    pub const fn effect_index(self) -> Option<usize> {
        self.root_error_capture.effect_index()
    }

    #[must_use]
    pub const fn effect(self) -> Option<HookEffectId> {
        self.root_error_capture.effect()
    }

    #[must_use]
    pub const fn effect_instance(self) -> Option<HookEffectInstanceId> {
        self.root_error_capture.effect_instance()
    }

    #[must_use]
    pub const fn callback(self) -> HookEffectCallbackHandle {
        self.root_error_capture.callback()
    }

    #[must_use]
    pub const fn error(self) -> PassiveEffectCallbackExecutionErrorHandle {
        self.root_error_capture.error()
    }

    #[must_use]
    pub const fn root_error_capture(self) -> PassiveEffectRootErrorCaptureRecord {
        self.root_error_capture
    }

    #[must_use]
    pub const fn root_error_propagation(self) -> PassiveEffectRootErrorPropagationRecord {
        self.root_error_propagation
    }

    #[must_use]
    pub const fn schedule(self) -> RootErrorCaptureScheduleRecord {
        self.root_error_capture.schedule()
    }

    #[must_use]
    pub const fn error_option_callbacks(self) -> RootErrorOptionCallbackRecord {
        self.root_error_capture.error_option_callbacks()
    }

    #[must_use]
    pub const fn on_uncaught_error(self) -> RootErrorCallbackHandle {
        self.error_option_callbacks().on_uncaught_error()
    }

    #[must_use]
    pub const fn on_caught_error(self) -> RootErrorCallbackHandle {
        self.error_option_callbacks().on_caught_error()
    }

    #[must_use]
    pub const fn on_recoverable_error(self) -> RootRecoverableErrorCallbackHandle {
        self.error_option_callbacks().on_recoverable_error()
    }

    #[must_use]
    pub const fn status(self) -> PassiveEffectRootErrorRoutingStatus {
        if self.root_error_update_scheduled() {
            PassiveEffectRootErrorRoutingStatus::CapturedForRootUpdate
        } else {
            PassiveEffectRootErrorRoutingStatus::Blocked
        }
    }

    #[must_use]
    pub const fn root_error_update_scheduled(self) -> bool {
        self.root_error_capture.root_error_update_scheduled()
    }

    #[must_use]
    pub const fn root_error_callbacks_invoked(self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_error_boundaries_enabled(self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_act_error_aggregation_enabled(self) -> bool {
        false
    }

    #[must_use]
    pub const fn recoverable_error_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub const fn has_configured_error_callback(self) -> bool {
        self.error_option_callbacks()
            .has_configured_error_callback()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectCallbackExecutionErrorRecord {
    error_order: usize,
    kind: PassiveEffectCallbackExecutionErrorKind,
    root: FiberRootId,
    finished_work: FiberId,
    committed_lanes: Lanes,
    fiber: FiberId,
    effect_lanes: Lanes,
    phase: PendingPassiveEffectPhase,
    pending_order: PendingPassiveEffectOrder,
    flush_index: usize,
    effect_index: Option<usize>,
    effect: Option<HookEffectId>,
    instance: Option<HookEffectInstanceId>,
    callback: HookEffectCallbackHandle,
    error: PassiveEffectCallbackExecutionErrorHandle,
    root_error_capture: PassiveEffectRootErrorCaptureRecord,
    root_error_routing: PassiveEffectRootErrorRoutingRecord,
    root_error_propagation: PassiveEffectRootErrorPropagationRecord,
}

impl PassiveEffectCallbackExecutionErrorRecord {
    #[must_use]
    pub const fn error_order(self) -> usize {
        self.error_order
    }

    #[must_use]
    pub const fn kind(self) -> PassiveEffectCallbackExecutionErrorKind {
        self.kind
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub const fn committed_lanes(self) -> Lanes {
        self.committed_lanes
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn effect_lanes(self) -> Lanes {
        self.effect_lanes
    }

    #[must_use]
    pub const fn phase(self) -> PendingPassiveEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn pending_order(self) -> PendingPassiveEffectOrder {
        self.pending_order
    }

    #[must_use]
    pub const fn flush_index(self) -> usize {
        self.flush_index
    }

    #[must_use]
    pub const fn effect_index(self) -> Option<usize> {
        self.effect_index
    }

    #[must_use]
    pub const fn effect(self) -> Option<HookEffectId> {
        self.effect
    }

    #[must_use]
    pub const fn effect_instance(self) -> Option<HookEffectInstanceId> {
        self.instance
    }

    #[must_use]
    pub const fn callback(self) -> HookEffectCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn error(self) -> PassiveEffectCallbackExecutionErrorHandle {
        self.error
    }

    #[must_use]
    pub const fn root_error_capture(self) -> PassiveEffectRootErrorCaptureRecord {
        self.root_error_capture
    }

    #[must_use]
    pub const fn root_error_routing(self) -> PassiveEffectRootErrorRoutingRecord {
        self.root_error_routing
    }

    #[must_use]
    pub const fn root_error_propagation(self) -> PassiveEffectRootErrorPropagationRecord {
        self.root_error_propagation
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct PassiveEffectsFlushResult {
    root: FiberRootId,
    finished_work: Option<FiberId>,
    lanes: Lanes,
    status: PassiveEffectsFlushStatus,
    scheduler_driven_passive_execution_enabled: bool,
    root_error_propagation: Option<PassiveEffectRootErrorPropagationRecord>,
    records: Vec<PassiveEffectFlushRecord>,
    destroy_callback_executions: Vec<PassiveEffectDestroyCallbackExecutionRecord>,
    destroy_callback_errors: Vec<PassiveEffectDestroyCallbackErrorRecord>,
    mount_create_callback_executions: Vec<PassiveEffectMountCreateCallbackExecutionRecord>,
    mount_create_callback_errors: Vec<PassiveEffectMountCreateCallbackErrorRecord>,
    root_error_captures: Vec<PassiveEffectRootErrorCaptureRecord>,
    root_error_routing: Vec<PassiveEffectRootErrorRoutingRecord>,
    callback_execution_errors: Vec<PassiveEffectCallbackExecutionErrorRecord>,
}

impl PassiveEffectsFlushResult {
    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(&self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub const fn status(&self) -> PassiveEffectsFlushStatus {
        self.status
    }

    #[must_use]
    pub fn records(&self) -> &[PassiveEffectFlushRecord] {
        &self.records
    }

    #[must_use]
    pub const fn root_error_propagation(&self) -> Option<PassiveEffectRootErrorPropagationRecord> {
        self.root_error_propagation
    }

    #[must_use]
    pub fn destroy_callback_executions(&self) -> &[PassiveEffectDestroyCallbackExecutionRecord] {
        &self.destroy_callback_executions
    }

    #[must_use]
    pub fn destroy_callback_errors(&self) -> &[PassiveEffectDestroyCallbackErrorRecord] {
        &self.destroy_callback_errors
    }

    #[must_use]
    pub fn mount_create_callback_executions(
        &self,
    ) -> &[PassiveEffectMountCreateCallbackExecutionRecord] {
        &self.mount_create_callback_executions
    }

    #[must_use]
    pub fn mount_create_callback_errors(&self) -> &[PassiveEffectMountCreateCallbackErrorRecord] {
        &self.mount_create_callback_errors
    }

    #[must_use]
    pub fn root_error_captures(&self) -> &[PassiveEffectRootErrorCaptureRecord] {
        &self.root_error_captures
    }

    #[must_use]
    pub fn root_error_routing(&self) -> &[PassiveEffectRootErrorRoutingRecord] {
        &self.root_error_routing
    }

    #[must_use]
    pub fn callback_execution_errors(&self) -> &[PassiveEffectCallbackExecutionErrorRecord] {
        &self.callback_execution_errors
    }

    #[must_use]
    pub fn did_flush_records(&self) -> bool {
        !self.records.is_empty()
    }

    #[must_use]
    pub fn did_execute_destroy_callbacks(&self) -> bool {
        !self.destroy_callback_executions.is_empty()
    }

    #[must_use]
    pub fn did_record_destroy_callback_errors(&self) -> bool {
        !self.destroy_callback_errors.is_empty()
    }

    #[must_use]
    pub fn did_execute_mount_create_callbacks(&self) -> bool {
        !self.mount_create_callback_executions.is_empty()
    }

    #[must_use]
    pub fn did_record_mount_create_callback_errors(&self) -> bool {
        !self.mount_create_callback_errors.is_empty()
    }

    #[must_use]
    pub fn did_record_callback_execution_errors(&self) -> bool {
        !self.callback_execution_errors.is_empty()
    }

    #[must_use]
    pub fn did_schedule_root_error_captures(&self) -> bool {
        !self.root_error_captures.is_empty()
    }

    #[must_use]
    pub fn did_record_root_error_routing(&self) -> bool {
        !self.root_error_routing.is_empty()
    }

    #[must_use]
    pub fn did_record_blocked_root_error_propagation(&self) -> bool {
        self.did_record_callback_execution_errors() && self.root_error_propagation.is_some()
    }

    #[must_use]
    pub const fn consumed_pending_passive(&self) -> bool {
        matches!(self.status, PassiveEffectsFlushStatus::Flushed)
    }

    #[must_use]
    pub const fn mount_create_callback_execution_gate_status(
        &self,
    ) -> PassiveEffectMountCreateCallbackExecutionGateStatus {
        PassiveEffectMountCreateCallbackExecutionGateStatus::TestControlOnly
    }

    #[must_use]
    pub const fn mount_create_callback_execution_gate_blockers(
        &self,
    ) -> &[PassiveEffectMountCreateCallbackExecutionGateBlocker; 3] {
        &PASSIVE_EFFECT_MOUNT_CREATE_CALLBACK_EXECUTION_GATE_BLOCKERS
    }

    #[must_use]
    pub const fn public_effect_execution_enabled(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn scheduler_driven_passive_execution_enabled(&self) -> bool {
        self.scheduler_driven_passive_execution_enabled
    }

    fn mark_scheduler_driven_passive_execution_enabled(&mut self) {
        self.scheduler_driven_passive_execution_enabled = true;
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct PassiveEffectSchedulerFlushExecutionRecord {
    execution_order: usize,
    scheduler_gate: PassiveEffectSchedulerFlushGateRecord,
    scheduler_request: SchedulerPassiveEffectsFlushRequest,
    passive_effects: PassiveEffectsFlushResult,
}

impl PassiveEffectSchedulerFlushExecutionRecord {
    #[must_use]
    pub(crate) const fn execution_order(&self) -> usize {
        self.execution_order
    }

    #[must_use]
    pub(crate) const fn scheduler_gate(&self) -> PassiveEffectSchedulerFlushGateRecord {
        self.scheduler_gate
    }

    #[must_use]
    pub(crate) const fn scheduler_request(&self) -> SchedulerPassiveEffectsFlushRequest {
        self.scheduler_request
    }

    #[must_use]
    pub(crate) const fn passive_effects(&self) -> &PassiveEffectsFlushResult {
        &self.passive_effects
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.scheduler_request.root()
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.scheduler_request.finished_work()
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.scheduler_request.lanes()
    }

    #[must_use]
    pub(crate) const fn pending_unmount_count(&self) -> usize {
        self.scheduler_request.pending_unmount_count()
    }

    #[must_use]
    pub(crate) const fn pending_mount_count(&self) -> usize {
        self.scheduler_request.pending_mount_count()
    }

    #[must_use]
    pub(crate) const fn pending_record_count(&self) -> usize {
        self.scheduler_request.pending_record_count()
    }

    #[must_use]
    pub(crate) fn did_flush_pending_passive(&self) -> bool {
        self.passive_effects.consumed_pending_passive()
    }

    #[must_use]
    pub(crate) fn did_execute_private_callback_executors(&self) -> bool {
        self.passive_effects.did_execute_destroy_callbacks()
            || self.passive_effects.did_execute_mount_create_callbacks()
    }

    #[must_use]
    pub(crate) const fn executes_public_effects(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_package_behavior_changed(&self) -> bool {
        false
    }
}

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct PassiveEffectCallbackInvocationErrorHandle(u64);

impl PassiveEffectCallbackInvocationErrorHandle {
    pub const NONE: Self = Self(0);

    #[must_use]
    pub const fn from_raw(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub const fn raw(self) -> u64 {
        self.0
    }

    #[must_use]
    pub const fn is_none(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub const fn is_some(self) -> bool {
        self.0 != 0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectCallbackInvocationKind {
    Destroy,
    Create,
}

impl PassiveEffectCallbackInvocationKind {
    #[must_use]
    pub const fn phase(self) -> PendingPassiveEffectPhase {
        match self {
            Self::Destroy => PendingPassiveEffectPhase::Unmount,
            Self::Create => PendingPassiveEffectPhase::Mount,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectCallbackInvocationRequest {
    root: FiberRootId,
    finished_work: FiberId,
    committed_lanes: Lanes,
    fiber: FiberId,
    effect_lanes: Lanes,
    phase: PendingPassiveEffectPhase,
    pending_order: PendingPassiveEffectOrder,
    flush_index: usize,
    effect_index: usize,
    effect: HookEffectId,
    instance: HookEffectInstanceId,
    callback: HookEffectCallbackHandle,
    kind: PassiveEffectCallbackInvocationKind,
}

impl PassiveEffectCallbackInvocationRequest {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub const fn committed_lanes(self) -> Lanes {
        self.committed_lanes
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn effect_lanes(self) -> Lanes {
        self.effect_lanes
    }

    #[must_use]
    pub const fn phase(self) -> PendingPassiveEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn pending_order(self) -> PendingPassiveEffectOrder {
        self.pending_order
    }

    #[must_use]
    pub const fn flush_index(self) -> usize {
        self.flush_index
    }

    #[must_use]
    pub const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn callback(self) -> HookEffectCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn kind(self) -> PassiveEffectCallbackInvocationKind {
        self.kind
    }
}

pub(crate) trait PassiveEffectCallbackInvocationTestControl {
    fn invoke_passive_effect_destroy(
        &mut self,
        request: PassiveEffectCallbackInvocationRequest,
    ) -> Result<(), PassiveEffectCallbackInvocationErrorHandle>;

    fn invoke_passive_effect_create(
        &mut self,
        request: PassiveEffectCallbackInvocationRequest,
    ) -> Result<Option<HookEffectCallbackHandle>, PassiveEffectCallbackInvocationErrorHandle>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectCallbackInvocationStatus {
    Completed,
    Errored,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectCallbackInvocationGateStatus {
    TestControlOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PassiveEffectCallbackInvocationGateBlocker {
    PublicEffectExecution,
    PublicActCompatibility,
    SchedulerDrivenPassiveExecution,
}

pub(crate) const PASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS:
    [PassiveEffectCallbackInvocationGateBlocker; 3] = [
    PassiveEffectCallbackInvocationGateBlocker::PublicEffectExecution,
    PassiveEffectCallbackInvocationGateBlocker::PublicActCompatibility,
    PassiveEffectCallbackInvocationGateBlocker::SchedulerDrivenPassiveExecution,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectCallbackInvocationRecord {
    invocation_order: usize,
    request: PassiveEffectCallbackInvocationRequest,
    status: PassiveEffectCallbackInvocationStatus,
    error: Option<PassiveEffectCallbackInvocationErrorHandle>,
    returned_destroy: Option<HookEffectCallbackHandle>,
}

impl PassiveEffectCallbackInvocationRecord {
    #[must_use]
    pub const fn invocation_order(self) -> usize {
        self.invocation_order
    }

    #[must_use]
    pub const fn request(self) -> PassiveEffectCallbackInvocationRequest {
        self.request
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.request.root()
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.request.finished_work()
    }

    #[must_use]
    pub const fn committed_lanes(self) -> Lanes {
        self.request.committed_lanes()
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.request.fiber()
    }

    #[must_use]
    pub const fn effect_lanes(self) -> Lanes {
        self.request.effect_lanes()
    }

    #[must_use]
    pub const fn phase(self) -> PendingPassiveEffectPhase {
        self.request.phase()
    }

    #[must_use]
    pub const fn pending_order(self) -> PendingPassiveEffectOrder {
        self.request.pending_order()
    }

    #[must_use]
    pub const fn flush_index(self) -> usize {
        self.request.flush_index()
    }

    #[must_use]
    pub const fn effect_index(self) -> usize {
        self.request.effect_index()
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.request.effect()
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.request.instance()
    }

    #[must_use]
    pub const fn callback(self) -> HookEffectCallbackHandle {
        self.request.callback()
    }

    #[must_use]
    pub const fn kind(self) -> PassiveEffectCallbackInvocationKind {
        self.request.kind()
    }

    #[must_use]
    pub const fn status(self) -> PassiveEffectCallbackInvocationStatus {
        self.status
    }

    #[must_use]
    pub const fn error(self) -> Option<PassiveEffectCallbackInvocationErrorHandle> {
        self.error
    }

    #[must_use]
    pub const fn returned_destroy(self) -> Option<HookEffectCallbackHandle> {
        self.returned_destroy
    }

    #[must_use]
    pub const fn completed(self) -> bool {
        matches!(
            self.status,
            PassiveEffectCallbackInvocationStatus::Completed
        )
    }

    #[must_use]
    pub const fn errored(self) -> bool {
        matches!(self.status, PassiveEffectCallbackInvocationStatus::Errored)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct PassiveEffectCallbackInvocationGateSnapshot {
    root: FiberRootId,
    finished_work: Option<FiberId>,
    lanes: Lanes,
    flush_status: PassiveEffectsFlushStatus,
    root_error_propagation: Option<PassiveEffectRootErrorPropagationRecord>,
    flush_record_count: usize,
    skipped_flush_records_without_callbacks: usize,
    records: Vec<PassiveEffectCallbackInvocationRecord>,
}

impl PassiveEffectCallbackInvocationGateSnapshot {
    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(&self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub const fn flush_status(&self) -> PassiveEffectsFlushStatus {
        self.flush_status
    }

    #[must_use]
    pub const fn root_error_propagation(&self) -> Option<PassiveEffectRootErrorPropagationRecord> {
        self.root_error_propagation
    }

    #[must_use]
    pub const fn flush_record_count(&self) -> usize {
        self.flush_record_count
    }

    #[must_use]
    pub const fn skipped_flush_records_without_callbacks(&self) -> usize {
        self.skipped_flush_records_without_callbacks
    }

    #[must_use]
    pub fn records(&self) -> &[PassiveEffectCallbackInvocationRecord] {
        &self.records
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub fn completed_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.completed())
            .count()
    }

    #[must_use]
    pub fn error_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.errored())
            .count()
    }

    #[must_use]
    pub fn has_errors(&self) -> bool {
        self.records.iter().any(|record| record.errored())
    }

    #[must_use]
    pub fn did_record_blocked_root_error_propagation(&self) -> bool {
        self.has_errors() && self.root_error_propagation.is_some()
    }

    #[must_use]
    pub fn errors(&self) -> Vec<PassiveEffectCallbackInvocationErrorHandle> {
        self.records
            .iter()
            .filter_map(|record| record.error())
            .collect()
    }

    #[must_use]
    pub const fn status(&self) -> PassiveEffectCallbackInvocationGateStatus {
        PassiveEffectCallbackInvocationGateStatus::TestControlOnly
    }

    #[must_use]
    pub const fn blockers(&self) -> &[PassiveEffectCallbackInvocationGateBlocker; 3] {
        &PASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
    }

    #[must_use]
    pub const fn public_effect_execution_enabled(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn scheduler_driven_passive_execution_enabled(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct PassiveEffectDestroyCreateSchedulerPreflightRecord {
    scheduler_execution: PassiveEffectSchedulerFlushExecutionRecord,
    callback_invocation: PassiveEffectCallbackInvocationGateSnapshot,
}

#[allow(
    dead_code,
    reason = "crate-private passive destroy/create scheduler preflight evidence for deterministic canaries"
)]
impl PassiveEffectDestroyCreateSchedulerPreflightRecord {
    #[must_use]
    pub(crate) const fn scheduler_execution(&self) -> &PassiveEffectSchedulerFlushExecutionRecord {
        &self.scheduler_execution
    }

    #[must_use]
    pub(crate) const fn callback_invocation(&self) -> &PassiveEffectCallbackInvocationGateSnapshot {
        &self.callback_invocation
    }

    #[must_use]
    pub(crate) const fn scheduler_gate(&self) -> PassiveEffectSchedulerFlushGateRecord {
        self.scheduler_execution.scheduler_gate()
    }

    #[must_use]
    pub(crate) const fn scheduler_request(&self) -> SchedulerPassiveEffectsFlushRequest {
        self.scheduler_execution.scheduler_request()
    }

    #[must_use]
    pub(crate) const fn passive_effects(&self) -> &PassiveEffectsFlushResult {
        self.scheduler_execution.passive_effects()
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.scheduler_execution.root()
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.scheduler_execution.finished_work()
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.scheduler_execution.lanes()
    }

    #[must_use]
    pub(crate) const fn pending_unmount_count(&self) -> usize {
        self.scheduler_execution.pending_unmount_count()
    }

    #[must_use]
    pub(crate) const fn pending_mount_count(&self) -> usize {
        self.scheduler_execution.pending_mount_count()
    }

    #[must_use]
    pub(crate) const fn pending_record_count(&self) -> usize {
        self.scheduler_execution.pending_record_count()
    }

    #[must_use]
    pub(crate) fn did_flush_pending_passive(&self) -> bool {
        self.scheduler_execution.did_flush_pending_passive()
    }

    #[must_use]
    pub(crate) fn did_invoke_private_destroy_create_callbacks(&self) -> bool {
        let records = self.callback_invocation.records();
        records.iter().any(|record| {
            record.kind() == PassiveEffectCallbackInvocationKind::Destroy && record.completed()
        }) && records.iter().any(|record| {
            record.kind() == PassiveEffectCallbackInvocationKind::Create && record.completed()
        })
    }

    #[must_use]
    pub(crate) fn proves_destroy_before_create_order(&self) -> bool {
        let records = self.callback_invocation.records();
        let destroy_records = records
            .iter()
            .filter(|record| record.kind() == PassiveEffectCallbackInvocationKind::Destroy)
            .collect::<Vec<_>>();
        let create_records = records
            .iter()
            .filter(|record| record.kind() == PassiveEffectCallbackInvocationKind::Create)
            .collect::<Vec<_>>();

        !destroy_records.is_empty()
            && !create_records.is_empty()
            && destroy_records.iter().all(|destroy| {
                destroy.phase() == PendingPassiveEffectPhase::Unmount
                    && destroy.completed()
                    && create_records.iter().all(|create| {
                        create.phase() == PendingPassiveEffectPhase::Mount
                            && create.completed()
                            && destroy.invocation_order() < create.invocation_order()
                            && destroy.pending_order() < create.pending_order()
                    })
            })
    }

    #[must_use]
    pub(crate) fn private_scheduler_flush_request_metadata_consumed(&self) -> bool {
        self.scheduler_execution.did_flush_pending_passive()
            && self.scheduler_request().root() == self.root()
            && self.scheduler_request().finished_work() == self.finished_work()
            && self.scheduler_request().lanes() == self.lanes()
            && self.scheduler_request().pending_unmount_count() == self.pending_unmount_count()
            && self.scheduler_request().pending_mount_count() == self.pending_mount_count()
    }

    #[must_use]
    pub(crate) const fn executes_public_effects(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_effect_flushing_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn executes_public_root_work(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_scheduler_package_behavior_changed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn scheduler_driven_public_passive_execution_enabled(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum PassiveEffectDestroyCreateSchedulerPreflightError {
    PassiveEffects(PassiveEffectsFlushError),
    MissingPendingPassiveHandoff {
        root: FiberRootId,
    },
    MissingSchedulerRequest {
        root: FiberRootId,
    },
    SchedulerGateRootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    SchedulerGateFinishedWorkMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: Option<FiberId>,
    },
    SchedulerGateLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    SchedulerGateRecordCountMismatch {
        root: FiberRootId,
        expected_unmounts: usize,
        actual_unmounts: usize,
        expected_mounts: usize,
        actual_mounts: usize,
    },
    SchedulerRequestRootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    SchedulerRequestFinishedWorkMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: FiberId,
    },
    SchedulerRequestLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    SchedulerRequestRecordCountMismatch {
        root: FiberRootId,
        expected_unmounts: usize,
        actual_unmounts: usize,
        expected_mounts: usize,
        actual_mounts: usize,
    },
}

impl Display for PassiveEffectDestroyCreateSchedulerPreflightError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::PassiveEffects(error) => Display::fmt(error, formatter),
            Self::MissingPendingPassiveHandoff { root } => write!(
                formatter,
                "root {} passive destroy/create scheduler preflight requires a pending passive handoff",
                root.raw()
            ),
            Self::MissingSchedulerRequest { root } => write!(
                formatter,
                "root {} passive destroy/create scheduler preflight requires a scheduled passive flush request",
                root.raw()
            ),
            Self::SchedulerGateRootMismatch { expected, actual } => write!(
                formatter,
                "passive destroy/create scheduler preflight expected root {}, found scheduler gate root {}",
                expected.raw(),
                actual.raw()
            ),
            Self::SchedulerGateFinishedWorkMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} passive destroy/create scheduler preflight expected finished work fiber slot {}, found scheduler gate finished work {:?}",
                root.raw(),
                expected.slot().get(),
                actual.map(|fiber| fiber.slot().get())
            ),
            Self::SchedulerGateLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} passive destroy/create scheduler preflight expected lanes {:?}, found scheduler gate lanes {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::SchedulerGateRecordCountMismatch {
                root,
                expected_unmounts,
                actual_unmounts,
                expected_mounts,
                actual_mounts,
            } => write!(
                formatter,
                "root {} passive destroy/create scheduler preflight expected {} unmounts and {} mounts, found scheduler gate {} unmounts and {} mounts",
                root.raw(),
                expected_unmounts,
                expected_mounts,
                actual_unmounts,
                actual_mounts
            ),
            Self::SchedulerRequestRootMismatch { expected, actual } => write!(
                formatter,
                "passive destroy/create scheduler preflight expected scheduler request root {}, found {}",
                expected.raw(),
                actual.raw()
            ),
            Self::SchedulerRequestFinishedWorkMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} passive destroy/create scheduler preflight expected scheduler request finished work fiber slot {}, found {}",
                root.raw(),
                expected.slot().get(),
                actual.slot().get()
            ),
            Self::SchedulerRequestLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} passive destroy/create scheduler preflight expected scheduler request lanes {:?}, found {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::SchedulerRequestRecordCountMismatch {
                root,
                expected_unmounts,
                actual_unmounts,
                expected_mounts,
                actual_mounts,
            } => write!(
                formatter,
                "root {} passive destroy/create scheduler preflight expected scheduler request {} unmounts and {} mounts, found {} unmounts and {} mounts",
                root.raw(),
                expected_unmounts,
                expected_mounts,
                actual_unmounts,
                actual_mounts
            ),
        }
    }
}

impl Error for PassiveEffectDestroyCreateSchedulerPreflightError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::PassiveEffects(error) => Some(error),
            Self::MissingPendingPassiveHandoff { .. }
            | Self::MissingSchedulerRequest { .. }
            | Self::SchedulerGateRootMismatch { .. }
            | Self::SchedulerGateFinishedWorkMismatch { .. }
            | Self::SchedulerGateLanesMismatch { .. }
            | Self::SchedulerGateRecordCountMismatch { .. }
            | Self::SchedulerRequestRootMismatch { .. }
            | Self::SchedulerRequestFinishedWorkMismatch { .. }
            | Self::SchedulerRequestLanesMismatch { .. }
            | Self::SchedulerRequestRecordCountMismatch { .. } => None,
        }
    }
}

impl From<PassiveEffectsFlushError> for PassiveEffectDestroyCreateSchedulerPreflightError {
    fn from(error: PassiveEffectsFlushError) -> Self {
        Self::PassiveEffects(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct PassiveEffectReturnedDestroyHandlePersistenceRecord {
    persistence_order: usize,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    fiber: FiberId,
    effect: HookEffectId,
    effect_instance: HookEffectInstanceId,
    invocation_instance: HookEffectInstanceId,
    create: HookEffectCallbackHandle,
    previous_destroy: Option<HookEffectCallbackHandle>,
    returned_destroy: HookEffectCallbackHandle,
    stored_destroy: Option<HookEffectCallbackHandle>,
}

#[allow(
    dead_code,
    reason = "private passive create returned-destroy persistence canary"
)]
impl PassiveEffectReturnedDestroyHandlePersistenceRecord {
    #[must_use]
    pub const fn persistence_order(self) -> usize {
        self.persistence_order
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn effect_instance(self) -> HookEffectInstanceId {
        self.effect_instance
    }

    #[must_use]
    pub const fn invocation_instance(self) -> HookEffectInstanceId {
        self.invocation_instance
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn previous_destroy(self) -> Option<HookEffectCallbackHandle> {
        self.previous_destroy
    }

    #[must_use]
    pub const fn returned_destroy(self) -> HookEffectCallbackHandle {
        self.returned_destroy
    }

    #[must_use]
    pub const fn stored_destroy(self) -> Option<HookEffectCallbackHandle> {
        self.stored_destroy
    }

    #[must_use]
    pub fn proves_returned_destroy_persisted(self) -> bool {
        self.effect_instance == self.invocation_instance
            && self.stored_destroy == Some(self.returned_destroy)
    }

    #[must_use]
    pub const fn public_effect_execution_enabled(self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_act_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub const fn scheduler_driven_passive_execution_enabled(self) -> bool {
        false
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct PassiveEffectReturnedDestroyHandlePersistenceSnapshot {
    records: Vec<PassiveEffectReturnedDestroyHandlePersistenceRecord>,
}

#[allow(
    dead_code,
    reason = "private passive create returned-destroy persistence canary"
)]
impl PassiveEffectReturnedDestroyHandlePersistenceSnapshot {
    #[must_use]
    pub fn records(&self) -> &[PassiveEffectReturnedDestroyHandlePersistenceRecord] {
        &self.records
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub fn proves_returned_destroy_handles_persisted(&self) -> bool {
        !self.records.is_empty()
            && self
                .records
                .iter()
                .all(|record| record.proves_returned_destroy_persisted())
    }

    #[must_use]
    pub const fn public_effect_execution_enabled(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn scheduler_driven_passive_execution_enabled(&self) -> bool {
        false
    }
}

#[allow(
    dead_code,
    reason = "crate-private passive create returned-destroy persistence helper for deterministic canaries"
)]
pub(crate) fn persist_passive_effect_returned_destroy_handles_for_canary(
    hook_store: &mut FunctionComponentHookRenderStore,
    gate: &PassiveEffectCallbackInvocationGateSnapshot,
) -> Result<PassiveEffectReturnedDestroyHandlePersistenceSnapshot, HookEffectArenaError> {
    let mut records = Vec::new();

    for invocation in gate.records().iter().copied() {
        if invocation.kind() != PassiveEffectCallbackInvocationKind::Create
            || !invocation.completed()
        {
            continue;
        }

        let Some(returned_destroy) = invocation.returned_destroy() else {
            continue;
        };

        let effect_instance = hook_store
            .hook_effects()
            .get_effect(invocation.effect())?
            .instance();
        let previous_destroy = hook_store
            .hook_effects()
            .get_instance(invocation.instance())?
            .destroy();
        hook_store
            .hook_effects_mut()
            .get_instance_mut(invocation.instance())?
            .set_destroy(Some(returned_destroy));
        let stored_destroy = hook_store
            .hook_effects()
            .get_instance(invocation.instance())?
            .destroy();

        records.push(PassiveEffectReturnedDestroyHandlePersistenceRecord {
            persistence_order: records.len(),
            root: invocation.root(),
            finished_work: invocation.finished_work(),
            lanes: invocation.committed_lanes(),
            fiber: invocation.fiber(),
            effect: invocation.effect(),
            effect_instance,
            invocation_instance: invocation.instance(),
            create: invocation.callback(),
            previous_destroy,
            returned_destroy,
            stored_destroy,
        });
    }

    Ok(PassiveEffectReturnedDestroyHandlePersistenceSnapshot { records })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum EffectLifecycleExecutionPhase {
    Mutation,
    Layout,
    Passive,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum EffectLifecycleExecutionKind {
    LayoutDestroyMetadata,
    LayoutCreateCallback,
    PassiveDestroyCallback,
    PassiveCreateCallback,
    DeletedSubtreePassiveDestroyMetadata,
    DeletedSubtreePassiveDestroyCallback,
    DeletedSubtreeHostCleanupMetadata,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct EffectLifecycleExecutionRecord {
    sequence: usize,
    phase: EffectLifecycleExecutionPhase,
    kind: EffectLifecycleExecutionKind,
    root: FiberRootId,
    finished_work: FiberId,
    fiber: FiberId,
    effect: Option<HookEffectId>,
    callback: Option<HookEffectCallbackHandle>,
    metadata_sequence: Option<usize>,
    invocation_order: Option<usize>,
    pending_order: Option<PendingPassiveEffectOrder>,
}

#[allow(
    dead_code,
    reason = "crate-private effect lifecycle execution evidence for deterministic canaries"
)]
impl EffectLifecycleExecutionRecord {
    #[must_use]
    pub const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub const fn phase(self) -> EffectLifecycleExecutionPhase {
        self.phase
    }

    #[must_use]
    pub const fn phase_name(self) -> &'static str {
        effect_lifecycle_execution_phase_name(self.phase)
    }

    #[must_use]
    pub const fn kind(self) -> EffectLifecycleExecutionKind {
        self.kind
    }

    #[must_use]
    pub const fn kind_name(self) -> &'static str {
        effect_lifecycle_execution_kind_name(self.kind)
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn effect(self) -> Option<HookEffectId> {
        self.effect
    }

    #[must_use]
    pub const fn callback(self) -> Option<HookEffectCallbackHandle> {
        self.callback
    }

    #[must_use]
    pub const fn metadata_sequence(self) -> Option<usize> {
        self.metadata_sequence
    }

    #[must_use]
    pub const fn invocation_order(self) -> Option<usize> {
        self.invocation_order
    }

    #[must_use]
    pub const fn pending_order(self) -> Option<PendingPassiveEffectOrder> {
        self.pending_order
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct EffectLifecycleExecutionSnapshot {
    root: Option<FiberRootId>,
    finished_work: Option<FiberId>,
    lanes: Lanes,
    records: Vec<EffectLifecycleExecutionRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private effect lifecycle execution evidence for deterministic canaries"
)]
impl EffectLifecycleExecutionSnapshot {
    #[must_use]
    pub const fn root(&self) -> Option<FiberRootId> {
        self.root
    }

    #[must_use]
    pub const fn finished_work(&self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub fn records(&self) -> &[EffectLifecycleExecutionRecord] {
        &self.records
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub fn private_layout_callback_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.kind() == EffectLifecycleExecutionKind::LayoutCreateCallback)
            .count()
    }

    #[must_use]
    pub fn private_passive_callback_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                matches!(
                    record.kind(),
                    EffectLifecycleExecutionKind::PassiveDestroyCallback
                        | EffectLifecycleExecutionKind::PassiveCreateCallback
                        | EffectLifecycleExecutionKind::DeletedSubtreePassiveDestroyCallback
                )
            })
            .count()
    }

    #[must_use]
    pub fn proves_update_destroy_before_create_order(&self) -> bool {
        let (Some(root), Some(finished_work)) = (self.root, self.finished_work) else {
            return false;
        };

        self.records
            .iter()
            .map(|record| record.kind())
            .collect::<Vec<_>>()
            == vec![
                EffectLifecycleExecutionKind::LayoutDestroyMetadata,
                EffectLifecycleExecutionKind::LayoutCreateCallback,
                EffectLifecycleExecutionKind::PassiveDestroyCallback,
                EffectLifecycleExecutionKind::PassiveCreateCallback,
            ]
            && self.records.iter().enumerate().all(|(sequence, record)| {
                record.sequence() == sequence
                    && record.root() == root
                    && record.finished_work() == finished_work
            })
    }

    #[must_use]
    pub const fn public_effect_execution_enabled(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_effect_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn scheduler_driven_passive_execution_enabled(&self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct OffscreenPassiveDeferRevealEvidenceRecordForCanary {
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    offscreen: FiberId,
    hidden_subtree: FiberId,
    hidden_subtree_tag: FiberTag,
    hidden_update_lane: fast_react_core::Lane,
    hidden_update_count: usize,
    passive_record_count: usize,
    hidden_subtree_passive_record_count: usize,
    passive_unmount_count: usize,
    passive_mount_count: usize,
    first_passive_flush_index: Option<usize>,
    first_passive_pending_order: Option<PendingPassiveEffectOrder>,
    passive_visibility_effects_deferred: bool,
    passive_callbacks_deferred: bool,
    public_offscreen_compatibility_blocked: bool,
    public_passive_compatibility_blocked: bool,
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private Offscreen passive reveal evidence is reserved for deterministic canaries"
)]
impl OffscreenPassiveDeferRevealEvidenceRecordForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn offscreen(&self) -> FiberId {
        self.offscreen
    }

    #[must_use]
    pub(crate) const fn hidden_subtree(&self) -> FiberId {
        self.hidden_subtree
    }

    #[must_use]
    pub(crate) const fn hidden_subtree_tag(&self) -> FiberTag {
        self.hidden_subtree_tag
    }

    #[must_use]
    pub(crate) const fn hidden_update_lane(&self) -> fast_react_core::Lane {
        self.hidden_update_lane
    }

    #[must_use]
    pub(crate) const fn hidden_update_count(&self) -> usize {
        self.hidden_update_count
    }

    #[must_use]
    pub(crate) const fn passive_record_count(&self) -> usize {
        self.passive_record_count
    }

    #[must_use]
    pub(crate) const fn hidden_subtree_passive_record_count(&self) -> usize {
        self.hidden_subtree_passive_record_count
    }

    #[must_use]
    pub(crate) const fn passive_unmount_count(&self) -> usize {
        self.passive_unmount_count
    }

    #[must_use]
    pub(crate) const fn passive_mount_count(&self) -> usize {
        self.passive_mount_count
    }

    #[must_use]
    pub(crate) const fn first_passive_flush_index(&self) -> Option<usize> {
        self.first_passive_flush_index
    }

    #[must_use]
    pub(crate) const fn first_passive_pending_order(&self) -> Option<PendingPassiveEffectOrder> {
        self.first_passive_pending_order
    }

    #[must_use]
    pub(crate) const fn passive_visibility_effects_deferred(&self) -> bool {
        self.passive_visibility_effects_deferred
    }

    #[must_use]
    pub(crate) const fn passive_callbacks_deferred(&self) -> bool {
        self.passive_callbacks_deferred
    }

    #[must_use]
    pub(crate) const fn public_offscreen_compatibility_blocked(&self) -> bool {
        self.public_offscreen_compatibility_blocked
    }

    #[must_use]
    pub(crate) const fn public_passive_compatibility_blocked(&self) -> bool {
        self.public_passive_compatibility_blocked
    }

    #[must_use]
    pub(crate) const fn proves_deferred_reveal_for_one_hidden_subtree(&self) -> bool {
        self.passive_visibility_effects_deferred
            && self.passive_callbacks_deferred
            && self.public_offscreen_compatibility_blocked
            && self.public_passive_compatibility_blocked
            && self.hidden_subtree_passive_record_count == self.passive_record_count
            && self.passive_record_count > 0
            && self.passive_mount_count > 0
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum OffscreenPassiveDeferRevealEvidenceErrorForCanary {
    PassiveEffects(PassiveEffectsFlushError),
    RevealCommitMismatch {
        root: FiberRootId,
    },
    PassiveFlushRootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    PassiveFlushFinishedWorkMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: Option<FiberId>,
    },
    PassiveFlushLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    PassiveFlushNotConsumed {
        root: FiberRootId,
        status: PassiveEffectsFlushStatus,
    },
    MissingPassiveVisibilityDeferral {
        root: FiberRootId,
        offscreen: FiberId,
    },
    PublicOffscreenCompatibilityClaimed {
        root: FiberRootId,
        offscreen: FiberId,
    },
    PublicPassiveCompatibilityClaimed {
        root: FiberRootId,
    },
    UnexpectedPassiveCallbackExecution {
        root: FiberRootId,
    },
    MissingHiddenSubtreePassiveRecord {
        root: FiberRootId,
        hidden_subtree: FiberId,
    },
    PassiveRecordOutsideHiddenSubtree {
        root: FiberRootId,
        hidden_subtree: FiberId,
        fiber: FiberId,
    },
}

#[cfg(test)]
impl Display for OffscreenPassiveDeferRevealEvidenceErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::PassiveEffects(error) => Display::fmt(error, formatter),
            Self::RevealCommitMismatch { root } => write!(
                formatter,
                "root {} Offscreen passive reveal evidence requires reveal metadata matching the committed root",
                root.raw()
            ),
            Self::PassiveFlushRootMismatch { expected, actual } => write!(
                formatter,
                "Offscreen passive reveal evidence expected root {}, found root {}",
                expected.raw(),
                actual.raw()
            ),
            Self::PassiveFlushFinishedWorkMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} Offscreen passive reveal evidence expected finished work fiber slot {}, found {:?}",
                root.raw(),
                expected.slot().get(),
                actual.map(|fiber| fiber.slot().get())
            ),
            Self::PassiveFlushLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} Offscreen passive reveal evidence lanes {:?} do not match committed lanes {:?}",
                root.raw(),
                actual,
                expected
            ),
            Self::PassiveFlushNotConsumed { root, status } => write!(
                formatter,
                "root {} Offscreen passive reveal evidence requires a consumed passive flush, found {:?}",
                root.raw(),
                status
            ),
            Self::MissingPassiveVisibilityDeferral { root, offscreen } => write!(
                formatter,
                "root {} Offscreen fiber {} did not keep passive visibility effects deferred",
                root.raw(),
                offscreen.slot().get()
            ),
            Self::PublicOffscreenCompatibilityClaimed { root, offscreen } => write!(
                formatter,
                "root {} Offscreen fiber {} unexpectedly claimed public Offscreen compatibility",
                root.raw(),
                offscreen.slot().get()
            ),
            Self::PublicPassiveCompatibilityClaimed { root } => write!(
                formatter,
                "root {} Offscreen passive reveal evidence unexpectedly claimed public passive compatibility",
                root.raw()
            ),
            Self::UnexpectedPassiveCallbackExecution { root } => write!(
                formatter,
                "root {} Offscreen passive reveal evidence expected deferred passive callbacks",
                root.raw()
            ),
            Self::MissingHiddenSubtreePassiveRecord {
                root,
                hidden_subtree,
            } => write!(
                formatter,
                "root {} hidden subtree fiber {} has no passive reveal record",
                root.raw(),
                hidden_subtree.slot().get()
            ),
            Self::PassiveRecordOutsideHiddenSubtree {
                root,
                hidden_subtree,
                fiber,
            } => write!(
                formatter,
                "root {} passive fiber {} is outside hidden subtree fiber {}",
                root.raw(),
                fiber.slot().get(),
                hidden_subtree.slot().get()
            ),
        }
    }
}

#[cfg(test)]
impl Error for OffscreenPassiveDeferRevealEvidenceErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::PassiveEffects(error) => Some(error),
            Self::RevealCommitMismatch { .. }
            | Self::PassiveFlushRootMismatch { .. }
            | Self::PassiveFlushFinishedWorkMismatch { .. }
            | Self::PassiveFlushLanesMismatch { .. }
            | Self::PassiveFlushNotConsumed { .. }
            | Self::MissingPassiveVisibilityDeferral { .. }
            | Self::PublicOffscreenCompatibilityClaimed { .. }
            | Self::PublicPassiveCompatibilityClaimed { .. }
            | Self::UnexpectedPassiveCallbackExecution { .. }
            | Self::MissingHiddenSubtreePassiveRecord { .. }
            | Self::PassiveRecordOutsideHiddenSubtree { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<PassiveEffectsFlushError> for OffscreenPassiveDeferRevealEvidenceErrorForCanary {
    fn from(error: PassiveEffectsFlushError) -> Self {
        Self::PassiveEffects(error)
    }
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private Offscreen passive reveal evidence is reserved for deterministic canaries"
)]
pub(crate) fn record_offscreen_passive_defer_reveal_evidence_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    reveal_handoff: &HostRootOffscreenRevealCommitHandoffRecordForCanary,
    passive_flush: &PassiveEffectsFlushResult,
) -> Result<
    OffscreenPassiveDeferRevealEvidenceRecordForCanary,
    OffscreenPassiveDeferRevealEvidenceErrorForCanary,
> {
    let commit = reveal_handoff.commit();
    let root = commit.root();
    let reveal = reveal_handoff.reveal_metadata();
    let offscreen = reveal.offscreen();
    let hidden_subtree = reveal.child();

    if !reveal_handoff.complete_metadata_matches_commit() {
        return Err(
            OffscreenPassiveDeferRevealEvidenceErrorForCanary::RevealCommitMismatch { root },
        );
    }
    if passive_flush.root() != root {
        return Err(
            OffscreenPassiveDeferRevealEvidenceErrorForCanary::PassiveFlushRootMismatch {
                expected: root,
                actual: passive_flush.root(),
            },
        );
    }
    if passive_flush.finished_work() != Some(commit.finished_work()) {
        return Err(
            OffscreenPassiveDeferRevealEvidenceErrorForCanary::PassiveFlushFinishedWorkMismatch {
                root,
                expected: commit.finished_work(),
                actual: passive_flush.finished_work(),
            },
        );
    }
    if passive_flush.lanes() != commit.finished_lanes() {
        return Err(
            OffscreenPassiveDeferRevealEvidenceErrorForCanary::PassiveFlushLanesMismatch {
                root,
                expected: commit.finished_lanes(),
                actual: passive_flush.lanes(),
            },
        );
    }
    if !passive_flush.consumed_pending_passive() {
        return Err(
            OffscreenPassiveDeferRevealEvidenceErrorForCanary::PassiveFlushNotConsumed {
                root,
                status: passive_flush.status(),
            },
        );
    }
    let passive_visibility_effects_deferred = reveal_handoff.passive_visibility_effects_deferred();
    if !passive_visibility_effects_deferred {
        return Err(
            OffscreenPassiveDeferRevealEvidenceErrorForCanary::MissingPassiveVisibilityDeferral {
                root,
                offscreen,
            },
        );
    }
    let public_offscreen_compatibility_blocked = reveal_handoff.public_compatibility_blocked();
    if !public_offscreen_compatibility_blocked {
        return Err(
            OffscreenPassiveDeferRevealEvidenceErrorForCanary::PublicOffscreenCompatibilityClaimed {
                root,
                offscreen,
            },
        );
    }

    let public_passive_compatibility_blocked = reveal_handoff
        .public_passive_compatibility_blocked()
        && !passive_flush.public_effect_execution_enabled()
        && !passive_flush.public_act_compatibility_claimed()
        && !passive_flush.scheduler_driven_passive_execution_enabled();
    if !public_passive_compatibility_blocked {
        return Err(
            OffscreenPassiveDeferRevealEvidenceErrorForCanary::PublicPassiveCompatibilityClaimed {
                root,
            },
        );
    }

    let passive_callbacks_deferred = !passive_flush.did_execute_destroy_callbacks()
        && !passive_flush.did_execute_mount_create_callbacks()
        && passive_flush
            .records()
            .iter()
            .all(|record| !record.destroy_callback_invoked() && !record.create_callback_invoked());
    if !passive_callbacks_deferred {
        return Err(
            OffscreenPassiveDeferRevealEvidenceErrorForCanary::UnexpectedPassiveCallbackExecution {
                root,
            },
        );
    }

    let mut hidden_subtree_passive_record_count = 0;
    let mut passive_unmount_count = 0;
    let mut passive_mount_count = 0;
    let mut first_passive_flush_index = None;
    let mut first_passive_pending_order = None;
    for record in passive_flush.records() {
        if !committed_subtree_contains_fiber(store, hidden_subtree, record.fiber())? {
            return Err(
                OffscreenPassiveDeferRevealEvidenceErrorForCanary::PassiveRecordOutsideHiddenSubtree {
                    root,
                    hidden_subtree,
                    fiber: record.fiber(),
                },
            );
        }

        hidden_subtree_passive_record_count += 1;
        first_passive_flush_index = first_passive_flush_index.or(Some(record.flush_index()));
        first_passive_pending_order = first_passive_pending_order.or(Some(record.pending_order()));
        match record.phase() {
            PendingPassiveEffectPhase::Unmount => passive_unmount_count += 1,
            PendingPassiveEffectPhase::Mount => passive_mount_count += 1,
        }
    }

    if hidden_subtree_passive_record_count == 0 || passive_mount_count == 0 {
        return Err(
            OffscreenPassiveDeferRevealEvidenceErrorForCanary::MissingHiddenSubtreePassiveRecord {
                root,
                hidden_subtree,
            },
        );
    }

    Ok(OffscreenPassiveDeferRevealEvidenceRecordForCanary {
        root,
        finished_work: commit.finished_work(),
        lanes: commit.finished_lanes(),
        offscreen,
        hidden_subtree,
        hidden_subtree_tag: reveal.child_tag(),
        hidden_update_lane: reveal_handoff.execution_request().hidden_update_lane(),
        hidden_update_count: reveal_handoff.execution_request().hidden_update_count(),
        passive_record_count: passive_flush.records().len(),
        hidden_subtree_passive_record_count,
        passive_unmount_count,
        passive_mount_count,
        first_passive_flush_index,
        first_passive_pending_order,
        passive_visibility_effects_deferred,
        passive_callbacks_deferred,
        public_offscreen_compatibility_blocked,
        public_passive_compatibility_blocked,
    })
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum EffectLifecycleExecutionEvidenceError {
    MissingAcceptedEffectList {
        root: FiberRootId,
    },
    RootMismatch {
        expected: FiberRootId,
        actual: Option<FiberRootId>,
    },
    FinishedWorkMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: Option<FiberId>,
    },
    LanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    MissingPrivateLayoutExecution {
        root: FiberRootId,
    },
    MissingPrivatePassiveExecution {
        root: FiberRootId,
    },
    AcceptedMetadataMismatch {
        root: FiberRootId,
        message: &'static str,
    },
}

impl Display for EffectLifecycleExecutionEvidenceError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingAcceptedEffectList { root } => write!(
                formatter,
                "root {} effect lifecycle evidence requires accepted effect-list metadata",
                root.raw()
            ),
            Self::RootMismatch { expected, actual } => write!(
                formatter,
                "effect lifecycle evidence expected root {}, found {:?}",
                expected.raw(),
                actual.map(FiberRootId::raw)
            ),
            Self::FinishedWorkMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} effect lifecycle evidence expected finished work fiber slot {}, found {:?}",
                root.raw(),
                expected.slot().get(),
                actual.map(|fiber| fiber.slot().get())
            ),
            Self::LanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} effect lifecycle evidence lanes {:?} do not match accepted lanes {:?}",
                root.raw(),
                actual,
                expected
            ),
            Self::MissingPrivateLayoutExecution { root } => write!(
                formatter,
                "root {} effect lifecycle evidence requires private layout callback execution",
                root.raw()
            ),
            Self::MissingPrivatePassiveExecution { root } => write!(
                formatter,
                "root {} effect lifecycle evidence requires private passive callback execution",
                root.raw()
            ),
            Self::AcceptedMetadataMismatch { root, message } => write!(
                formatter,
                "root {} effect lifecycle accepted metadata mismatch: {}",
                root.raw(),
                message
            ),
        }
    }
}

impl Error for EffectLifecycleExecutionEvidenceError {}

#[allow(
    dead_code,
    reason = "crate-private update effect lifecycle execution evidence for deterministic canaries"
)]
pub(crate) fn record_update_effect_lifecycle_execution_evidence_for_canary(
    commit: &HostRootCommitRecord,
    layout_execution: &FunctionComponentLayoutEffectCallbackInvocationGateSnapshot,
    passive_execution: &PassiveEffectCallbackInvocationGateSnapshot,
) -> Result<EffectLifecycleExecutionSnapshot, EffectLifecycleExecutionEvidenceError> {
    validate_lifecycle_root_metadata(
        commit.root(),
        commit.finished_work(),
        commit.finished_lanes(),
        commit
            .function_component_effect_list_commit_phase_order()
            .root(),
        commit
            .function_component_effect_list_commit_phase_order()
            .finished_work(),
        commit
            .function_component_effect_list_commit_phase_order()
            .lanes(),
    )?;
    if commit
        .function_component_effect_list_commit_phase_order()
        .is_empty()
    {
        return Err(
            EffectLifecycleExecutionEvidenceError::MissingAcceptedEffectList {
                root: commit.root(),
            },
        );
    }
    validate_lifecycle_root_metadata(
        commit.root(),
        commit.finished_work(),
        commit.finished_lanes(),
        layout_execution.root(),
        layout_execution.finished_work(),
        layout_execution.lanes(),
    )?;
    validate_lifecycle_root_metadata(
        commit.root(),
        commit.finished_work(),
        commit.finished_lanes(),
        Some(passive_execution.root()),
        passive_execution.finished_work(),
        passive_execution.lanes(),
    )?;

    if layout_execution.len() != 1
        || layout_execution.has_errors()
        || !layout_execution.did_invoke_test_layout_callback()
    {
        return Err(
            EffectLifecycleExecutionEvidenceError::MissingPrivateLayoutExecution {
                root: commit.root(),
            },
        );
    }
    if passive_execution.len() != 2
        || passive_execution.has_errors()
        || passive_execution.skipped_flush_records_without_callbacks() != 0
    {
        return Err(
            EffectLifecycleExecutionEvidenceError::MissingPrivatePassiveExecution {
                root: commit.root(),
            },
        );
    }

    let effect_list = commit.function_component_effect_list_commit_phase_order();
    let layout_callback = layout_execution.records()[0];
    let layout_request = layout_callback.request();
    if !layout_request.after_matching_mutation_metadata()
        || !layout_request.before_passive_metadata()
    {
        return Err(
            EffectLifecycleExecutionEvidenceError::AcceptedMetadataMismatch {
                root: commit.root(),
                message: "layout callback is not ordered after mutation metadata and before passive metadata",
            },
        );
    }
    let layout_destroy_metadata = find_effect_list_record_by_sequence(
        effect_list.records(),
        layout_request.matched_mutation_sequence(),
    )
    .filter(|record| {
        record.phase() == FunctionComponentEffectListCommitPhase::Mutation
            && record.kind() == FunctionComponentEffectListCommitPhaseOrderKind::LayoutDestroy
            && record.fiber() == layout_callback.fiber()
            && record.destroy().is_some()
    })
    .ok_or(
        EffectLifecycleExecutionEvidenceError::AcceptedMetadataMismatch {
            root: commit.root(),
            message: "layout callback did not match accepted mutation layout-destroy metadata",
        },
    )?;

    let layout_create_metadata = find_effect_list_record_by_sequence(
        effect_list.records(),
        layout_request.effect_list_sequence(),
    )
    .filter(|record| {
        record.phase() == FunctionComponentEffectListCommitPhase::Layout
            && record.kind() == FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate
            && record.fiber() == layout_callback.fiber()
            && record.create() == Some(layout_callback.callback())
    })
    .ok_or(
        EffectLifecycleExecutionEvidenceError::AcceptedMetadataMismatch {
            root: commit.root(),
            message: "layout callback did not match accepted layout-create metadata",
        },
    )?;

    let passive_records = passive_execution.records();
    let passive_destroy = passive_records
        .iter()
        .find(|record| record.kind() == PassiveEffectCallbackInvocationKind::Destroy)
        .ok_or(
            EffectLifecycleExecutionEvidenceError::MissingPrivatePassiveExecution {
                root: commit.root(),
            },
        )?;
    let passive_create = passive_records
        .iter()
        .find(|record| record.kind() == PassiveEffectCallbackInvocationKind::Create)
        .ok_or(
            EffectLifecycleExecutionEvidenceError::MissingPrivatePassiveExecution {
                root: commit.root(),
            },
        )?;
    if passive_destroy.invocation_order() >= passive_create.invocation_order()
        || passive_destroy.pending_order() >= passive_create.pending_order()
        || passive_destroy.phase() != PendingPassiveEffectPhase::Unmount
        || passive_create.phase() != PendingPassiveEffectPhase::Mount
    {
        return Err(
            EffectLifecycleExecutionEvidenceError::AcceptedMetadataMismatch {
                root: commit.root(),
                message: "passive destroy callback is not ordered before passive create callback",
            },
        );
    }

    let passive_destroy_metadata = find_matching_passive_schedule_record(
        effect_list.records(),
        *passive_destroy,
        FunctionComponentEffectListCommitPhaseOrderKind::PassiveUnmountScheduled,
    )
    .ok_or(
        EffectLifecycleExecutionEvidenceError::AcceptedMetadataMismatch {
            root: commit.root(),
            message: "passive destroy callback did not match accepted passive-unmount metadata",
        },
    )?;
    let passive_create_metadata = find_matching_passive_schedule_record(
        effect_list.records(),
        *passive_create,
        FunctionComponentEffectListCommitPhaseOrderKind::PassiveMountScheduled,
    )
    .ok_or(
        EffectLifecycleExecutionEvidenceError::AcceptedMetadataMismatch {
            root: commit.root(),
            message: "passive create callback did not match accepted passive-mount metadata",
        },
    )?;

    let mut snapshot = EffectLifecycleExecutionSnapshot {
        root: Some(commit.root()),
        finished_work: Some(commit.finished_work()),
        lanes: commit.finished_lanes(),
        records: Vec::new(),
    };
    snapshot.push(
        EffectLifecycleExecutionPhase::Mutation,
        EffectLifecycleExecutionKind::LayoutDestroyMetadata,
        commit.root(),
        commit.finished_work(),
        layout_destroy_metadata.fiber(),
        layout_destroy_metadata.effect(),
        layout_destroy_metadata.destroy(),
        Some(layout_destroy_metadata.sequence()),
        None,
        None,
    );
    snapshot.push(
        EffectLifecycleExecutionPhase::Layout,
        EffectLifecycleExecutionKind::LayoutCreateCallback,
        commit.root(),
        commit.finished_work(),
        layout_create_metadata.fiber(),
        layout_create_metadata.effect(),
        Some(layout_callback.callback()),
        Some(layout_create_metadata.sequence()),
        Some(layout_callback.invocation_order()),
        None,
    );
    snapshot.push_passive_callback_record(
        EffectLifecycleExecutionKind::PassiveDestroyCallback,
        passive_destroy_metadata,
        *passive_destroy,
    );
    snapshot.push_passive_callback_record(
        EffectLifecycleExecutionKind::PassiveCreateCallback,
        passive_create_metadata,
        *passive_create,
    );

    Ok(snapshot)
}

impl EffectLifecycleExecutionSnapshot {
    #[allow(
        clippy::too_many_arguments,
        reason = "private evidence accumulator records each lifecycle dimension explicitly"
    )]
    fn push(
        &mut self,
        phase: EffectLifecycleExecutionPhase,
        kind: EffectLifecycleExecutionKind,
        root: FiberRootId,
        finished_work: FiberId,
        fiber: FiberId,
        effect: Option<HookEffectId>,
        callback: Option<HookEffectCallbackHandle>,
        metadata_sequence: Option<usize>,
        invocation_order: Option<usize>,
        pending_order: Option<PendingPassiveEffectOrder>,
    ) {
        self.records.push(EffectLifecycleExecutionRecord {
            sequence: self.records.len(),
            phase,
            kind,
            root,
            finished_work,
            fiber,
            effect,
            callback,
            metadata_sequence,
            invocation_order,
            pending_order,
        });
    }

    fn push_passive_callback_record(
        &mut self,
        kind: EffectLifecycleExecutionKind,
        metadata: FunctionComponentEffectListCommitPhaseOrderRecord,
        callback: PassiveEffectCallbackInvocationRecord,
    ) {
        self.push(
            EffectLifecycleExecutionPhase::Passive,
            kind,
            callback.root(),
            callback.finished_work(),
            callback.fiber(),
            Some(callback.effect()),
            Some(callback.callback()),
            Some(metadata.sequence()),
            Some(callback.invocation_order()),
            Some(callback.pending_order()),
        );
    }
}

fn validate_lifecycle_root_metadata(
    expected_root: FiberRootId,
    expected_finished_work: FiberId,
    expected_lanes: Lanes,
    actual_root: Option<FiberRootId>,
    actual_finished_work: Option<FiberId>,
    actual_lanes: Lanes,
) -> Result<(), EffectLifecycleExecutionEvidenceError> {
    if actual_root != Some(expected_root) {
        return Err(EffectLifecycleExecutionEvidenceError::RootMismatch {
            expected: expected_root,
            actual: actual_root,
        });
    }
    if actual_finished_work != Some(expected_finished_work) {
        return Err(
            EffectLifecycleExecutionEvidenceError::FinishedWorkMismatch {
                root: expected_root,
                expected: expected_finished_work,
                actual: actual_finished_work,
            },
        );
    }
    if actual_lanes != expected_lanes {
        return Err(EffectLifecycleExecutionEvidenceError::LanesMismatch {
            root: expected_root,
            expected: expected_lanes,
            actual: actual_lanes,
        });
    }

    Ok(())
}

fn find_effect_list_record_by_sequence(
    records: &[FunctionComponentEffectListCommitPhaseOrderRecord],
    sequence: usize,
) -> Option<FunctionComponentEffectListCommitPhaseOrderRecord> {
    records
        .iter()
        .find(|record| record.sequence() == sequence)
        .copied()
}

fn find_matching_passive_schedule_record(
    records: &[FunctionComponentEffectListCommitPhaseOrderRecord],
    callback: PassiveEffectCallbackInvocationRecord,
    kind: FunctionComponentEffectListCommitPhaseOrderKind,
) -> Option<FunctionComponentEffectListCommitPhaseOrderRecord> {
    records
        .iter()
        .find(|record| {
            record.phase() == FunctionComponentEffectListCommitPhase::PassiveScheduling
                && record.kind() == kind
                && record.fiber() == callback.fiber()
                && record.effect() == Some(callback.effect())
                && record.create()
                    == (callback.kind() == PassiveEffectCallbackInvocationKind::Create)
                        .then_some(callback.callback())
                && record.destroy()
                    == (callback.kind() == PassiveEffectCallbackInvocationKind::Destroy)
                        .then_some(callback.callback())
        })
        .copied()
}

const fn effect_lifecycle_execution_phase_name(
    phase: EffectLifecycleExecutionPhase,
) -> &'static str {
    match phase {
        EffectLifecycleExecutionPhase::Mutation => "mutation",
        EffectLifecycleExecutionPhase::Layout => "layout",
        EffectLifecycleExecutionPhase::Passive => "passive",
    }
}

const fn effect_lifecycle_execution_kind_name(kind: EffectLifecycleExecutionKind) -> &'static str {
    match kind {
        EffectLifecycleExecutionKind::LayoutDestroyMetadata => "layout-destroy-metadata",
        EffectLifecycleExecutionKind::LayoutCreateCallback => "layout-create-callback",
        EffectLifecycleExecutionKind::PassiveDestroyCallback => "passive-destroy-callback",
        EffectLifecycleExecutionKind::PassiveCreateCallback => "passive-create-callback",
        EffectLifecycleExecutionKind::DeletedSubtreePassiveDestroyMetadata => {
            "deleted-subtree-passive-destroy-metadata"
        }
        EffectLifecycleExecutionKind::DeletedSubtreePassiveDestroyCallback => {
            "deleted-subtree-passive-destroy-callback"
        }
        EffectLifecycleExecutionKind::DeletedSubtreeHostCleanupMetadata => {
            "deleted-subtree-host-cleanup-metadata"
        }
    }
}

pub(crate) fn invoke_passive_effect_callbacks_under_test_control(
    flush: PassiveEffectsFlushResult,
    control: &mut impl PassiveEffectCallbackInvocationTestControl,
) -> PassiveEffectCallbackInvocationGateSnapshot {
    let root = flush.root;
    let finished_work = flush.finished_work;
    let lanes = flush.lanes;
    let flush_status = flush.status;
    let root_error_propagation = flush.root_error_propagation;
    let flush_record_count = flush.records.len();
    let mut skipped_flush_records_without_callbacks = 0;
    let mut records = Vec::new();
    let mut destroy_requests = Vec::new();
    let mut create_requests = Vec::new();

    for flush_record in flush.records {
        let Some(request) = passive_effect_callback_invocation_request(flush_record) else {
            skipped_flush_records_without_callbacks += 1;
            continue;
        };

        match request.kind() {
            PassiveEffectCallbackInvocationKind::Destroy => destroy_requests.push(request),
            PassiveEffectCallbackInvocationKind::Create => create_requests.push(request),
        }
    }

    destroy_requests.sort_by_key(|request| (request.pending_order(), request.flush_index()));
    create_requests.sort_by_key(|request| (request.pending_order(), request.flush_index()));

    for request in destroy_requests.into_iter().chain(create_requests) {
        let invocation_order = records.len();
        let record = match request.kind() {
            PassiveEffectCallbackInvocationKind::Destroy => {
                match control.invoke_passive_effect_destroy(request) {
                    Ok(()) => PassiveEffectCallbackInvocationRecord {
                        invocation_order,
                        request,
                        status: PassiveEffectCallbackInvocationStatus::Completed,
                        error: None,
                        returned_destroy: None,
                    },
                    Err(error) => PassiveEffectCallbackInvocationRecord {
                        invocation_order,
                        request,
                        status: PassiveEffectCallbackInvocationStatus::Errored,
                        error: Some(error),
                        returned_destroy: None,
                    },
                }
            }
            PassiveEffectCallbackInvocationKind::Create => {
                match control.invoke_passive_effect_create(request) {
                    Ok(returned_destroy) => PassiveEffectCallbackInvocationRecord {
                        invocation_order,
                        request,
                        status: PassiveEffectCallbackInvocationStatus::Completed,
                        error: None,
                        returned_destroy: returned_destroy.filter(|destroy| destroy.is_some()),
                    },
                    Err(error) => PassiveEffectCallbackInvocationRecord {
                        invocation_order,
                        request,
                        status: PassiveEffectCallbackInvocationStatus::Errored,
                        error: Some(error),
                        returned_destroy: None,
                    },
                }
            }
        };
        records.push(record);
    }

    PassiveEffectCallbackInvocationGateSnapshot {
        root,
        finished_work,
        lanes,
        flush_status,
        root_error_propagation,
        flush_record_count,
        skipped_flush_records_without_callbacks,
        records,
    }
}

fn passive_effect_callback_invocation_request(
    flush_record: PassiveEffectFlushRecord,
) -> Option<PassiveEffectCallbackInvocationRequest> {
    let effect_record = flush_record.effect_record()?;
    let (kind, callback) = match flush_record.phase() {
        PendingPassiveEffectPhase::Unmount => (
            PassiveEffectCallbackInvocationKind::Destroy,
            effect_record.destroy_callback()?,
        ),
        PendingPassiveEffectPhase::Mount => (
            PassiveEffectCallbackInvocationKind::Create,
            effect_record.create_callback()?,
        ),
    };

    if callback.is_none() {
        return None;
    }

    Some(PassiveEffectCallbackInvocationRequest {
        root: flush_record.root(),
        finished_work: flush_record.finished_work(),
        committed_lanes: flush_record.committed_lanes(),
        fiber: flush_record.fiber(),
        effect_lanes: flush_record.effect_lanes(),
        phase: flush_record.phase(),
        pending_order: flush_record.pending_order(),
        flush_index: flush_record.flush_index(),
        effect_index: effect_record.effect_index(),
        effect: effect_record.effect(),
        instance: effect_record.instance(),
        callback,
        kind,
    })
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct PassiveEffectsFlushWithSyncFlushContinuationResult {
    passive_effects: PassiveEffectsFlushResult,
    sync_flush_continuation: Option<SyncFlushPostPassiveContinuationExecutionRecord>,
}

impl PassiveEffectsFlushWithSyncFlushContinuationResult {
    #[must_use]
    pub(crate) const fn passive_effects(&self) -> &PassiveEffectsFlushResult {
        &self.passive_effects
    }

    #[must_use]
    pub(crate) fn sync_flush_continuation(
        &self,
    ) -> Option<&SyncFlushPostPassiveContinuationExecutionRecord> {
        self.sync_flush_continuation.as_ref()
    }

    #[must_use]
    pub(crate) fn did_request_follow_up_sync_flush(&self) -> bool {
        match &self.sync_flush_continuation {
            Some(continuation) => continuation.did_request_follow_up_sync_flush(),
            None => false,
        }
    }

    #[must_use]
    pub(crate) fn did_flush_follow_up_sync_work(&self) -> bool {
        match &self.sync_flush_continuation {
            Some(continuation) => continuation.did_flush_follow_up_sync_work(),
            None => false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum PassiveEffectsFlushError {
    FiberRootStore(FiberRootStoreError),
    RootScheduler(RootSchedulerError),
    PendingPassiveRootMismatch {
        commit_root: FiberRootId,
        pending_root: Option<FiberRootId>,
    },
    PendingPassiveFinishedWorkMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: Option<FiberId>,
    },
    PendingPassiveLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    PendingPassiveRecordCountMismatch {
        root: FiberRootId,
        expected_unmounts: usize,
        actual_unmounts: usize,
        expected_mounts: usize,
        actual_mounts: usize,
    },
    PendingPassiveEffectHandoffRootMismatch {
        commit_root: FiberRootId,
        handoff_root: FiberRootId,
    },
    PendingPassiveEffectHandoffLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    PendingPassiveEffectHandoffRecordCountMismatch {
        root: FiberRootId,
        expected_unmounts: usize,
        actual_unmounts: usize,
        expected_mounts: usize,
        actual_mounts: usize,
    },
    PendingPassiveEffectHandoffDuplicateOrder {
        root: FiberRootId,
        order: PendingPassiveEffectOrder,
    },
    PendingPassiveEffectHandoffRecordMismatch {
        root: FiberRootId,
        fiber: FiberId,
        phase: PendingPassiveEffectPhase,
        order: PendingPassiveEffectOrder,
    },
    CommittedPassiveEffectRecordCountMismatch {
        root: FiberRootId,
        expected_unmounts: usize,
        actual_unmounts: usize,
        expected_mounts: usize,
        actual_mounts: usize,
    },
    CommittedPassiveEffectDuplicateOrder {
        root: FiberRootId,
        order: PendingPassiveEffectOrder,
    },
    CommittedPassiveEffectRecordMismatch {
        root: FiberRootId,
        fiber: FiberId,
        phase: PendingPassiveEffectPhase,
        order: PendingPassiveEffectOrder,
    },
    SchedulerPassiveFlushMissingPendingHandoff {
        root: FiberRootId,
    },
    SchedulerPassiveFlushGateRootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    SchedulerPassiveFlushGateFinishedWorkMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: Option<FiberId>,
    },
    SchedulerPassiveFlushGateLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    SchedulerPassiveFlushGateRecordCountMismatch {
        root: FiberRootId,
        expected_unmounts: usize,
        actual_unmounts: usize,
        expected_mounts: usize,
        actual_mounts: usize,
    },
    SchedulerPassiveFlushRequestRootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    SchedulerPassiveFlushRequestFinishedWorkMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: FiberId,
    },
    SchedulerPassiveFlushRequestLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    SchedulerPassiveFlushRequestRecordCountMismatch {
        root: FiberRootId,
        expected_unmounts: usize,
        actual_unmounts: usize,
        expected_mounts: usize,
        actual_mounts: usize,
    },
    CommittedPassiveCallbackInvocationMissingHandoff {
        root: FiberRootId,
    },
    CommittedPassiveCallbackInvocationFiberCountMismatch {
        root: FiberRootId,
        expected: usize,
        actual: usize,
    },
    CommittedPassiveCallbackInvocationStaleFiber {
        root: FiberRootId,
        finished_work: FiberId,
        fiber: FiberId,
    },
    CommittedPassiveCallbackInvocationWrongRenderPhase {
        root: FiberRootId,
        fiber: FiberId,
        expected: FunctionComponentHookRenderPhase,
        actual: FunctionComponentHookRenderPhase,
    },
    CommittedPassiveCallbackInvocationWrongEffectPhase {
        root: FiberRootId,
        fiber: FiberId,
        phase: PendingPassiveEffectPhase,
        order: PendingPassiveEffectOrder,
    },
}

impl Display for PassiveEffectsFlushError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::RootScheduler(error) => Display::fmt(error, formatter),
            Self::PendingPassiveRootMismatch {
                commit_root,
                pending_root,
            } => match pending_root {
                Some(pending_root) => write!(
                    formatter,
                    "commit root {} cannot flush pending passive metadata for root {}",
                    commit_root.raw(),
                    pending_root.raw()
                ),
                None => write!(
                    formatter,
                    "commit root {} has a passive handoff but no pending passive root metadata",
                    commit_root.raw()
                ),
            },
            Self::PendingPassiveFinishedWorkMismatch {
                root,
                expected,
                actual,
            } => match actual {
                Some(actual) => write!(
                    formatter,
                    "root {} pending passive finished work fiber slot {} does not match commit finished work fiber slot {}",
                    root.raw(),
                    actual.slot().get(),
                    expected.slot().get()
                ),
                None => write!(
                    formatter,
                    "root {} pending passive metadata is missing committed finished work fiber slot {}",
                    root.raw(),
                    expected.slot().get()
                ),
            },
            Self::PendingPassiveLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} pending passive lanes {:?} do not match commit lanes {:?}",
                root.raw(),
                actual,
                expected
            ),
            Self::PendingPassiveRecordCountMismatch {
                root,
                expected_unmounts,
                actual_unmounts,
                expected_mounts,
                actual_mounts,
            } => write!(
                formatter,
                "root {} pending passive record counts changed after commit: expected {} unmounts and {} mounts, found {} unmounts and {} mounts",
                root.raw(),
                expected_unmounts,
                expected_mounts,
                actual_unmounts,
                actual_mounts
            ),
            Self::PendingPassiveEffectHandoffRootMismatch {
                commit_root,
                handoff_root,
            } => write!(
                formatter,
                "commit root {} cannot flush function component passive effect handoff for root {}",
                commit_root.raw(),
                handoff_root.raw()
            ),
            Self::PendingPassiveEffectHandoffLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} function component passive effect handoff lanes {:?} do not match commit lanes {:?}",
                root.raw(),
                actual,
                expected
            ),
            Self::PendingPassiveEffectHandoffRecordCountMismatch {
                root,
                expected_unmounts,
                actual_unmounts,
                expected_mounts,
                actual_mounts,
            } => write!(
                formatter,
                "root {} function component passive effect handoff counts changed after queueing: expected {} unmounts and {} mounts, found {} unmounts and {} mounts",
                root.raw(),
                expected_unmounts,
                expected_mounts,
                actual_unmounts,
                actual_mounts
            ),
            Self::PendingPassiveEffectHandoffDuplicateOrder { root, order } => write!(
                formatter,
                "root {} function component passive effect handoff repeats pending passive {:?} order {}",
                root.raw(),
                order.phase(),
                order.sequence()
            ),
            Self::PendingPassiveEffectHandoffRecordMismatch {
                root,
                fiber,
                phase,
                order,
            } => write!(
                formatter,
                "root {} function component passive effect handoff is missing {:?} record for fiber slot {} at pending order {}",
                root.raw(),
                phase,
                fiber.slot().get(),
                order.sequence()
            ),
            Self::CommittedPassiveEffectRecordCountMismatch {
                root,
                expected_unmounts,
                actual_unmounts,
                expected_mounts,
                actual_mounts,
            } => write!(
                formatter,
                "root {} committed function component passive effect counts do not match pending passive records: expected {} unmounts and {} mounts, found {} unmounts and {} mounts",
                root.raw(),
                expected_unmounts,
                expected_mounts,
                actual_unmounts,
                actual_mounts
            ),
            Self::CommittedPassiveEffectDuplicateOrder { root, order } => write!(
                formatter,
                "root {} committed function component passive effect records repeat pending passive {:?} order {}",
                root.raw(),
                order.phase(),
                order.sequence()
            ),
            Self::CommittedPassiveEffectRecordMismatch {
                root,
                fiber,
                phase,
                order,
            } => write!(
                formatter,
                "root {} committed function component passive effect records are missing {:?} record for fiber slot {} at pending order {}",
                root.raw(),
                phase,
                fiber.slot().get(),
                order.sequence()
            ),
            Self::SchedulerPassiveFlushMissingPendingHandoff { root } => write!(
                formatter,
                "root {} scheduler passive flush requires a pending passive commit handoff",
                root.raw()
            ),
            Self::SchedulerPassiveFlushGateRootMismatch { expected, actual } => write!(
                formatter,
                "scheduler passive flush expected root {}, found gate root {}",
                expected.raw(),
                actual.raw()
            ),
            Self::SchedulerPassiveFlushGateFinishedWorkMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} scheduler passive flush expected finished work fiber slot {}, found gate finished work {:?}",
                root.raw(),
                expected.slot().get(),
                actual.map(|fiber| fiber.slot().get())
            ),
            Self::SchedulerPassiveFlushGateLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} scheduler passive flush expected lanes {:?}, found gate lanes {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::SchedulerPassiveFlushGateRecordCountMismatch {
                root,
                expected_unmounts,
                actual_unmounts,
                expected_mounts,
                actual_mounts,
            } => write!(
                formatter,
                "root {} scheduler passive flush expected gate {} unmounts and {} mounts, found {} unmounts and {} mounts",
                root.raw(),
                expected_unmounts,
                expected_mounts,
                actual_unmounts,
                actual_mounts
            ),
            Self::SchedulerPassiveFlushRequestRootMismatch { expected, actual } => write!(
                formatter,
                "scheduler passive flush expected scheduler request root {}, found {}",
                expected.raw(),
                actual.raw()
            ),
            Self::SchedulerPassiveFlushRequestFinishedWorkMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} scheduler passive flush expected request finished work fiber slot {}, found {}",
                root.raw(),
                expected.slot().get(),
                actual.slot().get()
            ),
            Self::SchedulerPassiveFlushRequestLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} scheduler passive flush expected request lanes {:?}, found {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::SchedulerPassiveFlushRequestRecordCountMismatch {
                root,
                expected_unmounts,
                actual_unmounts,
                expected_mounts,
                actual_mounts,
            } => write!(
                formatter,
                "root {} scheduler passive flush expected request {} unmounts and {} mounts, found {} unmounts and {} mounts",
                root.raw(),
                expected_unmounts,
                expected_mounts,
                actual_unmounts,
                actual_mounts
            ),
            Self::CommittedPassiveCallbackInvocationMissingHandoff { root } => write!(
                formatter,
                "root {} committed passive callback invocation requires a pending passive commit handoff",
                root.raw()
            ),
            Self::CommittedPassiveCallbackInvocationFiberCountMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} committed passive callback invocation requires {} committed function component fiber, found {}",
                root.raw(),
                expected,
                actual
            ),
            Self::CommittedPassiveCallbackInvocationStaleFiber {
                root,
                finished_work,
                fiber,
            } => write!(
                formatter,
                "root {} committed passive callback invocation rejected stale function component fiber slot {} outside finished work fiber slot {}",
                root.raw(),
                fiber.slot().get(),
                finished_work.slot().get()
            ),
            Self::CommittedPassiveCallbackInvocationWrongRenderPhase {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} committed passive callback invocation expected {:?} function component fiber slot {}, found {:?}",
                root.raw(),
                expected,
                fiber.slot().get(),
                actual
            ),
            Self::CommittedPassiveCallbackInvocationWrongEffectPhase {
                root,
                fiber,
                phase,
                order,
            } => write!(
                formatter,
                "root {} committed passive callback invocation rejected {:?} effect record for fiber slot {} with pending {:?} order {}",
                root.raw(),
                phase,
                fiber.slot().get(),
                order.phase(),
                order.sequence()
            ),
        }
    }
}

impl Error for PassiveEffectsFlushError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::RootScheduler(error) => Some(error),
            Self::PendingPassiveRootMismatch { .. }
            | Self::PendingPassiveFinishedWorkMismatch { .. }
            | Self::PendingPassiveLanesMismatch { .. }
            | Self::PendingPassiveRecordCountMismatch { .. }
            | Self::PendingPassiveEffectHandoffRootMismatch { .. }
            | Self::PendingPassiveEffectHandoffLanesMismatch { .. }
            | Self::PendingPassiveEffectHandoffRecordCountMismatch { .. }
            | Self::PendingPassiveEffectHandoffDuplicateOrder { .. }
            | Self::PendingPassiveEffectHandoffRecordMismatch { .. }
            | Self::CommittedPassiveEffectRecordCountMismatch { .. }
            | Self::CommittedPassiveEffectDuplicateOrder { .. }
            | Self::CommittedPassiveEffectRecordMismatch { .. }
            | Self::SchedulerPassiveFlushMissingPendingHandoff { .. }
            | Self::SchedulerPassiveFlushGateRootMismatch { .. }
            | Self::SchedulerPassiveFlushGateFinishedWorkMismatch { .. }
            | Self::SchedulerPassiveFlushGateLanesMismatch { .. }
            | Self::SchedulerPassiveFlushGateRecordCountMismatch { .. }
            | Self::SchedulerPassiveFlushRequestRootMismatch { .. }
            | Self::SchedulerPassiveFlushRequestFinishedWorkMismatch { .. }
            | Self::SchedulerPassiveFlushRequestLanesMismatch { .. }
            | Self::SchedulerPassiveFlushRequestRecordCountMismatch { .. }
            | Self::CommittedPassiveCallbackInvocationMissingHandoff { .. }
            | Self::CommittedPassiveCallbackInvocationFiberCountMismatch { .. }
            | Self::CommittedPassiveCallbackInvocationStaleFiber { .. }
            | Self::CommittedPassiveCallbackInvocationWrongRenderPhase { .. }
            | Self::CommittedPassiveCallbackInvocationWrongEffectPhase { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for PassiveEffectsFlushError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<RootSchedulerError> for PassiveEffectsFlushError {
    fn from(error: RootSchedulerError) -> Self {
        Self::RootScheduler(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum PassiveEffectsFlushWithSyncFlushContinuationError {
    PassiveEffects(PassiveEffectsFlushError),
    SyncFlush(SyncFlushError),
}

impl Display for PassiveEffectsFlushWithSyncFlushContinuationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::PassiveEffects(error) => Display::fmt(error, formatter),
            Self::SyncFlush(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for PassiveEffectsFlushWithSyncFlushContinuationError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::PassiveEffects(error) => Some(error),
            Self::SyncFlush(error) => Some(error),
        }
    }
}

impl From<PassiveEffectsFlushError> for PassiveEffectsFlushWithSyncFlushContinuationError {
    fn from(error: PassiveEffectsFlushError) -> Self {
        Self::PassiveEffects(error)
    }
}

impl From<SyncFlushError> for PassiveEffectsFlushWithSyncFlushContinuationError {
    fn from(error: SyncFlushError) -> Self {
        Self::SyncFlush(error)
    }
}

#[derive(Debug, Clone, Copy)]
enum PassiveEffectRecordSource<'a> {
    None,
    FunctionComponentHandoffs(&'a [FunctionComponentPendingPassiveCommitHandoff]),
    CommittedFiberEffects,
    CommittedDeletedSubtreeEffects,
}

pub(crate) fn flush_passive_effects_after_commit<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
) -> Result<PassiveEffectsFlushResult, PassiveEffectsFlushError> {
    flush_passive_effects_after_commit_inner(
        store,
        commit,
        PassiveEffectRecordSource::None,
        None,
        None,
    )
}

pub(crate) fn flush_passive_effects_after_commit_and_sync_flush_continuation<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    execution_context: &ExecutionContextState,
) -> Result<
    PassiveEffectsFlushWithSyncFlushContinuationResult,
    PassiveEffectsFlushWithSyncFlushContinuationError,
> {
    let pending_passive_handoff = commit.pending_passive_handoff();
    let passive_effects = flush_passive_effects_after_commit(store, commit)?;
    let sync_flush_continuation = if passive_effects.consumed_pending_passive() {
        flush_sync_post_passive_continuation_after_passive_effects(
            store,
            execution_context,
            pending_passive_handoff,
        )?
    } else {
        None
    };

    Ok(PassiveEffectsFlushWithSyncFlushContinuationResult {
        passive_effects,
        sync_flush_continuation,
    })
}

pub(crate) fn observe_sync_flush_post_passive_continuation_execution_gate_after_commit<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    execution_context: &ExecutionContextState,
) -> Result<Option<SyncFlushPostPassiveContinuationExecutionGateRecord>, RootSchedulerError> {
    sync_flush_post_passive_continuation_execution_gate(
        store,
        execution_context,
        commit.pending_passive_handoff(),
    )
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect flush handoff canary for future commit traversal"
)]
pub(crate) fn flush_passive_effects_after_commit_with_function_component_handoffs<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    function_component_handoffs: &[FunctionComponentPendingPassiveCommitHandoff],
) -> Result<PassiveEffectsFlushResult, PassiveEffectsFlushError> {
    flush_passive_effects_after_commit_inner(
        store,
        commit,
        PassiveEffectRecordSource::FunctionComponentHandoffs(function_component_handoffs),
        None,
        None,
    )
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect traversal canary over committed fiber-owned records"
)]
pub(crate) fn flush_passive_effects_after_commit_from_committed_fiber_effects_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
) -> Result<PassiveEffectsFlushResult, PassiveEffectsFlushError> {
    flush_passive_effects_after_commit_inner(
        store,
        commit,
        PassiveEffectRecordSource::CommittedFiberEffects,
        None,
        None,
    )
}

#[allow(
    dead_code,
    reason = "crate-private committed passive callback execution gate for deterministic canaries"
)]
pub(crate) fn execute_passive_effect_callbacks_after_commit_from_committed_fiber_effects_under_test_control_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    control: &mut impl PassiveEffectCallbackInvocationTestControl,
) -> Result<PassiveEffectCallbackInvocationGateSnapshot, PassiveEffectsFlushError> {
    execute_update_passive_effect_callbacks_after_commit_from_accepted_committed_function_component_under_test_control_for_canary(
        store,
        commit,
        control,
    )
}

#[allow(
    dead_code,
    reason = "crate-private accepted committed function-component passive callback execution gate for deterministic canaries"
)]
pub(crate) fn execute_update_passive_effect_callbacks_after_commit_from_accepted_committed_function_component_under_test_control_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    control: &mut impl PassiveEffectCallbackInvocationTestControl,
) -> Result<PassiveEffectCallbackInvocationGateSnapshot, PassiveEffectsFlushError> {
    let handoff = commit.pending_passive_handoff().ok_or(
        PassiveEffectsFlushError::CommittedPassiveCallbackInvocationMissingHandoff {
            root: commit.root(),
        },
    )?;

    validate_update_passive_callback_invocation_committed_fiber_gate(
        store,
        handoff,
        commit.function_component_committed_passive_effects(),
    )?;

    let flush = flush_passive_effects_after_commit_inner(
        store,
        commit,
        PassiveEffectRecordSource::CommittedFiberEffects,
        None,
        None,
    )?;

    Ok(invoke_passive_effect_callbacks_under_test_control(
        flush, control,
    ))
}

#[allow(
    dead_code,
    reason = "crate-private scheduler-driven passive flush gate for committed fiber effect canaries"
)]
pub(crate) fn flush_passive_effects_after_scheduler_flush_gate_from_committed_fiber_effects_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    scheduler_gate: PassiveEffectSchedulerFlushGateRecord,
    destroy_executor: Option<&mut dyn PassiveEffectDestroyCallbackExecutor>,
    mount_create_executor: Option<&mut dyn PassiveEffectMountCreateCallbackExecutor>,
) -> Result<Option<PassiveEffectSchedulerFlushExecutionRecord>, PassiveEffectsFlushError> {
    let Some(scheduler_request) = scheduler_gate.scheduler_request() else {
        return Ok(None);
    };
    let handoff = commit.pending_passive_handoff().ok_or(
        PassiveEffectsFlushError::SchedulerPassiveFlushMissingPendingHandoff {
            root: commit.root(),
        },
    )?;
    validate_passive_effect_scheduler_flush_gate(handoff, scheduler_gate, scheduler_request)?;
    validate_update_passive_callback_invocation_committed_fiber_gate(
        store,
        handoff,
        commit.function_component_committed_passive_effects(),
    )?;

    let mut passive_effects = flush_passive_effects_after_commit_inner(
        store,
        commit,
        PassiveEffectRecordSource::CommittedFiberEffects,
        destroy_executor,
        mount_create_executor,
    )?;
    if passive_effects.did_execute_destroy_callbacks()
        || passive_effects.did_execute_mount_create_callbacks()
    {
        passive_effects.mark_scheduler_driven_passive_execution_enabled();
    }

    Ok(Some(PassiveEffectSchedulerFlushExecutionRecord {
        execution_order: scheduler_request.order(),
        scheduler_gate,
        scheduler_request,
        passive_effects,
    }))
}

#[allow(
    dead_code,
    reason = "crate-private passive destroy/create scheduler preflight for deterministic canaries"
)]
pub(crate) fn preflight_passive_destroy_create_after_scheduler_flush_gate_from_committed_fiber_effects_under_test_control_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    scheduler_gate: PassiveEffectSchedulerFlushGateRecord,
    control: &mut impl PassiveEffectCallbackInvocationTestControl,
) -> Result<
    PassiveEffectDestroyCreateSchedulerPreflightRecord,
    PassiveEffectDestroyCreateSchedulerPreflightError,
> {
    let handoff = commit.pending_passive_handoff().ok_or(
        PassiveEffectDestroyCreateSchedulerPreflightError::MissingPendingPassiveHandoff {
            root: commit.root(),
        },
    )?;
    validate_passive_destroy_create_scheduler_preflight_gate(handoff, scheduler_gate)?;
    validate_update_passive_callback_invocation_committed_fiber_gate(
        store,
        handoff,
        commit.function_component_committed_passive_effects(),
    )?;

    let scheduler_execution =
        flush_passive_effects_after_scheduler_flush_gate_from_committed_fiber_effects_for_canary(
            store,
            commit,
            scheduler_gate,
            None,
            None,
        )?
        .ok_or(
            PassiveEffectDestroyCreateSchedulerPreflightError::MissingSchedulerRequest {
                root: handoff.root(),
            },
        )?;
    let callback_invocation = invoke_passive_effect_callbacks_under_test_control(
        scheduler_execution.passive_effects().clone(),
        control,
    );

    Ok(PassiveEffectDestroyCreateSchedulerPreflightRecord {
        scheduler_execution,
        callback_invocation,
    })
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect destroy execution path for deterministic canaries"
)]
pub(crate) fn flush_passive_effects_after_commit_with_destroy_executor<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    function_component_handoffs: &[FunctionComponentPendingPassiveCommitHandoff],
    destroy_executor: &mut impl PassiveEffectDestroyCallbackExecutor,
) -> Result<PassiveEffectsFlushResult, PassiveEffectsFlushError> {
    flush_passive_effects_after_commit_inner(
        store,
        commit,
        PassiveEffectRecordSource::FunctionComponentHandoffs(function_component_handoffs),
        Some(destroy_executor),
        None,
    )
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect mount-create execution path for deterministic canaries"
)]
pub(crate) fn flush_passive_effects_after_commit_with_mount_create_executor<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    function_component_handoffs: &[FunctionComponentPendingPassiveCommitHandoff],
    mount_create_executor: &mut impl PassiveEffectMountCreateCallbackExecutor,
) -> Result<PassiveEffectsFlushResult, PassiveEffectsFlushError> {
    flush_passive_effects_after_commit_inner(
        store,
        commit,
        PassiveEffectRecordSource::FunctionComponentHandoffs(function_component_handoffs),
        None,
        Some(mount_create_executor),
    )
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect destroy/create execution path for deterministic error-order canaries"
)]
pub(crate) fn flush_passive_effects_after_commit_with_callback_executors<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    function_component_handoffs: &[FunctionComponentPendingPassiveCommitHandoff],
    destroy_executor: &mut impl PassiveEffectDestroyCallbackExecutor,
    mount_create_executor: &mut impl PassiveEffectMountCreateCallbackExecutor,
) -> Result<PassiveEffectsFlushResult, PassiveEffectsFlushError> {
    flush_passive_effects_after_commit_inner(
        store,
        commit,
        PassiveEffectRecordSource::FunctionComponentHandoffs(function_component_handoffs),
        Some(destroy_executor),
        Some(mount_create_executor),
    )
}

fn flush_passive_effects_after_commit_inner<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    effect_record_source: PassiveEffectRecordSource<'_>,
    destroy_executor: Option<&mut dyn PassiveEffectDestroyCallbackExecutor>,
    mount_create_executor: Option<&mut dyn PassiveEffectMountCreateCallbackExecutor>,
) -> Result<PassiveEffectsFlushResult, PassiveEffectsFlushError> {
    let root_id = commit.root();
    let Some(handoff) = commit.pending_passive_handoff() else {
        return Ok(PassiveEffectsFlushResult {
            root: root_id,
            finished_work: None,
            lanes: Lanes::NO,
            status: PassiveEffectsFlushStatus::NoPendingPassive,
            scheduler_driven_passive_execution_enabled: false,
            root_error_propagation: None,
            records: Vec::new(),
            destroy_callback_executions: Vec::new(),
            destroy_callback_errors: Vec::new(),
            mount_create_callback_executions: Vec::new(),
            mount_create_callback_errors: Vec::new(),
            root_error_captures: Vec::new(),
            root_error_routing: Vec::new(),
            callback_execution_errors: Vec::new(),
        });
    };

    let (pending_passive, root_error_propagation) = {
        let root = store.root(root_id)?;
        (
            root.scheduling().pending_passive().clone(),
            PassiveEffectRootErrorPropagationRecord {
                root: root_id,
                error_option_callbacks: root
                    .options()
                    .error_option_callback_record(root_id, RootErrorOptionCallbackPhase::Commit),
                scheduled_root_error_count: 0,
            },
        )
    };
    validate_pending_passive_handoff(handoff, &pending_passive)?;
    let effect_records = match effect_record_source {
        PassiveEffectRecordSource::FunctionComponentHandoffs(handoffs) => {
            validate_function_component_passive_handoffs(handoff, &pending_passive, handoffs)?
        }
        PassiveEffectRecordSource::CommittedFiberEffects => {
            validate_committed_function_component_passive_effects(
                handoff,
                &pending_passive,
                commit.function_component_committed_passive_effects(),
            )?
        }
        PassiveEffectRecordSource::CommittedDeletedSubtreeEffects => {
            validate_committed_deleted_subtree_passive_effects(
                handoff,
                &pending_passive,
                commit.function_component_deleted_subtree_passive_effects(),
            )?
        }
        PassiveEffectRecordSource::None => Vec::new(),
    };
    let mut records = build_passive_flush_records(handoff, &pending_passive, &effect_records);

    store
        .root_mut(root_id)?
        .scheduling_mut()
        .clear_pending_passive();
    let (destroy_callback_executions, destroy_callback_errors) = match destroy_executor {
        Some(destroy_executor) => execute_passive_destroy_callbacks(&mut records, destroy_executor),
        None => (Vec::new(), Vec::new()),
    };
    let (mount_create_callback_executions, mount_create_callback_errors) =
        match mount_create_executor {
            Some(mount_create_executor) => {
                execute_passive_mount_create_callbacks(&mut records, mount_create_executor)
            }
            None => (Vec::new(), Vec::new()),
        };
    let callback_execution_error_metadata = collect_passive_callback_execution_error_metadata(
        &destroy_callback_errors,
        &mount_create_callback_errors,
    );
    let root_error_captures = schedule_passive_callback_execution_root_error_captures(
        store,
        &callback_execution_error_metadata,
    )?;
    let root_error_propagation =
        root_error_propagation.with_scheduled_root_error_count(root_error_captures.len());
    let root_error_routing =
        build_passive_root_error_routing_records(&root_error_captures, root_error_propagation);
    let callback_execution_errors = build_passive_callback_execution_error_records(
        &callback_execution_error_metadata,
        &root_error_captures,
        &root_error_routing,
        root_error_propagation,
    );

    Ok(PassiveEffectsFlushResult {
        root: root_id,
        finished_work: Some(handoff.finished_work()),
        lanes: handoff.lanes(),
        status: PassiveEffectsFlushStatus::Flushed,
        scheduler_driven_passive_execution_enabled: false,
        root_error_propagation: Some(root_error_propagation),
        records,
        destroy_callback_executions,
        destroy_callback_errors,
        mount_create_callback_executions,
        mount_create_callback_errors,
        root_error_captures,
        root_error_routing,
        callback_execution_errors,
    })
}

fn validate_pending_passive_handoff(
    handoff: PendingPassiveCommitHandoff,
    pending_passive: &PendingPassiveState,
) -> Result<(), PassiveEffectsFlushError> {
    if pending_passive.root() != Some(handoff.root()) {
        return Err(PassiveEffectsFlushError::PendingPassiveRootMismatch {
            commit_root: handoff.root(),
            pending_root: pending_passive.root(),
        });
    }

    if pending_passive.finished_work() != Some(handoff.finished_work()) {
        return Err(
            PassiveEffectsFlushError::PendingPassiveFinishedWorkMismatch {
                root: handoff.root(),
                expected: handoff.finished_work(),
                actual: pending_passive.finished_work(),
            },
        );
    }

    if pending_passive.lanes() != handoff.lanes() {
        return Err(PassiveEffectsFlushError::PendingPassiveLanesMismatch {
            root: handoff.root(),
            expected: handoff.lanes(),
            actual: pending_passive.lanes(),
        });
    }

    let actual_unmounts = pending_passive.passive_unmount_count();
    let actual_mounts = pending_passive.passive_mount_count();
    if actual_unmounts != handoff.pending_unmount_count()
        || actual_mounts != handoff.pending_mount_count()
    {
        return Err(
            PassiveEffectsFlushError::PendingPassiveRecordCountMismatch {
                root: handoff.root(),
                expected_unmounts: handoff.pending_unmount_count(),
                actual_unmounts,
                expected_mounts: handoff.pending_mount_count(),
                actual_mounts,
            },
        );
    }

    Ok(())
}

fn validate_passive_destroy_create_scheduler_preflight_gate(
    handoff: PendingPassiveCommitHandoff,
    scheduler_gate: PassiveEffectSchedulerFlushGateRecord,
) -> Result<SchedulerPassiveEffectsFlushRequest, PassiveEffectDestroyCreateSchedulerPreflightError>
{
    if scheduler_gate.root() != handoff.root() {
        return Err(
            PassiveEffectDestroyCreateSchedulerPreflightError::SchedulerGateRootMismatch {
                expected: handoff.root(),
                actual: scheduler_gate.root(),
            },
        );
    }

    if scheduler_gate.finished_work() != Some(handoff.finished_work()) {
        return Err(
            PassiveEffectDestroyCreateSchedulerPreflightError::SchedulerGateFinishedWorkMismatch {
                root: handoff.root(),
                expected: handoff.finished_work(),
                actual: scheduler_gate.finished_work(),
            },
        );
    }

    if scheduler_gate.lanes() != handoff.lanes() {
        return Err(
            PassiveEffectDestroyCreateSchedulerPreflightError::SchedulerGateLanesMismatch {
                root: handoff.root(),
                expected: handoff.lanes(),
                actual: scheduler_gate.lanes(),
            },
        );
    }

    if scheduler_gate.pending_unmount_count() != handoff.pending_unmount_count()
        || scheduler_gate.pending_mount_count() != handoff.pending_mount_count()
    {
        return Err(
            PassiveEffectDestroyCreateSchedulerPreflightError::SchedulerGateRecordCountMismatch {
                root: handoff.root(),
                expected_unmounts: handoff.pending_unmount_count(),
                actual_unmounts: scheduler_gate.pending_unmount_count(),
                expected_mounts: handoff.pending_mount_count(),
                actual_mounts: scheduler_gate.pending_mount_count(),
            },
        );
    }

    let scheduler_request = scheduler_gate.scheduler_request().ok_or(
        PassiveEffectDestroyCreateSchedulerPreflightError::MissingSchedulerRequest {
            root: handoff.root(),
        },
    )?;
    validate_passive_destroy_create_scheduler_preflight_request(handoff, scheduler_request)?;

    Ok(scheduler_request)
}

fn validate_passive_destroy_create_scheduler_preflight_request(
    handoff: PendingPassiveCommitHandoff,
    scheduler_request: SchedulerPassiveEffectsFlushRequest,
) -> Result<(), PassiveEffectDestroyCreateSchedulerPreflightError> {
    if scheduler_request.root() != handoff.root() {
        return Err(
            PassiveEffectDestroyCreateSchedulerPreflightError::SchedulerRequestRootMismatch {
                expected: handoff.root(),
                actual: scheduler_request.root(),
            },
        );
    }

    if scheduler_request.finished_work() != handoff.finished_work() {
        return Err(
            PassiveEffectDestroyCreateSchedulerPreflightError::SchedulerRequestFinishedWorkMismatch {
                root: handoff.root(),
                expected: handoff.finished_work(),
                actual: scheduler_request.finished_work(),
            },
        );
    }

    if scheduler_request.lanes() != handoff.lanes() {
        return Err(
            PassiveEffectDestroyCreateSchedulerPreflightError::SchedulerRequestLanesMismatch {
                root: handoff.root(),
                expected: handoff.lanes(),
                actual: scheduler_request.lanes(),
            },
        );
    }

    if scheduler_request.pending_unmount_count() != handoff.pending_unmount_count()
        || scheduler_request.pending_mount_count() != handoff.pending_mount_count()
    {
        return Err(
            PassiveEffectDestroyCreateSchedulerPreflightError::SchedulerRequestRecordCountMismatch {
                root: handoff.root(),
                expected_unmounts: handoff.pending_unmount_count(),
                actual_unmounts: scheduler_request.pending_unmount_count(),
                expected_mounts: handoff.pending_mount_count(),
                actual_mounts: scheduler_request.pending_mount_count(),
            },
        );
    }

    Ok(())
}

fn validate_passive_effect_scheduler_flush_gate(
    handoff: PendingPassiveCommitHandoff,
    scheduler_gate: PassiveEffectSchedulerFlushGateRecord,
    scheduler_request: SchedulerPassiveEffectsFlushRequest,
) -> Result<SchedulerPassiveEffectsFlushRequest, PassiveEffectsFlushError> {
    if scheduler_gate.root() != handoff.root() {
        return Err(
            PassiveEffectsFlushError::SchedulerPassiveFlushGateRootMismatch {
                expected: handoff.root(),
                actual: scheduler_gate.root(),
            },
        );
    }

    if scheduler_gate.finished_work() != Some(handoff.finished_work()) {
        return Err(
            PassiveEffectsFlushError::SchedulerPassiveFlushGateFinishedWorkMismatch {
                root: handoff.root(),
                expected: handoff.finished_work(),
                actual: scheduler_gate.finished_work(),
            },
        );
    }

    if scheduler_gate.lanes() != handoff.lanes() {
        return Err(
            PassiveEffectsFlushError::SchedulerPassiveFlushGateLanesMismatch {
                root: handoff.root(),
                expected: handoff.lanes(),
                actual: scheduler_gate.lanes(),
            },
        );
    }

    if scheduler_gate.pending_unmount_count() != handoff.pending_unmount_count()
        || scheduler_gate.pending_mount_count() != handoff.pending_mount_count()
    {
        return Err(
            PassiveEffectsFlushError::SchedulerPassiveFlushGateRecordCountMismatch {
                root: handoff.root(),
                expected_unmounts: handoff.pending_unmount_count(),
                actual_unmounts: scheduler_gate.pending_unmount_count(),
                expected_mounts: handoff.pending_mount_count(),
                actual_mounts: scheduler_gate.pending_mount_count(),
            },
        );
    }

    validate_passive_effect_scheduler_flush_request(handoff, scheduler_request)?;

    Ok(scheduler_request)
}

fn validate_passive_effect_scheduler_flush_request(
    handoff: PendingPassiveCommitHandoff,
    scheduler_request: SchedulerPassiveEffectsFlushRequest,
) -> Result<(), PassiveEffectsFlushError> {
    if scheduler_request.root() != handoff.root() {
        return Err(
            PassiveEffectsFlushError::SchedulerPassiveFlushRequestRootMismatch {
                expected: handoff.root(),
                actual: scheduler_request.root(),
            },
        );
    }

    if scheduler_request.finished_work() != handoff.finished_work() {
        return Err(
            PassiveEffectsFlushError::SchedulerPassiveFlushRequestFinishedWorkMismatch {
                root: handoff.root(),
                expected: handoff.finished_work(),
                actual: scheduler_request.finished_work(),
            },
        );
    }

    if scheduler_request.lanes() != handoff.lanes() {
        return Err(
            PassiveEffectsFlushError::SchedulerPassiveFlushRequestLanesMismatch {
                root: handoff.root(),
                expected: handoff.lanes(),
                actual: scheduler_request.lanes(),
            },
        );
    }

    if scheduler_request.pending_unmount_count() != handoff.pending_unmount_count()
        || scheduler_request.pending_mount_count() != handoff.pending_mount_count()
    {
        return Err(
            PassiveEffectsFlushError::SchedulerPassiveFlushRequestRecordCountMismatch {
                root: handoff.root(),
                expected_unmounts: handoff.pending_unmount_count(),
                actual_unmounts: scheduler_request.pending_unmount_count(),
                expected_mounts: handoff.pending_mount_count(),
                actual_mounts: scheduler_request.pending_mount_count(),
            },
        );
    }

    Ok(())
}

fn validate_update_passive_callback_invocation_committed_fiber_gate<H: HostTypes>(
    store: &FiberRootStore<H>,
    handoff: PendingPassiveCommitHandoff,
    committed_effects: &FunctionComponentCommittedPassiveEffectsSnapshot,
) -> Result<(), PassiveEffectsFlushError> {
    if committed_effects.fiber_count() != 1 {
        return Err(
            PassiveEffectsFlushError::CommittedPassiveCallbackInvocationFiberCountMismatch {
                root: handoff.root(),
                expected: 1,
                actual: committed_effects.fiber_count(),
            },
        );
    }

    let fiber_record = &committed_effects.fibers()[0];
    if fiber_record.phase() != FunctionComponentHookRenderPhase::Update {
        return Err(
            PassiveEffectsFlushError::CommittedPassiveCallbackInvocationWrongRenderPhase {
                root: handoff.root(),
                fiber: fiber_record.fiber(),
                expected: FunctionComponentHookRenderPhase::Update,
                actual: fiber_record.phase(),
            },
        );
    }

    if !committed_subtree_contains_fiber(store, handoff.finished_work(), fiber_record.fiber())? {
        return Err(
            PassiveEffectsFlushError::CommittedPassiveCallbackInvocationStaleFiber {
                root: handoff.root(),
                finished_work: handoff.finished_work(),
                fiber: fiber_record.fiber(),
            },
        );
    }

    for record in fiber_record.records() {
        if record.phase() != record.order().phase() {
            return Err(
                PassiveEffectsFlushError::CommittedPassiveCallbackInvocationWrongEffectPhase {
                    root: handoff.root(),
                    fiber: record.fiber(),
                    phase: record.phase(),
                    order: record.order(),
                },
            );
        }
    }

    Ok(())
}

fn committed_subtree_contains_fiber<H: HostTypes>(
    store: &FiberRootStore<H>,
    fiber: FiberId,
    accepted: FiberId,
) -> Result<bool, PassiveEffectsFlushError> {
    if fiber == accepted {
        return Ok(true);
    }

    let children = store
        .fiber_arena()
        .child_ids(fiber)
        .map_err(|error| PassiveEffectsFlushError::FiberRootStore(error.into()))?;
    for child in children {
        if committed_subtree_contains_fiber(store, child, accepted)? {
            return Ok(true);
        }
    }

    Ok(false)
}

fn validate_function_component_passive_handoffs(
    handoff: PendingPassiveCommitHandoff,
    pending_passive: &PendingPassiveState,
    function_component_handoffs: &[FunctionComponentPendingPassiveCommitHandoff],
) -> Result<Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord>, PassiveEffectsFlushError> {
    let mut phase_records = Vec::new();
    let mut actual_unmounts = 0;
    let mut actual_mounts = 0;

    for function_component_handoff in function_component_handoffs {
        if function_component_handoff.root() != handoff.root() {
            return Err(
                PassiveEffectsFlushError::PendingPassiveEffectHandoffRootMismatch {
                    commit_root: handoff.root(),
                    handoff_root: function_component_handoff.root(),
                },
            );
        }
        if function_component_handoff.lanes() != handoff.lanes() {
            return Err(
                PassiveEffectsFlushError::PendingPassiveEffectHandoffLanesMismatch {
                    root: handoff.root(),
                    expected: handoff.lanes(),
                    actual: function_component_handoff.lanes(),
                },
            );
        }

        actual_unmounts += function_component_handoff.queued_unmount_count();
        actual_mounts += function_component_handoff.queued_mount_count();
        phase_records.extend(function_component_handoff.effect_phase_records());
    }

    if actual_unmounts != handoff.pending_unmount_count()
        || actual_mounts != handoff.pending_mount_count()
    {
        return Err(
            PassiveEffectsFlushError::PendingPassiveEffectHandoffRecordCountMismatch {
                root: handoff.root(),
                expected_unmounts: handoff.pending_unmount_count(),
                actual_unmounts,
                expected_mounts: handoff.pending_mount_count(),
                actual_mounts,
            },
        );
    }

    phase_records.sort_by_key(|record| record.order());
    for pair in phase_records.windows(2) {
        if pair[0].order() == pair[1].order() {
            return Err(
                PassiveEffectsFlushError::PendingPassiveEffectHandoffDuplicateOrder {
                    root: handoff.root(),
                    order: pair[0].order(),
                },
            );
        }
    }

    for pending in pending_passive.flush_ordered_records() {
        let Some(effect_record) = phase_records
            .iter()
            .find(|record| record.order() == pending.order())
        else {
            return Err(
                PassiveEffectsFlushError::PendingPassiveEffectHandoffRecordMismatch {
                    root: handoff.root(),
                    fiber: pending.fiber(),
                    phase: pending.order().phase(),
                    order: pending.order(),
                },
            );
        };

        if effect_record.fiber() != pending.fiber()
            || effect_record.phase() != pending.order().phase()
            || effect_record.lanes() != pending.lanes()
        {
            return Err(
                PassiveEffectsFlushError::PendingPassiveEffectHandoffRecordMismatch {
                    root: handoff.root(),
                    fiber: pending.fiber(),
                    phase: pending.order().phase(),
                    order: pending.order(),
                },
            );
        }
    }

    Ok(phase_records)
}

fn validate_committed_function_component_passive_effects(
    handoff: PendingPassiveCommitHandoff,
    pending_passive: &PendingPassiveState,
    committed_effects: &FunctionComponentCommittedPassiveEffectsSnapshot,
) -> Result<Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord>, PassiveEffectsFlushError> {
    let mut phase_records = committed_effects.phase_records();
    let actual_unmounts = committed_effects.queued_unmount_count();
    let actual_mounts = committed_effects.queued_mount_count();

    if actual_unmounts != handoff.pending_unmount_count()
        || actual_mounts != handoff.pending_mount_count()
    {
        return Err(
            PassiveEffectsFlushError::CommittedPassiveEffectRecordCountMismatch {
                root: handoff.root(),
                expected_unmounts: handoff.pending_unmount_count(),
                actual_unmounts,
                expected_mounts: handoff.pending_mount_count(),
                actual_mounts,
            },
        );
    }

    phase_records.sort_by_key(|record| record.order());
    for pair in phase_records.windows(2) {
        if pair[0].order() == pair[1].order() {
            return Err(
                PassiveEffectsFlushError::CommittedPassiveEffectDuplicateOrder {
                    root: handoff.root(),
                    order: pair[0].order(),
                },
            );
        }
    }

    for pending in pending_passive.flush_ordered_records() {
        let Some(effect_record) = phase_records
            .iter()
            .find(|record| record.order() == pending.order())
        else {
            return Err(
                PassiveEffectsFlushError::CommittedPassiveEffectRecordMismatch {
                    root: handoff.root(),
                    fiber: pending.fiber(),
                    phase: pending.order().phase(),
                    order: pending.order(),
                },
            );
        };

        if effect_record.fiber() != pending.fiber()
            || effect_record.phase() != pending.order().phase()
            || effect_record.lanes() != pending.lanes()
        {
            return Err(
                PassiveEffectsFlushError::CommittedPassiveEffectRecordMismatch {
                    root: handoff.root(),
                    fiber: pending.fiber(),
                    phase: pending.order().phase(),
                    order: pending.order(),
                },
            );
        }
    }

    Ok(phase_records)
}

fn build_passive_flush_records(
    handoff: PendingPassiveCommitHandoff,
    pending_passive: &PendingPassiveState,
    effect_records: &[FunctionComponentPendingPassiveEffectPhaseCommitRecord],
) -> Vec<PassiveEffectFlushRecord> {
    pending_passive
        .flush_ordered_records()
        .enumerate()
        .map(|(flush_index, pending)| {
            let effect = effect_records
                .iter()
                .find(|record| record.order() == pending.order())
                .map(|record| PassiveEffectFlushEffectRecord {
                    effect_index: record.effect_index(),
                    effect: record.effect(),
                    instance: record.instance(),
                    create: record.create(),
                    destroy: record.destroy(),
                    create_invoked: false,
                    destroy_invoked: false,
                });
            PassiveEffectFlushRecord {
                flush_index,
                root: handoff.root(),
                finished_work: handoff.finished_work(),
                committed_lanes: handoff.lanes(),
                fiber: pending.fiber(),
                effect_lanes: pending.lanes(),
                phase: pending.order().phase(),
                pending_order: pending.order(),
                unmount_origin: pending.unmount_origin(),
                effect,
            }
        })
        .collect()
}

fn execute_passive_destroy_callbacks(
    records: &mut [PassiveEffectFlushRecord],
    destroy_executor: &mut dyn PassiveEffectDestroyCallbackExecutor,
) -> (
    Vec<PassiveEffectDestroyCallbackExecutionRecord>,
    Vec<PassiveEffectDestroyCallbackErrorRecord>,
) {
    let mut executions = Vec::new();
    let mut errors = Vec::new();
    let mut eligible_unmounts = records
        .iter()
        .enumerate()
        .filter_map(|(index, record)| {
            if record.phase() != PendingPassiveEffectPhase::Unmount {
                return None;
            }

            match record.destroy_callback() {
                Some(destroy) if destroy.is_some() => Some(index),
                _ => None,
            }
        })
        .collect::<Vec<_>>();

    eligible_unmounts
        .sort_by_key(|&index| (records[index].pending_order(), records[index].flush_index()));

    for record_index in eligible_unmounts {
        let record = &mut records[record_index];
        let destroy = record
            .destroy_callback()
            .expect("eligible passive unmount destroy callback is present");
        let request = PassiveEffectDestroyCallbackExecutionRequest {
            execution_order: executions.len(),
            flush_record: *record,
            destroy,
        };
        let execution = PassiveEffectDestroyCallbackExecutionRecord { request };
        if let Err(error) = destroy_executor.execute_destroy_callback(request) {
            errors.push(PassiveEffectDestroyCallbackErrorRecord { execution, error });
        }
        record.mark_destroy_callback_invoked();
        executions.push(execution);
    }

    (executions, errors)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct PassiveEffectCallbackExecutionErrorMetadata {
    kind: PassiveEffectCallbackExecutionErrorKind,
    root: FiberRootId,
    finished_work: FiberId,
    committed_lanes: Lanes,
    fiber: FiberId,
    effect_lanes: Lanes,
    phase: PendingPassiveEffectPhase,
    pending_order: PendingPassiveEffectOrder,
    flush_index: usize,
    effect_index: Option<usize>,
    effect: Option<HookEffectId>,
    instance: Option<HookEffectInstanceId>,
    callback: HookEffectCallbackHandle,
    error: PassiveEffectCallbackExecutionErrorHandle,
}

fn collect_passive_callback_execution_error_metadata(
    destroy_errors: &[PassiveEffectDestroyCallbackErrorRecord],
    mount_create_errors: &[PassiveEffectMountCreateCallbackErrorRecord],
) -> Vec<PassiveEffectCallbackExecutionErrorMetadata> {
    let mut records = Vec::with_capacity(destroy_errors.len() + mount_create_errors.len());
    for error in destroy_errors {
        let execution = error.execution();
        records.push(PassiveEffectCallbackExecutionErrorMetadata {
            kind: PassiveEffectCallbackExecutionErrorKind::Destroy,
            root: execution.root(),
            finished_work: execution.finished_work(),
            committed_lanes: execution.committed_lanes(),
            fiber: execution.fiber(),
            effect_lanes: execution.effect_lanes(),
            phase: execution.phase(),
            pending_order: execution.pending_order(),
            flush_index: execution.flush_index(),
            effect_index: execution.effect_index(),
            effect: execution.effect(),
            instance: execution.effect_instance(),
            callback: execution.destroy_callback(),
            error: PassiveEffectCallbackExecutionErrorHandle::Destroy(error.error()),
        });
    }
    for error in mount_create_errors {
        let execution = error.execution();
        records.push(PassiveEffectCallbackExecutionErrorMetadata {
            kind: PassiveEffectCallbackExecutionErrorKind::MountCreate,
            root: execution.root(),
            finished_work: execution.finished_work(),
            committed_lanes: execution.committed_lanes(),
            fiber: execution.fiber(),
            effect_lanes: execution.effect_lanes(),
            phase: execution.phase(),
            pending_order: execution.pending_order(),
            flush_index: execution.flush_index(),
            effect_index: execution.effect_index(),
            effect: execution.effect(),
            instance: execution.effect_instance(),
            callback: execution.create_callback(),
            error: PassiveEffectCallbackExecutionErrorHandle::MountCreate(error.error()),
        });
    }

    records.sort_by_key(|record| (record.pending_order, record.flush_index));
    records
}

fn schedule_passive_callback_execution_root_error_captures<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    records: &[PassiveEffectCallbackExecutionErrorMetadata],
) -> Result<Vec<PassiveEffectRootErrorCaptureRecord>, PassiveEffectsFlushError> {
    records
        .iter()
        .enumerate()
        .map(|(capture_order, record)| {
            let schedule = capture_passive_effect_root_error(
                store,
                record.root,
                record.fiber,
                match record.kind {
                    PassiveEffectCallbackExecutionErrorKind::Destroy => {
                        RootErrorCaptureSource::PassiveEffectDestroy
                    }
                    PassiveEffectCallbackExecutionErrorKind::MountCreate => {
                        RootErrorCaptureSource::PassiveEffectMountCreate
                    }
                },
            )?;

            Ok(PassiveEffectRootErrorCaptureRecord {
                capture_order,
                kind: record.kind,
                root: record.root,
                finished_work: record.finished_work,
                committed_lanes: record.committed_lanes,
                fiber: record.fiber,
                effect_lanes: record.effect_lanes,
                phase: record.phase,
                pending_order: record.pending_order,
                flush_index: record.flush_index,
                effect_index: record.effect_index,
                effect: record.effect,
                instance: record.instance,
                callback: record.callback,
                error: record.error,
                schedule,
            })
        })
        .collect()
}

fn build_passive_callback_execution_error_records(
    records: &[PassiveEffectCallbackExecutionErrorMetadata],
    root_error_captures: &[PassiveEffectRootErrorCaptureRecord],
    root_error_routing: &[PassiveEffectRootErrorRoutingRecord],
    root_error_propagation: PassiveEffectRootErrorPropagationRecord,
) -> Vec<PassiveEffectCallbackExecutionErrorRecord> {
    records
        .iter()
        .zip(root_error_captures)
        .zip(root_error_routing)
        .enumerate()
        .map(
            |(error_order, ((record, root_error_capture), root_error_routing))| {
                PassiveEffectCallbackExecutionErrorRecord {
                    error_order,
                    kind: record.kind,
                    root: record.root,
                    finished_work: record.finished_work,
                    committed_lanes: record.committed_lanes,
                    fiber: record.fiber,
                    effect_lanes: record.effect_lanes,
                    phase: record.phase,
                    pending_order: record.pending_order,
                    flush_index: record.flush_index,
                    effect_index: record.effect_index,
                    effect: record.effect,
                    instance: record.instance,
                    callback: record.callback,
                    error: record.error,
                    root_error_capture: *root_error_capture,
                    root_error_routing: *root_error_routing,
                    root_error_propagation,
                }
            },
        )
        .collect()
}

fn build_passive_root_error_routing_records(
    root_error_captures: &[PassiveEffectRootErrorCaptureRecord],
    root_error_propagation: PassiveEffectRootErrorPropagationRecord,
) -> Vec<PassiveEffectRootErrorRoutingRecord> {
    root_error_captures
        .iter()
        .enumerate()
        .map(
            |(routing_order, root_error_capture)| PassiveEffectRootErrorRoutingRecord {
                routing_order,
                root_error_capture: *root_error_capture,
                root_error_propagation,
            },
        )
        .collect()
}

fn execute_passive_mount_create_callbacks(
    records: &mut [PassiveEffectFlushRecord],
    mount_create_executor: &mut dyn PassiveEffectMountCreateCallbackExecutor,
) -> (
    Vec<PassiveEffectMountCreateCallbackExecutionRecord>,
    Vec<PassiveEffectMountCreateCallbackErrorRecord>,
) {
    let mut executions = Vec::new();
    let mut errors = Vec::new();

    for record in records {
        if record.phase() != PendingPassiveEffectPhase::Mount {
            continue;
        }

        let Some(create) = record.create_callback() else {
            continue;
        };
        if create.is_none() {
            continue;
        }

        let request = PassiveEffectMountCreateCallbackExecutionRequest {
            execution_order: executions.len(),
            flush_record: *record,
            create,
        };
        let returned_destroy = match mount_create_executor.execute_mount_create_callback(request) {
            Ok(returned_destroy) => returned_destroy.filter(|destroy| destroy.is_some()),
            Err(error) => {
                let execution = PassiveEffectMountCreateCallbackExecutionRecord {
                    request,
                    returned_destroy: None,
                };
                errors.push(PassiveEffectMountCreateCallbackErrorRecord { execution, error });
                None
            }
        };
        let execution = PassiveEffectMountCreateCallbackExecutionRecord {
            request,
            returned_destroy,
        };
        record.mark_create_callback_invoked();
        executions.push(execution);
    }

    (executions, errors)
}

#[cfg(test)]
mod tests;
