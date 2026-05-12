use super::*;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestRendererHostOutputFixture {
    pub(crate) element: RootElementHandle,
    pub(crate) element_type: TestElementType,
    pub(crate) props: TestProps,
    pub(crate) text: String,
    pub(crate) canary_fixture: TestRendererHostOutputCanaryFixture,
}

impl TestRendererHostOutputFixture {
    pub(crate) fn new_with_props(
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
pub(crate) struct TestRendererCurrentHostOutput {
    pub(crate) fixture: TestRendererHostOutputFixture,
    pub(crate) fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) instance: TestInstance,
    pub(crate) text: TestTextInstance,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestRendererNestedHostOutputFixture {
    pub(crate) element: RootElementHandle,
    pub(crate) outer_element_type: TestElementType,
    pub(crate) outer_props: TestProps,
    pub(crate) inner_element_type: TestElementType,
    pub(crate) inner_props: TestProps,
    pub(crate) text: String,
    pub(crate) outer_canary_fixture: TestRendererHostOutputCanaryFixture,
    pub(crate) inner_canary_fixture: TestRendererHostOutputCanaryFixture,
}

impl TestRendererNestedHostOutputFixture {
    pub(crate) fn new(
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
pub(crate) struct TestRendererCurrentNestedHostOutput {
    pub(crate) fixture: TestRendererNestedHostOutputFixture,
    pub(crate) outer_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) inner_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) outer_instance: TestInstance,
    pub(crate) inner_instance: TestInstance,
    pub(crate) text: TestTextInstance,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestRendererPrivateJsonCurrentFibersForCanary {
    Host(TestRendererHostOutputCanaryCurrentFibers),
    Nested {
        outer: TestRendererHostOutputCanaryCurrentFibers,
        inner: TestRendererHostOutputCanaryCurrentFibers,
    },
    SiblingText {
        root_text: TestRendererFiberHandleDiagnostics,
        root_text_props_raw: u64,
        component: TestRendererHostOutputCanaryCurrentFibers,
    },
}
