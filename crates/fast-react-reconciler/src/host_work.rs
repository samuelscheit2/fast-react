//! Private test-only HostRoot/HostComponent/HostText work skeleton.
//!
//! This module intentionally uses the tiny `test_support` element source. It
//! exercises reconciler-owned topology, detached host creation, state-node
//! handles owned by the private host-node store, and bubbling without exposing
//! a public renderer or committing to a root container.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    FiberFlags, FiberId, FiberTag, FiberTopologyError, Lanes, PropsHandle, StateNodeHandle,
    bubble_properties,
};
use fast_react_host_config::{
    HostChild, HostCommit, HostCreation, HostError, HostFiberTokenPhase, HostFiberTokenRef,
    HostFiberTokenTarget, HostIdentityAndContext, InitialChildrenFinalization, MutationHost,
};

use crate::complete_work::{
    HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    HostComponentDangerousHtmlTextResetPayloadKindForCanary,
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
    HostNodeAppliedTextUpdate, HostNodeMetadata, HostNodePropertyUpdate,
    HostNodePropertyUpdateExecution, HostNodeScope, HostNodeStore, HostNodeTextUpdate,
    HostNodeUpdateCurrentness, HostNodeValidationError, HostNodeViolation,
};
use crate::passive_effects::{
    DeletedSubtreeRefCleanupReturnExecutor, DeletedSubtreeRefPassiveCleanupExecutionError,
    DeletedSubtreeRefPassiveCleanupExecutionResult, PassiveEffectDestroyCallbackExecutor,
    PassiveEffectsFlushResult,
    execute_deleted_subtree_ref_and_passive_cleanup_after_commit_for_canary,
};
#[cfg(test)]
use crate::root_commit::HostRootTextUpdateCommitExecutionRequestForCanary;
use crate::root_commit::{
    HostRootDangerousHtmlTextResetCommitHandoffRecordForCanary, HostRootDeletionCleanupOrderPhase,
    HostRootDeletionCleanupRecord, HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary,
    HostRootDeletionSubtreeHostDetachmentPlanForCanary,
    HostRootFinishedWorkCommitHandoffErrorForCanary,
    HostRootFinishedWorkCommitHandoffRecordForCanary,
    HostRootFinishedWorkPendingCommitRecordForCanary,
    HostRootManagedChildCommitHandoffRecordForCanary,
    HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary, HostRootMutationApplyRecord,
    HostRootMutationApplyRecordKind, HostRootMutationApplyRecordSource,
    HostRootMutationPhaseRecordKind, HostRootPlacementSiblingStatus,
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
    InvalidHostComponentPropertyUpdatePayload {
        root: FiberRootId,
        fiber: FiberId,
        prop_name: &'static str,
        violation: TestHostComponentPropertyPayloadViolation,
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
            | Self::InvalidHostComponentPropertyUpdatePayload { .. } => None,
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
                payload.work_in_progress() == mutation.fiber()
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

    fn commit_test_host_text_record(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        old_text: &str,
        new_text: &str,
    ) -> Result<usize, HostWorkError> {
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

        let applied = self.nodes.apply_text_update(
            handle,
            scope,
            HostNodeTextUpdate::new(old_text, new_text).with_currentness(
                HostNodeUpdateCurrentness::for_scope(
                    handle,
                    scope,
                    HostFiberTokenTarget::TextInstance,
                ),
            ),
        )?;

        let record = self.test_host_text_record_mut(handle)?;
        debug_assert_eq!(applied.sequence(), record.update_count());

        record.text = new_text.to_owned();
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
    consumed_root_child_replacements: Vec<RootChildReplacementExecutionIdentityForCanary>,
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
struct RootChildReplacementExecutionIdentityForCanary {
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

const TEST_HOST_SAFE_PROPERTY_PROP_NAME: &str = "testHostProperty";
const TEST_HOST_SAFE_PROPERTY_NAME: &str = "testHostProperty";
const TEST_HOST_STYLE_PROP_NAME: &str = "style";
const TEST_HOST_DANGEROUS_HTML_PROP_NAME: &str = "dangerouslySetInnerHTML";
const TEST_HOST_DANGEROUS_HTML_PROPERTY_NAME: &str = "innerHTML";
const TEST_HOST_TEXT_CONTENT_PROP_NAME: &str = "children";
const TEST_HOST_TEXT_CONTENT_PROPERTY_NAME: &str = "textContent";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostComponentPropertyPayloadKind {
    SafeTestProperty,
    Style,
    DangerousHtml,
    TextContent,
}

impl TestHostComponentPropertyPayloadKind {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::SafeTestProperty => "safe-test-property",
            Self::Style => "style",
            Self::DangerousHtml => "dangerous-html",
            Self::TextContent => "text-content",
        }
    }

    #[must_use]
    const fn is_supported_for_private_execution(self) -> bool {
        matches!(
            self,
            Self::SafeTestProperty | Self::Style | Self::DangerousHtml | Self::TextContent
        )
    }

    #[must_use]
    const fn affects_text_content(self) -> bool {
        matches!(self, Self::TextContent)
    }
}

impl Display for TestHostComponentPropertyPayloadKind {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TestHostComponentPropertyPayloadRow {
    kind: TestHostComponentPropertyPayloadKind,
    prop_name: &'static str,
    property_name: &'static str,
    old_props: PropsHandle,
    new_props: PropsHandle,
}

impl TestHostComponentPropertyPayloadRow {
    #[must_use]
    const fn safe_test_property(old_props: PropsHandle, new_props: PropsHandle) -> Self {
        Self {
            kind: TestHostComponentPropertyPayloadKind::SafeTestProperty,
            prop_name: TEST_HOST_SAFE_PROPERTY_PROP_NAME,
            property_name: TEST_HOST_SAFE_PROPERTY_NAME,
            old_props,
            new_props,
        }
    }

    #[must_use]
    const fn style(old_props: PropsHandle, new_props: PropsHandle) -> Self {
        Self {
            kind: TestHostComponentPropertyPayloadKind::Style,
            prop_name: TEST_HOST_STYLE_PROP_NAME,
            property_name: TEST_HOST_STYLE_PROP_NAME,
            old_props,
            new_props,
        }
    }

    #[must_use]
    const fn dangerous_html(old_props: PropsHandle, new_props: PropsHandle) -> Self {
        Self {
            kind: TestHostComponentPropertyPayloadKind::DangerousHtml,
            prop_name: TEST_HOST_DANGEROUS_HTML_PROP_NAME,
            property_name: TEST_HOST_DANGEROUS_HTML_PROPERTY_NAME,
            old_props,
            new_props,
        }
    }

    #[must_use]
    const fn text_content_reset(old_props: PropsHandle, new_props: PropsHandle) -> Self {
        Self {
            kind: TestHostComponentPropertyPayloadKind::TextContent,
            prop_name: TEST_HOST_TEXT_CONTENT_PROP_NAME,
            property_name: TEST_HOST_TEXT_CONTENT_PROPERTY_NAME,
            old_props,
            new_props,
        }
    }

    #[must_use]
    fn from_dangerous_html_text_reset_complete_work(
        complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    ) -> Self {
        match complete_work.payload_kind() {
            HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml => {
                Self::dangerous_html(complete_work.old_props(), complete_work.new_props())
            }
            HostComponentDangerousHtmlTextResetPayloadKindForCanary::TextContentReset => {
                Self::text_content_reset(complete_work.old_props(), complete_work.new_props())
            }
        }
    }

    #[must_use]
    const fn kind(self) -> TestHostComponentPropertyPayloadKind {
        self.kind
    }

    #[must_use]
    const fn prop_name(self) -> &'static str {
        self.prop_name
    }

    #[must_use]
    const fn property_name(self) -> &'static str {
        self.property_name
    }

    #[must_use]
    const fn old_props(self) -> PropsHandle {
        self.old_props
    }

    #[must_use]
    const fn new_props(self) -> PropsHandle {
        self.new_props
    }

    #[must_use]
    const fn public_dom_property_compatibility_claimed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostComponentPropertyPayloadViolation {
    WrongRoot,
    WrongFiber,
    WrongAlternateFiber,
    WrongStateNode,
    WrongPendingProps,
    WrongMemoizedProps,
    WrongAlternateMemoizedProps,
    WrongPayloadRowProps,
    ConflictingTextUpdate,
}

impl TestHostComponentPropertyPayloadViolation {
    #[must_use]
    const fn as_str(self) -> &'static str {
        match self {
            Self::WrongRoot => "payload root does not match the mutation root",
            Self::WrongFiber => "payload fiber does not match the mutation fiber",
            Self::WrongAlternateFiber => {
                "payload current fiber does not match the mutation alternate"
            }
            Self::WrongStateNode => "payload state node does not match the mutation state node",
            Self::WrongPendingProps => "payload new props do not match mutation pending props",
            Self::WrongMemoizedProps => "payload new props do not match mutation memoized props",
            Self::WrongAlternateMemoizedProps => {
                "payload old props do not match mutation alternate memoized props"
            }
            Self::WrongPayloadRowProps => {
                "property payload row props do not match component payload metadata"
            }
            Self::ConflictingTextUpdate => {
                "text-content property row conflicts with a HostText update payload"
            }
        }
    }
}

impl Display for TestHostComponentPropertyPayloadViolation {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct HostComponentUpdatePayload {
    root: FiberRootId,
    current: FiberId,
    work_in_progress: FiberId,
    state_node: StateNodeHandle,
    old_props: PropsHandle,
    new_props: PropsHandle,
    ty: &'static str,
    property_row: TestHostComponentPropertyPayloadRow,
}

impl HostComponentUpdatePayload {
    #[must_use]
    const fn root(&self) -> FiberRootId {
        self.root
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
    const fn old_props(&self) -> PropsHandle {
        self.old_props
    }

    #[must_use]
    const fn new_props(&self) -> PropsHandle {
        self.new_props
    }

    #[must_use]
    const fn ty(&self) -> &'static str {
        self.ty
    }

    #[must_use]
    const fn property_row(&self) -> TestHostComponentPropertyPayloadRow {
        self.property_row
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct HostTextUpdatePayload {
    current: FiberId,
    work_in_progress: FiberId,
    state_node: StateNodeHandle,
    old_text: String,
    new_text: String,
}

impl HostTextUpdatePayload {
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
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct HostTextUpdateDiff {
    current: FiberId,
    work_in_progress: FiberId,
    state_node: StateNodeHandle,
    metadata: HostNodeMetadata,
    old_text: String,
    new_text: String,
    changed: bool,
}

impl HostTextUpdateDiff {
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
    const fn metadata(&self) -> HostNodeMetadata {
        self.metadata
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
    const fn changed(&self) -> bool {
        self.changed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostRootMutationHostCall {
    AppendChild,
    AppendChildToContainer,
    InsertBefore,
    InsertInContainerBefore,
    RemoveChild,
    RemoveChildFromContainer,
    CommitUpdate,
    CommitTextUpdate,
    ResetTextContent,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostRootPrivateStoreMutation {
    HostComponentPropertyAndLatestProps,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostRootMutationApplyStatus {
    Applied(TestHostRootMutationHostCall),
    PrivateHostStoreOnly(TestHostRootPrivateStoreMutation),
    RecordedOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct TestHostRootMutationApplyRecord {
    mutation: HostRootMutationApplyRecord,
    status: TestHostRootMutationApplyStatus,
}

impl TestHostRootMutationApplyRecord {
    #[must_use]
    pub(crate) const fn mutation(self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    pub(crate) const fn status(self) -> TestHostRootMutationApplyStatus {
        self.status
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestHostRootMutationApplyResult {
    root: FiberRootId,
    finished_work: FiberId,
    records: Vec<TestHostRootMutationApplyRecord>,
}

impl TestHostRootMutationApplyResult {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[TestHostRootMutationApplyRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn applied_host_call_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| matches!(record.status(), TestHostRootMutationApplyStatus::Applied(_)))
            .count()
    }

    #[must_use]
    pub(crate) fn private_host_store_update_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                matches!(
                    record.status(),
                    TestHostRootMutationApplyStatus::PrivateHostStoreOnly(_)
                )
            })
            .count()
    }

    #[must_use]
    fn recorded_only_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                matches!(
                    record.status(),
                    TestHostRootMutationApplyStatus::RecordedOnly
                )
            })
            .count()
    }
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum TestHostRootHostUpdatePayloadForCanary {
    HostComponent {
        current: FiberId,
        work_in_progress: FiberId,
        state_node: StateNodeHandle,
        old_props: PropsHandle,
        new_props: PropsHandle,
        ty: &'static str,
        property_payload_kind: TestHostComponentPropertyPayloadKind,
        prop_name: &'static str,
        property_name: &'static str,
    },
    HostText {
        current: FiberId,
        work_in_progress: FiberId,
        state_node: StateNodeHandle,
        old_text: String,
        new_text: String,
    },
}

impl TestHostRootHostUpdatePayloadForCanary {
    #[must_use]
    fn component(payload: HostComponentUpdatePayload) -> Self {
        Self::HostComponent {
            current: payload.current(),
            work_in_progress: payload.work_in_progress(),
            state_node: payload.state_node(),
            old_props: payload.old_props(),
            new_props: payload.new_props(),
            ty: payload.ty(),
            property_payload_kind: payload.property_row().kind(),
            prop_name: payload.property_row().prop_name(),
            property_name: payload.property_row().property_name(),
        }
    }

    #[must_use]
    fn text(payload: HostTextUpdatePayload) -> Self {
        Self::HostText {
            current: payload.current(),
            work_in_progress: payload.work_in_progress(),
            state_node: payload.state_node(),
            old_text: payload.old_text().to_owned(),
            new_text: payload.new_text().to_owned(),
        }
    }

    #[must_use]
    pub(crate) const fn current(&self) -> FiberId {
        match self {
            Self::HostComponent { current, .. } | Self::HostText { current, .. } => *current,
        }
    }

    #[must_use]
    pub(crate) const fn work_in_progress(&self) -> FiberId {
        match self {
            Self::HostComponent {
                work_in_progress, ..
            }
            | Self::HostText {
                work_in_progress, ..
            } => *work_in_progress,
        }
    }

    #[must_use]
    pub(crate) const fn state_node(&self) -> StateNodeHandle {
        match self {
            Self::HostComponent { state_node, .. } | Self::HostText { state_node, .. } => {
                *state_node
            }
        }
    }

    #[must_use]
    pub(crate) const fn is_host_component_props_update(&self) -> bool {
        matches!(self, Self::HostComponent { .. })
    }

    #[must_use]
    pub(crate) const fn is_host_text_content_update(&self) -> bool {
        matches!(self, Self::HostText { .. })
    }

    #[must_use]
    pub(crate) fn host_text_old_text(&self) -> Option<&str> {
        match self {
            Self::HostText { old_text, .. } => Some(old_text),
            Self::HostComponent { .. } => None,
        }
    }

    #[must_use]
    pub(crate) fn host_text_new_text(&self) -> Option<&str> {
        match self {
            Self::HostText { new_text, .. } => Some(new_text),
            Self::HostComponent { .. } => None,
        }
    }

    #[must_use]
    pub(crate) const fn host_component_property_payload_kind(
        &self,
    ) -> Option<TestHostComponentPropertyPayloadKind> {
        match self {
            Self::HostComponent {
                property_payload_kind,
                ..
            } => Some(*property_payload_kind),
            Self::HostText { .. } => None,
        }
    }

    #[must_use]
    pub(crate) const fn host_component_prop_name(&self) -> Option<&'static str> {
        match self {
            Self::HostComponent { prop_name, .. } => Some(*prop_name),
            Self::HostText { .. } => None,
        }
    }

    #[must_use]
    pub(crate) const fn host_component_property_name(&self) -> Option<&'static str> {
        match self {
            Self::HostComponent { property_name, .. } => Some(*property_name),
            Self::HostText { .. } => None,
        }
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
pub(crate) enum TestHostRootChildReplacementExecutionBlockerForCanary {
    PublicRootRendering,
    ReactDomCompatibility,
    TestRendererCompatibility,
    NativeRendererCompatibility,
    MultiLevelReplacementCompatibility,
}

const TEST_HOST_ROOT_CHILD_REPLACEMENT_EXECUTION_BLOCKERS:
    [TestHostRootChildReplacementExecutionBlockerForCanary; 5] = [
    TestHostRootChildReplacementExecutionBlockerForCanary::PublicRootRendering,
    TestHostRootChildReplacementExecutionBlockerForCanary::ReactDomCompatibility,
    TestHostRootChildReplacementExecutionBlockerForCanary::TestRendererCompatibility,
    TestHostRootChildReplacementExecutionBlockerForCanary::NativeRendererCompatibility,
    TestHostRootChildReplacementExecutionBlockerForCanary::MultiLevelReplacementCompatibility,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct TestHostRootChildReplacementExecutionRequestForCanary {
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
    deletion_record_index: usize,
    placement_record_index: usize,
    deleted_current: FiberId,
    replacement_child: FiberId,
    deleted_tag: FiberTag,
    replacement_tag: FiberTag,
    stable_previous_sibling: Option<FiberId>,
    stable_previous_sibling_current: Option<FiberId>,
    stable_previous_sibling_tag: Option<FiberTag>,
    stable_previous_sibling_state_node: StateNodeHandle,
    placement_sibling_status: Option<HostRootPlacementSiblingStatus>,
    placement_sibling: Option<FiberId>,
    placement_sibling_tag: Option<FiberTag>,
    placement_sibling_state_node: StateNodeHandle,
    placement_skipped_pending_sibling_count: usize,
    deletion_mutation: HostRootMutationApplyRecord,
    placement_mutation: HostRootMutationApplyRecord,
    mutation_apply_record_count: usize,
    deletion_cleanup_record_count: usize,
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
    fn matches_source_handoff(
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
    const fn has_required_source_evidence(self) -> bool {
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
struct TestHostRootDeletionSubtreeHostDetachmentApplyResult {
    root: FiberRootId,
    finished_work: FiberId,
    plan: HostRootDeletionSubtreeHostDetachmentPlanForCanary,
    status: TestHostRootMutationApplyStatus,
}

impl TestHostRootDeletionSubtreeHostDetachmentApplyResult {
    #[must_use]
    const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    const fn plan(self) -> HostRootDeletionSubtreeHostDetachmentPlanForCanary {
        self.plan
    }

    #[must_use]
    const fn status(self) -> TestHostRootMutationApplyStatus {
        self.status
    }

    #[must_use]
    const fn public_unmount_compatibility_claimed(self) -> bool {
        self.plan.public_unmount_compatibility_claimed()
    }

    #[must_use]
    const fn broad_host_teardown_enabled(self) -> bool {
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

const fn managed_child_deletion_cleanup_status_matches_tag(
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

fn apply_test_host_root_deletion_cleanup(
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

fn apply_test_host_root_deletion_subtree_host_detachment_for_canary(
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

fn materialize_test_host_root_deletion_ref_passive_cleanup_execution_for_canary(
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
            let child = detached_host_child_for_apply_record(store, &*detached_hosts, mutation)?;
            host.remove_child_from_container(container, child)?;
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

fn validate_test_host_component_property_update_payload(
    store: &FiberRootStore<RecordingHost>,
    mutation: HostRootMutationApplyRecord,
    payload: &HostComponentUpdatePayload,
    detached_hosts: &DetachedHostRecords,
) -> Result<HostNodeScope, HostWorkError> {
    let row = payload.property_row();
    if payload.root() != mutation.root() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongRoot,
        ));
    }
    if payload.work_in_progress() != mutation.fiber() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongFiber,
        ));
    }
    if Some(payload.current()) != mutation.alternate_fiber() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongAlternateFiber,
        ));
    }
    if payload.state_node() != mutation.state_node() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongStateNode,
        ));
    }
    if payload.new_props() != mutation.pending_props() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongPendingProps,
        ));
    }
    if payload.new_props() != mutation.memoized_props() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongMemoizedProps,
        ));
    }
    if Some(payload.old_props()) != mutation.alternate_memoized_props() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongAlternateMemoizedProps,
        ));
    }
    if row.old_props() != payload.old_props() || row.new_props() != payload.new_props() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongPayloadRowProps,
        ));
    }

    match row.kind() {
        TestHostComponentPropertyPayloadKind::SafeTestProperty
        | TestHostComponentPropertyPayloadKind::Style
        | TestHostComponentPropertyPayloadKind::DangerousHtml => {}
        TestHostComponentPropertyPayloadKind::TextContent => {
            if host_component_payload_conflicts_with_text_update(store, payload, detached_hosts)? {
                return Err(invalid_component_property_payload(
                    mutation,
                    row,
                    TestHostComponentPropertyPayloadViolation::ConflictingTextUpdate,
                ));
            }
        }
    }

    debug_assert!(row.kind().is_supported_for_private_execution());
    let scope = detached_hosts.validated_scope(
        store.host_tokens(),
        mutation.state_node(),
        mutation.root(),
        payload.current(),
        HostFiberTokenTarget::Instance,
    )?;
    detached_hosts
        .nodes
        .instance(mutation.state_node(), scope)?;
    Ok(scope)
}

fn host_component_payload_conflicts_with_text_update(
    store: &FiberRootStore<RecordingHost>,
    payload: &HostComponentUpdatePayload,
    detached_hosts: &DetachedHostRecords,
) -> Result<bool, HostWorkError> {
    if !payload.property_row().kind().affects_text_content() {
        return Ok(false);
    }

    let mut stack = store.fiber_arena().child_ids(payload.work_in_progress())?;
    while let Some(fiber) = stack.pop() {
        let node = store.fiber_arena().get(fiber)?;
        if node.tag() == FiberTag::HostText
            && node.flags().contains_all(FiberFlags::UPDATE)
            && detached_hosts.text_updates.iter().any(|text_payload| {
                text_payload.work_in_progress() == fiber
                    && text_payload.state_node() == node.state_node()
                    && Some(text_payload.current()) == node.alternate()
            })
        {
            return Ok(true);
        }

        let children = store.fiber_arena().child_ids(fiber)?;
        stack.extend(children.iter().rev().copied());
    }

    Ok(false)
}

fn invalid_component_property_payload(
    mutation: HostRootMutationApplyRecord,
    row: TestHostComponentPropertyPayloadRow,
    violation: TestHostComponentPropertyPayloadViolation,
) -> HostWorkError {
    HostWorkError::InvalidHostComponentPropertyUpdatePayload {
        root: mutation.root(),
        fiber: mutation.fiber(),
        prop_name: row.prop_name(),
        violation,
    }
}

fn apply_test_host_component_update_record(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    mutation: HostRootMutationApplyRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationApplyStatus, HostWorkError> {
    detached_hosts.ensure_host_update_not_consumed(mutation)?;
    let Some(payload) = detached_hosts.component_update_payload(mutation) else {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    };
    let scope = validate_test_host_component_property_update_payload(
        store,
        mutation,
        &payload,
        detached_hosts,
    )?;
    if should_commit_component_property_payload_to_private_host_store_only(
        payload.property_row().kind(),
    ) {
        let commit = detached_hosts
            .nodes
            .commit_instance_property_update_to_private_store(
                mutation.state_node(),
                scope,
                host_node_property_update_for_component_payload(
                    &payload,
                    mutation.state_node(),
                    scope,
                    HostNodePropertyUpdateExecution::CommitUpdate,
                ),
            )?;
        debug_assert!(commit.private_host_store_only());
        debug_assert!(!commit.public_dom_compatibility_claimed());
        detached_hosts.mark_host_update_consumed(mutation);
        return Ok(TestHostRootMutationApplyStatus::PrivateHostStoreOnly(
            TestHostRootPrivateStoreMutation::HostComponentPropertyAndLatestProps,
        ));
    }
    let host_call = apply_test_host_component_property_payload_host_call(
        store,
        host,
        mutation,
        &payload,
        scope,
        detached_hosts,
    )?;
    detached_hosts.nodes.apply_instance_property_update(
        mutation.state_node(),
        scope,
        host_node_property_update_for_component_payload(
            &payload,
            mutation.state_node(),
            scope,
            host_node_property_update_execution_for_host_call(host_call),
        ),
    )?;
    detached_hosts.mark_host_update_consumed(mutation);
    Ok(TestHostRootMutationApplyStatus::Applied(host_call))
}

const fn should_commit_component_property_payload_to_private_host_store_only(
    kind: TestHostComponentPropertyPayloadKind,
) -> bool {
    matches!(kind, TestHostComponentPropertyPayloadKind::Style)
}

fn host_node_property_update_for_component_payload(
    payload: &HostComponentUpdatePayload,
    handle: StateNodeHandle,
    scope: HostNodeScope,
    execution: HostNodePropertyUpdateExecution,
) -> HostNodePropertyUpdate {
    HostNodePropertyUpdate::new(
        payload.property_row().prop_name(),
        payload.property_row().property_name(),
        payload.old_props(),
        payload.new_props(),
    )
    .with_payload_kind(payload.property_row().kind().as_str())
    .with_execution(execution)
    .with_currentness(HostNodeUpdateCurrentness::for_scope(
        handle,
        scope,
        HostFiberTokenTarget::Instance,
    ))
}

fn apply_test_host_component_property_payload_host_call(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    mutation: HostRootMutationApplyRecord,
    payload: &HostComponentUpdatePayload,
    scope: HostNodeScope,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationHostCall, HostWorkError> {
    match payload.property_row().kind() {
        TestHostComponentPropertyPayloadKind::SafeTestProperty
        | TestHostComponentPropertyPayloadKind::DangerousHtml => {
            let token = issue_commit_host_token(
                store,
                mutation.root(),
                mutation.fiber(),
                HostFiberTokenTarget::Instance,
            )?;
            let fake_token = FakeHostFiberToken(token.raw());
            let instance = detached_hosts
                .nodes
                .instance_mut(mutation.state_node(), scope)?;
            host.commit_update(
                HostFiberTokenRef::new(
                    &fake_token,
                    HostFiberTokenPhase::Commit,
                    HostFiberTokenTarget::Instance,
                ),
                instance,
                (),
                &payload.ty(),
                &(),
                &(),
            )?;
            Ok(TestHostRootMutationHostCall::CommitUpdate)
        }
        TestHostComponentPropertyPayloadKind::Style => {
            unreachable!("style payloads use the private host-store commit path")
        }
        TestHostComponentPropertyPayloadKind::TextContent => {
            let instance = detached_hosts
                .nodes
                .instance_mut(mutation.state_node(), scope)?;
            host.reset_text_content(instance)?;
            Ok(TestHostRootMutationHostCall::ResetTextContent)
        }
    }
}

const fn host_node_property_update_execution_for_host_call(
    host_call: TestHostRootMutationHostCall,
) -> HostNodePropertyUpdateExecution {
    match host_call {
        TestHostRootMutationHostCall::ResetTextContent => {
            HostNodePropertyUpdateExecution::ResetTextContent
        }
        TestHostRootMutationHostCall::AppendChild
        | TestHostRootMutationHostCall::AppendChildToContainer
        | TestHostRootMutationHostCall::InsertBefore
        | TestHostRootMutationHostCall::InsertInContainerBefore
        | TestHostRootMutationHostCall::RemoveChild
        | TestHostRootMutationHostCall::RemoveChildFromContainer
        | TestHostRootMutationHostCall::CommitUpdate
        | TestHostRootMutationHostCall::CommitTextUpdate => {
            HostNodePropertyUpdateExecution::CommitUpdate
        }
    }
}

fn apply_test_host_text_update_record(
    store: &FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    mutation: HostRootMutationApplyRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationApplyStatus, HostWorkError> {
    detached_hosts.ensure_host_update_not_consumed(mutation)?;
    let Some(payload) = detached_hosts.text_update_payload(mutation) else {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    };
    if payload.old_text() == payload.new_text() {
        return Err(HostWorkError::UnchangedHostTextUpdatePayload {
            root: mutation.root(),
            current: payload.current(),
            work_in_progress: payload.work_in_progress(),
            state_node: payload.state_node(),
        });
    }

    let scope = detached_hosts.validated_text_update_execution_scope(
        store.host_tokens(),
        mutation.state_node(),
        mutation.root(),
        payload.current(),
    )?;
    let old_text = payload.old_text().to_owned();
    let new_text = payload.new_text().to_owned();
    {
        let text = detached_hosts
            .nodes
            .text_mut(mutation.state_node(), scope)?;
        host.commit_text_update(text, &old_text, &new_text)?;
    }
    detached_hosts.commit_test_host_text_record(
        mutation.state_node(),
        scope,
        &old_text,
        &new_text,
    )?;
    detached_hosts.mark_host_update_consumed(mutation);
    Ok(TestHostRootMutationApplyStatus::Applied(
        TestHostRootMutationHostCall::CommitTextUpdate,
    ))
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
    let root = store.root(request.root())?;
    if root.current() != request.committed_current() {
        return Err(HostWorkError::CommitCurrentMismatch {
            root: request.root(),
            expected: request.committed_current(),
            actual: root.current(),
        });
    }

    let mutation = request.mutation();
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
    {
        let text = detached_hosts
            .nodes
            .text_mut(mutation.state_node(), scope)?;
        host.commit_text_update(text, &old_text, &new_text)?;
    }
    let update_count = detached_hosts.commit_test_host_text_record(
        mutation.state_node(),
        scope,
        &old_text,
        &new_text,
    )?;

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

    detached_hosts.validated_scope(
        store.host_tokens(),
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

    let scope = detached_hosts.validated_scope(
        store.host_tokens(),
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
            current: diff.current(),
            work_in_progress: diff.work_in_progress(),
            state_node: diff.state_node(),
            old_text: diff.old_text().to_owned(),
            new_text: diff.new_text().to_owned(),
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
mod tests {
    use super::*;
    use crate::commit_finished_host_root;
    use crate::function_component::{
        FunctionComponentEffectPhase, FunctionComponentHookRenderStore,
    };
    use crate::host_nodes::HostNodeViolation;
    use crate::passive_effects::{
        PassiveEffectDestroyCallbackErrorHandle, PassiveEffectDestroyCallbackExecutionRequest,
        PassiveEffectDestroyCallbackExecutor, PassiveEffectsFlushStatus,
        flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary,
    };
    use crate::root_commit::{
        HostRootDeletionCleanupOrderPhase, HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary,
        HostRootMutationApplyRecordSource, HostRootPlacementSiblingStatus, HostRootRefDetachReason,
        commit_completed_host_root_render_with_finished_work_handoff_for_canary,
        commit_finished_host_root_with_finished_work_handoff_for_canary,
        host_root_text_update_commit_execution_request_for_canary,
        queue_function_component_deleted_subtree_pending_passive_effects,
        record_host_root_finished_work_pending_commit_for_canary,
    };
    use crate::root_config::{PendingPassiveEffectPhase, PendingPassiveUnmountOrigin};
    use crate::test_support::{FakeContainer, FakeHostChild};
    use fast_react_core::{
        DeletionListId, DependenciesHandle, FiberTypeHandle, HookEffectCallbackHandle,
        HookEffectDependencies, RefHandle,
    };
    use fast_react_host_config::HostFiberTokenViolation;

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId) {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id)
    }

    fn render_test_root(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        element: RootElementHandle,
    ) -> HostRootRenderPhaseRecord {
        update_container(store, root_id, element, None).unwrap();
        render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap()
    }

    fn text_from_root(source: &TestHostTree, element: RootElementHandle) -> &TestHostText {
        match source.root(element).unwrap() {
            TestHostNode::Text(text) => text,
            TestHostNode::Element(_) => panic!("expected text root"),
        }
    }

    fn element_from_root(source: &TestHostTree, element: RootElementHandle) -> &TestHostElement {
        match source.root(element).unwrap() {
            TestHostNode::Element(element) => element,
            TestHostNode::Text(_) => panic!("expected host element root"),
        }
    }

    fn first_text_child(element: &TestHostElement) -> &TestHostText {
        match element.children().first().unwrap() {
            TestHostNode::Text(text) => text,
            TestHostNode::Element(_) => panic!("expected host text child"),
        }
    }

    fn callback(raw: u64) -> HookEffectCallbackHandle {
        HookEffectCallbackHandle::from_raw(raw)
    }

    fn deps(raw: u64) -> HookEffectDependencies {
        HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
    }

    fn attach_detached_root_instance_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
        element: &TestHostElement,
        flags: FiberFlags,
    ) -> FiberId {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let fiber = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            element.props(),
            mode,
        );
        let scope =
            issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::Instance)
                .unwrap();
        let token = FakeHostFiberToken(scope.token_id().raw());
        let container = *store.root(root_id).unwrap().container_info();
        let mut instance = host
            .create_instance(
                HostFiberTokenRef::new(
                    &token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::Instance,
                ),
                &element.ty(),
                &(),
                &container,
                &(),
            )
            .unwrap();
        host.finalize_initial_children(&mut instance, &element.ty(), &(), &container, &())
            .unwrap();
        let state_node = detached_hosts.insert_instance(scope, instance);
        {
            let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
            node.set_element_type(element.element_type());
            node.set_flags(flags);
            node.set_state_node(state_node);
            node.set_memoized_props(element.props());
        }
        store
            .fiber_arena_mut()
            .set_children(host_root, &[fiber])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        fiber
    }

    fn create_detached_root_text_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
        text: &str,
        flags: FiberFlags,
    ) -> FiberId {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let fiber = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(9001),
            mode,
        );
        let scope = issue_creation_host_node_scope(
            store,
            root_id,
            fiber,
            HostFiberTokenTarget::TextInstance,
        )
        .unwrap();
        let token = FakeHostFiberToken(scope.token_id().raw());
        let container = *store.root(root_id).unwrap().container_info();
        let text_instance = host
            .create_text_instance(
                HostFiberTokenRef::new(
                    &token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::TextInstance,
                ),
                text,
                &container,
                &(),
            )
            .unwrap();
        let state_node = detached_hosts.insert_text(scope, text_instance);
        {
            let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
            node.set_flags(flags);
            node.set_state_node(state_node);
            node.set_memoized_props(PropsHandle::from_raw(9001));
        }
        fiber
    }

    fn attach_detached_root_text_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
        text: &str,
        flags: FiberFlags,
    ) -> FiberId {
        let fiber = create_detached_root_text_for_commit(
            store,
            host,
            detached_hosts,
            root_id,
            host_root,
            text,
            flags,
        );
        store
            .fiber_arena_mut()
            .set_children(host_root, &[fiber])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        fiber
    }

    fn stable_root_text_work_in_progress_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        current_text: FiberId,
        next_props: PropsHandle,
    ) -> FiberId {
        let work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(current_text, next_props)
            .unwrap();
        let node = store.fiber_arena_mut().get_mut(work_in_progress).unwrap();
        node.set_flags(FiberFlags::NO);
        node.set_lanes(Lanes::NO);
        node.set_memoized_props(next_props);
        work_in_progress
    }

    fn update_root_component_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        host_root: FiberId,
        current_component: FiberId,
        next_element: &TestHostElement,
        detached_hosts: &mut DetachedHostRecords,
    ) -> HostComponentUpdatePayload {
        let payload = update_test_host_component_work(
            store,
            root_id,
            current_component,
            next_element,
            Lanes::NO,
            detached_hosts,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[payload.work_in_progress()])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        payload
    }

    fn assert_single_test_property_update(
        detached_hosts: &DetachedHostRecords,
        handle: StateNodeHandle,
        root_id: FiberRootId,
        current_component: FiberId,
        old_props: PropsHandle,
        new_props: PropsHandle,
    ) {
        assert_single_component_property_update(
            detached_hosts,
            handle,
            root_id,
            current_component,
            old_props,
            new_props,
            TestHostComponentPropertyPayloadKind::SafeTestProperty,
            TEST_HOST_SAFE_PROPERTY_PROP_NAME,
            TEST_HOST_SAFE_PROPERTY_NAME,
            HostNodePropertyUpdateExecution::CommitUpdate,
        );
    }

    #[allow(clippy::too_many_arguments)]
    fn assert_single_component_property_update(
        detached_hosts: &DetachedHostRecords,
        handle: StateNodeHandle,
        root_id: FiberRootId,
        current_component: FiberId,
        old_props: PropsHandle,
        new_props: PropsHandle,
        payload_kind: TestHostComponentPropertyPayloadKind,
        prop_name: &'static str,
        property_name: &'static str,
        execution: HostNodePropertyUpdateExecution,
    ) {
        let metadata = detached_hosts.instance_metadata(handle).unwrap();
        let updates = detached_hosts.instance_property_updates(handle).unwrap();
        assert_eq!(updates.len(), 1);
        assert_eq!(updates[0].sequence(), 0);
        assert_eq!(updates[0].store_order(), 0);
        assert_eq!(updates[0].handle(), handle);
        assert_eq!(updates[0].root_id(), root_id);
        assert_eq!(updates[0].fiber_id(), current_component);
        assert_eq!(updates[0].token_id(), metadata.token_id());
        assert_eq!(updates[0].phase(), metadata.phase());
        assert_eq!(updates[0].target(), HostFiberTokenTarget::Instance);
        assert_eq!(updates[0].source_currentness().handle(), handle);
        assert_eq!(updates[0].source_currentness().root_id(), root_id);
        assert_eq!(
            updates[0].source_currentness().fiber_id(),
            current_component
        );
        assert_eq!(
            updates[0].source_currentness().token_id(),
            metadata.token_id()
        );
        assert_eq!(updates[0].source_currentness().phase(), metadata.phase());
        assert_eq!(
            updates[0].source_currentness().target(),
            HostFiberTokenTarget::Instance
        );
        assert!(
            !updates[0]
                .source_currentness()
                .public_dom_compatibility_claimed()
        );
        assert_eq!(updates[0].payload_kind(), payload_kind.as_str());
        assert_eq!(updates[0].prop_name(), prop_name);
        assert_eq!(updates[0].property_name(), property_name);
        assert_eq!(updates[0].old_props(), old_props);
        assert_eq!(updates[0].new_props(), new_props);
        assert_eq!(updates[0].execution(), execution);
    }

    #[allow(clippy::too_many_arguments)]
    fn assert_single_latest_props_update_after_property_update(
        detached_hosts: &DetachedHostRecords,
        handle: StateNodeHandle,
        root_id: FiberRootId,
        current_component: FiberId,
        old_props: PropsHandle,
        new_props: PropsHandle,
        payload_kind: TestHostComponentPropertyPayloadKind,
        prop_name: &'static str,
    ) {
        let metadata = detached_hosts.instance_metadata(handle).unwrap();
        let property_updates = detached_hosts.instance_property_updates(handle).unwrap();
        let latest_props_updates = detached_hosts
            .instance_latest_props_updates(handle)
            .unwrap();
        assert_eq!(property_updates.len(), 1);
        assert_eq!(latest_props_updates.len(), 1);
        assert_eq!(latest_props_updates[0].sequence(), 0);
        assert_eq!(latest_props_updates[0].store_order(), 1);
        assert!(latest_props_updates[0].store_order() > property_updates[0].store_order());
        assert_eq!(latest_props_updates[0].handle(), handle);
        assert_eq!(latest_props_updates[0].root_id(), root_id);
        assert_eq!(latest_props_updates[0].fiber_id(), current_component);
        assert_eq!(latest_props_updates[0].token_id(), metadata.token_id());
        assert_eq!(latest_props_updates[0].phase(), metadata.phase());
        assert_eq!(
            latest_props_updates[0].target(),
            HostFiberTokenTarget::Instance
        );
        assert_eq!(
            latest_props_updates[0].source_currentness(),
            property_updates[0].source_currentness()
        );
        assert_eq!(
            latest_props_updates[0].source_currentness().handle(),
            handle
        );
        assert_eq!(
            latest_props_updates[0].source_currentness().root_id(),
            root_id
        );
        assert_eq!(
            latest_props_updates[0].source_currentness().fiber_id(),
            current_component
        );
        assert_eq!(
            latest_props_updates[0].source_currentness().token_id(),
            metadata.token_id()
        );
        assert_eq!(
            latest_props_updates[0].source_currentness().phase(),
            metadata.phase()
        );
        assert_eq!(
            latest_props_updates[0].source_currentness().target(),
            HostFiberTokenTarget::Instance
        );
        assert_eq!(
            latest_props_updates[0].payload_kind(),
            payload_kind.as_str()
        );
        assert_eq!(latest_props_updates[0].prop_name(), prop_name);
        assert_eq!(
            latest_props_updates[0].property_update_sequence(),
            property_updates[0].sequence()
        );
        assert_eq!(
            latest_props_updates[0].property_update_store_order(),
            property_updates[0].store_order()
        );
        assert_eq!(latest_props_updates[0].old_props(), old_props);
        assert_eq!(latest_props_updates[0].previous_latest_props(), None);
        assert_eq!(latest_props_updates[0].latest_props(), new_props);
        assert!(!latest_props_updates[0].public_dom_compatibility_claimed());
        assert_eq!(
            detached_hosts.instance_latest_props(handle).unwrap(),
            Some(new_props)
        );
    }

    struct RootComponentUpdateApplyFixture {
        store: FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        host: RecordingHost,
        detached_hosts: DetachedHostRecords,
        commit: HostRootCommitRecord,
        payload: HostComponentUpdatePayload,
        state_node: StateNodeHandle,
        operations_before_apply: Vec<&'static str>,
        token_count_before_apply: usize,
    }

    fn root_component_update_apply_fixture() -> RootComponentUpdateApplyFixture {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "ignored");
        let initial = element_from_root(&source, initial_element);
        let create_render = render_test_root(&mut store, root_id, initial_element);
        let current_component = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            initial,
            FiberFlags::PLACEMENT,
        );
        let state_node = store
            .fiber_arena()
            .get(current_component)
            .unwrap()
            .state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let next_element = source.insert_host_element_with_text("section", "updated");
        let next = element_from_root(&source, next_element);
        let update_render = render_test_root(&mut store, root_id, next_element);
        let payload = update_root_component_for_commit(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_component,
            next,
            &mut detached_hosts,
        );
        let commit = commit_finished_host_root(&mut store, update_render).unwrap();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        RootComponentUpdateApplyFixture {
            store,
            root_id,
            host,
            detached_hosts,
            commit,
            payload,
            state_node,
            operations_before_apply,
            token_count_before_apply,
        }
    }

    #[test]
    fn host_work_rejects_sequence_only_component_payload_currentness_before_recording() {
        let mut fixture = root_component_update_apply_fixture();
        let scope = fixture
            .detached_hosts
            .scope(fixture.state_node, HostFiberTokenTarget::Instance)
            .unwrap();
        let row = fixture.payload.property_row();
        let update = HostNodePropertyUpdate::new(
            row.prop_name(),
            row.property_name(),
            fixture.payload.old_props(),
            fixture.payload.new_props(),
        )
        .with_payload_kind(row.kind().as_str())
        .with_execution(HostNodePropertyUpdateExecution::CommitUpdate);

        let error = fixture
            .detached_hosts
            .nodes
            .apply_instance_property_update(fixture.state_node, scope, update)
            .unwrap_err();

        assert_eq!(error.violation(), HostNodeViolation::MissingCurrentness);
        assert_eq!(
            fixture
                .detached_hosts
                .instance_property_updates(fixture.state_node)
                .unwrap(),
            &[]
        );
    }

    #[test]
    fn host_work_rejects_sequence_only_text_payload_currentness_before_recording() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(79_200));
        let current_text = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "before",
            FiberFlags::PLACEMENT,
        );
        let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();
        let scope = detached_hosts
            .scope(state_node, HostFiberTokenTarget::TextInstance)
            .unwrap();

        let error = detached_hosts
            .nodes
            .apply_text_update(
                state_node,
                scope,
                HostNodeTextUpdate::new("before", "after"),
            )
            .unwrap_err();

        assert_eq!(error.violation(), HostNodeViolation::MissingCurrentness);
        assert_eq!(
            detached_hosts
                .test_host_text_record_updates(state_node)
                .unwrap(),
            &[]
        );
    }

    struct DangerousHtmlTextResetHandoffFixture {
        store: FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        host: RecordingHost,
        detached_hosts: DetachedHostRecords,
        render: HostRootRenderPhaseRecord,
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
        payload: HostComponentUpdatePayload,
        state_node: StateNodeHandle,
        previous_current: FiberId,
        operations_before_apply: Vec<&'static str>,
        token_count_before_apply: usize,
    }

    fn dangerous_html_text_reset_handoff_fixture(
        payload_kind: HostComponentDangerousHtmlTextResetPayloadKindForCanary,
        handoff_order: usize,
    ) -> DangerousHtmlTextResetHandoffFixture {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "ignored");
        let initial = element_from_root(&source, initial_element);
        let create_render = render_test_root(&mut store, root_id, initial_element);
        let current_component = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            initial,
            FiberFlags::PLACEMENT,
        );
        let state_node = store
            .fiber_arena()
            .get(current_component)
            .unwrap()
            .state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let next_element = source.insert_host_element_with_text("section", "updated");
        let next = element_from_root(&source, next_element);
        let render = render_test_root(&mut store, root_id, next_element);
        let payload = update_root_component_for_commit(
            &mut store,
            root_id,
            render.finished_work(),
            current_component,
            next,
            &mut detached_hosts,
        );
        let complete_work =
            host_component_dangerous_html_text_reset_complete_work_record_for_canary(
                store.fiber_arena(),
                root_id,
                payload.work_in_progress(),
                payload_kind,
            )
            .unwrap();
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
                .unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        DangerousHtmlTextResetHandoffFixture {
            store,
            root_id,
            host,
            detached_hosts,
            render,
            pending,
            complete_work,
            payload,
            state_node,
            previous_current,
            operations_before_apply,
            token_count_before_apply,
        }
    }

    fn assert_component_property_payload_error(
        error: HostWorkError,
        root_id: FiberRootId,
        fiber: FiberId,
        prop_name: &'static str,
        violation: TestHostComponentPropertyPayloadViolation,
    ) {
        match error {
            HostWorkError::InvalidHostComponentPropertyUpdatePayload {
                root,
                fiber: actual_fiber,
                prop_name: actual_prop_name,
                violation: actual_violation,
            } => {
                assert_eq!(root, root_id);
                assert_eq!(actual_fiber, fiber);
                assert_eq!(actual_prop_name, prop_name);
                assert_eq!(actual_violation, violation);
            }
            other => panic!("expected invalid component property payload, got {other:?}"),
        }
    }

    fn update_root_text_for_commit_with_payload(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        host_root: FiberId,
        current_text: FiberId,
        next_text: &TestHostText,
        detached_hosts: &mut DetachedHostRecords,
    ) -> HostTextUpdateDiff {
        let diff = update_test_host_text_work(
            store,
            root_id,
            current_text,
            next_text,
            Lanes::NO,
            detached_hosts,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[diff.work_in_progress()])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        diff
    }

    fn update_host_parent_text_for_commit_with_payload(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        host_root: FiberId,
        current_parent: FiberId,
        current_text: FiberId,
        next_text: &TestHostText,
        detached_hosts: &mut DetachedHostRecords,
    ) -> (FiberId, HostTextUpdateDiff) {
        let parent_node = store.fiber_arena().get(current_parent).unwrap();
        let parent_props = parent_node.memoized_props();
        let parent_state_node = parent_node.state_node();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        let diff = update_test_host_text_work(
            store,
            root_id,
            current_text,
            next_text,
            Lanes::NO,
            detached_hosts,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[diff.work_in_progress()])
            .unwrap();
        complete_fiber_common(
            store,
            work_parent,
            parent_props,
            parent_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[work_parent])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        (work_parent, diff)
    }

    #[allow(clippy::too_many_arguments)]
    fn update_host_parent_component_and_text_for_commit_with_payload(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        host_root: FiberId,
        current_parent: FiberId,
        current_component: FiberId,
        current_text: FiberId,
        next_component: &TestHostElement,
        next_text: &TestHostText,
        detached_hosts: &mut DetachedHostRecords,
    ) -> (FiberId, HostComponentUpdatePayload, HostTextUpdateDiff) {
        let parent_node = store.fiber_arena().get(current_parent).unwrap();
        let parent_props = parent_node.memoized_props();
        let parent_state_node = parent_node.state_node();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
            node.set_lanes(Lanes::NO);
        }

        let payload = update_test_host_component_work(
            store,
            root_id,
            current_component,
            next_component,
            Lanes::NO,
            detached_hosts,
        )
        .unwrap();
        let diff = update_test_host_text_work(
            store,
            root_id,
            current_text,
            next_text,
            Lanes::NO,
            detached_hosts,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(payload.work_in_progress(), &[diff.work_in_progress()])
            .unwrap();
        complete_fiber_common(
            store,
            payload.work_in_progress(),
            next_component.props(),
            payload.state_node(),
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[payload.work_in_progress()])
            .unwrap();
        complete_fiber_common(
            store,
            work_parent,
            parent_props,
            parent_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[work_parent])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        (work_parent, payload, diff)
    }

    fn update_root_text_for_commit_without_payload(
        store: &mut FiberRootStore<RecordingHost>,
        host_root: FiberId,
        current_text: FiberId,
        next_props: PropsHandle,
    ) -> FiberId {
        let work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(current_text, next_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_in_progress).unwrap();
            node.set_flags(FiberFlags::UPDATE);
            node.set_memoized_props(next_props);
        }
        store
            .fiber_arena_mut()
            .set_children(host_root, &[work_in_progress])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        work_in_progress
    }

    fn update_root_component_for_commit_without_payload(
        store: &mut FiberRootStore<RecordingHost>,
        host_root: FiberId,
        current_component: FiberId,
        next_props: PropsHandle,
    ) -> FiberId {
        let state_node = store
            .fiber_arena()
            .get(current_component)
            .unwrap()
            .state_node();
        let work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(current_component, next_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_in_progress).unwrap();
            node.set_flags(FiberFlags::UPDATE);
            node.set_state_node(state_node);
            node.set_memoized_props(next_props);
        }
        store
            .fiber_arena_mut()
            .set_children(host_root, &[work_in_progress])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        work_in_progress
    }

    fn attach_detached_root_element_with_text_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
        text: &str,
    ) -> (FiberId, FiberId) {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let component = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(9010),
            mode,
        );
        let text_fiber = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(9011),
            mode,
        );

        let text_scope = issue_creation_host_node_scope(
            store,
            root_id,
            text_fiber,
            HostFiberTokenTarget::TextInstance,
        )
        .unwrap();
        let text_token = FakeHostFiberToken(text_scope.token_id().raw());
        let container = *store.root(root_id).unwrap().container_info();
        let text_instance = host
            .create_text_instance(
                HostFiberTokenRef::new(
                    &text_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::TextInstance,
                ),
                text,
                &container,
                &(),
            )
            .unwrap();
        let text_state_node = detached_hosts.insert_text(text_scope, text_instance);
        complete_fiber_common(
            store,
            text_fiber,
            PropsHandle::from_raw(9011),
            text_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();

        let component_scope = issue_creation_host_node_scope(
            store,
            root_id,
            component,
            HostFiberTokenTarget::Instance,
        )
        .unwrap();
        let component_token = FakeHostFiberToken(component_scope.token_id().raw());
        let mut instance = host
            .create_instance(
                HostFiberTokenRef::new(
                    &component_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::Instance,
                ),
                &"div",
                &(),
                &container,
                &(),
            )
            .unwrap();
        detached_hosts
            .append_initial_child(
                store.host_tokens(),
                host,
                &mut instance,
                root_id,
                store.fiber_arena().get(text_fiber).unwrap(),
            )
            .unwrap();
        let component_state_node = detached_hosts.insert_instance(component_scope, instance);
        store
            .fiber_arena_mut()
            .set_children(component, &[text_fiber])
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(component).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
        }
        complete_fiber_common(
            store,
            component,
            PropsHandle::from_raw(9010),
            component_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();

        store
            .fiber_arena_mut()
            .set_children(host_root, &[component])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        (component, text_fiber)
    }

    fn attach_detached_root_element_with_two_texts_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
        first_text: &str,
        second_text: &str,
    ) -> (FiberId, FiberId, FiberId) {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let component = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(9_060),
            mode,
        );
        let first_text_fiber = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(9_061),
            mode,
        );
        let second_text_fiber = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(9_062),
            mode,
        );
        let container = *store.root(root_id).unwrap().container_info();

        let first_scope = issue_creation_host_node_scope(
            store,
            root_id,
            first_text_fiber,
            HostFiberTokenTarget::TextInstance,
        )
        .unwrap();
        let first_token = FakeHostFiberToken(first_scope.token_id().raw());
        let first_instance = host
            .create_text_instance(
                HostFiberTokenRef::new(
                    &first_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::TextInstance,
                ),
                first_text,
                &container,
                &(),
            )
            .unwrap();
        let first_state_node = detached_hosts.insert_text(first_scope, first_instance);
        complete_fiber_common(
            store,
            first_text_fiber,
            PropsHandle::from_raw(9_061),
            first_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();

        let second_scope = issue_creation_host_node_scope(
            store,
            root_id,
            second_text_fiber,
            HostFiberTokenTarget::TextInstance,
        )
        .unwrap();
        let second_token = FakeHostFiberToken(second_scope.token_id().raw());
        let second_instance = host
            .create_text_instance(
                HostFiberTokenRef::new(
                    &second_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::TextInstance,
                ),
                second_text,
                &container,
                &(),
            )
            .unwrap();
        let second_state_node = detached_hosts.insert_text(second_scope, second_instance);
        complete_fiber_common(
            store,
            second_text_fiber,
            PropsHandle::from_raw(9_062),
            second_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();

        let component_scope = issue_creation_host_node_scope(
            store,
            root_id,
            component,
            HostFiberTokenTarget::Instance,
        )
        .unwrap();
        let component_token = FakeHostFiberToken(component_scope.token_id().raw());
        let mut instance = host
            .create_instance(
                HostFiberTokenRef::new(
                    &component_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::Instance,
                ),
                &"section",
                &(),
                &container,
                &(),
            )
            .unwrap();
        detached_hosts
            .append_initial_child(
                store.host_tokens(),
                host,
                &mut instance,
                root_id,
                store.fiber_arena().get(first_text_fiber).unwrap(),
            )
            .unwrap();
        detached_hosts
            .append_initial_child(
                store.host_tokens(),
                host,
                &mut instance,
                root_id,
                store.fiber_arena().get(second_text_fiber).unwrap(),
            )
            .unwrap();
        let component_state_node = detached_hosts.insert_instance(component_scope, instance);
        store
            .fiber_arena_mut()
            .set_children(component, &[first_text_fiber, second_text_fiber])
            .unwrap();
        store
            .fiber_arena_mut()
            .get_mut(component)
            .unwrap()
            .set_flags(FiberFlags::PLACEMENT);
        complete_fiber_common(
            store,
            component,
            PropsHandle::from_raw(9_060),
            component_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[component])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        (component, first_text_fiber, second_text_fiber)
    }

    fn reorder_existing_text_before_stable_host_sibling_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host_root: FiberId,
        current_parent: FiberId,
        current_moving_text: FiberId,
        current_stable_text: FiberId,
        stable_state_node_override: Option<StateNodeHandle>,
    ) -> (FiberId, FiberId, FiberId) {
        let parent_node = store.fiber_arena().get(current_parent).unwrap();
        let parent_props = parent_node.memoized_props();
        let parent_state_node = parent_node.state_node();
        let moving_node = store.fiber_arena().get(current_moving_text).unwrap();
        let moving_props = moving_node.memoized_props();
        let moving_state_node = moving_node.state_node();
        let stable_node = store.fiber_arena().get(current_stable_text).unwrap();
        let stable_props = stable_node.memoized_props();
        let stable_state_node = stable_state_node_override.unwrap_or(stable_node.state_node());

        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
            node.set_lanes(Lanes::NO);
        }
        let moving_work = store
            .fiber_arena_mut()
            .create_work_in_progress(current_moving_text, moving_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(moving_work).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(moving_state_node);
            node.set_memoized_props(moving_props);
            node.set_lanes(Lanes::NO);
        }
        let stable_work = store
            .fiber_arena_mut()
            .create_work_in_progress(current_stable_text, stable_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(stable_work).unwrap();
            node.set_state_node(stable_state_node);
            node.set_memoized_props(stable_props);
            node.set_lanes(Lanes::NO);
        }
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[moving_work, stable_work])
            .unwrap();
        complete_fiber_common(
            store,
            moving_work,
            moving_props,
            moving_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        complete_fiber_common(
            store,
            stable_work,
            stable_props,
            stable_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        complete_fiber_common(
            store,
            work_parent,
            parent_props,
            parent_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[work_parent])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        (work_parent, moving_work, stable_work)
    }

    struct DeletedHostSubtreePassiveCleanupFixture {
        host_parent: FiberId,
        host_parent_state_node: StateNodeHandle,
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

    fn attach_detached_host_subtree_with_passive_cleanup_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
        hook_store: &mut FunctionComponentHookRenderStore,
        text: &str,
    ) -> DeletedHostSubtreePassiveCleanupFixture {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let container = *store.root(root_id).unwrap().container_info();

        let deleted_text = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(9_621),
            mode,
        );
        let deleted_text_scope = issue_creation_host_node_scope(
            store,
            root_id,
            deleted_text,
            HostFiberTokenTarget::TextInstance,
        )
        .unwrap();
        let deleted_text_token = FakeHostFiberToken(deleted_text_scope.token_id().raw());
        let deleted_text_instance = host
            .create_text_instance(
                HostFiberTokenRef::new(
                    &deleted_text_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::TextInstance,
                ),
                text,
                &container,
                &(),
            )
            .unwrap();
        let deleted_text_state_node =
            detached_hosts.insert_text(deleted_text_scope, deleted_text_instance);
        complete_fiber_common(
            store,
            deleted_text,
            PropsHandle::from_raw(9_621),
            deleted_text_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();

        let deleted_function = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(9_622),
            mode,
        );
        store
            .fiber_arena_mut()
            .get_mut(deleted_function)
            .unwrap()
            .set_fiber_type(FiberTypeHandle::from_raw(9_623));
        store
            .fiber_arena_mut()
            .set_children(deleted_function, &[deleted_text])
            .unwrap();
        let passive_create = callback(9_624);
        let passive_destroy = callback(9_625);
        let passive_dependencies = deps(9_626);
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
        complete_function_component_parent(store, deleted_function).unwrap();

        let deleted_host = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(9_627),
            mode,
        );
        let deleted_host_scope = issue_creation_host_node_scope(
            store,
            root_id,
            deleted_host,
            HostFiberTokenTarget::Instance,
        )
        .unwrap();
        let deleted_host_token = FakeHostFiberToken(deleted_host_scope.token_id().raw());
        let mut deleted_host_instance = host
            .create_instance(
                HostFiberTokenRef::new(
                    &deleted_host_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::Instance,
                ),
                &"article",
                &(),
                &container,
                &(),
            )
            .unwrap();
        detached_hosts
            .append_initial_child(
                store.host_tokens(),
                host,
                &mut deleted_host_instance,
                root_id,
                store.fiber_arena().get(deleted_text).unwrap(),
            )
            .unwrap();
        let deleted_host_state_node =
            detached_hosts.insert_instance(deleted_host_scope, deleted_host_instance);
        let deleted_host_ref = RefHandle::from_raw(9_628);
        store
            .fiber_arena_mut()
            .set_children(deleted_host, &[deleted_function])
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(deleted_host).unwrap();
            node.set_ref_handle(deleted_host_ref);
        }
        complete_fiber_common(
            store,
            deleted_host,
            PropsHandle::from_raw(9_627),
            deleted_host_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();

        let host_parent = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(9_629),
            mode,
        );
        let host_parent_scope = issue_creation_host_node_scope(
            store,
            root_id,
            host_parent,
            HostFiberTokenTarget::Instance,
        )
        .unwrap();
        let host_parent_token = FakeHostFiberToken(host_parent_scope.token_id().raw());
        let mut host_parent_instance = host
            .create_instance(
                HostFiberTokenRef::new(
                    &host_parent_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::Instance,
                ),
                &"section",
                &(),
                &container,
                &(),
            )
            .unwrap();
        detached_hosts
            .append_initial_child(
                store.host_tokens(),
                host,
                &mut host_parent_instance,
                root_id,
                store.fiber_arena().get(deleted_host).unwrap(),
            )
            .unwrap();
        let host_parent_state_node =
            detached_hosts.insert_instance(host_parent_scope, host_parent_instance);
        store
            .fiber_arena_mut()
            .set_children(host_parent, &[deleted_host])
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(host_parent).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
        }
        complete_fiber_common(
            store,
            host_parent,
            PropsHandle::from_raw(9_629),
            host_parent_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();

        store
            .fiber_arena_mut()
            .set_children(host_root, &[host_parent])
            .unwrap();
        complete_host_root(store, host_root).unwrap();

        DeletedHostSubtreePassiveCleanupFixture {
            host_parent,
            host_parent_state_node,
            deleted_host,
            deleted_host_state_node,
            deleted_host_ref,
            deleted_function,
            deleted_text,
            deleted_text_state_node,
            passive_create,
            passive_destroy,
            passive_dependencies,
        }
    }

    #[derive(Default)]
    struct RecordingDeletedSubtreeDestroyExecutor {
        calls: Vec<PassiveEffectDestroyCallbackExecutionRequest>,
    }

    impl RecordingDeletedSubtreeDestroyExecutor {
        fn calls(&self) -> &[PassiveEffectDestroyCallbackExecutionRequest] {
            &self.calls
        }
    }

    impl PassiveEffectDestroyCallbackExecutor for RecordingDeletedSubtreeDestroyExecutor {
        fn execute_destroy_callback(
            &mut self,
            request: PassiveEffectDestroyCallbackExecutionRequest,
        ) -> Result<(), PassiveEffectDestroyCallbackErrorHandle> {
            self.calls.push(request);
            Ok(())
        }
    }

    fn delete_host_text_under_host_parent_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host_root: FiberId,
        current_parent: FiberId,
        current_text: FiberId,
    ) -> FiberId {
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, PropsHandle::from_raw(9020))
            .unwrap();
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(work_parent, current_text)
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[work_parent])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        work_parent
    }

    fn delete_host_component_under_host_parent_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host_root: FiberId,
        current_parent: FiberId,
        current_component: FiberId,
    ) -> FiberId {
        let parent_props = store
            .fiber_arena()
            .get(current_parent)
            .unwrap()
            .memoized_props();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_lanes(Lanes::NO);
            node.set_memoized_props(parent_props);
        }
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(work_parent, current_component)
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[work_parent])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        work_parent
    }

    fn wrap_current_host_child_in_deleted_root(
        store: &mut FiberRootStore<RecordingHost>,
        current_parent: FiberId,
        current_child: FiberId,
        wrapper_tag: FiberTag,
        wrapper_state_node: StateNodeHandle,
    ) -> FiberId {
        let mode = store.fiber_arena().get(current_parent).unwrap().mode();
        let wrapper = store.fiber_arena_mut().create_fiber(
            wrapper_tag,
            None,
            PropsHandle::from_raw(9_080),
            mode,
        );
        {
            let node = store.fiber_arena_mut().get_mut(wrapper).unwrap();
            node.set_state_node(wrapper_state_node);
            node.set_memoized_props(PropsHandle::from_raw(9_080));
        }
        store
            .fiber_arena_mut()
            .set_children(current_parent, &[])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(wrapper, &[current_child])
            .unwrap();
        complete_host_root(store, wrapper).unwrap();
        store
            .fiber_arena_mut()
            .set_children(current_parent, &[wrapper])
            .unwrap();
        complete_host_root(store, current_parent).unwrap();
        wrapper
    }

    fn delete_non_host_root_under_host_parent_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host_root: FiberId,
        current_parent: FiberId,
        deleted_root: FiberId,
        parent_state_node_override: Option<StateNodeHandle>,
    ) -> FiberId {
        let parent_node = store.fiber_arena().get(current_parent).unwrap();
        let parent_props = parent_node.memoized_props();
        let parent_state_node = parent_state_node_override.unwrap_or(parent_node.state_node());
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_lanes(Lanes::NO);
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(work_parent, deleted_root)
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[work_parent])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        work_parent
    }

    fn place_detached_text_under_existing_host_parent_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
        current_parent: FiberId,
        text: &str,
    ) -> (FiberId, FiberId) {
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, PropsHandle::from_raw(9040))
            .unwrap();
        let mode = store.fiber_arena().get(work_parent).unwrap().mode();
        let text_fiber = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(9041),
            mode,
        );
        {
            let node = store.fiber_arena_mut().get_mut(text_fiber).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
        }

        let text_scope = issue_creation_host_node_scope(
            store,
            root_id,
            text_fiber,
            HostFiberTokenTarget::TextInstance,
        )
        .unwrap();
        let text_token = FakeHostFiberToken(text_scope.token_id().raw());
        let container = *store.root(root_id).unwrap().container_info();
        let text_instance = host
            .create_text_instance(
                HostFiberTokenRef::new(
                    &text_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::TextInstance,
                ),
                text,
                &container,
                &(),
            )
            .unwrap();
        let text_state_node = detached_hosts.insert_text(text_scope, text_instance);
        complete_fiber_common(
            store,
            text_fiber,
            PropsHandle::from_raw(9041),
            text_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();

        let parent_state_node = store.fiber_arena().get(work_parent).unwrap().state_node();
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[text_fiber])
            .unwrap();
        complete_fiber_common(
            store,
            work_parent,
            PropsHandle::from_raw(9040),
            parent_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[work_parent])
            .unwrap();
        complete_host_root(store, host_root).unwrap();

        (work_parent, text_fiber)
    }

    fn attach_detached_nested_root_element_with_text_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
        text: &str,
    ) -> (FiberId, FiberId, FiberId) {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let outer = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(9050),
            mode,
        );
        let inner = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(9051),
            mode,
        );
        let text_fiber = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(9052),
            mode,
        );

        let container = *store.root(root_id).unwrap().container_info();
        let text_scope = issue_creation_host_node_scope(
            store,
            root_id,
            text_fiber,
            HostFiberTokenTarget::TextInstance,
        )
        .unwrap();
        let text_token = FakeHostFiberToken(text_scope.token_id().raw());
        let text_instance = host
            .create_text_instance(
                HostFiberTokenRef::new(
                    &text_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::TextInstance,
                ),
                text,
                &container,
                &(),
            )
            .unwrap();
        let text_state_node = detached_hosts.insert_text(text_scope, text_instance);
        complete_fiber_common(
            store,
            text_fiber,
            PropsHandle::from_raw(9052),
            text_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();

        let inner_scope =
            issue_creation_host_node_scope(store, root_id, inner, HostFiberTokenTarget::Instance)
                .unwrap();
        let inner_token = FakeHostFiberToken(inner_scope.token_id().raw());
        let mut inner_instance = host
            .create_instance(
                HostFiberTokenRef::new(
                    &inner_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::Instance,
                ),
                &"label",
                &(),
                &container,
                &(),
            )
            .unwrap();
        detached_hosts
            .append_initial_child(
                store.host_tokens(),
                host,
                &mut inner_instance,
                root_id,
                store.fiber_arena().get(text_fiber).unwrap(),
            )
            .unwrap();
        let inner_state_node = detached_hosts.insert_instance(inner_scope, inner_instance);
        store
            .fiber_arena_mut()
            .set_children(inner, &[text_fiber])
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(inner).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
        }
        complete_fiber_common(
            store,
            inner,
            PropsHandle::from_raw(9051),
            inner_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();

        let outer_scope =
            issue_creation_host_node_scope(store, root_id, outer, HostFiberTokenTarget::Instance)
                .unwrap();
        let outer_token = FakeHostFiberToken(outer_scope.token_id().raw());
        let mut outer_instance = host
            .create_instance(
                HostFiberTokenRef::new(
                    &outer_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::Instance,
                ),
                &"section",
                &(),
                &container,
                &(),
            )
            .unwrap();
        detached_hosts
            .append_initial_child(
                store.host_tokens(),
                host,
                &mut outer_instance,
                root_id,
                store.fiber_arena().get(inner).unwrap(),
            )
            .unwrap();
        let outer_state_node = detached_hosts.insert_instance(outer_scope, outer_instance);
        store
            .fiber_arena_mut()
            .set_children(outer, &[inner])
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(outer).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
        }
        complete_fiber_common(
            store,
            outer,
            PropsHandle::from_raw(9050),
            outer_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();

        store
            .fiber_arena_mut()
            .set_children(host_root, &[outer])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        (outer, inner, text_fiber)
    }

    fn place_detached_text_under_existing_nested_host_parent_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
        current_fibers: (FiberId, FiberId, FiberId),
        text: &str,
    ) -> (FiberId, FiberId, FiberId, FiberId) {
        let (current_outer, current_inner, current_text) = current_fibers;
        let outer_props = store
            .fiber_arena()
            .get(current_outer)
            .unwrap()
            .memoized_props();
        let inner_props = store
            .fiber_arena()
            .get(current_inner)
            .unwrap()
            .memoized_props();
        let text_props = store
            .fiber_arena()
            .get(current_text)
            .unwrap()
            .memoized_props();
        let outer_state_node = store.fiber_arena().get(current_outer).unwrap().state_node();
        let inner_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
        let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();

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
            .create_work_in_progress(current_inner, inner_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_inner).unwrap();
            node.set_state_node(inner_state_node);
            node.set_memoized_props(inner_props);
            node.set_lanes(Lanes::NO);
        }
        let stable_text = store
            .fiber_arena_mut()
            .create_work_in_progress(current_text, text_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(stable_text).unwrap();
            node.set_state_node(text_state_node);
            node.set_memoized_props(text_props);
            node.set_lanes(Lanes::NO);
        }

        let mode = store.fiber_arena().get(work_inner).unwrap().mode();
        let placed_text = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(9053),
            mode,
        );
        {
            let node = store.fiber_arena_mut().get_mut(placed_text).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
        }
        let text_scope = issue_creation_host_node_scope(
            store,
            root_id,
            placed_text,
            HostFiberTokenTarget::TextInstance,
        )
        .unwrap();
        let text_token = FakeHostFiberToken(text_scope.token_id().raw());
        let container = *store.root(root_id).unwrap().container_info();
        let text_instance = host
            .create_text_instance(
                HostFiberTokenRef::new(
                    &text_token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::TextInstance,
                ),
                text,
                &container,
                &(),
            )
            .unwrap();
        let placed_text_state_node = detached_hosts.insert_text(text_scope, text_instance);
        complete_fiber_common(
            store,
            placed_text,
            PropsHandle::from_raw(9053),
            placed_text_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();

        store
            .fiber_arena_mut()
            .set_children(work_inner, &[stable_text, placed_text])
            .unwrap();
        complete_fiber_common(
            store,
            stable_text,
            text_props,
            text_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        complete_fiber_common(
            store,
            work_inner,
            inner_props,
            inner_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(work_outer, &[work_inner])
            .unwrap();
        complete_fiber_common(
            store,
            work_outer,
            outer_props,
            outer_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[work_outer])
            .unwrap();
        complete_host_root(store, host_root).unwrap();

        (work_outer, work_inner, stable_text, placed_text)
    }

    fn attach_detached_root_element_with_placed_text_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
        text: &str,
    ) -> (FiberId, FiberId) {
        let (component, text_fiber) = attach_detached_root_element_with_text_for_commit(
            store,
            host,
            detached_hosts,
            root_id,
            host_root,
            text,
        );
        store
            .fiber_arena_mut()
            .get_mut(text_fiber)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT);
        let component_state_node = store.fiber_arena().get(component).unwrap().state_node();
        complete_fiber_common(
            store,
            component,
            PropsHandle::from_raw(9010),
            component_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        complete_host_root(store, host_root).unwrap();
        (component, text_fiber)
    }

    fn create_detached_host_component_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        mode_source: FiberId,
        ty: &'static str,
        props: PropsHandle,
        flags: FiberFlags,
    ) -> FiberId {
        let mode = store.fiber_arena().get(mode_source).unwrap().mode();
        let fiber =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, props, mode);
        store
            .fiber_arena_mut()
            .get_mut(fiber)
            .unwrap()
            .set_flags(flags);

        let scope =
            issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::Instance)
                .unwrap();
        let token = FakeHostFiberToken(scope.token_id().raw());
        let container = *store.root(root_id).unwrap().container_info();
        let mut instance = host
            .create_instance(
                HostFiberTokenRef::new(
                    &token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::Instance,
                ),
                &ty,
                &(),
                &container,
                &(),
            )
            .unwrap();
        host.finalize_initial_children(&mut instance, &ty, &(), &container, &())
            .unwrap();
        let state_node = detached_hosts.insert_instance(scope, instance);
        complete_fiber_common(
            store,
            fiber,
            props,
            state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        fiber
    }

    fn place_detached_host_component_under_existing_host_parent_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
        current_parent: FiberId,
        props: PropsHandle,
    ) -> (FiberId, FiberId) {
        let parent_node = store.fiber_arena().get(current_parent).unwrap();
        let parent_props = parent_node.memoized_props();
        let parent_state_node = parent_node.state_node();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_lanes(Lanes::NO);
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }

        let child = create_detached_host_component_for_commit(
            store,
            host,
            detached_hosts,
            root_id,
            work_parent,
            "span",
            props,
            FiberFlags::PLACEMENT,
        );
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[child])
            .unwrap();
        complete_fiber_common(
            store,
            work_parent,
            parent_props,
            parent_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[work_parent])
            .unwrap();
        complete_host_root(store, host_root).unwrap();

        (work_parent, child)
    }

    fn attach_detached_root_host_component_with_child_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
    ) -> (FiberId, FiberId) {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let child_props = PropsHandle::from_raw(9_083);
        let child = create_detached_host_component_for_commit(
            store,
            host,
            detached_hosts,
            root_id,
            host_root,
            "span",
            child_props,
            FiberFlags::NO,
        );

        let parent_props = PropsHandle::from_raw(9_082);
        let parent =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
        let scope =
            issue_creation_host_node_scope(store, root_id, parent, HostFiberTokenTarget::Instance)
                .unwrap();
        let token = FakeHostFiberToken(scope.token_id().raw());
        let container = *store.root(root_id).unwrap().container_info();
        let mut instance = host
            .create_instance(
                HostFiberTokenRef::new(
                    &token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::Instance,
                ),
                &"section",
                &(),
                &container,
                &(),
            )
            .unwrap();
        detached_hosts
            .append_initial_child(
                store.host_tokens(),
                host,
                &mut instance,
                root_id,
                store.fiber_arena().get(child).unwrap(),
            )
            .unwrap();
        host.finalize_initial_children(&mut instance, &"section", &(), &container, &())
            .unwrap();
        let parent_state_node = detached_hosts.insert_instance(scope, instance);
        store
            .fiber_arena_mut()
            .set_children(parent, &[child])
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(parent).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
        }
        complete_fiber_common(
            store,
            parent,
            parent_props,
            parent_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[parent])
            .unwrap();
        complete_host_root(store, host_root).unwrap();

        (parent, child)
    }

    fn attach_detached_root_host_component_with_two_children_for_commit(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        detached_hosts: &mut DetachedHostRecords,
        root_id: FiberRootId,
        host_root: FiberId,
    ) -> (FiberId, FiberId, FiberId) {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let order_sibling_props = PropsHandle::from_raw(9_085);
        let order_sibling = create_detached_host_component_for_commit(
            store,
            host,
            detached_hosts,
            root_id,
            host_root,
            "strong",
            order_sibling_props,
            FiberFlags::NO,
        );
        let child_props = PropsHandle::from_raw(9_086);
        let child = create_detached_host_component_for_commit(
            store,
            host,
            detached_hosts,
            root_id,
            host_root,
            "span",
            child_props,
            FiberFlags::NO,
        );

        let parent_props = PropsHandle::from_raw(9_087);
        let parent =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
        let scope =
            issue_creation_host_node_scope(store, root_id, parent, HostFiberTokenTarget::Instance)
                .unwrap();
        let token = FakeHostFiberToken(scope.token_id().raw());
        let container = *store.root(root_id).unwrap().container_info();
        let mut instance = host
            .create_instance(
                HostFiberTokenRef::new(
                    &token,
                    HostFiberTokenPhase::Creation,
                    HostFiberTokenTarget::Instance,
                ),
                &"section",
                &(),
                &container,
                &(),
            )
            .unwrap();
        for child_fiber in [order_sibling, child] {
            detached_hosts
                .append_initial_child(
                    store.host_tokens(),
                    host,
                    &mut instance,
                    root_id,
                    store.fiber_arena().get(child_fiber).unwrap(),
                )
                .unwrap();
        }
        host.finalize_initial_children(&mut instance, &"section", &(), &container, &())
            .unwrap();
        let parent_state_node = detached_hosts.insert_instance(scope, instance);
        store
            .fiber_arena_mut()
            .set_children(parent, &[order_sibling, child])
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(parent).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
        }
        complete_fiber_common(
            store,
            parent,
            parent_props,
            parent_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[parent])
            .unwrap();
        complete_host_root(store, host_root).unwrap();

        (parent, order_sibling, child)
    }

    struct ManagedChildHostWorkHandoffFixture {
        store: FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        host: RecordingHost,
        detached_hosts: DetachedHostRecords,
        render: HostRootRenderPhaseRecord,
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
        current_parent: FiberId,
        work_parent: FiberId,
        child: FiberId,
        parent_state_node: StateNodeHandle,
        child_state_node: StateNodeHandle,
        previous_current: FiberId,
        operations_before_apply: Vec<&'static str>,
        token_count_before_apply: usize,
    }

    struct ManagedChildSiblingOrderHostWorkHandoffFixture {
        store: FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        host: RecordingHost,
        detached_hosts: DetachedHostRecords,
        render: HostRootRenderPhaseRecord,
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
        current_parent: FiberId,
        work_parent: FiberId,
        child: FiberId,
        order_sibling: FiberId,
        order_sibling_current: FiberId,
        parent_state_node: StateNodeHandle,
        child_state_node: StateNodeHandle,
        order_sibling_state_node: StateNodeHandle,
        previous_current: FiberId,
        deletion_list: Option<DeletionListId>,
        operations_before_apply: Vec<&'static str>,
        token_count_before_apply: usize,
    }

    fn managed_child_placement_host_work_handoff_fixture(
        handoff_order: usize,
    ) -> ManagedChildHostWorkHandoffFixture {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let parent_element = source.insert_host_element_with_text("section", "ignored");
        let parent = element_from_root(&source, parent_element);
        let create_render = render_test_root(&mut store, root_id, parent_element);
        let current_parent = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            parent,
            FiberFlags::PLACEMENT,
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let next_element = source.insert_host_element_with_text("section", "next");
        let render = render_test_root(&mut store, root_id, next_element);
        let (work_parent, child) =
            place_detached_host_component_under_existing_host_parent_for_commit(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                render.finished_work(),
                current_parent,
                PropsHandle::from_raw(9_081),
            );
        let complete_work = host_component_managed_child_complete_work_record_for_canary(
            store.fiber_arena(),
            root_id,
            work_parent,
            child,
            HostComponentManagedChildMutationKindForCanary::Placement,
        )
        .unwrap();
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
                .unwrap();
        let parent_state_node = store.fiber_arena().get(work_parent).unwrap().state_node();
        let child_state_node = store.fiber_arena().get(child).unwrap().state_node();
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        ManagedChildHostWorkHandoffFixture {
            store,
            root_id,
            host,
            detached_hosts,
            render,
            pending,
            complete_work,
            current_parent,
            work_parent,
            child,
            parent_state_node,
            child_state_node,
            previous_current,
            operations_before_apply,
            token_count_before_apply,
        }
    }

    fn managed_child_placement_sibling_order_host_work_handoff_fixture(
        handoff_order: usize,
    ) -> ManagedChildSiblingOrderHostWorkHandoffFixture {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(288));
        let (current_parent, order_sibling_current) =
            attach_detached_root_host_component_with_child_for_commit(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                create_render.finished_work(),
            );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(289));
        let parent_node = store.fiber_arena().get(current_parent).unwrap();
        let parent_props = parent_node.memoized_props();
        let parent_state_node = parent_node.state_node();
        let sibling_node = store.fiber_arena().get(order_sibling_current).unwrap();
        let order_sibling_props = sibling_node.memoized_props();
        let order_sibling_state_node = sibling_node.state_node();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_lanes(Lanes::NO);
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let child = create_detached_host_component_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            work_parent,
            "strong",
            PropsHandle::from_raw(9_084),
            FiberFlags::PLACEMENT,
        );
        let child_state_node = store.fiber_arena().get(child).unwrap().state_node();
        let order_sibling = store
            .fiber_arena_mut()
            .create_work_in_progress(order_sibling_current, order_sibling_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
            node.set_lanes(Lanes::NO);
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
        }
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[child, order_sibling])
            .unwrap();
        complete_fiber_common(
            &mut store,
            order_sibling,
            order_sibling_props,
            order_sibling_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        complete_fiber_common(
            &mut store,
            work_parent,
            parent_props,
            parent_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_parent])
            .unwrap();
        complete_host_root(&mut store, render.finished_work()).unwrap();

        let complete_work =
            host_component_managed_child_sibling_order_complete_work_record_for_canary(
                store.fiber_arena(),
                root_id,
                work_parent,
                child,
                order_sibling,
                HostComponentManagedChildMutationKindForCanary::Placement,
            )
            .unwrap();
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
                .unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        ManagedChildSiblingOrderHostWorkHandoffFixture {
            store,
            root_id,
            host,
            detached_hosts,
            render,
            pending,
            complete_work,
            current_parent,
            work_parent,
            child,
            order_sibling,
            order_sibling_current,
            parent_state_node,
            child_state_node,
            order_sibling_state_node,
            previous_current,
            deletion_list: None,
            operations_before_apply,
            token_count_before_apply,
        }
    }

    fn managed_child_delete_sibling_order_host_work_handoff_fixture(
        handoff_order: usize,
    ) -> ManagedChildSiblingOrderHostWorkHandoffFixture {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(290));
        let (current_parent, order_sibling_current, child) =
            attach_detached_root_host_component_with_two_children_for_commit(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                create_render.finished_work(),
            );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(291));
        let parent_node = store.fiber_arena().get(current_parent).unwrap();
        let parent_props = parent_node.memoized_props();
        let parent_state_node = parent_node.state_node();
        let order_sibling_node = store.fiber_arena().get(order_sibling_current).unwrap();
        let order_sibling_props = order_sibling_node.memoized_props();
        let order_sibling_state_node = order_sibling_node.state_node();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_lanes(Lanes::NO);
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let order_sibling = store
            .fiber_arena_mut()
            .create_work_in_progress(order_sibling_current, order_sibling_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
            node.set_lanes(Lanes::NO);
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
        }
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[order_sibling])
            .unwrap();
        let deletion_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(work_parent, child)
            .unwrap();
        complete_fiber_common(
            &mut store,
            order_sibling,
            order_sibling_props,
            order_sibling_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        complete_fiber_common(
            &mut store,
            work_parent,
            parent_props,
            parent_state_node,
            InitialChildrenFinalization::NoCommitMount,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_parent])
            .unwrap();
        complete_host_root(&mut store, render.finished_work()).unwrap();

        let complete_work =
            host_component_managed_child_sibling_order_complete_work_record_for_canary(
                store.fiber_arena(),
                root_id,
                work_parent,
                child,
                order_sibling,
                HostComponentManagedChildMutationKindForCanary::DeleteDetach,
            )
            .unwrap();
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
                .unwrap();
        let child_state_node = store.fiber_arena().get(child).unwrap().state_node();
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        ManagedChildSiblingOrderHostWorkHandoffFixture {
            store,
            root_id,
            host,
            detached_hosts,
            render,
            pending,
            complete_work,
            current_parent,
            work_parent,
            child,
            order_sibling,
            order_sibling_current,
            parent_state_node,
            child_state_node,
            order_sibling_state_node,
            previous_current,
            deletion_list: Some(deletion_list),
            operations_before_apply,
            token_count_before_apply,
        }
    }

    fn managed_child_delete_host_work_handoff_fixture(
        handoff_order: usize,
    ) -> ManagedChildHostWorkHandoffFixture {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(188));
        let (current_parent, child) = attach_detached_root_host_component_with_child_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(189));
        let work_parent = delete_host_component_under_host_parent_for_commit(
            &mut store,
            render.finished_work(),
            current_parent,
            child,
        );
        let complete_work = host_component_managed_child_complete_work_record_for_canary(
            store.fiber_arena(),
            root_id,
            work_parent,
            child,
            HostComponentManagedChildMutationKindForCanary::DeleteDetach,
        )
        .unwrap();
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
                .unwrap();
        let parent_state_node = store.fiber_arena().get(work_parent).unwrap().state_node();
        let child_state_node = store.fiber_arena().get(child).unwrap().state_node();
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        ManagedChildHostWorkHandoffFixture {
            store,
            root_id,
            host,
            detached_hosts,
            render,
            pending,
            complete_work,
            current_parent,
            work_parent,
            child,
            parent_state_node,
            child_state_node,
            previous_current,
            operations_before_apply,
            token_count_before_apply,
        }
    }

    #[test]
    fn host_work_mounts_one_host_element_with_text_under_host_root_wip() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("span", "hello");
        let current = store.root(root_id).unwrap().current();
        let render = render_test_root(&mut store, root_id, element);
        let work_in_progress = render.work_in_progress();

        let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();

        assert_eq!(result.root, root_id);
        assert_eq!(result.work_in_progress, work_in_progress);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.fiber_arena().get(current).unwrap().child(), None);

        let root = store.fiber_arena().get(work_in_progress).unwrap();
        let component = root.child().unwrap();
        assert_eq!(result.root_child, Some(component));
        assert_eq!(root.child_lanes(), Lanes::NO);
        assert!(root.subtree_flags().contains_all(FiberFlags::PLACEMENT));

        let component_node = store.fiber_arena().get(component).unwrap();
        let text = component_node.child().unwrap();
        assert_eq!(component_node.tag(), FiberTag::HostComponent);
        assert!(component_node.flags().contains_all(FiberFlags::PLACEMENT));
        assert_eq!(component_node.child_lanes(), Lanes::NO);
        assert_eq!(component_node.sibling(), None);
        assert!(component_node.state_node().is_some());

        let text_node = store.fiber_arena().get(text).unwrap();
        assert_eq!(text_node.tag(), FiberTag::HostText);
        assert_eq!(text_node.return_fiber(), Some(component));
        assert_eq!(text_node.sibling(), None);
        assert!(text_node.state_node().is_some());

        let instance = result
            .detached_hosts()
            .instance(component_node.state_node())
            .unwrap();
        let text_instance = result
            .detached_hosts()
            .text(text_node.state_node())
            .unwrap();
        assert_eq!(instance.ty(), "span");
        assert_eq!(text_instance.text(), "hello");
        assert_eq!(text_instance.token(), FakeHostFiberToken(1));
        assert_eq!(instance.token(), FakeHostFiberToken(2));
        assert_eq!(
            instance.children(),
            &[FakeHostChild::Text(text_instance.id())]
        );
        assert_eq!(result.detached_hosts().instance_count(), 1);
        assert_eq!(result.detached_hosts().text_count(), 1);
        assert_eq!(store.host_tokens().len(), 2);
        store.fiber_arena().validate_topology().unwrap();

        assert_eq!(
            host.operations(),
            vec![
                "root_host_context",
                "child_host_context",
                "should_set_text_content",
                "create_text_instance",
                "create_instance",
                "append_initial_child",
                "finalize_initial_children",
            ]
        );
    }

    #[test]
    fn host_work_detached_records_validate_through_host_node_store_scopes() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("article", "stored");
        let render = render_test_root(&mut store, root_id, element);

        let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();

        let component = result.root_child.unwrap();
        let component_node = store.fiber_arena().get(component).unwrap();
        let text = component_node.child().unwrap();
        let text_node = store.fiber_arena().get(text).unwrap();
        let instance_handle = component_node.state_node();
        let text_handle = text_node.state_node();
        assert_ne!(instance_handle, text_handle);

        let instance_metadata = result
            .detached_hosts()
            .instance_metadata(instance_handle)
            .unwrap();
        assert_eq!(instance_metadata.handle(), instance_handle);
        assert_eq!(instance_metadata.root_id(), root_id);
        assert_eq!(instance_metadata.fiber_id(), component);
        assert_eq!(instance_metadata.phase(), HostFiberTokenPhase::Creation);
        assert_eq!(instance_metadata.target(), HostFiberTokenTarget::Instance);
        assert!(instance_metadata.is_active());
        store
            .host_tokens()
            .validate(
                instance_metadata.token_id(),
                root_id,
                component,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            )
            .unwrap();

        let text_metadata = result.detached_hosts().text_metadata(text_handle).unwrap();
        assert_eq!(text_metadata.handle(), text_handle);
        assert_eq!(text_metadata.root_id(), root_id);
        assert_eq!(text_metadata.fiber_id(), text);
        assert_eq!(text_metadata.phase(), HostFiberTokenPhase::Creation);
        assert_eq!(text_metadata.target(), HostFiberTokenTarget::TextInstance);
        assert!(text_metadata.is_active());
        store
            .host_tokens()
            .validate(
                text_metadata.token_id(),
                root_id,
                text,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            )
            .unwrap();

        let wrong_fiber_scope = HostNodeScope::new(
            root_id,
            text,
            instance_metadata.token_id(),
            HostFiberTokenPhase::Creation,
        );
        assert_eq!(
            result
                .detached_hosts()
                .nodes
                .instance(instance_handle, wrong_fiber_scope)
                .unwrap_err()
                .violation(),
            HostNodeViolation::WrongFiber
        );

        let instance_scope = HostNodeScope::new(
            root_id,
            component,
            instance_metadata.token_id(),
            HostFiberTokenPhase::Creation,
        );
        assert_eq!(
            result
                .detached_hosts()
                .nodes
                .text(instance_handle, instance_scope)
                .unwrap_err()
                .violation(),
            HostNodeViolation::WrongTarget
        );
    }

    #[test]
    fn host_work_mounts_multiple_host_root_siblings_under_host_root_wip() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let first_element = source.insert_text("first sibling");
        let second_element = source.insert_host_element_with_text("span", "second sibling");
        let current = store.root(root_id).unwrap().current();
        let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_700));
        let work_in_progress = render.work_in_progress();

        let result = mount_test_host_sibling_work(
            &mut store,
            &mut host,
            render,
            &source,
            &[first_element, second_element],
        )
        .unwrap();

        assert_eq!(result.root, root_id);
        assert_eq!(result.work_in_progress, work_in_progress);
        assert_eq!(result.root_child_count(), 2);
        assert_eq!(result.completed_child_count(), 2);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.fiber_arena().get(current).unwrap().child(), None);

        let root = store.fiber_arena().get(work_in_progress).unwrap();
        let first = root.child().unwrap();
        let first_node = store.fiber_arena().get(first).unwrap();
        let second = first_node.sibling().unwrap();
        let second_node = store.fiber_arena().get(second).unwrap();
        let nested_text = second_node.child().unwrap();
        assert_eq!(result.root_child, Some(first));
        assert_eq!(result.completed_child, Some(first));
        assert_eq!(result.root_children(), &[first, second]);
        assert_eq!(result.completed_children(), &[first, second]);
        assert_eq!(root.child_lanes(), Lanes::NO);
        assert!(root.subtree_flags().contains_all(FiberFlags::PLACEMENT));

        assert_eq!(first_node.tag(), FiberTag::HostText);
        assert_eq!(first_node.return_fiber(), Some(work_in_progress));
        assert_eq!(first_node.sibling(), Some(second));
        assert!(first_node.flags().contains_all(FiberFlags::PLACEMENT));
        assert!(first_node.state_node().is_some());

        assert_eq!(second_node.tag(), FiberTag::HostComponent);
        assert_eq!(second_node.return_fiber(), Some(work_in_progress));
        assert_eq!(second_node.sibling(), None);
        assert!(second_node.flags().contains_all(FiberFlags::PLACEMENT));
        assert!(second_node.state_node().is_some());

        let nested_text_node = store.fiber_arena().get(nested_text).unwrap();
        assert_eq!(nested_text_node.tag(), FiberTag::HostText);
        assert_eq!(nested_text_node.return_fiber(), Some(second));
        assert_eq!(nested_text_node.sibling(), None);
        assert!(nested_text_node.state_node().is_some());

        let first_text_instance = result
            .detached_hosts()
            .text(first_node.state_node())
            .unwrap();
        let second_instance = result
            .detached_hosts()
            .instance(second_node.state_node())
            .unwrap();
        let nested_text_instance = result
            .detached_hosts()
            .text(nested_text_node.state_node())
            .unwrap();
        assert_eq!(first_text_instance.text(), "first sibling");
        assert_eq!(second_instance.ty(), "span");
        assert_eq!(nested_text_instance.text(), "second sibling");
        assert_eq!(
            second_instance.children(),
            &[FakeHostChild::Text(nested_text_instance.id())]
        );
        assert_eq!(result.detached_hosts().instance_count(), 1);
        assert_eq!(result.detached_hosts().text_count(), 2);
        assert_eq!(store.host_tokens().len(), 3);
        store.fiber_arena().validate_topology().unwrap();

        assert_eq!(
            host.operations(),
            vec![
                "root_host_context",
                "create_text_instance",
                "child_host_context",
                "should_set_text_content",
                "create_text_instance",
                "create_instance",
                "append_initial_child",
                "finalize_initial_children",
            ]
        );
    }

    #[test]
    fn host_work_multiple_sibling_handoff_rejects_non_multiple_or_existing_children() {
        let (mut single_store, single_root_id) = root_store();
        let mut single_host = RecordingHost::default();
        let mut single_source = TestHostTree::new();
        let only_child = single_source.insert_text("only");
        let single_render = render_test_root(
            &mut single_store,
            single_root_id,
            RootElementHandle::from_raw(7_710),
        );

        let single_error = mount_test_host_sibling_work(
            &mut single_store,
            &mut single_host,
            single_render,
            &single_source,
            &[only_child],
        )
        .unwrap_err();

        assert_eq!(
            single_error,
            HostWorkError::ExpectedMultipleRootChildren { count: 1 }
        );
        assert_eq!(single_host.operations(), Vec::<&'static str>::new());
        assert_eq!(
            single_store
                .fiber_arena()
                .get(single_render.work_in_progress())
                .unwrap()
                .child(),
            None
        );

        let (mut existing_store, existing_root_id) = root_store();
        let mut existing_host = RecordingHost::default();
        let mut existing_source = TestHostTree::new();
        let first = existing_source.insert_text("first");
        let second = existing_source.insert_text("second");
        let existing_render = render_test_root(
            &mut existing_store,
            existing_root_id,
            RootElementHandle::from_raw(7_720),
        );
        let existing_mode = existing_store
            .fiber_arena()
            .get(existing_render.work_in_progress())
            .unwrap()
            .mode();
        let existing_child = existing_store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(7_721),
            existing_mode,
        );
        existing_store
            .fiber_arena_mut()
            .set_children(existing_render.work_in_progress(), &[existing_child])
            .unwrap();

        let existing_error = mount_test_host_sibling_work(
            &mut existing_store,
            &mut existing_host,
            existing_render,
            &existing_source,
            &[first, second],
        )
        .unwrap_err();

        assert_eq!(
            existing_error,
            HostWorkError::UnexpectedExistingChild {
                parent: existing_render.work_in_progress(),
                child: existing_child,
            }
        );
        assert_eq!(existing_host.operations(), Vec::<&'static str>::new());
        assert_eq!(
            existing_store
                .fiber_arena()
                .get(existing_render.work_in_progress())
                .unwrap()
                .child(),
            Some(existing_child)
        );
    }

    #[test]
    fn host_work_host_text_update_records_changed_diff_through_host_node_store() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("span", "before");
        let render = render_test_root(&mut store, root_id, element);
        let mut result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();
        let component = result.root_child.unwrap();
        let current_text = store.fiber_arena().get(component).unwrap().child().unwrap();
        let current_text_node = store.fiber_arena().get(current_text).unwrap();
        let state_node = current_text_node.state_node();
        let update_element = source.insert_text("after");
        let update_text = text_from_root(&source, update_element);
        let operations_before_update = host.operations();

        let diff = update_test_host_text_work(
            &mut store,
            root_id,
            current_text,
            update_text,
            Lanes::DEFAULT,
            result.detached_hosts_mut(),
        )
        .unwrap();

        assert_eq!(diff.current(), current_text);
        assert_ne!(diff.work_in_progress(), current_text);
        assert_eq!(diff.state_node(), state_node);
        assert_eq!(diff.old_text(), "before");
        assert_eq!(diff.new_text(), "after");
        assert!(diff.changed());
        assert_eq!(diff.metadata().handle(), state_node);
        assert_eq!(diff.metadata().root_id(), root_id);
        assert_eq!(diff.metadata().fiber_id(), current_text);
        assert_eq!(diff.metadata().phase(), HostFiberTokenPhase::Creation);
        assert_eq!(diff.metadata().target(), HostFiberTokenTarget::TextInstance);

        let work_text = store.fiber_arena().get(diff.work_in_progress()).unwrap();
        assert_eq!(work_text.alternate(), Some(current_text));
        assert_eq!(work_text.state_node(), state_node);
        assert_eq!(work_text.memoized_props(), update_text.props());
        assert!(work_text.flags().contains_all(FiberFlags::UPDATE));
        assert!(!work_text.flags().contains_all(FiberFlags::PLACEMENT));
        assert_eq!(
            result.detached_hosts().text(state_node).unwrap().text(),
            "before"
        );
        assert_eq!(result.detached_hosts().text_count(), 1);
        assert_eq!(store.host_tokens().len(), 2);
        assert_eq!(host.operations(), operations_before_update);

        let wip_scope = HostNodeScope::new(
            root_id,
            diff.work_in_progress(),
            diff.metadata().token_id(),
            HostFiberTokenPhase::Creation,
        );
        assert_eq!(
            result
                .detached_hosts()
                .nodes
                .text(state_node, wip_scope)
                .unwrap_err()
                .violation(),
            HostNodeViolation::WrongFiber
        );
        store.fiber_arena().validate_topology().unwrap();
    }

    #[test]
    fn host_work_host_text_update_records_unchanged_diff_without_update_flag() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("span", "stable");
        let render = render_test_root(&mut store, root_id, element);
        let mut result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();
        let component = result.root_child.unwrap();
        let current_text = store.fiber_arena().get(component).unwrap().child().unwrap();
        let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let update_element = source.insert_text("stable");
        let update_text = text_from_root(&source, update_element);
        let operations_before_update = host.operations();

        let diff = update_test_host_text_work(
            &mut store,
            root_id,
            current_text,
            update_text,
            Lanes::DEFAULT,
            result.detached_hosts_mut(),
        )
        .unwrap();

        assert_eq!(diff.current(), current_text);
        assert_eq!(diff.state_node(), state_node);
        assert_eq!(diff.old_text(), "stable");
        assert_eq!(diff.new_text(), "stable");
        assert!(!diff.changed());
        assert_eq!(diff.metadata().fiber_id(), current_text);

        let work_text = store.fiber_arena().get(diff.work_in_progress()).unwrap();
        assert_eq!(work_text.state_node(), state_node);
        assert_eq!(work_text.memoized_props(), update_text.props());
        assert_eq!(work_text.flags(), FiberFlags::NO);
        assert_eq!(
            result.detached_hosts().text(state_node).unwrap().text(),
            "stable"
        );
        assert_eq!(result.detached_hosts().text_count(), 1);
        assert_eq!(store.host_tokens().len(), 2);
        assert_eq!(host.operations(), operations_before_update);
        store.fiber_arena().validate_topology().unwrap();
    }

    #[test]
    fn host_work_mounts_text_only_child_under_host_root_wip() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let element = source.insert_text("root text");
        let render = render_test_root(&mut store, root_id, element);

        let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();

        let root = store.fiber_arena().get(render.work_in_progress()).unwrap();
        let text = root.child().unwrap();
        let text_node = store.fiber_arena().get(text).unwrap();
        assert_eq!(text_node.tag(), FiberTag::HostText);
        assert_eq!(text_node.return_fiber(), Some(render.work_in_progress()));
        assert!(text_node.flags().contains_all(FiberFlags::PLACEMENT));
        assert_eq!(root.child_lanes(), Lanes::NO);
        assert!(root.subtree_flags().contains_all(FiberFlags::PLACEMENT));

        let text_instance = result
            .detached_hosts()
            .text(text_node.state_node())
            .unwrap();
        assert_eq!(text_instance.text(), "root text");
        assert_eq!(text_instance.token(), FakeHostFiberToken(1));
        assert_eq!(result.detached_hosts().instance_count(), 0);
        assert_eq!(result.detached_hosts().text_count(), 1);
        assert_eq!(store.host_tokens().len(), 1);
        assert_eq!(
            host.operations(),
            vec!["root_host_context", "create_text_instance"]
        );
    }

    #[test]
    fn host_work_applies_root_text_placement_record_to_test_container_only_after_commit() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(71));
        let child = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            render.finished_work(),
            "placed",
            FiberFlags::PLACEMENT,
        );
        let operations_before_commit = host.operations();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(operations_before_apply, operations_before_commit);
        assert_eq!(apply.root(), root_id);
        assert_eq!(apply.finished_work(), commit.finished_work());
        assert_eq!(apply.records().len(), 1);
        assert_eq!(apply.records()[0].mutation().fiber(), child);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer
            )
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        assert!(host.operations().ends_with(&["append_child_to_container"]));
    }

    #[test]
    fn host_work_applies_root_text_placement_before_recorded_stable_sibling() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(72));
        let current_sibling = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "stable sibling",
            FiberFlags::PLACEMENT,
        );
        let sibling_state_node = store
            .fiber_arena()
            .get(current_sibling)
            .unwrap()
            .state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(73), None).unwrap();
        let insert_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let placed = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            insert_render.finished_work(),
            "inserted before",
            FiberFlags::PLACEMENT,
        );
        let stable_sibling = stable_root_text_work_in_progress_for_commit(
            &mut store,
            current_sibling,
            PropsHandle::from_raw(9003),
        );
        store
            .fiber_arena_mut()
            .set_children(insert_render.finished_work(), &[placed, stable_sibling])
            .unwrap();
        complete_host_root(&mut store, insert_render.finished_work()).unwrap();

        let insert_commit = commit_finished_host_root(&mut store, insert_render).unwrap();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &insert_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(apply.records().len(), 1);
        assert_eq!(apply.records()[0].mutation().fiber(), placed);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
        );
        let sibling = apply.records()[0].mutation().placement_sibling().unwrap();
        assert_eq!(
            sibling.status(),
            HostRootPlacementSiblingStatus::InsertBefore
        );
        assert_eq!(sibling.sibling(), Some(stable_sibling));
        assert_eq!(sibling.sibling_tag(), Some(FiberTag::HostText));
        assert_eq!(sibling.sibling_state_node(), sibling_state_node);
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::InsertInContainerBefore
            )
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        let mut expected_operations = operations_before_apply;
        expected_operations.push("insert_in_container_before");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_applies_two_root_host_sibling_placements_in_commit_order() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let component_element = source.insert_host_element_with_text("article", "ignored");
        let component_source = element_from_root(&source, component_element);
        let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(75));
        let component = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            render.finished_work(),
            component_source,
            FiberFlags::PLACEMENT,
        );
        let component_state_node = store.fiber_arena().get(component).unwrap().state_node();
        let text = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            render.finished_work(),
            "second root child",
            FiberFlags::PLACEMENT,
        );
        let text_state_node = store.fiber_arena().get(text).unwrap().state_node();
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[component, text])
            .unwrap();
        complete_host_root(&mut store, render.finished_work()).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let diagnostics = commit.host_root_placement_apply_diagnostics_for_canary();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(diagnostics.len(), 2);
        assert_eq!(diagnostics[0].fiber(), component);
        assert_eq!(diagnostics[0].tag_name(), "HostComponent");
        assert_eq!(diagnostics[0].state_node(), component_state_node);
        assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
        assert_eq!(diagnostics[0].sibling_status(), "append");
        assert_eq!(diagnostics[0].sibling(), None);
        assert_eq!(diagnostics[0].skipped_pending_sibling_count(), 1);
        assert!(!diagnostics[0].can_insert_before());
        assert_eq!(diagnostics[1].fiber(), text);
        assert_eq!(diagnostics[1].tag_name(), "HostText");
        assert_eq!(diagnostics[1].state_node(), text_state_node);
        assert_eq!(diagnostics[1].apply_kind(), "append-placement-to-container");
        assert_eq!(diagnostics[1].sibling_status(), "append");
        assert_eq!(diagnostics[1].sibling(), None);
        assert_eq!(diagnostics[1].skipped_pending_sibling_count(), 0);
        assert!(!diagnostics[1].can_insert_before());

        assert_eq!(apply.records().len(), 2);
        assert_eq!(apply.records()[0].mutation().fiber(), component);
        assert_eq!(
            apply.records()[0].mutation().state_node(),
            component_state_node
        );
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(
            apply.records()[0]
                .mutation()
                .placement_sibling()
                .unwrap()
                .skipped_pending_sibling_count(),
            1
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer
            )
        );
        assert_eq!(apply.records()[1].mutation().fiber(), text);
        assert_eq!(apply.records()[1].mutation().state_node(), text_state_node);
        assert_eq!(
            apply.records()[1].mutation().kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(
            apply.records()[1].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer
            )
        );
        assert_eq!(apply.applied_host_call_count(), 2);
        let mut expected_operations = operations_before_apply;
        expected_operations.push("append_child_to_container");
        expected_operations.push("append_child_to_container");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_inserts_two_root_host_sibling_placements_before_stable_sibling() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let component_element = source.insert_host_element_with_text("article", "ignored");
        let component_source = element_from_root(&source, component_element);
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(76));
        let current_stable = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "stable sibling",
            FiberFlags::PLACEMENT,
        );
        let stable_state_node = store
            .fiber_arena()
            .get(current_stable)
            .unwrap()
            .state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(77), None).unwrap();
        let insert_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let component = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            insert_render.finished_work(),
            component_source,
            FiberFlags::PLACEMENT,
        );
        let component_state_node = store.fiber_arena().get(component).unwrap().state_node();
        let text = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            insert_render.finished_work(),
            "inserted text",
            FiberFlags::PLACEMENT,
        );
        let text_state_node = store.fiber_arena().get(text).unwrap().state_node();
        let stable_work = stable_root_text_work_in_progress_for_commit(
            &mut store,
            current_stable,
            PropsHandle::from_raw(9013),
        );
        store
            .fiber_arena_mut()
            .set_children(
                insert_render.finished_work(),
                &[component, text, stable_work],
            )
            .unwrap();
        complete_host_root(&mut store, insert_render.finished_work()).unwrap();

        let insert_commit = commit_finished_host_root(&mut store, insert_render).unwrap();
        let diagnostics = insert_commit.host_root_placement_apply_diagnostics_for_canary();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &insert_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(diagnostics.len(), 2);
        assert_eq!(diagnostics[0].fiber(), component);
        assert_eq!(diagnostics[0].tag_name(), "HostComponent");
        assert_eq!(
            diagnostics[0].apply_kind(),
            "insert-placement-in-container-before"
        );
        assert_eq!(diagnostics[0].sibling_status(), "insert-before");
        assert_eq!(diagnostics[0].sibling(), Some(stable_work));
        assert_eq!(diagnostics[0].sibling_tag_name(), Some("HostText"));
        assert_eq!(diagnostics[0].sibling_state_node(), stable_state_node);
        assert_eq!(diagnostics[0].skipped_pending_sibling_count(), 1);
        assert!(diagnostics[0].can_insert_before());
        assert_eq!(diagnostics[1].fiber(), text);
        assert_eq!(diagnostics[1].tag_name(), "HostText");
        assert_eq!(
            diagnostics[1].apply_kind(),
            "insert-placement-in-container-before"
        );
        assert_eq!(diagnostics[1].sibling_status(), "insert-before");
        assert_eq!(diagnostics[1].sibling(), Some(stable_work));
        assert_eq!(diagnostics[1].sibling_state_node(), stable_state_node);
        assert_eq!(diagnostics[1].skipped_pending_sibling_count(), 0);
        assert!(diagnostics[1].can_insert_before());

        assert_eq!(apply.records().len(), 2);
        assert_eq!(apply.records()[0].mutation().fiber(), component);
        assert_eq!(
            apply.records()[0].mutation().state_node(),
            component_state_node
        );
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
        );
        assert_eq!(
            apply.records()[0]
                .mutation()
                .placement_sibling()
                .unwrap()
                .skipped_pending_sibling_count(),
            1
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::InsertInContainerBefore
            )
        );
        assert_eq!(apply.records()[1].mutation().fiber(), text);
        assert_eq!(apply.records()[1].mutation().state_node(), text_state_node);
        assert_eq!(
            apply.records()[1].mutation().kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
        );
        assert_eq!(
            apply.records()[1].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::InsertInContainerBefore
            )
        );
        assert_eq!(apply.applied_host_call_count(), 2);
        let mut expected_operations = operations_before_apply;
        expected_operations.push("insert_in_container_before");
        expected_operations.push("insert_in_container_before");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_leaves_unproven_root_text_insertion_recorded_only() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(74));
        let placed = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            render.finished_work(),
            "blocked insertion",
            FiberFlags::PLACEMENT,
        );
        let mode = store
            .fiber_arena()
            .get(render.finished_work())
            .unwrap()
            .mode();
        let unproven_sibling = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(9004),
            mode,
        );
        store
            .fiber_arena_mut()
            .get_mut(unproven_sibling)
            .unwrap()
            .set_memoized_props(PropsHandle::from_raw(9004));
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[placed, unproven_sibling])
            .unwrap();
        complete_host_root(&mut store, render.finished_work()).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(apply.records().len(), 1);
        assert_eq!(apply.records()[0].mutation().fiber(), placed);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked
        );
        let sibling = apply.records()[0].mutation().placement_sibling().unwrap();
        assert_eq!(
            sibling.status(),
            HostRootPlacementSiblingStatus::BlockedMissingStateNode
        );
        assert_eq!(sibling.sibling(), Some(unproven_sibling));
        assert_eq!(sibling.sibling_tag(), Some(FiberTag::HostText));
        assert_eq!(sibling.sibling_state_node(), StateNodeHandle::NONE);
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::RecordedOnly
        );
        assert_eq!(apply.applied_host_call_count(), 0);
        assert_eq!(host.operations(), operations_before_apply);
    }

    #[test]
    fn host_work_root_replacement_executes_text_to_component_as_delete_then_place() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_text("replace me");
        let initial_render = render_test_root(&mut store, root_id, initial_element);
        let mut initial_host_work =
            mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
        let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            &initial_commit,
            &mut initial_host_work,
        )
        .unwrap();

        let current_text = initial_host_work.root_child().unwrap();
        let current_text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
        let next_element = source.insert_host_element_with_text("section", "replacement child");
        let update_render = render_test_root(&mut store, root_id, next_element);
        let mut replacement_work =
            replace_test_host_root_child_work_with_detached_hosts_for_canary(
                &mut store,
                &mut host,
                update_render,
                &source,
                detached_hosts,
            )
            .unwrap();
        let replacement_component = replacement_work.root_child().unwrap();
        let replacement_component_node = store.fiber_arena().get(replacement_component).unwrap();
        let replacement_component_state_node = replacement_component_node.state_node();
        let replacement_text = replacement_component_node.child().unwrap();
        let replacement_text_state_node = store
            .fiber_arena()
            .get(replacement_text)
            .unwrap()
            .state_node();
        let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            954_001,
            954_002,
        )
        .unwrap();
        let source_request = test_host_root_child_replacement_execution_request_for_canary(
            &store, &handoff, 954_003,
        )
        .unwrap();
        let operations_before_execute = host.operations();

        let diagnostic = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut store,
            &mut host,
            &handoff,
            source_request,
            source_request,
            &mut replacement_work,
        )
        .unwrap();

        assert_eq!(diagnostic.root(), root_id);
        assert_eq!(diagnostic.finished_work(), update_render.finished_work());
        assert_eq!(diagnostic.deleted_current(), current_text);
        assert_eq!(diagnostic.replacement_child(), replacement_component);
        assert_eq!(diagnostic.request().source_handoff_order(), 954_001);
        assert_eq!(diagnostic.request().commit_order(), 954_002);
        assert_eq!(diagnostic.request().request_order(), 954_003);
        assert_eq!(
            diagnostic.request().previous_current(),
            initial_render.finished_work()
        );
        assert_eq!(
            diagnostic.request().committed_current(),
            update_render.finished_work()
        );
        assert_eq!(diagnostic.request().remaining_lanes(), Lanes::NO);
        assert_eq!(diagnostic.request().pending_lanes(), Lanes::NO);
        assert_eq!(diagnostic.request().deleted_tag(), FiberTag::HostText);
        assert_eq!(
            diagnostic.request().replacement_tag(),
            FiberTag::HostComponent
        );
        assert_eq!(diagnostic.request().deletion_record_index(), 0);
        assert_eq!(diagnostic.request().placement_record_index(), 1);
        assert_eq!(diagnostic.request().mutation_apply_record_count(), 2);
        assert_eq!(diagnostic.request().deletion_cleanup_record_count(), 1);
        assert!(diagnostic.deletion_precedes_placement());
        assert!(diagnostic.private_test_host_replacement_executed());
        assert_eq!(
            diagnostic.deletion_mutation().source(),
            HostRootMutationApplyRecordSource::DeletionList(
                handoff.commit().deletion_lists()[0].list()
            )
        );
        assert_eq!(
            diagnostic.deletion_mutation().kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        );
        assert_eq!(
            diagnostic.deletion_mutation().parent(),
            update_render.finished_work()
        );
        assert_eq!(diagnostic.deletion_mutation().fiber(), current_text);
        assert_eq!(
            diagnostic.deletion_mutation().state_node(),
            current_text_state_node
        );
        assert_eq!(
            diagnostic.placement_mutation().source(),
            HostRootMutationApplyRecordSource::MutationPhase(
                HostRootMutationPhaseRecordKind::Placement
            )
        );
        assert_eq!(
            diagnostic.placement_mutation().kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(
            diagnostic.placement_mutation().parent(),
            update_render.finished_work()
        );
        assert_eq!(
            diagnostic.placement_mutation().fiber(),
            replacement_component
        );
        assert_eq!(
            diagnostic.placement_mutation().state_node(),
            replacement_component_state_node
        );
        assert_eq!(
            diagnostic.deletion_status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::RemoveChildFromContainer
            )
        );
        assert_eq!(
            diagnostic.placement_status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer
            )
        );
        assert_eq!(diagnostic.applied_host_call_count(), 2);
        assert_eq!(diagnostic.recorded_only_count(), 0);
        assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
        assert_eq!(
            diagnostic.blockers(),
            &TEST_HOST_ROOT_CHILD_REPLACEMENT_EXECUTION_BLOCKERS
        );
        assert!(diagnostic.public_root_rendering_blocked());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert!(!diagnostic.native_renderer_compatibility_claimed());
        assert!(!diagnostic.multi_level_replacement_compatibility_claimed());
        assert!(!source_request.public_root_compatibility_claimed());
        assert!(!source_request.public_renderer_compatibility_claimed());
        assert!(
            !replacement_work
                .detached_hosts()
                .text_metadata(current_text_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            replacement_work
                .detached_hosts()
                .instance_metadata(replacement_component_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            replacement_work
                .detached_hosts()
                .text_metadata(replacement_text_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            update_render.finished_work()
        );
        let mut expected_operations = operations_before_execute;
        expected_operations.push("remove_child_from_container");
        expected_operations.push("append_child_to_container");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_root_replacement_executes_component_to_text_with_child_before_parent_cleanup() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("article", "old child");
        let initial_render = render_test_root(&mut store, root_id, initial_element);
        let mut initial_host_work =
            mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
        let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            &initial_commit,
            &mut initial_host_work,
        )
        .unwrap();

        let current_component = initial_host_work.root_child().unwrap();
        let current_component_node = store.fiber_arena().get(current_component).unwrap();
        let current_component_state_node = current_component_node.state_node();
        let current_text = current_component_node.child().unwrap();
        let current_text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
        let next_element = source.insert_text("new root text");
        let update_render = render_test_root(&mut store, root_id, next_element);
        let mut replacement_work =
            replace_test_host_root_child_work_with_detached_hosts_for_canary(
                &mut store,
                &mut host,
                update_render,
                &source,
                detached_hosts,
            )
            .unwrap();
        let replacement_text = replacement_work.root_child().unwrap();
        let replacement_text_state_node = store
            .fiber_arena()
            .get(replacement_text)
            .unwrap()
            .state_node();
        let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            954_011,
            954_012,
        )
        .unwrap();
        let source_request = test_host_root_child_replacement_execution_request_for_canary(
            &store, &handoff, 954_013,
        )
        .unwrap();
        let operations_before_execute = host.operations();

        let diagnostic = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut store,
            &mut host,
            &handoff,
            source_request,
            source_request,
            &mut replacement_work,
        )
        .unwrap();

        assert_eq!(diagnostic.deleted_current(), current_component);
        assert_eq!(diagnostic.replacement_child(), replacement_text);
        assert_eq!(diagnostic.request().deleted_tag(), FiberTag::HostComponent);
        assert_eq!(diagnostic.request().replacement_tag(), FiberTag::HostText);
        assert_eq!(diagnostic.request().deletion_cleanup_record_count(), 2);
        assert_eq!(diagnostic.deletion_cleanup_apply_count(), 2);
        assert_eq!(diagnostic.applied_host_call_count(), 2);
        assert_eq!(
            handoff.commit().host_node_deletion_cleanup_log().records()[0].fiber(),
            current_text
        );
        assert_eq!(
            handoff.commit().host_node_deletion_cleanup_log().records()[1].fiber(),
            current_component
        );
        assert!(
            !replacement_work
                .detached_hosts()
                .text_metadata(current_text_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            !replacement_work
                .detached_hosts()
                .instance_metadata(current_component_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            replacement_work
                .detached_hosts()
                .text_metadata(replacement_text_state_node)
                .unwrap()
                .is_active()
        );
        let mut expected_operations = operations_before_execute;
        expected_operations.push("remove_child_from_container");
        expected_operations.push("append_child_to_container");
        expected_operations.push("detach_deleted_instance");
        assert_eq!(host.operations(), expected_operations);
    }

    struct RootReplacementExecutionFixture {
        store: FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        host: RecordingHost,
        update_render: HostRootRenderPhaseRecord,
        handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
        request: TestHostRootChildReplacementExecutionRequestForCanary,
        host_work: HostWorkResult,
        operations_before_execute: Vec<&'static str>,
    }

    fn root_replacement_text_to_component_execution_fixture() -> RootReplacementExecutionFixture {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_text("replace me");
        let initial_render = render_test_root(&mut store, root_id, initial_element);
        let mut initial_host_work =
            mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
        let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            &initial_commit,
            &mut initial_host_work,
        )
        .unwrap();

        let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
        let next_element = source.insert_host_element_with_text("section", "replacement child");
        let update_render = render_test_root(&mut store, root_id, next_element);
        let host_work = replace_test_host_root_child_work_with_detached_hosts_for_canary(
            &mut store,
            &mut host,
            update_render,
            &source,
            detached_hosts,
        )
        .unwrap();
        let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            954_101,
            954_102,
        )
        .unwrap();
        let request = test_host_root_child_replacement_execution_request_for_canary(
            &store, &handoff, 954_103,
        )
        .unwrap();
        let operations_before_execute = host.operations();

        RootReplacementExecutionFixture {
            store,
            root_id,
            host,
            update_render,
            handoff,
            request,
            host_work,
            operations_before_execute,
        }
    }

    fn root_replacement_component_to_text_execution_fixture()
    -> (RootReplacementExecutionFixture, StateNodeHandle) {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("article", "old child");
        let initial_render = render_test_root(&mut store, root_id, initial_element);
        let mut initial_host_work =
            mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
        let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            &initial_commit,
            &mut initial_host_work,
        )
        .unwrap();

        let current_component = initial_host_work.root_child().unwrap();
        let deleted_text = store
            .fiber_arena()
            .get(current_component)
            .unwrap()
            .child()
            .unwrap();
        let deleted_text_state_node = store.fiber_arena().get(deleted_text).unwrap().state_node();
        let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
        let next_element = source.insert_text("new root text");
        let update_render = render_test_root(&mut store, root_id, next_element);
        let host_work = replace_test_host_root_child_work_with_detached_hosts_for_canary(
            &mut store,
            &mut host,
            update_render,
            &source,
            detached_hosts,
        )
        .unwrap();
        let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            954_201,
            954_202,
        )
        .unwrap();
        let request = test_host_root_child_replacement_execution_request_for_canary(
            &store, &handoff, 954_203,
        )
        .unwrap();
        let operations_before_execute = host.operations();

        (
            RootReplacementExecutionFixture {
                store,
                root_id,
                host,
                update_render,
                handoff,
                request,
                host_work,
                operations_before_execute,
            },
            deleted_text_state_node,
        )
    }

    struct RootReplacementSiblingOrderExecutionFixture {
        store: FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        host: RecordingHost,
        update_render: HostRootRenderPhaseRecord,
        handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
        request: TestHostRootChildReplacementExecutionRequestForCanary,
        host_work: HostWorkResult,
        operations_before_execute: Vec<&'static str>,
        deleted_current: FiberId,
        deleted_state_node: StateNodeHandle,
        stable_work: FiberId,
        stable_current_state_node: StateNodeHandle,
        placement_sibling_state_node: StateNodeHandle,
        replacement_component: FiberId,
        replacement_component_state_node: StateNodeHandle,
    }

    struct RootReplacementBetweenStableSiblingsExecutionFixture {
        store: FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        host: RecordingHost,
        update_render: HostRootRenderPhaseRecord,
        handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
        request: TestHostRootChildReplacementExecutionRequestForCanary,
        host_work: HostWorkResult,
        operations_before_execute: Vec<&'static str>,
        stable_previous_work: FiberId,
        stable_previous_current: FiberId,
        stable_previous_state_node: StateNodeHandle,
        deleted_current: FiberId,
        deleted_state_node: StateNodeHandle,
        stable_trailing_work: FiberId,
        stable_trailing_state_node: StateNodeHandle,
        replacement_component: FiberId,
        replacement_component_state_node: StateNodeHandle,
    }

    fn root_replacement_text_to_component_before_stable_sibling_execution_fixture(
        cross_root_sibling_state_node: bool,
    ) -> RootReplacementSiblingOrderExecutionFixture {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let mut detached_hosts = DetachedHostRecords::default();
        let initial_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(973_001));
        let deleted_current = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            initial_render.finished_work(),
            "replace before stable sibling",
            FiberFlags::PLACEMENT,
        );
        let deleted_state_node = store
            .fiber_arena()
            .get(deleted_current)
            .unwrap()
            .state_node();
        let stable_current = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            initial_render.finished_work(),
            "stable sibling",
            FiberFlags::PLACEMENT,
        );
        let stable_current_state_node = store
            .fiber_arena()
            .get(stable_current)
            .unwrap()
            .state_node();
        store
            .fiber_arena_mut()
            .set_children(
                initial_render.finished_work(),
                &[deleted_current, stable_current],
            )
            .unwrap();
        complete_host_root(&mut store, initial_render.finished_work()).unwrap();
        let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &initial_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let next_element = source.insert_host_element_with_text("section", "replacement child");
        let update_render = render_test_root(&mut store, root_id, next_element);
        let mut host_work =
            replace_test_host_root_child_before_stable_sibling_work_with_detached_hosts_for_canary(
                &mut store,
                &mut host,
                update_render,
                &source,
                deleted_current,
                stable_current,
                detached_hosts,
            )
            .unwrap();
        let replacement_component = host_work.root_child().unwrap();
        let replacement_component_state_node = store
            .fiber_arena()
            .get(replacement_component)
            .unwrap()
            .state_node();
        let stable_work = store
            .fiber_arena()
            .get(replacement_component)
            .unwrap()
            .sibling()
            .unwrap();
        let mut placement_sibling_state_node = stable_current_state_node;

        if cross_root_sibling_state_node {
            let other_root = store
                .create_client_root(FakeContainer::new(973), RootOptions::new())
                .unwrap();
            let other_render =
                render_test_root(&mut store, other_root, RootElementHandle::from_raw(973_901));
            let other_text = create_detached_root_text_for_commit(
                &mut store,
                &mut host,
                host_work.detached_hosts_mut_for_canary(),
                other_root,
                other_render.finished_work(),
                "wrong-root stable sibling state",
                FiberFlags::PLACEMENT,
            );
            placement_sibling_state_node =
                store.fiber_arena().get(other_text).unwrap().state_node();
            store
                .fiber_arena_mut()
                .get_mut(stable_work)
                .unwrap()
                .set_state_node(placement_sibling_state_node);
            complete_host_root(&mut store, update_render.finished_work()).unwrap();
        }

        let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            973_101,
            973_102,
        )
        .unwrap();
        let request = test_host_root_child_replacement_execution_request_for_canary(
            &store, &handoff, 973_103,
        )
        .unwrap();
        let operations_before_execute = host.operations();

        RootReplacementSiblingOrderExecutionFixture {
            store,
            root_id,
            host,
            update_render,
            handoff,
            request,
            host_work,
            operations_before_execute,
            deleted_current,
            deleted_state_node,
            stable_work,
            stable_current_state_node,
            placement_sibling_state_node,
            replacement_component,
            replacement_component_state_node,
        }
    }

    fn root_replacement_text_to_component_between_stable_siblings_execution_fixture(
        cross_root_previous_sibling_state_node: bool,
    ) -> RootReplacementBetweenStableSiblingsExecutionFixture {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let mut detached_hosts = DetachedHostRecords::default();
        let initial_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(991_001));
        let stable_previous_current = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            initial_render.finished_work(),
            "stable previous sibling",
            FiberFlags::PLACEMENT,
        );
        let stable_previous_state_node = store
            .fiber_arena()
            .get(stable_previous_current)
            .unwrap()
            .state_node();
        let deleted_current = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            initial_render.finished_work(),
            "replace middle sibling",
            FiberFlags::PLACEMENT,
        );
        let deleted_state_node = store
            .fiber_arena()
            .get(deleted_current)
            .unwrap()
            .state_node();
        let stable_trailing_current = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            initial_render.finished_work(),
            "stable trailing sibling",
            FiberFlags::PLACEMENT,
        );
        let stable_trailing_state_node = store
            .fiber_arena()
            .get(stable_trailing_current)
            .unwrap()
            .state_node();
        store
            .fiber_arena_mut()
            .set_children(
                initial_render.finished_work(),
                &[
                    stable_previous_current,
                    deleted_current,
                    stable_trailing_current,
                ],
            )
            .unwrap();
        complete_host_root(&mut store, initial_render.finished_work()).unwrap();
        let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &initial_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let next_element = source.insert_host_element_with_text("section", "replacement child");
        let update_render = render_test_root(&mut store, root_id, next_element);
        let mut host_work =
            replace_test_host_root_child_between_stable_siblings_work_with_detached_hosts_for_canary(
                &mut store,
                &mut host,
                update_render,
                &source,
                stable_previous_current,
                deleted_current,
                stable_trailing_current,
                detached_hosts,
            )
            .unwrap();
        let stable_previous_work = host_work.root_children()[0];
        let replacement_component = host_work.root_children()[1];
        let stable_trailing_work = host_work.root_children()[2];
        let replacement_component_state_node = store
            .fiber_arena()
            .get(replacement_component)
            .unwrap()
            .state_node();

        if cross_root_previous_sibling_state_node {
            let other_root = store
                .create_client_root(FakeContainer::new(991), RootOptions::new())
                .unwrap();
            let other_render =
                render_test_root(&mut store, other_root, RootElementHandle::from_raw(991_901));
            let other_text = create_detached_root_text_for_commit(
                &mut store,
                &mut host,
                host_work.detached_hosts_mut_for_canary(),
                other_root,
                other_render.finished_work(),
                "wrong-root previous sibling state",
                FiberFlags::PLACEMENT,
            );
            let wrong_state_node = store.fiber_arena().get(other_text).unwrap().state_node();
            store
                .fiber_arena_mut()
                .get_mut(stable_previous_work)
                .unwrap()
                .set_state_node(wrong_state_node);
            complete_host_root(&mut store, update_render.finished_work()).unwrap();
        }

        let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            991_101,
            991_102,
        )
        .unwrap();
        let request = test_host_root_child_replacement_execution_request_for_canary(
            &store, &handoff, 991_103,
        )
        .unwrap();
        let operations_before_execute = host.operations();

        RootReplacementBetweenStableSiblingsExecutionFixture {
            store,
            root_id,
            host,
            update_render,
            handoff,
            request,
            host_work,
            operations_before_execute,
            stable_previous_work,
            stable_previous_current,
            stable_previous_state_node,
            deleted_current,
            deleted_state_node,
            stable_trailing_work,
            stable_trailing_state_node,
            replacement_component,
            replacement_component_state_node,
        }
    }

    #[test]
    fn host_work_root_replacement_inserts_component_before_stable_sibling() {
        let mut fixture =
            root_replacement_text_to_component_before_stable_sibling_execution_fixture(false);
        let operations_before_execute = fixture.operations_before_execute.clone();

        let diagnostic = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap();

        assert_eq!(diagnostic.root(), fixture.root_id);
        assert_eq!(
            diagnostic.finished_work(),
            fixture.update_render.finished_work()
        );
        assert_eq!(diagnostic.deleted_current(), fixture.deleted_current);
        assert_eq!(
            diagnostic.replacement_child(),
            fixture.replacement_component
        );
        assert_eq!(
            diagnostic.request().placement_sibling_status(),
            Some(HostRootPlacementSiblingStatus::InsertBefore)
        );
        assert_eq!(
            diagnostic.request().placement_sibling(),
            Some(fixture.stable_work)
        );
        assert_eq!(
            diagnostic.request().placement_sibling_tag(),
            Some(FiberTag::HostText)
        );
        assert_eq!(
            diagnostic.request().placement_sibling_state_node(),
            fixture.placement_sibling_state_node
        );
        assert_eq!(
            diagnostic
                .request()
                .placement_skipped_pending_sibling_count(),
            0
        );
        assert!(
            diagnostic
                .request()
                .stable_sibling_insert_before_order_required()
        );
        assert_eq!(
            diagnostic.placement_mutation().kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
        );
        let sibling = diagnostic.placement_mutation().placement_sibling().unwrap();
        assert_eq!(
            sibling.status(),
            HostRootPlacementSiblingStatus::InsertBefore
        );
        assert_eq!(sibling.sibling(), Some(fixture.stable_work));
        assert_eq!(
            sibling.sibling_state_node(),
            fixture.placement_sibling_state_node
        );
        assert!(sibling.can_insert_before());
        assert_eq!(
            diagnostic.deletion_status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::RemoveChildFromContainer
            )
        );
        assert_eq!(
            diagnostic.placement_status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::InsertInContainerBefore
            )
        );
        assert!(diagnostic.private_test_host_replacement_executed());
        assert_eq!(diagnostic.applied_host_call_count(), 2);
        assert_eq!(diagnostic.recorded_only_count(), 0);
        assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
        assert!(
            !fixture
                .host_work
                .detached_hosts()
                .text_metadata(fixture.deleted_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .host_work
                .detached_hosts()
                .text_metadata(fixture.stable_current_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .host_work
                .detached_hosts()
                .instance_metadata(fixture.replacement_component_state_node)
                .unwrap()
                .is_active()
        );
        let mut expected_operations = operations_before_execute;
        expected_operations.push("remove_child_from_container");
        expected_operations.push("insert_in_container_before");
        assert_eq!(fixture.host.operations(), expected_operations);
    }

    #[test]
    fn host_work_root_replacement_rejects_tampered_sibling_order_evidence_before_host_call() {
        let mut fixture =
            root_replacement_text_to_component_before_stable_sibling_execution_fixture(false);
        let mut tampered_request = fixture.request;
        tampered_request.placement_sibling_state_node = StateNodeHandle::NONE;

        let error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            tampered_request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root,
                commit_order: 973_102,
                request_order: 973_103,
            } if root == fixture.root_id
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
    }

    #[test]
    fn host_work_root_replacement_rejects_stale_stable_sibling_before_host_call() {
        let mut fixture =
            root_replacement_text_to_component_before_stable_sibling_execution_fixture(false);
        fixture
            .host_work
            .detached_hosts_mut_for_canary()
            .invalidate_text_for_canary(fixture.placement_sibling_state_node)
            .unwrap();

        let error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
                HostWorkError::HostNode(ref error)
            ) if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_execute);

        let retry_error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            retry_error,
            TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
                HostWorkError::HostNode(ref error)
            ) if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
    }

    #[test]
    fn host_work_root_replacement_rejects_cross_root_stable_sibling_before_host_call() {
        let mut fixture =
            root_replacement_text_to_component_before_stable_sibling_execution_fixture(true);

        let error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
                HostWorkError::HostNode(ref error)
            ) if error.violation() == HostNodeViolation::WrongRoot
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
    }

    #[test]
    fn host_work_root_replacement_rejects_sibling_order_replay_before_second_host_call() {
        let mut fixture =
            root_replacement_text_to_component_before_stable_sibling_execution_fixture(false);

        execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap();
        let operations_after_first_execute = fixture.host.operations();

        let error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::DuplicateExecution {
                root,
                finished_work,
                request_order: 973_103,
            } if root == fixture.root_id && finished_work == fixture.update_render.finished_work()
        ));
        assert_eq!(fixture.host.operations(), operations_after_first_execute);
    }

    #[test]
    fn host_work_root_replacement_replaces_middle_child_between_stable_siblings() {
        let mut fixture =
            root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);
        let operations_before_execute = fixture.operations_before_execute.clone();

        let diagnostic = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap();

        assert_eq!(diagnostic.root(), fixture.root_id);
        assert_eq!(
            diagnostic.finished_work(),
            fixture.update_render.finished_work()
        );
        assert_eq!(diagnostic.deleted_current(), fixture.deleted_current);
        assert_eq!(
            diagnostic.replacement_child(),
            fixture.replacement_component
        );
        assert_eq!(
            diagnostic.request().stable_previous_sibling(),
            Some(fixture.stable_previous_work)
        );
        assert_eq!(
            diagnostic.request().stable_previous_sibling_current(),
            Some(fixture.stable_previous_current)
        );
        assert_eq!(
            diagnostic.request().stable_previous_sibling_tag(),
            Some(FiberTag::HostText)
        );
        assert_eq!(
            diagnostic.request().stable_previous_sibling_state_node(),
            fixture.stable_previous_state_node
        );
        assert_eq!(
            diagnostic.request().placement_sibling_status(),
            Some(HostRootPlacementSiblingStatus::InsertBefore)
        );
        assert_eq!(
            diagnostic.request().placement_sibling(),
            Some(fixture.stable_trailing_work)
        );
        assert_eq!(
            diagnostic.request().placement_sibling_state_node(),
            fixture.stable_trailing_state_node
        );
        assert_eq!(
            diagnostic.placement_mutation().kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
        );
        assert_eq!(
            diagnostic.deletion_status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::RemoveChildFromContainer
            )
        );
        assert_eq!(
            diagnostic.placement_status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::InsertInContainerBefore
            )
        );
        assert!(diagnostic.private_test_host_replacement_executed());
        assert_eq!(diagnostic.applied_host_call_count(), 2);
        assert_eq!(diagnostic.recorded_only_count(), 0);
        assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
        assert!(!diagnostic.request().public_root_compatibility_claimed());
        assert!(!diagnostic.request().public_renderer_compatibility_claimed());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert!(!diagnostic.native_renderer_compatibility_claimed());
        assert!(
            fixture
                .host_work
                .detached_hosts()
                .text_metadata(fixture.stable_previous_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            !fixture
                .host_work
                .detached_hosts()
                .text_metadata(fixture.deleted_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .host_work
                .detached_hosts()
                .text_metadata(fixture.stable_trailing_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .host_work
                .detached_hosts()
                .instance_metadata(fixture.replacement_component_state_node)
                .unwrap()
                .is_active()
        );
        let mut expected_operations = operations_before_execute;
        expected_operations.push("remove_child_from_container");
        expected_operations.push("insert_in_container_before");
        assert_eq!(fixture.host.operations(), expected_operations);
    }

    #[test]
    fn host_work_root_replacement_rejects_tampered_previous_sibling_evidence_before_host_call() {
        let mut fixture =
            root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);
        let mut tampered_request = fixture.request;
        tampered_request.stable_previous_sibling_state_node = StateNodeHandle::NONE;

        let error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            tampered_request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root,
                commit_order: 991_102,
                request_order: 991_103,
            } if root == fixture.root_id
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
    }

    #[test]
    fn host_work_root_replacement_rejects_middle_child_replay_before_second_host_call() {
        let mut fixture =
            root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);

        execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap();
        let operations_after_first_execute = fixture.host.operations();

        let error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::DuplicateExecution {
                root,
                finished_work,
                request_order: 991_103,
            } if root == fixture.root_id && finished_work == fixture.update_render.finished_work()
        ));
        assert_eq!(fixture.host.operations(), operations_after_first_execute);
    }

    #[test]
    fn host_work_root_replacement_rejects_stale_previous_sibling_before_host_call() {
        let mut fixture =
            root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);
        fixture
            .host_work
            .detached_hosts_mut_for_canary()
            .invalidate_text_for_canary(fixture.stable_previous_state_node)
            .unwrap();

        let error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
                HostWorkError::HostNode(ref error)
            ) if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_execute);

        let retry_error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            retry_error,
            TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
                HostWorkError::HostNode(ref error)
            ) if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
    }

    #[test]
    fn host_work_root_replacement_rejects_cross_root_previous_sibling_before_host_call() {
        let mut fixture =
            root_replacement_text_to_component_between_stable_siblings_execution_fixture(true);

        let error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
                HostWorkError::HostNode(ref error)
            ) if error.violation() == HostNodeViolation::WrongRoot
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
    }

    #[test]
    fn host_work_root_replacement_rejects_stale_deleted_middle_child_before_host_call() {
        let mut fixture =
            root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);
        fixture
            .host_work
            .detached_hosts_mut_for_canary()
            .invalidate_text_for_canary(fixture.deleted_state_node)
            .unwrap();

        let error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
                HostWorkError::HostNode(ref error)
            ) if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
    }

    #[test]
    fn host_work_root_replacement_rejects_caller_records_or_missing_cleanup() {
        let mut caller_record_fixture =
            root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);
        let mut caller_shaped_request = caller_record_fixture.request;
        caller_shaped_request.deletion_mutation = caller_shaped_request.placement_mutation;

        let caller_record_error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut caller_record_fixture.store,
            &mut caller_record_fixture.host,
            &caller_record_fixture.handoff,
            caller_shaped_request,
            caller_shaped_request,
            &mut caller_record_fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            caller_record_error,
            TestHostRootChildReplacementExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root,
                commit_order: 991_102,
                request_order: 991_103,
            } if root == caller_record_fixture.root_id
        ));
        assert_eq!(
            caller_record_fixture.host.operations(),
            caller_record_fixture.operations_before_execute
        );

        let mut cleanup_fixture =
            root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);
        let mut missing_cleanup_request = cleanup_fixture.request;
        missing_cleanup_request.deletion_cleanup_record_count = 0;

        let missing_cleanup_error =
            execute_test_host_root_child_replacement_after_commit_for_canary(
                &mut cleanup_fixture.store,
                &mut cleanup_fixture.host,
                &cleanup_fixture.handoff,
                missing_cleanup_request,
                missing_cleanup_request,
                &mut cleanup_fixture.host_work,
            )
            .unwrap_err();

        assert!(matches!(
            missing_cleanup_error,
            TestHostRootChildReplacementExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root,
                commit_order: 991_102,
                request_order: 991_103,
            } if root == cleanup_fixture.root_id
        ));
        assert_eq!(
            cleanup_fixture.host.operations(),
            cleanup_fixture.operations_before_execute
        );
    }

    #[test]
    fn host_work_root_replacement_rejects_duplicate_execution_before_second_host_call() {
        let mut fixture = root_replacement_text_to_component_execution_fixture();

        execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap();
        let operations_after_first_execute = fixture.host.operations();

        let error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::DuplicateExecution {
                root,
                finished_work,
                request_order: 954_103,
            } if root == fixture.root_id && finished_work == fixture.update_render.finished_work()
        ));
        assert_eq!(fixture.host.operations(), operations_after_first_execute);
    }

    #[test]
    fn host_work_root_replacement_preflights_stale_deleted_descendant_cleanup_before_host_call() {
        let (mut fixture, deleted_text_state_node) =
            root_replacement_component_to_text_execution_fixture();
        fixture
            .host_work
            .detached_hosts_mut_for_canary()
            .invalidate_text_for_canary(deleted_text_state_node)
            .unwrap();

        let error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
                HostWorkError::HostNode(ref error)
            ) if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_execute);

        let retry_error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            fixture.request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            retry_error,
            TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
                HostWorkError::HostNode(ref error)
            ) if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
    }

    #[test]
    fn host_work_root_replacement_request_rejects_same_tag_root_delete_and_place() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let initial_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(954_301));
        let current_text = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            initial_render.finished_work(),
            "same-tag old text",
            FiberFlags::PLACEMENT,
        );
        let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &initial_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let update_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(954_302));
        let replacement_text = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            update_render.finished_work(),
            "same-tag replacement text",
            FiberFlags::PLACEMENT,
        );
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(update_render.finished_work(), current_text)
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(update_render.finished_work(), &[replacement_text])
            .unwrap();
        complete_host_root(&mut store, update_render.finished_work()).unwrap();

        let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            954_303,
            954_304,
        )
        .unwrap();
        let records = handoff.commit().mutation_apply_log().records();
        assert_eq!(records.len(), 2);
        assert_eq!(
            records[0].kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        );
        assert_eq!(
            records[1].kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(records[0].tag(), FiberTag::HostText);
        assert_eq!(records[1].tag(), FiberTag::HostText);

        let error = test_host_root_child_replacement_execution_request_for_canary(
            &store, &handoff, 954_305,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::SameTagReplacement {
                root,
                finished_work,
                tag: FiberTag::HostText,
            } if root == root_id && finished_work == update_render.finished_work()
        ));
    }

    #[test]
    fn host_work_root_replacement_request_rejects_unsupported_multi_level_host_placement() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let initial_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(954_311));
        let current_text = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            initial_render.finished_work(),
            "deleted root text",
            FiberFlags::PLACEMENT,
        );
        let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &initial_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let update_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(954_312));
        let mode = store
            .fiber_arena()
            .get(update_render.finished_work())
            .unwrap()
            .mode();
        let function_component = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(954_313),
            mode,
        );
        store
            .fiber_arena_mut()
            .get_mut(function_component)
            .unwrap()
            .set_fiber_type(FiberTypeHandle::from_raw(954_314));
        let nested_text = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            update_render.finished_work(),
            "nested replacement",
            FiberFlags::PLACEMENT,
        );
        store
            .fiber_arena_mut()
            .set_children(function_component, &[nested_text])
            .unwrap();
        complete_function_component_parent(&mut store, function_component).unwrap();
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(update_render.finished_work(), current_text)
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(update_render.finished_work(), &[function_component])
            .unwrap();
        complete_host_root(&mut store, update_render.finished_work()).unwrap();

        let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            954_315,
            954_316,
        )
        .unwrap();
        let records = handoff.commit().mutation_apply_log().records();
        assert_eq!(records.len(), 2);
        assert_eq!(
            records[0].kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        );
        assert_eq!(
            records[1].kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(records[1].fiber(), nested_text);
        assert_eq!(records[1].parent(), update_render.finished_work());
        assert_eq!(records[1].parent_tag(), FiberTag::HostRoot);
        assert_eq!(
            store
                .fiber_arena()
                .get(update_render.finished_work())
                .unwrap()
                .child(),
            Some(function_component)
        );

        let error = test_host_root_child_replacement_execution_request_for_canary(
            &store, &handoff, 954_317,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::UnsupportedReplacementEvidence {
                root,
                finished_work,
            } if root == root_id && finished_work == update_render.finished_work()
        ));
    }

    #[test]
    fn host_work_root_replacement_rejects_cloned_or_tampered_request_before_host_call() {
        let mut fixture = root_replacement_text_to_component_execution_fixture();
        let mut cloned_request = fixture.request;
        cloned_request.source_handoff_order += 1;

        let error = execute_test_host_root_child_replacement_after_commit_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.handoff,
            fixture.request,
            cloned_request,
            &mut fixture.host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootChildReplacementExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root,
                commit_order: 954_102,
                request_order: 954_103,
            } if root == fixture.root_id
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
    }

    #[test]
    fn host_work_root_replacement_rejects_stale_current_child_before_creating_replacement() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_text("stale root text");
        let initial_render = render_test_root(&mut store, root_id, initial_element);
        let mut initial_host_work =
            mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
        let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            &initial_commit,
            &mut initial_host_work,
        )
        .unwrap();
        let current_text = initial_host_work.root_child().unwrap();
        let current_text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        initial_host_work
            .detached_hosts_mut_for_canary()
            .invalidate_text_for_canary(current_text_state_node)
            .unwrap();
        let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
        let next_element = source.insert_host_element_with_text("section", "replacement");
        let update_render = render_test_root(&mut store, root_id, next_element);
        let operations_before_replace = host.operations();

        let error = replace_test_host_root_child_work_with_detached_hosts_for_canary(
            &mut store,
            &mut host,
            update_render,
            &source,
            detached_hosts,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostWorkError::HostNode(ref error) if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(host.operations(), operations_before_replace);
    }

    #[test]
    fn host_work_root_replacement_rejects_cross_root_detached_hosts_before_host_call() {
        let (mut store, first_root) = root_store();
        let second_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();

        let first_element = source.insert_text("first root text");
        let first_render = render_test_root(&mut store, first_root, first_element);
        let mut first_host_work =
            mount_test_host_work(&mut store, &mut host, first_render, &source).unwrap();
        let first_commit = commit_finished_host_root(&mut store, first_render).unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            &first_commit,
            &mut first_host_work,
        )
        .unwrap();

        let second_element = source.insert_text("second root text");
        let second_render = render_test_root(&mut store, second_root, second_element);
        let mut second_host_work =
            mount_test_host_work(&mut store, &mut host, second_render, &source).unwrap();
        let second_commit = commit_finished_host_root(&mut store, second_render).unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            &second_commit,
            &mut second_host_work,
        )
        .unwrap();

        let wrong_detached_hosts = first_host_work.into_detached_hosts_for_canary();
        let next_element = source.insert_host_element_with_text("section", "wrong root");
        let update_render = render_test_root(&mut store, second_root, next_element);
        let operations_before_replace = host.operations();

        let error = replace_test_host_root_child_work_with_detached_hosts_for_canary(
            &mut store,
            &mut host,
            update_render,
            &source,
            wrong_detached_hosts,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostWorkError::HostNode(ref error) if error.violation() == HostNodeViolation::WrongRoot
        ));
        assert_eq!(host.operations(), operations_before_replace);
    }

    #[test]
    fn host_work_root_replacement_rejects_same_tag_multi_level_replacement_claim() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("article", "old nested text");
        let initial_render = render_test_root(&mut store, root_id, initial_element);
        let mut initial_host_work =
            mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
        let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            &initial_commit,
            &mut initial_host_work,
        )
        .unwrap();

        let current_component = initial_host_work.root_child().unwrap();
        let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
        let next_element = source.insert_host_element_with_text("article", "new nested text");
        let update_render = render_test_root(&mut store, root_id, next_element);
        let operations_before_replace = host.operations();

        let error = replace_test_host_root_child_work_with_detached_hosts_for_canary(
            &mut store,
            &mut host,
            update_render,
            &source,
            detached_hosts,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostWorkError::ExpectedRootChildReplacement {
                root: root_id,
                current: initial_render.finished_work(),
                current_child: current_component,
                current_tag: FiberTag::HostComponent,
                next_tag: FiberTag::HostComponent,
            }
        );
        assert_eq!(host.operations(), operations_before_replace);
    }

    #[test]
    fn host_work_applies_root_text_deletion_record_to_test_container_without_cleanup() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(72));
        let child = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "deleted",
            FiberFlags::PLACEMENT,
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        update_container(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        let delete_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(delete_render.finished_work(), child)
            .unwrap();
        let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(apply.records().len(), 1);
        assert_eq!(apply.records()[0].mutation().fiber(), child);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::RemoveChildFromContainer
            )
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        assert_eq!(
            detached_hosts
                .text(store.fiber_arena().get(child).unwrap().state_node())
                .unwrap()
                .text(),
            "deleted"
        );
        assert!(
            host.operations()
                .ends_with(&["append_child_to_container", "remove_child_from_container"])
        );
    }

    #[test]
    fn host_work_applies_host_parent_text_placement_record_to_fake_host_config() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "ignored");
        let initial = element_from_root(&source, initial_element);
        let create_render = render_test_root(&mut store, root_id, initial_element);
        let current_parent = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            initial,
            FiberFlags::PLACEMENT,
        );
        let parent_state_node = store
            .fiber_arena()
            .get(current_parent)
            .unwrap()
            .state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(78), None).unwrap();
        let placement_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (work_parent, placed_text) = place_detached_text_under_existing_host_parent_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            placement_render.finished_work(),
            current_parent,
            "placed child",
        );
        let text_state_node = store.fiber_arena().get(placed_text).unwrap().state_node();
        let placement_commit = commit_finished_host_root(&mut store, placement_render).unwrap();
        assert_eq!(
            placement_commit.test_only_host_parent_placement_apply_count_for_canary(),
            1
        );
        assert!(
            placement_commit.has_test_only_host_parent_placement_apply_for_canary(
                parent_state_node.raw(),
                text_state_node.raw()
            )
        );
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &placement_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(apply.records().len(), 1);
        assert_eq!(apply.records()[0].mutation().parent(), work_parent);
        assert_eq!(
            apply.records()[0].mutation().parent_state_node(),
            parent_state_node
        );
        assert_eq!(apply.records()[0].mutation().fiber(), placed_text);
        assert_eq!(apply.records()[0].mutation().state_node(), text_state_node);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToHostParent
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        assert_eq!(
            detached_hosts.text(text_state_node).unwrap().text(),
            "placed child"
        );
        let mut expected_operations = operations_before_apply;
        expected_operations.push("append_child");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_applies_nested_host_parent_text_placement_record_to_fake_host_config() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(82));
        let (current_outer, current_inner, current_text) =
            attach_detached_nested_root_element_with_text_for_commit(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                create_render.finished_work(),
                "stable",
            );
        let inner_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
        let outer_state_node = store.fiber_arena().get(current_outer).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(83), None).unwrap();
        let placement_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (_work_outer, work_inner, stable_text, placed_text) =
            place_detached_text_under_existing_nested_host_parent_for_commit(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                placement_render.finished_work(),
                (current_outer, current_inner, current_text),
                "nested placed",
            );
        let text_state_node = store.fiber_arena().get(placed_text).unwrap().state_node();
        let placement_commit = commit_finished_host_root(&mut store, placement_render).unwrap();
        let diagnostics = placement_commit.host_parent_placement_apply_diagnostics_for_canary();

        assert_eq!(
            placement_commit.test_only_host_parent_placement_apply_count_for_canary(),
            1
        );
        assert!(
            placement_commit.has_test_only_host_parent_placement_apply_for_canary(
                inner_state_node.raw(),
                text_state_node.raw()
            )
        );
        assert!(
            !placement_commit.has_test_only_host_parent_placement_apply_for_canary(
                outer_state_node.raw(),
                text_state_node.raw()
            )
        );
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].parent(), work_inner);
        assert_eq!(diagnostics[0].parent_state_node(), inner_state_node);
        assert_eq!(diagnostics[0].fiber(), placed_text);
        assert_eq!(diagnostics[0].state_node(), text_state_node);
        assert!(diagnostics[0].applies_to_host_parent());
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &placement_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(apply.records().len(), 1);
        assert_eq!(apply.records()[0].mutation().parent(), work_inner);
        assert_eq!(
            apply.records()[0].mutation().parent_state_node(),
            inner_state_node
        );
        assert_eq!(apply.records()[0].mutation().fiber(), placed_text);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToHostParent
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        assert_eq!(
            detached_hosts.text(text_state_node).unwrap().text(),
            "nested placed"
        );
        assert_eq!(
            store.fiber_arena().get(work_inner).unwrap().child(),
            Some(stable_text)
        );
        assert_eq!(
            store.fiber_arena().get(stable_text).unwrap().sibling(),
            Some(placed_text)
        );
        let mut expected_operations = operations_before_apply;
        expected_operations.push("append_child");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_reorders_host_parent_text_before_stable_sibling_with_insert_before() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(96));
        let (current_parent, current_stable_text, current_moving_text) =
            attach_detached_root_element_with_two_texts_for_commit(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                create_render.finished_work(),
                "stable",
                "moving",
            );
        let parent_state_node = store
            .fiber_arena()
            .get(current_parent)
            .unwrap()
            .state_node();
        let stable_state_node = store
            .fiber_arena()
            .get(current_stable_text)
            .unwrap()
            .state_node();
        let moving_state_node = store
            .fiber_arena()
            .get(current_moving_text)
            .unwrap()
            .state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(97), None).unwrap();
        let reorder_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (work_parent, moving_work, stable_work) =
            reorder_existing_text_before_stable_host_sibling_for_commit(
                &mut store,
                reorder_render.finished_work(),
                current_parent,
                current_moving_text,
                current_stable_text,
                None,
            );
        let reorder_commit = commit_finished_host_root(&mut store, reorder_render).unwrap();
        let diagnostics = reorder_commit.host_parent_placement_apply_diagnostics_for_canary();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &reorder_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(reorder_commit.mutation_apply_log().records().len(), 1);
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].parent(), work_parent);
        assert_eq!(diagnostics[0].parent_state_node(), parent_state_node);
        assert_eq!(diagnostics[0].fiber(), moving_work);
        assert_eq!(diagnostics[0].state_node(), moving_state_node);
        assert_eq!(
            diagnostics[0].apply_kind(),
            "insert-placement-in-host-parent-before"
        );
        assert_eq!(diagnostics[0].sibling_status(), "insert-before");
        assert_eq!(diagnostics[0].sibling(), Some(stable_work));
        assert_eq!(diagnostics[0].sibling_tag_name(), Some("HostText"));
        assert_eq!(diagnostics[0].sibling_state_node(), stable_state_node);
        assert!(diagnostics[0].can_insert_before());
        assert!(diagnostics[0].applies_to_host_parent());

        assert_eq!(apply.records().len(), 1);
        assert_eq!(apply.records()[0].mutation().parent(), work_parent);
        assert_eq!(apply.records()[0].mutation().fiber(), moving_work);
        assert_eq!(
            apply.records()[0].mutation().alternate_fiber(),
            Some(current_moving_text)
        );
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
        );
        let sibling = apply.records()[0].mutation().placement_sibling().unwrap();
        assert_eq!(
            sibling.status(),
            HostRootPlacementSiblingStatus::InsertBefore
        );
        assert_eq!(sibling.sibling(), Some(stable_work));
        assert_eq!(sibling.sibling_state_node(), stable_state_node);
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::InsertBefore)
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        assert_eq!(
            detached_hosts.text(moving_state_node).unwrap().text(),
            "moving"
        );
        assert_eq!(
            detached_hosts.text(stable_state_node).unwrap().text(),
            "stable"
        );
        assert_eq!(
            detached_hosts
                .text_metadata(moving_state_node)
                .unwrap()
                .fiber_id(),
            current_moving_text
        );
        assert_eq!(
            detached_hosts
                .text_metadata(stable_state_node)
                .unwrap()
                .fiber_id(),
            current_stable_text
        );
        let mut expected_operations = operations_before_apply;
        expected_operations.push("insert_before");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_rejects_host_parent_reorder_with_wrong_sibling_handle_before_mutation() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(98));
        let (current_parent, current_stable_text, current_moving_text) =
            attach_detached_root_element_with_two_texts_for_commit(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                create_render.finished_work(),
                "stable",
                "moving",
            );
        let parent_state_node = store
            .fiber_arena()
            .get(current_parent)
            .unwrap()
            .state_node();
        let moving_state_node = store
            .fiber_arena()
            .get(current_moving_text)
            .unwrap()
            .state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(99), None).unwrap();
        let reorder_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (work_parent, moving_work, stable_work) =
            reorder_existing_text_before_stable_host_sibling_for_commit(
                &mut store,
                reorder_render.finished_work(),
                current_parent,
                current_moving_text,
                current_stable_text,
                Some(parent_state_node),
            );
        let reorder_commit = commit_finished_host_root(&mut store, reorder_render).unwrap();
        let operations_before_apply = host.operations();

        let error = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &reorder_commit,
            &mut detached_hosts,
        )
        .unwrap_err();

        let mutation = reorder_commit.mutation_apply_log().records()[0];
        assert_eq!(mutation.parent(), work_parent);
        assert_eq!(mutation.fiber(), moving_work);
        assert_eq!(mutation.state_node(), moving_state_node);
        assert_eq!(
            mutation.kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
        );
        let sibling = mutation.placement_sibling().unwrap();
        assert_eq!(
            sibling.status(),
            HostRootPlacementSiblingStatus::InsertBefore
        );
        assert_eq!(sibling.sibling(), Some(stable_work));
        assert_eq!(sibling.sibling_state_node(), parent_state_node);
        assert_eq!(host.operations(), operations_before_apply);
        match error {
            HostWorkError::HostNode(error) => {
                assert_eq!(error.violation(), HostNodeViolation::WrongTarget);
            }
            other => panic!("expected wrong-target host node validation, got {other:?}"),
        }
    }

    #[test]
    fn host_work_leaves_child_placement_under_new_host_parent_recorded_only() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(79));
        let (parent, text) = attach_detached_root_element_with_placed_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "nested",
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(apply.records().len(), 2);
        assert_eq!(apply.records()[0].mutation().fiber(), parent);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer
            )
        );
        assert_eq!(apply.records()[1].mutation().parent(), parent);
        assert_eq!(apply.records()[1].mutation().fiber(), text);
        assert_eq!(
            apply.records()[1].mutation().kind(),
            HostRootMutationApplyRecordKind::SkipUnsupportedNestedPlacement
        );
        assert_eq!(
            apply.records()[1].status(),
            TestHostRootMutationApplyStatus::RecordedOnly
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        let mut expected_operations = operations_before_apply;
        expected_operations.push("append_child_to_container");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_applies_root_host_component_update_payload_to_fake_host_config() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "ignored");
        let initial = element_from_root(&source, initial_element);
        let initial_props = initial.props();
        let create_render = render_test_root(&mut store, root_id, initial_element);
        let current_component = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            initial,
            FiberFlags::PLACEMENT,
        );
        let state_node = store
            .fiber_arena()
            .get(current_component)
            .unwrap()
            .state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let next_element = source.insert_host_element_with_text("section", "updated");
        let next = element_from_root(&source, next_element);
        let update_render = render_test_root(&mut store, root_id, next_element);
        let payload = update_root_component_for_commit(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_component,
            next,
            &mut detached_hosts,
        );
        let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &update_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(payload.root(), root_id);
        assert_eq!(payload.current(), current_component);
        assert_eq!(payload.state_node(), state_node);
        assert_eq!(payload.old_props(), initial_props);
        assert_eq!(payload.new_props(), next.props());
        assert_eq!(payload.ty(), "section");
        assert_eq!(
            payload.property_row().kind(),
            TestHostComponentPropertyPayloadKind::SafeTestProperty
        );
        assert_eq!(
            payload.property_row().prop_name(),
            TEST_HOST_SAFE_PROPERTY_PROP_NAME
        );
        assert!(
            !payload
                .property_row()
                .public_dom_property_compatibility_claimed()
        );
        assert_eq!(apply.records().len(), 1);
        assert_eq!(
            apply.records()[0].mutation().fiber(),
            payload.work_in_progress()
        );
        assert_eq!(
            apply.records()[0].mutation().alternate_fiber(),
            Some(current_component)
        );
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        assert_eq!(store.host_tokens().len(), token_count_before_apply + 1);
        assert_eq!(detached_hosts.instance(state_node).unwrap().ty(), "section");
        assert_single_test_property_update(
            &detached_hosts,
            state_node,
            root_id,
            current_component,
            initial_props,
            next.props(),
        );
        let mut expected_operations = operations_before_apply;
        expected_operations.push("commit_update");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_host_component_update_rejects_replayed_commit_record_before_second_host_call() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "ignored");
        let initial = element_from_root(&source, initial_element);
        let create_render = render_test_root(&mut store, root_id, initial_element);
        let current_component = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            initial,
            FiberFlags::PLACEMENT,
        );
        let state_node = store
            .fiber_arena()
            .get(current_component)
            .unwrap()
            .state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let next_element = source.insert_host_element_with_text("section", "updated");
        let next = element_from_root(&source, next_element);
        let update_render = render_test_root(&mut store, root_id, next_element);
        let payload = update_root_component_for_commit(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_component,
            next,
            &mut detached_hosts,
        );
        let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
        let first_apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &update_commit,
            &mut detached_hosts,
        )
        .unwrap();
        assert_eq!(first_apply.applied_host_call_count(), 1);
        assert_eq!(
            first_apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
        );
        let operations_after_first_apply = host.operations();
        let token_count_after_first_apply = store.host_tokens().len();

        let error = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &update_commit,
            &mut detached_hosts,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostWorkError::ConsumedHostUpdatePayload {
                root,
                fiber,
                state_node: consumed_state_node,
                kind,
            } if root == root_id
                && fiber == payload.work_in_progress()
                && consumed_state_node == state_node
                && kind == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        ));
        assert_eq!(host.operations(), operations_after_first_apply);
        assert_eq!(store.host_tokens().len(), token_count_after_first_apply);
    }

    #[test]
    fn host_work_finished_work_handoff_applies_one_host_component_update_to_test_host_commit_path()
    {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "ignored");
        let initial = element_from_root(&source, initial_element);
        let initial_props = initial.props();
        let create_render = render_test_root(&mut store, root_id, initial_element);
        let current_component = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            initial,
            FiberFlags::PLACEMENT,
        );
        let state_node = store
            .fiber_arena()
            .get(current_component)
            .unwrap()
            .state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let next_element = source.insert_host_element_with_text("section", "updated");
        let next = element_from_root(&source, next_element);
        let update_render = render_test_root(&mut store, root_id, next_element);
        let payload = update_root_component_for_commit(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_component,
            next,
            &mut detached_hosts,
        );
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 7)
                .unwrap();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
            &mut store,
            &mut host,
            update_render,
            Some(pending),
            8,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(diagnostic.root(), root_id);
        assert_eq!(diagnostic.finished_work(), update_render.finished_work());
        assert_eq!(diagnostic.source_handoff_order(), 7);
        assert_eq!(diagnostic.commit_order(), 8);
        assert_eq!(diagnostic.mutation().fiber(), payload.work_in_progress());
        assert_eq!(
            diagnostic.mutation().alternate_fiber(),
            Some(current_component)
        );
        assert_eq!(
            diagnostic.mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        );
        assert_eq!(
            diagnostic.status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
        );
        assert!(diagnostic.test_host_commit_executed());
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert_eq!(
            diagnostic.blockers(),
            &TEST_HOST_ROOT_HOST_UPDATE_EXECUTION_BLOCKERS
        );
        assert!(diagnostic.public_root_rendering_blocked());
        assert!(!diagnostic.public_renderer_package_behavior_exposed());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert!(diagnostic.payload().is_host_component_props_update());
        assert_eq!(diagnostic.payload().current(), current_component);
        assert_eq!(
            diagnostic.payload().host_component_property_payload_kind(),
            Some(TestHostComponentPropertyPayloadKind::SafeTestProperty)
        );
        assert_eq!(
            diagnostic.payload().host_component_prop_name(),
            Some(TEST_HOST_SAFE_PROPERTY_PROP_NAME)
        );
        assert_eq!(
            diagnostic.payload().host_component_property_name(),
            Some(TEST_HOST_SAFE_PROPERTY_NAME)
        );
        assert_eq!(
            diagnostic.payload().work_in_progress(),
            payload.work_in_progress()
        );
        assert_eq!(diagnostic.payload().state_node(), state_node);
        assert_eq!(
            diagnostic.payload(),
            &TestHostRootHostUpdatePayloadForCanary::HostComponent {
                current: current_component,
                work_in_progress: payload.work_in_progress(),
                state_node,
                old_props: initial_props,
                new_props: next.props(),
                ty: "section",
                property_payload_kind: TestHostComponentPropertyPayloadKind::SafeTestProperty,
                prop_name: TEST_HOST_SAFE_PROPERTY_PROP_NAME,
                property_name: TEST_HOST_SAFE_PROPERTY_NAME,
            }
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            update_render.finished_work()
        );
        assert_eq!(store.host_tokens().len(), token_count_before_apply + 1);
        let mut expected_operations = operations_before_apply;
        expected_operations.push("commit_update");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_root_commit_pipeline_replaces_one_host_text_and_updates_private_record() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_text("before");
        let create_render = render_test_root(&mut store, root_id, initial_element);
        let current_text = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "before",
            FiberFlags::PLACEMENT,
        );
        let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();
        let current_root_before_update = store.root(root_id).unwrap().current();
        assert_eq!(
            store
                .fiber_arena()
                .get(current_root_before_update)
                .unwrap()
                .child(),
            Some(current_text)
        );

        let next_element = source.insert_text("after");
        let next_text = text_from_root(&source, next_element);
        let update_render = render_test_root(&mut store, root_id, next_element);
        let diff = update_root_text_for_commit_with_payload(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_text,
            next_text,
            &mut detached_hosts,
        );
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 17)
                .unwrap();
        let operations_before_apply = host.operations();

        let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
            &mut store,
            &mut host,
            update_render,
            Some(pending),
            18,
            &mut detached_hosts,
        )
        .unwrap();

        let final_root = store.root(root_id).unwrap().current();
        assert_eq!(final_root, update_render.finished_work());
        assert_eq!(
            store.fiber_arena().get(final_root).unwrap().child(),
            Some(diff.work_in_progress())
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(diff.work_in_progress())
                .unwrap()
                .alternate(),
            Some(current_text)
        );
        assert_eq!(
            store.fiber_arena().get(current_text).unwrap().alternate(),
            Some(diff.work_in_progress())
        );

        assert_eq!(diagnostic.root(), root_id);
        assert_eq!(diagnostic.finished_work(), update_render.finished_work());
        assert_eq!(diagnostic.source_handoff_order(), 17);
        assert_eq!(diagnostic.commit_order(), 18);
        assert_eq!(diagnostic.mutation().fiber(), diff.work_in_progress());
        assert_eq!(diagnostic.mutation().alternate_fiber(), Some(current_text));
        assert_eq!(
            diagnostic.mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        );
        assert_eq!(
            diagnostic.status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::CommitTextUpdate
            )
        );
        assert!(diagnostic.test_host_commit_executed());
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert!(diagnostic.payload().is_host_text_content_update());
        assert_eq!(diagnostic.payload().current(), current_text);
        assert_eq!(
            diagnostic.payload().work_in_progress(),
            diff.work_in_progress()
        );
        assert_eq!(diagnostic.payload().state_node(), state_node);
        assert_eq!(diagnostic.payload().host_text_old_text(), Some("before"));
        assert_eq!(diagnostic.payload().host_text_new_text(), Some("after"));
        assert_eq!(
            diagnostic.payload(),
            &TestHostRootHostUpdatePayloadForCanary::HostText {
                current: current_text,
                work_in_progress: diff.work_in_progress(),
                state_node,
                old_text: "before".to_owned(),
                new_text: "after".to_owned(),
            }
        );
        assert_eq!(
            diagnostic.blockers(),
            &TEST_HOST_ROOT_HOST_UPDATE_EXECUTION_BLOCKERS
        );
        assert!(diagnostic.public_root_rendering_blocked());
        assert!(!diagnostic.public_renderer_package_behavior_exposed());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert_eq!(
            detached_hosts
                .test_host_text_record_text(state_node)
                .unwrap(),
            "after"
        );
        assert_eq!(
            detached_hosts
                .test_host_text_record_update_count(state_node)
                .unwrap(),
            1
        );
        let text_updates = detached_hosts
            .test_host_text_record_updates(state_node)
            .unwrap();
        let text_metadata = detached_hosts.text_metadata(state_node).unwrap();
        assert_eq!(text_updates.len(), 1);
        assert_eq!(text_updates[0].sequence(), 0);
        assert_eq!(text_updates[0].handle(), state_node);
        assert_eq!(text_updates[0].root_id(), root_id);
        assert_eq!(text_updates[0].fiber_id(), current_text);
        assert_eq!(text_updates[0].token_id(), text_metadata.token_id());
        assert_eq!(text_updates[0].phase(), text_metadata.phase());
        assert_eq!(text_updates[0].target(), HostFiberTokenTarget::TextInstance);
        assert_eq!(text_updates[0].source_currentness().handle(), state_node);
        assert_eq!(text_updates[0].source_currentness().root_id(), root_id);
        assert_eq!(
            text_updates[0].source_currentness().fiber_id(),
            current_text
        );
        assert_eq!(
            text_updates[0].source_currentness().token_id(),
            text_metadata.token_id()
        );
        assert_eq!(
            text_updates[0].source_currentness().phase(),
            text_metadata.phase()
        );
        assert_eq!(
            text_updates[0].source_currentness().target(),
            HostFiberTokenTarget::TextInstance
        );
        assert!(
            !text_updates[0]
                .source_currentness()
                .public_dom_compatibility_claimed()
        );
        assert_eq!(text_updates[0].old_text(), "before");
        assert_eq!(text_updates[0].new_text(), "after");
        assert_eq!(detached_hosts.text(state_node).unwrap().text(), "before");

        let mut expected_operations = operations_before_apply;
        expected_operations.push("commit_text_update");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_finished_work_handoff_commits_one_style_update_to_private_host_store_only() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "ignored");
        let initial = element_from_root(&source, initial_element);
        let initial_props = initial.props();
        let create_render = render_test_root(&mut store, root_id, initial_element);
        let current_component = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            initial,
            FiberFlags::PLACEMENT,
        );
        let state_node = store
            .fiber_arena()
            .get(current_component)
            .unwrap()
            .state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let next_element = source.insert_host_element_with_text("section", "updated");
        let next = element_from_root(&source, next_element);
        let update_render = render_test_root(&mut store, root_id, next_element);
        let payload = update_root_component_for_commit(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_component,
            next,
            &mut detached_hosts,
        );
        let row =
            TestHostComponentPropertyPayloadRow::style(payload.old_props(), payload.new_props());
        detached_hosts.component_updates[0].property_row = row;
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 17)
                .unwrap();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
            &mut store,
            &mut host,
            update_render,
            Some(pending),
            18,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(diagnostic.root(), root_id);
        assert_eq!(diagnostic.source_handoff_order(), 17);
        assert_eq!(diagnostic.commit_order(), 18);
        assert_eq!(diagnostic.mutation().fiber(), payload.work_in_progress());
        assert_eq!(
            diagnostic.status(),
            TestHostRootMutationApplyStatus::PrivateHostStoreOnly(
                TestHostRootPrivateStoreMutation::HostComponentPropertyAndLatestProps
            )
        );
        assert!(!diagnostic.test_host_commit_executed());
        assert!(diagnostic.private_host_store_only_commit_executed());
        assert_eq!(diagnostic.applied_host_call_count(), 0);
        assert_eq!(diagnostic.private_host_store_update_count(), 1);
        assert_eq!(
            diagnostic.payload().host_component_property_payload_kind(),
            Some(TestHostComponentPropertyPayloadKind::Style)
        );
        assert_eq!(
            diagnostic.payload().host_component_prop_name(),
            Some(TEST_HOST_STYLE_PROP_NAME)
        );
        assert_eq!(
            diagnostic.payload(),
            &TestHostRootHostUpdatePayloadForCanary::HostComponent {
                current: current_component,
                work_in_progress: payload.work_in_progress(),
                state_node,
                old_props: initial_props,
                new_props: next.props(),
                ty: "section",
                property_payload_kind: TestHostComponentPropertyPayloadKind::Style,
                prop_name: TEST_HOST_STYLE_PROP_NAME,
                property_name: TEST_HOST_STYLE_PROP_NAME,
            }
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            update_render.finished_work()
        );
        assert_eq!(store.host_tokens().len(), token_count_before_apply);
        assert_single_component_property_update(
            &detached_hosts,
            state_node,
            root_id,
            current_component,
            payload.old_props(),
            payload.new_props(),
            row.kind(),
            row.prop_name(),
            row.property_name(),
            HostNodePropertyUpdateExecution::CommitUpdate,
        );
        assert_single_latest_props_update_after_property_update(
            &detached_hosts,
            state_node,
            root_id,
            current_component,
            payload.old_props(),
            payload.new_props(),
            row.kind(),
            row.prop_name(),
        );
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!row.public_dom_property_compatibility_claimed());
        assert_eq!(host.operations(), operations_before_apply);
    }

    #[test]
    fn host_work_host_component_update_handoff_rejects_stale_finished_work_before_mutation() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "ignored");
        let initial = element_from_root(&source, initial_element);
        let create_render = render_test_root(&mut store, root_id, initial_element);
        let current_component = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            initial,
            FiberFlags::PLACEMENT,
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let next_element = source.insert_host_element_with_text("section", "updated");
        let next = element_from_root(&source, next_element);
        let update_render = render_test_root(&mut store, root_id, next_element);
        update_root_component_for_commit(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_component,
            next,
            &mut detached_hosts,
        );
        let stale_pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 9)
                .unwrap()
                .with_previous_current_for_canary(update_render.finished_work());
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();

        let error = apply_one_test_host_update_with_finished_work_handoff_for_canary(
            &mut store,
            &mut host,
            update_render,
            Some(stale_pending),
            10,
            &mut detached_hosts,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootHostUpdateExecutionErrorForCanary::FinishedWorkHandoff(error)
                if matches!(
                    error.as_ref(),
                    HostRootFinishedWorkCommitHandoffErrorForCanary::StaleFinishedWorkRecord {
                        root,
                        finished_work,
                        ..
                    } if *root == root_id && *finished_work == update_render.finished_work()
                )
        ));
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(update_render.finished_work())
        );
        assert_eq!(host.operations(), operations_before_apply);
    }

    #[test]
    fn host_work_host_component_update_handoff_rejects_unsupported_payload_before_mutation() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "ignored");
        let initial = element_from_root(&source, initial_element);
        let create_render = render_test_root(&mut store, root_id, initial_element);
        let current_component = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            initial,
            FiberFlags::PLACEMENT,
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(86));
        let updated_component = update_root_component_for_commit_without_payload(
            &mut store,
            update_render.finished_work(),
            current_component,
            PropsHandle::from_raw(9_603),
        );
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 11)
                .unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();

        let error = apply_one_test_host_update_with_finished_work_handoff_for_canary(
            &mut store,
            &mut host,
            update_render,
            Some(pending),
            12,
            &mut detached_hosts,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootHostUpdateExecutionErrorForCanary::UnsupportedPayload {
                root,
                finished_work,
                fiber,
                kind,
            } if root == root_id
                && finished_work == update_render.finished_work()
                && fiber == updated_component
                && kind == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        ));
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(update_render.finished_work())
        );
        assert_eq!(host.operations(), operations_before_apply);
    }

    #[test]
    fn host_work_host_component_update_handoff_rejects_wrong_root_record_before_mutation() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let first_root = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "ignored");
        let initial = element_from_root(&source, initial_element);
        let create_render = render_test_root(&mut store, first_root, initial_element);
        let current_component = attach_detached_root_instance_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            first_root,
            create_render.finished_work(),
            initial,
            FiberFlags::PLACEMENT,
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let next_element = source.insert_host_element_with_text("section", "updated");
        let next = element_from_root(&source, next_element);
        let update_render = render_test_root(&mut store, first_root, next_element);
        update_root_component_for_commit(
            &mut store,
            first_root,
            update_render.finished_work(),
            current_component,
            next,
            &mut detached_hosts,
        );
        update_container(
            &mut store,
            second_root,
            RootElementHandle::from_raw(9_604),
            None,
        )
        .unwrap();
        let second_render =
            render_host_root_for_lanes(&mut store, second_root, Lanes::DEFAULT).unwrap();
        let wrong_root_pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, second_render, 13)
                .unwrap();
        let previous_current = store.root(first_root).unwrap().current();
        let operations_before_apply = host.operations();

        let error = apply_one_test_host_update_with_finished_work_handoff_for_canary(
            &mut store,
            &mut host,
            update_render,
            Some(wrong_root_pending),
            14,
            &mut detached_hosts,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootHostUpdateExecutionErrorForCanary::FinishedWorkHandoff(error)
                if matches!(
                    error.as_ref(),
                    HostRootFinishedWorkCommitHandoffErrorForCanary::ForeignFinishedWorkRecord {
                        expected_root,
                        actual_root,
                        ..
                    } if *expected_root == first_root && *actual_root == second_root
                )
        ));
        assert_eq!(store.root(first_root).unwrap().current(), previous_current);
        assert_eq!(
            store
                .root(first_root)
                .unwrap()
                .scheduling()
                .work_in_progress(),
            Some(update_render.finished_work())
        );
        assert_eq!(host.operations(), operations_before_apply);
    }

    #[test]
    fn host_work_commits_style_row_to_private_host_store_then_latest_props_without_host_call() {
        let mut fixture = root_component_update_apply_fixture();
        let row = TestHostComponentPropertyPayloadRow::style(
            fixture.payload.old_props(),
            fixture.payload.new_props(),
        );
        fixture.detached_hosts.component_updates[0].property_row = row;

        let apply = apply_test_host_root_commit_mutations(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.commit,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(apply.records().len(), 1);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::PrivateHostStoreOnly(
                TestHostRootPrivateStoreMutation::HostComponentPropertyAndLatestProps
            )
        );
        assert_eq!(apply.applied_host_call_count(), 0);
        assert_eq!(apply.private_host_store_update_count(), 1);
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply
        );
        assert_single_component_property_update(
            &fixture.detached_hosts,
            fixture.state_node,
            fixture.root_id,
            fixture.payload.current(),
            fixture.payload.old_props(),
            fixture.payload.new_props(),
            row.kind(),
            row.prop_name(),
            row.property_name(),
            HostNodePropertyUpdateExecution::CommitUpdate,
        );
        assert_single_latest_props_update_after_property_update(
            &fixture.detached_hosts,
            fixture.state_node,
            fixture.root_id,
            fixture.payload.current(),
            fixture.payload.old_props(),
            fixture.payload.new_props(),
            row.kind(),
            row.prop_name(),
        );
        assert!(!row.public_dom_property_compatibility_claimed());
        assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
    }

    #[test]
    fn host_work_records_dangerous_html_row_as_private_payload_execution_evidence() {
        let mut fixture = root_component_update_apply_fixture();
        let row = TestHostComponentPropertyPayloadRow::dangerous_html(
            fixture.payload.old_props(),
            fixture.payload.new_props(),
        );
        fixture.detached_hosts.component_updates[0].property_row = row;

        let apply = apply_test_host_root_commit_mutations(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.commit,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(apply.records().len(), 1);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
        );
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply + 1
        );
        assert_single_component_property_update(
            &fixture.detached_hosts,
            fixture.state_node,
            fixture.root_id,
            fixture.payload.current(),
            fixture.payload.old_props(),
            fixture.payload.new_props(),
            row.kind(),
            row.prop_name(),
            row.property_name(),
            HostNodePropertyUpdateExecution::CommitUpdate,
        );
        let mut expected_operations = fixture.operations_before_apply;
        expected_operations.push("commit_update");
        assert_eq!(fixture.host.operations(), expected_operations);
    }

    #[test]
    fn host_work_records_text_content_reset_row_as_private_host_payload_execution() {
        let mut fixture = root_component_update_apply_fixture();
        let row = TestHostComponentPropertyPayloadRow::text_content_reset(
            fixture.payload.old_props(),
            fixture.payload.new_props(),
        );
        fixture.detached_hosts.component_updates[0].property_row = row;

        let apply = apply_test_host_root_commit_mutations(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.commit,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(apply.records().len(), 1);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::ResetTextContent
            )
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply
        );
        assert_single_component_property_update(
            &fixture.detached_hosts,
            fixture.state_node,
            fixture.root_id,
            fixture.payload.current(),
            fixture.payload.old_props(),
            fixture.payload.new_props(),
            TestHostComponentPropertyPayloadKind::TextContent,
            TEST_HOST_TEXT_CONTENT_PROP_NAME,
            TEST_HOST_TEXT_CONTENT_PROPERTY_NAME,
            HostNodePropertyUpdateExecution::ResetTextContent,
        );
        let mut expected_operations = fixture.operations_before_apply;
        expected_operations.push("reset_text_content");
        assert_eq!(fixture.host.operations(), expected_operations);
    }

    #[test]
    fn host_work_dangerous_html_complete_work_handoff_executes_canonical_private_row() {
        let mut fixture = dangerous_html_text_reset_handoff_fixture(
            HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml,
            61,
        );
        let finished_work = fixture.render.finished_work();

        let handoff = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
            &mut fixture.store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            62,
            63,
        )
        .unwrap();

        assert_eq!(handoff.root(), fixture.root_id);
        assert_eq!(handoff.finished_work(), finished_work);
        assert_eq!(handoff.source_handoff_order(), 61);
        assert_eq!(handoff.commit_order(), 62);
        assert_eq!(handoff.request_order(), 63);
        assert_eq!(handoff.payload_kind_name(), "dangerous-html");
        assert!(handoff.complete_metadata_matches_mutation());
        assert!(handoff.private_test_host_mutation_allowed());
        assert!(handoff.public_root_rendering_blocked());
        assert!(handoff.public_renderer_mutation_blocked());
        assert!(!handoff.public_dom_compatibility_claimed());
        assert!(!handoff.test_renderer_compatibility_claimed());
        assert_eq!(
            fixture.store.root(fixture.root_id).unwrap().current(),
            finished_work
        );

        let diagnostic = apply_dangerous_html_text_reset_handoff_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(diagnostic.root(), fixture.root_id);
        assert_eq!(diagnostic.finished_work(), finished_work);
        assert_eq!(diagnostic.source_handoff_order(), 61);
        assert_eq!(diagnostic.commit_order(), 62);
        assert_eq!(diagnostic.mutation(), handoff.mutation());
        assert_eq!(
            diagnostic.status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
        );
        assert!(diagnostic.test_host_commit_executed());
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert_eq!(diagnostic.private_host_store_update_count(), 0);
        assert_eq!(
            diagnostic.payload().host_component_property_payload_kind(),
            Some(TestHostComponentPropertyPayloadKind::DangerousHtml)
        );
        assert_eq!(
            diagnostic.payload().host_component_prop_name(),
            Some(TEST_HOST_DANGEROUS_HTML_PROP_NAME)
        );
        assert_eq!(
            diagnostic.payload().host_component_property_name(),
            Some(TEST_HOST_DANGEROUS_HTML_PROPERTY_NAME)
        );
        assert!(diagnostic.public_root_rendering_blocked());
        assert!(!diagnostic.public_renderer_package_behavior_exposed());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply + 1
        );
        assert_single_component_property_update(
            &fixture.detached_hosts,
            fixture.state_node,
            fixture.root_id,
            fixture.payload.current(),
            fixture.payload.old_props(),
            fixture.payload.new_props(),
            TestHostComponentPropertyPayloadKind::DangerousHtml,
            TEST_HOST_DANGEROUS_HTML_PROP_NAME,
            TEST_HOST_DANGEROUS_HTML_PROPERTY_NAME,
            HostNodePropertyUpdateExecution::CommitUpdate,
        );
        let mut expected_operations = fixture.operations_before_apply;
        expected_operations.push("commit_update");
        assert_eq!(fixture.host.operations(), expected_operations);
    }

    #[test]
    fn host_work_text_reset_complete_work_handoff_executes_without_public_dom_claim() {
        let mut fixture = dangerous_html_text_reset_handoff_fixture(
            HostComponentDangerousHtmlTextResetPayloadKindForCanary::TextContentReset,
            71,
        );
        let finished_work = fixture.render.finished_work();

        let handoff = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
            &mut fixture.store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            72,
            73,
        )
        .unwrap();
        let diagnostic = apply_dangerous_html_text_reset_handoff_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(handoff.root(), fixture.root_id);
        assert_eq!(handoff.finished_work(), finished_work);
        assert_eq!(handoff.payload_kind_name(), "text-content");
        assert_eq!(
            handoff.complete_work().expected_private_host_execution(),
            "reset-text-content"
        );
        assert!(handoff.complete_work().host_component_update_required());
        assert!(handoff.complete_work().private_reconciler_handoff_only());
        assert!(!handoff.complete_work().public_dom_compatibility_claimed());
        assert!(!handoff.complete_work().public_root_compatibility_claimed());
        assert!(handoff.complete_metadata_matches_mutation());
        assert_eq!(
            diagnostic.status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::ResetTextContent
            )
        );
        assert!(diagnostic.test_host_commit_executed());
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert_eq!(diagnostic.private_host_store_update_count(), 0);
        assert_eq!(
            diagnostic.payload().host_component_property_payload_kind(),
            Some(TestHostComponentPropertyPayloadKind::TextContent)
        );
        assert_eq!(
            diagnostic.payload().host_component_prop_name(),
            Some(TEST_HOST_TEXT_CONTENT_PROP_NAME)
        );
        assert_eq!(
            diagnostic.payload().host_component_property_name(),
            Some(TEST_HOST_TEXT_CONTENT_PROPERTY_NAME)
        );
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply
        );
        assert_single_component_property_update(
            &fixture.detached_hosts,
            fixture.state_node,
            fixture.root_id,
            fixture.payload.current(),
            fixture.payload.old_props(),
            fixture.payload.new_props(),
            TestHostComponentPropertyPayloadKind::TextContent,
            TEST_HOST_TEXT_CONTENT_PROP_NAME,
            TEST_HOST_TEXT_CONTENT_PROPERTY_NAME,
            HostNodePropertyUpdateExecution::ResetTextContent,
        );
        let mut expected_operations = fixture.operations_before_apply;
        expected_operations.push("reset_text_content");
        assert_eq!(fixture.host.operations(), expected_operations);
    }

    #[test]
    fn host_work_dangerous_html_text_reset_handoff_rejects_stale_metadata_before_mutation() {
        let mut fixture = dangerous_html_text_reset_handoff_fixture(
            HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml,
            81,
        );
        let finished_work = fixture.render.finished_work();
        let stale_complete_work = fixture
            .complete_work
            .with_new_props_for_canary(PropsHandle::from_raw(98_881));

        let error = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
            &mut fixture.store,
            fixture.render,
            Some(fixture.pending),
            stale_complete_work,
            0,
            82,
            83,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            crate::root_commit::HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::MetadataPropsMismatch {
                root,
                fiber,
                expected_old_props,
                expected_new_props,
                actual_pending_props,
                actual_memoized_props,
                ..
            } if root == fixture.root_id
                && fiber == fixture.payload.work_in_progress()
                && expected_old_props == fixture.payload.old_props()
                && expected_new_props == PropsHandle::from_raw(98_881)
                && actual_pending_props == fixture.payload.new_props()
                && actual_memoized_props == fixture.payload.new_props()
        ));
        assert_eq!(
            fixture.store.root(fixture.root_id).unwrap().current(),
            fixture.previous_current
        );
        assert_eq!(
            fixture
                .store
                .root(fixture.root_id)
                .unwrap()
                .scheduling()
                .work_in_progress(),
            Some(finished_work)
        );
        assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply
        );
        assert!(
            fixture
                .detached_hosts
                .instance_property_updates(fixture.state_node)
                .unwrap()
                .is_empty()
        );
    }

    #[test]
    fn host_work_managed_child_placement_handoff_executes_private_append_child() {
        let mut fixture = managed_child_placement_host_work_handoff_fixture(91);
        let finished_work = fixture.render.finished_work();

        let handoff = commit_managed_child_complete_work_handoff_for_canary(
            &mut fixture.store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            92,
            93,
        )
        .unwrap();
        let diagnostic = apply_managed_child_complete_work_handoff_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(handoff.root(), fixture.root_id);
        assert_eq!(handoff.finished_work(), finished_work);
        assert_eq!(
            handoff.execution_request().previous_current(),
            fixture.previous_current
        );
        assert_eq!(
            fixture.store.root(fixture.root_id).unwrap().current(),
            finished_work
        );
        assert_eq!(diagnostic.root(), fixture.root_id);
        assert_eq!(diagnostic.finished_work(), finished_work);
        assert_eq!(diagnostic.source_handoff_order(), 91);
        assert_eq!(diagnostic.commit_order(), 92);
        assert_eq!(diagnostic.request_order(), 93);
        assert_eq!(
            diagnostic.kind(),
            HostComponentManagedChildMutationKindForCanary::Placement
        );
        assert_eq!(diagnostic.mutation(), handoff.mutation());
        assert_eq!(
            diagnostic.mutation_status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
        );
        assert_eq!(diagnostic.cleanup_status(), None);
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert_eq!(diagnostic.deletion_cleanup_apply_count(), 0);
        assert_eq!(
            diagnostic.blockers(),
            &TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS
        );
        assert!(diagnostic.private_test_host_mutation_executed());
        assert!(diagnostic.public_root_rendering_blocked());
        assert!(diagnostic.public_renderer_mutation_blocked());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

        let mutation = diagnostic.mutation();
        assert_eq!(mutation.parent(), fixture.work_parent);
        assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
        assert_eq!(mutation.fiber(), fixture.child);
        assert_eq!(mutation.state_node(), fixture.child_state_node);
        assert_eq!(
            fixture
                .store
                .fiber_arena()
                .get(fixture.work_parent)
                .unwrap()
                .alternate(),
            Some(fixture.current_parent)
        );
        assert!(
            fixture
                .detached_hosts
                .instance_metadata(fixture.child_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply
        );
        let mut expected_operations = fixture.operations_before_apply;
        expected_operations.push("append_child");
        assert_eq!(fixture.host.operations(), expected_operations);
    }

    #[test]
    fn host_work_managed_child_sibling_order_placement_handoff_executes_private_insert_before() {
        let mut fixture = managed_child_placement_sibling_order_host_work_handoff_fixture(111);
        let finished_work = fixture.render.finished_work();

        let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut fixture.store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            112,
            113,
        )
        .unwrap();
        let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(handoff.root(), fixture.root_id);
        assert_eq!(handoff.finished_work(), finished_work);
        assert_eq!(
            handoff.execution_request().previous_current(),
            fixture.previous_current
        );
        assert_eq!(
            fixture.store.root(fixture.root_id).unwrap().current(),
            finished_work
        );
        assert_eq!(diagnostic.root(), fixture.root_id);
        assert_eq!(diagnostic.finished_work(), finished_work);
        assert_eq!(diagnostic.source_handoff_order(), 111);
        assert_eq!(diagnostic.commit_order(), 112);
        assert_eq!(diagnostic.request_order(), 113);
        assert_eq!(
            diagnostic.kind(),
            HostComponentManagedChildMutationKindForCanary::Placement
        );
        assert_eq!(diagnostic.order_evidence_name(), "next-sibling");
        assert_eq!(diagnostic.order_sibling(), fixture.order_sibling);
        assert_eq!(
            diagnostic.order_sibling_state_node(),
            fixture.order_sibling_state_node
        );
        assert_eq!(diagnostic.mutation(), handoff.mutation());
        assert_eq!(
            diagnostic.mutation_status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::InsertBefore)
        );
        assert_eq!(diagnostic.cleanup_status(), None);
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert_eq!(diagnostic.deletion_cleanup_apply_count(), 0);
        assert_eq!(
            diagnostic.blockers(),
            &TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS
        );
        assert!(diagnostic.private_test_host_mutation_executed());
        assert!(diagnostic.public_root_rendering_blocked());
        assert!(diagnostic.public_renderer_mutation_blocked());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

        let mutation = diagnostic.mutation();
        assert_eq!(
            mutation.kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
        );
        assert_eq!(mutation.parent(), fixture.work_parent);
        assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
        assert_eq!(mutation.fiber(), fixture.child);
        assert_eq!(mutation.state_node(), fixture.child_state_node);
        let sibling = mutation.placement_sibling().unwrap();
        assert_eq!(sibling.sibling(), Some(fixture.order_sibling));
        assert_eq!(
            sibling.sibling_state_node(),
            fixture.order_sibling_state_node
        );
        assert!(sibling.can_insert_before());
        assert_eq!(
            fixture
                .store
                .fiber_arena()
                .get(fixture.work_parent)
                .unwrap()
                .alternate(),
            Some(fixture.current_parent)
        );
        assert_eq!(
            fixture
                .store
                .fiber_arena()
                .get(fixture.order_sibling)
                .unwrap()
                .alternate(),
            Some(fixture.order_sibling_current)
        );
        assert!(
            fixture
                .detached_hosts
                .instance_metadata(fixture.child_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .detached_hosts
                .instance_metadata(fixture.order_sibling_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply
        );
        let mut expected_operations = fixture.operations_before_apply;
        expected_operations.push("insert_before");
        assert_eq!(fixture.host.operations(), expected_operations);
    }

    #[test]
    fn host_work_managed_child_sibling_order_delete_handoff_executes_private_remove_and_cleanup() {
        let mut fixture = managed_child_delete_sibling_order_host_work_handoff_fixture(121);
        let finished_work = fixture.render.finished_work();
        let order_sibling_host_child = FakeHostChild::Instance(
            fixture
                .detached_hosts
                .instance(fixture.order_sibling_state_node)
                .unwrap()
                .id(),
        );
        let deleted_host_child = FakeHostChild::Instance(
            fixture
                .detached_hosts
                .instance(fixture.child_state_node)
                .unwrap()
                .id(),
        );
        assert_eq!(
            fixture
                .detached_hosts
                .instance(fixture.parent_state_node)
                .unwrap()
                .children(),
            &[order_sibling_host_child, deleted_host_child]
        );

        let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut fixture.store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            122,
            123,
        )
        .unwrap();
        let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(handoff.root(), fixture.root_id);
        assert_eq!(handoff.finished_work(), finished_work);
        assert_eq!(
            handoff.execution_request().previous_current(),
            fixture.previous_current
        );
        assert_eq!(
            fixture.store.root(fixture.root_id).unwrap().current(),
            finished_work
        );
        assert_eq!(diagnostic.root(), fixture.root_id);
        assert_eq!(diagnostic.finished_work(), finished_work);
        assert_eq!(diagnostic.source_handoff_order(), 121);
        assert_eq!(diagnostic.commit_order(), 122);
        assert_eq!(diagnostic.request_order(), 123);
        assert_eq!(
            diagnostic.kind(),
            HostComponentManagedChildMutationKindForCanary::DeleteDetach
        );
        assert_eq!(diagnostic.order_evidence_name(), "previous-sibling");
        assert_eq!(diagnostic.order_sibling(), fixture.order_sibling);
        assert_eq!(
            diagnostic.order_sibling_state_node(),
            fixture.order_sibling_state_node
        );
        assert_eq!(diagnostic.mutation(), handoff.mutation());
        assert_eq!(
            diagnostic.mutation_status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
        );
        assert_eq!(
            diagnostic.cleanup_status(),
            Some(TestHostRootDeletionCleanupStatus::Applied(
                TestHostRootDeletionCleanupAction::DetachDeletedInstance
            ))
        );
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
        assert_eq!(
            diagnostic.blockers(),
            &TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS
        );
        assert!(diagnostic.private_test_host_mutation_executed());
        assert!(diagnostic.public_root_rendering_blocked());
        assert!(diagnostic.public_renderer_mutation_blocked());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

        let mutation = diagnostic.mutation();
        assert_eq!(
            mutation.source(),
            HostRootMutationApplyRecordSource::DeletionList(fixture.deletion_list.unwrap())
        );
        assert_eq!(
            mutation.kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        );
        assert_eq!(mutation.parent(), fixture.work_parent);
        assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
        assert_eq!(mutation.fiber(), fixture.child);
        assert_eq!(mutation.state_node(), fixture.child_state_node);
        assert_eq!(mutation.placement_sibling(), None);
        assert_eq!(
            fixture
                .store
                .fiber_arena()
                .get(fixture.work_parent)
                .unwrap()
                .alternate(),
            Some(fixture.current_parent)
        );
        assert_eq!(
            fixture
                .store
                .fiber_arena()
                .get(fixture.order_sibling)
                .unwrap()
                .alternate(),
            Some(fixture.order_sibling_current)
        );
        assert_eq!(
            fixture
                .store
                .fiber_arena()
                .get(fixture.work_parent)
                .unwrap()
                .child(),
            Some(fixture.order_sibling)
        );
        assert_eq!(
            fixture
                .store
                .fiber_arena()
                .get(fixture.order_sibling)
                .unwrap()
                .sibling(),
            None
        );
        assert_eq!(
            fixture
                .store
                .fiber_arena()
                .get(fixture.order_sibling_current)
                .unwrap()
                .sibling(),
            Some(fixture.child)
        );
        assert!(
            !fixture
                .detached_hosts
                .instance_metadata(fixture.child_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .detached_hosts
                .instance_metadata(fixture.order_sibling_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .detached_hosts
                .instance_metadata(fixture.parent_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply + 1
        );
        let mut expected_operations = fixture.operations_before_apply;
        expected_operations.push("remove_child");
        expected_operations.push("detach_deleted_instance");
        assert_eq!(fixture.host.operations(), expected_operations);
    }

    #[test]
    fn host_work_managed_child_sibling_order_delete_rejects_stale_previous_sibling_before_remove() {
        let mut fixture = managed_child_delete_sibling_order_host_work_handoff_fixture(131);

        let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut fixture.store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            132,
            133,
        )
        .unwrap();
        let order_sibling_scope = fixture
            .detached_hosts
            .scope(
                fixture.order_sibling_state_node,
                HostFiberTokenTarget::Instance,
            )
            .unwrap();
        fixture
            .detached_hosts
            .nodes
            .invalidate_instance(fixture.order_sibling_state_node, order_sibling_scope)
            .unwrap();

        let error = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootManagedChildExecutionErrorForCanary::HostWork(
                HostWorkError::HostNode(ref error)
            ) if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
        assert!(
            fixture
                .detached_hosts
                .instance_metadata(fixture.child_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply + 1
        );
    }

    #[test]
    fn host_work_managed_child_delete_handoff_executes_private_remove_and_cleanup() {
        let mut fixture = managed_child_delete_host_work_handoff_fixture(101);
        let finished_work = fixture.render.finished_work();

        let handoff = commit_managed_child_complete_work_handoff_for_canary(
            &mut fixture.store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            102,
            103,
        )
        .unwrap();
        let diagnostic = apply_managed_child_complete_work_handoff_for_canary(
            &mut fixture.store,
            &mut fixture.host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(handoff.root(), fixture.root_id);
        assert_eq!(handoff.finished_work(), finished_work);
        assert_eq!(
            handoff.execution_request().previous_current(),
            fixture.previous_current
        );
        assert_eq!(
            fixture.store.root(fixture.root_id).unwrap().current(),
            finished_work
        );
        assert_eq!(diagnostic.root(), fixture.root_id);
        assert_eq!(diagnostic.finished_work(), finished_work);
        assert_eq!(diagnostic.source_handoff_order(), 101);
        assert_eq!(diagnostic.commit_order(), 102);
        assert_eq!(diagnostic.request_order(), 103);
        assert_eq!(
            diagnostic.kind(),
            HostComponentManagedChildMutationKindForCanary::DeleteDetach
        );
        assert_eq!(diagnostic.mutation(), handoff.mutation());
        assert_eq!(
            diagnostic.mutation_status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
        );
        assert_eq!(
            diagnostic.cleanup_status(),
            Some(TestHostRootDeletionCleanupStatus::Applied(
                TestHostRootDeletionCleanupAction::DetachDeletedInstance
            ))
        );
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
        assert_eq!(
            diagnostic.blockers(),
            &TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS
        );
        assert!(diagnostic.private_test_host_mutation_executed());
        assert!(diagnostic.public_root_rendering_blocked());
        assert!(diagnostic.public_renderer_mutation_blocked());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

        let mutation = diagnostic.mutation();
        assert_eq!(mutation.parent(), fixture.work_parent);
        assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
        assert_eq!(mutation.fiber(), fixture.child);
        assert_eq!(mutation.state_node(), fixture.child_state_node);
        assert_eq!(
            fixture
                .store
                .fiber_arena()
                .get(fixture.work_parent)
                .unwrap()
                .alternate(),
            Some(fixture.current_parent)
        );
        assert!(
            !fixture
                .detached_hosts
                .instance_metadata(fixture.child_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .detached_hosts
                .instance_metadata(fixture.parent_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply + 1
        );
        let mut expected_operations = fixture.operations_before_apply;
        expected_operations.push("remove_child");
        expected_operations.push("detach_deleted_instance");
        assert_eq!(fixture.host.operations(), expected_operations);
    }

    #[test]
    fn host_work_host_component_rejects_property_payload_metadata_mismatch_before_commit() {
        let mut fixture = root_component_update_apply_fixture();
        fixture.detached_hosts.component_updates[0].new_props = PropsHandle::from_raw(98_608);

        let error = apply_test_host_root_commit_mutations(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.commit,
            &mut fixture.detached_hosts,
        )
        .unwrap_err();

        assert_component_property_payload_error(
            error,
            fixture.root_id,
            fixture.payload.work_in_progress(),
            TEST_HOST_SAFE_PROPERTY_PROP_NAME,
            TestHostComponentPropertyPayloadViolation::WrongPendingProps,
        );
        assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply
        );
        assert!(
            fixture
                .detached_hosts
                .instance_property_updates(fixture.state_node)
                .unwrap()
                .is_empty()
        );
    }

    #[test]
    fn host_work_host_component_rejects_stale_property_update_handles_before_commit_token_issue() {
        let mut fixture = root_component_update_apply_fixture();
        let scope = fixture
            .detached_hosts
            .scope(fixture.state_node, HostFiberTokenTarget::Instance)
            .unwrap();
        fixture
            .detached_hosts
            .nodes
            .invalidate_instance(fixture.state_node, scope)
            .unwrap();

        let error = apply_test_host_root_commit_mutations(
            &mut fixture.store,
            &mut fixture.host,
            &fixture.commit,
            &mut fixture.detached_hosts,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostWorkError::HostNode(ref error)
                if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
        assert_eq!(
            fixture.store.host_tokens().len(),
            fixture.token_count_before_apply
        );
    }

    #[test]
    fn host_work_applies_root_text_update_payload_to_fake_host_config() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(75));
        let current_text = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "before",
            FiberFlags::PLACEMENT,
        );
        let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let mut source = TestHostTree::new();
        let next_element = source.insert_text("after");
        let next_text = text_from_root(&source, next_element);
        let update_render = render_test_root(&mut store, root_id, next_element);
        let diff = update_root_text_for_commit_with_payload(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_text,
            next_text,
            &mut detached_hosts,
        );
        let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &update_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(diff.current(), current_text);
        assert_eq!(diff.state_node(), state_node);
        assert_eq!(diff.old_text(), "before");
        assert_eq!(diff.new_text(), "after");
        assert_eq!(apply.records().len(), 1);
        assert_eq!(
            apply.records()[0].mutation().fiber(),
            diff.work_in_progress()
        );
        assert_eq!(
            apply.records()[0].mutation().alternate_fiber(),
            Some(current_text)
        );
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::CommitTextUpdate
            )
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        assert_eq!(detached_hosts.text(state_node).unwrap().text(), "before");
        let mut expected_operations = operations_before_apply;
        expected_operations.push("commit_text_update");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_host_text_update_rejects_replayed_commit_record_before_second_host_call() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(75_100));
        let current_text = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "before",
            FiberFlags::PLACEMENT,
        );
        let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let mut source = TestHostTree::new();
        let next_element = source.insert_text("after");
        let next_text = text_from_root(&source, next_element);
        let update_render = render_test_root(&mut store, root_id, next_element);
        let diff = update_root_text_for_commit_with_payload(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_text,
            next_text,
            &mut detached_hosts,
        );
        let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
        let first_apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &update_commit,
            &mut detached_hosts,
        )
        .unwrap();
        assert_eq!(first_apply.applied_host_call_count(), 1);
        assert_eq!(
            first_apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::CommitTextUpdate
            )
        );
        assert_eq!(
            detached_hosts
                .test_host_text_record_update_count(state_node)
                .unwrap(),
            1
        );
        let operations_after_first_apply = host.operations();

        let error = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &update_commit,
            &mut detached_hosts,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostWorkError::ConsumedHostUpdatePayload {
                root,
                fiber,
                state_node: consumed_state_node,
                kind,
            } if root == root_id
                && fiber == diff.work_in_progress()
                && consumed_state_node == state_node
                && kind == HostRootMutationApplyRecordKind::CommitHostTextUpdate
        ));
        assert_eq!(host.operations(), operations_after_first_apply);
        assert_eq!(
            detached_hosts
                .test_host_text_record_update_count(state_node)
                .unwrap(),
            1
        );
    }

    #[test]
    fn host_work_applies_host_parent_text_update_payload_to_fake_host_config() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(79));
        let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "before",
        );
        let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let mut source = TestHostTree::new();
        let next_element = source.insert_text("after");
        let next_text = text_from_root(&source, next_element);
        let update_render = render_test_root(&mut store, root_id, next_element);
        let (work_parent, diff) = update_host_parent_text_for_commit_with_payload(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_parent,
            current_text,
            next_text,
            &mut detached_hosts,
        );
        let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &update_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(diff.current(), current_text);
        assert_eq!(diff.state_node(), state_node);
        assert_eq!(diff.old_text(), "before");
        assert_eq!(diff.new_text(), "after");
        assert_eq!(apply.records().len(), 1);
        assert_eq!(apply.records()[0].mutation().parent(), work_parent);
        assert_eq!(
            apply.records()[0].mutation().parent_tag(),
            FiberTag::HostComponent
        );
        assert_eq!(
            apply.records()[0].mutation().fiber(),
            diff.work_in_progress()
        );
        assert_eq!(
            apply.records()[0].mutation().alternate_fiber(),
            Some(current_text)
        );
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::CommitTextUpdate
            )
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        assert_eq!(detached_hosts.text(state_node).unwrap().text(), "before");
        let mut expected_operations = operations_before_apply;
        expected_operations.push("commit_text_update");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_text_update_commit_execution_mutates_test_host_record_after_payload_and_handoff_validation()
     {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_900));
        let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "before",
        );
        let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let mut source = TestHostTree::new();
        let next_element = source.insert_text("after");
        let next_text = text_from_root(&source, next_element);
        let update_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_901));
        let (_work_parent, diff) = update_host_parent_text_for_commit_with_payload(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_parent,
            current_text,
            next_text,
            &mut detached_hosts,
        );
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 21)
                .unwrap();
        let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            Some(pending),
            22,
        )
        .unwrap();
        let request =
            host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 23).unwrap();
        let operations_before_execute = host.operations();

        let execution =
            execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
                .unwrap();

        assert_eq!(execution.root(), root_id);
        assert_eq!(execution.finished_work(), update_render.finished_work());
        assert_eq!(execution.current(), current_text);
        assert_eq!(execution.work_in_progress(), diff.work_in_progress());
        assert_eq!(execution.state_node(), state_node);
        assert_eq!(execution.old_text(), "before");
        assert_eq!(execution.new_text(), "after");
        assert_eq!(execution.update_count(), 1);
        assert!(execution.payload_accepted());
        assert!(execution.commit_handoff_validated());
        assert!(!execution.public_renderer_compatibility_claimed());
        assert_eq!(
            execution.mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        );
        assert_eq!(
            detached_hosts
                .test_host_text_record_text(state_node)
                .unwrap(),
            "after"
        );
        assert_eq!(
            detached_hosts
                .test_host_text_record_update_count(state_node)
                .unwrap(),
            1
        );
        assert_eq!(detached_hosts.text(state_node).unwrap().text(), "before");
        assert!(request.public_renderer_mutation_blocked());
        assert!(!request.public_renderer_compatibility_claimed());

        let mut expected_operations = operations_before_execute;
        expected_operations.push("commit_text_update");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_text_update_commit_execution_rejects_unchanged_payload_without_mutating_record() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_910));
        let current_text = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "stable",
            FiberFlags::PLACEMENT,
        );
        let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let update_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_911));
        let work_text = update_root_text_for_commit_without_payload(
            &mut store,
            update_render.finished_work(),
            current_text,
            PropsHandle::from_raw(7_912),
        );
        detached_hosts.record_text_update(HostTextUpdatePayload {
            current: current_text,
            work_in_progress: work_text,
            state_node,
            old_text: "stable".to_owned(),
            new_text: "stable".to_owned(),
        });
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 31)
                .unwrap();
        let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            Some(pending),
            32,
        )
        .unwrap();
        let request =
            host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 33).unwrap();
        let operations_before_execute = host.operations();

        let error =
            execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
                .unwrap_err();

        assert!(matches!(
            error,
            HostWorkError::UnchangedHostTextUpdatePayload {
                root,
                current,
                work_in_progress,
                state_node: rejected_state_node
            } if root == root_id
                && current == current_text
                && work_in_progress == work_text
                && rejected_state_node == state_node
        ));
        assert_eq!(
            detached_hosts
                .test_host_text_record_text(state_node)
                .unwrap(),
            "stable"
        );
        assert_eq!(
            detached_hosts
                .test_host_text_record_update_count(state_node)
                .unwrap(),
            0
        );
        assert_eq!(host.operations(), operations_before_execute);
    }

    #[test]
    fn host_text_update_commit_execution_rejects_stale_host_token_before_mutating_record() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_920));
        let current_text = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "before",
            FiberFlags::PLACEMENT,
        );
        let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let mut source = TestHostTree::new();
        let next_element = source.insert_text("after");
        let next_text = text_from_root(&source, next_element);
        let update_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_921));
        let diff = update_root_text_for_commit_with_payload(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_text,
            next_text,
            &mut detached_hosts,
        );
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 41)
                .unwrap();
        let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            Some(pending),
            42,
        )
        .unwrap();
        let request =
            host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 43).unwrap();
        let metadata = detached_hosts.text_metadata(state_node).unwrap();
        store
            .host_tokens_mut()
            .invalidate(metadata.token_id(), metadata.phase(), metadata.target())
            .unwrap();
        let operations_before_execute = host.operations();

        let error =
            execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
                .unwrap_err();

        assert!(matches!(
            error,
            HostWorkError::HostFiberToken(error)
                if error.violation() == HostFiberTokenViolation::Stale
        ));
        assert_eq!(diff.old_text(), "before");
        assert_eq!(diff.new_text(), "after");
        assert_eq!(
            detached_hosts
                .test_host_text_record_text(state_node)
                .unwrap(),
            "before"
        );
        assert_eq!(
            detached_hosts
                .test_host_text_record_update_count(state_node)
                .unwrap(),
            0
        );
        assert_eq!(host.operations(), operations_before_execute);
    }

    #[test]
    fn host_text_update_commit_execution_rejects_wrong_root_text_handle_before_mutating_record() {
        let (mut store, root_id) = root_store();
        let second_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let second_render =
            render_test_root(&mut store, second_root, RootElementHandle::from_raw(7_930));
        let second_text = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            second_root,
            second_render.finished_work(),
            "foreign",
            FiberFlags::PLACEMENT,
        );
        let foreign_state_node = store.fiber_arena().get(second_text).unwrap().state_node();

        let current_root = store.root(root_id).unwrap().current();
        let mode = store.fiber_arena().get(current_root).unwrap().mode();
        let current_text = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(7_931),
            mode,
        );
        {
            let node = store.fiber_arena_mut().get_mut(current_text).unwrap();
            node.set_state_node(foreign_state_node);
            node.set_memoized_props(PropsHandle::from_raw(7_931));
        }
        store
            .fiber_arena_mut()
            .set_children(current_root, &[current_text])
            .unwrap();
        complete_host_root(&mut store, current_root).unwrap();

        let update_render =
            render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_932));
        let work_text = update_root_text_for_commit_without_payload(
            &mut store,
            update_render.finished_work(),
            current_text,
            PropsHandle::from_raw(7_933),
        );
        detached_hosts.record_text_update(HostTextUpdatePayload {
            current: current_text,
            work_in_progress: work_text,
            state_node: foreign_state_node,
            old_text: "foreign".to_owned(),
            new_text: "after".to_owned(),
        });
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 51)
                .unwrap();
        let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            Some(pending),
            52,
        )
        .unwrap();
        let request =
            host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 53).unwrap();
        let operations_before_execute = host.operations();

        let error =
            execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
                .unwrap_err();

        assert!(matches!(
            error,
            HostWorkError::HostNode(error)
                if error.violation() == HostNodeViolation::WrongRoot
        ));
        assert_eq!(
            detached_hosts
                .test_host_text_record_text(foreign_state_node)
                .unwrap(),
            "foreign"
        );
        assert_eq!(
            detached_hosts
                .test_host_text_record_update_count(foreign_state_node)
                .unwrap(),
            0
        );
        assert_eq!(host.operations(), operations_before_execute);
    }

    #[test]
    fn host_work_applies_host_component_property_and_text_update_payloads_to_fake_host_config() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(80));
        let (current_outer, current_inner, current_text) =
            attach_detached_nested_root_element_with_text_for_commit(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                create_render.finished_work(),
                "before",
            );
        let component_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
        let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let old_component_props = store
            .fiber_arena()
            .get(current_inner)
            .unwrap()
            .memoized_props();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let mut source = TestHostTree::new();
        let next_element = source.insert_host_element_with_text("label", "after");
        let next_component = element_from_root(&source, next_element);
        let next_text = first_text_child(next_component);
        let update_render = render_test_root(&mut store, root_id, next_element);
        let (work_outer, payload, diff) =
            update_host_parent_component_and_text_for_commit_with_payload(
                &mut store,
                root_id,
                update_render.finished_work(),
                current_outer,
                current_inner,
                current_text,
                next_component,
                next_text,
                &mut detached_hosts,
            );
        let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &update_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(payload.root(), root_id);
        assert_eq!(payload.current(), current_inner);
        assert_eq!(payload.state_node(), component_state_node);
        assert_eq!(payload.old_props(), old_component_props);
        assert_eq!(payload.new_props(), next_component.props());
        assert_eq!(payload.ty(), "label");
        assert_eq!(
            payload.property_row().kind(),
            TestHostComponentPropertyPayloadKind::SafeTestProperty
        );
        assert!(
            !payload
                .property_row()
                .public_dom_property_compatibility_claimed()
        );
        assert_eq!(diff.current(), current_text);
        assert_eq!(diff.state_node(), text_state_node);
        assert_eq!(diff.old_text(), "before");
        assert_eq!(diff.new_text(), "after");
        assert_eq!(apply.records().len(), 2);
        assert_eq!(
            apply.records()[0].mutation().parent(),
            payload.work_in_progress()
        );
        assert_eq!(
            apply.records()[0].mutation().fiber(),
            diff.work_in_progress()
        );
        assert_eq!(
            apply.records()[0].mutation().alternate_fiber(),
            Some(current_text)
        );
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::CommitTextUpdate
            )
        );
        assert_eq!(apply.records()[1].mutation().parent(), work_outer);
        assert_eq!(
            apply.records()[1].mutation().fiber(),
            payload.work_in_progress()
        );
        assert_eq!(
            apply.records()[1].mutation().alternate_fiber(),
            Some(current_inner)
        );
        assert_eq!(
            apply.records()[1].mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        );
        assert_eq!(
            apply.records()[1].status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
        );
        assert_eq!(apply.applied_host_call_count(), 2);
        assert_eq!(store.host_tokens().len(), token_count_before_apply + 1);
        assert_eq!(
            detached_hosts.instance(component_state_node).unwrap().ty(),
            "label"
        );
        assert_single_test_property_update(
            &detached_hosts,
            component_state_node,
            root_id,
            current_inner,
            old_component_props,
            next_component.props(),
        );
        assert_eq!(
            detached_hosts.text(text_state_node).unwrap().text(),
            "before"
        );
        let mut expected_operations = operations_before_apply;
        expected_operations.push("commit_text_update");
        expected_operations.push("commit_update");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_host_component_rejects_text_content_property_row_when_host_text_update_is_pending()
    {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(81));
        let (current_outer, current_inner, current_text) =
            attach_detached_nested_root_element_with_text_for_commit(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                create_render.finished_work(),
                "before",
            );
        let component_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let mut source = TestHostTree::new();
        let next_element = source.insert_host_element_with_text("label", "after");
        let next_component = element_from_root(&source, next_element);
        let next_text = first_text_child(next_component);
        let update_render = render_test_root(&mut store, root_id, next_element);
        let (_work_outer, payload, diff) =
            update_host_parent_component_and_text_for_commit_with_payload(
                &mut store,
                root_id,
                update_render.finished_work(),
                current_outer,
                current_inner,
                current_text,
                next_component,
                next_text,
                &mut detached_hosts,
            );
        detached_hosts.component_updates[0].property_row =
            TestHostComponentPropertyPayloadRow::text_content_reset(
                payload.old_props(),
                payload.new_props(),
            );
        let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        let error = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &update_commit,
            &mut detached_hosts,
        )
        .unwrap_err();

        assert_eq!(diff.current(), current_text);
        assert_component_property_payload_error(
            error,
            root_id,
            payload.work_in_progress(),
            TEST_HOST_TEXT_CONTENT_PROP_NAME,
            TestHostComponentPropertyPayloadViolation::ConflictingTextUpdate,
        );
        assert_eq!(host.operations(), operations_before_apply);
        assert_eq!(store.host_tokens().len(), token_count_before_apply);
        assert!(
            detached_hosts
                .instance_property_updates(component_state_node)
                .unwrap()
                .is_empty()
        );
    }

    #[test]
    fn host_work_applies_host_parent_text_deletion_record_without_cleanup() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(73));
        let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "nested",
        );
        let parent_state_node = store
            .fiber_arena()
            .get(current_parent)
            .unwrap()
            .state_node();
        let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(74), None).unwrap();
        let delete_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = delete_host_text_under_host_parent_for_commit(
            &mut store,
            delete_render.finished_work(),
            current_parent,
            current_text,
        );
        let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(apply.records().len(), 1);
        assert_eq!(apply.records()[0].mutation().parent(), work_parent);
        assert_eq!(
            apply.records()[0].mutation().parent_state_node(),
            parent_state_node
        );
        assert_eq!(apply.records()[0].mutation().fiber(), current_text);
        assert_eq!(apply.records()[0].mutation().state_node(), text_state_node);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        assert_eq!(
            detached_hosts.text(text_state_node).unwrap().text(),
            "nested"
        );
        assert!(
            detached_hosts
                .instance(parent_state_node)
                .unwrap()
                .children()
                .contains(&FakeHostChild::Text(
                    detached_hosts.text(text_state_node).unwrap().id()
                ))
        );
        assert!(
            host.operations()
                .ends_with(&["append_child_to_container", "remove_child"])
        );
    }

    #[test]
    fn host_work_applies_host_component_subtree_deletion_cleanup_with_ref_evidence() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(84));
        let (current_outer, current_inner, current_text) =
            attach_detached_nested_root_element_with_text_for_commit(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                create_render.finished_work(),
                "deleted subtree",
            );
        let outer_state_node = store.fiber_arena().get(current_outer).unwrap().state_node();
        let inner_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
        let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let inner_host_child =
            FakeHostChild::Instance(detached_hosts.instance(inner_state_node).unwrap().id());
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let deleted_ref = RefHandle::from_raw(9_500);
        store
            .fiber_arena_mut()
            .get_mut(current_inner)
            .unwrap()
            .set_ref_handle(deleted_ref);

        update_container(&mut store, root_id, RootElementHandle::from_raw(85), None).unwrap();
        let delete_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let work_outer = delete_host_component_under_host_parent_for_commit(
            &mut store,
            delete_render.finished_work(),
            current_outer,
            current_inner,
        );
        let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
        let operations_before_apply = host.operations();
        let mutation_apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap();
        let cleanup_apply = apply_test_host_root_deletion_cleanup(
            &store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(mutation_apply.records().len(), 1);
        assert_eq!(mutation_apply.records()[0].mutation().parent(), work_outer);
        assert_eq!(
            mutation_apply.records()[0].mutation().parent_state_node(),
            outer_state_node
        );
        assert_eq!(
            mutation_apply.records()[0].mutation().fiber(),
            current_inner
        );
        assert_eq!(
            mutation_apply.records()[0].mutation().state_node(),
            inner_state_node
        );
        assert_eq!(
            mutation_apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        );
        assert_eq!(
            mutation_apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
        );

        assert_eq!(cleanup_apply.root(), root_id);
        assert_eq!(cleanup_apply.finished_work(), delete_commit.finished_work());
        assert_eq!(cleanup_apply.records().len(), 2);
        assert_eq!(cleanup_apply.applied_record_count(), 2);
        assert_eq!(cleanup_apply.detached_instance_count(), 1);
        assert_eq!(cleanup_apply.records()[0].cleanup().fiber(), current_text);
        assert_eq!(
            cleanup_apply.records()[0].cleanup().token_target(),
            HostFiberTokenTarget::TextInstance
        );
        assert_eq!(
            cleanup_apply.records()[0].status(),
            TestHostRootDeletionCleanupStatus::Applied(
                TestHostRootDeletionCleanupAction::InvalidateDeletedText
            )
        );
        assert_eq!(
            cleanup_apply.records()[0]
                .previous_metadata()
                .unwrap()
                .fiber_id(),
            current_text
        );
        assert_eq!(
            cleanup_apply.records()[0]
                .previous_metadata()
                .unwrap()
                .target(),
            HostFiberTokenTarget::TextInstance
        );
        assert_eq!(cleanup_apply.records()[1].cleanup().fiber(), current_inner);
        assert_eq!(
            cleanup_apply.records()[1].cleanup().token_target(),
            HostFiberTokenTarget::Instance
        );
        assert_eq!(
            cleanup_apply.records()[1].status(),
            TestHostRootDeletionCleanupStatus::Applied(
                TestHostRootDeletionCleanupAction::DetachDeletedInstance
            )
        );
        assert_eq!(
            cleanup_apply.records()[1]
                .previous_metadata()
                .unwrap()
                .fiber_id(),
            current_inner
        );
        assert_eq!(
            cleanup_apply.records()[1]
                .previous_metadata()
                .unwrap()
                .target(),
            HostFiberTokenTarget::Instance
        );

        assert!(
            !detached_hosts
                .text_metadata(text_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            !detached_hosts
                .instance_metadata(inner_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            detached_hosts
                .nodes
                .text(
                    text_state_node,
                    detached_hosts
                        .scope(text_state_node, HostFiberTokenTarget::TextInstance)
                        .unwrap()
                )
                .unwrap_err()
                .violation(),
            HostNodeViolation::Stale
        );
        assert_eq!(
            detached_hosts
                .nodes
                .instance(
                    inner_state_node,
                    detached_hosts
                        .scope(inner_state_node, HostFiberTokenTarget::Instance)
                        .unwrap()
                )
                .unwrap_err()
                .violation(),
            HostNodeViolation::Stale
        );
        assert!(
            detached_hosts
                .instance(outer_state_node)
                .unwrap()
                .children()
                .contains(&inner_host_child)
        );

        let refs = delete_commit.ref_commit_metadata();
        assert_eq!(refs.attach().len(), 0);
        assert_eq!(refs.detach().len(), 1);
        assert_eq!(refs.detach()[0].fiber(), current_inner);
        assert_eq!(refs.detach()[0].ref_handle(), deleted_ref);
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

        let gate = delete_commit.dom_ref_callback_commit_gate();
        assert_eq!(gate.len(), 1);
        assert_eq!(gate.records()[0].fiber(), current_inner);
        assert_eq!(gate.records()[0].token(), refs.detach()[0].token());
        assert!(!gate.callback_refs_invoked());
        assert!(!gate.object_refs_mutated());
        assert!(!gate.react_dom_ref_compatibility_claimed());

        let mut expected_operations = operations_before_apply;
        expected_operations.push("remove_child");
        expected_operations.push("detach_deleted_instance");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_deletion_executes_passive_destroy_before_host_cleanup_with_ref_order_evidence() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(186));
        let fixture = attach_detached_host_subtree_with_passive_cleanup_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            &mut hook_store,
            "deleted passive subtree",
        );
        let deleted_host_child = FakeHostChild::Instance(
            detached_hosts
                .instance(fixture.deleted_host_state_node)
                .unwrap()
                .id(),
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(187), None).unwrap();
        let delete_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = delete_host_component_under_host_parent_for_commit(
            &mut store,
            delete_render.finished_work(),
            fixture.host_parent,
            fixture.deleted_host,
        );
        let deleted_passive_handoff =
            queue_function_component_deleted_subtree_pending_passive_effects(
                &mut store,
                root_id,
                &hook_store,
                work_parent,
                fixture.deleted_host,
                Lanes::DEFAULT,
            )
            .unwrap();
        let queued_passive = deleted_passive_handoff.records()[0];
        let mut delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
        delete_commit
            .record_function_component_deleted_subtree_passive_effects_for_canary(&[
                deleted_passive_handoff,
            ])
            .unwrap();
        let operations_before_apply = host.operations();
        let mut destroy_executor = RecordingDeletedSubtreeDestroyExecutor::default();
        let passive_flush =
            flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary(
                &mut store,
                &delete_commit,
                &mut destroy_executor,
            )
            .unwrap();
        let detach_apply = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
            &store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap();
        let cleanup_apply = apply_test_host_root_deletion_cleanup(
            &store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap();
        let execution_snapshot =
            materialize_test_host_root_deletion_ref_passive_cleanup_execution_for_canary(
                &delete_commit,
                &passive_flush,
                &detach_apply,
                &cleanup_apply,
            );

        assert_eq!(delete_commit.mutation_apply_log().records().len(), 1);
        assert_eq!(
            delete_commit.mutation_apply_log().records()[0].kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        );
        assert_eq!(
            delete_commit.mutation_apply_log().records()[0].parent(),
            work_parent
        );
        assert_eq!(
            delete_commit.mutation_apply_log().records()[0].parent_state_node(),
            fixture.host_parent_state_node
        );
        assert_eq!(
            delete_commit.mutation_apply_log().records()[0].fiber(),
            fixture.deleted_host
        );
        assert_eq!(detach_apply.root(), root_id);
        assert_eq!(detach_apply.finished_work(), delete_commit.finished_work());
        assert_eq!(
            detach_apply.status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
        );
        assert!(!detach_apply.public_unmount_compatibility_claimed());
        assert!(!detach_apply.broad_host_teardown_enabled());
        assert_eq!(detach_apply.plan().deleted_root(), fixture.deleted_host);
        assert_eq!(detach_apply.plan().host_parent(), work_parent);
        assert_eq!(
            detach_apply.plan().host_parent_state_node(),
            fixture.host_parent_state_node
        );
        assert_eq!(detach_apply.plan().host_child(), fixture.deleted_host);
        assert_eq!(
            detach_apply.plan().host_child_tag(),
            FiberTag::HostComponent
        );
        assert_eq!(
            detach_apply.plan().host_child_state_node(),
            fixture.deleted_host_state_node
        );
        assert_eq!(detach_apply.plan().cleanup_sequence(), 1);
        assert_eq!(detach_apply.plan().cleanup_order_sequence(), 3);

        let refs = delete_commit.ref_commit_metadata();
        assert_eq!(refs.attach().len(), 0);
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
        assert_eq!(
            refs.detach()[0].token_phase(),
            HostFiberTokenPhase::Deletion
        );
        assert_eq!(
            refs.detach()[0].token_target(),
            HostFiberTokenTarget::Instance
        );

        let cleanup_gate = delete_commit.ref_cleanup_return_execution_gate();
        assert_eq!(cleanup_gate.len(), 1);
        assert_eq!(cleanup_gate.cleanup_return_execution_gate_count(), 1);
        assert_eq!(cleanup_gate.records()[0].fiber(), fixture.deleted_host);
        assert_eq!(cleanup_gate.records()[0].token(), refs.detach()[0].token());
        assert!(cleanup_gate.records()[0].cleanup_return_execution_gate());
        assert!(!cleanup_gate.cleanup_return_callbacks_invoked());

        assert_eq!(passive_flush.status(), PassiveEffectsFlushStatus::Flushed);
        assert!(passive_flush.consumed_pending_passive());
        assert_eq!(passive_flush.records().len(), 1);
        assert_eq!(passive_flush.records()[0].fiber(), fixture.deleted_function);
        assert_eq!(
            passive_flush.records()[0].phase(),
            PendingPassiveEffectPhase::Unmount
        );
        assert_eq!(
            passive_flush.records()[0].unmount_origin(),
            Some(PendingPassiveUnmountOrigin::DeletedSubtree {
                nearest_mounted_ancestor: work_parent
            })
        );
        assert_eq!(
            passive_flush.records()[0].destroy_callback(),
            Some(fixture.passive_destroy)
        );
        assert!(passive_flush.records()[0].destroy_callback_invoked());
        assert!(passive_flush.did_execute_destroy_callbacks());
        assert_eq!(passive_flush.destroy_callback_executions().len(), 1);
        assert_eq!(destroy_executor.calls().len(), 1);
        let destroy_execution = passive_flush.destroy_callback_executions()[0];
        assert_eq!(destroy_execution.fiber(), fixture.deleted_function);
        assert_eq!(
            destroy_execution.pending_order(),
            queued_passive.unmount_order()
        );
        assert_eq!(
            destroy_execution.destroy_callback(),
            fixture.passive_destroy
        );
        assert_eq!(destroy_executor.calls()[0], destroy_execution.request());
        assert!(!passive_flush.public_effect_execution_enabled());
        assert!(!passive_flush.public_act_compatibility_claimed());
        assert!(!passive_flush.scheduler_driven_passive_execution_enabled());

        assert_eq!(cleanup_apply.records().len(), 2);
        assert_eq!(cleanup_apply.applied_record_count(), 2);
        assert_eq!(
            cleanup_apply.records()[0].cleanup().fiber(),
            fixture.deleted_text
        );
        assert_eq!(
            cleanup_apply.records()[0].status(),
            TestHostRootDeletionCleanupStatus::Applied(
                TestHostRootDeletionCleanupAction::InvalidateDeletedText
            )
        );
        assert_eq!(
            cleanup_apply.records()[1].cleanup().fiber(),
            fixture.deleted_host
        );
        assert_eq!(
            cleanup_apply.records()[1].status(),
            TestHostRootDeletionCleanupStatus::Applied(
                TestHostRootDeletionCleanupAction::DetachDeletedInstance
            )
        );
        assert!(
            !detached_hosts
                .text_metadata(fixture.deleted_text_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            !detached_hosts
                .instance_metadata(fixture.deleted_host_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            detached_hosts
                .nodes
                .text(
                    fixture.deleted_text_state_node,
                    detached_hosts
                        .scope(
                            fixture.deleted_text_state_node,
                            HostFiberTokenTarget::TextInstance
                        )
                        .unwrap()
                )
                .unwrap_err()
                .violation(),
            HostNodeViolation::Stale
        );
        assert_eq!(
            detached_hosts
                .nodes
                .instance(
                    fixture.deleted_host_state_node,
                    detached_hosts
                        .scope(
                            fixture.deleted_host_state_node,
                            HostFiberTokenTarget::Instance
                        )
                        .unwrap()
                )
                .unwrap_err()
                .violation(),
            HostNodeViolation::Stale
        );
        assert!(
            detached_hosts
                .instance(fixture.host_parent_state_node)
                .unwrap()
                .children()
                .contains(&deleted_host_child)
        );

        let order_gate = delete_commit.deletion_cleanup_order_gate_for_canary();
        assert_eq!(order_gate.len(), 4);
        assert_eq!(order_gate.ref_cleanup_return_count(), 1);
        assert_eq!(order_gate.passive_destroy_count(), 1);
        assert_eq!(order_gate.host_node_cleanup_count(), 2);
        assert_eq!(
            order_gate
                .records()
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
        assert_eq!(order_gate.records()[0].fiber(), fixture.deleted_host);
        assert_eq!(
            order_gate.records()[0].ref_cleanup_return_sequence(),
            Some(0)
        );
        assert_eq!(order_gate.records()[1].fiber(), fixture.deleted_function);
        assert_eq!(
            order_gate.records()[1].passive_unmount_order(),
            Some(queued_passive.unmount_order())
        );
        assert_eq!(
            order_gate.records()[1].passive_destroy(),
            Some(fixture.passive_destroy)
        );
        assert_eq!(order_gate.records()[2].fiber(), fixture.deleted_text);
        assert_eq!(order_gate.records()[2].host_cleanup_sequence(), Some(0));
        assert_eq!(order_gate.records()[3].fiber(), fixture.deleted_host);
        assert_eq!(order_gate.records()[3].host_cleanup_sequence(), Some(1));
        assert!(!order_gate.ref_cleanup_return_callbacks_invoked());
        assert!(!order_gate.passive_destroy_callbacks_invoked());
        assert!(!order_gate.public_effects_flushed());
        assert!(!order_gate.public_ref_or_effect_compatibility_claimed());
        assert!(
            !delete_commit
                .host_node_deletion_cleanup_log()
                .public_unmount_compatibility_claimed()
        );

        assert_eq!(execution_snapshot.len(), 5);
        assert_eq!(execution_snapshot.ref_cleanup_return_gate_count(), 1);
        assert_eq!(execution_snapshot.passive_destroy_execution_count(), 1);
        assert_eq!(execution_snapshot.host_subtree_detachment_count(), 1);
        assert_eq!(execution_snapshot.host_cleanup_apply_count(), 2);
        assert!(execution_snapshot.private_passive_destroy_callbacks_invoked());
        assert!(execution_snapshot.private_host_subtree_detachment_applied());
        assert!(!execution_snapshot.public_unmount_compatibility_claimed());
        assert!(!execution_snapshot.public_ref_or_effect_compatibility_claimed());
        assert_eq!(
            execution_snapshot
                .records()
                .iter()
                .map(|record| record.sequence())
                .collect::<Vec<_>>(),
            vec![0, 1, 2, 3, 4]
        );
        assert_eq!(
            execution_snapshot
                .records()
                .iter()
                .map(|record| record.phase())
                .collect::<Vec<_>>(),
            vec![
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::RefCleanupReturnGate,
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::PassiveDestroyCallback,
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostSubtreeDetach,
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostNodeCleanup,
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostNodeCleanup,
            ]
        );
        assert_eq!(
            execution_snapshot.records()[0].fiber(),
            fixture.deleted_host
        );
        assert_eq!(
            execution_snapshot.records()[0].deleted_root(),
            fixture.deleted_host
        );
        assert_eq!(
            execution_snapshot.records()[0].ref_cleanup_return_sequence(),
            Some(0)
        );
        assert_eq!(
            execution_snapshot.records()[0].passive_destroy_execution_order(),
            None
        );
        assert_eq!(
            execution_snapshot.records()[1].fiber(),
            fixture.deleted_function
        );
        assert_eq!(
            execution_snapshot.records()[1].deleted_root(),
            fixture.deleted_host
        );
        assert_eq!(
            execution_snapshot.records()[1].ref_cleanup_return_sequence(),
            None
        );
        assert_eq!(
            execution_snapshot.records()[1].passive_destroy_execution_order(),
            Some(0)
        );
        assert_eq!(
            execution_snapshot.records()[2].fiber(),
            fixture.deleted_host
        );
        assert_eq!(
            execution_snapshot.records()[2].host_detachment_cleanup_order_sequence(),
            Some(3)
        );
        assert_eq!(
            execution_snapshot.records()[2].host_cleanup_sequence(),
            None
        );
        assert_eq!(
            execution_snapshot.records()[3].fiber(),
            fixture.deleted_text
        );
        assert_eq!(
            execution_snapshot.records()[3].host_cleanup_sequence(),
            Some(0)
        );
        assert_eq!(
            execution_snapshot.records()[4].fiber(),
            fixture.deleted_host
        );
        assert_eq!(
            execution_snapshot.records()[4].host_cleanup_sequence(),
            Some(1)
        );

        let mut expected_operations = operations_before_apply;
        expected_operations.push("remove_child");
        expected_operations.push("detach_deleted_instance");
        assert_eq!(host.operations(), expected_operations);
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .pending_passive()
                .is_empty()
        );
        assert_eq!(queued_passive.create(), fixture.passive_create);
        assert_eq!(queued_passive.destroy(), Some(fixture.passive_destroy));
        assert_eq!(queued_passive.dependencies(), fixture.passive_dependencies);
    }

    #[test]
    fn host_work_deletion_detaches_fragment_host_child_after_cleanup_order_validation() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(86));
        let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "fragment deleted",
        );
        let parent_state_node = store
            .fiber_arena()
            .get(current_parent)
            .unwrap()
            .state_node();
        let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let fragment = wrap_current_host_child_in_deleted_root(
            &mut store,
            current_parent,
            current_text,
            FiberTag::Fragment,
            StateNodeHandle::NONE,
        );
        update_container(&mut store, root_id, RootElementHandle::from_raw(87), None).unwrap();
        let delete_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = delete_non_host_root_under_host_parent_for_commit(
            &mut store,
            delete_render.finished_work(),
            current_parent,
            fragment,
            None,
        );
        let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
        let operations_before_detach = host.operations();
        let detach_apply = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
            &store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap();
        let cleanup_apply = apply_test_host_root_deletion_cleanup(
            &store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(delete_commit.deletion_lists().len(), 1);
        assert_eq!(delete_commit.deletion_lists()[0].deleted(), &[fragment]);
        assert_eq!(delete_commit.mutation_apply_log().records().len(), 1);
        assert_eq!(
            delete_commit.mutation_apply_log().records()[0].kind(),
            HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
        );
        assert_eq!(
            delete_commit
                .deletion_cleanup_order_gate_for_canary()
                .host_node_cleanup_count(),
            1
        );

        assert_eq!(detach_apply.root(), root_id);
        assert_eq!(detach_apply.finished_work(), delete_commit.finished_work());
        assert_eq!(
            detach_apply.status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
        );
        assert!(!detach_apply.public_unmount_compatibility_claimed());
        assert!(!detach_apply.broad_host_teardown_enabled());
        let plan = detach_apply.plan();
        assert_eq!(plan.deleted_root(), fragment);
        assert_eq!(plan.deleted_root_tag(), FiberTag::Fragment);
        assert_eq!(plan.parent(), work_parent);
        assert_eq!(plan.host_parent(), work_parent);
        assert_eq!(plan.host_parent_state_node(), parent_state_node);
        assert_eq!(plan.host_child(), current_text);
        assert_eq!(plan.host_child_tag(), FiberTag::HostText);
        assert_eq!(plan.host_child_state_node(), text_state_node);
        assert_eq!(plan.host_child_traversal_depth(), 1);
        assert_eq!(plan.cleanup_sequence(), 0);
        assert_eq!(plan.cleanup_order_sequence(), 0);

        assert_eq!(cleanup_apply.records().len(), 1);
        assert_eq!(cleanup_apply.records()[0].cleanup().fiber(), current_text);
        assert_eq!(
            cleanup_apply.records()[0].status(),
            TestHostRootDeletionCleanupStatus::Applied(
                TestHostRootDeletionCleanupAction::InvalidateDeletedText
            )
        );
        assert!(
            !detached_hosts
                .text_metadata(text_state_node)
                .unwrap()
                .is_active()
        );

        let mut expected_operations = operations_before_detach;
        expected_operations.push("remove_child");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn host_work_deletion_rejects_portal_and_suspense_roots_for_subtree_host_detachment() {
        for blocked_tag in [FiberTag::Portal, FiberTag::Suspense] {
            let (mut store, root_id) = root_store();
            let mut host = RecordingHost::default();
            let mut detached_hosts = DetachedHostRecords::default();
            let create_render =
                render_test_root(&mut store, root_id, RootElementHandle::from_raw(88));
            let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                create_render.finished_work(),
                "blocked deleted root",
            );
            let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
            apply_test_host_root_commit_mutations(
                &mut store,
                &mut host,
                &create_commit,
                &mut detached_hosts,
            )
            .unwrap();

            let deleted_root = wrap_current_host_child_in_deleted_root(
                &mut store,
                current_parent,
                current_text,
                blocked_tag,
                if blocked_tag == FiberTag::Portal {
                    StateNodeHandle::from_raw(9_090)
                } else {
                    StateNodeHandle::NONE
                },
            );
            update_container(&mut store, root_id, RootElementHandle::from_raw(89), None).unwrap();
            let delete_render =
                render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            delete_non_host_root_under_host_parent_for_commit(
                &mut store,
                delete_render.finished_work(),
                current_parent,
                deleted_root,
                None,
            );
            let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
            let operations_before_detach = host.operations();

            let error = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
                &store,
                &mut host,
                &delete_commit,
                &mut detached_hosts,
            )
            .unwrap_err();

            match (blocked_tag, error) {
                (
                    FiberTag::Portal,
                    HostWorkError::DeletionSubtreeHostDetachmentPlan(
                        HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::PortalDeletedRootBlocked {
                            deleted_root: actual,
                            ..
                        },
                    ),
                ) => assert_eq!(actual, deleted_root),
                (
                    FiberTag::Suspense,
                    HostWorkError::DeletionSubtreeHostDetachmentPlan(
                        HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::SuspenseDeletedRootBlocked {
                            deleted_root: actual,
                            tag,
                            ..
                        },
                    ),
                ) => {
                    assert_eq!(actual, deleted_root);
                    assert_eq!(tag, FiberTag::Suspense);
                }
                (_, other) => panic!("unexpected detachment error: {other:?}"),
            }
            assert_eq!(host.operations(), operations_before_detach);
        }
    }

    #[test]
    fn host_work_deletion_rejects_nested_portal_and_suspense_boundaries_before_detachment() {
        for blocked_tag in [FiberTag::Portal, FiberTag::Suspense] {
            let (mut store, root_id) = root_store();
            let mut host = RecordingHost::default();
            let mut detached_hosts = DetachedHostRecords::default();
            let create_render =
                render_test_root(&mut store, root_id, RootElementHandle::from_raw(94));
            let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
                &mut store,
                &mut host,
                &mut detached_hosts,
                root_id,
                create_render.finished_work(),
                "nested blocked boundary",
            );
            let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
            apply_test_host_root_commit_mutations(
                &mut store,
                &mut host,
                &create_commit,
                &mut detached_hosts,
            )
            .unwrap();

            let blocked = wrap_current_host_child_in_deleted_root(
                &mut store,
                current_parent,
                current_text,
                blocked_tag,
                if blocked_tag == FiberTag::Portal {
                    StateNodeHandle::from_raw(9_091)
                } else {
                    StateNodeHandle::NONE
                },
            );
            let fragment = wrap_current_host_child_in_deleted_root(
                &mut store,
                current_parent,
                blocked,
                FiberTag::Fragment,
                StateNodeHandle::NONE,
            );
            update_container(&mut store, root_id, RootElementHandle::from_raw(95), None).unwrap();
            let delete_render =
                render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            delete_non_host_root_under_host_parent_for_commit(
                &mut store,
                delete_render.finished_work(),
                current_parent,
                fragment,
                None,
            );
            let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
            let operations_before_detach = host.operations();

            let error = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
                &store,
                &mut host,
                &delete_commit,
                &mut detached_hosts,
            )
            .unwrap_err();

            match (blocked_tag, error) {
                (
                    FiberTag::Portal,
                    HostWorkError::DeletionSubtreeHostDetachmentPlan(
                        HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::PortalDeletedSubtreeBlocked {
                            deleted_root,
                            portal,
                            ..
                        },
                    ),
                ) => {
                    assert_eq!(deleted_root, fragment);
                    assert_eq!(portal, blocked);
                }
                (
                    FiberTag::Suspense,
                    HostWorkError::DeletionSubtreeHostDetachmentPlan(
                        HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::SuspenseDeletedSubtreeBlocked {
                            deleted_root,
                            fiber,
                            tag,
                            ..
                        },
                    ),
                ) => {
                    assert_eq!(deleted_root, fragment);
                    assert_eq!(fiber, blocked);
                    assert_eq!(tag, FiberTag::Suspense);
                }
                (_, other) => panic!("unexpected nested boundary error: {other:?}"),
            }
            assert_eq!(host.operations(), operations_before_detach);
        }
    }

    #[test]
    fn host_work_deletion_rejects_stale_deleted_host_child_before_detachment() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(90));
        let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "stale deleted root",
        );
        let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();
        let fragment = wrap_current_host_child_in_deleted_root(
            &mut store,
            current_parent,
            current_text,
            FiberTag::Fragment,
            StateNodeHandle::NONE,
        );
        update_container(&mut store, root_id, RootElementHandle::from_raw(91), None).unwrap();
        let delete_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        delete_non_host_root_under_host_parent_for_commit(
            &mut store,
            delete_render.finished_work(),
            current_parent,
            fragment,
            None,
        );
        let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
        apply_test_host_root_deletion_cleanup(
            &store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap();
        let operations_before_detach = host.operations();

        let error = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
            &store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap_err();

        assert!(
            !detached_hosts
                .text_metadata(text_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(host.operations(), operations_before_detach);
        match error {
            HostWorkError::HostNode(error) => {
                assert_eq!(error.violation(), HostNodeViolation::Stale);
            }
            other => panic!("unexpected stale detachment error: {other:?}"),
        }
    }

    #[test]
    fn host_work_deletion_rejects_wrong_parent_handle_for_subtree_host_detachment() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(92));
        let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "wrong parent",
        );
        let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();
        let fragment = wrap_current_host_child_in_deleted_root(
            &mut store,
            current_parent,
            current_text,
            FiberTag::Fragment,
            StateNodeHandle::NONE,
        );
        update_container(&mut store, root_id, RootElementHandle::from_raw(93), None).unwrap();
        let delete_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        delete_non_host_root_under_host_parent_for_commit(
            &mut store,
            delete_render.finished_work(),
            current_parent,
            fragment,
            Some(text_state_node),
        );
        let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
        let operations_before_detach = host.operations();

        let error = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
            &store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap_err();

        assert_eq!(host.operations(), operations_before_detach);
        match error {
            HostWorkError::HostNode(error) => {
                assert_eq!(error.violation(), HostNodeViolation::WrongTarget);
            }
            other => panic!("unexpected wrong-parent detachment error: {other:?}"),
        }
    }

    #[test]
    fn host_work_leaves_host_parent_deletion_recorded_only_without_host_handles() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(75));
        let mode = store
            .fiber_arena()
            .get(render.finished_work())
            .unwrap()
            .mode();
        let parent = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(9030),
            mode,
        );
        let deleted = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(9031),
            mode,
        );
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(parent, deleted)
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[parent])
            .unwrap();
        complete_host_root(&mut store, render.finished_work()).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(apply.records().len(), 1);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::RecordedOnly
        );
        assert_eq!(apply.applied_host_call_count(), 0);
        assert_eq!(host.operations(), operations_before_apply);
    }

    #[test]
    fn host_work_leaves_root_text_update_apply_record_recorded_only() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(76));
        let current_text = attach_detached_root_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "before",
            FiberFlags::PLACEMENT,
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        update_container(&mut store, root_id, RootElementHandle::from_raw(77), None).unwrap();
        let update_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let updated_text = update_root_text_for_commit_without_payload(
            &mut store,
            update_render.finished_work(),
            current_text,
            PropsHandle::from_raw(9002),
        );
        let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &update_commit,
            &mut detached_hosts,
        )
        .unwrap();

        assert_eq!(apply.records().len(), 1);
        assert_eq!(apply.records()[0].mutation().fiber(), updated_text);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::RecordedOnly
        );
        assert_eq!(apply.applied_host_call_count(), 0);
        assert_eq!(host.operations(), operations_before_apply);
    }

    #[test]
    fn host_work_does_not_mutate_container_switch_current_or_finish_work() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("div", "detached");
        let current = store.root(root_id).unwrap().current();
        let render = render_test_root(&mut store, root_id, element);

        let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();

        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(result.work_in_progress)
        );

        let operations = host.operations();
        for forbidden in [
            "prepare_for_commit",
            "reset_after_commit",
            "append_child",
            "append_child_to_container",
            "insert_before",
            "insert_in_container_before",
            "remove_child",
            "remove_child_from_container",
            "clear_container",
        ] {
            assert!(
                !operations.contains(&forbidden),
                "host work unexpectedly called {forbidden}"
            );
        }
        assert!(operations.contains(&"append_initial_child"));
    }
}
