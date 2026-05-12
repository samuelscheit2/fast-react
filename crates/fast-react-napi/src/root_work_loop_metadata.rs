//! Private root work-loop finished-work metadata value shape.
//!
//! This mirrors the existing Node loader canary shape without loading the
//! native addon, calling Node-API, or probing the reconciler.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

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
    text_content: &'static str,
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
    pub(crate) const fn text_content(&self) -> &'static str {
        self.text_content
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
    EmptyCallerId { field: &'static str },
    UnsupportedHostType { actual: String },
    UnsupportedTextContent { actual: String },
    UnsupportedPlacementApplyKind { actual: String },
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
        }
    }
}

impl Error for RootWorkLoopFinishedWorkMetadataError {}

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

    if host_type != HOST_TYPE_DIV {
        return Err(RootWorkLoopFinishedWorkMetadataError::UnsupportedHostType {
            actual: host_type.to_owned(),
        });
    }

    if text_content != TEXT_CONTENT_TEXT {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::UnsupportedTextContent {
                actual: text_content.to_owned(),
            },
        );
    }

    if placement_apply_kind != PLACEMENT_APPLY_KIND_APPEND_TO_CONTAINER {
        return Err(
            RootWorkLoopFinishedWorkMetadataError::UnsupportedPlacementApplyKind {
                actual: placement_apply_kind,
            },
        );
    }

    Ok(RootWorkLoopFinishedWorkMetadata {
        facade: RootWorkLoopFinishedWorkMetadataFacade {
            root_id,
            root_tag,
            render_update_id,
            host_type: HOST_TYPE_DIV,
            host_output_shape: HOST_OUTPUT_SHAPE_HOST_COMPONENT,
            host_component_count: 1,
            host_text_count: 1,
            text_content: TEXT_CONTENT_TEXT,
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
            mutation_execution_blocked: true,
            public_root_rendering_blocked: true,
            effects_refs_and_hydration_blocked: true,
        },
        placement: RootWorkLoopFinishedWorkPlacementMetadata {
            tag: HOST_COMPONENT_TAG,
            apply_kind: PLACEMENT_APPLY_KIND_APPEND_TO_CONTAINER.to_owned(),
            sibling_status: SIBLING_STATUS_APPEND,
        },
    })
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
