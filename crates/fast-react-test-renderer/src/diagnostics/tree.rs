use super::*;

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
    pub(crate) node_type: TestRendererPrivateTreeNodeType,
    pub(crate) element_type: TestElementType,
    pub(crate) props: BTreeMap<String, String>,
    pub(crate) instance_available: bool,
    pub(crate) rendered: Vec<TestRendererPrivateTreeRenderedRoot>,
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
    pub(crate) node_type: TestRendererPrivateTreeNodeType,
    pub(crate) component_type: &'static str,
    pub(crate) props: TestProps,
    pub(crate) instance_available: bool,
    pub(crate) rendered: Box<TestRendererPrivateTreeRenderedRoot>,
    pub(crate) wraps_committed_host_output: bool,
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
    pub(crate) fiber_tag: &'static str,
    pub(crate) delegates_to_child: bool,
    pub(crate) child_fiber_tag: &'static str,
    pub(crate) public_tree_object_available: bool,
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
    pub(crate) fiber_tag: &'static str,
    pub(crate) text: String,
    pub(crate) returns_text_value: bool,
    pub(crate) public_tree_object_available: bool,
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
    pub(crate) fiber_tag: &'static str,
    pub(crate) node_type: TestRendererPrivateTreeNodeType,
    pub(crate) element_type: TestElementType,
    pub(crate) props: TestProps,
    pub(crate) instance_available: bool,
    pub(crate) rendered_child_count: usize,
    pub(crate) rendered_text: String,
    pub(crate) public_tree_object_available: bool,
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
    pub(crate) fiber_tag: &'static str,
    pub(crate) node_type: TestRendererPrivateTreeNodeType,
    pub(crate) component_type: &'static str,
    pub(crate) props: TestProps,
    pub(crate) instance_available: bool,
    pub(crate) rendered_child_fiber_tag: &'static str,
    pub(crate) rendered_child_node_type: TestRendererPrivateTreeNodeType,
    pub(crate) rendered_child_count: usize,
    pub(crate) wraps_committed_host_output: bool,
    pub(crate) public_tree_object_available: bool,
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
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_json_diagnostic_name: &'static str,
    pub(crate) gate: TestRendererSerializationGateReport,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) accepted_fiber_shape: [&'static str; 3],
    pub(crate) accepted_composite_fiber_shape: [&'static str; 4],
    pub(crate) root_child_count: usize,
    pub(crate) host_root: TestRendererPrivateTreeHostRootDiagnostic,
    pub(crate) function_component: TestRendererPrivateTreeFunctionComponentDiagnostic,
    pub(crate) host_component: TestRendererPrivateTreeHostComponentDiagnostic,
    pub(crate) host_text: TestRendererPrivateTreeHostTextDiagnostic,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_tree_object_available: bool,
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
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_tree_diagnostic_name: &'static str,
    pub(crate) shape_name: &'static str,
    pub(crate) fiber_shape: Vec<String>,
    pub(crate) root_child_fiber_tags: Vec<String>,
    pub(crate) host_child_fiber_tags: Vec<String>,
    pub(crate) root_child_count: usize,
    pub(crate) host_child_count: usize,
    pub(crate) host_component_count: usize,
    pub(crate) host_text_count: usize,
    pub(crate) function_component_fiber_tag: Option<String>,
    pub(crate) function_component_present: bool,
    pub(crate) wraps_committed_host_output: bool,
    pub(crate) accepted_minimal_fiber_shape: [&'static str; 3],
    pub(crate) accepted_composite_fiber_shape: [&'static str; 4],
    pub(crate) accepted_multi_child_fiber_shape: [&'static str; 4],
    pub(crate) accepted_composite_multi_child_fiber_shape: [&'static str; 5],
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_tree_object_available: bool,
    pub(crate) compatibility_claimed: bool,
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
