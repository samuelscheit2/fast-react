use super::super::*;

const NESTED_HOST_OUTPUT_FIXTURE_BASE_RAW: u64 = 10_000;

impl TestRendererRoot {
    pub(super) fn push_host_output_fixture_for_canary(
        &mut self,
        element_type: TestElementType,
        text: String,
    ) -> RootElementHandle {
        self.push_host_output_fixture_with_props_for_canary(element_type, TestProps::new(), text)
    }

    pub(super) fn push_host_output_fixture_with_props_for_canary(
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

    pub(super) fn host_output_fixture(
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

    pub(super) fn push_nested_host_output_fixture_for_canary(
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

    pub(super) fn nested_host_output_fixture(
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

    pub(super) fn next_host_parent_placement_text_props_raw_for_canary(
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

    pub(super) fn next_sibling_text_props_raw_for_canary(
        &self,
        current: &TestRendererCurrentHostOutput,
    ) -> u64 {
        current
            .fixture
            .canary_fixture
            .text_props_raw()
            .saturating_add(self.renderer.texts.len() as u64)
            .saturating_add(2000)
    }

    pub(super) fn next_nested_host_parent_placement_text_props_raw_for_canary(
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

    pub(super) fn create_detached_host_output_for_canary(
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

    pub(super) fn create_detached_nested_host_output_for_canary(
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
}
