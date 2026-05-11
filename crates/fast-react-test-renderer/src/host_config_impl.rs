use super::*;

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
