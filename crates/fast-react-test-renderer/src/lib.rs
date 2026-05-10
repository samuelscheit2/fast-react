//! Deterministic in-memory mutation test renderer.
//!
//! This crate proves that the canonical `fast-react-host-config` capability
//! traits can be implemented without DOM, native, hydration, persistence, or
//! legacy `HostConfig` behavior. Its root canary delegates create/update/
//! unmount scheduling to `fast-react-reconciler` and exposes a diagnostic
//! HostRoot render/commit handoff, including callback snapshot diagnostics,
//! but it still stops before host output, serialization, act, or public
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
    HostRootRenderPhaseRecord, RootCommitError, RootElementHandle, RootOptions,
    RootScheduleMicrotaskResult, RootSchedulerError, RootUpdateCallbackHandle, RootUpdateError,
    RootWorkLoopError, ScheduledRootUpdateResult, UpdateContainerResult, commit_finished_host_root,
    ensure_root_is_scheduled, process_root_schedule_in_microtask, render_host_root_for_lanes,
    scheduled_roots, update_container, update_container_sync,
};

pub const TEST_RENDERER_NAME: &str = "fast-react-test-renderer";

static NEXT_RENDERER_ID: AtomicU64 = AtomicU64::new(1);

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

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererRootError {
    Host(HostError),
    FiberRootStore(FiberRootStoreError),
    RootUpdate(RootUpdateError),
    RootScheduler(RootSchedulerError),
    RootWorkLoop(RootWorkLoopError),
    RootCommit(RootCommitError),
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

pub struct TestRendererRoot {
    renderer: TestRenderer,
    container: TestContainer,
    store: FiberRootStore<TestRenderer>,
    root_id: FiberRootId,
    options: TestRendererOptions,
    lifecycle: TestRendererRootLifecycle,
    scheduled_updates: Vec<TestRendererRootScheduledUpdate>,
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

    fn create_with_root_update_callback(
        element: RootElementHandle,
        options: TestRendererOptions,
        callback: Option<RootUpdateCallbackHandle>,
    ) -> Result<Self, TestRendererRootError> {
        let mut renderer = TestRenderer::new();
        let container = renderer.create_container();
        let mut store = FiberRootStore::<TestRenderer>::new();
        let root_id = store.create_client_root(container, options.reconciler_options())?;
        let mut root = Self {
            renderer,
            container,
            store,
            root_id,
            options,
            lifecycle: TestRendererRootLifecycle::Active,
            scheduled_updates: Vec::new(),
        };

        let record =
            root.schedule_root_update(TestRendererRootUpdateKind::Create, element, callback)?;
        root.scheduled_updates.push(record);
        Ok(root)
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

    pub fn diagnostic_container_snapshot(
        &self,
    ) -> Result<TestContainerSnapshot, TestRendererRootError> {
        Ok(self.renderer.snapshot_container(&self.container)?)
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
