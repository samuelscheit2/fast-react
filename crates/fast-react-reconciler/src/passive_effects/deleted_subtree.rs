use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{FiberId, HookEffectCallbackHandle, RefHandle, StateNodeHandle};
use fast_react_host_config::{HostFiberTokenPhase, HostFiberTokenTarget, HostTypes};

use crate::function_component::FunctionComponentHookRenderStore;
use crate::host_tokens::HostFiberTokenId;
use crate::root_commit::{
    FunctionComponentDeletedSubtreePassiveEffectsSnapshot,
    FunctionComponentPendingPassiveEffectPhaseCommitRecord, HostRootDeletionCleanupOrderGateRecord,
    HostRootDeletionCleanupOrderPhase, HostRootRefCleanupReturnExecutionGateRecord,
    HostRootRefCommitAction, HostRootRefDetachReason, PendingPassiveCommitHandoff,
};
use crate::root_config::{
    PendingPassiveEffectOrder, PendingPassiveEffectPhase, PendingPassiveState,
    PendingPassiveUnmountOrigin,
};
use crate::{FiberRootId, FiberRootStore, HostRootCommitRecord};

use super::{
    EffectLifecycleExecutionEvidenceError, EffectLifecycleExecutionKind,
    EffectLifecycleExecutionPhase, EffectLifecycleExecutionSnapshot,
    PassiveEffectDestroyCallbackExecutor, PassiveEffectsFlushError, PassiveEffectsFlushResult,
};

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
    super::flush_passive_effects_after_commit_inner(
        store,
        commit,
        super::PassiveEffectRecordSource::CommittedDeletedSubtreeEffects,
        None,
        Some(destroy_executor),
        None,
    )
}

#[allow(
    dead_code,
    reason = "crate-private deleted-subtree passive destroy clear-before-invoke diagnostic for deterministic canaries"
)]
pub(crate) fn flush_passive_effects_after_commit_with_deleted_subtree_destroy_handle_clear_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    hook_store: &mut FunctionComponentHookRenderStore,
    destroy_executor: &mut impl PassiveEffectDestroyCallbackExecutor,
) -> Result<PassiveEffectsFlushResult, PassiveEffectsFlushError> {
    super::flush_passive_effects_after_commit_inner(
        store,
        commit,
        super::PassiveEffectRecordSource::CommittedDeletedSubtreeEffects,
        Some(hook_store),
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
    reason = "crate-private deleted-subtree unmount lifecycle execution evidence for deterministic canaries"
)]
pub(crate) fn record_deleted_subtree_unmount_effect_lifecycle_execution_evidence_for_canary(
    commit: &HostRootCommitRecord,
    passive_flush: &PassiveEffectsFlushResult,
) -> Result<EffectLifecycleExecutionSnapshot, EffectLifecycleExecutionEvidenceError> {
    super::validate_lifecycle_root_metadata(
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
        .filter(|record| record.phase() == HostRootDeletionCleanupOrderPhase::HostNodeCleanup)
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
                record.phase() == HostRootDeletionCleanupOrderPhase::PassiveDestroy
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

#[allow(
    dead_code,
    reason = "crate-private deleted-subtree unmount lifecycle execution evidence for deterministic canaries"
)]
impl EffectLifecycleExecutionSnapshot {
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
}

pub(super) fn validate_committed_deleted_subtree_passive_effects(
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
