//! Minimal HostRoot current-switch commit foundation.
//!
//! This module consumes a completed HostRoot render-phase record and switches
//! `root.current` to that HostRoot work-in-progress fiber. It deliberately
//! stops before host mutation, child/effect traversal, callback execution,
//! deletion cleanup, public facade behavior, DOM wiring, or test-renderer
//! serialization.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    DeletionListId, FiberArena, FiberFlags, FiberId, FiberTag, FiberTopologyError,
    HookEffectCallbackHandle, HookEffectId, HookEffectInstanceId, Lanes, PropsHandle, RefHandle,
    RootFinishedLanes, StateHandle, StateNodeHandle, UpdateQueueHandle,
};
use fast_react_host_config::{HostFiberTokenPhase, HostFiberTokenTarget, HostTypes};

use crate::function_component::{
    FunctionComponentHookRenderPhase, FunctionComponentHookRenderState,
    FunctionComponentHookRenderStore, FunctionComponentPassiveEffectMetadata,
};
use crate::root_config::{
    PendingPassiveEffectOrder, PendingPassiveEffectPhase, PendingPassiveUnmountOrigin,
};
use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostFiberTokenId,
    HostFiberTokenValidationError, HostRootRenderPhaseRecord, HostRootStateStoreError,
    RootRenderExitStatus, RootSchedulingState, RootUpdateCallbackSnapshot, UpdateQueueError,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RootCommitError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    HostRootStateStore(HostRootStateStoreError),
    HostFiberToken(HostFiberTokenValidationError),
    UpdateQueue(UpdateQueueError),
    FunctionComponentRender {
        fiber: FiberId,
        message: String,
    },
    PendingPassiveRootMismatch {
        root: FiberRootId,
        pending_root: FiberRootId,
    },
    PendingPassiveAlreadyCommitted {
        root: FiberRootId,
        finished_work: FiberId,
    },
    PendingPassiveQueueRejected {
        root: FiberRootId,
        fiber: FiberId,
        effect: HookEffectId,
        phase: PendingPassiveEffectPhase,
        lanes: Lanes,
    },
    ExpectedFunctionComponentPassiveEffectFiber {
        root: FiberRootId,
        fiber: FiberId,
        tag: FiberTag,
    },
    RefHostInstanceMissing {
        root: FiberRootId,
        fiber: FiberId,
    },
    EmptyFinishedLanes {
        root: FiberRootId,
    },
    CurrentMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: FiberId,
    },
    FinishedWorkIsCurrent {
        root: FiberRootId,
        current: FiberId,
    },
    ExpectedHostRoot {
        root: FiberRootId,
        fiber: FiberId,
        tag: FiberTag,
    },
    HostRootStateNodeMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected: StateNodeHandle,
        actual: StateNodeHandle,
    },
    FinishedWorkNotAlternate {
        root: FiberRootId,
        current: FiberId,
        finished_work: FiberId,
    },
    RenderPhaseWorkMismatch {
        root: FiberRootId,
        expected: Option<FiberId>,
        actual: FiberId,
    },
    RenderPhaseLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    RenderPhaseNotCompleted {
        root: FiberRootId,
        status: RootRenderExitStatus,
    },
    MemoizedStateMismatch {
        root: FiberRootId,
        expected: StateHandle,
        actual: StateHandle,
    },
    UpdateQueueMismatch {
        root: FiberRootId,
        expected: UpdateQueueHandle,
        actual: UpdateQueueHandle,
    },
    DomRefCallbackGateActionMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected: &'static str,
        actual: &'static str,
    },
    DomRefCallbackGateTokenScopeMismatch {
        root: FiberRootId,
        fiber: FiberId,
        action: &'static str,
        expected_phase: HostFiberTokenPhase,
        actual_phase: HostFiberTokenPhase,
        expected_target: HostFiberTokenTarget,
        actual_target: HostFiberTokenTarget,
    },
    DomRefCallbackGateDetachReasonMismatch {
        root: FiberRootId,
        fiber: FiberId,
        action: &'static str,
        detach_reason: Option<&'static str>,
    },
    RemainingLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
}

impl Display for RootCommitError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::HostRootStateStore(error) => Display::fmt(error, formatter),
            Self::HostFiberToken(error) => Display::fmt(error, formatter),
            Self::UpdateQueue(error) => Display::fmt(error, formatter),
            Self::FunctionComponentRender { fiber, message } => write!(
                formatter,
                "function component fiber {} passive hook-effect metadata failed before commit: {}",
                fiber.slot().get(),
                message
            ),
            Self::PendingPassiveRootMismatch { root, pending_root } => write!(
                formatter,
                "root {} pending passive metadata belongs to root {}",
                root.raw(),
                pending_root.raw()
            ),
            Self::PendingPassiveAlreadyCommitted {
                root,
                finished_work,
            } => write!(
                formatter,
                "root {} pending passive metadata was already handed off for finished work fiber slot {}",
                root.raw(),
                finished_work.slot().get()
            ),
            Self::PendingPassiveQueueRejected {
                root,
                fiber,
                effect,
                phase,
                lanes,
            } => write!(
                formatter,
                "root {} rejected {:?} pending passive record for function component fiber slot {} effect slot {} in lanes {:?}",
                root.raw(),
                phase,
                fiber.slot().get(),
                effect.slot().get(),
                lanes
            ),
            Self::ExpectedFunctionComponentPassiveEffectFiber { root, fiber, tag } => write!(
                formatter,
                "root {} expected function component passive effect fiber slot {}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                tag
            ),
            Self::RefHostInstanceMissing { root, fiber } => write!(
                formatter,
                "root {} ref metadata for HostComponent fiber slot {} requires a host instance state node",
                root.raw(),
                fiber.slot().get()
            ),
            Self::EmptyFinishedLanes { root } => {
                write!(formatter, "root {} commit lanes are empty", root.raw())
            }
            Self::CurrentMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} current fiber slot {} does not match render record current fiber slot {}",
                root.raw(),
                actual.slot().get(),
                expected.slot().get()
            ),
            Self::FinishedWorkIsCurrent { root, current } => write!(
                formatter,
                "root {} cannot commit current fiber slot {} as finished work",
                root.raw(),
                current.slot().get()
            ),
            Self::ExpectedHostRoot { root, fiber, tag } => write!(
                formatter,
                "root {} finished commit fiber slot {} must be HostRoot, found {:?}",
                root.raw(),
                fiber.slot().get(),
                tag
            ),
            Self::HostRootStateNodeMismatch {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} HostRoot fiber slot {} state node {} does not match expected root state node {}",
                root.raw(),
                fiber.slot().get(),
                actual.raw(),
                expected.raw()
            ),
            Self::FinishedWorkNotAlternate {
                root,
                current,
                finished_work,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} is not the alternate of current fiber slot {}",
                root.raw(),
                finished_work.slot().get(),
                current.slot().get()
            ),
            Self::RenderPhaseWorkMismatch {
                root,
                expected,
                actual,
            } => {
                if let Some(expected) = expected {
                    write!(
                        formatter,
                        "root {} render phase recorded work fiber slot {}, commit requested fiber slot {}",
                        root.raw(),
                        expected.slot().get(),
                        actual.slot().get()
                    )
                } else {
                    write!(
                        formatter,
                        "root {} has no recorded render phase work for commit requested fiber slot {}",
                        root.raw(),
                        actual.slot().get()
                    )
                }
            }
            Self::RenderPhaseLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} render phase lanes {:?} do not match commit lanes {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::RenderPhaseNotCompleted { root, status } => write!(
                formatter,
                "root {} render phase must be completed before commit, found {:?}",
                root.raw(),
                status
            ),
            Self::MemoizedStateMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} finished HostRoot memoized state {} does not match render record state {}",
                root.raw(),
                actual.raw(),
                expected.raw()
            ),
            Self::UpdateQueueMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} finished HostRoot update queue {} does not match render record queue {}",
                root.raw(),
                actual.raw(),
                expected.raw()
            ),
            Self::DomRefCallbackGateActionMismatch {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} DOM ref callback gate expected {} ref metadata for fiber slot {}, found {}",
                root.raw(),
                expected,
                fiber.slot().get(),
                actual
            ),
            Self::DomRefCallbackGateTokenScopeMismatch {
                root,
                fiber,
                action,
                expected_phase,
                actual_phase,
                expected_target,
                actual_target,
            } => write!(
                formatter,
                "root {} DOM ref callback gate {} metadata for fiber slot {} requires {} {} token scope, found {} {}",
                root.raw(),
                action,
                fiber.slot().get(),
                expected_phase,
                expected_target,
                actual_phase,
                actual_target
            ),
            Self::DomRefCallbackGateDetachReasonMismatch {
                root,
                fiber,
                action,
                detach_reason,
            } => write!(
                formatter,
                "root {} DOM ref callback gate {} metadata for fiber slot {} has invalid detach reason {:?}",
                root.raw(),
                action,
                fiber.slot().get(),
                detach_reason
            ),
            Self::RemainingLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} finished HostRoot remaining lanes {:?} do not match render record remaining lanes {:?}",
                root.raw(),
                actual,
                expected
            ),
        }
    }
}

impl Error for RootCommitError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::HostRootStateStore(error) => Some(error),
            Self::HostFiberToken(error) => Some(error),
            Self::UpdateQueue(error) => Some(error),
            Self::PendingPassiveRootMismatch { .. }
            | Self::FunctionComponentRender { .. }
            | Self::PendingPassiveAlreadyCommitted { .. }
            | Self::PendingPassiveQueueRejected { .. }
            | Self::ExpectedFunctionComponentPassiveEffectFiber { .. }
            | Self::RefHostInstanceMissing { .. }
            | Self::EmptyFinishedLanes { .. }
            | Self::CurrentMismatch { .. }
            | Self::FinishedWorkIsCurrent { .. }
            | Self::ExpectedHostRoot { .. }
            | Self::HostRootStateNodeMismatch { .. }
            | Self::FinishedWorkNotAlternate { .. }
            | Self::RenderPhaseWorkMismatch { .. }
            | Self::RenderPhaseLanesMismatch { .. }
            | Self::RenderPhaseNotCompleted { .. }
            | Self::MemoizedStateMismatch { .. }
            | Self::UpdateQueueMismatch { .. }
            | Self::DomRefCallbackGateActionMismatch { .. }
            | Self::DomRefCallbackGateTokenScopeMismatch { .. }
            | Self::DomRefCallbackGateDetachReasonMismatch { .. }
            | Self::RemainingLanesMismatch { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for RootCommitError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for RootCommitError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<HostRootStateStoreError> for RootCommitError {
    fn from(error: HostRootStateStoreError) -> Self {
        Self::HostRootStateStore(error)
    }
}

impl From<HostFiberTokenValidationError> for RootCommitError {
    fn from(error: HostFiberTokenValidationError) -> Self {
        Self::HostFiberToken(error)
    }
}

impl From<UpdateQueueError> for RootCommitError {
    fn from(error: UpdateQueueError) -> Self {
        Self::UpdateQueue(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct PendingPassiveCommitHandoff {
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    pending_unmount_count: usize,
    pending_mount_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private passive commit metadata for future passive-effect workers"
)]
impl PendingPassiveCommitHandoff {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct FunctionComponentPendingPassiveEffectCommitRecord {
    fiber: FiberId,
    effect_index: usize,
    effect: HookEffectId,
    instance: HookEffectInstanceId,
    destroy: Option<HookEffectCallbackHandle>,
    lanes: Lanes,
    unmount_order: Option<PendingPassiveEffectOrder>,
    mount_order: PendingPassiveEffectOrder,
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect handoff metadata for deterministic canaries"
)]
impl FunctionComponentPendingPassiveEffectCommitRecord {
    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub(crate) const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub(crate) const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub(crate) const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn unmount_order(self) -> Option<PendingPassiveEffectOrder> {
        self.unmount_order
    }

    #[must_use]
    pub(crate) const fn mount_order(self) -> PendingPassiveEffectOrder {
        self.mount_order
    }

    #[must_use]
    const fn unmount_phase_record(
        self,
    ) -> Option<FunctionComponentPendingPassiveEffectPhaseCommitRecord> {
        match self.unmount_order {
            Some(order) => Some(FunctionComponentPendingPassiveEffectPhaseCommitRecord {
                fiber: self.fiber,
                effect_index: self.effect_index,
                effect: self.effect,
                instance: self.instance,
                destroy: self.destroy,
                lanes: self.lanes,
                phase: PendingPassiveEffectPhase::Unmount,
                order,
            }),
            None => None,
        }
    }

    #[must_use]
    const fn mount_phase_record(self) -> FunctionComponentPendingPassiveEffectPhaseCommitRecord {
        FunctionComponentPendingPassiveEffectPhaseCommitRecord {
            fiber: self.fiber,
            effect_index: self.effect_index,
            effect: self.effect,
            instance: self.instance,
            destroy: None,
            lanes: self.lanes,
            phase: PendingPassiveEffectPhase::Mount,
            order: self.mount_order,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct FunctionComponentPendingPassiveEffectPhaseCommitRecord {
    fiber: FiberId,
    effect_index: usize,
    effect: HookEffectId,
    instance: HookEffectInstanceId,
    destroy: Option<HookEffectCallbackHandle>,
    lanes: Lanes,
    phase: PendingPassiveEffectPhase,
    order: PendingPassiveEffectOrder,
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect phase handoff metadata for deterministic flush canaries"
)]
impl FunctionComponentPendingPassiveEffectPhaseCommitRecord {
    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub(crate) const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub(crate) const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub(crate) const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn phase(self) -> PendingPassiveEffectPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn order(self) -> PendingPassiveEffectOrder {
        self.order
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentPendingPassiveCommitHandoff {
    root: FiberRootId,
    fiber: FiberId,
    phase: FunctionComponentHookRenderPhase,
    lanes: Lanes,
    records: Vec<FunctionComponentPendingPassiveEffectCommitRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect handoff metadata for deterministic canaries"
)]
impl FunctionComponentPendingPassiveCommitHandoff {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn phase(&self) -> FunctionComponentHookRenderPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[FunctionComponentPendingPassiveEffectCommitRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub(crate) fn queued_unmount_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.unmount_order().is_some())
            .count()
    }

    #[must_use]
    pub(crate) fn queued_mount_count(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub(crate) fn effect_phase_records(
        &self,
    ) -> Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord> {
        let mut phase_records =
            Vec::with_capacity(self.queued_unmount_count() + self.queued_mount_count());

        for record in &self.records {
            if let Some(phase_record) = record.unmount_phase_record() {
                phase_records.push(phase_record);
            }
        }
        for record in &self.records {
            phase_records.push(record.mount_phase_record());
        }

        phase_records
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCommitAction {
    Detach,
    Attach,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefDetachReason {
    RefChanged,
    Deleted,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct HostRootRefCommitRecord {
    root: FiberRootId,
    fiber: FiberId,
    state_node: StateNodeHandle,
    ref_handle: RefHandle,
    token: HostFiberTokenId,
    token_phase: HostFiberTokenPhase,
    token_target: HostFiberTokenTarget,
    action: HostRootRefCommitAction,
    detach_reason: Option<HostRootRefDetachReason>,
}

#[allow(
    dead_code,
    reason = "crate-private ref commit metadata for future ref lifecycle workers"
)]
impl HostRootRefCommitRecord {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn ref_handle(&self) -> RefHandle {
        self.ref_handle
    }

    #[must_use]
    pub(crate) const fn token(&self) -> HostFiberTokenId {
        self.token
    }

    #[must_use]
    pub(crate) const fn token_phase(&self) -> HostFiberTokenPhase {
        self.token_phase
    }

    #[must_use]
    pub(crate) const fn token_target(&self) -> HostFiberTokenTarget {
        self.token_target
    }

    #[must_use]
    pub(crate) const fn action(&self) -> HostRootRefCommitAction {
        self.action
    }

    #[must_use]
    pub(crate) const fn detach_reason(&self) -> Option<HostRootRefDetachReason> {
        self.detach_reason
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct HostRootRefCommitSnapshot {
    detach: Vec<HostRootRefCommitRecord>,
    attach: Vec<HostRootRefCommitRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private ref commit metadata for future ref lifecycle workers"
)]
impl HostRootRefCommitSnapshot {
    #[must_use]
    pub(crate) fn detach(&self) -> &[HostRootRefCommitRecord] {
        &self.detach
    }

    #[must_use]
    pub(crate) fn attach(&self) -> &[HostRootRefCommitRecord] {
        &self.attach
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.detach.is_empty() && self.attach.is_empty()
    }

    #[must_use]
    pub(crate) fn len(&self) -> usize {
        self.detach.len() + self.attach.len()
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct HostRootDomRefCallbackCommitGateSnapshot {
    records: Vec<HostRootDomRefCallbackCommitGateRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private DOM ref callback gate records are reserved for future DOM commit workers"
)]
impl HostRootDomRefCallbackCommitGateSnapshot {
    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootDomRefCallbackCommitGateRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub(crate) fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub(crate) const fn callback_refs_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn object_refs_mutated(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn layout_effects_run(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_instances_exposed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_ref_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct HostRootDomRefCallbackCommitGateRecord {
    sequence: usize,
    root: FiberRootId,
    fiber: FiberId,
    state_node: StateNodeHandle,
    ref_handle: RefHandle,
    token: HostFiberTokenId,
    token_phase: HostFiberTokenPhase,
    token_target: HostFiberTokenTarget,
    action: HostRootRefCommitAction,
    detach_reason: Option<HostRootRefDetachReason>,
    status: HostRootDomRefCallbackCommitGateStatus,
    blockers: [HostRootDomRefCallbackCommitGateBlocker; 5],
}

#[allow(
    dead_code,
    reason = "crate-private DOM ref callback gate records are reserved for future DOM commit workers"
)]
impl HostRootDomRefCallbackCommitGateRecord {
    #[must_use]
    pub(crate) const fn sequence(&self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn ref_handle(&self) -> RefHandle {
        self.ref_handle
    }

    #[must_use]
    pub(crate) const fn token(&self) -> HostFiberTokenId {
        self.token
    }

    #[must_use]
    pub(crate) const fn token_phase(&self) -> HostFiberTokenPhase {
        self.token_phase
    }

    #[must_use]
    pub(crate) const fn token_target(&self) -> HostFiberTokenTarget {
        self.token_target
    }

    #[must_use]
    pub(crate) const fn action(&self) -> HostRootRefCommitAction {
        self.action
    }

    #[must_use]
    pub(crate) const fn detach_reason(&self) -> Option<HostRootRefDetachReason> {
        self.detach_reason
    }

    #[must_use]
    pub(crate) const fn status(&self) -> HostRootDomRefCallbackCommitGateStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(&self) -> &[HostRootDomRefCallbackCommitGateBlocker; 5] {
        &self.blockers
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootDomRefCallbackCommitGateStatus {
    Blocked,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootDomRefCallbackCommitGateBlocker {
    CallbackRefInvocation,
    ObjectRefMutation,
    LayoutEffectExecution,
    PublicInstanceExposure,
    ReactDomRefCompatibilityClaim,
}

const DOM_REF_CALLBACK_GATE_BLOCKERS: [HostRootDomRefCallbackCommitGateBlocker; 5] = [
    HostRootDomRefCallbackCommitGateBlocker::CallbackRefInvocation,
    HostRootDomRefCallbackCommitGateBlocker::ObjectRefMutation,
    HostRootDomRefCallbackCommitGateBlocker::LayoutEffectExecution,
    HostRootDomRefCallbackCommitGateBlocker::PublicInstanceExposure,
    HostRootDomRefCallbackCommitGateBlocker::ReactDomRefCompatibilityClaim,
];

#[derive(Debug, Default, Clone, PartialEq, Eq)]
struct PendingRefCommitSnapshot {
    detach: Vec<PendingRefCommitRecord>,
    attach: Vec<PendingRefCommitRecord>,
}

impl PendingRefCommitSnapshot {
    fn push_attach(
        &mut self,
        root: FiberRootId,
        fiber: FiberId,
        state_node: StateNodeHandle,
        ref_handle: RefHandle,
    ) {
        self.attach.push(PendingRefCommitRecord {
            root,
            fiber,
            state_node,
            ref_handle,
            action: HostRootRefCommitAction::Attach,
            detach_reason: None,
        });
    }

    fn push_detach(
        &mut self,
        root: FiberRootId,
        fiber: FiberId,
        state_node: StateNodeHandle,
        ref_handle: RefHandle,
        reason: HostRootRefDetachReason,
    ) {
        self.detach.push(PendingRefCommitRecord {
            root,
            fiber,
            state_node,
            ref_handle,
            action: HostRootRefCommitAction::Detach,
            detach_reason: Some(reason),
        });
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct PendingRefCommitRecord {
    root: FiberRootId,
    fiber: FiberId,
    state_node: StateNodeHandle,
    ref_handle: RefHandle,
    action: HostRootRefCommitAction,
    detach_reason: Option<HostRootRefDetachReason>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootDeletionListRecord {
    parent: FiberId,
    list: DeletionListId,
    deleted: Vec<FiberId>,
}

#[allow(
    dead_code,
    reason = "crate-private deletion metadata for future mutation/passive deletion workers"
)]
impl HostRootDeletionListRecord {
    #[must_use]
    pub(crate) const fn parent(&self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub(crate) const fn list(&self) -> DeletionListId {
        self.list
    }

    #[must_use]
    pub(crate) fn deleted(&self) -> &[FiberId] {
        &self.deleted
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostRootCommitRecord {
    root: FiberRootId,
    previous_current: FiberId,
    current: FiberId,
    finished_lanes: Lanes,
    remaining_lanes: Lanes,
    pending_lanes: Lanes,
    mutation_log: HostRootMutationPhaseLog,
    mutation_apply_log: HostRootMutationApplyLog,
    root_update_callbacks: RootUpdateCallbackSnapshot,
    pending_passive_handoff: Option<PendingPassiveCommitHandoff>,
    deletion_lists: Vec<HostRootDeletionListRecord>,
    ref_commit_metadata: HostRootRefCommitSnapshot,
    dom_ref_callback_commit_gate: HostRootDomRefCallbackCommitGateSnapshot,
}

impl HostRootCommitRecord {
    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn previous_current(&self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn finished_work(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub const fn remaining_lanes(&self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub const fn pending_lanes(&self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub const fn has_remaining_work(&self) -> bool {
        self.pending_lanes.is_non_empty()
    }

    #[must_use]
    pub fn root_update_callbacks(&self) -> &RootUpdateCallbackSnapshot {
        &self.root_update_callbacks
    }

    #[must_use]
    #[allow(
        dead_code,
        reason = "crate-private ref commit metadata for future ref lifecycle workers"
    )]
    pub(crate) fn ref_commit_metadata(&self) -> &HostRootRefCommitSnapshot {
        &self.ref_commit_metadata
    }

    #[must_use]
    #[allow(
        dead_code,
        reason = "crate-private DOM ref callback gate records are reserved for future DOM commit workers"
    )]
    pub(crate) fn dom_ref_callback_commit_gate(&self) -> &HostRootDomRefCallbackCommitGateSnapshot {
        &self.dom_ref_callback_commit_gate
    }

    #[allow(
        dead_code,
        reason = "reconciler-private mutation metadata is reserved for later commit workers"
    )]
    #[must_use]
    pub(crate) const fn mutation_log(&self) -> &HostRootMutationPhaseLog {
        &self.mutation_log
    }

    #[allow(
        dead_code,
        reason = "reconciler-private mutation apply metadata is reserved for later commit workers"
    )]
    #[must_use]
    pub(crate) const fn mutation_apply_log(&self) -> &HostRootMutationApplyLog {
        &self.mutation_apply_log
    }

    #[allow(
        dead_code,
        reason = "crate-private passive commit metadata for future passive-effect workers"
    )]
    #[must_use]
    pub(crate) const fn pending_passive_handoff(&self) -> Option<PendingPassiveCommitHandoff> {
        self.pending_passive_handoff
    }

    #[allow(
        dead_code,
        reason = "crate-private deletion metadata for future mutation/passive deletion workers"
    )]
    #[must_use]
    pub(crate) fn deletion_lists(&self) -> &[HostRootDeletionListRecord] {
        &self.deletion_lists
    }
}

pub fn commit_finished_host_root<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
) -> Result<HostRootCommitRecord, RootCommitError> {
    validate_finished_host_root(store, render)?;

    let root_id = render.root();
    let previous_current = render.current();
    let finished_work = render.finished_work();
    let finished_lanes = render.render_lanes();
    let remaining_lanes = render.remaining_lanes();
    let work_in_progress_update_queue = render.work_in_progress_update_queue();
    let mutation_log =
        collect_host_root_mutation_phase_log(store, root_id, finished_work, finished_lanes)?;
    let deletion_lists = collect_deletion_list_metadata(store, finished_work)?;
    let mutation_apply_log = collect_host_root_mutation_apply_log(
        store,
        root_id,
        finished_work,
        finished_lanes,
        &mutation_log,
        &deletion_lists,
    )?;
    let pending_ref_commit_metadata =
        collect_pending_ref_commit_metadata(store.fiber_arena(), root_id, finished_work)?;

    let (pending_lanes, pending_passive_handoff) = {
        let root = store.root_mut(root_id)?;
        let pending_passive_handoff = record_pending_passive_commit_handoff(
            root.scheduling_mut(),
            root_id,
            finished_work,
            finished_lanes,
        )?;
        root.lanes_mut()
            .mark_finished(RootFinishedLanes::new(finished_lanes, remaining_lanes));
        root.set_current(finished_work);
        root.clear_finished_work();
        root.scheduling_mut().clear_render_phase_work();
        root.scheduling_mut().clear_callback();
        (root.lanes().pending_lanes(), pending_passive_handoff)
    };
    let root_update_callbacks = store
        .update_queues_mut()
        .take_root_update_callback_records(work_in_progress_update_queue)?;
    let ref_commit_metadata = materialize_ref_commit_metadata(store, pending_ref_commit_metadata)?;
    let dom_ref_callback_commit_gate =
        materialize_dom_ref_callback_commit_gate(store, &ref_commit_metadata)?;

    Ok(HostRootCommitRecord {
        root: root_id,
        previous_current,
        current: finished_work,
        finished_lanes,
        remaining_lanes,
        pending_lanes,
        mutation_log,
        mutation_apply_log,
        root_update_callbacks,
        pending_passive_handoff,
        deletion_lists,
        ref_commit_metadata,
        dom_ref_callback_commit_gate,
    })
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect handoff helper exercised by deterministic canaries"
)]
pub(crate) fn queue_function_component_pending_passive_effects<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root: FiberRootId,
    hook_store: &FunctionComponentHookRenderStore,
    state: FunctionComponentHookRenderState,
    lanes: Lanes,
) -> Result<FunctionComponentPendingPassiveCommitHandoff, RootCommitError> {
    store.root(root)?;
    let fiber = state.render_fiber();
    let tag = store.fiber_arena().get(fiber)?.tag();
    if tag != FiberTag::FunctionComponent {
        return Err(
            RootCommitError::ExpectedFunctionComponentPassiveEffectFiber { root, fiber, tag },
        );
    }

    let passive_effects = hook_store
        .passive_effect_metadata(state, lanes)
        .map_err(|error| RootCommitError::FunctionComponentRender {
            fiber,
            message: error.to_string(),
        })?;
    if passive_effects.is_empty() {
        return Ok(FunctionComponentPendingPassiveCommitHandoff {
            root,
            fiber,
            phase: state.phase(),
            lanes,
            records: Vec::new(),
        });
    }

    let scheduling = store.root_mut(root)?.scheduling_mut();
    match scheduling.pending_passive().root() {
        Some(pending_root) if pending_root != root => {
            return Err(RootCommitError::PendingPassiveRootMismatch { root, pending_root });
        }
        Some(_) if scheduling.pending_passive().finished_work().is_some() => {
            return Err(RootCommitError::PendingPassiveAlreadyCommitted {
                root,
                finished_work: scheduling
                    .pending_passive()
                    .finished_work()
                    .expect("pending passive finished work was checked above"),
            });
        }
        Some(_) => {}
        None => scheduling.prepare_pending_passive(root, Lanes::NO),
    }

    let mut records = Vec::with_capacity(passive_effects.len());
    for passive_effect in passive_effects {
        records.push(queue_function_component_passive_effect_record(
            scheduling,
            root,
            state.phase(),
            passive_effect,
        )?);
    }

    Ok(FunctionComponentPendingPassiveCommitHandoff {
        root,
        fiber,
        phase: state.phase(),
        lanes,
        records,
    })
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect handoff helper exercised by deterministic canaries"
)]
fn queue_function_component_passive_effect_record<H: HostTypes>(
    scheduling: &mut RootSchedulingState<H>,
    root: FiberRootId,
    render_phase: FunctionComponentHookRenderPhase,
    passive_effect: FunctionComponentPassiveEffectMetadata,
) -> Result<FunctionComponentPendingPassiveEffectCommitRecord, RootCommitError> {
    let unmount_order = match render_phase {
        FunctionComponentHookRenderPhase::Mount => None,
        FunctionComponentHookRenderPhase::Update => Some(queue_pending_passive_record(
            scheduling,
            root,
            passive_effect,
            PendingPassiveEffectPhase::Unmount,
        )?),
    };
    let mount_order = queue_pending_passive_record(
        scheduling,
        root,
        passive_effect,
        PendingPassiveEffectPhase::Mount,
    )?;

    Ok(FunctionComponentPendingPassiveEffectCommitRecord {
        fiber: passive_effect.fiber(),
        effect_index: passive_effect.effect_index(),
        effect: passive_effect.effect(),
        instance: passive_effect.instance(),
        destroy: passive_effect.destroy(),
        lanes: passive_effect.lanes(),
        unmount_order,
        mount_order,
    })
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect handoff helper exercised by deterministic canaries"
)]
fn queue_pending_passive_record<H: HostTypes>(
    scheduling: &mut RootSchedulingState<H>,
    root: FiberRootId,
    passive_effect: FunctionComponentPassiveEffectMetadata,
    phase: PendingPassiveEffectPhase,
) -> Result<PendingPassiveEffectOrder, RootCommitError> {
    let pending_passive = scheduling.pending_passive_mut();
    let order = match phase {
        PendingPassiveEffectPhase::Unmount => pending_passive.queue_unmount(
            passive_effect.fiber(),
            PendingPassiveUnmountOrigin::UpdatedFiber,
            passive_effect.lanes(),
        ),
        PendingPassiveEffectPhase::Mount => {
            pending_passive.queue_mount(passive_effect.fiber(), passive_effect.lanes())
        }
    };

    order.ok_or(RootCommitError::PendingPassiveQueueRejected {
        root,
        fiber: passive_effect.fiber(),
        effect: passive_effect.effect(),
        phase,
        lanes: passive_effect.lanes(),
    })
}

fn collect_pending_ref_commit_metadata(
    arena: &FiberArena,
    root: FiberRootId,
    finished_work: FiberId,
) -> Result<PendingRefCommitSnapshot, RootCommitError> {
    let mut metadata = PendingRefCommitSnapshot::default();
    collect_ref_detach_metadata(arena, root, finished_work, &mut metadata)?;
    collect_ref_attach_metadata(arena, root, finished_work, &mut metadata)?;
    Ok(metadata)
}

fn collect_ref_detach_metadata(
    arena: &FiberArena,
    root: FiberRootId,
    finished_work: FiberId,
    metadata: &mut PendingRefCommitSnapshot,
) -> Result<(), RootCommitError> {
    let node = arena.get(finished_work)?;

    if let Some(deletions) = node.deletions() {
        let deletion_list = arena
            .deletion_list(deletions)
            .ok_or(FiberTopologyError::InvalidDeletionList { id: deletions })?;
        if deletion_list.parent() != finished_work {
            return Err(FiberTopologyError::InvalidDeletionList { id: deletions }.into());
        }
        for &deleted in deletion_list {
            collect_deleted_ref_detach_metadata(arena, root, deleted, metadata)?;
        }
    }

    if node
        .subtree_flags()
        .contains_any(FiberFlags::MUTATION_MASK | FiberFlags::CLONED)
    {
        for child in arena.child_ids(finished_work)? {
            collect_ref_detach_metadata(arena, root, child, metadata)?;
        }
    }

    if node.tag() == FiberTag::HostComponent
        && node.flags().contains_all(FiberFlags::REF)
        && let Some(current) = node.alternate()
    {
        let current_node = arena.get(current)?;
        if current_node.ref_handle().is_some() {
            let state_node =
                ref_host_state_node(root, current, current_node, HostRootRefCommitAction::Detach)?;
            metadata.push_detach(
                root,
                current,
                state_node,
                current_node.ref_handle(),
                HostRootRefDetachReason::RefChanged,
            );
        }
    }

    Ok(())
}

fn collect_deleted_ref_detach_metadata(
    arena: &FiberArena,
    root: FiberRootId,
    deleted: FiberId,
    metadata: &mut PendingRefCommitSnapshot,
) -> Result<(), RootCommitError> {
    let node = arena.get(deleted)?;
    if node.tag() == FiberTag::HostComponent && node.ref_handle().is_some() {
        let state_node = ref_host_state_node(root, deleted, node, HostRootRefCommitAction::Detach)?;
        metadata.push_detach(
            root,
            deleted,
            state_node,
            node.ref_handle(),
            HostRootRefDetachReason::Deleted,
        );
    }

    for child in arena.child_ids(deleted)? {
        collect_deleted_ref_detach_metadata(arena, root, child, metadata)?;
    }

    Ok(())
}

fn collect_ref_attach_metadata(
    arena: &FiberArena,
    root: FiberRootId,
    finished_work: FiberId,
    metadata: &mut PendingRefCommitSnapshot,
) -> Result<(), RootCommitError> {
    let node = arena.get(finished_work)?;
    if node.subtree_flags().contains_any(FiberFlags::LAYOUT_MASK) {
        for child in arena.child_ids(finished_work)? {
            collect_ref_attach_metadata(arena, root, child, metadata)?;
        }
    }

    if node.tag() == FiberTag::HostComponent
        && node.flags().contains_all(FiberFlags::REF)
        && node.ref_handle().is_some()
    {
        let state_node =
            ref_host_state_node(root, finished_work, node, HostRootRefCommitAction::Attach)?;
        metadata.push_attach(root, finished_work, state_node, node.ref_handle());
    }

    Ok(())
}

fn ref_host_state_node(
    root: FiberRootId,
    fiber: FiberId,
    node: &fast_react_core::FiberNode,
    _action: HostRootRefCommitAction,
) -> Result<StateNodeHandle, RootCommitError> {
    let state_node = node.state_node();
    if state_node.is_none() {
        return Err(RootCommitError::RefHostInstanceMissing { root, fiber });
    }
    Ok(state_node)
}

fn materialize_ref_commit_metadata<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    pending: PendingRefCommitSnapshot,
) -> Result<HostRootRefCommitSnapshot, RootCommitError> {
    let mut metadata = HostRootRefCommitSnapshot::default();
    for pending_detach in pending.detach {
        metadata
            .detach
            .push(issue_ref_commit_record(store, pending_detach)?);
    }
    for pending_attach in pending.attach {
        metadata
            .attach
            .push(issue_ref_commit_record(store, pending_attach)?);
    }
    Ok(metadata)
}

fn issue_ref_commit_record<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    pending: PendingRefCommitRecord,
) -> Result<HostRootRefCommitRecord, RootCommitError> {
    let token_phase = match pending.action {
        HostRootRefCommitAction::Detach => HostFiberTokenPhase::Deletion,
        HostRootRefCommitAction::Attach => HostFiberTokenPhase::Commit,
    };
    let token_target = HostFiberTokenTarget::Instance;
    let token =
        store
            .host_tokens_mut()
            .issue(pending.root, pending.fiber, token_phase, token_target);
    store.host_tokens().validate(
        token,
        pending.root,
        pending.fiber,
        token_phase,
        token_target,
    )?;

    Ok(HostRootRefCommitRecord {
        root: pending.root,
        fiber: pending.fiber,
        state_node: pending.state_node,
        ref_handle: pending.ref_handle,
        token,
        token_phase,
        token_target,
        action: pending.action,
        detach_reason: pending.detach_reason,
    })
}

fn materialize_dom_ref_callback_commit_gate<H: HostTypes>(
    store: &FiberRootStore<H>,
    metadata: &HostRootRefCommitSnapshot,
) -> Result<HostRootDomRefCallbackCommitGateSnapshot, RootCommitError> {
    let mut gate = HostRootDomRefCallbackCommitGateSnapshot::default();
    let mut sequence = 0;

    for record in metadata.detach() {
        gate.records.push(dom_ref_callback_commit_gate_record(
            store,
            sequence,
            record,
            HostRootRefCommitAction::Detach,
        )?);
        sequence += 1;
    }
    for record in metadata.attach() {
        gate.records.push(dom_ref_callback_commit_gate_record(
            store,
            sequence,
            record,
            HostRootRefCommitAction::Attach,
        )?);
        sequence += 1;
    }

    Ok(gate)
}

fn dom_ref_callback_commit_gate_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    sequence: usize,
    record: &HostRootRefCommitRecord,
    expected_action: HostRootRefCommitAction,
) -> Result<HostRootDomRefCallbackCommitGateRecord, RootCommitError> {
    if record.action() != expected_action {
        return Err(RootCommitError::DomRefCallbackGateActionMismatch {
            root: record.root(),
            fiber: record.fiber(),
            expected: ref_commit_action_label(expected_action),
            actual: ref_commit_action_label(record.action()),
        });
    }

    let expected_phase = dom_ref_callback_gate_token_phase(record.action());
    let expected_target = HostFiberTokenTarget::Instance;
    if record.token_phase() != expected_phase || record.token_target() != expected_target {
        return Err(RootCommitError::DomRefCallbackGateTokenScopeMismatch {
            root: record.root(),
            fiber: record.fiber(),
            action: ref_commit_action_label(record.action()),
            expected_phase,
            actual_phase: record.token_phase(),
            expected_target,
            actual_target: record.token_target(),
        });
    }

    let detach_reason_is_valid = match record.action() {
        HostRootRefCommitAction::Detach => record.detach_reason().is_some(),
        HostRootRefCommitAction::Attach => record.detach_reason().is_none(),
    };
    if !detach_reason_is_valid {
        return Err(RootCommitError::DomRefCallbackGateDetachReasonMismatch {
            root: record.root(),
            fiber: record.fiber(),
            action: ref_commit_action_label(record.action()),
            detach_reason: record.detach_reason().map(ref_detach_reason_label),
        });
    }

    store.host_tokens().validate(
        record.token(),
        record.root(),
        record.fiber(),
        expected_phase,
        expected_target,
    )?;

    Ok(HostRootDomRefCallbackCommitGateRecord {
        sequence,
        root: record.root(),
        fiber: record.fiber(),
        state_node: record.state_node(),
        ref_handle: record.ref_handle(),
        token: record.token(),
        token_phase: record.token_phase(),
        token_target: record.token_target(),
        action: record.action(),
        detach_reason: record.detach_reason(),
        status: HostRootDomRefCallbackCommitGateStatus::Blocked,
        blockers: DOM_REF_CALLBACK_GATE_BLOCKERS,
    })
}

const fn dom_ref_callback_gate_token_phase(action: HostRootRefCommitAction) -> HostFiberTokenPhase {
    match action {
        HostRootRefCommitAction::Detach => HostFiberTokenPhase::Deletion,
        HostRootRefCommitAction::Attach => HostFiberTokenPhase::Commit,
    }
}

const fn ref_commit_action_label(action: HostRootRefCommitAction) -> &'static str {
    match action {
        HostRootRefCommitAction::Detach => "detach",
        HostRootRefCommitAction::Attach => "attach",
    }
}

const fn ref_detach_reason_label(reason: HostRootRefDetachReason) -> &'static str {
    match reason {
        HostRootRefDetachReason::RefChanged => "ref-changed",
        HostRootRefDetachReason::Deleted => "deleted",
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootMutationPhaseLog {
    root: FiberRootId,
    finished_work: FiberId,
    records: Vec<HostRootMutationPhaseRecord>,
}

#[allow(
    dead_code,
    reason = "reconciler-private mutation metadata is reserved for later commit workers"
)]
impl HostRootMutationPhaseLog {
    #[must_use]
    const fn new(root: FiberRootId, finished_work: FiberId) -> Self {
        Self {
            root,
            finished_work,
            records: Vec::new(),
        }
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootMutationPhaseRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub(crate) fn len(&self) -> usize {
        self.records.len()
    }

    fn push(&mut self, record: HostRootMutationPhaseRecord) {
        self.records.push(record);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootMutationPhaseRecord {
    root: FiberRootId,
    host_root: FiberId,
    fiber: FiberId,
    alternate_fiber: Option<FiberId>,
    tag: FiberTag,
    kind: HostRootMutationPhaseRecordKind,
    lanes: Lanes,
    effect_flag: FiberFlags,
    state_node: StateNodeHandle,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
    alternate_memoized_props: Option<PropsHandle>,
}

#[allow(
    dead_code,
    reason = "reconciler-private mutation metadata is reserved for later commit workers"
)]
impl HostRootMutationPhaseRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn alternate_fiber(self) -> Option<FiberId> {
        self.alternate_fiber
    }

    #[must_use]
    pub(crate) const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostRootMutationPhaseRecordKind {
        self.kind
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn effect_flag(self) -> FiberFlags {
        self.effect_flag
    }

    #[must_use]
    pub(crate) const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn pending_props(self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub(crate) const fn memoized_props(self) -> PropsHandle {
        self.memoized_props
    }

    #[must_use]
    pub(crate) const fn alternate_memoized_props(self) -> Option<PropsHandle> {
        self.alternate_memoized_props
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootMutationPhaseRecordKind {
    Placement,
    Update,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootMutationApplyLog {
    root: FiberRootId,
    finished_work: FiberId,
    records: Vec<HostRootMutationApplyRecord>,
}

#[allow(
    dead_code,
    reason = "reconciler-private mutation apply metadata is reserved for later commit workers"
)]
impl HostRootMutationApplyLog {
    #[must_use]
    const fn new(root: FiberRootId, finished_work: FiberId) -> Self {
        Self {
            root,
            finished_work,
            records: Vec::new(),
        }
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootMutationApplyRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub(crate) fn len(&self) -> usize {
        self.records.len()
    }

    fn push(&mut self, record: HostRootMutationApplyRecord) {
        self.records.push(record);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootMutationApplyRecord {
    root: FiberRootId,
    host_root: FiberId,
    source: HostRootMutationApplyRecordSource,
    parent: FiberId,
    parent_tag: FiberTag,
    parent_state_node: StateNodeHandle,
    fiber: FiberId,
    alternate_fiber: Option<FiberId>,
    tag: FiberTag,
    kind: HostRootMutationApplyRecordKind,
    lanes: Lanes,
    effect_flag: FiberFlags,
    state_node: StateNodeHandle,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
    alternate_memoized_props: Option<PropsHandle>,
}

#[allow(
    dead_code,
    reason = "reconciler-private mutation apply metadata is reserved for later commit workers"
)]
impl HostRootMutationApplyRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub(crate) const fn source(self) -> HostRootMutationApplyRecordSource {
        self.source
    }

    #[must_use]
    pub(crate) const fn parent(self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub(crate) const fn parent_tag(self) -> FiberTag {
        self.parent_tag
    }

    #[must_use]
    pub(crate) const fn parent_state_node(self) -> StateNodeHandle {
        self.parent_state_node
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn alternate_fiber(self) -> Option<FiberId> {
        self.alternate_fiber
    }

    #[must_use]
    pub(crate) const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostRootMutationApplyRecordKind {
        self.kind
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn effect_flag(self) -> FiberFlags {
        self.effect_flag
    }

    #[must_use]
    pub(crate) const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn pending_props(self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub(crate) const fn memoized_props(self) -> PropsHandle {
        self.memoized_props
    }

    #[must_use]
    pub(crate) const fn alternate_memoized_props(self) -> Option<PropsHandle> {
        self.alternate_memoized_props
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootMutationApplyRecordSource {
    MutationPhase(HostRootMutationPhaseRecordKind),
    DeletionList(DeletionListId),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootMutationApplyRecordKind {
    AppendPlacementToContainer,
    CommitHostComponentUpdate,
    CommitHostTextUpdate,
    RemoveDeletedFromContainer,
    RemoveDeletedFromHostParent,
    SkipDeletedNonHostFiber,
}

fn collect_host_root_mutation_phase_log<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
) -> Result<HostRootMutationPhaseLog, RootCommitError> {
    let arena = store.fiber_arena();
    let mut log = HostRootMutationPhaseLog::new(root, finished_work);
    let finished_root = arena.get(finished_work)?;
    if !finished_root.subtree_flags().has_mutation_effects() {
        return Ok(log);
    }

    let mut next_child = finished_root.child();

    while let Some(child) = next_child {
        let node = arena.get(child)?;
        next_child = node.sibling();

        if !is_supported_host_root_mutation_child(node.tag()) {
            continue;
        }

        let flags = node.flags();
        if flags.contains_all(FiberFlags::PLACEMENT) {
            log.push(host_root_mutation_phase_record(
                arena,
                root,
                finished_work,
                child,
                HostRootMutationPhaseRecordKind::Placement,
                lanes,
            )?);
        }
        if flags.contains_all(FiberFlags::UPDATE) {
            log.push(host_root_mutation_phase_record(
                arena,
                root,
                finished_work,
                child,
                HostRootMutationPhaseRecordKind::Update,
                lanes,
            )?);
        }
    }

    Ok(log)
}

fn host_root_mutation_phase_record(
    arena: &fast_react_core::FiberArena,
    root: FiberRootId,
    host_root: FiberId,
    fiber: FiberId,
    kind: HostRootMutationPhaseRecordKind,
    lanes: Lanes,
) -> Result<HostRootMutationPhaseRecord, RootCommitError> {
    let node = arena.get(fiber)?;
    let alternate_memoized_props = match node.alternate() {
        Some(alternate) => Some(arena.get(alternate)?.memoized_props()),
        None => None,
    };

    Ok(HostRootMutationPhaseRecord {
        root,
        host_root,
        fiber,
        alternate_fiber: node.alternate(),
        tag: node.tag(),
        kind,
        lanes,
        effect_flag: host_root_mutation_phase_record_flag(kind),
        state_node: node.state_node(),
        pending_props: node.pending_props(),
        memoized_props: node.memoized_props(),
        alternate_memoized_props,
    })
}

const fn is_supported_host_root_mutation_child(tag: FiberTag) -> bool {
    matches!(tag, FiberTag::HostComponent | FiberTag::HostText)
}

const fn host_root_mutation_phase_record_flag(kind: HostRootMutationPhaseRecordKind) -> FiberFlags {
    match kind {
        HostRootMutationPhaseRecordKind::Placement => FiberFlags::PLACEMENT,
        HostRootMutationPhaseRecordKind::Update => FiberFlags::UPDATE,
    }
}

fn collect_host_root_mutation_apply_log<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    mutation_log: &HostRootMutationPhaseLog,
    deletion_lists: &[HostRootDeletionListRecord],
) -> Result<HostRootMutationApplyLog, RootCommitError> {
    let arena = store.fiber_arena();
    let mut log = HostRootMutationApplyLog::new(root, finished_work);

    for deletion_list in deletion_lists {
        let parent = arena.get(deletion_list.parent())?;
        for &deleted in deletion_list.deleted() {
            log.push(host_root_deletion_apply_record(
                arena,
                HostRootDeletionApplyRecordRequest {
                    root,
                    host_root: finished_work,
                    lanes,
                    list: deletion_list.list(),
                    parent: parent.id(),
                    parent_tag: parent.tag(),
                    parent_state_node: parent.state_node(),
                    deleted,
                },
            )?);
        }
    }

    for record in mutation_log.records() {
        log.push(host_root_mutation_phase_apply_record(*record)?);
    }

    Ok(log)
}

fn host_root_mutation_phase_apply_record(
    record: HostRootMutationPhaseRecord,
) -> Result<HostRootMutationApplyRecord, RootCommitError> {
    let kind = match (record.kind(), record.tag()) {
        (HostRootMutationPhaseRecordKind::Placement, _) => {
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        }
        (HostRootMutationPhaseRecordKind::Update, FiberTag::HostComponent) => {
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        }
        (HostRootMutationPhaseRecordKind::Update, FiberTag::HostText) => {
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        }
        (HostRootMutationPhaseRecordKind::Update, tag) => {
            return Err(RootCommitError::ExpectedHostRoot {
                root: record.root(),
                fiber: record.fiber(),
                tag,
            });
        }
    };

    Ok(HostRootMutationApplyRecord {
        root: record.root(),
        host_root: record.host_root(),
        source: HostRootMutationApplyRecordSource::MutationPhase(record.kind()),
        parent: record.host_root(),
        parent_tag: FiberTag::HostRoot,
        parent_state_node: StateNodeHandle::NONE,
        fiber: record.fiber(),
        alternate_fiber: record.alternate_fiber(),
        tag: record.tag(),
        kind,
        lanes: record.lanes(),
        effect_flag: record.effect_flag(),
        state_node: record.state_node(),
        pending_props: record.pending_props(),
        memoized_props: record.memoized_props(),
        alternate_memoized_props: record.alternate_memoized_props(),
    })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootDeletionApplyRecordRequest {
    root: FiberRootId,
    host_root: FiberId,
    lanes: Lanes,
    list: DeletionListId,
    parent: FiberId,
    parent_tag: FiberTag,
    parent_state_node: StateNodeHandle,
    deleted: FiberId,
}

fn host_root_deletion_apply_record(
    arena: &fast_react_core::FiberArena,
    request: HostRootDeletionApplyRecordRequest,
) -> Result<HostRootMutationApplyRecord, RootCommitError> {
    let node = arena.get(request.deleted)?;
    let tag = node.tag();
    let kind = if !is_supported_host_root_mutation_child(tag) {
        HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
    } else {
        match request.parent_tag {
            FiberTag::HostRoot => HostRootMutationApplyRecordKind::RemoveDeletedFromContainer,
            FiberTag::HostComponent => HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent,
            _ => HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber,
        }
    };

    Ok(HostRootMutationApplyRecord {
        root: request.root,
        host_root: request.host_root,
        source: HostRootMutationApplyRecordSource::DeletionList(request.list),
        parent: request.parent,
        parent_tag: request.parent_tag,
        parent_state_node: request.parent_state_node,
        fiber: request.deleted,
        alternate_fiber: None,
        tag,
        kind,
        lanes: request.lanes,
        effect_flag: FiberFlags::CHILD_DELETION,
        state_node: node.state_node(),
        pending_props: node.pending_props(),
        memoized_props: node.memoized_props(),
        alternate_memoized_props: None,
    })
}

fn collect_deletion_list_metadata<H: HostTypes>(
    store: &FiberRootStore<H>,
    finished_work: FiberId,
) -> Result<Vec<HostRootDeletionListRecord>, RootCommitError> {
    let arena = store.fiber_arena();
    let mut records = Vec::new();
    let mut stack = vec![finished_work];

    while let Some(parent) = stack.pop() {
        let node = arena.get(parent)?;
        let deletion_list = node.deletions();
        let flags = node.flags();
        let child_ids = arena.child_ids(parent)?;

        if let Some(list_id) = deletion_list {
            let list = arena
                .deletion_list(list_id)
                .ok_or(FiberTopologyError::InvalidDeletionList { id: list_id })?;
            if list.parent() != parent {
                return Err(FiberTopologyError::InvalidDeletionList { id: list_id }.into());
            }
            if !list.is_empty() && !flags.contains_all(FiberFlags::CHILD_DELETION) {
                return Err(FiberTopologyError::DeletionListMissingFlag {
                    parent,
                    list: list_id,
                }
                .into());
            }

            let mut deleted = Vec::with_capacity(list.len());
            for &deleted_fiber in list {
                arena.get(deleted_fiber)?;
                if child_ids.contains(&deleted_fiber) {
                    return Err(FiberTopologyError::DeletedChildStillInFinishedChain {
                        parent,
                        deleted: deleted_fiber,
                    }
                    .into());
                }
                deleted.push(deleted_fiber);
            }

            if !deleted.is_empty() {
                records.push(HostRootDeletionListRecord {
                    parent,
                    list: list_id,
                    deleted,
                });
            }
        }

        stack.extend(child_ids.into_iter().rev());
    }

    Ok(records)
}

fn record_pending_passive_commit_handoff<H: HostTypes>(
    scheduling: &mut RootSchedulingState<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
) -> Result<Option<PendingPassiveCommitHandoff>, RootCommitError> {
    let Some(pending_root) = scheduling.pending_passive().root() else {
        return Ok(None);
    };

    if pending_root != root {
        return Err(RootCommitError::PendingPassiveRootMismatch { root, pending_root });
    }

    if !scheduling
        .pending_passive_mut()
        .record_commit_handoff(root, finished_work, lanes)
    {
        return Err(RootCommitError::EmptyFinishedLanes { root });
    }
    let pending_passive = scheduling.pending_passive();

    Ok(Some(PendingPassiveCommitHandoff {
        root,
        finished_work,
        lanes,
        pending_unmount_count: pending_passive.passive_unmounts().len(),
        pending_mount_count: pending_passive.passive_mounts().len(),
    }))
}

fn validate_finished_host_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
) -> Result<(), RootCommitError> {
    let root_id = render.root();
    let root = store.root(root_id)?;
    let current = root.current();
    let finished_work = render.finished_work();
    let finished_lanes = render.render_lanes();

    if finished_lanes.is_empty() {
        return Err(RootCommitError::EmptyFinishedLanes { root: root_id });
    }

    if current != render.current() {
        return Err(RootCommitError::CurrentMismatch {
            root: root_id,
            expected: render.current(),
            actual: current,
        });
    }

    if finished_work == current {
        return Err(RootCommitError::FinishedWorkIsCurrent {
            root: root_id,
            current,
        });
    }

    let scheduling = root.scheduling();
    if scheduling.work_in_progress() != Some(finished_work) {
        return Err(RootCommitError::RenderPhaseWorkMismatch {
            root: root_id,
            expected: scheduling.work_in_progress(),
            actual: finished_work,
        });
    }
    if scheduling.work_in_progress_root_render_lanes() != finished_lanes {
        return Err(RootCommitError::RenderPhaseLanesMismatch {
            root: root_id,
            expected: scheduling.work_in_progress_root_render_lanes(),
            actual: finished_lanes,
        });
    }
    if scheduling.render_exit_status() != RootRenderExitStatus::Completed {
        return Err(RootCommitError::RenderPhaseNotCompleted {
            root: root_id,
            status: scheduling.render_exit_status(),
        });
    }

    let arena = store.fiber_arena();
    let current_node = arena.get(current)?;
    let finished_node = arena.get(finished_work)?;

    if current_node.tag() != FiberTag::HostRoot {
        return Err(RootCommitError::ExpectedHostRoot {
            root: root_id,
            fiber: current,
            tag: current_node.tag(),
        });
    }
    if finished_node.tag() != FiberTag::HostRoot {
        return Err(RootCommitError::ExpectedHostRoot {
            root: root_id,
            fiber: finished_work,
            tag: finished_node.tag(),
        });
    }

    let expected_state_node = root_id.state_node_handle();
    if current_node.state_node() != expected_state_node {
        return Err(RootCommitError::HostRootStateNodeMismatch {
            root: root_id,
            fiber: current,
            expected: expected_state_node,
            actual: current_node.state_node(),
        });
    }
    if finished_node.state_node() != expected_state_node {
        return Err(RootCommitError::HostRootStateNodeMismatch {
            root: root_id,
            fiber: finished_work,
            expected: expected_state_node,
            actual: finished_node.state_node(),
        });
    }

    let is_alternate_pair = current_node.alternate() == Some(finished_work)
        && finished_node.alternate() == Some(current);
    if !is_alternate_pair {
        return Err(RootCommitError::FinishedWorkNotAlternate {
            root: root_id,
            current,
            finished_work,
        });
    }
    arena.validate_alternate_pair(current, finished_work)?;

    if finished_node.memoized_state() != render.memoized_state() {
        return Err(RootCommitError::MemoizedStateMismatch {
            root: root_id,
            expected: render.memoized_state(),
            actual: finished_node.memoized_state(),
        });
    }
    store
        .host_root_states()
        .get(finished_node.memoized_state())?;

    if current_node.update_queue() != render.current_update_queue() {
        return Err(RootCommitError::UpdateQueueMismatch {
            root: root_id,
            expected: render.current_update_queue(),
            actual: current_node.update_queue(),
        });
    }
    if finished_node.update_queue() != render.work_in_progress_update_queue() {
        return Err(RootCommitError::UpdateQueueMismatch {
            root: root_id,
            expected: render.work_in_progress_update_queue(),
            actual: finished_node.update_queue(),
        });
    }
    store.update_queues().queue(render.current_update_queue())?;
    store
        .update_queues()
        .queue(render.work_in_progress_update_queue())?;

    let actual_remaining_lanes = finished_node.lanes().merge(finished_node.child_lanes());
    if actual_remaining_lanes != render.remaining_lanes() {
        return Err(RootCommitError::RemainingLanesMismatch {
            root: root_id,
            expected: render.remaining_lanes(),
            actual: actual_remaining_lanes,
        });
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::function_component::{
        FunctionComponentEffectDependencyStatus, FunctionComponentEffectPhase,
        FunctionComponentHookRenderStore,
    };
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{
        RootElementHandle, RootOptions, RootTaskScheduleOutcome, RootUpdateCallbackHandle,
        RootUpdateCallbackRecord, RootUpdateCallbackVisibility, ensure_root_is_scheduled,
        process_root_schedule_in_microtask, render_host_root_for_lanes,
        render_host_root_via_scheduler_callback, update_container,
    };
    use fast_react_core::{
        DeletionListId, DependenciesHandle, FiberFlags, FiberMode, FiberTag, FiberTypeHandle,
        HookEffectCallbackHandle, HookEffectDependencies, Lane, Lanes, PropsHandle, RefHandle,
        StateNodeHandle,
    };
    use fast_react_host_config::HostFiberTokenViolation;

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id, host)
    }

    fn host_root_element(
        store: &FiberRootStore<RecordingHost>,
        fiber: FiberId,
    ) -> RootElementHandle {
        let state = store.fiber_arena().get(fiber).unwrap().memoized_state();
        store.host_root_states().get(state).unwrap().element()
    }

    fn attach_host_root_child(
        store: &mut FiberRootStore<RecordingHost>,
        host_root: FiberId,
        tag: FiberTag,
        flags: FiberFlags,
        state_node: StateNodeHandle,
        pending_props: PropsHandle,
        memoized_props: PropsHandle,
    ) -> FiberId {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let child = store
            .fiber_arena_mut()
            .create_fiber(tag, None, pending_props, mode);
        {
            let node = store.fiber_arena_mut().get_mut(child).unwrap();
            node.set_flags(flags);
            node.set_state_node(state_node);
            node.set_memoized_props(memoized_props);
        }
        store
            .fiber_arena_mut()
            .set_children(host_root, &[child])
            .unwrap();
        let subtree_flags = store.fiber_arena().get(host_root).unwrap().subtree_flags() | flags;
        store
            .fiber_arena_mut()
            .get_mut(host_root)
            .unwrap()
            .set_subtree_flags(subtree_flags);
        child
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

    fn deps(raw: u64) -> HookEffectDependencies {
        HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
    }

    fn scheduled_callback_node(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> crate::RootSchedulerCallbackHandle {
        let result =
            update_container(store, root_id, RootElementHandle::from_raw(1), None).unwrap();
        ensure_root_is_scheduled(store, result.schedule()).unwrap();
        let processed = process_root_schedule_in_microtask(store).unwrap();
        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        store.root(root_id).unwrap().scheduling().callback_node()
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct DeletionMetadataFixture {
        first_parent: FiberId,
        first_parent_state_node: StateNodeHandle,
        first_list: DeletionListId,
        first_deleted: FiberId,
        first_deleted_state_node: StateNodeHandle,
        second_deleted: FiberId,
        second_deleted_state_node: StateNodeHandle,
        second_parent: FiberId,
        second_parent_state_node: StateNodeHandle,
        second_list: DeletionListId,
        third_deleted: FiberId,
        third_deleted_state_node: StateNodeHandle,
    }

    fn create_test_fiber(
        store: &mut FiberRootStore<RecordingHost>,
        tag: FiberTag,
        props: u64,
    ) -> FiberId {
        store
            .fiber_arena_mut()
            .create_fiber(tag, None, PropsHandle::from_raw(props), FiberMode::NO)
    }

    fn attach_deletion_metadata_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> DeletionMetadataFixture {
        let first_parent = create_test_fiber(store, FiberTag::HostComponent, 101);
        let second_parent = create_test_fiber(store, FiberTag::HostComponent, 102);
        let first_parent_state_node = StateNodeHandle::from_raw(8101);
        let second_parent_state_node = StateNodeHandle::from_raw(8102);
        store
            .fiber_arena_mut()
            .get_mut(first_parent)
            .unwrap()
            .set_state_node(first_parent_state_node);
        store
            .fiber_arena_mut()
            .get_mut(second_parent)
            .unwrap()
            .set_state_node(second_parent_state_node);
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[first_parent, second_parent])
            .unwrap();

        let first_kept = create_test_fiber(store, FiberTag::HostText, 201);
        let first_deleted = create_test_fiber(store, FiberTag::HostText, 202);
        let second_deleted = create_test_fiber(store, FiberTag::HostText, 203);
        let first_deleted_state_node = StateNodeHandle::from_raw(8202);
        let second_deleted_state_node = StateNodeHandle::from_raw(8203);
        store
            .fiber_arena_mut()
            .get_mut(first_deleted)
            .unwrap()
            .set_state_node(first_deleted_state_node);
        store
            .fiber_arena_mut()
            .get_mut(second_deleted)
            .unwrap()
            .set_state_node(second_deleted_state_node);
        store
            .fiber_arena_mut()
            .set_children(first_parent, &[first_kept, first_deleted, second_deleted])
            .unwrap();
        let first_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(first_parent, second_deleted)
            .unwrap();
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(first_parent, first_deleted)
            .unwrap();

        let third_deleted = create_test_fiber(store, FiberTag::HostText, 301);
        let third_deleted_state_node = StateNodeHandle::from_raw(8301);
        store
            .fiber_arena_mut()
            .get_mut(third_deleted)
            .unwrap()
            .set_state_node(third_deleted_state_node);
        store
            .fiber_arena_mut()
            .set_children(second_parent, &[third_deleted])
            .unwrap();
        let second_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(second_parent, third_deleted)
            .unwrap();

        DeletionMetadataFixture {
            first_parent,
            first_parent_state_node,
            first_list,
            first_deleted,
            first_deleted_state_node,
            second_deleted,
            second_deleted_state_node,
            second_parent,
            second_parent_state_node,
            second_list,
            third_deleted,
            third_deleted_state_node,
        }
    }

    #[test]
    fn root_commit_switches_current_to_completed_host_root_wip() {
        let (mut store, root_id, host) = root_store();
        let element = RootElementHandle::from_raw(42);
        update_container(&mut store, root_id, element, None).unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let new_current = store.root(root_id).unwrap().current();

        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.previous_current(), previous_current);
        assert_eq!(commit.current(), render.work_in_progress());
        assert_eq!(commit.finished_work(), render.work_in_progress());
        assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(commit.remaining_lanes(), Lanes::NO);
        assert_eq!(commit.pending_lanes(), Lanes::NO);
        assert_eq!(commit.pending_passive_handoff(), None);
        assert!(commit.mutation_log().is_empty());
        assert!(commit.mutation_apply_log().is_empty());
        assert!(commit.deletion_lists().is_empty());
        assert!(commit.ref_commit_metadata().is_empty());
        assert!(commit.dom_ref_callback_commit_gate().is_empty());
        assert_dom_ref_callback_gate_is_inert(commit.dom_ref_callback_commit_gate());
        assert!(!commit.has_remaining_work());
        assert_eq!(new_current, render.work_in_progress());
        assert_eq!(host_root_element(&store, new_current), element);
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .pending_passive()
                .is_empty()
        );
        assert_eq!(
            store.fiber_arena().get(new_current).unwrap().alternate(),
            Some(previous_current)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(previous_current)
                .unwrap()
                .alternate(),
            Some(new_current)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_host_root_child_placement_metadata_without_host_mutation() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let child_state_node = StateNodeHandle::from_raw(700);
        let child_props = PropsHandle::from_raw(701);
        let child = attach_host_root_child(
            &mut store,
            render.finished_work(),
            FiberTag::HostText,
            FiberFlags::PLACEMENT,
            child_state_node,
            child_props,
            child_props,
        );

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let log = commit.mutation_log();
        let records = log.records();
        let apply_log = commit.mutation_apply_log();
        let apply_records = apply_log.records();

        assert_eq!(log.root(), root_id);
        assert_eq!(log.finished_work(), render.finished_work());
        assert_eq!(log.len(), 1);
        assert_eq!(records[0].root(), root_id);
        assert_eq!(records[0].host_root(), render.finished_work());
        assert_eq!(records[0].fiber(), child);
        assert_eq!(records[0].alternate_fiber(), None);
        assert_eq!(records[0].tag(), FiberTag::HostText);
        assert_eq!(
            records[0].kind(),
            HostRootMutationPhaseRecordKind::Placement
        );
        assert_eq!(records[0].lanes(), Lanes::DEFAULT);
        assert_eq!(records[0].effect_flag(), FiberFlags::PLACEMENT);
        assert_eq!(records[0].state_node(), child_state_node);
        assert_eq!(records[0].pending_props(), child_props);
        assert_eq!(records[0].memoized_props(), child_props);
        assert_eq!(records[0].alternate_memoized_props(), None);
        assert_eq!(apply_log.root(), root_id);
        assert_eq!(apply_log.finished_work(), render.finished_work());
        assert_eq!(apply_log.len(), 1);
        assert_eq!(
            apply_records[0].source(),
            HostRootMutationApplyRecordSource::MutationPhase(
                HostRootMutationPhaseRecordKind::Placement
            )
        );
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(apply_records[0].parent(), render.finished_work());
        assert_eq!(apply_records[0].parent_tag(), FiberTag::HostRoot);
        assert_eq!(apply_records[0].fiber(), child);
        assert_eq!(apply_records[0].alternate_fiber(), None);
        assert_eq!(apply_records[0].tag(), FiberTag::HostText);
        assert_eq!(apply_records[0].state_node(), child_state_node);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_deletion_lists_in_finished_tree_order_without_cleanup() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let fixture = attach_deletion_metadata_fixture(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let deletion_lists = commit.deletion_lists();
        let apply_records = commit.mutation_apply_log().records();

        assert_eq!(deletion_lists.len(), 2);
        assert_eq!(deletion_lists[0].parent(), fixture.first_parent);
        assert_eq!(deletion_lists[0].list(), fixture.first_list);
        assert_eq!(
            deletion_lists[0].deleted(),
            &[fixture.second_deleted, fixture.first_deleted]
        );
        assert_eq!(deletion_lists[1].parent(), fixture.second_parent);
        assert_eq!(deletion_lists[1].list(), fixture.second_list);
        assert_eq!(deletion_lists[1].deleted(), &[fixture.third_deleted]);
        assert_eq!(apply_records.len(), 3);
        assert_eq!(
            apply_records[0].source(),
            HostRootMutationApplyRecordSource::DeletionList(fixture.first_list)
        );
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        );
        assert_eq!(apply_records[0].parent(), fixture.first_parent);
        assert_eq!(
            apply_records[0].parent_state_node(),
            fixture.first_parent_state_node
        );
        assert_eq!(apply_records[0].fiber(), fixture.second_deleted);
        assert_eq!(
            apply_records[0].state_node(),
            fixture.second_deleted_state_node
        );
        assert_eq!(apply_records[1].fiber(), fixture.first_deleted);
        assert_eq!(
            apply_records[1].parent_state_node(),
            fixture.first_parent_state_node
        );
        assert_eq!(
            apply_records[1].state_node(),
            fixture.first_deleted_state_node
        );
        assert_eq!(
            apply_records[2].source(),
            HostRootMutationApplyRecordSource::DeletionList(fixture.second_list)
        );
        assert_eq!(apply_records[2].parent(), fixture.second_parent);
        assert_eq!(
            apply_records[2].parent_state_node(),
            fixture.second_parent_state_node
        );
        assert_eq!(apply_records[2].fiber(), fixture.third_deleted);
        assert_eq!(
            apply_records[2].state_node(),
            fixture.third_deleted_state_node
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert!(
            store
                .fiber_arena()
                .deletion_list(fixture.first_list)
                .is_some()
        );
        assert!(
            store
                .fiber_arena()
                .deletion_list(fixture.second_list)
                .is_some()
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.first_parent)
                .unwrap()
                .deletions(),
            Some(fixture.first_list)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_host_root_child_update_metadata_without_invoking_host_commit() {
        let (mut store, root_id, host) = root_store();
        let current_root = store.root(root_id).unwrap().current();
        let current_props = PropsHandle::from_raw(801);
        let next_pending_props = PropsHandle::from_raw(802);
        let next_memoized_props = PropsHandle::from_raw(803);
        let state_node = StateNodeHandle::from_raw(804);
        let current_child = attach_host_root_child(
            &mut store,
            current_root,
            FiberTag::HostComponent,
            FiberFlags::NO,
            state_node,
            current_props,
            current_props,
        );
        update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_child = attach_host_root_child(
            &mut store,
            render.finished_work(),
            FiberTag::HostComponent,
            FiberFlags::UPDATE,
            state_node,
            next_pending_props,
            next_memoized_props,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_child, finished_child)
            .unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let records = commit.mutation_log().records();
        let apply_records = commit.mutation_apply_log().records();

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].kind(), HostRootMutationPhaseRecordKind::Update);
        assert_eq!(records[0].fiber(), finished_child);
        assert_eq!(records[0].alternate_fiber(), Some(current_child));
        assert_eq!(records[0].tag(), FiberTag::HostComponent);
        assert_eq!(records[0].state_node(), state_node);
        assert_eq!(records[0].pending_props(), next_pending_props);
        assert_eq!(records[0].memoized_props(), next_memoized_props);
        assert_eq!(records[0].alternate_memoized_props(), Some(current_props));
        assert_eq!(apply_records.len(), 1);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        );
        assert_eq!(apply_records[0].fiber(), finished_child);
        assert_eq!(apply_records[0].alternate_fiber(), Some(current_child));
        assert_eq!(apply_records[0].state_node(), state_node);
        assert_eq!(
            apply_records[0].alternate_memoized_props(),
            Some(current_props)
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_rejects_invalid_deletion_list_before_switch_or_callback_drain() {
        let (mut store, root_id, host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(123);
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(46),
            Some(callback),
        )
        .unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let fixture = attach_deletion_metadata_fixture(&mut store, render.finished_work());
        let callbacks_before = store
            .update_queues()
            .peek_root_update_callback_records(render.work_in_progress_update_queue())
            .unwrap();
        let parent_node = store
            .fiber_arena_mut()
            .get_mut(fixture.first_parent)
            .unwrap();
        parent_node.set_flags(parent_node.flags() - FiberFlags::CHILD_DELETION);

        let error = commit_finished_host_root(&mut store, render).unwrap_err();
        let callbacks_after = store
            .update_queues()
            .peek_root_update_callback_records(render.work_in_progress_update_queue())
            .unwrap();

        assert!(matches!(
            error,
            RootCommitError::FiberTopology(FiberTopologyError::DeletionListMissingFlag {
                parent,
                list,
            }) if parent == fixture.first_parent && list == fixture.first_list
        ));
        assert_eq!(callback_handles(callbacks_before.visible()), vec![callback]);
        assert_eq!(callback_handles(callbacks_after.visible()), vec![callback]);
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            pending_lanes
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.finished_work())
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_placement_before_update_without_deletion_records() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(47), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let child = attach_host_root_child(
            &mut store,
            render.finished_work(),
            FiberTag::HostComponent,
            FiberFlags::PLACEMENT | FiberFlags::UPDATE | FiberFlags::CHILD_DELETION,
            StateNodeHandle::from_raw(900),
            PropsHandle::from_raw(901),
            PropsHandle::from_raw(902),
        );

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let records = commit.mutation_log().records();
        let apply_records = commit.mutation_apply_log().records();

        assert_eq!(records.len(), 2);
        assert_eq!(
            records[0].kind(),
            HostRootMutationPhaseRecordKind::Placement
        );
        assert_eq!(records[1].kind(), HostRootMutationPhaseRecordKind::Update);
        assert_eq!(records[0].fiber(), child);
        assert_eq!(records[1].fiber(), child);
        assert_eq!(records[0].effect_flag(), FiberFlags::PLACEMENT);
        assert_eq!(records[1].effect_flag(), FiberFlags::UPDATE);
        assert_eq!(apply_records.len(), 2);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(
            apply_records[1].kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        );
        assert_eq!(apply_records[0].fiber(), child);
        assert_eq!(apply_records[1].fiber(), child);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_pending_passive_handoff_without_effect_traversal() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(44), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(root_id, Lanes::NO);

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let handoff = commit.pending_passive_handoff().unwrap();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.finished_work(), render.finished_work());
        assert_eq!(handoff.lanes(), Lanes::DEFAULT);
        assert_eq!(pending_passive.root(), Some(root_id));
        assert_eq!(
            pending_passive.finished_work(),
            Some(render.finished_work())
        );
        assert_eq!(pending_passive.lanes(), Lanes::DEFAULT);
        assert!(pending_passive.has_commit_handoff());
        assert!(!pending_passive.has_effects());
        assert!(pending_passive.passive_unmounts().is_empty());
        assert!(pending_passive.passive_mounts().is_empty());
        assert!(commit.root_update_callbacks().is_empty());
        assert!(commit.ref_commit_metadata().is_empty());
        assert!(commit.dom_ref_callback_commit_gate().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_queues_function_component_passive_metadata_into_handoff_without_effects() {
        let (mut store, root_id, host) = root_store();
        let current_root = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(710);
        let current_function = append_function_component_child(
            &mut store,
            current_root,
            PropsHandle::from_raw(711),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(712),
                deps(713),
                Some(callback(714)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_function = append_function_component_child(
            &mut store,
            render.finished_work(),
            PropsHandle::from_raw(715),
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
                callback(716),
                deps(717),
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

        assert_eq!(queued.root(), root_id);
        assert_eq!(queued.fiber(), finished_function);
        assert_eq!(queued.phase(), FunctionComponentHookRenderPhase::Update);
        assert_eq!(queued.lanes(), Lanes::DEFAULT);
        assert_eq!(queued.records().len(), 1);
        assert_eq!(queued.queued_unmount_count(), 1);
        assert_eq!(queued.queued_mount_count(), 1);
        let queued_effect = queued.records()[0];
        assert_eq!(queued_effect.fiber(), finished_function);
        assert_eq!(queued_effect.effect_index(), 0);
        assert_eq!(queued_effect.effect(), registration.effect());
        assert_eq!(queued_effect.instance(), previous.instance());
        assert_eq!(queued_effect.instance(), registration.instance());
        assert_eq!(queued_effect.destroy(), Some(callback(714)));
        assert_eq!(queued_effect.lanes(), Lanes::DEFAULT);
        assert!(
            queued_effect.unmount_order().unwrap().flush_rank()
                < queued_effect.mount_order().flush_rank()
        );
        let phase_records = queued.effect_phase_records();
        assert_eq!(phase_records.len(), 2);
        assert_eq!(phase_records[0].fiber(), finished_function);
        assert_eq!(phase_records[0].effect_index(), 0);
        assert_eq!(phase_records[0].effect(), registration.effect());
        assert_eq!(phase_records[0].instance(), registration.instance());
        assert_eq!(phase_records[0].destroy(), Some(callback(714)));
        assert_eq!(phase_records[0].lanes(), Lanes::DEFAULT);
        assert_eq!(phase_records[0].phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(
            phase_records[0].order(),
            queued_effect.unmount_order().unwrap()
        );
        assert_eq!(phase_records[1].fiber(), finished_function);
        assert_eq!(phase_records[1].effect_index(), 0);
        assert_eq!(phase_records[1].effect(), registration.effect());
        assert_eq!(phase_records[1].instance(), registration.instance());
        assert_eq!(phase_records[1].destroy(), None);
        assert_eq!(phase_records[1].lanes(), Lanes::DEFAULT);
        assert_eq!(phase_records[1].phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(phase_records[1].order(), queued_effect.mount_order());
        assert!(phase_records[0].order() < phase_records[1].order());

        let pending_before_commit = store.root(root_id).unwrap().scheduling().pending_passive();
        assert_eq!(pending_before_commit.root(), Some(root_id));
        assert_eq!(pending_before_commit.finished_work(), None);
        assert_eq!(pending_before_commit.passive_unmounts().len(), 1);
        assert_eq!(pending_before_commit.passive_mounts().len(), 1);
        assert_eq!(
            pending_before_commit.passive_unmounts()[0].fiber(),
            finished_function
        );
        assert_eq!(
            pending_before_commit.passive_mounts()[0].fiber(),
            finished_function
        );
        assert_eq!(
            pending_before_commit.passive_unmounts()[0].unmount_origin(),
            Some(PendingPassiveUnmountOrigin::UpdatedFiber)
        );

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let handoff = commit.pending_passive_handoff().unwrap();
        let pending_after_commit = store.root(root_id).unwrap().scheduling().pending_passive();

        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.finished_work(), render.finished_work());
        assert_eq!(handoff.lanes(), Lanes::DEFAULT);
        assert_eq!(handoff.pending_unmount_count(), 1);
        assert_eq!(handoff.pending_mount_count(), 1);
        assert_eq!(handoff.pending_record_count(), 2);
        assert_eq!(
            pending_after_commit.finished_work(),
            Some(render.finished_work())
        );
        assert_eq!(
            hook_store
                .hook_effects()
                .get_instance(previous.instance())
                .unwrap()
                .destroy(),
            Some(callback(714))
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_ref_attach_metadata_with_commit_instance_token() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let ref_handle = RefHandle::from_raw(101);
        let state_node = StateNodeHandle::from_raw(201);
        let child = append_host_ref_child(
            &mut store,
            render.work_in_progress(),
            ref_handle,
            state_node,
            FiberFlags::REF,
        );
        store
            .fiber_arena_mut()
            .get_mut(render.work_in_progress())
            .unwrap()
            .set_subtree_flags(FiberFlags::REF);

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let refs = commit.ref_commit_metadata();
        let gate = commit.dom_ref_callback_commit_gate();

        assert!(refs.detach().is_empty());
        assert_eq!(refs.attach().len(), 1);
        assert_eq!(refs.len(), 1);
        let attach = refs.attach()[0];
        assert_eq!(attach.root(), root_id);
        assert_eq!(attach.fiber(), child);
        assert_eq!(attach.state_node(), state_node);
        assert_eq!(attach.ref_handle(), ref_handle);
        assert_eq!(attach.action(), HostRootRefCommitAction::Attach);
        assert_eq!(attach.detach_reason(), None);
        assert_eq!(attach.token_phase(), HostFiberTokenPhase::Commit);
        assert_eq!(attach.token_target(), HostFiberTokenTarget::Instance);
        assert_active_ref_token(&store, &attach);
        assert_dom_ref_callback_gate_is_inert(gate);
        assert_eq!(gate.len(), 1);
        let gate_record = gate.records()[0];
        assert_eq!(gate_record.sequence(), 0);
        assert_eq!(gate_record.root(), root_id);
        assert_eq!(gate_record.fiber(), child);
        assert_eq!(gate_record.state_node(), state_node);
        assert_eq!(gate_record.ref_handle(), ref_handle);
        assert_eq!(gate_record.token(), attach.token());
        assert_eq!(gate_record.token_phase(), HostFiberTokenPhase::Commit);
        assert_eq!(gate_record.token_target(), HostFiberTokenTarget::Instance);
        assert_eq!(gate_record.action(), HostRootRefCommitAction::Attach);
        assert_eq!(gate_record.detach_reason(), None);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.work_in_progress()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_changed_ref_detach_before_new_ref_attach_metadata() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let old_ref = RefHandle::from_raw(111);
        let new_ref = RefHandle::from_raw(112);
        let old_state_node = StateNodeHandle::from_raw(211);
        let new_state_node = StateNodeHandle::from_raw(212);
        let current_child =
            append_host_ref_child(&mut store, current, old_ref, old_state_node, FiberFlags::NO);

        update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_child = append_host_ref_child(
            &mut store,
            render.work_in_progress(),
            new_ref,
            new_state_node,
            FiberFlags::REF,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_child, finished_child)
            .unwrap();
        store
            .fiber_arena_mut()
            .get_mut(render.work_in_progress())
            .unwrap()
            .set_subtree_flags(FiberFlags::REF);

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let refs = commit.ref_commit_metadata();
        let gate = commit.dom_ref_callback_commit_gate();

        assert_eq!(refs.detach().len(), 1);
        assert_eq!(refs.attach().len(), 1);
        let detach = refs.detach()[0];
        assert_eq!(detach.fiber(), current_child);
        assert_eq!(detach.state_node(), old_state_node);
        assert_eq!(detach.ref_handle(), old_ref);
        assert_eq!(detach.action(), HostRootRefCommitAction::Detach);
        assert_eq!(
            detach.detach_reason(),
            Some(HostRootRefDetachReason::RefChanged)
        );
        assert_eq!(detach.token_phase(), HostFiberTokenPhase::Deletion);
        assert_eq!(detach.token_target(), HostFiberTokenTarget::Instance);
        assert_active_ref_token(&store, &detach);

        let attach = refs.attach()[0];
        assert_eq!(attach.fiber(), finished_child);
        assert_eq!(attach.state_node(), new_state_node);
        assert_eq!(attach.ref_handle(), new_ref);
        assert_eq!(attach.action(), HostRootRefCommitAction::Attach);
        assert_eq!(attach.token_phase(), HostFiberTokenPhase::Commit);
        assert_active_ref_token(&store, &attach);
        assert_dom_ref_callback_gate_is_inert(gate);
        assert_eq!(gate.len(), 2);
        assert_eq!(gate.records()[0].sequence(), 0);
        assert_eq!(gate.records()[0].fiber(), current_child);
        assert_eq!(gate.records()[0].token(), detach.token());
        assert_eq!(gate.records()[0].action(), HostRootRefCommitAction::Detach);
        assert_eq!(
            gate.records()[0].detach_reason(),
            Some(HostRootRefDetachReason::RefChanged)
        );
        assert_eq!(gate.records()[1].sequence(), 1);
        assert_eq!(gate.records()[1].fiber(), finished_child);
        assert_eq!(gate.records()[1].token(), attach.token());
        assert_eq!(gate.records()[1].action(), HostRootRefCommitAction::Attach);
        assert_eq!(gate.records()[1].detach_reason(), None);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_deleted_ref_detach_metadata_in_parent_before_child_order() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(47), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let deleted_parent = create_host_ref_fiber(
            &mut store,
            RefHandle::from_raw(121),
            StateNodeHandle::from_raw(221),
            FiberFlags::NO,
        );
        let deleted_child = create_host_ref_fiber(
            &mut store,
            RefHandle::from_raw(122),
            StateNodeHandle::from_raw(222),
            FiberFlags::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(deleted_parent, &[deleted_child])
            .unwrap();
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(render.work_in_progress(), deleted_parent)
            .unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let refs = commit.ref_commit_metadata();
        let gate = commit.dom_ref_callback_commit_gate();

        assert_eq!(refs.attach().len(), 0);
        assert_eq!(refs.detach().len(), 2);
        assert_eq!(refs.detach()[0].fiber(), deleted_parent);
        assert_eq!(refs.detach()[0].ref_handle(), RefHandle::from_raw(121));
        assert_eq!(
            refs.detach()[0].detach_reason(),
            Some(HostRootRefDetachReason::Deleted)
        );
        assert_eq!(
            refs.detach()[0].token_phase(),
            HostFiberTokenPhase::Deletion
        );
        assert_eq!(refs.detach()[1].fiber(), deleted_child);
        assert_eq!(refs.detach()[1].ref_handle(), RefHandle::from_raw(122));
        assert_eq!(
            refs.detach()[1].detach_reason(),
            Some(HostRootRefDetachReason::Deleted)
        );
        for record in refs.detach() {
            assert_eq!(record.action(), HostRootRefCommitAction::Detach);
            assert_eq!(record.token_target(), HostFiberTokenTarget::Instance);
            assert_active_ref_token(&store, record);
        }
        assert_dom_ref_callback_gate_is_inert(gate);
        assert_eq!(gate.len(), 2);
        assert_eq!(gate.records()[0].sequence(), 0);
        assert_eq!(gate.records()[0].fiber(), deleted_parent);
        assert_eq!(gate.records()[0].token(), refs.detach()[0].token());
        assert_eq!(gate.records()[0].action(), HostRootRefCommitAction::Detach);
        assert_eq!(
            gate.records()[0].detach_reason(),
            Some(HostRootRefDetachReason::Deleted)
        );
        assert_eq!(gate.records()[1].sequence(), 1);
        assert_eq!(gate.records()[1].fiber(), deleted_child);
        assert_eq!(gate.records()[1].token(), refs.detach()[1].token());
        assert_eq!(gate.records()[1].action(), HostRootRefCommitAction::Detach);
        assert_eq!(
            gate.records()[1].detach_reason(),
            Some(HostRootRefDetachReason::Deleted)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_rejects_ref_metadata_without_host_state_node_before_switching_current() {
        let (mut store, root_id, _host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(48), None).unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let child = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        {
            let node = store.fiber_arena_mut().get_mut(child).unwrap();
            node.set_ref_handle(RefHandle::from_raw(131));
            node.set_flags(FiberFlags::REF);
        }
        store
            .fiber_arena_mut()
            .set_children(render.work_in_progress(), &[child])
            .unwrap();
        store
            .fiber_arena_mut()
            .get_mut(render.work_in_progress())
            .unwrap()
            .set_subtree_flags(FiberFlags::REF);

        let error = commit_finished_host_root(&mut store, render).unwrap_err();

        assert!(matches!(
            error,
            RootCommitError::RefHostInstanceMissing {
                root,
                fiber
            } if root == root_id && fiber == child
        ));
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert!(store.host_tokens().is_empty());
    }

    #[test]
    fn dom_ref_callback_gate_revalidates_source_tokens_by_phase_and_target() {
        let (mut store, root_id, _host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(49), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let ref_handle = RefHandle::from_raw(141);
        let state_node = StateNodeHandle::from_raw(241);
        append_host_ref_child(
            &mut store,
            render.work_in_progress(),
            ref_handle,
            state_node,
            FiberFlags::REF,
        );
        store
            .fiber_arena_mut()
            .get_mut(render.work_in_progress())
            .unwrap()
            .set_subtree_flags(FiberFlags::REF);
        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let metadata = commit.ref_commit_metadata().clone();
        let attach = metadata.attach()[0];
        store
            .host_tokens_mut()
            .invalidate(attach.token(), attach.token_phase(), attach.token_target())
            .unwrap();

        let error = materialize_dom_ref_callback_commit_gate(&store, &metadata).unwrap_err();

        assert!(matches!(
            error,
            RootCommitError::HostFiberToken(error)
                if error.violation() == HostFiberTokenViolation::Stale
                    && error.phase() == HostFiberTokenPhase::Commit
                    && error.target() == HostFiberTokenTarget::Instance
        ));
    }

    #[test]
    fn dom_ref_callback_gate_rejects_invalid_source_metadata_shape() {
        let (mut store, root_id, _host) = root_store();
        let fiber = create_host_ref_fiber(
            &mut store,
            RefHandle::from_raw(151),
            StateNodeHandle::from_raw(251),
            FiberFlags::NO,
        );
        let token = store.host_tokens_mut().issue(
            root_id,
            fiber,
            HostFiberTokenPhase::Commit,
            HostFiberTokenTarget::Instance,
        );
        let metadata = HostRootRefCommitSnapshot {
            detach: Vec::new(),
            attach: vec![HostRootRefCommitRecord {
                root: root_id,
                fiber,
                state_node: StateNodeHandle::from_raw(251),
                ref_handle: RefHandle::from_raw(151),
                token,
                token_phase: HostFiberTokenPhase::Commit,
                token_target: HostFiberTokenTarget::Instance,
                action: HostRootRefCommitAction::Attach,
                detach_reason: Some(HostRootRefDetachReason::RefChanged),
            }],
        };

        let error = materialize_dom_ref_callback_commit_gate(&store, &metadata).unwrap_err();

        assert!(matches!(
            error,
            RootCommitError::DomRefCallbackGateDetachReasonMismatch {
                root,
                fiber: error_fiber,
                action: "attach",
                detach_reason: Some("ref-changed")
            } if root == root_id && error_fiber == fiber
        ));
    }

    #[test]
    fn root_commit_marks_finished_lanes_and_keeps_skipped_lanes_pending() {
        let (mut store, root_id, _host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(11), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let current = store.root(root_id).unwrap().current();
        let current_queue = store.fiber_arena().get(current).unwrap().update_queue();

        assert_eq!(commit.finished_lanes(), Lanes::SYNC);
        assert_eq!(commit.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(commit.pending_lanes(), Lanes::DEFAULT);
        assert!(commit.has_remaining_work());
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );
        assert_eq!(host_root_element(&store, current), RootElementHandle::NONE);
        assert_eq!(
            store
                .update_queues()
                .base_updates(current_queue)
                .unwrap()
                .len(),
            1
        );
    }

    #[test]
    fn root_commit_clears_consumed_render_and_callback_bookkeeping() {
        let (mut store, root_id, host) = root_store();
        let callback_node = scheduled_callback_node(&mut store, root_id);

        let render_result = render_host_root_via_scheduler_callback(
            &mut store,
            root_id,
            callback_node,
            Lanes::DEFAULT,
        )
        .unwrap();
        let render = render_result.render_phase().unwrap();
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            callback_node
        );

        commit_finished_host_root(&mut store, render).unwrap();
        let scheduling = store.root(root_id).unwrap().scheduling();

        assert_eq!(scheduling.work_in_progress(), None);
        assert_eq!(scheduling.work_in_progress_root_render_lanes(), Lanes::NO);
        assert_eq!(
            scheduling.render_exit_status(),
            RootRenderExitStatus::NoWork
        );
        assert!(scheduling.callback_node().is_none());
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_rejects_stale_render_record_after_current_switch() {
        let (mut store, root_id, _host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(5), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        commit_finished_host_root(&mut store, render).unwrap();
        let error = commit_finished_host_root(&mut store, render).unwrap_err();

        assert!(matches!(
            error,
            RootCommitError::CurrentMismatch { root, .. } if root == root_id
        ));
    }

    #[test]
    fn root_commit_rejects_wrong_root_pending_passive_handoff_before_switching_current() {
        let (mut store, root_id, _host) = root_store();
        let wrong_root = FiberRootId::new(root_id.raw() + 1).unwrap();
        update_container(&mut store, root_id, RootElementHandle::from_raw(6), None).unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(wrong_root, Lanes::DEFAULT);

        let error = commit_finished_host_root(&mut store, render).unwrap_err();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert!(matches!(
            error,
            RootCommitError::PendingPassiveRootMismatch { root, pending_root }
                if root == root_id && pending_root == wrong_root
        ));
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(pending_passive.root(), Some(wrong_root));
        assert_eq!(pending_passive.finished_work(), None);
        assert_eq!(pending_passive.lanes(), Lanes::DEFAULT);
        assert!(!pending_passive.has_commit_handoff());
    }

    #[test]
    fn root_commit_hands_off_visible_root_update_callback_records() {
        let (mut store, root_id, host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(77);
        let update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(12),
            Some(callback),
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let callbacks = commit.root_update_callbacks();

        assert_eq!(callbacks.queue(), render.work_in_progress_update_queue());
        assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
        assert_eq!(
            callbacks.visible()[0].queue(),
            render.work_in_progress_update_queue()
        );
        assert_eq!(callbacks.visible()[0].update(), update.update());
        assert_eq!(callbacks.visible()[0].sequence(), 0);
        assert_eq!(
            callbacks.visible()[0].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert!(callbacks.hidden().is_empty());
        assert!(callbacks.deferred_hidden().is_empty());
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.work_in_progress()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_drains_visible_callback_records_only_once() {
        let (mut store, root_id, _host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(88);
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(13),
            Some(callback),
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let current_queue = store
            .fiber_arena()
            .get(commit.current())
            .unwrap()
            .update_queue();
        let second_take = store
            .update_queues_mut()
            .take_root_update_callback_records(current_queue)
            .unwrap();
        let stale_commit_error = commit_finished_host_root(&mut store, render).unwrap_err();
        let after_stale_commit = store
            .update_queues_mut()
            .take_root_update_callback_records(current_queue)
            .unwrap();

        assert_eq!(
            callback_handles(commit.root_update_callbacks().visible()),
            vec![callback]
        );
        assert!(second_take.is_empty());
        assert!(matches!(
            stale_commit_error,
            RootCommitError::CurrentMismatch { root, .. } if root == root_id
        ));
        assert!(after_stale_commit.is_empty());
    }

    #[test]
    fn root_commit_defers_hidden_callbacks_without_visible_invocation_records() {
        let (mut store, root_id, host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(99);
        let update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(14),
            Some(callback),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(update.update())
            .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let callbacks = commit.root_update_callbacks();
        let current_queue = store
            .fiber_arena()
            .get(commit.current())
            .unwrap()
            .update_queue();
        let after_commit = store
            .update_queues()
            .peek_root_update_callback_records(current_queue)
            .unwrap();

        assert!(callbacks.visible().is_empty());
        assert!(callbacks.hidden().is_empty());
        assert_eq!(
            callback_handles(callbacks.deferred_hidden()),
            vec![callback]
        );
        assert_eq!(callbacks.deferred_hidden()[0].update(), update.update());
        assert_eq!(
            callbacks.deferred_hidden()[0].visibility(),
            RootUpdateCallbackVisibility::DeferredHidden
        );
        assert!(after_commit.visible().is_empty());
        assert!(after_commit.hidden().is_empty());
        assert_eq!(
            callback_handles(after_commit.deferred_hidden()),
            vec![callback]
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    fn callback_handles(records: &[RootUpdateCallbackRecord]) -> Vec<RootUpdateCallbackHandle> {
        records.iter().map(|record| record.callback()).collect()
    }

    fn create_host_ref_fiber(
        store: &mut FiberRootStore<RecordingHost>,
        ref_handle: RefHandle,
        state_node: StateNodeHandle,
        flags: FiberFlags,
    ) -> FiberId {
        let fiber = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
        node.set_state_node(state_node);
        node.set_ref_handle(ref_handle);
        node.set_flags(flags);
        fiber
    }

    fn append_host_ref_child(
        store: &mut FiberRootStore<RecordingHost>,
        parent: FiberId,
        ref_handle: RefHandle,
        state_node: StateNodeHandle,
        flags: FiberFlags,
    ) -> FiberId {
        let child = create_host_ref_fiber(store, ref_handle, state_node, flags);
        store
            .fiber_arena_mut()
            .set_children(parent, &[child])
            .unwrap();
        child
    }

    fn assert_active_ref_token(
        store: &FiberRootStore<RecordingHost>,
        record: &HostRootRefCommitRecord,
    ) {
        store
            .host_tokens()
            .validate(
                record.token(),
                record.root(),
                record.fiber(),
                record.token_phase(),
                record.token_target(),
            )
            .unwrap();
        let metadata = store
            .host_tokens()
            .metadata(record.token(), record.token_phase(), record.token_target())
            .unwrap();
        assert_eq!(metadata.root_id(), record.root());
        assert_eq!(metadata.phase(), record.token_phase());
        assert_eq!(metadata.target(), record.token_target());
        assert!(metadata.is_active());
    }

    fn assert_dom_ref_callback_gate_is_inert(gate: &HostRootDomRefCallbackCommitGateSnapshot) {
        assert!(!gate.callback_refs_invoked());
        assert!(!gate.object_refs_mutated());
        assert!(!gate.layout_effects_run());
        assert!(!gate.public_instances_exposed());
        assert!(!gate.react_dom_ref_compatibility_claimed());
        for record in gate.records() {
            assert_eq!(
                record.status(),
                HostRootDomRefCallbackCommitGateStatus::Blocked
            );
            assert_eq!(record.blockers(), &DOM_REF_CALLBACK_GATE_BLOCKERS);
        }
    }
}
