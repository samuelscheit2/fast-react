//! Private root work-loop finished-work metadata value shape.
//!
//! This mirrors the existing Node loader canary shape without loading the
//! native addon or calling Node-API. The diagnostic-backed builder consumes a
//! private reconciler probe and only copies primitive evidence into this shape.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::Lanes;
use serde_json::{Map, Value};

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
const ROOT_WORK_LOOP_FINISHED_WORK_METADATA_JSON_FIELDS: &[&str] = &[
    "source",
    "status",
    "metadataRevision",
    "facade",
    "completeWork",
    "pending",
    "commit",
    "placement",
];
const ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACADE_JSON_FIELDS: &[&str] = &[
    "rootId",
    "rootTag",
    "renderUpdateId",
    "hostType",
    "hostOutputShape",
    "hostComponentCount",
    "hostTextCount",
    "textContent",
];
const ROOT_WORK_LOOP_FINISHED_WORK_METADATA_COMPLETE_WORK_JSON_FIELDS: &[&str] = &[
    "rootChildTag",
    "completedChildTag",
    "hostTextChildTag",
    "childTags",
];
const ROOT_WORK_LOOP_FINISHED_WORK_METADATA_PENDING_JSON_FIELDS: &[&str] = &[
    "recordsFinishedWork",
    "pendingWorkMatchesFinishedWork",
    "renderLanes",
    "finishedLanes",
    "remainingLanes",
];
const ROOT_WORK_LOOP_FINISHED_WORK_METADATA_COMMIT_JSON_FIELDS: &[&str] = &[
    "commitOrderAfterPendingRecord",
    "consumedFinishedWorkRecord",
    "finishedWorkAfterCommit",
    "finishedLanesAfterCommit",
    "renderPhaseWorkAfterCommit",
    "mutationExecutionBlocked",
    "publicRootRenderingBlocked",
    "effectsRefsAndHydrationBlocked",
];
const ROOT_WORK_LOOP_FINISHED_WORK_METADATA_PLACEMENT_JSON_FIELDS: &[&str] =
    &["tag", "applyKind", "siblingStatus"];

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

#[must_use]
pub(crate) fn root_work_loop_finished_work_metadata_json_value(
    metadata: &RootWorkLoopFinishedWorkMetadata,
) -> Value {
    let facade = metadata.facade();
    let complete_work = metadata.complete_work();
    let pending = metadata.pending();
    let commit = metadata.commit();
    let placement = metadata.placement();

    serde_json::json!({
        "source": metadata.source(),
        "status": metadata.status(),
        "metadataRevision": metadata.metadata_revision(),
        "facade": {
            "rootId": facade.root_id(),
            "rootTag": facade.root_tag(),
            "renderUpdateId": facade.render_update_id(),
            "hostType": facade.host_type(),
            "hostOutputShape": facade.host_output_shape(),
            "hostComponentCount": facade.host_component_count(),
            "hostTextCount": facade.host_text_count(),
            "textContent": facade.text_content()
        },
        "completeWork": {
            "rootChildTag": complete_work.root_child_tag(),
            "completedChildTag": complete_work.completed_child_tag(),
            "hostTextChildTag": complete_work.host_text_child_tag(),
            "childTags": complete_work.child_tags()
        },
        "pending": {
            "recordsFinishedWork": pending.records_finished_work(),
            "pendingWorkMatchesFinishedWork": pending.pending_work_matches_finished_work(),
            "renderLanes": pending.render_lanes(),
            "finishedLanes": pending.finished_lanes(),
            "remainingLanes": pending.remaining_lanes()
        },
        "commit": {
            "commitOrderAfterPendingRecord": commit.commit_order_after_pending_record(),
            "consumedFinishedWorkRecord": commit.consumed_finished_work_record(),
            "finishedWorkAfterCommit": commit.finished_work_after_commit(),
            "finishedLanesAfterCommit": commit.finished_lanes_after_commit(),
            "renderPhaseWorkAfterCommit": commit.render_phase_work_after_commit(),
            "mutationExecutionBlocked": commit.mutation_execution_blocked(),
            "publicRootRenderingBlocked": commit.public_root_rendering_blocked(),
            "effectsRefsAndHydrationBlocked": commit.effects_refs_and_hydration_blocked()
        },
        "placement": {
            "tag": placement.tag(),
            "applyKind": placement.apply_kind(),
            "siblingStatus": placement.sibling_status()
        }
    })
}

#[must_use]
pub(crate) fn root_work_loop_finished_work_metadata_json_string(
    metadata: &RootWorkLoopFinishedWorkMetadata,
) -> String {
    serde_json::to_string(&root_work_loop_finished_work_metadata_json_value(metadata))
        .expect("root work-loop metadata JSON value must serialize")
}

pub(crate) fn root_work_loop_finished_work_metadata_from_json_str_for_private_bridge(
    metadata_json: &str,
) -> Result<RootWorkLoopFinishedWorkMetadata, RootWorkLoopFinishedWorkMetadataError> {
    let metadata_json = serde_json::from_str(metadata_json).map_err(|error| {
        RootWorkLoopFinishedWorkMetadataError::JsonParseError {
            message: error.to_string(),
        }
    })?;

    root_work_loop_finished_work_metadata_from_json_value_for_private_bridge(&metadata_json)
}

pub(crate) fn root_work_loop_finished_work_metadata_from_json_value_for_private_bridge(
    metadata_json: &Value,
) -> Result<RootWorkLoopFinishedWorkMetadata, RootWorkLoopFinishedWorkMetadataError> {
    let metadata = require_json_object_fields(
        metadata_json,
        "metadata",
        ROOT_WORK_LOOP_FINISHED_WORK_METADATA_JSON_FIELDS,
    )?;
    require_json_exact_string(
        metadata,
        "source",
        "source",
        ROOT_WORK_LOOP_FINISHED_WORK_METADATA_SOURCE,
    )?;
    require_json_exact_string(
        metadata,
        "status",
        "status",
        ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS,
    )?;
    require_json_exact_string(
        metadata,
        "metadataRevision",
        "metadataRevision",
        ROOT_WORK_LOOP_FINISHED_WORK_METADATA_REVISION,
    )?;

    let facade = require_json_object_fields(
        require_json_field(metadata, "facade", "facade")?,
        "facade",
        ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACADE_JSON_FIELDS,
    )?;
    let root_id = non_empty_caller_id(
        require_json_string(facade, "rootId", "facade.rootId")?.to_owned(),
        "facade.rootId",
    )?;
    let root_tag = non_empty_caller_id(
        require_json_string(facade, "rootTag", "facade.rootTag")?.to_owned(),
        "facade.rootTag",
    )?;
    let render_update_id = non_empty_caller_id(
        require_json_string(facade, "renderUpdateId", "facade.renderUpdateId")?.to_owned(),
        "facade.renderUpdateId",
    )?;
    let host_type = require_json_string(facade, "hostType", "facade.hostType")?.to_owned();
    validate_host_type(&host_type)?;
    let host_output_shape = require_json_exact_string(
        facade,
        "hostOutputShape",
        "facade.hostOutputShape",
        HOST_OUTPUT_SHAPE_HOST_COMPONENT,
    )?
    .to_owned();
    let host_component_count = require_json_exact_u32(
        facade,
        "hostComponentCount",
        "facade.hostComponentCount",
        EXPECTED_HOST_COMPONENT_COUNT as u32,
    )?;
    let host_text_count = require_json_exact_u32(
        facade,
        "hostTextCount",
        "facade.hostTextCount",
        EXPECTED_HOST_TEXT_COUNT as u32,
    )?;
    let text_content = require_json_string(facade, "textContent", "facade.textContent")?.to_owned();
    validate_text_content(&text_content)?;

    let complete_work = require_json_object_fields(
        require_json_field(metadata, "completeWork", "completeWork")?,
        "completeWork",
        ROOT_WORK_LOOP_FINISHED_WORK_METADATA_COMPLETE_WORK_JSON_FIELDS,
    )?;
    let root_child_tag = require_json_exact_string(
        complete_work,
        "rootChildTag",
        "completeWork.rootChildTag",
        HOST_COMPONENT_TAG,
    )?
    .to_owned();
    let completed_child_tag = require_json_exact_string(
        complete_work,
        "completedChildTag",
        "completeWork.completedChildTag",
        HOST_COMPONENT_TAG,
    )?
    .to_owned();
    let host_text_child_tag = require_json_exact_string(
        complete_work,
        "hostTextChildTag",
        "completeWork.hostTextChildTag",
        HOST_TEXT_TAG,
    )?
    .to_owned();
    let child_tags = require_json_child_tags(
        require_json_field(complete_work, "childTags", "completeWork.childTags")?,
        "completeWork.childTags",
    )?;

    let pending = require_json_object_fields(
        require_json_field(metadata, "pending", "pending")?,
        "pending",
        ROOT_WORK_LOOP_FINISHED_WORK_METADATA_PENDING_JSON_FIELDS,
    )?;
    require_json_exact_bool(
        pending,
        "recordsFinishedWork",
        "pending.recordsFinishedWork",
        true,
    )?;
    require_json_exact_bool(
        pending,
        "pendingWorkMatchesFinishedWork",
        "pending.pendingWorkMatchesFinishedWork",
        true,
    )?;
    require_json_exact_string(pending, "renderLanes", "pending.renderLanes", DEFAULT_LANES)?;
    require_json_exact_string(
        pending,
        "finishedLanes",
        "pending.finishedLanes",
        DEFAULT_LANES,
    )?;
    require_json_exact_string(
        pending,
        "remainingLanes",
        "pending.remainingLanes",
        NO_LANES,
    )?;

    let commit = require_json_object_fields(
        require_json_field(metadata, "commit", "commit")?,
        "commit",
        ROOT_WORK_LOOP_FINISHED_WORK_METADATA_COMMIT_JSON_FIELDS,
    )?;
    require_json_exact_bool(
        commit,
        "commitOrderAfterPendingRecord",
        "commit.commitOrderAfterPendingRecord",
        true,
    )?;
    require_json_exact_bool(
        commit,
        "consumedFinishedWorkRecord",
        "commit.consumedFinishedWorkRecord",
        true,
    )?;
    require_json_null(
        commit,
        "finishedWorkAfterCommit",
        "commit.finishedWorkAfterCommit",
    )?;
    require_json_exact_string(
        commit,
        "finishedLanesAfterCommit",
        "commit.finishedLanesAfterCommit",
        NO_LANES,
    )?;
    require_json_null(
        commit,
        "renderPhaseWorkAfterCommit",
        "commit.renderPhaseWorkAfterCommit",
    )?;
    let mutation_execution_blocked = require_json_exact_bool(
        commit,
        "mutationExecutionBlocked",
        "commit.mutationExecutionBlocked",
        true,
    )?;
    let public_root_rendering_blocked = require_json_exact_bool(
        commit,
        "publicRootRenderingBlocked",
        "commit.publicRootRenderingBlocked",
        true,
    )?;
    let effects_refs_and_hydration_blocked = require_json_exact_bool(
        commit,
        "effectsRefsAndHydrationBlocked",
        "commit.effectsRefsAndHydrationBlocked",
        true,
    )?;

    let placement = require_json_object_fields(
        require_json_field(metadata, "placement", "placement")?,
        "placement",
        ROOT_WORK_LOOP_FINISHED_WORK_METADATA_PLACEMENT_JSON_FIELDS,
    )?;
    let placement_tag =
        require_json_exact_string(placement, "tag", "placement.tag", HOST_COMPONENT_TAG)?
            .to_owned();
    let placement_apply_kind =
        require_json_string(placement, "applyKind", "placement.applyKind")?.to_owned();
    validate_placement_apply_kind(&placement_apply_kind)?;
    require_json_exact_string(
        placement,
        "siblingStatus",
        "placement.siblingStatus",
        SIBLING_STATUS_APPEND,
    )?;

    Ok(root_work_loop_finished_work_metadata_from_accepted_values(
        root_id,
        root_tag,
        render_update_id,
        host_type,
        host_output_shape,
        host_component_count,
        host_text_count,
        text_content,
        root_child_tag,
        completed_child_tag,
        host_text_child_tag,
        child_tags,
        placement_tag,
        placement_apply_kind,
        mutation_execution_blocked,
        public_root_rendering_blocked,
        effects_refs_and_hydration_blocked,
    ))
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootWorkLoopFinishedWorkMetadataFacade {
    root_id: String,
    root_tag: String,
    render_update_id: String,
    host_type: String,
    host_output_shape: String,
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
    pub(crate) fn host_type(&self) -> &str {
        &self.host_type
    }

    #[must_use]
    pub(crate) fn host_output_shape(&self) -> &str {
        &self.host_output_shape
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootWorkLoopFinishedWorkCompleteWorkMetadata {
    root_child_tag: String,
    completed_child_tag: String,
    host_text_child_tag: String,
    child_tags: [String; 2],
}

impl RootWorkLoopFinishedWorkCompleteWorkMetadata {
    #[must_use]
    pub(crate) fn root_child_tag(&self) -> &str {
        &self.root_child_tag
    }

    #[must_use]
    pub(crate) fn completed_child_tag(&self) -> &str {
        &self.completed_child_tag
    }

    #[must_use]
    pub(crate) fn host_text_child_tag(&self) -> &str {
        &self.host_text_child_tag
    }

    #[must_use]
    pub(crate) fn child_tags(&self) -> [&str; 2] {
        [&self.child_tags[0], &self.child_tags[1]]
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
    tag: String,
    apply_kind: String,
    sibling_status: &'static str,
}

impl RootWorkLoopFinishedWorkPlacementMetadata {
    #[must_use]
    pub(crate) fn tag(&self) -> &str {
        &self.tag
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
    JsonParseError {
        message: String,
    },
    JsonAdmissionExpectedObject {
        field: &'static str,
        actual: String,
    },
    JsonAdmissionFieldSetMismatch {
        object: &'static str,
        expected: String,
        actual: String,
    },
    JsonAdmissionUnsupportedValue {
        field: &'static str,
        expected: &'static str,
        actual: String,
    },
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
            Self::JsonParseError { message } => write!(
                formatter,
                "native root work-loop finished-work metadata JSON could not be parsed: {message}"
            ),
            Self::JsonAdmissionExpectedObject { field, actual } => write!(
                formatter,
                "native root work-loop finished-work metadata JSON admission expected {field} object, got {actual}"
            ),
            Self::JsonAdmissionFieldSetMismatch {
                object,
                expected,
                actual,
            } => write!(
                formatter,
                "native root work-loop finished-work metadata JSON admission expected {object} fields [{expected}], got [{actual}]"
            ),
            Self::JsonAdmissionUnsupportedValue {
                field,
                expected,
                actual,
            } => write!(
                formatter,
                "native root work-loop finished-work metadata JSON admission expected {field} {expected}, got {actual}"
            ),
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
    host_type: String,
    host_output_shape: String,
    text_content: String,
    root_child_tag: String,
    completed_child_tag: String,
    host_text_child_tag: String,
    child_tags: [String; 2],
    minimal_host_root_component_text_path_proven: bool,
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
    effects_execution_blocked: bool,
    refs_execution_blocked: bool,
    hydration_execution_blocked: bool,
    effects_refs_and_hydration_execution_surfaces_blocked: bool,
    effects_refs_and_hydration_blocked: bool,
    public_renderer_package_behavior_exposed: bool,
    react_dom_compatibility_claimed: bool,
    test_renderer_compatibility_claimed: bool,
}

impl RootWorkLoopFinishedWorkDiagnosticEvidence {
    pub(crate) fn from_private_reconciler_diagnostic(
        diagnostic: &fast_react_reconciler::MinimalHostRootRenderCompletePlacementDiagnostic,
        host_type: &str,
    ) -> Self {
        Self {
            host_type: host_type.to_owned(),
            host_output_shape: HOST_OUTPUT_SHAPE_HOST_COMPONENT.to_owned(),
            text_content: diagnostic.text_content().to_owned(),
            root_child_tag: diagnostic.root_child_tag_name().to_owned(),
            completed_child_tag: diagnostic.completed_child_tag_name().to_owned(),
            host_text_child_tag: diagnostic.host_text_child_tag_name().to_owned(),
            child_tags: diagnostic.child_tag_names().map(str::to_owned),
            minimal_host_root_component_text_path_proven: diagnostic
                .minimal_host_root_component_text_path_proven(),
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
            effects_execution_blocked: diagnostic.effects_execution_blocked(),
            refs_execution_blocked: diagnostic.refs_execution_blocked(),
            hydration_execution_blocked: diagnostic.hydration_execution_blocked(),
            effects_refs_and_hydration_execution_surfaces_blocked: diagnostic
                .effects_refs_and_hydration_execution_surfaces_blocked(),
            effects_refs_and_hydration_blocked: diagnostic.effects_refs_and_hydration_blocked(),
            public_renderer_package_behavior_exposed: diagnostic
                .public_renderer_package_behavior_exposed(),
            react_dom_compatibility_claimed: diagnostic.react_dom_compatibility_claimed(),
            test_renderer_compatibility_claimed: diagnostic.test_renderer_compatibility_claimed(),
        }
    }
}

#[cfg(test)]
impl RootWorkLoopFinishedWorkDiagnosticEvidence {
    pub(crate) fn with_host_type_for_test(mut self, host_type: impl Into<String>) -> Self {
        self.host_type = host_type.into();
        self
    }

    pub(crate) fn with_host_output_shape_for_test(
        mut self,
        host_output_shape: impl Into<String>,
    ) -> Self {
        self.host_output_shape = host_output_shape.into();
        self
    }

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

    pub(crate) fn with_root_child_tag_for_test(
        mut self,
        root_child_tag: impl Into<String>,
    ) -> Self {
        self.root_child_tag = root_child_tag.into();
        self
    }

    pub(crate) fn with_completed_child_tag_for_test(
        mut self,
        completed_child_tag: impl Into<String>,
    ) -> Self {
        self.completed_child_tag = completed_child_tag.into();
        self
    }

    pub(crate) fn with_host_text_child_tag_for_test(
        mut self,
        host_text_child_tag: impl Into<String>,
    ) -> Self {
        self.host_text_child_tag = host_text_child_tag.into();
        self
    }

    pub(crate) fn with_child_tags_for_test(mut self, child_tags: [&str; 2]) -> Self {
        self.child_tags = child_tags.map(str::to_owned);
        self
    }

    pub(crate) const fn with_minimal_host_root_component_text_path_proven_for_test(
        mut self,
        minimal_host_root_component_text_path_proven: bool,
    ) -> Self {
        self.minimal_host_root_component_text_path_proven =
            minimal_host_root_component_text_path_proven;
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

    pub(crate) const fn with_effects_refs_and_hydration_blocked_for_test(
        mut self,
        effects_refs_and_hydration_blocked: bool,
    ) -> Self {
        self.effects_refs_and_hydration_blocked = effects_refs_and_hydration_blocked;
        self
    }

    pub(crate) const fn with_effects_execution_blocked_for_test(
        mut self,
        effects_execution_blocked: bool,
    ) -> Self {
        self.effects_execution_blocked = effects_execution_blocked;
        self
    }

    pub(crate) const fn with_refs_execution_blocked_for_test(
        mut self,
        refs_execution_blocked: bool,
    ) -> Self {
        self.refs_execution_blocked = refs_execution_blocked;
        self
    }

    pub(crate) const fn with_hydration_execution_blocked_for_test(
        mut self,
        hydration_execution_blocked: bool,
    ) -> Self {
        self.hydration_execution_blocked = hydration_execution_blocked;
        self
    }

    pub(crate) const fn with_effects_refs_and_hydration_execution_surfaces_blocked_for_test(
        mut self,
        effects_refs_and_hydration_execution_surfaces_blocked: bool,
    ) -> Self {
        self.effects_refs_and_hydration_execution_surfaces_blocked =
            effects_refs_and_hydration_execution_surfaces_blocked;
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
        HOST_TYPE_DIV.to_owned(),
        HOST_OUTPUT_SHAPE_HOST_COMPONENT.to_owned(),
        EXPECTED_HOST_COMPONENT_COUNT as u32,
        EXPECTED_HOST_TEXT_COUNT as u32,
        TEXT_CONTENT_TEXT.to_owned(),
        HOST_COMPONENT_TAG.to_owned(),
        HOST_COMPONENT_TAG.to_owned(),
        HOST_TEXT_TAG.to_owned(),
        [HOST_COMPONENT_TAG.to_owned(), HOST_TEXT_TAG.to_owned()],
        HOST_COMPONENT_TAG.to_owned(),
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
    let evidence = RootWorkLoopFinishedWorkDiagnosticEvidence::from_private_reconciler_diagnostic(
        &diagnostic,
        host_type,
    );

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
        evidence.host_type.clone(),
        evidence.host_output_shape.clone(),
        host_component_count,
        host_text_count,
        evidence.text_content.clone(),
        evidence.root_child_tag.clone(),
        evidence.completed_child_tag.clone(),
        evidence.host_text_child_tag.clone(),
        evidence.child_tags.clone(),
        evidence.root_child_tag.clone(),
        evidence.placement_mutation_kind.clone(),
        evidence.host_mutation_execution_blocked,
        evidence.public_root_rendering_blocked,
        evidence.effects_refs_and_hydration_blocked,
    ))
}

fn root_work_loop_finished_work_metadata_from_accepted_values(
    root_id: String,
    root_tag: String,
    render_update_id: String,
    host_type: String,
    host_output_shape: String,
    host_component_count: u32,
    host_text_count: u32,
    text_content: String,
    root_child_tag: String,
    completed_child_tag: String,
    host_text_child_tag: String,
    child_tags: [String; 2],
    placement_tag: String,
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
            host_type,
            host_output_shape,
            host_component_count,
            host_text_count,
            text_content,
        },
        complete_work: RootWorkLoopFinishedWorkCompleteWorkMetadata {
            root_child_tag,
            completed_child_tag,
            host_text_child_tag,
            child_tags,
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
            tag: placement_tag,
            apply_kind: placement_apply_kind,
            sibling_status: SIBLING_STATUS_APPEND,
        },
    }
}

fn require_json_object_fields<'a>(
    value: &'a Value,
    field: &'static str,
    expected_fields: &[&'static str],
) -> Result<&'a Map<String, Value>, RootWorkLoopFinishedWorkMetadataError> {
    let object = value.as_object().ok_or_else(|| {
        RootWorkLoopFinishedWorkMetadataError::JsonAdmissionExpectedObject {
            field,
            actual: json_actual(value),
        }
    })?;

    let mut expected = expected_fields.to_vec();
    expected.sort_unstable();

    let mut actual = object.keys().map(String::as_str).collect::<Vec<_>>();
    actual.sort_unstable();

    if actual != expected {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::JsonAdmissionFieldSetMismatch {
                object: field,
                expected: expected.join(","),
                actual: actual.join(","),
            },
        );
    }

    Ok(object)
}

fn require_json_field<'a>(
    object: &'a Map<String, Value>,
    key: &'static str,
    field: &'static str,
) -> Result<&'a Value, RootWorkLoopFinishedWorkMetadataError> {
    object.get(key).ok_or_else(|| {
        RootWorkLoopFinishedWorkMetadataError::JsonAdmissionUnsupportedValue {
            field,
            expected: "present",
            actual: "missing".to_owned(),
        }
    })
}

fn require_json_string<'a>(
    object: &'a Map<String, Value>,
    key: &'static str,
    field: &'static str,
) -> Result<&'a str, RootWorkLoopFinishedWorkMetadataError> {
    let value = require_json_field(object, key, field)?;

    value.as_str().ok_or_else(|| {
        RootWorkLoopFinishedWorkMetadataError::JsonAdmissionUnsupportedValue {
            field,
            expected: "string",
            actual: json_actual(value),
        }
    })
}

fn require_json_exact_string<'a>(
    object: &'a Map<String, Value>,
    key: &'static str,
    field: &'static str,
    expected: &'static str,
) -> Result<&'a str, RootWorkLoopFinishedWorkMetadataError> {
    let actual = require_json_string(object, key, field)?;

    if actual != expected {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::JsonAdmissionUnsupportedValue {
                field,
                expected,
                actual: actual.to_owned(),
            },
        );
    }

    Ok(actual)
}

fn require_json_exact_bool(
    object: &Map<String, Value>,
    key: &'static str,
    field: &'static str,
    expected: bool,
) -> Result<bool, RootWorkLoopFinishedWorkMetadataError> {
    let value = require_json_field(object, key, field)?;

    match value.as_bool() {
        Some(actual) if actual == expected => Ok(actual),
        Some(actual) => Err(
            RootWorkLoopFinishedWorkMetadataError::JsonAdmissionUnsupportedValue {
                field,
                expected: json_bool_label(expected),
                actual: actual.to_string(),
            },
        ),
        None => Err(
            RootWorkLoopFinishedWorkMetadataError::JsonAdmissionUnsupportedValue {
                field,
                expected: json_bool_label(expected),
                actual: json_actual(value),
            },
        ),
    }
}

fn require_json_exact_u32(
    object: &Map<String, Value>,
    key: &'static str,
    field: &'static str,
    expected: u32,
) -> Result<u32, RootWorkLoopFinishedWorkMetadataError> {
    let value = require_json_field(object, key, field)?;

    let actual = value.as_u64().and_then(|actual| u32::try_from(actual).ok());
    match actual {
        Some(actual) if actual == expected => Ok(actual),
        Some(actual) => Err(
            RootWorkLoopFinishedWorkMetadataError::JsonAdmissionUnsupportedValue {
                field,
                expected: json_u32_label(expected),
                actual: actual.to_string(),
            },
        ),
        None => Err(
            RootWorkLoopFinishedWorkMetadataError::JsonAdmissionUnsupportedValue {
                field,
                expected: json_u32_label(expected),
                actual: json_actual(value),
            },
        ),
    }
}

fn require_json_null(
    object: &Map<String, Value>,
    key: &'static str,
    field: &'static str,
) -> Result<(), RootWorkLoopFinishedWorkMetadataError> {
    let value = require_json_field(object, key, field)?;

    if !value.is_null() {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::JsonAdmissionUnsupportedValue {
                field,
                expected: "null",
                actual: json_actual(value),
            },
        );
    }

    Ok(())
}

fn require_json_child_tags(
    value: &Value,
    field: &'static str,
) -> Result<[String; 2], RootWorkLoopFinishedWorkMetadataError> {
    let Some(tags) = value.as_array() else {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::JsonAdmissionUnsupportedValue {
                field,
                expected: r#"["HostComponent","HostText"]"#,
                actual: json_actual(value),
            },
        );
    };

    if tags.len() != 2 {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::JsonAdmissionUnsupportedValue {
                field,
                expected: r#"["HostComponent","HostText"]"#,
                actual: json_actual(value),
            },
        );
    }

    let first = tags[0].as_str();
    let second = tags[1].as_str();
    if first != Some(HOST_COMPONENT_TAG) || second != Some(HOST_TEXT_TAG) {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::JsonAdmissionUnsupportedValue {
                field,
                expected: r#"["HostComponent","HostText"]"#,
                actual: json_actual(value),
            },
        );
    }

    Ok([HOST_COMPONENT_TAG.to_owned(), HOST_TEXT_TAG.to_owned()])
}

fn json_actual(value: &Value) -> String {
    value.to_string()
}

fn json_bool_label(value: bool) -> &'static str {
    if value { "true" } else { "false" }
}

fn json_u32_label(value: u32) -> &'static str {
    match value {
        0 => "0",
        1 => "1",
        2 => "2",
        _ => "u32",
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
    require_diagnostic_value("host_type", HOST_TYPE_DIV, &evidence.host_type)?;
    require_diagnostic_value(
        "host_output_shape",
        HOST_OUTPUT_SHAPE_HOST_COMPONENT,
        &evidence.host_output_shape,
    )?;
    validate_placement_apply_kind(&evidence.placement_mutation_kind)?;
    require_diagnostic_value("text_content", TEXT_CONTENT_TEXT, &evidence.text_content)?;
    require_diagnostic_value(
        "root_child_tag",
        HOST_COMPONENT_TAG,
        &evidence.root_child_tag,
    )?;
    require_diagnostic_value(
        "completed_child_tag",
        HOST_COMPONENT_TAG,
        &evidence.completed_child_tag,
    )?;
    require_diagnostic_value(
        "host_text_child_tag",
        HOST_TEXT_TAG,
        &evidence.host_text_child_tag,
    )?;
    require_diagnostic_child_tags(&evidence.child_tags)?;
    require_proven(
        evidence.minimal_host_root_component_text_path_proven,
        "minimal_host_root_component_text_path_proven",
    )?;
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
    require_proven(
        evidence.effects_execution_blocked,
        "effects_execution_blocked",
    )?;
    require_proven(evidence.refs_execution_blocked, "refs_execution_blocked")?;
    require_proven(
        evidence.hydration_execution_blocked,
        "hydration_execution_blocked",
    )?;
    require_proven(
        evidence.effects_refs_and_hydration_execution_surfaces_blocked,
        "effects_refs_and_hydration_execution_surfaces_blocked",
    )?;
    require_proven(
        evidence.effects_refs_and_hydration_blocked,
        "effects_refs_and_hydration_blocked",
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

fn require_diagnostic_child_tags(
    actual: &[String; 2],
) -> Result<(), RootWorkLoopFinishedWorkMetadataError> {
    if actual[0] != HOST_COMPONENT_TAG || actual[1] != HOST_TEXT_TAG {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::UnsupportedDiagnosticValue {
                field: "child_tags",
                expected: "HostComponent,HostText",
                actual: format!("{},{}", actual[0], actual[1]),
            },
        );
    }

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
