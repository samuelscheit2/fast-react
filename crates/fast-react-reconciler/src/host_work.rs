//! Private test-only HostRoot/HostComponent/HostText work skeleton.
//!
//! This module intentionally uses the tiny `test_support` element source. It
//! exercises reconciler-owned topology, detached host creation, state-node
//! handles owned by the private host-node store, and bubbling without exposing
//! a public renderer or committing to a root container.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

mod deletions;
mod host_update_apply;
mod mutation_apply;
mod payload;
mod root_replacement;

#[allow(unused_imports)]
pub(crate) use self::deletions::{
    TestHostRootDeletionCleanupAction, TestHostRootDeletionCleanupApplyRecord,
    TestHostRootDeletionCleanupApplyResult, TestHostRootDeletionCleanupStatus,
    TestHostRootDeletionRefPassiveCleanupExecutionPhase,
    TestHostRootDeletionRefPassiveCleanupExecutionRecord,
    TestHostRootDeletionRefPassiveCleanupExecutionSnapshot,
    TestHostRootDeletionTeardownExecutionDiagnosticForCanary,
    TestHostRootDeletionTeardownExecutionErrorForCanary,
    TestHostRootDeletionTeardownExecutionRequestForCanary,
    apply_test_host_root_deletion_cleanup_for_canary,
    execute_test_host_root_deletion_teardown_after_commit_for_canary,
    preflight_test_host_root_deletion_apply_and_cleanup_for_canary,
    test_host_root_deletion_teardown_execution_request_for_canary,
};
use self::deletions::{
    apply_test_host_root_deletion_cleanup, managed_child_deletion_cleanup_status_matches_tag,
};
#[cfg(test)]
use self::deletions::{
    apply_test_host_root_deletion_subtree_host_detachment_for_canary,
    materialize_test_host_root_deletion_ref_passive_cleanup_execution_for_canary,
};
use self::host_update_apply::{
    apply_test_host_component_update_record, apply_test_host_text_update_record,
    validate_test_host_component_property_update_payload,
};
pub(crate) use self::mutation_apply::{
    TestHostRootMutationApplyRecord, TestHostRootMutationApplyResult,
    TestHostRootMutationApplyStatus, TestHostRootMutationHostCall,
    TestHostRootPrivateStoreMutation,
};
use self::payload::{
    HostComponentUpdatePayload, HostTextUpdateDiff, HostTextUpdatePayload,
    TEST_HOST_DANGEROUS_HTML_PROP_NAME, TEST_HOST_DANGEROUS_HTML_PROPERTY_NAME,
    TEST_HOST_SAFE_PROPERTY_NAME, TEST_HOST_SAFE_PROPERTY_PROP_NAME, TEST_HOST_STYLE_PROP_NAME,
    TEST_HOST_TEXT_CONTENT_PROP_NAME, TEST_HOST_TEXT_CONTENT_PROPERTY_NAME,
    TestHostComponentPropertyPayloadRow,
};
pub(crate) use self::payload::{
    HostTextCommitExecutionRequestViolation, TestHostComponentPropertyPayloadKind,
    TestHostComponentPropertyPayloadViolation, TestHostRootHostUpdatePayloadForCanary,
};
#[cfg(test)]
use self::root_replacement::TEST_HOST_ROOT_CHILD_REPLACEMENT_EXECUTION_BLOCKERS;
#[allow(unused_imports)]
pub(crate) use self::root_replacement::{
    TestHostRootChildReplacementExecutionBlockerForCanary,
    TestHostRootChildReplacementExecutionDiagnosticForCanary,
    TestHostRootChildReplacementExecutionErrorForCanary,
    TestHostRootChildReplacementExecutionRequestForCanary,
    execute_test_host_root_child_replacement_after_commit_for_canary,
    test_host_root_child_replacement_execution_request_for_canary,
};

use fast_react_core::{
    FiberFlags, FiberId, FiberTag, FiberTopologyError, Lanes, PropsHandle, StateNodeHandle,
    bubble_properties,
};
use fast_react_host_config::{
    HostChild, HostCommit, HostCreation, HostError, HostFiberTokenPhase, HostFiberTokenRef,
    HostFiberTokenTarget, HostIdentityAndContext, InitialChildrenFinalization, MutationHost,
};

#[cfg(test)]
use crate::complete_work::HostComponentDangerousHtmlTextResetPayloadKindForCanary;
use crate::complete_work::{
    HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    HostComponentManagedChildCompleteWorkRecordForCanary,
    HostComponentManagedChildMutationKindForCanary,
    HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    host_component_dangerous_html_text_reset_complete_work_record_for_canary,
    host_component_managed_child_complete_work_record_for_canary,
    host_component_managed_child_sibling_order_complete_work_record_for_canary,
};
#[cfg(test)]
use crate::function_component::FunctionComponentSingleChildUpdateReconciliationRecord;
use crate::host_nodes::{
    HostNodeAppliedTextUpdate, HostNodeMetadata, HostNodeScope, HostNodeStore, HostNodeTextUpdate,
    HostNodeUpdateCurrentness, HostNodeValidationError, HostNodeViolation,
};
#[cfg(test)]
use crate::host_nodes::{HostNodePropertyUpdate, HostNodePropertyUpdateExecution};
use crate::passive_effects::{
    DeletedSubtreeRefCleanupReturnExecutor, PassiveEffectDestroyCallbackExecutor,
};
#[cfg(test)]
use crate::root_commit::HostRootTextUpdateCommitExecutionRequestForCanary;
use crate::root_commit::{
    HostRootDangerousHtmlTextResetCommitHandoffRecordForCanary, HostRootDeletionCleanupRecord,
    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary,
    HostRootFinishedWorkCommitHandoffErrorForCanary,
    HostRootFinishedWorkCommitHandoffRecordForCanary,
    HostRootFinishedWorkPendingCommitRecordForCanary,
    HostRootManagedChildCommitHandoffRecordForCanary,
    HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary, HostRootMutationApplyRecord,
    HostRootMutationApplyRecordKind, HostRootMutationPhaseRecordKind,
    HostRootSingleHostUpdateApplyRecordErrorForCanary,
    commit_dangerous_html_text_reset_complete_work_handoff_for_canary,
    commit_finished_host_root_with_finished_work_handoff_for_canary,
    commit_managed_child_complete_work_handoff_for_canary,
    commit_managed_child_sibling_order_complete_work_handoff_for_canary,
    record_host_root_single_host_update_apply_for_canary,
};
use crate::sync_flush::{SyncFlushRootHostOutputCommitDiagnosticsForCanary, SyncFlushRootRecord};
use crate::test_support::{
    FakeHostFiberToken, FakeInstance, FakeTextInstance, RecordingHost, TestHostElement,
    TestHostNode, TestHostText, TestHostTree,
};
use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostFiberTokenStore,
    HostFiberTokenValidationError, HostRootCommitRecord, HostRootRenderPhaseRecord,
    RootElementHandle, RootOptions, render_host_root_for_lanes, update_container,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostWorkError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    Host(HostError),
    HostFiberToken(HostFiberTokenValidationError),
    HostNode(HostNodeValidationError),
    DeletionSubtreeHostDetachmentPlan(HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary),
    MissingTestRootElement {
        handle: RootElementHandle,
    },
    ExpectedFiberTag {
        fiber: FiberId,
        expected: FiberTag,
        actual: FiberTag,
    },
    MissingStateNode {
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingCurrentRootChild {
        root: FiberRootId,
        current: FiberId,
    },
    UnexpectedCurrentRootChildSibling {
        root: FiberRootId,
        current: FiberId,
        child: FiberId,
        sibling: FiberId,
    },
    MissingHostComponentTextChild {
        root: FiberRootId,
        component: FiberId,
    },
    MissingHostWorkRootChild {
        root: FiberRootId,
        work_in_progress: FiberId,
    },
    FunctionComponentParentTopologyMismatch(Box<FunctionComponentParentTopologyMismatchRecord>),
    UnexpectedExistingChild {
        parent: FiberId,
        child: FiberId,
    },
    ExpectedRootChildReplacement {
        root: FiberRootId,
        current: FiberId,
        current_child: FiberId,
        current_tag: FiberTag,
        next_tag: FiberTag,
    },
    ExpectedMultipleRootChildren {
        count: usize,
    },
    InvalidDetachedInstance {
        handle: StateNodeHandle,
    },
    InvalidDetachedText {
        handle: StateNodeHandle,
    },
    CommitCurrentMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: FiberId,
    },
    MissingHostTextUpdatePayload {
        root: FiberRootId,
        fiber: FiberId,
        state_node: StateNodeHandle,
    },
    MissingHostComponentUpdatePayload {
        root: FiberRootId,
        fiber: FiberId,
        state_node: StateNodeHandle,
    },
    ConsumedHostUpdatePayload {
        root: FiberRootId,
        fiber: FiberId,
        state_node: StateNodeHandle,
        kind: HostRootMutationApplyRecordKind,
    },
    UnchangedHostTextUpdatePayload {
        root: FiberRootId,
        current: FiberId,
        work_in_progress: FiberId,
        state_node: StateNodeHandle,
    },
    HostTextCommitRecordMismatch {
        root: FiberRootId,
        state_node: StateNodeHandle,
        expected_old_text: String,
        actual_text: String,
    },
    InvalidHostTextCommitExecutionRequest {
        root: FiberRootId,
        finished_work: FiberId,
        fiber: FiberId,
        violation: HostTextCommitExecutionRequestViolation,
    },
    InvalidHostComponentPropertyUpdatePayload {
        root: FiberRootId,
        fiber: FiberId,
        prop_name: &'static str,
        violation: TestHostComponentPropertyPayloadViolation,
    },
    MissingDetachedHostCleanupOwnershipTransfer {
        root: FiberRootId,
        work_in_progress: FiberId,
        updated_fiber: FiberId,
        source_fiber: FiberId,
        tag: FiberTag,
        state_node: StateNodeHandle,
    },
    InvalidDetachedHostCleanupOwnershipTransfer {
        root: FiberRootId,
        work_in_progress: FiberId,
        updated_fiber: FiberId,
        source_fiber: FiberId,
        tag: FiberTag,
        state_node: StateNodeHandle,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentParentTopologyMismatchRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    function_component: FiberId,
    actual_root_child: Option<FiberId>,
    actual_parent: Option<FiberId>,
    actual_sibling: Option<FiberId>,
}

impl Display for HostWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::Host(error) => Display::fmt(error, formatter),
            Self::HostFiberToken(error) => Display::fmt(error, formatter),
            Self::HostNode(error) => Display::fmt(error, formatter),
            Self::DeletionSubtreeHostDetachmentPlan(error) => Display::fmt(error, formatter),
            Self::MissingTestRootElement { handle } => write!(
                formatter,
                "test host element handle {} is not registered",
                handle.raw()
            ),
            Self::ExpectedFiberTag {
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "fiber {} must be {:?}, found {:?}",
                fiber.slot().get(),
                expected,
                actual
            ),
            Self::MissingStateNode { fiber, tag } => write!(
                formatter,
                "{:?} fiber {} has no detached host state node",
                tag,
                fiber.slot().get()
            ),
            Self::MissingCurrentRootChild { root, current } => write!(
                formatter,
                "root {} current HostRoot fiber {} has no child for private root host update",
                root.raw(),
                current.slot().get()
            ),
            Self::UnexpectedCurrentRootChildSibling {
                root,
                current,
                child,
                sibling,
            } => write!(
                formatter,
                "root {} current HostRoot fiber {} child {} has sibling {}; private root host update admits exactly one current host child",
                root.raw(),
                current.slot().get(),
                child.slot().get(),
                sibling.slot().get()
            ),
            Self::MissingHostComponentTextChild { root, component } => write!(
                formatter,
                "root {} HostComponent fiber {} has no HostText child for private root component/text update",
                root.raw(),
                component.slot().get()
            ),
            Self::MissingHostWorkRootChild {
                root,
                work_in_progress,
            } => write!(
                formatter,
                "root {} HostWorkResult for HostRoot work-in-progress {} has no completed root child",
                root.raw(),
                work_in_progress.slot().get()
            ),
            Self::FunctionComponentParentTopologyMismatch(record) => write!(
                formatter,
                "root {} expected HostRoot work-in-progress {} to have FunctionComponent child {} with no sibling; actual root child {:?}, parent {:?}, sibling {:?}",
                record.root.raw(),
                record.host_root_work_in_progress.slot().get(),
                record.function_component.slot().get(),
                record.actual_root_child.map(|fiber| fiber.slot().get()),
                record.actual_parent.map(|fiber| fiber.slot().get()),
                record.actual_sibling.map(|fiber| fiber.slot().get())
            ),
            Self::UnexpectedExistingChild { parent, child } => write!(
                formatter,
                "fiber {} already has child {}; private host complete-work handoff only admits a fresh single child",
                parent.slot().get(),
                child.slot().get()
            ),
            Self::ExpectedRootChildReplacement {
                root,
                current,
                current_child,
                current_tag,
                next_tag,
            } => write!(
                formatter,
                "root {} current HostRoot fiber {} child {} is {:?}; private root child replacement requires a different next root tag, found {:?}",
                root.raw(),
                current.slot().get(),
                current_child.slot().get(),
                current_tag,
                next_tag
            ),
            Self::ExpectedMultipleRootChildren { count } => write!(
                formatter,
                "private multiple-sibling host complete-work handoff requires at least two root HostComponent/HostText source children, found {count}"
            ),
            Self::InvalidDetachedInstance { handle } => write!(
                formatter,
                "detached host instance handle {} is invalid",
                handle.raw()
            ),
            Self::InvalidDetachedText { handle } => write!(
                formatter,
                "detached host text handle {} is invalid",
                handle.raw()
            ),
            Self::CommitCurrentMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} test host mutation apply commit current fiber slot {} does not match actual current fiber slot {}",
                root.raw(),
                expected.slot().get(),
                actual.slot().get()
            ),
            Self::MissingHostTextUpdatePayload {
                root,
                fiber,
                state_node,
            } => write!(
                formatter,
                "root {} HostText update execution for fiber slot {} state node {} has no accepted text update payload",
                root.raw(),
                fiber.slot().get(),
                state_node.raw()
            ),
            Self::MissingHostComponentUpdatePayload {
                root,
                fiber,
                state_node,
            } => write!(
                formatter,
                "root {} HostComponent update execution for fiber slot {} state node {} has no accepted component update payload",
                root.raw(),
                fiber.slot().get(),
                state_node.raw()
            ),
            Self::ConsumedHostUpdatePayload {
                root,
                fiber,
                state_node,
                kind,
            } => write!(
                formatter,
                "root {} host update execution for fiber slot {} state node {} has already consumed private {:?} payload evidence",
                root.raw(),
                fiber.slot().get(),
                state_node.raw(),
                kind
            ),
            Self::UnchangedHostTextUpdatePayload {
                root,
                current,
                work_in_progress,
                state_node,
            } => write!(
                formatter,
                "root {} HostText update execution rejected unchanged text for current fiber slot {} work-in-progress slot {} state node {}",
                root.raw(),
                current.slot().get(),
                work_in_progress.slot().get(),
                state_node.raw()
            ),
            Self::HostTextCommitRecordMismatch {
                root,
                state_node,
                expected_old_text,
                actual_text,
            } => write!(
                formatter,
                "root {} HostText update execution expected committed text record {} to contain {:?}, found {:?}",
                root.raw(),
                state_node.raw(),
                expected_old_text,
                actual_text
            ),
            Self::InvalidHostTextCommitExecutionRequest {
                root,
                finished_work,
                fiber,
                violation,
            } => write!(
                formatter,
                "root {} HostText commit execution request for finished work fiber slot {} and text fiber slot {} failed currentness validation: {}",
                root.raw(),
                finished_work.slot().get(),
                fiber.slot().get(),
                violation.as_str()
            ),
            Self::InvalidHostComponentPropertyUpdatePayload {
                root,
                fiber,
                prop_name,
                violation,
            } => write!(
                formatter,
                "root {} HostComponent fiber {} cannot apply private property payload row {prop_name}: {violation}",
                root.raw(),
                fiber.slot().get()
            ),
            Self::MissingDetachedHostCleanupOwnershipTransfer {
                root,
                work_in_progress,
                updated_fiber,
                source_fiber,
                tag,
                state_node,
            } => write!(
                formatter,
                "root {} HostWorkResult for work-in-progress slot {} cannot clean up updated {:?} fiber slot {} state node {} without source-owned transfer from alternate slot {}",
                root.raw(),
                work_in_progress.slot().get(),
                tag,
                updated_fiber.slot().get(),
                state_node.raw(),
                source_fiber.slot().get()
            ),
            Self::InvalidDetachedHostCleanupOwnershipTransfer {
                root,
                work_in_progress,
                updated_fiber,
                source_fiber,
                tag,
                state_node,
            } => write!(
                formatter,
                "root {} HostWorkResult for work-in-progress slot {} has invalid cleanup ownership transfer for updated {:?} fiber slot {} state node {} from alternate slot {}",
                root.raw(),
                work_in_progress.slot().get(),
                tag,
                updated_fiber.slot().get(),
                state_node.raw(),
                source_fiber.slot().get()
            ),
        }
    }
}

impl Error for HostWorkError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::Host(error) => Some(error),
            Self::HostFiberToken(error) => Some(error),
            Self::HostNode(error) => Some(error),
            Self::DeletionSubtreeHostDetachmentPlan(error) => Some(error),
            Self::MissingTestRootElement { .. }
            | Self::ExpectedFiberTag { .. }
            | Self::MissingStateNode { .. }
            | Self::MissingHostWorkRootChild { .. }
            | Self::FunctionComponentParentTopologyMismatch(_)
            | Self::UnexpectedExistingChild { .. }
            | Self::ExpectedRootChildReplacement { .. }
            | Self::ExpectedMultipleRootChildren { .. }
            | Self::InvalidDetachedInstance { .. }
            | Self::InvalidDetachedText { .. }
            | Self::CommitCurrentMismatch { .. }
            | Self::MissingCurrentRootChild { .. }
            | Self::UnexpectedCurrentRootChildSibling { .. }
            | Self::MissingHostComponentTextChild { .. }
            | Self::MissingHostTextUpdatePayload { .. }
            | Self::MissingHostComponentUpdatePayload { .. }
            | Self::ConsumedHostUpdatePayload { .. }
            | Self::UnchangedHostTextUpdatePayload { .. }
            | Self::HostTextCommitRecordMismatch { .. }
            | Self::InvalidHostTextCommitExecutionRequest { .. }
            | Self::InvalidHostComponentPropertyUpdatePayload { .. }
            | Self::MissingDetachedHostCleanupOwnershipTransfer { .. }
            | Self::InvalidDetachedHostCleanupOwnershipTransfer { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for HostWorkError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for HostWorkError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<HostError> for HostWorkError {
    fn from(error: HostError) -> Self {
        Self::Host(error)
    }
}

impl From<HostFiberTokenValidationError> for HostWorkError {
    fn from(error: HostFiberTokenValidationError) -> Self {
        Self::HostFiberToken(error)
    }
}

impl From<HostNodeValidationError> for HostWorkError {
    fn from(error: HostNodeValidationError) -> Self {
        Self::HostNode(error)
    }
}

impl From<HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary> for HostWorkError {
    fn from(error: HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary) -> Self {
        Self::DeletionSubtreeHostDetachmentPlan(error)
    }
}

#[derive(Default)]
pub(crate) struct DetachedHostRecords {
    nodes: HostNodeStore<RecordingHost>,
    scopes: Vec<Option<HostNodeScope>>,
    component_updates: Vec<HostComponentUpdatePayload>,
    text_updates: Vec<HostTextUpdatePayload>,
    consumed_host_updates: Vec<HostRootMutationApplyRecord>,
    test_host_text_records: Vec<Option<TestHostTextRecord>>,
}

impl fmt::Debug for DetachedHostRecords {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("DetachedHostRecords")
            .field("instance_count", &self.instance_count())
            .field("text_count", &self.text_count())
            .finish()
    }
}

impl DetachedHostRecords {
    pub(crate) fn new_for_canary() -> Self {
        Self::default()
    }

    fn insert_instance(&mut self, scope: HostNodeScope, instance: FakeInstance) -> StateNodeHandle {
        let handle = self.nodes.insert_instance(scope, instance);
        self.remember_scope(handle, scope);
        handle
    }

    fn insert_text(&mut self, scope: HostNodeScope, text: FakeTextInstance) -> StateNodeHandle {
        let committed_text = text.text().to_owned();
        let handle = self.nodes.insert_text(scope, text);
        self.remember_scope(handle, scope);
        self.remember_test_host_text_record(handle, scope, committed_text);
        handle
    }

    fn instance(&self, handle: StateNodeHandle) -> Result<&FakeInstance, HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::Instance)?;
        Ok(self.nodes.instance(handle, scope)?)
    }

    fn text(&self, handle: StateNodeHandle) -> Result<&FakeTextInstance, HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::TextInstance)?;
        Ok(self.nodes.text(handle, scope)?)
    }

    pub(crate) fn instance_metadata(
        &self,
        handle: StateNodeHandle,
    ) -> Result<HostNodeMetadata, HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::Instance)?;
        Ok(self.nodes.instance_metadata(handle, scope)?)
    }

    fn instance_property_updates(
        &self,
        handle: StateNodeHandle,
    ) -> Result<&[crate::host_nodes::HostNodeAppliedPropertyUpdate], HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::Instance)?;
        Ok(self.nodes.instance_property_updates(handle, scope)?)
    }

    fn instance_latest_props(
        &self,
        handle: StateNodeHandle,
    ) -> Result<Option<PropsHandle>, HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::Instance)?;
        Ok(self.nodes.instance_latest_props(handle, scope)?)
    }

    fn instance_latest_props_updates(
        &self,
        handle: StateNodeHandle,
    ) -> Result<&[crate::host_nodes::HostNodeLatestPropsUpdate], HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::Instance)?;
        Ok(self.nodes.instance_latest_props_updates(handle, scope)?)
    }

    pub(crate) fn text_metadata(
        &self,
        handle: StateNodeHandle,
    ) -> Result<HostNodeMetadata, HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::TextInstance)?;
        Ok(self.nodes.text_metadata(handle, scope)?)
    }

    fn metadata_for_target(
        &self,
        handle: StateNodeHandle,
        target: HostFiberTokenTarget,
    ) -> Result<HostNodeMetadata, HostWorkError> {
        match target {
            HostFiberTokenTarget::Instance => self.instance_metadata(handle),
            HostFiberTokenTarget::TextInstance => self.text_metadata(handle),
            _ => Err(Self::invalid_handle(handle, target)),
        }
    }

    pub(crate) fn invalidate_text_for_canary(
        &mut self,
        handle: StateNodeHandle,
    ) -> Result<(), HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::TextInstance)?;
        Ok(self.nodes.invalidate_text(handle, scope)?)
    }

    fn instance_count(&self) -> usize {
        self.nodes.instance_count()
    }

    fn text_count(&self) -> usize {
        self.nodes.text_count()
    }

    fn test_host_text_record_text(&self, handle: StateNodeHandle) -> Result<&str, HostWorkError> {
        Ok(self.test_host_text_record(handle)?.text())
    }

    fn test_host_text_record_update_count(
        &self,
        handle: StateNodeHandle,
    ) -> Result<usize, HostWorkError> {
        Ok(self.test_host_text_record(handle)?.update_count())
    }

    fn test_host_text_record_updates(
        &self,
        handle: StateNodeHandle,
    ) -> Result<&[HostNodeAppliedTextUpdate], HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::TextInstance)?;
        Ok(self.nodes.text_updates(handle, scope)?)
    }

    fn record_component_update(&mut self, payload: HostComponentUpdatePayload) {
        self.component_updates.push(payload);
    }

    fn record_text_update(&mut self, payload: HostTextUpdatePayload) {
        self.text_updates.push(payload);
    }

    fn ensure_host_update_not_consumed(
        &self,
        mutation: HostRootMutationApplyRecord,
    ) -> Result<(), HostWorkError> {
        if self
            .consumed_host_updates
            .iter()
            .any(|consumed| *consumed == mutation)
        {
            return Err(HostWorkError::ConsumedHostUpdatePayload {
                root: mutation.root(),
                fiber: mutation.fiber(),
                state_node: mutation.state_node(),
                kind: mutation.kind(),
            });
        }
        Ok(())
    }

    fn mark_host_update_consumed(&mut self, mutation: HostRootMutationApplyRecord) {
        debug_assert!(
            !self
                .consumed_host_updates
                .iter()
                .any(|consumed| *consumed == mutation)
        );
        self.consumed_host_updates.push(mutation);
    }

    fn component_update_payload(
        &self,
        mutation: HostRootMutationApplyRecord,
    ) -> Option<HostComponentUpdatePayload> {
        self.component_updates
            .iter()
            .find(|payload| {
                payload.work_in_progress() == mutation.fiber()
                    && payload.state_node() == mutation.state_node()
                    && Some(payload.current()) == mutation.alternate_fiber()
            })
            .cloned()
    }

    fn text_update_payload(
        &self,
        mutation: HostRootMutationApplyRecord,
    ) -> Option<HostTextUpdatePayload> {
        self.text_updates
            .iter()
            .find(|payload| {
                payload.root() == mutation.root()
                    && payload.work_in_progress() == mutation.fiber()
                    && payload.state_node() == mutation.state_node()
                    && Some(payload.current()) == mutation.alternate_fiber()
            })
            .cloned()
    }

    fn append_initial_child(
        &self,
        tokens: &HostFiberTokenStore,
        host: &mut RecordingHost,
        parent: &mut FakeInstance,
        root_id: FiberRootId,
        child_fiber: &fast_react_core::FiberNode,
    ) -> Result<(), HostWorkError> {
        let state_node = child_fiber.state_node();
        if state_node.is_none() {
            return Err(HostWorkError::MissingStateNode {
                fiber: child_fiber.id(),
                tag: child_fiber.tag(),
            });
        }

        match child_fiber.tag() {
            FiberTag::HostComponent => {
                let scope = self.validated_scope(
                    tokens,
                    state_node,
                    root_id,
                    child_fiber.id(),
                    HostFiberTokenTarget::Instance,
                )?;
                let child = self.nodes.instance(state_node, scope)?;
                host.append_initial_child(parent, HostChild::Instance(child))?;
            }
            FiberTag::HostText => {
                let scope = self.validated_scope(
                    tokens,
                    state_node,
                    root_id,
                    child_fiber.id(),
                    HostFiberTokenTarget::TextInstance,
                )?;
                let child = self.nodes.text(state_node, scope)?;
                host.append_initial_child(parent, HostChild::Text(child))?;
            }
            actual => {
                return Err(HostWorkError::ExpectedFiberTag {
                    fiber: child_fiber.id(),
                    expected: FiberTag::HostComponent,
                    actual,
                });
            }
        }

        Ok(())
    }

    fn remember_scope(&mut self, handle: StateNodeHandle, scope: HostNodeScope) {
        let index = (handle.raw() - 1) as usize;
        if self.scopes.len() <= index {
            self.scopes.resize(index + 1, None);
        }
        self.scopes[index] = Some(scope);
    }

    fn validated_scope(
        &self,
        tokens: &HostFiberTokenStore,
        handle: StateNodeHandle,
        root_id: FiberRootId,
        fiber_id: FiberId,
        target: HostFiberTokenTarget,
    ) -> Result<HostNodeScope, HostWorkError> {
        let stored_scope = self.scope(handle, target)?;
        let lookup_scope = HostNodeScope::new(
            root_id,
            fiber_id,
            stored_scope.token_id(),
            stored_scope.phase(),
        );
        tokens.validate(
            lookup_scope.token_id(),
            lookup_scope.root_id(),
            lookup_scope.fiber_id(),
            lookup_scope.phase(),
            target,
        )?;
        Ok(lookup_scope)
    }

    fn validated_text_update_execution_scope(
        &self,
        tokens: &HostFiberTokenStore,
        handle: StateNodeHandle,
        root_id: FiberRootId,
        fiber_id: FiberId,
    ) -> Result<HostNodeScope, HostWorkError> {
        let stored_scope = self.scope(handle, HostFiberTokenTarget::TextInstance)?;
        if stored_scope.root_id() != root_id {
            return Err(HostNodeValidationError::new(
                handle,
                stored_scope.phase(),
                HostFiberTokenTarget::TextInstance,
                HostNodeViolation::WrongRoot,
            )
            .into());
        }

        let lookup_scope = HostNodeScope::new(
            root_id,
            fiber_id,
            stored_scope.token_id(),
            stored_scope.phase(),
        );
        self.nodes.text(handle, lookup_scope)?;
        tokens.validate(
            lookup_scope.token_id(),
            lookup_scope.root_id(),
            lookup_scope.fiber_id(),
            lookup_scope.phase(),
            HostFiberTokenTarget::TextInstance,
        )?;
        Ok(lookup_scope)
    }

    fn validated_scope_for_apply_fiber(
        &self,
        store: &FiberRootStore<RecordingHost>,
        handle: StateNodeHandle,
        root_id: FiberRootId,
        fiber_id: FiberId,
        target: HostFiberTokenTarget,
    ) -> Result<HostNodeScope, HostWorkError> {
        let stored_scope = self.scope(handle, target)?;
        let lookup_scope = HostNodeScope::new(
            root_id,
            stored_scope.fiber_id(),
            stored_scope.token_id(),
            stored_scope.phase(),
        );

        match target {
            HostFiberTokenTarget::Instance => {
                self.nodes.instance_metadata(handle, lookup_scope)?;
            }
            HostFiberTokenTarget::TextInstance => {
                self.nodes.text_metadata(handle, lookup_scope)?;
            }
            _ => return Err(Self::invalid_handle(handle, target)),
        }

        let owner = stored_scope.fiber_id();
        if owner != fiber_id {
            let requested_node = store.fiber_arena().get(fiber_id)?;
            let owner_node = store.fiber_arena().get(owner)?;
            let owner_matches_requested_alternate = requested_node.alternate() == Some(owner)
                || owner_node.alternate() == Some(fiber_id);
            if !owner_matches_requested_alternate {
                return Err(HostNodeValidationError::new(
                    handle,
                    stored_scope.phase(),
                    target,
                    HostNodeViolation::WrongFiber,
                )
                .into());
            }
        }

        store.host_tokens().validate(
            lookup_scope.token_id(),
            lookup_scope.root_id(),
            lookup_scope.fiber_id(),
            lookup_scope.phase(),
            target,
        )?;
        Ok(lookup_scope)
    }

    fn scope(
        &self,
        handle: StateNodeHandle,
        target: HostFiberTokenTarget,
    ) -> Result<HostNodeScope, HostWorkError> {
        if handle.is_none() {
            return Err(Self::invalid_handle(handle, target));
        }

        self.scopes
            .get((handle.raw() - 1) as usize)
            .copied()
            .flatten()
            .ok_or_else(|| Self::invalid_handle(handle, target))
    }

    fn invalid_handle(handle: StateNodeHandle, target: HostFiberTokenTarget) -> HostWorkError {
        match target {
            HostFiberTokenTarget::Instance => HostWorkError::InvalidDetachedInstance { handle },
            HostFiberTokenTarget::TextInstance => HostWorkError::InvalidDetachedText { handle },
            _ => HostWorkError::InvalidDetachedInstance { handle },
        }
    }

    fn remember_test_host_text_record(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        text: String,
    ) {
        let index = (handle.raw() - 1) as usize;
        if self.test_host_text_records.len() <= index {
            self.test_host_text_records.resize(index + 1, None);
        }
        self.test_host_text_records[index] = Some(TestHostTextRecord {
            handle,
            root_id: scope.root_id(),
            fiber_id: scope.fiber_id(),
            token_id: scope.token_id(),
            text,
            update_count: 0,
        });
    }

    fn test_host_text_record(
        &self,
        handle: StateNodeHandle,
    ) -> Result<&TestHostTextRecord, HostWorkError> {
        if handle.is_none() {
            return Err(Self::invalid_handle(
                handle,
                HostFiberTokenTarget::TextInstance,
            ));
        }

        self.test_host_text_records
            .get((handle.raw() - 1) as usize)
            .and_then(Option::as_ref)
            .ok_or_else(|| Self::invalid_handle(handle, HostFiberTokenTarget::TextInstance))
    }

    fn test_host_text_record_mut(
        &mut self,
        handle: StateNodeHandle,
    ) -> Result<&mut TestHostTextRecord, HostWorkError> {
        if handle.is_none() {
            return Err(Self::invalid_handle(
                handle,
                HostFiberTokenTarget::TextInstance,
            ));
        }

        self.test_host_text_records
            .get_mut((handle.raw() - 1) as usize)
            .and_then(Option::as_mut)
            .ok_or_else(|| Self::invalid_handle(handle, HostFiberTokenTarget::TextInstance))
    }

    fn preflight_test_host_text_record_update(
        &self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        old_text: &str,
        new_text: &str,
        source_currentness: Option<HostNodeUpdateCurrentness>,
    ) -> Result<HostNodeTextUpdate, HostWorkError> {
        {
            let record = self.test_host_text_record(handle)?;
            if record.root_id() != scope.root_id() {
                return Err(HostNodeValidationError::new(
                    handle,
                    scope.phase(),
                    HostFiberTokenTarget::TextInstance,
                    HostNodeViolation::WrongRoot,
                )
                .into());
            }
            if record.fiber_id() != scope.fiber_id() {
                return Err(HostNodeValidationError::new(
                    handle,
                    scope.phase(),
                    HostFiberTokenTarget::TextInstance,
                    HostNodeViolation::WrongFiber,
                )
                .into());
            }
            if record.token_id() != scope.token_id() {
                return Err(HostNodeValidationError::new(
                    handle,
                    scope.phase(),
                    HostFiberTokenTarget::TextInstance,
                    HostNodeViolation::WrongToken,
                )
                .into());
            }
            if record.text() != old_text {
                return Err(HostWorkError::HostTextCommitRecordMismatch {
                    root: scope.root_id(),
                    state_node: handle,
                    expected_old_text: old_text.to_owned(),
                    actual_text: record.text().to_owned(),
                });
            }
        }

        let update = match source_currentness {
            Some(currentness) => {
                HostNodeTextUpdate::new(old_text, new_text).with_currentness(currentness)
            }
            None => HostNodeTextUpdate::new(old_text, new_text).without_currentness_for_canary(),
        };
        self.nodes.preflight_text_update(handle, scope, &update)?;
        Ok(update)
    }

    fn commit_preflighted_test_host_text_record(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        update: HostNodeTextUpdate,
    ) -> Result<usize, HostWorkError> {
        let applied = self.nodes.apply_text_update(handle, scope, update)?;

        let record = self.test_host_text_record_mut(handle)?;
        debug_assert_eq!(applied.sequence(), record.update_count());

        record.text = applied.new_text().to_owned();
        record.update_count += 1;
        Ok(record.update_count())
    }
}

pub(crate) fn create_detached_test_host_component_for_existing_fiber_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    fiber: FiberId,
    ty: &'static str,
    props: PropsHandle,
    initial_children: &[FiberId],
) -> Result<StateNodeHandle, HostWorkError> {
    expect_tag(store, fiber, FiberTag::HostComponent)?;

    let scope =
        issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::Instance)?;
    let token = FakeHostFiberToken(scope.token_id().raw());
    let container = *store.root(root_id)?.container_info();
    let mut instance = host.create_instance(
        HostFiberTokenRef::new(
            &token,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        ),
        &ty,
        &(),
        &container,
        &(),
    )?;
    for &child in initial_children {
        detached_hosts.append_initial_child(
            store.host_tokens(),
            host,
            &mut instance,
            root_id,
            store.fiber_arena().get(child)?,
        )?;
    }
    host.finalize_initial_children(&mut instance, &ty, &(), &container, &())?;
    let state_node = detached_hosts.insert_instance(scope, instance);
    complete_fiber_common(
        store,
        fiber,
        props,
        state_node,
        InitialChildrenFinalization::NoCommitMount,
    )?;
    Ok(state_node)
}

pub(crate) fn create_detached_test_host_text_for_existing_fiber_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    fiber: FiberId,
    text: &str,
    props: PropsHandle,
) -> Result<StateNodeHandle, HostWorkError> {
    expect_tag(store, fiber, FiberTag::HostText)?;

    let scope =
        issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::TextInstance)?;
    let token = FakeHostFiberToken(scope.token_id().raw());
    let container = *store.root(root_id)?.container_info();
    let text_instance = host.create_text_instance(
        HostFiberTokenRef::new(
            &token,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        ),
        text,
        &container,
        &(),
    )?;
    let state_node = detached_hosts.insert_text(scope, text_instance);
    complete_fiber_common(
        store,
        fiber,
        props,
        state_node,
        InitialChildrenFinalization::NoCommitMount,
    )?;
    Ok(state_node)
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct TestHostTextRecord {
    handle: StateNodeHandle,
    root_id: FiberRootId,
    fiber_id: FiberId,
    token_id: crate::HostFiberTokenId,
    text: String,
    update_count: usize,
}

impl TestHostTextRecord {
    #[must_use]
    const fn root_id(&self) -> FiberRootId {
        self.root_id
    }

    #[must_use]
    const fn fiber_id(&self) -> FiberId {
        self.fiber_id
    }

    #[must_use]
    const fn token_id(&self) -> crate::HostFiberTokenId {
        self.token_id
    }

    #[must_use]
    fn text(&self) -> &str {
        &self.text
    }

    #[must_use]
    const fn update_count(&self) -> usize {
        self.update_count
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct DetachedHostCleanupOwnershipTransfer {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    source_fiber: FiberId,
    updated_fiber: FiberId,
    owner_fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
    target: HostFiberTokenTarget,
    source_metadata: HostNodeMetadata,
}

impl DetachedHostCleanupOwnershipTransfer {
    #[must_use]
    const fn new(
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        source_fiber: FiberId,
        updated_fiber: FiberId,
        owner_fiber: FiberId,
        tag: FiberTag,
        state_node: StateNodeHandle,
        target: HostFiberTokenTarget,
        source_metadata: HostNodeMetadata,
    ) -> Self {
        Self {
            root,
            host_root_work_in_progress,
            source_fiber,
            updated_fiber,
            owner_fiber,
            tag,
            state_node,
            target,
            source_metadata,
        }
    }

    #[must_use]
    const fn owner_fiber(self) -> FiberId {
        self.owner_fiber
    }
}

#[derive(Debug)]
pub(crate) struct HostWorkResult {
    root: FiberRootId,
    work_in_progress: FiberId,
    root_child: Option<FiberId>,
    root_children: Vec<FiberId>,
    completed_child: Option<FiberId>,
    completed_children: Vec<FiberId>,
    detached_hosts: DetachedHostRecords,
    sync_flush_host_work_epoch: usize,
    consumed_sync_flush_host_mutations: Vec<SyncFlushHostMutationExecutionIdentityForCanary>,
    consumed_root_child_replacements:
        Vec<root_replacement::RootChildReplacementExecutionIdentityForCanary>,
    cleanup_ownership_transfers: Vec<DetachedHostCleanupOwnershipTransfer>,
}

impl HostWorkResult {
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    pub(crate) const fn work_in_progress(&self) -> FiberId {
        self.work_in_progress
    }

    pub(crate) const fn root_child(&self) -> Option<FiberId> {
        self.root_child
    }

    pub(crate) fn root_children(&self) -> &[FiberId] {
        &self.root_children
    }

    pub(crate) fn root_child_count(&self) -> usize {
        self.root_children.len()
    }

    pub(crate) const fn completed_child(&self) -> Option<FiberId> {
        self.completed_child
    }

    pub(crate) fn completed_children(&self) -> &[FiberId] {
        &self.completed_children
    }

    pub(crate) fn completed_child_count(&self) -> usize {
        self.completed_children.len()
    }

    pub(crate) fn detached_instance_count(&self) -> usize {
        self.detached_hosts.instance_count()
    }

    pub(crate) fn detached_text_count(&self) -> usize {
        self.detached_hosts.text_count()
    }

    #[cfg(test)]
    pub(crate) fn detached_instance_metadata_for_canary(
        &self,
        handle: StateNodeHandle,
    ) -> Result<HostNodeMetadata, HostWorkError> {
        self.detached_hosts.instance_metadata(handle)
    }

    #[cfg(test)]
    pub(crate) fn detached_text_metadata_for_canary(
        &self,
        handle: StateNodeHandle,
    ) -> Result<HostNodeMetadata, HostWorkError> {
        self.detached_hosts.text_metadata(handle)
    }

    pub(crate) fn test_host_text_record_text_for_canary(
        &self,
        handle: StateNodeHandle,
    ) -> Result<&str, HostWorkError> {
        self.detached_hosts.test_host_text_record_text(handle)
    }

    pub(crate) fn test_host_text_record_update_count_for_canary(
        &self,
        handle: StateNodeHandle,
    ) -> Result<usize, HostWorkError> {
        self.detached_hosts
            .test_host_text_record_update_count(handle)
    }

    pub(crate) fn instance_property_update_count_for_canary(
        &self,
        handle: StateNodeHandle,
    ) -> Result<usize, HostWorkError> {
        Ok(self.detached_hosts.instance_property_updates(handle)?.len())
    }

    pub(crate) fn instance_latest_props_for_canary(
        &self,
        handle: StateNodeHandle,
    ) -> Result<Option<PropsHandle>, HostWorkError> {
        self.detached_hosts.instance_latest_props(handle)
    }

    pub(crate) fn instance_latest_props_update_count_for_canary(
        &self,
        handle: StateNodeHandle,
    ) -> Result<usize, HostWorkError> {
        Ok(self
            .detached_hosts
            .instance_latest_props_updates(handle)?
            .len())
    }

    pub(crate) fn mark_completed_host_component_update_payload_as_style_for_canary(
        &mut self,
    ) -> Result<(), HostWorkError> {
        self.mark_completed_host_component_update_payload_for_canary(
            TestHostComponentPropertyPayloadRow::style,
        )
    }

    pub(crate) fn mark_completed_host_component_update_payload_as_text_content_reset_for_canary(
        &mut self,
    ) -> Result<(), HostWorkError> {
        self.mark_completed_host_component_update_payload_for_canary(
            TestHostComponentPropertyPayloadRow::text_content_reset,
        )
    }

    fn mark_completed_host_component_update_payload_for_canary(
        &mut self,
        row: impl FnOnce(PropsHandle, PropsHandle) -> TestHostComponentPropertyPayloadRow,
    ) -> Result<(), HostWorkError> {
        let fiber = self
            .completed_child
            .ok_or(HostWorkError::MissingCurrentRootChild {
                root: self.root,
                current: self.work_in_progress,
            })?;
        let payload = self
            .detached_hosts
            .component_updates
            .iter_mut()
            .find(|payload| payload.work_in_progress() == fiber)
            .ok_or(HostWorkError::MissingHostComponentUpdatePayload {
                root: self.root,
                fiber,
                state_node: StateNodeHandle::NONE,
            })?;
        payload.property_row = row(payload.old_props(), payload.new_props());
        Ok(())
    }

    fn detached_hosts(&self) -> &DetachedHostRecords {
        &self.detached_hosts
    }

    fn detached_hosts_mut(&mut self) -> &mut DetachedHostRecords {
        &mut self.detached_hosts
    }

    pub(crate) fn detached_hosts_mut_for_canary(&mut self) -> &mut DetachedHostRecords {
        &mut self.detached_hosts
    }

    pub(crate) fn into_detached_hosts_for_canary(self) -> DetachedHostRecords {
        self.detached_hosts
    }

    pub(super) fn deletion_cleanup_owner_for_canary(
        &self,
        store: &FiberRootStore<RecordingHost>,
        cleanup: HostRootDeletionCleanupRecord,
    ) -> Result<FiberId, HostWorkError> {
        if cleanup.state_node().is_none() {
            return Ok(cleanup.fiber());
        }

        let node = store.fiber_arena().get(cleanup.fiber())?;
        let Some(source_fiber) = node.alternate() else {
            return Ok(cleanup.fiber());
        };

        let transfer = self.validate_transferred_detached_host_cleanup_ownership_for_canary(
            store,
            cleanup.fiber(),
            source_fiber,
            cleanup.tag(),
            cleanup.state_node(),
            None,
        )?;
        Ok(transfer.owner_fiber())
    }

    pub(crate) fn validate_detached_host_cleanup_ownership_for_canary(
        &self,
        store: &FiberRootStore<RecordingHost>,
    ) -> Result<(), HostWorkError> {
        for &child in &self.completed_children {
            self.validate_detached_host_cleanup_subtree_ownership_for_canary(store, child)?;
        }
        Ok(())
    }

    fn validate_detached_host_cleanup_subtree_ownership_for_canary(
        &self,
        store: &FiberRootStore<RecordingHost>,
        fiber: FiberId,
    ) -> Result<(), HostWorkError> {
        let node = store.fiber_arena().get(fiber)?;
        let tag = node.tag();
        let state_node = node.state_node();
        let mut child = node.child();

        match tag {
            FiberTag::HostComponent => {
                if state_node.is_none() {
                    return Err(HostWorkError::MissingStateNode { fiber, tag });
                }
                self.validate_detached_host_cleanup_fiber_ownership_for_canary(
                    store, fiber, tag, state_node,
                )?;
                while let Some(child_id) = child {
                    let sibling = store.fiber_arena().get(child_id)?.sibling();
                    self.validate_detached_host_cleanup_subtree_ownership_for_canary(
                        store, child_id,
                    )?;
                    child = sibling;
                }
                Ok(())
            }
            FiberTag::HostText => {
                if state_node.is_none() {
                    return Err(HostWorkError::MissingStateNode { fiber, tag });
                }
                self.validate_detached_host_cleanup_fiber_ownership_for_canary(
                    store, fiber, tag, state_node,
                )?;
                Ok(())
            }
            actual => Err(HostWorkError::ExpectedFiberTag {
                fiber,
                expected: FiberTag::HostComponent,
                actual,
            }),
        }
    }

    fn validate_detached_host_cleanup_fiber_ownership_for_canary(
        &self,
        store: &FiberRootStore<RecordingHost>,
        fiber: FiberId,
        tag: FiberTag,
        state_node: StateNodeHandle,
    ) -> Result<(), HostWorkError> {
        let node = store.fiber_arena().get(fiber)?;
        if let Some(source_fiber) = node.alternate() {
            self.validate_transferred_detached_host_cleanup_ownership_for_canary(
                store,
                fiber,
                source_fiber,
                tag,
                state_node,
                Some(self.work_in_progress),
            )?;
        } else {
            owned_detached_host_child_for_fiber(
                store,
                &self.detached_hosts,
                self.root,
                fiber,
                tag,
                state_node,
            )?;
        }
        Ok(())
    }

    fn validate_transferred_detached_host_cleanup_ownership_for_canary(
        &self,
        store: &FiberRootStore<RecordingHost>,
        updated_fiber: FiberId,
        source_fiber: FiberId,
        tag: FiberTag,
        state_node: StateNodeHandle,
        expected_host_root_work_in_progress: Option<FiberId>,
    ) -> Result<DetachedHostCleanupOwnershipTransfer, HostWorkError> {
        store
            .fiber_arena()
            .validate_alternate_pair(source_fiber, updated_fiber)?;
        let target = host_fiber_token_target_for_detached_host_tag(updated_fiber, tag)?;
        let transfer = self
            .cleanup_ownership_transfers
            .iter()
            .copied()
            .find(|transfer| {
                transfer.root == self.root
                    && transfer.source_fiber == source_fiber
                    && transfer.updated_fiber == updated_fiber
                    && transfer.tag == tag
                    && transfer.target == target
            })
            .ok_or(HostWorkError::MissingDetachedHostCleanupOwnershipTransfer {
                root: self.root,
                work_in_progress: self.work_in_progress,
                updated_fiber,
                source_fiber,
                tag,
                state_node,
            })?;

        if expected_host_root_work_in_progress
            .is_some_and(|expected| transfer.host_root_work_in_progress != expected)
            || transfer.owner_fiber != source_fiber
        {
            return Err(HostWorkError::InvalidDetachedHostCleanupOwnershipTransfer {
                root: self.root,
                work_in_progress: self.work_in_progress,
                updated_fiber,
                source_fiber,
                tag,
                state_node,
            });
        }

        let metadata = self
            .detached_hosts
            .metadata_for_target(state_node, target)?;
        validate_transferred_detached_host_cleanup_metadata(
            state_node, target, transfer, metadata,
        )?;
        if transfer.state_node != state_node {
            return Err(HostWorkError::InvalidDetachedHostCleanupOwnershipTransfer {
                root: self.root,
                work_in_progress: self.work_in_progress,
                updated_fiber,
                source_fiber,
                tag,
                state_node,
            });
        }
        Ok(transfer)
    }

    #[cfg(test)]
    pub(crate) fn from_detached_hosts_for_canary(
        root: FiberRootId,
        work_in_progress: FiberId,
        root_children: Vec<FiberId>,
        completed_children: Vec<FiberId>,
        detached_hosts: DetachedHostRecords,
    ) -> Self {
        let root_child = root_children.first().copied();
        let completed_child = completed_children.first().copied();
        Self {
            root,
            work_in_progress,
            root_child,
            root_children,
            completed_child,
            completed_children,
            detached_hosts,
            sync_flush_host_work_epoch: 0,
            consumed_sync_flush_host_mutations: Vec::new(),
            consumed_root_child_replacements: Vec::new(),
            cleanup_ownership_transfers: Vec::new(),
        }
    }

    fn sync_flush_host_mutation_execution_identity(
        &self,
        request: SyncFlushHostMutationExecutionRequestForCanary,
    ) -> SyncFlushHostMutationExecutionIdentityForCanary {
        SyncFlushHostMutationExecutionIdentityForCanary {
            root: request.root(),
            order: request.order(),
            render_lanes: request.render_lanes(),
            finished_lanes: request.finished_lanes(),
            finished_work: request.finished_work(),
            committed_current: request.committed_current(),
            mutation_record_count: request.mutation_record_count(),
            mutation_apply_record_count: request.mutation_apply_record_count(),
            host_root_placement_apply_count: request.host_root_placement_apply_count(),
            host_work_epoch: self.sync_flush_host_work_epoch,
        }
    }

    fn has_consumed_sync_flush_host_mutation_execution(
        &self,
        identity: SyncFlushHostMutationExecutionIdentityForCanary,
    ) -> bool {
        self.consumed_sync_flush_host_mutations
            .iter()
            .any(|consumed| *consumed == identity)
    }

    fn mark_sync_flush_host_mutation_execution_consumed(
        &mut self,
        identity: SyncFlushHostMutationExecutionIdentityForCanary,
    ) {
        self.consumed_sync_flush_host_mutations.push(identity);
    }

    fn retarget_finished_work_for_canary(
        &mut self,
        render: HostRootRenderPhaseRecord,
        completed_children: Vec<FiberId>,
    ) {
        let completed_child = completed_children.first().copied();
        self.sync_flush_host_work_epoch += 1;
        self.root = render.root();
        self.work_in_progress = render.work_in_progress();
        self.root_child = completed_child;
        self.root_children = completed_children.clone();
        self.completed_child = completed_child;
        self.completed_children = completed_children;
    }
}

fn host_fiber_token_target_for_detached_host_tag(
    fiber: FiberId,
    tag: FiberTag,
) -> Result<HostFiberTokenTarget, HostWorkError> {
    match tag {
        FiberTag::HostComponent => Ok(HostFiberTokenTarget::Instance),
        FiberTag::HostText => Ok(HostFiberTokenTarget::TextInstance),
        actual => Err(HostWorkError::ExpectedFiberTag {
            fiber,
            expected: FiberTag::HostComponent,
            actual,
        }),
    }
}

fn validate_transferred_detached_host_cleanup_metadata(
    state_node: StateNodeHandle,
    target: HostFiberTokenTarget,
    transfer: DetachedHostCleanupOwnershipTransfer,
    metadata: HostNodeMetadata,
) -> Result<(), HostWorkError> {
    let violation = if metadata.handle() != transfer.source_metadata.handle() {
        Some(HostNodeViolation::InvalidHandle)
    } else if metadata.target() != target || metadata.target() != transfer.source_metadata.target()
    {
        Some(HostNodeViolation::WrongTarget)
    } else if metadata.root_id() != transfer.root
        || metadata.root_id() != transfer.source_metadata.root_id()
    {
        Some(HostNodeViolation::WrongRoot)
    } else if metadata.fiber_id() != transfer.owner_fiber
        || metadata.fiber_id() != transfer.source_metadata.fiber_id()
    {
        Some(HostNodeViolation::WrongFiber)
    } else if metadata.token_id() != transfer.source_metadata.token_id()
        || metadata.phase() != transfer.source_metadata.phase()
    {
        Some(HostNodeViolation::WrongToken)
    } else if !metadata.is_active() || !transfer.source_metadata.is_active() {
        Some(HostNodeViolation::Stale)
    } else {
        None
    };

    if let Some(violation) = violation {
        return Err(
            HostNodeValidationError::new(state_node, metadata.phase(), target, violation).into(),
        );
    }

    Ok(())
}

fn detached_host_cleanup_ownership_transfer_for_update(
    detached_hosts: &DetachedHostRecords,
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    source_fiber: FiberId,
    updated_fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
    target: HostFiberTokenTarget,
) -> Result<DetachedHostCleanupOwnershipTransfer, HostWorkError> {
    let source_metadata = detached_hosts.metadata_for_target(state_node, target)?;
    let violation = if source_metadata.target() != target {
        Some(HostNodeViolation::WrongTarget)
    } else if source_metadata.root_id() != root {
        Some(HostNodeViolation::WrongRoot)
    } else if source_metadata.fiber_id() != source_fiber {
        Some(HostNodeViolation::WrongFiber)
    } else if !source_metadata.is_active() {
        Some(HostNodeViolation::Stale)
    } else {
        None
    };
    if let Some(violation) = violation {
        return Err(HostNodeValidationError::new(
            state_node,
            source_metadata.phase(),
            target,
            violation,
        )
        .into());
    }

    Ok(DetachedHostCleanupOwnershipTransfer::new(
        root,
        host_root_work_in_progress,
        source_fiber,
        updated_fiber,
        source_metadata.fiber_id(),
        tag,
        state_node,
        target,
        source_metadata,
    ))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct SyncFlushHostMutationExecutionIdentityForCanary {
    root: FiberRootId,
    order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    finished_work: FiberId,
    committed_current: FiberId,
    mutation_record_count: usize,
    mutation_apply_record_count: usize,
    host_root_placement_apply_count: usize,
    host_work_epoch: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushHostMutationExecutionRequestForCanary {
    root: FiberRootId,
    order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    remaining_lanes: Lanes,
    pending_lanes: Lanes,
    finished_work: FiberId,
    committed_current: FiberId,
    mutation_record_count: usize,
    mutation_apply_record_count: usize,
    host_root_placement_apply_count: usize,
}

impl SyncFlushHostMutationExecutionRequestForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn order(self) -> usize {
        self.order
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
    pub(crate) const fn pending_lanes(self) -> Lanes {
        self.pending_lanes
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
    pub(crate) const fn mutation_record_count(self) -> usize {
        self.mutation_record_count
    }

    #[must_use]
    pub(crate) const fn mutation_apply_record_count(self) -> usize {
        self.mutation_apply_record_count
    }

    #[must_use]
    pub(crate) const fn host_root_placement_apply_count(self) -> usize {
        self.host_root_placement_apply_count
    }

    #[must_use]
    fn matches_sync_flush_record(self, record: &SyncFlushRootRecord) -> bool {
        self.root == record.root()
            && self.order == record.order()
            && self.render_lanes == record.render_lanes()
            && self.finished_lanes == record.commit().finished_lanes()
            && self.remaining_lanes == record.commit().remaining_lanes()
            && self.pending_lanes == record.commit().pending_lanes()
            && self.finished_work == record.commit().finished_work()
            && self.committed_current == record.commit().current()
            && self.mutation_record_count == record.commit().mutation_log().len()
            && self.mutation_apply_record_count == record.commit().mutation_apply_log().len()
            && self.host_root_placement_apply_count
                == record
                    .commit()
                    .host_root_placement_apply_diagnostics_for_canary()
                    .len()
    }

    #[must_use]
    pub(crate) const fn private_opt_in_host_mutation_execution_requested(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushHostMutationExecutionDiagnosticForCanary {
    request: SyncFlushHostMutationExecutionRequestForCanary,
    applied_host_call_count: usize,
    private_host_store_update_count: usize,
    recorded_only_count: usize,
    deletion_cleanup_apply_count: usize,
}

impl SyncFlushHostMutationExecutionDiagnosticForCanary {
    #[must_use]
    pub(crate) const fn request(&self) -> SyncFlushHostMutationExecutionRequestForCanary {
        self.request
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.request.root()
    }

    #[must_use]
    pub(crate) const fn order(&self) -> usize {
        self.request.order()
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.request.finished_work()
    }

    #[must_use]
    pub(crate) const fn mutation_apply_record_count(&self) -> usize {
        self.request.mutation_apply_record_count()
    }

    #[must_use]
    pub(crate) const fn applied_host_call_count(&self) -> usize {
        self.applied_host_call_count
    }

    #[must_use]
    pub(crate) const fn private_host_store_update_count(&self) -> usize {
        self.private_host_store_update_count
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
    pub(crate) const fn private_opt_in_host_mutation_execution_requested(&self) -> bool {
        self.request
            .private_opt_in_host_mutation_execution_requested()
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_executed(&self) -> bool {
        self.applied_host_call_count
            + self.private_host_store_update_count
            + self.deletion_cleanup_apply_count
            > 0
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum SyncFlushHostMutationExecutionErrorForCanary {
    StaleFinishedWorkEvidence {
        root: FiberRootId,
        order: usize,
    },
    MismatchedRootOwnership {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
    },
    MismatchedSyncFlushLanes {
        root: FiberRootId,
        expected_render_lanes: Lanes,
        actual_render_lanes: Lanes,
        expected_finished_lanes: Lanes,
        actual_finished_lanes: Lanes,
    },
    MismatchedFinishedWork {
        root: FiberRootId,
        expected_finished_work: FiberId,
        actual_finished_work: FiberId,
    },
    ReplayedHostMutationExecution {
        root: FiberRootId,
        order: usize,
        finished_work: FiberId,
    },
    MissingHostMutationMetadata {
        root: FiberRootId,
        finished_work: FiberId,
    },
    HostWork(HostWorkError),
}

impl Display for SyncFlushHostMutationExecutionErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::StaleFinishedWorkEvidence { root, order } => write!(
                formatter,
                "sync-flush host mutation execution rejected stale finished-work evidence for root {} order {}",
                root.raw(),
                order
            ),
            Self::MismatchedRootOwnership {
                expected_root,
                actual_root,
            } => write!(
                formatter,
                "sync-flush host mutation execution root ownership mismatch: expected root {}, found root {}",
                expected_root.raw(),
                actual_root.raw()
            ),
            Self::MismatchedSyncFlushLanes {
                root,
                expected_render_lanes,
                actual_render_lanes,
                expected_finished_lanes,
                actual_finished_lanes,
            } => write!(
                formatter,
                "sync-flush host mutation execution lanes mismatch for root {}: render {:?}/{:?}, finished {:?}/{:?}",
                root.raw(),
                actual_render_lanes,
                expected_render_lanes,
                actual_finished_lanes,
                expected_finished_lanes
            ),
            Self::MismatchedFinishedWork {
                root,
                expected_finished_work,
                actual_finished_work,
            } => write!(
                formatter,
                "sync-flush host mutation execution finished work mismatch for root {}: expected fiber slot {}, found fiber slot {}",
                root.raw(),
                expected_finished_work.slot().get(),
                actual_finished_work.slot().get()
            ),
            Self::ReplayedHostMutationExecution {
                root,
                order,
                finished_work,
            } => write!(
                formatter,
                "sync-flush host mutation execution rejected replay for root {} order {} finished work fiber slot {}",
                root.raw(),
                order,
                finished_work.slot().get()
            ),
            Self::MissingHostMutationMetadata {
                root,
                finished_work,
            } => write!(
                formatter,
                "sync-flush host mutation execution for root {} finished work fiber slot {} has no host mutation apply metadata",
                root.raw(),
                finished_work.slot().get()
            ),
            Self::HostWork(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for SyncFlushHostMutationExecutionErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::HostWork(error) => Some(error),
            Self::StaleFinishedWorkEvidence { .. }
            | Self::MismatchedRootOwnership { .. }
            | Self::MismatchedSyncFlushLanes { .. }
            | Self::MismatchedFinishedWork { .. }
            | Self::ReplayedHostMutationExecution { .. }
            | Self::MissingHostMutationMetadata { .. } => None,
        }
    }
}

impl From<HostWorkError> for SyncFlushHostMutationExecutionErrorForCanary {
    fn from(error: HostWorkError) -> Self {
        Self::HostWork(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostRootHostUpdateExecutionBlockerForCanary {
    PublicRootRendering,
    ReactDomCompatibility,
    TestRendererCompatibility,
    PublicRendererPackageBehavior,
}

const TEST_HOST_ROOT_HOST_UPDATE_EXECUTION_BLOCKERS:
    [TestHostRootHostUpdateExecutionBlockerForCanary; 4] = [
    TestHostRootHostUpdateExecutionBlockerForCanary::PublicRootRendering,
    TestHostRootHostUpdateExecutionBlockerForCanary::ReactDomCompatibility,
    TestHostRootHostUpdateExecutionBlockerForCanary::TestRendererCompatibility,
    TestHostRootHostUpdateExecutionBlockerForCanary::PublicRendererPackageBehavior,
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestHostRootHostUpdateExecutionDiagnosticForCanary {
    root: FiberRootId,
    finished_work: FiberId,
    source_handoff_order: usize,
    commit_order: usize,
    mutation: HostRootMutationApplyRecord,
    payload: TestHostRootHostUpdatePayloadForCanary,
    status: TestHostRootMutationApplyStatus,
    applied_host_call_count: usize,
    private_host_store_update_count: usize,
    blockers: [TestHostRootHostUpdateExecutionBlockerForCanary; 4],
}

impl TestHostRootHostUpdateExecutionDiagnosticForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(&self) -> usize {
        self.source_handoff_order
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn mutation(&self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    pub(crate) const fn payload(&self) -> &TestHostRootHostUpdatePayloadForCanary {
        &self.payload
    }

    #[must_use]
    pub(crate) const fn status(&self) -> TestHostRootMutationApplyStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn applied_host_call_count(&self) -> usize {
        self.applied_host_call_count
    }

    #[must_use]
    pub(crate) const fn private_host_store_update_count(&self) -> usize {
        self.private_host_store_update_count
    }

    #[must_use]
    pub(crate) fn test_host_commit_executed(&self) -> bool {
        matches!(
            self.status,
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::CommitUpdate
                    | TestHostRootMutationHostCall::CommitTextUpdate
                    | TestHostRootMutationHostCall::ResetTextContent
            )
        )
    }

    #[must_use]
    pub(crate) fn private_host_store_only_commit_executed(&self) -> bool {
        matches!(
            self.status,
            TestHostRootMutationApplyStatus::PrivateHostStoreOnly(
                TestHostRootPrivateStoreMutation::HostComponentPropertyAndLatestProps
            )
        )
    }

    #[must_use]
    pub(crate) const fn blockers(&self) -> &[TestHostRootHostUpdateExecutionBlockerForCanary; 4] {
        &self.blockers
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_renderer_package_behavior_exposed(&self) -> bool {
        false
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
    pub(crate) const fn public_dom_property_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestHostRootHostUpdateFinishedWorkExecutionForCanary {
    pending_update: crate::root_commit::HostRootSingleHostUpdateApplyRecordForCanary,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    committed_update: crate::root_commit::HostRootSingleHostUpdateApplyRecordForCanary,
    diagnostic: TestHostRootHostUpdateExecutionDiagnosticForCanary,
}

impl TestHostRootHostUpdateFinishedWorkExecutionForCanary {
    #[must_use]
    pub(crate) const fn pending_update(
        &self,
    ) -> crate::root_commit::HostRootSingleHostUpdateApplyRecordForCanary {
        self.pending_update
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    pub(crate) const fn committed_update(
        &self,
    ) -> crate::root_commit::HostRootSingleHostUpdateApplyRecordForCanary {
        self.committed_update
    }

    #[must_use]
    pub(crate) const fn diagnostic(&self) -> &TestHostRootHostUpdateExecutionDiagnosticForCanary {
        &self.diagnostic
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum TestHostRootHostUpdateExecutionErrorForCanary {
    FinishedWorkHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    HostUpdateRecord(HostRootSingleHostUpdateApplyRecordErrorForCanary),
    UnsupportedPayload {
        root: FiberRootId,
        finished_work: FiberId,
        fiber: FiberId,
        kind: HostRootMutationApplyRecordKind,
    },
    HostWork(HostWorkError),
    HostUpdateNotApplied {
        root: FiberRootId,
        finished_work: FiberId,
        fiber: FiberId,
        status: Option<TestHostRootMutationApplyStatus>,
    },
}

impl Display for TestHostRootHostUpdateExecutionErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FinishedWorkHandoff(error) => Display::fmt(error, formatter),
            Self::HostUpdateRecord(error) => Display::fmt(error, formatter),
            Self::UnsupportedPayload {
                root,
                finished_work,
                fiber,
                kind,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} rejected unsupported private test-host update payload for fiber slot {} ({kind:?}) before mutation",
                root.raw(),
                finished_work.slot().get(),
                fiber.slot().get()
            ),
            Self::HostWork(error) => Display::fmt(error, formatter),
            Self::HostUpdateNotApplied {
                root,
                finished_work,
                fiber,
                status,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} did not apply private test-host update for fiber slot {}; status was {:?}",
                root.raw(),
                finished_work.slot().get(),
                fiber.slot().get(),
                status
            ),
        }
    }
}

impl Error for TestHostRootHostUpdateExecutionErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FinishedWorkHandoff(error) => Some(error.as_ref()),
            Self::HostUpdateRecord(error) => Some(error),
            Self::HostWork(error) => Some(error),
            Self::UnsupportedPayload { .. } | Self::HostUpdateNotApplied { .. } => None,
        }
    }
}

impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for TestHostRootHostUpdateExecutionErrorForCanary
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkHandoff(Box::new(error))
    }
}

impl From<HostRootSingleHostUpdateApplyRecordErrorForCanary>
    for TestHostRootHostUpdateExecutionErrorForCanary
{
    fn from(error: HostRootSingleHostUpdateApplyRecordErrorForCanary) -> Self {
        Self::HostUpdateRecord(error)
    }
}

impl From<HostWorkError> for TestHostRootHostUpdateExecutionErrorForCanary {
    fn from(error: HostWorkError) -> Self {
        Self::HostWork(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TestHostRootManagedChildExecutionBlockerForCanary {
    PublicRootRendering,
    PublicRendererHostMutation,
    ReactDomManagedChildCompatibility,
    ReactTestRendererCompatibility,
    HydrationEventsRefsResourcesFormsControlledInputCompatibility,
    PublicCompatibilityClaim,
}

const TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS:
    [TestHostRootManagedChildExecutionBlockerForCanary; 6] = [
    TestHostRootManagedChildExecutionBlockerForCanary::PublicRootRendering,
    TestHostRootManagedChildExecutionBlockerForCanary::PublicRendererHostMutation,
    TestHostRootManagedChildExecutionBlockerForCanary::ReactDomManagedChildCompatibility,
    TestHostRootManagedChildExecutionBlockerForCanary::ReactTestRendererCompatibility,
    TestHostRootManagedChildExecutionBlockerForCanary::HydrationEventsRefsResourcesFormsControlledInputCompatibility,
    TestHostRootManagedChildExecutionBlockerForCanary::PublicCompatibilityClaim,
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestHostRootManagedChildExecutionDiagnosticForCanary {
    root: FiberRootId,
    finished_work: FiberId,
    source_handoff_order: usize,
    commit_order: usize,
    request_order: usize,
    kind: HostComponentManagedChildMutationKindForCanary,
    mutation: HostRootMutationApplyRecord,
    mutation_status: TestHostRootMutationApplyStatus,
    cleanup_status: Option<TestHostRootDeletionCleanupStatus>,
    applied_host_call_count: usize,
    deletion_cleanup_apply_count: usize,
    blockers: [TestHostRootManagedChildExecutionBlockerForCanary; 6],
}

impl TestHostRootManagedChildExecutionDiagnosticForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(&self) -> usize {
        self.source_handoff_order
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn request_order(&self) -> usize {
        self.request_order
    }

    #[must_use]
    pub(crate) const fn kind(&self) -> HostComponentManagedChildMutationKindForCanary {
        self.kind
    }

    #[must_use]
    pub(crate) const fn mutation(&self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    pub(crate) const fn mutation_status(&self) -> TestHostRootMutationApplyStatus {
        self.mutation_status
    }

    #[must_use]
    pub(crate) const fn cleanup_status(&self) -> Option<TestHostRootDeletionCleanupStatus> {
        self.cleanup_status
    }

    #[must_use]
    pub(crate) const fn applied_host_call_count(&self) -> usize {
        self.applied_host_call_count
    }

    #[must_use]
    pub(crate) const fn deletion_cleanup_apply_count(&self) -> usize {
        self.deletion_cleanup_apply_count
    }

    #[must_use]
    const fn blockers(&self) -> &[TestHostRootManagedChildExecutionBlockerForCanary; 6] {
        &self.blockers
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_executed(&self) -> bool {
        match self.kind {
            HostComponentManagedChildMutationKindForCanary::Placement => matches!(
                self.mutation_status,
                TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
            ),
            HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
                matches!(
                    self.mutation_status,
                    TestHostRootMutationApplyStatus::Applied(
                        TestHostRootMutationHostCall::RemoveChild
                    )
                ) && managed_child_deletion_cleanup_status_matches_tag(
                    self.cleanup_status,
                    self.mutation.tag(),
                )
            }
        }
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(&self) -> bool {
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
    pub(crate) const fn hydration_events_refs_resources_forms_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestHostRootManagedChildSiblingOrderExecutionDiagnosticForCanary {
    root: FiberRootId,
    finished_work: FiberId,
    source_handoff_order: usize,
    commit_order: usize,
    request_order: usize,
    kind: HostComponentManagedChildMutationKindForCanary,
    order_evidence_name: &'static str,
    order_sibling: FiberId,
    order_sibling_state_node: StateNodeHandle,
    mutation: HostRootMutationApplyRecord,
    mutation_status: TestHostRootMutationApplyStatus,
    cleanup_status: Option<TestHostRootDeletionCleanupStatus>,
    applied_host_call_count: usize,
    deletion_cleanup_apply_count: usize,
    blockers: [TestHostRootManagedChildExecutionBlockerForCanary; 6],
}

impl TestHostRootManagedChildSiblingOrderExecutionDiagnosticForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(&self) -> usize {
        self.source_handoff_order
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn request_order(&self) -> usize {
        self.request_order
    }

    #[must_use]
    pub(crate) const fn kind(&self) -> HostComponentManagedChildMutationKindForCanary {
        self.kind
    }

    #[must_use]
    pub(crate) const fn order_evidence_name(&self) -> &'static str {
        self.order_evidence_name
    }

    #[must_use]
    pub(crate) const fn order_sibling(&self) -> FiberId {
        self.order_sibling
    }

    #[must_use]
    pub(crate) const fn order_sibling_state_node(&self) -> StateNodeHandle {
        self.order_sibling_state_node
    }

    #[must_use]
    pub(crate) const fn mutation(&self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    pub(crate) const fn mutation_status(&self) -> TestHostRootMutationApplyStatus {
        self.mutation_status
    }

    #[must_use]
    pub(crate) const fn cleanup_status(&self) -> Option<TestHostRootDeletionCleanupStatus> {
        self.cleanup_status
    }

    #[must_use]
    pub(crate) const fn applied_host_call_count(&self) -> usize {
        self.applied_host_call_count
    }

    #[must_use]
    pub(crate) const fn deletion_cleanup_apply_count(&self) -> usize {
        self.deletion_cleanup_apply_count
    }

    #[must_use]
    const fn blockers(&self) -> &[TestHostRootManagedChildExecutionBlockerForCanary; 6] {
        &self.blockers
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_executed(&self) -> bool {
        match self.kind {
            HostComponentManagedChildMutationKindForCanary::Placement => matches!(
                self.mutation_status,
                TestHostRootMutationApplyStatus::Applied(
                    TestHostRootMutationHostCall::InsertBefore
                )
            ),
            HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
                matches!(
                    self.mutation_status,
                    TestHostRootMutationApplyStatus::Applied(
                        TestHostRootMutationHostCall::RemoveChild
                    )
                ) && managed_child_deletion_cleanup_status_matches_tag(
                    self.cleanup_status,
                    self.mutation.tag(),
                )
            }
        }
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(&self) -> bool {
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
    pub(crate) const fn hydration_events_refs_resources_forms_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum TestHostRootManagedChildExecutionErrorForCanary {
    HostWork(HostWorkError),
    UnexpectedMutationApplyCount {
        root: FiberRootId,
        finished_work: FiberId,
        expected: usize,
        actual: usize,
    },
    MutationNotApplied {
        root: FiberRootId,
        finished_work: FiberId,
        fiber: FiberId,
        status: Option<TestHostRootMutationApplyStatus>,
    },
    CleanupNotApplied {
        root: FiberRootId,
        finished_work: FiberId,
        fiber: FiberId,
        status: Option<TestHostRootDeletionCleanupStatus>,
    },
}

impl Display for TestHostRootManagedChildExecutionErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::HostWork(error) => Display::fmt(error, formatter),
            Self::UnexpectedMutationApplyCount {
                root,
                finished_work,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} expected {expected} managed child mutation apply record, found {actual}",
                root.raw(),
                finished_work.slot().get()
            ),
            Self::MutationNotApplied {
                root,
                finished_work,
                fiber,
                status,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} did not apply managed child mutation for fiber slot {}; status was {:?}",
                root.raw(),
                finished_work.slot().get(),
                fiber.slot().get(),
                status
            ),
            Self::CleanupNotApplied {
                root,
                finished_work,
                fiber,
                status,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} did not apply managed child delete cleanup for fiber slot {}; status was {:?}",
                root.raw(),
                finished_work.slot().get(),
                fiber.slot().get(),
                status
            ),
        }
    }
}

impl Error for TestHostRootManagedChildExecutionErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::HostWork(error) => Some(error),
            Self::UnexpectedMutationApplyCount { .. }
            | Self::MutationNotApplied { .. }
            | Self::CleanupNotApplied { .. } => None,
        }
    }
}

impl From<HostWorkError> for TestHostRootManagedChildExecutionErrorForCanary {
    fn from(error: HostWorkError) -> Self {
        Self::HostWork(error)
    }
}

fn apply_test_host_root_commit_mutations(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    commit: &HostRootCommitRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationApplyResult, HostWorkError> {
    let root = store.root(commit.root())?;
    if root.current() != commit.current() {
        return Err(HostWorkError::CommitCurrentMismatch {
            root: commit.root(),
            expected: commit.current(),
            actual: root.current(),
        });
    }

    let mut container = *root.container_info();
    let mut records = Vec::new();

    preflight_test_host_root_update_consumption(commit, detached_hosts)?;
    preflight_test_host_root_component_property_updates(store, commit, detached_hosts)?;

    for &mutation in commit.mutation_apply_log().records() {
        let status = apply_test_host_root_mutation_record(
            store,
            host,
            &mut container,
            mutation,
            detached_hosts,
        )?;
        records.push(TestHostRootMutationApplyRecord { mutation, status });
    }

    Ok(TestHostRootMutationApplyResult {
        root: commit.root(),
        finished_work: commit.finished_work(),
        records,
    })
}

pub(crate) fn apply_test_host_root_commit_mutations_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    commit: &HostRootCommitRecord,
    host_work: &mut HostWorkResult,
) -> Result<TestHostRootMutationApplyResult, HostWorkError> {
    apply_test_host_root_commit_mutations(store, host, commit, host_work.detached_hosts_mut())
}

#[cfg(test)]
pub(crate) fn complete_test_function_component_single_host_update_work_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    update: FunctionComponentSingleChildUpdateReconciliationRecord,
    source: &TestHostTree,
    mut detached_hosts: DetachedHostRecords,
) -> Result<HostWorkResult, HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    expect_tag(
        store,
        update.function_component(),
        FiberTag::FunctionComponent,
    )?;
    let function_node = store.fiber_arena().get(update.function_component())?;
    let root_child = store.fiber_arena().get(render.work_in_progress())?.child();
    if root_child != Some(update.function_component())
        || function_node.return_fiber() != Some(render.work_in_progress())
        || function_node.sibling().is_some()
        || function_node.alternate() != Some(update.current())
    {
        return Err(HostWorkError::FunctionComponentParentTopologyMismatch(
            Box::new(FunctionComponentParentTopologyMismatchRecord {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                function_component: update.function_component(),
                actual_root_child: root_child,
                actual_parent: function_node.return_fiber(),
                actual_sibling: function_node.sibling(),
            }),
        ));
    }

    let source_node =
        source
            .root(update.child_element())
            .ok_or(HostWorkError::MissingTestRootElement {
                handle: update.child_element(),
            })?;
    match source_node {
        TestHostNode::Element(element) => {
            if update.child_tag() != FiberTag::HostComponent {
                return Err(HostWorkError::ExpectedFiberTag {
                    fiber: update.work_in_progress_child(),
                    expected: update.child_tag(),
                    actual: FiberTag::HostComponent,
                });
            }
            complete_host_component_update(
                store,
                render.root(),
                update.current_child(),
                update.work_in_progress_child(),
                element,
                update.previous_child_props(),
                &mut detached_hosts,
            )?;
        }
        TestHostNode::Text(text) => {
            if update.child_tag() != FiberTag::HostText {
                return Err(HostWorkError::ExpectedFiberTag {
                    fiber: update.work_in_progress_child(),
                    expected: update.child_tag(),
                    actual: FiberTag::HostText,
                });
            }
            complete_host_text_update(
                store,
                render.root(),
                update.current_child(),
                update.work_in_progress_child(),
                text,
                &mut detached_hosts,
            )?;
        }
    }

    complete_function_component_parent(store, update.function_component())?;
    complete_host_root(store, render.work_in_progress())?;

    Ok(HostWorkResult {
        root: render.root(),
        work_in_progress: render.work_in_progress(),
        root_child,
        root_children: root_child.into_iter().collect(),
        completed_child: Some(update.work_in_progress_child()),
        completed_children: vec![update.work_in_progress_child()],
        detached_hosts,
        sync_flush_host_work_epoch: 0,
        consumed_sync_flush_host_mutations: Vec::new(),
        consumed_root_child_replacements: Vec::new(),
        cleanup_ownership_transfers: Vec::new(),
    })
}

#[cfg(test)]
pub(crate) fn apply_single_test_host_update_with_finished_work_handoff_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    pending: Option<HostRootFinishedWorkPendingCommitRecordForCanary>,
    commit_order: usize,
    host_work: &mut HostWorkResult,
) -> Result<
    TestHostRootHostUpdateFinishedWorkExecutionForCanary,
    TestHostRootHostUpdateExecutionErrorForCanary,
> {
    let pending_update = record_host_root_single_host_update_apply_for_canary(store, render)?;
    let mutation = pending_update.mutation();
    let Some(payload) =
        accepted_test_host_update_payload_for_canary(host_work.detached_hosts(), mutation)
    else {
        return Err(
            TestHostRootHostUpdateExecutionErrorForCanary::UnsupportedPayload {
                root: pending_update.root(),
                finished_work: pending_update.finished_work(),
                fiber: pending_update.fiber(),
                kind: pending_update.kind(),
            },
        );
    };

    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        render,
        pending,
        commit_order,
    )?;
    let committed_update = handoff
        .commit()
        .single_host_update_apply_record_for_canary()?;
    if committed_update.mutation() != mutation {
        return Err(
            HostRootSingleHostUpdateApplyRecordErrorForCanary::ExpectedSingleHostUpdateRecord {
                root: handoff.commit().root(),
                finished_work: handoff.commit().finished_work(),
                mutation_record_count: handoff.commit().mutation_apply_log().len(),
                host_update_record_count: 0,
            }
            .into(),
        );
    }

    let apply = apply_test_host_root_commit_mutations(
        store,
        host,
        handoff.commit(),
        host_work.detached_hosts_mut(),
    )?;
    let applied_status = apply
        .records()
        .iter()
        .find(|record| record.mutation() == mutation)
        .map(|record| record.status());
    let Some(status) = applied_status else {
        return Err(
            TestHostRootHostUpdateExecutionErrorForCanary::HostUpdateNotApplied {
                root: handoff.commit().root(),
                finished_work: handoff.commit().finished_work(),
                fiber: mutation.fiber(),
                status: None,
            },
        );
    };
    if !host_update_apply_status_matches_mutation_kind(status, mutation.kind()) {
        return Err(
            TestHostRootHostUpdateExecutionErrorForCanary::HostUpdateNotApplied {
                root: handoff.commit().root(),
                finished_work: handoff.commit().finished_work(),
                fiber: mutation.fiber(),
                status: Some(status),
            },
        );
    }

    let diagnostic = TestHostRootHostUpdateExecutionDiagnosticForCanary {
        root: handoff.commit().root(),
        finished_work: handoff.commit().finished_work(),
        source_handoff_order: handoff.pending().handoff_order(),
        commit_order: handoff.commit_order(),
        mutation,
        payload,
        status,
        applied_host_call_count: apply.applied_host_call_count(),
        private_host_store_update_count: apply.private_host_store_update_count(),
        blockers: TEST_HOST_ROOT_HOST_UPDATE_EXECUTION_BLOCKERS,
    };

    Ok(TestHostRootHostUpdateFinishedWorkExecutionForCanary {
        pending_update,
        finished_work_handoff: handoff,
        committed_update,
        diagnostic,
    })
}

pub(crate) fn sync_flush_host_mutation_execution_request_for_canary(
    record: &SyncFlushRootRecord,
    diagnostics: SyncFlushRootHostOutputCommitDiagnosticsForCanary,
) -> Result<
    SyncFlushHostMutationExecutionRequestForCanary,
    SyncFlushHostMutationExecutionErrorForCanary,
> {
    if !record.accepted_finished_work_handoff_for_canary()
        || !diagnostics.accepted_finished_work_handoff()
        || !diagnostics.commit_handoff_state_consumed()
    {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root: record.root(),
                order: record.order(),
            },
        );
    }

    if diagnostics.root() != record.root() {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root: record.root(),
                actual_root: diagnostics.root(),
            },
        );
    }

    if diagnostics.render_lanes() != record.render_lanes()
        || diagnostics.finished_lanes() != record.commit().finished_lanes()
        || diagnostics.remaining_lanes() != record.commit().remaining_lanes()
        || diagnostics.commit_pending_lanes() != record.commit().pending_lanes()
        || diagnostics.root_pending_lanes_after_commit() != record.commit().pending_lanes()
        || diagnostics.finished_lanes_before_commit() != Some(record.render_lanes())
        || diagnostics.root_finished_lanes_before_commit() != Some(record.render_lanes())
    {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedSyncFlushLanes {
                root: record.root(),
                expected_render_lanes: record.render_lanes(),
                actual_render_lanes: diagnostics.render_lanes(),
                expected_finished_lanes: record.commit().finished_lanes(),
                actual_finished_lanes: diagnostics.finished_lanes(),
            },
        );
    }

    if diagnostics.order() != record.order()
        || diagnostics.committed_current() != record.commit().current()
        || diagnostics.root_current_after_commit() != record.commit().current()
        || diagnostics.root_finished_work_before_commit() != Some(record.commit().finished_work())
        || diagnostics.finished_work_before_commit() != Some(record.commit().finished_work())
    {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root: record.root(),
                order: record.order(),
            },
        );
    }

    if diagnostics.mutation_record_count() != record.commit().mutation_log().len()
        || diagnostics.mutation_apply_record_count() != record.commit().mutation_apply_log().len()
        || diagnostics.mutation_apply_record_count() == 0
    {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::MissingHostMutationMetadata {
                root: record.root(),
                finished_work: record.commit().finished_work(),
            },
        );
    }

    let request = SyncFlushHostMutationExecutionRequestForCanary {
        root: record.root(),
        order: record.order(),
        render_lanes: record.render_lanes(),
        finished_lanes: record.commit().finished_lanes(),
        remaining_lanes: record.commit().remaining_lanes(),
        pending_lanes: record.commit().pending_lanes(),
        finished_work: record.commit().finished_work(),
        committed_current: record.commit().current(),
        mutation_record_count: record.commit().mutation_log().len(),
        mutation_apply_record_count: record.commit().mutation_apply_log().len(),
        host_root_placement_apply_count: record
            .commit()
            .host_root_placement_apply_diagnostics_for_canary()
            .len(),
    };
    debug_assert!(request.matches_sync_flush_record(record));
    Ok(request)
}

pub(crate) fn execute_sync_flush_host_mutations_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    record: &SyncFlushRootRecord,
    diagnostics: SyncFlushRootHostOutputCommitDiagnosticsForCanary,
    request: SyncFlushHostMutationExecutionRequestForCanary,
    host_work: &mut HostWorkResult,
) -> Result<
    SyncFlushHostMutationExecutionDiagnosticForCanary,
    SyncFlushHostMutationExecutionErrorForCanary,
> {
    let source_request =
        sync_flush_host_mutation_execution_request_for_canary(record, diagnostics)?;
    validate_sync_flush_host_mutation_request_matches_record(request, record)?;
    if request != source_request {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root: request.root(),
                order: request.order(),
            },
        );
    }

    if host_work.root() != request.root() {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root: request.root(),
                actual_root: host_work.root(),
            },
        );
    }

    if host_work.work_in_progress() != request.finished_work() {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedFinishedWork {
                root: request.root(),
                expected_finished_work: request.finished_work(),
                actual_finished_work: host_work.work_in_progress(),
            },
        );
    }

    let execution_identity = host_work.sync_flush_host_mutation_execution_identity(request);
    if host_work.has_consumed_sync_flush_host_mutation_execution(execution_identity) {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::ReplayedHostMutationExecution {
                root: request.root(),
                order: request.order(),
                finished_work: request.finished_work(),
            },
        );
    }

    host_work.mark_sync_flush_host_mutation_execution_consumed(execution_identity);

    let apply =
        apply_test_host_root_commit_mutations_for_canary(store, host, record.commit(), host_work)?;
    let deletion_cleanup_apply_count = if record
        .commit()
        .host_node_deletion_cleanup_log()
        .records()
        .is_empty()
    {
        0
    } else {
        apply_test_host_root_deletion_cleanup(
            store,
            host,
            record.commit(),
            host_work.detached_hosts_mut(),
        )?
        .applied_record_count()
    };

    if apply.root() != request.root() {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root: request.root(),
                actual_root: apply.root(),
            },
        );
    }

    if apply.finished_work() != request.finished_work() {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedFinishedWork {
                root: request.root(),
                expected_finished_work: request.finished_work(),
                actual_finished_work: apply.finished_work(),
            },
        );
    }

    Ok(SyncFlushHostMutationExecutionDiagnosticForCanary {
        request,
        applied_host_call_count: apply.applied_host_call_count(),
        private_host_store_update_count: apply.private_host_store_update_count(),
        recorded_only_count: apply.recorded_only_count(),
        deletion_cleanup_apply_count,
    })
}

fn validate_sync_flush_host_mutation_request_matches_record(
    request: SyncFlushHostMutationExecutionRequestForCanary,
    record: &SyncFlushRootRecord,
) -> Result<(), SyncFlushHostMutationExecutionErrorForCanary> {
    if request.root() != record.root() {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root: request.root(),
                actual_root: record.root(),
            },
        );
    }

    if request.render_lanes() != record.render_lanes()
        || request.finished_lanes() != record.commit().finished_lanes()
    {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedSyncFlushLanes {
                root: request.root(),
                expected_render_lanes: request.render_lanes(),
                actual_render_lanes: record.render_lanes(),
                expected_finished_lanes: request.finished_lanes(),
                actual_finished_lanes: record.commit().finished_lanes(),
            },
        );
    }

    if request.finished_work() != record.commit().finished_work()
        || request.committed_current() != record.commit().current()
    {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedFinishedWork {
                root: request.root(),
                expected_finished_work: request.finished_work(),
                actual_finished_work: record.commit().finished_work(),
            },
        );
    }

    if request.order() != record.order()
        || request.remaining_lanes() != record.commit().remaining_lanes()
        || request.pending_lanes() != record.commit().pending_lanes()
        || request.mutation_record_count() != record.commit().mutation_log().len()
        || request.mutation_apply_record_count() != record.commit().mutation_apply_log().len()
        || !request.matches_sync_flush_record(record)
    {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root: request.root(),
                order: request.order(),
            },
        );
    }

    Ok(())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushDeletedSubtreeTeardownExecutionDiagnosticForCanary {
    sync_flush_request: SyncFlushHostMutationExecutionRequestForCanary,
    deletion_teardown: TestHostRootDeletionTeardownExecutionDiagnosticForCanary,
}

impl SyncFlushDeletedSubtreeTeardownExecutionDiagnosticForCanary {
    #[must_use]
    pub(crate) const fn sync_flush_request(
        &self,
    ) -> SyncFlushHostMutationExecutionRequestForCanary {
        self.sync_flush_request
    }

    #[must_use]
    pub(crate) const fn deletion_teardown(
        &self,
    ) -> &TestHostRootDeletionTeardownExecutionDiagnosticForCanary {
        &self.deletion_teardown
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.sync_flush_request.root()
    }

    #[must_use]
    pub(crate) const fn order(&self) -> usize {
        self.sync_flush_request.order()
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.sync_flush_request.finished_work()
    }

    #[must_use]
    pub(crate) fn ref_cleanup_return_callbacks_invoked(&self) -> bool {
        self.deletion_teardown
            .ref_cleanup_return_callbacks_invoked()
    }

    #[must_use]
    pub(crate) fn passive_destroy_callbacks_invoked(&self) -> bool {
        self.deletion_teardown.passive_destroy_callbacks_invoked()
    }

    #[must_use]
    pub(crate) const fn private_host_subtree_detachment_applied(&self) -> bool {
        self.deletion_teardown
            .private_host_subtree_detachment_applied()
    }

    #[must_use]
    pub(crate) const fn private_opt_in_sync_flush_teardown_requested(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_unmount_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_ref_or_effect_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary {
    SyncFlushHostMutation(SyncFlushHostMutationExecutionErrorForCanary),
    DeletedSubtreeTeardown(TestHostRootDeletionTeardownExecutionErrorForCanary),
    MismatchedRootOwnership {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
    },
    MismatchedFinishedWork {
        root: FiberRootId,
        expected_finished_work: FiberId,
        actual_finished_work: FiberId,
    },
    MismatchedCommittedCurrent {
        root: FiberRootId,
        expected_current: FiberId,
        actual_current: FiberId,
    },
    MismatchedSyncFlushDeletionLanes {
        root: FiberRootId,
        sync_flush_render_lanes: Lanes,
        deletion_finished_lanes: Lanes,
        sync_flush_remaining_lanes: Lanes,
        deletion_remaining_lanes: Lanes,
        sync_flush_pending_lanes: Lanes,
        deletion_pending_lanes: Lanes,
    },
}

impl Display for SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::SyncFlushHostMutation(error) => Display::fmt(error, formatter),
            Self::DeletedSubtreeTeardown(error) => Display::fmt(error, formatter),
            Self::MismatchedRootOwnership {
                expected_root,
                actual_root,
            } => write!(
                formatter,
                "sync-flush deleted-subtree teardown root ownership mismatch: expected root {}, found root {}",
                expected_root.raw(),
                actual_root.raw()
            ),
            Self::MismatchedFinishedWork {
                root,
                expected_finished_work,
                actual_finished_work,
            } => write!(
                formatter,
                "sync-flush deleted-subtree teardown finished-work mismatch for root {}: expected fiber slot {}, found fiber slot {}",
                root.raw(),
                expected_finished_work.slot().get(),
                actual_finished_work.slot().get()
            ),
            Self::MismatchedCommittedCurrent {
                root,
                expected_current,
                actual_current,
            } => write!(
                formatter,
                "sync-flush deleted-subtree teardown committed current mismatch for root {}: expected fiber slot {}, found fiber slot {}",
                root.raw(),
                expected_current.slot().get(),
                actual_current.slot().get()
            ),
            Self::MismatchedSyncFlushDeletionLanes {
                root,
                sync_flush_render_lanes,
                deletion_finished_lanes,
                sync_flush_remaining_lanes,
                deletion_remaining_lanes,
                sync_flush_pending_lanes,
                deletion_pending_lanes,
            } => write!(
                formatter,
                "sync-flush deleted-subtree teardown lanes mismatch for root {}: render {:?}/finished {:?}, remaining {:?}/{:?}, pending {:?}/{:?}",
                root.raw(),
                sync_flush_render_lanes,
                deletion_finished_lanes,
                sync_flush_remaining_lanes,
                deletion_remaining_lanes,
                sync_flush_pending_lanes,
                deletion_pending_lanes
            ),
        }
    }
}

impl Error for SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::SyncFlushHostMutation(error) => Some(error),
            Self::DeletedSubtreeTeardown(error) => Some(error),
            Self::MismatchedRootOwnership { .. }
            | Self::MismatchedFinishedWork { .. }
            | Self::MismatchedCommittedCurrent { .. }
            | Self::MismatchedSyncFlushDeletionLanes { .. } => None,
        }
    }
}

impl From<SyncFlushHostMutationExecutionErrorForCanary>
    for SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary
{
    fn from(error: SyncFlushHostMutationExecutionErrorForCanary) -> Self {
        Self::SyncFlushHostMutation(error)
    }
}

impl From<TestHostRootDeletionTeardownExecutionErrorForCanary>
    for SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary
{
    fn from(error: TestHostRootDeletionTeardownExecutionErrorForCanary) -> Self {
        Self::DeletedSubtreeTeardown(error)
    }
}

impl From<HostWorkError> for SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary {
    fn from(error: HostWorkError) -> Self {
        Self::SyncFlushHostMutation(SyncFlushHostMutationExecutionErrorForCanary::HostWork(
            error,
        ))
    }
}

#[cfg(test)]
#[allow(
    clippy::too_many_arguments,
    reason = "private canary composes accepted sync-flush and deleted-subtree source evidence"
)]
pub(crate) fn execute_sync_flush_deleted_subtree_teardown_for_canary<E>(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    sync_flush_record: &SyncFlushRootRecord,
    sync_flush_diagnostics: SyncFlushRootHostOutputCommitDiagnosticsForCanary,
    sync_flush_request: SyncFlushHostMutationExecutionRequestForCanary,
    deletion_handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    source_deletion_request: TestHostRootDeletionTeardownExecutionRequestForCanary,
    deletion_request: TestHostRootDeletionTeardownExecutionRequestForCanary,
    host_work: &mut HostWorkResult,
    executor: &mut E,
) -> Result<
    SyncFlushDeletedSubtreeTeardownExecutionDiagnosticForCanary,
    SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary,
>
where
    E: DeletedSubtreeRefCleanupReturnExecutor + PassiveEffectDestroyCallbackExecutor,
{
    let source_sync_request = sync_flush_host_mutation_execution_request_for_canary(
        sync_flush_record,
        sync_flush_diagnostics,
    )?;
    validate_sync_flush_host_mutation_request_matches_record(
        sync_flush_request,
        sync_flush_record,
    )?;
    if sync_flush_request != source_sync_request {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root: sync_flush_request.root(),
                order: sync_flush_request.order(),
            }
            .into(),
        );
    }

    let rebuilt_deletion_request = test_host_root_deletion_teardown_execution_request_for_canary(
        deletion_handoff,
        source_deletion_request.request_order(),
    )?;
    if rebuilt_deletion_request != source_deletion_request
        || source_deletion_request != deletion_request
        || !source_deletion_request.matches_source_handoff(deletion_handoff)
        || !source_deletion_request.has_required_source_evidence()
    {
        return Err(
            TestHostRootDeletionTeardownExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root: deletion_request.root(),
                commit_order: deletion_request.commit_order(),
                request_order: deletion_request.request_order(),
            }
            .into(),
        );
    }

    validate_sync_flush_deleted_subtree_teardown_identity(
        sync_flush_request,
        source_deletion_request,
    )?;

    let root = store
        .root(sync_flush_request.root())
        .map_err(HostWorkError::from)?;
    if root.current() != sync_flush_request.committed_current() {
        return Err(HostWorkError::CommitCurrentMismatch {
            root: sync_flush_request.root(),
            expected: sync_flush_request.committed_current(),
            actual: root.current(),
        }
        .into());
    }

    if host_work.root() != sync_flush_request.root() {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root: sync_flush_request.root(),
                actual_root: host_work.root(),
            }
            .into(),
        );
    }

    if host_work.work_in_progress() != sync_flush_request.finished_work() {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::MismatchedFinishedWork {
                root: sync_flush_request.root(),
                expected_finished_work: sync_flush_request.finished_work(),
                actual_finished_work: host_work.work_in_progress(),
            }
            .into(),
        );
    }

    let execution_identity =
        host_work.sync_flush_host_mutation_execution_identity(sync_flush_request);
    if host_work.has_consumed_sync_flush_host_mutation_execution(execution_identity) {
        return Err(
            SyncFlushHostMutationExecutionErrorForCanary::ReplayedHostMutationExecution {
                root: sync_flush_request.root(),
                order: sync_flush_request.order(),
                finished_work: sync_flush_request.finished_work(),
            }
            .into(),
        );
    }

    host_work.mark_sync_flush_host_mutation_execution_consumed(execution_identity);

    let deletion_teardown = execute_test_host_root_deletion_teardown_after_commit_for_canary(
        store,
        host,
        deletion_handoff,
        source_deletion_request,
        deletion_request,
        host_work.detached_hosts_mut(),
        executor,
    )?;

    Ok(
        SyncFlushDeletedSubtreeTeardownExecutionDiagnosticForCanary {
            sync_flush_request,
            deletion_teardown,
        },
    )
}

fn validate_sync_flush_deleted_subtree_teardown_identity(
    sync_flush_request: SyncFlushHostMutationExecutionRequestForCanary,
    deletion_request: TestHostRootDeletionTeardownExecutionRequestForCanary,
) -> Result<(), SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary> {
    if sync_flush_request.root() != deletion_request.root() {
        return Err(
            SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root: sync_flush_request.root(),
                actual_root: deletion_request.root(),
            },
        );
    }

    if sync_flush_request.finished_work() != deletion_request.finished_work() {
        return Err(
            SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::MismatchedFinishedWork {
                root: sync_flush_request.root(),
                expected_finished_work: sync_flush_request.finished_work(),
                actual_finished_work: deletion_request.finished_work(),
            },
        );
    }

    if sync_flush_request.committed_current() != deletion_request.committed_current() {
        return Err(
            SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::MismatchedCommittedCurrent {
                root: sync_flush_request.root(),
                expected_current: sync_flush_request.committed_current(),
                actual_current: deletion_request.committed_current(),
            },
        );
    }

    if sync_flush_request.finished_lanes() != deletion_request.finished_lanes()
        || sync_flush_request.remaining_lanes() != deletion_request.remaining_lanes()
        || sync_flush_request.pending_lanes() != deletion_request.pending_lanes()
    {
        return Err(
            SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary::MismatchedSyncFlushDeletionLanes {
                root: sync_flush_request.root(),
                sync_flush_render_lanes: sync_flush_request.render_lanes(),
                deletion_finished_lanes: deletion_request.finished_lanes(),
                sync_flush_remaining_lanes: sync_flush_request.remaining_lanes(),
                deletion_remaining_lanes: deletion_request.remaining_lanes(),
                sync_flush_pending_lanes: sync_flush_request.pending_lanes(),
                deletion_pending_lanes: deletion_request.pending_lanes(),
            },
        );
    }

    Ok(())
}

pub(crate) fn apply_one_test_host_update_with_finished_work_handoff_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    pending: Option<HostRootFinishedWorkPendingCommitRecordForCanary>,
    commit_order: usize,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<
    TestHostRootHostUpdateExecutionDiagnosticForCanary,
    TestHostRootHostUpdateExecutionErrorForCanary,
> {
    let pending_update = record_host_root_single_host_update_apply_for_canary(store, render)?;
    let mutation = pending_update.mutation();
    let Some(payload) = accepted_test_host_update_payload_for_canary(detached_hosts, mutation)
    else {
        return Err(
            TestHostRootHostUpdateExecutionErrorForCanary::UnsupportedPayload {
                root: pending_update.root(),
                finished_work: pending_update.finished_work(),
                fiber: pending_update.fiber(),
                kind: pending_update.kind(),
            },
        );
    };

    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        render,
        pending,
        commit_order,
    )?;
    let committed_update = handoff
        .commit()
        .single_host_update_apply_record_for_canary()?;
    if committed_update.mutation() != mutation {
        return Err(
            HostRootSingleHostUpdateApplyRecordErrorForCanary::ExpectedSingleHostUpdateRecord {
                root: handoff.commit().root(),
                finished_work: handoff.commit().finished_work(),
                mutation_record_count: handoff.commit().mutation_apply_log().len(),
                host_update_record_count: 0,
            }
            .into(),
        );
    }

    let apply =
        apply_test_host_root_commit_mutations(store, host, handoff.commit(), detached_hosts)?;
    let applied_status = apply
        .records()
        .iter()
        .find(|record| record.mutation() == mutation)
        .map(|record| record.status());
    let Some(status) = applied_status else {
        return Err(
            TestHostRootHostUpdateExecutionErrorForCanary::HostUpdateNotApplied {
                root: handoff.commit().root(),
                finished_work: handoff.commit().finished_work(),
                fiber: mutation.fiber(),
                status: None,
            },
        );
    };
    if !host_update_apply_status_matches_mutation_kind(status, mutation.kind()) {
        return Err(
            TestHostRootHostUpdateExecutionErrorForCanary::HostUpdateNotApplied {
                root: handoff.commit().root(),
                finished_work: handoff.commit().finished_work(),
                fiber: mutation.fiber(),
                status: Some(status),
            },
        );
    }

    Ok(TestHostRootHostUpdateExecutionDiagnosticForCanary {
        root: handoff.commit().root(),
        finished_work: handoff.commit().finished_work(),
        source_handoff_order: handoff.pending().handoff_order(),
        commit_order: handoff.commit_order(),
        mutation,
        payload,
        status,
        applied_host_call_count: apply.applied_host_call_count(),
        private_host_store_update_count: apply.private_host_store_update_count(),
        blockers: TEST_HOST_ROOT_HOST_UPDATE_EXECUTION_BLOCKERS,
    })
}

fn apply_dangerous_html_text_reset_handoff_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    handoff: &HostRootDangerousHtmlTextResetCommitHandoffRecordForCanary,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<
    TestHostRootHostUpdateExecutionDiagnosticForCanary,
    TestHostRootHostUpdateExecutionErrorForCanary,
> {
    let mutation = handoff.mutation();
    let Some(payload) =
        accept_dangerous_html_text_reset_payload_from_complete_work_handoff_for_canary(
            detached_hosts,
            handoff.complete_work(),
            mutation,
        )
    else {
        return Err(
            TestHostRootHostUpdateExecutionErrorForCanary::UnsupportedPayload {
                root: handoff.root(),
                finished_work: handoff.finished_work(),
                fiber: mutation.fiber(),
                kind: mutation.kind(),
            },
        );
    };

    let apply = apply_test_host_root_commit_mutations(
        store,
        host,
        handoff.finished_work_handoff().commit(),
        detached_hosts,
    )?;
    let applied_status = apply
        .records()
        .iter()
        .find(|record| record.mutation() == mutation)
        .map(|record| record.status());
    let Some(status) = applied_status else {
        return Err(
            TestHostRootHostUpdateExecutionErrorForCanary::HostUpdateNotApplied {
                root: handoff.root(),
                finished_work: handoff.finished_work(),
                fiber: mutation.fiber(),
                status: None,
            },
        );
    };
    if !host_update_apply_status_matches_mutation_kind(status, mutation.kind()) {
        return Err(
            TestHostRootHostUpdateExecutionErrorForCanary::HostUpdateNotApplied {
                root: handoff.root(),
                finished_work: handoff.finished_work(),
                fiber: mutation.fiber(),
                status: Some(status),
            },
        );
    }

    Ok(TestHostRootHostUpdateExecutionDiagnosticForCanary {
        root: handoff.root(),
        finished_work: handoff.finished_work(),
        source_handoff_order: handoff.source_handoff_order(),
        commit_order: handoff.commit_order(),
        mutation,
        payload: TestHostRootHostUpdatePayloadForCanary::component(payload),
        status,
        applied_host_call_count: apply.applied_host_call_count(),
        private_host_store_update_count: apply.private_host_store_update_count(),
        blockers: TEST_HOST_ROOT_HOST_UPDATE_EXECUTION_BLOCKERS,
    })
}

pub(crate) fn apply_managed_child_complete_work_handoff_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    handoff: &HostRootManagedChildCommitHandoffRecordForCanary,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<
    TestHostRootManagedChildExecutionDiagnosticForCanary,
    TestHostRootManagedChildExecutionErrorForCanary,
> {
    let mutation = handoff.mutation();
    let apply = apply_test_host_root_commit_mutations(
        store,
        host,
        handoff.finished_work_handoff().commit(),
        detached_hosts,
    )?;
    if apply.records().len() != 1 {
        return Err(
            TestHostRootManagedChildExecutionErrorForCanary::UnexpectedMutationApplyCount {
                root: handoff.root(),
                finished_work: handoff.finished_work(),
                expected: 1,
                actual: apply.records().len(),
            },
        );
    }

    let applied_status = apply
        .records()
        .iter()
        .find(|record| record.mutation() == mutation)
        .map(|record| record.status());
    let Some(mutation_status) = applied_status else {
        return Err(
            TestHostRootManagedChildExecutionErrorForCanary::MutationNotApplied {
                root: handoff.root(),
                finished_work: handoff.finished_work(),
                fiber: mutation.fiber(),
                status: None,
            },
        );
    };
    if !managed_child_apply_status_matches_kind(mutation_status, handoff.kind()) {
        return Err(
            TestHostRootManagedChildExecutionErrorForCanary::MutationNotApplied {
                root: handoff.root(),
                finished_work: handoff.finished_work(),
                fiber: mutation.fiber(),
                status: Some(mutation_status),
            },
        );
    }

    let (cleanup_status, deletion_cleanup_apply_count) = match handoff.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement => (None, 0),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            let cleanup_apply = apply_test_host_root_deletion_cleanup(
                store,
                host,
                handoff.finished_work_handoff().commit(),
                detached_hosts,
            )?;
            let cleanup_status = cleanup_apply
                .records()
                .iter()
                .find(|record| record.cleanup().fiber() == mutation.fiber())
                .map(|record| record.status());
            let Some(cleanup_status) = cleanup_status else {
                return Err(
                    TestHostRootManagedChildExecutionErrorForCanary::CleanupNotApplied {
                        root: handoff.root(),
                        finished_work: handoff.finished_work(),
                        fiber: mutation.fiber(),
                        status: None,
                    },
                );
            };
            if !managed_child_deletion_cleanup_status_matches_tag(
                Some(cleanup_status),
                mutation.tag(),
            ) {
                return Err(
                    TestHostRootManagedChildExecutionErrorForCanary::CleanupNotApplied {
                        root: handoff.root(),
                        finished_work: handoff.finished_work(),
                        fiber: mutation.fiber(),
                        status: Some(cleanup_status),
                    },
                );
            }
            (Some(cleanup_status), cleanup_apply.applied_record_count())
        }
    };

    Ok(TestHostRootManagedChildExecutionDiagnosticForCanary {
        root: handoff.root(),
        finished_work: handoff.finished_work(),
        source_handoff_order: handoff.source_handoff_order(),
        commit_order: handoff.commit_order(),
        request_order: handoff.request_order(),
        kind: handoff.kind(),
        mutation,
        mutation_status,
        cleanup_status,
        applied_host_call_count: apply.applied_host_call_count(),
        deletion_cleanup_apply_count,
        blockers: TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS,
    })
}

pub(crate) fn apply_managed_child_sibling_order_complete_work_handoff_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    handoff: &HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<
    TestHostRootManagedChildSiblingOrderExecutionDiagnosticForCanary,
    TestHostRootManagedChildExecutionErrorForCanary,
> {
    let mutation = handoff.mutation();
    validate_managed_child_sibling_order_host_child_for_execution(
        store,
        &*detached_hosts,
        handoff,
    )?;
    let apply = apply_test_host_root_commit_mutations(
        store,
        host,
        handoff.finished_work_handoff().commit(),
        detached_hosts,
    )?;
    if apply.records().len() != 1 {
        return Err(
            TestHostRootManagedChildExecutionErrorForCanary::UnexpectedMutationApplyCount {
                root: handoff.root(),
                finished_work: handoff.finished_work(),
                expected: 1,
                actual: apply.records().len(),
            },
        );
    }

    let applied_status = apply
        .records()
        .iter()
        .find(|record| record.mutation() == mutation)
        .map(|record| record.status());
    let Some(mutation_status) = applied_status else {
        return Err(
            TestHostRootManagedChildExecutionErrorForCanary::MutationNotApplied {
                root: handoff.root(),
                finished_work: handoff.finished_work(),
                fiber: mutation.fiber(),
                status: None,
            },
        );
    };
    if !managed_child_sibling_order_apply_status_matches_kind(mutation_status, handoff.kind()) {
        return Err(
            TestHostRootManagedChildExecutionErrorForCanary::MutationNotApplied {
                root: handoff.root(),
                finished_work: handoff.finished_work(),
                fiber: mutation.fiber(),
                status: Some(mutation_status),
            },
        );
    }

    let (cleanup_status, deletion_cleanup_apply_count) = match handoff.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement => (None, 0),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            let cleanup_apply = apply_test_host_root_deletion_cleanup(
                store,
                host,
                handoff.finished_work_handoff().commit(),
                detached_hosts,
            )?;
            let cleanup_status = cleanup_apply
                .records()
                .iter()
                .find(|record| record.cleanup().fiber() == mutation.fiber())
                .map(|record| record.status());
            let Some(cleanup_status) = cleanup_status else {
                return Err(
                    TestHostRootManagedChildExecutionErrorForCanary::CleanupNotApplied {
                        root: handoff.root(),
                        finished_work: handoff.finished_work(),
                        fiber: mutation.fiber(),
                        status: None,
                    },
                );
            };
            if !managed_child_deletion_cleanup_status_matches_tag(
                Some(cleanup_status),
                mutation.tag(),
            ) {
                return Err(
                    TestHostRootManagedChildExecutionErrorForCanary::CleanupNotApplied {
                        root: handoff.root(),
                        finished_work: handoff.finished_work(),
                        fiber: mutation.fiber(),
                        status: Some(cleanup_status),
                    },
                );
            }
            (Some(cleanup_status), cleanup_apply.applied_record_count())
        }
    };

    Ok(
        TestHostRootManagedChildSiblingOrderExecutionDiagnosticForCanary {
            root: handoff.root(),
            finished_work: handoff.finished_work(),
            source_handoff_order: handoff.source_handoff_order(),
            commit_order: handoff.commit_order(),
            request_order: handoff.request_order(),
            kind: handoff.kind(),
            order_evidence_name: handoff.order_evidence_name(),
            order_sibling: handoff.order_sibling(),
            order_sibling_state_node: handoff.order_sibling_state_node(),
            mutation,
            mutation_status,
            cleanup_status,
            applied_host_call_count: apply.applied_host_call_count(),
            deletion_cleanup_apply_count,
            blockers: TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS,
        },
    )
}

fn validate_managed_child_sibling_order_host_child_for_execution(
    store: &FiberRootStore<RecordingHost>,
    detached_hosts: &DetachedHostRecords,
    handoff: &HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary,
) -> Result<(), HostWorkError> {
    let complete_work = handoff.complete_work();
    owned_detached_host_child_for_fiber(
        store,
        detached_hosts,
        handoff.root(),
        handoff.order_sibling(),
        complete_work.order_sibling_tag(),
        handoff.order_sibling_state_node(),
    )?;
    Ok(())
}

const fn managed_child_apply_status_matches_kind(
    status: TestHostRootMutationApplyStatus,
    kind: HostComponentManagedChildMutationKindForCanary,
) -> bool {
    matches!(
        (status, kind),
        (
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild),
            HostComponentManagedChildMutationKindForCanary::Placement,
        ) | (
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild),
            HostComponentManagedChildMutationKindForCanary::DeleteDetach,
        )
    )
}

const fn managed_child_sibling_order_apply_status_matches_kind(
    status: TestHostRootMutationApplyStatus,
    kind: HostComponentManagedChildMutationKindForCanary,
) -> bool {
    matches!(
        (status, kind),
        (
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::InsertBefore),
            HostComponentManagedChildMutationKindForCanary::Placement,
        ) | (
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild),
            HostComponentManagedChildMutationKindForCanary::DeleteDetach,
        )
    )
}

fn accept_dangerous_html_text_reset_payload_from_complete_work_handoff_for_canary(
    detached_hosts: &mut DetachedHostRecords,
    complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Option<HostComponentUpdatePayload> {
    let property_row =
        TestHostComponentPropertyPayloadRow::from_dangerous_html_text_reset_complete_work(
            complete_work,
        );

    detached_hosts
        .component_updates
        .iter_mut()
        .find(|payload| {
            payload.root() == complete_work.root()
                && payload.current() == complete_work.current()
                && payload.work_in_progress() == complete_work.work_in_progress()
                && payload.state_node() == complete_work.state_node()
                && payload.old_props() == complete_work.old_props()
                && payload.new_props() == complete_work.new_props()
                && payload.work_in_progress() == mutation.fiber()
                && payload.state_node() == mutation.state_node()
                && Some(payload.current()) == mutation.alternate_fiber()
        })
        .map(|payload| {
            payload.property_row = property_row;
            payload.clone()
        })
}

fn accepted_test_host_update_payload_for_canary(
    detached_hosts: &DetachedHostRecords,
    mutation: HostRootMutationApplyRecord,
) -> Option<TestHostRootHostUpdatePayloadForCanary> {
    match mutation.kind() {
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate => detached_hosts
            .component_update_payload(mutation)
            .map(TestHostRootHostUpdatePayloadForCanary::component),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate => detached_hosts
            .text_update_payload(mutation)
            .map(TestHostRootHostUpdatePayloadForCanary::text),
        _ => None,
    }
}

const fn host_update_apply_status_matches_mutation_kind(
    status: TestHostRootMutationApplyStatus,
    kind: HostRootMutationApplyRecordKind,
) -> bool {
    matches!(
        (status, kind),
        (
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::CommitUpdate
                    | TestHostRootMutationHostCall::ResetTextContent,
            ),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
        ) | (
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::CommitTextUpdate,
            ),
            HostRootMutationApplyRecordKind::CommitHostTextUpdate,
        ) | (
            TestHostRootMutationApplyStatus::PrivateHostStoreOnly(
                TestHostRootPrivateStoreMutation::HostComponentPropertyAndLatestProps,
            ),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
        )
    )
}

fn preflight_test_host_root_component_property_updates(
    store: &FiberRootStore<RecordingHost>,
    commit: &HostRootCommitRecord,
    detached_hosts: &DetachedHostRecords,
) -> Result<(), HostWorkError> {
    for &mutation in commit.mutation_apply_log().records() {
        if mutation.kind() != HostRootMutationApplyRecordKind::CommitHostComponentUpdate {
            continue;
        }
        if let Some(payload) = detached_hosts.component_update_payload(mutation) {
            validate_test_host_component_property_update_payload(
                store,
                mutation,
                &payload,
                detached_hosts,
            )?;
        }
    }
    Ok(())
}

fn preflight_test_host_root_update_consumption(
    commit: &HostRootCommitRecord,
    detached_hosts: &DetachedHostRecords,
) -> Result<(), HostWorkError> {
    for &mutation in commit.mutation_apply_log().records() {
        if matches!(
            mutation.kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
                | HostRootMutationApplyRecordKind::CommitHostTextUpdate
        ) {
            detached_hosts.ensure_host_update_not_consumed(mutation)?;
        }
    }
    Ok(())
}

fn apply_test_host_root_mutation_record(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    container: &mut crate::test_support::FakeContainer,
    mutation: HostRootMutationApplyRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationApplyStatus, HostWorkError> {
    match mutation.kind() {
        HostRootMutationApplyRecordKind::AppendPlacementToContainer => {
            let child = detached_host_child_for_apply_record(store, &*detached_hosts, mutation)?;
            host.append_child_to_container(container, child)?;
            Ok(TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer,
            ))
        }
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent => {
            apply_test_host_parent_placement_record(store, host, mutation, detached_hosts)
        }
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore => {
            apply_test_host_parent_placement_insertion_record(store, host, mutation, detached_hosts)
        }
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore => {
            apply_test_root_placement_insertion_record(
                store,
                host,
                container,
                mutation,
                detached_hosts,
            )
        }
        HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked => {
            Ok(TestHostRootMutationApplyStatus::RecordedOnly)
        }
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer => {
            let child =
                owned_detached_host_child_for_apply_record(store, detached_hosts, mutation)?;
            host.remove_child_from_container(container, child.as_host_child())?;
            Ok(TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::RemoveChildFromContainer,
            ))
        }
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate => {
            apply_test_host_component_update_record(store, host, mutation, detached_hosts)
        }
        HostRootMutationApplyRecordKind::CommitHostTextUpdate => {
            apply_test_host_text_update_record(store, host, mutation, detached_hosts)
        }
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent => {
            apply_test_host_parent_deletion_record(store, host, mutation, detached_hosts)
        }
        HostRootMutationApplyRecordKind::SkipUnsupportedNestedPlacement
        | HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber => {
            Ok(TestHostRootMutationApplyStatus::RecordedOnly)
        }
    }
}

fn apply_test_root_placement_insertion_record(
    store: &FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    container: &mut crate::test_support::FakeContainer,
    mutation: HostRootMutationApplyRecord,
    detached_hosts: &DetachedHostRecords,
) -> Result<TestHostRootMutationApplyStatus, HostWorkError> {
    let Some(sibling) = mutation.placement_sibling() else {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    };
    if !sibling.can_insert_before() {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    }

    let child = owned_detached_host_child_for_apply_record(store, detached_hosts, mutation)?;
    let before_child = owned_detached_host_child_for_fiber(
        store,
        detached_hosts,
        mutation.root(),
        sibling
            .sibling()
            .expect("insert-before sibling record carries a sibling fiber"),
        sibling
            .sibling_tag()
            .expect("insert-before sibling record carries a sibling tag"),
        sibling.sibling_state_node(),
    )?;
    host.insert_in_container_before(
        container,
        child.as_host_child(),
        before_child.as_host_child(),
    )?;

    Ok(TestHostRootMutationApplyStatus::Applied(
        TestHostRootMutationHostCall::InsertInContainerBefore,
    ))
}

#[cfg(test)]
fn invalid_host_text_commit_execution_request(
    request: HostRootTextUpdateCommitExecutionRequestForCanary,
    violation: HostTextCommitExecutionRequestViolation,
) -> HostWorkError {
    HostWorkError::InvalidHostTextCommitExecutionRequest {
        root: request.root(),
        finished_work: request.finished_work(),
        fiber: request.mutation().fiber(),
        violation,
    }
}

#[cfg(test)]
fn validate_host_text_update_commit_execution_request_for_host_call(
    request: HostRootTextUpdateCommitExecutionRequestForCanary,
) -> Result<(), HostWorkError> {
    let mutation = request.mutation();

    if request.root_token() != request.root().state_node_handle() {
        return Err(invalid_host_text_commit_execution_request(
            request,
            HostTextCommitExecutionRequestViolation::WrongRootToken,
        ));
    }
    if request.finished_work() != mutation.host_root() {
        return Err(invalid_host_text_commit_execution_request(
            request,
            HostTextCommitExecutionRequestViolation::WrongFinishedWork,
        ));
    }
    if request.committed_current() != request.finished_work() {
        return Err(invalid_host_text_commit_execution_request(
            request,
            HostTextCommitExecutionRequestViolation::WrongCommittedCurrent,
        ));
    }
    if request.commit_order() <= request.source_handoff_order()
        || request.request_order() <= request.commit_order()
    {
        return Err(invalid_host_text_commit_execution_request(
            request,
            HostTextCommitExecutionRequestViolation::WrongCommitOrder,
        ));
    }
    if !request.private_blockers_intact_for_canary()
        || !request.private_test_host_text_mutation_allowed()
        || !request.public_root_rendering_blocked()
        || !request.public_renderer_mutation_blocked()
        || request.public_renderer_compatibility_claimed()
    {
        return Err(invalid_host_text_commit_execution_request(
            request,
            HostTextCommitExecutionRequestViolation::WrongBlockers,
        ));
    }
    if mutation.root() != request.root() {
        return Err(invalid_host_text_commit_execution_request(
            request,
            HostTextCommitExecutionRequestViolation::WrongMutationRoot,
        ));
    }
    if mutation.kind() != HostRootMutationApplyRecordKind::CommitHostTextUpdate {
        return Err(invalid_host_text_commit_execution_request(
            request,
            HostTextCommitExecutionRequestViolation::WrongMutationKind,
        ));
    }
    if mutation.tag() != FiberTag::HostText {
        return Err(invalid_host_text_commit_execution_request(
            request,
            HostTextCommitExecutionRequestViolation::WrongMutationTag,
        ));
    }
    if mutation.alternate_fiber().is_none() {
        return Err(invalid_host_text_commit_execution_request(
            request,
            HostTextCommitExecutionRequestViolation::MissingCurrent,
        ));
    }
    if mutation.state_node().is_none() {
        return Err(invalid_host_text_commit_execution_request(
            request,
            HostTextCommitExecutionRequestViolation::MissingStateNode,
        ));
    }
    if !mutation.effect_flag().contains_all(FiberFlags::UPDATE) {
        return Err(invalid_host_text_commit_execution_request(
            request,
            HostTextCommitExecutionRequestViolation::MissingUpdateFlag,
        ));
    }

    Ok(())
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct TestHostTextUpdateCommitExecutionRecord {
    root: FiberRootId,
    finished_work: FiberId,
    mutation: HostRootMutationApplyRecord,
    current: FiberId,
    work_in_progress: FiberId,
    state_node: StateNodeHandle,
    old_text: String,
    new_text: String,
    update_count: usize,
    payload_accepted: bool,
    commit_handoff_validated: bool,
    public_renderer_compatibility_claimed: bool,
}

#[cfg(test)]
impl TestHostTextUpdateCommitExecutionRecord {
    #[must_use]
    const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    const fn mutation(&self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    const fn work_in_progress(&self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    fn old_text(&self) -> &str {
        &self.old_text
    }

    #[must_use]
    fn new_text(&self) -> &str {
        &self.new_text
    }

    #[must_use]
    const fn update_count(&self) -> usize {
        self.update_count
    }

    #[must_use]
    const fn payload_accepted(&self) -> bool {
        self.payload_accepted
    }

    #[must_use]
    const fn commit_handoff_validated(&self) -> bool {
        self.commit_handoff_validated
    }

    #[must_use]
    const fn public_renderer_compatibility_claimed(&self) -> bool {
        self.public_renderer_compatibility_claimed
    }
}

#[cfg(test)]
fn execute_test_host_text_update_commit(
    store: &FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    request: HostRootTextUpdateCommitExecutionRequestForCanary,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostTextUpdateCommitExecutionRecord, HostWorkError> {
    validate_host_text_update_commit_execution_request_for_host_call(request)?;
    let root = store.root(request.root())?;
    if root.current() != request.committed_current() {
        return Err(HostWorkError::CommitCurrentMismatch {
            root: request.root(),
            expected: request.committed_current(),
            actual: root.current(),
        });
    }

    let mutation = request.mutation();
    detached_hosts.ensure_host_update_not_consumed(mutation)?;
    let Some(payload) = detached_hosts.text_update_payload(mutation) else {
        return Err(HostWorkError::MissingHostTextUpdatePayload {
            root: request.root(),
            fiber: mutation.fiber(),
            state_node: mutation.state_node(),
        });
    };
    if payload.old_text() == payload.new_text() {
        return Err(HostWorkError::UnchangedHostTextUpdatePayload {
            root: request.root(),
            current: payload.current(),
            work_in_progress: payload.work_in_progress(),
            state_node: payload.state_node(),
        });
    }

    let scope = detached_hosts.validated_text_update_execution_scope(
        store.host_tokens(),
        mutation.state_node(),
        request.root(),
        payload.current(),
    )?;
    let old_text = payload.old_text().to_owned();
    let new_text = payload.new_text().to_owned();
    let update = detached_hosts.preflight_test_host_text_record_update(
        mutation.state_node(),
        scope,
        &old_text,
        &new_text,
        payload.source_currentness(),
    )?;
    {
        let text = detached_hosts
            .nodes
            .text_mut(mutation.state_node(), scope)?;
        host.commit_text_update(text, &old_text, &new_text)?;
    }
    let update_count = detached_hosts.commit_preflighted_test_host_text_record(
        mutation.state_node(),
        scope,
        update,
    )?;
    detached_hosts.mark_host_update_consumed(mutation);

    Ok(TestHostTextUpdateCommitExecutionRecord {
        root: request.root(),
        finished_work: request.finished_work(),
        mutation,
        current: payload.current(),
        work_in_progress: payload.work_in_progress(),
        state_node: payload.state_node(),
        old_text,
        new_text,
        update_count,
        payload_accepted: true,
        commit_handoff_validated: request.private_test_host_text_mutation_allowed(),
        public_renderer_compatibility_claimed: request.public_renderer_compatibility_claimed(),
    })
}

fn apply_test_host_parent_placement_record(
    store: &FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    mutation: HostRootMutationApplyRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationApplyStatus, HostWorkError> {
    if mutation.parent_tag() != FiberTag::HostComponent
        || mutation.parent_state_node().is_none()
        || mutation.state_node().is_none()
    {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    }

    let child = owned_detached_host_child_for_apply_record(store, detached_hosts, mutation)?;
    let parent_scope = detached_hosts.validated_scope_for_apply_fiber(
        store,
        mutation.parent_state_node(),
        mutation.root(),
        mutation.parent(),
        HostFiberTokenTarget::Instance,
    )?;
    let parent = detached_hosts
        .nodes
        .instance_mut(mutation.parent_state_node(), parent_scope)?;
    host.append_child(parent, child.as_host_child())?;

    Ok(TestHostRootMutationApplyStatus::Applied(
        TestHostRootMutationHostCall::AppendChild,
    ))
}

fn apply_test_host_parent_placement_insertion_record(
    store: &FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    mutation: HostRootMutationApplyRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationApplyStatus, HostWorkError> {
    if mutation.parent_tag() != FiberTag::HostComponent
        || mutation.parent_state_node().is_none()
        || mutation.state_node().is_none()
    {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    }

    let Some(sibling) = mutation.placement_sibling() else {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    };
    if !sibling.can_insert_before() {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    }

    let child = owned_detached_host_child_for_apply_record(store, detached_hosts, mutation)?;
    let before_child = owned_detached_host_child_for_fiber(
        store,
        detached_hosts,
        mutation.root(),
        sibling
            .sibling()
            .expect("insert-before sibling record carries a sibling fiber"),
        sibling
            .sibling_tag()
            .expect("insert-before sibling record carries a sibling tag"),
        sibling.sibling_state_node(),
    )?;
    let parent_scope = detached_hosts.validated_scope_for_apply_fiber(
        store,
        mutation.parent_state_node(),
        mutation.root(),
        mutation.parent(),
        HostFiberTokenTarget::Instance,
    )?;
    let parent = detached_hosts
        .nodes
        .instance_mut(mutation.parent_state_node(), parent_scope)?;
    host.insert_before(parent, child.as_host_child(), before_child.as_host_child())?;

    Ok(TestHostRootMutationApplyStatus::Applied(
        TestHostRootMutationHostCall::InsertBefore,
    ))
}

fn apply_test_host_parent_deletion_record(
    store: &FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    mutation: HostRootMutationApplyRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationApplyStatus, HostWorkError> {
    if mutation.parent_tag() != FiberTag::HostComponent
        || mutation.parent_state_node().is_none()
        || mutation.state_node().is_none()
    {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    }

    let child = owned_detached_host_child_for_apply_record(store, detached_hosts, mutation)?;
    let parent_scope = detached_hosts.validated_scope_for_apply_fiber(
        store,
        mutation.parent_state_node(),
        mutation.root(),
        mutation.parent(),
        HostFiberTokenTarget::Instance,
    )?;
    let parent = detached_hosts
        .nodes
        .instance_mut(mutation.parent_state_node(), parent_scope)?;
    host.remove_child(parent, child.as_host_child())?;

    Ok(TestHostRootMutationApplyStatus::Applied(
        TestHostRootMutationHostCall::RemoveChild,
    ))
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum OwnedDetachedHostChild {
    Instance(FakeInstance),
    Text(FakeTextInstance),
}

impl OwnedDetachedHostChild {
    fn as_host_child(&self) -> HostChild<'_, RecordingHost> {
        match self {
            Self::Instance(instance) => HostChild::Instance(instance),
            Self::Text(text) => HostChild::Text(text),
        }
    }
}

fn owned_detached_host_child_for_apply_record(
    store: &FiberRootStore<RecordingHost>,
    detached_hosts: &DetachedHostRecords,
    mutation: HostRootMutationApplyRecord,
) -> Result<OwnedDetachedHostChild, HostWorkError> {
    owned_detached_host_child_for_fiber(
        store,
        detached_hosts,
        mutation.root(),
        mutation.fiber(),
        mutation.tag(),
        mutation.state_node(),
    )
}

fn owned_detached_host_child_for_fiber(
    store: &FiberRootStore<RecordingHost>,
    detached_hosts: &DetachedHostRecords,
    root: FiberRootId,
    fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
) -> Result<OwnedDetachedHostChild, HostWorkError> {
    match tag {
        FiberTag::HostComponent => {
            let scope = detached_hosts.validated_scope_for_apply_fiber(
                store,
                state_node,
                root,
                fiber,
                HostFiberTokenTarget::Instance,
            )?;
            Ok(OwnedDetachedHostChild::Instance(
                detached_hosts.nodes.instance(state_node, scope)?.clone(),
            ))
        }
        FiberTag::HostText => {
            let scope = detached_hosts.validated_scope_for_apply_fiber(
                store,
                state_node,
                root,
                fiber,
                HostFiberTokenTarget::TextInstance,
            )?;
            Ok(OwnedDetachedHostChild::Text(
                detached_hosts.nodes.text(state_node, scope)?.clone(),
            ))
        }
        actual => Err(HostWorkError::ExpectedFiberTag {
            fiber,
            expected: FiberTag::HostComponent,
            actual,
        }),
    }
}

fn detached_host_child_for_apply_record<'a>(
    store: &FiberRootStore<RecordingHost>,
    detached_hosts: &'a DetachedHostRecords,
    mutation: HostRootMutationApplyRecord,
) -> Result<HostChild<'a, RecordingHost>, HostWorkError> {
    if mutation.state_node().is_none() {
        return Err(HostWorkError::MissingStateNode {
            fiber: mutation.fiber(),
            tag: mutation.tag(),
        });
    }

    match mutation.tag() {
        FiberTag::HostComponent => {
            let scope = detached_hosts.validated_scope(
                store.host_tokens(),
                mutation.state_node(),
                mutation.root(),
                mutation.fiber(),
                HostFiberTokenTarget::Instance,
            )?;
            Ok(HostChild::Instance(
                detached_hosts
                    .nodes
                    .instance(mutation.state_node(), scope)?,
            ))
        }
        FiberTag::HostText => {
            let scope = detached_hosts.validated_scope(
                store.host_tokens(),
                mutation.state_node(),
                mutation.root(),
                mutation.fiber(),
                HostFiberTokenTarget::TextInstance,
            )?;
            Ok(HostChild::Text(
                detached_hosts.nodes.text(mutation.state_node(), scope)?,
            ))
        }
        actual => Err(HostWorkError::ExpectedFiberTag {
            fiber: mutation.fiber(),
            expected: FiberTag::HostComponent,
            actual,
        }),
    }
}

pub(crate) fn mount_test_host_work(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
) -> Result<HostWorkResult, HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    let container = *store.root(render.root())?.container_info();
    let mut detached_hosts = DetachedHostRecords::default();
    let root_child = match source.root(render.resulting_element()) {
        Some(node) => {
            host.root_host_context(&container)?;
            let child = begin_test_host_node(
                store,
                host,
                &container,
                render.root(),
                render.work_in_progress(),
                node,
                &(),
                true,
                render.render_lanes(),
                &mut detached_hosts,
            )?;
            store
                .fiber_arena_mut()
                .set_children(render.work_in_progress(), &[child])?;
            Some(child)
        }
        None if render.resulting_element().is_none() => {
            store
                .fiber_arena_mut()
                .set_children(render.work_in_progress(), &[])?;
            None
        }
        None => {
            return Err(HostWorkError::MissingTestRootElement {
                handle: render.resulting_element(),
            });
        }
    };

    complete_host_root(store, render.work_in_progress())?;

    Ok(HostWorkResult {
        root: render.root(),
        work_in_progress: render.work_in_progress(),
        root_child,
        root_children: root_child.into_iter().collect(),
        completed_child: root_child,
        completed_children: root_child.into_iter().collect(),
        detached_hosts,
        sync_flush_host_work_epoch: 0,
        consumed_sync_flush_host_mutations: Vec::new(),
        consumed_root_child_replacements: Vec::new(),
        cleanup_ownership_transfers: Vec::new(),
    })
}

pub(crate) fn update_test_host_work_root_text_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host_work: &mut HostWorkResult,
    render: HostRootRenderPhaseRecord,
    text: &TestHostText,
) -> Result<(), HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    let current = host_work
        .completed_child()
        .ok_or(HostWorkError::MissingHostWorkRootChild {
            root: host_work.root(),
            work_in_progress: host_work.work_in_progress(),
        })?;
    expect_tag(store, current, FiberTag::HostText)?;

    let diff = update_test_host_text_work(
        store,
        render.root(),
        current,
        text,
        render.render_lanes(),
        host_work.detached_hosts_mut(),
    )?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[diff.work_in_progress()])?;
    complete_host_root(store, render.work_in_progress())?;
    host_work.retarget_finished_work_for_canary(render, vec![diff.work_in_progress()]);
    Ok(())
}

pub(crate) fn update_test_host_work_root_component_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host_work: &mut HostWorkResult,
    render: HostRootRenderPhaseRecord,
    element: &TestHostElement,
) -> Result<(), HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    let current = host_work
        .completed_child()
        .ok_or(HostWorkError::MissingHostWorkRootChild {
            root: host_work.root(),
            work_in_progress: host_work.work_in_progress(),
        })?;
    expect_tag(store, current, FiberTag::HostComponent)?;

    let payload = update_test_host_component_work(
        store,
        render.root(),
        current,
        element,
        render.render_lanes(),
        host_work.detached_hosts_mut(),
    )?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[payload.work_in_progress()])?;
    complete_host_root(store, render.work_in_progress())?;
    host_work.retarget_finished_work_for_canary(render, vec![payload.work_in_progress()]);
    Ok(())
}

pub(crate) fn delete_test_host_work_root_child_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host_work: &mut HostWorkResult,
    render: HostRootRenderPhaseRecord,
) -> Result<(), HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    let deleted = host_work
        .completed_child()
        .ok_or(HostWorkError::MissingHostWorkRootChild {
            root: host_work.root(),
            work_in_progress: host_work.work_in_progress(),
        })?;
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(render.work_in_progress(), deleted)?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[])?;
    complete_host_root(store, render.work_in_progress())?;
    host_work.retarget_finished_work_for_canary(render, Vec::new());
    Ok(())
}

#[cfg(test)]
pub(crate) fn update_test_host_root_sibling_text_child_work_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host_work: &mut HostWorkResult,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    updated_current: FiberId,
    next_element: RootElementHandle,
) -> Result<FiberId, HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    let current_children = validated_multi_child_host_work_current_children(
        store,
        render.root(),
        render.current(),
        host_work,
    )?;
    let source_node = source
        .root(next_element)
        .ok_or(HostWorkError::MissingTestRootElement {
            handle: next_element,
        })?;
    let TestHostNode::Text(text) = source_node else {
        return Err(HostWorkError::ExpectedFiberTag {
            fiber: updated_current,
            expected: FiberTag::HostText,
            actual: FiberTag::HostComponent,
        });
    };

    let mut completed_children = Vec::with_capacity(current_children.len());
    let mut updated_work = None;
    for current in current_children {
        if current == updated_current {
            let diff = update_test_host_text_work(
                store,
                render.root(),
                current,
                text,
                render.render_lanes(),
                host_work.detached_hosts_mut(),
            )?;
            updated_work = Some(diff.work_in_progress());
            completed_children.push(diff.work_in_progress());
        } else {
            completed_children.push(stable_root_text_sibling_work_for_canary(store, current)?);
        }
    }

    let updated_work = updated_work.ok_or(HostWorkError::MissingCurrentRootChild {
        root: render.root(),
        current: render.current(),
    })?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &completed_children)?;
    complete_host_root(store, render.work_in_progress())?;
    host_work.retarget_finished_work_for_canary(render, completed_children);
    Ok(updated_work)
}

#[cfg(test)]
pub(crate) fn delete_test_host_root_sibling_child_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host_work: &mut HostWorkResult,
    render: HostRootRenderPhaseRecord,
    deleted_current: FiberId,
) -> Result<Vec<FiberId>, HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    let current_children = validated_multi_child_host_work_current_children(
        store,
        render.root(),
        render.current(),
        host_work,
    )?;
    if !current_children.contains(&deleted_current) {
        return Err(HostWorkError::MissingCurrentRootChild {
            root: render.root(),
            current: render.current(),
        });
    }

    let mut remaining_children = Vec::with_capacity(current_children.len().saturating_sub(1));
    for current in current_children {
        if current == deleted_current {
            continue;
        }
        remaining_children.push(stable_root_text_sibling_work_for_canary(store, current)?);
    }

    store
        .fiber_arena_mut()
        .mark_child_for_deletion(render.work_in_progress(), deleted_current)?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &remaining_children)?;
    complete_host_root(store, render.work_in_progress())?;
    host_work.retarget_finished_work_for_canary(render, remaining_children.clone());
    Ok(remaining_children)
}

#[cfg(test)]
fn validated_multi_child_host_work_current_children(
    store: &FiberRootStore<RecordingHost>,
    root: FiberRootId,
    current: FiberId,
    host_work: &HostWorkResult,
) -> Result<Vec<FiberId>, HostWorkError> {
    if host_work.root() != root || host_work.work_in_progress() != current {
        return Err(HostWorkError::CommitCurrentMismatch {
            root,
            expected: current,
            actual: host_work.work_in_progress(),
        });
    }

    let current_children = store.fiber_arena().child_ids(current)?;
    if current_children.len() < 2 {
        return Err(HostWorkError::ExpectedMultipleRootChildren {
            count: current_children.len(),
        });
    }
    if current_children.as_slice() != host_work.root_children() {
        let Some(&sibling) = host_work.root_children().first() else {
            return Err(HostWorkError::ExpectedMultipleRootChildren {
                count: host_work.root_children().len(),
            });
        };
        return Err(HostWorkError::UnexpectedCurrentRootChildSibling {
            root,
            current,
            child: *current_children.first().expect("length checked above"),
            sibling,
        });
    }

    Ok(current_children)
}

#[cfg(test)]
fn stable_root_text_sibling_work_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    current: FiberId,
) -> Result<FiberId, HostWorkError> {
    expect_tag(store, current, FiberTag::HostText)?;
    let current_node = store.fiber_arena().get(current)?;
    let props = current_node.memoized_props();
    let state_node = current_node.state_node();
    let work = store
        .fiber_arena_mut()
        .create_work_in_progress(current, props)?;
    {
        let node = store.fiber_arena_mut().get_mut(work)?;
        node.set_state_node(state_node);
        node.set_memoized_props(props);
        node.set_lanes(Lanes::NO);
        node.set_flags(FiberFlags::NO);
    }
    complete_fiber_common(
        store,
        work,
        props,
        state_node,
        InitialChildrenFinalization::NoCommitMount,
    )?;
    Ok(work)
}

pub(crate) fn mount_test_host_sibling_work(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    source_children: &[RootElementHandle],
) -> Result<HostWorkResult, HostWorkError> {
    mount_test_host_sibling_work_with_detached_hosts_for_canary(
        store,
        host,
        render,
        source,
        source_children,
        DetachedHostRecords::default(),
    )
}

pub(crate) fn mount_test_host_sibling_work_with_detached_hosts_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    source_children: &[RootElementHandle],
    mut detached_hosts: DetachedHostRecords,
) -> Result<HostWorkResult, HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    if source_children.len() < 2 {
        return Err(HostWorkError::ExpectedMultipleRootChildren {
            count: source_children.len(),
        });
    }
    if let Some(child) = store.fiber_arena().get(render.work_in_progress())?.child() {
        return Err(HostWorkError::UnexpectedExistingChild {
            parent: render.work_in_progress(),
            child,
        });
    }

    let mut root_nodes = Vec::with_capacity(source_children.len());
    for &handle in source_children {
        let node = source
            .root(handle)
            .ok_or(HostWorkError::MissingTestRootElement { handle })?;
        root_nodes.push(node);
    }

    let container = *store.root(render.root())?.container_info();
    let mut root_children = Vec::with_capacity(root_nodes.len());
    host.root_host_context(&container)?;
    for node in root_nodes {
        root_children.push(begin_test_host_node(
            store,
            host,
            &container,
            render.root(),
            render.work_in_progress(),
            node,
            &(),
            true,
            render.render_lanes(),
            &mut detached_hosts,
        )?);
    }

    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &root_children)?;
    complete_host_root(store, render.work_in_progress())?;

    let root_child = root_children.first().copied();
    Ok(HostWorkResult {
        root: render.root(),
        work_in_progress: render.work_in_progress(),
        root_child,
        root_children: root_children.clone(),
        completed_child: root_child,
        completed_children: root_children,
        detached_hosts,
        sync_flush_host_work_epoch: 0,
        consumed_sync_flush_host_mutations: Vec::new(),
        consumed_root_child_replacements: Vec::new(),
        cleanup_ownership_transfers: Vec::new(),
    })
}

pub(crate) fn mount_test_function_component_single_host_child_work(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    function_component: FiberId,
    child_element: RootElementHandle,
    source: &TestHostTree,
) -> Result<HostWorkResult, HostWorkError> {
    validate_function_component_parent_topology(
        store,
        render.root(),
        render.work_in_progress(),
        function_component,
    )?;

    let Some(node) = source.root(child_element) else {
        return Err(HostWorkError::MissingTestRootElement {
            handle: child_element,
        });
    };

    let container = *store.root(render.root())?.container_info();
    let mut detached_hosts = DetachedHostRecords::default();
    host.root_host_context(&container)?;
    let host_child = begin_test_host_node(
        store,
        host,
        &container,
        render.root(),
        function_component,
        node,
        &(),
        true,
        render.render_lanes(),
        &mut detached_hosts,
    )?;
    store
        .fiber_arena_mut()
        .set_children(function_component, &[host_child])?;
    complete_function_component_parent(store, function_component)?;
    complete_host_root(store, render.work_in_progress())?;

    Ok(HostWorkResult {
        root: render.root(),
        work_in_progress: render.work_in_progress(),
        root_child: Some(function_component),
        root_children: vec![function_component],
        completed_child: Some(host_child),
        completed_children: vec![host_child],
        detached_hosts,
        sync_flush_host_work_epoch: 0,
        consumed_sync_flush_host_mutations: Vec::new(),
        consumed_root_child_replacements: Vec::new(),
        cleanup_ownership_transfers: Vec::new(),
    })
}

pub(crate) fn update_test_host_root_work_with_detached_hosts_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    mut detached_hosts: DetachedHostRecords,
) -> Result<HostWorkResult, HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    if let Some(child) = store.fiber_arena().get(render.work_in_progress())?.child() {
        return Err(HostWorkError::UnexpectedExistingChild {
            parent: render.work_in_progress(),
            child,
        });
    }

    let current_child =
        single_current_root_child_for_update(store, render.root(), render.current())?;
    let source_node =
        source
            .root(render.resulting_element())
            .ok_or(HostWorkError::MissingTestRootElement {
                handle: render.resulting_element(),
            })?;
    let current_tag = store.fiber_arena().get(current_child)?.tag();

    let completed_child = match (current_tag, source_node) {
        (FiberTag::HostText, TestHostNode::Text(text)) => update_test_host_text_work(
            store,
            render.root(),
            current_child,
            text,
            render.render_lanes(),
            &mut detached_hosts,
        )?
        .work_in_progress(),
        (FiberTag::HostComponent, TestHostNode::Element(element)) => {
            update_test_host_component_work(
                store,
                render.root(),
                current_child,
                element,
                render.render_lanes(),
                &mut detached_hosts,
            )?
            .work_in_progress()
        }
        (actual, TestHostNode::Text(_)) => {
            return Err(HostWorkError::ExpectedFiberTag {
                fiber: current_child,
                expected: FiberTag::HostText,
                actual,
            });
        }
        (actual, TestHostNode::Element(_)) => {
            return Err(HostWorkError::ExpectedFiberTag {
                fiber: current_child,
                expected: FiberTag::HostComponent,
                actual,
            });
        }
    };

    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[completed_child])?;
    complete_host_root(store, render.work_in_progress())?;

    Ok(HostWorkResult {
        root: render.root(),
        work_in_progress: render.work_in_progress(),
        root_child: Some(completed_child),
        root_children: vec![completed_child],
        completed_child: Some(completed_child),
        completed_children: vec![completed_child],
        detached_hosts,
        sync_flush_host_work_epoch: 0,
        consumed_sync_flush_host_mutations: Vec::new(),
        consumed_root_child_replacements: Vec::new(),
        cleanup_ownership_transfers: Vec::new(),
    })
}

pub(crate) fn replace_test_host_root_child_work_with_detached_hosts_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    mut detached_hosts: DetachedHostRecords,
) -> Result<HostWorkResult, HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    if let Some(child) = store.fiber_arena().get(render.work_in_progress())?.child() {
        return Err(HostWorkError::UnexpectedExistingChild {
            parent: render.work_in_progress(),
            child,
        });
    }

    let current_child =
        single_current_root_child_for_update(store, render.root(), render.current())?;
    let source_node =
        source
            .root(render.resulting_element())
            .ok_or(HostWorkError::MissingTestRootElement {
                handle: render.resulting_element(),
            })?;
    let current_node = store.fiber_arena().get(current_child)?;
    let current_tag = current_node.tag();
    let next_tag = test_host_root_node_tag(source_node);
    if current_tag == next_tag {
        return Err(HostWorkError::ExpectedRootChildReplacement {
            root: render.root(),
            current: render.current(),
            current_child,
            current_tag,
            next_tag,
        });
    }
    owned_detached_host_child_for_fiber(
        store,
        &detached_hosts,
        render.root(),
        current_child,
        current_tag,
        current_node.state_node(),
    )?;

    let container = *store.root(render.root())?.container_info();
    host.root_host_context(&container)?;
    let replacement_child = begin_test_host_node(
        store,
        host,
        &container,
        render.root(),
        render.work_in_progress(),
        source_node,
        &(),
        true,
        render.render_lanes(),
        &mut detached_hosts,
    )?;
    debug_assert_eq!(store.fiber_arena().get(replacement_child)?.tag(), next_tag);

    store
        .fiber_arena_mut()
        .mark_child_for_deletion(render.work_in_progress(), current_child)?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[replacement_child])?;
    complete_host_root(store, render.work_in_progress())?;

    Ok(HostWorkResult {
        root: render.root(),
        work_in_progress: render.work_in_progress(),
        root_child: Some(replacement_child),
        root_children: vec![replacement_child],
        completed_child: Some(replacement_child),
        completed_children: vec![replacement_child],
        detached_hosts,
        sync_flush_host_work_epoch: 0,
        consumed_sync_flush_host_mutations: Vec::new(),
        consumed_root_child_replacements: Vec::new(),
        cleanup_ownership_transfers: Vec::new(),
    })
}

#[cfg(test)]
pub(crate) fn replace_test_host_root_child_before_stable_sibling_work_with_detached_hosts_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    deleted_current: FiberId,
    stable_current: FiberId,
    mut detached_hosts: DetachedHostRecords,
) -> Result<HostWorkResult, HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    if let Some(child) = store.fiber_arena().get(render.work_in_progress())?.child() {
        return Err(HostWorkError::UnexpectedExistingChild {
            parent: render.work_in_progress(),
            child,
        });
    }

    let current_children = store.fiber_arena().child_ids(render.current())?;
    if current_children.len() != 2 {
        return Err(HostWorkError::ExpectedMultipleRootChildren {
            count: current_children.len(),
        });
    }
    if current_children[0] != deleted_current || current_children[1] != stable_current {
        return Err(HostWorkError::UnexpectedCurrentRootChildSibling {
            root: render.root(),
            current: render.current(),
            child: current_children[0],
            sibling: current_children[1],
        });
    }

    let source_node =
        source
            .root(render.resulting_element())
            .ok_or(HostWorkError::MissingTestRootElement {
                handle: render.resulting_element(),
            })?;
    let deleted_node = store.fiber_arena().get(deleted_current)?;
    let current_tag = deleted_node.tag();
    let next_tag = test_host_root_node_tag(source_node);
    if current_tag == next_tag {
        return Err(HostWorkError::ExpectedRootChildReplacement {
            root: render.root(),
            current: render.current(),
            current_child: deleted_current,
            current_tag,
            next_tag,
        });
    }
    owned_detached_host_child_for_fiber(
        store,
        &detached_hosts,
        render.root(),
        deleted_current,
        current_tag,
        deleted_node.state_node(),
    )?;
    let stable_node = store.fiber_arena().get(stable_current)?;
    if stable_node.tag() != FiberTag::HostText {
        return Err(HostWorkError::ExpectedFiberTag {
            fiber: stable_current,
            expected: FiberTag::HostText,
            actual: stable_node.tag(),
        });
    }
    owned_detached_host_child_for_fiber(
        store,
        &detached_hosts,
        render.root(),
        stable_current,
        stable_node.tag(),
        stable_node.state_node(),
    )?;

    let container = *store.root(render.root())?.container_info();
    host.root_host_context(&container)?;
    let replacement_child = begin_test_host_node(
        store,
        host,
        &container,
        render.root(),
        render.work_in_progress(),
        source_node,
        &(),
        true,
        render.render_lanes(),
        &mut detached_hosts,
    )?;
    debug_assert_eq!(store.fiber_arena().get(replacement_child)?.tag(), next_tag);
    let stable_work = stable_root_text_sibling_work_for_canary(store, stable_current)?;

    store
        .fiber_arena_mut()
        .mark_child_for_deletion(render.work_in_progress(), deleted_current)?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[replacement_child, stable_work])?;
    complete_host_root(store, render.work_in_progress())?;

    Ok(HostWorkResult {
        root: render.root(),
        work_in_progress: render.work_in_progress(),
        root_child: Some(replacement_child),
        root_children: vec![replacement_child, stable_work],
        completed_child: Some(replacement_child),
        completed_children: vec![replacement_child, stable_work],
        detached_hosts,
        sync_flush_host_work_epoch: 0,
        consumed_sync_flush_host_mutations: Vec::new(),
        consumed_root_child_replacements: Vec::new(),
        cleanup_ownership_transfers: Vec::new(),
    })
}

#[cfg(test)]
pub(crate) fn replace_test_host_root_child_between_stable_siblings_work_with_detached_hosts_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    stable_previous_current: FiberId,
    deleted_current: FiberId,
    stable_trailing_current: FiberId,
    mut detached_hosts: DetachedHostRecords,
) -> Result<HostWorkResult, HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    if let Some(child) = store.fiber_arena().get(render.work_in_progress())?.child() {
        return Err(HostWorkError::UnexpectedExistingChild {
            parent: render.work_in_progress(),
            child,
        });
    }

    let current_children = store.fiber_arena().child_ids(render.current())?;
    if current_children.len() != 3 {
        return Err(HostWorkError::ExpectedMultipleRootChildren {
            count: current_children.len(),
        });
    }
    if current_children[0] != stable_previous_current
        || current_children[1] != deleted_current
        || current_children[2] != stable_trailing_current
    {
        return Err(HostWorkError::UnexpectedCurrentRootChildSibling {
            root: render.root(),
            current: render.current(),
            child: current_children[0],
            sibling: current_children[1],
        });
    }

    let source_node =
        source
            .root(render.resulting_element())
            .ok_or(HostWorkError::MissingTestRootElement {
                handle: render.resulting_element(),
            })?;
    let deleted_node = store.fiber_arena().get(deleted_current)?;
    let current_tag = deleted_node.tag();
    let next_tag = test_host_root_node_tag(source_node);
    if current_tag == next_tag {
        return Err(HostWorkError::ExpectedRootChildReplacement {
            root: render.root(),
            current: render.current(),
            current_child: deleted_current,
            current_tag,
            next_tag,
        });
    }
    owned_detached_host_child_for_fiber(
        store,
        &detached_hosts,
        render.root(),
        deleted_current,
        current_tag,
        deleted_node.state_node(),
    )?;

    for stable_current in [stable_previous_current, stable_trailing_current] {
        let stable_node = store.fiber_arena().get(stable_current)?;
        if stable_node.tag() != FiberTag::HostText {
            return Err(HostWorkError::ExpectedFiberTag {
                fiber: stable_current,
                expected: FiberTag::HostText,
                actual: stable_node.tag(),
            });
        }
        owned_detached_host_child_for_fiber(
            store,
            &detached_hosts,
            render.root(),
            stable_current,
            stable_node.tag(),
            stable_node.state_node(),
        )?;
    }

    let container = *store.root(render.root())?.container_info();
    host.root_host_context(&container)?;
    let replacement_child = begin_test_host_node(
        store,
        host,
        &container,
        render.root(),
        render.work_in_progress(),
        source_node,
        &(),
        true,
        render.render_lanes(),
        &mut detached_hosts,
    )?;
    debug_assert_eq!(store.fiber_arena().get(replacement_child)?.tag(), next_tag);
    let stable_previous_work =
        stable_root_text_sibling_work_for_canary(store, stable_previous_current)?;
    let stable_trailing_work =
        stable_root_text_sibling_work_for_canary(store, stable_trailing_current)?;

    store
        .fiber_arena_mut()
        .mark_child_for_deletion(render.work_in_progress(), deleted_current)?;
    store.fiber_arena_mut().set_children(
        render.work_in_progress(),
        &[
            stable_previous_work,
            replacement_child,
            stable_trailing_work,
        ],
    )?;
    complete_host_root(store, render.work_in_progress())?;

    Ok(HostWorkResult {
        root: render.root(),
        work_in_progress: render.work_in_progress(),
        root_child: Some(stable_previous_work),
        root_children: vec![
            stable_previous_work,
            replacement_child,
            stable_trailing_work,
        ],
        completed_child: Some(replacement_child),
        completed_children: vec![
            stable_previous_work,
            replacement_child,
            stable_trailing_work,
        ],
        detached_hosts,
        sync_flush_host_work_epoch: 0,
        consumed_sync_flush_host_mutations: Vec::new(),
        consumed_root_child_replacements: Vec::new(),
        cleanup_ownership_transfers: Vec::new(),
    })
}

pub(crate) fn update_test_host_root_component_with_text_child_work_with_detached_hosts_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    mut detached_hosts: DetachedHostRecords,
) -> Result<HostWorkResult, HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    if let Some(child) = store.fiber_arena().get(render.work_in_progress())?.child() {
        return Err(HostWorkError::UnexpectedExistingChild {
            parent: render.work_in_progress(),
            child,
        });
    }

    let current_component =
        single_current_root_child_for_update(store, render.root(), render.current())?;
    expect_tag(store, current_component, FiberTag::HostComponent)?;
    let current_text =
        single_host_text_child_for_root_component_update(store, render.root(), current_component)?;
    let source_node =
        source
            .root(render.resulting_element())
            .ok_or(HostWorkError::MissingTestRootElement {
                handle: render.resulting_element(),
            })?;
    let TestHostNode::Element(element) = source_node else {
        return Err(HostWorkError::ExpectedFiberTag {
            fiber: current_component,
            expected: FiberTag::HostComponent,
            actual: FiberTag::HostText,
        });
    };
    let next_text = element
        .children()
        .iter()
        .find_map(|child| match child {
            TestHostNode::Text(text) => Some(text),
            TestHostNode::Element(_) => None,
        })
        .ok_or(HostWorkError::MissingHostComponentTextChild {
            root: render.root(),
            component: current_component,
        })?;

    let payload = update_test_host_component_work(
        store,
        render.root(),
        current_component,
        element,
        render.render_lanes(),
        &mut detached_hosts,
    )?;
    let diff = update_test_host_text_work(
        store,
        render.root(),
        current_text,
        next_text,
        render.render_lanes(),
        &mut detached_hosts,
    )?;
    store
        .fiber_arena_mut()
        .set_children(payload.work_in_progress(), &[diff.work_in_progress()])?;
    complete_fiber_common(
        store,
        payload.work_in_progress(),
        element.props(),
        payload.state_node(),
        InitialChildrenFinalization::NoCommitMount,
    )?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[payload.work_in_progress()])?;
    complete_host_root(store, render.work_in_progress())?;
    let cleanup_ownership_transfers = vec![
        detached_host_cleanup_ownership_transfer_for_update(
            &detached_hosts,
            render.root(),
            render.work_in_progress(),
            payload.current(),
            payload.work_in_progress(),
            FiberTag::HostComponent,
            payload.state_node(),
            HostFiberTokenTarget::Instance,
        )?,
        detached_host_cleanup_ownership_transfer_for_update(
            &detached_hosts,
            render.root(),
            render.work_in_progress(),
            diff.current(),
            diff.work_in_progress(),
            FiberTag::HostText,
            diff.state_node(),
            HostFiberTokenTarget::TextInstance,
        )?,
    ];

    Ok(HostWorkResult {
        root: render.root(),
        work_in_progress: render.work_in_progress(),
        root_child: Some(payload.work_in_progress()),
        root_children: vec![payload.work_in_progress()],
        completed_child: Some(payload.work_in_progress()),
        completed_children: vec![payload.work_in_progress(), diff.work_in_progress()],
        detached_hosts,
        sync_flush_host_work_epoch: 0,
        consumed_sync_flush_host_mutations: Vec::new(),
        consumed_root_child_replacements: Vec::new(),
        cleanup_ownership_transfers,
    })
}

fn test_host_root_node_tag(node: &TestHostNode) -> FiberTag {
    match node {
        TestHostNode::Element(_) => FiberTag::HostComponent,
        TestHostNode::Text(_) => FiberTag::HostText,
    }
}

fn single_current_root_child_for_update(
    store: &FiberRootStore<RecordingHost>,
    root: FiberRootId,
    current: FiberId,
) -> Result<FiberId, HostWorkError> {
    expect_tag(store, current, FiberTag::HostRoot)?;
    let child = store
        .fiber_arena()
        .get(current)?
        .child()
        .ok_or(HostWorkError::MissingCurrentRootChild { root, current })?;
    if let Some(sibling) = store.fiber_arena().get(child)?.sibling() {
        return Err(HostWorkError::UnexpectedCurrentRootChildSibling {
            root,
            current,
            child,
            sibling,
        });
    }
    Ok(child)
}

fn single_host_text_child_for_root_component_update(
    store: &FiberRootStore<RecordingHost>,
    root: FiberRootId,
    component: FiberId,
) -> Result<FiberId, HostWorkError> {
    expect_tag(store, component, FiberTag::HostComponent)?;
    let text = store
        .fiber_arena()
        .get(component)?
        .child()
        .ok_or(HostWorkError::MissingHostComponentTextChild { root, component })?;
    expect_tag(store, text, FiberTag::HostText)?;
    if let Some(sibling) = store.fiber_arena().get(text)?.sibling() {
        return Err(HostWorkError::UnexpectedExistingChild {
            parent: component,
            child: sibling,
        });
    }
    Ok(text)
}

fn validate_function_component_parent_topology(
    store: &FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host_root_work_in_progress: FiberId,
    function_component: FiberId,
) -> Result<(), HostWorkError> {
    expect_tag(store, host_root_work_in_progress, FiberTag::HostRoot)?;
    expect_tag(store, function_component, FiberTag::FunctionComponent)?;

    let root_child = store.fiber_arena().get(host_root_work_in_progress)?.child();
    let function_node = store.fiber_arena().get(function_component)?;
    let actual_parent = function_node.return_fiber();
    let actual_sibling = function_node.sibling();
    if root_child != Some(function_component)
        || actual_parent != Some(host_root_work_in_progress)
        || actual_sibling.is_some()
    {
        return Err(HostWorkError::FunctionComponentParentTopologyMismatch(
            Box::new(FunctionComponentParentTopologyMismatchRecord {
                root: root_id,
                host_root_work_in_progress,
                function_component,
                actual_root_child: root_child,
                actual_parent,
                actual_sibling,
            }),
        ));
    }

    if let Some(child) = function_node.child() {
        return Err(HostWorkError::UnexpectedExistingChild {
            parent: function_component,
            child,
        });
    }

    Ok(())
}

fn update_test_host_text_work(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    current: FiberId,
    text: &TestHostText,
    render_lanes: Lanes,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<HostTextUpdateDiff, HostWorkError> {
    expect_tag(store, current, FiberTag::HostText)?;
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current, text.props())?;
    {
        let node = store.fiber_arena_mut().get_mut(work_in_progress)?;
        node.set_lanes(render_lanes);
    }

    complete_host_text_update(
        store,
        root_id,
        current,
        work_in_progress,
        text,
        detached_hosts,
    )
}

fn update_test_host_component_work(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    current: FiberId,
    element: &TestHostElement,
    render_lanes: Lanes,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<HostComponentUpdatePayload, HostWorkError> {
    expect_tag(store, current, FiberTag::HostComponent)?;
    let old_props = store.fiber_arena().get(current)?.memoized_props();
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current, element.props())?;
    {
        let node = store.fiber_arena_mut().get_mut(work_in_progress)?;
        node.set_element_type(element.element_type());
        node.set_lanes(render_lanes);
    }

    complete_host_component_update(
        store,
        root_id,
        current,
        work_in_progress,
        element,
        old_props,
        detached_hosts,
    )
}

#[allow(clippy::too_many_arguments)]
fn begin_test_host_node(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    container: &crate::test_support::FakeContainer,
    root_id: FiberRootId,
    parent: FiberId,
    node: &TestHostNode,
    parent_context: &(),
    is_root_child: bool,
    render_lanes: Lanes,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<FiberId, HostWorkError> {
    match node {
        TestHostNode::Element(element) => begin_host_component(
            store,
            host,
            container,
            root_id,
            parent,
            element,
            parent_context,
            is_root_child,
            render_lanes,
            detached_hosts,
        ),
        TestHostNode::Text(text) => begin_host_text(
            store,
            host,
            container,
            root_id,
            parent,
            text,
            parent_context,
            is_root_child,
            render_lanes,
            detached_hosts,
        ),
    }
}

#[allow(clippy::too_many_arguments)]
fn begin_host_component(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    container: &crate::test_support::FakeContainer,
    root_id: FiberRootId,
    parent: FiberId,
    element: &TestHostElement,
    parent_context: &(),
    is_root_child: bool,
    render_lanes: Lanes,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<FiberId, HostWorkError> {
    let mode = store.fiber_arena().get(parent)?.mode();
    let fiber =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, element.props(), mode);
    {
        let node = store.fiber_arena_mut().get_mut(fiber)?;
        node.set_element_type(element.element_type());
        node.set_lanes(render_lanes);
        if is_root_child {
            node.merge_flags(FiberFlags::PLACEMENT);
        }
    }

    host.child_host_context(parent_context, &element.ty(), &())?;
    let should_set_text_content = host.should_set_text_content(&element.ty(), &(), parent_context);
    if should_set_text_content {
        store.fiber_arena_mut().set_children(fiber, &[])?;
    } else {
        let mut children = Vec::new();
        for child in element.children() {
            children.push(begin_test_host_node(
                store,
                host,
                container,
                root_id,
                fiber,
                child,
                &(),
                false,
                render_lanes,
                detached_hosts,
            )?);
        }
        store.fiber_arena_mut().set_children(fiber, &children)?;
    }

    complete_host_component(
        store,
        host,
        container,
        root_id,
        fiber,
        element,
        parent_context,
        detached_hosts,
    )?;
    Ok(fiber)
}

#[allow(clippy::too_many_arguments)]
fn begin_host_text(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    container: &crate::test_support::FakeContainer,
    root_id: FiberRootId,
    parent: FiberId,
    text: &TestHostText,
    parent_context: &(),
    is_root_child: bool,
    render_lanes: Lanes,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<FiberId, HostWorkError> {
    let mode = store.fiber_arena().get(parent)?.mode();
    let fiber = store
        .fiber_arena_mut()
        .create_fiber(FiberTag::HostText, None, text.props(), mode);
    {
        let node = store.fiber_arena_mut().get_mut(fiber)?;
        node.set_lanes(render_lanes);
        if is_root_child {
            node.merge_flags(FiberFlags::PLACEMENT);
        }
    }

    complete_host_text(
        store,
        host,
        container,
        root_id,
        fiber,
        text,
        parent_context,
        detached_hosts,
    )?;
    Ok(fiber)
}

#[allow(clippy::too_many_arguments)]
fn complete_host_component(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    container: &crate::test_support::FakeContainer,
    root_id: FiberRootId,
    fiber: FiberId,
    element: &TestHostElement,
    parent_context: &(),
    detached_hosts: &mut DetachedHostRecords,
) -> Result<(), HostWorkError> {
    let scope =
        issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::Instance)?;
    let token = FakeHostFiberToken(scope.token_id().raw());
    let mut instance = host.create_instance(
        HostFiberTokenRef::new(
            &token,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        ),
        &element.ty(),
        &(),
        container,
        parent_context,
    )?;

    for child in store.fiber_arena().child_ids(fiber)? {
        let child_fiber = store.fiber_arena().get(child)?;
        detached_hosts.append_initial_child(
            store.host_tokens(),
            host,
            &mut instance,
            root_id,
            child_fiber,
        )?;
    }

    let finalization = host.finalize_initial_children(
        &mut instance,
        &element.ty(),
        &(),
        container,
        parent_context,
    )?;
    let state_node = detached_hosts.insert_instance(scope, instance);
    complete_fiber_common(store, fiber, element.props(), state_node, finalization)
}

#[allow(clippy::too_many_arguments)]
fn complete_host_text(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    container: &crate::test_support::FakeContainer,
    root_id: FiberRootId,
    fiber: FiberId,
    text: &TestHostText,
    parent_context: &(),
    detached_hosts: &mut DetachedHostRecords,
) -> Result<(), HostWorkError> {
    let scope =
        issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::TextInstance)?;
    let token = FakeHostFiberToken(scope.token_id().raw());
    let text_instance = host.create_text_instance(
        HostFiberTokenRef::new(
            &token,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        ),
        text.text(),
        container,
        parent_context,
    )?;
    let state_node = detached_hosts.insert_text(scope, text_instance);
    complete_fiber_common(
        store,
        fiber,
        text.props(),
        state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
}

fn complete_host_component_update(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    current: FiberId,
    work_in_progress: FiberId,
    element: &TestHostElement,
    old_props: PropsHandle,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<HostComponentUpdatePayload, HostWorkError> {
    expect_tag(store, current, FiberTag::HostComponent)?;
    expect_tag(store, work_in_progress, FiberTag::HostComponent)?;
    store
        .fiber_arena()
        .validate_alternate_pair(current, work_in_progress)?;

    let state_node = store.fiber_arena().get(work_in_progress)?.state_node();
    if state_node.is_none() {
        return Err(HostWorkError::MissingStateNode {
            fiber: work_in_progress,
            tag: FiberTag::HostComponent,
        });
    }

    detached_hosts.validated_scope_for_apply_fiber(
        store,
        state_node,
        root_id,
        current,
        HostFiberTokenTarget::Instance,
    )?;
    if old_props != element.props() {
        store
            .fiber_arena_mut()
            .get_mut(work_in_progress)?
            .merge_flags(FiberFlags::UPDATE);
    }
    store
        .fiber_arena_mut()
        .set_children(work_in_progress, &[])?;
    complete_fiber_common(
        store,
        work_in_progress,
        element.props(),
        state_node,
        InitialChildrenFinalization::NoCommitMount,
    )?;

    let payload = HostComponentUpdatePayload {
        root: root_id,
        current,
        work_in_progress,
        state_node,
        old_props,
        new_props: element.props(),
        ty: element.ty(),
        property_row: TestHostComponentPropertyPayloadRow::safe_test_property(
            old_props,
            element.props(),
        ),
    };
    if old_props != element.props() {
        detached_hosts.record_component_update(payload.clone());
    }
    Ok(payload)
}

fn complete_host_text_update(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    current: FiberId,
    work_in_progress: FiberId,
    text: &TestHostText,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<HostTextUpdateDiff, HostWorkError> {
    expect_tag(store, current, FiberTag::HostText)?;
    expect_tag(store, work_in_progress, FiberTag::HostText)?;
    store
        .fiber_arena()
        .validate_alternate_pair(current, work_in_progress)?;

    let state_node = store.fiber_arena().get(work_in_progress)?.state_node();
    if state_node.is_none() {
        return Err(HostWorkError::MissingStateNode {
            fiber: work_in_progress,
            tag: FiberTag::HostText,
        });
    }

    let scope = detached_hosts.validated_scope_for_apply_fiber(
        store,
        state_node,
        root_id,
        current,
        HostFiberTokenTarget::TextInstance,
    )?;
    let metadata = detached_hosts.nodes.text_metadata(state_node, scope)?;
    let old_text = detached_hosts
        .nodes
        .text(state_node, scope)?
        .text()
        .to_owned();
    let new_text = text.text().to_owned();
    let changed = old_text != new_text;

    if changed {
        store
            .fiber_arena_mut()
            .get_mut(work_in_progress)?
            .merge_flags(FiberFlags::UPDATE);
    }
    complete_fiber_common(
        store,
        work_in_progress,
        text.props(),
        state_node,
        InitialChildrenFinalization::NoCommitMount,
    )?;

    let diff = HostTextUpdateDiff {
        current,
        work_in_progress,
        state_node,
        metadata,
        old_text,
        new_text,
        changed,
    };
    if diff.changed() {
        detached_hosts.record_text_update(HostTextUpdatePayload {
            root: root_id,
            current: diff.current(),
            work_in_progress: diff.work_in_progress(),
            state_node: diff.state_node(),
            old_text: diff.old_text().to_owned(),
            new_text: diff.new_text().to_owned(),
            source_currentness: Some(HostNodeUpdateCurrentness::for_scope(
                diff.state_node(),
                scope,
                HostFiberTokenTarget::TextInstance,
            )),
        });
    }

    Ok(diff)
}

fn issue_creation_host_node_scope(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    fiber: FiberId,
    target: HostFiberTokenTarget,
) -> Result<HostNodeScope, HostWorkError> {
    let token_id =
        store
            .host_tokens_mut()
            .issue(root_id, fiber, HostFiberTokenPhase::Creation, target);
    store.host_tokens().validate(
        token_id,
        root_id,
        fiber,
        HostFiberTokenPhase::Creation,
        target,
    )?;
    Ok(HostNodeScope::new(
        root_id,
        fiber,
        token_id,
        HostFiberTokenPhase::Creation,
    ))
}

fn issue_commit_host_token(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    fiber: FiberId,
    target: HostFiberTokenTarget,
) -> Result<crate::HostFiberTokenId, HostWorkError> {
    let token_id =
        store
            .host_tokens_mut()
            .issue(root_id, fiber, HostFiberTokenPhase::Commit, target);
    store.host_tokens().validate(
        token_id,
        root_id,
        fiber,
        HostFiberTokenPhase::Commit,
        target,
    )?;
    Ok(token_id)
}

fn complete_fiber_common(
    store: &mut FiberRootStore<RecordingHost>,
    fiber: FiberId,
    memoized_props: PropsHandle,
    state_node: StateNodeHandle,
    finalization: InitialChildrenFinalization,
) -> Result<(), HostWorkError> {
    let bubbled = bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_lanes(Lanes::NO);
    node.set_state_node(state_node);
    node.set_memoized_props(memoized_props);
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    if matches!(finalization, InitialChildrenFinalization::CommitMount) {
        node.merge_flags(FiberFlags::UPDATE);
    }
    Ok(())
}

fn complete_host_root(
    store: &mut FiberRootStore<RecordingHost>,
    fiber: FiberId,
) -> Result<(), HostWorkError> {
    let bubbled = bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    Ok(())
}

fn complete_function_component_parent(
    store: &mut FiberRootStore<RecordingHost>,
    fiber: FiberId,
) -> Result<(), HostWorkError> {
    expect_tag(store, fiber, FiberTag::FunctionComponent)?;
    let bubbled = bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    Ok(())
}

fn expect_tag(
    store: &FiberRootStore<RecordingHost>,
    fiber: FiberId,
    expected: FiberTag,
) -> Result<(), HostWorkError> {
    let actual = store.fiber_arena().get(fiber)?.tag();
    if actual == expected {
        Ok(())
    } else {
        Err(HostWorkError::ExpectedFiberTag {
            fiber,
            expected,
            actual,
        })
    }
}

#[cfg(test)]
mod tests;
