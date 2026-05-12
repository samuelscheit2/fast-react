use super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateTestInstanceFindAllPredicateKind {
    Type,
    Props,
    PredicateLike,
}

impl TestRendererPrivateTestInstanceFindAllPredicateKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Type => "type",
            Self::Props => "props",
            Self::PredicateLike => "predicate-like",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
    pub(crate) predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind,
    pub(crate) source: &'static str,
    pub(crate) predicate_source: &'static str,
    pub(crate) expected_type: Option<TestElementType>,
    pub(crate) expected_props: Option<TestProps>,
    pub(crate) evaluated_fiber_tags: Vec<&'static str>,
    pub(crate) matched_fiber_tags: Vec<&'static str>,
    pub(crate) rejected_fiber_tags: Vec<&'static str>,
    pub(crate) skipped_text_child_count: usize,
    pub(crate) predicate_execution: bool,
    pub(crate) public_query_method_available: bool,
}

impl TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
    #[must_use]
    pub const fn predicate_kind(&self) -> TestRendererPrivateTestInstanceFindAllPredicateKind {
        self.predicate_kind
    }

    #[must_use]
    pub const fn source(&self) -> &'static str {
        self.source
    }

    #[must_use]
    pub const fn predicate_source(&self) -> &'static str {
        self.predicate_source
    }

    #[must_use]
    pub fn expected_type(&self) -> Option<&TestElementType> {
        self.expected_type.as_ref()
    }

    #[must_use]
    pub fn expected_props(&self) -> Option<&TestProps> {
        self.expected_props.as_ref()
    }

    #[must_use]
    pub fn evaluated_fiber_tags(&self) -> &[&'static str] {
        &self.evaluated_fiber_tags
    }

    #[must_use]
    pub fn matched_fiber_tags(&self) -> &[&'static str] {
        &self.matched_fiber_tags
    }

    #[must_use]
    pub fn rejected_fiber_tags(&self) -> &[&'static str] {
        &self.rejected_fiber_tags
    }

    #[must_use]
    pub fn evaluated_candidate_count(&self) -> usize {
        self.evaluated_fiber_tags.len()
    }

    #[must_use]
    pub fn matched_candidate_count(&self) -> usize {
        self.matched_fiber_tags.len()
    }

    #[must_use]
    pub fn rejected_candidate_count(&self) -> usize {
        self.rejected_fiber_tags.len()
    }

    #[must_use]
    pub const fn skipped_text_child_count(&self) -> usize {
        self.skipped_text_child_count
    }

    #[must_use]
    pub const fn predicate_execution(&self) -> bool {
        self.predicate_execution
    }

    #[must_use]
    pub const fn public_query_method_available(&self) -> bool {
        self.public_query_method_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceFindAllQueryDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_tree_diagnostic_name: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) traversal_source: &'static str,
    pub(crate) traversal_order: &'static str,
    pub(crate) default_deep: bool,
    pub(crate) candidate_fiber_tags: Vec<&'static str>,
    pub(crate) skipped_fiber_tags: Vec<&'static str>,
    pub(crate) type_predicate: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic,
    pub(crate) props_predicate: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic,
    pub(crate) predicate_like: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_test_instance_object_available: bool,
    pub(crate) public_query_methods_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceFindAllQueryDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
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
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn traversal_source(&self) -> &'static str {
        self.traversal_source
    }

    #[must_use]
    pub const fn traversal_order(&self) -> &'static str {
        self.traversal_order
    }

    #[must_use]
    pub const fn default_deep(&self) -> bool {
        self.default_deep
    }

    #[must_use]
    pub fn candidate_fiber_tags(&self) -> &[&'static str] {
        &self.candidate_fiber_tags
    }

    #[must_use]
    pub fn skipped_fiber_tags(&self) -> &[&'static str] {
        &self.skipped_fiber_tags
    }

    #[must_use]
    pub fn candidate_count(&self) -> usize {
        self.candidate_fiber_tags.len()
    }

    #[must_use]
    pub fn skipped_text_child_count(&self) -> usize {
        self.skipped_fiber_tags.len()
    }

    #[must_use]
    pub const fn type_predicate(
        &self,
    ) -> &TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
        &self.type_predicate
    }

    #[must_use]
    pub const fn props_predicate(
        &self,
    ) -> &TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
        &self.props_predicate
    }

    #[must_use]
    pub const fn predicate_like(
        &self,
    ) -> &TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
        &self.predicate_like
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererPrivateTestInstanceFindByQueryKind {
    Type,
    Props,
}

impl TestRendererPrivateTestInstanceFindByQueryKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Type => "findByType",
            Self::Props => "findByProps",
        }
    }

    #[must_use]
    pub const fn criteria_kind(self) -> &'static str {
        match self {
            Self::Type => "type",
            Self::Props => "props",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceFindByResultDiagnostic {
    pub(crate) query_kind: TestRendererPrivateTestInstanceFindByQueryKind,
    pub(crate) public_surface: &'static str,
    pub(crate) source: &'static str,
    pub(crate) based_on_find_all_source: &'static str,
    pub(crate) based_on_predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind,
    pub(crate) expect_one_message: String,
    pub(crate) expected_type: Option<TestElementType>,
    pub(crate) expected_props: Option<TestProps>,
    pub(crate) effective_deep: bool,
    pub(crate) expect_one: bool,
    pub(crate) result_kind: &'static str,
    pub(crate) expected_canary_match_count: usize,
    pub(crate) matched_candidate_count: usize,
    pub(crate) candidate_fiber_tags: Vec<&'static str>,
    pub(crate) traversed_candidate_fiber_tags: Vec<&'static str>,
    pub(crate) skipped_fiber_tags: Vec<&'static str>,
    pub(crate) zero_match_error_prefix: &'static str,
    pub(crate) duplicate_match_error_prefix: &'static str,
    pub(crate) predicate_execution: bool,
    pub(crate) public_query_method_available: bool,
    pub(crate) public_test_instance_object_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceFindByResultDiagnostic {
    #[must_use]
    pub const fn query_kind(&self) -> TestRendererPrivateTestInstanceFindByQueryKind {
        self.query_kind
    }

    #[must_use]
    pub const fn public_surface(&self) -> &'static str {
        self.public_surface
    }

    #[must_use]
    pub const fn source(&self) -> &'static str {
        self.source
    }

    #[must_use]
    pub const fn based_on_find_all_source(&self) -> &'static str {
        self.based_on_find_all_source
    }

    #[must_use]
    pub const fn based_on_predicate_kind(
        &self,
    ) -> TestRendererPrivateTestInstanceFindAllPredicateKind {
        self.based_on_predicate_kind
    }

    #[must_use]
    pub fn expect_one_message(&self) -> &str {
        &self.expect_one_message
    }

    #[must_use]
    pub fn expected_type(&self) -> Option<&TestElementType> {
        self.expected_type.as_ref()
    }

    #[must_use]
    pub fn expected_props(&self) -> Option<&TestProps> {
        self.expected_props.as_ref()
    }

    #[must_use]
    pub const fn effective_deep(&self) -> bool {
        self.effective_deep
    }

    #[must_use]
    pub const fn expect_one(&self) -> bool {
        self.expect_one
    }

    #[must_use]
    pub const fn result_kind(&self) -> &'static str {
        self.result_kind
    }

    #[must_use]
    pub const fn expected_canary_match_count(&self) -> usize {
        self.expected_canary_match_count
    }

    #[must_use]
    pub const fn matched_candidate_count(&self) -> usize {
        self.matched_candidate_count
    }

    #[must_use]
    pub fn candidate_fiber_tags(&self) -> &[&'static str] {
        &self.candidate_fiber_tags
    }

    #[must_use]
    pub fn traversed_candidate_fiber_tags(&self) -> &[&'static str] {
        &self.traversed_candidate_fiber_tags
    }

    #[must_use]
    pub fn skipped_fiber_tags(&self) -> &[&'static str] {
        &self.skipped_fiber_tags
    }

    #[must_use]
    pub const fn zero_match_error_prefix(&self) -> &'static str {
        self.zero_match_error_prefix
    }

    #[must_use]
    pub const fn duplicate_match_error_prefix(&self) -> &'static str {
        self.duplicate_match_error_prefix
    }

    #[must_use]
    pub const fn predicate_execution(&self) -> bool {
        self.predicate_execution
    }

    #[must_use]
    pub const fn public_query_method_available(&self) -> bool {
        self.public_query_method_available
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceFindByQueryDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_find_all_diagnostic_name: &'static str,
    pub(crate) source_tree_diagnostic_name: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) source: &'static str,
    pub(crate) accepted_find_all_traversal_source: &'static str,
    pub(crate) effective_deep: bool,
    pub(crate) expect_one: bool,
    pub(crate) find_all_candidate_fiber_tags: Vec<&'static str>,
    pub(crate) find_all_skipped_fiber_tags: Vec<&'static str>,
    pub(crate) find_by_type: TestRendererPrivateTestInstanceFindByResultDiagnostic,
    pub(crate) find_by_props: TestRendererPrivateTestInstanceFindByResultDiagnostic,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_test_instance_object_available: bool,
    pub(crate) public_query_methods_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceFindByQueryDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_find_all_diagnostic_name(&self) -> &'static str {
        self.source_find_all_diagnostic_name
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
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn source(&self) -> &'static str {
        self.source
    }

    #[must_use]
    pub const fn accepted_find_all_traversal_source(&self) -> &'static str {
        self.accepted_find_all_traversal_source
    }

    #[must_use]
    pub const fn effective_deep(&self) -> bool {
        self.effective_deep
    }

    #[must_use]
    pub const fn expect_one(&self) -> bool {
        self.expect_one
    }

    #[must_use]
    pub fn find_all_candidate_fiber_tags(&self) -> &[&'static str] {
        &self.find_all_candidate_fiber_tags
    }

    #[must_use]
    pub fn find_all_skipped_fiber_tags(&self) -> &[&'static str] {
        &self.find_all_skipped_fiber_tags
    }

    #[must_use]
    pub const fn find_by_type(&self) -> &TestRendererPrivateTestInstanceFindByResultDiagnostic {
        &self.find_by_type
    }

    #[must_use]
    pub const fn find_by_props(&self) -> &TestRendererPrivateTestInstanceFindByResultDiagnostic {
        &self.find_by_props
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_find_all_diagnostic_name: &'static str,
    pub(crate) source_find_by_diagnostic_name: &'static str,
    pub(crate) bridge_status: &'static str,
    pub(crate) bridge_source: &'static str,
    pub(crate) wrapper_record_symbol: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) accepted_find_all_traversal_source: &'static str,
    pub(crate) accepted_find_by_source: &'static str,
    pub(crate) find_all_candidate_fiber_tags: Vec<&'static str>,
    pub(crate) find_all_skipped_fiber_tags: Vec<&'static str>,
    pub(crate) find_by_queries: Vec<&'static str>,
    pub(crate) consumes_accepted_find_all_diagnostics: bool,
    pub(crate) consumes_accepted_find_by_diagnostics: bool,
    pub(crate) record_only_diagnostic_consumption: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution: bool,
    pub(crate) rust_execution_from_js: bool,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_root_available: bool,
    pub(crate) public_test_instance_object_available: bool,
    pub(crate) public_query_methods_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_find_all_diagnostic_name(&self) -> &'static str {
        self.source_find_all_diagnostic_name
    }

    #[must_use]
    pub const fn source_find_by_diagnostic_name(&self) -> &'static str {
        self.source_find_by_diagnostic_name
    }

    #[must_use]
    pub const fn bridge_status(&self) -> &'static str {
        self.bridge_status
    }

    #[must_use]
    pub const fn bridge_source(&self) -> &'static str {
        self.bridge_source
    }

    #[must_use]
    pub const fn wrapper_record_symbol(&self) -> &'static str {
        self.wrapper_record_symbol
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn accepted_find_all_traversal_source(&self) -> &'static str {
        self.accepted_find_all_traversal_source
    }

    #[must_use]
    pub const fn accepted_find_by_source(&self) -> &'static str {
        self.accepted_find_by_source
    }

    #[must_use]
    pub fn find_all_candidate_fiber_tags(&self) -> &[&'static str] {
        &self.find_all_candidate_fiber_tags
    }

    #[must_use]
    pub fn find_all_skipped_fiber_tags(&self) -> &[&'static str] {
        &self.find_all_skipped_fiber_tags
    }

    #[must_use]
    pub fn find_by_queries(&self) -> &[&'static str] {
        &self.find_by_queries
    }

    #[must_use]
    pub const fn consumes_accepted_find_all_diagnostics(&self) -> bool {
        self.consumes_accepted_find_all_diagnostics
    }

    #[must_use]
    pub const fn consumes_accepted_find_by_diagnostics(&self) -> bool {
        self.consumes_accepted_find_by_diagnostics
    }

    #[must_use]
    pub const fn record_only_diagnostic_consumption(&self) -> bool {
        self.record_only_diagnostic_consumption
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn native_execution(&self) -> bool {
        self.native_execution
    }

    #[must_use]
    pub const fn rust_execution_from_js(&self) -> bool {
        self.rust_execution_from_js
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_root_available(&self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateTestInstanceNativeQueryExecutionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) source_query_diagnostic_name: &'static str,
    pub(crate) query_bridge_preflight_status: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) query_surface: &'static str,
    pub(crate) query_kind: TestRendererPrivateTestInstanceFindByQueryKind,
    pub(crate) expected_type: TestElementType,
    pub(crate) result_fiber_tag: &'static str,
    pub(crate) result_kind: &'static str,
    pub(crate) matched_candidate_count: usize,
    pub(crate) query_path_candidate_count: usize,
    pub(crate) skipped_text_child_count: usize,
    pub(crate) consumes_accepted_native_create_execution_record: bool,
    pub(crate) consumes_accepted_native_update_execution_record: bool,
    pub(crate) consumes_private_test_instance_query_diagnostics: bool,
    pub(crate) consumes_query_bridge_preflight: bool,
    pub(crate) consumes_accepted_find_all_diagnostics: bool,
    pub(crate) consumes_accepted_find_by_diagnostics: bool,
    pub(crate) minimal_host_component_query_path: bool,
    pub(crate) public_root_available: bool,
    pub(crate) public_query_methods_available: bool,
    pub(crate) public_test_instance_object_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceNativeQueryExecutionEvidence {
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
    pub const fn source_query_diagnostic_name(&self) -> &'static str {
        self.source_query_diagnostic_name
    }

    #[must_use]
    pub const fn query_bridge_preflight_status(&self) -> &'static str {
        self.query_bridge_preflight_status
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn query_surface(&self) -> &'static str {
        self.query_surface
    }

    #[must_use]
    pub const fn query_kind(&self) -> TestRendererPrivateTestInstanceFindByQueryKind {
        self.query_kind
    }

    #[must_use]
    pub const fn expected_type(&self) -> &TestElementType {
        &self.expected_type
    }

    #[must_use]
    pub const fn result_fiber_tag(&self) -> &'static str {
        self.result_fiber_tag
    }

    #[must_use]
    pub const fn result_kind(&self) -> &'static str {
        self.result_kind
    }

    #[must_use]
    pub const fn matched_candidate_count(&self) -> usize {
        self.matched_candidate_count
    }

    #[must_use]
    pub const fn query_path_candidate_count(&self) -> usize {
        self.query_path_candidate_count
    }

    #[must_use]
    pub const fn skipped_text_child_count(&self) -> usize {
        self.skipped_text_child_count
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
    pub const fn consumes_private_test_instance_query_diagnostics(&self) -> bool {
        self.consumes_private_test_instance_query_diagnostics
    }

    #[must_use]
    pub const fn consumes_query_bridge_preflight(&self) -> bool {
        self.consumes_query_bridge_preflight
    }

    #[must_use]
    pub const fn consumes_accepted_find_all_diagnostics(&self) -> bool {
        self.consumes_accepted_find_all_diagnostics
    }

    #[must_use]
    pub const fn consumes_accepted_find_by_diagnostics(&self) -> bool {
        self.consumes_accepted_find_by_diagnostics
    }

    #[must_use]
    pub const fn minimal_host_component_query_path(&self) -> bool {
        self.minimal_host_component_query_path
    }

    #[must_use]
    pub const fn public_root_available(&self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
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
pub struct TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) root: FiberRootId,
    pub(crate) operation: &'static str,
    pub(crate) public_surface: &'static str,
    pub(crate) source_execution_record_id: &'static str,
    pub(crate) source_execution_status: &'static str,
    pub(crate) source_query_diagnostic_name: &'static str,
    pub(crate) source_get_instance_diagnostic_name: &'static str,
    pub(crate) query_bridge_preflight_status: &'static str,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) accepted_class_fiber_shape: [&'static str; 4],
    pub(crate) root_query_surface: &'static str,
    pub(crate) root_result_fiber_tag: &'static str,
    pub(crate) root_component_type: &'static str,
    pub(crate) root_props: TestProps,
    pub(crate) root_child_count: usize,
    pub(crate) child_query_surface: &'static str,
    pub(crate) child_query_kind: TestRendererPrivateTestInstanceFindByQueryKind,
    pub(crate) child_fiber_tag: &'static str,
    pub(crate) child_element_type: TestElementType,
    pub(crate) child_props: TestProps,
    pub(crate) previous_child_text: String,
    pub(crate) current_child_text: String,
    pub(crate) host_child_updated: bool,
    pub(crate) class_root_query_path: Vec<&'static str>,
    pub(crate) updated_host_child_query_path: Vec<&'static str>,
    pub(crate) consumes_accepted_native_update_execution_record: bool,
    pub(crate) consumes_private_test_instance_query_diagnostics: bool,
    pub(crate) consumes_query_bridge_preflight: bool,
    pub(crate) consumes_private_get_instance_class_root_diagnostics: bool,
    pub(crate) public_root_available: bool,
    pub(crate) public_query_methods_available: bool,
    pub(crate) public_test_instance_object_available: bool,
    pub(crate) public_get_instance_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) native_execution_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence {
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
    pub const fn source_query_diagnostic_name(&self) -> &'static str {
        self.source_query_diagnostic_name
    }

    #[must_use]
    pub const fn source_get_instance_diagnostic_name(&self) -> &'static str {
        self.source_get_instance_diagnostic_name
    }

    #[must_use]
    pub const fn query_bridge_preflight_status(&self) -> &'static str {
        self.query_bridge_preflight_status
    }

    #[must_use]
    pub const fn host_output_update_kind(&self) -> TestRendererRootUpdateKind {
        self.host_output_update_kind
    }

    #[must_use]
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn accepted_class_fiber_shape(&self) -> &[&'static str; 4] {
        &self.accepted_class_fiber_shape
    }

    #[must_use]
    pub const fn root_query_surface(&self) -> &'static str {
        self.root_query_surface
    }

    #[must_use]
    pub const fn root_result_fiber_tag(&self) -> &'static str {
        self.root_result_fiber_tag
    }

    #[must_use]
    pub const fn root_component_type(&self) -> &'static str {
        self.root_component_type
    }

    #[must_use]
    pub const fn root_props(&self) -> &TestProps {
        &self.root_props
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn child_query_surface(&self) -> &'static str {
        self.child_query_surface
    }

    #[must_use]
    pub const fn child_query_kind(&self) -> TestRendererPrivateTestInstanceFindByQueryKind {
        self.child_query_kind
    }

    #[must_use]
    pub const fn child_fiber_tag(&self) -> &'static str {
        self.child_fiber_tag
    }

    #[must_use]
    pub const fn child_element_type(&self) -> &TestElementType {
        &self.child_element_type
    }

    #[must_use]
    pub const fn child_props(&self) -> &TestProps {
        &self.child_props
    }

    #[must_use]
    pub fn previous_child_text(&self) -> &str {
        &self.previous_child_text
    }

    #[must_use]
    pub fn current_child_text(&self) -> &str {
        &self.current_child_text
    }

    #[must_use]
    pub const fn host_child_updated(&self) -> bool {
        self.host_child_updated
    }

    #[must_use]
    pub fn class_root_query_path(&self) -> &[&'static str] {
        &self.class_root_query_path
    }

    #[must_use]
    pub fn updated_host_child_query_path(&self) -> &[&'static str] {
        &self.updated_host_child_query_path
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution_record(&self) -> bool {
        self.consumes_accepted_native_update_execution_record
    }

    #[must_use]
    pub const fn consumes_private_test_instance_query_diagnostics(&self) -> bool {
        self.consumes_private_test_instance_query_diagnostics
    }

    #[must_use]
    pub const fn consumes_query_bridge_preflight(&self) -> bool {
        self.consumes_query_bridge_preflight
    }

    #[must_use]
    pub const fn consumes_private_get_instance_class_root_diagnostics(&self) -> bool {
        self.consumes_private_get_instance_class_root_diagnostics
    }

    #[must_use]
    pub const fn public_root_available(&self) -> bool {
        self.public_root_available
    }

    #[must_use]
    pub const fn public_query_methods_available(&self) -> bool {
        self.public_query_methods_available
    }

    #[must_use]
    pub const fn public_test_instance_object_available(&self) -> bool {
        self.public_test_instance_object_available
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
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
pub struct TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
    pub(crate) root_fiber_shape: [&'static str; 2],
    pub(crate) root_child_fiber_tag: &'static str,
    pub(crate) react_public_result: &'static str,
    pub(crate) public_get_instance_available: bool,
    pub(crate) private_class_instance_available: bool,
    pub(crate) public_behavior_fail_closed: bool,
}

impl TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
    #[must_use]
    pub const fn root_fiber_shape(&self) -> &[&'static str; 2] {
        &self.root_fiber_shape
    }

    #[must_use]
    pub const fn root_child_fiber_tag(&self) -> &'static str {
        self.root_child_fiber_tag
    }

    #[must_use]
    pub const fn react_public_result(&self) -> &'static str {
        self.react_public_result
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }

    #[must_use]
    pub const fn private_class_instance_available(&self) -> bool {
        self.private_class_instance_available
    }

    #[must_use]
    pub const fn public_behavior_fail_closed(&self) -> bool {
        self.public_behavior_fail_closed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateGetInstanceClassInstanceDiagnostic {
    pub(crate) constructor_name: &'static str,
    pub(crate) props: TestProps,
    pub(crate) state_marker: &'static str,
    pub(crate) private_instance_available: bool,
    pub(crate) public_get_instance_available: bool,
    pub(crate) react_public_result: &'static str,
}

impl TestRendererPrivateGetInstanceClassInstanceDiagnostic {
    #[must_use]
    pub const fn constructor_name(&self) -> &'static str {
        self.constructor_name
    }

    #[must_use]
    pub const fn props(&self) -> &TestProps {
        &self.props
    }

    #[must_use]
    pub const fn state_marker(&self) -> &'static str {
        self.state_marker
    }

    #[must_use]
    pub const fn private_instance_available(&self) -> bool {
        self.private_instance_available
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }

    #[must_use]
    pub const fn react_public_result(&self) -> &'static str {
        self.react_public_result
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateGetInstanceClassComponentDiagnostic {
    pub(crate) fiber_tag: &'static str,
    pub(crate) component_type: &'static str,
    pub(crate) props: TestProps,
    pub(crate) state_node_available: bool,
    pub(crate) rendered_child_fiber_tag: &'static str,
    pub(crate) rendered_child_count: usize,
    pub(crate) instance: TestRendererPrivateGetInstanceClassInstanceDiagnostic,
    pub(crate) public_get_instance_available: bool,
}

impl TestRendererPrivateGetInstanceClassComponentDiagnostic {
    #[must_use]
    pub const fn fiber_tag(&self) -> &'static str {
        self.fiber_tag
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
    pub const fn state_node_available(&self) -> bool {
        self.state_node_available
    }

    #[must_use]
    pub const fn rendered_child_fiber_tag(&self) -> &'static str {
        self.rendered_child_fiber_tag
    }

    #[must_use]
    pub const fn rendered_child_count(&self) -> usize {
        self.rendered_child_count
    }

    #[must_use]
    pub const fn instance(&self) -> &TestRendererPrivateGetInstanceClassInstanceDiagnostic {
        &self.instance
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateGetInstanceClassRootReport {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) source_tree_diagnostic_name: &'static str,
    pub(crate) gate: TestRendererSerializationGateReport,
    pub(crate) host_output_update_kind: TestRendererRootUpdateKind,
    pub(crate) host_output_snapshot_current: bool,
    pub(crate) accepted_class_fiber_shape: [&'static str; 4],
    pub(crate) host_root_fail_closed: TestRendererPrivateGetInstanceFailClosedRootDiagnostic,
    pub(crate) function_root_fail_closed: TestRendererPrivateGetInstanceFailClosedRootDiagnostic,
    pub(crate) class_component: TestRendererPrivateGetInstanceClassComponentDiagnostic,
    pub(crate) rendered_host_component: TestRendererPrivateTreeHostComponentDiagnostic,
    pub(crate) rendered_host_text: TestRendererPrivateTreeHostTextDiagnostic,
    pub(crate) public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers,
    pub(crate) public_get_instance_available: bool,
    pub(crate) native_bridge_available: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateGetInstanceClassRootReport {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn source_tree_diagnostic_name(&self) -> &'static str {
        self.source_tree_diagnostic_name
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
    pub const fn host_output_snapshot_current(&self) -> bool {
        self.host_output_snapshot_current
    }

    #[must_use]
    pub const fn accepted_class_fiber_shape(&self) -> &[&'static str; 4] {
        &self.accepted_class_fiber_shape
    }

    #[must_use]
    pub const fn host_root_fail_closed(
        &self,
    ) -> &TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
        &self.host_root_fail_closed
    }

    #[must_use]
    pub const fn function_root_fail_closed(
        &self,
    ) -> &TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
        &self.function_root_fail_closed
    }

    #[must_use]
    pub const fn class_component(&self) -> &TestRendererPrivateGetInstanceClassComponentDiagnostic {
        &self.class_component
    }

    #[must_use]
    pub const fn rendered_host_component(&self) -> &TestRendererPrivateTreeHostComponentDiagnostic {
        &self.rendered_host_component
    }

    #[must_use]
    pub const fn rendered_host_text(&self) -> &TestRendererPrivateTreeHostTextDiagnostic {
        &self.rendered_host_text
    }

    #[must_use]
    pub const fn public_blockers(&self) -> TestRendererPrivateJsonPublicSurfaceBlockers {
        self.public_blockers
    }

    #[must_use]
    pub const fn public_get_instance_available(&self) -> bool {
        self.public_get_instance_available
    }

    #[must_use]
    pub const fn native_bridge_available(&self) -> bool {
        self.native_bridge_available
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}
