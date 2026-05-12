//! Host root ref lifecycle metadata and test-only handoff gates.

use fast_react_core::{
    FiberArena, FiberFlags, FiberId, FiberTag, FiberTopologyError, RefHandle, StateNodeHandle,
};
use fast_react_host_config::{HostFiberTokenPhase, HostFiberTokenTarget, HostTypes};

use crate::{FiberRootId, FiberRootStore, HostFiberTokenId};

use super::{
    HostRootCommitRecord, HostRootMutationApplyLog, HostRootMutationApplyRecord,
    HostRootMutationApplyRecordKind, RootCommitError, host_root_mutation_apply_record_kind_name,
};

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
    pub(super) root: FiberRootId,
    pub(super) fiber: FiberId,
    pub(super) state_node: StateNodeHandle,
    pub(super) ref_handle: RefHandle,
    pub(super) token: HostFiberTokenId,
    pub(super) token_phase: HostFiberTokenPhase,
    pub(super) token_target: HostFiberTokenTarget,
    pub(super) action: HostRootRefCommitAction,
    pub(super) detach_reason: Option<HostRootRefDetachReason>,
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
    pub(super) detach: Vec<HostRootRefCommitRecord>,
    pub(super) attach: Vec<HostRootRefCommitRecord>,
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
    pub(super) records: Vec<HostRootDomRefCallbackCommitGateRecord>,
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
    pub(super) sequence: usize,
    pub(super) root: FiberRootId,
    pub(super) fiber: FiberId,
    pub(super) state_node: StateNodeHandle,
    pub(super) ref_handle: RefHandle,
    pub(super) token: HostFiberTokenId,
    pub(super) token_phase: HostFiberTokenPhase,
    pub(super) token_target: HostFiberTokenTarget,
    pub(super) action: HostRootRefCommitAction,
    pub(super) detach_reason: Option<HostRootRefDetachReason>,
    pub(super) status: HostRootDomRefCallbackCommitGateStatus,
    pub(super) blockers: [HostRootDomRefCallbackCommitGateBlocker; 5],
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

pub(super) const DOM_REF_CALLBACK_GATE_BLOCKERS: [HostRootDomRefCallbackCommitGateBlocker; 5] = [
    HostRootDomRefCallbackCommitGateBlocker::CallbackRefInvocation,
    HostRootDomRefCallbackCommitGateBlocker::ObjectRefMutation,
    HostRootDomRefCallbackCommitGateBlocker::LayoutEffectExecution,
    HostRootDomRefCallbackCommitGateBlocker::PublicInstanceExposure,
    HostRootDomRefCallbackCommitGateBlocker::ReactDomRefCompatibilityClaim,
];

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct HostRootRefCallbackExecutionHandoffSnapshot {
    pub(super) records: Vec<HostRootRefCallbackExecutionHandoffRecord>,
    pub(super) detach_count: usize,
    pub(super) attach_count: usize,
    pub(super) changed_ref_detach_before_attach_count: usize,
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
    pub(super) sequence: usize,
    pub(super) source_gate_sequence: usize,
    pub(super) root: FiberRootId,
    pub(super) fiber: FiberId,
    pub(super) state_node: StateNodeHandle,
    pub(super) ref_handle: RefHandle,
    pub(super) token: HostFiberTokenId,
    pub(super) token_phase: HostFiberTokenPhase,
    pub(super) token_target: HostFiberTokenTarget,
    pub(super) action: HostRootRefCommitAction,
    pub(super) detach_reason: Option<HostRootRefDetachReason>,
    pub(super) execution_phase: HostRootRefCallbackExecutionPhase,
    pub(super) changed_ref_detach_before_attach: bool,
    pub(super) status: HostRootRefCallbackExecutionHandoffStatus,
    pub(super) blockers: [HostRootRefCallbackExecutionHandoffBlocker; 4],
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

pub(super) const REF_CALLBACK_EXECUTION_HANDOFF_BLOCKERS:
    [HostRootRefCallbackExecutionHandoffBlocker; 4] = [
    HostRootRefCallbackExecutionHandoffBlocker::ObjectRefMutation,
    HostRootRefCallbackExecutionHandoffBlocker::PublicRootExecution,
    HostRootRefCallbackExecutionHandoffBlocker::PublicRootErrorRouting,
    HostRootRefCallbackExecutionHandoffBlocker::ReactDomRefCompatibilityClaim,
];

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct HostRootRefCleanupReturnExecutionGateSnapshot {
    pub(super) records: Vec<HostRootRefCleanupReturnExecutionGateRecord>,
    pub(super) cleanup_return_handle_record_gate_count: usize,
    pub(super) cleanup_return_execution_gate_count: usize,
    pub(super) changed_ref_cleanup_before_attach_count: usize,
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
    pub(super) sequence: usize,
    pub(super) source_handoff_sequence: usize,
    pub(super) source_gate_sequence: usize,
    pub(super) root: FiberRootId,
    pub(super) fiber: FiberId,
    pub(super) state_node: StateNodeHandle,
    pub(super) ref_handle: RefHandle,
    pub(super) token: HostFiberTokenId,
    pub(super) token_phase: HostFiberTokenPhase,
    pub(super) token_target: HostFiberTokenTarget,
    pub(super) action: HostRootRefCommitAction,
    pub(super) detach_reason: Option<HostRootRefDetachReason>,
    pub(super) cleanup_return_phase: HostRootRefCleanupReturnExecutionPhase,
    pub(super) cleanup_return_handle_recording_gate: bool,
    pub(super) cleanup_return_execution_gate: bool,
    pub(super) changed_ref_cleanup_before_attach: bool,
    pub(super) status: HostRootRefCleanupReturnExecutionGateStatus,
    pub(super) blockers: [HostRootRefCleanupReturnExecutionGateBlocker; 4],
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

pub(super) const REF_CLEANUP_RETURN_EXECUTION_GATE_BLOCKERS:
    [HostRootRefCleanupReturnExecutionGateBlocker; 4] = [
    HostRootRefCleanupReturnExecutionGateBlocker::ObjectRefMutation,
    HostRootRefCleanupReturnExecutionGateBlocker::PublicRootExecution,
    HostRootRefCleanupReturnExecutionGateBlocker::PublicRootErrorRouting,
    HostRootRefCleanupReturnExecutionGateBlocker::ReactDomRefCompatibilityClaim,
];

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(super) struct PendingRefCommitSnapshot {
    pub(super) detach: Vec<PendingRefCommitRecord>,
    pub(super) attach: Vec<PendingRefCommitRecord>,
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
pub(super) struct PendingRefCommitRecord {
    pub(super) root: FiberRootId,
    pub(super) fiber: FiberId,
    pub(super) state_node: StateNodeHandle,
    pub(super) ref_handle: RefHandle,
    pub(super) action: HostRootRefCommitAction,
    pub(super) detach_reason: Option<HostRootRefDetachReason>,
}

impl HostRootCommitRecord {
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

    #[doc(hidden)]
    #[allow(
        dead_code,
        reason = "crate-private HostComponent ref/update ordering diagnostics are reserved for future ref lifecycle workers"
    )]
    #[must_use]
    pub(crate) fn ref_host_component_update_order_for_canary(
        &self,
    ) -> HostRootRefHostComponentUpdateOrderSnapshotForCanary {
        collect_ref_host_component_update_order_for_canary(
            self.root,
            self.current,
            &self.mutation_apply_log,
            &self.ref_callback_execution_handoff,
        )
    }
}

pub(super) fn collect_pending_ref_commit_metadata(
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

pub(super) fn materialize_ref_commit_metadata<H: HostTypes>(
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

pub(super) fn materialize_dom_ref_callback_commit_gate<H: HostTypes>(
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

pub(super) fn materialize_ref_callback_execution_handoff<H: HostTypes>(
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

pub(super) fn materialize_ref_cleanup_return_execution_gate<H: HostTypes>(
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

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct HostRootRefHostComponentUpdateOrderSnapshotForCanary {
    pub(super) records: Vec<HostRootRefHostComponentUpdateOrderRecordForCanary>,
    pub(super) changed_ref_update_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private HostComponent ref/update ordering diagnostics are reserved for future ref lifecycle workers"
)]
impl HostRootRefHostComponentUpdateOrderSnapshotForCanary {
    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootRefHostComponentUpdateOrderRecordForCanary] {
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
    pub(crate) const fn changed_ref_update_count(&self) -> usize {
        self.changed_ref_update_count
    }

    #[must_use]
    pub(crate) fn records_in_ref_detach_update_attach_order(&self) -> bool {
        self.records.len() == self.changed_ref_update_count * 3
            && self.records.chunks_exact(3).all(|chunk| {
                let detach = chunk[0];
                let update = chunk[1];
                let attach = chunk[2];
                detach.kind() == HostRootRefHostComponentUpdateOrderKindForCanary::RefDetach
                    && update.kind()
                        == HostRootRefHostComponentUpdateOrderKindForCanary::HostComponentUpdate
                    && attach.kind() == HostRootRefHostComponentUpdateOrderKindForCanary::RefAttach
                    && detach.order_group() == update.order_group()
                    && update.order_group() == attach.order_group()
                    && detach.root() == update.root()
                    && update.root() == attach.root()
                    && detach.finished_work() == update.finished_work()
                    && update.finished_work() == attach.finished_work()
                    && detach.current_fiber() == update.current_fiber()
                    && update.current_fiber() == attach.current_fiber()
                    && detach.updated_fiber() == update.updated_fiber()
                    && update.updated_fiber() == attach.updated_fiber()
                    && detach.state_node() == update.state_node()
                    && update.state_node() == attach.state_node()
            })
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
    pub(crate) const fn host_mutations_executed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_roots_touched(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_ref_compatibility_claimed(&self) -> bool {
        false
    }

    fn push_ref_record(
        &mut self,
        root: FiberRootId,
        finished_work: FiberId,
        order_group: usize,
        kind: HostRootRefHostComponentUpdateOrderKindForCanary,
        ref_record: HostRootRefCallbackExecutionHandoffRecord,
        mutation: HostRootMutationApplyRecord,
    ) {
        self.records
            .push(HostRootRefHostComponentUpdateOrderRecordForCanary {
                sequence: self.records.len(),
                order_group,
                kind,
                source_sequence: ref_record.sequence(),
                root,
                finished_work,
                current_fiber: mutation.alternate_fiber(),
                updated_fiber: mutation.fiber(),
                fiber: ref_record.fiber(),
                state_node: ref_record.state_node(),
                ref_handle: ref_record.ref_handle(),
                detach_reason: ref_record.detach_reason(),
                mutation_kind: None,
            });
    }

    fn push_mutation_record(
        &mut self,
        root: FiberRootId,
        finished_work: FiberId,
        order_group: usize,
        source_sequence: usize,
        mutation: HostRootMutationApplyRecord,
    ) {
        self.records
            .push(HostRootRefHostComponentUpdateOrderRecordForCanary {
                sequence: self.records.len(),
                order_group,
                kind: HostRootRefHostComponentUpdateOrderKindForCanary::HostComponentUpdate,
                source_sequence,
                root,
                finished_work,
                current_fiber: mutation.alternate_fiber(),
                updated_fiber: mutation.fiber(),
                fiber: mutation.fiber(),
                state_node: mutation.state_node(),
                ref_handle: RefHandle::NONE,
                detach_reason: None,
                mutation_kind: Some(mutation.kind()),
            });
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootRefHostComponentUpdateOrderRecordForCanary {
    pub(super) sequence: usize,
    pub(super) order_group: usize,
    pub(super) kind: HostRootRefHostComponentUpdateOrderKindForCanary,
    pub(super) source_sequence: usize,
    pub(super) root: FiberRootId,
    pub(super) finished_work: FiberId,
    pub(super) current_fiber: Option<FiberId>,
    pub(super) updated_fiber: FiberId,
    pub(super) fiber: FiberId,
    pub(super) state_node: StateNodeHandle,
    pub(super) ref_handle: RefHandle,
    pub(super) detach_reason: Option<HostRootRefDetachReason>,
    pub(super) mutation_kind: Option<HostRootMutationApplyRecordKind>,
}

#[allow(
    dead_code,
    reason = "crate-private HostComponent ref/update ordering diagnostics are reserved for future ref lifecycle workers"
)]
impl HostRootRefHostComponentUpdateOrderRecordForCanary {
    #[must_use]
    pub(crate) const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn order_group(self) -> usize {
        self.order_group
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostRootRefHostComponentUpdateOrderKindForCanary {
        self.kind
    }

    #[must_use]
    pub(crate) const fn kind_name(self) -> &'static str {
        host_root_ref_host_component_update_order_kind_name(self.kind)
    }

    #[must_use]
    pub(crate) const fn source_sequence(self) -> usize {
        self.source_sequence
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
    pub(crate) const fn current_fiber(self) -> Option<FiberId> {
        self.current_fiber
    }

    #[must_use]
    pub(crate) const fn updated_fiber(self) -> FiberId {
        self.updated_fiber
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
    pub(crate) const fn detach_reason(self) -> Option<HostRootRefDetachReason> {
        self.detach_reason
    }

    #[must_use]
    pub(crate) const fn mutation_kind(self) -> Option<HostRootMutationApplyRecordKind> {
        self.mutation_kind
    }

    #[must_use]
    pub(crate) const fn mutation_kind_name(self) -> Option<&'static str> {
        match self.mutation_kind {
            Some(kind) => Some(host_root_mutation_apply_record_kind_name(kind)),
            None => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootRefHostComponentUpdateOrderKindForCanary {
    RefDetach,
    HostComponentUpdate,
    RefAttach,
}

fn collect_ref_host_component_update_order_for_canary(
    root: FiberRootId,
    finished_work: FiberId,
    mutation_apply_log: &HostRootMutationApplyLog,
    handoff: &HostRootRefCallbackExecutionHandoffSnapshot,
) -> HostRootRefHostComponentUpdateOrderSnapshotForCanary {
    let mut snapshot = HostRootRefHostComponentUpdateOrderSnapshotForCanary::default();

    for (mutation_sequence, mutation) in mutation_apply_log
        .records()
        .iter()
        .copied()
        .enumerate()
        .filter(|(_, record)| {
            record.kind() == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        })
    {
        let Some(current_fiber) = mutation.alternate_fiber() else {
            continue;
        };
        let Some(detach) = handoff.records().iter().copied().find(|record| {
            record.action() == HostRootRefCommitAction::Detach
                && record.detach_reason() == Some(HostRootRefDetachReason::RefChanged)
                && record.root() == root
                && record.fiber() == current_fiber
                && record.state_node() == mutation.state_node()
        }) else {
            continue;
        };
        let Some(attach) = handoff.records().iter().copied().find(|record| {
            record.action() == HostRootRefCommitAction::Attach
                && record.root() == root
                && record.fiber() == mutation.fiber()
                && record.state_node() == mutation.state_node()
                && record.sequence() > detach.sequence()
        }) else {
            continue;
        };

        let order_group = snapshot.changed_ref_update_count();
        snapshot.changed_ref_update_count += 1;
        snapshot.push_ref_record(
            root,
            finished_work,
            order_group,
            HostRootRefHostComponentUpdateOrderKindForCanary::RefDetach,
            detach,
            mutation,
        );
        snapshot.push_mutation_record(
            root,
            finished_work,
            order_group,
            mutation_sequence,
            mutation,
        );
        snapshot.push_ref_record(
            root,
            finished_work,
            order_group,
            HostRootRefHostComponentUpdateOrderKindForCanary::RefAttach,
            attach,
            mutation,
        );
    }

    snapshot
}

const fn host_root_ref_host_component_update_order_kind_name(
    kind: HostRootRefHostComponentUpdateOrderKindForCanary,
) -> &'static str {
    match kind {
        HostRootRefHostComponentUpdateOrderKindForCanary::RefDetach => "ref-detach",
        HostRootRefHostComponentUpdateOrderKindForCanary::HostComponentUpdate => {
            "host-component-update"
        }
        HostRootRefHostComponentUpdateOrderKindForCanary::RefAttach => "ref-attach",
    }
}
