use super::super::*;

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
}
