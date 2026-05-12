use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{FiberFlags, FiberId, FiberTag, Lanes, StateNodeHandle};

use crate::root_commit::{
    HostRootFinishedWorkCommitHandoffErrorForCanary,
    HostRootFinishedWorkCommitHandoffRecordForCanary, HostRootMutationApplyRecord,
    HostRootMutationApplyRecordKind, HostRootMutationApplyRecordSource,
    HostRootMutationPhaseRecordKind, HostRootPlacementSiblingStatus,
};
use crate::test_support::RecordingHost;
use crate::{FiberRootId, FiberRootStore, HostRootCommitRecord};

use super::{
    HostWorkError, HostWorkResult, TestHostRootMutationApplyStatus, TestHostRootMutationHostCall,
    apply_test_host_root_commit_mutations_for_canary,
    apply_test_host_root_deletion_cleanup_for_canary, owned_detached_host_child_for_apply_record,
    owned_detached_host_child_for_fiber,
    preflight_test_host_root_deletion_apply_and_cleanup_for_canary,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct RootChildReplacementExecutionIdentityForCanary {
    root: FiberRootId,
    request_order: usize,
    finished_lanes: Lanes,
    finished_work: FiberId,
    committed_current: FiberId,
    deleted_current: FiberId,
    replacement_child: FiberId,
    stable_previous_sibling: Option<FiberId>,
    stable_previous_sibling_current: Option<FiberId>,
    stable_previous_sibling_state_node: StateNodeHandle,
    placement_sibling_status: Option<HostRootPlacementSiblingStatus>,
    placement_sibling: Option<FiberId>,
    placement_sibling_state_node: StateNodeHandle,
    mutation_apply_record_count: usize,
    deletion_cleanup_record_count: usize,
    host_work_epoch: usize,
}

impl HostWorkResult {
    fn root_child_replacement_execution_identity(
        &self,
        request: TestHostRootChildReplacementExecutionRequestForCanary,
    ) -> RootChildReplacementExecutionIdentityForCanary {
        RootChildReplacementExecutionIdentityForCanary {
            root: request.root(),
            request_order: request.request_order(),
            finished_lanes: request.finished_lanes(),
            finished_work: request.finished_work(),
            committed_current: request.committed_current(),
            deleted_current: request.deleted_current(),
            replacement_child: request.replacement_child(),
            stable_previous_sibling: request.stable_previous_sibling(),
            stable_previous_sibling_current: request.stable_previous_sibling_current(),
            stable_previous_sibling_state_node: request.stable_previous_sibling_state_node(),
            placement_sibling_status: request.placement_sibling_status(),
            placement_sibling: request.placement_sibling(),
            placement_sibling_state_node: request.placement_sibling_state_node(),
            mutation_apply_record_count: request.mutation_apply_record_count(),
            deletion_cleanup_record_count: request.deletion_cleanup_record_count(),
            host_work_epoch: self.sync_flush_host_work_epoch,
        }
    }

    fn has_consumed_root_child_replacement_execution(
        &self,
        identity: RootChildReplacementExecutionIdentityForCanary,
    ) -> bool {
        self.consumed_root_child_replacements
            .iter()
            .any(|consumed| *consumed == identity)
    }

    fn mark_root_child_replacement_execution_consumed(
        &mut self,
        identity: RootChildReplacementExecutionIdentityForCanary,
    ) {
        self.consumed_root_child_replacements.push(identity);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostRootChildReplacementExecutionBlockerForCanary {
    PublicRootRendering,
    ReactDomCompatibility,
    TestRendererCompatibility,
    NativeRendererCompatibility,
    MultiLevelReplacementCompatibility,
}

pub(super) const TEST_HOST_ROOT_CHILD_REPLACEMENT_EXECUTION_BLOCKERS:
    [TestHostRootChildReplacementExecutionBlockerForCanary; 5] = [
    TestHostRootChildReplacementExecutionBlockerForCanary::PublicRootRendering,
    TestHostRootChildReplacementExecutionBlockerForCanary::ReactDomCompatibility,
    TestHostRootChildReplacementExecutionBlockerForCanary::TestRendererCompatibility,
    TestHostRootChildReplacementExecutionBlockerForCanary::NativeRendererCompatibility,
    TestHostRootChildReplacementExecutionBlockerForCanary::MultiLevelReplacementCompatibility,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct TestHostRootChildReplacementExecutionRequestForCanary {
    pub(super) root: FiberRootId,
    pub(super) source_handoff_order: usize,
    pub(super) commit_order: usize,
    pub(super) request_order: usize,
    pub(super) previous_current: FiberId,
    pub(super) finished_work: FiberId,
    pub(super) committed_current: FiberId,
    pub(super) finished_lanes: Lanes,
    pub(super) remaining_lanes: Lanes,
    pub(super) pending_lanes: Lanes,
    pub(super) deletion_record_index: usize,
    pub(super) placement_record_index: usize,
    pub(super) deleted_current: FiberId,
    pub(super) replacement_child: FiberId,
    pub(super) deleted_tag: FiberTag,
    pub(super) replacement_tag: FiberTag,
    pub(super) stable_previous_sibling: Option<FiberId>,
    pub(super) stable_previous_sibling_current: Option<FiberId>,
    pub(super) stable_previous_sibling_tag: Option<FiberTag>,
    pub(super) stable_previous_sibling_state_node: StateNodeHandle,
    pub(super) placement_sibling_status: Option<HostRootPlacementSiblingStatus>,
    pub(super) placement_sibling: Option<FiberId>,
    pub(super) placement_sibling_tag: Option<FiberTag>,
    pub(super) placement_sibling_state_node: StateNodeHandle,
    pub(super) placement_skipped_pending_sibling_count: usize,
    pub(super) deletion_mutation: HostRootMutationApplyRecord,
    pub(super) placement_mutation: HostRootMutationApplyRecord,
    pub(super) mutation_apply_record_count: usize,
    pub(super) deletion_cleanup_record_count: usize,
}

impl TestHostRootChildReplacementExecutionRequestForCanary {
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
    pub(crate) const fn deletion_record_index(self) -> usize {
        self.deletion_record_index
    }

    #[must_use]
    pub(crate) const fn placement_record_index(self) -> usize {
        self.placement_record_index
    }

    #[must_use]
    pub(crate) const fn deleted_current(self) -> FiberId {
        self.deleted_current
    }

    #[must_use]
    pub(crate) const fn replacement_child(self) -> FiberId {
        self.replacement_child
    }

    #[must_use]
    pub(crate) const fn deleted_tag(self) -> FiberTag {
        self.deleted_tag
    }

    #[must_use]
    pub(crate) const fn replacement_tag(self) -> FiberTag {
        self.replacement_tag
    }

    #[must_use]
    pub(crate) const fn stable_previous_sibling(self) -> Option<FiberId> {
        self.stable_previous_sibling
    }

    #[must_use]
    pub(crate) const fn stable_previous_sibling_current(self) -> Option<FiberId> {
        self.stable_previous_sibling_current
    }

    #[must_use]
    pub(crate) const fn stable_previous_sibling_tag(self) -> Option<FiberTag> {
        self.stable_previous_sibling_tag
    }

    #[must_use]
    pub(crate) const fn stable_previous_sibling_state_node(self) -> StateNodeHandle {
        self.stable_previous_sibling_state_node
    }

    #[must_use]
    pub(crate) const fn placement_sibling_status(self) -> Option<HostRootPlacementSiblingStatus> {
        self.placement_sibling_status
    }

    #[must_use]
    pub(crate) const fn placement_sibling(self) -> Option<FiberId> {
        self.placement_sibling
    }

    #[must_use]
    pub(crate) const fn placement_sibling_tag(self) -> Option<FiberTag> {
        self.placement_sibling_tag
    }

    #[must_use]
    pub(crate) const fn placement_sibling_state_node(self) -> StateNodeHandle {
        self.placement_sibling_state_node
    }

    #[must_use]
    pub(crate) const fn placement_skipped_pending_sibling_count(self) -> usize {
        self.placement_skipped_pending_sibling_count
    }

    #[must_use]
    pub(crate) const fn deletion_mutation(self) -> HostRootMutationApplyRecord {
        self.deletion_mutation
    }

    #[must_use]
    pub(crate) const fn placement_mutation(self) -> HostRootMutationApplyRecord {
        self.placement_mutation
    }

    #[must_use]
    pub(crate) const fn mutation_apply_record_count(self) -> usize {
        self.mutation_apply_record_count
    }

    #[must_use]
    pub(crate) const fn deletion_cleanup_record_count(self) -> usize {
        self.deletion_cleanup_record_count
    }

    #[must_use]
    pub(crate) const fn deletion_precedes_placement(self) -> bool {
        self.deletion_record_index < self.placement_record_index
    }

    #[must_use]
    pub(crate) fn has_required_source_evidence(self) -> bool {
        self.mutation_apply_record_count == 2
            && self.deletion_cleanup_record_count > 0
            && self.deletion_precedes_placement()
            && self.deleted_tag != self.replacement_tag
            && self.deletion_mutation.parent_tag() == FiberTag::HostRoot
            && self.placement_mutation.parent_tag() == FiberTag::HostRoot
            && matches!(
                self.deletion_mutation.source(),
                HostRootMutationApplyRecordSource::DeletionList(_)
            )
            && self.placement_mutation.source()
                == HostRootMutationApplyRecordSource::MutationPhase(
                    HostRootMutationPhaseRecordKind::Placement,
                )
            && self.deletion_mutation.kind()
                == HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
            && root_child_replacement_placement_order_evidence_is_supported(self)
            && root_child_replacement_stable_previous_sibling_evidence_is_supported(self)
            && self.deletion_mutation.effect_flag() == FiberFlags::CHILD_DELETION
            && self.placement_mutation.effect_flag() == FiberFlags::PLACEMENT
            && !self.deletion_mutation.state_node().is_none()
            && !self.placement_mutation.state_node().is_none()
            && self.placement_mutation.alternate_fiber().is_none()
    }

    #[must_use]
    pub(crate) fn matches_source_handoff(
        self,
        handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    ) -> bool {
        let commit = handoff.commit();
        let records = commit.mutation_apply_log().records();
        self.root == commit.root()
            && self.source_handoff_order == handoff.pending().handoff_order()
            && self.commit_order == handoff.commit_order()
            && self.previous_current == commit.previous_current()
            && self.finished_work == commit.finished_work()
            && self.committed_current == commit.current()
            && self.finished_lanes == commit.finished_lanes()
            && self.remaining_lanes == commit.remaining_lanes()
            && self.pending_lanes == commit.pending_lanes()
            && self.mutation_apply_record_count == records.len()
            && self.deletion_cleanup_record_count
                == commit.host_node_deletion_cleanup_log().records().len()
            && records
                .get(self.deletion_record_index)
                .is_some_and(|record| *record == self.deletion_mutation)
            && records
                .get(self.placement_record_index)
                .is_some_and(|record| *record == self.placement_mutation)
    }

    #[must_use]
    pub(crate) const fn public_root_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_renderer_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn stable_sibling_insert_before_order_required(self) -> bool {
        matches!(
            self.placement_sibling_status,
            Some(HostRootPlacementSiblingStatus::InsertBefore)
        )
    }
}

fn root_child_replacement_placement_order_evidence_is_supported(
    request: TestHostRootChildReplacementExecutionRequestForCanary,
) -> bool {
    let placement_sibling = request.placement_mutation().placement_sibling();
    if request.placement_sibling_status != placement_sibling.map(|sibling| sibling.status())
        || request.placement_sibling != placement_sibling.and_then(|sibling| sibling.sibling())
        || request.placement_sibling_tag
            != placement_sibling.and_then(|sibling| sibling.sibling_tag())
        || request.placement_sibling_state_node
            != placement_sibling
                .map(|sibling| sibling.sibling_state_node())
                .unwrap_or(StateNodeHandle::NONE)
        || request.placement_skipped_pending_sibling_count
            != placement_sibling
                .map(|sibling| sibling.skipped_pending_sibling_count())
                .unwrap_or(0)
    {
        return false;
    }

    match request.placement_mutation().kind() {
        HostRootMutationApplyRecordKind::AppendPlacementToContainer => {
            matches!(
                request.placement_sibling_status,
                Some(HostRootPlacementSiblingStatus::Append)
            ) && request.placement_sibling.is_none()
                && request.placement_sibling_tag.is_none()
                && request.placement_sibling_state_node.is_none()
        }
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore => {
            matches!(
                request.placement_sibling_status,
                Some(HostRootPlacementSiblingStatus::InsertBefore)
            ) && request.placement_sibling.is_some()
                && request.placement_sibling_tag == Some(FiberTag::HostText)
                && !request.placement_sibling_state_node.is_none()
                && request.placement_skipped_pending_sibling_count == 0
        }
        _ => false,
    }
}

fn root_child_replacement_stable_previous_sibling_evidence_is_supported(
    request: TestHostRootChildReplacementExecutionRequestForCanary,
) -> bool {
    match (
        request.stable_previous_sibling,
        request.stable_previous_sibling_current,
        request.stable_previous_sibling_tag,
    ) {
        (None, None, None) => request.stable_previous_sibling_state_node.is_none(),
        (Some(_), Some(_), Some(FiberTag::HostText)) => {
            !request.stable_previous_sibling_state_node.is_none()
                && matches!(
                    request.placement_sibling_status,
                    Some(HostRootPlacementSiblingStatus::InsertBefore)
                )
                && request.placement_sibling.is_some()
        }
        _ => false,
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestHostRootChildReplacementExecutionDiagnosticForCanary {
    request: TestHostRootChildReplacementExecutionRequestForCanary,
    deletion_status: TestHostRootMutationApplyStatus,
    placement_status: TestHostRootMutationApplyStatus,
    applied_host_call_count: usize,
    recorded_only_count: usize,
    deletion_cleanup_apply_count: usize,
    blockers: [TestHostRootChildReplacementExecutionBlockerForCanary; 5],
}

impl TestHostRootChildReplacementExecutionDiagnosticForCanary {
    #[must_use]
    pub(crate) const fn request(&self) -> TestHostRootChildReplacementExecutionRequestForCanary {
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
    pub(crate) const fn deleted_current(&self) -> FiberId {
        self.request.deleted_current()
    }

    #[must_use]
    pub(crate) const fn replacement_child(&self) -> FiberId {
        self.request.replacement_child()
    }

    #[must_use]
    pub(crate) const fn deletion_mutation(&self) -> HostRootMutationApplyRecord {
        self.request.deletion_mutation()
    }

    #[must_use]
    pub(crate) const fn placement_mutation(&self) -> HostRootMutationApplyRecord {
        self.request.placement_mutation()
    }

    #[must_use]
    pub(crate) const fn deletion_status(&self) -> TestHostRootMutationApplyStatus {
        self.deletion_status
    }

    #[must_use]
    pub(crate) const fn placement_status(&self) -> TestHostRootMutationApplyStatus {
        self.placement_status
    }

    #[must_use]
    pub(crate) const fn applied_host_call_count(&self) -> usize {
        self.applied_host_call_count
    }

    #[must_use]
    pub(crate) const fn recorded_only_count(&self) -> usize {
        self.recorded_only_count
    }

    #[must_use]
    pub(crate) const fn deletion_cleanup_apply_count(&self) -> usize {
        self.deletion_cleanup_apply_count
    }

    #[must_use]
    pub(crate) const fn blockers(
        &self,
    ) -> &[TestHostRootChildReplacementExecutionBlockerForCanary; 5] {
        &self.blockers
    }

    #[must_use]
    pub(crate) const fn private_test_host_replacement_executed(&self) -> bool {
        matches!(
            self.deletion_status,
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::RemoveChildFromContainer
            )
        ) && matches!(
            self.placement_status,
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer
                    | TestHostRootMutationHostCall::InsertInContainerBefore
            )
        )
    }

    #[must_use]
    pub(crate) const fn deletion_precedes_placement(&self) -> bool {
        self.request.deletion_precedes_placement()
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn react_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn native_renderer_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn multi_level_replacement_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum TestHostRootChildReplacementExecutionErrorForCanary {
    FinishedWorkHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    HostWork(HostWorkError),
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
    MissingRootChildReplacementEvidence {
        root: FiberRootId,
        finished_work: FiberId,
        deletion_record_count: usize,
        placement_record_count: usize,
        mutation_apply_record_count: usize,
    },
    SameTagReplacement {
        root: FiberRootId,
        finished_work: FiberId,
        tag: FiberTag,
    },
    UnsupportedReplacementEvidence {
        root: FiberRootId,
        finished_work: FiberId,
    },
    ReplacementMutationNotApplied {
        root: FiberRootId,
        finished_work: FiberId,
        fiber: FiberId,
        status: Option<TestHostRootMutationApplyStatus>,
    },
    DuplicateExecution {
        root: FiberRootId,
        finished_work: FiberId,
        request_order: usize,
    },
}

impl Display for TestHostRootChildReplacementExecutionErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FinishedWorkHandoff(error) => Display::fmt(error, formatter),
            Self::HostWork(error) => Display::fmt(error, formatter),
            Self::StaleFinishedWorkEvidence {
                root,
                commit_order,
                request_order,
            } => write!(
                formatter,
                "root {} child replacement execution rejected stale finished-work evidence for commit order {} request order {}",
                root.raw(),
                commit_order,
                request_order
            ),
            Self::MismatchedRootOwnership {
                expected_root,
                actual_root,
            } => write!(
                formatter,
                "root child replacement execution root ownership mismatch: expected root {}, found root {}",
                expected_root.raw(),
                actual_root.raw()
            ),
            Self::MismatchedFinishedWork {
                root,
                expected_finished_work,
                actual_finished_work,
            } => write!(
                formatter,
                "root {} child replacement execution finished-work mismatch: expected fiber slot {}, found fiber slot {}",
                root.raw(),
                expected_finished_work.slot().get(),
                actual_finished_work.slot().get()
            ),
            Self::MissingRootChildReplacementEvidence {
                root,
                finished_work,
                deletion_record_count,
                placement_record_count,
                mutation_apply_record_count,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} lacks exact root child replacement evidence: {deletion_record_count} deletion records, {placement_record_count} placement records, {mutation_apply_record_count} mutation apply records",
                root.raw(),
                finished_work.slot().get()
            ),
            Self::SameTagReplacement {
                root,
                finished_work,
                tag,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} is not a tag-changing root child replacement; both children are {:?}",
                root.raw(),
                finished_work.slot().get(),
                tag
            ),
            Self::UnsupportedReplacementEvidence {
                root,
                finished_work,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} has unsupported root child replacement evidence",
                root.raw(),
                finished_work.slot().get()
            ),
            Self::ReplacementMutationNotApplied {
                root,
                finished_work,
                fiber,
                status,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} did not apply private root child replacement mutation for fiber slot {}; status was {:?}",
                root.raw(),
                finished_work.slot().get(),
                fiber.slot().get(),
                status
            ),
            Self::DuplicateExecution {
                root,
                finished_work,
                request_order,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} already consumed private root child replacement request order {}",
                root.raw(),
                finished_work.slot().get(),
                request_order
            ),
        }
    }
}

impl Error for TestHostRootChildReplacementExecutionErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FinishedWorkHandoff(error) => Some(error.as_ref()),
            Self::HostWork(error) => Some(error),
            Self::StaleFinishedWorkEvidence { .. }
            | Self::MismatchedRootOwnership { .. }
            | Self::MismatchedFinishedWork { .. }
            | Self::MissingRootChildReplacementEvidence { .. }
            | Self::SameTagReplacement { .. }
            | Self::UnsupportedReplacementEvidence { .. }
            | Self::ReplacementMutationNotApplied { .. }
            | Self::DuplicateExecution { .. } => None,
        }
    }
}

impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for TestHostRootChildReplacementExecutionErrorForCanary
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkHandoff(Box::new(error))
    }
}

impl From<HostWorkError> for TestHostRootChildReplacementExecutionErrorForCanary {
    fn from(error: HostWorkError) -> Self {
        Self::HostWork(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct RootChildReplacementRecordsForCanary {
    deletion_record_index: usize,
    placement_record_index: usize,
    deletion_mutation: HostRootMutationApplyRecord,
    placement_mutation: HostRootMutationApplyRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct RootChildReplacementStablePreviousSiblingEvidenceForCanary {
    sibling: Option<FiberId>,
    current: Option<FiberId>,
    tag: Option<FiberTag>,
    state_node: StateNodeHandle,
}

impl RootChildReplacementStablePreviousSiblingEvidenceForCanary {
    const NONE: Self = Self {
        sibling: None,
        current: None,
        tag: None,
        state_node: StateNodeHandle::NONE,
    };
}

pub(crate) fn test_host_root_child_replacement_execution_request_for_canary(
    store: &FiberRootStore<RecordingHost>,
    handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    request_order: usize,
) -> Result<
    TestHostRootChildReplacementExecutionRequestForCanary,
    TestHostRootChildReplacementExecutionErrorForCanary,
> {
    if !handoff.proves_private_root_finished_work_commit_metadata_handoff() {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root: handoff.commit().root(),
                commit_order: handoff.commit_order(),
                request_order,
            },
        );
    }

    let commit = handoff.commit();
    let replacement = root_child_replacement_records_for_commit(store, commit)?;
    let stable_previous_sibling =
        root_child_replacement_stable_previous_sibling_evidence_for_commit(
            store,
            commit,
            replacement.deletion_mutation,
            replacement.placement_mutation,
        );
    let placement_sibling = replacement.placement_mutation.placement_sibling();
    let request = TestHostRootChildReplacementExecutionRequestForCanary {
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
        deletion_record_index: replacement.deletion_record_index,
        placement_record_index: replacement.placement_record_index,
        deleted_current: replacement.deletion_mutation.fiber(),
        replacement_child: replacement.placement_mutation.fiber(),
        deleted_tag: replacement.deletion_mutation.tag(),
        replacement_tag: replacement.placement_mutation.tag(),
        stable_previous_sibling: stable_previous_sibling.sibling,
        stable_previous_sibling_current: stable_previous_sibling.current,
        stable_previous_sibling_tag: stable_previous_sibling.tag,
        stable_previous_sibling_state_node: stable_previous_sibling.state_node,
        placement_sibling_status: placement_sibling.map(|sibling| sibling.status()),
        placement_sibling: placement_sibling.and_then(|sibling| sibling.sibling()),
        placement_sibling_tag: placement_sibling.and_then(|sibling| sibling.sibling_tag()),
        placement_sibling_state_node: placement_sibling
            .map(|sibling| sibling.sibling_state_node())
            .unwrap_or(StateNodeHandle::NONE),
        placement_skipped_pending_sibling_count: placement_sibling
            .map(|sibling| sibling.skipped_pending_sibling_count())
            .unwrap_or(0),
        deletion_mutation: replacement.deletion_mutation,
        placement_mutation: replacement.placement_mutation,
        mutation_apply_record_count: commit.mutation_apply_log().len(),
        deletion_cleanup_record_count: commit.host_node_deletion_cleanup_log().records().len(),
    };
    if !request.has_required_source_evidence() {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::UnsupportedReplacementEvidence {
                root: commit.root(),
                finished_work: commit.finished_work(),
            },
        );
    }
    debug_assert!(request.matches_source_handoff(handoff));
    Ok(request)
}

pub(crate) fn execute_test_host_root_child_replacement_after_commit_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    source_request: TestHostRootChildReplacementExecutionRequestForCanary,
    request: TestHostRootChildReplacementExecutionRequestForCanary,
    host_work: &mut HostWorkResult,
) -> Result<
    TestHostRootChildReplacementExecutionDiagnosticForCanary,
    TestHostRootChildReplacementExecutionErrorForCanary,
> {
    let commit = handoff.commit();
    if commit.root() != source_request.root() {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root: source_request.root(),
                actual_root: commit.root(),
            },
        );
    }
    if commit.finished_work() != source_request.finished_work() {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::MismatchedFinishedWork {
                root: source_request.root(),
                expected_finished_work: source_request.finished_work(),
                actual_finished_work: commit.finished_work(),
            },
        );
    }
    if source_request != request
        || !source_request.matches_source_handoff(handoff)
        || !root_child_replacement_stable_previous_sibling_evidence_matches_source(
            store,
            commit,
            source_request,
        )
        || !source_request.has_required_source_evidence()
    {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root: request.root(),
                commit_order: request.commit_order(),
                request_order: request.request_order(),
            },
        );
    }
    if host_work.root() != request.root() {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root: request.root(),
                actual_root: host_work.root(),
            },
        );
    }
    if host_work.work_in_progress() != request.finished_work() {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::MismatchedFinishedWork {
                root: request.root(),
                expected_finished_work: request.finished_work(),
                actual_finished_work: host_work.work_in_progress(),
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

    let execution_identity = host_work.root_child_replacement_execution_identity(request);
    if host_work.has_consumed_root_child_replacement_execution(execution_identity) {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::DuplicateExecution {
                root: request.root(),
                finished_work: request.finished_work(),
                request_order: request.request_order(),
            },
        );
    }

    preflight_test_host_root_deletion_apply_and_cleanup_for_canary(store, commit, host_work)?;
    preflight_test_host_root_child_replacement_stable_previous_sibling_for_canary(
        store, request, host_work,
    )?;
    preflight_test_host_root_child_replacement_placement_for_canary(store, request, host_work)?;
    host_work.mark_root_child_replacement_execution_consumed(execution_identity);

    let apply = apply_test_host_root_commit_mutations_for_canary(store, host, commit, host_work)?;
    let deletion_status = apply
        .records()
        .iter()
        .find(|record| record.mutation() == request.deletion_mutation())
        .map(|record| record.status())
        .ok_or(
            TestHostRootChildReplacementExecutionErrorForCanary::ReplacementMutationNotApplied {
                root: request.root(),
                finished_work: request.finished_work(),
                fiber: request.deleted_current(),
                status: None,
            },
        )?;
    if !root_child_replacement_apply_status_matches_kind(
        deletion_status,
        request.deletion_mutation().kind(),
    ) {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::ReplacementMutationNotApplied {
                root: request.root(),
                finished_work: request.finished_work(),
                fiber: request.deleted_current(),
                status: Some(deletion_status),
            },
        );
    }

    let placement_status = apply
        .records()
        .iter()
        .find(|record| record.mutation() == request.placement_mutation())
        .map(|record| record.status())
        .ok_or(
            TestHostRootChildReplacementExecutionErrorForCanary::ReplacementMutationNotApplied {
                root: request.root(),
                finished_work: request.finished_work(),
                fiber: request.replacement_child(),
                status: None,
            },
        )?;
    if !root_child_replacement_apply_status_matches_kind(
        placement_status,
        request.placement_mutation().kind(),
    ) {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::ReplacementMutationNotApplied {
                root: request.root(),
                finished_work: request.finished_work(),
                fiber: request.replacement_child(),
                status: Some(placement_status),
            },
        );
    }

    let cleanup_apply =
        apply_test_host_root_deletion_cleanup_for_canary(store, host, commit, host_work)?;

    Ok(TestHostRootChildReplacementExecutionDiagnosticForCanary {
        request,
        deletion_status,
        placement_status,
        applied_host_call_count: apply.applied_host_call_count(),
        recorded_only_count: apply.recorded_only_count(),
        deletion_cleanup_apply_count: cleanup_apply.applied_record_count(),
        blockers: TEST_HOST_ROOT_CHILD_REPLACEMENT_EXECUTION_BLOCKERS,
    })
}

fn preflight_test_host_root_child_replacement_placement_for_canary(
    store: &FiberRootStore<RecordingHost>,
    request: TestHostRootChildReplacementExecutionRequestForCanary,
    host_work: &HostWorkResult,
) -> Result<(), HostWorkError> {
    let detached_hosts = host_work.detached_hosts();
    owned_detached_host_child_for_apply_record(
        store,
        detached_hosts,
        request.placement_mutation(),
    )?;

    if request.placement_mutation().kind()
        == HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    {
        let Some(sibling) = request.placement_mutation().placement_sibling() else {
            return Ok(());
        };
        if sibling.can_insert_before() {
            owned_detached_host_child_for_fiber(
                store,
                detached_hosts,
                request.root(),
                sibling
                    .sibling()
                    .expect("insert-before sibling record carries a sibling fiber"),
                sibling
                    .sibling_tag()
                    .expect("insert-before sibling record carries a sibling tag"),
                sibling.sibling_state_node(),
            )?;
        }
    }

    Ok(())
}

fn preflight_test_host_root_child_replacement_stable_previous_sibling_for_canary(
    store: &FiberRootStore<RecordingHost>,
    request: TestHostRootChildReplacementExecutionRequestForCanary,
    host_work: &HostWorkResult,
) -> Result<(), HostWorkError> {
    let Some(previous_sibling) = request.stable_previous_sibling() else {
        return Ok(());
    };
    let previous_tag = request
        .stable_previous_sibling_tag()
        .expect("source-owned previous sibling evidence carries a tag");

    owned_detached_host_child_for_fiber(
        store,
        host_work.detached_hosts(),
        request.root(),
        previous_sibling,
        previous_tag,
        request.stable_previous_sibling_state_node(),
    )?;

    Ok(())
}

fn root_child_replacement_records_for_commit(
    store: &FiberRootStore<RecordingHost>,
    commit: &HostRootCommitRecord,
) -> Result<RootChildReplacementRecordsForCanary, TestHostRootChildReplacementExecutionErrorForCanary>
{
    let mut deletion = None;
    let mut placement = None;
    let mut deletion_record_count = 0;
    let mut placement_record_count = 0;

    for (index, &record) in commit.mutation_apply_log().records().iter().enumerate() {
        if record.parent_tag() == FiberTag::HostRoot
            && record.kind() == HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        {
            deletion_record_count += 1;
            deletion = Some((index, record));
        }
        if record.parent_tag() == FiberTag::HostRoot && is_root_child_replacement_placement(record)
        {
            placement_record_count += 1;
            placement = Some((index, record));
        }
    }

    let mutation_apply_record_count = commit.mutation_apply_log().len();
    if deletion_record_count != 1 || placement_record_count != 1 || mutation_apply_record_count != 2
    {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::MissingRootChildReplacementEvidence {
                root: commit.root(),
                finished_work: commit.finished_work(),
                deletion_record_count,
                placement_record_count,
                mutation_apply_record_count,
            },
        );
    }

    let (deletion_record_index, deletion_mutation) =
        deletion.expect("count check established one deletion record");
    let (placement_record_index, placement_mutation) =
        placement.expect("count check established one placement record");
    if deletion_record_index >= placement_record_index
        || deletion_mutation.parent() != commit.finished_work()
        || placement_mutation.parent() != commit.finished_work()
        || deletion_mutation.host_root() != commit.finished_work()
        || placement_mutation.host_root() != commit.finished_work()
        || !matches!(
            deletion_mutation.source(),
            HostRootMutationApplyRecordSource::DeletionList(_)
        )
        || placement_mutation.source()
            != HostRootMutationApplyRecordSource::MutationPhase(
                HostRootMutationPhaseRecordKind::Placement,
            )
        || placement_mutation.alternate_fiber().is_some()
        || !root_child_replacement_records_have_supported_topology(
            store,
            commit,
            deletion_mutation,
            placement_mutation,
        )
    {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::UnsupportedReplacementEvidence {
                root: commit.root(),
                finished_work: commit.finished_work(),
            },
        );
    }
    if deletion_mutation.tag() == placement_mutation.tag() {
        return Err(
            TestHostRootChildReplacementExecutionErrorForCanary::SameTagReplacement {
                root: commit.root(),
                finished_work: commit.finished_work(),
                tag: deletion_mutation.tag(),
            },
        );
    }

    Ok(RootChildReplacementRecordsForCanary {
        deletion_record_index,
        placement_record_index,
        deletion_mutation,
        placement_mutation,
    })
}

const fn is_root_child_replacement_placement(record: HostRootMutationApplyRecord) -> bool {
    matches!(
        record.kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
            | HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    )
}

fn root_child_replacement_records_have_supported_topology(
    store: &FiberRootStore<RecordingHost>,
    commit: &HostRootCommitRecord,
    deletion_mutation: HostRootMutationApplyRecord,
    placement_mutation: HostRootMutationApplyRecord,
) -> bool {
    root_child_replacement_records_have_single_child_topology(
        store,
        commit,
        deletion_mutation,
        placement_mutation,
    ) || root_child_replacement_records_have_stable_trailing_sibling_topology(
        store,
        commit,
        deletion_mutation,
        placement_mutation,
    ) || root_child_replacement_records_have_stable_previous_and_trailing_sibling_topology(
        store,
        commit,
        deletion_mutation,
        placement_mutation,
    )
}

fn root_child_replacement_records_have_single_child_topology(
    store: &FiberRootStore<RecordingHost>,
    commit: &HostRootCommitRecord,
    deletion_mutation: HostRootMutationApplyRecord,
    placement_mutation: HostRootMutationApplyRecord,
) -> bool {
    if placement_mutation.kind() != HostRootMutationApplyRecordKind::AppendPlacementToContainer {
        return false;
    }
    let Some(placement_sibling) = placement_mutation.placement_sibling() else {
        return false;
    };
    if placement_sibling.status() != HostRootPlacementSiblingStatus::Append
        || placement_sibling.sibling().is_some()
        || !placement_sibling.sibling_state_node().is_none()
    {
        return false;
    }

    let HostRootMutationApplyRecordSource::DeletionList(deletion_list_id) =
        deletion_mutation.source()
    else {
        return false;
    };
    let Some(deletion_list) = commit
        .deletion_lists()
        .iter()
        .find(|record| record.list() == deletion_list_id)
    else {
        return false;
    };
    if deletion_list.parent() != commit.finished_work()
        || deletion_list.deleted() != [deletion_mutation.fiber()]
    {
        return false;
    }

    let arena = store.fiber_arena();
    let Ok(previous_current) = arena.get(commit.previous_current()) else {
        return false;
    };
    let Ok(deleted_current) = arena.get(deletion_mutation.fiber()) else {
        return false;
    };
    let Ok(finished_work) = arena.get(commit.finished_work()) else {
        return false;
    };
    let Ok(replacement_child) = arena.get(placement_mutation.fiber()) else {
        return false;
    };

    previous_current.child() == Some(deletion_mutation.fiber())
        && deleted_current.sibling().is_none()
        && finished_work.child() == Some(placement_mutation.fiber())
        && replacement_child.return_fiber() == Some(commit.finished_work())
        && replacement_child.sibling().is_none()
}

fn root_child_replacement_records_have_stable_trailing_sibling_topology(
    store: &FiberRootStore<RecordingHost>,
    commit: &HostRootCommitRecord,
    deletion_mutation: HostRootMutationApplyRecord,
    placement_mutation: HostRootMutationApplyRecord,
) -> bool {
    if placement_mutation.kind()
        != HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    {
        return false;
    }
    let Some(placement_sibling) = placement_mutation.placement_sibling() else {
        return false;
    };
    let Some(stable_work) = placement_sibling.sibling() else {
        return false;
    };
    if placement_sibling.status() != HostRootPlacementSiblingStatus::InsertBefore
        || placement_sibling.sibling_tag() != Some(FiberTag::HostText)
        || placement_sibling.sibling_state_node().is_none()
        || placement_sibling.skipped_pending_sibling_count() != 0
    {
        return false;
    }

    let HostRootMutationApplyRecordSource::DeletionList(deletion_list_id) =
        deletion_mutation.source()
    else {
        return false;
    };
    let Some(deletion_list) = commit
        .deletion_lists()
        .iter()
        .find(|record| record.list() == deletion_list_id)
    else {
        return false;
    };
    if deletion_list.parent() != commit.finished_work()
        || deletion_list.deleted() != [deletion_mutation.fiber()]
    {
        return false;
    }

    let arena = store.fiber_arena();
    let Ok(finished_children) = arena.child_ids(commit.finished_work()) else {
        return false;
    };
    let [replacement, finished_stable] = finished_children.as_slice() else {
        return false;
    };
    if *replacement != placement_mutation.fiber() || *finished_stable != stable_work {
        return false;
    }

    let Ok(previous_current) = arena.get(commit.previous_current()) else {
        return false;
    };
    let Ok(deleted_current) = arena.get(deletion_mutation.fiber()) else {
        return false;
    };
    let Ok(finished_work) = arena.get(commit.finished_work()) else {
        return false;
    };
    let Ok(replacement_child) = arena.get(placement_mutation.fiber()) else {
        return false;
    };
    let Ok(stable_work_node) = arena.get(stable_work) else {
        return false;
    };
    let Some(stable_current) = stable_work_node.alternate() else {
        return false;
    };
    let Ok(stable_current_node) = arena.get(stable_current) else {
        return false;
    };

    previous_current.child() == Some(deletion_mutation.fiber())
        && deleted_current.sibling().is_none()
        && stable_current_node.tag() == FiberTag::HostText
        && stable_current_node.return_fiber() == Some(commit.previous_current())
        && stable_current_node.sibling().is_none()
        && finished_work.child() == Some(placement_mutation.fiber())
        && replacement_child.return_fiber() == Some(commit.finished_work())
        && replacement_child.sibling() == Some(stable_work)
        && stable_work_node.tag() == FiberTag::HostText
        && stable_work_node.return_fiber() == Some(commit.finished_work())
        && stable_work_node.sibling().is_none()
        && stable_work_node.flags() == FiberFlags::NO
        && stable_work_node.state_node() == placement_sibling.sibling_state_node()
}

fn root_child_replacement_records_have_stable_previous_and_trailing_sibling_topology(
    store: &FiberRootStore<RecordingHost>,
    commit: &HostRootCommitRecord,
    deletion_mutation: HostRootMutationApplyRecord,
    placement_mutation: HostRootMutationApplyRecord,
) -> bool {
    if placement_mutation.kind()
        != HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    {
        return false;
    }
    let Some(placement_sibling) = placement_mutation.placement_sibling() else {
        return false;
    };
    let Some(stable_trailing_work) = placement_sibling.sibling() else {
        return false;
    };
    if placement_sibling.status() != HostRootPlacementSiblingStatus::InsertBefore
        || placement_sibling.sibling_tag() != Some(FiberTag::HostText)
        || placement_sibling.sibling_state_node().is_none()
        || placement_sibling.skipped_pending_sibling_count() != 0
    {
        return false;
    }

    let HostRootMutationApplyRecordSource::DeletionList(deletion_list_id) =
        deletion_mutation.source()
    else {
        return false;
    };
    let Some(deletion_list) = commit
        .deletion_lists()
        .iter()
        .find(|record| record.list() == deletion_list_id)
    else {
        return false;
    };
    if deletion_list.parent() != commit.finished_work()
        || deletion_list.deleted() != [deletion_mutation.fiber()]
    {
        return false;
    }

    let arena = store.fiber_arena();
    let Ok(finished_children) = arena.child_ids(commit.finished_work()) else {
        return false;
    };
    let [stable_previous_work, replacement, finished_trailing_work] = finished_children.as_slice()
    else {
        return false;
    };
    if *replacement != placement_mutation.fiber() || *finished_trailing_work != stable_trailing_work
    {
        return false;
    }

    let Ok(previous_current) = arena.get(commit.previous_current()) else {
        return false;
    };
    let Ok(deleted_current) = arena.get(deletion_mutation.fiber()) else {
        return false;
    };
    let Ok(finished_work) = arena.get(commit.finished_work()) else {
        return false;
    };
    let Ok(stable_previous_work_node) = arena.get(*stable_previous_work) else {
        return false;
    };
    let Ok(replacement_child) = arena.get(placement_mutation.fiber()) else {
        return false;
    };
    let Ok(stable_trailing_work_node) = arena.get(stable_trailing_work) else {
        return false;
    };
    let Some(stable_previous_current) = stable_previous_work_node.alternate() else {
        return false;
    };
    let Some(stable_trailing_current) = stable_trailing_work_node.alternate() else {
        return false;
    };
    let Ok(stable_previous_current_node) = arena.get(stable_previous_current) else {
        return false;
    };
    let Ok(stable_trailing_current_node) = arena.get(stable_trailing_current) else {
        return false;
    };

    previous_current.child() == Some(stable_previous_current)
        && stable_previous_current_node.tag() == FiberTag::HostText
        && stable_previous_current_node.return_fiber() == Some(commit.previous_current())
        && stable_previous_current_node.sibling() == Some(deletion_mutation.fiber())
        && stable_trailing_current_node.tag() == FiberTag::HostText
        && stable_trailing_current_node.return_fiber() == Some(commit.previous_current())
        && stable_trailing_current_node.sibling().is_none()
        && deleted_current.return_fiber() == Some(commit.finished_work())
        && deleted_current.sibling().is_none()
        && finished_work.child() == Some(*stable_previous_work)
        && stable_previous_work_node.tag() == FiberTag::HostText
        && stable_previous_work_node.return_fiber() == Some(commit.finished_work())
        && stable_previous_work_node.sibling() == Some(placement_mutation.fiber())
        && stable_previous_work_node.flags() == FiberFlags::NO
        && replacement_child.return_fiber() == Some(commit.finished_work())
        && replacement_child.sibling() == Some(stable_trailing_work)
        && stable_trailing_work_node.tag() == FiberTag::HostText
        && stable_trailing_work_node.return_fiber() == Some(commit.finished_work())
        && stable_trailing_work_node.sibling().is_none()
        && stable_trailing_work_node.flags() == FiberFlags::NO
        && stable_trailing_work_node.state_node() == placement_sibling.sibling_state_node()
}

fn root_child_replacement_stable_previous_sibling_evidence_for_commit(
    store: &FiberRootStore<RecordingHost>,
    commit: &HostRootCommitRecord,
    deletion_mutation: HostRootMutationApplyRecord,
    placement_mutation: HostRootMutationApplyRecord,
) -> RootChildReplacementStablePreviousSiblingEvidenceForCanary {
    if !root_child_replacement_records_have_stable_previous_and_trailing_sibling_topology(
        store,
        commit,
        deletion_mutation,
        placement_mutation,
    ) {
        return RootChildReplacementStablePreviousSiblingEvidenceForCanary::NONE;
    }

    let finished_children = store
        .fiber_arena()
        .child_ids(commit.finished_work())
        .expect("supported topology has finished children");
    let stable_previous_sibling = finished_children[0];
    let stable_previous_node = store
        .fiber_arena()
        .get(stable_previous_sibling)
        .expect("supported topology has previous sibling");

    RootChildReplacementStablePreviousSiblingEvidenceForCanary {
        sibling: Some(stable_previous_sibling),
        current: stable_previous_node.alternate(),
        tag: Some(stable_previous_node.tag()),
        state_node: stable_previous_node.state_node(),
    }
}

fn root_child_replacement_stable_previous_sibling_evidence_matches_source(
    store: &FiberRootStore<RecordingHost>,
    commit: &HostRootCommitRecord,
    request: TestHostRootChildReplacementExecutionRequestForCanary,
) -> bool {
    let source_evidence = root_child_replacement_stable_previous_sibling_evidence_for_commit(
        store,
        commit,
        request.deletion_mutation(),
        request.placement_mutation(),
    );
    request.stable_previous_sibling() == source_evidence.sibling
        && request.stable_previous_sibling_current() == source_evidence.current
        && request.stable_previous_sibling_tag() == source_evidence.tag
        && request.stable_previous_sibling_state_node() == source_evidence.state_node
}

const fn root_child_replacement_apply_status_matches_kind(
    status: TestHostRootMutationApplyStatus,
    kind: HostRootMutationApplyRecordKind,
) -> bool {
    matches!(
        (status, kind),
        (
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::RemoveChildFromContainer
            ),
            HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        ) | (
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer
            ),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        ) | (
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::InsertInContainerBefore
            ),
            HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
        )
    )
}
