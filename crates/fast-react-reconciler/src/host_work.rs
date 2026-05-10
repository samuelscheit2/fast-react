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

use crate::host_nodes::{
    HostNodeMetadata, HostNodeScope, HostNodeStore, HostNodeValidationError, HostNodeViolation,
};
use crate::root_commit::{HostRootMutationApplyRecord, HostRootMutationApplyRecordKind};
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
    FunctionComponentParentTopologyMismatch(Box<FunctionComponentParentTopologyMismatchRecord>),
    UnexpectedExistingChild {
        parent: FiberId,
        child: FiberId,
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
            Self::MissingTestRootElement { .. }
            | Self::ExpectedFiberTag { .. }
            | Self::MissingStateNode { .. }
            | Self::FunctionComponentParentTopologyMismatch(_)
            | Self::UnexpectedExistingChild { .. }
            | Self::InvalidDetachedInstance { .. }
            | Self::InvalidDetachedText { .. }
            | Self::CommitCurrentMismatch { .. } => None,
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

#[derive(Default)]
struct DetachedHostRecords {
    nodes: HostNodeStore<RecordingHost>,
    scopes: Vec<Option<HostNodeScope>>,
    component_updates: Vec<HostComponentUpdatePayload>,
    text_updates: Vec<HostTextUpdatePayload>,
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
    fn insert_instance(&mut self, scope: HostNodeScope, instance: FakeInstance) -> StateNodeHandle {
        let handle = self.nodes.insert_instance(scope, instance);
        self.remember_scope(handle, scope);
        handle
    }

    fn insert_text(&mut self, scope: HostNodeScope, text: FakeTextInstance) -> StateNodeHandle {
        let handle = self.nodes.insert_text(scope, text);
        self.remember_scope(handle, scope);
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

    fn instance_metadata(
        &self,
        handle: StateNodeHandle,
    ) -> Result<HostNodeMetadata, HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::Instance)?;
        Ok(self.nodes.instance_metadata(handle, scope)?)
    }

    fn text_metadata(&self, handle: StateNodeHandle) -> Result<HostNodeMetadata, HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::TextInstance)?;
        Ok(self.nodes.text_metadata(handle, scope)?)
    }

    fn instance_count(&self) -> usize {
        self.nodes.instance_count()
    }

    fn text_count(&self) -> usize {
        self.nodes.text_count()
    }

    fn record_component_update(&mut self, payload: HostComponentUpdatePayload) {
        self.component_updates.push(payload);
    }

    fn record_text_update(&mut self, payload: HostTextUpdatePayload) {
        self.text_updates.push(payload);
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
}

#[derive(Debug)]
pub(crate) struct HostWorkResult {
    root: FiberRootId,
    work_in_progress: FiberId,
    root_child: Option<FiberId>,
    completed_child: Option<FiberId>,
    detached_hosts: DetachedHostRecords,
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

    pub(crate) const fn completed_child(&self) -> Option<FiberId> {
        self.completed_child
    }

    pub(crate) fn detached_instance_count(&self) -> usize {
        self.detached_hosts.instance_count()
    }

    pub(crate) fn detached_text_count(&self) -> usize {
        self.detached_hosts.text_count()
    }

    fn detached_hosts(&self) -> &DetachedHostRecords {
        &self.detached_hosts
    }

    fn detached_hosts_mut(&mut self) -> &mut DetachedHostRecords {
        &mut self.detached_hosts
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct HostComponentUpdatePayload {
    current: FiberId,
    work_in_progress: FiberId,
    state_node: StateNodeHandle,
    old_props: PropsHandle,
    new_props: PropsHandle,
    ty: &'static str,
}

impl HostComponentUpdatePayload {
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
enum TestHostRootMutationHostCall {
    AppendChildToContainer,
    RemoveChild,
    RemoveChildFromContainer,
    CommitUpdate,
    CommitTextUpdate,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TestHostRootMutationApplyStatus {
    Applied(TestHostRootMutationHostCall),
    RecordedOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TestHostRootMutationApplyRecord {
    mutation: HostRootMutationApplyRecord,
    status: TestHostRootMutationApplyStatus,
}

impl TestHostRootMutationApplyRecord {
    #[must_use]
    const fn mutation(self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    const fn status(self) -> TestHostRootMutationApplyStatus {
        self.status
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct TestHostRootMutationApplyResult {
    root: FiberRootId,
    finished_work: FiberId,
    records: Vec<TestHostRootMutationApplyRecord>,
}

impl TestHostRootMutationApplyResult {
    #[must_use]
    const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    fn records(&self) -> &[TestHostRootMutationApplyRecord] {
        &self.records
    }

    #[must_use]
    fn applied_host_call_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| matches!(record.status(), TestHostRootMutationApplyStatus::Applied(_)))
            .count()
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
        HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber => {
            Ok(TestHostRootMutationApplyStatus::RecordedOnly)
        }
    }
}

fn apply_test_host_component_update_record(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    mutation: HostRootMutationApplyRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationApplyStatus, HostWorkError> {
    let Some(payload) = detached_hosts.component_update_payload(mutation) else {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    };
    let scope = detached_hosts.validated_scope(
        store.host_tokens(),
        mutation.state_node(),
        mutation.root(),
        payload.current(),
        HostFiberTokenTarget::Instance,
    )?;
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
    Ok(TestHostRootMutationApplyStatus::Applied(
        TestHostRootMutationHostCall::CommitUpdate,
    ))
}

fn apply_test_host_text_update_record(
    store: &FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    mutation: HostRootMutationApplyRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationApplyStatus, HostWorkError> {
    let Some(payload) = detached_hosts.text_update_payload(mutation) else {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    };
    let scope = detached_hosts.validated_scope(
        store.host_tokens(),
        mutation.state_node(),
        mutation.root(),
        payload.current(),
        HostFiberTokenTarget::TextInstance,
    )?;
    let old_text = payload.old_text().to_owned();
    let new_text = payload.new_text().to_owned();
    let text = detached_hosts
        .nodes
        .text_mut(mutation.state_node(), scope)?;
    host.commit_text_update(text, &old_text, &new_text)?;
    Ok(TestHostRootMutationApplyStatus::Applied(
        TestHostRootMutationHostCall::CommitTextUpdate,
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
    match mutation.tag() {
        FiberTag::HostComponent => {
            let scope = detached_hosts.validated_scope_for_apply_fiber(
                store,
                mutation.state_node(),
                mutation.root(),
                mutation.fiber(),
                HostFiberTokenTarget::Instance,
            )?;
            Ok(OwnedDetachedHostChild::Instance(
                detached_hosts
                    .nodes
                    .instance(mutation.state_node(), scope)?
                    .clone(),
            ))
        }
        FiberTag::HostText => {
            let scope = detached_hosts.validated_scope_for_apply_fiber(
                store,
                mutation.state_node(),
                mutation.root(),
                mutation.fiber(),
                HostFiberTokenTarget::TextInstance,
            )?;
            Ok(OwnedDetachedHostChild::Text(
                detached_hosts
                    .nodes
                    .text(mutation.state_node(), scope)?
                    .clone(),
            ))
        }
        actual => Err(HostWorkError::ExpectedFiberTag {
            fiber: mutation.fiber(),
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
        completed_child: root_child,
        detached_hosts,
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
        completed_child: Some(host_child),
        detached_hosts,
    })
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
        current,
        work_in_progress,
        state_node,
        old_props,
        new_props: element.props(),
        ty: element.ty(),
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
    use crate::host_nodes::HostNodeViolation;
    use crate::test_support::{FakeContainer, FakeHostChild};

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

    fn attach_detached_root_text_for_commit(
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
        store
            .fiber_arena_mut()
            .set_children(host_root, &[fiber])
            .unwrap();
        complete_host_root(store, host_root).unwrap();
        fiber
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
        assert_eq!(root.child_lanes(), Lanes::DEFAULT);
        assert!(root.subtree_flags().contains_all(FiberFlags::PLACEMENT));

        let component_node = store.fiber_arena().get(component).unwrap();
        let text = component_node.child().unwrap();
        assert_eq!(component_node.tag(), FiberTag::HostComponent);
        assert!(component_node.flags().contains_all(FiberFlags::PLACEMENT));
        assert_eq!(component_node.child_lanes(), Lanes::DEFAULT);
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
        assert_eq!(root.child_lanes(), Lanes::DEFAULT);
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
    fn host_work_applies_root_component_update_payload_to_fake_host_config() {
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

        assert_eq!(payload.current(), current_component);
        assert_eq!(payload.state_node(), state_node);
        assert_eq!(payload.old_props(), initial_props);
        assert_eq!(payload.new_props(), next.props());
        assert_eq!(payload.ty(), "section");
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
        let mut expected_operations = operations_before_apply;
        expected_operations.push("commit_update");
        assert_eq!(host.operations(), expected_operations);
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
