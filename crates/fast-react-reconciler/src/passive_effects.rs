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

use fast_react_core::{
    FiberId, HookEffectCallbackHandle, HookEffectId, HookEffectInstanceId, Lanes, RefHandle,
    StateNodeHandle,
};
use fast_react_host_config::{HostFiberTokenPhase, HostFiberTokenTarget, HostTypes};

use crate::function_component::FunctionComponentHookRenderPhase;
use crate::host_tokens::HostFiberTokenId;
use crate::root_commit::{
    FunctionComponentCommittedPassiveEffectsSnapshot,
    FunctionComponentDeletedSubtreePassiveEffectsSnapshot, FunctionComponentEffectListCommitPhase,
    FunctionComponentEffectListCommitPhaseOrderKind,
    FunctionComponentEffectListCommitPhaseOrderRecord,
    FunctionComponentLayoutEffectCallbackInvocationGateSnapshot,
    FunctionComponentPendingPassiveCommitHandoff,
    FunctionComponentPendingPassiveEffectPhaseCommitRecord, HostRootDeletionCleanupOrderGateRecord,
    HostRootDeletionCleanupOrderPhase, HostRootRefCleanupReturnExecutionGateRecord,
    HostRootRefCommitAction, HostRootRefDetachReason, PendingPassiveCommitHandoff,
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
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct DeletedSubtreeRefCleanupReturnExecutionRequest {
    order_gate_sequence: usize,
    cleanup_return_sequence: usize,
    root: FiberRootId,
    finished_work: FiberId,
    deleted_root: FiberId,
    fiber: FiberId,
    state_node: StateNodeHandle,
    ref_handle: RefHandle,
    token: HostFiberTokenId,
    token_phase: HostFiberTokenPhase,
    token_target: HostFiberTokenTarget,
}

impl DeletedSubtreeRefCleanupReturnExecutionRequest {
    #[must_use]
    pub(crate) const fn order_gate_sequence(self) -> usize {
        self.order_gate_sequence
    }

    #[must_use]
    pub(crate) const fn cleanup_return_sequence(self) -> usize {
        self.cleanup_return_sequence
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn deleted_root(self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn ref_handle(self) -> RefHandle {
        self.ref_handle
    }

    #[must_use]
    pub(crate) const fn token(self) -> HostFiberTokenId {
        self.token
    }

    #[must_use]
    pub(crate) const fn token_phase(self) -> HostFiberTokenPhase {
        self.token_phase
    }

    #[must_use]
    pub(crate) const fn token_target(self) -> HostFiberTokenTarget {
        self.token_target
    }
}

pub(crate) trait DeletedSubtreeRefCleanupReturnExecutor {
    fn execute_deleted_ref_cleanup_return(
        &mut self,
        request: DeletedSubtreeRefCleanupReturnExecutionRequest,
    );
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct DeletedSubtreeRefCleanupReturnExecutionRecord {
    execution_order: usize,
    request: DeletedSubtreeRefCleanupReturnExecutionRequest,
}

impl DeletedSubtreeRefCleanupReturnExecutionRecord {
    #[must_use]
    pub(crate) const fn execution_order(self) -> usize {
        self.execution_order
    }

    #[must_use]
    pub(crate) const fn request(self) -> DeletedSubtreeRefCleanupReturnExecutionRequest {
        self.request
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.request.root()
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.request.finished_work()
    }

    #[must_use]
    pub(crate) const fn deleted_root(self) -> FiberId {
        self.request.deleted_root()
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.request.fiber()
    }

    #[must_use]
    pub(crate) const fn state_node(self) -> StateNodeHandle {
        self.request.state_node()
    }

    #[must_use]
    pub(crate) const fn ref_handle(self) -> RefHandle {
        self.request.ref_handle()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct DeletedSubtreeRefPassiveCleanupExecutionRecord {
    sequence: usize,
    order_gate_sequence: usize,
    phase: HostRootDeletionCleanupOrderPhase,
    root: FiberRootId,
    finished_work: FiberId,
    deleted_root: FiberId,
    fiber: FiberId,
    ref_cleanup_return_execution_order: Option<usize>,
    passive_destroy_execution_order: Option<usize>,
    host_cleanup_sequence: Option<usize>,
}

impl DeletedSubtreeRefPassiveCleanupExecutionRecord {
    #[must_use]
    pub(crate) const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn order_gate_sequence(self) -> usize {
        self.order_gate_sequence
    }

    #[must_use]
    pub(crate) const fn phase(self) -> HostRootDeletionCleanupOrderPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn deleted_root(self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn ref_cleanup_return_execution_order(self) -> Option<usize> {
        self.ref_cleanup_return_execution_order
    }

    #[must_use]
    pub(crate) const fn passive_destroy_execution_order(self) -> Option<usize> {
        self.passive_destroy_execution_order
    }

    #[must_use]
    pub(crate) const fn host_cleanup_sequence(self) -> Option<usize> {
        self.host_cleanup_sequence
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct DeletedSubtreeRefPassiveCleanupExecutionResult {
    root: FiberRootId,
    finished_work: FiberId,
    records: Vec<DeletedSubtreeRefPassiveCleanupExecutionRecord>,
    ref_cleanup_return_executions: Vec<DeletedSubtreeRefCleanupReturnExecutionRecord>,
    passive_effects: Option<PassiveEffectsFlushResult>,
}

impl DeletedSubtreeRefPassiveCleanupExecutionResult {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[DeletedSubtreeRefPassiveCleanupExecutionRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn ref_cleanup_return_executions(
        &self,
    ) -> &[DeletedSubtreeRefCleanupReturnExecutionRecord] {
        &self.ref_cleanup_return_executions
    }

    #[must_use]
    pub(crate) const fn passive_effects(&self) -> Option<&PassiveEffectsFlushResult> {
        self.passive_effects.as_ref()
    }

    #[must_use]
    pub(crate) fn ref_cleanup_return_callbacks_invoked(&self) -> bool {
        !self.ref_cleanup_return_executions.is_empty()
    }

    #[must_use]
    pub(crate) fn passive_destroy_callbacks_invoked(&self) -> bool {
        self.passive_effects
            .as_ref()
            .is_some_and(PassiveEffectsFlushResult::did_execute_destroy_callbacks)
    }

    #[must_use]
    pub(crate) const fn public_unmount_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_ref_or_effect_compatibility_claimed(&self) -> bool {
        false
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
    pub fn proves_deleted_subtree_unmount_destroy_order(&self) -> bool {
        let mut saw_destroy_metadata = false;
        let mut saw_destroy_callback = false;
        let mut first_host_cleanup_metadata = None;

        for record in &self.records {
            match record.kind() {
                EffectLifecycleExecutionKind::DeletedSubtreePassiveDestroyMetadata => {
                    saw_destroy_metadata = true;
                }
                EffectLifecycleExecutionKind::DeletedSubtreePassiveDestroyCallback => {
                    saw_destroy_callback = true;
                }
                EffectLifecycleExecutionKind::DeletedSubtreeHostCleanupMetadata => {
                    first_host_cleanup_metadata =
                        first_host_cleanup_metadata.or(record.metadata_sequence());
                }
                _ => {}
            }
        }

        let destroy_metadata_sequence = self.records.iter().find_map(|record| {
            (record.kind() == EffectLifecycleExecutionKind::DeletedSubtreePassiveDestroyMetadata)
                .then_some(record.metadata_sequence())
                .flatten()
        });

        saw_destroy_metadata
            && saw_destroy_callback
            && match (destroy_metadata_sequence, first_host_cleanup_metadata) {
                (Some(destroy), Some(host_cleanup)) => destroy < host_cleanup,
                _ => false,
            }
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

#[allow(
    dead_code,
    reason = "crate-private deleted-subtree unmount lifecycle execution evidence for deterministic canaries"
)]
pub(crate) fn record_deleted_subtree_unmount_effect_lifecycle_execution_evidence_for_canary(
    commit: &HostRootCommitRecord,
    passive_flush: &PassiveEffectsFlushResult,
) -> Result<EffectLifecycleExecutionSnapshot, EffectLifecycleExecutionEvidenceError> {
    validate_lifecycle_root_metadata(
        commit.root(),
        commit.finished_work(),
        commit.finished_lanes(),
        Some(passive_flush.root()),
        passive_flush.finished_work(),
        passive_flush.lanes(),
    )?;

    if passive_flush.destroy_callback_executions().is_empty()
        || passive_flush.did_execute_mount_create_callbacks()
        || passive_flush.did_record_destroy_callback_errors()
    {
        return Err(
            EffectLifecycleExecutionEvidenceError::MissingPrivatePassiveExecution {
                root: commit.root(),
            },
        );
    }

    let deleted_snapshot = commit.function_component_deleted_subtree_passive_effects();
    let cleanup_order = commit.deletion_cleanup_order_gate_for_canary();
    let host_cleanup_records = cleanup_order
        .records()
        .iter()
        .filter(|record| {
            record.phase() == crate::root_commit::HostRootDeletionCleanupOrderPhase::HostNodeCleanup
        })
        .collect::<Vec<_>>();

    let mut snapshot = EffectLifecycleExecutionSnapshot {
        root: Some(commit.root()),
        finished_work: Some(commit.finished_work()),
        lanes: commit.finished_lanes(),
        records: Vec::new(),
    };

    for execution in passive_flush.destroy_callback_executions() {
        if execution.phase() != PendingPassiveEffectPhase::Unmount
            || !matches!(
                execution.unmount_origin(),
                Some(PendingPassiveUnmountOrigin::DeletedSubtree { .. })
            )
        {
            return Err(
                EffectLifecycleExecutionEvidenceError::AcceptedMetadataMismatch {
                    root: commit.root(),
                    message: "unmount lifecycle evidence only accepts deleted-subtree passive destroys",
                },
            );
        }

        let Some(execution_effect) = execution.effect() else {
            return Err(
                EffectLifecycleExecutionEvidenceError::AcceptedMetadataMismatch {
                    root: commit.root(),
                    message: "deleted-subtree passive destroy execution is missing an effect id",
                },
            );
        };

        let deleted_record = deleted_snapshot
            .records()
            .iter()
            .find(|record| {
                record.fiber() == execution.fiber()
                    && record.effect() == execution_effect
                    && record.unmount_order() == execution.pending_order()
                    && record.destroy() == Some(execution.destroy_callback())
            })
            .ok_or(EffectLifecycleExecutionEvidenceError::AcceptedMetadataMismatch {
                root: commit.root(),
                message: "deleted-subtree passive destroy execution did not match accepted passive metadata",
            })?;

        let cleanup_record = cleanup_order
            .records()
            .iter()
            .find(|record| {
                record.phase()
                    == crate::root_commit::HostRootDeletionCleanupOrderPhase::PassiveDestroy
                    && record.fiber() == execution.fiber()
                    && record.passive_unmount_order() == Some(execution.pending_order())
                    && record.passive_destroy() == Some(execution.destroy_callback())
            })
            .ok_or(EffectLifecycleExecutionEvidenceError::AcceptedMetadataMismatch {
                root: commit.root(),
                message: "deleted-subtree passive destroy execution did not match cleanup order metadata",
            })?;

        snapshot.push(
            EffectLifecycleExecutionPhase::Passive,
            EffectLifecycleExecutionKind::DeletedSubtreePassiveDestroyMetadata,
            commit.root(),
            commit.finished_work(),
            deleted_record.fiber(),
            Some(deleted_record.effect()),
            deleted_record.destroy(),
            Some(cleanup_record.sequence()),
            None,
            Some(deleted_record.unmount_order()),
        );
        snapshot.push(
            EffectLifecycleExecutionPhase::Passive,
            EffectLifecycleExecutionKind::DeletedSubtreePassiveDestroyCallback,
            commit.root(),
            commit.finished_work(),
            execution.fiber(),
            execution.effect(),
            Some(execution.destroy_callback()),
            Some(cleanup_record.sequence()),
            Some(execution.execution_order()),
            Some(execution.pending_order()),
        );
    }

    for record in host_cleanup_records {
        snapshot.push(
            EffectLifecycleExecutionPhase::Mutation,
            EffectLifecycleExecutionKind::DeletedSubtreeHostCleanupMetadata,
            commit.root(),
            commit.finished_work(),
            record.fiber(),
            None,
            None,
            Some(record.sequence()),
            None,
            None,
        );
    }

    if !snapshot.proves_deleted_subtree_unmount_destroy_order() {
        return Err(
            EffectLifecycleExecutionEvidenceError::AcceptedMetadataMismatch {
                root: commit.root(),
                message: "deleted-subtree passive destroy metadata does not precede host cleanup metadata",
            },
        );
    }

    Ok(snapshot)
}

impl EffectLifecycleExecutionSnapshot {
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum DeletedSubtreeRefPassiveCleanupExecutionError {
    PassiveEffects(PassiveEffectsFlushError),
    MissingRefCleanupReturnRecord {
        root: FiberRootId,
        fiber: FiberId,
        order_gate_sequence: usize,
        cleanup_return_sequence: usize,
    },
    RefCleanupAfterPassiveDestroy {
        root: FiberRootId,
        fiber: FiberId,
        order_gate_sequence: usize,
    },
    MissingPassiveDestroyPendingOrder {
        root: FiberRootId,
        fiber: FiberId,
        order_gate_sequence: usize,
    },
    MissingPassiveDestroyExecution {
        root: FiberRootId,
        fiber: FiberId,
        order_gate_sequence: usize,
        pending_order: PendingPassiveEffectOrder,
        destroy: HookEffectCallbackHandle,
    },
}

impl Display for DeletedSubtreeRefPassiveCleanupExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::PassiveEffects(error) => Display::fmt(error, formatter),
            Self::MissingRefCleanupReturnRecord {
                root,
                fiber,
                order_gate_sequence,
                cleanup_return_sequence,
            } => write!(
                formatter,
                "root {} deleted cleanup order gate record {} for fiber slot {} references missing ref cleanup-return gate record {}",
                root.raw(),
                order_gate_sequence,
                fiber.slot().get(),
                cleanup_return_sequence
            ),
            Self::RefCleanupAfterPassiveDestroy {
                root,
                fiber,
                order_gate_sequence,
            } => write!(
                formatter,
                "root {} deleted cleanup order gate record {} for fiber slot {} attempted ref cleanup after passive destroy execution started",
                root.raw(),
                order_gate_sequence,
                fiber.slot().get()
            ),
            Self::MissingPassiveDestroyPendingOrder {
                root,
                fiber,
                order_gate_sequence,
            } => write!(
                formatter,
                "root {} deleted cleanup order gate record {} for fiber slot {} is missing a passive unmount order",
                root.raw(),
                order_gate_sequence,
                fiber.slot().get()
            ),
            Self::MissingPassiveDestroyExecution {
                root,
                fiber,
                order_gate_sequence,
                pending_order,
                destroy,
            } => write!(
                formatter,
                "root {} deleted cleanup order gate record {} for fiber slot {} did not execute passive destroy {:?} at pending order {:?}",
                root.raw(),
                order_gate_sequence,
                fiber.slot().get(),
                destroy,
                pending_order
            ),
        }
    }
}

impl Error for DeletedSubtreeRefPassiveCleanupExecutionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::PassiveEffects(error) => Some(error),
            Self::MissingRefCleanupReturnRecord { .. }
            | Self::RefCleanupAfterPassiveDestroy { .. }
            | Self::MissingPassiveDestroyPendingOrder { .. }
            | Self::MissingPassiveDestroyExecution { .. } => None,
        }
    }
}

impl From<PassiveEffectsFlushError> for DeletedSubtreeRefPassiveCleanupExecutionError {
    fn from(error: PassiveEffectsFlushError) -> Self {
        Self::PassiveEffects(error)
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
    reason = "crate-private deleted-subtree passive destroy execution diagnostic for deterministic canaries"
)]
pub(crate) fn flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    destroy_executor: &mut impl PassiveEffectDestroyCallbackExecutor,
) -> Result<PassiveEffectsFlushResult, PassiveEffectsFlushError> {
    flush_passive_effects_after_commit_inner(
        store,
        commit,
        PassiveEffectRecordSource::CommittedDeletedSubtreeEffects,
        Some(destroy_executor),
        None,
    )
}

#[allow(
    dead_code,
    reason = "crate-private deleted-subtree ref/passive execution canary keeps public unmount blocked"
)]
pub(crate) fn execute_deleted_subtree_ref_and_passive_cleanup_after_commit_for_canary<H, E>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    executor: &mut E,
) -> Result<
    DeletedSubtreeRefPassiveCleanupExecutionResult,
    DeletedSubtreeRefPassiveCleanupExecutionError,
>
where
    H: HostTypes,
    E: DeletedSubtreeRefCleanupReturnExecutor + PassiveEffectDestroyCallbackExecutor,
{
    let order_gate = commit.deletion_cleanup_order_gate_for_canary();
    let mut records = Vec::with_capacity(order_gate.len());
    let mut ref_cleanup_return_executions = Vec::new();
    let mut passive_effects = None;

    for order_record in order_gate.records() {
        match order_record.phase() {
            HostRootDeletionCleanupOrderPhase::RefCleanupReturn => {
                if passive_effects.is_some() {
                    return Err(
                        DeletedSubtreeRefPassiveCleanupExecutionError::RefCleanupAfterPassiveDestroy {
                            root: order_record.root(),
                            fiber: order_record.fiber(),
                            order_gate_sequence: order_record.sequence(),
                        },
                    );
                }

                let execution = execute_deleted_ref_cleanup_return_for_order_record(
                    commit,
                    order_record,
                    ref_cleanup_return_executions.len(),
                    executor,
                )?;
                ref_cleanup_return_executions.push(execution);
                records.push(deleted_subtree_ref_passive_cleanup_execution_record(
                    records.len(),
                    order_record,
                    Some(execution.execution_order()),
                    None,
                ));
            }
            HostRootDeletionCleanupOrderPhase::PassiveDestroy => {
                if passive_effects.is_none() {
                    passive_effects = Some(
                        flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary(
                            store,
                            commit,
                            executor,
                        )?,
                    );
                }

                let passive_destroy_execution_order =
                    deleted_subtree_passive_destroy_execution_order(
                        passive_effects
                            .as_ref()
                            .expect("passive effects were initialized above"),
                        order_record,
                    )?;
                records.push(deleted_subtree_ref_passive_cleanup_execution_record(
                    records.len(),
                    order_record,
                    None,
                    passive_destroy_execution_order,
                ));
            }
            HostRootDeletionCleanupOrderPhase::HostNodeCleanup => {
                records.push(deleted_subtree_ref_passive_cleanup_execution_record(
                    records.len(),
                    order_record,
                    None,
                    None,
                ));
            }
        }
    }

    Ok(DeletedSubtreeRefPassiveCleanupExecutionResult {
        root: commit.root(),
        finished_work: commit.finished_work(),
        records,
        ref_cleanup_return_executions,
        passive_effects,
    })
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
) -> Result<Option<PassiveEffectSchedulerFlushExecutionRecord>, PassiveEffectsFlushError> {
    let Some(scheduler_request) = scheduler_gate.scheduler_request() else {
        return Ok(None);
    };

    let passive_effects = flush_passive_effects_after_commit_inner(
        store,
        commit,
        PassiveEffectRecordSource::CommittedFiberEffects,
        None,
        None,
    )?;

    Ok(Some(PassiveEffectSchedulerFlushExecutionRecord {
        execution_order: scheduler_request.order(),
        scheduler_gate,
        scheduler_request,
        passive_effects,
    }))
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

fn execute_deleted_ref_cleanup_return_for_order_record(
    commit: &HostRootCommitRecord,
    order_record: &HostRootDeletionCleanupOrderGateRecord,
    execution_order: usize,
    executor: &mut impl DeletedSubtreeRefCleanupReturnExecutor,
) -> Result<
    DeletedSubtreeRefCleanupReturnExecutionRecord,
    DeletedSubtreeRefPassiveCleanupExecutionError,
> {
    let cleanup_return_sequence = order_record.ref_cleanup_return_sequence().ok_or(
        DeletedSubtreeRefPassiveCleanupExecutionError::MissingRefCleanupReturnRecord {
            root: order_record.root(),
            fiber: order_record.fiber(),
            order_gate_sequence: order_record.sequence(),
            cleanup_return_sequence: usize::MAX,
        },
    )?;
    let cleanup_record = deleted_ref_cleanup_return_gate_record_for_order_record(
        commit,
        order_record,
        cleanup_return_sequence,
    )?;
    let request = DeletedSubtreeRefCleanupReturnExecutionRequest {
        order_gate_sequence: order_record.sequence(),
        cleanup_return_sequence,
        root: order_record.root(),
        finished_work: order_record.finished_work(),
        deleted_root: order_record.deleted_root(),
        fiber: cleanup_record.fiber(),
        state_node: cleanup_record.state_node(),
        ref_handle: cleanup_record.ref_handle(),
        token: cleanup_record.token(),
        token_phase: cleanup_record.token_phase(),
        token_target: cleanup_record.token_target(),
    };
    executor.execute_deleted_ref_cleanup_return(request);

    Ok(DeletedSubtreeRefCleanupReturnExecutionRecord {
        execution_order,
        request,
    })
}

fn deleted_ref_cleanup_return_gate_record_for_order_record<'a>(
    commit: &'a HostRootCommitRecord,
    order_record: &HostRootDeletionCleanupOrderGateRecord,
    cleanup_return_sequence: usize,
) -> Result<
    &'a HostRootRefCleanupReturnExecutionGateRecord,
    DeletedSubtreeRefPassiveCleanupExecutionError,
> {
    commit
        .ref_cleanup_return_execution_gate()
        .records()
        .iter()
        .find(|record| {
            record.sequence() == cleanup_return_sequence
                && record.root() == order_record.root()
                && record.fiber() == order_record.fiber()
                && record.action() == HostRootRefCommitAction::Detach
                && record.detach_reason() == Some(HostRootRefDetachReason::Deleted)
                && record.cleanup_return_execution_gate()
        })
        .ok_or(
            DeletedSubtreeRefPassiveCleanupExecutionError::MissingRefCleanupReturnRecord {
                root: order_record.root(),
                fiber: order_record.fiber(),
                order_gate_sequence: order_record.sequence(),
                cleanup_return_sequence,
            },
        )
}

fn deleted_subtree_passive_destroy_execution_order(
    passive_effects: &PassiveEffectsFlushResult,
    order_record: &HostRootDeletionCleanupOrderGateRecord,
) -> Result<Option<usize>, DeletedSubtreeRefPassiveCleanupExecutionError> {
    let Some(destroy) = order_record.passive_destroy() else {
        return Ok(None);
    };
    let pending_order = order_record.passive_unmount_order().ok_or(
        DeletedSubtreeRefPassiveCleanupExecutionError::MissingPassiveDestroyPendingOrder {
            root: order_record.root(),
            fiber: order_record.fiber(),
            order_gate_sequence: order_record.sequence(),
        },
    )?;

    passive_effects
        .destroy_callback_executions()
        .iter()
        .find(|execution| {
            execution.fiber() == order_record.fiber()
                && execution.pending_order() == pending_order
                && execution.destroy_callback() == destroy
                && matches!(
                    execution.unmount_origin(),
                    Some(PendingPassiveUnmountOrigin::DeletedSubtree { .. })
                )
        })
        .map(|execution| Some(execution.execution_order()))
        .ok_or(
            DeletedSubtreeRefPassiveCleanupExecutionError::MissingPassiveDestroyExecution {
                root: order_record.root(),
                fiber: order_record.fiber(),
                order_gate_sequence: order_record.sequence(),
                pending_order,
                destroy,
            },
        )
}

fn deleted_subtree_ref_passive_cleanup_execution_record(
    sequence: usize,
    order_record: &HostRootDeletionCleanupOrderGateRecord,
    ref_cleanup_return_execution_order: Option<usize>,
    passive_destroy_execution_order: Option<usize>,
) -> DeletedSubtreeRefPassiveCleanupExecutionRecord {
    DeletedSubtreeRefPassiveCleanupExecutionRecord {
        sequence,
        order_gate_sequence: order_record.sequence(),
        phase: order_record.phase(),
        root: order_record.root(),
        finished_work: order_record.finished_work(),
        deleted_root: order_record.deleted_root(),
        fiber: order_record.fiber(),
        ref_cleanup_return_execution_order,
        passive_destroy_execution_order,
        host_cleanup_sequence: order_record.host_cleanup_sequence(),
    }
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

fn validate_committed_deleted_subtree_passive_effects(
    handoff: PendingPassiveCommitHandoff,
    pending_passive: &PendingPassiveState,
    committed_effects: &FunctionComponentDeletedSubtreePassiveEffectsSnapshot,
) -> Result<Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord>, PassiveEffectsFlushError> {
    let mut deleted_records = committed_effects.records().to_vec();
    let actual_unmounts = deleted_records.len();
    let actual_mounts = 0;

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

    deleted_records.sort_by_key(|record| record.unmount_order());
    for pair in deleted_records.windows(2) {
        if pair[0].unmount_order() == pair[1].unmount_order() {
            return Err(
                PassiveEffectsFlushError::CommittedPassiveEffectDuplicateOrder {
                    root: handoff.root(),
                    order: pair[0].unmount_order(),
                },
            );
        }
    }

    for pending in pending_passive.flush_ordered_records() {
        let Some(effect_record) = deleted_records
            .iter()
            .find(|record| record.unmount_order() == pending.order())
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

        if effect_record.root() != handoff.root()
            || effect_record.lanes() != pending.lanes()
            || effect_record.fiber() != pending.fiber()
            || pending.order().phase() != PendingPassiveEffectPhase::Unmount
            || pending.unmount_origin()
                != Some(PendingPassiveUnmountOrigin::DeletedSubtree {
                    nearest_mounted_ancestor: effect_record.nearest_mounted_ancestor(),
                })
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

    let mut phase_records = committed_effects.effect_phase_records();
    phase_records.sort_by_key(|record| record.order());
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
mod tests {
    use super::*;
    use crate::function_component::{
        FunctionComponentEffectDependencyStatus, FunctionComponentEffectPhase,
        FunctionComponentHookRenderPhase, FunctionComponentHookRenderStore,
    };
    use crate::root_commit::{
        FunctionComponentEffectListCommitPhaseOrderKind,
        FunctionComponentLayoutEffectCallbackInvocationErrorHandle,
        FunctionComponentLayoutEffectCallbackInvocationRequest,
        FunctionComponentLayoutEffectCallbackInvocationTestControl,
        HostRootDeletionCleanupOrderPhase,
        commit_function_component_effect_queues_for_committed_root,
        queue_function_component_deleted_subtree_pending_passive_effects,
        queue_function_component_pending_passive_effects,
    };
    use crate::root_config::PendingPassiveUnmountOrigin;
    use crate::root_scheduler::schedule_passive_effects_flush_after_commit_for_canary;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{
        RootElementHandle, RootErrorCallbackHandle, RootOptions,
        RootRecoverableErrorCallbackHandle, RootSchedulerCallbackHandle, RootSyncFlushExitStatus,
        SchedulerPriority, commit_finished_host_root, ensure_root_is_scheduled,
        render_host_root_for_lanes, update_container, update_container_sync,
    };
    use fast_react_core::{
        DependenciesHandle, FiberMode, FiberTag, FiberTypeHandle, HookEffectCallbackHandle,
        HookEffectDependencies, Lane, PropsHandle, RefHandle, StateNodeHandle,
    };

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id, host)
    }

    fn schedule_sync_update(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        element: RootElementHandle,
    ) {
        let update = update_container_sync(store, root_id, element, None).unwrap();
        ensure_root_is_scheduled(store, update.schedule()).unwrap();
    }

    fn current_host_root_element(
        store: &FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> RootElementHandle {
        let current = store.root(root_id).unwrap().current();
        let state = store.fiber_arena().get(current).unwrap().memoized_state();
        store.host_root_states().get(state).unwrap().element()
    }

    fn append_function_component_child(
        store: &mut FiberRootStore<RecordingHost>,
        parent: FiberId,
        props: PropsHandle,
        component: FiberTypeHandle,
    ) -> FiberId {
        let mode = store.fiber_arena().get(parent).unwrap().mode();
        let child =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::FunctionComponent, None, props, mode);
        store
            .fiber_arena_mut()
            .get_mut(child)
            .unwrap()
            .set_fiber_type(component);
        store
            .fiber_arena_mut()
            .set_children(parent, &[child])
            .unwrap();
        child
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct DeletedHostSubtreeRefPassiveFixture {
        deleted_host: FiberId,
        deleted_host_state_node: StateNodeHandle,
        deleted_host_ref: RefHandle,
        deleted_function: FiberId,
        deleted_text: FiberId,
        deleted_text_state_node: StateNodeHandle,
        passive_create: HookEffectCallbackHandle,
        passive_destroy: HookEffectCallbackHandle,
        passive_dependencies: HookEffectDependencies,
    }

    fn create_function_component_fiber(
        store: &mut FiberRootStore<RecordingHost>,
        mode: FiberMode,
        props: PropsHandle,
        component: FiberTypeHandle,
    ) -> FiberId {
        let fiber =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::FunctionComponent, None, props, mode);
        store
            .fiber_arena_mut()
            .get_mut(fiber)
            .unwrap()
            .set_fiber_type(component);
        fiber
    }

    fn create_host_ref_fiber(
        store: &mut FiberRootStore<RecordingHost>,
        mode: FiberMode,
        ref_handle: RefHandle,
        state_node: StateNodeHandle,
    ) -> FiberId {
        let fiber = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            mode,
        );
        let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
        node.set_state_node(state_node);
        node.set_ref_handle(ref_handle);
        fiber
    }

    fn create_host_text_fiber(
        store: &mut FiberRootStore<RecordingHost>,
        mode: FiberMode,
        props: PropsHandle,
        state_node: StateNodeHandle,
    ) -> FiberId {
        let fiber = store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostText, None, props, mode);
        store
            .fiber_arena_mut()
            .get_mut(fiber)
            .unwrap()
            .set_state_node(state_node);
        fiber
    }

    fn bubble_test_fiber(store: &mut FiberRootStore<RecordingHost>, fiber: FiberId) {
        let bubbled = fast_react_core::bubble_properties(store.fiber_arena(), fiber).unwrap();
        let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
        node.set_child_lanes(bubbled.child_lanes());
        node.set_subtree_flags(bubbled.subtree_flags());
    }

    fn attach_deleted_host_subtree_ref_passive_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        hook_store: &mut FunctionComponentHookRenderStore,
        host_root_work_in_progress: FiberId,
    ) -> DeletedHostSubtreeRefPassiveFixture {
        let mode = store
            .fiber_arena()
            .get(host_root_work_in_progress)
            .unwrap()
            .mode();
        let deleted_host_ref = RefHandle::from_raw(9_701);
        let deleted_host_state_node = StateNodeHandle::from_raw(9_801);
        let deleted_text_state_node = StateNodeHandle::from_raw(9_803);
        let deleted_host =
            create_host_ref_fiber(store, mode, deleted_host_ref, deleted_host_state_node);
        let deleted_function = create_function_component_fiber(
            store,
            mode,
            PropsHandle::from_raw(9_702),
            FiberTypeHandle::from_raw(9_902),
        );
        let deleted_text = create_host_text_fiber(
            store,
            mode,
            PropsHandle::from_raw(9_703),
            deleted_text_state_node,
        );
        store
            .fiber_arena_mut()
            .set_children(deleted_function, &[deleted_text])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(deleted_host, &[deleted_function])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[deleted_host])
            .unwrap();

        let passive_create = callback(9_901);
        let passive_destroy = callback(9_911);
        let passive_dependencies = deps(9_921);
        hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                deleted_function,
                FunctionComponentEffectPhase::Passive,
                passive_create,
                passive_dependencies,
                Some(passive_destroy),
            )
            .unwrap();

        store
            .fiber_arena_mut()
            .mark_child_for_deletion(host_root_work_in_progress, deleted_host)
            .unwrap();
        bubble_test_fiber(store, host_root_work_in_progress);

        DeletedHostSubtreeRefPassiveFixture {
            deleted_host,
            deleted_host_state_node,
            deleted_host_ref,
            deleted_function,
            deleted_text,
            deleted_text_state_node,
            passive_create,
            passive_destroy,
            passive_dependencies,
        }
    }

    fn callback(raw: u64) -> HookEffectCallbackHandle {
        HookEffectCallbackHandle::from_raw(raw)
    }

    fn destroy_error(raw: u64) -> PassiveEffectDestroyCallbackErrorHandle {
        PassiveEffectDestroyCallbackErrorHandle::from_raw(raw)
    }

    fn mount_create_error(raw: u64) -> PassiveEffectMountCreateCallbackErrorHandle {
        PassiveEffectMountCreateCallbackErrorHandle::from_raw(raw)
    }

    fn deps(raw: u64) -> HookEffectDependencies {
        HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
    }

    fn callback_error(raw: u64) -> PassiveEffectCallbackInvocationErrorHandle {
        PassiveEffectCallbackInvocationErrorHandle::from_raw(raw)
    }

    #[derive(Default)]
    struct TestLayoutEffectCallbackControl {
        calls: Vec<FunctionComponentLayoutEffectCallbackInvocationRequest>,
    }

    impl TestLayoutEffectCallbackControl {
        fn calls(&self) -> &[FunctionComponentLayoutEffectCallbackInvocationRequest] {
            &self.calls
        }
    }

    impl FunctionComponentLayoutEffectCallbackInvocationTestControl
        for TestLayoutEffectCallbackControl
    {
        fn invoke_layout_effect_create(
            &mut self,
            request: FunctionComponentLayoutEffectCallbackInvocationRequest,
        ) -> Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle> {
            self.calls.push(request);
            Ok(())
        }
    }

    #[derive(Default)]
    struct TestPassiveEffectCallbackControl {
        calls: Vec<PassiveEffectCallbackInvocationRequest>,
        destroy_results: Vec<(
            HookEffectCallbackHandle,
            Result<(), PassiveEffectCallbackInvocationErrorHandle>,
        )>,
        create_results: Vec<(
            HookEffectCallbackHandle,
            Result<Option<HookEffectCallbackHandle>, PassiveEffectCallbackInvocationErrorHandle>,
        )>,
    }

    impl TestPassiveEffectCallbackControl {
        fn with_destroy_result(
            mut self,
            callback: HookEffectCallbackHandle,
            result: Result<(), PassiveEffectCallbackInvocationErrorHandle>,
        ) -> Self {
            self.destroy_results.push((callback, result));
            self
        }

        fn with_create_result(
            mut self,
            callback: HookEffectCallbackHandle,
            result: Result<
                Option<HookEffectCallbackHandle>,
                PassiveEffectCallbackInvocationErrorHandle,
            >,
        ) -> Self {
            self.create_results.push((callback, result));
            self
        }

        fn calls(&self) -> &[PassiveEffectCallbackInvocationRequest] {
            &self.calls
        }

        fn destroy_result(
            &self,
            callback: HookEffectCallbackHandle,
        ) -> Result<(), PassiveEffectCallbackInvocationErrorHandle> {
            self.destroy_results
                .iter()
                .find(|(accepted, _)| *accepted == callback)
                .map_or(Ok(()), |(_, result)| *result)
        }

        fn create_result(
            &self,
            callback: HookEffectCallbackHandle,
        ) -> Result<Option<HookEffectCallbackHandle>, PassiveEffectCallbackInvocationErrorHandle>
        {
            self.create_results
                .iter()
                .find(|(accepted, _)| *accepted == callback)
                .map_or(Ok(None), |(_, result)| *result)
        }
    }

    impl PassiveEffectCallbackInvocationTestControl for TestPassiveEffectCallbackControl {
        fn invoke_passive_effect_destroy(
            &mut self,
            request: PassiveEffectCallbackInvocationRequest,
        ) -> Result<(), PassiveEffectCallbackInvocationErrorHandle> {
            self.calls.push(request);
            self.destroy_result(request.callback())
        }

        fn invoke_passive_effect_create(
            &mut self,
            request: PassiveEffectCallbackInvocationRequest,
        ) -> Result<Option<HookEffectCallbackHandle>, PassiveEffectCallbackInvocationErrorHandle>
        {
            self.calls.push(request);
            self.create_result(request.callback())
        }
    }

    #[derive(Default)]
    struct RecordingDestroyExecutor {
        fail_callback: Option<HookEffectCallbackHandle>,
        error: PassiveEffectDestroyCallbackErrorHandle,
        calls: Vec<PassiveEffectDestroyCallbackExecutionRequest>,
    }

    impl RecordingDestroyExecutor {
        fn with_error(
            callback: HookEffectCallbackHandle,
            error: PassiveEffectDestroyCallbackErrorHandle,
        ) -> Self {
            Self {
                fail_callback: Some(callback),
                error,
                calls: Vec::new(),
            }
        }

        fn calls(&self) -> &[PassiveEffectDestroyCallbackExecutionRequest] {
            &self.calls
        }
    }

    impl PassiveEffectDestroyCallbackExecutor for RecordingDestroyExecutor {
        fn execute_destroy_callback(
            &mut self,
            request: PassiveEffectDestroyCallbackExecutionRequest,
        ) -> Result<(), PassiveEffectDestroyCallbackErrorHandle> {
            self.calls.push(request);
            if self.fail_callback == Some(request.destroy_callback()) {
                Err(self.error)
            } else {
                Ok(())
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    enum DeletedCleanupExecutionEvent {
        RefCleanup(FiberId),
        PassiveDestroy(HookEffectCallbackHandle),
    }

    #[derive(Default)]
    struct RecordingDeletedCleanupExecutor {
        events: Vec<DeletedCleanupExecutionEvent>,
        ref_cleanup_calls: Vec<DeletedSubtreeRefCleanupReturnExecutionRequest>,
        destroy_calls: Vec<PassiveEffectDestroyCallbackExecutionRequest>,
    }

    impl RecordingDeletedCleanupExecutor {
        fn events(&self) -> &[DeletedCleanupExecutionEvent] {
            &self.events
        }

        fn ref_cleanup_calls(&self) -> &[DeletedSubtreeRefCleanupReturnExecutionRequest] {
            &self.ref_cleanup_calls
        }

        fn destroy_calls(&self) -> &[PassiveEffectDestroyCallbackExecutionRequest] {
            &self.destroy_calls
        }
    }

    impl DeletedSubtreeRefCleanupReturnExecutor for RecordingDeletedCleanupExecutor {
        fn execute_deleted_ref_cleanup_return(
            &mut self,
            request: DeletedSubtreeRefCleanupReturnExecutionRequest,
        ) {
            self.events
                .push(DeletedCleanupExecutionEvent::RefCleanup(request.fiber()));
            self.ref_cleanup_calls.push(request);
        }
    }

    impl PassiveEffectDestroyCallbackExecutor for RecordingDeletedCleanupExecutor {
        fn execute_destroy_callback(
            &mut self,
            request: PassiveEffectDestroyCallbackExecutionRequest,
        ) -> Result<(), PassiveEffectDestroyCallbackErrorHandle> {
            self.events
                .push(DeletedCleanupExecutionEvent::PassiveDestroy(
                    request.destroy_callback(),
                ));
            self.destroy_calls.push(request);
            Ok(())
        }
    }

    #[derive(Default)]
    struct RecordingMountCreateExecutor {
        fail_callback: Option<HookEffectCallbackHandle>,
        error: PassiveEffectMountCreateCallbackErrorHandle,
        returned_destroy: Vec<(HookEffectCallbackHandle, Option<HookEffectCallbackHandle>)>,
        calls: Vec<PassiveEffectMountCreateCallbackExecutionRequest>,
    }

    impl RecordingMountCreateExecutor {
        fn with_error(
            mut self,
            callback: HookEffectCallbackHandle,
            error: PassiveEffectMountCreateCallbackErrorHandle,
        ) -> Self {
            self.fail_callback = Some(callback);
            self.error = error;
            self
        }

        fn with_returned_destroy(
            mut self,
            callback: HookEffectCallbackHandle,
            destroy: Option<HookEffectCallbackHandle>,
        ) -> Self {
            self.returned_destroy.push((callback, destroy));
            self
        }

        fn calls(&self) -> &[PassiveEffectMountCreateCallbackExecutionRequest] {
            &self.calls
        }

        fn returned_destroy(
            &self,
            callback: HookEffectCallbackHandle,
        ) -> Option<HookEffectCallbackHandle> {
            self.returned_destroy
                .iter()
                .find(|(accepted, _)| *accepted == callback)
                .and_then(|(_, destroy)| *destroy)
        }
    }

    impl PassiveEffectMountCreateCallbackExecutor for RecordingMountCreateExecutor {
        fn execute_mount_create_callback(
            &mut self,
            request: PassiveEffectMountCreateCallbackExecutionRequest,
        ) -> Result<Option<HookEffectCallbackHandle>, PassiveEffectMountCreateCallbackErrorHandle>
        {
            self.calls.push(request);
            if self.fail_callback == Some(request.create_callback()) {
                Err(self.error)
            } else {
                Ok(self.returned_destroy(request.create_callback()))
            }
        }
    }

    #[test]
    fn passive_effects_flush_returns_noop_record_without_commit_handoff() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(10), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let commit = commit_finished_host_root(&mut store, render).unwrap();

        let flush = flush_passive_effects_after_commit(&mut store, &commit).unwrap();

        assert_eq!(flush.root(), root_id);
        assert_eq!(flush.finished_work(), None);
        assert_eq!(flush.lanes(), Lanes::NO);
        assert_eq!(flush.status(), PassiveEffectsFlushStatus::NoPendingPassive);
        assert!(!flush.consumed_pending_passive());
        assert!(!flush.did_flush_records());
        assert!(flush.records().is_empty());
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
    fn passive_effects_flush_emits_unmounts_before_mounts_and_clears_pending_state() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(20), None).unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();

        let (mount_order, unmount_order) = {
            let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(root_id, Lanes::NO);
            let mount_order = scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::DEFAULT)
                .unwrap();
            let unmount_order = scheduling
                .pending_passive_mut()
                .queue_unmount(
                    previous_current,
                    PendingPassiveUnmountOrigin::UpdatedFiber,
                    Lanes::SYNC,
                )
                .unwrap();
            (mount_order, unmount_order)
        };

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let flush = flush_passive_effects_after_commit(&mut store, &commit).unwrap();

        assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
        assert!(flush.consumed_pending_passive());
        assert!(flush.did_flush_records());
        assert_eq!(flush.root(), root_id);
        assert_eq!(flush.finished_work(), Some(finished_work));
        assert_eq!(flush.lanes(), Lanes::DEFAULT);
        assert_eq!(flush.records().len(), 2);

        let unmount = flush.records()[0];
        assert_eq!(unmount.flush_index(), 0);
        assert_eq!(unmount.root(), root_id);
        assert_eq!(unmount.finished_work(), finished_work);
        assert_eq!(unmount.committed_lanes(), Lanes::DEFAULT);
        assert_eq!(unmount.fiber(), previous_current);
        assert_eq!(unmount.effect_lanes(), Lanes::SYNC);
        assert_eq!(unmount.phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(unmount.pending_order(), unmount_order);
        assert_eq!(
            unmount.unmount_origin(),
            Some(PendingPassiveUnmountOrigin::UpdatedFiber)
        );

        let mount = flush.records()[1];
        assert_eq!(mount.flush_index(), 1);
        assert_eq!(mount.root(), root_id);
        assert_eq!(mount.finished_work(), finished_work);
        assert_eq!(mount.committed_lanes(), Lanes::DEFAULT);
        assert_eq!(mount.fiber(), finished_work);
        assert_eq!(mount.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(mount.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(mount.pending_order(), mount_order);
        assert_eq!(mount.unmount_origin(), None);

        assert!(unmount.pending_order().flush_rank() < mount.pending_order().flush_rank());
        assert_eq!(
            store.root(root_id).unwrap().scheduling().pending_passive(),
            &PendingPassiveState::NONE
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn passive_effects_callback_invocation_gate_skips_flush_records_without_callback_handles() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(22), None).unwrap();
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
                    Lanes::DEFAULT,
                )
                .unwrap();
            scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::DEFAULT)
                .unwrap();
        }

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let flush = flush_passive_effects_after_commit(&mut store, &commit).unwrap();
        assert_eq!(flush.records().len(), 2);
        assert!(flush.records().iter().all(|record| {
            record.create_callback().is_none()
                && record.destroy_callback().is_none()
                && !record.create_callback_invoked()
                && !record.destroy_callback_invoked()
        }));
        let mut control = TestPassiveEffectCallbackControl::default();

        let gate = invoke_passive_effect_callbacks_under_test_control(flush, &mut control);

        assert_eq!(gate.root(), root_id);
        assert_eq!(gate.finished_work(), Some(finished_work));
        assert_eq!(gate.lanes(), Lanes::DEFAULT);
        assert_eq!(gate.flush_status(), PassiveEffectsFlushStatus::Flushed);
        assert_eq!(gate.flush_record_count(), 2);
        assert_eq!(gate.skipped_flush_records_without_callbacks(), 2);
        assert!(gate.is_empty());
        assert_eq!(gate.len(), 0);
        assert_eq!(gate.completed_count(), 0);
        assert_eq!(gate.error_count(), 0);
        assert!(!gate.has_errors());
        assert_eq!(
            gate.status(),
            PassiveEffectCallbackInvocationGateStatus::TestControlOnly
        );
        assert_eq!(
            gate.blockers(),
            &PASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
        );
        assert!(!gate.public_effect_execution_enabled());
        assert!(!gate.public_act_compatibility_claimed());
        assert!(!gate.scheduler_driven_passive_execution_enabled());
        assert!(control.calls().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn passive_effects_flush_consumes_function_component_passive_metadata_data_only() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(21), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let component = FiberTypeHandle::from_raw(820);
        let function_fiber = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(821),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), function_fiber)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Mount);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let registration = hook_store
            .mount_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(822),
                deps(823),
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();
        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(queued.records().len(), 1);
        assert_eq!(queued.queued_unmount_count(), 0);
        assert_eq!(queued.queued_mount_count(), 1);

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let handoff = commit.pending_passive_handoff().unwrap();
        assert_eq!(handoff.pending_unmount_count(), 0);
        assert_eq!(handoff.pending_mount_count(), 1);

        let flush = flush_passive_effects_after_commit_with_function_component_handoffs(
            &mut store,
            &commit,
            std::slice::from_ref(&queued),
        )
        .unwrap();

        assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
        assert!(flush.consumed_pending_passive());
        assert_eq!(flush.root(), root_id);
        assert_eq!(flush.finished_work(), Some(finished_work));
        assert_eq!(flush.lanes(), Lanes::DEFAULT);
        assert_eq!(flush.records().len(), 1);
        assert!(!flush.did_execute_destroy_callbacks());
        assert!(!flush.did_record_destroy_callback_errors());
        assert!(flush.destroy_callback_executions().is_empty());
        assert!(flush.destroy_callback_errors().is_empty());
        assert!(!flush.did_execute_mount_create_callbacks());
        assert!(!flush.did_record_mount_create_callback_errors());
        assert!(flush.mount_create_callback_executions().is_empty());
        assert!(flush.mount_create_callback_errors().is_empty());
        let record = flush.records()[0];
        assert_eq!(record.flush_index(), 0);
        assert_eq!(record.fiber(), function_fiber);
        assert_eq!(record.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(record.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(record.pending_order(), queued.records()[0].mount_order());
        assert_eq!(record.unmount_origin(), None);
        assert_eq!(record.effect_index(), Some(0));
        assert_eq!(record.effect(), Some(registration.effect()));
        assert_eq!(record.effect_instance(), Some(registration.instance()));
        assert_eq!(record.create_callback(), Some(callback(822)));
        assert_eq!(record.destroy_callback(), None);
        assert!(!record.create_callback_invoked());
        assert!(!record.destroy_callback_invoked());
        assert_eq!(
            record.effect_record().unwrap().effect(),
            registration.effect()
        );
        assert_eq!(
            record.effect_record().unwrap().create_callback(),
            Some(callback(822))
        );
        assert_eq!(record.effect_record().unwrap().destroy_callback(), None);
        assert!(!record.effect_record().unwrap().create_callback_invoked());
        assert!(!record.effect_record().unwrap().destroy_callback_invoked());
        assert_eq!(
            hook_store
                .hook_effects()
                .get_effect(registration.effect())
                .unwrap()
                .create(),
            callback(822)
        );
        assert_eq!(
            hook_store
                .hook_effects()
                .get_instance(registration.instance())
                .unwrap()
                .destroy(),
            None
        );
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
    fn passive_effects_flush_rejects_effect_handoff_lane_drift_before_consuming() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(824), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let function_fiber = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(825),
            FiberTypeHandle::from_raw(826),
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), function_fiber)
            .unwrap();
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        hook_store
            .mount_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(827),
                deps(828),
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();
        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::SYNC,
        )
        .unwrap();
        let commit = commit_finished_host_root(&mut store, render).unwrap();

        let error = flush_passive_effects_after_commit_with_function_component_handoffs(
            &mut store,
            &commit,
            std::slice::from_ref(&queued),
        )
        .unwrap_err();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert!(matches!(
            error,
            PassiveEffectsFlushError::PendingPassiveEffectHandoffLanesMismatch {
                root,
                expected,
                actual,
            } if root == root_id && expected == Lanes::DEFAULT && actual == Lanes::SYNC
        ));
        assert_eq!(pending_passive.root(), Some(root_id));
        assert_eq!(pending_passive.finished_work(), Some(finished_work));
        assert_eq!(pending_passive.lanes(), Lanes::DEFAULT);
        assert_eq!(pending_passive.passive_mounts().len(), 1);
        assert!(pending_passive.has_commit_handoff());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn passive_effects_flush_carries_effect_ids_through_update_unmount_and_mount() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(830);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(831),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(832),
                deps(833),
                Some(callback(834)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(835), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(836),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let registration = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(837),
                deps(838),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(queued.queued_unmount_count(), 1);
        assert_eq!(queued.queued_mount_count(), 1);
        let queued_effect = queued.records()[0];

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let flush = flush_passive_effects_after_commit_with_function_component_handoffs(
            &mut store,
            &commit,
            std::slice::from_ref(&queued),
        )
        .unwrap();

        assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
        assert_eq!(flush.records().len(), 2);
        assert!(!flush.did_execute_destroy_callbacks());
        assert!(!flush.did_record_destroy_callback_errors());
        assert!(flush.destroy_callback_executions().is_empty());
        assert!(flush.destroy_callback_errors().is_empty());
        assert!(!flush.did_execute_mount_create_callbacks());
        assert!(!flush.did_record_mount_create_callback_errors());
        assert!(flush.mount_create_callback_executions().is_empty());
        assert!(flush.mount_create_callback_errors().is_empty());
        let unmount = flush.records()[0];
        assert_eq!(unmount.flush_index(), 0);
        assert_eq!(unmount.fiber(), finished_function);
        assert_eq!(unmount.phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(
            unmount.pending_order(),
            queued_effect.unmount_order().unwrap()
        );
        assert_eq!(unmount.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(unmount.effect_index(), Some(0));
        assert_eq!(unmount.effect(), Some(registration.effect()));
        assert_eq!(unmount.effect_instance(), Some(previous.instance()));
        assert_eq!(unmount.effect_instance(), Some(registration.instance()));
        assert_eq!(unmount.create_callback(), None);
        assert_eq!(unmount.destroy_callback(), Some(callback(834)));
        assert!(!unmount.create_callback_invoked());
        assert!(!unmount.destroy_callback_invoked());
        assert_eq!(
            unmount.unmount_origin(),
            Some(PendingPassiveUnmountOrigin::UpdatedFiber)
        );

        let mount = flush.records()[1];
        assert_eq!(mount.flush_index(), 1);
        assert_eq!(mount.fiber(), finished_function);
        assert_eq!(mount.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(mount.pending_order(), queued_effect.mount_order());
        assert_eq!(mount.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(mount.effect_index(), Some(0));
        assert_eq!(mount.effect(), Some(registration.effect()));
        assert_eq!(mount.effect_instance(), Some(registration.instance()));
        assert_eq!(mount.create_callback(), Some(callback(837)));
        assert_eq!(mount.destroy_callback(), None);
        assert!(!mount.create_callback_invoked());
        assert!(!mount.destroy_callback_invoked());
        assert_eq!(mount.unmount_origin(), None);
        assert!(unmount.pending_order() < mount.pending_order());
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .pending_passive()
                .is_empty()
        );
        assert_eq!(
            hook_store
                .hook_effects()
                .get_instance(previous.instance())
                .unwrap()
                .destroy(),
            Some(callback(834))
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn passive_effects_queue_accepts_changed_update_queue_metadata_and_skips_unchanged() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(970);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(971),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous_changed = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(972),
                deps(973),
                Some(callback(974)),
            )
            .unwrap();
        let previous_unchanged = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(975),
                deps(976),
                Some(callback(977)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(978), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(979),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let changed = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(980),
                deps(981),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        let unchanged = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(982),
                deps(976),
                FunctionComponentEffectDependencyStatus::Unchanged,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let update_queue = hook_store.effect_update_queue(state).unwrap().unwrap();
        assert_eq!(update_queue.len(), 2);
        assert_eq!(update_queue.changed_dependency_count(), 1);
        assert_eq!(update_queue.unchanged_dependency_count(), 1);
        assert_eq!(update_queue.accepted_passive_count(), 1);

        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(queued.records().len(), 1);
        assert_eq!(queued.queued_unmount_count(), 1);
        assert_eq!(queued.queued_mount_count(), 1);
        assert_eq!(queued.records()[0].effect(), changed.effect());
        assert_ne!(queued.records()[0].effect(), unchanged.effect());
        assert_eq!(queued.records()[0].instance(), previous_changed.instance());
        assert_ne!(
            queued.records()[0].instance(),
            previous_unchanged.instance()
        );
        assert_eq!(queued.records()[0].create(), callback(980));
        assert_eq!(queued.records()[0].destroy(), Some(callback(974)));

        let pending = store.root(root_id).unwrap().scheduling().pending_passive();
        assert_eq!(pending.root(), Some(root_id));
        assert_eq!(pending.finished_work(), None);
        assert_eq!(pending.lanes(), Lanes::DEFAULT);
        assert_eq!(pending.passive_unmounts().len(), 1);
        assert_eq!(pending.passive_mounts().len(), 1);

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let handoff = commit.pending_passive_handoff().unwrap();
        assert_eq!(handoff.pending_unmount_count(), 1);
        assert_eq!(handoff.pending_mount_count(), 1);
        let flush = flush_passive_effects_after_commit_with_function_component_handoffs(
            &mut store,
            &commit,
            std::slice::from_ref(&queued),
        )
        .unwrap();

        assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
        assert_eq!(flush.records().len(), 2);
        assert!(!flush.did_execute_destroy_callbacks());
        assert!(!flush.did_execute_mount_create_callbacks());
        let unmount = flush.records()[0];
        let mount = flush.records()[1];
        assert_eq!(unmount.phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(mount.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(unmount.effect(), Some(changed.effect()));
        assert_eq!(mount.effect(), Some(changed.effect()));
        assert_eq!(unmount.effect_index(), Some(0));
        assert_eq!(mount.effect_index(), Some(0));
        assert_eq!(unmount.effect_instance(), Some(previous_changed.instance()));
        assert_eq!(mount.effect_instance(), Some(changed.instance()));
        assert_eq!(unmount.create_callback(), None);
        assert_eq!(unmount.destroy_callback(), Some(callback(974)));
        assert_eq!(mount.create_callback(), Some(callback(980)));
        assert_eq!(mount.destroy_callback(), None);
        assert!(!unmount.create_callback_invoked());
        assert!(!unmount.destroy_callback_invoked());
        assert!(!mount.create_callback_invoked());
        assert!(!mount.destroy_callback_invoked());
        assert_eq!(
            unmount.unmount_origin(),
            Some(PendingPassiveUnmountOrigin::UpdatedFiber)
        );
        assert!(unmount.pending_order() < mount.pending_order());
        assert_eq!(
            hook_store
                .hook_effects()
                .get_instance(previous_changed.instance())
                .unwrap()
                .destroy(),
            Some(callback(974))
        );
        assert_eq!(
            hook_store
                .hook_effects()
                .get_instance(previous_unchanged.instance())
                .unwrap()
                .destroy(),
            Some(callback(977))
        );
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
    fn passive_effects_flush_consumes_committed_fiber_records_without_handoff_argument() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(1020);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(1021),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(1022),
                deps(1023),
                Some(callback(1024)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(1025), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(1026),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let registration = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(1027),
                deps(1028),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(queued.queued_unmount_count(), 1);
        assert_eq!(queued.queued_mount_count(), 1);
        let queued_effect = queued.records()[0];

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let committed = commit
            .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
                &queued,
            ))
            .unwrap()
            .clone();
        assert_eq!(committed.fiber_count(), 1);
        assert_eq!(committed.queued_unmount_count(), 1);
        assert_eq!(committed.queued_mount_count(), 1);
        assert_eq!(committed.fibers()[0].fiber(), finished_function);
        assert_eq!(
            committed.fibers()[0].phase(),
            FunctionComponentHookRenderPhase::Update
        );
        assert_eq!(committed.fibers()[0].lanes(), Lanes::DEFAULT);
        assert_eq!(committed.fibers()[0].records().len(), 2);
        assert_eq!(
            committed.fibers()[0].records()[0].order(),
            queued_effect.unmount_order().unwrap()
        );
        assert_eq!(
            committed.fibers()[0].records()[1].order(),
            queued_effect.mount_order()
        );

        let flush = flush_passive_effects_after_commit_from_committed_fiber_effects_for_canary(
            &mut store, &commit,
        )
        .unwrap();

        assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
        assert!(flush.consumed_pending_passive());
        assert_eq!(flush.root(), root_id);
        assert_eq!(flush.finished_work(), Some(finished_work));
        assert_eq!(flush.lanes(), Lanes::DEFAULT);
        assert_eq!(flush.records().len(), 2);
        assert!(!flush.did_execute_destroy_callbacks());
        assert!(!flush.did_execute_mount_create_callbacks());

        let unmount = flush.records()[0];
        let mount = flush.records()[1];
        assert_eq!(unmount.flush_index(), 0);
        assert_eq!(mount.flush_index(), 1);
        assert_eq!(unmount.fiber(), finished_function);
        assert_eq!(mount.fiber(), finished_function);
        assert_eq!(unmount.phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(mount.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(
            unmount.pending_order(),
            queued_effect.unmount_order().unwrap()
        );
        assert_eq!(mount.pending_order(), queued_effect.mount_order());
        assert_eq!(unmount.effect_index(), Some(0));
        assert_eq!(mount.effect_index(), Some(0));
        assert_eq!(unmount.effect(), Some(registration.effect()));
        assert_eq!(mount.effect(), Some(registration.effect()));
        assert_eq!(unmount.effect_instance(), Some(previous.instance()));
        assert_eq!(mount.effect_instance(), Some(registration.instance()));
        assert_eq!(unmount.create_callback(), None);
        assert_eq!(unmount.destroy_callback(), Some(callback(1024)));
        assert_eq!(mount.create_callback(), Some(callback(1027)));
        assert_eq!(mount.destroy_callback(), None);
        assert!(!unmount.create_callback_invoked());
        assert!(!unmount.destroy_callback_invoked());
        assert!(!mount.create_callback_invoked());
        assert!(!mount.destroy_callback_invoked());
        assert_eq!(
            unmount.unmount_origin(),
            Some(PendingPassiveUnmountOrigin::UpdatedFiber)
        );
        assert_eq!(mount.unmount_origin(), None);
        assert!(unmount.pending_order() < mount.pending_order());
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
    fn passive_effects_committed_fiber_traversal_requires_committed_records_before_consuming() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(1030), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let function_fiber = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(1031),
            FiberTypeHandle::from_raw(1032),
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), function_fiber)
            .unwrap();
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        hook_store
            .mount_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(1033),
                deps(1034),
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();
        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(queued.queued_unmount_count(), 0);
        assert_eq!(queued.queued_mount_count(), 1);
        let commit = commit_finished_host_root(&mut store, render).unwrap();

        let error = flush_passive_effects_after_commit_from_committed_fiber_effects_for_canary(
            &mut store, &commit,
        )
        .unwrap_err();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert!(matches!(
            error,
            PassiveEffectsFlushError::CommittedPassiveEffectRecordCountMismatch {
                root,
                expected_unmounts: 0,
                actual_unmounts: 0,
                expected_mounts: 1,
                actual_mounts: 0,
            } if root == root_id
        ));
        assert_eq!(pending_passive.root(), Some(root_id));
        assert_eq!(pending_passive.finished_work(), Some(finished_work));
        assert_eq!(pending_passive.lanes(), Lanes::DEFAULT);
        assert_eq!(pending_passive.passive_mounts().len(), 1);
        assert_eq!(pending_passive.passive_mounts()[0].fiber(), function_fiber);
        assert!(pending_passive.has_commit_handoff());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn passive_effects_scheduler_flush_gate_flushes_metadata_without_callbacks() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(1040);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(1041),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(1042),
                deps(1043),
                Some(callback(1044)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(1045), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(1046),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let registration = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(1047),
                deps(1048),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        let queued_effect = queued.records()[0];
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        commit
            .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
                &queued,
            ))
            .unwrap();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let microtask_request_count = store.scheduler_bridge().microtask_requests().len();

        let scheduler_gate =
            schedule_passive_effects_flush_after_commit_for_canary(&mut store, &commit).unwrap();

        assert!(scheduler_gate.did_schedule_scheduler_flush_request());
        assert_eq!(scheduler_gate.root(), root_id);
        assert_eq!(scheduler_gate.finished_work(), Some(finished_work));
        assert_eq!(scheduler_gate.lanes(), Lanes::DEFAULT);
        assert_eq!(scheduler_gate.pending_unmount_count(), 1);
        assert_eq!(scheduler_gate.pending_mount_count(), 1);
        assert_eq!(scheduler_gate.pending_record_count(), 2);
        assert!(!scheduler_gate.executes_public_effects());
        assert!(!scheduler_gate.public_act_compatibility_claimed());
        assert!(!scheduler_gate.public_scheduler_package_behavior_changed());
        let scheduler_request = scheduler_gate.scheduler_request().unwrap();
        assert_eq!(scheduler_request.order(), 0);
        assert_eq!(
            scheduler_request.node(),
            RootSchedulerCallbackHandle::from_raw(1)
        );
        assert_eq!(scheduler_request.root(), root_id);
        assert_eq!(scheduler_request.finished_work(), finished_work);
        assert_eq!(scheduler_request.lanes(), Lanes::DEFAULT);
        assert_eq!(
            scheduler_request.scheduler_priority(),
            SchedulerPriority::Normal
        );
        assert_eq!(
            store.scheduler_bridge().passive_effects_flush_requests(),
            &[scheduler_request]
        );
        let pending_before_execution = store.root(root_id).unwrap().scheduling().pending_passive();
        assert_eq!(
            pending_before_execution.finished_work(),
            Some(finished_work)
        );
        assert!(pending_before_execution.has_commit_handoff());
        assert_eq!(pending_before_execution.passive_unmounts().len(), 1);
        assert_eq!(pending_before_execution.passive_mounts().len(), 1);

        let execution =
            flush_passive_effects_after_scheduler_flush_gate_from_committed_fiber_effects_for_canary(
                &mut store,
                &commit,
                scheduler_gate,
            )
            .unwrap()
            .unwrap();

        assert_eq!(execution.execution_order(), scheduler_request.order());
        assert_eq!(execution.scheduler_gate(), scheduler_gate);
        assert_eq!(execution.scheduler_request(), scheduler_request);
        assert_eq!(execution.root(), root_id);
        assert_eq!(execution.finished_work(), finished_work);
        assert_eq!(execution.lanes(), Lanes::DEFAULT);
        assert_eq!(execution.pending_unmount_count(), 1);
        assert_eq!(execution.pending_mount_count(), 1);
        assert_eq!(execution.pending_record_count(), 2);
        assert!(execution.did_flush_pending_passive());
        assert!(!execution.did_execute_private_callback_executors());
        assert!(!execution.executes_public_effects());
        assert!(!execution.public_act_compatibility_claimed());
        assert!(!execution.public_scheduler_package_behavior_changed());

        let passive = execution.passive_effects();
        assert_eq!(passive.status(), PassiveEffectsFlushStatus::Flushed);
        assert!(passive.consumed_pending_passive());
        assert_eq!(passive.records().len(), 2);
        assert!(!passive.did_execute_destroy_callbacks());
        assert!(!passive.did_execute_mount_create_callbacks());
        assert!(!passive.public_effect_execution_enabled());
        assert!(!passive.public_act_compatibility_claimed());
        assert!(!passive.scheduler_driven_passive_execution_enabled());

        let unmount = passive.records()[0];
        let mount = passive.records()[1];
        assert_eq!(unmount.flush_index(), 0);
        assert_eq!(mount.flush_index(), 1);
        assert_eq!(unmount.phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(mount.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(
            unmount.pending_order(),
            queued_effect.unmount_order().unwrap()
        );
        assert_eq!(mount.pending_order(), queued_effect.mount_order());
        assert!(unmount.pending_order() < mount.pending_order());
        assert_eq!(unmount.fiber(), finished_function);
        assert_eq!(mount.fiber(), finished_function);
        assert_eq!(unmount.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(mount.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(unmount.effect_index(), Some(0));
        assert_eq!(mount.effect_index(), Some(0));
        assert_eq!(unmount.effect(), Some(registration.effect()));
        assert_eq!(mount.effect(), Some(registration.effect()));
        assert_eq!(unmount.effect_instance(), Some(previous.instance()));
        assert_eq!(mount.effect_instance(), Some(registration.instance()));
        assert_eq!(unmount.destroy_callback(), Some(callback(1044)));
        assert_eq!(mount.create_callback(), Some(callback(1047)));
        assert!(!unmount.destroy_callback_invoked());
        assert!(!mount.create_callback_invoked());
        assert!(!unmount.create_callback_invoked());
        assert!(!mount.destroy_callback_invoked());

        assert!(
            store
                .root(root_id)
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
        assert_eq!(
            store.scheduler_bridge().microtask_requests().len(),
            microtask_request_count
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn passive_effects_committed_execution_gate_invokes_destroy_before_create_under_test_control() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(1050);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(1051),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(1052),
                deps(1053),
                Some(callback(1054)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(1055), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(1056),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let registration = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(1057),
                deps(1058),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(queued.queued_unmount_count(), 1);
        assert_eq!(queued.queued_mount_count(), 1);
        let queued_effect = queued.records()[0];
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let committed = commit
            .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
                &queued,
            ))
            .unwrap()
            .clone();
        assert_eq!(committed.fiber_count(), 1);
        assert_eq!(committed.queued_unmount_count(), 1);
        assert_eq!(committed.queued_mount_count(), 1);

        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut control = TestPassiveEffectCallbackControl::default()
            .with_destroy_result(callback(1054), Ok(()))
            .with_create_result(callback(1057), Ok(Some(callback(1059))));

        let gate =
            execute_update_passive_effect_callbacks_after_commit_from_accepted_committed_function_component_under_test_control_for_canary(
                &mut store,
                &commit,
                &mut control,
            )
            .unwrap();

        assert_eq!(gate.root(), root_id);
        assert_eq!(gate.finished_work(), Some(finished_work));
        assert_eq!(gate.lanes(), Lanes::DEFAULT);
        assert_eq!(gate.flush_status(), PassiveEffectsFlushStatus::Flushed);
        assert_eq!(gate.flush_record_count(), 2);
        assert_eq!(gate.skipped_flush_records_without_callbacks(), 0);
        assert_eq!(gate.len(), 2);
        assert_eq!(gate.completed_count(), 2);
        assert_eq!(gate.error_count(), 0);
        assert!(!gate.has_errors());
        assert_eq!(
            gate.status(),
            PassiveEffectCallbackInvocationGateStatus::TestControlOnly
        );
        assert_eq!(
            gate.blockers(),
            &PASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
        );
        assert!(!gate.public_effect_execution_enabled());
        assert!(!gate.public_act_compatibility_claimed());
        assert!(!gate.scheduler_driven_passive_execution_enabled());

        let records = gate.records();
        assert_eq!(records[0].invocation_order(), 0);
        assert_eq!(
            records[0].kind(),
            PassiveEffectCallbackInvocationKind::Destroy
        );
        assert_eq!(records[0].phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(
            records[0].pending_order(),
            queued_effect.unmount_order().unwrap()
        );
        assert_eq!(records[0].flush_index(), 0);
        assert_eq!(records[0].fiber(), finished_function);
        assert_eq!(records[0].effect_lanes(), Lanes::DEFAULT);
        assert_eq!(records[0].effect_index(), 0);
        assert_eq!(records[0].effect(), registration.effect());
        assert_eq!(records[0].instance(), previous.instance());
        assert_eq!(records[0].callback(), callback(1054));
        assert_eq!(
            records[0].status(),
            PassiveEffectCallbackInvocationStatus::Completed
        );
        assert_eq!(records[0].returned_destroy(), None);

        assert_eq!(records[1].invocation_order(), 1);
        assert_eq!(
            records[1].kind(),
            PassiveEffectCallbackInvocationKind::Create
        );
        assert_eq!(records[1].phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(records[1].pending_order(), queued_effect.mount_order());
        assert_eq!(records[1].flush_index(), 1);
        assert_eq!(records[1].fiber(), finished_function);
        assert_eq!(records[1].effect_lanes(), Lanes::DEFAULT);
        assert_eq!(records[1].effect_index(), 0);
        assert_eq!(records[1].effect(), registration.effect());
        assert_eq!(records[1].instance(), registration.instance());
        assert_eq!(records[1].callback(), callback(1057));
        assert_eq!(
            records[1].status(),
            PassiveEffectCallbackInvocationStatus::Completed
        );
        assert_eq!(records[1].returned_destroy(), Some(callback(1059)));
        assert!(records[0].pending_order() < records[1].pending_order());

        assert_eq!(control.calls().len(), 2);
        assert_eq!(
            control.calls()[0].kind(),
            PassiveEffectCallbackInvocationKind::Destroy
        );
        assert_eq!(control.calls()[0].callback(), callback(1054));
        assert_eq!(
            control.calls()[1].kind(),
            PassiveEffectCallbackInvocationKind::Create
        );
        assert_eq!(control.calls()[1].callback(), callback(1057));
        assert!(
            store
                .root(root_id)
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
    fn passive_effects_function_component_update_metadata_execution_gate_runs_destroy_create_pair()
    {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(1_060);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(1_061),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(1_062),
                deps(1_063),
                Some(callback(1_064)),
            )
            .unwrap();

        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_065),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(1_066),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let registration = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(1_067),
                deps(1_068),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let update_queue = hook_store.effect_update_queue(state).unwrap().unwrap();
        assert_eq!(update_queue.accepted_passive_count(), 1);
        assert_eq!(update_queue.records()[0].effect(), registration.effect());
        assert_eq!(update_queue.records()[0].destroy(), Some(callback(1_064)));
        assert!(update_queue.records()[0].accepted_for_pending_passive());

        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        let queued_effect = queued.records()[0];
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let committed_queues = commit_function_component_effect_queues_for_committed_root(
            &store,
            root_id,
            &mut hook_store,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(committed_queues.len(), 1);
        assert_eq!(committed_queues[0].fiber(), finished_function);
        assert_eq!(
            committed_queues[0].phase(),
            FunctionComponentHookRenderPhase::Update
        );
        assert_eq!(committed_queues[0].accepted_passive_count(), 1);
        assert_eq!(
            committed_queues[0].records()[0].dependency_status(),
            Some(FunctionComponentEffectDependencyStatus::Changed)
        );

        let committed = commit
            .record_function_component_committed_passive_effects_from_committed_effect_queues_for_canary(
                &store,
                &hook_store,
                std::slice::from_ref(&queued),
            )
            .unwrap()
            .clone();
        assert_eq!(committed.fiber_count(), 1);
        assert_eq!(committed.queued_unmount_count(), 1);
        assert_eq!(committed.queued_mount_count(), 1);

        let mut control = TestPassiveEffectCallbackControl::default()
            .with_destroy_result(callback(1_064), Ok(()))
            .with_create_result(callback(1_067), Ok(Some(callback(1_069))));
        let gate =
            execute_update_passive_effect_callbacks_after_commit_from_accepted_committed_function_component_under_test_control_for_canary(
                &mut store,
                &commit,
                &mut control,
            )
            .unwrap();

        assert_eq!(gate.flush_status(), PassiveEffectsFlushStatus::Flushed);
        assert_eq!(gate.len(), 2);
        assert_eq!(gate.completed_count(), 2);
        assert_eq!(gate.error_count(), 0);
        assert_eq!(
            gate.status(),
            PassiveEffectCallbackInvocationGateStatus::TestControlOnly
        );
        assert!(!gate.public_effect_execution_enabled());
        assert!(!gate.public_act_compatibility_claimed());
        assert!(!gate.scheduler_driven_passive_execution_enabled());

        let records = gate.records();
        assert_eq!(
            records[0].kind(),
            PassiveEffectCallbackInvocationKind::Destroy
        );
        assert_eq!(
            records[0].pending_order(),
            queued_effect.unmount_order().unwrap()
        );
        assert_eq!(records[0].effect(), registration.effect());
        assert_eq!(records[0].instance(), previous.instance());
        assert_eq!(records[0].callback(), callback(1_064));

        assert_eq!(
            records[1].kind(),
            PassiveEffectCallbackInvocationKind::Create
        );
        assert_eq!(records[1].pending_order(), queued_effect.mount_order());
        assert_eq!(records[1].effect(), registration.effect());
        assert_eq!(records[1].instance(), registration.instance());
        assert_eq!(records[1].callback(), callback(1_067));
        assert_eq!(records[1].returned_destroy(), Some(callback(1_069)));
        assert!(records[0].pending_order() < records[1].pending_order());

        assert_eq!(control.calls().len(), 2);
        assert_eq!(
            control.calls()[0].kind(),
            PassiveEffectCallbackInvocationKind::Destroy
        );
        assert_eq!(
            control.calls()[1].kind(),
            PassiveEffectCallbackInvocationKind::Create
        );
        assert!(
            store
                .root(root_id)
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
    fn passive_effects_update_lifecycle_execution_evidence_orders_layout_before_passive_callbacks()
    {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(1_080);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(1_081),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous_layout = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Layout,
                callback(1_082),
                deps(1_083),
                Some(callback(1_084)),
            )
            .unwrap();
        let previous_passive = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(1_085),
                deps(1_086),
                Some(callback(1_087)),
            )
            .unwrap();

        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_088),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(1_089),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let layout = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Layout,
                callback(1_090),
                deps(1_091),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        let passive = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(1_092),
                deps(1_093),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();
        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        bubble_test_fiber(&mut store, finished_function);
        bubble_test_fiber(&mut store, finished_work);

        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let layout_record = {
            let effect_list = commit
                .record_function_component_effect_list_commit_phase_order_for_canary(
                    &store,
                    &mut hook_store,
                    std::slice::from_ref(&queued),
                )
                .unwrap()
                .clone();
            effect_list
                .records()
                .iter()
                .find(|record| {
                    record.kind() == FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate
                })
                .copied()
                .unwrap()
        };
        let mut layout_control = TestLayoutEffectCallbackControl::default();
        let layout_execution = commit
            .execute_function_component_layout_effect_record_under_test_control_for_canary(
                &store,
                &hook_store,
                layout_record,
                &mut layout_control,
            )
            .unwrap()
            .clone();
        let mut passive_control = TestPassiveEffectCallbackControl::default()
            .with_destroy_result(callback(1_087), Ok(()))
            .with_create_result(callback(1_092), Ok(Some(callback(1_094))));
        let passive_execution =
            execute_update_passive_effect_callbacks_after_commit_from_accepted_committed_function_component_under_test_control_for_canary(
                &mut store,
                &commit,
                &mut passive_control,
            )
            .unwrap();

        let evidence = record_update_effect_lifecycle_execution_evidence_for_canary(
            &commit,
            &layout_execution,
            &passive_execution,
        )
        .unwrap();

        assert_eq!(evidence.root(), Some(root_id));
        assert_eq!(evidence.finished_work(), Some(finished_work));
        assert_eq!(evidence.lanes(), Lanes::DEFAULT);
        assert_eq!(evidence.len(), 4);
        assert_eq!(evidence.private_layout_callback_count(), 1);
        assert_eq!(evidence.private_passive_callback_count(), 2);
        assert!(evidence.proves_update_destroy_before_create_order());
        assert!(!evidence.public_effect_execution_enabled());
        assert!(!evidence.public_effect_compatibility_claimed());
        assert!(!evidence.public_act_compatibility_claimed());
        assert!(!evidence.scheduler_driven_passive_execution_enabled());
        assert_eq!(
            evidence
                .records()
                .iter()
                .map(|record| record.kind_name())
                .collect::<Vec<_>>(),
            vec![
                "layout-destroy-metadata",
                "layout-create-callback",
                "passive-destroy-callback",
                "passive-create-callback",
            ]
        );
        assert_eq!(
            evidence
                .records()
                .iter()
                .map(|record| record.phase_name())
                .collect::<Vec<_>>(),
            vec!["mutation", "layout", "passive", "passive"]
        );
        let records = evidence.records();
        assert_eq!(records[0].fiber(), finished_function);
        assert_eq!(records[0].effect(), Some(previous_layout.effect()));
        assert_eq!(records[0].callback(), Some(callback(1_084)));
        assert_eq!(records[1].fiber(), finished_function);
        assert_eq!(records[1].effect(), Some(layout.effect()));
        assert_eq!(records[1].callback(), Some(callback(1_090)));
        assert_eq!(records[1].invocation_order(), Some(0));
        assert_eq!(records[2].fiber(), finished_function);
        assert_eq!(records[2].effect(), Some(passive.effect()));
        assert_eq!(records[2].callback(), Some(callback(1_087)));
        assert_eq!(records[2].invocation_order(), Some(0));
        assert_eq!(
            records[2].pending_order(),
            Some(queued.records()[0].unmount_order().unwrap())
        );
        assert_eq!(records[3].fiber(), finished_function);
        assert_eq!(records[3].effect(), Some(passive.effect()));
        assert_eq!(records[3].callback(), Some(callback(1_092)));
        assert_eq!(records[3].invocation_order(), Some(1));
        assert_eq!(
            records[3].pending_order(),
            Some(queued.records()[0].mount_order())
        );
        assert!(records[1].metadata_sequence().unwrap() < records[2].metadata_sequence().unwrap());
        assert!(records[2].pending_order().unwrap() < records[3].pending_order().unwrap());
        assert_eq!(layout_control.calls().len(), 1);
        assert_eq!(passive_control.calls().len(), 2);
        assert_eq!(previous_passive.instance(), passive.instance());
        assert!(
            store
                .root(root_id)
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
    fn passive_effects_committed_execution_gate_rejects_missing_handoff_before_callbacks() {
        let (mut store, root_id, host) = root_store();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_060),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let mut control = TestPassiveEffectCallbackControl::default()
            .with_destroy_result(callback(1_061), Ok(()))
            .with_create_result(callback(1_062), Ok(Some(callback(1_063))));

        let error =
            execute_passive_effect_callbacks_after_commit_from_committed_fiber_effects_under_test_control_for_canary(
                &mut store,
                &commit,
                &mut control,
            )
            .unwrap_err();

        assert!(matches!(
            error,
            PassiveEffectsFlushError::CommittedPassiveCallbackInvocationMissingHandoff { root }
                if root == root_id
        ));
        assert!(control.calls().is_empty());
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
    fn passive_effects_committed_execution_gate_rejects_stale_fiber_before_callbacks() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(1_070);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(1_071),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(1_072),
                deps(1_073),
                Some(callback(1_074)),
            )
            .unwrap();

        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_075),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let mode = store.fiber_arena().get(finished_work).unwrap().mode();
        let stale_finished_function = create_function_component_fiber(
            &mut store,
            mode,
            PropsHandle::from_raw(1_076),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, stale_finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), stale_finished_function)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(1_077),
                deps(1_078),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();
        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        commit
            .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
                &queued,
            ))
            .unwrap();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut control = TestPassiveEffectCallbackControl::default()
            .with_destroy_result(callback(1_074), Ok(()))
            .with_create_result(callback(1_077), Ok(Some(callback(1_079))));

        let error =
            execute_update_passive_effect_callbacks_after_commit_from_accepted_committed_function_component_under_test_control_for_canary(
                &mut store,
                &commit,
                &mut control,
            )
            .unwrap_err();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert!(matches!(
            error,
            PassiveEffectsFlushError::CommittedPassiveCallbackInvocationStaleFiber {
                root,
                finished_work: error_finished_work,
                fiber,
            } if root == root_id
                && error_finished_work == finished_work
                && fiber == stale_finished_function
        ));
        assert!(control.calls().is_empty());
        assert_eq!(pending_passive.root(), Some(root_id));
        assert_eq!(pending_passive.finished_work(), Some(finished_work));
        assert!(pending_passive.has_commit_handoff());
        assert_eq!(pending_passive.passive_unmount_count(), 1);
        assert_eq!(pending_passive.passive_mount_count(), 1);
        assert_eq!(pending_passive.pending_record_count(), 2);
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
    fn passive_effects_committed_execution_gate_rejects_mount_phase_before_callbacks() {
        let (mut store, root_id, host) = root_store();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_080),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let function_fiber = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(1_081),
            FiberTypeHandle::from_raw(1_082),
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), function_fiber)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Mount);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        hook_store
            .mount_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(1_083),
                deps(1_084),
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();
        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let committed = commit
            .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
                &queued,
            ))
            .unwrap()
            .clone();
        assert_eq!(committed.fiber_count(), 1);
        assert_eq!(
            committed.fibers()[0].phase(),
            FunctionComponentHookRenderPhase::Mount
        );
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut control = TestPassiveEffectCallbackControl::default()
            .with_create_result(callback(1_083), Ok(Some(callback(1_085))));

        let error =
            execute_update_passive_effect_callbacks_after_commit_from_accepted_committed_function_component_under_test_control_for_canary(
                &mut store,
                &commit,
                &mut control,
            )
            .unwrap_err();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert!(matches!(
            error,
            PassiveEffectsFlushError::CommittedPassiveCallbackInvocationWrongRenderPhase {
                root,
                fiber,
                expected: FunctionComponentHookRenderPhase::Update,
                actual: FunctionComponentHookRenderPhase::Mount,
            } if root == root_id && fiber == function_fiber
        ));
        assert!(control.calls().is_empty());
        assert_eq!(pending_passive.root(), Some(root_id));
        assert_eq!(pending_passive.finished_work(), Some(finished_work));
        assert!(pending_passive.has_commit_handoff());
        assert_eq!(pending_passive.passive_unmount_count(), 0);
        assert_eq!(pending_passive.passive_mount_count(), 1);
        assert_eq!(pending_passive.pending_record_count(), 1);
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
    fn passive_effects_callback_invocation_gate_invokes_destroy_before_create_under_test_control() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(840);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(841),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(842),
                deps(843),
                Some(callback(844)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(845), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(846),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let registration = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(847),
                deps(848),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();
        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        let queued_effect = queued.records()[0];

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let flush = flush_passive_effects_after_commit_with_function_component_handoffs(
            &mut store,
            &commit,
            std::slice::from_ref(&queued),
        )
        .unwrap();
        assert_eq!(flush.records().len(), 2);
        assert!(!flush.records()[0].destroy_callback_invoked());
        assert!(!flush.records()[1].create_callback_invoked());
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut control = TestPassiveEffectCallbackControl::default()
            .with_destroy_result(callback(844), Ok(()))
            .with_create_result(callback(847), Ok(Some(callback(849))));

        let gate = invoke_passive_effect_callbacks_under_test_control(flush, &mut control);

        assert_eq!(gate.root(), root_id);
        assert_eq!(gate.finished_work(), Some(finished_work));
        assert_eq!(gate.lanes(), Lanes::DEFAULT);
        assert_eq!(gate.flush_status(), PassiveEffectsFlushStatus::Flushed);
        assert_eq!(gate.flush_record_count(), 2);
        assert_eq!(gate.skipped_flush_records_without_callbacks(), 0);
        assert_eq!(gate.len(), 2);
        assert_eq!(gate.completed_count(), 2);
        assert_eq!(gate.error_count(), 0);
        assert!(!gate.has_errors());
        assert_eq!(gate.errors(), Vec::new());
        assert_eq!(
            gate.status(),
            PassiveEffectCallbackInvocationGateStatus::TestControlOnly
        );
        assert_eq!(
            gate.blockers(),
            &PASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
        );
        assert!(!gate.public_effect_execution_enabled());
        assert!(!gate.public_act_compatibility_claimed());
        assert!(!gate.scheduler_driven_passive_execution_enabled());

        let records = gate.records();
        assert_eq!(records[0].invocation_order(), 0);
        assert_eq!(
            records[0].kind(),
            PassiveEffectCallbackInvocationKind::Destroy
        );
        assert_eq!(
            records[0].kind().phase(),
            PendingPassiveEffectPhase::Unmount
        );
        assert_eq!(records[0].phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(records[0].flush_index(), 0);
        assert_eq!(
            records[0].pending_order(),
            queued_effect.unmount_order().unwrap()
        );
        assert_eq!(records[0].root(), root_id);
        assert_eq!(records[0].finished_work(), finished_work);
        assert_eq!(records[0].committed_lanes(), Lanes::DEFAULT);
        assert_eq!(records[0].fiber(), finished_function);
        assert_eq!(records[0].effect_lanes(), Lanes::DEFAULT);
        assert_eq!(records[0].effect_index(), 0);
        assert_eq!(records[0].effect(), registration.effect());
        assert_eq!(records[0].instance(), previous.instance());
        assert_eq!(records[0].instance(), registration.instance());
        assert_eq!(records[0].callback(), callback(844));
        assert_eq!(
            records[0].status(),
            PassiveEffectCallbackInvocationStatus::Completed
        );
        assert!(records[0].completed());
        assert!(!records[0].errored());
        assert_eq!(records[0].error(), None);
        assert_eq!(records[0].returned_destroy(), None);

        assert_eq!(records[1].invocation_order(), 1);
        assert_eq!(
            records[1].kind(),
            PassiveEffectCallbackInvocationKind::Create
        );
        assert_eq!(records[1].kind().phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(records[1].phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(records[1].flush_index(), 1);
        assert_eq!(records[1].pending_order(), queued_effect.mount_order());
        assert_eq!(records[1].root(), root_id);
        assert_eq!(records[1].finished_work(), finished_work);
        assert_eq!(records[1].committed_lanes(), Lanes::DEFAULT);
        assert_eq!(records[1].fiber(), finished_function);
        assert_eq!(records[1].effect_lanes(), Lanes::DEFAULT);
        assert_eq!(records[1].effect_index(), 0);
        assert_eq!(records[1].effect(), registration.effect());
        assert_eq!(records[1].instance(), registration.instance());
        assert_eq!(records[1].callback(), callback(847));
        assert_eq!(
            records[1].status(),
            PassiveEffectCallbackInvocationStatus::Completed
        );
        assert!(records[1].completed());
        assert!(!records[1].errored());
        assert_eq!(records[1].error(), None);
        assert_eq!(records[1].returned_destroy(), Some(callback(849)));
        assert_eq!(records[1].request().callback(), callback(847));

        assert_eq!(control.calls().len(), 2);
        assert_eq!(
            control.calls()[0].kind(),
            PassiveEffectCallbackInvocationKind::Destroy
        );
        assert_eq!(control.calls()[0].callback(), callback(844));
        assert_eq!(
            control.calls()[1].kind(),
            PassiveEffectCallbackInvocationKind::Create
        );
        assert_eq!(control.calls()[1].callback(), callback(847));
        assert_eq!(
            store.scheduler_bridge().act_queue_requests().len(),
            act_queue_request_count
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn passive_effects_callback_gate_runs_unmount_destroys_before_creates_after_error() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(910);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(911),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous_first = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(912),
                deps(913),
                Some(callback(914)),
            )
            .unwrap();
        let previous_second = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(915),
                deps(916),
                Some(callback(917)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(918), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(919),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let first_registration = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(920),
                deps(921),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        let second_registration = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(922),
                deps(923),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(queued.records().len(), 2);
        assert_eq!(queued.queued_unmount_count(), 2);
        assert_eq!(queued.queued_mount_count(), 2);
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let flush = flush_passive_effects_after_commit_with_function_component_handoffs(
            &mut store,
            &commit,
            std::slice::from_ref(&queued),
        )
        .unwrap();
        assert_eq!(flush.records().len(), 4);
        assert_eq!(
            flush.records()[0].phase(),
            PendingPassiveEffectPhase::Unmount
        );
        assert_eq!(
            flush.records()[1].phase(),
            PendingPassiveEffectPhase::Unmount
        );
        assert_eq!(flush.records()[2].phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(flush.records()[3].phase(), PendingPassiveEffectPhase::Mount);
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut control = TestPassiveEffectCallbackControl::default()
            .with_destroy_result(callback(914), Err(callback_error(930)))
            .with_destroy_result(callback(917), Ok(()))
            .with_create_result(callback(920), Ok(Some(callback(931))))
            .with_create_result(callback(922), Ok(None));

        let gate = invoke_passive_effect_callbacks_under_test_control(flush, &mut control);

        assert_eq!(gate.root(), root_id);
        assert_eq!(gate.finished_work(), Some(finished_work));
        assert_eq!(gate.lanes(), Lanes::DEFAULT);
        assert_eq!(gate.flush_status(), PassiveEffectsFlushStatus::Flushed);
        assert_eq!(gate.flush_record_count(), 4);
        assert_eq!(gate.skipped_flush_records_without_callbacks(), 0);
        assert_eq!(gate.len(), 4);
        assert_eq!(gate.completed_count(), 3);
        assert_eq!(gate.error_count(), 1);
        assert!(gate.has_errors());
        assert_eq!(gate.errors(), vec![callback_error(930)]);
        assert!(!gate.public_effect_execution_enabled());
        assert!(!gate.public_act_compatibility_claimed());
        assert!(!gate.scheduler_driven_passive_execution_enabled());

        let records = gate.records();
        assert_eq!(records[0].invocation_order(), 0);
        assert_eq!(records[1].invocation_order(), 1);
        assert_eq!(records[2].invocation_order(), 2);
        assert_eq!(records[3].invocation_order(), 3);
        assert_eq!(
            records[0].kind(),
            PassiveEffectCallbackInvocationKind::Destroy
        );
        assert_eq!(
            records[1].kind(),
            PassiveEffectCallbackInvocationKind::Destroy
        );
        assert_eq!(
            records[2].kind(),
            PassiveEffectCallbackInvocationKind::Create
        );
        assert_eq!(
            records[3].kind(),
            PassiveEffectCallbackInvocationKind::Create
        );
        assert_eq!(records[0].phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(records[1].phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(records[2].phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(records[3].phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(records[0].flush_index(), 0);
        assert_eq!(records[1].flush_index(), 1);
        assert_eq!(records[2].flush_index(), 2);
        assert_eq!(records[3].flush_index(), 3);
        assert_eq!(
            records[0].pending_order(),
            queued.records()[0].unmount_order().unwrap()
        );
        assert_eq!(
            records[1].pending_order(),
            queued.records()[1].unmount_order().unwrap()
        );
        assert_eq!(
            records[2].pending_order(),
            queued.records()[0].mount_order()
        );
        assert_eq!(
            records[3].pending_order(),
            queued.records()[1].mount_order()
        );
        assert!(records[1].pending_order() < records[2].pending_order());
        assert_eq!(records[0].fiber(), finished_function);
        assert_eq!(records[1].fiber(), finished_function);
        assert_eq!(records[2].fiber(), finished_function);
        assert_eq!(records[3].fiber(), finished_function);
        assert_eq!(records[0].effect_index(), 0);
        assert_eq!(records[1].effect_index(), 1);
        assert_eq!(records[2].effect_index(), 0);
        assert_eq!(records[3].effect_index(), 1);
        assert_eq!(records[0].effect(), first_registration.effect());
        assert_eq!(records[1].effect(), second_registration.effect());
        assert_eq!(records[2].effect(), first_registration.effect());
        assert_eq!(records[3].effect(), second_registration.effect());
        assert_eq!(records[0].instance(), previous_first.instance());
        assert_eq!(records[1].instance(), previous_second.instance());
        assert_eq!(records[2].instance(), first_registration.instance());
        assert_eq!(records[3].instance(), second_registration.instance());
        assert_eq!(records[0].callback(), callback(914));
        assert_eq!(records[1].callback(), callback(917));
        assert_eq!(records[2].callback(), callback(920));
        assert_eq!(records[3].callback(), callback(922));
        assert_eq!(
            records[0].status(),
            PassiveEffectCallbackInvocationStatus::Errored
        );
        assert_eq!(
            records[1].status(),
            PassiveEffectCallbackInvocationStatus::Completed
        );
        assert_eq!(
            records[2].status(),
            PassiveEffectCallbackInvocationStatus::Completed
        );
        assert_eq!(
            records[3].status(),
            PassiveEffectCallbackInvocationStatus::Completed
        );
        assert!(records[0].errored());
        assert!(records[1].completed());
        assert!(records[2].completed());
        assert!(records[3].completed());
        assert_eq!(records[0].error(), Some(callback_error(930)));
        assert_eq!(records[1].error(), None);
        assert_eq!(records[2].error(), None);
        assert_eq!(records[3].error(), None);
        assert_eq!(records[0].returned_destroy(), None);
        assert_eq!(records[1].returned_destroy(), None);
        assert_eq!(records[2].returned_destroy(), Some(callback(931)));
        assert_eq!(records[3].returned_destroy(), None);

        assert_eq!(control.calls().len(), 4);
        assert_eq!(
            control.calls()[0].kind(),
            PassiveEffectCallbackInvocationKind::Destroy
        );
        assert_eq!(
            control.calls()[1].kind(),
            PassiveEffectCallbackInvocationKind::Destroy
        );
        assert_eq!(
            control.calls()[2].kind(),
            PassiveEffectCallbackInvocationKind::Create
        );
        assert_eq!(
            control.calls()[3].kind(),
            PassiveEffectCallbackInvocationKind::Create
        );
        assert_eq!(control.calls()[0].callback(), callback(914));
        assert_eq!(control.calls()[1].callback(), callback(917));
        assert_eq!(control.calls()[2].callback(), callback(920));
        assert_eq!(control.calls()[3].callback(), callback(922));
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
    fn passive_effects_callback_invocation_gate_records_errors_without_public_act() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(850);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(851),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(852),
                deps(853),
                Some(callback(854)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(855), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_function = append_function_component_child(
            &mut store,
            render.finished_work(),
            PropsHandle::from_raw(856),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(857),
                deps(858),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();
        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let flush = flush_passive_effects_after_commit_with_function_component_handoffs(
            &mut store,
            &commit,
            std::slice::from_ref(&queued),
        )
        .unwrap();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut control = TestPassiveEffectCallbackControl::default()
            .with_destroy_result(callback(854), Err(callback_error(901)))
            .with_create_result(callback(857), Err(callback_error(902)));

        let gate = invoke_passive_effect_callbacks_under_test_control(flush, &mut control);

        assert_eq!(gate.len(), 2);
        assert_eq!(gate.completed_count(), 0);
        assert_eq!(gate.error_count(), 2);
        assert!(gate.has_errors());
        assert_eq!(
            gate.errors(),
            vec![callback_error(901), callback_error(902)]
        );
        assert!(!gate.public_effect_execution_enabled());
        assert!(!gate.public_act_compatibility_claimed());
        assert!(!gate.scheduler_driven_passive_execution_enabled());

        let records = gate.records();
        assert_eq!(records[0].invocation_order(), 0);
        assert_eq!(
            records[0].kind(),
            PassiveEffectCallbackInvocationKind::Destroy
        );
        assert_eq!(
            records[0].status(),
            PassiveEffectCallbackInvocationStatus::Errored
        );
        assert!(!records[0].completed());
        assert!(records[0].errored());
        assert_eq!(records[0].error(), Some(callback_error(901)));
        assert_eq!(records[0].returned_destroy(), None);
        assert_eq!(records[1].invocation_order(), 1);
        assert_eq!(
            records[1].kind(),
            PassiveEffectCallbackInvocationKind::Create
        );
        assert_eq!(
            records[1].status(),
            PassiveEffectCallbackInvocationStatus::Errored
        );
        assert!(!records[1].completed());
        assert!(records[1].errored());
        assert_eq!(records[1].error(), Some(callback_error(902)));
        assert_eq!(records[1].returned_destroy(), None);
        assert_eq!(control.calls().len(), 2);
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
    fn passive_effects_destroy_executor_runs_unmounts_in_flush_order_and_records_errors() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(880);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(881),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous_first = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(882),
                deps(883),
                Some(callback(884)),
            )
            .unwrap();
        let previous_second = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(885),
                deps(886),
                Some(callback(887)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(888), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(889),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Update);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let first_registration = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(890),
                deps(891),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        let second_registration = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(892),
                deps(893),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(queued.records().len(), 2);
        assert_eq!(queued.queued_unmount_count(), 2);
        assert_eq!(queued.queued_mount_count(), 2);

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let mut destroy_executor =
            RecordingDestroyExecutor::with_error(callback(884), destroy_error(900));
        let flush = flush_passive_effects_after_commit_with_destroy_executor(
            &mut store,
            &commit,
            std::slice::from_ref(&queued),
            &mut destroy_executor,
        )
        .unwrap();

        assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
        assert_eq!(flush.records().len(), 4);
        assert!(flush.did_execute_destroy_callbacks());
        assert!(flush.did_record_destroy_callback_errors());
        assert_eq!(flush.destroy_callback_executions().len(), 2);
        assert_eq!(flush.destroy_callback_errors().len(), 1);
        assert!(!flush.did_execute_mount_create_callbacks());
        assert!(!flush.did_record_mount_create_callback_errors());
        assert!(flush.mount_create_callback_executions().is_empty());
        assert!(flush.mount_create_callback_errors().is_empty());
        assert_eq!(destroy_executor.calls().len(), 2);

        let first_unmount = flush.records()[0];
        let second_unmount = flush.records()[1];
        let first_mount = flush.records()[2];
        let second_mount = flush.records()[3];
        assert_eq!(first_unmount.flush_index(), 0);
        assert_eq!(second_unmount.flush_index(), 1);
        assert_eq!(first_mount.flush_index(), 2);
        assert_eq!(second_mount.flush_index(), 3);
        assert_eq!(first_unmount.phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(second_unmount.phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(first_mount.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(second_mount.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(
            first_unmount.pending_order(),
            queued.records()[0].unmount_order().unwrap()
        );
        assert_eq!(
            second_unmount.pending_order(),
            queued.records()[1].unmount_order().unwrap()
        );
        assert_eq!(
            first_mount.pending_order(),
            queued.records()[0].mount_order()
        );
        assert_eq!(
            second_mount.pending_order(),
            queued.records()[1].mount_order()
        );
        assert!(first_unmount.pending_order() < second_unmount.pending_order());
        assert!(second_unmount.pending_order() < first_mount.pending_order());
        assert!(first_mount.pending_order() < second_mount.pending_order());

        assert_eq!(first_unmount.effect_index(), Some(0));
        assert_eq!(second_unmount.effect_index(), Some(1));
        assert_eq!(first_unmount.effect(), Some(first_registration.effect()));
        assert_eq!(second_unmount.effect(), Some(second_registration.effect()));
        assert_eq!(
            first_unmount.effect_instance(),
            Some(previous_first.instance())
        );
        assert_eq!(
            second_unmount.effect_instance(),
            Some(previous_second.instance())
        );
        assert_eq!(first_unmount.destroy_callback(), Some(callback(884)));
        assert_eq!(second_unmount.destroy_callback(), Some(callback(887)));
        assert!(first_unmount.destroy_callback_invoked());
        assert!(second_unmount.destroy_callback_invoked());
        assert!(!first_mount.destroy_callback_invoked());
        assert!(!second_mount.destroy_callback_invoked());
        assert!(!first_unmount.create_callback_invoked());
        assert!(!second_unmount.create_callback_invoked());
        assert_eq!(
            first_unmount.unmount_origin(),
            Some(PendingPassiveUnmountOrigin::UpdatedFiber)
        );
        assert_eq!(
            second_unmount.unmount_origin(),
            Some(PendingPassiveUnmountOrigin::UpdatedFiber)
        );

        let first_execution = flush.destroy_callback_executions()[0];
        let second_execution = flush.destroy_callback_executions()[1];
        assert_eq!(first_execution.execution_order(), 0);
        assert_eq!(second_execution.execution_order(), 1);
        assert_eq!(first_execution.flush_index(), first_unmount.flush_index());
        assert_eq!(second_execution.flush_index(), second_unmount.flush_index());
        assert_eq!(first_execution.root(), root_id);
        assert_eq!(first_execution.finished_work(), finished_work);
        assert_eq!(first_execution.committed_lanes(), Lanes::DEFAULT);
        assert_eq!(first_execution.fiber(), finished_function);
        assert_eq!(second_execution.fiber(), finished_function);
        assert_eq!(first_execution.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(second_execution.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(first_execution.phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(second_execution.phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(
            first_execution.pending_order(),
            first_unmount.pending_order()
        );
        assert_eq!(
            second_execution.pending_order(),
            second_unmount.pending_order()
        );
        assert_eq!(
            first_execution.unmount_origin(),
            Some(PendingPassiveUnmountOrigin::UpdatedFiber)
        );
        assert_eq!(
            second_execution.unmount_origin(),
            Some(PendingPassiveUnmountOrigin::UpdatedFiber)
        );
        assert_eq!(first_execution.effect_index(), Some(0));
        assert_eq!(second_execution.effect_index(), Some(1));
        assert_eq!(first_execution.effect(), Some(first_registration.effect()));
        assert_eq!(
            second_execution.effect(),
            Some(second_registration.effect())
        );
        assert_eq!(
            first_execution.effect_instance(),
            Some(previous_first.instance())
        );
        assert_eq!(
            second_execution.effect_instance(),
            Some(previous_second.instance())
        );
        assert_eq!(first_execution.destroy_callback(), callback(884));
        assert_eq!(second_execution.destroy_callback(), callback(887));
        assert_eq!(destroy_executor.calls()[0], first_execution.request());
        assert_eq!(destroy_executor.calls()[1], second_execution.request());

        let error = flush.destroy_callback_errors()[0];
        assert_eq!(error.execution(), first_execution);
        assert_eq!(error.error(), destroy_error(900));
        assert!(error.error().is_some());
        assert!(!error.error().is_none());
        assert_eq!(error.error().raw(), 900);

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
    fn passive_effects_deleted_subtree_destroy_executor_consumes_private_order_metadata() {
        let (mut store, root_id, host) = root_store();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9_940),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let fixture = attach_deleted_host_subtree_ref_passive_fixture(
            &mut store,
            &mut hook_store,
            finished_work,
        );
        let deleted_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            finished_work,
            fixture.deleted_host,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(deleted_handoff.queued_unmount_count(), 1);
        let queued_passive = deleted_handoff.records()[0];

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let passive_snapshot = commit
            .record_function_component_deleted_subtree_passive_effects_for_canary(&[
                deleted_handoff,
            ])
            .unwrap()
            .clone();
        let order_gate = commit.deletion_cleanup_order_gate_for_canary();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut destroy_executor = RecordingDestroyExecutor::default();

        let flush =
            flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary(
                &mut store,
                &commit,
                &mut destroy_executor,
            )
            .unwrap();

        assert_eq!(passive_snapshot.len(), 1);
        assert_eq!(passive_snapshot.destroy_count(), 1);
        assert_eq!(passive_snapshot.records()[0], queued_passive);
        assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
        assert!(flush.consumed_pending_passive());
        assert_eq!(flush.root(), root_id);
        assert_eq!(flush.finished_work(), Some(finished_work));
        assert_eq!(flush.lanes(), Lanes::DEFAULT);
        assert_eq!(flush.records().len(), 1);
        assert!(flush.did_execute_destroy_callbacks());
        assert!(!flush.did_record_destroy_callback_errors());
        assert_eq!(flush.destroy_callback_executions().len(), 1);
        assert!(flush.destroy_callback_errors().is_empty());
        assert!(!flush.did_execute_mount_create_callbacks());
        assert!(flush.mount_create_callback_executions().is_empty());
        assert!(!flush.public_effect_execution_enabled());
        assert!(!flush.public_act_compatibility_claimed());
        assert!(!flush.scheduler_driven_passive_execution_enabled());

        let record = flush.records()[0];
        assert_eq!(record.flush_index(), 0);
        assert_eq!(record.fiber(), fixture.deleted_function);
        assert_eq!(record.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(record.phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(record.pending_order(), queued_passive.unmount_order());
        assert_eq!(
            record.unmount_origin(),
            Some(PendingPassiveUnmountOrigin::DeletedSubtree {
                nearest_mounted_ancestor: finished_work,
            })
        );
        assert_eq!(record.effect_index(), Some(0));
        assert_eq!(record.effect(), Some(queued_passive.effect()));
        assert_eq!(record.effect_instance(), Some(queued_passive.instance()));
        assert_eq!(record.create_callback(), None);
        assert_eq!(record.destroy_callback(), Some(fixture.passive_destroy));
        assert!(record.destroy_callback_invoked());
        assert!(!record.create_callback_invoked());

        let execution = flush.destroy_callback_executions()[0];
        assert_eq!(execution.execution_order(), 0);
        assert_eq!(execution.flush_index(), 0);
        assert_eq!(execution.root(), root_id);
        assert_eq!(execution.finished_work(), finished_work);
        assert_eq!(execution.committed_lanes(), Lanes::DEFAULT);
        assert_eq!(execution.fiber(), fixture.deleted_function);
        assert_eq!(execution.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(execution.phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(execution.pending_order(), queued_passive.unmount_order());
        assert_eq!(execution.effect_index(), Some(0));
        assert_eq!(execution.effect(), Some(queued_passive.effect()));
        assert_eq!(execution.effect_instance(), Some(queued_passive.instance()));
        assert_eq!(execution.destroy_callback(), fixture.passive_destroy);
        assert_eq!(
            execution.unmount_origin(),
            Some(PendingPassiveUnmountOrigin::DeletedSubtree {
                nearest_mounted_ancestor: finished_work,
            })
        );
        assert_eq!(destroy_executor.calls(), &[execution.request()]);

        assert_eq!(order_gate.len(), 4);
        assert_eq!(order_gate.ref_cleanup_return_count(), 1);
        assert_eq!(order_gate.passive_destroy_count(), 1);
        assert_eq!(order_gate.host_node_cleanup_count(), 2);
        assert_eq!(
            order_gate
                .records()
                .iter()
                .map(|record| record.phase())
                .collect::<Vec<_>>(),
            vec![
                HostRootDeletionCleanupOrderPhase::RefCleanupReturn,
                HostRootDeletionCleanupOrderPhase::PassiveDestroy,
                HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
                HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
            ]
        );
        assert_eq!(order_gate.records()[0].fiber(), fixture.deleted_host);
        assert_eq!(
            order_gate.records()[0].ref_cleanup_return_sequence(),
            Some(0)
        );
        assert_eq!(order_gate.records()[1].fiber(), fixture.deleted_function);
        assert_eq!(
            order_gate.records()[1].passive_unmount_order(),
            Some(queued_passive.unmount_order())
        );
        assert_eq!(
            order_gate.records()[1].passive_destroy(),
            Some(fixture.passive_destroy)
        );
        assert_eq!(order_gate.records()[2].fiber(), fixture.deleted_text);
        assert_eq!(order_gate.records()[2].host_cleanup_sequence(), Some(0));
        assert_eq!(order_gate.records()[3].fiber(), fixture.deleted_host);
        assert_eq!(order_gate.records()[3].host_cleanup_sequence(), Some(1));
        assert!(!order_gate.ref_cleanup_return_callbacks_invoked());
        assert!(!order_gate.passive_destroy_callbacks_invoked());
        assert!(!order_gate.public_effects_flushed());
        assert!(!order_gate.public_ref_or_effect_compatibility_claimed());

        assert!(
            store
                .root(root_id)
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
    fn passive_effects_deleted_subtree_unmount_lifecycle_execution_evidence_consumes_cleanup_order_metadata()
     {
        let (mut store, root_id, host) = root_store();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9_930),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let fixture = attach_deleted_host_subtree_ref_passive_fixture(
            &mut store,
            &mut hook_store,
            finished_work,
        );
        let deleted_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            finished_work,
            fixture.deleted_host,
            Lanes::DEFAULT,
        )
        .unwrap();
        let queued_passive = deleted_handoff.records()[0];

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        commit
            .record_function_component_deleted_subtree_passive_effects_for_canary(&[
                deleted_handoff,
            ])
            .unwrap();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut destroy_executor = RecordingDestroyExecutor::default();

        let flush =
            flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary(
                &mut store,
                &commit,
                &mut destroy_executor,
            )
            .unwrap();
        let evidence =
            record_deleted_subtree_unmount_effect_lifecycle_execution_evidence_for_canary(
                &commit, &flush,
            )
            .unwrap();

        assert_eq!(evidence.root(), Some(root_id));
        assert_eq!(evidence.finished_work(), Some(finished_work));
        assert_eq!(evidence.lanes(), Lanes::DEFAULT);
        assert_eq!(evidence.len(), 4);
        assert_eq!(evidence.private_layout_callback_count(), 0);
        assert_eq!(evidence.private_passive_callback_count(), 1);
        assert!(evidence.proves_deleted_subtree_unmount_destroy_order());
        assert!(!evidence.public_effect_execution_enabled());
        assert!(!evidence.public_effect_compatibility_claimed());
        assert!(!evidence.public_act_compatibility_claimed());
        assert!(!evidence.scheduler_driven_passive_execution_enabled());
        assert_eq!(
            evidence
                .records()
                .iter()
                .map(|record| record.kind_name())
                .collect::<Vec<_>>(),
            vec![
                "deleted-subtree-passive-destroy-metadata",
                "deleted-subtree-passive-destroy-callback",
                "deleted-subtree-host-cleanup-metadata",
                "deleted-subtree-host-cleanup-metadata",
            ]
        );
        assert_eq!(
            evidence
                .records()
                .iter()
                .map(|record| record.phase_name())
                .collect::<Vec<_>>(),
            vec!["passive", "passive", "mutation", "mutation"]
        );

        let records = evidence.records();
        assert_eq!(records[0].fiber(), fixture.deleted_function);
        assert_eq!(records[0].effect(), Some(queued_passive.effect()));
        assert_eq!(records[0].callback(), Some(fixture.passive_destroy));
        assert_eq!(
            records[0].pending_order(),
            Some(queued_passive.unmount_order())
        );
        assert_eq!(records[1].fiber(), fixture.deleted_function);
        assert_eq!(records[1].effect(), Some(queued_passive.effect()));
        assert_eq!(records[1].callback(), Some(fixture.passive_destroy));
        assert_eq!(records[1].invocation_order(), Some(0));
        assert_eq!(
            records[1].pending_order(),
            Some(queued_passive.unmount_order())
        );
        assert_eq!(
            records[0].metadata_sequence(),
            records[1].metadata_sequence()
        );
        assert!(records[0].metadata_sequence().unwrap() < records[2].metadata_sequence().unwrap());
        assert_eq!(records[2].fiber(), fixture.deleted_text);
        assert_eq!(records[3].fiber(), fixture.deleted_host);

        assert_eq!(flush.destroy_callback_executions().len(), 1);
        assert_eq!(
            flush.destroy_callback_executions()[0].destroy_callback(),
            fixture.passive_destroy
        );
        assert_eq!(
            flush.destroy_callback_executions()[0].unmount_origin(),
            Some(PendingPassiveUnmountOrigin::DeletedSubtree {
                nearest_mounted_ancestor: finished_work,
            })
        );
        assert_eq!(
            destroy_executor.calls(),
            &[flush.destroy_callback_executions()[0].request()]
        );
        assert!(
            store
                .root(root_id)
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
    fn deletion_ref_passive_cleanup_execution_runs_ref_cleanup_before_deleted_passive_destroy() {
        let (mut store, root_id, host) = root_store();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9_965),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let fixture = attach_deleted_host_subtree_ref_passive_fixture(
            &mut store,
            &mut hook_store,
            finished_work,
        );
        let deleted_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            finished_work,
            fixture.deleted_host,
            Lanes::DEFAULT,
        )
        .unwrap();
        let queued_passive = deleted_handoff.records()[0];

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        commit
            .record_function_component_deleted_subtree_passive_effects_for_canary(&[
                deleted_handoff,
            ])
            .unwrap();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut executor = RecordingDeletedCleanupExecutor::default();

        let execution = execute_deleted_subtree_ref_and_passive_cleanup_after_commit_for_canary(
            &mut store,
            &commit,
            &mut executor,
        )
        .unwrap();

        assert_eq!(execution.root(), root_id);
        assert_eq!(execution.finished_work(), finished_work);
        assert!(execution.ref_cleanup_return_callbacks_invoked());
        assert!(execution.passive_destroy_callbacks_invoked());
        assert!(!execution.public_unmount_compatibility_claimed());
        assert!(!execution.public_ref_or_effect_compatibility_claimed());
        assert_eq!(
            executor.events(),
            &[
                DeletedCleanupExecutionEvent::RefCleanup(fixture.deleted_host),
                DeletedCleanupExecutionEvent::PassiveDestroy(fixture.passive_destroy),
            ]
        );
        assert_eq!(executor.ref_cleanup_calls().len(), 1);
        assert_eq!(executor.destroy_calls().len(), 1);

        let ref_execution = execution.ref_cleanup_return_executions()[0];
        assert_eq!(ref_execution.execution_order(), 0);
        assert_eq!(ref_execution.root(), root_id);
        assert_eq!(ref_execution.finished_work(), finished_work);
        assert_eq!(ref_execution.deleted_root(), fixture.deleted_host);
        assert_eq!(ref_execution.fiber(), fixture.deleted_host);
        assert_eq!(ref_execution.state_node(), fixture.deleted_host_state_node);
        assert_eq!(ref_execution.ref_handle(), fixture.deleted_host_ref);
        assert_eq!(ref_execution.request(), executor.ref_cleanup_calls()[0]);
        assert_eq!(ref_execution.request().order_gate_sequence(), 0);
        assert_eq!(ref_execution.request().cleanup_return_sequence(), 0);

        let passive = execution.passive_effects().unwrap();
        assert_eq!(passive.status(), PassiveEffectsFlushStatus::Flushed);
        assert!(passive.consumed_pending_passive());
        assert!(passive.did_execute_destroy_callbacks());
        assert!(!passive.public_effect_execution_enabled());
        assert!(!passive.public_act_compatibility_claimed());
        assert!(!passive.scheduler_driven_passive_execution_enabled());
        assert_eq!(passive.destroy_callback_executions().len(), 1);
        assert_eq!(passive.records().len(), 1);
        assert_eq!(
            passive.records()[0].unmount_origin(),
            Some(PendingPassiveUnmountOrigin::DeletedSubtree {
                nearest_mounted_ancestor: finished_work,
            })
        );
        assert_eq!(
            passive.records()[0].destroy_callback(),
            Some(fixture.passive_destroy)
        );
        assert!(passive.records()[0].destroy_callback_invoked());

        let passive_execution = passive.destroy_callback_executions()[0];
        assert_eq!(passive_execution.execution_order(), 0);
        assert_eq!(passive_execution.fiber(), fixture.deleted_function);
        assert_eq!(
            passive_execution.pending_order(),
            queued_passive.unmount_order()
        );
        assert_eq!(
            passive_execution.destroy_callback(),
            fixture.passive_destroy
        );
        assert_eq!(executor.destroy_calls()[0], passive_execution.request());

        let records = execution.records();
        assert_eq!(records.len(), 4);
        assert_eq!(
            records
                .iter()
                .map(|record| record.sequence())
                .collect::<Vec<_>>(),
            vec![0, 1, 2, 3]
        );
        assert_eq!(
            records
                .iter()
                .map(|record| record.phase())
                .collect::<Vec<_>>(),
            vec![
                HostRootDeletionCleanupOrderPhase::RefCleanupReturn,
                HostRootDeletionCleanupOrderPhase::PassiveDestroy,
                HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
                HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
            ]
        );
        assert_eq!(records[0].order_gate_sequence(), 0);
        assert_eq!(records[0].fiber(), fixture.deleted_host);
        assert_eq!(records[0].deleted_root(), fixture.deleted_host);
        assert_eq!(records[0].ref_cleanup_return_execution_order(), Some(0));
        assert_eq!(records[0].passive_destroy_execution_order(), None);
        assert_eq!(records[0].host_cleanup_sequence(), None);
        assert_eq!(records[1].order_gate_sequence(), 1);
        assert_eq!(records[1].fiber(), fixture.deleted_function);
        assert_eq!(records[1].deleted_root(), fixture.deleted_host);
        assert_eq!(records[1].ref_cleanup_return_execution_order(), None);
        assert_eq!(records[1].passive_destroy_execution_order(), Some(0));
        assert_eq!(records[1].host_cleanup_sequence(), None);
        assert_eq!(records[2].fiber(), fixture.deleted_text);
        assert_eq!(records[2].host_cleanup_sequence(), Some(0));
        assert_eq!(records[3].fiber(), fixture.deleted_host);
        assert_eq!(records[3].host_cleanup_sequence(), Some(1));

        assert!(
            store
                .root(root_id)
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
        assert!(
            !commit
                .host_node_deletion_cleanup_log()
                .public_unmount_compatibility_claimed()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    fn passive_effects_deleted_subtree_destroy_executor_rejects_non_deleted_unmounts() {
        let (mut store, root_id, host) = root_store();
        let previous_current = store.root(root_id).unwrap().current();
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(9_950),
            FiberTypeHandle::from_raw(9_951),
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(9_952),
                deps(9_953),
                Some(callback(9_954)),
            )
            .unwrap();

        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9_955),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(9_956),
            FiberTypeHandle::from_raw(9_951),
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(9_957),
                deps(9_958),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();
        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(queued.queued_unmount_count(), 1);
        assert_eq!(queued.queued_mount_count(), 1);
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut destroy_executor = RecordingDestroyExecutor::default();

        let error =
            flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary(
                &mut store,
                &commit,
                &mut destroy_executor,
            )
            .unwrap_err();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert!(matches!(
            error,
            PassiveEffectsFlushError::CommittedPassiveEffectRecordCountMismatch {
                root,
                expected_unmounts: 1,
                actual_unmounts: 0,
                expected_mounts: 1,
                actual_mounts: 0,
            } if root == root_id
        ));
        assert_eq!(destroy_executor.calls().len(), 0);
        assert_eq!(pending_passive.root(), Some(root_id));
        assert_eq!(pending_passive.finished_work(), Some(finished_work));
        assert_eq!(pending_passive.passive_unmounts().len(), 1);
        assert_eq!(pending_passive.passive_mounts().len(), 1);
        assert_eq!(
            pending_passive.passive_unmounts()[0].unmount_origin(),
            Some(PendingPassiveUnmountOrigin::UpdatedFiber)
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
    fn passive_effects_mount_create_executor_runs_mounts_in_flush_order_and_records_errors() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(910), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let function_fiber = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(911),
            FiberTypeHandle::from_raw(912),
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), function_fiber)
            .unwrap();
        assert_eq!(state.phase(), FunctionComponentHookRenderPhase::Mount);
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let first_registration = hook_store
            .mount_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(913),
                deps(914),
            )
            .unwrap();
        let second_registration = hook_store
            .mount_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(915),
                deps(916),
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(queued.records().len(), 2);
        assert_eq!(queued.queued_unmount_count(), 0);
        assert_eq!(queued.queued_mount_count(), 2);

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut mount_create_executor = RecordingMountCreateExecutor::default()
            .with_error(callback(913), mount_create_error(917))
            .with_returned_destroy(callback(915), Some(callback(918)));

        let flush = flush_passive_effects_after_commit_with_mount_create_executor(
            &mut store,
            &commit,
            std::slice::from_ref(&queued),
            &mut mount_create_executor,
        )
        .unwrap();

        assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
        assert!(flush.consumed_pending_passive());
        assert_eq!(flush.root(), root_id);
        assert_eq!(flush.finished_work(), Some(finished_work));
        assert_eq!(flush.lanes(), Lanes::DEFAULT);
        assert_eq!(flush.records().len(), 2);
        assert!(!flush.did_execute_destroy_callbacks());
        assert!(!flush.did_record_destroy_callback_errors());
        assert!(flush.destroy_callback_executions().is_empty());
        assert!(flush.destroy_callback_errors().is_empty());
        assert!(flush.did_execute_mount_create_callbacks());
        assert!(flush.did_record_mount_create_callback_errors());
        assert_eq!(flush.mount_create_callback_executions().len(), 2);
        assert_eq!(flush.mount_create_callback_errors().len(), 1);
        assert_eq!(
            flush.mount_create_callback_execution_gate_status(),
            PassiveEffectMountCreateCallbackExecutionGateStatus::TestControlOnly
        );
        assert_eq!(
            flush.mount_create_callback_execution_gate_blockers(),
            &PASSIVE_EFFECT_MOUNT_CREATE_CALLBACK_EXECUTION_GATE_BLOCKERS
        );
        assert!(!flush.public_effect_execution_enabled());
        assert!(!flush.public_act_compatibility_claimed());
        assert!(!flush.scheduler_driven_passive_execution_enabled());

        let first_mount = flush.records()[0];
        let second_mount = flush.records()[1];
        assert_eq!(first_mount.flush_index(), 0);
        assert_eq!(second_mount.flush_index(), 1);
        assert_eq!(first_mount.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(second_mount.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(
            first_mount.pending_order(),
            queued.records()[0].mount_order()
        );
        assert_eq!(
            second_mount.pending_order(),
            queued.records()[1].mount_order()
        );
        assert!(first_mount.pending_order() < second_mount.pending_order());
        assert_eq!(first_mount.fiber(), function_fiber);
        assert_eq!(second_mount.fiber(), function_fiber);
        assert_eq!(first_mount.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(second_mount.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(first_mount.effect_index(), Some(0));
        assert_eq!(second_mount.effect_index(), Some(1));
        assert_eq!(first_mount.effect(), Some(first_registration.effect()));
        assert_eq!(second_mount.effect(), Some(second_registration.effect()));
        assert_eq!(
            first_mount.effect_instance(),
            Some(first_registration.instance())
        );
        assert_eq!(
            second_mount.effect_instance(),
            Some(second_registration.instance())
        );
        assert_eq!(first_mount.create_callback(), Some(callback(913)));
        assert_eq!(second_mount.create_callback(), Some(callback(915)));
        assert_eq!(first_mount.destroy_callback(), None);
        assert_eq!(second_mount.destroy_callback(), None);
        assert!(first_mount.create_callback_invoked());
        assert!(second_mount.create_callback_invoked());
        assert!(!first_mount.destroy_callback_invoked());
        assert!(!second_mount.destroy_callback_invoked());
        assert_eq!(first_mount.unmount_origin(), None);
        assert_eq!(second_mount.unmount_origin(), None);

        let first_execution = flush.mount_create_callback_executions()[0];
        let second_execution = flush.mount_create_callback_executions()[1];
        assert_eq!(first_execution.execution_order(), 0);
        assert_eq!(second_execution.execution_order(), 1);
        assert_eq!(first_execution.flush_index(), first_mount.flush_index());
        assert_eq!(second_execution.flush_index(), second_mount.flush_index());
        assert_eq!(first_execution.root(), root_id);
        assert_eq!(second_execution.root(), root_id);
        assert_eq!(first_execution.finished_work(), finished_work);
        assert_eq!(second_execution.finished_work(), finished_work);
        assert_eq!(first_execution.committed_lanes(), Lanes::DEFAULT);
        assert_eq!(second_execution.committed_lanes(), Lanes::DEFAULT);
        assert_eq!(first_execution.fiber(), function_fiber);
        assert_eq!(second_execution.fiber(), function_fiber);
        assert_eq!(first_execution.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(second_execution.effect_lanes(), Lanes::DEFAULT);
        assert_eq!(first_execution.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(second_execution.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(first_execution.pending_order(), first_mount.pending_order());
        assert_eq!(
            second_execution.pending_order(),
            second_mount.pending_order()
        );
        assert_eq!(first_execution.effect_index(), Some(0));
        assert_eq!(second_execution.effect_index(), Some(1));
        assert_eq!(first_execution.effect(), Some(first_registration.effect()));
        assert_eq!(
            second_execution.effect(),
            Some(second_registration.effect())
        );
        assert_eq!(
            first_execution.effect_instance(),
            Some(first_registration.instance())
        );
        assert_eq!(
            second_execution.effect_instance(),
            Some(second_registration.instance())
        );
        assert_eq!(first_execution.create_callback(), callback(913));
        assert_eq!(second_execution.create_callback(), callback(915));
        assert_eq!(first_execution.returned_destroy(), None);
        assert_eq!(second_execution.returned_destroy(), Some(callback(918)));
        assert_eq!(mount_create_executor.calls()[0], first_execution.request());
        assert_eq!(mount_create_executor.calls()[1], second_execution.request());

        let error = flush.mount_create_callback_errors()[0];
        assert_eq!(error.execution(), first_execution);
        assert_eq!(error.error(), mount_create_error(917));
        assert!(error.error().is_some());
        assert!(!error.error().is_none());
        assert_eq!(error.error().raw(), 917);

        assert_eq!(
            hook_store
                .hook_effects()
                .get_instance(first_registration.instance())
                .unwrap()
                .destroy(),
            None
        );
        assert_eq!(
            hook_store
                .hook_effects()
                .get_instance(second_registration.instance())
                .unwrap()
                .destroy(),
            None
        );
        assert!(
            store
                .root(root_id)
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
    fn passive_effects_callback_executor_errors_preserve_cross_phase_order_and_block_root_errors() {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(
                FakeContainer::new(1),
                RootOptions::new()
                    .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(1001))
                    .with_on_caught_error(RootErrorCallbackHandle::from_raw(1002))
                    .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(1003)),
            )
            .unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(1004);
        let current_function = append_function_component_child(
            &mut store,
            previous_current,
            PropsHandle::from_raw(1005),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(1006),
                deps(1007),
                Some(callback(1008)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(1009), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(1010),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), finished_function)
            .unwrap();
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        let registration = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(1011),
                deps(1012),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let queued = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(queued.queued_unmount_count(), 1);
        assert_eq!(queued.queued_mount_count(), 1);
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut destroy_executor =
            RecordingDestroyExecutor::with_error(callback(1008), destroy_error(1013));
        let mut mount_create_executor = RecordingMountCreateExecutor::default()
            .with_error(callback(1011), mount_create_error(1014));

        let flush = flush_passive_effects_after_commit_with_callback_executors(
            &mut store,
            &commit,
            std::slice::from_ref(&queued),
            &mut destroy_executor,
            &mut mount_create_executor,
        )
        .unwrap();

        assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
        assert_eq!(flush.records().len(), 2);
        assert_eq!(flush.destroy_callback_errors().len(), 1);
        assert_eq!(flush.mount_create_callback_errors().len(), 1);
        assert!(flush.did_record_callback_execution_errors());
        assert!(flush.did_schedule_root_error_captures());
        assert!(flush.did_record_root_error_routing());
        assert!(flush.did_record_blocked_root_error_propagation());
        assert!(!flush.public_effect_execution_enabled());
        assert!(!flush.public_act_compatibility_claimed());
        assert!(!flush.scheduler_driven_passive_execution_enabled());

        let root_error = flush.root_error_propagation().unwrap();
        assert_eq!(root_error.root(), root_id);
        let root_error_callbacks = root_error.error_option_callbacks();
        assert_eq!(root_error_callbacks.root(), root_id);
        assert_eq!(
            root_error_callbacks.phase(),
            RootErrorOptionCallbackPhase::Commit
        );
        assert_eq!(
            root_error.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(1001)
        );
        assert_eq!(
            root_error.on_caught_error(),
            RootErrorCallbackHandle::from_raw(1002)
        );
        assert_eq!(
            root_error.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(1003)
        );
        assert_eq!(
            root_error.status(),
            PassiveEffectRootErrorPropagationStatus::CapturedForRootUpdate
        );
        assert_eq!(
            root_error.blockers(),
            &PASSIVE_EFFECT_ROOT_ERROR_CALLBACK_BLOCKERS
        );
        assert!(root_error.has_configured_error_callback());
        assert!(root_error.root_error_update_scheduled());
        assert_eq!(root_error.scheduled_root_error_count(), 2);
        assert!(!root_error.root_error_callbacks_invoked());
        assert!(!root_error.public_error_boundaries_enabled());
        assert!(!root_error.public_act_error_aggregation_enabled());
        assert!(!root_error.recoverable_error_compatibility_claimed());
        assert!(!root_error_callbacks.root_error_callbacks_invoked());
        assert!(!root_error_callbacks.public_error_boundaries_enabled());
        assert!(!root_error_callbacks.recoverable_error_compatibility_claimed());

        let errors = flush.callback_execution_errors();
        let captures = flush.root_error_captures();
        let routing = flush.root_error_routing();
        assert_eq!(errors.len(), 2);
        assert_eq!(captures.len(), 2);
        assert_eq!(routing.len(), 2);
        assert_eq!(errors[0].error_order(), 0);
        assert_eq!(errors[1].error_order(), 1);
        assert_eq!(captures[0].capture_order(), 0);
        assert_eq!(captures[1].capture_order(), 1);
        assert_eq!(routing[0].routing_order(), 0);
        assert_eq!(routing[1].routing_order(), 1);
        assert_eq!(
            errors[0].kind(),
            PassiveEffectCallbackExecutionErrorKind::Destroy
        );
        assert_eq!(errors[0].kind().phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(
            errors[1].kind(),
            PassiveEffectCallbackExecutionErrorKind::MountCreate
        );
        assert_eq!(errors[1].kind().phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(errors[0].phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(errors[1].phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(errors[0].flush_index(), 0);
        assert_eq!(errors[1].flush_index(), 1);
        assert_eq!(
            errors[0].pending_order(),
            queued.records()[0].unmount_order().unwrap()
        );
        assert_eq!(errors[1].pending_order(), queued.records()[0].mount_order());
        assert!(errors[0].pending_order() < errors[1].pending_order());
        assert_eq!(errors[0].root(), root_id);
        assert_eq!(errors[1].root(), root_id);
        assert_eq!(errors[0].finished_work(), finished_work);
        assert_eq!(errors[1].finished_work(), finished_work);
        assert_eq!(errors[0].committed_lanes(), Lanes::DEFAULT);
        assert_eq!(errors[1].committed_lanes(), Lanes::DEFAULT);
        assert_eq!(errors[0].fiber(), finished_function);
        assert_eq!(errors[1].fiber(), finished_function);
        assert_eq!(errors[0].effect_lanes(), Lanes::DEFAULT);
        assert_eq!(errors[1].effect_lanes(), Lanes::DEFAULT);
        assert_eq!(errors[0].effect_index(), Some(0));
        assert_eq!(errors[1].effect_index(), Some(0));
        assert_eq!(errors[0].effect(), Some(registration.effect()));
        assert_eq!(errors[1].effect(), Some(registration.effect()));
        assert_eq!(errors[0].effect_instance(), Some(previous.instance()));
        assert_eq!(errors[1].effect_instance(), Some(registration.instance()));
        assert_eq!(errors[0].callback(), callback(1008));
        assert_eq!(errors[1].callback(), callback(1011));
        assert_eq!(
            errors[0].error(),
            PassiveEffectCallbackExecutionErrorHandle::Destroy(destroy_error(1013))
        );
        assert_eq!(
            errors[1].error(),
            PassiveEffectCallbackExecutionErrorHandle::MountCreate(mount_create_error(1014))
        );
        assert!(errors[0].error().is_some());
        assert!(!errors[0].error().is_none());
        assert!(errors[1].error().is_some());
        assert_eq!(errors[0].root_error_propagation(), root_error);
        assert_eq!(errors[1].root_error_propagation(), root_error);
        assert_eq!(errors[0].root_error_capture(), captures[0]);
        assert_eq!(errors[1].root_error_capture(), captures[1]);
        assert_eq!(errors[0].root_error_routing(), routing[0]);
        assert_eq!(errors[1].root_error_routing(), routing[1]);
        assert_eq!(
            captures[0].kind(),
            PassiveEffectCallbackExecutionErrorKind::Destroy
        );
        assert_eq!(
            captures[1].kind(),
            PassiveEffectCallbackExecutionErrorKind::MountCreate
        );
        assert_eq!(captures[0].root(), root_id);
        assert_eq!(captures[1].root(), root_id);
        assert_eq!(captures[0].finished_work(), finished_work);
        assert_eq!(captures[1].finished_work(), finished_work);
        assert_eq!(captures[0].committed_lanes(), Lanes::DEFAULT);
        assert_eq!(captures[1].committed_lanes(), Lanes::DEFAULT);
        assert_eq!(captures[0].fiber(), finished_function);
        assert_eq!(captures[1].fiber(), finished_function);
        assert_eq!(captures[0].effect_lanes(), Lanes::DEFAULT);
        assert_eq!(captures[1].effect_lanes(), Lanes::DEFAULT);
        assert_eq!(captures[0].phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(captures[1].phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(captures[0].pending_order(), errors[0].pending_order());
        assert_eq!(captures[1].pending_order(), errors[1].pending_order());
        assert_eq!(captures[0].flush_index(), 0);
        assert_eq!(captures[1].flush_index(), 1);
        assert_eq!(captures[0].effect_index(), Some(0));
        assert_eq!(captures[1].effect_index(), Some(0));
        assert_eq!(captures[0].effect(), Some(registration.effect()));
        assert_eq!(captures[1].effect(), Some(registration.effect()));
        assert_eq!(captures[0].effect_instance(), Some(previous.instance()));
        assert_eq!(captures[1].effect_instance(), Some(registration.instance()));
        assert_eq!(captures[0].callback(), callback(1008));
        assert_eq!(captures[1].callback(), callback(1011));
        assert_eq!(
            captures[0].error(),
            PassiveEffectCallbackExecutionErrorHandle::Destroy(destroy_error(1013))
        );
        assert_eq!(
            captures[1].error(),
            PassiveEffectCallbackExecutionErrorHandle::MountCreate(mount_create_error(1014))
        );
        assert!(captures[0].root_error_update_scheduled());
        assert!(captures[1].root_error_update_scheduled());
        assert!(!captures[0].root_error_callbacks_invoked());
        assert!(!captures[1].root_error_callbacks_invoked());
        assert!(!captures[0].public_act_error_aggregation_enabled());
        assert!(!captures[1].public_act_error_aggregation_enabled());
        assert!(captures[0].has_configured_error_callback());
        assert!(captures[1].has_configured_error_callback());
        assert_eq!(captures[0].error_option_callbacks(), root_error_callbacks);
        assert_eq!(captures[1].error_option_callbacks(), root_error_callbacks);
        assert_eq!(
            captures[0].on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(1001)
        );
        assert_eq!(
            captures[1].on_caught_error(),
            RootErrorCallbackHandle::from_raw(1002)
        );
        assert_eq!(
            captures[0].on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(1003)
        );
        assert_eq!(
            routing[0].kind(),
            PassiveEffectCallbackExecutionErrorKind::Destroy
        );
        assert_eq!(
            routing[1].kind(),
            PassiveEffectCallbackExecutionErrorKind::MountCreate
        );
        assert_eq!(routing[0].root(), root_id);
        assert_eq!(routing[1].root(), root_id);
        assert_eq!(routing[0].finished_work(), finished_work);
        assert_eq!(routing[1].finished_work(), finished_work);
        assert_eq!(routing[0].committed_lanes(), Lanes::DEFAULT);
        assert_eq!(routing[1].committed_lanes(), Lanes::DEFAULT);
        assert_eq!(routing[0].fiber(), finished_function);
        assert_eq!(routing[1].fiber(), finished_function);
        assert_eq!(routing[0].effect_lanes(), Lanes::DEFAULT);
        assert_eq!(routing[1].effect_lanes(), Lanes::DEFAULT);
        assert_eq!(routing[0].phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(routing[1].phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(routing[0].pending_order(), errors[0].pending_order());
        assert_eq!(routing[1].pending_order(), errors[1].pending_order());
        assert_eq!(routing[0].flush_index(), 0);
        assert_eq!(routing[1].flush_index(), 1);
        assert_eq!(routing[0].effect_index(), Some(0));
        assert_eq!(routing[1].effect_index(), Some(0));
        assert_eq!(routing[0].effect(), Some(registration.effect()));
        assert_eq!(routing[1].effect(), Some(registration.effect()));
        assert_eq!(routing[0].effect_instance(), Some(previous.instance()));
        assert_eq!(routing[1].effect_instance(), Some(registration.instance()));
        assert_eq!(routing[0].callback(), callback(1008));
        assert_eq!(routing[1].callback(), callback(1011));
        assert_eq!(
            routing[0].error(),
            PassiveEffectCallbackExecutionErrorHandle::Destroy(destroy_error(1013))
        );
        assert_eq!(
            routing[1].error(),
            PassiveEffectCallbackExecutionErrorHandle::MountCreate(mount_create_error(1014))
        );
        assert_eq!(routing[0].root_error_capture(), captures[0]);
        assert_eq!(routing[1].root_error_capture(), captures[1]);
        assert_eq!(routing[0].root_error_propagation(), root_error);
        assert_eq!(routing[1].root_error_propagation(), root_error);
        assert_eq!(routing[0].error_option_callbacks(), root_error_callbacks);
        assert_eq!(routing[1].error_option_callbacks(), root_error_callbacks);
        assert_eq!(
            routing[0].status(),
            PassiveEffectRootErrorRoutingStatus::CapturedForRootUpdate
        );
        assert_eq!(
            routing[1].status(),
            PassiveEffectRootErrorRoutingStatus::CapturedForRootUpdate
        );
        assert!(routing[0].root_error_update_scheduled());
        assert!(routing[1].root_error_update_scheduled());
        assert!(!routing[0].root_error_callbacks_invoked());
        assert!(!routing[1].root_error_callbacks_invoked());
        assert!(!routing[0].public_error_boundaries_enabled());
        assert!(!routing[1].public_error_boundaries_enabled());
        assert!(!routing[0].public_act_error_aggregation_enabled());
        assert!(!routing[1].public_act_error_aggregation_enabled());
        assert!(!routing[0].recoverable_error_compatibility_claimed());
        assert!(!routing[1].recoverable_error_compatibility_claimed());
        assert!(routing[0].has_configured_error_callback());
        assert!(routing[1].has_configured_error_callback());
        assert_eq!(
            routing[0].on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(1001)
        );
        assert_eq!(
            routing[1].on_caught_error(),
            RootErrorCallbackHandle::from_raw(1002)
        );
        assert_eq!(
            routing[0].on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(1003)
        );
        let first_schedule = captures[0].schedule();
        let second_schedule = captures[1].schedule();
        assert_eq!(routing[0].schedule(), first_schedule);
        assert_eq!(routing[1].schedule(), second_schedule);
        assert_eq!(
            first_schedule.source(),
            RootErrorCaptureSource::PassiveEffectDestroy
        );
        assert_eq!(
            second_schedule.source(),
            RootErrorCaptureSource::PassiveEffectMountCreate
        );
        assert_eq!(first_schedule.root(), root_id);
        assert_eq!(second_schedule.root(), root_id);
        assert_eq!(first_schedule.root_fiber(), finished_work);
        assert_eq!(second_schedule.root_fiber(), finished_work);
        assert_eq!(first_schedule.source_fiber(), finished_function);
        assert_eq!(second_schedule.source_fiber(), finished_function);
        assert_eq!(first_schedule.lane(), Lane::SYNC);
        assert_eq!(second_schedule.lane(), Lane::SYNC);
        assert_eq!(first_schedule.pending_lanes_before(), Lanes::NO);
        assert!(
            first_schedule
                .pending_lanes_after()
                .contains_lane(Lane::SYNC)
        );
        assert!(
            second_schedule
                .pending_lanes_before()
                .contains_lane(Lane::SYNC)
        );
        assert!(
            second_schedule
                .pending_lanes_after()
                .contains_lane(Lane::SYNC)
        );
        assert_eq!(
            first_schedule.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(1001)
        );
        assert_eq!(
            second_schedule.on_caught_error(),
            RootErrorCallbackHandle::from_raw(1002)
        );
        assert_eq!(
            first_schedule.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(1003)
        );
        assert!(first_schedule.root_error_update_scheduled());
        assert!(second_schedule.root_error_update_scheduled());
        assert!(!first_schedule.root_error_callbacks_invoked());
        assert!(!second_schedule.root_error_callbacks_invoked());
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::SYNC
        );

        assert_eq!(destroy_executor.calls().len(), 1);
        assert_eq!(mount_create_executor.calls().len(), 1);
        assert!(flush.records()[0].destroy_callback_invoked());
        assert!(flush.records()[1].create_callback_invoked());
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
    fn passive_effects_flush_consumes_empty_handoff_without_records() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(30), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(root_id, Lanes::NO);
        let commit = commit_finished_host_root(&mut store, render).unwrap();

        let flush = flush_passive_effects_after_commit(&mut store, &commit).unwrap();

        assert_eq!(flush.status(), PassiveEffectsFlushStatus::Flushed);
        assert!(flush.consumed_pending_passive());
        assert!(!flush.did_flush_records());
        assert_eq!(flush.finished_work(), Some(finished_work));
        assert_eq!(flush.lanes(), Lanes::DEFAULT);
        assert!(flush.records().is_empty());
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
    fn passive_effects_observes_post_passive_sync_flush_gate_without_consuming_handoff() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let passive_root = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let continuation_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let continuation_current = store.root(continuation_root).unwrap().current();
        update_container(
            &mut store,
            passive_root,
            RootElementHandle::from_raw(60),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, passive_root, Lanes::DEFAULT).unwrap();
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
            .queue_mount(finished_work, Lanes::DEFAULT)
            .unwrap();
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        schedule_sync_update(
            &mut store,
            continuation_root,
            RootElementHandle::from_raw(61),
        );
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let gate = observe_sync_flush_post_passive_continuation_execution_gate_after_commit(
            &mut store,
            &commit,
            &ExecutionContextState::new(),
        )
        .unwrap()
        .unwrap();

        assert_eq!(gate.exit_status(), RootSyncFlushExitStatus::Completed);
        assert_eq!(gate.pending_passive_root(), passive_root);
        assert_eq!(gate.pending_passive_finished_work(), finished_work);
        assert_eq!(gate.pending_passive_lanes(), Lanes::DEFAULT);
        assert_eq!(gate.pending_passive_unmount_count(), 0);
        assert_eq!(gate.pending_passive_mount_count(), 1);
        assert_eq!(gate.pending_passive_record_count(), 1);
        assert_eq!(gate.continuation_roots().len(), 1);
        assert_eq!(gate.continuation_roots()[0].root(), continuation_root);
        assert_eq!(gate.continuation_roots()[0].lanes(), Lanes::SYNC);
        let pending_passive = store
            .root(passive_root)
            .unwrap()
            .scheduling()
            .pending_passive();
        assert_eq!(pending_passive.finished_work(), Some(finished_work));
        assert!(pending_passive.has_commit_handoff());
        assert_eq!(pending_passive.passive_mounts().len(), 1);
        assert_eq!(
            store.root(continuation_root).unwrap().current(),
            continuation_current
        );
        assert_eq!(store.root(continuation_root).unwrap().finished_work(), None);
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
    fn passive_effects_flush_executes_private_post_passive_sync_flush_continuation() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let passive_root = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let continuation_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let continuation_element = RootElementHandle::from_raw(65);
        update_container(
            &mut store,
            passive_root,
            RootElementHandle::from_raw(64),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, passive_root, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        {
            let scheduling = store.root_mut(passive_root).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(passive_root, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::DEFAULT)
                .unwrap();
        }
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        schedule_sync_update(&mut store, continuation_root, continuation_element);
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

        let result = flush_passive_effects_after_commit_and_sync_flush_continuation(
            &mut store,
            &commit,
            &ExecutionContextState::new(),
        )
        .unwrap();

        let passive = result.passive_effects();
        assert_eq!(passive.status(), PassiveEffectsFlushStatus::Flushed);
        assert!(passive.consumed_pending_passive());
        assert_eq!(passive.root(), passive_root);
        assert_eq!(passive.finished_work(), Some(finished_work));
        assert_eq!(passive.lanes(), Lanes::DEFAULT);
        assert_eq!(passive.records().len(), 1);
        assert_eq!(
            passive.records()[0].phase(),
            PendingPassiveEffectPhase::Mount
        );
        assert!(!passive.records()[0].create_callback_invoked());
        assert!(!passive.records()[0].destroy_callback_invoked());

        let continuation = result.sync_flush_continuation().unwrap();
        assert!(result.did_request_follow_up_sync_flush());
        assert!(continuation.did_execute_follow_up_sync_flush());
        assert!(result.did_flush_follow_up_sync_work());
        assert_eq!(
            continuation.gate().exit_status(),
            RootSyncFlushExitStatus::Completed
        );
        assert!(continuation.gate().should_execute_follow_up_sync_flush());
        assert_eq!(continuation.gate().pending_passive_root(), passive_root);
        assert_eq!(
            continuation.gate().pending_passive_finished_work(),
            finished_work
        );
        assert_eq!(continuation.gate().pending_passive_lanes(), Lanes::DEFAULT);
        assert_eq!(continuation.gate().continuation_roots().len(), 1);
        assert_eq!(
            continuation.gate().continuation_roots()[0].root(),
            continuation_root
        );
        assert_eq!(
            continuation.gate().continuation_roots()[0].lanes(),
            Lanes::SYNC
        );

        let sync_flush = continuation.sync_flush_result().unwrap();
        assert!(sync_flush.did_flush_work());
        assert_eq!(sync_flush.records().len(), 1);
        assert_eq!(sync_flush.records()[0].root(), continuation_root);
        assert_eq!(sync_flush.records()[0].render_lanes(), Lanes::SYNC);
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
    fn passive_effects_flush_records_blocked_post_passive_sync_flush_without_committing() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let passive_root = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let continuation_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let continuation_current = store.root(continuation_root).unwrap().current();
        update_container(
            &mut store,
            passive_root,
            RootElementHandle::from_raw(66),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, passive_root, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        {
            let scheduling = store.root_mut(passive_root).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(passive_root, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::DEFAULT)
                .unwrap();
        }
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        schedule_sync_update(
            &mut store,
            continuation_root,
            RootElementHandle::from_raw(67),
        );
        let mut execution_context = ExecutionContextState::new();

        let result = execution_context
            .with_commit_context(|execution_context| {
                flush_passive_effects_after_commit_and_sync_flush_continuation(
                    &mut store,
                    &commit,
                    execution_context,
                )
            })
            .unwrap();

        assert_eq!(
            result.passive_effects().status(),
            PassiveEffectsFlushStatus::Flushed
        );
        assert!(result.passive_effects().consumed_pending_passive());
        let continuation = result.sync_flush_continuation().unwrap();
        assert!(!result.did_request_follow_up_sync_flush());
        assert!(!continuation.did_execute_follow_up_sync_flush());
        assert!(!result.did_flush_follow_up_sync_work());
        assert_eq!(
            continuation.gate().exit_status(),
            RootSyncFlushExitStatus::BlockedByExecutionContext
        );
        assert!(
            continuation
                .gate()
                .execution_context()
                .blocked_by_render_or_commit()
        );
        assert!(continuation.gate().continuation_roots().is_empty());
        assert_eq!(
            store.root(continuation_root).unwrap().current(),
            continuation_current
        );
        assert!(
            store
                .root(passive_root)
                .unwrap()
                .scheduling()
                .pending_passive()
                .is_empty()
        );
        assert!(store.root_scheduler().might_have_pending_sync_work());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn passive_effects_post_passive_sync_flush_gate_requires_passive_handoff() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let host = RecordingHost::default();
        let passive_root = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let continuation_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        update_container(
            &mut store,
            passive_root,
            RootElementHandle::from_raw(62),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, passive_root, Lanes::DEFAULT).unwrap();
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        schedule_sync_update(
            &mut store,
            continuation_root,
            RootElementHandle::from_raw(63),
        );

        let gate = observe_sync_flush_post_passive_continuation_execution_gate_after_commit(
            &mut store,
            &commit,
            &ExecutionContextState::new(),
        )
        .unwrap();

        assert_eq!(gate, None);
        assert!(
            store
                .root(passive_root)
                .unwrap()
                .scheduling()
                .pending_passive()
                .is_empty()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn passive_effects_flush_rejects_cleared_handoff_without_side_effects() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(40), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(root_id, Lanes::NO);
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .clear_pending_passive();

        let error = flush_passive_effects_after_commit(&mut store, &commit).unwrap_err();

        assert!(matches!(
            error,
            PassiveEffectsFlushError::PendingPassiveRootMismatch {
                commit_root,
                pending_root: None,
            } if commit_root == root_id
        ));
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
    fn passive_effects_flush_rejects_mismatched_pending_lanes_before_consuming() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(50), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(root_id, Lanes::NO);
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let finished_work = commit.finished_work();

        {
            let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(root_id, Lanes::SYNC);
            assert!(scheduling.pending_passive_mut().record_commit_handoff(
                root_id,
                finished_work,
                Lanes::SYNC
            ));
        }

        let error = flush_passive_effects_after_commit(&mut store, &commit).unwrap_err();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert!(matches!(
            error,
            PassiveEffectsFlushError::PendingPassiveLanesMismatch {
                root,
                expected,
                actual,
            } if root == root_id && expected == Lanes::DEFAULT && actual == Lanes::SYNC
        ));
        assert_eq!(pending_passive.root(), Some(root_id));
        assert_eq!(pending_passive.finished_work(), Some(finished_work));
        assert_eq!(pending_passive.lanes(), Lanes::SYNC);
        assert!(pending_passive.has_commit_handoff());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn passive_effects_flush_rejects_pending_record_count_drift_before_consuming() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(51), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        {
            let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
            scheduling.prepare_pending_passive(root_id, Lanes::NO);
            scheduling
                .pending_passive_mut()
                .queue_mount(finished_work, Lanes::DEFAULT)
                .unwrap();
        }
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        assert_eq!(
            commit
                .pending_passive_handoff()
                .unwrap()
                .pending_mount_count(),
            1
        );
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .pending_passive_mut()
            .queue_mount(finished_work, Lanes::DEFAULT)
            .unwrap();

        let error = flush_passive_effects_after_commit(&mut store, &commit).unwrap_err();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert!(matches!(
            error,
            PassiveEffectsFlushError::PendingPassiveRecordCountMismatch {
                root,
                expected_unmounts: 0,
                actual_unmounts: 0,
                expected_mounts: 1,
                actual_mounts: 2,
            } if root == root_id
        ));
        assert_eq!(pending_passive.passive_mounts().len(), 2);
        assert!(pending_passive.has_commit_handoff());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }
}
