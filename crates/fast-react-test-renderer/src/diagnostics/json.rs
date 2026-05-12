use super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateJsonNodeKind {
    RootArray,
    HostComponent,
    Text,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateJsonPublicSurfaceBlockers {
    pub(crate) json_method_blocked: bool,
    pub(crate) tree_method_blocked: bool,
    pub(crate) instance_wrapper_blocked: bool,
    pub(crate) js_facade_routing_blocked: bool,
    pub(crate) public_act_blocked: bool,
    pub(crate) compatibility_claim_blocked: bool,
}

impl TestRendererPrivateJsonPublicSurfaceBlockers {
    #[must_use]
    pub const fn blocked() -> Self {
        Self {
            json_method_blocked: true,
            tree_method_blocked: true,
            instance_wrapper_blocked: true,
            js_facade_routing_blocked: true,
            public_act_blocked: true,
            compatibility_claim_blocked: true,
        }
    }

    #[must_use]
    pub const fn json_method_blocked(self) -> bool {
        self.json_method_blocked
    }

    #[must_use]
    pub const fn tree_method_blocked(self) -> bool {
        self.tree_method_blocked
    }

    #[must_use]
    pub const fn instance_wrapper_blocked(self) -> bool {
        self.instance_wrapper_blocked
    }

    #[must_use]
    pub const fn js_facade_routing_blocked(self) -> bool {
        self.js_facade_routing_blocked
    }

    #[must_use]
    pub const fn public_act_blocked(self) -> bool {
        self.public_act_blocked
    }

    #[must_use]
    pub const fn compatibility_claim_blocked(self) -> bool {
        self.compatibility_claim_blocked
    }

    #[must_use]
    pub const fn all_blocked(self) -> bool {
        self.json_method_blocked
            && self.tree_method_blocked
            && self.instance_wrapper_blocked
            && self.js_facade_routing_blocked
            && self.public_act_blocked
            && self.compatibility_claim_blocked
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonHostOutputDependencyDiagnostics {
    pub(crate) route_row_id: &'static str,
    pub(crate) serialization_row_id: &'static str,
    pub(crate) route_diagnostics_available: bool,
    pub(crate) serialization_diagnostics_available: bool,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonHostOutputDependencyDiagnostics {
    #[must_use]
    pub const fn route_row_id(self) -> &'static str {
        self.route_row_id
    }

    #[must_use]
    pub const fn serialization_row_id(self) -> &'static str {
        self.serialization_row_id
    }

    #[must_use]
    pub const fn route_diagnostics_available(self) -> bool {
        self.route_diagnostics_available
    }

    #[must_use]
    pub const fn serialization_diagnostics_available(self) -> bool {
        self.serialization_diagnostics_available
    }

    #[must_use]
    pub const fn host_output_snapshot_current(self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub const fn public_surfaces_blocked(self) -> bool {
        !self.public_to_json_available
            && !self.public_test_instance_available
            && !self.native_execution_available
            && !self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateToJsonHostOutputShape {
    EmptyRoot,
    SingleHostText,
    MultiChildHostText,
    NestedHostText,
    SiblingText,
}

impl TestRendererPrivateToJsonHostOutputShape {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::EmptyRoot => "EmptyRoot",
            Self::SingleHostText => "SingleHostText",
            Self::MultiChildHostText => "MultiChildHostText",
            Self::NestedHostText => "NestedHostText",
            Self::SiblingText => "SiblingText",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonHostOutputShapeDiagnostics {
    pub(crate) shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_component_count: usize,
    pub(crate) host_text_count: usize,
    pub(crate) root_text_count: usize,
    pub(crate) max_host_component_depth: usize,
}

impl TestRendererPrivateToJsonHostOutputShapeDiagnostics {
    #[must_use]
    pub const fn shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.shape
    }

    #[must_use]
    pub const fn host_component_count(self) -> usize {
        self.host_component_count
    }

    #[must_use]
    pub const fn host_text_count(self) -> usize {
        self.host_text_count
    }

    #[must_use]
    pub const fn root_text_count(self) -> usize {
        self.root_text_count
    }

    #[must_use]
    pub const fn max_host_component_depth(self) -> usize {
        self.max_host_component_depth
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateRootLifecycleExecutionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) scheduled_update_sequence: usize,
    pub(crate) lifecycle: TestRendererRootLifecycle,
    pub(crate) scheduled_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) previous_snapshot: Option<TestContainerSnapshot>,
    pub(crate) snapshot: TestContainerSnapshot,
    pub(crate) executed_element_type: Option<TestElementType>,
    pub(crate) executed_props: Option<TestProps>,
    pub(crate) executed_text: Option<String>,
    pub(crate) detached_instance_snapshot: Option<TestElementSnapshot>,
    pub(crate) root_child_count: usize,
    pub(crate) previous_root_child_count: usize,
    pub(crate) host_component_count: usize,
    pub(crate) host_text_count: usize,
    pub(crate) host_node_cleanup_count: usize,
    pub(crate) host_update_apply_count: usize,
    pub(crate) source_renderer_owner_accepted: bool,
    pub(crate) source_lifecycle_row_accepted: bool,
    pub(crate) source_reconciler_host_execution_consumed: bool,
    pub(crate) snapshot_produced_from_executed_state: bool,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) public_root_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) public_act_available: bool,
    pub(crate) public_scheduler_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) js_package_available: bool,
    pub(crate) compatibility_claimed: bool,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
}

impl TestRendererPrivateRootLifecycleExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(&self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(&self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(&self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn scheduled_update_sequence(&self) -> usize {
        self.scheduled_update_sequence
    }

    #[must_use]
    pub const fn lifecycle(&self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn scheduled_update_kind(&self) -> TestRendererRootUpdateKind {
        self.scheduled_update_kind
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
    pub fn previous_snapshot(&self) -> Option<&TestContainerSnapshot> {
        self.previous_snapshot.as_ref()
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub fn executed_element_type(&self) -> Option<&TestElementType> {
        self.executed_element_type.as_ref()
    }

    #[must_use]
    pub fn executed_props(&self) -> Option<&TestProps> {
        self.executed_props.as_ref()
    }

    #[must_use]
    pub fn executed_text(&self) -> Option<&str> {
        self.executed_text.as_deref()
    }

    #[must_use]
    pub fn detached_instance_snapshot(&self) -> Option<&TestElementSnapshot> {
        self.detached_instance_snapshot.as_ref()
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn previous_root_child_count(&self) -> usize {
        self.previous_root_child_count
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
    pub const fn host_node_cleanup_count(&self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub const fn host_update_apply_count(&self) -> usize {
        self.host_update_apply_count
    }

    #[must_use]
    pub const fn source_renderer_owner_accepted(&self) -> bool {
        self.source_renderer_owner_accepted
    }

    #[must_use]
    pub const fn source_lifecycle_row_accepted(&self) -> bool {
        self.source_lifecycle_row_accepted
    }

    #[must_use]
    pub const fn source_reconciler_host_execution_consumed(&self) -> bool {
        self.source_reconciler_host_execution_consumed
    }

    #[must_use]
    pub const fn snapshot_produced_from_executed_state(&self) -> bool {
        self.snapshot_produced_from_executed_state
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn source_owned_execution_accepted(&self) -> bool {
        self.source_renderer_owner_accepted
            && self.source_lifecycle_row_accepted
            && self.source_reconciler_host_execution_consumed
            && self.snapshot_produced_from_executed_state
            && self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn public_root_available(&self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_test_instance_available(&self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn public_act_available(&self) -> bool {
        self.public_act_available
    }

    #[must_use]
    pub const fn public_scheduler_available(&self) -> bool {
        self.public_scheduler_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn js_package_available(&self) -> bool {
        self.js_package_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_surfaces_blocked(&self) -> bool {
        !self.public_root_available
            && !self.public_serialization_available
            && !self.public_test_instance_available
            && !self.public_act_available
            && !self.public_scheduler_available
            && !self.native_bridge_available
            && !self.native_execution_available
            && !self.js_package_available
            && !self.compatibility_claimed
            && self.public_blockers.all_blocked()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonHostOutputRow {
    pub(crate) id: &'static str,
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) previous_root_child_count: usize,
    pub(crate) current_root_child_count: usize,
    pub(crate) previous_host_component_count: usize,
    pub(crate) current_host_component_count: usize,
    pub(crate) previous_host_text_count: usize,
    pub(crate) current_host_text_count: usize,
    pub(crate) current_root_text_count: usize,
    pub(crate) current_max_host_component_depth: usize,
    pub(crate) dependency_diagnostics: TestRendererPrivateToJsonHostOutputDependencyDiagnostics,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
}

impl TestRendererPrivateToJsonHostOutputRow {
    #[must_use]
    pub const fn id(self) -> &'static str {
        self.id
    }

    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn previous_root_child_count(self) -> usize {
        self.previous_root_child_count
    }

    #[must_use]
    pub const fn current_root_child_count(self) -> usize {
        self.current_root_child_count
    }

    #[must_use]
    pub const fn previous_host_component_count(self) -> usize {
        self.previous_host_component_count
    }

    #[must_use]
    pub const fn current_host_component_count(self) -> usize {
        self.current_host_component_count
    }

    #[must_use]
    pub const fn previous_host_text_count(self) -> usize {
        self.previous_host_text_count
    }

    #[must_use]
    pub const fn current_host_text_count(self) -> usize {
        self.current_host_text_count
    }

    #[must_use]
    pub const fn current_root_text_count(self) -> usize {
        self.current_root_text_count
    }

    #[must_use]
    pub const fn current_max_host_component_depth(self) -> usize {
        self.current_max_host_component_depth
    }

    #[must_use]
    pub const fn dependency_diagnostics(
        self,
    ) -> TestRendererPrivateToJsonHostOutputDependencyDiagnostics {
        self.dependency_diagnostics
    }

    #[must_use]
    pub const fn public_blockers(self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateJsonFiberDiagnostic {
    pub(crate) fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) parent: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) child: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) sibling: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) index: usize,
    pub(crate) alternate: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) pending_props_raw: u64,
    pub(crate) memoized_props_raw: u64,
    pub(crate) lanes_bits: u32,
    pub(crate) child_lanes_bits: u32,
    pub(crate) flags_bits: u32,
    pub(crate) subtree_flags_bits: u32,
    pub(crate) state_node_present: bool,
}

impl TestRendererPrivateJsonFiberDiagnostic {
    #[must_use]
    pub const fn fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.fiber
    }

    #[must_use]
    pub const fn parent(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.parent
    }

    #[must_use]
    pub const fn child(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.child
    }

    #[must_use]
    pub const fn sibling(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.sibling
    }

    #[must_use]
    pub const fn index(self) -> usize {
        self.index
    }

    #[must_use]
    pub const fn alternate(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.alternate
    }

    #[must_use]
    pub const fn pending_props_raw(self) -> u64 {
        self.pending_props_raw
    }

    #[must_use]
    pub const fn memoized_props_raw(self) -> u64 {
        self.memoized_props_raw
    }

    #[must_use]
    pub const fn lanes_bits(self) -> u32 {
        self.lanes_bits
    }

    #[must_use]
    pub const fn child_lanes_bits(self) -> u32 {
        self.child_lanes_bits
    }

    #[must_use]
    pub const fn flags_bits(self) -> u32 {
        self.flags_bits
    }

    #[must_use]
    pub const fn subtree_flags_bits(self) -> u32 {
        self.subtree_flags_bits
    }

    #[must_use]
    pub const fn state_node_present(self) -> bool {
        self.state_node_present
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonNodeDiagnostic {
    pub(crate) ordinal: usize,
    pub(crate) node_kind: TestRendererPrivateJsonNodeKind,
    pub(crate) parent_ordinal: Option<usize>,
    pub(crate) child_ordinals: Vec<usize>,
    pub(crate) fiber: TestRendererPrivateJsonFiberDiagnostic,
    pub(crate) element_type: Option<TestElementType>,
    pub(crate) props: Option<TestProps>,
    pub(crate) text: Option<String>,
    pub(crate) hidden: bool,
    pub(crate) detached: bool,
}

impl TestRendererPrivateJsonNodeDiagnostic {
    #[must_use]
    pub const fn ordinal(&self) -> usize {
        self.ordinal
    }

    #[must_use]
    pub const fn node_kind(&self) -> TestRendererPrivateJsonNodeKind {
        self.node_kind
    }

    #[must_use]
    pub const fn parent_ordinal(&self) -> Option<usize> {
        self.parent_ordinal
    }

    #[must_use]
    pub fn child_ordinals(&self) -> &[usize] {
        &self.child_ordinals
    }

    #[must_use]
    pub fn child_count(&self) -> usize {
        self.child_ordinals.len()
    }

    #[must_use]
    pub const fn fiber(&self) -> TestRendererPrivateJsonFiberDiagnostic {
        self.fiber
    }

    #[must_use]
    pub fn element_type(&self) -> Option<&TestElementType> {
        self.element_type.as_ref()
    }

    #[must_use]
    pub fn props(&self) -> Option<&TestProps> {
        self.props.as_ref()
    }

    #[must_use]
    pub fn text(&self) -> Option<&str> {
        self.text.as_deref()
    }

    #[must_use]
    pub const fn is_hidden(&self) -> bool {
        self.hidden
    }

    #[must_use]
    pub const fn is_detached(&self) -> bool {
        self.detached
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateJsonRenderedRoot {
    Null,
    Text(String),
    HostComponent(TestRendererPrivateJsonRenderedHostComponent),
    Array(Vec<TestRendererPrivateJsonRenderedRoot>),
}

impl TestRendererPrivateJsonRenderedRoot {
    #[must_use]
    pub const fn is_null(&self) -> bool {
        matches!(self, Self::Null)
    }

    #[must_use]
    pub fn as_text(&self) -> Option<&str> {
        match self {
            Self::Text(text) => Some(text),
            Self::Null | Self::HostComponent(_) | Self::Array(_) => None,
        }
    }

    #[must_use]
    pub const fn as_host_component(&self) -> Option<&TestRendererPrivateJsonRenderedHostComponent> {
        match self {
            Self::HostComponent(component) => Some(component),
            Self::Null | Self::Text(_) | Self::Array(_) => None,
        }
    }

    #[must_use]
    pub fn as_array(&self) -> Option<&[TestRendererPrivateJsonRenderedRoot]> {
        match self {
            Self::Array(children) => Some(children),
            Self::Null | Self::Text(_) | Self::HostComponent(_) => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonRenderedHostComponent {
    pub(crate) element_type: TestElementType,
    pub(crate) props: BTreeMap<String, String>,
    pub(crate) children: Option<Vec<TestRendererPrivateJsonRenderedRoot>>,
}

impl TestRendererPrivateJsonRenderedHostComponent {
    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &BTreeMap<String, String> {
        &self.props
    }

    #[must_use]
    pub fn children(&self) -> Option<&[TestRendererPrivateJsonRenderedRoot]> {
        self.children.as_deref()
    }

    #[must_use]
    pub fn child_count(&self) -> usize {
        self.children.as_ref().map_or(0, Vec::len)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonTextDiagnostic {
    pub(crate) text: String,
    pub(crate) hidden: bool,
}

impl TestRendererPrivateJsonTextDiagnostic {
    #[must_use]
    pub fn text(&self) -> &str {
        &self.text
    }

    #[must_use]
    pub const fn node_kind(&self) -> TestRendererPrivateJsonNodeKind {
        TestRendererPrivateJsonNodeKind::Text
    }

    #[must_use]
    pub const fn is_hidden(&self) -> bool {
        self.hidden
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonHostComponentDiagnostic {
    pub(crate) element_type: TestElementType,
    pub(crate) props: TestProps,
    pub(crate) hidden: bool,
    pub(crate) detached: bool,
    pub(crate) child_count: usize,
    pub(crate) text_child: TestRendererPrivateJsonTextDiagnostic,
    pub(crate) text_children: Vec<TestRendererPrivateJsonTextDiagnostic>,
    pub(crate) host_child: Option<Box<TestRendererPrivateJsonHostComponentDiagnostic>>,
}

impl TestRendererPrivateJsonHostComponentDiagnostic {
    #[must_use]
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn node_kind(&self) -> TestRendererPrivateJsonNodeKind {
        TestRendererPrivateJsonNodeKind::HostComponent
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
    pub const fn child_count(&self) -> usize {
        self.child_count
    }

    #[must_use]
    pub const fn text_child(&self) -> &TestRendererPrivateJsonTextDiagnostic {
        &self.text_child
    }

    #[must_use]
    pub fn text_children(&self) -> &[TestRendererPrivateJsonTextDiagnostic] {
        &self.text_children
    }

    #[must_use]
    pub fn host_child(&self) -> Option<&TestRendererPrivateJsonHostComponentDiagnostic> {
        self.host_child.as_deref()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonFacadeResult {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_diagnostic_name: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) element_type: TestElementType,
    pub(crate) props: TestProps,
    pub(crate) children: Vec<String>,
    pub(crate) rendered_root: TestRendererPrivateJsonRenderedRoot,
    pub(crate) source_node_count: usize,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_serialization_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonFacadeResult {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_diagnostic_name(&self) -> &'static str {
        self.source_diagnostic_name
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
    pub fn element_type(&self) -> &TestElementType {
        &self.element_type
    }

    #[must_use]
    pub fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub fn children(&self) -> &[String] {
        &self.children
    }

    #[must_use]
    pub const fn child_count(&self) -> usize {
        self.children.len()
    }

    #[must_use]
    pub const fn rendered_root(&self) -> &TestRendererPrivateJsonRenderedRoot {
        &self.rendered_root
    }

    #[must_use]
    pub const fn source_node_count(&self) -> usize {
        self.source_node_count
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonNativeExecutionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    pub(crate) rendered_root: TestRendererPrivateJsonRenderedRoot,
    pub(crate) source_node_count: usize,
    pub(crate) root_child_count: usize,
    pub(crate) consumes_accepted_native_create_execution_record: bool,
    pub(crate) consumes_accepted_native_update_execution_record: bool,
    pub(crate) consumes_accepted_native_unmount_execution_record: bool,
    pub(crate) consumes_private_to_json_evidence: bool,
    pub(crate) consumes_accepted_host_output_row: bool,
    pub(crate) source_finished_work_identity_diagnostic_name: Option<&'static str>,
    pub(crate) consumes_private_sibling_text_finished_work_identity_gate: bool,
    pub(crate) source_lifecycle_execution_diagnostic_name: Option<&'static str>,
    pub(crate) source_lifecycle_execution_status: Option<&'static str>,
    pub(crate) consumes_private_root_lifecycle_execution: bool,
    pub(crate) source_unmount_nested_source_report_admission_gate_diagnostic_name:
        Option<&'static str>,
    pub(crate) source_unmount_nested_source_report_admission_gate_status: Option<&'static str>,
    pub(crate) consumes_private_unmount_nested_source_report_admission_gate: bool,
    pub(crate) minimal_tree_shape: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonNativeExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(&self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(&self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(&self) -> &'static str {
        self.source_execution_status
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
    pub const fn rendered_root(&self) -> &TestRendererPrivateJsonRenderedRoot {
        &self.rendered_root
    }

    #[must_use]
    pub const fn source_node_count(&self) -> usize {
        self.source_node_count
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn consumes_accepted_native_create_execution_record(&self) -> bool {
        self.consumes_accepted_native_create_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(&self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_unmount_execution_record(&self) -> bool {
        self.consumes_accepted_native_unmount_execution_record
    }

    #[must_use]
    pub const fn consumes_private_to_json_evidence(&self) -> bool {
        self.consumes_private_to_json_evidence
    }

    #[must_use]
    pub const fn consumes_accepted_host_output_row(&self) -> bool {
        self.consumes_accepted_host_output_row
    }

    #[must_use]
    pub const fn source_finished_work_identity_diagnostic_name(&self) -> Option<&'static str> {
        self.source_finished_work_identity_diagnostic_name
    }

    #[must_use]
    pub const fn consumes_private_sibling_text_finished_work_identity_gate(&self) -> bool {
        self.consumes_private_sibling_text_finished_work_identity_gate
    }

    #[must_use]
    pub const fn source_lifecycle_execution_diagnostic_name(&self) -> Option<&'static str> {
        self.source_lifecycle_execution_diagnostic_name
    }

    #[must_use]
    pub const fn source_lifecycle_execution_status(&self) -> Option<&'static str> {
        self.source_lifecycle_execution_status
    }

    #[must_use]
    pub const fn consumes_private_root_lifecycle_execution(&self) -> bool {
        self.consumes_private_root_lifecycle_execution
    }

    #[must_use]
    pub const fn source_unmount_nested_source_report_admission_gate_diagnostic_name(
        &self,
    ) -> Option<&'static str> {
        self.source_unmount_nested_source_report_admission_gate_diagnostic_name
    }

    #[must_use]
    pub const fn source_unmount_nested_source_report_admission_gate_status(
        &self,
    ) -> Option<&'static str> {
        self.source_unmount_nested_source_report_admission_gate_status
    }

    #[must_use]
    pub const fn consumes_private_unmount_nested_source_report_admission_gate(&self) -> bool {
        self.consumes_private_unmount_nested_source_report_admission_gate
    }

    #[must_use]
    pub const fn minimal_tree_shape(&self) -> bool {
        self.minimal_tree_shape
    }

    #[must_use]
    pub const fn public_to_json_available(&self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(&self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateToTreeNativeExecutionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) source_tree_diagnostic_name: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    pub(crate) rendered_root: TestRendererPrivateTreeRenderedRoot,
    pub(crate) source_fiber_count: usize,
    pub(crate) root_child_count: usize,
    pub(crate) consumes_accepted_native_create_execution_record: bool,
    pub(crate) consumes_accepted_native_update_execution_record: bool,
    pub(crate) consumes_accepted_native_unmount_execution_record: bool,
    pub(crate) consumes_private_to_tree_evidence: bool,
    pub(crate) consumes_accepted_host_output_row: bool,
    pub(crate) source_finished_work_identity_diagnostic_name: Option<&'static str>,
    pub(crate) consumes_private_sibling_text_finished_work_identity_gate: bool,
    pub(crate) source_lifecycle_execution_diagnostic_name: Option<&'static str>,
    pub(crate) source_lifecycle_execution_status: Option<&'static str>,
    pub(crate) consumes_private_root_lifecycle_execution: bool,
    pub(crate) source_unmount_nested_source_report_admission_gate_diagnostic_name:
        Option<&'static str>,
    pub(crate) source_unmount_nested_source_report_admission_gate_status: Option<&'static str>,
    pub(crate) consumes_private_unmount_nested_source_report_admission_gate: bool,
    pub(crate) minimal_tree_shape: bool,
    pub(crate) function_component_above_host_output_shape: bool,
    pub(crate) public_to_tree_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateToTreeNativeExecutionEvidence {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn operation(&self) -> &'static str {
        self.operation
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(&self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(&self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_tree_diagnostic_name(&self) -> &'static str {
        self.source_tree_diagnostic_name
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
    pub const fn rendered_root(&self) -> &TestRendererPrivateTreeRenderedRoot {
        &self.rendered_root
    }

    #[must_use]
    pub const fn source_fiber_count(&self) -> usize {
        self.source_fiber_count
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn consumes_accepted_native_create_execution_record(&self) -> bool {
        self.consumes_accepted_native_create_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(&self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_accepted_native_unmount_execution_record(&self) -> bool {
        self.consumes_accepted_native_unmount_execution_record
    }

    #[must_use]
    pub const fn consumes_private_to_tree_evidence(&self) -> bool {
        self.consumes_private_to_tree_evidence
    }

    #[must_use]
    pub const fn consumes_accepted_host_output_row(&self) -> bool {
        self.consumes_accepted_host_output_row
    }

    #[must_use]
    pub const fn source_finished_work_identity_diagnostic_name(&self) -> Option<&'static str> {
        self.source_finished_work_identity_diagnostic_name
    }

    #[must_use]
    pub const fn consumes_private_sibling_text_finished_work_identity_gate(&self) -> bool {
        self.consumes_private_sibling_text_finished_work_identity_gate
    }

    #[must_use]
    pub const fn source_lifecycle_execution_diagnostic_name(&self) -> Option<&'static str> {
        self.source_lifecycle_execution_diagnostic_name
    }

    #[must_use]
    pub const fn source_lifecycle_execution_status(&self) -> Option<&'static str> {
        self.source_lifecycle_execution_status
    }

    #[must_use]
    pub const fn consumes_private_root_lifecycle_execution(&self) -> bool {
        self.consumes_private_root_lifecycle_execution
    }

    #[must_use]
    pub const fn source_unmount_nested_source_report_admission_gate_diagnostic_name(
        &self,
    ) -> Option<&'static str> {
        self.source_unmount_nested_source_report_admission_gate_diagnostic_name
    }

    #[must_use]
    pub const fn source_unmount_nested_source_report_admission_gate_status(
        &self,
    ) -> Option<&'static str> {
        self.source_unmount_nested_source_report_admission_gate_status
    }

    #[must_use]
    pub const fn consumes_private_unmount_nested_source_report_admission_gate(&self) -> bool {
        self.consumes_private_unmount_nested_source_report_admission_gate
    }

    #[must_use]
    pub const fn minimal_tree_shape(&self) -> bool {
        self.minimal_tree_shape
    }

    #[must_use]
    pub const fn function_component_above_host_output_shape(&self) -> bool {
        self.function_component_above_host_output_shape
    }

    #[must_use]
    pub const fn public_to_tree_available(&self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_serialization_available(&self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(&self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(&self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateSerializationFinishedWorkIdentityGate {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) root_scheduled_update_sequence: usize,
    pub(crate) public_surface: &'static str,
    pub(crate) source_serialization_diagnostic_name: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) report_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) report_finished_lanes_bits: u32,
    pub(crate) commit_remaining_lanes_bits: u32,
    pub(crate) commit_pending_lanes_bits: u32,
    pub(crate) commit_current_matches_render_finished_work: bool,
    pub(crate) commit_previous_current_matches_render_current: bool,
    pub(crate) commit_lanes_match_render_lanes: bool,
    pub(crate) report_finished_work_matches_commit_current: bool,
    pub(crate) report_lanes_match_commit_lanes: bool,
    pub(crate) committed_fiber_inspection_current_matches_commit: bool,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) consumes_committed_host_root_finished_work_identity: bool,
    pub(crate) consumes_committed_host_root_finished_work_lanes: bool,
    pub(crate) consumes_private_to_json_evidence: bool,
    pub(crate) consumes_private_to_tree_evidence: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_to_tree_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateSerializationFinishedWorkIdentityGate {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn root_scheduled_update_sequence(self) -> usize {
        self.root_scheduled_update_sequence
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_serialization_diagnostic_name(self) -> &'static str {
        self.source_serialization_diagnostic_name
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.render_current
    }

    #[must_use]
    pub const fn render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_previous_current
    }

    #[must_use]
    pub const fn commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_current
    }

    #[must_use]
    pub const fn report_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.report_finished_work
    }

    #[must_use]
    pub const fn render_lanes_bits(self) -> u32 {
        self.render_lanes_bits
    }

    #[must_use]
    pub const fn commit_finished_lanes_bits(self) -> u32 {
        self.commit_finished_lanes_bits
    }

    #[must_use]
    pub const fn report_finished_lanes_bits(self) -> u32 {
        self.report_finished_lanes_bits
    }

    #[must_use]
    pub const fn commit_remaining_lanes_bits(self) -> u32 {
        self.commit_remaining_lanes_bits
    }

    #[must_use]
    pub const fn commit_pending_lanes_bits(self) -> u32 {
        self.commit_pending_lanes_bits
    }

    #[must_use]
    pub const fn commit_current_matches_render_finished_work(self) -> bool {
        self.commit_current_matches_render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current_matches_render_current(self) -> bool {
        self.commit_previous_current_matches_render_current
    }

    #[must_use]
    pub const fn commit_lanes_match_render_lanes(self) -> bool {
        self.commit_lanes_match_render_lanes
    }

    #[must_use]
    pub const fn report_finished_work_matches_commit_current(self) -> bool {
        self.report_finished_work_matches_commit_current
    }

    #[must_use]
    pub const fn report_lanes_match_commit_lanes(self) -> bool {
        self.report_lanes_match_commit_lanes
    }

    #[must_use]
    pub const fn committed_fiber_inspection_current_matches_commit(self) -> bool {
        self.committed_fiber_inspection_current_matches_commit
    }

    #[must_use]
    pub const fn host_output_snapshot_current(self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_identity(self) -> bool {
        self.consumes_committed_host_root_finished_work_identity
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_lanes(self) -> bool {
        self.consumes_committed_host_root_finished_work_lanes
    }

    #[must_use]
    pub const fn consumes_private_to_json_evidence(self) -> bool {
        self.consumes_private_to_json_evidence
    }

    #[must_use]
    pub const fn consumes_private_to_tree_evidence(self) -> bool {
        self.consumes_private_to_tree_evidence
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_to_tree_available(self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateUnmountNestedSourceReportAdmissionGate {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) nested_root: FiberRootId,
    pub(crate) unmount_root: FiberRootId,
    pub(crate) nested_renderer_id: TestRendererId,
    pub(crate) unmount_renderer_id: TestRendererId,
    pub(crate) nested_route_record_id: &'static str,
    pub(crate) nested_route_status: &'static str,
    pub(crate) unmount_admission_record_id: &'static str,
    pub(crate) unmount_admission_status: &'static str,
    pub(crate) nested_identity_diagnostic_name: &'static str,
    pub(crate) nested_identity_public_surface: &'static str,
    pub(crate) nested_identity_source_serialization_diagnostic_name: &'static str,
    pub(crate) unmount_identity_diagnostic_name: &'static str,
    pub(crate) unmount_identity_public_surface: &'static str,
    pub(crate) unmount_identity_source_serialization_diagnostic_name: &'static str,
    pub(crate) nested_source_report_diagnostic_name: &'static str,
    pub(crate) nested_host_output_row_id: &'static str,
    pub(crate) unmount_host_output_row_id: &'static str,
    pub(crate) nested_scheduled_update_sequence: usize,
    pub(crate) unmount_scheduled_update_sequence: usize,
    pub(crate) nested_host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) unmount_host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) nested_source_node_count: usize,
    pub(crate) nested_host_component_count: usize,
    pub(crate) nested_host_text_count: usize,
    pub(crate) unmount_host_node_cleanup_count: usize,
    pub(crate) unmount_cleanup_order_record_count: usize,
    pub(crate) nested_identity_accepted: bool,
    pub(crate) unmount_identity_accepted: bool,
    pub(crate) nested_route_admission_accepted: bool,
    pub(crate) unmount_route_admission_accepted: bool,
    pub(crate) nested_committed_source_report_ownership_accepted: bool,
    pub(crate) unmount_deletion_cleanup_metadata_accepted: bool,
    pub(crate) consumes_worker_736_nested_source_report_identity: bool,
    pub(crate) consumes_worker_733_unmount_identity: bool,
    pub(crate) broad_multichild_identity_available: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_to_tree_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_loading_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) js_facade_available: bool,
    pub(crate) cjs_facade_available: bool,
    pub(crate) package_compatibility_claimed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateUnmountNestedSourceReportAdmissionGate {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn nested_root(self) -> FiberRootId {
        self.nested_root
    }

    #[must_use]
    pub const fn unmount_root(self) -> FiberRootId {
        self.unmount_root
    }

    #[must_use]
    pub const fn nested_route_record_id(self) -> &'static str {
        self.nested_route_record_id
    }

    #[must_use]
    pub const fn nested_route_status(self) -> &'static str {
        self.nested_route_status
    }

    #[must_use]
    pub const fn unmount_admission_record_id(self) -> &'static str {
        self.unmount_admission_record_id
    }

    #[must_use]
    pub const fn unmount_admission_status(self) -> &'static str {
        self.unmount_admission_status
    }

    #[must_use]
    pub const fn nested_identity_diagnostic_name(self) -> &'static str {
        self.nested_identity_diagnostic_name
    }

    #[must_use]
    pub const fn nested_identity_public_surface(self) -> &'static str {
        self.nested_identity_public_surface
    }

    #[must_use]
    pub const fn nested_identity_source_serialization_diagnostic_name(self) -> &'static str {
        self.nested_identity_source_serialization_diagnostic_name
    }

    #[must_use]
    pub const fn unmount_identity_diagnostic_name(self) -> &'static str {
        self.unmount_identity_diagnostic_name
    }

    #[must_use]
    pub const fn unmount_identity_public_surface(self) -> &'static str {
        self.unmount_identity_public_surface
    }

    #[must_use]
    pub const fn unmount_identity_source_serialization_diagnostic_name(self) -> &'static str {
        self.unmount_identity_source_serialization_diagnostic_name
    }

    #[must_use]
    pub const fn nested_source_report_diagnostic_name(self) -> &'static str {
        self.nested_source_report_diagnostic_name
    }

    #[must_use]
    pub const fn nested_host_output_row_id(self) -> &'static str {
        self.nested_host_output_row_id
    }

    #[must_use]
    pub const fn unmount_host_output_row_id(self) -> &'static str {
        self.unmount_host_output_row_id
    }

    #[must_use]
    pub const fn nested_scheduled_update_sequence(self) -> usize {
        self.nested_scheduled_update_sequence
    }

    #[must_use]
    pub const fn unmount_scheduled_update_sequence(self) -> usize {
        self.unmount_scheduled_update_sequence
    }

    #[must_use]
    pub const fn nested_host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.nested_host_output_shape
    }

    #[must_use]
    pub const fn unmount_host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.unmount_host_output_shape
    }

    #[must_use]
    pub const fn nested_source_node_count(self) -> usize {
        self.nested_source_node_count
    }

    #[must_use]
    pub const fn nested_host_component_count(self) -> usize {
        self.nested_host_component_count
    }

    #[must_use]
    pub const fn nested_host_text_count(self) -> usize {
        self.nested_host_text_count
    }

    #[must_use]
    pub const fn unmount_host_node_cleanup_count(self) -> usize {
        self.unmount_host_node_cleanup_count
    }

    #[must_use]
    pub const fn unmount_cleanup_order_record_count(self) -> usize {
        self.unmount_cleanup_order_record_count
    }

    #[must_use]
    pub const fn nested_identity_accepted(self) -> bool {
        self.nested_identity_accepted
    }

    #[must_use]
    pub const fn unmount_identity_accepted(self) -> bool {
        self.unmount_identity_accepted
    }

    #[must_use]
    pub const fn nested_route_admission_accepted(self) -> bool {
        self.nested_route_admission_accepted
    }

    #[must_use]
    pub const fn unmount_route_admission_accepted(self) -> bool {
        self.unmount_route_admission_accepted
    }

    #[must_use]
    pub const fn nested_committed_source_report_ownership_accepted(self) -> bool {
        self.nested_committed_source_report_ownership_accepted
    }

    #[must_use]
    pub const fn unmount_deletion_cleanup_metadata_accepted(self) -> bool {
        self.unmount_deletion_cleanup_metadata_accepted
    }

    #[must_use]
    pub const fn consumes_worker_736_nested_source_report_identity(self) -> bool {
        self.consumes_worker_736_nested_source_report_identity
    }

    #[must_use]
    pub const fn consumes_worker_733_unmount_identity(self) -> bool {
        self.consumes_worker_733_unmount_identity
    }

    #[must_use]
    pub const fn broad_multichild_identity_available(self) -> bool {
        self.broad_multichild_identity_available
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_to_tree_available(self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_loading_available(self) -> bool {
        self.native_bridge_loading_available
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn js_facade_available(self) -> bool {
        self.js_facade_available
    }

    #[must_use]
    pub const fn cjs_facade_available(self) -> bool {
        self.cjs_facade_available
    }

    #[must_use]
    pub const fn package_compatibility_claimed(self) -> bool {
        self.package_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub fn public_native_package_js_surfaces_blocked(self) -> bool {
        !self.public_to_json_available()
            && !self.public_to_tree_available()
            && !self.public_test_instance_available()
            && !self.public_serialization_available()
            && !self.public_route_available()
            && !self.native_bridge_loading_available()
            && !self.native_bridge_available()
            && !self.native_execution_available()
            && !self.js_facade_available()
            && !self.cjs_facade_available()
            && !self.package_compatibility_claimed()
            && !self.compatibility_claimed()
    }

    #[must_use]
    pub fn private_admission_ready(self) -> bool {
        self.nested_identity_accepted()
            && self.unmount_identity_accepted()
            && self.nested_route_admission_accepted()
            && self.unmount_route_admission_accepted()
            && self.nested_committed_source_report_ownership_accepted()
            && self.unmount_deletion_cleanup_metadata_accepted()
            && self.consumes_worker_736_nested_source_report_identity()
            && self.consumes_worker_733_unmount_identity()
            && !self.broad_multichild_identity_available()
            && self.public_native_package_js_surfaces_blocked()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonSiblingSnapshotFinishedWorkIdentityBlocker {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) host_output_row: TestRendererPrivateToJsonHostOutputRow,
    pub(crate) snapshot_based_host_output_row: bool,
    pub(crate) candidate_finished_work_identity_supplied: bool,
    pub(crate) candidate_identity_diagnostic_name: Option<&'static str>,
    pub(crate) candidate_identity_status: Option<&'static str>,
    pub(crate) candidate_identity_root_matches: bool,
    pub(crate) candidate_identity_update_sequence_matches_root: bool,
    pub(crate) candidate_identity_update_to_json_surface: bool,
    pub(crate) candidate_identity_source_report_matches_to_json: bool,
    pub(crate) candidate_identity_update_kind_matches: bool,
    pub(crate) candidate_identity_committed_host_root_current: bool,
    pub(crate) candidate_identity_lanes_match: bool,
    pub(crate) candidate_identity_matches_update_route_handoff: bool,
    pub(crate) candidate_identity_public_blockers_closed: bool,
    pub(crate) plausible_finished_work_identity_rejected: bool,
    pub(crate) committed_sibling_text_fiber_inspection_available: bool,
    pub(crate) committed_sibling_text_report_shape_available: bool,
    pub(crate) real_sibling_text_handoff_available: bool,
    pub(crate) consumes_committed_host_root_finished_work_identity: bool,
    pub(crate) consumes_committed_host_root_finished_work_lanes: bool,
    pub(crate) identity_admission_available: bool,
    pub(crate) rejection_reason: &'static str,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) package_compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonSiblingSnapshotFinishedWorkIdentityBlocker {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn host_output_row(self) -> TestRendererPrivateToJsonHostOutputRow {
        self.host_output_row
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_row.host_output_update_kind()
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_row.host_output_shape()
    }

    #[must_use]
    pub const fn snapshot_based_host_output_row(self) -> bool {
        self.snapshot_based_host_output_row
    }

    #[must_use]
    pub const fn candidate_finished_work_identity_supplied(self) -> bool {
        self.candidate_finished_work_identity_supplied
    }

    #[must_use]
    pub const fn candidate_identity_diagnostic_name(self) -> Option<&'static str> {
        self.candidate_identity_diagnostic_name
    }

    #[must_use]
    pub const fn candidate_identity_status(self) -> Option<&'static str> {
        self.candidate_identity_status
    }

    #[must_use]
    pub const fn candidate_identity_root_matches(self) -> bool {
        self.candidate_identity_root_matches
    }

    #[must_use]
    pub const fn candidate_identity_update_sequence_matches_root(self) -> bool {
        self.candidate_identity_update_sequence_matches_root
    }

    #[must_use]
    pub const fn candidate_identity_update_to_json_surface(self) -> bool {
        self.candidate_identity_update_to_json_surface
    }

    #[must_use]
    pub const fn candidate_identity_source_report_matches_to_json(self) -> bool {
        self.candidate_identity_source_report_matches_to_json
    }

    #[must_use]
    pub const fn candidate_identity_update_kind_matches(self) -> bool {
        self.candidate_identity_update_kind_matches
    }

    #[must_use]
    pub const fn candidate_identity_committed_host_root_current(self) -> bool {
        self.candidate_identity_committed_host_root_current
    }

    #[must_use]
    pub const fn candidate_identity_lanes_match(self) -> bool {
        self.candidate_identity_lanes_match
    }

    #[must_use]
    pub const fn candidate_identity_matches_update_route_handoff(self) -> bool {
        self.candidate_identity_matches_update_route_handoff
    }

    #[must_use]
    pub const fn candidate_identity_public_blockers_closed(self) -> bool {
        self.candidate_identity_public_blockers_closed
    }

    #[must_use]
    pub fn candidate_identity_plausible_for_update_to_json(self) -> bool {
        self.candidate_finished_work_identity_supplied()
            && self.candidate_identity_diagnostic_name()
                == Some(TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME)
            && self.candidate_identity_status()
                == Some(TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_STATUS)
            && self.candidate_identity_root_matches()
            && self.candidate_identity_update_sequence_matches_root()
            && self.candidate_identity_update_to_json_surface()
            && self.candidate_identity_source_report_matches_to_json()
            && self.candidate_identity_update_kind_matches()
            && self.candidate_identity_committed_host_root_current()
            && self.candidate_identity_lanes_match()
            && self.candidate_identity_matches_update_route_handoff()
            && self.candidate_identity_public_blockers_closed()
    }

    #[must_use]
    pub const fn plausible_finished_work_identity_rejected(self) -> bool {
        self.plausible_finished_work_identity_rejected
    }

    #[must_use]
    pub const fn committed_sibling_text_fiber_inspection_available(self) -> bool {
        self.committed_sibling_text_fiber_inspection_available
    }

    #[must_use]
    pub const fn committed_sibling_text_report_shape_available(self) -> bool {
        self.committed_sibling_text_report_shape_available
    }

    #[must_use]
    pub const fn real_sibling_text_handoff_available(self) -> bool {
        self.real_sibling_text_handoff_available
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_identity(self) -> bool {
        self.consumes_committed_host_root_finished_work_identity
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_lanes(self) -> bool {
        self.consumes_committed_host_root_finished_work_lanes
    }

    #[must_use]
    pub const fn identity_admission_available(self) -> bool {
        self.identity_admission_available
    }

    #[must_use]
    pub const fn rejection_reason(self) -> &'static str {
        self.rejection_reason
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn package_compatibility_claimed(self) -> bool {
        self.package_compatibility_claimed
    }

    #[must_use]
    pub fn identity_admission_blocked(self) -> bool {
        self.snapshot_based_host_output_row()
            && self.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && self.host_output_shape() == TestRendererPrivateToJsonHostOutputShape::SiblingText
            && !self.committed_sibling_text_fiber_inspection_available()
            && !self.committed_sibling_text_report_shape_available()
            && !self.real_sibling_text_handoff_available()
            && !self.consumes_committed_host_root_finished_work_identity()
            && !self.consumes_committed_host_root_finished_work_lanes()
            && !self.identity_admission_available()
            && self.rejection_reason()
                == TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_REASON
            && !self.public_to_json_available()
            && !self.public_serialization_available()
            && !self.public_route_available()
            && !self.native_bridge_available()
            && !self.native_execution_available()
            && !self.package_compatibility_claimed()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) root_scheduled_update_sequence: usize,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) source_serialization_diagnostic_name: &'static str,
    pub(crate) worker_738_report_row_id: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) root_node_kind: TestRendererPrivateJsonNodeKind,
    pub(crate) root_child_count: usize,
    pub(crate) source_node_count: usize,
    pub(crate) route_render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) route_render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) route_commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) route_commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) report_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) route_render_lanes_bits: u32,
    pub(crate) route_commit_finished_lanes_bits: u32,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) report_finished_lanes_bits: u32,
    pub(crate) commit_remaining_lanes_bits: u32,
    pub(crate) commit_pending_lanes_bits: u32,
    pub(crate) route_handles_match_committed_update: bool,
    pub(crate) route_lanes_match_committed_update: bool,
    pub(crate) commit_current_matches_render_finished_work: bool,
    pub(crate) commit_previous_current_matches_render_current: bool,
    pub(crate) commit_lanes_match_render_lanes: bool,
    pub(crate) report_finished_work_matches_commit_current: bool,
    pub(crate) report_lanes_match_commit_lanes: bool,
    pub(crate) committed_fiber_inspection_current_matches_commit: bool,
    pub(crate) committed_sibling_text_fiber_inspection_available: bool,
    pub(crate) committed_sibling_text_report_shape_available: bool,
    pub(crate) committed_sibling_text_inspection_matches_output: bool,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) report_host_output_row_matches_output: bool,
    pub(crate) report_root_array_source_nodes_match_current_snapshot: bool,
    pub(crate) real_sibling_text_handoff_available: bool,
    pub(crate) consumes_update_route_admission: bool,
    pub(crate) consumes_sibling_text_host_output: bool,
    pub(crate) consumes_private_to_json_evidence: bool,
    pub(crate) consumes_worker_738_report_row: bool,
    pub(crate) consumes_committed_host_root_finished_work_identity: bool,
    pub(crate) consumes_committed_host_root_finished_work_lanes: bool,
    pub(crate) identity_admission_available: bool,
    pub(crate) broad_multichild_identity_available: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_to_tree_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_loading_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) js_facade_available: bool,
    pub(crate) cjs_facade_available: bool,
    pub(crate) package_compatibility_claimed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn root_scheduled_update_sequence(self) -> usize {
        self.root_scheduled_update_sequence
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_serialization_diagnostic_name(self) -> &'static str {
        self.source_serialization_diagnostic_name
    }

    #[must_use]
    pub const fn worker_738_report_row_id(self) -> &'static str {
        self.worker_738_report_row_id
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn root_node_kind(self) -> TestRendererPrivateJsonNodeKind {
        self.root_node_kind
    }

    #[must_use]
    pub const fn root_child_count(self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn source_node_count(self) -> usize {
        self.source_node_count
    }

    #[must_use]
    pub const fn route_render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.route_render_current
    }

    #[must_use]
    pub const fn route_render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.route_render_finished_work
    }

    #[must_use]
    pub const fn route_commit_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.route_commit_previous_current
    }

    #[must_use]
    pub const fn route_commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.route_commit_current
    }

    #[must_use]
    pub const fn render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.render_current
    }

    #[must_use]
    pub const fn render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_previous_current
    }

    #[must_use]
    pub const fn commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_current
    }

    #[must_use]
    pub const fn report_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.report_finished_work
    }

    #[must_use]
    pub const fn route_render_lanes_bits(self) -> u32 {
        self.route_render_lanes_bits
    }

    #[must_use]
    pub const fn route_commit_finished_lanes_bits(self) -> u32 {
        self.route_commit_finished_lanes_bits
    }

    #[must_use]
    pub const fn render_lanes_bits(self) -> u32 {
        self.render_lanes_bits
    }

    #[must_use]
    pub const fn commit_finished_lanes_bits(self) -> u32 {
        self.commit_finished_lanes_bits
    }

    #[must_use]
    pub const fn report_finished_lanes_bits(self) -> u32 {
        self.report_finished_lanes_bits
    }

    #[must_use]
    pub const fn commit_remaining_lanes_bits(self) -> u32 {
        self.commit_remaining_lanes_bits
    }

    #[must_use]
    pub const fn commit_pending_lanes_bits(self) -> u32 {
        self.commit_pending_lanes_bits
    }

    #[must_use]
    pub const fn route_handles_match_committed_update(self) -> bool {
        self.route_handles_match_committed_update
    }

    #[must_use]
    pub const fn route_lanes_match_committed_update(self) -> bool {
        self.route_lanes_match_committed_update
    }

    #[must_use]
    pub const fn commit_current_matches_render_finished_work(self) -> bool {
        self.commit_current_matches_render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current_matches_render_current(self) -> bool {
        self.commit_previous_current_matches_render_current
    }

    #[must_use]
    pub const fn commit_lanes_match_render_lanes(self) -> bool {
        self.commit_lanes_match_render_lanes
    }

    #[must_use]
    pub const fn report_finished_work_matches_commit_current(self) -> bool {
        self.report_finished_work_matches_commit_current
    }

    #[must_use]
    pub const fn report_lanes_match_commit_lanes(self) -> bool {
        self.report_lanes_match_commit_lanes
    }

    #[must_use]
    pub const fn committed_fiber_inspection_current_matches_commit(self) -> bool {
        self.committed_fiber_inspection_current_matches_commit
    }

    #[must_use]
    pub const fn committed_sibling_text_fiber_inspection_available(self) -> bool {
        self.committed_sibling_text_fiber_inspection_available
    }

    #[must_use]
    pub const fn committed_sibling_text_report_shape_available(self) -> bool {
        self.committed_sibling_text_report_shape_available
    }

    #[must_use]
    pub const fn committed_sibling_text_inspection_matches_output(self) -> bool {
        self.committed_sibling_text_inspection_matches_output
    }

    #[must_use]
    pub const fn host_output_snapshot_current(self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn report_host_output_row_matches_output(self) -> bool {
        self.report_host_output_row_matches_output
    }

    #[must_use]
    pub const fn report_root_array_source_nodes_match_current_snapshot(self) -> bool {
        self.report_root_array_source_nodes_match_current_snapshot
    }

    #[must_use]
    pub const fn real_sibling_text_handoff_available(self) -> bool {
        self.real_sibling_text_handoff_available
    }

    #[must_use]
    pub const fn consumes_update_route_admission(self) -> bool {
        self.consumes_update_route_admission
    }

    #[must_use]
    pub const fn consumes_sibling_text_host_output(self) -> bool {
        self.consumes_sibling_text_host_output
    }

    #[must_use]
    pub const fn consumes_private_to_json_evidence(self) -> bool {
        self.consumes_private_to_json_evidence
    }

    #[must_use]
    pub const fn consumes_worker_738_report_row(self) -> bool {
        self.consumes_worker_738_report_row
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_identity(self) -> bool {
        self.consumes_committed_host_root_finished_work_identity
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_lanes(self) -> bool {
        self.consumes_committed_host_root_finished_work_lanes
    }

    #[must_use]
    pub const fn identity_admission_available(self) -> bool {
        self.identity_admission_available
    }

    #[must_use]
    pub const fn broad_multichild_identity_available(self) -> bool {
        self.broad_multichild_identity_available
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_to_tree_available(self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_loading_available(self) -> bool {
        self.native_bridge_loading_available
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn js_facade_available(self) -> bool {
        self.js_facade_available
    }

    #[must_use]
    pub const fn cjs_facade_available(self) -> bool {
        self.cjs_facade_available
    }

    #[must_use]
    pub const fn package_compatibility_claimed(self) -> bool {
        self.package_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub fn public_native_package_js_surfaces_blocked(self) -> bool {
        !self.public_to_json_available()
            && !self.public_to_tree_available()
            && !self.public_test_instance_available()
            && !self.public_serialization_available()
            && !self.public_route_available()
            && !self.native_bridge_loading_available()
            && !self.native_bridge_available()
            && !self.native_execution_available()
            && !self.js_facade_available()
            && !self.cjs_facade_available()
            && !self.package_compatibility_claimed()
            && !self.compatibility_claimed()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) root_scheduled_update_sequence: usize,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) source_lifecycle_diagnostic_name: &'static str,
    pub(crate) source_lifecycle_status: &'static str,
    pub(crate) worker_895_report_row_id: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) root_node_kind: TestRendererPrivateJsonNodeKind,
    pub(crate) child_fiber_tag_order: [&'static str; 3],
    pub(crate) root_child_count: usize,
    pub(crate) source_node_count: usize,
    pub(crate) route_render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) route_render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) route_commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) route_commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) route_render_lanes_bits: u32,
    pub(crate) route_commit_finished_lanes_bits: u32,
    pub(crate) lifecycle_scheduled_update_sequence: usize,
    pub(crate) lifecycle_host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) lifecycle_root_child_count: usize,
    pub(crate) lifecycle_host_component_count: usize,
    pub(crate) lifecycle_host_text_count: usize,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) report_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) report_finished_lanes_bits: u32,
    pub(crate) commit_remaining_lanes_bits: u32,
    pub(crate) commit_pending_lanes_bits: u32,
    pub(crate) route_handles_match_committed_update: bool,
    pub(crate) route_lanes_match_committed_update: bool,
    pub(crate) lifecycle_matches_committed_update: bool,
    pub(crate) commit_current_matches_render_finished_work: bool,
    pub(crate) commit_previous_current_matches_render_current: bool,
    pub(crate) report_finished_work_matches_commit_current: bool,
    pub(crate) report_lanes_match_commit_lanes: bool,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) report_host_output_row_matches_output: bool,
    pub(crate) child_order_matches_current_snapshot: bool,
    pub(crate) host_parent_placement_apply_count: usize,
    pub(crate) real_multi_child_handoff_available: bool,
    pub(crate) consumes_update_route_admission: bool,
    pub(crate) consumes_root_lifecycle_execution: bool,
    pub(crate) consumes_multi_child_host_output: bool,
    pub(crate) consumes_committed_host_root_finished_work_identity: bool,
    pub(crate) consumes_committed_host_root_finished_work_lanes: bool,
    pub(crate) identity_admission_available: bool,
    pub(crate) broad_multichild_identity_available: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_to_tree_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_loading_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) js_facade_available: bool,
    pub(crate) cjs_facade_available: bool,
    pub(crate) package_compatibility_claimed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    pub(crate) const fn renderer_id(self) -> TestRendererId {
        self.renderer_id
    }

    #[must_use]
    pub const fn root_scheduled_update_sequence(self) -> usize {
        self.root_scheduled_update_sequence
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_execution_record_id(self) -> &'static str {
        self.source_execution_record_id
    }

    #[must_use]
    pub const fn source_execution_status(self) -> &'static str {
        self.source_execution_status
    }

    #[must_use]
    pub const fn source_lifecycle_diagnostic_name(self) -> &'static str {
        self.source_lifecycle_diagnostic_name
    }

    #[must_use]
    pub const fn source_lifecycle_status(self) -> &'static str {
        self.source_lifecycle_status
    }

    #[must_use]
    pub const fn worker_895_report_row_id(self) -> &'static str {
        self.worker_895_report_row_id
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn root_node_kind(self) -> TestRendererPrivateJsonNodeKind {
        self.root_node_kind
    }

    #[must_use]
    pub const fn child_fiber_tag_order(self) -> [&'static str; 3] {
        self.child_fiber_tag_order
    }

    #[must_use]
    pub const fn root_child_count(self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn source_node_count(self) -> usize {
        self.source_node_count
    }

    #[must_use]
    pub const fn route_render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.route_render_current
    }

    #[must_use]
    pub const fn route_render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.route_render_finished_work
    }

    #[must_use]
    pub const fn route_commit_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.route_commit_previous_current
    }

    #[must_use]
    pub const fn route_commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.route_commit_current
    }

    #[must_use]
    pub const fn route_render_lanes_bits(self) -> u32 {
        self.route_render_lanes_bits
    }

    #[must_use]
    pub const fn route_commit_finished_lanes_bits(self) -> u32 {
        self.route_commit_finished_lanes_bits
    }

    #[must_use]
    pub const fn lifecycle_scheduled_update_sequence(self) -> usize {
        self.lifecycle_scheduled_update_sequence
    }

    #[must_use]
    pub const fn lifecycle_host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.lifecycle_host_output_shape
    }

    #[must_use]
    pub const fn lifecycle_root_child_count(self) -> usize {
        self.lifecycle_root_child_count
    }

    #[must_use]
    pub const fn lifecycle_host_component_count(self) -> usize {
        self.lifecycle_host_component_count
    }

    #[must_use]
    pub const fn lifecycle_host_text_count(self) -> usize {
        self.lifecycle_host_text_count
    }

    #[must_use]
    pub const fn render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.render_current
    }

    #[must_use]
    pub const fn render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_previous_current
    }

    #[must_use]
    pub const fn commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_current
    }

    #[must_use]
    pub const fn report_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.report_finished_work
    }

    #[must_use]
    pub const fn render_lanes_bits(self) -> u32 {
        self.render_lanes_bits
    }

    #[must_use]
    pub const fn commit_finished_lanes_bits(self) -> u32 {
        self.commit_finished_lanes_bits
    }

    #[must_use]
    pub const fn report_finished_lanes_bits(self) -> u32 {
        self.report_finished_lanes_bits
    }

    #[must_use]
    pub const fn commit_remaining_lanes_bits(self) -> u32 {
        self.commit_remaining_lanes_bits
    }

    #[must_use]
    pub const fn commit_pending_lanes_bits(self) -> u32 {
        self.commit_pending_lanes_bits
    }

    #[must_use]
    pub const fn route_handles_match_committed_update(self) -> bool {
        self.route_handles_match_committed_update
    }

    #[must_use]
    pub const fn route_lanes_match_committed_update(self) -> bool {
        self.route_lanes_match_committed_update
    }

    #[must_use]
    pub const fn lifecycle_matches_committed_update(self) -> bool {
        self.lifecycle_matches_committed_update
    }

    #[must_use]
    pub const fn commit_current_matches_render_finished_work(self) -> bool {
        self.commit_current_matches_render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current_matches_render_current(self) -> bool {
        self.commit_previous_current_matches_render_current
    }

    #[must_use]
    pub const fn report_finished_work_matches_commit_current(self) -> bool {
        self.report_finished_work_matches_commit_current
    }

    #[must_use]
    pub const fn report_lanes_match_commit_lanes(self) -> bool {
        self.report_lanes_match_commit_lanes
    }

    #[must_use]
    pub const fn host_output_snapshot_current(self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn report_host_output_row_matches_output(self) -> bool {
        self.report_host_output_row_matches_output
    }

    #[must_use]
    pub const fn child_order_matches_current_snapshot(self) -> bool {
        self.child_order_matches_current_snapshot
    }

    #[must_use]
    pub const fn host_parent_placement_apply_count(self) -> usize {
        self.host_parent_placement_apply_count
    }

    #[must_use]
    pub const fn real_multi_child_handoff_available(self) -> bool {
        self.real_multi_child_handoff_available
    }

    #[must_use]
    pub const fn consumes_update_route_admission(self) -> bool {
        self.consumes_update_route_admission
    }

    #[must_use]
    pub const fn consumes_root_lifecycle_execution(self) -> bool {
        self.consumes_root_lifecycle_execution
    }

    #[must_use]
    pub const fn consumes_multi_child_host_output(self) -> bool {
        self.consumes_multi_child_host_output
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_identity(self) -> bool {
        self.consumes_committed_host_root_finished_work_identity
    }

    #[must_use]
    pub const fn consumes_committed_host_root_finished_work_lanes(self) -> bool {
        self.consumes_committed_host_root_finished_work_lanes
    }

    #[must_use]
    pub const fn identity_admission_available(self) -> bool {
        self.identity_admission_available
    }

    #[must_use]
    pub const fn broad_multichild_identity_available(self) -> bool {
        self.broad_multichild_identity_available
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_to_tree_available(self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_loading_available(self) -> bool {
        self.native_bridge_loading_available
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn js_facade_available(self) -> bool {
        self.js_facade_available
    }

    #[must_use]
    pub const fn cjs_facade_available(self) -> bool {
        self.cjs_facade_available
    }

    #[must_use]
    pub const fn package_compatibility_claimed(self) -> bool {
        self.package_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub fn public_native_package_js_surfaces_blocked(self) -> bool {
        !self.public_to_json_available()
            && !self.public_to_tree_available()
            && !self.public_test_instance_available()
            && !self.public_serialization_available()
            && !self.public_route_available()
            && !self.native_bridge_loading_available()
            && !self.native_bridge_available()
            && !self.native_execution_available()
            && !self.js_facade_available()
            && !self.cjs_facade_available()
            && !self.package_compatibility_claimed()
            && !self.compatibility_claimed()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateDirectMultiChildHostTextRowIdentity {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) root_scheduled_update_sequence: usize,
    pub(crate) public_surface: &'static str,
    pub(crate) host_output_row: TestRendererPrivateToJsonHostOutputRow,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) store_current: TestRendererFiberHandleDiagnostics,
    pub(crate) host_component_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) stable_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) placed_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) commit_remaining_lanes_bits: u32,
    pub(crate) commit_pending_lanes_bits: u32,
    pub(crate) row_matches_shape: bool,
    pub(crate) row_owner_matches_root: bool,
    pub(crate) row_handles_match_output: bool,
    pub(crate) row_lanes_match_commit: bool,
    pub(crate) public_native_package_js_surfaces_blocked: bool,
}

impl TestRendererPrivateDirectMultiChildHostTextRowIdentity {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[cfg(test)]
    pub(crate) const fn renderer_id(self) -> TestRendererId {
        self.renderer_id
    }

    #[must_use]
    pub const fn root_scheduled_update_sequence(self) -> usize {
        self.root_scheduled_update_sequence
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn host_output_row(self) -> TestRendererPrivateToJsonHostOutputRow {
        self.host_output_row
    }

    #[must_use]
    pub const fn source_row_id(self) -> &'static str {
        self.host_output_row.id()
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_row.host_output_update_kind()
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_row.host_output_shape()
    }

    #[must_use]
    pub const fn render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.render_current
    }

    #[must_use]
    pub const fn render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_previous_current
    }

    #[must_use]
    pub const fn commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_current
    }

    #[must_use]
    pub const fn store_current(self) -> TestRendererFiberHandleDiagnostics {
        self.store_current
    }

    #[must_use]
    pub const fn host_component_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.host_component_fiber
    }

    #[must_use]
    pub const fn stable_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.stable_text_fiber
    }

    #[must_use]
    pub const fn placed_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.placed_text_fiber
    }

    #[must_use]
    pub const fn render_lanes_bits(self) -> u32 {
        self.render_lanes_bits
    }

    #[must_use]
    pub const fn commit_finished_lanes_bits(self) -> u32 {
        self.commit_finished_lanes_bits
    }

    #[must_use]
    pub const fn commit_remaining_lanes_bits(self) -> u32 {
        self.commit_remaining_lanes_bits
    }

    #[must_use]
    pub const fn commit_pending_lanes_bits(self) -> u32 {
        self.commit_pending_lanes_bits
    }

    #[must_use]
    pub const fn row_matches_shape(self) -> bool {
        self.row_matches_shape
    }

    #[must_use]
    pub const fn row_owner_matches_root(self) -> bool {
        self.row_owner_matches_root
    }

    #[must_use]
    pub const fn row_handles_match_output(self) -> bool {
        self.row_handles_match_output
    }

    #[must_use]
    pub const fn row_lanes_match_commit(self) -> bool {
        self.row_lanes_match_commit
    }

    #[must_use]
    pub const fn public_native_package_js_surfaces_blocked(self) -> bool {
        self.public_native_package_js_surfaces_blocked
    }

    #[must_use]
    pub fn source_owned_current_row_identity_accepted(self) -> bool {
        self.diagnostic_name()
            == TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_DIAGNOSTIC_NAME
            && self.status()
                == TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_STATUS
            && self.public_surface() == "create().update -> create().toJSON"
            && self.source_row_id()
                == TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID
            && self.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && self.host_output_shape()
                == TestRendererPrivateToJsonHostOutputShape::MultiChildHostText
            && self.row_matches_shape()
            && self.row_owner_matches_root()
            && self.row_handles_match_output()
            && self.row_lanes_match_commit()
            && self.public_native_package_js_surfaces_blocked()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateDirectMultiChildHostTextReconcilerInspectionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) root_scheduled_update_sequence: usize,
    pub(crate) public_surface: &'static str,
    pub(crate) source_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) source_committed_current: TestRendererFiberHandleDiagnostics,
    pub(crate) source_component_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) source_stable_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) source_placed_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) source_current_topology_recorded: bool,
    pub(crate) source_host_node_state_nodes_present: bool,
    pub(crate) inspection_shape_name: &'static str,
    pub(crate) inspection_current_shape: [&'static str; 4],
    pub(crate) inspection_store_current: TestRendererFiberHandleDiagnostics,
    pub(crate) inspection_root_child_count: usize,
    pub(crate) inspection_host_component_child_count: usize,
    pub(crate) inspection_host_text_count: usize,
    pub(crate) inspection_host_component_state_node_raw: u64,
    pub(crate) inspection_stable_text_state_node_raw: u64,
    pub(crate) inspection_placed_text_state_node_raw: u64,
    pub(crate) inspection_finished_work_after_commit_cleared: bool,
    pub(crate) inspection_finished_lanes_after_commit_bits: u32,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) source_public_serialization_blocked: bool,
    pub(crate) source_test_renderer_public_compatibility_blocked: bool,
    pub(crate) source_native_execution_blocked: bool,
    pub(crate) source_package_compatibility_blocked: bool,
    pub(crate) inspection_public_serialization_blocked: bool,
    pub(crate) inspection_test_renderer_public_compatibility_blocked: bool,
    pub(crate) inspection_native_execution_blocked: bool,
    pub(crate) inspection_package_compatibility_blocked: bool,
    pub(crate) public_native_package_js_surfaces_blocked: bool,
}

impl TestRendererPrivateDirectMultiChildHostTextReconcilerInspectionEvidence {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[cfg(test)]
    pub(crate) const fn renderer_id(self) -> TestRendererId {
        self.renderer_id
    }

    #[must_use]
    pub const fn root_scheduled_update_sequence(self) -> usize {
        self.root_scheduled_update_sequence
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.source_previous_current
    }

    #[must_use]
    pub const fn source_committed_current(self) -> TestRendererFiberHandleDiagnostics {
        self.source_committed_current
    }

    #[must_use]
    pub const fn source_component_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.source_component_fiber
    }

    #[must_use]
    pub const fn source_stable_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.source_stable_text_fiber
    }

    #[must_use]
    pub const fn source_placed_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.source_placed_text_fiber
    }

    #[must_use]
    pub const fn source_current_topology_recorded(self) -> bool {
        self.source_current_topology_recorded
    }

    #[must_use]
    pub const fn source_host_node_state_nodes_present(self) -> bool {
        self.source_host_node_state_nodes_present
    }

    #[must_use]
    pub const fn inspection_shape_name(self) -> &'static str {
        self.inspection_shape_name
    }

    #[must_use]
    pub const fn inspection_current_shape(self) -> [&'static str; 4] {
        self.inspection_current_shape
    }

    #[must_use]
    pub const fn inspection_store_current(self) -> TestRendererFiberHandleDiagnostics {
        self.inspection_store_current
    }

    #[must_use]
    pub const fn inspection_root_child_count(self) -> usize {
        self.inspection_root_child_count
    }

    #[must_use]
    pub const fn inspection_host_component_child_count(self) -> usize {
        self.inspection_host_component_child_count
    }

    #[must_use]
    pub const fn inspection_host_text_count(self) -> usize {
        self.inspection_host_text_count
    }

    #[must_use]
    pub const fn inspection_host_component_state_node_raw(self) -> u64 {
        self.inspection_host_component_state_node_raw
    }

    #[must_use]
    pub const fn inspection_stable_text_state_node_raw(self) -> u64 {
        self.inspection_stable_text_state_node_raw
    }

    #[must_use]
    pub const fn inspection_placed_text_state_node_raw(self) -> u64 {
        self.inspection_placed_text_state_node_raw
    }

    #[must_use]
    pub const fn inspection_finished_work_after_commit_cleared(self) -> bool {
        self.inspection_finished_work_after_commit_cleared
    }

    #[must_use]
    pub const fn inspection_finished_lanes_after_commit_bits(self) -> u32 {
        self.inspection_finished_lanes_after_commit_bits
    }

    #[must_use]
    pub const fn render_lanes_bits(self) -> u32 {
        self.render_lanes_bits
    }

    #[must_use]
    pub const fn commit_finished_lanes_bits(self) -> u32 {
        self.commit_finished_lanes_bits
    }

    #[must_use]
    pub fn public_native_package_js_surfaces_blocked(self) -> bool {
        self.source_public_serialization_blocked
            && self.source_test_renderer_public_compatibility_blocked
            && self.source_native_execution_blocked
            && self.source_package_compatibility_blocked
            && self.inspection_public_serialization_blocked
            && self.inspection_test_renderer_public_compatibility_blocked
            && self.inspection_native_execution_blocked
            && self.inspection_package_compatibility_blocked
            && self.public_native_package_js_surfaces_blocked
    }

    #[must_use]
    pub fn source_bound_reconciler_direct_inspection_accepted(self) -> bool {
        self.diagnostic_name()
            == TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_RECONCILER_INSPECTION_DIAGNOSTIC_NAME
            && self.status()
                == TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_RECONCILER_INSPECTION_STATUS
            && self.public_surface() == "create().update -> create().toJSON"
            && self.source_previous_current() != self.source_committed_current()
            && self.source_committed_current() == self.inspection_store_current()
            && self.source_current_topology_recorded()
            && self.source_host_node_state_nodes_present()
            && self.inspection_shape_name() == "HostRoot->HostComponent->[HostText,HostText]"
            && self.inspection_current_shape()
                == TEST_RENDERER_PRIVATE_TREE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE
            && self.inspection_root_child_count() == 1
            && self.inspection_host_component_child_count() == 2
            && self.inspection_host_text_count() == 2
            && self.inspection_host_component_state_node_raw() != 0
            && self.inspection_stable_text_state_node_raw() != 0
            && self.inspection_placed_text_state_node_raw() != 0
            && self.inspection_finished_work_after_commit_cleared()
            && self.inspection_finished_lanes_after_commit_bits() == 0
            && self.render_lanes_bits() != 0
            && self.render_lanes_bits() == self.commit_finished_lanes_bits()
            && self.source_component_fiber() != self.source_stable_text_fiber()
            && self.source_component_fiber() != self.source_placed_text_fiber()
            && self.source_stable_text_fiber() != self.source_placed_text_fiber()
            && self.public_native_package_js_surfaces_blocked()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateDirectMultiChildHostTextCommittedFiberInspection {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) renderer_id: TestRendererId,
    pub(crate) root_scheduled_update_sequence: usize,
    pub(crate) public_surface: &'static str,
    pub(crate) source_route_record_id: &'static str,
    pub(crate) source_route_status: &'static str,
    pub(crate) source_lifecycle_diagnostic_name: &'static str,
    pub(crate) source_lifecycle_status: &'static str,
    pub(crate) source_identity_diagnostic_name: &'static str,
    pub(crate) source_identity_status: &'static str,
    pub(crate) source_row_id: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) current_fiber_shape: [&'static str; 4],
    pub(crate) root_child_count: usize,
    pub(crate) host_component_child_count: usize,
    pub(crate) host_text_count: usize,
    pub(crate) render_current: TestRendererFiberHandleDiagnostics,
    pub(crate) render_finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) commit_current: TestRendererFiberHandleDiagnostics,
    pub(crate) store_current: TestRendererFiberHandleDiagnostics,
    pub(crate) host_component_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) stable_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) placed_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) stable_text_sibling: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) placed_text_sibling: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) host_component_element_type_raw: u64,
    pub(crate) host_component_props_raw: u64,
    pub(crate) stable_text_props_raw: u64,
    pub(crate) placed_text_props_raw: u64,
    pub(crate) host_component_state_node_raw: u64,
    pub(crate) placed_text_state_node_raw: u64,
    pub(crate) render_lanes_bits: u32,
    pub(crate) commit_finished_lanes_bits: u32,
    pub(crate) commit_remaining_lanes_bits: u32,
    pub(crate) commit_pending_lanes_bits: u32,
    pub(crate) route_evidence_accepted: bool,
    pub(crate) lifecycle_evidence_accepted: bool,
    pub(crate) identity_evidence_accepted: bool,
    pub(crate) row_identity_accepted: bool,
    pub(crate) source_reconciler_inspection_diagnostic_name: &'static str,
    pub(crate) source_reconciler_inspection_status: &'static str,
    pub(crate) reconciler_direct_source_recorded: bool,
    pub(crate) reconciler_direct_inspection_accepted: bool,
    pub(crate) reconciler_direct_current_topology_matches_output: bool,
    pub(crate) reconciler_direct_public_native_package_blocked: bool,
    pub(crate) current_root_matches_commit: bool,
    pub(crate) finished_work_matches_current_root: bool,
    pub(crate) lanes_match: bool,
    pub(crate) current_child_topology_matches_output: bool,
    pub(crate) placement_handoff_accepted: bool,
    pub(crate) generic_reconciler_direct_inspection_available: bool,
    pub(crate) broad_multichild_fiber_inspection_available: bool,
    pub(crate) public_to_json_available: bool,
    pub(crate) public_to_tree_available: bool,
    pub(crate) public_test_instance_available: bool,
    pub(crate) public_serialization_available: bool,
    pub(crate) public_route_available: bool,
    pub(crate) native_bridge_loading_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) js_facade_available: bool,
    pub(crate) cjs_facade_available: bool,
    pub(crate) package_compatibility_claimed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateDirectMultiChildHostTextCommittedFiberInspection {
    #[must_use]
    pub const fn diagnostic_name(self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[cfg(test)]
    pub(crate) const fn renderer_id(self) -> TestRendererId {
        self.renderer_id
    }

    #[must_use]
    pub const fn root_scheduled_update_sequence(self) -> usize {
        self.root_scheduled_update_sequence
    }

    #[must_use]
    pub const fn public_surface(self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source_route_record_id(self) -> &'static str {
        self.source_route_record_id
    }

    #[must_use]
    pub const fn source_route_status(self) -> &'static str {
        self.source_route_status
    }

    #[must_use]
    pub const fn source_lifecycle_diagnostic_name(self) -> &'static str {
        self.source_lifecycle_diagnostic_name
    }

    #[must_use]
    pub const fn source_lifecycle_status(self) -> &'static str {
        self.source_lifecycle_status
    }

    #[must_use]
    pub const fn source_identity_diagnostic_name(self) -> &'static str {
        self.source_identity_diagnostic_name
    }

    #[must_use]
    pub const fn source_identity_status(self) -> &'static str {
        self.source_identity_status
    }

    #[must_use]
    pub const fn source_row_id(self) -> &'static str {
        self.source_row_id
    }

    #[must_use]
    pub const fn host_output_update_kind(self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_shape(self) -> TestRendererPrivateToJsonHostOutputShape {
        self.host_output_shape
    }

    #[must_use]
    pub const fn current_fiber_shape(self) -> [&'static str; 4] {
        self.current_fiber_shape
    }

    #[must_use]
    pub const fn root_child_count(self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn host_component_child_count(self) -> usize {
        self.host_component_child_count
    }

    #[must_use]
    pub const fn host_text_count(self) -> usize {
        self.host_text_count
    }

    #[must_use]
    pub const fn render_current(self) -> TestRendererFiberHandleDiagnostics {
        self.render_current
    }

    #[must_use]
    pub const fn render_finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.render_finished_work
    }

    #[must_use]
    pub const fn commit_previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_previous_current
    }

    #[must_use]
    pub const fn commit_current(self) -> TestRendererFiberHandleDiagnostics {
        self.commit_current
    }

    #[must_use]
    pub const fn store_current(self) -> TestRendererFiberHandleDiagnostics {
        self.store_current
    }

    #[must_use]
    pub const fn host_component_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.host_component_fiber
    }

    #[must_use]
    pub const fn stable_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.stable_text_fiber
    }

    #[must_use]
    pub const fn placed_text_fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.placed_text_fiber
    }

    #[must_use]
    pub const fn stable_text_sibling(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.stable_text_sibling
    }

    #[must_use]
    pub const fn placed_text_sibling(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.placed_text_sibling
    }

    #[must_use]
    pub const fn host_component_element_type_raw(self) -> u64 {
        self.host_component_element_type_raw
    }

    #[must_use]
    pub const fn host_component_props_raw(self) -> u64 {
        self.host_component_props_raw
    }

    #[must_use]
    pub const fn stable_text_props_raw(self) -> u64 {
        self.stable_text_props_raw
    }

    #[must_use]
    pub const fn placed_text_props_raw(self) -> u64 {
        self.placed_text_props_raw
    }

    #[must_use]
    pub const fn host_component_state_node_raw(self) -> u64 {
        self.host_component_state_node_raw
    }

    #[must_use]
    pub const fn placed_text_state_node_raw(self) -> u64 {
        self.placed_text_state_node_raw
    }

    #[must_use]
    pub const fn render_lanes_bits(self) -> u32 {
        self.render_lanes_bits
    }

    #[must_use]
    pub const fn commit_finished_lanes_bits(self) -> u32 {
        self.commit_finished_lanes_bits
    }

    #[must_use]
    pub const fn commit_remaining_lanes_bits(self) -> u32 {
        self.commit_remaining_lanes_bits
    }

    #[must_use]
    pub const fn commit_pending_lanes_bits(self) -> u32 {
        self.commit_pending_lanes_bits
    }

    #[must_use]
    pub const fn route_evidence_accepted(self) -> bool {
        self.route_evidence_accepted
    }

    #[must_use]
    pub const fn lifecycle_evidence_accepted(self) -> bool {
        self.lifecycle_evidence_accepted
    }

    #[must_use]
    pub const fn identity_evidence_accepted(self) -> bool {
        self.identity_evidence_accepted
    }

    #[must_use]
    pub const fn row_identity_accepted(self) -> bool {
        self.row_identity_accepted
    }

    #[must_use]
    pub const fn source_reconciler_inspection_diagnostic_name(self) -> &'static str {
        self.source_reconciler_inspection_diagnostic_name
    }

    #[must_use]
    pub const fn source_reconciler_inspection_status(self) -> &'static str {
        self.source_reconciler_inspection_status
    }

    #[must_use]
    pub const fn reconciler_direct_source_recorded(self) -> bool {
        self.reconciler_direct_source_recorded
    }

    #[must_use]
    pub const fn reconciler_direct_inspection_accepted(self) -> bool {
        self.reconciler_direct_inspection_accepted
    }

    #[must_use]
    pub const fn reconciler_direct_current_topology_matches_output(self) -> bool {
        self.reconciler_direct_current_topology_matches_output
    }

    #[must_use]
    pub const fn reconciler_direct_public_native_package_blocked(self) -> bool {
        self.reconciler_direct_public_native_package_blocked
    }

    #[must_use]
    pub const fn current_root_matches_commit(self) -> bool {
        self.current_root_matches_commit
    }

    #[must_use]
    pub const fn finished_work_matches_current_root(self) -> bool {
        self.finished_work_matches_current_root
    }

    #[must_use]
    pub const fn lanes_match(self) -> bool {
        self.lanes_match
    }

    #[must_use]
    pub const fn current_child_topology_matches_output(self) -> bool {
        self.current_child_topology_matches_output
    }

    #[must_use]
    pub const fn placement_handoff_accepted(self) -> bool {
        self.placement_handoff_accepted
    }

    #[must_use]
    pub const fn generic_reconciler_direct_inspection_available(self) -> bool {
        self.generic_reconciler_direct_inspection_available
    }

    #[must_use]
    pub const fn broad_multichild_fiber_inspection_available(self) -> bool {
        self.broad_multichild_fiber_inspection_available
    }

    #[must_use]
    pub const fn public_to_json_available(self) -> bool {
        self.public_to_json_available
    }

    #[must_use]
    pub const fn public_to_tree_available(self) -> bool {
        self.public_to_tree_available
    }

    #[must_use]
    pub const fn public_test_instance_available(self) -> bool {
        self.public_test_instance_available
    }

    #[must_use]
    pub const fn public_serialization_available(self) -> bool {
        self.public_serialization_available
    }

    #[must_use]
    pub const fn public_route_available(self) -> bool {
        self.public_route_available
    }

    #[must_use]
    pub const fn native_bridge_loading_available(self) -> bool {
        self.native_bridge_loading_available
    }

    #[must_use]
    pub const fn native_bridge_available(self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution_available(self) -> bool {
        self.native_execution_available
    }

    #[must_use]
    pub const fn js_facade_available(self) -> bool {
        self.js_facade_available
    }

    #[must_use]
    pub const fn cjs_facade_available(self) -> bool {
        self.cjs_facade_available
    }

    #[must_use]
    pub const fn package_compatibility_claimed(self) -> bool {
        self.package_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }

    #[must_use]
    pub fn public_native_package_js_surfaces_blocked(self) -> bool {
        !self.public_to_json_available()
            && !self.public_to_tree_available()
            && !self.public_test_instance_available()
            && !self.public_serialization_available()
            && !self.public_route_available()
            && !self.native_bridge_loading_available()
            && !self.native_bridge_available()
            && !self.native_execution_available()
            && !self.js_facade_available()
            && !self.cjs_facade_available()
            && !self.package_compatibility_claimed()
            && !self.compatibility_claimed()
    }

    #[must_use]
    pub fn source_owned_current_fiber_inspection_accepted(self) -> bool {
        self.route_evidence_accepted()
            && self.lifecycle_evidence_accepted()
            && self.identity_evidence_accepted()
            && self.row_identity_accepted()
            && self.reconciler_direct_source_recorded()
            && self.reconciler_direct_inspection_accepted()
            && self.reconciler_direct_current_topology_matches_output()
            && self.reconciler_direct_public_native_package_blocked()
            && self.current_root_matches_commit()
            && self.finished_work_matches_current_root()
            && self.lanes_match()
            && self.current_child_topology_matches_output()
            && self.placement_handoff_accepted()
            && !self.generic_reconciler_direct_inspection_available()
            && !self.broad_multichild_fiber_inspection_available()
            && self.public_native_package_js_surfaces_blocked()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateJsonSerializationReport {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) gate: TestRendererSerializationGateReport,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_shape: TestRendererPrivateToJsonHostOutputShape,
    pub(crate) host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) root_child_count: usize,
    pub(crate) root_node_kind: TestRendererPrivateJsonNodeKind,
    pub(crate) nodes: Vec<TestRendererPrivateJsonNodeDiagnostic>,
    pub(crate) rendered_root: TestRendererPrivateJsonRenderedRoot,
    pub(crate) component: TestRendererPrivateJsonHostComponentDiagnostic,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
}

impl TestRendererPrivateJsonSerializationReport {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
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
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn root_node_kind(&self) -> TestRendererPrivateJsonNodeKind {
        self.root_node_kind
    }

    #[must_use]
    pub fn nodes(&self) -> &[TestRendererPrivateJsonNodeDiagnostic] {
        &self.nodes
    }

    #[must_use]
    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    #[must_use]
    pub const fn rendered_root(&self) -> &TestRendererPrivateJsonRenderedRoot {
        &self.rendered_root
    }

    #[must_use]
    pub const fn component(&self) -> &TestRendererPrivateJsonHostComponentDiagnostic {
        &self.component
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }
}
