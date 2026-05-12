use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{FiberId, FiberTag, Lanes};
use fast_react_host_config::{
    HostCommit, HostFiberTokenPhase, HostFiberTokenRef, HostFiberTokenTarget, MutationHost,
};

use crate::host_nodes::{HostNodeMetadata, HostNodeValidationError, HostNodeViolation};
use crate::passive_effects::{
    DeletedSubtreeRefCleanupReturnExecutor, DeletedSubtreeRefPassiveCleanupExecutionError,
    DeletedSubtreeRefPassiveCleanupExecutionResult, PassiveEffectDestroyCallbackExecutor,
    PassiveEffectsFlushResult,
    execute_deleted_subtree_ref_and_passive_cleanup_after_commit_for_canary,
};
use crate::root_commit::{
    HostRootDeletionCleanupOrderPhase, HostRootDeletionCleanupRecord,
    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary,
    HostRootDeletionSubtreeHostDetachmentPlanForCanary,
    HostRootFinishedWorkCommitHandoffRecordForCanary, HostRootMutationApplyRecordKind,
};
use crate::test_support::{FakeHostFiberToken, RecordingHost};
use crate::{FiberRootId, FiberRootStore, HostRootCommitRecord};

use super::{
    DetachedHostRecords, HostWorkError, HostWorkResult, TestHostRootMutationApplyStatus,
    TestHostRootMutationHostCall, owned_detached_host_child_for_apply_record,
    owned_detached_host_child_for_fiber,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostRootDeletionCleanupAction {
    DetachDeletedInstance,
    InvalidateDeletedText,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostRootDeletionCleanupStatus {
    Applied(TestHostRootDeletionCleanupAction),
    RecordedOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct TestHostRootDeletionCleanupApplyRecord {
    cleanup: HostRootDeletionCleanupRecord,
    status: TestHostRootDeletionCleanupStatus,
    previous_metadata: Option<HostNodeMetadata>,
}

impl TestHostRootDeletionCleanupApplyRecord {
    #[must_use]
    pub(crate) const fn cleanup(self) -> HostRootDeletionCleanupRecord {
        self.cleanup
    }

    #[must_use]
    pub(crate) const fn status(self) -> TestHostRootDeletionCleanupStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn previous_metadata(self) -> Option<HostNodeMetadata> {
        self.previous_metadata
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestHostRootDeletionCleanupApplyResult {
    root: FiberRootId,
    finished_work: FiberId,
    records: Vec<TestHostRootDeletionCleanupApplyRecord>,
}

impl TestHostRootDeletionCleanupApplyResult {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[TestHostRootDeletionCleanupApplyRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn applied_record_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                matches!(
                    record.status(),
                    TestHostRootDeletionCleanupStatus::Applied(_)
                )
            })
            .count()
    }

    #[must_use]
    pub(crate) fn detached_instance_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.status()
                    == TestHostRootDeletionCleanupStatus::Applied(
                        TestHostRootDeletionCleanupAction::DetachDeletedInstance,
                    )
            })
            .count()
    }

    #[must_use]
    pub(crate) fn invalidated_text_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.status()
                    == TestHostRootDeletionCleanupStatus::Applied(
                        TestHostRootDeletionCleanupAction::InvalidateDeletedText,
                    )
            })
            .count()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct TestHostRootDeletionTeardownExecutionRequestForCanary {
    root: FiberRootId,
    source_handoff_order: usize,
    commit_order: usize,
    request_order: usize,
    previous_current: FiberId,
    finished_work: FiberId,
    committed_current: FiberId,
    finished_lanes: Lanes,
    remaining_lanes: Lanes,
    pending_lanes: Lanes,
    deletion_list_count: usize,
    deleted_root_count: usize,
    ref_cleanup_return_count: usize,
    passive_destroy_count: usize,
    host_node_cleanup_count: usize,
    host_detachment_plan: HostRootDeletionSubtreeHostDetachmentPlanForCanary,
}

impl TestHostRootDeletionTeardownExecutionRequestForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(self) -> usize {
        self.source_handoff_order
    }

    #[must_use]
    pub(crate) const fn commit_order(self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn request_order(self) -> usize {
        self.request_order
    }

    #[must_use]
    pub(crate) const fn previous_current(self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn committed_current(self) -> FiberId {
        self.committed_current
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
    pub(crate) const fn pending_lanes(self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub(crate) const fn deletion_list_count(self) -> usize {
        self.deletion_list_count
    }

    #[must_use]
    pub(crate) const fn deleted_root_count(self) -> usize {
        self.deleted_root_count
    }

    #[must_use]
    pub(crate) const fn ref_cleanup_return_count(self) -> usize {
        self.ref_cleanup_return_count
    }

    #[must_use]
    pub(crate) const fn passive_destroy_count(self) -> usize {
        self.passive_destroy_count
    }

    #[must_use]
    pub(crate) const fn host_node_cleanup_count(self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub(crate) const fn host_detachment_plan(
        self,
    ) -> HostRootDeletionSubtreeHostDetachmentPlanForCanary {
        self.host_detachment_plan
    }

    #[must_use]
    pub(super) fn matches_source_handoff(
        self,
        handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    ) -> bool {
        let commit = handoff.commit();
        let order_gate = commit.deletion_cleanup_order_gate_for_canary();
        self.root == commit.root()
            && self.source_handoff_order == handoff.pending().handoff_order()
            && self.commit_order == handoff.commit_order()
            && self.previous_current == commit.previous_current()
            && self.finished_work == commit.finished_work()
            && self.committed_current == commit.current()
            && self.finished_lanes == commit.finished_lanes()
            && self.remaining_lanes == commit.remaining_lanes()
            && self.pending_lanes == commit.pending_lanes()
            && self.deletion_list_count == commit.deletion_lists().len()
            && self.deleted_root_count
                == commit
                    .deletion_lists()
                    .first()
                    .map(|list| list.deleted().len())
                    .unwrap_or(0)
            && self.ref_cleanup_return_count == order_gate.ref_cleanup_return_count()
            && self.passive_destroy_count == order_gate.passive_destroy_count()
            && self.host_node_cleanup_count == order_gate.host_node_cleanup_count()
            && commit
                .deletion_subtree_host_detachment_plan_for_canary()
                .is_ok_and(|plan| plan == self.host_detachment_plan)
    }

    #[must_use]
    pub(super) const fn has_required_source_evidence(self) -> bool {
        self.deletion_list_count > 0
            && self.deleted_root_count > 0
            && self.ref_cleanup_return_count > 0
            && self.passive_destroy_count > 0
            && self.host_node_cleanup_count > 0
    }

    #[must_use]
    pub(crate) const fn private_test_control_execution_requested(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_unmount_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_ref_or_effect_compatibility_claimed(self) -> bool {
        false
    }

    #[cfg(test)]
    #[must_use]
    pub(crate) const fn with_host_node_cleanup_count_for_canary(mut self, count: usize) -> Self {
        self.host_node_cleanup_count = count;
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestHostRootDeletionTeardownExecutionDiagnosticForCanary {
    request: TestHostRootDeletionTeardownExecutionRequestForCanary,
    ref_passive_cleanup: DeletedSubtreeRefPassiveCleanupExecutionResult,
    host_detachment_status: TestHostRootMutationApplyStatus,
    execution_snapshot: TestHostRootDeletionRefPassiveCleanupExecutionSnapshot,
}

impl TestHostRootDeletionTeardownExecutionDiagnosticForCanary {
    #[must_use]
    pub(crate) const fn request(&self) -> TestHostRootDeletionTeardownExecutionRequestForCanary {
        self.request
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.request.root()
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.request.finished_work()
    }

    #[must_use]
    pub(crate) const fn host_detachment_status(&self) -> TestHostRootMutationApplyStatus {
        self.host_detachment_status
    }

    #[must_use]
    pub(crate) const fn ref_passive_cleanup(
        &self,
    ) -> &DeletedSubtreeRefPassiveCleanupExecutionResult {
        &self.ref_passive_cleanup
    }

    #[must_use]
    pub(crate) const fn execution_snapshot(
        &self,
    ) -> &TestHostRootDeletionRefPassiveCleanupExecutionSnapshot {
        &self.execution_snapshot
    }

    #[must_use]
    pub(crate) fn ref_cleanup_return_callbacks_invoked(&self) -> bool {
        self.ref_passive_cleanup
            .ref_cleanup_return_callbacks_invoked()
    }

    #[must_use]
    pub(crate) fn passive_destroy_callbacks_invoked(&self) -> bool {
        self.ref_passive_cleanup.passive_destroy_callbacks_invoked()
    }

    #[must_use]
    pub(crate) const fn private_host_subtree_detachment_applied(&self) -> bool {
        matches!(
            self.host_detachment_status,
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::RemoveChild
                    | TestHostRootMutationHostCall::RemoveChildFromContainer
            )
        )
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
pub(crate) enum TestHostRootDeletionTeardownExecutionErrorForCanary {
    StaleFinishedWorkEvidence {
        root: FiberRootId,
        commit_order: usize,
        request_order: usize,
    },
    MismatchedRootOwnership {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
    },
    MismatchedFinishedWork {
        root: FiberRootId,
        expected_finished_work: FiberId,
        actual_finished_work: FiberId,
    },
    MissingDeletionTeardownMetadata {
        root: FiberRootId,
        finished_work: FiberId,
    },
    RefPassiveCleanup(DeletedSubtreeRefPassiveCleanupExecutionError),
    HostWork(HostWorkError),
}

impl Display for TestHostRootDeletionTeardownExecutionErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::StaleFinishedWorkEvidence {
                root,
                commit_order,
                request_order,
            } => write!(
                formatter,
                "deleted-subtree teardown execution rejected stale finished-work evidence for root {} commit order {} request order {}",
                root.raw(),
                commit_order,
                request_order
            ),
            Self::MismatchedRootOwnership {
                expected_root,
                actual_root,
            } => write!(
                formatter,
                "deleted-subtree teardown execution root ownership mismatch: expected root {}, found root {}",
                expected_root.raw(),
                actual_root.raw()
            ),
            Self::MismatchedFinishedWork {
                root,
                expected_finished_work,
                actual_finished_work,
            } => write!(
                formatter,
                "deleted-subtree teardown execution finished-work mismatch for root {}: expected fiber slot {}, found fiber slot {}",
                root.raw(),
                expected_finished_work.slot().get(),
                actual_finished_work.slot().get()
            ),
            Self::MissingDeletionTeardownMetadata {
                root,
                finished_work,
            } => write!(
                formatter,
                "deleted-subtree teardown execution for root {} finished work fiber slot {} is missing deletion teardown metadata",
                root.raw(),
                finished_work.slot().get()
            ),
            Self::RefPassiveCleanup(error) => Display::fmt(error, formatter),
            Self::HostWork(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for TestHostRootDeletionTeardownExecutionErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::RefPassiveCleanup(error) => Some(error),
            Self::HostWork(error) => Some(error),
            Self::StaleFinishedWorkEvidence { .. }
            | Self::MismatchedRootOwnership { .. }
            | Self::MismatchedFinishedWork { .. }
            | Self::MissingDeletionTeardownMetadata { .. } => None,
        }
    }
}

impl From<HostWorkError> for TestHostRootDeletionTeardownExecutionErrorForCanary {
    fn from(error: HostWorkError) -> Self {
        Self::HostWork(error)
    }
}

impl From<DeletedSubtreeRefPassiveCleanupExecutionError>
    for TestHostRootDeletionTeardownExecutionErrorForCanary
{
    fn from(error: DeletedSubtreeRefPassiveCleanupExecutionError) -> Self {
        Self::RefPassiveCleanup(error)
    }
}

impl From<HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary>
    for TestHostRootDeletionTeardownExecutionErrorForCanary
{
    fn from(error: HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary) -> Self {
        Self::HostWork(HostWorkError::from(error))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct TestHostRootDeletionSubtreeHostDetachmentApplyResult {
    root: FiberRootId,
    finished_work: FiberId,
    plan: HostRootDeletionSubtreeHostDetachmentPlanForCanary,
    status: TestHostRootMutationApplyStatus,
}

impl TestHostRootDeletionSubtreeHostDetachmentApplyResult {
    #[must_use]
    pub(super) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(super) const fn plan(self) -> HostRootDeletionSubtreeHostDetachmentPlanForCanary {
        self.plan
    }

    #[must_use]
    pub(super) const fn status(self) -> TestHostRootMutationApplyStatus {
        self.status
    }

    #[must_use]
    pub(super) const fn public_unmount_compatibility_claimed(self) -> bool {
        self.plan.public_unmount_compatibility_claimed()
    }

    #[must_use]
    pub(super) const fn broad_host_teardown_enabled(self) -> bool {
        self.plan.broad_host_teardown_enabled()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostRootDeletionRefPassiveCleanupExecutionPhase {
    RefCleanupReturnGate,
    PassiveDestroyCallback,
    HostSubtreeDetach,
    HostNodeCleanup,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct TestHostRootDeletionRefPassiveCleanupExecutionRecord {
    sequence: usize,
    phase: TestHostRootDeletionRefPassiveCleanupExecutionPhase,
    fiber: FiberId,
    deleted_root: FiberId,
    ref_cleanup_return_sequence: Option<usize>,
    passive_destroy_execution_order: Option<usize>,
    host_detachment_cleanup_order_sequence: Option<usize>,
    host_cleanup_sequence: Option<usize>,
}

impl TestHostRootDeletionRefPassiveCleanupExecutionRecord {
    #[must_use]
    pub(crate) const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn phase(self) -> TestHostRootDeletionRefPassiveCleanupExecutionPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn deleted_root(self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub(crate) const fn ref_cleanup_return_sequence(self) -> Option<usize> {
        self.ref_cleanup_return_sequence
    }

    #[must_use]
    pub(crate) const fn passive_destroy_execution_order(self) -> Option<usize> {
        self.passive_destroy_execution_order
    }

    #[must_use]
    pub(crate) const fn host_detachment_cleanup_order_sequence(self) -> Option<usize> {
        self.host_detachment_cleanup_order_sequence
    }

    #[must_use]
    pub(crate) const fn host_cleanup_sequence(self) -> Option<usize> {
        self.host_cleanup_sequence
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestHostRootDeletionRefPassiveCleanupExecutionSnapshot {
    records: Vec<TestHostRootDeletionRefPassiveCleanupExecutionRecord>,
    ref_cleanup_return_gate_count: usize,
    passive_destroy_execution_count: usize,
    host_subtree_detachment_count: usize,
    host_cleanup_apply_count: usize,
}

impl TestHostRootDeletionRefPassiveCleanupExecutionSnapshot {
    #[must_use]
    pub(crate) fn records(&self) -> &[TestHostRootDeletionRefPassiveCleanupExecutionRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub(crate) const fn ref_cleanup_return_gate_count(&self) -> usize {
        self.ref_cleanup_return_gate_count
    }

    #[must_use]
    pub(crate) const fn passive_destroy_execution_count(&self) -> usize {
        self.passive_destroy_execution_count
    }

    #[must_use]
    pub(crate) const fn host_subtree_detachment_count(&self) -> usize {
        self.host_subtree_detachment_count
    }

    #[must_use]
    pub(crate) const fn host_cleanup_apply_count(&self) -> usize {
        self.host_cleanup_apply_count
    }

    #[must_use]
    pub(crate) const fn private_passive_destroy_callbacks_invoked(&self) -> bool {
        self.passive_destroy_execution_count > 0
    }

    #[must_use]
    pub(crate) const fn private_host_subtree_detachment_applied(&self) -> bool {
        self.host_subtree_detachment_count > 0
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

pub(super) const fn managed_child_deletion_cleanup_status_matches_tag(
    status: Option<TestHostRootDeletionCleanupStatus>,
    tag: FiberTag,
) -> bool {
    match tag {
        FiberTag::HostComponent => matches!(
            status,
            Some(TestHostRootDeletionCleanupStatus::Applied(
                TestHostRootDeletionCleanupAction::DetachDeletedInstance,
            ))
        ),
        FiberTag::HostText => matches!(
            status,
            Some(TestHostRootDeletionCleanupStatus::Applied(
                TestHostRootDeletionCleanupAction::InvalidateDeletedText,
            ))
        ),
        _ => false,
    }
}

pub(super) fn apply_test_host_root_deletion_cleanup(
    store: &FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    commit: &HostRootCommitRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootDeletionCleanupApplyResult, HostWorkError> {
    let root = store.root(commit.root())?;
    if root.current() != commit.current() {
        return Err(HostWorkError::CommitCurrentMismatch {
            root: commit.root(),
            expected: commit.current(),
            actual: root.current(),
        });
    }

    let mut records = Vec::new();
    for &cleanup in commit.host_node_deletion_cleanup_log().records() {
        let (status, previous_metadata) =
            apply_test_host_root_deletion_cleanup_record(store, host, cleanup, detached_hosts)?;
        records.push(TestHostRootDeletionCleanupApplyRecord {
            cleanup,
            status,
            previous_metadata,
        });
    }

    Ok(TestHostRootDeletionCleanupApplyResult {
        root: commit.root(),
        finished_work: commit.finished_work(),
        records,
    })
}

pub(crate) fn preflight_test_host_root_deletion_apply_and_cleanup_for_canary(
    store: &FiberRootStore<RecordingHost>,
    commit: &HostRootCommitRecord,
    host_work: &HostWorkResult,
) -> Result<(), HostWorkError> {
    let root = store.root(commit.root())?;
    if root.current() != commit.current() {
        return Err(HostWorkError::CommitCurrentMismatch {
            root: commit.root(),
            expected: commit.current(),
            actual: root.current(),
        });
    }

    let detached_hosts = host_work.detached_hosts();
    for &mutation in commit.mutation_apply_log().records() {
        if matches!(
            mutation.kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
                | HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        ) {
            owned_detached_host_child_for_apply_record(store, detached_hosts, mutation)?;
        }
    }

    for &cleanup in commit.host_node_deletion_cleanup_log().records() {
        preflight_test_host_root_deletion_cleanup_record(store, cleanup, detached_hosts)?;
    }

    Ok(())
}

pub(crate) fn apply_test_host_root_deletion_cleanup_for_canary(
    store: &FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    commit: &HostRootCommitRecord,
    host_work: &mut HostWorkResult,
) -> Result<TestHostRootDeletionCleanupApplyResult, HostWorkError> {
    apply_test_host_root_deletion_cleanup(store, host, commit, host_work.detached_hosts_mut())
}

fn preflight_test_host_root_deletion_cleanup_record(
    store: &FiberRootStore<RecordingHost>,
    cleanup: HostRootDeletionCleanupRecord,
    detached_hosts: &DetachedHostRecords,
) -> Result<(), HostWorkError> {
    if cleanup.state_node().is_none() {
        return Ok(());
    }

    store.host_tokens().validate(
        cleanup.token(),
        cleanup.root(),
        cleanup.fiber(),
        cleanup.token_phase(),
        cleanup.token_target(),
    )?;

    match cleanup.token_target() {
        HostFiberTokenTarget::Instance => {
            let metadata = detached_hosts.instance_metadata(cleanup.state_node())?;
            validate_deletion_cleanup_metadata(cleanup, metadata)
        }
        HostFiberTokenTarget::TextInstance => {
            let metadata = detached_hosts.text_metadata(cleanup.state_node())?;
            validate_deletion_cleanup_metadata(cleanup, metadata)
        }
        HostFiberTokenTarget::HydratableInstance
        | HostFiberTokenTarget::ActivityBoundary
        | HostFiberTokenTarget::SuspenseBoundary => Ok(()),
    }
}

fn validate_deletion_cleanup_metadata(
    cleanup: HostRootDeletionCleanupRecord,
    metadata: HostNodeMetadata,
) -> Result<(), HostWorkError> {
    let violation = if metadata.target() != cleanup.token_target() {
        Some(HostNodeViolation::WrongTarget)
    } else if metadata.root_id() != cleanup.root() {
        Some(HostNodeViolation::WrongRoot)
    } else if metadata.fiber_id() != cleanup.fiber() {
        Some(HostNodeViolation::WrongFiber)
    } else if !metadata.is_active() {
        Some(HostNodeViolation::Stale)
    } else {
        None
    };

    if let Some(violation) = violation {
        return Err(HostNodeValidationError::new(
            cleanup.state_node(),
            HostFiberTokenPhase::Deletion,
            cleanup.token_target(),
            violation,
        )
        .into());
    }

    Ok(())
}

pub(super) fn apply_test_host_root_deletion_subtree_host_detachment_for_canary(
    store: &FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    commit: &HostRootCommitRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootDeletionSubtreeHostDetachmentApplyResult, HostWorkError> {
    let root = store.root(commit.root())?;
    if root.current() != commit.current() {
        return Err(HostWorkError::CommitCurrentMismatch {
            root: commit.root(),
            expected: commit.current(),
            actual: root.current(),
        });
    }

    let plan = commit.deletion_subtree_host_detachment_plan_for_canary()?;
    let child = owned_detached_host_child_for_fiber(
        store,
        detached_hosts,
        plan.root(),
        plan.host_child(),
        plan.host_child_tag(),
        plan.host_child_state_node(),
    )?;
    let status = match store.fiber_arena().get(plan.host_parent())?.tag() {
        FiberTag::HostComponent => {
            let parent_scope = detached_hosts.validated_scope_for_apply_fiber(
                store,
                plan.host_parent_state_node(),
                plan.root(),
                plan.host_parent(),
                HostFiberTokenTarget::Instance,
            )?;
            let parent = detached_hosts
                .nodes
                .instance_mut(plan.host_parent_state_node(), parent_scope)?;
            host.remove_child(parent, child.as_host_child())?;
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
        }
        FiberTag::HostRoot => {
            let mut container = *root.container_info();
            host.remove_child_from_container(&mut container, child.as_host_child())?;
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::RemoveChildFromContainer,
            )
        }
        tag => {
            return Err(HostWorkError::ExpectedFiberTag {
                fiber: plan.host_parent(),
                expected: FiberTag::HostComponent,
                actual: tag,
            });
        }
    };

    Ok(TestHostRootDeletionSubtreeHostDetachmentApplyResult {
        root: commit.root(),
        finished_work: commit.finished_work(),
        plan,
        status,
    })
}

pub(crate) fn test_host_root_deletion_teardown_execution_request_for_canary(
    handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    request_order: usize,
) -> Result<
    TestHostRootDeletionTeardownExecutionRequestForCanary,
    TestHostRootDeletionTeardownExecutionErrorForCanary,
> {
    if !handoff.proves_private_root_finished_work_commit_metadata_handoff() {
        return Err(
            TestHostRootDeletionTeardownExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root: handoff.commit().root(),
                commit_order: handoff.commit_order(),
                request_order,
            },
        );
    }

    let commit = handoff.commit();
    let order_gate = commit.deletion_cleanup_order_gate_for_canary();
    if commit.deletion_lists().is_empty()
        || commit
            .deletion_lists()
            .iter()
            .all(|list| list.deleted().is_empty())
        || commit.host_node_deletion_cleanup_log().records().is_empty()
        || order_gate.ref_cleanup_return_count() == 0
        || order_gate.passive_destroy_count() == 0
        || order_gate.host_node_cleanup_count() == 0
    {
        return Err(
            TestHostRootDeletionTeardownExecutionErrorForCanary::MissingDeletionTeardownMetadata {
                root: commit.root(),
                finished_work: commit.finished_work(),
            },
        );
    }

    let host_detachment_plan = commit.deletion_subtree_host_detachment_plan_for_canary()?;
    let request = TestHostRootDeletionTeardownExecutionRequestForCanary {
        root: commit.root(),
        source_handoff_order: handoff.pending().handoff_order(),
        commit_order: handoff.commit_order(),
        request_order,
        previous_current: commit.previous_current(),
        finished_work: commit.finished_work(),
        committed_current: commit.current(),
        finished_lanes: commit.finished_lanes(),
        remaining_lanes: commit.remaining_lanes(),
        pending_lanes: commit.pending_lanes(),
        deletion_list_count: commit.deletion_lists().len(),
        deleted_root_count: commit.deletion_lists()[0].deleted().len(),
        ref_cleanup_return_count: order_gate.ref_cleanup_return_count(),
        passive_destroy_count: order_gate.passive_destroy_count(),
        host_node_cleanup_count: order_gate.host_node_cleanup_count(),
        host_detachment_plan,
    };
    debug_assert!(request.matches_source_handoff(handoff));
    debug_assert!(request.has_required_source_evidence());
    Ok(request)
}

pub(crate) fn execute_test_host_root_deletion_teardown_after_commit_for_canary<E>(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    source_request: TestHostRootDeletionTeardownExecutionRequestForCanary,
    request: TestHostRootDeletionTeardownExecutionRequestForCanary,
    detached_hosts: &mut DetachedHostRecords,
    executor: &mut E,
) -> Result<
    TestHostRootDeletionTeardownExecutionDiagnosticForCanary,
    TestHostRootDeletionTeardownExecutionErrorForCanary,
>
where
    E: DeletedSubtreeRefCleanupReturnExecutor + PassiveEffectDestroyCallbackExecutor,
{
    let commit = handoff.commit();
    if commit.root() != source_request.root() {
        return Err(
            TestHostRootDeletionTeardownExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root: source_request.root(),
                actual_root: commit.root(),
            },
        );
    }

    if commit.finished_work() != source_request.finished_work() {
        return Err(
            TestHostRootDeletionTeardownExecutionErrorForCanary::MismatchedFinishedWork {
                root: source_request.root(),
                expected_finished_work: source_request.finished_work(),
                actual_finished_work: commit.finished_work(),
            },
        );
    }

    if source_request != request || !source_request.matches_source_handoff(handoff) {
        return Err(
            TestHostRootDeletionTeardownExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root: request.root(),
                commit_order: request.commit_order(),
                request_order: request.request_order(),
            },
        );
    }

    if !source_request.has_required_source_evidence() {
        return Err(
            TestHostRootDeletionTeardownExecutionErrorForCanary::MissingDeletionTeardownMetadata {
                root: source_request.root(),
                finished_work: source_request.finished_work(),
            },
        );
    }

    let root = store.root(request.root()).map_err(HostWorkError::from)?;
    if root.current() != request.committed_current() {
        return Err(HostWorkError::CommitCurrentMismatch {
            root: request.root(),
            expected: request.committed_current(),
            actual: root.current(),
        }
        .into());
    }

    let ref_passive_cleanup =
        execute_deleted_subtree_ref_and_passive_cleanup_after_commit_for_canary(
            store, commit, executor,
        )?;
    let detach_apply = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
        store,
        host,
        commit,
        detached_hosts,
    )?;
    let cleanup_apply = apply_test_host_root_deletion_cleanup(store, host, commit, detached_hosts)?;
    let host_detachment_status = detach_apply.status();
    let execution_snapshot =
        materialize_test_host_root_deletion_ref_passive_cleanup_execution_from_private_cleanup_for_canary(
            &ref_passive_cleanup,
            &detach_apply,
            &cleanup_apply,
        );

    Ok(TestHostRootDeletionTeardownExecutionDiagnosticForCanary {
        request,
        ref_passive_cleanup,
        host_detachment_status,
        execution_snapshot,
    })
}

fn materialize_test_host_root_deletion_ref_passive_cleanup_execution_from_private_cleanup_for_canary(
    ref_passive_cleanup: &DeletedSubtreeRefPassiveCleanupExecutionResult,
    detach_apply: &TestHostRootDeletionSubtreeHostDetachmentApplyResult,
    cleanup_apply: &TestHostRootDeletionCleanupApplyResult,
) -> TestHostRootDeletionRefPassiveCleanupExecutionSnapshot {
    let mut records = Vec::new();
    let mut ref_cleanup_return_gate_count = 0;
    let mut passive_destroy_execution_count = 0;

    for cleanup_record in ref_passive_cleanup.records() {
        match cleanup_record.phase() {
            HostRootDeletionCleanupOrderPhase::RefCleanupReturn => {
                if let Some(execution_order) = cleanup_record.ref_cleanup_return_execution_order() {
                    ref_cleanup_return_gate_count += 1;
                    records.push(TestHostRootDeletionRefPassiveCleanupExecutionRecord {
                        sequence: records.len(),
                        phase: TestHostRootDeletionRefPassiveCleanupExecutionPhase::RefCleanupReturnGate,
                        fiber: cleanup_record.fiber(),
                        deleted_root: cleanup_record.deleted_root(),
                        ref_cleanup_return_sequence: Some(execution_order),
                        passive_destroy_execution_order: None,
                        host_detachment_cleanup_order_sequence: None,
                        host_cleanup_sequence: None,
                    });
                }
            }
            HostRootDeletionCleanupOrderPhase::PassiveDestroy => {
                if let Some(execution_order) = cleanup_record.passive_destroy_execution_order() {
                    passive_destroy_execution_count += 1;
                    records.push(TestHostRootDeletionRefPassiveCleanupExecutionRecord {
                        sequence: records.len(),
                        phase: TestHostRootDeletionRefPassiveCleanupExecutionPhase::PassiveDestroyCallback,
                        fiber: cleanup_record.fiber(),
                        deleted_root: cleanup_record.deleted_root(),
                        ref_cleanup_return_sequence: None,
                        passive_destroy_execution_order: Some(execution_order),
                        host_detachment_cleanup_order_sequence: None,
                        host_cleanup_sequence: None,
                    });
                }
            }
            HostRootDeletionCleanupOrderPhase::HostNodeCleanup => {}
        }
    }

    let plan = detach_apply.plan();
    let host_subtree_detachment_count = usize::from(matches!(
        detach_apply.status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::RemoveChild
                | TestHostRootMutationHostCall::RemoveChildFromContainer
        )
    ));
    if host_subtree_detachment_count == 1 {
        records.push(TestHostRootDeletionRefPassiveCleanupExecutionRecord {
            sequence: records.len(),
            phase: TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostSubtreeDetach,
            fiber: plan.host_child(),
            deleted_root: plan.deleted_root(),
            ref_cleanup_return_sequence: None,
            passive_destroy_execution_order: None,
            host_detachment_cleanup_order_sequence: Some(plan.cleanup_order_sequence()),
            host_cleanup_sequence: None,
        });
    }

    for cleanup_record in cleanup_apply.records() {
        if matches!(
            cleanup_record.status(),
            TestHostRootDeletionCleanupStatus::Applied(_)
        ) {
            let cleanup = cleanup_record.cleanup();
            records.push(TestHostRootDeletionRefPassiveCleanupExecutionRecord {
                sequence: records.len(),
                phase: TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostNodeCleanup,
                fiber: cleanup.fiber(),
                deleted_root: cleanup.deleted_root(),
                ref_cleanup_return_sequence: None,
                passive_destroy_execution_order: None,
                host_detachment_cleanup_order_sequence: None,
                host_cleanup_sequence: Some(cleanup.sequence()),
            });
        }
    }

    TestHostRootDeletionRefPassiveCleanupExecutionSnapshot {
        records,
        ref_cleanup_return_gate_count,
        passive_destroy_execution_count,
        host_subtree_detachment_count,
        host_cleanup_apply_count: cleanup_apply.applied_record_count(),
    }
}

pub(super) fn materialize_test_host_root_deletion_ref_passive_cleanup_execution_for_canary(
    commit: &HostRootCommitRecord,
    passive_flush: &PassiveEffectsFlushResult,
    detach_apply: &TestHostRootDeletionSubtreeHostDetachmentApplyResult,
    cleanup_apply: &TestHostRootDeletionCleanupApplyResult,
) -> TestHostRootDeletionRefPassiveCleanupExecutionSnapshot {
    let order_gate = commit.deletion_cleanup_order_gate_for_canary();
    let mut records = Vec::new();
    let mut ref_cleanup_return_gate_count = 0;
    let mut passive_destroy_execution_count = 0;

    for order_record in order_gate.records() {
        match order_record.phase() {
            HostRootDeletionCleanupOrderPhase::RefCleanupReturn => {
                let ref_cleanup_was_gated = order_record
                    .ref_cleanup_return_sequence()
                    .and_then(|sequence| {
                        commit
                            .ref_cleanup_return_execution_gate()
                            .records()
                            .iter()
                            .find(|record| record.sequence() == sequence)
                    })
                    .map(|record| record.cleanup_return_execution_gate())
                    .unwrap_or(false);
                if ref_cleanup_was_gated {
                    ref_cleanup_return_gate_count += 1;
                    records.push(TestHostRootDeletionRefPassiveCleanupExecutionRecord {
                        sequence: records.len(),
                        phase: TestHostRootDeletionRefPassiveCleanupExecutionPhase::RefCleanupReturnGate,
                        fiber: order_record.fiber(),
                        deleted_root: order_record.deleted_root(),
                        ref_cleanup_return_sequence: order_record.ref_cleanup_return_sequence(),
                        passive_destroy_execution_order: None,
                        host_detachment_cleanup_order_sequence: None,
                        host_cleanup_sequence: None,
                    });
                }
            }
            HostRootDeletionCleanupOrderPhase::PassiveDestroy => {
                let executed_destroy =
                    passive_flush
                        .destroy_callback_executions()
                        .iter()
                        .find(|execution| {
                            execution.fiber() == order_record.fiber()
                                && Some(execution.pending_order())
                                    == order_record.passive_unmount_order()
                        });
                if let Some(execution) = executed_destroy {
                    passive_destroy_execution_count += 1;
                    records.push(TestHostRootDeletionRefPassiveCleanupExecutionRecord {
                        sequence: records.len(),
                        phase: TestHostRootDeletionRefPassiveCleanupExecutionPhase::PassiveDestroyCallback,
                        fiber: order_record.fiber(),
                        deleted_root: order_record.deleted_root(),
                        ref_cleanup_return_sequence: None,
                        passive_destroy_execution_order: Some(execution.execution_order()),
                        host_detachment_cleanup_order_sequence: None,
                        host_cleanup_sequence: None,
                    });
                }
            }
            HostRootDeletionCleanupOrderPhase::HostNodeCleanup => {}
        }
    }

    let plan = detach_apply.plan();
    let host_subtree_detachment_count = usize::from(matches!(
        detach_apply.status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::RemoveChild
                | TestHostRootMutationHostCall::RemoveChildFromContainer
        )
    ));
    if host_subtree_detachment_count == 1 {
        records.push(TestHostRootDeletionRefPassiveCleanupExecutionRecord {
            sequence: records.len(),
            phase: TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostSubtreeDetach,
            fiber: plan.host_child(),
            deleted_root: plan.deleted_root(),
            ref_cleanup_return_sequence: None,
            passive_destroy_execution_order: None,
            host_detachment_cleanup_order_sequence: Some(plan.cleanup_order_sequence()),
            host_cleanup_sequence: None,
        });
    }

    for cleanup_record in cleanup_apply.records() {
        if matches!(
            cleanup_record.status(),
            TestHostRootDeletionCleanupStatus::Applied(_)
        ) {
            let cleanup = cleanup_record.cleanup();
            records.push(TestHostRootDeletionRefPassiveCleanupExecutionRecord {
                sequence: records.len(),
                phase: TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostNodeCleanup,
                fiber: cleanup.fiber(),
                deleted_root: cleanup.deleted_root(),
                ref_cleanup_return_sequence: None,
                passive_destroy_execution_order: None,
                host_detachment_cleanup_order_sequence: None,
                host_cleanup_sequence: Some(cleanup.sequence()),
            });
        }
    }

    TestHostRootDeletionRefPassiveCleanupExecutionSnapshot {
        records,
        ref_cleanup_return_gate_count,
        passive_destroy_execution_count,
        host_subtree_detachment_count,
        host_cleanup_apply_count: cleanup_apply.applied_record_count(),
    }
}

fn apply_test_host_root_deletion_cleanup_record(
    store: &FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    cleanup: HostRootDeletionCleanupRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<(TestHostRootDeletionCleanupStatus, Option<HostNodeMetadata>), HostWorkError> {
    if cleanup.state_node().is_none() {
        return Ok((TestHostRootDeletionCleanupStatus::RecordedOnly, None));
    }

    store.host_tokens().validate(
        cleanup.token(),
        cleanup.root(),
        cleanup.fiber(),
        cleanup.token_phase(),
        cleanup.token_target(),
    )?;

    match cleanup.token_target() {
        HostFiberTokenTarget::Instance => {
            let previous_metadata =
                apply_deleted_instance_cleanup_record(host, cleanup, detached_hosts)?;
            Ok((
                TestHostRootDeletionCleanupStatus::Applied(
                    TestHostRootDeletionCleanupAction::DetachDeletedInstance,
                ),
                Some(previous_metadata),
            ))
        }
        HostFiberTokenTarget::TextInstance => {
            let previous_metadata = apply_deleted_text_cleanup_record(cleanup, detached_hosts)?;
            Ok((
                TestHostRootDeletionCleanupStatus::Applied(
                    TestHostRootDeletionCleanupAction::InvalidateDeletedText,
                ),
                Some(previous_metadata),
            ))
        }
        HostFiberTokenTarget::HydratableInstance
        | HostFiberTokenTarget::ActivityBoundary
        | HostFiberTokenTarget::SuspenseBoundary => {
            Ok((TestHostRootDeletionCleanupStatus::RecordedOnly, None))
        }
    }
}

fn apply_deleted_instance_cleanup_record(
    host: &mut RecordingHost,
    cleanup: HostRootDeletionCleanupRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<HostNodeMetadata, HostWorkError> {
    let scope = detached_hosts.scope(cleanup.state_node(), HostFiberTokenTarget::Instance)?;
    let instance = detached_hosts
        .nodes
        .instance(cleanup.state_node(), scope)?
        .clone();
    let fake_token = FakeHostFiberToken(cleanup.token().raw());
    host.detach_deleted_instance(
        HostFiberTokenRef::new(&fake_token, cleanup.token_phase(), cleanup.token_target()),
        instance,
    )?;
    Ok(detached_hosts.nodes.invalidate_deleted_instance(
        cleanup.state_node(),
        cleanup.root(),
        cleanup.fiber(),
    )?)
}

fn apply_deleted_text_cleanup_record(
    cleanup: HostRootDeletionCleanupRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<HostNodeMetadata, HostWorkError> {
    let scope = detached_hosts.scope(cleanup.state_node(), HostFiberTokenTarget::TextInstance)?;
    detached_hosts.nodes.text(cleanup.state_node(), scope)?;
    Ok(detached_hosts.nodes.invalidate_deleted_text(
        cleanup.state_node(),
        cleanup.root(),
        cleanup.fiber(),
    )?)
}
