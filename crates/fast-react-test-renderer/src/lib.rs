//! Deterministic in-memory mutation test renderer.
//!
//! This crate proves that the canonical `fast-react-host-config` capability
//! traits can be implemented without DOM, native, hydration, persistence, or
//! legacy `HostConfig` behavior. It is not a reconciler and does not render
//! React components yet; callers drive host operations directly.

use std::collections::BTreeMap;

use fast_react_host_config::{
    HostCapability, HostCapabilitySet, HostChild, HostCommit, HostCreation, HostIdentityAndContext,
    HostResult, HostTypes, InitialChildrenFinalization, MutationHost,
};

pub const TEST_RENDERER_NAME: &str = "fast-react-test-renderer";

#[derive(Debug, Default)]
pub struct TestRenderer {
    containers: Vec<TestContainerRecord>,
    instances: Vec<TestInstanceRecord>,
    texts: Vec<TestTextRecord>,
}

impl TestRenderer {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    pub fn create_container(&mut self) -> TestContainer {
        let container = TestContainer {
            index: self.containers.len(),
        };
        self.containers.push(TestContainerRecord::default());
        container
    }

    #[must_use]
    pub fn snapshot_container(&self, container: &TestContainer) -> TestContainerSnapshot {
        TestContainerSnapshot {
            children: self
                .container_record(*container)
                .children
                .iter()
                .map(|child| self.snapshot_child(*child))
                .collect(),
        }
    }

    #[must_use]
    pub fn snapshot_instance(&self, instance: &TestInstance) -> TestElementSnapshot {
        let record = self.instance_record(*instance);

        TestElementSnapshot {
            element_type: record.element_type.clone(),
            props: record.props.clone(),
            hidden: record.hidden,
            detached: record.detached,
            children: record
                .children
                .iter()
                .map(|child| self.snapshot_child(*child))
                .collect(),
        }
    }

    #[must_use]
    pub fn snapshot_text(&self, text: &TestTextInstance) -> TestTextSnapshot {
        let record = self.text_record(*text);

        TestTextSnapshot {
            text: record.text.clone(),
            hidden: record.hidden,
        }
    }

    fn push_instance(&mut self, element_type: TestElementType, props: TestProps) -> TestInstance {
        let instance = TestInstance {
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
            index: self.texts.len(),
        };
        self.texts.push(TestTextRecord {
            text,
            hidden: false,
        });
        text_instance
    }

    fn snapshot_child(&self, child: TestChildHandle) -> TestNodeSnapshot {
        match child {
            TestChildHandle::Instance(instance) => {
                TestNodeSnapshot::Element(self.snapshot_instance(&instance))
            }
            TestChildHandle::Text(text) => TestNodeSnapshot::Text(self.snapshot_text(&text)),
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
    ) {
        assert!(
            children.contains(&before_child),
            "test renderer insert target must already be attached"
        );

        if child == before_child {
            return;
        }

        if let Some(index) = children.iter().position(|existing| *existing == child) {
            children.remove(index);
        }

        let before_index = children
            .iter()
            .position(|existing| *existing == before_child)
            .expect("insert target was validated before child move");
        children.insert(before_index, child);
    }

    fn remove_child_handle(children: &mut Vec<TestChildHandle>, child: TestChildHandle) {
        let index = children
            .iter()
            .position(|existing| *existing == child)
            .expect("test renderer removal target must already be attached");
        children.remove(index);
    }

    fn detach_child_from_all_parents(&mut self, child: TestChildHandle) {
        for container in &mut self.containers {
            container.children.retain(|existing| *existing != child);
        }

        for instance in &mut self.instances {
            instance.children.retain(|existing| *existing != child);
        }
    }

    fn validate_child_handle(&self, child: TestChildHandle) {
        match child {
            TestChildHandle::Instance(instance) => {
                self.instance_record(instance);
            }
            TestChildHandle::Text(text) => {
                self.text_record(text);
            }
        }
    }

    fn container_record(&self, container: TestContainer) -> &TestContainerRecord {
        self.containers
            .get(container.index)
            .expect("test renderer container handle must be valid")
    }

    fn container_record_mut(&mut self, container: TestContainer) -> &mut TestContainerRecord {
        self.containers
            .get_mut(container.index)
            .expect("test renderer container handle must be valid")
    }

    fn instance_record(&self, instance: TestInstance) -> &TestInstanceRecord {
        self.instances
            .get(instance.index)
            .expect("test renderer instance handle must be valid")
    }

    fn instance_record_mut(&mut self, instance: TestInstance) -> &mut TestInstanceRecord {
        self.instances
            .get_mut(instance.index)
            .expect("test renderer instance handle must be valid")
    }

    fn text_record(&self, text: TestTextInstance) -> &TestTextRecord {
        self.texts
            .get(text.index)
            .expect("test renderer text handle must be valid")
    }

    fn text_record_mut(&mut self, text: TestTextInstance) -> &mut TestTextRecord {
        self.texts
            .get_mut(text.index)
            .expect("test renderer text handle must be valid")
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TestContainer {
    index: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TestInstance {
    index: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TestTextInstance {
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

impl HostTypes for TestRenderer {
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

    fn get_public_instance(&self, instance: &Self::Instance) -> Self::PublicInstance {
        self.instance_record(*instance);
        *instance
    }

    fn root_host_context(&self, container: &Self::Container) -> Self::HostContext {
        self.container_record(*container);
        TestHostContext::default()
    }

    fn child_host_context(
        &self,
        parent_context: &Self::HostContext,
        _ty: &Self::Type,
        _props: &Self::Props,
    ) -> Self::HostContext {
        TestHostContext {
            depth: parent_context.depth + 1,
        }
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
        ty: &Self::Type,
        props: &Self::Props,
        container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<Self::Instance> {
        self.container_record(*container);
        Ok(self.push_instance(ty.clone(), props.clone()))
    }

    fn create_text_instance(
        &mut self,
        text: &str,
        container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<Self::TextInstance> {
        self.container_record(*container);
        Ok(self.push_text(text.to_owned()))
    }

    fn append_initial_child(
        &mut self,
        parent: &mut Self::Instance,
        child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        let child = Self::host_child_to_handle(child);
        self.validate_child_handle(child);
        self.detach_child_from_all_parents(child);
        let parent = self.instance_record_mut(*parent);
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
        self.instance_record(*instance);
        self.container_record(*container);
        Ok(InitialChildrenFinalization::NoCommitMount)
    }

    fn clone_mutable_instance(
        &mut self,
        instance: &Self::Instance,
        update_payload: Option<&Self::UpdatePayload>,
    ) -> HostResult<Self::Instance> {
        let mut record = self.instance_record(*instance).clone();
        if let Some(update_payload) = update_payload {
            record.props = update_payload.props.clone();
        }
        record.detached = false;

        let cloned = TestInstance {
            index: self.instances.len(),
        };
        self.instances.push(record);
        Ok(cloned)
    }

    fn clone_mutable_text_instance(
        &mut self,
        text_instance: &Self::TextInstance,
    ) -> HostResult<Self::TextInstance> {
        let record = self.text_record(*text_instance).clone();
        let cloned = TestTextInstance {
            index: self.texts.len(),
        };
        self.texts.push(record);
        Ok(cloned)
    }
}

impl HostCommit for TestRenderer {
    fn prepare_for_commit(&mut self, container: &Self::Container) -> HostResult<Self::CommitState> {
        self.container_record(*container);
        Ok(TestCommitState {
            container: *container,
        })
    }

    fn reset_after_commit(
        &mut self,
        container: &Self::Container,
        commit_state: Self::CommitState,
    ) -> HostResult<()> {
        self.container_record(*container);
        self.container_record(commit_state.container);
        Ok(())
    }

    fn commit_mount(
        &mut self,
        instance: &mut Self::Instance,
        _ty: &Self::Type,
        _props: &Self::Props,
    ) -> HostResult<()> {
        self.instance_record(*instance);
        Ok(())
    }

    fn commit_update(
        &mut self,
        instance: &mut Self::Instance,
        update_payload: Self::UpdatePayload,
        _ty: &Self::Type,
        _old_props: &Self::Props,
        _new_props: &Self::Props,
    ) -> HostResult<()> {
        self.instance_record_mut(*instance).props = update_payload.props;
        Ok(())
    }

    fn commit_text_update(
        &mut self,
        text_instance: &mut Self::TextInstance,
        _old_text: &str,
        new_text: &str,
    ) -> HostResult<()> {
        self.text_record_mut(*text_instance).text = new_text.to_owned();
        Ok(())
    }

    fn reset_text_content(&mut self, instance: &mut Self::Instance) -> HostResult<()> {
        self.instance_record_mut(*instance).children.clear();
        Ok(())
    }

    fn hide_instance(&mut self, instance: &mut Self::Instance) -> HostResult<()> {
        self.instance_record_mut(*instance).hidden = true;
        Ok(())
    }

    fn unhide_instance(
        &mut self,
        instance: &mut Self::Instance,
        _props: &Self::Props,
    ) -> HostResult<()> {
        self.instance_record_mut(*instance).hidden = false;
        Ok(())
    }

    fn hide_text_instance(&mut self, text_instance: &mut Self::TextInstance) -> HostResult<()> {
        self.text_record_mut(*text_instance).hidden = true;
        Ok(())
    }

    fn unhide_text_instance(
        &mut self,
        text_instance: &mut Self::TextInstance,
        _text: &str,
    ) -> HostResult<()> {
        self.text_record_mut(*text_instance).hidden = false;
        Ok(())
    }

    fn detach_deleted_instance(&mut self, instance: Self::Instance) -> HostResult<()> {
        let record = self.instance_record_mut(instance);
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
        self.validate_child_handle(child);
        self.detach_child_from_all_parents(child);
        let parent = self.instance_record_mut(*parent);
        Self::append_child_handle(&mut parent.children, child);
        Ok(())
    }

    fn append_child_to_container(
        &mut self,
        container: &mut Self::Container,
        child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        let child = Self::host_child_to_handle(child);
        self.validate_child_handle(child);
        self.detach_child_from_all_parents(child);
        let container = self.container_record_mut(*container);
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
        self.validate_child_handle(child);
        self.validate_child_handle(before_child);
        if child != before_child {
            self.detach_child_from_all_parents(child);
        }
        let parent = self.instance_record_mut(*parent);
        Self::insert_child_handle_before(&mut parent.children, child, before_child);
        Ok(())
    }

    fn insert_in_container_before(
        &mut self,
        container: &mut Self::Container,
        child: HostChild<'_, Self>,
        before_child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        let child = Self::host_child_to_handle(child);
        let before_child = Self::host_child_to_handle(before_child);
        self.validate_child_handle(child);
        self.validate_child_handle(before_child);
        if child != before_child {
            self.detach_child_from_all_parents(child);
        }
        let container = self.container_record_mut(*container);
        Self::insert_child_handle_before(&mut container.children, child, before_child);
        Ok(())
    }

    fn remove_child(
        &mut self,
        parent: &mut Self::Instance,
        child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        let child = Self::host_child_to_handle(child);
        self.validate_child_handle(child);
        let parent = self.instance_record_mut(*parent);
        Self::remove_child_handle(&mut parent.children, child);
        Ok(())
    }

    fn remove_child_from_container(
        &mut self,
        container: &mut Self::Container,
        child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        let child = Self::host_child_to_handle(child);
        self.validate_child_handle(child);
        let container = self.container_record_mut(*container);
        Self::remove_child_handle(&mut container.children, child);
        Ok(())
    }

    fn clear_container(&mut self, container: &mut Self::Container) -> HostResult<()> {
        self.container_record_mut(*container).children.clear();
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use fast_react_host_config::{HostTreeUpdateMode, MutationRenderer};

    fn element_type(name: &str) -> TestElementType {
        TestElementType::new(name)
    }

    fn props() -> TestProps {
        TestProps::new()
    }

    fn create_instance(
        renderer: &mut TestRenderer,
        container: &TestContainer,
        name: &str,
    ) -> TestInstance {
        let context = renderer.root_host_context(container);
        renderer
            .create_instance(&element_type(name), &props(), container, &context)
            .unwrap()
    }

    fn create_text(
        renderer: &mut TestRenderer,
        container: &TestContainer,
        text: &str,
    ) -> TestTextInstance {
        let context = renderer.root_host_context(container);
        renderer
            .create_text_instance(text, container, &context)
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
        let context = renderer.root_host_context(&container);
        let child_context = renderer.child_host_context(&context, &element_type("View"), &props());
        let text_props = TestProps::with_text_content("inline");

        let instance = renderer
            .create_instance(
                &element_type("View"),
                &props().with_attribute("role", "main"),
                &container,
                &context,
            )
            .unwrap();
        let text = renderer
            .create_text_instance("hello", &container, &context)
            .unwrap();

        assert_eq!(context.depth(), 0);
        assert_eq!(child_context.depth(), 1);
        assert!(renderer.should_set_text_content(&element_type("Text"), &text_props, &context));
        assert_eq!(
            renderer
                .snapshot_instance(&instance)
                .element_type()
                .as_str(),
            "View"
        );
        assert_eq!(
            renderer.snapshot_instance(&instance).props().attributes()["role"],
            "main"
        );
        assert_eq!(renderer.snapshot_text(&text).text(), "hello");
        assert_eq!(renderer.get_public_instance(&instance), instance);
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
                &renderer.root_host_context(&container),
            )
            .unwrap();

        assert_eq!(finalization, InitialChildrenFinalization::NoCommitMount);
        assert_eq!(
            child_texts(&renderer.snapshot_instance(&parent)),
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

        let parent_snapshot = renderer.snapshot_instance(&parent);
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
            container_element_names(&renderer.snapshot_container(&container)),
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
            child_texts(&renderer.snapshot_instance(&parent)),
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
            container_element_names(&renderer.snapshot_container(&container)),
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
                .children()
                .is_empty()
        );

        renderer
            .append_child(&mut new_parent, HostChild::Text(&child))
            .unwrap();
        assert!(
            renderer
                .snapshot_container(&container)
                .children()
                .is_empty()
        );
        assert_eq!(
            child_texts(&renderer.snapshot_instance(&new_parent)),
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

        assert!(renderer.snapshot_instance(&parent).children().is_empty());
        assert!(
            renderer
                .snapshot_container(&container)
                .children()
                .is_empty()
        );
        assert_eq!(renderer.snapshot_text(&text).text(), "remove me");
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

        assert!(renderer.snapshot_instance(&instance).is_hidden());
        assert!(renderer.snapshot_text(&text).is_hidden());
        assert_eq!(
            renderer.snapshot_instance(&instance).props().attributes()["updated"],
            "yes"
        );
        assert_eq!(renderer.snapshot_text(&text).text(), "new");

        renderer.unhide_instance(&mut instance, &props()).unwrap();
        renderer.unhide_text_instance(&mut text, "new").unwrap();
        renderer.detach_deleted_instance(instance).unwrap();

        let snapshot = renderer.snapshot_instance(&instance);
        assert!(!snapshot.is_hidden());
        assert!(snapshot.is_detached());
        assert!(snapshot.children().is_empty());
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
            assert_eq!(error.renderer_name(), TEST_RENDERER_NAME);
            assert_eq!(error.capability(), capability);
        }

        let mut form = ();
        let error = renderer.reset_form_instance(&mut form).unwrap_err();
        assert_eq!(error.renderer_name(), TEST_RENDERER_NAME);
        assert_eq!(error.capability(), HostCapability::Forms);
    }
}
