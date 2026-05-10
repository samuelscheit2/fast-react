//! Deterministic in-memory mutation test renderer.
//!
//! This crate proves that the canonical `fast-react-host-config` capability
//! traits can be implemented without DOM, native, hydration, persistence, or
//! legacy `HostConfig` behavior. Its root canary delegates create/update/
//! unmount scheduling to `fast-react-reconciler` and exposes a diagnostic
//! HostRoot render/commit handoff, including callback snapshot diagnostics,
//! plus a private committed host-output canary for one HostComponent with one
//! HostText child, private JSON diagnostics for create/update canaries, and
//! private host-node deletion cleanup diagnostics. It still stops before public
//! serialization, act, or public `react-test-renderer` compatibility.

use std::collections::BTreeMap;
use std::error::Error;
use std::fmt::{self, Display, Formatter};
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

use fast_react_host_config::{
    HostCapability, HostCapabilitySet, HostChild, HostChildKind, HostCommit, HostCreation,
    HostError, HostFiberTokenPhase, HostFiberTokenRef, HostFiberTokenTarget,
    HostFiberTokenViolation, HostHandleKind, HostIdentityAndContext, HostMutationViolation,
    HostOperationError, HostParentKind, HostResult, HostTypes, InitialChildrenFinalization,
    MutationHost,
};
use fast_react_reconciler::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostRootCommitRecord,
    HostRootRenderPhaseRecord, RootCommitError, RootElementHandle, RootOptions,
    RootScheduleMicrotaskResult, RootSchedulerError, RootUpdateCallbackHandle, RootUpdateError,
    RootWorkLoopError, ScheduledRootUpdateResult, TestRendererCommittedFiberInspectionError,
    TestRendererCommittedFiberNodeInspection, TestRendererCommittedFiberTreeInspection,
    TestRendererHostOutputCanaryCommitDiagnostics, TestRendererHostOutputCanaryCompletedFibers,
    TestRendererHostOutputCanaryCurrentFibers, TestRendererHostOutputCanaryDeletedFibers,
    TestRendererHostOutputCanaryError, TestRendererHostOutputCanaryFixture,
    TestRendererHostOutputCanaryPreparedFibers, TestRendererHostOutputCanaryUpdatedFibers,
    UpdateContainerResult, commit_finished_host_root, ensure_root_is_scheduled,
    finish_test_renderer_host_output_canary_fibers, inspect_test_renderer_committed_fiber_tree,
    inspect_test_renderer_host_output_canary_commit,
    prepare_test_renderer_host_output_canary_fibers,
    prepare_test_renderer_host_output_unmount_canary_fibers,
    prepare_test_renderer_host_output_update_canary_fibers, process_root_schedule_in_microtask,
    render_host_root_for_lanes, scheduled_roots, update_container, update_container_sync,
};

pub const TEST_RENDERER_NAME: &str = "fast-react-test-renderer";

static NEXT_RENDERER_ID: AtomicU64 = AtomicU64::new(1);
const NESTED_HOST_OUTPUT_FIXTURE_BASE_RAW: u64 = 10_000;

#[derive(Debug)]
pub struct TestRenderer {
    renderer_id: TestRendererId,
    containers: Vec<TestContainerRecord>,
    instances: Vec<TestInstanceRecord>,
    texts: Vec<TestTextRecord>,
}

impl Default for TestRenderer {
    fn default() -> Self {
        Self {
            renderer_id: TestRendererId(NEXT_RENDERER_ID.fetch_add(1, Ordering::Relaxed)),
            containers: Vec::new(),
            instances: Vec::new(),
            texts: Vec::new(),
        }
    }
}

impl TestRenderer {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    pub fn create_container(&mut self) -> TestContainer {
        let container = TestContainer {
            renderer_id: self.renderer_id,
            index: self.containers.len(),
        };
        self.containers.push(TestContainerRecord::default());
        container
    }

    pub fn snapshot_container(
        &self,
        container: &TestContainer,
    ) -> HostResult<TestContainerSnapshot> {
        Ok(TestContainerSnapshot {
            children: self
                .container_record(*container)?
                .children
                .iter()
                .map(|child| self.snapshot_child(*child))
                .collect::<HostResult<_>>()?,
        })
    }

    pub fn snapshot_instance(&self, instance: &TestInstance) -> HostResult<TestElementSnapshot> {
        let record = self.instance_record(*instance)?;

        Ok(TestElementSnapshot {
            element_type: record.element_type.clone(),
            props: record.props.clone(),
            hidden: record.hidden,
            detached: record.detached,
            children: record
                .children
                .iter()
                .map(|child| self.snapshot_child(*child))
                .collect::<HostResult<_>>()?,
        })
    }

    pub fn snapshot_text(&self, text: &TestTextInstance) -> HostResult<TestTextSnapshot> {
        let record = self.text_record(*text)?;

        Ok(TestTextSnapshot {
            text: record.text.clone(),
            hidden: record.hidden,
        })
    }

    fn push_instance(&mut self, element_type: TestElementType, props: TestProps) -> TestInstance {
        let instance = TestInstance {
            renderer_id: self.renderer_id,
            index: self.instances.len(),
        };
        self.instances.push(TestInstanceRecord {
            element_type,
            props,
            children: Vec::new(),
            hidden: false,
            detached: false,
        });
        instance
    }

    fn push_text(&mut self, text: String) -> TestTextInstance {
        let text_instance = TestTextInstance {
            renderer_id: self.renderer_id,
            index: self.texts.len(),
        };
        self.texts.push(TestTextRecord {
            text,
            hidden: false,
        });
        text_instance
    }

    fn snapshot_child(&self, child: TestChildHandle) -> HostResult<TestNodeSnapshot> {
        match child {
            TestChildHandle::Instance(instance) => Ok(TestNodeSnapshot::Element(
                self.snapshot_instance(&instance)?,
            )),
            TestChildHandle::Text(text) => Ok(TestNodeSnapshot::Text(self.snapshot_text(&text)?)),
        }
    }

    fn host_child_to_handle(child: HostChild<'_, Self>) -> TestChildHandle {
        match child {
            HostChild::Instance(instance) => TestChildHandle::Instance(*instance),
            HostChild::Text(text) => TestChildHandle::Text(*text),
        }
    }

    fn append_child_handle(children: &mut Vec<TestChildHandle>, child: TestChildHandle) {
        if let Some(index) = children.iter().position(|existing| *existing == child) {
            children.remove(index);
        }

        children.push(child);
    }

    fn insert_child_handle_before(
        children: &mut Vec<TestChildHandle>,
        child: TestChildHandle,
        before_child: TestChildHandle,
        parent_kind: HostParentKind,
    ) -> HostResult<()> {
        if child == before_child {
            return Ok(());
        }

        if let Some(index) = children.iter().position(|existing| *existing == child) {
            children.remove(index);
        }

        let Some(before_index) = children
            .iter()
            .position(|existing| *existing == before_child)
        else {
            return Err(Self::missing_insertion_target_error(
                parent_kind,
                before_child.kind(),
            ));
        };
        children.insert(before_index, child);
        Ok(())
    }

    fn remove_child_handle(
        children: &mut Vec<TestChildHandle>,
        child: TestChildHandle,
        parent_kind: HostParentKind,
    ) -> HostResult<()> {
        let Some(index) = children.iter().position(|existing| *existing == child) else {
            return Err(Self::missing_removal_target_error(
                parent_kind,
                child.kind(),
            ));
        };
        children.remove(index);
        Ok(())
    }

    fn detach_child_from_all_parents(&mut self, child: TestChildHandle) {
        for container in &mut self.containers {
            container.children.retain(|existing| *existing != child);
        }

        for instance in &mut self.instances {
            instance.children.retain(|existing| *existing != child);
        }
    }

    fn validate_child_handle(&self, child: TestChildHandle) -> HostResult<()> {
        match child {
            TestChildHandle::Instance(instance) => {
                self.instance_record(instance)?;
            }
            TestChildHandle::Text(text) => {
                self.text_record(text)?;
            }
        }
        Ok(())
    }

    fn container_record(&self, container: TestContainer) -> HostResult<&TestContainerRecord> {
        if container.renderer_id != self.renderer_id {
            return Err(Self::invalid_handle_error(HostHandleKind::Container));
        }

        self.containers
            .get(container.index)
            .ok_or_else(|| Self::invalid_handle_error(HostHandleKind::Container))
    }

    fn container_record_mut(
        &mut self,
        container: TestContainer,
    ) -> HostResult<&mut TestContainerRecord> {
        if container.renderer_id != self.renderer_id {
            return Err(Self::invalid_handle_error(HostHandleKind::Container));
        }

        self.containers
            .get_mut(container.index)
            .ok_or_else(|| Self::invalid_handle_error(HostHandleKind::Container))
    }

    fn instance_record(&self, instance: TestInstance) -> HostResult<&TestInstanceRecord> {
        if instance.renderer_id != self.renderer_id {
            return Err(Self::invalid_handle_error(HostHandleKind::Instance));
        }

        self.instances
            .get(instance.index)
            .ok_or_else(|| Self::invalid_handle_error(HostHandleKind::Instance))
    }

    fn instance_record_mut(
        &mut self,
        instance: TestInstance,
    ) -> HostResult<&mut TestInstanceRecord> {
        if instance.renderer_id != self.renderer_id {
            return Err(Self::invalid_handle_error(HostHandleKind::Instance));
        }

        self.instances
            .get_mut(instance.index)
            .ok_or_else(|| Self::invalid_handle_error(HostHandleKind::Instance))
    }

    fn text_record(&self, text: TestTextInstance) -> HostResult<&TestTextRecord> {
        if text.renderer_id != self.renderer_id {
            return Err(Self::invalid_handle_error(HostHandleKind::TextInstance));
        }

        self.texts
            .get(text.index)
            .ok_or_else(|| Self::invalid_handle_error(HostHandleKind::TextInstance))
    }

    fn text_record_mut(&mut self, text: TestTextInstance) -> HostResult<&mut TestTextRecord> {
        if text.renderer_id != self.renderer_id {
            return Err(Self::invalid_handle_error(HostHandleKind::TextInstance));
        }

        self.texts
            .get_mut(text.index)
            .ok_or_else(|| Self::invalid_handle_error(HostHandleKind::TextInstance))
    }

    fn child_attached_to_parent(
        &self,
        parent: TestInstance,
        child: TestChildHandle,
    ) -> HostResult<bool> {
        Ok(self.instance_record(parent)?.children.contains(&child))
    }

    fn child_attached_to_container(
        &self,
        container: TestContainer,
        child: TestChildHandle,
    ) -> HostResult<bool> {
        Ok(self.container_record(container)?.children.contains(&child))
    }

    fn validate_parent_child_mutation(
        &self,
        parent: TestInstance,
        child: TestChildHandle,
    ) -> HostResult<()> {
        self.instance_record(parent)?;
        self.validate_child_handle(child)?;

        let TestChildHandle::Instance(child_instance) = child else {
            return Ok(());
        };

        if child_instance == parent {
            return Err(Self::impossible_mutation_error(
                HostParentKind::Instance,
                HostChildKind::Instance,
                HostMutationViolation::ChildIsParent,
            ));
        }

        if self.instance_contains_descendant(child_instance, parent)? {
            return Err(Self::impossible_mutation_error(
                HostParentKind::Instance,
                HostChildKind::Instance,
                HostMutationViolation::ChildIsAncestorOfParent,
            ));
        }

        Ok(())
    }

    fn instance_contains_descendant(
        &self,
        ancestor: TestInstance,
        descendant: TestInstance,
    ) -> HostResult<bool> {
        let ancestor = self.instance_record(ancestor)?;

        for child in &ancestor.children {
            if let TestChildHandle::Instance(child_instance) = child {
                if *child_instance == descendant {
                    return Ok(true);
                }

                if self.instance_contains_descendant(*child_instance, descendant)? {
                    return Ok(true);
                }
            }
        }

        Ok(false)
    }

    fn invalid_handle_error(handle: HostHandleKind) -> HostError {
        HostOperationError::invalid_handle(TEST_RENDERER_NAME, handle).into()
    }

    fn missing_insertion_target_error(parent: HostParentKind, target: HostChildKind) -> HostError {
        HostOperationError::missing_insertion_target(TEST_RENDERER_NAME, parent, target).into()
    }

    fn missing_removal_target_error(parent: HostParentKind, child: HostChildKind) -> HostError {
        HostOperationError::missing_removal_target(TEST_RENDERER_NAME, parent, child).into()
    }

    fn impossible_mutation_error(
        parent: HostParentKind,
        child: HostChildKind,
        violation: HostMutationViolation,
    ) -> HostError {
        HostOperationError::impossible_mutation(TEST_RENDERER_NAME, parent, child, violation).into()
    }

    fn invalid_fiber_token_error(
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
        violation: HostFiberTokenViolation,
    ) -> HostError {
        HostOperationError::invalid_fiber_token(TEST_RENDERER_NAME, phase, target, violation).into()
    }

    fn validate_fiber_token(
        &self,
        token: HostFiberTokenRef<'_, Self>,
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
    ) -> HostResult<()> {
        if token.phase() != phase {
            return Err(Self::invalid_fiber_token_error(
                token.phase(),
                token.target(),
                HostFiberTokenViolation::WrongPhase,
            ));
        }

        if token.target() != target {
            return Err(Self::invalid_fiber_token_error(
                token.phase(),
                token.target(),
                HostFiberTokenViolation::WrongTarget,
            ));
        }

        let _opaque_token = token.token();
        Ok(())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct TestRendererId(u64);

pub type TestHostFiberToken = u64;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TestContainer {
    renderer_id: TestRendererId,
    index: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TestInstance {
    renderer_id: TestRendererId,
    index: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TestTextInstance {
    renderer_id: TestRendererId,
    index: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct TestElementType {
    name: String,
}

impl TestElementType {
    #[must_use]
    pub fn new(name: impl Into<String>) -> Self {
        Self { name: name.into() }
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.name
    }
}

impl From<&str> for TestElementType {
    fn from(value: &str) -> Self {
        Self::new(value)
    }
}

impl From<String> for TestElementType {
    fn from(value: String) -> Self {
        Self::new(value)
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct TestProps {
    text_content: Option<String>,
    attributes: BTreeMap<String, String>,
}

impl TestProps {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn with_text_content(text: impl Into<String>) -> Self {
        Self {
            text_content: Some(text.into()),
            attributes: BTreeMap::new(),
        }
    }

    #[must_use]
    pub fn with_attribute(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.attributes.insert(name.into(), value.into());
        self
    }

    #[must_use]
    pub fn text_content(&self) -> Option<&str> {
        self.text_content.as_deref()
    }

    #[must_use]
    pub fn attributes(&self) -> &BTreeMap<String, String> {
        &self.attributes
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestUpdatePayload {
    props: TestProps,
}

impl TestUpdatePayload {
    #[must_use]
    pub fn replace_props(props: TestProps) -> Self {
        Self { props }
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct TestHostContext {
    depth: usize,
}

impl TestHostContext {
    #[must_use]
    pub const fn depth(&self) -> usize {
        self.depth
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestCommitState {
    container: TestContainer,
}

impl TestCommitState {
    #[must_use]
    pub const fn container(&self) -> TestContainer {
        self.container
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestContainerSnapshot {
    children: Vec<TestNodeSnapshot>,
}

impl TestContainerSnapshot {
    #[must_use]
    pub fn children(&self) -> &[TestNodeSnapshot] {
        &self.children
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestNodeSnapshot {
    Element(TestElementSnapshot),
    Text(TestTextSnapshot),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestElementSnapshot {
    element_type: TestElementType,
    props: TestProps,
    hidden: bool,
    detached: bool,
    children: Vec<TestNodeSnapshot>,
}

impl TestElementSnapshot {
    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn is_hidden(&self) -> bool {
        self.hidden
    }

    #[must_use]
    pub const fn is_detached(&self) -> bool {
        self.detached
    }

    #[must_use]
    pub fn children(&self) -> &[TestNodeSnapshot] {
        &self.children
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestTextSnapshot {
    text: String,
    hidden: bool,
}

impl TestTextSnapshot {
    #[must_use]
    pub fn text(&self) -> &str {
        &self.text
    }

    #[must_use]
    pub const fn is_hidden(&self) -> bool {
        self.hidden
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
struct TestContainerRecord {
    children: Vec<TestChildHandle>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct TestInstanceRecord {
    element_type: TestElementType,
    props: TestProps,
    children: Vec<TestChildHandle>,
    hidden: bool,
    detached: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct TestTextRecord {
    text: String,
    hidden: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TestChildHandle {
    Instance(TestInstance),
    Text(TestTextInstance),
}

impl TestChildHandle {
    const fn kind(self) -> HostChildKind {
        match self {
            Self::Instance(_) => HostChildKind::Instance,
            Self::Text(_) => HostChildKind::TextInstance,
        }
    }
}

type TestCreateNodeMockCallback = dyn Fn() + Send + Sync + 'static;

#[derive(Clone)]
pub struct TestCreateNodeMock {
    callback: Arc<TestCreateNodeMockCallback>,
}

impl TestCreateNodeMock {
    #[must_use]
    pub fn new(callback: impl Fn() + Send + Sync + 'static) -> Self {
        Self {
            callback: Arc::new(callback),
        }
    }

    fn is_stored(&self) -> bool {
        Arc::strong_count(&self.callback) > 0
    }
}

impl fmt::Debug for TestCreateNodeMock {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str("TestCreateNodeMock { stored callback }")
    }
}

#[derive(Debug, Clone, Default)]
pub struct TestRendererOptions {
    strict_mode: bool,
    create_node_mock: Option<TestCreateNodeMock>,
}

impl TestRendererOptions {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub const fn with_strict_mode(mut self, strict_mode: bool) -> Self {
        self.strict_mode = strict_mode;
        self
    }

    #[must_use]
    pub fn with_create_node_mock(mut self, create_node_mock: TestCreateNodeMock) -> Self {
        self.create_node_mock = Some(create_node_mock);
        self
    }

    #[must_use]
    pub const fn strict_mode(&self) -> bool {
        self.strict_mode
    }

    #[must_use]
    pub fn create_node_mock(&self) -> Option<&TestCreateNodeMock> {
        self.create_node_mock.as_ref()
    }

    #[must_use]
    pub fn has_create_node_mock(&self) -> bool {
        self.create_node_mock
            .as_ref()
            .is_some_and(TestCreateNodeMock::is_stored)
    }

    fn reconciler_options(&self) -> RootOptions {
        RootOptions::new().with_strict_mode(self.strict_mode)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererRootLifecycle {
    Active,
    UnmountScheduled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererRootUpdateKind {
    Create,
    Update,
    Unmount,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct TestRendererHostOutputFixture {
    element: RootElementHandle,
    element_type: TestElementType,
    props: TestProps,
    text: String,
    canary_fixture: TestRendererHostOutputCanaryFixture,
}

impl TestRendererHostOutputFixture {
    fn new(element: RootElementHandle, element_type: TestElementType, text: String) -> Self {
        let base_raw = element.raw();
        Self {
            element,
            element_type,
            props: TestProps::new(),
            text,
            canary_fixture: TestRendererHostOutputCanaryFixture::new(
                base_raw,
                base_raw.saturating_mul(2).saturating_sub(1),
                base_raw.saturating_mul(2),
            ),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct TestRendererCurrentHostOutput {
    fixture: TestRendererHostOutputFixture,
    fibers: TestRendererHostOutputCanaryCurrentFibers,
    instance: TestInstance,
    text: TestTextInstance,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct TestRendererNestedHostOutputFixture {
    element: RootElementHandle,
    outer_element_type: TestElementType,
    outer_props: TestProps,
    inner_element_type: TestElementType,
    inner_props: TestProps,
    text: String,
    outer_canary_fixture: TestRendererHostOutputCanaryFixture,
    inner_canary_fixture: TestRendererHostOutputCanaryFixture,
}

impl TestRendererNestedHostOutputFixture {
    fn new(
        element: RootElementHandle,
        outer_element_type: TestElementType,
        inner_element_type: TestElementType,
        text: String,
    ) -> Self {
        let base_raw = element.raw();
        Self {
            element,
            outer_element_type,
            outer_props: TestProps::new(),
            inner_element_type,
            inner_props: TestProps::new(),
            text,
            outer_canary_fixture: TestRendererHostOutputCanaryFixture::new(
                base_raw,
                base_raw.saturating_mul(3).saturating_sub(2),
                base_raw.saturating_mul(3),
            ),
            inner_canary_fixture: TestRendererHostOutputCanaryFixture::new(
                base_raw.saturating_add(1),
                base_raw.saturating_mul(3).saturating_sub(1),
                base_raw.saturating_mul(3),
            ),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct TestRendererCurrentNestedHostOutput {
    fixture: TestRendererNestedHostOutputFixture,
    outer_fibers: TestRendererHostOutputCanaryCurrentFibers,
    inner_fibers: TestRendererHostOutputCanaryCurrentFibers,
    outer_instance: TestInstance,
    inner_instance: TestInstance,
    text: TestTextInstance,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererHostNodeCleanupTarget {
    Instance,
    Text,
}

impl TestRendererHostNodeCleanupTarget {
    const fn from_host_target(target: HostFiberTokenTarget) -> Option<Self> {
        match target {
            HostFiberTokenTarget::Instance => Some(Self::Instance),
            HostFiberTokenTarget::TextInstance => Some(Self::Text),
            HostFiberTokenTarget::HydratableInstance
            | HostFiberTokenTarget::ActivityBoundary
            | HostFiberTokenTarget::SuspenseBoundary => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererHostNodeCleanupStatus {
    Invalidated,
    AlreadyInactive,
    MissingHostNode,
    MissingStateNode,
    UnsupportedTarget,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererHostNodeCleanupRecord {
    sequence: usize,
    root: FiberRootId,
    deletion_list_index: usize,
    deleted_index: usize,
    subtree_index: usize,
    parent: TestRendererFiberHandleDiagnostics,
    deleted_root: TestRendererFiberHandleDiagnostics,
    fiber: TestRendererFiberHandleDiagnostics,
    state_node_raw: u64,
    token_raw: u64,
    token_phase: HostFiberTokenPhase,
    target: Option<TestRendererHostNodeCleanupTarget>,
    status: TestRendererHostNodeCleanupStatus,
}

impl TestRendererHostNodeCleanupRecord {
    #[must_use]
    pub const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
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
    pub const fn parent(self) -> TestRendererFiberHandleDiagnostics {
        self.parent
    }

    #[must_use]
    pub const fn deleted_root(self) -> TestRendererFiberHandleDiagnostics {
        self.deleted_root
    }

    #[must_use]
    pub const fn fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.fiber
    }

    #[must_use]
    pub const fn state_node_raw(self) -> u64 {
        self.state_node_raw
    }

    #[must_use]
    pub const fn token_raw(self) -> u64 {
        self.token_raw
    }

    #[must_use]
    pub const fn token_phase(self) -> HostFiberTokenPhase {
        self.token_phase
    }

    #[must_use]
    pub const fn target(self) -> Option<TestRendererHostNodeCleanupTarget> {
        self.target
    }

    #[must_use]
    pub const fn status(self) -> TestRendererHostNodeCleanupStatus {
        self.status
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererHostNodeCleanupReport {
    root: FiberRootId,
    records: Vec<TestRendererHostNodeCleanupRecord>,
    active_instance_count: usize,
    active_text_count: usize,
    inactive_instance_count: usize,
    inactive_text_count: usize,
    public_unmount_compatibility_claimed: bool,
}

impl TestRendererHostNodeCleanupReport {
    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub fn records(&self) -> &[TestRendererHostNodeCleanupRecord] {
        &self.records
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub const fn active_instance_count(&self) -> usize {
        self.active_instance_count
    }

    #[must_use]
    pub const fn active_text_count(&self) -> usize {
        self.active_text_count
    }

    #[must_use]
    pub const fn inactive_instance_count(&self) -> usize {
        self.inactive_instance_count
    }

    #[must_use]
    pub const fn inactive_text_count(&self) -> usize {
        self.inactive_text_count
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(&self) -> bool {
        self.public_unmount_compatibility_claimed
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
struct TestRendererHostNodeStore {
    records: Vec<TestRendererHostNodeStoreRecord>,
}

impl TestRendererHostNodeStore {
    fn track_current(
        &mut self,
        current: TestRendererHostOutputCanaryCurrentFibers,
        component_state_node_raw: u64,
        text_state_node_raw: u64,
    ) {
        macro_rules! fiber_handle {
            ($fiber:expr) => {{
                let fiber = $fiber;
                TestRendererFiberHandleDiagnostics {
                    arena_id: fiber.arena_id().get(),
                    slot: fiber.slot().get(),
                    generation: fiber.generation().get(),
                }
            }};
        }

        self.records.push(TestRendererHostNodeStoreRecord {
            root: current.root(),
            fiber: fiber_handle!(current.component()),
            state_node_raw: component_state_node_raw,
            target: TestRendererHostNodeCleanupTarget::Instance,
            active: true,
        });
        self.records.push(TestRendererHostNodeStoreRecord {
            root: current.root(),
            fiber: fiber_handle!(current.text()),
            state_node_raw: text_state_node_raw,
            target: TestRendererHostNodeCleanupTarget::Text,
            active: true,
        });
    }

    fn retarget_current(&mut self, current: TestRendererHostOutputCanaryCurrentFibers) {
        macro_rules! fiber_handle {
            ($fiber:expr) => {{
                let fiber = $fiber;
                TestRendererFiberHandleDiagnostics {
                    arena_id: fiber.arena_id().get(),
                    slot: fiber.slot().get(),
                    generation: fiber.generation().get(),
                }
            }};
        }

        for record in &mut self.records {
            if !record.active || record.root != current.root() {
                continue;
            }
            record.fiber = match record.target {
                TestRendererHostNodeCleanupTarget::Instance => fiber_handle!(current.component()),
                TestRendererHostNodeCleanupTarget::Text => fiber_handle!(current.text()),
            };
        }
    }

    fn apply_cleanup(
        &mut self,
        root: FiberRootId,
        commit: &HostRootCommitRecord,
    ) -> TestRendererHostNodeCleanupReport {
        let mut records = Vec::new();
        for cleanup in commit.host_node_deletion_cleanup_log().records() {
            macro_rules! fiber_handle {
                ($fiber:expr) => {{
                    let fiber = $fiber;
                    TestRendererFiberHandleDiagnostics {
                        arena_id: fiber.arena_id().get(),
                        slot: fiber.slot().get(),
                        generation: fiber.generation().get(),
                    }
                }};
            }

            let target =
                TestRendererHostNodeCleanupTarget::from_host_target(cleanup.token_target());
            let fiber = fiber_handle!(cleanup.fiber());
            let state_node_raw = cleanup.state_node().raw();
            let status = match target {
                Some(_) if state_node_raw == 0 => {
                    TestRendererHostNodeCleanupStatus::MissingStateNode
                }
                Some(target) => self.invalidate(root, fiber, state_node_raw, target),
                None => TestRendererHostNodeCleanupStatus::UnsupportedTarget,
            };
            records.push(TestRendererHostNodeCleanupRecord {
                sequence: cleanup.sequence(),
                root: cleanup.root(),
                deletion_list_index: cleanup.deletion_list_index(),
                deleted_index: cleanup.deleted_index(),
                subtree_index: cleanup.subtree_index(),
                parent: fiber_handle!(cleanup.parent()),
                deleted_root: fiber_handle!(cleanup.deleted_root()),
                fiber,
                state_node_raw,
                token_raw: cleanup.token().raw(),
                token_phase: cleanup.token_phase(),
                target,
                status,
            });
        }

        TestRendererHostNodeCleanupReport {
            root,
            records,
            active_instance_count: self.active_count(TestRendererHostNodeCleanupTarget::Instance),
            active_text_count: self.active_count(TestRendererHostNodeCleanupTarget::Text),
            inactive_instance_count: self
                .inactive_count(TestRendererHostNodeCleanupTarget::Instance),
            inactive_text_count: self.inactive_count(TestRendererHostNodeCleanupTarget::Text),
            public_unmount_compatibility_claimed: commit
                .host_node_deletion_cleanup_log()
                .public_unmount_compatibility_claimed(),
        }
    }

    fn invalidate(
        &mut self,
        root: FiberRootId,
        fiber: TestRendererFiberHandleDiagnostics,
        state_node_raw: u64,
        target: TestRendererHostNodeCleanupTarget,
    ) -> TestRendererHostNodeCleanupStatus {
        if let Some(record) = self.records.iter_mut().find(|record| {
            record.active
                && record.root == root
                && record.fiber == fiber
                && record.state_node_raw == state_node_raw
                && record.target == target
        }) {
            record.active = false;
            return TestRendererHostNodeCleanupStatus::Invalidated;
        }

        if self.records.iter().any(|record| {
            !record.active
                && record.root == root
                && record.fiber == fiber
                && record.state_node_raw == state_node_raw
                && record.target == target
        }) {
            TestRendererHostNodeCleanupStatus::AlreadyInactive
        } else {
            TestRendererHostNodeCleanupStatus::MissingHostNode
        }
    }

    fn active_count(&self, target: TestRendererHostNodeCleanupTarget) -> usize {
        self.records
            .iter()
            .filter(|record| record.target == target && record.active)
            .count()
    }

    fn inactive_count(&self, target: TestRendererHostNodeCleanupTarget) -> usize {
        self.records
            .iter()
            .filter(|record| record.target == target && !record.active)
            .count()
    }

    #[cfg(test)]
    fn active_total(&self) -> usize {
        self.records.iter().filter(|record| record.active).count()
    }

    #[cfg(test)]
    fn inactive_total(&self) -> usize {
        self.records.iter().filter(|record| !record.active).count()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct TestRendererHostNodeStoreRecord {
    root: FiberRootId,
    fiber: TestRendererFiberHandleDiagnostics,
    state_node_raw: u64,
    target: TestRendererHostNodeCleanupTarget,
    active: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererCommittedHostOutput {
    render: HostRootRenderPhaseRecord,
    prepared_fibers: TestRendererHostOutputCanaryPreparedFibers,
    completed_fibers: TestRendererHostOutputCanaryCompletedFibers,
    commit: HostRootCommitRecord,
    fiber_inspection: TestRendererCommittedFiberTreeInspection,
    snapshot: TestContainerSnapshot,
}

impl TestRendererCommittedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn prepared_fibers(&self) -> TestRendererHostOutputCanaryPreparedFibers {
        self.prepared_fibers
    }

    #[must_use]
    pub const fn completed_fibers(&self) -> TestRendererHostOutputCanaryCompletedFibers {
        self.completed_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn fiber_inspection(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.fiber_inspection
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererUpdatedHostOutput {
    render: HostRootRenderPhaseRecord,
    updated_fibers: TestRendererHostOutputCanaryUpdatedFibers,
    commit: HostRootCommitRecord,
    fiber_inspection: TestRendererCommittedFiberTreeInspection,
    commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    previous_snapshot: TestContainerSnapshot,
    snapshot: TestContainerSnapshot,
}

impl TestRendererUpdatedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn updated_fibers(&self) -> TestRendererHostOutputCanaryUpdatedFibers {
        self.updated_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn fiber_inspection(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.fiber_inspection
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererHostParentPlacedHostOutput {
    render: HostRootRenderPhaseRecord,
    commit: HostRootCommitRecord,
    commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    previous_snapshot: TestContainerSnapshot,
    snapshot: TestContainerSnapshot,
    placed_text_snapshot: TestTextSnapshot,
    host_parent_placement_apply_count: usize,
}

impl TestRendererHostParentPlacedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub const fn placed_text_snapshot(&self) -> &TestTextSnapshot {
        &self.placed_text_snapshot
    }

    #[must_use]
    pub const fn host_parent_placement_apply_count(&self) -> usize {
        self.host_parent_placement_apply_count
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererNestedCommittedHostOutput {
    render: HostRootRenderPhaseRecord,
    commit: HostRootCommitRecord,
    commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    snapshot: TestContainerSnapshot,
}

impl TestRendererNestedCommittedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererNestedHostParentPlacedHostOutput {
    render: HostRootRenderPhaseRecord,
    commit: HostRootCommitRecord,
    commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    previous_snapshot: TestContainerSnapshot,
    snapshot: TestContainerSnapshot,
    placed_text_snapshot: TestTextSnapshot,
    nested_parent_state_node_raw: u64,
    placed_text_state_node_raw: u64,
    host_parent_placement_apply_count: usize,
}

impl TestRendererNestedHostParentPlacedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub const fn placed_text_snapshot(&self) -> &TestTextSnapshot {
        &self.placed_text_snapshot
    }

    #[must_use]
    pub const fn nested_parent_state_node_raw(&self) -> u64 {
        self.nested_parent_state_node_raw
    }

    #[must_use]
    pub const fn placed_text_state_node_raw(&self) -> u64 {
        self.placed_text_state_node_raw
    }

    #[must_use]
    pub const fn host_parent_placement_apply_count(&self) -> usize {
        self.host_parent_placement_apply_count
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererUnmountedHostOutput {
    render: HostRootRenderPhaseRecord,
    deleted_fibers: TestRendererHostOutputCanaryDeletedFibers,
    commit: HostRootCommitRecord,
    commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    host_node_cleanup: TestRendererHostNodeCleanupReport,
    previous_snapshot: TestContainerSnapshot,
    snapshot: TestContainerSnapshot,
    detached_instance_snapshot: TestElementSnapshot,
}

impl TestRendererUnmountedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn deleted_fibers(&self) -> TestRendererHostOutputCanaryDeletedFibers {
        self.deleted_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn host_node_cleanup(&self) -> &TestRendererHostNodeCleanupReport {
        &self.host_node_cleanup
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub const fn detached_instance_snapshot(&self) -> &TestElementSnapshot {
        &self.detached_instance_snapshot
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererStableSiblingInsertionApplyKind {
    InsertInContainerBefore,
    InsertionBlocked,
    AppendToContainer,
    Other,
}

impl TestRendererStableSiblingInsertionApplyKind {
    fn from_reconciler_apply_kind(kind: &str) -> Self {
        match kind {
            "insert-placement-in-container-before" => Self::InsertInContainerBefore,
            "record-placement-insertion-blocked" => Self::InsertionBlocked,
            "append-placement-to-container" => Self::AppendToContainer,
            _ => Self::Other,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererStableSiblingInsertionSiblingStatus {
    Append,
    InsertBefore,
    BlockedPendingPlacement,
    BlockedUnsupportedTag,
    BlockedMissingStateNode,
    MissingPlacementSiblingRecord,
    Other,
}

impl TestRendererStableSiblingInsertionSiblingStatus {
    fn from_reconciler_sibling_status(status: &str) -> Self {
        match status {
            "append" => Self::Append,
            "insert-before" => Self::InsertBefore,
            "blocked-pending-placement" => Self::BlockedPendingPlacement,
            "blocked-unsupported-tag" => Self::BlockedUnsupportedTag,
            "blocked-missing-state-node" => Self::BlockedMissingStateNode,
            "missing-placement-sibling-record" => Self::MissingPlacementSiblingRecord,
            _ => Self::Other,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererStableSiblingInsertionMutationStatus {
    AppliedInsertInContainerBefore,
    RecordedOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererStableSiblingInsertionDiagnostics {
    apply_kind: TestRendererStableSiblingInsertionApplyKind,
    sibling_status: TestRendererStableSiblingInsertionSiblingStatus,
    mutation_status: TestRendererStableSiblingInsertionMutationStatus,
    fiber: TestRendererFiberHandleDiagnostics,
    sibling: Option<TestRendererFiberHandleDiagnostics>,
    state_node_raw: u64,
    sibling_state_node_raw: u64,
    can_insert_before: bool,
}

impl TestRendererStableSiblingInsertionDiagnostics {
    #[must_use]
    pub const fn apply_kind(self) -> TestRendererStableSiblingInsertionApplyKind {
        self.apply_kind
    }

    #[must_use]
    pub const fn sibling_status(self) -> TestRendererStableSiblingInsertionSiblingStatus {
        self.sibling_status
    }

    #[must_use]
    pub const fn mutation_status(self) -> TestRendererStableSiblingInsertionMutationStatus {
        self.mutation_status
    }

    #[must_use]
    pub const fn fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.fiber
    }

    #[must_use]
    pub const fn sibling(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.sibling
    }

    #[must_use]
    pub const fn state_node_raw(self) -> u64 {
        self.state_node_raw
    }

    #[must_use]
    pub const fn sibling_state_node_raw(self) -> u64 {
        self.sibling_state_node_raw
    }

    #[must_use]
    pub const fn can_insert_before(self) -> bool {
        self.can_insert_before
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererStableSiblingInsertedHostOutput {
    render: HostRootRenderPhaseRecord,
    stable_fibers: TestRendererHostOutputCanaryUpdatedFibers,
    inserted_fibers: TestRendererHostOutputCanaryCompletedFibers,
    commit: HostRootCommitRecord,
    commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    insertion_diagnostics: TestRendererStableSiblingInsertionDiagnostics,
    previous_snapshot: TestContainerSnapshot,
    snapshot: TestContainerSnapshot,
}

impl TestRendererStableSiblingInsertedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn stable_fibers(&self) -> TestRendererHostOutputCanaryUpdatedFibers {
        self.stable_fibers
    }

    #[must_use]
    pub const fn inserted_fibers(&self) -> TestRendererHostOutputCanaryCompletedFibers {
        self.inserted_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn insertion_diagnostics(&self) -> TestRendererStableSiblingInsertionDiagnostics {
        self.insertion_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererRootScheduledUpdate {
    kind: TestRendererRootUpdateKind,
    element: RootElementHandle,
    container_update: UpdateContainerResult,
    root_schedule: ScheduledRootUpdateResult,
}

impl TestRendererRootScheduledUpdate {
    #[must_use]
    pub const fn kind(&self) -> TestRendererRootUpdateKind {
        self.kind
    }

    #[must_use]
    pub const fn element(&self) -> RootElementHandle {
        self.element
    }

    #[must_use]
    pub const fn container_update(&self) -> &UpdateContainerResult {
        &self.container_update
    }

    #[must_use]
    pub const fn root_schedule(&self) -> ScheduledRootUpdateResult {
        self.root_schedule
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererRootUpdateOutcome {
    Scheduled(TestRendererRootScheduledUpdate),
    IgnoredAfterUnmount,
    AlreadyUnmountScheduled,
}

impl TestRendererRootUpdateOutcome {
    #[must_use]
    pub const fn scheduled(&self) -> Option<&TestRendererRootScheduledUpdate> {
        match self {
            Self::Scheduled(record) => Some(record),
            Self::IgnoredAfterUnmount | Self::AlreadyUnmountScheduled => None,
        }
    }
}

pub const TEST_RENDERER_SERIALIZATION_CANARY_GATE_NAME: &str =
    "fast-react-test-renderer.serialization.private-canary";
pub const TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-json-canary";
pub const TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.private-facade-result";
pub const TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-tree-canary";
pub const TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE: [&str; 3] =
    ["HostRoot", "HostComponent", "HostText"];
pub const TEST_RENDERER_SERIALIZATION_ORACLE_KIND: &str =
    "react-19.2.6-react-test-renderer-serialization-oracle";
pub const TEST_RENDERER_SERIALIZATION_ORACLE_PROBE_MODE_COUNT: usize = 2;
pub const TEST_RENDERER_SERIALIZATION_ORACLE_SCENARIO_COUNT: usize = 7;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererSerializationGateStatus {
    ClosedMissingHostOutput,
    ClosedMissingFiberInspection,
    ReadyForPrivateSerializationDiagnostics,
}

impl TestRendererSerializationGateStatus {
    #[must_use]
    pub const fn is_ready(self) -> bool {
        matches!(self, Self::ReadyForPrivateSerializationDiagnostics)
    }

    #[must_use]
    pub const fn is_closed(self) -> bool {
        !self.is_ready()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererSerializationGateRequirements {
    root_commit_diagnostics_available: bool,
    real_host_output_available: bool,
    committed_fiber_inspection_available: bool,
}

impl TestRendererSerializationGateRequirements {
    #[must_use]
    pub const fn root_commit_diagnostics_available(self) -> bool {
        self.root_commit_diagnostics_available
    }

    #[must_use]
    pub const fn real_host_output_available(self) -> bool {
        self.real_host_output_available
    }

    #[must_use]
    pub const fn committed_fiber_inspection_available(self) -> bool {
        self.committed_fiber_inspection_available
    }

    #[must_use]
    pub const fn private_serialization_ready(self) -> bool {
        self.root_commit_diagnostics_available
            && self.real_host_output_available
            && self.committed_fiber_inspection_available
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererSerializationOracleDiagnostics {
    oracle_kind: &'static str,
    probe_mode_count: usize,
    scenario_count: usize,
    compatibility_claimed: bool,
}

impl TestRendererSerializationOracleDiagnostics {
    #[must_use]
    pub const fn current() -> Self {
        Self {
            oracle_kind: TEST_RENDERER_SERIALIZATION_ORACLE_KIND,
            probe_mode_count: TEST_RENDERER_SERIALIZATION_ORACLE_PROBE_MODE_COUNT,
            scenario_count: TEST_RENDERER_SERIALIZATION_ORACLE_SCENARIO_COUNT,
            compatibility_claimed: false,
        }
    }

    #[must_use]
    pub const fn oracle_kind(self) -> &'static str {
        self.oracle_kind
    }

    #[must_use]
    pub const fn probe_mode_count(self) -> usize {
        self.probe_mode_count
    }

    #[must_use]
    pub const fn scenario_count(self) -> usize {
        self.scenario_count
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererFiberHandleDiagnostics {
    arena_id: u64,
    slot: usize,
    generation: u64,
}

impl TestRendererFiberHandleDiagnostics {
    #[must_use]
    pub const fn arena_id(self) -> u64 {
        self.arena_id
    }

    #[must_use]
    pub const fn slot(self) -> usize {
        self.slot
    }

    #[must_use]
    pub const fn generation(self) -> u64 {
        self.generation
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootUpdateCallbackDiagnostics {
    empty: bool,
    visible_count: usize,
    hidden_count: usize,
    deferred_hidden_count: usize,
}

impl TestRendererRootUpdateCallbackDiagnostics {
    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.empty
    }

    #[must_use]
    pub const fn visible_count(self) -> usize {
        self.visible_count
    }

    #[must_use]
    pub const fn hidden_count(self) -> usize {
        self.hidden_count
    }

    #[must_use]
    pub const fn deferred_hidden_count(self) -> usize {
        self.deferred_hidden_count
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererCommitDiagnostics {
    root: FiberRootId,
    lifecycle: TestRendererRootLifecycle,
    last_update_kind: Option<TestRendererRootUpdateKind>,
    last_scheduled_element: Option<RootElementHandle>,
    previous_current: TestRendererFiberHandleDiagnostics,
    current: TestRendererFiberHandleDiagnostics,
    finished_work: TestRendererFiberHandleDiagnostics,
    finished_lanes_empty: bool,
    finished_lanes_include_sync: bool,
    remaining_lanes_empty: bool,
    pending_lanes_empty: bool,
    has_remaining_work: bool,
    root_update_callbacks: TestRendererRootUpdateCallbackDiagnostics,
}

impl TestRendererCommitDiagnostics {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn lifecycle(self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn last_update_kind(self) -> Option<TestRendererRootUpdateKind> {
        self.last_update_kind
    }

    #[must_use]
    pub const fn last_scheduled_element(self) -> Option<RootElementHandle> {
        self.last_scheduled_element
    }

    #[must_use]
    pub const fn previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.previous_current
    }

    #[must_use]
    pub const fn current(self) -> TestRendererFiberHandleDiagnostics {
        self.current
    }

    #[must_use]
    pub const fn finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.finished_work
    }

    #[must_use]
    pub const fn finished_lanes_empty(self) -> bool {
        self.finished_lanes_empty
    }

    #[must_use]
    pub const fn finished_lanes_include_sync(self) -> bool {
        self.finished_lanes_include_sync
    }

    #[must_use]
    pub const fn remaining_lanes_empty(self) -> bool {
        self.remaining_lanes_empty
    }

    #[must_use]
    pub const fn pending_lanes_empty(self) -> bool {
        self.pending_lanes_empty
    }

    #[must_use]
    pub const fn has_remaining_work(self) -> bool {
        self.has_remaining_work
    }

    #[must_use]
    pub const fn root_update_callbacks(self) -> TestRendererRootUpdateCallbackDiagnostics {
        self.root_update_callbacks
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererHostOutputDiagnostics {
    container_child_count: usize,
    instance_count: usize,
    text_count: usize,
    real_host_output_available: bool,
}

impl TestRendererHostOutputDiagnostics {
    #[must_use]
    pub const fn container_child_count(self) -> usize {
        self.container_child_count
    }

    #[must_use]
    pub const fn instance_count(self) -> usize {
        self.instance_count
    }

    #[must_use]
    pub const fn text_count(self) -> usize {
        self.text_count
    }

    #[must_use]
    pub const fn real_host_output_available(self) -> bool {
        self.real_host_output_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererSerializationGateReport {
    gate_name: &'static str,
    status: TestRendererSerializationGateStatus,
    requirements: TestRendererSerializationGateRequirements,
    oracle: TestRendererSerializationOracleDiagnostics,
    commit: TestRendererCommitDiagnostics,
    host_output: TestRendererHostOutputDiagnostics,
    fiber_inspection: Option<Box<TestRendererCommittedFiberTreeInspection>>,
}

impl TestRendererSerializationGateReport {
    #[must_use]
    pub const fn gate_name(&self) -> &'static str {
        self.gate_name
    }

    #[must_use]
    pub const fn status(&self) -> TestRendererSerializationGateStatus {
        self.status
    }

    #[must_use]
    pub const fn is_ready(&self) -> bool {
        self.status.is_ready()
    }

    #[must_use]
    pub const fn is_closed(&self) -> bool {
        self.status.is_closed()
    }

    #[must_use]
    pub const fn requirements(&self) -> TestRendererSerializationGateRequirements {
        self.requirements
    }

    #[must_use]
    pub const fn oracle(&self) -> TestRendererSerializationOracleDiagnostics {
        self.oracle
    }

    #[must_use]
    pub const fn commit(&self) -> TestRendererCommitDiagnostics {
        self.commit
    }

    #[must_use]
    pub const fn host_output(&self) -> TestRendererHostOutputDiagnostics {
        self.host_output
    }

    #[must_use]
    pub fn fiber_inspection(&self) -> Option<&TestRendererCommittedFiberTreeInspection> {
        self.fiber_inspection.as_deref()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateJsonNodeKind {
    HostComponent,
    Text,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateJsonPublicSurfaceBlockers {
    json_method_blocked: bool,
    tree_method_blocked: bool,
    instance_wrapper_blocked: bool,
    js_facade_routing_blocked: bool,
    public_act_blocked: bool,
    compatibility_claim_blocked: bool,
}

impl TestRendererPrivateJsonPublicSurfaceBlockers {
    #[must_use]
    pub const fn blocked() -> Self {
        Self {
            json_method_blocked: true,
            tree_method_blocked: true,
            instance_wrapper_blocked: true,
            js_facade_routing_blocked: true,
            public_act_blocked: true,
            compatibility_claim_blocked: true,
        }
    }

    #[must_use]
    pub const fn json_method_blocked(self) -> bool {
        self.json_method_blocked
    }

    #[must_use]
    pub const fn tree_method_blocked(self) -> bool {
        self.tree_method_blocked
    }

    #[must_use]
    pub const fn instance_wrapper_blocked(self) -> bool {
        self.instance_wrapper_blocked
    }

    #[must_use]
    pub const fn js_facade_routing_blocked(self) -> bool {
        self.js_facade_routing_blocked
    }

    #[must_use]
    pub const fn public_act_blocked(self) -> bool {
        self.public_act_blocked
    }

    #[must_use]
    pub const fn compatibility_claim_blocked(self) -> bool {
        self.compatibility_claim_blocked
    }

    #[must_use]
    pub const fn all_blocked(self) -> bool {
        self.json_method_blocked
            && self.tree_method_blocked
            && self.instance_wrapper_blocked
            && self.js_facade_routing_blocked
            && self.public_act_blocked
            && self.compatibility_claim_blocked
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateJsonFiberDiagnostic {
    fiber: TestRendererFiberHandleDiagnostics,
    parent: Option<TestRendererFiberHandleDiagnostics>,
    child: Option<TestRendererFiberHandleDiagnostics>,
    sibling: Option<TestRendererFiberHandleDiagnostics>,
    index: usize,
    alternate: Option<TestRendererFiberHandleDiagnostics>,
    pending_props_raw: u64,
    memoized_props_raw: u64,
    lanes_bits: u32,
    child_lanes_bits: u32,
    flags_bits: u32,
    subtree_flags_bits: u32,
    state_node_present: bool,
}

impl TestRendererPrivateJsonFiberDiagnostic {
    #[must_use]
    pub const fn fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.fiber
    }

    #[must_use]
    pub const fn parent(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.parent
    }

    #[must_use]
    pub const fn child(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.child
    }

    #[must_use]
    pub const fn sibling(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.sibling
    }

    #[must_use]
    pub const fn index(self) -> usize {
        self.index
    }

    #[must_use]
    pub const fn alternate(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.alternate
    }

    #[must_use]
    pub const fn pending_props_raw(self) -> u64 {
        self.pending_props_raw
    }

    #[must_use]
    pub const fn memoized_props_raw(self) -> u64 {
        self.memoized_props_raw
    }

    #[must_use]
    pub const fn lanes_bits(self) -> u32 {
        self.lanes_bits
    }

    #[must_use]
    pub const fn child_lanes_bits(self) -> u32 {
        self.child_lanes_bits
    }

    #[must_use]
    pub const fn flags_bits(self) -> u32 {
        self.flags_bits
    }

    #[must_use]
    pub const fn subtree_flags_bits(self) -> u32 {
        self.subtree_flags_bits
    }

    #[must_use]
    pub const fn state_node_present(self) -> bool {
        self.state_node_present
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonNodeDiagnostic {
    ordinal: usize,
    node_kind: TestRendererPrivateJsonNodeKind,
    parent_ordinal: Option<usize>,
    child_ordinals: Vec<usize>,
    fiber: TestRendererPrivateJsonFiberDiagnostic,
    element_type: Option<TestElementType>,
    props: Option<TestProps>,
    text: Option<String>,
    hidden: bool,
    detached: bool,
}

impl TestRendererPrivateJsonNodeDiagnostic {
    #[must_use]
    pub const fn ordinal(&self) -> usize {
        self.ordinal
    }

    #[must_use]
    pub const fn node_kind(&self) -> TestRendererPrivateJsonNodeKind {
        self.node_kind
    }

    #[must_use]
    pub const fn parent_ordinal(&self) -> Option<usize> {
        self.parent_ordinal
    }

    #[must_use]
    pub fn child_ordinals(&self) -> &[usize] {
        &self.child_ordinals
    }

    #[must_use]
    pub fn child_count(&self) -> usize {
        self.child_ordinals.len()
    }

    #[must_use]
    pub const fn fiber(&self) -> TestRendererPrivateJsonFiberDiagnostic {
        self.fiber
    }

    #[must_use]
    pub fn element_type(&self) -> Option<&TestElementType> {
        self.element_type.as_ref()
    }

    #[must_use]
    pub fn props(&self) -> Option<&TestProps> {
        self.props.as_ref()
    }

    #[must_use]
    pub fn text(&self) -> Option<&str> {
        self.text.as_deref()
    }

    #[must_use]
    pub const fn is_hidden(&self) -> bool {
        self.hidden
    }

    #[must_use]
    pub const fn is_detached(&self) -> bool {
        self.detached
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonTextDiagnostic {
    text: String,
    hidden: bool,
}

impl TestRendererPrivateJsonTextDiagnostic {
    #[must_use]
    pub fn text(&self) -> &str {
        &self.text
    }

    #[must_use]
    pub const fn node_kind(&self) -> TestRendererPrivateJsonNodeKind {
        TestRendererPrivateJsonNodeKind::Text
    }

    #[must_use]
    pub const fn is_hidden(&self) -> bool {
        self.hidden
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonHostComponentDiagnostic {
    element_type: TestElementType,
    props: TestProps,
    hidden: bool,
    detached: bool,
    child_count: usize,
    text_child: TestRendererPrivateJsonTextDiagnostic,
}

impl TestRendererPrivateJsonHostComponentDiagnostic {
    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn node_kind(&self) -> TestRendererPrivateJsonNodeKind {
        TestRendererPrivateJsonNodeKind::HostComponent
    }

    #[must_use]
    pub const fn is_hidden(&self) -> bool {
        self.hidden
    }

    #[must_use]
    pub const fn is_detached(&self) -> bool {
        self.detached
    }

    #[must_use]
    pub const fn child_count(&self) -> usize {
        self.child_count
    }

    #[must_use]
    pub const fn text_child(&self) -> &TestRendererPrivateJsonTextDiagnostic {
        &self.text_child
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonFacadeResult {
    diagnostic_name: &'static str,
    source_diagnostic_name: &'static str,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_snapshot_current: bool,
    element_type: TestElementType,
    props: TestProps,
    children: Vec<String>,
    source_node_count: usize,
    public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    public_serialization_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonFacadeResult {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_diagnostic_name(&self) -> &'static str {
        self.source_diagnostic_name
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub fn children(&self) -> &[String] {
        &self.children
    }

    #[must_use]
    pub const fn child_count(&self) -> usize {
        self.children.len()
    }

    #[must_use]
    pub const fn source_node_count(&self) -> usize {
        self.source_node_count
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonSerializationReport {
    diagnostic_name: &'static str,
    gate: TestRendererSerializationGateReport,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_snapshot_current: bool,
    root_child_count: usize,
    root_node_kind: TestRendererPrivateJsonNodeKind,
    nodes: Vec<TestRendererPrivateJsonNodeDiagnostic>,
    component: TestRendererPrivateJsonHostComponentDiagnostic,
    public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
}

impl TestRendererPrivateJsonSerializationReport {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn gate(&self) -> &TestRendererSerializationGateReport {
        &self.gate
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn root_node_kind(&self) -> TestRendererPrivateJsonNodeKind {
        self.root_node_kind
    }

    #[must_use]
    pub fn nodes(&self) -> &[TestRendererPrivateJsonNodeDiagnostic] {
        &self.nodes
    }

    #[must_use]
    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    #[must_use]
    pub const fn component(&self) -> &TestRendererPrivateJsonHostComponentDiagnostic {
        &self.component
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateTreeNodeType {
    Host,
}

impl TestRendererPrivateTreeNodeType {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Host => "host",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeHostRootDiagnostic {
    fiber_tag: &'static str,
    delegates_to_child: bool,
    child_fiber_tag: &'static str,
    public_tree_object_available: bool,
}

impl TestRendererPrivateTreeHostRootDiagnostic {
    #[must_use]
    pub const fn fiber_tag(&self) -> &'static str {
        self.fiber_tag
    }

    #[must_use]
    pub const fn delegates_to_child(&self) -> bool {
        self.delegates_to_child
    }

    #[must_use]
    pub const fn child_fiber_tag(&self) -> &'static str {
        self.child_fiber_tag
    }

    #[must_use]
    pub const fn public_tree_object_available(&self) -> bool {
        self.public_tree_object_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeHostTextDiagnostic {
    fiber_tag: &'static str,
    text: String,
    returns_text_value: bool,
    public_tree_object_available: bool,
}

impl TestRendererPrivateTreeHostTextDiagnostic {
    #[must_use]
    pub const fn fiber_tag(&self) -> &'static str {
        self.fiber_tag
    }

    #[must_use]
    pub fn text(&self) -> &str {
        &self.text
    }

    #[must_use]
    pub const fn returns_text_value(&self) -> bool {
        self.returns_text_value
    }

    #[must_use]
    pub const fn public_tree_object_available(&self) -> bool {
        self.public_tree_object_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeHostComponentDiagnostic {
    fiber_tag: &'static str,
    node_type: TestRendererPrivateTreeNodeType,
    element_type: TestElementType,
    props: TestProps,
    instance_available: bool,
    rendered_child_count: usize,
    rendered_text: String,
    public_tree_object_available: bool,
}

impl TestRendererPrivateTreeHostComponentDiagnostic {
    #[must_use]
    pub const fn fiber_tag(&self) -> &'static str {
        self.fiber_tag
    }

    #[must_use]
    pub const fn node_type(&self) -> TestRendererPrivateTreeNodeType {
        self.node_type
    }

    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn instance_available(&self) -> bool {
        self.instance_available
    }

    #[must_use]
    pub const fn rendered_child_count(&self) -> usize {
        self.rendered_child_count
    }

    #[must_use]
    pub fn rendered_text(&self) -> &str {
        &self.rendered_text
    }

    #[must_use]
    pub const fn public_tree_object_available(&self) -> bool {
        self.public_tree_object_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeMetadataReport {
    diagnostic_name: &'static str,
    source_json_diagnostic_name: &'static str,
    gate: TestRendererSerializationGateReport,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_snapshot_current: bool,
    accepted_fiber_shape: [&'static str; 3],
    root_child_count: usize,
    host_root: TestRendererPrivateTreeHostRootDiagnostic,
    host_component: TestRendererPrivateTreeHostComponentDiagnostic,
    host_text: TestRendererPrivateTreeHostTextDiagnostic,
    public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    public_tree_object_available: bool,
}

impl TestRendererPrivateTreeMetadataReport {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_json_diagnostic_name(&self) -> &'static str {
        self.source_json_diagnostic_name
    }

    #[must_use]
    pub const fn gate(&self) -> &TestRendererSerializationGateReport {
        &self.gate
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn accepted_fiber_shape(&self) -> &[&'static str; 3] {
        &self.accepted_fiber_shape
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn host_root(&self) -> &TestRendererPrivateTreeHostRootDiagnostic {
        &self.host_root
    }

    #[must_use]
    pub const fn host_component(&self) -> &TestRendererPrivateTreeHostComponentDiagnostic {
        &self.host_component
    }

    #[must_use]
    pub const fn host_text(&self) -> &TestRendererPrivateTreeHostTextDiagnostic {
        &self.host_text
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_tree_object_available(&self) -> bool {
        self.public_tree_object_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererSerializationGateError {
    CommitRootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    CommitIsNotCurrent {
        root: FiberRootId,
        expected_current: TestRendererFiberHandleDiagnostics,
        actual_current: TestRendererFiberHandleDiagnostics,
    },
    Closed(TestRendererSerializationGateReport),
}

impl TestRendererSerializationGateError {
    #[must_use]
    pub const fn report(&self) -> Option<&TestRendererSerializationGateReport> {
        match self {
            Self::Closed(report) => Some(report),
            Self::CommitRootMismatch { .. } | Self::CommitIsNotCurrent { .. } => None,
        }
    }
}

impl Display for TestRendererSerializationGateError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::CommitRootMismatch { expected, actual } => write!(
                formatter,
                "serialization gate commit root {} does not match test renderer root {}",
                actual.raw(),
                expected.raw()
            ),
            Self::CommitIsNotCurrent {
                root,
                expected_current,
                actual_current,
            } => write!(
                formatter,
                "serialization gate commit fiber slot {} is not current for root {}; current slot is {}",
                expected_current.slot(),
                root.raw(),
                actual_current.slot()
            ),
            Self::Closed(report) => write!(
                formatter,
                "serialization gate '{}' is closed for root {} with status {:?}",
                report.gate_name(),
                report.commit().root().raw(),
                report.status()
            ),
        }
    }
}

impl Error for TestRendererSerializationGateError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateJsonSerializationError {
    HostOutputSnapshotStale,
    CommittedFiberInspectionMissing,
    CommittedFiberInspectionStale,
    CommittedFiberMismatch {
        node_kind: TestRendererPrivateJsonNodeKind,
    },
    CanaryFixtureRawMismatch {
        node_kind: TestRendererPrivateJsonNodeKind,
        field: &'static str,
        expected: u64,
        actual: u64,
    },
    RootChildCount {
        actual: usize,
    },
    RootChildIsText,
    HostComponentChildCount {
        element_type: TestElementType,
        actual: usize,
    },
    HostComponentChildIsElement {
        element_type: TestElementType,
    },
}

impl Display for TestRendererPrivateJsonSerializationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::HostOutputSnapshotStale => formatter.write_str(
                "private JSON serialization canary snapshot is not the current host output",
            ),
            Self::CommittedFiberInspectionMissing => formatter
                .write_str("private JSON serialization canary has no committed fiber inspection"),
            Self::CommittedFiberInspectionStale => formatter.write_str(
                "private JSON serialization canary committed fiber inspection is not current",
            ),
            Self::CommittedFiberMismatch { node_kind } => write!(
                formatter,
                "private JSON serialization canary committed {:?} fiber does not match the host-output canary",
                node_kind
            ),
            Self::CanaryFixtureRawMismatch {
                node_kind,
                field,
                expected,
                actual,
            } => write!(
                formatter,
                "private JSON serialization canary committed {:?} fiber {field} raw handle {actual} does not match fixture raw handle {expected}",
                node_kind
            ),
            Self::RootChildCount { actual } => write!(
                formatter,
                "private JSON serialization canary expected exactly one root child, found {actual}",
            ),
            Self::RootChildIsText => formatter.write_str(
                "private JSON serialization canary expected a root host component, found text",
            ),
            Self::HostComponentChildCount {
                element_type,
                actual,
            } => write!(
                formatter,
                "private JSON serialization canary expected host component '{}' to have exactly one text child, found {actual}",
                element_type.as_str()
            ),
            Self::HostComponentChildIsElement { element_type } => write!(
                formatter,
                "private JSON serialization canary expected host component '{}' child to be text, found host component",
                element_type.as_str()
            ),
        }
    }
}

impl Error for TestRendererPrivateJsonSerializationError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererStableSiblingInsertionCanaryError {
    MissingPlacementRecord,
    MultiplePlacementRecords { actual: usize },
    UnexpectedInsertedFiber,
    UnexpectedStableSibling,
}

impl Display for TestRendererStableSiblingInsertionCanaryError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingPlacementRecord => formatter.write_str(
                "stable-sibling insertion canary found no HostRoot placement apply record",
            ),
            Self::MultiplePlacementRecords { actual } => write!(
                formatter,
                "stable-sibling insertion canary expected one HostRoot placement apply record, found {actual}",
            ),
            Self::UnexpectedInsertedFiber => formatter.write_str(
                "stable-sibling insertion canary placement record does not target the inserted fiber",
            ),
            Self::UnexpectedStableSibling => formatter.write_str(
                "stable-sibling insertion canary placement record does not target the stable sibling",
            ),
        }
    }
}

impl Error for TestRendererStableSiblingInsertionCanaryError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererRootError {
    Host(HostError),
    FiberRootStore(FiberRootStoreError),
    RootUpdate(RootUpdateError),
    RootScheduler(RootSchedulerError),
    RootWorkLoop(RootWorkLoopError),
    RootCommit(RootCommitError),
    SerializationGate(Box<TestRendererSerializationGateError>),
    PrivateJsonSerialization(Box<TestRendererPrivateJsonSerializationError>),
    StableSiblingInsertionCanary(Box<TestRendererStableSiblingInsertionCanaryError>),
    HostOutputCanary(TestRendererHostOutputCanaryError),
    FiberInspection(TestRendererCommittedFiberInspectionError),
    MissingHostOutputFixture {
        element: RootElementHandle,
    },
    MissingCommittedHostOutput {
        operation: TestRendererRootUpdateKind,
    },
    MissingHostParentPlacementApply {
        parent_state_node_raw: u64,
        child_state_node_raw: u64,
    },
    MissingHostTextUpdateApply {
        current_text_slot: usize,
        updated_text_slot: usize,
        text_state_node_raw: u64,
    },
    UnexpectedHostOutputUpdateKind {
        expected: TestRendererRootUpdateKind,
        actual: TestRendererRootUpdateKind,
    },
}

impl Display for TestRendererRootError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Host(error) => Display::fmt(error, formatter),
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::RootUpdate(error) => Display::fmt(error, formatter),
            Self::RootScheduler(error) => Display::fmt(error, formatter),
            Self::RootWorkLoop(error) => Display::fmt(error, formatter),
            Self::RootCommit(error) => Display::fmt(error, formatter),
            Self::SerializationGate(error) => Display::fmt(error, formatter),
            Self::PrivateJsonSerialization(error) => Display::fmt(error, formatter),
            Self::StableSiblingInsertionCanary(error) => Display::fmt(error, formatter),
            Self::HostOutputCanary(error) => Display::fmt(error, formatter),
            Self::FiberInspection(error) => Display::fmt(error, formatter),
            Self::MissingHostOutputFixture { element } => write!(
                formatter,
                "test-renderer host-output canary has no fixture for root element {}",
                element.raw()
            ),
            Self::MissingCommittedHostOutput { operation } => write!(
                formatter,
                "test-renderer host-output canary cannot {:?} without committed host output",
                operation
            ),
            Self::MissingHostParentPlacementApply {
                parent_state_node_raw,
                child_state_node_raw,
            } => write!(
                formatter,
                "test-renderer host-output canary did not receive a host-parent placement apply record for parent state node {parent_state_node_raw} and child state node {child_state_node_raw}",
            ),
            Self::MissingHostTextUpdateApply {
                current_text_slot,
                updated_text_slot,
                text_state_node_raw,
            } => write!(
                formatter,
                "test-renderer host-output canary did not receive a HostText update apply record from current text fiber slot {current_text_slot} to updated text fiber slot {updated_text_slot} for state node {text_state_node_raw}",
            ),
            Self::UnexpectedHostOutputUpdateKind { expected, actual } => write!(
                formatter,
                "test-renderer host-output canary expected a {:?} update, found {:?}",
                expected, actual
            ),
        }
    }
}

impl Error for TestRendererRootError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Host(error) => Some(error),
            Self::FiberRootStore(error) => Some(error),
            Self::RootUpdate(error) => Some(error),
            Self::RootScheduler(error) => Some(error),
            Self::RootWorkLoop(error) => Some(error),
            Self::RootCommit(error) => Some(error),
            Self::SerializationGate(error) => Some(error),
            Self::PrivateJsonSerialization(error) => Some(error),
            Self::StableSiblingInsertionCanary(error) => Some(error),
            Self::HostOutputCanary(error) => Some(error),
            Self::FiberInspection(error) => Some(error),
            Self::MissingHostOutputFixture { .. }
            | Self::MissingCommittedHostOutput { .. }
            | Self::MissingHostParentPlacementApply { .. }
            | Self::MissingHostTextUpdateApply { .. }
            | Self::UnexpectedHostOutputUpdateKind { .. } => None,
        }
    }
}

impl From<HostError> for TestRendererRootError {
    fn from(error: HostError) -> Self {
        Self::Host(error)
    }
}

impl From<FiberRootStoreError> for TestRendererRootError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<RootUpdateError> for TestRendererRootError {
    fn from(error: RootUpdateError) -> Self {
        Self::RootUpdate(error)
    }
}

impl From<RootSchedulerError> for TestRendererRootError {
    fn from(error: RootSchedulerError) -> Self {
        Self::RootScheduler(error)
    }
}

impl From<RootWorkLoopError> for TestRendererRootError {
    fn from(error: RootWorkLoopError) -> Self {
        Self::RootWorkLoop(error)
    }
}

impl From<RootCommitError> for TestRendererRootError {
    fn from(error: RootCommitError) -> Self {
        Self::RootCommit(error)
    }
}

impl From<TestRendererSerializationGateError> for TestRendererRootError {
    fn from(error: TestRendererSerializationGateError) -> Self {
        Self::SerializationGate(Box::new(error))
    }
}

impl From<TestRendererPrivateJsonSerializationError> for TestRendererRootError {
    fn from(error: TestRendererPrivateJsonSerializationError) -> Self {
        Self::PrivateJsonSerialization(Box::new(error))
    }
}

impl From<TestRendererStableSiblingInsertionCanaryError> for TestRendererRootError {
    fn from(error: TestRendererStableSiblingInsertionCanaryError) -> Self {
        Self::StableSiblingInsertionCanary(Box::new(error))
    }
}

impl From<TestRendererHostOutputCanaryError> for TestRendererRootError {
    fn from(error: TestRendererHostOutputCanaryError) -> Self {
        Self::HostOutputCanary(error)
    }
}

impl From<TestRendererCommittedFiberInspectionError> for TestRendererRootError {
    fn from(error: TestRendererCommittedFiberInspectionError) -> Self {
        Self::FiberInspection(error)
    }
}

pub struct TestRendererRoot {
    renderer: TestRenderer,
    container: TestContainer,
    store: FiberRootStore<TestRenderer>,
    root_id: FiberRootId,
    options: TestRendererOptions,
    lifecycle: TestRendererRootLifecycle,
    scheduled_updates: Vec<TestRendererRootScheduledUpdate>,
    host_output_fixtures: Vec<TestRendererHostOutputFixture>,
    nested_host_output_fixtures: Vec<TestRendererNestedHostOutputFixture>,
    host_nodes: TestRendererHostNodeStore,
    current_host_output: Option<TestRendererCurrentHostOutput>,
    current_nested_host_output: Option<TestRendererCurrentNestedHostOutput>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum StableSiblingInsertionCanaryMode {
    StableCommittedSibling,
    AmbiguousMissingSiblingStateNode,
}

impl TestRendererRoot {
    pub fn create(
        element: RootElementHandle,
        options: TestRendererOptions,
    ) -> Result<Self, TestRendererRootError> {
        Self::create_with_root_update_callback(element, options, None)
    }

    pub fn create_with_root_update_callback_for_canary(
        element: RootElementHandle,
        options: TestRendererOptions,
        callback: RootUpdateCallbackHandle,
    ) -> Result<Self, TestRendererRootError> {
        Self::create_with_root_update_callback(element, options, Some(callback))
    }

    pub fn create_host_component_with_text_for_canary(
        element_type: impl Into<TestElementType>,
        text: impl Into<String>,
        options: TestRendererOptions,
    ) -> Result<Self, TestRendererRootError> {
        let mut root = Self::new_without_initial_update(options)?;
        let element = root.push_host_output_fixture_for_canary(element_type.into(), text.into());
        let record =
            root.schedule_root_update(TestRendererRootUpdateKind::Create, element, None)?;
        root.scheduled_updates.push(record);
        Ok(root)
    }

    pub fn create_nested_host_components_with_text_for_canary(
        outer_element_type: impl Into<TestElementType>,
        inner_element_type: impl Into<TestElementType>,
        text: impl Into<String>,
        options: TestRendererOptions,
    ) -> Result<Self, TestRendererRootError> {
        let mut root = Self::new_without_initial_update(options)?;
        let element = root.push_nested_host_output_fixture_for_canary(
            outer_element_type.into(),
            inner_element_type.into(),
            text.into(),
        );
        let record =
            root.schedule_root_update(TestRendererRootUpdateKind::Create, element, None)?;
        root.scheduled_updates.push(record);
        Ok(root)
    }

    fn create_with_root_update_callback(
        element: RootElementHandle,
        options: TestRendererOptions,
        callback: Option<RootUpdateCallbackHandle>,
    ) -> Result<Self, TestRendererRootError> {
        let mut root = Self::new_without_initial_update(options)?;

        let record =
            root.schedule_root_update(TestRendererRootUpdateKind::Create, element, callback)?;
        root.scheduled_updates.push(record);
        Ok(root)
    }

    fn new_without_initial_update(
        options: TestRendererOptions,
    ) -> Result<Self, TestRendererRootError> {
        let mut renderer = TestRenderer::new();
        let container = renderer.create_container();
        let mut store = FiberRootStore::<TestRenderer>::new();
        let root_id = store.create_client_root(container, options.reconciler_options())?;
        Ok(Self {
            renderer,
            container,
            store,
            root_id,
            options,
            lifecycle: TestRendererRootLifecycle::Active,
            scheduled_updates: Vec::new(),
            host_output_fixtures: Vec::new(),
            nested_host_output_fixtures: Vec::new(),
            host_nodes: TestRendererHostNodeStore::default(),
            current_host_output: None,
            current_nested_host_output: None,
        })
    }

    pub fn update(
        &mut self,
        element: RootElementHandle,
    ) -> Result<TestRendererRootUpdateOutcome, TestRendererRootError> {
        self.update_with_root_update_callback(element, None)
    }

    pub fn update_with_root_update_callback_for_canary(
        &mut self,
        element: RootElementHandle,
        callback: RootUpdateCallbackHandle,
    ) -> Result<TestRendererRootUpdateOutcome, TestRendererRootError> {
        self.update_with_root_update_callback(element, Some(callback))
    }

    pub fn update_host_component_with_text_for_canary(
        &mut self,
        element_type: impl Into<TestElementType>,
        text: impl Into<String>,
    ) -> Result<TestRendererRootUpdateOutcome, TestRendererRootError> {
        if !matches!(self.lifecycle, TestRendererRootLifecycle::Active) {
            return Ok(TestRendererRootUpdateOutcome::IgnoredAfterUnmount);
        }

        let element = self.push_host_output_fixture_for_canary(element_type.into(), text.into());
        let record =
            self.schedule_root_update(TestRendererRootUpdateKind::Update, element, None)?;
        self.scheduled_updates.push(record.clone());
        Ok(TestRendererRootUpdateOutcome::Scheduled(record))
    }

    pub fn insert_host_component_with_text_before_stable_sibling_for_canary(
        &mut self,
        element_type: impl Into<TestElementType>,
        text: impl Into<String>,
    ) -> Result<TestRendererRootUpdateOutcome, TestRendererRootError> {
        if !matches!(self.lifecycle, TestRendererRootLifecycle::Active) {
            return Ok(TestRendererRootUpdateOutcome::IgnoredAfterUnmount);
        }
        if self.current_host_output.is_none() {
            return Err(TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Update,
            });
        }

        let element = self.push_host_output_fixture_for_canary(element_type.into(), text.into());
        let record =
            self.schedule_root_update(TestRendererRootUpdateKind::Update, element, None)?;
        self.scheduled_updates.push(record.clone());
        Ok(TestRendererRootUpdateOutcome::Scheduled(record))
    }

    fn update_with_root_update_callback(
        &mut self,
        element: RootElementHandle,
        callback: Option<RootUpdateCallbackHandle>,
    ) -> Result<TestRendererRootUpdateOutcome, TestRendererRootError> {
        if !matches!(self.lifecycle, TestRendererRootLifecycle::Active) {
            return Ok(TestRendererRootUpdateOutcome::IgnoredAfterUnmount);
        }

        let record =
            self.schedule_root_update(TestRendererRootUpdateKind::Update, element, callback)?;
        self.scheduled_updates.push(record.clone());
        Ok(TestRendererRootUpdateOutcome::Scheduled(record))
    }

    pub fn unmount(&mut self) -> Result<TestRendererRootUpdateOutcome, TestRendererRootError> {
        self.unmount_with_root_update_callback(None)
    }

    pub fn unmount_with_root_update_callback_for_canary(
        &mut self,
        callback: RootUpdateCallbackHandle,
    ) -> Result<TestRendererRootUpdateOutcome, TestRendererRootError> {
        self.unmount_with_root_update_callback(Some(callback))
    }

    fn unmount_with_root_update_callback(
        &mut self,
        callback: Option<RootUpdateCallbackHandle>,
    ) -> Result<TestRendererRootUpdateOutcome, TestRendererRootError> {
        if !matches!(self.lifecycle, TestRendererRootLifecycle::Active) {
            return Ok(TestRendererRootUpdateOutcome::AlreadyUnmountScheduled);
        }

        let record = self.schedule_root_update(
            TestRendererRootUpdateKind::Unmount,
            RootElementHandle::NONE,
            callback,
        )?;
        self.scheduled_updates.push(record.clone());
        self.lifecycle = TestRendererRootLifecycle::UnmountScheduled;
        Ok(TestRendererRootUpdateOutcome::Scheduled(record))
    }

    #[must_use]
    pub const fn renderer(&self) -> &TestRenderer {
        &self.renderer
    }

    #[must_use]
    pub const fn container(&self) -> TestContainer {
        self.container
    }

    #[must_use]
    pub const fn store(&self) -> &FiberRootStore<TestRenderer> {
        &self.store
    }

    #[must_use]
    pub const fn root_id(&self) -> FiberRootId {
        self.root_id
    }

    #[must_use]
    pub const fn options(&self) -> &TestRendererOptions {
        &self.options
    }

    #[must_use]
    pub const fn lifecycle(&self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub fn scheduled_updates(&self) -> &[TestRendererRootScheduledUpdate] {
        &self.scheduled_updates
    }

    #[must_use]
    pub fn last_scheduled_update(&self) -> Option<&TestRendererRootScheduledUpdate> {
        self.scheduled_updates.last()
    }

    pub fn scheduled_roots_for_canary(&self) -> Result<Vec<FiberRootId>, TestRendererRootError> {
        Ok(scheduled_roots(&self.store)?)
    }

    pub fn process_root_schedule_microtask_for_canary(
        &mut self,
    ) -> Result<RootScheduleMicrotaskResult, TestRendererRootError> {
        Ok(process_root_schedule_in_microtask(&mut self.store)?)
    }

    pub fn render_latest_scheduled_host_root_for_commit_handoff(
        &mut self,
    ) -> Result<Option<HostRootRenderPhaseRecord>, TestRendererRootError> {
        let Some(update) = self.scheduled_updates.last() else {
            return Ok(None);
        };

        Ok(Some(render_host_root_for_lanes(
            &mut self.store,
            self.root_id,
            update.container_update.lane().to_lanes(),
        )?))
    }

    pub fn commit_host_root_render_for_canary(
        &mut self,
        render: HostRootRenderPhaseRecord,
    ) -> Result<HostRootCommitRecord, TestRendererRootError> {
        Ok(commit_finished_host_root(&mut self.store, render)?)
    }

    pub fn describe_serialization_gate_for_canary(
        &self,
        commit: &HostRootCommitRecord,
    ) -> Result<TestRendererSerializationGateReport, TestRendererRootError> {
        self.validate_serialization_gate_commit(commit)?;

        let snapshot = self.renderer.snapshot_container(&self.container)?;
        let host_output = TestRendererHostOutputDiagnostics {
            container_child_count: snapshot.children().len(),
            instance_count: self.renderer.instances.len(),
            text_count: self.renderer.texts.len(),
            real_host_output_available: !snapshot.children().is_empty(),
        };
        let fiber_inspection = if host_output.real_host_output_available() {
            Some(self.describe_committed_fiber_tree_for_canary(commit)?)
        } else {
            None
        };
        let requirements = TestRendererSerializationGateRequirements {
            root_commit_diagnostics_available: true,
            real_host_output_available: host_output.real_host_output_available(),
            committed_fiber_inspection_available: fiber_inspection.is_some(),
        };
        let status = if !requirements.real_host_output_available() {
            TestRendererSerializationGateStatus::ClosedMissingHostOutput
        } else if !requirements.committed_fiber_inspection_available() {
            TestRendererSerializationGateStatus::ClosedMissingFiberInspection
        } else {
            TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
        };
        let callbacks = commit.root_update_callbacks();
        let previous_current = commit.previous_current();
        let current = commit.current();
        let finished_work = commit.finished_work();
        let last_update = self.scheduled_updates.last();

        Ok(TestRendererSerializationGateReport {
            gate_name: TEST_RENDERER_SERIALIZATION_CANARY_GATE_NAME,
            status,
            requirements,
            oracle: TestRendererSerializationOracleDiagnostics::current(),
            commit: TestRendererCommitDiagnostics {
                root: commit.root(),
                lifecycle: self.lifecycle,
                last_update_kind: last_update.map(TestRendererRootScheduledUpdate::kind),
                last_scheduled_element: last_update.map(TestRendererRootScheduledUpdate::element),
                previous_current: TestRendererFiberHandleDiagnostics {
                    arena_id: previous_current.arena_id().get(),
                    slot: previous_current.slot().get(),
                    generation: previous_current.generation().get(),
                },
                current: TestRendererFiberHandleDiagnostics {
                    arena_id: current.arena_id().get(),
                    slot: current.slot().get(),
                    generation: current.generation().get(),
                },
                finished_work: TestRendererFiberHandleDiagnostics {
                    arena_id: finished_work.arena_id().get(),
                    slot: finished_work.slot().get(),
                    generation: finished_work.generation().get(),
                },
                finished_lanes_empty: commit.finished_lanes().is_empty(),
                finished_lanes_include_sync: commit.finished_lanes().includes_sync_lane(),
                remaining_lanes_empty: commit.remaining_lanes().is_empty(),
                pending_lanes_empty: commit.pending_lanes().is_empty(),
                has_remaining_work: commit.has_remaining_work(),
                root_update_callbacks: TestRendererRootUpdateCallbackDiagnostics {
                    empty: callbacks.is_empty(),
                    visible_count: callbacks.visible().len(),
                    hidden_count: callbacks.hidden().len(),
                    deferred_hidden_count: callbacks.deferred_hidden().len(),
                },
            },
            host_output,
            fiber_inspection: fiber_inspection.map(Box::new),
        })
    }

    pub fn describe_committed_fiber_tree_for_canary(
        &self,
        commit: &HostRootCommitRecord,
    ) -> Result<TestRendererCommittedFiberTreeInspection, TestRendererRootError> {
        self.validate_serialization_gate_commit(commit)?;
        Ok(inspect_test_renderer_committed_fiber_tree(
            &self.store,
            self.root_id,
        )?)
    }

    pub fn require_serialization_gate_ready_for_canary(
        &self,
        commit: &HostRootCommitRecord,
    ) -> Result<TestRendererSerializationGateReport, TestRendererRootError> {
        let report = self.describe_serialization_gate_for_canary(commit)?;
        if report.is_ready() {
            Ok(report)
        } else {
            Err(TestRendererSerializationGateError::Closed(report).into())
        }
    }

    pub fn describe_private_json_serialization_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateJsonSerializationReport, TestRendererRootError> {
        self.describe_private_json_serialization_from_current_fibers_for_canary(
            output.commit(),
            Some(output.fiber_inspection()),
            output.completed_fibers().current(),
            output.snapshot(),
            TestRendererRootUpdateKind::Create,
        )
    }

    pub fn describe_private_json_serialization_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateJsonSerializationReport, TestRendererRootError> {
        self.describe_private_json_serialization_from_current_fibers_for_canary(
            output.commit(),
            Some(output.fiber_inspection()),
            output.updated_fibers().current(),
            output.snapshot(),
            TestRendererRootUpdateKind::Update,
        )
    }

    pub fn describe_private_to_json_facade_result_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateToJsonFacadeResult, TestRendererRootError> {
        let report = self.describe_private_json_serialization_for_canary(output)?;
        Ok(Self::private_to_json_facade_result_from_report(&report))
    }

    pub fn describe_private_to_json_facade_result_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateToJsonFacadeResult, TestRendererRootError> {
        let report = self.describe_private_json_serialization_after_update_for_canary(output)?;
        Ok(Self::private_to_json_facade_result_from_report(&report))
    }

    pub fn describe_private_tree_metadata_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateTreeMetadataReport, TestRendererRootError> {
        let json_report = self.describe_private_json_serialization_for_canary(output)?;

        Ok(Self::private_tree_metadata_from_json_report(json_report))
    }

    pub fn describe_private_tree_metadata_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateTreeMetadataReport, TestRendererRootError> {
        let json_report =
            self.describe_private_json_serialization_after_update_for_canary(output)?;

        Ok(Self::private_tree_metadata_from_json_report(json_report))
    }

    fn describe_private_json_serialization_from_current_fibers_for_canary(
        &self,
        commit: &HostRootCommitRecord,
        expected_fiber_inspection: Option<&TestRendererCommittedFiberTreeInspection>,
        current_fibers: TestRendererHostOutputCanaryCurrentFibers,
        snapshot: &TestContainerSnapshot,
        host_output_update_kind: TestRendererRootUpdateKind,
    ) -> Result<TestRendererPrivateJsonSerializationReport, TestRendererRootError> {
        let gate = self.require_serialization_gate_ready_for_canary(commit)?;
        let fiber_inspection = gate
            .fiber_inspection()
            .cloned()
            .ok_or(TestRendererPrivateJsonSerializationError::CommittedFiberInspectionMissing)?;
        if let Some(expected_fiber_inspection) = expected_fiber_inspection
            && &fiber_inspection != expected_fiber_inspection
        {
            return Err(
                TestRendererPrivateJsonSerializationError::CommittedFiberInspectionStale.into(),
            );
        }
        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *snapshot {
            return Err(TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale.into());
        }

        Self::validate_private_json_canary_current_fibers(&fiber_inspection, current_fibers)?;
        let component = Self::private_json_component_from_snapshot(snapshot)?;
        let nodes =
            Self::private_json_nodes_from_component_and_fibers(&component, &fiber_inspection);

        Ok(TestRendererPrivateJsonSerializationReport {
            diagnostic_name: TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
            gate,
            host_output_update_kind,
            host_output_snapshot_current: true,
            root_child_count: snapshot.children().len(),
            root_node_kind: component.node_kind(),
            nodes,
            component,
            public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers::blocked(),
        })
    }

    fn private_to_json_facade_result_from_report(
        report: &TestRendererPrivateJsonSerializationReport,
    ) -> TestRendererPrivateToJsonFacadeResult {
        let component = report.component();

        TestRendererPrivateToJsonFacadeResult {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME,
            source_diagnostic_name: report.diagnostic_name(),
            host_output_update_kind: report.host_output_update_kind(),
            host_output_snapshot_current: report.host_output_snapshot_current(),
            element_type: component.element_type().clone(),
            props: component.props().clone(),
            children: vec![component.text_child().text().to_owned()],
            source_node_count: report.node_count(),
            public_blockers: report.public_blockers(),
            public_serialization_available: false,
            compatibility_claimed: false,
        }
    }

    pub fn render_and_commit_host_output_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererCommittedHostOutput>, TestRendererRootError> {
        let Some(render) = self.render_latest_scheduled_host_root_for_commit_handoff()? else {
            return Ok(None);
        };
        let fixture = self
            .host_output_fixture(render.resulting_element())?
            .clone();
        let prepared = prepare_test_renderer_host_output_canary_fibers(
            &mut self.store,
            render,
            fixture.canary_fixture,
        )?;
        let (instance, text) = self.create_detached_host_output_for_canary(&fixture, prepared)?;
        let completed = finish_test_renderer_host_output_canary_fibers(
            &mut self.store,
            prepared,
            Self::instance_state_node_raw(instance),
            Self::text_state_node_raw(text),
        )?;
        let commit = self.commit_host_root_render_for_canary(render)?;
        let fiber_inspection = self.describe_committed_fiber_tree_for_canary(&commit)?;
        let mut container = self.container;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        self.renderer
            .append_child_to_container(&mut container, HostChild::Instance(&instance))?;
        self.renderer.reset_after_commit(&container, commit_state)?;
        let snapshot = self.diagnostic_container_snapshot()?;
        self.host_nodes.track_current(
            completed.current(),
            completed.component_state_node_raw(),
            completed.text_state_node_raw(),
        );
        self.current_host_output = Some(TestRendererCurrentHostOutput {
            fixture,
            fibers: completed.current(),
            instance,
            text,
        });
        self.current_nested_host_output = None;

        Ok(Some(TestRendererCommittedHostOutput {
            render,
            prepared_fibers: prepared,
            completed_fibers: completed,
            commit,
            fiber_inspection,
            snapshot,
        }))
    }

    pub fn render_and_commit_nested_host_output_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererNestedCommittedHostOutput>, TestRendererRootError> {
        let Some(render) = self.render_latest_scheduled_host_root_for_commit_handoff()? else {
            return Ok(None);
        };
        let fixture = self
            .nested_host_output_fixture(render.resulting_element())?
            .clone();
        let (outer_prepared, inner_prepared) = self
            .store
            .prepare_test_renderer_nested_host_output_canary_fibers(
                render,
                fixture.outer_canary_fixture,
                fixture.inner_canary_fixture,
            )?;
        let (outer_instance, inner_instance, text) = self
            .create_detached_nested_host_output_for_canary(
                &fixture,
                outer_prepared,
                inner_prepared,
            )?;
        let (outer_fibers, inner_fibers) = self
            .store
            .finish_test_renderer_nested_host_output_canary_fibers(
                outer_prepared,
                inner_prepared,
                Self::instance_state_node_raw(outer_instance),
                Self::instance_state_node_raw(inner_instance),
                Self::text_state_node_raw(text),
            )?;
        let commit = self.commit_host_root_render_for_canary(render)?;
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);
        let mut container = self.container;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        self.renderer
            .append_child_to_container(&mut container, HostChild::Instance(&outer_instance))?;
        self.renderer.reset_after_commit(&container, commit_state)?;
        let snapshot = self.diagnostic_container_snapshot()?;
        self.current_host_output = None;
        self.current_nested_host_output = Some(TestRendererCurrentNestedHostOutput {
            fixture,
            outer_fibers,
            inner_fibers,
            outer_instance,
            inner_instance,
            text,
        });

        Ok(Some(TestRendererNestedCommittedHostOutput {
            render,
            commit,
            commit_diagnostics,
            snapshot,
        }))
    }

    pub fn render_and_commit_host_output_update_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererUpdatedHostOutput>, TestRendererRootError> {
        let Some(update) = self.scheduled_updates.last() else {
            return Ok(None);
        };
        if update.kind() != TestRendererRootUpdateKind::Update {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Update,
                actual: update.kind(),
            });
        }
        let current = self.current_host_output.clone().ok_or(
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Update,
            },
        )?;
        let Some(render) = self.render_latest_scheduled_host_root_for_commit_handoff()? else {
            return Ok(None);
        };
        let next_fixture = self
            .host_output_fixture(render.resulting_element())?
            .clone();
        let previous_snapshot = self.diagnostic_container_snapshot()?;
        let updated = prepare_test_renderer_host_output_update_canary_fibers(
            &mut self.store,
            render,
            current.fibers,
            next_fixture.canary_fixture,
            Self::instance_state_node_raw(current.instance),
            Self::text_state_node_raw(current.text),
        )?;
        let commit = self.commit_host_root_render_for_canary(render)?;
        let fiber_inspection = self.describe_committed_fiber_tree_for_canary(&commit)?;
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);
        let text_update_requested =
            updated.text_props_changed() || current.fixture.text != next_fixture.text;
        if text_update_requested
            && !commit.has_test_only_host_text_update_apply_for_canary(
                current.fibers.text(),
                updated.current().text(),
                Self::text_state_node_raw(current.text),
            )
        {
            return Err(TestRendererRootError::MissingHostTextUpdateApply {
                current_text_slot: current.fibers.text().slot().get(),
                updated_text_slot: updated.current().text().slot().get(),
                text_state_node_raw: Self::text_state_node_raw(current.text),
            });
        }

        let container = self.container;
        let mut instance = current.instance;
        let mut text = current.text;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        if updated.component_props_changed() {
            let component_token = updated.component_commit_token().raw();
            self.renderer.commit_update(
                HostFiberTokenRef::new(
                    &component_token,
                    HostFiberTokenPhase::Commit,
                    HostFiberTokenTarget::Instance,
                ),
                &mut instance,
                TestUpdatePayload::replace_props(next_fixture.props.clone()),
                &next_fixture.element_type,
                &current.fixture.props,
                &next_fixture.props,
            )?;
        }
        if text_update_requested {
            self.renderer.commit_text_update(
                &mut text,
                &current.fixture.text,
                &next_fixture.text,
            )?;
        }
        self.renderer.reset_after_commit(&container, commit_state)?;
        let snapshot = self.diagnostic_container_snapshot()?;
        self.host_nodes.retarget_current(updated.current());
        self.current_host_output = Some(TestRendererCurrentHostOutput {
            fixture: next_fixture,
            fibers: updated.current(),
            instance,
            text,
        });
        self.current_nested_host_output = None;

        Ok(Some(TestRendererUpdatedHostOutput {
            render,
            updated_fibers: updated,
            commit,
            fiber_inspection,
            commit_diagnostics,
            previous_snapshot,
            snapshot,
        }))
    }

    pub fn render_and_commit_host_parent_text_placement_for_canary(
        &mut self,
        text: impl Into<String>,
    ) -> Result<TestRendererHostParentPlacedHostOutput, TestRendererRootError> {
        let current = self.current_host_output.clone().ok_or(
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Update,
            },
        )?;
        let scheduled = self.schedule_root_update(
            TestRendererRootUpdateKind::Update,
            current.fixture.element,
            None,
        )?;
        self.scheduled_updates.push(scheduled);
        let render = self
            .render_latest_scheduled_host_root_for_commit_handoff()?
            .expect("host-parent placement canary schedules an update before rendering");
        let previous_snapshot = self.diagnostic_container_snapshot()?;
        let placed_text = text.into();
        let placed_text_props_raw =
            self.next_host_parent_placement_text_props_raw_for_canary(&current);
        let (next_fibers, placed_text_fiber, text_token) = self
            .store
            .prepare_test_renderer_host_parent_text_placement_canary_fibers(
                render,
                current.fibers,
                placed_text_props_raw,
            )?;

        let container = self.container;
        let root_context = self.renderer.root_host_context(&container)?;
        let child_context = self.renderer.child_host_context(
            &root_context,
            &current.fixture.element_type,
            &current.fixture.props,
        )?;
        let text_token_raw = text_token.raw();
        let placed_text_instance = self.renderer.create_text_instance(
            HostFiberTokenRef::new(
                &text_token_raw,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            &placed_text,
            &container,
            &child_context,
        )?;
        let parent_state_node_raw = Self::instance_state_node_raw(current.instance);
        let child_state_node_raw = Self::text_state_node_raw(placed_text_instance);
        self.store
            .finish_test_renderer_host_parent_text_placement_canary_fibers(
                next_fibers,
                placed_text_fiber,
                child_state_node_raw,
                placed_text_props_raw,
            )?;

        let commit = self.commit_host_root_render_for_canary(render)?;
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);
        let host_parent_placement_apply_count =
            commit.test_only_host_parent_placement_apply_count_for_canary();
        if !commit.has_test_only_host_parent_placement_apply_for_canary(
            parent_state_node_raw,
            child_state_node_raw,
        ) {
            return Err(TestRendererRootError::MissingHostParentPlacementApply {
                parent_state_node_raw,
                child_state_node_raw,
            });
        }

        let mut parent = current.instance;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        self.renderer
            .append_child(&mut parent, HostChild::Text(&placed_text_instance))?;
        self.renderer.reset_after_commit(&container, commit_state)?;
        let snapshot = self.diagnostic_container_snapshot()?;
        let placed_text_snapshot = self.renderer.snapshot_text(&placed_text_instance)?;
        self.current_host_output = Some(TestRendererCurrentHostOutput {
            fixture: current.fixture,
            fibers: next_fibers,
            instance: parent,
            text: current.text,
        });
        self.current_nested_host_output = None;

        Ok(TestRendererHostParentPlacedHostOutput {
            render,
            commit,
            commit_diagnostics,
            previous_snapshot,
            snapshot,
            placed_text_snapshot,
            host_parent_placement_apply_count,
        })
    }

    pub fn render_and_commit_nested_host_parent_text_placement_for_canary(
        &mut self,
        text: impl Into<String>,
    ) -> Result<TestRendererNestedHostParentPlacedHostOutput, TestRendererRootError> {
        let current = self.current_nested_host_output.clone().ok_or(
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Update,
            },
        )?;
        let scheduled = self.schedule_root_update(
            TestRendererRootUpdateKind::Update,
            current.fixture.element,
            None,
        )?;
        self.scheduled_updates.push(scheduled);
        let render = self
            .render_latest_scheduled_host_root_for_commit_handoff()?
            .expect("nested host-parent placement canary schedules an update before rendering");
        let previous_snapshot = self.diagnostic_container_snapshot()?;
        let placed_text = text.into();
        let placed_text_props_raw =
            self.next_nested_host_parent_placement_text_props_raw_for_canary(&current);
        let (next_outer_fibers, next_inner_fibers, placed_text_fiber, text_token) = self
            .store
            .prepare_test_renderer_nested_host_parent_text_placement_canary_fibers(
                render,
                current.outer_fibers,
                current.inner_fibers,
                placed_text_props_raw,
            )?;

        let container = self.container;
        let root_context = self.renderer.root_host_context(&container)?;
        let outer_child_context = self.renderer.child_host_context(
            &root_context,
            &current.fixture.outer_element_type,
            &current.fixture.outer_props,
        )?;
        let inner_child_context = self.renderer.child_host_context(
            &outer_child_context,
            &current.fixture.inner_element_type,
            &current.fixture.inner_props,
        )?;
        let text_token_raw = text_token.raw();
        let placed_text_instance = self.renderer.create_text_instance(
            HostFiberTokenRef::new(
                &text_token_raw,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            &placed_text,
            &container,
            &inner_child_context,
        )?;
        let nested_parent_state_node_raw = Self::instance_state_node_raw(current.inner_instance);
        let placed_text_state_node_raw = Self::text_state_node_raw(placed_text_instance);
        self.store
            .finish_test_renderer_nested_host_parent_text_placement_canary_fibers(
                next_outer_fibers,
                next_inner_fibers,
                placed_text_fiber,
                placed_text_state_node_raw,
                placed_text_props_raw,
            )?;

        let commit = self.commit_host_root_render_for_canary(render)?;
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);
        let host_parent_placement_apply_count =
            commit.test_only_host_parent_placement_apply_count_for_canary();
        if !commit.has_test_only_host_parent_placement_apply_for_canary(
            nested_parent_state_node_raw,
            placed_text_state_node_raw,
        ) {
            return Err(TestRendererRootError::MissingHostParentPlacementApply {
                parent_state_node_raw: nested_parent_state_node_raw,
                child_state_node_raw: placed_text_state_node_raw,
            });
        }

        let mut inner_instance = current.inner_instance;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        self.renderer
            .append_child(&mut inner_instance, HostChild::Text(&placed_text_instance))?;
        self.renderer.reset_after_commit(&container, commit_state)?;
        let snapshot = self.diagnostic_container_snapshot()?;
        let placed_text_snapshot = self.renderer.snapshot_text(&placed_text_instance)?;
        self.current_nested_host_output = Some(TestRendererCurrentNestedHostOutput {
            fixture: current.fixture,
            outer_fibers: next_outer_fibers,
            inner_fibers: next_inner_fibers,
            outer_instance: current.outer_instance,
            inner_instance,
            text: current.text,
        });
        self.current_host_output = None;

        Ok(TestRendererNestedHostParentPlacedHostOutput {
            render,
            commit,
            commit_diagnostics,
            previous_snapshot,
            snapshot,
            placed_text_snapshot,
            nested_parent_state_node_raw,
            placed_text_state_node_raw,
            host_parent_placement_apply_count,
        })
    }

    pub fn render_and_commit_host_output_insert_before_stable_sibling_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererStableSiblingInsertedHostOutput>, TestRendererRootError> {
        self.render_and_commit_host_output_insert_before_current_sibling_for_canary(
            StableSiblingInsertionCanaryMode::StableCommittedSibling,
        )
    }

    pub fn render_and_commit_host_output_insert_before_ambiguous_sibling_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererStableSiblingInsertedHostOutput>, TestRendererRootError> {
        self.render_and_commit_host_output_insert_before_current_sibling_for_canary(
            StableSiblingInsertionCanaryMode::AmbiguousMissingSiblingStateNode,
        )
    }

    fn render_and_commit_host_output_insert_before_current_sibling_for_canary(
        &mut self,
        mode: StableSiblingInsertionCanaryMode,
    ) -> Result<Option<TestRendererStableSiblingInsertedHostOutput>, TestRendererRootError> {
        let Some(update) = self.scheduled_updates.last() else {
            return Ok(None);
        };
        if update.kind() != TestRendererRootUpdateKind::Update {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Update,
                actual: update.kind(),
            });
        }
        let stable = self.current_host_output.clone().ok_or(
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Update,
            },
        )?;
        let Some(render) = self.render_latest_scheduled_host_root_for_commit_handoff()? else {
            return Ok(None);
        };
        let inserted_fixture = self
            .host_output_fixture(render.resulting_element())?
            .clone();
        let previous_snapshot = self.diagnostic_container_snapshot()?;
        let stable_fibers = prepare_test_renderer_host_output_update_canary_fibers(
            &mut self.store,
            render,
            stable.fibers,
            stable.fixture.canary_fixture,
            Self::instance_state_node_raw(stable.instance),
            Self::text_state_node_raw(stable.text),
        )?;
        let inserted_prepared = prepare_test_renderer_host_output_canary_fibers(
            &mut self.store,
            render,
            inserted_fixture.canary_fixture,
        )?;
        self.store
            .prepare_test_renderer_host_output_stable_sibling_insertion_children_for_canary(
                render,
                inserted_prepared,
                stable_fibers,
                mode == StableSiblingInsertionCanaryMode::AmbiguousMissingSiblingStateNode,
            )?;

        let (inserted_instance, inserted_text) =
            self.create_detached_host_output_for_canary(&inserted_fixture, inserted_prepared)?;
        let inserted_completed = finish_test_renderer_host_output_canary_fibers(
            &mut self.store,
            inserted_prepared,
            Self::instance_state_node_raw(inserted_instance),
            Self::text_state_node_raw(inserted_text),
        )?;
        let commit = self.commit_host_root_render_for_canary(render)?;
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);
        let placement = self.stable_sibling_insertion_diagnostics_for_canary(
            &commit,
            inserted_completed,
            stable_fibers,
        )?;

        let mut container = self.container;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        let mutation_status = if placement.can_insert_before()
            && placement.apply_kind()
                == TestRendererStableSiblingInsertionApplyKind::InsertInContainerBefore
        {
            self.renderer.insert_in_container_before(
                &mut container,
                HostChild::Instance(&inserted_instance),
                HostChild::Instance(&stable.instance),
            )?;
            TestRendererStableSiblingInsertionMutationStatus::AppliedInsertInContainerBefore
        } else {
            TestRendererStableSiblingInsertionMutationStatus::RecordedOnly
        };
        self.renderer.reset_after_commit(&container, commit_state)?;
        let insertion_diagnostics = TestRendererStableSiblingInsertionDiagnostics {
            mutation_status,
            ..placement
        };
        let snapshot = self.diagnostic_container_snapshot()?;
        self.current_host_output = None;
        self.current_nested_host_output = None;

        Ok(Some(TestRendererStableSiblingInsertedHostOutput {
            render,
            stable_fibers,
            inserted_fibers: inserted_completed,
            commit,
            commit_diagnostics,
            insertion_diagnostics,
            previous_snapshot,
            snapshot,
        }))
    }

    pub fn render_and_commit_host_output_unmount_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererUnmountedHostOutput>, TestRendererRootError> {
        let Some(update) = self.scheduled_updates.last() else {
            return Ok(None);
        };
        if update.kind() != TestRendererRootUpdateKind::Unmount {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: update.kind(),
            });
        }
        let current = self.current_host_output.clone().ok_or(
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Unmount,
            },
        )?;
        let Some(render) = self.render_latest_scheduled_host_root_for_commit_handoff()? else {
            return Ok(None);
        };
        let previous_snapshot = self.diagnostic_container_snapshot()?;
        let deleted = prepare_test_renderer_host_output_unmount_canary_fibers(
            &mut self.store,
            render,
            current.fibers,
        )?;
        let commit = self.commit_host_root_render_for_canary(render)?;
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);

        let mut container = self.container;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        self.renderer
            .remove_child_from_container(&mut container, HostChild::Instance(&current.instance))?;
        let deletion_token = deleted.component_deletion_token().raw();
        self.renderer.detach_deleted_instance(
            HostFiberTokenRef::new(
                &deletion_token,
                HostFiberTokenPhase::Deletion,
                HostFiberTokenTarget::Instance,
            ),
            current.instance,
        )?;
        self.renderer.reset_after_commit(&container, commit_state)?;
        let host_node_cleanup = self.host_nodes.apply_cleanup(self.root_id, &commit);
        let snapshot = self.diagnostic_container_snapshot()?;
        let detached_instance_snapshot = self.renderer.snapshot_instance(&current.instance)?;
        self.current_host_output = None;
        self.current_nested_host_output = None;

        Ok(Some(TestRendererUnmountedHostOutput {
            render,
            deleted_fibers: deleted,
            commit,
            commit_diagnostics,
            host_node_cleanup,
            previous_snapshot,
            snapshot,
            detached_instance_snapshot,
        }))
    }

    pub fn diagnostic_container_snapshot(
        &self,
    ) -> Result<TestContainerSnapshot, TestRendererRootError> {
        Ok(self.renderer.snapshot_container(&self.container)?)
    }

    fn stable_sibling_insertion_diagnostics_for_canary(
        &self,
        commit: &HostRootCommitRecord,
        inserted: TestRendererHostOutputCanaryCompletedFibers,
        stable: TestRendererHostOutputCanaryUpdatedFibers,
    ) -> Result<TestRendererStableSiblingInsertionDiagnostics, TestRendererRootError> {
        let placement_records = commit.host_root_placement_apply_diagnostics_for_canary();
        if placement_records.is_empty() {
            return Err(
                TestRendererStableSiblingInsertionCanaryError::MissingPlacementRecord.into(),
            );
        }
        if placement_records.len() != 1 {
            return Err(
                TestRendererStableSiblingInsertionCanaryError::MultiplePlacementRecords {
                    actual: placement_records.len(),
                }
                .into(),
            );
        }

        let placement = placement_records[0];
        if placement.fiber() != inserted.component() {
            return Err(
                TestRendererStableSiblingInsertionCanaryError::UnexpectedInsertedFiber.into(),
            );
        }
        if placement.sibling() != Some(stable.component()) {
            return Err(
                TestRendererStableSiblingInsertionCanaryError::UnexpectedStableSibling.into(),
            );
        }

        macro_rules! fiber_handle {
            ($fiber:expr) => {{
                let fiber = $fiber;
                TestRendererFiberHandleDiagnostics {
                    arena_id: fiber.arena_id().get(),
                    slot: fiber.slot().get(),
                    generation: fiber.generation().get(),
                }
            }};
        }

        Ok(TestRendererStableSiblingInsertionDiagnostics {
            apply_kind: TestRendererStableSiblingInsertionApplyKind::from_reconciler_apply_kind(
                placement.apply_kind(),
            ),
            sibling_status:
                TestRendererStableSiblingInsertionSiblingStatus::from_reconciler_sibling_status(
                    placement.sibling_status(),
                ),
            mutation_status: TestRendererStableSiblingInsertionMutationStatus::RecordedOnly,
            fiber: fiber_handle!(placement.fiber()),
            sibling: placement.sibling().map(|fiber| fiber_handle!(fiber)),
            state_node_raw: placement.state_node_raw(),
            sibling_state_node_raw: placement.sibling_state_node_raw(),
            can_insert_before: placement.can_insert_before(),
        })
    }

    fn validate_serialization_gate_commit(
        &self,
        commit: &HostRootCommitRecord,
    ) -> Result<(), TestRendererRootError> {
        if commit.root() != self.root_id {
            return Err(TestRendererSerializationGateError::CommitRootMismatch {
                expected: self.root_id,
                actual: commit.root(),
            }
            .into());
        }

        let actual_current = self.store.root(self.root_id)?.current();
        if actual_current != commit.current() {
            let expected_current = commit.current();
            return Err(TestRendererSerializationGateError::CommitIsNotCurrent {
                root: self.root_id,
                expected_current: TestRendererFiberHandleDiagnostics {
                    arena_id: expected_current.arena_id().get(),
                    slot: expected_current.slot().get(),
                    generation: expected_current.generation().get(),
                },
                actual_current: TestRendererFiberHandleDiagnostics {
                    arena_id: actual_current.arena_id().get(),
                    slot: actual_current.slot().get(),
                    generation: actual_current.generation().get(),
                },
            }
            .into());
        }

        Ok(())
    }

    fn schedule_root_update(
        &mut self,
        kind: TestRendererRootUpdateKind,
        element: RootElementHandle,
        callback: Option<RootUpdateCallbackHandle>,
    ) -> Result<TestRendererRootScheduledUpdate, TestRendererRootError> {
        let container_update = match kind {
            TestRendererRootUpdateKind::Create | TestRendererRootUpdateKind::Update => {
                update_container(&mut self.store, self.root_id, element, callback)?
            }
            TestRendererRootUpdateKind::Unmount => {
                update_container_sync(&mut self.store, self.root_id, element, callback)?
            }
        };
        let root_schedule = ensure_root_is_scheduled(&mut self.store, container_update.schedule())?;
        Ok(TestRendererRootScheduledUpdate {
            kind,
            element,
            container_update,
            root_schedule,
        })
    }

    fn push_host_output_fixture_for_canary(
        &mut self,
        element_type: TestElementType,
        text: String,
    ) -> RootElementHandle {
        let element = RootElementHandle::from_raw(self.host_output_fixtures.len() as u64 + 1);
        self.host_output_fixtures
            .push(TestRendererHostOutputFixture::new(
                element,
                element_type,
                text,
            ));
        element
    }

    fn host_output_fixture(
        &self,
        element: RootElementHandle,
    ) -> Result<&TestRendererHostOutputFixture, TestRendererRootError> {
        if element.is_none() {
            return Err(TestRendererRootError::MissingHostOutputFixture { element });
        }

        self.host_output_fixtures
            .get((element.raw() - 1) as usize)
            .filter(|fixture| fixture.element == element)
            .ok_or(TestRendererRootError::MissingHostOutputFixture { element })
    }

    fn push_nested_host_output_fixture_for_canary(
        &mut self,
        outer_element_type: TestElementType,
        inner_element_type: TestElementType,
        text: String,
    ) -> RootElementHandle {
        let element = RootElementHandle::from_raw(
            NESTED_HOST_OUTPUT_FIXTURE_BASE_RAW + self.nested_host_output_fixtures.len() as u64,
        );
        self.nested_host_output_fixtures
            .push(TestRendererNestedHostOutputFixture::new(
                element,
                outer_element_type,
                inner_element_type,
                text,
            ));
        element
    }

    fn nested_host_output_fixture(
        &self,
        element: RootElementHandle,
    ) -> Result<&TestRendererNestedHostOutputFixture, TestRendererRootError> {
        if element.raw() < NESTED_HOST_OUTPUT_FIXTURE_BASE_RAW {
            return Err(TestRendererRootError::MissingHostOutputFixture { element });
        }

        self.nested_host_output_fixtures
            .get((element.raw() - NESTED_HOST_OUTPUT_FIXTURE_BASE_RAW) as usize)
            .filter(|fixture| fixture.element == element)
            .ok_or(TestRendererRootError::MissingHostOutputFixture { element })
    }

    fn next_host_parent_placement_text_props_raw_for_canary(
        &self,
        current: &TestRendererCurrentHostOutput,
    ) -> u64 {
        current
            .fixture
            .canary_fixture
            .text_props_raw()
            .saturating_add(self.renderer.texts.len() as u64)
            .saturating_add(1000)
    }

    fn next_nested_host_parent_placement_text_props_raw_for_canary(
        &self,
        current: &TestRendererCurrentNestedHostOutput,
    ) -> u64 {
        current
            .fixture
            .inner_canary_fixture
            .text_props_raw()
            .saturating_add(self.renderer.texts.len() as u64)
            .saturating_add(1000)
    }

    fn create_detached_host_output_for_canary(
        &mut self,
        fixture: &TestRendererHostOutputFixture,
        prepared: TestRendererHostOutputCanaryPreparedFibers,
    ) -> Result<(TestInstance, TestTextInstance), TestRendererRootError> {
        let container = self.container;
        let root_context = self.renderer.root_host_context(&container)?;
        let child_context = self.renderer.child_host_context(
            &root_context,
            &fixture.element_type,
            &fixture.props,
        )?;
        let text_token = prepared.text_token().raw();
        let text = self.renderer.create_text_instance(
            HostFiberTokenRef::new(
                &text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            &fixture.text,
            &container,
            &child_context,
        )?;
        let component_token = prepared.component_token().raw();
        let mut instance = self.renderer.create_instance(
            HostFiberTokenRef::new(
                &component_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &fixture.element_type,
            &fixture.props,
            &container,
            &root_context,
        )?;
        self.renderer
            .append_initial_child(&mut instance, HostChild::Text(&text))?;
        self.renderer.finalize_initial_children(
            &mut instance,
            &fixture.element_type,
            &fixture.props,
            &container,
            &root_context,
        )?;
        Ok((instance, text))
    }

    fn create_detached_nested_host_output_for_canary(
        &mut self,
        fixture: &TestRendererNestedHostOutputFixture,
        outer_prepared: TestRendererHostOutputCanaryPreparedFibers,
        inner_prepared: TestRendererHostOutputCanaryPreparedFibers,
    ) -> Result<(TestInstance, TestInstance, TestTextInstance), TestRendererRootError> {
        let container = self.container;
        let root_context = self.renderer.root_host_context(&container)?;
        let outer_child_context = self.renderer.child_host_context(
            &root_context,
            &fixture.outer_element_type,
            &fixture.outer_props,
        )?;
        let inner_child_context = self.renderer.child_host_context(
            &outer_child_context,
            &fixture.inner_element_type,
            &fixture.inner_props,
        )?;
        let text_token = inner_prepared.text_token().raw();
        let text = self.renderer.create_text_instance(
            HostFiberTokenRef::new(
                &text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            &fixture.text,
            &container,
            &inner_child_context,
        )?;

        let inner_token = inner_prepared.component_token().raw();
        let mut inner_instance = self.renderer.create_instance(
            HostFiberTokenRef::new(
                &inner_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &fixture.inner_element_type,
            &fixture.inner_props,
            &container,
            &outer_child_context,
        )?;
        self.renderer
            .append_initial_child(&mut inner_instance, HostChild::Text(&text))?;
        self.renderer.finalize_initial_children(
            &mut inner_instance,
            &fixture.inner_element_type,
            &fixture.inner_props,
            &container,
            &outer_child_context,
        )?;

        let outer_token = outer_prepared.component_token().raw();
        let mut outer_instance = self.renderer.create_instance(
            HostFiberTokenRef::new(
                &outer_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &fixture.outer_element_type,
            &fixture.outer_props,
            &container,
            &root_context,
        )?;
        self.renderer
            .append_initial_child(&mut outer_instance, HostChild::Instance(&inner_instance))?;
        self.renderer.finalize_initial_children(
            &mut outer_instance,
            &fixture.outer_element_type,
            &fixture.outer_props,
            &container,
            &root_context,
        )?;

        Ok((outer_instance, inner_instance, text))
    }

    fn validate_private_json_canary_current_fibers(
        fiber_inspection: &TestRendererCommittedFiberTreeInspection,
        current: TestRendererHostOutputCanaryCurrentFibers,
    ) -> Result<(), TestRendererPrivateJsonSerializationError> {
        if fiber_inspection.host_component().fiber() != current.component() {
            return Err(
                TestRendererPrivateJsonSerializationError::CommittedFiberMismatch {
                    node_kind: TestRendererPrivateJsonNodeKind::HostComponent,
                },
            );
        }

        if fiber_inspection.host_text().fiber() != current.text() {
            return Err(
                TestRendererPrivateJsonSerializationError::CommittedFiberMismatch {
                    node_kind: TestRendererPrivateJsonNodeKind::Text,
                },
            );
        }

        let fixture = current.fixture();
        let component = fiber_inspection.host_component();
        let text = fiber_inspection.host_text();
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "element_type",
            fixture.element_type_raw(),
            component.element_type().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "pending_props",
            fixture.component_props_raw(),
            component.pending_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::HostComponent,
            "memoized_props",
            fixture.component_props_raw(),
            component.memoized_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::Text,
            "pending_props",
            fixture.text_props_raw(),
            text.pending_props().raw(),
        )?;
        Self::validate_private_json_raw_handle(
            TestRendererPrivateJsonNodeKind::Text,
            "memoized_props",
            fixture.text_props_raw(),
            text.memoized_props().raw(),
        )?;

        Ok(())
    }

    fn validate_private_json_raw_handle(
        node_kind: TestRendererPrivateJsonNodeKind,
        field: &'static str,
        expected: u64,
        actual: u64,
    ) -> Result<(), TestRendererPrivateJsonSerializationError> {
        if actual == expected {
            Ok(())
        } else {
            Err(
                TestRendererPrivateJsonSerializationError::CanaryFixtureRawMismatch {
                    node_kind,
                    field,
                    expected,
                    actual,
                },
            )
        }
    }

    fn private_json_nodes_from_component_and_fibers(
        component: &TestRendererPrivateJsonHostComponentDiagnostic,
        fiber_inspection: &TestRendererCommittedFiberTreeInspection,
    ) -> Vec<TestRendererPrivateJsonNodeDiagnostic> {
        vec![
            TestRendererPrivateJsonNodeDiagnostic {
                ordinal: 0,
                node_kind: TestRendererPrivateJsonNodeKind::HostComponent,
                parent_ordinal: None,
                child_ordinals: vec![1],
                fiber: Self::private_json_fiber_diagnostic(fiber_inspection.host_component()),
                element_type: Some(component.element_type().clone()),
                props: Some(component.props().clone()),
                text: None,
                hidden: component.is_hidden(),
                detached: component.is_detached(),
            },
            TestRendererPrivateJsonNodeDiagnostic {
                ordinal: 1,
                node_kind: TestRendererPrivateJsonNodeKind::Text,
                parent_ordinal: Some(0),
                child_ordinals: Vec::new(),
                fiber: Self::private_json_fiber_diagnostic(fiber_inspection.host_text()),
                element_type: None,
                props: None,
                text: Some(component.text_child().text().to_owned()),
                hidden: component.text_child().is_hidden(),
                detached: false,
            },
        ]
    }

    fn private_json_fiber_diagnostic(
        node: TestRendererCommittedFiberNodeInspection,
    ) -> TestRendererPrivateJsonFiberDiagnostic {
        macro_rules! fiber_handle {
            ($fiber:expr) => {{
                let fiber = $fiber;
                TestRendererFiberHandleDiagnostics {
                    arena_id: fiber.arena_id().get(),
                    slot: fiber.slot().get(),
                    generation: fiber.generation().get(),
                }
            }};
        }

        TestRendererPrivateJsonFiberDiagnostic {
            fiber: fiber_handle!(node.fiber()),
            parent: node.parent().map(|fiber| fiber_handle!(fiber)),
            child: node.child().map(|fiber| fiber_handle!(fiber)),
            sibling: node.sibling().map(|fiber| fiber_handle!(fiber)),
            index: node.index(),
            alternate: node.alternate().map(|fiber| fiber_handle!(fiber)),
            pending_props_raw: node.pending_props().raw(),
            memoized_props_raw: node.memoized_props().raw(),
            lanes_bits: node.lanes().bits(),
            child_lanes_bits: node.child_lanes().bits(),
            flags_bits: node.flags().bits(),
            subtree_flags_bits: node.subtree_flags().bits(),
            state_node_present: node.state_node_present(),
        }
    }

    fn private_json_component_from_snapshot(
        snapshot: &TestContainerSnapshot,
    ) -> Result<
        TestRendererPrivateJsonHostComponentDiagnostic,
        TestRendererPrivateJsonSerializationError,
    > {
        if snapshot.children().len() != 1 {
            return Err(TestRendererPrivateJsonSerializationError::RootChildCount {
                actual: snapshot.children().len(),
            });
        }

        let TestNodeSnapshot::Element(element) = &snapshot.children()[0] else {
            return Err(TestRendererPrivateJsonSerializationError::RootChildIsText);
        };

        if element.children().len() != 1 {
            return Err(
                TestRendererPrivateJsonSerializationError::HostComponentChildCount {
                    element_type: element.element_type().clone(),
                    actual: element.children().len(),
                },
            );
        }

        let TestNodeSnapshot::Text(text) = &element.children()[0] else {
            return Err(
                TestRendererPrivateJsonSerializationError::HostComponentChildIsElement {
                    element_type: element.element_type().clone(),
                },
            );
        };

        Ok(TestRendererPrivateJsonHostComponentDiagnostic {
            element_type: element.element_type().clone(),
            props: element.props().clone(),
            hidden: element.is_hidden(),
            detached: element.is_detached(),
            child_count: element.children().len(),
            text_child: TestRendererPrivateJsonTextDiagnostic {
                text: text.text().to_owned(),
                hidden: text.is_hidden(),
            },
        })
    }

    fn private_tree_metadata_from_json_report(
        json_report: TestRendererPrivateJsonSerializationReport,
    ) -> TestRendererPrivateTreeMetadataReport {
        let component = json_report.component();
        let text = component.text_child();

        TestRendererPrivateTreeMetadataReport {
            diagnostic_name: TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
            source_json_diagnostic_name: json_report.diagnostic_name(),
            gate: json_report.gate().clone(),
            host_output_update_kind: json_report.host_output_update_kind(),
            host_output_snapshot_current: json_report.host_output_snapshot_current(),
            accepted_fiber_shape: TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE,
            root_child_count: json_report.root_child_count(),
            host_root: TestRendererPrivateTreeHostRootDiagnostic {
                fiber_tag: "HostRoot",
                delegates_to_child: true,
                child_fiber_tag: "HostComponent",
                public_tree_object_available: false,
            },
            host_component: TestRendererPrivateTreeHostComponentDiagnostic {
                fiber_tag: "HostComponent",
                node_type: TestRendererPrivateTreeNodeType::Host,
                element_type: component.element_type().clone(),
                props: component.props().clone(),
                instance_available: false,
                rendered_child_count: component.child_count(),
                rendered_text: text.text().to_owned(),
                public_tree_object_available: false,
            },
            host_text: TestRendererPrivateTreeHostTextDiagnostic {
                fiber_tag: "HostText",
                text: text.text().to_owned(),
                returns_text_value: true,
                public_tree_object_available: false,
            },
            public_blockers: json_report.public_blockers(),
            public_tree_object_available: false,
        }
    }

    const fn instance_state_node_raw(instance: TestInstance) -> u64 {
        instance.index as u64 + 1
    }

    const fn text_state_node_raw(text: TestTextInstance) -> u64 {
        text.index as u64 + 1
    }
}

impl HostTypes for TestRenderer {
    type HostFiberToken = TestHostFiberToken;
    type Type = TestElementType;
    type Props = TestProps;
    type Container = TestContainer;
    type Instance = TestInstance;
    type TextInstance = TestTextInstance;
    type PublicInstance = TestInstance;
    type HostContext = TestHostContext;
    type UpdatePayload = TestUpdatePayload;
    type TimeoutHandle = ();
    type NoTimeout = ();
    type CommitState = TestCommitState;
    type EventPriority = ();
    type EventType = ();
    type EventTimestamp = ();
    type ActivityInstance = ();
    type SuspenseInstance = ();
    type HydratableInstance = ();
    type FormInstance = ();
    type ChildSet = ();
    type Resource = ();
    type HoistableRoot = ();
    type TransitionStatus = ();
    type SuspendedState = ();
    type RunningViewTransition = ();
    type ViewTransitionInstance = ();
    type InstanceMeasurement = ();
    type EventResponder = ();
    type GestureTimeline = ();
    type FragmentInstance = ();
    type RendererInspectionConfig = ();
}

impl HostIdentityAndContext for TestRenderer {
    fn renderer_name(&self) -> &'static str {
        TEST_RENDERER_NAME
    }

    fn renderer_version(&self) -> Option<&'static str> {
        Some(env!("CARGO_PKG_VERSION"))
    }

    fn capabilities(&self) -> HostCapabilitySet {
        HostCapabilitySet::empty().with(HostCapability::Mutation)
    }

    fn get_public_instance(&self, instance: &Self::Instance) -> HostResult<Self::PublicInstance> {
        self.instance_record(*instance)?;
        Ok(*instance)
    }

    fn root_host_context(&self, container: &Self::Container) -> HostResult<Self::HostContext> {
        self.container_record(*container)?;
        Ok(TestHostContext::default())
    }

    fn child_host_context(
        &self,
        parent_context: &Self::HostContext,
        _ty: &Self::Type,
        _props: &Self::Props,
    ) -> HostResult<Self::HostContext> {
        Ok(TestHostContext {
            depth: parent_context.depth + 1,
        })
    }
}

impl HostCreation for TestRenderer {
    fn should_set_text_content(
        &self,
        _ty: &Self::Type,
        props: &Self::Props,
        _context: &Self::HostContext,
    ) -> bool {
        props.text_content().is_some()
    }

    fn create_instance(
        &mut self,
        token: HostFiberTokenRef<'_, Self>,
        ty: &Self::Type,
        props: &Self::Props,
        container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<Self::Instance> {
        self.validate_fiber_token(
            token,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        )?;
        self.container_record(*container)?;
        Ok(self.push_instance(ty.clone(), props.clone()))
    }

    fn create_text_instance(
        &mut self,
        token: HostFiberTokenRef<'_, Self>,
        text: &str,
        container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<Self::TextInstance> {
        self.validate_fiber_token(
            token,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        )?;
        self.container_record(*container)?;
        Ok(self.push_text(text.to_owned()))
    }

    fn append_initial_child(
        &mut self,
        parent: &mut Self::Instance,
        child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        let child = Self::host_child_to_handle(child);
        self.validate_parent_child_mutation(*parent, child)?;
        self.detach_child_from_all_parents(child);
        let parent = self.instance_record_mut(*parent)?;
        Self::append_child_handle(&mut parent.children, child);
        Ok(())
    }

    fn finalize_initial_children(
        &mut self,
        instance: &mut Self::Instance,
        _ty: &Self::Type,
        _props: &Self::Props,
        container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<InitialChildrenFinalization> {
        self.instance_record(*instance)?;
        self.container_record(*container)?;
        Ok(InitialChildrenFinalization::NoCommitMount)
    }

    fn clone_mutable_instance(
        &mut self,
        instance: &Self::Instance,
        update_payload: Option<&Self::UpdatePayload>,
    ) -> HostResult<Self::Instance> {
        let mut record = self.instance_record(*instance)?.clone();
        if let Some(update_payload) = update_payload {
            record.props = update_payload.props.clone();
        }
        record.detached = false;

        let cloned = TestInstance {
            renderer_id: self.renderer_id,
            index: self.instances.len(),
        };
        self.instances.push(record);
        Ok(cloned)
    }

    fn clone_mutable_text_instance(
        &mut self,
        text_instance: &Self::TextInstance,
    ) -> HostResult<Self::TextInstance> {
        let record = self.text_record(*text_instance)?.clone();
        let cloned = TestTextInstance {
            renderer_id: self.renderer_id,
            index: self.texts.len(),
        };
        self.texts.push(record);
        Ok(cloned)
    }
}

impl HostCommit for TestRenderer {
    fn prepare_for_commit(&mut self, container: &Self::Container) -> HostResult<Self::CommitState> {
        self.container_record(*container)?;
        Ok(TestCommitState {
            container: *container,
        })
    }

    fn reset_after_commit(
        &mut self,
        container: &Self::Container,
        commit_state: Self::CommitState,
    ) -> HostResult<()> {
        self.container_record(*container)?;
        self.container_record(commit_state.container)?;
        Ok(())
    }

    fn commit_mount(
        &mut self,
        token: HostFiberTokenRef<'_, Self>,
        instance: &mut Self::Instance,
        _ty: &Self::Type,
        _props: &Self::Props,
    ) -> HostResult<()> {
        self.validate_fiber_token(
            token,
            HostFiberTokenPhase::Commit,
            HostFiberTokenTarget::Instance,
        )?;
        self.instance_record(*instance)?;
        Ok(())
    }

    fn commit_update(
        &mut self,
        token: HostFiberTokenRef<'_, Self>,
        instance: &mut Self::Instance,
        update_payload: Self::UpdatePayload,
        _ty: &Self::Type,
        _old_props: &Self::Props,
        _new_props: &Self::Props,
    ) -> HostResult<()> {
        self.validate_fiber_token(
            token,
            HostFiberTokenPhase::Commit,
            HostFiberTokenTarget::Instance,
        )?;
        self.instance_record_mut(*instance)?.props = update_payload.props;
        Ok(())
    }

    fn commit_text_update(
        &mut self,
        text_instance: &mut Self::TextInstance,
        _old_text: &str,
        new_text: &str,
    ) -> HostResult<()> {
        self.text_record_mut(*text_instance)?.text = new_text.to_owned();
        Ok(())
    }

    fn reset_text_content(&mut self, instance: &mut Self::Instance) -> HostResult<()> {
        self.instance_record_mut(*instance)?.children.clear();
        Ok(())
    }

    fn hide_instance(&mut self, instance: &mut Self::Instance) -> HostResult<()> {
        self.instance_record_mut(*instance)?.hidden = true;
        Ok(())
    }

    fn unhide_instance(
        &mut self,
        instance: &mut Self::Instance,
        _props: &Self::Props,
    ) -> HostResult<()> {
        self.instance_record_mut(*instance)?.hidden = false;
        Ok(())
    }

    fn hide_text_instance(&mut self, text_instance: &mut Self::TextInstance) -> HostResult<()> {
        self.text_record_mut(*text_instance)?.hidden = true;
        Ok(())
    }

    fn unhide_text_instance(
        &mut self,
        text_instance: &mut Self::TextInstance,
        _text: &str,
    ) -> HostResult<()> {
        self.text_record_mut(*text_instance)?.hidden = false;
        Ok(())
    }

    fn detach_deleted_instance(
        &mut self,
        token: HostFiberTokenRef<'_, Self>,
        instance: Self::Instance,
    ) -> HostResult<()> {
        self.validate_fiber_token(
            token,
            HostFiberTokenPhase::Deletion,
            HostFiberTokenTarget::Instance,
        )?;
        let record = self.instance_record_mut(instance)?;
        record.children.clear();
        record.detached = true;
        Ok(())
    }
}

impl MutationHost for TestRenderer {
    fn append_child(
        &mut self,
        parent: &mut Self::Instance,
        child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        let child = Self::host_child_to_handle(child);
        self.validate_parent_child_mutation(*parent, child)?;
        self.detach_child_from_all_parents(child);
        let parent = self.instance_record_mut(*parent)?;
        Self::append_child_handle(&mut parent.children, child);
        Ok(())
    }

    fn append_child_to_container(
        &mut self,
        container: &mut Self::Container,
        child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        let child = Self::host_child_to_handle(child);
        self.container_record(*container)?;
        self.validate_child_handle(child)?;
        self.detach_child_from_all_parents(child);
        let container = self.container_record_mut(*container)?;
        Self::append_child_handle(&mut container.children, child);
        Ok(())
    }

    fn insert_before(
        &mut self,
        parent: &mut Self::Instance,
        child: HostChild<'_, Self>,
        before_child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        let child = Self::host_child_to_handle(child);
        let before_child = Self::host_child_to_handle(before_child);
        self.validate_parent_child_mutation(*parent, child)?;
        self.validate_child_handle(before_child)?;
        if !self.child_attached_to_parent(*parent, before_child)? {
            return Err(Self::missing_insertion_target_error(
                HostParentKind::Instance,
                before_child.kind(),
            ));
        }

        if child != before_child {
            self.detach_child_from_all_parents(child);
        }
        let parent = self.instance_record_mut(*parent)?;
        Self::insert_child_handle_before(
            &mut parent.children,
            child,
            before_child,
            HostParentKind::Instance,
        )
    }

    fn insert_in_container_before(
        &mut self,
        container: &mut Self::Container,
        child: HostChild<'_, Self>,
        before_child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        let child = Self::host_child_to_handle(child);
        let before_child = Self::host_child_to_handle(before_child);
        self.container_record(*container)?;
        self.validate_child_handle(child)?;
        self.validate_child_handle(before_child)?;
        if !self.child_attached_to_container(*container, before_child)? {
            return Err(Self::missing_insertion_target_error(
                HostParentKind::Container,
                before_child.kind(),
            ));
        }

        if child != before_child {
            self.detach_child_from_all_parents(child);
        }
        let container = self.container_record_mut(*container)?;
        Self::insert_child_handle_before(
            &mut container.children,
            child,
            before_child,
            HostParentKind::Container,
        )
    }

    fn remove_child(
        &mut self,
        parent: &mut Self::Instance,
        child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        let child = Self::host_child_to_handle(child);
        self.validate_child_handle(child)?;
        let parent = self.instance_record_mut(*parent)?;
        Self::remove_child_handle(&mut parent.children, child, HostParentKind::Instance)
    }

    fn remove_child_from_container(
        &mut self,
        container: &mut Self::Container,
        child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        let child = Self::host_child_to_handle(child);
        self.validate_child_handle(child)?;
        let container = self.container_record_mut(*container)?;
        Self::remove_child_handle(&mut container.children, child, HostParentKind::Container)
    }

    fn clear_container(&mut self, container: &mut Self::Container) -> HostResult<()> {
        self.container_record_mut(*container)?.children.clear();
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::AtomicUsize;

    use fast_react_host_config::{HostOperationErrorKind, HostTreeUpdateMode, MutationRenderer};
    use fast_react_reconciler::{
        RootTaskScheduleOutcome, RootUpdateCallbackRecord, RootUpdateCallbackVisibility,
        TestRendererHostOutputCanaryMutationKind,
    };

    static TEST_HOST_FIBER_TOKEN: TestHostFiberToken = 1;

    fn element_type(name: &str) -> TestElementType {
        TestElementType::new(name)
    }

    fn props() -> TestProps {
        TestProps::new()
    }

    fn host_fiber_token(
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
    ) -> HostFiberTokenRef<'static, TestRenderer> {
        HostFiberTokenRef::new(&TEST_HOST_FIBER_TOKEN, phase, target)
    }

    fn creation_instance_token() -> HostFiberTokenRef<'static, TestRenderer> {
        host_fiber_token(
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        )
    }

    fn creation_text_token() -> HostFiberTokenRef<'static, TestRenderer> {
        host_fiber_token(
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        )
    }

    fn commit_instance_token() -> HostFiberTokenRef<'static, TestRenderer> {
        host_fiber_token(HostFiberTokenPhase::Commit, HostFiberTokenTarget::Instance)
    }

    fn deletion_instance_token() -> HostFiberTokenRef<'static, TestRenderer> {
        host_fiber_token(
            HostFiberTokenPhase::Deletion,
            HostFiberTokenTarget::Instance,
        )
    }

    fn create_instance(
        renderer: &mut TestRenderer,
        container: &TestContainer,
        name: &str,
    ) -> TestInstance {
        let context = renderer.root_host_context(container).unwrap();
        renderer
            .create_instance(
                creation_instance_token(),
                &element_type(name),
                &props(),
                container,
                &context,
            )
            .unwrap()
    }

    fn create_text(
        renderer: &mut TestRenderer,
        container: &TestContainer,
        text: &str,
    ) -> TestTextInstance {
        let context = renderer.root_host_context(container).unwrap();
        renderer
            .create_text_instance(creation_text_token(), text, container, &context)
            .unwrap()
    }

    fn child_texts(snapshot: &TestElementSnapshot) -> Vec<&str> {
        snapshot
            .children()
            .iter()
            .map(|child| match child {
                TestNodeSnapshot::Text(text) => text.text(),
                TestNodeSnapshot::Element(_) => panic!("expected text child"),
            })
            .collect()
    }

    fn container_element_names(snapshot: &TestContainerSnapshot) -> Vec<&str> {
        snapshot
            .children()
            .iter()
            .map(|child| match child {
                TestNodeSnapshot::Element(element) => element.element_type().as_str(),
                TestNodeSnapshot::Text(_) => panic!("expected element child"),
            })
            .collect()
    }

    fn container_element_texts(snapshot: &TestContainerSnapshot) -> Vec<&str> {
        snapshot
            .children()
            .iter()
            .map(|child| match child {
                TestNodeSnapshot::Element(element) => match &element.children()[0] {
                    TestNodeSnapshot::Text(text) => text.text(),
                    TestNodeSnapshot::Element(_) => panic!("expected text child"),
                },
                TestNodeSnapshot::Text(_) => panic!("expected element child"),
            })
            .collect()
    }

    fn nested_container_inner_names(snapshot: &TestContainerSnapshot) -> Vec<&str> {
        snapshot
            .children()
            .iter()
            .map(|child| match child {
                TestNodeSnapshot::Element(outer) => match &outer.children()[0] {
                    TestNodeSnapshot::Element(inner) => inner.element_type().as_str(),
                    TestNodeSnapshot::Text(_) => panic!("expected nested element child"),
                },
                TestNodeSnapshot::Text(_) => panic!("expected outer element child"),
            })
            .collect()
    }

    fn nested_container_inner_texts(snapshot: &TestContainerSnapshot) -> Vec<&str> {
        let TestNodeSnapshot::Element(outer) = &snapshot.children()[0] else {
            panic!("expected outer element child");
        };
        let TestNodeSnapshot::Element(inner) = &outer.children()[0] else {
            panic!("expected inner element child");
        };
        child_texts(inner)
    }

    fn assert_mutation_renderer<T: MutationRenderer>(_renderer: &T) {}

    fn assert_operation_error(error: HostError, expected: HostOperationErrorKind) {
        let operation = error.as_operation_error().unwrap();

        assert!(error.as_unsupported_capability().is_none());
        assert_eq!(operation.renderer_name(), TEST_RENDERER_NAME);
        assert_eq!(operation.kind(), &expected);
    }

    fn root_element(raw: u64) -> RootElementHandle {
        RootElementHandle::from_raw(raw)
    }

    fn current_host_root_element(root: &TestRendererRoot) -> RootElementHandle {
        let current = root.store().root(root.root_id()).unwrap().current();
        let state = root
            .store()
            .fiber_arena()
            .get(current)
            .unwrap()
            .memoized_state();
        root.store()
            .host_root_states()
            .get(state)
            .unwrap()
            .element()
    }

    fn host_storage_counts(root: &TestRendererRoot) -> (usize, usize, usize) {
        (
            root.renderer.containers.len(),
            root.renderer.instances.len(),
            root.renderer.texts.len(),
        )
    }

    fn host_node_activity_counts(root: &TestRendererRoot) -> (usize, usize) {
        (
            root.host_nodes.active_total(),
            root.host_nodes.inactive_total(),
        )
    }

    fn render_and_commit_latest_host_root(
        root: &mut TestRendererRoot,
    ) -> (HostRootRenderPhaseRecord, HostRootCommitRecord) {
        let render = root
            .render_latest_scheduled_host_root_for_commit_handoff()
            .unwrap()
            .unwrap();
        let commit = root.commit_host_root_render_for_canary(render).unwrap();
        (render, commit)
    }

    fn assert_empty_root_update_callback_snapshot(
        commit: &HostRootCommitRecord,
        render: &HostRootRenderPhaseRecord,
    ) {
        let callbacks = commit.root_update_callbacks();

        assert_eq!(callbacks.queue(), render.work_in_progress_update_queue());
        assert!(callbacks.is_empty());
        assert!(callbacks.visible().is_empty());
        assert!(callbacks.hidden().is_empty());
        assert!(callbacks.deferred_hidden().is_empty());
    }

    fn assert_visible_root_update_callback_snapshot(
        commit: &HostRootCommitRecord,
        render: &HostRootRenderPhaseRecord,
        scheduled_update: &TestRendererRootScheduledUpdate,
        callback: RootUpdateCallbackHandle,
    ) {
        let callbacks = commit.root_update_callbacks();

        assert_eq!(callbacks.queue(), render.work_in_progress_update_queue());
        assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
        assert_eq!(
            callbacks.visible()[0].queue(),
            render.work_in_progress_update_queue()
        );
        assert_eq!(
            callbacks.visible()[0].update(),
            scheduled_update.container_update().update()
        );
        assert_eq!(callbacks.visible()[0].sequence(), 0);
        assert_eq!(
            callbacks.visible()[0].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert!(callbacks.hidden().is_empty());
        assert!(callbacks.deferred_hidden().is_empty());
    }

    fn callback_handles(records: &[RootUpdateCallbackRecord]) -> Vec<RootUpdateCallbackHandle> {
        records.iter().map(|record| record.callback()).collect()
    }

    #[test]
    fn root_create_enqueues_host_root_update_without_host_mutation() {
        let element = root_element(42);
        let root = TestRendererRoot::create(element, TestRendererOptions::new()).unwrap();
        let update = root.last_scheduled_update().unwrap();
        let pending_updates = root
            .store()
            .update_queues()
            .pending_updates(update.container_update().queue())
            .unwrap();

        assert_eq!(root.store().len(), 1);
        assert_eq!(root.lifecycle(), TestRendererRootLifecycle::Active);
        assert_eq!(update.kind(), TestRendererRootUpdateKind::Create);
        assert_eq!(update.element(), element);
        assert_eq!(update.container_update().schedule().root(), root.root_id());
        assert_eq!(
            update.container_update().schedule().fiber(),
            root.store().root(root.root_id()).unwrap().current()
        );
        assert_eq!(update.root_schedule().root(), root.root_id());
        assert!(update.root_schedule().inserted());
        assert!(update.root_schedule().microtask().is_some());
        assert_eq!(
            root.scheduled_roots_for_canary().unwrap(),
            vec![root.root_id()]
        );
        assert_eq!(pending_updates, vec![update.container_update().update()]);
        assert_eq!(
            root.store()
                .update_queues()
                .update(update.container_update().update())
                .unwrap()
                .payload()
                .unwrap()
                .element(),
            element
        );
        assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
        assert!(
            root.diagnostic_container_snapshot()
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn root_update_reuses_same_fiber_root_and_shared_scheduler_record() {
        let mut root =
            TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        let root_id = root.root_id();
        let current = root.store().root(root_id).unwrap().current();
        let first_queue = root
            .last_scheduled_update()
            .unwrap()
            .container_update()
            .queue();

        let outcome = root.update(root_element(2)).unwrap();
        let update = outcome.scheduled().unwrap();
        let pending_updates = root
            .store()
            .update_queues()
            .pending_updates(update.container_update().queue())
            .unwrap();

        assert_eq!(root.root_id(), root_id);
        assert_eq!(root.store().root(root_id).unwrap().current(), current);
        assert_eq!(root.scheduled_updates().len(), 2);
        assert_eq!(update.kind(), TestRendererRootUpdateKind::Update);
        assert_eq!(update.element(), root_element(2));
        assert_eq!(update.container_update().queue(), first_queue);
        assert!(!update.root_schedule().inserted());
        assert_eq!(update.root_schedule().microtask(), None);
        assert_eq!(root.scheduled_roots_for_canary().unwrap(), vec![root_id]);
        assert_eq!(pending_updates.len(), 2);
        assert_eq!(
            root.store()
                .update_queues()
                .update(update.container_update().update())
                .unwrap()
                .payload()
                .unwrap()
                .element(),
            root_element(2)
        );
        assert!(
            root.diagnostic_container_snapshot()
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn root_render_phase_canary_reaches_wip_state_without_committing() {
        let mut root =
            TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        root.update(root_element(2)).unwrap();
        let current = root.store().root(root.root_id()).unwrap().current();

        let schedule = root.process_root_schedule_microtask_for_canary().unwrap();
        let render = root
            .render_latest_scheduled_host_root_for_commit_handoff()
            .unwrap()
            .unwrap();

        assert_eq!(schedule.records().len(), 1);
        assert_eq!(
            schedule.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        assert_eq!(render.root(), root.root_id());
        assert_eq!(render.resulting_element(), root_element(2));
        assert_eq!(render.applied_update_count(), 2);
        assert_eq!(render.skipped_update_count(), 0);
        assert_eq!(
            render.render_lanes(),
            root.last_scheduled_update()
                .unwrap()
                .container_update()
                .lane()
                .to_lanes()
        );
        assert_eq!(
            root.store().root(root.root_id()).unwrap().current(),
            current
        );
        assert_eq!(
            root.store().root(root.root_id()).unwrap().finished_work(),
            None
        );
        assert!(
            root.diagnostic_container_snapshot()
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn root_host_output_canary_commits_minimal_host_component_with_text() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let previous_current = root.store().root(root.root_id()).unwrap().current();

        let output = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let render = output.render();
        let commit = output.commit();
        let completed = output.completed_fibers();
        let prepared = output.prepared_fibers();
        let fiber_inspection = output.fiber_inspection();
        let snapshot = output.snapshot();

        assert_eq!(render.root(), root.root_id());
        assert_eq!(render.current(), previous_current);
        assert_eq!(commit.root(), root.root_id());
        assert_eq!(commit.previous_current(), previous_current);
        assert_eq!(commit.current(), render.finished_work());
        assert_eq!(completed.root(), root.root_id());
        assert_eq!(completed.host_root(), render.finished_work());
        assert_eq!(completed.prepared(), prepared);
        assert_ne!(completed.component(), completed.text());
        assert_eq!(completed.component_state_node_raw(), 1);
        assert_eq!(completed.text_state_node_raw(), 1);
        assert_eq!(prepared.text_token().raw(), 1);
        assert_eq!(prepared.component_token().raw(), 2);
        assert_eq!(root.store().host_tokens().len(), 2);
        assert_eq!(fiber_inspection.root(), root.root_id());
        assert_eq!(fiber_inspection.current(), commit.current());
        assert_eq!(
            fiber_inspection.resulting_element(),
            render.resulting_element()
        );
        assert_eq!(fiber_inspection.host_root().fiber(), commit.current());
        assert_eq!(
            fiber_inspection.host_root().child(),
            Some(completed.component())
        );
        assert_eq!(
            fiber_inspection.host_component().fiber(),
            completed.component()
        );
        assert_eq!(
            fiber_inspection.host_component().parent(),
            Some(commit.current())
        );
        assert_eq!(
            fiber_inspection.host_component().child(),
            Some(completed.text())
        );
        assert_eq!(fiber_inspection.host_text().fiber(), completed.text());
        assert_eq!(
            fiber_inspection.host_text().parent(),
            Some(completed.component())
        );
        assert_eq!(fiber_inspection.host_text().child(), None);
        assert!(fiber_inspection.host_component().state_node_present());
        assert!(fiber_inspection.host_text().state_node_present());
        assert_empty_root_update_callback_snapshot(commit, &render);
        assert_eq!(
            root.store().root(root.root_id()).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(host_storage_counts(&root), (1, 1, 1));
        assert_eq!(host_node_activity_counts(&root), (2, 0));
        assert_eq!(snapshot.children().len(), 1);

        let TestNodeSnapshot::Element(element) = &snapshot.children()[0] else {
            panic!("expected committed host component");
        };
        assert_eq!(element.element_type().as_str(), "span");
        assert_eq!(element.props(), &TestProps::new());
        assert!(!element.is_hidden());
        assert!(!element.is_detached());
        assert_eq!(child_texts(element), vec!["hello"]);
        assert_eq!(
            root.diagnostic_container_snapshot().unwrap(),
            snapshot.clone()
        );
    }

    #[test]
    fn root_host_output_canary_applies_host_parent_text_placement_privately() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let created = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();

        let placed = root
            .render_and_commit_host_parent_text_placement_for_canary("inserted")
            .unwrap();
        let render = placed.render();
        let commit = placed.commit();
        let diagnostics = placed.commit_diagnostics();

        assert_eq!(render.root(), root.root_id());
        assert_eq!(render.current(), created.commit().current());
        assert_eq!(render.resulting_element(), root_element(1));
        assert_eq!(commit.previous_current(), created.commit().current());
        assert_eq!(commit.current(), render.finished_work());
        assert_eq!(placed.host_parent_placement_apply_count(), 1);
        assert!(commit.has_test_only_host_parent_placement_apply_for_canary(1, 2));
        assert_eq!(diagnostics.deletion_lists().len(), 0);
        assert_eq!(diagnostics.mutation_records().len(), 1);
        assert_eq!(
            diagnostics.mutation_records()[0].kind(),
            TestRendererHostOutputCanaryMutationKind::Placement
        );
        assert_eq!(diagnostics.mutation_records()[0].state_node_raw(), 2);
        assert_eq!(diagnostics.mutation_records()[0].memoized_props_raw(), 1003);
        assert_eq!(host_storage_counts(&root), (1, 1, 2));
        assert_eq!(placed.placed_text_snapshot().text(), "inserted");

        let TestNodeSnapshot::Element(previous) = &placed.previous_snapshot().children()[0] else {
            panic!("expected previous host component");
        };
        assert_eq!(child_texts(previous), vec!["hello"]);
        let TestNodeSnapshot::Element(element) = &placed.snapshot().children()[0] else {
            panic!("expected placed host component");
        };
        assert_eq!(element.element_type().as_str(), "span");
        assert_eq!(child_texts(element), vec!["hello", "inserted"]);
        assert_eq!(
            root.diagnostic_container_snapshot().unwrap(),
            placed.snapshot().clone()
        );
        assert_eq!(current_host_root_element(&root), root_element(1));

        let inspection_error = root
            .describe_committed_fiber_tree_for_canary(commit)
            .unwrap_err();
        assert!(matches!(
            inspection_error,
            TestRendererRootError::FiberInspection(_)
        ));
    }

    #[test]
    fn root_host_output_canary_applies_nested_host_parent_text_placement_privately() {
        let mut root = TestRendererRoot::create_nested_host_components_with_text_for_canary(
            "section",
            "label",
            "stable",
            TestRendererOptions::new(),
        )
        .unwrap();
        let created = root
            .render_and_commit_nested_host_output_for_canary()
            .unwrap()
            .unwrap();

        assert_eq!(container_element_names(created.snapshot()), vec!["section"]);
        assert_eq!(
            nested_container_inner_names(created.snapshot()),
            vec!["label"]
        );
        assert_eq!(
            nested_container_inner_texts(created.snapshot()),
            vec!["stable"]
        );

        let placed = root
            .render_and_commit_nested_host_parent_text_placement_for_canary("inserted")
            .unwrap();
        let commit = placed.commit();
        let diagnostics = commit.host_parent_placement_apply_diagnostics_for_canary();

        assert_eq!(placed.render().current(), created.commit().current());
        assert_eq!(commit.previous_current(), created.commit().current());
        assert_eq!(commit.current(), placed.render().finished_work());
        assert_eq!(placed.host_parent_placement_apply_count(), 1);
        assert!(commit.has_test_only_host_parent_placement_apply_for_canary(
            placed.nested_parent_state_node_raw(),
            placed.placed_text_state_node_raw()
        ));
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].parent_tag_name(), "HostComponent");
        assert_eq!(
            diagnostics[0].parent_state_node_raw(),
            placed.nested_parent_state_node_raw()
        );
        assert_eq!(diagnostics[0].tag_name(), "HostText");
        assert_eq!(
            diagnostics[0].state_node_raw(),
            placed.placed_text_state_node_raw()
        );
        assert_eq!(
            diagnostics[0].apply_kind(),
            "append-placement-to-host-parent"
        );
        assert!(diagnostics[0].applies_to_host_parent());
        assert_eq!(placed.commit_diagnostics().mutation_records().len(), 1);
        assert_eq!(
            placed.commit_diagnostics().mutation_records()[0].kind(),
            TestRendererHostOutputCanaryMutationKind::Placement
        );
        assert_eq!(placed.placed_text_snapshot().text(), "inserted");
        assert_eq!(
            nested_container_inner_texts(placed.previous_snapshot()),
            vec!["stable"]
        );
        assert_eq!(
            nested_container_inner_texts(placed.snapshot()),
            vec!["stable", "inserted"]
        );
        assert_eq!(
            root.diagnostic_container_snapshot().unwrap(),
            placed.snapshot().clone()
        );
    }

    #[test]
    fn root_private_json_serialization_canary_describes_minimal_host_component_with_text() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let output = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();

        let report = root
            .describe_private_json_serialization_for_canary(&output)
            .unwrap();
        let gate = report.gate();
        let host_output = gate.host_output();
        let fiber_inspection = gate.fiber_inspection().unwrap();
        let blockers = report.public_blockers();
        let component = report.component();
        let text = component.text_child();
        let nodes = report.nodes();
        macro_rules! fiber_handle {
            ($fiber:expr) => {{
                let fiber = $fiber;
                TestRendererFiberHandleDiagnostics {
                    arena_id: fiber.arena_id().get(),
                    slot: fiber.slot().get(),
                    generation: fiber.generation().get(),
                }
            }};
        }
        let host_root_fiber = fiber_handle!(fiber_inspection.host_root().fiber());
        let component_fiber = fiber_handle!(fiber_inspection.host_component().fiber());
        let text_fiber = fiber_handle!(fiber_inspection.host_text().fiber());

        assert_eq!(
            report.diagnostic_name(),
            TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
        );
        assert_eq!(
            report.host_output_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert!(report.host_output_snapshot_current());
        assert_eq!(
            gate.status(),
            TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
        );
        assert!(!gate.is_closed());
        assert!(gate.is_ready());
        assert_eq!(host_output.container_child_count(), 1);
        assert_eq!(host_output.instance_count(), 1);
        assert_eq!(host_output.text_count(), 1);
        assert!(host_output.real_host_output_available());
        assert!(gate.requirements().root_commit_diagnostics_available());
        assert!(gate.requirements().real_host_output_available());
        assert!(gate.requirements().committed_fiber_inspection_available());
        assert!(gate.requirements().private_serialization_ready());
        assert_eq!(fiber_inspection.current(), output.commit().current());
        assert_eq!(
            fiber_inspection.host_component().fiber(),
            output.completed_fibers().component()
        );
        assert_eq!(
            fiber_inspection.host_text().fiber(),
            output.completed_fibers().text()
        );
        assert_eq!(report.root_child_count(), 1);
        assert_eq!(
            report.root_node_kind(),
            TestRendererPrivateJsonNodeKind::HostComponent
        );
        assert_eq!(
            component.node_kind(),
            TestRendererPrivateJsonNodeKind::HostComponent
        );
        assert_eq!(report.node_count(), 2);
        assert_eq!(nodes.len(), 2);
        assert_eq!(nodes[0].ordinal(), 0);
        assert_eq!(
            nodes[0].node_kind(),
            TestRendererPrivateJsonNodeKind::HostComponent
        );
        assert_eq!(nodes[0].parent_ordinal(), None);
        assert_eq!(nodes[0].child_ordinals(), &[1]);
        assert_eq!(nodes[0].child_count(), 1);
        assert_eq!(nodes[0].element_type().unwrap().as_str(), "span");
        assert_eq!(nodes[0].props(), Some(&TestProps::new()));
        assert_eq!(nodes[0].text(), None);
        assert!(!nodes[0].is_hidden());
        assert!(!nodes[0].is_detached());
        assert_eq!(nodes[0].fiber().fiber(), component_fiber);
        assert_eq!(nodes[0].fiber().parent(), Some(host_root_fiber));
        assert_eq!(nodes[0].fiber().child(), Some(text_fiber));
        assert_eq!(nodes[0].fiber().sibling(), None);
        assert_eq!(nodes[0].fiber().pending_props_raw(), 1);
        assert_eq!(nodes[0].fiber().memoized_props_raw(), 1);
        assert!(nodes[0].fiber().state_node_present());
        assert_eq!(nodes[1].ordinal(), 1);
        assert_eq!(nodes[1].node_kind(), TestRendererPrivateJsonNodeKind::Text);
        assert_eq!(nodes[1].parent_ordinal(), Some(0));
        assert!(nodes[1].child_ordinals().is_empty());
        assert_eq!(nodes[1].child_count(), 0);
        assert!(nodes[1].element_type().is_none());
        assert!(nodes[1].props().is_none());
        assert_eq!(nodes[1].text(), Some("hello"));
        assert!(!nodes[1].is_hidden());
        assert!(!nodes[1].is_detached());
        assert_eq!(nodes[1].fiber().fiber(), text_fiber);
        assert_eq!(nodes[1].fiber().parent(), Some(component_fiber));
        assert_eq!(nodes[1].fiber().child(), None);
        assert_eq!(nodes[1].fiber().sibling(), None);
        assert_eq!(nodes[1].fiber().pending_props_raw(), 2);
        assert_eq!(nodes[1].fiber().memoized_props_raw(), 2);
        assert!(nodes[1].fiber().state_node_present());
        assert_eq!(component.element_type().as_str(), "span");
        assert_eq!(component.props(), &TestProps::new());
        assert_eq!(component.child_count(), 1);
        assert!(!component.is_hidden());
        assert!(!component.is_detached());
        assert_eq!(text.node_kind(), TestRendererPrivateJsonNodeKind::Text);
        assert_eq!(text.text(), "hello");
        assert!(!text.is_hidden());
        assert!(blockers.all_blocked());
        assert!(blockers.json_method_blocked());
        assert!(blockers.tree_method_blocked());
        assert!(blockers.instance_wrapper_blocked());
        assert!(blockers.js_facade_routing_blocked());
        assert!(blockers.public_act_blocked());
        assert!(blockers.compatibility_claim_blocked());
    }

    #[test]
    fn root_private_json_serialization_canary_describes_updated_host_component_text_after_commit() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let created = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        root.update_host_component_with_text_for_canary("span", "goodbye")
            .unwrap();
        let updated = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();

        let report = root
            .describe_private_json_serialization_after_update_for_canary(&updated)
            .unwrap();
        let gate = report.gate();
        let fiber_inspection = gate.fiber_inspection().unwrap();
        let component = report.component();
        let text = component.text_child();
        let nodes = report.nodes();

        assert_eq!(updated.render().current(), created.commit().current());
        assert_eq!(updated.commit().current(), updated.render().finished_work());
        assert_eq!(
            report.diagnostic_name(),
            TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
        );
        assert_eq!(
            report.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert!(report.host_output_snapshot_current());
        assert_eq!(
            gate.status(),
            TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
        );
        assert_eq!(fiber_inspection, updated.fiber_inspection());
        assert_eq!(fiber_inspection.current(), updated.commit().current());
        assert_eq!(
            fiber_inspection.host_component().fiber(),
            updated.updated_fibers().component()
        );
        assert_eq!(
            fiber_inspection.host_text().fiber(),
            updated.updated_fibers().text()
        );
        assert_eq!(report.root_child_count(), 1);
        assert_eq!(
            report.root_node_kind(),
            TestRendererPrivateJsonNodeKind::HostComponent
        );
        assert_eq!(report.node_count(), 2);
        assert_eq!(nodes[0].ordinal(), 0);
        assert_eq!(
            nodes[0].node_kind(),
            TestRendererPrivateJsonNodeKind::HostComponent
        );
        assert_eq!(nodes[0].element_type().unwrap().as_str(), "span");
        assert_eq!(nodes[0].props(), Some(&TestProps::new()));
        assert_eq!(nodes[0].child_ordinals(), &[1]);
        assert_eq!(nodes[1].ordinal(), 1);
        assert_eq!(nodes[1].node_kind(), TestRendererPrivateJsonNodeKind::Text);
        assert_eq!(nodes[1].parent_ordinal(), Some(0));
        assert_eq!(nodes[1].text(), Some("goodbye"));
        assert_eq!(component.element_type().as_str(), "span");
        assert_eq!(component.props(), &TestProps::new());
        assert_eq!(component.child_count(), 1);
        assert_eq!(text.text(), "goodbye");
        assert!(report.public_blockers().all_blocked());

        let TestNodeSnapshot::Element(previous) = &updated.previous_snapshot().children()[0] else {
            panic!("expected previous host component");
        };
        assert_eq!(child_texts(previous), vec!["hello"]);
        let TestNodeSnapshot::Element(current) = &updated.snapshot().children()[0] else {
            panic!("expected updated host component");
        };
        assert_eq!(child_texts(current), vec!["goodbye"]);
    }

    #[test]
    fn root_private_to_json_facade_result_canary_wraps_create_serialization_evidence() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let output = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();

        let result = root
            .describe_private_to_json_facade_result_for_canary(&output)
            .unwrap();

        assert_eq!(
            result.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME
        );
        assert_eq!(
            result.source_diagnostic_name(),
            TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
        );
        assert_eq!(
            result.host_output_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert!(result.host_output_snapshot_current());
        assert_eq!(result.element_type().as_str(), "span");
        assert_eq!(result.props(), &TestProps::new());
        assert_eq!(result.children(), &["hello".to_owned()]);
        assert_eq!(result.child_count(), 1);
        assert_eq!(result.source_node_count(), 2);
        assert!(result.public_blockers().all_blocked());
        assert!(!result.public_serialization_available());
        assert!(!result.compatibility_claimed());
    }

    #[test]
    fn root_private_to_json_facade_result_canary_wraps_update_serialization_evidence() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        root.update_host_component_with_text_for_canary("span", "goodbye")
            .unwrap();
        let updated = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();

        let result = root
            .describe_private_to_json_facade_result_after_update_for_canary(&updated)
            .unwrap();

        assert_eq!(
            result.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME
        );
        assert_eq!(
            result.source_diagnostic_name(),
            TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
        );
        assert_eq!(
            result.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert!(result.host_output_snapshot_current());
        assert_eq!(result.element_type().as_str(), "span");
        assert_eq!(result.props(), &TestProps::new());
        assert_eq!(result.children(), &["goodbye".to_owned()]);
        assert_eq!(result.source_node_count(), 2);
        assert!(result.public_blockers().all_blocked());
        assert!(!result.public_serialization_available());
        assert!(!result.compatibility_claimed());
    }

    #[test]
    fn root_private_tree_metadata_canary_describes_minimal_host_component_with_text() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let output = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();

        let report = root
            .describe_private_tree_metadata_for_canary(&output)
            .unwrap();
        let gate = report.gate();
        let host_root = report.host_root();
        let component = report.host_component();
        let text = report.host_text();
        let blockers = report.public_blockers();

        assert_eq!(
            report.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
        );
        assert_eq!(
            report.source_json_diagnostic_name(),
            TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
        );
        assert_eq!(
            report.host_output_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert!(report.host_output_snapshot_current());
        assert_eq!(
            gate.status(),
            TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
        );
        assert_eq!(
            gate.fiber_inspection().unwrap().current(),
            output.commit().current()
        );
        assert_eq!(
            report.accepted_fiber_shape(),
            &TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE
        );
        assert_eq!(report.root_child_count(), 1);
        assert_eq!(host_root.fiber_tag(), "HostRoot");
        assert!(host_root.delegates_to_child());
        assert_eq!(host_root.child_fiber_tag(), "HostComponent");
        assert!(!host_root.public_tree_object_available());
        assert_eq!(component.fiber_tag(), "HostComponent");
        assert_eq!(component.node_type(), TestRendererPrivateTreeNodeType::Host);
        assert_eq!(component.node_type().as_str(), "host");
        assert_eq!(component.element_type().as_str(), "span");
        assert_eq!(component.props(), &TestProps::new());
        assert!(!component.instance_available());
        assert_eq!(component.rendered_child_count(), 1);
        assert_eq!(component.rendered_text(), "hello");
        assert!(!component.public_tree_object_available());
        assert_eq!(text.fiber_tag(), "HostText");
        assert_eq!(text.text(), "hello");
        assert!(text.returns_text_value());
        assert!(!text.public_tree_object_available());
        assert!(!report.public_tree_object_available());
        assert!(blockers.all_blocked());
        assert!(blockers.tree_method_blocked());
        assert!(blockers.json_method_blocked());
        assert!(blockers.instance_wrapper_blocked());
        assert!(blockers.js_facade_routing_blocked());
        assert!(blockers.compatibility_claim_blocked());
    }

    #[test]
    fn root_private_tree_metadata_canary_describes_updated_host_component_text_after_commit() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        root.update_host_component_with_text_for_canary("span", "goodbye")
            .unwrap();
        let updated = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();

        let report = root
            .describe_private_tree_metadata_after_update_for_canary(&updated)
            .unwrap();

        assert_eq!(
            report.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
        );
        assert_eq!(
            report.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert!(report.host_output_snapshot_current());
        assert_eq!(
            report.gate().status(),
            TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
        );
        assert_eq!(
            report.gate().fiber_inspection().unwrap(),
            updated.fiber_inspection()
        );
        assert_eq!(report.root_child_count(), 1);
        assert_eq!(report.host_component().element_type().as_str(), "span");
        assert_eq!(report.host_component().props(), &TestProps::new());
        assert_eq!(report.host_component().node_type().as_str(), "host");
        assert!(!report.host_component().instance_available());
        assert_eq!(report.host_component().rendered_child_count(), 1);
        assert_eq!(report.host_component().rendered_text(), "goodbye");
        assert_eq!(report.host_text().text(), "goodbye");
        assert!(report.host_text().returns_text_value());
        assert!(!report.public_tree_object_available());
        assert!(report.public_blockers().all_blocked());
    }

    #[test]
    fn root_private_tree_metadata_canary_rejects_stale_host_output_snapshot() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let mut output = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        output.snapshot = TestContainerSnapshot { children: vec![] };

        let error = root
            .describe_private_tree_metadata_for_canary(&output)
            .unwrap_err();

        let TestRendererRootError::PrivateJsonSerialization(error) = error else {
            panic!("expected private JSON serialization error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale
        ));
    }

    #[test]
    fn root_private_json_serialization_canary_rejects_stale_host_output_snapshot() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let mut output = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        output.snapshot = TestContainerSnapshot { children: vec![] };

        let error = root
            .describe_private_json_serialization_for_canary(&output)
            .unwrap_err();

        let TestRendererRootError::PrivateJsonSerialization(error) = error else {
            panic!("expected private JSON serialization error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale
        ));
    }

    #[test]
    fn root_private_json_serialization_canary_rejects_stale_updated_host_output_snapshot() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        root.update_host_component_with_text_for_canary("span", "goodbye")
            .unwrap();
        let mut updated = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();
        updated.snapshot = TestContainerSnapshot { children: vec![] };

        let error = root
            .describe_private_json_serialization_after_update_for_canary(&updated)
            .unwrap_err();

        let TestRendererRootError::PrivateJsonSerialization(error) = error else {
            panic!("expected private JSON serialization error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale
        ));
    }

    #[test]
    fn root_private_json_serialization_canary_rejects_stale_commit_after_same_shape_update() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let output = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        root.update_host_component_with_text_for_canary("span", "hello")
            .unwrap();
        let updated = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();
        assert_eq!(updated.snapshot(), output.snapshot());

        let error = root
            .describe_private_json_serialization_for_canary(&output)
            .unwrap_err();

        let TestRendererRootError::SerializationGate(error) = error else {
            panic!("expected serialization gate error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererSerializationGateError::CommitIsNotCurrent { .. }
        ));
    }

    #[test]
    fn root_private_json_serialization_canary_rejects_non_minimal_snapshot_shapes() {
        let empty_snapshot = TestContainerSnapshot { children: vec![] };
        let text_root_snapshot = TestContainerSnapshot {
            children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                text: "hello".to_owned(),
                hidden: false,
            })],
        };
        let nested_component_snapshot = TestContainerSnapshot {
            children: vec![TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: TestElementType::new("span"),
                props: TestProps::new(),
                hidden: false,
                detached: false,
                children: vec![TestNodeSnapshot::Element(TestElementSnapshot {
                    element_type: TestElementType::new("b"),
                    props: TestProps::new(),
                    hidden: false,
                    detached: false,
                    children: vec![],
                })],
            })],
        };

        let empty_error =
            TestRendererRoot::private_json_component_from_snapshot(&empty_snapshot).unwrap_err();
        let text_root_error =
            TestRendererRoot::private_json_component_from_snapshot(&text_root_snapshot)
                .unwrap_err();
        let nested_component_error =
            TestRendererRoot::private_json_component_from_snapshot(&nested_component_snapshot)
                .unwrap_err();

        assert!(matches!(
            empty_error,
            TestRendererPrivateJsonSerializationError::RootChildCount { actual: 0 }
        ));
        assert!(matches!(
            text_root_error,
            TestRendererPrivateJsonSerializationError::RootChildIsText
        ));
        assert!(matches!(
            nested_component_error,
            TestRendererPrivateJsonSerializationError::HostComponentChildIsElement {
                element_type
            } if element_type.as_str() == "span"
        ));
    }

    #[test]
    fn root_host_output_canary_updates_committed_text_with_update_diagnostics() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let created = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let create_current = created.completed_fibers().current();
        let outcome = root
            .update_host_component_with_text_for_canary("span", "goodbye")
            .unwrap();
        let scheduled = outcome.scheduled().unwrap();

        let updated = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();
        let render = updated.render();
        let commit = updated.commit();
        let fibers = updated.updated_fibers();
        let diagnostics = updated.commit_diagnostics();

        assert_eq!(scheduled.kind(), TestRendererRootUpdateKind::Update);
        assert_eq!(scheduled.element(), root_element(2));
        assert_eq!(render.root(), root.root_id());
        assert_eq!(render.current(), created.commit().current());
        assert_eq!(render.resulting_element(), root_element(2));
        assert_eq!(commit.previous_current(), created.commit().current());
        assert_eq!(commit.current(), render.finished_work());
        assert_eq!(fibers.previous(), create_current);
        assert_eq!(fibers.current().host_root(), render.finished_work());
        assert_ne!(fibers.current().component(), create_current.component());
        assert_ne!(fibers.current().text(), create_current.text());
        assert_eq!(fibers.component_state_node_raw(), 1);
        assert_eq!(fibers.text_state_node_raw(), 1);
        assert!(fibers.component_props_changed());
        assert!(fibers.text_props_changed());
        assert_eq!(root.store().host_tokens().len(), 3);
        assert_eq!(host_storage_counts(&root), (1, 1, 1));
        assert_eq!(host_node_activity_counts(&root), (2, 0));
        assert!(diagnostics.deletion_lists().is_empty());
        assert_eq!(diagnostics.mutation_records().len(), 2);
        let mutation = diagnostics.mutation_records()[0];
        assert_eq!(
            mutation.kind(),
            TestRendererHostOutputCanaryMutationKind::Update
        );
        assert_eq!(mutation.fiber(), fibers.component());
        assert_eq!(mutation.host_root(), render.finished_work());
        assert_eq!(mutation.state_node_raw(), 1);
        assert_eq!(mutation.pending_props_raw(), 3);
        assert_eq!(mutation.memoized_props_raw(), 3);
        assert_eq!(mutation.alternate_memoized_props_raw(), Some(1));
        let text_mutation = diagnostics.mutation_records()[1];
        assert_eq!(
            text_mutation.kind(),
            TestRendererHostOutputCanaryMutationKind::Update
        );
        assert_eq!(text_mutation.fiber(), fibers.current().text());
        assert_eq!(text_mutation.host_root(), render.finished_work());
        assert_eq!(text_mutation.state_node_raw(), 1);
        assert_eq!(text_mutation.pending_props_raw(), 4);
        assert_eq!(text_mutation.memoized_props_raw(), 4);
        assert_eq!(text_mutation.alternate_memoized_props_raw(), Some(2));
        assert_eq!(
            commit.test_only_host_text_update_apply_count_for_canary(),
            1
        );
        assert!(commit.has_test_only_host_text_update_apply_for_canary(
            create_current.text(),
            fibers.current().text(),
            1
        ));

        let TestNodeSnapshot::Element(previous) = &updated.previous_snapshot().children()[0] else {
            panic!("expected previous host component");
        };
        assert_eq!(child_texts(previous), vec!["hello"]);
        let TestNodeSnapshot::Element(element) = &updated.snapshot().children()[0] else {
            panic!("expected updated host component");
        };
        assert_eq!(element.element_type().as_str(), "span");
        assert_eq!(child_texts(element), vec!["goodbye"]);
        assert_eq!(
            root.diagnostic_container_snapshot().unwrap(),
            updated.snapshot().clone()
        );
        assert_eq!(current_host_root_element(&root), root_element(2));
    }

    #[test]
    fn root_host_output_canary_inserts_placed_child_before_stable_sibling() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "Stable",
            "stable",
            TestRendererOptions::new(),
        )
        .unwrap();
        let created = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let outcome = root
            .insert_host_component_with_text_before_stable_sibling_for_canary(
                "Inserted", "inserted",
            )
            .unwrap();
        let scheduled = outcome.scheduled().unwrap();

        let inserted = root
            .render_and_commit_host_output_insert_before_stable_sibling_for_canary()
            .unwrap()
            .unwrap();
        let diagnostics = inserted.insertion_diagnostics();
        let commit_diagnostics = inserted.commit_diagnostics();

        assert_eq!(scheduled.kind(), TestRendererRootUpdateKind::Update);
        assert_eq!(scheduled.element(), root_element(2));
        assert_eq!(inserted.render().current(), created.commit().current());
        assert_eq!(
            inserted.commit().previous_current(),
            created.commit().current()
        );
        assert_eq!(
            inserted.commit().current(),
            inserted.render().finished_work()
        );
        assert_eq!(
            inserted.stable_fibers().previous(),
            created.completed_fibers().current()
        );
        assert_eq!(
            inserted.stable_fibers().component_state_node_raw(),
            created.completed_fibers().component_state_node_raw()
        );
        assert_eq!(inserted.inserted_fibers().component_state_node_raw(), 2);
        assert_eq!(inserted.inserted_fibers().text_state_node_raw(), 2);
        assert_eq!(
            diagnostics.apply_kind(),
            TestRendererStableSiblingInsertionApplyKind::InsertInContainerBefore
        );
        assert_eq!(
            diagnostics.sibling_status(),
            TestRendererStableSiblingInsertionSiblingStatus::InsertBefore
        );
        assert_eq!(
            diagnostics.mutation_status(),
            TestRendererStableSiblingInsertionMutationStatus::AppliedInsertInContainerBefore
        );
        assert!(diagnostics.can_insert_before());
        assert_eq!(diagnostics.state_node_raw(), 2);
        assert_eq!(diagnostics.sibling_state_node_raw(), 1);
        assert_eq!(
            diagnostics.fiber().slot(),
            inserted.inserted_fibers().component().slot().get()
        );
        assert_eq!(
            diagnostics.sibling().unwrap().slot(),
            inserted.stable_fibers().component().slot().get()
        );
        assert_eq!(commit_diagnostics.mutation_records().len(), 1);
        assert_eq!(
            commit_diagnostics.mutation_records()[0].kind(),
            TestRendererHostOutputCanaryMutationKind::Placement
        );
        assert_eq!(
            commit_diagnostics.mutation_records()[0].fiber(),
            inserted.inserted_fibers().component()
        );
        assert_eq!(
            container_element_texts(inserted.previous_snapshot()),
            vec!["stable"]
        );
        assert_eq!(
            container_element_names(inserted.snapshot()),
            vec!["Inserted", "Stable"]
        );
        assert_eq!(
            container_element_texts(inserted.snapshot()),
            vec!["inserted", "stable"]
        );
        assert_eq!(host_storage_counts(&root), (1, 2, 2));
        assert!(root.current_host_output.is_none());
    }

    #[test]
    fn root_host_output_canary_keeps_ambiguous_sibling_insertion_recorded_only() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "Stable",
            "stable",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        root.insert_host_component_with_text_before_stable_sibling_for_canary(
            "Inserted", "inserted",
        )
        .unwrap();

        let blocked = root
            .render_and_commit_host_output_insert_before_ambiguous_sibling_for_canary()
            .unwrap()
            .unwrap();
        let diagnostics = blocked.insertion_diagnostics();

        assert_eq!(
            diagnostics.apply_kind(),
            TestRendererStableSiblingInsertionApplyKind::InsertionBlocked
        );
        assert_eq!(
            diagnostics.sibling_status(),
            TestRendererStableSiblingInsertionSiblingStatus::BlockedMissingStateNode
        );
        assert_eq!(
            diagnostics.mutation_status(),
            TestRendererStableSiblingInsertionMutationStatus::RecordedOnly
        );
        assert!(!diagnostics.can_insert_before());
        assert_eq!(diagnostics.state_node_raw(), 2);
        assert_eq!(diagnostics.sibling_state_node_raw(), 0);
        assert_eq!(blocked.commit_diagnostics().mutation_records().len(), 1);
        assert_eq!(
            blocked.commit_diagnostics().mutation_records()[0].fiber(),
            blocked.inserted_fibers().component()
        );
        assert_eq!(
            container_element_texts(blocked.previous_snapshot()),
            vec!["stable"]
        );
        assert_eq!(container_element_texts(blocked.snapshot()), vec!["stable"]);
        assert_eq!(host_storage_counts(&root), (1, 2, 2));
        assert!(root.current_host_output.is_none());
    }

    #[test]
    fn root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let created = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let current = created.completed_fibers().current();
        let outcome = root.unmount().unwrap();
        let scheduled = outcome.scheduled().unwrap();

        let unmounted = root
            .render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap();
        let render = unmounted.render();
        let commit = unmounted.commit();
        let deleted = unmounted.deleted_fibers();
        let diagnostics = unmounted.commit_diagnostics();
        let cleanup = unmounted.host_node_cleanup();
        let cleanup_records = cleanup.records();

        assert_eq!(scheduled.kind(), TestRendererRootUpdateKind::Unmount);
        assert_eq!(scheduled.element(), RootElementHandle::NONE);
        assert_eq!(
            root.lifecycle(),
            TestRendererRootLifecycle::UnmountScheduled
        );
        assert_eq!(render.root(), root.root_id());
        assert_eq!(render.current(), created.commit().current());
        assert_eq!(render.resulting_element(), RootElementHandle::NONE);
        assert_eq!(commit.previous_current(), created.commit().current());
        assert_eq!(commit.current(), render.finished_work());
        assert_eq!(deleted.current(), current);
        assert_eq!(deleted.host_root(), render.finished_work());
        assert_eq!(deleted.deleted_component(), current.component());
        assert_eq!(deleted.deleted_text(), current.text());
        assert_eq!(root.store().host_tokens().len(), 5);
        assert!(diagnostics.mutation_records().is_empty());
        assert_eq!(diagnostics.deletion_lists().len(), 1);
        assert_eq!(
            diagnostics.deletion_lists()[0].parent(),
            render.finished_work()
        );
        assert_eq!(
            diagnostics.deletion_lists()[0].deleted(),
            &[current.component()]
        );
        assert_eq!(cleanup.root(), root.root_id());
        assert_eq!(cleanup.len(), 2);
        assert!(!cleanup.is_empty());
        assert_eq!(cleanup.active_instance_count(), 0);
        assert_eq!(cleanup.active_text_count(), 0);
        assert_eq!(cleanup.inactive_instance_count(), 1);
        assert_eq!(cleanup.inactive_text_count(), 1);
        assert!(!cleanup.public_unmount_compatibility_claimed());
        assert_eq!(cleanup_records[0].sequence(), 0);
        assert_eq!(cleanup_records[0].deletion_list_index(), 0);
        assert_eq!(cleanup_records[0].deleted_index(), 0);
        assert_eq!(cleanup_records[0].subtree_index(), 0);
        assert_eq!(
            cleanup_records[0].target(),
            Some(TestRendererHostNodeCleanupTarget::Text)
        );
        assert_eq!(
            cleanup_records[0].status(),
            TestRendererHostNodeCleanupStatus::Invalidated
        );
        assert_eq!(
            cleanup_records[0].parent().slot(),
            render.finished_work().slot().get()
        );
        assert_eq!(
            cleanup_records[0].deleted_root().slot(),
            current.component().slot().get()
        );
        assert_eq!(
            cleanup_records[0].fiber().slot(),
            current.text().slot().get()
        );
        assert_eq!(cleanup_records[0].state_node_raw(), 1);
        assert_eq!(cleanup_records[0].token_raw(), 4);
        assert_eq!(
            cleanup_records[0].token_phase(),
            HostFiberTokenPhase::Deletion
        );
        assert_eq!(cleanup_records[1].sequence(), 1);
        assert_eq!(cleanup_records[1].deletion_list_index(), 0);
        assert_eq!(cleanup_records[1].deleted_index(), 0);
        assert_eq!(cleanup_records[1].subtree_index(), 1);
        assert_eq!(
            cleanup_records[1].target(),
            Some(TestRendererHostNodeCleanupTarget::Instance)
        );
        assert_eq!(
            cleanup_records[1].status(),
            TestRendererHostNodeCleanupStatus::Invalidated
        );
        assert_eq!(
            cleanup_records[1].deleted_root().slot(),
            current.component().slot().get()
        );
        assert_eq!(
            cleanup_records[1].fiber().slot(),
            current.component().slot().get()
        );
        assert_eq!(cleanup_records[1].state_node_raw(), 1);
        assert_eq!(cleanup_records[1].token_raw(), 5);
        assert_eq!(host_node_activity_counts(&root), (0, 2));
        assert_eq!(unmounted.previous_snapshot().children().len(), 1);
        assert!(unmounted.snapshot().children().is_empty());
        assert!(unmounted.detached_instance_snapshot().is_detached());
        assert!(unmounted.detached_instance_snapshot().children().is_empty());
        assert_eq!(host_storage_counts(&root), (1, 1, 1));
        assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
        assert!(
            root.diagnostic_container_snapshot()
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn root_host_output_update_canary_fails_closed_without_committed_output() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.update_host_component_with_text_for_canary("span", "goodbye")
            .unwrap();
        let current = root.store().root(root.root_id()).unwrap().current();

        let error = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap_err();

        assert!(matches!(
            error,
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Update
            }
        ));
        assert_eq!(
            root.store().root(root.root_id()).unwrap().current(),
            current
        );
        assert_eq!(host_storage_counts(&root), (1, 0, 0));
        assert!(
            root.diagnostic_container_snapshot()
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn root_host_output_canary_rejects_non_fixture_element_without_mutation() {
        let mut root =
            TestRendererRoot::create(root_element(99), TestRendererOptions::new()).unwrap();
        let current = root.store().root(root.root_id()).unwrap().current();

        let error = root.render_and_commit_host_output_for_canary().unwrap_err();

        assert!(matches!(
            error,
            TestRendererRootError::MissingHostOutputFixture { element }
                if element == root_element(99)
        ));
        assert_eq!(
            root.store().root(root.root_id()).unwrap().current(),
            current
        );
        assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
        assert_eq!(host_storage_counts(&root), (1, 0, 0));
        assert!(
            root.diagnostic_container_snapshot()
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn root_serialization_gate_sees_private_committed_fiber_inspection_after_host_output() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let output = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let commit = output.commit();

        let report = root
            .require_serialization_gate_ready_for_canary(commit)
            .unwrap();
        let requirements = report.requirements();
        let fiber_inspection = report.fiber_inspection().unwrap();

        assert_eq!(
            report.status(),
            TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
        );
        assert!(report.is_ready());
        assert!(requirements.root_commit_diagnostics_available());
        assert!(requirements.real_host_output_available());
        assert!(requirements.committed_fiber_inspection_available());
        assert!(requirements.private_serialization_ready());
        assert!(!report.oracle().compatibility_claimed());
        assert_eq!(report.host_output().container_child_count(), 1);
        assert_eq!(report.host_output().instance_count(), 1);
        assert_eq!(report.host_output().text_count(), 1);
        assert_eq!(fiber_inspection.current(), commit.current());
        assert_eq!(
            fiber_inspection.host_component().fiber(),
            output.completed_fibers().component()
        );
        assert_eq!(
            fiber_inspection.host_text().fiber(),
            output.completed_fibers().text()
        );
    }

    #[test]
    fn root_create_commit_handoff_switches_current_and_state_without_host_mutation() {
        let element = root_element(42);
        let mut root = TestRendererRoot::create(element, TestRendererOptions::new()).unwrap();
        let previous_current = root.store().root(root.root_id()).unwrap().current();
        let snapshot_before = root.diagnostic_container_snapshot().unwrap();
        let storage_before = host_storage_counts(&root);

        let (render, commit) = render_and_commit_latest_host_root(&mut root);
        let new_current = root.store().root(root.root_id()).unwrap().current();

        assert_eq!(render.root(), root.root_id());
        assert_eq!(render.current(), previous_current);
        assert_eq!(render.resulting_element(), element);
        assert_eq!(render.applied_update_count(), 1);
        assert_eq!(render.skipped_update_count(), 0);
        assert!(render.remaining_lanes().is_empty());
        assert_eq!(commit.root(), root.root_id());
        assert_eq!(commit.previous_current(), previous_current);
        assert_eq!(commit.current(), render.finished_work());
        assert_eq!(commit.finished_lanes(), render.render_lanes());
        assert!(commit.remaining_lanes().is_empty());
        assert!(commit.pending_lanes().is_empty());
        assert_empty_root_update_callback_snapshot(&commit, &render);
        assert_eq!(new_current, render.finished_work());
        assert_ne!(new_current, previous_current);
        assert_eq!(current_host_root_element(&root), element);
        assert!(
            root.store()
                .root(root.root_id())
                .unwrap()
                .lanes()
                .pending_lanes()
                .is_empty()
        );
        assert_eq!(
            root.store()
                .root(root.root_id())
                .unwrap()
                .scheduling()
                .work_in_progress(),
            None
        );
        assert_eq!(
            root.diagnostic_container_snapshot().unwrap(),
            snapshot_before
        );
        assert_eq!(host_storage_counts(&root), storage_before);
    }

    #[test]
    fn root_update_commit_handoff_switches_current_again_and_updates_state_only() {
        let mut root =
            TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        let (_create_render, create_commit) = render_and_commit_latest_host_root(&mut root);
        let previous_current = root.store().root(root.root_id()).unwrap().current();
        let snapshot_after_create = root.diagnostic_container_snapshot().unwrap();
        let storage_after_create = host_storage_counts(&root);

        assert_eq!(create_commit.current(), previous_current);
        assert_eq!(current_host_root_element(&root), root_element(1));

        let outcome = root.update(root_element(2)).unwrap();
        let update = outcome.scheduled().unwrap();
        let (render, commit) = render_and_commit_latest_host_root(&mut root);
        let new_current = root.store().root(root.root_id()).unwrap().current();

        assert_eq!(update.kind(), TestRendererRootUpdateKind::Update);
        assert_eq!(render.current(), previous_current);
        assert_eq!(render.resulting_element(), root_element(2));
        assert_eq!(render.applied_update_count(), 1);
        assert_eq!(render.skipped_update_count(), 0);
        assert_eq!(commit.previous_current(), previous_current);
        assert_eq!(commit.current(), render.finished_work());
        assert!(commit.pending_lanes().is_empty());
        assert_empty_root_update_callback_snapshot(&commit, &render);
        assert_eq!(new_current, render.finished_work());
        assert_ne!(new_current, previous_current);
        assert_eq!(current_host_root_element(&root), root_element(2));
        assert_eq!(
            root.diagnostic_container_snapshot().unwrap(),
            snapshot_after_create
        );
        assert_eq!(host_storage_counts(&root), storage_after_create);
    }

    #[test]
    fn root_unmount_commit_handoff_commits_none_without_host_teardown_output() {
        let mut root =
            TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        render_and_commit_latest_host_root(&mut root);
        let previous_current = root.store().root(root.root_id()).unwrap().current();
        let snapshot_after_create = root.diagnostic_container_snapshot().unwrap();
        let storage_after_create = host_storage_counts(&root);

        let outcome = root.unmount().unwrap();
        let unmount = outcome.scheduled().unwrap();
        let (render, commit) = render_and_commit_latest_host_root(&mut root);
        let new_current = root.store().root(root.root_id()).unwrap().current();

        assert_eq!(unmount.kind(), TestRendererRootUpdateKind::Unmount);
        assert_eq!(unmount.element(), RootElementHandle::NONE);
        assert_eq!(
            root.lifecycle(),
            TestRendererRootLifecycle::UnmountScheduled
        );
        assert_eq!(render.current(), previous_current);
        assert_eq!(render.resulting_element(), RootElementHandle::NONE);
        assert_eq!(render.applied_update_count(), 1);
        assert_eq!(render.skipped_update_count(), 0);
        assert!(render.render_lanes().includes_sync_lane());
        assert_eq!(commit.previous_current(), previous_current);
        assert_eq!(commit.current(), render.finished_work());
        assert!(commit.pending_lanes().is_empty());
        assert_empty_root_update_callback_snapshot(&commit, &render);
        assert_eq!(new_current, render.finished_work());
        assert_ne!(new_current, previous_current);
        assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
        assert_eq!(
            root.diagnostic_container_snapshot().unwrap(),
            snapshot_after_create
        );
        assert_eq!(host_storage_counts(&root), storage_after_create);
    }

    #[test]
    fn root_create_commit_handoff_exposes_visible_callback_snapshot() {
        let callback = RootUpdateCallbackHandle::from_raw(77);
        let mut root = TestRendererRoot::create_with_root_update_callback_for_canary(
            root_element(10),
            TestRendererOptions::new(),
            callback,
        )
        .unwrap();
        let scheduled_update = root.last_scheduled_update().unwrap().clone();
        let snapshot_before = root.diagnostic_container_snapshot().unwrap();
        let storage_before = host_storage_counts(&root);

        let (render, commit) = render_and_commit_latest_host_root(&mut root);

        assert_eq!(scheduled_update.kind(), TestRendererRootUpdateKind::Create);
        assert_visible_root_update_callback_snapshot(&commit, &render, &scheduled_update, callback);
        assert_eq!(current_host_root_element(&root), root_element(10));
        assert_eq!(
            root.diagnostic_container_snapshot().unwrap(),
            snapshot_before
        );
        assert_eq!(host_storage_counts(&root), storage_before);
    }

    #[test]
    fn root_update_commit_handoff_exposes_visible_callback_snapshot() {
        let mut root =
            TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        render_and_commit_latest_host_root(&mut root);
        let callback = RootUpdateCallbackHandle::from_raw(88);

        let outcome = root
            .update_with_root_update_callback_for_canary(root_element(2), callback)
            .unwrap();
        let scheduled_update = outcome.scheduled().unwrap().clone();
        let snapshot_after_create = root.diagnostic_container_snapshot().unwrap();
        let storage_after_create = host_storage_counts(&root);
        let (render, commit) = render_and_commit_latest_host_root(&mut root);

        assert_eq!(scheduled_update.kind(), TestRendererRootUpdateKind::Update);
        assert_visible_root_update_callback_snapshot(&commit, &render, &scheduled_update, callback);
        assert_eq!(current_host_root_element(&root), root_element(2));
        assert_eq!(
            root.diagnostic_container_snapshot().unwrap(),
            snapshot_after_create
        );
        assert_eq!(host_storage_counts(&root), storage_after_create);
    }

    #[test]
    fn root_unmount_commit_handoff_exposes_visible_callback_snapshot() {
        let mut root =
            TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        render_and_commit_latest_host_root(&mut root);
        let callback = RootUpdateCallbackHandle::from_raw(99);

        let outcome = root
            .unmount_with_root_update_callback_for_canary(callback)
            .unwrap();
        let scheduled_update = outcome.scheduled().unwrap().clone();
        let snapshot_after_create = root.diagnostic_container_snapshot().unwrap();
        let storage_after_create = host_storage_counts(&root);
        let (render, commit) = render_and_commit_latest_host_root(&mut root);

        assert_eq!(scheduled_update.kind(), TestRendererRootUpdateKind::Unmount);
        assert_visible_root_update_callback_snapshot(&commit, &render, &scheduled_update, callback);
        assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
        assert_eq!(
            root.lifecycle(),
            TestRendererRootLifecycle::UnmountScheduled
        );
        assert_eq!(
            root.diagnostic_container_snapshot().unwrap(),
            snapshot_after_create
        );
        assert_eq!(host_storage_counts(&root), storage_after_create);
    }

    #[test]
    fn root_serialization_gate_reports_committed_diagnostics_and_missing_host_output() {
        let callback = RootUpdateCallbackHandle::from_raw(101);
        let mut root = TestRendererRoot::create_with_root_update_callback_for_canary(
            root_element(10),
            TestRendererOptions::new(),
            callback,
        )
        .unwrap();
        let (render, commit) = render_and_commit_latest_host_root(&mut root);

        let report = root
            .describe_serialization_gate_for_canary(&commit)
            .unwrap();
        let requirements = report.requirements();
        let oracle = report.oracle();
        let commit_diagnostics = report.commit();
        let callback_diagnostics = commit_diagnostics.root_update_callbacks();
        let host_output = report.host_output();

        assert_eq!(
            report.gate_name(),
            TEST_RENDERER_SERIALIZATION_CANARY_GATE_NAME
        );
        assert_eq!(
            report.status(),
            TestRendererSerializationGateStatus::ClosedMissingHostOutput
        );
        assert!(report.is_closed());
        assert!(!report.is_ready());
        assert!(requirements.root_commit_diagnostics_available());
        assert!(!requirements.real_host_output_available());
        assert!(!requirements.committed_fiber_inspection_available());
        assert!(!requirements.private_serialization_ready());
        assert!(report.fiber_inspection().is_none());
        assert_eq!(
            oracle.oracle_kind(),
            TEST_RENDERER_SERIALIZATION_ORACLE_KIND
        );
        assert_eq!(
            oracle.probe_mode_count(),
            TEST_RENDERER_SERIALIZATION_ORACLE_PROBE_MODE_COUNT
        );
        assert_eq!(
            oracle.scenario_count(),
            TEST_RENDERER_SERIALIZATION_ORACLE_SCENARIO_COUNT
        );
        assert!(!oracle.compatibility_claimed());
        assert_eq!(commit_diagnostics.root(), root.root_id());
        assert_eq!(
            commit_diagnostics.lifecycle(),
            TestRendererRootLifecycle::Active
        );
        assert_eq!(
            commit_diagnostics.last_update_kind(),
            Some(TestRendererRootUpdateKind::Create)
        );
        assert_eq!(
            commit_diagnostics.last_scheduled_element(),
            Some(root_element(10))
        );
        assert_eq!(
            commit_diagnostics.previous_current().slot(),
            commit.previous_current().slot().get()
        );
        assert_eq!(
            commit_diagnostics.current().slot(),
            commit.current().slot().get()
        );
        assert_eq!(
            commit_diagnostics.finished_work().slot(),
            commit.finished_work().slot().get()
        );
        assert_eq!(
            commit_diagnostics.current(),
            commit_diagnostics.finished_work()
        );
        assert_eq!(commit.current(), render.finished_work());
        assert!(!commit_diagnostics.finished_lanes_empty());
        assert!(!commit_diagnostics.finished_lanes_include_sync());
        assert!(commit_diagnostics.remaining_lanes_empty());
        assert!(commit_diagnostics.pending_lanes_empty());
        assert!(!commit_diagnostics.has_remaining_work());
        assert!(!callback_diagnostics.is_empty());
        assert_eq!(callback_diagnostics.visible_count(), 1);
        assert_eq!(callback_diagnostics.hidden_count(), 0);
        assert_eq!(callback_diagnostics.deferred_hidden_count(), 0);
        assert_eq!(host_output.container_child_count(), 0);
        assert_eq!(host_output.instance_count(), 0);
        assert_eq!(host_output.text_count(), 0);
        assert!(!host_output.real_host_output_available());
    }

    #[test]
    fn root_serialization_gate_fails_closed_before_real_host_output() {
        let mut root =
            TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        let (_render, commit) = render_and_commit_latest_host_root(&mut root);

        let error = root
            .require_serialization_gate_ready_for_canary(&commit)
            .unwrap_err();

        let TestRendererRootError::SerializationGate(error) = error else {
            panic!("expected serialization gate closure");
        };
        let TestRendererSerializationGateError::Closed(report) = error.as_ref() else {
            panic!("expected serialization gate closure");
        };
        assert_eq!(
            report.status(),
            TestRendererSerializationGateStatus::ClosedMissingHostOutput
        );
        assert_eq!(report.commit().root(), root.root_id());
        assert_eq!(report.host_output().container_child_count(), 0);
        assert!(!report.requirements().real_host_output_available());
        assert!(report.fiber_inspection().is_none());
    }

    #[test]
    fn root_serialization_gate_rejects_stale_commit_diagnostics() {
        let mut root =
            TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        let (_create_render, create_commit) = render_and_commit_latest_host_root(&mut root);
        root.update(root_element(2)).unwrap();
        render_and_commit_latest_host_root(&mut root);

        let error = root
            .describe_serialization_gate_for_canary(&create_commit)
            .unwrap_err();

        let TestRendererRootError::SerializationGate(error) = error else {
            panic!("expected serialization gate error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererSerializationGateError::CommitIsNotCurrent { root: error_root, .. }
                if *error_root == root.root_id()
        ));
    }

    #[test]
    fn root_commit_handoff_rejects_reused_render_record_after_current_switch() {
        let mut root =
            TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        let render = root
            .render_latest_scheduled_host_root_for_commit_handoff()
            .unwrap()
            .unwrap();

        let commit = root.commit_host_root_render_for_canary(render).unwrap();
        let error = root.commit_host_root_render_for_canary(render).unwrap_err();

        assert_eq!(
            root.store().root(root.root_id()).unwrap().current(),
            commit.current()
        );
        assert!(matches!(
            error,
            TestRendererRootError::RootCommit(RootCommitError::CurrentMismatch {
                root: commit_root,
                ..
            }) if commit_root == root.root_id()
        ));
        assert!(
            root.diagnostic_container_snapshot()
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn root_unmount_enqueues_sync_null_update_before_wrapper_invalidation() {
        let mut root =
            TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        let current = root.store().root(root.root_id()).unwrap().current();

        let outcome = root.unmount().unwrap();
        let unmount = outcome.scheduled().unwrap();

        assert_eq!(
            root.lifecycle(),
            TestRendererRootLifecycle::UnmountScheduled
        );
        assert_eq!(unmount.kind(), TestRendererRootUpdateKind::Unmount);
        assert_eq!(unmount.element(), RootElementHandle::NONE);
        assert!(
            unmount
                .container_update()
                .lane()
                .to_lanes()
                .includes_sync_lane()
        );
        assert_eq!(
            root.store()
                .update_queues()
                .update(unmount.container_update().update())
                .unwrap()
                .payload()
                .unwrap()
                .element(),
            RootElementHandle::NONE
        );
        assert!(root.store().root_scheduler().might_have_pending_sync_work());
        assert_eq!(
            root.store().root(root.root_id()).unwrap().current(),
            current
        );
        assert!(
            root.diagnostic_container_snapshot()
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn root_unmount_is_idempotent() {
        let mut root =
            TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();

        assert!(matches!(
            root.unmount().unwrap(),
            TestRendererRootUpdateOutcome::Scheduled(_)
        ));
        let scheduled_count = root.scheduled_updates().len();
        let second = root.unmount().unwrap();

        assert_eq!(
            second,
            TestRendererRootUpdateOutcome::AlreadyUnmountScheduled
        );
        assert_eq!(root.scheduled_updates().len(), scheduled_count);
    }

    #[test]
    fn root_update_after_unmount_does_not_mutate_or_reschedule() {
        let mut root =
            TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        root.unmount().unwrap();
        let scheduled_count = root.scheduled_updates().len();
        let scheduled_roots = root.scheduled_roots_for_canary().unwrap();
        let queue = root
            .last_scheduled_update()
            .unwrap()
            .container_update()
            .queue();
        let pending_before = root.store().update_queues().pending_updates(queue).unwrap();

        let outcome = root.update(root_element(2)).unwrap();
        let pending_after = root.store().update_queues().pending_updates(queue).unwrap();

        assert_eq!(outcome, TestRendererRootUpdateOutcome::IgnoredAfterUnmount);
        assert_eq!(root.scheduled_updates().len(), scheduled_count);
        assert_eq!(root.scheduled_roots_for_canary().unwrap(), scheduled_roots);
        assert_eq!(pending_after, pending_before);
        assert!(
            root.diagnostic_container_snapshot()
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn root_options_store_strict_mode_and_create_node_mock_without_invocation() {
        let invocation_count = Arc::new(AtomicUsize::new(0));
        let invocation_count_for_mock = Arc::clone(&invocation_count);
        let create_node_mock = TestCreateNodeMock::new(move || {
            invocation_count_for_mock.fetch_add(1, Ordering::SeqCst);
        });
        let options = TestRendererOptions::new()
            .with_strict_mode(true)
            .with_create_node_mock(create_node_mock);

        let mut root = TestRendererRoot::create(root_element(1), options).unwrap();
        root.update(root_element(2)).unwrap();
        root.unmount().unwrap();

        assert!(root.options().strict_mode());
        assert!(root.options().has_create_node_mock());
        assert!(root.options().create_node_mock().is_some());
        assert!(
            root.store()
                .root(root.root_id())
                .unwrap()
                .options()
                .is_strict_mode()
        );
        assert_eq!(invocation_count.load(Ordering::SeqCst), 0);
    }

    #[test]
    fn reports_mutation_only_capabilities() {
        let renderer = TestRenderer::new();
        let capabilities = renderer.capabilities();

        assert_eq!(renderer.renderer_name(), TEST_RENDERER_NAME);
        assert_eq!(
            capabilities.tree_update_mode(),
            Ok(HostTreeUpdateMode::Mutation)
        );
        assert!(capabilities.supports(HostCapability::Mutation));
        assert!(!capabilities.supports(HostCapability::Persistence));
        assert!(!capabilities.supports(HostCapability::Hydration));
        assert!(!capabilities.supports(HostCapability::Resources));
        assert!(!capabilities.supports(HostCapability::Singletons));
        assert!(!capabilities.supports(HostCapability::ViewTransitions));
        assert_mutation_renderer(&renderer);
    }

    #[test]
    fn creates_instances_text_and_host_context() {
        let mut renderer = TestRenderer::new();
        let container = renderer.create_container();
        let context = renderer.root_host_context(&container).unwrap();
        let child_context = renderer
            .child_host_context(&context, &element_type("View"), &props())
            .unwrap();
        let text_props = TestProps::with_text_content("inline");

        let instance = renderer
            .create_instance(
                creation_instance_token(),
                &element_type("View"),
                &props().with_attribute("role", "main"),
                &container,
                &context,
            )
            .unwrap();
        let text = renderer
            .create_text_instance(creation_text_token(), "hello", &container, &context)
            .unwrap();

        assert_eq!(context.depth(), 0);
        assert_eq!(child_context.depth(), 1);
        assert!(renderer.should_set_text_content(&element_type("Text"), &text_props, &context));
        assert_eq!(
            renderer
                .snapshot_instance(&instance)
                .unwrap()
                .element_type()
                .as_str(),
            "View"
        );
        assert_eq!(
            renderer
                .snapshot_instance(&instance)
                .unwrap()
                .props()
                .attributes()["role"],
            "main"
        );
        assert_eq!(renderer.snapshot_text(&text).unwrap().text(), "hello");
        assert_eq!(renderer.get_public_instance(&instance).unwrap(), instance);
    }

    #[test]
    fn append_initial_child_records_detached_children() {
        let mut renderer = TestRenderer::new();
        let container = renderer.create_container();
        let mut parent = create_instance(&mut renderer, &container, "View");
        let text = create_text(&mut renderer, &container, "alpha");

        renderer
            .append_initial_child(&mut parent, HostChild::Text(&text))
            .unwrap();
        let finalization = renderer
            .finalize_initial_children(
                &mut parent,
                &element_type("View"),
                &props(),
                &container,
                &renderer.root_host_context(&container).unwrap(),
            )
            .unwrap();

        assert_eq!(finalization, InitialChildrenFinalization::NoCommitMount);
        assert_eq!(
            child_texts(&renderer.snapshot_instance(&parent).unwrap()),
            vec!["alpha"]
        );
    }

    #[test]
    fn append_child_and_append_child_to_container_record_order() {
        let mut renderer = TestRenderer::new();
        let mut container = renderer.create_container();
        let mut parent = create_instance(&mut renderer, &container, "View");
        let child = create_instance(&mut renderer, &container, "Text");
        let text = create_text(&mut renderer, &container, "inside");

        renderer
            .append_child(&mut parent, HostChild::Instance(&child))
            .unwrap();
        renderer
            .append_child(&mut parent, HostChild::Text(&text))
            .unwrap();
        renderer
            .append_child_to_container(&mut container, HostChild::Instance(&parent))
            .unwrap();

        let parent_snapshot = renderer.snapshot_instance(&parent).unwrap();
        assert_eq!(parent_snapshot.children().len(), 2);
        match &parent_snapshot.children()[0] {
            TestNodeSnapshot::Element(element) => {
                assert_eq!(element.element_type().as_str(), "Text");
            }
            TestNodeSnapshot::Text(_) => panic!("expected element child"),
        }
        match &parent_snapshot.children()[1] {
            TestNodeSnapshot::Text(text) => {
                assert_eq!(text.text(), "inside");
            }
            TestNodeSnapshot::Element(_) => panic!("expected text child"),
        }
        assert_eq!(
            container_element_names(&renderer.snapshot_container(&container).unwrap()),
            vec!["View"]
        );
    }

    #[test]
    fn insert_before_reorders_instance_children() {
        let mut renderer = TestRenderer::new();
        let container = renderer.create_container();
        let mut parent = create_instance(&mut renderer, &container, "View");
        let a = create_text(&mut renderer, &container, "a");
        let b = create_text(&mut renderer, &container, "b");
        let c = create_text(&mut renderer, &container, "c");

        renderer
            .append_child(&mut parent, HostChild::Text(&a))
            .unwrap();
        renderer
            .append_child(&mut parent, HostChild::Text(&c))
            .unwrap();
        renderer
            .insert_before(&mut parent, HostChild::Text(&b), HostChild::Text(&c))
            .unwrap();
        renderer
            .insert_before(&mut parent, HostChild::Text(&a), HostChild::Text(&c))
            .unwrap();

        assert_eq!(
            child_texts(&renderer.snapshot_instance(&parent).unwrap()),
            vec!["b", "a", "c"]
        );
    }

    #[test]
    fn insert_in_container_before_reorders_root_children() {
        let mut renderer = TestRenderer::new();
        let mut container = renderer.create_container();
        let first = create_instance(&mut renderer, &container, "First");
        let second = create_instance(&mut renderer, &container, "Second");

        renderer
            .append_child_to_container(&mut container, HostChild::Instance(&second))
            .unwrap();
        renderer
            .insert_in_container_before(
                &mut container,
                HostChild::Instance(&first),
                HostChild::Instance(&second),
            )
            .unwrap();

        assert_eq!(
            container_element_names(&renderer.snapshot_container(&container).unwrap()),
            vec!["First", "Second"]
        );
    }

    #[test]
    fn moving_children_detaches_from_previous_parent_or_container() {
        let mut renderer = TestRenderer::new();
        let mut container = renderer.create_container();
        let mut old_parent = create_instance(&mut renderer, &container, "OldParent");
        let mut new_parent = create_instance(&mut renderer, &container, "NewParent");
        let child = create_text(&mut renderer, &container, "move me");

        renderer
            .append_child(&mut old_parent, HostChild::Text(&child))
            .unwrap();
        renderer
            .append_child_to_container(&mut container, HostChild::Text(&child))
            .unwrap();
        assert!(
            renderer
                .snapshot_instance(&old_parent)
                .unwrap()
                .children()
                .is_empty()
        );

        renderer
            .append_child(&mut new_parent, HostChild::Text(&child))
            .unwrap();
        assert!(
            renderer
                .snapshot_container(&container)
                .unwrap()
                .children()
                .is_empty()
        );
        assert_eq!(
            child_texts(&renderer.snapshot_instance(&new_parent).unwrap()),
            vec!["move me"]
        );
    }

    #[test]
    fn remove_child_and_remove_child_from_container_detach_links_only() {
        let mut renderer = TestRenderer::new();
        let mut container = renderer.create_container();
        let mut parent = create_instance(&mut renderer, &container, "View");
        let text = create_text(&mut renderer, &container, "remove me");

        renderer
            .append_child(&mut parent, HostChild::Text(&text))
            .unwrap();
        renderer
            .append_child_to_container(&mut container, HostChild::Instance(&parent))
            .unwrap();
        renderer
            .remove_child(&mut parent, HostChild::Text(&text))
            .unwrap();
        renderer
            .remove_child_from_container(&mut container, HostChild::Instance(&parent))
            .unwrap();

        assert!(
            renderer
                .snapshot_instance(&parent)
                .unwrap()
                .children()
                .is_empty()
        );
        assert!(
            renderer
                .snapshot_container(&container)
                .unwrap()
                .children()
                .is_empty()
        );
        assert_eq!(renderer.snapshot_text(&text).unwrap().text(), "remove me");
    }

    #[test]
    fn clear_container_removes_all_root_children() {
        let mut renderer = TestRenderer::new();
        let mut container = renderer.create_container();
        let first = create_instance(&mut renderer, &container, "First");
        let second = create_instance(&mut renderer, &container, "Second");

        renderer
            .append_child_to_container(&mut container, HostChild::Instance(&first))
            .unwrap();
        renderer
            .append_child_to_container(&mut container, HostChild::Instance(&second))
            .unwrap();
        renderer.clear_container(&mut container).unwrap();

        assert!(
            renderer
                .snapshot_container(&container)
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn commit_hooks_update_props_text_visibility_and_detachment() {
        let mut renderer = TestRenderer::new();
        let container = renderer.create_container();
        let mut instance = create_instance(&mut renderer, &container, "View");
        let mut text = create_text(&mut renderer, &container, "old");
        let commit_state = renderer.prepare_for_commit(&container).unwrap();

        renderer
            .commit_update(
                commit_instance_token(),
                &mut instance,
                TestUpdatePayload::replace_props(props().with_attribute("updated", "yes")),
                &element_type("View"),
                &props(),
                &props().with_attribute("updated", "yes"),
            )
            .unwrap();
        renderer
            .commit_text_update(&mut text, "old", "new")
            .unwrap();
        renderer.hide_instance(&mut instance).unwrap();
        renderer.hide_text_instance(&mut text).unwrap();
        renderer
            .reset_after_commit(&container, commit_state)
            .unwrap();

        assert!(renderer.snapshot_instance(&instance).unwrap().is_hidden());
        assert!(renderer.snapshot_text(&text).unwrap().is_hidden());
        assert_eq!(
            renderer
                .snapshot_instance(&instance)
                .unwrap()
                .props()
                .attributes()["updated"],
            "yes"
        );
        assert_eq!(renderer.snapshot_text(&text).unwrap().text(), "new");

        renderer.unhide_instance(&mut instance, &props()).unwrap();
        renderer.unhide_text_instance(&mut text, "new").unwrap();
        renderer
            .detach_deleted_instance(deletion_instance_token(), instance)
            .unwrap();

        let snapshot = renderer.snapshot_instance(&instance).unwrap();
        assert!(!snapshot.is_hidden());
        assert!(snapshot.is_detached());
        assert!(snapshot.children().is_empty());
    }

    #[test]
    fn lifecycle_hooks_reject_wrong_fiber_token_phase_or_target() {
        let mut renderer = TestRenderer::new();
        let container = renderer.create_container();
        let context = renderer.root_host_context(&container).unwrap();
        let mut instance = create_instance(&mut renderer, &container, "View");

        assert_operation_error(
            renderer
                .create_instance(
                    commit_instance_token(),
                    &element_type("View"),
                    &props(),
                    &container,
                    &context,
                )
                .unwrap_err(),
            HostOperationErrorKind::InvalidFiberToken {
                phase: HostFiberTokenPhase::Commit,
                target: HostFiberTokenTarget::Instance,
                violation: HostFiberTokenViolation::WrongPhase,
            },
        );

        assert_operation_error(
            renderer
                .create_text_instance(creation_instance_token(), "text", &container, &context)
                .unwrap_err(),
            HostOperationErrorKind::InvalidFiberToken {
                phase: HostFiberTokenPhase::Creation,
                target: HostFiberTokenTarget::Instance,
                violation: HostFiberTokenViolation::WrongTarget,
            },
        );

        assert_operation_error(
            renderer
                .commit_mount(
                    creation_instance_token(),
                    &mut instance,
                    &element_type("View"),
                    &props(),
                )
                .unwrap_err(),
            HostOperationErrorKind::InvalidFiberToken {
                phase: HostFiberTokenPhase::Creation,
                target: HostFiberTokenTarget::Instance,
                violation: HostFiberTokenViolation::WrongPhase,
            },
        );

        assert_operation_error(
            renderer
                .commit_update(
                    creation_instance_token(),
                    &mut instance,
                    TestUpdatePayload::replace_props(props().with_attribute("updated", "no")),
                    &element_type("View"),
                    &props(),
                    &props().with_attribute("updated", "no"),
                )
                .unwrap_err(),
            HostOperationErrorKind::InvalidFiberToken {
                phase: HostFiberTokenPhase::Creation,
                target: HostFiberTokenTarget::Instance,
                violation: HostFiberTokenViolation::WrongPhase,
            },
        );

        assert_operation_error(
            renderer
                .detach_deleted_instance(commit_instance_token(), instance)
                .unwrap_err(),
            HostOperationErrorKind::InvalidFiberToken {
                phase: HostFiberTokenPhase::Commit,
                target: HostFiberTokenTarget::Instance,
                violation: HostFiberTokenViolation::WrongPhase,
            },
        );

        let snapshot = renderer.snapshot_instance(&instance).unwrap();
        assert!(!snapshot.is_detached());
        assert!(snapshot.props().attributes().is_empty());
    }

    #[test]
    fn invalid_same_renderer_handles_are_structured_operation_errors() {
        let mut renderer = TestRenderer::new();
        let mut invalid_container = TestContainer {
            renderer_id: renderer.renderer_id,
            index: 0,
        };
        let invalid_instance = TestInstance {
            renderer_id: renderer.renderer_id,
            index: 0,
        };
        let mut invalid_text = TestTextInstance {
            renderer_id: renderer.renderer_id,
            index: 0,
        };

        assert_operation_error(
            renderer.root_host_context(&invalid_container).unwrap_err(),
            HostOperationErrorKind::InvalidHandle {
                handle: HostHandleKind::Container,
            },
        );
        assert_operation_error(
            renderer
                .create_instance(
                    creation_instance_token(),
                    &element_type("View"),
                    &props(),
                    &invalid_container,
                    &TestHostContext::default(),
                )
                .unwrap_err(),
            HostOperationErrorKind::InvalidHandle {
                handle: HostHandleKind::Container,
            },
        );
        assert_operation_error(
            renderer
                .clear_container(&mut invalid_container)
                .unwrap_err(),
            HostOperationErrorKind::InvalidHandle {
                handle: HostHandleKind::Container,
            },
        );
        assert_operation_error(
            renderer.get_public_instance(&invalid_instance).unwrap_err(),
            HostOperationErrorKind::InvalidHandle {
                handle: HostHandleKind::Instance,
            },
        );
        assert_operation_error(
            renderer
                .commit_text_update(&mut invalid_text, "old", "new")
                .unwrap_err(),
            HostOperationErrorKind::InvalidHandle {
                handle: HostHandleKind::TextInstance,
            },
        );

        assert_operation_error(
            renderer.snapshot_container(&invalid_container).unwrap_err(),
            HostOperationErrorKind::InvalidHandle {
                handle: HostHandleKind::Container,
            },
        );
        assert_operation_error(
            renderer.snapshot_instance(&invalid_instance).unwrap_err(),
            HostOperationErrorKind::InvalidHandle {
                handle: HostHandleKind::Instance,
            },
        );
        assert_operation_error(
            renderer.snapshot_text(&invalid_text).unwrap_err(),
            HostOperationErrorKind::InvalidHandle {
                handle: HostHandleKind::TextInstance,
            },
        );
    }

    #[test]
    fn cross_renderer_handles_are_rejected_even_with_same_indices() {
        let mut left = TestRenderer::new();
        let left_container = left.create_container();
        let mut right = TestRenderer::new();
        let right_container = right.create_container();
        let right_instance = create_instance(&mut right, &right_container, "Foreign");
        let mut right_text = create_text(&mut right, &right_container, "foreign");

        assert_eq!(left_container.index, right_container.index);
        assert_eq!(right_instance.index, 0);
        assert_eq!(right_text.index, 0);

        assert_operation_error(
            left.root_host_context(&right_container).unwrap_err(),
            HostOperationErrorKind::InvalidHandle {
                handle: HostHandleKind::Container,
            },
        );
        assert_operation_error(
            left.get_public_instance(&right_instance).unwrap_err(),
            HostOperationErrorKind::InvalidHandle {
                handle: HostHandleKind::Instance,
            },
        );
        assert_operation_error(
            left.commit_text_update(&mut right_text, "foreign", "changed")
                .unwrap_err(),
            HostOperationErrorKind::InvalidHandle {
                handle: HostHandleKind::TextInstance,
            },
        );
    }

    #[test]
    fn missing_insert_targets_return_errors_without_detaching_existing_child() {
        let mut renderer = TestRenderer::new();
        let container = renderer.create_container();
        let mut old_parent = create_instance(&mut renderer, &container, "OldParent");
        let mut new_parent = create_instance(&mut renderer, &container, "NewParent");
        let moving = create_text(&mut renderer, &container, "moving");
        let missing_before = create_text(&mut renderer, &container, "missing");

        renderer
            .append_child(&mut old_parent, HostChild::Text(&moving))
            .unwrap();

        assert_operation_error(
            renderer
                .insert_before(
                    &mut new_parent,
                    HostChild::Text(&moving),
                    HostChild::Text(&missing_before),
                )
                .unwrap_err(),
            HostOperationErrorKind::MissingInsertionTarget {
                parent: HostParentKind::Instance,
                target: HostChildKind::TextInstance,
            },
        );
        assert_eq!(
            child_texts(&renderer.snapshot_instance(&old_parent).unwrap()),
            vec!["moving"]
        );
        assert!(
            renderer
                .snapshot_instance(&new_parent)
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn missing_container_insert_targets_return_errors_without_detaching_child() {
        let mut renderer = TestRenderer::new();
        let mut container = renderer.create_container();
        let mut old_parent = create_instance(&mut renderer, &container, "OldParent");
        let moving = create_text(&mut renderer, &container, "moving");
        let missing_before = create_text(&mut renderer, &container, "missing");

        renderer
            .append_child(&mut old_parent, HostChild::Text(&moving))
            .unwrap();

        assert_operation_error(
            renderer
                .insert_in_container_before(
                    &mut container,
                    HostChild::Text(&moving),
                    HostChild::Text(&missing_before),
                )
                .unwrap_err(),
            HostOperationErrorKind::MissingInsertionTarget {
                parent: HostParentKind::Container,
                target: HostChildKind::TextInstance,
            },
        );
        assert_eq!(
            child_texts(&renderer.snapshot_instance(&old_parent).unwrap()),
            vec!["moving"]
        );
        assert!(
            renderer
                .snapshot_container(&container)
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn missing_removal_targets_return_errors_without_changing_tree() {
        let mut renderer = TestRenderer::new();
        let mut container = renderer.create_container();
        let mut parent = create_instance(&mut renderer, &container, "Parent");
        let attached = create_text(&mut renderer, &container, "attached");
        let missing = create_text(&mut renderer, &container, "missing");

        renderer
            .append_child(&mut parent, HostChild::Text(&attached))
            .unwrap();
        renderer
            .append_child_to_container(&mut container, HostChild::Instance(&parent))
            .unwrap();

        assert_operation_error(
            renderer
                .remove_child(&mut parent, HostChild::Text(&missing))
                .unwrap_err(),
            HostOperationErrorKind::MissingRemovalTarget {
                parent: HostParentKind::Instance,
                child: HostChildKind::TextInstance,
            },
        );
        assert_operation_error(
            renderer
                .remove_child_from_container(&mut container, HostChild::Text(&missing))
                .unwrap_err(),
            HostOperationErrorKind::MissingRemovalTarget {
                parent: HostParentKind::Container,
                child: HostChildKind::TextInstance,
            },
        );
        assert_eq!(
            child_texts(&renderer.snapshot_instance(&parent).unwrap()),
            vec!["attached"]
        );
        assert_eq!(
            container_element_names(&renderer.snapshot_container(&container).unwrap()),
            vec!["Parent"]
        );
    }

    #[test]
    fn impossible_self_and_cycle_mutations_return_operation_errors() {
        let mut renderer = TestRenderer::new();
        let container = renderer.create_container();
        let mut parent = create_instance(&mut renderer, &container, "Parent");
        let mut child = create_instance(&mut renderer, &container, "Child");

        let same_parent = parent;
        assert_operation_error(
            renderer
                .append_child(&mut parent, HostChild::Instance(&same_parent))
                .unwrap_err(),
            HostOperationErrorKind::ImpossibleMutation {
                parent: HostParentKind::Instance,
                child: HostChildKind::Instance,
                violation: HostMutationViolation::ChildIsParent,
            },
        );

        renderer
            .append_child(&mut parent, HostChild::Instance(&child))
            .unwrap();

        assert_operation_error(
            renderer
                .append_child(&mut child, HostChild::Instance(&parent))
                .unwrap_err(),
            HostOperationErrorKind::ImpossibleMutation {
                parent: HostParentKind::Instance,
                child: HostChildKind::Instance,
                violation: HostMutationViolation::ChildIsAncestorOfParent,
            },
        );
        assert_eq!(
            renderer
                .snapshot_instance(&parent)
                .unwrap()
                .children()
                .len(),
            1
        );
        assert!(
            renderer
                .snapshot_instance(&child)
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn unsupported_capabilities_are_structured_errors() {
        let mut renderer = TestRenderer::new();

        for capability in [
            HostCapability::Persistence,
            HostCapability::Hydration,
            HostCapability::Resources,
            HostCapability::Singletons,
            HostCapability::ViewTransitions,
        ] {
            let error = renderer.require_capability(capability).unwrap_err();
            let unsupported = error.as_unsupported_capability().unwrap();
            assert_eq!(unsupported.renderer_name(), TEST_RENDERER_NAME);
            assert_eq!(unsupported.capability(), capability);
            assert!(error.as_operation_error().is_none());
        }

        let mut form = ();
        let error = renderer.reset_form_instance(&mut form).unwrap_err();
        let unsupported = error.as_unsupported_capability().unwrap();
        assert_eq!(unsupported.renderer_name(), TEST_RENDERER_NAME);
        assert_eq!(unsupported.capability(), HostCapability::Forms);
        assert!(error.as_operation_error().is_none());
    }
}
