use super::*;

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
