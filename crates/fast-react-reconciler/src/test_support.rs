#![cfg(test)]

use std::cell::RefCell;

use fast_react_host_config::{
    HostCapability, HostCapabilitySet, HostChild, HostCommit, HostCreation, HostFiberTokenRef,
    HostIdentityAndContext, HostMicrotaskCallback, HostPostPaintCallback, HostResult,
    HostScheduling, HostTimeoutCallback, HostTypes, InitialChildrenFinalization, MutationHost,
};

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

#[derive(Debug, Default)]
pub struct RecordingHost {
    operations: RefCell<Vec<&'static str>>,
}

impl RecordingHost {
    fn record(&self, operation: &'static str) {
        self.operations.borrow_mut().push(operation);
    }

    #[must_use]
    pub fn operations(&self) -> Vec<&'static str> {
        self.operations.borrow().clone()
    }
}

impl HostTypes for RecordingHost {
    type HostFiberToken = FakeHostFiberToken;
    type Type = &'static str;
    type Props = ();
    type Container = FakeContainer;
    type Instance = ();
    type TextInstance = ();
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
        _token: HostFiberTokenRef<'_, Self>,
        _ty: &Self::Type,
        _props: &Self::Props,
        _container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<Self::Instance> {
        self.record("create_instance");
        Ok(())
    }

    fn create_text_instance(
        &mut self,
        _token: HostFiberTokenRef<'_, Self>,
        _text: &str,
        _container: &Self::Container,
        _context: &Self::HostContext,
    ) -> HostResult<Self::TextInstance> {
        self.record("create_text_instance");
        Ok(())
    }

    fn append_initial_child(
        &mut self,
        _parent: &mut Self::Instance,
        _child: HostChild<'_, Self>,
    ) -> HostResult<()> {
        self.record("append_initial_child");
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
        _instance: &Self::Instance,
        _update_payload: Option<&Self::UpdatePayload>,
    ) -> HostResult<Self::Instance> {
        self.record("clone_mutable_instance");
        Ok(())
    }

    fn clone_mutable_text_instance(
        &mut self,
        _text_instance: &Self::TextInstance,
    ) -> HostResult<Self::TextInstance> {
        self.record("clone_mutable_text_instance");
        Ok(())
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
