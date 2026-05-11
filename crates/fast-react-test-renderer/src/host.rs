use super::*;

static NEXT_RENDERER_ID: AtomicU64 = AtomicU64::new(1);

#[derive(Debug)]
pub struct TestRenderer {
    pub(crate) renderer_id: TestRendererId,
    pub(crate) containers: Vec<TestContainerRecord>,
    pub(crate) instances: Vec<TestInstanceRecord>,
    pub(crate) texts: Vec<TestTextRecord>,
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

    pub(crate) fn push_instance(
        &mut self,
        element_type: TestElementType,
        props: TestProps,
    ) -> TestInstance {
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

    pub(crate) fn push_text(&mut self, text: String) -> TestTextInstance {
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

    pub(crate) fn snapshot_child(&self, child: TestChildHandle) -> HostResult<TestNodeSnapshot> {
        match child {
            TestChildHandle::Instance(instance) => Ok(TestNodeSnapshot::Element(
                self.snapshot_instance(&instance)?,
            )),
            TestChildHandle::Text(text) => Ok(TestNodeSnapshot::Text(self.snapshot_text(&text)?)),
        }
    }

    pub(crate) fn host_child_to_handle(child: HostChild<'_, Self>) -> TestChildHandle {
        match child {
            HostChild::Instance(instance) => TestChildHandle::Instance(*instance),
            HostChild::Text(text) => TestChildHandle::Text(*text),
        }
    }

    pub(crate) fn append_child_handle(children: &mut Vec<TestChildHandle>, child: TestChildHandle) {
        if let Some(index) = children.iter().position(|existing| *existing == child) {
            children.remove(index);
        }

        children.push(child);
    }

    pub(crate) fn insert_child_handle_before(
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

    pub(crate) fn remove_child_handle(
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

    pub(crate) fn detach_child_from_all_parents(&mut self, child: TestChildHandle) {
        for container in &mut self.containers {
            container.children.retain(|existing| *existing != child);
        }

        for instance in &mut self.instances {
            instance.children.retain(|existing| *existing != child);
        }
    }

    pub(crate) fn validate_child_handle(&self, child: TestChildHandle) -> HostResult<()> {
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

    pub(crate) fn container_record(
        &self,
        container: TestContainer,
    ) -> HostResult<&TestContainerRecord> {
        if container.renderer_id != self.renderer_id {
            return Err(Self::invalid_handle_error(HostHandleKind::Container));
        }

        self.containers
            .get(container.index)
            .ok_or_else(|| Self::invalid_handle_error(HostHandleKind::Container))
    }

    pub(crate) fn container_record_mut(
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

    pub(crate) fn instance_record(
        &self,
        instance: TestInstance,
    ) -> HostResult<&TestInstanceRecord> {
        if instance.renderer_id != self.renderer_id {
            return Err(Self::invalid_handle_error(HostHandleKind::Instance));
        }

        self.instances
            .get(instance.index)
            .ok_or_else(|| Self::invalid_handle_error(HostHandleKind::Instance))
    }

    pub(crate) fn instance_record_mut(
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

    pub(crate) fn text_record(&self, text: TestTextInstance) -> HostResult<&TestTextRecord> {
        if text.renderer_id != self.renderer_id {
            return Err(Self::invalid_handle_error(HostHandleKind::TextInstance));
        }

        self.texts
            .get(text.index)
            .ok_or_else(|| Self::invalid_handle_error(HostHandleKind::TextInstance))
    }

    pub(crate) fn text_record_mut(
        &mut self,
        text: TestTextInstance,
    ) -> HostResult<&mut TestTextRecord> {
        if text.renderer_id != self.renderer_id {
            return Err(Self::invalid_handle_error(HostHandleKind::TextInstance));
        }

        self.texts
            .get_mut(text.index)
            .ok_or_else(|| Self::invalid_handle_error(HostHandleKind::TextInstance))
    }

    pub(crate) fn child_attached_to_parent(
        &self,
        parent: TestInstance,
        child: TestChildHandle,
    ) -> HostResult<bool> {
        Ok(self.instance_record(parent)?.children.contains(&child))
    }

    pub(crate) fn child_attached_to_container(
        &self,
        container: TestContainer,
        child: TestChildHandle,
    ) -> HostResult<bool> {
        Ok(self.container_record(container)?.children.contains(&child))
    }

    pub(crate) fn validate_parent_child_mutation(
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

    pub(crate) fn instance_contains_descendant(
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

    pub(crate) fn invalid_handle_error(handle: HostHandleKind) -> HostError {
        HostOperationError::invalid_handle(TEST_RENDERER_NAME, handle).into()
    }

    pub(crate) fn missing_insertion_target_error(
        parent: HostParentKind,
        target: HostChildKind,
    ) -> HostError {
        HostOperationError::missing_insertion_target(TEST_RENDERER_NAME, parent, target).into()
    }

    pub(crate) fn missing_removal_target_error(
        parent: HostParentKind,
        child: HostChildKind,
    ) -> HostError {
        HostOperationError::missing_removal_target(TEST_RENDERER_NAME, parent, child).into()
    }

    pub(crate) fn impossible_mutation_error(
        parent: HostParentKind,
        child: HostChildKind,
        violation: HostMutationViolation,
    ) -> HostError {
        HostOperationError::impossible_mutation(TEST_RENDERER_NAME, parent, child, violation).into()
    }

    pub(crate) fn invalid_fiber_token_error(
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
        violation: HostFiberTokenViolation,
    ) -> HostError {
        HostOperationError::invalid_fiber_token(TEST_RENDERER_NAME, phase, target, violation).into()
    }

    pub(crate) fn validate_fiber_token(
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
pub(crate) struct TestRendererId(pub(crate) u64);

pub type TestHostFiberToken = u64;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TestContainer {
    pub(crate) renderer_id: TestRendererId,
    pub(crate) index: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TestInstance {
    pub(crate) renderer_id: TestRendererId,
    pub(crate) index: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TestTextInstance {
    pub(crate) renderer_id: TestRendererId,
    pub(crate) index: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct TestElementType {
    pub(crate) name: String,
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
    pub(crate) text_content: Option<String>,
    pub(crate) attributes: BTreeMap<String, String>,
    pub(crate) styles: BTreeMap<String, String>,
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
    pub(crate) props: TestProps,
}

impl TestUpdatePayload {
    #[must_use]
    pub fn replace_props(props: TestProps) -> Self {
        Self { props }
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct TestHostContext {
    pub(crate) depth: usize,
}

impl TestHostContext {
    #[must_use]
    pub const fn depth(&self) -> usize {
        self.depth
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestCommitState {
    pub(crate) container: TestContainer,
}

impl TestCommitState {
    #[must_use]
    pub const fn container(&self) -> TestContainer {
        self.container
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestContainerSnapshot {
    pub(crate) children: Vec<TestNodeSnapshot>,
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
    pub(crate) element_type: TestElementType,
    pub(crate) props: TestProps,
    pub(crate) hidden: bool,
    pub(crate) detached: bool,
    pub(crate) children: Vec<TestNodeSnapshot>,
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
    pub(crate) text: String,
    pub(crate) hidden: bool,
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
pub(crate) struct TestContainerRecord {
    pub(crate) children: Vec<TestChildHandle>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestInstanceRecord {
    pub(crate) element_type: TestElementType,
    pub(crate) props: TestProps,
    pub(crate) children: Vec<TestChildHandle>,
    pub(crate) hidden: bool,
    pub(crate) detached: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestTextRecord {
    pub(crate) text: String,
    pub(crate) hidden: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestChildHandle {
    Instance(TestInstance),
    Text(TestTextInstance),
}

impl TestChildHandle {
    pub(crate) const fn kind(self) -> HostChildKind {
        match self {
            Self::Instance(_) => HostChildKind::Instance,
            Self::Text(_) => HostChildKind::TextInstance,
        }
    }
}

type TestCreateNodeMockCallback = dyn Fn() + Send + Sync + 'static;

#[derive(Clone)]
pub struct TestCreateNodeMock {
    pub(crate) callback: Arc<TestCreateNodeMockCallback>,
}

impl TestCreateNodeMock {
    #[must_use]
    pub fn new(callback: impl Fn() + Send + Sync + 'static) -> Self {
        Self {
            callback: Arc::new(callback),
        }
    }

    pub(crate) fn is_stored(&self) -> bool {
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
    pub(crate) strict_mode: bool,
    pub(crate) create_node_mock: Option<TestCreateNodeMock>,
    pub(crate) on_uncaught_error: RootErrorCallbackHandle,
    pub(crate) on_caught_error: RootErrorCallbackHandle,
    pub(crate) on_recoverable_error: RootRecoverableErrorCallbackHandle,
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

    pub(crate) fn reconciler_options(&self) -> RootOptions {
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
