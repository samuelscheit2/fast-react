//! Private passive-effects flush skeleton.
//!
//! This module consumes the accepted pending passive metadata as deterministic
//! data. The default flush path remains metadata-only; a crate-private,
//! test-controlled destroy executor can consume accepted destroy callback
//! handles. This module does not traverse hook rings, invoke create callbacks,
//! schedule public `act`/`flushSync` work, mutate host output, or expose a
//! renderer public API.

#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    FiberId, HookEffectCallbackHandle, HookEffectId, HookEffectInstanceId, Lanes,
};
use fast_react_host_config::HostTypes;

use crate::root_commit::{
    FunctionComponentPendingPassiveCommitHandoff,
    FunctionComponentPendingPassiveEffectPhaseCommitRecord, PendingPassiveCommitHandoff,
};
use crate::root_config::{
    PendingPassiveEffectOrder, PendingPassiveEffectPhase, PendingPassiveState,
    PendingPassiveUnmountOrigin,
};
use crate::root_scheduler::{
    SyncFlushPostPassiveContinuationExecutionGateRecord,
    sync_flush_post_passive_continuation_execution_gate,
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
        false
    }

    #[must_use]
    pub const fn destroy_callback_invoked(self) -> bool {
        self.destroy_invoked
    }

    fn mark_destroy_callback_invoked(&mut self) {
        self.destroy_invoked = true;
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
        false
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct PassiveEffectsFlushResult {
    root: FiberRootId,
    finished_work: Option<FiberId>,
    lanes: Lanes,
    status: PassiveEffectsFlushStatus,
    records: Vec<PassiveEffectFlushRecord>,
    destroy_callback_executions: Vec<PassiveEffectDestroyCallbackExecutionRecord>,
    destroy_callback_errors: Vec<PassiveEffectDestroyCallbackErrorRecord>,
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
    pub fn destroy_callback_executions(&self) -> &[PassiveEffectDestroyCallbackExecutionRecord] {
        &self.destroy_callback_executions
    }

    #[must_use]
    pub fn destroy_callback_errors(&self) -> &[PassiveEffectDestroyCallbackErrorRecord] {
        &self.destroy_callback_errors
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
    pub const fn consumed_pending_passive(&self) -> bool {
        matches!(self.status, PassiveEffectsFlushStatus::Flushed)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum PassiveEffectsFlushError {
    FiberRootStore(FiberRootStoreError),
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
}

impl Display for PassiveEffectsFlushError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
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
        }
    }
}

impl Error for PassiveEffectsFlushError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::PendingPassiveRootMismatch { .. }
            | Self::PendingPassiveFinishedWorkMismatch { .. }
            | Self::PendingPassiveLanesMismatch { .. }
            | Self::PendingPassiveRecordCountMismatch { .. }
            | Self::PendingPassiveEffectHandoffRootMismatch { .. }
            | Self::PendingPassiveEffectHandoffLanesMismatch { .. }
            | Self::PendingPassiveEffectHandoffRecordCountMismatch { .. }
            | Self::PendingPassiveEffectHandoffDuplicateOrder { .. }
            | Self::PendingPassiveEffectHandoffRecordMismatch { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for PassiveEffectsFlushError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

pub(crate) fn flush_passive_effects_after_commit<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
) -> Result<PassiveEffectsFlushResult, PassiveEffectsFlushError> {
    flush_passive_effects_after_commit_inner(store, commit, None, None)
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
    flush_passive_effects_after_commit_inner(store, commit, Some(function_component_handoffs), None)
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
        Some(function_component_handoffs),
        Some(destroy_executor),
    )
}

fn flush_passive_effects_after_commit_inner<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    function_component_handoffs: Option<&[FunctionComponentPendingPassiveCommitHandoff]>,
    destroy_executor: Option<&mut dyn PassiveEffectDestroyCallbackExecutor>,
) -> Result<PassiveEffectsFlushResult, PassiveEffectsFlushError> {
    let root_id = commit.root();
    let Some(handoff) = commit.pending_passive_handoff() else {
        return Ok(PassiveEffectsFlushResult {
            root: root_id,
            finished_work: None,
            lanes: Lanes::NO,
            status: PassiveEffectsFlushStatus::NoPendingPassive,
            records: Vec::new(),
            destroy_callback_executions: Vec::new(),
            destroy_callback_errors: Vec::new(),
        });
    };

    let pending_passive = store.root(root_id)?.scheduling().pending_passive().clone();
    validate_pending_passive_handoff(handoff, &pending_passive)?;
    let effect_records = match function_component_handoffs {
        Some(handoffs) => {
            validate_function_component_passive_handoffs(handoff, &pending_passive, handoffs)?
        }
        None => Vec::new(),
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

    Ok(PassiveEffectsFlushResult {
        root: root_id,
        finished_work: Some(handoff.finished_work()),
        lanes: handoff.lanes(),
        status: PassiveEffectsFlushStatus::Flushed,
        records,
        destroy_callback_executions,
        destroy_callback_errors,
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

    let actual_unmounts = pending_passive.passive_unmounts().len();
    let actual_mounts = pending_passive.passive_mounts().len();
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

    for record in records {
        if record.phase() != PendingPassiveEffectPhase::Unmount {
            continue;
        }

        let Some(destroy) = record.destroy_callback() else {
            continue;
        };
        if destroy.is_none() {
            continue;
        }

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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::function_component::{
        FunctionComponentEffectDependencyStatus, FunctionComponentEffectPhase,
        FunctionComponentHookRenderPhase, FunctionComponentHookRenderStore,
    };
    use crate::root_commit::queue_function_component_pending_passive_effects;
    use crate::root_config::PendingPassiveUnmountOrigin;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{
        RootElementHandle, RootOptions, RootSyncFlushExitStatus, commit_finished_host_root,
        ensure_root_is_scheduled, render_host_root_for_lanes, update_container,
        update_container_sync,
    };
    use fast_react_core::{
        DependenciesHandle, FiberTag, FiberTypeHandle, HookEffectCallbackHandle,
        HookEffectDependencies, PropsHandle,
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

    fn callback(raw: u64) -> HookEffectCallbackHandle {
        HookEffectCallbackHandle::from_raw(raw)
    }

    fn destroy_error(raw: u64) -> PassiveEffectDestroyCallbackErrorHandle {
        PassiveEffectDestroyCallbackErrorHandle::from_raw(raw)
    }

    fn deps(raw: u64) -> HookEffectDependencies {
        HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
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
