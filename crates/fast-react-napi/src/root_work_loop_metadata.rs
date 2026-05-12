//! Private root work-loop finished-work metadata value shape.
//!
//! This mirrors the existing Node loader canary shape without loading the
//! native addon or calling Node-API. The diagnostic-backed builder consumes a
//! private reconciler probe and only copies primitive evidence into this shape.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::Lanes;

pub(crate) const ROOT_WORK_LOOP_FINISHED_WORK_METADATA_SOURCE: &str =
    "fast-react-reconciler.root-work-loop.finished-work-handoff";
pub(crate) const ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS: &str =
    "accepted-private-root-work-loop-finished-work-handoff-metadata";
pub(crate) const ROOT_WORK_LOOP_FINISHED_WORK_METADATA_REVISION: &str =
    "root-work-loop-finished-work-handoff-2026-05-10";

const HOST_TYPE_DIV: &str = "div";
const TEXT_CONTENT_TEXT: &str = "text";
const HOST_OUTPUT_SHAPE_HOST_COMPONENT: &str = "host-component";
const HOST_COMPONENT_TAG: &str = "HostComponent";
const HOST_TEXT_TAG: &str = "HostText";
const DEFAULT_LANES: &str = "Default";
const NO_LANES: &str = "NoLanes";
const PLACEMENT_APPLY_KIND_APPEND_TO_CONTAINER: &str = "append-placement-to-container";
const SIBLING_STATUS_APPEND: &str = "append";
const EXPECTED_HOST_COMPONENT_COUNT: usize = 1;
const EXPECTED_HOST_TEXT_COUNT: usize = 1;
const EXPECTED_DETACHED_INSTANCE_COUNT: usize = 1;
const EXPECTED_DETACHED_TEXT_COUNT: usize = 1;
const EXPECTED_HOST_NODE_COUNT_AFTER_COMPLETE_WORK: usize = 2;
const EXPECTED_HOST_NODE_COUNT_AFTER_PLACEMENT: usize = 0;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootWorkLoopFinishedWorkMetadata {
    facade: RootWorkLoopFinishedWorkMetadataFacade,
    complete_work: RootWorkLoopFinishedWorkCompleteWorkMetadata,
    pending: RootWorkLoopFinishedWorkPendingMetadata,
    commit: RootWorkLoopFinishedWorkCommitMetadata,
    placement: RootWorkLoopFinishedWorkPlacementMetadata,
}

impl RootWorkLoopFinishedWorkMetadata {
    #[must_use]
    pub(crate) fn source(&self) -> &'static str {
        ROOT_WORK_LOOP_FINISHED_WORK_METADATA_SOURCE
    }

    #[must_use]
    pub(crate) fn status(&self) -> &'static str {
        ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS
    }

    #[must_use]
    pub(crate) fn metadata_revision(&self) -> &'static str {
        ROOT_WORK_LOOP_FINISHED_WORK_METADATA_REVISION
    }

    #[must_use]
    pub(crate) const fn facade(&self) -> &RootWorkLoopFinishedWorkMetadataFacade {
        &self.facade
    }

    #[must_use]
    pub(crate) const fn complete_work(&self) -> &RootWorkLoopFinishedWorkCompleteWorkMetadata {
        &self.complete_work
    }

    #[must_use]
    pub(crate) const fn pending(&self) -> &RootWorkLoopFinishedWorkPendingMetadata {
        &self.pending
    }

    #[must_use]
    pub(crate) const fn commit(&self) -> &RootWorkLoopFinishedWorkCommitMetadata {
        &self.commit
    }

    #[must_use]
    pub(crate) const fn placement(&self) -> &RootWorkLoopFinishedWorkPlacementMetadata {
        &self.placement
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootWorkLoopFinishedWorkMetadataFacade {
    root_id: String,
    root_tag: String,
    render_update_id: String,
    host_type: &'static str,
    host_output_shape: &'static str,
    host_component_count: u32,
    host_text_count: u32,
    text_content: String,
}

impl RootWorkLoopFinishedWorkMetadataFacade {
    #[must_use]
    pub(crate) fn root_id(&self) -> &str {
        &self.root_id
    }

    #[must_use]
    pub(crate) fn root_tag(&self) -> &str {
        &self.root_tag
    }

    #[must_use]
    pub(crate) fn render_update_id(&self) -> &str {
        &self.render_update_id
    }

    #[must_use]
    pub(crate) const fn host_type(&self) -> &'static str {
        self.host_type
    }

    #[must_use]
    pub(crate) const fn host_output_shape(&self) -> &'static str {
        self.host_output_shape
    }

    #[must_use]
    pub(crate) const fn host_component_count(&self) -> u32 {
        self.host_component_count
    }

    #[must_use]
    pub(crate) const fn host_text_count(&self) -> u32 {
        self.host_text_count
    }

    #[must_use]
    pub(crate) fn text_content(&self) -> &str {
        &self.text_content
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootWorkLoopFinishedWorkCompleteWorkMetadata {
    root_child_tag: &'static str,
    completed_child_tag: &'static str,
    host_text_child_tag: &'static str,
    child_tags: [&'static str; 2],
}

impl RootWorkLoopFinishedWorkCompleteWorkMetadata {
    #[must_use]
    pub(crate) const fn root_child_tag(self) -> &'static str {
        self.root_child_tag
    }

    #[must_use]
    pub(crate) const fn completed_child_tag(self) -> &'static str {
        self.completed_child_tag
    }

    #[must_use]
    pub(crate) const fn host_text_child_tag(self) -> &'static str {
        self.host_text_child_tag
    }

    #[must_use]
    pub(crate) const fn child_tags(self) -> [&'static str; 2] {
        self.child_tags
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootWorkLoopFinishedWorkPendingMetadata {
    records_finished_work: bool,
    pending_work_matches_finished_work: bool,
    render_lanes: &'static str,
    finished_lanes: &'static str,
    remaining_lanes: &'static str,
}

impl RootWorkLoopFinishedWorkPendingMetadata {
    #[must_use]
    pub(crate) const fn records_finished_work(self) -> bool {
        self.records_finished_work
    }

    #[must_use]
    pub(crate) const fn pending_work_matches_finished_work(self) -> bool {
        self.pending_work_matches_finished_work
    }

    #[must_use]
    pub(crate) const fn render_lanes(self) -> &'static str {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn finished_lanes(self) -> &'static str {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(self) -> &'static str {
        self.remaining_lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootWorkLoopFinishedWorkCommitMetadata {
    commit_order_after_pending_record: bool,
    consumed_finished_work_record: bool,
    finished_work_after_commit: Option<&'static str>,
    finished_lanes_after_commit: &'static str,
    render_phase_work_after_commit: Option<&'static str>,
    mutation_execution_blocked: bool,
    public_root_rendering_blocked: bool,
    effects_refs_and_hydration_blocked: bool,
}

impl RootWorkLoopFinishedWorkCommitMetadata {
    #[must_use]
    pub(crate) const fn commit_order_after_pending_record(self) -> bool {
        self.commit_order_after_pending_record
    }

    #[must_use]
    pub(crate) const fn consumed_finished_work_record(self) -> bool {
        self.consumed_finished_work_record
    }

    #[must_use]
    pub(crate) const fn finished_work_after_commit(self) -> Option<&'static str> {
        self.finished_work_after_commit
    }

    #[must_use]
    pub(crate) const fn finished_lanes_after_commit(self) -> &'static str {
        self.finished_lanes_after_commit
    }

    #[must_use]
    pub(crate) const fn render_phase_work_after_commit(self) -> Option<&'static str> {
        self.render_phase_work_after_commit
    }

    #[must_use]
    pub(crate) const fn mutation_execution_blocked(self) -> bool {
        self.mutation_execution_blocked
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(self) -> bool {
        self.public_root_rendering_blocked
    }

    #[must_use]
    pub(crate) const fn effects_refs_and_hydration_blocked(self) -> bool {
        self.effects_refs_and_hydration_blocked
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootWorkLoopFinishedWorkPlacementMetadata {
    tag: &'static str,
    apply_kind: String,
    sibling_status: &'static str,
}

impl RootWorkLoopFinishedWorkPlacementMetadata {
    #[must_use]
    pub(crate) const fn tag(&self) -> &'static str {
        self.tag
    }

    #[must_use]
    pub(crate) fn apply_kind(&self) -> &str {
        &self.apply_kind
    }

    #[must_use]
    pub(crate) const fn sibling_status(&self) -> &'static str {
        self.sibling_status
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum RootWorkLoopFinishedWorkMetadataError {
    EmptyCallerId {
        field: &'static str,
    },
    UnsupportedHostType {
        actual: String,
    },
    UnsupportedTextContent {
        actual: String,
    },
    UnsupportedPlacementApplyKind {
        actual: String,
    },
    UnsupportedDiagnosticValue {
        field: &'static str,
        expected: &'static str,
        actual: String,
    },
    UnprovenDiagnostic {
        field: &'static str,
    },
    DiagnosticPublicCompatibilityClaim {
        field: &'static str,
    },
}

impl Display for RootWorkLoopFinishedWorkMetadataError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyCallerId { field } => write!(
                formatter,
                "native root work-loop finished-work metadata canary requires non-empty {field}"
            ),
            Self::UnsupportedHostType { actual } => write!(
                formatter,
                "native root work-loop finished-work metadata canary only supports host_type \"div\", got {actual:?}"
            ),
            Self::UnsupportedTextContent { actual } => write!(
                formatter,
                "native root work-loop finished-work metadata canary only supports text_content \"text\", got {actual:?}"
            ),
            Self::UnsupportedPlacementApplyKind { actual } => write!(
                formatter,
                "native root work-loop finished-work metadata canary only supports placement apply kind \"append-placement-to-container\", got {actual:?}"
            ),
            Self::UnsupportedDiagnosticValue {
                field,
                expected,
                actual,
            } => write!(
                formatter,
                "native root work-loop finished-work metadata canary expected diagnostic {field} {expected:?}, got {actual:?}"
            ),
            Self::UnprovenDiagnostic { field } => write!(
                formatter,
                "native root work-loop finished-work metadata canary requires proven diagnostic field {field}"
            ),
            Self::DiagnosticPublicCompatibilityClaim { field } => write!(
                formatter,
                "native root work-loop finished-work metadata canary rejects public compatibility claim field {field}"
            ),
        }
    }
}

impl Error for RootWorkLoopFinishedWorkMetadataError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootWorkLoopFinishedWorkDiagnosticEvidence {
    text_content: String,
    render_lanes_bits: u32,
    root_child_count: usize,
    component_child_count: usize,
    detached_instance_count: usize,
    detached_text_count: usize,
    host_node_count_after_complete_work: usize,
    host_node_count_after_placement: usize,
    placement_mutation_kind: String,
    prepared_for_commit: bool,
    appended_child_to_container: bool,
    reset_after_commit: bool,
    private_root_placement_only: bool,
    host_mutation_gate_blockers_intact: bool,
    host_mutation_execution_blocked: bool,
    production_host_mutation_apply_promoted: bool,
    render_complete_handoff_proven: bool,
    private_render_complete_placement_proven: bool,
    public_dom_compatibility_claimed: bool,
    public_root_rendering_claimed: bool,
    public_root_rendering_blocked: bool,
    public_compatibility_blocked: bool,
    public_renderer_package_behavior_exposed: bool,
    react_dom_compatibility_claimed: bool,
    test_renderer_compatibility_claimed: bool,
}

impl RootWorkLoopFinishedWorkDiagnosticEvidence {
    pub(crate) fn from_private_reconciler_diagnostic(
        diagnostic: &fast_react_reconciler::MinimalHostRootRenderCompletePlacementDiagnostic,
    ) -> Self {
        Self {
            text_content: diagnostic.text_content().to_owned(),
            render_lanes_bits: diagnostic.render_lanes_bits(),
            root_child_count: diagnostic.root_child_count(),
            component_child_count: diagnostic.component_child_count(),
            detached_instance_count: diagnostic.detached_instance_count(),
            detached_text_count: diagnostic.detached_text_count(),
            host_node_count_after_complete_work: diagnostic.host_node_count_after_complete_work(),
            host_node_count_after_placement: diagnostic.host_node_count_after_placement(),
            placement_mutation_kind: diagnostic.placement_mutation_kind().to_owned(),
            prepared_for_commit: diagnostic.prepared_for_commit(),
            appended_child_to_container: diagnostic.appended_child_to_container(),
            reset_after_commit: diagnostic.reset_after_commit(),
            private_root_placement_only: diagnostic.private_root_placement_only(),
            host_mutation_gate_blockers_intact: diagnostic.host_mutation_gate_blockers_intact(),
            host_mutation_execution_blocked: diagnostic.host_mutation_execution_blocked(),
            production_host_mutation_apply_promoted: diagnostic
                .production_host_mutation_apply_promoted(),
            render_complete_handoff_proven: diagnostic.render_complete_handoff_proven(),
            private_render_complete_placement_proven: diagnostic
                .private_render_complete_placement_proven(),
            public_dom_compatibility_claimed: diagnostic.public_dom_compatibility_claimed(),
            public_root_rendering_claimed: diagnostic.public_root_rendering_claimed(),
            public_root_rendering_blocked: diagnostic.public_root_rendering_blocked(),
            public_compatibility_blocked: diagnostic.public_compatibility_blocked(),
            public_renderer_package_behavior_exposed: diagnostic
                .public_renderer_package_behavior_exposed(),
            react_dom_compatibility_claimed: diagnostic.react_dom_compatibility_claimed(),
            test_renderer_compatibility_claimed: diagnostic.test_renderer_compatibility_claimed(),
        }
    }
}

#[cfg(test)]
impl RootWorkLoopFinishedWorkDiagnosticEvidence {
    pub(crate) fn with_placement_mutation_kind_for_test(
        mut self,
        placement_mutation_kind: impl Into<String>,
    ) -> Self {
        self.placement_mutation_kind = placement_mutation_kind.into();
        self
    }

    pub(crate) fn with_text_content_for_test(mut self, text_content: impl Into<String>) -> Self {
        self.text_content = text_content.into();
        self
    }

    pub(crate) const fn with_root_child_count_for_test(mut self, root_child_count: usize) -> Self {
        self.root_child_count = root_child_count;
        self
    }

    pub(crate) const fn with_component_child_count_for_test(
        mut self,
        component_child_count: usize,
    ) -> Self {
        self.component_child_count = component_child_count;
        self
    }

    pub(crate) const fn with_host_mutation_execution_blocked_for_test(
        mut self,
        host_mutation_execution_blocked: bool,
    ) -> Self {
        self.host_mutation_execution_blocked = host_mutation_execution_blocked;
        self
    }

    pub(crate) const fn with_public_dom_compatibility_claimed_for_test(
        mut self,
        public_dom_compatibility_claimed: bool,
    ) -> Self {
        self.public_dom_compatibility_claimed = public_dom_compatibility_claimed;
        self
    }
}

pub(crate) fn root_work_loop_finished_work_metadata_for_canary(
    root_id: impl Into<String>,
    root_tag: impl Into<String>,
    render_update_id: impl Into<String>,
    host_type: &str,
    text_content: &str,
    placement_apply_kind: impl Into<String>,
) -> Result<RootWorkLoopFinishedWorkMetadata, RootWorkLoopFinishedWorkMetadataError> {
    let root_id = non_empty_caller_id(root_id.into(), "root_id")?;
    let root_tag = non_empty_caller_id(root_tag.into(), "root_tag")?;
    let render_update_id = non_empty_caller_id(render_update_id.into(), "render_update_id")?;
    let placement_apply_kind = placement_apply_kind.into();

    validate_host_type(host_type)?;
    validate_text_content(text_content)?;
    validate_placement_apply_kind(&placement_apply_kind)?;

    Ok(root_work_loop_finished_work_metadata_from_accepted_values(
        root_id,
        root_tag,
        render_update_id,
        EXPECTED_HOST_COMPONENT_COUNT as u32,
        EXPECTED_HOST_TEXT_COUNT as u32,
        TEXT_CONTENT_TEXT.to_owned(),
        placement_apply_kind,
        true,
        true,
        true,
    ))
}

pub(crate) fn root_work_loop_finished_work_metadata_from_private_reconciler_diagnostic_for_canary(
    root_id: impl Into<String>,
    root_tag: impl Into<String>,
    render_update_id: impl Into<String>,
    host_type: &str,
    text_content: &str,
) -> Result<RootWorkLoopFinishedWorkMetadata, RootWorkLoopFinishedWorkMetadataError> {
    let root_id = non_empty_caller_id(root_id.into(), "root_id")?;
    let root_tag = non_empty_caller_id(root_tag.into(), "root_tag")?;
    let render_update_id = non_empty_caller_id(render_update_id.into(), "render_update_id")?;

    validate_host_type(host_type)?;
    validate_text_content(text_content)?;

    let diagnostic = crate::native_root_work_loop_minimal_placement_diagnostic_for_private_bridge();
    let evidence =
        RootWorkLoopFinishedWorkDiagnosticEvidence::from_private_reconciler_diagnostic(&diagnostic);

    root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
        root_id,
        root_tag,
        render_update_id,
        host_type,
        text_content,
        &evidence,
    )
}

pub(crate) fn root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
    root_id: impl Into<String>,
    root_tag: impl Into<String>,
    render_update_id: impl Into<String>,
    host_type: &str,
    text_content: &str,
    evidence: &RootWorkLoopFinishedWorkDiagnosticEvidence,
) -> Result<RootWorkLoopFinishedWorkMetadata, RootWorkLoopFinishedWorkMetadataError> {
    let root_id = non_empty_caller_id(root_id.into(), "root_id")?;
    let root_tag = non_empty_caller_id(root_tag.into(), "root_tag")?;
    let render_update_id = non_empty_caller_id(render_update_id.into(), "render_update_id")?;

    validate_host_type(host_type)?;
    validate_text_content(text_content)?;
    validate_diagnostic_evidence(evidence)?;

    let host_component_count = diagnostic_count_as_u32(
        evidence.root_child_count,
        "root_child_count",
        EXPECTED_HOST_COMPONENT_COUNT,
    )?;
    let host_text_count = diagnostic_count_as_u32(
        evidence.component_child_count,
        "component_child_count",
        EXPECTED_HOST_TEXT_COUNT,
    )?;

    Ok(root_work_loop_finished_work_metadata_from_accepted_values(
        root_id,
        root_tag,
        render_update_id,
        host_component_count,
        host_text_count,
        evidence.text_content.clone(),
        evidence.placement_mutation_kind.clone(),
        evidence.host_mutation_execution_blocked,
        evidence.public_root_rendering_blocked,
        evidence.public_compatibility_blocked,
    ))
}

fn root_work_loop_finished_work_metadata_from_accepted_values(
    root_id: String,
    root_tag: String,
    render_update_id: String,
    host_component_count: u32,
    host_text_count: u32,
    text_content: String,
    placement_apply_kind: String,
    mutation_execution_blocked: bool,
    public_root_rendering_blocked: bool,
    effects_refs_and_hydration_blocked: bool,
) -> RootWorkLoopFinishedWorkMetadata {
    RootWorkLoopFinishedWorkMetadata {
        facade: RootWorkLoopFinishedWorkMetadataFacade {
            root_id,
            root_tag,
            render_update_id,
            host_type: HOST_TYPE_DIV,
            host_output_shape: HOST_OUTPUT_SHAPE_HOST_COMPONENT,
            host_component_count,
            host_text_count,
            text_content,
        },
        complete_work: RootWorkLoopFinishedWorkCompleteWorkMetadata {
            root_child_tag: HOST_COMPONENT_TAG,
            completed_child_tag: HOST_COMPONENT_TAG,
            host_text_child_tag: HOST_TEXT_TAG,
            child_tags: [HOST_COMPONENT_TAG, HOST_TEXT_TAG],
        },
        pending: RootWorkLoopFinishedWorkPendingMetadata {
            records_finished_work: true,
            pending_work_matches_finished_work: true,
            render_lanes: DEFAULT_LANES,
            finished_lanes: DEFAULT_LANES,
            remaining_lanes: NO_LANES,
        },
        commit: RootWorkLoopFinishedWorkCommitMetadata {
            commit_order_after_pending_record: true,
            consumed_finished_work_record: true,
            finished_work_after_commit: None,
            finished_lanes_after_commit: NO_LANES,
            render_phase_work_after_commit: None,
            mutation_execution_blocked,
            public_root_rendering_blocked,
            effects_refs_and_hydration_blocked,
        },
        placement: RootWorkLoopFinishedWorkPlacementMetadata {
            tag: HOST_COMPONENT_TAG,
            apply_kind: placement_apply_kind,
            sibling_status: SIBLING_STATUS_APPEND,
        },
    }
}

fn non_empty_caller_id(
    value: String,
    field: &'static str,
) -> Result<String, RootWorkLoopFinishedWorkMetadataError> {
    if value.is_empty() {
        return Err(RootWorkLoopFinishedWorkMetadataError::EmptyCallerId { field });
    }

    Ok(value)
}

fn validate_host_type(host_type: &str) -> Result<(), RootWorkLoopFinishedWorkMetadataError> {
    if host_type != HOST_TYPE_DIV {
        return Err(RootWorkLoopFinishedWorkMetadataError::UnsupportedHostType {
            actual: host_type.to_owned(),
        });
    }

    Ok(())
}

fn validate_text_content(text_content: &str) -> Result<(), RootWorkLoopFinishedWorkMetadataError> {
    if text_content != TEXT_CONTENT_TEXT {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::UnsupportedTextContent {
                actual: text_content.to_owned(),
            },
        );
    }

    Ok(())
}

fn validate_placement_apply_kind(
    placement_apply_kind: &str,
) -> Result<(), RootWorkLoopFinishedWorkMetadataError> {
    if placement_apply_kind != PLACEMENT_APPLY_KIND_APPEND_TO_CONTAINER {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::UnsupportedPlacementApplyKind {
                actual: placement_apply_kind.to_owned(),
            },
        );
    }

    Ok(())
}

fn validate_diagnostic_evidence(
    evidence: &RootWorkLoopFinishedWorkDiagnosticEvidence,
) -> Result<(), RootWorkLoopFinishedWorkMetadataError> {
    validate_placement_apply_kind(&evidence.placement_mutation_kind)?;
    require_diagnostic_value("text_content", TEXT_CONTENT_TEXT, &evidence.text_content)?;
    if evidence.render_lanes_bits != Lanes::DEFAULT.bits() {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::UnsupportedDiagnosticValue {
                field: "render_lanes",
                expected: DEFAULT_LANES,
                actual: evidence.render_lanes_bits.to_string(),
            },
        );
    }
    require_diagnostic_count(
        "root_child_count",
        evidence.root_child_count,
        EXPECTED_HOST_COMPONENT_COUNT,
    )?;
    require_diagnostic_count(
        "component_child_count",
        evidence.component_child_count,
        EXPECTED_HOST_TEXT_COUNT,
    )?;
    require_diagnostic_count(
        "detached_instance_count",
        evidence.detached_instance_count,
        EXPECTED_DETACHED_INSTANCE_COUNT,
    )?;
    require_diagnostic_count(
        "detached_text_count",
        evidence.detached_text_count,
        EXPECTED_DETACHED_TEXT_COUNT,
    )?;
    require_diagnostic_count(
        "host_node_count_after_complete_work",
        evidence.host_node_count_after_complete_work,
        EXPECTED_HOST_NODE_COUNT_AFTER_COMPLETE_WORK,
    )?;
    require_diagnostic_count(
        "host_node_count_after_placement",
        evidence.host_node_count_after_placement,
        EXPECTED_HOST_NODE_COUNT_AFTER_PLACEMENT,
    )?;
    require_proven(evidence.prepared_for_commit, "prepared_for_commit")?;
    require_proven(
        evidence.appended_child_to_container,
        "appended_child_to_container",
    )?;
    require_proven(evidence.reset_after_commit, "reset_after_commit")?;
    require_proven(
        evidence.private_root_placement_only,
        "private_root_placement_only",
    )?;
    require_proven(
        evidence.host_mutation_gate_blockers_intact,
        "host_mutation_gate_blockers_intact",
    )?;
    require_proven(
        evidence.host_mutation_execution_blocked,
        "host_mutation_execution_blocked",
    )?;
    require_not_promoted(
        evidence.production_host_mutation_apply_promoted,
        "production_host_mutation_apply_promoted",
    )?;
    require_proven(
        evidence.render_complete_handoff_proven,
        "render_complete_handoff_proven",
    )?;
    require_proven(
        evidence.private_render_complete_placement_proven,
        "private_render_complete_placement_proven",
    )?;
    reject_public_claim(
        evidence.public_dom_compatibility_claimed,
        "public_dom_compatibility_claimed",
    )?;
    reject_public_claim(
        evidence.public_root_rendering_claimed,
        "public_root_rendering_claimed",
    )?;
    require_proven(
        evidence.public_root_rendering_blocked,
        "public_root_rendering_blocked",
    )?;
    require_proven(
        evidence.public_compatibility_blocked,
        "public_compatibility_blocked",
    )?;
    reject_public_claim(
        evidence.public_renderer_package_behavior_exposed,
        "public_renderer_package_behavior_exposed",
    )?;
    reject_public_claim(
        evidence.react_dom_compatibility_claimed,
        "react_dom_compatibility_claimed",
    )?;
    reject_public_claim(
        evidence.test_renderer_compatibility_claimed,
        "test_renderer_compatibility_claimed",
    )?;

    Ok(())
}

fn require_diagnostic_value(
    field: &'static str,
    expected: &'static str,
    actual: &str,
) -> Result<(), RootWorkLoopFinishedWorkMetadataError> {
    if actual != expected {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::UnsupportedDiagnosticValue {
                field,
                expected,
                actual: actual.to_owned(),
            },
        );
    }

    Ok(())
}

fn require_diagnostic_count(
    field: &'static str,
    actual: usize,
    expected: usize,
) -> Result<(), RootWorkLoopFinishedWorkMetadataError> {
    if actual != expected {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::UnsupportedDiagnosticValue {
                field,
                expected: diagnostic_count_label(expected),
                actual: actual.to_string(),
            },
        );
    }

    Ok(())
}

fn diagnostic_count_label(expected: usize) -> &'static str {
    match expected {
        0 => "0",
        1 => "1",
        2 => "2",
        _ => "unsupported-count",
    }
}

fn diagnostic_count_as_u32(
    actual: usize,
    field: &'static str,
    expected: usize,
) -> Result<u32, RootWorkLoopFinishedWorkMetadataError> {
    require_diagnostic_count(field, actual, expected)?;

    u32::try_from(actual).map_err(|_| {
        RootWorkLoopFinishedWorkMetadataError::UnsupportedDiagnosticValue {
            field,
            expected: "u32",
            actual: actual.to_string(),
        }
    })
}

fn require_proven(
    actual: bool,
    field: &'static str,
) -> Result<(), RootWorkLoopFinishedWorkMetadataError> {
    if !actual {
        return Err(RootWorkLoopFinishedWorkMetadataError::UnprovenDiagnostic { field });
    }

    Ok(())
}

fn require_not_promoted(
    actual: bool,
    field: &'static str,
) -> Result<(), RootWorkLoopFinishedWorkMetadataError> {
    if actual {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::UnsupportedDiagnosticValue {
                field,
                expected: "false",
                actual: "true".to_owned(),
            },
        );
    }

    Ok(())
}

fn reject_public_claim(
    actual: bool,
    field: &'static str,
) -> Result<(), RootWorkLoopFinishedWorkMetadataError> {
    if actual {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::DiagnosticPublicCompatibilityClaim { field },
        );
    }

    Ok(())
}
