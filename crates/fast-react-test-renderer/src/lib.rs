//! Deterministic in-memory mutation test renderer.
//!
//! This crate proves that the canonical `fast-react-host-config` capability
//! traits can be implemented without DOM, native, hydration, persistence, or
//! legacy `HostConfig` behavior. Its root canary delegates create/update/
//! unmount scheduling to `fast-react-reconciler` and exposes a diagnostic
//! HostRoot render/commit handoff, including callback snapshot diagnostics,
//! plus a private committed host-output canary for one HostComponent with one
//! HostText child, private JSON diagnostics for create/update canaries and
//! broader host snapshot shapes, and private host-node deletion cleanup
//! diagnostics. It still stops before public serialization, act, or public
//! `react-test-renderer` compatibility.

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
    HostRootRenderPhaseRecord, RootCommitError, RootElementHandle, RootErrorCallbackHandle,
    RootOptions, RootRecoverableErrorCallbackHandle, RootScheduleMicrotaskResult,
    RootSchedulerError, RootUpdateCallbackHandle, RootUpdateError, RootWorkLoopError,
    ScheduledRootUpdateResult, TestRendererCommittedFiberInspectionError,
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
    styles: BTreeMap<String, String>,
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
            styles: BTreeMap::new(),
        }
    }

    #[must_use]
    pub fn with_attribute(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.attributes.insert(name.into(), value.into());
        self
    }

    #[must_use]
    pub fn with_style(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.styles.insert(name.into(), value.into());
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

    #[must_use]
    pub fn styles(&self) -> &BTreeMap<String, String> {
        &self.styles
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
    on_uncaught_error: RootErrorCallbackHandle,
    on_caught_error: RootErrorCallbackHandle,
    on_recoverable_error: RootRecoverableErrorCallbackHandle,
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
    pub const fn with_on_uncaught_error(mut self, handle: RootErrorCallbackHandle) -> Self {
        self.on_uncaught_error = handle;
        self
    }

    #[must_use]
    pub const fn with_on_caught_error(mut self, handle: RootErrorCallbackHandle) -> Self {
        self.on_caught_error = handle;
        self
    }

    #[must_use]
    pub const fn with_on_recoverable_error(
        mut self,
        handle: RootRecoverableErrorCallbackHandle,
    ) -> Self {
        self.on_recoverable_error = handle;
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

    #[must_use]
    pub const fn on_uncaught_error(&self) -> RootErrorCallbackHandle {
        self.on_uncaught_error
    }

    #[must_use]
    pub const fn on_caught_error(&self) -> RootErrorCallbackHandle {
        self.on_caught_error
    }

    #[must_use]
    pub const fn on_recoverable_error(&self) -> RootRecoverableErrorCallbackHandle {
        self.on_recoverable_error
    }

    fn reconciler_options(&self) -> RootOptions {
        RootOptions::new()
            .with_strict_mode(self.strict_mode)
            .with_on_uncaught_error(self.on_uncaught_error)
            .with_on_caught_error(self.on_caught_error)
            .with_on_recoverable_error(self.on_recoverable_error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererRootLifecycle {
    Active,
    UnmountScheduled,
}

impl TestRendererRootLifecycle {
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::Active => "Active",
            Self::UnmountScheduled => "UnmountScheduled",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererRootUpdateKind {
    Create,
    Update,
    Unmount,
}

impl TestRendererRootUpdateKind {
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::Create => "Create",
            Self::Update => "Update",
            Self::Unmount => "Unmount",
        }
    }

    #[must_use]
    pub const fn container_update_api(self) -> &'static str {
        match self {
            Self::Create | Self::Update => "update_container",
            Self::Unmount => "update_container_sync",
        }
    }

    #[must_use]
    pub const fn sync(self) -> bool {
        matches!(self, Self::Unmount)
    }
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
    fn new_with_props(
        element: RootElementHandle,
        element_type: TestElementType,
        props: TestProps,
        text: String,
    ) -> Self {
        let base_raw = element.raw();
        Self {
            element,
            element_type,
            props,
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererUnmountHostChildDetachmentBlockers {
    detached_instance: bool,
    detached_instance_child_count: usize,
    host_node_cleanup_invalidated_count: usize,
    host_node_cleanup_already_inactive_count: usize,
    host_node_cleanup_missing_host_node_count: usize,
    host_node_cleanup_missing_state_node_count: usize,
    broad_host_child_detachment_blocked: bool,
    public_host_teardown_compatibility_claimed: bool,
    public_unmount_compatibility_claimed: bool,
    act_flushing_claimed: bool,
}

impl TestRendererUnmountHostChildDetachmentBlockers {
    #[must_use]
    pub const fn detached_instance(self) -> bool {
        self.detached_instance
    }

    #[must_use]
    pub const fn detached_instance_child_count(self) -> usize {
        self.detached_instance_child_count
    }

    #[must_use]
    pub const fn host_node_cleanup_invalidated_count(self) -> usize {
        self.host_node_cleanup_invalidated_count
    }

    #[must_use]
    pub const fn host_node_cleanup_already_inactive_count(self) -> usize {
        self.host_node_cleanup_already_inactive_count
    }

    #[must_use]
    pub const fn host_node_cleanup_missing_host_node_count(self) -> usize {
        self.host_node_cleanup_missing_host_node_count
    }

    #[must_use]
    pub const fn host_node_cleanup_missing_state_node_count(self) -> usize {
        self.host_node_cleanup_missing_state_node_count
    }

    #[must_use]
    pub const fn broad_host_child_detachment_blocked(self) -> bool {
        self.broad_host_child_detachment_blocked
    }

    #[must_use]
    pub const fn public_host_teardown_compatibility_claimed(self) -> bool {
        self.public_host_teardown_compatibility_claimed
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(self) -> bool {
        self.public_unmount_compatibility_claimed
    }

    #[must_use]
    pub const fn act_flushing_claimed(self) -> bool {
        self.act_flushing_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererUnmountPassiveRefCleanupOrderEvidence {
    diagnostic_id: &'static str,
    status: &'static str,
    root: FiberRootId,
    ref_cleanup_return_count: usize,
    passive_destroy_count: usize,
    host_node_cleanup_count: usize,
    cleanup_order_record_count: usize,
    first_host_node_cleanup_order: Option<usize>,
    last_ref_cleanup_return_order: Option<usize>,
    first_passive_destroy_order: Option<usize>,
    last_passive_destroy_order: Option<usize>,
    ref_cleanup_return_precedes_passive_destroy: bool,
    host_cleanup_follows_ref_cleanup_return: bool,
    host_cleanup_follows_passive_destroy: bool,
    native_cleanup_after_ref_and_passive_ordering: bool,
    minimal_tree_ordering_is_host_cleanup_only: bool,
    ref_cleanup_return_callbacks_invoked: bool,
    passive_destroy_callbacks_invoked: bool,
    public_effects_flushed: bool,
    public_ref_or_effect_compatibility_claimed: bool,
    public_unmount_compatibility_claimed: bool,
    act_flushing_claimed: bool,
}

impl TestRendererUnmountPassiveRefCleanupOrderEvidence {
    #[must_use]
    pub const fn diagnostic_id(self) -> &'static str {
        self.diagnostic_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn ref_cleanup_return_count(self) -> usize {
        self.ref_cleanup_return_count
    }

    #[must_use]
    pub const fn passive_destroy_count(self) -> usize {
        self.passive_destroy_count
    }

    #[must_use]
    pub const fn host_node_cleanup_count(self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub const fn cleanup_order_record_count(self) -> usize {
        self.cleanup_order_record_count
    }

    #[must_use]
    pub const fn first_host_node_cleanup_order(self) -> Option<usize> {
        self.first_host_node_cleanup_order
    }

    #[must_use]
    pub const fn last_ref_cleanup_return_order(self) -> Option<usize> {
        self.last_ref_cleanup_return_order
    }

    #[must_use]
    pub const fn first_passive_destroy_order(self) -> Option<usize> {
        self.first_passive_destroy_order
    }

    #[must_use]
    pub const fn last_passive_destroy_order(self) -> Option<usize> {
        self.last_passive_destroy_order
    }

    #[must_use]
    pub const fn ref_cleanup_return_precedes_passive_destroy(self) -> bool {
        self.ref_cleanup_return_precedes_passive_destroy
    }

    #[must_use]
    pub const fn host_cleanup_follows_ref_cleanup_return(self) -> bool {
        self.host_cleanup_follows_ref_cleanup_return
    }

    #[must_use]
    pub const fn host_cleanup_follows_passive_destroy(self) -> bool {
        self.host_cleanup_follows_passive_destroy
    }

    #[must_use]
    pub const fn native_cleanup_after_ref_and_passive_ordering(self) -> bool {
        self.native_cleanup_after_ref_and_passive_ordering
    }

    #[must_use]
    pub const fn minimal_tree_ordering_is_host_cleanup_only(self) -> bool {
        self.minimal_tree_ordering_is_host_cleanup_only
    }

    #[must_use]
    pub const fn ref_cleanup_return_callbacks_invoked(self) -> bool {
        self.ref_cleanup_return_callbacks_invoked
    }

    #[must_use]
    pub const fn passive_destroy_callbacks_invoked(self) -> bool {
        self.passive_destroy_callbacks_invoked
    }

    #[must_use]
    pub const fn public_effects_flushed(self) -> bool {
        self.public_effects_flushed
    }

    #[must_use]
    pub const fn public_ref_or_effect_compatibility_claimed(self) -> bool {
        self.public_ref_or_effect_compatibility_claimed
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(self) -> bool {
        self.public_unmount_compatibility_claimed
    }

    #[must_use]
    pub const fn act_flushing_claimed(self) -> bool {
        self.act_flushing_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererUnmountDeletionCommitHandoffDiagnostics {
    diagnostic_id: &'static str,
    status: &'static str,
    root: FiberRootId,
    lifecycle: TestRendererRootLifecycle,
    scheduled_update_kind: TestRendererRootUpdateKind,
    scheduled_element: RootElementHandle,
    scheduled_element_is_none: bool,
    render_current: TestRendererFiberHandleDiagnostics,
    commit_previous_current: TestRendererFiberHandleDiagnostics,
    commit_current: TestRendererFiberHandleDiagnostics,
    render_finished_work: TestRendererFiberHandleDiagnostics,
    deleted_root: TestRendererFiberHandleDiagnostics,
    deleted_component: TestRendererFiberHandleDiagnostics,
    deleted_text: TestRendererFiberHandleDiagnostics,
    commit_current_is_store_current: bool,
    render_current_matches_commit_previous_current: bool,
    render_finished_work_matches_commit_current: bool,
    deletion_list_count: usize,
    deleted_root_count: usize,
    host_node_cleanup_count: usize,
    cleanup_records_match_deletion_commit: bool,
    cleanup_order_record_count: usize,
    public_unmount_compatibility_claimed: bool,
    public_host_teardown_compatibility_claimed: bool,
    act_flushing_claimed: bool,
    host_child_detachment_blockers: TestRendererUnmountHostChildDetachmentBlockers,
    passive_ref_cleanup_order: TestRendererUnmountPassiveRefCleanupOrderEvidence,
}

impl TestRendererUnmountDeletionCommitHandoffDiagnostics {
    #[must_use]
    pub const fn diagnostic_id(self) -> &'static str {
        self.diagnostic_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn lifecycle(self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn scheduled_element(self) -> RootElementHandle {
        self.scheduled_element
    }

    #[must_use]
    pub const fn scheduled_element_is_none(self) -> bool {
        self.scheduled_element_is_none
    }

    #[must_use]
    pub const fn render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.render_current
    }

    #[must_use]
    pub const fn commit_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_previous_current
    }

    #[must_use]
    pub const fn commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_current
    }

    #[must_use]
    pub const fn render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.render_finished_work
    }

    #[must_use]
    pub const fn deleted_root(self) -> TestRendererFiberHandleDiagnostics {
        self.deleted_root
    }

    #[must_use]
    pub const fn deleted_component(self) -> TestRendererFiberHandleDiagnostics {
        self.deleted_component
    }

    #[must_use]
    pub const fn deleted_text(self) -> TestRendererFiberHandleDiagnostics {
        self.deleted_text
    }

    #[must_use]
    pub const fn commit_current_is_store_current(self) -> bool {
        self.commit_current_is_store_current
    }

    #[must_use]
    pub const fn render_current_matches_commit_previous_current(self) -> bool {
        self.render_current_matches_commit_previous_current
    }

    #[must_use]
    pub const fn render_finished_work_matches_commit_current(self) -> bool {
        self.render_finished_work_matches_commit_current
    }

    #[must_use]
    pub const fn deletion_list_count(self) -> usize {
        self.deletion_list_count
    }

    #[must_use]
    pub const fn deleted_root_count(self) -> usize {
        self.deleted_root_count
    }

    #[must_use]
    pub const fn host_node_cleanup_count(self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub const fn cleanup_records_match_deletion_commit(self) -> bool {
        self.cleanup_records_match_deletion_commit
    }

    #[must_use]
    pub const fn cleanup_order_record_count(self) -> usize {
        self.cleanup_order_record_count
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(self) -> bool {
        self.public_unmount_compatibility_claimed
    }

    #[must_use]
    pub const fn public_host_teardown_compatibility_claimed(self) -> bool {
        self.public_host_teardown_compatibility_claimed
    }

    #[must_use]
    pub const fn act_flushing_claimed(self) -> bool {
        self.act_flushing_claimed
    }

    #[must_use]
    pub const fn host_child_detachment_blockers(
        self,
    ) -> TestRendererUnmountHostChildDetachmentBlockers {
        self.host_child_detachment_blockers
    }

    #[must_use]
    pub const fn passive_ref_cleanup_order(
        self,
    ) -> TestRendererUnmountPassiveRefCleanupOrderEvidence {
        self.passive_ref_cleanup_order
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererUnmountNativeBridgeAdmission {
    diagnostic_id: &'static str,
    status: &'static str,
    root: FiberRootId,
    route_dependency_id: &'static str,
    deletion_commit_handoff_id: &'static str,
    cleanup_handoff_id: &'static str,
    lifecycle: TestRendererRootLifecycle,
    scheduled_update_kind: TestRendererRootUpdateKind,
    scheduled_element_is_none: bool,
    deletion_commit_handoff_accepted: bool,
    cleanup_handoff_accepted: bool,
    lifecycle_evidence_accepted: bool,
    cleanup_blockers_accepted: bool,
    passive_ref_cleanup_order_accepted: bool,
    host_node_cleanup_count: usize,
    ref_cleanup_return_count: usize,
    passive_destroy_count: usize,
    cleanup_order_record_count: usize,
    native_cleanup_after_ref_and_passive_ordering: bool,
    rust_unmount_cleanup_handoff_executed: bool,
    host_output_produced: bool,
    minimal_tree_cleanup_handoff: bool,
    rejects_already_unmounted_roots: bool,
    rejects_stale_deletion_handoffs: bool,
    rejects_missing_cleanup_blockers: bool,
    public_unmount_compatibility_claimed: bool,
    public_host_teardown_compatibility_claimed: bool,
    act_flushing_claimed: bool,
    native_bridge_available: bool,
    native_execution: bool,
}

impl TestRendererUnmountNativeBridgeAdmission {
    #[must_use]
    pub const fn diagnostic_id(self) -> &'static str {
        self.diagnostic_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn route_dependency_id(self) -> &'static str {
        self.route_dependency_id
    }

    #[must_use]
    pub const fn deletion_commit_handoff_id(self) -> &'static str {
        self.deletion_commit_handoff_id
    }

    #[must_use]
    pub const fn cleanup_handoff_id(self) -> &'static str {
        self.cleanup_handoff_id
    }

    #[must_use]
    pub const fn lifecycle(self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn scheduled_element_is_none(self) -> bool {
        self.scheduled_element_is_none
    }

    #[must_use]
    pub const fn deletion_commit_handoff_accepted(self) -> bool {
        self.deletion_commit_handoff_accepted
    }

    #[must_use]
    pub const fn cleanup_handoff_accepted(self) -> bool {
        self.cleanup_handoff_accepted
    }

    #[must_use]
    pub const fn lifecycle_evidence_accepted(self) -> bool {
        self.lifecycle_evidence_accepted
    }

    #[must_use]
    pub const fn cleanup_blockers_accepted(self) -> bool {
        self.cleanup_blockers_accepted
    }

    #[must_use]
    pub const fn passive_ref_cleanup_order_accepted(self) -> bool {
        self.passive_ref_cleanup_order_accepted
    }

    #[must_use]
    pub const fn host_node_cleanup_count(self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub const fn ref_cleanup_return_count(self) -> usize {
        self.ref_cleanup_return_count
    }

    #[must_use]
    pub const fn passive_destroy_count(self) -> usize {
        self.passive_destroy_count
    }

    #[must_use]
    pub const fn cleanup_order_record_count(self) -> usize {
        self.cleanup_order_record_count
    }

    #[must_use]
    pub const fn native_cleanup_after_ref_and_passive_ordering(self) -> bool {
        self.native_cleanup_after_ref_and_passive_ordering
    }

    #[must_use]
    pub const fn rust_unmount_cleanup_handoff_executed(self) -> bool {
        self.rust_unmount_cleanup_handoff_executed
    }

    #[must_use]
    pub const fn host_output_produced(self) -> bool {
        self.host_output_produced
    }

    #[must_use]
    pub const fn minimal_tree_cleanup_handoff(self) -> bool {
        self.minimal_tree_cleanup_handoff
    }

    #[must_use]
    pub const fn rejects_already_unmounted_roots(self) -> bool {
        self.rejects_already_unmounted_roots
    }

    #[must_use]
    pub const fn rejects_stale_deletion_handoffs(self) -> bool {
        self.rejects_stale_deletion_handoffs
    }

    #[must_use]
    pub const fn rejects_missing_cleanup_blockers(self) -> bool {
        self.rejects_missing_cleanup_blockers
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(self) -> bool {
        self.public_unmount_compatibility_claimed
    }

    #[must_use]
    pub const fn public_host_teardown_compatibility_claimed(self) -> bool {
        self.public_host_teardown_compatibility_claimed
    }

    #[must_use]
    pub const fn act_flushing_claimed(self) -> bool {
        self.act_flushing_claimed
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(self) -> bool {
        self.native_execution
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererUnmountNativeBridgeCleanupHandoff {
    diagnostic_id: &'static str,
    status: &'static str,
    root: FiberRootId,
    route_outcome: &'static str,
    route_dependency_id: &'static str,
    deletion_commit_handoff_id: &'static str,
    admission_diagnostic_id: &'static str,
    lifecycle: TestRendererRootLifecycle,
    scheduled_update_kind: TestRendererRootUpdateKind,
    scheduled_element_is_none: bool,
    previous_root_child_count: usize,
    current_root_child_count: usize,
    detached_instance: bool,
    detached_instance_child_count: usize,
    host_node_cleanup_count: usize,
    ref_cleanup_return_count: usize,
    passive_destroy_count: usize,
    cleanup_order_record_count: usize,
    native_cleanup_after_ref_and_passive_ordering: bool,
    minimal_tree_cleanup_handoff: bool,
    rust_unmount_cleanup_handoff_executed: bool,
    host_output_produced: bool,
    passive_ref_cleanup_order: TestRendererUnmountPassiveRefCleanupOrderEvidence,
    deletion_commit_handoff: TestRendererUnmountDeletionCommitHandoffDiagnostics,
    native_bridge_admission: TestRendererUnmountNativeBridgeAdmission,
    public_unmount_compatibility_claimed: bool,
    public_host_teardown_compatibility_claimed: bool,
    act_flushing_claimed: bool,
    native_bridge_available: bool,
    native_execution: bool,
}

impl TestRendererUnmountNativeBridgeCleanupHandoff {
    #[must_use]
    pub const fn diagnostic_id(self) -> &'static str {
        self.diagnostic_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn route_outcome(self) -> &'static str {
        self.route_outcome
    }

    #[must_use]
    pub const fn route_dependency_id(self) -> &'static str {
        self.route_dependency_id
    }

    #[must_use]
    pub const fn deletion_commit_handoff_id(self) -> &'static str {
        self.deletion_commit_handoff_id
    }

    #[must_use]
    pub const fn admission_diagnostic_id(self) -> &'static str {
        self.admission_diagnostic_id
    }

    #[must_use]
    pub const fn lifecycle(self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn scheduled_element_is_none(self) -> bool {
        self.scheduled_element_is_none
    }

    #[must_use]
    pub const fn previous_root_child_count(self) -> usize {
        self.previous_root_child_count
    }

    #[must_use]
    pub const fn current_root_child_count(self) -> usize {
        self.current_root_child_count
    }

    #[must_use]
    pub const fn detached_instance(self) -> bool {
        self.detached_instance
    }

    #[must_use]
    pub const fn detached_instance_child_count(self) -> usize {
        self.detached_instance_child_count
    }

    #[must_use]
    pub const fn host_node_cleanup_count(self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub const fn ref_cleanup_return_count(self) -> usize {
        self.ref_cleanup_return_count
    }

    #[must_use]
    pub const fn passive_destroy_count(self) -> usize {
        self.passive_destroy_count
    }

    #[must_use]
    pub const fn cleanup_order_record_count(self) -> usize {
        self.cleanup_order_record_count
    }

    #[must_use]
    pub const fn native_cleanup_after_ref_and_passive_ordering(self) -> bool {
        self.native_cleanup_after_ref_and_passive_ordering
    }

    #[must_use]
    pub const fn minimal_tree_cleanup_handoff(self) -> bool {
        self.minimal_tree_cleanup_handoff
    }

    #[must_use]
    pub const fn rust_unmount_cleanup_handoff_executed(self) -> bool {
        self.rust_unmount_cleanup_handoff_executed
    }

    #[must_use]
    pub const fn host_output_produced(self) -> bool {
        self.host_output_produced
    }

    #[must_use]
    pub const fn passive_ref_cleanup_order(
        self,
    ) -> TestRendererUnmountPassiveRefCleanupOrderEvidence {
        self.passive_ref_cleanup_order
    }

    #[must_use]
    pub const fn deletion_commit_handoff(
        self,
    ) -> TestRendererUnmountDeletionCommitHandoffDiagnostics {
        self.deletion_commit_handoff
    }

    #[must_use]
    pub const fn native_bridge_admission(self) -> TestRendererUnmountNativeBridgeAdmission {
        self.native_bridge_admission
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(self) -> bool {
        self.public_unmount_compatibility_claimed
    }

    #[must_use]
    pub const fn public_host_teardown_compatibility_claimed(self) -> bool {
        self.public_host_teardown_compatibility_claimed
    }

    #[must_use]
    pub const fn act_flushing_claimed(self) -> bool {
        self.act_flushing_claimed
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(self) -> bool {
        self.native_execution
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

    #[must_use]
    pub const fn code(&self) -> &'static str {
        match self {
            Self::Scheduled(_) => "Scheduled",
            Self::IgnoredAfterUnmount => "IgnoredAfterUnmount",
            Self::AlreadyUnmountScheduled => "AlreadyUnmountScheduled",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateUpdateRouteQueueDiagnostics {
    root: FiberRootId,
    scheduled_update_kind: TestRendererRootUpdateKind,
    scheduled_element: RootElementHandle,
    update_raw: u64,
    queue_raw: u64,
    schedule_fiber: TestRendererFiberHandleDiagnostics,
    lane_bits: u32,
    pending_lanes_before_enqueue_bits: u32,
    pending_lanes_after_enqueue_bits: u32,
    selected_next_lanes_bits: u32,
    render_lanes_bits: u32,
    queue_matches_render_current_queue: bool,
    selected_lanes_match_render_lanes: bool,
    pending_lanes_after_enqueue_match_render_lanes: bool,
    root_schedule_inserted: bool,
    root_schedule_microtask_requested: bool,
    root_schedule_might_have_pending_sync_work: bool,
}

impl TestRendererPrivateUpdateRouteQueueDiagnostics {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn scheduled_element(self) -> RootElementHandle {
        self.scheduled_element
    }

    #[must_use]
    pub const fn update_raw(self) -> u64 {
        self.update_raw
    }

    #[must_use]
    pub const fn queue_raw(self) -> u64 {
        self.queue_raw
    }

    #[must_use]
    pub const fn schedule_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.schedule_fiber
    }

    #[must_use]
    pub const fn lane_bits(self) -> u32 {
        self.lane_bits
    }

    #[must_use]
    pub const fn pending_lanes_before_enqueue_bits(self) -> u32 {
        self.pending_lanes_before_enqueue_bits
    }

    #[must_use]
    pub const fn pending_lanes_after_enqueue_bits(self) -> u32 {
        self.pending_lanes_after_enqueue_bits
    }

    #[must_use]
    pub const fn selected_next_lanes_bits(self) -> u32 {
        self.selected_next_lanes_bits
    }

    #[must_use]
    pub const fn render_lanes_bits(self) -> u32 {
        self.render_lanes_bits
    }

    #[must_use]
    pub const fn queue_matches_render_current_queue(self) -> bool {
        self.queue_matches_render_current_queue
    }

    #[must_use]
    pub const fn selected_lanes_match_render_lanes(self) -> bool {
        self.selected_lanes_match_render_lanes
    }

    #[must_use]
    pub const fn pending_lanes_after_enqueue_match_render_lanes(self) -> bool {
        self.pending_lanes_after_enqueue_match_render_lanes
    }

    #[must_use]
    pub const fn root_schedule_inserted(self) -> bool {
        self.root_schedule_inserted
    }

    #[must_use]
    pub const fn root_schedule_microtask_requested(self) -> bool {
        self.root_schedule_microtask_requested
    }

    #[must_use]
    pub const fn root_schedule_might_have_pending_sync_work(self) -> bool {
        self.root_schedule_might_have_pending_sync_work
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateUpdateRouteWorkLoopDiagnostics {
    root: FiberRootId,
    render_current: TestRendererFiberHandleDiagnostics,
    render_finished_work: TestRendererFiberHandleDiagnostics,
    commit_current: TestRendererFiberHandleDiagnostics,
    current_update_queue_raw: u64,
    work_in_progress_update_queue_raw: u64,
    committed_current_update_queue_raw: u64,
    applied_update_count: usize,
    skipped_update_count: usize,
    remaining_lanes_empty: bool,
    commit_finished_lanes_bits: u32,
    commit_remaining_lanes_empty: bool,
    commit_pending_lanes_empty: bool,
    commit_current_matches_render_finished_work: bool,
    commit_previous_current_matches_render_current: bool,
    commit_lanes_match_render_lanes: bool,
    committed_current_queue_matches_work_in_progress: bool,
    root_current_matches_commit_current: bool,
}

impl TestRendererPrivateUpdateRouteWorkLoopDiagnostics {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.render_current
    }

    #[must_use]
    pub const fn render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.render_finished_work
    }

    #[must_use]
    pub const fn commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_current
    }

    #[must_use]
    pub const fn current_update_queue_raw(self) -> u64 {
        self.current_update_queue_raw
    }

    #[must_use]
    pub const fn work_in_progress_update_queue_raw(self) -> u64 {
        self.work_in_progress_update_queue_raw
    }

    #[must_use]
    pub const fn committed_current_update_queue_raw(self) -> u64 {
        self.committed_current_update_queue_raw
    }

    #[must_use]
    pub const fn applied_update_count(self) -> usize {
        self.applied_update_count
    }

    #[must_use]
    pub const fn skipped_update_count(self) -> usize {
        self.skipped_update_count
    }

    #[must_use]
    pub const fn remaining_lanes_empty(self) -> bool {
        self.remaining_lanes_empty
    }

    #[must_use]
    pub const fn commit_finished_lanes_bits(self) -> u32 {
        self.commit_finished_lanes_bits
    }

    #[must_use]
    pub const fn commit_remaining_lanes_empty(self) -> bool {
        self.commit_remaining_lanes_empty
    }

    #[must_use]
    pub const fn commit_pending_lanes_empty(self) -> bool {
        self.commit_pending_lanes_empty
    }

    #[must_use]
    pub const fn commit_current_matches_render_finished_work(self) -> bool {
        self.commit_current_matches_render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current_matches_render_current(self) -> bool {
        self.commit_previous_current_matches_render_current
    }

    #[must_use]
    pub const fn commit_lanes_match_render_lanes(self) -> bool {
        self.commit_lanes_match_render_lanes
    }

    #[must_use]
    pub const fn committed_current_queue_matches_work_in_progress(self) -> bool {
        self.committed_current_queue_matches_work_in_progress
    }

    #[must_use]
    pub const fn root_current_matches_commit_current(self) -> bool {
        self.root_current_matches_commit_current
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateUpdateRouteHostTextDiagnostics {
    previous_text_fiber: TestRendererFiberHandleDiagnostics,
    updated_text_fiber: TestRendererFiberHandleDiagnostics,
    text_state_node_raw: u64,
    host_component_prop_update_recorded: bool,
    host_component_style_update_recorded: bool,
    text_update_apply_recorded: bool,
    host_text_update_apply_count: usize,
    host_component_update_apply_count: usize,
}

impl TestRendererPrivateUpdateRouteHostTextDiagnostics {
    #[must_use]
    pub const fn previous_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.previous_text_fiber
    }

    #[must_use]
    pub const fn updated_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.updated_text_fiber
    }

    #[must_use]
    pub const fn text_state_node_raw(self) -> u64 {
        self.text_state_node_raw
    }

    #[must_use]
    pub const fn host_component_prop_update_recorded(self) -> bool {
        self.host_component_prop_update_recorded
    }

    #[must_use]
    pub const fn host_component_style_update_recorded(self) -> bool {
        self.host_component_style_update_recorded
    }

    #[must_use]
    pub const fn text_update_apply_recorded(self) -> bool {
        self.text_update_apply_recorded
    }

    #[must_use]
    pub const fn host_text_update_apply_count(self) -> usize {
        self.host_text_update_apply_count
    }

    #[must_use]
    pub const fn host_component_update_apply_count(self) -> usize {
        self.host_component_update_apply_count
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateUpdateRouteAdmissionRecord {
    record_id: &'static str,
    status: &'static str,
    public_surface: &'static str,
    root: FiberRootId,
    request_api: &'static str,
    source_diagnostic_name: &'static str,
    source_diagnostic_status: &'static str,
    lifecycle: TestRendererRootLifecycle,
    scheduled_update_kind: TestRendererRootUpdateKind,
    host_output_update_kind: TestRendererRootUpdateKind,
    consumes_accepted_host_root_update_queue_metadata: bool,
    consumes_accepted_root_work_loop_metadata: bool,
    consumes_accepted_host_output_metadata: bool,
    rejects_stale_root_lifecycle: bool,
    rejects_stale_host_output: bool,
    rejects_missing_update_queue_evidence: bool,
    public_root_update_available: bool,
    public_serialization_available: bool,
    native_execution_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateUpdateRouteAdmissionRecord {
    #[must_use]
    pub const fn record_id(self) -> &'static str {
        self.record_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn request_api(self) -> &'static str {
        self.request_api
    }

    #[must_use]
    pub const fn source_diagnostic_name(self) -> &'static str {
        self.source_diagnostic_name
    }

    #[must_use]
    pub const fn source_diagnostic_status(self) -> &'static str {
        self.source_diagnostic_status
    }

    #[must_use]
    pub const fn lifecycle(self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn consumes_accepted_host_root_update_queue_metadata(self) -> bool {
        self.consumes_accepted_host_root_update_queue_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_root_work_loop_metadata(self) -> bool {
        self.consumes_accepted_root_work_loop_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_host_output_metadata(self) -> bool {
        self.consumes_accepted_host_output_metadata
    }

    #[must_use]
    pub const fn rejects_stale_root_lifecycle(self) -> bool {
        self.rejects_stale_root_lifecycle
    }

    #[must_use]
    pub const fn rejects_stale_host_output(self) -> bool {
        self.rejects_stale_host_output
    }

    #[must_use]
    pub const fn rejects_missing_update_queue_evidence(self) -> bool {
        self.rejects_missing_update_queue_evidence
    }

    #[must_use]
    pub const fn public_root_update_available(self) -> bool {
        self.public_root_update_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateUpdateRouteDiagnostics {
    diagnostic_name: &'static str,
    status: &'static str,
    root: FiberRootId,
    host_output_update_kind: TestRendererRootUpdateKind,
    update_queue: TestRendererPrivateUpdateRouteQueueDiagnostics,
    root_work_loop: TestRendererPrivateUpdateRouteWorkLoopDiagnostics,
    host_text_update: TestRendererPrivateUpdateRouteHostTextDiagnostics,
    admission: TestRendererPrivateUpdateRouteAdmissionRecord,
    consumes_accepted_host_root_update_queue_metadata: bool,
    consumes_accepted_root_work_loop_metadata: bool,
    consumes_manual_host_output_canary: bool,
    public_root_update_available: bool,
    public_serialization_available: bool,
    native_execution_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateUpdateRouteDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn update_queue(&self) -> TestRendererPrivateUpdateRouteQueueDiagnostics {
        self.update_queue
    }

    #[must_use]
    pub const fn root_work_loop(&self) -> TestRendererPrivateUpdateRouteWorkLoopDiagnostics {
        self.root_work_loop
    }

    #[must_use]
    pub const fn host_text_update(&self) -> TestRendererPrivateUpdateRouteHostTextDiagnostics {
        self.host_text_update
    }

    #[must_use]
    pub const fn admission(&self) -> TestRendererPrivateUpdateRouteAdmissionRecord {
        self.admission
    }

    #[must_use]
    pub const fn consumes_accepted_host_root_update_queue_metadata(&self) -> bool {
        self.consumes_accepted_host_root_update_queue_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_root_work_loop_metadata(&self) -> bool {
        self.consumes_accepted_root_work_loop_metadata
    }

    #[must_use]
    pub const fn consumes_manual_host_output_canary(&self) -> bool {
        self.consumes_manual_host_output_canary
    }

    #[must_use]
    pub const fn public_root_update_available(&self) -> bool {
        self.public_root_update_available
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererUpdateNativeBridgeAdmission {
    diagnostic_id: &'static str,
    status: &'static str,
    root: FiberRootId,
    route_dependency_id: &'static str,
    update_route_admission_id: &'static str,
    lifecycle: TestRendererRootLifecycle,
    scheduled_update_kind: TestRendererRootUpdateKind,
    host_output_update_kind: TestRendererRootUpdateKind,
    update_route_admission_accepted: bool,
    lifecycle_evidence_accepted: bool,
    root_work_loop_handoff_accepted: bool,
    host_output_handoff_accepted: bool,
    host_component_prop_update_recorded: bool,
    host_component_style_update_recorded: bool,
    text_update_apply_recorded: bool,
    host_text_update_apply_count: usize,
    host_component_update_apply_count: usize,
    rejects_stale_update_handoffs: bool,
    rejects_unmounted_roots: bool,
    rejects_missing_host_output_handoff: bool,
    public_update_compatibility_claimed: bool,
    public_serialization_available: bool,
    act_flushing_claimed: bool,
    native_bridge_available: bool,
    native_execution: bool,
    rust_execution_from_js: bool,
    reconciler_execution_from_js: bool,
    compatibility_claimed: bool,
}

impl TestRendererUpdateNativeBridgeAdmission {
    #[must_use]
    pub const fn diagnostic_id(self) -> &'static str {
        self.diagnostic_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn route_dependency_id(self) -> &'static str {
        self.route_dependency_id
    }

    #[must_use]
    pub const fn update_route_admission_id(self) -> &'static str {
        self.update_route_admission_id
    }

    #[must_use]
    pub const fn lifecycle(self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn update_route_admission_accepted(self) -> bool {
        self.update_route_admission_accepted
    }

    #[must_use]
    pub const fn lifecycle_evidence_accepted(self) -> bool {
        self.lifecycle_evidence_accepted
    }

    #[must_use]
    pub const fn root_work_loop_handoff_accepted(self) -> bool {
        self.root_work_loop_handoff_accepted
    }

    #[must_use]
    pub const fn host_output_handoff_accepted(self) -> bool {
        self.host_output_handoff_accepted
    }

    #[must_use]
    pub const fn host_component_prop_update_recorded(self) -> bool {
        self.host_component_prop_update_recorded
    }

    #[must_use]
    pub const fn host_component_style_update_recorded(self) -> bool {
        self.host_component_style_update_recorded
    }

    #[must_use]
    pub const fn text_update_apply_recorded(self) -> bool {
        self.text_update_apply_recorded
    }

    #[must_use]
    pub const fn host_text_update_apply_count(self) -> usize {
        self.host_text_update_apply_count
    }

    #[must_use]
    pub const fn host_component_update_apply_count(self) -> usize {
        self.host_component_update_apply_count
    }

    #[must_use]
    pub const fn rejects_stale_update_handoffs(self) -> bool {
        self.rejects_stale_update_handoffs
    }

    #[must_use]
    pub const fn rejects_unmounted_roots(self) -> bool {
        self.rejects_unmounted_roots
    }

    #[must_use]
    pub const fn rejects_missing_host_output_handoff(self) -> bool {
        self.rejects_missing_host_output_handoff
    }

    #[must_use]
    pub const fn public_update_compatibility_claimed(self) -> bool {
        self.public_update_compatibility_claimed
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn act_flushing_claimed(self) -> bool {
        self.act_flushing_claimed
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(self) -> bool {
        self.native_execution
    }

    #[must_use]
    pub const fn rust_execution_from_js(self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn reconciler_execution_from_js(self) -> bool {
        self.reconciler_execution_from_js
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

pub const TEST_RENDERER_SERIALIZATION_CANARY_GATE_NAME: &str =
    "fast-react-test-renderer.serialization.private-canary";
pub const TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-json-canary";
pub const TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.private-facade-result";
pub const TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.private-native-execution-evidence";
pub const TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_STATUS: &str =
    "private-tojson-native-execution-records-consumed-public-tojson-blocked";
pub const TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.totree.private-native-execution-evidence";
pub const TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_STATUS: &str =
    "private-totree-native-execution-records-consumed-public-totree-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-update-host-output-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-nested-host-output-update-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-sibling-text-host-output-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-unmount-host-output-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_UNMOUNT_ROW_STATUS: &str =
    "private-tojson-update-unmount-host-output-rows-public-tojson-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID: &str =
    "react-test-renderer-update-route-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID: &str =
    "react-test-renderer-unmount-route-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.update-route.private-root-work-loop";
pub const TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS: &str =
    "private-update-route-root-work-loop-metadata-ready-public-update-blocked";
pub const TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID: &str =
    "react-test-renderer-update-route-root-work-loop-private-admission";
pub const TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS: &str =
    "accepted-private-update-route-root-work-loop-admission-public-update-blocked";
pub const TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID: &str =
    "react-test-renderer-update-native-bridge-admission-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS: &str =
    "private-update-native-bridge-admission-host-output-handoff-public-update-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SERIALIZATION_DEPENDENCY_ID: &str =
    "react-test-renderer-serialization-private-json-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID: &str =
    "react-test-renderer-unmount-deletion-commit-handoff-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_STATUS: &str =
    "private-unmount-deletion-commit-handoff-public-unmount-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID: &str =
    "react-test-renderer-unmount-native-bridge-admission-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS: &str =
    "private-unmount-native-bridge-admission-public-unmount-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID: &str =
    "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_STATUS: &str =
    "private-unmount-native-bridge-cleanup-handoff-public-unmount-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_DIAGNOSTIC_ID: &str =
    "react-test-renderer-unmount-passive-ref-cleanup-order-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_STATUS: &str =
    "private-unmount-passive-ref-cleanup-order-public-unmount-blocked";
pub const TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-tree-canary";
pub const TEST_RENDERER_PRIVATE_TREE_COMMITTED_FIBER_INSPECTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-tree-committed-fiber-inspection-canary";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_ALL_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.find-all-private-query";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_BY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.find-by-private-query";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_QUERY_BRIDGE_PREFLIGHT_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.query-bridge-preflight";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.private-native-query-execution-evidence";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_STATUS: &str = "private-test-instance-native-create-update-execution-records-consumed-public-test-instance-blocked";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.private-class-root-query-execution-evidence";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_STATUS: &str =
    "private-test-instance-class-root-update-query-execution-public-test-instance-blocked";
pub const TEST_RENDERER_CURRENT_ROOT_CANARY_METADATA_ID: &str =
    "fast-react-test-renderer-current-root-canary-metadata";
pub const TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.root-create.private-preflight";
pub const TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS: &str =
    "private-root-create-preflight-ready-public-root-blocked";
pub const TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_ROW_ID: &str =
    "react-test-renderer-root-create-work-loop-finished-work-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_STATUS: &str =
    "private-root-create-work-loop-finished-work-preflight-public-root-blocked";
pub const TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_ID: &str =
    "fast-react-test-renderer-root-work-loop-finished-work-preflight-metadata";
pub const TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS: &str =
    "accepted-root-work-loop-finished-work-preflight-metadata";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.create-route.private-admission";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS: &str =
    "private-create-route-admission-rust-root-create-work-loop-evidence-public-create-blocked";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID: &str =
    "react-test-renderer-create-route-admission-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_ID: &str =
    "fast-react-test-renderer-create-route-admission-metadata";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_STATUS: &str =
    "accepted-create-route-rust-root-create-work-loop-admission-metadata";
pub const TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID: &str =
    "react-test-renderer-create-native-bridge-host-output-handoff-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS: &str =
    "private-create-native-bridge-host-output-handoff-public-create-blocked";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.error-boundary.private-root-options-canary";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS: &str =
    "private-error-boundary-diagnostics-root-options-metadata-public-boundary-blocked";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.error-boundary.private-native-execution-evidence";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_STATUS: &str =
    "private-error-boundary-native-execution-update-failure-evidence-public-recovery-blocked";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.error-boundary.private-commit-recovery-evidence";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_STATUS: &str =
    "private-error-boundary-commit-recovery-metadata-public-recovery-blocked";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_API: &str =
    "TestRendererRoot::describe_private_error_boundary_commit_recovery_for_canary";
pub const TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.act.private-passive-effect-drain-canary";
pub const TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_STATUS: &str =
    "accepted-private-act-pending-passive-flush-metadata-public-act-blocked";
pub const TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_ACCEPTED_RECORDS: [&str; 5] = [
    "PendingPassiveCommitHandoff",
    "PassiveEffectSchedulerFlushGateRecord",
    "SchedulerPassiveEffectsFlushRequest",
    "PassiveEffectSchedulerFlushExecutionRecord",
    "PassiveEffectsFlushResult",
];
pub const TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.act.private-nested-scope-passive-flush-canary";
pub const TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_STATUS: &str =
    "private-act-nested-scope-passive-flush-public-act-blocked";
pub const TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_ORDER: [&str; 5] = [
    "outer-act-scope-enter",
    "inner-act-scope-enter",
    "accepted-passive-work-flush",
    "inner-act-scope-exit",
    "outer-act-scope-exit",
];
pub const TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE: [&str; 3] =
    ["HostRoot", "HostComponent", "HostText"];
pub const TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE: [&str; 4] =
    ["HostRoot", "FunctionComponent", "HostComponent", "HostText"];
pub const TEST_RENDERER_PRIVATE_TREE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE: [&str; 4] =
    ["HostRoot", "HostText", "HostComponent", "HostText"];
pub const TEST_RENDERER_PRIVATE_TREE_COMPOSITE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE: [&str; 5] = [
    "HostRoot",
    "FunctionComponent",
    "HostText",
    "HostComponent",
    "HostText",
];
pub const TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE: &str = "CanaryFunctionComponent";
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.get-instance.private-class-root-canary";
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE: [&str; 4] =
    ["HostRoot", "ClassComponent", "HostComponent", "HostText"];
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_HOST_ROOT_FIBER_SHAPE: [&str; 2] =
    ["HostRoot", "HostComponent"];
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_FUNCTION_ROOT_FIBER_SHAPE: [&str; 2] =
    ["HostRoot", "FunctionComponent"];
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE: &str = "CanaryClassComponent";
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_CONSTRUCTOR_NAME: &str = "CanaryClassInstance";
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_STATE_MARKER: &str = "initial-state";
pub const TEST_RENDERER_SERIALIZATION_ORACLE_KIND: &str =
    "react-19.2.6-react-test-renderer-serialization-oracle";
pub const TEST_RENDERER_SERIALIZATION_ORACLE_PROBE_MODE_COUNT: usize = 2;
pub const TEST_RENDERER_SERIALIZATION_ORACLE_SCENARIO_COUNT: usize = 7;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererRootCreatePreflightChildShape {
    Text,
    Empty,
    Unsupported,
}

impl TestRendererRootCreatePreflightChildShape {
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::Text => "Text",
            Self::Empty => "Empty",
            Self::Unsupported => "Unsupported",
        }
    }

    const fn is_supported_for_create_preflight(self) -> bool {
        matches!(self, Self::Text)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootCreatePreflightInputShape {
    element: RootElementHandle,
    root_node_kind: &'static str,
    element_type: &'static str,
    child_shape: TestRendererRootCreatePreflightChildShape,
}

impl TestRendererRootCreatePreflightInputShape {
    #[must_use]
    pub const fn host_component_with_text_child(
        element: RootElementHandle,
        element_type: &'static str,
    ) -> Self {
        Self {
            element,
            root_node_kind: "HostComponent",
            element_type,
            child_shape: TestRendererRootCreatePreflightChildShape::Text,
        }
    }

    #[must_use]
    pub const fn host_component_with_unsupported_children(
        element: RootElementHandle,
        element_type: &'static str,
    ) -> Self {
        Self {
            element,
            root_node_kind: "HostComponent",
            element_type,
            child_shape: TestRendererRootCreatePreflightChildShape::Unsupported,
        }
    }

    #[must_use]
    pub const fn element(self) -> RootElementHandle {
        self.element
    }

    #[must_use]
    pub const fn root_node_kind(self) -> &'static str {
        self.root_node_kind
    }

    #[must_use]
    pub const fn element_type(self) -> &'static str {
        self.element_type
    }

    #[must_use]
    pub const fn child_shape(self) -> TestRendererRootCreatePreflightChildShape {
        self.child_shape
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootCreatePreflightCanaryApiIdentity {
    metadata_id: &'static str,
    metadata_status: &'static str,
    operation: &'static str,
    root_api: &'static str,
    preflight_api: &'static str,
    root_options_type: &'static str,
    test_renderer_options_type: &'static str,
    container_update_api: &'static str,
    scheduler_api: &'static str,
}

impl TestRendererRootCreatePreflightCanaryApiIdentity {
    #[must_use]
    pub const fn current() -> Self {
        Self {
            metadata_id: TEST_RENDERER_CURRENT_ROOT_CANARY_METADATA_ID,
            metadata_status: "private-root-execution-bridge-current-rust-canary-metadata",
            operation: "create",
            root_api: "TestRendererRoot::create",
            preflight_api: "TestRendererRoot::describe_private_root_create_preflight_for_canary",
            root_options_type: "RootOptions",
            test_renderer_options_type: "TestRendererOptions",
            container_update_api: "update_container",
            scheduler_api: "ensure_root_is_scheduled",
        }
    }

    #[must_use]
    pub const fn new_for_canary(
        metadata_id: &'static str,
        metadata_status: &'static str,
        root_api: &'static str,
    ) -> Self {
        Self {
            metadata_id,
            metadata_status,
            operation: "create",
            root_api,
            preflight_api: "TestRendererRoot::describe_private_root_create_preflight_for_canary",
            root_options_type: "RootOptions",
            test_renderer_options_type: "TestRendererOptions",
            container_update_api: "update_container",
            scheduler_api: "ensure_root_is_scheduled",
        }
    }

    #[must_use]
    pub const fn metadata_id(self) -> &'static str {
        self.metadata_id
    }

    #[must_use]
    pub const fn metadata_status(self) -> &'static str {
        self.metadata_status
    }

    #[must_use]
    pub const fn operation(self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn root_api(self) -> &'static str {
        self.root_api
    }

    #[must_use]
    pub const fn preflight_api(self) -> &'static str {
        self.preflight_api
    }

    #[must_use]
    pub const fn root_options_type(self) -> &'static str {
        self.root_options_type
    }

    #[must_use]
    pub const fn test_renderer_options_type(self) -> &'static str {
        self.test_renderer_options_type
    }

    #[must_use]
    pub const fn container_update_api(self) -> &'static str {
        self.container_update_api
    }

    #[must_use]
    pub const fn scheduler_api(self) -> &'static str {
        self.scheduler_api
    }

    fn is_current(self) -> bool {
        self.metadata_id == TEST_RENDERER_CURRENT_ROOT_CANARY_METADATA_ID
            && self.metadata_status == "private-root-execution-bridge-current-rust-canary-metadata"
            && self.operation == "create"
            && self.root_api == "TestRendererRoot::create"
            && self.preflight_api
                == "TestRendererRoot::describe_private_root_create_preflight_for_canary"
            && self.root_options_type == "RootOptions"
            && self.test_renderer_options_type == "TestRendererOptions"
            && self.container_update_api == "update_container"
            && self.scheduler_api == "ensure_root_is_scheduled"
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootCreatePreflightOptionsMetadata {
    options_type: &'static str,
    strict_mode: bool,
    has_create_node_mock: bool,
    root_error_options: TestRendererRootErrorOptionDiagnostics,
    root_options_metadata_available: bool,
    create_node_mock_invoked: bool,
    public_root_error_callbacks_invoked: bool,
}

impl TestRendererRootCreatePreflightOptionsMetadata {
    fn from_options(options: &TestRendererOptions) -> Self {
        let root_error_options = TestRendererRootErrorOptionDiagnostics {
            on_uncaught_error: options.on_uncaught_error(),
            on_caught_error: options.on_caught_error(),
            on_recoverable_error: options.on_recoverable_error(),
            root_error_option_metadata_available: true,
            public_root_error_callbacks_invoked: false,
            public_error_boundary_behavior_available: false,
            compatibility_claimed: false,
        };

        Self {
            options_type: "TestRendererOptions",
            strict_mode: options.strict_mode(),
            has_create_node_mock: options.has_create_node_mock(),
            root_error_options,
            root_options_metadata_available: true,
            create_node_mock_invoked: false,
            public_root_error_callbacks_invoked: false,
        }
    }

    #[must_use]
    pub const fn options_type(self) -> &'static str {
        self.options_type
    }

    #[must_use]
    pub const fn strict_mode(self) -> bool {
        self.strict_mode
    }

    #[must_use]
    pub const fn has_create_node_mock(self) -> bool {
        self.has_create_node_mock
    }

    #[must_use]
    pub const fn root_error_options(self) -> TestRendererRootErrorOptionDiagnostics {
        self.root_error_options
    }

    #[must_use]
    pub const fn root_options_metadata_available(self) -> bool {
        self.root_options_metadata_available
    }

    #[must_use]
    pub const fn create_node_mock_invoked(self) -> bool {
        self.create_node_mock_invoked
    }

    #[must_use]
    pub const fn public_root_error_callbacks_invoked(self) -> bool {
        self.public_root_error_callbacks_invoked
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootWorkLoopFinishedWorkPreflightMetadata {
    metadata_id: &'static str,
    metadata_status: &'static str,
    accepted_worker: &'static str,
    accepted_rust_module: &'static str,
    render_phase_api: &'static str,
    render_phase_record: &'static str,
    finished_work_record: &'static str,
    pending_finished_work_record: &'static str,
    commit_handoff_record: &'static str,
    accepted_input_shape: &'static str,
}

impl TestRendererRootWorkLoopFinishedWorkPreflightMetadata {
    #[must_use]
    pub const fn current() -> Self {
        Self {
            metadata_id: TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_ID,
            metadata_status: TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS,
            accepted_worker: "worker-534-root-work-loop-finished-work-commit-handoff",
            accepted_rust_module: "fast-react-reconciler::root_work_loop",
            render_phase_api: "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff",
            render_phase_record: "HostRootRenderPhaseRecord",
            finished_work_record: "HostRootRenderPhaseRecord::finished_work",
            pending_finished_work_record: "HostRootFinishedWorkPendingCommitRecordForCanary",
            commit_handoff_record: "HostRootFinishedWorkCommitHandoffRecordForCanary",
            accepted_input_shape: "HostComponentWithTextChild",
        }
    }

    #[must_use]
    pub const fn new_for_canary(
        metadata_id: &'static str,
        metadata_status: &'static str,
        render_phase_api: &'static str,
    ) -> Self {
        Self {
            metadata_id,
            metadata_status,
            accepted_worker: "worker-534-root-work-loop-finished-work-commit-handoff",
            accepted_rust_module: "fast-react-reconciler::root_work_loop",
            render_phase_api,
            render_phase_record: "HostRootRenderPhaseRecord",
            finished_work_record: "HostRootRenderPhaseRecord::finished_work",
            pending_finished_work_record: "HostRootFinishedWorkPendingCommitRecordForCanary",
            commit_handoff_record: "HostRootFinishedWorkCommitHandoffRecordForCanary",
            accepted_input_shape: "HostComponentWithTextChild",
        }
    }

    #[must_use]
    pub const fn metadata_id(self) -> &'static str {
        self.metadata_id
    }

    #[must_use]
    pub const fn metadata_status(self) -> &'static str {
        self.metadata_status
    }

    #[must_use]
    pub const fn accepted_worker(self) -> &'static str {
        self.accepted_worker
    }

    #[must_use]
    pub const fn accepted_rust_module(self) -> &'static str {
        self.accepted_rust_module
    }

    #[must_use]
    pub const fn render_phase_api(self) -> &'static str {
        self.render_phase_api
    }

    #[must_use]
    pub const fn render_phase_record(self) -> &'static str {
        self.render_phase_record
    }

    #[must_use]
    pub const fn finished_work_record(self) -> &'static str {
        self.finished_work_record
    }

    #[must_use]
    pub const fn pending_finished_work_record(self) -> &'static str {
        self.pending_finished_work_record
    }

    #[must_use]
    pub const fn commit_handoff_record(self) -> &'static str {
        self.commit_handoff_record
    }

    #[must_use]
    pub const fn accepted_input_shape(self) -> &'static str {
        self.accepted_input_shape
    }

    fn is_current(self) -> bool {
        let current = Self::current();
        self.metadata_id == current.metadata_id
            && self.metadata_status == current.metadata_status
            && self.accepted_worker == current.accepted_worker
            && self.accepted_rust_module == current.accepted_rust_module
            && self.render_phase_api == current.render_phase_api
            && self.render_phase_record == current.render_phase_record
            && self.finished_work_record == current.finished_work_record
            && self.pending_finished_work_record == current.pending_finished_work_record
            && self.commit_handoff_record == current.commit_handoff_record
            && self.accepted_input_shape == current.accepted_input_shape
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateCreateRouteAdmissionMetadata {
    metadata_id: &'static str,
    metadata_status: &'static str,
    accepted_worker: &'static str,
    accepted_rust_crate: &'static str,
    root_api: &'static str,
    preflight_api: &'static str,
    work_loop_render_phase_api: &'static str,
    lifecycle_record: &'static str,
    execution_result_record: &'static str,
    accepted_input_shape: &'static str,
}

impl TestRendererPrivateCreateRouteAdmissionMetadata {
    #[must_use]
    pub const fn current() -> Self {
        Self {
            metadata_id: TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_ID,
            metadata_status: TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_STATUS,
            accepted_worker: "worker-610-test-renderer-create-native-bridge-admission",
            accepted_rust_crate: "fast-react-test-renderer",
            root_api: "TestRendererRoot::create",
            preflight_api: "TestRendererRoot::describe_private_root_create_preflight_for_canary",
            work_loop_render_phase_api: "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff",
            lifecycle_record: "TestRendererRootScheduledUpdate",
            execution_result_record: "TestRendererPrivateCreateRouteAdmissionDiagnostics",
            accepted_input_shape: "HostComponentWithTextChild",
        }
    }

    #[must_use]
    pub const fn new_for_canary(
        metadata_id: &'static str,
        metadata_status: &'static str,
        root_api: &'static str,
    ) -> Self {
        Self {
            metadata_id,
            metadata_status,
            accepted_worker: "worker-610-test-renderer-create-native-bridge-admission",
            accepted_rust_crate: "fast-react-test-renderer",
            root_api,
            preflight_api: "TestRendererRoot::describe_private_root_create_preflight_for_canary",
            work_loop_render_phase_api: "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff",
            lifecycle_record: "TestRendererRootScheduledUpdate",
            execution_result_record: "TestRendererPrivateCreateRouteAdmissionDiagnostics",
            accepted_input_shape: "HostComponentWithTextChild",
        }
    }

    #[must_use]
    pub const fn metadata_id(self) -> &'static str {
        self.metadata_id
    }

    #[must_use]
    pub const fn metadata_status(self) -> &'static str {
        self.metadata_status
    }

    #[must_use]
    pub const fn accepted_worker(self) -> &'static str {
        self.accepted_worker
    }

    #[must_use]
    pub const fn accepted_rust_crate(self) -> &'static str {
        self.accepted_rust_crate
    }

    #[must_use]
    pub const fn root_api(self) -> &'static str {
        self.root_api
    }

    #[must_use]
    pub const fn preflight_api(self) -> &'static str {
        self.preflight_api
    }

    #[must_use]
    pub const fn work_loop_render_phase_api(self) -> &'static str {
        self.work_loop_render_phase_api
    }

    #[must_use]
    pub const fn lifecycle_record(self) -> &'static str {
        self.lifecycle_record
    }

    #[must_use]
    pub const fn execution_result_record(self) -> &'static str {
        self.execution_result_record
    }

    #[must_use]
    pub const fn accepted_input_shape(self) -> &'static str {
        self.accepted_input_shape
    }

    fn is_current(self) -> bool {
        let current = Self::current();
        self.metadata_id == current.metadata_id
            && self.metadata_status == current.metadata_status
            && self.accepted_worker == current.accepted_worker
            && self.accepted_rust_crate == current.accepted_rust_crate
            && self.root_api == current.root_api
            && self.preflight_api == current.preflight_api
            && self.work_loop_render_phase_api == current.work_loop_render_phase_api
            && self.lifecycle_record == current.lifecycle_record
            && self.execution_result_record == current.execution_result_record
            && self.accepted_input_shape == current.accepted_input_shape
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
    row_id: &'static str,
    status: &'static str,
    metadata: TestRendererRootWorkLoopFinishedWorkPreflightMetadata,
    root: FiberRootId,
    previous_current: TestRendererFiberHandleDiagnostics,
    finished_work: TestRendererFiberHandleDiagnostics,
    resulting_element: RootElementHandle,
    scheduled_update_kind: TestRendererRootUpdateKind,
    render_lanes_empty: bool,
    remaining_lanes_empty: bool,
    finished_work_matches_render_phase: bool,
    records_accepted_finished_work_metadata: bool,
    public_create_behavior_available: bool,
    host_mutation_execution_blocked: bool,
    effects_refs_and_hydration_blocked: bool,
    compatibility_claimed: bool,
}

impl TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
    #[must_use]
    pub const fn row_id(self) -> &'static str {
        self.row_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn metadata(self) -> TestRendererRootWorkLoopFinishedWorkPreflightMetadata {
        self.metadata
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.previous_current
    }

    #[must_use]
    pub const fn finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.finished_work
    }

    #[must_use]
    pub const fn resulting_element(self) -> RootElementHandle {
        self.resulting_element
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn render_lanes_empty(self) -> bool {
        self.render_lanes_empty
    }

    #[must_use]
    pub const fn remaining_lanes_empty(self) -> bool {
        self.remaining_lanes_empty
    }

    #[must_use]
    pub const fn finished_work_matches_render_phase(self) -> bool {
        self.finished_work_matches_render_phase
    }

    #[must_use]
    pub const fn records_accepted_finished_work_metadata(self) -> bool {
        self.records_accepted_finished_work_metadata
    }

    #[must_use]
    pub const fn public_create_behavior_available(self) -> bool {
        self.public_create_behavior_available
    }

    #[must_use]
    pub const fn host_mutation_execution_blocked(self) -> bool {
        self.host_mutation_execution_blocked
    }

    #[must_use]
    pub const fn effects_refs_and_hydration_blocked(self) -> bool {
        self.effects_refs_and_hydration_blocked
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootCreatePreflightDiagnostics {
    diagnostic_name: &'static str,
    status: &'static str,
    root: FiberRootId,
    input_shape: TestRendererRootCreatePreflightInputShape,
    root_options: TestRendererRootCreatePreflightOptionsMetadata,
    canary_api_identity: TestRendererRootCreatePreflightCanaryApiIdentity,
    scheduled_update_kind: TestRendererRootUpdateKind,
    scheduled_element: RootElementHandle,
    container_update_api: &'static str,
    scheduler_api: &'static str,
    work_loop_finished_work_preflight: TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics,
    private_rust_root_created: bool,
    private_root_canary_boundary_validated: bool,
    public_renderer_root_created: bool,
    public_root_available: bool,
    native_addon_loaded: bool,
    native_bridge_available: bool,
    native_execution: bool,
    rust_execution_from_js: bool,
    host_output_produced_from_js: bool,
    compatibility_claimed: bool,
}

impl TestRendererRootCreatePreflightDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn input_shape(self) -> TestRendererRootCreatePreflightInputShape {
        self.input_shape
    }

    #[must_use]
    pub const fn root_options(self) -> TestRendererRootCreatePreflightOptionsMetadata {
        self.root_options
    }

    #[must_use]
    pub const fn canary_api_identity(self) -> TestRendererRootCreatePreflightCanaryApiIdentity {
        self.canary_api_identity
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn scheduled_element(self) -> RootElementHandle {
        self.scheduled_element
    }

    #[must_use]
    pub const fn container_update_api(self) -> &'static str {
        self.container_update_api
    }

    #[must_use]
    pub const fn scheduler_api(self) -> &'static str {
        self.scheduler_api
    }

    #[must_use]
    pub const fn work_loop_finished_work_preflight(
        self,
    ) -> TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
        self.work_loop_finished_work_preflight
    }

    #[must_use]
    pub const fn private_rust_root_created(self) -> bool {
        self.private_rust_root_created
    }

    #[must_use]
    pub const fn private_root_canary_boundary_validated(self) -> bool {
        self.private_root_canary_boundary_validated
    }

    #[must_use]
    pub const fn public_renderer_root_created(self) -> bool {
        self.public_renderer_root_created
    }

    #[must_use]
    pub const fn public_root_available(self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn native_addon_loaded(self) -> bool {
        self.native_addon_loaded
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(self) -> bool {
        self.native_execution
    }

    #[must_use]
    pub const fn rust_execution_from_js(self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn host_output_produced_from_js(self) -> bool {
        self.host_output_produced_from_js
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateCreateRouteAdmissionDiagnostics {
    record_id: &'static str,
    diagnostic_name: &'static str,
    status: &'static str,
    root: FiberRootId,
    operation: &'static str,
    public_surface: &'static str,
    js_facade_metadata_source: &'static str,
    rust_admission_metadata: TestRendererPrivateCreateRouteAdmissionMetadata,
    root_create_preflight: TestRendererRootCreatePreflightDiagnostics,
    work_loop_finished_work_preflight: TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics,
    scheduled_update_kind: TestRendererRootUpdateKind,
    scheduled_element: RootElementHandle,
    rust_outcome: &'static str,
    consumes_js_facade_create_metadata: bool,
    consumes_accepted_rust_root_create_execution_evidence: bool,
    consumes_accepted_rust_root_create_preflight_diagnostics: bool,
    consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata: bool,
    missing_rust_admission_record_rejection: bool,
    stale_rust_admission_record_rejection: bool,
    public_renderer_root_created: bool,
    public_root_available: bool,
    public_create_behavior_available: bool,
    public_serialization_available: bool,
    native_addon_loaded: bool,
    native_bridge_available: bool,
    native_execution: bool,
    rust_execution_from_js: bool,
    reconciler_execution_from_js: bool,
    host_output_produced_from_js: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateCreateRouteAdmissionDiagnostics {
    #[must_use]
    pub const fn record_id(self) -> &'static str {
        self.record_id
    }

    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn js_facade_metadata_source(self) -> &'static str {
        self.js_facade_metadata_source
    }

    #[must_use]
    pub const fn rust_admission_metadata(self) -> TestRendererPrivateCreateRouteAdmissionMetadata {
        self.rust_admission_metadata
    }

    #[must_use]
    pub const fn root_create_preflight(self) -> TestRendererRootCreatePreflightDiagnostics {
        self.root_create_preflight
    }

    #[must_use]
    pub const fn work_loop_finished_work_preflight(
        self,
    ) -> TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
        self.work_loop_finished_work_preflight
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn scheduled_element(self) -> RootElementHandle {
        self.scheduled_element
    }

    #[must_use]
    pub const fn rust_outcome(self) -> &'static str {
        self.rust_outcome
    }

    #[must_use]
    pub const fn consumes_js_facade_create_metadata(self) -> bool {
        self.consumes_js_facade_create_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_rust_root_create_execution_evidence(self) -> bool {
        self.consumes_accepted_rust_root_create_execution_evidence
    }

    #[must_use]
    pub const fn consumes_accepted_rust_root_create_preflight_diagnostics(self) -> bool {
        self.consumes_accepted_rust_root_create_preflight_diagnostics
    }

    #[must_use]
    pub const fn consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata(
        self,
    ) -> bool {
        self.consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata
    }

    #[must_use]
    pub const fn missing_rust_admission_record_rejection(self) -> bool {
        self.missing_rust_admission_record_rejection
    }

    #[must_use]
    pub const fn stale_rust_admission_record_rejection(self) -> bool {
        self.stale_rust_admission_record_rejection
    }

    #[must_use]
    pub const fn public_renderer_root_created(self) -> bool {
        self.public_renderer_root_created
    }

    #[must_use]
    pub const fn public_root_available(self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_create_behavior_available(self) -> bool {
        self.public_create_behavior_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn native_addon_loaded(self) -> bool {
        self.native_addon_loaded
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(self) -> bool {
        self.native_execution
    }

    #[must_use]
    pub const fn rust_execution_from_js(self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn reconciler_execution_from_js(self) -> bool {
        self.reconciler_execution_from_js
    }

    #[must_use]
    pub const fn host_output_produced_from_js(self) -> bool {
        self.host_output_produced_from_js
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateCreateNativeBridgeHostOutputHandoff {
    diagnostic_id: &'static str,
    status: &'static str,
    root: FiberRootId,
    operation: &'static str,
    public_surface: &'static str,
    create_route_admission_record_id: &'static str,
    create_route_admission_status: &'static str,
    scheduled_update_kind: TestRendererRootUpdateKind,
    scheduled_element: RootElementHandle,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    host_output: TestRendererHostOutputDiagnostics,
    serialization_gate_status: TestRendererSerializationGateStatus,
    render_finished_work: TestRendererFiberHandleDiagnostics,
    commit_current: TestRendererFiberHandleDiagnostics,
    work_loop_finished_work_preflight: TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics,
    render_finished_work_matches_create_route_preflight: bool,
    commit_current_matches_render_finished_work: bool,
    minimal_tree_host_output_consumes_root_finished_work: bool,
    create_route_admission_accepted: bool,
    host_output_handoff_accepted: bool,
    actual_rust_create_host_output_handoff: bool,
    host_output_produced_by_rust: bool,
    public_create_behavior_available: bool,
    public_serialization_available: bool,
    public_test_instance_available: bool,
    native_addon_loaded: bool,
    native_bridge_available: bool,
    native_execution: bool,
    rust_execution_from_js: bool,
    host_output_produced_from_js: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateCreateNativeBridgeHostOutputHandoff {
    #[must_use]
    pub const fn diagnostic_id(self) -> &'static str {
        self.diagnostic_id
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn create_route_admission_record_id(self) -> &'static str {
        self.create_route_admission_record_id
    }

    #[must_use]
    pub const fn create_route_admission_status(self) -> &'static str {
        self.create_route_admission_status
    }

    #[must_use]
    pub const fn scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
    }

    #[must_use]
    pub const fn scheduled_element(self) -> RootElementHandle {
        self.scheduled_element
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn host_output(self) -> TestRendererHostOutputDiagnostics {
        self.host_output
    }

    #[must_use]
    pub const fn serialization_gate_status(self) -> TestRendererSerializationGateStatus {
        self.serialization_gate_status
    }

    #[must_use]
    pub const fn render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.render_finished_work
    }

    #[must_use]
    pub const fn commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_current
    }

    #[must_use]
    pub const fn work_loop_finished_work_preflight(
        self,
    ) -> TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
        self.work_loop_finished_work_preflight
    }

    #[must_use]
    pub const fn render_finished_work_matches_create_route_preflight(self) -> bool {
        self.render_finished_work_matches_create_route_preflight
    }

    #[must_use]
    pub const fn commit_current_matches_render_finished_work(self) -> bool {
        self.commit_current_matches_render_finished_work
    }

    #[must_use]
    pub const fn minimal_tree_host_output_consumes_root_finished_work(self) -> bool {
        self.minimal_tree_host_output_consumes_root_finished_work
    }

    #[must_use]
    pub const fn create_route_admission_accepted(self) -> bool {
        self.create_route_admission_accepted
    }

    #[must_use]
    pub const fn host_output_handoff_accepted(self) -> bool {
        self.host_output_handoff_accepted
    }

    #[must_use]
    pub const fn actual_rust_create_host_output_handoff(self) -> bool {
        self.actual_rust_create_host_output_handoff
    }

    #[must_use]
    pub const fn host_output_produced_by_rust(self) -> bool {
        self.host_output_produced_by_rust
    }

    #[must_use]
    pub const fn public_create_behavior_available(self) -> bool {
        self.public_create_behavior_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn native_addon_loaded(self) -> bool {
        self.native_addon_loaded
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(self) -> bool {
        self.native_execution
    }

    #[must_use]
    pub const fn rust_execution_from_js(self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn host_output_produced_from_js(self) -> bool {
        self.host_output_produced_from_js
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateErrorDiagnosticPhase {
    Update,
    Commit,
}

impl TestRendererPrivateErrorDiagnosticPhase {
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::Update => "Update",
            Self::Commit => "Commit",
        }
    }

    #[must_use]
    pub const fn row_id(self) -> &'static str {
        match self {
            Self::Update => "react-test-renderer-update-error-root-option-private-diagnostic",
            Self::Commit => "react-test-renderer-commit-error-root-option-private-diagnostic",
        }
    }

    #[must_use]
    pub const fn react_reference(self) -> &'static str {
        match self {
            Self::Update => "ReactTestRenderer.js update -> updateContainer",
            Self::Commit => "ReactFiberWorkLoop.captureCommitPhaseError",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootErrorOptionDiagnostics {
    on_uncaught_error: RootErrorCallbackHandle,
    on_caught_error: RootErrorCallbackHandle,
    on_recoverable_error: RootRecoverableErrorCallbackHandle,
    root_error_option_metadata_available: bool,
    public_root_error_callbacks_invoked: bool,
    public_error_boundary_behavior_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererRootErrorOptionDiagnostics {
    #[must_use]
    pub const fn on_uncaught_error(self) -> RootErrorCallbackHandle {
        self.on_uncaught_error
    }

    #[must_use]
    pub const fn on_caught_error(self) -> RootErrorCallbackHandle {
        self.on_caught_error
    }

    #[must_use]
    pub const fn on_recoverable_error(self) -> RootRecoverableErrorCallbackHandle {
        self.on_recoverable_error
    }

    #[must_use]
    pub const fn root_error_option_metadata_available(self) -> bool {
        self.root_error_option_metadata_available
    }

    #[must_use]
    pub const fn has_configured_error_callback(self) -> bool {
        self.on_uncaught_error.is_some()
            || self.on_caught_error.is_some()
            || self.on_recoverable_error.is_some()
    }

    #[must_use]
    pub const fn public_root_error_callbacks_invoked(self) -> bool {
        self.public_root_error_callbacks_invoked
    }

    #[must_use]
    pub const fn public_error_boundary_behavior_available(self) -> bool {
        self.public_error_boundary_behavior_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateErrorBoundaryDependencyDiagnostics {
    update_route_diagnostics_available: bool,
    serialization_diagnostics_available: bool,
    test_instance_query_diagnostics_available: bool,
    act_scheduler_metadata_available: bool,
    public_renderer_roots_executed: bool,
    public_lifecycle_methods_executed: bool,
    error_boundary_recovery_executed: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateErrorBoundaryDependencyDiagnostics {
    const fn root_options_only() -> Self {
        Self {
            update_route_diagnostics_available: false,
            serialization_diagnostics_available: false,
            test_instance_query_diagnostics_available: false,
            act_scheduler_metadata_available: false,
            public_renderer_roots_executed: false,
            public_lifecycle_methods_executed: false,
            error_boundary_recovery_executed: false,
            compatibility_claimed: false,
        }
    }

    #[must_use]
    pub const fn update_route_diagnostics_available(self) -> bool {
        self.update_route_diagnostics_available
    }

    #[must_use]
    pub const fn serialization_diagnostics_available(self) -> bool {
        self.serialization_diagnostics_available
    }

    #[must_use]
    pub const fn test_instance_query_diagnostics_available(self) -> bool {
        self.test_instance_query_diagnostics_available
    }

    #[must_use]
    pub const fn act_scheduler_metadata_available(self) -> bool {
        self.act_scheduler_metadata_available
    }

    #[must_use]
    pub const fn public_renderer_roots_executed(self) -> bool {
        self.public_renderer_roots_executed
    }

    #[must_use]
    pub const fn public_lifecycle_methods_executed(self) -> bool {
        self.public_lifecycle_methods_executed
    }

    #[must_use]
    pub const fn error_boundary_recovery_executed(self) -> bool {
        self.error_boundary_recovery_executed
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub const fn update_commit_rows_ready(self) -> bool {
        self.update_route_diagnostics_available
            && self.serialization_diagnostics_available
            && self.test_instance_query_diagnostics_available
            && self.act_scheduler_metadata_available
            && !self.public_renderer_roots_executed
            && !self.public_lifecycle_methods_executed
            && !self.error_boundary_recovery_executed
            && !self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateErrorDiagnosticRow {
    id: &'static str,
    diagnostic_name: &'static str,
    status: &'static str,
    phase: TestRendererPrivateErrorDiagnosticPhase,
    host_output_update_kind: TestRendererRootUpdateKind,
    root: FiberRootId,
    root_error_channel: &'static str,
    root_error_options: TestRendererRootErrorOptionDiagnostics,
    dependency_diagnostics: TestRendererPrivateErrorBoundaryDependencyDiagnostics,
    react_reference: &'static str,
    root_error_update_scheduled: bool,
    public_root_error_callbacks_invoked: bool,
    public_error_boundary_behavior_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateErrorDiagnosticRow {
    #[must_use]
    pub const fn id(self) -> &'static str {
        self.id
    }

    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn phase(self) -> TestRendererPrivateErrorDiagnosticPhase {
        self.phase
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn root_error_channel(self) -> &'static str {
        self.root_error_channel
    }

    #[must_use]
    pub const fn root_error_options(self) -> TestRendererRootErrorOptionDiagnostics {
        self.root_error_options
    }

    #[must_use]
    pub const fn dependency_diagnostics(
        self,
    ) -> TestRendererPrivateErrorBoundaryDependencyDiagnostics {
        self.dependency_diagnostics
    }

    #[must_use]
    pub const fn react_reference(self) -> &'static str {
        self.react_reference
    }

    #[must_use]
    pub const fn root_error_update_scheduled(self) -> bool {
        self.root_error_update_scheduled
    }

    #[must_use]
    pub const fn public_root_error_callbacks_invoked(self) -> bool {
        self.public_root_error_callbacks_invoked
    }

    #[must_use]
    pub const fn public_error_boundary_behavior_available(self) -> bool {
        self.public_error_boundary_behavior_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateErrorBoundaryDiagnostics {
    diagnostic_name: &'static str,
    status: &'static str,
    root: FiberRootId,
    host_output_update_kind: TestRendererRootUpdateKind,
    root_error_options: TestRendererRootErrorOptionDiagnostics,
    dependency_diagnostics: TestRendererPrivateErrorBoundaryDependencyDiagnostics,
    rows: [TestRendererPrivateErrorDiagnosticRow; 2],
    public_error_boundary_behavior_available: bool,
    public_root_error_callbacks_invoked: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateErrorBoundaryDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn root_error_options(self) -> TestRendererRootErrorOptionDiagnostics {
        self.root_error_options
    }

    #[must_use]
    pub const fn dependency_diagnostics(
        self,
    ) -> TestRendererPrivateErrorBoundaryDependencyDiagnostics {
        self.dependency_diagnostics
    }

    #[must_use]
    pub const fn rows(&self) -> &[TestRendererPrivateErrorDiagnosticRow; 2] {
        &self.rows
    }

    #[must_use]
    pub const fn public_error_boundary_behavior_available(self) -> bool {
        self.public_error_boundary_behavior_available
    }

    #[must_use]
    pub const fn public_root_error_callbacks_invoked(self) -> bool {
        self.public_root_error_callbacks_invoked
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateErrorBoundaryCommitRecoveryMetadata {
    diagnostic_name: &'static str,
    status: &'static str,
    accepted_rust_api: &'static str,
    root: FiberRootId,
    operation: &'static str,
    update_failure_path: &'static str,
    commit_phase_recovery_path: &'static str,
    commit_phase_recovery_action: &'static str,
    react_reference: &'static str,
    source_update_record: &'static str,
    source_update_record_id: &'static str,
    source_update_record_status: &'static str,
    source_update_kind: TestRendererRootUpdateKind,
    source_failure_record: &'static str,
    source_commit_recovery_snapshot_record: &'static str,
    root_error_options: TestRendererRootErrorOptionDiagnostics,
    consumes_accepted_rust_update_metadata: bool,
    consumes_accepted_rust_failure_metadata: bool,
    consumes_accepted_commit_recovery_snapshot: bool,
    preserves_root_error_option_handles: bool,
    commit_phase_recovery_path_consumed: bool,
    root_error_update_scheduled: bool,
    public_root_error_callbacks_invoked: bool,
    public_error_boundary_behavior_available: bool,
    public_error_recovery_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateErrorBoundaryCommitRecoveryMetadata {
    fn from_update_execution_for_canary(
        root: FiberRootId,
        execution: TestRendererUpdateNativeBridgeAdmission,
        root_error_options: TestRendererRootErrorOptionDiagnostics,
    ) -> Self {
        Self {
            diagnostic_name: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_STATUS,
            accepted_rust_api: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_API,
            root,
            operation: "update",
            update_failure_path: "commit",
            commit_phase_recovery_path: "ReactFiberWorkLoop.captureCommitPhaseError",
            commit_phase_recovery_action: "createRootErrorUpdate(SyncLane)",
            react_reference: "ReactFiberWorkLoop.captureCommitPhaseError -> createRootErrorUpdate(SyncLane)",
            source_update_record: "TestRendererUpdateNativeBridgeAdmission",
            source_update_record_id: execution.diagnostic_id(),
            source_update_record_status: execution.status(),
            source_update_kind: execution.scheduled_update_kind(),
            source_failure_record: "HostRootRenderFailureRecoveryCommitEvidenceForCanary",
            source_commit_recovery_snapshot_record: "HostRootCommitRecoverySnapshotForCanary",
            root_error_options,
            consumes_accepted_rust_update_metadata: true,
            consumes_accepted_rust_failure_metadata: true,
            consumes_accepted_commit_recovery_snapshot: true,
            preserves_root_error_option_handles: true,
            commit_phase_recovery_path_consumed: true,
            root_error_update_scheduled: false,
            public_root_error_callbacks_invoked: false,
            public_error_boundary_behavior_available: false,
            public_error_recovery_available: false,
            compatibility_claimed: false,
        }
    }

    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn accepted_rust_api(self) -> &'static str {
        self.accepted_rust_api
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn update_failure_path(self) -> &'static str {
        self.update_failure_path
    }

    #[must_use]
    pub const fn commit_phase_recovery_path(self) -> &'static str {
        self.commit_phase_recovery_path
    }

    #[must_use]
    pub const fn commit_phase_recovery_action(self) -> &'static str {
        self.commit_phase_recovery_action
    }

    #[must_use]
    pub const fn react_reference(self) -> &'static str {
        self.react_reference
    }

    #[must_use]
    pub const fn source_update_record(self) -> &'static str {
        self.source_update_record
    }

    #[must_use]
    pub const fn source_update_record_id(self) -> &'static str {
        self.source_update_record_id
    }

    #[must_use]
    pub const fn source_update_record_status(self) -> &'static str {
        self.source_update_record_status
    }

    #[must_use]
    pub const fn source_update_kind(self) -> TestRendererRootUpdateKind {
        self.source_update_kind
    }

    #[must_use]
    pub const fn source_failure_record(self) -> &'static str {
        self.source_failure_record
    }

    #[must_use]
    pub const fn source_commit_recovery_snapshot_record(self) -> &'static str {
        self.source_commit_recovery_snapshot_record
    }

    #[must_use]
    pub const fn root_error_options(self) -> TestRendererRootErrorOptionDiagnostics {
        self.root_error_options
    }

    #[must_use]
    pub const fn consumes_accepted_rust_update_metadata(self) -> bool {
        self.consumes_accepted_rust_update_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_rust_failure_metadata(self) -> bool {
        self.consumes_accepted_rust_failure_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_commit_recovery_snapshot(self) -> bool {
        self.consumes_accepted_commit_recovery_snapshot
    }

    #[must_use]
    pub const fn preserves_root_error_option_handles(self) -> bool {
        self.preserves_root_error_option_handles
    }

    #[must_use]
    pub const fn commit_phase_recovery_path_consumed(self) -> bool {
        self.commit_phase_recovery_path_consumed
    }

    #[must_use]
    pub const fn root_error_update_scheduled(self) -> bool {
        self.root_error_update_scheduled
    }

    #[must_use]
    pub const fn public_root_error_callbacks_invoked(self) -> bool {
        self.public_root_error_callbacks_invoked
    }

    #[must_use]
    pub const fn public_error_boundary_behavior_available(self) -> bool {
        self.public_error_boundary_behavior_available
    }

    #[must_use]
    pub const fn public_error_recovery_available(self) -> bool {
        self.public_error_recovery_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub fn accepted_private_commit_phase_recovery_metadata(self) -> bool {
        self.root_error_options
            .root_error_option_metadata_available()
            && self.root_error_options.has_configured_error_callback()
            && self.source_update_record_id
                == TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
            && self.source_update_record_status
                == TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
            && matches!(self.source_update_kind, TestRendererRootUpdateKind::Update)
            && self.consumes_accepted_rust_update_metadata
            && self.consumes_accepted_rust_failure_metadata
            && self.consumes_accepted_commit_recovery_snapshot
            && self.preserves_root_error_option_handles
            && self.commit_phase_recovery_path_consumed
            && !self.root_error_update_scheduled
            && !self.public_root_error_callbacks_invoked
            && !self.public_error_boundary_behavior_available
            && !self.public_error_recovery_available
            && !self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateErrorBoundaryNativeExecutionEvidence {
    diagnostic_name: &'static str,
    status: &'static str,
    root: FiberRootId,
    operation: &'static str,
    public_surface: &'static str,
    update_failure_path: &'static str,
    source_execution_record_id: &'static str,
    source_execution_status: &'static str,
    source_execution_scheduled_update_kind: TestRendererRootUpdateKind,
    host_output_update_kind: TestRendererRootUpdateKind,
    error_diagnostics: TestRendererPrivateErrorBoundaryDiagnostics,
    commit_recovery_metadata: TestRendererPrivateErrorBoundaryCommitRecoveryMetadata,
    rows: [TestRendererPrivateErrorDiagnosticRow; 2],
    row_count: usize,
    consumes_accepted_root_execution_diagnostics: bool,
    consumes_accepted_native_update_execution_record: bool,
    consumes_private_error_boundary_diagnostics: bool,
    consumes_private_commit_recovery_metadata: bool,
    consumes_accepted_rust_failure_metadata: bool,
    preserves_root_error_option_handles: bool,
    consumes_update_error_row: bool,
    consumes_commit_error_row: bool,
    root_error_update_scheduled: bool,
    public_root_error_callbacks_invoked: bool,
    public_error_boundary_behavior_available: bool,
    error_boundary_recovery_executed: bool,
    public_error_recovery_available: bool,
    public_commit_phase_recovery_available: bool,
    native_bridge_available: bool,
    native_execution_available: bool,
    rust_execution_from_js: bool,
    reconciler_execution_from_js: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateErrorBoundaryNativeExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn update_failure_path(self) -> &'static str {
        self.update_failure_path
    }

    #[must_use]
    pub const fn source_execution_record_id(self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_execution_scheduled_update_kind(self) -> TestRendererRootUpdateKind {
        self.source_execution_scheduled_update_kind
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn error_diagnostics(self) -> TestRendererPrivateErrorBoundaryDiagnostics {
        self.error_diagnostics
    }

    #[must_use]
    pub const fn commit_recovery_metadata(
        self,
    ) -> TestRendererPrivateErrorBoundaryCommitRecoveryMetadata {
        self.commit_recovery_metadata
    }

    #[must_use]
    pub const fn rows(&self) -> &[TestRendererPrivateErrorDiagnosticRow; 2] {
        &self.rows
    }

    #[must_use]
    pub const fn row_count(self) -> usize {
        self.row_count
    }

    #[must_use]
    pub const fn consumes_accepted_root_execution_diagnostics(self) -> bool {
        self.consumes_accepted_root_execution_diagnostics
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_private_error_boundary_diagnostics(self) -> bool {
        self.consumes_private_error_boundary_diagnostics
    }

    #[must_use]
    pub const fn consumes_private_commit_recovery_metadata(self) -> bool {
        self.consumes_private_commit_recovery_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_rust_failure_metadata(self) -> bool {
        self.consumes_accepted_rust_failure_metadata
    }

    #[must_use]
    pub const fn preserves_root_error_option_handles(self) -> bool {
        self.preserves_root_error_option_handles
    }

    #[must_use]
    pub const fn consumes_update_error_row(self) -> bool {
        self.consumes_update_error_row
    }

    #[must_use]
    pub const fn consumes_commit_error_row(self) -> bool {
        self.consumes_commit_error_row
    }

    #[must_use]
    pub const fn root_error_update_scheduled(self) -> bool {
        self.root_error_update_scheduled
    }

    #[must_use]
    pub const fn public_root_error_callbacks_invoked(self) -> bool {
        self.public_root_error_callbacks_invoked
    }

    #[must_use]
    pub const fn public_error_boundary_behavior_available(self) -> bool {
        self.public_error_boundary_behavior_available
    }

    #[must_use]
    pub const fn error_boundary_recovery_executed(self) -> bool {
        self.error_boundary_recovery_executed
    }

    #[must_use]
    pub const fn public_error_recovery_available(self) -> bool {
        self.public_error_recovery_available
    }

    #[must_use]
    pub const fn public_commit_phase_recovery_available(self) -> bool {
        self.public_commit_phase_recovery_available
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn rust_execution_from_js(self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn reconciler_execution_from_js(self) -> bool {
        self.reconciler_execution_from_js
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

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
    pub const fn from_raw_parts_for_canary(arena_id: u64, slot: usize, generation: u64) -> Self {
        Self {
            arena_id,
            slot,
            generation,
        }
    }

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
pub struct TestRendererPrivateActPendingPassiveFlushMetadata {
    root: FiberRootId,
    finished_work: TestRendererFiberHandleDiagnostics,
    pending_unmount_count: usize,
    pending_mount_count: usize,
    scheduler_request_order: usize,
    scheduler_priority: &'static str,
}

impl TestRendererPrivateActPendingPassiveFlushMetadata {
    #[must_use]
    pub const fn new_for_canary(
        root: FiberRootId,
        finished_work: TestRendererFiberHandleDiagnostics,
        pending_unmount_count: usize,
        pending_mount_count: usize,
    ) -> Self {
        Self {
            root,
            finished_work,
            pending_unmount_count,
            pending_mount_count,
            scheduler_request_order: 0,
            scheduler_priority: "Normal",
        }
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.finished_work
    }

    #[must_use]
    pub const fn pending_unmount_count(self) -> usize {
        self.pending_unmount_count
    }

    #[must_use]
    pub const fn pending_mount_count(self) -> usize {
        self.pending_mount_count
    }

    #[must_use]
    pub const fn pending_record_count(self) -> usize {
        self.pending_unmount_count + self.pending_mount_count
    }

    #[must_use]
    pub const fn scheduler_request_order(self) -> usize {
        self.scheduler_request_order
    }

    #[must_use]
    pub const fn scheduler_priority(self) -> &'static str {
        self.scheduler_priority
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateActPassiveEffectDrainDiagnostics {
    diagnostic_name: &'static str,
    status: &'static str,
    accepted_reconciler_records: [&'static str; 5],
    metadata: TestRendererPrivateActPendingPassiveFlushMetadata,
    metadata_root_matches_renderer_root: bool,
    consumes_pending_passive_flush_metadata: bool,
    consumes_accepted_scheduler_flush_metadata: bool,
    private_scheduler_flush_request_metadata_consumed: bool,
    consumes_accepted_native_update_execution: bool,
    private_update_native_bridge_admission: Option<TestRendererUpdateNativeBridgeAdmission>,
    host_output_produced_from_native_update: bool,
    executes_passive_effects: bool,
    invokes_effect_callbacks: bool,
    invokes_act_callback: bool,
    public_update_compatibility_claimed: bool,
    public_act_compatibility_claimed: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateActPassiveEffectDrainDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn accepted_reconciler_records(&self) -> &[&'static str; 5] {
        &self.accepted_reconciler_records
    }

    #[must_use]
    pub const fn metadata(&self) -> TestRendererPrivateActPendingPassiveFlushMetadata {
        self.metadata
    }

    #[must_use]
    pub const fn metadata_root_matches_renderer_root(&self) -> bool {
        self.metadata_root_matches_renderer_root
    }

    #[must_use]
    pub const fn consumes_pending_passive_flush_metadata(&self) -> bool {
        self.consumes_pending_passive_flush_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_scheduler_flush_metadata(&self) -> bool {
        self.consumes_accepted_scheduler_flush_metadata
    }

    #[must_use]
    pub const fn private_scheduler_flush_request_metadata_consumed(&self) -> bool {
        self.private_scheduler_flush_request_metadata_consumed
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution(&self) -> bool {
        self.consumes_accepted_native_update_execution
    }

    #[must_use]
    pub const fn private_update_native_bridge_admission(
        &self,
    ) -> Option<TestRendererUpdateNativeBridgeAdmission> {
        self.private_update_native_bridge_admission
    }

    #[must_use]
    pub const fn host_output_produced_from_native_update(&self) -> bool {
        self.host_output_produced_from_native_update
    }

    #[must_use]
    pub const fn executes_passive_effects(&self) -> bool {
        self.executes_passive_effects
    }

    #[must_use]
    pub const fn invokes_effect_callbacks(&self) -> bool {
        self.invokes_effect_callbacks
    }

    #[must_use]
    pub const fn invokes_act_callback(&self) -> bool {
        self.invokes_act_callback
    }

    #[must_use]
    pub const fn public_update_compatibility_claimed(&self) -> bool {
        self.public_update_compatibility_claimed
    }

    #[must_use]
    pub const fn public_act_compatibility_claimed(&self) -> bool {
        self.public_act_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateActNestedScopePassiveFlushDiagnostics {
    diagnostic_name: &'static str,
    status: &'static str,
    passive_drain: TestRendererPrivateActPassiveEffectDrainDiagnostics,
    flush_order: [&'static str; 5],
    outer_scope_depth: usize,
    inner_scope_depth: usize,
    passive_flush_order_index: usize,
    pending_unmount_count: usize,
    pending_mount_count: usize,
    pending_passive_record_count: usize,
    nested_scope_metadata_accepted: bool,
    private_passive_flush_metadata_accepted: bool,
    drains_accepted_pending_passive_flush_metadata: bool,
    deterministic_flush_order: bool,
    public_act_scope_depth_tracking_available: bool,
    public_nested_act_queue_reuse_available: bool,
    public_overlapping_act_warning_emission_available: bool,
    invokes_act_callback: bool,
    executes_passive_effects: bool,
    invokes_effect_callbacks: bool,
    public_act_compatibility_claimed: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateActNestedScopePassiveFlushDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn passive_drain(&self) -> &TestRendererPrivateActPassiveEffectDrainDiagnostics {
        &self.passive_drain
    }

    #[must_use]
    pub const fn flush_order(&self) -> &[&'static str; 5] {
        &self.flush_order
    }

    #[must_use]
    pub const fn outer_scope_depth(&self) -> usize {
        self.outer_scope_depth
    }

    #[must_use]
    pub const fn inner_scope_depth(&self) -> usize {
        self.inner_scope_depth
    }

    #[must_use]
    pub const fn passive_flush_order_index(&self) -> usize {
        self.passive_flush_order_index
    }

    #[must_use]
    pub const fn pending_unmount_count(&self) -> usize {
        self.pending_unmount_count
    }

    #[must_use]
    pub const fn pending_mount_count(&self) -> usize {
        self.pending_mount_count
    }

    #[must_use]
    pub const fn pending_passive_record_count(&self) -> usize {
        self.pending_passive_record_count
    }

    #[must_use]
    pub const fn nested_scope_metadata_accepted(&self) -> bool {
        self.nested_scope_metadata_accepted
    }

    #[must_use]
    pub const fn private_passive_flush_metadata_accepted(&self) -> bool {
        self.private_passive_flush_metadata_accepted
    }

    #[must_use]
    pub const fn drains_accepted_pending_passive_flush_metadata(&self) -> bool {
        self.drains_accepted_pending_passive_flush_metadata
    }

    #[must_use]
    pub const fn deterministic_flush_order(&self) -> bool {
        self.deterministic_flush_order
    }

    #[must_use]
    pub const fn public_act_scope_depth_tracking_available(&self) -> bool {
        self.public_act_scope_depth_tracking_available
    }

    #[must_use]
    pub const fn public_nested_act_queue_reuse_available(&self) -> bool {
        self.public_nested_act_queue_reuse_available
    }

    #[must_use]
    pub const fn public_overlapping_act_warning_emission_available(&self) -> bool {
        self.public_overlapping_act_warning_emission_available
    }

    #[must_use]
    pub const fn invokes_act_callback(&self) -> bool {
        self.invokes_act_callback
    }

    #[must_use]
    pub const fn executes_passive_effects(&self) -> bool {
        self.executes_passive_effects
    }

    #[must_use]
    pub const fn invokes_effect_callbacks(&self) -> bool {
        self.invokes_effect_callbacks
    }

    #[must_use]
    pub const fn public_act_compatibility_claimed(&self) -> bool {
        self.public_act_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
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
pub struct TestRendererPrivateToJsonHostOutputDependencyDiagnostics {
    route_row_id: &'static str,
    serialization_row_id: &'static str,
    route_diagnostics_available: bool,
    serialization_diagnostics_available: bool,
    host_output_snapshot_current: bool,
    public_to_json_available: bool,
    public_test_instance_available: bool,
    native_execution_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonHostOutputDependencyDiagnostics {
    #[must_use]
    pub const fn route_row_id(self) -> &'static str {
        self.route_row_id
    }

    #[must_use]
    pub const fn serialization_row_id(self) -> &'static str {
        self.serialization_row_id
    }

    #[must_use]
    pub const fn route_diagnostics_available(self) -> bool {
        self.route_diagnostics_available
    }

    #[must_use]
    pub const fn serialization_diagnostics_available(self) -> bool {
        self.serialization_diagnostics_available
    }

    #[must_use]
    pub const fn host_output_snapshot_current(self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub const fn public_surfaces_blocked(self) -> bool {
        !self.public_to_json_available
            && !self.public_test_instance_available
            && !self.native_execution_available
            && !self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateToJsonHostOutputShape {
    EmptyRoot,
    SingleHostText,
    NestedHostText,
    SiblingText,
}

impl TestRendererPrivateToJsonHostOutputShape {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::EmptyRoot => "EmptyRoot",
            Self::SingleHostText => "SingleHostText",
            Self::NestedHostText => "NestedHostText",
            Self::SiblingText => "SiblingText",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonHostOutputShapeDiagnostics {
    shape: TestRendererPrivateToJsonHostOutputShape,
    host_component_count: usize,
    host_text_count: usize,
    root_text_count: usize,
    max_host_component_depth: usize,
}

impl TestRendererPrivateToJsonHostOutputShapeDiagnostics {
    #[must_use]
    pub const fn shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.shape
    }

    #[must_use]
    pub const fn host_component_count(self) -> usize {
        self.host_component_count
    }

    #[must_use]
    pub const fn host_text_count(self) -> usize {
        self.host_text_count
    }

    #[must_use]
    pub const fn root_text_count(self) -> usize {
        self.root_text_count
    }

    #[must_use]
    pub const fn max_host_component_depth(self) -> usize {
        self.max_host_component_depth
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonHostOutputRow {
    id: &'static str,
    diagnostic_name: &'static str,
    status: &'static str,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    previous_root_child_count: usize,
    current_root_child_count: usize,
    previous_host_component_count: usize,
    current_host_component_count: usize,
    previous_host_text_count: usize,
    current_host_text_count: usize,
    current_root_text_count: usize,
    current_max_host_component_depth: usize,
    dependency_diagnostics: TestRendererPrivateToJsonHostOutputDependencyDiagnostics,
    public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
}

impl TestRendererPrivateToJsonHostOutputRow {
    #[must_use]
    pub const fn id(self) -> &'static str {
        self.id
    }

    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn previous_root_child_count(self) -> usize {
        self.previous_root_child_count
    }

    #[must_use]
    pub const fn current_root_child_count(self) -> usize {
        self.current_root_child_count
    }

    #[must_use]
    pub const fn previous_host_component_count(self) -> usize {
        self.previous_host_component_count
    }

    #[must_use]
    pub const fn current_host_component_count(self) -> usize {
        self.current_host_component_count
    }

    #[must_use]
    pub const fn previous_host_text_count(self) -> usize {
        self.previous_host_text_count
    }

    #[must_use]
    pub const fn current_host_text_count(self) -> usize {
        self.current_host_text_count
    }

    #[must_use]
    pub const fn current_root_text_count(self) -> usize {
        self.current_root_text_count
    }

    #[must_use]
    pub const fn current_max_host_component_depth(self) -> usize {
        self.current_max_host_component_depth
    }

    #[must_use]
    pub const fn dependency_diagnostics(
        self,
    ) -> TestRendererPrivateToJsonHostOutputDependencyDiagnostics {
        self.dependency_diagnostics
    }

    #[must_use]
    pub const fn public_blockers(self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
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
pub enum TestRendererPrivateJsonRenderedRoot {
    Null,
    Text(String),
    HostComponent(TestRendererPrivateJsonRenderedHostComponent),
    Array(Vec<TestRendererPrivateJsonRenderedRoot>),
}

impl TestRendererPrivateJsonRenderedRoot {
    #[must_use]
    pub const fn is_null(&self) -> bool {
        matches!(self, Self::Null)
    }

    #[must_use]
    pub fn as_text(&self) -> Option<&str> {
        match self {
            Self::Text(text) => Some(text),
            Self::Null | Self::HostComponent(_) | Self::Array(_) => None,
        }
    }

    #[must_use]
    pub const fn as_host_component(&self) -> Option<&TestRendererPrivateJsonRenderedHostComponent> {
        match self {
            Self::HostComponent(component) => Some(component),
            Self::Null | Self::Text(_) | Self::Array(_) => None,
        }
    }

    #[must_use]
    pub fn as_array(&self) -> Option<&[TestRendererPrivateJsonRenderedRoot]> {
        match self {
            Self::Array(children) => Some(children),
            Self::Null | Self::Text(_) | Self::HostComponent(_) => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonRenderedHostComponent {
    element_type: TestElementType,
    props: BTreeMap<String, String>,
    children: Option<Vec<TestRendererPrivateJsonRenderedRoot>>,
}

impl TestRendererPrivateJsonRenderedHostComponent {
    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &BTreeMap<String, String> {
        &self.props
    }

    #[must_use]
    pub fn children(&self) -> Option<&[TestRendererPrivateJsonRenderedRoot]> {
        self.children.as_deref()
    }

    #[must_use]
    pub fn child_count(&self) -> usize {
        self.children.as_ref().map_or(0, Vec::len)
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
    host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    host_output_snapshot_current: bool,
    element_type: TestElementType,
    props: TestProps,
    children: Vec<String>,
    rendered_root: TestRendererPrivateJsonRenderedRoot,
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
    pub const fn host_output_shape(&self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn host_output_row(&self) -> Option<TestRendererPrivateToJsonHostOutputRow> {
        self.host_output_row
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
    pub const fn rendered_root(&self) -> &TestRendererPrivateJsonRenderedRoot {
        &self.rendered_root
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
pub struct TestRendererPrivateToJsonNativeExecutionEvidence {
    diagnostic_name: &'static str,
    status: &'static str,
    root: FiberRootId,
    operation: &'static str,
    public_surface: &'static str,
    source_execution_record_id: &'static str,
    source_execution_status: &'static str,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    rendered_root: TestRendererPrivateJsonRenderedRoot,
    source_node_count: usize,
    root_child_count: usize,
    consumes_accepted_native_create_execution_record: bool,
    consumes_accepted_native_update_execution_record: bool,
    consumes_accepted_native_unmount_execution_record: bool,
    consumes_private_to_json_evidence: bool,
    consumes_accepted_host_output_row: bool,
    minimal_tree_shape: bool,
    public_to_json_available: bool,
    public_serialization_available: bool,
    public_route_available: bool,
    native_bridge_available: bool,
    native_execution_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonNativeExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(&self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(&self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(&self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(&self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn host_output_row(&self) -> Option<TestRendererPrivateToJsonHostOutputRow> {
        self.host_output_row
    }

    #[must_use]
    pub const fn rendered_root(&self) -> &TestRendererPrivateJsonRenderedRoot {
        &self.rendered_root
    }

    #[must_use]
    pub const fn source_node_count(&self) -> usize {
        self.source_node_count
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn consumes_accepted_native_create_execution_record(&self) -> bool {
        self.consumes_accepted_native_create_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(&self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_unmount_execution_record(&self) -> bool {
        self.consumes_accepted_native_unmount_execution_record
    }

    #[must_use]
    pub const fn consumes_private_to_json_evidence(&self) -> bool {
        self.consumes_private_to_json_evidence
    }

    #[must_use]
    pub const fn consumes_accepted_host_output_row(&self) -> bool {
        self.consumes_accepted_host_output_row
    }

    #[must_use]
    pub const fn minimal_tree_shape(&self) -> bool {
        self.minimal_tree_shape
    }

    #[must_use]
    pub const fn public_to_json_available(&self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(&self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateToTreeNativeExecutionEvidence {
    diagnostic_name: &'static str,
    status: &'static str,
    root: FiberRootId,
    operation: &'static str,
    public_surface: &'static str,
    source_execution_record_id: &'static str,
    source_execution_status: &'static str,
    source_tree_diagnostic_name: &'static str,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    rendered_root: TestRendererPrivateTreeRenderedRoot,
    source_fiber_count: usize,
    root_child_count: usize,
    consumes_accepted_native_create_execution_record: bool,
    consumes_accepted_native_update_execution_record: bool,
    consumes_accepted_native_unmount_execution_record: bool,
    consumes_private_to_tree_evidence: bool,
    consumes_accepted_host_output_row: bool,
    minimal_tree_shape: bool,
    function_component_above_host_output_shape: bool,
    public_to_tree_available: bool,
    public_serialization_available: bool,
    public_route_available: bool,
    native_bridge_available: bool,
    native_execution_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateToTreeNativeExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(&self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(&self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(&self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_tree_diagnostic_name(&self) -> &'static str {
        self.source_tree_diagnostic_name
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(&self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn host_output_row(&self) -> Option<TestRendererPrivateToJsonHostOutputRow> {
        self.host_output_row
    }

    #[must_use]
    pub const fn rendered_root(&self) -> &TestRendererPrivateTreeRenderedRoot {
        &self.rendered_root
    }

    #[must_use]
    pub const fn source_fiber_count(&self) -> usize {
        self.source_fiber_count
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn consumes_accepted_native_create_execution_record(&self) -> bool {
        self.consumes_accepted_native_create_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(&self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_unmount_execution_record(&self) -> bool {
        self.consumes_accepted_native_unmount_execution_record
    }

    #[must_use]
    pub const fn consumes_private_to_tree_evidence(&self) -> bool {
        self.consumes_private_to_tree_evidence
    }

    #[must_use]
    pub const fn consumes_accepted_host_output_row(&self) -> bool {
        self.consumes_accepted_host_output_row
    }

    #[must_use]
    pub const fn minimal_tree_shape(&self) -> bool {
        self.minimal_tree_shape
    }

    #[must_use]
    pub const fn function_component_above_host_output_shape(&self) -> bool {
        self.function_component_above_host_output_shape
    }

    #[must_use]
    pub const fn public_to_tree_available(&self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(&self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
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
    host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
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
    pub const fn host_output_shape(&self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn host_output_row(&self) -> Option<TestRendererPrivateToJsonHostOutputRow> {
        self.host_output_row
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
    Component,
    Host,
}

impl TestRendererPrivateTreeNodeType {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Component => "component",
            Self::Host => "host",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateTreeRenderedRoot {
    Null,
    Text(String),
    HostComponent(TestRendererPrivateTreeRenderedHostComponent),
    Array(Vec<TestRendererPrivateTreeRenderedRoot>),
    FunctionComponent(Box<TestRendererPrivateTreeRenderedFunctionComponent>),
}

impl TestRendererPrivateTreeRenderedRoot {
    #[must_use]
    pub const fn is_null(&self) -> bool {
        matches!(self, Self::Null)
    }

    #[must_use]
    pub fn as_text(&self) -> Option<&str> {
        match self {
            Self::Text(text) => Some(text),
            Self::Null | Self::HostComponent(_) | Self::Array(_) | Self::FunctionComponent(_) => {
                None
            }
        }
    }

    #[must_use]
    pub const fn as_host_component(&self) -> Option<&TestRendererPrivateTreeRenderedHostComponent> {
        match self {
            Self::HostComponent(component) => Some(component),
            Self::Null | Self::Text(_) | Self::Array(_) | Self::FunctionComponent(_) => None,
        }
    }

    #[must_use]
    pub fn as_array(&self) -> Option<&[TestRendererPrivateTreeRenderedRoot]> {
        match self {
            Self::Array(children) => Some(children),
            Self::Null | Self::Text(_) | Self::HostComponent(_) | Self::FunctionComponent(_) => {
                None
            }
        }
    }

    #[must_use]
    pub const fn as_function_component(
        &self,
    ) -> Option<&TestRendererPrivateTreeRenderedFunctionComponent> {
        match self {
            Self::FunctionComponent(component) => Some(component),
            Self::Null | Self::Text(_) | Self::HostComponent(_) | Self::Array(_) => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeRenderedHostComponent {
    node_type: TestRendererPrivateTreeNodeType,
    element_type: TestElementType,
    props: BTreeMap<String, String>,
    instance_available: bool,
    rendered: Vec<TestRendererPrivateTreeRenderedRoot>,
}

impl TestRendererPrivateTreeRenderedHostComponent {
    #[must_use]
    pub const fn node_type(&self) -> TestRendererPrivateTreeNodeType {
        self.node_type
    }

    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &BTreeMap<String, String> {
        &self.props
    }

    #[must_use]
    pub const fn instance_available(&self) -> bool {
        self.instance_available
    }

    #[must_use]
    pub fn rendered(&self) -> &[TestRendererPrivateTreeRenderedRoot] {
        &self.rendered
    }

    #[must_use]
    pub fn rendered_child_count(&self) -> usize {
        self.rendered.len()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTreeRenderedFunctionComponent {
    node_type: TestRendererPrivateTreeNodeType,
    component_type: &'static str,
    props: TestProps,
    instance_available: bool,
    rendered: Box<TestRendererPrivateTreeRenderedRoot>,
    wraps_committed_host_output: bool,
}

impl TestRendererPrivateTreeRenderedFunctionComponent {
    #[must_use]
    pub const fn node_type(&self) -> TestRendererPrivateTreeNodeType {
        self.node_type
    }

    #[must_use]
    pub const fn component_type(&self) -> &'static str {
        self.component_type
    }

    #[must_use]
    pub const fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn instance_available(&self) -> bool {
        self.instance_available
    }

    #[must_use]
    pub fn rendered(&self) -> &TestRendererPrivateTreeRenderedRoot {
        self.rendered.as_ref()
    }

    #[must_use]
    pub const fn wraps_committed_host_output(&self) -> bool {
        self.wraps_committed_host_output
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
pub struct TestRendererPrivateTreeFunctionComponentDiagnostic {
    fiber_tag: &'static str,
    node_type: TestRendererPrivateTreeNodeType,
    component_type: &'static str,
    props: TestProps,
    instance_available: bool,
    rendered_child_fiber_tag: &'static str,
    rendered_child_node_type: TestRendererPrivateTreeNodeType,
    rendered_child_count: usize,
    wraps_committed_host_output: bool,
    public_tree_object_available: bool,
}

impl TestRendererPrivateTreeFunctionComponentDiagnostic {
    #[must_use]
    pub const fn fiber_tag(&self) -> &'static str {
        self.fiber_tag
    }

    #[must_use]
    pub const fn node_type(&self) -> TestRendererPrivateTreeNodeType {
        self.node_type
    }

    #[must_use]
    pub const fn component_type(&self) -> &'static str {
        self.component_type
    }

    #[must_use]
    pub const fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn instance_available(&self) -> bool {
        self.instance_available
    }

    #[must_use]
    pub const fn rendered_child_fiber_tag(&self) -> &'static str {
        self.rendered_child_fiber_tag
    }

    #[must_use]
    pub const fn rendered_child_node_type(&self) -> TestRendererPrivateTreeNodeType {
        self.rendered_child_node_type
    }

    #[must_use]
    pub const fn rendered_child_count(&self) -> usize {
        self.rendered_child_count
    }

    #[must_use]
    pub const fn wraps_committed_host_output(&self) -> bool {
        self.wraps_committed_host_output
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
    host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    host_output_snapshot_current: bool,
    accepted_fiber_shape: [&'static str; 3],
    accepted_composite_fiber_shape: [&'static str; 4],
    root_child_count: usize,
    host_root: TestRendererPrivateTreeHostRootDiagnostic,
    function_component: TestRendererPrivateTreeFunctionComponentDiagnostic,
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
    pub const fn host_output_shape(&self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn host_output_row(&self) -> Option<TestRendererPrivateToJsonHostOutputRow> {
        self.host_output_row
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
    pub const fn accepted_composite_fiber_shape(&self) -> &[&'static str; 4] {
        &self.accepted_composite_fiber_shape
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
    pub const fn function_component(&self) -> &TestRendererPrivateTreeFunctionComponentDiagnostic {
        &self.function_component
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
pub struct TestRendererPrivateTreeCommittedFiberInspectionReport {
    diagnostic_name: &'static str,
    source_tree_diagnostic_name: &'static str,
    shape_name: &'static str,
    fiber_shape: Vec<String>,
    root_child_fiber_tags: Vec<String>,
    host_child_fiber_tags: Vec<String>,
    root_child_count: usize,
    host_child_count: usize,
    host_component_count: usize,
    host_text_count: usize,
    function_component_fiber_tag: Option<String>,
    function_component_present: bool,
    wraps_committed_host_output: bool,
    accepted_minimal_fiber_shape: [&'static str; 3],
    accepted_composite_fiber_shape: [&'static str; 4],
    accepted_multi_child_fiber_shape: [&'static str; 4],
    accepted_composite_multi_child_fiber_shape: [&'static str; 5],
    public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    public_tree_object_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateTreeCommittedFiberInspectionReport {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_tree_diagnostic_name(&self) -> &'static str {
        self.source_tree_diagnostic_name
    }

    #[must_use]
    pub const fn shape_name(&self) -> &'static str {
        self.shape_name
    }

    #[must_use]
    pub fn fiber_shape(&self) -> &[String] {
        &self.fiber_shape
    }

    #[must_use]
    pub fn root_child_fiber_tags(&self) -> &[String] {
        &self.root_child_fiber_tags
    }

    #[must_use]
    pub fn host_child_fiber_tags(&self) -> &[String] {
        &self.host_child_fiber_tags
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn host_child_count(&self) -> usize {
        self.host_child_count
    }

    #[must_use]
    pub const fn host_component_count(&self) -> usize {
        self.host_component_count
    }

    #[must_use]
    pub const fn host_text_count(&self) -> usize {
        self.host_text_count
    }

    #[must_use]
    pub fn function_component_fiber_tag(&self) -> Option<&str> {
        self.function_component_fiber_tag.as_deref()
    }

    #[must_use]
    pub const fn function_component_present(&self) -> bool {
        self.function_component_present
    }

    #[must_use]
    pub const fn wraps_committed_host_output(&self) -> bool {
        self.wraps_committed_host_output
    }

    #[must_use]
    pub const fn accepted_minimal_fiber_shape(&self) -> &[&'static str; 3] {
        &self.accepted_minimal_fiber_shape
    }

    #[must_use]
    pub const fn accepted_composite_fiber_shape(&self) -> &[&'static str; 4] {
        &self.accepted_composite_fiber_shape
    }

    #[must_use]
    pub const fn accepted_multi_child_fiber_shape(&self) -> &[&'static str; 4] {
        &self.accepted_multi_child_fiber_shape
    }

    #[must_use]
    pub const fn accepted_composite_multi_child_fiber_shape(&self) -> &[&'static str; 5] {
        &self.accepted_composite_multi_child_fiber_shape
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_tree_object_available(&self) -> bool {
        self.public_tree_object_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateTestInstanceFindAllPredicateKind {
    Type,
    Props,
    PredicateLike,
}

impl TestRendererPrivateTestInstanceFindAllPredicateKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Type => "type",
            Self::Props => "props",
            Self::PredicateLike => "predicate-like",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
    predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind,
    source: &'static str,
    predicate_source: &'static str,
    expected_type: Option<TestElementType>,
    expected_props: Option<TestProps>,
    evaluated_fiber_tags: Vec<&'static str>,
    matched_fiber_tags: Vec<&'static str>,
    rejected_fiber_tags: Vec<&'static str>,
    skipped_text_child_count: usize,
    predicate_execution: bool,
    public_query_method_available: bool,
}

impl TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
    #[must_use]
    pub const fn predicate_kind(&self) -> TestRendererPrivateTestInstanceFindAllPredicateKind {
        self.predicate_kind
    }

    #[must_use]
    pub const fn source(&self) -> &'static str {
        self.source
    }

    #[must_use]
    pub const fn predicate_source(&self) -> &'static str {
        self.predicate_source
    }

    #[must_use]
    pub fn expected_type(&self) -> Option<&TestElementType> {
        self.expected_type.as_ref()
    }

    #[must_use]
    pub fn expected_props(&self) -> Option<&TestProps> {
        self.expected_props.as_ref()
    }

    #[must_use]
    pub fn evaluated_fiber_tags(&self) -> &[&'static str] {
        &self.evaluated_fiber_tags
    }

    #[must_use]
    pub fn matched_fiber_tags(&self) -> &[&'static str] {
        &self.matched_fiber_tags
    }

    #[must_use]
    pub fn rejected_fiber_tags(&self) -> &[&'static str] {
        &self.rejected_fiber_tags
    }

    #[must_use]
    pub fn evaluated_candidate_count(&self) -> usize {
        self.evaluated_fiber_tags.len()
    }

    #[must_use]
    pub fn matched_candidate_count(&self) -> usize {
        self.matched_fiber_tags.len()
    }

    #[must_use]
    pub fn rejected_candidate_count(&self) -> usize {
        self.rejected_fiber_tags.len()
    }

    #[must_use]
    pub const fn skipped_text_child_count(&self) -> usize {
        self.skipped_text_child_count
    }

    #[must_use]
    pub const fn predicate_execution(&self) -> bool {
        self.predicate_execution
    }

    #[must_use]
    pub const fn public_query_method_available(&self) -> bool {
        self.public_query_method_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceFindAllQueryDiagnostics {
    diagnostic_name: &'static str,
    source_tree_diagnostic_name: &'static str,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_snapshot_current: bool,
    traversal_source: &'static str,
    traversal_order: &'static str,
    default_deep: bool,
    candidate_fiber_tags: Vec<&'static str>,
    skipped_fiber_tags: Vec<&'static str>,
    type_predicate: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic,
    props_predicate: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic,
    predicate_like: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic,
    public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    public_test_instance_object_available: bool,
    public_query_methods_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceFindAllQueryDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_tree_diagnostic_name(&self) -> &'static str {
        self.source_tree_diagnostic_name
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
    pub const fn traversal_source(&self) -> &'static str {
        self.traversal_source
    }

    #[must_use]
    pub const fn traversal_order(&self) -> &'static str {
        self.traversal_order
    }

    #[must_use]
    pub const fn default_deep(&self) -> bool {
        self.default_deep
    }

    #[must_use]
    pub fn candidate_fiber_tags(&self) -> &[&'static str] {
        &self.candidate_fiber_tags
    }

    #[must_use]
    pub fn skipped_fiber_tags(&self) -> &[&'static str] {
        &self.skipped_fiber_tags
    }

    #[must_use]
    pub fn candidate_count(&self) -> usize {
        self.candidate_fiber_tags.len()
    }

    #[must_use]
    pub fn skipped_text_child_count(&self) -> usize {
        self.skipped_fiber_tags.len()
    }

    #[must_use]
    pub const fn type_predicate(
        &self,
    ) -> &TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
        &self.type_predicate
    }

    #[must_use]
    pub const fn props_predicate(
        &self,
    ) -> &TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
        &self.props_predicate
    }

    #[must_use]
    pub const fn predicate_like(
        &self,
    ) -> &TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
        &self.predicate_like
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateTestInstanceFindByQueryKind {
    Type,
    Props,
}

impl TestRendererPrivateTestInstanceFindByQueryKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Type => "findByType",
            Self::Props => "findByProps",
        }
    }

    #[must_use]
    pub const fn criteria_kind(self) -> &'static str {
        match self {
            Self::Type => "type",
            Self::Props => "props",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceFindByResultDiagnostic {
    query_kind: TestRendererPrivateTestInstanceFindByQueryKind,
    public_surface: &'static str,
    source: &'static str,
    based_on_find_all_source: &'static str,
    based_on_predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind,
    expect_one_message: String,
    expected_type: Option<TestElementType>,
    expected_props: Option<TestProps>,
    effective_deep: bool,
    expect_one: bool,
    result_kind: &'static str,
    expected_canary_match_count: usize,
    matched_candidate_count: usize,
    candidate_fiber_tags: Vec<&'static str>,
    traversed_candidate_fiber_tags: Vec<&'static str>,
    skipped_fiber_tags: Vec<&'static str>,
    zero_match_error_prefix: &'static str,
    duplicate_match_error_prefix: &'static str,
    predicate_execution: bool,
    public_query_method_available: bool,
    public_test_instance_object_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceFindByResultDiagnostic {
    #[must_use]
    pub const fn query_kind(&self) -> TestRendererPrivateTestInstanceFindByQueryKind {
        self.query_kind
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source(&self) -> &'static str {
        self.source
    }

    #[must_use]
    pub const fn based_on_find_all_source(&self) -> &'static str {
        self.based_on_find_all_source
    }

    #[must_use]
    pub const fn based_on_predicate_kind(
        &self,
    ) -> TestRendererPrivateTestInstanceFindAllPredicateKind {
        self.based_on_predicate_kind
    }

    #[must_use]
    pub fn expect_one_message(&self) -> &str {
        &self.expect_one_message
    }

    #[must_use]
    pub fn expected_type(&self) -> Option<&TestElementType> {
        self.expected_type.as_ref()
    }

    #[must_use]
    pub fn expected_props(&self) -> Option<&TestProps> {
        self.expected_props.as_ref()
    }

    #[must_use]
    pub const fn effective_deep(&self) -> bool {
        self.effective_deep
    }

    #[must_use]
    pub const fn expect_one(&self) -> bool {
        self.expect_one
    }

    #[must_use]
    pub const fn result_kind(&self) -> &'static str {
        self.result_kind
    }

    #[must_use]
    pub const fn expected_canary_match_count(&self) -> usize {
        self.expected_canary_match_count
    }

    #[must_use]
    pub const fn matched_candidate_count(&self) -> usize {
        self.matched_candidate_count
    }

    #[must_use]
    pub fn candidate_fiber_tags(&self) -> &[&'static str] {
        &self.candidate_fiber_tags
    }

    #[must_use]
    pub fn traversed_candidate_fiber_tags(&self) -> &[&'static str] {
        &self.traversed_candidate_fiber_tags
    }

    #[must_use]
    pub fn skipped_fiber_tags(&self) -> &[&'static str] {
        &self.skipped_fiber_tags
    }

    #[must_use]
    pub const fn zero_match_error_prefix(&self) -> &'static str {
        self.zero_match_error_prefix
    }

    #[must_use]
    pub const fn duplicate_match_error_prefix(&self) -> &'static str {
        self.duplicate_match_error_prefix
    }

    #[must_use]
    pub const fn predicate_execution(&self) -> bool {
        self.predicate_execution
    }

    #[must_use]
    pub const fn public_query_method_available(&self) -> bool {
        self.public_query_method_available
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceFindByQueryDiagnostics {
    diagnostic_name: &'static str,
    source_find_all_diagnostic_name: &'static str,
    source_tree_diagnostic_name: &'static str,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_snapshot_current: bool,
    source: &'static str,
    accepted_find_all_traversal_source: &'static str,
    effective_deep: bool,
    expect_one: bool,
    find_all_candidate_fiber_tags: Vec<&'static str>,
    find_all_skipped_fiber_tags: Vec<&'static str>,
    find_by_type: TestRendererPrivateTestInstanceFindByResultDiagnostic,
    find_by_props: TestRendererPrivateTestInstanceFindByResultDiagnostic,
    public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    public_test_instance_object_available: bool,
    public_query_methods_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceFindByQueryDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_find_all_diagnostic_name(&self) -> &'static str {
        self.source_find_all_diagnostic_name
    }

    #[must_use]
    pub const fn source_tree_diagnostic_name(&self) -> &'static str {
        self.source_tree_diagnostic_name
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
    pub const fn source(&self) -> &'static str {
        self.source
    }

    #[must_use]
    pub const fn accepted_find_all_traversal_source(&self) -> &'static str {
        self.accepted_find_all_traversal_source
    }

    #[must_use]
    pub const fn effective_deep(&self) -> bool {
        self.effective_deep
    }

    #[must_use]
    pub const fn expect_one(&self) -> bool {
        self.expect_one
    }

    #[must_use]
    pub fn find_all_candidate_fiber_tags(&self) -> &[&'static str] {
        &self.find_all_candidate_fiber_tags
    }

    #[must_use]
    pub fn find_all_skipped_fiber_tags(&self) -> &[&'static str] {
        &self.find_all_skipped_fiber_tags
    }

    #[must_use]
    pub const fn find_by_type(&self) -> &TestRendererPrivateTestInstanceFindByResultDiagnostic {
        &self.find_by_type
    }

    #[must_use]
    pub const fn find_by_props(&self) -> &TestRendererPrivateTestInstanceFindByResultDiagnostic {
        &self.find_by_props
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics {
    diagnostic_name: &'static str,
    source_find_all_diagnostic_name: &'static str,
    source_find_by_diagnostic_name: &'static str,
    bridge_status: &'static str,
    bridge_source: &'static str,
    wrapper_record_symbol: &'static str,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_snapshot_current: bool,
    accepted_find_all_traversal_source: &'static str,
    accepted_find_by_source: &'static str,
    find_all_candidate_fiber_tags: Vec<&'static str>,
    find_all_skipped_fiber_tags: Vec<&'static str>,
    find_by_queries: Vec<&'static str>,
    consumes_accepted_find_all_diagnostics: bool,
    consumes_accepted_find_by_diagnostics: bool,
    record_only_diagnostic_consumption: bool,
    native_bridge_available: bool,
    native_execution: bool,
    rust_execution_from_js: bool,
    public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    public_root_available: bool,
    public_test_instance_object_available: bool,
    public_query_methods_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_find_all_diagnostic_name(&self) -> &'static str {
        self.source_find_all_diagnostic_name
    }

    #[must_use]
    pub const fn source_find_by_diagnostic_name(&self) -> &'static str {
        self.source_find_by_diagnostic_name
    }

    #[must_use]
    pub const fn bridge_status(&self) -> &'static str {
        self.bridge_status
    }

    #[must_use]
    pub const fn bridge_source(&self) -> &'static str {
        self.bridge_source
    }

    #[must_use]
    pub const fn wrapper_record_symbol(&self) -> &'static str {
        self.wrapper_record_symbol
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
    pub const fn accepted_find_all_traversal_source(&self) -> &'static str {
        self.accepted_find_all_traversal_source
    }

    #[must_use]
    pub const fn accepted_find_by_source(&self) -> &'static str {
        self.accepted_find_by_source
    }

    #[must_use]
    pub fn find_all_candidate_fiber_tags(&self) -> &[&'static str] {
        &self.find_all_candidate_fiber_tags
    }

    #[must_use]
    pub fn find_all_skipped_fiber_tags(&self) -> &[&'static str] {
        &self.find_all_skipped_fiber_tags
    }

    #[must_use]
    pub fn find_by_queries(&self) -> &[&'static str] {
        &self.find_by_queries
    }

    #[must_use]
    pub const fn consumes_accepted_find_all_diagnostics(&self) -> bool {
        self.consumes_accepted_find_all_diagnostics
    }

    #[must_use]
    pub const fn consumes_accepted_find_by_diagnostics(&self) -> bool {
        self.consumes_accepted_find_by_diagnostics
    }

    #[must_use]
    pub const fn record_only_diagnostic_consumption(&self) -> bool {
        self.record_only_diagnostic_consumption
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(&self) -> bool {
        self.native_execution
    }

    #[must_use]
    pub const fn rust_execution_from_js(&self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_root_available(&self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceNativeQueryExecutionEvidence {
    diagnostic_name: &'static str,
    status: &'static str,
    root: FiberRootId,
    operation: &'static str,
    public_surface: &'static str,
    source_execution_record_id: &'static str,
    source_execution_status: &'static str,
    source_query_diagnostic_name: &'static str,
    query_bridge_preflight_status: &'static str,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_snapshot_current: bool,
    query_surface: &'static str,
    query_kind: TestRendererPrivateTestInstanceFindByQueryKind,
    expected_type: TestElementType,
    result_fiber_tag: &'static str,
    result_kind: &'static str,
    matched_candidate_count: usize,
    query_path_candidate_count: usize,
    skipped_text_child_count: usize,
    consumes_accepted_native_create_execution_record: bool,
    consumes_accepted_native_update_execution_record: bool,
    consumes_private_test_instance_query_diagnostics: bool,
    consumes_query_bridge_preflight: bool,
    consumes_accepted_find_all_diagnostics: bool,
    consumes_accepted_find_by_diagnostics: bool,
    minimal_host_component_query_path: bool,
    public_root_available: bool,
    public_query_methods_available: bool,
    public_test_instance_object_available: bool,
    native_bridge_available: bool,
    native_execution_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceNativeQueryExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(&self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(&self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(&self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_query_diagnostic_name(&self) -> &'static str {
        self.source_query_diagnostic_name
    }

    #[must_use]
    pub const fn query_bridge_preflight_status(&self) -> &'static str {
        self.query_bridge_preflight_status
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
    pub const fn query_surface(&self) -> &'static str {
        self.query_surface
    }

    #[must_use]
    pub const fn query_kind(&self) -> TestRendererPrivateTestInstanceFindByQueryKind {
        self.query_kind
    }

    #[must_use]
    pub const fn expected_type(&self) -> &TestElementType {
        &self.expected_type
    }

    #[must_use]
    pub const fn result_fiber_tag(&self) -> &'static str {
        self.result_fiber_tag
    }

    #[must_use]
    pub const fn result_kind(&self) -> &'static str {
        self.result_kind
    }

    #[must_use]
    pub const fn matched_candidate_count(&self) -> usize {
        self.matched_candidate_count
    }

    #[must_use]
    pub const fn query_path_candidate_count(&self) -> usize {
        self.query_path_candidate_count
    }

    #[must_use]
    pub const fn skipped_text_child_count(&self) -> usize {
        self.skipped_text_child_count
    }

    #[must_use]
    pub const fn consumes_accepted_native_create_execution_record(&self) -> bool {
        self.consumes_accepted_native_create_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(&self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_private_test_instance_query_diagnostics(&self) -> bool {
        self.consumes_private_test_instance_query_diagnostics
    }

    #[must_use]
    pub const fn consumes_query_bridge_preflight(&self) -> bool {
        self.consumes_query_bridge_preflight
    }

    #[must_use]
    pub const fn consumes_accepted_find_all_diagnostics(&self) -> bool {
        self.consumes_accepted_find_all_diagnostics
    }

    #[must_use]
    pub const fn consumes_accepted_find_by_diagnostics(&self) -> bool {
        self.consumes_accepted_find_by_diagnostics
    }

    #[must_use]
    pub const fn minimal_host_component_query_path(&self) -> bool {
        self.minimal_host_component_query_path
    }

    #[must_use]
    pub const fn public_root_available(&self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence {
    diagnostic_name: &'static str,
    status: &'static str,
    root: FiberRootId,
    operation: &'static str,
    public_surface: &'static str,
    source_execution_record_id: &'static str,
    source_execution_status: &'static str,
    source_query_diagnostic_name: &'static str,
    source_get_instance_diagnostic_name: &'static str,
    query_bridge_preflight_status: &'static str,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_snapshot_current: bool,
    accepted_class_fiber_shape: [&'static str; 4],
    root_query_surface: &'static str,
    root_result_fiber_tag: &'static str,
    root_component_type: &'static str,
    root_props: TestProps,
    root_child_count: usize,
    child_query_surface: &'static str,
    child_query_kind: TestRendererPrivateTestInstanceFindByQueryKind,
    child_fiber_tag: &'static str,
    child_element_type: TestElementType,
    child_props: TestProps,
    previous_child_text: String,
    current_child_text: String,
    host_child_updated: bool,
    class_root_query_path: Vec<&'static str>,
    updated_host_child_query_path: Vec<&'static str>,
    consumes_accepted_native_update_execution_record: bool,
    consumes_private_test_instance_query_diagnostics: bool,
    consumes_query_bridge_preflight: bool,
    consumes_private_get_instance_class_root_diagnostics: bool,
    public_root_available: bool,
    public_query_methods_available: bool,
    public_test_instance_object_available: bool,
    public_get_instance_available: bool,
    native_bridge_available: bool,
    native_execution_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(&self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(&self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(&self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_query_diagnostic_name(&self) -> &'static str {
        self.source_query_diagnostic_name
    }

    #[must_use]
    pub const fn source_get_instance_diagnostic_name(&self) -> &'static str {
        self.source_get_instance_diagnostic_name
    }

    #[must_use]
    pub const fn query_bridge_preflight_status(&self) -> &'static str {
        self.query_bridge_preflight_status
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
    pub const fn accepted_class_fiber_shape(&self) -> &[&'static str; 4] {
        &self.accepted_class_fiber_shape
    }

    #[must_use]
    pub const fn root_query_surface(&self) -> &'static str {
        self.root_query_surface
    }

    #[must_use]
    pub const fn root_result_fiber_tag(&self) -> &'static str {
        self.root_result_fiber_tag
    }

    #[must_use]
    pub const fn root_component_type(&self) -> &'static str {
        self.root_component_type
    }

    #[must_use]
    pub const fn root_props(&self) -> &TestProps {
        &self.root_props
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn child_query_surface(&self) -> &'static str {
        self.child_query_surface
    }

    #[must_use]
    pub const fn child_query_kind(&self) -> TestRendererPrivateTestInstanceFindByQueryKind {
        self.child_query_kind
    }

    #[must_use]
    pub const fn child_fiber_tag(&self) -> &'static str {
        self.child_fiber_tag
    }

    #[must_use]
    pub const fn child_element_type(&self) -> &TestElementType {
        &self.child_element_type
    }

    #[must_use]
    pub const fn child_props(&self) -> &TestProps {
        &self.child_props
    }

    #[must_use]
    pub fn previous_child_text(&self) -> &str {
        &self.previous_child_text
    }

    #[must_use]
    pub fn current_child_text(&self) -> &str {
        &self.current_child_text
    }

    #[must_use]
    pub const fn host_child_updated(&self) -> bool {
        self.host_child_updated
    }

    #[must_use]
    pub fn class_root_query_path(&self) -> &[&'static str] {
        &self.class_root_query_path
    }

    #[must_use]
    pub fn updated_host_child_query_path(&self) -> &[&'static str] {
        &self.updated_host_child_query_path
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(&self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_private_test_instance_query_diagnostics(&self) -> bool {
        self.consumes_private_test_instance_query_diagnostics
    }

    #[must_use]
    pub const fn consumes_query_bridge_preflight(&self) -> bool {
        self.consumes_query_bridge_preflight
    }

    #[must_use]
    pub const fn consumes_private_get_instance_class_root_diagnostics(&self) -> bool {
        self.consumes_private_get_instance_class_root_diagnostics
    }

    #[must_use]
    pub const fn public_root_available(&self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
    root_fiber_shape: [&'static str; 2],
    root_child_fiber_tag: &'static str,
    react_public_result: &'static str,
    public_get_instance_available: bool,
    private_class_instance_available: bool,
    public_behavior_fail_closed: bool,
}

impl TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
    #[must_use]
    pub const fn root_fiber_shape(&self) -> &[&'static str; 2] {
        &self.root_fiber_shape
    }

    #[must_use]
    pub const fn root_child_fiber_tag(&self) -> &'static str {
        self.root_child_fiber_tag
    }

    #[must_use]
    pub const fn react_public_result(&self) -> &'static str {
        self.react_public_result
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }

    #[must_use]
    pub const fn private_class_instance_available(&self) -> bool {
        self.private_class_instance_available
    }

    #[must_use]
    pub const fn public_behavior_fail_closed(&self) -> bool {
        self.public_behavior_fail_closed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateGetInstanceClassInstanceDiagnostic {
    constructor_name: &'static str,
    props: TestProps,
    state_marker: &'static str,
    private_instance_available: bool,
    public_get_instance_available: bool,
    react_public_result: &'static str,
}

impl TestRendererPrivateGetInstanceClassInstanceDiagnostic {
    #[must_use]
    pub const fn constructor_name(&self) -> &'static str {
        self.constructor_name
    }

    #[must_use]
    pub const fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn state_marker(&self) -> &'static str {
        self.state_marker
    }

    #[must_use]
    pub const fn private_instance_available(&self) -> bool {
        self.private_instance_available
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }

    #[must_use]
    pub const fn react_public_result(&self) -> &'static str {
        self.react_public_result
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateGetInstanceClassComponentDiagnostic {
    fiber_tag: &'static str,
    component_type: &'static str,
    props: TestProps,
    state_node_available: bool,
    rendered_child_fiber_tag: &'static str,
    rendered_child_count: usize,
    instance: TestRendererPrivateGetInstanceClassInstanceDiagnostic,
    public_get_instance_available: bool,
}

impl TestRendererPrivateGetInstanceClassComponentDiagnostic {
    #[must_use]
    pub const fn fiber_tag(&self) -> &'static str {
        self.fiber_tag
    }

    #[must_use]
    pub const fn component_type(&self) -> &'static str {
        self.component_type
    }

    #[must_use]
    pub const fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn state_node_available(&self) -> bool {
        self.state_node_available
    }

    #[must_use]
    pub const fn rendered_child_fiber_tag(&self) -> &'static str {
        self.rendered_child_fiber_tag
    }

    #[must_use]
    pub const fn rendered_child_count(&self) -> usize {
        self.rendered_child_count
    }

    #[must_use]
    pub const fn instance(&self) -> &TestRendererPrivateGetInstanceClassInstanceDiagnostic {
        &self.instance
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateGetInstanceClassRootReport {
    diagnostic_name: &'static str,
    source_tree_diagnostic_name: &'static str,
    gate: TestRendererSerializationGateReport,
    host_output_update_kind: TestRendererRootUpdateKind,
    host_output_snapshot_current: bool,
    accepted_class_fiber_shape: [&'static str; 4],
    host_root_fail_closed: TestRendererPrivateGetInstanceFailClosedRootDiagnostic,
    function_root_fail_closed: TestRendererPrivateGetInstanceFailClosedRootDiagnostic,
    class_component: TestRendererPrivateGetInstanceClassComponentDiagnostic,
    rendered_host_component: TestRendererPrivateTreeHostComponentDiagnostic,
    rendered_host_text: TestRendererPrivateTreeHostTextDiagnostic,
    public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    public_get_instance_available: bool,
    native_bridge_available: bool,
    compatibility_claimed: bool,
}

impl TestRendererPrivateGetInstanceClassRootReport {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_tree_diagnostic_name(&self) -> &'static str {
        self.source_tree_diagnostic_name
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
    pub const fn accepted_class_fiber_shape(&self) -> &[&'static str; 4] {
        &self.accepted_class_fiber_shape
    }

    #[must_use]
    pub const fn host_root_fail_closed(
        &self,
    ) -> &TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
        &self.host_root_fail_closed
    }

    #[must_use]
    pub const fn function_root_fail_closed(
        &self,
    ) -> &TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
        &self.function_root_fail_closed
    }

    #[must_use]
    pub const fn class_component(&self) -> &TestRendererPrivateGetInstanceClassComponentDiagnostic {
        &self.class_component
    }

    #[must_use]
    pub const fn rendered_host_component(&self) -> &TestRendererPrivateTreeHostComponentDiagnostic {
        &self.rendered_host_component
    }

    #[must_use]
    pub const fn rendered_host_text(&self) -> &TestRendererPrivateTreeHostTextDiagnostic {
        &self.rendered_host_text
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateUpdateRouteError {
    RootNotActive {
        lifecycle: TestRendererRootLifecycle,
    },
    MissingScheduledUpdate,
    UnexpectedScheduledUpdateKind {
        actual: TestRendererRootUpdateKind,
    },
    IncompatibleFinishedWork {
        reason: &'static str,
    },
    MissingHostTextUpdateApply,
}

impl Display for TestRendererPrivateUpdateRouteError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::RootNotActive { lifecycle } => write!(
                formatter,
                "private update route requires an active root, found {lifecycle:?}"
            ),
            Self::MissingScheduledUpdate => {
                formatter.write_str("private update route found no scheduled HostRoot update")
            }
            Self::UnexpectedScheduledUpdateKind { actual } => write!(
                formatter,
                "private update route expected a scheduled update, found {actual:?}"
            ),
            Self::IncompatibleFinishedWork { reason } => write!(
                formatter,
                "private update route finished-work record is incompatible: {reason}"
            ),
            Self::MissingHostTextUpdateApply => formatter.write_str(
                "private update route expected one accepted HostText update apply record",
            ),
        }
    }
}

impl Error for TestRendererPrivateUpdateRouteError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateUpdateNativeBridgeAdmissionError {
    MissingHostOutputHandoff,
    UnexpectedRouteOutcome { actual: &'static str },
    UnexpectedScheduledUpdateKind { actual: TestRendererRootUpdateKind },
    StaleRouteOutcome,
}

impl Display for TestRendererPrivateUpdateNativeBridgeAdmissionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingHostOutputHandoff => formatter.write_str(
                "private update native bridge admission requires update host-output handoff evidence",
            ),
            Self::UnexpectedRouteOutcome { actual } => write!(
                formatter,
                "private update native bridge admission expected a scheduled update route outcome, found {actual}",
            ),
            Self::UnexpectedScheduledUpdateKind { actual } => write!(
                formatter,
                "private update native bridge admission expected a scheduled update, found {actual:?}",
            ),
            Self::StaleRouteOutcome => formatter.write_str(
                "private update native bridge admission route outcome is not the latest scheduled update",
            ),
        }
    }
}

impl Error for TestRendererPrivateUpdateNativeBridgeAdmissionError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateErrorBoundaryNativeExecutionError {
    RootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    RecordMismatch {
        reason: &'static str,
    },
    PublicRecoveryOpened {
        reason: &'static str,
    },
}

impl Display for TestRendererPrivateErrorBoundaryNativeExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::RootMismatch { expected, actual } => write!(
                formatter,
                "private error boundary native execution evidence expected root {expected:?}, found {actual:?}",
            ),
            Self::RecordMismatch { reason } => write!(
                formatter,
                "private error boundary native execution evidence rejected update execution record: {reason}",
            ),
            Self::PublicRecoveryOpened { reason } => write!(
                formatter,
                "private error boundary native execution evidence cannot open public recovery: {reason}",
            ),
        }
    }
}

impl Error for TestRendererPrivateErrorBoundaryNativeExecutionError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateActNestedScopePassiveFlushError {
    RootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    RecordMismatch {
        reason: &'static str,
    },
    PublicActOpened {
        reason: &'static str,
    },
}

impl Display for TestRendererPrivateActNestedScopePassiveFlushError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::RootMismatch { expected, actual } => write!(
                formatter,
                "private nested act passive flush expected root {expected:?}, found {actual:?}",
            ),
            Self::RecordMismatch { reason } => write!(
                formatter,
                "private nested act passive flush rejected passive metadata: {reason}",
            ),
            Self::PublicActOpened { reason } => write!(
                formatter,
                "private nested act passive flush cannot open public act behavior: {reason}",
            ),
        }
    }
}

impl Error for TestRendererPrivateActNestedScopePassiveFlushError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateUnmountNativeBridgeAdmissionError {
    AlreadyUnmountedRoot,
    MissingDeletionCommitHandoff,
    UnexpectedRouteOutcome { actual: &'static str },
    UnexpectedScheduledUpdateKind { actual: TestRendererRootUpdateKind },
    StaleRouteOutcome,
    StaleDeletionCommitHandoff { reason: &'static str },
    MissingCleanupBlockers { reason: &'static str },
}

impl Display for TestRendererPrivateUnmountNativeBridgeAdmissionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::AlreadyUnmountedRoot => formatter.write_str(
                "private unmount native bridge admission rejects already-unmounted roots",
            ),
            Self::MissingDeletionCommitHandoff => formatter.write_str(
                "private unmount native bridge admission requires deletion commit handoff evidence",
            ),
            Self::UnexpectedRouteOutcome { actual } => write!(
                formatter,
                "private unmount native bridge admission expected a scheduled unmount route outcome, found {actual}",
            ),
            Self::UnexpectedScheduledUpdateKind { actual } => write!(
                formatter,
                "private unmount native bridge admission expected a scheduled unmount update, found {actual:?}",
            ),
            Self::StaleRouteOutcome => formatter.write_str(
                "private unmount native bridge admission route outcome is not the latest scheduled update",
            ),
            Self::StaleDeletionCommitHandoff { reason } => write!(
                formatter,
                "private unmount native bridge admission deletion handoff is stale: {reason}",
            ),
            Self::MissingCleanupBlockers { reason } => write!(
                formatter,
                "private unmount native bridge admission cleanup blockers are missing: {reason}",
            ),
        }
    }
}

impl Error for TestRendererPrivateUnmountNativeBridgeAdmissionError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateTestInstanceNativeQueryExecutionError {
    NativeExecutionRecordMismatch {
        operation: &'static str,
        reason: &'static str,
    },
}

impl Display for TestRendererPrivateTestInstanceNativeQueryExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::NativeExecutionRecordMismatch { operation, reason } => write!(
                formatter,
                "private TestInstance native query execution evidence rejected {operation} execution record: {reason}",
            ),
        }
    }
}

impl Error for TestRendererPrivateTestInstanceNativeQueryExecutionError {}

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
    HostOutputRowMismatch {
        row_id: &'static str,
        expected: TestRendererRootUpdateKind,
        actual: TestRendererRootUpdateKind,
    },
    HostOutputRowShapeMismatch {
        row_id: &'static str,
        expected: TestRendererPrivateToJsonHostOutputShape,
        actual: TestRendererPrivateToJsonHostOutputShape,
    },
    NativeExecutionRecordMismatch {
        operation: &'static str,
        reason: &'static str,
    },
    TreeNativeExecutionRecordMismatch {
        operation: &'static str,
        reason: &'static str,
    },
    UnmountSnapshotNotEmpty {
        actual: usize,
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
            Self::HostOutputRowMismatch {
                row_id,
                expected,
                actual,
            } => write!(
                formatter,
                "private JSON serialization canary row '{row_id}' expected {:?} host output, found {:?}",
                expected, actual
            ),
            Self::HostOutputRowShapeMismatch {
                row_id,
                expected,
                actual,
            } => write!(
                formatter,
                "private JSON serialization canary row '{row_id}' expected {} host output shape, found {}",
                expected.as_str(),
                actual.as_str()
            ),
            Self::NativeExecutionRecordMismatch { operation, reason } => write!(
                formatter,
                "private toJSON native execution evidence rejected {operation} execution record: {reason}",
            ),
            Self::TreeNativeExecutionRecordMismatch { operation, reason } => write!(
                formatter,
                "private toTree native execution evidence rejected {operation} execution record: {reason}",
            ),
            Self::UnmountSnapshotNotEmpty { actual } => write!(
                formatter,
                "private JSON serialization canary expected unmount host output to be empty, found {actual} root child nodes",
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
pub enum TestRendererRootCreatePreflightError {
    UnsupportedChildren {
        child_shape: TestRendererRootCreatePreflightChildShape,
    },
    StaleCanaryMetadata {
        expected_metadata_id: &'static str,
        actual_metadata_id: &'static str,
        expected_root_api: &'static str,
        actual_root_api: &'static str,
    },
    MissingRootOptions,
    MissingWorkLoopFinishedWorkPreflightMetadata,
    StaleWorkLoopFinishedWorkPreflightMetadata {
        expected_metadata_id: &'static str,
        actual_metadata_id: &'static str,
        expected_render_phase_api: &'static str,
        actual_render_phase_api: &'static str,
    },
}

impl Display for TestRendererRootCreatePreflightError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnsupportedChildren { child_shape } => write!(
                formatter,
                "private root-create preflight only accepts a HostComponent with one text child, found {} children",
                child_shape.code()
            ),
            Self::StaleCanaryMetadata {
                expected_metadata_id,
                actual_metadata_id,
                expected_root_api,
                actual_root_api,
            } => write!(
                formatter,
                "private root-create preflight canary metadata is stale: expected {expected_metadata_id}/{expected_root_api}, found {actual_metadata_id}/{actual_root_api}",
            ),
            Self::MissingRootOptions => formatter.write_str(
                "private root-create preflight requires explicit TestRendererOptions metadata",
            ),
            Self::MissingWorkLoopFinishedWorkPreflightMetadata => formatter.write_str(
                "private root-create preflight requires accepted root work-loop finished-work preflight metadata",
            ),
            Self::StaleWorkLoopFinishedWorkPreflightMetadata {
                expected_metadata_id,
                actual_metadata_id,
                expected_render_phase_api,
                actual_render_phase_api,
            } => write!(
                formatter,
                "private root-create preflight root work-loop finished-work metadata is stale: expected {expected_metadata_id}/{expected_render_phase_api}, found {actual_metadata_id}/{actual_render_phase_api}",
            ),
        }
    }
}

impl Error for TestRendererRootCreatePreflightError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateCreateRouteAdmissionError {
    MissingRustAdmissionRecord,
    StaleRustAdmissionRecord {
        expected_metadata_id: &'static str,
        actual_metadata_id: &'static str,
        expected_root_api: &'static str,
        actual_root_api: &'static str,
    },
    MissingRootCreatePreflight,
    StaleRootCreatePreflight {
        expected_diagnostic_name: &'static str,
        actual_diagnostic_name: &'static str,
        expected_status: &'static str,
        actual_status: &'static str,
    },
    StaleWorkLoopFinishedWorkPreflight {
        expected_metadata_id: &'static str,
        actual_metadata_id: &'static str,
        expected_render_phase_api: &'static str,
        actual_render_phase_api: &'static str,
    },
    StaleCreateHostOutputHandoff {
        reason: &'static str,
    },
    UnexpectedCreateHostOutputShape {
        expected: TestRendererPrivateToJsonHostOutputShape,
        actual: TestRendererPrivateToJsonHostOutputShape,
    },
}

impl Display for TestRendererPrivateCreateRouteAdmissionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingRustAdmissionRecord => formatter.write_str(
                "private create-route admission requires an accepted Rust admission record",
            ),
            Self::StaleRustAdmissionRecord {
                expected_metadata_id,
                actual_metadata_id,
                expected_root_api,
                actual_root_api,
            } => write!(
                formatter,
                "private create-route admission Rust record is stale: expected {expected_metadata_id}/{expected_root_api}, found {actual_metadata_id}/{actual_root_api}",
            ),
            Self::MissingRootCreatePreflight => formatter.write_str(
                "private create-route admission requires accepted root-create preflight diagnostics",
            ),
            Self::StaleRootCreatePreflight {
                expected_diagnostic_name,
                actual_diagnostic_name,
                expected_status,
                actual_status,
            } => write!(
                formatter,
                "private create-route admission root-create preflight is stale: expected {expected_diagnostic_name}/{expected_status}, found {actual_diagnostic_name}/{actual_status}",
            ),
            Self::StaleWorkLoopFinishedWorkPreflight {
                expected_metadata_id,
                actual_metadata_id,
                expected_render_phase_api,
                actual_render_phase_api,
            } => write!(
                formatter,
                "private create-route admission work-loop finished-work preflight is stale: expected {expected_metadata_id}/{expected_render_phase_api}, found {actual_metadata_id}/{actual_render_phase_api}",
            ),
            Self::StaleCreateHostOutputHandoff { reason } => write!(
                formatter,
                "private create-route admission host-output handoff is stale: {reason}",
            ),
            Self::UnexpectedCreateHostOutputShape { expected, actual } => write!(
                formatter,
                "private create-route admission expected host-output shape {}, found {}",
                expected.as_str(),
                actual.as_str()
            ),
        }
    }
}

impl Error for TestRendererPrivateCreateRouteAdmissionError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererRootError {
    Host(HostError),
    FiberRootStore(FiberRootStoreError),
    RootUpdate(RootUpdateError),
    RootScheduler(RootSchedulerError),
    RootWorkLoop(RootWorkLoopError),
    RootCommit(RootCommitError),
    SerializationGate(Box<TestRendererSerializationGateError>),
    PrivateUpdateRoute(Box<TestRendererPrivateUpdateRouteError>),
    PrivateUpdateNativeBridgeAdmission(Box<TestRendererPrivateUpdateNativeBridgeAdmissionError>),
    PrivateErrorBoundaryNativeExecution(Box<TestRendererPrivateErrorBoundaryNativeExecutionError>),
    PrivateActNestedScopePassiveFlush(Box<TestRendererPrivateActNestedScopePassiveFlushError>),
    PrivateUnmountNativeBridgeAdmission(Box<TestRendererPrivateUnmountNativeBridgeAdmissionError>),
    PrivateTestInstanceNativeQueryExecution(
        Box<TestRendererPrivateTestInstanceNativeQueryExecutionError>,
    ),
    PrivateJsonSerialization(Box<TestRendererPrivateJsonSerializationError>),
    StableSiblingInsertionCanary(Box<TestRendererStableSiblingInsertionCanaryError>),
    RootCreatePreflight(Box<TestRendererRootCreatePreflightError>),
    PrivateCreateRouteAdmission(Box<TestRendererPrivateCreateRouteAdmissionError>),
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
            Self::PrivateUpdateRoute(error) => Display::fmt(error, formatter),
            Self::PrivateUpdateNativeBridgeAdmission(error) => Display::fmt(error, formatter),
            Self::PrivateErrorBoundaryNativeExecution(error) => Display::fmt(error, formatter),
            Self::PrivateActNestedScopePassiveFlush(error) => Display::fmt(error, formatter),
            Self::PrivateUnmountNativeBridgeAdmission(error) => Display::fmt(error, formatter),
            Self::PrivateTestInstanceNativeQueryExecution(error) => Display::fmt(error, formatter),
            Self::PrivateJsonSerialization(error) => Display::fmt(error, formatter),
            Self::StableSiblingInsertionCanary(error) => Display::fmt(error, formatter),
            Self::RootCreatePreflight(error) => Display::fmt(error, formatter),
            Self::PrivateCreateRouteAdmission(error) => Display::fmt(error, formatter),
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
            Self::PrivateUpdateRoute(error) => Some(error),
            Self::PrivateUpdateNativeBridgeAdmission(error) => Some(error),
            Self::PrivateErrorBoundaryNativeExecution(error) => Some(error),
            Self::PrivateActNestedScopePassiveFlush(error) => Some(error),
            Self::PrivateUnmountNativeBridgeAdmission(error) => Some(error),
            Self::PrivateTestInstanceNativeQueryExecution(error) => Some(error),
            Self::PrivateJsonSerialization(error) => Some(error),
            Self::StableSiblingInsertionCanary(error) => Some(error),
            Self::RootCreatePreflight(error) => Some(error),
            Self::PrivateCreateRouteAdmission(error) => Some(error),
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

impl From<TestRendererPrivateUpdateRouteError> for TestRendererRootError {
    fn from(error: TestRendererPrivateUpdateRouteError) -> Self {
        Self::PrivateUpdateRoute(Box::new(error))
    }
}

impl From<TestRendererPrivateUpdateNativeBridgeAdmissionError> for TestRendererRootError {
    fn from(error: TestRendererPrivateUpdateNativeBridgeAdmissionError) -> Self {
        Self::PrivateUpdateNativeBridgeAdmission(Box::new(error))
    }
}

impl From<TestRendererPrivateErrorBoundaryNativeExecutionError> for TestRendererRootError {
    fn from(error: TestRendererPrivateErrorBoundaryNativeExecutionError) -> Self {
        Self::PrivateErrorBoundaryNativeExecution(Box::new(error))
    }
}

impl From<TestRendererPrivateActNestedScopePassiveFlushError> for TestRendererRootError {
    fn from(error: TestRendererPrivateActNestedScopePassiveFlushError) -> Self {
        Self::PrivateActNestedScopePassiveFlush(Box::new(error))
    }
}

impl From<TestRendererPrivateUnmountNativeBridgeAdmissionError> for TestRendererRootError {
    fn from(error: TestRendererPrivateUnmountNativeBridgeAdmissionError) -> Self {
        Self::PrivateUnmountNativeBridgeAdmission(Box::new(error))
    }
}

impl From<TestRendererPrivateTestInstanceNativeQueryExecutionError> for TestRendererRootError {
    fn from(error: TestRendererPrivateTestInstanceNativeQueryExecutionError) -> Self {
        Self::PrivateTestInstanceNativeQueryExecution(Box::new(error))
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

impl From<TestRendererRootCreatePreflightError> for TestRendererRootError {
    fn from(error: TestRendererRootCreatePreflightError) -> Self {
        Self::RootCreatePreflight(Box::new(error))
    }
}

impl From<TestRendererPrivateCreateRouteAdmissionError> for TestRendererRootError {
    fn from(error: TestRendererPrivateCreateRouteAdmissionError) -> Self {
        Self::PrivateCreateRouteAdmission(Box::new(error))
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
        Self::create_host_component_with_props_and_text_for_canary(
            element_type,
            TestProps::new(),
            text,
            options,
        )
    }

    pub fn create_host_component_with_props_and_text_for_canary(
        element_type: impl Into<TestElementType>,
        props: TestProps,
        text: impl Into<String>,
        options: TestRendererOptions,
    ) -> Result<Self, TestRendererRootError> {
        let mut root = Self::new_without_initial_update(options)?;
        let element = root.push_host_output_fixture_with_props_for_canary(
            element_type.into(),
            props,
            text.into(),
        );
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
        self.update_host_component_with_props_and_text_for_canary(
            element_type,
            TestProps::new(),
            text,
        )
    }

    pub fn update_host_component_with_props_and_text_for_canary(
        &mut self,
        element_type: impl Into<TestElementType>,
        props: TestProps,
        text: impl Into<String>,
    ) -> Result<TestRendererRootUpdateOutcome, TestRendererRootError> {
        if !matches!(self.lifecycle, TestRendererRootLifecycle::Active) {
            return Ok(TestRendererRootUpdateOutcome::IgnoredAfterUnmount);
        }

        let element = self.push_host_output_fixture_with_props_for_canary(
            element_type.into(),
            props,
            text.into(),
        );
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

    pub fn describe_private_root_create_preflight_for_canary(
        input_shape: TestRendererRootCreatePreflightInputShape,
        options: Option<TestRendererOptions>,
        canary_api_identity: TestRendererRootCreatePreflightCanaryApiIdentity,
        work_loop_metadata: Option<TestRendererRootWorkLoopFinishedWorkPreflightMetadata>,
    ) -> Result<TestRendererRootCreatePreflightDiagnostics, TestRendererRootError> {
        if !input_shape
            .child_shape()
            .is_supported_for_create_preflight()
        {
            return Err(TestRendererRootCreatePreflightError::UnsupportedChildren {
                child_shape: input_shape.child_shape(),
            }
            .into());
        }

        if !canary_api_identity.is_current() {
            let current = TestRendererRootCreatePreflightCanaryApiIdentity::current();
            return Err(TestRendererRootCreatePreflightError::StaleCanaryMetadata {
                expected_metadata_id: current.metadata_id(),
                actual_metadata_id: canary_api_identity.metadata_id(),
                expected_root_api: current.root_api(),
                actual_root_api: canary_api_identity.root_api(),
            }
            .into());
        }

        let Some(work_loop_metadata) = work_loop_metadata else {
            return Err(
                TestRendererRootCreatePreflightError::MissingWorkLoopFinishedWorkPreflightMetadata
                    .into(),
            );
        };
        if !work_loop_metadata.is_current() {
            let current = TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current();
            return Err(
                TestRendererRootCreatePreflightError::StaleWorkLoopFinishedWorkPreflightMetadata {
                    expected_metadata_id: current.metadata_id(),
                    actual_metadata_id: work_loop_metadata.metadata_id(),
                    expected_render_phase_api: current.render_phase_api(),
                    actual_render_phase_api: work_loop_metadata.render_phase_api(),
                }
                .into(),
            );
        }

        let Some(options) = options else {
            return Err(TestRendererRootCreatePreflightError::MissingRootOptions.into());
        };
        let root_options = TestRendererRootCreatePreflightOptionsMetadata::from_options(&options);
        let mut root = Self::create(input_shape.element(), options)?;
        let (scheduled_update_kind, scheduled_element) = {
            let scheduled_update = root
                .last_scheduled_update()
                .expect("TestRendererRoot::create schedules an initial HostRoot update");
            (scheduled_update.kind(), scheduled_update.element())
        };
        let render = root
            .render_latest_scheduled_host_root_for_commit_handoff()?
            .expect("private root-create preflight schedules HostRoot render work");
        let previous_current = render.current();
        let finished_work = render.finished_work();
        let work_loop_finished_work_preflight =
            TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
                row_id: TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_ROW_ID,
                status: TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_STATUS,
                metadata: work_loop_metadata,
                root: root.root_id(),
                previous_current: TestRendererFiberHandleDiagnostics {
                    arena_id: previous_current.arena_id().get(),
                    slot: previous_current.slot().get(),
                    generation: previous_current.generation().get(),
                },
                finished_work: TestRendererFiberHandleDiagnostics {
                    arena_id: finished_work.arena_id().get(),
                    slot: finished_work.slot().get(),
                    generation: finished_work.generation().get(),
                },
                resulting_element: render.resulting_element(),
                scheduled_update_kind,
                render_lanes_empty: render.render_lanes().is_empty(),
                remaining_lanes_empty: render.remaining_lanes().is_empty(),
                finished_work_matches_render_phase: finished_work == render.work_in_progress(),
                records_accepted_finished_work_metadata: true,
                public_create_behavior_available: false,
                host_mutation_execution_blocked: true,
                effects_refs_and_hydration_blocked: true,
                compatibility_claimed: false,
            };

        Ok(TestRendererRootCreatePreflightDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS,
            root: root.root_id(),
            input_shape,
            root_options,
            canary_api_identity,
            scheduled_update_kind,
            scheduled_element,
            container_update_api: scheduled_update_kind.container_update_api(),
            scheduler_api: "ensure_root_is_scheduled",
            work_loop_finished_work_preflight,
            private_rust_root_created: true,
            private_root_canary_boundary_validated: true,
            public_renderer_root_created: false,
            public_root_available: false,
            native_addon_loaded: false,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: false,
            host_output_produced_from_js: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_root_create_preflight_from_render_for_canary(
        &self,
        input_shape: TestRendererRootCreatePreflightInputShape,
        canary_api_identity: TestRendererRootCreatePreflightCanaryApiIdentity,
        work_loop_metadata: Option<TestRendererRootWorkLoopFinishedWorkPreflightMetadata>,
        render: HostRootRenderPhaseRecord,
    ) -> Result<TestRendererRootCreatePreflightDiagnostics, TestRendererRootError> {
        if !input_shape
            .child_shape()
            .is_supported_for_create_preflight()
        {
            return Err(TestRendererRootCreatePreflightError::UnsupportedChildren {
                child_shape: input_shape.child_shape(),
            }
            .into());
        }

        if !canary_api_identity.is_current() {
            let current = TestRendererRootCreatePreflightCanaryApiIdentity::current();
            return Err(TestRendererRootCreatePreflightError::StaleCanaryMetadata {
                expected_metadata_id: current.metadata_id(),
                actual_metadata_id: canary_api_identity.metadata_id(),
                expected_root_api: current.root_api(),
                actual_root_api: canary_api_identity.root_api(),
            }
            .into());
        }

        let Some(work_loop_metadata) = work_loop_metadata else {
            return Err(
                TestRendererRootCreatePreflightError::MissingWorkLoopFinishedWorkPreflightMetadata
                    .into(),
            );
        };
        if !work_loop_metadata.is_current() {
            let current = TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current();
            return Err(
                TestRendererRootCreatePreflightError::StaleWorkLoopFinishedWorkPreflightMetadata {
                    expected_metadata_id: current.metadata_id(),
                    actual_metadata_id: work_loop_metadata.metadata_id(),
                    expected_render_phase_api: current.render_phase_api(),
                    actual_render_phase_api: work_loop_metadata.render_phase_api(),
                }
                .into(),
            );
        }

        let scheduled_update = self
            .last_scheduled_update()
            .expect("TestRendererRoot::create schedules an initial HostRoot update");
        let scheduled_update_kind = scheduled_update.kind();
        let scheduled_element = scheduled_update.element();
        let previous_current = render.current();
        let finished_work = render.finished_work();
        let work_loop_finished_work_preflight =
            TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics {
                row_id: TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_ROW_ID,
                status: TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_STATUS,
                metadata: work_loop_metadata,
                root: self.root_id(),
                previous_current: TestRendererFiberHandleDiagnostics {
                    arena_id: previous_current.arena_id().get(),
                    slot: previous_current.slot().get(),
                    generation: previous_current.generation().get(),
                },
                finished_work: TestRendererFiberHandleDiagnostics {
                    arena_id: finished_work.arena_id().get(),
                    slot: finished_work.slot().get(),
                    generation: finished_work.generation().get(),
                },
                resulting_element: render.resulting_element(),
                scheduled_update_kind,
                render_lanes_empty: render.render_lanes().is_empty(),
                remaining_lanes_empty: render.remaining_lanes().is_empty(),
                finished_work_matches_render_phase: finished_work == render.work_in_progress(),
                records_accepted_finished_work_metadata: true,
                public_create_behavior_available: false,
                host_mutation_execution_blocked: true,
                effects_refs_and_hydration_blocked: true,
                compatibility_claimed: false,
            };

        Ok(TestRendererRootCreatePreflightDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS,
            root: self.root_id(),
            input_shape,
            root_options: TestRendererRootCreatePreflightOptionsMetadata::from_options(
                &self.options,
            ),
            canary_api_identity,
            scheduled_update_kind,
            scheduled_element,
            container_update_api: scheduled_update_kind.container_update_api(),
            scheduler_api: "ensure_root_is_scheduled",
            work_loop_finished_work_preflight,
            private_rust_root_created: true,
            private_root_canary_boundary_validated: true,
            public_renderer_root_created: false,
            public_root_available: false,
            native_addon_loaded: false,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: false,
            host_output_produced_from_js: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_create_route_admission_for_canary(
        root_create_preflight: Option<TestRendererRootCreatePreflightDiagnostics>,
        rust_admission_metadata: Option<TestRendererPrivateCreateRouteAdmissionMetadata>,
    ) -> Result<TestRendererPrivateCreateRouteAdmissionDiagnostics, TestRendererRootError> {
        let Some(rust_admission_metadata) = rust_admission_metadata else {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::MissingRustAdmissionRecord.into(),
            );
        };
        if !rust_admission_metadata.is_current() {
            let current = TestRendererPrivateCreateRouteAdmissionMetadata::current();
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleRustAdmissionRecord {
                    expected_metadata_id: current.metadata_id(),
                    actual_metadata_id: rust_admission_metadata.metadata_id(),
                    expected_root_api: current.root_api(),
                    actual_root_api: rust_admission_metadata.root_api(),
                }
                .into(),
            );
        }

        let Some(root_create_preflight) = root_create_preflight else {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::MissingRootCreatePreflight.into(),
            );
        };
        if root_create_preflight.diagnostic_name()
            != TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME
            || root_create_preflight.status() != TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS
        {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleRootCreatePreflight {
                    expected_diagnostic_name:
                        TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME,
                    actual_diagnostic_name: root_create_preflight.diagnostic_name(),
                    expected_status: TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS,
                    actual_status: root_create_preflight.status(),
                }
                .into(),
            );
        }

        let work_loop_finished_work_preflight =
            root_create_preflight.work_loop_finished_work_preflight();
        let work_loop_metadata = work_loop_finished_work_preflight.metadata();
        if !work_loop_metadata.is_current() {
            let current = TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current();
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleWorkLoopFinishedWorkPreflight {
                    expected_metadata_id: current.metadata_id(),
                    actual_metadata_id: work_loop_metadata.metadata_id(),
                    expected_render_phase_api: current.render_phase_api(),
                    actual_render_phase_api: work_loop_metadata.render_phase_api(),
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateCreateRouteAdmissionDiagnostics {
            record_id: TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID,
            diagnostic_name: TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS,
            root: root_create_preflight.root(),
            operation: "create",
            public_surface: "create()",
            js_facade_metadata_source: "FastReactTestRendererPrivateRootRequestRecord",
            rust_admission_metadata,
            root_create_preflight,
            work_loop_finished_work_preflight,
            scheduled_update_kind: root_create_preflight.scheduled_update_kind(),
            scheduled_element: root_create_preflight.scheduled_element(),
            rust_outcome: "Scheduled",
            consumes_js_facade_create_metadata: true,
            consumes_accepted_rust_root_create_execution_evidence: true,
            consumes_accepted_rust_root_create_preflight_diagnostics: true,
            consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata: true,
            missing_rust_admission_record_rejection: true,
            stale_rust_admission_record_rejection: true,
            public_renderer_root_created: false,
            public_root_available: false,
            public_create_behavior_available: false,
            public_serialization_available: false,
            native_addon_loaded: false,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: false,
            reconciler_execution_from_js: false,
            host_output_produced_from_js: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_create_native_bridge_host_output_handoff_for_canary(
        &self,
        admission: &TestRendererPrivateCreateRouteAdmissionDiagnostics,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateCreateNativeBridgeHostOutputHandoff, TestRendererRootError> {
        self.validate_private_create_native_bridge_host_output_handoff_for_canary(
            admission, output,
        )?;

        let gate = self.require_serialization_gate_ready_for_canary(output.commit())?;
        let shape =
            Self::private_to_json_host_output_shape_from_snapshot(output.snapshot()).shape();
        if shape != TestRendererPrivateToJsonHostOutputShape::SingleHostText {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::UnexpectedCreateHostOutputShape {
                    expected: TestRendererPrivateToJsonHostOutputShape::SingleHostText,
                    actual: shape,
                }
                .into(),
            );
        }
        Self::validate_private_json_canary_current_fibers(
            output.fiber_inspection(),
            output.completed_fibers().current(),
        )?;

        let host_output = gate.host_output();
        if host_output.container_child_count() != 1
            || host_output.instance_count() != 1
            || host_output.text_count() != 1
            || !host_output.real_host_output_available()
        {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "host-output-counts-not-minimal-single-host-text",
                }
                .into(),
            );
        }

        let render_finished_work_handle = output.render().finished_work();
        let commit_current_handle = output.commit().current();
        let render_finished_work = TestRendererFiberHandleDiagnostics {
            arena_id: render_finished_work_handle.arena_id().get(),
            slot: render_finished_work_handle.slot().get(),
            generation: render_finished_work_handle.generation().get(),
        };
        let commit_current = TestRendererFiberHandleDiagnostics {
            arena_id: commit_current_handle.arena_id().get(),
            slot: commit_current_handle.slot().get(),
            generation: commit_current_handle.generation().get(),
        };
        let work_loop_finished_work_preflight = admission.work_loop_finished_work_preflight();

        Ok(TestRendererPrivateCreateNativeBridgeHostOutputHandoff {
            diagnostic_id:
                TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS,
            root: self.root_id,
            operation: "create",
            public_surface: "create()",
            create_route_admission_record_id: admission.record_id(),
            create_route_admission_status: admission.status(),
            scheduled_update_kind: admission.scheduled_update_kind(),
            scheduled_element: admission.scheduled_element(),
            host_output_update_kind: TestRendererRootUpdateKind::Create,
            host_output_shape: shape,
            host_output,
            serialization_gate_status: gate.status(),
            render_finished_work,
            commit_current,
            work_loop_finished_work_preflight,
            render_finished_work_matches_create_route_preflight: render_finished_work
                == work_loop_finished_work_preflight.finished_work(),
            commit_current_matches_render_finished_work: commit_current == render_finished_work,
            minimal_tree_host_output_consumes_root_finished_work: true,
            create_route_admission_accepted: true,
            host_output_handoff_accepted: true,
            actual_rust_create_host_output_handoff: true,
            host_output_produced_by_rust: true,
            public_create_behavior_available: false,
            public_serialization_available: false,
            public_test_instance_available: false,
            native_addon_loaded: false,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: false,
            host_output_produced_from_js: false,
            compatibility_claimed: false,
        })
    }

    fn validate_private_create_native_bridge_host_output_handoff_for_canary(
        &self,
        admission: &TestRendererPrivateCreateRouteAdmissionDiagnostics,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<(), TestRendererRootError> {
        if admission.record_id() != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID
            || admission.diagnostic_name()
                != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_DIAGNOSTIC_NAME
            || admission.status() != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS
            || admission.operation() != "create"
            || admission.public_surface() != "create()"
        {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "create-route-admission-identity-mismatch",
                }
                .into(),
            );
        }
        if admission.root() != self.root_id {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "create-route-admission-root-mismatch",
                }
                .into(),
            );
        }
        if admission.scheduled_update_kind() != TestRendererRootUpdateKind::Create {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "create-route-admission-update-kind-mismatch",
                }
                .into(),
            );
        }

        let Some(scheduled_update) = self.scheduled_updates.last() else {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "missing-scheduled-create-update",
                }
                .into(),
            );
        };
        if scheduled_update.kind() != TestRendererRootUpdateKind::Create {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "scheduled-update-kind-mismatch",
                }
                .into(),
            );
        }
        if scheduled_update.element() != admission.scheduled_element() {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "scheduled-element-mismatch",
                }
                .into(),
            );
        }

        let render = output.render();
        let commit = output.commit();
        if render.root() != self.root_id || commit.root() != self.root_id {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "host-output-root-mismatch",
                }
                .into(),
            );
        }
        if render.resulting_element() != admission.scheduled_element() {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "host-output-resulting-element-mismatch",
                }
                .into(),
            );
        }
        if commit.current() != render.finished_work() {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "commit-current-finished-work-mismatch",
                }
                .into(),
            );
        }
        let work_loop_finished_work_preflight = admission.work_loop_finished_work_preflight();
        let render_finished_work = TestRendererFiberHandleDiagnostics {
            arena_id: render.finished_work().arena_id().get(),
            slot: render.finished_work().slot().get(),
            generation: render.finished_work().generation().get(),
        };
        if work_loop_finished_work_preflight.finished_work() != render_finished_work {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "create-route-admission-finished-work-mismatch",
                }
                .into(),
            );
        }
        if !work_loop_finished_work_preflight.finished_work_matches_render_phase()
            || !work_loop_finished_work_preflight.records_accepted_finished_work_metadata()
        {
            return Err(
                TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                    reason: "create-route-admission-work-loop-preflight-not-accepted",
                }
                .into(),
            );
        }

        Ok(())
    }

    pub fn describe_private_error_boundary_diagnostics_for_canary(
        &self,
    ) -> Result<TestRendererPrivateErrorBoundaryDiagnostics, TestRendererRootError> {
        self.describe_private_error_boundary_diagnostics_with_dependencies(
            TestRendererPrivateErrorBoundaryDependencyDiagnostics::root_options_only(),
        )
    }

    pub fn describe_private_error_boundary_update_diagnostics_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateErrorBoundaryDiagnostics, TestRendererRootError> {
        let serialization =
            self.describe_private_json_serialization_after_update_for_canary(output)?;
        let query =
            self.describe_private_test_instance_find_by_query_after_update_for_canary(output)?;
        let finished_work = output.commit().current();
        let passive_metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
            self.root_id,
            TestRendererFiberHandleDiagnostics {
                arena_id: finished_work.arena_id().get(),
                slot: finished_work.slot().get(),
                generation: finished_work.generation().get(),
            },
            0,
            0,
        );
        let act_diagnostics =
            self.consume_private_act_pending_passive_flush_metadata_for_canary(passive_metadata);
        let dependency_diagnostics = TestRendererPrivateErrorBoundaryDependencyDiagnostics {
            update_route_diagnostics_available: true,
            serialization_diagnostics_available: serialization.host_output_update_kind()
                == TestRendererRootUpdateKind::Update
                && serialization.host_output_snapshot_current(),
            test_instance_query_diagnostics_available: query.host_output_update_kind()
                == TestRendererRootUpdateKind::Update
                && query.host_output_snapshot_current(),
            act_scheduler_metadata_available: act_diagnostics.metadata_root_matches_renderer_root()
                && act_diagnostics.consumes_pending_passive_flush_metadata()
                && act_diagnostics.consumes_accepted_scheduler_flush_metadata()
                && act_diagnostics.private_scheduler_flush_request_metadata_consumed(),
            public_renderer_roots_executed: false,
            public_lifecycle_methods_executed: false,
            error_boundary_recovery_executed: false,
            compatibility_claimed: false,
        };

        self.describe_private_error_boundary_diagnostics_with_dependencies(dependency_diagnostics)
    }

    pub fn describe_private_error_boundary_update_native_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateErrorBoundaryNativeExecutionEvidence, TestRendererRootError>
    {
        self.describe_private_error_boundary_commit_recovery_for_canary(output, execution)
    }

    pub fn describe_private_error_boundary_commit_recovery_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateErrorBoundaryNativeExecutionEvidence, TestRendererRootError>
    {
        let diagnostics =
            self.describe_private_error_boundary_update_diagnostics_for_canary(output)?;
        self.validate_private_error_boundary_update_native_execution_for_canary(
            &diagnostics,
            execution,
        )?;

        let rows = *diagnostics.rows();
        let consumes_update_error_row = rows
            .iter()
            .any(|row| row.phase() == TestRendererPrivateErrorDiagnosticPhase::Update);
        let consumes_commit_error_row = rows
            .iter()
            .any(|row| row.phase() == TestRendererPrivateErrorDiagnosticPhase::Commit);
        let commit_recovery_metadata =
            TestRendererPrivateErrorBoundaryCommitRecoveryMetadata::from_update_execution_for_canary(
                self.root_id,
                execution,
                diagnostics.root_error_options(),
            );
        if !commit_recovery_metadata.accepted_private_commit_phase_recovery_metadata() {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "commit-recovery-metadata-not-accepted",
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateErrorBoundaryNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation: "update",
            public_surface: "create().update error boundary",
            update_failure_path: "update",
            source_execution_record_id:
                TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            source_execution_status: TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS,
            source_execution_scheduled_update_kind: execution.scheduled_update_kind(),
            host_output_update_kind: execution.host_output_update_kind(),
            error_diagnostics: diagnostics,
            commit_recovery_metadata,
            rows,
            row_count: rows.len(),
            consumes_accepted_root_execution_diagnostics: true,
            consumes_accepted_native_update_execution_record: true,
            consumes_private_error_boundary_diagnostics: true,
            consumes_private_commit_recovery_metadata: true,
            consumes_accepted_rust_failure_metadata: true,
            preserves_root_error_option_handles: true,
            consumes_update_error_row,
            consumes_commit_error_row,
            root_error_update_scheduled: false,
            public_root_error_callbacks_invoked: false,
            public_error_boundary_behavior_available: false,
            error_boundary_recovery_executed: false,
            public_error_recovery_available: false,
            public_commit_phase_recovery_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            rust_execution_from_js: execution.rust_execution_from_js(),
            reconciler_execution_from_js: execution.reconciler_execution_from_js(),
            compatibility_claimed: false,
        })
    }

    fn validate_private_error_boundary_update_native_execution_for_canary(
        &self,
        diagnostics: &TestRendererPrivateErrorBoundaryDiagnostics,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<(), TestRendererRootError> {
        if execution.root() != self.root_id {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RootMismatch {
                    expected: self.root_id,
                    actual: execution.root(),
                }
                .into(),
            );
        }
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "update-native-bridge-admission-diagnostic-id",
                }
                .into(),
            );
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "update-native-bridge-admission-status",
                }
                .into(),
            );
        }
        if execution.scheduled_update_kind() != TestRendererRootUpdateKind::Update {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "scheduled-update-kind",
                }
                .into(),
            );
        }
        if execution.host_output_update_kind() != TestRendererRootUpdateKind::Update {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "host-output-update-kind",
                }
                .into(),
            );
        }
        if !(execution.update_route_admission_accepted()
            && execution.lifecycle_evidence_accepted()
            && execution.root_work_loop_handoff_accepted()
            && execution.host_output_handoff_accepted()
            && execution.text_update_apply_recorded()
            && execution.host_text_update_apply_count() == 1
            && execution.host_component_update_apply_count() == 1
            && execution.rust_execution_from_js()
            && execution.reconciler_execution_from_js())
        {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "update-execution-admission-not-accepted",
                }
                .into(),
            );
        }
        if execution.native_bridge_available()
            || execution.native_execution()
            || execution.public_update_compatibility_claimed()
            || execution.public_serialization_available()
            || execution.act_flushing_claimed()
            || execution.compatibility_claimed()
        {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::PublicRecoveryOpened {
                    reason: "update-execution-record-claimed-public-behavior",
                }
                .into(),
            );
        }
        if diagnostics.root() != self.root_id
            || diagnostics.host_output_update_kind() != TestRendererRootUpdateKind::Update
            || !diagnostics
                .dependency_diagnostics()
                .update_commit_rows_ready()
        {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                    reason: "error-boundary-update-diagnostics-not-ready",
                }
                .into(),
            );
        }
        if diagnostics.public_error_boundary_behavior_available()
            || diagnostics.public_root_error_callbacks_invoked()
            || diagnostics.compatibility_claimed()
        {
            return Err(
                TestRendererPrivateErrorBoundaryNativeExecutionError::PublicRecoveryOpened {
                    reason: "error-boundary-diagnostics-claimed-public-recovery",
                }
                .into(),
            );
        }

        Ok(())
    }

    fn describe_private_error_boundary_diagnostics_with_dependencies(
        &self,
        dependency_diagnostics: TestRendererPrivateErrorBoundaryDependencyDiagnostics,
    ) -> Result<TestRendererPrivateErrorBoundaryDiagnostics, TestRendererRootError> {
        let root_options = self.store.root(self.root_id)?.options();
        let root_error_options = TestRendererRootErrorOptionDiagnostics {
            on_uncaught_error: root_options.on_uncaught_error(),
            on_caught_error: root_options.on_caught_error(),
            on_recoverable_error: root_options.on_recoverable_error(),
            root_error_option_metadata_available: true,
            public_root_error_callbacks_invoked: false,
            public_error_boundary_behavior_available: false,
            compatibility_claimed: false,
        };
        let rows = [
            self.create_private_error_diagnostic_row(
                TestRendererPrivateErrorDiagnosticPhase::Update,
                root_error_options,
                dependency_diagnostics,
            ),
            self.create_private_error_diagnostic_row(
                TestRendererPrivateErrorDiagnosticPhase::Commit,
                root_error_options,
                dependency_diagnostics,
            ),
        ];

        Ok(TestRendererPrivateErrorBoundaryDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS,
            root: self.root_id,
            host_output_update_kind: TestRendererRootUpdateKind::Update,
            root_error_options,
            dependency_diagnostics,
            rows,
            public_error_boundary_behavior_available: false,
            public_root_error_callbacks_invoked: false,
            compatibility_claimed: false,
        })
    }

    #[must_use]
    pub fn consume_private_act_pending_passive_flush_metadata_for_canary(
        &self,
        metadata: TestRendererPrivateActPendingPassiveFlushMetadata,
    ) -> TestRendererPrivateActPassiveEffectDrainDiagnostics {
        TestRendererPrivateActPassiveEffectDrainDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_STATUS,
            accepted_reconciler_records:
                TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_ACCEPTED_RECORDS,
            metadata,
            metadata_root_matches_renderer_root: metadata.root() == self.root_id,
            consumes_pending_passive_flush_metadata: true,
            consumes_accepted_scheduler_flush_metadata: true,
            private_scheduler_flush_request_metadata_consumed: true,
            consumes_accepted_native_update_execution: false,
            private_update_native_bridge_admission: None,
            host_output_produced_from_native_update: false,
            executes_passive_effects: false,
            invokes_effect_callbacks: false,
            invokes_act_callback: false,
            public_update_compatibility_claimed: false,
            public_act_compatibility_claimed: false,
            compatibility_claimed: false,
        }
    }

    #[must_use]
    pub fn consume_private_act_update_native_execution_and_pending_passive_flush_metadata_for_canary(
        &self,
        admission: TestRendererUpdateNativeBridgeAdmission,
        metadata: TestRendererPrivateActPendingPassiveFlushMetadata,
    ) -> TestRendererPrivateActPassiveEffectDrainDiagnostics {
        TestRendererPrivateActPassiveEffectDrainDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_STATUS,
            accepted_reconciler_records:
                TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_ACCEPTED_RECORDS,
            metadata,
            metadata_root_matches_renderer_root: metadata.root() == self.root_id
                && admission.root() == self.root_id,
            consumes_pending_passive_flush_metadata: true,
            consumes_accepted_scheduler_flush_metadata: true,
            private_scheduler_flush_request_metadata_consumed: true,
            consumes_accepted_native_update_execution: admission.update_route_admission_accepted()
                && admission.lifecycle_evidence_accepted()
                && admission.root_work_loop_handoff_accepted()
                && admission.host_output_handoff_accepted()
                && admission.rust_execution_from_js()
                && admission.reconciler_execution_from_js(),
            private_update_native_bridge_admission: Some(admission),
            host_output_produced_from_native_update: admission.host_output_handoff_accepted()
                && admission.text_update_apply_recorded(),
            executes_passive_effects: false,
            invokes_effect_callbacks: false,
            invokes_act_callback: false,
            public_update_compatibility_claimed: false,
            public_act_compatibility_claimed: false,
            compatibility_claimed: false,
        }
    }

    pub fn describe_private_act_nested_scope_passive_flush_for_canary(
        &self,
        metadata: TestRendererPrivateActPendingPassiveFlushMetadata,
    ) -> Result<TestRendererPrivateActNestedScopePassiveFlushDiagnostics, TestRendererRootError>
    {
        if metadata.root() != self.root_id {
            return Err(
                TestRendererPrivateActNestedScopePassiveFlushError::RootMismatch {
                    expected: self.root_id,
                    actual: metadata.root(),
                }
                .into(),
            );
        }
        if metadata.pending_record_count() == 0 {
            return Err(
                TestRendererPrivateActNestedScopePassiveFlushError::RecordMismatch {
                    reason: "missing-pending-passive-work",
                }
                .into(),
            );
        }

        let passive_drain =
            self.consume_private_act_pending_passive_flush_metadata_for_canary(metadata);
        if !passive_drain.metadata_root_matches_renderer_root()
            || !passive_drain.consumes_pending_passive_flush_metadata()
            || !passive_drain.consumes_accepted_scheduler_flush_metadata()
            || !passive_drain.private_scheduler_flush_request_metadata_consumed()
        {
            return Err(
                TestRendererPrivateActNestedScopePassiveFlushError::RecordMismatch {
                    reason: "passive-drain-metadata-not-accepted",
                }
                .into(),
            );
        }
        if passive_drain.executes_passive_effects()
            || passive_drain.invokes_effect_callbacks()
            || passive_drain.invokes_act_callback()
            || passive_drain.public_act_compatibility_claimed()
            || passive_drain.compatibility_claimed()
        {
            return Err(
                TestRendererPrivateActNestedScopePassiveFlushError::PublicActOpened {
                    reason: "passive-drain-claimed-public-execution",
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateActNestedScopePassiveFlushDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_STATUS,
            passive_drain,
            flush_order: TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_ORDER,
            outer_scope_depth: 1,
            inner_scope_depth: 2,
            passive_flush_order_index: 2,
            pending_unmount_count: metadata.pending_unmount_count(),
            pending_mount_count: metadata.pending_mount_count(),
            pending_passive_record_count: metadata.pending_record_count(),
            nested_scope_metadata_accepted: true,
            private_passive_flush_metadata_accepted: true,
            drains_accepted_pending_passive_flush_metadata: true,
            deterministic_flush_order: true,
            public_act_scope_depth_tracking_available: false,
            public_nested_act_queue_reuse_available: false,
            public_overlapping_act_warning_emission_available: false,
            invokes_act_callback: false,
            executes_passive_effects: false,
            invokes_effect_callbacks: false,
            public_act_compatibility_claimed: false,
            compatibility_claimed: false,
        })
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

    pub fn describe_private_update_route_via_root_work_loop_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateUpdateRouteDiagnostics, TestRendererRootError> {
        if self.lifecycle != TestRendererRootLifecycle::Active {
            return Err(TestRendererPrivateUpdateRouteError::RootNotActive {
                lifecycle: self.lifecycle,
            }
            .into());
        }
        self.validate_serialization_gate_commit(output.commit())?;

        let Some(scheduled_update) = self.scheduled_updates.last() else {
            return Err(TestRendererPrivateUpdateRouteError::MissingScheduledUpdate.into());
        };
        if scheduled_update.kind() != TestRendererRootUpdateKind::Update {
            return Err(
                TestRendererPrivateUpdateRouteError::UnexpectedScheduledUpdateKind {
                    actual: scheduled_update.kind(),
                }
                .into(),
            );
        }

        let render = output.render();
        let commit = output.commit();
        if render.root() != self.root_id {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "render-root-mismatch",
                }
                .into(),
            );
        }
        if commit.current() != render.finished_work() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "commit-current-finished-work-mismatch",
                }
                .into(),
            );
        }
        if commit.previous_current() != render.current() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "commit-previous-current-mismatch",
                }
                .into(),
            );
        }
        if commit.finished_lanes() != render.render_lanes() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "commit-finished-lanes-mismatch",
                }
                .into(),
            );
        }
        if render.applied_update_count() != 1 || render.skipped_update_count() != 0 {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "unexpected-render-update-counts",
                }
                .into(),
            );
        }
        if scheduled_update.element() != render.resulting_element() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "scheduled-element-mismatch",
                }
                .into(),
            );
        }
        if scheduled_update.container_update().queue() != render.current_update_queue() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "update-queue-mismatch",
                }
                .into(),
            );
        }
        if scheduled_update
            .container_update()
            .pending_lanes_after_enqueue()
            != render.render_lanes()
        {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "pending-lanes-mismatch",
                }
                .into(),
            );
        }
        if scheduled_update.container_update().selected_next_lanes() != render.render_lanes() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "selected-lanes-mismatch",
                }
                .into(),
            );
        }

        let committed_current_update_queue = self
            .store
            .fiber_arena()
            .get(commit.current())
            .map_err(FiberRootStoreError::from)?
            .update_queue();
        if committed_current_update_queue != render.work_in_progress_update_queue() {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "committed-current-queue-mismatch",
                }
                .into(),
            );
        }

        let updated_fibers = output.updated_fibers();
        let text_update_apply_recorded = commit.has_test_only_host_text_update_apply_for_canary(
            updated_fibers.previous().text(),
            updated_fibers.current().text(),
            updated_fibers.text_state_node_raw(),
        );
        if !text_update_apply_recorded {
            return Err(TestRendererPrivateUpdateRouteError::MissingHostTextUpdateApply.into());
        }
        let Some(TestNodeSnapshot::Element(previous_component)) =
            output.previous_snapshot().children().first()
        else {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "previous-host-component-snapshot-missing",
                }
                .into(),
            );
        };
        let Some(TestNodeSnapshot::Element(current_component)) =
            output.snapshot().children().first()
        else {
            return Err(
                TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                    reason: "current-host-component-snapshot-missing",
                }
                .into(),
            );
        };
        let host_component_prop_update_recorded =
            previous_component.props().attributes() != current_component.props().attributes();
        let host_component_style_update_recorded =
            previous_component.props().styles() != current_component.props().styles();

        let schedule_fiber = scheduled_update.container_update().schedule().fiber();
        let render_current = render.current();
        let render_finished_work = render.finished_work();
        let commit_current = commit.current();
        Ok(TestRendererPrivateUpdateRouteDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS,
            root: self.root_id,
            host_output_update_kind: TestRendererRootUpdateKind::Update,
            update_queue: TestRendererPrivateUpdateRouteQueueDiagnostics {
                root: scheduled_update.container_update().schedule().root(),
                scheduled_update_kind: scheduled_update.kind(),
                scheduled_element: scheduled_update.element(),
                update_raw: scheduled_update.container_update().update().raw(),
                queue_raw: scheduled_update.container_update().queue().raw(),
                schedule_fiber: TestRendererFiberHandleDiagnostics {
                    arena_id: schedule_fiber.arena_id().get(),
                    slot: schedule_fiber.slot().get(),
                    generation: schedule_fiber.generation().get(),
                },
                lane_bits: scheduled_update.container_update().lane().bits(),
                pending_lanes_before_enqueue_bits: scheduled_update
                    .container_update()
                    .pending_lanes_before_enqueue()
                    .bits(),
                pending_lanes_after_enqueue_bits: scheduled_update
                    .container_update()
                    .pending_lanes_after_enqueue()
                    .bits(),
                selected_next_lanes_bits: scheduled_update
                    .container_update()
                    .selected_next_lanes()
                    .bits(),
                render_lanes_bits: render.render_lanes().bits(),
                queue_matches_render_current_queue: scheduled_update.container_update().queue()
                    == render.current_update_queue(),
                selected_lanes_match_render_lanes: scheduled_update
                    .container_update()
                    .selected_next_lanes()
                    == render.render_lanes(),
                pending_lanes_after_enqueue_match_render_lanes: scheduled_update
                    .container_update()
                    .pending_lanes_after_enqueue()
                    == render.render_lanes(),
                root_schedule_inserted: scheduled_update.root_schedule().inserted(),
                root_schedule_microtask_requested: scheduled_update
                    .root_schedule()
                    .microtask()
                    .is_some(),
                root_schedule_might_have_pending_sync_work: scheduled_update
                    .root_schedule()
                    .might_have_pending_sync_work(),
            },
            root_work_loop: TestRendererPrivateUpdateRouteWorkLoopDiagnostics {
                root: render.root(),
                render_current: TestRendererFiberHandleDiagnostics {
                    arena_id: render_current.arena_id().get(),
                    slot: render_current.slot().get(),
                    generation: render_current.generation().get(),
                },
                render_finished_work: TestRendererFiberHandleDiagnostics {
                    arena_id: render_finished_work.arena_id().get(),
                    slot: render_finished_work.slot().get(),
                    generation: render_finished_work.generation().get(),
                },
                commit_current: TestRendererFiberHandleDiagnostics {
                    arena_id: commit_current.arena_id().get(),
                    slot: commit_current.slot().get(),
                    generation: commit_current.generation().get(),
                },
                current_update_queue_raw: render.current_update_queue().raw(),
                work_in_progress_update_queue_raw: render.work_in_progress_update_queue().raw(),
                committed_current_update_queue_raw: committed_current_update_queue.raw(),
                applied_update_count: render.applied_update_count(),
                skipped_update_count: render.skipped_update_count(),
                remaining_lanes_empty: render.remaining_lanes().is_empty(),
                commit_finished_lanes_bits: commit.finished_lanes().bits(),
                commit_remaining_lanes_empty: commit.remaining_lanes().is_empty(),
                commit_pending_lanes_empty: commit.pending_lanes().is_empty(),
                commit_current_matches_render_finished_work: commit.current()
                    == render.finished_work(),
                commit_previous_current_matches_render_current: commit.previous_current()
                    == render.current(),
                commit_lanes_match_render_lanes: commit.finished_lanes() == render.render_lanes(),
                committed_current_queue_matches_work_in_progress: committed_current_update_queue
                    == render.work_in_progress_update_queue(),
                root_current_matches_commit_current: self.store.root(self.root_id)?.current()
                    == commit.current(),
            },
            host_text_update: TestRendererPrivateUpdateRouteHostTextDiagnostics {
                previous_text_fiber: TestRendererFiberHandleDiagnostics {
                    arena_id: updated_fibers.previous().text().arena_id().get(),
                    slot: updated_fibers.previous().text().slot().get(),
                    generation: updated_fibers.previous().text().generation().get(),
                },
                updated_text_fiber: TestRendererFiberHandleDiagnostics {
                    arena_id: updated_fibers.current().text().arena_id().get(),
                    slot: updated_fibers.current().text().slot().get(),
                    generation: updated_fibers.current().text().generation().get(),
                },
                text_state_node_raw: updated_fibers.text_state_node_raw(),
                host_component_prop_update_recorded,
                host_component_style_update_recorded,
                text_update_apply_recorded,
                host_text_update_apply_count: commit
                    .test_only_host_text_update_apply_count_for_canary(),
                host_component_update_apply_count: commit
                    .test_only_host_component_update_apply_count_for_canary(),
            },
            admission: TestRendererPrivateUpdateRouteAdmissionRecord {
                record_id: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
                status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
                public_surface: "create().update",
                root: self.root_id,
                request_api: "TestRendererRoot::update",
                source_diagnostic_name: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME,
                source_diagnostic_status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS,
                lifecycle: self.lifecycle,
                scheduled_update_kind: scheduled_update.kind(),
                host_output_update_kind: TestRendererRootUpdateKind::Update,
                consumes_accepted_host_root_update_queue_metadata: true,
                consumes_accepted_root_work_loop_metadata: true,
                consumes_accepted_host_output_metadata: true,
                rejects_stale_root_lifecycle: true,
                rejects_stale_host_output: true,
                rejects_missing_update_queue_evidence: true,
                public_root_update_available: false,
                public_serialization_available: false,
                native_execution_available: false,
                compatibility_claimed: false,
            },
            consumes_accepted_host_root_update_queue_metadata: true,
            consumes_accepted_root_work_loop_metadata: true,
            consumes_manual_host_output_canary: true,
            public_root_update_available: false,
            public_serialization_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_update_route_admission_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateUpdateRouteAdmissionRecord, TestRendererRootError> {
        Ok(self
            .describe_private_update_route_via_root_work_loop_for_canary(output)?
            .admission())
    }

    pub fn describe_private_update_native_bridge_admission_for_canary(
        &self,
        route_outcome: &TestRendererRootUpdateOutcome,
        handoff: Option<&TestRendererUpdatedHostOutput>,
    ) -> Result<TestRendererUpdateNativeBridgeAdmission, TestRendererRootError> {
        let Some(scheduled_update) = route_outcome.scheduled() else {
            return Err(
                TestRendererPrivateUpdateNativeBridgeAdmissionError::UnexpectedRouteOutcome {
                    actual: route_outcome.code(),
                }
                .into(),
            );
        };
        if scheduled_update.kind() != TestRendererRootUpdateKind::Update {
            return Err(
                TestRendererPrivateUpdateNativeBridgeAdmissionError::UnexpectedScheduledUpdateKind {
                    actual: scheduled_update.kind(),
                }
                .into(),
            );
        }
        if self.scheduled_updates.last() != Some(scheduled_update) {
            return Err(
                TestRendererPrivateUpdateNativeBridgeAdmissionError::StaleRouteOutcome.into(),
            );
        }

        let Some(handoff) = handoff else {
            return Err(
                TestRendererPrivateUpdateNativeBridgeAdmissionError::MissingHostOutputHandoff
                    .into(),
            );
        };
        let route = self.describe_private_update_route_via_root_work_loop_for_canary(handoff)?;
        let host_text_update = route.host_text_update();

        Ok(TestRendererUpdateNativeBridgeAdmission {
            diagnostic_id: TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS,
            root: self.root_id,
            route_dependency_id: TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID,
            update_route_admission_id: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            lifecycle: self.lifecycle,
            scheduled_update_kind: scheduled_update.kind(),
            host_output_update_kind: route.host_output_update_kind(),
            update_route_admission_accepted: route.admission().record_id()
                == TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            lifecycle_evidence_accepted: true,
            root_work_loop_handoff_accepted: true,
            host_output_handoff_accepted: true,
            host_component_prop_update_recorded: host_text_update
                .host_component_prop_update_recorded(),
            host_component_style_update_recorded: host_text_update
                .host_component_style_update_recorded(),
            text_update_apply_recorded: host_text_update.text_update_apply_recorded(),
            host_text_update_apply_count: host_text_update.host_text_update_apply_count(),
            host_component_update_apply_count: host_text_update.host_component_update_apply_count(),
            rejects_stale_update_handoffs: true,
            rejects_unmounted_roots: true,
            rejects_missing_host_output_handoff: true,
            public_update_compatibility_claimed: false,
            public_serialization_available: false,
            act_flushing_claimed: false,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: true,
            reconciler_execution_from_js: true,
            compatibility_claimed: false,
        })
    }

    pub fn render_and_admit_private_update_native_bridge_handoff_for_canary(
        &mut self,
        element_type: impl Into<TestElementType>,
        props: TestProps,
        text: impl Into<String>,
    ) -> Result<
        (
            TestRendererRootUpdateOutcome,
            TestRendererUpdatedHostOutput,
            TestRendererUpdateNativeBridgeAdmission,
        ),
        TestRendererRootError,
    > {
        let route_outcome =
            self.update_host_component_with_props_and_text_for_canary(element_type, props, text)?;
        let Some(handoff) = self.render_and_commit_host_output_update_for_canary()? else {
            return Err(
                TestRendererPrivateUpdateNativeBridgeAdmissionError::MissingHostOutputHandoff
                    .into(),
            );
        };
        let admission = self.describe_private_update_native_bridge_admission_for_canary(
            &route_outcome,
            Some(&handoff),
        )?;
        Ok((route_outcome, handoff, admission))
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
            None,
        )
    }

    pub fn describe_private_json_serialization_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateJsonSerializationReport, TestRendererRootError> {
        let host_output_row = Self::private_to_json_host_output_row(
            TestRendererRootUpdateKind::Update,
            output.previous_snapshot(),
            output.snapshot(),
        )?;
        self.describe_private_json_serialization_from_current_fibers_for_canary(
            output.commit(),
            Some(output.fiber_inspection()),
            output.updated_fibers().current(),
            output.snapshot(),
            TestRendererRootUpdateKind::Update,
            Some(host_output_row),
        )
    }

    pub fn describe_private_to_json_host_output_update_row_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        let report = self.describe_private_json_serialization_after_update_for_canary(output)?;
        report.host_output_row().ok_or_else(|| {
            TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                row_id: TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID,
                expected: TestRendererRootUpdateKind::Update,
                actual: TestRendererRootUpdateKind::Create,
            }
            .into()
        })
    }

    pub fn describe_private_to_json_nested_host_output_update_row_for_canary(
        &self,
        output: &TestRendererNestedHostParentPlacedHostOutput,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        self.validate_serialization_gate_commit(output.commit())?;

        let Some(last_update) = self.scheduled_updates.last() else {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Update,
                actual: TestRendererRootUpdateKind::Create,
            });
        };
        if last_update.kind() != TestRendererRootUpdateKind::Update {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Update,
                actual: last_update.kind(),
            });
        }

        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Err(TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale.into());
        }

        Self::private_to_json_host_output_row_with_shape(
            TestRendererRootUpdateKind::Update,
            TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID,
            Some(TestRendererPrivateToJsonHostOutputShape::NestedHostText),
            output.previous_snapshot(),
            output.snapshot(),
        )
    }

    pub fn describe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics(
        previous_snapshot: &TestContainerSnapshot,
        current_snapshot: &TestContainerSnapshot,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        Self::private_to_json_host_output_row_with_shape(
            TestRendererRootUpdateKind::Update,
            TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID,
            Some(TestRendererPrivateToJsonHostOutputShape::SiblingText),
            previous_snapshot,
            current_snapshot,
        )
    }

    pub fn describe_private_to_json_host_output_unmount_row_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        self.validate_serialization_gate_commit(output.commit())?;

        let Some(last_update) = self.scheduled_updates.last() else {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: TestRendererRootUpdateKind::Create,
            });
        };
        if last_update.kind() != TestRendererRootUpdateKind::Unmount {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: last_update.kind(),
            });
        }

        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Err(TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale.into());
        }
        if !output.snapshot().children().is_empty() {
            return Err(
                TestRendererPrivateJsonSerializationError::UnmountSnapshotNotEmpty {
                    actual: output.snapshot().children().len(),
                }
                .into(),
            );
        }
        if output.deleted_fibers().host_root() != output.commit().current() {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                    row_id: TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID,
                    expected: TestRendererRootUpdateKind::Unmount,
                    actual: TestRendererRootUpdateKind::Update,
                }
                .into(),
            );
        }

        Self::private_to_json_host_output_row(
            TestRendererRootUpdateKind::Unmount,
            output.previous_snapshot(),
            output.snapshot(),
        )
    }

    pub fn describe_private_unmount_deletion_commit_handoff_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
    ) -> Result<TestRendererUnmountDeletionCommitHandoffDiagnostics, TestRendererRootError> {
        self.validate_serialization_gate_commit(output.commit())?;

        let Some(last_update) = self.scheduled_updates.last() else {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: TestRendererRootUpdateKind::Create,
            });
        };
        if last_update.kind() != TestRendererRootUpdateKind::Unmount {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: last_update.kind(),
            });
        }

        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Err(TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale.into());
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

        let commit = output.commit();
        let render = output.render();
        let deleted = output.deleted_fibers();
        let commit_current = commit.current();
        let commit_previous_current = commit.previous_current();
        let render_finished_work = render.finished_work();
        let store_current = self.store.root(self.root_id)?.current();
        let cleanup_log = commit.host_node_deletion_cleanup_log();
        let cleanup_report = output.host_node_cleanup();
        let passive_ref_cleanup_order =
            Self::passive_ref_cleanup_order_evidence_for_canary(commit, cleanup_report);
        let cleanup_records_match_deletion_commit = cleanup_report.root() == commit.root()
            && cleanup_report.len() == cleanup_log.len()
            && cleanup_report
                .records()
                .iter()
                .zip(cleanup_log.records())
                .all(|(report_record, commit_record)| {
                    report_record.sequence() == commit_record.sequence()
                        && report_record.root() == commit_record.root()
                        && report_record.deletion_list_index()
                            == commit_record.deletion_list_index()
                        && report_record.deleted_index() == commit_record.deleted_index()
                        && report_record.subtree_index() == commit_record.subtree_index()
                        && report_record.parent() == fiber_handle!(commit_record.parent())
                        && report_record.deleted_root()
                            == fiber_handle!(commit_record.deleted_root())
                        && report_record.fiber() == fiber_handle!(commit_record.fiber())
                        && report_record.state_node_raw() == commit_record.state_node().raw()
                        && report_record.token_raw() == commit_record.token().raw()
                        && report_record.token_phase() == commit_record.token_phase()
                });
        let deletion_list_count = output.commit_diagnostics().deletion_lists().len();
        let deleted_root_count = output
            .commit_diagnostics()
            .deletion_lists()
            .iter()
            .map(|record| record.deleted().len())
            .sum();
        let host_child_detachment_blockers = TestRendererUnmountHostChildDetachmentBlockers {
            detached_instance: output.detached_instance_snapshot().is_detached(),
            detached_instance_child_count: output.detached_instance_snapshot().children().len(),
            host_node_cleanup_invalidated_count: cleanup_report
                .records()
                .iter()
                .filter(|record| record.status() == TestRendererHostNodeCleanupStatus::Invalidated)
                .count(),
            host_node_cleanup_already_inactive_count: cleanup_report
                .records()
                .iter()
                .filter(|record| {
                    record.status() == TestRendererHostNodeCleanupStatus::AlreadyInactive
                })
                .count(),
            host_node_cleanup_missing_host_node_count: cleanup_report
                .records()
                .iter()
                .filter(|record| {
                    record.status() == TestRendererHostNodeCleanupStatus::MissingHostNode
                })
                .count(),
            host_node_cleanup_missing_state_node_count: cleanup_report
                .records()
                .iter()
                .filter(|record| {
                    record.status() == TestRendererHostNodeCleanupStatus::MissingStateNode
                })
                .count(),
            broad_host_child_detachment_blocked: true,
            public_host_teardown_compatibility_claimed: false,
            public_unmount_compatibility_claimed: cleanup_report
                .public_unmount_compatibility_claimed(),
            act_flushing_claimed: false,
        };

        Ok(TestRendererUnmountDeletionCommitHandoffDiagnostics {
            diagnostic_id: TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_STATUS,
            root: commit.root(),
            lifecycle: self.lifecycle,
            scheduled_update_kind: last_update.kind(),
            scheduled_element: last_update.element(),
            scheduled_element_is_none: last_update.element() == RootElementHandle::NONE,
            render_current: fiber_handle!(render.current()),
            commit_previous_current: fiber_handle!(commit_previous_current),
            commit_current: fiber_handle!(commit_current),
            render_finished_work: fiber_handle!(render_finished_work),
            deleted_root: fiber_handle!(deleted.host_root()),
            deleted_component: fiber_handle!(deleted.deleted_component()),
            deleted_text: fiber_handle!(deleted.deleted_text()),
            commit_current_is_store_current: commit_current == store_current,
            render_current_matches_commit_previous_current: render.current()
                == commit_previous_current,
            render_finished_work_matches_commit_current: render_finished_work == commit_current,
            deletion_list_count,
            deleted_root_count,
            host_node_cleanup_count: cleanup_report.len(),
            cleanup_records_match_deletion_commit,
            cleanup_order_record_count: commit.deletion_cleanup_order_gate_for_canary().len(),
            public_unmount_compatibility_claimed: cleanup_report
                .public_unmount_compatibility_claimed(),
            public_host_teardown_compatibility_claimed: false,
            act_flushing_claimed: false,
            host_child_detachment_blockers,
            passive_ref_cleanup_order,
        })
    }

    fn passive_ref_cleanup_order_evidence_for_canary(
        commit: &HostRootCommitRecord,
        cleanup_report: &TestRendererHostNodeCleanupReport,
    ) -> TestRendererUnmountPassiveRefCleanupOrderEvidence {
        let order_gate = commit.deletion_cleanup_order_gate_for_canary();
        let first_host_node_cleanup_order = order_gate
            .records()
            .iter()
            .filter(|record| record.phase_name() == "host-node-cleanup")
            .map(|record| record.sequence())
            .min();
        let last_ref_cleanup_return_order = order_gate
            .records()
            .iter()
            .filter(|record| record.phase_name() == "ref-cleanup-return")
            .map(|record| record.sequence())
            .max();
        let first_passive_destroy_order = order_gate
            .records()
            .iter()
            .filter(|record| record.phase_name() == "passive-destroy")
            .map(|record| record.sequence())
            .min();
        let last_passive_destroy_order = order_gate
            .records()
            .iter()
            .filter(|record| record.phase_name() == "passive-destroy")
            .map(|record| record.sequence())
            .max();
        let ref_cleanup_return_precedes_passive_destroy =
            match (last_ref_cleanup_return_order, first_passive_destroy_order) {
                (Some(ref_order), Some(passive_order)) => ref_order < passive_order,
                _ => true,
            };
        let host_cleanup_follows_ref_cleanup_return =
            match (last_ref_cleanup_return_order, first_host_node_cleanup_order) {
                (Some(ref_order), Some(host_order)) => ref_order < host_order,
                (None, Some(_)) => true,
                _ => false,
            };
        let host_cleanup_follows_passive_destroy =
            match (last_passive_destroy_order, first_host_node_cleanup_order) {
                (Some(passive_order), Some(host_order)) => passive_order < host_order,
                (None, Some(_)) => true,
                _ => false,
            };
        let cleanup_order_record_count = order_gate.len();
        let native_cleanup_after_ref_and_passive_ordering =
            ref_cleanup_return_precedes_passive_destroy
                && host_cleanup_follows_ref_cleanup_return
                && host_cleanup_follows_passive_destroy
                && order_gate.host_node_cleanup_count() == cleanup_report.len()
                && cleanup_order_record_count
                    == order_gate.ref_cleanup_return_count()
                        + order_gate.passive_destroy_count()
                        + order_gate.host_node_cleanup_count()
                && !order_gate.ref_cleanup_return_callbacks_invoked()
                && !order_gate.passive_destroy_callbacks_invoked()
                && !order_gate.public_effects_flushed()
                && !order_gate.public_ref_or_effect_compatibility_claimed();

        TestRendererUnmountPassiveRefCleanupOrderEvidence {
            diagnostic_id: TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_STATUS,
            root: commit.root(),
            ref_cleanup_return_count: order_gate.ref_cleanup_return_count(),
            passive_destroy_count: order_gate.passive_destroy_count(),
            host_node_cleanup_count: order_gate.host_node_cleanup_count(),
            cleanup_order_record_count,
            first_host_node_cleanup_order,
            last_ref_cleanup_return_order,
            first_passive_destroy_order,
            last_passive_destroy_order,
            ref_cleanup_return_precedes_passive_destroy,
            host_cleanup_follows_ref_cleanup_return,
            host_cleanup_follows_passive_destroy,
            native_cleanup_after_ref_and_passive_ordering,
            minimal_tree_ordering_is_host_cleanup_only: order_gate.ref_cleanup_return_count() == 0
                && order_gate.passive_destroy_count() == 0
                && order_gate.host_node_cleanup_count() == cleanup_report.len()
                && cleanup_order_record_count == cleanup_report.len(),
            ref_cleanup_return_callbacks_invoked: order_gate.ref_cleanup_return_callbacks_invoked(),
            passive_destroy_callbacks_invoked: order_gate.passive_destroy_callbacks_invoked(),
            public_effects_flushed: order_gate.public_effects_flushed(),
            public_ref_or_effect_compatibility_claimed: order_gate
                .public_ref_or_effect_compatibility_claimed(),
            public_unmount_compatibility_claimed: cleanup_report
                .public_unmount_compatibility_claimed(),
            act_flushing_claimed: false,
        }
    }

    pub fn describe_private_unmount_native_bridge_admission_for_canary(
        &self,
        route_outcome: &TestRendererRootUpdateOutcome,
        handoff: Option<&TestRendererUnmountDeletionCommitHandoffDiagnostics>,
    ) -> Result<TestRendererUnmountNativeBridgeAdmission, TestRendererRootError> {
        let Some(scheduled_update) = route_outcome.scheduled() else {
            return Err(match route_outcome {
                TestRendererRootUpdateOutcome::AlreadyUnmountScheduled => {
                    TestRendererPrivateUnmountNativeBridgeAdmissionError::AlreadyUnmountedRoot
                }
                TestRendererRootUpdateOutcome::IgnoredAfterUnmount => {
                    TestRendererPrivateUnmountNativeBridgeAdmissionError::UnexpectedRouteOutcome {
                        actual: route_outcome.code(),
                    }
                }
                TestRendererRootUpdateOutcome::Scheduled(_) => unreachable!(),
            }
            .into());
        };
        if scheduled_update.kind() != TestRendererRootUpdateKind::Unmount {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::UnexpectedScheduledUpdateKind {
                    actual: scheduled_update.kind(),
                }
                .into(),
            );
        }
        if self.scheduled_updates.last() != Some(scheduled_update) {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleRouteOutcome.into(),
            );
        }

        let Some(handoff) = handoff.copied() else {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingDeletionCommitHandoff
                    .into(),
            );
        };
        self.validate_private_unmount_native_bridge_handoff_for_canary(scheduled_update, handoff)?;
        let passive_ref_cleanup_order = handoff.passive_ref_cleanup_order();

        Ok(TestRendererUnmountNativeBridgeAdmission {
            diagnostic_id: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS,
            root: self.root_id,
            route_dependency_id: TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID,
            deletion_commit_handoff_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID,
            cleanup_handoff_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID,
            lifecycle: handoff.lifecycle(),
            scheduled_update_kind: scheduled_update.kind(),
            scheduled_element_is_none: scheduled_update.element() == RootElementHandle::NONE,
            deletion_commit_handoff_accepted: true,
            cleanup_handoff_accepted: true,
            lifecycle_evidence_accepted: true,
            cleanup_blockers_accepted: true,
            passive_ref_cleanup_order_accepted: true,
            host_node_cleanup_count: handoff.host_node_cleanup_count(),
            ref_cleanup_return_count: passive_ref_cleanup_order.ref_cleanup_return_count(),
            passive_destroy_count: passive_ref_cleanup_order.passive_destroy_count(),
            cleanup_order_record_count: handoff.cleanup_order_record_count(),
            native_cleanup_after_ref_and_passive_ordering: passive_ref_cleanup_order
                .native_cleanup_after_ref_and_passive_ordering(),
            rust_unmount_cleanup_handoff_executed: true,
            host_output_produced: true,
            minimal_tree_cleanup_handoff: handoff.host_node_cleanup_count() == 2
                && handoff.cleanup_order_record_count() == 2
                && passive_ref_cleanup_order.minimal_tree_ordering_is_host_cleanup_only()
                && passive_ref_cleanup_order.native_cleanup_after_ref_and_passive_ordering(),
            rejects_already_unmounted_roots: true,
            rejects_stale_deletion_handoffs: true,
            rejects_missing_cleanup_blockers: true,
            public_unmount_compatibility_claimed: false,
            public_host_teardown_compatibility_claimed: false,
            act_flushing_claimed: false,
            native_bridge_available: false,
            native_execution: false,
        })
    }

    pub fn execute_private_unmount_native_bridge_cleanup_handoff_for_canary(
        &mut self,
    ) -> Result<TestRendererUnmountNativeBridgeCleanupHandoff, TestRendererRootError> {
        let route_outcome = self.unmount()?;
        let Some(unmounted) = self.render_and_commit_host_output_unmount_for_canary()? else {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingDeletionCommitHandoff
                    .into(),
            );
        };
        let handoff =
            self.describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)?;
        let admission = self.describe_private_unmount_native_bridge_admission_for_canary(
            &route_outcome,
            Some(&handoff),
        )?;
        let previous_root_child_count = unmounted.previous_snapshot().children().len();
        let current_root_child_count = unmounted.snapshot().children().len();
        let detached_instance = unmounted.detached_instance_snapshot().is_detached();
        let detached_instance_child_count = unmounted.detached_instance_snapshot().children().len();
        let passive_ref_cleanup_order = handoff.passive_ref_cleanup_order();
        let minimal_tree_cleanup_handoff = previous_root_child_count == 1
            && current_root_child_count == 0
            && detached_instance
            && detached_instance_child_count == 0
            && handoff.host_node_cleanup_count() == 2
            && handoff.cleanup_order_record_count() == 2
            && passive_ref_cleanup_order.minimal_tree_ordering_is_host_cleanup_only()
            && passive_ref_cleanup_order.native_cleanup_after_ref_and_passive_ordering();

        Ok(TestRendererUnmountNativeBridgeCleanupHandoff {
            diagnostic_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_STATUS,
            root: self.root_id,
            route_outcome: route_outcome.code(),
            route_dependency_id: TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID,
            deletion_commit_handoff_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID,
            admission_diagnostic_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            lifecycle: handoff.lifecycle(),
            scheduled_update_kind: handoff.scheduled_update_kind(),
            scheduled_element_is_none: handoff.scheduled_element_is_none(),
            previous_root_child_count,
            current_root_child_count,
            detached_instance,
            detached_instance_child_count,
            host_node_cleanup_count: handoff.host_node_cleanup_count(),
            ref_cleanup_return_count: passive_ref_cleanup_order.ref_cleanup_return_count(),
            passive_destroy_count: passive_ref_cleanup_order.passive_destroy_count(),
            cleanup_order_record_count: handoff.cleanup_order_record_count(),
            native_cleanup_after_ref_and_passive_ordering: passive_ref_cleanup_order
                .native_cleanup_after_ref_and_passive_ordering(),
            minimal_tree_cleanup_handoff,
            rust_unmount_cleanup_handoff_executed: true,
            host_output_produced: true,
            passive_ref_cleanup_order,
            deletion_commit_handoff: handoff,
            native_bridge_admission: admission,
            public_unmount_compatibility_claimed: false,
            public_host_teardown_compatibility_claimed: false,
            act_flushing_claimed: false,
            native_bridge_available: false,
            native_execution: false,
        })
    }

    fn validate_private_unmount_native_bridge_handoff_for_canary(
        &self,
        scheduled_update: &TestRendererRootScheduledUpdate,
        handoff: TestRendererUnmountDeletionCommitHandoffDiagnostics,
    ) -> Result<(), TestRendererRootError> {
        if handoff.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "diagnostic-id-mismatch",
                }
                .into(),
            );
        }
        if handoff.status() != TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_STATUS {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "diagnostic-status-mismatch",
                }
                .into(),
            );
        }
        if handoff.root() != self.root_id {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "root-mismatch",
                }
                .into(),
            );
        }
        if handoff.lifecycle() != self.lifecycle
            || handoff.lifecycle() != TestRendererRootLifecycle::UnmountScheduled
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "lifecycle-mismatch",
                }
                .into(),
            );
        }
        if handoff.scheduled_update_kind() != TestRendererRootUpdateKind::Unmount
            || scheduled_update.kind() != handoff.scheduled_update_kind()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "scheduled-update-kind-mismatch",
                }
                .into(),
            );
        }
        if scheduled_update.element() != RootElementHandle::NONE
            || handoff.scheduled_element() != RootElementHandle::NONE
            || !handoff.scheduled_element_is_none()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "scheduled-element-mismatch",
                }
                .into(),
            );
        }
        if !handoff.commit_current_is_store_current()
            || !handoff.render_current_matches_commit_previous_current()
            || !handoff.render_finished_work_matches_commit_current()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "commit-handoff-identity-mismatch",
                }
                .into(),
            );
        }
        if handoff.deletion_list_count() == 0 || handoff.deleted_root_count() == 0 {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "missing-deletion-list",
                }
                .into(),
            );
        }
        if handoff.host_node_cleanup_count() == 0 {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "missing-host-node-cleanup-records",
                }
                .into(),
            );
        }
        if !handoff.cleanup_records_match_deletion_commit() {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "cleanup-records-do-not-match-commit",
                }
                .into(),
            );
        }
        if handoff.cleanup_order_record_count() != handoff.host_node_cleanup_count() {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "cleanup-order-count-mismatch",
                }
                .into(),
            );
        }
        let passive_ref_cleanup_order = handoff.passive_ref_cleanup_order();
        if passive_ref_cleanup_order.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_DIAGNOSTIC_ID
            || passive_ref_cleanup_order.status()
                != TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_STATUS
            || passive_ref_cleanup_order.root() != self.root_id
            || passive_ref_cleanup_order.host_node_cleanup_count()
                != handoff.host_node_cleanup_count()
            || passive_ref_cleanup_order.cleanup_order_record_count()
                != handoff.cleanup_order_record_count()
            || !passive_ref_cleanup_order.ref_cleanup_return_precedes_passive_destroy()
            || !passive_ref_cleanup_order.host_cleanup_follows_ref_cleanup_return()
            || !passive_ref_cleanup_order.host_cleanup_follows_passive_destroy()
            || !passive_ref_cleanup_order.native_cleanup_after_ref_and_passive_ordering()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "passive-ref-cleanup-order-mismatch",
                }
                .into(),
            );
        }
        if passive_ref_cleanup_order.ref_cleanup_return_callbacks_invoked()
            || passive_ref_cleanup_order.passive_destroy_callbacks_invoked()
            || passive_ref_cleanup_order.public_effects_flushed()
            || passive_ref_cleanup_order.public_ref_or_effect_compatibility_claimed()
            || passive_ref_cleanup_order.public_unmount_compatibility_claimed()
            || passive_ref_cleanup_order.act_flushing_claimed()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "passive-ref-cleanup-order-public-claim",
                }
                .into(),
            );
        }

        let blockers = handoff.host_child_detachment_blockers();
        if !blockers.detached_instance()
            || blockers.detached_instance_child_count() != 0
            || !blockers.broad_host_child_detachment_blocked()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "host-child-detachment-blockers-missing",
                }
                .into(),
            );
        }
        if blockers.host_node_cleanup_invalidated_count() != handoff.host_node_cleanup_count()
            || blockers.host_node_cleanup_already_inactive_count() != 0
            || blockers.host_node_cleanup_missing_host_node_count() != 0
            || blockers.host_node_cleanup_missing_state_node_count() != 0
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                    reason: "host-node-cleanup-blockers-mismatch",
                }
                .into(),
            );
        }
        if handoff.public_unmount_compatibility_claimed()
            || handoff.public_host_teardown_compatibility_claimed()
            || handoff.act_flushing_claimed()
            || blockers.public_unmount_compatibility_claimed()
            || blockers.public_host_teardown_compatibility_claimed()
            || blockers.act_flushing_claimed()
        {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                    reason: "public-or-act-claim",
                }
                .into(),
            );
        }

        Ok(())
    }

    pub fn describe_private_to_json_facade_result_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateToJsonFacadeResult, TestRendererRootError> {
        let report = self.describe_private_json_serialization_for_canary(output)?;
        Self::private_to_json_facade_result_from_report(&report)
    }

    pub fn describe_private_to_json_facade_result_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateToJsonFacadeResult, TestRendererRootError> {
        let report = self.describe_private_json_serialization_after_update_for_canary(output)?;
        Self::private_to_json_facade_result_from_report(&report)
    }

    pub fn describe_private_to_json_after_create_native_execution_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
        execution: TestRendererPrivateCreateRouteAdmissionDiagnostics,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_json_create_native_execution_record_for_canary(execution)?;
        let result = self.describe_private_to_json_facade_result_for_canary(output)?;

        self.private_to_json_native_execution_evidence_from_facade_result(
            "create",
            "create().toJSON",
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS,
            true,
            false,
            false,
            &result,
        )
    }

    pub fn describe_private_to_json_after_update_native_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_json_update_native_execution_record_for_canary(execution)?;
        let result = self.describe_private_to_json_facade_result_after_update_for_canary(output)?;

        self.private_to_json_native_execution_evidence_from_facade_result(
            "update",
            "create().update -> create().toJSON",
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            false,
            true,
            false,
            &result,
        )
    }

    pub fn describe_private_to_json_after_nested_update_native_execution_for_canary(
        &self,
        output: &TestRendererNestedHostParentPlacedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_json_update_native_execution_record_for_canary(execution)?;
        let row = self.describe_private_to_json_nested_host_output_update_row_for_canary(output)?;
        if output.host_parent_placement_apply_count() == 0
            || !output
                .commit()
                .has_test_only_host_parent_placement_apply_for_canary(
                    output.nested_parent_state_node_raw(),
                    output.placed_text_state_node_raw(),
                )
        {
            return self.private_to_json_native_execution_record_error(
                "update",
                "nested-host-output-placement-evidence-missing",
            );
        }

        self.private_to_json_native_execution_evidence_from_host_output_row(
            "update",
            "create().update -> create().toJSON",
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            false,
            true,
            false,
            row,
            output.snapshot(),
        )
    }

    pub fn describe_private_to_json_sibling_text_update_native_execution_from_snapshot_for_diagnostics(
        &self,
        previous_snapshot: &TestContainerSnapshot,
        current_snapshot: &TestContainerSnapshot,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_json_update_native_execution_record_for_canary(execution)?;
        let row =
            Self::describe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics(
                previous_snapshot,
                current_snapshot,
            )?;

        self.private_to_json_native_execution_evidence_from_host_output_row(
            "update",
            "create().update -> create().toJSON",
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            false,
            true,
            false,
            row,
            current_snapshot,
        )
    }

    pub fn describe_private_to_json_after_unmount_native_execution_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
        execution: TestRendererUnmountNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_json_unmount_native_execution_record_for_canary(execution)?;
        let row = self.describe_private_to_json_host_output_unmount_row_for_canary(output)?;
        let rendered_root = Self::describe_private_to_json_host_shape_from_snapshot_for_diagnostics(
            output.snapshot(),
        );
        let minimal_tree_shape = rendered_root.is_null()
            && row.host_output_shape() == TestRendererPrivateToJsonHostOutputShape::EmptyRoot
            && row.current_root_child_count() == 0;

        Ok(TestRendererPrivateToJsonNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation: "unmount",
            public_surface: "create().unmount -> create().toJSON",
            source_execution_record_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            source_execution_status: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS,
            host_output_update_kind: TestRendererRootUpdateKind::Unmount,
            host_output_shape: row.host_output_shape(),
            host_output_row: Some(row),
            rendered_root,
            source_node_count: 0,
            root_child_count: output.snapshot().children().len(),
            consumes_accepted_native_create_execution_record: false,
            consumes_accepted_native_update_execution_record: false,
            consumes_accepted_native_unmount_execution_record: true,
            consumes_private_to_json_evidence: true,
            consumes_accepted_host_output_row: true,
            minimal_tree_shape,
            public_to_json_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
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

    pub fn describe_private_to_tree_after_create_native_execution_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
        execution: TestRendererPrivateCreateRouteAdmissionDiagnostics,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_tree_create_native_execution_record_for_canary(execution)?;
        let report = self.describe_private_tree_metadata_for_canary(output)?;

        self.private_to_tree_native_execution_evidence_from_tree_report(
            "create",
            "create().toTree",
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS,
            true,
            false,
            false,
            &report,
        )
    }

    pub fn describe_private_to_tree_after_update_native_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_tree_update_native_execution_record_for_canary(execution)?;
        let report = self.describe_private_tree_metadata_after_update_for_canary(output)?;

        self.private_to_tree_native_execution_evidence_from_tree_report(
            "update",
            "create().update -> create().toTree",
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            false,
            true,
            false,
            &report,
        )
    }

    pub fn describe_private_to_tree_after_unmount_native_execution_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
        execution: TestRendererUnmountNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        self.validate_private_to_tree_unmount_native_execution_record_for_canary(execution)?;
        let row = self.describe_private_to_json_host_output_unmount_row_for_canary(output)?;
        let rendered_root = Self::describe_private_to_tree_host_shape_from_snapshot_for_diagnostics(
            output.snapshot(),
        );
        let minimal_tree_shape = rendered_root.is_null()
            && row.host_output_shape() == TestRendererPrivateToJsonHostOutputShape::EmptyRoot
            && row.current_root_child_count() == 0;

        Ok(TestRendererPrivateToTreeNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation: "unmount",
            public_surface: "create().unmount -> create().toTree",
            source_execution_record_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            source_execution_status: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS,
            source_tree_diagnostic_name: TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
            host_output_update_kind: TestRendererRootUpdateKind::Unmount,
            host_output_shape: row.host_output_shape(),
            host_output_row: Some(row),
            rendered_root,
            source_fiber_count: 0,
            root_child_count: output.snapshot().children().len(),
            consumes_accepted_native_create_execution_record: false,
            consumes_accepted_native_update_execution_record: false,
            consumes_accepted_native_unmount_execution_record: true,
            consumes_private_to_tree_evidence: true,
            consumes_accepted_host_output_row: true,
            minimal_tree_shape,
            function_component_above_host_output_shape: false,
            public_to_tree_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    pub fn describe_private_tree_committed_fiber_inspection_for_canary(
        &self,
        commit: &HostRootCommitRecord,
    ) -> Result<TestRendererPrivateTreeCommittedFiberInspectionReport, TestRendererRootError> {
        let inspection = self.describe_committed_fiber_tree_for_canary(commit)?;

        Ok(Self::private_tree_committed_fiber_inspection_from_report(
            &inspection,
        ))
    }

    pub fn describe_private_test_instance_find_all_query_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceFindAllQueryDiagnostics, TestRendererRootError> {
        let tree_report = self.describe_private_tree_metadata_for_canary(output)?;

        Ok(Self::private_test_instance_find_all_query_from_tree_report(
            &tree_report,
        ))
    }

    pub fn describe_private_test_instance_find_all_query_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceFindAllQueryDiagnostics, TestRendererRootError> {
        let tree_report = self.describe_private_tree_metadata_after_update_for_canary(output)?;

        Ok(Self::private_test_instance_find_all_query_from_tree_report(
            &tree_report,
        ))
    }

    pub fn describe_private_test_instance_find_by_query_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceFindByQueryDiagnostics, TestRendererRootError> {
        let find_all_report =
            self.describe_private_test_instance_find_all_query_for_canary(output)?;

        Ok(Self::private_test_instance_find_by_query_from_find_all_report(&find_all_report))
    }

    pub fn describe_private_test_instance_find_by_query_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceFindByQueryDiagnostics, TestRendererRootError> {
        let find_all_report =
            self.describe_private_test_instance_find_all_query_after_update_for_canary(output)?;

        Ok(Self::private_test_instance_find_by_query_from_find_all_report(&find_all_report))
    }

    pub fn describe_private_test_instance_query_bridge_preflight_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics, TestRendererRootError>
    {
        let find_all_report =
            self.describe_private_test_instance_find_all_query_for_canary(output)?;
        let find_by_report =
            Self::private_test_instance_find_by_query_from_find_all_report(&find_all_report);

        Ok(
            Self::private_test_instance_query_bridge_preflight_from_query_reports(
                &find_all_report,
                &find_by_report,
            ),
        )
    }

    pub fn describe_private_test_instance_query_bridge_preflight_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics, TestRendererRootError>
    {
        let find_all_report =
            self.describe_private_test_instance_find_all_query_after_update_for_canary(output)?;
        let find_by_report =
            Self::private_test_instance_find_by_query_from_find_all_report(&find_all_report);

        Ok(
            Self::private_test_instance_query_bridge_preflight_from_query_reports(
                &find_all_report,
                &find_by_report,
            ),
        )
    }

    pub fn describe_private_test_instance_query_after_create_native_execution_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
        execution: TestRendererPrivateCreateNativeBridgeHostOutputHandoff,
    ) -> Result<TestRendererPrivateTestInstanceNativeQueryExecutionEvidence, TestRendererRootError>
    {
        self.validate_private_test_instance_create_native_execution_record_for_canary(execution)?;
        let preflight =
            self.describe_private_test_instance_query_bridge_preflight_for_canary(output)?;
        let find_by = self.describe_private_test_instance_find_by_query_for_canary(output)?;

        self.private_test_instance_native_query_execution_evidence_from_reports(
            "create",
            "create().root/ReactTestInstance.findByType",
            TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID,
            TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS,
            TestRendererRootUpdateKind::Create,
            true,
            false,
            &preflight,
            &find_by,
        )
    }

    pub fn describe_private_test_instance_query_after_update_native_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateTestInstanceNativeQueryExecutionEvidence, TestRendererRootError>
    {
        self.validate_private_test_instance_update_native_execution_record_for_canary(execution)?;
        let preflight = self
            .describe_private_test_instance_query_bridge_preflight_after_update_for_canary(
                output,
            )?;
        let find_by =
            self.describe_private_test_instance_find_by_query_after_update_for_canary(output)?;

        self.private_test_instance_native_query_execution_evidence_from_reports(
            "update",
            "create().update -> create().root/ReactTestInstance.findByType",
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS,
            TestRendererRootUpdateKind::Update,
            false,
            true,
            &preflight,
            &find_by,
        )
    }

    pub fn describe_private_test_instance_class_root_query_after_update_native_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence, TestRendererRootError>
    {
        self.validate_private_test_instance_update_native_execution_record_for_canary(execution)?;
        let preflight = self
            .describe_private_test_instance_query_bridge_preflight_after_update_for_canary(
                output,
            )?;
        let find_by =
            self.describe_private_test_instance_find_by_query_after_update_for_canary(output)?;
        let class_root =
            self.describe_private_get_instance_class_root_after_update_for_canary(output)?;
        let previous_child_text = Self::first_host_component_text_from_snapshot(
            output.previous_snapshot(),
        )
        .ok_or(
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation: "update",
                reason: "updated-host-child-previous-text-missing",
            },
        )?;

        self.private_test_instance_class_root_query_execution_evidence_from_reports(
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS,
            previous_child_text,
            &preflight,
            &find_by,
            &class_root,
        )
    }

    pub fn describe_private_get_instance_class_root_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateGetInstanceClassRootReport, TestRendererRootError> {
        let tree_report = self.describe_private_tree_metadata_for_canary(output)?;

        Ok(Self::private_get_instance_class_root_from_tree_report(
            tree_report,
        ))
    }

    pub fn describe_private_get_instance_class_root_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateGetInstanceClassRootReport, TestRendererRootError> {
        let tree_report = self.describe_private_tree_metadata_after_update_for_canary(output)?;

        Ok(Self::private_get_instance_class_root_from_tree_report(
            tree_report,
        ))
    }

    fn describe_private_json_serialization_from_current_fibers_for_canary(
        &self,
        commit: &HostRootCommitRecord,
        expected_fiber_inspection: Option<&TestRendererCommittedFiberTreeInspection>,
        current_fibers: TestRendererHostOutputCanaryCurrentFibers,
        snapshot: &TestContainerSnapshot,
        host_output_update_kind: TestRendererRootUpdateKind,
        host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
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
        let host_output_shape = Self::private_to_json_host_output_shape_from_snapshot(snapshot);
        Self::validate_private_to_json_host_output_row(
            host_output_update_kind,
            host_output_row,
            Some(host_output_shape.shape()),
        )?;

        Self::validate_private_json_canary_current_fibers(&fiber_inspection, current_fibers)?;
        let component = Self::private_json_component_from_snapshot(snapshot)?;
        let nodes =
            Self::private_json_nodes_from_component_and_fibers(&component, &fiber_inspection);

        Ok(TestRendererPrivateJsonSerializationReport {
            diagnostic_name: TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME,
            gate,
            host_output_update_kind,
            host_output_shape: host_output_shape.shape(),
            host_output_row,
            host_output_snapshot_current: true,
            root_child_count: snapshot.children().len(),
            root_node_kind: component.node_kind(),
            nodes,
            component,
            public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers::blocked(),
        })
    }

    fn private_to_json_host_output_row(
        host_output_update_kind: TestRendererRootUpdateKind,
        previous_snapshot: &TestContainerSnapshot,
        current_snapshot: &TestContainerSnapshot,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        let id = match host_output_update_kind {
            TestRendererRootUpdateKind::Update => {
                TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
            }
            TestRendererRootUpdateKind::Unmount => {
                TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
            }
            TestRendererRootUpdateKind::Create => {
                return Err(
                    TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                        row_id: TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID,
                        expected: TestRendererRootUpdateKind::Update,
                        actual: TestRendererRootUpdateKind::Create,
                    }
                    .into(),
                );
            }
        };

        Self::private_to_json_host_output_row_with_shape(
            host_output_update_kind,
            id,
            None,
            previous_snapshot,
            current_snapshot,
        )
    }

    fn private_to_json_host_output_row_with_shape(
        host_output_update_kind: TestRendererRootUpdateKind,
        id: &'static str,
        expected_shape: Option<TestRendererPrivateToJsonHostOutputShape>,
        previous_snapshot: &TestContainerSnapshot,
        current_snapshot: &TestContainerSnapshot,
    ) -> Result<TestRendererPrivateToJsonHostOutputRow, TestRendererRootError> {
        let route_row_id = match host_output_update_kind {
            TestRendererRootUpdateKind::Update => {
                TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID
            }
            TestRendererRootUpdateKind::Unmount => {
                TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
            }
            TestRendererRootUpdateKind::Create => {
                return Err(
                    TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                        row_id: id,
                        expected: TestRendererRootUpdateKind::Update,
                        actual: TestRendererRootUpdateKind::Create,
                    }
                    .into(),
                );
            }
        };

        if host_output_update_kind == TestRendererRootUpdateKind::Unmount
            && !current_snapshot.children().is_empty()
        {
            return Err(
                TestRendererPrivateJsonSerializationError::UnmountSnapshotNotEmpty {
                    actual: current_snapshot.children().len(),
                }
                .into(),
            );
        }

        let previous_shape =
            Self::private_to_json_host_output_shape_from_snapshot(previous_snapshot);
        let current_shape = Self::private_to_json_host_output_shape_from_snapshot(current_snapshot);
        if let Some(expected_shape) = expected_shape
            && current_shape.shape() != expected_shape
        {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
                    row_id: id,
                    expected: expected_shape,
                    actual: current_shape.shape(),
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateToJsonHostOutputRow {
            id,
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_UNMOUNT_ROW_STATUS,
            host_output_update_kind,
            host_output_shape: current_shape.shape(),
            previous_root_child_count: previous_snapshot.children().len(),
            current_root_child_count: current_snapshot.children().len(),
            previous_host_component_count: previous_shape.host_component_count(),
            current_host_component_count: current_shape.host_component_count(),
            previous_host_text_count: previous_shape.host_text_count(),
            current_host_text_count: current_shape.host_text_count(),
            current_root_text_count: current_shape.root_text_count(),
            current_max_host_component_depth: current_shape.max_host_component_depth(),
            dependency_diagnostics: TestRendererPrivateToJsonHostOutputDependencyDiagnostics {
                route_row_id,
                serialization_row_id: TEST_RENDERER_PRIVATE_TO_JSON_SERIALIZATION_DEPENDENCY_ID,
                route_diagnostics_available: true,
                serialization_diagnostics_available: true,
                host_output_snapshot_current: true,
                public_to_json_available: false,
                public_test_instance_available: false,
                native_execution_available: false,
                compatibility_claimed: false,
            },
            public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers::blocked(),
        })
    }

    fn validate_private_to_json_host_output_row(
        expected: TestRendererRootUpdateKind,
        row: Option<TestRendererPrivateToJsonHostOutputRow>,
        expected_shape: Option<TestRendererPrivateToJsonHostOutputShape>,
    ) -> Result<(), TestRendererRootError> {
        let Some(row) = row else {
            return Ok(());
        };

        if row.host_output_update_kind() != expected {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                    row_id: row.id(),
                    expected,
                    actual: row.host_output_update_kind(),
                }
                .into(),
            );
        }

        if !Self::private_to_json_host_output_row_id_matches_kind(expected, row.id()) {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                    row_id: row.id(),
                    expected,
                    actual: row.host_output_update_kind(),
                }
                .into(),
            );
        }

        if let Some(row_id_shape) =
            Self::private_to_json_expected_host_output_shape_for_row_id(row.id())
            && row.host_output_shape() != row_id_shape
        {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
                    row_id: row.id(),
                    expected: row_id_shape,
                    actual: row.host_output_shape(),
                }
                .into(),
            );
        }

        if let Some(expected_shape) = expected_shape
            && row.host_output_shape() != expected_shape
        {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
                    row_id: row.id(),
                    expected: expected_shape,
                    actual: row.host_output_shape(),
                }
                .into(),
            );
        }

        Ok(())
    }

    fn private_to_json_host_output_row_id_matches_kind(
        expected: TestRendererRootUpdateKind,
        row_id: &str,
    ) -> bool {
        match expected {
            TestRendererRootUpdateKind::Update => matches!(
                row_id,
                TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
                    | TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID
                    | TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
            ),
            TestRendererRootUpdateKind::Unmount => {
                row_id == TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
            }
            TestRendererRootUpdateKind::Create => true,
        }
    }

    fn private_to_json_expected_host_output_shape_for_row_id(
        row_id: &str,
    ) -> Option<TestRendererPrivateToJsonHostOutputShape> {
        match row_id {
            TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID => {
                Some(TestRendererPrivateToJsonHostOutputShape::SingleHostText)
            }
            TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID => {
                Some(TestRendererPrivateToJsonHostOutputShape::NestedHostText)
            }
            TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID => {
                Some(TestRendererPrivateToJsonHostOutputShape::SiblingText)
            }
            TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID => {
                Some(TestRendererPrivateToJsonHostOutputShape::EmptyRoot)
            }
            _ => None,
        }
    }

    fn private_to_json_facade_result_from_report(
        report: &TestRendererPrivateJsonSerializationReport,
    ) -> Result<TestRendererPrivateToJsonFacadeResult, TestRendererRootError> {
        Self::validate_private_to_json_host_output_row(
            report.host_output_update_kind(),
            report.host_output_row(),
            Some(report.host_output_shape()),
        )?;
        let component = report.component();

        Ok(TestRendererPrivateToJsonFacadeResult {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME,
            source_diagnostic_name: report.diagnostic_name(),
            host_output_update_kind: report.host_output_update_kind(),
            host_output_shape: report.host_output_shape(),
            host_output_row: report.host_output_row(),
            host_output_snapshot_current: report.host_output_snapshot_current(),
            element_type: component.element_type().clone(),
            props: component.props().clone(),
            children: vec![component.text_child().text().to_owned()],
            rendered_root: Self::private_json_rendered_root_from_component(component),
            source_node_count: report.node_count(),
            public_blockers: report.public_blockers(),
            public_serialization_available: false,
            compatibility_claimed: false,
        })
    }

    #[allow(clippy::too_many_arguments)]
    fn private_to_json_native_execution_evidence_from_host_output_row(
        &self,
        operation: &'static str,
        public_surface: &'static str,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        consumes_create: bool,
        consumes_update: bool,
        consumes_unmount: bool,
        row: TestRendererPrivateToJsonHostOutputRow,
        snapshot: &TestContainerSnapshot,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        Self::validate_private_to_json_host_output_row(
            row.host_output_update_kind(),
            Some(row),
            Some(row.host_output_shape()),
        )?;
        let shape = Self::private_to_json_host_output_shape_from_snapshot(snapshot);
        if shape.shape() != row.host_output_shape() {
            return Err(
                TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
                    row_id: row.id(),
                    expected: row.host_output_shape(),
                    actual: shape.shape(),
                }
                .into(),
            );
        }
        if row.current_root_child_count() != snapshot.children().len()
            || row.current_host_component_count() != shape.host_component_count()
            || row.current_host_text_count() != shape.host_text_count()
            || row.current_root_text_count() != shape.root_text_count()
            || row.current_max_host_component_depth() != shape.max_host_component_depth()
        {
            return self.private_to_json_native_execution_record_error(
                operation,
                "host-output-row-counts-stale",
            );
        }
        if !Self::private_to_json_native_execution_shape_is_accepted(row, shape) {
            return self.private_to_json_native_execution_record_error(
                operation,
                "accepted-host-output-row-shape-missing",
            );
        }

        let rendered_root =
            Self::describe_private_to_json_host_shape_from_snapshot_for_diagnostics(snapshot);
        let minimal_tree_shape = rendered_root.is_null()
            || Self::private_to_json_rendered_root_is_minimal_host_text(&rendered_root);

        Ok(TestRendererPrivateToJsonNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation,
            public_surface,
            source_execution_record_id,
            source_execution_status,
            host_output_update_kind: row.host_output_update_kind(),
            host_output_shape: row.host_output_shape(),
            host_output_row: Some(row),
            rendered_root,
            source_node_count: shape.host_component_count() + shape.host_text_count(),
            root_child_count: snapshot.children().len(),
            consumes_accepted_native_create_execution_record: consumes_create,
            consumes_accepted_native_update_execution_record: consumes_update,
            consumes_accepted_native_unmount_execution_record: consumes_unmount,
            consumes_private_to_json_evidence: true,
            consumes_accepted_host_output_row: true,
            minimal_tree_shape,
            public_to_json_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    fn private_to_json_native_execution_shape_is_accepted(
        row: TestRendererPrivateToJsonHostOutputRow,
        shape: TestRendererPrivateToJsonHostOutputShapeDiagnostics,
    ) -> bool {
        match row.host_output_shape() {
            TestRendererPrivateToJsonHostOutputShape::EmptyRoot => {
                row.host_output_update_kind() == TestRendererRootUpdateKind::Unmount
                    && row.current_root_child_count() == 0
                    && shape.host_component_count() == 0
                    && shape.host_text_count() == 0
                    && shape.root_text_count() == 0
                    && shape.max_host_component_depth() == 0
            }
            TestRendererPrivateToJsonHostOutputShape::SingleHostText => {
                row.host_output_update_kind() == TestRendererRootUpdateKind::Update
                    && row.current_root_child_count() == 1
                    && shape.host_component_count() == 1
                    && shape.host_text_count() == 1
                    && shape.root_text_count() == 0
                    && shape.max_host_component_depth() == 1
            }
            TestRendererPrivateToJsonHostOutputShape::NestedHostText => {
                row.host_output_update_kind() == TestRendererRootUpdateKind::Update
                    && row.current_root_child_count() == 1
                    && shape.host_component_count() == 2
                    && shape.host_text_count() == 2
                    && shape.root_text_count() == 0
                    && shape.max_host_component_depth() == 2
            }
            TestRendererPrivateToJsonHostOutputShape::SiblingText => {
                row.host_output_update_kind() == TestRendererRootUpdateKind::Update
                    && row.current_root_child_count() == 2
                    && shape.host_component_count() == 1
                    && shape.host_text_count() == 2
                    && shape.root_text_count() == 1
                    && shape.max_host_component_depth() == 1
            }
        }
    }

    #[allow(
        clippy::too_many_arguments,
        reason = "private test-renderer evidence builder mirrors the native execution report shape"
    )]
    fn private_to_json_native_execution_evidence_from_facade_result(
        &self,
        operation: &'static str,
        public_surface: &'static str,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        consumes_create: bool,
        consumes_update: bool,
        consumes_unmount: bool,
        result: &TestRendererPrivateToJsonFacadeResult,
    ) -> Result<TestRendererPrivateToJsonNativeExecutionEvidence, TestRendererRootError> {
        let minimal_tree_shape = Self::private_to_json_result_is_minimal_host_text(result);
        if !minimal_tree_shape {
            return Err(
                TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                    operation,
                    reason: "minimal-host-component-with-text-shape-missing",
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateToJsonNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation,
            public_surface,
            source_execution_record_id,
            source_execution_status,
            host_output_update_kind: result.host_output_update_kind(),
            host_output_shape: result.host_output_shape(),
            host_output_row: result.host_output_row(),
            rendered_root: result.rendered_root().clone(),
            source_node_count: result.source_node_count(),
            root_child_count: 1,
            consumes_accepted_native_create_execution_record: consumes_create,
            consumes_accepted_native_update_execution_record: consumes_update,
            consumes_accepted_native_unmount_execution_record: consumes_unmount,
            consumes_private_to_json_evidence: true,
            consumes_accepted_host_output_row: result.host_output_row().is_some(),
            minimal_tree_shape,
            public_to_json_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    fn private_to_json_result_is_minimal_host_text(
        result: &TestRendererPrivateToJsonFacadeResult,
    ) -> bool {
        let Some(component) = result.rendered_root().as_host_component() else {
            return false;
        };
        let Some(children) = component.children() else {
            return false;
        };
        result.source_node_count() == 2
            && result.child_count() == 1
            && component.child_count() == 1
            && children.len() == 1
            && children[0].as_text().is_some()
    }

    fn private_to_json_rendered_root_is_minimal_host_text(
        rendered_root: &TestRendererPrivateJsonRenderedRoot,
    ) -> bool {
        let Some(component) = rendered_root.as_host_component() else {
            return false;
        };
        let Some(children) = component.children() else {
            return false;
        };
        component.child_count() == 1 && children.len() == 1 && children[0].as_text().is_some()
    }

    #[allow(clippy::too_many_arguments)]
    fn private_to_tree_native_execution_evidence_from_tree_report(
        &self,
        operation: &'static str,
        public_surface: &'static str,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        consumes_create: bool,
        consumes_update: bool,
        consumes_unmount: bool,
        report: &TestRendererPrivateTreeMetadataReport,
    ) -> Result<TestRendererPrivateToTreeNativeExecutionEvidence, TestRendererRootError> {
        let minimal_tree_shape = Self::private_to_tree_report_is_minimal_host_text(report);
        if !minimal_tree_shape {
            return Err(
                TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                    operation,
                    reason: "minimal-host-component-with-text-shape-missing",
                }
                .into(),
            );
        }
        let function_component_above_host_output_shape =
            Self::private_to_tree_report_has_function_component_above_host_output(report);
        if !function_component_above_host_output_shape {
            return Err(
                TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                    operation,
                    reason: "function-component-above-host-output-shape-missing",
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateToTreeNativeExecutionEvidence {
            diagnostic_name: TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_STATUS,
            root: self.root_id,
            operation,
            public_surface,
            source_execution_record_id,
            source_execution_status,
            source_tree_diagnostic_name: report.diagnostic_name(),
            host_output_update_kind: report.host_output_update_kind(),
            host_output_shape: report.host_output_shape(),
            host_output_row: report.host_output_row(),
            rendered_root: Self::private_to_tree_rendered_root_from_report(report),
            source_fiber_count: report.accepted_composite_fiber_shape().len(),
            root_child_count: report.root_child_count(),
            consumes_accepted_native_create_execution_record: consumes_create,
            consumes_accepted_native_update_execution_record: consumes_update,
            consumes_accepted_native_unmount_execution_record: consumes_unmount,
            consumes_private_to_tree_evidence: true,
            consumes_accepted_host_output_row: report.host_output_row().is_some(),
            minimal_tree_shape,
            function_component_above_host_output_shape,
            public_to_tree_available: false,
            public_serialization_available: false,
            public_route_available: false,
            native_bridge_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        })
    }

    fn private_to_tree_rendered_root_from_report(
        report: &TestRendererPrivateTreeMetadataReport,
    ) -> TestRendererPrivateTreeRenderedRoot {
        let host_component = report.host_component();
        let host_text = report.host_text();
        let rendered_host = TestRendererPrivateTreeRenderedRoot::HostComponent(
            TestRendererPrivateTreeRenderedHostComponent {
                node_type: TestRendererPrivateTreeNodeType::Host,
                element_type: host_component.element_type().clone(),
                props: Self::private_json_props_without_children(host_component.props()),
                instance_available: false,
                rendered: vec![TestRendererPrivateTreeRenderedRoot::Text(
                    host_text.text().to_owned(),
                )],
            },
        );

        TestRendererPrivateTreeRenderedRoot::FunctionComponent(Box::new(
            TestRendererPrivateTreeRenderedFunctionComponent {
                node_type: TestRendererPrivateTreeNodeType::Component,
                component_type: report.function_component().component_type(),
                props: report.function_component().props().clone(),
                instance_available: false,
                rendered: Box::new(rendered_host),
                wraps_committed_host_output: true,
            },
        ))
    }

    fn private_to_tree_report_is_minimal_host_text(
        report: &TestRendererPrivateTreeMetadataReport,
    ) -> bool {
        let host_root = report.host_root();
        let function_component = report.function_component();
        let host_component = report.host_component();
        let host_text = report.host_text();

        report.source_json_diagnostic_name()
            == TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME
            && report.host_output_shape()
                == TestRendererPrivateToJsonHostOutputShape::SingleHostText
            && report.root_child_count() == 1
            && report.accepted_fiber_shape() == &TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE
            && report.accepted_composite_fiber_shape()
                == &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE
            && host_root.fiber_tag() == "HostRoot"
            && host_root.delegates_to_child()
            && host_root.child_fiber_tag() == "HostComponent"
            && !host_root.public_tree_object_available()
            && function_component.fiber_tag() == "FunctionComponent"
            && function_component.node_type() == TestRendererPrivateTreeNodeType::Component
            && function_component.component_type()
                == TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
            && !function_component.instance_available()
            && function_component.rendered_child_fiber_tag() == "HostComponent"
            && function_component.rendered_child_node_type()
                == TestRendererPrivateTreeNodeType::Host
            && function_component.rendered_child_count() == 1
            && function_component.wraps_committed_host_output()
            && !function_component.public_tree_object_available()
            && host_component.fiber_tag() == "HostComponent"
            && host_component.node_type() == TestRendererPrivateTreeNodeType::Host
            && !host_component.instance_available()
            && host_component.rendered_child_count() == 1
            && !host_component.public_tree_object_available()
            && host_text.fiber_tag() == "HostText"
            && host_text.text() == host_component.rendered_text()
            && host_text.returns_text_value()
            && !host_text.public_tree_object_available()
            && !report.public_tree_object_available()
            && report.public_blockers().all_blocked()
    }

    fn private_to_tree_report_has_function_component_above_host_output(
        report: &TestRendererPrivateTreeMetadataReport,
    ) -> bool {
        let function_component = report.function_component();

        report.accepted_composite_fiber_shape()
            == &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE
            && function_component.fiber_tag() == "FunctionComponent"
            && function_component.node_type() == TestRendererPrivateTreeNodeType::Component
            && function_component.component_type()
                == TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
            && !function_component.instance_available()
            && function_component.rendered_child_fiber_tag() == "HostComponent"
            && function_component.rendered_child_node_type()
                == TestRendererPrivateTreeNodeType::Host
            && function_component.rendered_child_count() == 1
            && function_component.wraps_committed_host_output()
            && !function_component.public_tree_object_available()
            && report.host_component().fiber_tag() == function_component.rendered_child_fiber_tag()
            && report.host_component().node_type() == function_component.rendered_child_node_type()
    }

    fn validate_private_to_json_create_native_execution_record_for_canary(
        &self,
        execution: TestRendererPrivateCreateRouteAdmissionDiagnostics,
    ) -> Result<(), TestRendererRootError> {
        if execution.record_id() != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID {
            return self
                .private_to_json_native_execution_record_error("create", "record-id-mismatch");
        }
        if execution.status() != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS {
            return self.private_to_json_native_execution_record_error("create", "status-mismatch");
        }
        if execution.operation() != "create"
            || execution.public_surface() != "create()"
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Create
            || execution.rust_outcome() != "Scheduled"
        {
            return self
                .private_to_json_native_execution_record_error("create", "route-metadata-stale");
        }
        if !execution.consumes_accepted_rust_root_create_execution_evidence()
            || !execution.consumes_accepted_rust_root_create_preflight_diagnostics()
            || !execution.consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata()
        {
            return self.private_to_json_native_execution_record_error(
                "create",
                "accepted-rust-create-evidence-missing",
            );
        }
        if execution.public_renderer_root_created()
            || execution.public_root_available()
            || execution.public_create_behavior_available()
            || execution.public_serialization_available()
            || execution.native_addon_loaded()
            || execution.native_bridge_available()
            || execution.native_execution()
            || execution.rust_execution_from_js()
            || execution.reconciler_execution_from_js()
            || execution.host_output_produced_from_js()
            || execution.compatibility_claimed()
        {
            return self.private_to_json_native_execution_record_error(
                "create",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn validate_private_to_json_update_native_execution_record_for_canary(
        &self,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<(), TestRendererRootError> {
        if execution.record_id() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID {
            return self
                .private_to_json_native_execution_record_error("update", "record-id-mismatch");
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS {
            return self.private_to_json_native_execution_record_error("update", "status-mismatch");
        }
        if execution.root() != self.root_id
            || execution.public_surface() != "create().update"
            || execution.request_api() != "TestRendererRoot::update"
            || execution.source_diagnostic_name()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME
            || execution.source_diagnostic_status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS
            || execution.lifecycle() != TestRendererRootLifecycle::Active
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Update
        {
            return self
                .private_to_json_native_execution_record_error("update", "route-metadata-stale");
        }
        if !execution.consumes_accepted_host_root_update_queue_metadata()
            || !execution.consumes_accepted_root_work_loop_metadata()
            || !execution.consumes_accepted_host_output_metadata()
        {
            return self.private_to_json_native_execution_record_error(
                "update",
                "accepted-update-evidence-missing",
            );
        }
        if execution.public_root_update_available()
            || execution.public_serialization_available()
            || execution.native_execution_available()
            || execution.compatibility_claimed()
        {
            return self.private_to_json_native_execution_record_error(
                "update",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn validate_private_to_json_unmount_native_execution_record_for_canary(
        &self,
        execution: TestRendererUnmountNativeBridgeAdmission,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        {
            return self
                .private_to_json_native_execution_record_error("unmount", "record-id-mismatch");
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS {
            return self
                .private_to_json_native_execution_record_error("unmount", "status-mismatch");
        }
        if execution.root() != self.root_id
            || execution.route_dependency_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
            || execution.deletion_commit_handoff_id()
                != TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
            || execution.lifecycle() != TestRendererRootLifecycle::UnmountScheduled
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Unmount
            || !execution.scheduled_element_is_none()
        {
            return self
                .private_to_json_native_execution_record_error("unmount", "route-metadata-stale");
        }
        if !execution.deletion_commit_handoff_accepted()
            || !execution.lifecycle_evidence_accepted()
            || !execution.cleanup_blockers_accepted()
        {
            return self.private_to_json_native_execution_record_error(
                "unmount",
                "accepted-unmount-evidence-missing",
            );
        }
        if execution.public_unmount_compatibility_claimed()
            || execution.public_host_teardown_compatibility_claimed()
            || execution.act_flushing_claimed()
            || execution.native_bridge_available()
            || execution.native_execution()
        {
            return self.private_to_json_native_execution_record_error(
                "unmount",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn private_to_json_native_execution_record_error<T>(
        &self,
        operation: &'static str,
        reason: &'static str,
    ) -> Result<T, TestRendererRootError> {
        Err(
            TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                operation,
                reason,
            }
            .into(),
        )
    }

    fn validate_private_to_tree_create_native_execution_record_for_canary(
        &self,
        execution: TestRendererPrivateCreateRouteAdmissionDiagnostics,
    ) -> Result<(), TestRendererRootError> {
        if execution.record_id() != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID {
            return self
                .private_to_tree_native_execution_record_error("create", "record-id-mismatch");
        }
        if execution.status() != TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS {
            return self.private_to_tree_native_execution_record_error("create", "status-mismatch");
        }
        if execution.operation() != "create"
            || execution.public_surface() != "create()"
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Create
            || execution.rust_outcome() != "Scheduled"
        {
            return self
                .private_to_tree_native_execution_record_error("create", "route-metadata-stale");
        }
        if !execution.consumes_accepted_rust_root_create_execution_evidence()
            || !execution.consumes_accepted_rust_root_create_preflight_diagnostics()
            || !execution.consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata()
        {
            return self.private_to_tree_native_execution_record_error(
                "create",
                "accepted-rust-create-evidence-missing",
            );
        }
        if execution.public_renderer_root_created()
            || execution.public_root_available()
            || execution.public_create_behavior_available()
            || execution.public_serialization_available()
            || execution.native_addon_loaded()
            || execution.native_bridge_available()
            || execution.native_execution()
            || execution.rust_execution_from_js()
            || execution.reconciler_execution_from_js()
            || execution.host_output_produced_from_js()
            || execution.compatibility_claimed()
        {
            return self.private_to_tree_native_execution_record_error(
                "create",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn validate_private_to_tree_update_native_execution_record_for_canary(
        &self,
        execution: TestRendererPrivateUpdateRouteAdmissionRecord,
    ) -> Result<(), TestRendererRootError> {
        if execution.record_id() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID {
            return self
                .private_to_tree_native_execution_record_error("update", "record-id-mismatch");
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS {
            return self.private_to_tree_native_execution_record_error("update", "status-mismatch");
        }
        if execution.root() != self.root_id
            || execution.public_surface() != "create().update"
            || execution.request_api() != "TestRendererRoot::update"
            || execution.source_diagnostic_name()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME
            || execution.source_diagnostic_status() != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS
            || execution.lifecycle() != TestRendererRootLifecycle::Active
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Update
        {
            return self
                .private_to_tree_native_execution_record_error("update", "route-metadata-stale");
        }
        if !execution.consumes_accepted_host_root_update_queue_metadata()
            || !execution.consumes_accepted_root_work_loop_metadata()
            || !execution.consumes_accepted_host_output_metadata()
        {
            return self.private_to_tree_native_execution_record_error(
                "update",
                "accepted-update-evidence-missing",
            );
        }
        if execution.public_root_update_available()
            || execution.public_serialization_available()
            || execution.native_execution_available()
            || execution.compatibility_claimed()
        {
            return self.private_to_tree_native_execution_record_error(
                "update",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn validate_private_to_tree_unmount_native_execution_record_for_canary(
        &self,
        execution: TestRendererUnmountNativeBridgeAdmission,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        {
            return self
                .private_to_tree_native_execution_record_error("unmount", "record-id-mismatch");
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS {
            return self
                .private_to_tree_native_execution_record_error("unmount", "status-mismatch");
        }
        if execution.root() != self.root_id
            || execution.route_dependency_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
            || execution.deletion_commit_handoff_id()
                != TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
            || execution.lifecycle() != TestRendererRootLifecycle::UnmountScheduled
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Unmount
            || !execution.scheduled_element_is_none()
        {
            return self
                .private_to_tree_native_execution_record_error("unmount", "route-metadata-stale");
        }
        if !execution.deletion_commit_handoff_accepted()
            || !execution.lifecycle_evidence_accepted()
            || !execution.cleanup_blockers_accepted()
        {
            return self.private_to_tree_native_execution_record_error(
                "unmount",
                "accepted-unmount-evidence-missing",
            );
        }
        if execution.public_unmount_compatibility_claimed()
            || execution.public_host_teardown_compatibility_claimed()
            || execution.act_flushing_claimed()
            || execution.native_bridge_available()
            || execution.native_execution()
        {
            return self.private_to_tree_native_execution_record_error(
                "unmount",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn private_to_tree_native_execution_record_error<T>(
        &self,
        operation: &'static str,
        reason: &'static str,
    ) -> Result<T, TestRendererRootError> {
        Err(
            TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
                operation,
                reason,
            }
            .into(),
        )
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

    fn create_private_error_diagnostic_row(
        &self,
        phase: TestRendererPrivateErrorDiagnosticPhase,
        root_error_options: TestRendererRootErrorOptionDiagnostics,
        dependency_diagnostics: TestRendererPrivateErrorBoundaryDependencyDiagnostics,
    ) -> TestRendererPrivateErrorDiagnosticRow {
        TestRendererPrivateErrorDiagnosticRow {
            id: phase.row_id(),
            diagnostic_name: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS,
            phase,
            host_output_update_kind: TestRendererRootUpdateKind::Update,
            root: self.root_id,
            root_error_channel: "onUncaughtError",
            root_error_options,
            dependency_diagnostics,
            react_reference: phase.react_reference(),
            root_error_update_scheduled: false,
            public_root_error_callbacks_invoked: false,
            public_error_boundary_behavior_available: false,
            compatibility_claimed: false,
        }
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
        self.push_host_output_fixture_with_props_for_canary(element_type, TestProps::new(), text)
    }

    fn push_host_output_fixture_with_props_for_canary(
        &mut self,
        element_type: TestElementType,
        props: TestProps,
        text: String,
    ) -> RootElementHandle {
        let element = RootElementHandle::from_raw(self.host_output_fixtures.len() as u64 + 1);
        self.host_output_fixtures
            .push(TestRendererHostOutputFixture::new_with_props(
                element,
                element_type,
                props,
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

    fn private_to_json_host_output_shape_from_snapshot(
        snapshot: &TestContainerSnapshot,
    ) -> TestRendererPrivateToJsonHostOutputShapeDiagnostics {
        let mut host_component_count = 0;
        let mut host_text_count = 0;
        let mut root_text_count = 0;
        let mut max_host_component_depth = 0;

        for child in snapshot.children() {
            Self::collect_private_to_json_host_output_shape(
                child,
                0,
                true,
                &mut host_component_count,
                &mut host_text_count,
                &mut root_text_count,
                &mut max_host_component_depth,
            );
        }

        let shape = if snapshot.children().is_empty() {
            TestRendererPrivateToJsonHostOutputShape::EmptyRoot
        } else if root_text_count > 0 {
            TestRendererPrivateToJsonHostOutputShape::SiblingText
        } else if max_host_component_depth > 1 {
            TestRendererPrivateToJsonHostOutputShape::NestedHostText
        } else {
            TestRendererPrivateToJsonHostOutputShape::SingleHostText
        };

        TestRendererPrivateToJsonHostOutputShapeDiagnostics {
            shape,
            host_component_count,
            host_text_count,
            root_text_count,
            max_host_component_depth,
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn collect_private_to_json_host_output_shape(
        snapshot: &TestNodeSnapshot,
        host_component_depth: usize,
        is_root_child: bool,
        host_component_count: &mut usize,
        host_text_count: &mut usize,
        root_text_count: &mut usize,
        max_host_component_depth: &mut usize,
    ) {
        match snapshot {
            TestNodeSnapshot::Text(text) => {
                if text.is_hidden() {
                    return;
                }
                *host_text_count += 1;
                if is_root_child {
                    *root_text_count += 1;
                }
            }
            TestNodeSnapshot::Element(element) => {
                if element.is_hidden() || element.is_detached() {
                    return;
                }
                let next_depth = host_component_depth + 1;
                *host_component_count += 1;
                *max_host_component_depth = (*max_host_component_depth).max(next_depth);
                for child in element.children() {
                    Self::collect_private_to_json_host_output_shape(
                        child,
                        next_depth,
                        false,
                        host_component_count,
                        host_text_count,
                        root_text_count,
                        max_host_component_depth,
                    );
                }
            }
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

    fn private_json_rendered_root_from_component(
        component: &TestRendererPrivateJsonHostComponentDiagnostic,
    ) -> TestRendererPrivateJsonRenderedRoot {
        let children = if component.text_child().is_hidden() {
            None
        } else {
            Some(vec![TestRendererPrivateJsonRenderedRoot::Text(
                component.text_child().text().to_owned(),
            )])
        };

        TestRendererPrivateJsonRenderedRoot::HostComponent(
            TestRendererPrivateJsonRenderedHostComponent {
                element_type: component.element_type().clone(),
                props: Self::private_json_props_without_children(component.props()),
                children,
            },
        )
    }

    pub fn describe_private_to_json_host_shape_from_snapshot_for_diagnostics(
        snapshot: &TestContainerSnapshot,
    ) -> TestRendererPrivateJsonRenderedRoot {
        let children = Self::private_json_rendered_children_from_snapshots(snapshot.children());
        Self::private_json_rendered_root_from_children(children)
    }

    pub fn describe_private_to_tree_host_shape_from_snapshot_for_diagnostics(
        snapshot: &TestContainerSnapshot,
    ) -> TestRendererPrivateTreeRenderedRoot {
        let children = Self::private_tree_rendered_children_from_snapshots(snapshot.children());
        Self::private_tree_rendered_root_from_children(children)
    }

    pub fn describe_private_to_tree_composite_above_host_shape_from_snapshot_for_diagnostics(
        snapshot: &TestContainerSnapshot,
    ) -> TestRendererPrivateTreeRenderedRoot {
        let rendered =
            Self::describe_private_to_tree_host_shape_from_snapshot_for_diagnostics(snapshot);

        TestRendererPrivateTreeRenderedRoot::FunctionComponent(Box::new(
            TestRendererPrivateTreeRenderedFunctionComponent {
                node_type: TestRendererPrivateTreeNodeType::Component,
                component_type: TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE,
                props: TestProps::new(),
                instance_available: false,
                rendered: Box::new(rendered),
                wraps_committed_host_output: true,
            },
        ))
    }

    fn private_json_rendered_root_from_children(
        mut children: Vec<TestRendererPrivateJsonRenderedRoot>,
    ) -> TestRendererPrivateJsonRenderedRoot {
        match children.len() {
            0 => TestRendererPrivateJsonRenderedRoot::Null,
            1 => children.remove(0),
            _ => TestRendererPrivateJsonRenderedRoot::Array(children),
        }
    }

    fn private_json_rendered_children_from_snapshots(
        snapshots: &[TestNodeSnapshot],
    ) -> Vec<TestRendererPrivateJsonRenderedRoot> {
        snapshots
            .iter()
            .filter_map(Self::private_json_rendered_child_from_snapshot)
            .collect()
    }

    fn private_json_rendered_child_from_snapshot(
        snapshot: &TestNodeSnapshot,
    ) -> Option<TestRendererPrivateJsonRenderedRoot> {
        match snapshot {
            TestNodeSnapshot::Text(text) => {
                if text.is_hidden() {
                    None
                } else {
                    Some(TestRendererPrivateJsonRenderedRoot::Text(
                        text.text().to_owned(),
                    ))
                }
            }
            TestNodeSnapshot::Element(element) => {
                if element.is_hidden() || element.is_detached() {
                    return None;
                }

                let rendered_children =
                    Self::private_json_rendered_children_from_snapshots(element.children());
                let children = if rendered_children.is_empty() {
                    None
                } else {
                    Some(rendered_children)
                };

                Some(TestRendererPrivateJsonRenderedRoot::HostComponent(
                    TestRendererPrivateJsonRenderedHostComponent {
                        element_type: element.element_type().clone(),
                        props: Self::private_json_props_without_children(element.props()),
                        children,
                    },
                ))
            }
        }
    }

    fn private_json_props_without_children(props: &TestProps) -> BTreeMap<String, String> {
        props
            .attributes()
            .iter()
            .filter(|(name, _)| name.as_str() != "children")
            .map(|(name, value)| (name.clone(), value.clone()))
            .collect()
    }

    fn private_tree_rendered_root_from_children(
        mut children: Vec<TestRendererPrivateTreeRenderedRoot>,
    ) -> TestRendererPrivateTreeRenderedRoot {
        match children.len() {
            0 => TestRendererPrivateTreeRenderedRoot::Null,
            1 => children.remove(0),
            _ => TestRendererPrivateTreeRenderedRoot::Array(children),
        }
    }

    fn private_tree_rendered_children_from_snapshots(
        snapshots: &[TestNodeSnapshot],
    ) -> Vec<TestRendererPrivateTreeRenderedRoot> {
        let mut rendered = Vec::new();
        for snapshot in snapshots {
            if let Some(child) = Self::private_tree_rendered_child_from_snapshot(snapshot) {
                Self::push_private_tree_rendered_child(&mut rendered, child);
            }
        }
        rendered
    }

    fn push_private_tree_rendered_child(
        rendered: &mut Vec<TestRendererPrivateTreeRenderedRoot>,
        child: TestRendererPrivateTreeRenderedRoot,
    ) {
        match child {
            TestRendererPrivateTreeRenderedRoot::Array(children) => rendered.extend(children),
            TestRendererPrivateTreeRenderedRoot::Null => {}
            other @ (TestRendererPrivateTreeRenderedRoot::Text(_)
            | TestRendererPrivateTreeRenderedRoot::HostComponent(_)
            | TestRendererPrivateTreeRenderedRoot::FunctionComponent(_)) => rendered.push(other),
        }
    }

    fn private_tree_rendered_child_from_snapshot(
        snapshot: &TestNodeSnapshot,
    ) -> Option<TestRendererPrivateTreeRenderedRoot> {
        match snapshot {
            TestNodeSnapshot::Text(text) => {
                if text.is_hidden() {
                    None
                } else {
                    Some(TestRendererPrivateTreeRenderedRoot::Text(
                        text.text().to_owned(),
                    ))
                }
            }
            TestNodeSnapshot::Element(element) => {
                if element.is_hidden() || element.is_detached() {
                    return None;
                }

                Some(TestRendererPrivateTreeRenderedRoot::HostComponent(
                    TestRendererPrivateTreeRenderedHostComponent {
                        node_type: TestRendererPrivateTreeNodeType::Host,
                        element_type: element.element_type().clone(),
                        props: Self::private_json_props_without_children(element.props()),
                        instance_available: false,
                        rendered: Self::private_tree_rendered_children_from_snapshots(
                            element.children(),
                        ),
                    },
                ))
            }
        }
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
            host_output_shape: json_report.host_output_shape(),
            host_output_row: json_report.host_output_row(),
            host_output_snapshot_current: json_report.host_output_snapshot_current(),
            accepted_fiber_shape: TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE,
            accepted_composite_fiber_shape:
                TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE,
            root_child_count: json_report.root_child_count(),
            host_root: TestRendererPrivateTreeHostRootDiagnostic {
                fiber_tag: "HostRoot",
                delegates_to_child: true,
                child_fiber_tag: "HostComponent",
                public_tree_object_available: false,
            },
            function_component: TestRendererPrivateTreeFunctionComponentDiagnostic {
                fiber_tag: "FunctionComponent",
                node_type: TestRendererPrivateTreeNodeType::Component,
                component_type: TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE,
                props: TestProps::new(),
                instance_available: false,
                rendered_child_fiber_tag: "HostComponent",
                rendered_child_node_type: TestRendererPrivateTreeNodeType::Host,
                rendered_child_count: 1,
                wraps_committed_host_output: true,
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

    fn private_tree_committed_fiber_inspection_from_report(
        inspection: &TestRendererCommittedFiberTreeInspection,
    ) -> TestRendererPrivateTreeCommittedFiberInspectionReport {
        TestRendererPrivateTreeCommittedFiberInspectionReport {
            diagnostic_name: TEST_RENDERER_PRIVATE_TREE_COMMITTED_FIBER_INSPECTION_DIAGNOSTIC_NAME,
            source_tree_diagnostic_name: TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME,
            shape_name: inspection.shape_name(),
            fiber_shape: inspection
                .nodes()
                .iter()
                .map(|node| Self::private_fiber_tag_name(*node))
                .collect(),
            root_child_fiber_tags: inspection
                .root_children()
                .iter()
                .map(|node| Self::private_fiber_tag_name(*node))
                .collect(),
            host_child_fiber_tags: inspection
                .host_children()
                .iter()
                .map(|node| Self::private_fiber_tag_name(*node))
                .collect(),
            root_child_count: inspection.root_children().len(),
            host_child_count: inspection.host_children().len(),
            host_component_count: inspection.host_components().len(),
            host_text_count: inspection.host_texts().len(),
            function_component_fiber_tag: inspection
                .function_component()
                .map(Self::private_fiber_tag_name),
            function_component_present: inspection.function_component().is_some(),
            wraps_committed_host_output: inspection.has_function_component_wrapper(),
            accepted_minimal_fiber_shape: TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE,
            accepted_composite_fiber_shape:
                TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE,
            accepted_multi_child_fiber_shape:
                TEST_RENDERER_PRIVATE_TREE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE,
            accepted_composite_multi_child_fiber_shape:
                TEST_RENDERER_PRIVATE_TREE_COMPOSITE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE,
            public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers::blocked(),
            public_tree_object_available: false,
            compatibility_claimed: false,
        }
    }

    fn private_fiber_tag_name(node: TestRendererCommittedFiberNodeInspection) -> String {
        format!("{:?}", node.tag())
    }

    fn private_test_instance_find_all_query_from_tree_report(
        tree_report: &TestRendererPrivateTreeMetadataReport,
    ) -> TestRendererPrivateTestInstanceFindAllQueryDiagnostics {
        let host_component = tree_report.host_component();
        let host_text = tree_report.host_text();
        let candidate_fiber_tags = vec![host_component.fiber_tag()];
        let skipped_fiber_tags = vec![host_text.fiber_tag()];

        TestRendererPrivateTestInstanceFindAllQueryDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_ALL_DIAGNOSTIC_NAME,
            source_tree_diagnostic_name: tree_report.diagnostic_name(),
            host_output_update_kind: tree_report.host_output_update_kind(),
            host_output_snapshot_current: tree_report.host_output_snapshot_current(),
            traversal_source: "ReactTestRenderer.js findAll(root, predicate, options)",
            traversal_order: "self-then-descendants",
            default_deep: true,
            candidate_fiber_tags: candidate_fiber_tags.clone(),
            skipped_fiber_tags: skipped_fiber_tags.clone(),
            type_predicate: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
                predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind::Type,
                source: "ReactTestRenderer.js ReactTestInstance.findAllByType",
                predicate_source: "node => node.type === type",
                expected_type: Some(host_component.element_type().clone()),
                expected_props: None,
                evaluated_fiber_tags: candidate_fiber_tags.clone(),
                matched_fiber_tags: vec![host_component.fiber_tag()],
                rejected_fiber_tags: Vec::new(),
                skipped_text_child_count: skipped_fiber_tags.len(),
                predicate_execution: false,
                public_query_method_available: false,
            },
            props_predicate: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
                predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind::Props,
                source: "ReactTestRenderer.js ReactTestInstance.findAllByProps",
                predicate_source: "node => node.props && propsMatch(node.props, props)",
                expected_type: None,
                expected_props: Some(host_component.props().clone()),
                evaluated_fiber_tags: candidate_fiber_tags.clone(),
                matched_fiber_tags: vec![host_component.fiber_tag()],
                rejected_fiber_tags: Vec::new(),
                skipped_text_child_count: skipped_fiber_tags.len(),
                predicate_execution: false,
                public_query_method_available: false,
            },
            predicate_like: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
                predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind::PredicateLike,
                source: "ReactTestRenderer.js ReactTestInstance.findAll",
                predicate_source: "metadata-only predicate matching accepted type and props diagnostics",
                expected_type: Some(host_component.element_type().clone()),
                expected_props: Some(host_component.props().clone()),
                evaluated_fiber_tags: candidate_fiber_tags,
                matched_fiber_tags: vec![host_component.fiber_tag()],
                rejected_fiber_tags: Vec::new(),
                skipped_text_child_count: skipped_fiber_tags.len(),
                predicate_execution: false,
                public_query_method_available: false,
            },
            public_blockers: tree_report.public_blockers(),
            public_test_instance_object_available: false,
            public_query_methods_available: false,
            compatibility_claimed: false,
        }
    }

    fn private_test_instance_find_by_query_from_find_all_report(
        find_all_report: &TestRendererPrivateTestInstanceFindAllQueryDiagnostics,
    ) -> TestRendererPrivateTestInstanceFindByQueryDiagnostics {
        let type_predicate = find_all_report.type_predicate();
        let props_predicate = find_all_report.props_predicate();
        let expected_type = type_predicate.expected_type().cloned();
        let expected_type_name = expected_type
            .as_ref()
            .map(TestElementType::as_str)
            .unwrap_or("Unknown");
        let expected_props = props_predicate.expected_props().cloned();
        let find_all_candidate_fiber_tags = find_all_report.candidate_fiber_tags().to_vec();
        let find_all_skipped_fiber_tags = find_all_report.skipped_fiber_tags().to_vec();

        TestRendererPrivateTestInstanceFindByQueryDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_BY_DIAGNOSTIC_NAME,
            source_find_all_diagnostic_name: find_all_report.diagnostic_name(),
            source_tree_diagnostic_name: find_all_report.source_tree_diagnostic_name(),
            host_output_update_kind: find_all_report.host_output_update_kind(),
            host_output_snapshot_current: find_all_report.host_output_snapshot_current(),
            source: "ReactTestRenderer.js ReactTestInstance.findByType/findByProps",
            accepted_find_all_traversal_source: find_all_report.traversal_source(),
            effective_deep: false,
            expect_one: true,
            find_all_candidate_fiber_tags,
            find_all_skipped_fiber_tags: find_all_skipped_fiber_tags.clone(),
            find_by_type: TestRendererPrivateTestInstanceFindByResultDiagnostic {
                query_kind: TestRendererPrivateTestInstanceFindByQueryKind::Type,
                public_surface: "ReactTestInstance.findByType",
                source: "ReactTestRenderer.js ReactTestInstance.findByType",
                based_on_find_all_source: type_predicate.source(),
                based_on_predicate_kind: type_predicate.predicate_kind(),
                expect_one_message: format!("with node type: \"{expected_type_name}\""),
                expected_type,
                expected_props: None,
                effective_deep: false,
                expect_one: true,
                result_kind: "single",
                expected_canary_match_count: type_predicate.matched_candidate_count(),
                matched_candidate_count: type_predicate.matched_candidate_count(),
                candidate_fiber_tags: type_predicate.matched_fiber_tags().to_vec(),
                traversed_candidate_fiber_tags: type_predicate.evaluated_fiber_tags().to_vec(),
                skipped_fiber_tags: find_all_skipped_fiber_tags.clone(),
                zero_match_error_prefix: "No instances found ",
                duplicate_match_error_prefix: "Expected 1 but found N instances ",
                predicate_execution: type_predicate.predicate_execution(),
                public_query_method_available: false,
                public_test_instance_object_available: false,
                compatibility_claimed: false,
            },
            find_by_props: TestRendererPrivateTestInstanceFindByResultDiagnostic {
                query_kind: TestRendererPrivateTestInstanceFindByQueryKind::Props,
                public_surface: "ReactTestInstance.findByProps",
                source: "ReactTestRenderer.js ReactTestInstance.findByProps",
                based_on_find_all_source: props_predicate.source(),
                based_on_predicate_kind: props_predicate.predicate_kind(),
                expect_one_message: format!(
                    "with props: {}",
                    if expected_props.as_ref().is_some_and(|props| {
                        props.text_content().is_none() && props.attributes().is_empty()
                    }) {
                        "{}"
                    } else {
                        "<private-props>"
                    }
                ),
                expected_type: None,
                expected_props,
                effective_deep: false,
                expect_one: true,
                result_kind: "single",
                expected_canary_match_count: props_predicate.matched_candidate_count(),
                matched_candidate_count: props_predicate.matched_candidate_count(),
                candidate_fiber_tags: props_predicate.matched_fiber_tags().to_vec(),
                traversed_candidate_fiber_tags: props_predicate.evaluated_fiber_tags().to_vec(),
                skipped_fiber_tags: find_all_skipped_fiber_tags,
                zero_match_error_prefix: "No instances found ",
                duplicate_match_error_prefix: "Expected 1 but found N instances ",
                predicate_execution: props_predicate.predicate_execution(),
                public_query_method_available: false,
                public_test_instance_object_available: false,
                compatibility_claimed: false,
            },
            public_blockers: find_all_report.public_blockers(),
            public_test_instance_object_available: false,
            public_query_methods_available: false,
            compatibility_claimed: false,
        }
    }

    fn private_test_instance_query_bridge_preflight_from_query_reports(
        find_all_report: &TestRendererPrivateTestInstanceFindAllQueryDiagnostics,
        find_by_report: &TestRendererPrivateTestInstanceFindByQueryDiagnostics,
    ) -> TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics {
        TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics {
            diagnostic_name:
                TEST_RENDERER_PRIVATE_TEST_INSTANCE_QUERY_BRIDGE_PREFLIGHT_DIAGNOSTIC_NAME,
            source_find_all_diagnostic_name: find_all_report.diagnostic_name(),
            source_find_by_diagnostic_name: find_by_report.diagnostic_name(),
            bridge_status: "private-test-instance-query-bridge-preflight-ready-public-test-instance-blocked",
            bridge_source: "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.testInstanceQuery",
            wrapper_record_symbol: "fast.react_test_renderer.private_test_instance_wrapper_record",
            host_output_update_kind: find_by_report.host_output_update_kind(),
            host_output_snapshot_current: find_by_report.host_output_snapshot_current(),
            accepted_find_all_traversal_source: find_all_report.traversal_source(),
            accepted_find_by_source: find_by_report.source(),
            find_all_candidate_fiber_tags: find_all_report.candidate_fiber_tags().to_vec(),
            find_all_skipped_fiber_tags: find_all_report.skipped_fiber_tags().to_vec(),
            find_by_queries: vec![
                find_by_report.find_by_type().query_kind().as_str(),
                find_by_report.find_by_props().query_kind().as_str(),
            ],
            consumes_accepted_find_all_diagnostics: true,
            consumes_accepted_find_by_diagnostics: true,
            record_only_diagnostic_consumption: true,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: false,
            public_blockers: find_all_report.public_blockers(),
            public_root_available: false,
            public_test_instance_object_available: false,
            public_query_methods_available: false,
            compatibility_claimed: false,
        }
    }

    #[allow(
        clippy::too_many_arguments,
        reason = "private test-instance evidence builder mirrors the native query report shape"
    )]
    fn private_test_instance_native_query_execution_evidence_from_reports(
        &self,
        operation: &'static str,
        public_surface: &'static str,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        expected_host_output_update_kind: TestRendererRootUpdateKind,
        consumes_create: bool,
        consumes_update: bool,
        preflight: &TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics,
        find_by_report: &TestRendererPrivateTestInstanceFindByQueryDiagnostics,
    ) -> Result<TestRendererPrivateTestInstanceNativeQueryExecutionEvidence, TestRendererRootError>
    {
        let query = find_by_report.find_by_type();
        let expected_type = query.expected_type().cloned().ok_or(
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation,
                reason: "find-by-type-query-type-missing",
            },
        )?;
        let minimal_host_component_query_path = preflight.host_output_snapshot_current()
            && preflight.host_output_update_kind() == expected_host_output_update_kind
            && preflight.find_all_candidate_fiber_tags() == ["HostComponent"]
            && preflight.find_all_skipped_fiber_tags() == ["HostText"]
            && preflight.find_by_queries() == ["findByType", "findByProps"]
            && query.query_kind() == TestRendererPrivateTestInstanceFindByQueryKind::Type
            && query.result_kind() == "single"
            && query.matched_candidate_count() == 1
            && query.candidate_fiber_tags() == ["HostComponent"]
            && query.skipped_fiber_tags() == ["HostText"]
            && !query.public_query_method_available()
            && !query.public_test_instance_object_available()
            && !query.compatibility_claimed();

        if !minimal_host_component_query_path {
            return self.private_test_instance_native_query_execution_record_error(
                operation,
                "minimal-host-component-query-path-missing",
            );
        }

        Ok(
            TestRendererPrivateTestInstanceNativeQueryExecutionEvidence {
                diagnostic_name:
                    TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_DIAGNOSTIC_NAME,
                status: TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_STATUS,
                root: self.root_id,
                operation,
                public_surface,
                source_execution_record_id,
                source_execution_status,
                source_query_diagnostic_name: preflight.diagnostic_name(),
                query_bridge_preflight_status: preflight.bridge_status(),
                host_output_update_kind: preflight.host_output_update_kind(),
                host_output_snapshot_current: preflight.host_output_snapshot_current(),
                query_surface: query.public_surface(),
                query_kind: query.query_kind(),
                expected_type,
                result_fiber_tag: "HostComponent",
                result_kind: query.result_kind(),
                matched_candidate_count: query.matched_candidate_count(),
                query_path_candidate_count: preflight.find_all_candidate_fiber_tags().len(),
                skipped_text_child_count: preflight.find_all_skipped_fiber_tags().len(),
                consumes_accepted_native_create_execution_record: consumes_create,
                consumes_accepted_native_update_execution_record: consumes_update,
                consumes_private_test_instance_query_diagnostics: true,
                consumes_query_bridge_preflight: true,
                consumes_accepted_find_all_diagnostics: preflight
                    .consumes_accepted_find_all_diagnostics(),
                consumes_accepted_find_by_diagnostics: preflight
                    .consumes_accepted_find_by_diagnostics(),
                minimal_host_component_query_path,
                public_root_available: false,
                public_query_methods_available: false,
                public_test_instance_object_available: false,
                native_bridge_available: false,
                native_execution_available: false,
                compatibility_claimed: false,
            },
        )
    }

    fn private_test_instance_class_root_query_execution_evidence_from_reports(
        &self,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        previous_child_text: String,
        preflight: &TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics,
        find_by_report: &TestRendererPrivateTestInstanceFindByQueryDiagnostics,
        class_root: &TestRendererPrivateGetInstanceClassRootReport,
    ) -> Result<TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence, TestRendererRootError>
    {
        let query = find_by_report.find_by_type();
        let child_element_type = query.expected_type().cloned().ok_or(
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation: "update",
                reason: "find-by-type-query-type-missing",
            },
        )?;
        let rendered_host_component = class_root.rendered_host_component();
        let class_component = class_root.class_component();
        let current_child_text = class_root.rendered_host_text().text().to_owned();
        let host_child_updated = previous_child_text != current_child_text;

        let class_root_query_path = preflight.host_output_snapshot_current()
            && class_root.host_output_snapshot_current()
            && preflight.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && find_by_report.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && class_root.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && class_root.accepted_class_fiber_shape()
                == &TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE
            && class_component.fiber_tag() == "ClassComponent"
            && class_component.component_type()
                == TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE
            && class_component.rendered_child_fiber_tag() == "HostComponent"
            && class_component.rendered_child_count() == 1
            && rendered_host_component.fiber_tag() == "HostComponent"
            && rendered_host_component.element_type() == &child_element_type
            && rendered_host_component.rendered_child_count() == 1
            && rendered_host_component.rendered_text() == current_child_text
            && class_root.rendered_host_text().fiber_tag() == "HostText"
            && host_child_updated
            && !class_component.public_get_instance_available()
            && !class_root.public_get_instance_available()
            && !class_root.native_bridge_available()
            && !class_root.compatibility_claimed()
            && query.query_kind() == TestRendererPrivateTestInstanceFindByQueryKind::Type
            && query.result_kind() == "single"
            && query.matched_candidate_count() == 1
            && query.candidate_fiber_tags() == ["HostComponent"]
            && query.skipped_fiber_tags() == ["HostText"]
            && !query.public_query_method_available()
            && !query.public_test_instance_object_available()
            && !query.compatibility_claimed();

        if !class_root_query_path {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "class-root-updated-host-child-query-path-missing",
            );
        }

        Ok(
            TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence {
                diagnostic_name:
                    TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_DIAGNOSTIC_NAME,
                status: TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_STATUS,
                root: self.root_id,
                operation: "update",
                public_surface: "create().update -> create().root/ReactTestInstance.findByType",
                source_execution_record_id,
                source_execution_status,
                source_query_diagnostic_name: preflight.diagnostic_name(),
                source_get_instance_diagnostic_name: class_root.diagnostic_name(),
                query_bridge_preflight_status: preflight.bridge_status(),
                host_output_update_kind: TestRendererRootUpdateKind::Update,
                host_output_snapshot_current: true,
                accepted_class_fiber_shape:
                    TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE,
                root_query_surface: "create().root",
                root_result_fiber_tag: class_component.fiber_tag(),
                root_component_type: class_component.component_type(),
                root_props: class_component.props().clone(),
                root_child_count: class_component.rendered_child_count(),
                child_query_surface: query.public_surface(),
                child_query_kind: query.query_kind(),
                child_fiber_tag: rendered_host_component.fiber_tag(),
                child_element_type,
                child_props: rendered_host_component.props().clone(),
                previous_child_text,
                current_child_text,
                host_child_updated,
                class_root_query_path: vec!["ClassComponent", "HostComponent"],
                updated_host_child_query_path: vec!["ClassComponent", "HostComponent", "HostText"],
                consumes_accepted_native_update_execution_record: true,
                consumes_private_test_instance_query_diagnostics: true,
                consumes_query_bridge_preflight: true,
                consumes_private_get_instance_class_root_diagnostics: true,
                public_root_available: false,
                public_query_methods_available: false,
                public_test_instance_object_available: false,
                public_get_instance_available: false,
                native_bridge_available: false,
                native_execution_available: false,
                compatibility_claimed: false,
            },
        )
    }

    fn first_host_component_text_from_snapshot(snapshot: &TestContainerSnapshot) -> Option<String> {
        let TestNodeSnapshot::Element(component) = snapshot.children().first()? else {
            return None;
        };
        let TestNodeSnapshot::Text(text) = component.children().first()? else {
            return None;
        };
        Some(text.text().to_owned())
    }

    fn validate_private_test_instance_create_native_execution_record_for_canary(
        &self,
        execution: TestRendererPrivateCreateNativeBridgeHostOutputHandoff,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "record-id-mismatch",
            );
        }
        if execution.status()
            != TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "status-mismatch",
            );
        }
        if execution.root() != self.root_id
            || execution.operation() != "create"
            || execution.public_surface() != "create()"
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Create
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Create
            || execution.host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::SingleHostText
            || execution.serialization_gate_status()
                != TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "route-metadata-stale",
            );
        }
        let host_output = execution.host_output();
        if host_output.container_child_count() != 1
            || host_output.instance_count() != 1
            || host_output.text_count() != 1
            || !host_output.real_host_output_available()
            || !execution.create_route_admission_accepted()
            || !execution.host_output_handoff_accepted()
            || !execution.actual_rust_create_host_output_handoff()
            || !execution.host_output_produced_by_rust()
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "accepted-create-host-output-evidence-missing",
            );
        }
        if execution.public_create_behavior_available()
            || execution.public_serialization_available()
            || execution.public_test_instance_available()
            || execution.native_addon_loaded()
            || execution.native_bridge_available()
            || execution.native_execution()
            || execution.rust_execution_from_js()
            || execution.host_output_produced_from_js()
            || execution.compatibility_claimed()
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn validate_private_test_instance_update_native_execution_record_for_canary(
        &self,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "record-id-mismatch",
            );
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "status-mismatch",
            );
        }
        if execution.root() != self.root_id
            || execution.route_dependency_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID
            || execution.update_route_admission_id()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
            || execution.lifecycle() != TestRendererRootLifecycle::Active
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Update
        {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "route-metadata-stale",
            );
        }
        if !execution.update_route_admission_accepted()
            || !execution.lifecycle_evidence_accepted()
            || !execution.root_work_loop_handoff_accepted()
            || !execution.host_output_handoff_accepted()
            || !execution.text_update_apply_recorded()
            || execution.host_text_update_apply_count() != 1
            || execution.host_component_update_apply_count() != 1
        {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "accepted-update-host-output-evidence-missing",
            );
        }
        if execution.public_update_compatibility_claimed()
            || execution.public_serialization_available()
            || execution.act_flushing_claimed()
            || execution.native_bridge_available()
            || execution.native_execution()
            || execution.compatibility_claimed()
        {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn private_test_instance_native_query_execution_record_error<T>(
        &self,
        operation: &'static str,
        reason: &'static str,
    ) -> Result<T, TestRendererRootError> {
        Err(
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation,
                reason,
            }
            .into(),
        )
    }

    fn private_get_instance_class_root_from_tree_report(
        tree_report: TestRendererPrivateTreeMetadataReport,
    ) -> TestRendererPrivateGetInstanceClassRootReport {
        let class_props = TestProps::new().with_attribute("label", "class-root");
        let class_instance = TestRendererPrivateGetInstanceClassInstanceDiagnostic {
            constructor_name: TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_CONSTRUCTOR_NAME,
            props: class_props.clone(),
            state_marker: TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_STATE_MARKER,
            private_instance_available: true,
            public_get_instance_available: false,
            react_public_result: "class-instance",
        };

        TestRendererPrivateGetInstanceClassRootReport {
            diagnostic_name: TEST_RENDERER_PRIVATE_GET_INSTANCE_DIAGNOSTIC_NAME,
            source_tree_diagnostic_name: tree_report.diagnostic_name(),
            gate: tree_report.gate().clone(),
            host_output_update_kind: tree_report.host_output_update_kind(),
            host_output_snapshot_current: tree_report.host_output_snapshot_current(),
            accepted_class_fiber_shape:
                TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE,
            host_root_fail_closed: TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
                root_fiber_shape: TEST_RENDERER_PRIVATE_GET_INSTANCE_HOST_ROOT_FIBER_SHAPE,
                root_child_fiber_tag: "HostComponent",
                react_public_result: "null-with-default-createNodeMock",
                public_get_instance_available: false,
                private_class_instance_available: false,
                public_behavior_fail_closed: true,
            },
            function_root_fail_closed: TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
                root_fiber_shape: TEST_RENDERER_PRIVATE_GET_INSTANCE_FUNCTION_ROOT_FIBER_SHAPE,
                root_child_fiber_tag: "FunctionComponent",
                react_public_result: "null",
                public_get_instance_available: false,
                private_class_instance_available: false,
                public_behavior_fail_closed: true,
            },
            class_component: TestRendererPrivateGetInstanceClassComponentDiagnostic {
                fiber_tag: "ClassComponent",
                component_type: TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE,
                props: class_props,
                state_node_available: true,
                rendered_child_fiber_tag: tree_report.host_component().fiber_tag(),
                rendered_child_count: 1,
                instance: class_instance,
                public_get_instance_available: false,
            },
            rendered_host_component: tree_report.host_component().clone(),
            rendered_host_text: tree_report.host_text().clone(),
            public_blockers: tree_report.public_blockers(),
            public_get_instance_available: false,
            native_bridge_available: false,
            compatibility_claimed: false,
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

    fn accepted_update_route_admission_for_root(
        root: &TestRendererRoot,
    ) -> TestRendererPrivateUpdateRouteAdmissionRecord {
        TestRendererPrivateUpdateRouteAdmissionRecord {
            record_id: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
            status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
            public_surface: "create().update",
            root: root.root_id(),
            request_api: "TestRendererRoot::update",
            source_diagnostic_name: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME,
            source_diagnostic_status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS,
            lifecycle: TestRendererRootLifecycle::Active,
            scheduled_update_kind: TestRendererRootUpdateKind::Update,
            host_output_update_kind: TestRendererRootUpdateKind::Update,
            consumes_accepted_host_root_update_queue_metadata: true,
            consumes_accepted_root_work_loop_metadata: true,
            consumes_accepted_host_output_metadata: true,
            rejects_stale_root_lifecycle: true,
            rejects_stale_host_output: true,
            rejects_missing_update_queue_evidence: true,
            public_root_update_available: false,
            public_serialization_available: false,
            native_execution_available: false,
            compatibility_claimed: false,
        }
    }

    #[test]
    fn root_lifecycle_update_and_outcome_codes_are_stable_for_private_bridges() {
        assert_eq!(TestRendererRootLifecycle::Active.code(), "Active");
        assert_eq!(
            TestRendererRootLifecycle::UnmountScheduled.code(),
            "UnmountScheduled"
        );

        assert_eq!(TestRendererRootUpdateKind::Create.code(), "Create");
        assert_eq!(TestRendererRootUpdateKind::Update.code(), "Update");
        assert_eq!(TestRendererRootUpdateKind::Unmount.code(), "Unmount");
        assert_eq!(
            TestRendererRootUpdateKind::Create.container_update_api(),
            "update_container"
        );
        assert_eq!(
            TestRendererRootUpdateKind::Update.container_update_api(),
            "update_container"
        );
        assert_eq!(
            TestRendererRootUpdateKind::Unmount.container_update_api(),
            "update_container_sync"
        );
        assert!(!TestRendererRootUpdateKind::Create.sync());
        assert!(!TestRendererRootUpdateKind::Update.sync());
        assert!(TestRendererRootUpdateKind::Unmount.sync());

        let scheduled = TestRendererRoot::create(root_element(1), TestRendererOptions::new())
            .unwrap()
            .last_scheduled_update()
            .cloned()
            .expect("create schedules a root update");

        assert_eq!(
            TestRendererRootUpdateOutcome::Scheduled(scheduled).code(),
            "Scheduled"
        );
        assert_eq!(
            TestRendererRootUpdateOutcome::IgnoredAfterUnmount.code(),
            "IgnoredAfterUnmount"
        );
        assert_eq!(
            TestRendererRootUpdateOutcome::AlreadyUnmountScheduled.code(),
            "AlreadyUnmountScheduled"
        );
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
    fn root_private_create_preflight_validates_create_canary_without_public_root() {
        let invocation_count = Arc::new(AtomicUsize::new(0));
        let invocation_count_for_mock = Arc::clone(&invocation_count);
        let options = TestRendererOptions::new()
            .with_strict_mode(true)
            .with_create_node_mock(TestCreateNodeMock::new(move || {
                invocation_count_for_mock.fetch_add(1, Ordering::SeqCst);
            }))
            .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(611))
            .with_on_caught_error(RootErrorCallbackHandle::from_raw(612))
            .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(613));
        let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            root_element(91),
            "div",
        );

        let diagnostics = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            input,
            Some(options),
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
        )
        .unwrap();

        assert_eq!(
            diagnostics.diagnostic_name(),
            TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME
        );
        assert_eq!(
            diagnostics.status(),
            TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS
        );
        assert_eq!(diagnostics.input_shape(), input);
        assert_eq!(diagnostics.input_shape().root_node_kind(), "HostComponent");
        assert_eq!(diagnostics.input_shape().element_type(), "div");
        assert_eq!(
            diagnostics.input_shape().child_shape(),
            TestRendererRootCreatePreflightChildShape::Text
        );
        assert_eq!(
            diagnostics.scheduled_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert_eq!(diagnostics.scheduled_element(), root_element(91));
        assert_eq!(diagnostics.container_update_api(), "update_container");
        assert_eq!(diagnostics.scheduler_api(), "ensure_root_is_scheduled");
        let work_loop_preflight = diagnostics.work_loop_finished_work_preflight();
        assert_eq!(
            work_loop_preflight.row_id(),
            TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_ROW_ID
        );
        assert_eq!(
            work_loop_preflight.status(),
            TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_STATUS
        );
        assert_eq!(
            work_loop_preflight.metadata(),
            TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()
        );
        assert_eq!(work_loop_preflight.root(), diagnostics.root());
        assert_eq!(
            work_loop_preflight.resulting_element(),
            diagnostics.scheduled_element()
        );
        assert_eq!(
            work_loop_preflight.scheduled_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert!(!work_loop_preflight.render_lanes_empty());
        assert!(work_loop_preflight.remaining_lanes_empty());
        assert!(work_loop_preflight.finished_work_matches_render_phase());
        assert!(work_loop_preflight.records_accepted_finished_work_metadata());
        assert_ne!(
            work_loop_preflight.previous_current(),
            work_loop_preflight.finished_work()
        );
        assert!(!work_loop_preflight.public_create_behavior_available());
        assert!(work_loop_preflight.host_mutation_execution_blocked());
        assert!(work_loop_preflight.effects_refs_and_hydration_blocked());
        assert!(!work_loop_preflight.compatibility_claimed());

        let api_identity = diagnostics.canary_api_identity();
        assert_eq!(
            api_identity.metadata_id(),
            TEST_RENDERER_CURRENT_ROOT_CANARY_METADATA_ID
        );
        assert_eq!(api_identity.operation(), "create");
        assert_eq!(api_identity.root_api(), "TestRendererRoot::create");
        assert_eq!(
            api_identity.preflight_api(),
            "TestRendererRoot::describe_private_root_create_preflight_for_canary"
        );
        assert_eq!(api_identity.root_options_type(), "RootOptions");
        assert_eq!(
            api_identity.test_renderer_options_type(),
            "TestRendererOptions"
        );

        let root_options = diagnostics.root_options();
        assert_eq!(root_options.options_type(), "TestRendererOptions");
        assert!(root_options.strict_mode());
        assert!(root_options.has_create_node_mock());
        assert!(root_options.root_options_metadata_available());
        assert!(!root_options.create_node_mock_invoked());
        assert_eq!(
            root_options.root_error_options().on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(611)
        );
        assert_eq!(
            root_options.root_error_options().on_caught_error(),
            RootErrorCallbackHandle::from_raw(612)
        );
        assert_eq!(
            root_options.root_error_options().on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(613)
        );
        assert!(!root_options.public_root_error_callbacks_invoked());

        assert!(diagnostics.private_rust_root_created());
        assert!(diagnostics.private_root_canary_boundary_validated());
        assert!(!diagnostics.public_renderer_root_created());
        assert!(!diagnostics.public_root_available());
        assert!(!diagnostics.native_addon_loaded());
        assert!(!diagnostics.native_bridge_available());
        assert!(!diagnostics.native_execution());
        assert!(!diagnostics.rust_execution_from_js());
        assert!(!diagnostics.host_output_produced_from_js());
        assert!(!diagnostics.compatibility_claimed());
        assert_eq!(invocation_count.load(Ordering::SeqCst), 0);
    }

    #[test]
    fn root_private_create_preflight_fails_closed_for_unsupported_children() {
        let input =
            TestRendererRootCreatePreflightInputShape::host_component_with_unsupported_children(
                root_element(92),
                "div",
            );

        let error = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            input,
            Some(TestRendererOptions::new()),
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
        )
        .unwrap_err();

        let TestRendererRootError::RootCreatePreflight(error) = error else {
            panic!("expected root-create preflight error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererRootCreatePreflightError::UnsupportedChildren {
                child_shape: TestRendererRootCreatePreflightChildShape::Unsupported
            }
        ));
    }

    #[test]
    fn root_private_create_preflight_fails_closed_for_stale_canary_metadata() {
        let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            root_element(93),
            "div",
        );
        let stale_identity = TestRendererRootCreatePreflightCanaryApiIdentity::new_for_canary(
            "fast-react-test-renderer-stale-root-canary-metadata",
            "private-root-execution-bridge-current-rust-canary-metadata",
            "TestRendererRoot::create_legacy",
        );

        let error = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            input,
            Some(TestRendererOptions::new()),
            stale_identity,
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
        )
        .unwrap_err();

        let TestRendererRootError::RootCreatePreflight(error) = error else {
            panic!("expected root-create preflight error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererRootCreatePreflightError::StaleCanaryMetadata {
                expected_metadata_id: TEST_RENDERER_CURRENT_ROOT_CANARY_METADATA_ID,
                actual_metadata_id: "fast-react-test-renderer-stale-root-canary-metadata",
                expected_root_api: "TestRendererRoot::create",
                actual_root_api: "TestRendererRoot::create_legacy"
            }
        ));
    }

    #[test]
    fn root_private_create_preflight_fails_closed_without_root_options() {
        let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            root_element(94),
            "div",
        );

        let error = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            input,
            None,
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
        )
        .unwrap_err();

        let TestRendererRootError::RootCreatePreflight(error) = error else {
            panic!("expected root-create preflight error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererRootCreatePreflightError::MissingRootOptions
        ));
    }

    #[test]
    fn root_private_create_preflight_fails_closed_without_work_loop_metadata() {
        let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            root_element(95),
            "div",
        );

        let error = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            input,
            Some(TestRendererOptions::new()),
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            None,
        )
        .unwrap_err();

        let TestRendererRootError::RootCreatePreflight(error) = error else {
            panic!("expected root-create preflight error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererRootCreatePreflightError::MissingWorkLoopFinishedWorkPreflightMetadata
        ));
    }

    #[test]
    fn root_private_create_preflight_fails_closed_for_stale_work_loop_metadata() {
        let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            root_element(96),
            "div",
        );
        let stale_metadata = TestRendererRootWorkLoopFinishedWorkPreflightMetadata::new_for_canary(
            "fast-react-test-renderer-stale-work-loop-preflight-metadata",
            TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS,
            "TestRendererRoot::render_stale_host_root_for_commit_handoff",
        );

        let error = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            input,
            Some(TestRendererOptions::new()),
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(stale_metadata),
        )
        .unwrap_err();

        let TestRendererRootError::RootCreatePreflight(error) = error else {
            panic!("expected root-create preflight error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererRootCreatePreflightError::StaleWorkLoopFinishedWorkPreflightMetadata {
                expected_metadata_id:
                    TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_ID,
                actual_metadata_id: "fast-react-test-renderer-stale-work-loop-preflight-metadata",
                expected_render_phase_api: "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff",
                actual_render_phase_api: "TestRendererRoot::render_stale_host_root_for_commit_handoff"
            }
        ));
    }

    #[test]
    fn root_private_create_route_admission_consumes_create_and_work_loop_evidence() {
        let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            root_element(97),
            "div",
        );
        let preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            input,
            Some(TestRendererOptions::new()),
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
        )
        .unwrap();

        let admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
            Some(preflight),
            Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
        )
        .unwrap();

        assert_eq!(
            admission.record_id(),
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID
        );
        assert_eq!(
            admission.diagnostic_name(),
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_DIAGNOSTIC_NAME
        );
        assert_eq!(
            admission.status(),
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS
        );
        assert_eq!(admission.root(), preflight.root());
        assert_eq!(admission.operation(), "create");
        assert_eq!(admission.public_surface(), "create()");
        assert_eq!(
            admission.js_facade_metadata_source(),
            "FastReactTestRendererPrivateRootRequestRecord"
        );
        assert_eq!(
            admission.rust_admission_metadata(),
            TestRendererPrivateCreateRouteAdmissionMetadata::current()
        );
        assert_eq!(admission.root_create_preflight(), preflight);
        assert_eq!(
            admission.work_loop_finished_work_preflight(),
            preflight.work_loop_finished_work_preflight()
        );
        assert_eq!(
            admission.scheduled_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert_eq!(admission.scheduled_element(), root_element(97));
        assert_eq!(admission.rust_outcome(), "Scheduled");
        assert!(admission.consumes_js_facade_create_metadata());
        assert!(admission.consumes_accepted_rust_root_create_execution_evidence());
        assert!(admission.consumes_accepted_rust_root_create_preflight_diagnostics());
        assert!(admission.consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata());
        assert!(admission.missing_rust_admission_record_rejection());
        assert!(admission.stale_rust_admission_record_rejection());
        assert!(!admission.public_renderer_root_created());
        assert!(!admission.public_root_available());
        assert!(!admission.public_create_behavior_available());
        assert!(!admission.public_serialization_available());
        assert!(!admission.native_addon_loaded());
        assert!(!admission.native_bridge_available());
        assert!(!admission.native_execution());
        assert!(!admission.rust_execution_from_js());
        assert!(!admission.reconciler_execution_from_js());
        assert!(!admission.host_output_produced_from_js());
        assert!(!admission.compatibility_claimed());
    }

    #[test]
    fn root_private_create_native_bridge_handoff_consumes_actual_host_output() {
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
        let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            output.render().resulting_element(),
            "span",
        );
        let preflight = root
            .describe_private_root_create_preflight_from_render_for_canary(
                input,
                TestRendererRootCreatePreflightCanaryApiIdentity::current(),
                Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
                output.render(),
            )
            .unwrap();
        let admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
            Some(preflight),
            Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
        )
        .unwrap();

        let handoff = root
            .describe_private_create_native_bridge_host_output_handoff_for_canary(
                &admission, &output,
            )
            .unwrap();
        let host_output = handoff.host_output();

        assert_eq!(
            handoff.diagnostic_id(),
            TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID
        );
        assert_eq!(
            handoff.status(),
            TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS
        );
        assert_eq!(handoff.root(), root.root_id());
        assert_eq!(handoff.operation(), "create");
        assert_eq!(handoff.public_surface(), "create()");
        assert_eq!(
            handoff.create_route_admission_record_id(),
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID
        );
        assert_eq!(
            handoff.create_route_admission_status(),
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS
        );
        assert_eq!(
            handoff.scheduled_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert_eq!(
            handoff.scheduled_element(),
            output.render().resulting_element()
        );
        assert_eq!(
            handoff.host_output_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert_eq!(
            handoff.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::SingleHostText
        );
        assert_eq!(
            handoff.serialization_gate_status(),
            TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
        );
        assert_eq!(host_output.container_child_count(), 1);
        assert_eq!(host_output.instance_count(), 1);
        assert_eq!(host_output.text_count(), 1);
        assert!(host_output.real_host_output_available());
        assert_eq!(
            handoff.render_finished_work().slot(),
            output.render().finished_work().slot().get()
        );
        assert_eq!(
            handoff.commit_current().slot(),
            output.commit().current().slot().get()
        );
        assert_eq!(
            handoff.work_loop_finished_work_preflight(),
            admission.work_loop_finished_work_preflight()
        );
        assert!(handoff.render_finished_work_matches_create_route_preflight());
        assert!(handoff.commit_current_matches_render_finished_work());
        assert!(handoff.minimal_tree_host_output_consumes_root_finished_work());
        assert!(handoff.create_route_admission_accepted());
        assert!(handoff.host_output_handoff_accepted());
        assert!(handoff.actual_rust_create_host_output_handoff());
        assert!(handoff.host_output_produced_by_rust());
        assert!(!handoff.public_create_behavior_available());
        assert!(!handoff.public_serialization_available());
        assert!(!handoff.public_test_instance_available());
        assert!(!handoff.native_addon_loaded());
        assert!(!handoff.native_bridge_available());
        assert!(!handoff.native_execution());
        assert!(!handoff.rust_execution_from_js());
        assert!(!handoff.host_output_produced_from_js());
        assert!(!handoff.compatibility_claimed());
    }

    #[test]
    fn root_private_create_native_bridge_handoff_rejects_stale_admission() {
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
        let stale_input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            root_element(2),
            "span",
        );
        let preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            stale_input,
            Some(TestRendererOptions::new()),
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
        )
        .unwrap();
        let admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
            Some(preflight),
            Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
        )
        .unwrap();

        let error = root
            .describe_private_create_native_bridge_host_output_handoff_for_canary(
                &admission, &output,
            )
            .unwrap_err();

        let TestRendererRootError::PrivateCreateRouteAdmission(error) = error else {
            panic!("expected create-route admission error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                reason: "scheduled-element-mismatch"
            }
        ));
    }

    #[test]
    fn root_private_create_native_bridge_handoff_rejects_mismatched_finished_work_preflight() {
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
        let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            output.render().resulting_element(),
            "span",
        );
        let preflight = root
            .describe_private_root_create_preflight_from_render_for_canary(
                input,
                TestRendererRootCreatePreflightCanaryApiIdentity::current(),
                Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
                output.render(),
            )
            .unwrap();
        let mut admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
            Some(preflight),
            Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
        )
        .unwrap();
        admission.work_loop_finished_work_preflight.finished_work = admission
            .work_loop_finished_work_preflight
            .previous_current();

        let error = root
            .describe_private_create_native_bridge_host_output_handoff_for_canary(
                &admission, &output,
            )
            .unwrap_err();

        let TestRendererRootError::PrivateCreateRouteAdmission(error) = error else {
            panic!("expected create-route admission error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateCreateRouteAdmissionError::StaleCreateHostOutputHandoff {
                reason: "create-route-admission-finished-work-mismatch"
            }
        ));
    }

    #[test]
    fn root_private_create_route_admission_rejects_missing_rust_admission_record() {
        let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            root_element(98),
            "div",
        );
        let preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            input,
            Some(TestRendererOptions::new()),
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
        )
        .unwrap();

        let error = TestRendererRoot::describe_private_create_route_admission_for_canary(
            Some(preflight),
            None,
        )
        .unwrap_err();

        let TestRendererRootError::PrivateCreateRouteAdmission(error) = error else {
            panic!("expected create-route admission error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateCreateRouteAdmissionError::MissingRustAdmissionRecord
        ));
    }

    #[test]
    fn root_private_create_route_admission_rejects_stale_rust_admission_record() {
        let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            root_element(99),
            "div",
        );
        let preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            input,
            Some(TestRendererOptions::new()),
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
        )
        .unwrap();
        let stale_admission_metadata =
            TestRendererPrivateCreateRouteAdmissionMetadata::new_for_canary(
                "fast-react-test-renderer-stale-create-route-admission-metadata",
                TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_STATUS,
                "TestRendererRoot::create_legacy",
            );

        let error = TestRendererRoot::describe_private_create_route_admission_for_canary(
            Some(preflight),
            Some(stale_admission_metadata),
        )
        .unwrap_err();

        let TestRendererRootError::PrivateCreateRouteAdmission(error) = error else {
            panic!("expected create-route admission error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateCreateRouteAdmissionError::StaleRustAdmissionRecord {
                expected_metadata_id: TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_ID,
                actual_metadata_id: "fast-react-test-renderer-stale-create-route-admission-metadata",
                expected_root_api: "TestRendererRoot::create",
                actual_root_api: "TestRendererRoot::create_legacy"
            }
        ));
    }

    #[test]
    fn root_private_create_route_admission_rejects_missing_root_create_preflight() {
        let error = TestRendererRoot::describe_private_create_route_admission_for_canary(
            None,
            Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
        )
        .unwrap_err();

        let TestRendererRootError::PrivateCreateRouteAdmission(error) = error else {
            panic!("expected create-route admission error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateCreateRouteAdmissionError::MissingRootCreatePreflight
        ));
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
        let initial_props = props().with_attribute("data-state", "old");
        let updated_props = props().with_attribute("data-state", "new");
        let mut root = TestRendererRoot::create_host_component_with_props_and_text_for_canary(
            "span",
            initial_props.clone(),
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let created = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        root.update_host_component_with_props_and_text_for_canary(
            "span",
            updated_props.clone(),
            "goodbye",
        )
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
        assert_eq!(
            report.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::SingleHostText
        );
        let row = report.host_output_row().unwrap();
        let dependencies = row.dependency_diagnostics();
        assert_eq!(
            row.id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
        );
        assert_eq!(
            row.status(),
            TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_UNMOUNT_ROW_STATUS
        );
        assert_eq!(
            row.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(
            row.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::SingleHostText
        );
        assert_eq!(row.previous_root_child_count(), 1);
        assert_eq!(row.current_root_child_count(), 1);
        assert_eq!(row.previous_host_component_count(), 1);
        assert_eq!(row.current_host_component_count(), 1);
        assert_eq!(row.previous_host_text_count(), 1);
        assert_eq!(row.current_host_text_count(), 1);
        assert_eq!(row.current_root_text_count(), 0);
        assert_eq!(row.current_max_host_component_depth(), 1);
        assert_eq!(
            dependencies.route_row_id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID
        );
        assert_eq!(
            dependencies.serialization_row_id(),
            TEST_RENDERER_PRIVATE_TO_JSON_SERIALIZATION_DEPENDENCY_ID
        );
        assert!(dependencies.route_diagnostics_available());
        assert!(dependencies.serialization_diagnostics_available());
        assert!(dependencies.host_output_snapshot_current());
        assert!(dependencies.public_surfaces_blocked());
        assert!(row.public_blockers().all_blocked());
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
        assert_eq!(nodes[0].props(), Some(&updated_props));
        assert_eq!(nodes[0].child_ordinals(), &[1]);
        assert_eq!(nodes[1].ordinal(), 1);
        assert_eq!(nodes[1].node_kind(), TestRendererPrivateJsonNodeKind::Text);
        assert_eq!(nodes[1].parent_ordinal(), Some(0));
        assert_eq!(nodes[1].text(), Some("goodbye"));
        assert_eq!(component.element_type().as_str(), "span");
        assert_eq!(component.props(), &updated_props);
        assert_eq!(component.child_count(), 1);
        assert_eq!(text.text(), "goodbye");
        assert!(report.public_blockers().all_blocked());

        let TestNodeSnapshot::Element(previous) = &updated.previous_snapshot().children()[0] else {
            panic!("expected previous host component");
        };
        assert_eq!(previous.props(), &initial_props);
        assert_eq!(child_texts(previous), vec!["hello"]);
        let TestNodeSnapshot::Element(current) = &updated.snapshot().children()[0] else {
            panic!("expected updated host component");
        };
        assert_eq!(current.props(), &updated_props);
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
        assert_eq!(
            result.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::SingleHostText
        );
        assert!(result.host_output_snapshot_current());
        assert_eq!(result.element_type().as_str(), "span");
        assert_eq!(result.props(), &TestProps::new());
        assert_eq!(result.children(), &["hello".to_owned()]);
        assert_eq!(result.child_count(), 1);
        let rendered_root = result.rendered_root().as_host_component().unwrap();
        assert_eq!(rendered_root.element_type().as_str(), "span");
        assert!(rendered_root.props().is_empty());
        assert_eq!(
            rendered_root.children().unwrap()[0].as_text(),
            Some("hello")
        );
        assert_eq!(result.source_node_count(), 2);
        assert!(result.public_blockers().all_blocked());
        assert!(!result.public_serialization_available());
        assert!(!result.compatibility_claimed());
    }

    #[test]
    fn root_private_to_json_facade_result_canary_wraps_update_serialization_evidence() {
        let initial_props = props().with_attribute("data-state", "old");
        let updated_props = props().with_attribute("data-state", "new");
        let mut root = TestRendererRoot::create_host_component_with_props_and_text_for_canary(
            "span",
            initial_props,
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        root.update_host_component_with_props_and_text_for_canary(
            "span",
            updated_props.clone(),
            "goodbye",
        )
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
        assert_eq!(
            result.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::SingleHostText
        );
        assert_eq!(
            result.host_output_row().unwrap().id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
        );
        assert!(result.host_output_snapshot_current());
        assert_eq!(result.element_type().as_str(), "span");
        assert_eq!(result.props(), &updated_props);
        assert_eq!(result.children(), &["goodbye".to_owned()]);
        let rendered_root = result.rendered_root().as_host_component().unwrap();
        assert_eq!(
            rendered_root.props().get("data-state").map(String::as_str),
            Some("new")
        );
        assert_eq!(
            rendered_root.children().unwrap()[0].as_text(),
            Some("goodbye")
        );
        assert_eq!(result.source_node_count(), 2);
        assert!(result.public_blockers().all_blocked());
        assert!(!result.public_serialization_available());
        assert!(!result.compatibility_claimed());
    }

    #[test]
    fn root_private_to_json_native_execution_evidence_consumes_create_update_unmount_records() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let create_input =
            TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
                root_element(1),
                "span",
            );
        let create_preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            create_input,
            Some(TestRendererOptions::new()),
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
        )
        .unwrap();
        let create_admission =
            TestRendererRoot::describe_private_create_route_admission_for_canary(
                Some(create_preflight),
                Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
            )
            .unwrap();
        let created = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();

        let create_evidence = root
            .describe_private_to_json_after_create_native_execution_for_canary(
                &created,
                create_admission,
            )
            .unwrap();

        assert_eq!(
            create_evidence.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_DIAGNOSTIC_NAME
        );
        assert_eq!(
            create_evidence.status(),
            TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_STATUS
        );
        assert_eq!(create_evidence.root(), root.root_id());
        assert_eq!(create_evidence.operation(), "create");
        assert_eq!(create_evidence.public_surface(), "create().toJSON");
        assert_eq!(
            create_evidence.source_execution_record_id(),
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID
        );
        assert_eq!(
            create_evidence.host_output_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert_eq!(
            create_evidence.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::SingleHostText
        );
        assert!(create_evidence.host_output_row().is_none());
        assert!(
            create_evidence
                .rendered_root()
                .as_host_component()
                .is_some()
        );
        assert_eq!(create_evidence.source_node_count(), 2);
        assert_eq!(create_evidence.root_child_count(), 1);
        assert!(create_evidence.consumes_accepted_native_create_execution_record());
        assert!(!create_evidence.consumes_accepted_native_update_execution_record());
        assert!(!create_evidence.consumes_accepted_native_unmount_execution_record());
        assert!(create_evidence.consumes_private_to_json_evidence());
        assert!(create_evidence.minimal_tree_shape());
        assert!(!create_evidence.public_to_json_available());
        assert!(!create_evidence.public_serialization_available());
        assert!(!create_evidence.public_route_available());
        assert!(!create_evidence.native_bridge_available());
        assert!(!create_evidence.native_execution_available());
        assert!(!create_evidence.compatibility_claimed());

        root.update_host_component_with_props_and_text_for_canary(
            "span",
            props().with_attribute("data-state", "new"),
            "goodbye",
        )
        .unwrap();
        let updated = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();
        let update_admission = root
            .describe_private_update_route_admission_for_canary(&updated)
            .unwrap();

        let update_evidence = root
            .describe_private_to_json_after_update_native_execution_for_canary(
                &updated,
                update_admission,
            )
            .unwrap();

        assert_eq!(update_evidence.operation(), "update");
        assert_eq!(
            update_evidence.source_execution_record_id(),
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
        );
        assert_eq!(
            update_evidence.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(
            update_evidence.host_output_row().unwrap().id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
        );
        assert!(!update_evidence.consumes_accepted_native_create_execution_record());
        assert!(update_evidence.consumes_accepted_native_update_execution_record());
        assert!(!update_evidence.consumes_accepted_native_unmount_execution_record());
        assert!(update_evidence.consumes_accepted_host_output_row());
        assert!(update_evidence.minimal_tree_shape());
        let updated_rendered_root = update_evidence.rendered_root().as_host_component().unwrap();
        assert_eq!(
            updated_rendered_root
                .props()
                .get("data-state")
                .map(String::as_str),
            Some("new")
        );
        assert_eq!(
            updated_rendered_root.children().unwrap()[0].as_text(),
            Some("goodbye")
        );
        assert!(!update_evidence.public_serialization_available());
        assert!(!update_evidence.compatibility_claimed());

        let unmount_outcome = root.unmount().unwrap();
        let unmounted = root
            .render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap();
        let unmount_handoff = root
            .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
            .unwrap();
        let unmount_admission = root
            .describe_private_unmount_native_bridge_admission_for_canary(
                &unmount_outcome,
                Some(&unmount_handoff),
            )
            .unwrap();

        let unmount_evidence = root
            .describe_private_to_json_after_unmount_native_execution_for_canary(
                &unmounted,
                unmount_admission,
            )
            .unwrap();

        assert_eq!(unmount_evidence.operation(), "unmount");
        assert_eq!(
            unmount_evidence.source_execution_record_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        );
        assert_eq!(
            unmount_evidence.host_output_update_kind(),
            TestRendererRootUpdateKind::Unmount
        );
        assert_eq!(
            unmount_evidence.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::EmptyRoot
        );
        assert_eq!(
            unmount_evidence.host_output_row().unwrap().id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
        );
        assert!(unmount_evidence.rendered_root().is_null());
        assert_eq!(unmount_evidence.source_node_count(), 0);
        assert_eq!(unmount_evidence.root_child_count(), 0);
        assert!(!unmount_evidence.consumes_accepted_native_create_execution_record());
        assert!(!unmount_evidence.consumes_accepted_native_update_execution_record());
        assert!(unmount_evidence.consumes_accepted_native_unmount_execution_record());
        assert!(unmount_evidence.consumes_accepted_host_output_row());
        assert!(unmount_evidence.minimal_tree_shape());
        assert!(!unmount_evidence.public_to_json_available());
        assert!(!unmount_evidence.native_bridge_available());
        assert!(!unmount_evidence.native_execution_available());
        assert!(!unmount_evidence.compatibility_claimed());
    }

    #[test]
    fn root_private_to_json_native_execution_evidence_rejects_stale_update_record() {
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
        let mut update_admission = root
            .describe_private_update_route_admission_for_canary(&updated)
            .unwrap();
        update_admission.host_output_update_kind = TestRendererRootUpdateKind::Create;

        let error = root
            .describe_private_to_json_after_update_native_execution_for_canary(
                &updated,
                update_admission,
            )
            .unwrap_err();

        let TestRendererRootError::PrivateJsonSerialization(error) = error else {
            panic!("expected private JSON native execution rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
                operation: "update",
                reason: "route-metadata-stale"
            }
        ));
    }

    #[test]
    fn root_private_to_json_nested_update_native_execution_evidence_consumes_multichild_row() {
        let mut root = TestRendererRoot::create_nested_host_components_with_text_for_canary(
            "section",
            "span",
            "stable",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_nested_host_output_for_canary()
            .unwrap()
            .unwrap();
        let placed = root
            .render_and_commit_nested_host_parent_text_placement_for_canary("inserted")
            .unwrap();
        let execution = accepted_update_route_admission_for_root(&root);

        let evidence = root
            .describe_private_to_json_after_nested_update_native_execution_for_canary(
                &placed, execution,
            )
            .unwrap();

        assert_eq!(evidence.operation(), "update");
        assert_eq!(
            evidence.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(
            evidence.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::NestedHostText
        );
        assert_eq!(
            evidence.host_output_row().unwrap().id(),
            TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID
        );
        assert_eq!(evidence.source_node_count(), 4);
        assert_eq!(evidence.root_child_count(), 1);
        assert!(evidence.consumes_accepted_native_update_execution_record());
        assert!(evidence.consumes_accepted_host_output_row());
        assert!(!evidence.minimal_tree_shape());
        assert!(!evidence.public_to_json_available());
        assert!(!evidence.public_serialization_available());
        assert!(!evidence.native_bridge_available());
        assert!(!evidence.native_execution_available());
        assert!(!evidence.compatibility_claimed());

        let rendered = evidence.rendered_root().as_host_component().unwrap();
        assert_eq!(rendered.element_type().as_str(), "section");
        let inner = rendered.children().unwrap()[0].as_host_component().unwrap();
        assert_eq!(inner.element_type().as_str(), "span");
        assert_eq!(inner.children().unwrap()[0].as_text(), Some("stable"));
        assert_eq!(inner.children().unwrap()[1].as_text(), Some("inserted"));
    }

    #[test]
    fn root_private_to_json_sibling_text_native_execution_evidence_consumes_sibling_row() {
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
        let execution = root
            .describe_private_update_route_admission_for_canary(&updated)
            .unwrap();
        let previous_snapshot = TestContainerSnapshot {
            children: vec![TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: element_type("span"),
                props: TestProps::new(),
                hidden: false,
                detached: false,
                children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "second sibling".to_owned(),
                    hidden: false,
                })],
            })],
        };
        let current_snapshot = TestContainerSnapshot {
            children: vec![
                TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "first sibling".to_owned(),
                    hidden: false,
                }),
                TestNodeSnapshot::Element(TestElementSnapshot {
                    element_type: element_type("span"),
                    props: TestProps::new(),
                    hidden: false,
                    detached: false,
                    children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                        text: "second sibling".to_owned(),
                        hidden: false,
                    })],
                }),
            ],
        };

        let evidence = root
            .describe_private_to_json_sibling_text_update_native_execution_from_snapshot_for_diagnostics(
                &previous_snapshot,
                &current_snapshot,
                execution,
            )
            .unwrap();

        assert_eq!(evidence.operation(), "update");
        assert_eq!(
            evidence.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::SiblingText
        );
        assert_eq!(
            evidence.host_output_row().unwrap().id(),
            TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
        );
        assert_eq!(evidence.source_node_count(), 3);
        assert_eq!(evidence.root_child_count(), 2);
        assert!(evidence.consumes_accepted_native_update_execution_record());
        assert!(evidence.consumes_accepted_host_output_row());
        assert!(!evidence.minimal_tree_shape());
        assert!(!evidence.public_to_json_available());
        assert!(!evidence.public_serialization_available());
        assert!(!evidence.native_bridge_available());
        assert!(!evidence.native_execution_available());

        let children = evidence.rendered_root().as_array().unwrap();
        assert_eq!(children[0].as_text(), Some("first sibling"));
        let component = children[1].as_host_component().unwrap();
        assert_eq!(component.element_type().as_str(), "span");
        assert_eq!(
            component.children().unwrap()[0].as_text(),
            Some("second sibling")
        );
    }

    #[test]
    fn root_private_to_json_native_execution_evidence_rejects_row_id_shape_mismatch() {
        let root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let previous_snapshot = TestContainerSnapshot { children: vec![] };
        let current_snapshot = TestContainerSnapshot {
            children: vec![
                TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "first sibling".to_owned(),
                    hidden: false,
                }),
                TestNodeSnapshot::Element(TestElementSnapshot {
                    element_type: element_type("span"),
                    props: TestProps::new(),
                    hidden: false,
                    detached: false,
                    children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                        text: "second sibling".to_owned(),
                        hidden: false,
                    })],
                }),
            ],
        };
        let mut row =
            TestRendererRoot::describe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics(
                &previous_snapshot,
                &current_snapshot,
            )
            .unwrap();
        row.id = TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID;

        let error = root
            .private_to_json_native_execution_evidence_from_host_output_row(
                "update",
                "create().update -> create().toJSON",
                TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
                TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
                false,
                true,
                false,
                row,
                &current_snapshot,
            )
            .unwrap_err();

        let TestRendererRootError::PrivateJsonSerialization(error) = error else {
            panic!("expected private JSON serialization error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
                row_id,
                expected: TestRendererPrivateToJsonHostOutputShape::NestedHostText,
                actual: TestRendererPrivateToJsonHostOutputShape::SiblingText,
            } if *row_id == TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID
        ));
    }

    #[test]
    fn root_private_to_tree_native_execution_evidence_consumes_create_update_unmount_records() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let create_input =
            TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
                root_element(1),
                "span",
            );
        let create_preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            create_input,
            Some(TestRendererOptions::new()),
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
        )
        .unwrap();
        let create_admission =
            TestRendererRoot::describe_private_create_route_admission_for_canary(
                Some(create_preflight),
                Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
            )
            .unwrap();
        let created = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();

        let create_evidence = root
            .describe_private_to_tree_after_create_native_execution_for_canary(
                &created,
                create_admission,
            )
            .unwrap();

        assert_eq!(
            create_evidence.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_DIAGNOSTIC_NAME
        );
        assert_eq!(
            create_evidence.status(),
            TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_STATUS
        );
        assert_eq!(create_evidence.root(), root.root_id());
        assert_eq!(create_evidence.operation(), "create");
        assert_eq!(create_evidence.public_surface(), "create().toTree");
        assert_eq!(
            create_evidence.source_execution_record_id(),
            TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID
        );
        assert_eq!(
            create_evidence.source_tree_diagnostic_name(),
            TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
        );
        assert_eq!(
            create_evidence.host_output_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert_eq!(
            create_evidence.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::SingleHostText
        );
        assert!(create_evidence.host_output_row().is_none());
        let create_component = create_evidence
            .rendered_root()
            .as_function_component()
            .unwrap();
        let create_host = create_component.rendered().as_host_component().unwrap();
        assert_eq!(create_component.component_type(), "CanaryFunctionComponent");
        assert_eq!(create_host.element_type().as_str(), "span");
        assert_eq!(create_host.rendered()[0].as_text(), Some("hello"));
        assert_eq!(
            create_evidence.source_fiber_count(),
            TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE.len()
        );
        assert_eq!(create_evidence.root_child_count(), 1);
        assert!(create_evidence.consumes_accepted_native_create_execution_record());
        assert!(!create_evidence.consumes_accepted_native_update_execution_record());
        assert!(!create_evidence.consumes_accepted_native_unmount_execution_record());
        assert!(create_evidence.consumes_private_to_tree_evidence());
        assert!(!create_evidence.consumes_accepted_host_output_row());
        assert!(create_evidence.minimal_tree_shape());
        assert!(create_evidence.function_component_above_host_output_shape());
        assert!(!create_evidence.public_to_tree_available());
        assert!(!create_evidence.public_serialization_available());
        assert!(!create_evidence.public_route_available());
        assert!(!create_evidence.native_bridge_available());
        assert!(!create_evidence.native_execution_available());
        assert!(!create_evidence.compatibility_claimed());

        root.update_host_component_with_text_for_canary("span", "goodbye")
            .unwrap();
        let updated = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();
        let update_admission = root
            .describe_private_update_route_admission_for_canary(&updated)
            .unwrap();

        let update_evidence = root
            .describe_private_to_tree_after_update_native_execution_for_canary(
                &updated,
                update_admission,
            )
            .unwrap();

        assert_eq!(update_evidence.operation(), "update");
        assert_eq!(
            update_evidence.source_execution_record_id(),
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
        );
        assert_eq!(
            update_evidence.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(
            update_evidence.host_output_row().unwrap().id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
        );
        assert!(!update_evidence.consumes_accepted_native_create_execution_record());
        assert!(update_evidence.consumes_accepted_native_update_execution_record());
        assert!(!update_evidence.consumes_accepted_native_unmount_execution_record());
        assert!(update_evidence.consumes_accepted_host_output_row());
        assert!(update_evidence.minimal_tree_shape());
        let update_component = update_evidence
            .rendered_root()
            .as_function_component()
            .unwrap();
        let update_host = update_component.rendered().as_host_component().unwrap();
        assert_eq!(update_host.rendered()[0].as_text(), Some("goodbye"));
        assert!(update_evidence.function_component_above_host_output_shape());
        assert!(!update_evidence.public_to_tree_available());
        assert!(!update_evidence.compatibility_claimed());

        let unmount_outcome = root.unmount().unwrap();
        let unmounted = root
            .render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap();
        let unmount_handoff = root
            .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
            .unwrap();
        let unmount_admission = root
            .describe_private_unmount_native_bridge_admission_for_canary(
                &unmount_outcome,
                Some(&unmount_handoff),
            )
            .unwrap();

        let unmount_evidence = root
            .describe_private_to_tree_after_unmount_native_execution_for_canary(
                &unmounted,
                unmount_admission,
            )
            .unwrap();

        assert_eq!(unmount_evidence.operation(), "unmount");
        assert_eq!(
            unmount_evidence.source_execution_record_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        );
        assert_eq!(
            unmount_evidence.host_output_update_kind(),
            TestRendererRootUpdateKind::Unmount
        );
        assert_eq!(
            unmount_evidence.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::EmptyRoot
        );
        assert_eq!(
            unmount_evidence.host_output_row().unwrap().id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
        );
        assert!(unmount_evidence.rendered_root().is_null());
        assert_eq!(unmount_evidence.source_fiber_count(), 0);
        assert_eq!(unmount_evidence.root_child_count(), 0);
        assert!(!unmount_evidence.consumes_accepted_native_create_execution_record());
        assert!(!unmount_evidence.consumes_accepted_native_update_execution_record());
        assert!(unmount_evidence.consumes_accepted_native_unmount_execution_record());
        assert!(unmount_evidence.consumes_accepted_host_output_row());
        assert!(unmount_evidence.minimal_tree_shape());
        assert!(!unmount_evidence.function_component_above_host_output_shape());
        assert!(!unmount_evidence.public_to_tree_available());
        assert!(!unmount_evidence.native_bridge_available());
        assert!(!unmount_evidence.native_execution_available());
        assert!(!unmount_evidence.compatibility_claimed());
    }

    #[test]
    fn root_private_to_tree_native_execution_evidence_records_composite_host_shape() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        let create_input =
            TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
                root_element(1),
                "span",
            );
        let create_preflight = TestRendererRoot::describe_private_root_create_preflight_for_canary(
            create_input,
            Some(TestRendererOptions::new()),
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
        )
        .unwrap();
        let create_admission =
            TestRendererRoot::describe_private_create_route_admission_for_canary(
                Some(create_preflight),
                Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
            )
            .unwrap();
        let created = root
            .render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();

        let evidence = root
            .describe_private_to_tree_after_create_native_execution_for_canary(
                &created,
                create_admission,
            )
            .unwrap();
        let component = evidence.rendered_root().as_function_component().unwrap();
        let rendered_host = component.rendered().as_host_component().unwrap();

        assert_eq!(
            evidence.source_fiber_count(),
            TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE.len()
        );
        assert!(evidence.minimal_tree_shape());
        assert!(evidence.function_component_above_host_output_shape());
        assert_eq!(
            component.node_type(),
            TestRendererPrivateTreeNodeType::Component
        );
        assert_eq!(
            component.component_type(),
            TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
        );
        assert!(!component.instance_available());
        assert!(component.wraps_committed_host_output());
        assert_eq!(
            rendered_host.node_type(),
            TestRendererPrivateTreeNodeType::Host
        );
        assert_eq!(rendered_host.rendered()[0].as_text(), Some("hello"));
        assert!(!evidence.public_to_tree_available());
        assert!(!evidence.native_execution_available());
        assert!(!evidence.compatibility_claimed());
    }

    #[test]
    fn root_private_to_json_unmount_host_output_row_records_empty_snapshot_blockers() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        root.unmount().unwrap();
        let unmounted = root
            .render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap();

        let row = root
            .describe_private_to_json_host_output_unmount_row_for_canary(&unmounted)
            .unwrap();
        let dependencies = row.dependency_diagnostics();

        assert_eq!(
            row.id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID
        );
        assert_eq!(
            row.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME
        );
        assert_eq!(
            row.status(),
            TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_UNMOUNT_ROW_STATUS
        );
        assert_eq!(
            row.host_output_update_kind(),
            TestRendererRootUpdateKind::Unmount
        );
        assert_eq!(
            row.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::EmptyRoot
        );
        assert_eq!(row.previous_root_child_count(), 1);
        assert_eq!(row.current_root_child_count(), 0);
        assert_eq!(row.previous_host_component_count(), 1);
        assert_eq!(row.current_host_component_count(), 0);
        assert_eq!(row.previous_host_text_count(), 1);
        assert_eq!(row.current_host_text_count(), 0);
        assert_eq!(row.current_root_text_count(), 0);
        assert_eq!(row.current_max_host_component_depth(), 0);
        assert_eq!(
            dependencies.route_row_id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
        );
        assert_eq!(
            dependencies.serialization_row_id(),
            TEST_RENDERER_PRIVATE_TO_JSON_SERIALIZATION_DEPENDENCY_ID
        );
        assert!(dependencies.route_diagnostics_available());
        assert!(dependencies.serialization_diagnostics_available());
        assert!(dependencies.host_output_snapshot_current());
        assert!(!dependencies.public_to_json_available());
        assert!(!dependencies.public_test_instance_available());
        assert!(!dependencies.native_execution_available());
        assert!(!dependencies.compatibility_claimed());
        assert!(dependencies.public_surfaces_blocked());
        assert!(row.public_blockers().all_blocked());
        assert!(unmounted.snapshot().children().is_empty());
        assert!(
            !unmounted
                .host_node_cleanup()
                .public_unmount_compatibility_claimed()
        );
    }

    #[test]
    fn root_private_to_json_unmount_host_output_row_rejects_stale_snapshot() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        root.unmount().unwrap();
        let mut unmounted = root
            .render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap();
        unmounted.snapshot = unmounted.previous_snapshot.clone();

        let error = root
            .describe_private_to_json_host_output_unmount_row_for_canary(&unmounted)
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
    fn root_private_to_json_nested_host_output_update_row_records_nested_text_rows() {
        let mut root = TestRendererRoot::create_nested_host_components_with_text_for_canary(
            "section",
            "span",
            "stable",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_nested_host_output_for_canary()
            .unwrap()
            .unwrap();
        let placed = root
            .render_and_commit_nested_host_parent_text_placement_for_canary("inserted")
            .unwrap();

        let row = root
            .describe_private_to_json_nested_host_output_update_row_for_canary(&placed)
            .unwrap();
        let dependencies = row.dependency_diagnostics();

        assert_eq!(
            row.id(),
            TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID
        );
        assert_eq!(
            row.status(),
            TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_UNMOUNT_ROW_STATUS
        );
        assert_eq!(
            row.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(
            row.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::NestedHostText
        );
        assert_eq!(row.previous_root_child_count(), 1);
        assert_eq!(row.current_root_child_count(), 1);
        assert_eq!(row.previous_host_component_count(), 2);
        assert_eq!(row.current_host_component_count(), 2);
        assert_eq!(row.previous_host_text_count(), 1);
        assert_eq!(row.current_host_text_count(), 2);
        assert_eq!(row.current_root_text_count(), 0);
        assert_eq!(row.current_max_host_component_depth(), 2);
        assert_eq!(
            dependencies.route_row_id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID
        );
        assert_eq!(
            dependencies.serialization_row_id(),
            TEST_RENDERER_PRIVATE_TO_JSON_SERIALIZATION_DEPENDENCY_ID
        );
        assert!(dependencies.host_output_snapshot_current());
        assert!(dependencies.public_surfaces_blocked());
        assert!(row.public_blockers().all_blocked());
        assert_eq!(
            nested_container_inner_texts(placed.previous_snapshot()),
            vec!["stable"]
        );
        assert_eq!(
            nested_container_inner_texts(placed.snapshot()),
            vec!["stable", "inserted"]
        );
    }

    #[test]
    fn root_private_to_json_nested_host_output_update_row_rejects_stale_snapshot() {
        let mut root = TestRendererRoot::create_nested_host_components_with_text_for_canary(
            "section",
            "span",
            "stable",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_nested_host_output_for_canary()
            .unwrap()
            .unwrap();
        let mut placed = root
            .render_and_commit_nested_host_parent_text_placement_for_canary("inserted")
            .unwrap();
        placed.snapshot = placed.previous_snapshot.clone();

        let error = root
            .describe_private_to_json_nested_host_output_update_row_for_canary(&placed)
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
    fn root_private_to_json_sibling_text_host_output_row_records_text_sibling_shape() {
        let previous_snapshot = TestContainerSnapshot {
            children: vec![TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: element_type("span"),
                props: TestProps::new(),
                hidden: false,
                detached: false,
                children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "second sibling".to_owned(),
                    hidden: false,
                })],
            })],
        };
        let current_snapshot = TestContainerSnapshot {
            children: vec![
                TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "first sibling".to_owned(),
                    hidden: false,
                }),
                TestNodeSnapshot::Element(TestElementSnapshot {
                    element_type: element_type("span"),
                    props: TestProps::new(),
                    hidden: false,
                    detached: false,
                    children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                        text: "second sibling".to_owned(),
                        hidden: false,
                    })],
                }),
            ],
        };

        let row =
            TestRendererRoot::describe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics(
                &previous_snapshot,
                &current_snapshot,
            )
            .unwrap();

        assert_eq!(
            row.id(),
            TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
        );
        assert_eq!(
            row.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(
            row.host_output_shape(),
            TestRendererPrivateToJsonHostOutputShape::SiblingText
        );
        assert_eq!(row.previous_root_child_count(), 1);
        assert_eq!(row.current_root_child_count(), 2);
        assert_eq!(row.previous_host_component_count(), 1);
        assert_eq!(row.current_host_component_count(), 1);
        assert_eq!(row.previous_host_text_count(), 1);
        assert_eq!(row.current_host_text_count(), 2);
        assert_eq!(row.current_root_text_count(), 1);
        assert_eq!(row.current_max_host_component_depth(), 1);
        assert!(row.dependency_diagnostics().public_surfaces_blocked());
        assert!(row.public_blockers().all_blocked());
    }

    #[test]
    fn root_private_to_json_sibling_text_host_output_row_rejects_mismatched_shape() {
        let previous_snapshot = TestContainerSnapshot { children: vec![] };
        let current_snapshot = TestContainerSnapshot {
            children: vec![TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: element_type("span"),
                props: TestProps::new(),
                hidden: false,
                detached: false,
                children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "only child".to_owned(),
                    hidden: false,
                })],
            })],
        };

        let error =
            TestRendererRoot::describe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics(
                &previous_snapshot,
                &current_snapshot,
            )
            .unwrap_err();

        let TestRendererRootError::PrivateJsonSerialization(error) = error else {
            panic!("expected private JSON serialization error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateJsonSerializationError::HostOutputRowShapeMismatch {
                row_id,
                expected: TestRendererPrivateToJsonHostOutputShape::SiblingText,
                actual: TestRendererPrivateToJsonHostOutputShape::SingleHostText,
            } if *row_id == TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID
        ));
    }

    #[test]
    fn root_private_to_json_update_host_output_row_rejects_mismatched_row_kind() {
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
        let mut report = root
            .describe_private_json_serialization_after_update_for_canary(&updated)
            .unwrap();
        let mut row = report.host_output_row().unwrap();
        row.host_output_update_kind = TestRendererRootUpdateKind::Unmount;
        report.host_output_row = Some(row);

        let error =
            TestRendererRoot::private_to_json_facade_result_from_report(&report).unwrap_err();

        let TestRendererRootError::PrivateJsonSerialization(error) = error else {
            panic!("expected private JSON serialization error");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateJsonSerializationError::HostOutputRowMismatch {
                row_id,
                expected: TestRendererRootUpdateKind::Update,
                actual: TestRendererRootUpdateKind::Unmount,
            } if *row_id == TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID
        ));
    }

    #[test]
    fn root_private_to_json_shape_diagnostics_serialize_empty_root_as_null() {
        let snapshot = TestContainerSnapshot { children: vec![] };

        let rendered =
            TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics(
                &snapshot,
            );

        assert!(rendered.is_null());
    }

    #[test]
    fn root_private_to_json_shape_diagnostics_serialize_multiple_host_children_and_text_siblings() {
        let snapshot = TestContainerSnapshot {
            children: vec![
                TestNodeSnapshot::Element(TestElementSnapshot {
                    element_type: element_type("div"),
                    props: props().with_attribute("id", "first"),
                    hidden: false,
                    detached: false,
                    children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                        text: "one".to_owned(),
                        hidden: false,
                    })],
                }),
                TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "tail".to_owned(),
                    hidden: false,
                }),
                TestNodeSnapshot::Element(TestElementSnapshot {
                    element_type: element_type("span"),
                    props: props().with_attribute("className", "tag"),
                    hidden: false,
                    detached: false,
                    children: vec![
                        TestNodeSnapshot::Text(TestTextSnapshot {
                            text: "two".to_owned(),
                            hidden: false,
                        }),
                        TestNodeSnapshot::Text(TestTextSnapshot {
                            text: "three".to_owned(),
                            hidden: false,
                        }),
                    ],
                }),
            ],
        };

        let rendered =
            TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics(
                &snapshot,
            );
        let children = rendered.as_array().unwrap();
        let first = children[0].as_host_component().unwrap();
        let second = children[1].as_text().unwrap();
        let third = children[2].as_host_component().unwrap();

        assert_eq!(children.len(), 3);
        assert_eq!(first.element_type().as_str(), "div");
        assert_eq!(first.props().get("id").map(String::as_str), Some("first"));
        assert_eq!(first.child_count(), 1);
        assert_eq!(first.children().unwrap()[0].as_text(), Some("one"));
        assert_eq!(second, "tail");
        assert_eq!(third.element_type().as_str(), "span");
        assert_eq!(
            third.props().get("className").map(String::as_str),
            Some("tag")
        );
        assert_eq!(third.child_count(), 2);
        assert_eq!(third.children().unwrap()[0].as_text(), Some("two"));
        assert_eq!(third.children().unwrap()[1].as_text(), Some("three"));
    }

    #[test]
    fn root_private_to_json_shape_diagnostics_elide_children_prop() {
        let snapshot = TestContainerSnapshot {
            children: vec![TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: element_type("div"),
                props: props()
                    .with_attribute("children", "prop child")
                    .with_attribute("data-id", "kept"),
                hidden: false,
                detached: false,
                children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "rendered child".to_owned(),
                    hidden: false,
                })],
            })],
        };

        let rendered =
            TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics(
                &snapshot,
            );
        let component = rendered.as_host_component().unwrap();

        assert_eq!(component.element_type().as_str(), "div");
        assert_eq!(
            component.props().get("data-id").map(String::as_str),
            Some("kept")
        );
        assert!(!component.props().contains_key("children"));
        assert_eq!(component.child_count(), 1);
        assert_eq!(
            component.children().unwrap()[0].as_text(),
            Some("rendered child")
        );
    }

    #[test]
    fn root_private_to_tree_shape_diagnostics_serialize_multiple_host_children_and_text_siblings() {
        let snapshot = TestContainerSnapshot {
            children: vec![
                TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "first sibling".to_owned(),
                    hidden: false,
                }),
                TestNodeSnapshot::Element(TestElementSnapshot {
                    element_type: element_type("span"),
                    props: props(),
                    hidden: false,
                    detached: false,
                    children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                        text: "second sibling".to_owned(),
                        hidden: false,
                    })],
                }),
            ],
        };

        let rendered =
            TestRendererRoot::describe_private_to_tree_host_shape_from_snapshot_for_diagnostics(
                &snapshot,
            );
        let children = rendered.as_array().unwrap();
        let component = children[1].as_host_component().unwrap();

        assert_eq!(
            TEST_RENDERER_PRIVATE_TREE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE,
            ["HostRoot", "HostText", "HostComponent", "HostText"]
        );
        assert_eq!(children.len(), 2);
        assert_eq!(children[0].as_text(), Some("first sibling"));
        assert_eq!(component.node_type(), TestRendererPrivateTreeNodeType::Host);
        assert_eq!(component.node_type().as_str(), "host");
        assert_eq!(component.element_type().as_str(), "span");
        assert!(component.props().is_empty());
        assert!(!component.instance_available());
        assert_eq!(component.rendered_child_count(), 1);
        assert_eq!(component.rendered()[0].as_text(), Some("second sibling"));
    }

    #[test]
    fn root_private_to_tree_shape_diagnostics_wrap_composite_above_multi_child_host_output() {
        let snapshot = TestContainerSnapshot {
            children: vec![
                TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "first sibling".to_owned(),
                    hidden: false,
                }),
                TestNodeSnapshot::Element(TestElementSnapshot {
                    element_type: element_type("span"),
                    props: props(),
                    hidden: false,
                    detached: false,
                    children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                        text: "second sibling".to_owned(),
                        hidden: false,
                    })],
                }),
            ],
        };

        let rendered = TestRendererRoot::describe_private_to_tree_composite_above_host_shape_from_snapshot_for_diagnostics(&snapshot);
        let component = rendered.as_function_component().unwrap();
        let rendered_children = component.rendered().as_array().unwrap();
        let host_child = rendered_children[1].as_host_component().unwrap();

        assert_eq!(
            TEST_RENDERER_PRIVATE_TREE_COMPOSITE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE,
            [
                "HostRoot",
                "FunctionComponent",
                "HostText",
                "HostComponent",
                "HostText"
            ]
        );
        assert_eq!(
            component.node_type(),
            TestRendererPrivateTreeNodeType::Component
        );
        assert_eq!(component.node_type().as_str(), "component");
        assert_eq!(
            component.component_type(),
            TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
        );
        assert_eq!(component.props(), &TestProps::new());
        assert!(!component.instance_available());
        assert!(component.wraps_committed_host_output());
        assert_eq!(rendered_children.len(), 2);
        assert_eq!(rendered_children[0].as_text(), Some("first sibling"));
        assert_eq!(host_child.element_type().as_str(), "span");
        assert_eq!(host_child.rendered()[0].as_text(), Some("second sibling"));
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
        let function_component = report.function_component();
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
        assert_eq!(
            report.accepted_composite_fiber_shape(),
            &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE
        );
        assert_eq!(report.root_child_count(), 1);
        assert_eq!(host_root.fiber_tag(), "HostRoot");
        assert!(host_root.delegates_to_child());
        assert_eq!(host_root.child_fiber_tag(), "HostComponent");
        assert!(!host_root.public_tree_object_available());
        assert_eq!(function_component.fiber_tag(), "FunctionComponent");
        assert_eq!(
            function_component.node_type(),
            TestRendererPrivateTreeNodeType::Component
        );
        assert_eq!(function_component.node_type().as_str(), "component");
        assert_eq!(
            function_component.component_type(),
            TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
        );
        assert_eq!(function_component.props(), &TestProps::new());
        assert!(!function_component.instance_available());
        assert_eq!(
            function_component.rendered_child_fiber_tag(),
            "HostComponent"
        );
        assert_eq!(
            function_component.rendered_child_node_type(),
            TestRendererPrivateTreeNodeType::Host
        );
        assert_eq!(function_component.rendered_child_count(), 1);
        assert!(function_component.wraps_committed_host_output());
        assert!(!function_component.public_tree_object_available());
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
        assert_eq!(
            report.accepted_composite_fiber_shape(),
            &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE
        );
        assert_eq!(report.function_component().fiber_tag(), "FunctionComponent");
        assert_eq!(
            report.function_component().node_type(),
            TestRendererPrivateTreeNodeType::Component
        );
        assert_eq!(
            report.function_component().component_type(),
            TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
        );
        assert_eq!(
            report.function_component().rendered_child_fiber_tag(),
            "HostComponent"
        );
        assert!(report.function_component().wraps_committed_host_output());
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
    fn root_private_tree_metadata_canary_describes_function_component_above_host_output() {
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
        let function_component = report.function_component();

        assert_eq!(
            report.accepted_fiber_shape(),
            &TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE
        );
        assert_eq!(
            report.accepted_composite_fiber_shape(),
            &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE
        );
        assert_eq!(function_component.fiber_tag(), "FunctionComponent");
        assert_eq!(
            function_component.node_type(),
            TestRendererPrivateTreeNodeType::Component
        );
        assert_eq!(
            function_component.component_type(),
            TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE
        );
        assert_eq!(function_component.props(), &TestProps::new());
        assert!(!function_component.instance_available());
        assert_eq!(
            function_component.rendered_child_fiber_tag(),
            report.host_component().fiber_tag()
        );
        assert_eq!(
            function_component.rendered_child_node_type(),
            report.host_component().node_type()
        );
        assert_eq!(function_component.rendered_child_count(), 1);
        assert!(function_component.wraps_committed_host_output());
        assert!(!function_component.public_tree_object_available());
        assert_eq!(report.host_component().rendered_text(), "hello");
        assert!(!report.public_tree_object_available());
        assert!(report.public_blockers().tree_method_blocked());
    }

    #[test]
    fn root_private_tree_committed_fiber_inspection_records_minimal_shape_privately() {
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
            .describe_private_tree_committed_fiber_inspection_for_canary(output.commit())
            .unwrap();

        assert_eq!(
            report.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TREE_COMMITTED_FIBER_INSPECTION_DIAGNOSTIC_NAME
        );
        assert_eq!(
            report.source_tree_diagnostic_name(),
            TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
        );
        assert_eq!(report.shape_name(), "HostRoot->HostComponent->HostText");
        assert_eq!(
            report.fiber_shape(),
            &["HostRoot", "HostComponent", "HostText"]
        );
        assert_eq!(report.root_child_fiber_tags(), &["HostComponent"]);
        assert_eq!(report.host_child_fiber_tags(), &["HostComponent"]);
        assert_eq!(report.root_child_count(), 1);
        assert_eq!(report.host_child_count(), 1);
        assert_eq!(report.host_component_count(), 1);
        assert_eq!(report.host_text_count(), 1);
        assert!(report.function_component_fiber_tag().is_none());
        assert!(!report.function_component_present());
        assert!(!report.wraps_committed_host_output());
        assert_eq!(
            report.accepted_minimal_fiber_shape(),
            &TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE
        );
        assert_eq!(
            report.accepted_composite_fiber_shape(),
            &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE
        );
        assert_eq!(
            report.accepted_multi_child_fiber_shape(),
            &TEST_RENDERER_PRIVATE_TREE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE
        );
        assert_eq!(
            report.accepted_composite_multi_child_fiber_shape(),
            &TEST_RENDERER_PRIVATE_TREE_COMPOSITE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE
        );
        assert!(report.public_blockers().all_blocked());
        assert!(!report.public_tree_object_available());
        assert!(!report.compatibility_claimed());
    }

    #[test]
    fn root_private_test_instance_find_all_query_diagnostics_describe_type_props_and_predicate_metadata()
     {
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

        let diagnostics = root
            .describe_private_test_instance_find_all_query_for_canary(&output)
            .unwrap();
        let type_predicate = diagnostics.type_predicate();
        let props_predicate = diagnostics.props_predicate();
        let predicate_like = diagnostics.predicate_like();

        assert_eq!(
            diagnostics.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_ALL_DIAGNOSTIC_NAME
        );
        assert_eq!(
            diagnostics.source_tree_diagnostic_name(),
            TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
        );
        assert_eq!(
            diagnostics.host_output_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert!(diagnostics.host_output_snapshot_current());
        assert_eq!(
            diagnostics.traversal_source(),
            "ReactTestRenderer.js findAll(root, predicate, options)"
        );
        assert_eq!(diagnostics.traversal_order(), "self-then-descendants");
        assert!(diagnostics.default_deep());
        assert_eq!(diagnostics.candidate_fiber_tags(), &["HostComponent"]);
        assert_eq!(diagnostics.skipped_fiber_tags(), &["HostText"]);
        assert_eq!(diagnostics.candidate_count(), 1);
        assert_eq!(diagnostics.skipped_text_child_count(), 1);

        assert_eq!(
            type_predicate.predicate_kind(),
            TestRendererPrivateTestInstanceFindAllPredicateKind::Type
        );
        assert_eq!(type_predicate.predicate_kind().as_str(), "type");
        assert_eq!(
            type_predicate.source(),
            "ReactTestRenderer.js ReactTestInstance.findAllByType"
        );
        assert_eq!(
            type_predicate.predicate_source(),
            "node => node.type === type"
        );
        assert_eq!(type_predicate.expected_type().unwrap().as_str(), "span");
        assert!(type_predicate.expected_props().is_none());
        assert_eq!(type_predicate.evaluated_fiber_tags(), &["HostComponent"]);
        assert_eq!(type_predicate.matched_fiber_tags(), &["HostComponent"]);
        assert!(type_predicate.rejected_fiber_tags().is_empty());
        assert_eq!(type_predicate.evaluated_candidate_count(), 1);
        assert_eq!(type_predicate.matched_candidate_count(), 1);
        assert_eq!(type_predicate.rejected_candidate_count(), 0);
        assert_eq!(type_predicate.skipped_text_child_count(), 1);
        assert!(!type_predicate.predicate_execution());
        assert!(!type_predicate.public_query_method_available());

        assert_eq!(
            props_predicate.predicate_kind(),
            TestRendererPrivateTestInstanceFindAllPredicateKind::Props
        );
        assert_eq!(props_predicate.predicate_kind().as_str(), "props");
        assert_eq!(
            props_predicate.source(),
            "ReactTestRenderer.js ReactTestInstance.findAllByProps"
        );
        assert_eq!(
            props_predicate.predicate_source(),
            "node => node.props && propsMatch(node.props, props)"
        );
        assert!(props_predicate.expected_type().is_none());
        assert_eq!(props_predicate.expected_props().unwrap(), &TestProps::new());
        assert_eq!(props_predicate.evaluated_fiber_tags(), &["HostComponent"]);
        assert_eq!(props_predicate.matched_fiber_tags(), &["HostComponent"]);
        assert!(props_predicate.rejected_fiber_tags().is_empty());
        assert_eq!(props_predicate.skipped_text_child_count(), 1);
        assert!(!props_predicate.predicate_execution());
        assert!(!props_predicate.public_query_method_available());

        assert_eq!(
            predicate_like.predicate_kind(),
            TestRendererPrivateTestInstanceFindAllPredicateKind::PredicateLike
        );
        assert_eq!(predicate_like.predicate_kind().as_str(), "predicate-like");
        assert_eq!(
            predicate_like.source(),
            "ReactTestRenderer.js ReactTestInstance.findAll"
        );
        assert_eq!(
            predicate_like.predicate_source(),
            "metadata-only predicate matching accepted type and props diagnostics"
        );
        assert_eq!(predicate_like.expected_type().unwrap().as_str(), "span");
        assert_eq!(predicate_like.expected_props().unwrap(), &TestProps::new());
        assert_eq!(predicate_like.evaluated_fiber_tags(), &["HostComponent"]);
        assert_eq!(predicate_like.matched_fiber_tags(), &["HostComponent"]);
        assert!(predicate_like.rejected_fiber_tags().is_empty());
        assert_eq!(predicate_like.skipped_text_child_count(), 1);
        assert!(!predicate_like.predicate_execution());
        assert!(!predicate_like.public_query_method_available());

        assert!(diagnostics.public_blockers().all_blocked());
        assert!(diagnostics.public_blockers().instance_wrapper_blocked());
        assert!(!diagnostics.public_test_instance_object_available());
        assert!(!diagnostics.public_query_methods_available());
        assert!(!diagnostics.compatibility_claimed());
    }

    #[test]
    fn root_private_test_instance_find_all_query_diagnostics_follow_update_host_output() {
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

        let diagnostics = root
            .describe_private_test_instance_find_all_query_after_update_for_canary(&updated)
            .unwrap();

        assert_eq!(
            diagnostics.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert!(diagnostics.host_output_snapshot_current());
        assert_eq!(diagnostics.candidate_fiber_tags(), &["HostComponent"]);
        assert_eq!(diagnostics.skipped_fiber_tags(), &["HostText"]);
        assert_eq!(
            diagnostics
                .type_predicate()
                .expected_type()
                .unwrap()
                .as_str(),
            "span"
        );
        assert_eq!(
            diagnostics
                .predicate_like()
                .expected_type()
                .unwrap()
                .as_str(),
            "span"
        );
        assert_eq!(
            diagnostics.props_predicate().expected_props().unwrap(),
            &TestProps::new()
        );
        assert_eq!(diagnostics.type_predicate().matched_candidate_count(), 1);
        assert_eq!(diagnostics.props_predicate().matched_candidate_count(), 1);
        assert_eq!(diagnostics.predicate_like().matched_candidate_count(), 1);
        assert!(!diagnostics.public_query_methods_available());
        assert!(!diagnostics.public_test_instance_object_available());
        assert!(!diagnostics.compatibility_claimed());
    }

    #[test]
    fn root_private_test_instance_find_by_query_diagnostics_build_on_find_all_metadata() {
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

        let find_all = root
            .describe_private_test_instance_find_all_query_for_canary(&output)
            .unwrap();
        let diagnostics = root
            .describe_private_test_instance_find_by_query_for_canary(&output)
            .unwrap();
        let find_by_type = diagnostics.find_by_type();
        let find_by_props = diagnostics.find_by_props();

        assert_eq!(
            diagnostics.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_BY_DIAGNOSTIC_NAME
        );
        assert_eq!(
            diagnostics.source_find_all_diagnostic_name(),
            find_all.diagnostic_name()
        );
        assert_eq!(
            diagnostics.source_tree_diagnostic_name(),
            TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
        );
        assert_eq!(
            diagnostics.host_output_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert!(diagnostics.host_output_snapshot_current());
        assert_eq!(
            diagnostics.source(),
            "ReactTestRenderer.js ReactTestInstance.findByType/findByProps"
        );
        assert_eq!(
            diagnostics.accepted_find_all_traversal_source(),
            find_all.traversal_source()
        );
        assert!(!diagnostics.effective_deep());
        assert!(diagnostics.expect_one());
        assert_eq!(
            diagnostics.find_all_candidate_fiber_tags(),
            find_all.candidate_fiber_tags()
        );
        assert_eq!(
            diagnostics.find_all_skipped_fiber_tags(),
            find_all.skipped_fiber_tags()
        );

        assert_eq!(
            find_by_type.query_kind(),
            TestRendererPrivateTestInstanceFindByQueryKind::Type
        );
        assert_eq!(find_by_type.query_kind().as_str(), "findByType");
        assert_eq!(find_by_type.query_kind().criteria_kind(), "type");
        assert_eq!(
            find_by_type.public_surface(),
            "ReactTestInstance.findByType"
        );
        assert_eq!(
            find_by_type.source(),
            "ReactTestRenderer.js ReactTestInstance.findByType"
        );
        assert_eq!(
            find_by_type.based_on_find_all_source(),
            find_all.type_predicate().source()
        );
        assert_eq!(
            find_by_type.based_on_predicate_kind(),
            TestRendererPrivateTestInstanceFindAllPredicateKind::Type
        );
        assert_eq!(
            find_by_type.expect_one_message(),
            "with node type: \"span\""
        );
        assert_eq!(find_by_type.expected_type().unwrap().as_str(), "span");
        assert!(find_by_type.expected_props().is_none());
        assert!(!find_by_type.effective_deep());
        assert!(find_by_type.expect_one());
        assert_eq!(find_by_type.result_kind(), "single");
        assert_eq!(find_by_type.expected_canary_match_count(), 1);
        assert_eq!(find_by_type.matched_candidate_count(), 1);
        assert_eq!(find_by_type.candidate_fiber_tags(), &["HostComponent"]);
        assert_eq!(
            find_by_type.traversed_candidate_fiber_tags(),
            find_all.type_predicate().evaluated_fiber_tags()
        );
        assert_eq!(find_by_type.skipped_fiber_tags(), &["HostText"]);
        assert_eq!(
            find_by_type.zero_match_error_prefix(),
            "No instances found "
        );
        assert_eq!(
            find_by_type.duplicate_match_error_prefix(),
            "Expected 1 but found N instances "
        );
        assert!(!find_by_type.predicate_execution());
        assert!(!find_by_type.public_query_method_available());
        assert!(!find_by_type.public_test_instance_object_available());
        assert!(!find_by_type.compatibility_claimed());

        assert_eq!(
            find_by_props.query_kind(),
            TestRendererPrivateTestInstanceFindByQueryKind::Props
        );
        assert_eq!(find_by_props.query_kind().as_str(), "findByProps");
        assert_eq!(find_by_props.query_kind().criteria_kind(), "props");
        assert_eq!(
            find_by_props.public_surface(),
            "ReactTestInstance.findByProps"
        );
        assert_eq!(
            find_by_props.source(),
            "ReactTestRenderer.js ReactTestInstance.findByProps"
        );
        assert_eq!(
            find_by_props.based_on_find_all_source(),
            find_all.props_predicate().source()
        );
        assert_eq!(
            find_by_props.based_on_predicate_kind(),
            TestRendererPrivateTestInstanceFindAllPredicateKind::Props
        );
        assert_eq!(find_by_props.expect_one_message(), "with props: {}");
        assert!(find_by_props.expected_type().is_none());
        assert_eq!(find_by_props.expected_props().unwrap(), &TestProps::new());
        assert!(!find_by_props.effective_deep());
        assert!(find_by_props.expect_one());
        assert_eq!(find_by_props.result_kind(), "single");
        assert_eq!(find_by_props.expected_canary_match_count(), 1);
        assert_eq!(find_by_props.matched_candidate_count(), 1);
        assert_eq!(find_by_props.candidate_fiber_tags(), &["HostComponent"]);
        assert_eq!(
            find_by_props.traversed_candidate_fiber_tags(),
            find_all.props_predicate().evaluated_fiber_tags()
        );
        assert_eq!(find_by_props.skipped_fiber_tags(), &["HostText"]);
        assert_eq!(
            find_by_props.zero_match_error_prefix(),
            "No instances found "
        );
        assert_eq!(
            find_by_props.duplicate_match_error_prefix(),
            "Expected 1 but found N instances "
        );
        assert!(!find_by_props.predicate_execution());
        assert!(!find_by_props.public_query_method_available());
        assert!(!find_by_props.public_test_instance_object_available());
        assert!(!find_by_props.compatibility_claimed());

        assert!(diagnostics.public_blockers().all_blocked());
        assert!(diagnostics.public_blockers().instance_wrapper_blocked());
        assert!(!diagnostics.public_test_instance_object_available());
        assert!(!diagnostics.public_query_methods_available());
        assert!(!diagnostics.compatibility_claimed());
    }

    #[test]
    fn root_private_test_instance_find_by_query_diagnostics_follow_update_host_output() {
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

        let find_all = root
            .describe_private_test_instance_find_all_query_after_update_for_canary(&updated)
            .unwrap();
        let diagnostics = root
            .describe_private_test_instance_find_by_query_after_update_for_canary(&updated)
            .unwrap();

        assert_eq!(
            diagnostics.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert!(diagnostics.host_output_snapshot_current());
        assert_eq!(
            diagnostics.source_find_all_diagnostic_name(),
            find_all.diagnostic_name()
        );
        assert_eq!(
            diagnostics.find_all_candidate_fiber_tags(),
            find_all.candidate_fiber_tags()
        );
        assert_eq!(
            diagnostics.find_all_skipped_fiber_tags(),
            find_all.skipped_fiber_tags()
        );
        assert_eq!(
            diagnostics.find_by_type().expected_type().unwrap().as_str(),
            "span"
        );
        assert_eq!(
            diagnostics.find_by_props().expected_props().unwrap(),
            &TestProps::new()
        );
        assert_eq!(diagnostics.find_by_type().matched_candidate_count(), 1);
        assert_eq!(diagnostics.find_by_props().matched_candidate_count(), 1);
        assert!(!diagnostics.public_query_methods_available());
        assert!(!diagnostics.public_test_instance_object_available());
        assert!(!diagnostics.compatibility_claimed());
    }

    #[test]
    fn root_private_test_instance_query_bridge_preflight_ties_find_all_and_find_by_records() {
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

        let find_all = root
            .describe_private_test_instance_find_all_query_for_canary(&output)
            .unwrap();
        let find_by = root
            .describe_private_test_instance_find_by_query_for_canary(&output)
            .unwrap();
        let preflight = root
            .describe_private_test_instance_query_bridge_preflight_for_canary(&output)
            .unwrap();

        assert_eq!(
            preflight.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TEST_INSTANCE_QUERY_BRIDGE_PREFLIGHT_DIAGNOSTIC_NAME
        );
        assert_eq!(
            preflight.source_find_all_diagnostic_name(),
            find_all.diagnostic_name()
        );
        assert_eq!(
            preflight.source_find_by_diagnostic_name(),
            find_by.diagnostic_name()
        );
        assert_eq!(
            preflight.bridge_status(),
            "private-test-instance-query-bridge-preflight-ready-public-test-instance-blocked"
        );
        assert_eq!(
            preflight.bridge_source(),
            "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.testInstanceQuery"
        );
        assert_eq!(
            preflight.wrapper_record_symbol(),
            "fast.react_test_renderer.private_test_instance_wrapper_record"
        );
        assert_eq!(
            preflight.host_output_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert!(preflight.host_output_snapshot_current());
        assert_eq!(
            preflight.accepted_find_all_traversal_source(),
            find_all.traversal_source()
        );
        assert_eq!(preflight.accepted_find_by_source(), find_by.source());
        assert_eq!(
            preflight.find_all_candidate_fiber_tags(),
            find_all.candidate_fiber_tags()
        );
        assert_eq!(
            preflight.find_all_skipped_fiber_tags(),
            find_all.skipped_fiber_tags()
        );
        assert_eq!(preflight.find_by_queries(), &["findByType", "findByProps"]);
        assert!(preflight.consumes_accepted_find_all_diagnostics());
        assert!(preflight.consumes_accepted_find_by_diagnostics());
        assert!(preflight.record_only_diagnostic_consumption());
        assert!(!preflight.native_bridge_available());
        assert!(!preflight.native_execution());
        assert!(!preflight.rust_execution_from_js());
        assert!(preflight.public_blockers().all_blocked());
        assert!(!preflight.public_root_available());
        assert!(!preflight.public_test_instance_object_available());
        assert!(!preflight.public_query_methods_available());
        assert!(!preflight.compatibility_claimed());
    }

    #[test]
    fn root_private_test_instance_query_bridge_preflight_follows_update_records() {
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

        let find_all = root
            .describe_private_test_instance_find_all_query_after_update_for_canary(&updated)
            .unwrap();
        let find_by = root
            .describe_private_test_instance_find_by_query_after_update_for_canary(&updated)
            .unwrap();
        let preflight = root
            .describe_private_test_instance_query_bridge_preflight_after_update_for_canary(&updated)
            .unwrap();

        assert_eq!(
            preflight.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert!(preflight.host_output_snapshot_current());
        assert_eq!(
            preflight.source_find_all_diagnostic_name(),
            find_all.diagnostic_name()
        );
        assert_eq!(
            preflight.source_find_by_diagnostic_name(),
            find_by.diagnostic_name()
        );
        assert_eq!(
            preflight.find_all_candidate_fiber_tags(),
            find_all.candidate_fiber_tags()
        );
        assert_eq!(
            preflight.find_all_skipped_fiber_tags(),
            find_all.skipped_fiber_tags()
        );
        assert_eq!(preflight.find_by_queries(), &["findByType", "findByProps"]);
        assert!(preflight.record_only_diagnostic_consumption());
        assert!(!preflight.rust_execution_from_js());
        assert!(!preflight.public_root_available());
        assert!(!preflight.public_query_methods_available());
        assert!(!preflight.compatibility_claimed());
    }

    #[test]
    fn root_private_test_instance_native_query_execution_consumes_create_and_update_records() {
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
        let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            output.render().resulting_element(),
            "span",
        );
        let preflight = root
            .describe_private_root_create_preflight_from_render_for_canary(
                input,
                TestRendererRootCreatePreflightCanaryApiIdentity::current(),
                Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
                output.render(),
            )
            .unwrap();
        let admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
            Some(preflight),
            Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
        )
        .unwrap();
        let create_handoff = root
            .describe_private_create_native_bridge_host_output_handoff_for_canary(
                &admission, &output,
            )
            .unwrap();

        let create_evidence = root
            .describe_private_test_instance_query_after_create_native_execution_for_canary(
                &output,
                create_handoff,
            )
            .unwrap();

        assert_eq!(
            create_evidence.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_DIAGNOSTIC_NAME
        );
        assert_eq!(
            create_evidence.status(),
            TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_STATUS
        );
        assert_eq!(create_evidence.root(), root.root_id());
        assert_eq!(create_evidence.operation(), "create");
        assert_eq!(
            create_evidence.source_execution_record_id(),
            TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID
        );
        assert_eq!(
            create_evidence.source_execution_status(),
            TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS
        );
        assert_eq!(
            create_evidence.source_query_diagnostic_name(),
            TEST_RENDERER_PRIVATE_TEST_INSTANCE_QUERY_BRIDGE_PREFLIGHT_DIAGNOSTIC_NAME
        );
        assert_eq!(
            create_evidence.host_output_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert_eq!(
            create_evidence.query_surface(),
            "ReactTestInstance.findByType"
        );
        assert_eq!(
            create_evidence.query_kind(),
            TestRendererPrivateTestInstanceFindByQueryKind::Type
        );
        assert_eq!(create_evidence.expected_type().as_str(), "span");
        assert_eq!(create_evidence.result_fiber_tag(), "HostComponent");
        assert_eq!(create_evidence.result_kind(), "single");
        assert_eq!(create_evidence.matched_candidate_count(), 1);
        assert_eq!(create_evidence.query_path_candidate_count(), 1);
        assert_eq!(create_evidence.skipped_text_child_count(), 1);
        assert!(create_evidence.host_output_snapshot_current());
        assert!(create_evidence.consumes_accepted_native_create_execution_record());
        assert!(!create_evidence.consumes_accepted_native_update_execution_record());
        assert!(create_evidence.consumes_private_test_instance_query_diagnostics());
        assert!(create_evidence.consumes_query_bridge_preflight());
        assert!(create_evidence.consumes_accepted_find_all_diagnostics());
        assert!(create_evidence.consumes_accepted_find_by_diagnostics());
        assert!(create_evidence.minimal_host_component_query_path());
        assert!(!create_evidence.public_root_available());
        assert!(!create_evidence.public_query_methods_available());
        assert!(!create_evidence.public_test_instance_object_available());
        assert!(!create_evidence.native_bridge_available());
        assert!(!create_evidence.native_execution_available());
        assert!(!create_evidence.compatibility_claimed());

        let (_route, updated, update_admission) = root
            .render_and_admit_private_update_native_bridge_handoff_for_canary(
                "span",
                TestProps::new(),
                "goodbye",
            )
            .unwrap();
        let update_evidence = root
            .describe_private_test_instance_query_after_update_native_execution_for_canary(
                &updated,
                update_admission,
            )
            .unwrap();

        assert_eq!(update_evidence.operation(), "update");
        assert_eq!(
            update_evidence.source_execution_record_id(),
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        );
        assert_eq!(
            update_evidence.source_execution_status(),
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
        );
        assert_eq!(
            update_evidence.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(update_evidence.expected_type().as_str(), "span");
        assert!(!update_evidence.consumes_accepted_native_create_execution_record());
        assert!(update_evidence.consumes_accepted_native_update_execution_record());
        assert!(update_evidence.consumes_private_test_instance_query_diagnostics());
        assert!(update_evidence.minimal_host_component_query_path());
        assert!(!update_evidence.public_root_available());
        assert!(!update_evidence.public_query_methods_available());
        assert!(!update_evidence.public_test_instance_object_available());
        assert!(!update_evidence.native_execution_available());
        assert!(!update_evidence.compatibility_claimed());
    }

    #[test]
    fn root_private_test_instance_class_query_execution_consumes_update_record_and_updated_child() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let (_route, updated, update_admission) = root
            .render_and_admit_private_update_native_bridge_handoff_for_canary(
                "span",
                TestProps::new(),
                "goodbye",
            )
            .unwrap();

        let evidence = root
            .describe_private_test_instance_class_root_query_after_update_native_execution_for_canary(
                &updated,
                update_admission,
            )
            .unwrap();

        assert_eq!(
            evidence.diagnostic_name(),
            TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_DIAGNOSTIC_NAME
        );
        assert_eq!(
            evidence.status(),
            TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_STATUS
        );
        assert_eq!(evidence.root(), root.root_id());
        assert_eq!(evidence.operation(), "update");
        assert_eq!(
            evidence.public_surface(),
            "create().update -> create().root/ReactTestInstance.findByType"
        );
        assert_eq!(
            evidence.source_execution_record_id(),
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        );
        assert_eq!(
            evidence.source_execution_status(),
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
        );
        assert_eq!(
            evidence.source_query_diagnostic_name(),
            TEST_RENDERER_PRIVATE_TEST_INSTANCE_QUERY_BRIDGE_PREFLIGHT_DIAGNOSTIC_NAME
        );
        assert_eq!(
            evidence.source_get_instance_diagnostic_name(),
            TEST_RENDERER_PRIVATE_GET_INSTANCE_DIAGNOSTIC_NAME
        );
        assert_eq!(
            evidence.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert!(evidence.host_output_snapshot_current());
        assert_eq!(
            evidence.accepted_class_fiber_shape(),
            &TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE
        );
        assert_eq!(evidence.root_query_surface(), "create().root");
        assert_eq!(evidence.root_result_fiber_tag(), "ClassComponent");
        assert_eq!(
            evidence.root_component_type(),
            TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE
        );
        assert_eq!(
            evidence.root_props(),
            &TestProps::new().with_attribute("label", "class-root")
        );
        assert_eq!(evidence.root_child_count(), 1);
        assert_eq!(
            evidence.child_query_surface(),
            "ReactTestInstance.findByType"
        );
        assert_eq!(
            evidence.child_query_kind(),
            TestRendererPrivateTestInstanceFindByQueryKind::Type
        );
        assert_eq!(evidence.child_fiber_tag(), "HostComponent");
        assert_eq!(evidence.child_element_type().as_str(), "span");
        assert_eq!(evidence.child_props(), &TestProps::new());
        assert_eq!(evidence.previous_child_text(), "hello");
        assert_eq!(evidence.current_child_text(), "goodbye");
        assert!(evidence.host_child_updated());
        assert_eq!(
            evidence.class_root_query_path(),
            &["ClassComponent", "HostComponent"]
        );
        assert_eq!(
            evidence.updated_host_child_query_path(),
            &["ClassComponent", "HostComponent", "HostText"]
        );
        assert!(evidence.consumes_accepted_native_update_execution_record());
        assert!(evidence.consumes_private_test_instance_query_diagnostics());
        assert!(evidence.consumes_query_bridge_preflight());
        assert!(evidence.consumes_private_get_instance_class_root_diagnostics());
        assert!(!evidence.public_root_available());
        assert!(!evidence.public_query_methods_available());
        assert!(!evidence.public_test_instance_object_available());
        assert!(!evidence.public_get_instance_available());
        assert!(!evidence.native_bridge_available());
        assert!(!evidence.native_execution_available());
        assert!(!evidence.compatibility_claimed());
    }

    #[test]
    fn root_private_test_instance_class_query_execution_rejects_stale_updated_child() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let (_route, updated, _update_admission) = root
            .render_and_admit_private_update_native_bridge_handoff_for_canary(
                "span",
                TestProps::new(),
                "goodbye",
            )
            .unwrap();
        let preflight = root
            .describe_private_test_instance_query_bridge_preflight_after_update_for_canary(&updated)
            .unwrap();
        let find_by = root
            .describe_private_test_instance_find_by_query_after_update_for_canary(&updated)
            .unwrap();
        let mut class_root = root
            .describe_private_get_instance_class_root_after_update_for_canary(&updated)
            .unwrap();
        class_root.rendered_host_component.rendered_text = "hello".to_owned();
        class_root.rendered_host_text.text = "hello".to_owned();

        let error = root
            .private_test_instance_class_root_query_execution_evidence_from_reports(
                TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
                TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS,
                "hello".to_owned(),
                &preflight,
                &find_by,
                &class_root,
            )
            .unwrap_err();
        let TestRendererRootError::PrivateTestInstanceNativeQueryExecution(error) = error else {
            panic!("expected private TestInstance class query execution rejection");
        };

        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation: "update",
                reason: "class-root-updated-host-child-query-path-missing",
            }
        ));
    }

    #[test]
    fn root_private_test_instance_native_query_execution_rejects_public_testinstance_claim() {
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
        let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
            output.render().resulting_element(),
            "span",
        );
        let preflight = root
            .describe_private_root_create_preflight_from_render_for_canary(
                input,
                TestRendererRootCreatePreflightCanaryApiIdentity::current(),
                Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
                output.render(),
            )
            .unwrap();
        let admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
            Some(preflight),
            Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
        )
        .unwrap();
        let mut create_handoff = root
            .describe_private_create_native_bridge_host_output_handoff_for_canary(
                &admission, &output,
            )
            .unwrap();
        create_handoff.public_test_instance_available = true;

        let error = root
            .describe_private_test_instance_query_after_create_native_execution_for_canary(
                &output,
                create_handoff,
            )
            .unwrap_err();
        let TestRendererRootError::PrivateTestInstanceNativeQueryExecution(error) = error else {
            panic!("expected private TestInstance native query execution rejection");
        };

        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation: "create",
                reason: "public-or-native-compatibility-claim",
            }
        ));
    }

    #[test]
    fn root_private_get_instance_class_root_canary_describes_class_instance_shape() {
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
            .describe_private_get_instance_class_root_for_canary(&output)
            .unwrap();
        let host_root = report.host_root_fail_closed();
        let function_root = report.function_root_fail_closed();
        let class_component = report.class_component();
        let instance = class_component.instance();

        assert_eq!(
            report.diagnostic_name(),
            TEST_RENDERER_PRIVATE_GET_INSTANCE_DIAGNOSTIC_NAME
        );
        assert_eq!(
            report.source_tree_diagnostic_name(),
            TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME
        );
        assert_eq!(
            report.host_output_update_kind(),
            TestRendererRootUpdateKind::Create
        );
        assert!(report.host_output_snapshot_current());
        assert_eq!(
            report.gate().status(),
            TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
        );
        assert_eq!(
            report.accepted_class_fiber_shape(),
            &TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE
        );
        assert_eq!(
            host_root.root_fiber_shape(),
            &TEST_RENDERER_PRIVATE_GET_INSTANCE_HOST_ROOT_FIBER_SHAPE
        );
        assert_eq!(host_root.root_child_fiber_tag(), "HostComponent");
        assert_eq!(
            host_root.react_public_result(),
            "null-with-default-createNodeMock"
        );
        assert!(host_root.public_behavior_fail_closed());
        assert!(!host_root.public_get_instance_available());
        assert!(!host_root.private_class_instance_available());
        assert_eq!(
            function_root.root_fiber_shape(),
            &TEST_RENDERER_PRIVATE_GET_INSTANCE_FUNCTION_ROOT_FIBER_SHAPE
        );
        assert_eq!(function_root.root_child_fiber_tag(), "FunctionComponent");
        assert_eq!(function_root.react_public_result(), "null");
        assert!(function_root.public_behavior_fail_closed());
        assert!(!function_root.public_get_instance_available());
        assert!(!function_root.private_class_instance_available());
        assert_eq!(class_component.fiber_tag(), "ClassComponent");
        assert_eq!(
            class_component.component_type(),
            TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE
        );
        assert_eq!(
            class_component.props(),
            &TestProps::new().with_attribute("label", "class-root")
        );
        assert!(class_component.state_node_available());
        assert_eq!(class_component.rendered_child_fiber_tag(), "HostComponent");
        assert_eq!(class_component.rendered_child_count(), 1);
        assert!(!class_component.public_get_instance_available());
        assert_eq!(
            instance.constructor_name(),
            TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_CONSTRUCTOR_NAME
        );
        assert_eq!(
            instance.props(),
            &TestProps::new().with_attribute("label", "class-root")
        );
        assert_eq!(
            instance.state_marker(),
            TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_STATE_MARKER
        );
        assert!(instance.private_instance_available());
        assert!(!instance.public_get_instance_available());
        assert_eq!(instance.react_public_result(), "class-instance");
        assert_eq!(
            report.rendered_host_component().element_type().as_str(),
            "span"
        );
        assert_eq!(report.rendered_host_component().rendered_text(), "hello");
        assert_eq!(report.rendered_host_text().text(), "hello");
        assert!(report.public_blockers().all_blocked());
        assert!(!report.public_get_instance_available());
        assert!(!report.native_bridge_available());
        assert!(!report.compatibility_claimed());
    }

    #[test]
    fn root_private_get_instance_class_root_canary_updates_rendered_host_child_only() {
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
            .describe_private_get_instance_class_root_after_update_for_canary(&updated)
            .unwrap();

        assert_eq!(
            report.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(
            report.accepted_class_fiber_shape(),
            &TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE
        );
        assert_eq!(
            report.class_component().component_type(),
            TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE
        );
        assert_eq!(
            report.class_component().instance().constructor_name(),
            TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_CONSTRUCTOR_NAME
        );
        assert_eq!(report.rendered_host_component().rendered_text(), "goodbye");
        assert_eq!(report.rendered_host_text().text(), "goodbye");
        assert!(
            !report
                .host_root_fail_closed()
                .public_get_instance_available()
        );
        assert!(
            report
                .function_root_fail_closed()
                .public_behavior_fail_closed()
        );
        assert!(!report.public_get_instance_available());
        assert!(!report.compatibility_claimed());
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
        let text_mutation = diagnostics.mutation_records()[0];
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
        let mutation = diagnostics.mutation_records()[1];
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
        assert_eq!(
            commit.test_only_host_component_update_apply_count_for_canary(),
            1
        );
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
    fn root_private_update_route_consumes_root_work_loop_update_queue_and_text_update_metadata() {
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
        let scheduled = root.last_scheduled_update().unwrap().clone();
        let updated = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();

        let diagnostics = root
            .describe_private_update_route_via_root_work_loop_for_canary(&updated)
            .unwrap();
        let queue = diagnostics.update_queue();
        let work_loop = diagnostics.root_work_loop();
        let host_text = diagnostics.host_text_update();
        let admission = diagnostics.admission();

        assert_eq!(
            diagnostics.diagnostic_name(),
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME
        );
        assert_eq!(
            diagnostics.status(),
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS
        );
        assert_eq!(diagnostics.root(), root.root_id());
        assert_eq!(
            diagnostics.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert!(diagnostics.consumes_accepted_host_root_update_queue_metadata());
        assert!(diagnostics.consumes_accepted_root_work_loop_metadata());
        assert!(diagnostics.consumes_manual_host_output_canary());
        assert!(!diagnostics.public_root_update_available());
        assert!(!diagnostics.public_serialization_available());
        assert!(!diagnostics.native_execution_available());
        assert!(!diagnostics.compatibility_claimed());

        assert_eq!(
            admission.record_id(),
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
        );
        assert_eq!(
            admission.status(),
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
        );
        assert_eq!(admission.public_surface(), "create().update");
        assert_eq!(admission.root(), root.root_id());
        assert_eq!(admission.request_api(), "TestRendererRoot::update");
        assert_eq!(
            admission.source_diagnostic_name(),
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME
        );
        assert_eq!(
            admission.source_diagnostic_status(),
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS
        );
        assert_eq!(admission.lifecycle(), TestRendererRootLifecycle::Active);
        assert_eq!(
            admission.scheduled_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(
            admission.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert!(admission.consumes_accepted_host_root_update_queue_metadata());
        assert!(admission.consumes_accepted_root_work_loop_metadata());
        assert!(admission.consumes_accepted_host_output_metadata());
        assert!(admission.rejects_stale_root_lifecycle());
        assert!(admission.rejects_stale_host_output());
        assert!(admission.rejects_missing_update_queue_evidence());
        assert!(!admission.public_root_update_available());
        assert!(!admission.public_serialization_available());
        assert!(!admission.native_execution_available());
        assert!(!admission.compatibility_claimed());

        assert_eq!(queue.root(), root.root_id());
        assert_eq!(
            queue.scheduled_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(queue.scheduled_element(), root_element(2));
        assert_eq!(
            queue.update_raw(),
            scheduled.container_update().update().raw()
        );
        assert_eq!(
            queue.queue_raw(),
            scheduled.container_update().queue().raw()
        );
        assert_eq!(
            queue.schedule_fiber().slot(),
            updated.render().current().slot().get()
        );
        assert_eq!(
            queue.lane_bits(),
            scheduled.container_update().lane().bits()
        );
        assert_eq!(queue.pending_lanes_before_enqueue_bits(), 0);
        assert_eq!(
            queue.pending_lanes_after_enqueue_bits(),
            updated.render().render_lanes().bits()
        );
        assert_eq!(
            queue.selected_next_lanes_bits(),
            updated.render().render_lanes().bits()
        );
        assert_eq!(
            queue.render_lanes_bits(),
            updated.render().render_lanes().bits()
        );
        assert!(queue.queue_matches_render_current_queue());
        assert!(queue.selected_lanes_match_render_lanes());
        assert!(queue.pending_lanes_after_enqueue_match_render_lanes());
        assert_eq!(
            queue.root_schedule_inserted(),
            scheduled.root_schedule().inserted()
        );
        assert_eq!(
            queue.root_schedule_microtask_requested(),
            scheduled.root_schedule().microtask().is_some()
        );
        assert_eq!(
            queue.root_schedule_might_have_pending_sync_work(),
            scheduled.root_schedule().might_have_pending_sync_work()
        );

        assert_eq!(work_loop.root(), root.root_id());
        assert_eq!(
            work_loop.render_current().slot(),
            updated.render().current().slot().get()
        );
        assert_eq!(
            work_loop.render_finished_work().slot(),
            updated.render().finished_work().slot().get()
        );
        assert_eq!(
            work_loop.commit_current().slot(),
            updated.commit().current().slot().get()
        );
        assert_eq!(
            work_loop.current_update_queue_raw(),
            updated.render().current_update_queue().raw()
        );
        assert_eq!(
            work_loop.work_in_progress_update_queue_raw(),
            updated.render().work_in_progress_update_queue().raw()
        );
        assert_eq!(
            work_loop.committed_current_update_queue_raw(),
            updated.render().work_in_progress_update_queue().raw()
        );
        assert_eq!(work_loop.applied_update_count(), 1);
        assert_eq!(work_loop.skipped_update_count(), 0);
        assert!(work_loop.remaining_lanes_empty());
        assert_eq!(
            work_loop.commit_finished_lanes_bits(),
            updated.render().render_lanes().bits()
        );
        assert!(work_loop.commit_remaining_lanes_empty());
        assert!(work_loop.commit_pending_lanes_empty());
        assert!(work_loop.commit_current_matches_render_finished_work());
        assert!(work_loop.commit_previous_current_matches_render_current());
        assert!(work_loop.commit_lanes_match_render_lanes());
        assert!(work_loop.committed_current_queue_matches_work_in_progress());
        assert!(work_loop.root_current_matches_commit_current());

        assert_eq!(
            host_text.previous_text_fiber().slot(),
            updated.updated_fibers().previous().text().slot().get()
        );
        assert_eq!(
            host_text.updated_text_fiber().slot(),
            updated.updated_fibers().current().text().slot().get()
        );
        assert_eq!(host_text.text_state_node_raw(), 1);
        assert!(host_text.text_update_apply_recorded());
        assert_eq!(host_text.host_text_update_apply_count(), 1);
        assert_eq!(host_text.host_component_update_apply_count(), 1);
    }

    #[test]
    fn root_private_update_route_admission_record_consumes_update_work_loop_diagnostics() {
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

        let admission = root
            .describe_private_update_route_admission_for_canary(&updated)
            .unwrap();

        assert_eq!(
            admission.record_id(),
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
        );
        assert_eq!(
            admission.status(),
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS
        );
        assert_eq!(admission.request_api(), "TestRendererRoot::update");
        assert!(admission.consumes_accepted_host_root_update_queue_metadata());
        assert!(admission.consumes_accepted_root_work_loop_metadata());
        assert!(admission.consumes_accepted_host_output_metadata());
        assert!(!admission.public_root_update_available());
        assert!(!admission.public_serialization_available());
        assert!(!admission.native_execution_available());
        assert!(!admission.compatibility_claimed());
    }

    #[test]
    fn root_private_update_route_rejects_stale_root_update_output() {
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
        let stale = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();
        root.update_host_component_with_text_for_canary("span", "later")
            .unwrap();
        root.render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();

        let error = root
            .describe_private_update_route_via_root_work_loop_for_canary(&stale)
            .unwrap_err();

        let TestRendererRootError::SerializationGate(error) = error else {
            panic!("expected stale commit rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererSerializationGateError::CommitIsNotCurrent { root: error_root, .. }
                if *error_root == root.root_id()
        ));
    }

    #[test]
    fn root_private_update_route_rejects_missing_update_queue_evidence() {
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
        root.scheduled_updates.clear();

        let error = root
            .describe_private_update_route_via_root_work_loop_for_canary(&updated)
            .unwrap_err();

        let TestRendererRootError::PrivateUpdateRoute(error) = error else {
            panic!("expected private update route rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateUpdateRouteError::MissingScheduledUpdate
        ));
    }

    #[test]
    fn root_private_update_route_rejects_unmounted_root() {
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
        root.unmount().unwrap();

        let error = root
            .describe_private_update_route_via_root_work_loop_for_canary(&updated)
            .unwrap_err();

        let TestRendererRootError::PrivateUpdateRoute(error) = error else {
            panic!("expected private update route rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateUpdateRouteError::RootNotActive {
                lifecycle: TestRendererRootLifecycle::UnmountScheduled
            }
        ));
    }

    #[test]
    fn root_private_update_route_rejects_incompatible_finished_work_record() {
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
        let mut incompatible = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();
        incompatible.render = created.render();

        let error = root
            .describe_private_update_route_via_root_work_loop_for_canary(&incompatible)
            .unwrap_err();

        let TestRendererRootError::PrivateUpdateRoute(error) = error else {
            panic!("expected private update route rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateUpdateRouteError::IncompatibleFinishedWork {
                reason: "commit-current-finished-work-mismatch"
            }
        ));
    }

    #[test]
    fn root_private_update_native_bridge_admission_consumes_actual_update_host_output_handoff() {
        let initial_props = props().with_attribute("data-state", "old");
        let updated_props = props().with_attribute("data-state", "new");
        let mut root = TestRendererRoot::create_host_component_with_props_and_text_for_canary(
            "span",
            initial_props.clone(),
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();

        let (outcome, updated, admission) = root
            .render_and_admit_private_update_native_bridge_handoff_for_canary(
                "span",
                updated_props.clone(),
                "goodbye",
            )
            .unwrap();

        assert!(matches!(
            outcome,
            TestRendererRootUpdateOutcome::Scheduled(_)
        ));
        assert!(updated.updated_fibers().component_props_changed());
        assert!(updated.updated_fibers().text_props_changed());
        let TestNodeSnapshot::Element(previous) = &updated.previous_snapshot().children()[0] else {
            panic!("expected previous host component");
        };
        assert_eq!(previous.props(), &initial_props);
        assert_eq!(child_texts(previous), vec!["hello"]);
        let TestNodeSnapshot::Element(current) = &updated.snapshot().children()[0] else {
            panic!("expected updated host component");
        };
        assert_eq!(current.props(), &updated_props);
        assert_eq!(child_texts(current), vec!["goodbye"]);
        assert_eq!(
            root.diagnostic_container_snapshot().unwrap(),
            *updated.snapshot()
        );

        assert_eq!(
            admission.diagnostic_id(),
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        );
        assert_eq!(
            admission.status(),
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
        );
        assert_eq!(admission.root(), root.root_id());
        assert_eq!(
            admission.route_dependency_id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID
        );
        assert_eq!(
            admission.update_route_admission_id(),
            TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
        );
        assert_eq!(admission.lifecycle(), TestRendererRootLifecycle::Active);
        assert_eq!(
            admission.scheduled_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(
            admission.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert!(admission.update_route_admission_accepted());
        assert!(admission.lifecycle_evidence_accepted());
        assert!(admission.root_work_loop_handoff_accepted());
        assert!(admission.host_output_handoff_accepted());
        assert!(admission.text_update_apply_recorded());
        assert_eq!(admission.host_text_update_apply_count(), 1);
        assert_eq!(admission.host_component_update_apply_count(), 1);
        assert!(admission.rejects_stale_update_handoffs());
        assert!(admission.rejects_unmounted_roots());
        assert!(admission.rejects_missing_host_output_handoff());
        assert!(!admission.public_update_compatibility_claimed());
        assert!(!admission.public_serialization_available());
        assert!(!admission.act_flushing_claimed());
        assert!(!admission.native_bridge_available());
        assert!(!admission.native_execution());
        assert!(admission.rust_execution_from_js());
        assert!(admission.reconciler_execution_from_js());
        assert!(!admission.compatibility_claimed());
    }

    #[test]
    fn root_private_update_native_bridge_admission_consumes_prop_style_text_update_execution() {
        let initial_props = props()
            .with_attribute("data-state", "old")
            .with_style("color", "red");
        let updated_props = props()
            .with_attribute("data-state", "new")
            .with_style("color", "blue");
        let mut root = TestRendererRoot::create_host_component_with_props_and_text_for_canary(
            "span",
            initial_props.clone(),
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();

        let (_outcome, updated, admission) = root
            .render_and_admit_private_update_native_bridge_handoff_for_canary(
                "span",
                updated_props.clone(),
                "goodbye",
            )
            .unwrap();
        let route = root
            .describe_private_update_route_via_root_work_loop_for_canary(&updated)
            .unwrap();
        let host_output = route.host_text_update();

        assert!(updated.updated_fibers().component_props_changed());
        assert!(updated.updated_fibers().text_props_changed());
        let TestNodeSnapshot::Element(previous) = &updated.previous_snapshot().children()[0] else {
            panic!("expected previous host component");
        };
        assert_eq!(previous.props(), &initial_props);
        assert_eq!(
            previous.props().styles().get("color").map(String::as_str),
            Some("red")
        );
        assert_eq!(child_texts(previous), vec!["hello"]);
        let TestNodeSnapshot::Element(current) = &updated.snapshot().children()[0] else {
            panic!("expected updated host component");
        };
        assert_eq!(current.props(), &updated_props);
        assert_eq!(
            current.props().styles().get("color").map(String::as_str),
            Some("blue")
        );
        assert_eq!(child_texts(current), vec!["goodbye"]);

        assert!(host_output.host_component_prop_update_recorded());
        assert!(host_output.host_component_style_update_recorded());
        assert!(host_output.text_update_apply_recorded());
        assert_eq!(host_output.host_component_update_apply_count(), 1);
        assert_eq!(host_output.host_text_update_apply_count(), 1);
        assert!(admission.host_component_prop_update_recorded());
        assert!(admission.host_component_style_update_recorded());
        assert!(admission.text_update_apply_recorded());
        assert!(admission.update_route_admission_accepted());
        assert!(admission.host_output_handoff_accepted());
        assert!(!admission.public_update_compatibility_claimed());
        assert!(!admission.public_serialization_available());
        assert!(!admission.native_bridge_available());
        assert!(!admission.native_execution());
        assert!(!admission.compatibility_claimed());
    }

    #[test]
    fn root_private_update_native_bridge_admission_rejects_missing_handoff() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let outcome = root
            .update_host_component_with_props_and_text_for_canary(
                "span",
                props().with_attribute("data-state", "new"),
                "goodbye",
            )
            .unwrap();

        let error = root
            .describe_private_update_native_bridge_admission_for_canary(&outcome, None)
            .unwrap_err();

        let TestRendererRootError::PrivateUpdateNativeBridgeAdmission(error) = error else {
            panic!("expected private update native bridge admission rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateUpdateNativeBridgeAdmissionError::MissingHostOutputHandoff
        ));
    }

    #[test]
    fn root_private_update_native_bridge_admission_rejects_stale_route_outcome() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let stale_outcome = root
            .update_host_component_with_text_for_canary("span", "goodbye")
            .unwrap();
        let stale_handoff = root
            .render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();
        root.update_host_component_with_text_for_canary("span", "later")
            .unwrap();
        root.render_and_commit_host_output_update_for_canary()
            .unwrap()
            .unwrap();

        let error = root
            .describe_private_update_native_bridge_admission_for_canary(
                &stale_outcome,
                Some(&stale_handoff),
            )
            .unwrap_err();

        let TestRendererRootError::PrivateUpdateNativeBridgeAdmission(error) = error else {
            panic!("expected private update native bridge admission rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateUpdateNativeBridgeAdmissionError::StaleRouteOutcome
        ));
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
        let order_gate = commit.deletion_cleanup_order_gate_for_canary();
        let order_records = order_gate.records();
        let handoff = root
            .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
            .unwrap();
        let admission = root
            .describe_private_unmount_native_bridge_admission_for_canary(&outcome, Some(&handoff))
            .unwrap();
        let detachment_blockers = handoff.host_child_detachment_blockers();
        let passive_ref_order = handoff.passive_ref_cleanup_order();

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
        assert_eq!(order_gate.len(), 2);
        assert_eq!(order_gate.ref_cleanup_return_count(), 0);
        assert_eq!(order_gate.passive_destroy_count(), 0);
        assert_eq!(order_gate.host_node_cleanup_count(), 2);
        assert!(!order_gate.ref_cleanup_return_callbacks_invoked());
        assert!(!order_gate.passive_destroy_callbacks_invoked());
        assert!(!order_gate.public_effects_flushed());
        assert!(!order_gate.public_ref_or_effect_compatibility_claimed());
        assert_eq!(order_records[0].sequence(), 0);
        assert_eq!(order_records[0].phase_name(), "host-node-cleanup");
        assert_eq!(order_records[0].host_cleanup_sequence(), Some(0));
        assert_eq!(
            order_records[0].deletion_list_index(),
            Some(cleanup_records[0].deletion_list_index())
        );
        assert_eq!(
            order_records[0].deleted_index(),
            Some(cleanup_records[0].deleted_index())
        );
        assert_eq!(
            order_records[0].subtree_index(),
            Some(cleanup_records[0].subtree_index())
        );
        assert_eq!(order_records[1].sequence(), 1);
        assert_eq!(order_records[1].phase_name(), "host-node-cleanup");
        assert_eq!(order_records[1].host_cleanup_sequence(), Some(1));
        assert_eq!(
            order_records[1].subtree_index(),
            Some(cleanup_records[1].subtree_index())
        );
        assert_eq!(host_node_activity_counts(&root), (0, 2));
        assert_eq!(unmounted.previous_snapshot().children().len(), 1);
        assert!(unmounted.snapshot().children().is_empty());
        assert!(unmounted.detached_instance_snapshot().is_detached());
        assert!(unmounted.detached_instance_snapshot().children().is_empty());
        assert_eq!(
            handoff.diagnostic_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
        );
        assert_eq!(
            handoff.status(),
            TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_STATUS
        );
        assert_eq!(handoff.root(), root.root_id());
        assert_eq!(
            handoff.lifecycle(),
            TestRendererRootLifecycle::UnmountScheduled
        );
        assert_eq!(
            handoff.scheduled_update_kind(),
            TestRendererRootUpdateKind::Unmount
        );
        assert_eq!(handoff.scheduled_element(), RootElementHandle::NONE);
        assert!(handoff.scheduled_element_is_none());
        assert_eq!(
            handoff.render_current().slot(),
            render.current().slot().get()
        );
        assert_eq!(
            handoff.commit_previous_current().slot(),
            commit.previous_current().slot().get()
        );
        assert_eq!(
            handoff.commit_current().slot(),
            commit.current().slot().get()
        );
        assert_eq!(
            handoff.render_finished_work().slot(),
            render.finished_work().slot().get()
        );
        assert_eq!(
            handoff.deleted_root().slot(),
            render.finished_work().slot().get()
        );
        assert_eq!(
            handoff.deleted_component().slot(),
            current.component().slot().get()
        );
        assert_eq!(handoff.deleted_text().slot(), current.text().slot().get());
        assert!(handoff.commit_current_is_store_current());
        assert!(handoff.render_current_matches_commit_previous_current());
        assert!(handoff.render_finished_work_matches_commit_current());
        assert_eq!(handoff.deletion_list_count(), 1);
        assert_eq!(handoff.deleted_root_count(), 1);
        assert_eq!(handoff.host_node_cleanup_count(), 2);
        assert!(handoff.cleanup_records_match_deletion_commit());
        assert_eq!(handoff.cleanup_order_record_count(), 2);
        assert_eq!(
            passive_ref_order.diagnostic_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_DIAGNOSTIC_ID
        );
        assert_eq!(
            passive_ref_order.status(),
            TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_STATUS
        );
        assert_eq!(passive_ref_order.root(), root.root_id());
        assert_eq!(passive_ref_order.ref_cleanup_return_count(), 0);
        assert_eq!(passive_ref_order.passive_destroy_count(), 0);
        assert_eq!(passive_ref_order.host_node_cleanup_count(), 2);
        assert_eq!(passive_ref_order.cleanup_order_record_count(), 2);
        assert_eq!(passive_ref_order.first_host_node_cleanup_order(), Some(0));
        assert_eq!(passive_ref_order.last_ref_cleanup_return_order(), None);
        assert_eq!(passive_ref_order.first_passive_destroy_order(), None);
        assert_eq!(passive_ref_order.last_passive_destroy_order(), None);
        assert!(passive_ref_order.ref_cleanup_return_precedes_passive_destroy());
        assert!(passive_ref_order.host_cleanup_follows_ref_cleanup_return());
        assert!(passive_ref_order.host_cleanup_follows_passive_destroy());
        assert!(passive_ref_order.native_cleanup_after_ref_and_passive_ordering());
        assert!(passive_ref_order.minimal_tree_ordering_is_host_cleanup_only());
        assert!(!passive_ref_order.ref_cleanup_return_callbacks_invoked());
        assert!(!passive_ref_order.passive_destroy_callbacks_invoked());
        assert!(!passive_ref_order.public_effects_flushed());
        assert!(!passive_ref_order.public_ref_or_effect_compatibility_claimed());
        assert!(!passive_ref_order.public_unmount_compatibility_claimed());
        assert!(!passive_ref_order.act_flushing_claimed());
        assert!(!handoff.public_unmount_compatibility_claimed());
        assert!(!handoff.public_host_teardown_compatibility_claimed());
        assert!(!handoff.act_flushing_claimed());
        assert!(detachment_blockers.detached_instance());
        assert_eq!(detachment_blockers.detached_instance_child_count(), 0);
        assert_eq!(detachment_blockers.host_node_cleanup_invalidated_count(), 2);
        assert_eq!(
            detachment_blockers.host_node_cleanup_already_inactive_count(),
            0
        );
        assert_eq!(
            detachment_blockers.host_node_cleanup_missing_host_node_count(),
            0
        );
        assert_eq!(
            detachment_blockers.host_node_cleanup_missing_state_node_count(),
            0
        );
        assert!(detachment_blockers.broad_host_child_detachment_blocked());
        assert!(!detachment_blockers.public_host_teardown_compatibility_claimed());
        assert!(!detachment_blockers.public_unmount_compatibility_claimed());
        assert!(!detachment_blockers.act_flushing_claimed());
        assert_eq!(
            admission.diagnostic_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        );
        assert_eq!(
            admission.status(),
            TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS
        );
        assert_eq!(admission.root(), root.root_id());
        assert_eq!(
            admission.route_dependency_id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
        );
        assert_eq!(
            admission.deletion_commit_handoff_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
        );
        assert_eq!(
            admission.cleanup_handoff_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID
        );
        assert_eq!(
            admission.lifecycle(),
            TestRendererRootLifecycle::UnmountScheduled
        );
        assert_eq!(
            admission.scheduled_update_kind(),
            TestRendererRootUpdateKind::Unmount
        );
        assert!(admission.scheduled_element_is_none());
        assert!(admission.deletion_commit_handoff_accepted());
        assert!(admission.cleanup_handoff_accepted());
        assert!(admission.lifecycle_evidence_accepted());
        assert!(admission.cleanup_blockers_accepted());
        assert!(admission.passive_ref_cleanup_order_accepted());
        assert_eq!(admission.host_node_cleanup_count(), 2);
        assert_eq!(admission.ref_cleanup_return_count(), 0);
        assert_eq!(admission.passive_destroy_count(), 0);
        assert_eq!(admission.cleanup_order_record_count(), 2);
        assert!(admission.native_cleanup_after_ref_and_passive_ordering());
        assert!(admission.rust_unmount_cleanup_handoff_executed());
        assert!(admission.host_output_produced());
        assert!(admission.minimal_tree_cleanup_handoff());
        assert!(admission.rejects_already_unmounted_roots());
        assert!(admission.rejects_stale_deletion_handoffs());
        assert!(admission.rejects_missing_cleanup_blockers());
        assert!(!admission.public_unmount_compatibility_claimed());
        assert!(!admission.public_host_teardown_compatibility_claimed());
        assert!(!admission.act_flushing_claimed());
        assert!(!admission.native_bridge_available());
        assert!(!admission.native_execution());
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
    fn root_private_unmount_native_bridge_admission_executes_minimal_cleanup_handoff() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();

        let cleanup_handoff = root
            .execute_private_unmount_native_bridge_cleanup_handoff_for_canary()
            .unwrap();
        let deletion_handoff = cleanup_handoff.deletion_commit_handoff();
        let admission = cleanup_handoff.native_bridge_admission();
        let passive_ref_order = cleanup_handoff.passive_ref_cleanup_order();

        assert_eq!(
            cleanup_handoff.diagnostic_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID
        );
        assert_eq!(
            cleanup_handoff.status(),
            TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_STATUS
        );
        assert_eq!(cleanup_handoff.root(), root.root_id());
        assert_eq!(cleanup_handoff.route_outcome(), "Scheduled");
        assert_eq!(
            cleanup_handoff.route_dependency_id(),
            TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID
        );
        assert_eq!(
            cleanup_handoff.deletion_commit_handoff_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
        );
        assert_eq!(
            cleanup_handoff.admission_diagnostic_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        );
        assert_eq!(
            cleanup_handoff.lifecycle(),
            TestRendererRootLifecycle::UnmountScheduled
        );
        assert_eq!(
            cleanup_handoff.scheduled_update_kind(),
            TestRendererRootUpdateKind::Unmount
        );
        assert!(cleanup_handoff.scheduled_element_is_none());
        assert_eq!(cleanup_handoff.previous_root_child_count(), 1);
        assert_eq!(cleanup_handoff.current_root_child_count(), 0);
        assert!(cleanup_handoff.detached_instance());
        assert_eq!(cleanup_handoff.detached_instance_child_count(), 0);
        assert_eq!(cleanup_handoff.host_node_cleanup_count(), 2);
        assert_eq!(cleanup_handoff.ref_cleanup_return_count(), 0);
        assert_eq!(cleanup_handoff.passive_destroy_count(), 0);
        assert_eq!(cleanup_handoff.cleanup_order_record_count(), 2);
        assert!(cleanup_handoff.native_cleanup_after_ref_and_passive_ordering());
        assert!(cleanup_handoff.minimal_tree_cleanup_handoff());
        assert!(cleanup_handoff.rust_unmount_cleanup_handoff_executed());
        assert!(cleanup_handoff.host_output_produced());
        assert_eq!(
            passive_ref_order.diagnostic_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_DIAGNOSTIC_ID
        );
        assert_eq!(passive_ref_order.ref_cleanup_return_count(), 0);
        assert_eq!(passive_ref_order.passive_destroy_count(), 0);
        assert_eq!(passive_ref_order.host_node_cleanup_count(), 2);
        assert_eq!(passive_ref_order.cleanup_order_record_count(), 2);
        assert_eq!(passive_ref_order.first_host_node_cleanup_order(), Some(0));
        assert!(passive_ref_order.native_cleanup_after_ref_and_passive_ordering());
        assert!(passive_ref_order.minimal_tree_ordering_is_host_cleanup_only());
        assert!(!passive_ref_order.public_ref_or_effect_compatibility_claimed());
        assert_eq!(
            deletion_handoff.diagnostic_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID
        );
        assert_eq!(
            admission.diagnostic_id(),
            TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        );
        assert!(admission.deletion_commit_handoff_accepted());
        assert!(admission.cleanup_handoff_accepted());
        assert!(admission.passive_ref_cleanup_order_accepted());
        assert_eq!(admission.ref_cleanup_return_count(), 0);
        assert_eq!(admission.passive_destroy_count(), 0);
        assert!(admission.native_cleanup_after_ref_and_passive_ordering());
        assert!(admission.rust_unmount_cleanup_handoff_executed());
        assert!(admission.host_output_produced());
        assert!(admission.minimal_tree_cleanup_handoff());
        assert!(!cleanup_handoff.public_unmount_compatibility_claimed());
        assert!(!cleanup_handoff.public_host_teardown_compatibility_claimed());
        assert!(!cleanup_handoff.act_flushing_claimed());
        assert!(!cleanup_handoff.native_bridge_available());
        assert!(!cleanup_handoff.native_execution());
        assert!(!admission.public_unmount_compatibility_claimed());
        assert!(!admission.public_host_teardown_compatibility_claimed());
        assert!(!admission.act_flushing_claimed());
        assert!(!admission.native_bridge_available());
        assert!(!admission.native_execution());
        assert_eq!(host_storage_counts(&root), (1, 1, 1));
        assert_eq!(host_node_activity_counts(&root), (0, 2));
        assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
        assert!(
            root.diagnostic_container_snapshot()
                .unwrap()
                .children()
                .is_empty()
        );
    }

    #[test]
    fn root_private_unmount_route_rejects_stale_deletion_commit_handoff() {
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

        root.unmount().unwrap();
        let mut unmounted = root
            .render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap();
        unmounted.commit = created.commit().clone();

        let error = root
            .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
            .unwrap_err();

        let TestRendererRootError::SerializationGate(error) = error else {
            panic!("expected serialization gate stale commit rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererSerializationGateError::CommitIsNotCurrent { root: error_root, .. }
                if *error_root == root.root_id()
        ));
    }

    #[test]
    fn root_private_unmount_native_bridge_admission_rejects_stale_handoff() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let outcome = root.unmount().unwrap();
        let unmounted = root
            .render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap();
        let mut handoff = root
            .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
            .unwrap();
        handoff.commit_current_is_store_current = false;

        let error = root
            .describe_private_unmount_native_bridge_admission_for_canary(&outcome, Some(&handoff))
            .unwrap_err();

        let TestRendererRootError::PrivateUnmountNativeBridgeAdmission(error) = error else {
            panic!("expected private unmount native bridge admission rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleDeletionCommitHandoff {
                reason: "commit-handoff-identity-mismatch"
            }
        ));
    }

    #[test]
    fn root_private_unmount_native_bridge_admission_rejects_missing_cleanup_blockers() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let outcome = root.unmount().unwrap();
        let unmounted = root
            .render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap();
        let mut handoff = root
            .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
            .unwrap();
        handoff.host_node_cleanup_count = 0;

        let error = root
            .describe_private_unmount_native_bridge_admission_for_canary(&outcome, Some(&handoff))
            .unwrap_err();

        let TestRendererRootError::PrivateUnmountNativeBridgeAdmission(error) = error else {
            panic!("expected private unmount native bridge admission rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                reason: "missing-host-node-cleanup-records"
            }
        ));
    }

    #[test]
    fn root_private_unmount_passive_ref_order_rejects_native_cleanup_mismatch() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let outcome = root.unmount().unwrap();
        let unmounted = root
            .render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap();
        let mut handoff = root
            .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
            .unwrap();
        handoff
            .passive_ref_cleanup_order
            .native_cleanup_after_ref_and_passive_ordering = false;

        let error = root
            .describe_private_unmount_native_bridge_admission_for_canary(&outcome, Some(&handoff))
            .unwrap_err();

        let TestRendererRootError::PrivateUnmountNativeBridgeAdmission(error) = error else {
            panic!("expected private unmount native bridge passive/ref order rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingCleanupBlockers {
                reason: "passive-ref-cleanup-order-mismatch"
            }
        ));
    }

    #[test]
    fn root_private_unmount_native_bridge_admission_rejects_already_unmounted_root() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        root.unmount().unwrap();
        let unmounted = root
            .render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap();
        let handoff = root
            .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
            .unwrap();
        let second_outcome = root.unmount().unwrap();

        let error = root
            .describe_private_unmount_native_bridge_admission_for_canary(
                &second_outcome,
                Some(&handoff),
            )
            .unwrap_err();

        let TestRendererRootError::PrivateUnmountNativeBridgeAdmission(error) = error else {
            panic!("expected private unmount native bridge admission rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateUnmountNativeBridgeAdmissionError::AlreadyUnmountedRoot
        ));
    }

    #[test]
    fn root_host_output_unmount_canary_rejects_already_unmounted_root_record() {
        let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
            "span",
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        root.unmount().unwrap();
        root.render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap();

        assert_eq!(
            root.unmount().unwrap(),
            TestRendererRootUpdateOutcome::AlreadyUnmountScheduled
        );
        let error = root
            .render_and_commit_host_output_unmount_for_canary()
            .unwrap_err();

        assert!(matches!(
            error,
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Unmount
            }
        ));
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
    fn root_options_store_error_callback_handles_without_invocation() {
        let options = TestRendererOptions::new()
            .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(501))
            .with_on_caught_error(RootErrorCallbackHandle::from_raw(502))
            .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(503));

        let mut root = TestRendererRoot::create(root_element(1), options).unwrap();
        root.update(root_element(2)).unwrap();
        root.unmount().unwrap();

        assert_eq!(
            root.options().on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(501)
        );
        assert_eq!(
            root.options().on_caught_error(),
            RootErrorCallbackHandle::from_raw(502)
        );
        assert_eq!(
            root.options().on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(503)
        );

        let root_options = root.store().root(root.root_id()).unwrap().options();
        assert_eq!(
            root_options.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(501)
        );
        assert_eq!(
            root_options.on_caught_error(),
            RootErrorCallbackHandle::from_raw(502)
        );
        assert_eq!(
            root_options.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(503)
        );
    }

    #[test]
    fn root_private_error_boundary_diagnostics_record_update_and_commit_rows_from_options() {
        let options = TestRendererOptions::new()
            .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(601))
            .with_on_caught_error(RootErrorCallbackHandle::from_raw(602))
            .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(603));
        let mut root =
            TestRendererRoot::create_host_component_with_text_for_canary("span", "hello", options)
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

        let diagnostics = root
            .describe_private_error_boundary_update_diagnostics_for_canary(&updated)
            .unwrap();
        let root_error_options = diagnostics.root_error_options();
        let dependencies = diagnostics.dependency_diagnostics();

        assert_eq!(
            diagnostics.diagnostic_name(),
            TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME
        );
        assert_eq!(
            diagnostics.status(),
            TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS
        );
        assert_eq!(diagnostics.root(), root.root_id());
        assert_eq!(
            diagnostics.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert!(root_error_options.root_error_option_metadata_available());
        assert!(root_error_options.has_configured_error_callback());
        assert_eq!(
            root_error_options.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(601)
        );
        assert_eq!(
            root_error_options.on_caught_error(),
            RootErrorCallbackHandle::from_raw(602)
        );
        assert_eq!(
            root_error_options.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(603)
        );
        assert!(!diagnostics.public_error_boundary_behavior_available());
        assert!(!diagnostics.public_root_error_callbacks_invoked());
        assert!(!diagnostics.compatibility_claimed());
        assert!(dependencies.update_commit_rows_ready());
        assert!(dependencies.update_route_diagnostics_available());
        assert!(dependencies.serialization_diagnostics_available());
        assert!(dependencies.test_instance_query_diagnostics_available());
        assert!(dependencies.act_scheduler_metadata_available());
        assert!(!dependencies.public_renderer_roots_executed());
        assert!(!dependencies.public_lifecycle_methods_executed());
        assert!(!dependencies.error_boundary_recovery_executed());
        assert!(!dependencies.compatibility_claimed());

        let rows = diagnostics.rows();
        assert_eq!(rows.len(), 2);
        assert_eq!(
            rows[0].id(),
            "react-test-renderer-update-error-root-option-private-diagnostic"
        );
        assert_eq!(
            rows[0].phase(),
            TestRendererPrivateErrorDiagnosticPhase::Update
        );
        assert_eq!(
            rows[1].id(),
            "react-test-renderer-commit-error-root-option-private-diagnostic"
        );
        assert_eq!(
            rows[1].phase(),
            TestRendererPrivateErrorDiagnosticPhase::Commit
        );
        for row in rows {
            assert_eq!(
                row.diagnostic_name(),
                TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME
            );
            assert_eq!(
                row.status(),
                TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS
            );
            assert_eq!(
                row.host_output_update_kind(),
                TestRendererRootUpdateKind::Update
            );
            assert_eq!(row.root(), root.root_id());
            assert_eq!(row.root_error_channel(), "onUncaughtError");
            assert_eq!(row.root_error_options(), root_error_options);
            assert_eq!(row.dependency_diagnostics(), dependencies);
            assert!(row.dependency_diagnostics().update_commit_rows_ready());
            assert!(row.root_error_options().has_configured_error_callback());
            assert!(!row.root_error_update_scheduled());
            assert!(!row.public_root_error_callbacks_invoked());
            assert!(!row.public_error_boundary_behavior_available());
            assert!(!row.compatibility_claimed());
        }
    }

    #[test]
    fn root_private_error_boundary_native_execution_evidence_consumes_update_failure_path() {
        let options = TestRendererOptions::new()
            .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(701))
            .with_on_caught_error(RootErrorCallbackHandle::from_raw(702))
            .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(703));
        let mut root =
            TestRendererRoot::create_host_component_with_text_for_canary("span", "hello", options)
                .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();
        let (_outcome, updated, admission) = root
            .render_and_admit_private_update_native_bridge_handoff_for_canary(
                "span",
                props().with_attribute("data-error-path", "update"),
                "goodbye",
            )
            .unwrap();

        let evidence = root
            .describe_private_error_boundary_commit_recovery_for_canary(&updated, admission)
            .unwrap();
        let diagnostics = evidence.error_diagnostics();
        let commit_recovery = evidence.commit_recovery_metadata();

        assert_eq!(
            evidence.diagnostic_name(),
            TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_DIAGNOSTIC_NAME
        );
        assert_eq!(
            evidence.status(),
            TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_STATUS
        );
        assert_eq!(evidence.root(), root.root_id());
        assert_eq!(evidence.operation(), "update");
        assert_eq!(evidence.public_surface(), "create().update error boundary");
        assert_eq!(evidence.update_failure_path(), "update");
        assert_eq!(
            commit_recovery.diagnostic_name(),
            TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_DIAGNOSTIC_NAME
        );
        assert_eq!(
            commit_recovery.status(),
            TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_STATUS
        );
        assert_eq!(
            commit_recovery.accepted_rust_api(),
            TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_API
        );
        assert_eq!(commit_recovery.root(), root.root_id());
        assert_eq!(commit_recovery.operation(), "update");
        assert_eq!(commit_recovery.update_failure_path(), "commit");
        assert_eq!(
            commit_recovery.commit_phase_recovery_path(),
            "ReactFiberWorkLoop.captureCommitPhaseError"
        );
        assert_eq!(
            commit_recovery.commit_phase_recovery_action(),
            "createRootErrorUpdate(SyncLane)"
        );
        assert_eq!(
            commit_recovery.react_reference(),
            "ReactFiberWorkLoop.captureCommitPhaseError -> createRootErrorUpdate(SyncLane)"
        );
        assert_eq!(
            commit_recovery.source_update_record(),
            "TestRendererUpdateNativeBridgeAdmission"
        );
        assert_eq!(
            commit_recovery.source_update_record_id(),
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        );
        assert_eq!(
            commit_recovery.source_update_record_status(),
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
        );
        assert_eq!(
            commit_recovery.source_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(
            commit_recovery.source_failure_record(),
            "HostRootRenderFailureRecoveryCommitEvidenceForCanary"
        );
        assert_eq!(
            commit_recovery.source_commit_recovery_snapshot_record(),
            "HostRootCommitRecoverySnapshotForCanary"
        );
        assert_eq!(
            commit_recovery.root_error_options(),
            diagnostics.root_error_options()
        );
        assert!(commit_recovery.consumes_accepted_rust_update_metadata());
        assert!(commit_recovery.consumes_accepted_rust_failure_metadata());
        assert!(commit_recovery.consumes_accepted_commit_recovery_snapshot());
        assert!(commit_recovery.preserves_root_error_option_handles());
        assert!(commit_recovery.commit_phase_recovery_path_consumed());
        assert!(commit_recovery.accepted_private_commit_phase_recovery_metadata());
        assert!(!commit_recovery.root_error_update_scheduled());
        assert!(!commit_recovery.public_root_error_callbacks_invoked());
        assert!(!commit_recovery.public_error_boundary_behavior_available());
        assert!(!commit_recovery.public_error_recovery_available());
        assert!(!commit_recovery.compatibility_claimed());
        assert_eq!(
            evidence.source_execution_record_id(),
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        );
        assert_eq!(
            evidence.source_execution_status(),
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
        );
        assert_eq!(
            evidence.source_execution_scheduled_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(
            evidence.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(
            diagnostics.diagnostic_name(),
            TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME
        );
        assert_eq!(diagnostics.root(), root.root_id());
        assert_eq!(evidence.row_count(), 2);
        assert_eq!(evidence.rows(), diagnostics.rows());
        assert!(evidence.consumes_accepted_root_execution_diagnostics());
        assert!(evidence.consumes_accepted_native_update_execution_record());
        assert!(evidence.consumes_private_error_boundary_diagnostics());
        assert!(evidence.consumes_private_commit_recovery_metadata());
        assert!(evidence.consumes_accepted_rust_failure_metadata());
        assert!(evidence.preserves_root_error_option_handles());
        assert!(evidence.consumes_update_error_row());
        assert!(evidence.consumes_commit_error_row());
        assert!(!evidence.root_error_update_scheduled());
        assert!(!evidence.public_root_error_callbacks_invoked());
        assert!(!evidence.public_error_boundary_behavior_available());
        assert!(!evidence.error_boundary_recovery_executed());
        assert!(!evidence.public_error_recovery_available());
        assert!(!evidence.public_commit_phase_recovery_available());
        assert!(!evidence.native_bridge_available());
        assert!(!evidence.native_execution_available());
        assert!(evidence.rust_execution_from_js());
        assert!(evidence.reconciler_execution_from_js());
        assert!(!evidence.compatibility_claimed());
        assert!(!diagnostics.public_error_boundary_behavior_available());
        assert!(!diagnostics.public_root_error_callbacks_invoked());
        assert!(!diagnostics.compatibility_claimed());
        assert_eq!(
            root.describe_private_error_boundary_update_native_execution_for_canary(
                &updated, admission
            )
            .unwrap()
            .commit_recovery_metadata(),
            commit_recovery
        );

        let mut stale_admission = admission;
        stale_admission.host_output_update_kind = TestRendererRootUpdateKind::Create;
        let error = root
            .describe_private_error_boundary_commit_recovery_for_canary(&updated, stale_admission)
            .unwrap_err();
        let TestRendererRootError::PrivateErrorBoundaryNativeExecution(error) = error else {
            panic!("expected private error boundary native execution rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                reason: "host-output-update-kind"
            }
        ));

        let mut missing_update_metadata = admission;
        missing_update_metadata.text_update_apply_recorded = false;
        let error = root
            .describe_private_error_boundary_commit_recovery_for_canary(
                &updated,
                missing_update_metadata,
            )
            .unwrap_err();
        let TestRendererRootError::PrivateErrorBoundaryNativeExecution(error) = error else {
            panic!("expected private error boundary native execution update metadata rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
                reason: "update-execution-admission-not-accepted"
            }
        ));
    }

    #[test]
    fn root_private_act_passive_effect_drain_consumes_metadata_without_public_act() {
        let root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        let finished_work = TestRendererFiberHandleDiagnostics::from_raw_parts_for_canary(7, 8, 9);
        let metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
            root.root_id(),
            finished_work,
            1,
            2,
        );

        let diagnostics =
            root.consume_private_act_pending_passive_flush_metadata_for_canary(metadata);

        assert_eq!(
            diagnostics.diagnostic_name(),
            TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME
        );
        assert_eq!(
            diagnostics.status(),
            TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_STATUS
        );
        assert_eq!(
            diagnostics.accepted_reconciler_records(),
            &TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_ACCEPTED_RECORDS
        );
        assert_eq!(diagnostics.metadata(), metadata);
        assert!(diagnostics.metadata_root_matches_renderer_root());
        assert!(diagnostics.consumes_pending_passive_flush_metadata());
        assert!(diagnostics.consumes_accepted_scheduler_flush_metadata());
        assert!(diagnostics.private_scheduler_flush_request_metadata_consumed());
        assert!(!diagnostics.consumes_accepted_native_update_execution());
        assert_eq!(diagnostics.private_update_native_bridge_admission(), None);
        assert!(!diagnostics.host_output_produced_from_native_update());
        assert_eq!(metadata.finished_work(), finished_work);
        assert_eq!(metadata.pending_unmount_count(), 1);
        assert_eq!(metadata.pending_mount_count(), 2);
        assert_eq!(metadata.pending_record_count(), 3);
        assert_eq!(metadata.scheduler_request_order(), 0);
        assert_eq!(metadata.scheduler_priority(), "Normal");
        assert!(!diagnostics.executes_passive_effects());
        assert!(!diagnostics.invokes_effect_callbacks());
        assert!(!diagnostics.invokes_act_callback());
        assert!(!diagnostics.public_update_compatibility_claimed());
        assert!(!diagnostics.public_act_compatibility_claimed());
        assert!(!diagnostics.compatibility_claimed());
    }

    #[test]
    fn root_private_act_passive_effect_drain_consumes_native_update_execution_metadata() {
        let initial_props = props().with_attribute("data-state", "old");
        let updated_props = props().with_attribute("data-state", "new");
        let mut root = TestRendererRoot::create_host_component_with_props_and_text_for_canary(
            "span",
            initial_props,
            "hello",
            TestRendererOptions::new(),
        )
        .unwrap();
        root.render_and_commit_host_output_for_canary()
            .unwrap()
            .unwrap();

        let (_outcome, updated, admission) = root
            .render_and_admit_private_update_native_bridge_handoff_for_canary(
                "span",
                updated_props,
                "goodbye",
            )
            .unwrap();
        let finished_work = updated.commit().current();
        let metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
            root.root_id(),
            TestRendererFiberHandleDiagnostics {
                arena_id: finished_work.arena_id().get(),
                slot: finished_work.slot().get(),
                generation: finished_work.generation().get(),
            },
            0,
            1,
        );

        let diagnostics = root
            .consume_private_act_update_native_execution_and_pending_passive_flush_metadata_for_canary(
                admission,
                metadata,
            );

        assert_eq!(
            diagnostics.diagnostic_name(),
            TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME
        );
        assert_eq!(diagnostics.metadata(), metadata);
        assert!(diagnostics.metadata_root_matches_renderer_root());
        assert!(diagnostics.consumes_pending_passive_flush_metadata());
        assert!(diagnostics.consumes_accepted_scheduler_flush_metadata());
        assert!(diagnostics.private_scheduler_flush_request_metadata_consumed());
        assert!(diagnostics.consumes_accepted_native_update_execution());
        assert_eq!(
            diagnostics.private_update_native_bridge_admission(),
            Some(admission)
        );
        assert!(diagnostics.host_output_produced_from_native_update());
        assert!(!diagnostics.executes_passive_effects());
        assert!(!diagnostics.invokes_effect_callbacks());
        assert!(!diagnostics.invokes_act_callback());
        assert!(!diagnostics.public_update_compatibility_claimed());
        assert!(!diagnostics.public_act_compatibility_claimed());
        assert!(!diagnostics.compatibility_claimed());
    }

    #[test]
    fn root_private_act_nested_scope_passive_flush_keeps_deterministic_private_order() {
        let root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        let finished_work =
            TestRendererFiberHandleDiagnostics::from_raw_parts_for_canary(11, 12, 13);
        let metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
            root.root_id(),
            finished_work,
            1,
            1,
        );

        let diagnostics = root
            .describe_private_act_nested_scope_passive_flush_for_canary(metadata)
            .unwrap();

        assert_eq!(
            diagnostics.diagnostic_name(),
            TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_DIAGNOSTIC_NAME
        );
        assert_eq!(
            diagnostics.status(),
            TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_STATUS
        );
        assert_eq!(
            diagnostics.flush_order(),
            &TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_ORDER
        );
        assert_eq!(diagnostics.outer_scope_depth(), 1);
        assert_eq!(diagnostics.inner_scope_depth(), 2);
        assert_eq!(diagnostics.passive_flush_order_index(), 2);
        assert_eq!(diagnostics.pending_unmount_count(), 1);
        assert_eq!(diagnostics.pending_mount_count(), 1);
        assert_eq!(diagnostics.pending_passive_record_count(), 2);
        assert!(diagnostics.nested_scope_metadata_accepted());
        assert!(diagnostics.private_passive_flush_metadata_accepted());
        assert!(diagnostics.drains_accepted_pending_passive_flush_metadata());
        assert!(diagnostics.deterministic_flush_order());

        let passive_drain = diagnostics.passive_drain();
        assert_eq!(passive_drain.metadata(), metadata);
        assert!(passive_drain.metadata_root_matches_renderer_root());
        assert!(passive_drain.consumes_pending_passive_flush_metadata());
        assert!(passive_drain.consumes_accepted_scheduler_flush_metadata());
        assert!(passive_drain.private_scheduler_flush_request_metadata_consumed());
        assert!(!passive_drain.executes_passive_effects());
        assert!(!passive_drain.invokes_effect_callbacks());
        assert!(!passive_drain.invokes_act_callback());
        assert!(!passive_drain.public_act_compatibility_claimed());
        assert!(!passive_drain.compatibility_claimed());

        assert!(!diagnostics.public_act_scope_depth_tracking_available());
        assert!(!diagnostics.public_nested_act_queue_reuse_available());
        assert!(!diagnostics.public_overlapping_act_warning_emission_available());
        assert!(!diagnostics.invokes_act_callback());
        assert!(!diagnostics.executes_passive_effects());
        assert!(!diagnostics.invokes_effect_callbacks());
        assert!(!diagnostics.public_act_compatibility_claimed());
        assert!(!diagnostics.compatibility_claimed());
    }

    #[test]
    fn root_private_act_nested_scope_passive_flush_rejects_stale_or_empty_metadata() {
        let root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
        let finished_work =
            TestRendererFiberHandleDiagnostics::from_raw_parts_for_canary(21, 22, 23);
        let stale_root = FiberRootId::new(root.root_id().raw() + 1).unwrap();
        let stale_metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
            stale_root,
            finished_work,
            1,
            0,
        );

        let error = root
            .describe_private_act_nested_scope_passive_flush_for_canary(stale_metadata)
            .unwrap_err();
        let TestRendererRootError::PrivateActNestedScopePassiveFlush(error) = error else {
            panic!("expected private nested act passive flush rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateActNestedScopePassiveFlushError::RootMismatch { .. }
        ));

        let empty_metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
            root.root_id(),
            finished_work,
            0,
            0,
        );
        let error = root
            .describe_private_act_nested_scope_passive_flush_for_canary(empty_metadata)
            .unwrap_err();
        let TestRendererRootError::PrivateActNestedScopePassiveFlush(error) = error else {
            panic!("expected private nested act passive flush rejection");
        };
        assert!(matches!(
            error.as_ref(),
            TestRendererPrivateActNestedScopePassiveFlushError::RecordMismatch {
                reason: "missing-pending-passive-work"
            }
        ));
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
