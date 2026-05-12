//! Managed-child commit handoff and execution canaries.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    DeletionListId, FiberArena, FiberFlags, FiberId, FiberTag, PropsHandle, StateNodeHandle,
};
use fast_react_host_config::HostTypes;

use crate::complete_work::{
    HostComponentManagedChildCompleteWorkRecordForCanary,
    HostComponentManagedChildMutationKindForCanary,
    HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
};
use crate::{FiberRootId, FiberRootStore, HostRootRenderPhaseRecord};

use super::{
    HostRootCommitRecord, HostRootFinishedWorkCommitHandoffErrorForCanary,
    HostRootFinishedWorkCommitHandoffRecordForCanary,
    HostRootFinishedWorkPendingCommitRecordForCanary, HostRootMutationApplyRecord,
    HostRootMutationApplyRecordKind, HostRootMutationApplyRecordSource,
    HostRootMutationPhaseRecordKind, HostRootPlacementSiblingRecord,
    HostRootPlacementSiblingStatus, RootCommitError, collect_deletion_list_metadata,
    collect_host_root_mutation_apply_log, collect_host_root_mutation_phase_log,
    commit_finished_host_root_with_finished_work_handoff_for_canary, validate_finished_host_root,
    validate_host_root_finished_work_pending_commit_for_canary,
};

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootManagedChildCommitHandoffRecordForCanary {
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    execution_request: HostRootManagedChildCommitExecutionRequestForCanary,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private managed child placement/delete handoff diagnostics expose fields for focused canaries"
)]
impl HostRootManagedChildCommitHandoffRecordForCanary {
    #[must_use]
    pub(crate) const fn complete_work(
        &self,
    ) -> HostComponentManagedChildCompleteWorkRecordForCanary {
        self.complete_work
    }

    #[must_use]
    pub(crate) const fn execution_request(
        &self,
    ) -> &HostRootManagedChildCommitExecutionRequestForCanary {
        &self.execution_request
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    pub(crate) const fn commit(&self) -> &HostRootCommitRecord {
        self.finished_work_handoff.commit()
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.execution_request.root()
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.execution_request.finished_work()
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(&self) -> usize {
        self.execution_request.source_handoff_order()
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.execution_request.commit_order()
    }

    #[must_use]
    pub(crate) const fn request_order(&self) -> usize {
        self.execution_request.request_order()
    }

    #[must_use]
    pub(crate) const fn kind(&self) -> HostComponentManagedChildMutationKindForCanary {
        self.complete_work.kind()
    }

    #[must_use]
    pub(crate) const fn kind_name(&self) -> &'static str {
        self.complete_work.kind_name()
    }

    #[must_use]
    pub(crate) const fn mutation(&self) -> HostRootMutationApplyRecord {
        self.execution_request.mutation()
    }

    #[must_use]
    pub(crate) fn complete_metadata_matches_mutation(&self) -> bool {
        managed_child_complete_metadata_matches_mutation(
            self.complete_work,
            self.execution_request.mutation,
        )
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_allowed(&self) -> bool {
        self.execution_request.private_test_host_mutation_allowed()
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        self.execution_request.public_root_rendering_blocked()
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(&self) -> bool {
        self.execution_request.public_renderer_mutation_blocked()
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary {
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    execution_request: HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private managed child sibling-order handoff diagnostics expose fields for focused canaries"
)]
impl HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary {
    #[must_use]
    pub(crate) const fn complete_work(
        &self,
    ) -> HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary {
        self.complete_work
    }

    #[must_use]
    pub(crate) const fn execution_request(
        &self,
    ) -> &HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary {
        &self.execution_request
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    pub(crate) const fn commit(&self) -> &HostRootCommitRecord {
        self.finished_work_handoff.commit()
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.execution_request.root()
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.execution_request.finished_work()
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(&self) -> usize {
        self.execution_request.source_handoff_order()
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.execution_request.commit_order()
    }

    #[must_use]
    pub(crate) const fn request_order(&self) -> usize {
        self.execution_request.request_order()
    }

    #[must_use]
    pub(crate) const fn kind(&self) -> HostComponentManagedChildMutationKindForCanary {
        self.complete_work.kind()
    }

    #[must_use]
    pub(crate) const fn order_sibling(&self) -> FiberId {
        self.complete_work.order_sibling()
    }

    #[must_use]
    pub(crate) const fn order_sibling_state_node(&self) -> StateNodeHandle {
        self.complete_work.order_sibling_state_node()
    }

    #[must_use]
    pub(crate) const fn order_evidence_name(&self) -> &'static str {
        self.complete_work.order_evidence_name()
    }

    #[must_use]
    pub(crate) const fn mutation(&self) -> HostRootMutationApplyRecord {
        self.execution_request.mutation()
    }

    #[must_use]
    pub(crate) fn complete_metadata_matches_mutation(&self) -> bool {
        managed_child_sibling_order_complete_metadata_matches_mutation(
            self.complete_work,
            self.execution_request.mutation,
        )
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_allowed(&self) -> bool {
        self.execution_request.private_test_host_mutation_allowed()
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        self.execution_request.public_root_rendering_blocked()
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(&self) -> bool {
        self.execution_request.public_renderer_mutation_blocked()
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootManagedChildCommitExecutionRequestForCanary {
    root: FiberRootId,
    root_token: StateNodeHandle,
    previous_current: FiberId,
    finished_work: FiberId,
    committed_current: FiberId,
    source_handoff_order: usize,
    commit_order: usize,
    request_order: usize,
    mutation_index: usize,
    mutation: HostRootMutationApplyRecord,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    status: HostRootManagedChildCommitExecutionStatusForCanary,
    blockers: [HostRootManagedChildCommitExecutionBlockerForCanary; 6],
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private managed child execution request diagnostics expose fields for focused canaries"
)]
impl HostRootManagedChildCommitExecutionRequestForCanary {
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
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn committed_current(self) -> FiberId {
        self.committed_current
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
    pub(crate) const fn mutation_index(self) -> usize {
        self.mutation_index
    }

    #[must_use]
    pub(crate) const fn mutation(self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    pub(crate) const fn complete_work(
        self,
    ) -> HostComponentManagedChildCompleteWorkRecordForCanary {
        self.complete_work
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostComponentManagedChildMutationKindForCanary {
        self.complete_work.kind()
    }

    #[must_use]
    pub(crate) const fn status(self) -> HostRootManagedChildCommitExecutionStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(
        &self,
    ) -> &[HostRootManagedChildCommitExecutionBlockerForCanary; 6] {
        &self.blockers
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_allowed(self) -> bool {
        matches!(
            self.status,
            HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
        )
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn hydration_events_refs_resources_forms_claimed(self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary {
    root: FiberRootId,
    root_token: StateNodeHandle,
    previous_current: FiberId,
    finished_work: FiberId,
    committed_current: FiberId,
    source_handoff_order: usize,
    commit_order: usize,
    request_order: usize,
    mutation_index: usize,
    mutation: HostRootMutationApplyRecord,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    status: HostRootManagedChildCommitExecutionStatusForCanary,
    blockers: [HostRootManagedChildCommitExecutionBlockerForCanary; 6],
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private managed child sibling-order request diagnostics expose fields for focused canaries"
)]
impl HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary {
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
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn committed_current(self) -> FiberId {
        self.committed_current
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
    pub(crate) const fn mutation_index(self) -> usize {
        self.mutation_index
    }

    #[must_use]
    pub(crate) const fn mutation(self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    pub(crate) const fn complete_work(
        self,
    ) -> HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary {
        self.complete_work
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostComponentManagedChildMutationKindForCanary {
        self.complete_work.kind()
    }

    #[must_use]
    pub(crate) const fn order_sibling(self) -> FiberId {
        self.complete_work.order_sibling()
    }

    #[must_use]
    pub(crate) const fn order_sibling_state_node(self) -> StateNodeHandle {
        self.complete_work.order_sibling_state_node()
    }

    #[must_use]
    pub(crate) const fn order_evidence_name(self) -> &'static str {
        self.complete_work.order_evidence_name()
    }

    #[must_use]
    pub(crate) const fn status(self) -> HostRootManagedChildCommitExecutionStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(
        &self,
    ) -> &[HostRootManagedChildCommitExecutionBlockerForCanary; 6] {
        &self.blockers
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_allowed(self) -> bool {
        matches!(
            self.status,
            HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
        )
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn hydration_events_refs_resources_forms_claimed(self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootManagedChildCommitExecutionStatusForCanary {
    ValidatedForTestHostMutation,
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootManagedChildCommitExecutionBlockerForCanary {
    PublicRootRendering,
    PublicRendererHostMutation,
    ReactDomManagedChildCompatibilityClaim,
    ReactTestRendererCompatibilityClaim,
    HydrationEventsRefsResourcesFormsControlledInputClaim,
    PublicCompatibilityClaim,
}

#[cfg(test)]
pub(super) const HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS:
    [HostRootManagedChildCommitExecutionBlockerForCanary; 6] = [
    HostRootManagedChildCommitExecutionBlockerForCanary::PublicRootRendering,
    HostRootManagedChildCommitExecutionBlockerForCanary::PublicRendererHostMutation,
    HostRootManagedChildCommitExecutionBlockerForCanary::ReactDomManagedChildCompatibilityClaim,
    HostRootManagedChildCommitExecutionBlockerForCanary::ReactTestRendererCompatibilityClaim,
    HostRootManagedChildCommitExecutionBlockerForCanary::HydrationEventsRefsResourcesFormsControlledInputClaim,
    HostRootManagedChildCommitExecutionBlockerForCanary::PublicCompatibilityClaim,
];

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootManagedChildCommitHandoffErrorForCanary {
    FinishedWork(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    RootCommit(RootCommitError),
    MissingMutationApplyRecord {
        root: FiberRootId,
        finished_work: FiberId,
        mutation_index: usize,
    },
    UnexpectedMutationApplyKind {
        root: FiberRootId,
        fiber: FiberId,
        expected: HostRootMutationApplyRecordKind,
        actual: HostRootMutationApplyRecordKind,
    },
    UnexpectedMutationApplySource {
        root: FiberRootId,
        fiber: FiberId,
        kind: HostComponentManagedChildMutationKindForCanary,
        actual: HostRootMutationApplyRecordSource,
    },
    MetadataRootMismatch {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
    },
    MetadataParentMismatch {
        root: FiberRootId,
        expected_parent: FiberId,
        actual_parent: FiberId,
        actual_parent_tag: FiberTag,
    },
    MetadataParentStateNodeMismatch {
        root: FiberRootId,
        parent: FiberId,
        expected_state_node: StateNodeHandle,
        actual_state_node: StateNodeHandle,
    },
    MetadataChildMismatch {
        root: FiberRootId,
        expected_child: FiberId,
        actual_child: FiberId,
    },
    MetadataChildTagMismatch {
        root: FiberRootId,
        child: FiberId,
        expected_tag: FiberTag,
        actual_tag: FiberTag,
    },
    MetadataChildStateNodeMismatch {
        root: FiberRootId,
        child: FiberId,
        expected_state_node: StateNodeHandle,
        actual_state_node: StateNodeHandle,
    },
    MetadataChildPropsMismatch {
        root: FiberRootId,
        child: FiberId,
        expected_pending_props: PropsHandle,
        expected_memoized_props: PropsHandle,
        actual_pending_props: PropsHandle,
        actual_memoized_props: PropsHandle,
    },
    MetadataChildAlternateMismatch {
        root: FiberRootId,
        child: FiberId,
        expected_alternate: Option<FiberId>,
        actual_alternate: Option<FiberId>,
    },
    MetadataEffectFlagMissing {
        root: FiberRootId,
        fiber: FiberId,
        expected: FiberFlags,
        actual: FiberFlags,
    },
    MetadataPlacementSiblingMismatch {
        root: FiberRootId,
        fiber: FiberId,
        placement_sibling: Option<HostRootPlacementSiblingRecord>,
    },
    MetadataOrderSiblingMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected_sibling: FiberId,
        actual_sibling: Option<FiberId>,
    },
    MetadataOrderSiblingTagMismatch {
        root: FiberRootId,
        sibling: FiberId,
        expected_tag: FiberTag,
        actual_tag: FiberTag,
    },
    MetadataOrderSiblingStateNodeMismatch {
        root: FiberRootId,
        sibling: FiberId,
        expected_state_node: StateNodeHandle,
        actual_state_node: StateNodeHandle,
    },
    MetadataOrderSiblingPropsMismatch {
        root: FiberRootId,
        sibling: FiberId,
        expected_pending_props: PropsHandle,
        expected_memoized_props: PropsHandle,
        actual_pending_props: PropsHandle,
        actual_memoized_props: PropsHandle,
    },
    MetadataOrderSiblingAlternateMismatch {
        root: FiberRootId,
        sibling: FiberId,
        expected_alternate: Option<FiberId>,
        actual_alternate: Option<FiberId>,
    },
    MetadataPreviousSiblingOrderMismatch {
        root: FiberRootId,
        parent: FiberId,
        deleted_child: FiberId,
        expected_previous_sibling: FiberId,
        actual_previous_sibling: Option<FiberId>,
    },
    MetadataDeletionListMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected: Option<DeletionListId>,
        actual: HostRootMutationApplyRecordSource,
    },
    PublicCompatibilityClaimed {
        root: FiberRootId,
        fiber: FiberId,
        kind: HostComponentManagedChildMutationKindForCanary,
    },
}

#[cfg(test)]
impl Display for HostRootManagedChildCommitHandoffErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FinishedWork(error) => Display::fmt(error, formatter),
            Self::RootCommit(error) => Display::fmt(error, formatter),
            Self::MissingMutationApplyRecord {
                root,
                finished_work,
                mutation_index,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} has no managed child mutation apply record at index {}",
                root.raw(),
                finished_work.slot().get(),
                mutation_index
            ),
            Self::UnexpectedMutationApplyKind {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} managed child handoff expected {:?} for fiber slot {}, found {:?}",
                root.raw(),
                expected,
                fiber.slot().get(),
                actual
            ),
            Self::UnexpectedMutationApplySource {
                root,
                fiber,
                kind,
                actual,
            } => write!(
                formatter,
                "root {} managed child {kind} handoff expected matching source for fiber slot {}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                actual
            ),
            Self::MetadataRootMismatch {
                expected_root,
                actual_root,
            } => write!(
                formatter,
                "managed child complete-work metadata for root {} cannot commit on root {}",
                actual_root.raw(),
                expected_root.raw()
            ),
            Self::MetadataParentMismatch {
                root,
                expected_parent,
                actual_parent,
                actual_parent_tag,
            } => write!(
                formatter,
                "root {} managed child metadata expected HostComponent parent {}, found parent {} {:?}",
                root.raw(),
                expected_parent.slot().get(),
                actual_parent.slot().get(),
                actual_parent_tag
            ),
            Self::MetadataParentStateNodeMismatch {
                root,
                parent,
                expected_state_node,
                actual_state_node,
            } => write!(
                formatter,
                "root {} managed child parent {} expected state node {}, found {}",
                root.raw(),
                parent.slot().get(),
                expected_state_node.raw(),
                actual_state_node.raw()
            ),
            Self::MetadataChildMismatch {
                root,
                expected_child,
                actual_child,
            } => write!(
                formatter,
                "root {} managed child metadata expected child {}, found {}",
                root.raw(),
                expected_child.slot().get(),
                actual_child.slot().get()
            ),
            Self::MetadataChildTagMismatch {
                root,
                child,
                expected_tag,
                actual_tag,
            } => write!(
                formatter,
                "root {} managed child {} expected {:?}, found {:?}",
                root.raw(),
                child.slot().get(),
                expected_tag,
                actual_tag
            ),
            Self::MetadataChildStateNodeMismatch {
                root,
                child,
                expected_state_node,
                actual_state_node,
            } => write!(
                formatter,
                "root {} managed child {} expected state node {}, found {}",
                root.raw(),
                child.slot().get(),
                expected_state_node.raw(),
                actual_state_node.raw()
            ),
            Self::MetadataChildPropsMismatch {
                root,
                child,
                expected_pending_props,
                expected_memoized_props,
                actual_pending_props,
                actual_memoized_props,
            } => write!(
                formatter,
                "root {} managed child {} stale props: expected pending {} memoized {}, found pending {} memoized {}",
                root.raw(),
                child.slot().get(),
                expected_pending_props.raw(),
                expected_memoized_props.raw(),
                actual_pending_props.raw(),
                actual_memoized_props.raw()
            ),
            Self::MetadataChildAlternateMismatch {
                root,
                child,
                expected_alternate,
                actual_alternate,
            } => write!(
                formatter,
                "root {} managed child {} expected alternate {:?}, found {:?}",
                root.raw(),
                child.slot().get(),
                expected_alternate.map(|fiber| fiber.slot().get()),
                actual_alternate.map(|fiber| fiber.slot().get())
            ),
            Self::MetadataEffectFlagMissing {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} managed child fiber {} expected effect {:?}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                expected,
                actual
            ),
            Self::MetadataPlacementSiblingMismatch {
                root,
                fiber,
                placement_sibling,
            } => write!(
                formatter,
                "root {} managed child placement fiber {} expected matching sibling metadata, found {:?}",
                root.raw(),
                fiber.slot().get(),
                placement_sibling
            ),
            Self::MetadataOrderSiblingMismatch {
                root,
                fiber,
                expected_sibling,
                actual_sibling,
            } => write!(
                formatter,
                "root {} managed child fiber {} expected order sibling {}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                expected_sibling.slot().get(),
                actual_sibling.map(|fiber| fiber.slot().get())
            ),
            Self::MetadataOrderSiblingTagMismatch {
                root,
                sibling,
                expected_tag,
                actual_tag,
            } => write!(
                formatter,
                "root {} managed child order sibling {} expected {:?}, found {:?}",
                root.raw(),
                sibling.slot().get(),
                expected_tag,
                actual_tag
            ),
            Self::MetadataOrderSiblingStateNodeMismatch {
                root,
                sibling,
                expected_state_node,
                actual_state_node,
            } => write!(
                formatter,
                "root {} managed child order sibling {} expected state node {}, found {}",
                root.raw(),
                sibling.slot().get(),
                expected_state_node.raw(),
                actual_state_node.raw()
            ),
            Self::MetadataOrderSiblingPropsMismatch {
                root,
                sibling,
                expected_pending_props,
                expected_memoized_props,
                actual_pending_props,
                actual_memoized_props,
            } => write!(
                formatter,
                "root {} managed child order sibling {} stale props: expected pending {} memoized {}, found pending {} memoized {}",
                root.raw(),
                sibling.slot().get(),
                expected_pending_props.raw(),
                expected_memoized_props.raw(),
                actual_pending_props.raw(),
                actual_memoized_props.raw()
            ),
            Self::MetadataOrderSiblingAlternateMismatch {
                root,
                sibling,
                expected_alternate,
                actual_alternate,
            } => write!(
                formatter,
                "root {} managed child order sibling {} expected alternate {:?}, found {:?}",
                root.raw(),
                sibling.slot().get(),
                expected_alternate.map(|fiber| fiber.slot().get()),
                actual_alternate.map(|fiber| fiber.slot().get())
            ),
            Self::MetadataPreviousSiblingOrderMismatch {
                root,
                parent,
                deleted_child,
                expected_previous_sibling,
                actual_previous_sibling,
            } => write!(
                formatter,
                "root {} managed child delete parent {} child {} expected previous sibling {}, found {:?}",
                root.raw(),
                parent.slot().get(),
                deleted_child.slot().get(),
                expected_previous_sibling.slot().get(),
                actual_previous_sibling.map(|fiber| fiber.slot().get())
            ),
            Self::MetadataDeletionListMismatch {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} managed child delete fiber {} expected deletion list {:?}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                expected.map(DeletionListId::index),
                actual
            ),
            Self::PublicCompatibilityClaimed { root, fiber, kind } => write!(
                formatter,
                "root {} managed child fiber {} cannot claim public compatibility for private {kind} handoff",
                root.raw(),
                fiber.slot().get()
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootManagedChildCommitHandoffErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FinishedWork(error) => Some(error.as_ref()),
            Self::RootCommit(error) => Some(error),
            Self::MissingMutationApplyRecord { .. }
            | Self::UnexpectedMutationApplyKind { .. }
            | Self::UnexpectedMutationApplySource { .. }
            | Self::MetadataRootMismatch { .. }
            | Self::MetadataParentMismatch { .. }
            | Self::MetadataParentStateNodeMismatch { .. }
            | Self::MetadataChildMismatch { .. }
            | Self::MetadataChildTagMismatch { .. }
            | Self::MetadataChildStateNodeMismatch { .. }
            | Self::MetadataChildPropsMismatch { .. }
            | Self::MetadataChildAlternateMismatch { .. }
            | Self::MetadataEffectFlagMissing { .. }
            | Self::MetadataPlacementSiblingMismatch { .. }
            | Self::MetadataOrderSiblingMismatch { .. }
            | Self::MetadataOrderSiblingTagMismatch { .. }
            | Self::MetadataOrderSiblingStateNodeMismatch { .. }
            | Self::MetadataOrderSiblingPropsMismatch { .. }
            | Self::MetadataOrderSiblingAlternateMismatch { .. }
            | Self::MetadataPreviousSiblingOrderMismatch { .. }
            | Self::MetadataDeletionListMismatch { .. }
            | Self::PublicCompatibilityClaimed { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootManagedChildCommitHandoffErrorForCanary
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWork(Box::new(error))
    }
}

#[cfg(test)]
impl From<RootCommitError> for HostRootManagedChildCommitHandoffErrorForCanary {
    fn from(error: RootCommitError) -> Self {
        Self::RootCommit(error)
    }
}

#[cfg(test)]
pub(crate) fn commit_managed_child_complete_work_handoff_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: Option<HostRootFinishedWorkPendingCommitRecordForCanary>,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    mutation_index: usize,
    commit_order: usize,
    request_order: usize,
) -> Result<
    HostRootManagedChildCommitHandoffRecordForCanary,
    HostRootManagedChildCommitHandoffErrorForCanary,
> {
    let Some(pending) = pending else {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::MissingFinishedWorkRecord {
                root: render.root(),
                finished_work: render.finished_work(),
            }
            .into(),
        );
    };

    validate_host_root_finished_work_pending_commit_for_canary(store, render, pending)?;
    let execution_request = validate_managed_child_commit_metadata_for_canary(
        store,
        render,
        pending,
        complete_work,
        mutation_index,
        commit_order,
        request_order,
    )?;
    let finished_work_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        render,
        Some(pending),
        commit_order,
    )?;

    Ok(HostRootManagedChildCommitHandoffRecordForCanary {
        complete_work,
        execution_request,
        finished_work_handoff,
    })
}

#[cfg(test)]
pub(crate) fn commit_managed_child_sibling_order_complete_work_handoff_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: Option<HostRootFinishedWorkPendingCommitRecordForCanary>,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    mutation_index: usize,
    commit_order: usize,
    request_order: usize,
) -> Result<
    HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary,
    HostRootManagedChildCommitHandoffErrorForCanary,
> {
    let Some(pending) = pending else {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::MissingFinishedWorkRecord {
                root: render.root(),
                finished_work: render.finished_work(),
            }
            .into(),
        );
    };

    validate_host_root_finished_work_pending_commit_for_canary(store, render, pending)?;
    let execution_request = validate_managed_child_sibling_order_commit_metadata_for_canary(
        store,
        render,
        pending,
        complete_work,
        mutation_index,
        commit_order,
        request_order,
    )?;
    let finished_work_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        render,
        Some(pending),
        commit_order,
    )?;

    Ok(
        HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary {
            complete_work,
            execution_request,
            finished_work_handoff,
        },
    )
}

#[cfg(test)]
fn validate_managed_child_commit_metadata_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    mutation_index: usize,
    commit_order: usize,
    request_order: usize,
) -> Result<
    HostRootManagedChildCommitExecutionRequestForCanary,
    HostRootManagedChildCommitHandoffErrorForCanary,
> {
    validate_finished_host_root(store, render)?;

    let root = render.root();
    let finished_work = render.finished_work();
    if complete_work.root() != root {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataRootMismatch {
                expected_root: root,
                actual_root: complete_work.root(),
            },
        );
    }
    if complete_work.public_dom_compatibility_claimed()
        || complete_work.test_renderer_compatibility_claimed()
        || complete_work.broad_reconciliation_traversal_claimed()
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::PublicCompatibilityClaimed {
                root,
                fiber: complete_work.child(),
                kind: complete_work.kind(),
            },
        );
    }

    let mutation_log =
        collect_host_root_mutation_phase_log(store, root, finished_work, render.render_lanes())?;
    let deletion_lists = collect_deletion_list_metadata(store, finished_work)?;
    let mutation_apply_log = collect_host_root_mutation_apply_log(
        store,
        root,
        finished_work,
        render.render_lanes(),
        &mutation_log,
        &deletion_lists,
    )?;
    let mutation = mutation_apply_log
        .records()
        .get(mutation_index)
        .copied()
        .ok_or(
            HostRootManagedChildCommitHandoffErrorForCanary::MissingMutationApplyRecord {
                root,
                finished_work,
                mutation_index,
            },
        )?;

    validate_managed_child_mutation_record(root, finished_work, complete_work, mutation)?;

    Ok(HostRootManagedChildCommitExecutionRequestForCanary {
        root,
        root_token: pending.root_token(),
        previous_current: pending.previous_current(),
        finished_work,
        committed_current: finished_work,
        source_handoff_order: pending.handoff_order(),
        commit_order,
        request_order,
        mutation_index,
        mutation,
        complete_work,
        status: HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation,
        blockers: HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS,
    })
}

#[cfg(test)]
fn validate_managed_child_sibling_order_commit_metadata_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    mutation_index: usize,
    commit_order: usize,
    request_order: usize,
) -> Result<
    HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary,
    HostRootManagedChildCommitHandoffErrorForCanary,
> {
    validate_finished_host_root(store, render)?;

    let root = render.root();
    let finished_work = render.finished_work();
    if complete_work.root() != root {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataRootMismatch {
                expected_root: root,
                actual_root: complete_work.root(),
            },
        );
    }
    if complete_work.public_dom_compatibility_claimed()
        || complete_work.test_renderer_compatibility_claimed()
        || complete_work.broad_reconciliation_traversal_claimed()
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::PublicCompatibilityClaimed {
                root,
                fiber: complete_work.child(),
                kind: complete_work.kind(),
            },
        );
    }

    validate_managed_child_sibling_order_topology(store.fiber_arena(), root, complete_work)?;

    let mutation_log =
        collect_host_root_mutation_phase_log(store, root, finished_work, render.render_lanes())?;
    let deletion_lists = collect_deletion_list_metadata(store, finished_work)?;
    let mutation_apply_log = collect_host_root_mutation_apply_log(
        store,
        root,
        finished_work,
        render.render_lanes(),
        &mutation_log,
        &deletion_lists,
    )?;
    let mutation = mutation_apply_log
        .records()
        .get(mutation_index)
        .copied()
        .ok_or(
            HostRootManagedChildCommitHandoffErrorForCanary::MissingMutationApplyRecord {
                root,
                finished_work,
                mutation_index,
            },
        )?;

    validate_managed_child_sibling_order_mutation_record(
        root,
        finished_work,
        complete_work,
        mutation,
    )?;

    Ok(
        HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary {
            root,
            root_token: pending.root_token(),
            previous_current: pending.previous_current(),
            finished_work,
            committed_current: finished_work,
            source_handoff_order: pending.handoff_order(),
            commit_order,
            request_order,
            mutation_index,
            mutation,
            complete_work,
            status:
                HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation,
            blockers: HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS,
        },
    )
}

#[cfg(test)]
fn validate_managed_child_mutation_record(
    root: FiberRootId,
    finished_work: FiberId,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    if mutation.root() != root || mutation.host_root() != finished_work {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataRootMismatch {
                expected_root: root,
                actual_root: mutation.root(),
            },
        );
    }

    let expected_kind = expected_managed_child_mutation_apply_kind(complete_work.kind());
    if mutation.kind() != expected_kind {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::UnexpectedMutationApplyKind {
                root,
                fiber: mutation.fiber(),
                expected: expected_kind,
                actual: mutation.kind(),
            },
        );
    }
    validate_managed_child_mutation_source(root, complete_work, mutation)?;

    if mutation.parent() != complete_work.parent_work_in_progress()
        || mutation.parent_tag() != FiberTag::HostComponent
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataParentMismatch {
                root,
                expected_parent: complete_work.parent_work_in_progress(),
                actual_parent: mutation.parent(),
                actual_parent_tag: mutation.parent_tag(),
            },
        );
    }
    if mutation.parent_state_node() != complete_work.parent_state_node() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataParentStateNodeMismatch {
                root,
                parent: mutation.parent(),
                expected_state_node: complete_work.parent_state_node(),
                actual_state_node: mutation.parent_state_node(),
            },
        );
    }
    if mutation.fiber() != complete_work.child() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildMismatch {
                root,
                expected_child: complete_work.child(),
                actual_child: mutation.fiber(),
            },
        );
    }
    if mutation.tag() != complete_work.child_tag() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildTagMismatch {
                root,
                child: mutation.fiber(),
                expected_tag: complete_work.child_tag(),
                actual_tag: mutation.tag(),
            },
        );
    }
    if mutation.state_node() != complete_work.child_state_node() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildStateNodeMismatch {
                root,
                child: mutation.fiber(),
                expected_state_node: complete_work.child_state_node(),
                actual_state_node: mutation.state_node(),
            },
        );
    }
    if mutation.pending_props() != complete_work.child_pending_props()
        || mutation.memoized_props() != complete_work.child_memoized_props()
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildPropsMismatch {
                root,
                child: mutation.fiber(),
                expected_pending_props: complete_work.child_pending_props(),
                expected_memoized_props: complete_work.child_memoized_props(),
                actual_pending_props: mutation.pending_props(),
                actual_memoized_props: mutation.memoized_props(),
            },
        );
    }
    if mutation.alternate_fiber() != complete_work.child_alternate() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildAlternateMismatch {
                root,
                child: mutation.fiber(),
                expected_alternate: complete_work.child_alternate(),
                actual_alternate: mutation.alternate_fiber(),
            },
        );
    }
    if !mutation
        .effect_flag()
        .contains_all(complete_work.expected_effect_flag())
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataEffectFlagMissing {
                root,
                fiber: mutation.fiber(),
                expected: complete_work.expected_effect_flag(),
                actual: mutation.effect_flag(),
            },
        );
    }
    validate_managed_child_placement_sibling(root, complete_work, mutation)?;

    Ok(())
}

#[cfg(test)]
fn validate_managed_child_sibling_order_topology(
    arena: &FiberArena,
    root: FiberRootId,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    let order_sibling_node = arena
        .get(complete_work.order_sibling())
        .map_err(RootCommitError::from)?;
    if order_sibling_node.tag() != complete_work.order_sibling_tag() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingTagMismatch {
                root,
                sibling: complete_work.order_sibling(),
                expected_tag: complete_work.order_sibling_tag(),
                actual_tag: order_sibling_node.tag(),
            },
        );
    }
    if order_sibling_node.state_node() != complete_work.order_sibling_state_node() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingStateNodeMismatch {
                root,
                sibling: complete_work.order_sibling(),
                expected_state_node: complete_work.order_sibling_state_node(),
                actual_state_node: order_sibling_node.state_node(),
            },
        );
    }
    if order_sibling_node.pending_props() != complete_work.order_sibling_pending_props()
        || order_sibling_node.memoized_props() != complete_work.order_sibling_memoized_props()
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingPropsMismatch {
                root,
                sibling: complete_work.order_sibling(),
                expected_pending_props: complete_work.order_sibling_pending_props(),
                expected_memoized_props: complete_work.order_sibling_memoized_props(),
                actual_pending_props: order_sibling_node.pending_props(),
                actual_memoized_props: order_sibling_node.memoized_props(),
            },
        );
    }
    if order_sibling_node.alternate() != complete_work.order_sibling_alternate() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingAlternateMismatch {
                root,
                sibling: complete_work.order_sibling(),
                expected_alternate: complete_work.order_sibling_alternate(),
                actual_alternate: order_sibling_node.alternate(),
            },
        );
    }

    match complete_work.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement => {
            let child_node = arena
                .get(complete_work.child())
                .map_err(RootCommitError::from)?;
            if child_node.sibling() != Some(complete_work.order_sibling()) {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingMismatch {
                        root,
                        fiber: complete_work.child(),
                        expected_sibling: complete_work.order_sibling(),
                        actual_sibling: child_node.sibling(),
                    },
                );
            }
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            let Some(previous_current) = complete_work.order_sibling_alternate() else {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPreviousSiblingOrderMismatch {
                        root,
                        parent: complete_work.parent_work_in_progress(),
                        deleted_child: complete_work.child(),
                        expected_previous_sibling: complete_work.order_sibling(),
                        actual_previous_sibling: None,
                    },
                );
            };
            let previous_current_node =
                arena.get(previous_current).map_err(RootCommitError::from)?;
            if previous_current_node.sibling() != Some(complete_work.child()) {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPreviousSiblingOrderMismatch {
                        root,
                        parent: complete_work.parent_work_in_progress(),
                        deleted_child: complete_work.child(),
                        expected_previous_sibling: complete_work.order_sibling(),
                        actual_previous_sibling: previous_current_node.sibling(),
                    },
                );
            }
        }
    }

    Ok(())
}

#[cfg(test)]
fn validate_managed_child_sibling_order_mutation_record(
    root: FiberRootId,
    finished_work: FiberId,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    if mutation.root() != root || mutation.host_root() != finished_work {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataRootMismatch {
                expected_root: root,
                actual_root: mutation.root(),
            },
        );
    }

    let expected_kind = expected_managed_child_sibling_order_mutation_apply_kind(complete_work);
    if mutation.kind() != expected_kind {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::UnexpectedMutationApplyKind {
                root,
                fiber: mutation.fiber(),
                expected: expected_kind,
                actual: mutation.kind(),
            },
        );
    }
    validate_managed_child_sibling_order_mutation_source(root, complete_work, mutation)?;

    if mutation.parent() != complete_work.parent_work_in_progress()
        || mutation.parent_tag() != FiberTag::HostComponent
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataParentMismatch {
                root,
                expected_parent: complete_work.parent_work_in_progress(),
                actual_parent: mutation.parent(),
                actual_parent_tag: mutation.parent_tag(),
            },
        );
    }
    if mutation.parent_state_node() != complete_work.parent_state_node() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataParentStateNodeMismatch {
                root,
                parent: mutation.parent(),
                expected_state_node: complete_work.parent_state_node(),
                actual_state_node: mutation.parent_state_node(),
            },
        );
    }
    if mutation.fiber() != complete_work.child() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildMismatch {
                root,
                expected_child: complete_work.child(),
                actual_child: mutation.fiber(),
            },
        );
    }
    if mutation.tag() != complete_work.child_tag() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildTagMismatch {
                root,
                child: mutation.fiber(),
                expected_tag: complete_work.child_tag(),
                actual_tag: mutation.tag(),
            },
        );
    }
    if mutation.state_node() != complete_work.child_state_node() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildStateNodeMismatch {
                root,
                child: mutation.fiber(),
                expected_state_node: complete_work.child_state_node(),
                actual_state_node: mutation.state_node(),
            },
        );
    }
    if mutation.pending_props() != complete_work.child_pending_props()
        || mutation.memoized_props() != complete_work.child_memoized_props()
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildPropsMismatch {
                root,
                child: mutation.fiber(),
                expected_pending_props: complete_work.child_pending_props(),
                expected_memoized_props: complete_work.child_memoized_props(),
                actual_pending_props: mutation.pending_props(),
                actual_memoized_props: mutation.memoized_props(),
            },
        );
    }
    if mutation.alternate_fiber() != complete_work.child_alternate() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildAlternateMismatch {
                root,
                child: mutation.fiber(),
                expected_alternate: complete_work.child_alternate(),
                actual_alternate: mutation.alternate_fiber(),
            },
        );
    }
    if !mutation
        .effect_flag()
        .contains_all(complete_work.expected_effect_flag())
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataEffectFlagMissing {
                root,
                fiber: mutation.fiber(),
                expected: complete_work.expected_effect_flag(),
                actual: mutation.effect_flag(),
            },
        );
    }

    validate_managed_child_sibling_order_apply_evidence(root, complete_work, mutation)
}

#[cfg(test)]
fn validate_managed_child_sibling_order_mutation_source(
    root: FiberRootId,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    match complete_work.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement
            if mutation.source()
                == HostRootMutationApplyRecordSource::MutationPhase(
                    HostRootMutationPhaseRecordKind::Placement,
                ) =>
        {
            Ok(())
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            if let (Some(expected), HostRootMutationApplyRecordSource::DeletionList(actual)) =
                (complete_work.deletion_list(), mutation.source())
                && expected == actual
            {
                return Ok(());
            }
            Err(
                HostRootManagedChildCommitHandoffErrorForCanary::MetadataDeletionListMismatch {
                    root,
                    fiber: mutation.fiber(),
                    expected: complete_work.deletion_list(),
                    actual: mutation.source(),
                },
            )
        }
        kind => Err(
            HostRootManagedChildCommitHandoffErrorForCanary::UnexpectedMutationApplySource {
                root,
                fiber: mutation.fiber(),
                kind,
                actual: mutation.source(),
            },
        ),
    }
}

#[cfg(test)]
fn validate_managed_child_sibling_order_apply_evidence(
    root: FiberRootId,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    match complete_work.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement => {
            let Some(sibling) = mutation.placement_sibling() else {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPlacementSiblingMismatch {
                        root,
                        fiber: mutation.fiber(),
                        placement_sibling: None,
                    },
                );
            };
            if sibling.status() != HostRootPlacementSiblingStatus::InsertBefore
                || sibling.sibling() != Some(complete_work.order_sibling())
                || sibling.sibling_tag() != Some(complete_work.order_sibling_tag())
                || sibling.sibling_state_node() != complete_work.order_sibling_state_node()
                || sibling.skipped_pending_sibling_count() != 0
                || !sibling.can_insert_before()
            {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPlacementSiblingMismatch {
                        root,
                        fiber: mutation.fiber(),
                        placement_sibling: Some(sibling),
                    },
                );
            }
            Ok(())
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            if mutation.placement_sibling().is_some() {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPlacementSiblingMismatch {
                        root,
                        fiber: mutation.fiber(),
                        placement_sibling: mutation.placement_sibling(),
                    },
                );
            }
            Ok(())
        }
    }
}

#[cfg(test)]
fn validate_managed_child_mutation_source(
    root: FiberRootId,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    match complete_work.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement
            if mutation.source()
                == HostRootMutationApplyRecordSource::MutationPhase(
                    HostRootMutationPhaseRecordKind::Placement,
                ) =>
        {
            Ok(())
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            if let (Some(expected), HostRootMutationApplyRecordSource::DeletionList(actual)) =
                (complete_work.deletion_list(), mutation.source())
                && expected == actual
            {
                return Ok(());
            }
            Err(
                HostRootManagedChildCommitHandoffErrorForCanary::MetadataDeletionListMismatch {
                    root,
                    fiber: mutation.fiber(),
                    expected: complete_work.deletion_list(),
                    actual: mutation.source(),
                },
            )
        }
        kind => Err(
            HostRootManagedChildCommitHandoffErrorForCanary::UnexpectedMutationApplySource {
                root,
                fiber: mutation.fiber(),
                kind,
                actual: mutation.source(),
            },
        ),
    }
}

#[cfg(test)]
fn validate_managed_child_placement_sibling(
    root: FiberRootId,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    match complete_work.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement => {
            let Some(sibling) = mutation.placement_sibling() else {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPlacementSiblingMismatch {
                        root,
                        fiber: mutation.fiber(),
                        placement_sibling: None,
                    },
                );
            };
            if sibling.status() != HostRootPlacementSiblingStatus::Append
                || sibling.sibling().is_some()
                || sibling.sibling_tag().is_some()
                || !sibling.sibling_state_node().is_none()
            {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPlacementSiblingMismatch {
                        root,
                        fiber: mutation.fiber(),
                        placement_sibling: Some(sibling),
                    },
                );
            }
            Ok(())
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            if mutation.placement_sibling().is_some() {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPlacementSiblingMismatch {
                        root,
                        fiber: mutation.fiber(),
                        placement_sibling: mutation.placement_sibling(),
                    },
                );
            }
            Ok(())
        }
    }
}

#[cfg(test)]
const fn expected_managed_child_mutation_apply_kind(
    kind: HostComponentManagedChildMutationKindForCanary,
) -> HostRootMutationApplyRecordKind {
    match kind {
        HostComponentManagedChildMutationKindForCanary::Placement => {
            HostRootMutationApplyRecordKind::AppendPlacementToHostParent
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        }
    }
}

#[cfg(test)]
const fn expected_managed_child_sibling_order_mutation_apply_kind(
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
) -> HostRootMutationApplyRecordKind {
    match complete_work.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement => {
            HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        }
    }
}

#[cfg(test)]
fn managed_child_complete_metadata_matches_mutation(
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> bool {
    mutation.kind() == expected_managed_child_mutation_apply_kind(complete_work.kind())
        && mutation.parent() == complete_work.parent_work_in_progress()
        && mutation.parent_tag() == FiberTag::HostComponent
        && mutation.parent_state_node() == complete_work.parent_state_node()
        && mutation.fiber() == complete_work.child()
        && mutation.tag() == complete_work.child_tag()
        && mutation.state_node() == complete_work.child_state_node()
        && mutation.pending_props() == complete_work.child_pending_props()
        && mutation.memoized_props() == complete_work.child_memoized_props()
        && mutation.alternate_fiber() == complete_work.child_alternate()
        && mutation
            .effect_flag()
            .contains_all(complete_work.expected_effect_flag())
}

#[cfg(test)]
fn managed_child_sibling_order_complete_metadata_matches_mutation(
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> bool {
    mutation.kind() == expected_managed_child_sibling_order_mutation_apply_kind(complete_work)
        && mutation.parent() == complete_work.parent_work_in_progress()
        && mutation.parent_tag() == FiberTag::HostComponent
        && mutation.parent_state_node() == complete_work.parent_state_node()
        && mutation.fiber() == complete_work.child()
        && mutation.tag() == complete_work.child_tag()
        && mutation.state_node() == complete_work.child_state_node()
        && mutation.pending_props() == complete_work.child_pending_props()
        && mutation.memoized_props() == complete_work.child_memoized_props()
        && mutation.alternate_fiber() == complete_work.child_alternate()
        && mutation
            .effect_flag()
            .contains_all(complete_work.expected_effect_flag())
        && match complete_work.kind() {
            HostComponentManagedChildMutationKindForCanary::Placement => {
                mutation.placement_sibling().is_some_and(|sibling| {
                    sibling.status() == HostRootPlacementSiblingStatus::InsertBefore
                        && sibling.sibling() == Some(complete_work.order_sibling())
                        && sibling.sibling_tag() == Some(complete_work.order_sibling_tag())
                        && sibling.sibling_state_node() == complete_work.order_sibling_state_node()
                        && sibling.skipped_pending_sibling_count() == 0
                })
            }
            HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
                mutation.placement_sibling().is_none()
            }
        }
}
