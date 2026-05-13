//! Minimal HostRoot render-phase work loop foundation.
//!
//! This module validates scheduled callback identity and processes HostRoot
//! updates into a work-in-progress HostRoot fiber. It deliberately stops before
//! public child reconciliation, host mutation, passive effects, sync flushing,
//! or public render behavior. Test-only diagnostics can bridge a private
//! HostComponent/HostText complete-work fixture into the accepted HostRoot
//! commit handoff.

#![cfg_attr(
    not(test),
    allow(
        dead_code,
        reason = "private HostRoot child begin-work preflight is reserved until a real fiber traversal consumes it"
    )
)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};
#[cfg(test)]
use std::sync::atomic::{AtomicU64, Ordering};

#[cfg(test)]
use fast_react_core::ContextValueChange;
#[cfg(test)]
use fast_react_core::Lane;
#[cfg(test)]
use fast_react_core::bubble_properties;
use fast_react_core::{FiberId, FiberTopologyError};
#[cfg(test)]
use fast_react_core::{FiberTag, Lanes};
#[cfg(test)]
use fast_react_core::{FiberTypeHandle, StateNodeHandle};
#[cfg(test)]
use fast_react_core::{HookListId, HookQueueId, HookUpdateId};
#[cfg(test)]
use fast_react_core::{PropsHandle, StateHandle};
#[cfg(test)]
use fast_react_host_config::HostTypes;

#[cfg(test)]
use crate::RootSchedulerCallbackHandle;
#[cfg(test)]
use crate::UpdateId;
#[cfg(test)]
use crate::begin_work::{
    BeginWorkError, BeginWorkRequest, UnsupportedOffscreenChildShapeRecord,
    unsupported_offscreen_begin_work_record, unsupported_suspense_begin_work_record,
};
#[cfg(test)]
use crate::context::ContextProviderUpdateConsumerOrder;
#[cfg(test)]
use crate::root_commit::HostRootMutationApplyRecordKind;
use crate::{
    FiberRootId, FiberRootStoreError, HostRootStateStoreError, UpdateQueueError,
    WorkInProgressError,
};
#[cfg(test)]
use crate::{
    FiberRootStore,
    begin_work::{NestedContextProviderBeginWorkError, NestedContextProviderBeginWorkRequest},
    function_component::{
        FunctionComponentContextConsumerInvoker, FunctionComponentContextRenderStore,
        FunctionComponentInvoker,
    },
};
#[cfg(test)]
use crate::{
    HostRootCommitRecord,
    begin_work::{
        ContextProviderBeginWorkError, ContextProviderBeginWorkRequest,
        FunctionComponentBeginWorkBailoutBlockerError,
        FunctionComponentBeginWorkBailoutBlockerRecord,
        FunctionComponentSingleChildBeginWorkRecord, FunctionComponentUseStateBeginWorkRecord,
        HostRootOneLevelChildSet, HostRootOneLevelChildSetBeginWorkError,
        HostRootOneLevelChildSetEntry, HostRootOneLevelChildSetKind,
        UnsupportedActivityChildShapeKind, UnsupportedOffscreenChildShapeKind,
        UnsupportedSuspenseChildShapeKind, UnsupportedSuspenseListChildShapeKind,
        UnsupportedThenableIdentityClass, UnsupportedThenableRetryQueueKind,
        begin_work_context_provider_use_context_single_child_for_complete_traversal,
        begin_work_function_component_bailout_blocker_for_test,
        begin_work_function_component_use_context, begin_work_host_root_one_level_child_set,
        begin_work_nested_context_provider_two_consumer_use_context_children,
        begin_work_reconcile_function_component_single_child, begin_work_with_use_state,
    },
    complete_work::{
        ContextProviderStackRestorationPhase, OffscreenRevealCommitMetadataError,
        OffscreenRevealCommitMetadataRecord, OffscreenVisibilityTransitionCompleteWorkBlockerError,
        OffscreenVisibilityTransitionCompleteWorkBlockerRecord,
        complete_host_root_one_level_child_set_for_test,
        complete_offscreen_visibility_transition_blocker_for_test,
        offscreen_reveal_commit_metadata_for_test, unwind_context_provider_for_test,
    },
    function_component::{
        FunctionComponentContextChangePropagationRequest, FunctionComponentHookRenderPhase,
        FunctionComponentHookRenderState, FunctionComponentHookRenderStore,
        FunctionComponentReducerDispatchRequest,
        FunctionComponentReducerDispatchRootRescheduleRecord, FunctionComponentReducerHandle,
        FunctionComponentRenderError, FunctionComponentRenderPhaseDispatchRecord,
        FunctionComponentRenderPhaseSourceEvidenceForCanary,
        FunctionComponentRenderPhaseStagingDrainRecord, FunctionComponentSingleChildOutput,
        FunctionComponentSingleChildOutputResolver,
        FunctionComponentSingleChildReconciliationError,
        FunctionComponentSingleChildReconciliationRecord,
        FunctionComponentSingleChildUpdateReconciliationError,
        FunctionComponentSingleChildUpdateReconciliationRecord, FunctionComponentStateActionHandle,
        FunctionComponentStateReducerId, FunctionComponentStateUpdateRenderLanes,
        FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary,
        FunctionComponentUseReducerAcceptedUpdateEvidenceForCanary,
        FunctionComponentUseReducerRenderRecord, FunctionComponentUseReducerRenderRequest,
        FunctionComponentUseStateRenderRequest,
        function_component_use_reducer_accepted_update_evidence_for_canary,
        propagate_context_change_to_function_component_dependencies,
        reconcile_function_component_single_child_output,
        reconcile_function_component_single_child_update_output,
        render_function_component_with_use_reducer,
    },
    host_work::{
        DetachedHostRecords, HostWorkError, HostWorkResult,
        TestHostRootHostUpdateExecutionDiagnosticForCanary,
        TestHostRootHostUpdateExecutionErrorForCanary, TestHostRootMutationApplyResult,
        apply_single_test_host_update_with_finished_work_handoff_for_canary,
        apply_test_host_root_commit_mutations_for_canary,
        complete_test_function_component_single_host_update_work_for_canary,
        mount_test_function_component_single_host_child_work, mount_test_host_work,
    },
    root_commit::{
        HostRootFinishedWorkCommitExecutionBlockerForCanary,
        HostRootFinishedWorkCommitExecutionStatusForCanary,
        HostRootFinishedWorkCommitHandoffErrorForCanary,
        HostRootFinishedWorkCommitHandoffRecordForCanary,
        HostRootFinishedWorkPendingCommitRecordForCanary,
        HostRootPlacementApplyDiagnosticForCanary,
        HostRootSingleHostUpdateApplyRecordErrorForCanary,
        HostRootSingleHostUpdateApplyRecordForCanary,
        commit_completed_host_root_render_with_finished_work_handoff_for_canary,
        commit_finished_host_root_with_finished_work_handoff_for_canary,
        record_host_root_finished_work_pending_commit_for_canary,
        record_host_root_single_host_update_apply_for_canary,
        record_host_root_suspense_fallback_content_commit_handoff_for_canary,
    },
    root_scheduler::{
        RootPingedRetryExecutionStatus, RootSyncSchedulerContinuationExecutionStatus,
        SuspenseThenableRetryRootSchedulerStatus, execute_pinged_retry_root_callback,
        execute_suspense_thenable_retry_root_render_handoff,
        execute_sync_scheduler_continuation_for_render_handoff,
        request_suspense_thenable_retry_root_scheduler, root_sync_flush_record_for_canary,
    },
    test_support::{RecordingHost, TestHostNode, TestHostTree},
};
#[cfg(test)]
use crate::{RootElementHandle, RootRenderExitStatus};

mod preflight;

#[allow(
    unused_imports,
    reason = "crate-visible HostRoot child preflight paths are preserved while the implementation lives in a child module"
)]
pub(crate) use preflight::{
    HostRootChildBeginWorkPreflightError, HostRootChildBeginWorkPreflightRecord,
    HostRootChildPreflightValidation, preflight_host_root_child_begin_work,
    validate_host_root_child_preflight,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RootWorkLoopError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    HostRootStateStore(HostRootStateStoreError),
    UpdateQueue(UpdateQueueError),
    WorkInProgress(WorkInProgressError),
    MissingHostRootUpdateQueue { root: FiberRootId, fiber: FiberId },
}

impl Display for RootWorkLoopError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::HostRootStateStore(error) => Display::fmt(error, formatter),
            Self::UpdateQueue(error) => Display::fmt(error, formatter),
            Self::WorkInProgress(error) => Display::fmt(error, formatter),
            Self::MissingHostRootUpdateQueue { root, fiber } => write!(
                formatter,
                "root {} HostRoot fiber slot {} has no update queue",
                root.raw(),
                fiber.slot().get()
            ),
        }
    }
}

impl Error for RootWorkLoopError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::HostRootStateStore(error) => Some(error),
            Self::UpdateQueue(error) => Some(error),
            Self::WorkInProgress(error) => Some(error),
            Self::MissingHostRootUpdateQueue { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for RootWorkLoopError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for RootWorkLoopError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<HostRootStateStoreError> for RootWorkLoopError {
    fn from(error: HostRootStateStoreError) -> Self {
        Self::HostRootStateStore(error)
    }
}

impl From<UpdateQueueError> for RootWorkLoopError {
    fn from(error: UpdateQueueError) -> Self {
        Self::UpdateQueue(error)
    }
}

impl From<WorkInProgressError> for RootWorkLoopError {
    fn from(error: WorkInProgressError) -> Self {
        Self::WorkInProgress(error)
    }
}

mod render_phase;

#[allow(
    unused_imports,
    reason = "crate-internal minimal root render record/error are reserved for the complete-work integration path"
)]
pub(crate) use render_phase::{
    HostRootMinimalElementRenderPhaseError, HostRootMinimalElementRenderPhaseRecord,
    materialize_minimal_root_element_from_render_phase,
    render_host_root_for_lanes_with_minimal_root_element,
};
#[cfg(test)]
#[allow(
    unused_imports,
    reason = "private HostRoot mount reconciliation canaries import these through the root work-loop test module"
)]
use render_phase::{
    HostRootMountReconciliationError,
    render_host_root_for_lanes_with_test_host_mount_reconciliation,
};
pub use render_phase::{
    HostRootRenderPhaseRecord, SchedulerCallbackHostRootRenderResult,
    SchedulerCallbackRenderStatus, SchedulerCallbackValidationRecord, render_host_root_for_lanes,
    render_host_root_via_scheduler_callback, validate_scheduled_host_root_callback,
};
mod complete_handoff;

#[cfg(test)]
use complete_handoff::{
    HostRootCompleteWorkCommitHandoffRecord, HostRootCompleteWorkHandoffError,
    HostRootCompleteWorkHandoffRecord, HostRootOneLevelChildSetCompleteWorkHandoffError,
    HostRootOneLevelChildSetCompleteWorkHandoffRecord,
    HostRootRenderFinishedWorkCommitMetadataHandoffError,
    handoff_completed_host_root_render_to_finished_work_commit_metadata_for_canary,
    handoff_completed_host_root_render_to_test_complete_work,
    handoff_completed_host_root_render_to_test_complete_work_and_commit,
    handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set,
    handoff_completed_host_root_render_to_test_complete_work_for_siblings,
    host_root_complete_work_handoff_record_from_host_work,
    validate_completed_host_root_render_for_complete_work_handoff,
    validate_empty_host_root_child_list_for_complete_work_handoff,
};
#[allow(
    unused_imports,
    reason = "crate-private minimal render/complete handoff is production-compiled before public render consumes it"
)]
pub(crate) use complete_handoff::{
    HostRootMinimalRenderCompleteHandoffAdapter, HostRootMinimalRenderCompleteHandoffError,
    HostRootMinimalRenderCompleteHandoffRecord, HostRootMinimalRenderCompletePlacementCommitError,
    HostRootMinimalRenderCompletePlacementCommitRecord,
    commit_minimal_root_element_render_complete_handoff_to_host_placement,
    handoff_minimal_root_element_render_to_complete_work,
};
#[allow(
    unused_imports,
    reason = "narrow private-bridge diagnostic API is exported without exposing private render/commit records"
)]
pub use complete_handoff::{
    MinimalHostRootRenderCompletePlacementDiagnostic,
    MinimalHostRootRenderCompletePlacementDiagnosticError,
    describe_minimal_host_root_render_complete_placement_for_private_bridge,
};
mod context_provider;
#[cfg(test)]
mod queued_minimal_host;
#[cfg(test)]
#[allow(
    unused_imports,
    reason = "private queued minimal HostRoot records are exposed for focused canaries"
)]
pub(crate) use queued_minimal_host::{
    QueuedMinimalHostRootCommitError, QueuedMinimalHostRootCommitPhase,
    QueuedMinimalHostRootCommitRecord, QueuedMinimalHostRootOutput,
    QueuedMinimalHostRootUpdatePriority,
    enqueue_render_complete_commit_minimal_host_root_for_canary,
};

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct OffscreenHiddenLaneRevealCommitGateRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    offscreen: FiberId,
    hidden_update: UpdateId,
    hidden_update_lane: Lane,
    retained_hidden_update_lanes: Lanes,
    hidden_update_count: usize,
    begin_work: UnsupportedOffscreenChildShapeRecord,
    complete_work: OffscreenVisibilityTransitionCompleteWorkBlockerRecord,
    reveal_commit: OffscreenRevealCommitMetadataRecord,
    child_traversal_blocked: bool,
    host_visibility_mutation_blocked: bool,
    passive_visibility_effects_deferred: bool,
    public_offscreen_compatibility_blocked: bool,
    public_passive_compatibility_blocked: bool,
    public_activity_compatibility_blocked: bool,
}

#[cfg(test)]
impl OffscreenHiddenLaneRevealCommitGateRecord {
    #[must_use]
    const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn offscreen(&self) -> FiberId {
        self.offscreen
    }

    #[must_use]
    const fn hidden_update(&self) -> UpdateId {
        self.hidden_update
    }

    #[must_use]
    const fn hidden_update_lane(&self) -> Lane {
        self.hidden_update_lane
    }

    #[must_use]
    const fn retained_hidden_update_lanes(&self) -> Lanes {
        self.retained_hidden_update_lanes
    }

    #[must_use]
    const fn hidden_update_count(&self) -> usize {
        self.hidden_update_count
    }

    #[must_use]
    const fn begin_work(&self) -> &UnsupportedOffscreenChildShapeRecord {
        &self.begin_work
    }

    #[must_use]
    const fn complete_work(&self) -> &OffscreenVisibilityTransitionCompleteWorkBlockerRecord {
        &self.complete_work
    }

    #[must_use]
    const fn reveal_commit(&self) -> &OffscreenRevealCommitMetadataRecord {
        &self.reveal_commit
    }

    #[must_use]
    const fn child_traversal_blocked(&self) -> bool {
        self.child_traversal_blocked
    }

    #[must_use]
    const fn host_visibility_mutation_blocked(&self) -> bool {
        self.host_visibility_mutation_blocked
    }

    #[must_use]
    const fn passive_visibility_effects_deferred(&self) -> bool {
        self.passive_visibility_effects_deferred
    }

    #[must_use]
    const fn public_offscreen_compatibility_blocked(&self) -> bool {
        self.public_offscreen_compatibility_blocked
    }

    #[must_use]
    const fn public_passive_compatibility_blocked(&self) -> bool {
        self.public_passive_compatibility_blocked
    }

    #[must_use]
    const fn public_activity_compatibility_blocked(&self) -> bool {
        self.public_activity_compatibility_blocked
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum OffscreenHiddenLaneRevealCommitGateError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    BeginWork(BeginWorkError),
    CompleteWork(Box<OffscreenVisibilityTransitionCompleteWorkBlockerError>),
    RevealCommit(OffscreenRevealCommitMetadataError),
    UpdateQueue(UpdateQueueError),
    ExpectedHostRootWorkInProgress {
        fiber: FiberId,
        tag: FiberTag,
    },
    UnexpectedHostRootChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        expected: FiberId,
        actual: Option<FiberId>,
        actual_tag: Option<FiberTag>,
    },
    HiddenUpdateLaneNotRetained {
        update: UpdateId,
        expected: Lanes,
        actual: Lanes,
    },
    HiddenUpdateLaneNotRecorded {
        root: FiberRootId,
        lane: Lane,
    },
    StaleBeginWorkRecord {
        offscreen: FiberId,
    },
    StaleCompleteWorkRecord {
        offscreen: FiberId,
    },
}

#[cfg(test)]
impl Display for OffscreenHiddenLaneRevealCommitGateError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::BeginWork(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::RevealCommit(error) => Display::fmt(error, formatter),
            Self::UpdateQueue(error) => Display::fmt(error, formatter),
            Self::ExpectedHostRootWorkInProgress { fiber, tag } => write!(
                formatter,
                "fiber {} must be HostRoot work-in-progress for private Offscreen reveal gate, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::UnexpectedHostRootChild {
                root,
                host_root_work_in_progress,
                expected,
                actual,
                actual_tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} must point at Offscreen child {}; found {:?} ({:?})",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                expected.slot().get(),
                actual.map(|fiber| fiber.slot().get()),
                actual_tag
            ),
            Self::HiddenUpdateLaneNotRetained {
                update,
                expected,
                actual,
            } => write!(
                formatter,
                "hidden update {} did not retain Offscreen lane metadata; expected {:?}, actual {:?}",
                update.raw(),
                expected,
                actual
            ),
            Self::HiddenUpdateLaneNotRecorded { root, lane } => write!(
                formatter,
                "root {} has no private hidden update lane record for {:?}",
                root.raw(),
                lane
            ),
            Self::StaleBeginWorkRecord { offscreen } => write!(
                formatter,
                "Offscreen fiber {} has stale begin-work evidence for private hidden-lane reveal gate",
                offscreen.slot().get()
            ),
            Self::StaleCompleteWorkRecord { offscreen } => write!(
                formatter,
                "Offscreen fiber {} has stale complete-work evidence for private hidden-lane reveal gate",
                offscreen.slot().get()
            ),
        }
    }
}

#[cfg(test)]
impl Error for OffscreenHiddenLaneRevealCommitGateError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::BeginWork(error) => Some(error),
            Self::CompleteWork(error) => Some(error.as_ref()),
            Self::RevealCommit(error) => Some(error),
            Self::UpdateQueue(error) => Some(error),
            Self::ExpectedHostRootWorkInProgress { .. }
            | Self::UnexpectedHostRootChild { .. }
            | Self::HiddenUpdateLaneNotRetained { .. }
            | Self::HiddenUpdateLaneNotRecorded { .. }
            | Self::StaleBeginWorkRecord { .. }
            | Self::StaleCompleteWorkRecord { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<FiberRootStoreError> for OffscreenHiddenLaneRevealCommitGateError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

#[cfg(test)]
impl From<FiberTopologyError> for OffscreenHiddenLaneRevealCommitGateError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[cfg(test)]
impl From<BeginWorkError> for OffscreenHiddenLaneRevealCommitGateError {
    fn from(error: BeginWorkError) -> Self {
        Self::BeginWork(error)
    }
}

#[cfg(test)]
impl From<OffscreenVisibilityTransitionCompleteWorkBlockerError>
    for OffscreenHiddenLaneRevealCommitGateError
{
    fn from(error: OffscreenVisibilityTransitionCompleteWorkBlockerError) -> Self {
        Self::CompleteWork(Box::new(error))
    }
}

#[cfg(test)]
impl From<OffscreenRevealCommitMetadataError> for OffscreenHiddenLaneRevealCommitGateError {
    fn from(error: OffscreenRevealCommitMetadataError) -> Self {
        Self::RevealCommit(error)
    }
}

#[cfg(test)]
impl From<UpdateQueueError> for OffscreenHiddenLaneRevealCommitGateError {
    fn from(error: UpdateQueueError) -> Self {
        Self::UpdateQueue(error)
    }
}

#[cfg(test)]
#[allow(clippy::too_many_arguments)]
fn offscreen_hidden_lane_reveal_commit_gate_for_test(
    store: &FiberRootStore<RecordingHost>,
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    offscreen: FiberId,
    hidden_update: UpdateId,
    hidden_update_lane: Lane,
    begin_work: &UnsupportedOffscreenChildShapeRecord,
    complete_work: &OffscreenVisibilityTransitionCompleteWorkBlockerRecord,
    committed_lanes: Lanes,
) -> Result<OffscreenHiddenLaneRevealCommitGateRecord, OffscreenHiddenLaneRevealCommitGateError> {
    let host_root = store.fiber_arena().get(host_root_work_in_progress)?;
    let host_root_tag = host_root.tag();
    if host_root_tag != FiberTag::HostRoot {
        return Err(
            OffscreenHiddenLaneRevealCommitGateError::ExpectedHostRootWorkInProgress {
                fiber: host_root_work_in_progress,
                tag: host_root_tag,
            },
        );
    }

    let actual_child = host_root.child();
    let actual_child_tag = actual_child
        .map(|child| store.fiber_arena().get(child).map(|node| node.tag()))
        .transpose()?;
    if actual_child != Some(offscreen) {
        return Err(
            OffscreenHiddenLaneRevealCommitGateError::UnexpectedHostRootChild {
                root,
                host_root_work_in_progress,
                expected: offscreen,
                actual: actual_child,
                actual_tag: actual_child_tag,
            },
        );
    }

    let retained_hidden_update_lanes = store.update_queues().update(hidden_update)?.lane();
    let expected_hidden_update_lanes = hidden_update_lane.to_lanes().merge_lane(Lane::OFFSCREEN);
    if retained_hidden_update_lanes != expected_hidden_update_lanes {
        return Err(
            OffscreenHiddenLaneRevealCommitGateError::HiddenUpdateLaneNotRetained {
                update: hidden_update,
                expected: expected_hidden_update_lanes,
                actual: retained_hidden_update_lanes,
            },
        );
    }

    let hidden_update_count = store
        .root(root)?
        .lanes()
        .hidden_update_count(hidden_update_lane)
        .unwrap_or_default();
    if hidden_update_count == 0 {
        return Err(
            OffscreenHiddenLaneRevealCommitGateError::HiddenUpdateLaneNotRecorded {
                root,
                lane: hidden_update_lane,
            },
        );
    }

    let current_begin_work = unsupported_offscreen_begin_work_record(
        store.fiber_arena(),
        BeginWorkRequest::new(offscreen, begin_work.render_lanes()),
    )?;
    if &current_begin_work != begin_work {
        return Err(OffscreenHiddenLaneRevealCommitGateError::StaleBeginWorkRecord { offscreen });
    }

    let current_complete_work = complete_offscreen_visibility_transition_blocker_for_test(
        store.fiber_arena(),
        offscreen,
        begin_work,
        complete_work.transition().render_lanes(),
    )?;
    if &current_complete_work != complete_work {
        return Err(
            OffscreenHiddenLaneRevealCommitGateError::StaleCompleteWorkRecord { offscreen },
        );
    }

    let reveal_commit = offscreen_reveal_commit_metadata_for_test(complete_work, committed_lanes)?;
    let passive_visibility_effects_deferred = reveal_commit.passive_visibility_effects_blocked();

    Ok(OffscreenHiddenLaneRevealCommitGateRecord {
        root,
        host_root_work_in_progress,
        offscreen,
        hidden_update,
        hidden_update_lane,
        retained_hidden_update_lanes,
        hidden_update_count,
        begin_work: begin_work.clone(),
        complete_work: complete_work.clone(),
        reveal_commit,
        child_traversal_blocked: complete_work.child_traversal_blocked(),
        host_visibility_mutation_blocked: complete_work.host_mutation_blocked(),
        passive_visibility_effects_deferred,
        public_offscreen_compatibility_blocked: complete_work.public_compatibility_blocked(),
        public_passive_compatibility_blocked: true,
        public_activity_compatibility_blocked: true,
    })
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootFunctionComponentSingleChildCompleteWorkHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    original_root_element: RootElementHandle,
    function_component: FiberId,
    begin_work: FunctionComponentSingleChildBeginWorkRecord,
    complete_work: HostRootCompleteWorkHandoffRecord,
}

#[cfg(test)]
impl HostRootFunctionComponentSingleChildCompleteWorkHandoffRecord {
    #[must_use]
    const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn original_root_element(self) -> RootElementHandle {
        self.original_root_element
    }

    #[must_use]
    const fn function_component(self) -> FiberId {
        self.function_component
    }

    #[must_use]
    const fn begin_work(self) -> FunctionComponentSingleChildBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    const fn complete_work(self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_work
    }

    #[must_use]
    const fn child_element(self) -> RootElementHandle {
        self.begin_work.single_child().child_element()
    }

    #[must_use]
    const fn child_tag(self) -> FiberTag {
        self.begin_work.single_child().child_tag()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary {
    Public,
    PublicRoot,
    ReactDom,
    NativeRenderer,
    ReactTestRenderer,
    Scheduler,
    Package,
}

#[cfg(test)]
impl HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary {
    const fn as_str(self) -> &'static str {
        match self {
            Self::Public => "public FunctionComponent bailout",
            Self::PublicRoot => "public root",
            Self::ReactDom => "React DOM",
            Self::NativeRenderer => "native renderer",
            Self::ReactTestRenderer => "React Test Renderer",
            Self::Scheduler => "Scheduler",
            Self::Package => "package",
        }
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
struct HostRootFunctionComponentBailoutCompatibilityClaimsForCanary {
    public_compatibility_claimed: bool,
    public_root_compatibility_claimed: bool,
    react_dom_compatibility_claimed: bool,
    native_renderer_compatibility_claimed: bool,
    test_renderer_compatibility_claimed: bool,
    scheduler_compatibility_claimed: bool,
    package_compatibility_claimed: bool,
}

#[cfg(test)]
impl HostRootFunctionComponentBailoutCompatibilityClaimsForCanary {
    const fn none() -> Self {
        Self {
            public_compatibility_claimed: false,
            public_root_compatibility_claimed: false,
            react_dom_compatibility_claimed: false,
            native_renderer_compatibility_claimed: false,
            test_renderer_compatibility_claimed: false,
            scheduler_compatibility_claimed: false,
            package_compatibility_claimed: false,
        }
    }

    const fn with_claim(
        mut self,
        surface: HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary,
    ) -> Self {
        match surface {
            HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::Public => {
                self.public_compatibility_claimed = true;
            }
            HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::PublicRoot => {
                self.public_root_compatibility_claimed = true;
            }
            HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::ReactDom => {
                self.react_dom_compatibility_claimed = true;
            }
            HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::NativeRenderer => {
                self.native_renderer_compatibility_claimed = true;
            }
            HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::ReactTestRenderer => {
                self.test_renderer_compatibility_claimed = true;
            }
            HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::Scheduler => {
                self.scheduler_compatibility_claimed = true;
            }
            HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::Package => {
                self.package_compatibility_claimed = true;
            }
        }
        self
    }

    const fn claimed_surface(
        self,
    ) -> Option<HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary> {
        if self.public_compatibility_claimed {
            return Some(HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::Public);
        }
        if self.public_root_compatibility_claimed {
            return Some(HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::PublicRoot);
        }
        if self.react_dom_compatibility_claimed {
            return Some(HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::ReactDom);
        }
        if self.native_renderer_compatibility_claimed {
            return Some(
                HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::NativeRenderer,
            );
        }
        if self.test_renderer_compatibility_claimed {
            return Some(
                HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::ReactTestRenderer,
            );
        }
        if self.scheduler_compatibility_claimed {
            return Some(HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::Scheduler);
        }
        if self.package_compatibility_claimed {
            return Some(HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary::Package);
        }
        None
    }

    const fn compatibility_claim_blocked(self) -> bool {
        self.claimed_surface().is_none()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootFunctionComponentBailoutConsumerRequestForCanary {
    function_component_work_in_progress: FiberId,
    compatibility_claims: HostRootFunctionComponentBailoutCompatibilityClaimsForCanary,
}

#[cfg(test)]
impl HostRootFunctionComponentBailoutConsumerRequestForCanary {
    const fn new(function_component_work_in_progress: FiberId) -> Self {
        Self {
            function_component_work_in_progress,
            compatibility_claims:
                HostRootFunctionComponentBailoutCompatibilityClaimsForCanary::none(),
        }
    }

    const fn with_compatibility_claim(
        mut self,
        surface: HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary,
    ) -> Self {
        self.compatibility_claims = self.compatibility_claims.with_claim(surface);
        self
    }

    const fn function_component_work_in_progress(self) -> FiberId {
        self.function_component_work_in_progress
    }

    const fn compatibility_claims(
        self,
    ) -> HostRootFunctionComponentBailoutCompatibilityClaimsForCanary {
        self.compatibility_claims
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct HostRootFunctionComponentSingleChildMountBailoutSourceForCanary {
    root: FiberRootId,
    root_token: StateNodeHandle,
    previous_current: FiberId,
    committed_current: FiberId,
    root_element: RootElementHandle,
    render_lanes: Lanes,
    finished_work_after_commit: Option<FiberId>,
    finished_lanes_after_commit: Lanes,
    function_component: FiberId,
    function_component_type: FiberTypeHandle,
    function_component_pending_props: PropsHandle,
    function_component_memoized_props: PropsHandle,
    single_child: FunctionComponentSingleChildReconciliationRecord,
    complete_work: HostRootCompleteWorkHandoffRecord,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    child: FiberId,
    child_tag: FiberTag,
    child_element: RootElementHandle,
    child_props: PropsHandle,
    source_owned_mount_path_recorded: bool,
    caller_built: bool,
    compatibility_claims: HostRootFunctionComponentBailoutCompatibilityClaimsForCanary,
}

#[cfg(test)]
impl HostRootFunctionComponentSingleChildMountBailoutSourceForCanary {
    const fn root(&self) -> FiberRootId {
        self.root
    }

    const fn root_token(&self) -> StateNodeHandle {
        self.root_token
    }

    const fn previous_current(&self) -> FiberId {
        self.previous_current
    }

    const fn committed_current(&self) -> FiberId {
        self.committed_current
    }

    const fn root_element(&self) -> RootElementHandle {
        self.root_element
    }

    const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    const fn function_component(&self) -> FiberId {
        self.function_component
    }

    const fn function_component_type(&self) -> FiberTypeHandle {
        self.function_component_type
    }

    const fn function_component_memoized_props(&self) -> PropsHandle {
        self.function_component_memoized_props
    }

    const fn single_child(&self) -> FunctionComponentSingleChildReconciliationRecord {
        self.single_child
    }

    const fn complete_work(&self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_work
    }

    const fn finished_work_handoff(&self) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    const fn child(&self) -> FiberId {
        self.child
    }

    const fn child_tag(&self) -> FiberTag {
        self.child_tag
    }

    const fn child_element(&self) -> RootElementHandle {
        self.child_element
    }

    const fn child_props(&self) -> PropsHandle {
        self.child_props
    }

    const fn source_owned_mount_path_recorded(&self) -> bool {
        self.source_owned_mount_path_recorded
    }

    const fn caller_built(&self) -> bool {
        self.caller_built
    }

    const fn public_compatibility_claimed(&self) -> bool {
        self.compatibility_claims.public_compatibility_claimed
    }

    const fn public_root_compatibility_claimed(&self) -> bool {
        self.compatibility_claims.public_root_compatibility_claimed
    }

    const fn react_dom_compatibility_claimed(&self) -> bool {
        self.compatibility_claims.react_dom_compatibility_claimed
    }

    const fn native_renderer_compatibility_claimed(&self) -> bool {
        self.compatibility_claims
            .native_renderer_compatibility_claimed
    }

    const fn test_renderer_compatibility_claimed(&self) -> bool {
        self.compatibility_claims
            .test_renderer_compatibility_claimed
    }

    const fn scheduler_compatibility_claimed(&self) -> bool {
        self.compatibility_claims.scheduler_compatibility_claimed
    }

    const fn package_compatibility_claimed(&self) -> bool {
        self.compatibility_claims.package_compatibility_claimed
    }

    const fn compatibility_claim_blocked(&self) -> bool {
        self.compatibility_claims.compatibility_claim_blocked()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct HostRootFunctionComponentBailoutConsumerRecordForCanary {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    previous_current: FiberId,
    function_component_current: FiberId,
    function_component_work_in_progress: FiberId,
    mount_source: HostRootFunctionComponentSingleChildMountBailoutSourceForCanary,
    bailout_blocker: FunctionComponentBeginWorkBailoutBlockerRecord,
    root_current_before: FiberId,
    root_current_after: FiberId,
    host_operation_count_before: usize,
    host_operation_count_after: usize,
}

#[cfg(test)]
impl HostRootFunctionComponentBailoutConsumerRecordForCanary {
    const fn root(&self) -> FiberRootId {
        self.root
    }

    const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    const fn previous_current(&self) -> FiberId {
        self.previous_current
    }

    const fn function_component_current(&self) -> FiberId {
        self.function_component_current
    }

    const fn function_component_work_in_progress(&self) -> FiberId {
        self.function_component_work_in_progress
    }

    const fn mount_source(
        &self,
    ) -> &HostRootFunctionComponentSingleChildMountBailoutSourceForCanary {
        &self.mount_source
    }

    const fn bailout_blocker(&self) -> FunctionComponentBeginWorkBailoutBlockerRecord {
        self.bailout_blocker
    }

    const fn root_current_before(&self) -> FiberId {
        self.root_current_before
    }

    const fn root_current_after(&self) -> FiberId {
        self.root_current_after
    }

    const fn host_operation_count_before(&self) -> usize {
        self.host_operation_count_before
    }

    const fn host_operation_count_after(&self) -> usize {
        self.host_operation_count_after
    }

    fn same_props_proven(&self) -> bool {
        self.bailout_blocker.pending_props() == self.bailout_blocker.memoized_props()
    }

    const fn no_relevant_component_lanes(&self) -> bool {
        !self
            .bailout_blocker
            .current_lanes_before()
            .contains_any(self.bailout_blocker.render_lanes())
    }

    const fn no_context_lane(&self) -> bool {
        !self
            .bailout_blocker
            .context_dependency_lanes()
            .contains_any(self.bailout_blocker.render_lanes())
    }

    const fn no_child_lane_traversal(&self) -> bool {
        !self
            .bailout_blocker
            .child_lanes()
            .contains_any(self.bailout_blocker.render_lanes())
            && self.bailout_blocker.child_to_visit().is_none()
            && self.bailout_blocker.child_traversal_blocked()
    }

    const fn component_invocation_blocked(&self) -> bool {
        true
    }

    const fn host_output_unchanged(&self) -> bool {
        self.host_operation_count_before == self.host_operation_count_after
    }

    fn current_switch_blocked(&self) -> bool {
        self.root_current_before == self.root_current_after
    }

    fn consumed_worker_921_begin_work_blocker(&self) -> bool {
        self.bailout_blocker.current() == self.function_component_current
            && self.bailout_blocker.work_in_progress() == self.function_component_work_in_progress
            && self.same_props_proven()
            && self.no_relevant_component_lanes()
            && self.no_context_lane()
            && self.no_child_lane_traversal()
    }

    const fn public_compatibility_claimed(&self) -> bool {
        false
    }

    const fn public_root_compatibility_claimed(&self) -> bool {
        false
    }

    const fn react_dom_compatibility_claimed(&self) -> bool {
        false
    }

    const fn native_renderer_compatibility_claimed(&self) -> bool {
        false
    }

    const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }

    const fn scheduler_compatibility_claimed(&self) -> bool {
        false
    }

    const fn package_compatibility_claimed(&self) -> bool {
        false
    }

    const fn compatibility_claim_blocked(&self) -> bool {
        !self.public_compatibility_claimed()
            && !self.public_root_compatibility_claimed()
            && !self.react_dom_compatibility_claimed()
            && !self.native_renderer_compatibility_claimed()
            && !self.test_renderer_compatibility_claimed()
            && !self.scheduler_compatibility_claimed()
            && !self.package_compatibility_claimed()
            && self.mount_source.compatibility_claim_blocked()
    }

    fn public_renderer_behavior_blocked(&self) -> bool {
        self.compatibility_claim_blocked()
            && self.component_invocation_blocked()
            && self.host_output_unchanged()
            && self.current_switch_blocked()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootFunctionComponentBailoutConsumerErrorForCanary {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    RenderPhase(Box<HostRootCompleteWorkHandoffError>),
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    BeginWorkBailout(FunctionComponentBeginWorkBailoutBlockerError),
    MissingFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    FunctionComponentWorkMismatch {
        expected: FiberId,
        actual: FiberId,
    },
    FunctionComponentAlternateMismatch {
        current: FiberId,
        work_in_progress: FiberId,
        actual_alternate: Option<FiberId>,
    },
    SourceMismatch {
        field: &'static str,
    },
    MissingAcceptedMountEvidence {
        field: &'static str,
    },
    StaleOrClonedMountEvidence {
        field: &'static str,
    },
    CallerShapedMountEvidence,
    CompatibilityClaim {
        surface: HostRootFunctionComponentBailoutCompatibilitySurfaceForCanary,
    },
    HostOutputMutated {
        before: usize,
        after: usize,
    },
    RootCurrentSwitched {
        before: FiberId,
        after: FiberId,
    },
}

#[cfg(test)]
impl Display for HostRootFunctionComponentBailoutConsumerErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::RenderPhase(error) => Display::fmt(error, formatter),
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::BeginWorkBailout(error) => Display::fmt(error, formatter),
            Self::MissingFunctionComponentChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no FunctionComponent child for private FunctionComponent bailout consumer",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedFunctionComponentChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be FunctionComponent for private FunctionComponent bailout consumer, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::FunctionComponentWorkMismatch { expected, actual } => write!(
                formatter,
                "private FunctionComponent bailout consumer expected work-in-progress {}, found root child {}",
                expected.slot().get(),
                actual.slot().get()
            ),
            Self::FunctionComponentAlternateMismatch {
                current,
                work_in_progress,
                actual_alternate,
            } => write!(
                formatter,
                "private FunctionComponent bailout consumer expected work-in-progress {} to alternate current {}, found {:?}",
                work_in_progress.slot().get(),
                current.slot().get(),
                actual_alternate.map(|fiber| fiber.slot().get())
            ),
            Self::SourceMismatch { field } => write!(
                formatter,
                "private FunctionComponent bailout mount source mismatch at {field}"
            ),
            Self::MissingAcceptedMountEvidence { field } => write!(
                formatter,
                "private FunctionComponent bailout consumer missing accepted single-child mount evidence at {field}"
            ),
            Self::StaleOrClonedMountEvidence { field } => write!(
                formatter,
                "private FunctionComponent bailout consumer rejected stale/cloned mount evidence at {field}"
            ),
            Self::CallerShapedMountEvidence => write!(
                formatter,
                "private FunctionComponent bailout consumer rejected caller-shaped mount evidence"
            ),
            Self::CompatibilityClaim { surface } => write!(
                formatter,
                "private FunctionComponent bailout consumer cannot claim {} compatibility",
                surface.as_str()
            ),
            Self::HostOutputMutated { before, after } => write!(
                formatter,
                "private FunctionComponent bailout consumer expected host output operations to stay at {before}, found {after}"
            ),
            Self::RootCurrentSwitched { before, after } => write!(
                formatter,
                "private FunctionComponent bailout consumer expected current root {} to remain current, found {}",
                before.slot().get(),
                after.slot().get()
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootFunctionComponentBailoutConsumerErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::RenderPhase(error) => Some(error),
            Self::ChildPreflight(error) => Some(error),
            Self::BeginWorkBailout(error) => Some(error),
            Self::MissingFunctionComponentChild { .. }
            | Self::ExpectedFunctionComponentChild { .. }
            | Self::FunctionComponentWorkMismatch { .. }
            | Self::FunctionComponentAlternateMismatch { .. }
            | Self::SourceMismatch { .. }
            | Self::MissingAcceptedMountEvidence { .. }
            | Self::StaleOrClonedMountEvidence { .. }
            | Self::CallerShapedMountEvidence
            | Self::CompatibilityClaim { .. }
            | Self::HostOutputMutated { .. }
            | Self::RootCurrentSwitched { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<FiberRootStoreError> for HostRootFunctionComponentBailoutConsumerErrorForCanary {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

#[cfg(test)]
impl From<FiberTopologyError> for HostRootFunctionComponentBailoutConsumerErrorForCanary {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[cfg(test)]
impl From<FunctionComponentBeginWorkBailoutBlockerError>
    for HostRootFunctionComponentBailoutConsumerErrorForCanary
{
    fn from(error: FunctionComponentBeginWorkBailoutBlockerError) -> Self {
        Self::BeginWorkBailout(error)
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootFunctionComponentBailoutConsumerErrorForCanary
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
fn record_function_component_single_child_mount_bailout_source_for_canary(
    store: &FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    function_component: FiberId,
    single_child: FunctionComponentSingleChildReconciliationRecord,
    complete_work: HostRootCompleteWorkHandoffRecord,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
) -> Result<
    HostRootFunctionComponentSingleChildMountBailoutSourceForCanary,
    HostRootFunctionComponentBailoutConsumerErrorForCanary,
> {
    let child = complete_work.completed_child().ok_or(
        HostRootFunctionComponentBailoutConsumerErrorForCanary::MissingAcceptedMountEvidence {
            field: "complete_work.completed_child",
        },
    )?;
    let child_tag = complete_work.completed_child_tag().ok_or(
        HostRootFunctionComponentBailoutConsumerErrorForCanary::MissingAcceptedMountEvidence {
            field: "complete_work.completed_child_tag",
        },
    )?;
    if single_child.function_component() != function_component {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::SourceMismatch {
                field: "single_child.function_component",
            },
        );
    }
    if complete_work.root() != render.root()
        || complete_work.host_root_work_in_progress() != render.work_in_progress()
        || complete_work.root_child() != Some(function_component)
        || complete_work.root_child_tag() != Some(FiberTag::FunctionComponent)
        || complete_work.completed_child() != Some(child)
        || complete_work.completed_child_tag() != Some(single_child.child_tag())
        || complete_work.resulting_element() != single_child.child_element()
    {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::SourceMismatch {
                field: "complete_work",
            },
        );
    }
    let commit = finished_work_handoff.commit();
    if commit.root() != render.root()
        || commit.previous_current() != render.current()
        || commit.current() != render.work_in_progress()
        || commit.finished_lanes() != render.render_lanes()
        || finished_work_handoff.current_after_commit() != render.work_in_progress()
    {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::SourceMismatch {
                field: "finished_work_handoff",
            },
        );
    }

    let function_node = store.fiber_arena().get(function_component)?;
    let child_node = store.fiber_arena().get(child)?;
    Ok(
        HostRootFunctionComponentSingleChildMountBailoutSourceForCanary {
            root: render.root(),
            root_token: render.root().state_node_handle(),
            previous_current: render.current(),
            committed_current: render.work_in_progress(),
            root_element: render.resulting_element(),
            render_lanes: render.render_lanes(),
            finished_work_after_commit: finished_work_handoff.finished_work_after_commit(),
            finished_lanes_after_commit: finished_work_handoff.finished_lanes_after_commit(),
            function_component,
            function_component_type: function_node.fiber_type(),
            function_component_pending_props: function_node.pending_props(),
            function_component_memoized_props: function_node.memoized_props(),
            single_child,
            complete_work,
            finished_work_handoff,
            child,
            child_tag,
            child_element: single_child.child_element(),
            child_props: child_node.memoized_props(),
            source_owned_mount_path_recorded: true,
            caller_built: false,
            compatibility_claims:
                HostRootFunctionComponentBailoutCompatibilityClaimsForCanary::none(),
        },
    )
}

#[cfg(test)]
fn validate_function_component_single_child_mount_bailout_source_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    source: &HostRootFunctionComponentSingleChildMountBailoutSourceForCanary,
) -> Result<(), HostRootFunctionComponentBailoutConsumerErrorForCanary> {
    if let Some(surface) = source.compatibility_claims.claimed_surface() {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::CompatibilityClaim { surface },
        );
    }
    if source.caller_built {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::CallerShapedMountEvidence,
        );
    }
    if !source.source_owned_mount_path_recorded {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::MissingAcceptedMountEvidence {
                field: "source_owned_mount_path_recorded",
            },
        );
    }
    if source.root_token != source.root.state_node_handle() {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::SourceMismatch {
                field: "root_token",
            },
        );
    }
    if !source
        .finished_work_handoff
        .proves_private_finished_work_commit_execution()
        || !source.finished_work_handoff.mutation_execution_blocked()
        || !source.finished_work_handoff.public_root_rendering_blocked()
        || !source
            .finished_work_handoff
            .effects_refs_and_hydration_blocked()
    {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::MissingAcceptedMountEvidence {
                field: "finished_work_handoff",
            },
        );
    }

    let commit = source.finished_work_handoff.commit();
    if commit.root() != source.root
        || commit.previous_current() != source.previous_current
        || commit.current() != source.committed_current
        || commit.finished_lanes() != source.render_lanes
    {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::SourceMismatch {
                field: "commit",
            },
        );
    }

    let root = store.root(source.root)?;
    if root.current() != source.committed_current {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::StaleOrClonedMountEvidence {
                field: "root.current",
            },
        );
    }
    if root.finished_work() != source.finished_work_after_commit {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::StaleOrClonedMountEvidence {
                field: "root.finished_work",
            },
        );
    }
    if root.finished_lanes() != source.finished_lanes_after_commit {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::StaleOrClonedMountEvidence {
                field: "root.finished_lanes",
            },
        );
    }

    let root_node = store.fiber_arena().get(source.committed_current)?;
    if root_node.tag() != FiberTag::HostRoot || root_node.child() != Some(source.function_component)
    {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::StaleOrClonedMountEvidence {
                field: "committed_root.child",
            },
        );
    }
    let function_node = store.fiber_arena().get(source.function_component)?;
    if function_node.tag() != FiberTag::FunctionComponent
        || function_node.fiber_type() != source.function_component_type
        || function_node.pending_props() != source.function_component_pending_props
        || function_node.memoized_props() != source.function_component_memoized_props
        || function_node.child() != Some(source.child)
        || function_node.sibling().is_some()
    {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::StaleOrClonedMountEvidence {
                field: "function_component",
            },
        );
    }
    let child_node = store.fiber_arena().get(source.child)?;
    if child_node.tag() != source.child_tag
        || child_node.return_fiber() != Some(source.function_component)
        || child_node.memoized_props() != source.child_props
    {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::StaleOrClonedMountEvidence {
                field: "single_child",
            },
        );
    }
    if source.single_child.function_component() != source.function_component
        || source.single_child.child_element() != source.child_element
        || source.single_child.child_tag() != source.child_tag
        || source.single_child.child_props() != source.child_props
        || source.complete_work.root() != source.root
        || source.complete_work.host_root_work_in_progress() != source.committed_current
        || source.complete_work.root_child() != Some(source.function_component)
        || source.complete_work.completed_child() != Some(source.child)
        || source.complete_work.completed_child_tag() != Some(source.child_tag)
    {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::SourceMismatch {
                field: "source_rows",
            },
        );
    }

    Ok(())
}

#[cfg(test)]
fn consume_root_work_loop_function_component_bailout_after_single_child_mount_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &HostRootFunctionComponentSingleChildMountBailoutSourceForCanary,
    request: HostRootFunctionComponentBailoutConsumerRequestForCanary,
    context_store: &FunctionComponentContextRenderStore,
) -> Result<
    HostRootFunctionComponentBailoutConsumerRecordForCanary,
    HostRootFunctionComponentBailoutConsumerErrorForCanary,
> {
    if let Some(surface) = request.compatibility_claims().claimed_surface() {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::CompatibilityClaim { surface },
        );
    }
    validate_function_component_single_child_mount_bailout_source_for_canary(store, source)?;
    validate_completed_host_root_render_for_complete_work_handoff(store, render).map_err(
        |error| {
            HostRootFunctionComponentBailoutConsumerErrorForCanary::RenderPhase(Box::new(error))
        },
    )?;

    if render.root() != source.root {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::SourceMismatch {
                field: "render.root",
            },
        );
    }
    if render.current() != source.committed_current {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::StaleOrClonedMountEvidence {
                field: "render.current",
            },
        );
    }

    let root_current_before = store.root(source.root)?.current();
    let host_operation_count_before = host.operations().len();
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;
    let child = validated.child.ok_or(
        HostRootFunctionComponentBailoutConsumerErrorForCanary::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootFunctionComponentBailoutConsumerErrorForCanary::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child != request.function_component_work_in_progress() {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::FunctionComponentWorkMismatch {
                expected: request.function_component_work_in_progress(),
                actual: child,
            },
        );
    }
    if child_tag != FiberTag::FunctionComponent {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::ExpectedFunctionComponentChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child,
                tag: child_tag,
            },
        );
    }
    let actual_alternate = store.fiber_arena().get(child)?.alternate();
    if actual_alternate != Some(source.function_component) {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::FunctionComponentAlternateMismatch {
                current: source.function_component,
                work_in_progress: child,
                actual_alternate,
            },
        );
    }

    let bailout_blocker = begin_work_function_component_bailout_blocker_for_test(
        store.fiber_arena_mut(),
        BeginWorkRequest::new(child, render.render_lanes()),
        context_store.context_dependencies(),
    )?;
    let root_current_after = store.root(source.root)?.current();
    let host_operation_count_after = host.operations().len();
    if root_current_after != root_current_before {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::RootCurrentSwitched {
                before: root_current_before,
                after: root_current_after,
            },
        );
    }
    if host_operation_count_after != host_operation_count_before {
        return Err(
            HostRootFunctionComponentBailoutConsumerErrorForCanary::HostOutputMutated {
                before: host_operation_count_before,
                after: host_operation_count_after,
            },
        );
    }

    Ok(HostRootFunctionComponentBailoutConsumerRecordForCanary {
        root: render.root(),
        host_root_work_in_progress: render.work_in_progress(),
        previous_current: source.previous_current,
        function_component_current: source.function_component,
        function_component_work_in_progress: child,
        mount_source: source.clone(),
        bailout_blocker,
        root_current_before,
        root_current_after,
        host_operation_count_before,
        host_operation_count_after,
    })
}

#[cfg(test)]
static HOST_ROOT_FUNCTION_COMPONENT_RENDER_PHASE_UPDATE_SOURCE_TOKEN_SEQUENCE_FOR_CANARY:
    AtomicU64 = AtomicU64::new(1);

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootFunctionComponentRenderPhaseUpdateSourceTokenForCanary(u64);

#[cfg(test)]
impl HostRootFunctionComponentRenderPhaseUpdateSourceTokenForCanary {
    fn next() -> Self {
        Self(
            HOST_ROOT_FUNCTION_COMPONENT_RENDER_PHASE_UPDATE_SOURCE_TOKEN_SEQUENCE_FOR_CANARY
                .fetch_add(1, Ordering::Relaxed),
        )
    }

    const fn raw(self) -> u64 {
        self.0
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary {
    PublicHook,
    PublicRoot,
    RootPrerequisite,
    ReactDom,
    NativeRenderer,
    ReactTestRenderer,
    Renderer,
    Scheduler,
    Act,
    Package,
}

#[cfg(test)]
impl HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary {
    const fn as_str(self) -> &'static str {
        match self {
            Self::PublicHook => "public hook",
            Self::PublicRoot => "public root",
            Self::RootPrerequisite => "root prerequisite",
            Self::ReactDom => "React DOM",
            Self::NativeRenderer => "native renderer",
            Self::ReactTestRenderer => "React Test Renderer",
            Self::Renderer => "renderer",
            Self::Scheduler => "Scheduler",
            Self::Act => "act",
            Self::Package => "package",
        }
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
struct HostRootFunctionComponentRenderPhaseUpdateCompatibilityClaimsForCanary {
    public_hook_compatibility_claimed: bool,
    public_root_compatibility_claimed: bool,
    root_prerequisite_claimed: bool,
    react_dom_compatibility_claimed: bool,
    native_renderer_compatibility_claimed: bool,
    test_renderer_compatibility_claimed: bool,
    renderer_compatibility_claimed: bool,
    scheduler_compatibility_claimed: bool,
    act_compatibility_claimed: bool,
    package_compatibility_claimed: bool,
}

#[cfg(test)]
impl HostRootFunctionComponentRenderPhaseUpdateCompatibilityClaimsForCanary {
    const fn none() -> Self {
        Self {
            public_hook_compatibility_claimed: false,
            public_root_compatibility_claimed: false,
            root_prerequisite_claimed: false,
            react_dom_compatibility_claimed: false,
            native_renderer_compatibility_claimed: false,
            test_renderer_compatibility_claimed: false,
            renderer_compatibility_claimed: false,
            scheduler_compatibility_claimed: false,
            act_compatibility_claimed: false,
            package_compatibility_claimed: false,
        }
    }

    const fn with_claim(
        mut self,
        surface: HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary,
    ) -> Self {
        match surface {
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::PublicHook => {
                self.public_hook_compatibility_claimed = true;
            }
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::PublicRoot => {
                self.public_root_compatibility_claimed = true;
            }
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::RootPrerequisite => {
                self.root_prerequisite_claimed = true;
            }
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::ReactDom => {
                self.react_dom_compatibility_claimed = true;
            }
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::NativeRenderer => {
                self.native_renderer_compatibility_claimed = true;
            }
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::ReactTestRenderer => {
                self.test_renderer_compatibility_claimed = true;
            }
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Renderer => {
                self.renderer_compatibility_claimed = true;
            }
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Scheduler => {
                self.scheduler_compatibility_claimed = true;
            }
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Act => {
                self.act_compatibility_claimed = true;
            }
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Package => {
                self.package_compatibility_claimed = true;
            }
        }
        self
    }

    const fn claimed_surface(
        self,
    ) -> Option<HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary> {
        if self.public_hook_compatibility_claimed {
            return Some(
                HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::PublicHook,
            );
        }
        if self.public_root_compatibility_claimed {
            return Some(
                HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::PublicRoot,
            );
        }
        if self.root_prerequisite_claimed {
            return Some(
                HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::RootPrerequisite,
            );
        }
        if self.react_dom_compatibility_claimed {
            return Some(
                HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::ReactDom,
            );
        }
        if self.native_renderer_compatibility_claimed {
            return Some(
                HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::NativeRenderer,
            );
        }
        if self.test_renderer_compatibility_claimed {
            return Some(
                HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::ReactTestRenderer,
            );
        }
        if self.renderer_compatibility_claimed {
            return Some(
                HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Renderer,
            );
        }
        if self.scheduler_compatibility_claimed {
            return Some(
                HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Scheduler,
            );
        }
        if self.act_compatibility_claimed {
            return Some(
                HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Act,
            );
        }
        if self.package_compatibility_claimed {
            return Some(
                HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Package,
            );
        }
        None
    }

    const fn compatibility_claim_blocked(self) -> bool {
        self.claimed_surface().is_none()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary {
    function_component_work_in_progress: FiberId,
    compatibility_claims: HostRootFunctionComponentRenderPhaseUpdateCompatibilityClaimsForCanary,
}

#[cfg(test)]
impl HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary {
    const fn new(function_component_work_in_progress: FiberId) -> Self {
        Self {
            function_component_work_in_progress,
            compatibility_claims:
                HostRootFunctionComponentRenderPhaseUpdateCompatibilityClaimsForCanary::none(),
        }
    }

    const fn with_compatibility_claim(
        mut self,
        surface: HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary,
    ) -> Self {
        self.compatibility_claims = self.compatibility_claims.with_claim(surface);
        self
    }

    const fn function_component_work_in_progress(self) -> FiberId {
        self.function_component_work_in_progress
    }

    const fn compatibility_claims(
        self,
    ) -> HostRootFunctionComponentRenderPhaseUpdateCompatibilityClaimsForCanary {
        self.compatibility_claims
    }
}

#[cfg(test)]
#[derive(Debug, PartialEq, Eq)]
struct HostRootFunctionComponentRenderPhaseUpdateSourceForCanary {
    root: FiberRootId,
    root_token: StateNodeHandle,
    root_current: FiberId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
    function_component_current: FiberId,
    function_component_work_in_progress: FiberId,
    function_component_type: FiberTypeHandle,
    current_hook_list: HookListId,
    work_in_progress_hook_list: HookListId,
    hook_list_owner: FiberId,
    hook_state: FunctionComponentHookRenderState,
    queue: HookQueueId,
    update: HookUpdateId,
    queue_generation: u32,
    update_generation: u32,
    dispatch: FunctionComponentRenderPhaseDispatchRecord,
    drain: FunctionComponentRenderPhaseStagingDrainRecord,
    mount_source: HostRootFunctionComponentSingleChildMountBailoutSourceForCanary,
    source_token: Option<HostRootFunctionComponentRenderPhaseUpdateSourceTokenForCanary>,
    source_owned_update_path_recorded: bool,
    caller_built: bool,
    consumed: bool,
    compatibility_claims: HostRootFunctionComponentRenderPhaseUpdateCompatibilityClaimsForCanary,
}

#[cfg(test)]
impl Clone for HostRootFunctionComponentRenderPhaseUpdateSourceForCanary {
    fn clone(&self) -> Self {
        Self {
            root: self.root,
            root_token: self.root_token,
            root_current: self.root_current,
            host_root_work_in_progress: self.host_root_work_in_progress,
            render_lanes: self.render_lanes,
            function_component_current: self.function_component_current,
            function_component_work_in_progress: self.function_component_work_in_progress,
            function_component_type: self.function_component_type,
            current_hook_list: self.current_hook_list,
            work_in_progress_hook_list: self.work_in_progress_hook_list,
            hook_list_owner: self.hook_list_owner,
            hook_state: self.hook_state,
            queue: self.queue,
            update: self.update,
            queue_generation: self.queue_generation,
            update_generation: self.update_generation,
            dispatch: self.dispatch,
            drain: self.drain.clone(),
            mount_source: self.mount_source.clone(),
            source_token: None,
            source_owned_update_path_recorded: self.source_owned_update_path_recorded,
            caller_built: self.caller_built,
            consumed: self.consumed,
            compatibility_claims: self.compatibility_claims,
        }
    }
}

#[cfg(test)]
impl HostRootFunctionComponentRenderPhaseUpdateSourceForCanary {
    const fn root(&self) -> FiberRootId {
        self.root
    }

    const fn root_token(&self) -> StateNodeHandle {
        self.root_token
    }

    const fn root_current(&self) -> FiberId {
        self.root_current
    }

    const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    const fn function_component_current(&self) -> FiberId {
        self.function_component_current
    }

    const fn function_component_work_in_progress(&self) -> FiberId {
        self.function_component_work_in_progress
    }

    const fn current_hook_list(&self) -> HookListId {
        self.current_hook_list
    }

    const fn work_in_progress_hook_list(&self) -> HookListId {
        self.work_in_progress_hook_list
    }

    const fn hook_list_owner(&self) -> FiberId {
        self.hook_list_owner
    }

    const fn hook_state(&self) -> FunctionComponentHookRenderState {
        self.hook_state
    }

    const fn queue(&self) -> HookQueueId {
        self.queue
    }

    const fn update(&self) -> HookUpdateId {
        self.update
    }

    const fn queue_generation(&self) -> u32 {
        self.queue_generation
    }

    const fn update_generation(&self) -> u32 {
        self.update_generation
    }

    const fn dispatch(&self) -> FunctionComponentRenderPhaseDispatchRecord {
        self.dispatch
    }

    const fn drain(&self) -> &FunctionComponentRenderPhaseStagingDrainRecord {
        &self.drain
    }

    const fn source_token(
        &self,
    ) -> Option<HostRootFunctionComponentRenderPhaseUpdateSourceTokenForCanary> {
        self.source_token
    }

    const fn source_owned_update_path_recorded(&self) -> bool {
        self.source_owned_update_path_recorded
    }

    const fn caller_built(&self) -> bool {
        self.caller_built
    }

    const fn consumed(&self) -> bool {
        self.consumed
    }

    const fn compatibility_claim_blocked(&self) -> bool {
        self.compatibility_claims.compatibility_claim_blocked()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct HostRootFunctionComponentRenderPhaseUpdateConsumerRecordForCanary {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    root_current_before: FiberId,
    root_current_after: FiberId,
    host_operation_count_before: usize,
    host_operation_count_after: usize,
    function_component_current: FiberId,
    function_component_work_in_progress: FiberId,
    current_hook_list: HookListId,
    work_in_progress_hook_list: HookListId,
    hook_list_owner: FiberId,
    hook_state: FunctionComponentHookRenderState,
    queue: HookQueueId,
    update: HookUpdateId,
    dispatch: FunctionComponentRenderPhaseDispatchRecord,
    drain: FunctionComponentRenderPhaseStagingDrainRecord,
    source_token: HostRootFunctionComponentRenderPhaseUpdateSourceTokenForCanary,
    render_lanes: Lanes,
}

#[cfg(test)]
impl HostRootFunctionComponentRenderPhaseUpdateConsumerRecordForCanary {
    const fn root(&self) -> FiberRootId {
        self.root
    }

    const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    const fn root_current_before(&self) -> FiberId {
        self.root_current_before
    }

    const fn root_current_after(&self) -> FiberId {
        self.root_current_after
    }

    const fn host_operation_count_before(&self) -> usize {
        self.host_operation_count_before
    }

    const fn host_operation_count_after(&self) -> usize {
        self.host_operation_count_after
    }

    const fn function_component_current(&self) -> FiberId {
        self.function_component_current
    }

    const fn function_component_work_in_progress(&self) -> FiberId {
        self.function_component_work_in_progress
    }

    const fn current_hook_list(&self) -> HookListId {
        self.current_hook_list
    }

    const fn work_in_progress_hook_list(&self) -> HookListId {
        self.work_in_progress_hook_list
    }

    const fn hook_list_owner(&self) -> FiberId {
        self.hook_list_owner
    }

    const fn hook_state(&self) -> FunctionComponentHookRenderState {
        self.hook_state
    }

    const fn queue(&self) -> HookQueueId {
        self.queue
    }

    const fn update(&self) -> HookUpdateId {
        self.update
    }

    const fn dispatch(&self) -> FunctionComponentRenderPhaseDispatchRecord {
        self.dispatch
    }

    const fn drain(&self) -> &FunctionComponentRenderPhaseStagingDrainRecord {
        &self.drain
    }

    const fn source_token(&self) -> HostRootFunctionComponentRenderPhaseUpdateSourceTokenForCanary {
        self.source_token
    }

    const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    fn exact_function_component_hook_identity(&self) -> bool {
        self.hook_state.phase() == FunctionComponentHookRenderPhase::Update
            && self.hook_state.render_fiber() == self.function_component_work_in_progress
            && self.hook_state.current() == Some(self.function_component_current)
            && self.hook_state.current_list() == Some(self.current_hook_list)
            && self.hook_state.work_in_progress_list() == self.work_in_progress_hook_list
            && self.hook_list_owner == self.function_component_current
            && self.dispatch.render_fiber() == self.function_component_work_in_progress
            && self.dispatch.current() == Some(self.function_component_current)
            && self.dispatch.current_list() == Some(self.current_hook_list)
            && self.dispatch.work_in_progress_list() == self.work_in_progress_hook_list
            && self.drain.render_fiber() == self.function_component_work_in_progress
            && self.drain.current() == Some(self.function_component_current)
    }

    fn consumed_source_owned_render_phase_update(&self) -> bool {
        self.source_token.raw() != 0
            && self.exact_function_component_hook_identity()
            && self.dispatch.source_owned_currentness()
            && !self.dispatch.caller_built_rows_accepted()
            && self
                .dispatch
                .dispatch_belongs_to_currently_rendering_fiber()
            && self.drain.proves_current_render_phase_staging()
            && self
                .drain
                .queues()
                .iter()
                .zip(self.drain.updates())
                .any(|(queue, update)| *queue == self.queue && *update == self.update)
    }

    const fn render_phase_update_did_not_escape_to_root_scheduler(&self) -> bool {
        !self.dispatch.root_scheduled() && !self.drain.root_scheduled()
    }

    const fn component_invocation_blocked(&self) -> bool {
        true
    }

    const fn host_output_unchanged(&self) -> bool {
        self.host_operation_count_before == self.host_operation_count_after
    }

    fn current_switch_blocked(&self) -> bool {
        self.root_current_before == self.root_current_after
    }

    const fn public_hook_compatibility_claimed(&self) -> bool {
        false
    }

    const fn public_root_compatibility_claimed(&self) -> bool {
        false
    }

    const fn root_prerequisite_claimed(&self) -> bool {
        false
    }

    const fn react_dom_compatibility_claimed(&self) -> bool {
        false
    }

    const fn native_renderer_compatibility_claimed(&self) -> bool {
        false
    }

    const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }

    const fn scheduler_compatibility_claimed(&self) -> bool {
        false
    }

    const fn act_compatibility_claimed(&self) -> bool {
        false
    }

    const fn package_compatibility_claimed(&self) -> bool {
        false
    }

    const fn compatibility_claim_blocked(&self) -> bool {
        !self.public_hook_compatibility_claimed()
            && !self.public_root_compatibility_claimed()
            && !self.root_prerequisite_claimed()
            && !self.react_dom_compatibility_claimed()
            && !self.native_renderer_compatibility_claimed()
            && !self.test_renderer_compatibility_claimed()
            && !self.scheduler_compatibility_claimed()
            && !self.act_compatibility_claimed()
            && !self.package_compatibility_claimed()
    }

    fn public_renderer_behavior_blocked(&self) -> bool {
        self.compatibility_claim_blocked()
            && self.component_invocation_blocked()
            && self.host_output_unchanged()
            && self.current_switch_blocked()
            && self.render_phase_update_did_not_escape_to_root_scheduler()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    RenderPhase(Box<HostRootCompleteWorkHandoffError>),
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    MountSource(Box<HostRootFunctionComponentBailoutConsumerErrorForCanary>),
    FunctionComponentRender(FunctionComponentRenderError),
    MissingFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    FunctionComponentWorkMismatch {
        expected: FiberId,
        actual: FiberId,
    },
    FunctionComponentAlternateMismatch {
        current: FiberId,
        work_in_progress: FiberId,
        actual_alternate: Option<FiberId>,
    },
    SourceMismatch {
        field: &'static str,
    },
    StaleOrClonedEvidence {
        field: &'static str,
    },
    MissingSourceToken,
    AlreadyConsumed {
        token: HostRootFunctionComponentRenderPhaseUpdateSourceTokenForCanary,
    },
    MissingAcceptedRenderPhaseEvidence {
        field: &'static str,
    },
    CallerShapedRenderPhaseEvidence,
    HookStateMismatch {
        field: &'static str,
    },
    HookListOwnerMismatch {
        hook_list: HookListId,
        expected_owner: FiberId,
        actual_owner: FiberId,
    },
    RenderPhaseEvidenceMismatch {
        field: &'static str,
    },
    CompatibilityClaim {
        surface: HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary,
    },
    HostOutputMutated {
        before: usize,
        after: usize,
    },
    RootCurrentSwitched {
        before: FiberId,
        after: FiberId,
    },
}

#[cfg(test)]
impl Display for HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::RenderPhase(error) => Display::fmt(error, formatter),
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::MountSource(error) => Display::fmt(error, formatter),
            Self::FunctionComponentRender(error) => Display::fmt(error, formatter),
            Self::MissingFunctionComponentChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no FunctionComponent child for private render-phase update consumer",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedFunctionComponentChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be FunctionComponent for private render-phase update consumer, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::FunctionComponentWorkMismatch { expected, actual } => write!(
                formatter,
                "private render-phase update consumer expected FunctionComponent work-in-progress {}, found {}",
                expected.slot().get(),
                actual.slot().get()
            ),
            Self::FunctionComponentAlternateMismatch {
                current,
                work_in_progress,
                actual_alternate,
            } => write!(
                formatter,
                "private render-phase update consumer expected work-in-progress {} to alternate current {}, found {:?}",
                work_in_progress.slot().get(),
                current.slot().get(),
                actual_alternate.map(|fiber| fiber.slot().get())
            ),
            Self::SourceMismatch { field } => write!(
                formatter,
                "private render-phase update source mismatch at {field}"
            ),
            Self::StaleOrClonedEvidence { field } => write!(
                formatter,
                "private render-phase update consumer rejected stale/cloned evidence at {field}"
            ),
            Self::MissingSourceToken => write!(
                formatter,
                "private render-phase update consumer rejected cloned evidence without source token"
            ),
            Self::AlreadyConsumed { token } => write!(
                formatter,
                "private render-phase update source token {} was already consumed",
                token.raw()
            ),
            Self::MissingAcceptedRenderPhaseEvidence { field } => write!(
                formatter,
                "private render-phase update consumer missing accepted source evidence at {field}"
            ),
            Self::CallerShapedRenderPhaseEvidence => write!(
                formatter,
                "private render-phase update consumer rejected caller-shaped evidence"
            ),
            Self::HookStateMismatch { field } => write!(
                formatter,
                "private render-phase update hook state mismatch at {field}"
            ),
            Self::HookListOwnerMismatch {
                hook_list,
                expected_owner,
                actual_owner,
            } => write!(
                formatter,
                "private render-phase update hook list {} expected owner {}, found {}",
                hook_list.slot().get(),
                expected_owner.slot().get(),
                actual_owner.slot().get()
            ),
            Self::RenderPhaseEvidenceMismatch { field } => write!(
                formatter,
                "private render-phase update evidence mismatch at {field}"
            ),
            Self::CompatibilityClaim { surface } => write!(
                formatter,
                "private render-phase update consumer cannot claim {} compatibility",
                surface.as_str()
            ),
            Self::HostOutputMutated { before, after } => write!(
                formatter,
                "private render-phase update consumer expected host operation count {before}, found {after}"
            ),
            Self::RootCurrentSwitched { before, after } => write!(
                formatter,
                "private render-phase update consumer expected current root {} to remain current, found {}",
                before.slot().get(),
                after.slot().get()
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::RenderPhase(error) => Some(error),
            Self::ChildPreflight(error) => Some(error),
            Self::MountSource(error) => Some(error),
            Self::FunctionComponentRender(error) => Some(error),
            Self::MissingFunctionComponentChild { .. }
            | Self::ExpectedFunctionComponentChild { .. }
            | Self::FunctionComponentWorkMismatch { .. }
            | Self::FunctionComponentAlternateMismatch { .. }
            | Self::SourceMismatch { .. }
            | Self::StaleOrClonedEvidence { .. }
            | Self::MissingSourceToken
            | Self::AlreadyConsumed { .. }
            | Self::MissingAcceptedRenderPhaseEvidence { .. }
            | Self::CallerShapedRenderPhaseEvidence
            | Self::HookStateMismatch { .. }
            | Self::HookListOwnerMismatch { .. }
            | Self::RenderPhaseEvidenceMismatch { .. }
            | Self::CompatibilityClaim { .. }
            | Self::HostOutputMutated { .. }
            | Self::RootCurrentSwitched { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<FiberRootStoreError>
    for HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary
{
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

#[cfg(test)]
impl From<FiberTopologyError> for HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[cfg(test)]
impl From<FunctionComponentRenderError>
    for HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary
{
    fn from(error: FunctionComponentRenderError) -> Self {
        Self::FunctionComponentRender(error)
    }
}

#[cfg(test)]
fn render_phase_source_evidence_claimed_surface_for_canary(
    source: FunctionComponentRenderPhaseSourceEvidenceForCanary,
) -> Option<HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary> {
    if source.public_hook_compatibility_claimed() {
        return Some(
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::PublicHook,
        );
    }
    if source.public_root_compatibility_claimed() {
        return Some(
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::PublicRoot,
        );
    }
    if source.root_scheduler_integration_claimed() {
        return Some(
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::RootPrerequisite,
        );
    }
    if source.scheduler_compatibility_claimed() {
        return Some(
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Scheduler,
        );
    }
    if source.act_compatibility_claimed() {
        return Some(HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Act);
    }
    if source.renderer_compatibility_claimed() {
        return Some(
            HostRootFunctionComponentRenderPhaseUpdateCompatibilitySurfaceForCanary::Renderer,
        );
    }
    None
}

#[cfg(test)]
fn validate_render_phase_source_evidence_for_canary(
    source: FunctionComponentRenderPhaseSourceEvidenceForCanary,
    field: &'static str,
) -> Result<(), HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary> {
    if let Some(surface) = render_phase_source_evidence_claimed_surface_for_canary(source) {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::CompatibilityClaim {
                surface,
            },
        );
    }
    if source.react_version() != "19.2.6"
        || source.render_with_hooks_again() != "ReactFiberHooks.renderWithHooksAgain"
        || source.currently_rendering_fiber() != "currentlyRenderingFiber"
        || source.is_render_phase_update() != "isRenderPhaseUpdate"
        || source.enqueue_render_phase_update() != "enqueueRenderPhaseUpdate"
        || source.hook_staging_failure_preservation() != "HookUpdateStaging.finish_queueing"
    {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::MissingAcceptedRenderPhaseEvidence {
                field,
            },
        );
    }
    Ok(())
}

#[cfg(test)]
fn validate_root_work_loop_function_component_render_phase_update_source_for_canary(
    store: &FiberRootStore<RecordingHost>,
    hook_store: &FunctionComponentHookRenderStore,
    render: HostRootRenderPhaseRecord,
    source: &HostRootFunctionComponentRenderPhaseUpdateSourceForCanary,
) -> Result<
    HostRootFunctionComponentRenderPhaseUpdateSourceTokenForCanary,
    HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary,
> {
    if let Some(surface) = source.compatibility_claims.claimed_surface() {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::CompatibilityClaim {
                surface,
            },
        );
    }
    if source.caller_built {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::CallerShapedRenderPhaseEvidence,
        );
    }
    if !source.source_owned_update_path_recorded {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::MissingAcceptedRenderPhaseEvidence {
                field: "source_owned_update_path_recorded",
            },
        );
    }
    let source_token = source.source_token.ok_or(
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::MissingSourceToken,
    )?;
    if source.consumed {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::AlreadyConsumed {
                token: source_token,
            },
        );
    }
    validate_render_phase_source_evidence_for_canary(source.dispatch.source(), "dispatch.source")?;
    validate_render_phase_source_evidence_for_canary(source.drain.source(), "drain.source")?;
    validate_function_component_single_child_mount_bailout_source_for_canary(
        store,
        &source.mount_source,
    )
    .map_err(|error| {
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::MountSource(Box::new(
            error,
        ))
    })?;
    validate_completed_host_root_render_for_complete_work_handoff(store, render).map_err(
        |error| {
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::RenderPhase(Box::new(
                error,
            ))
        },
    )?;

    if source.root_token != source.root.state_node_handle() {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::SourceMismatch {
                field: "root_token",
            },
        );
    }
    if source.root != source.mount_source.root()
        || source.root_current != source.mount_source.committed_current()
        || source.function_component_current != source.mount_source.function_component()
        || source.function_component_type != source.mount_source.function_component_type()
    {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::SourceMismatch {
                field: "mount_source",
            },
        );
    }
    if render.root() != source.root {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::SourceMismatch {
                field: "render.root",
            },
        );
    }
    if render.current() != source.root_current {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::StaleOrClonedEvidence {
                field: "render.current",
            },
        );
    }
    if render.work_in_progress() != source.host_root_work_in_progress
        || render.render_lanes() != source.render_lanes
    {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::SourceMismatch {
                field: "render",
            },
        );
    }
    if store.root(source.root)?.current() != source.root_current {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::StaleOrClonedEvidence {
                field: "root.current",
            },
        );
    }

    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )
    .map_err(|error| {
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::ChildPreflight(Box::new(
            error,
        ))
    })?;
    let child = validated.child.ok_or(
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child != source.function_component_work_in_progress {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::FunctionComponentWorkMismatch {
                expected: source.function_component_work_in_progress,
                actual: child,
            },
        );
    }
    if child_tag != FiberTag::FunctionComponent {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::ExpectedFunctionComponentChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child,
                tag: child_tag,
            },
        );
    }
    let child_node = store.fiber_arena().get(child)?;
    if child_node.alternate() != Some(source.function_component_current) {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::FunctionComponentAlternateMismatch {
                current: source.function_component_current,
                work_in_progress: child,
                actual_alternate: child_node.alternate(),
            },
        );
    }
    if child_node.fiber_type() != source.function_component_type {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::SourceMismatch {
                field: "function_component_type",
            },
        );
    }

    if source.hook_state.phase() != FunctionComponentHookRenderPhase::Update {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::HookStateMismatch {
                field: "hook_state.phase",
            },
        );
    }
    if source.hook_state.render_fiber() != source.function_component_work_in_progress
        || source.hook_state.current() != Some(source.function_component_current)
    {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::HookStateMismatch {
                field: "hook_state.identity",
            },
        );
    }
    let current_list_owner = hook_store
        .hook_lists()
        .list(source.current_hook_list)
        .map_err(|_| {
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::StaleOrClonedEvidence {
                field: "current_hook_list",
            }
        })?
        .owner();
    if current_list_owner != source.function_component_current {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::HookListOwnerMismatch {
                hook_list: source.current_hook_list,
                expected_owner: source.function_component_current,
                actual_owner: current_list_owner,
            },
        );
    }
    if source.hook_state.current_list() != Some(source.current_hook_list)
        || source.hook_state.work_in_progress_list() != source.work_in_progress_hook_list
    {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::HookStateMismatch {
                field: "hook_state.hook_lists",
            },
        );
    }
    if hook_store.current_list(source.function_component_current) != Some(source.current_hook_list)
    {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::StaleOrClonedEvidence {
                field: "current_hook_list",
            },
        );
    }
    let work_in_progress_list_owner = hook_store
        .hook_lists()
        .list(source.work_in_progress_hook_list)
        .map_err(|_| {
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::StaleOrClonedEvidence {
                field: "work_in_progress_hook_list",
            }
        })?
        .owner();
    if source.hook_list_owner != source.function_component_current {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::HookListOwnerMismatch {
                hook_list: source.work_in_progress_hook_list,
                expected_owner: source.function_component_current,
                actual_owner: source.hook_list_owner,
            },
        );
    }
    if work_in_progress_list_owner != source.hook_list_owner {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::HookListOwnerMismatch {
                hook_list: source.work_in_progress_hook_list,
                expected_owner: source.function_component_current,
                actual_owner: work_in_progress_list_owner,
            },
        );
    }

    if !source.dispatch.source_owned_currentness()
        || source.dispatch.caller_built_rows_accepted()
        || source.dispatch.root_scheduled()
        || !source
            .dispatch
            .dispatch_belongs_to_currently_rendering_fiber()
    {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::MissingAcceptedRenderPhaseEvidence {
                field: "dispatch",
            },
        );
    }
    if source.dispatch.render_fiber() != source.function_component_work_in_progress
        || source.dispatch.current() != Some(source.function_component_current)
        || source.dispatch.current_list() != Some(source.current_hook_list)
        || source.dispatch.work_in_progress_list() != source.work_in_progress_hook_list
        || source.dispatch.queue() != source.queue
        || source.dispatch.update() != source.update
        || source.dispatch.queue_generation() != source.queue_generation
        || source.dispatch.update_generation() != source.update_generation
    {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::RenderPhaseEvidenceMismatch {
                field: "dispatch",
            },
        );
    }
    if source.dispatch.lane().priority_lanes().is_non_empty()
        && !source
            .render_lanes
            .contains_all(source.dispatch.lane().priority_lanes())
    {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::RenderPhaseEvidenceMismatch {
                field: "dispatch.lane",
            },
        );
    }

    if !source.drain.proves_current_render_phase_staging()
        || source.drain.drained_update_count() == 0
        || source.drain.root_scheduled()
        || source.drain.render_fiber() != source.function_component_work_in_progress
        || source.drain.current() != Some(source.function_component_current)
        || source.drain.render_lanes() != source.render_lanes
        || source.drain.attempt() != source.dispatch.attempt()
        || source.drain.staging_generation() != source.dispatch.staging_generation()
    {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::MissingAcceptedRenderPhaseEvidence {
                field: "drain",
            },
        );
    }
    let Some(drain_index) = source
        .drain
        .queues()
        .iter()
        .zip(source.drain.updates())
        .position(|(queue, update)| *queue == source.queue && *update == source.update)
    else {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::RenderPhaseEvidenceMismatch {
                field: "drain.queue_update",
            },
        );
    };
    if source.drain.queue_generations().get(drain_index) != Some(&source.queue_generation)
        || source.drain.update_generations().get(drain_index) != Some(&source.update_generation)
    {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::RenderPhaseEvidenceMismatch {
                field: "drain.generations",
            },
        );
    }

    Ok(source_token)
}

#[cfg(test)]
fn record_root_work_loop_function_component_render_phase_update_source_for_canary(
    store: &FiberRootStore<RecordingHost>,
    hook_store: &FunctionComponentHookRenderStore,
    render: HostRootRenderPhaseRecord,
    mount_source: &HostRootFunctionComponentSingleChildMountBailoutSourceForCanary,
    function_component_work_in_progress: FiberId,
    hook_state: FunctionComponentHookRenderState,
    dispatch: FunctionComponentRenderPhaseDispatchRecord,
    drain: FunctionComponentRenderPhaseStagingDrainRecord,
) -> Result<
    HostRootFunctionComponentRenderPhaseUpdateSourceForCanary,
    HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary,
> {
    let current_hook_list = hook_state.current_list().ok_or(
        HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::HookStateMismatch {
            field: "hook_state.current_list",
        },
    )?;
    let hook_list_owner = hook_store
        .hook_lists()
        .list(hook_state.work_in_progress_list())
        .map_err(|_| {
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::StaleOrClonedEvidence {
                field: "work_in_progress_hook_list",
            }
        })?
        .owner();
    let source = HostRootFunctionComponentRenderPhaseUpdateSourceForCanary {
        root: render.root(),
        root_token: render.root().state_node_handle(),
        root_current: render.current(),
        host_root_work_in_progress: render.work_in_progress(),
        render_lanes: render.render_lanes(),
        function_component_current: mount_source.function_component(),
        function_component_work_in_progress,
        function_component_type: mount_source.function_component_type(),
        current_hook_list,
        work_in_progress_hook_list: hook_state.work_in_progress_list(),
        hook_list_owner,
        hook_state,
        queue: dispatch.queue(),
        update: dispatch.update(),
        queue_generation: dispatch.queue_generation(),
        update_generation: dispatch.update_generation(),
        dispatch,
        drain,
        mount_source: mount_source.clone(),
        source_token: Some(HostRootFunctionComponentRenderPhaseUpdateSourceTokenForCanary::next()),
        source_owned_update_path_recorded: true,
        caller_built: false,
        consumed: false,
        compatibility_claims:
            HostRootFunctionComponentRenderPhaseUpdateCompatibilityClaimsForCanary::none(),
    };
    validate_root_work_loop_function_component_render_phase_update_source_for_canary(
        store, hook_store, render, &source,
    )?;
    Ok(source)
}

#[cfg(test)]
fn consume_root_work_loop_function_component_render_phase_update_currentness_for_canary(
    store: &FiberRootStore<RecordingHost>,
    host: &RecordingHost,
    hook_store: &FunctionComponentHookRenderStore,
    render: HostRootRenderPhaseRecord,
    source: &mut HostRootFunctionComponentRenderPhaseUpdateSourceForCanary,
    request: HostRootFunctionComponentRenderPhaseUpdateConsumerRequestForCanary,
) -> Result<
    HostRootFunctionComponentRenderPhaseUpdateConsumerRecordForCanary,
    HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary,
> {
    if let Some(surface) = request.compatibility_claims().claimed_surface() {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::CompatibilityClaim {
                surface,
            },
        );
    }
    let root_current_before = store.root(source.root)?.current();
    let host_operation_count_before = host.operations().len();
    let source_token =
        validate_root_work_loop_function_component_render_phase_update_source_for_canary(
            store, hook_store, render, source,
        )?;
    if request.function_component_work_in_progress() != source.function_component_work_in_progress {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::FunctionComponentWorkMismatch {
                expected: source.function_component_work_in_progress,
                actual: request.function_component_work_in_progress(),
            },
        );
    }
    let root_current_after = store.root(source.root)?.current();
    let host_operation_count_after = host.operations().len();
    if root_current_after != root_current_before {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::RootCurrentSwitched {
                before: root_current_before,
                after: root_current_after,
            },
        );
    }
    if host_operation_count_after != host_operation_count_before {
        return Err(
            HostRootFunctionComponentRenderPhaseUpdateConsumerErrorForCanary::HostOutputMutated {
                before: host_operation_count_before,
                after: host_operation_count_after,
            },
        );
    }

    source.consumed = true;
    Ok(
        HostRootFunctionComponentRenderPhaseUpdateConsumerRecordForCanary {
            root: source.root,
            host_root_work_in_progress: source.host_root_work_in_progress,
            root_current_before,
            root_current_after,
            host_operation_count_before,
            host_operation_count_after,
            function_component_current: source.function_component_current,
            function_component_work_in_progress: source.function_component_work_in_progress,
            current_hook_list: source.current_hook_list,
            work_in_progress_hook_list: source.work_in_progress_hook_list,
            hook_list_owner: source.hook_list_owner,
            hook_state: source.hook_state,
            queue: source.queue,
            update: source.update,
            dispatch: source.dispatch,
            drain: source.drain.clone(),
            source_token,
            render_lanes: source.render_lanes,
        },
    )
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct HostRootFunctionComponentUseStateHostChildCommitHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    original_root_element: RootElementHandle,
    function_component: FiberId,
    use_state_begin_work: FunctionComponentUseStateBeginWorkRecord,
    single_child: FunctionComponentSingleChildReconciliationRecord,
    complete_commit: HostRootCompleteWorkCommitHandoffRecord,
    host_mutation_apply: TestHostRootMutationApplyResult,
    host_operation_count_after_host_mutation: usize,
}

#[cfg(test)]
impl HostRootFunctionComponentUseStateHostChildCommitHandoffRecord {
    #[must_use]
    const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn original_root_element(&self) -> RootElementHandle {
        self.original_root_element
    }

    #[must_use]
    const fn function_component(&self) -> FiberId {
        self.function_component
    }

    #[must_use]
    const fn use_state_begin_work(&self) -> FunctionComponentUseStateBeginWorkRecord {
        self.use_state_begin_work
    }

    #[must_use]
    const fn single_child(&self) -> FunctionComponentSingleChildReconciliationRecord {
        self.single_child
    }

    #[must_use]
    const fn complete_work(&self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_commit.complete_work()
    }

    #[must_use]
    const fn commit(&self) -> &HostRootCommitRecord {
        self.complete_commit.commit()
    }

    #[must_use]
    const fn finished_work_handoff(&self) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        self.complete_commit.finished_work_handoff()
    }

    #[must_use]
    fn placement_apply_diagnostics(&self) -> &[HostRootPlacementApplyDiagnosticForCanary] {
        self.complete_commit.placement_apply_diagnostics()
    }

    #[must_use]
    const fn host_operations_unchanged_by_commit(&self) -> bool {
        self.complete_commit.host_operations_unchanged_by_commit()
    }

    #[must_use]
    const fn host_operation_count_after_host_mutation(&self) -> usize {
        self.host_operation_count_after_host_mutation
    }

    #[must_use]
    fn host_mutation_apply(&self) -> &TestHostRootMutationApplyResult {
        &self.host_mutation_apply
    }

    #[must_use]
    fn private_test_host_mutation_executed(&self) -> bool {
        self.host_mutation_apply.applied_host_call_count()
            + self.host_mutation_apply.private_host_store_update_count()
            > 0
    }

    #[must_use]
    const fn public_render_blocked(&self) -> bool {
        self.complete_commit.public_render_blocked()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct HostRootFunctionComponentUseReducerSingleChildCommitHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    original_root_element: RootElementHandle,
    function_component: FiberId,
    use_reducer_render: FunctionComponentUseReducerRenderRecord,
    single_child: FunctionComponentSingleChildReconciliationRecord,
    complete_commit: HostRootCompleteWorkCommitHandoffRecord,
    host_mutation_apply: TestHostRootMutationApplyResult,
    host_operation_count_after_host_mutation: usize,
}

#[cfg(test)]
impl HostRootFunctionComponentUseReducerSingleChildCommitHandoffRecord {
    #[must_use]
    const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn original_root_element(&self) -> RootElementHandle {
        self.original_root_element
    }

    #[must_use]
    const fn function_component(&self) -> FiberId {
        self.function_component
    }

    #[must_use]
    const fn use_reducer_render(&self) -> FunctionComponentUseReducerRenderRecord {
        self.use_reducer_render
    }

    #[must_use]
    const fn single_child(&self) -> FunctionComponentSingleChildReconciliationRecord {
        self.single_child
    }

    #[must_use]
    const fn complete_work(&self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_commit.complete_work()
    }

    #[must_use]
    const fn commit(&self) -> &HostRootCommitRecord {
        self.complete_commit.commit()
    }

    #[must_use]
    const fn finished_work_handoff(&self) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        self.complete_commit.finished_work_handoff()
    }

    #[must_use]
    fn placement_apply_diagnostics(&self) -> &[HostRootPlacementApplyDiagnosticForCanary] {
        self.complete_commit.placement_apply_diagnostics()
    }

    #[must_use]
    const fn host_operations_unchanged_by_commit(&self) -> bool {
        self.complete_commit.host_operations_unchanged_by_commit()
    }

    #[must_use]
    const fn host_operation_count_after_host_mutation(&self) -> usize {
        self.host_operation_count_after_host_mutation
    }

    #[must_use]
    fn host_mutation_apply(&self) -> &TestHostRootMutationApplyResult {
        &self.host_mutation_apply
    }

    #[must_use]
    fn private_test_host_mutation_executed(&self) -> bool {
        self.host_mutation_apply.applied_host_call_count()
            + self.host_mutation_apply.private_host_store_update_count()
            > 0
    }

    #[must_use]
    const fn public_render_blocked(&self) -> bool {
        self.complete_commit.public_render_blocked()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    original_root_element: RootElementHandle,
    function_component: FiberId,
    hook_evidence: FunctionComponentUseReducerAcceptedUpdateEvidenceForCanary,
    use_reducer_render: FunctionComponentUseReducerRenderRecord,
    single_child_update: FunctionComponentSingleChildUpdateReconciliationRecord,
    complete_work: HostRootCompleteWorkHandoffRecord,
    pending_host_update: HostRootSingleHostUpdateApplyRecordForCanary,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    committed_host_update: HostRootSingleHostUpdateApplyRecordForCanary,
    host_execution: TestHostRootHostUpdateExecutionDiagnosticForCanary,
}

#[cfg(test)]
impl HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffRecord {
    #[must_use]
    const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn original_root_element(&self) -> RootElementHandle {
        self.original_root_element
    }

    #[must_use]
    const fn function_component(&self) -> FiberId {
        self.function_component
    }

    #[must_use]
    const fn hook_evidence(&self) -> FunctionComponentUseReducerAcceptedUpdateEvidenceForCanary {
        self.hook_evidence
    }

    #[must_use]
    const fn use_reducer_render(&self) -> FunctionComponentUseReducerRenderRecord {
        self.use_reducer_render
    }

    #[must_use]
    const fn single_child_update(&self) -> FunctionComponentSingleChildUpdateReconciliationRecord {
        self.single_child_update
    }

    #[must_use]
    const fn complete_work(&self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_work
    }

    #[must_use]
    const fn pending_host_update(&self) -> HostRootSingleHostUpdateApplyRecordForCanary {
        self.pending_host_update
    }

    #[must_use]
    const fn finished_work_handoff(&self) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    const fn commit(&self) -> &HostRootCommitRecord {
        self.finished_work_handoff.commit()
    }

    #[must_use]
    const fn committed_host_update(&self) -> HostRootSingleHostUpdateApplyRecordForCanary {
        self.committed_host_update
    }

    #[must_use]
    const fn host_execution(&self) -> &TestHostRootHostUpdateExecutionDiagnosticForCanary {
        &self.host_execution
    }

    #[must_use]
    const fn public_render_blocked(&self) -> bool {
        self.finished_work_handoff.public_root_rendering_blocked()
            && self.pending_host_update.public_root_rendering_blocked()
            && !self
                .pending_host_update
                .public_renderer_package_behavior_exposed()
            && self.host_execution.public_root_rendering_blocked()
            && !self
                .host_execution
                .public_renderer_package_behavior_exposed()
            && !self.hook_evidence.public_hook_compatibility_claimed()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootFunctionComponentSingleChildCompleteWorkHandoffError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    BeginWork(BeginWorkError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    MissingFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    UnexpectedFunctionComponentSibling {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        function_component: FiberId,
        sibling: FiberId,
    },
    CompletedChildTagMismatch {
        expected: FiberTag,
        actual: Option<FiberTag>,
    },
}

#[cfg(test)]
impl Display for HostRootFunctionComponentSingleChildCompleteWorkHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::BeginWork(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::MissingFunctionComponentChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no FunctionComponent child for private single-child output handoff",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedFunctionComponentChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be FunctionComponent for private single-child output handoff, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::UnexpectedFunctionComponentSibling {
                root,
                host_root_work_in_progress,
                function_component,
                sibling,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has FunctionComponent child {} with sibling {}; private parent-topology canary admits only one child",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                function_component.slot().get(),
                sibling.slot().get()
            ),
            Self::CompletedChildTagMismatch { expected, actual } => write!(
                formatter,
                "private function-component single-child handoff resolved {:?}, but complete-work produced {:?}",
                expected, actual
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootFunctionComponentSingleChildCompleteWorkHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::BeginWork(error) => Some(error),
            Self::CompleteWork(error) => Some(error),
            Self::MissingFunctionComponentChild { .. }
            | Self::ExpectedFunctionComponentChild { .. }
            | Self::UnexpectedFunctionComponentSibling { .. }
            | Self::CompletedChildTagMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootFunctionComponentSingleChildCompleteWorkHandoffError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<BeginWorkError> for HostRootFunctionComponentSingleChildCompleteWorkHandoffError {
    fn from(error: BeginWorkError) -> Self {
        Self::BeginWork(error)
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootFunctionComponentSingleChildCompleteWorkHandoffError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootFunctionComponentSingleChildHostMutationExecutionError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    HostWork(HostWorkError),
    StaleFinishedWorkEvidence {
        root: FiberRootId,
        expected_current: FiberId,
        actual_current: FiberId,
    },
    MismatchedRootOwnership {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
    },
    MismatchedFinishedWork {
        root: FiberRootId,
        expected_finished_work: FiberId,
        actual_finished_work: FiberId,
    },
    MismatchedRenderLanes {
        root: FiberRootId,
        expected_lanes: Lanes,
        actual_lanes: Lanes,
    },
    MismatchedFunctionComponent {
        expected_function_component: FiberId,
        actual_function_component: FiberId,
    },
    MismatchedChildElement {
        expected_child_element: RootElementHandle,
        actual_child_element: RootElementHandle,
    },
    RootFunctionComponentMismatch {
        root: FiberRootId,
        expected_function_component: FiberId,
        actual_root_child: Option<FiberId>,
    },
    FunctionComponentParentMismatch {
        root: FiberRootId,
        function_component: FiberId,
        expected_parent: FiberId,
        actual_parent: Option<FiberId>,
    },
    MissingFunctionComponentHostChild {
        root: FiberRootId,
        function_component: FiberId,
    },
    FunctionComponentHostChildMismatch {
        root: FiberRootId,
        function_component: FiberId,
        expected_child: FiberId,
        actual_child: Option<FiberId>,
    },
    UnexpectedFunctionComponentHostChildSibling {
        root: FiberRootId,
        function_component: FiberId,
        child: FiberId,
        sibling: FiberId,
    },
    CompletedChildMismatch {
        root: FiberRootId,
        expected_child: FiberId,
        actual_child: Option<FiberId>,
    },
    CompletedChildTagMismatch {
        root: FiberRootId,
        expected: FiberTag,
        actual: FiberTag,
    },
    MissingHostMutationMetadata {
        root: FiberRootId,
        finished_work: FiberId,
        mutation_apply_record_count: usize,
    },
    UnexpectedHostMutationRecord {
        root: FiberRootId,
        expected_child: FiberId,
        actual_child: FiberId,
        actual_kind: HostRootMutationApplyRecordKind,
    },
}

#[cfg(test)]
impl Display for HostRootFunctionComponentSingleChildHostMutationExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::HostWork(error) => Display::fmt(error, formatter),
            Self::StaleFinishedWorkEvidence {
                root,
                expected_current,
                actual_current,
            } => write!(
                formatter,
                "function-component host mutation execution rejected stale finished-work evidence for root {}: expected committed current {}, found {}",
                root.raw(),
                expected_current.slot().get(),
                actual_current.slot().get()
            ),
            Self::MismatchedRootOwnership {
                expected_root,
                actual_root,
            } => write!(
                formatter,
                "function-component host mutation execution root ownership mismatch: expected root {}, found root {}",
                expected_root.raw(),
                actual_root.raw()
            ),
            Self::MismatchedFinishedWork {
                root,
                expected_finished_work,
                actual_finished_work,
            } => write!(
                formatter,
                "function-component host mutation execution finished work mismatch for root {}: expected fiber {}, found {}",
                root.raw(),
                expected_finished_work.slot().get(),
                actual_finished_work.slot().get()
            ),
            Self::MismatchedRenderLanes {
                root,
                expected_lanes,
                actual_lanes,
            } => write!(
                formatter,
                "function-component host mutation execution lanes mismatch for root {}: expected {:?}, found {:?}",
                root.raw(),
                expected_lanes,
                actual_lanes
            ),
            Self::MismatchedFunctionComponent {
                expected_function_component,
                actual_function_component,
            } => write!(
                formatter,
                "function-component host mutation execution expected FunctionComponent {}, found {}",
                expected_function_component.slot().get(),
                actual_function_component.slot().get()
            ),
            Self::MismatchedChildElement {
                expected_child_element,
                actual_child_element,
            } => write!(
                formatter,
                "function-component host mutation execution child element mismatch: expected {}, found {}",
                expected_child_element.raw(),
                actual_child_element.raw()
            ),
            Self::RootFunctionComponentMismatch {
                root,
                expected_function_component,
                actual_root_child,
            } => write!(
                formatter,
                "function-component host mutation execution root {} expected FunctionComponent child {}, found {:?}",
                root.raw(),
                expected_function_component.slot().get(),
                actual_root_child.map(|fiber| fiber.slot().get())
            ),
            Self::FunctionComponentParentMismatch {
                root,
                function_component,
                expected_parent,
                actual_parent,
            } => write!(
                formatter,
                "function-component host mutation execution root {} FunctionComponent {} expected parent {}, found {:?}",
                root.raw(),
                function_component.slot().get(),
                expected_parent.slot().get(),
                actual_parent.map(|fiber| fiber.slot().get())
            ),
            Self::MissingFunctionComponentHostChild {
                root,
                function_component,
            } => write!(
                formatter,
                "function-component host mutation execution root {} FunctionComponent {} has no completed host child",
                root.raw(),
                function_component.slot().get()
            ),
            Self::FunctionComponentHostChildMismatch {
                root,
                function_component,
                expected_child,
                actual_child,
            } => write!(
                formatter,
                "function-component host mutation execution root {} FunctionComponent {} expected host child {}, found {:?}",
                root.raw(),
                function_component.slot().get(),
                expected_child.slot().get(),
                actual_child.map(|fiber| fiber.slot().get())
            ),
            Self::UnexpectedFunctionComponentHostChildSibling {
                root,
                function_component,
                child,
                sibling,
            } => write!(
                formatter,
                "function-component host mutation execution root {} FunctionComponent {} child {} has sibling {}; private canary admits exactly one host child",
                root.raw(),
                function_component.slot().get(),
                child.slot().get(),
                sibling.slot().get()
            ),
            Self::CompletedChildMismatch {
                root,
                expected_child,
                actual_child,
            } => write!(
                formatter,
                "function-component host mutation execution root {} expected completed host child {}, found {:?}",
                root.raw(),
                expected_child.slot().get(),
                actual_child.map(|fiber| fiber.slot().get())
            ),
            Self::CompletedChildTagMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "function-component host mutation execution root {} expected completed child tag {:?}, found {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::MissingHostMutationMetadata {
                root,
                finished_work,
                mutation_apply_record_count,
            } => write!(
                formatter,
                "function-component host mutation execution root {} finished work {} requires exactly one host mutation apply record, found {}",
                root.raw(),
                finished_work.slot().get(),
                mutation_apply_record_count
            ),
            Self::UnexpectedHostMutationRecord {
                root,
                expected_child,
                actual_child,
                actual_kind,
            } => write!(
                formatter,
                "function-component host mutation execution root {} expected append placement for child {}, found {:?} for child {}",
                root.raw(),
                expected_child.slot().get(),
                actual_kind,
                actual_child.slot().get()
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootFunctionComponentSingleChildHostMutationExecutionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::HostWork(error) => Some(error),
            Self::StaleFinishedWorkEvidence { .. }
            | Self::MismatchedRootOwnership { .. }
            | Self::MismatchedFinishedWork { .. }
            | Self::MismatchedRenderLanes { .. }
            | Self::MismatchedFunctionComponent { .. }
            | Self::MismatchedChildElement { .. }
            | Self::RootFunctionComponentMismatch { .. }
            | Self::FunctionComponentParentMismatch { .. }
            | Self::MissingFunctionComponentHostChild { .. }
            | Self::FunctionComponentHostChildMismatch { .. }
            | Self::UnexpectedFunctionComponentHostChildSibling { .. }
            | Self::CompletedChildMismatch { .. }
            | Self::CompletedChildTagMismatch { .. }
            | Self::MissingHostMutationMetadata { .. }
            | Self::UnexpectedHostMutationRecord { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<FiberRootStoreError> for HostRootFunctionComponentSingleChildHostMutationExecutionError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

#[cfg(test)]
impl From<FiberTopologyError> for HostRootFunctionComponentSingleChildHostMutationExecutionError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[cfg(test)]
impl From<HostWorkError> for HostRootFunctionComponentSingleChildHostMutationExecutionError {
    fn from(error: HostWorkError) -> Self {
        Self::HostWork(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootFunctionComponentUseStateHostChildCommitHandoffError {
    BeginWork(BeginWorkError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    FunctionComponentSingleChild(FunctionComponentSingleChildReconciliationError),
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    HostMutationExecution(HostRootFunctionComponentSingleChildHostMutationExecutionError),
    MissingFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    UnexpectedFunctionComponentSibling {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        function_component: FiberId,
        sibling: FiberId,
    },
    CompletedChildTagMismatch {
        expected: FiberTag,
        actual: Option<FiberTag>,
    },
}

#[cfg(test)]
impl Display for HostRootFunctionComponentUseStateHostChildCommitHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::BeginWork(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::FunctionComponentSingleChild(error) => Display::fmt(error, formatter),
            Self::FinishedWorkCommitHandoff(error) => Display::fmt(error, formatter),
            Self::HostMutationExecution(error) => Display::fmt(error, formatter),
            Self::MissingFunctionComponentChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no FunctionComponent child for private useState host-child commit handoff",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedFunctionComponentChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be FunctionComponent for private useState host-child commit handoff, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::UnexpectedFunctionComponentSibling {
                root,
                host_root_work_in_progress,
                function_component,
                sibling,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has FunctionComponent child {} with sibling {}; private useState host-child commit handoff admits only one function child",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                function_component.slot().get(),
                sibling.slot().get()
            ),
            Self::CompletedChildTagMismatch { expected, actual } => write!(
                formatter,
                "private useState host-child complete-work produced {:?}, expected {:?}",
                actual, expected
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootFunctionComponentUseStateHostChildCommitHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::BeginWork(error) => Some(error),
            Self::CompleteWork(error) => Some(error),
            Self::FunctionComponentSingleChild(error) => Some(error),
            Self::FinishedWorkCommitHandoff(error) => Some(error.as_ref()),
            Self::HostMutationExecution(error) => Some(error),
            Self::MissingFunctionComponentChild { .. }
            | Self::ExpectedFunctionComponentChild { .. }
            | Self::UnexpectedFunctionComponentSibling { .. }
            | Self::CompletedChildTagMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootFunctionComponentUseStateHostChildCommitHandoffError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<BeginWorkError> for HostRootFunctionComponentUseStateHostChildCommitHandoffError {
    fn from(error: BeginWorkError) -> Self {
        Self::BeginWork(error)
    }
}

#[cfg(test)]
impl From<FunctionComponentSingleChildReconciliationError>
    for HostRootFunctionComponentUseStateHostChildCommitHandoffError
{
    fn from(error: FunctionComponentSingleChildReconciliationError) -> Self {
        Self::FunctionComponentSingleChild(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootFunctionComponentUseStateHostChildCommitHandoffError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

#[cfg(test)]
impl From<HostRootFunctionComponentSingleChildHostMutationExecutionError>
    for HostRootFunctionComponentUseStateHostChildCommitHandoffError
{
    fn from(error: HostRootFunctionComponentSingleChildHostMutationExecutionError) -> Self {
        Self::HostMutationExecution(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootFunctionComponentUseReducerSingleChildCommitHandoffError {
    CompleteWork(HostRootCompleteWorkHandoffError),
    FunctionComponentRender(FunctionComponentRenderError),
    FunctionComponentSingleChild(FunctionComponentSingleChildReconciliationError),
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    HostMutationExecution(HostRootFunctionComponentSingleChildHostMutationExecutionError),
    MissingFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    UnexpectedFunctionComponentSibling {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        function_component: FiberId,
        sibling: FiberId,
    },
    CompletedChildTagMismatch {
        expected: FiberTag,
        actual: Option<FiberTag>,
    },
}

#[cfg(test)]
impl Display for HostRootFunctionComponentUseReducerSingleChildCommitHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::FunctionComponentRender(error) => Display::fmt(error, formatter),
            Self::FunctionComponentSingleChild(error) => Display::fmt(error, formatter),
            Self::FinishedWorkCommitHandoff(error) => Display::fmt(error, formatter),
            Self::HostMutationExecution(error) => Display::fmt(error, formatter),
            Self::MissingFunctionComponentChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no FunctionComponent child for private useReducer single-child commit handoff",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedFunctionComponentChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be FunctionComponent for private useReducer single-child commit handoff, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::UnexpectedFunctionComponentSibling {
                root,
                host_root_work_in_progress,
                function_component,
                sibling,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has FunctionComponent child {} with sibling {}; private useReducer single-child commit handoff admits only one function child",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                function_component.slot().get(),
                sibling.slot().get()
            ),
            Self::CompletedChildTagMismatch { expected, actual } => write!(
                formatter,
                "private useReducer complete-work produced {:?}, expected {:?}",
                actual, expected
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootFunctionComponentUseReducerSingleChildCommitHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::CompleteWork(error) => Some(error),
            Self::FunctionComponentRender(error) => Some(error),
            Self::FunctionComponentSingleChild(error) => Some(error),
            Self::FinishedWorkCommitHandoff(error) => Some(error.as_ref()),
            Self::HostMutationExecution(error) => Some(error),
            Self::MissingFunctionComponentChild { .. }
            | Self::ExpectedFunctionComponentChild { .. }
            | Self::UnexpectedFunctionComponentSibling { .. }
            | Self::CompletedChildTagMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootFunctionComponentUseReducerSingleChildCommitHandoffError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<FunctionComponentRenderError>
    for HostRootFunctionComponentUseReducerSingleChildCommitHandoffError
{
    fn from(error: FunctionComponentRenderError) -> Self {
        Self::FunctionComponentRender(error)
    }
}

#[cfg(test)]
impl From<FunctionComponentSingleChildReconciliationError>
    for HostRootFunctionComponentUseReducerSingleChildCommitHandoffError
{
    fn from(error: FunctionComponentSingleChildReconciliationError) -> Self {
        Self::FunctionComponentSingleChild(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootFunctionComponentUseReducerSingleChildCommitHandoffError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

#[cfg(test)]
impl From<HostRootFunctionComponentSingleChildHostMutationExecutionError>
    for HostRootFunctionComponentUseReducerSingleChildCommitHandoffError
{
    fn from(error: HostRootFunctionComponentSingleChildHostMutationExecutionError) -> Self {
        Self::HostMutationExecution(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError {
    CompleteWork(HostRootCompleteWorkHandoffError),
    FunctionComponentRender(FunctionComponentRenderError),
    FunctionComponentSingleChildUpdate(FunctionComponentSingleChildUpdateReconciliationError),
    HookEvidence(FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary),
    HostWork(HostWorkError),
    SingleHostUpdateApply(HostRootSingleHostUpdateApplyRecordErrorForCanary),
    HostUpdateExecution(TestHostRootHostUpdateExecutionErrorForCanary),
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    CommittedHostUpdateMismatch {
        expected: Box<HostRootSingleHostUpdateApplyRecordForCanary>,
        actual: Box<HostRootSingleHostUpdateApplyRecordForCanary>,
    },
    MissingFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    UnexpectedFunctionComponentSibling {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        function_component: FiberId,
        sibling: FiberId,
    },
}

#[cfg(test)]
impl Display for HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::FunctionComponentRender(error) => Display::fmt(error, formatter),
            Self::FunctionComponentSingleChildUpdate(error) => Display::fmt(error, formatter),
            Self::HookEvidence(error) => Display::fmt(error, formatter),
            Self::HostWork(error) => Display::fmt(error, formatter),
            Self::SingleHostUpdateApply(error) => Display::fmt(error, formatter),
            Self::HostUpdateExecution(error) => Display::fmt(error, formatter),
            Self::FinishedWorkCommitHandoff(error) => Display::fmt(error, formatter),
            Self::CommittedHostUpdateMismatch { expected, actual } => write!(
                formatter,
                "private useReducer single-host update handoff committed {:?} for fiber {}, expected {:?} for fiber {}",
                actual.kind(),
                actual.fiber().slot().get(),
                expected.kind(),
                expected.fiber().slot().get()
            ),
            Self::MissingFunctionComponentChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no FunctionComponent child for private useReducer single-host update commit handoff",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedFunctionComponentChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be FunctionComponent for private useReducer single-host update commit handoff, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::UnexpectedFunctionComponentSibling {
                root,
                host_root_work_in_progress,
                function_component,
                sibling,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has FunctionComponent child {} with sibling {}; private useReducer single-host update commit handoff admits only one function child",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                function_component.slot().get(),
                sibling.slot().get()
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::CompleteWork(error) => Some(error),
            Self::FunctionComponentRender(error) => Some(error),
            Self::FunctionComponentSingleChildUpdate(error) => Some(error),
            Self::HookEvidence(error) => Some(error),
            Self::HostWork(error) => Some(error),
            Self::SingleHostUpdateApply(error) => Some(error),
            Self::HostUpdateExecution(error) => Some(error),
            Self::FinishedWorkCommitHandoff(error) => Some(error.as_ref()),
            Self::CommittedHostUpdateMismatch { .. }
            | Self::MissingFunctionComponentChild { .. }
            | Self::ExpectedFunctionComponentChild { .. }
            | Self::UnexpectedFunctionComponentSibling { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<FunctionComponentRenderError>
    for HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError
{
    fn from(error: FunctionComponentRenderError) -> Self {
        Self::FunctionComponentRender(error)
    }
}

#[cfg(test)]
impl From<FunctionComponentSingleChildUpdateReconciliationError>
    for HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError
{
    fn from(error: FunctionComponentSingleChildUpdateReconciliationError) -> Self {
        Self::FunctionComponentSingleChildUpdate(error)
    }
}

#[cfg(test)]
impl From<FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary>
    for HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError
{
    fn from(error: FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary) -> Self {
        Self::HookEvidence(error)
    }
}

#[cfg(test)]
impl From<HostWorkError> for HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError {
    fn from(error: HostWorkError) -> Self {
        Self::HostWork(error)
    }
}

#[cfg(test)]
impl From<HostRootSingleHostUpdateApplyRecordErrorForCanary>
    for HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError
{
    fn from(error: HostRootSingleHostUpdateApplyRecordErrorForCanary) -> Self {
        Self::SingleHostUpdateApply(error)
    }
}

#[cfg(test)]
impl From<TestHostRootHostUpdateExecutionErrorForCanary>
    for HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError
{
    fn from(error: TestHostRootHostUpdateExecutionErrorForCanary) -> Self {
        Self::HostUpdateExecution(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

#[cfg(test)]
fn handoff_completed_function_component_single_child_to_test_complete_work(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    invoker: &mut impl FunctionComponentInvoker,
    resolver: &impl FunctionComponentSingleChildOutputResolver,
) -> Result<
    HostRootFunctionComponentSingleChildCompleteWorkHandoffRecord,
    HostRootFunctionComponentSingleChildCompleteWorkHandoffError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;
    let function_component = validated.child.ok_or(
        HostRootFunctionComponentSingleChildCompleteWorkHandoffError::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootFunctionComponentSingleChildCompleteWorkHandoffError::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::FunctionComponent {
        return Err(
            HostRootFunctionComponentSingleChildCompleteWorkHandoffError::ExpectedFunctionComponentChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child: function_component,
                tag: child_tag,
            },
        );
    }
    if let Some(sibling) = store
        .fiber_arena()
        .get(function_component)
        .map_err(HostRootChildBeginWorkPreflightError::from)?
        .sibling()
    {
        return Err(
            HostRootFunctionComponentSingleChildCompleteWorkHandoffError::UnexpectedFunctionComponentSibling {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                function_component,
                sibling,
            },
        );
    }
    let begin_work = begin_work_reconcile_function_component_single_child(
        store.fiber_arena_mut(),
        BeginWorkRequest::new(function_component, render.render_lanes()),
        invoker,
        resolver,
    )?;
    let child_element = begin_work.single_child().child_element();
    let child_tag = begin_work.single_child().child_tag();
    let host_work = mount_test_function_component_single_host_child_work(
        store,
        host,
        render,
        function_component,
        child_element,
        source,
    )
    .map_err(HostRootCompleteWorkHandoffError::from)?;
    let complete_work = host_root_complete_work_handoff_record_from_host_work(
        store,
        render,
        child_element,
        &host_work,
    )?;
    if complete_work.completed_child_tag() != Some(child_tag) {
        return Err(
            HostRootFunctionComponentSingleChildCompleteWorkHandoffError::CompletedChildTagMismatch {
                expected: child_tag,
                actual: complete_work.completed_child_tag(),
            },
        );
    }

    Ok(
        HostRootFunctionComponentSingleChildCompleteWorkHandoffRecord {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
            original_root_element: render.resulting_element(),
            function_component,
            begin_work,
            complete_work,
        },
    )
}

#[cfg(test)]
fn execute_function_component_single_child_host_mutation_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    function_component: FiberId,
    single_child: FunctionComponentSingleChildReconciliationRecord,
    complete_work: HostRootCompleteWorkHandoffRecord,
    commit: &HostRootCommitRecord,
    host_work: &mut HostWorkResult,
) -> Result<
    TestHostRootMutationApplyResult,
    HostRootFunctionComponentSingleChildHostMutationExecutionError,
> {
    validate_function_component_single_child_host_mutation_evidence(
        store,
        render,
        function_component,
        single_child,
        complete_work,
        commit,
        host_work,
    )?;

    let apply = apply_test_host_root_commit_mutations_for_canary(store, host, commit, host_work)?;
    if apply.root() != render.root() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedRootOwnership {
                expected_root: render.root(),
                actual_root: apply.root(),
            },
        );
    }
    if apply.finished_work() != render.work_in_progress() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedFinishedWork {
                root: render.root(),
                expected_finished_work: render.work_in_progress(),
                actual_finished_work: apply.finished_work(),
            },
        );
    }

    Ok(apply)
}

#[cfg(test)]
fn validate_function_component_single_child_host_mutation_evidence(
    store: &FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    function_component: FiberId,
    single_child: FunctionComponentSingleChildReconciliationRecord,
    complete_work: HostRootCompleteWorkHandoffRecord,
    commit: &HostRootCommitRecord,
    host_work: &HostWorkResult,
) -> Result<(), HostRootFunctionComponentSingleChildHostMutationExecutionError> {
    if single_child.function_component() != function_component {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedFunctionComponent {
                expected_function_component: function_component,
                actual_function_component: single_child.function_component(),
            },
        );
    }
    if complete_work.root() != render.root() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedRootOwnership {
                expected_root: render.root(),
                actual_root: complete_work.root(),
            },
        );
    }
    if host_work.root() != render.root() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedRootOwnership {
                expected_root: render.root(),
                actual_root: host_work.root(),
            },
        );
    }
    if commit.root() != render.root() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedRootOwnership {
                expected_root: render.root(),
                actual_root: commit.root(),
            },
        );
    }
    if complete_work.host_root_work_in_progress() != render.work_in_progress() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedFinishedWork {
                root: render.root(),
                expected_finished_work: render.work_in_progress(),
                actual_finished_work: complete_work.host_root_work_in_progress(),
            },
        );
    }
    if host_work.work_in_progress() != render.work_in_progress() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedFinishedWork {
                root: render.root(),
                expected_finished_work: render.work_in_progress(),
                actual_finished_work: host_work.work_in_progress(),
            },
        );
    }
    if commit.finished_work() != render.work_in_progress() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedFinishedWork {
                root: render.root(),
                expected_finished_work: render.work_in_progress(),
                actual_finished_work: commit.finished_work(),
            },
        );
    }
    if complete_work.render_lanes() != render.render_lanes()
        || single_child.render_lanes() != render.render_lanes()
    {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedRenderLanes {
                root: render.root(),
                expected_lanes: render.render_lanes(),
                actual_lanes: complete_work.render_lanes(),
            },
        );
    }
    if complete_work.resulting_element() != single_child.child_element() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedChildElement {
                expected_child_element: single_child.child_element(),
                actual_child_element: complete_work.resulting_element(),
            },
        );
    }

    let root_current = store.root(render.root())?.current();
    if root_current != commit.current() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::StaleFinishedWorkEvidence {
                root: render.root(),
                expected_current: commit.current(),
                actual_current: root_current,
            },
        );
    }

    let root_node = store.fiber_arena().get(render.work_in_progress())?;
    if root_node.child() != Some(function_component) {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::RootFunctionComponentMismatch {
                root: render.root(),
                expected_function_component: function_component,
                actual_root_child: root_node.child(),
            },
        );
    }

    if complete_work.root_child_count() != 1
        || complete_work.root_child() != Some(function_component)
        || host_work.root_child_count() != 1
        || host_work.root_child() != Some(function_component)
    {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::RootFunctionComponentMismatch {
                root: render.root(),
                expected_function_component: function_component,
                actual_root_child: complete_work.root_child().or(host_work.root_child()),
            },
        );
    }

    let completed_child = complete_work.completed_child().ok_or(
        HostRootFunctionComponentSingleChildHostMutationExecutionError::MissingFunctionComponentHostChild {
            root: render.root(),
            function_component,
        },
    )?;
    if complete_work.completed_child_count() != 1
        || host_work.completed_child_count() != 1
        || host_work.completed_child() != Some(completed_child)
    {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::CompletedChildMismatch {
                root: render.root(),
                expected_child: completed_child,
                actual_child: host_work.completed_child(),
            },
        );
    }

    let function_node = store.fiber_arena().get(function_component)?;
    if function_node.return_fiber() != Some(render.work_in_progress()) {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::FunctionComponentParentMismatch {
                root: render.root(),
                function_component,
                expected_parent: render.work_in_progress(),
                actual_parent: function_node.return_fiber(),
            },
        );
    }
    if function_node.child() != Some(completed_child) {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::FunctionComponentHostChildMismatch {
                root: render.root(),
                function_component,
                expected_child: completed_child,
                actual_child: function_node.child(),
            },
        );
    }
    if let Some(sibling) = function_node.sibling() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::RootFunctionComponentMismatch {
                root: render.root(),
                expected_function_component: function_component,
                actual_root_child: Some(sibling),
            },
        );
    }

    let child_node = store.fiber_arena().get(completed_child)?;
    if child_node.return_fiber() != Some(function_component) {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::FunctionComponentHostChildMismatch {
                root: render.root(),
                function_component,
                expected_child: completed_child,
                actual_child: child_node.return_fiber(),
            },
        );
    }
    if let Some(sibling) = child_node.sibling() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::UnexpectedFunctionComponentHostChildSibling {
                root: render.root(),
                function_component,
                child: completed_child,
                sibling,
            },
        );
    }
    if child_node.tag() != single_child.child_tag() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::CompletedChildTagMismatch {
                root: render.root(),
                expected: single_child.child_tag(),
                actual: child_node.tag(),
            },
        );
    }
    if complete_work.completed_child_tag() != Some(single_child.child_tag()) {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::CompletedChildTagMismatch {
                root: render.root(),
                expected: single_child.child_tag(),
                actual: complete_work
                    .completed_child_tag()
                    .unwrap_or_else(|| child_node.tag()),
            },
        );
    }

    let apply_records = commit.mutation_apply_log().records();
    let [mutation] = apply_records else {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MissingHostMutationMetadata {
                root: render.root(),
                finished_work: commit.finished_work(),
                mutation_apply_record_count: apply_records.len(),
            },
        );
    };
    if mutation.root() != render.root() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedRootOwnership {
                expected_root: render.root(),
                actual_root: mutation.root(),
            },
        );
    }
    if mutation.host_root() != render.work_in_progress() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedFinishedWork {
                root: render.root(),
                expected_finished_work: render.work_in_progress(),
                actual_finished_work: mutation.host_root(),
            },
        );
    }
    if mutation.tag() != single_child.child_tag() {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::CompletedChildTagMismatch {
                root: render.root(),
                expected: single_child.child_tag(),
                actual: mutation.tag(),
            },
        );
    }
    if mutation.kind() != HostRootMutationApplyRecordKind::AppendPlacementToContainer
        || mutation.fiber() != completed_child
    {
        return Err(
            HostRootFunctionComponentSingleChildHostMutationExecutionError::UnexpectedHostMutationRecord {
                root: render.root(),
                expected_child: completed_child,
                actual_child: mutation.fiber(),
                actual_kind: mutation.kind(),
            },
        );
    }

    Ok(())
}

#[cfg(test)]
#[allow(
    clippy::too_many_arguments,
    reason = "private useState handoff helper mirrors the canary render/commit evidence shape"
)]
fn handoff_completed_function_component_use_state_host_child_to_test_complete_work_and_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    hook_store: &mut FunctionComponentHookRenderStore,
    state_request: FunctionComponentUseStateRenderRequest,
    invoker: &mut impl FunctionComponentInvoker,
    resolver: &impl FunctionComponentSingleChildOutputResolver,
    reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
) -> Result<
    HostRootFunctionComponentUseStateHostChildCommitHandoffRecord,
    HostRootFunctionComponentUseStateHostChildCommitHandoffError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )
    .map_err(HostRootCompleteWorkHandoffError::from)?;
    let function_component = validated.child.ok_or(
        HostRootFunctionComponentUseStateHostChildCommitHandoffError::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootFunctionComponentUseStateHostChildCommitHandoffError::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::FunctionComponent {
        return Err(
            HostRootFunctionComponentUseStateHostChildCommitHandoffError::ExpectedFunctionComponentChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child: function_component,
                tag: child_tag,
            },
        );
    }
    if let Some(sibling) = store
        .fiber_arena()
        .get(function_component)
        .map_err(HostRootCompleteWorkHandoffError::from)?
        .sibling()
    {
        return Err(
            HostRootFunctionComponentUseStateHostChildCommitHandoffError::UnexpectedFunctionComponentSibling {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                function_component,
                sibling,
            },
        );
    }

    let use_state_begin_work = begin_work_with_use_state(
        store.fiber_arena_mut(),
        BeginWorkRequest::new(function_component, render.render_lanes()),
        hook_store,
        state_request,
        invoker,
        reducer,
    )?;
    let single_child = reconcile_function_component_single_child_output(
        store.fiber_arena_mut(),
        use_state_begin_work.render(),
        resolver,
    )?;

    let mut host_work = mount_test_function_component_single_host_child_work(
        store,
        host,
        render,
        function_component,
        single_child.child_element(),
        source,
    )
    .map_err(HostRootCompleteWorkHandoffError::from)?;
    let complete_work = host_root_complete_work_handoff_record_from_host_work(
        store,
        render,
        single_child.child_element(),
        &host_work,
    )?;
    if complete_work.completed_child_tag() != Some(single_child.child_tag()) {
        return Err(
            HostRootFunctionComponentUseStateHostChildCommitHandoffError::CompletedChildTagMismatch {
                expected: single_child.child_tag(),
                actual: complete_work.completed_child_tag(),
            },
        );
    }

    let host_operation_count_after_complete_work = host.operations().len();
    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            store, render, 1, 2,
        )?;
    let host_operation_count_after_commit = host.operations().len();
    let placement_apply_diagnostics = finished_work_handoff
        .commit()
        .host_root_placement_apply_diagnostics_for_canary();
    let complete_commit = HostRootCompleteWorkCommitHandoffRecord {
        complete_work,
        finished_work_handoff,
        placement_apply_diagnostics,
        host_operation_count_after_complete_work,
        host_operation_count_after_commit,
    };
    let host_mutation_apply = execute_function_component_single_child_host_mutation_for_canary(
        store,
        host,
        render,
        function_component,
        single_child,
        complete_work,
        complete_commit.commit(),
        &mut host_work,
    )?;
    let host_operation_count_after_host_mutation = host.operations().len();

    Ok(
        HostRootFunctionComponentUseStateHostChildCommitHandoffRecord {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
            original_root_element: render.resulting_element(),
            function_component,
            use_state_begin_work,
            single_child,
            complete_commit,
            host_mutation_apply,
            host_operation_count_after_host_mutation,
        },
    )
}

#[cfg(test)]
#[allow(
    clippy::too_many_arguments,
    reason = "private useReducer handoff helper mirrors the canary render/commit evidence shape"
)]
fn handoff_completed_function_component_use_reducer_single_child_to_test_complete_work_and_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    hook_store: &mut FunctionComponentHookRenderStore,
    reducer_request: FunctionComponentUseReducerRenderRequest,
    invoker: &mut impl FunctionComponentInvoker,
    resolver: &impl FunctionComponentSingleChildOutputResolver,
    reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
) -> Result<
    HostRootFunctionComponentUseReducerSingleChildCommitHandoffRecord,
    HostRootFunctionComponentUseReducerSingleChildCommitHandoffError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )
    .map_err(HostRootCompleteWorkHandoffError::from)?;
    let function_component = validated.child.ok_or(
        HostRootFunctionComponentUseReducerSingleChildCommitHandoffError::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootFunctionComponentUseReducerSingleChildCommitHandoffError::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::FunctionComponent {
        return Err(
            HostRootFunctionComponentUseReducerSingleChildCommitHandoffError::ExpectedFunctionComponentChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child: function_component,
                tag: child_tag,
            },
        );
    }
    if let Some(sibling) = store
        .fiber_arena()
        .get(function_component)
        .map_err(HostRootCompleteWorkHandoffError::from)?
        .sibling()
    {
        return Err(
            HostRootFunctionComponentUseReducerSingleChildCommitHandoffError::UnexpectedFunctionComponentSibling {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                function_component,
                sibling,
            },
        );
    }

    let use_reducer_render = render_function_component_with_use_reducer(
        store.fiber_arena_mut(),
        hook_store,
        function_component,
        render.render_lanes(),
        reducer_request,
        invoker,
        reducer,
    )?;
    let single_child = reconcile_function_component_single_child_output(
        store.fiber_arena_mut(),
        use_reducer_render.render(),
        resolver,
    )?;
    let expected_child_tag = single_child.child_tag();
    let mut host_work = mount_test_function_component_single_host_child_work(
        store,
        host,
        render,
        function_component,
        single_child.child_element(),
        source,
    )
    .map_err(HostRootCompleteWorkHandoffError::from)?;
    let complete_work = host_root_complete_work_handoff_record_from_host_work(
        store,
        render,
        single_child.child_element(),
        &host_work,
    )?;
    if complete_work.completed_child_tag() != Some(expected_child_tag) {
        return Err(
            HostRootFunctionComponentUseReducerSingleChildCommitHandoffError::CompletedChildTagMismatch {
                expected: expected_child_tag,
                actual: complete_work.completed_child_tag(),
            },
        );
    }

    let host_operation_count_after_complete_work = host.operations().len();
    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            store, render, 1, 2,
        )?;
    let host_operation_count_after_commit = host.operations().len();
    let placement_apply_diagnostics = finished_work_handoff
        .commit()
        .host_root_placement_apply_diagnostics_for_canary();
    let complete_commit = HostRootCompleteWorkCommitHandoffRecord {
        complete_work,
        finished_work_handoff,
        placement_apply_diagnostics,
        host_operation_count_after_complete_work,
        host_operation_count_after_commit,
    };
    let host_mutation_apply = execute_function_component_single_child_host_mutation_for_canary(
        store,
        host,
        render,
        function_component,
        single_child,
        complete_work,
        complete_commit.commit(),
        &mut host_work,
    )?;
    let host_operation_count_after_host_mutation = host.operations().len();

    Ok(
        HostRootFunctionComponentUseReducerSingleChildCommitHandoffRecord {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
            original_root_element: render.resulting_element(),
            function_component,
            use_reducer_render,
            single_child,
            complete_commit,
            host_mutation_apply,
            host_operation_count_after_host_mutation,
        },
    )
}

#[cfg(test)]
fn handoff_completed_function_component_use_reducer_single_host_update_to_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    detached_hosts: DetachedHostRecords,
    reducer_dispatch: FunctionComponentReducerDispatchRootRescheduleRecord,
    hook_store: &mut FunctionComponentHookRenderStore,
    reducer_request: FunctionComponentUseReducerRenderRequest,
    invoker: &mut impl FunctionComponentInvoker,
    resolver: &impl FunctionComponentSingleChildOutputResolver,
    reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
) -> Result<
    HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffRecord,
    HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )
    .map_err(HostRootCompleteWorkHandoffError::from)?;
    let function_component = validated.child.ok_or(
        HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::FunctionComponent {
        return Err(
            HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError::ExpectedFunctionComponentChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child: function_component,
                tag: child_tag,
            },
        );
    }
    if let Some(sibling) = store
        .fiber_arena()
        .get(function_component)
        .map_err(HostRootCompleteWorkHandoffError::from)?
        .sibling()
    {
        return Err(
            HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError::UnexpectedFunctionComponentSibling {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                function_component,
                sibling,
            },
        );
    }

    let use_reducer_render = render_function_component_with_use_reducer(
        store.fiber_arena_mut(),
        hook_store,
        function_component,
        render.render_lanes(),
        reducer_request,
        invoker,
        reducer,
    )?;
    let single_child_update = reconcile_function_component_single_child_update_output(
        store.fiber_arena_mut(),
        use_reducer_render.render(),
        resolver,
    )?;
    let hook_evidence = function_component_use_reducer_accepted_update_evidence_for_canary(
        &reducer_dispatch,
        use_reducer_render,
    )?;
    let mut host_work = complete_test_function_component_single_host_update_work_for_canary(
        store,
        render,
        single_child_update,
        source,
        detached_hosts,
    )?;
    let complete_work = host_root_complete_work_handoff_record_from_host_work(
        store,
        render,
        single_child_update.child_element(),
        &host_work,
    )?;

    let pending_host_update = record_host_root_single_host_update_apply_for_canary(store, render)?;
    {
        let root = store
            .root_mut(render.root())
            .map_err(HostRootCompleteWorkHandoffError::from)?;
        root.record_finished_work_for_canary(render.finished_work(), render.render_lanes());
    }
    let pending_commit =
        record_host_root_finished_work_pending_commit_for_canary(store, render, 1)?;
    let host_execution = apply_single_test_host_update_with_finished_work_handoff_for_canary(
        store,
        host,
        render,
        Some(pending_commit),
        2,
        &mut host_work,
    )?;
    if host_execution.pending_update() != pending_host_update {
        return Err(
            HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError::CommittedHostUpdateMismatch {
                expected: Box::new(pending_host_update),
                actual: Box::new(host_execution.pending_update()),
            },
        );
    }
    let finished_work_handoff = host_execution.finished_work_handoff().clone();
    let committed_host_update = host_execution.committed_update();
    if committed_host_update != pending_host_update {
        return Err(
            HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError::CommittedHostUpdateMismatch {
                expected: Box::new(pending_host_update),
                actual: Box::new(committed_host_update),
            },
        );
    }

    Ok(
        HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffRecord {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
            original_root_element: render.resulting_element(),
            function_component,
            hook_evidence,
            use_reducer_render,
            single_child_update,
            complete_work,
            pending_host_update,
            finished_work_handoff,
            committed_host_update,
            host_execution: host_execution.diagnostic().clone(),
        },
    )
}

#[cfg(test)]
#[derive(Debug)]
struct HostRootTestHostTreeFunctionOutputResolver<'a> {
    source: &'a TestHostTree,
}

#[cfg(test)]
impl HostRootTestHostTreeFunctionOutputResolver<'_> {
    const fn new(source: &TestHostTree) -> HostRootTestHostTreeFunctionOutputResolver<'_> {
        HostRootTestHostTreeFunctionOutputResolver { source }
    }
}

#[cfg(test)]
impl FunctionComponentSingleChildOutputResolver for HostRootTestHostTreeFunctionOutputResolver<'_> {
    fn resolve_function_component_single_child_output(
        &self,
        output: crate::function_component::FunctionComponentOutputHandle,
    ) -> Option<FunctionComponentSingleChildOutput> {
        let element = RootElementHandle::from_raw(output.raw());
        match self.source.root(element)? {
            TestHostNode::Element(host_element) => {
                Some(FunctionComponentSingleChildOutput::host_component(
                    output,
                    element,
                    host_element.element_type(),
                    host_element.props(),
                ))
            }
            TestHostNode::Text(text) => Some(FunctionComponentSingleChildOutput::host_text(
                output,
                element,
                text.props(),
            )),
        }
    }
}

#[cfg(test)]
#[allow(
    unused_imports,
    reason = "private context-provider handoff paths are preserved while the implementation lives in a child module"
)]
use context_provider::*;

#[cfg(test)]
mod tests;
