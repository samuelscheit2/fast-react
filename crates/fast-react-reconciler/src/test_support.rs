#![cfg(test)]

use std::cell::RefCell;

use fast_react_core::{ElementTypeHandle, PropsHandle};
use fast_react_host_config::{
    HostCapability, HostCapabilitySet, HostChild, HostCommit, HostCreation, HostFiberTokenRef,
    HostHandleKind, HostIdentityAndContext, HostMicrotaskCallback, HostOperationError,
    HostPostPaintCallback, HostResult, HostScheduling, HostTimeoutCallback, HostTypes,
    InitialChildrenFinalization, MutationHost,
};

use crate::RootElementHandle;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FakeContainer {
    id: u64,
}

impl FakeContainer {
    #[must_use]
    pub const fn new(id: u64) -> Self {
        Self { id }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FakeHostFiberToken(pub u64);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FakeHostChild {
    Instance(u64),
    Text(u64),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FakeInstance {
    id: u64,
    ty: &'static str,
    token: FakeHostFiberToken,
    children: Vec<FakeHostChild>,
}

impl FakeInstance {
    #[must_use]
    pub const fn id(&self) -> u64 {
        self.id
    }

    #[must_use]
    pub const fn ty(&self) -> &'static str {
        self.ty
    }

    #[must_use]
    pub const fn token(&self) -> FakeHostFiberToken {
        self.token
    }

    #[must_use]
    pub fn children(&self) -> &[FakeHostChild] {
        &self.children
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FakeTextInstance {
    id: u64,
    text: String,
    token: FakeHostFiberToken,
}

impl FakeTextInstance {
    #[must_use]
    pub const fn id(&self) -> u64 {
        self.id
    }

    #[must_use]
    pub fn text(&self) -> &str {
        &self.text
    }

    #[must_use]
    pub const fn token(&self) -> FakeHostFiberToken {
        self.token
    }
}

#[derive(Debug)]
pub struct RecordingHost {
    operations: RefCell<Vec<&'static str>>,
    next_instance_id: u64,
    next_text_id: u64,
    fail_append_child_to_container: bool,
}

impl RecordingHost {
    fn record(&self, operation: &'static str) {
        self.operations.borrow_mut().push(operation);
    }

    #[must_use]
    pub fn operations(&self) -> Vec<&'static str> {
        self.operations.borrow().clone()
    }

    pub fn fail_append_child_to_container(&mut self) {
        self.fail_append_child_to_container = true;
    }
}

impl Default for RecordingHost {
    fn default() -> Self {
        Self {
            operations: RefCell::new(Vec::new()),
            next_instance_id: 1,
            next_text_id: 1,
            fail_append_child_to_container: false,
        }
    }
}

impl HostTypes for RecordingHost {
    type HostFiberToken = FakeHostFiberToken;
    type Type = &'static str;
    type Props = ();
    type Container = FakeContainer;
    type Instance = FakeInstance;
    type TextInstance = FakeTextInstance;
    type PublicInstance = ();
    type HostContext = ();
    type UpdatePayload = ();
    type TimeoutHandle = u64;
    type NoTimeout = ();
    type CommitState = ();
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

impl HostIdentityAndContext for RecordingHost {
    fn renderer_name(&self) -> &'static str {
        "recording-root-model-test-host"
    }

    fn capabilities(&self) -> HostCapabilitySet {
        HostCapabilitySet::empty().with(HostCapability::Mutation)
    }

    fn get_public_instance(&self, _instance: &Self::Instance) -> HostResult<Self::PublicInstance> {
        self.record("get_public_instance");
        Ok(())
    }

    fn root_host_context(&self, _container: &Self::Container) -> HostResult<Self::HostContext> {
        self.record("root_host_context");
        Ok(())
    }

    fn child_host_context(
        &self,
        _parent_context: &Self::HostContext,
        _ty: &Self::Type,
        _props: &Self::Props,
    ) -> HostResult<Self::HostContext> {
        self.record("child_host_context");
        Ok(())
    }
}

impl HostCreation for RecordingHost {
    fn should_set_text_content(
        &self,
        _ty: &Self::Type,
        _props: &Self::Props,
        _context: &Self::HostContext,
    ) -> bool {
        self.record("should_set_text_content");
        false
    }

    fn create_instance(
        &mut self,
        token: HostFiberTokenRef<'_, Self>,
        ty: &Self::Type,
        _props: &Self::Props,
        _container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<Self::Instance> {
        self.record("create_instance");
        let id = self.next_instance_id;
        self.next_instance_id += 1;
        Ok(FakeInstance {
            id,
            ty,
            token: *token.token(),
            children: Vec::new(),
        })
    }

    fn create_text_instance(
        &mut self,
        token: HostFiberTokenRef<'_, Self>,
        text: &str,
        _container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<Self::TextInstance> {
        self.record("create_text_instance");
        let id = self.next_text_id;
        self.next_text_id += 1;
        Ok(FakeTextInstance {
            id,
            text: text.to_owned(),
            token: *token.token(),
        })
    }

    fn append_initial_child(
        &mut self,
        parent: &mut Self::Instance,
        child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.record("append_initial_child");
        let child = match child {
            HostChild::Instance(instance) => FakeHostChild::Instance(instance.id()),
            HostChild::Text(text) => FakeHostChild::Text(text.id()),
        };
        parent.children.push(child);
        Ok(())
    }

    fn finalize_initial_children(
        &mut self,
        _instance: &mut Self::Instance,
        _ty: &Self::Type,
        _props: &Self::Props,
        _container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<InitialChildrenFinalization> {
        self.record("finalize_initial_children");
        Ok(InitialChildrenFinalization::NoCommitMount)
    }

    fn clone_mutable_instance(
        &mut self,
        instance: &Self::Instance,
        _update_payload: Option<&Self::UpdatePayload>,
    ) -> HostResult<Self::Instance> {
        self.record("clone_mutable_instance");
        Ok(instance.clone())
    }

    fn clone_mutable_text_instance(
        &mut self,
        text_instance: &Self::TextInstance,
    ) -> HostResult<Self::TextInstance> {
        self.record("clone_mutable_text_instance");
        Ok(text_instance.clone())
    }
}

impl HostCommit for RecordingHost {
    fn prepare_for_commit(
        &mut self,
        _container: &Self::Container,
    ) -> HostResult<Self::CommitState> {
        self.record("prepare_for_commit");
        Ok(())
    }

    fn reset_after_commit(
        &mut self,
        _container: &Self::Container,
        _commit_state: Self::CommitState,
    ) -> HostResult<()> {
        self.record("reset_after_commit");
        Ok(())
    }

    fn commit_mount(
        &mut self,
        _token: HostFiberTokenRef<'_, Self>,
        _instance: &mut Self::Instance,
        _ty: &Self::Type,
        _props: &Self::Props,
    ) -> HostResult<()> {
        self.record("commit_mount");
        Ok(())
    }

    fn commit_update(
        &mut self,
        _token: HostFiberTokenRef<'_, Self>,
        _instance: &mut Self::Instance,
        _update_payload: Self::UpdatePayload,
        _ty: &Self::Type,
        _old_props: &Self::Props,
        _new_props: &Self::Props,
    ) -> HostResult<()> {
        self.record("commit_update");
        Ok(())
    }

    fn commit_text_update(
        &mut self,
        _text_instance: &mut Self::TextInstance,
        _old_text: &str,
        _new_text: &str,
    ) -> HostResult<()> {
        self.record("commit_text_update");
        Ok(())
    }

    fn reset_text_content(&mut self, _instance: &mut Self::Instance) -> HostResult<()> {
        self.record("reset_text_content");
        Ok(())
    }

    fn hide_instance(&mut self, _instance: &mut Self::Instance) -> HostResult<()> {
        self.record("hide_instance");
        Ok(())
    }

    fn unhide_instance(
        &mut self,
        _instance: &mut Self::Instance,
        _props: &Self::Props,
    ) -> HostResult<()> {
        self.record("unhide_instance");
        Ok(())
    }

    fn hide_text_instance(&mut self, _text_instance: &mut Self::TextInstance) -> HostResult<()> {
        self.record("hide_text_instance");
        Ok(())
    }

    fn unhide_text_instance(
        &mut self,
        _text_instance: &mut Self::TextInstance,
        _text: &str,
    ) -> HostResult<()> {
        self.record("unhide_text_instance");
        Ok(())
    }

    fn detach_deleted_instance(
        &mut self,
        _token: HostFiberTokenRef<'_, Self>,
        _instance: Self::Instance,
    ) -> HostResult<()> {
        self.record("detach_deleted_instance");
        Ok(())
    }
}

impl HostScheduling for RecordingHost {
    fn schedule_timeout(
        &mut self,
        _callback: HostTimeoutCallback,
        _delay_ms: u64,
    ) -> HostResult<Self::TimeoutHandle> {
        self.record("schedule_timeout");
        Ok(1)
    }

    fn cancel_timeout(&mut self, _handle: Self::TimeoutHandle) -> HostResult<()> {
        self.record("cancel_timeout");
        Ok(())
    }

    fn no_timeout(&self) -> Self::NoTimeout {
        self.record("no_timeout");
    }

    fn set_current_update_priority(&mut self, _priority: Self::EventPriority) {
        self.record("set_current_update_priority");
    }

    fn current_update_priority(&self) -> Self::EventPriority {
        self.record("current_update_priority");
    }

    fn resolve_update_priority(&self) -> Self::EventPriority {
        self.record("resolve_update_priority");
    }

    fn resolve_event_type(&self) -> Option<Self::EventType> {
        self.record("resolve_event_type");
        None
    }

    fn resolve_event_timestamp(&self) -> Option<Self::EventTimestamp> {
        self.record("resolve_event_timestamp");
        None
    }

    fn schedule_microtask(&mut self, _callback: HostMicrotaskCallback) -> HostResult<()> {
        self.record("schedule_microtask");
        Ok(())
    }

    fn request_post_paint_callback(&mut self, _callback: HostPostPaintCallback) -> HostResult<()> {
        self.record("request_post_paint_callback");
        Ok(())
    }
}

impl MutationHost for RecordingHost {
    fn append_child(
        &mut self,
        _parent: &mut Self::Instance,
        _child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.record("append_child");
        Ok(())
    }

    fn append_child_to_container(
        &mut self,
        _container: &mut Self::Container,
        _child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.record("append_child_to_container");
        if self.fail_append_child_to_container {
            return Err(HostOperationError::invalid_handle(
                self.renderer_name(),
                HostHandleKind::Container,
            )
            .into());
        }
        Ok(())
    }

    fn insert_before(
        &mut self,
        _parent: &mut Self::Instance,
        _child: HostChild<'_, Self>,
        _before_child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.record("insert_before");
        Ok(())
    }

    fn insert_in_container_before(
        &mut self,
        _container: &mut Self::Container,
        _child: HostChild<'_, Self>,
        _before_child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.record("insert_in_container_before");
        Ok(())
    }

    fn remove_child(
        &mut self,
        _parent: &mut Self::Instance,
        _child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.record("remove_child");
        Ok(())
    }

    fn remove_child_from_container(
        &mut self,
        _container: &mut Self::Container,
        _child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.record("remove_child_from_container");
        Ok(())
    }

    fn clear_container(&mut self, _container: &mut Self::Container) -> HostResult<()> {
        self.record("clear_container");
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct HtmlLikeContainer {
    children: Vec<HtmlLikeNode>,
}

impl HtmlLikeContainer {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn serialize(&self) -> String {
        let mut output = String::new();
        for child in &self.children {
            child.serialize_into(&mut output);
        }
        output
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HtmlLikeElement {
    ty: &'static str,
    children: Vec<HtmlLikeNode>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HtmlLikeText {
    text: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum HtmlLikeNode {
    Element(HtmlLikeElement),
    Text(HtmlLikeText),
}

impl HtmlLikeNode {
    fn serialize_into(&self, output: &mut String) {
        match self {
            Self::Element(element) => {
                output.push('<');
                output.push_str(element.ty);
                output.push('>');
                for child in &element.children {
                    child.serialize_into(output);
                }
                output.push_str("</");
                output.push_str(element.ty);
                output.push('>');
            }
            Self::Text(text) => output.push_str(&text.text),
        }
    }
}

#[derive(Debug, Default)]
pub struct HtmlLikeHost {
    operations: Vec<&'static str>,
}

impl HtmlLikeHost {
    #[must_use]
    pub fn operations(&self) -> &[&'static str] {
        &self.operations
    }

    fn record(&mut self, operation: &'static str) {
        self.operations.push(operation);
    }

    fn reject_unexpected_mutation<T>(&self, handle: HostHandleKind) -> HostResult<T> {
        Err(HostOperationError::invalid_handle(self.renderer_name(), handle).into())
    }
}

impl HostTypes for HtmlLikeHost {
    type HostFiberToken = FakeHostFiberToken;
    type Type = &'static str;
    type Props = ();
    type Container = HtmlLikeContainer;
    type Instance = HtmlLikeElement;
    type TextInstance = HtmlLikeText;
    type PublicInstance = ();
    type HostContext = ();
    type UpdatePayload = ();
    type TimeoutHandle = u64;
    type NoTimeout = ();
    type CommitState = ();
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

impl HostIdentityAndContext for HtmlLikeHost {
    fn renderer_name(&self) -> &'static str {
        "html-like-root-model-test-host"
    }

    fn capabilities(&self) -> HostCapabilitySet {
        HostCapabilitySet::empty().with(HostCapability::Mutation)
    }

    fn get_public_instance(&self, _instance: &Self::Instance) -> HostResult<Self::PublicInstance> {
        Ok(())
    }

    fn root_host_context(&self, _container: &Self::Container) -> HostResult<Self::HostContext> {
        Ok(())
    }

    fn child_host_context(
        &self,
        _parent_context: &Self::HostContext,
        _ty: &Self::Type,
        _props: &Self::Props,
    ) -> HostResult<Self::HostContext> {
        Ok(())
    }
}

impl HostCreation for HtmlLikeHost {
    fn should_set_text_content(
        &self,
        _ty: &Self::Type,
        _props: &Self::Props,
        _context: &Self::HostContext,
    ) -> bool {
        false
    }

    fn create_instance(
        &mut self,
        _token: HostFiberTokenRef<'_, Self>,
        ty: &Self::Type,
        _props: &Self::Props,
        _container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<Self::Instance> {
        Ok(HtmlLikeElement {
            ty: *ty,
            children: Vec::new(),
        })
    }

    fn create_text_instance(
        &mut self,
        _token: HostFiberTokenRef<'_, Self>,
        text: &str,
        _container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<Self::TextInstance> {
        Ok(HtmlLikeText {
            text: text.to_owned(),
        })
    }

    fn append_initial_child(
        &mut self,
        parent: &mut Self::Instance,
        child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        parent.children.push(html_like_node_from_child(child));
        Ok(())
    }

    fn finalize_initial_children(
        &mut self,
        _instance: &mut Self::Instance,
        _ty: &Self::Type,
        _props: &Self::Props,
        _container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<InitialChildrenFinalization> {
        Ok(InitialChildrenFinalization::NoCommitMount)
    }

    fn clone_mutable_instance(
        &mut self,
        instance: &Self::Instance,
        _update_payload: Option<&Self::UpdatePayload>,
    ) -> HostResult<Self::Instance> {
        Ok(instance.clone())
    }

    fn clone_mutable_text_instance(
        &mut self,
        text_instance: &Self::TextInstance,
    ) -> HostResult<Self::TextInstance> {
        Ok(text_instance.clone())
    }
}

impl HostCommit for HtmlLikeHost {
    fn prepare_for_commit(
        &mut self,
        _container: &Self::Container,
    ) -> HostResult<Self::CommitState> {
        self.record("prepare");
        Ok(())
    }

    fn reset_after_commit(
        &mut self,
        _container: &Self::Container,
        _commit_state: Self::CommitState,
    ) -> HostResult<()> {
        self.record("reset");
        Ok(())
    }

    fn commit_mount(
        &mut self,
        _token: HostFiberTokenRef<'_, Self>,
        _instance: &mut Self::Instance,
        _ty: &Self::Type,
        _props: &Self::Props,
    ) -> HostResult<()> {
        Ok(())
    }

    fn commit_update(
        &mut self,
        _token: HostFiberTokenRef<'_, Self>,
        _instance: &mut Self::Instance,
        _update_payload: Self::UpdatePayload,
        _ty: &Self::Type,
        _old_props: &Self::Props,
        _new_props: &Self::Props,
    ) -> HostResult<()> {
        Ok(())
    }

    fn commit_text_update(
        &mut self,
        _text_instance: &mut Self::TextInstance,
        _old_text: &str,
        _new_text: &str,
    ) -> HostResult<()> {
        Ok(())
    }

    fn reset_text_content(&mut self, _instance: &mut Self::Instance) -> HostResult<()> {
        Ok(())
    }

    fn hide_instance(&mut self, _instance: &mut Self::Instance) -> HostResult<()> {
        Ok(())
    }

    fn unhide_instance(
        &mut self,
        _instance: &mut Self::Instance,
        _props: &Self::Props,
    ) -> HostResult<()> {
        Ok(())
    }

    fn hide_text_instance(&mut self, _text_instance: &mut Self::TextInstance) -> HostResult<()> {
        Ok(())
    }

    fn unhide_text_instance(
        &mut self,
        _text_instance: &mut Self::TextInstance,
        _text: &str,
    ) -> HostResult<()> {
        Ok(())
    }

    fn detach_deleted_instance(
        &mut self,
        _token: HostFiberTokenRef<'_, Self>,
        _instance: Self::Instance,
    ) -> HostResult<()> {
        Ok(())
    }
}

impl MutationHost for HtmlLikeHost {
    fn append_child(
        &mut self,
        _parent: &mut Self::Instance,
        _child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.reject_unexpected_mutation(HostHandleKind::Instance)
    }

    fn append_child_to_container(
        &mut self,
        container: &mut Self::Container,
        child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.record("append-to-container");
        container.children.push(html_like_node_from_child(child));
        Ok(())
    }

    fn insert_before(
        &mut self,
        _parent: &mut Self::Instance,
        _child: HostChild<'_, Self>,
        _before_child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.reject_unexpected_mutation(HostHandleKind::Instance)
    }

    fn insert_in_container_before(
        &mut self,
        _container: &mut Self::Container,
        _child: HostChild<'_, Self>,
        _before_child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.reject_unexpected_mutation(HostHandleKind::Container)
    }

    fn remove_child(
        &mut self,
        _parent: &mut Self::Instance,
        _child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.reject_unexpected_mutation(HostHandleKind::Instance)
    }

    fn remove_child_from_container(
        &mut self,
        _container: &mut Self::Container,
        _child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.reject_unexpected_mutation(HostHandleKind::Container)
    }

    fn clear_container(&mut self, _container: &mut Self::Container) -> HostResult<()> {
        self.reject_unexpected_mutation(HostHandleKind::Container)
    }
}

fn html_like_node_from_child(child: HostChild<'_, HtmlLikeHost>) -> HtmlLikeNode {
    match child {
        HostChild::Instance(instance) => HtmlLikeNode::Element(instance.clone()),
        HostChild::Text(text) => HtmlLikeNode::Text(text.clone()),
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestHostNode {
    Element(TestHostElement),
    Text(TestHostText),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestHostElement {
    ty: &'static str,
    element_type: ElementTypeHandle,
    props: PropsHandle,
    children: Vec<TestHostNode>,
}

impl TestHostElement {
    #[must_use]
    pub const fn ty(&self) -> &'static str {
        self.ty
    }

    #[must_use]
    pub const fn element_type(&self) -> ElementTypeHandle {
        self.element_type
    }

    #[must_use]
    pub const fn props(&self) -> PropsHandle {
        self.props
    }

    #[must_use]
    pub fn children(&self) -> &[TestHostNode] {
        &self.children
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestHostText {
    text: String,
    props: PropsHandle,
}

impl TestHostText {
    #[must_use]
    pub fn text(&self) -> &str {
        &self.text
    }

    #[must_use]
    pub const fn props(&self) -> PropsHandle {
        self.props
    }
}

#[derive(Debug, Clone)]
pub struct TestHostTree {
    roots: Vec<TestHostNode>,
    next_element_type: u64,
    next_props: u64,
}

impl TestHostTree {
    #[must_use]
    pub fn new() -> Self {
        Self {
            roots: Vec::new(),
            next_element_type: 1,
            next_props: 1,
        }
    }

    pub fn insert_host_element_with_text(
        &mut self,
        ty: &'static str,
        text: impl Into<String>,
    ) -> RootElementHandle {
        let text = self.text_node(text);
        let element_type = self.reserve_element_type();
        let props = self.reserve_props();
        self.insert_root(TestHostNode::Element(TestHostElement {
            ty,
            element_type,
            props,
            children: vec![text],
        }))
    }

    pub fn insert_text(&mut self, text: impl Into<String>) -> RootElementHandle {
        let text = self.text_node(text);
        self.insert_root(text)
    }

    pub fn root(&self, handle: RootElementHandle) -> Option<&TestHostNode> {
        if handle.is_none() {
            return None;
        }

        self.roots.get((handle.raw() - 1) as usize)
    }

    fn insert_root(&mut self, node: TestHostNode) -> RootElementHandle {
        let handle = RootElementHandle::from_raw(self.roots.len() as u64 + 1);
        self.roots.push(node);
        handle
    }

    fn text_node(&mut self, text: impl Into<String>) -> TestHostNode {
        TestHostNode::Text(TestHostText {
            text: text.into(),
            props: self.reserve_props(),
        })
    }

    fn reserve_element_type(&mut self) -> ElementTypeHandle {
        let handle = ElementTypeHandle::from_raw(self.next_element_type);
        self.next_element_type += 1;
        handle
    }

    fn reserve_props(&mut self) -> PropsHandle {
        let handle = PropsHandle::from_raw(self.next_props);
        self.next_props += 1;
        handle
    }
}

impl Default for TestHostTree {
    fn default() -> Self {
        Self::new()
    }
}
