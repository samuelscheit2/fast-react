//! Minimal HostRoot current-switch commit foundation.
//!
//! This module consumes a completed HostRoot render-phase record and switches
//! `root.current` to that HostRoot work-in-progress fiber. It deliberately
//! stops before broad host mutation, public callback execution, public facade
//! behavior, DOM wiring, or test-renderer serialization. Narrow traversal and
//! test-control canaries in this module emit or consume private metadata for
//! renderer-owned handoffs without claiming public renderer compatibility.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    DeletionListId, ElementTypeHandle, FiberArena, FiberFlags, FiberId, FiberTag,
    FiberTopologyError, HookEffectCallbackHandle, HookEffectDependencies, HookEffectFlags,
    HookEffectId, HookEffectInstanceId, HookListId, Lane, Lanes, PropsHandle, RefHandle,
    RootFinishedLanes, StateHandle, StateNodeHandle, UpdateQueueHandle,
};
use fast_react_host_config::{HostFiberTokenPhase, HostFiberTokenTarget, HostTypes};

use crate::function_component::{
    FunctionComponentCommittedEffectQueue, FunctionComponentEffectDependencyPhase,
    FunctionComponentEffectDependencyStatus, FunctionComponentHookRenderPhase,
    FunctionComponentHookRenderState, FunctionComponentHookRenderStore,
    FunctionComponentLayoutEffectMetadata, FunctionComponentPassiveEffectMetadata,
};
use crate::root_callbacks::{
    RootUpdateCallbackInvocationExecutionGateSnapshot, RootUpdateCallbackInvocationGateSnapshot,
    RootUpdateCallbackInvocationTestControl, invoke_root_update_callbacks_under_test_control,
    materialize_root_update_callback_invocation_gate,
};
use crate::root_config::{
    PendingPassiveEffectOrder, PendingPassiveEffectPhase, PendingPassiveState,
    PendingPassiveUnmountOrigin, RootErrorOptionCallbackPhase, RootErrorOptionCallbackRecord,
};
use crate::unsupported_features::unsupported_reconciler_feature_for_fiber_tag;
use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostFiberTokenId,
    HostFiberTokenValidationError, HostRootRenderPhaseRecord, HostRootStateStoreError,
    RootCallbackPriority, RootErrorCallbackHandle, RootRecoverableErrorCallbackHandle,
    RootRenderExitStatus, RootSchedulerCallbackHandle, RootSchedulingState,
    RootUpdateCallbackHandle, RootUpdateCallbackRecord, RootUpdateCallbackSnapshot,
    RootUpdateCallbackVisibility, TestRendererHostOutputCanaryError,
    TestRendererHostOutputCanaryPreparedFibers, TestRendererHostOutputCanaryUpdatedFibers,
    UpdateId, UpdateQueueError,
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
    FunctionComponentCommittedEffectQueue {
        fiber: FiberId,
        message: String,
    },
    FunctionComponentLayoutEffectQueue {
        fiber: FiberId,
        message: String,
    },
    LayoutEffectHandoffCurrentMismatch {
        root: FiberRootId,
        commit_current: FiberId,
        store_current: FiberId,
    },
    LayoutEffectHandoffLanesMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected: Lanes,
        actual: Lanes,
    },
    LayoutEffectHandoffFiberMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: FiberId,
    },
    LayoutEffectHandoffRecordMismatch {
        root: FiberRootId,
        fiber: FiberId,
        effect: HookEffectId,
        message: String,
    },
    LayoutEffectCallbackExecutionPassiveRecordRejected {
        root: FiberRootId,
        fiber: FiberId,
        effect: Option<HookEffectId>,
    },
    LayoutEffectCallbackExecutionStaleEffectRing {
        root: FiberRootId,
        fiber: FiberId,
        hook_list: HookListId,
        current_list: Option<HookListId>,
    },
    LayoutEffectCallbackExecutionUnsupportedFiberTag {
        root: FiberRootId,
        fiber: FiberId,
        tag: FiberTag,
        unsupported_feature: Option<&'static str>,
    },
    LayoutEffectCallbackExecutionRecordMismatch {
        root: FiberRootId,
        fiber: FiberId,
        effect: Option<HookEffectId>,
        message: String,
    },
    CommittedPassiveEffectsWithoutPendingPassiveHandoff {
        root: FiberRootId,
    },
    CommittedPassiveEffectHandoffRootMismatch {
        commit_root: FiberRootId,
        handoff_root: FiberRootId,
    },
    CommittedPassiveEffectHandoffLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    CommittedPassiveEffectHandoffPendingRootMismatch {
        commit_root: FiberRootId,
        pending_root: Option<FiberRootId>,
    },
    CommittedPassiveEffectHandoffFinishedWorkMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: Option<FiberId>,
    },
    CommittedPassiveEffectHandoffRecordCountMismatch {
        root: FiberRootId,
        expected_unmounts: usize,
        actual_unmounts: usize,
        expected_mounts: usize,
        actual_mounts: usize,
    },
    CommittedPassiveEffectHandoffDuplicateOrder {
        root: FiberRootId,
        order: PendingPassiveEffectOrder,
    },
    CommittedPassiveEffectHandoffFiberStale {
        root: FiberRootId,
        finished_work: FiberId,
        fiber: FiberId,
    },
    CommittedPassiveEffectHandoffCommittedQueueMissing {
        root: FiberRootId,
        fiber: FiberId,
    },
    CommittedPassiveEffectHandoffRecordMismatch {
        root: FiberRootId,
        fiber: FiberId,
        effect: Option<HookEffectId>,
        message: String,
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
            Self::FunctionComponentCommittedEffectQueue { fiber, message } => write!(
                formatter,
                "function component fiber {} committed hook-effect queue failed before passive traversal: {}",
                fiber.slot().get(),
                message
            ),
            Self::FunctionComponentLayoutEffectQueue { fiber, message } => write!(
                formatter,
                "function component fiber {} committed hook-effect queue failed before layout handoff: {}",
                fiber.slot().get(),
                message
            ),
            Self::LayoutEffectHandoffCurrentMismatch {
                root,
                commit_current,
                store_current,
            } => write!(
                formatter,
                "root {} layout effect handoff expected committed current fiber slot {}, found store current fiber slot {}",
                root.raw(),
                commit_current.slot().get(),
                store_current.slot().get()
            ),
            Self::LayoutEffectHandoffLanesMismatch {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} layout effect handoff for function component fiber slot {} expected committed lanes {:?}, found stale lanes {:?}",
                root.raw(),
                fiber.slot().get(),
                expected,
                actual
            ),
            Self::LayoutEffectHandoffFiberMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} layout effect handoff expected committed queue for function component fiber slot {}, found fiber slot {}",
                root.raw(),
                expected.slot().get(),
                actual.slot().get()
            ),
            Self::LayoutEffectHandoffRecordMismatch {
                root,
                fiber,
                effect,
                message,
            } => write!(
                formatter,
                "root {} layout effect handoff rejected mismatched function component fiber slot {} effect slot {}: {}",
                root.raw(),
                fiber.slot().get(),
                effect.slot().get(),
                message
            ),
            Self::LayoutEffectCallbackExecutionPassiveRecordRejected {
                root,
                fiber,
                effect,
            } => write!(
                formatter,
                "root {} layout effect callback execution rejected passive-phase record for fiber slot {} effect {:?}",
                root.raw(),
                fiber.slot().get(),
                effect.map(|effect| effect.slot().get())
            ),
            Self::LayoutEffectCallbackExecutionStaleEffectRing {
                root,
                fiber,
                hook_list,
                current_list,
            } => write!(
                formatter,
                "root {} layout effect callback execution found stale effect ring for function component fiber slot {} hook list {:?}; current list is {:?}",
                root.raw(),
                fiber.slot().get(),
                hook_list,
                current_list
            ),
            Self::LayoutEffectCallbackExecutionUnsupportedFiberTag {
                root,
                fiber,
                tag,
                unsupported_feature,
            } => write!(
                formatter,
                "root {} layout effect callback execution expected FunctionComponent fiber slot {}, found {:?} unsupported feature {:?}",
                root.raw(),
                fiber.slot().get(),
                tag,
                unsupported_feature
            ),
            Self::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber,
                effect,
                message,
            } => write!(
                formatter,
                "root {} layout effect callback execution rejected mismatched fiber slot {} effect {:?}: {}",
                root.raw(),
                fiber.slot().get(),
                effect.map(|effect| effect.slot().get()),
                message
            ),
            Self::CommittedPassiveEffectsWithoutPendingPassiveHandoff { root } => write!(
                formatter,
                "root {} cannot record committed passive effect records without a pending passive commit handoff",
                root.raw()
            ),
            Self::CommittedPassiveEffectHandoffRootMismatch {
                commit_root,
                handoff_root,
            } => write!(
                formatter,
                "commit root {} cannot record committed passive effect records for root {}",
                commit_root.raw(),
                handoff_root.raw()
            ),
            Self::CommittedPassiveEffectHandoffLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} committed passive effect handoff lanes {:?} do not match committed lanes {:?}",
                root.raw(),
                actual,
                expected
            ),
            Self::CommittedPassiveEffectHandoffPendingRootMismatch {
                commit_root,
                pending_root,
            } => write!(
                formatter,
                "commit root {} cannot record committed passive effect records with pending passive root {:?}",
                commit_root.raw(),
                pending_root.map(FiberRootId::raw)
            ),
            Self::CommittedPassiveEffectHandoffFinishedWorkMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} committed passive effect handoff expected finished work fiber slot {}, found {:?}",
                root.raw(),
                expected.slot().get(),
                actual.map(|fiber| fiber.slot().get())
            ),
            Self::CommittedPassiveEffectHandoffRecordCountMismatch {
                root,
                expected_unmounts,
                actual_unmounts,
                expected_mounts,
                actual_mounts,
            } => write!(
                formatter,
                "root {} committed passive effect handoff expected {} unmount and {} mount records, found {} unmount and {} mount records",
                root.raw(),
                expected_unmounts,
                expected_mounts,
                actual_unmounts,
                actual_mounts
            ),
            Self::CommittedPassiveEffectHandoffDuplicateOrder { root, order } => write!(
                formatter,
                "root {} committed passive effect handoff has duplicate {:?} passive order {}",
                root.raw(),
                order.phase(),
                order.sequence()
            ),
            Self::CommittedPassiveEffectHandoffFiberStale {
                root,
                finished_work,
                fiber,
            } => write!(
                formatter,
                "root {} committed passive effect handoff fiber slot {} is not in committed finished work subtree rooted at slot {}",
                root.raw(),
                fiber.slot().get(),
                finished_work.slot().get()
            ),
            Self::CommittedPassiveEffectHandoffCommittedQueueMissing { root, fiber } => write!(
                formatter,
                "root {} committed passive effect handoff for function component fiber slot {} has no committed effect queue",
                root.raw(),
                fiber.slot().get()
            ),
            Self::CommittedPassiveEffectHandoffRecordMismatch {
                root,
                fiber,
                effect,
                message,
            } => write!(
                formatter,
                "root {} committed passive effect handoff rejected mismatched function component fiber slot {} effect slot {:?}: {}",
                root.raw(),
                fiber.slot().get(),
                effect.map(|effect| effect.slot().get()),
                message
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
            | Self::FunctionComponentCommittedEffectQueue { .. }
            | Self::FunctionComponentLayoutEffectQueue { .. }
            | Self::LayoutEffectHandoffCurrentMismatch { .. }
            | Self::LayoutEffectHandoffLanesMismatch { .. }
            | Self::LayoutEffectHandoffFiberMismatch { .. }
            | Self::LayoutEffectHandoffRecordMismatch { .. }
            | Self::LayoutEffectCallbackExecutionPassiveRecordRejected { .. }
            | Self::LayoutEffectCallbackExecutionStaleEffectRing { .. }
            | Self::LayoutEffectCallbackExecutionUnsupportedFiberTag { .. }
            | Self::LayoutEffectCallbackExecutionRecordMismatch { .. }
            | Self::CommittedPassiveEffectsWithoutPendingPassiveHandoff { .. }
            | Self::CommittedPassiveEffectHandoffRootMismatch { .. }
            | Self::CommittedPassiveEffectHandoffLanesMismatch { .. }
            | Self::CommittedPassiveEffectHandoffPendingRootMismatch { .. }
            | Self::CommittedPassiveEffectHandoffFinishedWorkMismatch { .. }
            | Self::CommittedPassiveEffectHandoffRecordCountMismatch { .. }
            | Self::CommittedPassiveEffectHandoffDuplicateOrder { .. }
            | Self::CommittedPassiveEffectHandoffFiberStale { .. }
            | Self::CommittedPassiveEffectHandoffCommittedQueueMissing { .. }
            | Self::CommittedPassiveEffectHandoffRecordMismatch { .. }
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

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootFinishedWorkPendingCommitRecordForCanary {
    root: FiberRootId,
    root_token: StateNodeHandle,
    previous_current: FiberId,
    pending_work: Option<FiberId>,
    finished_work: FiberId,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    remaining_lanes: Lanes,
    pending_lanes_before_commit: Lanes,
    handoff_order: usize,
}

#[cfg(test)]
impl HostRootFinishedWorkPendingCommitRecordForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn root_token(self) -> StateNodeHandle {
        self.root_token
    }

    #[must_use]
    pub(crate) const fn previous_current(self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub(crate) const fn pending_work(self) -> Option<FiberId> {
        self.pending_work
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
    pub(crate) const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before_commit(self) -> Lanes {
        self.pending_lanes_before_commit
    }

    #[must_use]
    pub(crate) const fn handoff_order(self) -> usize {
        self.handoff_order
    }

    #[must_use]
    pub(crate) fn records_finished_work(self) -> bool {
        matches!(self.pending_work, Some(pending_work) if pending_work == self.finished_work)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootFinishedWorkCommitHandoffRecordForCanary {
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    execution_request: HostRootFinishedWorkCommitExecutionRequestForCanary,
    commit_order: usize,
    commit: HostRootCommitRecord,
    current_after_commit: FiberId,
    finished_work_after_commit: Option<FiberId>,
    finished_lanes_after_commit: Lanes,
    render_phase_work_after_commit: Option<FiberId>,
}

#[cfg(test)]
impl HostRootFinishedWorkCommitHandoffRecordForCanary {
    #[must_use]
    pub(crate) const fn pending(&self) -> HostRootFinishedWorkPendingCommitRecordForCanary {
        self.pending
    }

    #[must_use]
    pub(crate) const fn execution_request(
        &self,
    ) -> &HostRootFinishedWorkCommitExecutionRequestForCanary {
        &self.execution_request
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub(crate) const fn current_after_commit(&self) -> FiberId {
        self.current_after_commit
    }

    #[must_use]
    pub(crate) const fn finished_work_after_commit(&self) -> Option<FiberId> {
        self.finished_work_after_commit
    }

    #[must_use]
    pub(crate) const fn finished_lanes_after_commit(&self) -> Lanes {
        self.finished_lanes_after_commit
    }

    #[must_use]
    pub(crate) const fn render_phase_work_after_commit(&self) -> Option<FiberId> {
        self.render_phase_work_after_commit
    }

    #[must_use]
    pub(crate) const fn commit_order_after_pending_record(&self) -> bool {
        self.commit_order > self.pending.handoff_order
    }

    #[must_use]
    pub(crate) const fn consumed_finished_work_record(&self) -> bool {
        self.finished_work_after_commit.is_none()
            && self.finished_lanes_after_commit.is_empty()
            && self.render_phase_work_after_commit.is_none()
    }

    #[must_use]
    pub(crate) const fn mutation_execution_blocked(&self) -> bool {
        self.execution_request.host_mutation_execution_blocked()
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        self.execution_request.public_root_rendering_blocked()
    }

    #[must_use]
    pub(crate) const fn effects_refs_and_hydration_blocked(&self) -> bool {
        self.execution_request.refs_effects_and_hydration_blocked()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootFinishedWorkCommitExecutionRequestForCanary {
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    request_order: usize,
    status: HostRootFinishedWorkCommitExecutionStatusForCanary,
    blockers: [HostRootFinishedWorkCommitExecutionBlockerForCanary; 7],
}

#[cfg(test)]
impl HostRootFinishedWorkCommitExecutionRequestForCanary {
    #[must_use]
    const fn new(
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        request_order: usize,
    ) -> Self {
        Self {
            pending,
            request_order,
            status: HostRootFinishedWorkCommitExecutionStatusForCanary::Requested,
            blockers: HOST_ROOT_FINISHED_WORK_COMMIT_EXECUTION_BLOCKERS,
        }
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.pending.root
    }

    #[must_use]
    pub(crate) const fn root_token(self) -> StateNodeHandle {
        self.pending.root_token
    }

    #[must_use]
    pub(crate) const fn previous_current(self) -> FiberId {
        self.pending.previous_current
    }

    #[must_use]
    pub(crate) const fn pending_work(self) -> Option<FiberId> {
        self.pending.pending_work
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.pending.finished_work
    }

    #[must_use]
    pub(crate) const fn render_lanes(self) -> Lanes {
        self.pending.render_lanes
    }

    #[must_use]
    pub(crate) const fn finished_lanes(self) -> Lanes {
        self.pending.finished_lanes
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(self) -> Lanes {
        self.pending.remaining_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before_commit(self) -> Lanes {
        self.pending.pending_lanes_before_commit
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(self) -> usize {
        self.pending.handoff_order
    }

    #[must_use]
    pub(crate) const fn request_order(self) -> usize {
        self.request_order
    }

    #[must_use]
    pub(crate) const fn status(self) -> HostRootFinishedWorkCommitExecutionStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) const fn execution_requested(self) -> bool {
        matches!(
            self.status,
            HostRootFinishedWorkCommitExecutionStatusForCanary::Requested
        )
    }

    #[must_use]
    pub(crate) fn accepted_current_finished_work_record_shape(self) -> bool {
        self.pending.records_finished_work()
    }

    #[must_use]
    pub(crate) const fn blockers(
        &self,
    ) -> &[HostRootFinishedWorkCommitExecutionBlockerForCanary; 7] {
        &self.blockers
    }

    #[must_use]
    pub(crate) const fn host_mutation_execution_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn ref_attach_detach_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn layout_effect_execution_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn passive_effect_execution_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn hydration_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn compatibility_claim_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn refs_effects_and_hydration_blocked(self) -> bool {
        self.ref_attach_detach_blocked()
            && self.layout_effect_execution_blocked()
            && self.passive_effect_execution_blocked()
            && self.hydration_blocked()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootFinishedWorkCommitExecutionStatusForCanary {
    Requested,
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootFinishedWorkCommitExecutionBlockerForCanary {
    HostMutationExecution,
    PublicRootRendering,
    RefAttachDetach,
    LayoutEffectExecution,
    PassiveEffectExecution,
    Hydration,
    PublicCompatibilityClaim,
}

#[cfg(test)]
const HOST_ROOT_FINISHED_WORK_COMMIT_EXECUTION_BLOCKERS:
    [HostRootFinishedWorkCommitExecutionBlockerForCanary; 7] = [
    HostRootFinishedWorkCommitExecutionBlockerForCanary::HostMutationExecution,
    HostRootFinishedWorkCommitExecutionBlockerForCanary::PublicRootRendering,
    HostRootFinishedWorkCommitExecutionBlockerForCanary::RefAttachDetach,
    HostRootFinishedWorkCommitExecutionBlockerForCanary::LayoutEffectExecution,
    HostRootFinishedWorkCommitExecutionBlockerForCanary::PassiveEffectExecution,
    HostRootFinishedWorkCommitExecutionBlockerForCanary::Hydration,
    HostRootFinishedWorkCommitExecutionBlockerForCanary::PublicCompatibilityClaim,
];

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootFinishedWorkCommitHandoffErrorForCanary {
    MissingFinishedWorkRecord {
        root: FiberRootId,
        finished_work: FiberId,
    },
    ForeignFinishedWorkRecord {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
        expected_root_token: StateNodeHandle,
        actual_root_token: StateNodeHandle,
    },
    StaleFinishedWorkRecord {
        root: FiberRootId,
        expected_current: FiberId,
        actual_current: FiberId,
        expected_pending_work: Option<FiberId>,
        actual_pending_work: Option<FiberId>,
        finished_work: FiberId,
    },
    AlreadyCommittedFinishedWorkRecord {
        root: FiberRootId,
        current: FiberId,
        finished_work: FiberId,
        pending_work_after_commit: Option<FiberId>,
        handoff_order: usize,
    },
    FinishedWorkRecordLanesMismatch {
        root: FiberRootId,
        expected_render_lanes: Lanes,
        actual_render_lanes: Lanes,
        expected_remaining_lanes: Lanes,
        actual_remaining_lanes: Lanes,
        expected_pending_lanes: Lanes,
        actual_pending_lanes: Lanes,
    },
    Commit(RootCommitError),
}

#[cfg(test)]
impl Display for HostRootFinishedWorkCommitHandoffErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingFinishedWorkRecord {
                root,
                finished_work,
            } => write!(
                formatter,
                "root {} has no finished-work-to-commit record for finished work fiber slot {}",
                root.raw(),
                finished_work.slot().get()
            ),
            Self::ForeignFinishedWorkRecord {
                expected_root,
                actual_root,
                expected_root_token,
                actual_root_token,
            } => write!(
                formatter,
                "finished-work-to-commit record for root {} token {} cannot be used for root {} token {}",
                actual_root.raw(),
                actual_root_token.raw(),
                expected_root.raw(),
                expected_root_token.raw()
            ),
            Self::StaleFinishedWorkRecord {
                root,
                expected_current,
                actual_current,
                expected_pending_work,
                actual_pending_work,
                finished_work,
            } => write!(
                formatter,
                "root {} stale finished-work-to-commit record for fiber slot {} expected current fiber slot {} and pending work {:?}, found current fiber slot {} and pending work {:?}",
                root.raw(),
                finished_work.slot().get(),
                expected_current.slot().get(),
                expected_pending_work.map(|fiber| fiber.slot().get()),
                actual_current.slot().get(),
                actual_pending_work.map(|fiber| fiber.slot().get())
            ),
            Self::AlreadyCommittedFinishedWorkRecord {
                root,
                current,
                finished_work,
                pending_work_after_commit,
                handoff_order,
            } => write!(
                formatter,
                "root {} finished-work-to-commit record order {} for fiber slot {} was already committed as current fiber slot {}; pending work after commit is {:?}",
                root.raw(),
                handoff_order,
                finished_work.slot().get(),
                current.slot().get(),
                pending_work_after_commit.map(|fiber| fiber.slot().get())
            ),
            Self::FinishedWorkRecordLanesMismatch {
                root,
                expected_render_lanes,
                actual_render_lanes,
                expected_remaining_lanes,
                actual_remaining_lanes,
                expected_pending_lanes,
                actual_pending_lanes,
            } => write!(
                formatter,
                "root {} finished-work-to-commit record lanes render {:?}/{:?}, remaining {:?}/{:?}, pending {:?}/{:?} do not match",
                root.raw(),
                actual_render_lanes,
                expected_render_lanes,
                actual_remaining_lanes,
                expected_remaining_lanes,
                actual_pending_lanes,
                expected_pending_lanes
            ),
            Self::Commit(error) => Display::fmt(error, formatter),
        }
    }
}

#[cfg(test)]
impl Error for HostRootFinishedWorkCommitHandoffErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Commit(error) => Some(error),
            Self::MissingFinishedWorkRecord { .. }
            | Self::ForeignFinishedWorkRecord { .. }
            | Self::StaleFinishedWorkRecord { .. }
            | Self::AlreadyCommittedFinishedWorkRecord { .. }
            | Self::FinishedWorkRecordLanesMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<RootCommitError> for HostRootFinishedWorkCommitHandoffErrorForCanary {
    fn from(error: RootCommitError) -> Self {
        Self::Commit(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootCommitErrorOptionCallbackRecord {
    root: FiberRootId,
    finished_work: Option<FiberId>,
    finished_lanes: Lanes,
    error: RootCommitError,
    error_option_callbacks: RootErrorOptionCallbackRecord,
}

#[allow(
    dead_code,
    reason = "crate-private commit error option metadata for future root error routing"
)]
impl RootCommitErrorOptionCallbackRecord {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn error(&self) -> &RootCommitError {
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

#[allow(
    dead_code,
    reason = "crate-private commit error option metadata for future root error routing"
)]
pub(crate) fn record_root_commit_error_option_callbacks<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    finished_work: Option<FiberId>,
    finished_lanes: Lanes,
    error: RootCommitError,
) -> Result<RootCommitErrorOptionCallbackRecord, RootCommitError> {
    let root = store.root(root_id)?;
    Ok(RootCommitErrorOptionCallbackRecord {
        root: root_id,
        finished_work,
        finished_lanes,
        error,
        error_option_callbacks: root
            .options()
            .error_option_callback_record(root_id, RootErrorOptionCallbackPhase::Commit),
    })
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
    create: HookEffectCallbackHandle,
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
    pub(crate) const fn create(self) -> HookEffectCallbackHandle {
        self.create
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
                create: None,
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
            create: Some(self.create),
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
    create: Option<HookEffectCallbackHandle>,
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
    pub(crate) const fn create(self) -> Option<HookEffectCallbackHandle> {
        self.create
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentCommittedPassiveEffectFiberRecord {
    fiber: FiberId,
    phase: FunctionComponentHookRenderPhase,
    lanes: Lanes,
    records: Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private committed function-component passive effect records for traversal canaries"
)]
impl FunctionComponentCommittedPassiveEffectFiberRecord {
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
    pub(crate) fn records(&self) -> &[FunctionComponentPendingPassiveEffectPhaseCommitRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn queued_unmount_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.phase() == PendingPassiveEffectPhase::Unmount)
            .count()
    }

    #[must_use]
    pub(crate) fn queued_mount_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.phase() == PendingPassiveEffectPhase::Mount)
            .count()
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentCommittedPassiveEffectsSnapshot {
    fibers: Vec<FunctionComponentCommittedPassiveEffectFiberRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private committed function-component passive effect records for traversal canaries"
)]
impl FunctionComponentCommittedPassiveEffectsSnapshot {
    #[must_use]
    pub(crate) fn fibers(&self) -> &[FunctionComponentCommittedPassiveEffectFiberRecord] {
        &self.fibers
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.fibers.is_empty()
    }

    #[must_use]
    pub(crate) fn fiber_count(&self) -> usize {
        self.fibers.len()
    }

    #[must_use]
    pub(crate) fn queued_unmount_count(&self) -> usize {
        self.fibers
            .iter()
            .map(FunctionComponentCommittedPassiveEffectFiberRecord::queued_unmount_count)
            .sum()
    }

    #[must_use]
    pub(crate) fn queued_mount_count(&self) -> usize {
        self.fibers
            .iter()
            .map(FunctionComponentCommittedPassiveEffectFiberRecord::queued_mount_count)
            .sum()
    }

    #[must_use]
    pub(crate) fn phase_records(
        &self,
    ) -> Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord> {
        self.fibers
            .iter()
            .flat_map(|fiber| fiber.records().iter().copied())
            .collect()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord {
    root: FiberRootId,
    nearest_mounted_ancestor: FiberId,
    deleted_root: FiberId,
    traversal_index: usize,
    fiber: FiberId,
    hook_list: HookListId,
    effect_index: usize,
    effect: HookEffectId,
    instance: HookEffectInstanceId,
    tag: HookEffectFlags,
    create: HookEffectCallbackHandle,
    destroy: Option<HookEffectCallbackHandle>,
    dependencies: HookEffectDependencies,
    lanes: Lanes,
    unmount_order: PendingPassiveEffectOrder,
}

#[allow(
    dead_code,
    reason = "crate-private deleted-subtree passive destroy metadata for deterministic deletion canaries"
)]
impl FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn nearest_mounted_ancestor(self) -> FiberId {
        self.nearest_mounted_ancestor
    }

    #[must_use]
    pub(crate) const fn deleted_root(self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub(crate) const fn traversal_index(self) -> usize {
        self.traversal_index
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn hook_list(self) -> HookListId {
        self.hook_list
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
    pub(crate) const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub(crate) const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub(crate) const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub(crate) const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn unmount_order(self) -> PendingPassiveEffectOrder {
        self.unmount_order
    }

    #[must_use]
    pub(crate) const fn unmount_phase_record(
        self,
    ) -> FunctionComponentPendingPassiveEffectPhaseCommitRecord {
        FunctionComponentPendingPassiveEffectPhaseCommitRecord {
            fiber: self.fiber,
            effect_index: self.effect_index,
            effect: self.effect,
            instance: self.instance,
            create: None,
            destroy: self.destroy,
            lanes: self.lanes,
            phase: PendingPassiveEffectPhase::Unmount,
            order: self.unmount_order,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentDeletedSubtreePendingPassiveCommitHandoff {
    root: FiberRootId,
    nearest_mounted_ancestor: FiberId,
    deleted_root: FiberId,
    lanes: Lanes,
    records: Vec<FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private deleted-subtree passive destroy metadata for deterministic deletion canaries"
)]
impl FunctionComponentDeletedSubtreePendingPassiveCommitHandoff {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn nearest_mounted_ancestor(&self) -> FiberId {
        self.nearest_mounted_ancestor
    }

    #[must_use]
    pub(crate) const fn deleted_root(&self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) fn records(
        &self,
    ) -> &[FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub(crate) fn queued_unmount_count(&self) -> usize {
        self.records.len()
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentDeletedSubtreePassiveEffectsSnapshot {
    records: Vec<FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private deleted-subtree passive destroy metadata for deterministic deletion canaries"
)]
impl FunctionComponentDeletedSubtreePassiveEffectsSnapshot {
    #[must_use]
    pub(crate) fn records(
        &self,
    ) -> &[FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord] {
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
    pub(crate) fn destroy_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.destroy().is_some())
            .count()
    }

    #[must_use]
    pub(crate) fn effect_phase_records(
        &self,
    ) -> Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord> {
        self.records
            .iter()
            .map(|record| record.unmount_phase_record())
            .collect()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectCommitRecord {
    commit_order: usize,
    destroy_order: Option<usize>,
    create_order: usize,
    fiber: FiberId,
    render_phase: FunctionComponentHookRenderPhase,
    dependency_phase: FunctionComponentEffectDependencyPhase,
    hook_list: HookListId,
    effect_index: usize,
    effect: HookEffectId,
    previous_effect: Option<HookEffectId>,
    instance: HookEffectInstanceId,
    tag: HookEffectFlags,
    create: HookEffectCallbackHandle,
    destroy: Option<HookEffectCallbackHandle>,
    previous_dependencies: Option<HookEffectDependencies>,
    dependencies: HookEffectDependencies,
    dependency_status: Option<FunctionComponentEffectDependencyStatus>,
    lanes: Lanes,
}

#[allow(
    dead_code,
    reason = "crate-private layout hook-effect handoff metadata for deterministic canaries"
)]
impl FunctionComponentLayoutEffectCommitRecord {
    #[must_use]
    pub(crate) const fn commit_order(self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn destroy_order(self) -> Option<usize> {
        self.destroy_order
    }

    #[must_use]
    pub(crate) const fn create_order(self) -> usize {
        self.create_order
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn render_phase(self) -> FunctionComponentHookRenderPhase {
        self.render_phase
    }

    #[must_use]
    pub(crate) const fn dependency_phase(self) -> FunctionComponentEffectDependencyPhase {
        self.dependency_phase
    }

    #[must_use]
    pub(crate) const fn hook_list(self) -> HookListId {
        self.hook_list
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
    pub(crate) const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub(crate) const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub(crate) const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub(crate) const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub(crate) const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub(crate) const fn previous_dependencies(self) -> Option<HookEffectDependencies> {
        self.previous_dependencies
    }

    #[must_use]
    pub(crate) const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub(crate) const fn dependency_status(self) -> Option<FunctionComponentEffectDependencyStatus> {
        self.dependency_status
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    const fn destroy_phase_record(self) -> Option<FunctionComponentLayoutEffectPhaseCommitRecord> {
        match self.destroy_order {
            Some(order) => Some(FunctionComponentLayoutEffectPhaseCommitRecord {
                order,
                source_commit_order: self.commit_order,
                fiber: self.fiber,
                render_phase: self.render_phase,
                dependency_phase: self.dependency_phase,
                hook_list: self.hook_list,
                effect_index: self.effect_index,
                effect: match self.previous_effect {
                    Some(effect) => effect,
                    None => self.effect,
                },
                previous_effect: self.previous_effect,
                instance: self.instance,
                tag: self.tag,
                create: None,
                destroy: self.destroy,
                previous_dependencies: self.previous_dependencies,
                dependencies: self.dependencies,
                dependency_status: self.dependency_status,
                lanes: self.lanes,
                handoff: FunctionComponentLayoutEffectHandoff::Destroy,
                commit_phase: FunctionComponentLayoutEffectCommitPhase::Mutation,
            }),
            None => None,
        }
    }

    #[must_use]
    const fn create_phase_record(self) -> FunctionComponentLayoutEffectPhaseCommitRecord {
        FunctionComponentLayoutEffectPhaseCommitRecord {
            order: self.create_order,
            source_commit_order: self.commit_order,
            fiber: self.fiber,
            render_phase: self.render_phase,
            dependency_phase: self.dependency_phase,
            hook_list: self.hook_list,
            effect_index: self.effect_index,
            effect: self.effect,
            previous_effect: self.previous_effect,
            instance: self.instance,
            tag: self.tag,
            create: Some(self.create),
            destroy: None,
            previous_dependencies: self.previous_dependencies,
            dependencies: self.dependencies,
            dependency_status: self.dependency_status,
            lanes: self.lanes,
            handoff: FunctionComponentLayoutEffectHandoff::Create,
            commit_phase: FunctionComponentLayoutEffectCommitPhase::Layout,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum FunctionComponentLayoutEffectHandoff {
    Destroy,
    Create,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum FunctionComponentLayoutEffectCommitPhase {
    Mutation,
    Layout,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectPhaseCommitRecord {
    order: usize,
    source_commit_order: usize,
    fiber: FiberId,
    render_phase: FunctionComponentHookRenderPhase,
    dependency_phase: FunctionComponentEffectDependencyPhase,
    hook_list: HookListId,
    effect_index: usize,
    effect: HookEffectId,
    previous_effect: Option<HookEffectId>,
    instance: HookEffectInstanceId,
    tag: HookEffectFlags,
    create: Option<HookEffectCallbackHandle>,
    destroy: Option<HookEffectCallbackHandle>,
    previous_dependencies: Option<HookEffectDependencies>,
    dependencies: HookEffectDependencies,
    dependency_status: Option<FunctionComponentEffectDependencyStatus>,
    lanes: Lanes,
    handoff: FunctionComponentLayoutEffectHandoff,
    commit_phase: FunctionComponentLayoutEffectCommitPhase,
}

#[allow(
    dead_code,
    reason = "crate-private layout hook-effect phase handoff metadata for deterministic canaries"
)]
impl FunctionComponentLayoutEffectPhaseCommitRecord {
    #[must_use]
    pub(crate) const fn order(self) -> usize {
        self.order
    }

    #[must_use]
    pub(crate) const fn source_commit_order(self) -> usize {
        self.source_commit_order
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn render_phase(self) -> FunctionComponentHookRenderPhase {
        self.render_phase
    }

    #[must_use]
    pub(crate) const fn dependency_phase(self) -> FunctionComponentEffectDependencyPhase {
        self.dependency_phase
    }

    #[must_use]
    pub(crate) const fn hook_list(self) -> HookListId {
        self.hook_list
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
    pub(crate) const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub(crate) const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub(crate) const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub(crate) const fn create(self) -> Option<HookEffectCallbackHandle> {
        self.create
    }

    #[must_use]
    pub(crate) const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub(crate) const fn previous_dependencies(self) -> Option<HookEffectDependencies> {
        self.previous_dependencies
    }

    #[must_use]
    pub(crate) const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub(crate) const fn dependency_status(self) -> Option<FunctionComponentEffectDependencyStatus> {
        self.dependency_status
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn handoff(self) -> FunctionComponentLayoutEffectHandoff {
        self.handoff
    }

    #[must_use]
    pub(crate) const fn commit_phase(self) -> FunctionComponentLayoutEffectCommitPhase {
        self.commit_phase
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectsSnapshot {
    records: Vec<FunctionComponentLayoutEffectCommitRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private layout hook-effect handoff metadata for deterministic canaries"
)]
impl FunctionComponentLayoutEffectsSnapshot {
    #[must_use]
    pub(crate) fn records(&self) -> &[FunctionComponentLayoutEffectCommitRecord] {
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
    pub(crate) fn destroy_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.destroy_order().is_some())
            .count()
    }

    #[must_use]
    pub(crate) fn create_count(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub(crate) fn destroy_phase_records(
        &self,
    ) -> Vec<FunctionComponentLayoutEffectPhaseCommitRecord> {
        self.records
            .iter()
            .filter_map(|record| record.destroy_phase_record())
            .collect()
    }

    #[must_use]
    pub(crate) fn create_phase_records(
        &self,
    ) -> Vec<FunctionComponentLayoutEffectPhaseCommitRecord> {
        self.records
            .iter()
            .map(|record| record.create_phase_record())
            .collect()
    }

    #[must_use]
    pub(crate) fn phase_records(&self) -> Vec<FunctionComponentLayoutEffectPhaseCommitRecord> {
        let mut records = self.destroy_phase_records();
        records.extend(self.create_phase_records());
        records
    }

    #[must_use]
    pub(crate) const fn layout_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn dom_mutation_side_effects_performed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn refs_attached_or_detached(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_effect_compatibility_claimed(&self) -> bool {
        false
    }
}

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct FunctionComponentLayoutEffectCallbackInvocationErrorHandle(u64);

#[allow(
    dead_code,
    reason = "crate-private layout effect callback test-control errors are reserved for private commit canaries"
)]
impl FunctionComponentLayoutEffectCallbackInvocationErrorHandle {
    pub(crate) const NONE: Self = Self(0);

    #[must_use]
    pub(crate) const fn from_raw(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub(crate) const fn raw(self) -> u64 {
        self.0
    }

    #[must_use]
    pub(crate) const fn is_none(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub(crate) const fn is_some(self) -> bool {
        self.0 != 0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectCallbackInvocationRequest {
    invocation_order: usize,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    source: FunctionComponentLayoutEffectPhaseCommitRecord,
    effect_list_sequence: usize,
    matched_mutation_sequence: usize,
    first_passive_sequence: Option<usize>,
    callback: HookEffectCallbackHandle,
}

#[allow(
    dead_code,
    reason = "crate-private layout effect callback requests are reserved for private test-control execution"
)]
impl FunctionComponentLayoutEffectCallbackInvocationRequest {
    #[must_use]
    pub(crate) const fn invocation_order(self) -> usize {
        self.invocation_order
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
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn source(self) -> FunctionComponentLayoutEffectPhaseCommitRecord {
        self.source
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.source.fiber()
    }

    #[must_use]
    pub(crate) const fn hook_list(self) -> HookListId {
        self.source.hook_list()
    }

    #[must_use]
    pub(crate) const fn effect_index(self) -> usize {
        self.source.effect_index()
    }

    #[must_use]
    pub(crate) const fn effect(self) -> HookEffectId {
        self.source.effect()
    }

    #[must_use]
    pub(crate) const fn previous_effect(self) -> Option<HookEffectId> {
        self.source.previous_effect()
    }

    #[must_use]
    pub(crate) const fn instance(self) -> HookEffectInstanceId {
        self.source.instance()
    }

    #[must_use]
    pub(crate) const fn callback(self) -> HookEffectCallbackHandle {
        self.callback
    }

    #[must_use]
    pub(crate) const fn effect_list_sequence(self) -> usize {
        self.effect_list_sequence
    }

    #[must_use]
    pub(crate) const fn matched_mutation_sequence(self) -> usize {
        self.matched_mutation_sequence
    }

    #[must_use]
    pub(crate) const fn first_passive_sequence(self) -> Option<usize> {
        self.first_passive_sequence
    }

    #[must_use]
    pub(crate) const fn after_matching_mutation_metadata(self) -> bool {
        self.effect_list_sequence > self.matched_mutation_sequence
    }

    #[must_use]
    pub(crate) const fn before_passive_metadata(self) -> bool {
        match self.first_passive_sequence {
            Some(first_passive_sequence) => self.effect_list_sequence < first_passive_sequence,
            None => true,
        }
    }
}

pub(crate) trait FunctionComponentLayoutEffectCallbackInvocationTestControl {
    fn invoke_layout_effect_create(
        &mut self,
        request: FunctionComponentLayoutEffectCallbackInvocationRequest,
    ) -> Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentLayoutEffectCallbackInvocationStatus {
    Completed,
    Errored,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentLayoutEffectCallbackInvocationGateStatus {
    TestControlOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentLayoutEffectCallbackInvocationGateBlocker {
    PublicUseLayoutEffectCompatibility,
    PublicActCompatibility,
    PassivePhaseCallbackExecution,
}

pub(crate) const FUNCTION_COMPONENT_LAYOUT_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS:
    [FunctionComponentLayoutEffectCallbackInvocationGateBlocker; 3] = [
    FunctionComponentLayoutEffectCallbackInvocationGateBlocker::PublicUseLayoutEffectCompatibility,
    FunctionComponentLayoutEffectCallbackInvocationGateBlocker::PublicActCompatibility,
    FunctionComponentLayoutEffectCallbackInvocationGateBlocker::PassivePhaseCallbackExecution,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectCallbackInvocationRecord {
    request: FunctionComponentLayoutEffectCallbackInvocationRequest,
    status: FunctionComponentLayoutEffectCallbackInvocationStatus,
    error: Option<FunctionComponentLayoutEffectCallbackInvocationErrorHandle>,
}

#[allow(
    dead_code,
    reason = "crate-private layout effect callback records are reserved for private test-control execution"
)]
impl FunctionComponentLayoutEffectCallbackInvocationRecord {
    #[must_use]
    pub(crate) const fn request(self) -> FunctionComponentLayoutEffectCallbackInvocationRequest {
        self.request
    }

    #[must_use]
    pub(crate) const fn invocation_order(self) -> usize {
        self.request.invocation_order()
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
    pub(crate) const fn fiber(self) -> FiberId {
        self.request.fiber()
    }

    #[must_use]
    pub(crate) const fn effect(self) -> HookEffectId {
        self.request.effect()
    }

    #[must_use]
    pub(crate) const fn callback(self) -> HookEffectCallbackHandle {
        self.request.callback()
    }

    #[must_use]
    pub(crate) const fn status(self) -> FunctionComponentLayoutEffectCallbackInvocationStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn error(
        self,
    ) -> Option<FunctionComponentLayoutEffectCallbackInvocationErrorHandle> {
        self.error
    }

    #[must_use]
    pub(crate) const fn completed(self) -> bool {
        matches!(
            self.status,
            FunctionComponentLayoutEffectCallbackInvocationStatus::Completed
        )
    }

    #[must_use]
    pub(crate) const fn errored(self) -> bool {
        matches!(
            self.status,
            FunctionComponentLayoutEffectCallbackInvocationStatus::Errored
        )
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectCallbackInvocationGateSnapshot {
    root: Option<FiberRootId>,
    finished_work: Option<FiberId>,
    lanes: Lanes,
    records: Vec<FunctionComponentLayoutEffectCallbackInvocationRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private layout effect callback execution gate snapshot is reserved for deterministic canaries"
)]
impl FunctionComponentLayoutEffectCallbackInvocationGateSnapshot {
    #[must_use]
    pub(crate) const fn root(&self) -> Option<FiberRootId> {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[FunctionComponentLayoutEffectCallbackInvocationRecord] {
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
    pub(crate) fn completed_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.completed())
            .count()
    }

    #[must_use]
    pub(crate) fn error_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.errored())
            .count()
    }

    #[must_use]
    pub(crate) fn errors(&self) -> Vec<FunctionComponentLayoutEffectCallbackInvocationErrorHandle> {
        self.records
            .iter()
            .filter_map(|record| record.error())
            .collect()
    }

    #[must_use]
    pub(crate) fn has_errors(&self) -> bool {
        self.error_count() > 0
    }

    #[must_use]
    pub(crate) const fn status(&self) -> FunctionComponentLayoutEffectCallbackInvocationGateStatus {
        FunctionComponentLayoutEffectCallbackInvocationGateStatus::TestControlOnly
    }

    #[must_use]
    pub(crate) const fn blockers(
        &self,
    ) -> &[FunctionComponentLayoutEffectCallbackInvocationGateBlocker; 3] {
        &FUNCTION_COMPONENT_LAYOUT_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
    }

    #[must_use]
    pub(crate) fn did_invoke_test_layout_callback(&self) -> bool {
        !self.records.is_empty()
    }

    #[must_use]
    pub(crate) const fn public_use_layout_effect_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn passive_phase_callbacks_invoked(&self) -> bool {
        false
    }
}

#[allow(
    dead_code,
    reason = "crate-private HostRoot commit recovery diagnostics are reserved for private sync-flush error workers"
)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootCommitRecoverySnapshotForCanary {
    root: FiberRootId,
    current: FiberId,
    render_lanes: Lanes,
    pending_lanes: Lanes,
    callback_node: RootSchedulerCallbackHandle,
    callback_priority: RootCallbackPriority,
    render_phase_work: Option<FiberId>,
    render_phase_lanes: Lanes,
    callback_queue: UpdateQueueHandle,
    root_update_callbacks: RootUpdateCallbackSnapshot,
}

#[allow(
    dead_code,
    reason = "crate-private HostRoot commit recovery diagnostics are reserved for private sync-flush error workers"
)]
impl HostRootCommitRecoverySnapshotForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes(&self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub(crate) const fn callback_node(&self) -> RootSchedulerCallbackHandle {
        self.callback_node
    }

    #[must_use]
    pub(crate) const fn callback_priority(&self) -> RootCallbackPriority {
        self.callback_priority
    }

    #[must_use]
    pub(crate) const fn render_phase_work(&self) -> Option<FiberId> {
        self.render_phase_work
    }

    #[must_use]
    pub(crate) const fn render_phase_lanes(&self) -> Lanes {
        self.render_phase_lanes
    }

    #[must_use]
    pub(crate) const fn callback_queue(&self) -> UpdateQueueHandle {
        self.callback_queue
    }

    #[must_use]
    pub(crate) fn root_update_callbacks(&self) -> &RootUpdateCallbackSnapshot {
        &self.root_update_callbacks
    }

    #[must_use]
    pub(crate) fn visible_callback_count(&self) -> usize {
        self.root_update_callbacks.visible().len()
    }

    #[must_use]
    pub(crate) fn hidden_callback_count(&self) -> usize {
        self.root_update_callbacks.hidden().len()
    }

    #[must_use]
    pub(crate) fn deferred_hidden_callback_count(&self) -> usize {
        self.root_update_callbacks.deferred_hidden().len()
    }

    #[must_use]
    pub(crate) fn preserves_lane_and_callback_metadata_from(&self, before: &Self) -> bool {
        self.root == before.root
            && self.current == before.current
            && self.render_lanes == before.render_lanes
            && self.pending_lanes == before.pending_lanes
            && self.callback_node == before.callback_node
            && self.callback_priority == before.callback_priority
            && self.render_phase_work == before.render_phase_work
            && self.render_phase_lanes == before.render_phase_lanes
            && self.callback_queue == before.callback_queue
            && self.root_update_callbacks == before.root_update_callbacks
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootCallbackDrainRecordForCanary {
    root: FiberRootId,
    commit_order: usize,
    callback_order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    queue: UpdateQueueHandle,
    update: UpdateId,
    callback: RootUpdateCallbackHandle,
    accepted_sequence: usize,
    visibility: RootUpdateCallbackVisibility,
    update_lanes: Lanes,
    callback_lanes: Lanes,
}

#[allow(
    dead_code,
    reason = "crate-private root callback drain metadata is reserved for lane/order canaries"
)]
impl HostRootCallbackDrainRecordForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn commit_order(self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn callback_order(self) -> usize {
        self.callback_order
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
    pub(crate) const fn queue(self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub(crate) const fn update(self) -> UpdateId {
        self.update
    }

    #[must_use]
    pub(crate) const fn callback(self) -> RootUpdateCallbackHandle {
        self.callback
    }

    #[must_use]
    pub(crate) const fn accepted_sequence(self) -> usize {
        self.accepted_sequence
    }

    #[must_use]
    pub(crate) const fn visibility(self) -> RootUpdateCallbackVisibility {
        self.visibility
    }

    #[must_use]
    pub(crate) const fn update_lanes(self) -> Lanes {
        self.update_lanes
    }

    #[must_use]
    pub(crate) const fn callback_lanes(self) -> Lanes {
        self.callback_lanes
    }

    #[must_use]
    pub(crate) const fn is_visible_callback(self) -> bool {
        self.visibility.is_visible()
    }

    #[must_use]
    pub(crate) const fn is_hidden_callback(self) -> bool {
        self.visibility.is_hidden()
    }

    #[must_use]
    pub(crate) const fn is_deferred_hidden_callback(self) -> bool {
        self.visibility.is_deferred()
    }

    #[must_use]
    pub(crate) const fn update_lanes_include_offscreen(self) -> bool {
        self.update_lanes.contains_lane(Lane::OFFSCREEN)
    }

    #[must_use]
    pub(crate) const fn callback_lanes_match_commit(self) -> bool {
        self.callback_lanes.is_non_empty()
            && self.render_lanes.contains_all(self.callback_lanes)
            && self.finished_lanes.contains_all(self.callback_lanes)
    }

    #[must_use]
    pub(crate) const fn public_callback_invoked(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_callback_behavior_exposed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootCallbackDrainSnapshotForCanary {
    root: FiberRootId,
    commit_order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    pending_lanes_after_commit: Lanes,
    records: Vec<HostRootCallbackDrainRecordForCanary>,
}

#[allow(
    dead_code,
    reason = "crate-private root callback drain metadata is reserved for lane/order canaries"
)]
impl HostRootCallbackDrainSnapshotForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes_after_commit(&self) -> Lanes {
        self.pending_lanes_after_commit
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootCallbackDrainRecordForCanary] {
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
    pub(crate) fn visible_callback_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.is_visible_callback())
            .count()
    }

    #[must_use]
    pub(crate) fn hidden_callback_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.is_hidden_callback())
            .count()
    }

    #[must_use]
    pub(crate) fn has_visible_and_hidden_callbacks(&self) -> bool {
        self.visible_callback_count() > 0 && self.hidden_callback_count() > 0
    }

    #[must_use]
    pub(crate) fn records_in_callback_sequence_order(&self) -> bool {
        self.records.iter().enumerate().all(|(expected, record)| {
            record.callback_order() == expected && record.accepted_sequence() == expected
        })
    }

    #[must_use]
    pub(crate) fn records_match_commit_lanes(&self) -> bool {
        self.records
            .iter()
            .all(|record| record.callback_lanes_match_commit())
    }

    #[must_use]
    pub(crate) fn hidden_callbacks_deferred_without_invocation(&self) -> bool {
        self.records
            .iter()
            .filter(|record| record.is_hidden_callback())
            .all(|record| {
                record.is_deferred_hidden_callback()
                    && record.update_lanes_include_offscreen()
                    && !record.public_callback_invoked()
                    && !record.public_root_callback_behavior_exposed()
            })
    }

    #[must_use]
    pub(crate) fn proves_deterministic_lane_order(&self) -> bool {
        !self.is_empty()
            && self.records_in_callback_sequence_order()
            && self.records_match_commit_lanes()
            && self.records.iter().all(|record| {
                record.root() == self.root && record.commit_order() == self.commit_order
            })
            && self.hidden_callbacks_deferred_without_invocation()
    }

    #[must_use]
    pub(crate) const fn public_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_callback_behavior_exposed(&self) -> bool {
        false
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
pub(crate) struct HostRootRefCallbackExecutionHandoffSnapshot {
    records: Vec<HostRootRefCallbackExecutionHandoffRecord>,
    detach_count: usize,
    attach_count: usize,
    changed_ref_detach_before_attach_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private ref callback execution handoff is reserved for future DOM commit workers"
)]
impl HostRootRefCallbackExecutionHandoffSnapshot {
    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootRefCallbackExecutionHandoffRecord] {
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
    pub(crate) const fn detach_count(&self) -> usize {
        self.detach_count
    }

    #[must_use]
    pub(crate) const fn attach_count(&self) -> usize {
        self.attach_count
    }

    #[must_use]
    pub(crate) const fn changed_ref_detach_before_attach_count(&self) -> usize {
        self.changed_ref_detach_before_attach_count
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
    pub(crate) const fn public_roots_touched(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_errors_reported(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_ref_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct HostRootRefCallbackExecutionHandoffRecord {
    sequence: usize,
    source_gate_sequence: usize,
    root: FiberRootId,
    fiber: FiberId,
    state_node: StateNodeHandle,
    ref_handle: RefHandle,
    token: HostFiberTokenId,
    token_phase: HostFiberTokenPhase,
    token_target: HostFiberTokenTarget,
    action: HostRootRefCommitAction,
    detach_reason: Option<HostRootRefDetachReason>,
    execution_phase: HostRootRefCallbackExecutionPhase,
    changed_ref_detach_before_attach: bool,
    status: HostRootRefCallbackExecutionHandoffStatus,
    blockers: [HostRootRefCallbackExecutionHandoffBlocker; 4],
}

#[allow(
    dead_code,
    reason = "crate-private ref callback execution handoff is reserved for future DOM commit workers"
)]
impl HostRootRefCallbackExecutionHandoffRecord {
    #[must_use]
    pub(crate) const fn sequence(&self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn source_gate_sequence(&self) -> usize {
        self.source_gate_sequence
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
    pub(crate) const fn execution_phase(&self) -> HostRootRefCallbackExecutionPhase {
        self.execution_phase
    }

    #[must_use]
    pub(crate) const fn changed_ref_detach_before_attach(&self) -> bool {
        self.changed_ref_detach_before_attach
    }

    #[must_use]
    pub(crate) const fn status(&self) -> HostRootRefCallbackExecutionHandoffStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(&self) -> &[HostRootRefCallbackExecutionHandoffBlocker; 4] {
        &self.blockers
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCallbackExecutionPhase {
    CallbackDetachCleanupOrNull,
    CallbackAttach,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCallbackExecutionHandoffStatus {
    PrivateExecutionHandoff,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCallbackExecutionHandoffBlocker {
    ObjectRefMutation,
    PublicRootExecution,
    PublicRootErrorRouting,
    ReactDomRefCompatibilityClaim,
}

const REF_CALLBACK_EXECUTION_HANDOFF_BLOCKERS: [HostRootRefCallbackExecutionHandoffBlocker; 4] = [
    HostRootRefCallbackExecutionHandoffBlocker::ObjectRefMutation,
    HostRootRefCallbackExecutionHandoffBlocker::PublicRootExecution,
    HostRootRefCallbackExecutionHandoffBlocker::PublicRootErrorRouting,
    HostRootRefCallbackExecutionHandoffBlocker::ReactDomRefCompatibilityClaim,
];

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct HostRootRefCleanupReturnExecutionGateSnapshot {
    records: Vec<HostRootRefCleanupReturnExecutionGateRecord>,
    cleanup_return_handle_record_gate_count: usize,
    cleanup_return_execution_gate_count: usize,
    changed_ref_cleanup_before_attach_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private cleanup-return execution gate metadata is reserved for future DOM commit workers"
)]
impl HostRootRefCleanupReturnExecutionGateSnapshot {
    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootRefCleanupReturnExecutionGateRecord] {
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
    pub(crate) const fn cleanup_return_handle_record_gate_count(&self) -> usize {
        self.cleanup_return_handle_record_gate_count
    }

    #[must_use]
    pub(crate) const fn cleanup_return_execution_gate_count(&self) -> usize {
        self.cleanup_return_execution_gate_count
    }

    #[must_use]
    pub(crate) const fn changed_ref_cleanup_before_attach_count(&self) -> usize {
        self.changed_ref_cleanup_before_attach_count
    }

    #[must_use]
    pub(crate) const fn callback_refs_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn cleanup_return_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn object_refs_mutated(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_roots_touched(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_errors_reported(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_ref_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct HostRootRefCleanupReturnExecutionGateRecord {
    sequence: usize,
    source_handoff_sequence: usize,
    source_gate_sequence: usize,
    root: FiberRootId,
    fiber: FiberId,
    state_node: StateNodeHandle,
    ref_handle: RefHandle,
    token: HostFiberTokenId,
    token_phase: HostFiberTokenPhase,
    token_target: HostFiberTokenTarget,
    action: HostRootRefCommitAction,
    detach_reason: Option<HostRootRefDetachReason>,
    cleanup_return_phase: HostRootRefCleanupReturnExecutionPhase,
    cleanup_return_handle_recording_gate: bool,
    cleanup_return_execution_gate: bool,
    changed_ref_cleanup_before_attach: bool,
    status: HostRootRefCleanupReturnExecutionGateStatus,
    blockers: [HostRootRefCleanupReturnExecutionGateBlocker; 4],
}

#[allow(
    dead_code,
    reason = "crate-private cleanup-return execution gate metadata is reserved for future DOM commit workers"
)]
impl HostRootRefCleanupReturnExecutionGateRecord {
    #[must_use]
    pub(crate) const fn sequence(&self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn source_handoff_sequence(&self) -> usize {
        self.source_handoff_sequence
    }

    #[must_use]
    pub(crate) const fn source_gate_sequence(&self) -> usize {
        self.source_gate_sequence
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
    pub(crate) const fn cleanup_return_phase(&self) -> HostRootRefCleanupReturnExecutionPhase {
        self.cleanup_return_phase
    }

    #[must_use]
    pub(crate) const fn cleanup_return_handle_recording_gate(&self) -> bool {
        self.cleanup_return_handle_recording_gate
    }

    #[must_use]
    pub(crate) const fn cleanup_return_execution_gate(&self) -> bool {
        self.cleanup_return_execution_gate
    }

    #[must_use]
    pub(crate) const fn changed_ref_cleanup_before_attach(&self) -> bool {
        self.changed_ref_cleanup_before_attach
    }

    #[must_use]
    pub(crate) const fn status(&self) -> HostRootRefCleanupReturnExecutionGateStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(&self) -> &[HostRootRefCleanupReturnExecutionGateBlocker; 4] {
        &self.blockers
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCleanupReturnExecutionPhase {
    RecordAttachCleanupReturnHandle,
    ExecuteDetachCleanupReturnHandleOrNull,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCleanupReturnExecutionGateStatus {
    TestOnlyExecutionGate,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCleanupReturnExecutionGateBlocker {
    ObjectRefMutation,
    PublicRootExecution,
    PublicRootErrorRouting,
    ReactDomRefCompatibilityClaim,
}

const REF_CLEANUP_RETURN_EXECUTION_GATE_BLOCKERS: [HostRootRefCleanupReturnExecutionGateBlocker;
    4] = [
    HostRootRefCleanupReturnExecutionGateBlocker::ObjectRefMutation,
    HostRootRefCleanupReturnExecutionGateBlocker::PublicRootExecution,
    HostRootRefCleanupReturnExecutionGateBlocker::PublicRootErrorRouting,
    HostRootRefCleanupReturnExecutionGateBlocker::ReactDomRefCompatibilityClaim,
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
pub struct HostRootDeletionCleanupLog {
    root: FiberRootId,
    finished_work: FiberId,
    records: Vec<HostRootDeletionCleanupRecord>,
}

impl HostRootDeletionCleanupLog {
    #[must_use]
    const fn new(root: FiberRootId, finished_work: FiberId) -> Self {
        Self {
            root,
            finished_work,
            records: Vec::new(),
        }
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
    pub fn records(&self) -> &[HostRootDeletionCleanupRecord] {
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
    pub const fn ref_detach_executed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn passive_effects_flushed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(&self) -> bool {
        false
    }

    fn push(&mut self, record: HostRootDeletionCleanupRecord) {
        self.records.push(record);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostRootDeletionCleanupRecord {
    sequence: usize,
    root: FiberRootId,
    host_root: FiberId,
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    subtree_index: usize,
    parent: FiberId,
    parent_tag: FiberTag,
    host_parent: Option<FiberId>,
    host_parent_tag: Option<FiberTag>,
    host_parent_state_node: StateNodeHandle,
    host_parent_traversal_depth: Option<usize>,
    deleted_root: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
    token: HostFiberTokenId,
    token_phase: HostFiberTokenPhase,
    token_target: HostFiberTokenTarget,
}

impl HostRootDeletionCleanupRecord {
    #[must_use]
    pub const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub const fn deletion_list(self) -> DeletionListId {
        self.deletion_list
    }

    #[must_use]
    pub const fn deletion_list_index(self) -> usize {
        self.deletion_list_index
    }

    #[must_use]
    pub const fn deleted_index(self) -> usize {
        self.deleted_index
    }

    #[must_use]
    pub const fn subtree_index(self) -> usize {
        self.subtree_index
    }

    #[must_use]
    pub const fn parent(self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub const fn parent_tag(self) -> FiberTag {
        self.parent_tag
    }

    #[must_use]
    pub const fn host_parent(self) -> Option<FiberId> {
        self.host_parent
    }

    #[must_use]
    pub const fn host_parent_tag(self) -> Option<FiberTag> {
        self.host_parent_tag
    }

    #[must_use]
    pub const fn host_parent_state_node(self) -> StateNodeHandle {
        self.host_parent_state_node
    }

    #[must_use]
    pub const fn host_parent_traversal_depth(self) -> Option<usize> {
        self.host_parent_traversal_depth
    }

    #[must_use]
    pub const fn deleted_root(self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub const fn token(self) -> HostFiberTokenId {
        self.token
    }

    #[must_use]
    pub const fn token_phase(self) -> HostFiberTokenPhase {
        self.token_phase
    }

    #[must_use]
    pub const fn token_target(self) -> HostFiberTokenTarget {
        self.token_target
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootDeletionSubtreeTraversalGateSnapshot {
    records: Vec<HostRootDeletionSubtreeTraversalGateRecord>,
    fragment_deleted_subtree_count: usize,
    portal_deleted_subtree_count: usize,
    host_node_cleanup_metadata_count: usize,
    unsupported_suspense_traversal_count: usize,
    unsupported_offscreen_traversal_count: usize,
    broad_traversal_blocked_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private Fragment/Portal deletion traversal diagnostics are reserved for future deletion workers"
)]
impl HostRootDeletionSubtreeTraversalGateSnapshot {
    #[must_use]
    fn from_records(records: Vec<HostRootDeletionSubtreeTraversalGateRecord>) -> Self {
        let mut fragment_deleted_subtree_count = 0;
        let mut portal_deleted_subtree_count = 0;
        let mut host_node_cleanup_metadata_count = 0;
        let mut unsupported_suspense_traversal_count = 0;
        let mut unsupported_offscreen_traversal_count = 0;
        let mut broad_traversal_blocked_count = 0;

        for record in &records {
            match record.status() {
                HostRootDeletionSubtreeTraversalGateStatus::FragmentDeletedSubtreeDiagnostic => {
                    fragment_deleted_subtree_count += 1;
                }
                HostRootDeletionSubtreeTraversalGateStatus::PortalDeletedSubtreeDiagnostic => {
                    portal_deleted_subtree_count += 1;
                }
                HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata => {
                    host_node_cleanup_metadata_count += 1;
                }
                HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked => {
                    unsupported_suspense_traversal_count += 1;
                }
                HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked => {
                    unsupported_offscreen_traversal_count += 1;
                }
                HostRootDeletionSubtreeTraversalGateStatus::BroadDeletionTraversalBlocked => {
                    broad_traversal_blocked_count += 1;
                }
            }
        }

        Self {
            records,
            fragment_deleted_subtree_count,
            portal_deleted_subtree_count,
            host_node_cleanup_metadata_count,
            unsupported_suspense_traversal_count,
            unsupported_offscreen_traversal_count,
            broad_traversal_blocked_count,
        }
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootDeletionSubtreeTraversalGateRecord] {
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
    pub(crate) const fn fragment_deleted_subtree_count(&self) -> usize {
        self.fragment_deleted_subtree_count
    }

    #[must_use]
    pub(crate) const fn portal_deleted_subtree_count(&self) -> usize {
        self.portal_deleted_subtree_count
    }

    #[must_use]
    pub(crate) const fn host_node_cleanup_metadata_count(&self) -> usize {
        self.host_node_cleanup_metadata_count
    }

    #[must_use]
    pub(crate) const fn unsupported_suspense_traversal_count(&self) -> usize {
        self.unsupported_suspense_traversal_count
    }

    #[must_use]
    pub(crate) const fn unsupported_offscreen_traversal_count(&self) -> usize {
        self.unsupported_offscreen_traversal_count
    }

    #[must_use]
    pub(crate) const fn broad_traversal_blocked_count(&self) -> usize {
        self.broad_traversal_blocked_count
    }

    #[must_use]
    pub(crate) const fn unsupported_traversal_count(&self) -> usize {
        self.unsupported_suspense_traversal_count
            + self.unsupported_offscreen_traversal_count
            + self.broad_traversal_blocked_count
    }

    #[must_use]
    pub(crate) const fn real_fragment_dom_mutation_executed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn real_portal_dom_mutation_executed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn broad_deletion_traversal_enabled(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_unmount_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootDeletionSubtreeTraversalGateRecord {
    sequence: usize,
    root: FiberRootId,
    host_root: FiberId,
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    parent: FiberId,
    parent_tag: FiberTag,
    host_parent: Option<FiberId>,
    host_parent_tag: Option<FiberTag>,
    host_parent_state_node: StateNodeHandle,
    host_parent_traversal_depth: Option<usize>,
    deleted_root: FiberId,
    deleted_root_tag: FiberTag,
    fiber: FiberId,
    tag: FiberTag,
    traversal_depth: usize,
    state_node: StateNodeHandle,
    portal_container_state_node: StateNodeHandle,
    unsupported_feature: Option<&'static str>,
    status: HostRootDeletionSubtreeTraversalGateStatus,
}

#[allow(
    dead_code,
    reason = "crate-private Fragment/Portal deletion traversal diagnostics are reserved for future deletion workers"
)]
impl HostRootDeletionSubtreeTraversalGateRecord {
    #[must_use]
    pub(crate) const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub(crate) const fn deletion_list(self) -> DeletionListId {
        self.deletion_list
    }

    #[must_use]
    pub(crate) const fn deletion_list_index(self) -> usize {
        self.deletion_list_index
    }

    #[must_use]
    pub(crate) const fn deleted_index(self) -> usize {
        self.deleted_index
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
    pub(crate) const fn parent_tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.parent_tag)
    }

    #[must_use]
    pub(crate) const fn host_parent(self) -> Option<FiberId> {
        self.host_parent
    }

    #[must_use]
    pub(crate) const fn host_parent_tag(self) -> Option<FiberTag> {
        self.host_parent_tag
    }

    #[must_use]
    pub(crate) const fn host_parent_state_node(self) -> StateNodeHandle {
        self.host_parent_state_node
    }

    #[must_use]
    pub(crate) const fn host_parent_traversal_depth(self) -> Option<usize> {
        self.host_parent_traversal_depth
    }

    #[must_use]
    pub(crate) const fn deleted_root(self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub(crate) const fn deleted_root_tag(self) -> FiberTag {
        self.deleted_root_tag
    }

    #[must_use]
    pub(crate) const fn deleted_root_tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.deleted_root_tag)
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub(crate) const fn tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.tag)
    }

    #[must_use]
    pub(crate) const fn traversal_depth(self) -> usize {
        self.traversal_depth
    }

    #[must_use]
    pub(crate) const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn portal_container_state_node(self) -> StateNodeHandle {
        self.portal_container_state_node
    }

    #[must_use]
    pub(crate) const fn unsupported_feature(self) -> Option<&'static str> {
        self.unsupported_feature
    }

    #[must_use]
    pub(crate) const fn status(self) -> HostRootDeletionSubtreeTraversalGateStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn status_name(self) -> &'static str {
        host_root_deletion_subtree_traversal_gate_status_name(self.status)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootDeletionSubtreeTraversalGateStatus {
    FragmentDeletedSubtreeDiagnostic,
    PortalDeletedSubtreeDiagnostic,
    HostNodeCleanupMetadata,
    UnsupportedSuspenseTraversalBlocked,
    UnsupportedOffscreenTraversalBlocked,
    BroadDeletionTraversalBlocked,
}

const fn host_root_deletion_subtree_traversal_gate_status_name(
    status: HostRootDeletionSubtreeTraversalGateStatus,
) -> &'static str {
    match status {
        HostRootDeletionSubtreeTraversalGateStatus::FragmentDeletedSubtreeDiagnostic => {
            "fragment-deleted-subtree-diagnostic"
        }
        HostRootDeletionSubtreeTraversalGateStatus::PortalDeletedSubtreeDiagnostic => {
            "portal-deleted-subtree-diagnostic"
        }
        HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata => {
            "host-node-cleanup-metadata"
        }
        HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked => {
            "unsupported-suspense-deletion-traversal"
        }
        HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked => {
            "unsupported-offscreen-deletion-traversal"
        }
        HostRootDeletionSubtreeTraversalGateStatus::BroadDeletionTraversalBlocked => {
            "broad-deletion-traversal-blocked"
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostRootDeletionCleanupOrderGateSnapshot {
    records: Vec<HostRootDeletionCleanupOrderGateRecord>,
    ref_cleanup_return_count: usize,
    passive_destroy_count: usize,
    host_node_cleanup_count: usize,
}

impl HostRootDeletionCleanupOrderGateSnapshot {
    #[must_use]
    pub fn records(&self) -> &[HostRootDeletionCleanupOrderGateRecord] {
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
    pub const fn ref_cleanup_return_count(&self) -> usize {
        self.ref_cleanup_return_count
    }

    #[must_use]
    pub const fn passive_destroy_count(&self) -> usize {
        self.passive_destroy_count
    }

    #[must_use]
    pub const fn host_node_cleanup_count(&self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub const fn ref_cleanup_return_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn passive_destroy_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_effects_flushed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_ref_or_effect_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostRootDeletionCleanupOrderGateRecord {
    sequence: usize,
    phase: HostRootDeletionCleanupOrderPhase,
    root: FiberRootId,
    finished_work: FiberId,
    deletion_list: Option<DeletionListId>,
    deletion_list_index: Option<usize>,
    deleted_index: Option<usize>,
    subtree_index: Option<usize>,
    deleted_root: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    ref_cleanup_return_sequence: Option<usize>,
    passive_unmount_order: Option<PendingPassiveEffectOrder>,
    passive_destroy: Option<HookEffectCallbackHandle>,
    host_cleanup_sequence: Option<usize>,
}

impl HostRootDeletionCleanupOrderGateRecord {
    #[must_use]
    pub const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub const fn phase(self) -> HostRootDeletionCleanupOrderPhase {
        self.phase
    }

    #[must_use]
    pub const fn phase_name(self) -> &'static str {
        host_root_deletion_cleanup_order_phase_name(self.phase)
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
    pub const fn deletion_list(self) -> Option<DeletionListId> {
        self.deletion_list
    }

    #[must_use]
    pub const fn deletion_list_index(self) -> Option<usize> {
        self.deletion_list_index
    }

    #[must_use]
    pub const fn deleted_index(self) -> Option<usize> {
        self.deleted_index
    }

    #[must_use]
    pub const fn subtree_index(self) -> Option<usize> {
        self.subtree_index
    }

    #[must_use]
    pub const fn deleted_root(self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn ref_cleanup_return_sequence(self) -> Option<usize> {
        self.ref_cleanup_return_sequence
    }

    #[must_use]
    pub const fn passive_unmount_order(self) -> Option<PendingPassiveEffectOrder> {
        self.passive_unmount_order
    }

    #[must_use]
    pub const fn passive_destroy(self) -> Option<HookEffectCallbackHandle> {
        self.passive_destroy
    }

    #[must_use]
    pub const fn host_cleanup_sequence(self) -> Option<usize> {
        self.host_cleanup_sequence
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostRootDeletionCleanupOrderPhase {
    RefCleanupReturn,
    PassiveDestroy,
    HostNodeCleanup,
}

const fn host_root_deletion_cleanup_order_phase_name(
    phase: HostRootDeletionCleanupOrderPhase,
) -> &'static str {
    match phase {
        HostRootDeletionCleanupOrderPhase::RefCleanupReturn => "ref-cleanup-return",
        HostRootDeletionCleanupOrderPhase::PassiveDestroy => "passive-destroy",
        HostRootDeletionCleanupOrderPhase::HostNodeCleanup => "host-node-cleanup",
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct PendingHostRootDeletionCleanupRecord {
    root: FiberRootId,
    host_root: FiberId,
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    subtree_index: usize,
    parent: FiberId,
    parent_tag: FiberTag,
    host_parent: Option<HostRootDeletionHostParentRecord>,
    deleted_root: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
    token_target: HostFiberTokenTarget,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootDeletionHostParentRecord {
    fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
    traversal_depth: usize,
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct HostRootCommitOrderDiagnosticsForCanary {
    records: Vec<HostRootCommitOrderRecordForCanary>,
}

impl HostRootCommitOrderDiagnosticsForCanary {
    #[must_use]
    pub fn records(&self) -> &[HostRootCommitOrderRecordForCanary] {
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
    pub const fn public_effects_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn host_containers_mutated(&self) -> bool {
        false
    }

    fn push(&mut self, record: HostRootCommitOrderRecordInputForCanary) {
        self.records.push(HostRootCommitOrderRecordForCanary {
            sequence: self.records.len(),
            phase: record.phase,
            metadata_kind: record.metadata_kind,
            root: record.root,
            finished_work: record.finished_work,
            fiber: record.fiber,
            tag: record.tag,
            source_order: record.source_order,
        });
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootCommitOrderRecordInputForCanary {
    phase: HostRootCommitOrderPhaseForCanary,
    metadata_kind: HostRootCommitOrderMetadataKindForCanary,
    root: FiberRootId,
    finished_work: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    source_order: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostRootCommitOrderRecordForCanary {
    sequence: usize,
    phase: HostRootCommitOrderPhaseForCanary,
    metadata_kind: HostRootCommitOrderMetadataKindForCanary,
    root: FiberRootId,
    finished_work: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    source_order: u64,
}

impl HostRootCommitOrderRecordForCanary {
    #[must_use]
    pub const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub const fn phase(self) -> HostRootCommitOrderPhaseForCanary {
        self.phase
    }

    #[must_use]
    pub const fn phase_name(self) -> &'static str {
        host_root_commit_order_phase_name(self.phase)
    }

    #[must_use]
    pub const fn metadata_kind(self) -> HostRootCommitOrderMetadataKindForCanary {
        self.metadata_kind
    }

    #[must_use]
    pub const fn metadata_kind_name(self) -> &'static str {
        host_root_commit_order_metadata_kind_name(self.metadata_kind)
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
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.tag)
    }

    #[must_use]
    pub const fn source_order(self) -> u64 {
        self.source_order
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostRootCommitOrderPhaseForCanary {
    Mutation,
    Layout,
    Passive,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostRootCommitOrderMetadataKindForCanary {
    DeletionCleanup,
    RefDetach,
    RefAttach,
    LayoutEffectDestroy,
    LayoutEffectCreate,
    LayoutEffectCallback,
    RootUpdateCallback,
    PassiveUnmount,
    PassiveMount,
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentEffectListCommitPhaseOrderSnapshot {
    root: Option<FiberRootId>,
    finished_work: Option<FiberId>,
    lanes: Lanes,
    records: Vec<FunctionComponentEffectListCommitPhaseOrderRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private function-component effect-list commit phase order diagnostics"
)]
impl FunctionComponentEffectListCommitPhaseOrderSnapshot {
    #[must_use]
    pub(crate) const fn root(&self) -> Option<FiberRootId> {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[FunctionComponentEffectListCommitPhaseOrderRecord] {
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
    pub(crate) fn before_mutation_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.phase() == FunctionComponentEffectListCommitPhase::BeforeMutation
            })
            .count()
    }

    #[must_use]
    pub(crate) fn layout_destroy_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.kind() == FunctionComponentEffectListCommitPhaseOrderKind::LayoutDestroy
            })
            .count()
    }

    #[must_use]
    pub(crate) fn layout_create_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.kind() == FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate
            })
            .count()
    }

    #[must_use]
    pub(crate) fn passive_unmount_schedule_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.kind()
                    == FunctionComponentEffectListCommitPhaseOrderKind::PassiveUnmountScheduled
            })
            .count()
    }

    #[must_use]
    pub(crate) fn passive_mount_schedule_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.kind()
                    == FunctionComponentEffectListCommitPhaseOrderKind::PassiveMountScheduled
            })
            .count()
    }

    #[must_use]
    pub(crate) fn records_in_commit_phase_order(&self) -> bool {
        self.records
            .iter()
            .enumerate()
            .all(|(sequence, record)| record.sequence() == sequence)
            && self.records.windows(2).all(|pair| {
                function_component_effect_list_commit_phase_order(pair[0].phase())
                    <= function_component_effect_list_commit_phase_order(pair[1].phase())
            })
    }

    #[must_use]
    pub(crate) const fn layout_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn passive_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_execution_enabled(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_effect_compatibility_claimed(&self) -> bool {
        false
    }

    fn push(&mut self, input: FunctionComponentEffectListCommitPhaseOrderRecordInput) {
        self.records
            .push(FunctionComponentEffectListCommitPhaseOrderRecord {
                sequence: self.records.len(),
                phase: input.phase,
                kind: input.kind,
                root: input.root,
                finished_work: input.finished_work,
                fiber: input.fiber,
                hook_list: input.hook_list,
                render_phase: input.render_phase,
                lanes: input.lanes,
                effect_index: input.effect_index,
                effect: input.effect,
                previous_effect: input.previous_effect,
                create: input.create,
                destroy: input.destroy,
                source_order: input.source_order,
            });
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FunctionComponentEffectListCommitPhaseOrderRecordInput {
    phase: FunctionComponentEffectListCommitPhase,
    kind: FunctionComponentEffectListCommitPhaseOrderKind,
    root: FiberRootId,
    finished_work: FiberId,
    fiber: FiberId,
    hook_list: HookListId,
    render_phase: FunctionComponentHookRenderPhase,
    lanes: Lanes,
    effect_index: Option<usize>,
    effect: Option<HookEffectId>,
    previous_effect: Option<HookEffectId>,
    create: Option<HookEffectCallbackHandle>,
    destroy: Option<HookEffectCallbackHandle>,
    source_order: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentEffectListCommitPhaseOrderRecord {
    sequence: usize,
    phase: FunctionComponentEffectListCommitPhase,
    kind: FunctionComponentEffectListCommitPhaseOrderKind,
    root: FiberRootId,
    finished_work: FiberId,
    fiber: FiberId,
    hook_list: HookListId,
    render_phase: FunctionComponentHookRenderPhase,
    lanes: Lanes,
    effect_index: Option<usize>,
    effect: Option<HookEffectId>,
    previous_effect: Option<HookEffectId>,
    create: Option<HookEffectCallbackHandle>,
    destroy: Option<HookEffectCallbackHandle>,
    source_order: u64,
}

#[allow(
    dead_code,
    reason = "crate-private function-component effect-list commit phase order diagnostics"
)]
impl FunctionComponentEffectListCommitPhaseOrderRecord {
    #[must_use]
    pub(crate) const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn phase(self) -> FunctionComponentEffectListCommitPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn phase_name(self) -> &'static str {
        function_component_effect_list_commit_phase_name(self.phase)
    }

    #[must_use]
    pub(crate) const fn kind(self) -> FunctionComponentEffectListCommitPhaseOrderKind {
        self.kind
    }

    #[must_use]
    pub(crate) const fn kind_name(self) -> &'static str {
        function_component_effect_list_commit_phase_order_kind_name(self.kind)
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
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub(crate) const fn render_phase(self) -> FunctionComponentHookRenderPhase {
        self.render_phase
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn effect_index(self) -> Option<usize> {
        self.effect_index
    }

    #[must_use]
    pub(crate) const fn effect(self) -> Option<HookEffectId> {
        self.effect
    }

    #[must_use]
    pub(crate) const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub(crate) const fn create(self) -> Option<HookEffectCallbackHandle> {
        self.create
    }

    #[must_use]
    pub(crate) const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub(crate) const fn source_order(self) -> u64 {
        self.source_order
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentEffectListCommitPhase {
    BeforeMutation,
    Mutation,
    Layout,
    PassiveScheduling,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentEffectListCommitPhaseOrderKind {
    EffectListBeforeMutation,
    LayoutDestroy,
    LayoutCreate,
    PassiveUnmountScheduled,
    PassiveMountScheduled,
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
    root_update_callback_invocation_gate: RootUpdateCallbackInvocationGateSnapshot,
    pending_passive_handoff: Option<PendingPassiveCommitHandoff>,
    function_component_committed_passive_effects: FunctionComponentCommittedPassiveEffectsSnapshot,
    function_component_deleted_subtree_passive_effects:
        FunctionComponentDeletedSubtreePassiveEffectsSnapshot,
    function_component_layout_effects: FunctionComponentLayoutEffectsSnapshot,
    function_component_layout_effect_callback_invocation_gate:
        FunctionComponentLayoutEffectCallbackInvocationGateSnapshot,
    function_component_effect_list_commit_phase_order:
        FunctionComponentEffectListCommitPhaseOrderSnapshot,
    deletion_lists: Vec<HostRootDeletionListRecord>,
    deletion_subtree_traversal_gate: HostRootDeletionSubtreeTraversalGateSnapshot,
    host_node_deletion_cleanup_log: HostRootDeletionCleanupLog,
    ref_commit_metadata: HostRootRefCommitSnapshot,
    dom_ref_callback_commit_gate: HostRootDomRefCallbackCommitGateSnapshot,
    ref_callback_execution_handoff: HostRootRefCallbackExecutionHandoffSnapshot,
    ref_cleanup_return_execution_gate: HostRootRefCleanupReturnExecutionGateSnapshot,
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
        reason = "crate-private root callback invocation metadata is reserved for future commit workers"
    )]
    pub(crate) fn root_update_callback_invocation_gate(
        &self,
    ) -> &RootUpdateCallbackInvocationGateSnapshot {
        &self.root_update_callback_invocation_gate
    }

    #[allow(
        dead_code,
        reason = "crate-private root callback invocation execution gate is reserved for private commit tests"
    )]
    pub(crate) fn drain_root_update_callbacks_under_test_control(
        &mut self,
        control: &mut impl RootUpdateCallbackInvocationTestControl,
    ) -> RootUpdateCallbackInvocationExecutionGateSnapshot {
        invoke_root_update_callbacks_under_test_control(
            &mut self.root_update_callback_invocation_gate,
            control,
        )
    }

    #[allow(
        dead_code,
        reason = "crate-private root callback drain metadata is reserved for lane/order canaries"
    )]
    pub(crate) fn root_update_callback_drain_snapshot_for_canary<H: HostTypes>(
        &self,
        store: &FiberRootStore<H>,
        commit_order: usize,
        render_lanes: Lanes,
    ) -> Result<HostRootCallbackDrainSnapshotForCanary, RootCommitError> {
        let records = collect_host_root_callback_drain_records_for_canary(
            store,
            self.root,
            commit_order,
            render_lanes,
            self.finished_lanes,
            &self.root_update_callbacks,
        )?;

        Ok(HostRootCallbackDrainSnapshotForCanary {
            root: self.root,
            commit_order,
            render_lanes,
            finished_lanes: self.finished_lanes,
            pending_lanes_after_commit: self.pending_lanes,
            records,
        })
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

    #[must_use]
    #[allow(
        dead_code,
        reason = "crate-private ref callback execution handoff records are reserved for future DOM commit workers"
    )]
    pub(crate) fn ref_callback_execution_handoff(
        &self,
    ) -> &HostRootRefCallbackExecutionHandoffSnapshot {
        &self.ref_callback_execution_handoff
    }

    #[must_use]
    #[allow(
        dead_code,
        reason = "crate-private cleanup-return execution gate records are reserved for future DOM commit workers"
    )]
    pub(crate) fn ref_cleanup_return_execution_gate(
        &self,
    ) -> &HostRootRefCleanupReturnExecutionGateSnapshot {
        &self.ref_cleanup_return_execution_gate
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

    #[doc(hidden)]
    #[must_use]
    pub fn test_only_host_parent_placement_apply_count_for_canary(&self) -> usize {
        self.mutation_apply_log
            .records()
            .iter()
            .filter(|record| {
                record.kind() == HostRootMutationApplyRecordKind::AppendPlacementToHostParent
            })
            .count()
    }

    #[doc(hidden)]
    #[must_use]
    pub fn has_test_only_host_parent_placement_apply_for_canary(
        &self,
        parent_state_node_raw: u64,
        child_state_node_raw: u64,
    ) -> bool {
        self.mutation_apply_log.records().iter().any(|record| {
            record.kind() == HostRootMutationApplyRecordKind::AppendPlacementToHostParent
                && record.parent_tag() == FiberTag::HostComponent
                && record.parent_state_node().raw() == parent_state_node_raw
                && record.state_node().raw() == child_state_node_raw
        })
    }

    #[doc(hidden)]
    #[must_use]
    pub fn test_only_host_text_update_apply_count_for_canary(&self) -> usize {
        self.mutation_apply_log
            .records()
            .iter()
            .filter(|record| record.kind() == HostRootMutationApplyRecordKind::CommitHostTextUpdate)
            .count()
    }

    #[doc(hidden)]
    #[must_use]
    pub fn test_only_host_component_update_apply_count_for_canary(&self) -> usize {
        self.mutation_apply_log
            .records()
            .iter()
            .filter(|record| {
                record.kind() == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
            })
            .count()
    }

    #[doc(hidden)]
    #[must_use]
    pub fn has_test_only_host_component_update_apply_for_canary(
        &self,
        current_component: FiberId,
        updated_component: FiberId,
        component_state_node_raw: u64,
    ) -> bool {
        self.mutation_apply_log.records().iter().any(|record| {
            record.kind() == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
                && record.tag() == FiberTag::HostComponent
                && record.alternate_fiber() == Some(current_component)
                && record.fiber() == updated_component
                && record.state_node().raw() == component_state_node_raw
        })
    }

    #[doc(hidden)]
    #[must_use]
    pub fn host_component_update_apply_diagnostics_for_canary(
        &self,
    ) -> Vec<HostComponentUpdateApplyDiagnosticForCanary> {
        self.mutation_apply_log
            .records()
            .iter()
            .filter(|record| {
                record.kind() == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
            })
            .enumerate()
            .map(
                |(sequence, record)| HostComponentUpdateApplyDiagnosticForCanary {
                    sequence,
                    root: record.root(),
                    host_root: record.host_root(),
                    parent: record.parent(),
                    parent_tag: record.parent_tag(),
                    parent_state_node: record.parent_state_node(),
                    fiber: record.fiber(),
                    alternate_fiber: record.alternate_fiber(),
                    tag: record.tag(),
                    state_node: record.state_node(),
                    pending_props: record.pending_props(),
                    memoized_props: record.memoized_props(),
                    alternate_memoized_props: record.alternate_memoized_props(),
                    apply_kind: host_root_mutation_apply_record_kind_name(record.kind()),
                },
            )
            .collect()
    }

    #[doc(hidden)]
    #[must_use]
    pub fn has_test_only_host_text_update_apply_for_canary(
        &self,
        current_text: FiberId,
        updated_text: FiberId,
        text_state_node_raw: u64,
    ) -> bool {
        self.mutation_apply_log.records().iter().any(|record| {
            record.kind() == HostRootMutationApplyRecordKind::CommitHostTextUpdate
                && record.tag() == FiberTag::HostText
                && record.alternate_fiber() == Some(current_text)
                && record.fiber() == updated_text
                && record.state_node().raw() == text_state_node_raw
        })
    }

    #[must_use]
    pub fn host_root_placement_apply_diagnostics_for_canary(
        &self,
    ) -> Vec<HostRootPlacementApplyDiagnosticForCanary> {
        self.mutation_apply_log
            .records()
            .iter()
            .filter(|record| {
                record.parent_tag() == FiberTag::HostRoot
                    && matches!(
                        record.source(),
                        HostRootMutationApplyRecordSource::MutationPhase(
                            HostRootMutationPhaseRecordKind::Placement
                        )
                    )
            })
            .map(|record| {
                let placement_sibling = record.placement_sibling();
                HostRootPlacementApplyDiagnosticForCanary {
                    root: record.root(),
                    host_root: record.host_root(),
                    fiber: record.fiber(),
                    tag: record.tag(),
                    state_node: record.state_node(),
                    apply_kind: host_root_mutation_apply_record_kind_name(record.kind()),
                    sibling_status: placement_sibling
                        .map(HostRootPlacementSiblingRecord::status)
                        .map(host_root_placement_sibling_status_name)
                        .unwrap_or("missing-placement-sibling-record"),
                    sibling: placement_sibling.and_then(HostRootPlacementSiblingRecord::sibling),
                    sibling_tag: placement_sibling
                        .and_then(HostRootPlacementSiblingRecord::sibling_tag),
                    sibling_state_node: placement_sibling
                        .map(HostRootPlacementSiblingRecord::sibling_state_node)
                        .unwrap_or(StateNodeHandle::NONE),
                    can_insert_before: placement_sibling
                        .is_some_and(HostRootPlacementSiblingRecord::can_insert_before),
                }
            })
            .collect()
    }

    #[must_use]
    pub fn host_parent_placement_apply_diagnostics_for_canary(
        &self,
    ) -> Vec<HostParentPlacementApplyDiagnosticForCanary> {
        self.mutation_apply_log
            .records()
            .iter()
            .filter(|record| {
                record.parent_tag() == FiberTag::HostComponent
                    && matches!(
                        record.source(),
                        HostRootMutationApplyRecordSource::MutationPhase(
                            HostRootMutationPhaseRecordKind::Placement
                        )
                    )
            })
            .map(|record| HostParentPlacementApplyDiagnosticForCanary {
                root: record.root(),
                host_root: record.host_root(),
                parent: record.parent(),
                parent_tag: record.parent_tag(),
                parent_state_node: record.parent_state_node(),
                fiber: record.fiber(),
                tag: record.tag(),
                state_node: record.state_node(),
                apply_kind: host_root_mutation_apply_record_kind_name(record.kind()),
                applies_to_host_parent: record.kind()
                    == HostRootMutationApplyRecordKind::AppendPlacementToHostParent,
            })
            .collect()
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
        reason = "crate-private committed passive effect records for traversal canaries"
    )]
    #[must_use]
    pub(crate) const fn function_component_committed_passive_effects(
        &self,
    ) -> &FunctionComponentCommittedPassiveEffectsSnapshot {
        &self.function_component_committed_passive_effects
    }

    #[allow(
        dead_code,
        reason = "crate-private committed passive effect records for traversal canaries"
    )]
    pub(crate) fn record_function_component_committed_passive_effects_for_canary(
        &mut self,
        handoffs: &[FunctionComponentPendingPassiveCommitHandoff],
    ) -> Result<&FunctionComponentCommittedPassiveEffectsSnapshot, RootCommitError> {
        let Some(pending_passive_handoff) = self.pending_passive_handoff else {
            if handoffs.is_empty() {
                self.function_component_committed_passive_effects =
                    FunctionComponentCommittedPassiveEffectsSnapshot::default();
                return Ok(&self.function_component_committed_passive_effects);
            }

            return Err(
                RootCommitError::CommittedPassiveEffectsWithoutPendingPassiveHandoff {
                    root: self.root,
                },
            );
        };

        let mut fibers = Vec::with_capacity(handoffs.len());
        for handoff in handoffs {
            if handoff.root() != self.root {
                return Err(RootCommitError::CommittedPassiveEffectHandoffRootMismatch {
                    commit_root: self.root,
                    handoff_root: handoff.root(),
                });
            }
            if handoff.lanes() != pending_passive_handoff.lanes() {
                return Err(
                    RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                        root: self.root,
                        expected: pending_passive_handoff.lanes(),
                        actual: handoff.lanes(),
                    },
                );
            }

            fibers.push(FunctionComponentCommittedPassiveEffectFiberRecord {
                fiber: handoff.fiber(),
                phase: handoff.phase(),
                lanes: handoff.lanes(),
                records: handoff.effect_phase_records(),
            });
        }

        self.function_component_committed_passive_effects =
            FunctionComponentCommittedPassiveEffectsSnapshot { fibers };

        Ok(&self.function_component_committed_passive_effects)
    }

    #[allow(
        dead_code,
        reason = "crate-private deleted-subtree passive destroy metadata for deterministic deletion canaries"
    )]
    #[must_use]
    pub(crate) const fn function_component_deleted_subtree_passive_effects(
        &self,
    ) -> &FunctionComponentDeletedSubtreePassiveEffectsSnapshot {
        &self.function_component_deleted_subtree_passive_effects
    }

    #[allow(
        dead_code,
        reason = "crate-private deleted-subtree passive destroy metadata for deterministic deletion canaries"
    )]
    pub(crate) fn record_function_component_deleted_subtree_passive_effects_for_canary(
        &mut self,
        handoffs: &[FunctionComponentDeletedSubtreePendingPassiveCommitHandoff],
    ) -> Result<&FunctionComponentDeletedSubtreePassiveEffectsSnapshot, RootCommitError> {
        let Some(pending_passive_handoff) = self.pending_passive_handoff else {
            if handoffs.is_empty() {
                self.function_component_deleted_subtree_passive_effects =
                    FunctionComponentDeletedSubtreePassiveEffectsSnapshot::default();
                return Ok(&self.function_component_deleted_subtree_passive_effects);
            }

            return Err(
                RootCommitError::CommittedPassiveEffectsWithoutPendingPassiveHandoff {
                    root: self.root,
                },
            );
        };

        let mut records = Vec::new();
        for handoff in handoffs {
            if handoff.root() != self.root {
                return Err(RootCommitError::CommittedPassiveEffectHandoffRootMismatch {
                    commit_root: self.root,
                    handoff_root: handoff.root(),
                });
            }
            if handoff.lanes() != pending_passive_handoff.lanes() {
                return Err(
                    RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                        root: self.root,
                        expected: pending_passive_handoff.lanes(),
                        actual: handoff.lanes(),
                    },
                );
            }

            records.extend_from_slice(handoff.records());
        }
        records.sort_by_key(|record| record.unmount_order());

        self.function_component_deleted_subtree_passive_effects =
            FunctionComponentDeletedSubtreePassiveEffectsSnapshot { records };

        Ok(&self.function_component_deleted_subtree_passive_effects)
    }

    #[doc(hidden)]
    #[must_use]
    pub fn deletion_cleanup_order_gate_for_canary(
        &self,
    ) -> HostRootDeletionCleanupOrderGateSnapshot {
        materialize_deletion_cleanup_order_gate(self)
    }

    #[allow(
        dead_code,
        reason = "crate-private layout hook-effect handoff metadata for deterministic canaries"
    )]
    #[must_use]
    pub(crate) const fn function_component_layout_effects(
        &self,
    ) -> &FunctionComponentLayoutEffectsSnapshot {
        &self.function_component_layout_effects
    }

    #[allow(
        dead_code,
        reason = "crate-private layout hook-effect handoff metadata for deterministic canaries"
    )]
    pub(crate) fn record_function_component_layout_effects_for_canary<H: HostTypes>(
        &mut self,
        store: &FiberRootStore<H>,
        hook_store: &mut FunctionComponentHookRenderStore,
    ) -> Result<&FunctionComponentLayoutEffectsSnapshot, RootCommitError> {
        let store_current = store.root(self.root)?.current();
        if store_current != self.current {
            return Err(RootCommitError::LayoutEffectHandoffCurrentMismatch {
                root: self.root,
                commit_current: self.current,
                store_current,
            });
        }

        self.function_component_layout_effects =
            record_function_component_layout_effects_for_committed_root(
                store,
                self.root,
                hook_store,
                self.finished_lanes,
            )?;

        Ok(&self.function_component_layout_effects)
    }

    #[allow(
        dead_code,
        reason = "crate-private layout effect callback execution gate is reserved for deterministic canaries"
    )]
    #[must_use]
    pub(crate) const fn function_component_layout_effect_callback_invocation_gate(
        &self,
    ) -> &FunctionComponentLayoutEffectCallbackInvocationGateSnapshot {
        &self.function_component_layout_effect_callback_invocation_gate
    }

    #[allow(
        dead_code,
        reason = "crate-private layout effect callback execution gate is reserved for deterministic canaries"
    )]
    pub(crate) fn execute_function_component_layout_effect_record_under_test_control_for_canary<
        H: HostTypes,
    >(
        &mut self,
        store: &FiberRootStore<H>,
        hook_store: &FunctionComponentHookRenderStore,
        record: FunctionComponentEffectListCommitPhaseOrderRecord,
        control: &mut impl FunctionComponentLayoutEffectCallbackInvocationTestControl,
    ) -> Result<&FunctionComponentLayoutEffectCallbackInvocationGateSnapshot, RootCommitError> {
        let store_current = store.root(self.root)?.current();
        if store_current != self.current {
            return Err(RootCommitError::LayoutEffectHandoffCurrentMismatch {
                root: self.root,
                commit_current: self.current,
                store_current,
            });
        }

        self.function_component_layout_effect_callback_invocation_gate =
            execute_function_component_layout_effect_callback_record_under_test_control(
                store,
                self.root,
                self.current,
                self.finished_lanes,
                hook_store,
                &self.function_component_layout_effects,
                &self.function_component_effect_list_commit_phase_order,
                record,
                control,
            )?;

        Ok(&self.function_component_layout_effect_callback_invocation_gate)
    }

    #[allow(
        dead_code,
        reason = "crate-private function-component effect-list commit phase order diagnostics"
    )]
    #[must_use]
    pub(crate) const fn function_component_effect_list_commit_phase_order(
        &self,
    ) -> &FunctionComponentEffectListCommitPhaseOrderSnapshot {
        &self.function_component_effect_list_commit_phase_order
    }

    #[allow(
        dead_code,
        reason = "crate-private function-component effect-list commit phase order diagnostics"
    )]
    pub(crate) fn record_function_component_effect_list_commit_phase_order_for_canary<
        H: HostTypes,
    >(
        &mut self,
        store: &FiberRootStore<H>,
        hook_store: &mut FunctionComponentHookRenderStore,
        passive_handoffs: &[FunctionComponentPendingPassiveCommitHandoff],
    ) -> Result<&FunctionComponentEffectListCommitPhaseOrderSnapshot, RootCommitError> {
        let store_current = store.root(self.root)?.current();
        if store_current != self.current {
            return Err(RootCommitError::LayoutEffectHandoffCurrentMismatch {
                root: self.root,
                commit_current: self.current,
                store_current,
            });
        }

        let layout_snapshot = self
            .record_function_component_layout_effects_for_canary(store, hook_store)?
            .clone();
        let passive_phase_records = validate_function_component_effect_list_passive_handoffs(
            store,
            self.root,
            self.current,
            self.finished_lanes,
            self.pending_passive_handoff,
            hook_store,
            passive_handoffs,
        )?;
        let passive_snapshot = self
            .record_function_component_committed_passive_effects_for_canary(passive_handoffs)?
            .clone();

        self.function_component_effect_list_commit_phase_order =
            build_function_component_effect_list_commit_phase_order_snapshot(
                store,
                self.root,
                self.current,
                self.finished_lanes,
                hook_store,
                &layout_snapshot,
                &passive_snapshot,
                &passive_phase_records,
            )?;

        Ok(&self.function_component_effect_list_commit_phase_order)
    }

    #[allow(
        dead_code,
        reason = "crate-private deletion metadata for future mutation/passive deletion workers"
    )]
    #[must_use]
    pub(crate) fn deletion_lists(&self) -> &[HostRootDeletionListRecord] {
        &self.deletion_lists
    }

    #[allow(
        dead_code,
        reason = "crate-private Fragment/Portal deletion traversal diagnostics are reserved for future deletion workers"
    )]
    #[must_use]
    pub(crate) const fn deletion_subtree_traversal_gate_for_canary(
        &self,
    ) -> &HostRootDeletionSubtreeTraversalGateSnapshot {
        &self.deletion_subtree_traversal_gate
    }

    #[must_use]
    pub const fn host_node_deletion_cleanup_log(&self) -> &HostRootDeletionCleanupLog {
        &self.host_node_deletion_cleanup_log
    }

    #[doc(hidden)]
    #[must_use]
    pub fn commit_order_diagnostics_for_canary(&self) -> HostRootCommitOrderDiagnosticsForCanary {
        let mut diagnostics = HostRootCommitOrderDiagnosticsForCanary::default();

        for record in self.host_node_deletion_cleanup_log.records() {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Mutation,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::DeletionCleanup,
                root: record.root(),
                finished_work: self.current,
                fiber: record.fiber(),
                tag: record.tag(),
                source_order: record.sequence() as u64,
            });
        }

        for record in self
            .function_component_layout_effects
            .destroy_phase_records()
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Mutation,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::LayoutEffectDestroy,
                root: self.root,
                finished_work: self.current,
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: record.order() as u64,
            });
        }

        for record in self.ref_callback_execution_handoff.records() {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Layout,
                metadata_kind: host_root_commit_order_ref_kind(record.action()),
                root: record.root(),
                finished_work: self.current,
                fiber: record.fiber(),
                tag: FiberTag::HostComponent,
                source_order: record.sequence() as u64,
            });
        }

        for record in self
            .function_component_layout_effects
            .create_phase_records()
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Layout,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::LayoutEffectCreate,
                root: self.root,
                finished_work: self.current,
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: record.order() as u64,
            });
        }

        for record in self
            .function_component_layout_effect_callback_invocation_gate
            .records()
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Layout,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::LayoutEffectCallback,
                root: record.root(),
                finished_work: record.finished_work(),
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: record.invocation_order() as u64,
            });
        }

        for record in self.root_update_callback_invocation_gate.records() {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Layout,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::RootUpdateCallback,
                root: self.root,
                finished_work: self.current,
                fiber: self.current,
                tag: FiberTag::HostRoot,
                source_order: record.invocation_order() as u64,
            });
        }

        for record in self
            .function_component_committed_passive_effects
            .phase_records()
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Passive,
                metadata_kind: host_root_commit_order_passive_kind(record.phase()),
                root: self.root,
                finished_work: self.current,
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: host_root_commit_order_passive_source_order(record.order()),
            });
        }

        diagnostics
    }
}

fn collect_host_root_callback_drain_records_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    commit_order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    callbacks: &RootUpdateCallbackSnapshot,
) -> Result<Vec<HostRootCallbackDrainRecordForCanary>, RootCommitError> {
    let mut callback_records = Vec::with_capacity(
        callbacks.visible().len() + callbacks.hidden().len() + callbacks.deferred_hidden().len(),
    );
    callback_records.extend_from_slice(callbacks.visible());
    callback_records.extend_from_slice(callbacks.hidden());
    callback_records.extend_from_slice(callbacks.deferred_hidden());
    callback_records.sort_by_key(|record| {
        (
            record.sequence(),
            root_update_callback_visibility_order(record.visibility()),
        )
    });

    callback_records
        .into_iter()
        .enumerate()
        .map(|(callback_order, record)| {
            host_root_callback_drain_record_for_canary(
                store,
                root,
                commit_order,
                callback_order,
                render_lanes,
                finished_lanes,
                record,
            )
        })
        .collect()
}

fn host_root_callback_drain_record_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    commit_order: usize,
    callback_order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    record: RootUpdateCallbackRecord,
) -> Result<HostRootCallbackDrainRecordForCanary, RootCommitError> {
    let update_lanes = store.update_queues().update(record.update())?.lane();
    let callback_lanes = update_lanes.remove_lane(Lane::OFFSCREEN);

    Ok(HostRootCallbackDrainRecordForCanary {
        root,
        commit_order,
        callback_order,
        render_lanes,
        finished_lanes,
        queue: record.queue(),
        update: record.update(),
        callback: record.callback(),
        accepted_sequence: record.sequence(),
        visibility: record.visibility(),
        update_lanes,
        callback_lanes,
    })
}

const fn root_update_callback_visibility_order(visibility: RootUpdateCallbackVisibility) -> u8 {
    match visibility {
        RootUpdateCallbackVisibility::Visible => 0,
        RootUpdateCallbackVisibility::Hidden => 1,
        RootUpdateCallbackVisibility::DeferredHidden => 2,
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
    let deletion_subtree_traversal_gate = materialize_deletion_subtree_traversal_gate(
        store,
        root_id,
        finished_work,
        &deletion_lists,
    )?;
    let pending_host_node_deletion_cleanup =
        collect_pending_host_node_deletion_cleanup(store, root_id, finished_work, &deletion_lists)?;
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
    let root_update_callback_invocation_gate =
        materialize_root_update_callback_invocation_gate(&root_update_callbacks);
    let host_node_deletion_cleanup_log = materialize_host_node_deletion_cleanup_log(
        store,
        root_id,
        finished_work,
        pending_host_node_deletion_cleanup,
    )?;
    let ref_commit_metadata = materialize_ref_commit_metadata(store, pending_ref_commit_metadata)?;
    let dom_ref_callback_commit_gate =
        materialize_dom_ref_callback_commit_gate(store, &ref_commit_metadata)?;
    let ref_callback_execution_handoff =
        materialize_ref_callback_execution_handoff(store, &dom_ref_callback_commit_gate)?;
    let ref_cleanup_return_execution_gate =
        materialize_ref_cleanup_return_execution_gate(store, &ref_callback_execution_handoff)?;

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
        root_update_callback_invocation_gate,
        pending_passive_handoff,
        function_component_committed_passive_effects:
            FunctionComponentCommittedPassiveEffectsSnapshot::default(),
        function_component_deleted_subtree_passive_effects:
            FunctionComponentDeletedSubtreePassiveEffectsSnapshot::default(),
        function_component_layout_effects: FunctionComponentLayoutEffectsSnapshot::default(),
        function_component_layout_effect_callback_invocation_gate:
            FunctionComponentLayoutEffectCallbackInvocationGateSnapshot::default(),
        function_component_effect_list_commit_phase_order:
            FunctionComponentEffectListCommitPhaseOrderSnapshot::default(),
        deletion_lists,
        deletion_subtree_traversal_gate,
        host_node_deletion_cleanup_log,
        ref_commit_metadata,
        dom_ref_callback_commit_gate,
        ref_callback_execution_handoff,
        ref_cleanup_return_execution_gate,
    })
}

#[cfg(test)]
pub(crate) fn record_host_root_finished_work_pending_commit_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    handoff_order: usize,
) -> Result<
    HostRootFinishedWorkPendingCommitRecordForCanary,
    HostRootFinishedWorkCommitHandoffErrorForCanary,
> {
    validate_finished_host_root(store, render)?;
    let root = store.root(render.root()).map_err(RootCommitError::from)?;

    Ok(HostRootFinishedWorkPendingCommitRecordForCanary {
        root: render.root(),
        root_token: render.root().state_node_handle(),
        previous_current: render.current(),
        pending_work: root.scheduling().work_in_progress(),
        finished_work: render.finished_work(),
        render_lanes: render.render_lanes(),
        finished_lanes: render.render_lanes(),
        remaining_lanes: render.remaining_lanes(),
        pending_lanes_before_commit: root.lanes().pending_lanes(),
        handoff_order,
    })
}

#[cfg(test)]
pub(crate) fn commit_finished_host_root_with_finished_work_handoff_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: Option<HostRootFinishedWorkPendingCommitRecordForCanary>,
    commit_order: usize,
) -> Result<
    HostRootFinishedWorkCommitHandoffRecordForCanary,
    HostRootFinishedWorkCommitHandoffErrorForCanary,
> {
    let Some(pending) = pending else {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::MissingFinishedWorkRecord {
                root: render.root(),
                finished_work: render.finished_work(),
            },
        );
    };

    validate_host_root_finished_work_pending_commit_for_canary(store, render, pending)?;
    let execution_request =
        HostRootFinishedWorkCommitExecutionRequestForCanary::new(pending, commit_order);
    let commit = commit_finished_host_root(store, render)?;
    let root = store.root(render.root()).map_err(RootCommitError::from)?;

    Ok(HostRootFinishedWorkCommitHandoffRecordForCanary {
        pending,
        execution_request,
        commit_order,
        commit,
        current_after_commit: root.current(),
        finished_work_after_commit: root.finished_work(),
        finished_lanes_after_commit: root.finished_lanes(),
        render_phase_work_after_commit: root.scheduling().work_in_progress(),
    })
}

#[cfg(test)]
fn validate_host_root_finished_work_pending_commit_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
) -> Result<(), HostRootFinishedWorkCommitHandoffErrorForCanary> {
    let expected_root = render.root();
    let expected_root_token = expected_root.state_node_handle();
    if pending.root != expected_root || pending.root_token != expected_root_token {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::ForeignFinishedWorkRecord {
                expected_root,
                actual_root: pending.root,
                expected_root_token,
                actual_root_token: pending.root_token,
            },
        );
    }

    let root = store.root(expected_root).map_err(RootCommitError::from)?;
    let actual_current = root.current();
    let actual_pending_work = root.scheduling().work_in_progress();
    let expected_pending_work = Some(render.finished_work());

    if actual_current == pending.finished_work && actual_pending_work.is_none() {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::AlreadyCommittedFinishedWorkRecord {
                root: expected_root,
                current: actual_current,
                finished_work: pending.finished_work,
                pending_work_after_commit: actual_pending_work,
                handoff_order: pending.handoff_order,
            },
        );
    }

    if pending.previous_current != render.current()
        || pending.finished_work != render.finished_work()
        || pending.pending_work != expected_pending_work
        || actual_current != pending.previous_current
        || actual_pending_work != expected_pending_work
    {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::StaleFinishedWorkRecord {
                root: expected_root,
                expected_current: pending.previous_current,
                actual_current,
                expected_pending_work,
                actual_pending_work,
                finished_work: pending.finished_work,
            },
        );
    }

    let actual_pending_lanes = root.lanes().pending_lanes();
    if pending.render_lanes != render.render_lanes()
        || pending.finished_lanes != render.render_lanes()
        || pending.remaining_lanes != render.remaining_lanes()
        || pending.pending_lanes_before_commit != actual_pending_lanes
    {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::FinishedWorkRecordLanesMismatch {
                root: expected_root,
                expected_render_lanes: render.render_lanes(),
                actual_render_lanes: pending.render_lanes,
                expected_remaining_lanes: render.remaining_lanes(),
                actual_remaining_lanes: pending.remaining_lanes,
                expected_pending_lanes: actual_pending_lanes,
                actual_pending_lanes: pending.pending_lanes_before_commit,
            },
        );
    }

    Ok(())
}

#[allow(
    dead_code,
    reason = "crate-private HostRoot commit recovery diagnostics are reserved for private sync-flush error workers"
)]
pub(crate) fn host_root_commit_recovery_snapshot_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
) -> Result<HostRootCommitRecoverySnapshotForCanary, RootCommitError> {
    let root = store.root(render.root())?;
    let scheduling = root.scheduling();
    let root_update_callbacks = store
        .update_queues()
        .peek_root_update_callback_records(render.work_in_progress_update_queue())?;

    Ok(HostRootCommitRecoverySnapshotForCanary {
        root: render.root(),
        current: root.current(),
        render_lanes: render.render_lanes(),
        pending_lanes: root.lanes().pending_lanes(),
        callback_node: scheduling.callback_node(),
        callback_priority: scheduling.callback_priority(),
        render_phase_work: scheduling.work_in_progress(),
        render_phase_lanes: scheduling.work_in_progress_root_render_lanes(),
        callback_queue: render.work_in_progress_update_queue(),
        root_update_callbacks,
    })
}

impl<H: HostTypes> FiberRootStore<H> {
    pub fn prepare_test_renderer_host_output_stable_sibling_insertion_children_for_canary(
        &mut self,
        render: HostRootRenderPhaseRecord,
        inserted: TestRendererHostOutputCanaryPreparedFibers,
        stable: TestRendererHostOutputCanaryUpdatedFibers,
        clear_stable_sibling_state_node: bool,
    ) -> Result<(), TestRendererHostOutputCanaryError> {
        if inserted.root() != render.root() {
            return Err(TestRendererHostOutputCanaryError::RootMismatch {
                expected: render.root(),
                actual: inserted.root(),
            });
        }
        if stable.root() != render.root() {
            return Err(TestRendererHostOutputCanaryError::RootMismatch {
                expected: render.root(),
                actual: stable.root(),
            });
        }
        if inserted.host_root() != render.work_in_progress() {
            return Err(TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
                expected: render.work_in_progress(),
                actual: inserted.host_root(),
            });
        }
        if stable.host_root() != render.work_in_progress() {
            return Err(TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
                expected: render.work_in_progress(),
                actual: stable.host_root(),
            });
        }

        self.fiber_arena_mut().set_children(
            render.work_in_progress(),
            &[inserted.component(), stable.component()],
        )?;
        if clear_stable_sibling_state_node {
            self.fiber_arena_mut()
                .get_mut(stable.component())?
                .set_state_node(StateNodeHandle::NONE);
        }

        Ok(())
    }
}

#[allow(
    dead_code,
    reason = "crate-private committed hook-effect ownership helper for future passive traversal"
)]
pub(crate) fn commit_function_component_effect_queues_for_committed_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    hook_store: &mut FunctionComponentHookRenderStore,
    lanes: Lanes,
) -> Result<Vec<FunctionComponentCommittedEffectQueue>, RootCommitError> {
    let current = store.root(root)?.current();
    let mut queues = Vec::new();
    commit_function_component_effect_queues_for_committed_subtree(
        store.fiber_arena(),
        current,
        hook_store,
        lanes,
        &mut queues,
    )?;
    Ok(queues)
}

fn commit_function_component_effect_queues_for_committed_subtree(
    arena: &FiberArena,
    fiber: FiberId,
    hook_store: &mut FunctionComponentHookRenderStore,
    lanes: Lanes,
    queues: &mut Vec<FunctionComponentCommittedEffectQueue>,
) -> Result<(), RootCommitError> {
    let node = arena.get(fiber)?;
    if node.tag() == FiberTag::FunctionComponent
        && let Some(queue) = hook_store
            .commit_pending_effect_queue_for_fiber(fiber, lanes)
            .map_err(
                |error| RootCommitError::FunctionComponentCommittedEffectQueue {
                    fiber,
                    message: error.to_string(),
                },
            )?
    {
        queues.push(queue);
    }

    if let Some(child) = node.child() {
        commit_function_component_effect_queues_for_committed_subtree(
            arena, child, hook_store, lanes, queues,
        )?;
    }
    if let Some(sibling) = node.sibling() {
        commit_function_component_effect_queues_for_committed_subtree(
            arena, sibling, hook_store, lanes, queues,
        )?;
    }

    Ok(())
}

#[allow(
    dead_code,
    reason = "crate-private layout hook-effect handoff helper exercised by deterministic canaries"
)]
pub(crate) fn record_function_component_layout_effects_for_committed_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    hook_store: &mut FunctionComponentHookRenderStore,
    lanes: Lanes,
) -> Result<FunctionComponentLayoutEffectsSnapshot, RootCommitError> {
    let current = store.root(root)?.current();
    let mut records = Vec::new();
    record_function_component_layout_effects_for_committed_subtree(
        store.fiber_arena(),
        root,
        current,
        hook_store,
        lanes,
        &mut records,
    )?;
    Ok(FunctionComponentLayoutEffectsSnapshot { records })
}

fn record_function_component_layout_effects_for_committed_subtree(
    arena: &FiberArena,
    root: FiberRootId,
    fiber: FiberId,
    hook_store: &mut FunctionComponentHookRenderStore,
    lanes: Lanes,
    records: &mut Vec<FunctionComponentLayoutEffectCommitRecord>,
) -> Result<(), RootCommitError> {
    let node = arena.get(fiber)?;
    let tag = node.tag();
    let flags = node.flags();
    let child = node.child();
    let sibling = node.sibling();

    if let Some(child) = child {
        record_function_component_layout_effects_for_committed_subtree(
            arena, root, child, hook_store, lanes, records,
        )?;
    }

    if tag == FiberTag::FunctionComponent && flags.contains_any(FiberFlags::UPDATE) {
        hook_store
            .commit_pending_effect_queue_for_fiber(fiber, lanes)
            .map_err(
                |error| RootCommitError::FunctionComponentLayoutEffectQueue {
                    fiber,
                    message: error.to_string(),
                },
            )?;

        if let Some(queue) = hook_store.committed_effect_queue(fiber) {
            validate_layout_effect_queue_lanes(root, queue, fiber, lanes)?;

            for metadata in queue.layout_effect_metadata(HookEffectFlags::LAYOUT_EFFECT) {
                validate_layout_effect_metadata_for_committed_queue(root, queue, metadata)?;
                let destroy_order = match metadata.dependency_phase() {
                    FunctionComponentEffectDependencyPhase::UpdateChanged => {
                        Some(layout_destroy_handoff_count(records))
                    }
                    FunctionComponentEffectDependencyPhase::Mount => None,
                    FunctionComponentEffectDependencyPhase::UpdateUnchanged => {
                        return Err(RootCommitError::LayoutEffectHandoffRecordMismatch {
                            root,
                            fiber,
                            effect: metadata.effect(),
                            message:
                                "unchanged layout effect was selected for create/destroy handoff"
                                    .to_owned(),
                        });
                    }
                };
                records.push(function_component_layout_effect_commit_record(
                    records.len(),
                    destroy_order,
                    metadata,
                ));
            }
        }
    }

    if let Some(sibling) = sibling {
        record_function_component_layout_effects_for_committed_subtree(
            arena, root, sibling, hook_store, lanes, records,
        )?;
    }

    Ok(())
}

fn validate_layout_effect_queue_lanes(
    root: FiberRootId,
    queue: &FunctionComponentCommittedEffectQueue,
    fiber: FiberId,
    lanes: Lanes,
) -> Result<(), RootCommitError> {
    if queue.fiber() != fiber {
        return Err(RootCommitError::LayoutEffectHandoffFiberMismatch {
            root,
            expected: fiber,
            actual: queue.fiber(),
        });
    }
    if queue.lanes() != lanes {
        return Err(RootCommitError::LayoutEffectHandoffLanesMismatch {
            root,
            fiber,
            expected: lanes,
            actual: queue.lanes(),
        });
    }
    Ok(())
}

fn validate_layout_effect_metadata_for_committed_queue(
    root: FiberRootId,
    queue: &FunctionComponentCommittedEffectQueue,
    metadata: FunctionComponentLayoutEffectMetadata,
) -> Result<(), RootCommitError> {
    if metadata.fiber() != queue.fiber() {
        return Err(layout_effect_record_mismatch(
            root,
            queue.fiber(),
            metadata.effect(),
            "metadata fiber does not match committed queue owner",
        ));
    }
    if metadata.render_phase() != queue.phase() {
        return Err(layout_effect_record_mismatch(
            root,
            queue.fiber(),
            metadata.effect(),
            "metadata render phase does not match committed queue phase",
        ));
    }
    if metadata.lanes() != queue.lanes() {
        return Err(RootCommitError::LayoutEffectHandoffLanesMismatch {
            root,
            fiber: queue.fiber(),
            expected: queue.lanes(),
            actual: metadata.lanes(),
        });
    }
    if !metadata.tag().fires_in_layout() {
        return Err(layout_effect_record_mismatch(
            root,
            queue.fiber(),
            metadata.effect(),
            "metadata tag is not eligible for layout create handoff",
        ));
    }

    let Some(record) = queue
        .records()
        .iter()
        .find(|record| record.effect() == metadata.effect())
    else {
        return Err(layout_effect_record_mismatch(
            root,
            queue.fiber(),
            metadata.effect(),
            "metadata effect is missing from committed queue",
        ));
    };

    if record.instance() != metadata.instance()
        || record.tag() != metadata.tag()
        || record.create() != metadata.create()
        || record.destroy() != metadata.destroy()
        || record.previous_effect() != metadata.previous_effect()
        || record.previous_dependencies() != metadata.previous_dependencies()
        || record.dependencies() != metadata.dependencies()
        || record.dependency_status() != metadata.dependency_status()
    {
        return Err(layout_effect_record_mismatch(
            root,
            queue.fiber(),
            metadata.effect(),
            "metadata fields do not match committed queue record",
        ));
    }

    Ok(())
}

fn layout_effect_record_mismatch(
    root: FiberRootId,
    fiber: FiberId,
    effect: HookEffectId,
    message: &'static str,
) -> RootCommitError {
    RootCommitError::LayoutEffectHandoffRecordMismatch {
        root,
        fiber,
        effect,
        message: message.to_owned(),
    }
}

fn layout_destroy_handoff_count(records: &[FunctionComponentLayoutEffectCommitRecord]) -> usize {
    records
        .iter()
        .filter(|record| record.destroy_order().is_some())
        .count()
}

const fn function_component_layout_effect_commit_record(
    commit_order: usize,
    destroy_order: Option<usize>,
    metadata: FunctionComponentLayoutEffectMetadata,
) -> FunctionComponentLayoutEffectCommitRecord {
    FunctionComponentLayoutEffectCommitRecord {
        commit_order,
        destroy_order,
        create_order: commit_order,
        fiber: metadata.fiber(),
        render_phase: metadata.render_phase(),
        dependency_phase: metadata.dependency_phase(),
        hook_list: metadata.hook_list(),
        effect_index: metadata.effect_index(),
        effect: metadata.effect(),
        previous_effect: metadata.previous_effect(),
        instance: metadata.instance(),
        tag: metadata.tag(),
        create: metadata.create(),
        destroy: metadata.destroy(),
        previous_dependencies: metadata.previous_dependencies(),
        dependencies: metadata.dependencies(),
        dependency_status: metadata.dependency_status(),
        lanes: metadata.lanes(),
    }
}

fn execute_function_component_layout_effect_callback_record_under_test_control<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    hook_store: &FunctionComponentHookRenderStore,
    layout_snapshot: &FunctionComponentLayoutEffectsSnapshot,
    effect_list_snapshot: &FunctionComponentEffectListCommitPhaseOrderSnapshot,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
    control: &mut impl FunctionComponentLayoutEffectCallbackInvocationTestControl,
) -> Result<FunctionComponentLayoutEffectCallbackInvocationGateSnapshot, RootCommitError> {
    let (layout_record, matched_mutation_sequence, first_passive_sequence) =
        validate_layout_effect_callback_execution_record(
            store,
            root,
            finished_work,
            lanes,
            hook_store,
            layout_snapshot,
            effect_list_snapshot,
            record,
        )?;
    let callback = layout_record.create().ok_or_else(|| {
        RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
            root,
            fiber: layout_record.fiber(),
            effect: Some(layout_record.effect()),
            message: "layout create phase record does not carry a create callback".to_owned(),
        }
    })?;
    let request = FunctionComponentLayoutEffectCallbackInvocationRequest {
        invocation_order: 0,
        root,
        finished_work,
        lanes,
        source: layout_record,
        effect_list_sequence: record.sequence(),
        matched_mutation_sequence,
        first_passive_sequence,
        callback,
    };
    let (status, error) = match control.invoke_layout_effect_create(request) {
        Ok(()) => (
            FunctionComponentLayoutEffectCallbackInvocationStatus::Completed,
            None,
        ),
        Err(error) => (
            FunctionComponentLayoutEffectCallbackInvocationStatus::Errored,
            Some(error),
        ),
    };

    Ok(
        FunctionComponentLayoutEffectCallbackInvocationGateSnapshot {
            root: Some(root),
            finished_work: Some(finished_work),
            lanes,
            records: vec![FunctionComponentLayoutEffectCallbackInvocationRecord {
                request,
                status,
                error,
            }],
        },
    )
}

fn validate_layout_effect_callback_execution_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    hook_store: &FunctionComponentHookRenderStore,
    layout_snapshot: &FunctionComponentLayoutEffectsSnapshot,
    effect_list_snapshot: &FunctionComponentEffectListCommitPhaseOrderSnapshot,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
) -> Result<
    (
        FunctionComponentLayoutEffectPhaseCommitRecord,
        usize,
        Option<usize>,
    ),
    RootCommitError,
> {
    validate_layout_effect_callback_record_phase(root, record)?;
    let tag = store.fiber_arena().get(record.fiber())?.tag();
    if tag != FiberTag::FunctionComponent {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionUnsupportedFiberTag {
                root,
                fiber: record.fiber(),
                tag,
                unsupported_feature: unsupported_reconciler_feature_for_fiber_tag(tag)
                    .map(|feature| feature.feature()),
            },
        );
    }
    validate_layout_effect_callback_effect_list_snapshot(
        root,
        finished_work,
        lanes,
        effect_list_snapshot,
        record,
    )?;

    let first_passive_sequence = effect_list_snapshot
        .records()
        .iter()
        .find(|accepted| {
            accepted.phase() == FunctionComponentEffectListCommitPhase::PassiveScheduling
        })
        .map(|accepted| accepted.sequence());
    if matches!(first_passive_sequence, Some(sequence) if sequence <= record.sequence()) {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionPassiveRecordRejected {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
            },
        );
    }

    let matched_mutation_sequence =
        matching_layout_effect_mutation_sequence(effect_list_snapshot, record).ok_or_else(
            || RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "layout create callback record has no accepted mutation destroy metadata"
                    .to_owned(),
            },
        )?;
    if matched_mutation_sequence >= record.sequence() {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "layout create callback is not after matching mutation metadata"
                    .to_owned(),
            },
        );
    }

    let layout_record = matching_layout_effect_create_phase_record(layout_snapshot, record)
        .ok_or_else(
            || RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "layout callback record is missing from accepted layout metadata"
                    .to_owned(),
            },
        )?;
    validate_layout_effect_callback_committed_effect_ring(root, hook_store, record, layout_record)?;

    Ok((
        layout_record,
        matched_mutation_sequence,
        first_passive_sequence,
    ))
}

fn validate_layout_effect_callback_record_phase(
    root: FiberRootId,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
) -> Result<(), RootCommitError> {
    if record.phase() == FunctionComponentEffectListCommitPhase::PassiveScheduling {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionPassiveRecordRejected {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
            },
        );
    }
    if record.phase() != FunctionComponentEffectListCommitPhase::Layout
        || record.kind() != FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate
        || record.create().is_none()
    {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "layout callback execution requires a layout-create effect-list record"
                    .to_owned(),
            },
        );
    }

    Ok(())
}

fn validate_layout_effect_callback_effect_list_snapshot(
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    snapshot: &FunctionComponentEffectListCommitPhaseOrderSnapshot,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
) -> Result<(), RootCommitError> {
    if snapshot.root() != Some(root) {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "effect-list snapshot root does not match commit root".to_owned(),
            },
        );
    }
    if snapshot.finished_work() != Some(finished_work) {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "effect-list snapshot finished work does not match commit current"
                    .to_owned(),
            },
        );
    }
    if snapshot.lanes() != lanes {
        return Err(RootCommitError::LayoutEffectHandoffLanesMismatch {
            root,
            fiber: record.fiber(),
            expected: lanes,
            actual: snapshot.lanes(),
        });
    }

    let Some(accepted) = snapshot
        .records()
        .iter()
        .find(|accepted| accepted.sequence() == record.sequence())
    else {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "layout callback record is missing from effect-list snapshot".to_owned(),
            },
        );
    };
    if *accepted != record {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "layout callback record does not match effect-list snapshot sequence"
                    .to_owned(),
            },
        );
    }

    Ok(())
}

fn matching_layout_effect_mutation_sequence(
    snapshot: &FunctionComponentEffectListCommitPhaseOrderSnapshot,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
) -> Option<usize> {
    snapshot
        .records()
        .iter()
        .find(|accepted| {
            accepted.phase() == FunctionComponentEffectListCommitPhase::Mutation
                && accepted.kind() == FunctionComponentEffectListCommitPhaseOrderKind::LayoutDestroy
                && accepted.fiber() == record.fiber()
                && accepted.hook_list() == record.hook_list()
                && accepted.lanes() == record.lanes()
                && accepted.previous_effect() == record.previous_effect()
                && accepted.destroy().is_some()
                && accepted.sequence() < record.sequence()
        })
        .map(|accepted| accepted.sequence())
}

fn matching_layout_effect_create_phase_record(
    snapshot: &FunctionComponentLayoutEffectsSnapshot,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
) -> Option<FunctionComponentLayoutEffectPhaseCommitRecord> {
    snapshot
        .create_phase_records()
        .into_iter()
        .find(|accepted| {
            accepted.fiber() == record.fiber()
                && accepted.hook_list() == record.hook_list()
                && accepted.render_phase() == record.render_phase()
                && accepted.lanes() == record.lanes()
                && Some(accepted.effect_index()) == record.effect_index()
                && Some(accepted.effect()) == record.effect()
                && accepted.previous_effect() == record.previous_effect()
                && accepted.create() == record.create()
                && accepted.destroy() == record.destroy()
        })
}

fn validate_layout_effect_callback_committed_effect_ring(
    root: FiberRootId,
    hook_store: &FunctionComponentHookRenderStore,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
    layout_record: FunctionComponentLayoutEffectPhaseCommitRecord,
) -> Result<(), RootCommitError> {
    let current_list = hook_store.current_list(record.fiber());
    if current_list != Some(record.hook_list()) {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionStaleEffectRing {
                root,
                fiber: record.fiber(),
                hook_list: record.hook_list(),
                current_list,
            },
        );
    }

    let Some(queue) = hook_store.committed_effect_queue(record.fiber()) else {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionStaleEffectRing {
                root,
                fiber: record.fiber(),
                hook_list: record.hook_list(),
                current_list,
            },
        );
    };
    if queue.hook_list() != record.hook_list()
        || queue.phase() != record.render_phase()
        || queue.lanes() != record.lanes()
    {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionStaleEffectRing {
                root,
                fiber: record.fiber(),
                hook_list: record.hook_list(),
                current_list,
            },
        );
    }

    let Some(effect) = record.effect() else {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: None,
                message: "layout callback record does not carry an effect id".to_owned(),
            },
        );
    };
    let Some(committed_record) = queue
        .records()
        .iter()
        .find(|committed| committed.effect() == effect)
    else {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionStaleEffectRing {
                root,
                fiber: record.fiber(),
                hook_list: record.hook_list(),
                current_list,
            },
        );
    };

    if !committed_record.accepted_for_layout_commit()
        || committed_record.previous_effect() != layout_record.previous_effect()
        || committed_record.instance() != layout_record.instance()
        || committed_record.create() != layout_record.create().expect("layout create checked")
        || committed_record.previous_dependencies() != layout_record.previous_dependencies()
        || committed_record.dependencies() != layout_record.dependencies()
        || committed_record.dependency_status() != layout_record.dependency_status()
    {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: Some(effect),
                message: "layout callback record fields do not match committed effect ring"
                    .to_owned(),
            },
        );
    }

    Ok(())
}

fn validate_function_component_effect_list_passive_handoffs<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    pending_handoff: Option<PendingPassiveCommitHandoff>,
    hook_store: &FunctionComponentHookRenderStore,
    passive_handoffs: &[FunctionComponentPendingPassiveCommitHandoff],
) -> Result<Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord>, RootCommitError> {
    let Some(pending_handoff) = pending_handoff else {
        if passive_handoffs.is_empty() {
            return Ok(Vec::new());
        }

        return Err(RootCommitError::CommittedPassiveEffectsWithoutPendingPassiveHandoff { root });
    };

    if pending_handoff.root() != root {
        return Err(RootCommitError::CommittedPassiveEffectHandoffRootMismatch {
            commit_root: root,
            handoff_root: pending_handoff.root(),
        });
    }
    if pending_handoff.finished_work() != finished_work {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffFinishedWorkMismatch {
                root,
                expected: finished_work,
                actual: Some(pending_handoff.finished_work()),
            },
        );
    }
    if pending_handoff.lanes() != lanes {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                root,
                expected: lanes,
                actual: pending_handoff.lanes(),
            },
        );
    }

    let pending_passive = store.root(root)?.scheduling().pending_passive();
    validate_function_component_effect_list_pending_passive_handoff(
        pending_handoff,
        pending_passive,
    )?;

    let mut phase_records = Vec::new();
    let mut actual_unmounts = 0;
    let mut actual_mounts = 0;

    for passive_handoff in passive_handoffs {
        if passive_handoff.root() != root {
            return Err(RootCommitError::CommittedPassiveEffectHandoffRootMismatch {
                commit_root: root,
                handoff_root: passive_handoff.root(),
            });
        }
        if passive_handoff.lanes() != lanes {
            return Err(
                RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                    root,
                    expected: lanes,
                    actual: passive_handoff.lanes(),
                },
            );
        }
        if !committed_subtree_contains_fiber(
            store.fiber_arena(),
            finished_work,
            passive_handoff.fiber(),
        )? {
            return Err(RootCommitError::CommittedPassiveEffectHandoffFiberStale {
                root,
                finished_work,
                fiber: passive_handoff.fiber(),
            });
        }

        let Some(queue) = hook_store.committed_effect_queue(passive_handoff.fiber()) else {
            return Err(
                RootCommitError::CommittedPassiveEffectHandoffCommittedQueueMissing {
                    root,
                    fiber: passive_handoff.fiber(),
                },
            );
        };
        validate_function_component_effect_list_committed_queue(
            root,
            queue,
            passive_handoff.phase(),
            lanes,
            passive_handoff
                .records()
                .first()
                .map(|record| record.effect()),
        )?;
        for record in passive_handoff.records() {
            validate_function_component_effect_list_passive_record(root, queue, *record)?;
        }

        actual_unmounts += passive_handoff.queued_unmount_count();
        actual_mounts += passive_handoff.queued_mount_count();
        phase_records.extend(passive_handoff.effect_phase_records());
    }

    if actual_unmounts != pending_handoff.pending_unmount_count()
        || actual_mounts != pending_handoff.pending_mount_count()
    {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffRecordCountMismatch {
                root,
                expected_unmounts: pending_handoff.pending_unmount_count(),
                actual_unmounts,
                expected_mounts: pending_handoff.pending_mount_count(),
                actual_mounts,
            },
        );
    }

    phase_records.sort_by_key(|record| record.order());
    for pair in phase_records.windows(2) {
        if pair[0].order() == pair[1].order() {
            return Err(
                RootCommitError::CommittedPassiveEffectHandoffDuplicateOrder {
                    root,
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
                RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                    root,
                    fiber: pending.fiber(),
                    effect: None,
                    message: "pending passive order is missing from effect-list handoff".to_owned(),
                },
            );
        };

        if effect_record.fiber() != pending.fiber()
            || effect_record.phase() != pending.order().phase()
            || effect_record.lanes() != pending.lanes()
        {
            return Err(
                RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                    root,
                    fiber: pending.fiber(),
                    effect: Some(effect_record.effect()),
                    message: "pending passive record does not match effect-list handoff".to_owned(),
                },
            );
        }
    }

    Ok(phase_records)
}

fn validate_function_component_effect_list_pending_passive_handoff(
    handoff: PendingPassiveCommitHandoff,
    pending_passive: &PendingPassiveState,
) -> Result<(), RootCommitError> {
    if pending_passive.root() != Some(handoff.root()) {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffPendingRootMismatch {
                commit_root: handoff.root(),
                pending_root: pending_passive.root(),
            },
        );
    }
    if pending_passive.finished_work() != Some(handoff.finished_work()) {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffFinishedWorkMismatch {
                root: handoff.root(),
                expected: handoff.finished_work(),
                actual: pending_passive.finished_work(),
            },
        );
    }
    if pending_passive.lanes() != handoff.lanes() {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                root: handoff.root(),
                expected: handoff.lanes(),
                actual: pending_passive.lanes(),
            },
        );
    }

    let actual_unmounts = pending_passive.passive_unmounts().len();
    let actual_mounts = pending_passive.passive_mounts().len();
    if actual_unmounts != handoff.pending_unmount_count()
        || actual_mounts != handoff.pending_mount_count()
    {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffRecordCountMismatch {
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

fn validate_function_component_effect_list_committed_queue(
    root: FiberRootId,
    queue: &FunctionComponentCommittedEffectQueue,
    phase: FunctionComponentHookRenderPhase,
    lanes: Lanes,
    effect: Option<HookEffectId>,
) -> Result<(), RootCommitError> {
    if queue.phase() != phase {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                root,
                fiber: queue.fiber(),
                effect,
                message: "committed effect queue phase does not match passive handoff".to_owned(),
            },
        );
    }
    if queue.lanes() != lanes {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                root,
                expected: lanes,
                actual: queue.lanes(),
            },
        );
    }
    Ok(())
}

fn validate_function_component_effect_list_passive_record(
    root: FiberRootId,
    queue: &FunctionComponentCommittedEffectQueue,
    record: FunctionComponentPendingPassiveEffectCommitRecord,
) -> Result<(), RootCommitError> {
    if record.fiber() != queue.fiber() {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: Some(record.effect()),
                message: "passive effect record fiber does not match committed queue owner"
                    .to_owned(),
            },
        );
    }
    if record.lanes() != queue.lanes() {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                root,
                expected: queue.lanes(),
                actual: record.lanes(),
            },
        );
    }

    let Some(committed_record) = queue
        .records()
        .iter()
        .find(|committed| committed.effect() == record.effect())
    else {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: Some(record.effect()),
                message: "passive effect record is missing from committed queue".to_owned(),
            },
        );
    };

    if !committed_record.accepted_for_pending_passive()
        || committed_record.instance() != record.instance()
        || committed_record.create() != record.create()
        || committed_record.destroy() != record.destroy()
    {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: Some(record.effect()),
                message: "passive effect record fields do not match committed queue".to_owned(),
            },
        );
    }

    Ok(())
}

fn committed_subtree_contains_fiber(
    arena: &FiberArena,
    fiber: FiberId,
    target: FiberId,
) -> Result<bool, RootCommitError> {
    if fiber == target {
        return Ok(true);
    }

    for child in arena.child_ids(fiber)? {
        if committed_subtree_contains_fiber(arena, child, target)? {
            return Ok(true);
        }
    }

    Ok(false)
}

fn build_function_component_effect_list_commit_phase_order_snapshot<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    hook_store: &FunctionComponentHookRenderStore,
    layout_snapshot: &FunctionComponentLayoutEffectsSnapshot,
    passive_snapshot: &FunctionComponentCommittedPassiveEffectsSnapshot,
    passive_phase_records: &[FunctionComponentPendingPassiveEffectPhaseCommitRecord],
) -> Result<FunctionComponentEffectListCommitPhaseOrderSnapshot, RootCommitError> {
    let mut snapshot = FunctionComponentEffectListCommitPhaseOrderSnapshot {
        root: Some(root),
        finished_work: Some(finished_work),
        lanes,
        records: Vec::new(),
    };
    let mut effect_list_fibers = Vec::new();
    collect_committed_function_component_effect_list_fibers(
        store.fiber_arena(),
        finished_work,
        hook_store,
        &mut effect_list_fibers,
    )?;

    for (source_order, fiber) in effect_list_fibers.iter().copied().enumerate() {
        let Some(queue) = hook_store.committed_effect_queue(fiber) else {
            continue;
        };
        snapshot.push(FunctionComponentEffectListCommitPhaseOrderRecordInput {
            phase: FunctionComponentEffectListCommitPhase::BeforeMutation,
            kind: FunctionComponentEffectListCommitPhaseOrderKind::EffectListBeforeMutation,
            root,
            finished_work,
            fiber,
            hook_list: queue.hook_list(),
            render_phase: queue.phase(),
            lanes: queue.lanes(),
            effect_index: None,
            effect: None,
            previous_effect: None,
            create: None,
            destroy: None,
            source_order: source_order as u64,
        });
    }

    for record in layout_snapshot.destroy_phase_records() {
        snapshot.push(FunctionComponentEffectListCommitPhaseOrderRecordInput {
            phase: FunctionComponentEffectListCommitPhase::Mutation,
            kind: FunctionComponentEffectListCommitPhaseOrderKind::LayoutDestroy,
            root,
            finished_work,
            fiber: record.fiber(),
            hook_list: record.hook_list(),
            render_phase: record.render_phase(),
            lanes: record.lanes(),
            effect_index: Some(record.effect_index()),
            effect: Some(record.effect()),
            previous_effect: record.previous_effect(),
            create: record.create(),
            destroy: record.destroy(),
            source_order: record.order() as u64,
        });
    }

    for record in layout_snapshot.create_phase_records() {
        snapshot.push(FunctionComponentEffectListCommitPhaseOrderRecordInput {
            phase: FunctionComponentEffectListCommitPhase::Layout,
            kind: FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate,
            root,
            finished_work,
            fiber: record.fiber(),
            hook_list: record.hook_list(),
            render_phase: record.render_phase(),
            lanes: record.lanes(),
            effect_index: Some(record.effect_index()),
            effect: Some(record.effect()),
            previous_effect: record.previous_effect(),
            create: record.create(),
            destroy: record.destroy(),
            source_order: record.order() as u64,
        });
    }

    for record in passive_phase_records {
        let queue = hook_store.committed_effect_queue(record.fiber()).ok_or(
            RootCommitError::CommittedPassiveEffectHandoffCommittedQueueMissing {
                root,
                fiber: record.fiber(),
            },
        )?;
        snapshot.push(FunctionComponentEffectListCommitPhaseOrderRecordInput {
            phase: FunctionComponentEffectListCommitPhase::PassiveScheduling,
            kind: function_component_effect_list_passive_schedule_kind(record.phase()),
            root,
            finished_work,
            fiber: record.fiber(),
            hook_list: queue.hook_list(),
            render_phase: queue.phase(),
            lanes: record.lanes(),
            effect_index: Some(record.effect_index()),
            effect: Some(record.effect()),
            previous_effect: None,
            create: record.create(),
            destroy: record.destroy(),
            source_order: host_root_commit_order_passive_source_order(record.order()),
        });
    }

    debug_assert_eq!(
        snapshot.passive_unmount_schedule_count(),
        passive_snapshot.queued_unmount_count()
    );
    debug_assert_eq!(
        snapshot.passive_mount_schedule_count(),
        passive_snapshot.queued_mount_count()
    );

    Ok(snapshot)
}

fn collect_committed_function_component_effect_list_fibers(
    arena: &FiberArena,
    fiber: FiberId,
    hook_store: &FunctionComponentHookRenderStore,
    effect_list_fibers: &mut Vec<FiberId>,
) -> Result<(), RootCommitError> {
    let node = arena.get(fiber)?;
    if node.tag() == FiberTag::FunctionComponent
        && let Some(queue) = hook_store.committed_effect_queue(fiber)
        && (queue.accepted_layout_count() > 0 || queue.accepted_passive_count() > 0)
    {
        effect_list_fibers.push(fiber);
    }

    for child in arena.child_ids(fiber)? {
        collect_committed_function_component_effect_list_fibers(
            arena,
            child,
            hook_store,
            effect_list_fibers,
        )?;
    }

    Ok(())
}

const fn function_component_effect_list_passive_schedule_kind(
    phase: PendingPassiveEffectPhase,
) -> FunctionComponentEffectListCommitPhaseOrderKind {
    match phase {
        PendingPassiveEffectPhase::Unmount => {
            FunctionComponentEffectListCommitPhaseOrderKind::PassiveUnmountScheduled
        }
        PendingPassiveEffectPhase::Mount => {
            FunctionComponentEffectListCommitPhaseOrderKind::PassiveMountScheduled
        }
    }
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
        create: passive_effect.create(),
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

#[allow(
    dead_code,
    reason = "crate-private deleted-subtree passive destroy handoff helper exercised by deterministic canaries"
)]
pub(crate) fn queue_function_component_deleted_subtree_pending_passive_effects<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root: FiberRootId,
    hook_store: &FunctionComponentHookRenderStore,
    nearest_mounted_ancestor: FiberId,
    deleted_root: FiberId,
    lanes: Lanes,
) -> Result<FunctionComponentDeletedSubtreePendingPassiveCommitHandoff, RootCommitError> {
    store.root(root)?;
    store.fiber_arena().get(nearest_mounted_ancestor)?;
    store.fiber_arena().get(deleted_root)?;

    if lanes.is_empty() {
        return Ok(FunctionComponentDeletedSubtreePendingPassiveCommitHandoff {
            root,
            nearest_mounted_ancestor,
            deleted_root,
            lanes,
            records: Vec::new(),
        });
    }

    let mut pending_effects = Vec::new();
    collect_deleted_subtree_passive_effect_metadata(
        store.fiber_arena(),
        hook_store,
        deleted_root,
        lanes,
        &mut pending_effects,
    )?;
    if pending_effects.is_empty() {
        return Ok(FunctionComponentDeletedSubtreePendingPassiveCommitHandoff {
            root,
            nearest_mounted_ancestor,
            deleted_root,
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

    let mut records = Vec::with_capacity(pending_effects.len());
    for pending in pending_effects {
        let unmount_order = scheduling
            .pending_passive_mut()
            .queue_unmount(
                pending.fiber,
                PendingPassiveUnmountOrigin::DeletedSubtree {
                    nearest_mounted_ancestor,
                },
                pending.lanes,
            )
            .ok_or(RootCommitError::PendingPassiveQueueRejected {
                root,
                fiber: pending.fiber,
                effect: pending.effect,
                phase: PendingPassiveEffectPhase::Unmount,
                lanes: pending.lanes,
            })?;

        records.push(
            FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord {
                root,
                nearest_mounted_ancestor,
                deleted_root,
                traversal_index: pending.traversal_index,
                fiber: pending.fiber,
                hook_list: pending.hook_list,
                effect_index: pending.effect_index,
                effect: pending.effect,
                instance: pending.instance,
                tag: pending.tag,
                create: pending.create,
                destroy: pending.destroy,
                dependencies: pending.dependencies,
                lanes: pending.lanes,
                unmount_order,
            },
        );
    }

    Ok(FunctionComponentDeletedSubtreePendingPassiveCommitHandoff {
        root,
        nearest_mounted_ancestor,
        deleted_root,
        lanes,
        records,
    })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct DeletedSubtreePassiveEffectMetadata {
    traversal_index: usize,
    fiber: FiberId,
    hook_list: HookListId,
    effect_index: usize,
    effect: HookEffectId,
    instance: HookEffectInstanceId,
    tag: HookEffectFlags,
    create: HookEffectCallbackHandle,
    destroy: Option<HookEffectCallbackHandle>,
    dependencies: HookEffectDependencies,
    lanes: Lanes,
}

fn collect_deleted_subtree_passive_effect_metadata(
    arena: &FiberArena,
    hook_store: &FunctionComponentHookRenderStore,
    fiber: FiberId,
    lanes: Lanes,
    records: &mut Vec<DeletedSubtreePassiveEffectMetadata>,
) -> Result<(), RootCommitError> {
    let node = arena.get(fiber)?;
    if node.tag() == FiberTag::FunctionComponent {
        collect_deleted_function_component_passive_effect_metadata(
            hook_store, fiber, lanes, records,
        )?;
    }

    for child in arena.child_ids(fiber)? {
        collect_deleted_subtree_passive_effect_metadata(arena, hook_store, child, lanes, records)?;
    }

    Ok(())
}

fn collect_deleted_function_component_passive_effect_metadata(
    hook_store: &FunctionComponentHookRenderStore,
    fiber: FiberId,
    lanes: Lanes,
    records: &mut Vec<DeletedSubtreePassiveEffectMetadata>,
) -> Result<(), RootCommitError> {
    let Some(hook_list) = hook_store.current_list(fiber) else {
        return Ok(());
    };
    let Some(ring) = hook_store.effect_ring(hook_list) else {
        return Ok(());
    };

    let effects = ring
        .iter_matching(hook_store.hook_effects(), HookEffectFlags::PASSIVE)
        .map_err(
            |error| RootCommitError::FunctionComponentCommittedEffectQueue {
                fiber,
                message: error.to_string(),
            },
        )?;
    for (effect_index, effect) in effects.enumerate() {
        let effect =
            effect.map_err(
                |error| RootCommitError::FunctionComponentCommittedEffectQueue {
                    fiber,
                    message: error.to_string(),
                },
            )?;
        let destroy = hook_store
            .hook_effects()
            .effect_destroy(effect.id())
            .map_err(
                |error| RootCommitError::FunctionComponentCommittedEffectQueue {
                    fiber,
                    message: error.to_string(),
                },
            )?;
        records.push(DeletedSubtreePassiveEffectMetadata {
            traversal_index: records.len(),
            fiber,
            hook_list,
            effect_index,
            effect: effect.id(),
            instance: effect.instance(),
            tag: effect.tag(),
            create: effect.create(),
            destroy,
            dependencies: effect.dependencies(),
            lanes,
        });
    }

    Ok(())
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

fn materialize_ref_callback_execution_handoff<H: HostTypes>(
    store: &FiberRootStore<H>,
    gate: &HostRootDomRefCallbackCommitGateSnapshot,
) -> Result<HostRootRefCallbackExecutionHandoffSnapshot, RootCommitError> {
    let mut handoff = HostRootRefCallbackExecutionHandoffSnapshot::default();
    let mut saw_changed_ref_detach = false;

    for gate_record in gate.records() {
        let mut changed_ref_detach_before_attach = false;
        match gate_record.action() {
            HostRootRefCommitAction::Detach => {
                handoff.detach_count += 1;
                if gate_record.detach_reason() == Some(HostRootRefDetachReason::RefChanged) {
                    saw_changed_ref_detach = true;
                }
            }
            HostRootRefCommitAction::Attach => {
                handoff.attach_count += 1;
                if saw_changed_ref_detach {
                    changed_ref_detach_before_attach = true;
                    handoff.changed_ref_detach_before_attach_count += 1;
                    saw_changed_ref_detach = false;
                }
            }
        }

        handoff.records.push(ref_callback_execution_handoff_record(
            store,
            handoff.records.len(),
            gate_record,
            changed_ref_detach_before_attach,
        )?);
    }

    Ok(handoff)
}

fn ref_callback_execution_handoff_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    sequence: usize,
    gate_record: &HostRootDomRefCallbackCommitGateRecord,
    changed_ref_detach_before_attach: bool,
) -> Result<HostRootRefCallbackExecutionHandoffRecord, RootCommitError> {
    store.host_tokens().validate(
        gate_record.token(),
        gate_record.root(),
        gate_record.fiber(),
        gate_record.token_phase(),
        gate_record.token_target(),
    )?;

    Ok(HostRootRefCallbackExecutionHandoffRecord {
        sequence,
        source_gate_sequence: gate_record.sequence(),
        root: gate_record.root(),
        fiber: gate_record.fiber(),
        state_node: gate_record.state_node(),
        ref_handle: gate_record.ref_handle(),
        token: gate_record.token(),
        token_phase: gate_record.token_phase(),
        token_target: gate_record.token_target(),
        action: gate_record.action(),
        detach_reason: gate_record.detach_reason(),
        execution_phase: ref_callback_execution_phase(gate_record.action()),
        changed_ref_detach_before_attach,
        status: HostRootRefCallbackExecutionHandoffStatus::PrivateExecutionHandoff,
        blockers: REF_CALLBACK_EXECUTION_HANDOFF_BLOCKERS,
    })
}

fn materialize_ref_cleanup_return_execution_gate<H: HostTypes>(
    store: &FiberRootStore<H>,
    handoff: &HostRootRefCallbackExecutionHandoffSnapshot,
) -> Result<HostRootRefCleanupReturnExecutionGateSnapshot, RootCommitError> {
    let mut gate = HostRootRefCleanupReturnExecutionGateSnapshot::default();

    for handoff_record in handoff.records() {
        match handoff_record.action() {
            HostRootRefCommitAction::Detach => {
                gate.cleanup_return_execution_gate_count += 1;
            }
            HostRootRefCommitAction::Attach => {
                gate.cleanup_return_handle_record_gate_count += 1;
                if handoff_record.changed_ref_detach_before_attach() {
                    gate.changed_ref_cleanup_before_attach_count += 1;
                }
            }
        }

        gate.records.push(ref_cleanup_return_execution_gate_record(
            store,
            gate.records.len(),
            handoff_record,
        )?);
    }

    Ok(gate)
}

fn ref_cleanup_return_execution_gate_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    sequence: usize,
    handoff_record: &HostRootRefCallbackExecutionHandoffRecord,
) -> Result<HostRootRefCleanupReturnExecutionGateRecord, RootCommitError> {
    store.host_tokens().validate(
        handoff_record.token(),
        handoff_record.root(),
        handoff_record.fiber(),
        handoff_record.token_phase(),
        handoff_record.token_target(),
    )?;

    Ok(HostRootRefCleanupReturnExecutionGateRecord {
        sequence,
        source_handoff_sequence: handoff_record.sequence(),
        source_gate_sequence: handoff_record.source_gate_sequence(),
        root: handoff_record.root(),
        fiber: handoff_record.fiber(),
        state_node: handoff_record.state_node(),
        ref_handle: handoff_record.ref_handle(),
        token: handoff_record.token(),
        token_phase: handoff_record.token_phase(),
        token_target: handoff_record.token_target(),
        action: handoff_record.action(),
        detach_reason: handoff_record.detach_reason(),
        cleanup_return_phase: ref_cleanup_return_execution_phase(handoff_record.action()),
        cleanup_return_handle_recording_gate: handoff_record.action()
            == HostRootRefCommitAction::Attach,
        cleanup_return_execution_gate: handoff_record.action() == HostRootRefCommitAction::Detach,
        changed_ref_cleanup_before_attach: handoff_record.changed_ref_detach_before_attach(),
        status: HostRootRefCleanupReturnExecutionGateStatus::TestOnlyExecutionGate,
        blockers: REF_CLEANUP_RETURN_EXECUTION_GATE_BLOCKERS,
    })
}

const fn ref_cleanup_return_execution_phase(
    action: HostRootRefCommitAction,
) -> HostRootRefCleanupReturnExecutionPhase {
    match action {
        HostRootRefCommitAction::Detach => {
            HostRootRefCleanupReturnExecutionPhase::ExecuteDetachCleanupReturnHandleOrNull
        }
        HostRootRefCommitAction::Attach => {
            HostRootRefCleanupReturnExecutionPhase::RecordAttachCleanupReturnHandle
        }
    }
}

const fn ref_callback_execution_phase(
    action: HostRootRefCommitAction,
) -> HostRootRefCallbackExecutionPhase {
    match action {
        HostRootRefCommitAction::Detach => {
            HostRootRefCallbackExecutionPhase::CallbackDetachCleanupOrNull
        }
        HostRootRefCommitAction::Attach => HostRootRefCallbackExecutionPhase::CallbackAttach,
    }
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
    parent: FiberId,
    parent_tag: FiberTag,
    parent_state_node: StateNodeHandle,
    parent_flags: FiberFlags,
    fiber: FiberId,
    alternate_fiber: Option<FiberId>,
    tag: FiberTag,
    kind: HostRootMutationPhaseRecordKind,
    placement_sibling: Option<HostRootPlacementSiblingRecord>,
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
    pub(crate) const fn parent_flags(self) -> FiberFlags {
        self.parent_flags
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
    pub(crate) const fn placement_sibling(self) -> Option<HostRootPlacementSiblingRecord> {
        self.placement_sibling
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootPlacementSiblingRecord {
    status: HostRootPlacementSiblingStatus,
    sibling: Option<FiberId>,
    sibling_tag: Option<FiberTag>,
    sibling_state_node: StateNodeHandle,
}

#[allow(
    dead_code,
    reason = "reconciler-private placement sibling metadata is reserved for later commit workers"
)]
impl HostRootPlacementSiblingRecord {
    #[must_use]
    pub(crate) const fn append() -> Self {
        Self {
            status: HostRootPlacementSiblingStatus::Append,
            sibling: None,
            sibling_tag: None,
            sibling_state_node: StateNodeHandle::NONE,
        }
    }

    #[must_use]
    pub(crate) const fn status(self) -> HostRootPlacementSiblingStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn sibling(self) -> Option<FiberId> {
        self.sibling
    }

    #[must_use]
    pub(crate) const fn sibling_tag(self) -> Option<FiberTag> {
        self.sibling_tag
    }

    #[must_use]
    pub(crate) const fn sibling_state_node(self) -> StateNodeHandle {
        self.sibling_state_node
    }

    #[must_use]
    pub(crate) const fn can_insert_before(self) -> bool {
        matches!(self.status, HostRootPlacementSiblingStatus::InsertBefore)
            && self.sibling.is_some()
            && self.sibling_tag.is_some()
            && !self.sibling_state_node.is_none()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootPlacementSiblingStatus {
    Append,
    InsertBefore,
    BlockedPendingPlacement,
    BlockedUnsupportedTag,
    BlockedMissingStateNode,
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
    placement_sibling: Option<HostRootPlacementSiblingRecord>,
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
    pub(crate) const fn placement_sibling(self) -> Option<HostRootPlacementSiblingRecord> {
        self.placement_sibling
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
    AppendPlacementToHostParent,
    InsertPlacementInContainerBefore,
    RecordPlacementInsertionBlocked,
    CommitHostComponentUpdate,
    CommitHostTextUpdate,
    RemoveDeletedFromContainer,
    RemoveDeletedFromHostParent,
    SkipUnsupportedNestedPlacement,
    SkipDeletedNonHostFiber,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostRootPlacementApplyDiagnosticForCanary {
    root: FiberRootId,
    host_root: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
    apply_kind: &'static str,
    sibling_status: &'static str,
    sibling: Option<FiberId>,
    sibling_tag: Option<FiberTag>,
    sibling_state_node: StateNodeHandle,
    can_insert_before: bool,
}

impl HostRootPlacementApplyDiagnosticForCanary {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.tag)
    }

    #[must_use]
    pub const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub const fn state_node_raw(self) -> u64 {
        self.state_node.raw()
    }

    #[must_use]
    pub const fn apply_kind(self) -> &'static str {
        self.apply_kind
    }

    #[must_use]
    pub const fn sibling_status(self) -> &'static str {
        self.sibling_status
    }

    #[must_use]
    pub const fn sibling(self) -> Option<FiberId> {
        self.sibling
    }

    #[must_use]
    pub const fn sibling_tag(self) -> Option<FiberTag> {
        self.sibling_tag
    }

    #[must_use]
    pub const fn sibling_tag_name(self) -> Option<&'static str> {
        match self.sibling_tag {
            Some(tag) => Some(host_root_fiber_tag_name(tag)),
            None => None,
        }
    }

    #[must_use]
    pub const fn sibling_state_node(self) -> StateNodeHandle {
        self.sibling_state_node
    }

    #[must_use]
    pub const fn sibling_state_node_raw(self) -> u64 {
        self.sibling_state_node.raw()
    }

    #[must_use]
    pub const fn can_insert_before(self) -> bool {
        self.can_insert_before
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostParentPlacementApplyDiagnosticForCanary {
    root: FiberRootId,
    host_root: FiberId,
    parent: FiberId,
    parent_tag: FiberTag,
    parent_state_node: StateNodeHandle,
    fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
    apply_kind: &'static str,
    applies_to_host_parent: bool,
}

impl HostParentPlacementApplyDiagnosticForCanary {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub const fn parent(self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub const fn parent_tag(self) -> FiberTag {
        self.parent_tag
    }

    #[must_use]
    pub const fn parent_tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.parent_tag)
    }

    #[must_use]
    pub const fn parent_state_node(self) -> StateNodeHandle {
        self.parent_state_node
    }

    #[must_use]
    pub const fn parent_state_node_raw(self) -> u64 {
        self.parent_state_node.raw()
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.tag)
    }

    #[must_use]
    pub const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub const fn state_node_raw(self) -> u64 {
        self.state_node.raw()
    }

    #[must_use]
    pub const fn apply_kind(self) -> &'static str {
        self.apply_kind
    }

    #[must_use]
    pub const fn applies_to_host_parent(self) -> bool {
        self.applies_to_host_parent
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostComponentUpdateApplyDiagnosticForCanary {
    sequence: usize,
    root: FiberRootId,
    host_root: FiberId,
    parent: FiberId,
    parent_tag: FiberTag,
    parent_state_node: StateNodeHandle,
    fiber: FiberId,
    alternate_fiber: Option<FiberId>,
    tag: FiberTag,
    state_node: StateNodeHandle,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
    alternate_memoized_props: Option<PropsHandle>,
    apply_kind: &'static str,
}

impl HostComponentUpdateApplyDiagnosticForCanary {
    #[must_use]
    pub const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub const fn parent(self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub const fn parent_tag(self) -> FiberTag {
        self.parent_tag
    }

    #[must_use]
    pub const fn parent_tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.parent_tag)
    }

    #[must_use]
    pub const fn parent_state_node(self) -> StateNodeHandle {
        self.parent_state_node
    }

    #[must_use]
    pub const fn parent_state_node_raw(self) -> u64 {
        self.parent_state_node.raw()
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn alternate_fiber(self) -> Option<FiberId> {
        self.alternate_fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.tag)
    }

    #[must_use]
    pub const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub const fn state_node_raw(self) -> u64 {
        self.state_node.raw()
    }

    #[must_use]
    pub const fn pending_props(self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub const fn memoized_props(self) -> PropsHandle {
        self.memoized_props
    }

    #[must_use]
    pub const fn alternate_memoized_props(self) -> Option<PropsHandle> {
        self.alternate_memoized_props
    }

    #[must_use]
    pub const fn apply_kind(self) -> &'static str {
        self.apply_kind
    }
}

const fn host_root_mutation_apply_record_kind_name(
    kind: HostRootMutationApplyRecordKind,
) -> &'static str {
    match kind {
        HostRootMutationApplyRecordKind::AppendPlacementToContainer => {
            "append-placement-to-container"
        }
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent => {
            "append-placement-to-host-parent"
        }
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore => {
            "insert-placement-in-container-before"
        }
        HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked => {
            "record-placement-insertion-blocked"
        }
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate => {
            "commit-host-component-update"
        }
        HostRootMutationApplyRecordKind::CommitHostTextUpdate => "commit-host-text-update",
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer => {
            "remove-deleted-from-container"
        }
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent => {
            "remove-deleted-from-host-parent"
        }
        HostRootMutationApplyRecordKind::SkipUnsupportedNestedPlacement => {
            "skip-unsupported-nested-placement"
        }
        HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber => "skip-deleted-non-host-fiber",
    }
}

const fn host_root_placement_sibling_status_name(
    status: HostRootPlacementSiblingStatus,
) -> &'static str {
    match status {
        HostRootPlacementSiblingStatus::Append => "append",
        HostRootPlacementSiblingStatus::InsertBefore => "insert-before",
        HostRootPlacementSiblingStatus::BlockedPendingPlacement => "blocked-pending-placement",
        HostRootPlacementSiblingStatus::BlockedUnsupportedTag => "blocked-unsupported-tag",
        HostRootPlacementSiblingStatus::BlockedMissingStateNode => "blocked-missing-state-node",
    }
}

const fn host_root_fiber_tag_name(tag: FiberTag) -> &'static str {
    match tag {
        FiberTag::HostRoot => "HostRoot",
        FiberTag::HostComponent => "HostComponent",
        FiberTag::HostText => "HostText",
        FiberTag::FunctionComponent => "FunctionComponent",
        FiberTag::ContextProvider => "ContextProvider",
        FiberTag::Fragment => "Fragment",
        FiberTag::Suspense => "Suspense",
        FiberTag::Offscreen => "Offscreen",
        FiberTag::Activity => "Activity",
        FiberTag::ViewTransition => "ViewTransition",
        FiberTag::ClassComponent => "ClassComponent",
        FiberTag::Portal => "Portal",
        _ => "Other",
    }
}

const fn host_root_commit_order_phase_name(
    phase: HostRootCommitOrderPhaseForCanary,
) -> &'static str {
    match phase {
        HostRootCommitOrderPhaseForCanary::Mutation => "mutation",
        HostRootCommitOrderPhaseForCanary::Layout => "layout",
        HostRootCommitOrderPhaseForCanary::Passive => "passive",
    }
}

const fn host_root_commit_order_metadata_kind_name(
    kind: HostRootCommitOrderMetadataKindForCanary,
) -> &'static str {
    match kind {
        HostRootCommitOrderMetadataKindForCanary::DeletionCleanup => "deletion-cleanup",
        HostRootCommitOrderMetadataKindForCanary::RefDetach => "ref-detach",
        HostRootCommitOrderMetadataKindForCanary::RefAttach => "ref-attach",
        HostRootCommitOrderMetadataKindForCanary::LayoutEffectDestroy => "layout-effect-destroy",
        HostRootCommitOrderMetadataKindForCanary::LayoutEffectCreate => "layout-effect-create",
        HostRootCommitOrderMetadataKindForCanary::LayoutEffectCallback => "layout-effect-callback",
        HostRootCommitOrderMetadataKindForCanary::RootUpdateCallback => "root-update-callback",
        HostRootCommitOrderMetadataKindForCanary::PassiveUnmount => "passive-unmount",
        HostRootCommitOrderMetadataKindForCanary::PassiveMount => "passive-mount",
    }
}

const fn function_component_effect_list_commit_phase_name(
    phase: FunctionComponentEffectListCommitPhase,
) -> &'static str {
    match phase {
        FunctionComponentEffectListCommitPhase::BeforeMutation => "before-mutation",
        FunctionComponentEffectListCommitPhase::Mutation => "mutation",
        FunctionComponentEffectListCommitPhase::Layout => "layout",
        FunctionComponentEffectListCommitPhase::PassiveScheduling => "passive-scheduling",
    }
}

const fn function_component_effect_list_commit_phase_order(
    phase: FunctionComponentEffectListCommitPhase,
) -> u8 {
    match phase {
        FunctionComponentEffectListCommitPhase::BeforeMutation => 0,
        FunctionComponentEffectListCommitPhase::Mutation => 1,
        FunctionComponentEffectListCommitPhase::Layout => 2,
        FunctionComponentEffectListCommitPhase::PassiveScheduling => 3,
    }
}

const fn function_component_effect_list_commit_phase_order_kind_name(
    kind: FunctionComponentEffectListCommitPhaseOrderKind,
) -> &'static str {
    match kind {
        FunctionComponentEffectListCommitPhaseOrderKind::EffectListBeforeMutation => {
            "effect-list-before-mutation"
        }
        FunctionComponentEffectListCommitPhaseOrderKind::LayoutDestroy => "layout-destroy",
        FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate => "layout-create",
        FunctionComponentEffectListCommitPhaseOrderKind::PassiveUnmountScheduled => {
            "passive-unmount-scheduled"
        }
        FunctionComponentEffectListCommitPhaseOrderKind::PassiveMountScheduled => {
            "passive-mount-scheduled"
        }
    }
}

const fn host_root_commit_order_ref_kind(
    action: HostRootRefCommitAction,
) -> HostRootCommitOrderMetadataKindForCanary {
    match action {
        HostRootRefCommitAction::Detach => HostRootCommitOrderMetadataKindForCanary::RefDetach,
        HostRootRefCommitAction::Attach => HostRootCommitOrderMetadataKindForCanary::RefAttach,
    }
}

const fn host_root_commit_order_passive_kind(
    phase: PendingPassiveEffectPhase,
) -> HostRootCommitOrderMetadataKindForCanary {
    match phase {
        PendingPassiveEffectPhase::Unmount => {
            HostRootCommitOrderMetadataKindForCanary::PassiveUnmount
        }
        PendingPassiveEffectPhase::Mount => HostRootCommitOrderMetadataKindForCanary::PassiveMount,
    }
}

const fn host_root_commit_order_passive_source_order(order: PendingPassiveEffectOrder) -> u64 {
    ((order.flush_rank() as u64) << 32) | order.sequence()
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

        let flags = node.flags();
        if is_supported_host_root_mutation_child(node.tag())
            && flags.contains_all(FiberFlags::PLACEMENT)
        {
            log.push(host_root_mutation_phase_record(
                arena,
                root,
                finished_work,
                finished_work,
                child,
                HostRootMutationPhaseRecordKind::Placement,
                lanes,
            )?);
        }
        collect_host_component_child_placement_phase_records(
            arena,
            &mut log,
            root,
            finished_work,
            child,
            1,
            lanes,
        )?;
        collect_host_component_update_traversal_phase_records(
            arena,
            &mut log,
            HostComponentUpdateTraversalRequest {
                root,
                host_root: finished_work,
                parent: finished_work,
                fiber: child,
                fiber_depth: 1,
                host_component_depth: 0,
                lanes,
            },
        )?;
    }

    Ok(log)
}

fn collect_host_component_child_placement_phase_records(
    arena: &fast_react_core::FiberArena,
    log: &mut HostRootMutationPhaseLog,
    root: FiberRootId,
    host_root: FiberId,
    parent: FiberId,
    host_component_depth: usize,
    lanes: Lanes,
) -> Result<(), RootCommitError> {
    let parent_node = arena.get(parent)?;
    if parent_node.tag() != FiberTag::HostComponent {
        return Ok(());
    }

    let parent_is_stable = !parent_node.flags().contains_all(FiberFlags::PLACEMENT);
    let mut next_child = parent_node.child();
    while let Some(child) = next_child {
        let node = arena.get(child)?;
        next_child = node.sibling();

        if node.flags().contains_all(FiberFlags::PLACEMENT)
            && is_supported_host_root_mutation_child(node.tag())
        {
            log.push(host_root_mutation_phase_record(
                arena,
                root,
                host_root,
                parent,
                child,
                HostRootMutationPhaseRecordKind::Placement,
                lanes,
            )?);
        }

        if parent_is_stable
            && host_component_depth < HOST_PARENT_PLACEMENT_CANARY_MAX_HOST_COMPONENT_DEPTH
            && node.tag() == FiberTag::HostComponent
            && !node.flags().contains_all(FiberFlags::PLACEMENT)
        {
            collect_host_component_child_placement_phase_records(
                arena,
                log,
                root,
                host_root,
                child,
                host_component_depth + 1,
                lanes,
            )?;
        }
    }

    Ok(())
}

fn collect_host_component_update_traversal_phase_records(
    arena: &fast_react_core::FiberArena,
    log: &mut HostRootMutationPhaseLog,
    request: HostComponentUpdateTraversalRequest,
) -> Result<(), RootCommitError> {
    let node = arena.get(request.fiber)?;
    let tag = node.tag();
    let flags = node.flags();
    let next_host_component_depth =
        request.host_component_depth + usize::from(tag == FiberTag::HostComponent);

    if should_descend_host_component_update_traversal_for_canary(
        tag,
        flags,
        request.fiber_depth,
        next_host_component_depth,
        node.subtree_flags(),
    ) {
        let mut next_child = node.child();
        while let Some(child) = next_child {
            let child_node = arena.get(child)?;
            next_child = child_node.sibling();

            collect_host_component_update_traversal_phase_records(
                arena,
                log,
                HostComponentUpdateTraversalRequest {
                    parent: request.fiber,
                    fiber: child,
                    fiber_depth: request.fiber_depth + 1,
                    host_component_depth: next_host_component_depth,
                    ..request
                },
            )?;
        }
    }

    if is_supported_host_root_mutation_child(tag) && flags.contains_all(FiberFlags::UPDATE) {
        log.push(host_root_mutation_phase_record(
            arena,
            request.root,
            request.host_root,
            request.parent,
            request.fiber,
            HostRootMutationPhaseRecordKind::Update,
            request.lanes,
        )?);
    }

    Ok(())
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostComponentUpdateTraversalRequest {
    root: FiberRootId,
    host_root: FiberId,
    parent: FiberId,
    fiber: FiberId,
    fiber_depth: usize,
    host_component_depth: usize,
    lanes: Lanes,
}

const HOST_PARENT_PLACEMENT_CANARY_MAX_HOST_COMPONENT_DEPTH: usize = 2;
const HOST_COMPONENT_UPDATE_CANARY_MAX_FIBER_DEPTH: usize = 6;
const HOST_COMPONENT_UPDATE_CANARY_MAX_HOST_COMPONENT_DEPTH: usize = 4;

const fn should_descend_host_component_update_traversal_for_canary(
    tag: FiberTag,
    flags: FiberFlags,
    fiber_depth: usize,
    host_component_depth: usize,
    subtree_flags: FiberFlags,
) -> bool {
    if fiber_depth >= HOST_COMPONENT_UPDATE_CANARY_MAX_FIBER_DEPTH
        || host_component_depth >= HOST_COMPONENT_UPDATE_CANARY_MAX_HOST_COMPONENT_DEPTH
        || !subtree_flags.contains_any(FiberFlags::MUTATION_MASK.merge(FiberFlags::CLONED))
        || flags.contains_all(FiberFlags::PLACEMENT)
    {
        return false;
    }

    matches!(
        tag,
        FiberTag::HostComponent | FiberTag::FunctionComponent | FiberTag::Fragment
    )
}

fn host_root_mutation_phase_record(
    arena: &fast_react_core::FiberArena,
    root: FiberRootId,
    host_root: FiberId,
    parent: FiberId,
    fiber: FiberId,
    kind: HostRootMutationPhaseRecordKind,
    lanes: Lanes,
) -> Result<HostRootMutationPhaseRecord, RootCommitError> {
    let node = arena.get(fiber)?;
    let parent_node = arena.get(parent)?;
    let alternate_memoized_props = match node.alternate() {
        Some(alternate) => Some(arena.get(alternate)?.memoized_props()),
        None => None,
    };
    let parent_state_node = if parent_node.tag() == FiberTag::HostRoot {
        StateNodeHandle::NONE
    } else {
        parent_node.state_node()
    };
    let placement_sibling = match kind {
        HostRootMutationPhaseRecordKind::Placement if parent_node.tag() == FiberTag::HostRoot => {
            Some(host_root_placement_sibling_record(
                arena,
                host_root,
                node.sibling(),
            )?)
        }
        HostRootMutationPhaseRecordKind::Placement => {
            Some(HostRootPlacementSiblingRecord::append())
        }
        HostRootMutationPhaseRecordKind::Update => None,
    };

    Ok(HostRootMutationPhaseRecord {
        root,
        host_root,
        parent,
        parent_tag: parent_node.tag(),
        parent_state_node,
        parent_flags: parent_node.flags(),
        fiber,
        alternate_fiber: node.alternate(),
        tag: node.tag(),
        kind,
        placement_sibling,
        lanes,
        effect_flag: host_root_mutation_phase_record_flag(kind),
        state_node: node.state_node(),
        pending_props: node.pending_props(),
        memoized_props: node.memoized_props(),
        alternate_memoized_props,
    })
}

fn host_root_placement_sibling_record(
    arena: &fast_react_core::FiberArena,
    host_root: FiberId,
    sibling: Option<FiberId>,
) -> Result<HostRootPlacementSiblingRecord, RootCommitError> {
    let Some(sibling) = sibling else {
        return Ok(HostRootPlacementSiblingRecord::append());
    };

    let sibling_node = arena.get(sibling)?;
    if sibling_node.return_fiber() != Some(host_root) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: host_root,
            child: sibling,
            actual_parent: sibling_node.return_fiber(),
        }
        .into());
    }

    let sibling_tag = sibling_node.tag();
    let sibling_state_node = sibling_node.state_node();
    let status = if !is_supported_host_root_mutation_child(sibling_tag) {
        HostRootPlacementSiblingStatus::BlockedUnsupportedTag
    } else if sibling_node.flags().contains_all(FiberFlags::PLACEMENT) {
        HostRootPlacementSiblingStatus::BlockedPendingPlacement
    } else if sibling_state_node.is_none() {
        HostRootPlacementSiblingStatus::BlockedMissingStateNode
    } else {
        HostRootPlacementSiblingStatus::InsertBefore
    };

    Ok(HostRootPlacementSiblingRecord {
        status,
        sibling: Some(sibling),
        sibling_tag: Some(sibling_tag),
        sibling_state_node,
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
        let deletion_parent = arena.get(deletion_list.parent())?;
        let host_parent = find_nearest_host_parent_for_deletion(arena, deletion_list.parent())?;
        for &deleted in deletion_list.deleted() {
            let (parent, parent_tag, parent_state_node) = host_parent
                .map(|record| (record.fiber, record.tag, record.state_node))
                .unwrap_or((
                    deletion_list.parent(),
                    deletion_parent.tag(),
                    deletion_parent.state_node(),
                ));
            log.push(host_root_deletion_apply_record(
                arena,
                HostRootDeletionApplyRecordRequest {
                    root,
                    host_root: finished_work,
                    lanes,
                    list: deletion_list.list(),
                    parent,
                    parent_tag,
                    parent_state_node,
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

fn find_nearest_host_parent_for_deletion(
    arena: &FiberArena,
    deletion_parent: FiberId,
) -> Result<Option<HostRootDeletionHostParentRecord>, RootCommitError> {
    let mut candidate = deletion_parent;
    let mut traversal_depth = 0;

    loop {
        let node = arena.get(candidate)?;
        match node.tag() {
            FiberTag::HostRoot | FiberTag::HostComponent => {
                return Ok(Some(HostRootDeletionHostParentRecord {
                    fiber: candidate,
                    tag: node.tag(),
                    state_node: node.state_node(),
                    traversal_depth,
                }));
            }
            FiberTag::FunctionComponent => {
                let Some(parent) = node.return_fiber() else {
                    return Ok(None);
                };
                candidate = parent;
                traversal_depth += 1;
            }
            _ => return Ok(None),
        }
    }
}

fn host_root_mutation_phase_apply_record(
    record: HostRootMutationPhaseRecord,
) -> Result<HostRootMutationApplyRecord, RootCommitError> {
    let kind = match (record.kind(), record.tag()) {
        (HostRootMutationPhaseRecordKind::Placement, _)
            if record.parent_tag() == FiberTag::HostRoot =>
        {
            match record
                .placement_sibling()
                .unwrap_or(HostRootPlacementSiblingRecord::append())
                .status()
            {
                HostRootPlacementSiblingStatus::Append => {
                    HostRootMutationApplyRecordKind::AppendPlacementToContainer
                }
                HostRootPlacementSiblingStatus::InsertBefore => {
                    HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
                }
                HostRootPlacementSiblingStatus::BlockedPendingPlacement
                | HostRootPlacementSiblingStatus::BlockedUnsupportedTag
                | HostRootPlacementSiblingStatus::BlockedMissingStateNode => {
                    HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked
                }
            }
        }
        (HostRootMutationPhaseRecordKind::Placement, _)
            if record.parent_tag() == FiberTag::HostComponent
                && !record.parent_flags().contains_all(FiberFlags::PLACEMENT) =>
        {
            HostRootMutationApplyRecordKind::AppendPlacementToHostParent
        }
        (HostRootMutationPhaseRecordKind::Placement, _) => {
            HostRootMutationApplyRecordKind::SkipUnsupportedNestedPlacement
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
        parent: record.parent(),
        parent_tag: record.parent_tag(),
        parent_state_node: record.parent_state_node(),
        fiber: record.fiber(),
        alternate_fiber: record.alternate_fiber(),
        tag: record.tag(),
        kind,
        placement_sibling: record.placement_sibling(),
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
        placement_sibling: None,
        lanes: request.lanes,
        effect_flag: FiberFlags::CHILD_DELETION,
        state_node: node.state_node(),
        pending_props: node.pending_props(),
        memoized_props: node.memoized_props(),
        alternate_memoized_props: None,
    })
}

#[doc(hidden)]
impl<H: HostTypes> FiberRootStore<H> {
    pub fn prepare_test_renderer_nested_host_output_canary_fibers(
        &mut self,
        render: HostRootRenderPhaseRecord,
        outer_fixture: crate::TestRendererHostOutputCanaryFixture,
        inner_fixture: crate::TestRendererHostOutputCanaryFixture,
    ) -> Result<
        (
            crate::TestRendererHostOutputCanaryPreparedFibers,
            crate::TestRendererHostOutputCanaryPreparedFibers,
        ),
        crate::TestRendererHostOutputCanaryError,
    > {
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            render.work_in_progress(),
            FiberTag::HostRoot,
        )?;

        let mode = self.fiber_arena().get(render.work_in_progress())?.mode();
        let outer = self.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(outer_fixture.component_props_raw()),
            mode,
        );
        {
            let node = self.fiber_arena_mut().get_mut(outer)?;
            node.set_element_type(ElementTypeHandle::from_raw(
                outer_fixture.element_type_raw(),
            ));
            node.merge_flags(FiberFlags::PLACEMENT);
        }

        let inner = self.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(inner_fixture.component_props_raw()),
            mode,
        );
        {
            let node = self.fiber_arena_mut().get_mut(inner)?;
            node.set_element_type(ElementTypeHandle::from_raw(
                inner_fixture.element_type_raw(),
            ));
            node.merge_flags(FiberFlags::PLACEMENT);
        }

        let text = self.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(inner_fixture.text_props_raw()),
            mode,
        );
        self.fiber_arena_mut().set_children(inner, &[text])?;
        self.fiber_arena_mut().set_children(outer, &[inner])?;
        self.fiber_arena_mut()
            .set_children(render.work_in_progress(), &[outer])?;

        let text_token = self.host_tokens_mut().issue(
            render.root(),
            text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        );
        self.host_tokens().validate(
            text_token,
            render.root(),
            text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        )?;
        let inner_token = self.host_tokens_mut().issue(
            render.root(),
            inner,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        );
        self.host_tokens().validate(
            inner_token,
            render.root(),
            inner,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        )?;
        let outer_token = self.host_tokens_mut().issue(
            render.root(),
            outer,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        );
        self.host_tokens().validate(
            outer_token,
            render.root(),
            outer,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        )?;

        let outer_prepared = crate::TestRendererHostOutputCanaryPreparedFibers {
            root: render.root(),
            host_root: render.work_in_progress(),
            component: outer,
            text,
            render_lanes: render.render_lanes(),
            component_token: outer_token,
            text_token,
            fixture: outer_fixture,
        };
        let inner_prepared = crate::TestRendererHostOutputCanaryPreparedFibers {
            root: render.root(),
            host_root: render.work_in_progress(),
            component: inner,
            text,
            render_lanes: render.render_lanes(),
            component_token: inner_token,
            text_token,
            fixture: inner_fixture,
        };

        Ok((outer_prepared, inner_prepared))
    }

    pub fn finish_test_renderer_nested_host_output_canary_fibers(
        &mut self,
        outer_prepared: crate::TestRendererHostOutputCanaryPreparedFibers,
        inner_prepared: crate::TestRendererHostOutputCanaryPreparedFibers,
        outer_state_node_raw: u64,
        inner_state_node_raw: u64,
        text_state_node_raw: u64,
    ) -> Result<
        (
            crate::TestRendererHostOutputCanaryCurrentFibers,
            crate::TestRendererHostOutputCanaryCurrentFibers,
        ),
        crate::TestRendererHostOutputCanaryError,
    > {
        expect_test_renderer_nested_host_output_canary_topology(
            self,
            outer_prepared,
            inner_prepared,
        )?;

        complete_test_renderer_nested_host_output_canary_fiber(
            self,
            inner_prepared.text(),
            FiberTag::HostText,
            inner_prepared.fixture().text_props_raw(),
            text_state_node_raw,
        )?;
        complete_test_renderer_nested_host_output_canary_fiber(
            self,
            inner_prepared.component(),
            FiberTag::HostComponent,
            inner_prepared.fixture().component_props_raw(),
            inner_state_node_raw,
        )?;
        complete_test_renderer_nested_host_output_canary_fiber(
            self,
            outer_prepared.component(),
            FiberTag::HostComponent,
            outer_prepared.fixture().component_props_raw(),
            outer_state_node_raw,
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            outer_prepared.host_root(),
        )?;

        Ok((
            crate::TestRendererHostOutputCanaryCurrentFibers {
                root: outer_prepared.root(),
                host_root: outer_prepared.host_root(),
                component: outer_prepared.component(),
                text: inner_prepared.text(),
                fixture: outer_prepared.fixture(),
            },
            crate::TestRendererHostOutputCanaryCurrentFibers {
                root: inner_prepared.root(),
                host_root: inner_prepared.host_root(),
                component: inner_prepared.component(),
                text: inner_prepared.text(),
                fixture: inner_prepared.fixture(),
            },
        ))
    }

    pub fn prepare_test_renderer_nested_host_parent_text_placement_canary_fibers(
        &mut self,
        render: HostRootRenderPhaseRecord,
        outer_current: crate::TestRendererHostOutputCanaryCurrentFibers,
        inner_current: crate::TestRendererHostOutputCanaryCurrentFibers,
        placed_text_props_raw: u64,
    ) -> Result<
        (
            crate::TestRendererHostOutputCanaryCurrentFibers,
            crate::TestRendererHostOutputCanaryCurrentFibers,
            FiberId,
            HostFiberTokenId,
        ),
        crate::TestRendererHostOutputCanaryError,
    > {
        validate_test_renderer_nested_host_output_canary_current(
            self,
            render,
            outer_current,
            inner_current,
        )?;

        let outer_node = self.fiber_arena().get(outer_current.component())?;
        let outer_state_node = outer_node.state_node();
        if outer_state_node.is_none() {
            return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode {
                fiber: outer_current.component(),
                tag: FiberTag::HostComponent,
            });
        }
        let outer_props = outer_node.memoized_props();

        let inner_node = self.fiber_arena().get(inner_current.component())?;
        let inner_state_node = inner_node.state_node();
        if inner_state_node.is_none() {
            return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode {
                fiber: inner_current.component(),
                tag: FiberTag::HostComponent,
            });
        }
        let inner_props = inner_node.memoized_props();

        let text_node = self.fiber_arena().get(inner_current.text())?;
        let text_state_node = text_node.state_node();
        if text_state_node.is_none() {
            return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode {
                fiber: inner_current.text(),
                tag: FiberTag::HostText,
            });
        }
        let text_props = text_node.memoized_props();

        let work_outer = self
            .fiber_arena_mut()
            .create_work_in_progress(outer_current.component(), outer_props)?;
        {
            let node = self.fiber_arena_mut().get_mut(work_outer)?;
            node.set_state_node(outer_state_node);
            node.set_memoized_props(outer_props);
            node.set_lanes(Lanes::NO);
        }

        let work_inner = self
            .fiber_arena_mut()
            .create_work_in_progress(inner_current.component(), inner_props)?;
        {
            let node = self.fiber_arena_mut().get_mut(work_inner)?;
            node.set_state_node(inner_state_node);
            node.set_memoized_props(inner_props);
            node.set_lanes(Lanes::NO);
        }

        let stable_text = self
            .fiber_arena_mut()
            .create_work_in_progress(inner_current.text(), text_props)?;
        {
            let node = self.fiber_arena_mut().get_mut(stable_text)?;
            node.set_state_node(text_state_node);
            node.set_memoized_props(text_props);
            node.set_lanes(Lanes::NO);
        }

        let mode = self.fiber_arena().get(work_inner)?.mode();
        let placed_text = self.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(placed_text_props_raw),
            mode,
        );
        {
            let node = self.fiber_arena_mut().get_mut(placed_text)?;
            node.set_lanes(Lanes::NO);
            node.merge_flags(FiberFlags::PLACEMENT);
        }

        self.fiber_arena_mut()
            .set_children(work_inner, &[stable_text, placed_text])?;
        self.fiber_arena_mut()
            .set_children(work_outer, &[work_inner])?;
        self.fiber_arena_mut()
            .set_children(render.work_in_progress(), &[work_outer])?;

        let text_token = self.host_tokens_mut().issue(
            render.root(),
            placed_text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        );
        self.host_tokens().validate(
            text_token,
            render.root(),
            placed_text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        )?;

        Ok((
            crate::TestRendererHostOutputCanaryCurrentFibers {
                root: render.root(),
                host_root: render.work_in_progress(),
                component: work_outer,
                text: stable_text,
                fixture: outer_current.fixture(),
            },
            crate::TestRendererHostOutputCanaryCurrentFibers {
                root: render.root(),
                host_root: render.work_in_progress(),
                component: work_inner,
                text: stable_text,
                fixture: inner_current.fixture(),
            },
            placed_text,
            text_token,
        ))
    }

    pub fn finish_test_renderer_nested_host_parent_text_placement_canary_fibers(
        &mut self,
        outer_current: crate::TestRendererHostOutputCanaryCurrentFibers,
        inner_current: crate::TestRendererHostOutputCanaryCurrentFibers,
        placed_text: FiberId,
        placed_text_state_node_raw: u64,
        placed_text_props_raw: u64,
    ) -> Result<(), crate::TestRendererHostOutputCanaryError> {
        expect_test_renderer_nested_host_output_canary_current_topology(
            self,
            outer_current,
            inner_current,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            placed_text,
            FiberTag::HostText,
        )?;

        complete_test_renderer_nested_host_output_canary_fiber(
            self,
            placed_text,
            FiberTag::HostText,
            placed_text_props_raw,
            placed_text_state_node_raw,
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            inner_current.text(),
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(self, placed_text)?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            inner_current.component(),
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            outer_current.component(),
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            outer_current.host_root(),
        )?;
        Ok(())
    }

    pub fn prepare_test_renderer_host_parent_text_placement_canary_fibers(
        &mut self,
        render: HostRootRenderPhaseRecord,
        current: crate::TestRendererHostOutputCanaryCurrentFibers,
        placed_text_props_raw: u64,
    ) -> Result<
        (
            crate::TestRendererHostOutputCanaryCurrentFibers,
            FiberId,
            HostFiberTokenId,
        ),
        crate::TestRendererHostOutputCanaryError,
    > {
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            render.work_in_progress(),
            FiberTag::HostRoot,
        )?;
        if current.root() != render.root() {
            return Err(crate::TestRendererHostOutputCanaryError::RootMismatch {
                expected: current.root(),
                actual: render.root(),
            });
        }
        if current.host_root() != render.current() {
            return Err(
                crate::TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
                    expected: render.current(),
                    actual: current.host_root(),
                },
            );
        }
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            current.host_root(),
            FiberTag::HostRoot,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            current.component(),
            FiberTag::HostComponent,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            current.text(),
            FiberTag::HostText,
        )?;

        let parent_node = self.fiber_arena().get(current.component())?;
        if parent_node.return_fiber() != Some(current.host_root()) {
            return Err(FiberTopologyError::MixedParentSiblingChain {
                parent: current.host_root(),
                child: current.component(),
                actual_parent: parent_node.return_fiber(),
            }
            .into());
        }
        let parent_state_node = parent_node.state_node();
        if parent_state_node.is_none() {
            return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode {
                fiber: current.component(),
                tag: FiberTag::HostComponent,
            });
        }
        let parent_props = parent_node.memoized_props();

        let text_node = self.fiber_arena().get(current.text())?;
        if text_node.return_fiber() != Some(current.component()) {
            return Err(FiberTopologyError::MixedParentSiblingChain {
                parent: current.component(),
                child: current.text(),
                actual_parent: text_node.return_fiber(),
            }
            .into());
        }
        let text_state_node = text_node.state_node();
        if text_state_node.is_none() {
            return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode {
                fiber: current.text(),
                tag: FiberTag::HostText,
            });
        }
        let text_props = text_node.memoized_props();

        let work_parent = self
            .fiber_arena_mut()
            .create_work_in_progress(current.component(), parent_props)?;
        {
            let node = self.fiber_arena_mut().get_mut(work_parent)?;
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
            node.set_lanes(Lanes::NO);
        }

        let stable_text = self
            .fiber_arena_mut()
            .create_work_in_progress(current.text(), text_props)?;
        {
            let node = self.fiber_arena_mut().get_mut(stable_text)?;
            node.set_state_node(text_state_node);
            node.set_memoized_props(text_props);
            node.set_lanes(Lanes::NO);
        }

        let mode = self.fiber_arena().get(work_parent)?.mode();
        let placed_text = self.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(placed_text_props_raw),
            mode,
        );
        {
            let node = self.fiber_arena_mut().get_mut(placed_text)?;
            node.set_lanes(Lanes::NO);
            node.merge_flags(FiberFlags::PLACEMENT);
        }

        self.fiber_arena_mut()
            .set_children(work_parent, &[stable_text, placed_text])?;
        self.fiber_arena_mut()
            .set_children(render.work_in_progress(), &[work_parent])?;

        let text_token = self.host_tokens_mut().issue(
            render.root(),
            placed_text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        );
        self.host_tokens().validate(
            text_token,
            render.root(),
            placed_text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        )?;

        Ok((
            crate::TestRendererHostOutputCanaryCurrentFibers {
                root: render.root(),
                host_root: render.work_in_progress(),
                component: work_parent,
                text: stable_text,
                fixture: current.fixture(),
            },
            placed_text,
            text_token,
        ))
    }

    pub fn finish_test_renderer_host_parent_text_placement_canary_fibers(
        &mut self,
        current: crate::TestRendererHostOutputCanaryCurrentFibers,
        placed_text: FiberId,
        placed_text_state_node_raw: u64,
        placed_text_props_raw: u64,
    ) -> Result<(), crate::TestRendererHostOutputCanaryError> {
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            current.host_root(),
            FiberTag::HostRoot,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            current.component(),
            FiberTag::HostComponent,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            current.text(),
            FiberTag::HostText,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            placed_text,
            FiberTag::HostText,
        )?;
        if placed_text_state_node_raw == StateNodeHandle::NONE.raw() {
            return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode {
                fiber: placed_text,
                tag: FiberTag::HostText,
            });
        }

        {
            let node = self.fiber_arena_mut().get_mut(placed_text)?;
            node.set_state_node(StateNodeHandle::from_raw(placed_text_state_node_raw));
            node.set_memoized_props(PropsHandle::from_raw(placed_text_props_raw));
        }

        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(self, current.text())?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(self, placed_text)?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            current.component(),
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            current.host_root(),
        )?;
        Ok(())
    }
}

fn expect_test_renderer_nested_host_output_canary_topology<H: HostTypes>(
    store: &FiberRootStore<H>,
    outer_prepared: crate::TestRendererHostOutputCanaryPreparedFibers,
    inner_prepared: crate::TestRendererHostOutputCanaryPreparedFibers,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        outer_prepared.host_root(),
        FiberTag::HostRoot,
    )?;
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        outer_prepared.component(),
        FiberTag::HostComponent,
    )?;
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        inner_prepared.component(),
        FiberTag::HostComponent,
    )?;
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        inner_prepared.text(),
        FiberTag::HostText,
    )?;

    if outer_prepared.root() != inner_prepared.root() {
        return Err(crate::TestRendererHostOutputCanaryError::RootMismatch {
            expected: outer_prepared.root(),
            actual: inner_prepared.root(),
        });
    }
    if outer_prepared.host_root() != inner_prepared.host_root() {
        return Err(
            crate::TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
                expected: outer_prepared.host_root(),
                actual: inner_prepared.host_root(),
            },
        );
    }
    if outer_prepared.text() != inner_prepared.text() {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: inner_prepared.component(),
            child: inner_prepared.text(),
            actual_parent: store
                .fiber_arena()
                .get(outer_prepared.text())?
                .return_fiber(),
        }
        .into());
    }

    expect_test_renderer_nested_host_output_canary_prepared_topology(
        store,
        outer_prepared.host_root(),
        outer_prepared.component(),
        inner_prepared.component(),
        inner_prepared.text(),
    )
}

fn expect_test_renderer_nested_host_output_canary_prepared_topology<H: HostTypes>(
    store: &FiberRootStore<H>,
    host_root: FiberId,
    outer_component: FiberId,
    inner_component: FiberId,
    text: FiberId,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    if store.fiber_arena().get(host_root)?.child() != Some(outer_component) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: host_root,
            child: outer_component,
            actual_parent: store.fiber_arena().get(outer_component)?.return_fiber(),
        }
        .into());
    }
    if store.fiber_arena().get(outer_component)?.return_fiber() != Some(host_root) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: host_root,
            child: outer_component,
            actual_parent: store.fiber_arena().get(outer_component)?.return_fiber(),
        }
        .into());
    }
    if store.fiber_arena().get(outer_component)?.child() != Some(inner_component) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: outer_component,
            child: inner_component,
            actual_parent: store.fiber_arena().get(inner_component)?.return_fiber(),
        }
        .into());
    }
    if store.fiber_arena().get(inner_component)?.return_fiber() != Some(outer_component) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: outer_component,
            child: inner_component,
            actual_parent: store.fiber_arena().get(inner_component)?.return_fiber(),
        }
        .into());
    }
    if store.fiber_arena().get(inner_component)?.child() != Some(text) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: inner_component,
            child: text,
            actual_parent: store.fiber_arena().get(text)?.return_fiber(),
        }
        .into());
    }
    if store.fiber_arena().get(text)?.return_fiber() != Some(inner_component) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: inner_component,
            child: text,
            actual_parent: store.fiber_arena().get(text)?.return_fiber(),
        }
        .into());
    }

    Ok(())
}

fn validate_test_renderer_nested_host_output_canary_current<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    outer_current: crate::TestRendererHostOutputCanaryCurrentFibers,
    inner_current: crate::TestRendererHostOutputCanaryCurrentFibers,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        render.work_in_progress(),
        FiberTag::HostRoot,
    )?;
    if outer_current.root() != render.root() {
        return Err(crate::TestRendererHostOutputCanaryError::RootMismatch {
            expected: outer_current.root(),
            actual: render.root(),
        });
    }
    if inner_current.root() != render.root() {
        return Err(crate::TestRendererHostOutputCanaryError::RootMismatch {
            expected: inner_current.root(),
            actual: render.root(),
        });
    }
    if outer_current.host_root() != render.current() {
        return Err(
            crate::TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
                expected: render.current(),
                actual: outer_current.host_root(),
            },
        );
    }
    if inner_current.host_root() != render.current() {
        return Err(
            crate::TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
                expected: render.current(),
                actual: inner_current.host_root(),
            },
        );
    }

    expect_test_renderer_nested_host_output_canary_current_topology(
        store,
        outer_current,
        inner_current,
    )
}

fn expect_test_renderer_nested_host_output_canary_current_topology<H: HostTypes>(
    store: &FiberRootStore<H>,
    outer_current: crate::TestRendererHostOutputCanaryCurrentFibers,
    inner_current: crate::TestRendererHostOutputCanaryCurrentFibers,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        outer_current.host_root(),
        FiberTag::HostRoot,
    )?;
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        outer_current.component(),
        FiberTag::HostComponent,
    )?;
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        inner_current.component(),
        FiberTag::HostComponent,
    )?;
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        inner_current.text(),
        FiberTag::HostText,
    )?;

    if outer_current.text() != inner_current.text() {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: inner_current.component(),
            child: inner_current.text(),
            actual_parent: store
                .fiber_arena()
                .get(outer_current.text())?
                .return_fiber(),
        }
        .into());
    }

    expect_test_renderer_nested_host_output_canary_prepared_topology(
        store,
        outer_current.host_root(),
        outer_current.component(),
        inner_current.component(),
        inner_current.text(),
    )
}

fn complete_test_renderer_nested_host_output_canary_fiber<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    fiber: FiberId,
    tag: FiberTag,
    props_raw: u64,
    state_node_raw: u64,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    if state_node_raw == StateNodeHandle::NONE.raw() {
        return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode { fiber, tag });
    }
    expect_test_renderer_host_parent_placement_canary_tag(store, fiber, tag)?;

    let bubbled = fast_react_core::bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_state_node(StateNodeHandle::from_raw(state_node_raw));
    node.set_memoized_props(PropsHandle::from_raw(props_raw));
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    Ok(())
}

fn refresh_test_renderer_host_parent_placement_canary_bubbled_flags<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    fiber: FiberId,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    let bubbled = fast_react_core::bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    Ok(())
}

fn expect_test_renderer_host_parent_placement_canary_tag<H: HostTypes>(
    store: &FiberRootStore<H>,
    fiber: FiberId,
    expected: FiberTag,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    let actual = store.fiber_arena().get(fiber)?.tag();
    if actual == expected {
        Ok(())
    } else {
        Err(crate::TestRendererHostOutputCanaryError::ExpectedFiberTag {
            fiber,
            expected,
            actual,
        })
    }
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

fn materialize_deletion_subtree_traversal_gate<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    deletion_lists: &[HostRootDeletionListRecord],
) -> Result<HostRootDeletionSubtreeTraversalGateSnapshot, RootCommitError> {
    let arena = store.fiber_arena();
    let mut records = Vec::new();

    for (deletion_list_index, deletion_list) in deletion_lists.iter().enumerate() {
        let parent = arena.get(deletion_list.parent())?;
        let host_parent = find_nearest_host_parent_for_deletion(arena, deletion_list.parent())?;
        for (deleted_index, &deleted_root) in deletion_list.deleted().iter().enumerate() {
            let deleted_root_tag = arena.get(deleted_root)?.tag();
            collect_deletion_subtree_traversal_gate_records(
                arena,
                DeletionSubtreeTraversalGateRequest {
                    root,
                    host_root: finished_work,
                    deletion_list: deletion_list.list(),
                    deletion_list_index,
                    deleted_index,
                    parent: deletion_list.parent(),
                    parent_tag: parent.tag(),
                    host_parent,
                    deleted_root,
                    deleted_root_tag,
                },
                deleted_root,
                0,
                StateNodeHandle::NONE,
                &mut records,
            )?;
        }
    }

    Ok(HostRootDeletionSubtreeTraversalGateSnapshot::from_records(
        records,
    ))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct DeletionSubtreeTraversalGateRequest {
    root: FiberRootId,
    host_root: FiberId,
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    parent: FiberId,
    parent_tag: FiberTag,
    host_parent: Option<HostRootDeletionHostParentRecord>,
    deleted_root: FiberId,
    deleted_root_tag: FiberTag,
}

fn collect_deletion_subtree_traversal_gate_records(
    arena: &FiberArena,
    request: DeletionSubtreeTraversalGateRequest,
    fiber: FiberId,
    traversal_depth: usize,
    portal_container_state_node: StateNodeHandle,
    records: &mut Vec<HostRootDeletionSubtreeTraversalGateRecord>,
) -> Result<(), RootCommitError> {
    let node = arena.get(fiber)?;
    let tag = node.tag();
    let portal_container_state_node = if tag == FiberTag::Portal {
        node.state_node()
    } else {
        portal_container_state_node
    };

    match deletion_subtree_boundary_status(tag) {
        Some(status @ HostRootDeletionSubtreeTraversalGateStatus::FragmentDeletedSubtreeDiagnostic)
        | Some(status @ HostRootDeletionSubtreeTraversalGateStatus::PortalDeletedSubtreeDiagnostic) =>
        {
            push_deletion_subtree_traversal_gate_record(
                records,
                request,
                fiber,
                tag,
                traversal_depth,
                node.state_node(),
                portal_container_state_node,
                None,
                status,
            );
        }
        Some(
            status @ HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked,
        )
        | Some(
            status @ HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked,
        )
        | Some(status @ HostRootDeletionSubtreeTraversalGateStatus::BroadDeletionTraversalBlocked) => {
            let unsupported_feature =
                unsupported_reconciler_feature_for_fiber_tag(tag).map(|feature| feature.feature());
            push_deletion_subtree_traversal_gate_record(
                records,
                request,
                fiber,
                tag,
                traversal_depth,
                node.state_node(),
                portal_container_state_node,
                unsupported_feature,
                status,
            );
            return Ok(());
        }
        Some(HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata) | None => {}
    }

    if deletion_subtree_should_traverse_children(tag) {
        for child in arena.child_ids(fiber)? {
            collect_deletion_subtree_traversal_gate_records(
                arena,
                request,
                child,
                traversal_depth + 1,
                portal_container_state_node,
                records,
            )?;
        }
    }

    if host_node_cleanup_token_target(tag).is_some() {
        push_deletion_subtree_traversal_gate_record(
            records,
            request,
            fiber,
            tag,
            traversal_depth,
            node.state_node(),
            portal_container_state_node,
            None,
            HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata,
        );
    }

    Ok(())
}

fn push_deletion_subtree_traversal_gate_record(
    records: &mut Vec<HostRootDeletionSubtreeTraversalGateRecord>,
    request: DeletionSubtreeTraversalGateRequest,
    fiber: FiberId,
    tag: FiberTag,
    traversal_depth: usize,
    state_node: StateNodeHandle,
    portal_container_state_node: StateNodeHandle,
    unsupported_feature: Option<&'static str>,
    status: HostRootDeletionSubtreeTraversalGateStatus,
) {
    records.push(HostRootDeletionSubtreeTraversalGateRecord {
        sequence: records.len(),
        root: request.root,
        host_root: request.host_root,
        deletion_list: request.deletion_list,
        deletion_list_index: request.deletion_list_index,
        deleted_index: request.deleted_index,
        parent: request.parent,
        parent_tag: request.parent_tag,
        host_parent: request.host_parent.map(|parent| parent.fiber),
        host_parent_tag: request.host_parent.map(|parent| parent.tag),
        host_parent_state_node: request
            .host_parent
            .map(|parent| parent.state_node)
            .unwrap_or(StateNodeHandle::NONE),
        host_parent_traversal_depth: request.host_parent.map(|parent| parent.traversal_depth),
        deleted_root: request.deleted_root,
        deleted_root_tag: request.deleted_root_tag,
        fiber,
        tag,
        traversal_depth,
        state_node,
        portal_container_state_node,
        unsupported_feature,
        status,
    });
}

const fn deletion_subtree_boundary_status(
    tag: FiberTag,
) -> Option<HostRootDeletionSubtreeTraversalGateStatus> {
    match tag {
        FiberTag::Fragment => {
            Some(HostRootDeletionSubtreeTraversalGateStatus::FragmentDeletedSubtreeDiagnostic)
        }
        FiberTag::Portal => {
            Some(HostRootDeletionSubtreeTraversalGateStatus::PortalDeletedSubtreeDiagnostic)
        }
        FiberTag::Suspense => {
            Some(HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked)
        }
        FiberTag::Offscreen => {
            Some(HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked)
        }
        FiberTag::HostComponent | FiberTag::HostText | FiberTag::FunctionComponent => None,
        _ => Some(HostRootDeletionSubtreeTraversalGateStatus::BroadDeletionTraversalBlocked),
    }
}

const fn deletion_subtree_should_traverse_children(tag: FiberTag) -> bool {
    matches!(
        tag,
        FiberTag::HostComponent
            | FiberTag::FunctionComponent
            | FiberTag::Fragment
            | FiberTag::Portal
    )
}

fn collect_pending_host_node_deletion_cleanup<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    deletion_lists: &[HostRootDeletionListRecord],
) -> Result<Vec<PendingHostRootDeletionCleanupRecord>, RootCommitError> {
    let arena = store.fiber_arena();
    let mut records = Vec::new();

    for (deletion_list_index, deletion_list) in deletion_lists.iter().enumerate() {
        let parent = arena.get(deletion_list.parent())?;
        let host_parent = find_nearest_host_parent_for_deletion(arena, deletion_list.parent())?;
        for (deleted_index, &deleted_root) in deletion_list.deleted().iter().enumerate() {
            let mut subtree_index = 0;
            collect_pending_deleted_subtree_host_node_cleanup(
                arena,
                PendingDeletedSubtreeHostNodeCleanupRequest {
                    root,
                    host_root: finished_work,
                    deletion_list: deletion_list.list(),
                    deletion_list_index,
                    deleted_index,
                    parent: deletion_list.parent(),
                    parent_tag: parent.tag(),
                    host_parent,
                    deleted_root,
                },
                deleted_root,
                &mut subtree_index,
                &mut records,
            )?;
        }
    }

    Ok(records)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct PendingDeletedSubtreeHostNodeCleanupRequest {
    root: FiberRootId,
    host_root: FiberId,
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    parent: FiberId,
    parent_tag: FiberTag,
    host_parent: Option<HostRootDeletionHostParentRecord>,
    deleted_root: FiberId,
}

fn collect_pending_deleted_subtree_host_node_cleanup(
    arena: &FiberArena,
    request: PendingDeletedSubtreeHostNodeCleanupRequest,
    fiber: FiberId,
    subtree_index: &mut usize,
    records: &mut Vec<PendingHostRootDeletionCleanupRecord>,
) -> Result<(), RootCommitError> {
    let node = arena.get(fiber)?;

    if deletion_subtree_traversal_blocks_children(node.tag()) {
        return Ok(());
    }

    if deletion_subtree_should_traverse_children(node.tag()) {
        for child in arena.child_ids(fiber)? {
            collect_pending_deleted_subtree_host_node_cleanup(
                arena,
                request,
                child,
                subtree_index,
                records,
            )?;
        }
    }

    if let Some(token_target) = host_node_cleanup_token_target(node.tag()) {
        records.push(PendingHostRootDeletionCleanupRecord {
            root: request.root,
            host_root: request.host_root,
            deletion_list: request.deletion_list,
            deletion_list_index: request.deletion_list_index,
            deleted_index: request.deleted_index,
            subtree_index: *subtree_index,
            parent: request.parent,
            parent_tag: request.parent_tag,
            host_parent: request.host_parent,
            deleted_root: request.deleted_root,
            fiber,
            tag: node.tag(),
            state_node: node.state_node(),
            token_target,
        });
        *subtree_index += 1;
    }

    Ok(())
}

const fn deletion_subtree_traversal_blocks_children(tag: FiberTag) -> bool {
    matches!(
        deletion_subtree_boundary_status(tag),
        Some(HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked)
            | Some(
                HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked
            )
            | Some(HostRootDeletionSubtreeTraversalGateStatus::BroadDeletionTraversalBlocked)
    )
}

const fn host_node_cleanup_token_target(tag: FiberTag) -> Option<HostFiberTokenTarget> {
    match tag {
        FiberTag::HostComponent => Some(HostFiberTokenTarget::Instance),
        FiberTag::HostText => Some(HostFiberTokenTarget::TextInstance),
        _ => None,
    }
}

fn materialize_host_node_deletion_cleanup_log<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    pending_records: Vec<PendingHostRootDeletionCleanupRecord>,
) -> Result<HostRootDeletionCleanupLog, RootCommitError> {
    let mut log = HostRootDeletionCleanupLog::new(root, finished_work);
    for pending in pending_records {
        let token_phase = HostFiberTokenPhase::Deletion;
        let token = store.host_tokens_mut().issue(
            pending.root,
            pending.fiber,
            token_phase,
            pending.token_target,
        );
        store.host_tokens().validate(
            token,
            pending.root,
            pending.fiber,
            token_phase,
            pending.token_target,
        )?;
        log.push(HostRootDeletionCleanupRecord {
            sequence: log.records.len(),
            root: pending.root,
            host_root: pending.host_root,
            deletion_list: pending.deletion_list,
            deletion_list_index: pending.deletion_list_index,
            deleted_index: pending.deleted_index,
            subtree_index: pending.subtree_index,
            parent: pending.parent,
            parent_tag: pending.parent_tag,
            host_parent: pending.host_parent.map(|parent| parent.fiber),
            host_parent_tag: pending.host_parent.map(|parent| parent.tag),
            host_parent_state_node: pending
                .host_parent
                .map(|parent| parent.state_node)
                .unwrap_or(StateNodeHandle::NONE),
            host_parent_traversal_depth: pending.host_parent.map(|parent| parent.traversal_depth),
            deleted_root: pending.deleted_root,
            fiber: pending.fiber,
            tag: pending.tag,
            state_node: pending.state_node,
            token,
            token_phase,
            token_target: pending.token_target,
        });
    }

    Ok(log)
}

fn materialize_deletion_cleanup_order_gate(
    commit: &HostRootCommitRecord,
) -> HostRootDeletionCleanupOrderGateSnapshot {
    let mut records = Vec::new();
    let mut ref_cleanup_return_count = 0;
    let mut passive_destroy_count = 0;
    let mut host_node_cleanup_count = 0;

    for cleanup_return in commit
        .ref_cleanup_return_execution_gate
        .records()
        .iter()
        .filter(|record| {
            record.action() == HostRootRefCommitAction::Detach
                && record.detach_reason() == Some(HostRootRefDetachReason::Deleted)
        })
    {
        ref_cleanup_return_count += 1;
        let coordinate = deletion_cleanup_coordinate_for_fiber(commit, cleanup_return.fiber());
        records.push(HostRootDeletionCleanupOrderGateRecord {
            sequence: records.len(),
            phase: HostRootDeletionCleanupOrderPhase::RefCleanupReturn,
            root: cleanup_return.root(),
            finished_work: commit.finished_work(),
            deletion_list: coordinate.map(|coordinate| coordinate.deletion_list),
            deletion_list_index: coordinate.map(|coordinate| coordinate.deletion_list_index),
            deleted_index: coordinate.map(|coordinate| coordinate.deleted_index),
            subtree_index: coordinate.map(|coordinate| coordinate.subtree_index),
            deleted_root: coordinate
                .map(|coordinate| coordinate.deleted_root)
                .unwrap_or_else(|| cleanup_return.fiber()),
            fiber: cleanup_return.fiber(),
            tag: coordinate
                .map(|coordinate| coordinate.tag)
                .unwrap_or(FiberTag::HostComponent),
            ref_cleanup_return_sequence: Some(cleanup_return.sequence()),
            passive_unmount_order: None,
            passive_destroy: None,
            host_cleanup_sequence: None,
        });
    }

    for passive in commit
        .function_component_deleted_subtree_passive_effects
        .records()
    {
        passive_destroy_count += 1;
        let coordinate = deletion_list_coordinate_for_deleted_root(commit, passive.deleted_root());
        records.push(HostRootDeletionCleanupOrderGateRecord {
            sequence: records.len(),
            phase: HostRootDeletionCleanupOrderPhase::PassiveDestroy,
            root: passive.root(),
            finished_work: commit.finished_work(),
            deletion_list: coordinate.map(|coordinate| coordinate.deletion_list),
            deletion_list_index: coordinate.map(|coordinate| coordinate.deletion_list_index),
            deleted_index: coordinate.map(|coordinate| coordinate.deleted_index),
            subtree_index: Some(passive.traversal_index()),
            deleted_root: passive.deleted_root(),
            fiber: passive.fiber(),
            tag: FiberTag::FunctionComponent,
            ref_cleanup_return_sequence: None,
            passive_unmount_order: Some(passive.unmount_order()),
            passive_destroy: passive.destroy(),
            host_cleanup_sequence: None,
        });
    }

    for cleanup in commit.host_node_deletion_cleanup_log.records() {
        host_node_cleanup_count += 1;
        records.push(HostRootDeletionCleanupOrderGateRecord {
            sequence: records.len(),
            phase: HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
            root: cleanup.root(),
            finished_work: cleanup.host_root(),
            deletion_list: Some(cleanup.deletion_list()),
            deletion_list_index: Some(cleanup.deletion_list_index()),
            deleted_index: Some(cleanup.deleted_index()),
            subtree_index: Some(cleanup.subtree_index()),
            deleted_root: cleanup.deleted_root(),
            fiber: cleanup.fiber(),
            tag: cleanup.tag(),
            ref_cleanup_return_sequence: None,
            passive_unmount_order: None,
            passive_destroy: None,
            host_cleanup_sequence: Some(cleanup.sequence()),
        });
    }

    HostRootDeletionCleanupOrderGateSnapshot {
        records,
        ref_cleanup_return_count,
        passive_destroy_count,
        host_node_cleanup_count,
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct DeletionCleanupOrderCoordinate {
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    subtree_index: usize,
    deleted_root: FiberId,
    tag: FiberTag,
}

fn deletion_cleanup_coordinate_for_fiber(
    commit: &HostRootCommitRecord,
    fiber: FiberId,
) -> Option<DeletionCleanupOrderCoordinate> {
    commit
        .host_node_deletion_cleanup_log
        .records()
        .iter()
        .find(|cleanup| cleanup.fiber() == fiber)
        .map(|cleanup| DeletionCleanupOrderCoordinate {
            deletion_list: cleanup.deletion_list(),
            deletion_list_index: cleanup.deletion_list_index(),
            deleted_index: cleanup.deleted_index(),
            subtree_index: cleanup.subtree_index(),
            deleted_root: cleanup.deleted_root(),
            tag: cleanup.tag(),
        })
}

fn deletion_list_coordinate_for_deleted_root(
    commit: &HostRootCommitRecord,
    deleted_root: FiberId,
) -> Option<DeletionCleanupOrderCoordinate> {
    commit
        .deletion_lists()
        .iter()
        .enumerate()
        .find_map(|(deletion_list_index, deletion_list)| {
            deletion_list
                .deleted()
                .iter()
                .position(|deleted| *deleted == deleted_root)
                .map(|deleted_index| DeletionCleanupOrderCoordinate {
                    deletion_list: deletion_list.list(),
                    deletion_list_index,
                    deleted_index,
                    subtree_index: 0,
                    deleted_root,
                    tag: FiberTag::FunctionComponent,
                })
        })
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
        FunctionComponentEffectDependencyPhase, FunctionComponentEffectDependencyStatus,
        FunctionComponentEffectPhase, FunctionComponentEffectRegistration,
        FunctionComponentHookRenderState, FunctionComponentHookRenderStore,
    };
    use crate::passive_effects::{
        PASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS,
        PassiveEffectCallbackInvocationErrorHandle, PassiveEffectCallbackInvocationGateStatus,
        PassiveEffectCallbackInvocationKind, PassiveEffectCallbackInvocationRequest,
        PassiveEffectCallbackInvocationStatus, PassiveEffectCallbackInvocationTestControl,
        PassiveEffectsFlushStatus,
        execute_passive_effect_callbacks_after_commit_from_committed_fiber_effects_under_test_control_for_canary,
    };
    use crate::root_callbacks::{
        ROOT_UPDATE_CALLBACK_INVOCATION_EXECUTION_GATE_BLOCKERS,
        ROOT_UPDATE_CALLBACK_INVOCATION_GATE_BLOCKERS, RootUpdateCallbackInvocationErrorHandle,
        RootUpdateCallbackInvocationExecutionGateStatus, RootUpdateCallbackInvocationGateSnapshot,
        RootUpdateCallbackInvocationGateStatus, RootUpdateCallbackInvocationRequest,
        RootUpdateCallbackInvocationStatus, RootUpdateCallbackInvocationTestControl,
    };
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::unsupported_features::{
        OFFSCREEN_UNSUPPORTED_FEATURE, SUSPENSE_UNSUPPORTED_FEATURE,
    };
    use crate::{
        RootElementHandle, RootOptions, RootTaskScheduleOutcome, RootUpdateCallbackHandle,
        RootUpdateCallbackRecord, RootUpdateCallbackVisibility, ensure_root_is_scheduled,
        process_root_schedule_in_microtask, render_host_root_for_lanes,
        render_host_root_via_scheduler_callback, update_container,
    };
    use fast_react_core::{
        DeletionListId, DependenciesHandle, FiberFlags, FiberMode, FiberTag, FiberTypeHandle,
        HookEffectCallbackHandle, HookEffectDependencies, HookEffectFlags, Lane, Lanes,
        PropsHandle, RefHandle, StateNodeHandle,
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
        attach_host_root_children(
            store,
            host_root,
            &[(tag, flags, state_node, pending_props, memoized_props)],
        )[0]
    }

    fn attach_host_root_children(
        store: &mut FiberRootStore<RecordingHost>,
        host_root: FiberId,
        children: &[(
            FiberTag,
            FiberFlags,
            StateNodeHandle,
            PropsHandle,
            PropsHandle,
        )],
    ) -> Vec<FiberId> {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let mut child_ids = Vec::with_capacity(children.len());
        let mut subtree_flags = store.fiber_arena().get(host_root).unwrap().subtree_flags();
        for &(tag, flags, state_node, pending_props, memoized_props) in children {
            let child = store
                .fiber_arena_mut()
                .create_fiber(tag, None, pending_props, mode);
            {
                let node = store.fiber_arena_mut().get_mut(child).unwrap();
                node.set_flags(flags);
                node.set_state_node(state_node);
                node.set_memoized_props(memoized_props);
            }
            subtree_flags |= flags;
            child_ids.push(child);
        }
        store
            .fiber_arena_mut()
            .set_children(host_root, &child_ids)
            .unwrap();
        store
            .fiber_arena_mut()
            .get_mut(host_root)
            .unwrap()
            .set_subtree_flags(subtree_flags);
        child_ids
    }

    fn bubble_test_fiber(store: &mut FiberRootStore<RecordingHost>, fiber: FiberId) {
        let bubbled = fast_react_core::bubble_properties(store.fiber_arena(), fiber).unwrap();
        let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
        node.set_child_lanes(bubbled.child_lanes());
        node.set_subtree_flags(bubbled.subtree_flags());
    }

    fn append_function_component_child(
        store: &mut FiberRootStore<RecordingHost>,
        parent: FiberId,
        props: PropsHandle,
        component: FiberTypeHandle,
    ) -> FiberId {
        let mode = store.fiber_arena().get(parent).unwrap().mode();
        let child = create_function_component_fiber(store, mode, props, component);
        store
            .fiber_arena_mut()
            .set_children(parent, &[child])
            .unwrap();
        child
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

    fn callback(raw: u64) -> HookEffectCallbackHandle {
        HookEffectCallbackHandle::from_raw(raw)
    }

    fn root_callback_error(raw: u64) -> RootUpdateCallbackInvocationErrorHandle {
        RootUpdateCallbackInvocationErrorHandle::from_raw(raw)
    }

    #[derive(Default)]
    struct TestRootUpdateCallbackControl {
        calls: Vec<RootUpdateCallbackInvocationRequest>,
        results: Vec<(
            RootUpdateCallbackHandle,
            Result<(), RootUpdateCallbackInvocationErrorHandle>,
        )>,
    }

    impl TestRootUpdateCallbackControl {
        fn with_result(
            mut self,
            callback: RootUpdateCallbackHandle,
            result: Result<(), RootUpdateCallbackInvocationErrorHandle>,
        ) -> Self {
            self.results.push((callback, result));
            self
        }

        fn calls(&self) -> &[RootUpdateCallbackInvocationRequest] {
            &self.calls
        }

        fn result(
            &self,
            callback: RootUpdateCallbackHandle,
        ) -> Result<(), RootUpdateCallbackInvocationErrorHandle> {
            self.results
                .iter()
                .find(|(accepted, _)| *accepted == callback)
                .map_or(Ok(()), |(_, result)| *result)
        }
    }

    impl RootUpdateCallbackInvocationTestControl for TestRootUpdateCallbackControl {
        fn invoke_root_update_callback(
            &mut self,
            request: RootUpdateCallbackInvocationRequest,
        ) -> Result<(), RootUpdateCallbackInvocationErrorHandle> {
            self.calls.push(request);
            self.result(request.callback())
        }
    }

    #[derive(Default)]
    struct TestPassiveEffectCallbackControl {
        calls: Vec<PassiveEffectCallbackInvocationRequest>,
        returned_destroy: Option<HookEffectCallbackHandle>,
    }

    impl TestPassiveEffectCallbackControl {
        fn with_returned_destroy(mut self, destroy: HookEffectCallbackHandle) -> Self {
            self.returned_destroy = Some(destroy);
            self
        }

        fn calls(&self) -> &[PassiveEffectCallbackInvocationRequest] {
            &self.calls
        }
    }

    impl PassiveEffectCallbackInvocationTestControl for TestPassiveEffectCallbackControl {
        fn invoke_passive_effect_destroy(
            &mut self,
            request: PassiveEffectCallbackInvocationRequest,
        ) -> Result<(), PassiveEffectCallbackInvocationErrorHandle> {
            self.calls.push(request);
            Ok(())
        }

        fn invoke_passive_effect_create(
            &mut self,
            request: PassiveEffectCallbackInvocationRequest,
        ) -> Result<Option<HookEffectCallbackHandle>, PassiveEffectCallbackInvocationErrorHandle>
        {
            self.calls.push(request);
            Ok(self.returned_destroy)
        }
    }

    #[derive(Default)]
    struct TestLayoutEffectCallbackControl {
        calls: Vec<FunctionComponentLayoutEffectCallbackInvocationRequest>,
        results: Vec<(
            HookEffectCallbackHandle,
            Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle>,
        )>,
    }

    impl TestLayoutEffectCallbackControl {
        fn calls(&self) -> &[FunctionComponentLayoutEffectCallbackInvocationRequest] {
            &self.calls
        }

        fn result(
            &self,
            callback: HookEffectCallbackHandle,
        ) -> Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle> {
            self.results
                .iter()
                .find(|(accepted, _)| *accepted == callback)
                .map_or(Ok(()), |(_, result)| *result)
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
            self.result(request.callback())
        }
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

    #[derive(Debug, Clone, PartialEq, Eq)]
    struct LayoutEffectExecutionFixture {
        finished_work: FiberId,
        finished_function: FiberId,
        state: FunctionComponentHookRenderState,
        previous_layout: FunctionComponentEffectRegistration,
        previous_passive: FunctionComponentEffectRegistration,
        layout: FunctionComponentEffectRegistration,
        passive: FunctionComponentEffectRegistration,
        queued_passive: FunctionComponentPendingPassiveCommitHandoff,
    }

    fn prepare_layout_effect_execution_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        hook_store: &mut FunctionComponentHookRenderStore,
        raw: u64,
    ) -> (HostRootRenderPhaseRecord, LayoutEffectExecutionFixture) {
        let current_root = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(raw);
        let current_function = append_function_component_child(
            store,
            current_root,
            PropsHandle::from_raw(raw + 1),
            component,
        );
        let previous_layout = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Layout,
                callback(raw + 2),
                deps(raw + 3),
                Some(callback(raw + 4)),
            )
            .unwrap();
        let previous_passive = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(raw + 5),
                deps(raw + 6),
                Some(callback(raw + 7)),
            )
            .unwrap();

        update_container(store, root_id, RootElementHandle::from_raw(raw + 8), None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            store,
            finished_work,
            PropsHandle::from_raw(raw + 9),
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
                callback(raw + 10),
                deps(raw + 11),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        let passive = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(raw + 12),
                deps(raw + 13),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let queued_passive = queue_function_component_pending_passive_effects(
            store,
            root_id,
            hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        bubble_test_fiber(store, finished_function);
        bubble_test_fiber(store, finished_work);

        (
            render,
            LayoutEffectExecutionFixture {
                finished_work,
                finished_function,
                state,
                previous_layout,
                previous_passive,
                layout,
                passive,
                queued_passive,
            },
        )
    }

    fn first_effect_list_record(
        snapshot: &FunctionComponentEffectListCommitPhaseOrderSnapshot,
        kind: FunctionComponentEffectListCommitPhaseOrderKind,
    ) -> FunctionComponentEffectListCommitPhaseOrderRecord {
        snapshot
            .records()
            .iter()
            .copied()
            .find(|record| record.kind() == kind)
            .unwrap()
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
        nested_deleted_component: FiberId,
        nested_deleted_component_state_node: StateNodeHandle,
        nested_deleted_component_ref: RefHandle,
        nested_deleted_text: FiberId,
        nested_deleted_text_state_node: StateNodeHandle,
        second_parent: FiberId,
        second_parent_state_node: StateNodeHandle,
        second_list: DeletionListId,
        third_deleted: FiberId,
        third_deleted_state_node: StateNodeHandle,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct FunctionComponentDeletionHostParentFixture {
        owner: FiberId,
        list: DeletionListId,
        deleted_text: FiberId,
        deleted_text_state_node: StateNodeHandle,
        deleted_component: FiberId,
        deleted_component_state_node: StateNodeHandle,
        nested_text: FiberId,
        nested_text_state_node: StateNodeHandle,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct DeletedHostSubtreeRefPassiveFixture {
        list: DeletionListId,
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

    fn create_test_fiber(
        store: &mut FiberRootStore<RecordingHost>,
        tag: FiberTag,
        props: u64,
    ) -> FiberId {
        store
            .fiber_arena_mut()
            .create_fiber(tag, None, PropsHandle::from_raw(props), FiberMode::NO)
    }

    fn prepare_host_component_update_wip(
        store: &mut FiberRootStore<RecordingHost>,
        current: FiberId,
        state_node: StateNodeHandle,
        pending_props: PropsHandle,
        memoized_props: PropsHandle,
    ) -> FiberId {
        let work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(current, pending_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_in_progress).unwrap();
            node.set_flags(FiberFlags::UPDATE);
            node.set_state_node(state_node);
            node.set_memoized_props(memoized_props);
            node.set_lanes(Lanes::NO);
        }
        work_in_progress
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct NestedHostParentFixture {
        outer_current: FiberId,
        inner_current: FiberId,
        text_current: FiberId,
        outer_state_node: StateNodeHandle,
        inner_state_node: StateNodeHandle,
        text_state_node: StateNodeHandle,
        outer_props: PropsHandle,
        inner_props: PropsHandle,
        text_props: PropsHandle,
    }

    fn attach_current_nested_host_parent_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        host_root: FiberId,
    ) -> NestedHostParentFixture {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let outer_current = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(9_100),
            mode,
        );
        let inner_current = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(9_101),
            mode,
        );
        let text_current = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(9_102),
            mode,
        );
        let fixture = NestedHostParentFixture {
            outer_current,
            inner_current,
            text_current,
            outer_state_node: StateNodeHandle::from_raw(9_200),
            inner_state_node: StateNodeHandle::from_raw(9_201),
            text_state_node: StateNodeHandle::from_raw(9_202),
            outer_props: PropsHandle::from_raw(9_100),
            inner_props: PropsHandle::from_raw(9_101),
            text_props: PropsHandle::from_raw(9_102),
        };
        {
            let node = store.fiber_arena_mut().get_mut(outer_current).unwrap();
            node.set_state_node(fixture.outer_state_node);
            node.set_memoized_props(fixture.outer_props);
        }
        {
            let node = store.fiber_arena_mut().get_mut(inner_current).unwrap();
            node.set_state_node(fixture.inner_state_node);
            node.set_memoized_props(fixture.inner_props);
        }
        {
            let node = store.fiber_arena_mut().get_mut(text_current).unwrap();
            node.set_state_node(fixture.text_state_node);
            node.set_memoized_props(fixture.text_props);
        }
        store
            .fiber_arena_mut()
            .set_children(inner_current, &[text_current])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(outer_current, &[inner_current])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[outer_current])
            .unwrap();
        fixture
    }

    fn prepare_nested_host_parent_placement_wip(
        store: &mut FiberRootStore<RecordingHost>,
        host_root: FiberId,
        fixture: NestedHostParentFixture,
        placed_text_state_node: StateNodeHandle,
    ) -> (FiberId, FiberId, FiberId, FiberId) {
        let work_outer = store
            .fiber_arena_mut()
            .create_work_in_progress(fixture.outer_current, fixture.outer_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_outer).unwrap();
            node.set_state_node(fixture.outer_state_node);
            node.set_memoized_props(fixture.outer_props);
            node.set_lanes(Lanes::NO);
        }
        let work_inner = store
            .fiber_arena_mut()
            .create_work_in_progress(fixture.inner_current, fixture.inner_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_inner).unwrap();
            node.set_state_node(fixture.inner_state_node);
            node.set_memoized_props(fixture.inner_props);
            node.set_lanes(Lanes::NO);
        }
        let stable_text = store
            .fiber_arena_mut()
            .create_work_in_progress(fixture.text_current, fixture.text_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(stable_text).unwrap();
            node.set_state_node(fixture.text_state_node);
            node.set_memoized_props(fixture.text_props);
            node.set_lanes(Lanes::NO);
        }
        let mode = store.fiber_arena().get(work_inner).unwrap().mode();
        let placed_text = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(9_103),
            mode,
        );
        {
            let node = store.fiber_arena_mut().get_mut(placed_text).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(placed_text_state_node);
            node.set_memoized_props(PropsHandle::from_raw(9_103));
        }
        store
            .fiber_arena_mut()
            .set_children(work_inner, &[stable_text, placed_text])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(work_outer, &[work_inner])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[work_outer])
            .unwrap();
        bubble_test_fiber(store, stable_text);
        bubble_test_fiber(store, placed_text);
        bubble_test_fiber(store, work_inner);
        bubble_test_fiber(store, work_outer);
        bubble_test_fiber(store, host_root);
        (work_outer, work_inner, stable_text, placed_text)
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
        let nested_deleted_component = create_test_fiber(store, FiberTag::HostComponent, 204);
        let nested_deleted_text = create_test_fiber(store, FiberTag::HostText, 205);
        let first_deleted_state_node = StateNodeHandle::from_raw(8202);
        let second_deleted_state_node = StateNodeHandle::from_raw(8203);
        let nested_deleted_component_state_node = StateNodeHandle::from_raw(8204);
        let nested_deleted_component_ref = RefHandle::from_raw(8206);
        let nested_deleted_text_state_node = StateNodeHandle::from_raw(8205);
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
            .get_mut(nested_deleted_component)
            .unwrap()
            .set_state_node(nested_deleted_component_state_node);
        store
            .fiber_arena_mut()
            .get_mut(nested_deleted_component)
            .unwrap()
            .set_ref_handle(nested_deleted_component_ref);
        store
            .fiber_arena_mut()
            .get_mut(nested_deleted_text)
            .unwrap()
            .set_state_node(nested_deleted_text_state_node);
        store
            .fiber_arena_mut()
            .set_children(nested_deleted_component, &[nested_deleted_text])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(
                first_parent,
                &[
                    first_kept,
                    first_deleted,
                    second_deleted,
                    nested_deleted_component,
                ],
            )
            .unwrap();
        let first_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(first_parent, second_deleted)
            .unwrap();
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(first_parent, first_deleted)
            .unwrap();
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(first_parent, nested_deleted_component)
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
        bubble_test_fiber(store, host_root_work_in_progress);

        DeletionMetadataFixture {
            first_parent,
            first_parent_state_node,
            first_list,
            first_deleted,
            first_deleted_state_node,
            second_deleted,
            second_deleted_state_node,
            nested_deleted_component,
            nested_deleted_component_state_node,
            nested_deleted_component_ref,
            nested_deleted_text,
            nested_deleted_text_state_node,
            second_parent,
            second_parent_state_node,
            second_list,
            third_deleted,
            third_deleted_state_node,
        }
    }

    fn attach_function_component_deletion_host_parent_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> FunctionComponentDeletionHostParentFixture {
        let owner = create_test_fiber(store, FiberTag::FunctionComponent, 401);
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[owner])
            .unwrap();

        let deleted_text = create_test_fiber(store, FiberTag::HostText, 402);
        let deleted_component = create_test_fiber(store, FiberTag::HostComponent, 403);
        let nested_text = create_test_fiber(store, FiberTag::HostText, 404);
        let deleted_text_state_node = StateNodeHandle::from_raw(8402);
        let deleted_component_state_node = StateNodeHandle::from_raw(8403);
        let nested_text_state_node = StateNodeHandle::from_raw(8404);
        store
            .fiber_arena_mut()
            .get_mut(deleted_text)
            .unwrap()
            .set_state_node(deleted_text_state_node);
        store
            .fiber_arena_mut()
            .get_mut(deleted_component)
            .unwrap()
            .set_state_node(deleted_component_state_node);
        store
            .fiber_arena_mut()
            .get_mut(nested_text)
            .unwrap()
            .set_state_node(nested_text_state_node);
        store
            .fiber_arena_mut()
            .set_children(deleted_component, &[nested_text])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(owner, &[deleted_text, deleted_component])
            .unwrap();
        let list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(owner, deleted_text)
            .unwrap();
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(owner, deleted_component)
            .unwrap();
        bubble_test_fiber(store, host_root_work_in_progress);

        FunctionComponentDeletionHostParentFixture {
            owner,
            list,
            deleted_text,
            deleted_text_state_node,
            deleted_component,
            deleted_component_state_node,
            nested_text,
            nested_text_state_node,
        }
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
        let deleted_host = create_host_ref_fiber(
            store,
            RefHandle::from_raw(8_701),
            StateNodeHandle::from_raw(8_801),
            FiberFlags::NO,
        );
        let deleted_function = create_function_component_fiber(
            store,
            mode,
            PropsHandle::from_raw(8_702),
            FiberTypeHandle::from_raw(8_902),
        );
        let deleted_text = create_test_fiber(store, FiberTag::HostText, 8_703);
        let deleted_text_state_node = StateNodeHandle::from_raw(8_803);
        store
            .fiber_arena_mut()
            .get_mut(deleted_text)
            .unwrap()
            .set_state_node(deleted_text_state_node);
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

        let passive_create = callback(8_901);
        let passive_destroy = callback(8_911);
        let passive_dependencies = deps(8_921);
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

        let list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(host_root_work_in_progress, deleted_host)
            .unwrap();
        bubble_test_fiber(store, host_root_work_in_progress);

        DeletedHostSubtreeRefPassiveFixture {
            list,
            deleted_host,
            deleted_host_state_node: StateNodeHandle::from_raw(8_801),
            deleted_host_ref: RefHandle::from_raw(8_701),
            deleted_function,
            deleted_text,
            deleted_text_state_node,
            passive_create,
            passive_destroy,
            passive_dependencies,
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
        assert!(commit.function_component_layout_effects().is_empty());
        assert!(commit.mutation_log().is_empty());
        assert!(commit.mutation_apply_log().is_empty());
        assert!(commit.deletion_lists().is_empty());
        assert!(
            commit
                .deletion_subtree_traversal_gate_for_canary()
                .is_empty()
        );
        assert!(commit.host_node_deletion_cleanup_log().is_empty());
        assert!(commit.ref_commit_metadata().is_empty());
        assert!(commit.dom_ref_callback_commit_gate().is_empty());
        assert_dom_ref_callback_gate_is_inert(commit.dom_ref_callback_commit_gate());
        assert!(commit.ref_callback_execution_handoff().is_empty());
        assert_ref_callback_execution_handoff_keeps_public_blockers(
            commit.ref_callback_execution_handoff(),
        );
        assert!(commit.ref_cleanup_return_execution_gate().is_empty());
        assert_ref_cleanup_return_execution_gate_keeps_public_blockers(
            commit.ref_cleanup_return_execution_gate(),
        );
        assert!(commit.root_update_callback_invocation_gate().is_empty());
        assert_root_update_callback_invocation_gate_is_inert(
            commit.root_update_callback_invocation_gate(),
        );
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
        let placement_sibling = records[0].placement_sibling().unwrap();
        assert_eq!(
            placement_sibling.status(),
            HostRootPlacementSiblingStatus::Append
        );
        assert_eq!(placement_sibling.sibling(), None);
        assert_eq!(placement_sibling.sibling_tag(), None);
        assert_eq!(
            placement_sibling.sibling_state_node(),
            StateNodeHandle::NONE
        );
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
        assert_eq!(apply_records[0].parent_state_node(), StateNodeHandle::NONE);
        assert_eq!(apply_records[0].fiber(), child);
        assert_eq!(apply_records[0].alternate_fiber(), None);
        assert_eq!(apply_records[0].tag(), FiberTag::HostText);
        assert_eq!(apply_records[0].state_node(), child_state_node);
        assert_eq!(
            apply_records[0].placement_sibling(),
            records[0].placement_sibling()
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_insert_before_for_immediate_stable_host_sibling() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let placed_state_node = StateNodeHandle::from_raw(710);
        let stable_state_node = StateNodeHandle::from_raw(711);
        let children = attach_host_root_children(
            &mut store,
            render.finished_work(),
            &[
                (
                    FiberTag::HostText,
                    FiberFlags::PLACEMENT,
                    placed_state_node,
                    PropsHandle::from_raw(712),
                    PropsHandle::from_raw(712),
                ),
                (
                    FiberTag::HostText,
                    FiberFlags::NO,
                    stable_state_node,
                    PropsHandle::from_raw(713),
                    PropsHandle::from_raw(713),
                ),
            ],
        );

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let records = commit.mutation_log().records();
        let apply_records = commit.mutation_apply_log().records();
        let diagnostics = commit.host_root_placement_apply_diagnostics_for_canary();
        let placement_sibling = records[0].placement_sibling().unwrap();

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].fiber(), children[0]);
        assert_eq!(
            records[0].kind(),
            HostRootMutationPhaseRecordKind::Placement
        );
        assert_eq!(
            placement_sibling.status(),
            HostRootPlacementSiblingStatus::InsertBefore
        );
        assert_eq!(placement_sibling.sibling(), Some(children[1]));
        assert_eq!(placement_sibling.sibling_tag(), Some(FiberTag::HostText));
        assert_eq!(placement_sibling.sibling_state_node(), stable_state_node);
        assert!(placement_sibling.can_insert_before());
        assert_eq!(apply_records.len(), 1);
        assert_eq!(apply_records[0].fiber(), children[0]);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
        );
        assert_eq!(
            apply_records[0].placement_sibling(),
            Some(placement_sibling)
        );
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].root(), root_id);
        assert_eq!(diagnostics[0].host_root(), render.finished_work());
        assert_eq!(diagnostics[0].fiber(), children[0]);
        assert_eq!(diagnostics[0].tag_name(), "HostText");
        assert_eq!(diagnostics[0].state_node_raw(), placed_state_node.raw());
        assert_eq!(
            diagnostics[0].apply_kind(),
            "insert-placement-in-container-before"
        );
        assert_eq!(diagnostics[0].sibling_status(), "insert-before");
        assert_eq!(diagnostics[0].sibling(), Some(children[1]));
        assert_eq!(diagnostics[0].sibling_tag_name(), Some("HostText"));
        assert_eq!(
            diagnostics[0].sibling_state_node_raw(),
            stable_state_node.raw()
        );
        assert!(diagnostics[0].can_insert_before());
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_placement_insertion_blocked_for_unproven_sibling() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let children = attach_host_root_children(
            &mut store,
            render.finished_work(),
            &[
                (
                    FiberTag::HostText,
                    FiberFlags::PLACEMENT,
                    StateNodeHandle::from_raw(720),
                    PropsHandle::from_raw(721),
                    PropsHandle::from_raw(721),
                ),
                (
                    FiberTag::HostText,
                    FiberFlags::NO,
                    StateNodeHandle::NONE,
                    PropsHandle::from_raw(722),
                    PropsHandle::from_raw(722),
                ),
            ],
        );

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let records = commit.mutation_log().records();
        let apply_records = commit.mutation_apply_log().records();
        let diagnostics = commit.host_root_placement_apply_diagnostics_for_canary();
        let placement_sibling = records[0].placement_sibling().unwrap();

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].fiber(), children[0]);
        assert_eq!(
            placement_sibling.status(),
            HostRootPlacementSiblingStatus::BlockedMissingStateNode
        );
        assert_eq!(placement_sibling.sibling(), Some(children[1]));
        assert_eq!(placement_sibling.sibling_tag(), Some(FiberTag::HostText));
        assert_eq!(
            placement_sibling.sibling_state_node(),
            StateNodeHandle::NONE
        );
        assert!(!placement_sibling.can_insert_before());
        assert_eq!(apply_records.len(), 1);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked
        );
        assert_eq!(
            apply_records[0].placement_sibling(),
            Some(placement_sibling)
        );
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].fiber(), children[0]);
        assert_eq!(
            diagnostics[0].apply_kind(),
            "record-placement-insertion-blocked"
        );
        assert_eq!(
            diagnostics[0].sibling_status(),
            "blocked-missing-state-node"
        );
        assert_eq!(diagnostics[0].sibling(), Some(children[1]));
        assert_eq!(diagnostics[0].sibling_tag_name(), Some("HostText"));
        assert_eq!(diagnostics[0].sibling_state_node_raw(), 0);
        assert!(!diagnostics[0].can_insert_before());
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_host_parent_child_placement_apply_record_without_host_mutation() {
        let (mut store, root_id, host) = root_store();
        let current_root = store.root(root_id).unwrap().current();
        let parent_state_node = StateNodeHandle::from_raw(710);
        let child_state_node = StateNodeHandle::from_raw(711);
        let parent_props = PropsHandle::from_raw(712);
        let child_props = PropsHandle::from_raw(713);
        let current_parent = attach_host_root_child(
            &mut store,
            current_root,
            FiberTag::HostComponent,
            FiberFlags::NO,
            parent_state_node,
            parent_props,
            parent_props,
        );

        update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let child = create_test_fiber(&mut store, FiberTag::HostText, child_props.raw());
        {
            let node = store.fiber_arena_mut().get_mut(child).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(child_state_node);
            node.set_memoized_props(child_props);
        }
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[child])
            .unwrap();
        bubble_test_fiber(&mut store, work_parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_parent])
            .unwrap();
        bubble_test_fiber(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let records = commit.mutation_log().records();
        let apply_records = commit.mutation_apply_log().records();

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].parent(), work_parent);
        assert_eq!(records[0].parent_tag(), FiberTag::HostComponent);
        assert_eq!(records[0].parent_state_node(), parent_state_node);
        assert_eq!(records[0].fiber(), child);
        assert_eq!(
            records[0].kind(),
            HostRootMutationPhaseRecordKind::Placement
        );
        assert_eq!(records[0].state_node(), child_state_node);
        assert_eq!(apply_records.len(), 1);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToHostParent
        );
        assert_eq!(apply_records[0].parent(), work_parent);
        assert_eq!(apply_records[0].parent_tag(), FiberTag::HostComponent);
        assert_eq!(apply_records[0].parent_state_node(), parent_state_node);
        assert_eq!(apply_records[0].fiber(), child);
        assert_eq!(apply_records[0].state_node(), child_state_node);
        assert_eq!(
            commit.test_only_host_parent_placement_apply_count_for_canary(),
            1
        );
        assert!(commit.has_test_only_host_parent_placement_apply_for_canary(
            parent_state_node.raw(),
            child_state_node.raw()
        ));
        assert!(
            !commit.has_test_only_host_parent_placement_apply_for_canary(
                parent_state_node.raw(),
                StateNodeHandle::from_raw(9999).raw()
            )
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_nested_host_parent_child_placement_apply_record_without_host_mutation() {
        let (mut store, root_id, host) = root_store();
        let current_root = store.root(root_id).unwrap().current();
        let fixture = attach_current_nested_host_parent_fixture(&mut store, current_root);
        update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let placed_text_state_node = StateNodeHandle::from_raw(9_203);
        let (work_outer, work_inner, stable_text, placed_text) =
            prepare_nested_host_parent_placement_wip(
                &mut store,
                render.finished_work(),
                fixture,
                placed_text_state_node,
            );

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let records = commit.mutation_log().records();
        let apply_records = commit.mutation_apply_log().records();
        let diagnostics = commit.host_parent_placement_apply_diagnostics_for_canary();

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].host_root(), render.finished_work());
        assert_eq!(records[0].parent(), work_inner);
        assert_eq!(records[0].parent_tag(), FiberTag::HostComponent);
        assert_eq!(records[0].parent_state_node(), fixture.inner_state_node);
        assert_eq!(records[0].fiber(), placed_text);
        assert_eq!(records[0].tag(), FiberTag::HostText);
        assert_eq!(
            records[0].kind(),
            HostRootMutationPhaseRecordKind::Placement
        );
        assert_eq!(records[0].state_node(), placed_text_state_node);
        assert_eq!(records[0].placement_sibling().unwrap().sibling(), None);
        assert_eq!(apply_records.len(), 1);
        assert_eq!(apply_records[0].parent(), work_inner);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToHostParent
        );
        assert_eq!(apply_records[0].fiber(), placed_text);
        assert_eq!(apply_records[0].state_node(), placed_text_state_node);
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].root(), root_id);
        assert_eq!(diagnostics[0].host_root(), render.finished_work());
        assert_eq!(diagnostics[0].parent(), work_inner);
        assert_eq!(diagnostics[0].parent_tag_name(), "HostComponent");
        assert_eq!(
            diagnostics[0].parent_state_node_raw(),
            fixture.inner_state_node.raw()
        );
        assert_eq!(diagnostics[0].fiber(), placed_text);
        assert_eq!(diagnostics[0].tag_name(), "HostText");
        assert_eq!(
            diagnostics[0].state_node_raw(),
            placed_text_state_node.raw()
        );
        assert_eq!(
            diagnostics[0].apply_kind(),
            "append-placement-to-host-parent"
        );
        assert!(diagnostics[0].applies_to_host_parent());
        assert_eq!(
            store.fiber_arena().get(work_outer).unwrap().child(),
            Some(work_inner)
        );
        assert_eq!(
            store.fiber_arena().get(work_inner).unwrap().child(),
            Some(stable_text)
        );
        assert_eq!(
            store.fiber_arena().get(stable_text).unwrap().sibling(),
            Some(placed_text)
        );
        assert_eq!(
            commit.test_only_host_parent_placement_apply_count_for_canary(),
            1
        );
        assert!(commit.has_test_only_host_parent_placement_apply_for_canary(
            fixture.inner_state_node.raw(),
            placed_text_state_node.raw()
        ));
        assert!(
            !commit.has_test_only_host_parent_placement_apply_for_canary(
                fixture.outer_state_node.raw(),
                placed_text_state_node.raw()
            )
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_does_not_descend_through_unsupported_nested_parent_blockers() {
        for blocker_tag in [FiberTag::Fragment, FiberTag::Portal, FiberTag::Suspense] {
            let (mut store, root_id, host) = root_store();
            update_container(&mut store, root_id, RootElementHandle::from_raw(48), None).unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let outer = create_test_fiber(&mut store, FiberTag::HostComponent, 9_300);
            let blocker = create_test_fiber(&mut store, blocker_tag, 9_301);
            let nested_parent = create_test_fiber(&mut store, FiberTag::HostComponent, 9_302);
            let placed_text = create_test_fiber(&mut store, FiberTag::HostText, 9_303);
            {
                let node = store.fiber_arena_mut().get_mut(outer).unwrap();
                node.set_state_node(StateNodeHandle::from_raw(9_400));
                node.set_memoized_props(PropsHandle::from_raw(9_300));
            }
            {
                let node = store.fiber_arena_mut().get_mut(nested_parent).unwrap();
                node.set_state_node(StateNodeHandle::from_raw(9_401));
                node.set_memoized_props(PropsHandle::from_raw(9_302));
            }
            {
                let node = store.fiber_arena_mut().get_mut(placed_text).unwrap();
                node.set_flags(FiberFlags::PLACEMENT);
                node.set_state_node(StateNodeHandle::from_raw(9_402));
                node.set_memoized_props(PropsHandle::from_raw(9_303));
            }
            store
                .fiber_arena_mut()
                .set_children(nested_parent, &[placed_text])
                .unwrap();
            store
                .fiber_arena_mut()
                .set_children(blocker, &[nested_parent])
                .unwrap();
            store
                .fiber_arena_mut()
                .set_children(outer, &[blocker])
                .unwrap();
            store
                .fiber_arena_mut()
                .set_children(render.finished_work(), &[outer])
                .unwrap();
            bubble_test_fiber(&mut store, placed_text);
            bubble_test_fiber(&mut store, nested_parent);
            bubble_test_fiber(&mut store, blocker);
            bubble_test_fiber(&mut store, outer);
            bubble_test_fiber(&mut store, render.finished_work());

            let commit = commit_finished_host_root(&mut store, render).unwrap();

            assert!(commit.mutation_log().is_empty());
            assert!(commit.mutation_apply_log().is_empty());
            assert!(
                commit
                    .host_parent_placement_apply_diagnostics_for_canary()
                    .is_empty()
            );
            assert_eq!(host.operations(), Vec::<&'static str>::new());
        }
    }

    #[test]
    fn root_commit_records_nested_placement_under_new_host_parent_as_recorded_only() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(47), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let parent_state_node = StateNodeHandle::from_raw(720);
        let child_state_node = StateNodeHandle::from_raw(721);
        let parent = create_test_fiber(&mut store, FiberTag::HostComponent, 722);
        let child = create_test_fiber(&mut store, FiberTag::HostText, 723);
        {
            let node = store.fiber_arena_mut().get_mut(parent).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(parent_state_node);
            node.set_memoized_props(PropsHandle::from_raw(722));
        }
        {
            let node = store.fiber_arena_mut().get_mut(child).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(child_state_node);
            node.set_memoized_props(PropsHandle::from_raw(723));
        }
        store
            .fiber_arena_mut()
            .set_children(parent, &[child])
            .unwrap();
        bubble_test_fiber(&mut store, parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[parent])
            .unwrap();
        bubble_test_fiber(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let apply_records = commit.mutation_apply_log().records();

        assert_eq!(apply_records.len(), 2);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(apply_records[0].fiber(), parent);
        assert_eq!(
            apply_records[1].kind(),
            HostRootMutationApplyRecordKind::SkipUnsupportedNestedPlacement
        );
        assert_eq!(apply_records[1].parent(), parent);
        assert_eq!(apply_records[1].parent_tag(), FiberTag::HostComponent);
        assert_eq!(apply_records[1].parent_state_node(), parent_state_node);
        assert_eq!(apply_records[1].fiber(), child);
        assert_eq!(apply_records[1].state_node(), child_state_node);
        assert_eq!(
            commit.test_only_host_parent_placement_apply_count_for_canary(),
            0
        );
        assert!(
            !commit.has_test_only_host_parent_placement_apply_for_canary(
                parent_state_node.raw(),
                child_state_node.raw()
            )
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_host_parent_text_update_apply_record_without_host_mutation() {
        let (mut store, root_id, host) = root_store();
        let current_root = store.root(root_id).unwrap().current();
        let parent_state_node = StateNodeHandle::from_raw(730);
        let text_state_node = StateNodeHandle::from_raw(731);
        let parent_props = PropsHandle::from_raw(732);
        let old_text_props = PropsHandle::from_raw(733);
        let next_pending_props = PropsHandle::from_raw(734);
        let next_memoized_props = PropsHandle::from_raw(735);
        let current_parent = attach_host_root_child(
            &mut store,
            current_root,
            FiberTag::HostComponent,
            FiberFlags::NO,
            parent_state_node,
            parent_props,
            parent_props,
        );
        let current_text = create_test_fiber(&mut store, FiberTag::HostText, old_text_props.raw());
        {
            let node = store.fiber_arena_mut().get_mut(current_text).unwrap();
            node.set_state_node(text_state_node);
            node.set_memoized_props(old_text_props);
        }
        store
            .fiber_arena_mut()
            .set_children(current_parent, &[current_text])
            .unwrap();
        bubble_test_fiber(&mut store, current_parent);
        bubble_test_fiber(&mut store, current_root);

        update_container(&mut store, root_id, RootElementHandle::from_raw(48), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let work_text = store
            .fiber_arena_mut()
            .create_work_in_progress(current_text, next_pending_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_text).unwrap();
            node.set_flags(FiberFlags::UPDATE);
            node.set_state_node(text_state_node);
            node.set_memoized_props(next_memoized_props);
        }
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[work_text])
            .unwrap();
        bubble_test_fiber(&mut store, work_parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_parent])
            .unwrap();
        bubble_test_fiber(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let records = commit.mutation_log().records();
        let apply_records = commit.mutation_apply_log().records();

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].parent(), work_parent);
        assert_eq!(records[0].parent_tag(), FiberTag::HostComponent);
        assert_eq!(records[0].parent_state_node(), parent_state_node);
        assert_eq!(records[0].fiber(), work_text);
        assert_eq!(records[0].alternate_fiber(), Some(current_text));
        assert_eq!(records[0].tag(), FiberTag::HostText);
        assert_eq!(records[0].kind(), HostRootMutationPhaseRecordKind::Update);
        assert_eq!(records[0].state_node(), text_state_node);
        assert_eq!(records[0].pending_props(), next_pending_props);
        assert_eq!(records[0].memoized_props(), next_memoized_props);
        assert_eq!(records[0].alternate_memoized_props(), Some(old_text_props));
        assert_eq!(apply_records.len(), 1);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        );
        assert_eq!(apply_records[0].parent(), work_parent);
        assert_eq!(apply_records[0].parent_tag(), FiberTag::HostComponent);
        assert_eq!(apply_records[0].parent_state_node(), parent_state_node);
        assert_eq!(apply_records[0].fiber(), work_text);
        assert_eq!(apply_records[0].alternate_fiber(), Some(current_text));
        assert_eq!(apply_records[0].state_node(), text_state_node);
        assert_eq!(
            commit.test_only_host_text_update_apply_count_for_canary(),
            1
        );
        assert!(commit.has_test_only_host_text_update_apply_for_canary(
            current_text,
            work_text,
            text_state_node.raw()
        ));
        assert!(!commit.has_test_only_host_text_update_apply_for_canary(
            current_text,
            work_text,
            StateNodeHandle::from_raw(9999).raw()
        ));
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_host_parent_component_and_text_update_apply_records_without_host_mutation()
     {
        let (mut store, root_id, host) = root_store();
        let current_root = store.root(root_id).unwrap().current();
        let outer_state_node = StateNodeHandle::from_raw(750);
        let inner_state_node = StateNodeHandle::from_raw(751);
        let text_state_node = StateNodeHandle::from_raw(752);
        let outer_props = PropsHandle::from_raw(753);
        let old_inner_props = PropsHandle::from_raw(754);
        let old_text_props = PropsHandle::from_raw(755);
        let next_inner_pending_props = PropsHandle::from_raw(756);
        let next_inner_memoized_props = PropsHandle::from_raw(757);
        let next_text_pending_props = PropsHandle::from_raw(758);
        let next_text_memoized_props = PropsHandle::from_raw(759);
        let current_outer = attach_host_root_child(
            &mut store,
            current_root,
            FiberTag::HostComponent,
            FiberFlags::NO,
            outer_state_node,
            outer_props,
            outer_props,
        );
        let current_inner =
            create_test_fiber(&mut store, FiberTag::HostComponent, old_inner_props.raw());
        let current_text = create_test_fiber(&mut store, FiberTag::HostText, old_text_props.raw());
        {
            let node = store.fiber_arena_mut().get_mut(current_inner).unwrap();
            node.set_state_node(inner_state_node);
            node.set_memoized_props(old_inner_props);
        }
        {
            let node = store.fiber_arena_mut().get_mut(current_text).unwrap();
            node.set_state_node(text_state_node);
            node.set_memoized_props(old_text_props);
        }
        store
            .fiber_arena_mut()
            .set_children(current_inner, &[current_text])
            .unwrap();
        bubble_test_fiber(&mut store, current_inner);
        store
            .fiber_arena_mut()
            .set_children(current_outer, &[current_inner])
            .unwrap();
        bubble_test_fiber(&mut store, current_outer);
        bubble_test_fiber(&mut store, current_root);

        update_container(&mut store, root_id, RootElementHandle::from_raw(50), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let work_outer = store
            .fiber_arena_mut()
            .create_work_in_progress(current_outer, outer_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_outer).unwrap();
            node.set_state_node(outer_state_node);
            node.set_memoized_props(outer_props);
            node.set_lanes(Lanes::NO);
        }
        let work_inner = store
            .fiber_arena_mut()
            .create_work_in_progress(current_inner, next_inner_pending_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_inner).unwrap();
            node.set_flags(FiberFlags::UPDATE);
            node.set_state_node(inner_state_node);
            node.set_memoized_props(next_inner_memoized_props);
            node.set_lanes(Lanes::NO);
        }
        let work_text = store
            .fiber_arena_mut()
            .create_work_in_progress(current_text, next_text_pending_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_text).unwrap();
            node.set_flags(FiberFlags::UPDATE);
            node.set_state_node(text_state_node);
            node.set_memoized_props(next_text_memoized_props);
            node.set_lanes(Lanes::NO);
        }
        store
            .fiber_arena_mut()
            .set_children(work_inner, &[work_text])
            .unwrap();
        bubble_test_fiber(&mut store, work_inner);
        store
            .fiber_arena_mut()
            .set_children(work_outer, &[work_inner])
            .unwrap();
        bubble_test_fiber(&mut store, work_outer);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_outer])
            .unwrap();
        bubble_test_fiber(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let records = commit.mutation_log().records();
        let apply_records = commit.mutation_apply_log().records();

        assert_eq!(records.len(), 2);
        assert_eq!(records[0].parent(), work_inner);
        assert_eq!(records[0].parent_tag(), FiberTag::HostComponent);
        assert_eq!(records[0].parent_state_node(), inner_state_node);
        assert_eq!(records[0].fiber(), work_text);
        assert_eq!(records[0].alternate_fiber(), Some(current_text));
        assert_eq!(records[0].tag(), FiberTag::HostText);
        assert_eq!(records[0].kind(), HostRootMutationPhaseRecordKind::Update);
        assert_eq!(records[0].state_node(), text_state_node);
        assert_eq!(records[0].pending_props(), next_text_pending_props);
        assert_eq!(records[0].memoized_props(), next_text_memoized_props);
        assert_eq!(records[0].alternate_memoized_props(), Some(old_text_props));
        assert_eq!(records[1].parent(), work_outer);
        assert_eq!(records[1].parent_tag(), FiberTag::HostComponent);
        assert_eq!(records[1].parent_state_node(), outer_state_node);
        assert_eq!(records[1].fiber(), work_inner);
        assert_eq!(records[1].alternate_fiber(), Some(current_inner));
        assert_eq!(records[1].tag(), FiberTag::HostComponent);
        assert_eq!(records[1].kind(), HostRootMutationPhaseRecordKind::Update);
        assert_eq!(records[1].state_node(), inner_state_node);
        assert_eq!(records[1].pending_props(), next_inner_pending_props);
        assert_eq!(records[1].memoized_props(), next_inner_memoized_props);
        assert_eq!(records[1].alternate_memoized_props(), Some(old_inner_props));
        assert_eq!(apply_records.len(), 2);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        );
        assert_eq!(apply_records[0].parent(), work_inner);
        assert_eq!(apply_records[0].fiber(), work_text);
        assert_eq!(apply_records[0].alternate_fiber(), Some(current_text));
        assert_eq!(apply_records[0].state_node(), text_state_node);
        assert_eq!(
            apply_records[1].kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        );
        assert_eq!(apply_records[1].parent(), work_outer);
        assert_eq!(apply_records[1].fiber(), work_inner);
        assert_eq!(apply_records[1].alternate_fiber(), Some(current_inner));
        assert_eq!(apply_records[1].state_node(), inner_state_node);
        assert_eq!(
            commit.test_only_host_component_update_apply_count_for_canary(),
            1
        );
        assert!(commit.has_test_only_host_component_update_apply_for_canary(
            current_inner,
            work_inner,
            inner_state_node.raw()
        ));
        assert!(
            !commit.has_test_only_host_component_update_apply_for_canary(
                current_inner,
                work_inner,
                StateNodeHandle::from_raw(9999).raw()
            )
        );
        assert_eq!(
            commit.test_only_host_text_update_apply_count_for_canary(),
            1
        );
        assert!(commit.has_test_only_host_text_update_apply_for_canary(
            current_text,
            work_text,
            text_state_node.raw()
        ));
        assert_eq!(
            store.root(root_id).unwrap().current(),
            commit.finished_work()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_ordered_host_component_update_apply_traversal_without_host_mutation() {
        let (mut store, root_id, host) = root_store();
        let current_root = store.root(root_id).unwrap().current();
        let outer_state_node = StateNodeHandle::from_raw(770);
        let middle_state_node = StateNodeHandle::from_raw(771);
        let inner_state_node = StateNodeHandle::from_raw(772);
        let sibling_state_node = StateNodeHandle::from_raw(773);
        let outer_old_props = PropsHandle::from_raw(774);
        let middle_old_props = PropsHandle::from_raw(775);
        let inner_old_props = PropsHandle::from_raw(776);
        let sibling_old_props = PropsHandle::from_raw(777);
        let outer_next_pending_props = PropsHandle::from_raw(778);
        let outer_next_memoized_props = PropsHandle::from_raw(779);
        let middle_next_pending_props = PropsHandle::from_raw(780);
        let middle_next_memoized_props = PropsHandle::from_raw(781);
        let inner_next_pending_props = PropsHandle::from_raw(782);
        let inner_next_memoized_props = PropsHandle::from_raw(783);
        let sibling_next_pending_props = PropsHandle::from_raw(784);
        let sibling_next_memoized_props = PropsHandle::from_raw(785);

        let current_outer = attach_host_root_child(
            &mut store,
            current_root,
            FiberTag::HostComponent,
            FiberFlags::NO,
            outer_state_node,
            outer_old_props,
            outer_old_props,
        );
        let current_middle =
            create_test_fiber(&mut store, FiberTag::HostComponent, middle_old_props.raw());
        let current_inner =
            create_test_fiber(&mut store, FiberTag::HostComponent, inner_old_props.raw());
        let current_sibling =
            create_test_fiber(&mut store, FiberTag::HostComponent, sibling_old_props.raw());
        {
            let node = store.fiber_arena_mut().get_mut(current_middle).unwrap();
            node.set_state_node(middle_state_node);
            node.set_memoized_props(middle_old_props);
        }
        {
            let node = store.fiber_arena_mut().get_mut(current_inner).unwrap();
            node.set_state_node(inner_state_node);
            node.set_memoized_props(inner_old_props);
        }
        {
            let node = store.fiber_arena_mut().get_mut(current_sibling).unwrap();
            node.set_state_node(sibling_state_node);
            node.set_memoized_props(sibling_old_props);
        }
        store
            .fiber_arena_mut()
            .set_children(current_middle, &[current_inner])
            .unwrap();
        bubble_test_fiber(&mut store, current_middle);
        store
            .fiber_arena_mut()
            .set_children(current_outer, &[current_middle, current_sibling])
            .unwrap();
        bubble_test_fiber(&mut store, current_outer);
        bubble_test_fiber(&mut store, current_root);

        update_container(&mut store, root_id, RootElementHandle::from_raw(52), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let work_outer = prepare_host_component_update_wip(
            &mut store,
            current_outer,
            outer_state_node,
            outer_next_pending_props,
            outer_next_memoized_props,
        );
        let work_middle = prepare_host_component_update_wip(
            &mut store,
            current_middle,
            middle_state_node,
            middle_next_pending_props,
            middle_next_memoized_props,
        );
        let work_inner = prepare_host_component_update_wip(
            &mut store,
            current_inner,
            inner_state_node,
            inner_next_pending_props,
            inner_next_memoized_props,
        );
        let work_sibling = prepare_host_component_update_wip(
            &mut store,
            current_sibling,
            sibling_state_node,
            sibling_next_pending_props,
            sibling_next_memoized_props,
        );
        store
            .fiber_arena_mut()
            .set_children(work_middle, &[work_inner])
            .unwrap();
        bubble_test_fiber(&mut store, work_middle);
        store
            .fiber_arena_mut()
            .set_children(work_outer, &[work_middle, work_sibling])
            .unwrap();
        bubble_test_fiber(&mut store, work_outer);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_outer])
            .unwrap();
        bubble_test_fiber(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let records = commit.mutation_log().records();
        let apply_records = commit.mutation_apply_log().records();
        let diagnostics = commit.host_component_update_apply_diagnostics_for_canary();

        assert_eq!(
            records
                .iter()
                .map(|record| record.fiber())
                .collect::<Vec<_>>(),
            vec![work_inner, work_middle, work_sibling, work_outer]
        );
        assert!(
            records
                .iter()
                .all(|record| record.kind() == HostRootMutationPhaseRecordKind::Update)
        );
        assert_eq!(
            apply_records
                .iter()
                .map(|record| record.kind())
                .collect::<Vec<_>>(),
            vec![
                HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
                HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
                HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
                HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
            ]
        );
        assert_eq!(
            apply_records
                .iter()
                .map(|record| record.fiber())
                .collect::<Vec<_>>(),
            vec![work_inner, work_middle, work_sibling, work_outer]
        );
        assert_eq!(
            apply_records
                .iter()
                .map(|record| record.alternate_fiber())
                .collect::<Vec<_>>(),
            vec![
                Some(current_inner),
                Some(current_middle),
                Some(current_sibling),
                Some(current_outer),
            ]
        );
        assert_eq!(
            apply_records
                .iter()
                .map(|record| record.parent())
                .collect::<Vec<_>>(),
            vec![work_middle, work_outer, work_outer, render.finished_work()]
        );
        assert_eq!(diagnostics.len(), 4);
        assert_eq!(
            diagnostics
                .iter()
                .map(|diagnostic| diagnostic.sequence())
                .collect::<Vec<_>>(),
            vec![0, 1, 2, 3]
        );
        assert_eq!(
            diagnostics
                .iter()
                .map(|diagnostic| diagnostic.fiber())
                .collect::<Vec<_>>(),
            vec![work_inner, work_middle, work_sibling, work_outer]
        );
        assert_eq!(diagnostics[0].root(), root_id);
        assert_eq!(diagnostics[0].host_root(), render.finished_work());
        assert_eq!(diagnostics[0].parent(), work_middle);
        assert_eq!(diagnostics[0].parent_tag_name(), "HostComponent");
        assert_eq!(
            diagnostics[0].parent_state_node_raw(),
            middle_state_node.raw()
        );
        assert_eq!(diagnostics[0].alternate_fiber(), Some(current_inner));
        assert_eq!(diagnostics[0].tag_name(), "HostComponent");
        assert_eq!(diagnostics[0].state_node_raw(), inner_state_node.raw());
        assert_eq!(diagnostics[0].pending_props(), inner_next_pending_props);
        assert_eq!(diagnostics[0].memoized_props(), inner_next_memoized_props);
        assert_eq!(
            diagnostics[0].alternate_memoized_props(),
            Some(inner_old_props)
        );
        assert_eq!(diagnostics[0].apply_kind(), "commit-host-component-update");
        assert_eq!(diagnostics[3].parent_tag(), FiberTag::HostRoot);
        assert_eq!(diagnostics[3].parent_state_node(), StateNodeHandle::NONE);
        assert_eq!(
            commit.test_only_host_component_update_apply_count_for_canary(),
            4
        );
        assert_eq!(
            commit.test_only_host_text_update_apply_count_for_canary(),
            0
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_stops_host_component_update_traversal_at_canary_depth() {
        let (mut store, root_id, host) = root_store();
        let current_root = store.root(root_id).unwrap().current();
        let state_nodes = [
            StateNodeHandle::from_raw(790),
            StateNodeHandle::from_raw(791),
            StateNodeHandle::from_raw(792),
            StateNodeHandle::from_raw(793),
            StateNodeHandle::from_raw(794),
        ];
        let old_props = [
            PropsHandle::from_raw(795),
            PropsHandle::from_raw(796),
            PropsHandle::from_raw(797),
            PropsHandle::from_raw(798),
            PropsHandle::from_raw(799),
        ];
        let next_pending_props = [
            PropsHandle::from_raw(800),
            PropsHandle::from_raw(801),
            PropsHandle::from_raw(802),
            PropsHandle::from_raw(803),
            PropsHandle::from_raw(804),
        ];
        let next_memoized_props = [
            PropsHandle::from_raw(805),
            PropsHandle::from_raw(806),
            PropsHandle::from_raw(807),
            PropsHandle::from_raw(808),
            PropsHandle::from_raw(809),
        ];

        let current = old_props
            .iter()
            .map(|props| create_test_fiber(&mut store, FiberTag::HostComponent, props.raw()))
            .collect::<Vec<_>>();
        for ((&fiber, &state_node), &props) in
            current.iter().zip(state_nodes.iter()).zip(old_props.iter())
        {
            let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
            node.set_state_node(state_node);
            node.set_memoized_props(props);
        }
        for index in (0..current.len() - 1).rev() {
            store
                .fiber_arena_mut()
                .set_children(current[index], &[current[index + 1]])
                .unwrap();
            bubble_test_fiber(&mut store, current[index]);
        }
        store
            .fiber_arena_mut()
            .set_children(current_root, &[current[0]])
            .unwrap();
        bubble_test_fiber(&mut store, current_root);

        update_container(&mut store, root_id, RootElementHandle::from_raw(53), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let work = current
            .iter()
            .enumerate()
            .map(|(index, &fiber)| {
                prepare_host_component_update_wip(
                    &mut store,
                    fiber,
                    state_nodes[index],
                    next_pending_props[index],
                    next_memoized_props[index],
                )
            })
            .collect::<Vec<_>>();
        for index in (0..work.len() - 1).rev() {
            store
                .fiber_arena_mut()
                .set_children(work[index], &[work[index + 1]])
                .unwrap();
            bubble_test_fiber(&mut store, work[index]);
        }
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work[0]])
            .unwrap();
        bubble_test_fiber(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let diagnostics = commit.host_component_update_apply_diagnostics_for_canary();

        assert_eq!(
            diagnostics
                .iter()
                .map(|diagnostic| diagnostic.fiber())
                .collect::<Vec<_>>(),
            vec![work[3], work[2], work[1], work[0]]
        );
        assert!(
            !commit.has_test_only_host_component_update_apply_for_canary(
                current[4],
                work[4],
                state_nodes[4].raw()
            )
        );
        assert_eq!(
            commit.test_only_host_component_update_apply_count_for_canary(),
            HOST_COMPONENT_UPDATE_CANARY_MAX_HOST_COMPONENT_DEPTH
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_skips_host_text_update_under_new_host_parent_placement_boundary() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(49), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let parent_state_node = StateNodeHandle::from_raw(740);
        let text_state_node = StateNodeHandle::from_raw(741);
        let parent = create_test_fiber(&mut store, FiberTag::HostComponent, 742);
        let text = create_test_fiber(&mut store, FiberTag::HostText, 743);
        {
            let node = store.fiber_arena_mut().get_mut(parent).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(parent_state_node);
            node.set_memoized_props(PropsHandle::from_raw(742));
        }
        {
            let node = store.fiber_arena_mut().get_mut(text).unwrap();
            node.set_flags(FiberFlags::UPDATE);
            node.set_state_node(text_state_node);
            node.set_memoized_props(PropsHandle::from_raw(743));
        }
        store
            .fiber_arena_mut()
            .set_children(parent, &[text])
            .unwrap();
        bubble_test_fiber(&mut store, parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[parent])
            .unwrap();
        bubble_test_fiber(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let records = commit.mutation_log().records();
        let apply_records = commit.mutation_apply_log().records();

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].fiber(), parent);
        assert_eq!(
            records[0].kind(),
            HostRootMutationPhaseRecordKind::Placement
        );
        assert_eq!(apply_records.len(), 1);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(apply_records[0].fiber(), parent);
        assert_eq!(
            commit.test_only_host_text_update_apply_count_for_canary(),
            0
        );
        assert!(!commit.has_test_only_host_text_update_apply_for_canary(
            text,
            text,
            text_state_node.raw()
        ));
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_skips_host_component_update_under_new_host_parent_placement_boundary() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(51), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let parent_state_node = StateNodeHandle::from_raw(760);
        let child_state_node = StateNodeHandle::from_raw(761);
        let parent = create_test_fiber(&mut store, FiberTag::HostComponent, 762);
        let child = create_test_fiber(&mut store, FiberTag::HostComponent, 763);
        {
            let node = store.fiber_arena_mut().get_mut(parent).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(parent_state_node);
            node.set_memoized_props(PropsHandle::from_raw(762));
        }
        {
            let node = store.fiber_arena_mut().get_mut(child).unwrap();
            node.set_flags(FiberFlags::UPDATE);
            node.set_state_node(child_state_node);
            node.set_memoized_props(PropsHandle::from_raw(763));
        }
        store
            .fiber_arena_mut()
            .set_children(parent, &[child])
            .unwrap();
        bubble_test_fiber(&mut store, parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[parent])
            .unwrap();
        bubble_test_fiber(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let records = commit.mutation_log().records();
        let apply_records = commit.mutation_apply_log().records();

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].fiber(), parent);
        assert_eq!(
            records[0].kind(),
            HostRootMutationPhaseRecordKind::Placement
        );
        assert_eq!(apply_records.len(), 1);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(apply_records[0].fiber(), parent);
        assert_eq!(
            commit.test_only_host_component_update_apply_count_for_canary(),
            0
        );
        assert!(
            !commit.has_test_only_host_component_update_apply_for_canary(
                child,
                child,
                child_state_node.raw()
            )
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_deletion_cleanup_metadata_in_child_before_parent_order() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let fixture = attach_deletion_metadata_fixture(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let deletion_lists = commit.deletion_lists();
        let apply_records = commit.mutation_apply_log().records();
        let cleanup_log = commit.host_node_deletion_cleanup_log();
        let cleanup_records = cleanup_log.records();

        assert_eq!(deletion_lists.len(), 2);
        assert_eq!(deletion_lists[0].parent(), fixture.first_parent);
        assert_eq!(deletion_lists[0].list(), fixture.first_list);
        assert_eq!(
            deletion_lists[0].deleted(),
            &[
                fixture.second_deleted,
                fixture.first_deleted,
                fixture.nested_deleted_component,
            ]
        );
        assert_eq!(deletion_lists[1].parent(), fixture.second_parent);
        assert_eq!(deletion_lists[1].list(), fixture.second_list);
        assert_eq!(deletion_lists[1].deleted(), &[fixture.third_deleted]);
        assert_eq!(apply_records.len(), 4);
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
            HostRootMutationApplyRecordSource::DeletionList(fixture.first_list)
        );
        assert_eq!(apply_records[2].parent(), fixture.first_parent);
        assert_eq!(
            apply_records[2].kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        );
        assert_eq!(
            apply_records[2].parent_state_node(),
            fixture.first_parent_state_node
        );
        assert_eq!(apply_records[2].fiber(), fixture.nested_deleted_component);
        assert_eq!(
            apply_records[2].state_node(),
            fixture.nested_deleted_component_state_node
        );
        assert_eq!(
            apply_records[3].source(),
            HostRootMutationApplyRecordSource::DeletionList(fixture.second_list)
        );
        assert_eq!(apply_records[3].parent(), fixture.second_parent);
        assert_eq!(
            apply_records[3].parent_state_node(),
            fixture.second_parent_state_node
        );
        assert_eq!(apply_records[3].fiber(), fixture.third_deleted);
        assert_eq!(
            apply_records[3].state_node(),
            fixture.third_deleted_state_node
        );
        assert_eq!(cleanup_log.root(), root_id);
        assert_eq!(cleanup_log.finished_work(), render.finished_work());
        assert_eq!(cleanup_log.len(), 5);
        assert!(!cleanup_log.ref_detach_executed());
        assert!(!cleanup_log.passive_effects_flushed());
        assert!(!cleanup_log.public_unmount_compatibility_claimed());
        assert_eq!(cleanup_records[0].sequence(), 0);
        assert_eq!(cleanup_records[0].deletion_list(), fixture.first_list);
        assert_eq!(cleanup_records[0].deletion_list_index(), 0);
        assert_eq!(cleanup_records[0].deleted_index(), 0);
        assert_eq!(cleanup_records[0].subtree_index(), 0);
        assert_eq!(cleanup_records[0].parent(), fixture.first_parent);
        assert_eq!(cleanup_records[0].parent_tag(), FiberTag::HostComponent);
        assert_eq!(cleanup_records[0].host_parent(), Some(fixture.first_parent));
        assert_eq!(
            cleanup_records[0].host_parent_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(
            cleanup_records[0].host_parent_state_node(),
            fixture.first_parent_state_node
        );
        assert_eq!(cleanup_records[0].host_parent_traversal_depth(), Some(0));
        assert_eq!(cleanup_records[0].deleted_root(), fixture.second_deleted);
        assert_eq!(cleanup_records[0].fiber(), fixture.second_deleted);
        assert_eq!(cleanup_records[0].tag(), FiberTag::HostText);
        assert_eq!(
            cleanup_records[0].state_node(),
            fixture.second_deleted_state_node
        );
        assert_eq!(
            cleanup_records[0].token_phase(),
            HostFiberTokenPhase::Deletion
        );
        assert_eq!(
            cleanup_records[0].token_target(),
            HostFiberTokenTarget::TextInstance
        );
        assert_eq!(cleanup_records[1].sequence(), 1);
        assert_eq!(cleanup_records[1].deletion_list(), fixture.first_list);
        assert_eq!(cleanup_records[1].deletion_list_index(), 0);
        assert_eq!(cleanup_records[1].deleted_index(), 1);
        assert_eq!(cleanup_records[1].subtree_index(), 0);
        assert_eq!(cleanup_records[1].deleted_root(), fixture.first_deleted);
        assert_eq!(cleanup_records[1].fiber(), fixture.first_deleted);
        assert_eq!(
            cleanup_records[1].state_node(),
            fixture.first_deleted_state_node
        );
        assert_eq!(cleanup_records[2].sequence(), 2);
        assert_eq!(cleanup_records[2].deletion_list(), fixture.first_list);
        assert_eq!(cleanup_records[2].deletion_list_index(), 0);
        assert_eq!(cleanup_records[2].deleted_index(), 2);
        assert_eq!(cleanup_records[2].subtree_index(), 0);
        assert_eq!(cleanup_records[2].parent(), fixture.first_parent);
        assert_eq!(
            cleanup_records[2].deleted_root(),
            fixture.nested_deleted_component
        );
        assert_eq!(cleanup_records[2].fiber(), fixture.nested_deleted_text);
        assert_eq!(cleanup_records[2].tag(), FiberTag::HostText);
        assert_eq!(
            cleanup_records[2].state_node(),
            fixture.nested_deleted_text_state_node
        );
        assert_eq!(
            cleanup_records[2].token_target(),
            HostFiberTokenTarget::TextInstance
        );
        assert_eq!(cleanup_records[3].sequence(), 3);
        assert_eq!(cleanup_records[3].deletion_list(), fixture.first_list);
        assert_eq!(cleanup_records[3].deletion_list_index(), 0);
        assert_eq!(cleanup_records[3].deleted_index(), 2);
        assert_eq!(cleanup_records[3].subtree_index(), 1);
        assert_eq!(cleanup_records[3].parent(), fixture.first_parent);
        assert_eq!(
            cleanup_records[3].deleted_root(),
            fixture.nested_deleted_component
        );
        assert_eq!(cleanup_records[3].fiber(), fixture.nested_deleted_component);
        assert_eq!(cleanup_records[3].tag(), FiberTag::HostComponent);
        assert_eq!(
            cleanup_records[3].state_node(),
            fixture.nested_deleted_component_state_node
        );
        assert_eq!(
            cleanup_records[3].token_target(),
            HostFiberTokenTarget::Instance
        );
        assert_eq!(cleanup_records[4].sequence(), 4);
        assert_eq!(cleanup_records[4].deletion_list(), fixture.second_list);
        assert_eq!(cleanup_records[4].deletion_list_index(), 1);
        assert_eq!(cleanup_records[4].deleted_index(), 0);
        assert_eq!(cleanup_records[4].subtree_index(), 0);
        assert_eq!(cleanup_records[4].parent(), fixture.second_parent);
        assert_eq!(cleanup_records[4].deleted_root(), fixture.third_deleted);
        assert_eq!(cleanup_records[4].fiber(), fixture.third_deleted);
        assert_eq!(
            cleanup_records[4].state_node(),
            fixture.third_deleted_state_node
        );
        let refs = commit.ref_commit_metadata();
        let gate = commit.dom_ref_callback_commit_gate();
        assert_eq!(refs.attach().len(), 0);
        assert_eq!(refs.detach().len(), 1);
        assert_eq!(refs.detach()[0].fiber(), fixture.nested_deleted_component);
        assert_eq!(
            refs.detach()[0].state_node(),
            fixture.nested_deleted_component_state_node
        );
        assert_eq!(
            refs.detach()[0].ref_handle(),
            fixture.nested_deleted_component_ref
        );
        assert_eq!(
            refs.detach()[0].detach_reason(),
            Some(HostRootRefDetachReason::Deleted)
        );
        assert_eq!(
            refs.detach()[0].token_phase(),
            HostFiberTokenPhase::Deletion
        );
        assert_eq!(
            refs.detach()[0].token_target(),
            HostFiberTokenTarget::Instance
        );
        store
            .host_tokens()
            .validate(
                refs.detach()[0].token(),
                refs.detach()[0].root(),
                refs.detach()[0].fiber(),
                refs.detach()[0].token_phase(),
                refs.detach()[0].token_target(),
            )
            .unwrap();
        assert_dom_ref_callback_gate_is_inert(gate);
        assert_eq!(gate.len(), 1);
        assert_eq!(gate.records()[0].sequence(), 0);
        assert_eq!(gate.records()[0].fiber(), fixture.nested_deleted_component);
        assert_eq!(gate.records()[0].token(), refs.detach()[0].token());
        assert_eq!(gate.records()[0].action(), HostRootRefCommitAction::Detach);
        assert_eq!(
            gate.records()[0].detach_reason(),
            Some(HostRootRefDetachReason::Deleted)
        );
        for record in cleanup_records {
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
        }
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
    fn root_commit_deletion_cleanup_finds_nearest_host_root_parent_through_function_component() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let host_root_state_node = store.fiber_arena().get(finished_work).unwrap().state_node();
        let fixture =
            attach_function_component_deletion_host_parent_fixture(&mut store, finished_work);

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let deletion_lists = commit.deletion_lists();
        let apply_records = commit.mutation_apply_log().records();
        let cleanup_records = commit.host_node_deletion_cleanup_log().records();

        assert_eq!(deletion_lists.len(), 1);
        assert_eq!(deletion_lists[0].parent(), fixture.owner);
        assert_eq!(deletion_lists[0].list(), fixture.list);
        assert_eq!(
            deletion_lists[0].deleted(),
            &[fixture.deleted_text, fixture.deleted_component]
        );

        assert_eq!(apply_records.len(), 2);
        assert_eq!(
            apply_records[0].source(),
            HostRootMutationApplyRecordSource::DeletionList(fixture.list)
        );
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        );
        assert_eq!(apply_records[0].parent(), finished_work);
        assert_eq!(apply_records[0].parent_tag(), FiberTag::HostRoot);
        assert_eq!(apply_records[0].parent_state_node(), host_root_state_node);
        assert_eq!(apply_records[0].fiber(), fixture.deleted_text);
        assert_eq!(
            apply_records[0].state_node(),
            fixture.deleted_text_state_node
        );
        assert_eq!(
            apply_records[1].kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        );
        assert_eq!(apply_records[1].parent(), finished_work);
        assert_eq!(apply_records[1].parent_tag(), FiberTag::HostRoot);
        assert_eq!(apply_records[1].fiber(), fixture.deleted_component);
        assert_eq!(
            apply_records[1].state_node(),
            fixture.deleted_component_state_node
        );

        assert_eq!(cleanup_records.len(), 3);
        assert_eq!(cleanup_records[0].sequence(), 0);
        assert_eq!(cleanup_records[0].deletion_list_index(), 0);
        assert_eq!(cleanup_records[0].deleted_index(), 0);
        assert_eq!(cleanup_records[0].subtree_index(), 0);
        assert_eq!(cleanup_records[0].parent(), fixture.owner);
        assert_eq!(cleanup_records[0].parent_tag(), FiberTag::FunctionComponent);
        assert_eq!(cleanup_records[0].host_parent(), Some(finished_work));
        assert_eq!(
            cleanup_records[0].host_parent_tag(),
            Some(FiberTag::HostRoot)
        );
        assert_eq!(
            cleanup_records[0].host_parent_state_node(),
            host_root_state_node
        );
        assert_eq!(cleanup_records[0].host_parent_traversal_depth(), Some(1));
        assert_eq!(cleanup_records[0].deleted_root(), fixture.deleted_text);
        assert_eq!(cleanup_records[0].fiber(), fixture.deleted_text);
        assert_eq!(cleanup_records[0].tag(), FiberTag::HostText);

        assert_eq!(cleanup_records[1].sequence(), 1);
        assert_eq!(cleanup_records[1].deleted_index(), 1);
        assert_eq!(cleanup_records[1].subtree_index(), 0);
        assert_eq!(cleanup_records[1].parent(), fixture.owner);
        assert_eq!(cleanup_records[1].host_parent(), Some(finished_work));
        assert_eq!(cleanup_records[1].host_parent_traversal_depth(), Some(1));
        assert_eq!(cleanup_records[1].deleted_root(), fixture.deleted_component);
        assert_eq!(cleanup_records[1].fiber(), fixture.nested_text);
        assert_eq!(cleanup_records[1].tag(), FiberTag::HostText);
        assert_eq!(
            cleanup_records[1].state_node(),
            fixture.nested_text_state_node
        );

        assert_eq!(cleanup_records[2].sequence(), 2);
        assert_eq!(cleanup_records[2].deleted_index(), 1);
        assert_eq!(cleanup_records[2].subtree_index(), 1);
        assert_eq!(cleanup_records[2].parent(), fixture.owner);
        assert_eq!(cleanup_records[2].host_parent(), Some(finished_work));
        assert_eq!(cleanup_records[2].host_parent_traversal_depth(), Some(1));
        assert_eq!(cleanup_records[2].deleted_root(), fixture.deleted_component);
        assert_eq!(cleanup_records[2].fiber(), fixture.deleted_component);
        assert_eq!(cleanup_records[2].tag(), FiberTag::HostComponent);
        assert_eq!(
            cleanup_records[2].state_node(),
            fixture.deleted_component_state_node
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_deletion_host_parent_traversal_keeps_fragment_and_portal_blocked() {
        for blocker_tag in [FiberTag::Fragment, FiberTag::Portal] {
            let (mut store, root_id, host) = root_store();
            update_container(&mut store, root_id, RootElementHandle::from_raw(47), None).unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let owner = create_test_fiber(&mut store, blocker_tag, 501);
            let deleted_text = create_test_fiber(&mut store, FiberTag::HostText, 502);
            let deleted_text_state_node = StateNodeHandle::from_raw(8502);
            store
                .fiber_arena_mut()
                .get_mut(deleted_text)
                .unwrap()
                .set_state_node(deleted_text_state_node);
            store
                .fiber_arena_mut()
                .set_children(owner, &[deleted_text])
                .unwrap();
            store
                .fiber_arena_mut()
                .set_children(render.finished_work(), &[owner])
                .unwrap();
            let list = store
                .fiber_arena_mut()
                .mark_child_for_deletion(owner, deleted_text)
                .unwrap();
            bubble_test_fiber(&mut store, render.finished_work());

            let commit = commit_finished_host_root(&mut store, render).unwrap();
            let apply_records = commit.mutation_apply_log().records();
            let cleanup_records = commit.host_node_deletion_cleanup_log().records();

            assert_eq!(commit.deletion_lists().len(), 1);
            assert_eq!(commit.deletion_lists()[0].parent(), owner);
            assert_eq!(commit.deletion_lists()[0].list(), list);
            assert_eq!(apply_records.len(), 1);
            assert_eq!(
                apply_records[0].kind(),
                HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
            );
            assert_eq!(apply_records[0].parent(), owner);
            assert_eq!(apply_records[0].parent_tag(), blocker_tag);
            assert_eq!(apply_records[0].fiber(), deleted_text);
            assert_eq!(cleanup_records.len(), 1);
            assert_eq!(cleanup_records[0].parent(), owner);
            assert_eq!(cleanup_records[0].parent_tag(), blocker_tag);
            assert_eq!(cleanup_records[0].host_parent(), None);
            assert_eq!(cleanup_records[0].host_parent_tag(), None);
            assert_eq!(
                cleanup_records[0].host_parent_state_node(),
                StateNodeHandle::NONE
            );
            assert_eq!(cleanup_records[0].host_parent_traversal_depth(), None);
            assert_eq!(cleanup_records[0].fiber(), deleted_text);
            assert_eq!(cleanup_records[0].state_node(), deleted_text_state_node);
            assert_eq!(host.operations(), Vec::<&'static str>::new());
        }
    }

    #[test]
    fn root_commit_deletion_subtree_traversal_gate_records_fragment_and_portal_deleted_roots() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(49), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let owner = create_test_fiber(&mut store, FiberTag::HostComponent, 9_500);
        let fragment = create_test_fiber(&mut store, FiberTag::Fragment, 9_501);
        let fragment_text = create_test_fiber(&mut store, FiberTag::HostText, 9_502);
        let portal = create_test_fiber(&mut store, FiberTag::Portal, 9_503);
        let portal_host = create_test_fiber(&mut store, FiberTag::HostComponent, 9_504);
        let portal_text = create_test_fiber(&mut store, FiberTag::HostText, 9_505);
        let owner_state_node = StateNodeHandle::from_raw(9_600);
        let fragment_text_state_node = StateNodeHandle::from_raw(9_601);
        let portal_container_state_node = StateNodeHandle::from_raw(9_602);
        let portal_host_state_node = StateNodeHandle::from_raw(9_603);
        let portal_text_state_node = StateNodeHandle::from_raw(9_604);

        {
            let node = store.fiber_arena_mut().get_mut(owner).unwrap();
            node.set_state_node(owner_state_node);
            node.set_memoized_props(PropsHandle::from_raw(9_500));
        }
        store
            .fiber_arena_mut()
            .get_mut(fragment_text)
            .unwrap()
            .set_state_node(fragment_text_state_node);
        {
            let node = store.fiber_arena_mut().get_mut(portal).unwrap();
            node.set_state_node(portal_container_state_node);
            node.set_memoized_props(PropsHandle::from_raw(9_503));
        }
        {
            let node = store.fiber_arena_mut().get_mut(portal_host).unwrap();
            node.set_state_node(portal_host_state_node);
            node.set_memoized_props(PropsHandle::from_raw(9_504));
        }
        store
            .fiber_arena_mut()
            .get_mut(portal_text)
            .unwrap()
            .set_state_node(portal_text_state_node);
        store
            .fiber_arena_mut()
            .set_children(fragment, &[fragment_text])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(portal_host, &[portal_text])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(portal, &[portal_host])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(owner, &[fragment, portal])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[owner])
            .unwrap();
        let deletion_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(owner, fragment)
            .unwrap();
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(owner, portal)
            .unwrap();
        bubble_test_fiber(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let apply_records = commit.mutation_apply_log().records();
        let cleanup_records = commit.host_node_deletion_cleanup_log().records();
        let gate = commit.deletion_subtree_traversal_gate_for_canary();
        let traversal_records = gate.records();

        assert_eq!(commit.deletion_lists().len(), 1);
        assert_eq!(commit.deletion_lists()[0].list(), deletion_list);
        assert_eq!(commit.deletion_lists()[0].deleted(), &[fragment, portal]);
        assert_eq!(apply_records.len(), 2);
        assert_eq!(
            apply_records[0].kind(),
            HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
        );
        assert_eq!(apply_records[0].fiber(), fragment);
        assert_eq!(
            apply_records[1].kind(),
            HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
        );
        assert_eq!(apply_records[1].fiber(), portal);

        assert_eq!(cleanup_records.len(), 3);
        assert_eq!(cleanup_records[0].deleted_root(), fragment);
        assert_eq!(cleanup_records[0].fiber(), fragment_text);
        assert_eq!(cleanup_records[0].subtree_index(), 0);
        assert_eq!(cleanup_records[0].host_parent(), Some(owner));
        assert_eq!(
            cleanup_records[0].host_parent_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(cleanup_records[1].deleted_root(), portal);
        assert_eq!(cleanup_records[1].fiber(), portal_text);
        assert_eq!(cleanup_records[1].subtree_index(), 0);
        assert_eq!(cleanup_records[1].host_parent(), Some(owner));
        assert_eq!(cleanup_records[2].deleted_root(), portal);
        assert_eq!(cleanup_records[2].fiber(), portal_host);
        assert_eq!(cleanup_records[2].subtree_index(), 1);
        assert_eq!(cleanup_records[2].host_parent(), Some(owner));

        assert_eq!(gate.len(), 5);
        assert_eq!(gate.fragment_deleted_subtree_count(), 1);
        assert_eq!(gate.portal_deleted_subtree_count(), 1);
        assert_eq!(gate.host_node_cleanup_metadata_count(), 3);
        assert_eq!(gate.unsupported_traversal_count(), 0);
        assert!(!gate.real_fragment_dom_mutation_executed());
        assert!(!gate.real_portal_dom_mutation_executed());
        assert!(!gate.broad_deletion_traversal_enabled());
        assert!(!gate.public_unmount_compatibility_claimed());

        assert_eq!(traversal_records[0].sequence(), 0);
        assert_eq!(
            traversal_records[0].status(),
            HostRootDeletionSubtreeTraversalGateStatus::FragmentDeletedSubtreeDiagnostic
        );
        assert_eq!(
            traversal_records[0].status_name(),
            "fragment-deleted-subtree-diagnostic"
        );
        assert_eq!(traversal_records[0].deleted_root(), fragment);
        assert_eq!(traversal_records[0].fiber(), fragment);
        assert_eq!(traversal_records[0].tag_name(), "Fragment");
        assert_eq!(traversal_records[0].traversal_depth(), 0);
        assert_eq!(
            traversal_records[1].status(),
            HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata
        );
        assert_eq!(traversal_records[1].deleted_root(), fragment);
        assert_eq!(traversal_records[1].fiber(), fragment_text);
        assert_eq!(traversal_records[1].tag_name(), "HostText");
        assert_eq!(traversal_records[1].traversal_depth(), 1);
        assert_eq!(traversal_records[1].state_node(), fragment_text_state_node);
        assert_eq!(
            traversal_records[2].status(),
            HostRootDeletionSubtreeTraversalGateStatus::PortalDeletedSubtreeDiagnostic
        );
        assert_eq!(
            traversal_records[2].status_name(),
            "portal-deleted-subtree-diagnostic"
        );
        assert_eq!(traversal_records[2].deleted_root(), portal);
        assert_eq!(traversal_records[2].fiber(), portal);
        assert_eq!(traversal_records[2].tag_name(), "Portal");
        assert_eq!(
            traversal_records[2].portal_container_state_node(),
            portal_container_state_node
        );
        assert_eq!(
            traversal_records[3].status(),
            HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata
        );
        assert_eq!(traversal_records[3].fiber(), portal_text);
        assert_eq!(traversal_records[3].traversal_depth(), 2);
        assert_eq!(
            traversal_records[3].portal_container_state_node(),
            portal_container_state_node
        );
        assert_eq!(
            traversal_records[4].status(),
            HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata
        );
        assert_eq!(traversal_records[4].fiber(), portal_host);
        assert_eq!(traversal_records[4].traversal_depth(), 1);
        assert_eq!(
            traversal_records[4].portal_container_state_node(),
            portal_container_state_node
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_deletion_subtree_traversal_gate_blocks_suspense_and_offscreen_roots() {
        for (blocked_tag, expected_status, expected_feature) in [
            (
                FiberTag::Suspense,
                HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked,
                SUSPENSE_UNSUPPORTED_FEATURE,
            ),
            (
                FiberTag::Offscreen,
                HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked,
                OFFSCREEN_UNSUPPORTED_FEATURE,
            ),
        ] {
            let (mut store, root_id, host) = root_store();
            update_container(&mut store, root_id, RootElementHandle::from_raw(50), None).unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let owner = create_test_fiber(&mut store, FiberTag::HostComponent, 9_700);
            let blocked = create_test_fiber(&mut store, blocked_tag, 9_701);
            let blocked_child = create_test_fiber(&mut store, FiberTag::HostText, 9_702);
            let owner_state_node = StateNodeHandle::from_raw(9_710);
            let blocked_child_state_node = StateNodeHandle::from_raw(9_711);

            store
                .fiber_arena_mut()
                .get_mut(owner)
                .unwrap()
                .set_state_node(owner_state_node);
            store
                .fiber_arena_mut()
                .get_mut(blocked_child)
                .unwrap()
                .set_state_node(blocked_child_state_node);
            store
                .fiber_arena_mut()
                .set_children(blocked, &[blocked_child])
                .unwrap();
            store
                .fiber_arena_mut()
                .set_children(owner, &[blocked])
                .unwrap();
            store
                .fiber_arena_mut()
                .set_children(render.finished_work(), &[owner])
                .unwrap();
            let deletion_list = store
                .fiber_arena_mut()
                .mark_child_for_deletion(owner, blocked)
                .unwrap();
            bubble_test_fiber(&mut store, render.finished_work());

            let commit = commit_finished_host_root(&mut store, render).unwrap();
            let apply_records = commit.mutation_apply_log().records();
            let cleanup_records = commit.host_node_deletion_cleanup_log().records();
            let gate = commit.deletion_subtree_traversal_gate_for_canary();
            let records = gate.records();

            assert_eq!(commit.deletion_lists().len(), 1);
            assert_eq!(commit.deletion_lists()[0].list(), deletion_list);
            assert_eq!(commit.deletion_lists()[0].deleted(), &[blocked]);
            assert_eq!(apply_records.len(), 1);
            assert_eq!(
                apply_records[0].kind(),
                HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
            );
            assert_eq!(apply_records[0].fiber(), blocked);
            assert!(cleanup_records.is_empty());

            assert_eq!(gate.len(), 1);
            assert_eq!(gate.host_node_cleanup_metadata_count(), 0);
            assert_eq!(gate.unsupported_traversal_count(), 1);
            assert_eq!(
                gate.unsupported_suspense_traversal_count(),
                usize::from(blocked_tag == FiberTag::Suspense)
            );
            assert_eq!(
                gate.unsupported_offscreen_traversal_count(),
                usize::from(blocked_tag == FiberTag::Offscreen)
            );
            assert_eq!(gate.broad_traversal_blocked_count(), 0);
            assert!(!gate.broad_deletion_traversal_enabled());
            assert!(!gate.public_unmount_compatibility_claimed());

            assert_eq!(records[0].status(), expected_status);
            assert_eq!(records[0].deleted_root(), blocked);
            assert_eq!(records[0].deleted_root_tag(), blocked_tag);
            assert_eq!(records[0].fiber(), blocked);
            assert_eq!(records[0].tag(), blocked_tag);
            assert_eq!(records[0].traversal_depth(), 0);
            assert_eq!(records[0].unsupported_feature(), Some(expected_feature));
            assert_eq!(records[0].host_parent(), Some(owner));
            assert_eq!(records[0].host_parent_tag(), Some(FiberTag::HostComponent));
            assert_eq!(records[0].host_parent_state_node(), owner_state_node);
            assert_eq!(records[0].host_parent_traversal_depth(), Some(0));
            assert_eq!(host.operations(), Vec::<&'static str>::new());
        }
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
    fn root_commit_recovery_snapshot_preserves_failed_root_lane_and_callback_metadata() {
        let (mut store, root_id, host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(450);
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(4500),
            Some(callback),
        )
        .unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let fixture = attach_deletion_metadata_fixture(&mut store, render.finished_work());
        let parent_node = store
            .fiber_arena_mut()
            .get_mut(fixture.first_parent)
            .unwrap();
        parent_node.set_flags(parent_node.flags() - FiberFlags::CHILD_DELETION);
        let before = host_root_commit_recovery_snapshot_for_canary(&store, render).unwrap();

        let error = commit_finished_host_root(&mut store, render).unwrap_err();
        let after = host_root_commit_recovery_snapshot_for_canary(&store, render).unwrap();

        assert!(matches!(
            error,
            RootCommitError::FiberTopology(FiberTopologyError::DeletionListMissingFlag {
                parent,
                list,
            }) if parent == fixture.first_parent && list == fixture.first_list
        ));
        assert_eq!(before.root(), root_id);
        assert_eq!(before.current(), previous_current);
        assert_eq!(before.render_lanes(), Lanes::DEFAULT);
        assert_eq!(before.pending_lanes(), pending_lanes);
        assert_eq!(
            before.callback_queue(),
            render.work_in_progress_update_queue()
        );
        assert_eq!(before.visible_callback_count(), 1);
        assert_eq!(before.hidden_callback_count(), 0);
        assert_eq!(before.deferred_hidden_callback_count(), 0);
        assert_eq!(
            callback_handles(before.root_update_callbacks().visible()),
            vec![callback]
        );
        assert!(after.preserves_lane_and_callback_metadata_from(&before));
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            pending_lanes
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
        assert!(commit.ref_callback_execution_handoff().is_empty());
        assert!(commit.ref_cleanup_return_execution_gate().is_empty());
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
        assert_eq!(queued_effect.create(), callback(716));
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
        assert_eq!(phase_records[0].create(), None);
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
        assert_eq!(phase_records[1].create(), Some(callback(716)));
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
    fn root_commit_persists_function_component_effect_queue_without_passive_handoff_metadata() {
        let (mut store, root_id, host) = root_store();
        let current_root = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(720);
        let current_function = append_function_component_child(
            &mut store,
            current_root,
            PropsHandle::from_raw(721),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous_changed = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(722),
                deps(723),
                Some(callback(724)),
            )
            .unwrap();
        let previous_unchanged = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(725),
                deps(726),
                Some(callback(727)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(46), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_function = append_function_component_child(
            &mut store,
            render.finished_work(),
            PropsHandle::from_raw(728),
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
        let changed = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(729),
                deps(730),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        let unchanged = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(731),
                deps(726),
                FunctionComponentEffectDependencyStatus::Unchanged,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        assert_eq!(commit.pending_passive_handoff(), None);
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .pending_passive()
                .is_empty()
        );

        let committed = commit_function_component_effect_queues_for_committed_root(
            &store,
            root_id,
            &mut hook_store,
            Lanes::DEFAULT,
        )
        .unwrap();

        assert_eq!(committed.len(), 1);
        let queue = &committed[0];
        assert_eq!(queue.fiber(), finished_function);
        assert_eq!(queue.phase(), FunctionComponentHookRenderPhase::Update);
        assert_eq!(queue.hook_list(), state.work_in_progress_list());
        assert_eq!(queue.lanes(), Lanes::DEFAULT);
        assert_eq!(queue.len(), 2);
        assert_eq!(queue.accepted_passive_count(), 1);
        assert_eq!(
            hook_store.current_list(finished_function),
            Some(state.work_in_progress_list())
        );
        assert_eq!(
            hook_store.committed_effect_queue(finished_function),
            Some(queue)
        );

        let records = queue.records();
        assert_eq!(
            records[0].previous_effect(),
            Some(previous_changed.effect())
        );
        assert_eq!(records[0].effect(), changed.effect());
        assert_eq!(records[0].destroy(), Some(callback(724)));
        assert!(records[0].accepted_for_pending_passive());
        assert_eq!(
            records[1].previous_effect(),
            Some(previous_unchanged.effect())
        );
        assert_eq!(records[1].effect(), unchanged.effect());
        assert_eq!(records[1].destroy(), Some(callback(727)));
        assert!(!records[1].accepted_for_pending_passive());

        let firing_passive = hook_store
            .committed_passive_effect_metadata(finished_function, HookEffectFlags::PASSIVE_EFFECT);
        assert_eq!(firing_passive.len(), 1);
        assert_eq!(firing_passive[0].effect(), changed.effect());
        assert_eq!(firing_passive[0].destroy(), Some(callback(724)));
        let all_passive = hook_store
            .committed_passive_effect_metadata(finished_function, HookEffectFlags::PASSIVE);
        assert_eq!(all_passive.len(), 2);
        assert_eq!(all_passive[0].effect(), changed.effect());
        assert_eq!(all_passive[1].effect(), unchanged.effect());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_committed_passive_execution_gate_runs_callbacks_under_test_control() {
        let (mut store, root_id, host) = root_store();
        let current_root = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(732);
        let current_function = append_function_component_child(
            &mut store,
            current_root,
            PropsHandle::from_raw(733),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(734),
                deps(735),
                Some(callback(736)),
            )
            .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(49), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(737),
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
                callback(738),
                deps(739),
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
        let committed = commit
            .record_function_component_committed_passive_effects_for_canary(std::slice::from_ref(
                &queued,
            ))
            .unwrap();
        assert_eq!(committed.fiber_count(), 1);
        assert_eq!(committed.fibers()[0].fiber(), finished_function);
        assert_eq!(committed.queued_unmount_count(), 1);
        assert_eq!(committed.queued_mount_count(), 1);

        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut control =
            TestPassiveEffectCallbackControl::default().with_returned_destroy(callback(740));

        let execution =
            execute_passive_effect_callbacks_after_commit_from_committed_fiber_effects_under_test_control_for_canary(
                &mut store,
                &commit,
                &mut control,
            )
            .unwrap();

        assert_eq!(execution.root(), root_id);
        assert_eq!(execution.finished_work(), Some(finished_work));
        assert_eq!(execution.lanes(), Lanes::DEFAULT);
        assert_eq!(execution.flush_status(), PassiveEffectsFlushStatus::Flushed);
        assert_eq!(execution.flush_record_count(), 2);
        assert_eq!(execution.skipped_flush_records_without_callbacks(), 0);
        assert_eq!(execution.len(), 2);
        assert_eq!(execution.completed_count(), 2);
        assert_eq!(execution.error_count(), 0);
        assert!(!execution.has_errors());
        assert_eq!(
            execution.status(),
            PassiveEffectCallbackInvocationGateStatus::TestControlOnly
        );
        assert_eq!(
            execution.blockers(),
            &PASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
        );
        assert!(!execution.public_effect_execution_enabled());
        assert!(!execution.public_act_compatibility_claimed());
        assert!(!execution.scheduler_driven_passive_execution_enabled());

        let records = execution.records();
        assert_eq!(records[0].invocation_order(), 0);
        assert_eq!(records[1].invocation_order(), 1);
        assert_eq!(
            records[0].kind(),
            PassiveEffectCallbackInvocationKind::Destroy
        );
        assert_eq!(
            records[1].kind(),
            PassiveEffectCallbackInvocationKind::Create
        );
        assert_eq!(
            records[0].status(),
            PassiveEffectCallbackInvocationStatus::Completed
        );
        assert_eq!(
            records[1].status(),
            PassiveEffectCallbackInvocationStatus::Completed
        );
        assert_eq!(
            records[0].pending_order(),
            queued_effect.unmount_order().unwrap()
        );
        assert_eq!(records[1].pending_order(), queued_effect.mount_order());
        assert!(records[0].pending_order() < records[1].pending_order());
        assert_eq!(records[0].fiber(), finished_function);
        assert_eq!(records[1].fiber(), finished_function);
        assert_eq!(records[0].effect(), registration.effect());
        assert_eq!(records[1].effect(), registration.effect());
        assert_eq!(records[0].instance(), previous.instance());
        assert_eq!(records[1].instance(), registration.instance());
        assert_eq!(records[0].callback(), callback(736));
        assert_eq!(records[1].callback(), callback(738));
        assert_eq!(records[0].returned_destroy(), None);
        assert_eq!(records[1].returned_destroy(), Some(callback(740)));

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
    fn root_commit_records_layout_effect_handoff_in_react_order_without_callbacks() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(47), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mode = store
            .fiber_arena()
            .get(render.finished_work())
            .unwrap()
            .mode();
        let parent = create_function_component_fiber(
            &mut store,
            mode,
            PropsHandle::from_raw(740),
            FiberTypeHandle::from_raw(741),
        );
        let child = create_function_component_fiber(
            &mut store,
            mode,
            PropsHandle::from_raw(742),
            FiberTypeHandle::from_raw(743),
        );
        let sibling = create_function_component_fiber(
            &mut store,
            mode,
            PropsHandle::from_raw(744),
            FiberTypeHandle::from_raw(745),
        );
        store
            .fiber_arena_mut()
            .set_children(parent, &[child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[parent, sibling])
            .unwrap();

        let mut hook_store = FunctionComponentHookRenderStore::new();
        let parent_state = hook_store
            .prepare_render_state(store.fiber_arena(), parent)
            .unwrap();
        let mut parent_cursor = hook_store.begin_render_cursor(parent_state).unwrap();
        let parent_layout = hook_store
            .mount_effect_metadata(
                store.fiber_arena_mut(),
                &mut parent_cursor,
                FunctionComponentEffectPhase::Layout,
                callback(746),
                deps(747),
            )
            .unwrap();
        let parent_passive = hook_store
            .mount_effect_metadata(
                store.fiber_arena_mut(),
                &mut parent_cursor,
                FunctionComponentEffectPhase::Passive,
                callback(748),
                deps(749),
            )
            .unwrap();
        hook_store.finish_render_cursor(parent_cursor).unwrap();

        let child_state = hook_store
            .prepare_render_state(store.fiber_arena(), child)
            .unwrap();
        let mut child_cursor = hook_store.begin_render_cursor(child_state).unwrap();
        let child_layout = hook_store
            .mount_effect_metadata(
                store.fiber_arena_mut(),
                &mut child_cursor,
                FunctionComponentEffectPhase::Layout,
                callback(750),
                deps(751),
            )
            .unwrap();
        hook_store.finish_render_cursor(child_cursor).unwrap();

        let sibling_state = hook_store
            .prepare_render_state(store.fiber_arena(), sibling)
            .unwrap();
        let mut sibling_cursor = hook_store.begin_render_cursor(sibling_state).unwrap();
        let sibling_layout = hook_store
            .mount_effect_metadata(
                store.fiber_arena_mut(),
                &mut sibling_cursor,
                FunctionComponentEffectPhase::Layout,
                callback(752),
                deps(753),
            )
            .unwrap();
        hook_store.finish_render_cursor(sibling_cursor).unwrap();

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        assert!(commit.function_component_layout_effects().is_empty());
        let snapshot = commit
            .record_function_component_layout_effects_for_canary(&store, &mut hook_store)
            .unwrap()
            .clone();

        assert_eq!(snapshot.len(), 3);
        assert_eq!(snapshot.destroy_count(), 0);
        assert_eq!(snapshot.create_count(), 3);
        assert_eq!(snapshot.phase_records().len(), 3);
        assert!(!snapshot.layout_callbacks_invoked());
        assert!(!snapshot.dom_mutation_side_effects_performed());
        assert!(!snapshot.refs_attached_or_detached());
        assert!(!snapshot.public_effect_compatibility_claimed());
        assert_eq!(commit.function_component_layout_effects(), &snapshot);
        let records = snapshot.records();
        assert_eq!(records[0].commit_order(), 0);
        assert_eq!(records[0].destroy_order(), None);
        assert_eq!(records[0].create_order(), 0);
        assert_eq!(records[0].fiber(), child);
        assert_eq!(
            records[0].render_phase(),
            FunctionComponentHookRenderPhase::Mount
        );
        assert_eq!(
            records[0].dependency_phase(),
            FunctionComponentEffectDependencyPhase::Mount
        );
        assert_eq!(records[0].hook_list(), child_state.work_in_progress_list());
        assert_eq!(records[0].effect_index(), 0);
        assert_eq!(records[0].effect(), child_layout.effect());
        assert_eq!(records[0].previous_effect(), None);
        assert_eq!(records[0].instance(), child_layout.instance());
        assert_eq!(records[0].tag(), HookEffectFlags::LAYOUT_EFFECT);
        assert_eq!(records[0].create(), callback(750));
        assert_eq!(records[0].destroy(), None);
        assert_eq!(records[0].previous_dependencies(), None);
        assert_eq!(records[0].dependencies(), deps(751));
        assert_eq!(records[0].dependency_status(), None);
        assert_eq!(records[0].lanes(), Lanes::DEFAULT);
        let phase_records = snapshot.phase_records();
        assert_eq!(
            phase_records[0].handoff(),
            FunctionComponentLayoutEffectHandoff::Create
        );
        assert_eq!(
            phase_records[0].commit_phase(),
            FunctionComponentLayoutEffectCommitPhase::Layout
        );
        assert_eq!(phase_records[0].order(), 0);
        assert_eq!(phase_records[0].source_commit_order(), 0);
        assert_eq!(phase_records[0].create(), Some(callback(750)));
        assert_eq!(phase_records[0].destroy(), None);

        assert_eq!(records[1].commit_order(), 1);
        assert_eq!(records[1].create_order(), 1);
        assert_eq!(records[1].fiber(), parent);
        assert_eq!(records[1].effect(), parent_layout.effect());
        assert_eq!(records[1].create(), callback(746));
        assert_eq!(records[1].dependencies(), deps(747));
        assert_eq!(records[2].commit_order(), 2);
        assert_eq!(records[2].create_order(), 2);
        assert_eq!(records[2].fiber(), sibling);
        assert_eq!(records[2].effect(), sibling_layout.effect());
        assert_eq!(records[2].create(), callback(752));
        assert_eq!(records[2].dependencies(), deps(753));

        let parent_queue = hook_store.committed_effect_queue(parent).unwrap();
        assert_eq!(parent_queue.accepted_layout_count(), 1);
        assert_eq!(parent_queue.accepted_passive_count(), 1);
        assert_eq!(parent_queue.records()[1].effect(), parent_passive.effect());
        assert_eq!(commit.pending_passive_handoff(), None);
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
    fn root_commit_rejects_stale_layout_effect_handoff_lanes_without_callbacks() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(147), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mode = store
            .fiber_arena()
            .get(render.finished_work())
            .unwrap()
            .mode();
        let function = create_function_component_fiber(
            &mut store,
            mode,
            PropsHandle::from_raw(148),
            FiberTypeHandle::from_raw(149),
        );
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[function])
            .unwrap();

        let mut hook_store = FunctionComponentHookRenderStore::new();
        let state = hook_store
            .prepare_render_state(store.fiber_arena(), function)
            .unwrap();
        let mut cursor = hook_store.begin_render_cursor(state).unwrap();
        hook_store
            .mount_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Layout,
                callback(150),
                deps(151),
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();
        let stale_queue = hook_store
            .commit_pending_effect_queue_for_fiber(function, Lanes::SYNC)
            .unwrap()
            .unwrap();
        assert_eq!(stale_queue.lanes(), Lanes::SYNC);

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let error = commit
            .record_function_component_layout_effects_for_canary(&store, &mut hook_store)
            .unwrap_err();

        assert!(
            matches!(
                error,
                RootCommitError::LayoutEffectHandoffLanesMismatch {
                    root,
                    fiber,
                    expected,
                    actual,
                } if root == root_id
                    && fiber == function
                    && expected == Lanes::DEFAULT
                    && actual == Lanes::SYNC
            ),
            "unexpected error: {error:?}"
        );
        assert!(commit.function_component_layout_effects().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_private_effect_metadata_in_deterministic_commit_order_without_execution()
    {
        let (mut store, root_id, host) = root_store();
        let current_root = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(760);
        let current_function = append_function_component_child(
            &mut store,
            current_root,
            PropsHandle::from_raw(761),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous_layout = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Layout,
                callback(762),
                deps(763),
                Some(callback(764)),
            )
            .unwrap();
        let previous_passive = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(765),
                deps(766),
                Some(callback(767)),
            )
            .unwrap();
        bubble_test_fiber(&mut store, current_function);
        bubble_test_fiber(&mut store, current_root);

        let root_callback = RootUpdateCallbackHandle::from_raw(768);
        let root_update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(769),
            Some(root_callback),
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(770),
            component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(current_function, finished_function)
            .unwrap();
        let ref_child = append_host_ref_child(
            &mut store,
            finished_function,
            RefHandle::from_raw(771),
            StateNodeHandle::from_raw(772),
            FiberFlags::REF,
        );

        let deletion_parent = create_test_fiber(&mut store, FiberTag::HostComponent, 773);
        let deleted_text = create_test_fiber(&mut store, FiberTag::HostText, 774);
        let deletion_parent_state_node = StateNodeHandle::from_raw(775);
        let deleted_text_state_node = StateNodeHandle::from_raw(776);
        {
            let node = store.fiber_arena_mut().get_mut(deletion_parent).unwrap();
            node.set_state_node(deletion_parent_state_node);
            node.set_memoized_props(PropsHandle::from_raw(773));
        }
        {
            let node = store.fiber_arena_mut().get_mut(deleted_text).unwrap();
            node.set_state_node(deleted_text_state_node);
            node.set_memoized_props(PropsHandle::from_raw(774));
        }
        store
            .fiber_arena_mut()
            .set_children(deletion_parent, &[deleted_text])
            .unwrap();
        let deletion_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(deletion_parent, deleted_text)
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(finished_work, &[finished_function, deletion_parent])
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
                callback(777),
                deps(778),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        let passive = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(779),
                deps(780),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();

        let queued_passive = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();
        bubble_test_fiber(&mut store, ref_child);
        bubble_test_fiber(&mut store, finished_function);
        bubble_test_fiber(&mut store, deletion_parent);
        bubble_test_fiber(&mut store, finished_work);

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let layout_snapshot = commit
            .record_function_component_layout_effects_for_canary(&store, &mut hook_store)
            .unwrap()
            .clone();
        let passive_snapshot = commit
            .record_function_component_committed_passive_effects_for_canary(&[queued_passive])
            .unwrap()
            .clone();
        let diagnostics = commit.commit_order_diagnostics_for_canary();
        let records = diagnostics.records();

        assert_eq!(commit.deletion_lists().len(), 1);
        assert_eq!(commit.deletion_lists()[0].list(), deletion_list);
        assert_eq!(commit.deletion_lists()[0].deleted(), &[deleted_text]);
        assert_eq!(commit.host_node_deletion_cleanup_log().len(), 1);
        assert_eq!(commit.ref_callback_execution_handoff().len(), 1);
        assert_eq!(layout_snapshot.len(), 1);
        assert_eq!(layout_snapshot.destroy_count(), 1);
        assert_eq!(layout_snapshot.create_count(), 1);
        assert_eq!(layout_snapshot.phase_records().len(), 2);
        assert_eq!(passive_snapshot.phase_records().len(), 2);
        assert_eq!(commit.root_update_callback_invocation_gate().len(), 1);
        assert_eq!(diagnostics.len(), 7);
        assert!(!diagnostics.public_effects_invoked());
        assert!(!diagnostics.host_containers_mutated());
        assert_eq!(
            records
                .iter()
                .map(|record| record.sequence())
                .collect::<Vec<_>>(),
            vec![0, 1, 2, 3, 4, 5, 6]
        );
        assert_eq!(
            records
                .iter()
                .map(|record| record.phase_name())
                .collect::<Vec<_>>(),
            vec![
                "mutation", "mutation", "layout", "layout", "layout", "passive", "passive"
            ]
        );
        assert_eq!(
            records
                .iter()
                .map(|record| record.metadata_kind_name())
                .collect::<Vec<_>>(),
            vec![
                "deletion-cleanup",
                "layout-effect-destroy",
                "ref-attach",
                "layout-effect-create",
                "root-update-callback",
                "passive-unmount",
                "passive-mount",
            ]
        );

        assert_eq!(records[0].fiber(), deleted_text);
        assert_eq!(records[0].tag_name(), "HostText");
        assert_eq!(records[0].source_order(), 0);
        assert_eq!(records[1].fiber(), finished_function);
        assert_eq!(records[1].tag_name(), "FunctionComponent");
        assert_eq!(records[1].source_order(), 0);
        assert_eq!(records[2].fiber(), ref_child);
        assert_eq!(records[2].tag_name(), "HostComponent");
        assert_eq!(records[2].source_order(), 0);
        assert_eq!(records[3].fiber(), finished_function);
        assert_eq!(records[3].tag_name(), "FunctionComponent");
        assert_eq!(records[3].source_order(), 0);
        assert_eq!(records[4].fiber(), finished_work);
        assert_eq!(records[4].tag_name(), "HostRoot");
        assert_eq!(records[4].source_order(), 0);
        assert_eq!(records[5].fiber(), finished_function);
        assert_eq!(records[5].tag_name(), "FunctionComponent");
        assert!(records[5].source_order() < records[6].source_order());
        assert_eq!(records[6].fiber(), finished_function);
        assert_eq!(records[6].tag_name(), "FunctionComponent");

        assert!(!layout_snapshot.layout_callbacks_invoked());
        assert!(!layout_snapshot.dom_mutation_side_effects_performed());
        assert!(!layout_snapshot.refs_attached_or_detached());
        assert!(!layout_snapshot.public_effect_compatibility_claimed());
        assert_eq!(layout_snapshot.records()[0].effect(), layout.effect());
        assert_eq!(
            layout_snapshot.records()[0].previous_effect(),
            Some(previous_layout.effect())
        );
        assert_eq!(
            layout_snapshot.records()[0].instance(),
            previous_layout.instance()
        );
        assert_eq!(
            layout_snapshot.records()[0].dependency_phase(),
            FunctionComponentEffectDependencyPhase::UpdateChanged
        );
        assert_eq!(
            layout_snapshot.records()[0].previous_dependencies(),
            Some(deps(763))
        );
        assert_eq!(layout_snapshot.records()[0].dependencies(), deps(778));
        assert_eq!(layout_snapshot.records()[0].create(), callback(777));
        assert_eq!(layout_snapshot.records()[0].destroy(), Some(callback(764)));
        assert_eq!(layout_snapshot.records()[0].destroy_order(), Some(0));
        assert_eq!(layout_snapshot.records()[0].create_order(), 0);
        let layout_phase_records = layout_snapshot.phase_records();
        assert_eq!(
            layout_phase_records[0].handoff(),
            FunctionComponentLayoutEffectHandoff::Destroy
        );
        assert_eq!(
            layout_phase_records[0].commit_phase(),
            FunctionComponentLayoutEffectCommitPhase::Mutation
        );
        assert_eq!(layout_phase_records[0].effect(), previous_layout.effect());
        assert_eq!(
            layout_phase_records[0].previous_effect(),
            Some(previous_layout.effect())
        );
        assert_eq!(layout_phase_records[0].create(), None);
        assert_eq!(layout_phase_records[0].destroy(), Some(callback(764)));
        assert_eq!(
            layout_phase_records[1].handoff(),
            FunctionComponentLayoutEffectHandoff::Create
        );
        assert_eq!(
            layout_phase_records[1].commit_phase(),
            FunctionComponentLayoutEffectCommitPhase::Layout
        );
        assert_eq!(layout_phase_records[1].effect(), layout.effect());
        assert_eq!(layout_phase_records[1].create(), Some(callback(777)));
        assert_eq!(layout_phase_records[1].destroy(), None);
        assert_eq!(
            passive_snapshot.phase_records()[0].phase(),
            PendingPassiveEffectPhase::Unmount
        );
        assert_eq!(
            passive_snapshot.phase_records()[0].destroy(),
            Some(callback(767))
        );
        assert_eq!(
            passive_snapshot.phase_records()[1].phase(),
            PendingPassiveEffectPhase::Mount
        );
        assert_eq!(
            passive_snapshot.phase_records()[1].create(),
            Some(callback(779))
        );
        assert_eq!(
            passive.effect(),
            passive_snapshot.phase_records()[1].effect()
        );
        assert_eq!(
            passive_snapshot.phase_records()[1].instance(),
            previous_passive.instance()
        );
        assert_eq!(
            commit.root_update_callback_invocation_gate().records()[0].update(),
            root_update.update()
        );
        assert_eq!(
            commit.root_update_callback_invocation_gate().records()[0].callback(),
            root_callback
        );
        assert_dom_ref_callback_gate_is_inert(commit.dom_ref_callback_commit_gate());
        assert_ref_callback_execution_handoff_keeps_public_blockers(
            commit.ref_callback_execution_handoff(),
        );
        assert_ref_cleanup_return_execution_gate_keeps_public_blockers(
            commit.ref_cleanup_return_execution_gate(),
        );
        assert_root_update_callback_invocation_gate_is_inert(
            commit.root_update_callback_invocation_gate(),
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_function_component_effect_list_phase_order_without_callbacks() {
        let (mut store, root_id, host) = root_store();
        let current_root = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(7_900);
        let current_function = append_function_component_child(
            &mut store,
            current_root,
            PropsHandle::from_raw(7_901),
            component,
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let previous_layout = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Layout,
                callback(7_902),
                deps(7_903),
                Some(callback(7_904)),
            )
            .unwrap();
        let previous_passive = hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(7_905),
                deps(7_906),
                Some(callback(7_907)),
            )
            .unwrap();

        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(7_908),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let finished_function = append_function_component_child(
            &mut store,
            finished_work,
            PropsHandle::from_raw(7_909),
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
                callback(7_910),
                deps(7_911),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        let passive = hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut cursor,
                FunctionComponentEffectPhase::Passive,
                callback(7_912),
                deps(7_913),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();
        let queued_passive = queue_function_component_pending_passive_effects(
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
        let snapshot = commit
            .record_function_component_effect_list_commit_phase_order_for_canary(
                &store,
                &mut hook_store,
                std::slice::from_ref(&queued_passive),
            )
            .unwrap()
            .clone();
        let records = snapshot.records();

        assert_eq!(snapshot.root(), Some(root_id));
        assert_eq!(snapshot.finished_work(), Some(finished_work));
        assert_eq!(snapshot.lanes(), Lanes::DEFAULT);
        assert_eq!(snapshot.len(), 5);
        assert_eq!(snapshot.before_mutation_count(), 1);
        assert_eq!(snapshot.layout_destroy_count(), 1);
        assert_eq!(snapshot.layout_create_count(), 1);
        assert_eq!(snapshot.passive_unmount_schedule_count(), 1);
        assert_eq!(snapshot.passive_mount_schedule_count(), 1);
        assert!(snapshot.records_in_commit_phase_order());
        assert!(!snapshot.layout_callbacks_invoked());
        assert!(!snapshot.passive_callbacks_invoked());
        assert!(!snapshot.public_act_execution_enabled());
        assert!(!snapshot.public_effect_compatibility_claimed());
        assert_eq!(
            commit.function_component_effect_list_commit_phase_order(),
            &snapshot
        );
        assert_eq!(
            records
                .iter()
                .map(|record| record.phase_name())
                .collect::<Vec<_>>(),
            vec![
                "before-mutation",
                "mutation",
                "layout",
                "passive-scheduling",
                "passive-scheduling",
            ]
        );
        assert_eq!(
            records
                .iter()
                .map(|record| record.kind_name())
                .collect::<Vec<_>>(),
            vec![
                "effect-list-before-mutation",
                "layout-destroy",
                "layout-create",
                "passive-unmount-scheduled",
                "passive-mount-scheduled",
            ]
        );
        assert_eq!(records[0].fiber(), finished_function);
        assert_eq!(records[0].hook_list(), state.work_in_progress_list());
        assert_eq!(
            records[0].render_phase(),
            FunctionComponentHookRenderPhase::Update
        );
        assert_eq!(records[0].effect(), None);
        assert_eq!(records[0].create(), None);
        assert_eq!(records[0].destroy(), None);

        assert_eq!(records[1].fiber(), finished_function);
        assert_eq!(records[1].effect(), Some(previous_layout.effect()));
        assert_eq!(records[1].previous_effect(), Some(previous_layout.effect()));
        assert_eq!(records[1].create(), None);
        assert_eq!(records[1].destroy(), Some(callback(7_904)));
        assert_eq!(records[1].source_order(), 0);

        assert_eq!(records[2].fiber(), finished_function);
        assert_eq!(records[2].effect(), Some(layout.effect()));
        assert_eq!(records[2].previous_effect(), Some(previous_layout.effect()));
        assert_eq!(records[2].create(), Some(callback(7_910)));
        assert_eq!(records[2].destroy(), None);
        assert_eq!(records[2].source_order(), 0);

        assert_eq!(records[3].fiber(), finished_function);
        assert_eq!(records[3].effect(), Some(passive.effect()));
        assert_eq!(records[3].create(), None);
        assert_eq!(records[3].destroy(), Some(callback(7_907)));
        assert_eq!(records[4].fiber(), finished_function);
        assert_eq!(records[4].effect(), Some(passive.effect()));
        assert_eq!(records[4].create(), Some(callback(7_912)));
        assert_eq!(records[4].destroy(), None);
        assert!(records[3].source_order() < records[4].source_order());

        assert_eq!(
            hook_store
                .committed_effect_queue(finished_function)
                .unwrap()
                .accepted_layout_count(),
            1
        );
        assert_eq!(
            hook_store
                .committed_effect_queue(finished_function)
                .unwrap()
                .accepted_passive_count(),
            1
        );
        assert_eq!(
            commit
                .pending_passive_handoff()
                .unwrap()
                .pending_record_count(),
            2
        );
        assert!(
            store
                .root(root_id)
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
        assert_eq!(previous_passive.instance(), passive.instance());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_effect_list_layout_effect_execution_gate_invokes_one_callback_after_mutation_before_passive()
     {
        let (mut store, root_id, host) = root_store();
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let (render, fixture) =
            prepare_layout_effect_execution_fixture(&mut store, root_id, &mut hook_store, 8_100);

        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let effect_list = commit
            .record_function_component_effect_list_commit_phase_order_for_canary(
                &store,
                &mut hook_store,
                std::slice::from_ref(&fixture.queued_passive),
            )
            .unwrap()
            .clone();
        let layout_record = first_effect_list_record(
            &effect_list,
            FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate,
        );
        let mut control = TestLayoutEffectCallbackControl::default();

        let execution = commit
            .execute_function_component_layout_effect_record_under_test_control_for_canary(
                &store,
                &hook_store,
                layout_record,
                &mut control,
            )
            .unwrap()
            .clone();

        assert_eq!(execution.root(), Some(root_id));
        assert_eq!(execution.finished_work(), Some(fixture.finished_work));
        assert_eq!(execution.lanes(), Lanes::DEFAULT);
        assert_eq!(execution.len(), 1);
        assert_eq!(execution.completed_count(), 1);
        assert_eq!(execution.error_count(), 0);
        assert!(!execution.has_errors());
        assert_eq!(
            execution.status(),
            FunctionComponentLayoutEffectCallbackInvocationGateStatus::TestControlOnly
        );
        assert_eq!(
            execution.blockers(),
            &FUNCTION_COMPONENT_LAYOUT_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
        );
        assert!(execution.did_invoke_test_layout_callback());
        assert!(!execution.public_use_layout_effect_compatibility_claimed());
        assert!(!execution.public_act_compatibility_claimed());
        assert!(!execution.passive_phase_callbacks_invoked());

        let records = execution.records();
        assert_eq!(records[0].invocation_order(), 0);
        assert_eq!(
            records[0].status(),
            FunctionComponentLayoutEffectCallbackInvocationStatus::Completed
        );
        assert_eq!(records[0].root(), root_id);
        assert_eq!(records[0].finished_work(), fixture.finished_work);
        assert_eq!(records[0].fiber(), fixture.finished_function);
        assert_eq!(records[0].effect(), fixture.layout.effect());
        assert_eq!(records[0].callback(), callback(8_110));
        let request = records[0].request();
        assert_eq!(request.effect_list_sequence(), layout_record.sequence());
        assert!(request.after_matching_mutation_metadata());
        assert!(request.before_passive_metadata());
        assert_eq!(
            request.first_passive_sequence(),
            Some(
                first_effect_list_record(
                    &effect_list,
                    FunctionComponentEffectListCommitPhaseOrderKind::PassiveUnmountScheduled,
                )
                .sequence()
            )
        );
        assert_eq!(
            request.previous_effect(),
            Some(fixture.previous_layout.effect())
        );
        assert_eq!(request.instance(), fixture.layout.instance());
        assert_eq!(request.hook_list(), fixture.state.work_in_progress_list());

        assert_eq!(control.calls(), &[request]);
        assert_eq!(
            commit.function_component_layout_effect_callback_invocation_gate(),
            &execution
        );
        let diagnostics = commit.commit_order_diagnostics_for_canary();
        assert_eq!(
            diagnostics
                .records()
                .iter()
                .map(|record| record.metadata_kind_name())
                .collect::<Vec<_>>(),
            vec![
                "layout-effect-destroy",
                "layout-effect-create",
                "layout-effect-callback",
                "passive-unmount",
                "passive-mount",
            ]
        );
        assert_eq!(
            diagnostics
                .records()
                .iter()
                .map(|record| record.phase_name())
                .collect::<Vec<_>>(),
            vec!["mutation", "layout", "layout", "passive", "passive"]
        );
        assert_eq!(
            commit
                .function_component_committed_passive_effects()
                .phase_records()[0]
                .destroy(),
            Some(callback(8_107))
        );
        assert_eq!(
            fixture.passive.effect(),
            fixture.queued_passive.records()[0].effect()
        );
        assert_eq!(
            fixture.previous_passive.instance(),
            fixture.passive.instance()
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
    fn root_commit_effect_list_layout_effect_execution_gate_rejects_passive_phase_records() {
        let (mut store, root_id, host) = root_store();
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let (render, fixture) =
            prepare_layout_effect_execution_fixture(&mut store, root_id, &mut hook_store, 8_200);
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let effect_list = commit
            .record_function_component_effect_list_commit_phase_order_for_canary(
                &store,
                &mut hook_store,
                std::slice::from_ref(&fixture.queued_passive),
            )
            .unwrap()
            .clone();
        let passive_record = first_effect_list_record(
            &effect_list,
            FunctionComponentEffectListCommitPhaseOrderKind::PassiveMountScheduled,
        );
        let mut control = TestLayoutEffectCallbackControl::default();

        let error = commit
            .execute_function_component_layout_effect_record_under_test_control_for_canary(
                &store,
                &hook_store,
                passive_record,
                &mut control,
            )
            .unwrap_err();

        assert!(
            matches!(
                error,
                RootCommitError::LayoutEffectCallbackExecutionPassiveRecordRejected {
                    root,
                    fiber,
                    effect,
                } if root == root_id
                    && fiber == fixture.finished_function
                    && effect == Some(fixture.passive.effect())
            ),
            "unexpected error: {error:?}"
        );
        assert!(control.calls().is_empty());
        assert!(
            commit
                .function_component_layout_effect_callback_invocation_gate()
                .is_empty()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_effect_list_layout_effect_execution_gate_rejects_stale_effect_rings() {
        let (mut store, root_id, host) = root_store();
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let (render, fixture) =
            prepare_layout_effect_execution_fixture(&mut store, root_id, &mut hook_store, 8_300);
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let effect_list = commit
            .record_function_component_effect_list_commit_phase_order_for_canary(
                &store,
                &mut hook_store,
                std::slice::from_ref(&fixture.queued_passive),
            )
            .unwrap()
            .clone();
        let layout_record = first_effect_list_record(
            &effect_list,
            FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate,
        );
        let stale_hook_store = FunctionComponentHookRenderStore::new();
        let mut control = TestLayoutEffectCallbackControl::default();

        let error = commit
            .execute_function_component_layout_effect_record_under_test_control_for_canary(
                &store,
                &stale_hook_store,
                layout_record,
                &mut control,
            )
            .unwrap_err();

        assert!(
            matches!(
                error,
                RootCommitError::LayoutEffectCallbackExecutionStaleEffectRing {
                    root,
                    fiber,
                    hook_list,
                    current_list,
                } if root == root_id
                    && fiber == fixture.finished_function
                    && hook_list == fixture.state.work_in_progress_list()
                    && current_list == None
            ),
            "unexpected error: {error:?}"
        );
        assert!(control.calls().is_empty());
        assert!(
            commit
                .function_component_layout_effect_callback_invocation_gate()
                .is_empty()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_effect_list_layout_effect_execution_gate_rejects_unsupported_fiber_tags() {
        let (mut store, root_id, host) = root_store();
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let (render, fixture) =
            prepare_layout_effect_execution_fixture(&mut store, root_id, &mut hook_store, 8_400);
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let effect_list = commit
            .record_function_component_effect_list_commit_phase_order_for_canary(
                &store,
                &mut hook_store,
                std::slice::from_ref(&fixture.queued_passive),
            )
            .unwrap()
            .clone();
        let layout_record = first_effect_list_record(
            &effect_list,
            FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate,
        );
        let unsupported_record = FunctionComponentEffectListCommitPhaseOrderRecord {
            fiber: fixture.finished_work,
            ..layout_record
        };
        let mut control = TestLayoutEffectCallbackControl::default();

        let error = commit
            .execute_function_component_layout_effect_record_under_test_control_for_canary(
                &store,
                &hook_store,
                unsupported_record,
                &mut control,
            )
            .unwrap_err();

        assert!(
            matches!(
                error,
                RootCommitError::LayoutEffectCallbackExecutionUnsupportedFiberTag {
                    root,
                    fiber,
                    tag,
                    unsupported_feature,
                } if root == root_id
                    && fiber == fixture.finished_work
                    && tag == FiberTag::HostRoot
                    && unsupported_feature == None
            ),
            "unexpected error: {error:?}"
        );
        assert!(control.calls().is_empty());
        assert!(
            commit
                .function_component_layout_effect_callback_invocation_gate()
                .is_empty()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_effect_list_phase_order_rejects_cross_root_passive_handoff() {
        let (mut store, root_id, host) = root_store();
        let other_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let mut hook_store = FunctionComponentHookRenderStore::new();

        let current_root = store.root(root_id).unwrap().current();
        let component = FiberTypeHandle::from_raw(7_930);
        let current_function = append_function_component_child(
            &mut store,
            current_root,
            PropsHandle::from_raw(7_931),
            component,
        );
        hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                current_function,
                FunctionComponentEffectPhase::Passive,
                callback(7_932),
                deps(7_933),
                Some(callback(7_934)),
            )
            .unwrap();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(7_935),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_function = append_function_component_child(
            &mut store,
            render.finished_work(),
            PropsHandle::from_raw(7_936),
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
                callback(7_937),
                deps(7_938),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(cursor).unwrap();
        queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            state,
            Lanes::DEFAULT,
        )
        .unwrap();

        let other_current_root = store.root(other_root).unwrap().current();
        let other_component = FiberTypeHandle::from_raw(7_940);
        let other_current_function = append_function_component_child(
            &mut store,
            other_current_root,
            PropsHandle::from_raw(7_941),
            other_component,
        );
        hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                other_current_function,
                FunctionComponentEffectPhase::Passive,
                callback(7_942),
                deps(7_943),
                Some(callback(7_944)),
            )
            .unwrap();
        update_container(
            &mut store,
            other_root,
            RootElementHandle::from_raw(7_945),
            None,
        )
        .unwrap();
        let other_render =
            render_host_root_for_lanes(&mut store, other_root, Lanes::DEFAULT).unwrap();
        let other_finished_function = append_function_component_child(
            &mut store,
            other_render.finished_work(),
            PropsHandle::from_raw(7_946),
            other_component,
        );
        store
            .fiber_arena_mut()
            .link_alternates(other_current_function, other_finished_function)
            .unwrap();
        let other_state = hook_store
            .prepare_render_state(store.fiber_arena(), other_finished_function)
            .unwrap();
        let mut other_cursor = hook_store.begin_render_cursor(other_state).unwrap();
        hook_store
            .update_effect_metadata(
                store.fiber_arena_mut(),
                &mut other_cursor,
                FunctionComponentEffectPhase::Passive,
                callback(7_947),
                deps(7_948),
                FunctionComponentEffectDependencyStatus::Changed,
            )
            .unwrap();
        hook_store.finish_render_cursor(other_cursor).unwrap();
        let other_handoff = queue_function_component_pending_passive_effects(
            &mut store,
            other_root,
            &hook_store,
            other_state,
            Lanes::DEFAULT,
        )
        .unwrap();

        bubble_test_fiber(&mut store, finished_function);
        bubble_test_fiber(&mut store, render.finished_work());
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let error = commit
            .record_function_component_effect_list_commit_phase_order_for_canary(
                &store,
                &mut hook_store,
                std::slice::from_ref(&other_handoff),
            )
            .unwrap_err();

        assert!(
            matches!(
                error,
                RootCommitError::CommittedPassiveEffectHandoffRootMismatch {
                    commit_root,
                    handoff_root,
                } if commit_root == root_id && handoff_root == other_root
            ),
            "unexpected error: {error:?}"
        );
        assert!(
            commit
                .function_component_effect_list_commit_phase_order()
                .is_empty()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_effect_list_phase_order_rejects_stale_passive_handoff_fiber() {
        let (mut store, root_id, host) = root_store();
        let mode = store
            .fiber_arena()
            .get(store.root(root_id).unwrap().current())
            .unwrap()
            .mode();
        let stale_function = create_function_component_fiber(
            &mut store,
            mode,
            PropsHandle::from_raw(7_960),
            FiberTypeHandle::from_raw(7_961),
        );
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let stale_state = hook_store
            .prepare_render_state(store.fiber_arena(), stale_function)
            .unwrap();
        let mut stale_cursor = hook_store.begin_render_cursor(stale_state).unwrap();
        hook_store
            .mount_effect_metadata(
                store.fiber_arena_mut(),
                &mut stale_cursor,
                FunctionComponentEffectPhase::Passive,
                callback(7_962),
                deps(7_963),
            )
            .unwrap();
        hook_store.finish_render_cursor(stale_cursor).unwrap();
        let stale_handoff = queue_function_component_pending_passive_effects(
            &mut store,
            root_id,
            &hook_store,
            stale_state,
            Lanes::DEFAULT,
        )
        .unwrap();

        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(7_964),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let finished_work = render.finished_work();
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let error = commit
            .record_function_component_effect_list_commit_phase_order_for_canary(
                &store,
                &mut hook_store,
                std::slice::from_ref(&stale_handoff),
            )
            .unwrap_err();

        assert!(
            matches!(
                error,
                RootCommitError::CommittedPassiveEffectHandoffFiberStale {
                    root,
                    finished_work: error_finished_work,
                    fiber,
                } if root == root_id
                    && error_finished_work == finished_work
                    && fiber == stale_function
            ),
            "unexpected error: {error:?}"
        );
        assert!(
            commit
                .function_component_effect_list_commit_phase_order()
                .is_empty()
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
        let handoff = commit.ref_callback_execution_handoff();
        let cleanup_gate = commit.ref_cleanup_return_execution_gate();

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
        assert_ref_callback_execution_handoff_keeps_public_blockers(handoff);
        assert_eq!(handoff.len(), 1);
        assert_eq!(handoff.detach_count(), 0);
        assert_eq!(handoff.attach_count(), 1);
        assert_eq!(handoff.changed_ref_detach_before_attach_count(), 0);
        let handoff_record = handoff.records()[0];
        assert_eq!(handoff_record.sequence(), 0);
        assert_eq!(
            handoff_record.source_gate_sequence(),
            gate_record.sequence()
        );
        assert_eq!(handoff_record.root(), root_id);
        assert_eq!(handoff_record.fiber(), child);
        assert_eq!(handoff_record.state_node(), state_node);
        assert_eq!(handoff_record.ref_handle(), ref_handle);
        assert_eq!(handoff_record.token(), attach.token());
        assert_eq!(handoff_record.action(), HostRootRefCommitAction::Attach);
        assert_eq!(
            handoff_record.execution_phase(),
            HostRootRefCallbackExecutionPhase::CallbackAttach
        );
        assert!(!handoff_record.changed_ref_detach_before_attach());
        assert_ref_cleanup_return_execution_gate_keeps_public_blockers(cleanup_gate);
        assert_eq!(cleanup_gate.len(), 1);
        assert_eq!(cleanup_gate.cleanup_return_handle_record_gate_count(), 1);
        assert_eq!(cleanup_gate.cleanup_return_execution_gate_count(), 0);
        assert_eq!(cleanup_gate.changed_ref_cleanup_before_attach_count(), 0);
        let cleanup_record = cleanup_gate.records()[0];
        assert_eq!(cleanup_record.sequence(), 0);
        assert_eq!(
            cleanup_record.source_handoff_sequence(),
            handoff_record.sequence()
        );
        assert_eq!(
            cleanup_record.source_gate_sequence(),
            gate_record.sequence()
        );
        assert_eq!(cleanup_record.root(), root_id);
        assert_eq!(cleanup_record.fiber(), child);
        assert_eq!(cleanup_record.state_node(), state_node);
        assert_eq!(cleanup_record.ref_handle(), ref_handle);
        assert_eq!(cleanup_record.token(), attach.token());
        assert_eq!(cleanup_record.action(), HostRootRefCommitAction::Attach);
        assert_eq!(
            cleanup_record.cleanup_return_phase(),
            HostRootRefCleanupReturnExecutionPhase::RecordAttachCleanupReturnHandle
        );
        assert!(cleanup_record.cleanup_return_handle_recording_gate());
        assert!(!cleanup_record.cleanup_return_execution_gate());
        assert!(!cleanup_record.changed_ref_cleanup_before_attach());
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
        let handoff = commit.ref_callback_execution_handoff();
        let cleanup_gate = commit.ref_cleanup_return_execution_gate();

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
        assert_ref_callback_execution_handoff_keeps_public_blockers(handoff);
        assert_eq!(handoff.len(), 2);
        assert_eq!(handoff.detach_count(), 1);
        assert_eq!(handoff.attach_count(), 1);
        assert_eq!(handoff.changed_ref_detach_before_attach_count(), 1);
        assert_eq!(handoff.records()[0].sequence(), 0);
        assert_eq!(handoff.records()[0].source_gate_sequence(), 0);
        assert_eq!(handoff.records()[0].fiber(), current_child);
        assert_eq!(handoff.records()[0].token(), detach.token());
        assert_eq!(
            handoff.records()[0].action(),
            HostRootRefCommitAction::Detach
        );
        assert_eq!(
            handoff.records()[0].execution_phase(),
            HostRootRefCallbackExecutionPhase::CallbackDetachCleanupOrNull
        );
        assert!(!handoff.records()[0].changed_ref_detach_before_attach());
        assert_eq!(handoff.records()[1].sequence(), 1);
        assert_eq!(handoff.records()[1].source_gate_sequence(), 1);
        assert_eq!(handoff.records()[1].fiber(), finished_child);
        assert_eq!(handoff.records()[1].token(), attach.token());
        assert_eq!(
            handoff.records()[1].action(),
            HostRootRefCommitAction::Attach
        );
        assert_eq!(
            handoff.records()[1].execution_phase(),
            HostRootRefCallbackExecutionPhase::CallbackAttach
        );
        assert!(handoff.records()[1].changed_ref_detach_before_attach());
        assert_ref_cleanup_return_execution_gate_keeps_public_blockers(cleanup_gate);
        assert_eq!(cleanup_gate.len(), 2);
        assert_eq!(cleanup_gate.cleanup_return_handle_record_gate_count(), 1);
        assert_eq!(cleanup_gate.cleanup_return_execution_gate_count(), 1);
        assert_eq!(cleanup_gate.changed_ref_cleanup_before_attach_count(), 1);
        assert_eq!(cleanup_gate.records()[0].sequence(), 0);
        assert_eq!(cleanup_gate.records()[0].source_handoff_sequence(), 0);
        assert_eq!(cleanup_gate.records()[0].source_gate_sequence(), 0);
        assert_eq!(cleanup_gate.records()[0].fiber(), current_child);
        assert_eq!(cleanup_gate.records()[0].token(), detach.token());
        assert_eq!(
            cleanup_gate.records()[0].cleanup_return_phase(),
            HostRootRefCleanupReturnExecutionPhase::ExecuteDetachCleanupReturnHandleOrNull
        );
        assert!(!cleanup_gate.records()[0].cleanup_return_handle_recording_gate());
        assert!(cleanup_gate.records()[0].cleanup_return_execution_gate());
        assert!(!cleanup_gate.records()[0].changed_ref_cleanup_before_attach());
        assert_eq!(cleanup_gate.records()[1].sequence(), 1);
        assert_eq!(cleanup_gate.records()[1].source_handoff_sequence(), 1);
        assert_eq!(cleanup_gate.records()[1].source_gate_sequence(), 1);
        assert_eq!(cleanup_gate.records()[1].fiber(), finished_child);
        assert_eq!(cleanup_gate.records()[1].token(), attach.token());
        assert_eq!(
            cleanup_gate.records()[1].cleanup_return_phase(),
            HostRootRefCleanupReturnExecutionPhase::RecordAttachCleanupReturnHandle
        );
        assert!(cleanup_gate.records()[1].cleanup_return_handle_recording_gate());
        assert!(!cleanup_gate.records()[1].cleanup_return_execution_gate());
        assert!(cleanup_gate.records()[1].changed_ref_cleanup_before_attach());
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
        let handoff = commit.ref_callback_execution_handoff();
        let cleanup_gate = commit.ref_cleanup_return_execution_gate();

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
        assert_ref_callback_execution_handoff_keeps_public_blockers(handoff);
        assert_eq!(handoff.len(), 2);
        assert_eq!(handoff.detach_count(), 2);
        assert_eq!(handoff.attach_count(), 0);
        assert_eq!(handoff.changed_ref_detach_before_attach_count(), 0);
        assert_eq!(handoff.records()[0].source_gate_sequence(), 0);
        assert_eq!(handoff.records()[0].fiber(), deleted_parent);
        assert_eq!(handoff.records()[0].token(), refs.detach()[0].token());
        assert_eq!(
            handoff.records()[0].detach_reason(),
            Some(HostRootRefDetachReason::Deleted)
        );
        assert_eq!(handoff.records()[1].source_gate_sequence(), 1);
        assert_eq!(handoff.records()[1].fiber(), deleted_child);
        assert_eq!(handoff.records()[1].token(), refs.detach()[1].token());
        assert_eq!(
            handoff.records()[1].detach_reason(),
            Some(HostRootRefDetachReason::Deleted)
        );
        assert_ref_cleanup_return_execution_gate_keeps_public_blockers(cleanup_gate);
        assert_eq!(cleanup_gate.len(), 2);
        assert_eq!(cleanup_gate.cleanup_return_handle_record_gate_count(), 0);
        assert_eq!(cleanup_gate.cleanup_return_execution_gate_count(), 2);
        assert_eq!(cleanup_gate.changed_ref_cleanup_before_attach_count(), 0);
        assert_eq!(cleanup_gate.records()[0].source_handoff_sequence(), 0);
        assert_eq!(cleanup_gate.records()[0].fiber(), deleted_parent);
        assert_eq!(cleanup_gate.records()[0].token(), refs.detach()[0].token());
        assert_eq!(
            cleanup_gate.records()[0].cleanup_return_phase(),
            HostRootRefCleanupReturnExecutionPhase::ExecuteDetachCleanupReturnHandleOrNull
        );
        assert!(cleanup_gate.records()[0].cleanup_return_execution_gate());
        assert_eq!(cleanup_gate.records()[1].source_handoff_sequence(), 1);
        assert_eq!(cleanup_gate.records()[1].fiber(), deleted_child);
        assert_eq!(cleanup_gate.records()[1].token(), refs.detach()[1].token());
        assert_eq!(
            cleanup_gate.records()[1].cleanup_return_phase(),
            HostRootRefCleanupReturnExecutionPhase::ExecuteDetachCleanupReturnHandleOrNull
        );
        assert!(cleanup_gate.records()[1].cleanup_return_execution_gate());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_deletion_order_gate_records_ref_cleanup_before_passive_destroy_metadata() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(48), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let fixture = attach_deleted_host_subtree_ref_passive_fixture(
            &mut store,
            &mut hook_store,
            render.finished_work(),
        );
        let deleted_passive_handoff =
            queue_function_component_deleted_subtree_pending_passive_effects(
                &mut store,
                root_id,
                &hook_store,
                render.finished_work(),
                fixture.deleted_host,
                Lanes::DEFAULT,
            )
            .unwrap();

        assert_eq!(deleted_passive_handoff.root(), root_id);
        assert_eq!(
            deleted_passive_handoff.nearest_mounted_ancestor(),
            render.finished_work()
        );
        assert_eq!(deleted_passive_handoff.deleted_root(), fixture.deleted_host);
        assert_eq!(deleted_passive_handoff.queued_unmount_count(), 1);
        let queued_passive = deleted_passive_handoff.records()[0];
        assert_eq!(queued_passive.fiber(), fixture.deleted_function);
        assert_eq!(queued_passive.traversal_index(), 0);
        assert_eq!(queued_passive.create(), fixture.passive_create);
        assert_eq!(queued_passive.destroy(), Some(fixture.passive_destroy));
        assert_eq!(queued_passive.dependencies(), fixture.passive_dependencies);
        assert_eq!(
            queued_passive.unmount_order().phase(),
            PendingPassiveEffectPhase::Unmount
        );

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let handoff = commit.pending_passive_handoff().unwrap();
        assert_eq!(handoff.pending_unmount_count(), 1);
        assert_eq!(handoff.pending_mount_count(), 0);
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();
        assert_eq!(pending_passive.passive_unmounts().len(), 1);
        assert_eq!(
            pending_passive.passive_unmounts()[0].unmount_origin(),
            Some(PendingPassiveUnmountOrigin::DeletedSubtree {
                nearest_mounted_ancestor: render.finished_work()
            })
        );

        let passive_snapshot = commit
            .record_function_component_deleted_subtree_passive_effects_for_canary(&[
                deleted_passive_handoff,
            ])
            .unwrap()
            .clone();
        let refs = commit.ref_commit_metadata();
        let cleanup_gate = commit.ref_cleanup_return_execution_gate();
        let host_cleanup = commit.host_node_deletion_cleanup_log();
        let order_gate = commit.deletion_cleanup_order_gate_for_canary();
        let order_records = order_gate.records();

        assert_eq!(commit.deletion_lists().len(), 1);
        assert_eq!(commit.deletion_lists()[0].list(), fixture.list);
        assert_eq!(
            commit.deletion_lists()[0].deleted(),
            &[fixture.deleted_host]
        );
        assert_eq!(refs.detach().len(), 1);
        assert_eq!(refs.detach()[0].fiber(), fixture.deleted_host);
        assert_eq!(
            refs.detach()[0].state_node(),
            fixture.deleted_host_state_node
        );
        assert_eq!(refs.detach()[0].ref_handle(), fixture.deleted_host_ref);
        assert_eq!(
            refs.detach()[0].detach_reason(),
            Some(HostRootRefDetachReason::Deleted)
        );
        assert_ref_cleanup_return_execution_gate_keeps_public_blockers(cleanup_gate);
        assert_eq!(cleanup_gate.cleanup_return_execution_gate_count(), 1);
        assert_eq!(cleanup_gate.records()[0].fiber(), fixture.deleted_host);
        assert_eq!(cleanup_gate.records()[0].sequence(), 0);
        assert!(cleanup_gate.records()[0].cleanup_return_execution_gate());

        assert_eq!(passive_snapshot.len(), 1);
        assert_eq!(passive_snapshot.destroy_count(), 1);
        assert_eq!(passive_snapshot.records()[0], queued_passive);
        assert_eq!(host_cleanup.len(), 2);
        assert_eq!(host_cleanup.records()[0].fiber(), fixture.deleted_text);
        assert_eq!(
            host_cleanup.records()[0].state_node(),
            fixture.deleted_text_state_node
        );
        assert_eq!(host_cleanup.records()[1].fiber(), fixture.deleted_host);
        assert_eq!(
            host_cleanup.records()[1].state_node(),
            fixture.deleted_host_state_node
        );

        assert_eq!(order_gate.len(), 4);
        assert_eq!(order_gate.ref_cleanup_return_count(), 1);
        assert_eq!(order_gate.passive_destroy_count(), 1);
        assert_eq!(order_gate.host_node_cleanup_count(), 2);
        assert!(!order_gate.ref_cleanup_return_callbacks_invoked());
        assert!(!order_gate.passive_destroy_callbacks_invoked());
        assert!(!order_gate.public_effects_flushed());
        assert!(!order_gate.public_ref_or_effect_compatibility_claimed());
        assert_eq!(
            order_records
                .iter()
                .map(|record| record.sequence())
                .collect::<Vec<_>>(),
            vec![0, 1, 2, 3]
        );
        assert_eq!(
            order_records
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
        assert_eq!(order_records[0].fiber(), fixture.deleted_host);
        assert_eq!(order_records[0].deleted_root(), fixture.deleted_host);
        assert_eq!(order_records[0].deletion_list(), Some(fixture.list));
        assert_eq!(order_records[0].deletion_list_index(), Some(0));
        assert_eq!(order_records[0].deleted_index(), Some(0));
        assert_eq!(order_records[0].subtree_index(), Some(1));
        assert_eq!(order_records[0].ref_cleanup_return_sequence(), Some(0));
        assert_eq!(order_records[0].passive_unmount_order(), None);
        assert_eq!(order_records[0].host_cleanup_sequence(), None);
        assert_eq!(order_records[1].fiber(), fixture.deleted_function);
        assert_eq!(order_records[1].deleted_root(), fixture.deleted_host);
        assert_eq!(order_records[1].deletion_list(), Some(fixture.list));
        assert_eq!(order_records[1].subtree_index(), Some(0));
        assert_eq!(
            order_records[1].passive_unmount_order(),
            Some(queued_passive.unmount_order())
        );
        assert_eq!(
            order_records[1].passive_destroy(),
            Some(fixture.passive_destroy)
        );
        assert_eq!(order_records[2].fiber(), fixture.deleted_text);
        assert_eq!(order_records[2].host_cleanup_sequence(), Some(0));
        assert_eq!(order_records[3].fiber(), fixture.deleted_host);
        assert_eq!(order_records[3].host_cleanup_sequence(), Some(1));
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_deletion_passive_snapshot_exposes_unmount_phase_records_for_private_flush() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(49), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let fixture = attach_deleted_host_subtree_ref_passive_fixture(
            &mut store,
            &mut hook_store,
            render.finished_work(),
        );
        let deleted_passive_handoff =
            queue_function_component_deleted_subtree_pending_passive_effects(
                &mut store,
                root_id,
                &hook_store,
                render.finished_work(),
                fixture.deleted_host,
                Lanes::DEFAULT,
            )
            .unwrap();
        let queued_passive = deleted_passive_handoff.records()[0];

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        commit
            .record_function_component_deleted_subtree_passive_effects_for_canary(&[
                deleted_passive_handoff,
            ])
            .unwrap();
        let snapshot = commit.function_component_deleted_subtree_passive_effects();
        let phase_records = snapshot.effect_phase_records();

        assert_eq!(snapshot.len(), 1);
        assert_eq!(snapshot.destroy_count(), 1);
        assert_eq!(snapshot.records()[0], queued_passive);
        assert_eq!(phase_records.len(), 1);
        assert_eq!(phase_records[0].fiber(), fixture.deleted_function);
        assert_eq!(phase_records[0].effect_index(), 0);
        assert_eq!(phase_records[0].effect(), queued_passive.effect());
        assert_eq!(phase_records[0].instance(), queued_passive.instance());
        assert_eq!(phase_records[0].create(), None);
        assert_eq!(phase_records[0].destroy(), Some(fixture.passive_destroy));
        assert_eq!(phase_records[0].lanes(), Lanes::DEFAULT);
        assert_eq!(phase_records[0].phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(phase_records[0].order(), queued_passive.unmount_order());

        let order_gate = commit.deletion_cleanup_order_gate_for_canary();
        assert_eq!(
            order_gate.records()[0].phase(),
            HostRootDeletionCleanupOrderPhase::RefCleanupReturn
        );
        assert_eq!(
            order_gate.records()[1].phase(),
            HostRootDeletionCleanupOrderPhase::PassiveDestroy
        );
        assert_eq!(
            order_gate.records()[2].phase(),
            HostRootDeletionCleanupOrderPhase::HostNodeCleanup
        );
        assert!(!order_gate.public_ref_or_effect_compatibility_claimed());
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
    fn ref_callback_execution_handoff_revalidates_root_commit_source_tokens() {
        let (mut store, root_id, _host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(50), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let ref_handle = RefHandle::from_raw(142);
        let state_node = StateNodeHandle::from_raw(242);
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
        let gate = commit.dom_ref_callback_commit_gate().clone();
        let attach = commit.ref_commit_metadata().attach()[0];
        store
            .host_tokens_mut()
            .invalidate(attach.token(), attach.token_phase(), attach.token_target())
            .unwrap();

        let error = materialize_ref_callback_execution_handoff(&store, &gate).unwrap_err();

        assert!(matches!(
            error,
            RootCommitError::HostFiberToken(error)
                if error.violation() == HostFiberTokenViolation::Stale
                    && error.phase() == HostFiberTokenPhase::Commit
                    && error.target() == HostFiberTokenTarget::Instance
        ));
    }

    #[test]
    fn ref_cleanup_return_execution_gate_revalidates_handoff_source_tokens() {
        let (mut store, root_id, _host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(51), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let ref_handle = RefHandle::from_raw(143);
        let state_node = StateNodeHandle::from_raw(243);
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
        let handoff = commit.ref_callback_execution_handoff().clone();
        let attach = commit.ref_commit_metadata().attach()[0];
        store
            .host_tokens_mut()
            .invalidate(attach.token(), attach.token_phase(), attach.token_target())
            .unwrap();

        let error = materialize_ref_cleanup_return_execution_gate(&store, &handoff).unwrap_err();

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
    fn root_commit_finished_work_handoff_records_identity_lanes_root_token_and_order() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(510), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, render, 3).unwrap();

        assert_eq!(pending.root(), root_id);
        assert_eq!(pending.root_token(), root_id.state_node_handle());
        assert_eq!(pending.previous_current(), render.current());
        assert_eq!(pending.pending_work(), Some(render.finished_work()));
        assert_eq!(pending.finished_work(), render.finished_work());
        assert_eq!(pending.render_lanes(), Lanes::DEFAULT);
        assert_eq!(pending.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(pending.remaining_lanes(), Lanes::NO);
        assert_eq!(pending.pending_lanes_before_commit(), Lanes::DEFAULT);
        assert_eq!(pending.handoff_order(), 3);
        assert!(pending.records_finished_work());

        let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            render,
            Some(pending),
            4,
        )
        .unwrap();

        assert_eq!(handoff.pending(), pending);
        assert_eq!(handoff.commit_order(), 4);
        assert!(handoff.commit_order_after_pending_record());
        let request = *handoff.execution_request();
        assert_eq!(
            request.status(),
            HostRootFinishedWorkCommitExecutionStatusForCanary::Requested
        );
        assert!(request.execution_requested());
        assert!(request.accepted_current_finished_work_record_shape());
        assert_eq!(request.source_handoff_order(), pending.handoff_order());
        assert_eq!(request.request_order(), 4);
        assert_eq!(request.root(), root_id);
        assert_eq!(request.root_token(), root_id.state_node_handle());
        assert_eq!(request.previous_current(), render.current());
        assert_eq!(request.pending_work(), Some(render.finished_work()));
        assert_eq!(request.finished_work(), render.finished_work());
        assert_eq!(request.render_lanes(), Lanes::DEFAULT);
        assert_eq!(request.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(request.remaining_lanes(), Lanes::NO);
        assert_eq!(request.pending_lanes_before_commit(), Lanes::DEFAULT);
        assert_eq!(
            request.blockers(),
            &HOST_ROOT_FINISHED_WORK_COMMIT_EXECUTION_BLOCKERS
        );
        assert!(request.host_mutation_execution_blocked());
        assert!(request.public_root_rendering_blocked());
        assert!(request.ref_attach_detach_blocked());
        assert!(request.layout_effect_execution_blocked());
        assert!(request.passive_effect_execution_blocked());
        assert!(request.hydration_blocked());
        assert!(request.compatibility_claim_blocked());
        assert!(request.refs_effects_and_hydration_blocked());
        assert_eq!(handoff.commit().root(), root_id);
        assert_eq!(handoff.commit().finished_work(), render.finished_work());
        assert_eq!(handoff.current_after_commit(), render.finished_work());
        assert_eq!(handoff.finished_work_after_commit(), None);
        assert_eq!(handoff.finished_lanes_after_commit(), Lanes::NO);
        assert_eq!(handoff.render_phase_work_after_commit(), None);
        assert!(handoff.consumed_finished_work_record());
        assert!(handoff.mutation_execution_blocked());
        assert!(handoff.public_root_rendering_blocked());
        assert!(handoff.effects_refs_and_hydration_blocked());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_finished_work_handoff_rejects_missing_record_before_switching_current() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(511), None).unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let error = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store, render, None, 1,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostRootFinishedWorkCommitHandoffErrorForCanary::MissingFinishedWorkRecord {
                root,
                finished_work
            } if root == root_id && finished_work == render.finished_work()
        ));
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.finished_work())
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_finished_work_handoff_rejects_foreign_record_before_switching_current() {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let first_root = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        update_container(
            &mut store,
            first_root,
            RootElementHandle::from_raw(512),
            None,
        )
        .unwrap();
        update_container(
            &mut store,
            second_root,
            RootElementHandle::from_raw(513),
            None,
        )
        .unwrap();
        let first_current = store.root(first_root).unwrap().current();
        let first_render =
            render_host_root_for_lanes(&mut store, first_root, Lanes::DEFAULT).unwrap();
        let second_render =
            render_host_root_for_lanes(&mut store, second_root, Lanes::DEFAULT).unwrap();
        let second_pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, second_render, 1)
                .unwrap();

        let error = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            first_render,
            Some(second_pending),
            2,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostRootFinishedWorkCommitHandoffErrorForCanary::ForeignFinishedWorkRecord {
                expected_root,
                actual_root,
                expected_root_token,
                actual_root_token
            } if expected_root == first_root
                && actual_root == second_root
                && expected_root_token == first_root.state_node_handle()
                && actual_root_token == second_root.state_node_handle()
        ));
        assert_eq!(store.root(first_root).unwrap().current(), first_current);
        assert_eq!(
            store
                .root(first_root)
                .unwrap()
                .scheduling()
                .work_in_progress(),
            Some(first_render.finished_work())
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_finished_work_handoff_rejects_stale_record_before_switching_current() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(514), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let previous_current = render.current();
        let mut pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, render, 1).unwrap();
        pending.previous_current = render.finished_work();

        let error = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            render,
            Some(pending),
            2,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostRootFinishedWorkCommitHandoffErrorForCanary::StaleFinishedWorkRecord {
                root,
                expected_current,
                actual_current,
                expected_pending_work,
                actual_pending_work,
                finished_work
            } if root == root_id
                && expected_current == render.finished_work()
                && actual_current == previous_current
                && expected_pending_work == Some(render.finished_work())
                && actual_pending_work == Some(render.finished_work())
                && finished_work == render.finished_work()
        ));
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.finished_work())
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_finished_work_handoff_rejects_already_committed_record_deterministically() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(515), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, render, 1).unwrap();
        commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            render,
            Some(pending),
            2,
        )
        .unwrap();

        let error = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            render,
            Some(pending),
            3,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostRootFinishedWorkCommitHandoffErrorForCanary::AlreadyCommittedFinishedWorkRecord {
                root,
                current,
                finished_work,
                pending_work_after_commit,
                handoff_order,
            } if root == root_id
                && finished_work == render.finished_work()
                && current == render.finished_work()
                && pending_work_after_commit == None
                && handoff_order == 1
        ));
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
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
    fn root_commit_error_option_callback_record_preserves_handles_without_callbacks() {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(
                FakeContainer::new(1),
                RootOptions::new()
                    .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(61))
                    .with_on_caught_error(RootErrorCallbackHandle::from_raw(62))
                    .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(63)),
            )
            .unwrap();
        let wrong_root = FiberRootId::new(root_id.raw() + 1).unwrap();
        update_container(&mut store, root_id, RootElementHandle::from_raw(7), None).unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(wrong_root, Lanes::DEFAULT);

        let error = commit_finished_host_root(&mut store, render).unwrap_err();
        let record = record_root_commit_error_option_callbacks(
            &store,
            root_id,
            Some(render.finished_work()),
            render.render_lanes(),
            error,
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(record.finished_work(), Some(render.finished_work()));
        assert_eq!(record.finished_lanes(), Lanes::DEFAULT);
        assert!(matches!(
            record.error(),
            RootCommitError::PendingPassiveRootMismatch { root, pending_root }
                if *root == root_id && *pending_root == wrong_root
        ));
        assert_eq!(
            record.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(61)
        );
        assert_eq!(
            record.on_caught_error(),
            RootErrorCallbackHandle::from_raw(62)
        );
        assert_eq!(
            record.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(63)
        );
        let callbacks = record.error_option_callbacks();
        assert_eq!(callbacks.root(), root_id);
        assert_eq!(callbacks.phase(), RootErrorOptionCallbackPhase::Commit);
        assert!(record.has_configured_error_callback());
        assert!(!record.root_error_callbacks_invoked());
        assert!(!record.public_error_boundaries_enabled());
        assert!(!record.recoverable_error_compatibility_claimed());
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert!(host.operations().is_empty());
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
    fn root_commit_records_visible_callback_invocation_gate_without_invoking_callbacks() {
        let (mut store, root_id, host) = root_store();
        let first_callback = RootUpdateCallbackHandle::from_raw(177);
        let hidden_callback = RootUpdateCallbackHandle::from_raw(178);
        let second_callback = RootUpdateCallbackHandle::from_raw(179);
        let first = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(17),
            Some(first_callback),
        )
        .unwrap();
        let hidden = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(18),
            Some(hidden_callback),
        )
        .unwrap();
        let second = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(19),
            Some(second_callback),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(hidden.update())
            .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let callbacks = commit.root_update_callbacks();
        let gate = commit.root_update_callback_invocation_gate();
        let records = gate.records();
        let current_queue = store
            .fiber_arena()
            .get(commit.current())
            .unwrap()
            .update_queue();
        let after_commit = store
            .update_queues()
            .peek_root_update_callback_records(current_queue)
            .unwrap();

        assert_eq!(
            callback_handles(callbacks.visible()),
            vec![first_callback, second_callback]
        );
        assert!(callbacks.hidden().is_empty());
        assert_eq!(
            callback_handles(callbacks.deferred_hidden()),
            vec![hidden_callback]
        );
        assert_eq!(gate.len(), 2);
        assert_eq!(gate.hidden_record_count(), 0);
        assert_eq!(gate.deferred_hidden_record_count(), 1);
        assert_root_update_callback_invocation_gate_is_inert(gate);
        assert_eq!(records[0].invocation_order(), 0);
        assert_eq!(records[0].accepted_sequence(), 0);
        assert_eq!(records[0].queue(), callbacks.queue());
        assert_eq!(records[0].update(), first.update());
        assert_eq!(records[0].callback(), first_callback);
        assert_eq!(
            records[0].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert_eq!(records[1].invocation_order(), 1);
        assert_eq!(records[1].accepted_sequence(), 2);
        assert_eq!(records[1].queue(), callbacks.queue());
        assert_eq!(records[1].update(), second.update());
        assert_eq!(records[1].callback(), second_callback);
        assert_eq!(
            records[1].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert!(after_commit.visible().is_empty());
        assert!(after_commit.hidden().is_empty());
        assert_eq!(
            callback_handles(after_commit.deferred_hidden()),
            vec![hidden_callback]
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_callback_drain_diagnostics_record_visible_and_hidden_lane_order() {
        let (mut store, root_id, host) = root_store();
        let first_callback = RootUpdateCallbackHandle::from_raw(5011);
        let hidden_callback = RootUpdateCallbackHandle::from_raw(5012);
        let second_callback = RootUpdateCallbackHandle::from_raw(5013);
        let first = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(5011),
            Some(first_callback),
        )
        .unwrap();
        let hidden = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(5012),
            Some(hidden_callback),
        )
        .unwrap();
        let second = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(5013),
            Some(second_callback),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(hidden.update())
            .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let diagnostics = commit
            .root_update_callback_drain_snapshot_for_canary(&store, 7, render.render_lanes())
            .unwrap();

        assert_eq!(diagnostics.root(), root_id);
        assert_eq!(diagnostics.commit_order(), 7);
        assert_eq!(diagnostics.render_lanes(), Lanes::DEFAULT);
        assert_eq!(diagnostics.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(diagnostics.pending_lanes_after_commit(), Lanes::NO);
        assert_eq!(diagnostics.len(), 3);
        assert_eq!(diagnostics.visible_callback_count(), 2);
        assert_eq!(diagnostics.hidden_callback_count(), 1);
        assert!(diagnostics.has_visible_and_hidden_callbacks());
        assert!(diagnostics.records_in_callback_sequence_order());
        assert!(diagnostics.records_match_commit_lanes());
        assert!(diagnostics.hidden_callbacks_deferred_without_invocation());
        assert!(diagnostics.proves_deterministic_lane_order());
        assert!(!diagnostics.public_callbacks_invoked());
        assert!(!diagnostics.public_root_callback_behavior_exposed());

        let records = diagnostics.records();
        assert_eq!(records[0].callback_order(), 0);
        assert_eq!(records[0].accepted_sequence(), 0);
        assert_eq!(records[0].queue(), commit.root_update_callbacks().queue());
        assert_eq!(records[0].update(), first.update());
        assert_eq!(records[0].callback(), first_callback);
        assert_eq!(
            records[0].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert_eq!(records[0].update_lanes(), Lanes::DEFAULT);
        assert_eq!(records[0].callback_lanes(), Lanes::DEFAULT);
        assert!(records[0].callback_lanes_match_commit());
        assert!(!records[0].public_callback_invoked());

        assert_eq!(records[1].callback_order(), 1);
        assert_eq!(records[1].accepted_sequence(), 1);
        assert_eq!(records[1].update(), hidden.update());
        assert_eq!(records[1].callback(), hidden_callback);
        assert_eq!(
            records[1].visibility(),
            RootUpdateCallbackVisibility::DeferredHidden
        );
        assert_eq!(
            records[1].update_lanes(),
            Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
        );
        assert_eq!(records[1].callback_lanes(), Lanes::DEFAULT);
        assert!(records[1].update_lanes_include_offscreen());
        assert!(records[1].is_hidden_callback());
        assert!(records[1].is_deferred_hidden_callback());
        assert!(records[1].callback_lanes_match_commit());
        assert!(!records[1].public_callback_invoked());

        assert_eq!(records[2].callback_order(), 2);
        assert_eq!(records[2].accepted_sequence(), 2);
        assert_eq!(records[2].update(), second.update());
        assert_eq!(records[2].callback(), second_callback);
        assert_eq!(
            records[2].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert_eq!(records[2].update_lanes(), Lanes::DEFAULT);
        assert_eq!(records[2].callback_lanes(), Lanes::DEFAULT);
        assert!(records[2].callback_lanes_match_commit());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_invocation_execution_gate_drains_visible_callbacks_once_under_test_control() {
        let (mut store, root_id, host) = root_store();
        let first_callback = RootUpdateCallbackHandle::from_raw(277);
        let second_callback = RootUpdateCallbackHandle::from_raw(279);
        let first = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(27),
            Some(first_callback),
        )
        .unwrap();
        let second = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(29),
            Some(second_callback),
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
        let mut control = TestRootUpdateCallbackControl::default();

        let execution = commit.drain_root_update_callbacks_under_test_control(&mut control);

        assert_eq!(execution.source_visible_record_count(), 2);
        assert_eq!(execution.hidden_record_count(), 0);
        assert_eq!(execution.deferred_hidden_record_count(), 0);
        assert_eq!(execution.len(), 2);
        assert_eq!(execution.completed_count(), 2);
        assert_eq!(execution.error_count(), 0);
        assert!(!execution.has_errors());
        assert_eq!(execution.errors(), Vec::new());
        assert_eq!(
            execution.status(),
            RootUpdateCallbackInvocationExecutionGateStatus::TestControlOnly
        );
        assert_eq!(
            execution.blockers(),
            &ROOT_UPDATE_CALLBACK_INVOCATION_EXECUTION_GATE_BLOCKERS
        );
        assert!(execution.did_drain_accepted_visible_callbacks());
        assert!(execution.test_control_invoked_callback_handles());
        assert!(!execution.public_js_callbacks_invoked());
        assert!(!execution.public_root_callback_behavior_exposed());
        assert!(!execution.hidden_callbacks_invoked());
        assert!(!execution.root_error_callbacks_invoked());

        let records = execution.records();
        assert_eq!(records[0].invocation_order(), 0);
        assert_eq!(records[0].accepted_sequence(), 0);
        assert_eq!(records[0].update(), first.update());
        assert_eq!(records[0].callback(), first_callback);
        assert_eq!(
            records[0].status(),
            RootUpdateCallbackInvocationStatus::Completed
        );
        assert_eq!(records[1].invocation_order(), 1);
        assert_eq!(records[1].accepted_sequence(), 1);
        assert_eq!(records[1].update(), second.update());
        assert_eq!(records[1].callback(), second_callback);
        assert_eq!(
            records[1].status(),
            RootUpdateCallbackInvocationStatus::Completed
        );
        assert_eq!(control.calls().len(), 2);
        assert_eq!(control.calls()[0].callback(), first_callback);
        assert_eq!(control.calls()[1].callback(), second_callback);
        assert!(commit.root_update_callback_invocation_gate().is_empty());

        let repeated = commit.drain_root_update_callbacks_under_test_control(&mut control);

        assert_eq!(repeated.source_visible_record_count(), 0);
        assert!(repeated.is_empty());
        assert!(!repeated.did_drain_accepted_visible_callbacks());
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
    fn root_commit_invocation_execution_gate_records_test_control_errors_without_public_callbacks()
    {
        let (mut store, root_id, host) = root_store();
        let first_callback = RootUpdateCallbackHandle::from_raw(377);
        let second_callback = RootUpdateCallbackHandle::from_raw(379);
        let first = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(37),
            Some(first_callback),
        )
        .unwrap();
        let second = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(39),
            Some(second_callback),
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut commit = commit_finished_host_root(&mut store, render).unwrap();
        let second_error = root_callback_error(990);
        let callback_request_count = store.scheduler_bridge().callback_requests().len();
        let mut control = TestRootUpdateCallbackControl::default()
            .with_result(second_callback, Err(second_error));

        let execution = commit.drain_root_update_callbacks_under_test_control(&mut control);

        assert_eq!(execution.len(), 2);
        assert_eq!(execution.completed_count(), 1);
        assert_eq!(execution.error_count(), 1);
        assert!(execution.has_errors());
        assert_eq!(execution.errors(), vec![second_error]);
        assert!(!execution.public_js_callbacks_invoked());
        assert!(!execution.public_root_callback_behavior_exposed());
        assert!(!execution.root_error_callbacks_invoked());
        let records = execution.records();
        assert_eq!(records[0].update(), first.update());
        assert_eq!(records[0].callback(), first_callback);
        assert!(records[0].completed());
        assert_eq!(records[0].error(), None);
        assert_eq!(records[1].update(), second.update());
        assert_eq!(records[1].callback(), second_callback);
        assert!(records[1].errored());
        assert_eq!(records[1].error(), Some(second_error));
        assert_eq!(control.calls().len(), 2);
        assert!(commit.root_update_callback_invocation_gate().is_empty());
        assert_eq!(
            store.scheduler_bridge().callback_requests().len(),
            callback_request_count
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

    fn assert_ref_callback_execution_handoff_keeps_public_blockers(
        handoff: &HostRootRefCallbackExecutionHandoffSnapshot,
    ) {
        assert!(!handoff.callback_refs_invoked());
        assert!(!handoff.object_refs_mutated());
        assert!(!handoff.public_roots_touched());
        assert!(!handoff.root_errors_reported());
        assert!(!handoff.react_dom_ref_compatibility_claimed());
        for record in handoff.records() {
            assert_eq!(
                record.status(),
                HostRootRefCallbackExecutionHandoffStatus::PrivateExecutionHandoff
            );
            assert_eq!(record.blockers(), &REF_CALLBACK_EXECUTION_HANDOFF_BLOCKERS);
        }
    }

    fn assert_ref_cleanup_return_execution_gate_keeps_public_blockers(
        gate: &HostRootRefCleanupReturnExecutionGateSnapshot,
    ) {
        assert!(!gate.callback_refs_invoked());
        assert!(!gate.cleanup_return_callbacks_invoked());
        assert!(!gate.object_refs_mutated());
        assert!(!gate.public_roots_touched());
        assert!(!gate.root_errors_reported());
        assert!(!gate.react_dom_ref_compatibility_claimed());
        for record in gate.records() {
            assert_eq!(
                record.status(),
                HostRootRefCleanupReturnExecutionGateStatus::TestOnlyExecutionGate
            );
            assert_eq!(
                record.blockers(),
                &REF_CLEANUP_RETURN_EXECUTION_GATE_BLOCKERS
            );
        }
    }

    fn assert_root_update_callback_invocation_gate_is_inert(
        gate: &RootUpdateCallbackInvocationGateSnapshot,
    ) {
        assert!(!gate.user_callbacks_invoked());
        assert!(!gate.hidden_callbacks_invoked());
        assert!(!gate.public_root_callback_behavior_exposed());
        for record in gate.records() {
            assert_eq!(
                record.status(),
                RootUpdateCallbackInvocationGateStatus::Blocked
            );
            assert_eq!(
                record.blockers(),
                &ROOT_UPDATE_CALLBACK_INVOCATION_GATE_BLOCKERS
            );
            assert_eq!(record.visibility(), RootUpdateCallbackVisibility::Visible);
        }
    }
}
